// src/components/summary/FindingsGroup.tsx
import React from 'react';
import { Box, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import type { Row } from './utils';
import { FindingCard } from './FindingCard';

type FindingsGroupProps = {
  label: string;
  items: Row[];
  onNavigateToItem?: (itemId: string) => void;
};

export const FindingsGroup: React.FC<FindingsGroupProps> = ({ label, items, onNavigateToItem }) => {
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box>
      <Box px={4} py={2} bg={headerBg} borderWidth="1px" borderColor={borderColor} rounded="md">
        <Text fontWeight="bold" fontSize="sm">{label}</Text>
      </Box>
      <VStack spacing={3} mt={2} align="stretch">
        {items.map((item, index) => (
          <FindingCard key={item.id} item={item} index={index} onNavigateToItem={onNavigateToItem} />
        ))}
      </VStack>
    </Box>
  );
};