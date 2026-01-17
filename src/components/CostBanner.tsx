// src/components/CostBanner.tsx
import React from 'react';
import {
  Box,
  useColorMode,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Grid,
  GridItem,
  useDisclosure
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Home, Menu as MenuIcon, Sun, Moon, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SettingsModal } from "./SettingsModal";
import Logo from '../assets/boatchecker-logo.svg?react';

export const CostBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const menu = useDisclosure();

  const bg = useColorModeValue('gray.100', 'gray.800');
  const border = useColorModeValue('gray.200', 'gray.700');
  const logoColor = useColorModeValue('gray.800', 'white');

  return (
    <Grid
      w="100%"
      px={4}
      py={2}
      bg={bg}
      borderBottom="1px solid"
      borderColor={border}
      position="sticky"
      top="0"
      zIndex={1000}
      alignItems="center"
      templateColumns="1fr auto 1fr"
    >
      <GridItem justifySelf="start">
        <Box id="costbanner-status-slot" display="inline-block" />
      </GridItem>

      <GridItem justifySelf="center">
        <Logo style={{ height: '20px', fill: logoColor }} />
      </GridItem>

      <GridItem justifySelf="end">
        <Menu isOpen={menu.isOpen} onClose={menu.onClose}>
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<MenuIcon />}
            variant="ghost"
            isRound
            onClick={() => (menu.isOpen ? menu.onClose() : menu.onOpen())}
          />
          <MenuList minW="220px" p={2}>
            <MenuItem
              icon={<Home size={18} />}
              onClick={() => {
                menu.onClose();
                navigate('/home');
              }}
              borderRadius="md"
            >
              {t('home_page.home_button_label')}
            </MenuItem>
            <MenuItem
              icon={colorMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              onClick={() => {
                menu.onClose();
                toggleColorMode();
              }}
              borderRadius="md"
            >
              {t('common.toggle_dark_mode')}
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={<MessageCircle size={18} />}
              borderRadius="md"
              onClick={() => {
                menu.onClose();
                setTimeout(() => window.dispatchEvent(new Event('open-feedback-drawer')), 0);
              }}
            >
              {t('modals.feedback.button_text')}
            </MenuItem>
            <SettingsModal />
          </MenuList>
        </Menu>
      </GridItem>
    </Grid>
  );
};
