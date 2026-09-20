import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Building2, Heart, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { PortalHeader } from '@/components/PortalHeader';
import axios from 'axios';
import { getCurrentUser, getToken, ssoDelegate, registerAudit } from '@/lib/nexus-auth';
import { PRODUCTS } from '@/lib/portal-config';
import type { ProductConfig, ProductKey } from '@/lib/portal-config';
import { buildFallbackModuleUrl, buildSsoPayload } from '@/lib/sso-launch';

const CARD_STYLE: Record<ProductKey, { icon: React.ReactNode; accent: string; border: string }> = {
  rcv: {
    icon: <Car size={28} strokeWidth={1.75} />,
    accent: 'from-[#E84F51] to-[#B23F44]',
    border: 'hover:border-[#E84F51]/40',
  },
  patrimonial: {
    icon: <Building2 size={28} strokeWidth={1.75} />,
    accent: 'from-[#0F1A5A] to-[#091133]',
    border: 'hover:border-[#0F1A5A]/40',
  },
  funerario: {
    icon: <Heart size={28} strokeWidth={1.75} />,
    accent: 'from-[#162A7F] to-[#0F1A5A]',
    border: 'hover:border-[#162A7F]/50',
  },
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [launching, setLaunching] = useState<ProductKey | null>(null);
  const [launchError, setLaunchError] = useState('');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const handleLaunch = async (product: ProductConfig) => {
    setLaunching(product.key);
    setLaunchError('');
    try {
      const token = getToken();
      if (!token) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');

      const payload = buildSsoPayload(product);
      let url: string;

      try {
        const response = await ssoDelegate(payload);
        if (!response.success || !response.redirect_url) {
          throw new Error('SSO no devolvió URL de acceso.');
        }
        url = response.redirect_url;
      } catch (ssoErr) {
        const apiMsg =
          axios.isAxiosError(ssoErr) &&
          typeof ssoErr.response?.data === 'object' &&
          ssoErr.response.data &&
          'message' in ssoErr.response.data
            ? String((ssoErr.response.data as { message: string }).message)
            : null;
        if (apiMsg) {
          throw new Error(
            `${apiMsg} Configura submódulos y URLs en Nexus Admin (Exélixi) y actualiza nexus-api en el 120.`,
          );
        }
        if (import.meta.env.VITE_PORTAL_ALLOW_LEGACY_TOKEN === 'true') {
          url = buildFallbackModuleUrl(product, token);
        } else {
          throw new Error(
            'No se pudo generar SSO. Actualiza nexus-api, revisa submódulos activos para la empresa y vuelve a intentar.',
          );
        }
      }

      await registerAudit({
        accion: `launch_${product.key}`,
        producto: product.key,
        detalle: { target: payload.target, product: payload.product },
      });

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'No se pudo abrir el módulo.');
    } finally {
      setLaunching(null);
    }
  };

  const firstName = user.nombre.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <PortalHeader active="dashboard" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E84F51] mb-2">
            Bienvenido
          </p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#091133] tracking-tight">
            Hola, {firstName}
          </h1>
          <p className="text-[#777777] mt-2 max-w-xl">
            Elige un producto para abrir el flujo de emisión Exélixi con tu canal La Mundial (SSO Nexus).
          </p>
        </div>

        {launchError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#991B1B] font-medium">
            {launchError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => {
            const style = CARD_STYLE[product.key];
            const busy = launching === product.key;

            return (
              <article
                key={product.key}
                className={`group relative bg-white rounded-2xl border border-[#dddddd] p-6 sm:p-8 flex flex-col min-h-[280px] transition-all shadow-sm hover:shadow-lg ${style.border}`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center bg-gradient-to-br ${style.accent} shadow-md mb-6`}
                >
                  {style.icon}
                </div>

                <h2 className="text-xl font-bold text-[#091133] mb-2">{product.label}</h2>
                <p className="text-sm text-[#777777] leading-relaxed flex-1">{product.description}</p>

                <p className="text-[10px] font-bold uppercase tracking-wider text-[#ACACAC] mt-4 mb-3">
                  Módulo: {product.target === 'ocr' ? 'OCR (inicio)' : 'Emisión'}
                </p>

                <button
                  type="button"
                  disabled={busy || launching !== null}
                  onClick={() => handleLaunch(product)}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #0F1A5A 0%, #162A7F 100%)' }}
                >
                  {busy ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Conectando…
                    </>
                  ) : (
                    <>
                      Abrir flujo
                      <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {busy && (
                  <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-[2px] pointer-events-none" />
                )}
              </article>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-[#ACACAC] flex items-center justify-center gap-1">
          <ExternalLink size={12} />
          Se abre en una nueva pestaña · Nexus SSO
        </p>
      </main>
    </div>
  );
};

export default DashboardPage;
