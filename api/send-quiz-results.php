<?php

/**
 * Endpoint ligero para el envío del resultado del quiz por email.
 *
 * Recibe el email del usuario y el resultado detallado desde el frontend
 * y lo despacha a través de la API de Resend (https://resend.com).
 *
 * Configuración requerida (variables de entorno):
 *   - RESEND_API_KEY:    tu API key de Resend.
 *   - RESEND_FROM_EMAIL: remitente verificado, p. ej. "Gabriela Gauna <hola@tudominio.com>".
 *                        Por defecto: "Gabriela Gauna <onboarding@resend.dev>".
 */

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode((string)file_get_contents('php://input'), true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Cuerpo JSON inválido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$email = filter_var(trim((string)($payload['email'] ?? '')), FILTER_VALIDATE_EMAIL);
if ($email === false) {
    http_response_code(400);
    echo json_encode(['error' => 'El correo ingresado no es válido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = is_array($payload['result'] ?? null) ? $payload['result'] : [];
$archetype = is_array($result['archetype'] ?? null) ? $result['archetype'] : [];

if (empty($archetype['title'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No se pudo determinar el resultado del quiz.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$apiKey = trim($_ENV['RESEND_API_KEY']);
$fromEmail = trim((string)getenv('RESEND_FROM_EMAIL'));

if ($fromEmail === '') {
    $fromEmail = 'Gabriela Gauna <onboarding@resend.dev>';
}

if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'El servidor no está configurado para enviar correos (falta RESEND_API_KEY).'], JSON_UNESCAPED_UNICODE);
    exit;
}

$requestPayload = [
    'from' => $fromEmail,
    'to' => [$email],
    'subject' => 'Tu resultado del quiz: ' . $archetype['title'],
    'html' => buildQuizEmailHtml($result),
];

$sendResponse = sendResendEmail($apiKey, $requestPayload);

if (isset($sendResponse['error'])) {
    http_response_code($sendResponse['status']);
    echo json_encode(['error' => $sendResponse['error']], JSON_UNESCAPED_UNICODE);
    exit;
}

$statusCode = $sendResponse['status'];
$responseData = json_decode($sendResponse['body'], true);

if ($statusCode < 200 || $statusCode >= 300) {
    $message = isset($responseData['message']) && $responseData['message'] !== ''
        ? $responseData['message']
        : 'Error al enviar el correo.';
    http_response_code(502);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'success' => true,
    'id' => $responseData['id'] ?? null,
], JSON_UNESCAPED_UNICODE);

/**
 * Envía un email a través de la API de Resend.
 * Devuelve ['body' => string, 'status' => int] o ['error' => string, 'status' => int].
 */
function sendResendEmail(string $apiKey, array $payload): array
{
    $url = 'https://api.resend.com/emails';
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $json,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT => 20,
        ]);

        $body = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error !== '') {
            return ['error' => 'No fue posible conectar con el servicio de correo.', 'status' => 502];
        }

        return ['body' => (string)$body, 'status' => $status];
    }

    // Fallback para entornos sin ext-curl.
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Authorization: Bearer " . $apiKey . "\r\n" .
                "Content-Type: application/json\r\n",
            'content' => $json,
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    $status = 0;

    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $headerLine) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $headerLine, $matches)) {
                $status = (int)$matches[1];
                break;
            }
        }
    }

    if ($body === false) {
        return ['error' => 'No fue posible conectar con el servicio de correo.', 'status' => 502];
    }

    return ['body' => (string)$body, 'status' => $status];
}

/**
 * Genera un email HTML alineado con la marca (Gilded Noir) usando estilos inline,
 * ya que los clientes de correo no soportan Tailwind ni hojas externas.
 */
