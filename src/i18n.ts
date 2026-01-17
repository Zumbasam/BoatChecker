// src/i18n.ts

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importer hoved-oversettelsene
import nbTranslation from './locales/nb/translation.json';
import enTranslation from './locales/en/translation.json';

// --- START PÅ OPPDATERT KODE ---
// 1. Importer de nye region-oversettelsene
import nbRegions from './locales/nb/regions.json';
import enRegions from './locales/en/regions.json';
// --- SLUTT PÅ OPPDATERT KODE ---

// Definerer ressursene
const resources = {
  nb: {
    translation: nbTranslation,
    // 2. Legg til det nye navneområdet for norsk
    regions: nbRegions,
  },
  en: {
    translation: enTranslation,
    // 3. Legg til det nye navneområdet for engelsk
    regions: enRegions,
  },
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'nb',
    // 4. Definer 'translation' som standard navneområde (viktig for eksisterende kode)
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18next;