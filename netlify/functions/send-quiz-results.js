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

  // Extraemos el objeto result que viene del payload
  const r = payload.result || {};
  
  // Extraemos las propiedades asegurándonos de extraer las cadenas de texto (strings) y no objetos enteros
  const name = payload.name || r.name || 'Participante';
  
  // Aquí está la clave: accedemos a .title dentro del objeto archetype
  const archetype = (typeof r.archetype === 'object' && r.archetype !== null) 
    ? (r.archetype.title || 'Líder Operativo') 
    : (r.title || r.name || 'Líder Operativo');

  // Extraemos el puntaje total que está en r.totalPoints
  const score = r.totalPoints !== undefined ? r.totalPoints : (r.score !== undefined ? r.score : 0);

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
      html: buildQuizEmailHtml(payload), // <-- AQUÍ PASAMOS EL PAYLOAD COMPLETO
    });

    if (error) {
      return json(500, { error: error.message || 'Error al enviar el correo.' });
    }

    return json(200, { success: true, data });
  } catch (err) {
    return json(500, { error: err.message || 'Error al enviar el correo.' });
  }
};

function buildQuizEmailHtml(payload) {
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const name = payload.name || payload.result?.name || '';
  const result = payload.result || {};
  
  const archetype = result.archetype || {};
  const title = escapeHtml(archetype.title || 'Tu arquetipo de liderazgo');
  const description = escapeHtml(archetype.description || '').replace(/\n/g, '<br>');
  const cta = escapeHtml(archetype.cta || '');

  const greeting = name
    ? `<p style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#1D1B19;">Hola, ${escapeHtml(name)},</p>`
    : '';

  // 1. Generar filas de puntajes por categoría (Scores)
  let scoreRows = '';
  const scoresArray = result.scores || [];
  if (scoresArray.length > 0) {
    scoresArray.forEach(row => {
      const label = escapeHtml(row.title || row.key || '');
      const points = parseInt(row.points || 0, 10);
      scoreRows += '<tr>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;color:#1D1B19;">' + label + '</td>' +
        '<td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;text-align:right;font-weight:bold;color:#775A19;">' + points + ' pts</td>' +
        '</tr>';
    });
  } else {
    // Fallback si viene un puntaje plano
    const singleScore = result.totalPoints !== undefined ? result.totalPoints : (payload.score || 0);
    scoreRows = '<tr>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;color:#1D1B19;">Puntaje del Quiz</td>' +
      '<td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;text-align:right;font-weight:bold;color:#775A19;">' + singleScore + ' pts</td>' +
      '</tr>';
  }

  // 2. Generar listado detallado de respuestas (Answers)
  let answersHtml = '';
  const answersArray = result.answers || [];
  let index = 1;
  answersArray.forEach(answer => {
    const question = escapeHtml(answer.question || '');
    const selected = escapeHtml(answer.answer || '');
    answersHtml += '<div style="background-color:#FFFFFF;border:1px solid #E6DCCD;border-radius:6px;padding:16px;margin-bottom:12px;">' +
      '<p style="margin:0 0 6px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C5A059;font-weight:bold;">Pregunta ' + index + '</p>' +
      '<p style="margin:0 0 10px 0;font-size:14px;line-height:1.5;color:#1D1B19;font-weight:600;">' + question + '</p>' +
      '<p style="margin:0;font-size:13px;line-height:1.4;color:#4B4640;background-color:#FEF8F3;padding:10px;border-left:3px solid #C5A059;"><strong>Tu respuesta:</strong> ' + selected + '</p>' +
      '</div>';
    index++;
  });

  const totalQuestions = parseInt(result.totalQuestions || answersArray.length || 0, 10);
  const totalPoints = parseInt(result.totalPoints || 0, 10);

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

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #E6DCCD;text-align:center;">
              <p style="margin:0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#775A19;">GABRIELA GAUNA &bull; EXECUTIVE MENTORSHIP &amp; ADVISORY</p>
            </td>
          </tr>

          <!-- ARQUETIPO DOMINANTE -->
          <tr>
            <td style="padding:36px 32px 24px 32px;text-align:center;">
              ${greeting}
              <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C5A059;">TU ARQUETIPO DE LIDERAZGO DOMINANTE</p>
              <h1 style="margin:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;color:#1D1B19;font-weight:normal;">${title}</h1>
              
              <div style="background-color:#F5EFE6;border:1px solid #E6DCCD;border-radius:4px;padding:20px;text-align:left;margin-top:16px;">
                <p style="margin:0 0 14px 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;line-height:1.6;color:#1D1B19;">&ldquo;${description}&rdquo;</p>
                ${cta ? `<p style="margin:0;font-size:13px;line-height:1.5;color:#775A19;font-weight:500;">${cta}</p>` : ''}
              </div>
            </td>
          </tr>

          <!-- DESGLOSE DE PUNTAJES -->
          <tr>
            <td style="padding:16px 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td><h2 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1D1B19;font-weight:normal;">Desglose de Puntajes</h2></td>
                  <td align="right" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#775A19;">Distribución Cuantitativa</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #E6DCCD;background-color:#FFFFFF;border-radius:4px;">
                ${scoreRows}
              </table>
            </td>
          </tr>

          <!-- BANNER OSCURO (CTA) -->
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

          <!-- RESPUESTAS DETALLADAS -->
          ${answersHtml ? `
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td><h2 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#1D1B19;font-weight:normal;">Tus Respuestas</h2></td>
                  <td align="right" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#775A19;">Auditoría del Test</td>
                </tr>
              </table>
              ${answersHtml}
              <p style="margin:12px 0 0 0;font-size:12px;color:#775A19;text-align:center;">${totalQuestions} preguntas analizadas &bull; ${totalPoints} puntos en total.</p>
            </td>
          </tr>` : ''}

          <!-- FOOTER -->
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

