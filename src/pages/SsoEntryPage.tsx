import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2 } from 'lucide-react';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { VitrinaBackdrop } from '@/components/dashboard/VitrinaBackdrop';
import { startSsoSession } from '@/lib/nexus-auth';

/**
 * Entrada desde el menú de Sis2000: /sso?nexus_token=…
 * Canjea el pase por la sesión y abre el marketplace sin pantalla de login.
 */
export const SsoEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('nexus_token'));
  const [error, setError] = useState(
    token ? '' : 'Para entrar al marketplace, ábralo desde el menú de La Mundial.',
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // El pase no debe quedar en la barra ni en el historial.
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) return;

    startSsoSession(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch((err: unknown) => {
        const apiMsg =
          axios.isAxiosError(err) &&
          err.response?.data &&
          typeof err.response.data === 'object' &&
          'message' in err.response.data
            ? String((err.response.data as { message: unknown }).message)
            : '';
        setError(
          apiMsg || 'No se pudo abrir el marketplace. Vuelva a entrar desde el menú de La Mundial.',
        );
      });
  }, [navigate, token]);

  return (
    <div className="lm-desk lm-sso">
      <VitrinaBackdrop />
      <div className="lm-sso-card" role={error ? 'alert' : 'status'} aria-live="polite">
        <MundialBrand subtitle="Marketplace de emisión" isotipoClassName="h-11 w-11" />
        {error ? (
          <>
            <AlertCircle size={28} className="lm-sso-icon lm-sso-icon--error" aria-hidden />
            <p className="lm-sso-title">No pudimos abrir el marketplace</p>
            <p className="lm-sso-text">{error}</p>
          </>
        ) : (
          <>
            <Loader2 size={28} className="lm-sso-icon animate-spin" aria-hidden />
            <p className="lm-sso-title">Abriendo tu marketplace…</p>
            <p className="lm-sso-text">Estamos cargando los productos de tu canal.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SsoEntryPage;
