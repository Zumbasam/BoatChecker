// src/services/PurchasesService.ts
// Bruker RevenueCat Capacitor plugin på native, web stub i nettleser.

import { Capacitor } from '@capacitor/core';
import { db } from '../db';

// RevenueCat Capacitor plugin - dynamisk import for å unngå feil på web
let Purchases: typeof import('@revenuecat/purchases-capacitor').Purchases | null = null;

export type PurchasesPackage = {
  identifier: string;
  product: {
    title: string;
    priceString: string;
  };
  rcPackage?: any; // Original RevenueCat package for purchase
};

const REVENUECAT_API_KEY_IOS = import.meta.env.VITE_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || '';
const ENTITLEMENT_ID = 'pro';

class PurchasesService {
  private isInitialized = false;
  private isNative = Capacitor.isNativePlatform();

  public init = async () => {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    if (!this.isNative) {
      console.log("[PurchasesService] Web-modus - bruker stub (ingen betalinger i nettleser)");
      return;
    }

    try {
      // Dynamisk import av RevenueCat
      const rcModule = await import('@revenuecat/purchases-capacitor');
      Purchases = rcModule.Purchases;

      const platform = Capacitor.getPlatform();
      const apiKey = platform === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        console.warn("[PurchasesService] Ingen API-nøkkel konfigurert for", platform);
        return;
      }

      await Purchases.configure({ apiKey });
      console.log("[PurchasesService] RevenueCat initialisert for", platform);

      // Verifiser entitlements ved oppstart (sikkerhet)
      await this.verifyEntitlements();

      // Lytt til endringer i kundeinfo (synkroniserer ved kjøp/restore)
      Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
        const isPro = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        await this.updateProStatus(isPro, 'listener');
      });

    } catch (error) {
      console.error("[PurchasesService] Feil ved initialisering:", error);
    }
  }

  /**
   * Verifiserer entitlements direkte med RevenueCat.
   * Kalles ved oppstart for å sikre at lokal cache er synkronisert.
   */
  private verifyEntitlements = async (): Promise<void> => {
    if (!this.isNative || !Purchases) return;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = !!customerInfo.customerInfo.entitlements.active[ENTITLEMENT_ID];
      await this.updateProStatus(isPro, 'verification');
      console.log("[PurchasesService] Entitlements verifisert ved oppstart:", isPro ? 'PRO' : 'FREE');
    } catch (error) {
      console.error("[PurchasesService] Kunne ikke verifisere entitlements:", error);
      // Ved feil: behold eksisterende lokal status (offline-støtte)
    }
  }

  /**
   * Oppdaterer Pro-status i lokal database.
   * Kun RevenueCat-kilde oppdaterer i produksjon.
   */
  private updateProStatus = async (isPro: boolean, source: string): Promise<void> => {
    await db.settings.update('settings', { userStatus: isPro ? 'pro' : 'free' });
    console.log(`[PurchasesService] Status oppdatert (${source}):`, isPro ? 'PRO' : 'FREE');
  }

  public getOfferings = async (): Promise<PurchasesPackage[]> => {
    if (!this.isNative || !Purchases) {
      console.log("[PurchasesService] getOfferings - web/dev modus, returnerer mock-produkter");
      // Mock-produkter for testing i dev/web-modus
      return [
        {
          identifier: 'boatchecker_pro_yearly',
          product: {
            title: 'Pro Årsabonnement',
            priceString: 'kr 399,00',
          },
        },
        {
          identifier: 'boatchecker_pro_monthly',
          product: {
            title: 'Pro Månedlig',
            priceString: 'kr 59,00',
          },
        },
        {
          identifier: 'boatchecker_single_report',
          product: {
            title: 'Enkeltrapport',
            priceString: 'kr 89,00',
          },
        },
      ];
    }

    try {
      const offerings = await Purchases.getOfferings();
      
      if (!offerings.current?.availablePackages?.length) {
        console.log("[PurchasesService] Ingen tilgjengelige pakker");
        return [];
      }

      return offerings.current.availablePackages.map(pkg => ({
        identifier: pkg.identifier,
        product: {
          title: pkg.product.title,
          priceString: pkg.product.priceString,
        },
        rcPackage: pkg,
      }));
    } catch (error) {
      console.error("[PurchasesService] Feil ved henting av tilbud:", error);
      return [];
    }
  }

  public purchasePackage = async (pack: PurchasesPackage): Promise<boolean> => {
    // DEV/Web modus - simuler kjøp
    if (!this.isNative || !Purchases) {
      console.log("[PurchasesService] DEV: Simulerer kjøp av", pack.identifier);
      
      // Simuler enkeltkjøp vs abonnement
      if (pack.identifier.includes('single')) {
        // Enkeltrapport - sett ikke Pro, men returner true for å trigge callback
        console.log("[PurchasesService] DEV: Enkeltrapport kjøpt (krever inspeksjons-unlock)");
        return true;
      } else {
        // Abonnement - sett Pro-status
        await db.settings.update('settings', { userStatus: 'pro' });
        console.log("[PurchasesService] DEV: Pro-abonnement aktivert!");
        return true;
      }
    }

    if (!pack.rcPackage) {
      console.log("[PurchasesService] purchasePackage - mangler rcPackage");
      return false;
    }

    try {
      const result = await Purchases.purchasePackage({ aPackage: pack.rcPackage });
      const isPro = !!result.customerInfo.entitlements.active[ENTITLEMENT_ID];
      
      if (isPro) {
        await this.updateProStatus(true, 'purchase');
        console.log("[PurchasesService] Kjøp vellykket - PRO aktivert!");
      }
      
      return isPro;
    } catch (error: any) {
      if (error.code === '1') { // Bruker avbrøt
        console.log("[PurchasesService] Bruker avbrøt kjøpet");
      } else {
        console.error("[PurchasesService] Kjøpsfeil:", error);
      }
      return false;
    }
  }

  public restorePurchases = async (): Promise<boolean> => {
    if (!this.isNative || !Purchases) {
      console.log("[PurchasesService] restorePurchases - ikke tilgjengelig på web");
      return false;
    }

    try {
      const result = await Purchases.restorePurchases();
      const isPro = !!result.customerInfo.entitlements.active[ENTITLEMENT_ID];
      
      await this.updateProStatus(isPro, 'restore');
      console.log("[PurchasesService] Gjenoppretting:", isPro ? 'PRO funnet' : 'Ingen PRO');
      
      return isPro;
    } catch (error) {
      console.error("[PurchasesService] Gjenopprettingsfeil:", error);
      return false;
    }
  }

  /**
   * Manuell setting av Pro-status - KUN FOR DEVELOPMENT/TESTING.
   * I produksjon på native vil dette bli overskrevet av RevenueCat ved neste sync.
   */
  public setProStatus = async (isPro: boolean): Promise<void> => {
    if (import.meta.env.PROD && this.isNative) {
      console.warn("[PurchasesService] setProStatus ignorert i produksjon - bruk RevenueCat");
      return;
    }
    await db.settings.update('settings', { userStatus: isPro ? 'pro' : 'free' });
    console.log(`[PurchasesService] DEV: Status manuelt satt til ${isPro ? 'PRO' : 'FREE'}`);
  }

  // Sjekk om vi kjører på native platform
  public isNativePlatform = (): boolean => {
    return this.isNative;
  }
}

export default new PurchasesService();
