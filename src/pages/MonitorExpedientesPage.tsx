import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, CheckCircle2, FileWarning, Lock, RefreshCw, Settings2 } from 'lucide-react';
import { getCurrentUser, isSsoSession } from '@/lib/nexus-auth';
import { isPortalAdmin } from '@/lib/portal-sso-config';
import {
  esAccesoLibre,
  ExpedientesError,
  isExpedientesError,
  obtenerAccesoMonitor,
  obtenerConfig,
  type ModoValidacion,
} from '@/lib/expedientes-api';
import { AvisoError, Cargando } from './expedientes/expedientes-ui';
import { BandejaExpedientes, type FiltroActor } from './expedientes/BandejaExpedientes';
import { IndicadoresExpedientes } from './expedientes/IndicadoresExpedientes';
import { ConfiguracionExpedientes } from './expedientes/ConfiguracionExpedientes';
import { DetalleExpediente } from './expedientes/DetalleExpediente';
import { ResumenExpedientes } from './expedientes/ResumenExpedientes';
import './expedientes/expedientes.css';

type TabId = 'incompletos' | 'completos' | 'indicadores' | 'configuracion';

/** Indicadores es la primera pestaña y la que se abre por defecto. */
const TABS: { id: TabId; label: string; Icon: typeof FileWarning; admin?: boolean }[] = [
  { id: 'indicadores', label: 'Indicadores', Icon: BarChart3 },
  { id: 'incompletos', label: 'Incompletos', Icon: FileWarning },
  { id: 'completos', label: 'Completos', Icon: CheckCircle2 },
  { id: 'configuracion', label: 'Configuración', Icon: Settings2, admin: true },
];
const TAB_INICIAL: TabId = 'indicadores';

/**
 * Monitor de expedientes Marketplace (solo lectura).
 * Visual nueva para abrir desde Sis2000 por SSO (iframe): sin menú ni encabezado del portal,
 * a ancho completo. Entrada: /sso?nexus_token=…&next=/monitor-expedientes
 * Parámetros: ?tab=indicadores|incompletos|completos|configuracion · ?exp=<id> abre el detalle ·
 * ?canal=<código>|?productor=<código> (clic en el ranking de Indicadores) filtra la bandeja.
 * «Sin información» ya no es pestaña: Nexus concilia esas pólizas con el OCR o las descarta.
 * El encabezado muestra un resumen compacto en todas las pestañas.
 */
