// src/components/summary/SummaryFooter.tsx
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

type PdfVariant = 'fast' | 'full';

type Props = {
  inspectionId?: number;
  downloading: PdfVariant | null;
  onDownload: (variant: PdfVariant) => void;
  onSend: () => void;
  onStartNew: () => void;
};

export const SummaryFooter: React.FC<Props> = ({
  inspectionId,
  downloading,
  onDownload,
  onSend,
  onStartNew,
}) => {
  const { t } = useTranslation();
  const bg = useColorModeValue('whiteAlpha.900', 'gray.900');
  const border = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="footer"
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex="sticky"
      bg={bg}
      backdropFilter="blur(8px)"
      borderTop="1px solid"
      borderColor={border}
    >
      <VStack spacing={3} p={3} maxW="md" mx="auto">
        <HStack w="100%" spacing={3}>
          <Button flex="1" colorScheme="blue" onClick={onSend}>
            {t('summary.send_to_vendors_button')}
          </Button>

          <Menu>
            <MenuButton as={Button} flex="1" variant="outline" isDisabled={downloading !== null || !inspectionId}>
              {downloading ? t('pdf_report.creating_pdf') : t('summary.download_button')}
            </MenuButton>
            <MenuList p={0}>
              <MenuItem isDisabled={downloading !== null} onClick={() => onDownload('fast')}>
                {downloading === 'fast' ? (
                  <HStack>
                    <Spinner size="xs" />
                    <Text ml={2}>{t('pdf_report.creating_pdf')}</Text>
                  </HStack>
                ) : (
                  t('pdf_report.download_options.fast')
                )}
              </MenuItem>
              <MenuItem isDisabled={downloading !== null} onClick={() => onDownload('full')}>
                {downloading === 'full' ? (
                  <HStack>
                    <Spinner size="xs" />
                    <Text ml={2}>{t('pdf_report.creating_pdf')}</Text>
                  </HStack>
                ) : (
                  t('pdf_report.download_options.full')
                )}
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        <Button w="100%" colorScheme="red" variant="outline" onClick={onStartNew}>
          {t('summary.start_new_inspection_button')}
        </Button>
      </VStack>
    </Box>
  );
};