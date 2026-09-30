import type { ReactNode } from 'react';
import { Building2, Car, Flower2, HeartPulse, Plane, Ship } from 'lucide-react';
import type { PortalProductDto } from '@/lib/nexus-auth';

export type ProductLineId = 'autos' | 'personas' | 'viajes' | 'funerario' | 'patrimoniales';

export interface ProductLine {
  id: ProductLineId;
  label: string;
  accent: string;
  tint: string;
  soft: string;
  icon: (size: number) => ReactNode;
}

/** Líneas comerciales con la paleta del manual de marca (azules, rojo imperial, plata). */
export const PRODUCT_LINES: Record<ProductLineId, ProductLine> = {
  autos: {
    id: 'autos',
    label: 'Autos',
    accent: 'linear-gradient(135deg, #E84F51 0%, #B23F44 100%)',
    tint: '#C9383B',
    soft: '#FDECEC',
    icon: (s) => <Car size={s} strokeWidth={1.75} />,
  },
  personas: {
    id: 'personas',
    label: 'Salud y personas',
    accent: 'linear-gradient(135deg, #2E6DBF 0%, #1B4E97 100%)',
    tint: '#2E6DBF',
    soft: '#EAF1FB',
    icon: (s) => <HeartPulse size={s} strokeWidth={1.75} />,
  },
  viajes: {
    id: 'viajes',
    label: 'Viajes',
    accent: 'linear-gradient(135deg, #162A7F 0%, #0F1A5A 100%)',
    tint: '#162A7F',
    soft: '#ECEEF8',
    icon: (s) => <Plane size={s} strokeWidth={1.75} />,
  },
  funerario: {
    id: 'funerario',
    label: 'Funerario',
    accent: 'linear-gradient(135deg, #0F1A5A 0%, #091133 100%)',
    tint: '#0F1A5A',
    soft: '#EDEFF5',
    icon: (s) => <Flower2 size={s} strokeWidth={1.75} />,
  },
  patrimoniales: {
    id: 'patrimoniales',
    label: 'Patrimoniales',
    accent: 'linear-gradient(135deg, #777777 0%, #4A4A4A 100%)',
    tint: '#5B5B5B',
    soft: '#F2F2F2',
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

/** Clasifica por ramo Sis2000 y nombre del producto. */
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
