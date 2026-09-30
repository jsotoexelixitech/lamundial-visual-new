import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Inbox,
  Loader2,
  Search,
  SearchX,
  X,
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
import { ProductSheet } from '@/components/dashboard/ProductSheet';
import { LineArt, ProductArt } from '@/components/dashboard/ProductArt';
import { VitrinaBackdrop } from '@/components/dashboard/VitrinaBackdrop';
import { publicAsset } from '@/lib/public-asset';
import {
  PRODUCT_LINES,
  PRODUCT_LINE_ORDER,
  priceInfo,
  productLine,
  productTitle,
  type ProductLineId,
} from '@/components/dashboard/product-lines';

function canalLabel(centidad?: string, citem?: string): string | null {
  if (!citem) return null;
  if (centidad === 'C') return `Canal ${citem}`;
  if (centidad === 'G') return `Gestor ${citem}`;
  return `Productor ${citem}`;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id;
  const { profile, products, productsLoading, productsError } = usePortalSession();
  const [launching, setLaunching] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState('');
  const [query, setQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<ProductLineId | 'all'>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const presentCloseRef = useRef<HTMLButtonElement>(null);
  const sheetCloseRef = useRef<HTMLButtonElement>(null);

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
        (!q ||
          normalize(`${productTitle(p)} ${p.label} ${p.description} ${p.cproducto}`).includes(q)),
    );
    return PRODUCT_LINE_ORDER.map((id) => ({
      line: PRODUCT_LINES[id],
      items: visible
        .filter((p) => productLine(p) === id)
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    })).filter((g) => g.items.length > 0);
  }, [products, query, lineFilter]);

  const visibleProducts = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const selected = products.find((p) => p.key === selectedKey);

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

  useEffect(() => {
    if (!sheetOpen) return;
    sheetCloseRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  if (!userId || !user) return null;

  const firstName = (profile?.user.nombre ?? user.nombre).split(' ')[0];
  const canal = profile?.canal;
  const canalText = canalLabel(canal?.centidad, canal?.citem);
  const onlineCount = products.filter((p) => p.launchMode !== 'sysip').length;

  const openSheet = (product: PortalProductDto) => {
    setSelectedKey(product.key);
    setSheetOpen(true);
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
          detalle: {
            cproducto: product.cproducto,
            xform: product.xform,
            launchMode: 'sysip',
          },
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
        detalle: {
          target: payload.target,
          product: payload.product,
          cproducto: product.cproducto,
        },
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
      <VitrinaBackdrop />
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
        <nav className="lm-rail" aria-label="Líneas de producto">
          <button
            type="button"
            className="lm-rail-tab"
            aria-pressed={lineFilter === 'all'}
            onClick={() => setLineFilter('all')}
          >
            <span className="lm-rail-art lm-rail-art--all">
              <img src={publicAsset('brand/mundial-isotipo.png')} alt="" aria-hidden />
            </span>
            <span className="lm-rail-text">
              <span className="lm-rail-label">Todos</span>
              <span className="lm-rail-count">{productsLoading ? '…' : products.length}</span>
            </span>
          </button>
          {PRODUCT_LINE_ORDER.filter((id) => lineCounts.has(id)).map((id) => (
            <button
              key={id}
              type="button"
              className="lm-rail-tab"
              aria-pressed={lineFilter === id}
              onClick={() => setLineFilter(lineFilter === id ? 'all' : id)}
            >
              <span className="lm-rail-art">
                <LineArt line={id} />
              </span>
              <span className="lm-rail-text">
                <span className="lm-rail-label">{PRODUCT_LINES[id].label}</span>
                <span className="lm-rail-count">{lineCounts.get(id)}</span>
              </span>
            </button>
          ))}
        </nav>

        {productsLoading && (
          <div className="lm-gallery" aria-busy="true" aria-label="Cargando productos">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="lm-card-skeleton" />
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

        {!productsLoading && visibleProducts.length > 0 && (
          <ul key={lineFilter} className="lm-gallery" aria-label="Productos disponibles">
            {visibleProducts.map((p, i) => {
              const price = priceInfo(p);
              const title = productTitle(p);
              const external = p.launchMode === 'sysip';
              const line = PRODUCT_LINES[productLine(p)];
              return (
                <li
                  key={p.key}
                  className="lm-card"
                  data-line={line.id}
                  style={{ '--i': Math.min(i, 11) } as React.CSSProperties}
                >
                  <div className="lm-card-stage">
                    <ProductArt product={p} />
                    {external && (
                      <span className="lm-card-badge">
                        <ExternalLink size={12} aria-hidden /> Marketplace
                      </span>
                    )}
                  </div>
                  <div className="lm-card-body">
                    <h3 className="lm-card-title">
                      <button type="button" className="lm-card-open" onClick={() => openSheet(p)}>
                        {title}
                      </button>
                    </h3>
                    <p className="lm-card-meta">
                      {line.label} · N.º {p.cproducto}
                    </p>
                    <div className="lm-card-foot">
                      <span className="lm-card-price">
                        <span className="lm-card-price-label">{price.label}</span>
                        <span
                          className="lm-card-price-value"
                          data-kind={price.label === 'Desde' ? 'amount' : 'text'}
                        >
                          {price.value}
                        </span>
                      </span>
                      <button
                        type="button"
                        className="lm-card-emit"
                        disabled={launching !== null}
                        onClick={() => handleLaunch(p)}
                        aria-label={`Emitir ${title}`}
                      >
                        {launching === p.key ? (
                          <Loader2 size={16} className="animate-spin" aria-hidden />
                        ) : (
                          <>
                            Emitir
                            {external ? (
                              <ExternalLink size={15} aria-hidden />
                            ) : (
                              <ArrowRight size={16} aria-hidden />
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {sheetOpen &&
        sheetProps &&
        createPortal(
          <div className="lm-modal" role="dialog" aria-modal="true" aria-label="Ficha del producto">
            <button
              type="button"
              className="lm-modal-backdrop"
              aria-label="Cerrar ficha"
              tabIndex={-1}
              onClick={() => setSheetOpen(false)}
            />
            <div className="lm-modal-panel">
              <button
                ref={sheetCloseRef}
                type="button"
                className="lm-modal-close"
                onClick={() => setSheetOpen(false)}
                aria-label="Cerrar ficha"
              >
                <X size={18} />
              </button>
              <ProductSheet {...sheetProps} onPresent={() => setPresenting(true)} />
            </div>
          </div>,
          document.body,
        )}

      {presenting &&
        sheetProps &&
        createPortal(
          <div
            className="lm-present"
            role="dialog"
            aria-modal="true"
            aria-label="Ficha para el cliente"
          >
            <button
              ref={presentCloseRef}
              type="button"
              className="lm-present-close"
              onClick={closePresent}
            >
              <X size={18} /> Cerrar
            </button>
            <ProductSheet {...sheetProps} variant="client" />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default DashboardPage;
