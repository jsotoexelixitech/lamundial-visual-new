/**
 * Monitor de expedientes Marketplace — cliente de Nexus (`/api/expedientes`).
 * Contrato: .antigravity/MONITOR-EXPEDIENTES-CONTRATO.md (v1, 7-nov-2026).
 *
 * - Rutas internas: sesión del portal (JWT de Nexus en sessionStorage), igual que /api/portal/*.
 * - Rutas públicas (/publico/:token): sin sesión; el enlace firmado es la única credencial.
 * - Si el módulo está apagado (EXPEDIENTES_ENABLED), Nexus responde 404 o 503: se informa como
 *   `apagado`, no como error.
 */
import axios, { type AxiosProgressEvent } from 'axios';
import { portalConfig } from './portal-config';
import { getToken } from './nexus-auth';

// ─── Tipos del contrato ────────────────────────────────────────────────────

// Un estado que Nexus agregue después se muestra tal cual: nunca se convierte a otro.
type OtroEstado = string & {};
export type EstadoPago = 'pagada' | 'pendiente' | OtroEstado;
/** sin_informacion: póliza anterior al monitor o sin datos de documentos; no es incompleto. */
export type EstadoDocumental = 'completo' | 'incompleto' | 'sin_informacion' | OtroEstado;
export type EstadoRequisitoConocido = 'faltante' | 'recibido' | 'observado' | 'validado' | 'sin_informacion';
export type EstadoRequisito = EstadoRequisitoConocido | OtroEstado;
/** cedula | licencia | certificado (configurable en Nexus: puede llegar otro tipo). */
export type TipoRequisito = string;
/** rcv | personas | patrimonial */
export type ProductoExpediente = string;
/** Área desde la metadata del SSO: C = canal alterno, G = gestor, P = productor. */
export type AreaExpediente = string;
export type ModoValidacion = 'manual' | 'automatica';
export type Agrupacion = 'poliza' | 'asegurado';

export interface Requisito {
  tipo: TipoRequisito;
  estado: EstadoRequisito;
  motivo?: string | null;
  /** Ruta o id del archivo en OCR (`documentos.<tipo>.ref` del registro de emisión). */
  ref?: string | null;
  /** Solo en el enlace público: producto de la póliza que pide este documento. */
  producto?: string | null;
}

export interface AseguradoResumen {
  documento?: string | null;
  nombre?: string | null;
  emailMasked?: string | null;
}

export interface ExpedienteItem {
  id: number | string;
  cnpoliza: string;
  cnrecibo?: string | null;
  producto: ProductoExpediente;
  /** canal | gestor | productor | desconocida */
  area: AreaExpediente;
  /** C | G | P (centidad); null si no hay dato del vendedor. Es el valor del filtro `area`. */
  areaCodigo?: string | null;
  vendedor?: string | null;
  asegurado: AseguradoResumen;
  estadoPago: EstadoPago;
  estadoDocumental: EstadoDocumental;
  requisitos: Requisito[];
  intentos: number;
  ultimoEnvio?: string | null;
  proximoEnvio?: string | null;
  noEnviar: boolean;
  /** Fase 2: true o cantidad de cambios contra Sis2000. */
  cambiosDetectados?: boolean | number | null;
  emitidaEn?: string | null;
}

export interface ExpedienteEvento {
  id?: number | string;
  tipo: string;
  actor?: string | null;
  motivo?: string | null;
  detalle?: unknown;
  requisito?: string | null;
  fecha?: string | null;
  createdAt?: string | null;
}

export interface ExpedienteNotificacion {
  id?: number | string;
  etapa?: number | string | null;
  canal?: string | null;
  estado: string;
  destinoMasked?: string | null;
  error?: string | null;
  fecha?: string | null;
  createdAt?: string | null;
}

export interface ExpedienteCambio {
  id?: number | string;
  campo: string;
  anterior?: unknown;
  nuevo?: unknown;
  origen?: string | null;
  fecha?: string | null;
  createdAt?: string | null;
}

