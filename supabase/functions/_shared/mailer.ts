export interface SendOtpEmailParams {
  to: string;
  code: string;
  studentName: string;
  campaignTitle: string;
}

export interface SendVoteReceiptParams {
  to: string;
  studentName: string;
  curso: string;
  auditHash: string;
  rankedTitles: string[];
  campaignTitle: string;
}

export interface SendOtpEmailResult {
  sent: boolean;
  provider: 'gas-gmail' | 'brevo' | 'resend' | 'dev-console';
  devOtpPreview?: string;
  error?: string;
}

interface DispatchEmailRequest {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
  campaignTitle: string;
  gasPayload: Record<string, unknown>;
  devLogMessage: string;
  devOtpPreview?: string;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildEmailHtml(params: SendOtpEmailParams): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:28px;border-radius:16px;border:1px solid #334155;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#38bdf8;">${escapeHtml(params.campaignTitle)}</p>
      <h2 style="margin:0 0 16px;font-size:22px;color:#ffffff;">Confirma tu entrada de cine</h2>
      <p style="margin:0 0 20px;color:#cbd5e1;line-height:1.5;">
        Hola <strong>${escapeHtml(params.studentName)}</strong>, introduce este código de 4 dígitos para confirmar tu voto preferencial:
      </p>
      <div style="background:#1e293b;border:1px solid #475669;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px;">
        <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#fbbf24;">${escapeHtml(params.code)}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        El código caduca en <strong>10 minutos</strong> y permite un máximo de <strong>3 intentos</strong>.
      </p>
    </div>
  `.trim();
}

function buildReceiptHtml(params: SendVoteReceiptParams): string {
  const listHtml = params.rankedTitles
    .map(
      (title, idx) =>
        `<li style="margin:4px 0;color:#e2e8f0;"><strong>${idx + 1}º</strong> ${escapeHtml(title)}</li>`
    )
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:28px;border-radius:16px;border:1px solid #334155;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#38bdf8;">${escapeHtml(params.campaignTitle)}</p>
      <h2 style="margin:0 0 12px;font-size:21px;color:#ffffff;">Confirmación oficial de voto emitido</h2>
      <p style="margin:0 0 16px;color:#cbd5e1;line-height:1.5;">
        Hola <strong>${escapeHtml(params.studentName)}</strong> (${escapeHtml(params.curso)}), tu voto preferencial ha quedado registrado correctamente en la urna digital.
      </p>
      <div style="background:#1e293b;border:1px solid #10b981;border-radius:12px;padding:16px;text-align:center;margin-bottom:18px;">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6ee7b7;">Código / Hash único para auditar tu voto</p>
        <span style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:2px;color:#fbbf24;">${escapeHtml(params.auditHash)}</span>
      </div>
      <div style="background:#0b1224;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;">Orden registrado:</p>
        <ol style="margin:0;padding-left:18px;font-size:13px;">${listHtml}</ol>
      </div>
      <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
        <strong>¿Por qué importa este código?</strong> En democracia, un sistema fiable permite que cada persona audite de forma anónima que su voto está en el recuento sin revelar su identidad pública en la lista general.
      </p>
    </div>
  `.trim();
}

/**
 * Envía un correo mediante el proveedor configurado en los secretos de Supabase.
 * Prioriza APIs dedicadas (Resend, Brevo) antes del relay opcional de Apps Script.
 */
