// src/components/stepper/QuestionView.tsx
import React from 'react';
import { Box, Flex, useColorModeValue, HStack, IconButton, Collapse, useDisclosure, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkCircle, IoAlertCircle, IoCloseCircle } from 'react-icons/io5';
import { ArrowLeft, ArrowRight, ChevronUp, MessageCircle } from 'lucide-react';
import { ChecklistCard } from '../ChecklistCard';
import { useChecklistItem } from '../../hooks/useChecklistItem';
import type { ChecklistItemType } from '../../hooks/useChecklistData';
import { isItemLocked as checkItemLocked, type AccessLevel } from '../../utils/accessLevel';

interface Props {
  item: ChecklistItemType | undefined;
  activeStep: number;
  totalSteps: number;
  accessLevel: AccessLevel;
  onNext: () => void;
  onBack: () => void;
  onFeedbackOpen: () => void;
}

export const QuestionView: React.FC<Props> = ({ item, activeStep, totalSteps, accessLevel, onNext, onBack, onFeedbackOpen }) => {
  const { t } = useTranslation();
  const footerBg = useColorModeValue('whiteAlpha.800', 'gray.800');
  const { itemState, handlers } = useChecklistItem(item?.id);
  const { handleStateChange } = handlers;
  const { isOpen: isFeedbackBarOpen, onToggle: onFeedbackBarToggle } = useDisclosure();
  const tabBg = useColorModeValue('gray.200', 'gray.700');

  const value = itemState?.state;

  const isLastStep = activeStep === totalSteps - 2;
  const isLocked = checkItemLocked(accessLevel, item?.criticality);

  const statusOptions = [
    { value: 'ok', icon: <IoCheckmarkCircle size="44px" />, color: 'green' },
    { value: 'obs', icon: <IoAlertCircle size="44px" />, color: 'yellow' },
    { value: 'kritisk', icon: <IoCloseCircle size="44px" />, color: 'red' },
  ];

  if (!item) {
    return null;
  }

  return (
    <>
      <Box p={4} pb="calc(150px + env(safe-area-inset-bottom, 0px))"><ChecklistCard item={item} accessLevel={accessLevel} /></Box>
      <Box 
        as="footer" 
        position="fixed" 
        bottom="0" 
        left="0" 
        right="0" 
        bg={footerBg} 
        backdropFilter="blur(10px)" 
        zIndex="sticky" 
        boxShadow="0 -2px 10px rgba(0, 0, 0, 0.1)"
        pb="env(safe-area-inset-bottom, 0px)"
      >
        <Collapse in={isFeedbackBarOpen} animateOpacity>
          <Flex justify="center" p={2}>
            <Button
              leftIcon={<MessageCircle size={16} />}
              variant="ghost"
              onClick={onFeedbackOpen}
            >
              {t('modals.feedback.button_text')}
            </Button>
          </Flex>
        </Collapse>
        <Flex justify="center" position="relative" top="-12px">
          <IconButton
            aria-label="Toggle feedback"
            icon={<ChevronUp />}
            size="xs"
            isRound
            bg={tabBg}
            onClick={onFeedbackBarToggle}
            transform={isFeedbackBarOpen ? 'rotate(180deg)' : 'none'}
            transition="transform 0.2s"
            boxShadow="md"
          />
        </Flex>
        <Flex p={4} pt={0} mt="-12px" justify="space-between" align="center">
          <IconButton
            aria-label={t('common.back_button')}
            icon={<ArrowLeft size={28} />}
            size="lg"
            isRound
            colorScheme="gray"
            variant="solid"
            isDisabled={activeStep === 0}
            onClick={onBack}
          />
          <HStack spacing={5}>
            {statusOptions.map(opt => {
              // OK er "default" - vises som valgt når ingenting er eksplisitt valgt
              // MEN: Ikke vis OK som default for låste punkter
              const isSelected = value === opt.value;
              const isDefaultOk = opt.value === 'ok' && !value && !isLocked;
              return (
                <IconButton
                  key={opt.value}
                  aria-label={opt.value}
                  icon={opt.icon}
                  size="xl"
                  isRound
                  colorScheme={isLocked ? 'gray' : opt.color}
                  variant={(isSelected || isDefaultOk) ? 'outline' : 'ghost'}
                  opacity={isLocked ? 0.3 : (isSelected || isDefaultOk) ? 1 : 0.5}
                  onClick={() => { handleStateChange(opt.value as 'ok' | 'obs' | 'kritisk'); }}
                  isDisabled={isLocked}
                />
              );
            })}
          </HStack>
          <IconButton
            aria-label={isLastStep ? t('common.finish_button') : t('common.next_button')}
            icon={<ArrowRight size={28} />}
            size="lg"
            isRound
            colorScheme="blue"
            onClick={onNext}
          />
        </Flex>
      </Box>
    </>
  );
};