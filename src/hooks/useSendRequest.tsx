// src/hooks/useSendRequest.tsx
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { useChecklistData } from './useChecklistData';
import { blobToBase64 } from '../utils/pdfUtils';
import type { NewVendor } from '../components/AddVendorModal';
import allVendors from '../data/vendors.json';
import regionsData from '../data/regions.json';

export const useSendRequest = () => {
  const { t, i18n } = useTranslation(['translation', 'regions']);
  const navigate = useNavigate();
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const toast = useToast();

  const numericInspectionId = inspectionId ? parseInt(inspectionId, 10) : undefined;
  const { isLoading, rows, settings, displayBoatModel } = useChecklistData(numericInspectionId);

  const [regionCode, setRegionCode] = useState('');
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [newVendors, setNewVendors] = useState<NewVendor[]>([]);
  const [userInfo, setUserInfo] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countryCode = settings?.countryCode || 'NO';
  const regionCodes = useMemo(() => {
    const typed = regionsData as Record<string, string[]>;
    return typed[countryCode] || [];
  }, [countryCode]);

  const filteredVendors = useMemo(() => {
    if (!regionCode) return [];
    return allVendors.filter(v => v.regions.includes(regionCode));
  }, [regionCode]);

  const handleVendorToggle = (vendorId: number) => {
    setSelectedVendorIds(prev => (prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]));
  };

  const handleAddVendor = (vendor: NewVendor) => {
    setNewVendors(prev => [...prev, vendor]);
  };

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (!displayBoatModel) return;
    setIsSubmitting(true);
    try {
      const [{ pdf }, { Report }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/Report')
      ]);

      const reportRows = rows.filter(r => r.state !== 'ok');
      const reportComponent = (
        <Report
          boatModel={displayBoatModel}
          rows={reportRows}
          fullImages={true}
          hideCosts={true}
          t_summary_of_inspection={t('pdf_report.title_full')}
          t_summary_for_tender={t('pdf_report.title_tender')}
          t_checkpoint={t('summary.findings_table.checkpoint')}
          t_status={t('common.status')}
          t_cost={t('summary.findings_table.cost_estimate')}
          t_appendix_title={t('pdf_report.appendix_title')}
          t_summary_text_no_findings={t('summary.assessment_text.no_findings')}
          t_summary_text_findings_intro={t('summary.assessment_text.findings_intro', { count: reportRows.length })}
          t_summary_text_high_crit={t('summary.assessment_text.high_crit', { count: reportRows.filter(r => r.criticality === 1).length })}
          t_summary_text_cost_4={t('summary.assessment_text.cost_4', { count: reportRows.filter(r => r.costIndicator === 4).length })}
          t_summary_text_cost_3={t('summary.assessment_text.cost_3', { count: reportRows.filter(r => r.costIndicator === 3).length })}
        />
      );
      const pdfBlob = await pdf(reportComponent).toBlob();
      const pdfBase64 = await blobToBase64(pdfBlob);

      const payload = { userInfo, selectedVendorIds, newVendors, pdfBase64, submittedInRegion: regionCode };
      const response = await fetch('/api/send-request.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorKey = `send_request_page.toast_error_${errorData.error || 'desc'}`;
        throw new Error(t(errorKey, t('send_request_page.toast_error_desc')));
      }

      toast({
        title: t('send_request_page.toast_success_title'),
        description: t('send_request_page.toast_success_desc'),
        status: 'success',
        duration: 5000,
        isClosable: true
      });

      navigate(`/summary/${inspectionId}`, { replace: true });
    } catch (error) {
      toast({
        title: t('send_request_page.toast_error_title'),
        description: error instanceof Error ? error.message : t('send_request_page.toast_error_desc'),
        status: 'error',
        duration: 9000,
        isClosable: true
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [displayBoatModel, rows, userInfo, selectedVendorIds, newVendors, regionCode, inspectionId, t, toast, navigate]);

  const isFormValid = (selectedVendorIds.length > 0 || newVendors.length > 0) && userInfo.name && userInfo.email;

  return {
    isLoading,
    rows,
    regionCode,
    setRegionCode,
    regionCodes,
    filteredVendors,
    selectedVendorIds,
    handleVendorToggle,
    newVendors,
    handleAddVendor,
    userInfo,
    handleUserInfoChange,
    isSubmitting,
    isFormValid,
    handleSubmit,
    t,
    tRegions: i18n.getFixedT(i18n.language, 'regions')
  };
};
