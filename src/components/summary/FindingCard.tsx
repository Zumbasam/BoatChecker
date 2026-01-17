// src/components/summary/FindingCard.tsx
import React, { useMemo, useState } from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  Divider,
  Tag,
  TagLabel,
  Image as ChakraImage,
  Icon,
  useColorModeValue,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { costIndicatorToDollar } from './utils';
import type { FindingRow } from './utils';

type FindingCardProps = {
  item: FindingRow;
  index?: number;
};

export const FindingCard: React.FC<FindingCardProps> = ({ item, index = 0 }) => {
  const { t } = useTranslation();
  const evenBg = useColorModeValue('#eaf2ff', '#24364d');
  const oddBg = useColorModeValue('#f5f9ff', '#1c2a3e');
  const border = useColorModeValue('gray.200', 'gray.700');
  const muted = useColorModeValue('gray.600', 'gray.300');
  const bg = index % 2 === 0 ? evenBg : oddBg;

  const hasNote = !!item.note && String(item.note).trim() !== '';
  const hasImage = !!item.thumb;
  const scheme = item.state === 'ok' ? 'green' : item.state === 'obs' ? 'yellow' : 'red';

  const MAX_PREVIEW_CHARS = 180;
  const note = useMemo(() => (item.note ?? '').trim(), [item.note]);
  const shouldTruncate = hasNote && note.length > MAX_PREVIEW_CHARS;
  const [expanded, setExpanded] = useState(false);

  const {
    isOpen: isNoteOpen,
    onOpen: onNoteOpen,
    onClose: onNoteClose,
  } = useDisclosure();

  const {
    isOpen: isImageOpen,
    onOpen: onImageOpen,
    onClose: onImageClose,
  } = useDisclosure();

  return (
    <>
      <Box p={3} bg={bg} borderWidth="1px" borderColor={border} rounded="md">
        <HStack spacing={2} align="center" justify="space-between">
          <HStack spacing={2} minW={0}>
            {item.criticality === 1 && <Icon as={AlertTriangle} color="red.500" boxSize={5} />}
            <Text fontWeight="semibold" noOfLines={2}>{item.label}</Text>
          </HStack>
        </HStack>

        <Divider my={2} />

        <HStack justify="space-between" align="center">
          <HStack spacing={2}>
            <Text fontSize="xs" color={muted}>{t('common.status')}</Text>
            <Badge colorScheme={scheme}>{item.state.toUpperCase()}</Badge>
          </HStack>
          <HStack spacing={2}>
            <Text fontSize="xs" color={muted}>{t('summary.findings_table.cost_estimate')}</Text>
            <Tag size="sm"><TagLabel>{costIndicatorToDollar(item.costIndicator)}</TagLabel></Tag>
          </HStack>
        </HStack>

        {(hasNote || hasImage) && (
          <>
            <Divider my={2} />
            <HStack align="flex-start" spacing={4}>
              {hasImage && (
                <ChakraImage
                  src={item.thumb}
                  boxSize="72px"
                  objectFit="cover"
                  rounded="md"
                  cursor="pointer"
                  onClick={onImageOpen}
                />
              )}
              {hasNote && (
                <Box flex="1">
                  {!expanded ? (
                    <Text
                      fontSize="sm"
                      color={muted}
                      fontStyle="italic"
                      noOfLines={3}
                      sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                    >
                      {shouldTruncate ? note.slice(0, MAX_PREVIEW_CHARS) + '…' : note}
                    </Text>
                  ) : (
                    <Text
                      fontSize="sm"
                      color={muted}
                      fontStyle="italic"
                      sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                    >
                      {note}
                    </Text>
                  )}

                  <HStack mt={1} spacing={3}>
                    {shouldTruncate && (
                      <Button
                        onClick={() => setExpanded((v) => !v)}
                        variant="link"
                        size="xs"
                        padding={0}
                      >
                        {expanded ? t('summary.note_show_less') : t('summary.note_show_more')}
                      </Button>
                    )}
                    <Button onClick={onNoteOpen} variant="link" size="xs" padding={0}>
                      {t('summary.note_open_full')}
                    </Button>
                  </HStack>
                </Box>
              )}
            </HStack>
          </>
        )}
      </Box>

      <Modal isOpen={isNoteOpen} onClose={onNoteClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pr={10}>{t('summary.note_modal_title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text
              fontSize="md"
              sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
            >
              {note}
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isImageOpen} onClose={onImageClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader pr={10}>{t('summary.image_modal_title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            {item.photoFull ? (
              <ChakraImage src={item.photoFull} w="100%" maxH="70vh" objectFit="contain" />
            ) : (
              <ChakraImage src={item.thumb ?? ''} w="100%" maxH="70vh" objectFit="contain" />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
