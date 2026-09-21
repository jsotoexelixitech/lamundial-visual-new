import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Car,
  Building2,
  Heart,
  Package,
  ArrowRight,
  Loader2,
  ExternalLink,
  AlertCircle,
  ShieldCheck,
  Inbox,
} from 'lucide-react';
import {
  getCurrentUser,
  getToken,
  ssoDelegate,
  registerAudit,
  type PortalProductDto,
} from '@/lib/nexus-auth';
import { buildFallbackModuleUrl, buildSsoPayload } from '@/lib/sso-launch';
import { usePortalSession } from '@/context/PortalSessionContext';

function cardVisual(product: PortalProductDto) {
  if (product.product === 'rcv') {
    return {
      icon: <Car size={26} strokeWidth={1.75} />,
      accent: 'linear-gradient(135deg, #E84F51 0%, #B23F44 100%)',
      tint: '#E84F51',
    };
  }
  if (product.product === 'funerario') {
    return {
      icon: <Heart size={26} strokeWidth={1.75} />,
      accent: 'linear-gradient(135deg, #2E6DBF 0%, #0F1A5A 100%)',
      tint: '#2E6DBF',
    };
  }
  if (product.product === 'patrimoniales') {
    return {
      icon: <Building2 size={26} strokeWidth={1.75} />,
      accent: 'linear-gradient(135deg, #0F1A5A 0%, #091133 100%)',
      tint: '#0F1A5A',
    };
  }
  return {
    icon: <Package size={26} strokeWidth={1.75} />,
    accent: 'linear-gradient(135deg, #162A7F 0%, #0F1A5A 100%)',
    tint: '#162A7F',
  };
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id;
  const { profile, products, productsLoading, productsError } = usePortalSession();
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState('');

  useEffect(() => {
    if (!userId) navigate('/login');
  }, [userId, navigate]);

  if (!userId || !user) return null;

  const firstName = (profile?.user.nombre ?? user.nombre).split(' ')[0];

  const handleLaunch = async (product: PortalProductDto) => {
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
            `${apiMsg} Solicita a tu administrador corporativo que revise tus permisos de emisión.`,
          );
        }
        if (import.meta.env.VITE_PORTAL_ALLOW_LEGACY_TOKEN === 'true') {
          url = buildFallbackModuleUrl(product, token);
        } else {
          throw new Error(
            'No se pudo abrir el módulo de emisión. Contacta a Tecnología La Mundial.',
          );
        }
      }

      await registerAudit({
        accion: `launch_${product.cproducto}`,
        producto: product.cproducto,
        detalle: { target: payload.target, product: payload.product, cproducto: product.cproducto },
      });

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'No se pudo abrir el módulo.');
    } finally {
      setLaunching(null);
    }
  };

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <p className="portal-page-eyebrow">Suscripción digital</p>
          <h1 className="portal-page-title">Hola, {firstName}</h1>
          <p className="portal-page-subtitle">
            Elige el ramo que deseas emitir. Solo verás los productos habilitados para tu perfil y
            tu canal comercial.
          </p>
        </div>
      </div>

      <div className="portal-page-body">
        {launchError && (
          <div className="mb-6 flex gap-3 items-start rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
            <AlertCircle size={18} className="text-[#E84F51] shrink-0 mt-0.5" />
            <div className="text-sm text-[#991B1B]">
              <p className="font-semibold">No se pudo abrir el flujo</p>
              <p className="mt-0.5 font-medium text-[#B45356]">{launchError}</p>
            </div>
          </div>
        )}

        {productsError && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {productsError}
          </div>
        )}

        <div className="flex items-end justify-between gap-4 mb-5">
          <h2 className="font-display text-lg font-bold text-[#091133]">Productos disponibles</h2>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ACACAC]">
            {productsLoading ? '…' : `${products.length} producto${products.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {productsLoading && (
          <div className="flex justify-center py-20">
            <Loader2 size={36} className="animate-spin text-[#0F1A5A]" />
          </div>
        )}

        {!productsLoading && products.length === 0 && !productsError && (
          <div className="portal-panel rounded-2xl p-12 text-center">
            <Inbox size={40} className="mx-auto text-[#ACACAC] mb-4" />
            <p className="font-semibold text-[#091133]">Sin productos asignados</p>
            <p className="text-sm text-[#777777] mt-2 max-w-md mx-auto">
              No hay productos asignados a tu canal o tu perfil aún no tiene permisos. Contacta al
              administrador de usuarios de tu empresa.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
          {!productsLoading &&
            products.map((product) => {
              const style = cardVisual(product);
              const busy = launching === product.key;

              return (
                <article
                  key={product.key}
                  className="portal-panel group relative rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_12px_32px_-12px_rgba(9,17,51,0.18)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="h-1.5 w-full" style={{ background: style.accent }} />

                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className="h-12 w-12 rounded-xl text-white grid place-items-center shadow-sm"
                        style={{ background: style.accent }}
                      >
                        {style.icon}
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] bg-[#F0F2F8]"
                        style={{ color: style.tint }}
                      >
                        {product.cproducto} · ramo {product.cramo}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#091133] mb-1.5">
                      {product.label}
                    </h3>
                    <p className="text-sm text-[#777777] leading-relaxed flex-1 line-clamp-3">
                      {product.description}
                    </p>

                    {(product.mmontoInicial || product.xfraccionamiento) && (
                      <div className="mt-3 space-y-1">
                        {product.mmontoInicial && (
                          <p className="text-sm font-semibold text-[#091133]">
                            Desde {product.mmontoInicial}
                          </p>
                        )}
                        {product.xfraccionamiento && (
                          <p className="text-xs text-[#777777]">{product.xfraccionamiento}</p>
                        )}
                      </div>
                    )}

                    {product.xurlPresentacion && (
                      <a
                        href={product.xurlPresentacion.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2E6DBF] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver presentación
                        <ExternalLink size={12} />
                      </a>
                    )}

                    {product.marketplaceQr && (
                      <img
                        src={product.marketplaceQr}
                        alt=""
                        className="mt-3 h-20 w-20 rounded-lg border border-[#eceef4] object-contain bg-white"
                      />
                    )}

                    <div className="mt-4 pt-3 border-t border-[#eceef4] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ACACAC]">
                      <ShieldCheck size={13} style={{ color: style.tint }} />
                      {product.moduleLabel}
                    </div>

                    <button
                      type="button"
                      disabled={busy || launching !== null}
                      onClick={() => handleLaunch(product)}
                      className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                      style={{ background: style.accent }}
                    >
                      {busy ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Generando acceso…
                        </>
                      ) : (
                        <>
                          Abrir flujo
                          <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {busy && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none" />
                  )}
                </article>
              );
            })}
        </div>

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e4e6ee] pt-5 text-xs text-[#ACACAC]">
          <span className="flex items-center gap-1.5">
            <ExternalLink size={12} />
            Cada emisión se abre en una ventana nueva para continuar el proceso
          </span>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
