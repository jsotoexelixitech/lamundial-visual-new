import React, { useState } from 'react';
import { ArrowRight, ExternalLink, Loader2, QrCode, ShieldCheck, Store, X } from 'lucide-react';
import type { PortalProductDto } from '@/lib/nexus-auth';
import { PRODUCT_LINES, productIcon, productLine } from './product-lines';

interface Props {
  product: PortalProductDto;
  index: number;
  busy: boolean;
  disabled: boolean;
  onLaunch: (product: PortalProductDto) => void;
}

export const EmissionProductCard: React.FC<Props> = ({ product, index, busy, disabled, onLaunch }) => {
  const [showQr, setShowQr] = useState(false);
  const line = PRODUCT_LINES[productLine(product)];
  const external = product.launchMode === 'sysip';

  return (
    <article
      className="dash-card group relative flex flex-col rounded-2xl bg-white overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="dash-card-band" style={{ background: line.accent }} />

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className="dash-card-icon grid place-items-center h-12 w-12 rounded-xl text-white shrink-0"
            style={{ background: line.accent }}
          >
            {productIcon(product, 24)}
          </div>
          <div className="flex flex-col items-end gap-1.5 min-w-0">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap"
              style={{ background: line.soft, color: line.tint }}
            >
              {line.label}
            </span>
            <span className="text-[10px] font-semibold text-[#9A9A9A] tabular-nums">
              Cód. {product.cproducto}
            </span>
          </div>
        </div>

        <h3 className="mt-4 font-display text-[1.05rem] font-bold leading-snug text-[#091133]">
          {product.label}
        </h3>

        {product.description && product.description !== product.label && (
          <p className="mt-1.5 text-sm leading-relaxed text-[#6B6B6B] line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-4 flex-1">
          {product.mmontoInicial ? (
            <div className="rounded-xl bg-[#F7F8FB] px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9A9A9A]">Desde</p>
              <p className="font-display text-xl font-bold text-[#091133] leading-tight">
                {product.mmontoInicial}
              </p>
              {product.xfraccionamiento && (
                <p className="mt-0.5 text-xs text-[#6B6B6B]">{product.xfraccionamiento}</p>
              )}
            </div>
          ) : (
            product.xfraccionamiento && (
              <p className="text-xs text-[#6B6B6B]">{product.xfraccionamiento}</p>
            )
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ color: external ? '#8A6D1F' : line.tint }}
          >
            {external ? <Store size={14} /> : <ShieldCheck size={14} />}
            {external ? 'Marketplace La Mundial' : 'Emisión en línea'}
          </span>
          <div className="flex items-center gap-1">
            {product.xurlPresentacion && (
              <a
                href={product.xurlPresentacion.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="dash-icon-btn"
                title="Ver presentación"
                aria-label={`Ver presentación de ${product.label}`}
              >
                <ExternalLink size={15} />
              </a>
            )}
            {product.marketplaceQr && (
              <button
                type="button"
                className="dash-icon-btn"
                onClick={() => setShowQr(true)}
                title="Código QR"
                aria-label={`Código QR de ${product.label}`}
              >
                <QrCode size={15} />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onLaunch(product)}
          className="dash-cta mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: line.accent }}
        >
          {busy ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Abriendo…
            </>
          ) : (
            <>
              Emitir
              {external ? (
                <ExternalLink size={16} />
              ) : (
                <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
              )}
            </>
          )}
        </button>
      </div>

      {showQr && product.marketplaceQr && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/95 backdrop-blur-sm p-5 text-center">
          <button
            type="button"
            className="dash-icon-btn absolute top-3 right-3"
            onClick={() => setShowQr(false)}
            aria-label="Cerrar código QR"
          >
            <X size={16} />
          </button>
          <img
            src={product.marketplaceQr}
            alt={`Código QR de ${product.label}`}
            className="h-40 w-40 rounded-xl border border-[#eceef4] bg-white object-contain"
          />
          <p className="text-xs text-[#6B6B6B] max-w-[14rem]">
            Comparte este código para que tu cliente emita {product.label} desde su teléfono.
          </p>
        </div>
      )}

      {busy && <div className="absolute inset-0 bg-white/50 pointer-events-none" />}
    </article>
  );
};

export default EmissionProductCard;
