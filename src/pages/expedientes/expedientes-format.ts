// Etiquetas y formato del monitor de expedientes (sin componentes).
import { portalConfig } from '@/lib/portal-config';
import type {
  AlcanceExclusion,
  CategoriaIncompleto,
  DesgloseIncompletos,
  ExclusionAplicada,
  ModoValidacion,
  Requisito,
} from '@/lib/expedientes-api';

// ─── Validación automática con IA ──────────────────────────────────────────

/** `ia` (o `auto`, validación automática anterior) = la validó el sistema, no una persona. */
export function esActorIa(actor?: string | null): boolean {
  const a = (actor ?? '').trim().toLowerCase();
  return a === 'ia' || a === 'auto';
}

/**
 * Estado que se muestra de un documento, combinando su estado y el diagnóstico de la IA:
 * - validado: por IA si el actor es `ia` o la IA dio `coincide`; si no, a mano.
 * - no_coincide → errado · ilegible → ilegible · sin_certeza → revisar.
 * - datos_modificados (v1.3) → datos_cambiados: la póliza salió con datos distintos a los que
 *   el OCR leyó del documento al emitir (se cambiaron en el formulario).
 * - recibido sin diagnóstico o con error_tecnico → analizando (con validación manual: por validar).
 * - observado sin resultado de la IA = observado a mano.
 */
export type EstadoVisual =
  | 'faltante'
  | 'validado_ia'
  | 'validado_manual'
  | 'datos_cambiados'
  | 'errado'
  | 'ilegible'
  | 'revisar'
  | 'analizando'
  | 'por_validar'
  | 'observado'
  | 'sin_informacion'
  | 'otro';

export function estadoVisual(
  req: Pick<Requisito, 'estado' | 'diagnostico' | 'actor'>,
  modo?: ModoValidacion,
): EstadoVisual {
  const resultado = req.diagnostico?.resultado ?? null;
  switch (req.estado) {
    case 'faltante':
      return 'faltante';
    case 'sin_informacion':
      return 'sin_informacion';
    case 'validado':
      if (req.actor) return esActorIa(req.actor) ? 'validado_ia' : 'validado_manual';
      return resultado === 'coincide' ? 'validado_ia' : 'validado_manual';
    case 'observado':
    case 'recibido':
      if (resultado === 'datos_modificados') return 'datos_cambiados';
      if (resultado === 'no_coincide') return 'errado';
      if (resultado === 'ilegible') return 'ilegible';
      if (req.estado === 'observado') return 'observado';
      if (resultado === 'sin_certeza') return 'revisar';
      if (modo === 'manual' && !resultado) return 'por_validar';
      return 'analizando';
    default:
      return 'otro';
  }
}

// ─── Presentación: color y orden (no cambian ninguna regla de estado) ─────

/** Familia de color de un estado. La misma en bandeja, detalle, indicadores y página pública. */
export type Tono = 'gris' | 'azul' | 'ambar' | 'rojo' | 'violeta' | 'verde';

const TONO_VISUAL: Record<EstadoVisual, Tono> = {
  faltante: 'gris',
  sin_informacion: 'gris',
  otro: 'gris',
  analizando: 'azul',
  por_validar: 'azul',
  revisar: 'ambar',
  observado: 'ambar',
  errado: 'rojo',
  ilegible: 'rojo',
  datos_cambiados: 'violeta',
  validado_ia: 'verde',
  validado_manual: 'verde',
};

export function tonoVisual(v: EstadoVisual): Tono {
  return TONO_VISUAL[v];
}

/** Color del expediente según su estado documental: verde solo si está completo. */
export function tonoDocumental(estado: string): Tono {
  if (estado === 'completo') return 'verde';
  if (estado === 'incompleto') return 'ambar';
  return 'gris';
}

// ─── Por qué siguen incompletas (desglose de Nexus: una categoría por póliza) ──

export interface CategoriaIncompletoInfo {
  key: CategoriaIncompleto;
  label: string;
  /** Para la línea de suma: «133 con errores». */
  enSuma: string;
  desc: string;
  tono: Tono;
  /** Se muestra siempre en ese modo de validación; en el otro, solo si tiene pólizas. */
  modo?: ModoValidacion;
  /** Solo se muestra si tiene pólizas. */
  siHay?: boolean;
}

