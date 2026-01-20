// src/pages/UpgradePage.tsx
import React, { useEffect, useState } from 'react';
import { Heading, VStack, Button, Image, Text, SimpleGrid, HStack, Icon, Box, Spinner, Alert, AlertIcon, Badge, useColorModeValue } from '@chakra-ui/react';
import { ShieldCheck, FileText, Wrench, Zap, Star, Tag } from 'lucide-react';
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
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.600');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  const highlightBorder = useColorModeValue('blue.300', 'blue.500');

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

  // Kategoriser pakker
  const isYearlyPackage = (pack: PurchasesPackage) => 
    pack.identifier.toLowerCase().includes('yearly') || 
    pack.identifier.toLowerCase().includes('annual') ||
    pack.identifier.toLowerCase().includes('year');

  const isSinglePackage = (pack: PurchasesPackage) => 
    pack.identifier.toLowerCase().includes('single') || 
    pack.identifier.toLowerCase().includes('report');

  // Sorter pakker: Årlig først, deretter månedlig, enkeltrapport til slutt
  const subscriptionPackages = packages
    .filter(p => !isSinglePackage(p))
    .sort((a, b) => {
      if (isYearlyPackage(a)) return -1;
      if (isYearlyPackage(b)) return 1;
      return 0;
    });
  
  const singlePackage = packages.find(p => isSinglePackage(p));

  return (
    <VStack 
      spacing={5} 
      p={5} 
      pt={4} 
      pb="calc(24px + env(safe-area-inset-bottom, 0px))"
      align="stretch" 
      maxW="lg" 
      mx="auto" 
      textAlign="center"
    >
      {/* Header */}
      <VStack spacing={2}>
        <Image src="/logo.svg" alt="BoatChecker" boxSize="60px" />
        <VStack spacing={0}>
          <Heading as="h1" size="lg">{t('upgrade_page.title')}</Heading>
          <Text color="gray.500" fontSize="sm">{t('upgrade_page.subtitle')}</Text>
        </VStack>
      </VStack>

      {/* Lanseringstilbud banner */}
      <Box 
        bg="orange.400" 
        color="white" 
        py={2} 
        px={4} 
        borderRadius="md"
        textAlign="center"
      >
        <HStack justify="center" spacing={2}>
          <Icon as={Tag} boxSize={4} />
          <Text fontWeight="bold" fontSize="sm">
            {t('upgrade_page.launch_offer.badge')}: {t('upgrade_page.launch_offer.title')}
          </Text>
        </HStack>
        <Text fontSize="xs" opacity={0.9}>
          {t('upgrade_page.launch_offer.description')}
        </Text>
      </Box>

      {/* Features - kompakt */}
      <SimpleGrid columns={3} spacing={2} w="100%">
        <VStack p={2} spacing={1}>
          <Icon as={ShieldCheck} boxSize={6} color="blue.500" />
          <Text fontSize="xs" fontWeight="medium" textAlign="center">{t('upgrade_page.feature_1_title')}</Text>
        </VStack>
        <VStack p={2} spacing={1}>
          <Icon as={FileText} boxSize={6} color="blue.500" />
          <Text fontSize="xs" fontWeight="medium" textAlign="center">{t('upgrade_page.feature_2_title')}</Text>
        </VStack>
        <VStack p={2} spacing={1}>
          <Icon as={Wrench} boxSize={6} color="blue.500" />
          <Text fontSize="xs" fontWeight="medium" textAlign="center">{t('upgrade_page.feature_3_title')}</Text>
        </VStack>
      </SimpleGrid>

      {/* Abonnementer */}
      <VStack w="100%" spacing={3}>
        {isLoading ? (
          <Spinner size="lg" />
        ) : subscriptionPackages.length > 0 ? (
          <>
            {subscriptionPackages.map(pack => {
              const isYearly = isYearlyPackage(pack);
              return (
                <Box 
                  key={pack.identifier}
                  w="100%"
                  p={4}
                  borderRadius="lg"
                  borderWidth="2px"
                  borderColor={isYearly ? highlightBorder : cardBorder}
                  bg={isYearly ? highlightBg : cardBg}
                  position="relative"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.02)' }}
                >
                  {/* Best value badge for årlig */}
                  {isYearly && (
                    <Badge 
                      position="absolute" 
                      top="-10px" 
                      left="50%" 
                      transform="translateX(-50%)"
                      colorScheme="orange"
                      fontSize="xs"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      <HStack spacing={1}>
                        <Star size={12} />
                        <Text>{t('upgrade_page.launch_offer.best_value')}</Text>
                      </HStack>
                    </Badge>
                  )}
                  
                  <VStack spacing={2}>
                    <Text fontWeight="bold" fontSize="lg">
                      {pack.product.title}
                    </Text>
                    
                    {/* Pris med gjennomstreking for årlig */}
                    <HStack spacing={2} justify="center" align="baseline">
                      {isYearly && (
                        <Text 
                          fontSize="md" 
                          color="gray.500" 
                          textDecoration="line-through"
                        >
                          kr 499
                        </Text>
                      )}
                      <Text 
                        fontSize="2xl" 
                        fontWeight="bold" 
                        color={isYearly ? 'green.500' : undefined}
                      >
                        {pack.product.priceString}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {isYearly ? t('upgrade_page.launch_offer.per_year') : t('upgrade_page.launch_offer.per_month')}
                      </Text>
                    </HStack>
                    
                    <Button 
                      colorScheme={isYearly ? 'blue' : 'gray'}
                      variant={isYearly ? 'solid' : 'outline'}
                      size="lg" 
                      w="100%" 
                      leftIcon={<Zap size="18px" />} 
                      onClick={() => handleUpgradeClick(pack)}
                      isLoading={isPurchasing}
                    >
                      {isYearly ? t('upgrade_page.upgrade_button') : t('common.select')}
                    </Button>
                  </VStack>
                </Box>
              );
            })}
          </>
        ) : (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">{t('upgrade_page.no_products_found')}</Text>
          </Alert>
        )}
      </VStack>

      {/* Enkeltrapport - egen seksjon */}
      {singlePackage && (
        <Box 
          w="100%" 
          p={4} 
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={cardBorder}
          bg={useColorModeValue('gray.50', 'gray.900')}
        >
          <VStack spacing={2}>
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              {t('upgrade_page.single_report.title')}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {t('upgrade_page.single_report.description')}
            </Text>
            <Button 
              variant="outline"
              size="md"
              w="100%"
              onClick={() => handleUpgradeClick(singlePackage)}
              isLoading={isPurchasing}
            >
              {singlePackage.product.title} — {singlePackage.product.priceString}
            </Button>
          </VStack>
        </Box>
      )}
        
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleBackClick} 
        isDisabled={isPurchasing}
      >
        {t('common.back_button')}
      </Button>
    </VStack>
  );
};

export default UpgradePage;