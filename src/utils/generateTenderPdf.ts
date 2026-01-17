// src/utils/generateTenderPdf.ts
import { pdf } from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import { buildReportElement, type AreaGroup } from './buildReportElement';
import type { Row } from '../hooks/useChecklistData';
import type { BoatModel } from '../db';

type Params = {
  rows: Row[];
  boatModel: BoatModel;
  t: (key: string, opts?: any) => string;
  customer: { name: string; email: string; phone?: string | null };
  groupedByArea?: AreaGroup[];
};

export async function generateTenderPdfBlob({ rows, boatModel, t, customer, groupedByArea }: Params) {
  const element = buildReportElement({
    rows,
    boatModel,
    t,
    variant: 'anbud',
    customer,
    groupedByArea,
  }) as ReactElement<any>;
  return await pdf(element).toBlob();
}
