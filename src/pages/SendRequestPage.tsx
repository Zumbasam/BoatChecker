// src/pages/SendRequestPage.tsx
import React from 'react';
import {
  Box, Heading, VStack, Button, Spinner, Flex, Divider
} from '@chakra-ui/react';
import { useSendRequest } from '../hooks/useSendRequest';
import { FindingsSummary } from '../components/send-request/FindingsSummary';
import { VendorSelection } from '../components/send-request/VendorSelection';
import { UserInfoForm } from '../components/send-request/UserInfoForm';

const SendRequestPage: React.FC = () => {
  const {
    isLoading, rows, regionCode, setRegionCode, regionCodes, tRegions,
    filteredVendors, selectedVendorIds, handleVendorToggle, newVendors,
    handleAddVendor, userInfo, handleUserInfoChange, isSubmitting,
    isFormValid, handleSubmit, t
  } = useSendRequest();

  if (isLoading) {
    return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  }

  return (
    <Box p={4} maxW="container.md" mx="auto">
      <VStack spacing={8} align="stretch">
        <Heading textAlign="center">{t('send_request_page.title')}</Heading>

        <FindingsSummary rows={rows} />
        <Divider />

        <VendorSelection
          regionCode={regionCode}
          setRegionCode={setRegionCode}
          regionCodes={regionCodes}
          tRegions={tRegions}
          filteredVendors={filteredVendors}
          selectedVendorIds={selectedVendorIds}
          handleVendorToggle={handleVendorToggle}
          newVendors={newVendors}
          handleAddVendor={handleAddVendor}
          t={t}
        />
        <Divider />

        <UserInfoForm
          userInfo={userInfo}
          handleUserInfoChange={handleUserInfoChange}
          t={t}
        />

        <Button
          colorScheme="blue"
          size="lg"
          onClick={handleSubmit}
          isDisabled={!isFormValid || isSubmitting}
          isLoading={isSubmitting}
          loadingText={t('send_request_page.sending_button')}
        >
          {t('send_request_page.send_button')}
        </Button>
      </VStack>
    </Box>
  );
};

export default SendRequestPage;