export interface ExpedienteDetalle extends ExpedienteItem {
  eventos: ExpedienteEvento[];
  notificaciones: ExpedienteNotificacion[];
  cambios: ExpedienteCambio[];
  /** Opcional: si Nexus lo envía, evita pedir la configuración para saber el modo. */
  validacion?: ModoValidacion;
}

export interface PaginaExpedientes {
  items: ExpedienteItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Indicadores {
  total: number;
  completos: number;
  incompletos: number;
  sinInformacion: number;
  pagadas: number;
  pendientesPago: number;
  porValidar: number;
  observados: number;
  sinCorreo: number;
  noEnviar: number;
  intentos: number;
  recuperados: number;
  aseguradosUnicos: number;
}

export interface AlcanceConfig {
  canales: boolean;
  gestores: boolean;
  productores: boolean;
  /** Pólizas sin datos del vendedor (registros anteriores). */
  desconocida: boolean;
}

export interface ExpedientesConfig {
  alcance: AlcanceConfig;
  validacion: ModoValidacion;
  cadenciaDias: number[];
  destinatariosResumen: string[];
  horaDiaria: string;
  horaResumen: string;
  requisitosPorProducto: Record<string, string[]>;
}

export interface CambioConfig {
  id?: number | string;
  campo?: string | null;
  anterior?: unknown;
  nuevo?: unknown;
  actor?: string | null;
  motivo?: string | null;
  fecha?: string | null;
  createdAt?: string | null;
}

export interface ConfigConHistorial {
  config: ExpedientesConfig;
  cambios: CambioConfig[];
}

export type AlcanceExclusion = 'asegurado' | 'poliza';

export interface Exclusion {
  id: number | string;
  alcance: AlcanceExclusion;
  valor: string;
  motivo: string;
  actor?: string | null;
  createdAt?: string | null;
}

export interface FiltrosBandeja {
  estadoDoc: EstadoDocumental;
  estadoPago?: EstadoPago | '';
  area?: string;
  producto?: string;
  desde?: string;
  hasta?: string;
  /** No está en el contrato v1: Nexus puede ignorarlo. */
  vendedor?: string;
  q?: string;
  agrupar?: Agrupacion;
  page: number;
  pageSize: number;
}

export interface FiltrosIndicadores {
  area?: string;
  desde?: string;
  hasta?: string;
}

export interface ExpedientePublico {
  nombre: string | null;
  poliza: string | null;
  /** rcv | personas | patrimonial; solo para nombrar los documentos. */
  producto: string | null;
  requisitos: Requisito[];
}

// ─── Errores ───────────────────────────────────────────────────────────────

export type ExpedientesErrorKind =
  | 'apagado'
  | 'sesion'
  | 'permiso'
  | 'no_encontrado'
  | 'validacion'
  | 'archivo_grande'
  | 'enlace_vencido'
  | 'enlace_invalido'
  | 'red'
  | 'servidor';

export class ExpedientesError extends Error {
  readonly kind: ExpedientesErrorKind;
  readonly status?: number;

