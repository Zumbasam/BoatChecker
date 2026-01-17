// src/pages/picker/ConfirmEngineTypeStep.tsx
import React from 'react';
import { Box, Heading, VStack, Button, HStack, Text, Spinner, Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import type { BoatModel, Settings } from '../../db';
import { createNewInspection } from '../../utils/inspectionUtils';

const ConfirmEngineTypeStep: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const settings = useLiveQuery(() => db.settings.get('settings'));

  const boatModel = useLiveQuery<BoatModel | undefined>(
    () => (settings as any)?.boatModelId ? db.models.get((settings as any).boatModelId) : undefined,
    [settings]
  );

  const selectEngineType = async (type: 'inboard' | 'outboard') => {
    await db.settings.update('settings', {
      engineType: type,
      typeSecondary: boatModel?.typeSecondary || 'Monohull',
    } as any);
    
    const currentSettings = await db.settings.get('settings');
    const newId = await createNewInspection(currentSettings as Settings);
    navigate(`/checklist/${newId}`);
  };

  if (!boatModel) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  return (
    <VStack spacing={6} p={4} justify="center" minH="calc(100vh - 4rem)">
      <Box maxW="md" w="100%" textAlign="center">
        <Heading mb={2}>{t('picker.confirm_engine_type.title')}</Heading>
        <Text fontSize="lg" color="gray.500" mb={6}>
          {t('picker.confirm_engine_type.subtitle')}
        </Text>
        <Box p={4} mb={6} bg="gray.100" _dark={{ bg: 'gray.700' }} rounded="md">
          <Text fontWeight="bold">{boatModel.manufacturer} {boatModel.name}</Text>
        </Box>
        
        <HStack justify="center" spacing={4}>
          <Button onClick={() => selectEngineType('inboard')} size="lg" minW="140px">
            {t('picker.confirm_engine_type.inboard')}
          </Button>
          <Button onClick={() => selectEngineType('outboard')} size="lg" minW="140px">
            {t('picker.confirm_engine_type.outboard')}
          </Button>
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

export default ConfirmEngineTypeStep;