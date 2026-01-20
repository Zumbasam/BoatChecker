<?php
/**
 * BoatChecker - Send Request to Workshop API
 * 
 * Mottar inspeksjonsrapport og sender til valgte verksteder
 */

// CORS headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Kun POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

// Last config
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'config_missing']);
    exit;
}
require_once $configFile;

// Les request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_json']);
    exit;
}

// Valider påkrevde felter
$userInfo = $data['userInfo'] ?? null;
$selectedVendorIds = $data['selectedVendorIds'] ?? [];
$newVendors = $data['newVendors'] ?? [];
$pdfBase64 = $data['pdfBase64'] ?? null;
$submittedInRegion = $data['submittedInRegion'] ?? '';

if (!$userInfo || !$userInfo['name'] || !$userInfo['email']) {
    http_response_code(400);
    echo json_encode(['error' => 'missing_user_info']);
    exit;
}

if (empty($selectedVendorIds) && empty($newVendors)) {
    http_response_code(400);
    echo json_encode(['error' => 'no_vendors_selected']);
    exit;
}

// Last verkstedliste
$vendorsFile = __DIR__ . '/vendors.json';
$vendors = [];
if (file_exists($vendorsFile)) {
    $vendorsJson = file_get_contents($vendorsFile);
    $vendors = json_decode($vendorsJson, true) ?? [];
}

// Samle e-postadresser
$recipientEmails = [];

// Fra valgte verksteder
foreach ($selectedVendorIds as $vendorId) {
    foreach ($vendors as $vendor) {
        if ($vendor['id'] == $vendorId && !empty($vendor['email'])) {
            $recipientEmails[] = [
                'email' => $vendor['email'],
                'name' => $vendor['name']
            ];
            break;
        }
    }
}

// Fra manuelt lagt til verksteder
foreach ($newVendors as $newVendor) {
    if (!empty($newVendor['email'])) {
        $recipientEmails[] = [
            'email' => $newVendor['email'],
            'name' => $newVendor['name'] ?? 'Verksted'
        ];
    }
}

if (empty($recipientEmails)) {
    http_response_code(400);
    echo json_encode(['error' => 'no_valid_emails']);
    exit;
}

// Forbered e-post
$senderName = htmlspecialchars($userInfo['name']);
$senderEmail = filter_var($userInfo['email'], FILTER_VALIDATE_EMAIL);
$senderPhone = htmlspecialchars($userInfo['phone'] ?? '');
$userMessage = htmlspecialchars($userInfo['message'] ?? '');

if (!$senderEmail) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_email']);
    exit;
}

// E-post innhold - encode subject for UTF-8 support
$subjectText = "Anbudsforespørsel via BoatChecker fra {$senderName}";
$subject = "=?UTF-8?B?" . base64_encode($subjectText) . "?=";

$htmlBody = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2B6CB0; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .info-box { background: #F7FAFC; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #4A5568; }
        .footer { padding: 20px; font-size: 12px; color: #718096; border-top: 1px solid #E2E8F0; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>Anbudsforespørsel via BoatChecker</h1>
    </div>
    <div class='content'>
        <p>Hei,</p>
        <p>Du har mottatt en anbudsforespørsel via BoatChecker-appen.</p>
        
        <div class='info-box'>
            <p><span class='label'>Fra:</span> {$senderName}</p>
            <p><span class='label'>E-post:</span> {$senderEmail}</p>
            " . ($senderPhone ? "<p><span class='label'>Telefon:</span> {$senderPhone}</p>" : "") . "
        </div>
        
        " . ($userMessage ? "<div class='info-box'><p><span class='label'>Melding:</span></p><p>{$userMessage}</p></div>" : "") . "
        
        <p>En inspeksjonsrapport er vedlagt som PDF. Vennligst gjennomgå rapporten og returner et uforpliktende prisoverslag til avsender.</p>
        
        <p>Med vennlig hilsen,<br>BoatChecker</p>
    </div>
    <div class='footer'>
        <p>Denne e-posten er sendt via BoatChecker-appen. BoatChecker er kun en formidler og er ikke ansvarlig for innholdet i rapporten eller eventuelle avtaler mellom partene.</p>
    </div>
</body>
</html>
";

// Grense for multipart
$boundary = md5(time());

// Dekod PDF
$pdfData = null;
if ($pdfBase64) {
    // Fjern data URL prefix hvis det finnes
    if (strpos($pdfBase64, 'data:') === 0) {
        $pdfBase64 = preg_replace('/^data:[^;]+;base64,/', '', $pdfBase64);
    }
    $pdfData = base64_decode($pdfBase64);
}

// Send til hver mottaker
$successCount = 0;
$errors = [];

foreach ($recipientEmails as $recipient) {
    $to = $recipient['email'];
    
    // Headers for multipart email med vedlegg
    $headers = [
        "From: BoatChecker <noreply@boatchecker.no>",
        "Reply-To: {$senderName} <{$senderEmail}>",
        "MIME-Version: 1.0",
        "Content-Type: multipart/mixed; boundary=\"{$boundary}\""
    ];
    
    // Bygg e-post body med vedlegg
    $body = "";
    
    // HTML del
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: text/html; charset=utf-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $htmlBody . "\r\n\r\n";
    
    // PDF vedlegg
    if ($pdfData) {
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Type: application/pdf; name=\"boatchecker-rapport.pdf\"\r\n";
        $body .= "Content-Transfer-Encoding: base64\r\n";
        $body .= "Content-Disposition: attachment; filename=\"boatchecker-rapport.pdf\"\r\n\r\n";
        $body .= chunk_split(base64_encode($pdfData)) . "\r\n";
    }
    
    $body .= "--{$boundary}--";
    
    // Send e-post
    $sent = mail($to, $subject, $body, implode("\r\n", $headers));
    
    if ($sent) {
        $successCount++;
    } else {
        $errors[] = $recipient['email'];
    }
}

// Logg forespørselen (valgfritt - for statistikk)
try {
    if (defined('DB_HOST') && defined('DB_NAME')) {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
        
        $stmt = $pdo->prepare("
            INSERT INTO workshop_requests (sender_email, region_code, vendor_count, created_at)
            VALUES (:sender_email, :region_code, :vendor_count, NOW())
        ");
        $stmt->execute([
            ':sender_email' => $senderEmail,
            ':region_code' => $submittedInRegion,
            ':vendor_count' => count($recipientEmails)
        ]);
    }
} catch (Exception $e) {
    // Ignorer loggingfeil - ikke kritisk
}

// Returner resultat
if ($successCount > 0) {
    echo json_encode([
        'success' => true,
        'sent_count' => $successCount,
        'total_recipients' => count($recipientEmails)
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'send_failed',
        'details' => $errors
    ]);
}
