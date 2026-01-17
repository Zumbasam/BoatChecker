// src/contexts/InspectionDataProvider.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Flex, Spinner } from '@chakra-ui/react';
import { useChecklistData } from '../hooks/useChecklistData';

type ChecklistDataContextType = ReturnType<typeof useChecklistData>;

const ChecklistDataContext = createContext<ChecklistDataContextType | null>(null);

export const InspectionDataProvider: React.FC = () => {
const { inspectionId } = useParams<{ inspectionId: string }>();
const numericInspectionId = inspectionId ? parseInt(inspectionId, 10) : undefined;

useEffect(() => {
console.log('[InspectionDataProvider] route', { inspectionId, numericInspectionId });
}, [inspectionId, numericInspectionId]);

const checklistData = useChecklistData(numericInspectionId);

useEffect(() => {
console.log('[InspectionDataProvider] loading', { isLoading: checklistData.isLoading });
}, [checklistData.isLoading]);

useEffect(() => {
if (!checklistData.isLoading) {
console.log('[InspectionDataProvider] data', {
hasData: !!checklistData,
rowsLen: checklistData?.rows?.length ?? 0,
});
}
}, [checklistData, checklistData.isLoading]);

if (checklistData.isLoading) {
return <Flex h="calc(100vh - 65px)" align="center" justify="center"><Spinner size="xl" /></Flex>;
}

return (
<ChecklistDataContext.Provider value={checklistData}>
<Outlet />
</ChecklistDataContext.Provider>
);
};

export const useInspectionData = () => {
const context = useContext(ChecklistDataContext);
if (!context) {
throw new Error('useInspectionData must be used within an InspectionDataProvider');
}
return context;
};

export const useOptionalInspectionData = () => {
return useContext(ChecklistDataContext);
};