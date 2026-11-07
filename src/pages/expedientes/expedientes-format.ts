// Etiquetas y formato del monitor de expedientes (sin componentes).
import { portalConfig } from '@/lib/portal-config';
import type {
  AlcanceExclusion,
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

/** Nombre corto con artículo para el asegurado: «La cédula», «El RIF»… (femenino = «Cárgala»). */
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
  const cargalo = doc.fem ? 'Cárgala' : 'Cárgalo';
  if (resultado === 'datos_modificados') {
    // v1.3: el documento está bien; lo que se revisa son los datos de la póliza (sin mostrarlos).
    return 'Estamos revisando los datos de tu póliza con este documento. No tienes que enviarlo de nuevo.';
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
  const path = trimmed.startsWith('/')
    ? conPrefijoOcr(trimmed)
    : `/ocr/files/${trimmed.split('/').map(encodeURIComponent).join('/')}`;
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

/** Valores de `area` del contrato: centidad del SSO (C, G, P). */
export const OPCIONES_AREA = [
  { value: 'C', label: 'Canales alternos' },
  { value: 'G', label: 'Gestores' },
  { value: 'P', label: 'Productores' },
];

export function etiquetaArea(a: string): string {
  const v = a.trim().toUpperCase();
  if (v === 'C' || v.startsWith('CANAL')) return 'Canal alterno';
  if (v === 'G' || v.startsWith('GESTOR')) return 'Gestor';
  if (v === 'P' || v.startsWith('PRODUCTOR')) return 'Productor';
  if (v === 'DESCONOCIDA') return 'Sin dato del vendedor';
  return a || '—';
}

// ─── Exclusiones «No enviar» ───────────────────────────────────────────────

/** Tipos de exclusión, en el orden del selector de Configuración. */
export const OPCIONES_EXCLUSION: { value: AlcanceExclusion; label: string; plural: string }[] = [
  { value: 'asegurado', label: 'Asegurado', plural: 'Asegurados' },
  { value: 'poliza', label: 'Póliza', plural: 'Pólizas' },
  { value: 'canal', label: 'Canal', plural: 'Canales' },
  { value: 'gestor', label: 'Gestor', plural: 'Gestores' },
  { value: 'intermediario', label: 'Intermediario', plural: 'Intermediarios' },
];

export function etiquetaAlcanceExclusion(a: string): string {
  return OPCIONES_EXCLUSION.find((o) => o.value === a)?.label ?? (a || '—');
}

/**
 * Texto corto de por qué no se envía: «canal 45», «gestor 12», «intermediario 80080».
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
