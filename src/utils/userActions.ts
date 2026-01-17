// src/utils/userActions.ts
import { db } from '../db';
import type { NavigateFunction } from 'react-router-dom';

interface UserStatus {
  isPro: boolean;
  reportsGenerated: number;
}

export const handleStartNewInspection = async (
  userStatus: UserStatus,
  navigate: NavigateFunction,
  toast?: (options: any) => void,
  t?: (key: string) => string,
  from?: string
) => {
  if (!userStatus.isPro && userStatus.reportsGenerated >= 1) {
    if (toast && t) {
      toast({
        title: t('checklist.toast_report_limit_title'),
        description: t('checklist.toast_report_limit_desc'),
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }
    navigate('/upgrade', { state: from ? { from } : undefined });
    return;
  }

  await db.transaction('rw', db.settings, db.items, async () => {
    await db.items.clear();
    const s = await db.settings.get('settings');
    await db.settings.put({
      key: 'settings',
      language: s?.language,
      userStatus: s?.userStatus,
      reportsGenerated: s?.reportsGenerated,
    });
  });

  navigate('/picker/country');
};