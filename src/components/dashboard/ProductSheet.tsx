import React from 'react';
import { ArrowRight, ExternalLink, Loader2, Store } from 'lucide-react';
import type { PortalProductDto } from '@/lib/nexus-auth';
import { PRODUCT_LINES, cleanCopy, priceInfo, productLine, productTitle } from './product-lines';
import { ProductArt } from './ProductArt';

interface Props {
  product: PortalProductDto;
  busy: boolean;
  disabled: boolean;
  onLaunch: (product: PortalProductDto) => void;
  variant?: 'panel' | 'client';
}

/** Ficha comercial del producto: lo que el cliente necesita ver y un solo botón para emitir. */
export const ProductSheet: React.FC<Props> = ({
  product,
  busy,
  disabled,
  onLaunch,
  variant = 'panel',
}) => {
  const line = PRODUCT_LINES[productLine(product)];
  const external = product.launchMode === 'sysip';
  const title = productTitle(product);
  const description = cleanCopy(product.description);
  const price = priceInfo(product);

  return (
    <article className="ficha" data-variant={variant} aria-label={`Ficha de ${title}`}>
      <div className="ficha-art">
        <ProductArt product={product} />
      </div>

      <h2 className="ficha-title">{title}</h2>
      <p className="ficha-meta">
        {line.label} · Producto N.º {product.cproducto}
      </p>
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
        </div>
      </div>
    </article>
  );
};

export default ProductSheet;
