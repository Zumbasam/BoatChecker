// src/components/StatusButtonPortal.tsx
import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button, Tooltip, Badge, useColorModeValue } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useInspectionData } from '../contexts/InspectionDataProvider';

type StateVal = 'ok' | 'obs' | 'kritisk' | undefined;

export const StatusButtonPortal: React.FC = () => {
  const { t } = useTranslation();
  const { rows, checklistItems } = useInspectionData();
  const [overrides, setOverrides] = useState<Record<string, StateVal>>({});

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ itemId: string; value: StateVal }>).detail;
      if (!detail) return;
      setOverrides(prev => ({ ...prev, [detail.itemId]: detail.value }));
    };
    window.addEventListener('inspection-item-state-changed' as any, handler as any);
    return () => window.removeEventListener('inspection-item-state-changed' as any, handler as any);
  }, []);

  const combinedCounts = useMemo(() => {
    const counts = { ok: 0, obs: 0, kritisk: 0, total: 0 } as Record<string, number>;
    const map = new Map<string, StateVal>();
    rows.forEach(r => map.set(r.id, r.state as StateVal));
    Object.entries(overrides).forEach(([id, v]) => map.set(id, v));
    map.forEach(v => {
      if (!v) return;
      if (v === 'ok') counts.ok += 1;
      if (v === 'obs') counts.obs += 1;
      if (v === 'kritisk') counts.kritisk += 1;
    });
    counts.total = counts.ok + counts.obs + counts.kritisk;
    return counts;
  }, [rows, overrides]);

  const severity = combinedCounts.kritisk > 0 ? 'red' : combinedCounts.obs > 0 ? 'orange' : 'green';
  const problems = combinedCounts.obs + combinedCounts.kritisk;
  const showStatusButton = (checklistItems?.length ?? 0) > 0;

  useEffect(() => {
    console.log('[CostBanner] portal', {
      rowsLen: rows.length,
      checklistItemsLen: checklistItems?.length ?? 0,
      overridesLen: Object.keys(overrides).length,
      combinedCounts,
      problems,
      showStatusButton,
    });
  }, [rows.length, checklistItems?.length, overrides, combinedCounts, problems, showStatusButton]);

  const bg = useColorModeValue('gray.100', 'gray.800');
  const slot = typeof document !== 'undefined' ? document.getElementById('costbanner-status-slot') : null;
  if (!slot || !showStatusButton) return null;

  return createPortal(
    <Tooltip label={t('common.view_status', 'Se status')} hasArrow>
      <Box position="relative" display="inline-block" bg={bg}>
        <Button
          size="sm"
          h="28px"
          px={3}
          minW="auto"
          rounded="md"
          variant="solid"
          colorScheme={severity as any}
          aria-label={t('common.view_status', 'Se status')}
          onClick={() => window.dispatchEvent(new Event('open-status-drawer'))}
        >
          {t('common.status')}
        </Button>
        {problems > 0 && (
          <Badge
		    borderWidth="1px"
		    borderColor="grey"
            position="absolute"
            top="-6px"
            right="-12px"
            rounded="full"
            fontSize="14px"
            px="1.5"
            colorScheme={combinedCounts.kritisk > 0 ? 'red' : 'orange'}
          >
            {problems}
          </Badge>
        )}
      </Box>
    </Tooltip>,
    slot
  );
};
