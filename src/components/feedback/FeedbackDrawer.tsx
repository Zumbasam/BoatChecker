// src/components/feedback/FeedbackDrawer.tsx
import React, { useState } from 'react';
import {
  Box, Text, Button, VStack, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, DrawerCloseButton, FormControl, FormLabel, RadioGroup, Radio, Textarea, Input,
} from "@chakra-ui/react";
import { useTranslation } from 'react-i18next';
import type { ChecklistItemType } from '../../hooks/useChecklistData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeItem: ChecklistItemType | null | undefined;
}

export const FeedbackDrawer: React.FC<Props> = ({ isOpen, onClose, activeItem }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formResponse, setFormResponse] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormResponse('');
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      const response = await fetch('/api/feedback.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (response.ok) {
        setFormResponse(t('modals.feedback.success_message'));
        setTimeout(() => { onClose(); setFormResponse(''); }, 2000);
      } else { throw new Error(result.message || 'Noe gikk galt.'); }
    } catch (error) {
      if (error instanceof Error) { setFormResponse(`${t('modals.feedback.error_prefix')} ${error.message}`); } else { setFormResponse('En ukjent feil oppstod.'); }
    } finally { setIsSubmitting(false); }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">{t('modals.feedback.header')}</DrawerHeader>
        <DrawerBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Box><Text fontSize="sm" color="gray.500">{t('modals.feedback.checkpoint_label')}</Text><Text fontWeight="bold">{activeItem?.title || t('modals.feedback.general_feedback')}</Text></Box>
              <input type="hidden" name="sjekkpunkt_id" value={activeItem?.id || 'N/A'} />
              <input type="hidden" name="sjekkpunkt_tittel" value={activeItem?.title || 'N/A'} />
              <FormControl as="fieldset"><FormLabel as="legend">{t('modals.feedback.category_label')}</FormLabel><RadioGroup name="kategori" defaultValue="Annet"><VStack align="start">
                <Radio value="Instruksjon uklar/feil">{t('modals.feedback.category_option_unclear')}</Radio>
                <Radio value="Mangler sjekkpunkt">{t('modals.feedback.category_option_missing')}</Radio>
                <Radio value="Teknisk feil">{t('modals.feedback.category_option_bug')}</Radio>
                <Radio value="Annet">{t('modals.feedback.category_option_other')}</Radio>
              </VStack></RadioGroup></FormControl>
              <FormControl><FormLabel>{t('modals.feedback.details_label')}</FormLabel><Textarea name="melding" placeholder={t('modals.feedback.details_placeholder')} rows={8} required /></FormControl>
              <FormControl><FormLabel>{t('modals.feedback.email_label')}</FormLabel><Input type="email" name="email" placeholder={t('modals.feedback.email_placeholder')} /></FormControl>
              <Button type="submit" colorScheme="blue" isLoading={isSubmitting}>{t('modals.feedback.submit_button')}</Button>
              {formResponse && <Text color={formResponse.startsWith(t('modals.feedback.error_prefix')) ? 'red.500' : 'green.500'} pt={2}>{formResponse}</Text>}
            </VStack>
          </form>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};