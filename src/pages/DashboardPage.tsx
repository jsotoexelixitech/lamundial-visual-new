import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, ExternalLink, Inbox, Layers, Radio, Search, SearchX, X } from 'lucide-react';
import {
  getCurrentUser,
  getToken,
  ssoDelegate,
  registerAudit,
  type PortalProductDto,
} from '@/lib/nexus-auth';
import { buildFallbackModuleUrl, buildSsoPayload } from '@/lib/sso-launch';
import { usePortalSession } from '@/context/PortalSessionContext';
import { EmissionProductCard } from '@/components/dashboard/EmissionProductCard';
import {
  PRODUCT_LINES,
  PRODUCT_LINE_ORDER,
  productLine,
  type ProductLineId,
} from '@/components/dashboard/product-lines';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function canalLabel(centidad?: string, citem?: string): string | null {
  if (!citem) return null;
  if (centidad === 'C') return `Canal ${citem}`;
  if (centidad === 'G') return `Gestor ${citem}`;
  return `Productor ${citem}`;
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id;
  const { profile, products, productsLoading, productsError } = usePortalSession();
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState('');
  const [query, setQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<ProductLineId | 'all'>('all');

  useEffect(() => {
    if (!userId) navigate('/login');
  }, [userId, navigate]);

  const lineCounts = useMemo(() => {
    const counts = new Map<ProductLineId, number>();
    for (const p of products) {
      const id = productLine(p);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = normalize(query.trim());
    return products
      .filter((p) => lineFilter === 'all' || productLine(p) === lineFilter)
      .filter(
        (p) =>
          !q ||
          normalize(`${p.label} ${p.description} ${p.cproducto}`).includes(q),
      )
      .sort(
        (a, b) =>
          PRODUCT_LINE_ORDER.indexOf(productLine(a)) - PRODUCT_LINE_ORDER.indexOf(productLine(b)) ||
          a.label.localeCompare(b.label, 'es'),
      );
  }, [products, query, lineFilter]);

  if (!userId || !user) return null;

  const firstName = (profile?.user.nombre ?? user.nombre).split(' ')[0];
  const canal = profile?.canal;
  const canalText = canalLabel(canal?.centidad, canal?.citem);
  const onlineCount = products.filter((p) => p.launchMode !== 'sysip').length;

  const handleLaunch = async (product: PortalProductDto) => {
    setLaunching(product.key);
    setLaunchError('');
    try {
      const token = getToken();
      if (!token) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');

      if (product.launchMode === 'sysip') {
        if (!product.marketplaceUrl) throw new Error('Este producto no tiene enlace de emisión.');
        window.open(product.marketplaceUrl, '_blank', 'noopener,noreferrer');
        await registerAudit({
          accion: `open_marketplace_${product.cproducto}`,
          producto: product.cproducto,
          detalle: { cproducto: product.cproducto, xform: product.xform, launchMode: 'sysip' },
        }).catch(() => undefined);
        return;
      }

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

  const filtersActive = query.trim() !== '' || lineFilter !== 'all';

  return (
    <div className="portal-page">
      <section className="dash-hero">
        <div className="dash-hero-inner">
          <div className="min-w-0">
            <p className="portal-page-eyebrow">{greeting()}</p>
            <h1 className="portal-page-title">Hola, {firstName}</h1>
            <p className="portal-page-subtitle">
              Estos son los productos habilitados para tu canal. Elige uno para iniciar la emisión.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {canalText && (
                <span className="dash-hero-chip">
                  <Radio size={13} />
                  {canalText}
                </span>
              )}
              {profile?.empresa.nombre && (
                <span className="dash-hero-chip dash-hero-chip--muted">{profile.empresa.nombre}</span>
              )}
            </div>
          </div>

          <dl className="dash-stats">
            <div className="dash-stat">
              <dt>Productos</dt>
              <dd>{productsLoading ? '—' : products.length}</dd>
            </div>
            <div className="dash-stat">
              <dt>Líneas</dt>
              <dd>{productsLoading ? '—' : lineCounts.size}</dd>
            </div>
            <div className="dash-stat">
              <dt>En línea</dt>
              <dd>{productsLoading ? '—' : onlineCount}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="portal-page-body dash-body">
        {launchError && (
          <div
            role="alert"
            className="mb-5 flex gap-3 items-start rounded-xl border border-red-200 bg-red-50 px-4 py-3.5"
          >
            <AlertCircle size={18} className="text-[#E84F51] shrink-0 mt-0.5" />
            <div className="text-sm text-[#991B1B] min-w-0 flex-1">
              <p className="font-semibold">No se pudo abrir la emisión</p>
              <p className="mt-0.5 font-medium text-[#B45356]">{launchError}</p>
            </div>
            <button
              type="button"
              onClick={() => setLaunchError('')}
              className="text-[#B45356] hover:text-[#991B1B]"
              aria-label="Cerrar aviso"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {productsError && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {productsError}
          </div>
        )}

        <div className="dash-toolbar">
          <label className="dash-search">
            <Search size={17} className="text-[#9A9A9A] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto o código"
              aria-label="Buscar producto"
              disabled={productsLoading}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
                <X size={15} />
              </button>
            )}
          </label>

          <div className="dash-chips" role="tablist" aria-label="Filtrar por línea">
            <button
              type="button"
              role="tab"
              aria-selected={lineFilter === 'all'}
              className={`dash-chip ${lineFilter === 'all' ? 'dash-chip--active' : ''}`}
              onClick={() => setLineFilter('all')}
            >
              <Layers size={14} />
              Todos
              <span className="dash-chip-count">{products.length}</span>
            </button>
            {PRODUCT_LINE_ORDER.filter((id) => lineCounts.has(id)).map((id) => {
              const line = PRODUCT_LINES[id];
              const active = lineFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`dash-chip ${active ? 'dash-chip--active' : ''}`}
                  style={active ? { background: line.tint, borderColor: line.tint } : undefined}
                  onClick={() => setLineFilter(active ? 'all' : id)}
                >
                  <span style={{ color: active ? '#fff' : line.tint }} className="inline-flex">
                    {line.icon(14)}
                  </span>
                  {line.label}
                  <span className="dash-chip-count">{lineCounts.get(id)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {productsLoading && (
          <div className="dash-grid" aria-busy="true" aria-label="Cargando productos">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="dash-skeleton rounded-2xl" />
            ))}
          </div>
        )}

        {!productsLoading && products.length === 0 && !productsError && (
          <div className="portal-panel rounded-2xl px-6 py-14 text-center">
            <Inbox size={40} className="mx-auto text-[#ACACAC] mb-4" />
            <p className="font-semibold text-[#091133]">Sin productos asignados</p>
            <p className="text-sm text-[#777777] mt-2 max-w-md mx-auto">
              Tu canal aún no tiene productos habilitados para emitir. Contacta a Administración de
              Canales La Mundial.
            </p>
          </div>
        )}

        {!productsLoading && products.length > 0 && visibleProducts.length === 0 && (
          <div className="portal-panel rounded-2xl px-6 py-12 text-center">
            <SearchX size={36} className="mx-auto text-[#ACACAC] mb-3" />
            <p className="font-semibold text-[#091133]">Ningún producto coincide</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-[#2E6DBF] hover:underline"
              onClick={() => {
                setQuery('');
                setLineFilter('all');
              }}
            >
              Ver todos los productos
            </button>
          </div>
        )}

        {!productsLoading && visibleProducts.length > 0 && (
          <>
            {filtersActive && (
              <p className="mb-3 text-xs font-semibold text-[#777777]">
                {visibleProducts.length} de {products.length} productos
              </p>
            )}
            <div className="dash-grid">
              {visibleProducts.map((product, i) => (
                <EmissionProductCard
                  key={product.key}
                  product={product}
                  index={i}
                  busy={launching === product.key}
                  disabled={launching !== null}
                  onLaunch={handleLaunch}
                />
              ))}
            </div>
          </>
        )}

        <footer className="mt-8 flex items-center gap-1.5 border-t border-[#e4e6ee] pt-5 text-xs text-[#9A9A9A]">
          <ExternalLink size={12} className="shrink-0" />
          Cada emisión se abre en una pestaña nueva para que no pierdas tu lugar en el portal.
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
