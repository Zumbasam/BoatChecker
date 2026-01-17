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

      // Lytt til endringer i kundeinfo
      Purchases.addCustomerInfoUpdateListener(async (customerInfo) => {
        const isPro = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        await db.settings.update('settings', { userStatus: isPro ? 'pro' : 'free' });
        console.log("[PurchasesService] Status oppdatert:", isPro ? 'PRO' : 'FREE');
      });

    } catch (error) {
      console.error("[PurchasesService] Feil ved initialisering:", error);
    }
  }

  public getOfferings = async (): Promise<PurchasesPackage[]> => {
    if (!this.isNative || !Purchases) {
      console.log("[PurchasesService] getOfferings - web stub (tom liste)");
      return [];
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
    if (!this.isNative || !Purchases || !pack.rcPackage) {
      console.log("[PurchasesService] purchasePackage - kan ikke kjøpe på web");
      return false;
    }

    try {
      const result = await Purchases.purchasePackage({ aPackage: pack.rcPackage });
      const isPro = !!result.customerInfo.entitlements.active[ENTITLEMENT_ID];
      
      if (isPro) {
        await db.settings.update('settings', { userStatus: 'pro' });
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
      
      await db.settings.update('settings', { userStatus: isPro ? 'pro' : 'free' });
      console.log("[PurchasesService] Gjenoppretting:", isPro ? 'PRO funnet' : 'Ingen PRO');
      
      return isPro;
    } catch (error) {
      console.error("[PurchasesService] Gjenopprettingsfeil:", error);
      return false;
    }
  }

  // Hjelpemetode for manuell oppgradering (kun for testing/admin)
  public setProStatus = async (isPro: boolean): Promise<void> => {
    await db.settings.update('settings', { userStatus: isPro ? 'pro' : 'free' });
    console.log(`[PurchasesService] Status manuelt satt til ${isPro ? 'PRO' : 'FREE'}`);
  }

  // Sjekk om vi kjører på native platform
  public isNativePlatform = (): boolean => {
    return this.isNative;
  }
}

export default new PurchasesService();
