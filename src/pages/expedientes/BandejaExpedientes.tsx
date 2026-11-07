import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BellOff, ChevronLeft, ChevronRight, Eye, PencilLine, RotateCcw } from 'lucide-react';
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
  AvisoError,
  Cargando,
  ChipDocumental,
  ChipPago,
  ChipRequisito,
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
  textoNoEnviar,
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
  const peticion = useRef(0);

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

  return (
    <div className="mx-panel">
      <div className="mx-panel-head">
        <div>
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

      <div className="mx-filtros" role="search">
        <label className="mx-field" htmlFor={`${idPrefijo}-q`}>
          <span>Cédula o póliza</span>
          <input
            id={`${idPrefijo}-q`}
            className="mx-input"
            type="search"
            placeholder="Buscar"
            value={filtros.q}
            onChange={(e) => cambiar('q', e.target.value)}
          />
        </label>
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
        <label className="mx-field" htmlFor={`${idPrefijo}-desde`}>
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
        <label className="mx-field" htmlFor={`${idPrefijo}-hasta`}>
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
        <label className="mx-field" htmlFor={`${idPrefijo}-vendedor`}>
          <span>Vendedor</span>
          <input
            id={`${idPrefijo}-vendedor`}
            className="mx-input"
            type="search"
            placeholder="Usuario o código"
            value={filtros.vendedor}
            onChange={(e) => cambiar('vendedor', e.target.value)}
          />
        </label>
        <label className="mx-field" htmlFor={`${idPrefijo}-agrupar`}>
          <span>Agrupar</span>
          <select
            id={`${idPrefijo}-agrupar`}
            className="mx-input"
            value={filtros.agrupar}
            onChange={(e) => cambiar('agrupar', e.target.value as Agrupacion)}
          >
            <option value="poliza">Por póliza</option>
            <option value="asegurado">Por asegurado</option>
          </select>
        </label>
        {estadoDoc === 'incompleto' && (
          <div className="mx-field">
            <span>Validación con IA</span>
            <label className="mx-check" htmlFor={`${idPrefijo}-errados`}>
              <input
                id={`${idPrefijo}-errados`}
                type="checkbox"
                checked={filtros.conErrores}
                onChange={(e) => cambiar('conErrores', e.target.checked)}
              />
              Con documentos errados
            </label>
            <label className="mx-check" htmlFor={`${idPrefijo}-modificados`}>
              <input
                id={`${idPrefijo}-modificados`}
                type="checkbox"
                checked={filtros.datosModificados}
                onChange={(e) => cambiar('datosModificados', e.target.checked)}
              />
              Datos cambiados
            </label>
          </div>
        )}
      </div>

      {error ? (
        <div className="px-4 pb-4">
          <AvisoError error={error} onReintentar={() => setReintento((n) => n + 1)} />
        </div>
      ) : cargando && !datos ? (
        <Cargando texto="Cargando expedientes…" />
      ) : items.length === 0 ? (
        <Vacio
          titulo={
            hayFiltros ? 'Ningún expediente coincide con los filtros' : textos.vacio
          }
          texto={hayFiltros ? 'Prueba con otros filtros o límpialos.' : undefined}
        />
      ) : (
        <>
          <div className="mx-table-wrap" aria-busy={cargando}>
            <table className="mx-table">
              <caption className="sr-only">{textos.titulo}</caption>
              <thead>
                <tr>
                  <th scope="col">Póliza / producto</th>
                  <th scope="col">Asegurado</th>
                  <th scope="col">Área / vendedor</th>
                  <th scope="col">Pago / expediente</th>
                  <th scope="col">Documentos</th>
                  <th scope="col">Recordatorios</th>
                  <th scope="col">No enviar</th>
                  <th scope="col">Cambios</th>
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
                          <td colSpan={9}>
                            <span className="font-semibold">
                              {lista[0].asegurado.nombre || 'Asegurado sin nombre'}
                            </span>
                            {lista[0].asegurado.documento && (
                              <span className="mx-muted"> · {lista[0].asegurado.documento}</span>
                            )}
                            <span className="mx-muted">
                              {' '}
                              · {lista.length} {lista.length === 1 ? 'póliza' : 'pólizas'}
                            </span>
                          </td>
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

          <div className="mx-paginacion">
            <span className="mx-num">
              {numero(desdeN)}–{numero(hastaN)} de {numero(total)}
            </span>
            <div className="flex items-center gap-2">
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
              <button
                type="button"
                className="mx-btn mx-btn--ghost mx-btn--sm"
                disabled={page <= 1 || cargando}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft size={15} aria-hidden />
              </button>
              <span className="mx-num text-xs">
                Página {page} de {paginas}
              </span>
              <button
                type="button"
                className="mx-btn mx-btn--ghost mx-btn--sm"
                disabled={page >= paginas || cargando}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Página siguiente"
              >
                <ChevronRight size={15} aria-hidden />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * v1.3: la póliza se emitió con datos distintos a los que el OCR leyó del documento
 * (se cambiaron a mano en el formulario). Distinto de «Errado» (documento que no coincide).
 */
function ChipDatosCambiados({ it }: { it: ExpedienteItem }) {
  const resumen = it.requisitos.find((r) => r.diagnostico?.resultado === 'datos_modificados')
    ?.diagnostico?.resumen;
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
  const cambios =
    typeof it.cambiosDetectados === 'number'
      ? it.cambiosDetectados
      : it.cambiosDetectados
        ? 1
        : 0;
  return (
    <tr
      className="mx-row"
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
      <td className="min-w-[11rem] max-w-[15rem]">
        <span className="font-medium">{it.asegurado.nombre || '—'}</span>
        {it.asegurado.documento && <span className="mx-sub">{it.asegurado.documento}</span>}
        <span className="mx-sub truncate">{it.asegurado.emailMasked || 'Sin correo'}</span>
      </td>
      <td className="max-w-[11rem]">
        <span className="whitespace-nowrap">{etiquetaArea(it.areaCodigo || it.area)}</span>
        <span className="mx-sub truncate">{it.vendedor || '—'}</span>
      </td>
      <td>
        <div className="flex flex-col items-start gap-1.5">
          <ChipPago estado={it.estadoPago} />
          <ChipDocumental estado={it.estadoDocumental} />
          {it.datosModificados && <ChipDatosCambiados it={it} />}
        </div>
      </td>
      <td>
        <div className="mx-reqs">
          {it.requisitos.length === 0 ? (
            <span className="mx-muted">—</span>
          ) : (
            it.requisitos.map((r) => (
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
            ))
          )}
        </div>
      </td>
      <td className="whitespace-nowrap">
        <span className="mx-num font-medium">
          {numero(it.intentos)} {it.intentos === 1 ? 'intento' : 'intentos'}
        </span>
        <span className="mx-sub mx-num">Último: {fechaBreve(it.ultimoEnvio)}</span>
        <span className="mx-sub mx-num">
          Próximo:{' '}
          {it.estadoDocumental !== 'incompleto'
            ? '—'
            : it.noEnviar
              ? 'detenido'
              : fechaBreve(it.proximoEnvio)}
        </span>
      </td>
      <td className="whitespace-nowrap">
        {it.noEnviar ? (
          <>
            <span
              className="mx-chip mx-chip--neutral"
              title={it.noEnviarPor[0]?.motivo ?? undefined}
            >
              <BellOff size={12} aria-hidden />
              No enviar
              {it.noEnviarPor[0] && ` · ${textoNoEnviar(it.noEnviarPor[0])}`}
            </span>
            {it.noEnviarPor.length > 1 && (
              <span className="mx-sub">
                y {it.noEnviarPor.length - 1} exclusión{it.noEnviarPor.length > 2 ? 'es' : ''} más
              </span>
            )}
          </>
        ) : (
          <span className="mx-muted">—</span>
        )}
      </td>
      <td>
        {cambios > 0 ? (
          <span className="mx-chip mx-chip--alerta">
            {cambios === 1 ? 'Sí' : `${cambios} cambios`}
          </span>
        ) : (
          <span className="mx-muted">—</span>
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
