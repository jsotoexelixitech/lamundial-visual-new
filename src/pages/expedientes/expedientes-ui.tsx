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
type ReqResumen = {
  tipo: string;
  estado: EstadoRequisito;
  diagnostico?: Diagnostico | null;
  actor?: string | null;
};

/** Orden de los tramos de la barra: lo validado a la izquierda, lo que falta al final. */
const ORDEN_BARRA: Record<EstadoVisual, number> = {
  validado_ia: 0,
  validado_manual: 0,
  analizando: 1,
  por_validar: 1,
  revisar: 2,
  observado: 2,
  datos_cambiados: 3,
  errado: 4,
  ilegible: 4,
  sin_informacion: 5,
  otro: 5,
  faltante: 6,
};

/**
 * Barra de documentos del expediente: un tramo por requisito, del color de su estado, con
 * «N de M validados» al lado y, debajo, lo que falta y lo que está mal.
 * El color nunca va solo: cada tramo tiene su nombre y estado (title y aria-label), los errados
 * llevan rayas y lo no cargado va vacío con borde punteado. Solo cuenta; no decide estados.
 */
export function LineaPendiente({
  requisitos,
  modo,
  producto,
}: {
  requisitos: ReqResumen[];
  modo?: ModoValidacion;
  producto?: string | null;
}) {
  if (requisitos.length === 0) return null;
  const c = contarRequisitos(requisitos, modo);
  const partes: [string, string][] = [];
  if (c.conProblema) partes.push(['is-rojo', `${c.conProblema} ${c.conProblema === 1 ? 'errado' : 'errados'}`]);
  if (c.datosCambiados) partes.push(['is-violeta', `${c.datosCambiados} con datos cambiados`]);
  if (c.porRevisar) partes.push(['is-ambar', `${c.porRevisar} por revisar`]);
  if (c.sinCargar) partes.push(['is-gris', `${c.sinCargar} sin cargar`]);
  if (c.enCurso) partes.push(['is-azul', `${c.enCurso} ${modo === 'manual' ? 'por validar' : 'en análisis'}`]);

  const tramos = requisitos
    .map((r, i) => {
      const visual = estadoVisual(r, modo);
      return { r, i, visual, o: ORDEN_BARRA[visual] };
    })
    .sort((a, b) => a.o - b.o || a.i - b.i);
  const descripcion = tramos
    .map(({ r, visual }) => `${etiquetaRequisito(r.tipo, producto)}: ${metaRequisito(visual, r.estado).label}`)
    .join('; ');
  const completo = c.validados === c.total;

  return (
    <div className="mx-docbar">
      <div className="mx-docbar-fila">
        <div className="mx-docbar-barra" role="img" aria-label={`Documentos: ${descripcion}`}>
          {tramos.map(({ r, visual }) => (
            <span
              key={`${r.tipo}-${visual}`}
              className={`mx-docbar-tramo is-${visual}`}
              title={`${etiquetaRequisito(r.tipo, producto)}: ${metaRequisito(visual, r.estado).label}`}
            />
          ))}
        </div>
        <span className={`mx-docbar-texto ${completo ? 'is-completo' : ''}`}>
          <strong className="mx-num">
            {c.validados} de {c.total}
          </strong>{' '}
          validados
        </span>
      </div>
      {partes.length > 0 && (
        <p className="mx-pendiente">
          {partes.map(([clase, texto]) => (
            <span key={clase} className={clase}>
              {texto}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** Leyenda plegable con los colores de estado de los documentos. */
export function LeyendaEstados() {
  const items: [string, string, EstadoVisual][] = [
    ['mx-req--validado', 'Validado', 'validado_ia'],
    ['mx-req--recibido', 'Recibido, en análisis o por validar', 'analizando'],
    ['mx-req--observado', 'Observado o revisar', 'observado'],
    ['mx-req--modificado', 'Datos cambiados', 'datos_cambiados'],
    ['mx-req--errado', 'Errado o ilegible', 'errado'],
    ['mx-req--faltante', 'No cargado', 'faltante'],
  ];
  return (
    <details className="mx-leyenda">
      <summary>
        <Info size={14} aria-hidden />
        ¿Qué significa cada color?
      </summary>
      <ul>
        {items.map(([clase, texto, visual]) => (
          <li key={clase} className={`mx-req ${clase}`}>
            <span className={`mx-docbar-tramo mx-leyenda-muestra is-${visual}`} aria-hidden />
            {texto}
          </li>
        ))}
      </ul>
    </details>
  );
}

// ─── Gráficos sencillos (CSS, sin librerías) ───────────────────────────────
// Cada gráfico muestra sus números como texto: el color nunca es la única pista.

export type TonoGrafico = 'gris' | 'azul' | 'ambar' | 'rojo' | 'violeta' | 'verde' | 'tinta';

const pctTexto = (v: number, total: number) =>
  total > 0 ? `${Math.floor((v / total) * 100)} %` : '0 %';

/**
 * Barra apilada con leyenda debajo (muestra, nombre, número y porcentaje).
 * Los porcentajes se redondean hacia abajo para no aparentar 100 % si falta algo.
 */
export function BarraApilada({
  titulo,
  segmentos,
  tituloOculto = false,
}: {
  titulo: string;
  segmentos: { label: string; valor: number; tono: TonoGrafico }[];
  /** El título queda solo para lectores de pantalla (cuando ya hay uno visible al lado). */
  tituloOculto?: boolean;
}) {
  const total = segmentos.reduce((s, x) => s + Math.max(0, x.valor), 0);
  return (
    <figure className="mx-graf">
      <figcaption className={tituloOculto ? 'sr-only' : 'mx-graf-titulo'}>{titulo}</figcaption>
      <div
        className="mx-apilada"
        role="img"
        aria-label={`${titulo}: ${segmentos.map((s) => `${s.label} ${s.valor}`).join(', ')}`}
      >
        {total === 0 ? (
          <span className="mx-apilada-vacia" />
        ) : (
          segmentos
            .filter((s) => s.valor > 0)
            .map((s) => (
              <span
                key={s.label}
                className={`mx-apilada-seg is-${s.tono}`}
                style={{ flexGrow: s.valor }}
                title={`${s.label}: ${s.valor} (${pctTexto(s.valor, total)})`}
              />
            ))
        )}
      </div>
      <ul className="mx-graf-leyenda">
        {segmentos.map((s) => (
          <li key={s.label}>
            <span className={`mx-graf-muestra is-${s.tono}`} aria-hidden />
            <span className="mx-graf-label">{s.label}</span>
            <span className="mx-graf-valor mx-num">{s.valor.toLocaleString('es-VE')}</span>
            <span className="mx-graf-pct mx-num">{pctTexto(s.valor, total)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Barras horizontales con el número a la derecha. La escala es la mayor cifra del grupo. */
export function BarrasH({
  titulo,
  filas,
}: {
  titulo: string;
  filas: { label: string; valor: number; tono?: TonoGrafico }[];
}) {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <figure className="mx-graf">
      <figcaption className="mx-graf-titulo">{titulo}</figcaption>
      <ul className="mx-barras">
        {filas.map((f) => (
          <li key={f.label} title={`${f.label}: ${f.valor}`}>
            <span className="mx-barras-label">{f.label}</span>
            <span className="mx-barras-pista" aria-hidden>
              <span
                className={`mx-barras-relleno is-${f.tono ?? 'tinta'}`}
                style={{ width: f.valor > 0 ? `max(4px, ${(f.valor / max) * 100}%)` : '0' }}
              />
            </span>
            <span className="mx-barras-valor mx-num">{f.valor.toLocaleString('es-VE')}</span>
          </li>
        ))}
      </ul>
    </figure>
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
