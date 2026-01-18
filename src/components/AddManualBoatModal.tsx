// src/components/AddManualBoatModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, VStack, Select, useToast, HStack, 
  InputGroup, InputRightAddon, InputRightElement, Divider, Text, Collapse, useDisclosure,
  Badge, Tooltip, Alert, AlertIcon, Box
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon, CheckIcon } from '@chakra-ui/icons';
import { useTranslation } from 'react-i18next';
import type { CustomBoatDetails } from '../db';
import { useUserStatus } from '../hooks/useUserStatus';
import { fetchListingMetadata, isKnownListingSite } from '../utils/listingParser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: CustomBoatDetails) => void;
  typePrimary: 'sailboat' | 'motorboat' | undefined;
}

const AddManualBoatModal: React.FC<Props> = ({ isOpen, onClose, onSave, typePrimary }) => {
  const { t } = useTranslation();
  const { isPro } = useUserStatus();
  const { isOpen: showAdvanced, onToggle: toggleAdvanced } = useDisclosure();
  
  // Grunnleggende info
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [hullMaterial, setHullMaterial] = useState('');
  const [typeSecondary, setTypeSecondary] = useState('Monohull');
  const [engineType, setEngineType] = useState<'inboard' | 'outboard' | ''>('');
  
  // Dimensjoner
  const [loa, setLoa] = useState('');
  const [beam, setBeam] = useState('');
  const [draft, setDraft] = useState('');
  const [displacement, setDisplacement] = useState('');
  
  // Motor
  const [engineMake, setEngineMake] = useState('');
  const [enginePower, setEnginePower] = useState('');
  const [engineHours, setEngineHours] = useState('');
  const [fuelType, setFuelType] = useState<'diesel' | 'petrol' | 'electric' | 'hybrid' | ''>('');
  
  // Identifikasjon
  const [hin, setHin] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  
  // Annonsereferanse
  const [listingUrl, setListingUrl] = useState('');
  
  // URL parsing state
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetched, setUrlFetched] = useState(false);
  const [fetchedTitle, setFetchedTitle] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) {
      // Reset alle felter når modal lukkes
      setManufacturer('');
      setModel('');
      setYear('');
      setHullMaterial('');
      setTypeSecondary('Monohull');
      setEngineType('');
      setLoa('');
      setBeam('');
      setDraft('');
      setDisplacement('');
      setEngineMake('');
      setEnginePower('');
      setEngineHours('');
      setFuelType('');
      setHin('');
      setRegistrationNumber('');
      setListingUrl('');
      setIsFetchingUrl(false);
      setUrlFetched(false);
      setFetchedTitle('');
    }
  }, [isOpen]);

  // Hent info fra URL (Pro-funksjon)
  const handleFetchFromUrl = async () => {
    if (!listingUrl || !isPro) return;
    
    setIsFetchingUrl(true);
    setUrlFetched(false);
    
    try {
      const metadata = await fetchListingMetadata(listingUrl);
      
      if (metadata) {
        // Fyll inn foreslåtte verdier (brukeren kan overskrive)
        if (metadata.manufacturer && !manufacturer) {
          setManufacturer(metadata.manufacturer);
        }
        if (metadata.model && !model) {
          setModel(metadata.model);
        }
        if (metadata.year && !year) {
          setYear(metadata.year);
        }
        if (metadata.title) {
          setFetchedTitle(metadata.title);
        }
        
        setUrlFetched(true);
        toast({
          title: t('modals.add_manual_boat.url_fetch_success'),
          description: t('modals.add_manual_boat.url_fetch_confirm'),
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } else {
        toast({
          title: t('modals.add_manual_boat.url_fetch_no_data'),
          description: t('modals.add_manual_boat.url_fetch_manual'),
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('[AddManualBoatModal] Feil ved henting av URL:', error);
      toast({
        title: t('modals.add_manual_boat.url_fetch_error'),
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const isMotorboat = typePrimary === 'motorboat';

  const handleSave = () => {
    if (!manufacturer || !model) {
      toast({
        title: t('modals.add_manual_boat.toast_missing_info_title'),
        description: t('modals.add_manual_boat.toast_missing_info_desc'),
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isMotorboat && !engineType) {
      toast({
        title: t('modals.add_manual_boat.toast_missing_engine_title'),
        description: t('modals.add_manual_boat.toast_missing_engine_desc'),
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const details: CustomBoatDetails = { 
      manufacturer, 
      model, 
      year, 
      hullMaterial: hullMaterial || undefined,
      typeSecondary: typeSecondary as 'Monohull' | 'Multihull',
      engineType: isMotorboat ? engineType as 'inboard' | 'outboard' : 'inboard',
      // Dimensjoner (konverter til tall)
      loa: loa ? parseFloat(loa) : undefined,
      beam: beam ? parseFloat(beam) : undefined,
      draft: draft ? parseFloat(draft) : undefined,
      displacement: displacement ? parseFloat(displacement) : undefined,
      // Motor
      engineMake: engineMake || undefined,
      enginePower: enginePower ? parseFloat(enginePower) : undefined,
      engineHours: engineHours ? parseFloat(engineHours) : undefined,
      fuelType: fuelType || undefined,
      // Identifikasjon
      hin: hin || undefined,
      registrationNumber: registrationNumber || undefined,
      // Annonsereferanse
      listingUrl: listingUrl || undefined,
    };

    onSave(details);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside" size="lg">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>{t('modals.add_manual_boat.title')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Annonsereferanse - øverst for enkel tilgang */}
            <FormControl>
              <FormLabel>
                {t('modals.add_manual_boat.listing_url_label')}
                {isPro && <Badge ml={2} colorScheme="purple" fontSize="xs">PRO</Badge>}
              </FormLabel>
              <InputGroup>
                <Input 
                  placeholder={t('modals.add_manual_boat.listing_url_placeholder')} 
                  value={listingUrl} 
                  onChange={(e) => {
                    setListingUrl(e.target.value);
                    setUrlFetched(false);
                  }}
                  type="url"
                  pr={isPro ? "100px" : "40px"}
                />
                <InputRightElement width={isPro ? "100px" : "40px"}>
                  <HStack spacing={1}>
                    {listingUrl && (
                      <Tooltip label={t('modals.add_manual_boat.open_url_tooltip')}>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => window.open(listingUrl, '_blank')}
                        >
                          <ExternalLinkIcon />
                        </Button>
                      </Tooltip>
                    )}
                    {isPro && listingUrl && (
                      <Tooltip label={urlFetched ? t('modals.add_manual_boat.url_fetched') : t('modals.add_manual_boat.fetch_info_tooltip')}>
                        <Button
                          size="xs"
                          colorScheme={urlFetched ? "green" : "blue"}
                          onClick={handleFetchFromUrl}
                          isLoading={isFetchingUrl}
                          isDisabled={!listingUrl || isFetchingUrl}
                        >
                          {urlFetched ? <CheckIcon /> : t('modals.add_manual_boat.fetch_button')}
                        </Button>
                      </Tooltip>
                    )}
                  </HStack>
                </InputRightElement>
              </InputGroup>
              
              {/* Info om hentet data */}
              {urlFetched && fetchedTitle && (
                <Alert status="success" mt={2} borderRadius="md" py={2}>
                  <AlertIcon boxSize={4} />
                  <Box flex="1">
                    <Text fontSize="xs" fontWeight="medium">
                      {t('modals.add_manual_boat.url_fetched_from')}
                    </Text>
                    <Text fontSize="xs" color="gray.600" noOfLines={1}>
                      {fetchedTitle}
                    </Text>
                  </Box>
                </Alert>
              )}
              
              {/* Hint for gratis brukere */}
              {!isPro && listingUrl && isKnownListingSite(listingUrl) && (
                <Alert status="info" mt={2} borderRadius="md" py={2}>
                  <AlertIcon boxSize={4} />
                  <Text fontSize="xs">
                    {t('modals.add_manual_boat.url_pro_hint')}
                  </Text>
                </Alert>
              )}
              
              <Text fontSize="xs" color="gray.500" mt={1}>
                {t('modals.add_manual_boat.listing_url_hint')}
              </Text>
            </FormControl>

            <Divider />

            {/* Grunnleggende info */}
            <Text fontWeight="semibold" fontSize="sm" color="gray.600">
              {t('modals.add_manual_boat.section_basic')}
            </Text>
            
            <FormControl isRequired>
              <FormLabel>{t('common.manufacturer')}</FormLabel>
              <Input 
                placeholder={t('modals.add_manual_boat.manufacturer_placeholder')} 
                value={manufacturer} 
                onChange={(e) => setManufacturer(e.target.value)} 
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>{t('common.model')}</FormLabel>
              <Input 
                placeholder={t('modals.add_manual_boat.model_placeholder')} 
                value={model} 
                onChange={(e) => setModel(e.target.value)} 
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>{t('common.year')}</FormLabel>
              <Input 
                placeholder={t('modals.add_manual_boat.year_placeholder')} 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </FormControl>

            {isMotorboat && (
              <FormControl as="fieldset" isRequired>
                <FormLabel as="legend">{t('modals.add_manual_boat.engine_type_label')}</FormLabel>
                <HStack w="100%">
                  <Button 
                    flex="1" 
                    variant={engineType === 'inboard' ? 'solid' : 'outline'} 
                    colorScheme={engineType === 'inboard' ? 'blue' : 'gray'}
                    onClick={() => setEngineType('inboard')}
                  >
                    {t('modals.add_manual_boat.engine_inboard')}
                  </Button>
                  <Button 
                    flex="1" 
                    variant={engineType === 'outboard' ? 'solid' : 'outline'} 
                    colorScheme={engineType === 'outboard' ? 'blue' : 'gray'}
                    onClick={() => setEngineType('outboard')}
                  >
                    {t('modals.add_manual_boat.engine_outboard')}
                  </Button>
                </HStack>
              </FormControl>
            )}

            <HStack spacing={4}>
              <FormControl flex={1}>
                <FormLabel>{t('modals.add_manual_boat.hull_type_label')}</FormLabel>
                <Select value={typeSecondary} onChange={(e) => setTypeSecondary(e.target.value)}>
                  <option value="Monohull">{t('modals.add_manual_boat.hull_type_monohull')}</option>
                  <option value="Multihull">{t('modals.add_manual_boat.hull_type_multihull')}</option>
                </Select>
              </FormControl>

              <FormControl flex={1}>
                <FormLabel>{t('modals.add_manual_boat.hull_material_label')}</FormLabel>
                <Select 
                  placeholder={t('modals.add_manual_boat.hull_material_placeholder')} 
                  value={hullMaterial} 
                  onChange={(e) => setHullMaterial(e.target.value)}
                >
                  <option value="Fiberglass">{t('modals.add_manual_boat.hull_material_fiberglass')}</option>
                  <option value="Aluminum">{t('modals.add_manual_boat.hull_material_aluminum')}</option>
                  <option value="Steel">{t('modals.add_manual_boat.hull_material_steel')}</option>
                  <option value="Wood">{t('modals.add_manual_boat.hull_material_wood')}</option>
                </Select>
              </FormControl>
            </HStack>

            {/* Utvidede detaljer - sammenleggbar seksjon */}
            <Divider />
            
            <Button 
              variant="ghost" 
              onClick={toggleAdvanced} 
              rightIcon={showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
              justifyContent="space-between"
              w="100%"
            >
              <Text fontWeight="semibold" fontSize="sm">
                {t('modals.add_manual_boat.section_advanced')}
              </Text>
            </Button>

            <Collapse in={showAdvanced} animateOpacity>
              <VStack spacing={4} align="stretch" pt={2}>
                {/* Dimensjoner */}
                <Text fontWeight="medium" fontSize="sm" color="gray.500">
                  {t('modals.add_manual_boat.section_dimensions')}
                </Text>
                
                <HStack spacing={4}>
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.loa_label')}</FormLabel>
                    <InputGroup size="sm">
                      <Input 
                        placeholder="10.5" 
                        value={loa} 
                        onChange={(e) => setLoa(e.target.value)}
                        type="number"
                        step="0.1"
                      />
                      <InputRightAddon>m</InputRightAddon>
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.beam_label')}</FormLabel>
                    <InputGroup size="sm">
                      <Input 
                        placeholder="3.5" 
                        value={beam} 
                        onChange={(e) => setBeam(e.target.value)}
                        type="number"
                        step="0.1"
                      />
                      <InputRightAddon>m</InputRightAddon>
                    </InputGroup>
                  </FormControl>
                </HStack>

                <HStack spacing={4}>
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.draft_label')}</FormLabel>
                    <InputGroup size="sm">
                      <Input 
                        placeholder="1.8" 
                        value={draft} 
                        onChange={(e) => setDraft(e.target.value)}
                        type="number"
                        step="0.1"
                      />
                      <InputRightAddon>m</InputRightAddon>
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.displacement_label')}</FormLabel>
                    <InputGroup size="sm">
                      <Input 
                        placeholder="5000" 
                        value={displacement} 
                        onChange={(e) => setDisplacement(e.target.value)}
                        type="number"
                      />
                      <InputRightAddon>kg</InputRightAddon>
                    </InputGroup>
                  </FormControl>
                </HStack>

                {/* Motor */}
                <Text fontWeight="medium" fontSize="sm" color="gray.500" pt={2}>
                  {t('modals.add_manual_boat.section_engine')}
                </Text>

                <HStack spacing={4}>
                  <FormControl flex={2}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.engine_make_label')}</FormLabel>
                    <Input 
                      size="sm"
                      placeholder={t('modals.add_manual_boat.engine_make_placeholder')} 
                      value={engineMake} 
                      onChange={(e) => setEngineMake(e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.engine_power_label')}</FormLabel>
                    <InputGroup size="sm">
                      <Input 
                        placeholder="50" 
                        value={enginePower} 
                        onChange={(e) => setEnginePower(e.target.value)}
                        type="number"
                      />
                      <InputRightAddon>hk</InputRightAddon>
                    </InputGroup>
                  </FormControl>
                </HStack>

                <HStack spacing={4}>
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.engine_hours_label')}</FormLabel>
                    <InputGroup size="sm">
                      <Input 
                        placeholder="500" 
                        value={engineHours} 
                        onChange={(e) => setEngineHours(e.target.value)}
                        type="number"
                      />
                      <InputRightAddon>t</InputRightAddon>
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.fuel_type_label')}</FormLabel>
                    <Select 
                      size="sm"
                      placeholder={t('modals.add_manual_boat.fuel_type_placeholder')}
                      value={fuelType} 
                      onChange={(e) => setFuelType(e.target.value as any)}
                    >
                      <option value="diesel">{t('modals.add_manual_boat.fuel_diesel')}</option>
                      <option value="petrol">{t('modals.add_manual_boat.fuel_petrol')}</option>
                      <option value="electric">{t('modals.add_manual_boat.fuel_electric')}</option>
                      <option value="hybrid">{t('modals.add_manual_boat.fuel_hybrid')}</option>
                    </Select>
                  </FormControl>
                </HStack>

                {/* Identifikasjon */}
                <Text fontWeight="medium" fontSize="sm" color="gray.500" pt={2}>
                  {t('modals.add_manual_boat.section_identification')}
                </Text>

                <HStack spacing={4}>
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.hin_label')}</FormLabel>
                    <Input 
                      size="sm"
                      placeholder={t('modals.add_manual_boat.hin_placeholder')} 
                      value={hin} 
                      onChange={(e) => setHin(e.target.value.toUpperCase())}
                      maxLength={14}
                    />
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm">{t('modals.add_manual_boat.registration_label')}</FormLabel>
                    <Input 
                      size="sm"
                      placeholder={t('modals.add_manual_boat.registration_placeholder')} 
                      value={registrationNumber} 
                      onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </Collapse>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>{t('common.cancel_button')}</Button>
          <Button colorScheme="blue" onClick={handleSave}>{t('common.save_and_continue_button')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddManualBoatModal;
