import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Activity, Settings,
  Bell, ChevronDown, Shield, Clock, LogOut,
  ArrowUpRight, PlayCircle, Car, Building, Heart,
  ExternalLink, CheckCircle2, Zap
} from 'lucide-react';
import { getCurrentUser, logout, getToken, ssoDelegate, registerAudit, getAuditLogs } from '@/lib/nexus-auth';
import type { AuditLog } from '@/lib/nexus-auth';
import { PRODUCTS } from '@/lib/portal-config';
import type { ProductConfig } from '@/lib/portal-config';

/* ═══════════════════════════════════════════════════
   DASHBOARD — Portal Corporativo La Mundial de Seguros
   Manual de Marca: Azul Pennsylvania #0F1A5A · Rojo Imperial #E84F51
   ═══════════════════════════════════════════════════ */

const PRODUCT_META: Record<string, {
  icon: React.ReactNode;
  cssCard: string;
  cssIcon: string;
  modules: string[];
  gradient: string;
}> = {
  rcv: {
    icon: <Car size={22} />,
    cssCard: 'product-card product-card-rcv',
    cssIcon: 'product-icon-rcv',
    modules: ['OCR', 'Formulario', 'Emisión', 'Pagos'],
    gradient: 'linear-gradient(135deg, #E84F51 0%, #B23F44 100%)',
  },
  patrimonial: {
    icon: <Building size={22} />,
    cssCard: 'product-card product-card-patrimonial',
    cssIcon: 'product-icon-patrimonial',
    modules: ['Emisión', 'Cotización', 'Póliza'],
    gradient: 'linear-gradient(135deg, #0F1A5A 0%, #091133 100%)',
  },
  funerario: {
    icon: <Heart size={22} />,
    cssCard: 'product-card product-card-funerario',
    cssIcon: 'product-icon-funerario',
    modules: ['OCR', 'Formulario', 'Emisión'],
    gradient: 'linear-gradient(135deg, #ACACAC 0%, #777777 100%)',
  },
};

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Users, label: 'Clientes', active: false },
  { icon: FileText, label: 'Pólizas', active: false },
  { icon: Activity, label: 'Siniestros', active: false },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [launching, setLaunching] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (user) {
      getAuditLogs().then(setRecentActivity).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLaunch = async (product: ProductConfig) => {
    setLaunching(product.key);
    try {
      const token = getToken();
      if (!token) throw new Error('Sin sesión.');

      const response = await ssoDelegate({
        target: product.target,
        product: product.product,
      });

      if (!response.success || !response.redirect_url) {
        throw new Error('No se pudo generar la URL de acceso.');
      }

      await registerAudit({
        accion: `launch_${product.key}`,
        producto: product.key,
        detalle: { method: 'sso_delegate', target: product.target },
      });

      window.open(response.redirect_url, '_blank', 'noopener,noreferrer');

      // Refrescar actividad
      getAuditLogs().then(setRecentActivity).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`No se pudo abrir el módulo: ${msg}`);
    } finally {
      setLaunching(null);
    }
  };

  // KPIs derivados de datos reales
  const todayCount = recentActivity.filter(
    (a) => new Date(a.createdAt).toDateString() === new Date().toDateString(),
  ).length;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F4F6FA' }}>

      {/* ═══ SIDEBAR — Navy gradient oficial ═══ */}
      <aside
        className="w-[260px] flex flex-col flex-shrink-0 z-20"
        style={{ background: 'linear-gradient(180deg, #091133 0%, #0F1A5A 100%)' }}
      >
        {/* Logo oficial La Mundial de Seguros */}
        <div className="h-20 flex items-center justify-center px-5 border-b border-white/10">
          <div className="bg-white rounded-xl px-4 py-2 w-full flex justify-center shadow-sm">
            <img
              src="/logo-mundial.png"
              alt="La Mundial de Seguros"
              className="h-10 object-contain mix-blend-multiply"
            />
          </div>
        </div>

        {/* Perfil del usuario */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #E84F51 0%, #B23F44 100%)' }}
            >
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.nombre}</p>
              <p className="text-[11px] text-white/50 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mb-3">
            Menú Principal
          </p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                item.active
                  ? 'bg-white/12 text-white border border-white/8 shadow-sm'
                  : 'text-white/50 hover:bg-white/6 hover:text-white/80'
              }`}
            >
              <item.icon size={18} className={item.active ? 'text-[#E84F51]' : ''} />
              {item.label}
            </button>
          ))}

          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mt-8 mb-3">
            Sistema
          </p>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:bg-white/6 hover:text-white/80 transition-all duration-200">
            <Settings size={18} />
            Configuración
          </button>
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all duration-200"
            style={{ background: 'rgba(232, 79, 81, 0.08)' }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ═══ CONTENIDO PRINCIPAL ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header con ribbon brand */}
        <header className="flex-shrink-0 bg-white shadow-sm relative z-10">
          {/* Ribbon brand — línea decorativa superior oficial */}
          <div
            className="h-[3px] w-full"
            style={{ background: 'linear-gradient(90deg, #0F1A5A 0%, #162A7F 50%, #E84F51 100%)' }}
          />
          <div className="h-[68px] flex items-center justify-between px-8">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold" style={{ color: '#091133' }}>
                Portal Corporativo
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: 'rgba(15, 26, 90, 0.06)', color: '#0F1A5A' }}>
                <CheckCircle2 size={12} />
                Conectado
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Bell size={20} className="text-gray-400" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E84F51] border-2 border-white" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #0F1A5A 0%, #162A7F 100%)' }}
                >
                  {user.nombre.charAt(0)}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-800 leading-none">{user.nombre}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Empresa #{user.empresaId}</p>
                </div>
                <ChevronDown size={14} className="text-gray-300" />
              </div>
            </div>
          </div>
        </header>

        {/* Área scrollable */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">

          {/* ─── FILA DE KPIs ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {[
              {
                label: 'Accesos Hoy',
                value: todayCount,
                icon: <Zap size={20} />,
                color: '#E84F51',
                bg: 'rgba(232, 79, 81, 0.08)',
              },
              {
                label: 'Productos Activos',
                value: PRODUCTS.length,
                icon: <Shield size={20} />,
                color: '#0F1A5A',
                bg: 'rgba(15, 26, 90, 0.06)',
              },
              {
                label: 'Total Operaciones',
                value: recentActivity.length,
                icon: <Activity size={20} />,
                color: '#162A7F',
                bg: 'rgba(22, 42, 127, 0.06)',
              },
              {
                label: 'Estado Sistema',
                value: 'Activo',
                icon: <CheckCircle2 size={20} />,
                color: '#059669',
                bg: 'rgba(5, 150, 105, 0.06)',
              },
            ].map((kpi, i) => (
              <div
                key={i}
                className={`stat-card rounded-2xl p-5 animate-slide-up-delay-${i + 1}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: kpi.bg, color: kpi.color }}
                  >
                    {kpi.icon}
                  </span>
                  <ArrowUpRight size={16} className="text-gray-300" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: '#091133' }}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* ─── GRID PRINCIPAL: Productos + Actividad ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* Columna: Productos (3/5) */}
            <div className="xl:col-span-3 animate-slide-up-delay-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: '#091133' }}>
                  <PlayCircle size={18} className="text-[#E84F51]" />
                  Lanzadores de Producto
                </h2>
                <span className="text-[11px] text-gray-400 font-medium">
                  {PRODUCTS.length} disponibles
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {PRODUCTS.map((product) => {
                  const meta = PRODUCT_META[product.key] || PRODUCT_META.funerario;
                  const isLaunching = launching === product.key;

                  return (
                    <div
                      key={product.key}
                      onClick={() => !isLaunching && handleLaunch(product)}
                      className={`${meta.cssCard} rounded-2xl p-5 flex flex-col relative`}
                    >
                      {/* Ribbon brand superior */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                        style={{ background: meta.gradient }}
                      />

                      {/* Icono + Nombre */}
                      <div className="flex items-start gap-3 mb-4 mt-1">
                        <div
                          className={`${meta.cssIcon} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
                        >
                          <span className="text-white">{meta.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold" style={{ color: '#091133' }}>
                            {product.label}
                          </h3>
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            <ExternalLink size={10} />
                            SSO Integrado
                          </span>
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-[13px] text-gray-500 leading-relaxed flex-1 mb-4">
                        {product.description}
                      </p>

                      {/* Módulos / Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {meta.modules.map((mod) => (
                          <span
                            key={mod}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded"
                            style={{
                              background: 'rgba(15, 26, 90, 0.05)',
                              color: '#0F1A5A',
                            }}
                          >
                            {mod}
                          </span>
                        ))}
                      </div>

                      {/* Overlay de carga */}
                      {isLaunching && (
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex items-center justify-center z-20 rounded-2xl">
                          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: '#E84F51' }}>
                            <Activity className="animate-pulse" size={18} />
                            Conectando vía SSO…
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna: Actividad reciente (2/5) */}
            <div className="xl:col-span-2 animate-slide-up-delay-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: '#091133' }}>
                  <Clock size={18} style={{ color: '#0F1A5A' }} />
                  Actividad Reciente
                </h2>
                <span className="text-[11px] text-gray-400 font-medium">
                  Últimas {Math.min(recentActivity.length, 10)} entradas
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Header de tabla */}
                <div className="grid grid-cols-[1fr_1fr_auto] px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Acción</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Producto</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Tiempo</span>
                </div>

                {/* Filas */}
                <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                  {recentActivity.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="audit-row grid grid-cols-[1fr_1fr_auto] items-center px-5 py-3.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: log.accion.includes('rcv')
                              ? 'rgba(232, 79, 81, 0.1)'
                              : 'rgba(15, 26, 90, 0.06)',
                          }}
                        >
                          {log.accion.includes('rcv') ? (
                            <Car size={14} style={{ color: '#E84F51' }} />
                          ) : log.accion.includes('patrimonial') ? (
                            <Building size={14} style={{ color: '#0F1A5A' }} />
                          ) : (
                            <Zap size={14} style={{ color: '#162A7F' }} />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {log.accion.replace('launch_', 'Lanzamiento ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 capitalize">
                        {log.producto || '—'}
                      </span>
                      <span className="text-xs text-gray-400 font-medium text-right whitespace-nowrap">
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>
                  ))}

                  {recentActivity.length === 0 && (
                    <div className="px-5 py-12 text-center">
                      <Clock size={32} className="mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-400 font-medium">
                        Sin actividad registrada
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        Lanza un producto para ver el historial aquí
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── FOOTER BRAND ─── */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[11px] text-gray-300 font-medium">
              © {new Date().getFullYear()} La Mundial de Seguros — Portal Corporativo v2.0
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[11px] text-gray-400 font-medium">Sistema en línea</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
