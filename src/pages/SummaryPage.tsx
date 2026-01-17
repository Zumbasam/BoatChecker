// src/pages/SummaryPage.tsx
import React, { useEffect } from 'react';
import { SummaryView } from '../components/summary/SummaryView';
import type { BoatModel, Inspection } from '../db';
import { db } from '../db';
import { useUserStatus } from '../hooks/useUserStatus';
import { useInspectionData } from '../contexts/InspectionDataProvider';

export const SummaryPage: React.FC = () => {
  const userStatus = useUserStatus();
  const { rows, displayBoatModel, inspection } = useInspectionData();

  useEffect(() => {
    const markReportConsumed = async () => {
      if (!inspection) return;
      if (userStatus.isPro) return;
      const insp = await db.inspections.get(inspection.id!);
      if (!insp || insp.reportCounted) return;
      await db.transaction('rw', db.settings, db.inspections, async () => {
        const s = await db.settings.get('settings');
        const current = s?.reportsGenerated ?? 0;
        await db.inspections.update(inspection.id!, { reportCounted: true });
        await db.settings.put({ ...(s ?? { key: 'settings', userStatus: 'free' }), reportsGenerated: current + 1 });
      });
    };
    markReportConsumed();
  }, [inspection, userStatus.isPro]);

  return (
    <SummaryView
      rows={rows}
      displayBoatModel={displayBoatModel as BoatModel}
      inspection={inspection as Inspection}
    />
  );
};