// src/components/stepper/StatusDrawer.tsx
import React, { useMemo, useEffect, useState } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Tag,
  TagLeftIcon,
  TagLabel,
  useColorModeValue,
  Tooltip,
} from '@chakra-ui/react';
import { IoAlertCircle, IoCloseCircle } from 'react-icons/io5';
import { Paperclip } from 'lucide-react';
import { useInspectionData } from '../../contexts/InspectionDataProvider';
import { useTranslation } from 'react-i18next';

type Stats = { ok: number; obs: number; critical: number; highCrit?: number; total: number };
type StateVal = 'ok' | 'obs' | 'kritisk' | undefined;

export const StatusDrawer: React.FC<{ isOpen: boolean; onClose: () => void; stats?: Stats }> = ({ isOpen, onClose, stats }) => {
  const { rows, checklistItems } = useInspectionData();
  const { t } = useTranslation();
  const textMuted = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');

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

  const itemsById = useMemo(() => {
    const map = new Map<string, string>();
    checklistItems.forEach(ci => map.set(ci.id, ci.title));
    return map;
  }, [checklistItems]);

  const rowById = useMemo(() => {
    const map = new Map<string, any>();
    (rows ?? []).forEach(r => map.set(r.id, r as any));
    return map;
  }, [rows]);

  const merged = useMemo(() => {
    const ids = new Set<string>();
    (rows ?? []).forEach(r => ids.add(r.id));
    Object.keys(overrides).forEach(id => ids.add(id));
    const list: Array<{ id: string; state: StateVal; note?: string; thumb?: string; full?: string; imageUrl?: string }> = [];
    ids.forEach(id => {
      const base = rowById.get(id);
      const state: StateVal = overrides[id] !== undefined ? overrides[id] : base?.state;
      if (state === 'obs' || state === 'kritisk') {
        list.push({ id, state, note: base?.note, thumb: base?.thumb, full: base?.full, imageUrl: base?.imageUrl });
      }
    });
    list.sort((a, b) => {
      const order = (s?: string) => (s === 'kritisk' ? 0 : s === 'obs' ? 1 : 2);
      return order(a.state) - order(b.state);
    });
    return list;
  }, [rows, overrides, rowById]);

  const counts = useMemo(() => {
    const o = merged.filter(f => f.state === 'obs').length;
    const k = merged.filter(f => f.state === 'kritisk').length;
    return { obs: o, kritisk: k };
  }, [merged]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="left" size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <HStack spacing={3} align="center">
            <Text>Status</Text>
            <Tag size="sm" colorScheme={counts.kritisk > 0 ? 'red' : counts.obs > 0 ? 'orange' : 'green'}>
              <TagLeftIcon as={counts.kritisk > 0 ? IoCloseCircle : IoAlertCircle} />
              <TagLabel>{counts.kritisk} kritisk • {counts.obs} obs</TagLabel>
            </Tag>
          </HStack>
          {stats && (
            <Text fontSize="xs" mt={1} color={textMuted}>Totalt markert: {stats.total}</Text>
          )}
        </DrawerHeader>
        <DrawerBody>
          {merged.length === 0 ? (
            <VStack spacing={3} align="center" mt={6}>
              <Text fontSize="sm" color={textMuted}>Ingen funn registrert ennå.</Text>
            </VStack>
          ) : (
            <VStack spacing={3} align="stretch">
              {merged.map(f => {
                const title = itemsById.get(f.id) ?? f.id;
                const hasNote = !!f.note && String(f.note).trim() !== '';
                const hasImage = !!f.thumb || !!f.full || !!f.imageUrl;
                const scheme = f.state === 'kritisk' ? 'red' : 'orange';
                return (
                  <Box
                    key={f.id}
                    p={3}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={cardBorder}
                    rounded="md"
                    cursor="pointer"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('goto-inspection-item', { detail: { itemId: f.id } }));
                      onClose();
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        window.dispatchEvent(new CustomEvent('goto-inspection-item', { detail: { itemId: f.id } }));
                        onClose();
                      }
                    }}
                  >
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={1} maxW="85%">
                        <HStack spacing={2}>
                          <Badge colorScheme={scheme}>{f.state}</Badge>
                          <Text fontWeight="medium" noOfLines={2}>{title}</Text>
                        </HStack>
                      </VStack>
                      {(hasNote || hasImage) && (
                        <Tooltip label={t('common.attachments')} hasArrow>
                          <Box as="span" flexShrink={0}>
                            <Paperclip size={28} />
                          </Box>
                        </Tooltip>
                      )}
                    </HStack>
                  </Box>
                );
              })}
              <Divider />
              <Text fontSize="xs" color={textMuted}>Viser kun punkter med status "obs" eller "kritisk".</Text>
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};