import React from 'react';
import { ArrowRight, ExternalLink, Loader2, MonitorUp, Store } from 'lucide-react';
import type { PortalProductDto } from '@/lib/nexus-auth';
import { publicAsset } from '@/lib/public-asset';
import {
  PRODUCT_LINES,
  cleanCopy,
  priceInfo,
  productIcon,
  productLine,
} from './product-lines';

interface Props {
  product: PortalProductDto;
  busy: boolean;
  disabled: boolean;
  onLaunch: (product: PortalProductDto) => void;
  /** Abre la ficha a pantalla completa para mostrarla al cliente. */
  onPresent?: () => void;
  variant?: 'panel' | 'client';
}

/** Ficha comercial del producto: lo que el cliente necesita ver y un solo botón para emitir. */
export const ProductSheet: React.FC<Props> = ({
  product,
  busy,
  disabled,
  onLaunch,
  onPresent,
  variant = 'panel',
}) => {
  const line = PRODUCT_LINES[productLine(product)];
  const external = product.launchMode === 'sysip';
  const title = cleanCopy(product.label);
  const description = cleanCopy(product.description);
  const price = priceInfo(product);

  return (
    <article className="ficha" data-variant={variant} aria-label={`Ficha de ${title}`}>
      <img src={publicAsset('brand/mundial-isotipo.png')} alt="" aria-hidden className="ficha-mark" />

      <div className="ficha-head">
        <span className="ficha-seal">
          <span className="ficha-seal-icon" style={{ background: line.dot }}>
            {productIcon(product, 15)}
          </span>
          {line.label}
        </span>
        <span className="ficha-code">Producto N.º {product.cproducto}</span>
      </div>

      <h2 className="ficha-title">{title}</h2>
      {description && description !== title && <p className="ficha-desc">{description}</p>}

      <div className="ficha-price">
        <span className="ficha-price-label">{price.label}</span>
        <span className="ficha-price-value" data-kind={price.label === 'Desde' ? 'amount' : 'text'}>
          {price.value}
        </span>
        {product.xfraccionamiento && (
          <span className="ficha-price-note">{product.xfraccionamiento}</span>
        )}
      </div>

      <div className="ficha-foot">
        <div className="ficha-actions">
          <button
            type="button"
            className="ficha-cta"
            disabled={disabled}
            onClick={() => onLaunch(product)}
          >
            {busy ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Abriendo emisión…
              </>
            ) : (
              <>
                {external ? 'Emitir en marketplace' : 'Emitir'}
                {external ? <ExternalLink size={18} /> : <ArrowRight size={19} />}
              </>
            )}
          </button>

          <p className="ficha-note">
            {external ? <Store size={14} /> : null}
            {external
              ? 'Se abre el formulario del marketplace La Mundial en una pestaña nueva.'
              : 'La emisión se abre en una pestaña nueva.'}
          </p>

          {(product.xurlPresentacion || onPresent) && (
            <div className="ficha-links">
              {product.xurlPresentacion && (
                <a
                  href={product.xurlPresentacion.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ficha-link"
                >
                  Ver presentación
                  <ExternalLink size={14} />
                </a>
              )}
              {onPresent && (
                <button type="button" className="ficha-link" onClick={onPresent}>
                  <MonitorUp size={15} />
                  Mostrar al cliente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductSheet;
