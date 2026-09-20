// Portal La Mundial — URLs por entorno (HTTPS cierrelmds o IP directa 120)
const defaultOrigin = 'https://cierrelmds.exelixitech.com';

export const portalConfig = {
  nexusApiUrl:
    import.meta.env.VITE_NEXUS_API_URL || `${defaultOrigin}/nexus-api`,
  modules: {
    ocr: import.meta.env.VITE_PORTAL_OCR_URL || `${defaultOrigin}/ocr/`,
    emision: import.meta.env.VITE_PORTAL_EMISION_URL || `${defaultOrigin}/emision/`,
    formulario: import.meta.env.VITE_PORTAL_FORM_URL || `${defaultOrigin}/formulario/`,
    pagos: import.meta.env.VITE_PORTAL_PAGOS_URL || `${defaultOrigin}/pagos/`,
  },
} as const;

export type ProductKey = 'rcv' | 'patrimonial' | 'funerario';

export interface ProductConfig {
  key: ProductKey;
  label: string;
  description: string;
  target: 'ocr' | 'emision' | 'formulario' | 'pagos';
  product?: 'rcv' | 'funerario' | 'patrimoniales';
  defaultCramo?: number;
}

export const PRODUCTS: ProductConfig[] = [
  {
    key: 'rcv',
    label: 'RCV',
    description: 'Responsabilidad Civil Vehículo. Flujo completo: OCR → Formulario → Emisión → Pagos.',
    target: 'ocr',
    product: 'rcv',
    defaultCramo: 18,
  },
  {
    key: 'patrimonial',
    label: 'Patrimoniales',
    description: 'Riesgos patrimoniales: cotización y emisión con ramo y canal Sis2000.',
    target: 'emision',
    product: 'patrimoniales',
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
