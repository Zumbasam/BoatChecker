<?php
/**
 * BoatChecker API
 * Anonym innsamling av inspeksjonsfunn
 * 
 * Endpoints:
 *   POST /api/findings      - Send inn anonyme funn
 *   GET  /api/stats/{model} - Hent statistikk for båtmodell
 *   GET  /api/health        - Helsesjekk
 */

// Inkluder konfigurasjon
require_once __DIR__ . '/config.php';

// Feilhåndtering
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// CORS-håndtering
function handleCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, CORS_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
    header('Access-Control-Max-Age: 86400');
    
    // Håndter preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// JSON-respons helper
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Feilrespons helper
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => true, 'message' => $message], $statusCode);
}

// Database-tilkobling
function getDB() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                errorResponse('Database error: ' . $e->getMessage(), 500);
            } else {
                errorResponse('Database connection failed', 500);
            }
        }
    }
    
    return $pdo;
}

// Valider API-nøkkel
function validateApiKey() {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    
    if (empty($apiKey)) {
        errorResponse('Missing API key', 401);
    }
    
    if ($apiKey !== API_KEY) {
        errorResponse('Invalid API key', 401);
    }
    
    return true;
}

// Enkel rate limiting (basert på IP)
function checkRateLimit() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $cacheFile = sys_get_temp_dir() . '/boatchecker_rate_' . md5($ip);
    
    $requests = [];
    if (file_exists($cacheFile)) {
        $requests = json_decode(file_get_contents($cacheFile), true) ?? [];
    }
    
    // Fjern gamle requests (eldre enn 1 minutt)
    $now = time();
    $requests = array_filter($requests, fn($t) => $t > ($now - 60));
    
    if (count($requests) >= RATE_LIMIT) {
        errorResponse('Rate limit exceeded', 429);
    }
    
    $requests[] = $now;
    file_put_contents($cacheFile, json_encode($requests));
}

// Anonymiser årstall til tiår
function anonymizeYear($year) {
    if (empty($year) || !is_numeric($year)) {
        return null;
    }
    
    $year = (int)$year;
    $decade = floor($year / 10) * 10;
    return $decade . '-' . ($decade + 9);
}

// Valider og sanitize input
function sanitizeString($value, $maxLength = 100) {
    if (empty($value)) return null;
    $value = trim(strip_tags($value));
    return mb_substr($value, 0, $maxLength);
}

// ============================================
// ENDPOINT: POST /api/findings
// Motta anonyme funn fra appen
// ============================================
function handleSubmitFindings() {
    validateApiKey();
    checkRateLimit();
    
    // Les JSON-data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !is_array($input)) {
        errorResponse('Invalid JSON body');
    }
    
    // Valider påkrevde felter
    $required = ['boat_manufacturer', 'boat_type', 'findings'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            errorResponse("Missing required field: $field");
        }
    }
    
    if (!is_array($input['findings']) || count($input['findings']) === 0) {
        errorResponse('Findings must be a non-empty array');
    }
    
    // Begrens antall funn per request
    if (count($input['findings']) > 500) {
        errorResponse('Too many findings (max 500)');
    }
    
    $pdo = getDB();
    
    // Forbered insert-statement
    $stmt = $pdo->prepare("
        INSERT INTO anonymous_findings 
        (boat_manufacturer, boat_model, boat_type, boat_type_secondary, 
         hull_material, engine_type, year_range, checklist_item_id, 
         checklist_area, finding_state, country_code, app_version, platform)
        VALUES 
        (:manufacturer, :model, :type, :type_secondary, 
         :hull, :engine, :year_range, :item_id, 
         :area, :state, :country, :version, :platform)
    ");
    
    // Felles båtdata
    $boatData = [
        'manufacturer' => sanitizeString($input['boat_manufacturer']),
        'model' => sanitizeString($input['boat_model'] ?? null),
        'type' => in_array($input['boat_type'], ['Sailboat', 'Motorboat']) ? $input['boat_type'] : 'Motorboat',
        'type_secondary' => in_array($input['boat_type_secondary'] ?? '', ['Monohull', 'Multihull']) ? $input['boat_type_secondary'] : null,
        'hull' => in_array($input['hull_material'] ?? '', ['Fiberglass', 'Steel', 'Wood', 'Aluminum']) ? $input['hull_material'] : null,
        'engine' => in_array($input['engine_type'] ?? '', ['inboard', 'outboard', 'both']) ? $input['engine_type'] : null,
        'year_range' => anonymizeYear($input['boat_year'] ?? null),
        'country' => sanitizeString($input['country_code'] ?? 'NO', 2),
        'version' => sanitizeString($input['app_version'] ?? null, 20),
        'platform' => in_array($input['platform'] ?? '', ['web', 'ios', 'android']) ? $input['platform'] : 'web',
    ];
    
    $inserted = 0;
    $errors = 0;
    
    foreach ($input['findings'] as $finding) {
        if (empty($finding['id']) || empty($finding['state'])) {
            $errors++;
            continue;
        }
        
        if (!in_array($finding['state'], ['ok', 'obs', 'kritisk'])) {
            $errors++;
            continue;
        }
        
        try {
            $stmt->execute([
                'manufacturer' => $boatData['manufacturer'],
                'model' => $boatData['model'],
                'type' => $boatData['type'],
                'type_secondary' => $boatData['type_secondary'],
                'hull' => $boatData['hull'],
                'engine' => $boatData['engine'],
                'year_range' => $boatData['year_range'],
                'item_id' => sanitizeString($finding['id']),
                'area' => sanitizeString($finding['area'] ?? null),
                'state' => $finding['state'],
                'country' => $boatData['country'],
                'version' => $boatData['version'],
                'platform' => $boatData['platform'],
            ]);
            $inserted++;
        } catch (PDOException $e) {
            $errors++;
            if (DEBUG_MODE) {
                error_log("Insert error: " . $e->getMessage());
            }
        }
    }
    
    jsonResponse([
        'success' => true,
        'inserted' => $inserted,
        'errors' => $errors,
        'message' => "Received $inserted findings" . ($errors > 0 ? " ($errors errors)" : "")
    ]);
}

