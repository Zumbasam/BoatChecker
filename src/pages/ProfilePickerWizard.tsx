// src/pages/ProfilePickerWizard.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LangStep from './picker/LangStep';
import CountryStep from './picker/CountryStep';
import PrimaryStep from './picker/PrimaryStep';
import ModelStep from './picker/ModelStep';
import ConfirmEngineTypeStep from './picker/ConfirmEngineTypeStep';

const ProfilePickerWizard: React.FC = () => {
  return (
    <Routes>
      <Route path="lang" element={<LangStep />} />
      <Route path="country" element={<CountryStep />} />
      <Route path="primary" element={<PrimaryStep />} />
      <Route path="model" element={<ModelStep />} />
      <Route path="confirm-enginetype" element={<ConfirmEngineTypeStep />} />
      
      <Route index element={<Navigate to="lang" replace />} />
    </Routes>
  );
};

export default ProfilePickerWizard;