  constructor(kind: ExpedientesErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ExpedientesError';
    this.kind = kind;
    this.status = status;
  }
}

export function isExpedientesError(err: unknown): err is ExpedientesError {
  return err instanceof ExpedientesError;
}

/** Contexto de la llamada: cambia cómo se lee un 404. */
type Contexto = 'coleccion' | 'recurso' | 'publico';

const MENSAJES: Record<ExpedientesErrorKind, string> = {
  apagado: 'El monitor de expedientes todavía no está activo en este ambiente.',
  sesion: 'Tu sesión venció. Vuelve a entrar desde el menú de La Mundial.',
  permiso: 'No tienes permiso para esta acción.',
  no_encontrado: 'No encontramos este expediente.',
  validacion: 'Revisa los datos e intenta de nuevo.',
  archivo_grande: 'El archivo supera el tamaño permitido (25 MB).',
  enlace_vencido: 'Este enlace ya venció.',
  enlace_invalido: 'Este enlace no es válido.',
  red: 'No hay conexión con el servicio. Revisa tu conexión e intenta de nuevo.',
  servidor: 'El servicio no respondió como esperábamos. Intenta de nuevo en unos minutos.',
};

function textoDe(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as { message?: unknown; error?: unknown; code?: unknown };
  if (typeof b.message === 'string') return b.message;
  if (typeof b.error === 'string') return b.error;
  return '';
}

function codigoDe(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const b = body as { code?: unknown; error?: unknown };
  if (typeof b.code === 'string') return b.code.toLowerCase();
  if (typeof b.error === 'string') return b.error.toLowerCase();
  return '';
}

function toExpedientesError(err: unknown, ctx: Contexto): ExpedientesError {
  if (err instanceof ExpedientesError) return err;
  if (!axios.isAxiosError(err)) {
    return new ExpedientesError('servidor', MENSAJES.servidor);
  }
  const status = err.response?.status;
  const body = err.response?.data;
  const msg = textoDe(body);
  const code = codigoDe(body);
  const pista = `${code} ${msg}`.toLowerCase();

  if (!err.response) return new ExpedientesError('red', MENSAJES.red);

  if (ctx === 'publico') {
    if (status === 503) return new ExpedientesError('apagado', MENSAJES.apagado, status);
    if (status === 410 || /venc|expir/.test(pista)) {
      return new ExpedientesError('enlace_vencido', MENSAJES.enlace_vencido, status);
    }
    if (status === 413) return new ExpedientesError('archivo_grande', MENSAJES.archivo_grande, status);
    if (status === 400 || status === 415 || status === 422) {
      return new ExpedientesError('validacion', msg || MENSAJES.validacion, status);
    }
    if (status === 401 || status === 403 || status === 404) {
      return new ExpedientesError('enlace_invalido', MENSAJES.enlace_invalido, status);
    }
    return new ExpedientesError('servidor', MENSAJES.servidor, status);
  }

  if (status === 503) return new ExpedientesError('apagado', MENSAJES.apagado, status);
  if (status === 404) {
    // Módulo apagado = 404 "Ruta no encontrada" en las rutas internas; en un recurso un 404
    // con otro mensaje es "no existe".
    if (
      ctx === 'coleccion' ||
      /ruta no encontrada|deshabilit|apagad|disabled|not enabled|cannot (get|post|put|delete)/.test(pista)
    ) {
      return new ExpedientesError('apagado', MENSAJES.apagado, status);
    }
    return new ExpedientesError('no_encontrado', msg || MENSAJES.no_encontrado, status);
  }
  if (status === 401) return new ExpedientesError('sesion', MENSAJES.sesion, status);
  if (status === 403) return new ExpedientesError('permiso', msg || MENSAJES.permiso, status);
  if (status === 413) return new ExpedientesError('archivo_grande', MENSAJES.archivo_grande, status);
  if (status === 400 || status === 409 || status === 415 || status === 422) {
    return new ExpedientesError('validacion', msg || MENSAJES.validacion, status);
  }
  return new ExpedientesError('servidor', msg || MENSAJES.servidor, status);
}

// ─── Cliente HTTP ──────────────────────────────────────────────────────────

const BASE = '/api/expedientes';
const TIMEOUT_MS = 30_000;
const TIMEOUT_UPLOAD_MS = 120_000;

const api = axios.create({ baseURL: portalConfig.nexusApiUrl, timeout: TIMEOUT_MS });
/** Sin cabecera de sesión: la página pública nunca usa el JWT del portal. */
const apiPublica = axios.create({ baseURL: portalConfig.nexusApiUrl, timeout: TIMEOUT_MS });

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) throw new ExpedientesError('sesion', MENSAJES.sesion, 401);
  return { Authorization: `Bearer ${token}` };
}

/** Nexus responde `{ status, data }` (o `{ success, data }` en /api/portal): devuelve `data`. */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    const b = body as { status?: unknown; success?: unknown; data: T; message?: unknown };
    if (b.success === false || b.status === 'error' || b.status === 'fail') {
      throw new ExpedientesError(
        'servidor',
        typeof b.message === 'string' ? b.message : MENSAJES.servidor,
      );
    }
    if ('status' in b || 'success' in b) return b.data;
  }
  return body as T;
}

