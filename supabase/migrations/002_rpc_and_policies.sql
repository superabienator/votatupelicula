-- ============================================================================
-- VotaTuPelícula — Row Level Security (RLS) y Función Atómica de Voto
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Políticas RLS (Principio de mínimo privilegio + privacidad del menor)
-- ----------------------------------------------------------------------------

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_choices ENABLE ROW LEVEL SECURITY;

-- Películas: el público SOLO puede leer películas publicadas (nunca drafts)
DROP POLICY IF EXISTS "Public read published movies" ON public.movies;
CREATE POLICY "Public read published movies"
  ON public.movies
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Configuración pública: el público solo puede leer la configuración general
DROP POLICY IF EXISTS "Public read voting settings" ON public.voting_settings;
CREATE POLICY "Public read voting settings"
  ON public.voting_settings
  FOR SELECT
  TO anon, authenticated
  USING (id = 1);

-- otp_tokens, votes, vote_choices: SIN políticas para anon/authenticated.
-- Ningún cliente puede consultar datos personales (emails, nombres) ni tokens
-- directamente vía PostgREST. Todo acceso pasa por Edge Functions (service_role).

-- ----------------------------------------------------------------------------
-- 2. Cálculo determinista de puntuación Borda ponderada
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_borda_points(
  p_rank SMALLINT,
  p_top_k SMALLINT,
  p_scoring_mode TEXT
)
RETURNS NUMERIC(6,2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_rank < 1 OR p_rank > p_top_k THEN
    RAISE EXCEPTION 'Rango inválido % para TOP %', p_rank, p_top_k;
  END IF;

  IF p_scoring_mode = 'fractional' THEN
    RETURN CASE p_rank
      WHEN 1 THEN 1.00
      WHEN 2 THEN 0.50
      WHEN 3 THEN 0.25
      WHEN 4 THEN 0.15
      WHEN 5 THEN 0.10
      ELSE 0.00
    END;
  END IF;

  -- Modo clásico Borda: 3, 2, 1 (Top 3) o 5, 4, 3, 2, 1 (Top 5)
  RETURN (p_top_k - p_rank + 1)::NUMERIC(6,2);
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC atómica para verificar OTP y registrar el voto en una transacción
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_vote_with_otp(
  p_challenge_id UUID,
  p_submitted_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token public.otp_tokens%ROWTYPE;
  v_settings public.voting_settings%ROWTYPE;
  v_published_count INTEGER;
  v_vote_id UUID;
  v_idx SMALLINT;
  v_movie_id UUID;
  v_points NUMERIC(6,2);
  v_constraint TEXT;
BEGIN
  -- 1. Bloqueo de fila para evitar race conditions en intentos simultáneos
  SELECT *
  INTO v_token
  FROM public.otp_tokens
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'TOKEN_NOT_FOUND',
      'message', 'La solicitud de verificación no existe o ha sido eliminada.'
    );
  END IF;

  IF v_token.used_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'TOKEN_ALREADY_USED',
      'message', 'Este código de verificación ya fue utilizado.'
    );
  END IF;

  IF v_token.expires_at <= now() THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'TOKEN_EXPIRED',
      'message', 'El código ha caducado (validez de 10 minutos). Solicita uno nuevo.'
    );
  END IF;

  IF v_token.attempts >= 3 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'MAX_ATTEMPTS_EXCEEDED',
      'attempts_remaining', 0,
      'message', 'Has superado el máximo de 3 intentos. Solicita un código nuevo.'
    );
  END IF;

  -- 2. Comprobación del hash del OTP de 4 dígitos
  IF v_token.otp_hash <> p_submitted_hash THEN
    UPDATE public.otp_tokens
    SET attempts = attempts + 1
    WHERE id = p_challenge_id;

    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'INVALID_OTP',
      'attempts_remaining', GREATEST(0, 3 - (v_token.attempts + 1)),
      'message', CASE
        WHEN v_token.attempts + 1 >= 3 THEN 'Código incorrecto. Has agotado los 3 intentos; solicita un nuevo código.'
        ELSE format('Código incorrecto. Te quedan %s intento(s).', 3 - (v_token.attempts + 1))
      END
    );
  END IF;

  -- 3. Validación de estado de campaña y películas publicadas
  SELECT * INTO v_settings FROM public.voting_settings WHERE id = 1;

  IF NOT v_settings.voting_open THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'VOTING_CLOSED',
      'message', 'La votación ha sido cerrada por el profesorado.'
    );
  END IF;

  IF cardinality(v_token.pending_movie_ids) <> v_settings.top_k THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'INVALID_BALLOT_SIZE',
      'message', format('La configuración actual requiere seleccionar exactamente %s películas.', v_settings.top_k)
    );
  END IF;

  SELECT count(*)
  INTO v_published_count
  FROM public.movies
  WHERE id = ANY(v_token.pending_movie_ids)
    AND status = 'published';

  IF v_published_count <> v_settings.top_k THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error_code', 'UNPUBLISHED_MOVIE',
      'message', 'Alguna de las películas seleccionadas ya no está en la cartelera publicada.'
    );
  END IF;

  -- 4. Inserción protegida por restricciones UNIQUE (email y huella_alumno)
  BEGIN
    INSERT INTO public.votes (nombre, apellidos, curso, email)
    VALUES (v_token.nombre, v_token.apellidos, v_token.curso, v_token.email)
    RETURNING id INTO v_vote_id;
  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
      UPDATE public.otp_tokens SET used_at = now() WHERE id = p_challenge_id;

      IF v_constraint = 'votes_email_unique' THEN
        RETURN jsonb_build_object(
          'ok', false,
          'error_code', 'DUPLICATE_EMAIL',
          'message', 'Ya existe un voto registrado con este correo electrónico.'
        );
      ELSE
        RETURN jsonb_build_object(
          'ok', false,
          'error_code', 'DUPLICATE_STUDENT',
          'message', 'Este alumno o alumna ya ha emitido su voto en este curso.'
        );
      END IF;
  END;

  -- 5. Inserción de preferencias ordenadas con puntuación Borda
  FOR v_idx IN 1..cardinality(v_token.pending_movie_ids) LOOP
    v_movie_id := v_token.pending_movie_ids[v_idx];
    v_points := public.get_borda_points(v_idx, v_settings.top_k, v_settings.scoring_mode);

    INSERT INTO public.vote_choices (vote_id, movie_id, rank_position, points)
    VALUES (v_vote_id, v_movie_id, v_idx, v_points);
  END LOOP;

  -- 6. Marcar token como consumido
  UPDATE public.otp_tokens
  SET used_at = now()
  WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'ok', true,
    'vote_id', v_vote_id,
    'curso', v_token.curso,
    'created_at', now()
  );
