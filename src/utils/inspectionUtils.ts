// src/utils/inspectionUtils.ts
import { db } from '../db';
import type { Settings, Inspection } from '../db';

export const createNewInspection = async (settings: Settings): Promise<number> => {
  const s = settings as any;
  const boatDetails = s.customBoatDetails 
    ? {
        customBoatDetails: s.customBoatDetails,
        name: s.customBoatDetails.model,
        manufacturer: s.customBoatDetails.manufacturer,
      }
    : {
        boatModelId: s.boatModelId,
        name: 'Ukjent Båtnavn',
        manufacturer: 'Ukjent Produsent',
      };

  if (s.boatModelId) {
    const model = await db.models.get(s.boatModelId);
    if (model) {
      boatDetails.name = model.name;
      boatDetails.manufacturer = model.manufacturer;
    }
  }

  const newInspection: Inspection = {
    name: `${boatDetails.manufacturer} ${boatDetails.name}`,
    status: 'in_progress',
    createdAt: new Date(),
    boatDetails: boatDetails,
    inspectionSettings: {
      countryCode: s.countryCode,
      typePrimary: s.typePrimary,
      typeSecondary: s.typeSecondary,
      engineType: s.engineType,
    },
    items: [],
	reportDownloaded: false,
  };

  const newId = await db.inspections.add(newInspection);
  return newId;
};