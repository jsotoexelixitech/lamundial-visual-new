import React, { useState, useEffect, useMemo } from 'react';
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
import { PortalHeader } from '@/components/PortalHeader';
import { MUNDIAL_ISOTIPO } from '@/components/brand/MundialBrand';
import { publicAsset } from '@/lib/public-asset';
import {
  fetchPortalProducts,
  fetchPortalMe,
  getCurrentUser,
  getToken,
  ssoDelegate,
  registerAudit,
  type PortalProductDto,
} from '@/lib/nexus-auth';
import { buildFallbackModuleUrl, buildSsoPayload, getSsoDefaults } from '@/lib/sso-launch';

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
  const user = useMemo(() => getCurrentUser(), []);
  const userId = user?.id;
  const [products, setProducts] = useState<PortalProductDto[]>([]);
  const [canalBanner, setCanalBanner] = useState(getSsoDefaults());
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState('');

  useEffect(() => {
    if (!userId) navigate('/login');
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoadingProducts(true);
      setProductsError('');
      try {
        const [list, me] = await Promise.all([fetchPortalProducts(), fetchPortalMe()]);
        if (!cancelled) {
          setProducts(list);
          if (me?.canal) {
            setCanalBanner({
              cproductor: me.canal.cproductor,
              cusuario: me.canal.cusuario,
              centidad: me.canal.centidad,
              citem: me.canal.citem,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          const detail =
            err instanceof Error && err.message
              ? err.message
              : 'No se pudieron cargar tus flujos.';
          setProductsError(detail);
        }
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!user) return null;

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
            `${apiMsg} Revisa submódulos activos y permisos de tu rol en Nexus Admin.`,
          );
        }
        if (import.meta.env.VITE_PORTAL_ALLOW_LEGACY_TOKEN === 'true') {
          url = buildFallbackModuleUrl(product, token);
        } else {
          throw new Error(
            'No se pudo generar el acceso SSO. Contacta a Tecnología La Mundial.',
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

  const firstName = user.nombre.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <PortalHeader active="dashboard" />

      <section
        className="relative overflow-hidden text-white"
        style={{ background: 'linear-gradient(120deg, #091133 0%, #0F1A5A 58%, #162A7F 100%)' }}
      >
        <img
          aria-hidden
          src={publicAsset(MUNDIAL_ISOTIPO)}
          alt=""
          className="absolute -right-16 -top-10 w-80 max-w-none opacity-[0.08] select-none pointer-events-none"
          draggable={false}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#F0A9A9] mb-3">
            Portal de suscripción
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Hola, {firstName}
          </h1>
          <p className="text-white/70 mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">
            Productos del marketplace Sis2000 según tu canal. Cada tarjeta abre su flujo con SSO y
            el <span className="text-white/90">cproducto</span> correspondiente.
          </p>

          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { label: 'Empresa', value: user.empresa ?? 'La Mundial' },
              { label: 'Perfil', value: user.role ?? 'Operaciones' },
              { label: 'Productor', value: canalBanner.cproductor },
              { label: 'Canal', value: `${canalBanner.centidad} · ${canalBanner.citem}` },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3 backdrop-blur-sm"
              >
                <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                  {item.label}
                </dt>
                <dd className="text-sm font-semibold text-white mt-1 leading-snug">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        {launchError && (
          <div className="mb-8 flex gap-3 items-start rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
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

        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="font-display text-xl font-bold text-[#091133]">Productos disponibles</h2>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ACACAC]">
            {loadingProducts ? '…' : `${products.length} producto${products.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {loadingProducts && (
          <div className="flex justify-center py-16">
            <Loader2 size={36} className="animate-spin text-[#0F1A5A]" />
          </div>
        )}

        {!loadingProducts && products.length === 0 && (
          <div className="rounded-2xl border border-[#e4e6ee] bg-white p-12 text-center">
            <Inbox size={40} className="mx-auto text-[#ACACAC] mb-4" />
            <p className="font-semibold text-[#091133]">Sin productos asignados</p>
            <p className="text-sm text-[#777777] mt-2 max-w-md mx-auto">
              No hay productos Sis2000 para tu canal o faltan submódulos/permisos. Un administrador
              debe configurar canal en Admin y activar OCR/Emisión.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!loadingProducts &&
            products.map((product) => {
              const style = cardVisual(product);
              const busy = launching === product.key;

              return (
                <article
                  key={product.key}
                  className="group relative bg-white rounded-2xl border border-[#e4e6ee] overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(9,17,51,0.04)] hover:shadow-[0_16px_40px_-16px_rgba(9,17,51,0.28)] hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="h-1.5 w-full" style={{ background: style.accent }} />

                  <div className="p-6 sm:p-7 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-6">
                      <div
                        className="h-14 w-14 rounded-xl text-white grid place-items-center shadow-md"
                        style={{ background: style.accent }}
                      >
                        {style.icon}
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em]"
                        style={{ color: style.tint, background: `${style.tint}14` }}
                      >
                        {product.cproducto} · ramo {product.cramo}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-[#091133] mb-2">{product.label}</h3>
                    <p className="text-sm text-[#777777] leading-relaxed flex-1">{product.description}</p>

                    <div className="mt-5 pt-4 border-t border-[#eceef4] flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ACACAC]">
                      <ShieldCheck size={13} style={{ color: style.tint }} />
                      {product.moduleLabel}
                    </div>

                    <button
                      type="button"
                      disabled={busy || launching !== null}
                      onClick={() => handleLaunch(product)}
                      className="mt-5 inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
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
                    <div className="absolute inset-0 bg-white/55 backdrop-blur-[2px] pointer-events-none" />
                  )}
                </article>
              );
            })}
        </div>

        <footer className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e4e6ee] pt-6 text-xs text-[#ACACAC]">
          <span className="flex items-center gap-1.5">
            <ExternalLink size={12} />
            Los módulos se abren en una pestaña nueva con acceso Nexus SSO
          </span>
          <span className="flex items-center gap-2">
            La Mundial de Seguros · Tecnología
            <img
              src={publicAsset('logo-color.png')}
              alt="Exélixi Technology"
              className="h-4 w-auto opacity-60"
              draggable={false}
            />
          </span>
        </footer>
      </main>
    </div>
  );
};

export default DashboardPage;
