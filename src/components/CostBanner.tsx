import { Badge, HStack, Text } from '@chakra-ui/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import checklist from '../data/checklist.json';

export const CostBanner = () => {
  // hent alle lagrede tilstander i sanntid
  const states = useLiveQuery(() => db.items.toArray(), []);

  // summer kostnader basert på checklist.json & lagrede states
  const total = states?.reduce((sum, s) => {
    // finn tilhørende item i checklisten
    const item = checklist.areas
      .flatMap(a => a.items)
      .find(i => i.id === s.id);
    if (!item) return sum;
    const cost = item.cost[s.state];
    return sum + cost;
  }, 0) ?? 0;

  return (
    <HStack
      position="sticky"
      top="0"
      zIndex="docked"
      p={3}
      bg="white"
      shadow="sm"
    >
      <Text fontWeight="bold">Estimert kostnad:</Text>
      <Badge colorScheme={total === 0 ? 'green' : total < 50000 ? 'yellow' : 'red'}>
        {total.toLocaleString('nb-NO')} kr
      </Badge>
    </HStack>
  );
};
