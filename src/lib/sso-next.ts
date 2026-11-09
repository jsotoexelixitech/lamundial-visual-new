/**
 * Destino tras la entrada SSO (`/sso?nexus_token=…&next=…`).
 * Solo rutas internas de esta lista: nunca URLs externas ni rutas con otro origen.
 */
const RUTAS_PERMITIDAS = ['/dashboard', '/monitor-expedientes'];

export function rutaInternaSegura(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return null;
  let url: URL;
  try {
    url = new URL(v, 'https://interno.invalid');
  } catch {
    return null;
  }
  if (url.origin !== 'https://interno.invalid') return null;
  if (!RUTAS_PERMITIDAS.includes(url.pathname)) return null;
  return url.pathname + url.search;
}