async function dispatchEmail(
  req: DispatchEmailRequest
): Promise<SendOtpEmailResult> {
  const senderEmail = Deno.env.get('MAIL_FROM_EMAIL')?.trim();
  const senderName =
    Deno.env.get('MAIL_FROM_NAME')?.trim() || req.campaignTitle;
  const replyTo = Deno.env.get('MAIL_REPLY_TO')?.trim();

  // Opción 1 (Recomendada): Resend API con API key dedicada
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim();
  if (resendKey) {
    const resendFrom = senderEmail || 'onboarding@resend.dev';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${senderName} <${resendFrom}>`,
        to: [req.to],
        subject: req.subject,
        html: req.html,
        text: req.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        sent: false,
        provider: 'resend',
        error: `Resend falló (${res.status})${errText ? `: ${errText}` : '.'}`,
      };
    }

    return { sent: true, provider: 'resend' };
  }

  // Opción 2: Brevo API (300 emails/día)
  const brevoKey = Deno.env.get('BREVO_API_KEY')?.trim();
  if (brevoKey && senderEmail) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: req.to, name: req.toName }],
        subject: req.subject,
        htmlContent: req.html,
        textContent: req.text,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        sent: false,
        provider: 'brevo',
        error: `Brevo falló (${res.status})${errText ? `: ${errText}` : '.'}`,
      };
    }

    return { sent: true, provider: 'brevo' };
  }

  // Opción 3: Google Apps Script + Gmail / Google Workspace Edu
  const gasWebhookUrl = Deno.env.get('GAS_EMAIL_WEBHOOK_URL')?.trim();
  const gasSecret = Deno.env.get('GAS_WEBHOOK_SECRET')?.trim();
  if (gasWebhookUrl && gasSecret) {
    const res = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: gasSecret,
        ...req.gasPayload,
      }),
    });

    if (!res.ok) {
      return {
        sent: false,
        provider: 'gas-gmail',
        error: `Error del relay de Gmail (${res.status}).`,
      };
    }

    const data = await res.json().catch(() => ({ ok: false }));
    if (!data.ok) {
      return {
        sent: false,
        provider: 'gas-gmail',
        error: data.error || 'Google Apps Script rechazó el envío.',
      };
    }

    return { sent: true, provider: 'gas-gmail' };
  }

  // Opción 4: Modo desarrollo explícito (solo si OTP_DEV_MODE=true)
  if (Deno.env.get('OTP_DEV_MODE') === 'true') {
    console.warn(req.devLogMessage);
    return {
      sent: true,
      provider: 'dev-console',
      ...(req.devOtpPreview ? { devOtpPreview: req.devOtpPreview } : {}),
    };
  }

  return {
    sent: false,
    provider: 'dev-console',
    error:
      'No hay proveedor de correo configurado (RESEND_API_KEY, BREVO_API_KEY o GAS_EMAIL_WEBHOOK_URL).',
  };
}

export async function sendOtpEmail(
  params: SendOtpEmailParams
): Promise<SendOtpEmailResult> {
  return dispatchEmail({
    to: params.to,
    toName: params.studentName,
    subject: `Tu código de votación (${params.code}) · ${params.campaignTitle}`,
    html: buildEmailHtml(params),
    text: `Tu código de votación para ${params.campaignTitle} es: ${params.code}. Válido 10 minutos (máximo 3 intentos).`,
    campaignTitle: params.campaignTitle,
    gasPayload: {
      to: params.to,
      code: params.code,
      studentName: params.studentName,
      campaignTitle: params.campaignTitle,
    },
    devLogMessage: `[OTP_DEV_MODE] Código OTP para ${params.to}: ${params.code}`,
    devOtpPreview: params.code,
  });
}

export async function sendVoteReceiptEmail(
  params: SendVoteReceiptParams
): Promise<SendOtpEmailResult> {
  const plainOrder = params.rankedTitles
    .map((t, i) => `${i + 1}. ${t}`)
    .join('\n');

  const textContent =
    `Confirmación de voto · ${params.campaignTitle}\n` +
    `Código de auditoría: ${params.auditHash}\n` +
    `Curso: ${params.curso}\n\nOrden guardado:\n${plainOrder}\n\n` +
    `Puedes comprobar este hash en la sección "Estado de la votación" para auditar que tu voto figura en el escrutinio sin mostrar tu identidad pública.`;

  return dispatchEmail({
    to: params.to,
    toName: params.studentName,
    subject: `Comprobante de voto (${params.auditHash}) · ${params.campaignTitle}`,
    html: buildReceiptHtml(params),
    text: textContent,
    campaignTitle: params.campaignTitle,
    gasPayload: {
      type: 'vote_receipt',
      to: params.to,
      code: params.auditHash,
      auditHash: params.auditHash,
      curso: params.curso,
      rankedTitles: params.rankedTitles,
      studentName: params.studentName,
      campaignTitle: params.campaignTitle,
    },
    devLogMessage: `[OTP_DEV_MODE] Comprobante para ${params.to}: ${params.auditHash}`,
  });
}