// ============================================
// ENDPOINT: GET /api/stats
// Hent statistikk for en båtmodell/produsent
// ============================================
function handleGetStats() {
    // Stats er offentlig tilgjengelig (ingen API-nøkkel krevd)
    checkRateLimit();
    
    $manufacturer = sanitizeString($_GET['manufacturer'] ?? '');
    $model = sanitizeString($_GET['model'] ?? null);
    
    if (empty($manufacturer)) {
        errorResponse('Missing manufacturer parameter');
    }
    
    $pdo = getDB();
    
    // Hent fra pre-aggregert statistikk-tabell
    if ($model) {
        $stmt = $pdo->prepare("
            SELECT checklist_item_id, total_inspections, 
                   count_ok, count_obs, count_kritisk,
                   pct_ok, pct_obs, pct_kritisk
            FROM finding_statistics
            WHERE boat_manufacturer = :manufacturer 
              AND (boat_model = :model OR boat_model IS NULL)
            ORDER BY pct_kritisk DESC, pct_obs DESC
        ");
        $stmt->execute(['manufacturer' => $manufacturer, 'model' => $model]);
    } else {
        $stmt = $pdo->prepare("
            SELECT checklist_item_id, total_inspections, 
                   count_ok, count_obs, count_kritisk,
                   pct_ok, pct_obs, pct_kritisk
            FROM finding_statistics
            WHERE boat_manufacturer = :manufacturer 
              AND boat_model IS NULL
            ORDER BY pct_kritisk DESC, pct_obs DESC
        ");
        $stmt->execute(['manufacturer' => $manufacturer]);
    }
    
    $stats = $stmt->fetchAll();
    
    // Filtrer ut sjeldne funn (under minimum datapunkter)
    $stats = array_filter($stats, fn($s) => $s['total_inspections'] >= MIN_DATA_POINTS);
    
    // Finn "vanlige problemer" (høy obs/kritisk-prosent)
    $commonIssues = array_filter($stats, fn($s) => 
        ($s['pct_obs'] + $s['pct_kritisk']) >= 30  // Minst 30% har obs/kritisk
    );
    
    jsonResponse([
        'success' => true,
        'manufacturer' => $manufacturer,
        'model' => $model,
        'total_items' => count($stats),
        'common_issues_count' => count($commonIssues),
        'statistics' => array_values($stats),
        'common_issues' => array_values(array_slice($commonIssues, 0, 10))  // Topp 10
    ]);
}

// ============================================
// ENDPOINT: GET /api/fetch-metadata
// Hent kun sidetittel fra en URL (Pro-funksjon)
// Juridisk trygt: Kun offentlig metadata
// ============================================
function handleFetchMetadata() {
    // Ingen API-nøkkel krevd - kun offentlig metadata returneres
    // Rate-limiting beskytter mot misbruk
    checkRateLimit();
    
    $url = $_GET['url'] ?? '';
    
    if (empty($url)) {
        errorResponse('Missing url parameter');
    }
    
    // Valider at det er en gyldig URL
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        errorResponse('Invalid URL format');
    }
    
    // Sjekk at det er http/https
    $scheme = parse_url($url, PHP_URL_SCHEME);
    if (!in_array($scheme, ['http', 'https'])) {
        errorResponse('Only http/https URLs allowed');
    }
    
    // Begrens til kjente båtannonse-sider (valgfritt - kan fjernes for å støtte alle)
    $host = strtolower(parse_url($url, PHP_URL_HOST));
    $allowedDomains = [
        'finn.no', 'www.finn.no',
        'blocket.se', 'www.blocket.se',
        'yachtworld.com', 'www.yachtworld.com',
        'boats.com', 'www.boats.com',
        'boatshop24.com', 'www.boatshop24.com',
        'yachting.no', 'www.yachting.no',
        'boat24.com', 'www.boat24.com',
        'scanboat.com', 'www.scanboat.com',
        'boatsonline.com.au', 'www.boatsonline.com.au',
    ];
    
    $domainAllowed = false;
    foreach ($allowedDomains as $domain) {
        if ($host === $domain || str_ends_with($host, '.' . $domain)) {
            $domainAllowed = true;
            break;
        }
    }
    
    if (!$domainAllowed) {
        // Tillat alle domener men logg det
        error_log("[BoatChecker] Metadata request for unknown domain: $host");
    }
    
    try {
        // Sett opp cURL med timeout og User-Agent
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; BoatChecker/1.0; +https://boatchecker.no)',
            CURLOPT_HTTPHEADER => [
                'Accept: text/html',
                'Accept-Language: nb-NO,nb,en',
            ],
            // Bare hent starten av dokumentet (vi trenger bare <head>)
            CURLOPT_RANGE => '0-32768',
        ]);
        
        $html = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error || $httpCode >= 400) {
            errorResponse('Could not fetch URL: ' . ($error ?: "HTTP $httpCode"), 502);
        }
        
        // Parse kun <title> og Open Graph tags
        $title = '';
        $ogTitle = '';
        $ogDescription = '';
        
        // Finn <title>
        if (preg_match('/<title[^>]*>([^<]+)<\/title>/i', $html, $matches)) {
            $title = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
        }
        
        // Finn og og:title
        if (preg_match('/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\']/i', $html, $matches)) {
            $ogTitle = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
        }
        // Alternativ rekkefølge av attributter
        if (empty($ogTitle) && preg_match('/<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:title["\']/i', $html, $matches)) {
            $ogTitle = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
        }
        
        // Finn og og:description (valgfritt)
        if (preg_match('/<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']+)["\']/i', $html, $matches)) {
            $ogDescription = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
        }
        
        // Returner metadata (IKKE sideinnhold)
        jsonResponse([
            'success' => true,
            'url' => $url,
            'metadata' => [
                'title' => $ogTitle ?: $title,
                'og_title' => $ogTitle,
                'og_description' => mb_substr($ogDescription, 0, 200), // Begrens lengde
            ]
        ]);
        
    } catch (Exception $e) {
        errorResponse('Error fetching URL: ' . $e->getMessage(), 500);
    }
}

// ============================================
// ENDPOINT: GET /api/health
// Helsesjekk for overvåkning
// ============================================
function handleHealth() {
    try {
        $pdo = getDB();
        $stmt = $pdo->query("SELECT 1");
        
        jsonResponse([
            'status' => 'healthy',
            'database' => 'connected',
            'version' => API_VERSION,
            'timestamp' => date('c')
        ]);
    } catch (Exception $e) {
        jsonResponse([
            'status' => 'unhealthy',
            'database' => 'disconnected',
            'version' => API_VERSION,
            'timestamp' => date('c')
        ], 503);
    }
}

// ============================================
// Router
// ============================================
handleCors();

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Fjern /api prefix hvis det finnes
$path = preg_replace('#^/api#', '', $path);

// Route requests
switch (true) {
    case $method === 'POST' && $path === '/findings':
        handleSubmitFindings();
        break;
        
    case $method === 'GET' && $path === '/stats':
        handleGetStats();
        break;
        
    case $method === 'GET' && $path === '/fetch-metadata':
        handleFetchMetadata();
        break;
        
    case $method === 'GET' && ($path === '/health' || $path === '/'):
        handleHealth();
        break;
        
    default:
        errorResponse('Not found', 404);
}
