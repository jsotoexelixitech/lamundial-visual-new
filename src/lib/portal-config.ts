// Portal La Mundial — Configuración de URLs por entorno
export const portalConfig = {
  nexusApiUrl: import.meta.env.VITE_NEXUS_API_URL || 'https://cierrelmds.exelixitech.com/nexus-api',
  modules: {
    ocr:      import.meta.env.VITE_PORTAL_OCR_URL      || 'https://cierrelmds.exelixitech.com/ocr/',
    emision:  import.meta.env.VITE_PORTAL_EMISION_URL  || 'https://cierrelmds.exelixitech.com/emision/',
    formulario: import.meta.env.VITE_PORTAL_FORM_URL   || 'https://cierrelmds.exelixitech.com/formulario/',
    pagos:    import.meta.env.VITE_PORTAL_PAGOS_URL    || 'https://cierrelmds.exelixitech.com/pagos/',
  },
} as const;

export type ProductKey = 'rcv' | 'patrimonial' | 'funerario';

export interface ProductConfig {
  key: ProductKey;
  label: string;
  description: string;
  target: 'ocr' | 'emision' | 'formulario' | 'pagos';
  product?: string;
  defaultCramo?: number;
}

export const PRODUCTS: ProductConfig[] = [
  {
    key: 'rcv',
    label: 'RCV',
    description: 'Responsabilidad Civil Vehículo. Flujo completo: OCR → Formulario → Emisión → Pagos.',
    target: 'ocr',
    defaultCramo: 18,
  },
  {
    key: 'patrimonial',
    label: 'Patrimoniales',
    description: 'Seguros patrimoniales. Accede directamente al módulo de emisión con ramo configurado.',
    target: 'emision',
    defaultCramo: Number(import.meta.env.VITE_LAMUNDIAL_RAMO_PATRIMONIAL) || 20,
  },
  {
    key: 'funerario',
    label: 'Funerario',
    description: 'Seguro de vida funerario. Flujo desde OCR con producto funerario activado.',
    target: 'ocr',
    product: 'funerario',
    defaultCramo: 9,
  },
];
