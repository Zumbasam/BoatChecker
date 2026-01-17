// src/utils/buildReportElement.tsx
import { Report } from '../components/Report';
import type { BoatModel } from '../db';
import type { Row } from '../hooks/useChecklistData';

export type AreaGroup = {
  id: string;
  title: string;
  items: Row[];
};

type Customer = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

type Params = {
  rows: Row[];
  boatModel: BoatModel;
  t: (key: string, opts?: any) => string;
  variant: 'full' | 'fast' | 'anbud';
  customer?: Customer;
  groupedByArea?: AreaGroup[];
};

export function buildReportElement({ rows, boatModel, t, variant, customer, groupedByArea }: Params) {
  const summaryStats = {
    criticality1: rows.filter(r => r.criticality === 1).length,
    cost4: rows.filter(r => r.costIndicator === 4).length,
    cost3: rows.filter(r => r.costIndicator === 3).length,
  };

  return (
    <Report
      rows={rows}
      boatModel={boatModel}
      fullImages={variant === 'full'}
      hideCosts={variant === 'anbud'}
      t_summary_of_inspection={t('pdf_report.title_full')}
      t_summary_for_tender={t('pdf_report.title_tender')}
      t_checkpoint={t('summary.findings_table.checkpoint')}
      t_status={t('common.status')}
      t_cost={t('summary.findings_table.cost_estimate')}
      t_appendix_title={t('pdf_report.appendix_title')}
      t_summary_text_no_findings={t('summary.assessment_text.no_findings')}
      t_summary_text_findings_intro={t('summary.assessment_text.findings_intro', { count: rows.length })}
      t_summary_text_high_crit={t('summary.assessment_text.high_crit', { count: summaryStats.criticality1 })}
      t_summary_text_cost_4={t('summary.assessment_text.cost_4', { count: summaryStats.cost4 })}
      t_summary_text_cost_3={t('summary.assessment_text.cost_3', { count: summaryStats.cost3 })}
      user={{
        name: customer?.name ?? undefined,
        email: customer?.email ?? undefined,
        phone: customer?.phone ?? undefined,
      }}
      getAreaLabel={(row: Row) => {
        if (!groupedByArea) return '';
        const group = groupedByArea.find(g => g.items.some(item => item.id === row.id));
        return group?.title || '';
      }}
    />
  );
}