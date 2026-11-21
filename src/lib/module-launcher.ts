import type { ProductKey } from './portal-config';
import { portalConfig } from './portal-config';
import { conMarca } from './marca';

/**
 * Construye la URL de un módulo cuando el usuario ya tiene un nexus_token.
 * No llama al backend — solo arma la URL con query params.
 * En marca neutra agrega `marca=neutra`.
 */
export function buildModuleUrl(product: ProductKey, token: string): string {
  return conMarca(buildModuleUrlBase(product, token));
}

function buildModuleUrlBase(product: ProductKey, token: string): string {
  const { modules } = portalConfig;

  switch (product) {
    case 'rcv':
      return `${modules.ocr}?nexus_token=${encodeURIComponent(token)}`;
    case 'patrimonial':
      return `${modules.emision}?nexus_token=${encodeURIComponent(token)}&product=patrimoniales`;
    case 'funerario':
      return `${modules.ocr}?nexus_token=${encodeURIComponent(token)}&product=funerario`;
    default:
      return `${modules.ocr}?nexus_token=${encodeURIComponent(token)}`;
  }
}
