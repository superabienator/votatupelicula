export interface SendOtpEmailParams {
  to: string;
  code: string;
  studentName: string;
  campaignTitle: string;
}

export interface SendOtpEmailResult {
  sent: boolean;
  provider: 'gas-gmail' | 'brevo' | 'resend' | 'dev-console';
  devOtpPreview?: string;
  error?: string;
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

export async function sendOtpEmail(
  params: SendOtpEmailParams
): Promise<SendOtpEmailResult> {
  const gasWebhookUrl = Deno.env.get('GAS_EMAIL_WEBHOOK_URL')?.trim();
  const gasSecret = Deno.env.get('GAS_WEBHOOK_SECRET')?.trim();

  // Opción 1 (0€ sin dominio propio): Google Apps Script + Gmail / Google Workspace Edu
  if (gasWebhookUrl && gasSecret) {
    const res = await fetch(gasWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: gasSecret,
        to: params.to,
        code: params.code,
        studentName: params.studentName,
        campaignTitle: params.campaignTitle,
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

  // Opción 2 (0€, 300 emails/día sin dominio propio obligatorio): Brevo API
  const brevoKey = Deno.env.get('BREVO_API_KEY')?.trim();
  const senderEmail = Deno.env.get('MAIL_FROM_EMAIL')?.trim();
  const senderName =
    Deno.env.get('MAIL_FROM_NAME')?.trim() || params.campaignTitle;

  if (brevoKey && senderEmail) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: params.to, name: params.studentName }],
        subject: `Tu código de votación (${params.code}) · ${params.campaignTitle}`,
        htmlContent: buildEmailHtml(params),
        textContent: `Tu código de votación para ${params.campaignTitle} es: ${params.code}. Válido 10 minutos.`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        sent: false,
        provider: 'brevo',
        error: `Brevo falló (${res.status}): ${errText}`,
      };
    }

    return { sent: true, provider: 'brevo' };
  }

  // Opción 3 (0€, 100 emails/día con dominio verificado): Resend API
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim();
  if (resendKey && senderEmail) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [params.to],
        subject: `Tu código de votación (${params.code}) · ${params.campaignTitle}`,
        html: buildEmailHtml(params),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        sent: false,
        provider: 'resend',
        error: `Resend falló (${res.status}): ${errText}`,
      };
    }

    return { sent: true, provider: 'resend' };
  }

  // Opción 4: Modo desarrollo explícito (solo si OTP_DEV_MODE=true)
  if (Deno.env.get('OTP_DEV_MODE') === 'true') {
    console.warn(`[OTP_DEV_MODE] Código OTP para ${params.to}: ${params.code}`);
    return {
      sent: true,
      provider: 'dev-console',
      devOtpPreview: params.code,
    };
  }

  return {
    sent: false,
    provider: 'dev-console',
    error:
      'No hay proveedor de correo configurado (GAS_EMAIL_WEBHOOK_URL, BREVO_API_KEY o RESEND_API_KEY).',
  };
}
