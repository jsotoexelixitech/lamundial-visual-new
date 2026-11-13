/**
 * OCR opcional por productor (monitor de expedientes → Configuración → «OCR por canal»).
 *
 * Nexus guarda `ocrOpcional.productores` (cproductor con OCR OPCIONAL; lo no listado queda
 * obligatorio) y `ocrOpcional.productoresNombres` (código → nombre, solo para mostrar). La lista
 * sale del catálogo de productores que manda Nexus; si no carga, se agregan por código +
 * nombre. Funciones puras, sin React.
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

// ─── Catálogo de productores (lista con buscador, como la de canales) ──────

/** Productor del catálogo de Nexus (nest-api valrep/brokers). */
export interface ProductorCatalogo {
  codigo: string;
  nombre: string;
}

/**
 * `catalogoProductores` de la respuesta de Nexus. null si no vino o vino vacío (Nexus anterior
 * o nest-api sin responder): la pantalla sigue con «agregar por código».
 */
export function normalizarCatalogoProductores(raw: unknown): ProductorCatalogo[] | null {
  if (!Array.isArray(raw)) return null;
  const vistos = new Set<string>();
  const out: ProductorCatalogo[] = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const r = p as Record<string, unknown>;
    const codigo = r.codigo == null ? '' : String(r.codigo).trim();
    if (!codigoProductorValido(codigo) || vistos.has(codigo)) continue;
    vistos.add(codigo);
    out.push({ codigo, nombre: nombreLimpio(r.nombre) ?? '' });
  }
  return out.length > 0 ? out : null;
}

export interface FilaProductor {
  codigo: string;
  nombre: string | null;
  /** Está en la selección en edición (OCR opcional). */
  opcional: boolean;
  /** false: se agregó por código y no está en el catálogo. */
  enCatalogo: boolean;
}

/** Minúsculas y sin acentos, para buscar «garcia» y encontrar «García». */
function plano(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Filas a mostrar de la lista de productores. Orden estable (la fila no se mueve al marcar):
 * primero los guardados con OCR opcional (`base`) y los agregados por código, luego el resto
 * del catálogo en su orden. Pueden ser miles: de los que no están marcados solo salen
 * `limite`; los marcados y los guardados salen siempre (si coinciden con la búsqueda).
 */
export function filasProductores(
  catalogo: ProductorCatalogo[],
  seleccion: ProductorOcr[],
  base: string[],
  busqueda: string,
  limite: number,
): { filas: FilaProductor[]; coinciden: number; total: number } {
  const marcados = new Map(seleccion.map((p) => [p.codigo, p]));
  const fijos = new Set(base);
  const enCatalogo = new Set(catalogo.map((p) => p.codigo));
  // Guardados o agregados por código que el catálogo no trae: no se pierden de vista.
  const fuera: ProductorCatalogo[] = [];
  for (const cod of base) {
    if (!enCatalogo.has(cod)) fuera.push({ codigo: cod, nombre: marcados.get(cod)?.nombre ?? '' });
  }
  for (const p of seleccion) {
    if (!enCatalogo.has(p.codigo) && !fijos.has(p.codigo)) {
      fuera.push({ codigo: p.codigo, nombre: p.nombre ?? '' });
    }
  }
  const orden = [
    ...fuera,
    ...catalogo.filter((p) => fijos.has(p.codigo)),
    ...catalogo.filter((p) => !fijos.has(p.codigo)),
  ];
  const t = plano(busqueda.trim());
  const filas: FilaProductor[] = [];
  let coinciden = 0;
  let libres = 0;
  for (const p of orden) {
    const nombre = p.nombre || marcados.get(p.codigo)?.nombre || null;
    if (t && !plano(p.codigo).includes(t) && !plano(nombre ?? '').includes(t)) continue;
    coinciden++;
    const opcional = marcados.has(p.codigo);
    if (!opcional && !fijos.has(p.codigo)) {
      if (libres >= limite) continue;
      libres++;
    }
    filas.push({ codigo: p.codigo, nombre, opcional, enCatalogo: enCatalogo.has(p.codigo) });
  }
  return { filas, coinciden, total: orden.length };
}