export const MonitorExpedientesPage: React.FC = () => {
  // Lista de acceso de Nexus (EXPEDIENTES_USUARIOS): quien no está, no ve el monitor.
  const [acceso, setAcceso] = useState<boolean | null>(null);
  const [error, setError] = useState<ExpedientesError | null>(null);

  useEffect(() => {
    let vigente = true;
    obtenerAccesoMonitor()
      .then((r) => {
        if (vigente) setAcceso(r.acceso);
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        setError(
          isExpedientesError(err)
            ? err
            : new ExpedientesError('servidor', 'No se pudo abrir el monitor de expedientes.'),
        );
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-app">
        <main className="mx-body">
          <AvisoError error={error} />
        </main>
      </div>
    );
  }
  if (acceso === null) {
    return (
      <div className="mx-app">
        <main className="mx-body">
          <Cargando texto="Abriendo el monitor…" />
        </main>
      </div>
    );
  }
  if (!acceso) {
    return (
      <div className="mx-app">
        <main className="mx-body">
          <div className="mx-estado" role="alert">
            <span className="mx-estado-icono" aria-hidden>
              <Lock size={26} />
            </span>
            <p className="mx-estado-titulo">No tiene acceso al monitor de expedientes</p>
            <p>Si lo necesita, solicítelo al equipo de Exélixi.</p>
          </div>
        </main>
      </div>
    );
  }
  return <MonitorExpedientes />;
};

const MonitorExpedientes: React.FC = () => {
  const user = getCurrentUser();
  // QA sin login (Nexus con EXPEDIENTES_ACCESO_LIBRE): todas las pestañas y acciones.
  const accesoLibre = !user && esAccesoLibre();
  const esAdmin = accesoLibre || isPortalAdmin(user);
  // Abierto por SSO (Sis2000/SysIP, /sso?…&next=/monitor-expedientes): sin pestaña
  // Configuración. Nexus además rechaza con 403 los cambios de configuración de esa sesión.
  const esSso = !accesoLibre && (isSsoSession() || user?.sso === true);
  const puedeConfigurar = esAdmin && !esSso;
  const [params, setParams] = useSearchParams();
  const [recargaKey, setRecargaKey] = useState(0);
  const [modoValidacion, setModoValidacion] = useState<ModoValidacion | undefined>();

  const tabsVisibles = TABS.filter((t) => !t.admin || puedeConfigurar);
  const pedido = params.get('tab') as TabId | null;
  const tab: TabId = tabsVisibles.some((t) => t.id === pedido) ? (pedido as TabId) : TAB_INICIAL;
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

  // Canal o productor elegido en el ranking de Indicadores (?canal= / ?productor=, ?actor=nombre).
  const canalParam = params.get('canal');
  const productorParam = params.get('productor');
  const filtroActor: FiltroActor | null = canalParam
    ? { grupo: 'canal', codigo: canalParam, nombre: params.get('actor') || canalParam }
    : productorParam
      ? { grupo: 'productor', codigo: productorParam, nombre: params.get('actor') || productorParam }
      : null;
  const elegirActor = useCallback(
    (grupo: 'canal' | 'productor', codigo: string, nombre: string) => {
      setParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.delete('canal');
          n.delete('productor');
          n.set(grupo, codigo);
          n.set('actor', nombre);
          n.set('tab', 'incompletos');
          return n;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  const quitarActor = useCallback(() => {
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete('canal');
        n.delete('productor');
        n.delete('actor');
        return n;
      },
      { replace: true },
    );
  }, [setParams]);

  const cerrarDetalle = useCallback(() => setParam('exp', null), [setParam]);
  const recargar = useCallback(() => setRecargaKey((n) => n + 1), []);

  // En pantallas chicas las pestañas se desplazan: la activa queda siempre a la vista.
  // Se mueve solo la tira de pestañas (no la página ni el Sis2000 que la contiene).
  useEffect(() => {
    const boton = document.getElementById(`mx-tab-${tab}`);
    const tira = boton?.parentElement;
    if (!boton || !tira) return;
    const izq = boton.getBoundingClientRect().left - tira.getBoundingClientRect().left + tira.scrollLeft;
    const der = izq + boton.offsetWidth;
    if (izq < tira.scrollLeft) tira.scrollLeft = Math.max(0, izq - 16);
    else if (der > tira.scrollLeft + tira.clientWidth) tira.scrollLeft = der - tira.clientWidth + 16;
  }, [tab]);

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
        <div className="mx-hero-top">
          <div className="mx-hero-textos">
            <p className="mx-eyebrow">Marketplace · Control documental</p>
            <h1 className="mx-title">Monitor de expedientes</h1>
            <p className="mx-subtitle">
              Estado documental de las pólizas emitidas. Los recordatorios al asegurado salen solos;
              aquí se consulta y se da seguimiento.
            </p>
          </div>
          <div className="mx-hero-acciones">
            {accesoLibre && (
              <span className="mx-aviso-qa" role="note">
                {/* El acceso libre ahora también puede estar activo en producción: el ambiente sale del dominio. */}
                {/(^|.)nexusqa.|localhost|cierrelmds/i.test(window.location.hostname) ? 'QA · ' : ''}Acceso libre sin login
              </span>
            )}
            {user?.nombre && (
              <span className="hidden sm:block text-right text-xs leading-tight">
                <span className="block font-semibold text-white">{user.nombre}</span>
                {user.canal && <span className="block text-white/60">{user.canal}</span>}
              </span>
            )}
            <button
              type="button"
              className="mx-hero-btn mx-hero-btn--auto"
              onClick={recargar}
              title="Actualizar"
            >
              <RefreshCw size={16} aria-hidden />
              <span className="mx-hero-btn-texto">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Sin filtros globales en la página: el resumen es el acumulado del monitor. */}
        <ResumenExpedientes recargaKey={recargaKey} />

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
              <Icon size={16} aria-hidden />
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
                  filtroActor={filtroActor}
                  onQuitarActor={quitarActor}
                  recargaKey={recargaKey}
                  modoValidacion={modoValidacion}
                  onAbrir={(expId) => setParam('exp', expId)}
                />
              )}
              {id === 'completos' && (
                <BandejaExpedientes
                  estadoDoc="completo"
                  filtroActor={filtroActor}
                  onQuitarActor={quitarActor}
                  recargaKey={recargaKey}
                  modoValidacion={modoValidacion}
                  onAbrir={(expId) => setParam('exp', expId)}
                />
              )}
              {id === 'indicadores' && (
                <IndicadoresExpedientes recargaKey={recargaKey} onElegirActor={elegirActor} />
              )}
              {id === 'configuracion' && puedeConfigurar && (
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
