import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AuditPage } from '@/pages/AuditPage';
import { UsersAdminPage } from '@/pages/UsersAdminPage';
import { PortalShell } from '@/layouts/PortalShell';
import { PortalSessionProvider } from '@/context/PortalSessionContext';
import { getCurrentUser } from '@/lib/nexus-auth';
import { isPortalAdmin } from '@/lib/portal-sso-config';

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
        <Route
          element={
            <RequireAuth>
              <PortalSessionProvider>
                <PortalShell />
              </PortalSessionProvider>
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route
            path="/usuarios"
            element={
              isPortalAdmin(getCurrentUser()) ? (
                <UsersAdminPage />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