/** En el orden de prioridad de Nexus: cada póliza cuenta en el primero que aplica. */
export const CATEGORIAS_INCOMPLETO: CategoriaIncompletoInfo[] = [
  {
    key: 'conErrores',
    label: 'Con errores',
    enSuma: 'con errores',
    desc: 'Algún documento no coincide con la póliza, es ilegible o necesita revisión.',
    tono: 'rojo',
  },
  {
    key: 'datosCambiados',
    label: 'Datos cambiados',
    enSuma: 'datos cambiados',
    desc: 'Los datos de la póliza cambiaron después de leer el documento.',
    tono: 'violeta',
  },
  {
    key: 'noLeidos',
    label: 'No se pudo leer',
    enSuma: 'no se pudo leer',
    desc: 'El sistema no pudo leer un archivo; se reintenta solo.',
    tono: 'gris',
    modo: 'automatica',
  },
  {
    key: 'porValidar',
    label: 'Por validar',
    enSuma: 'por validar',
    desc: 'Pólizas con documentos que esperan revisión de un analista.',
    tono: 'azul',
    modo: 'manual',
  },
  {
    key: 'analizando',
    label: 'Analizando',
    enSuma: 'analizando',
    desc: 'Pólizas con documentos que la IA está revisando.',
    tono: 'azul',
    modo: 'automatica',
  },
  {
    key: 'faltanDocumentos',
    label: 'Faltan documentos',
    enSuma: 'faltan documentos',
    desc: 'Pólizas que solo esperan que el asegurado envíe documentos.',
    tono: 'gris',
  },
  {
    key: 'otros',
    label: 'Otros',
    enSuma: 'otros',
    desc: 'Pólizas que no encajan en los grupos anteriores.',
    tono: 'gris',
    siHay: true,
  },
];

/**
 * Categorías que se muestran: las del modo de validación y cualquier otra que tenga pólizas,
 * para que la suma siempre se vea completa. Sin modo conocido se toma la validación automática.
 */
export function categoriasVisibles(
  d: DesgloseIncompletos | null,
  validacion?: ModoValidacion,
): CategoriaIncompletoInfo[] {
  const modo = validacion ?? 'automatica';
  return CATEGORIAS_INCOMPLETO.filter((c) => {
    if (d && d[c.key] > 0) return true;
    if (c.siHay) return false;
    return !c.modo || c.modo === modo;
  });
}

/** «231 incompletos = 133 con errores + 0 datos cambiados + … + 77 faltan documentos». */
export function lineaSumaIncompletos(
  incompletos: number,
  d: DesgloseIncompletos,
  validacion?: ModoValidacion,
): string {
  const partes = categoriasVisibles(d, validacion).map(
    (c) => `${numero(d[c.key])} ${c.enSuma}`,
  );
  return `${numero(incompletos)} ${incompletos === 1 ? 'incompleto' : 'incompletos'} = ${partes.join(' + ')}`;
}

/** Primero lo que está mal, luego lo que falta, luego lo que está en curso y al final lo listo. */
const PRIORIDAD: Record<EstadoVisual, number> = {
  errado: 0,
  ilegible: 0,
  datos_cambiados: 1,
  observado: 1,
  revisar: 2,
  faltante: 3,
  por_validar: 4,
  analizando: 5,
  validado_manual: 6,
  validado_ia: 6,
  sin_informacion: 7,
  otro: 7,
};

/** Copia ordenada por gravedad (estable: a igual gravedad se respeta el orden original). */
export function ordenarRequisitos<T extends Pick<Requisito, 'estado' | 'diagnostico' | 'actor'>>(
  reqs: T[],
  modo?: ModoValidacion,
): T[] {
  return reqs
    .map((r, i) => ({ r, i, p: PRIORIDAD[estadoVisual(r, modo)] }))
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .map((x) => x.r);
}

