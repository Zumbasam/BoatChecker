// src/utils/seedDatabase.ts
import { db, type BoatModel } from '../db';
import boatModels from '../data/boat_models.json';

const APP_VERSION = import.meta.env.PACKAGE_VERSION;
const SEED_VERSION_KEY = 'database_seed_version';

export const seedDatabase = async () => {
  // --- START PÅ OPPDATERT KODE ---
  // Steg 1: Håndter settings FØRST og helt separat.
  try {
    const settings = await db.settings.get('settings');
    
    if (!settings) {
      // Tilfelle 1: Helt ny bruker, ingen settings finnes.
      console.log('⚙️ Oppretter standard innstillinger for ny bruker...');
      await db.settings.put({ 
        key: 'settings', 
        language: 'nb',
        userStatus: 'free',
        reportsGenerated: 0,
        contributeData: true,  // Aktivert som standard
      });
    } else if (settings.userStatus === undefined) {
      // Tilfelle 2: Eksisterende bruker som mangler de nye Freemium-feltene.
      console.log('⚙️ Oppgraderer innstillinger for eksisterende bruker...');
      await db.settings.update('settings', {
        userStatus: 'free',
        reportsGenerated: 0,
        contributeData: true,  // Aktivert som standard
      });
    } else if (settings.contributeData === undefined) {
      // Tilfelle 3: Eksisterende bruker som mangler contributeData-feltet.
      console.log('⚙️ Aktiverer datainnsamling for eksisterende bruker...');
      await db.settings.update('settings', {
        contributeData: true,
      });
    }
  } catch (error) {
    console.error("Feil ved initialisering av settings:", error);
    // Vi stopper ikke her, slik at modelldatabasen fortsatt kan prøve å oppdatere seg.
  }

  // Steg 2: Håndter oppdatering av båtmodeller separat.
  const lastSeedVersion = localStorage.getItem(SEED_VERSION_KEY);

  if (lastSeedVersion === APP_VERSION) {
    return; // Modelldatabasen er allerede oppdatert.
  }

  try {
    console.log(`🛥️ Oppdaterer modelldatabasen til versjon ${APP_VERSION}...`);
    
    // Transaksjon kun for modeller for å sikre atomisk operasjon.
    await db.transaction('rw', db.models, async () => {
      await db.models.clear();
	    await db.models.bulkPut(boatModels as BoatModel[]);
    });

    localStorage.setItem(SEED_VERSION_KEY, APP_VERSION);
    console.log(`🛥️ Databasen er nå oppdatert med ${boatModels.length} modeller.`);

  } catch (error) {
    console.error("Feil ved oppdatering av modelldatabasen:", error);
  }
  // --- SLUTT PÅ OPPDATERT KODE ---
};