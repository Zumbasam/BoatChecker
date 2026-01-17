<?php
/**
 * BoatChecker API Configuration
 * 
 * INSTRUKSJONER:
 * 1. Kopier denne filen til "config.php"
 * 2. Fyll inn database-informasjon fra Domeneshop
 * 3. Generer en ny API-nøkkel (64 tegn, tilfeldig)
 * 4. Oppdater CORS_ORIGIN med ditt domene
 */

// Database-tilkobling (fra Domeneshop kontrollpanel)
define('DB_HOST', 'mysql.domeneshop.no');  // Eller din spesifikke MySQL-server
define('DB_NAME', 'ditt_databasenavn');
define('DB_USER', 'ditt_brukernavn');
define('DB_PASS', 'ditt_passord');

// API-sikkerhet
define('API_KEY', 'BYTT_DENNE_MED_EN_TILFELDIG_STRENG_PÅ_64_TEGN_1234567890abcdef');

// CORS - tillatte domener (legg til dine domener)
define('CORS_ORIGINS', [
    'https://boatchecker.no',
    'https://www.boatchecker.no',
    'capacitor://localhost',      // iOS app
    'http://localhost',           // Android app
    'http://localhost:5173',      // Lokal utvikling
    'http://127.0.0.1:5173',      // Lokal utvikling
]);

// App-versjon (for logging)
define('API_VERSION', '1.0.0');

// Rate limiting (requests per minutt per IP)
define('RATE_LIMIT', 60);

// Minimum datapunkter før statistikk vises
define('MIN_DATA_POINTS', 5);

// Debug-modus (sett til false i produksjon!)
define('DEBUG_MODE', false);
