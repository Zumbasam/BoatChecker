// src/components/summary/SummaryControls.tsx
import React from 'react';
import { Box, VStack, HStack, Button, Select, Stack, Text, useColorModeValue } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

type Primary = 'all' | 'obs' | 'critical';
type Extra = 'none' | 'with_images' | 'with_notes';
type GroupBy = 'severity' | 'cost';

interface Props {
  primaryFilter: Primary;
  onPrimaryChange: (v: Primary) => void;
  extraFilter: Extra;
  onExtraFilterChange: (v: Extra) => void;
  groupBy: GroupBy;
  onGroupByChange: (v: GroupBy) => void;
}

export const SummaryControls: React.FC<Props> = ({
  primaryFilter,
  onPrimaryChange,
  extraFilter,
  onExtraFilterChange,
  groupBy,
  onGroupByChange,
}) => {
  const { t } = useTranslation();
  const bg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box p={3} borderWidth="1px" borderColor="gray.200" rounded="md" bg={bg}>
      <VStack align="stretch" spacing={3}>
        <HStack spacing={2} w="100%">
          <Button
            onClick={() => onPrimaryChange('all')}
            variant={primaryFilter === 'all' ? 'solid' : 'outline'}
            size="sm"
            flex="1 1 0"
          >
            {t('summary.filters.all_short', { defaultValue: 'All' })}
          </Button>
          <Button
            onClick={() => onPrimaryChange('obs')}
            variant={primaryFilter === 'obs' ? 'solid' : 'outline'}
            size="sm"
            flex="1 1 0"
          >
            {t('summary.filters.obs_short', { defaultValue: 'Obs' })}
          </Button>
          <Button
            onClick={() => onPrimaryChange('critical')}
            variant={primaryFilter === 'critical' ? 'solid' : 'outline'}
            size="sm"
            flex="1 1 0"
          >
            {t('summary.filters.critical_short', { defaultValue: 'Critical' })}
          </Button>
        </HStack>

        <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} align="center">
          <HStack spacing={2} minW={{ base: '100%', sm: '60%' }}>
            <Text fontSize="sm">{t('summary.group_by', { defaultValue: 'Group by:' })}</Text>
            <Select
              size="sm"
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as GroupBy)}
              w={{ base: '100%', sm: '220px' }}
            >
              <option value="severity">{t('summary.group_by_severity', { defaultValue: 'Criticality' })}</option>
              <option value="cost">{t('summary.group_by_cost', { defaultValue: 'Cost indication' })}</option>
            </Select>
          </HStack>

          <HStack spacing={2} minW={{ base: '100%', sm: '40%' }}>
            <Text fontSize="sm">{t('summary.filter_label', { defaultValue: 'Filter:' })}</Text>
            <Select
              size="sm"
              value={extraFilter}
              onChange={(e) => onExtraFilterChange(e.target.value as Extra)}
              w={{ base: '100%', sm: '220px' }}
            >
              <option value="none">{t('summary.filters.none', { defaultValue: 'None' })}</option>
              <option value="with_images">{t('summary.filters.with_images', { defaultValue: 'With images' })}</option>
              <option value="with_notes">{t('summary.filters.with_notes', { defaultValue: 'With notes' })}</option>
            </Select>
          </HStack>
        </Stack>
      </VStack>
    </Box>
  );
};
