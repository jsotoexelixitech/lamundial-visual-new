import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  BellOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  PencilLine,
  RotateCcw,
  Search,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import {
  listarExpedientes,
  type Agrupacion,
  type EstadoDocumental,
  type ExpedienteItem,
  type ExpedientesError,
  type ModoValidacion,
  type PaginaExpedientes,
  isExpedientesError,
  ExpedientesError as ExpError,
} from '@/lib/expedientes-api';
import {
  Actualizando,
  AvisoError,
  ChipDatosCambiados,
  ChipDocumental,
  ChipPago,
  ChipRequisito,
  Esqueleto,
  LeyendaEstados,
  LineaPendiente,
  Vacio,
} from './expedientes-ui';
import {
  OPCIONES_AREA,
  OPCIONES_PRODUCTO,
  esDocumentoErrado,
  etiquetaArea,
  etiquetaProducto,
  fechaCorta,
  fechaBreve,
  numero,
  ordenarRequisitos,
  textoNoEnviar,
  tonoDocumental,
} from './expedientes-format';

interface FiltrosUI {
  estadoPago: '' | 'pagada' | 'pendiente';
  area: string;
  producto: string;
  desde: string;
  hasta: string;
  vendedor: string;
  q: string;
  agrupar: Agrupacion;
  /** Solo pólizas con algún documento errado (no coincide, ilegible u observado). */
  conErrores: boolean;
  /** v1.3: solo pólizas con datos cambiados en el formulario respecto al OCR al emitir. */
  datosModificados: boolean;
}

const FILTROS_INICIALES: FiltrosUI = {
  estadoPago: '',
  area: '',
  producto: '',
  desde: '',
  hasta: '',
  vendedor: '',
  q: '',
  agrupar: 'poliza',
  conErrores: false,
  datosModificados: false,
};

const TAMANOS = [25, 50, 100];

const TEXTOS: Record<string, { titulo: string; descripcion: string; vacio: string }> = {
  incompleto: {
    titulo: 'Expedientes incompletos',
    descripcion: 'Pólizas con algún documento que falta, está por validar u observado.',
    vacio: 'No hay expedientes incompletos',
  },
  completo: {
    titulo: 'Expedientes completos',
    descripcion: 'Pólizas con todos sus documentos validados.',
    vacio: 'Todavía no hay expedientes completos',
  },
  sin_informacion: {
    titulo: 'Sin información documental',
    descripcion:
      'Pólizas anteriores al monitor o sin datos de documentos en la emisión. No son incompletas ni reciben recordatorios.',
    vacio: 'No hay pólizas sin información documental',
  },
};

/** El panel de filtros arranca abierto en escritorio y cerrado en el móvil. */
const ESCRITORIO = '(min-width: 1024px)';
const esEscritorio = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(ESCRITORIO).matches
    : true;

function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

interface Props {
  estadoDoc: EstadoDocumental;
  /** Cambia cuando hay que volver a consultar (Actualizar, validación, carga…). */
  recargaKey: number;
  onAbrir: (id: string) => void;
  /** Modo de validación (si se conoce): con manual, lo recibido sin análisis queda «Por validar». */
  modoValidacion?: ModoValidacion;
}

