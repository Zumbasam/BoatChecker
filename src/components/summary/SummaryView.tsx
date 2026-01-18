// src/components/summary/SummaryView.tsx
import React, { useMemo, useState } from 'react';
import { Box, VStack, useDisclosure } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../db';
import type { BoatModel, Inspection, InspectionMetadata } from '../../db';
import { useUserStatus } from '../../hooks/useUserStatus';
import { handleStartNewInspection } from '../../utils/userActions';
import SummaryHeader from './SummaryHeader';
import { SummaryAssessment } from './SummaryAssessment';
import { SummaryControls } from './SummaryControls';
import { FindingsGroup } from './FindingsGroup';
import { SummaryFooter } from './SummaryFooter';
import InspectionMetadataModal from '../InspectionMetadataModal';
import BoatInsights from '../BoatInsights';
import type { Row, GroupBy, PrimaryFilter, ExtraFilter } from './utils';

interface Props {
  rows: Row[];
  displayBoatModel: BoatModel;
  inspection: Inspection;
}

export const SummaryView: React.FC<Props> = ({ rows, displayBoatModel, inspection }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const userStatus = useUserStatus();
  const { isOpen: isMetadataOpen, onOpen: onMetadataOpen, onClose: onMetadataClose } = useDisclosure();

  const [downloading, setDownloading] = useState<null | 'full' | 'fast'>(null);
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>('all');
  const [extraFilter, setExtraFilter] = useState<ExtraFilter>('none');
  const [groupBy, setGroupBy] = useState<GroupBy>('severity');
  const [currentMetadata, setCurrentMetadata] = useState<InspectionMetadata | undefined>(inspection.metadata);

  const handleSaveMetadata = async (metadata: InspectionMetadata) => {
    setCurrentMetadata(metadata);
    await db.inspections.update(inspection.id!, { metadata });
  };

  const summaryStats = useMemo(
    () => ({
      criticality1: rows.filter(r => r.criticality === 1).length,
      cost4: rows.filter(r => r.costIndicator === 4).length,
      cost3: rows.filter(r => r.costIndicator === 3).length
    }),
    [rows]
  );

  const handleStreamPdf = async (variant: 'full' | 'fast') => {
    setDownloading(variant);
    try {
      const [{ savePdfStream }, { Report }] = await Promise.all([
        import('../../utils/savePdfStream'),
        import('../Report')
      ]);

      // Filtrer ut OK og not_assessed fra hovedtabellen
      const reportRows = rows.filter(r => r.state !== 'ok' && r.state !== 'not_assessed');
      // Samle ikke-vurderte punkter for egen seksjon
      const notAssessedRows = rows.filter(r => r.state === 'not_assessed');
      await savePdfStream({
        pdfDocument: (
          <Report
            boatModel={displayBoatModel}
            customBoatDetails={inspection.boatDetails.customBoatDetails}
            inspectionMetadata={currentMetadata}
            inspectionDate={inspection.createdAt}
            rows={reportRows}
            notAssessedRows={notAssessedRows}
            fullImages={variant === 'full'}
            hideCosts={false}
            t_summary_of_inspection={t('pdf_report.title_full')}
            t_summary_for_tender={t('pdf_report.title_tender')}
            t_checkpoint={t('summary.findings_table.checkpoint')}
            t_status={t('common.status')}
            t_cost={t('summary.findings_table.cost_estimate')}
            t_appendix_title={t('pdf_report.appendix_title')}
            t_summary_text_no_findings={t('summary.assessment_text.no_findings')}
            t_summary_text_findings_intro={t('summary.assessment_text.findings_intro', { count: reportRows.length })}
            t_summary_text_high_crit={t('summary.assessment_text.high_crit', { count: summaryStats.criticality1 })}
            t_summary_text_cost_4={t('summary.assessment_text.cost_4', { count: summaryStats.cost4 })}
            t_summary_text_cost_3={t('summary.assessment_text.cost_3', { count: summaryStats.cost3 })}
            t_boat_details={{
              year: t('boat_details.year'),
              loa: t('boat_details.loa'),
              beam: t('boat_details.beam'),
              draft: t('boat_details.draft'),
              displacement: t('boat_details.displacement'),
              engine: t('boat_details.engine_make'),
              hin: t('boat_details.hin'),
              registration: t('boat_details.registration'),
              listing_url: t('boat_details.listing_url')
            }}
            t_inspection_details={{
              title: t('modals.inspection_metadata.title'),
              inspector: t('modals.inspection_metadata.inspector_name_label'),
              location: t('modals.inspection_metadata.location_label'),
              boat_location: t('modals.inspection_metadata.boat_location_label'),
              weather: t('modals.inspection_metadata.weather_label'),
              date: t('pdf_report.date', { defaultValue: 'Dato' }),
              on_land: t('modals.inspection_metadata.boat_on_land'),
              in_water: t('modals.inspection_metadata.boat_in_water')
            }}
            t_assessment={{
              recommended: t('modals.inspection_metadata.assessment_recommended'),
              with_reservations: t('modals.inspection_metadata.assessment_reservations'),
              not_recommended: t('modals.inspection_metadata.assessment_not_recommended'),
              notes: t('modals.inspection_metadata.assessment_notes_label')
            }}
            t_not_assessed={{
              section_title: t('pdf_report.not_assessed_title'),
              explanation: t('pdf_report.not_assessed_explanation')
            }}
          />
        ),
        fileName: 'boatchecker-report.pdf'
      });
      if (!userStatus.isPro && !inspection.reportDownloaded) {
        await db.inspections.update(inspection.id!, { reportDownloaded: true });
      }
    } finally {
      setDownloading(null);
    }
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (primaryFilter === 'critical') list = list.filter(r => r.state === 'kritisk');
    if (primaryFilter === 'obs') list = list.filter(r => r.state === 'obs');
    if (extraFilter === 'with_images') list = list.filter(r => r.thumb || r.photoFull);
    if (extraFilter === 'with_notes') list = list.filter(r => r.note && String(r.note).trim() !== '');
    return list;
  }, [rows, primaryFilter, extraFilter]);

  const groups = useMemo(() => {
    const g: { key: string; label: string; items: Row[] }[] = [];
    if (groupBy === 'severity') {
      const buckets: Record<string, Row[]> = { '1': [], '2': [], '3': [], other: [] };
      filtered.forEach(r => {
        const k = r.criticality === 1 ? '1' : r.criticality === 2 ? '2' : r.criticality === 3 ? '3' : 'other';
        buckets[k].push(r);
      });
      const order: Array<[string, string]> = [
        ['1', t('summary.group.high_severity', { defaultValue: 'Høy kritikalitet' })],
        ['2', t('summary.group.medium_severity', { defaultValue: 'Middels kritikalitet' })],
        ['3', t('summary.group.low_severity', { defaultValue: 'Lav kritikalitet' })],
        ['other', t('summary.group.ungrouped', { defaultValue: 'Andre' })]
      ];
      order.forEach(([key, label]) => {
        if (buckets[key].length) g.push({ key, label: `${label} (${buckets[key].length})`, items: buckets[key] });
      });
    } else {
      const buckets: Record<string, Row[]> = { '4': [], '3': [], '2': [], '1': [], '0': [] };
      filtered.forEach(r => {
        const k = String(r.costIndicator || 0) as keyof typeof buckets;
        buckets[k].push(r);
      });
      const order: Array<[keyof typeof buckets, string]> = [
        ['4', '$$$$'],
        ['3', '$$$'],
        ['2', '$$'],
        ['1', '$'],
        ['0', t('summary.group.no_cost', { defaultValue: 'Ingen kostnadsindikasjon' })]
      ];
      order.forEach(([key, label]) => {
        if (buckets[key].length) g.push({ key: String(key), label: `${label} (${buckets[key].length})`, items: buckets[key] });
      });
    }
    return g;
  }, [filtered, groupBy, t]);

  // Create inspection with current metadata for display
  const inspectionWithMetadata = { ...inspection, metadata: currentMetadata };

  return (
    <>
      <InspectionMetadataModal
        isOpen={isMetadataOpen}
        onClose={onMetadataClose}
        onSave={handleSaveMetadata}
        initialData={currentMetadata}
      />
      
      <Box p={4} pb="140px">
        <SummaryHeader 
          displayBoatModel={displayBoatModel} 
          inspection={inspectionWithMetadata}
          onEditMetadata={onMetadataOpen}
        />
        <VStack spacing={6} align="stretch">
          <SummaryAssessment rows={rows} />
          
          {/* Statistikk-baserte innsikter (vises kun når data er tilgjengelig) */}
          <BoatInsights 
            manufacturer={displayBoatModel.manufacturer}
            model={displayBoatModel.name}
          />
          
          <SummaryControls
            primaryFilter={primaryFilter}
            onPrimaryChange={setPrimaryFilter}
            extraFilter={extraFilter}
            onExtraFilterChange={setExtraFilter}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
          />
          {groups.map(g => (
            <FindingsGroup key={g.key} label={g.label} items={g.items} />
          ))}
        </VStack>
      </Box>

      <SummaryFooter
        inspectionId={inspection.id!}
        downloading={downloading}
        onDownload={handleStreamPdf}
        onSend={() => {
          if (userStatus.isPro) {
            navigate(`/send-request/${inspection.id}`);
          } else {
            navigate('/upgrade', { state: { from: location.pathname + location.search, backTo: 'summary' } });
          }
        }}
        onStartNew={() =>
          handleStartNewInspection(userStatus, navigate, () => {}, t, location.pathname + location.search)
        }
      />
    </>
  );
};