export interface ConteoRequisitos {
  conProblema: number;
  datosCambiados: number;
  porRevisar: number;
  sinCargar: number;
  enCurso: number;
  validados: number;
  total: number;
}

/** Cuenta los documentos por grupo para la línea «qué falta y qué está mal». */
export function contarRequisitos(
  reqs: Pick<Requisito, 'estado' | 'diagnostico' | 'actor'>[],
  modo?: ModoValidacion,
): ConteoRequisitos {
  const c: ConteoRequisitos = {
    conProblema: 0,
    datosCambiados: 0,
    porRevisar: 0,
    sinCargar: 0,
    enCurso: 0,
    validados: 0,
    total: reqs.length,
  };
  for (const r of reqs) {
    const v = estadoVisual(r, modo);
    if (v === 'errado' || v === 'ilegible') c.conProblema++;
    else if (v === 'datos_cambiados') c.datosCambiados++;
    else if (v === 'observado' || v === 'revisar') c.porRevisar++;
    else if (v === 'faltante') c.sinCargar++;
    else if (v === 'analizando' || v === 'por_validar') c.enCurso++;
    else if (v === 'validado_ia' || v === 'validado_manual') c.validados++;
  }
  return c;
}

/**
 * Póliza para la página pública: siempre «•••• 7414», con los últimos 4 caracteres visibles,
 * llegue o no enmascarada desde Nexus («************7414» también queda «•••• 7414»).
 */
export function polizaEnmascarada(p?: string | null): string | null {
  const visibles = (p ?? '').replace(/[^0-9A-Za-z]/g, '').slice(-4);
  return visibles ? `•••• ${visibles}` : null;
}

/** Documento con problema: errado, ilegible, datos cambiados u observado (filtro «Con documentos errados»). */
export function esDocumentoErrado(req: Pick<Requisito, 'estado' | 'diagnostico' | 'actor'>): boolean {
  const v = estadoVisual(req);
  return v === 'errado' || v === 'ilegible' || v === 'observado' || v === 'datos_cambiados';
}

/** v1.3: algún dato de la póliza se cambió en el formulario respecto a lo que leyó el OCR. */
export function esDatoCambiado(req: Pick<Requisito, 'estado' | 'diagnostico' | 'actor'>): boolean {
  return estadoVisual(req) === 'datos_cambiados';
}

/** Confianza en lenguaje simple. Acepta 0–1, 0–100 o el texto alta/media/baja. */
export function nivelConfianza(c?: number | string | null): 'alta' | 'media' | 'baja' | null {
  if (c === null || c === undefined || c === '') return null;
  if (typeof c === 'string') {
    const t = c.trim().toLowerCase();
    if (t === 'alta' || t === 'high') return 'alta';
    if (t === 'media' || t === 'medium') return 'media';
    if (t === 'baja' || t === 'low') return 'baja';
    const n = Number(t.replace('%', '').replace(',', '.'));
    return Number.isFinite(n) ? nivelConfianza(n) : null;
  }
  if (!Number.isFinite(c)) return null;
  const v = c > 1 ? c / 100 : c;
  if (v >= 0.85) return 'alta';
  if (v >= 0.6) return 'media';
  return 'baja';
}

/** Nombre corto con artículo para el asegurado: «La cédula», «El RIF»… (femenino = «Cárguela»). */
const DOC_ASEGURADO: Record<string, { nombre: string; fem: boolean; a: string }> = {
  cedula: { nombre: 'La cédula', fem: true, a: 'al titular de la póliza' },
  cedula_titular: { nombre: 'La cédula', fem: true, a: 'al titular de la póliza' },
  cedula_beneficiario: { nombre: 'La cédula', fem: true, a: 'al beneficiario de la póliza' },
  rif: { nombre: 'El RIF', fem: false, a: 'al titular de la póliza' },
  licencia: { nombre: 'La licencia', fem: true, a: 'al titular de la póliza' },
  pasaporte: { nombre: 'El pasaporte', fem: false, a: 'al titular de la póliza' },
  certificado: { nombre: 'El certificado médico', fem: false, a: 'al asegurado de la póliza' },
};

