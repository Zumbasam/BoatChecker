// src/components/send-request/VendorSelection.tsx
import React from 'react';
import { VStack, FormControl, FormLabel, Select, Heading, Checkbox, Text, Box, List, ListItem, Button, useDisclosure } from '@chakra-ui/react';
import AddVendorModal from '../AddVendorModal';
import type { NewVendor } from '../AddVendorModal';

interface Vendor {
  id: number;
  name: string;
  regions: string[];
}

interface Props {
  regionCode: string;
  setRegionCode: (code: string) => void;
  regionCodes: string[];
  tRegions: (key: string) => string;
  filteredVendors: Vendor[];
  selectedVendorIds: number[];
  handleVendorToggle: (id: number) => void;
  newVendors: NewVendor[];
  handleAddVendor: (vendor: NewVendor) => void;
  t: (key: string) => string;
}

export const VendorSelection: React.FC<Props> = ({
  regionCode, setRegionCode, regionCodes, tRegions, filteredVendors,
  selectedVendorIds, handleVendorToggle, newVendors, handleAddVendor, t
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <FormControl as="section">
        <FormLabel fontWeight="bold">{t('send_request_page.select_region_label')}</FormLabel>
        <Select placeholder={t('send_request_page.select_region_placeholder')} value={regionCode} onChange={e => setRegionCode(e.target.value)}>
          {regionCodes.map(code => (
            <option key={code} value={code}>{tRegions(code)}</option>
          ))}
        </Select>
      </FormControl>

      {regionCode && (
        <VStack as="section" align="stretch" spacing={4}>
          <Heading size="md">{t('send_request_page.vendors_header')}</Heading>
          {filteredVendors.length > 0 ? (
            filteredVendors.map(vendor => (
              <Checkbox key={vendor.id} isChecked={selectedVendorIds.includes(vendor.id)} onChange={() => handleVendorToggle(vendor.id)}>
                {vendor.name}
              </Checkbox>
            ))
          ) : (
            <Text color="gray.500">{t('send_request_page.no_vendors_found')}</Text>
          )}
          
          {newVendors.length > 0 && (
            <Box pt={4}>
              <Heading size="sm">{t('send_request_page.newly_added_vendors_header')}</Heading>
              <List spacing={2} mt={2}>
                {newVendors.map((vendor, index) => (
                  <ListItem key={index} fontStyle="italic">{vendor.name} ({vendor.email})</ListItem>
                ))}
              </List>
            </Box>
          )}

          <Button variant="link" onClick={onOpen} alignSelf="flex-start" mt={2}>
            {t('picker.model.add_manual_link')}
          </Button>
        </VStack>
      )}
      <AddVendorModal isOpen={isOpen} onClose={onClose} onSave={handleAddVendor} />
    </>
  );
};