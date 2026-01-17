// src/pages/picker/LangStep.tsx
import React from "react";
import { Box, Button, VStack, Image, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { db } from "../../db";

const LangStep: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLang = async (lang: 'nb' | 'en') => {
    await i18n.changeLanguage(lang);
    const currentSettings = await db.settings.get('settings');
    await db.settings.put({ ...(currentSettings || {}), key: 'settings', language: lang });
    navigate('/home', { replace: true });
  };

  return (
    <VStack spacing={8} p={4} justify="center" minH="calc(100vh - 4rem)">
      <Image src="/logo.svg" alt="BoatChecker App Logo" boxSize="120px" mt={6} />
      <Heading as="h1" size="lg" textAlign="center">{t('picker.lang.title')}</Heading>
      <Box maxW="md" w="100%">
        <VStack spacing={4}>
          <Button width="100%" onClick={() => handleLang('nb')}>{t('picker.lang.button_norwegian')}</Button>
          <Button width="100%" onClick={() => handleLang('en')}>{t('picker.lang.button_english')}</Button>
        </VStack>
      </Box>
    </VStack>
  );
};

export default LangStep;