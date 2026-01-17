// src/db.ts
import Dexie from 'dexie';

export interface CustomBoatDetails {
  manufacturer: string;
  model: string;
  year: string;
  hullMaterial?: string;
  engineType?: 'inboard' | 'outboard' | null;
  typeSecondary?: 'Monohull' | 'Multihull';
  // Nye utvidede felter
  loa?: number;           // Lengde (meter)
  beam?: number;          // Bredde (meter)
  draft?: number;         // Dybde/dypgang (meter)
  displacement?: number;  // Deplasement (kg)
  engineMake?: string;    // Motor merke/modell
  enginePower?: number;   // Motoreffekt (hk)
  engineHours?: number;   // Motortimer
  fuelType?: 'diesel' | 'petrol' | 'electric' | 'hybrid';
  hin?: string;           // Hull Identification Number
  registrationNumber?: string;  // Registreringsnummer
  listingUrl?: string;    // Annonse-URL (referanse)
}

export interface Settings {
  key: 'settings';
  language?: 'nb' | 'en';
  userStatus?: 'free' | 'pro';
  reportsGenerated?: number;
  contributeData?: boolean;  // Opt-in for anonym datainnsamling
}

export interface InspectionItem {
  id: string;
  state: 'ok' | 'obs' | 'kritisk';
  note?: string;
  photoThumb?: string;
  photoFull?: string;
}

export interface InspectionMetadata {
  inspectorName?: string;           // Inspektørens navn
  inspectionLocation?: string;      // Hvor inspeksjonen ble utført
  boatLocation?: 'land' | 'water';  // Båt på land eller i vannet
  weatherConditions?: string;       // Værforhold under inspeksjon
  overallAssessment?: 'recommended' | 'with_reservations' | 'not_recommended';
  assessmentNotes?: string;         // Tilleggskommentarer til vurdering
}

export interface Inspection {
  id?: number;
  name: string;
  status: 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;               // Når inspeksjonen ble fullført
  boatDetails: {
    boatModelId?: number;
    customBoatDetails?: CustomBoatDetails;
    name: string;
    manufacturer: string;
  };
  inspectionSettings: {
    countryCode?: string;
    typePrimary?: 'Sailboat' | 'Motorboat';
    typeSecondary?: string;
    engineType?: 'inboard' | 'outboard' | 'both' | null;
  };
  metadata?: InspectionMetadata;    // Ny: inspeksjonsmetadata
  items: InspectionItem[];
  reportDownloaded?: boolean;
  reportCounted?: boolean;
}

export interface BoatModel {
  id?: number;
  name: string;
  manufacturer: string;
  typePrimary: 'Sailboat' | 'Motorboat';
  typeSecondary: 'Monohull' | 'Multihull';
  hullMaterial: 'Fiberglass' | 'Steel' | 'Wood' | 'Aluminum';
  engineType?: 'inboard' | 'outboard' | 'both' | null;
  yearFrom?: number;
  yearTo?: number;
  loa?: number;
  beam?: number;
  draft?: number;
  displacement?: number;
  imageUrl?: string;
  designer?: string;
  knownIssues?: string[];
  marketSegment?: 'Budget' | 'Mid-range' | 'Premium' | 'Luxury';
  ownersManualUrl?: string;
  forumUrl?: string;
}

class BoatCheckerDB extends Dexie {
  settings: Dexie.Table<Settings, string>;
  inspections: Dexie.Table<Inspection, number>;
  models: Dexie.Table<BoatModel, number>;
  items: Dexie.Table<InspectionItem, string>;

  constructor() {
    super('boatchecker');

    this.version(12).stores({
      settings: 'key',
      inspections: '++id, name, createdAt, reportDownloaded, reportCounted',
      models: '++id, manufacturer, typePrimary, typeSecondary',
      items: 'id',
    });

    this.version(11).stores({
      settings: 'key',
      inspections: '++id, name, createdAt, reportDownloaded, reportCounted',
      models: '++id, manufacturer, typePrimary, typeSecondary'
    });

    this.version(10).stores({
      settings: 'key',
      inspections: '++id, name, createdAt, reportDownloaded',
      models: '++id, manufacturer, typePrimary, typeSecondary'
    });

    this.version(9).stores({
      settings: 'key',
      items: 'id',
      models: '++id, manufacturer, typePrimary, typeSecondary'
    });

    this.settings = this.table('settings');
    this.inspections = this.table('inspections');
    this.models = this.table('models');
    this.items = this.table('items');
  }
}

export const db = new BoatCheckerDB();