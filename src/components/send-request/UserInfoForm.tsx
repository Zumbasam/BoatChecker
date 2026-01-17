// src/components/send-request/UserInfoForm.tsx
import React from 'react';
import { VStack, Heading, FormControl, FormLabel, Input, Textarea } from '@chakra-ui/react';

interface UserInfo {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface Props {
  userInfo: UserInfo;
  handleUserInfoChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  t: (key: string) => string;
}

export const UserInfoForm: React.FC<Props> = ({ userInfo, handleUserInfoChange, t }) => {
  return (
    <VStack as="section" align="stretch" spacing={4}>
      <Heading size="md">{t('send_request_page.user_info_header')}</Heading>
      <FormControl isRequired>
        <FormLabel>{t('send_request_page.user_info_name_label')}</FormLabel>
        <Input name="name" value={userInfo.name} onChange={handleUserInfoChange} />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>{t('send_request_page.user_info_email_label')}</FormLabel>
        <Input type="email" name="email" value={userInfo.email} onChange={handleUserInfoChange} />
      </FormControl>
      <FormControl>
        <FormLabel>{t('send_request_page.user_info_phone_label')}</FormLabel>
        <Input type="tel" name="phone" value={userInfo.phone} onChange={handleUserInfoChange} />
      </FormControl>
      <FormControl>
        <FormLabel>{t('send_request_page.user_info_message_label')}</FormLabel>
        <Textarea name="message" value={userInfo.message} onChange={handleUserInfoChange} placeholder={t('send_request_page.user_info_message_placeholder')} />
      </FormControl>
    </VStack>
  );
};