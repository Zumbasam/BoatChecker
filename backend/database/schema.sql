-- BoatChecker Anonymous Findings Database Schema
-- Kjør dette i phpMyAdmin på Domeneshop

-- Opprett database (hvis ikke allerede opprettet via Domeneshop panel)
-- CREATE DATABASE IF NOT EXISTS boatchecker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE boatchecker_db;

-- ============================================
-- Tabell: anonymous_findings
-- Lagrer anonyme funn fra inspeksjoner
-- ============================================
CREATE TABLE IF NOT EXISTS anonymous_findings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Båtinformasjon (anonymisert)
    boat_manufacturer VARCHAR(100) NOT NULL,
    boat_model VARCHAR(100) DEFAULT NULL,
    boat_type ENUM('Sailboat', 'Motorboat') NOT NULL,
    boat_type_secondary ENUM('Monohull', 'Multihull') DEFAULT NULL,
    hull_material ENUM('Fiberglass', 'Steel', 'Wood', 'Aluminum') DEFAULT NULL,
    engine_type ENUM('inboard', 'outboard', 'both') DEFAULT NULL,
    year_range VARCHAR(20) DEFAULT NULL,  -- f.eks. "2000-2009" (ikke eksakt år)
    
    -- Funn-data
    checklist_item_id VARCHAR(100) NOT NULL,
    checklist_area VARCHAR(100) DEFAULT NULL,  -- f.eks. "hull", "rigg", "motor"
    finding_state ENUM('ok', 'obs', 'kritisk') NOT NULL,
    
    -- Metadata
    country_code CHAR(2) DEFAULT 'NO',
    app_version VARCHAR(20) DEFAULT NULL,
    platform ENUM('web', 'ios', 'android') DEFAULT 'web',
    
    -- Indekser for rask spørring
    INDEX idx_manufacturer (boat_manufacturer),
    INDEX idx_model (boat_manufacturer, boat_model),
    INDEX idx_checklist_item (checklist_item_id),
    INDEX idx_finding_state (finding_state),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabell: finding_statistics (cache/aggregert)
-- Pre-aggregert statistikk for raskere lesing
-- ============================================
CREATE TABLE IF NOT EXISTS finding_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Gruppering
    boat_manufacturer VARCHAR(100) NOT NULL,
    boat_model VARCHAR(100) DEFAULT NULL,  -- NULL = alle modeller fra produsent
    checklist_item_id VARCHAR(100) NOT NULL,
    
    -- Statistikk
    total_inspections INT DEFAULT 0,
    count_ok INT DEFAULT 0,
    count_obs INT DEFAULT 0,
    count_kritisk INT DEFAULT 0,
    
    -- Prosenter (lagret for enkel lesing)
    pct_ok DECIMAL(5,2) DEFAULT 0,
    pct_obs DECIMAL(5,2) DEFAULT 0,
    pct_kritisk DECIMAL(5,2) DEFAULT 0,
    
    UNIQUE KEY unique_stat (boat_manufacturer, boat_model, checklist_item_id),
    INDEX idx_stats_model (boat_manufacturer, boat_model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabell: api_keys (valgfritt, for sikkerhet)
-- Enkle API-nøkler for å begrense tilgang
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    request_count INT DEFAULT 0,
    
    INDEX idx_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sett inn en standard API-nøkkel (BYTT DENNE!)
INSERT INTO api_keys (api_key, name) VALUES 
('BYTT_DENNE_MED_EN_TILFELDIG_STRENG_PÅ_64_TEGN_1234567890abcdef', 'BoatChecker App');

-- ============================================
-- Stored Procedure: Oppdater statistikk
-- Kjøres periodisk (f.eks. daglig via cron)
-- ============================================
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS update_finding_statistics()
BEGIN
    -- Tøm og regenerer statistikk-tabellen
    TRUNCATE TABLE finding_statistics;
    
    -- Aggreger per produsent + modell + sjekkpunkt
    INSERT INTO finding_statistics 
        (boat_manufacturer, boat_model, checklist_item_id, 
         total_inspections, count_ok, count_obs, count_kritisk,
         pct_ok, pct_obs, pct_kritisk)
    SELECT 
        boat_manufacturer,
        boat_model,
        checklist_item_id,
        COUNT(*) as total_inspections,
        SUM(CASE WHEN finding_state = 'ok' THEN 1 ELSE 0 END) as count_ok,
        SUM(CASE WHEN finding_state = 'obs' THEN 1 ELSE 0 END) as count_obs,
        SUM(CASE WHEN finding_state = 'kritisk' THEN 1 ELSE 0 END) as count_kritisk,
        ROUND(SUM(CASE WHEN finding_state = 'ok' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pct_ok,
        ROUND(SUM(CASE WHEN finding_state = 'obs' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pct_obs,
        ROUND(SUM(CASE WHEN finding_state = 'kritisk' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pct_kritisk
    FROM anonymous_findings
    GROUP BY boat_manufacturer, boat_model, checklist_item_id
    HAVING COUNT(*) >= 5;  -- Kun vis statistikk med minst 5 datapunkter
    
    -- Aggreger også per produsent (alle modeller samlet)
    INSERT INTO finding_statistics 
        (boat_manufacturer, boat_model, checklist_item_id, 
         total_inspections, count_ok, count_obs, count_kritisk,
         pct_ok, pct_obs, pct_kritisk)
    SELECT 
        boat_manufacturer,
        NULL as boat_model,
        checklist_item_id,
        COUNT(*) as total_inspections,
        SUM(CASE WHEN finding_state = 'ok' THEN 1 ELSE 0 END) as count_ok,
        SUM(CASE WHEN finding_state = 'obs' THEN 1 ELSE 0 END) as count_obs,
        SUM(CASE WHEN finding_state = 'kritisk' THEN 1 ELSE 0 END) as count_kritisk,
        ROUND(SUM(CASE WHEN finding_state = 'ok' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pct_ok,
        ROUND(SUM(CASE WHEN finding_state = 'obs' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pct_obs,
        ROUND(SUM(CASE WHEN finding_state = 'kritisk' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as pct_kritisk
    FROM anonymous_findings
    GROUP BY boat_manufacturer, checklist_item_id
    HAVING COUNT(*) >= 10;  -- Kun vis hvis minst 10 datapunkter
END //

DELIMITER ;

-- ============================================
-- Event: Kjør statistikk-oppdatering daglig
-- (Krever at event_scheduler er aktivert på serveren)
-- ============================================
-- CREATE EVENT IF NOT EXISTS daily_stats_update
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO CALL update_finding_statistics();
