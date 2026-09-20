import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AuditPage } from '@/pages/AuditPage';
import { SsoConfigPage } from '@/pages/SsoConfigPage';
import { isPortalAdmin } from '@/lib/portal-sso-config';
import { getCurrentUser } from '@/lib/nexus-auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={
          <RequireAuth><DashboardPage /></RequireAuth>
        } />
        <Route path="/audit" element={
          <RequireAuth><AuditPage /></RequireAuth>
        } />
        <Route path="/settings/sso" element={
          <RequireAuth>
            {isPortalAdmin(getCurrentUser()) ? <SsoConfigPage /> : <Navigate to="/dashboard" replace />}
          </RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
