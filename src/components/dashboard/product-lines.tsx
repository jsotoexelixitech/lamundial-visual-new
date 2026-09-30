import type { PortalProductDto } from '@/lib/nexus-auth';

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

/** Clasifica por ramo y nombre del producto. */
export function productLine(product: PortalProductDto): ProductLineId {
  const label = product.label.toLowerCase();
  const cramo = Number(product.cramo);
  if (product.product === 'rcv' || cramo === 18 || /rcv|auto|veh/.test(label)) return 'autos';
  if (product.product === 'funerario' || cramo === 9 || cramo === 45 || /funer/.test(label)) {
    return 'funerario';
  }
  if (cramo === 5 || /viaj/.test(label)) return 'viajes';
  if ([7, 48, 49, 51].includes(cramo) || /salud|accident|combinad|4 en 1|vida/.test(label)) {
    return 'personas';
  }
  return 'patrimoniales';
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
  return cleanCopy(product.label);
}

/** Monto "desde" legible; algunos productos traen texto ("Desde cotización") en vez de monto. */
export function priceInfo(product: PortalProductDto): { label: string; value: string } {
  const raw = String(product.mmontoInicial ?? '').trim();
  if (!raw || /cotiz/i.test(raw)) return { label: 'Precio', value: 'Según cotización' };
  return { label: 'Desde', value: raw.replace(/^desde\s*/i, '') };
}