export function BandejaExpedientes({ estadoDoc, recargaKey, onAbrir, modoValidacion }: Props) {
  const [filtros, setFiltros] = useState<FiltrosUI>(FILTROS_INICIALES);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [datos, setDatos] = useState<PaginaExpedientes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ExpedientesError | null>(null);
  const [reintento, setReintento] = useState(0);
  const [panelAbierto, setPanelAbierto] = useState(esEscritorio);
  const peticion = useRef(0);
  const panelId = useId();

  const q = useDebounced(filtros.q);
  const vendedor = useDebounced(filtros.vendedor);
  const { estadoPago, area, producto, desde, hasta, agrupar } = filtros;
  // El filtro de errados solo aplica a los incompletos (un expediente completo no tiene errados).
  const conErrores = estadoDoc === 'incompleto' && filtros.conErrores;
  // Datos cambiados = documento observado: también solo en los incompletos.
  const datosModificados = estadoDoc === 'incompleto' && filtros.datosModificados;

  useEffect(() => {
    const n = ++peticion.current;
    setCargando(true);
    setError(null);
    listarExpedientes({
      estadoDoc,
      estadoPago,
      area,
      producto,
      desde,
      hasta,
      vendedor,
      q,
      agrupar,
      conErrores,
      datosModificados,
      page,
      pageSize,
    })
      .then((r) => {
        if (n === peticion.current) setDatos(r);
      })
      .catch((err: unknown) => {
        if (n !== peticion.current) return;
        setDatos(null);
        setError(isExpedientesError(err) ? err : new ExpError('servidor', 'No se pudo cargar la bandeja.'));
      })
      .finally(() => {
        if (n === peticion.current) setCargando(false);
      });
  }, [estadoDoc, estadoPago, area, producto, desde, hasta, vendedor, q, agrupar, conErrores, datosModificados, page, pageSize, recargaKey, reintento]);

  const cambiar = <K extends keyof FiltrosUI>(k: K, v: FiltrosUI[K]) => {
    setFiltros((p) => ({ ...p, [k]: v }));
    setPage(1);
  };

  const hayFiltros = useMemo(
    () => JSON.stringify({ ...filtros, agrupar: 'poliza' }) !== JSON.stringify(FILTROS_INICIALES),
    [filtros],
  );
  // Filtros del panel (la búsqueda y los botones de errados/datos cambiados están a la vista).
  const activosPanel = [
    filtros.estadoPago,
    filtros.area,
    filtros.producto,
    filtros.desde,
    filtros.hasta,
    filtros.vendedor.trim(),
  ].filter(Boolean).length;

  // Si Nexus aún no filtra por `conErrores` / `datosModificados`, se filtra también la página recibida.
  const items = useMemo(() => {
    let lista = datos?.items ?? [];
    if (conErrores) lista = lista.filter((it) => it.requisitos.some(esDocumentoErrado));
    if (datosModificados) lista = lista.filter((it) => it.datosModificados);
    return lista;
  }, [datos, conErrores, datosModificados]);
  const total = datos?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  const desdeN = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hastaN = Math.min(total, (page - 1) * pageSize + items.length);

  // Agrupar por asegurado: se agrupa lo de la página actual, en el orden en que llega.
  const grupos = useMemo(() => {
    if (agrupar !== 'asegurado') return null;
    const map = new Map<string, ExpedienteItem[]>();
    for (const it of items) {
      const k = it.asegurado.documento || it.asegurado.nombre || `sin-${it.id}`;
      const arr = map.get(k);
      if (arr) arr.push(it);
      else map.set(k, [it]);
    }
    return [...map.entries()];
  }, [agrupar, items]);

  const idPrefijo = `mx-f-${estadoDoc}`;
  const textos = TEXTOS[estadoDoc] ?? TEXTOS.incompleto;

  const tituloGrupo = (lista: ExpedienteItem[]) => (
    <>
      <span className="font-semibold">{lista[0].asegurado.nombre || 'Asegurado sin nombre'}</span>
      {lista[0].asegurado.documento && (
        <span className="mx-muted"> · {lista[0].asegurado.documento}</span>
      )}
      <span className="mx-muted">
        {' '}
        · {lista.length} {lista.length === 1 ? 'póliza' : 'pólizas'}
      </span>
    </>
  );

  return (
    <div className="mx-panel">
      <div className="mx-panel-head">
        <div className="min-w-0">
          <h2 className="mx-h2">{textos.titulo}</h2>
          <p className="text-xs mx-muted mt-0.5">{textos.descripcion}</p>
        </div>
        {hayFiltros && (
          <button
            type="button"
            className="mx-btn mx-btn--ghost mx-btn--sm"
            onClick={() => {
              setFiltros((p) => ({ ...FILTROS_INICIALES, agrupar: p.agrupar }));
              setPage(1);
            }}
          >
            <RotateCcw size={14} aria-hidden />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Búsqueda y Filtros: hijos directos del panel para quedar fijos arriba en el móvil. */}
      <div className="mx-buscar-fija" role="search">
            <label className="mx-buscar" htmlFor={`${idPrefijo}-q`}>
              <span className="sr-only">Cédula o póliza</span>
              <Search size={16} aria-hidden />
              <input
                id={`${idPrefijo}-q`}
                className="mx-input"
                type="search"
                placeholder="Cédula o póliza"
                value={filtros.q}
                onChange={(e) => cambiar('q', e.target.value)}
              />
            </label>
            <button
              type="button"
              className="mx-btn mx-btn--ghost"
              aria-expanded={panelAbierto}
              aria-controls={panelId}
              onClick={() => setPanelAbierto((a) => !a)}
            >
              <SlidersHorizontal size={15} aria-hidden />
              Filtros
              {activosPanel > 0 && (
                <span className="mx-badge" aria-label={`${activosPanel} activos`}>
                  {activosPanel}
                </span>
              )}
              {panelAbierto ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
            </button>
      </div>

      <div>
        <div className="mx-toolbar">
          <div className="mx-toolbar-fila">
            {estadoDoc === 'incompleto' && (
              <div className="mx-toolbar-fila" role="group" aria-label="Validación con IA">
                <button
                  type="button"
                  className="mx-toggle mx-toggle--rojo"
                  aria-pressed={filtros.conErrores}
                  onClick={() => cambiar('conErrores', !filtros.conErrores)}
                >
                  <XCircle size={14} aria-hidden />
                  Con documentos errados
                </button>
                <button
                  type="button"
                  className="mx-toggle mx-toggle--violeta"
                  aria-pressed={filtros.datosModificados}
                  onClick={() => cambiar('datosModificados', !filtros.datosModificados)}
                >
                  <PencilLine size={14} aria-hidden />
                  Datos cambiados
                </button>
              </div>
            )}
            <div className="mx-segmento" role="group" aria-label="Agrupar">
              <button
                type="button"
                aria-pressed={filtros.agrupar === 'poliza'}
                onClick={() => cambiar('agrupar', 'poliza')}
              >
                Por póliza
              </button>
              <button
                type="button"
                aria-pressed={filtros.agrupar === 'asegurado'}
                onClick={() => cambiar('agrupar', 'asegurado')}
              >
                Por asegurado
              </button>
            </div>
          </div>
        </div>

        <div id={panelId} className="mx-filtros" hidden={!panelAbierto}>
          <label className="mx-field" htmlFor={`${idPrefijo}-pago`}>
            <span>Estado de pago</span>
            <select
              id={`${idPrefijo}-pago`}
              className="mx-input"
              value={filtros.estadoPago}
              onChange={(e) => cambiar('estadoPago', e.target.value as FiltrosUI['estadoPago'])}
            >
              <option value="">Todos</option>
              <option value="pagada">Pagada</option>
              <option value="pendiente">Pendiente de pago</option>
            </select>
          </label>
          <label className="mx-field" htmlFor={`${idPrefijo}-area`}>
            <span>Área</span>
            <select
              id={`${idPrefijo}-area`}
              className="mx-input"
              value={filtros.area}
              onChange={(e) => cambiar('area', e.target.value)}
            >
              <option value="">Todas</option>
              {OPCIONES_AREA.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mx-field" htmlFor={`${idPrefijo}-producto`}>
            <span>Producto</span>
            <select
              id={`${idPrefijo}-producto`}
              className="mx-input"
              value={filtros.producto}
              onChange={(e) => cambiar('producto', e.target.value)}
            >
              <option value="">Todos</option>
              {OPCIONES_PRODUCTO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mx-field" htmlFor={`${idPrefijo}-vendedor`}>
            <span>Emitida por</span>
            <input
              id={`${idPrefijo}-vendedor`}
              className="mx-input"
              type="search"
              placeholder="Usuario o código"
              value={filtros.vendedor}
              onChange={(e) => cambiar('vendedor', e.target.value)}
            />
          </label>
          <label className="mx-field mx-field--fecha" htmlFor={`${idPrefijo}-desde`}>
            <span>Emitida desde</span>
            <input
              id={`${idPrefijo}-desde`}
              className="mx-input"
              type="date"
              value={filtros.desde}
              max={filtros.hasta || undefined}
              onChange={(e) => cambiar('desde', e.target.value)}
            />
          </label>
          <label className="mx-field mx-field--fecha" htmlFor={`${idPrefijo}-hasta`}>
            <span>Emitida hasta</span>
            <input
              id={`${idPrefijo}-hasta`}
              className="mx-input"
              type="date"
              value={filtros.hasta}
              min={filtros.desde || undefined}
              onChange={(e) => cambiar('hasta', e.target.value)}
            />
          </label>
        </div>
      </div>

      <LeyendaEstados />

      {error ? (
        <div className="px-4 pb-4">
          <AvisoError error={error} onReintentar={() => setReintento((n) => n + 1)} />
        </div>
      ) : cargando && !datos ? (
        <Esqueleto filas={3} texto="Cargando expedientes…" />
      ) : items.length === 0 ? (
        <>
          {cargando && <Actualizando />}
          <Vacio
            titulo={hayFiltros ? 'Ningún expediente coincide con los filtros' : textos.vacio}
            texto={hayFiltros ? 'Prueba con otros filtros o límpialos.' : undefined}
          />
        </>
      ) : (
        <>
          {cargando && <Actualizando />}

          {/* Escritorio: tabla */}
          <div className="mx-table-wrap hidden lg:block" aria-busy={cargando}>
            <table className="mx-table">
              <caption className="sr-only">{textos.titulo}</caption>
              <thead>
                <tr>
                  <th scope="col">Póliza / producto</th>
                  <th scope="col">Asegurado</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Documentos</th>
                  <th scope="col">Área / emitida por</th>
                  <th scope="col">Recordatorios</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className={cargando ? 'opacity-60' : undefined}>
                {grupos
                  ? grupos.map(([k, lista]) => (
                      <React.Fragment key={k}>
                        <tr className="mx-grupo">
                          <td colSpan={7}>{tituloGrupo(lista)}</td>
                        </tr>
                        {lista.map((it) => (
                          <Fila key={it.id} it={it} onAbrir={onAbrir} modo={modoValidacion} />
                        ))}
                      </React.Fragment>
                    ))
                  : items.map((it) => (
                      <Fila key={it.id} it={it} onAbrir={onAbrir} modo={modoValidacion} />
                    ))}
              </tbody>
            </table>
          </div>

          {/* Móvil y pantallas medianas: tarjetas */}
          <ul
            className={`mx-cards mx-cards--movil ${cargando ? 'opacity-60' : ''}`}
            aria-label={textos.titulo}
            aria-busy={cargando}
          >
            {grupos
              ? grupos.map(([k, lista]) => (
                  <li key={k} className="mx-cards-grupo">
                    <p className="mx-grupo-tit">{tituloGrupo(lista)}</p>
                    <ul className="mx-cards">
                      {lista.map((it) => (
                        <li key={it.id} className="min-w-0">
                          <Tarjeta it={it} onAbrir={onAbrir} modo={modoValidacion} />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              : items.map((it) => (
                  <li key={it.id} className="min-w-0">
                    <Tarjeta it={it} onAbrir={onAbrir} modo={modoValidacion} />
                  </li>
                ))}
          </ul>

          <div className="mx-paginacion">
            <span className="mx-num">
              {numero(desdeN)}–{numero(hastaN)} de {numero(total)}
            </span>
            <div className="mx-paginacion-ctrl">
              <label className="flex items-center gap-1.5" htmlFor={`${idPrefijo}-size`}>
                <span className="text-xs">Por página</span>
                <select
                  id={`${idPrefijo}-size`}
                  className="mx-input mx-input--sm"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {TAMANOS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="mx-btn mx-btn--ghost mx-btn--sm"
                  disabled={page <= 1 || cargando}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>
                <span className="mx-num text-xs whitespace-nowrap">
                  Página {page} de {paginas}
                </span>
                <button
                  type="button"
                  className="mx-btn mx-btn--ghost mx-btn--sm"
                  disabled={page >= paginas || cargando}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Página siguiente"
                >
                  <ChevronRight size={16} aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Piezas compartidas por la fila y la tarjeta ───────────────────────────

function cantidadCambios(it: ExpedienteItem): number {
  return typeof it.cambiosDetectados === 'number'
    ? it.cambiosDetectados
    : it.cambiosDetectados
      ? 1
      : 0;
}

/** Cambios detectados en Sis2000 respecto a la póliza emitida (antes columna «Cambios»). */
function ChipCambios({ it }: { it: ExpedienteItem }) {
  const n = cantidadCambios(it);
  if (n <= 0) return null;
  return (
    <span className="mx-chip mx-chip--alerta" title="Cambios detectados respecto a la póliza emitida">
      {n === 1 ? 'Cambio detectado' : `${n} cambios detectados`}
    </span>
  );
}

/** Exclusión de recordatorios (antes columna «No enviar»). */
function ChipNoEnviar({ it }: { it: ExpedienteItem }) {
  if (!it.noEnviar) return null;
  return (
    <span className="mx-stack">
      <span className="mx-chip mx-chip--neutral" title={it.noEnviarPor[0]?.motivo ?? undefined}>
        <BellOff size={12} aria-hidden />
        No enviar
        {it.noEnviarPor[0] && ` · ${textoNoEnviar(it.noEnviarPor[0])}`}
      </span>
      {it.noEnviarPor.length > 1 && (
        <span className="mx-sub">
          y {it.noEnviarPor.length - 1} exclusión{it.noEnviarPor.length > 2 ? 'es' : ''} más
        </span>
      )}
    </span>
  );
}

function Requisitos({ it, modo }: { it: ExpedienteItem; modo?: ModoValidacion }) {
  if (it.requisitos.length === 0) return <span className="mx-muted">Sin documentos informados</span>;
  return (
    <div className="mx-reqs">
      {ordenarRequisitos(it.requisitos, modo).map((r) => (
        <ChipRequisito
          key={r.tipo}
          tipo={r.tipo}
          producto={it.producto}
          estado={r.estado}
          motivo={r.motivo}
          diagnostico={r.diagnostico}
          actor={r.actor}
          modo={modo}
        />
      ))}
    </div>
  );
}

function textoProximo(it: ExpedienteItem): string {
  if (it.estadoDocumental !== 'incompleto') return '—';
  return it.noEnviar ? 'detenido' : fechaBreve(it.proximoEnvio);
}

function Fila({
  it,
  onAbrir,
  modo,
}: {
  it: ExpedienteItem;
  onAbrir: (id: string) => void;
  modo?: ModoValidacion;
}) {
  const abrir = () => onAbrir(String(it.id));
  return (
    <tr
      className={`mx-row mx-tono--${tonoDocumental(it.estadoDocumental)}`}
      tabIndex={0}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter') abrir();
      }}
    >
      <td className="whitespace-nowrap">
        <span className="mx-poliza">{it.cnpoliza || '—'}</span>
        <span className="mx-sub mx-sub--strong">{etiquetaProducto(it.producto)}</span>
        {it.cnrecibo && <span className="mx-sub">Recibo {it.cnrecibo}</span>}
        <span className="mx-sub">{fechaCorta(it.emitidaEn)}</span>
      </td>
      <td className="min-w-[10rem] max-w-[14rem]">
        <span className="font-medium">{it.asegurado.nombre || '—'}</span>
        {it.asegurado.documento && <span className="mx-sub">{it.asegurado.documento}</span>}
        <span className="mx-sub truncate">{it.asegurado.emailMasked || 'Sin correo'}</span>
      </td>
      <td>
        <div className="mx-stack">
          <ChipDocumental estado={it.estadoDocumental} />
          <ChipPago estado={it.estadoPago} />
          {it.datosModificados && <ChipDatosCambiados requisitos={it.requisitos} />}
          <ChipCambios it={it} />
        </div>
      </td>
      <td>
        <div className="grid gap-1.5">
          <LineaPendiente requisitos={it.requisitos} modo={modo} producto={it.producto} />
          <Requisitos it={it} modo={modo} />
        </div>
      </td>
      <td className="max-w-[10rem]">
        <span className="whitespace-nowrap">{etiquetaArea(it.areaCodigo || it.area)}</span>
        <span className="mx-sub truncate">{it.vendedor || '—'}</span>
      </td>
      <td className="whitespace-nowrap">
        <span className="mx-num font-medium">
          {numero(it.intentos)} {it.intentos === 1 ? 'intento' : 'intentos'}
        </span>
        <span className="mx-sub mx-num">Último: {fechaBreve(it.ultimoEnvio)}</span>
        <span className="mx-sub mx-num">Próximo: {textoProximo(it)}</span>
        {it.noEnviar && (
          <span className="block mt-1.5">
            <ChipNoEnviar it={it} />
          </span>
        )}
      </td>
      <td>
        <button
          type="button"
          className="mx-btn mx-btn--ghost mx-btn--sm"
          onClick={(e) => {
            e.stopPropagation();
            abrir();
          }}
          aria-label={`Ver detalle de la póliza ${it.cnpoliza}`}
        >
          <Eye size={14} aria-hidden />
          Ver
        </button>
      </td>
    </tr>
  );
}

/**
 * Tarjeta del móvil, corta: póliza, asegurado, chips y barra de documentos arriba; la lista de
 * requisitos y los datos secundarios en «Ver documentos y datos». Toda la tarjeta abre el detalle.
 */
function Tarjeta({
  it,
  onAbrir,
  modo,
}: {
  it: ExpedienteItem;
  onAbrir: (id: string) => void;
  modo?: ModoValidacion;
}) {
  const abrir = () => onAbrir(String(it.id));
  return (
    <article
      className={`mx-card mx-tono--${tonoDocumental(it.estadoDocumental)}`}
      onClick={abrir}
      aria-label={`Póliza ${it.cnpoliza || 'sin número'}`}
    >
      <div className="mx-card-head">
        <div>
          <p className="mx-poliza">{it.cnpoliza || '—'}</p>
          <p className="mx-sub">
            <span className="mx-sub--strong">{etiquetaProducto(it.producto)}</span>
            {it.cnrecibo ? ` · Recibo ${it.cnrecibo}` : ''} · {fechaCorta(it.emitidaEn)}
          </p>
          <div className="mx-card-aseg">
            <p className="mx-card-nombre">{it.asegurado.nombre || 'Asegurado sin nombre'}</p>
            {it.asegurado.documento && <p className="mx-sub">{it.asegurado.documento}</p>}
          </div>
        </div>
        <button
          type="button"
          className="mx-btn mx-btn--ghost mx-btn--sm"
          onClick={(e) => {
            e.stopPropagation();
            abrir();
          }}
          aria-label={`Ver detalle de la póliza ${it.cnpoliza}`}
        >
          Ver
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      <div className="mx-chips">
        <ChipDocumental estado={it.estadoDocumental} />
        <ChipPago estado={it.estadoPago} />
        {it.datosModificados && <ChipDatosCambiados requisitos={it.requisitos} />}
        <ChipCambios it={it} />
      </div>

      <LineaPendiente requisitos={it.requisitos} modo={modo} producto={it.producto} />

      {/* Lo secundario, a un toque y sin abrir el detalle. */}
      <details className="mx-card-mas" onClick={(e) => e.stopPropagation()}>
        <summary>
          Ver documentos y datos
          <ChevronDown size={16} className="mx-plegable-chev" aria-hidden />
        </summary>
        <div className="mx-card-mas-cuerpo">
          <Requisitos it={it} modo={modo} />
          <p className="mx-sub">Correo: {it.asegurado.emailMasked || 'Sin correo'}</p>
      <dl className="mx-card-meta">
        <div>
          <dt>Área</dt>
          <dd>{etiquetaArea(it.areaCodigo || it.area)}</dd>
        </div>
        <div>
          <dt>Emitida por</dt>
          <dd>{it.vendedor || '—'}</dd>
        </div>
        <div>
          <dt>Recordatorios</dt>
          <dd className="mx-num">
            {numero(it.intentos)} {it.intentos === 1 ? 'intento' : 'intentos'}
            <span className="mx-sub">Último: {fechaBreve(it.ultimoEnvio)}</span>
          </dd>
        </div>
        <div>
          <dt>Próximo envío</dt>
          <dd className="mx-num">{textoProximo(it)}</dd>
        </div>
        {it.noEnviar && (
          <div className="col-span-2">
            <dt className="sr-only">No enviar</dt>
            <dd>
              <ChipNoEnviar it={it} />
            </dd>
          </div>
        )}
      </dl>
        </div>
      </details>
    </article>
  );
}
