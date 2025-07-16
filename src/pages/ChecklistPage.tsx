import { Box, Heading, Button } from '@chakra-ui/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

import checklist from '../data/checklist.json';        // krever "resolveJsonModule": true i tsconfig
import { ChecklistCard } from '../components/ChecklistCard';
import { CostBanner } from '../components/CostBanner';
import { Report } from '../components/Report';

export const ChecklistPage = () => {
  // ⬇️ henter lagrede valg i sanntid
  const states = useLiveQuery(() => db.items.toArray(), []);

  return (
    <Box>
      {/* Banner med løpende kostnad */}
      <CostBanner />

      {/* Eksporter‑knapp (vises først når states er klar) */}
      {states && (
        <PDFDownloadLink
          document={<Report states={states} />}
          fileName="visningsrapport.pdf"
        >
          {({ loading }) => (
            <Button mt={2} mx={4} colorScheme="blue" isLoading={loading}>
              Eksporter PDF
            </Button>
          )}
        </PDFDownloadLink>
      )}

      {/* Selve sjekklisten */}
      <Box p={4}>
        {checklist.areas.map(area => (
          <Box key={area.id} mb={6}>
            <Heading size="md" mb={2}>
              {area.title}
            </Heading>

            {area.items.map(item => (
              <ChecklistCard key={item.id} item={item} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
