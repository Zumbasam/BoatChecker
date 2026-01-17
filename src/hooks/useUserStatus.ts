// src/hooks/useUserStatus.ts

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

/**
 * En custom hook som gir en enkel og sentralisert måte å sjekke
 * brukerens abonnementsstatus (Gratis vs. Pro).
 * 
 * @returns Et objekt med brukerens status.
 *          - status: 'free' | 'pro' | undefined (mens det lastes)
 *          - isPro: boolean (true hvis status er 'pro')
 *          - reportsGenerated: number (antall rapporter generert, default 0)
 */
export const useUserStatus = () => {
  const settings = useLiveQuery(() => db.settings.get('settings'));

  // Standardverdier for å håndtere tilfellet der settings ikke er lastet ennå,
  // eller for nye brukere der feltene ikke er satt.
  const status = settings?.userStatus || 'free';
  const isPro = status === 'pro';
  const reportsGenerated = settings?.reportsGenerated || 0;

  return {
    status,
    isPro,
    reportsGenerated,
  };
};