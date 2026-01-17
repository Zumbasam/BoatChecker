// src/components/summary/SummaryHeader.tsx
import React from 'react';
import { 
  Box, Heading, Text, useColorModeValue, VStack, HStack, 
  Button, Icon, Badge, SimpleGrid 
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiEdit2, FiMapPin, FiUser, FiCloud, FiAnchor, FiCalendar, FiLink } from 'react-icons/fi';
import type { BoatModel, Inspection, InspectionMetadata } from '../../db';

type Props = {
  displayBoatModel: BoatModel;
  inspection: Inspection;
  onEditMetadata: () => void;
};

const SummaryHeader: React.FC<Props> = ({ displayBoatModel, inspection, onEditMetadata }) => {
  const { t } = useTranslation();
  const infoBg = useColorModeValue('gray.100', 'gray.700');
  const metaBg = useColorModeValue('blue.50', 'blue.900');
  const customDetails = inspection.boatDetails.customBoatDetails;
  const metadata = inspection.metadata;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getAssessmentBadge = (assessment?: InspectionMetadata['overallAssessment']) => {
    if (!assessment) return null;
    const config = {
      recommended: { color: 'green', label: t('modals.inspection_metadata.assessment_recommended') },
      with_reservations: { color: 'yellow', label: t('modals.inspection_metadata.assessment_reservations') },
      not_recommended: { color: 'red', label: t('modals.inspection_metadata.assessment_not_recommended') }
    };
    const c = config[assessment];
    return <Badge colorScheme={c.color} fontSize="md" px={3} py={1}>{c.label}</Badge>;
  };

  return (
    <Box>
      <Heading size="lg" textAlign="center" mb={4}>
        {t('summary.title')}
      </Heading>
      
      {/* Båtinformasjon */}
      <Box p={4} mb={4} bg={infoBg} rounded="md">
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between" align="start">
            <Box flex={1}>
              <Text fontSize="xl" fontWeight="bold">
                {displayBoatModel.name}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {displayBoatModel.manufacturer}
              </Text>
            </Box>
            {metadata?.overallAssessment && getAssessmentBadge(metadata.overallAssessment)}
          </HStack>

          <SimpleGrid columns={[2, 3]} spacing={2} fontSize="sm">
            <HStack>
              <Text fontWeight="medium">{t('common.type')}:</Text>
              <Text>{displayBoatModel.typePrimary}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="medium">{t('common.hull')}:</Text>
              <Text>{displayBoatModel.hullMaterial}</Text>
            </HStack>
            {customDetails?.year && (
              <HStack>
                <Text fontWeight="medium">{t('boat_details.year')}:</Text>
                <Text>{customDetails.year}</Text>
              </HStack>
            )}
            {customDetails?.loa && (
              <HStack>
                <Text fontWeight="medium">{t('boat_details.loa')}:</Text>
                <Text>{customDetails.loa} m</Text>
              </HStack>
            )}
            {customDetails?.beam && (
              <HStack>
                <Text fontWeight="medium">{t('boat_details.beam')}:</Text>
                <Text>{customDetails.beam} m</Text>
              </HStack>
            )}
            {customDetails?.draft && (
              <HStack>
                <Text fontWeight="medium">{t('boat_details.draft')}:</Text>
                <Text>{customDetails.draft} m</Text>
              </HStack>
            )}
            {customDetails?.engineMake && (
              <HStack>
                <Text fontWeight="medium">{t('boat_details.engine_make')}:</Text>
                <Text>{customDetails.engineMake}{customDetails.enginePower ? ` (${customDetails.enginePower} hk)` : ''}</Text>
              </HStack>
            )}
            {customDetails?.hin && (
              <HStack>
                <Text fontWeight="medium">{t('boat_details.hin')}:</Text>
                <Text fontFamily="mono" fontSize="xs">{customDetails.hin}</Text>
              </HStack>
            )}
          </SimpleGrid>

          {customDetails?.listingUrl && (
            <HStack fontSize="sm" color="blue.500">
              <Icon as={FiLink} />
              <Text 
                as="a" 
                href={customDetails.listingUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                textDecoration="underline"
                isTruncated
              >
                {t('boat_details.listing_url_short')}
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Inspeksjonsmetadata */}
      <Box p={4} mb={4} bg={metaBg} rounded="md">
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="semibold">{t('modals.inspection_metadata.title')}</Text>
          <Button 
            size="sm" 
            variant="ghost" 
            leftIcon={<FiEdit2 />}
            onClick={onEditMetadata}
          >
            {t('common.edit_button')}
          </Button>
        </HStack>
        
        <SimpleGrid columns={[1, 2]} spacing={2} fontSize="sm">
          <HStack>
            <Icon as={FiCalendar} color="gray.500" />
            <Text>{formatDate(inspection.createdAt)}</Text>
          </HStack>
          {metadata?.inspectorName && (
            <HStack>
              <Icon as={FiUser} color="gray.500" />
              <Text>{metadata.inspectorName}</Text>
            </HStack>
          )}
          {metadata?.inspectionLocation && (
            <HStack>
              <Icon as={FiMapPin} color="gray.500" />
              <Text>{metadata.inspectionLocation}</Text>
            </HStack>
          )}
          {metadata?.boatLocation && (
            <HStack>
              <Icon as={FiAnchor} color="gray.500" />
              <Text>
                {metadata.boatLocation === 'land' 
                  ? t('modals.inspection_metadata.boat_on_land') 
                  : t('modals.inspection_metadata.boat_in_water')}
              </Text>
            </HStack>
          )}
          {metadata?.weatherConditions && (
            <HStack>
              <Icon as={FiCloud} color="gray.500" />
              <Text>{metadata.weatherConditions}</Text>
            </HStack>
          )}
        </SimpleGrid>

        {metadata?.assessmentNotes && (
          <Box mt={3} pt={3} borderTopWidth="1px" borderColor="gray.200">
            <Text fontSize="sm" fontStyle="italic" color="gray.600">
              "{metadata.assessmentNotes}"
            </Text>
          </Box>
        )}

        {!metadata?.inspectorName && !metadata?.inspectionLocation && (
          <Text fontSize="sm" color="gray.500" fontStyle="italic">
            {t('summary.click_edit_to_add_details')}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default SummaryHeader;