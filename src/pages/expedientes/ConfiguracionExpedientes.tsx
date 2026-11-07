import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import {
  crearExclusion,
  eliminarExclusion,
  guardarConfig,
  isExpedientesError,
  listarExclusiones,
  obtenerConfig,
  ExpedientesError,
  type AlcanceExclusion,
  type CambioConfig,
  type Exclusion,
  type ExpedientesConfig,
} from '@/lib/expedientes-api';
import { AvisoError, Cargando } from './expedientes-ui';
import { etiquetaProducto, etiquetaRequisito, fechaHora } from './expedientes-format';

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
  const alcanceVacio = !alcance.canales && !alcance.gestores && !alcance.productores;
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
                ['gestores', 'Gestores'],
                ['productores', 'Productores'],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={alcance[k]}
                  onChange={(e) => setAlcance((p) => ({ ...p, [k]: e.target.checked }))}
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
              <span className="font-semibold">Automática</span>
              <span className="mx-sub">
                El sistema lee el documento y lo compara con la póliza (documento, nombre y, si
                aplica, placa o serial). Si no hay certeza, queda por validar.
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

function Exclusiones() {
  const [lista, setLista] = useState<Exclusion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<ExpedientesError | null>(null);
  const [alcance, setAlcance] = useState<AlcanceExclusion>('asegurado');
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errForm, setErrForm] = useState('');
  const [quitando, setQuitando] = useState<string | null>(null);
  const [motivoQuitar, setMotivoQuitar] = useState('');

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

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor.trim() || motivo.trim().length < MOTIVO_MIN) return;
    setGuardando(true);
    setErrForm('');
    try {
      await crearExclusion(alcance, valor, motivo);
      setValor('');
      setMotivo('');
      await cargar();
    } catch (err) {
      setErrForm(isExpedientesError(err) ? err.message : 'No se pudo guardar la exclusión.');
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (id: string) => {
    if (motivoQuitar.trim().length < MOTIVO_MIN) return;
    setGuardando(true);
    setErrForm('');
    try {
      await eliminarExclusion(id, motivoQuitar);
      setQuitando(null);
      setMotivoQuitar('');
      await cargar();
    } catch (err) {
      setErrForm(isExpedientesError(err) ? err.message : 'No se pudo quitar la exclusión.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="mx-panel min-w-0" aria-labelledby="mx-excl-titulo">
      <div className="mx-panel-head">
        <div>
          <h2 id="mx-excl-titulo" className="mx-h2">Clientes excluidos de recordatorios</h2>
          <p className="text-xs mx-muted mt-0.5">
            Excluir solo detiene los correos. El expediente sigue visible con su estado documental.
          </p>
        </div>
      </div>

      <form className="grid gap-3 p-4 border-b border-[#eceef4]" onSubmit={(e) => void agregar(e)}>
        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <label className="mx-field" htmlFor="mx-excl-alcance">
            <span>Alcance</span>
            <select
              id="mx-excl-alcance"
              className="mx-input"
              value={alcance}
              onChange={(e) => setAlcance(e.target.value as AlcanceExclusion)}
            >
              <option value="asegurado">Asegurado</option>
              <option value="poliza">Póliza</option>
            </select>
          </label>
          <label className="mx-field" htmlFor="mx-excl-valor">
            <span>{alcance === 'asegurado' ? 'Cédula o RIF' : 'Número de póliza'}</span>
            <input
              id="mx-excl-valor"
              className="mx-input"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder={alcance === 'asegurado' ? 'V12345678' : 'Número de póliza'}
              maxLength={40}
            />
          </label>
        </div>
        <label className="mx-field" htmlFor="mx-excl-motivo">
          <span>Motivo (obligatorio)</span>
          <textarea
            id="mx-excl-motivo"
            className="mx-input"
            rows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={300}
            placeholder="Ej.: el cliente entregará los documentos en la oficina"
          />
        </label>
        {errForm && (
          <p className="text-xs text-[#8F2A2D]" role="alert">
            {errForm}
          </p>
        )}
        <div>
          <button
            type="submit"
            className="mx-btn mx-btn--primary mx-btn--sm"
            disabled={guardando || !valor.trim() || motivo.trim().length < MOTIVO_MIN}
          >
            {guardando ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Plus size={14} aria-hidden />}
            Agregar exclusión
          </button>
        </div>
      </form>

      {error ? (
        <div className="p-4">
          <AvisoError error={error} onReintentar={() => void cargar()} />
        </div>
      ) : cargando ? (
        <Cargando texto="Cargando exclusiones…" />
      ) : lista.length === 0 ? (
        <p className="px-4 py-4 mx-muted">No hay clientes excluidos.</p>
      ) : (
        <ul className="mx-lista">
          {lista.map((x) => {
            const id = String(x.id);
            return (
              <li key={id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold break-words">
                      {x.alcance === 'poliza' ? 'Póliza' : 'Asegurado'} {x.valor}
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
                      }}
                    >
                      <Trash2 size={14} aria-hidden />
                      Quitar
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
                        disabled={guardando || motivoQuitar.trim().length < MOTIVO_MIN}
                        onClick={() => void quitar(id)}
                      >
                        Quitar exclusión
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