function limpiarParams(params: object): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = typeof v === 'number' ? v : String(v).trim();
    if (out[k] === '') delete out[k];
  }
  return out;
}

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function texto(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

/** Estado tal como llega (en minúsculas). Sin dato = sin_informacion; nunca faltante ni incompleto. */
function estadoDe(v: unknown): string {
  return texto(v)?.toLowerCase() ?? 'sin_informacion';
}

/** `ref` del archivo: en el requisito (ref/url/file.url) o en el mapa `documentos` del detalle. */
function refDe(r: Record<string, unknown>, documentos?: Record<string, unknown>): string | null {
  const archivo = (r.file ?? r.archivo) as { url?: unknown } | undefined;
  const doc = documentos?.[String(r.tipo ?? '')] as
    | { ref?: unknown; url?: unknown; file?: { url?: unknown } }
    | undefined;
  return (
    texto(r.ref) ??
    texto(r.url) ??
    texto(archivo?.url) ??
    texto(doc?.ref) ??
    texto(doc?.url) ??
    texto(doc?.file?.url)
  );
}

function normalizarRequisitos(raw: unknown, documentos?: unknown): Requisito[] {
  if (!Array.isArray(raw)) return [];
  const docs =
    documentos && typeof documentos === 'object' ? (documentos as Record<string, unknown>) : undefined;
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({
      tipo: String(r.tipo ?? ''),
      estado: estadoDe(r.estado),
      motivo: typeof r.motivo === 'string' ? r.motivo : null,
      ref: refDe(r, docs),
    }));
}

function normalizarItem(raw: Record<string, unknown>): ExpedienteItem {
  const aseg = (raw.asegurado && typeof raw.asegurado === 'object'
    ? raw.asegurado
    : {}) as AseguradoResumen;
  const estadoPago = texto(raw.estadoPago)?.toLowerCase() ?? '';
  const estadoDocumental = estadoDe(raw.estadoDocumental);
  return {
    id: (raw.id as number | string) ?? String(raw.cnpoliza ?? ''),
    cnpoliza: String(raw.cnpoliza ?? ''),
    cnrecibo: (raw.cnrecibo as string | null | undefined) ?? null,
    producto: String(raw.producto ?? ''),
    area: String(raw.area ?? ''),
    areaCodigo: texto(raw.areaCodigo)?.toUpperCase() ?? null,
    vendedor: (raw.vendedor as string | null | undefined) ?? null,
    asegurado: {
      documento: aseg.documento ?? null,
      nombre: aseg.nombre ?? null,
      emailMasked: aseg.emailMasked ?? null,
    },
    estadoPago,
    estadoDocumental,
    requisitos: normalizarRequisitos(raw.requisitos, raw.documentos),
    intentos: num(raw.intentos),
    ultimoEnvio: (raw.ultimoEnvio as string | null | undefined) ?? null,
    proximoEnvio: (raw.proximoEnvio as string | null | undefined) ?? null,
    noEnviar: Boolean(raw.noEnviar),
    cambiosDetectados: (raw.cambiosDetectados as boolean | number | null | undefined) ?? null,
    emitidaEn: (raw.emitidaEn as string | null | undefined) ?? null,
  };
}

function arreglo<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

// ─── Monitor (sesión del portal) ───────────────────────────────────────────

export async function listarExpedientes(f: FiltrosBandeja): Promise<PaginaExpedientes> {
  try {
    const { data } = await api.get(BASE, {
      headers: authHeaders(),
      params: limpiarParams(f),
    });
    const raw = unwrap<unknown>(data);
    if (Array.isArray(raw)) {
      return {
        items: raw.map((r) => normalizarItem(r as Record<string, unknown>)),
        total: raw.length,
        page: f.page,
        pageSize: f.pageSize,
      };
    }
    const obj = (raw ?? {}) as Record<string, unknown>;
    const lista = arreglo<Record<string, unknown>>(obj.items ?? obj.rows ?? obj.data);
    const meta = (obj.meta ?? obj.pagination ?? {}) as Record<string, unknown>;
    return {
      items: lista.map(normalizarItem),
      total: num(obj.total ?? obj.count ?? meta.total, lista.length),
      page: num(obj.page ?? meta.page, f.page),
      pageSize: num(obj.pageSize ?? meta.pageSize, f.pageSize),
    };
  } catch (err) {
    throw toExpedientesError(err, 'coleccion');
  }
}

