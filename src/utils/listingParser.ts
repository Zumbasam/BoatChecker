// src/utils/listingParser.ts
// Utility for å hente og parse båtinfo fra annonse-URLer
// VIKTIG: Vi henter KUN offentlige meta-tags, ingen scraping av sideinnhold

export interface ParsedListingData {
  title?: string;
  manufacturer?: string;
  model?: string;
  year?: string;
  price?: string;
  source: 'meta' | 'url' | 'manual';
  confidence: 'high' | 'medium' | 'low';
}

// Kjente båtprodusenter for matching
const KNOWN_MANUFACTURERS = [
  'Bavaria', 'Beneteau', 'Jeanneau', 'Hallberg-Rassy', 'Najad', 'Dehler',
  'Hanse', 'Dufour', 'Lagoon', 'Fountaine Pajot', 'Catana', 'Leopard',
  'Nauticat', 'Nordship', 'Marex', 'Windy', 'Nimbus', 'Yamarin', 'Yamaha',
  'Mercury', 'Buster', 'Askeladden', 'Ryds', 'Uttern', 'Crescent', 'Flipper',
  'Ørnvik', 'Selfa', 'Ibiza', 'Princess', 'Fairline', 'Sunseeker', 'Azimut',
  'Ferretti', 'Riva', 'Sea Ray', 'Boston Whaler', 'Grady-White', 'Chaparral',
  'Cobalt', 'Four Winns', 'Monterey', 'Regal', 'Rinker', 'Wellcraft',
  'Quicksilver', 'Zodiac', 'Brig', 'Grand', 'Parker', 'Finnmaster',
  'Bella', 'AMT', 'Falcon', 'Draco', 'Alukin', 'Arronet', 'Viknes',
  'Skorgenes', 'Saga', 'Scand', 'Nord Star', 'Aquador', 'Linssen',
  'Sealine', 'Rodman', 'Starfisher', 'Astondoa', 'Galeon', 'Greenline',
  // Legg til flere etter behov
];

/**
 * Parser sidetittel for å finne båtinfo
 * Typiske formater:
 * - "Bavaria 37 Cruiser 2008 - FINN.no"
 * - "Beneteau Oceanis 40.1 (2019) | Yachting.no"
 * - "2015 Jeanneau Sun Odyssey 449 for sale"
 */
export function parseBoatInfoFromTitle(title: string): Partial<ParsedListingData> {
  const result: Partial<ParsedListingData> = { source: 'meta' };
  
  if (!title) return result;
  
  // Fjern vanlige prefixer og suffixer
  let cleanTitle = title
    // Fjern suffixer først
    .replace(/\s*[-–|]\s*(FINN\.no|Finn\.no|finn\.no|Yachting|Boats|YachtWorld|Blocket).*$/i, '')
    .replace(/\s*for\s+sale.*$/i, '')
    // Fjern prefixer
    .replace(/^(Til salgs|For sale|Selges|Säljes)[\s:]+/i, '')
    .trim();
  
  // Finn årstall (4 siffer mellom 1970 og neste år)
  const currentYear = new Date().getFullYear();
  const yearMatch = cleanTitle.match(/\b(19[7-9]\d|20[0-2]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year >= 1970 && year <= currentYear + 1) {
      result.year = yearMatch[1];
      // Fjern årstall og eventuell bindestrek før/etter
      cleanTitle = cleanTitle
        .replace(new RegExp(`\\s*[-–]?\\s*${yearMatch[0]}\\s*[-–]?\\s*`, 'g'), ' ')
        .trim();
    }
  }
  
  // Fjern pris-lignende mønstre og rydd opp
  cleanTitle = cleanTitle
    .replace(/\d{1,3}[\s.,]?\d{3}[\s.,]?\d{0,3}\s*(kr|nok|eur|€|\$|usd)?/gi, '')
    .replace(/\(.*?\)/g, '') // Fjern parenteser
    .replace(/\s*[-–]\s*$/, '') // Fjern trailing bindestrek
    .replace(/\s+/g, ' ') // Normaliser whitespace
    .trim();
  
  console.log('[ListingParser] Clean title:', cleanTitle);
  
  // Prøv å finne kjent produsent
  const lowerTitle = cleanTitle.toLowerCase();
  for (const manufacturer of KNOWN_MANUFACTURERS) {
    if (lowerTitle.includes(manufacturer.toLowerCase())) {
      result.manufacturer = manufacturer;
      
      // Modell er det som kommer etter produsent
      const manufacturerIndex = lowerTitle.indexOf(manufacturer.toLowerCase());
      const afterManufacturer = cleanTitle.substring(manufacturerIndex + manufacturer.length).trim();
      
      // Ta første "ord-gruppe" som modell (kan inkludere tall og punktum)
      // Fjern ledende bindestrek/mellomrom
      const cleanAfter = afterManufacturer.replace(/^[\s\-–]+/, '').trim();
      const modelMatch = cleanAfter.match(/^[\w\d.\-]+(\s+[\w\d.\-]+)?/);
      if (modelMatch) {
        result.model = modelMatch[0].trim();
      }
      
      console.log('[ListingParser] Found:', { manufacturer, model: result.model, afterManufacturer: cleanAfter });
      result.confidence = 'high';
      break;
    }
  }
  
  // Hvis vi ikke fant kjent produsent, prøv å splitte på første ord
  if (!result.manufacturer && cleanTitle.length > 0) {
    const words = cleanTitle.split(/\s+/);
    if (words.length >= 2) {
      // Første ord som produsent, resten som modell
      result.manufacturer = words[0];
      result.model = words.slice(1).join(' ').substring(0, 50); // Maks 50 tegn
      result.confidence = 'low';
    }
  }
  
  return result;
}

