import axios from 'axios';
import { portalConfig } from './portal-config';

const api = axios.create({ baseURL: portalConfig.nexusApiUrl });

// ─── Tipos ────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    empresaId: number;
    empresa?: string;
    roleId: number;
  };
}

export interface SsoDelegatePayload {
  target: 'ocr' | 'emision' | 'formulario' | 'pagos';
  cproductor?: string;
  cusuario?: string;
  cramo?: number;
  ccanalalt_in?: string;
  cscanalalt_in?: number;
  cgestor_in?: string;
  product?: string;
  centidad?: string;
  citem?: string;
  cproducto?: string;
}

export interface SsoDelegateResponse {
  success: boolean;
  redirect_url: string;
  empresa: string;
  modulo: string;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

/** Login con credenciales Nexus. Guarda token en sessionStorage. */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', payload);
  sessionStorage.setItem('portal_token', data.token);
  sessionStorage.setItem('portal_user', JSON.stringify(data.user));
  return data;
}

/** Cierra sesión — limpia sessionStorage. */
export function logout(): void {
  sessionStorage.removeItem('portal_token');
  sessionStorage.removeItem('portal_user');
}

/** Devuelve el usuario actual desde sessionStorage. */
export function getCurrentUser(): LoginResponse['user'] | null {
  const raw = sessionStorage.getItem('portal_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Devuelve el token actual. */
export function getToken(): string | null {
  return sessionStorage.getItem('portal_token');
}

// ─── SSO Delegate ─────────────────────────────────────────────────────────

/**
 * Llama a POST /api/auth/sso-delegate con x-api-key.
 * La API Key NUNCA se persiste — solo se usa en esta llamada.
 */
export async function ssoDelegate(
  apiKey: string,
  payload: SsoDelegatePayload,
): Promise<SsoDelegateResponse> {
  const { data } = await api.post<SsoDelegateResponse>('/api/auth/sso-delegate', payload, {
    headers: { 'x-api-key': apiKey },
  });
  return data;
}

// ─── Portal audit (nexus-api endpoint nuevo) ──────────────────────────────

export interface AuditPayload {
  accion: string;
  producto?: string;
  detalle?: Record<string, unknown>;
}

export async function registerAudit(payload: AuditPayload): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    await api.post('/api/portal/audit', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // audit no bloquea el flujo
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const token = getToken();
  if (!token) return [];
  const { data } = await api.get<AuditLog[]>('/api/portal/audit', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export interface AuditLog {
  id: number;
  accion: string;
  producto: string | null;
  detalle: Record<string, unknown> | null;
  createdAt: string;
}
