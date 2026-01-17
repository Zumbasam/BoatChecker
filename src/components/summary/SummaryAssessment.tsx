// src/components/summary/SummaryAssessment.tsx
import React, { useMemo } from 'react';
import { Box, Heading, Text, Icon } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { Row } from './utils';

export const SummaryAssessment: React.FC<{ rows: Row[] }> = ({ rows }) => {
const { t } = useTranslation();

const stats = useMemo(() => {
const criticality1 = rows.filter((r) => r.criticality === 1).length;
const cost4 = rows.filter((r) => r.costIndicator === 4).length;
const cost3 = rows.filter((r) => r.costIndicator === 3).length;
return { criticality1, cost4, cost3 };
}, [rows]);

return (
<Box p={4} borderWidth="1px" borderColor="gray.200" rounded="md">
<Heading size="md" mb={2}>{t('summary.assessment')}</Heading>
<Text>
{rows.length === 0 ? (
t('summary.assessment_text.no_findings')
) : (
<>
<Text as="span">{t('summary.assessment_text.findings_intro', { count: rows.length })} </Text>
{stats.criticality1 > 0 && (
<Text as="span">
{t('summary.assessment_text.high_crit', { count: stats.criticality1 })} (
<Icon as={AlertTriangle} color="red.500" boxSize={4} verticalAlign="middle" />
).{' '}
</Text>
)}
{stats.cost4 > 0 && (
<Text as="span">{t('summary.assessment_text.cost_4', { count: stats.cost4 })}</Text>
)}
{stats.cost4 === 0 && stats.cost3 > 0 && (
<Text as="span">{t('summary.assessment_text.cost_3', { count: stats.cost3 })}</Text>
)}
</>
)}
</Text>
</Box>
);
};