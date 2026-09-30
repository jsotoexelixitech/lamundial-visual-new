import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, ChevronRight, ExternalLink, Inbox, Search, SearchX, X } from 'lucide-react';
import {
  getCurrentUser,
  getToken,
  ssoDelegate,
  registerAudit,
  type PortalProductDto,
} from '@/lib/nexus-auth';
import { buildFallbackModuleUrl, buildSsoPayload } from '@/lib/sso-launch';
import { usePortalSession } from '@/context/PortalSessionContext';
import { ProductSheet } from '@/components/dashboard/ProductSheet';
import {
  PRODUCT_LINES,
  PRODUCT_LINE_ORDER,
  cleanCopy,
  priceInfo,
  productLine,
  type ProductLineId,
} from '@/components/dashboard/product-lines';

function canalLabel(centidad?: string, citem?: string): string | null {
  if (!citem) return null;
  if (centidad === 'C') return `Canal ${citem}`;
  if (centidad === 'G') return `Gestor ${citem}`;
  return `Productor ${citem}`;
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function useIsDesktop(): boolean {
  const query = '(min-width: 1024px)';
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : true,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return matches;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id;
  const { profile, products, productsLoading, productsError } = usePortalSession();
  const isDesktop = useIsDesktop();
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState('');
  const [query, setQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<ProductLineId | 'all'>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const presentCloseRef = useRef<HTMLButtonElement>(null);

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

  const groups = useMemo(() => {
    const q = normalize(query.trim());
    const visible = products.filter(
      (p) =>
        (lineFilter === 'all' || productLine(p) === lineFilter) &&
        (!q || normalize(`${p.label} ${p.description} ${p.cproducto}`).includes(q)),
    );
    return PRODUCT_LINE_ORDER.map((id) => ({
      line: PRODUCT_LINES[id],
      items: visible
        .filter((p) => productLine(p) === id)
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    })).filter((g) => g.items.length > 0);
  }, [products, query, lineFilter]);

  const visibleProducts = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const selected =
    visibleProducts.find((p) => p.key === selectedKey) ??
    (isDesktop ? visibleProducts[0] : undefined);

  const closePresent = useCallback(() => setPresenting(false), []);

  useEffect(() => {
    if (!presenting && !sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (presenting) setPresenting(false);
      else setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting, sheetOpen]);

  useEffect(() => {
    if (presenting) presentCloseRef.current?.focus();
  }, [presenting]);

  if (!userId || !user) return null;

  const firstName = (profile?.user.nombre ?? user.nombre).split(' ')[0];
  const canal = profile?.canal;
  const canalText = canalLabel(canal?.centidad, canal?.citem);
  const onlineCount = products.filter((p) => p.launchMode !== 'sysip').length;

  const handleSelect = (product: PortalProductDto) => {
    setSelectedKey(product.key);
    if (!isDesktop) setSheetOpen(true);
  };

  const handleLaunch = async (product: PortalProductDto) => {
    setLaunching(product.key);
    setLaunchError('');
    try {
      const token = getToken();
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');

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
      setLaunchError(err instanceof Error ? err.message : 'No se pudo abrir la emisión.');
    } finally {
      setLaunching(null);
    }
  };

  const sheetProps = selected
    ? {
        product: selected,
        busy: launching === selected.key,
        disabled: launching !== null,
        onLaunch: handleLaunch,
      }
    : null;

  const summary = productsLoading
    ? 'Cargando tu catálogo…'
    : `${products.length} producto${products.length === 1 ? '' : 's'} habilitado${
        products.length === 1 ? '' : 's'
      }, ${onlineCount} con emisión en línea.`;

  return (
    <div className="portal-page lm-desk">
      <header className="lm-desk-top">
        <div className="min-w-0">
          <h1 className="lm-desk-title">Hola, {firstName}</h1>
          <p className="lm-desk-summary">
            {canalText && <strong>{canalText}</strong>}
            {canalText && profile?.empresa.nombre && <span aria-hidden> · </span>}
            {profile?.empresa.nombre && <span>{profile.empresa.nombre}</span>}
            {(canalText || profile?.empresa.nombre) && <span aria-hidden> — </span>}
            <span>{summary}</span>
          </p>
        </div>
        <label className="lm-search">
          <Search size={17} aria-hidden />
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
      </header>

      {(launchError || productsError) && (
        <div className="lm-desk-alerts">
          {launchError && (
            <div role="alert" className="lm-alert lm-alert--error">
              <AlertCircle size={18} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">No se pudo abrir la emisión</p>
                <p>{launchError}</p>
              </div>
              <button type="button" onClick={() => setLaunchError('')} aria-label="Cerrar aviso">
                <X size={16} />
              </button>
            </div>
          )}
          {productsError && (
            <div role="alert" className="lm-alert lm-alert--warn">
              <AlertCircle size={18} aria-hidden />
              <p className="min-w-0 flex-1">{productsError}</p>
            </div>
          )}
        </div>
      )}

      <div className="lm-desk-body">
        <section className="lm-catalog" aria-label="Productos disponibles">
          <div className="lm-lines" role="group" aria-label="Filtrar por línea">
            <button
              type="button"
              aria-pressed={lineFilter === 'all'}
              className="lm-line"
              onClick={() => setLineFilter('all')}
            >
              Todos <span className="lm-line-count">{products.length}</span>
            </button>
            {PRODUCT_LINE_ORDER.filter((id) => lineCounts.has(id)).map((id) => {
              const line = PRODUCT_LINES[id];
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={lineFilter === id}
                  className="lm-line"
                  onClick={() => setLineFilter(lineFilter === id ? 'all' : id)}
                >
                  <span className="lm-dot" style={{ background: line.dot }} aria-hidden />
                  {line.label}
                  <span className="lm-line-count">{lineCounts.get(id)}</span>
                </button>
              );
            })}
          </div>

          {productsLoading && (
            <div className="lm-list" aria-busy="true" aria-label="Cargando productos">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="lm-row-skeleton" />
              ))}
            </div>
          )}

          {!productsLoading && products.length === 0 && !productsError && (
            <div className="lm-empty">
              <Inbox size={34} aria-hidden />
              <p className="lm-empty-title">Tu canal aún no tiene productos</p>
              <p>Contacta a Administración de Canales La Mundial para habilitarlos.</p>
            </div>
          )}

          {!productsLoading && products.length > 0 && visibleProducts.length === 0 && (
            <div className="lm-empty">
              <SearchX size={32} aria-hidden />
              <p className="lm-empty-title">Ningún producto coincide</p>
              <button
                type="button"
                className="lm-empty-reset"
                onClick={() => {
                  setQuery('');
                  setLineFilter('all');
                }}
              >
                Ver todos los productos
              </button>
            </div>
          )}

          {!productsLoading &&
            groups.map(({ line, items }) => (
              <div key={line.id} className="lm-group">
                <h2 className="lm-group-title">
                  <span className="lm-dot" style={{ background: line.dot }} aria-hidden />
                  {line.label}
                </h2>
                <ul className="lm-list">
                  {items.map((p) => {
                    const price = priceInfo(p);
                    const active = selected?.key === p.key;
                    return (
                      <li key={p.key}>
                        <button
                          type="button"
                          className="lm-row"
                          aria-current={active ? 'true' : undefined}
                          onClick={() => handleSelect(p)}
                        >
                          <span className="lm-row-main">
                            <span className="lm-row-name">{cleanCopy(p.label)}</span>
                            <span className="lm-row-meta">
                              N.º {p.cproducto}
                              {p.launchMode === 'sysip' && (
                                <>
                                  <span aria-hidden> · </span>
                                  <ExternalLink size={11} aria-hidden /> Marketplace
                                </>
                              )}
                            </span>
                          </span>
                          <span className="lm-row-price">
                            {price.label === 'Desde' ? price.value : 'Cotizar'}
                          </span>
                          <ChevronRight size={17} className="lm-row-chevron" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </section>

        <aside className="lm-sheet-col" aria-label="Ficha del producto">
          {productsLoading ? (
            <div className="ficha-skeleton" />
          ) : (
            sheetProps && (
              <div key={sheetProps.product.key} className="lm-sheet-swap">
                <ProductSheet {...sheetProps} onPresent={() => setPresenting(true)} />
              </div>
            )
          )}
        </aside>
      </div>

      {!isDesktop && sheetOpen && sheetProps && (
        <div className="lm-bottom-sheet" role="dialog" aria-modal="true" aria-label="Ficha del producto">
          <button
            type="button"
            className="lm-bottom-sheet-backdrop"
            aria-label="Cerrar ficha"
            onClick={() => setSheetOpen(false)}
          />
          <div className="lm-bottom-sheet-panel">
            <button
              type="button"
              className="lm-bottom-sheet-close"
              onClick={() => setSheetOpen(false)}
              aria-label="Cerrar ficha"
            >
              <X size={18} />
            </button>
            <ProductSheet {...sheetProps} onPresent={() => setPresenting(true)} />
          </div>
        </div>
      )}

      {presenting && sheetProps && (
        <div className="lm-present" role="dialog" aria-modal="true" aria-label="Ficha para el cliente">
          <button
            ref={presentCloseRef}
            type="button"
            className="lm-present-close"
            onClick={closePresent}
          >
            <X size={18} /> Cerrar
          </button>
          <ProductSheet {...sheetProps} variant="client" />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
