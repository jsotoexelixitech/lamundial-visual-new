import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, RefreshCw, ScanLine, Search, X } from 'lucide-react';
import {
  guardarOcrPorCanal,
  isExpedientesError,
  obtenerOcrPorCanal,
  obtenerPuntosCanal,
  ExpedientesError,
  type CanalOcr,
  type OcrPorCanal as DatosOcr,
  type ProductoOcr,
  type ProductorOcr,
  type PuntoComercializacion,
} from '@/lib/expedientes-api';
import {
  agregarProductor,
  codigoProductorValido,
  filasProductores,
  quitarProductor,
} from '@/lib/ocr-productores';
import { AvisoError, Cargando } from './expedientes-ui';
import { fechaHora } from './expedientes-format';

const MOTIVO_MIN = 5;
const MAX_CODIGOS_HISTORIAL = 6;
/** Productores sin marcar que se muestran por tanda (el catálogo trae miles). */
const PRODUCTORES_POR_TANDA = 50;

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

const etiquetaCanales = (n: number) =>
  `${n.toLocaleString('es-VE')} ${n === 1 ? 'canal' : 'canales'}`;

/** Cambio masivo: todos los canales visibles (los filtrados, si hay búsqueda) a un mismo estado. */
type DestinoMasivo = 'opcional' | 'obligatorio';

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
 * OCR no se tocan. Los productores salen del catálogo (lista con buscador e interruptor); si el
 * catálogo no carga, se agregan por código.
 */
