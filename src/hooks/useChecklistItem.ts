// src/hooks/useChecklistItem.ts
import { useCallback, useMemo } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { db } from '../db';
import type { InspectionItem } from '../db';
import { fixImageOrientation, makeThumb } from '../utils/imageUtils';
import { useInspectionData } from '../contexts/InspectionDataProvider';

export const useChecklistItem = (itemId: string | undefined) => {
  const { t } = useTranslation();
  const toast = useToast();
  const { rows } = useInspectionData();

  const itemState = useMemo(() => {
    if (!itemId || !rows) return undefined;
    return rows.find(r => r.id === itemId);
  }, [rows, itemId]);

  const showStateReminderToast = useCallback(() => {
    if (!toast.isActive('state-reminder')) {
      toast({
        id: 'state-reminder',
        title: t('checklist.card.toast_reminder_title'),
        description: t('checklist.card.toast_reminder_desc'),
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [toast, t]);

  const saveRec = useCallback(async (update: Partial<InspectionItem> | null) => {
    if (!itemId) return;

    const existingItem = await db.items.get(itemId);

    if (update === null) {
      await db.items.delete(itemId);
      return;
    }

    if (existingItem) {
      await db.items.update(itemId, update);
    } else {
      const newItem: InspectionItem = {
        id: itemId,
        state: 'obs',
        ...update
      };
      await db.items.put(newItem);
    }
  }, [itemId]);

  const handleStateChange = (val: 'ok' | 'obs' | 'kritisk') => {
    const currentState = itemState?.state;
    const newState = currentState === val ? '' : val;

    const shouldDelete = newState === '' && !itemState?.note && !itemState?.thumb;

    if (shouldDelete) {
      saveRec(null);
    } else {
      if (newState === '' && (itemState?.note || itemState?.thumb)) {
        showStateReminderToast();
      }
      const validState = newState || 'obs';
      saveRec({ state: validState as 'ok' | 'obs' | 'kritisk' });
    }
  };

  const handleNoteSave = (newNote: string) => {
    saveRec({ note: newNote });
  };

  const handleImageSelection = async (file: File) => {
    const oriented = await fixImageOrientation(file);
    const newThumb = await makeThumb(oriented);
    saveRec({ photoThumb: newThumb, photoFull: oriented });
  };

  const handleImageDelete = () => {
    saveRec({ photoThumb: undefined, photoFull: undefined });
  };

  return {
    itemState,
    handlers: {
      handleStateChange,
      handleNoteSave,
      handleImageSelection,
      handleImageDelete,
    },
  };
};