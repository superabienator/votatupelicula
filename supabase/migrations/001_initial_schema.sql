-- ============================================================================
-- VotaTuPelícula (CineAula) — Esquema Relacional PostgreSQL / Supabase
-- Arquitectura Zero-Cost con Voto Preferencial (Borda), Cartelera en 2 Fases
-- (draft/published) y Control Antifraude por OTP + Huella Única de Alumno.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Funciones inmutables de normalización y cálculo de huella
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sin_tildes(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT translate(
    input_text,
    'áàäâãåéèëêíìïîóòöôõúùüûñçýÿÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇÝŸ',
    'aaaaaaeeeeiiiiooooouuuuncyyAAAAAAEEEEIIIIOOOOOUUUUNCYY'
  );
$$;

CREATE OR REPLACE FUNCTION public.normalize_person_text(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT regexp_replace(
    btrim(lower(public.sin_tildes(input_text))),
    '\s+',
    ' ',
    'g'
  );
$$;

CREATE OR REPLACE FUNCTION public.normalize_email(input_email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT btrim(lower(input_email));
$$;

CREATE OR REPLACE FUNCTION public.compute_huella_alumno(
  p_nombre TEXT,
  p_apellidos TEXT,
  p_curso TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT public.normalize_person_text(p_nombre)
    || '_' || public.normalize_person_text(p_apellidos)
    || '_' || btrim(p_curso);
$$;

-- Trigger utilitario updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Tabla de películas (Fase 1: draft -> Fase 2: published)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) > 0),
  original_title TEXT,
  year SMALLINT CHECK (year IS NULL OR (year >= 1888 AND year <= 2100)),
  duration_minutes SMALLINT CHECK (duration_minutes IS NULL OR duration_minutes > 0),
  genres TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  age_rating TEXT NOT NULL DEFAULT 'TP',
  synopsis TEXT NOT NULL DEFAULT '',
  poster_url TEXT NOT NULL DEFAULT '',
  backdrop_url TEXT NOT NULL DEFAULT '',
  palette JSONB NOT NULL DEFAULT '{"primary":"#6366f1","secondary":"#ec4899","accent":"#f59e0b"}'::jsonb,
  tmdb_id INTEGER,
  source_provider TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_provider IN ('tmdb', 'omdb', 'gemini', 'manual')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movies_status_order
  ON public.movies (status, display_order, created_at);

DROP TRIGGER IF EXISTS trg_movies_updated_at ON public.movies;
CREATE TRIGGER trg_movies_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Tabla singleton de configuración de campaña y tematización
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.voting_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  campaign_title TEXT NOT NULL DEFAULT 'CineFórum ESO · Votación de Cartelera',
  subtitle TEXT NOT NULL DEFAULT 'Ordena tus películas favoritas. En este sistema todas tus preferencias cuentan.',
  top_k SMALLINT NOT NULL DEFAULT 3 CHECK (top_k IN (3, 5)),
  scoring_mode TEXT NOT NULL DEFAULT 'classic' CHECK (scoring_mode IN ('classic', 'fractional')),
  theme_mode TEXT NOT NULL DEFAULT 'blend' CHECK (theme_mode IN ('featured', 'blend')),
  featured_movie_id UUID NULL REFERENCES public.movies(id) ON DELETE SET NULL,
  allowed_classes JSONB NOT NULL DEFAULT '["1º ESO A","1º ESO B","2º ESO A","2º ESO B","3º ESO A","3º ESO B","4º ESO A","4º ESO B"]'::jsonb,
  allowed_email_domains TEXT[] NOT NULL DEFAULT '{}',
  voting_open BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_voting_settings_updated_at ON public.voting_settings;
CREATE TRIGGER trg_voting_settings_updated_at
  BEFORE UPDATE ON public.voting_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.voting_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Tokens de verificación OTP (4 dígitos, 10 min TTL, máx. 3 intentos)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  curso TEXT NOT NULL,
  huella_alumno TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  pending_movie_ids UUID[] NOT NULL CHECK (cardinality(pending_movie_ids) BETWEEN 3 AND 5),
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 3),
  expires_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_email_sent
  ON public.otp_tokens (email, last_sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_huella_sent
  ON public.otp_tokens (huella_alumno, last_sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires
  ON public.otp_tokens (expires_at);

-- ----------------------------------------------------------------------------
-- 5. Votos verificados y preferencias ordenadas (Recuento Borda)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL CHECK (char_length(btrim(nombre)) > 0),
  apellidos TEXT NOT NULL CHECK (char_length(btrim(apellidos)) > 0),
  curso TEXT NOT NULL CHECK (char_length(btrim(curso)) > 0),
  email TEXT NOT NULL CHECK (char_length(btrim(email)) > 3),
  huella_alumno TEXT GENERATED ALWAYS AS (
    public.compute_huella_alumno(nombre, apellidos, curso)
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT votes_email_unique UNIQUE (email),
  CONSTRAINT votes_huella_unique UNIQUE (huella_alumno)
);

CREATE INDEX IF NOT EXISTS idx_votes_curso ON public.votes (curso);

CREATE OR REPLACE FUNCTION public.normalize_vote_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email := public.normalize_email(NEW.email);
  NEW.nombre := public.normalize_person_text(NEW.nombre);
  NEW.apellidos := public.normalize_person_text(NEW.apellidos);
  NEW.curso := btrim(NEW.curso);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_votes_normalize ON public.votes;
CREATE TRIGGER trg_votes_normalize
  BEFORE INSERT OR UPDATE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_vote_fields();

CREATE TABLE IF NOT EXISTS public.vote_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE RESTRICT,
  rank_position SMALLINT NOT NULL CHECK (rank_position >= 1 AND rank_position <= 5),
  points NUMERIC(6,2) NOT NULL CHECK (points > 0),
  CONSTRAINT vote_choices_vote_rank_unique UNIQUE (vote_id, rank_position),
  CONSTRAINT vote_choices_vote_movie_unique UNIQUE (vote_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_vote_choices_movie ON public.vote_choices (movie_id, rank_position);
