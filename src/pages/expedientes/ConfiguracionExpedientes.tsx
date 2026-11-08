import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellOff, BellRing, CheckCircle2, Loader2, Plus, Search, X } from 'lucide-react';
import {
  buscarExpedientes,
  crearExclusionesLote,
  eliminarExclusion,
  guardarConfig,
  isExpedientesError,
  listarActores,
  listarExclusiones,
  obtenerConfig,
  ExpedientesError,
  type Actor,
  type AlcanceExclusion,
  type CambioConfig,
  type Exclusion,
  type ExpedienteItem,
  type ExpedientesConfig,
  type TipoActor,
} from '@/lib/expedientes-api';
import { AvisoError, Cargando } from './expedientes-ui';
import { OcrPorCanal } from './OcrPorCanal';
import {
  OPCIONES_EXCLUSION,
  etiquetaAlcanceExclusion,
  etiquetaProducto,
  etiquetaRequisito,
  fechaHora,
} from './expedientes-format';

const MOTIVO_MIN = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function aError(err: unknown, fallback: string): ExpedientesError {
  return isExpedientesError(err) ? err : new ExpedientesError('servidor', fallback);
}

function parsearCadencia(txt: string): number[] | null {
  const partes = txt
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (partes.length === 0) return null;
  const nums = partes.map(Number);
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 365)) return null;
  return [...new Set(nums)].sort((a, b) => a - b);
}

function parsearCorreos(txt: string): { ok: string[]; malos: string[] } {
  const lista = txt
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const unicos = [...new Set(lista.map((s) => s.toLowerCase()))];
  return {
    ok: unicos.filter((e) => EMAIL_RE.test(e)),
    malos: unicos.filter((e) => !EMAIL_RE.test(e)),
  };
}

function valorTexto(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return '—';
  }
}

export function ConfiguracionExpedientes({ onGuardado }: { onGuardado: (c: ExpedientesConfig) => void }) {
  const [original, setOriginal] = useState<ExpedientesConfig | null>(null);
  const [cambios, setCambios] = useState<CambioConfig[]>([]);
  const [error, setError] = useState<ExpedientesError | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardado, setGuardado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await obtenerConfig();
      setOriginal(r.config);
      setCambios(r.cambios);
    } catch (err) {
      setError(aError(err, 'No se pudo cargar la configuración.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando && !original) {
    return (
      <div className="mx-panel">
        <Cargando texto="Cargando configuración…" />
      </div>
    );
  }
  if (error && !original) return <AvisoError error={error} onReintentar={() => void cargar()} />;
  if (!original) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
      <div className="grid gap-4 min-w-0">
        {guardado && (
          <div className="mx-aviso mx-aviso--ok" role="status">
            <CheckCircle2 size={18} aria-hidden className="shrink-0 mt-0.5" />
            <p>Configuración guardada. El cambio quedó registrado con su motivo.</p>
          </div>
        )}
        {error && <AvisoError error={error} onReintentar={() => void cargar()} />}
        <FormConfig
          key={JSON.stringify(original)}
          original={original}
          onGuardado={async (c) => {
            setGuardado(true);
            onGuardado(c);
            await cargar();
          }}
        />
        <OcrPorCanal />
        <HistorialCambios cambios={cambios} />
      </div>
      <Exclusiones />
    </div>
  );
}

