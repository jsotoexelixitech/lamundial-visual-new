import type { ReactNode } from 'react';
import { Building2, Car, Flower2, HeartPulse, Plane, Ship } from 'lucide-react';
import type { PortalProductDto } from '@/lib/nexus-auth';

export type ProductLineId = 'autos' | 'personas' | 'viajes' | 'funerario' | 'patrimoniales';

export interface ProductLine {
  id: ProductLineId;
  label: string;
  /** Color de la línea (paleta del manual: azules, rojo imperial, plata). */
  dot: string;
  icon: (size: number) => ReactNode;
}

export const PRODUCT_LINES: Record<ProductLineId, ProductLine> = {
  autos: {
    id: 'autos',
    label: 'Autos',
    dot: '#E84F51',
    icon: (s) => <Car size={s} strokeWidth={1.75} />,
  },
  personas: {
    id: 'personas',
    label: 'Salud y personas',
    dot: '#2E6DBF',
    icon: (s) => <HeartPulse size={s} strokeWidth={1.75} />,
  },
  viajes: {
    id: 'viajes',
    label: 'Viajes',
    dot: '#7FA7E0',
    icon: (s) => <Plane size={s} strokeWidth={1.75} />,
  },
  funerario: {
    id: 'funerario',
    label: 'Funerario',
    dot: '#0F1A5A',
    icon: (s) => <Flower2 size={s} strokeWidth={1.75} />,
  },
  patrimoniales: {
    id: 'patrimoniales',
    label: 'Patrimoniales',
    dot: '#ACACAC',
    icon: (s) => <Building2 size={s} strokeWidth={1.75} />,
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

export function productIcon(product: PortalProductDto, size: number): ReactNode {
  if (/embarc/i.test(product.label) || Number(product.cramo) === 20) {
    return <Ship size={size} strokeWidth={1.75} />;
  }
  return PRODUCT_LINES[productLine(product)].icon(size);
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

/** Monto "desde" legible; algunos productos traen texto ("Desde cotización") en vez de monto. */
export function priceInfo(product: PortalProductDto): { label: string; value: string } {
  const raw = String(product.mmontoInicial ?? '').trim();
  if (!raw || /cotiz/i.test(raw)) return { label: 'Precio', value: 'Según cotización' };
  return { label: 'Desde', value: raw.replace(/^desde\s*/i, '') };
}
