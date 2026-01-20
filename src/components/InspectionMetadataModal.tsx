// src/components/InspectionMetadataModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
  Button, FormControl, FormLabel, Input, VStack, Textarea, HStack, Text,
  Stack, Divider, Box
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import type { InspectionMetadata } from '../db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (metadata: InspectionMetadata) => void;
  initialData?: InspectionMetadata;
}

const InspectionMetadataModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
  const { t } = useTranslation();
  
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionLocation, setInspectionLocation] = useState('');
  const [boatLocation, setBoatLocation] = useState<'land' | 'water' | ''>('');
  const [weatherConditions, setWeatherConditions] = useState('');
  const [overallAssessment, setOverallAssessment] = useState<'recommended' | 'with_reservations' | 'not_recommended' | ''>('');
  const [assessmentNotes, setAssessmentNotes] = useState('');

  useEffect(() => {
    if (isOpen && initialData) {
      setInspectorName(initialData.inspectorName || '');
      setInspectionLocation(initialData.inspectionLocation || '');
      setBoatLocation(initialData.boatLocation || '');
      setWeatherConditions(initialData.weatherConditions || '');
      setOverallAssessment(initialData.overallAssessment || '');
      setAssessmentNotes(initialData.assessmentNotes || '');
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    const metadata: InspectionMetadata = {
      inspectorName: inspectorName || undefined,
      inspectionLocation: inspectionLocation || undefined,
      boatLocation: boatLocation || undefined,
      weatherConditions: weatherConditions || undefined,
      overallAssessment: overallAssessment || undefined,
      assessmentNotes: assessmentNotes || undefined,
    };
    onSave(metadata);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside" size="lg">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>{t('modals.inspection_metadata.title')}</ModalHeader>
        <ModalBody>
          <VStack spacing={5} align="stretch">
            {/* Inspeksjonsinformasjon */}
            <Text fontWeight="semibold" fontSize="sm" color="gray.600">
              {t('modals.inspection_metadata.section_inspection')}
            </Text>
            
            <FormControl>
              <FormLabel>{t('modals.inspection_metadata.inspector_name_label')}</FormLabel>
              <Input 
                placeholder={t('modals.inspection_metadata.inspector_name_placeholder')} 
                value={inspectorName} 
                onChange={(e) => setInspectorName(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>{t('modals.inspection_metadata.location_label')}</FormLabel>
              <Input 
                placeholder={t('modals.inspection_metadata.location_placeholder')} 
                value={inspectionLocation} 
                onChange={(e) => setInspectionLocation(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>{t('modals.inspection_metadata.boat_location_label')}</FormLabel>
              <HStack spacing={4}>
                <Button
                  flex={1}
                  variant={boatLocation === 'land' ? 'solid' : 'outline'}
                  colorScheme={boatLocation === 'land' ? 'blue' : 'gray'}
                  onClick={() => setBoatLocation('land')}
                >
                  {t('modals.inspection_metadata.boat_on_land')}
                </Button>
                <Button
                  flex={1}
                  variant={boatLocation === 'water' ? 'solid' : 'outline'}
                  colorScheme={boatLocation === 'water' ? 'blue' : 'gray'}
                  onClick={() => setBoatLocation('water')}
                >
                  {t('modals.inspection_metadata.boat_in_water')}
                </Button>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>{t('modals.inspection_metadata.weather_label')}</FormLabel>
              <Input 
                placeholder={t('modals.inspection_metadata.weather_placeholder')} 
                value={weatherConditions} 
                onChange={(e) => setWeatherConditions(e.target.value)}
              />
            </FormControl>

            <Divider />

            {/* Totalvurdering */}
            <Text fontWeight="semibold" fontSize="sm" color="gray.600">
              {t('modals.inspection_metadata.section_assessment')}
            </Text>

            <FormControl>
              <FormLabel>{t('modals.inspection_metadata.overall_assessment_label')}</FormLabel>
              <Stack spacing={3}>
                <Box
                  p={3}
                  borderWidth="2px"
                  borderRadius="md"
                  borderColor={overallAssessment === 'recommended' ? 'green.500' : 'gray.200'}
                  bg={overallAssessment === 'recommended' ? 'green.50' : 'transparent'}
                  _dark={{ 
                    borderColor: overallAssessment === 'recommended' ? 'green.400' : 'gray.600',
                    bg: overallAssessment === 'recommended' ? 'green.900' : 'transparent'
                  }}
                  cursor="pointer"
                  onClick={() => setOverallAssessment('recommended')}
                  transition="all 0.2s"
                >
                  <HStack>
                    <Box w={3} h={3} borderRadius="full" bg="green.500" />
                    <Text fontWeight="medium">{t('modals.inspection_metadata.assessment_recommended')}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {t('modals.inspection_metadata.assessment_recommended_desc')}
                  </Text>
                </Box>

                <Box
                  p={3}
                  borderWidth="2px"
                  borderRadius="md"
                  borderColor={overallAssessment === 'with_reservations' ? 'yellow.500' : 'gray.200'}
                  bg={overallAssessment === 'with_reservations' ? 'yellow.50' : 'transparent'}
                  _dark={{ 
                    borderColor: overallAssessment === 'with_reservations' ? 'yellow.400' : 'gray.600',
                    bg: overallAssessment === 'with_reservations' ? 'yellow.900' : 'transparent'
                  }}
                  cursor="pointer"
                  onClick={() => setOverallAssessment('with_reservations')}
                  transition="all 0.2s"
                >
                  <HStack>
                    <Box w={3} h={3} borderRadius="full" bg="yellow.500" />
                    <Text fontWeight="medium">{t('modals.inspection_metadata.assessment_reservations')}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {t('modals.inspection_metadata.assessment_reservations_desc')}
                  </Text>
                </Box>

                <Box
                  p={3}
                  borderWidth="2px"
                  borderRadius="md"
                  borderColor={overallAssessment === 'not_recommended' ? 'red.500' : 'gray.200'}
                  bg={overallAssessment === 'not_recommended' ? 'red.50' : 'transparent'}
                  _dark={{ 
                    borderColor: overallAssessment === 'not_recommended' ? 'red.400' : 'gray.600',
                    bg: overallAssessment === 'not_recommended' ? 'red.900' : 'transparent'
                  }}
                  cursor="pointer"
                  onClick={() => setOverallAssessment('not_recommended')}
                  transition="all 0.2s"
                >
                  <HStack>
                    <Box w={3} h={3} borderRadius="full" bg="red.500" />
                    <Text fontWeight="medium">{t('modals.inspection_metadata.assessment_not_recommended')}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {t('modals.inspection_metadata.assessment_not_recommended_desc')}
                  </Text>
                </Box>
              </Stack>
            </FormControl>

            <FormControl>
              <FormLabel>{t('modals.inspection_metadata.assessment_notes_label')}</FormLabel>
              <Textarea 
                placeholder={t('modals.inspection_metadata.assessment_notes_placeholder')} 
                value={assessmentNotes} 
                onChange={(e) => setAssessmentNotes(e.target.value)}
                rows={3}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>{t('common.cancel_button')}</Button>
          <Button colorScheme="blue" onClick={handleSave}>{t('common.save_button')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InspectionMetadataModal;
