// src/components/AddVendorModal.tsx
import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
  Button, FormControl, FormLabel, Input, VStack, useToast
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export interface NewVendor {
  name: string;
  email: string;
  website?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: NewVendor) => void;
}

const AddVendorModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  const handleSave = () => {
    if (!name || !email) {
      // Denne toasten kan oversettes hvis ønskelig
      toast({ title: "Name and email are required.", status: 'warning', duration: 3000 });
      return;
    }
    onSave({ name, email, website });
    onClose();
    setName('');
    setEmail('');
    setWebsite('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('modals.add_vendor.title')}</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>{t('modals.add_vendor.name_label')}</FormLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>{t('modals.add_vendor.email_label')}</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>{t('modals.add_vendor.website_label')}</FormLabel>
              <Input placeholder="https://example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>{t('common.cancel_button')}</Button>
          <Button colorScheme="blue" onClick={handleSave}>{t('common.save_button')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddVendorModal;