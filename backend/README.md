# BoatChecker Backend API

Enkel PHP/MySQL backend for anonym innsamling av inspeksjonsfunn.

## Oppsett på Domeneshop

### 1. Opprett database

1. Logg inn på [Domeneshop kontrollpanel](https://www.domeneshop.no/admin)
2. Gå til **Webhotell** → **Databaser**
3. Opprett en ny MySQL-database
4. Noter ned:
   - Databasenavn
   - Brukernavn
   - Passord
   - Server (vanligvis `mysql.domeneshop.no`)

### 2. Kjør database-skjema

1. Gå til **phpMyAdmin** via Domeneshop
2. Velg din database
3. Klikk på **Importer** eller **SQL**
4. Lim inn innholdet fra `database/schema.sql`
5. Klikk **Utfør**

### 3. Last opp API-filer

1. Via FTP eller Domeneshop filbehandler:
   - Last opp innholdet av `api/` mappen til `/www/api/` (eller `/public_html/api/`)
   
2. Filstruktur på serveren:
   ```
   /www/
   └── api/
       ├── .htaccess
       ├── config.php      ← Opprett denne!
       └── index.php
   ```

### 4. Konfigurer API

1. Kopier `config.example.php` til `config.php`
2. Rediger `config.php` med dine innstillinger:

```php
define('DB_HOST', 'mysql.domeneshop.no');
define('DB_NAME', 'ditt_databasenavn');
define('DB_USER', 'ditt_brukernavn');
define('DB_PASS', 'ditt_passord');

// Generer en tilfeldig 64-tegns streng for API-nøkkel
define('API_KEY', 'din_tilfeldige_api_nokkel_her');

// Legg til ditt domene
define('CORS_ORIGINS', [
    'https://dittdomene.no',
    'capacitor://localhost',
    'http://localhost',
]);
```

### 5. Test API

```bash
# Helsesjekk
curl https://dittdomene.no/api/health

# Forventet respons:
# {"status":"healthy","database":"connected","version":"1.0.0",...}
```

## API Endpoints

### POST /api/findings

Send inn anonyme funn fra en inspeksjon.

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: din_api_nokkel`

**Body:**
```json
{
  "boat_manufacturer": "Bavaria",
  "boat_model": "Cruiser 34",
  "boat_type": "Sailboat",
  "boat_type_secondary": "Monohull",
  "hull_material": "Fiberglass",
  "engine_type": "inboard",
  "boat_year": "2008",
  "country_code": "NO",
  "app_version": "1.0.2",
  "platform": "ios",
  "findings": [
    { "id": "hull_osmosis", "area": "hull", "state": "obs" },
    { "id": "rigging_shrouds", "area": "rigg", "state": "ok" },
    { "id": "engine_oil", "area": "motor", "state": "kritisk" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "inserted": 3,
  "errors": 0,
  "message": "Received 3 findings"
}
```

### GET /api/stats

Hent statistikk for en båtprodusent/modell.

**Parameters:**
- `manufacturer` (required): Produsent, f.eks. "Bavaria"
- `model` (optional): Modell, f.eks. "Cruiser 34"

**Example:**
```bash
curl "https://dittdomene.no/api/stats?manufacturer=Bavaria&model=Cruiser%2034"
```

**Response:**
```json
{
  "success": true,
  "manufacturer": "Bavaria",
  "model": "Cruiser 34",
  "total_items": 45,
  "common_issues_count": 8,
  "statistics": [...],
  "common_issues": [
    {
      "checklist_item_id": "hull_osmosis",
      "total_inspections": 127,
      "count_ok": 45,
      "count_obs": 62,
      "count_kritisk": 20,
      "pct_ok": 35.43,
      "pct_obs": 48.82,
      "pct_kritisk": 15.75
    }
  ]
}
```

### GET /api/health

Helsesjekk for overvåkning.

## Vedlikehold

### Oppdater statistikk manuelt

Kjør denne SQL-en i phpMyAdmin for å regenerere statistikk:

```sql
CALL update_finding_statistics();
```

### Automatisk oppdatering (cron)

Opprett en cron-jobb på Domeneshop som kjører daglig:

```bash
/usr/bin/php /www/api/cron/update_stats.php
```

## Sikkerhet

- ✅ API-nøkkel kreves for innsending
- ✅ Rate limiting (60 req/min per IP)
- ✅ SQL injection-beskyttelse (prepared statements)
- ✅ Input-validering og sanitering
- ✅ CORS-begrensning til godkjente domener
- ✅ Ingen persondata lagres

## Feilsøking

### "Database connection failed"
- Sjekk at database-credentials i `config.php` er korrekte
- Verifiser at databasen eksisterer på Domeneshop

### "Invalid API key"
- Sjekk at `X-API-Key` header sendes med requests
- Verifiser at API-nøkkelen matcher den i `config.php`

### "Rate limit exceeded"
- Vent 1 minutt og prøv igjen
- Sjekk om det er en feil i appen som sender for mange requests
