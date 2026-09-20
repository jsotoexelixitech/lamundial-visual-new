import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, RefreshCw } from 'lucide-react';
import { getCurrentUser, getAuditLogs, type AuditLog } from '@/lib/nexus-auth';
import { PortalHeader } from '@/components/PortalHeader';

const ACTION_LABELS: Record<string, string> = {
  launch_rcv: 'Lanzar RCV',
  launch_patrimonial: 'Lanzar Patrimoniales',
  launch_funerario: 'Lanzar Funerario',
  login: 'Login',
};

const PRODUCT_BADGES: Record<string, { label: string; color: string }> = {
  rcv:          { label: 'RCV',          color: '#E84F51' },
  patrimonial:  { label: 'Patrimoniales', color: '#0F1A5A' },
  funerario:    { label: 'Funerario',    color: '#ACACAC' },
};

export const AuditPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!user) { navigate('/login'); return null; }

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch {
      setError('No se pudo cargar el historial. Asegúrate de tener el endpoint /api/portal/audit activo en nexus-api.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F7' }} id="audit-page">
      <PortalHeader active="audit" />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={20} style={{ color: '#E84F51' }} />
              <h1 className="text-2xl font-display font-bold text-mundial-gray">Historial de acciones</h1>
            </div>
            <p className="text-gray-500 text-sm">Registro de actividad de tu sesión en el portal.</p>
          </div>
          <button
            id="audit-refresh"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up-delay-1">
          {[
            { label: 'Total acciones', value: logs.length },
            { label: 'RCV lanzados', value: logs.filter((l) => l.producto === 'rcv').length },
            { label: 'Patrimoniales', value: logs.filter((l) => l.producto === 'patrimonial').length },
            { label: 'Funerario', value: logs.filter((l) => l.producto === 'funerario').length },
          ].map((s) => (
            <div key={s.label} className="stat-card rounded-2xl p-5">
              <p className="text-2xl font-display font-bold text-mundial-gray">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-slide-up-delay-2">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-mundial-gray">Últimas acciones</h2>
            <span className="text-xs text-gray-400">{logs.length} registros</span>
          </div>

          {error && (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-400 text-sm">{error}</p>
              <p className="text-xs text-gray-300 mt-2">
                Endpoint requerido: <code className="bg-gray-100 px-2 py-0.5 rounded">GET /api/portal/audit</code>
              </p>
            </div>
          )}

          {!error && loading && (
            <div className="px-6 py-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-gray-200 rounded-full animate-spin"
                   style={{ borderTopColor: '#E84F51' }} />
              <p className="text-gray-400 text-sm mt-3">Cargando historial...</p>
            </div>
          )}

          {!error && !loading && logs.length === 0 && (
            <div className="px-6 py-12 text-center">
              <BarChart2 size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 font-medium">Sin acciones registradas aún</p>
              <p className="text-gray-300 text-sm mt-1">Las acciones aparecerán cuando lances un módulo desde el dashboard.</p>
            </div>
          )}

          {!error && !loading && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="audit-table">
                    <th className="px-6 py-3 text-left">Fecha</th>
                    <th className="px-6 py-3 text-left">Acción</th>
                    <th className="px-6 py-3 text-left">Producto</th>
                    <th className="px-6 py-3 text-left">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => {
                    const badge = log.producto ? PRODUCT_BADGES[log.producto] : null;
                    return (
                      <tr key={log.id} className="audit-row">
                        <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 font-medium text-mundial-gray">
                          {ACTION_LABELS[log.accion] ?? log.accion}
                        </td>
                        <td className="px-6 py-4">
                          {badge ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{ background: `${badge.color}15`, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-xs max-w-xs truncate">
                          {log.detalle ? JSON.stringify(log.detalle) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuditPage;
