/**
 * OCR opcional por productor (monitor de expedientes → Configuración → «OCR por canal»).
 *
 * Nexus guarda `ocrOpcional.productores` (cproductor con OCR OPCIONAL; lo no listado queda
 * obligatorio) y `ocrOpcional.productoresNombres` (código → nombre, solo para mostrar). No hay
 * catálogo de productores: se agregan por código + nombre. Funciones puras, sin React.
 */

export interface ProductorOcr {
  codigo: string;
  nombre: string | null;
}

/** Mismo formato que valida Nexus (cproductor del SSO: texto corto sin espacios). */
const CODIGO_PRODUCTOR = /^[A-Za-z0-9._-]{1,32}$/;

export function codigoProductorValido(v: unknown): boolean {
  return CODIGO_PRODUCTOR.test(v == null ? '' : String(v).trim());
}

function nombreLimpio(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim().slice(0, 120) : '';
  return s || null;
}

/** `productores` de la respuesta de Nexus; un Nexus anterior no lo manda (→ lista vacía). */
export function normalizarProductores(raw: unknown): ProductorOcr[] {
  const vistos = new Set<string>();
  const out: ProductorOcr[] = [];
  for (const p of Array.isArray(raw) ? raw : []) {
    if (!p || typeof p !== 'object') continue;
    const r = p as Record<string, unknown>;
    const codigo = r.codigo == null ? '' : String(r.codigo).trim();
    if (!codigo || vistos.has(codigo)) continue;
    vistos.add(codigo);
    out.push({ codigo, nombre: nombreLimpio(r.nombre) });
  }
  return out;
}

/**
 * Agrega un productor con OCR opcional. Código inválido: devuelve la misma lista. Si ya
 * estaba, no se duplica (solo actualiza el nombre cuando se escribió uno).
 */
export function agregarProductor(
  lista: ProductorOcr[],
  codigo: string,
  nombre = '',
): ProductorOcr[] {
  const cod = codigo.trim();
  if (!codigoProductorValido(cod)) return lista;
  const n = nombreLimpio(nombre);
  if (lista.some((p) => p.codigo === cod)) {
    return n ? lista.map((p) => (p.codigo === cod ? { ...p, nombre: n } : p)) : lista;
  }
  return [...lista, { codigo: cod, nombre: n }];
}

/** Quita el productor de la lista: vuelve a OCR obligatorio. */
export function quitarProductor(lista: ProductorOcr[], codigo: string): ProductorOcr[] {
  return lista.filter((p) => p.codigo !== codigo);
}

/** Campos del PUT /ocr-por-canal para productores (`base` = lo que la pantalla cargó). */
export function cuerpoProductores(
  lista: ProductorOcr[],
  base: string[],
): {
  productores: string[];
  productoresNombres: Record<string, string>;
  baseProductores: string[];
} {
  const productoresNombres: Record<string, string> = {};
  for (const p of lista) if (p.nombre) productoresNombres[p.codigo] = p.nombre;
  return {
    productores: lista.map((p) => p.codigo),
    productoresNombres,
    baseProductores: base,
  };
}
