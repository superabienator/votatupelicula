import { computeVoteAuditHash } from '../_shared/auditHash.ts';
import { getServiceSupabaseClient, hashOtpCode } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { sendVoteReceiptEmail } from '../_shared/mailer.ts';

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
    const action = String(body?.action || 'verify').trim();
    const challengeId = String(body?.challenge_id || '').trim();

    if (action === 'send_receipt') {
      const voteId = String(body?.vote_id || '').trim();
      if (!UUID_REGEX.test(challengeId) || !UUID_REGEX.test(voteId)) {
        return jsonResponse(
          { ok: false, error_code: 'INVALID_REQUEST', error: 'Identificadores inválidos.' },
          400
        );
      }

      const supabase = getServiceSupabaseClient();
      const [{ data: tokenRow }, { data: voteRow }, { data: settings }] = await Promise.all([
        supabase
          .from('otp_tokens')
          .select('id, email, nombre, apellidos, pending_movie_ids, used_at')
          .eq('id', challengeId)
          .maybeSingle(),
        supabase
          .from('votes')
          .select('id, email, nombre, apellidos, curso')
          .eq('id', voteId)
          .maybeSingle(),
        supabase.from('voting_settings').select('campaign_title').eq('id', 1).single(),
      ]);

      if (!tokenRow || !tokenRow.used_at || !voteRow || tokenRow.email !== voteRow.email) {
        return jsonResponse(
          {
            ok: false,
            error_code: 'RECEIPT_NOT_AUTHORIZED',
            error: 'No se pudo verificar el comprobante para este voto.',
          },
          403
        );
      }

      const movieIds = Array.isArray(tokenRow.pending_movie_ids)
        ? tokenRow.pending_movie_ids.map(String)
        : [];
      const { data: moviesList } = await supabase
        .from('movies')
        .select('id, title')
        .in('id', movieIds.length > 0 ? movieIds : ['00000000-0000-0000-0000-000000000000']);
      const titleMap = new Map((moviesList ?? []).map((m) => [m.id, m.title]));
      const rankedTitles = movieIds.map((id) => titleMap.get(id) ?? 'Película');
      const auditHash = computeVoteAuditHash(voteRow.id, voteRow.curso);
      const studentName = `${voteRow.nombre} ${voteRow.apellidos}`.trim();

      const mailRes = await sendVoteReceiptEmail({
        to: voteRow.email,
        studentName,
        curso: voteRow.curso,
        auditHash,
        rankedTitles,
        campaignTitle: settings?.campaign_title || 'VotaTuPelícula',
      });

      if (!mailRes.sent) {
        return jsonResponse(
          {
            ok: false,
            error_code: 'MAIL_DISPATCH_FAILED',
            error: mailRes.error || 'No se pudo enviar el correo de confirmación.',
          },
          502
        );
      }

      return jsonResponse({
        ok: true,
        sent: true,
        email: voteRow.email,
        audit_hash: auditHash,
        provider: mailRes.provider,
      });
    }

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
      audit_hash: computeVoteAuditHash(rpcResult.vote_id, rpcResult.curso),
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return jsonResponse(
      { ok: false, error: 'Error interno al validar el código OTP.' },
      500
    );
  }
});
