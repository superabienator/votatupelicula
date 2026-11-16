/**
 * VotaTuPelícula — Dispatcher gratuito de códigos OTP y comprobantes de voto vía Gmail / Google Apps Script
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
    var type = String(payload.type || 'otp').trim();
    var studentName = String(payload.studentName || 'Alumno/a').replace(/[\r\n]+/g, ' ').trim();
    var campaignTitle = String(payload.campaignTitle || 'CineFórum ESO').replace(/[\r\n]+/g, ' ').trim();

    if (!to || !code) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Missing recipient or code' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var subject;
    var plainBody;
    var htmlBody;

    if (type === 'vote_receipt') {
      var auditHash = String(payload.auditHash || code).trim();
      var curso = String(payload.curso || '').trim();
      var ranked = Array.isArray(payload.rankedTitles) ? payload.rankedTitles : [];
      var listText = ranked.map(function (t, i) { return (i + 1) + '. ' + String(t); }).join('\n');
      var listHtml = ranked.map(function (t, i) {
        return '<li style="margin:4px 0;color:#e2e8f0;"><strong>' + (i + 1) + 'º</strong> ' + escapeHtml(String(t)) + '</li>';
      }).join('');

      subject = 'Comprobante de voto (' + auditHash + ') · ' + campaignTitle;
      plainBody =
        'Hola ' + studentName + ',\n\n' +
        'Tu voto preferencial (' + curso + ') ha quedado registrado correctamente.\n\n' +
        'Código / Hash único para auditar tu voto:\n' +
        '    ' + auditHash + '\n\n' +
        (listText ? 'Tu orden guardado:\n' + listText + '\n\n' : '') +
        'Puedes introducir este código en "Estado de la votación" para comprobar de forma anónima que tu voto forma parte del escrutinio.\n';

      htmlBody =
        '<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:28px;border-radius:16px;border:1px solid #334155;">' +
        '  <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#38bdf8;">' + escapeHtml(campaignTitle) + '</p>' +
        '  <h2 style="margin:0 0 12px;font-size:21px;color:#ffffff;">Confirmación oficial de voto emitido</h2>' +
        '  <p style="margin:0 0 16px;color:#cbd5e1;line-height:1.5;">Hola <strong>' + escapeHtml(studentName) + '</strong> (' + escapeHtml(curso) + '), tu voto preferencial ha quedado validado en la urna.</p>' +
        '  <div style="background:#1e293b;border:1px solid #10b981;border-radius:12px;padding:16px;text-align:center;margin-bottom:16px;">' +
        '    <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6ee7b7;">Hash único para auditar tu voto</p>' +
        '    <span style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:2px;color:#fbbf24;">' + escapeHtml(auditHash) + '</span>' +
        '  </div>' +
        (listHtml ? '<div style="background:#0b1224;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:14px;"><ol style="margin:0;padding-left:18px;font-size:13px;">' + listHtml + '</ol></div>' : '') +
        '  <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;"><strong>¿Por qué es importante en democracia?</strong> Un sistema electoral auditable permite que cada persona compruebe con su código único que su papeleta se contabilizó sin alterar ni exponer su identidad en público.</p>' +
        '</div>';
    } else {
      subject = 'Tu código de votación (' + code + ') · ' + campaignTitle;
      plainBody =
        'Hola ' + studentName + ',\n\n' +
        'Tu código de verificación de 4 dígitos para confirmar tu voto es:\n\n' +
        '    ' + code + '\n\n' +
        'Caduca en 10 minutos y dispones de un máximo de 3 intentos.\n' +
        'Si no has solicitado este código, ignora este mensaje.\n';

      htmlBody =
        '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#f8fafc;padding:28px;border-radius:16px;border:1px solid #334155;">' +
        '  <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#38bdf8;">' + escapeHtml(campaignTitle) + '</p>' +
        '  <h2 style="margin:0 0 16px;font-size:22px;color:#ffffff;">Confirma tu entrada de cine</h2>' +
        '  <p style="margin:0 0 20px;color:#cbd5e1;line-height:1.5;">Hola <strong>' + escapeHtml(studentName) + '</strong>, introduce este código de 4 dígitos para registrar tu voto preferencial:</p>' +
        '  <div style="background:#1e293b;border:1px solid #475669;border-radius:12px;padding:18px;text-align:center;margin-bottom:20px;">' +
        '    <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#fbbf24;">' + escapeHtml(code) + '</span>' +
        '  </div>' +
        '  <p style="margin:0;font-size:13px;color:#94a3b8;">Válido durante <strong>10 minutos</strong> (máximo 3 intentos).</p>' +
        '</div>';
    }

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
      .createTextOutput(JSON.stringify({ ok: false, error: 'Error al despachar correo.' }))
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