END;
$$;

-- Revocar ejecución directa desde roles públicos: solo Edge Functions (service_role)
REVOKE ALL ON FUNCTION public.complete_vote_with_otp(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_vote_with_otp(UUID, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_vote_with_otp(UUID, TEXT) TO service_role;

-- Función opcional de limpieza de tokens expirados (> 24h)
CREATE OR REPLACE FUNCTION public.purge_expired_otp_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.otp_tokens
  WHERE expires_at < now() - interval '24 hours';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_otp_tokens() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purge_expired_otp_tokens() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_otp_tokens() TO service_role;

-- Función administrativa para vaciar la urna y reiniciar la votación a cero
-- (conserva la cartelera de películas y la configuración)
CREATE OR REPLACE FUNCTION public.reset_voting_ballot()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_votes INTEGER;
  v_deleted_tokens INTEGER;
BEGIN
  DELETE FROM public.vote_choices;
  DELETE FROM public.votes;
  GET DIAGNOSTICS v_deleted_votes = ROW_COUNT;
  DELETE FROM public.otp_tokens;
  GET DIAGNOSTICS v_deleted_tokens = ROW_COUNT;

  RETURN jsonb_build_object(
    'ok', true,
    'deleted_votes', v_deleted_votes,
    'deleted_tokens', v_deleted_tokens
  );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_voting_ballot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_voting_ballot() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_voting_ballot() TO service_role;
