// src/utils/userActions.ts
import { db } from '../db';
import type { NavigateFunction } from 'react-router-dom';

interface UserStatus {
  isPro: boolean;
  reportsGenerated: number;
}

export const handleStartNewInspection = async (
  _userStatus: UserStatus,
  navigate: NavigateFunction,
  _toast?: (options: any) => void,
  _t?: (key: string) => string,
  _from?: string
) => {
  // Ny strategi: Ingen begrensning på antall inspeksjoner
  // Begrensninger er kun på: låste punkter, PDF-eksport, og sending til verksteder

  await db.transaction('rw', db.settings, db.items, async () => {
    await db.items.clear();
    const s = await db.settings.get('settings');
    await db.settings.put({
      key: 'settings',
      language: s?.language,
      userStatus: s?.userStatus,
      reportsGenerated: s?.reportsGenerated,
      contributeData: s?.contributeData,
    });
  });

  navigate('/picker/country');
};