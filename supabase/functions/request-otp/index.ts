import {
  generateFourDigitOtp,
  generateRandomSalt,
  getServiceSupabaseClient,
  hashOtpCode,
} from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { sendOtpEmail } from '../_shared/mailer.ts';
import { validateVoterIdentity } from '../_shared/normalize.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Método no permitido.' }, 405);
  }

  try {
    const body = await req.json();
    const { nombre, apellidos, curso, email, movie_ids } = body ?? {};

    const supabase = getServiceSupabaseClient();

    // Limpieza oportunista RGPD de tokens OTP caducados
    try {
      await supabase.rpc('purge_expired_otp_tokens');
    } catch {
      // No bloquear solicitud si la purga automática no aplica
    }

    // 1. Leer configuración vigente
    const { data: settings, error: settingsErr } = await supabase
      .from('voting_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsErr || !settings) {
      throw new Error('No se encontró la configuración de votación.');
    }

    if (!settings.voting_open) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'VOTING_CLOSED',
          error: 'La votación está cerrada en este momento.',
        },
        403
      );
    }

    // 2. Validar lista ordenada de películas
    if (!Array.isArray(movie_ids) || movie_ids.length !== settings.top_k) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'INVALID_BALLOT',
          error: `Debes ordenar exactamente ${settings.top_k} películas.`,
        },
        400
      );
    }

    const uniqueIds = new Set(movie_ids);
    if (
      uniqueIds.size !== settings.top_k ||
      !movie_ids.every((id) => typeof id === 'string' && UUID_REGEX.test(id))
    ) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'INVALID_BALLOT',
          error: 'La selección contiene películas duplicadas o identificadores no válidos.',
        },
        400
      );
    }

    const { data: publishedMovies, error: pubErr } = await supabase
      .from('movies')
      .select('id')
      .in('id', movie_ids)
      .eq('status', 'published');

    if (pubErr || !publishedMovies || publishedMovies.length !== settings.top_k) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'UNPUBLISHED_MOVIE',
          error: 'Alguna película seleccionada no está publicada en la cartelera actual.',
        },
        400
      );
    }

    // 3. Normalización y validación antifraude del alumnado
    const allowedClasses: string[] = Array.isArray(settings.allowed_classes)
      ? settings.allowed_classes.map(String)
      : [];
    const allowedDomains: string[] = Array.isArray(settings.allowed_email_domains)
      ? settings.allowed_email_domains.map(String)
      : [];

    const identity = validateVoterIdentity(
      { nombre, apellidos, curso, email },
      allowedClasses,
      allowedDomains
    );

    if (!identity.valid || !identity.normalized) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'VALIDATION_ERROR',
          error: identity.error || 'Datos de identificación no válidos.',
        },
        400
      );
    }

    const {
      nombre: normNombre,
      apellidos: normApellidos,
      curso: normCurso,
      email: normEmail,
      huellaAlumno,
    } = identity.normalized;

    // 4. Comprobar unicidad previa en `votes` (email y huella_alumno)
    const { data: existingEmailVote } = await supabase
      .from('votes')
      .select('id')
      .eq('email', normEmail)
      .maybeSingle();

    if (existingEmailVote) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'DUPLICATE_EMAIL',
          error: 'Ya existe un voto confirmado con este correo electrónico.',
        },
        409
      );
    }

    const { data: existingFingerprintVote } = await supabase
      .from('votes')
      .select('id')
      .eq('huella_alumno', huellaAlumno)
      .maybeSingle();

    if (existingFingerprintVote) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'DUPLICATE_STUDENT',
          error:
            'Este alumno o alumna ya ha votado en este curso (aunque intentes usar otro correo).',
        },
        409
      );
    }

    // 5. Rate limit de 60 segundos entre solicitudes de reenvío (por email o huella)
    const [{ data: recentByEmail }, { data: recentByHuella }] = await Promise.all([
      supabase
        .from('otp_tokens')
        .select('id, last_sent_at')
        .eq('email', normEmail)
        .is('used_at', null)
        .order('last_sent_at', { ascending: false })
        .limit(1),
      supabase
        .from('otp_tokens')
        .select('id, last_sent_at')
        .eq('huella_alumno', huellaAlumno)
        .is('used_at', null)
        .order('last_sent_at', { ascending: false })
        .limit(1),
    ]);

    const recentTokens = [...(recentByEmail ?? []), ...(recentByHuella ?? [])].sort(
      (a, b) =>
        new Date(b.last_sent_at).getTime() - new Date(a.last_sent_at).getTime()
    );

    if (recentTokens && recentTokens.length > 0) {
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(recentTokens[0].last_sent_at).getTime()) / 1000
      );
      if (elapsedSeconds < 60) {
        const retryAfter = 60 - elapsedSeconds;
        return jsonResponse(
          {
            ok: false,
            error_code: 'RATE_LIMITED',
            retry_after_seconds: retryAfter,
            error: `Debes esperar ${retryAfter} segundos antes de solicitar otro código.`,
          },
          429
        );
      }
    }

    // 6. Generar código OTP aleatorio de 4 dígitos (10 min de validez) y hashear
    const otpCode = generateFourDigitOtp();
    const salt = generateRandomSalt();
    const otpHash = await hashOtpCode(salt, otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: insertedToken, error: insertErr } = await supabase
      .from('otp_tokens')
      .insert({
        email: normEmail,
        nombre: normNombre,
        apellidos: normApellidos,
        curso: normCurso,
        huella_alumno: huellaAlumno,
        otp_hash: otpHash,
        otp_salt: salt,
        pending_movie_ids: movie_ids,
        attempts: 0,
        expires_at: expiresAt,
        last_sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr || !insertedToken) {
      throw insertErr || new Error('No se pudo generar el token OTP.');
    }

    // 7. Despachar el correo OTP
    const displayStudentName = `${String(nombre).replace(/[\r\n]+/g, ' ').trim()} ${String(apellidos).replace(/[\r\n]+/g, ' ').trim()}`.trim();
    const mailResult = await sendOtpEmail({
      to: normEmail,
      code: otpCode,
      studentName: displayStudentName,
      campaignTitle: settings.campaign_title,
    });

    if (!mailResult.sent) {
      // Limpiar token si falló el envío para no bloquear el cooldown de 60s
      await supabase.from('otp_tokens').delete().eq('id', insertedToken.id);
      return jsonResponse(
        {
          ok: false,
          error_code: 'MAIL_DISPATCH_FAILED',
          error:
            mailResult.error ||
            'No se pudo enviar el correo con el código de verificación.',
        },
        502
      );
    }

    return jsonResponse({
      ok: true,
      challenge_id: insertedToken.id,
      expires_in_seconds: 600,
      cooldown_seconds: 60,
      email: normEmail,
      provider: mailResult.provider,
      ...(mailResult.devOtpPreview ? { dev_otp_preview: mailResult.devOtpPreview } : {}),
    });
  } catch (err) {
    console.error('request-otp error:', err);
    return jsonResponse(
      { ok: false, error: 'Error interno al procesar la solicitud de verificación.' },
      500
    );
  }
});
