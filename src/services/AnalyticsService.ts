// src/services/AnalyticsService.ts
// Service for å sende anonyme inspeksjonsfunn til backend

import { Capacitor } from '@capacitor/core';
import { db } from '../db';
import type { Inspection, BoatModel } from '../db';

// API-konfigurasjon
const API_BASE_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'https://api.boatchecker.no';
const API_KEY = import.meta.env.VITE_ANALYTICS_API_KEY || '';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

interface AnonymousFinding {
  id: string;
  area?: string;
  state: 'ok' | 'obs' | 'kritisk';
}

interface SubmitPayload {
  boat_manufacturer: string;
  boat_model?: string;
  boat_type: 'Sailboat' | 'Motorboat';
  boat_type_secondary?: string;
  hull_material?: string;
  engine_type?: string;
  boat_year?: string;
  country_code?: string;
  app_version: string;
  platform: 'web' | 'ios' | 'android';
  findings: AnonymousFinding[];
}

interface StatsResponse {
  success: boolean;
  manufacturer: string;
  model?: string;
  total_items: number;
  common_issues_count: number;
  statistics: Array<{
    checklist_item_id: string;
    total_inspections: number;
    count_ok: number;
    count_obs: number;
    count_kritisk: number;
    pct_ok: number;
    pct_obs: number;
    pct_kritisk: number;
  }>;
  common_issues: Array<{
    checklist_item_id: string;
    total_inspections: number;
    pct_kritisk: number;
    pct_obs: number;
  }>;
}

class AnalyticsService {
  private getPlatform(): 'web' | 'ios' | 'android' {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform() as 'ios' | 'android';
    }
    return 'web';
  }

  /**
   * Sjekk om brukeren har aktivert datainnsamling
   */
  async isContributeEnabled(): Promise<boolean> {
    const settings = await db.settings.get('settings');
    return settings?.contributeData !== false;  // true som standard
  }

  /**
   * Aktiver/deaktiver datainnsamling
   */
  async setContributeEnabled(enabled: boolean): Promise<void> {
    await db.settings.update('settings', { contributeData: enabled });
    console.log(`[AnalyticsService] Datainnsamling ${enabled ? 'aktivert' : 'deaktivert'}`);
  }

  /**
   * Send anonyme funn fra en fullført inspeksjon
   * Kalles kun hvis brukeren har godkjent datainnsamling
   */
  async submitFindings(inspection: Inspection, boatModel: BoatModel): Promise<boolean> {
    // Sjekk om datainnsamling er aktivert
    const isEnabled = await this.isContributeEnabled();
    if (!isEnabled) {
      console.log('[AnalyticsService] Datainnsamling er ikke aktivert, hopper over');
      return false;
    }

    // Sjekk at vi har API-konfigurasjon
    if (!API_KEY || !API_BASE_URL) {
      console.warn('[AnalyticsService] Mangler API-konfigurasjon');
      return false;
    }

    // Debug: sjekk hva vi har
    console.log('[AnalyticsService] Inspection items:', inspection.items?.length ?? 0, 'items');
    
    // Filtrer ut items som faktisk har en tilstand (ekskluder not_assessed)
    const findings: AnonymousFinding[] = (inspection.items || [])
      .filter(item => item.state && ['ok', 'obs', 'kritisk'].includes(item.state) && item.state !== 'not_assessed')
      .map(item => ({
        id: item.id,
        state: item.state as 'ok' | 'obs' | 'kritisk',
        // area hentes fra checklist_item_id format, f.eks. "hull_osmosis" -> "hull"
        area: item.id.split('_')[0] || undefined,
      }));

    console.log('[AnalyticsService] Filtrerte funn:', findings.length, 
      `(ok: ${findings.filter(f => f.state === 'ok').length}, obs: ${findings.filter(f => f.state === 'obs').length}, kritisk: ${findings.filter(f => f.state === 'kritisk').length})`);

    if (findings.length === 0) {
      console.log('[AnalyticsService] Ingen funn å sende - sjekk at items har state');
      return false;
    }

    // Bygg payload (anonymisert)
    const payload: SubmitPayload = {
      boat_manufacturer: boatModel.manufacturer,
      boat_model: boatModel.name,
      boat_type: boatModel.typePrimary,
      boat_type_secondary: boatModel.typeSecondary,
      hull_material: boatModel.hullMaterial,
      engine_type: inspection.inspectionSettings.engineType || boatModel.engineType || undefined,
      boat_year: inspection.boatDetails.customBoatDetails?.year,
      country_code: inspection.inspectionSettings.countryCode || 'NO',
      app_version: APP_VERSION,
      platform: this.getPlatform(),
      findings,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/findings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AnalyticsService] API-feil:', response.status, errorData);
        return false;
      }

      const result = await response.json();
      console.log(`[AnalyticsService] Sendte ${result.inserted} anonyme funn`);
      return true;

    } catch (error) {
      console.error('[AnalyticsService] Nettverksfeil:', error);
      return false;
    }
  }

  /**
   * Hent statistikk for en båtmodell
   * Viser "vanlige funn" basert på anonyme data fra andre brukere
   */
  async getStats(manufacturer: string, model?: string): Promise<StatsResponse | null> {
    if (!API_BASE_URL) {
      console.warn('[AnalyticsService] Mangler API-konfigurasjon');
      return null;
    }

    try {
      const params = new URLSearchParams({ manufacturer });
      if (model) {
        params.append('model', model);
      }

      const response = await fetch(`${API_BASE_URL}/stats?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[AnalyticsService] Stats API-feil:', response.status);
        return null;
      }

      const data = await response.json();
      return data as StatsResponse;

    } catch (error) {
      console.error('[AnalyticsService] Nettverksfeil ved henting av stats:', error);
      return null;
    }
  }

  /**
   * Sjekk om API-et er tilgjengelig
   */
  async checkHealth(): Promise<boolean> {
    if (!API_BASE_URL) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      return false;

    } catch {
      return false;
    }
  }
}

export default new AnalyticsService();
