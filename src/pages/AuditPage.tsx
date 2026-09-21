import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, RefreshCw } from 'lucide-react';
import { getCurrentUser, getAuditLogs, type AuditLog } from '@/lib/nexus-auth';

const ACTION_LABELS: Record<string, string> = {
  launch_rcv: 'Lanzar RCV',
  launch_patrimonial: 'Lanzar Patrimoniales',
  launch_funerario: 'Lanzar Funerario',
  login: 'Login',
};

const PRODUCT_BADGES: Record<string, { label: string; color: string }> = {
  rcv: { label: 'RCV', color: '#E84F51' },
  patrimonial: { label: 'Patrimoniales', color: '#0F1A5A' },
  funerario: { label: 'Funerario', color: '#2E6DBF' },
};

export const AuditPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    void load();
  }, [user, navigate]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
  };

  if (!user) return null;

  return (
    <div className="portal-page">
      <div className="portal-page-header flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="portal-page-eyebrow">Trazabilidad</p>
          <h1 className="portal-page-title flex items-center gap-2">
            <BarChart2 size={26} className="text-[#E84F51]" />
            Bitácora de acciones
          </h1>
          <p className="portal-page-subtitle">Registro de actividad de tu sesión en el portal.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e4e6ee] bg-white text-sm font-semibold text-[#0F1A5A] hover:bg-[#F0F2F8] transition-colors shrink-0"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="portal-page-body">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total acciones', value: logs.length },
            { label: 'RCV lanzados', value: logs.filter((l) => l.producto === 'rcv').length },
            { label: 'Patrimoniales', value: logs.filter((l) => l.producto === 'patrimonial').length },
            { label: 'Funerario', value: logs.filter((l) => l.producto === 'funerario').length },
          ].map((s) => (
            <div key={s.label} className="portal-panel rounded-xl p-4">
              <p className="text-2xl font-display font-bold text-[#091133]">{s.value}</p>
              <p className="text-xs text-[#777777] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="portal-panel rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#eceef4] flex items-center justify-between">
            <h2 className="font-semibold text-[#091133]">Últimas acciones</h2>
            <span className="text-xs text-[#ACACAC]">{logs.length} registros</span>
          </div>

          {error && (
            <div className="px-6 py-8 text-center">
              <p className="text-[#777777] text-sm">{error}</p>
            </div>
          )}

          {!error && loading && (
            <div className="px-6 py-12 text-center">
              <div
                className="inline-block w-8 h-8 border-2 border-[#e4e6ee] rounded-full animate-spin"
                style={{ borderTopColor: '#E84F51' }}
              />
              <p className="text-[#777777] text-sm mt-3">Cargando historial…</p>
            </div>
          )}

          {!error && !loading && logs.length === 0 && (
            <div className="px-6 py-12 text-center">
              <BarChart2 size={40} className="mx-auto mb-3 text-[#dddddd]" />
              <p className="text-[#777777] font-medium">Sin acciones registradas aún</p>
            </div>
          )}

          {!error && !loading && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F7F7] text-[#777777] text-xs uppercase tracking-wide">
                    <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-left font-semibold">Acción</th>
                    <th className="px-5 py-3 text-left font-semibold">Producto</th>
                    <th className="px-5 py-3 text-left font-semibold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f8]">
                  {logs.map((log) => {
                    const badge = log.producto ? PRODUCT_BADGES[log.producto] : null;
                    return (
                      <tr key={log.id} className="hover:bg-[#fafbfc]">
                        <td className="px-5 py-3.5 text-[#777777] text-xs whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#091133]">
                          {ACTION_LABELS[log.accion] ?? log.accion}
                        </td>
                        <td className="px-5 py-3.5">
                          {badge ? (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
                              style={{ background: `${badge.color}14`, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                          ) : (
                            <span className="text-[#ACACAC]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[#777777] text-xs max-w-xs truncate">
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
      </div>
    </div>
  );
};

export default AuditPage;
