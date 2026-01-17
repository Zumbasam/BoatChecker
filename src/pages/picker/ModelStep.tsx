// src/pages/picker/ModelStep.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
  Box, Heading, Input, Spinner, Flex, Button, VStack,
  useDisclosure, Center
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTranslation } from 'react-i18next';
import { db } from '../../db';
import type { BoatModel, CustomBoatDetails, Settings } from '../../db'; 
import AddManualBoatModal from '../../components/AddManualBoatModal';
import { createNewInspection } from '../../utils/inspectionUtils';

const ModelStep: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  const models = useLiveQuery<BoatModel[]>(() => db.models.toArray(), []);
  const [search, setSearch] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const typePrimary = (settings as any)?.typePrimary;
  const typeSecondary = (settings as any)?.typeSecondary;

  const filtered = useMemo(() => {
    if (!models || !typePrimary) return [];
    const selectedPrimary = typePrimary.toLowerCase();
    const selectedSecondary = (typeSecondary || 'Monohull').toLowerCase();
    const q = search.toLowerCase();
    
    return models.filter(m => {
      const modelPrimary = m.typePrimary?.toLowerCase();
      const modelSecondary = m.typeSecondary?.toLowerCase();
      return modelPrimary === selectedPrimary &&
             modelSecondary === selectedSecondary &&
             (m.name.toLowerCase().includes(q) ||
              m.manufacturer.toLowerCase().includes(q));
    });
  }, [models, typePrimary, typeSecondary, search]);

  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 74,
    overscan: 5,
  });

  const selectModel = async (boat: BoatModel) => {
    if (typeof boat.id !== 'number') return;

    const updates = {
      boatModelId: boat.id,
      customBoatDetails: undefined,
      typeSecondary: boat.typeSecondary,
      engineType: boat.engineType,
    };

    if (boat.typePrimary === 'Sailboat') {
      updates.engineType = boat.engineType || 'inboard';
    }

    await db.settings.update('settings', updates as any);

    if (boat.typePrimary === 'Motorboat' && (boat.engineType === 'both' || !boat.engineType)) {
      navigate('../confirm-enginetype');
    } else {
      const currentSettings = await db.settings.get('settings');
      const newId = await createNewInspection(currentSettings as Settings);
      navigate(`/checklist/${newId}`);
    }
  };
  
  const handleSaveManualBoat = async (details: CustomBoatDetails) => {
    await db.settings.update('settings', {
      customBoatDetails: details,
      boatModelId: undefined,
      engineType: details.engineType,
      typeSecondary: details.typeSecondary,
    } as any);
    
    const currentSettings = await db.settings.get('settings');
    const newId = await createNewInspection(currentSettings as Settings);
    navigate(`/checklist/${newId}`);
  };

  if (!models || !settings) {
    return (<Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>);
  }

  return (
    <>
      <VStack spacing={4} p={4} justify="center" minH="calc(100vh - 4rem)">
        <Box maxW="md" w="100%">
          <Heading mb={4} textAlign="center">{t('picker.model.title')}</Heading>
          <Input
            placeholder={t('picker.model.search_placeholder')}
            mb={4}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          
          <Box
            ref={parentRef}
            maxH="50vh"
            overflowY="auto"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
          >
            <Box h={`${rowVirtualizer.getTotalSize()}px`} w="100%" position="relative">
              {rowVirtualizer.getVirtualItems().map(virtualItem => {
                const boat = filtered[virtualItem.index];
                return (
                  <Box
                    key={virtualItem.key}
                    position="absolute"
                    top={0}
                    left={0}
                    w="100%"
                    h={`${virtualItem.size}px`}
                    transform={`translateY(${virtualItem.start}px)`}
                  >
                    <Box
                      p={3}
                      m={1}
                      cursor="pointer"
                      _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' }, borderRadius: 'md' }}
                      onClick={() => selectModel(boat)}
                    >
                      <Box fontWeight="bold">{boat.name}</Box>
                      <Box fontSize="sm" color="gray.600">{boat.manufacturer}</Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {filtered.length === 0 && search.length === 0 && (
              <Box p={2} color="gray.500" textAlign="center">
                  {t('picker.model.no_models_for_type')}
              </Box>
          )}
          {filtered.length === 0 && search.length > 0 && (
              <Box p={2} color="gray.500" textAlign="center">
                  {t('picker.model.no_models_for_search')}
              </Box>
          )}
          
          <Center mt={4}>
            <Button variant="link" colorScheme="blue" onClick={onOpen}>
             {t('picker.model.add_manual_link')}
            </Button>
          </Center>
          
          <VStack mt={6}>
            <Button variant="outline" onClick={() => navigate(-1)}>{t('common.back_button')}</Button>
          </VStack>
        </Box>
      </VStack>
      
      <AddManualBoatModal
          isOpen={isOpen}
          onClose={onClose}
          onSave={handleSaveManualBoat}
          typePrimary={typePrimary}
        />
    </>
  );
};

export default ModelStep;