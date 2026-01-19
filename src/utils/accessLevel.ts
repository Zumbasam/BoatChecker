// src/utils/accessLevel.ts
// Sentralisert tilgangslogikk for Pro-funksjoner

import { db } from '../db';
import type { Inspection } from '../db';

export type AccessLevel = 'pro' | 'single_purchase' | 'free';

/**
 * Hent tilgangsnivå for en inspeksjon
 * 
 * Rekkefølge:
 * 1. Hvis bruker har Pro-abonnement → 'pro' (global tilgang)
 * 2. Hvis inspeksjonen har enkeltkjøp → 'single_purchase'
 * 3. Ellers → 'free'
 */
export function getAccessLevel(
  isPro: boolean,
  inspection?: Inspection | null
): AccessLevel {
  // Pro-abonnement gir full tilgang
  if (isPro) return 'pro';
  
  // Enkeltkjøp for denne inspeksjonen
  if (inspection?.unlockLevel === 'single_purchase') return 'single_purchase';
  
  // Gratis bruker
  return 'free';
}

/**
 * Sjekk om et sjekkpunkt er låst basert på tilgangsnivå
 * 
 * Et punkt er låst hvis:
 * - Bruker har 'free' tilgang OG
 * - Punktet har criticality > 1 (Pro-only punkter)
 */
export function isItemLocked(
  accessLevel: AccessLevel,
  itemCriticality?: number
): boolean {
  // Pro og single_purchase har full tilgang
  if (accessLevel === 'pro' || accessLevel === 'single_purchase') {
    return false;
  }
  
  // Free: låst hvis criticality > 1
  return (itemCriticality ?? 0) > 1;
}

/**
 * Aktiver enkeltkjøp for en inspeksjon
 */
export async function activateSinglePurchase(inspectionId: number): Promise<void> {
  await db.inspections.update(inspectionId, { unlockLevel: 'single_purchase' });
  console.log(`[AccessLevel] Enkeltkjøp aktivert for inspeksjon ${inspectionId}`);
}

/**
 * Sjekk om bruker kan laste ned rapport
 * 
 * Kan laste ned hvis:
 * - Pro-abonnement
 * - Enkeltkjøp for denne inspeksjonen
 */
export function canDownloadReport(accessLevel: AccessLevel): boolean {
  return accessLevel === 'pro' || accessLevel === 'single_purchase';
}

/**
 * Sjekk om bruker kan sende til verksteder
 * 
 * Kun Pro-abonnenter kan sende til verksteder
 */
export function canSendToWorkshops(accessLevel: AccessLevel): boolean {
  return accessLevel === 'pro';
}
