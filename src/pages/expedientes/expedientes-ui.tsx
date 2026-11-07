import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  EyeOff,
  FileWarning,
  Hourglass,
  Info,
  Loader2,
  ScanSearch,
  ShieldCheck,
  UserCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import type {
  Diagnostico,
  EstadoDocumental,
  EstadoPago,
  EstadoRequisito,
  ExpedientesError,
  ModoValidacion,
} from '@/lib/expedientes-api';
import { esActorIa, estadoVisual, etiquetaRequisito, type EstadoVisual } from './expedientes-format';

// ─── Chips de estado (siempre icono + texto, nunca solo color) ─────────────
// Un estado que no se conoce se muestra tal cual, en gris: nunca se convierte en otro.

const textoEstado = (e: string) => (e ? e.charAt(0).toUpperCase() + e.slice(1).replace(/_/g, ' ') : 'Sin dato');

export function ChipPago({ estado }: { estado: EstadoPago }) {
  if (estado === 'pendiente') {
    return (
      <span className="mx-chip mx-chip--pago-pendiente" title="Emitida como pendiente de cobro">
        <Wallet size={13} aria-hidden />
        Pendiente de pago
      </span>
    );
  }
  if (estado === 'pagada') {
    return (
      <span className="mx-chip mx-chip--pago-ok">
        <Wallet size={13} aria-hidden />
        Pagada
      </span>
    );
  }
  return (
    <span className="mx-chip mx-chip--neutral">
      <Wallet size={13} aria-hidden />
      Pago: {textoEstado(estado).toLowerCase()}
    </span>
  );
}

export function ChipDocumental({ estado }: { estado: EstadoDocumental }) {
  if (estado === 'completo') {
    return (
      <span className="mx-chip mx-chip--doc-ok">
        <ShieldCheck size={13} aria-hidden />
        Expediente completo
      </span>
    );
  }
  if (estado === 'incompleto') {
    return (
      <span className="mx-chip mx-chip--doc-pend">
        <FileWarning size={13} aria-hidden />
        Expediente incompleto
      </span>
    );
  }
  return (
    <span
      className="mx-chip mx-chip--neutral"
      title={estado === 'sin_informacion' ? 'La emisión no informó documentos' : undefined}
    >
      <CircleHelp size={13} aria-hidden />
      {estado === 'sin_informacion' ? 'Sin información' : textoEstado(estado)}
    </span>
  );
}

type MetaReq = {
  label: string;
  clase: string;
  Icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
};

/** Estado combinado (estado del requisito + diagnóstico de la IA). Ver `estadoVisual`. */
const REQ_META: Record<Exclude<EstadoVisual, 'otro'>, MetaReq> = {
  faltante: { label: 'No cargado', clase: 'mx-req--faltante', Icon: CircleDashed },
  validado_ia: { label: 'Validado por IA', clase: 'mx-req--validado', Icon: CheckCircle2 },
  validado_manual: { label: 'Validado manualmente', clase: 'mx-req--validado', Icon: UserCheck },
  errado: { label: 'Errado', clase: 'mx-req--observado', Icon: XCircle },
  ilegible: { label: 'Ilegible', clase: 'mx-req--ilegible', Icon: EyeOff },
  revisar: { label: 'Revisar', clase: 'mx-req--revisar', Icon: AlertTriangle },
  analizando: { label: 'Analizando…', clase: 'mx-req--recibido', Icon: ScanSearch },
  por_validar: { label: 'Por validar', clase: 'mx-req--recibido', Icon: Hourglass },
  observado: { label: 'Observado', clase: 'mx-req--observado', Icon: AlertTriangle },
  sin_informacion: { label: 'Sin información', clase: 'mx-req--sin-info', Icon: CircleHelp },
};

function metaRequisito(visual: EstadoVisual, estado: EstadoRequisito): MetaReq {
  if (visual === 'otro') {
    return { label: textoEstado(estado), clase: 'mx-req--sin-info', Icon: CircleHelp };
  }
  return REQ_META[visual];
}

/**
 * Chip de requisito: "Cédula · Validado por IA". Al pasar el cursor, el resumen de la IA
 * (o el motivo si se observó a mano).
 */
export function ChipRequisito({
  tipo,
  producto,
  estado,
  motivo,
  diagnostico,
  actor,
  modo,
  soloEstado = false,
}: {
  tipo: string;
  producto?: string | null;
  estado: EstadoRequisito;
  motivo?: string | null;
  diagnostico?: Diagnostico | null;
  actor?: string | null;
  modo?: ModoValidacion;
  soloEstado?: boolean;
}) {
  const visual = estadoVisual({ estado, diagnostico, actor }, modo);
  const meta = metaRequisito(visual, estado);
  const Icon = meta.Icon;
  const nombre = etiquetaRequisito(tipo, producto);
  const quien =
    visual === 'validado_manual' && actor && !esActorIa(actor) ? ` por ${actor}` : '';
  const detalle = diagnostico?.resumen || motivo;
  const titulo = detalle || quien ? `${nombre}: ${meta.label}${quien}${detalle ? ` — ${detalle}` : ''}` : undefined;
  return (
    <span className={`mx-req ${meta.clase}`} title={titulo}>
      <Icon size={12} aria-hidden />
      {soloEstado ? meta.label : (
        <>
          <span className="mx-req-tipo">{nombre}</span>
          <span className="mx-req-sep" aria-hidden>·</span>
          {meta.label}
        </>
      )}
    </span>
  );
}

// ─── Avisos ────────────────────────────────────────────────────────────────

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="mx-estado" role="status" aria-live="polite">
      <Loader2 size={26} className="animate-spin text-[#2E6DBF]" aria-hidden />
      <p>{texto}</p>
    </div>
  );
}

export function Vacio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="mx-estado">
      <CircleDashed size={30} className="text-[#B5B9C7]" aria-hidden />
      <p className="mx-estado-titulo">{titulo}</p>
      {texto && <p>{texto}</p>}
    </div>
  );
}

/**
 * Error de la API. `apagado` es un aviso informativo (módulo aún no activo), no un error.
 */
export function AvisoError({
  error,
  onReintentar,
}: {
  error: ExpedientesError;
  onReintentar?: () => void;
}) {
  if (error.kind === 'apagado') {
    return (
      <div className="mx-aviso mx-aviso--info" role="status">
        <Info size={18} aria-hidden className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">El monitor de expedientes aún no está activo</p>
          <p className="mt-0.5">
            Cuando se active en este ambiente, aquí verás el estado documental de las pólizas
            emitidas.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-aviso mx-aviso--error" role="alert">
      <AlertTriangle size={18} aria-hidden className="shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p>{error.message}</p>
        {onReintentar && error.kind !== 'sesion' && error.kind !== 'permiso' && (
          <button type="button" className="mx-link mt-1" onClick={onReintentar}>
            Intentar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}
