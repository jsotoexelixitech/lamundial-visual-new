import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { LoginPasarelaPage } from '@/pages/LoginPasarelaPage';
import { SsoEntryPage } from '@/pages/SsoEntryPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AuditPage } from '@/pages/AuditPage';
import { UsersAdminPage } from '@/pages/UsersAdminPage';
import { PortalShell } from '@/layouts/PortalShell';
import { PortalSessionProvider } from '@/context/PortalSessionContext';
import { getCurrentUser, isSsoSession } from '@/lib/nexus-auth';
import { isPortalAdmin } from '@/lib/portal-sso-config';

// Monitor de expedientes: visual aparte (Sis2000 por SSO) y página pública del asegurado.
const MonitorExpedientesPage = lazy(() => import('@/pages/MonitorExpedientesPage'));
const ExpedientePublicoPage = lazy(() => import('@/pages/ExpedientePublicoPage'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  // Quien entró desde Sis2000 no ve el login: vuelve a la entrada SSO.
  if (!user) return <Navigate to={isSsoSession() ? '/sso' : '/login'} replace />;
  return <>{children}</>;
}

/**
 * Monitor de expedientes: con sesión, igual que siempre. Sin sesión prueba
 * GET /api/expedientes/config sin login: 200 (QA con EXPEDIENTES_ACCESO_LIBRE) entra completo;
 * cualquier otra respuesta redirige como RequireAuth.
 */
function RequireAuthOAccesoLibre({ children }: { children: React.ReactNode }) {
  const conSesion = !!getCurrentUser();
  const [libre, setLibre] = useState<boolean | null>(null);

  useEffect(() => {
    if (conSesion) return;
    let vigente = true;
    import('@/lib/expedientes-api')
      .then((m) => m.probarAccesoLibre())
      .catch(() => false)
      .then((ok) => {
        if (vigente) setLibre(ok);
      });
    return () => {
      vigente = false;
    };
  }, [conSesion]);

  if (conSesion || libre) return <>{children}</>;
  if (libre === null) return null;
  return <RequireAuth>{children}</RequireAuth>;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login-pasarela" element={<LoginPasarelaPage />} />
        <Route path="/sso" element={<SsoEntryPage />} />
        <Route
          path="/monitor-expedientes"
          element={
            <RequireAuthOAccesoLibre>
              <Suspense fallback={null}>
                <MonitorExpedientesPage />
              </Suspense>
            </RequireAuthOAccesoLibre>
          }
        />
        <Route
          path="/expediente"
          element={
            <Suspense fallback={null}>
              <ExpedientePublicoPage />
            </Suspense>
          }
        />
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
          <Route
            path="/audit"
            element={
              isPortalAdmin(getCurrentUser()) ? <AuditPage /> : <Navigate to="/dashboard" replace />
            }
          />
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
