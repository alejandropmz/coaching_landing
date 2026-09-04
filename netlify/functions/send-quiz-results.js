const { Resend } = require('resend');

/**
 * Envía el resultado del quiz por email usando el SDK oficial de Resend.
 *
 * Variables de entorno:
 *   - RESEND_API_KEY:    API key de Resend (obligatoria).
 *   - RESEND_FROM_EMAIL: remitente verificado (opcional).
 *                        Por defecto: "Gabriela Gauna <onboarding@resend.dev>".
 *   - APP_URL / URL:     origen del sitio para el enlace de la CTA.
 */

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(payload),
  };
}

exports.handler = async (event) => {
  const httpMethod = event.httpMethod
    || (event.requestContext && event.requestContext.http && event.requestContext.http.method)
    || 'GET';

  if (httpMethod !== 'POST') {
    return json(405, { error: 'Método no permitido.' });
  }

  let payload;
  try {
    let rawBody = event.body || '';
    if (event.isBase64Encoded && rawBody) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
    }
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (err) {
    return json(400, { error: 'Cuerpo JSON inválido.' });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  if (!email) {
    return json(400, { error: 'El correo es obligatorio.' });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const archetype = typeof payload.archetype === 'object' && payload.archetype !== null
    ? (payload.archetype.title || payload.archetype.name || '')
    : (typeof payload.archetype === 'string' ? payload.archetype.trim() : '');
  const score = payload.score;

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    return json(500, { error: 'El servidor no está configurado para enviar correos (falta RESEND_API_KEY).' });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Gabriela Gauna <onboarding@resend.dev>';

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `Tu resultado del quiz: ${archetype || 'Tu arquetipo de liderazgo'}`,
      html: buildQuizEmailHtml({ name, archetype, score }),
    });

    if (error) {
      return json(500, { error: error.message || 'Error al enviar el correo.' });
    }

    return json(200, { success: true, data });
  } catch (err) {
    return json(500, { error: err.message || 'Error al enviar el correo.' });
  }
};

function buildQuizEmailHtml({ name, archetype, score }) {
  const title = escapeHtml(archetype || 'Tu arquetipo de liderazgo');
  const greeting = name
    ? `<p style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#1D1B19;">Hola, ${escapeHtml(name)},</p>`
    : '';
  const scoreDisplay = (score === undefined || score === null || score === '')
    ? '—'
    : `${escapeHtml(score)} pts`;
  const appUrl = (process.env.APP_URL || process.env.URL || '').replace(/\/+$/, '');
  const redirectUrl = appUrl ? `${appUrl}/index.html#agendar` : '#agendar';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#121212;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#121212;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FEF8F3;border:1px solid #333333;">

          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #E6DCCD;text-align:center;">
              <p style="margin:0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#775A19;">GABRIELA GAUNA &bull; EXECUTIVE MENTORSHIP &amp; ADVISORY</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 24px 32px;text-align:center;">
              ${greeting}
              <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C5A059;">TU ARQUETIPO DE LIDERAZGO DOMINANTE</p>
              <h1 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;color:#1D1B19;font-weight:normal;">${title}</h1>
              <div style="width:40px;height:2px;background-color:#C5A059;margin:0 auto;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td><h2 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1D1B19;font-weight:normal;">Desglose de Puntaje</h2></td>
                  <td align="right" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#775A19;">Resultado Cuantitativo</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #E6DCCD;background-color:#FFFFFF;border-radius:4px;">
                <tr>
                  <td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;color:#1D1B19;">Puntaje del Quiz</td>
                  <td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;text-align:right;font-weight:bold;color:#775A19;">${scoreDisplay}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px 32px;">
              <div style="background-color:#121212;color:#FEF8F3;padding:32px 24px;text-align:center;border-radius:4px;">
                <p style="margin:0 0 6px 0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C5A059;">MENTORÍA NIVEL ESTRATÉGICO</p>
                <h3 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#FEF8F3;font-weight:normal;">Estructura tu Salto Exponencial</h3>
                <p style="margin:0 0 20px 0;font-size:13px;line-height:1.5;color:#D4C5B9;max-width:420px;margin-left:auto;margin-right:auto;">Un perfil altamente visionario requiere blindaje operativo para materializar ideas de alto valor sin desgaste de capital. Agenda una sesión privada.</p>
                <a href="${redirectUrl}" style="display:inline-block;background-color:#C5A059;color:#121212;text-decoration:none;padding:12px 24px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;font-weight:bold;border-radius:2px;">AGENDAR SESIÓN ESTRATÉGICA PRIVADA &rarr;</a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color:#121212;color:#FEF8F3;padding:32px;text-align:center;">
              <p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#FEF8F3;">Gabriela Gauna</p>
              <p style="margin:0 0 16px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C5A059;">CEO &amp; Founder &bull; Consultoría Estratégica para CEOs y Directores</p>
              <div style="border-top:1px solid #333333;margin:20px 0;padding-top:20px;">
                <p style="margin:0;font-size:10px;color:#888888;letter-spacing:0.05em;">Has recibido este informe exclusivo tras haber completado satisfactoriamente la evaluación de liderazgo estratégico.</p>
                <p style="margin:10px 0 0 0;font-size:10px;color:#888888;">&copy; 2026 Gabriela Gauna Mentoring. Todos los derechos reservados.</p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

