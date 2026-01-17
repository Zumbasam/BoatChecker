// src/theme.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import { cardAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers, type StyleFunctionProps } from '@chakra-ui/styled-system'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    deepBlue: '#0A2463',
    seaTeal: '#3E92CC',
    sand: '#F5F5F5',
    darkSand: '#2D3748',
    signalOrange: '#FF5A33',
    white: '#FFFFFF',
  },
};

const fonts = {
  heading: `'Roboto Slab', serif`,
  body: `'Nunito Sans', sans-serif`,
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
    },
    // KORRIGERT: Vi bruker en funksjon for å bytte farge basert på natt/dagmodus
    variants: {
      solid: (props: StyleFunctionProps) => ({
        bg: props.colorMode === 'dark' ? 'brand.seaTeal' : 'brand.deepBlue',
        color: props.colorMode === 'dark' ? 'brand.white' : 'brand.white',
        _hover: {
          bg: props.colorMode === 'dark' ? '#357dad' : '#0d2c7a', // En litt mørkere versjon for hover
        },
      }),
	  
	  feedbackTab: (props: StyleFunctionProps) => ({
		bg: props.colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.600',
        color: 'white',
        _hover: {
          bg: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'blackAlpha.700',
        },
      }),
    },
  },
  Card: createMultiStyleConfigHelpers(cardAnatomy.keys).defineMultiStyleConfig({
    variants: {
      checklist: {
        container: {
          background: 'white',
          border: '1px solid',
          borderColor: 'gray.200',
          _dark: {
            background: 'brand.darkSand',
            borderColor: 'gray.700'
          }
        }
      }
    }
  })
};

export const theme = extendTheme({
  config,
  colors,
  fonts,
  components,
});