// src/pages/picker/PrimaryStep.tsx
import React from 'react';
import { Box, Heading, HStack, VStack, Button, Icon } from '@chakra-ui/react';
import { Sailboat, Airplay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';

const PrimaryStep: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const selectType = async (type: 'sailboat' | 'motorboat') => {
    await db.settings.update('settings', { typePrimary: type } as any);
    navigate('../model');
  };

  return (
    <VStack spacing={6} p={4} justify="center" minH="calc(100vh - 4rem)">
        <Box maxW="md" w="100%" textAlign="center">
            <Heading mb={6}>{t('picker.primary_type.title')}</Heading>
            <HStack justify="center" spacing={8}>
                <VStack>
                <Icon as={Sailboat} boxSize={12} />
                <Button onClick={() => selectType('sailboat')}>{t('picker.primary_type.sailboat')}</Button>
                </VStack>
                <VStack>
                <Icon as={Airplay} boxSize={12} />
                <Button onClick={() => selectType('motorboat')}>{t('picker.primary_type.motorboat')}</Button>
                </VStack>
            </HStack>
            <VStack mt={6}>
                <Button variant="outline" onClick={() => navigate(-1)}>
                {t('common.back_button')}
                </Button>
            </VStack>
        </Box>
    </VStack>
  );
};

export default PrimaryStep;