/**
 * Motivo simple para el asegurado en la página pública. Nunca usa el resumen de la IA ni
 * datos de la póliza: solo el tipo de documento y el resultado. null = usar el texto general.
 */
export function motivoParaAsegurado(
  tipo: string,
  producto: string | null | undefined,
  resultado: string | null | undefined,
): string | null {
  const t = tipo.toLowerCase();
  const rcv = (producto ?? '').toLowerCase() === 'rcv';
  const doc =
    rcv && t === 'certificado'
      ? { nombre: 'El certificado de circulación', fem: false, a: 'al vehículo de la póliza' }
      : (DOC_ASEGURADO[t] ?? { nombre: 'El documento', fem: false, a: 'a los datos de la póliza' });
  // Trato de usted, como el correo oficial de La Mundial.
  const cargalo = doc.fem ? 'Cárguela' : 'Cárguelo';
  if (resultado === 'datos_modificados') {
    // v1.3: el documento está bien; lo que se revisa son los datos de la póliza (sin mostrarlos).
    return 'Estamos revisando los datos de su póliza con este documento. No tiene que enviarlo de nuevo.';
  }
  if (resultado === 'no_coincide') {
    return `${doc.nombre} no corresponde ${doc.a}. ${cargalo} de nuevo.`;
  }
  if (resultado === 'ilegible') {
    const nombre = doc.nombre.charAt(0).toLowerCase() + doc.nombre.slice(1);
    return `No pudimos leer bien ${nombre}. ${cargalo} de nuevo con una foto clara, con buena luz y donde se vea completo.`;
  }
  return null;
}

// ─── Documentos (mismo criterio que la mesa técnica de Emisión) ────────────

/** Igual que OCR_DOC_LABELS de modulo-emision `EmisionRevisionPanel.tsx`. */
const OCR_DOC_LABELS: Record<string, string> = {
  cedula: 'Cédula del tomador',
  cedula_titular: 'Cédula del titular',
  cedula_beneficiario: 'Cédula del beneficiario',
  rif: 'RIF',
  licencia: 'Licencia',
  certificado: 'Certificado médico',
  pasaporte: 'Pasaporte',
};

/** En RCV el certificado es el de circulación del vehículo (no el médico de personas). */
const ETIQUETAS_RCV: Record<string, string> = {
  certificado: 'Certificado de circulación',
};

/**
 * Etiqueta del documento según el producto: RCV usa sus propias etiquetas;
 * personas, funerario y patrimoniales, las de la mesa técnica.
 */
export function etiquetaRequisito(tipo: string, producto?: string | null): string {
  const t = tipo.toLowerCase();
  if ((producto ?? '').toLowerCase() === 'rcv' && ETIQUETAS_RCV[t]) return ETIQUETAS_RCV[t];
  if (OCR_DOC_LABELS[t]) return OCR_DOC_LABELS[t];
  return t ? `Documento ${t}` : 'Documento';
}

function origenOcr(): string {
  try {
    return new URL(portalConfig.modules.ocr).origin;
  } catch {
    return window.location.origin;
  }
}

/**
 * URL para ver el archivo cargado. Mismo criterio que `resolveDocUrl` de la mesa técnica:
 * los archivos del OCR viven en `/ocr/files/...`. Una ruta relativa se resuelve contra el
 * host del módulo OCR del ambiente (VITE_PORTAL_OCR_URL). Si `ref` es solo un id (sin ruta),
 * no hay enlace.
 */
export function urlDocumento(ref?: string | null): string | null {
  const trimmed = (ref ?? '').trim();
  if (!trimmed) return null;

  const conPrefijoOcr = (pathname: string): string => {
    if (pathname.startsWith('/ocr/files/')) return pathname;
    if (pathname.startsWith('/files/')) return `/ocr${pathname}`;
    const filesAt = pathname.indexOf('/files/');
    if (filesAt >= 0) return `/ocr${pathname.slice(filesAt)}`;
    return pathname;
  };

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      u.pathname = conPrefijoOcr(u.pathname);
      return u.toString();
    } catch {
      return null;
    }
  }
  if (!trimmed.includes('/')) return null;

  // Sin "/" inicial es una ruta relativa a EXPEDIENTES_ROOT ({empresa}/{cédula}/...), que OCR sirve en /ocr/files/.
  // Algunos `ref` relativos ya traen `files/` (o `ocr/files/`): se quita para no duplicarlo.
  const relativo = trimmed.replace(/^(?:ocr\/)?files\//, '');
  const path = trimmed.startsWith('/')
    ? conPrefijoOcr(trimmed)
    : `/ocr/files/${relativo.split('/').map(encodeURIComponent).join('/')}`;
  return `${origenOcr()}${path}`;
}

