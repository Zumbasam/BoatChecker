// PWA – vis «Installer»‑prompt når alle krav er oppfylt
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
);