function buildQuizEmailHtml(array $result): string
{
    $redirect_url_link = $_ENV['APP_URL'] . "/index.html#agendar";
    
    $archetype = $result['archetype'] ?? [];
    $title = e($archetype['title'] ?? 'Tu arquetipo de liderazgo');
    $description = nl2br(e($archetype['description'] ?? ''));
    $cta = e($archetype['cta'] ?? '');

    $scoreRows = '';
    foreach (($result['scores'] ?? []) as $row) {
        $label = e($row['title'] ?? $row['key'] ?? '');
        $points = (int)($row['points'] ?? 0);
        $scoreRows .= '<tr>' .
            '<td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;color:#1D1B19;">' . $label . '</td>' .
            '<td style="padding:10px 14px;border-bottom:1px solid #E6DCCD;font-size:14px;text-align:right;font-weight:bold;color:#775A19;">' . $points . ' pts</td>' .
            '</tr>';
    }

    $answersHtml = '';
    $index = 1;
    foreach (($result['answers'] ?? []) as $answer) {
        $question = e($answer['question'] ?? '');
        $selected = e($answer['answer'] ?? '');
        $answersHtml .= '<div style="background-color:#FFFFFF;border:1px solid #E6DCCD;border-radius:6px;padding:16px;margin-bottom:12px;">' .
            '<p style="margin:0 0 6px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C5A059;font-weight:bold;">Pregunta ' . $index . '</p>' .
            '<p style="margin:0 0 10px 0;font-size:14px;line-height:1.5;color:#1D1B19;font-weight:600;">' . $question . '</p>' .
            '<p style="margin:0;font-size:13px;line-height:1.4;color:#4B4640;background-color:#FEF8F3;padding:10px;border-left:3px solid #C5A059;"><strong>Tu respuesta:</strong> ' . $selected . '</p>' .
            '</div>';
        $index++;
    }

    $totalQuestions = (int)($result['totalQuestions'] ?? 0);
    $totalPoints = (int)($result['totalPoints'] ?? 0);

    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' . $title . '</title></head>' .
        '<body style="margin:0;padding:0;background-color:#121212;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">' .
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#121212;"><tr><td align="center" style="padding:32px 16px;">' .

        // Contenedor principal con fondo crema Gilded Noir (#FEF8F3)
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#FEF8F3;border:1px solid #333333;">' .

        // --- 1. HEADER / ENCABEZADO ---
        '<tr><td style="padding:24px 32px;border-bottom:1px solid #E6DCCD;text-align:center;">' .
        '<p style="margin:0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#775A19;">GABRIELA GAUNA &bull; EXECUTIVE MENTORSHIP &amp; ADVISORY</p>' .
        '</td></tr>' .

        // --- 2. SECCIÓN ARQUETIPO DOMINANTE ---
        '<tr><td style="padding:36px 32px 24px 32px;text-align:center;">' .
        '<p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C5A059;">TU ARQUETIPO DE LIDERAZGO DOMINANTE</p>' .
        '<h1 style="margin:0 0 20px 0;font-family:Georgia,\'Times New Roman\',serif;font-size:32px;line-height:1.2;color:#1D1B19;font-weight:normal;">' . $title . '</h1>' .

        // Caja de Cita / Diagnóstico Ejecutivo
        '<div style="background-color:#F5EFE6;border:1px solid #E6DCCD;border-radius:4px;padding:20px;text-align:left;margin-top:16px;">' .
        '<p style="margin:0 0 14px 0;font-family:Georgia,\'Times New Roman\',serif;font-style:italic;font-size:15px;line-height:1.6;color:#1D1B19;">&ldquo;' . $description . '&rdquo;</p>' .
        ($cta !== '' ? '<p style="margin:0;font-size:13px;line-height:1.5;color:#775A19;font-weight:500;">' . $cta . '</p>' : '') .
        '</div>' .
        '</td></tr>' .

        // --- 3. DESGLOSE DE PUNTAJES ---
        '<tr><td style="padding:16px 32px 32px 32px;">' .
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>' .
        '<td><h2 style="margin:0 0 12px 0;font-family:Georgia,\'Times New Roman\',serif;font-size:18px;color:#1D1B19;font-weight:normal;">Desglose de Puntajes</h2></td>' .
        '<td align="right" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#775A19;">Distribución Cuantitativa</td>' .
        '</tr></table>' .
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid #E6DCCD;background-color:#FFFFFF;border-radius:4px;">' . $scoreRows . '</table>' .
        '</td></tr>' .

        // --- 4. BANNER OSCURO (CTA LLAMADO A LA ACCIÓN) ---
        '<tr><td style="padding:0 32px 32px 32px;">' .
        '<div style="background-color:#121212;color:#FEF8F3;padding:32px 24px;text-align:center;border-radius:4px;">' .
        '<p style="margin:0 0 6px 0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C5A059;">MENTORÍA NIVEL ESTRATÉGICO</p>' .
        '<h3 style="margin:0 0 12px 0;font-family:Georgia,\'Times New Roman\',serif;font-size:22px;color:#FEF8F3;font-weight:normal;">Estructura tu Salto Exponencial</h3>' .
        '<p style="margin:0 0 20px 0;font-size:13px;line-height:1.5;color:#D4C5B9;max-width:420px;margin-left:auto;margin-right:auto;">Un perfil altamente visionario requiere blindaje operativo para materializar ideas de alto valor sin desgaste de capital. Agenda una sesión privada.</p>' .
        '<a href="' . $redirect_url_link . '" style="display:inline-block;background-color:#C5A059;color:#121212;text-decoration:none;padding:12px 24px;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;font-weight:bold;border-radius:2px;">AGENDAR SESIÓN ESTRATÉGICA PRIVADA &rarr;</a>' .
        '</div>' .
        '</td></tr>' .

        // --- 5. RESPUESTAS DETALLADAS ---
        '<tr><td style="padding:0 32px 32px 32px;">' .
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>' .
        '<td><h2 style="margin:0 0 12px 0;font-family:Georgia,\'Times New Roman\',serif;font-size:18px;color:#1D1B19;font-weight:normal;">Tus Respuestas</h2></td>' .
        '<td align="right" style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#775A19;">Auditoría del Test</td>' .
        '</tr></table>' .
        $answersHtml .
        '<p style="margin:12px 0 0 0;font-size:12px;color:#775A19;text-align:center;">' . $totalQuestions . ' preguntas analizadas &bull; ' . $totalPoints . ' puntos en total.</p>' .
        '</td></tr>' .

        // --- 6. FOOTER INSTITUCIONAL ---
        '<tr><td style="background-color:#121212;color:#FEF8F3;padding:32px;text-align:center;">' .
        '<p style="margin:0 0 6px 0;font-family:Georgia,\'Times New Roman\',serif;font-size:16px;color:#FEF8F3;">Gabriela Gauna</p>' .
        '<p style="margin:0 0 16px 0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#C5A059;">CEO &amp; Founder &bull; Consultoría Estratégica para CEOs y Directores</p>' .
        '<div style="border-top:1px solid #333333;margin:20px 0;padding-top:20px;">' .
        '<p style="margin:0;font-size:10px;color:#888888;letter-spacing:0.05em;">Has recibido este informe exclusivo tras haber completado satisfactoriamente la evaluación de liderazgo estratégico.</p>' .
        '<p style="margin:10px 0 0 0;font-size:10px;color:#888888;">&copy; 2026 Gabriela Gauna Mentoring. Todos los derechos reservados.</p>' .
        '</div>' .
        '</td></tr>' .

        '</table></td></tr></table></body></html>';
}

function e($value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}