export function OcrPorCanal() {
  const [producto, setProducto] = useState<ProductoOcr>('rcv');
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set());
  const [datos, setDatos] = useState<DatosOcr | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ExpedientesError | null>(null);
  const [opcionales, setOpcionales] = useState<string[]>([]);
  // Productores con OCR opcional en edición (los no listados quedan obligatorios).
  const [productores, setProductores] = useState<ProductorOcr[]>([]);
  const [nuevoProd, setNuevoProd] = useState('');
  const [nuevoProdNombre, setNuevoProdNombre] = useState('');
  const [filtroProd, setFiltroProd] = useState('');
  const [limiteProd, setLimiteProd] = useState(PRODUCTORES_POR_TANDA);
  const [filtro, setFiltro] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errGuardar, setErrGuardar] = useState('');
  const [conflicto, setConflicto] = useState(false);
  const [guardado, setGuardado] = useState('');
  const [masivo, setMasivo] = useState<DestinoMasivo | null>(null);
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
      setProductores(d.productores);
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
  // Productores: interruptor en la lista del catálogo (o por código); quitar = obligatorio.
  const sucioProd =
    !!datos &&
    datos.productoresSoportado &&
    !mismoConjunto(
      productores.map((p) => p.codigo),
      datos.productoresOpcionales,
    );
  const hayCambios = sucio || sucioProd;
  const codigoProdOk = codigoProductorValido(nuevoProd);
  const agregarProd = () => {
    if (!codigoProdOk) return;
    setProductores((prev) => agregarProductor(prev, nuevoProd, nuevoProdNombre));
    setNuevoProd('');
    setNuevoProdNombre('');
    setGuardado('');
  };
  const catalogoProd = datos?.catalogoProductores ?? null;
  // Historial: «Nombre (código)» con el nombre guardado o el del catálogo; si no hay nombre, solo el código.
  const nombresProd = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of catalogoProd ?? []) if (p.nombre) m.set(p.codigo, p.nombre);
    for (const p of datos?.productores ?? []) if (p.nombre) m.set(p.codigo, p.nombre);
    return m;
  }, [catalogoProd, datos?.productores]);
  const etiquetaProductores = (codigos: string[]) =>
    codigos.map((c) => (nombresProd.get(c) ? `${nombresProd.get(c)} (${c})` : c)).join(', ');
  const basesProd = datos?.productoresOpcionales;
  // Solo las filas visibles: los guardados con OCR opcional primero, luego el catálogo por tandas.
  const listaProd = useMemo(
    () => filasProductores(catalogoProd ?? [], productores, basesProd ?? [], filtroProd, limiteProd),
    [catalogoProd, productores, basesProd, filtroProd, limiteProd],
  );
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

  // Lista que quedaría con cada acción masiva (sobre lo guardado) y los canales que cambian.
  const planMasivo = useMemo(() => {
    const base = datos?.opcionales ?? [];
    const enBase = new Set(base);
    const codigos = visibles.map((c) => c.codigo);
    const enVista = new Set(codigos);
    const aOpcional = codigos.filter((c) => !enBase.has(c));
    return {
      opcional: { lista: [...base, ...aOpcional], cambian: aOpcional },
      obligatorio: {
        lista: base.filter((c) => !enVista.has(c)),
        cambian: codigos.filter((c) => enBase.has(c)),
      },
    };
  }, [datos, visibles]);
  const hayFiltro = filtro.trim().length > 0;
  const alcanceMasivo = hayFiltro
    ? `Todos los filtrados (${visibles.length.toLocaleString('es-VE')})`
    : 'Todos';

  const nombres = useMemo(
    () => new Map((datos?.canales ?? []).map((c) => [c.codigo, nombreCanal(c)])),
    [datos],
  );

  const cambiarProducto = (p: ProductoOcr) => {
    if (p === producto) return;
    if (hayCambios && !window.confirm('Hay cambios sin guardar en este producto. ¿Descartarlos?')) return;
    setProducto(p);
    setDatos(null);
    setOpcionales([]);
    setProductores([]);
    setNuevoProd('');
    setNuevoProdNombre('');
    setFiltroProd('');
    setLimiteProd(PRODUCTORES_POR_TANDA);
    setFiltro('');
    setMotivo('');
    setErrGuardar('');
    setConflicto(false);
    setGuardado('');
    setMasivo(null);
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
    if (!datos || !hayCambios || !motivoOk) return;
    setGuardando(true);
    setErrGuardar('');
    setConflicto(false);
    try {
      const d = await guardarOcrPorCanal(
        producto,
        opcionales,
        datos.opcionales,
        motivo,
        // Solo si cambiaron: sin el campo, Nexus no toca los productores.
        sucioProd ? { lista: productores, base: datos.productoresOpcionales } : undefined,
      );
      setDatos(d);
      setOpcionales(d.opcionales);
      setProductores(d.productores);
      setMotivo('');
      setGuardado('Guardado. Aplica a los flujos de OCR que se abran desde ahora.');
    } catch (err) {
      setErrGuardar(isExpedientesError(err) ? err.message : 'No se pudo guardar el OCR por canal.');
      setConflicto(isExpedientesError(err) && err.status === 409);
    } finally {
      setGuardando(false);
    }
  };

  const abrirMasivo = (destino: DestinoMasivo) => {
    setGuardado('');
    setErrGuardar('');
    setConflicto(false);
    setMasivo(destino);
  };

  // Tras el cambio masivo se recarga la sección («Últimos cambios» trae el registro).
  const trasMasivo = (mensaje: string) => {
    setMasivo(null);
    setGuardado(mensaje);
    void cargar(producto);
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
                <div className="mx-ocr-masivo">
                  <span className="text-xs font-semibold mx-muted" aria-live="polite">
                    {opcionales.length > 0 ? `${opcionales.length} con OCR opcional` : 'Todos obligatorios'}
                  </span>
                  {datos.escrituraHabilitada && visibles.length > 0 && (
                    <div className="mx-ocr-masivo-acciones" role="group" aria-label="Cambiar todos los canales visibles">
                      <button
                        type="button"
                        className="mx-btn mx-btn--ghost mx-btn--sm"
                        onClick={() => abrirMasivo('opcional')}
                        disabled={guardando || cargando || hayCambios || planMasivo.opcional.cambian.length === 0}
                      >
                        {alcanceMasivo} opcional
                      </button>
                      <button
                        type="button"
                        className="mx-btn mx-btn--ghost mx-btn--sm"
                        onClick={() => abrirMasivo('obligatorio')}
                        disabled={guardando || cargando || hayCambios || planMasivo.obligatorio.cambian.length === 0}
                      >
                        {alcanceMasivo} obligatorio
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {datos.escrituraHabilitada && hayCambios && (
                <p className="mx-sub">
                  Para cambiar todos a la vez, guarde primero los cambios pendientes o desmárquelos.
                </p>
              )}
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

            {datos.productoresSoportado && (
              <div className="grid gap-1.5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="mx-label">
                    Productores · {(catalogoProd ? listaProd.total : productores.length).toLocaleString('es-VE')}
                  </span>
                  <span className="text-xs font-semibold mx-muted" aria-live="polite">
                    {productores.length > 0
                      ? `${productores.length} con OCR opcional`
                      : 'Todos obligatorios'}
                  </span>
                </div>
                {catalogoProd ? (
                  <>
                    <p className="mx-sub">
                      Todo productor sigue con el OCR obligatorio hasta que se le apague aquí. Primero
                      aparecen los que ya tienen OCR opcional; busque los demás por código o nombre.
                    </p>
                    <label className="mx-field" htmlFor="mx-ocr-prod-buscar">
                      <span>Buscar productor</span>
                      <span className="relative block">
                        <Search
                          size={14}
                          aria-hidden
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none"
                        />
                        <input
                          id="mx-ocr-prod-buscar"
                          type="search"
                          className="mx-input mx-input--icono w-full"
                          value={filtroProd}
                          onChange={(e) => {
                            setFiltroProd(e.target.value);
                            setLimiteProd(PRODUCTORES_POR_TANDA);
                          }}
                          // Enter en el buscador no debe guardar el formulario.
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                          }}
                          placeholder="Buscar por código o nombre…"
                          maxLength={60}
                          autoComplete="off"
                        />
                      </span>
                    </label>
                    <div className="mx-ocr-lista">
                      {listaProd.filas.length === 0 ? (
                        <p className="p-3 text-xs mx-muted">
                          {filtroProd.trim() ? 'Ningún productor coincide.' : 'El catálogo no tiene productores.'}
                        </p>
                      ) : (
                        <ul>
                          {listaProd.filas.map((p) => {
                            const nombre = p.nombre || `Productor ${p.codigo}`;
                            return (
                              <li key={p.codigo} className={`mx-ocr-fila ${p.opcional ? 'is-opcional' : ''}`}>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold truncate" title={nombre}>
                                    {nombre}
                                  </p>
                                  <p className="mx-sub mx-ocr-meta">
                                    <span className="mx-num">Código {p.codigo}</span>
                                    {!p.enCatalogo && <span>No está en el catálogo de productores</span>}
                                    {p.opcional && (
                                      <span className="mx-chip mx-chip--ocr-opcional">OCR opcional</span>
                                    )}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={!p.opcional}
                                  aria-label={`OCR obligatorio para ${nombre}`}
                                  className="mx-switch"
                                  onClick={() => {
                                    setProductores((prev) =>
                                      p.opcional
                                        ? quitarProductor(prev, p.codigo)
                                        : agregarProductor(prev, p.codigo, p.nombre ?? ''),
                                    );
                                    setGuardado('');
                                  }}
                                  disabled={guardando || soloLectura}
                                >
                                  <span className="mx-switch-texto" aria-hidden>
                                    OCR obligatorio
                                  </span>
                                  <span className="mx-switch-pista" aria-hidden>
                                    <span className="mx-switch-perilla" />
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs mx-muted" aria-live="polite">
                        Mostrando {listaProd.filas.length.toLocaleString('es-VE')} de{' '}
                        {listaProd.coinciden.toLocaleString('es-VE')}
                        {filtroProd.trim() ? ' que coinciden' : ''}
                      </span>
                      {listaProd.filas.length < listaProd.coinciden && (
                        <button
                          type="button"
                          className="mx-link"
                          onClick={() => setLimiteProd((n) => n + PRODUCTORES_POR_TANDA)}
                        >
                          Mostrar más
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mx-sub">
                    No se pudo cargar el catálogo de productores. Todo productor que no esté en esta lista
                    sigue con el OCR obligatorio; para dejarle el OCR opcional, agregue su código.
                  </p>
                )}
                {!soloLectura && (
                  <div className="flex flex-wrap items-end gap-2">
                    {catalogoProd && (
                      <p className="mx-sub w-full">¿No aparece en la lista? Agréguelo por su código.</p>
                    )}
                    <label className="mx-field" htmlFor="mx-ocr-prod-codigo">
                      <span>Código del productor</span>
                      <input
                        id="mx-ocr-prod-codigo"
                        type="text"
                        className="mx-input"
                        value={nuevoProd}
                        onChange={(e) => setNuevoProd(e.target.value)}
                        // Enter agrega el productor; no debe guardar el formulario.
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarProd();
                          }
                        }}
                        placeholder="Ej.: 1234"
                        maxLength={32}
                        autoComplete="off"
                        disabled={guardando}
                      />
                    </label>
                    <label className="mx-field flex-1 min-w-[12rem]" htmlFor="mx-ocr-prod-nombre">
                      <span>Nombre (opcional)</span>
                      <input
                        id="mx-ocr-prod-nombre"
                        type="text"
                        className="mx-input w-full"
                        value={nuevoProdNombre}
                        onChange={(e) => setNuevoProdNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarProd();
                          }
                        }}
                        placeholder="Nombre del productor"
                        maxLength={120}
                        autoComplete="off"
                        disabled={guardando}
                      />
                    </label>
                    <button
                      type="button"
                      className="mx-btn mx-btn--ghost"
                      onClick={agregarProd}
                      disabled={guardando || !codigoProdOk}
                    >
                      Agregar con OCR opcional
                    </button>
                  </div>
                )}
                {nuevoProd.trim() && !codigoProdOk && (
                  <p className="mx-sub" role="alert">
                    El código solo admite letras, números, punto y guiones (máximo 32).
                  </p>
                )}
                {!catalogoProd && (
                  <div className="mx-ocr-lista">
                    {productores.length === 0 ? (
                      <p className="p-3 text-xs mx-muted">Ningún productor con OCR opcional.</p>
                    ) : (
                      <ul>
                        {productores.map((p) => {
                          const nombre = p.nombre || `Productor ${p.codigo}`;
                          return (
                            <li key={p.codigo} className="mx-ocr-fila is-opcional">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold truncate" title={nombre}>
                                  {nombre}
                                </p>
                                <p className="mx-sub mx-ocr-meta">
                                  <span className="mx-num">Código {p.codigo}</span>
                                  <span className="mx-chip mx-chip--ocr-opcional">OCR opcional</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={false}
                                aria-label={`OCR obligatorio para ${nombre}`}
                                className="mx-switch"
                                onClick={() => {
                                  setProductores((prev) => quitarProductor(prev, p.codigo));
                                  setGuardado('');
                                }}
                                disabled={guardando || soloLectura}
                              >
                                <span className="mx-switch-texto" aria-hidden>
                                  OCR obligatorio
                                </span>
                                <span className="mx-switch-pista" aria-hidden>
                                  <span className="mx-switch-perilla" />
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

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
                disabled={!hayCambios || !motivoOk || guardando || cargando}
              >
                {guardando && <Loader2 size={15} className="animate-spin" aria-hidden />}
                Guardar OCR por canal
              </button>
              {hayCambios && !motivoOk && (
                <span className="text-xs mx-muted">Escribe el motivo para poder guardar.</span>
              )}
              {!hayCambios && <span className="text-xs mx-muted">Sin cambios por guardar.</span>}
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
                      {(c.productoresAgregados.length > 0 || c.productoresQuitados.length > 0) && (
                        <p>
                          {c.productoresAgregados.length > 0 && (
                            <>
                              <span className="font-semibold">Productores con OCR opcional:</span>{' '}
                              {etiquetaProductores(c.productoresAgregados)}
                            </>
                          )}
                          {c.productoresAgregados.length > 0 && c.productoresQuitados.length > 0 && ' · '}
                          {c.productoresQuitados.length > 0 && (
                            <>
                              <span className="font-semibold">Productores que vuelven a obligatorio:</span>{' '}
                              {etiquetaProductores(c.productoresQuitados)}
                            </>
                          )}
                        </p>
                      )}
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

      {masivo && datos && (
        <ConfirmarMasivo
          destino={masivo}
          producto={producto}
          productoLabel={productoActual.label}
          visibles={visibles.length}
          filtrado={hayFiltro}
          cambian={planMasivo[masivo].cambian}
          lista={planMasivo[masivo].lista}
          base={datos.opcionales}
          etiquetaCodigos={etiquetaCodigos}
          onCerrar={() => setMasivo(null)}
          onHecho={trasMasivo}
          onRecargar={() => {
            setMasivo(null);
            void cargar(producto);
          }}
        />
      )}
    </section>
  );
}

/**
 * Confirmación del cambio masivo: un solo PUT con la lista completa resultante y `base`
 * igual a la lista guardada (409 si otro la cambió mientras tanto). Pide motivo, como el
 * cambio individual, porque aplica de inmediato en la emisión del producto.
 */
function ConfirmarMasivo({
  destino,
  producto,
  productoLabel,
  visibles,
  filtrado,
  cambian,
  lista,
  base,
  etiquetaCodigos,
  onCerrar,
  onHecho,
  onRecargar,
}: {
  destino: DestinoMasivo;
  producto: ProductoOcr;
  productoLabel: string;
  visibles: number;
  filtrado: boolean;
  cambian: string[];
  lista: string[];
  base: string[];
  etiquetaCodigos: (lista: string[]) => string;
  onCerrar: () => void;
  onHecho: (mensaje: string) => void;
  onRecargar: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [conflicto, setConflicto] = useState(false);
  const motivoRef = useRef<HTMLTextAreaElement>(null);
  // Mientras se envía no se cierra (ni con Escape ni con el velo).
  const cerrarRef = useRef(onCerrar);
  useEffect(() => {
    cerrarRef.current = enviando ? () => {} : onCerrar;
  });
  const motivoOk = motivo.trim().length >= MOTIVO_MIN;
  const opcional = destino === 'opcional';
  const yaEstaban = visibles - cambian.length;

  // Al abrir: foco en el motivo, Escape cierra y la página de fondo no se desplaza.
  useEffect(() => {
    motivoRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrarRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoOk || enviando || cambian.length === 0) return;
    setEnviando(true);
    setError('');
    setConflicto(false);
    try {
      await guardarOcrPorCanal(producto, lista, base, motivo);
      onHecho(
        `${etiquetaCanales(cambian.length)} ${cambian.length === 1 ? 'pasó' : 'pasaron'} a OCR ${destino}. ` +
          'Aplica a los flujos de OCR que se abran desde ahora.',
      );
    } catch (err) {
      setError(isExpedientesError(err) ? err.message : 'No se pudo guardar el OCR por canal.');
      setConflicto(isExpedientesError(err) && err.status === 409);
      setEnviando(false);
    }
  };

  const titulo = opcional
    ? `Poner ${etiquetaCanales(cambian.length)} en OCR opcional`
    : `Volver ${etiquetaCanales(cambian.length)} a OCR obligatorio`;

  return (
    <>
      <div className="mx-velo" onClick={() => cerrarRef.current()} aria-hidden />
      <div className="mx-modal" role="dialog" aria-modal="true" aria-labelledby="mx-ocr-masivo-titulo">
        <form className="mx-modal-caja" onSubmit={(e) => void confirmar(e)}>
          <div className="mx-modal-head">
            <h3 id="mx-ocr-masivo-titulo" className="mx-h2 min-w-0">
              {titulo}
            </h3>
            <button
              type="button"
              className="mx-modal-cerrar"
              onClick={onCerrar}
              disabled={enviando}
              aria-label="Cancelar"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="mx-modal-body">
            <div className="mx-aviso mx-aviso--warn" role="note">
              <p>
                Aplica <strong>de inmediato</strong> en la emisión de <strong>{productoLabel}</strong>:{' '}
                {opcional
                  ? 'estos canales podrán continuar sin documentos y cargar los datos a mano.'
                  : 'estos canales tendrán que cargar los documentos para continuar.'}
              </p>
            </div>

            <div className="grid gap-1 text-xs min-w-0">
              <p>
                <span className="font-semibold">
                  {cambian.length.toLocaleString('es-VE')} de {visibles.toLocaleString('es-VE')}{' '}
                  {filtrado ? 'canales filtrados' : 'canales'}
                </span>{' '}
                {cambian.length === 1 ? 'cambia' : 'cambian'}
                {yaEstaban > 0 &&
                  ` · ${yaEstaban.toLocaleString('es-VE')} ya ${yaEstaban === 1 ? 'estaba' : 'estaban'} en OCR ${destino}`}
                .
              </p>
              <p className="mx-sub break-words">{etiquetaCodigos(cambian)}</p>
              {filtrado && <p className="mx-sub">Los canales que no coinciden con la búsqueda no cambian.</p>}
            </div>

            <label className="mx-field" htmlFor="mx-ocr-masivo-motivo">
              <span>Motivo del cambio (obligatorio)</span>
              <textarea
                ref={motivoRef}
                id="mx-ocr-masivo-motivo"
                className="mx-input"
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={300}
                disabled={enviando}
                placeholder="Ej.: contingencia del escáner en todos los canales"
              />
            </label>

            {error && (
              <div className="mx-aviso mx-aviso--error" role="alert">
                <div className="min-w-0">
                  <p>{error}</p>
                  {conflicto && (
                    <button
                      type="button"
                      className="mx-link mt-1 inline-flex items-center gap-1"
                      onClick={onRecargar}
                    >
                      <RefreshCw size={13} aria-hidden />
                      Recargar la sección
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mx-modal-pie">
            {!motivoOk && <span className="mx-modal-pista text-xs mx-muted">Escribe el motivo para confirmar.</span>}
            <button type="button" className="mx-btn mx-btn--ghost" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button
              type="submit"
              className="mx-btn mx-btn--primary"
              disabled={!motivoOk || enviando || conflicto || cambian.length === 0}
            >
              {enviando && <Loader2 size={15} className="animate-spin" aria-hidden />}
              {opcional ? 'Poner en OCR opcional' : 'Volver a obligatorio'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
