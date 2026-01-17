// src/components/MainLayout.tsx
import React, { useState } from 'react';
import { Box, useDisclosure } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { CostBanner } from './CostBanner';
import { FeedbackDrawer } from './feedback/FeedbackDrawer';

export interface BannerData {
  stats?: { ok: number; obs: number; critical: number; total: number };
  onStatusOpen?: () => void;
}

export const MainLayout: React.FC = () => {
  const [, setBannerData] = useState<BannerData | null>(null);
  const { isOpen: isFeedbackOpen, onOpen: onFeedbackOpen, onClose: onFeedbackClose } = useDisclosure();

  React.useEffect(() => {
    const handler = () => onFeedbackOpen();
    window.addEventListener('open-feedback-drawer', handler);
    return () => window.removeEventListener('open-feedback-drawer', handler);
  }, [onFeedbackOpen]);

  const contextValue = { setBannerData };

  return (
    <Box>
      <CostBanner />
      <main>
        <Outlet context={contextValue} />
      </main>
      <FeedbackDrawer isOpen={isFeedbackOpen} onClose={onFeedbackClose} activeItem={null} />
    </Box>
  );
};