export async function obtenerIndicadores(f: FiltrosIndicadores): Promise<Indicadores> {
  try {
    const { data } = await api.get(`${BASE}/indicadores`, {
      headers: authHeaders(),
      params: limpiarParams(f),
    });
    const r = (unwrap<Record<string, unknown>>(data) ?? {}) as Record<string, unknown>;
    return {
      total: num(r.total),
      completos: num(r.completos),
      incompletos: num(r.incompletos),
      sinInformacion: num(r.sinInformacion),
      pagadas: num(r.pagadas),
      pendientesPago: num(r.pendientesPago),
      porValidar: num(r.porValidar),
      observados: num(r.observados),
      sinCorreo: num(r.sinCorreo),
      noEnviar: num(r.noEnviar),
      intentos: num(r.intentos),
      recuperados: num(r.recuperados),
      aseguradosUnicos: num(r.aseguradosUnicos),
    };
  } catch (err) {
    throw toExpedientesError(err, 'coleccion');
  }
}

export async function obtenerExpediente(id: number | string): Promise<ExpedienteDetalle> {
  try {
    const { data } = await api.get(`${BASE}/${encodeURIComponent(String(id))}`, {
      headers: authHeaders(),
    });
    const r = (unwrap<Record<string, unknown>>(data) ?? {}) as Record<string, unknown>;
    const validacion = String(r.validacion ?? '').toLowerCase();
    return {
      ...normalizarItem(r),
      eventos: arreglo<ExpedienteEvento>(r.eventos),
      notificaciones: arreglo<ExpedienteNotificacion>(r.notificaciones),
      cambios: arreglo<ExpedienteCambio>(r.cambios),
      validacion:
        validacion === 'manual' || validacion === 'automatica'
          ? (validacion as ModoValidacion)
          : undefined,
    };
  } catch (err) {
    throw toExpedientesError(err, 'recurso');
  }
}

export async function validarRequisito(id: number | string, tipo: string): Promise<void> {
  try {
    await api.post(
      `${BASE}/${encodeURIComponent(String(id))}/requisitos/${encodeURIComponent(tipo)}/validar`,
      {},
      { headers: authHeaders() },
    );
  } catch (err) {
    throw toExpedientesError(err, 'recurso');
  }
}

export async function observarRequisito(
  id: number | string,
  tipo: string,
  motivo: string,
): Promise<void> {
  try {
    await api.post(
      `${BASE}/${encodeURIComponent(String(id))}/requisitos/${encodeURIComponent(tipo)}/observar`,
      { motivo: motivo.trim() },
      { headers: authHeaders() },
    );
  } catch (err) {
    throw toExpedientesError(err, 'recurso');
  }
}

// ─── Configuración y exclusiones (administrador) ───────────────────────────

const CONFIG_POR_DEFECTO: ExpedientesConfig = {
  alcance: { canales: true, gestores: true, productores: false, desconocida: true },
  validacion: 'manual',
  cadenciaDias: [0, 3, 7, 14],
  destinatariosResumen: [],
  horaDiaria: '08:00',
  horaResumen: '23:00',
  requisitosPorProducto: {
    rcv: ['cedula', 'licencia', 'certificado'],
    personas: ['cedula'],
    patrimonial: ['cedula'],
  },
};

