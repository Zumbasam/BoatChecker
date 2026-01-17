// src/components/send-request/FindingsSummary.tsx
import React from 'react';
import { VStack, Heading, List, ListItem, HStack, Icon, Text } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Row {
  id: string;
  label: string;
  criticality?: number;
}

interface Props {
  rows: Row[];
}

export const FindingsSummary: React.FC<Props> = ({ rows }) => {
  const { t } = useTranslation();
  return (
    <VStack as="section" align="stretch" spacing={4}>
      <Heading size="md">{t('send_request_page.findings_summary_header')}</Heading>
      <List spacing={2}>
        {rows.map(row => (
          <ListItem key={row.id}>
            <HStack>
              {row.criticality === 1 && <Icon as={AlertTriangle} color="red.500" />}
              <Text>{row.label}</Text>
            </HStack>
          </ListItem>
        ))}
      </List>
    </VStack>
  );
};