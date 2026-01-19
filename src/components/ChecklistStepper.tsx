// src/components/ChecklistStepper.tsx
import React, { useCallback, useMemo, useEffect } from "react";
import { Box, Progress, Text, Flex, Button, VStack, useDisclosure, Heading } from "@chakra-ui/react";
import { useSteps } from "@chakra-ui/stepper";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { db } from "../db";
import { useUserStatus } from "../hooks/useUserStatus";
import { QuestionView } from "./stepper/QuestionView";
import { SummaryViewWrapper } from "./stepper/SummaryViewWrapper";
import { FeedbackDrawer } from "./feedback/FeedbackDrawer";
import { StatusDrawer } from "./stepper/StatusDrawer";
import type { BoatModel, Inspection } from "../db";
import type { ChecklistItemType, Row } from '../hooks/useChecklistData';
import { useInspectionData } from '../contexts/InspectionDataProvider';
import { StatusButtonPortal } from './StatusButtonPortal';
import AnalyticsService from '../services/AnalyticsService';
import { getAccessLevel, isItemLocked, type AccessLevel } from '../utils/accessLevel';

export const ChecklistStepper: React.FC = () => {
  const { checklistItems, rows, displayBoatModel, inspection } = useInspectionData();
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const numericInspectionId = inspectionId ? parseInt(inspectionId, 10) : undefined;
  return <ChecklistStepperContent inspectionId={numericInspectionId} checklistItems={checklistItems} rows={rows} displayBoatModel={displayBoatModel} inspection={inspection} />;
};

