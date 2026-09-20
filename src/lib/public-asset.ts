/** Rutas estáticas respetando VITE_APP_BASE (/ o /portal/). */
export function publicAsset(relativePath: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const path = relativePath.replace(/^\//, '');
  return `${base}${path}`;
}
