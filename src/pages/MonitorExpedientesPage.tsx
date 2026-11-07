import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, CheckCircle2, FileWarning, RefreshCw, Settings2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/nexus-auth';
import { isPortalAdmin } from '@/lib/portal-sso-config';
import { obtenerConfig, type ModoValidacion } from '@/lib/expedientes-api';
import { BandejaExpedientes } from './expedientes/BandejaExpedientes';
import { IndicadoresExpedientes } from './expedientes/IndicadoresExpedientes';
import { ConfiguracionExpedientes } from './expedientes/ConfiguracionExpedientes';
import { DetalleExpediente } from './expedientes/DetalleExpediente';
import './expedientes/expedientes.css';

type TabId = 'incompletos' | 'completos' | 'indicadores' | 'configuracion';

const TABS: { id: TabId; label: string; Icon: typeof FileWarning; admin?: boolean }[] = [
  { id: 'incompletos', label: 'Incompletos', Icon: FileWarning },
  { id: 'completos', label: 'Completos', Icon: CheckCircle2 },
  { id: 'indicadores', label: 'Indicadores', Icon: BarChart3 },
  { id: 'configuracion', label: 'Configuración', Icon: Settings2, admin: true },
];

/**
 * Monitor de expedientes Marketplace (solo lectura).
 * Visual nueva para abrir desde Sis2000 por SSO (iframe): sin menú ni encabezado del portal,
 * a ancho completo. Entrada: /sso?nexus_token=…&next=/monitor-expedientes
 * Parámetros: ?tab=incompletos|completos|indicadores|configuracion · ?exp=<id> abre el detalle.
 */
export const MonitorExpedientesPage: React.FC = () => {
  const user = getCurrentUser();
  const esAdmin = isPortalAdmin(user);
  const [params, setParams] = useSearchParams();
  const [recargaKey, setRecargaKey] = useState(0);
  const [modoValidacion, setModoValidacion] = useState<ModoValidacion | undefined>();

  const tabsVisibles = TABS.filter((t) => !t.admin || esAdmin);
  const pedido = params.get('tab') as TabId | null;
  const tab: TabId = tabsVisibles.some((t) => t.id === pedido) ? (pedido as TabId) : 'incompletos';
  const detalleId = params.get('exp');

  // Las pestañas se montan la primera vez que se abren y luego conservan sus filtros.
  const [visitadas, setVisitadas] = useState<Set<TabId>>(() => new Set([tab]));
  if (!visitadas.has(tab)) setVisitadas(new Set(visitadas).add(tab));

  useEffect(() => {
    const anterior = document.title;
    document.title = 'Monitor de expedientes | La Mundial de Seguros';
    return () => {
      document.title = anterior;
    };
  }, []);

  // El modo de validación sale de la configuración (solo administradores pueden leerla).
  useEffect(() => {
    if (!esAdmin) return;
    obtenerConfig()
      .then((r) => setModoValidacion(r.config.validacion))
      .catch(() => setModoValidacion(undefined));
  }, [esAdmin]);

  const setParam = useCallback(
    (clave: string, valor: string | null) => {
      setParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (valor) n.set(clave, valor);
          else n.delete(clave);
          return n;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const cerrarDetalle = useCallback(() => setParam('exp', null), [setParam]);
  const recargar = useCallback(() => setRecargaKey((n) => n + 1), []);

  const onTabKey = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const sig = (idx + (e.key === 'ArrowRight' ? 1 : -1) + tabsVisibles.length) % tabsVisibles.length;
    setParam('tab', tabsVisibles[sig].id);
    document.getElementById(`mx-tab-${tabsVisibles[sig].id}`)?.focus();
  };

  return (
    <div className="mx-app">
      <header className="mx-hero">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mx-eyebrow">Marketplace · Control documental</p>
            <h1 className="mx-title">Monitor de expedientes</h1>
            <p className="mx-subtitle">
              Estado documental de las pólizas emitidas. Los recordatorios al asegurado salen solos;
              aquí se consulta y se da seguimiento.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.nombre && (
              <span className="hidden sm:block text-right text-xs leading-tight">
                <span className="block font-semibold text-white">{user.nombre}</span>
                {user.canal && <span className="block text-white/60">{user.canal}</span>}
              </span>
            )}
            <button type="button" className="mx-hero-btn" onClick={recargar}>
              <RefreshCw size={14} aria-hidden />
              Actualizar
            </button>
          </div>
        </div>

        <div className="mx-tabs" role="tablist" aria-label="Secciones del monitor">
          {tabsVisibles.map(({ id, label, Icon }, i) => (
            <button
              key={id}
              id={`mx-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls={`mx-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              className="mx-tab"
              onClick={() => setParam('tab', id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-body">
        {tabsVisibles.map(({ id }) =>
          visitadas.has(id) ? (
            <div
              key={id}
              id={`mx-panel-${id}`}
              role="tabpanel"
              aria-labelledby={`mx-tab-${id}`}
              hidden={tab !== id}
            >
              {id === 'incompletos' && (
                <BandejaExpedientes
                  estadoDoc="incompleto"
                  recargaKey={recargaKey}
                  onAbrir={(expId) => setParam('exp', expId)}
                />
              )}
              {id === 'completos' && (
                <BandejaExpedientes
                  estadoDoc="completo"
                  recargaKey={recargaKey}
                  onAbrir={(expId) => setParam('exp', expId)}
                />
              )}
              {id === 'indicadores' && <IndicadoresExpedientes recargaKey={recargaKey} />}
              {id === 'configuracion' && esAdmin && (
                <ConfiguracionExpedientes onGuardado={(c) => setModoValidacion(c.validacion)} />
              )}
            </div>
          ) : null,
        )}
      </main>

      {detalleId && (
        <DetalleExpediente
          key={detalleId}
          id={detalleId}
          esAdmin={esAdmin}
          modoValidacion={modoValidacion}
          onCerrar={cerrarDetalle}
          onCambio={recargar}
        />
      )}
    </div>
  );
};

export default MonitorExpedientesPage;