const ChecklistStepperContent: React.FC<{
  inspectionId: number | undefined,
  checklistItems: ChecklistItemType[],
  rows: Row[],
  displayBoatModel: BoatModel | null,
  inspection: any,
}> = ({ inspectionId, checklistItems, rows, displayBoatModel, inspection }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isPro } = useUserStatus();
  
  // Beregn tilgangsnivå basert på Pro-status og inspeksjonens unlock-status
  const accessLevel: AccessLevel = useMemo(() => 
    getAccessLevel(isPro, inspection as Inspection | null), 
    [isPro, inspection]
  );

  useEffect(() => {
    console.log('[ChecklistStepper] route', location.pathname);
  }, [location]);

  useEffect(() => {
    console.log('[ChecklistStepper] provider', {
      inspectionId,
      checklistItemsLen: checklistItems?.length ?? null,
      rowsLen: rows?.length ?? null,
      hasDisplayBoatModel: !!displayBoatModel,
      hasInspection: !!inspection,
      firstRowState: rows?.[0]?.state ?? null,
    });
  }, [inspectionId, checklistItems, rows, displayBoatModel, inspection]);

  if (!Array.isArray(checklistItems) || !displayBoatModel) {
    return (
      <VStack spacing={4} p={8} textAlign="center">
        <Heading size="md">Laster sjekkliste...</Heading>
        <Text color="gray.500">Vent et øyeblikk.</Text>
      </VStack>
    );
  }

  const persistedKey = inspectionId != null ? `checklist:step:${inspectionId}` : null;
  const persisted = persistedKey ? Number(sessionStorage.getItem(persistedKey) || '0') : 0;
  const restoreTo = (location.state as any)?.restoreTo as string | undefined;
  const gotoItemId = (location.state as any)?.gotoItemId as string | undefined;
  
  // Beregn initialIndex basert på state
  const initialIndex = useMemo(() => {
    if (restoreTo === 'summary') return checklistItems.length;
    if (gotoItemId) {
      // Finn index til det spesifikke punktet
      const idx = checklistItems.findIndex(item => item.id === gotoItemId);
      if (idx !== -1) return idx;
    }
    return Math.min(persisted, checklistItems.length);
  }, [restoreTo, gotoItemId, checklistItems, persisted]);

  const { activeStep, setActiveStep } = useSteps({ index: initialIndex, count: checklistItems.length + 1 });
  const isSummary = activeStep === checklistItems.length && checklistItems.length > 0;

  const { isOpen: isFeedbackOpen, onOpen: onFeedbackOpen, onClose: onFeedbackClose } = useDisclosure();
  const { isOpen: isStatusOpen, onOpen: onStatusOpen, onClose: onStatusClose } = useDisclosure();

  useEffect(() => {
    const handler = () => onStatusOpen();
    window.addEventListener('open-status-drawer' as any, handler as any);
    console.log('[ChecklistStepper] statusDrawer event bound');
    return () => {
      window.removeEventListener('open-status-drawer' as any, handler as any);
      console.log('[ChecklistStepper] statusDrawer event unbound');
    };
  }, [onStatusOpen]);

  useEffect(() => {
    const handler = () => onFeedbackOpen();
    window.addEventListener('open-feedback-drawer' as any, handler as any);
    console.log('[ChecklistStepper] feedbackDrawer event bound');
    return () => {
      window.removeEventListener('open-feedback-drawer' as any, handler as any);
      console.log('[ChecklistStepper] feedbackDrawer event unbound');
    };
  }, [onFeedbackOpen]);

  useEffect(() => {
    const handler = (e: Event) => {
      const itemId = (e as CustomEvent<{ itemId: string }>).detail?.itemId;
      if (!itemId) return;
      const idx = checklistItems.findIndex(ci => ci.id === itemId);
      if (idx >= 0) setActiveStep(idx);
    };
    window.addEventListener('goto-inspection-item' as any, handler as any);
    return () => window.removeEventListener('goto-inspection-item' as any, handler as any);
  }, [checklistItems, setActiveStep]);

  useEffect(() => {
    if (persistedKey) sessionStorage.setItem(persistedKey, String(activeStep));
  }, [activeStep, persistedKey]);

  useEffect(() => {
    if (restoreTo === 'summary' && activeStep !== checklistItems.length) {
      setActiveStep(checklistItems.length);
    }
  }, [restoreTo, checklistItems.length, activeStep, setActiveStep]);

  useEffect(() => {
    if (activeStep > checklistItems.length) {
      setActiveStep(checklistItems.length);
    }
    if (activeStep < 0) {
      setActiveStep(0);
    }
  }, [activeStep, checklistItems.length, setActiveStep]);

  const stats = useMemo(() => {
    const ok = rows.filter(r => r.state === 'ok').length;
    const obs = rows.filter(r => r.state === 'obs').length;
    const critical = rows.filter(r => r.state === 'kritisk').length;
    const highCrit = rows.filter(r => r.criticality === 1).length;
    return { ok, obs, critical, highCrit, total: ok + obs + critical };
  }, [rows]);

  useEffect(() => {
    console.log('[ChecklistStepper] stats', stats);
  }, [stats]);

  useEffect(() => {
    console.log('[ChecklistStepper] activeStep', { activeStep, isSummary, checklistItemsLen: checklistItems.length });
  }, [activeStep, isSummary, checklistItems.length]);

  useEffect(() => {
    console.log('[ChecklistStepper] statusDrawer', { isStatusOpen });
  }, [isStatusOpen]);

  useEffect(() => {
    const markReportConsumed = async () => {
      if (!isSummary) return;
      if (!inspectionId) return;
      if (isPro) return;
      const insp = await db.inspections.get(inspectionId);
      if (!insp || insp.reportCounted) return;
      await db.transaction('rw', db.settings, db.inspections, async () => {
        const s = await db.settings.get('settings');
        const current = s?.reportsGenerated ?? 0;
        await db.inspections.update(inspectionId, { reportCounted: true });
        await db.settings.put({ ...(s ?? { key: 'settings', userStatus: 'free' }), reportsGenerated: current + 1 });
      });
    };
    markReportConsumed();
  }, [isSummary, inspectionId, isPro]);

  // Ny strategi: Summary er alltid tilgjengelig, begrensning kun på PDF-eksport og låste punkter
  const handleNextClick = async () => {
    // Auto-sett state hvis brukeren ikke har markert noe
    const currentItem = checklistItems[activeStep];
    if (currentItem) {
      const existingItem = await db.items.get(currentItem.id);
      if (!existingItem) {
        // Sjekk om punktet er låst basert på tilgangsnivå
        const itemIsLocked = isItemLocked(accessLevel, currentItem.criticality);
        
        // Låste punkter = "not_assessed", åpne punkter = "ok"
        await db.items.put({
          id: currentItem.id,
          state: itemIsLocked ? 'not_assessed' : 'ok',
        });
      }
    }

    if (activeStep === checklistItems.length - 1 && inspectionId) {
      await db.inspections.update(inspectionId, { status: 'completed' });
    }
    setActiveStep(s => s + 1);
  };

  const submitAnonymousData = useCallback(async () => {
    if (sessionStorage.getItem(`dataSubmitted_${inspectionId}`)) return;
    if (!inspection || !displayBoatModel || rows.length === 0) return;
    
    try {
      const success = await AnalyticsService.submitFindings(inspection, displayBoatModel);
      if (success) {
        sessionStorage.setItem(`dataSubmitted_${inspectionId}`, 'true');
        console.log('[ChecklistStepper] Anonyme funn sendt');
      }
    } catch (error) {
      console.error("Feil ved innsending av anonym data:", error);
    }
  }, [inspection, displayBoatModel, rows, inspectionId]);

  const progress = checklistItems.length > 0 ? Math.round((activeStep / checklistItems.length) * 100) : 0;

  const activeItemForFeedback = useMemo(() => {
    if (checklistItems.length === 0) return undefined;
    const idx = Math.min(activeStep, checklistItems.length - 1);
    return checklistItems[idx];
  }, [checklistItems, activeStep]);

  return (
    <Box>
      <StatusButtonPortal />
      {!isSummary && (
        <Flex align="center" px={4} py={1}>
          <Progress value={progress} size="sm" rounded="full" flex="1" />
          <Text fontSize="xs" ml={3} minWidth="50px" textAlign="right" color="gray.500">
            {checklistItems.length > 0 ? Math.min(activeStep + 1, checklistItems.length) : 0} / {checklistItems.length}
          </Text>
        </Flex>
      )}
      {isSummary
        ? <SummaryViewWrapper
            rows={rows}
            displayBoatModel={displayBoatModel as BoatModel}
            onSubmitAnonymousData={submitAnonymousData}
            inspection={inspection}
          />
        : checklistItems.length > 0 && checklistItems[activeStep]
        ? <QuestionView
            key={checklistItems[activeStep].id}
            item={checklistItems[activeStep]}
            activeStep={activeStep}
            totalSteps={checklistItems.length + 1}
            accessLevel={accessLevel}
            onNext={handleNextClick}
            onBack={() => setActiveStep(s => s - 1)}
            onFeedbackOpen={onFeedbackOpen}
          />
        : (
          <VStack spacing={4} p={8} textAlign="center">
            <Heading size="md">Ingen sjekkpunkter tilgjengelig</Heading>
            <Text color="gray.500">{t('checklist.no_items_found')}</Text>
            <Button onClick={() => navigate('/home')} colorScheme="blue">Tilbake til Hjem</Button>
          </VStack>
        )
      }
      <FeedbackDrawer isOpen={isFeedbackOpen} onClose={onFeedbackClose} activeItem={activeItemForFeedback} />
      <StatusDrawer isOpen={isStatusOpen} onClose={onStatusClose} stats={stats} />
    </Box>
  );
};