import type { ProductConfig } from './portal-config';
import { portalConfig } from './portal-config';
import type { SsoDelegatePayload } from './nexus-auth';
import { getFlowMetadataOverrides } from './portal-sso-config';

/** Metadata Sis2000 por defecto en cierre (sobrescribir con VITE_SSO_* o panel admin). */
export function getSsoDefaults(productKey?: ProductConfig['key']) {
  const env = {
    cproductor: String(import.meta.env.VITE_SSO_CPRODUCTOR ?? '80080').trim(),
    cusuario: String(import.meta.env.VITE_SSO_CUSUARIO ?? '4').trim(),
    centidad: String(import.meta.env.VITE_SSO_CENTIDAD ?? 'P').trim(),
    citem: String(import.meta.env.VITE_SSO_CITEM ?? import.meta.env.VITE_SSO_CPRODUCTOR ?? '80080').trim(),
  };
  if (!productKey) return env;
  const o = getFlowMetadataOverrides(productKey);
  return {
    cproductor: o.cproductor?.trim() || env.cproductor,
    cusuario: o.cusuario?.trim() || env.cusuario,
    centidad: o.centidad?.trim() || env.centidad,
    citem: o.citem?.trim() || env.citem,
  };
}

export function buildSsoPayload(product: ProductConfig): SsoDelegatePayload {
  const defaults = getSsoDefaults(product.key);
  const flowCramo = getFlowMetadataOverrides(product.key).cramo?.trim();
  const cramo =
    flowCramo && !Number.isNaN(Number(flowCramo))
      ? Number(flowCramo)
      : product.defaultCramo;

  const base: SsoDelegatePayload = {
    target: product.target,
    cproductor: defaults.cproductor,
    cusuario: defaults.cusuario,
    centidad: defaults.centidad,
    citem: defaults.citem,
    ...(cramo != null ? { cramo } : {}),
  };

  switch (product.key) {
    case 'rcv':
      return { ...base, target: 'ocr', product: 'rcv', cramo: cramo ?? 18 };
    case 'patrimonial':
      return {
        ...base,
        target: 'emision',
        product: 'patrimoniales',
        cramo: cramo ?? (Number(import.meta.env.VITE_LAMUNDIAL_RAMO_PATRIMONIAL) || 20),
      };
    case 'funerario':
      return { ...base, target: 'ocr', product: 'funerario', cramo: cramo ?? 9 };
    default:
      return base;
  }
}

/** Fallback si sso-delegate falla: URL con token plano (legacy). */
export function buildFallbackModuleUrl(product: ProductConfig, token: string): string {
  const { modules } = portalConfig;
  const q = new URLSearchParams({ nexus_token: token });

  switch (product.key) {
    case 'rcv':
      q.set('product', 'rcv');
      return `${modules.ocr}?${q}`;
    case 'patrimonial':
      q.set('product', 'patrimoniales');
      return `${modules.emision}?${q}`;
    case 'funerario':
      q.set('product', 'funerario');
      return `${modules.ocr}?${q}`;
    default:
      return `${modules.ocr}?${q}`;
  }
}
