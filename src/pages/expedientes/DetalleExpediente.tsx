import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BellOff,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  PencilLine,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import {
  isExpedientesError,
  obtenerExpediente,
  observarRequisito,
  validarRequisito,
  ExpedientesError,
  type ExpedienteDetalle,
  type ExpedienteEvento,
  type ModoValidacion,
  type Requisito,
} from '@/lib/expedientes-api';
import {
  AvisoError,
  ChipDatosCambiados,
  ChipDocumental,
  ChipPago,
  ChipRequisito,
  Esqueleto,
  LineaPendiente,
} from './expedientes-ui';
import {
  esActorIa,
  estadoVisual,
  ordenarRequisitos,
  tonoVisual,
  etiquetaArea,
  etiquetaProducto,
  etiquetaRequisito,
  fechaCorta,
  fechaHora,
  nivelConfianza,
  numero,
  textoNoEnviar,
  urlDocumento,
} from './expedientes-format';

const MOTIVO_MIN = 5;

/** Tipos de evento que registra Nexus (marketplace-expedientes). */
const EVENTOS: Record<string, string> = {
  expediente_creado: 'Expediente creado',
  expediente_actualizado: 'Expediente actualizado',
  documento_recibido: 'Documento recibido',
  requisito_validado: 'Documento validado',
  requisito_observado: 'Documento observado',
  documento_analizado: 'Documento analizado por IA',
  diagnostico_ia: 'Análisis con IA',
  estado_documental: 'Cambio de estado documental',
  recordatorio: 'Recordatorio',
  cadencia_agotada: 'Recordatorios terminados',
  cambio_detectado: 'Cambio detectado en Sis2000',
  exclusion_creada: 'Excluido de recordatorios',
  exclusion_eliminada: 'Recordatorios reactivados',
  error_tecnico: 'Error técnico',
};

/** Resultados de envío que registra Nexus. */
const ENVIOS: Record<string, string> = {
  enviado: 'Enviado',
  bloqueado_whitelist: 'No enviado (ambiente de pruebas)',
  sin_correo: 'Sin correo válido',
  excluido: 'No enviado (excluido)',
  error: 'Error al enviar',
};

const etiquetaEvento = (t: string) => EVENTOS[t] ?? t.replace(/_/g, ' ');
const etiquetaEnvio = (e: string) => ENVIOS[e] ?? e.replace(/_/g, ' ');

function valorTexto(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return '—';
  }
}

interface Props {
  id: string;
  esAdmin: boolean;
  /** Modo de la configuración (solo se conoce si el usuario es administrador). */
  modoValidacion?: ModoValidacion;
  onCerrar: () => void;
  /** Hubo un cambio (validar u observar): la bandeja debe recargar. */
  onCambio: () => void;
}

