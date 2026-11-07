// Etiquetas y formato del monitor de expedientes (sin componentes).
import { portalConfig } from '@/lib/portal-config';

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

export function etiquetaRequisito(tipo: string): string {
  const t = tipo.toLowerCase();
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

  const path = conPrefijoOcr(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
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
  return a || '—';
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
