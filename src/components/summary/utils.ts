// src/components/summary/utils.ts
import { useColorModeValue } from '@chakra-ui/react';

export type Row = {
  id: string;
  label: string;
  state: 'ok' | 'obs' | 'kritisk' | 'not_assessed';
  criticality?: number;
  costIndicator?: number;
  note?: string;
  thumb?: string;
  photoFull?: string;
};

export type FindingRow = Row;

export type PrimaryFilter = 'all' | 'obs' | 'critical';
export type ExtraFilter = 'none' | 'with_images' | 'with_notes';
export type GroupBy = 'severity' | 'cost';

export type Group = {
  key: string;
  label: string;
  items: Row[];
};

export const costIndicatorToDollar = (indicator?: number) => {
  if (!indicator) return '—';
  return '$'.repeat(indicator);
};

const paletteSrc = {
  evenMain: { light: '#eaf2ff', dark: '#24364d' },
  oddMain: { light: '#f5f9ff', dark: '#1c2a3e' },
  extraMain: { light: '#f4f9ff', dark: '#192436' },
  border: { light: '#8da6c8', dark: '#4b6a96' },
};

export type SummaryPalette = {
  evenMain: string;
  oddMain: string;
  extraMain: string;
  border: string;
  infoBg: string;
  controlBg: string;
  muted: string;
  footerBg: string;
  footerBorder: string;
};

export const useSummaryPalette = (): SummaryPalette => {
  return {
    evenMain: useColorModeValue(paletteSrc.evenMain.light, paletteSrc.evenMain.dark),
    oddMain: useColorModeValue(paletteSrc.oddMain.light, paletteSrc.oddMain.dark),
    extraMain: useColorModeValue(paletteSrc.extraMain.light, paletteSrc.extraMain.dark),
    border: useColorModeValue(paletteSrc.border.light, paletteSrc.border.dark),
    infoBg: useColorModeValue('gray.100', 'gray.700'),
    controlBg: useColorModeValue('gray.50', 'gray.700'),
    muted: useColorModeValue('gray.600', 'gray.300'),
    footerBg: useColorModeValue('whiteAlpha.900', 'gray.900'),
    footerBorder: useColorModeValue('gray.200', 'gray.700'),
  };
};
