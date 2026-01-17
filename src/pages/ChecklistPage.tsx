// src/pages/ChecklistPage.tsx
import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { ChecklistStepper } from '../components/ChecklistStepper';
import { useInspectionData } from '../contexts/InspectionDataProvider';

export const ChecklistPage: React.FC = () => {
  const checklistData = useInspectionData();

  const boatName = checklistData.displayBoatModel 
    ? `${checklistData.displayBoatModel.name} — ${checklistData.displayBoatModel.manufacturer}` 
    : "";

  return (
    <Box p={4}>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        {boatName}
      </Text>
      <ChecklistStepper />
    </Box>
  );
};