// API konfigurasjon
const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API_URL || '';

/**
 * Henter sidetittel fra URL via vår backend-proxy (unngår CORS)
 * Backend henter kun offentlig metadata (title, og:title)
 */
export async function fetchListingMetadata(url: string): Promise<ParsedListingData | null> {
  if (!url || !isValidUrl(url)) {
    return null;
  }
  
  try {
    // Parse info fra selve URL-en først (fallback)
    const urlParsed = parseInfoFromUrl(url);
    
    // Sjekk om vi har API-konfigurasjon
    if (!API_BASE_URL) {
      console.log('[ListingParser] Ingen API-konfigurasjon, bruker kun URL-parsing');
      return urlParsed;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sek timeout
    
    try {
      // Bruk vår backend som proxy for å unngå CORS
      const proxyUrl = `${API_BASE_URL}/fetch-metadata?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[ListingParser] Proxy-feil:', response.status, errorData);
        return urlParsed;
      }
      
      const data = await response.json();
      
      if (data.success && data.metadata?.title) {
        const pageTitle = data.metadata.title;
        const parsed = parseBoatInfoFromTitle(pageTitle);
        
        return {
          title: pageTitle,
          ...parsed,
          // Kombiner med URL-parsing hvis vi mangler data
          manufacturer: parsed.manufacturer || urlParsed?.manufacturer,
          model: parsed.model || urlParsed?.model,
          year: parsed.year || urlParsed?.year,
          source: 'meta',
          confidence: parsed.confidence || 'medium',
        };
      }
      
      return urlParsed;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.log('[ListingParser] Proxy-feil:', fetchError);
      return urlParsed;
    }
    
  } catch (error) {
    console.error('[ListingParser] Feil ved parsing:', error);
    return null;
  }
}

/**
 * Parser info direkte fra URL-strukturen
 * F.eks: finn.no/båt/bavaria-37-cruiser-2008
 */
function parseInfoFromUrl(url: string): ParsedListingData | null {
  try {
    const urlObj = new URL(url);
    const path = decodeURIComponent(urlObj.pathname).toLowerCase();
    
    const result: ParsedListingData = {
      source: 'url',
      confidence: 'low',
    };
    
    // Finn årstall i path
    const yearMatch = path.match(/\b(19[7-9]\d|20[0-2]\d)\b/);
    if (yearMatch) {
      result.year = yearMatch[1];
    }
    
    // Prøv å finne produsent
    for (const manufacturer of KNOWN_MANUFACTURERS) {
      if (path.includes(manufacturer.toLowerCase().replace(/\s+/g, '-'))) {
        result.manufacturer = manufacturer;
        result.confidence = 'medium';
        break;
      }
    }
    
    return result;
    
  } catch {
    return null;
  }
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sjekk om URL er fra en kjent båtannonse-side
 */
export function isKnownListingSite(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();
    
    const knownSites = [
      'finn.no',
      'blocket.se',
      'yachtworld.com',
      'boats.com',
      'boatshop24.com',
      'yachting.no',
      'boat24.com',
      'scanboat.com',
    ];
    
    return knownSites.some(site => host.includes(site));
  } catch {
    return false;
  }
}
