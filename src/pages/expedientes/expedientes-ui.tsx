import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  EyeOff,
  FileWarning,
  Hourglass,
  Inbox,
  Info,
  Loader2,
  PencilLine,
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
import {
  contarRequisitos,
  esActorIa,
  estadoVisual,
  etiquetaRequisito,
  type EstadoVisual,
} from './expedientes-format';

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
  datos_cambiados: { label: 'Datos cambiados', clase: 'mx-req--modificado', Icon: PencilLine },
  errado: { label: 'Errado', clase: 'mx-req--errado', Icon: XCircle },
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

/**
 * v1.3: la póliza se emitió con datos distintos a los que el OCR leyó del documento
 * (se cambiaron a mano en el formulario). Distinto de «Errado» (documento que no coincide).
 */
export function ChipDatosCambiados({ requisitos }: { requisitos: { diagnostico?: Diagnostico | null }[] }) {
  const resumen = requisitos.find((r) => r.diagnostico?.resultado === 'datos_modificados')?.diagnostico
    ?.resumen;
  return (
    <span
      className="mx-chip mx-chip--modificado"
      title={resumen ?? 'Datos cambiados en el formulario respecto al documento'}
    >
      <PencilLine size={13} aria-hidden />
      Datos cambiados
    </span>
  );
}

/**
 * Una línea con lo que falta y lo que está mal: «1 errado · 1 sin cargar · 1 en análisis».
 * Solo cuenta; no decide estados. «Validados» se muestra como «N de M validados».
 */
export function LineaPendiente({
  requisitos,
  modo,
}: {
  requisitos: { estado: EstadoRequisito; diagnostico?: Diagnostico | null; actor?: string | null }[];
  modo?: ModoValidacion;
}) {
  if (requisitos.length === 0) return null;
  const c = contarRequisitos(requisitos, modo);
  const partes: [string, string][] = [];
  if (c.conProblema) partes.push(['is-rojo', `${c.conProblema} ${c.conProblema === 1 ? 'errado' : 'errados'}`]);
  if (c.datosCambiados) partes.push(['is-violeta', `${c.datosCambiados} con datos cambiados`]);
  if (c.porRevisar) partes.push(['is-ambar', `${c.porRevisar} por revisar`]);
  if (c.sinCargar) partes.push(['is-gris', `${c.sinCargar} sin cargar`]);
  if (c.enCurso) partes.push(['is-azul', `${c.enCurso} ${modo === 'manual' ? 'por validar' : 'en análisis'}`]);
  partes.push(['is-verde', `${c.validados} de ${c.total} validados`]);
  return (
    <p className="mx-pendiente">
      {partes.map(([clase, texto]) => (
        <span key={clase} className={clase}>
          {texto}
        </span>
      ))}
    </p>
  );
}

/** Leyenda plegable con los colores de estado de los documentos. */
export function LeyendaEstados() {
  const items: [string, string][] = [
    ['mx-req--faltante', 'No cargado'],
    ['mx-req--recibido', 'Recibido, en análisis o por validar'],
    ['mx-req--observado', 'Observado o revisar'],
    ['mx-req--errado', 'Errado o ilegible'],
    ['mx-req--modificado', 'Datos cambiados'],
    ['mx-req--validado', 'Validado'],
  ];
  return (
    <details className="mx-leyenda">
      <summary>
        <Info size={14} aria-hidden />
        ¿Qué significa cada color?
      </summary>
      <ul>
        {items.map(([clase, texto]) => (
          <li key={clase} className={`mx-req ${clase}`}>
            {texto}
          </li>
        ))}
      </ul>
    </details>
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

/** Carga inicial: siluetas de tarjetas en lugar de un spinner suelto. */
export function Esqueleto({ filas = 3, texto = 'Cargando…' }: { filas?: number; texto?: string }) {
  return (
    <div className="mx-esqueleto" role="status" aria-live="polite">
      <span className="sr-only">{texto}</span>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="mx-esqueleto-fila" aria-hidden>
          <span className="mx-esqueleto-linea" style={{ width: '38%' }} />
          <span className="mx-esqueleto-linea" style={{ width: '62%' }} />
          <span className="mx-esqueleto-linea" style={{ width: '84%' }} />
        </div>
      ))}
    </div>
  );
}

/** Barra fina mientras se vuelve a consultar con datos ya en pantalla. */
export function Actualizando() {
  return (
    <div className="mx-actualizando" role="status" aria-label="Actualizando">
      <span />
    </div>
  );
}

export function Vacio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="mx-estado">
      <span className="mx-estado-icono" aria-hidden>
        <Inbox size={26} />
      </span>
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
