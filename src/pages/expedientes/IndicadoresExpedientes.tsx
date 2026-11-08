import React, { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown, Layers, UserRound } from 'lucide-react';
import {
  obtenerIndicadores,
  isExpedientesError,
  ExpedientesError,
  type Indicadores,
} from '@/lib/expedientes-api';
import { AvisoError, BarraApilada, BarrasH, Esqueleto } from './expedientes-ui';
import { numero } from './expedientes-format';
import { useReanimar } from './expedientes-anim';
import { EsqueletoKpi, KpiPrincipales, PanelesKpi, type GrupoRanking } from './IndicadoresKpi';

type Icono = React.ComponentType<{ size?: number; 'aria-hidden'?: boolean; className?: string }>;

/** Solo dos áreas: Canales (incluye gestores y puntos de comercialización) y Productores. */
const AREAS: { key: string; area?: string; titulo: string; Icon: Icono }[] = [
  { key: 'todas', titulo: 'Consolidado', Icon: Layers },
  { key: 'C', area: 'C', titulo: 'Canales alternos', Icon: Building2 },
  { key: 'P', area: 'P', titulo: 'Productores', Icon: UserRound },
];

type Resultado = { ok: true; data: Indicadores } | { ok: false; error: ExpedientesError };

export function IndicadoresExpedientes({
  recargaKey,
  onElegirActor,
}: {
  recargaKey: number;
  /** Clic en un canal o productor del ranking: la bandeja se filtra por ese código. */
  onElegirActor?: (grupo: GrupoRanking, codigo: string, nombre: string) => void;
}) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [res, setRes] = useState<Record<string, Resultado> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [reintento, setReintento] = useState(0);
  /** Área de las tarjetas de KPI (los datos ya vienen en la misma carga; cambiar no consulta). */
  const [areaKpi, setAreaKpi] = useState('todas');
  /** Sube con cada respuesta nueva: vuelve a animar cifras, barras y anillos. */
  const [version, setVersion] = useState(0);
  const peticion = useRef(0);
  const animRef = useReanimar<HTMLDivElement>(`${version}|${areaKpi}`);
  const [escritorio] = useState(esEscritorio);

  useEffect(() => {
    const n = ++peticion.current;
    setCargando(true);
    void Promise.allSettled(
      AREAS.map((a) => obtenerIndicadores({ area: a.area, desde, hasta })),
    ).then((rs) => {
      if (n !== peticion.current) return;
      const out: Record<string, Resultado> = {};
      rs.forEach((r, i) => {
        out[AREAS[i].key] =
          r.status === 'fulfilled'
            ? { ok: true, data: r.value }
            : {
                ok: false,
                error: isExpedientesError(r.reason)
                  ? r.reason
                  : new ExpedientesError('servidor', 'No se pudieron cargar los indicadores.'),
              };
      });
      setRes(out);
      setVersion((v) => v + 1);
      setCargando(false);
    });
  }, [desde, hasta, recargaKey, reintento]);

  const errores = res ? Object.values(res).filter((r): r is { ok: false; error: ExpedientesError } => !r.ok) : [];
  const errorGlobal = errores.length === AREAS.length ? errores[0].error : null;
  const kpiRes = res?.[areaKpi];

  return (
    <div className="grid gap-4">
      <div className="mx-panel">
        <div className="mx-panel-head">
          <div>
            <h2 className="mx-h2">Indicadores por área</h2>
            <p className="text-xs mx-muted mt-0.5">
              Pólizas emitidas en el período. Sin fechas, se muestra el acumulado.
            </p>
          </div>
          <div className="mx-fechas">
            <label className="mx-field" htmlFor="mx-ind-desde">
              <span>Emitida desde</span>
              <input
                id="mx-ind-desde"
                type="date"
                className="mx-input"
                value={desde}
                max={hasta || undefined}
                onChange={(e) => setDesde(e.target.value)}
              />
            </label>
            <label className="mx-field" htmlFor="mx-ind-hasta">
              <span>Emitida hasta</span>
              <input
                id="mx-ind-hasta"
                type="date"
                className="mx-input"
                value={hasta}
                min={desde || undefined}
                onChange={(e) => setHasta(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {cargando && !res ? (
        <>
          <EsqueletoKpi />
          <div className="mx-panel">
            <Esqueleto filas={3} texto="Cargando indicadores…" />
          </div>
        </>
      ) : errorGlobal ? (
        <AvisoError error={errorGlobal} onReintentar={() => setReintento((n) => n + 1)} />
      ) : (
        <div ref={animRef} className={`grid gap-4 mx-ind-datos ${cargando ? 'is-recargando' : ''}`} aria-busy={cargando}>
          <div className="mx-kpi-areas" role="group" aria-label="Área de los indicadores principales">
            {AREAS.map((a) => (
              <button
                key={a.key}
                type="button"
                className="mx-kpi-area"
                aria-pressed={areaKpi === a.key}
                onClick={() => setAreaKpi(a.key)}
              >
                {a.titulo}
              </button>
            ))}
          </div>
          {!kpiRes ? null : !kpiRes.ok ? (
            <AvisoError error={kpiRes.error} onReintentar={() => setReintento((n) => n + 1)} />
          ) : (
            <>
              <KpiPrincipales d={kpiRes.data} clave={`${version}|${areaKpi}`} />
              <PanelesKpi d={kpiRes.data} escritorio={escritorio} onElegirActor={onElegirActor} />
            </>
          )}
          <Comparativo res={res} />
          <div className="mx-kpi-grid">
            {AREAS.map((a) => (
              <TarjetaArea
                key={a.key}
                titulo={a.titulo}
                Icon={a.Icon}
                resultado={res?.[a.key]}
                abiertaInicial={a.key === 'todas' || esEscritorio()}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const esEscritorio = () =>
  typeof window.matchMedia !== 'function' || window.matchMedia('(min-width: 1024px)').matches;

/** Estado documental de las áreas, lado a lado, para comparar de un vistazo. */
function Comparativo({ res }: { res: Record<string, Resultado> | null }) {
  const areas = AREAS.filter((a) => a.area);
  return (
    <section className="mx-panel" aria-labelledby="mx-ind-comp">
      <div className="mx-panel-head">
        <h3 id="mx-ind-comp" className="mx-h2">
          Estado documental por área
        </h3>
      </div>
      <div className="mx-ind-comparativo">
        {areas.map((a) => {
          const r = res?.[a.key];
          return (
            <div key={a.key} className="min-w-0">
              <p className="mx-ind-area-tit">
                {a.titulo}
                {r?.ok && <span className="mx-num">{numero(r.data.total)} pólizas</span>}
              </p>
              {!r ? null : !r.ok ? (
                <p className="text-xs mx-muted">No se pudo cargar esta área.</p>
              ) : (
                <BarraApilada titulo={`Estado documental · ${a.titulo}`} segmentos={segDocumental(r.data)} tituloOculto />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const segDocumental = (d: Indicadores) => [
  { label: 'Completos', valor: d.completos, tono: 'verde' as const },
  { label: 'Incompletos', valor: d.incompletos, tono: 'ambar' as const },
];

/**
 * Tarjeta de un área, plegable: en el móvil solo el consolidado arranca abierto para que la
 * pestaña no quede tan larga; el total se ve siempre en el encabezado.
 */
function TarjetaArea({
  titulo,
  Icon,
  resultado,
  abiertaInicial,
}: {
  titulo: string;
  Icon: Icono;
  resultado?: Resultado;
  abiertaInicial: boolean;
}) {
  const [abierta, setAbierta] = useState(abiertaInicial);
  return (
    <details
      className="mx-panel mx-ind-tarjeta"
      open={abierta}
      onToggle={(e) => setAbierta((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <span className="grid place-items-center h-9 w-9 rounded-lg bg-[#F0F2F8] text-[#0F1A5A] shrink-0">
          <Icon size={17} aria-hidden />
        </span>
        <h3 className="mx-h2">{titulo}</h3>
        {resultado?.ok && (
          <span className="mx-ind-total">
            <strong>{numero(resultado.data.total)}</strong>
            <span>pólizas emitidas</span>
          </span>
        )}
        <ChevronDown
          size={18}
          className={`mx-plegable-chev ${resultado?.ok ? '' : 'ml-auto'}`}
          aria-hidden
        />
      </summary>
      <div className="mx-ind-cuerpo">
        {!resultado ? null : !resultado.ok ? (
          <AvisoError error={resultado.error} />
        ) : (
          <Contenido d={resultado.data} />
        )}
      </div>
    </details>
  );
}

/**
 * Las 16 cifras del área en cuatro gráficos sencillos, cada uno con su número visible.
 * El color sigue el mismo código de estados del monitor; pago y recordatorios van en tinta neutra.
 */
function Contenido({ d }: { d: Indicadores }) {
  return (
    <>
      <BarraApilada titulo="Estado documental" segmentos={segDocumental(d)} />
      <BarrasH
        titulo="Documentos: atención y validación"
        filas={[
          { label: 'Con errores', valor: d.conErrores, tono: 'rojo' },
          { label: 'Datos cambiados', valor: d.datosModificados ?? 0, tono: 'violeta' },
          { label: 'Observados', valor: d.observados, tono: 'ambar' },
          { label: 'Por validar', valor: d.porValidar, tono: 'azul' },
          { label: 'Analizando', valor: d.analizando, tono: 'azul' },
          { label: 'Validados por IA', valor: d.validadosIa, tono: 'verde' },
        ]}
      />
      <BarraApilada
        titulo="Pago"
        segmentos={[
          { label: 'Pagadas', valor: d.pagadas, tono: 'tinta' },
          { label: 'Pendientes de pago', valor: d.pendientesPago, tono: 'gris' },
        ]}
      />
      <BarrasH
        titulo="Recordatorios"
        filas={[
          { label: 'Intentos de envío', valor: d.intentos },
          { label: 'Recuperados', valor: d.recuperados },
          { label: 'Sin correo', valor: d.sinCorreo },
          { label: 'No enviar', valor: d.noEnviar },
        ]}
      />
      <p className="text-xs mx-muted">
        <strong className="mx-num text-[#091133] text-sm">{numero(d.aseguradosUnicos)}</strong>{' '}
        asegurados únicos
      </p>
    </>
  );
}
