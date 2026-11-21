import type { PortalProductDto } from '@/lib/nexus-auth';
import { sinMarcaLm } from '@/lib/marca';

export type ProductLineId = 'autos' | 'personas' | 'viajes' | 'funerario' | 'patrimoniales';

export interface ProductLine {
  id: ProductLineId;
  label: string;
}

export const PRODUCT_LINES: Record<ProductLineId, ProductLine> = {
  autos: {
    id: 'autos',
    label: 'Autos',
  },
  personas: {
    id: 'personas',
    label: 'Salud y personas',
  },
  viajes: {
    id: 'viajes',
    label: 'Viajes',
  },
  funerario: {
    id: 'funerario',
    label: 'Funerario',
  },
  patrimoniales: {
    id: 'patrimoniales',
    label: 'Patrimoniales',
  },
};

export const PRODUCT_LINE_ORDER: ProductLineId[] = [
  'autos',
  'personas',
  'viajes',
  'funerario',
  'patrimoniales',
];

/**
 * Datos del producto tal como los configura La Mundial en maproductos: nombre, formulario
 * (xform) e ícono del marketplace (xdescripcion_c → xlogo, ej. "4_1.png", "acc_person.png").
 * Nada depende de ramos fijos: si La Mundial cambia el ícono o el formulario, el portal lo sigue.
 */
export function productSignals(product: PortalProductDto): { text: string; logo: string } {
  return {
    text: `${product.label} ${product.xform ?? ''}`.toLowerCase(),
    logo: (product.xlogo ?? '').toLowerCase(),
  };
}

/**
 * Línea comercial de la tarjeta. No usa `product` del SSO: los productos de personas viajan
 * como "funerario" (mismo flujo OCR) pero se muestran en su propia línea.
 */
export function productLine(product: PortalProductDto): ProductLineId {
  const { text, logo } = productSignals(product);
  if (
    product.product === 'rcv' ||
    /rcv|auto|veh|casco/.test(text) ||
    /rcv|car\b|car\./.test(logo)
  ) {
    return 'autos';
  }
  if (/funer|sepel/.test(text) || /funer|coffin|bird/.test(logo)) return 'funerario';
  if (/viaj|travel/.test(text) || /viaj|plane|avion/.test(logo)) return 'viajes';
  if (
    product.product === 'patrimoniales' ||
    /patrimon|hogar|resid|embarc|incend|general-risk/.test(text) ||
    /patrimon|home|house|boat/.test(logo)
  ) {
    return 'patrimoniales';
  }
  if (
    product.product === 'funerario' ||
    /salud|accident|combinad|4 en 1|vida|person|familiar/.test(text) ||
    /4_1|3_1|acc_|accident|salud|ambulance|family|vida|heart|person/.test(logo)
  ) {
    return 'personas';
  }
  return 'patrimoniales';
}

/**
 * Marca neutra: la vitrina muestra solo RCV y Funerario con emisión en línea (SSO a nuestros
 * módulos). Fuera quedan personas, viajes, patrimoniales, casco y todo lo que abre el
 * marketplace de La Mundial (launchMode 'sysip').
 */
export function productoVisibleEnNeutra(product: PortalProductDto): boolean {
  if (product.launchMode === 'sysip') return false;
  const line = productLine(product);
  if (line === 'funerario') return true;
  if (line !== 'autos') return false;
  const { text } = productSignals(product);
  return (product.product === 'rcv' || /rcv/.test(text)) && !/casco/.test(text);
}

/**
 * Marca neutra: filtra la vitrina y quita «La Mundial» de los textos que solo se muestran.
 * `label` no se toca: viaja como xproducto en el SSO (el título visible pasa por productTitle).
 */
export function catalogoMarcaNeutra(products: PortalProductDto[]): PortalProductDto[] {
  return products.filter(productoVisibleEnNeutra).map((p) => ({
    ...p,
    description: sinMarcaLm(p.description),
    xfraccionamiento: sinMarcaLm(p.xfraccionamiento),
  }));
}

/** Quita marcas técnicas del catálogo (ej. "(Nexus)", "(Iframe)") que no son para el cliente. */
export function cleanCopy(text: string | undefined): string {
  return String(text ?? '')
    .replace(/\s*-\s*(nexus|iframe|sysip|sis2000|ex[eé]lixi)\b/gi, '')
    .replace(/\(\s*(nexus|iframe|sysip|sis2000|ex[eé]lixi)\s*\)/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+([.,;])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Nombre comercial que ve el canal; el RCV del catálogo se vende como Nacional y Binacional. */
export function productTitle(product: PortalProductDto): string {
  if (productLine(product) === 'autos' && /rcv/i.test(product.label)) {
    return 'RCV Nacional y Binacional';
  }
  return sinMarcaLm(cleanCopy(product.label));
}

/** Monto "desde" legible; algunos productos traen texto ("Desde cotización") en vez de monto. */
export function priceInfo(product: PortalProductDto): { label: string; value: string } {
  const raw = String(product.mmontoInicial ?? '').trim();
  if (!raw || /cotiz/i.test(raw)) return { label: 'Precio', value: 'Según cotización' };
  return { label: 'Desde', value: raw.replace(/^desde\s*/i, '') };
}