export function DetalleExpediente({ id, esAdmin, modoValidacion, onCerrar, onCambio }: Props) {
  const [det, setDet] = useState<ExpedienteDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ExpedientesError | null>(null);
  const [aviso, setAviso] = useState('');
  const cerrarRef = useRef<HTMLButtonElement>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDet(await obtenerExpediente(id));
    } catch (err) {
      setError(isExpedientesError(err) ? err : new ExpedientesError('servidor', 'No se pudo cargar el detalle.'));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCerrar]);

  const trasCambio = async (mensaje: string) => {
    setAviso(mensaje);
    onCambio();
    await cargar();
  };

  // Sin dato, la validación por defecto es automática (IA).
  const modo = det?.validacion ?? modoValidacion;
  // Validar u observar a mano: solo administradores; con validación automática, como excepción.
  const puedeValidar = esAdmin;

  return (
    <>
      <div className="mx-velo" onClick={onCerrar} aria-hidden />
      <aside
        className="mx-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mx-detalle-titulo"
      >
        <div className="mx-drawer-head">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mx-eyebrow">Detalle del expediente</p>
              <h2 id="mx-detalle-titulo" className="mx-title mx-title--sm">
                Póliza {det?.cnpoliza ?? '…'}
              </h2>
              {det && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <ChipPago estado={det.estadoPago} />
                  <ChipDocumental estado={det.estadoDocumental} />
                  {det.datosModificados && <ChipDatosCambiados requisitos={det.requisitos} />}
                  {det.noEnviar && (
                    <span className="mx-chip mx-chip--neutral">
                      <BellOff size={12} aria-hidden />
                      No enviar
                      {det.noEnviarPor[0] && ` · ${textoNoEnviar(det.noEnviarPor[0])}`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              ref={cerrarRef}
              type="button"
              onClick={onCerrar}
              className="mx-hero-btn mx-hero-btn--icon"
              aria-label="Cerrar detalle"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        <div className="mx-drawer-body">
          {aviso && (
            <div className="mx-aviso mx-aviso--ok" role="status">
              <CheckCircle2 size={18} aria-hidden className="shrink-0 mt-0.5" />
              <p>{aviso}</p>
            </div>
          )}

          {error ? (
            <AvisoError error={error} onReintentar={() => void cargar()} />
          ) : cargando && !det ? (
            <Esqueleto filas={3} texto="Cargando expediente…" />
          ) : det ? (
            <>
              <section className="mx-panel" aria-labelledby="mx-req-titulo">
                <div className="mx-panel-head">
                  <div className="grid gap-1 min-w-0">
                    <h3 id="mx-req-titulo" className="mx-h2">Documentos</h3>
                    <LineaPendiente requisitos={det.requisitos} modo={modo} producto={det.producto} />
                  </div>
                  <span className="text-xs mx-muted">
                    {modo === 'manual' ? 'Validación manual' : 'Validación automática con IA'}
                  </span>
                </div>
                {det.requisitos.length === 0 ? (
                  <p className="px-4 py-4 mx-muted">Este producto no tiene requisitos configurados.</p>
                ) : (
                  <ul className="mx-docs">
                    {ordenarRequisitos(det.requisitos, modo).map((r) => (
                      <TarjetaDocumento
                        key={r.tipo}
                        expId={det.id}
                        req={r}
                        producto={det.producto}
                        modo={modo}
                        eventos={det.eventos}
                        puedeValidar={puedeValidar}
                        onHecho={(m) => void trasCambio(m)}
                      />
                    ))}
                  </ul>
                )}
              </section>

              {det.noEnviar && (
                <div className="mx-aviso mx-aviso--warn">
                  <BellOff size={18} aria-hidden className="shrink-0 mt-0.5" />
                  <div>
                    <p>Los recordatorios de esta póliza están detenidos por una exclusión.</p>
                    {det.noEnviarPor.length > 0 && (
                      <ul className="mt-1 text-xs grid gap-0.5">
                        {det.noEnviarPor.map((x, i) => (
                          <li key={x.id ?? i}>
                            <span className="font-semibold">{textoNoEnviar(x)}</span>
                            {x.motivo ? `: ${x.motivo}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <section className="mx-panel" aria-labelledby="mx-datos-titulo">
                <div className="mx-panel-head">
                  <h3 id="mx-datos-titulo" className="mx-h2">Datos de la póliza</h3>
                </div>
                <dl className="mx-dl">
                  <div>
                    <dt>Asegurado</dt>
                    <dd>{det.asegurado.nombre || '—'}</dd>
                  </div>
                  <div>
                    <dt>Documento</dt>
                    <dd>{det.asegurado.documento || '—'}</dd>
                  </div>
                  <div>
                    <dt>Correo</dt>
                    <dd>{det.asegurado.emailMasked || 'Sin correo'}</dd>
                  </div>
                  <div>
                    <dt>Producto</dt>
                    <dd>{etiquetaProducto(det.producto)}</dd>
                  </div>
                  <div>
                    <dt>Área</dt>
                    <dd>{etiquetaArea(det.areaCodigo || det.area)}</dd>
                  </div>
                  <div>
                    <dt>Emitida por</dt>
                    <dd>{det.vendedor || '—'}</dd>
                  </div>
                  <div>
                    <dt>Recibo</dt>
                    <dd>{det.cnrecibo || '—'}</dd>
                  </div>
                  <div>
                    <dt>Emitida</dt>
                    <dd>{fechaCorta(det.emitidaEn)}</dd>
                  </div>
                  <div>
                    <dt>Recordatorios</dt>
                    <dd>
                      {numero(det.intentos)} {det.intentos === 1 ? 'intento' : 'intentos'}
                      {det.estadoDocumental === 'incompleto' && !det.noEnviar && det.proximoEnvio
                        ? ` · próximo ${fechaHora(det.proximoEnvio)}`
                        : ''}
                    </dd>
                  </div>
                </dl>
              </section>

              <Plegable id="mx-env-titulo" titulo="Intentos de recordatorio" cantidad={det.notificaciones.length}>
                {det.notificaciones.length === 0 ? (
                  <p className="px-4 py-4 mx-muted">Todavía no se ha enviado ningún recordatorio.</p>
                ) : (
                  <div className="mx-table-wrap">
                    <table className="mx-table mx-table--compact mx-apilable">
                      <thead>
                        <tr>
                          <th scope="col">Fecha</th>
                          <th scope="col">Etapa</th>
                          <th scope="col">Resultado</th>
                          <th scope="col">Destino</th>
                        </tr>
                      </thead>
                      <tbody>
                        {det.notificaciones.map((n, i) => (
                          <tr key={n.id ?? i}>
                            <td className="whitespace-nowrap" data-label="Fecha">
                              {fechaHora(n.fecha ?? n.createdAt)}
                            </td>
                            <td className="whitespace-nowrap" data-label="Etapa">
                              {n.etapa !== undefined && n.etapa !== null && n.etapa !== ''
                                ? `Día ${n.etapa}`
                                : '—'}
                            </td>
                            <td data-label="Resultado">
                              <span>
                                {etiquetaEnvio(n.estado)}
                                {n.error && <span className="mx-sub">{n.error}</span>}
                              </span>
                            </td>
                            <td data-label="Destino">{n.destinoMasked || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Plegable>

              <Plegable id="mx-cam-titulo" titulo="Cambios detectados" cantidad={det.cambios.length}>
                {det.cambios.length === 0 ? (
                  <p className="px-4 py-4 mx-muted">Sin cambios respecto a la póliza emitida.</p>
                ) : (
                  <ul className="mx-lista">
                    {det.cambios.map((c, i) => (
                      <li key={c.id ?? i}>
                        <p className="font-semibold">{c.campo}</p>
                        <p className="text-xs mt-0.5 break-words">
                          <span className="mx-muted">{valorTexto(c.anterior)}</span>
                          {' → '}
                          <span>{valorTexto(c.nuevo)}</span>
                        </p>
                        <p className="mx-sub">
                          {fechaHora(c.fecha ?? c.createdAt)}
                          {c.origen ? ` · ${c.origen}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Plegable>

              <Plegable id="mx-eve-titulo" titulo="Eventos" cantidad={det.eventos.length}>
                {det.eventos.length === 0 ? (
                  <p className="px-4 py-4 mx-muted">Sin eventos registrados.</p>
                ) : (
                  <ul className="mx-lista">
                    {det.eventos.map((e, i) => (
                      <EventoFila key={e.id ?? i} ev={e} producto={det.producto} />
                    ))}
                  </ul>
                )}
              </Plegable>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}

/**
 * Sección plegable del detalle (intentos, cambios, eventos). En escritorio arranca abierta;
 * en el móvil cerrada, con la cantidad a la vista, para llegar rápido a los documentos.
 */
function Plegable({
  id,
  titulo,
  cantidad,
  children,
}: {
  id: string;
  titulo: string;
  cantidad: number;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(
    () => typeof window.matchMedia !== 'function' || window.matchMedia('(min-width: 1024px)').matches,
  );
  return (
    <details
      className="mx-panel mx-plegable"
      open={abierto}
      onToggle={(e) => setAbierto((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span className="flex items-center gap-2 min-w-0">
          <h3 id={id} className="mx-h2">
            {titulo}
          </h3>
          <span className="mx-contador">{numero(cantidad)}</span>
        </span>
        <ChevronDown size={18} className="mx-plegable-chev" aria-hidden />
      </summary>
      {children}
    </details>
  );
}

function EventoFila({ ev, producto }: { ev: ExpedienteEvento; producto: string }) {
  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-semibold">
          {etiquetaEvento(ev.tipo)}
          {ev.requisito ? ` · ${etiquetaRequisito(ev.requisito, producto)}` : ''}
        </p>
        <span className="text-xs mx-muted whitespace-nowrap">{fechaHora(ev.fecha ?? ev.createdAt)}</span>
      </div>
      {ev.actor && (
        <p className="mx-sub">
          {esActorIa(ev.actor)
            ? 'Por la validación automática con IA'
            : `Por ${ev.actor}${ev.tipo === 'requisito_validado' || ev.tipo === 'requisito_observado' ? ' (manual)' : ''}`}
        </p>
      )}
      {ev.motivo && <p className="text-xs mt-1">{ev.motivo}</p>}
      {typeof ev.detalle === 'string' && ev.detalle && <p className="text-xs mt-1 mx-muted">{ev.detalle}</p>}
    </li>
  );
}

/** Último validar/observar registrado para un documento (para saber quién lo hizo). */
function ultimaDecision(tipo: string, eventos: ExpedienteEvento[]): ExpedienteEvento | null {
  let ultimo: ExpedienteEvento | null = null;
  let clave = -Infinity;
  eventos.forEach((e, i) => {
    if (e.requisito !== tipo) return;
    if (e.tipo !== 'requisito_validado' && e.tipo !== 'requisito_observado') return;
    const t = Date.parse(e.fecha ?? e.createdAt ?? '');
    // Sin fecha, vale el orden de llegada.
    const k = Number.isNaN(t) ? i : t;
    if (k >= clave) {
      clave = k;
      ultimo = e;
    }
  });
  return ultimo;
}

const TONO_RESULTADO: Record<string, 'ok' | 'error' | 'warn' | 'info'> = {
  coincide: 'ok',
  no_coincide: 'error',
  ilegible: 'error',
  sin_certeza: 'warn',
  error_tecnico: 'info',
  datos_modificados: 'error',
};

const TEXTO_RESULTADO: Record<string, string> = {
  coincide: 'todo coincide con la póliza',
  no_coincide: 'no coincide con la póliza',
  ilegible: 'no se pudo leer el documento',
  sin_certeza: 'sin certeza, hay que revisarlo',
  error_tecnico: 'no se pudo analizar todavía',
  datos_modificados: 'datos cambiados en el formulario',
};

/** v1.3: el dato de la póliza se cambió a mano en el formulario respecto a lo que leyó el OCR. */
const MODIFICADO = 'modificado_en_formulario';

/**
 * Un documento del expediente: enlace para verlo, diagnóstico de la IA campo por campo
 * (póliza contra documento) y, solo para administradores y como excepción, validar u observar
 * a mano. No se piden ni se cargan documentos desde aquí.
 */
function TarjetaDocumento({
  expId,
  req,
  producto,
  modo,
  eventos,
  puedeValidar,
  onHecho,
}: {
  expId: number | string;
  req: Requisito;
  producto: string;
  modo?: ModoValidacion;
  eventos: ExpedienteEvento[];
  puedeValidar: boolean;
  onHecho: (mensaje: string) => void;
}) {
  const [accion, setAccion] = useState<'nada' | 'validar' | 'observar'>('nada');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const nombre = etiquetaRequisito(req.tipo, producto);
  const decision = ultimaDecision(req.tipo, eventos);
  const actor = req.actor ?? decision?.actor ?? null;
  const visual = estadoVisual({ ...req, actor }, modo);
  const diag = req.diagnostico ?? null;
  // Cargado o no, como la mesa técnica; sin_informacion u otro estado: no se sabe.
  const cargado =
    !!req.ref || req.estado === 'recibido' || req.estado === 'observado' || req.estado === 'validado';
  const textoCarga = cargado
    ? 'Cargado'
    : req.estado === 'faltante'
      ? 'No cargado'
      : 'Sin información de carga';
  const url = urlDocumento(req.ref);
  const motivoOk = motivo.trim().length >= MOTIVO_MIN;
  const confianza = nivelConfianza(diag?.confianza);
  const manual = !!actor && !esActorIa(actor);
  const automatica = modo !== 'manual';
  const fechaDecision = decision?.fecha ?? decision?.createdAt ?? null;
  const datosCambiados = diag?.resultado === 'datos_modificados';
  // Columna «Leído por OCR al emitir» solo si la emisión lo envió (no ensucia los anteriores).
  const conOcrEmision = !!diag?.campos.some((c) => c.enOcrAlEmitir != null);

  const ejecutar = async (fn: () => Promise<void>, mensaje: string) => {
    setEnviando(true);
    setError('');
    try {
      await fn();
      setAccion('nada');
      setMotivo('');
      onHecho(mensaje);
    } catch (err) {
      setError(isExpedientesError(err) ? err.message : 'No se pudo completar la acción.');
    } finally {
      setEnviando(false);
    }
  };

  const puedeValidarEste = puedeValidar && (req.estado === 'recibido' || req.estado === 'observado');
  const puedeObservarEste = puedeValidar && (req.estado === 'recibido' || req.estado === 'validado');

  return (
    <li className={`mx-doc-card mx-tono--${tonoVisual(visual)}`}>
      {datosCambiados && (
        <div className="mx-aviso mx-aviso--modificado" role="alert">
          <AlertTriangle size={18} aria-hidden className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-semibold">⚠ Datos cambiados en el formulario respecto al documento</p>
            {diag?.resumen && <p className="mt-0.5">{diag.resumen}</p>}
          </div>
        </div>
      )}
      <div className="mx-doc-head">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{nombre}</span>
            <ChipRequisito
              tipo={req.tipo}
              producto={producto}
              estado={req.estado}
              diagnostico={diag}
              actor={actor}
              modo={modo}
              soloEstado
            />
          </div>
          <p className="mx-sub">
            {textoCarga}
            {cargado && !url ? ' · sin enlace para verlo' : ''}
          </p>
        </div>
        {url && (
          <a
            className="mx-btn mx-btn--ghost mx-btn--sm"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver ${nombre} (se abre en otra pestaña)`}
          >
            <ExternalLink size={14} aria-hidden />
            Ver documento
          </a>
        )}
      </div>

      {(visual === 'validado_manual' || (visual === 'observado' && manual)) && (
        <p className="text-xs font-semibold text-[#3c4260] flex items-center gap-1.5">
          <UserCheck size={14} aria-hidden />
          {visual === 'validado_manual' ? 'Validado manualmente' : 'Observado manualmente'}
          {manual ? ` por ${actor}` : ''}
          {fechaDecision ? ` · ${fechaHora(fechaDecision)}` : ''}
        </p>
      )}

      {diag ? (
        <div className="grid gap-2">
          {diag.resultado && (
            <p className="text-xs font-semibold text-[#091133]">
              Validación con IA:{' '}
              {TEXTO_RESULTADO[diag.resultado] ?? diag.resultado.replace(/_/g, ' ')}
            </p>
          )}
          {diag.resumen && !datosCambiados && (
            <p
              className={`mx-diag-resumen mx-diag-resumen--${TONO_RESULTADO[diag.resultado ?? ''] ?? 'info'}`}
            >
              {diag.resumen}
            </p>
          )}
          {diag.campos.length > 0 && (
            <div className="mx-diag-wrap">
              <table className="mx-diag mx-apilable">
                <caption className="sr-only">Comparación de {nombre} con la póliza</caption>
                <thead>
                  <tr>
                    <th scope="col">Dato</th>
                    <th scope="col">En la póliza</th>
                    <th scope="col">En el documento</th>
                    {conOcrEmision && <th scope="col">Leído por OCR al emitir</th>}
                    <th scope="col" aria-label="¿Coincide?">
                      ✓ ✗
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diag.campos.map((c, i) => (
                    <tr
                      key={`${c.campo}-${i}`}
                      className={
                        c.estado === MODIFICADO
                          ? 'mx-diag-no mx-diag-mod'
                          : c.coincide === false
                            ? 'mx-diag-no'
                            : undefined
                      }
                    >
                      <td className="mx-diag-dato mx-apilable-titulo">{c.etiqueta}</td>
                      <td data-label="En la póliza">{c.enPoliza ?? <span className="mx-muted">—</span>}</td>
                      <td className="mx-diag-doc" data-label="En el documento">
                        {c.enDocumento ?? <span className="mx-muted">No se leyó</span>}
                      </td>
                      {conOcrEmision && (
                        <td className="mx-diag-ocr" data-label="Leído por OCR al emitir">
                          {c.enOcrAlEmitir ?? <span className="mx-muted">—</span>}
                        </td>
                      )}
                      <td className="mx-diag-marca" data-label="¿Coincide?">
                        {c.estado === MODIFICADO ? (
                          <span className="mx-diag-modificado inline-flex items-center gap-1 font-semibold">
                            <PencilLine size={15} aria-hidden />
                            Modificado en el formulario
                          </span>
                        ) : c.coincide === true ? (
                          <span className="mx-diag-si inline-flex items-center gap-1">
                            <CheckCircle2 size={15} aria-hidden />
                            Coincide
                          </span>
                        ) : c.coincide === false ? (
                          <span className="mx-diag-falla inline-flex items-center gap-1 font-semibold">
                            <XCircle size={15} aria-hidden />
                            No coincide
                          </span>
                        ) : (
                          <span className="mx-muted">sin dato en la póliza</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(diag.analizadoEn || confianza) && (
            <p className="mx-sub">
              {diag.analizadoEn ? `Analizado el ${fechaHora(diag.analizadoEn)}` : 'Analizado'}
              {confianza ? ` · Confianza ${confianza}` : ''}
            </p>
          )}
        </div>
      ) : (
        cargado &&
        automatica &&
        req.estado === 'recibido' && (
          <p className="mx-sub">La IA todavía no termina de revisar este documento.</p>
        )
      )}

      {req.motivo &&
        req.motivo !== diag?.resumen &&
        (req.estado === 'observado' || req.estado === 'recibido') && (
          <p className="text-xs text-[#8F2A2D]">Motivo: {req.motivo}</p>
        )}

      {(puedeValidarEste || puedeObservarEste) && accion === 'nada' && (
        <div className="mx-excepcion">
          {automatica && (
            <p className="text-xs mx-muted">
              Solo administradores, como excepción: queda registrado como validación manual a tu
              nombre, distinta de la IA.
            </p>
          )}
          <div className="mx-doc-acciones flex flex-wrap gap-1.5">
            {puedeValidarEste && (
              <button
                type="button"
                className="mx-btn mx-btn--ok mx-btn--sm"
                onClick={() => setAccion('validar')}
              >
                {automatica ? 'Validar a mano' : 'Validar'}
              </button>
            )}
            {puedeObservarEste && (
              <button
                type="button"
                className="mx-btn mx-btn--warn mx-btn--sm"
                onClick={() => setAccion('observar')}
              >
                {automatica ? 'Observar a mano' : 'Observar'}
              </button>
            )}
          </div>
        </div>
      )}

      {accion === 'validar' && (
        <div className="mx-aviso mx-aviso--info flex-col">
          <p>
            ¿Confirmas que el documento es legible y coincide con los datos de la póliza? Quedará
            como validado manualmente.
          </p>
          <div className="mx-doc-acciones flex flex-wrap gap-2 mt-1">
            <button
              type="button"
              className="mx-btn mx-btn--primary mx-btn--sm"
              disabled={enviando}
              onClick={() =>
                void ejecutar(
                  () => validarRequisito(expId, req.tipo),
                  `${nombre}: validado manualmente.`,
                )
              }
            >
              {enviando && <Loader2 size={14} className="animate-spin" aria-hidden />}
              Confirmar validación
            </button>
            <button
              type="button"
              className="mx-btn mx-btn--ghost mx-btn--sm"
              onClick={() => setAccion('nada')}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {accion === 'observar' && (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!motivoOk) return;
            void ejecutar(
              () => observarRequisito(expId, req.tipo, motivo),
              `${nombre}: observado manualmente.`,
            );
          }}
        >
          <label className="mx-field">
            <span>Motivo de la observación (obligatorio)</span>
            <textarea
              className="mx-input"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej.: imagen ilegible, documento vencido, no coincide con el asegurado"
              maxLength={300}
              required
              autoFocus
            />
          </label>
          <div className="mx-doc-acciones flex flex-wrap gap-2">
            <button
              type="submit"
              className="mx-btn mx-btn--warn mx-btn--sm"
              disabled={!motivoOk || enviando}
            >
              {enviando && <Loader2 size={14} className="animate-spin" aria-hidden />}
              Guardar observación
            </button>
            <button
              type="button"
              className="mx-btn mx-btn--ghost mx-btn--sm"
              onClick={() => {
                setAccion('nada');
                setMotivo('');
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="text-xs text-[#8F2A2D]" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
