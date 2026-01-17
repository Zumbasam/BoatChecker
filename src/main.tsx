// src/main.tsx

// Polyfill for Buffer, som @react-pdf/renderer trenger i nettleseren
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
//import { db } from './db';

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next'; // 1. Importer Provideren
import { ChakraProvider, Spinner, Flex } from '@chakra-ui/react';

import App from './App';
import { theme } from './theme';
import i18n from './i18n'; // 2. Importer i18n-instansen (ikke bare for side-effects)

// kun for testing
//if (import.meta.env.DEV) {
//  (window as any).db = db;
//}

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
).render(
  <React.StrictMode>
    <Suspense fallback={<Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>}>
      {/* 3. Wrap alt i I18nextProvider og send inn i18n-instansen */}
      <I18nextProvider i18n={i18n}>
        <ChakraProvider theme={theme}>
          <App />
        </ChakraProvider>
      </I18nextProvider>
    </Suspense>
  </React.StrictMode>
);