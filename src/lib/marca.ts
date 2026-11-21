/**
 * Modo «marca neutra» (contrato común portal + módulos OCR/Formulario/Emisión/Pagos).
 *
 * - `?marca=neutra` → sessionStorage['exelixi_marca'] = 'neutra'.
 * - `?marca=lm` → borra la clave.
 * - Sin parámetro → lo guardado en la sesión del navegador.
 *
 * En neutra no se muestra nada de La Mundial: wordmark «Exélixi», título y favicon neutros,
 * y la vitrina solo con RCV y Funerario. Sin el modo, el portal queda exactamente igual.
 */

export const MARCA_STORAGE_KEY = 'exelixi_marca';
export const MARCA_NEUTRA = 'neutra';
export const NOMBRE_NEUTRO = 'Exélixi';
export const TITULO_NEUTRO = 'Exélixi · Marketplace de seguros';

/** Favicon sin marca: cuadrado redondeado liso (no es un logo). */
const FAVICON_NEUTRO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1f2937"/></svg>',
  );

let resuelta: boolean | null = null;

function leerMarca(): boolean {
  if (typeof window === 'undefined') return false;
  let param: string | null = null;
  try {
    param = new URLSearchParams(window.location.search).get('marca');
  } catch {
    param = null;
  }
  const valor = param?.trim().toLowerCase();
  try {
    if (valor === MARCA_NEUTRA) {
      window.sessionStorage.setItem(MARCA_STORAGE_KEY, MARCA_NEUTRA);
      return true;
    }
    if (valor === 'lm') {
      window.sessionStorage.removeItem(MARCA_STORAGE_KEY);
      return false;
    }
    return window.sessionStorage.getItem(MARCA_STORAGE_KEY) === MARCA_NEUTRA;
  } catch {
    // Sin sessionStorage (modo privado estricto): vale solo el parámetro de esta carga.
    return valor === MARCA_NEUTRA;
  }
}

function fijarMeta(name: string, content: string) {
  const meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (meta) meta.content = content;
}

/** Título, favicon, metas y `data-marca` del documento en modo neutro. */
function aplicarDocumentoNeutro() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.marca = MARCA_NEUTRA;
  document.title = TITULO_NEUTRO;
  fijarMeta('application-name', NOMBRE_NEUTRO);
  fijarMeta('apple-mobile-web-app-title', NOMBRE_NEUTRO);
  fijarMeta('description', 'Exélixi — Marketplace de seguros: emisión de RCV y Funerario.');

  document
    .querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')
    .forEach((el) => el.parentNode?.removeChild(el));
  const icon = document.createElement('link');
  icon.rel = 'icon';
  icon.type = 'image/svg+xml';
  icon.href = FAVICON_NEUTRO;
  document.head.appendChild(icon);
}

/**
 * true si el portal está en modo marca neutra. La primera llamada (desde main.tsx, antes del
 * primer render) lee la URL / sessionStorage y ajusta el documento; las siguientes usan ese valor.
 */
export function esMarcaNeutra(): boolean {
  if (resuelta === null) {
    resuelta = leerMarca();
    if (resuelta) aplicarDocumentoNeutro();
  }
  return resuelta;
}

/** Agrega `marca=neutra` a una URL de módulo/SSO cuando el modo está activo; si no, la deja igual. */
export function conMarca(url: string): string {
  if (!url || !esMarcaNeutra()) return url;
  try {
    const u = new URL(url, window.location.href);
    u.searchParams.set('marca', MARCA_NEUTRA);
    return u.toString();
  } catch {
    const [sinHash, hash] = url.split('#', 2);
    const sep = sinHash.includes('?') ? '&' : '?';
    return `${sinHash}${sep}marca=${MARCA_NEUTRA}${hash !== undefined ? `#${hash}` : ''}`;
  }
}

/** En neutra cambia «La Mundial (de Seguros)» por «Exélixi» en textos que llegan del backend. */
export function sinMarcaLm(texto: string): string;
export function sinMarcaLm(texto: string | undefined): string | undefined;
export function sinMarcaLm(texto: string | undefined): string | undefined {
  if (!texto || !esMarcaNeutra()) return texto;
  return texto.replace(/la\s+mundial(\s+de\s+seguros)?/gi, NOMBRE_NEUTRO);
}