const PRODUCTOS: Record<string, string> = {
  rcv: 'RCV',
  personas: 'Personas',
  patrimonial: 'Patrimoniales',
  patrimoniales: 'Patrimoniales',
  funerario: 'Funerario',
  vida: 'Vida',
};

export function etiquetaProducto(p: string): string {
  return PRODUCTOS[p.toLowerCase()] ?? (p || '—');
}

export const OPCIONES_PRODUCTO = [
  { value: 'rcv', label: 'RCV' },
  { value: 'personas', label: 'Personas' },
  { value: 'patrimonial', label: 'Patrimoniales' },
];

/**
 * Solo dos áreas: Canales y Productores. Los gestores, puntos de comercialización y subcanales
 * trabajan para los canales: sus pólizas cuentan en Canales (Nexus incluye G en area=C).
 */
export const OPCIONES_AREA = [
  { value: 'C', label: 'Canales alternos' },
  { value: 'P', label: 'Productores' },
];

/** Código del grupo «Canal sin identificar» / «Productor sin identificar» del ranking. */
export const SIN_IDENTIFICAR = 'SIN_IDENTIFICAR';

export function etiquetaArea(a: string): string {
  const v = a.trim().toUpperCase();
  if (v === 'C' || v.startsWith('CANAL')) return 'Canal alterno';
  // El gestor trabaja para un canal: se muestra como canal, nunca como área aparte.
  if (v === 'G' || v.startsWith('GESTOR')) return 'Canal alterno';
  if (v === 'P' || v.startsWith('PRODUCTOR')) return 'Productor';
  if (v === 'DESCONOCIDA') return 'Sin dato de quién la emitió';
  return a || '—';
}

// ─── Exclusiones «No enviar» ───────────────────────────────────────────────

/**
 * Tipos de exclusión, en el orden del selector de Configuración. Ya no se crean exclusiones por
 * gestor (trabajan para los canales); las que existan siguen activas en Nexus y se muestran como
 * «Red del canal».
 */
export const OPCIONES_EXCLUSION: { value: AlcanceExclusion; label: string; plural: string }[] = [
  { value: 'asegurado', label: 'Asegurado', plural: 'Asegurados' },
  { value: 'poliza', label: 'Póliza', plural: 'Pólizas' },
  { value: 'canal', label: 'Canal', plural: 'Canales' },
  { value: 'intermediario', label: 'Intermediario', plural: 'Intermediarios' },
];

export function etiquetaAlcanceExclusion(a: string): string {
  if (a === 'gestor') return 'Red del canal';
  return OPCIONES_EXCLUSION.find((o) => o.value === a)?.label ?? (a || '—');
}

/**
 * Texto corto de por qué no se envía: «canal 45», «intermediario 80080».
 * En asegurado y póliza el valor es la misma fila: basta el alcance.
 */
export function textoNoEnviar(x?: Pick<ExclusionAplicada, 'alcance' | 'valor'> | null): string {
  if (!x) return '';
  const etiqueta = etiquetaAlcanceExclusion(x.alcance).toLowerCase();
  if (x.alcance === 'asegurado' || x.alcance === 'poliza' || !x.valor) return etiqueta;
  return `${etiqueta} ${x.valor}`;
}

// ─── Formato ───────────────────────────────────────────────────────────────

export function fechaCorta(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fechaHora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
}

export function numero(n: number): string {
  return new Intl.NumberFormat('es-VE').format(n);
}

/** Fecha compacta para tablas: "06/11 09:34". */
export function fechaBreve(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