function FormConfig({
  original,
  onGuardado,
}: {
  original: ExpedientesConfig;
  onGuardado: (c: ExpedientesConfig) => Promise<void>;
}) {
  const [alcance, setAlcance] = useState(original.alcance);
  const [validacion, setValidacion] = useState(original.validacion);
  const [cadenciaTxt, setCadenciaTxt] = useState(original.cadenciaDias.join(', '));
  const [correosTxt, setCorreosTxt] = useState(original.destinatariosResumen.join('\n'));
  const [horaDiaria, setHoraDiaria] = useState(original.horaDiaria);
  const [horaResumen, setHoraResumen] = useState(original.horaResumen);
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cadencia = parsearCadencia(cadenciaTxt);
  const correos = parsearCorreos(correosTxt);
  const horasOk = /^\d{2}:\d{2}$/.test(horaDiaria) && /^\d{2}:\d{2}$/.test(horaResumen);

  const nueva: ExpedientesConfig = {
    ...original,
    alcance,
    validacion,
    cadenciaDias: cadencia ?? original.cadenciaDias,
    destinatariosResumen: correos.ok,
    horaDiaria,
    horaResumen,
  };

  const sucio = JSON.stringify(nueva) !== JSON.stringify(original);
  const alcanceVacio =
    !alcance.canales && !alcance.productores && !alcance.desconocida;
  const valido =
    !!cadencia && correos.malos.length === 0 && horasOk && !alcanceVacio && motivo.trim().length >= MOTIVO_MIN;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido || !sucio) return;
    setGuardando(true);
    setError('');
    try {
      await guardarConfig(nueva, motivo);
      await onGuardado(nueva);
    } catch (err) {
      setError(isExpedientesError(err) ? err.message : 'No se pudo guardar la configuración.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className="mx-panel" onSubmit={(e) => void submit(e)}>
      <div className="mx-panel-head">
        <div>
          <h2 className="mx-h2">Configuración del monitor</h2>
          <p className="text-xs mx-muted mt-0.5">Cada cambio queda registrado con su motivo.</p>
        </div>
      </div>

      <div className="grid gap-5 p-4">
        <fieldset className="grid gap-2">
          <legend className="mx-label mb-1">Alcance: pólizas que entran al monitor</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {(
              [
                ['canales', 'Canales alternos'],
                ['productores', 'Productores'],
                ['desconocida', 'Sin datos de quién la emitió (pólizas anteriores)'],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={alcance[k]}
                  onChange={(e) =>
                    // La red de cada canal sigue el alcance de canales (Nexus hace lo mismo).
                    setAlcance((p) => ({
                      ...p,
                      [k]: e.target.checked,
                      ...(k === 'canales' ? { gestores: e.target.checked } : {}),
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          {alcanceVacio && <p className="text-xs text-[#8F2A2D]">Elige al menos un área.</p>}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mx-label mb-1">Validación de documentos</legend>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="mx-validacion"
              className="mt-1"
              checked={validacion === 'manual'}
              onChange={() => setValidacion('manual')}
            />
            <span>
              <span className="font-semibold">Manual</span>
              <span className="mx-sub">
                El documento queda «por validar» hasta que un administrador lo valida u observa.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="mx-validacion"
              className="mt-1"
              checked={validacion === 'automatica'}
              onChange={() => setValidacion('automatica')}
            />
            <span>
              <span className="font-semibold">Automática con IA (por defecto)</span>
              <span className="mx-sub">
                La IA lee cada documento y lo compara con la póliza campo por campo (documento,
                nombre y, si aplica, placa o serial). Si algo no coincide, queda errado con la
                explicación; si no hay certeza, queda para revisar. Un administrador puede validar u
                observar a mano como excepción.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="mx-field sm:col-span-1" htmlFor="mx-cfg-cadencia">
            <span>Cadencia de recordatorios (días)</span>
            <input
              id="mx-cfg-cadencia"
              className="mx-input"
              value={cadenciaTxt}
              onChange={(e) => setCadenciaTxt(e.target.value)}
              aria-invalid={!cadencia}
              aria-describedby="mx-cfg-cadencia-ayuda"
              placeholder="0, 3, 7, 14"
            />
            <span id="mx-cfg-cadencia-ayuda" className="mx-sub">
              {cadencia ? 'Un envío por etapa, contando desde la emisión.' : 'Usa números de 0 a 365 separados por coma.'}
            </span>
          </label>
          <label className="mx-field" htmlFor="mx-cfg-hdiaria">
            <span>Hora de recordatorios</span>
            <input
              id="mx-cfg-hdiaria"
              type="time"
              className="mx-input"
              value={horaDiaria}
              onChange={(e) => setHoraDiaria(e.target.value)}
              required
            />
            <span className="mx-sub">Hora de Caracas.</span>
          </label>
          <label className="mx-field" htmlFor="mx-cfg-hresumen">
            <span>Hora del resumen nocturno</span>
            <input
              id="mx-cfg-hresumen"
              type="time"
              className="mx-input"
              value={horaResumen}
              onChange={(e) => setHoraResumen(e.target.value)}
              required
            />
            <span className="mx-sub">Hora de Caracas.</span>
          </label>
        </div>

        <label className="mx-field" htmlFor="mx-cfg-correos">
          <span>Destinatarios del resumen nocturno</span>
          <textarea
            id="mx-cfg-correos"
            className="mx-input"
            rows={3}
            value={correosTxt}
            onChange={(e) => setCorreosTxt(e.target.value)}
            aria-invalid={correos.malos.length > 0}
            placeholder="Un correo por línea"
          />
          <span className="mx-sub">
            {correos.malos.length > 0
              ? `Revisa: ${correos.malos.join(', ')}`
              : 'Fuera de producción, los correos solo salen a la lista de prueba configurada en el servidor.'}
          </span>
        </label>

        <div className="grid gap-1">
          <span className="mx-label">Documentos requeridos por producto</span>
          <ul className="text-xs grid gap-1">
            {Object.entries(original.requisitosPorProducto).map(([prod, tipos]) => (
              <li key={prod}>
                <span className="font-semibold">{etiquetaProducto(prod)}:</span>{' '}
                {(Array.isArray(tipos) ? tipos : []).map((t) => etiquetaRequisito(t, prod)).join(', ') || '—'}
              </li>
            ))}
          </ul>
        </div>

        <label className="mx-field" htmlFor="mx-cfg-motivo">
          <span>Motivo del cambio (obligatorio)</span>
          <textarea
            id="mx-cfg-motivo"
            className="mx-input"
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={300}
            placeholder="Ej.: Cumplimiento pidió validar manualmente durante la primera semana"
          />
        </label>

        {error && (
          <div className="mx-aviso mx-aviso--error" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="mx-btn mx-btn--primary" disabled={!sucio || !valido || guardando}>
            {guardando && <Loader2 size={15} className="animate-spin" aria-hidden />}
            Guardar cambios
          </button>
          {sucio && motivo.trim().length < MOTIVO_MIN && (
            <span className="text-xs mx-muted">Escribe el motivo para poder guardar.</span>
          )}
          {!sucio && <span className="text-xs mx-muted">Sin cambios por guardar.</span>}
        </div>
      </div>
    </form>
  );
}

function HistorialCambios({ cambios }: { cambios: CambioConfig[] }) {
  return (
    <section className="mx-panel" aria-labelledby="mx-hist-titulo">
      <div className="mx-panel-head">
        <h2 id="mx-hist-titulo" className="mx-h2">Cambios de configuración</h2>
        <span className="text-xs mx-muted mx-num">{cambios.length}</span>
      </div>
      {cambios.length === 0 ? (
        <p className="px-4 py-4 mx-muted">Todavía no hay cambios registrados.</p>
      ) : (
        <ul className="mx-lista">
          {cambios.map((c, i) => (
            <li key={c.id ?? i}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-semibold">{c.campo || 'Configuración'}</p>
                <span className="text-xs mx-muted whitespace-nowrap">{fechaHora(c.fecha ?? c.createdAt)}</span>
              </div>
              <p className="text-xs mt-0.5 break-words">
                <span className="mx-muted">{valorTexto(c.anterior)}</span>
                {' → '}
                {valorTexto(c.nuevo)}
              </p>
              <p className="mx-sub">
                {c.actor ? `Por ${c.actor}` : ''}
                {c.actor && c.motivo ? ' · ' : ''}
                {c.motivo ?? ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Exclusiones «No enviar» ───────────────────────────────────────────────

const ES_ACTOR = (t: AlcanceExclusion): t is TipoActor =>
  t === 'canal' || t === 'gestor' || t === 'intermediario';

/** Opción elegible en el buscador de exclusiones. */
interface Candidato {
  valor: string;
  titulo: string;
  detalle: string;
  excluido: boolean;
}

const MAX_CANDIDATOS = 100;

function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

const pluralPolizas = (n: number) => `${n} ${n === 1 ? 'póliza' : 'pólizas'}`;

/** Asegurados o pólizas únicos de una búsqueda en los expedientes. */
function candidatosDeExpedientes(items: ExpedienteItem[], tipo: 'asegurado' | 'poliza'): Candidato[] {
  const mapa = new Map<string, Candidato & { polizas: number }>();
  for (const it of items) {
    const excluidoPor = (a: AlcanceExclusion) => it.noEnviarPor.some((x) => x.alcance === a);
    if (tipo === 'poliza') {
      if (!it.cnpoliza || mapa.has(it.cnpoliza)) continue;
      mapa.set(it.cnpoliza, {
        valor: it.cnpoliza,
        titulo: it.cnpoliza,
        detalle: [etiquetaProducto(it.producto), it.asegurado.nombre].filter(Boolean).join(' · '),
        excluido: excluidoPor('poliza'),
        polizas: 1,
      });
      continue;
    }
    const doc = it.asegurado.documento;
    if (!doc) continue;
    const previo = mapa.get(doc);
    if (previo) {
      previo.polizas++;
      previo.detalle = `${it.asegurado.nombre ?? 'Sin nombre'} · ${pluralPolizas(previo.polizas)}`;
      previo.excluido = previo.excluido || excluidoPor('asegurado');
      continue;
    }
    mapa.set(doc, {
      valor: doc,
      titulo: doc,
      detalle: `${it.asegurado.nombre ?? 'Sin nombre'} · ${pluralPolizas(1)}`,
      excluido: excluidoPor('asegurado'),
      polizas: 1,
    });
  }
  return [...mapa.values()];
}

function Exclusiones() {
  // Lista de exclusiones activas
  const [lista, setLista] = useState<Exclusion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ExpedientesError | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<AlcanceExclusion | ''>('');
  const [quitando, setQuitando] = useState<string | null>(null);
  const [motivoQuitar, setMotivoQuitar] = useState('');
  const [errLista, setErrLista] = useState('');
  const [reactivando, setReactivando] = useState(false);

  // Formulario de selección múltiple
  const [tipo, setTipo] = useState<AlcanceExclusion>('canal');
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<Map<string, string>>(() => new Map());
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errForm, setErrForm] = useState('');
  const [resultado, setResultado] = useState('');

  // Candidatos: actores (una carga por tipo) o búsqueda de asegurados/pólizas
  const [actores, setActores] = useState<Actor[]>([]);
  const [expedientes, setExpedientes] = useState<ExpedienteItem[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errBusqueda, setErrBusqueda] = useState<ExpedientesError | null>(null);
  const [recarga, setRecarga] = useState(0);
  const peticion = useRef(0);
  const q = useDebounced(busqueda.trim());

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setLista(await listarExclusiones());
    } catch (err) {
      setError(aError(err, 'No se pudieron cargar las exclusiones.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Canal, gestor o intermediario: una carga por tipo; el buscador filtra en pantalla.
  // Asegurado o póliza: búsqueda en Nexus con el texto escrito.
  const qBusqueda = ES_ACTOR(tipo) ? '' : q;
  useEffect(() => {
    const n = ++peticion.current;
    const vigente = () => n === peticion.current;
    setErrBusqueda(null);
    if (!ES_ACTOR(tipo) && qBusqueda.length < 2) {
      setExpedientes([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const carga = ES_ACTOR(tipo)
      ? listarActores(tipo).then((r) => {
          if (vigente()) setActores(r);
        })
      : buscarExpedientes(qBusqueda).then((r) => {
          if (vigente()) setExpedientes(r);
        });
    carga
      .catch((err: unknown) => {
        if (vigente()) setErrBusqueda(aError(err, 'No se pudo cargar la lista.'));
      })
      .finally(() => {
        if (vigente()) setBuscando(false);
      });
  }, [tipo, qBusqueda, recarga]);

  const candidatos: Candidato[] = useMemo(() => {
    if (ES_ACTOR(tipo)) {
      const t = busqueda.trim().toLowerCase();
      return actores
        .filter((a) => !t || a.valor.toLowerCase().includes(t) || (a.nombre ?? '').toLowerCase().includes(t))
        .map((a) => ({
          valor: a.valor,
          titulo: a.nombre ? `${a.valor} · ${a.nombre}` : a.valor,
          detalle: a.polizas ? pluralPolizas(a.polizas) : 'Sin pólizas en el monitor',
          excluido: a.excluido,
        }));
    }
    return candidatosDeExpedientes(expedientes, tipo as 'asegurado' | 'poliza');
  }, [tipo, actores, expedientes, busqueda]);

  const visibles = candidatos.slice(0, MAX_CANDIDATOS);
  const elegibles = visibles.filter((c) => !c.excluido);
  const textoLibre = busqueda.trim();
  const puedeAgregarLibre =
    textoLibre.length > 0 &&
    !seleccion.has(textoLibre) &&
    !candidatos.some((c) => c.valor.toLowerCase() === textoLibre.toLowerCase());
  const opcion = OPCIONES_EXCLUSION.find((o) => o.value === tipo)!;
  const listaFiltrada = filtroTipo ? lista.filter((x) => x.alcance === filtroTipo) : lista;

  const cambiarTipo = (t: AlcanceExclusion) => {
    setTipo(t);
    setBusqueda('');
    setSeleccion(new Map());
    setActores([]);
    setExpedientes([]);
    setErrForm('');
  };

  const alternar = (c: Pick<Candidato, 'valor' | 'titulo'>) =>
    setSeleccion((prev) => {
      const n = new Map(prev);
      if (n.has(c.valor)) n.delete(c.valor);
      else n.set(c.valor, c.titulo);
      return n;
    });

  const todosVisiblesElegidos = elegibles.length > 0 && elegibles.every((c) => seleccion.has(c.valor));
  const alternarTodos = () =>
    setSeleccion((prev) => {
      const n = new Map(prev);
      if (todosVisiblesElegidos) elegibles.forEach((c) => n.delete(c.valor));
      else elegibles.forEach((c) => n.set(c.valor, c.titulo));
      return n;
    });

  const excluir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seleccion.size === 0 || motivo.trim().length < MOTIVO_MIN) return;
    setGuardando(true);
    setErrForm('');
    setResultado('');
    try {
      const r = await crearExclusionesLote(tipo, [...seleccion.keys()], motivo);
      const partes = [
        r.creadas === 1 ? '1 exclusión creada.' : `${r.creadas} exclusiones creadas.`,
        ...r.omitidas.map((o) => `${o.valor}: ${o.motivo}`),
      ];
      setResultado(partes.join(' '));
      setSeleccion(new Map());
      setMotivo('');
      setRecarga((n) => n + 1);
      await cargar();
    } catch (err) {
      setErrForm(isExpedientesError(err) ? err.message : 'No se pudieron guardar las exclusiones.');
    } finally {
      setGuardando(false);
    }
  };

  const reactivar = async (id: string) => {
    if (motivoQuitar.trim().length < MOTIVO_MIN) return;
    setReactivando(true);
    setErrLista('');
    try {
      await eliminarExclusion(id, motivoQuitar);
      setQuitando(null);
      setMotivoQuitar('');
      setRecarga((n) => n + 1);
      await cargar();
    } catch (err) {
      setErrLista(isExpedientesError(err) ? err.message : 'No se pudo reactivar el envío.');
    } finally {
      setReactivando(false);
    }
  };

  const ayudaBusqueda = tipo === 'canal'
    ? 'Código o nombre del canal. Salen los canales activos; las pólizas de sus gestores cuentan en el canal.'
    : ES_ACTOR(tipo)
    ? `Código o nombre del ${opcion.label.toLowerCase()}. La lista sale de las pólizas registradas en el monitor.`
    : tipo === 'asegurado'
      ? 'Cédula, RIF o nombre (mínimo 2 caracteres).'
      : 'Número de póliza, cédula o nombre del asegurado (mínimo 2 caracteres).';

  return (
    <section className="mx-panel min-w-0" aria-labelledby="mx-excl-titulo">
      <div className="mx-panel-head">
        <div>
          <h2 id="mx-excl-titulo" className="mx-h2">Exclusiones de recordatorios</h2>
          <p className="text-xs mx-muted mt-0.5">
            Excluir solo detiene los correos. Las pólizas siguen visibles con su estado documental.
          </p>
        </div>
      </div>

      <form className="grid gap-3 p-4 border-b border-[#eceef4]" onSubmit={(e) => void excluir(e)}>
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <label className="mx-field" htmlFor="mx-excl-tipo">
            <span>Excluir por</span>
            <select
              id="mx-excl-tipo"
              className="mx-input"
              value={tipo}
              onChange={(e) => cambiarTipo(e.target.value as AlcanceExclusion)}
            >
              {OPCIONES_EXCLUSION.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mx-field" htmlFor="mx-excl-buscar">
            <span>Buscar</span>
            <span className="relative block">
              <Search
                size={14}
                aria-hidden
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a8fa3] pointer-events-none"
              />
              <input
                id="mx-excl-buscar"
                type="search"
                className="mx-input w-full pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={ES_ACTOR(tipo) ? 'Código o nombre' : 'Escribe para buscar'}
                maxLength={60}
                aria-describedby="mx-excl-buscar-ayuda"
                autoComplete="off"
              />
            </span>
            <span id="mx-excl-buscar-ayuda" className="mx-sub">
              {ayudaBusqueda}
            </span>
          </label>
        </div>

        <fieldset className="grid gap-1.5 min-w-0">
          <legend className="sr-only">{opcion.plural} para excluir</legend>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="mx-label">
              {opcion.plural}
              {candidatos.length > 0 && ` · ${candidatos.length}`}
            </span>
            {elegibles.length > 1 && (
              <button type="button" className="mx-link text-xs" onClick={alternarTodos}>
                {todosVisiblesElegidos ? 'Quitar los visibles' : 'Elegir todos los visibles'}
              </button>
            )}
          </div>
          <div className="mx-excl-opciones" aria-busy={buscando}>
            {errBusqueda ? (
              <p className="p-3 text-xs text-[#8F2A2D]" role="alert">
                {errBusqueda.message}
              </p>
            ) : buscando && candidatos.length === 0 ? (
              <p className="p-3 text-xs mx-muted flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" aria-hidden />
                Buscando…
              </p>
            ) : visibles.length === 0 ? (
              <p className="p-3 text-xs mx-muted">
                {ES_ACTOR(tipo)
                  ? busqueda.trim()
                    ? 'Ningún valor coincide.'
                    : 'Todavía no hay pólizas con este dato.'
                  : q.length < 2
                    ? 'Escribe al menos 2 caracteres para buscar.'
                    : 'Sin resultados.'}
              </p>
            ) : (
              <ul>
                {visibles.map((c) => (
                  <li key={c.valor}>
                    <label className={`mx-excl-opcion ${c.excluido ? 'is-off' : ''}`}>
                      <input
                        type="checkbox"
                        checked={c.excluido || seleccion.has(c.valor)}
                        disabled={c.excluido}
                        onChange={() => alternar(c)}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium truncate">{c.titulo}</span>
                        <span className="mx-sub">
                          {c.detalle}
                          {c.excluido && ' · ya excluido'}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {candidatos.length > MAX_CANDIDATOS && (
            <p className="mx-sub">
              Se muestran {MAX_CANDIDATOS} de {candidatos.length}. Afina la búsqueda para ver el resto.
            </p>
          )}
          {puedeAgregarLibre && (
            <div>
              <button
                type="button"
                className="mx-btn mx-btn--ghost mx-btn--sm"
                onClick={() => {
                  alternar({ valor: textoLibre, titulo: textoLibre });
                  setBusqueda('');
                }}
              >
                <Plus size={14} aria-hidden />
                Agregar «{textoLibre}» aunque no esté en la lista
              </button>
            </div>
          )}
        </fieldset>

        {seleccion.size > 0 && (
          <div className="grid gap-1.5">
            <span className="mx-label">
              Seleccionados · {seleccion.size}
            </span>
            <ul className="flex flex-wrap gap-1.5" aria-label="Valores seleccionados">
              {[...seleccion].map(([valor, titulo]) => (
                <li key={valor}>
                  <span className="mx-chip mx-chip--neutral">
                    {titulo}
                    <button
                      type="button"
                      className="mx-chip-quitar"
                      onClick={() => alternar({ valor, titulo })}
                      aria-label={`Quitar ${titulo} de la selección`}
                    >
                      <X size={12} aria-hidden />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label className="mx-field" htmlFor="mx-excl-motivo">
          <span>Motivo (obligatorio, común para todos)</span>
          <textarea
            id="mx-excl-motivo"
            className="mx-input"
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={300}
            placeholder="Ej.: el canal entregará los documentos en la oficina"
          />
        </label>
        {errForm && (
          <p className="text-xs text-[#8F2A2D]" role="alert">
            {errForm}
          </p>
        )}
        {resultado && (
          <p className="text-xs text-[#1f6b45]" role="status">
            {resultado}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="mx-btn mx-btn--primary mx-btn--sm"
            disabled={guardando || seleccion.size === 0 || motivo.trim().length < MOTIVO_MIN}
          >
            {guardando ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <BellOff size={14} aria-hidden />}
            {seleccion.size > 1 ? `Excluir ${seleccion.size} seleccionados` : 'Excluir seleccionado'}
          </button>
          {seleccion.size > 0 && motivo.trim().length < MOTIVO_MIN && (
            <span className="text-xs mx-muted">Escribe el motivo para poder excluir.</span>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <h3 className="mx-label">Exclusiones activas</h3>
        <label className="flex items-center gap-1.5" htmlFor="mx-excl-filtro">
          <span className="text-xs">Tipo</span>
          <select
            id="mx-excl-filtro"
            className="mx-input mx-input--sm"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as AlcanceExclusion | '')}
          >
            <option value="">Todos ({lista.length})</option>
            {OPCIONES_EXCLUSION.map((o) => (
              <option key={o.value} value={o.value}>
                {o.plural} ({lista.filter((x) => x.alcance === o.value).length})
              </option>
            ))}
          </select>
        </label>
      </div>
      {errLista && (
        <p className="px-4 pt-2 text-xs text-[#8F2A2D]" role="alert">
          {errLista}
        </p>
      )}

      {error ? (
        <div className="p-4">
          <AvisoError error={error} onReintentar={() => void cargar()} />
        </div>
      ) : cargando ? (
        <Cargando texto="Cargando exclusiones…" />
      ) : listaFiltrada.length === 0 ? (
        <p className="px-4 py-4 mx-muted">
          {filtroTipo ? 'No hay exclusiones activas de este tipo.' : 'No hay exclusiones activas.'}
        </p>
      ) : (
        <ul className="mx-lista">
          {listaFiltrada.map((x) => {
            const id = String(x.id);
            return (
              <li key={id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold break-words">
                      {etiquetaAlcanceExclusion(x.alcance)} {x.valor}
                    </p>
                    <p className="text-xs mt-0.5 break-words">{x.motivo}</p>
                    <p className="mx-sub">
                      {fechaHora(x.createdAt)}
                      {x.actor ? ` · ${x.actor}` : ''}
                    </p>
                  </div>
                  {quitando !== id && (
                    <button
                      type="button"
                      className="mx-btn mx-btn--ghost mx-btn--sm"
                      onClick={() => {
                        setQuitando(id);
                        setMotivoQuitar('');
                        setErrLista('');
                      }}
                    >
                      <BellRing size={14} aria-hidden />
                      Reactivar envíos
                    </button>
                  )}
                </div>
                {quitando === id && (
                  <div className="grid gap-2 mt-2">
                    <label className="mx-field">
                      <span>Motivo para reactivar los recordatorios (obligatorio)</span>
                      <input
                        className="mx-input"
                        value={motivoQuitar}
                        onChange={(e) => setMotivoQuitar(e.target.value)}
                        maxLength={300}
                        autoFocus
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="mx-btn mx-btn--primary mx-btn--sm"
                        disabled={reactivando || motivoQuitar.trim().length < MOTIVO_MIN}
                        onClick={() => void reactivar(id)}
                      >
                        {reactivando && <Loader2 size={14} className="animate-spin" aria-hidden />}
                        Reactivar
                      </button>
                      <button
                        type="button"
                        className="mx-btn mx-btn--ghost mx-btn--sm"
                        onClick={() => setQuitando(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