function normalizarConfig(raw: Record<string, unknown>): ExpedientesConfig {
  const alc = (raw.alcance ?? {}) as Partial<AlcanceConfig>;
  const val = String(raw.validacion ?? '').toLowerCase();
  return {
    alcance: {
      canales: alc.canales ?? CONFIG_POR_DEFECTO.alcance.canales,
      gestores: alc.gestores ?? CONFIG_POR_DEFECTO.alcance.gestores,
      productores: alc.productores ?? CONFIG_POR_DEFECTO.alcance.productores,
      desconocida: alc.desconocida ?? CONFIG_POR_DEFECTO.alcance.desconocida,
    },
    validacion: val === 'automatica' ? 'automatica' : 'manual',
    cadenciaDias: Array.isArray(raw.cadenciaDias)
      ? raw.cadenciaDias.map((d) => num(d)).filter((d) => d >= 0)
      : CONFIG_POR_DEFECTO.cadenciaDias,
    destinatariosResumen: Array.isArray(raw.destinatariosResumen)
      ? raw.destinatariosResumen.map(String)
      : [],
    horaDiaria: typeof raw.horaDiaria === 'string' ? raw.horaDiaria : CONFIG_POR_DEFECTO.horaDiaria,
    horaResumen:
      typeof raw.horaResumen === 'string' ? raw.horaResumen : CONFIG_POR_DEFECTO.horaResumen,
    requisitosPorProducto:
      raw.requisitosPorProducto && typeof raw.requisitosPorProducto === 'object'
        ? (raw.requisitosPorProducto as Record<string, string[]>)
        : CONFIG_POR_DEFECTO.requisitosPorProducto,
  };
}

export async function obtenerConfig(): Promise<ConfigConHistorial> {
  try {
    const { data } = await api.get(`${BASE}/config`, { headers: authHeaders() });
    const r = (unwrap<Record<string, unknown>>(data) ?? {}) as Record<string, unknown>;
    // Acepta `{ ...config, cambios }` o `{ config, cambios|historial }`.
    const cfg = (r.config && typeof r.config === 'object' ? r.config : r) as Record<string, unknown>;
    return {
      config: normalizarConfig(cfg),
      cambios: arreglo<CambioConfig>(r.cambios ?? r.historial ?? cfg.cambios ?? cfg.historial),
    };
  } catch (err) {
    throw toExpedientesError(err, 'coleccion');
  }
}

export async function guardarConfig(config: ExpedientesConfig, motivo: string): Promise<void> {
  try {
    await api.put(
      `${BASE}/config`,
      { ...config, motivo: motivo.trim() },
      { headers: authHeaders() },
    );
  } catch (err) {
    throw toExpedientesError(err, 'coleccion');
  }
}

export async function listarExclusiones(): Promise<Exclusion[]> {
  try {
    const { data } = await api.get(`${BASE}/exclusiones`, { headers: authHeaders() });
    const raw = unwrap<unknown>(data);
    const lista = Array.isArray(raw)
      ? raw
      : arreglo<unknown>((raw as Record<string, unknown> | null)?.items);
    return lista
      .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
      .map((e) => ({
        id: e.id as number | string,
        alcance: e.alcance === 'poliza' ? 'poliza' : 'asegurado',
        valor: String(e.valor ?? e.documento ?? e.cnpoliza ?? ''),
        motivo: String(e.motivo ?? ''),
        actor: (e.actor as string | null | undefined) ?? null,
        createdAt: (e.createdAt as string | null | undefined) ?? (e.fecha as string | null) ?? null,
      }));
  } catch (err) {
    throw toExpedientesError(err, 'coleccion');
  }
}

export async function crearExclusion(
  alcance: AlcanceExclusion,
  valor: string,
  motivo: string,
): Promise<void> {
  const v = valor.trim();
  try {
    await api.post(
      `${BASE}/exclusiones`,
      {
        alcance,
        valor: v,
        // Alias por si Nexus nombra el campo según el alcance.
        ...(alcance === 'poliza' ? { cnpoliza: v } : { documento: v }),
        motivo: motivo.trim(),
      },
      { headers: authHeaders() },
    );
  } catch (err) {
    throw toExpedientesError(err, 'coleccion');
  }
}

