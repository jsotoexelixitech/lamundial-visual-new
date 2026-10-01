import type { ProductConfig } from './portal-config';
import { portalConfig } from './portal-config';
import type { PortalProductDto, SsoDelegatePayload } from './nexus-auth';
import { getFlowMetadataOverrides } from './portal-sso-config';
import { getCurrentUser } from './nexus-auth';

export type LaunchProduct = ProductConfig | PortalProductDto;

/** Metadata Sis2000 por defecto en cierre (sobrescribir con VITE_SSO_* o panel admin). */
export function getSsoDefaults(productKey?: string) {
  const env = {
    cproductor: String(import.meta.env.VITE_SSO_CPRODUCTOR ?? '80080').trim(),
    cusuario: String(import.meta.env.VITE_SSO_CUSUARIO ?? '4').trim(),
    centidad: String(import.meta.env.VITE_SSO_CENTIDAD ?? 'P').trim(),
    citem: String(
      import.meta.env.VITE_SSO_CITEM ?? import.meta.env.VITE_SSO_CPRODUCTOR ?? '80080',
    ).trim(),
  };
  if (!productKey) return env;
  const legacyKey =
    productKey === 'patrimonial'
      ? 'patrimonial'
      : productKey === 'funerario'
        ? 'funerario'
        : productKey === 'rcv'
          ? 'rcv'
          : null;
  if (!legacyKey) return env;
  const o = getFlowMetadataOverrides(legacyKey);
  return {
    cproductor: o.cproductor?.trim() || env.cproductor,
    cusuario: o.cusuario?.trim() || env.cusuario,
    centidad: o.centidad?.trim() || env.centidad,
    citem: o.citem?.trim() || env.citem,
  };
}

/**
 * Gestor como lo envía el marketplace SysIP: productor-gestor ("348-342") en cgestor y csubitem.
 */
function gestorFields(
  cgestor: string | undefined,
  parent: string,
): Pick<SsoDelegatePayload, 'cgestor' | 'csubitem'> {
  const g = String(cgestor ?? '').trim();
  if (!g || g.includes('@')) return {};
  const composed = g.includes('-') || !parent || parent === g ? g : `${parent}-${g}`;
  return { cgestor: composed, csubitem: composed };
}

export function buildSsoPayload(product: LaunchProduct): SsoDelegatePayload {
  const isPortalDto = 'cproducto' in product && Boolean(product.cproducto);
  const defaults = getSsoDefaults(product.key);

  const cproductor = (isPortalDto && product.cproductor) || defaults.cproductor;
  const cusuario = (isPortalDto && product.cusuario) || defaults.cusuario;
  const centidad = (isPortalDto && product.centidad) || defaults.centidad;
  const citem = (isPortalDto && product.citem) || defaults.citem;

  const cramoFromProduct =
    isPortalDto && product.cramo != null && !Number.isNaN(Number(product.cramo))
      ? Number(product.cramo)
      : (product.defaultCramo ?? 18);

  const flowCramo =
    !isPortalDto && 'key' in product
      ? getFlowMetadataOverrides(product.key as ProductConfig['key']).cramo?.trim()
      : undefined;
  const cramo =
    flowCramo && !Number.isNaN(Number(flowCramo)) ? Number(flowCramo) : cramoFromProduct;

  // Rol Sis2000 del usuario que entró desde el backoffice (solo así llega crol).
  const crol = String(getCurrentUser()?.crol ?? '').trim();

  const base: SsoDelegatePayload = {
    target: product.target,
    ...(crol ? { crol } : {}),
    cproductor,
    cusuario,
    centidad,
    citem,
    product: product.product,
    ...(cramo != null ? { cramo } : {}),
  };

  if (isPortalDto) {
    return {
      ...base,
      cproducto: product.cproducto,
      ...(product.xform ? { xform: product.xform } : {}),
      ...(product.label ? { xproducto: product.label } : {}),
      ...(product.ccanalaltIn ? { ccanalalt_in: product.ccanalaltIn } : {}),
      ...(product.cscanalaltIn ? { cscanalalt_in: product.cscanalaltIn } : {}),
      ...gestorFields(product.cgestor, citem),
    };
  }

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
export function buildFallbackModuleUrl(product: LaunchProduct, token: string): string {
  const { modules } = portalConfig;
  const q = new URLSearchParams({ nexus_token: token });

  if ('cproducto' in product && product.cproducto) {
    q.set('cproducto', product.cproducto);
    if (product.product) q.set('product', product.product);
    const url = product.target === 'emision' ? modules.emision : modules.ocr;
    return `${url}?${q}`;
  }

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
