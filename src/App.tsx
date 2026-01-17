// src/App.tsx
import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Spinner, Flex, Text } from '@chakra-ui/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { db } from './db';
import { seedDatabase } from './utils/seedDatabase';
import { MainLayout } from './components/MainLayout';
import { InspectionDataProvider } from './contexts/InspectionDataProvider';
import PurchasesService from './services/PurchasesService';

const ProfilePickerWizard = lazy(() => import('./pages/ProfilePickerWizard'));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage').then(m => ({ default: m.ChecklistPage })));
const SummaryPage = lazy(() => import('./pages/SummaryPage').then(m => ({ default: m.SummaryPage })));
const SendRequestPage = lazy(() => import('./pages/SendRequestPage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));

const Root = () => {
  const inspectionCount = useLiveQuery(() => db.inspections.count(), []);
  if (inspectionCount === undefined) {
    return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  }
  if (inspectionCount > 0) {
    return <Navigate to="/home" replace />;
  } else {
    return <Navigate to="/picker" replace />;
  }
};

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const { i18n } = useTranslation();

  useEffect(() => {
    PurchasesService.init();

    const initializeDb = async () => {
      try {
        await db.open();
        await seedDatabase();
        setDbReady(true);
      } catch {
        setDbError('Kunne ikke laste databasen. Prøv å slette nettleserdata.');
      }
    };
    initializeDb();
  }, []);

  const settings = useLiveQuery(() => db.settings.get('settings'));

  useEffect(() => {
    if (settings?.language) {
      if (settings.language !== i18n.language) {
        i18n.changeLanguage(settings.language);
      }
    }
  }, [settings, i18n]);

  if (dbError) {
    return <Flex h="100vh" align="center" justify="center"><Text color="red.500">{dbError}</Text></Flex>;
  }

  if (!dbReady) {
    return <Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>;
  }

  return (
    <Router>
      <Suspense fallback={<Flex h="100vh" align="center" justify="center"><Spinner size="xl" /></Flex>}>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/picker/*" element={<ProfilePickerWizard />} />
          <Route element={<MainLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route element={<InspectionDataProvider />}>
              <Route path="/checklist/:inspectionId" element={<ChecklistPage />} />
              <Route path="/summary/:inspectionId" element={<SummaryPage />} />
              <Route path="/send-request/:inspectionId" element={<SendRequestPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;