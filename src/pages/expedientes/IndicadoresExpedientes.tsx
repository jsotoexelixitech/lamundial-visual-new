import React, { useEffect, useRef, useState } from 'react';
import { Building2, Layers, UserRound, Users } from 'lucide-react';
import {
  obtenerIndicadores,
  isExpedientesError,
  ExpedientesError,
  type Indicadores,
} from '@/lib/expedientes-api';
import { AvisoError, Cargando } from './expedientes-ui';
import { numero } from './expedientes-format';

type Icono = React.ComponentType<{ size?: number; 'aria-hidden'?: boolean; className?: string }>;

const AREAS: { key: string; area?: string; titulo: string; Icon: Icono }[] = [
  { key: 'todas', titulo: 'Consolidado', Icon: Layers },
  { key: 'C', area: 'C', titulo: 'Canales alternos', Icon: Building2 },
  { key: 'G', area: 'G', titulo: 'Gestores', Icon: Users },
  { key: 'P', area: 'P', titulo: 'Productores', Icon: UserRound },
];

type Resultado = { ok: true; data: Indicadores } | { ok: false; error: ExpedientesError };

export function IndicadoresExpedientes({ recargaKey }: { recargaKey: number }) {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [res, setRes] = useState<Record<string, Resultado> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [reintento, setReintento] = useState(0);
  const peticion = useRef(0);

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
      setCargando(false);
    });
  }, [desde, hasta, recargaKey, reintento]);

  const errores = res ? Object.values(res).filter((r): r is { ok: false; error: ExpedientesError } => !r.ok) : [];
  const errorGlobal = errores.length === AREAS.length ? errores[0].error : null;

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
          <div className="flex flex-wrap gap-3">
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
        <div className="mx-panel">
          <Cargando texto="Cargando indicadores…" />
        </div>
      ) : errorGlobal ? (
        <AvisoError error={errorGlobal} onReintentar={() => setReintento((n) => n + 1)} />
      ) : (
        <div className={`mx-kpi-grid ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {AREAS.map((a) => {
            const r = res?.[a.key];
            return (
              <TarjetaArea key={a.key} titulo={a.titulo} Icon={a.Icon} resultado={r} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TarjetaArea({
  titulo,
  Icon,
  resultado,
}: {
  titulo: string;
  Icon: Icono;
  resultado?: Resultado;
}) {
  return (
    <section className="mx-panel p-4 grid gap-3 content-start" aria-label={titulo}>
      <div className="flex items-center gap-2">
        <span className="grid place-items-center h-8 w-8 rounded-lg bg-[#F0F2F8] text-[#0F1A5A]">
          <Icon size={16} aria-hidden />
        </span>
        <h3 className="mx-h2">{titulo}</h3>
      </div>

      {!resultado ? null : !resultado.ok ? (
        <AvisoError error={resultado.error} />
      ) : (
        <Contenido d={resultado.data} />
      )}
    </section>
  );
}

function Contenido({ d }: { d: Indicadores }) {
  const pct = d.total > 0 ? Math.round((d.completos / d.total) * 100) : 0;
  const mini: [string, number][] = [
    ['Completos', d.completos],
    ['Incompletos', d.incompletos],
    ['Por validar', d.porValidar],
    ['Observados', d.observados],
    ['Pagadas', d.pagadas],
    ['Pendientes de pago', d.pendientesPago],
    ['Sin correo', d.sinCorreo],
    ['No enviar', d.noEnviar],
    ['Intentos de envío', d.intentos],
    ['Recuperados', d.recuperados],
    ['Asegurados únicos', d.aseguradosUnicos],
  ];
  return (
    <>
      <div>
        <p className="mx-kpi-hero">{numero(d.total)}</p>
        <p className="text-xs mx-muted">pólizas emitidas</p>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="mx-muted">Expediente completo</span>
          <span className="font-semibold mx-num">{pct} %</span>
        </div>
        <div
          className="mx-bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porcentaje de pólizas con expediente completo"
        >
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="mx-kpi-mini">
        {mini.map(([label, v]) => (
          <div key={label}>
            <strong>{numero(v)}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
