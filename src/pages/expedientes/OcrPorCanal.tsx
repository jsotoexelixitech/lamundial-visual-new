import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, RefreshCw, ScanLine, Search } from 'lucide-react';
import {
  guardarOcrPorCanal,
  isExpedientesError,
  obtenerOcrPorCanal,
  obtenerPuntosCanal,
  ExpedientesError,
  type CanalOcr,
  type OcrPorCanal as DatosOcr,
  type ProductoOcr,
  type PuntoComercializacion,
} from '@/lib/expedientes-api';
import { AvisoError, Cargando } from './expedientes-ui';
import { fechaHora } from './expedientes-format';

const MOTIVO_MIN = 5;
const MAX_CODIGOS_HISTORIAL = 6;

/** Cada producto del flujo tiene su propia configuración del OCR. */
const PRODUCTOS: { value: ProductoOcr; label: string; detalle: string }[] = [
  { value: 'rcv', label: 'RCV', detalle: 'Responsabilidad civil de vehículos.' },
  {
    value: 'funerario',
    label: 'Personas',
    detalle: 'Funerario, Vida, Salud, Accidentes Personales, Viajero y combinados.',
  },
  { value: 'patrimoniales', label: 'Patrimoniales', detalle: 'Ramos patrimoniales.' },
];

