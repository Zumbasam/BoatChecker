// src/pages/UpgradePage.tsx
import React, { useEffect, useState } from 'react';
import { Heading, VStack, Button, Image, Text, SimpleGrid, HStack, Icon, Box, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { ShieldCheck, FileText, Wrench, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PurchasesService, { type PurchasesPackage } from '../services/PurchasesService';

const UpgradePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const fetchOfferings = async () => {
      setIsLoading(true);
      await PurchasesService.init();
      const availablePackages = await PurchasesService.getOfferings();
      setPackages(availablePackages);
      setIsLoading(false);
    };
    fetchOfferings();
  }, []);

  useEffect(() => {
    const stateFrom = (location.state as any)?.from as string | undefined;
    const qsFrom = new URLSearchParams(location.search).get('from') || undefined;
    const from = stateFrom ?? qsFrom;
    if (from) sessionStorage.setItem('upgrade:returnTo', from);
  }, [location]);

  const handleUpgradeClick = async (pack: PurchasesPackage) => {
    setIsPurchasing(true);
    const success = await PurchasesService.purchasePackage(pack);
    if (success) {
      const returnTo = sessionStorage.getItem('upgrade:returnTo') || '/home';
      navigate(returnTo, { replace: true });
    }
    setIsPurchasing(false);
  };

  const handleBackClick = () => {
    const stateFrom = (location.state as any)?.from as string | undefined;
    const stored = sessionStorage.getItem('upgrade:returnTo') || undefined;
    const target = stateFrom ?? stored;
    if (target) navigate(target, { replace: true });
    else navigate(-1);
  };

  return (
    <VStack 
      spacing={6} 
      p={6} 
      pt={4} 
      pb="calc(24px + env(safe-area-inset-bottom, 0px))"
      align="stretch" 
      maxW="lg" 
      mx="auto" 
      textAlign="center"
    >
      {/* Header - alltid synlig øverst */}
      <VStack spacing={3}>
        <Image src="/logo.svg" alt="BoatChecker App Logo" boxSize="70px" />
        <VStack spacing={1}>
          <Heading as="h1" size="lg">{t('upgrade_page.title')}</Heading>
          <Text color="gray.500" fontSize="sm">{t('upgrade_page.subtitle')}</Text>
        </VStack>
      </VStack>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
        <Box p={4} borderWidth="1px" rounded="md">
          <HStack spacing={3} mb={2}>
            <Icon as={ShieldCheck} />
            <Heading as="h3" size="sm">{t('upgrade_page.feature_1_title')}</Heading>
          </HStack>
          <Text fontSize="sm">{t('upgrade_page.feature_1_desc')}</Text>
        </Box>
        <Box p={4} borderWidth="1px" rounded="md">
          <HStack spacing={3} mb={2}>
            <Icon as={FileText} />
            <Heading as="h3" size="sm">{t('upgrade_page.feature_2_title')}</Heading>
          </HStack>
          <Text fontSize="sm">{t('upgrade_page.feature_2_desc')}</Text>
        </Box>
        <Box p={4} borderWidth="1px" rounded="md">
          <HStack spacing={3} mb={2}>
            <Icon as={Wrench} />
            <Heading as="h3" size="sm">{t('upgrade_page.feature_3_title')}</Heading>
          </HStack>
          <Text fontSize="sm">{t('upgrade_page.feature_3_desc')}</Text>
        </Box>
      </SimpleGrid>
      <VStack w="100%" spacing={3}>
        {isLoading ? (
          <Spinner />
        ) : packages.length > 0 ? (
          packages.map(pack => (
            <Button 
              key={pack.identifier}
              colorScheme="purple" 
              size="lg" 
              w="100%" 
              leftIcon={<Zap size="20px" />} 
              onClick={() => handleUpgradeClick(pack)}
              isLoading={isPurchasing}
            >
              {`${pack.product.title} - ${pack.product.priceString}`}
            </Button>
          ))
        ) : (
          <Alert status="warning">
            <AlertIcon />
            {t('upgrade_page.no_products_found')}
          </Alert>
        )}
        <Button variant="ghost" onClick={handleBackClick} isDisabled={isPurchasing}>
          {t('common.back_button')}
        </Button>
      </VStack>
    </VStack>
  );
};

export default UpgradePage;