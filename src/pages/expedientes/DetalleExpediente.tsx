import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BellOff, CheckCircle2, ExternalLink, Loader2, X } from 'lucide-react';
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
import { AvisoError, Cargando, ChipDocumental, ChipPago, ChipRequisito } from './expedientes-ui';
import {
  etiquetaArea,
  etiquetaProducto,
  etiquetaRequisito,
  fechaCorta,
  fechaHora,
  numero,
  urlDocumento,
} from './expedientes-format';

const MOTIVO_MIN = 5;

const EVENTOS: Record<string, string> = {
  creado: 'Expediente creado',
  conciliado: 'Creado por conciliación',
  documento_recibido: 'Documento recibido',
  recibido: 'Documento recibido',
  validado: 'Documento validado',
  observado: 'Documento observado',
  recordatorio_enviado: 'Recordatorio enviado',
  recordatorio: 'Recordatorio',
  estado_recalculado: 'Estado recalculado',
  completo: 'Expediente completo',
  cambio_detectado: 'Cambio detectado en Sis2000',
  excluido: 'Excluido de recordatorios',
  exclusion_creada: 'Excluido de recordatorios',
  exclusion_eliminada: 'Recordatorios reactivados',
};

const ENVIOS: Record<string, string> = {
  enviado: 'Enviado',
  entregado: 'Entregado',
  bloqueado_whitelist: 'No enviado (ambiente de pruebas)',
  sin_correo: 'Sin correo válido',
  excluido: 'No enviado (excluido)',
  error: 'Error al enviar',
  rebotado: 'Rebotado',
  pendiente: 'Programado',
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

  const modo = det?.validacion ?? modoValidacion;
  const puedeValidar = esAdmin && modo === 'manual';

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
                  {det.noEnviar && (
                    <span className="mx-chip mx-chip--neutral">
                      <BellOff size={12} aria-hidden />
                      No enviar
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
            <Cargando texto="Cargando expediente…" />
          ) : det ? (
            <>
              <section className="mx-panel" aria-label="Datos de la póliza">
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
                    <dd>{etiquetaArea(det.area)}</dd>
                  </div>
                  <div>
                    <dt>Vendedor</dt>
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

              <section className="mx-panel" aria-labelledby="mx-req-titulo">
                <div className="mx-panel-head">
                  <h3 id="mx-req-titulo" className="mx-h2">Documentos</h3>
                  {modo && (
                    <span className="text-xs mx-muted">
                      Validación {modo === 'manual' ? 'manual' : 'automática'}
                    </span>
                  )}
                </div>
                {det.requisitos.length === 0 ? (
                  <p className="px-4 py-4 mx-muted">Este producto no tiene requisitos configurados.</p>
                ) : (
                  <ul className="mx-lista">
                    {det.requisitos.map((r) => (
                      <RequisitoFila
                        key={r.tipo}
                        expId={det.id}
                        req={r}
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
                  <p>Los recordatorios de esta póliza están detenidos por una exclusión.</p>
                </div>
              )}

              <section className="mx-panel" aria-labelledby="mx-env-titulo">
                <div className="mx-panel-head">
                  <h3 id="mx-env-titulo" className="mx-h2">Intentos de recordatorio</h3>
                  <span className="text-xs mx-muted mx-num">{det.notificaciones.length}</span>
                </div>
                {det.notificaciones.length === 0 ? (
                  <p className="px-4 py-4 mx-muted">Todavía no se ha enviado ningún recordatorio.</p>
                ) : (
                  <div className="mx-table-wrap">
                    <table className="mx-table mx-table--compact">
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
                            <td className="whitespace-nowrap">{fechaHora(n.fecha ?? n.createdAt)}</td>
                            <td className="whitespace-nowrap">
                              {n.etapa !== undefined && n.etapa !== null && n.etapa !== ''
                                ? `Día ${n.etapa}`
                                : '—'}
                            </td>
                            <td>
                              {etiquetaEnvio(n.estado)}
                              {n.error && <span className="mx-sub">{n.error}</span>}
                            </td>
                            <td>{n.destinoMasked || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="mx-panel" aria-labelledby="mx-cam-titulo">
                <div className="mx-panel-head">
                  <h3 id="mx-cam-titulo" className="mx-h2">Cambios detectados</h3>
                  <span className="text-xs mx-muted mx-num">{det.cambios.length}</span>
                </div>
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
              </section>

              <section className="mx-panel" aria-labelledby="mx-eve-titulo">
                <div className="mx-panel-head">
                  <h3 id="mx-eve-titulo" className="mx-h2">Eventos</h3>
                  <span className="text-xs mx-muted mx-num">{det.eventos.length}</span>
                </div>
                {det.eventos.length === 0 ? (
                  <p className="px-4 py-4 mx-muted">Sin eventos registrados.</p>
                ) : (
                  <ul className="mx-lista">
                    {det.eventos.map((e, i) => (
                      <EventoFila key={e.id ?? i} ev={e} />
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function EventoFila({ ev }: { ev: ExpedienteEvento }) {
  return (
    <li>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-semibold">
          {etiquetaEvento(ev.tipo)}
          {ev.requisito ? ` · ${etiquetaRequisito(ev.requisito)}` : ''}
        </p>
        <span className="text-xs mx-muted whitespace-nowrap">{fechaHora(ev.fecha ?? ev.createdAt)}</span>
      </div>
      {ev.actor && <p className="mx-sub">Por {ev.actor === 'auto' ? 'validación automática' : ev.actor}</p>}
      {ev.motivo && <p className="text-xs mt-1">{ev.motivo}</p>}
      {typeof ev.detalle === 'string' && ev.detalle && <p className="text-xs mt-1 mx-muted">{ev.detalle}</p>}
    </li>
  );
}

/**
 * Un documento del expediente: cargado o no (como la mesa técnica), enlace para verlo si hay
 * `ref` y, solo con validación manual, validar u observar. No se piden ni se cargan documentos
 * desde aquí.
 */
function RequisitoFila({
  expId,
  req,
  puedeValidar,
  onHecho,
}: {
  expId: number | string;
  req: Requisito;
  puedeValidar: boolean;
  onHecho: (mensaje: string) => void;
}) {
  const [modo, setModo] = useState<'nada' | 'validar' | 'observar'>('nada');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const nombre = etiquetaRequisito(req.tipo);
  const cargado = req.estado !== 'faltante' || !!req.ref;
  const url = urlDocumento(req.ref);
  const motivoOk = motivo.trim().length >= MOTIVO_MIN;

  const ejecutar = async (accion: () => Promise<void>, mensaje: string) => {
    setEnviando(true);
    setError('');
    try {
      await accion();
      setModo('nada');
      setMotivo('');
      onHecho(mensaje);
    } catch (err) {
      setError(isExpedientesError(err) ? err.message : 'No se pudo completar la acción.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{nombre}</span>
            <ChipRequisito tipo={req.tipo} estado={req.estado} soloEstado />
          </div>
          <p className="mx-sub">
            {cargado ? 'Cargado' : 'No cargado'}
            {cargado && !url ? ' · sin enlace para verlo' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
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
          {puedeValidar && (req.estado === 'recibido' || req.estado === 'observado') && modo === 'nada' && (
            <button type="button" className="mx-btn mx-btn--ok mx-btn--sm" onClick={() => setModo('validar')}>
              Validar
            </button>
          )}
          {puedeValidar && req.estado === 'recibido' && modo === 'nada' && (
            <button type="button" className="mx-btn mx-btn--warn mx-btn--sm" onClick={() => setModo('observar')}>
              Observar
            </button>
          )}
        </div>
      </div>

      {req.motivo && (req.estado === 'observado' || req.estado === 'recibido') && (
        <p className="text-xs mt-1.5 text-[#8F2A2D]">Motivo: {req.motivo}</p>
      )}

      {modo === 'validar' && (
        <div className="mx-aviso mx-aviso--info mt-2 flex-col">
          <p>¿Confirmas que el documento es legible y coincide con los datos de la póliza?</p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              className="mx-btn mx-btn--primary mx-btn--sm"
              disabled={enviando}
              onClick={() => void ejecutar(() => validarRequisito(expId, req.tipo), `${nombre}: validado.`)}
            >
              {enviando && <Loader2 size={14} className="animate-spin" aria-hidden />}
              Confirmar validación
            </button>
            <button type="button" className="mx-btn mx-btn--ghost mx-btn--sm" onClick={() => setModo('nada')}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modo === 'observar' && (
        <form
          className="mt-2 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!motivoOk) return;
            void ejecutar(() => observarRequisito(expId, req.tipo, motivo), `${nombre}: observado.`);
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
          <div className="flex gap-2">
            <button type="submit" className="mx-btn mx-btn--warn mx-btn--sm" disabled={!motivoOk || enviando}>
              {enviando && <Loader2 size={14} className="animate-spin" aria-hidden />}
              Guardar observación
            </button>
            <button
              type="button"
              className="mx-btn mx-btn--ghost mx-btn--sm"
              onClick={() => {
                setModo('nada');
                setMotivo('');
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="text-xs mt-1.5 text-[#8F2A2D]" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
