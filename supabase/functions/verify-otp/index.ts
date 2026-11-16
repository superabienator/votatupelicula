import { getServiceSupabaseClient, hashOtpCode } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

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
    const challengeId = String(body?.challenge_id || '').trim();
    const code = String(body?.code || '').trim();

    if (!UUID_REGEX.test(challengeId)) {
      return jsonResponse(
        { ok: false, error_code: 'INVALID_CHALLENGE', error: 'Identificador de desafío inválido.' },
        400
      );
    }

    if (!/^\d{4}$/.test(code)) {
      return jsonResponse(
        { ok: false, error_code: 'INVALID_CODE_FORMAT', error: 'El código debe tener 4 dígitos numéricos.' },
        400
      );
    }

    const supabase = getServiceSupabaseClient();

    const { data: tokenMeta, error: fetchErr } = await supabase
      .from('otp_tokens')
      .select('id, otp_salt')
      .eq('id', challengeId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!tokenMeta) {
      return jsonResponse(
        {
          ok: false,
          error_code: 'TOKEN_NOT_FOUND',
          error: 'La solicitud de verificación no existe o ha caducado.',
        },
        404
      );
    }

    const submittedHash = await hashOtpCode(tokenMeta.otp_salt, code);

    const { data: rpcResult, error: rpcErr } = await supabase.rpc(
      'complete_vote_with_otp',
      {
        p_challenge_id: challengeId,
        p_submitted_hash: submittedHash,
      }
    );

    if (rpcErr) throw rpcErr;

    if (!rpcResult?.ok) {
      const codeMap: Record<string, number> = {
        INVALID_OTP: 400,
        MAX_ATTEMPTS_EXCEEDED: 429,
        TOKEN_EXPIRED: 410,
        TOKEN_ALREADY_USED: 410,
        DUPLICATE_EMAIL: 409,
        DUPLICATE_STUDENT: 409,
        VOTING_CLOSED: 403,
      };
      const status = codeMap[rpcResult?.error_code] || 400;
      return jsonResponse(
        {
          ok: false,
          error_code: rpcResult?.error_code || 'VERIFY_FAILED',
          attempts_remaining: rpcResult?.attempts_remaining,
          error: rpcResult?.message || 'No se pudo verificar el código.',
        },
        status
      );
    }

    return jsonResponse({
      ok: true,
      vote_id: rpcResult.vote_id,
      curso: rpcResult.curso,
      created_at: rpcResult.created_at,
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return jsonResponse(
      { ok: false, error: 'Error interno al validar el código OTP.' },
      500
    );
  }
});
