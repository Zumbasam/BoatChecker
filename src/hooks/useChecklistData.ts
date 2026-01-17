// src/hooks/useChecklistData.ts
import { useMemo, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../db';
import type { BoatModel, InspectionItem, Inspection } from '../db';

export type ChecklistItemType = { 
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  criticality?: number; 
  costIndicator?: number;
  engineTypes?: string[];
};

export type ChecklistArea = {
  id: string;
  title: string;
  items: ChecklistItemType[];
};

export type ChecklistData = {
  areas: ChecklistArea[];
};

export type Row = {
  id: string;
  label: string;
  state: "ok" | "obs" | "kritisk";
  criticality?: number;
  costIndicator?: number;
  note?: string;
  thumb?: string;
  photoFull?: string;
};

export const useChecklistData = (inspectionId?: number) => {
  const { i18n } = useTranslation();

  const storedInspection = useLiveQuery(
    () => inspectionId ? db.inspections.get(inspectionId) : undefined,
    [inspectionId]
  );
  const liveSettings = useLiveQuery(() => db.settings.get('settings'));
  const liveItems = useLiveQuery(() => db.items.toArray());
  const boatModelFromDb = useLiveQuery<BoatModel | undefined>(
    () => {
      const modelId = storedInspection?.boatDetails.boatModelId;
      return modelId ? db.models.get(modelId) : undefined;
    },
    [storedInspection]
  );
  
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  useEffect(() => {
    const loadChecklist = async () => {
      const lang = i18n.language.startsWith('en') ? 'en' : 'nb';
      const module = await import(`../data/checklist_${lang}.json`);
      setChecklistData(module.default);
    };
    loadChecklist();
  }, [i18n.language]);

  const inspectionData = useMemo<Partial<Inspection> | null>(() => {
    if (storedInspection && liveItems) {
      // Merge liveItems into the stored inspection
      return {
        ...storedInspection,
        items: liveItems,  // Bruk live items fra db.items tabellen
      };
    }
    if (storedInspection) {
      return storedInspection;
    }
    if (liveSettings && liveItems) {
      return {
        boatDetails: {
          name: '',
          manufacturer: '',
        },
        inspectionSettings: liveSettings as any,
        items: liveItems,
      };
    }
    return null;
  }, [storedInspection, liveSettings, liveItems]);
  
  const displayBoatModel: BoatModel | null = useMemo(() => {
    if (!inspectionData) return null;

    if (inspectionData.boatDetails?.boatModelId && boatModelFromDb) {
      return boatModelFromDb;
    }
    if (inspectionData.boatDetails?.customBoatDetails) {
      return {
        name: inspectionData.boatDetails.customBoatDetails.model,
        manufacturer: inspectionData.boatDetails.customBoatDetails.manufacturer,
        typePrimary: (inspectionData.inspectionSettings?.typePrimary?.toLowerCase() === 'sailboat' ? 'Sailboat' : 'Motorboat'),
        typeSecondary: (inspectionData.inspectionSettings?.typeSecondary as BoatModel['typeSecondary']) || 'Monohull',
        hullMaterial: (inspectionData.boatDetails.customBoatDetails.hullMaterial as BoatModel['hullMaterial']) || 'Fiberglass',
      };
    }
    if (storedInspection) {
      return {
        name: storedInspection.boatDetails.name,
        manufacturer: storedInspection.boatDetails.manufacturer,
        typePrimary: storedInspection.inspectionSettings.typePrimary || 'Motorboat',
        typeSecondary: (storedInspection.inspectionSettings.typeSecondary as BoatModel['typeSecondary']) || 'Monohull',
        hullMaterial: 'Fiberglass',
      };
    }
    return null;
  }, [inspectionData, boatModelFromDb, storedInspection]);

  const checklistItems: ChecklistItemType[] = useMemo(() => {
    if (!checklistData || !inspectionData || !displayBoatModel) return [];
    
    const modelTags = new Set<string>();
    modelTags.add("all");
    if (displayBoatModel.typePrimary) modelTags.add(displayBoatModel.typePrimary.toLowerCase());
    if (displayBoatModel.typeSecondary) modelTags.add(displayBoatModel.typeSecondary.toLowerCase());
    if (displayBoatModel.hullMaterial) modelTags.add(displayBoatModel.hullMaterial.toLowerCase());

    const allChecklistItems = checklistData.areas.flatMap((a) => a.items);
    const userEngineType = inspectionData.inspectionSettings?.engineType;
    return allChecklistItems.filter((i) => {
      const hasMatchingTag = i.tags?.some((tag) => modelTags.has(tag.toLowerCase())) ?? false;
      if (!hasMatchingTag) return false;
      if (i.engineTypes && i.engineTypes.length > 0) {
        return userEngineType ? i.engineTypes.includes(userEngineType) : false;
      }
      return true;
    });
  }, [checklistData, displayBoatModel, inspectionData]);

  const rows: Row[] = useMemo(() => {
    const merged = new Map<string, InspectionItem>();
    (storedInspection?.items ?? []).forEach((s) => merged.set(s.id, s));
    (liveItems ?? []).forEach((s) => merged.set(s.id, s));
    const sourceItems = Array.from(merged.values());
    if (!sourceItems || !checklistItems) return [];
    
    const stateOrder = { 'kritisk': 1, 'obs': 2, 'ok': 3 } as const;

    return sourceItems
      .map((s) => {
        const itemDef = checklistItems.find((i) => i.id === s.id);
        return {
          id: s.id,
          label: itemDef?.title ?? s.id,
          state: s.state as Row["state"],
          criticality: itemDef?.criticality,
          costIndicator: itemDef?.costIndicator,
          note: (s as any).note,
          thumb: (s as any).photoThumb,
          photoFull: (s as any).photoFull,
        };
      })
      .sort((a, b) => {
        const stateDiff = (stateOrder[a.state] || 99) - (stateOrder[b.state] || 99);
        if (stateDiff !== 0) return stateDiff;

        const critDiff = (a.criticality ?? 3) - (b.criticality ?? 3);
        if (critDiff !== 0) return critDiff;

        return (b.costIndicator ?? 1) - (a.costIndicator ?? 1);
      });
  }, [storedInspection, liveItems, checklistItems]);

  return {
    isLoading: !checklistData || !inspectionData || !displayBoatModel,
    checklistItems,
    rows,
    displayBoatModel,
    settings: inspectionData?.inspectionSettings,
    inspection: inspectionData,
  };
};