// src/components/stepper/SummaryViewWrapper.tsx
import React, { useEffect } from 'react';
import { SummaryView } from '../summary/SummaryView';
import type { BoatModel, Inspection } from '../../db';
import type { Row } from '../../hooks/useChecklistData';

interface Props {
  rows: Row[];
  displayBoatModel: BoatModel;
  inspection: Inspection;
  onSubmitAnonymousData: () => void;
}

export const SummaryViewWrapper: React.FC<Props> = ({ rows, displayBoatModel, inspection, onSubmitAnonymousData }) => {
  useEffect(() => {
    onSubmitAnonymousData();
  }, [onSubmitAnonymousData]);

  return (
    <SummaryView
      rows={rows}
      displayBoatModel={displayBoatModel}
      inspection={inspection}
    />
  );
};