function mismoConjunto(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

function nombreCanal(c: Pick<CanalOcr, 'codigo' | 'nombre'>): string {
  return c.nombre || `Canal ${c.codigo}`;
}

const etiquetaPuntos = (n: number) =>
  `${n.toLocaleString('es-VE')} ${n === 1 ? 'punto de comercialización' : 'puntos de comercialización'}`;

/**
 * Puntos de comercialización de un canal (solo lectura). Se cargan al desplegar, de 50 en 50:
 * hay canales con miles. Heredan el OCR obligatorio u opcional del canal.
 */
function PuntosCanal({ canal, nombre }: { canal: string; nombre: string }) {
  const [puntos, setPuntos] = useState<PuntoComercializacion[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [buscar, setBuscar] = useState('');
  const [consulta, setConsulta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const peticion = useRef(0);

  const cargar = useCallback(
    async (p: number, q: string) => {
      const n = ++peticion.current;
      setCargando(true);
      setError('');
      try {
        const r = await obtenerPuntosCanal(canal, p, q);
        if (n !== peticion.current) return;
        setPuntos((prev) => (p === 1 ? r.puntos : [...prev, ...r.puntos]));
        setTotal(r.total);
        setPagina(p);
      } catch (err) {
        if (n !== peticion.current) return;
        setError(isExpedientesError(err) ? err.message : 'No se pudieron cargar los puntos.');
      } finally {
        if (n === peticion.current) setCargando(false);
      }
    },
    [canal],
  );

  // Primera página y cada búsqueda (con una pausa corta para no consultar por tecla).
  useEffect(() => {
    const t = window.setTimeout(() => void cargar(1, consulta), consulta ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [cargar, consulta]);

  const hayMas = puntos.length < total;

  return (
    <div className="mx-ocr-puntos" id={`mx-ocr-puntos-${canal}`}>
      <p className="mx-ocr-puntos-nota">Siguen la configuración del canal.</p>
      <label className="mx-ocr-puntos-buscar" htmlFor={`mx-ocr-puntos-q-${canal}`}>
        <span className="sr-only">Buscar punto de {nombre}</span>
        <input
          id={`mx-ocr-puntos-q-${canal}`}
          type="search"
          className="mx-input"
          value={buscar}
          onChange={(e) => {
            setBuscar(e.target.value);
            setConsulta(e.target.value.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
          placeholder="Buscar punto por código o nombre…"
          maxLength={60}
          autoComplete="off"
        />
      </label>
      {error ? (
        <div className="mx-ocr-puntos-estado" role="alert">
          <span>{error}</span>
          <button type="button" className="mx-link" onClick={() => void cargar(pagina + 1, consulta)}>
            Reintentar
          </button>
        </div>
      ) : puntos.length === 0 && !cargando ? (
        <p className="mx-ocr-puntos-estado">
          {consulta ? 'Ningún punto coincide.' : 'Este canal no tiene puntos activos.'}
        </p>
      ) : (
        <ul className="mx-ocr-puntos-lista" aria-busy={cargando}>
          {puntos.map((p) => (
            <li key={p.codigo} className="mx-ocr-punto">
              <span className="mx-num mx-ocr-punto-codigo">{p.codigo}</span>
              <span className="mx-ocr-punto-nombre">{p.nombre ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mx-ocr-puntos-pie" aria-live="polite">
        {cargando ? (
          <span className="mx-ocr-puntos-cargando">
            <Loader2 size={13} className="animate-spin" aria-hidden />
            Cargando puntos…
          </span>
        ) : (
          total > 0 && (
            <span>
              {puntos.length.toLocaleString('es-VE')} de {total.toLocaleString('es-VE')}
            </span>
          )
        )}
        {hayMas && !cargando && !error && (
          <button type="button" className="mx-link" onClick={() => void cargar(pagina + 1, consulta)}>
            Ver más
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * OCR obligatorio u opcional por canal. Lee y guarda la misma configuración que la
 * pestaña «OCR por canal» del parametrizador del OCR. Solo se configuran canales: sus puntos
 * de comercialización se pueden ver (siguen al canal) y los gestores ya configurados en el
 * OCR no se tocan.
 */
export function OcrPorCanal() {
  const [producto, setProducto] = useState<ProductoOcr>('rcv');
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set());
  const [datos, setDatos] = useState<DatosOcr | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ExpedientesError | null>(null);
  const [opcionales, setOpcionales] = useState<string[]>([]);
  const [filtro, setFiltro] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errGuardar, setErrGuardar] = useState('');
  const [conflicto, setConflicto] = useState(false);
  const [guardado, setGuardado] = useState('');
  const peticion = useRef(0);

  const cargar = useCallback(async (p: ProductoOcr) => {
    const n = ++peticion.current;
    setCargando(true);
    setError(null);
    try {
      const d = await obtenerOcrPorCanal(p);
      if (n !== peticion.current) return;
      setDatos(d);
      setOpcionales(d.opcionales);
    } catch (err) {
      if (n !== peticion.current) return;
      setDatos(null);
      setError(
        isExpedientesError(err)
          ? err
          : new ExpedientesError('servidor', 'No se pudo cargar el OCR por canal.'),
      );
    } finally {
      if (n === peticion.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(producto);
  }, [producto, cargar]);

  // Nexus sin EXPEDIENTES_OCR_CANAL_ESCRITURA: se consulta, no se cambia (afecta la emisión).
  const soloLectura = !!datos && !datos.escrituraHabilitada;
  const sucio = !!datos && !mismoConjunto(opcionales, datos.opcionales);
  const motivoOk = motivo.trim().length >= MOTIVO_MIN;
  const marcados = useMemo(() => new Set(opcionales), [opcionales]);

  // El orden sale del catálogo y no cambia al marcar: la fila no se mueve bajo el dedo.
  const visibles = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    const canales = datos?.canales ?? [];
    if (!t) return canales;
    return canales.filter(
      (c) => c.codigo.toLowerCase().includes(t) || (c.nombre ?? '').toLowerCase().includes(t),
    );
  }, [datos, filtro]);

  const nombres = useMemo(
    () => new Map((datos?.canales ?? []).map((c) => [c.codigo, nombreCanal(c)])),
    [datos],
  );

  const cambiarProducto = (p: ProductoOcr) => {
    if (p === producto) return;
    if (sucio && !window.confirm('Hay cambios sin guardar en este producto. ¿Descartarlos?')) return;
    setProducto(p);
    setDatos(null);
    setOpcionales([]);
    setFiltro('');
    setMotivo('');
    setErrGuardar('');
    setConflicto(false);
    setGuardado('');
  };

  // Interruptor encendido = obligatorio: el código sale de la lista de opcionales.
  const alternar = (codigo: string, obligatorio: boolean) => {
    setOpcionales((prev) =>
      obligatorio ? prev.filter((c) => c !== codigo) : prev.includes(codigo) ? prev : [...prev, codigo],
    );
    setGuardado('');
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datos || !sucio || !motivoOk) return;
    setGuardando(true);
    setErrGuardar('');
    setConflicto(false);
    try {
      const d = await guardarOcrPorCanal(producto, opcionales, datos.opcionales, motivo);
      setDatos(d);
      setOpcionales(d.opcionales);
      setMotivo('');
      setGuardado('Guardado. Aplica a los flujos de OCR que se abran desde ahora.');
    } catch (err) {
      setErrGuardar(isExpedientesError(err) ? err.message : 'No se pudo guardar el OCR por canal.');
      setConflicto(isExpedientesError(err) && err.status === 409);
    } finally {
      setGuardando(false);
    }
  };

  const etiquetaCodigos = (lista: string[]) => {
    const partes = lista.slice(0, MAX_CODIGOS_HISTORIAL).map((c) => nombres.get(c) ?? `Canal ${c}`);
    const resto = lista.length - partes.length;
    return resto > 0 ? `${partes.join(', ')} y ${resto} más` : partes.join(', ');
  };

  const productoActual = PRODUCTOS.find((p) => p.value === producto)!;

  return (
    <section className="mx-panel min-w-0" aria-labelledby="mx-ocr-titulo">
      <div className="mx-panel-head">
        <div className="min-w-0">
          <h2 id="mx-ocr-titulo" className="mx-h2 flex items-center gap-1.5">
            <ScanLine size={16} aria-hidden className="shrink-0" />
            OCR por canal
          </h2>
          <p className="text-xs mx-muted mt-0.5">
            La misma configuración del parametrizador del OCR. Cada cambio queda registrado con su motivo.
          </p>
        </div>
      </div>

      <form className="grid gap-4 p-4" onSubmit={(e) => void guardar(e)}>
        <div className="mx-aviso mx-aviso--info">
          <p>
            Con <strong>OCR opcional</strong>, el canal ve el paso de documentos pero puede continuar sin
            ellos y cargar los datos a mano en el formulario. Todo canal no marcado sigue con el OCR
            obligatorio.
          </p>
        </div>

        <div className="grid gap-1.5">
          <span className="mx-label" id="mx-ocr-producto">
            Producto
          </span>
          <div className="mx-segmento mx-ocr-productos" role="group" aria-labelledby="mx-ocr-producto">
            {PRODUCTOS.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={producto === p.value}
                onClick={() => cambiarProducto(p.value)}
                disabled={guardando}
              >
                {p.label}
              </button>
            ))}
          </div>
          <span className="mx-sub">{productoActual.detalle}</span>
        </div>

        {error ? (
          <AvisoError error={error} onReintentar={() => void cargar(producto)} />
        ) : cargando && !datos ? (
          <Cargando texto="Cargando canales…" />
        ) : datos ? (
          <>
            <label className="mx-field" htmlFor="mx-ocr-buscar">
              <span>Buscar canal</span>
              <span className="relative block">
                <Search
                  size={14}
                  aria-hidden
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none"
                />
                <input
                  id="mx-ocr-buscar"
                  type="search"
                  className="mx-input mx-input--icono w-full"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  // Enter en el buscador no debe guardar el formulario.
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="Buscar por nombre o código…"
                  maxLength={60}
                  autoComplete="off"
                />
              </span>
            </label>

            <div className="grid gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="mx-label">
                  Canales alternos · {datos.canales.length}
                  {cargando && <Loader2 size={12} className="inline ml-1.5 animate-spin" aria-hidden />}
                </span>
                <span className="text-xs font-semibold mx-muted" aria-live="polite">
                  {opcionales.length > 0 ? `${opcionales.length} con OCR opcional` : 'Todos obligatorios'}
                </span>
              </div>
              <div className="mx-ocr-lista" aria-busy={cargando}>
                {visibles.length === 0 ? (
                  <p className="p-3 text-xs mx-muted">
                    {filtro.trim() ? 'Ningún canal coincide.' : 'No hay canales activos en el catálogo.'}
                  </p>
                ) : (
                  <ul>
                    {visibles.map((c) => {
                      const opcional = marcados.has(c.codigo);
                      const nombre = nombreCanal(c);
                      const abierto = abiertos.has(c.codigo);
                      return (
                        <li key={c.codigo} className={`mx-ocr-fila ${opcional ? 'is-opcional' : ''}`}>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate" title={nombre}>
                              {nombre}
                            </p>
                            <p className="mx-sub mx-ocr-meta">
                              <span className="mx-num">Código {c.codigo}</span>
                              {!c.enCatalogo && <span>Ya no está entre los canales activos</span>}
                              {opcional && <span className="mx-chip mx-chip--ocr-opcional">OCR opcional</span>}
                            </p>
                            {c.puntos > 0 && (
                              <button
                                type="button"
                                className="mx-ocr-puntos-toggle"
                                aria-expanded={abierto}
                                aria-controls={abierto ? `mx-ocr-puntos-${c.codigo}` : undefined}
                                onClick={() =>
                                  setAbiertos((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(c.codigo)) next.delete(c.codigo);
                                    else next.add(c.codigo);
                                    return next;
                                  })
                                }
                              >
                                <ChevronDown size={13} aria-hidden className="mx-ocr-puntos-chevron" />
                                {etiquetaPuntos(c.puntos)}
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!opcional}
                            aria-label={`OCR obligatorio para ${nombre}`}
                            className="mx-switch"
                            onClick={() => alternar(c.codigo, opcional)}
                            disabled={guardando || soloLectura}
                          >
                            <span className="mx-switch-texto" aria-hidden>
                              OCR obligatorio
                            </span>
                            <span className="mx-switch-pista" aria-hidden>
                              <span className="mx-switch-perilla" />
                            </span>
                          </button>
                          {abierto && c.puntos > 0 && <PuntosCanal canal={c.codigo} nombre={nombre} />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {soloLectura ? (
              <div className="mx-aviso mx-aviso--info" role="note">
                <p>
                  En este ambiente el OCR por canal es <strong>solo de consulta</strong>: cambiarlo modifica
                  si el OCR es obligatorio al emitir. Los cambios se solicitan al equipo de Exélixi.
                </p>
              </div>
            ) : (
              <>
            <label className="mx-field" htmlFor="mx-ocr-motivo">
              <span>Motivo del cambio (obligatorio)</span>
              <textarea
                id="mx-ocr-motivo"
                className="mx-input"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={300}
                placeholder="Ej.: el canal carga los datos a mano mientras se resuelve su escáner"
              />
            </label>

            {errGuardar && (
              <div className="mx-aviso mx-aviso--error" role="alert">
                <div className="min-w-0">
                  <p>{errGuardar}</p>
                  {conflicto && (
                    <button
                      type="button"
                      className="mx-link mt-1 inline-flex items-center gap-1"
                      onClick={() => {
                        setErrGuardar('');
                        setConflicto(false);
                        void cargar(producto);
                      }}
                    >
                      <RefreshCw size={13} aria-hidden />
                      Recargar la sección
                    </button>
                  )}
                </div>
              </div>
            )}
            {guardado && (
              <div className="mx-aviso mx-aviso--ok" role="status">
                <CheckCircle2 size={18} aria-hidden className="shrink-0 mt-0.5" />
                <p>{guardado}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="mx-btn mx-btn--primary"
                disabled={!sucio || !motivoOk || guardando || cargando}
              >
                {guardando && <Loader2 size={15} className="animate-spin" aria-hidden />}
                Guardar OCR por canal
              </button>
              {sucio && !motivoOk && (
                <span className="text-xs mx-muted">Escribe el motivo para poder guardar.</span>
              )}
              {!sucio && <span className="text-xs mx-muted">Sin cambios por guardar.</span>}
            </div>
              </>
            )}

            {datos.cambios.length > 0 && (
              <div className="grid gap-1.5 border-t border-[#eceef4] pt-3">
                <h3 className="mx-label">Últimos cambios de {productoActual.label}</h3>
                <ul className="grid gap-2 text-xs">
                  {datos.cambios.map((c) => (
                    <li key={c.id} className="min-w-0 break-words">
                      <p>
                        {c.agregados.length > 0 && (
                          <>
                            <span className="font-semibold">OCR opcional:</span> {etiquetaCodigos(c.agregados)}
                          </>
                        )}
                        {c.agregados.length > 0 && c.quitados.length > 0 && ' · '}
                        {c.quitados.length > 0 && (
                          <>
                            <span className="font-semibold">Vuelven a obligatorio:</span>{' '}
                            {etiquetaCodigos(c.quitados)}
                          </>
                        )}
                      </p>
                      <p className="mx-sub">
                        {fechaHora(c.fecha)}
                        {c.actor ? ` · ${c.actor}` : ''}
                        {c.motivo ? ` · ${c.motivo}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
      </form>
    </section>
  );
}
