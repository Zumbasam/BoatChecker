// src/pages/HomePage.tsx
import React, { useRef, useState } from 'react';
import { Box, Heading, VStack, Button, Text, Spinner, Flex, HStack, Tag, useToast, Card, CardBody, Icon, Grid, GridItem, Stat, StatLabel, StatNumber, IconButton, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Switch } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PlusCircle, Ship, Zap, Activity, X, Heart } from 'lucide-react';
import { db } from '../db';
import type { Inspection } from '../db';
import { useUserStatus } from '../hooks/useUserStatus';
import { handleStartNewInspection } from '../utils/userActions';

const InspectionListItem: React.FC<{ inspection: Inspection; onDelete: (insp: Inspection) => void }> = ({ inspection, onDelete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isInProgress = inspection.status === 'in_progress';
  return (
    <Card as="li" variant="outline" size="md" w="100%" position="relative">
      <IconButton aria-label={t('home_page.delete_button_label')} icon={<X size={16} />} size="sm" variant="ghost" position="absolute" top="6px" right="6px" onClick={() => onDelete(inspection)} />
      <CardBody>
        <Flex direction={{ base: 'column', md: 'row' }} align="center" gap={4}>
          <Icon as={Ship} boxSize={8} color="gray.400" />
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={1} flex="1" textAlign={{ base: 'center', md: 'left' }}>
            <Heading size="sm">{inspection.name}</Heading>
            <Text fontSize="sm" color="gray.500">{new Date(inspection.createdAt).toLocaleDateString()}</Text>
          </VStack>
          <HStack spacing={2} mt={{ base: 4, md: 0 }}>
            <Tag colorScheme={isInProgress ? 'yellow' : 'green'} size="lg">
              {isInProgress ? t('home_page.status_in_progress') : t('home_page.status_completed')}
            </Tag>
            {isInProgress ? (
              <Button colorScheme="blue" onClick={() => navigate(`/checklist/${inspection.id}`)}>
                {t('home_page.continue_inspection_button')}
              </Button>
            ) : (
              <Button onClick={() => navigate(`/summary/${inspection.id}`)}>
                {t('home_page.view_report_button')}
              </Button>
            )}
          </HStack>
        </Flex>
      </CardBody>
    </Card>
  );
};

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const userStatus = useUserStatus();
  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState<Inspection | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const inspections = useLiveQuery(() => db.inspections.orderBy('createdAt').reverse().toArray(), []);
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  const lastInspection = inspections && inspections.length > 0 ? inspections[0] : null;
  const inProgress = inspections?.find(i => i.status === 'in_progress') || null;
  const completedCount = inspections?.filter(i => i.status === 'completed').length || 0;
  const contributeEnabled = settings?.contributeData ?? true;

  if (!inspections) {
    return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  }

  const startNew = async () => {
    await handleStartNewInspection(userStatus, navigate, toast, t, '/home');
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    await db.inspections.delete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const toggleProStatus = async () => {
    const newStatus = userStatus.isPro ? 'free' : 'pro';
    await db.settings.update('settings', { userStatus: newStatus });
    toast({
      title: `Status endret til ${newStatus.toUpperCase()}`,
      status: 'success',
      duration: 2000,
    });
  };

  const toggleContribute = async () => {
    const newValue = !contributeEnabled;
    await db.settings.update('settings', { contributeData: newValue });
    toast({
      title: newValue ? t('home_page.contribute_enabled') : t('home_page.contribute_disabled'),
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <Box p={4} maxW="container.lg" mx="auto">
      <VStack spacing={6} align="stretch">
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {inProgress ? (
                <>
                  <Heading size="md">{t('home_page.continue_inspection_button')}</Heading>
                  <Button colorScheme="blue" size="lg" onClick={() => navigate(`/checklist/${inProgress.id}`)}>
                    {t('home_page.continue_inspection_button')}
                  </Button>
                </>
              ) : inspections.length === 0 ? (
                <>
                  <Heading size="md">{t('home_page.welcome_title')}</Heading>
                  <Text color="gray.500">{t('home_page.welcome_desc')}</Text>
                  <Button leftIcon={<PlusCircle size="20px" />} colorScheme="blue" size="lg" onClick={startNew}>
                    {t('home_page.start_new_button')}
                  </Button>
                </>
              ) : (
                <>
                  <Heading size="md">{t('home_page.start_new_button')}</Heading>
                  <Button leftIcon={<PlusCircle size="20px" />} colorScheme="blue" size="lg" onClick={startNew}>
                    {t('home_page.start_new_button')}
                  </Button>
                  {lastInspection && lastInspection.status === 'completed' && (
                    <Button variant="outline" onClick={() => navigate(`/summary/${lastInspection.id}`)}>
                      {t('home_page.view_report_button')}
                    </Button>
                  )}
                </>
              )}
            </VStack>
          </CardBody>
        </Card>

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <GridItem colSpan={1}>
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">{t('home_page.title')}</Heading>
                  <Flex gap={6} wrap="wrap">
                    <Stat minW="120px">
                      <StatLabel>{t('home_page.status_completed')}</StatLabel>
                      <StatNumber>{completedCount}</StatNumber>
                    </Stat>
                    <Stat minW="120px">
                      <StatLabel>{t('home_page.status_in_progress')}</StatLabel>
                      <StatNumber>{inProgress ? 1 : 0}</StatNumber>
                    </Stat>
                  </Flex>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem colSpan={1}>
            <Card>
              <CardBody>
                <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }} gap={4}>
                  <Icon as={Activity} boxSize={8} color="purple.500" />
                  <VStack align="start" spacing={1} flex="1">
                    <Heading size="sm">{t('upgrade_page.title')}</Heading>
                    <Text fontSize="sm" color="gray.600">{t('upgrade_page.feature_1')}</Text>
                  </VStack>
                  <Button colorScheme="purple" leftIcon={<Zap size="18px" />} onClick={() => navigate('/upgrade', { state: { from: '/home' } })}>
                    {t('home_page.upgrade_now_button')}
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Bidra til fellesskapet */}
        <Card 
          variant="outline" 
          borderColor={contributeEnabled ? 'green.300' : 'gray.200'}
          bg={contributeEnabled ? 'green.50' : 'transparent'}
          _dark={{ 
            borderColor: contributeEnabled ? 'green.600' : 'gray.600',
            bg: contributeEnabled ? 'green.900' : 'transparent'
          }}
        >
          <CardBody>
            <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'center' }} gap={4}>
              <Icon as={Heart} boxSize={8} color={contributeEnabled ? 'red.400' : 'gray.400'} />
              <VStack align="start" spacing={1} flex="1">
                <Heading size="sm">{t('home_page.contribute_title')}</Heading>
                <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                  {t('home_page.contribute_desc')}
                </Text>
              </VStack>
              <Switch 
                isChecked={contributeEnabled} 
                onChange={toggleContribute}
                colorScheme="green"
                size="lg"
              />
            </Flex>
          </CardBody>
        </Card>

        {inspections.length > 0 && (
          <VStack spacing={4} align="stretch">
            <Heading size="md">{t('home_page.title')}</Heading>
            <VStack as="ul" listStyleType="none" spacing={4} align="stretch">
              {inspections.map((inspection: Inspection) => (
                <InspectionListItem key={inspection.id} inspection={inspection} onDelete={setDeleteTarget} />
              ))}
            </VStack>
          </VStack>
        )}

        {/* Utviklerverktøy - kun synlig i development mode */}
        {import.meta.env.DEV && (
          <Card variant="outline" bg="yellow.50" _dark={{ bg: 'yellow.900' }}>
            <CardBody>
              <VStack>
                <Heading size="sm">🛠️ Utviklerverktøy (kun synlig i dev)</Heading>
                <Text>Nåværende status: <strong>{userStatus.isPro ? 'PRO' : 'GRATIS'}</strong></Text>
                <Button size="sm" colorScheme="yellow" onClick={toggleProStatus}>
                  Bytt til {userStatus.isPro ? 'GRATIS' : 'PRO'}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

      </VStack>

      <AlertDialog isOpen={!!deleteTarget} leastDestructiveRef={cancelRef} onClose={() => setDeleteTarget(null)} isCentered>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>{t('home_page.delete_confirm_title')}</AlertDialogHeader>
          <AlertDialogBody>{t('home_page.delete_confirm_message')}</AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button colorScheme="red" ml={3} onClick={confirmDelete}>{t('common.delete')}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};