export async function eliminarExclusion(id: number | string, motivo: string): Promise<void> {
  try {
    await api.delete(`${BASE}/exclusiones/${encodeURIComponent(String(id))}`, {
      headers: authHeaders(),
      params: { motivo: motivo.trim() },
      data: { motivo: motivo.trim() },
    });
  } catch (err) {
    throw toExpedientesError(err, 'recurso');
  }
}

// ─── Público (enlace firmado, sin sesión) ──────────────────────────────────

export async function obtenerExpedientePublico(token: string): Promise<ExpedientePublico> {
  try {
    const { data } = await apiPublica.get(`${BASE}/publico/${encodeURIComponent(token)}`);
    const r = (unwrap<Record<string, unknown>>(data) ?? {}) as Record<string, unknown>;
    const aseg = (r.asegurado ?? {}) as { nombre?: string };
    // El enlace puede cubrir varias pólizas del asegurado: cada documento toma el producto
    // de la póliza que lo pide (para nombrarlo bien: certificado de circulación en RCV).
    const polizas = arreglo<{ producto?: unknown; requisitos?: unknown }>(r.polizas);
    const productoDe = (tipo: string): string | null => {
      const p = polizas.find((x) =>
        arreglo<{ tipo?: unknown }>(x.requisitos).some((q) => q.tipo === tipo),
      );
      return texto(p?.producto)?.toLowerCase() ?? null;
    };
    const requisitos = normalizarRequisitos(r.requisitos).map((q) => ({
      ...q,
      producto: productoDe(q.tipo),
    }));
    // Si Nexus no envía el producto: la licencia solo se exige en RCV.
    const producto =
      texto(r.producto)?.toLowerCase() ??
      (requisitos.some((q) => q.tipo.toLowerCase() === 'licencia') ? 'rcv' : null);
    return {
      nombre: (r.nombre as string | undefined) ?? aseg.nombre ?? null,
      producto,
      poliza:
        (r.polizaMasked as string | undefined) ??
        (r.poliza as string | undefined) ??
        (r.cnpolizaMasked as string | undefined) ??
        (r.cnpoliza as string | undefined) ??
        null,
      requisitos,
    };
  } catch (err) {
    throw toExpedientesError(err, 'publico');
  }
}

export async function subirDocumentoPublico(
  token: string,
  tipo: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const fd = new FormData();
  fd.append('tipo', tipo);
  fd.append('file', file);
  try {
    await apiPublica.post(`${BASE}/publico/${encodeURIComponent(token)}/upload`, fd, {
      timeout: TIMEOUT_UPLOAD_MS,
      onUploadProgress: progreso(onProgress),
    });
  } catch (err) {
    throw toExpedientesError(err, 'publico');
  }
}

function progreso(cb?: (pct: number) => void) {
  if (!cb) return undefined;
  return (e: AxiosProgressEvent) => {
    if (e.total) cb(Math.min(100, Math.round((e.loaded / e.total) * 100)));
  };
}

// ─── Archivos ──────────────────────────────────────────────────────────────

export const MAX_ARCHIVO_MB = 25;
const MAX_ARCHIVO_BYTES = MAX_ARCHIVO_MB * 1024 * 1024;
const EXTENSIONES = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'pdf'];
const MIMES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'];

/** Valor para `<input type="file" accept>`. HEIC a veces llega sin MIME: se incluye la extensión. */
export const ACCEPT_ARCHIVOS =
  'image/jpeg,image/png,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.heic,.heif,.pdf';

/** Devuelve el motivo de rechazo o null si el archivo se puede enviar. */
export function validarArchivo(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const tipoOk = MIMES.includes(file.type) || EXTENSIONES.includes(ext);
  if (!tipoOk) return 'Formato no admitido. Usa una foto JPG, PNG o HEIC, o un PDF.';
  if (file.size === 0) return 'El archivo está vacío. Intenta con otro.';
  if (file.size > MAX_ARCHIVO_BYTES) {
    return `El archivo pesa más de ${MAX_ARCHIVO_MB} MB. Intenta con una foto o un PDF más liviano.`;
  }
  return null;
}
