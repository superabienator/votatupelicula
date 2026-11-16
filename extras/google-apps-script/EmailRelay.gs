/**
 * VotaTuPelícula — Dispatcher gratuito de códigos OTP vía Gmail / Google Apps Script
 * Coste: 0 € (hasta 100 emails/día en Gmail personal o 1.500/día en Google Workspace Edu).
 *
 * INSTRUCCIONES:
 * 1. Ve a https://script.google.com y crea un proyecto nuevo llamado "VotaTuPelicula OTP".
 * 2. Pega este código completo.
 * 3. Ve a Configuración del proyecto (engranaje) -> Propiedades de secuencia de comandos:
 *    Añade la propiedad: RELAY_SECRET = <una clave secreta larga, la misma que pondrás en Supabase>
 * 4. Haz clic en Implementar -> Nueva implementación -> Tipo: "Aplicación web".
 *    - Ejecutar como: "Yo"
 *    - Quién tiene acceso: "Cualquier usuario" (protegido por RELAY_SECRET en el cuerpo JSON).
 * 5. Copia la URL /exec y guárdala en Supabase como secreto GAS_EMAIL_WEBHOOK_URL.
 */

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var expectedSecret = PropertiesService.getScriptProperties().getProperty('RELAY_SECRET');

    if (!expectedSecret || payload.secret !== expectedSecret) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var to = String(payload.to || '').trim();
    var code = String(payload.code || '').trim();
    var studentName = String(payload.studentName || 'Alumno/a').trim();
    var campaignTitle = String(payload.campaignTitle || 'CineFórum ESO').trim();

    if (!to || !code) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Missing recipient or code' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var subject = 'Tu código de votación (' + code + ') · ' + campaignTitle;
    var plainBody =
      'Hola ' + studentName + ',\n\n' +
      'Tu código de verificación de 4 dígitos para confirmar tu voto es:\n\n' +
      '    ' + code + '\n\n' +
      'Caduca en 10 minutos y dispones de un máximo de 3 intentos.\n' +
      'Si no has solicitado este código, ignora este mensaje.\n';

    var htmlBody =
      '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:28px;border-radius:16px;border:1px solid #334155;">' +
      '  <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#38bdf8;">' + escapeHtml(campaignTitle) + '</p>' +
      '  <h2 style="margin:0 0 16px;font-size:22px;color:#ffffff;">Confirma tu entrada de cine</h2>' +
      '  <p style="margin:0 0 20px;color:#cbd5e1;line-height:1.5;">Hola <strong>' + escapeHtml(studentName) + '</strong>, introduce este código de 4 dígitos para registrar tu voto preferencial:</p>' +
      '  <div style="background:#1e293b;border:1px solid #475569;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px;">' +
      '    <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#fbbf24;">' + escapeHtml(code) + '</span>' +
      '  </div>' +
      '  <p style="margin:0;font-size:13px;color:#94a3b8;">Válido durante <strong>10 minutos</strong> (máximo 3 intentos).</p>' +
      '</div>';

    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: campaignTitle
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
