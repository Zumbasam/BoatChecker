// src/components/BoatInsights.tsx
// Viser statistikk-baserte tips KUN når data er tilgjengelig
// Pro-funksjon: Gratis brukere ser teaser, Pro ser alle tips

import React, { useEffect, useState } from 'react';
import {
  Box, VStack, HStack, Text, Icon, Skeleton,
  Alert, AlertIcon, AlertTitle, AlertDescription,
  Badge, Button, Collapse, useDisclosure
} from '@chakra-ui/react';
import { AlertTriangle, TrendingUp, Eye, Lock, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AnalyticsService from '../services/AnalyticsService';
import { useUserStatus } from '../hooks/useUserStatus';

// Minimum antall inspeksjoner før vi viser statistikk
const MIN_INSPECTIONS_FOR_INSIGHTS = 10;
const MIN_ISSUE_PERCENTAGE = 25; // Minimum % obs+kritisk for å vise som "vanlig problem"

interface BoatInsightsProps {
  manufacturer: string;
  model?: string;
}

interface Insight {
  type: 'warning' | 'info' | 'tip';
  icon: React.ElementType;
  title: string;
  description: string;
  checklistItemId?: string;
  percentage?: number;
}

export const BoatInsights: React.FC<BoatInsightsProps> = ({ manufacturer, model }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userStatus = useUserStatus();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [totalInspections, setTotalInspections] = useState(0);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!manufacturer) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const stats = await AnalyticsService.getStats(manufacturer, model);
        
        if (!stats || !stats.success) {
          setHasEnoughData(false);
          setIsLoading(false);
          return;
        }

        // Sjekk om vi har nok data
        const maxInspections = Math.max(
          ...stats.statistics.map(s => s.total_inspections),
          0
        );
        
        setTotalInspections(maxInspections);
        
        if (maxInspections < MIN_INSPECTIONS_FOR_INSIGHTS) {
          setHasEnoughData(false);
          setIsLoading(false);
          return;
        }

        setHasEnoughData(true);

        // Generer innsikter basert på statistikk
        const generatedInsights: Insight[] = [];

        // Finn vanlige problemer (høy obs+kritisk prosent)
        const commonIssues = stats.common_issues
          .filter(issue => (issue.pct_obs + issue.pct_kritisk) >= MIN_ISSUE_PERCENTAGE)
          .slice(0, 5);

        if (commonIssues.length > 0) {
          // Mest vanlige problem
          const topIssue = commonIssues[0];
          const issuePercent = Math.round(topIssue.pct_obs + topIssue.pct_kritisk);
          
          generatedInsights.push({
            type: 'warning',
            icon: AlertTriangle,
            title: t('insights.common_issue_title'),
            description: t('insights.common_issue_desc', {
              item: formatChecklistItemName(topIssue.checklist_item_id, t),
              percent: issuePercent,
              count: topIssue.total_inspections
            }),
            checklistItemId: topIssue.checklist_item_id,
            percentage: issuePercent
          });

          // Hvis flere problemer, gi generelt tips
          if (commonIssues.length >= 3) {
            const areas = [...new Set(commonIssues.map(i => i.checklist_item_id.split('_')[0]))];
            generatedInsights.push({
              type: 'tip',
              icon: Lightbulb,
              title: t('insights.multiple_issues_title'),
              description: t('insights.multiple_issues_desc', {
                count: commonIssues.length,
                areas: areas.slice(0, 3).map(a => formatAreaName(a, t)).join(', ')
              })
            });
          }
        }

        // Finn kritiske problemer (høy kritisk prosent)
        const criticalIssues = stats.statistics
          .filter(s => s.pct_kritisk >= 15 && s.total_inspections >= MIN_INSPECTIONS_FOR_INSIGHTS)
          .sort((a, b) => b.pct_kritisk - a.pct_kritisk)
          .slice(0, 2);

        criticalIssues.forEach(issue => {
          generatedInsights.push({
            type: 'warning',
            icon: AlertTriangle,
            title: t('insights.critical_area_title'),
            description: t('insights.critical_area_desc', {
              item: formatChecklistItemName(issue.checklist_item_id, t),
              percent: Math.round(issue.pct_kritisk)
            }),
            checklistItemId: issue.checklist_item_id,
            percentage: issue.pct_kritisk
          });
        });

        // Positive innsikter (områder som sjelden har problemer)
        const reliableAreas = stats.statistics
          .filter(s => s.pct_ok >= 85 && s.total_inspections >= MIN_INSPECTIONS_FOR_INSIGHTS)
          .sort((a, b) => b.pct_ok - a.pct_ok)
          .slice(0, 1);

        reliableAreas.forEach(area => {
          generatedInsights.push({
            type: 'info',
            icon: TrendingUp,
            title: t('insights.reliable_area_title'),
            description: t('insights.reliable_area_desc', {
              item: formatChecklistItemName(area.checklist_item_id, t),
              percent: Math.round(area.pct_ok)
            }),
            checklistItemId: area.checklist_item_id,
            percentage: area.pct_ok
          });
        });

        // Begrens til maks 4 innsikter
        setInsights(generatedInsights.slice(0, 4));

      } catch (error) {
        console.error('[BoatInsights] Feil ved henting av statistikk:', error);
        setHasEnoughData(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [manufacturer, model, t]);

  // Ikke vis noe hvis vi laster eller ikke har nok data
  if (isLoading) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md" mb={4}>
        <Skeleton height="20px" mb={2} />
        <Skeleton height="60px" />
      </Box>
    );
  }

  // Ingen data tilgjengelig - vis ingenting
  if (!hasEnoughData || insights.length === 0) {
    return null;
  }

  // Vis teaser for gratis brukere
  const isPro = userStatus.isPro;
  const visibleInsights = isPro ? insights : insights.slice(0, 1);
  const hiddenCount = insights.length - visibleInsights.length;

  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="md" 
      mb={4}
      bg="blue.50"
      borderColor="blue.200"
      _dark={{ bg: 'blue.900', borderColor: 'blue.700' }}
    >
      <HStack justify="space-between" mb={3} cursor="pointer" onClick={onToggle}>
        <HStack>
          <Icon as={Eye} color="blue.500" />
          <Text fontWeight="bold" color="blue.700" _dark={{ color: 'blue.200' }}>
            {t('insights.section_title')}
          </Text>
          <Badge colorScheme="blue" fontSize="xs">
            {t('insights.based_on_count', { count: totalInspections })}
          </Badge>
        </HStack>
        <Icon as={isOpen ? ChevronUp : ChevronDown} />
      </HStack>

      <Collapse in={isOpen}>
        <VStack spacing={3} align="stretch">
          {visibleInsights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))}

          {/* Teaser for Pro */}
          {!isPro && hiddenCount > 0 && (
            <Box 
              p={3} 
              bg="purple.50" 
              _dark={{ bg: 'purple.900' }}
              borderRadius="md"
              borderWidth="1px"
              borderColor="purple.200"
              borderStyle="dashed"
            >
              <HStack justify="space-between" align="center">
                <HStack>
                  <Icon as={Lock} color="purple.500" />
                  <Text fontSize="sm" color="purple.700" _dark={{ color: 'purple.200' }}>
                    {t('insights.pro_teaser', { count: hiddenCount })}
                  </Text>
                </HStack>
                <Button 
                  size="sm" 
                  colorScheme="purple" 
                  onClick={() => navigate('/upgrade')}
                >
                  {t('insights.unlock_button')}
                </Button>
              </HStack>
            </Box>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

// Hjelpefunksjon for å formatere sjekkpunkt-navn
function formatChecklistItemName(id: string, t: any): string {
  // Prøv å hente oversettelse, ellers formater ID
  const translationKey = `checklist_items.${id}`;
  const translated = t(translationKey, { defaultValue: '' });
  
  if (translated && translated !== translationKey) {
    return translated;
  }
  
  // Fallback: Formater ID til lesbar tekst
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Hjelpefunksjon for å formatere områdenavn
function formatAreaName(area: string, t: any): string {
  const areaTranslations: Record<string, string> = {
    'hull': t('areas.hull', { defaultValue: 'Skrog' }),
    'deck': t('areas.deck', { defaultValue: 'Dekk' }),
    'rigg': t('areas.rigging', { defaultValue: 'Rigg' }),
    'rigging': t('areas.rigging', { defaultValue: 'Rigg' }),
    'engine': t('areas.engine', { defaultValue: 'Motor' }),
    'motor': t('areas.engine', { defaultValue: 'Motor' }),
    'electrical': t('areas.electrical', { defaultValue: 'Elektrisk' }),
    'plumbing': t('areas.plumbing', { defaultValue: 'VVS' }),
    'safety': t('areas.safety', { defaultValue: 'Sikkerhet' }),
    'interior': t('areas.interior', { defaultValue: 'Interiør' }),
  };
  
  return areaTranslations[area.toLowerCase()] || area;
}

// Individuelt innsikt-kort
const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const colorScheme = insight.type === 'warning' ? 'orange' : insight.type === 'tip' ? 'green' : 'blue';
  
  return (
    <Alert status={insight.type === 'warning' ? 'warning' : 'info'} borderRadius="md" py={2}>
      <AlertIcon as={insight.icon} />
      <Box flex="1">
        <AlertTitle fontSize="sm" mb={0}>
          {insight.title}
        </AlertTitle>
        <AlertDescription fontSize="sm" opacity={0.9}>
          {insight.description}
        </AlertDescription>
      </Box>
      {insight.percentage && (
        <Badge colorScheme={colorScheme} ml={2}>
          {Math.round(insight.percentage)}%
        </Badge>
      )}
    </Alert>
  );
};

export default BoatInsights;
