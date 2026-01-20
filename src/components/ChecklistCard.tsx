// src/components/ChecklistCard.tsx
import {
  Box, Heading, Text, HStack, IconButton, Textarea, useColorModeValue, Image as ChakraImage, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Button, VStack, Menu, MenuButton, MenuList, MenuItem, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
} from '@chakra-ui/react';
import { Camera, X, FileImage, MessageSquarePlus, Paperclip, HelpCircle, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { useChecklistItem } from '../hooks/useChecklistItem';
import { chooseFromLibrary, takePhoto } from '../utils/imageUtils';
import { useState, useEffect } from 'react';
import { isItemLocked as checkItemLocked, type AccessLevel } from '../utils/accessLevel';

interface Props {
  item: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    tags: string[];
    criticality?: number;
  };
  accessLevel?: AccessLevel;
}

export const ChecklistCard: React.FC<Props> = ({ item, accessLevel }) => {
  const { t } = useTranslation();
  const { itemState, handlers } = useChecklistItem(item.id);
  const { handleNoteSave, handleImageSelection } = handlers;

  const [note, setNote] = useState(itemState?.note || '');

  useEffect(() => {
    setNote(itemState?.note || '');
  }, [itemState?.note]);

  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isChoiceOpen, onOpen: onChoiceOpen, onClose: onChoiceClose } = useDisclosure();
  const { isOpen: isNoteOpen, onOpen: onNoteOpen, onClose: onNoteClose } = useDisclosure();

  // Bruk accessLevel hvis tilgjengelig, fallback til 'free' som sikrer at høy-kritikalitet er låst
  const isLocked = checkItemLocked(accessLevel ?? 'free', item.criticality);

  const value = itemState?.state;
  const thumb = itemState?.thumb;
  const full = itemState?.photoFull;

  const scheme = isLocked ? 'gray' : (value === 'ok' ? 'green' : value === 'obs' ? 'yellow' : value === 'kritisk' ? 'red' : 'gray');
  const bg = useColorModeValue(isLocked ? 'gray.100' : `${scheme}.50`, isLocked ? 'gray.800' : `gray.700`);
  const border = useColorModeValue(isLocked ? 'gray.200' : `${scheme}.200`, isLocked ? 'gray.700' : `${scheme}.600`);
  
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const previewBorderColor = useColorModeValue('gray.300', 'gray.600');
  const accordionButtonBg = useColorModeValue('blue.50', 'blue.900');
  const accordionButtonHoverBg = useColorModeValue('blue.100', 'blue.800');

  return (
    <Box p={4} bg={bg} borderWidth="1px" borderColor={border} rounded="xl" shadow="sm" opacity={isLocked ? 0.7 : 1}>
      <HStack justify="space-between">
        <Heading size="md" mb={isLocked ? 1 : 3}>{item.title}</Heading>
        {isLocked && <Lock size={20} />}
      </HStack>

      {/* Pro-funksjon banner for låste punkter */}
      {isLocked && (
        <Box 
          bg={useColorModeValue('blue.50', 'blue.900')} 
          px={3} 
          py={2} 
          rounded="md" 
          mb={3}
          borderWidth="1px"
          borderColor={useColorModeValue('blue.200', 'blue.700')}
        >
          <HStack spacing={2}>
            <Lock size={14} />
            <Text fontSize="sm" fontWeight="medium" color={useColorModeValue('blue.700', 'blue.200')}>
              {t('checklist.pro_feature_hint', { defaultValue: 'Dette sjekkpunktet krever Pro-tilgang' })}
            </Text>
          </HStack>
        </Box>
      )}

      <Accordion allowToggle index={isLocked ? [-1] : undefined}>
        <AccordionItem border="none">
          <h2>
            <AccordionButton
              as={Button}
              variant="ghost"
              bg={accordionButtonBg}
              _hover={{ bg: accordionButtonHoverBg }}
              rounded="md"
              p={2}
              w="100%"
              justifyContent="space-between"
              isDisabled={isLocked}
            >
              <HStack as="span" flex="1" textAlign="left">
                <HelpCircle size={18} />
                <Text fontWeight="medium">{t('checklist.card.show_guidance')}</Text>
              </HStack>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pt={4} pb={2} px={1}>
            <Box fontSize="md" color={textColor} sx={{ 'p': { mb: '0.5rem' } }} whiteSpace="pre-wrap">
              <ReactMarkdown>{item.description}</ReactMarkdown>
            </Box>
            {item.imageUrl && ( <ChakraImage src={item.imageUrl} alt={`Eksempelbilde for ${item.title}`} rounded="md" mt={4} /> )}
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <HStack mt={4} spacing={3} align="center">
        <Menu placement="top-start">
          <MenuButton as={IconButton} aria-label={t('checklist.card.attachments_label')} icon={<Paperclip size={18} />} size="sm" variant="outline" colorScheme={note || thumb ? 'blue' : 'gray'} isDisabled={isLocked} />
          <MenuList>
            <MenuItem icon={<MessageSquarePlus size={16} />} onClick={onNoteOpen}>{note ? t('checklist.card.edit_note') : t('checklist.card.add_note')}</MenuItem>
            <MenuItem icon={<Camera size={16} />} onClick={onChoiceOpen}>{thumb ? t('checklist.card.change_image') : t('checklist.card.add_image')}</MenuItem>
          </MenuList>
        </Menu>

        {thumb && (
          <ChakraImage src={thumb} boxSize="40px" objectFit="cover" rounded="md" cursor="pointer" onClick={onPreviewOpen} borderWidth="1px" borderColor={previewBorderColor} />
        )}
        {note && (
          <Box p={2} h="40px" flex="1" borderWidth="1px" borderColor={previewBorderColor} rounded="md" overflow="hidden" cursor="pointer" onClick={onNoteOpen}>
            <Text fontSize="sm" fontStyle="italic" noOfLines={2}>{note}</Text>
          </Box>
        )}
      </HStack>

      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none">
          <ChakraImage src={full} maxH="80vh" mx="auto" rounded="md" />
          <IconButton aria-label={t('checklist.card.close_button_label')} icon={<X />} position="absolute" top="8px" right="8px" onClick={onPreviewClose} isRound colorScheme="blackAlpha" />
        </ModalContent>
      </Modal>
      <Modal isOpen={isChoiceOpen} onClose={onChoiceClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('checklist.card.add_image_modal_title')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} my={4}>
              <Button leftIcon={<Camera />} w="100%" onClick={async () => { 
                const file = await takePhoto(); 
                onChoiceClose(); 
                if (file) await handleImageSelection(file); 
              }}>{t('checklist.card.take_photo_button')}</Button>
              <Button leftIcon={<FileImage />} w="100%" onClick={async () => { 
                const file = await chooseFromLibrary(); 
                onChoiceClose(); 
                if (file) await handleImageSelection(file); 
              }}>{t('checklist.card.choose_from_library_button')}</Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isOpen={isNoteOpen} onClose={() => { handleNoteSave(note); onNoteClose(); }} isCentered size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('checklist.card.note_modal_title', { title: item.title })}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Textarea placeholder={t('checklist.card.note_placeholder')} value={note} onChange={(e) => setNote(e.target.value)} autoFocus h="80vh"/>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};