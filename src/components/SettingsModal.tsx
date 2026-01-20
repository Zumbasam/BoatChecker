// src/components/SettingsModal.tsx
import {
  Modal, ModalBody, ModalContent,
  ModalHeader, ModalOverlay, Button, useDisclosure,
  VStack, Text, Divider, ButtonGroup, MenuItem,
  Switch, HStack, Box, Icon
} from '@chakra-ui/react';
import { Settings as Gear, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../db';
import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUserStatus } from '../hooks/useUserStatus';
import { handleStartNewInspection } from '../utils/userActions';
import { useToast } from '@chakra-ui/react';

export const SettingsModal = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t, i18n } = useTranslation();
  const userStatus = useUserStatus();

  const currentSettings = useLiveQuery(() => db.settings.get('settings'), []);
  const [language, setLanguage] = useState('nb');
  const [contributeData, setContributeData] = useState(true);

  useEffect(() => {
    if (isOpen && currentSettings) {
      setLanguage(currentSettings.language || 'nb');
      setContributeData(currentSettings.contributeData ?? true);
    }
  }, [isOpen, currentSettings]);

  const handleSaveSettings = async () => {
    await i18n.changeLanguage(language as 'nb' | 'en');
    await db.settings.update('settings', { 
      language: language as 'nb' | 'en',
      contributeData 
    });
    toast({
      title: t('modals.settings.saved_toast'),
      status: 'success',
      duration: 2000,
    });
    onClose();
  };

  const handleContributeToggle = (checked: boolean) => {
    setContributeData(checked);
  };

  const handleStartNew = async () => {
    if (window.confirm(t('modals.settings.reset_confirm_text'))) {
      onClose();
      const m = location.pathname.match(/\/(checklist|summary)\/(\d+)/);
      const currentId = m ? Number(m[2]) : undefined;
      if (currentId) {
        await db.inspections.delete(currentId);
        try { sessionStorage.removeItem(`dataSubmitted_${currentId}`); } catch {}
      }
      await handleStartNewInspection(userStatus, navigate, toast, t, location.pathname + location.search);
    }
  };

  return (
    <>
      <MenuItem icon={<Gear size={18} />} onClick={onOpen} borderRadius="md">
        {t('modals.settings.title')}
      </MenuItem>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack justify="space-between" align="center">
              <Text>{t('modals.settings.title')}</Text>
              <Button size="sm" colorScheme="blue" onClick={onClose}>{t('common.close_button')}</Button>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">{t('common.language')}</Text>
              <ButtonGroup w="100%">
                <Button w="50%" isActive={language === 'nb'} onClick={() => setLanguage('nb')}>Norsk 🇳🇴</Button>
                <Button w="50%" isActive={language === 'en'} onClick={() => setLanguage('en')}>English 🇬🇧</Button>
              </ButtonGroup>
              
              <Divider pt={2} />
              
              {/* Bidra til fellesskapet */}
              <Box pt={2}>
                <HStack justify="space-between" align="start">
                  <HStack spacing={3} align="start">
                    <Icon as={Heart} color="red.400" mt={1} />
                    <Box>
                      <Text fontWeight="bold">{t('modals.settings.contribute_title')}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {t('modals.settings.contribute_desc')}
                      </Text>
                    </Box>
                  </HStack>
                  <Switch 
                    isChecked={contributeData} 
                    onChange={(e) => handleContributeToggle(e.target.checked)}
                    colorScheme="green"
                    size="lg"
                  />
                </HStack>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  {t('modals.settings.contribute_privacy')}
                </Text>
              </Box>

              <Button colorScheme="blue" onClick={handleSaveSettings}>
                {t('modals.settings.save_button')}
              </Button>
              
              <Divider pt={2} />
              <Text pt={2} fontWeight="bold">{t('modals.settings.start_over_header')}</Text>
              <Text fontSize="sm" color="gray.500">{t('modals.settings.start_over_desc')}</Text>
              <Button colorScheme="red" variant="outline" onClick={handleStartNew}>
                {t('modals.settings.reset_button')}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
