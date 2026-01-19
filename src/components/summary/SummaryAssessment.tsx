// src/components/summary/SummaryAssessment.tsx
import React, { useMemo } from 'react';
import { Box, Heading, Text, Icon, useColorModeValue } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { Row } from './utils';

interface Props {
  rows: Row[];
  notAssessedCount?: number;
}

type AssessmentLevel = 'excellent' | 'good' | 'fair' | 'concerning' | 'serious';

export const SummaryAssessment: React.FC<Props> = ({ rows, notAssessedCount = 0 }) => {
  const { t } = useTranslation();
  const noteBg = useColorModeValue('yellow.50', 'yellow.900');
  const noteBorder = useColorModeValue('yellow.300', 'yellow.700');

  const stats = useMemo(() => {
    // Kun telle faktiske funn (obs og kritisk), ekskluder ok og not_assessed
    const findings = rows.filter((r) => r.state === 'obs' || r.state === 'kritisk');
    const obsCount = rows.filter((r) => r.state === 'obs').length;
    const kritiskCount = rows.filter((r) => r.state === 'kritisk').length;
    const okCount = rows.filter((r) => r.state === 'ok').length;
    
    // Kritikalitet og kostnad kun for faktiske funn
    const highCritFindings = findings.filter((r) => r.criticality === 1).length;
    const cost4Findings = findings.filter((r) => r.costIndicator === 4).length;
    const cost3Findings = findings.filter((r) => r.costIndicator === 3).length;
    
    // Beregn vurderingsnivå
    let level: AssessmentLevel = 'excellent';
    if (kritiskCount > 0 || highCritFindings >= 3) {
      level = 'serious';
    } else if (highCritFindings > 0 || cost4Findings > 0) {
      level = 'concerning';
    } else if (obsCount > 5 || cost3Findings > 2) {
      level = 'fair';
    } else if (obsCount > 0) {
      level = 'good';
    }
    
    return { 
      totalFindings: findings.length,
      obsCount,
      kritiskCount,
      okCount,
      highCritFindings, 
      cost4Findings, 
      cost3Findings,
      level
    };
  }, [rows]);

  // Vurderingstekster basert på nivå
  const getAssessmentVerdict = () => {
    switch (stats.level) {
      case 'excellent':
        return t('summary.assessment_verdict.excellent', {
          defaultValue: 'Basert på de vurderte punktene fremstår båten i god stand. Ingen vesentlige avvik ble funnet.'
        });
      case 'good':
        return t('summary.assessment_verdict.good', {
          count: stats.obsCount,
          defaultValue: 'Båten er generelt i akseptabel stand. {{count}} mindre punkt(er) bør følges opp, men ingen kritiske forhold ble avdekket.'
        });
      case 'fair':
        return t('summary.assessment_verdict.fair', {
          count: stats.totalFindings,
          defaultValue: 'Det ble funnet {{count}} punkter som krever oppfølging. Vi anbefaler å innhente tilbud på utbedring før eventuelt kjøp.'
        });
      case 'concerning':
        return t('summary.assessment_verdict.concerning', {
          count: stats.totalFindings,
          defaultValue: 'Inspeksjonen avdekket {{count}} punkter som gir grunn til bekymring. Noen av disse kan medføre betydelige kostnader. Grundig vurdering anbefales.'
        });
      case 'serious':
        return t('summary.assessment_verdict.serious', {
          kritisk: stats.kritiskCount,
          total: stats.totalFindings,
          defaultValue: 'Det ble avdekket {{kritisk}} kritiske forhold blant totalt {{total}} funn. Disse må undersøkes av fagperson før eventuelt kjøp vurderes.'
        });
    }
  };

  // Fargekoding basert på nivå
  const levelColors = {
    excellent: { bg: 'green.50', border: 'green.200', dark: { bg: 'green.900', border: 'green.700' } },
    good: { bg: 'green.50', border: 'green.200', dark: { bg: 'green.900', border: 'green.700' } },
    fair: { bg: 'yellow.50', border: 'yellow.300', dark: { bg: 'yellow.900', border: 'yellow.700' } },
    concerning: { bg: 'orange.50', border: 'orange.300', dark: { bg: 'orange.900', border: 'orange.700' } },
    serious: { bg: 'red.50', border: 'red.200', dark: { bg: 'red.900', border: 'red.700' } },
  };
  
  const colors = levelColors[stats.level];
  const assessmentBg = useColorModeValue(colors.bg, colors.dark.bg);
  const assessmentBorder = useColorModeValue(colors.border, colors.dark.border);

  return (
    <Box p={4} borderWidth="1px" borderColor={assessmentBorder} bg={assessmentBg} rounded="md">
      <Heading size="md" mb={3}>{t('summary.assessment')}</Heading>
      
      {/* Hovedvurdering */}
      <Text mb={3} fontWeight="medium">
        {getAssessmentVerdict()}
      </Text>

      {/* Detaljer om funn */}
      {stats.totalFindings > 0 && (
        <Box fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
          {stats.kritiskCount > 0 && (
            <Text display="flex" alignItems="center" gap={1}>
              <Icon as={AlertTriangle} color="red.500" boxSize={4} />
              <Text as="span" fontWeight="semibold" color="red.600" _dark={{ color: 'red.300' }}>
                {t('summary.assessment_detail.kritisk', { 
                  count: stats.kritiskCount,
                  defaultValue: '{{count}} kritiske funn som må utbedres'
                })}
              </Text>
            </Text>
          )}
          {stats.obsCount > 0 && (
            <Text>
              {t('summary.assessment_detail.obs', { 
                count: stats.obsCount,
                defaultValue: '{{count}} observasjoner som bør følges opp'
              })}
            </Text>
          )}
          {stats.cost4Findings > 0 && (
            <Text>
              {t('summary.assessment_detail.cost_high', { 
                count: stats.cost4Findings,
                defaultValue: '{{count}} punkt(er) med potensielt høy utbedringskostnad'
              })}
            </Text>
          )}
        </Box>
      )}

      {/* Enkel merknad om ikke-vurderte punkter */}
      {notAssessedCount > 0 && (
        <Box 
          mt={3} 
          p={2} 
          bg={noteBg} 
          borderWidth="1px" 
          borderColor={noteBorder} 
          rounded="md"
          fontSize="xs"
        >
          <Text color="yellow.800" _dark={{ color: 'yellow.200' }}>
            {t('summary.assessment_text.partial_note', {
              defaultValue: 'Vurderingen er basert kun på de sjekkede punktene.'
            })}
          </Text>
        </Box>
      )}
    </Box>
  );
};