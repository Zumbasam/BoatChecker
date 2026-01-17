// src/pages/picker/CountryStep.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Input,
  List,
  ListItem,
  IconButton,
  useColorModeValue,
  Button,
  VStack,
  Spinner,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'; 

import { db } from "../../db";

type Country = {
  code: string;
  name: string;
};

const CountryStep: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [countryList, setCountryList] = useState<Country[] | null>(null);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const lang = i18n.language.startsWith('en') ? 'en' : 'nb';
        const module = await import(`../../data/countries_${lang}.json`);
        setCountryList(module.default);
      } catch (error) {
        console.error("Kunne ikke laste landliste:", error);
        const module = await import(`../../data/countries_nb.json`);
        setCountryList(module.default);
      }
    };
    loadCountries();
  }, [i18n.language]);

  const filtered = countryList
    ? countryList.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const selectCountry = async (code: string) => {
    await db.settings.update("settings", { countryCode: code } as any);
    navigate("../primary");
  };

  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  if (!countryList) {
    return (
      <VStack justify="center" minH="calc(100vh - 4rem)">
        <Spinner size="xl" />
      </VStack>
    );
  }

  return (
    <VStack spacing={6} p={4} justify="center" minH="calc(100vh - 4rem)">
      <Box maxW="md" w="100%">
        <Heading size="lg" mb={4} textAlign="center">
          {t('picker.country.title')}
        </Heading>

        <Box position="relative">
          <InputGroup>
            <Input
              placeholder={t('picker.country.placeholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
            />
            <InputRightElement>
              <IconButton
                aria-label={t('picker.country.title')}
                icon={<ChevronDown />}
                size="sm"
                variant="ghost"
                onClick={() => setOpen((o) => !o)}
              />
            </InputRightElement>
          </InputGroup>

          {open && (
            <List
              maxH="200px"
              overflowY="auto"
              mt="1"
              border="1px solid"
              borderColor={border}
              bg={bg}
              rounded="md"
              position="absolute"
              width="100%"
              zIndex={10}
            >
              {filtered.map((c) => (
                <ListItem
                  key={c.code}
                  p={2}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => selectCountry(c.code)}
                >
                  {c.name}
                </ListItem>
              ))}
              {filtered.length === 0 && (
                <ListItem p={2} color="gray.500" textAlign="center">
                  {t('picker.country.no_results')}
                </ListItem>
              )}
            </List>
          )}
        </Box>
        
        <VStack mt={6}>
            <Button variant="outline" onClick={() => navigate(-1)}>
              {t('common.back_button')}
            </Button>
        </VStack>
      </Box>
    </VStack>
  );
};

export default CountryStep;