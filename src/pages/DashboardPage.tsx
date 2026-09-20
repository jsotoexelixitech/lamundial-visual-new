import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Activity, Settings,
  Bell, ChevronDown, Shield, Clock, LogOut,
  ArrowUpRight, PlayCircle, Car, Building, Heart,
  ExternalLink, CheckCircle2, Zap, Search
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
    icon: <Car size={24} />,
    cssCard: 'product-card',
    cssIcon: 'text-[#E84F51]',
    modules: ['OCR', 'Formulario', 'Emisión', 'Pagos'],
    gradient: '#E84F51',
  },
  patrimonial: {
    icon: <Building size={24} />,
    cssCard: 'product-card',
    cssIcon: 'text-[#0F1A5A]',
    modules: ['Emisión', 'Cotización', 'Póliza'],
    gradient: '#0F1A5A',
  },
  funerario: {
    icon: <Heart size={24} />,
    cssCard: 'product-card',
    cssIcon: 'text-[#ACACAC]',
    modules: ['OCR', 'Formulario', 'Emisión'],
    gradient: '#ACACAC',
  },
};

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Users, label: 'Gestión de Clientes', active: false },
  { icon: FileText, label: 'Pólizas Activas', active: false },
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
      getAuditLogs().then(setRecentActivity).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`No se pudo abrir el módulo: ${msg}`);
    } finally {
      setLaunching(null);
    }
  };

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
    <div className="flex h-screen overflow-hidden bg-[#F4F6F9] font-sans">

      {/* ═══ SIDEBAR CLEAN Y CORPORATIVO ═══ */}
      <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
        {/* Línea superior roja (Detalle de marca) */}
        <div className="h-1 w-full bg-[#E84F51] absolute top-0 left-0 right-0"></div>
        
        {/* Logo */}
        <div className="h-[90px] flex items-center px-8 border-b border-gray-100 mt-1">
          <img
            src="/logo-mundial.png"
            alt="La Mundial de Seguros"
            className="h-12 object-contain"
          />
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-5 py-8 space-y-2 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4">
            Menú Principal
          </p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                item.active
                  ? 'bg-[#0F1A5A] text-white shadow-md shadow-[#0F1A5A]/20'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-[#0F1A5A]'
              }`}
            >
              <item.icon size={20} className={item.active ? 'text-white' : 'text-gray-400'} />
              {item.label}
            </button>
          ))}

          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-10 mb-4">
            Configuración
          </p>
          <button className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-[#0F1A5A] transition-all duration-200">
            <Settings size={20} className="text-gray-400" />
            Ajustes del Sistema
          </button>
        </nav>

        {/* Perfil del usuario al fondo */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E84F51] flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-[#091133] truncate">{user.nombre}</p>
                <p className="text-[11px] font-medium text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-[#E84F51] hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ CONTENIDO PRINCIPAL ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Header Superior Limpio */}
        <header className="h-[90px] flex-shrink-0 bg-[#F4F6F9]/80 backdrop-blur-md flex items-center justify-between px-10 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-[#091133] font-display">
              Resumen Corporativo
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-[#059669] shadow-sm border border-gray-100">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse"></span>
              Sistema Conectado
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Buscador Global (Visual) */}
            <div className="hidden lg:flex items-center relative">
              <Search size={18} className="absolute left-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar pólizas, clientes..." 
                className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#0F1A5A]/20 focus:border-[#0F1A5A] transition-all"
              />
            </div>
            
            <button className="relative p-3 rounded-full bg-white border border-gray-200 hover:shadow-md transition-all text-gray-500 hover:text-[#0F1A5A]">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#E84F51] border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Área scrollable principal */}
        <main className="flex-1 overflow-auto px-10 pb-10">

          {/* ─── TARJETAS FLOTANTES DE KPIs ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Accesos Hoy', value: todayCount, icon: <Zap size={22} />, color: '#E84F51', bg: 'bg-red-50' },
              { label: 'Productos Activos', value: PRODUCTS.length, icon: <Shield size={22} />, color: '#0F1A5A', bg: 'bg-blue-50' },
              { label: 'Total Operaciones', value: recentActivity.length, icon: <Activity size={22} />, color: '#091133', bg: 'bg-gray-100' },
              { label: 'Estado', value: 'Óptimo', icon: <CheckCircle2 size={22} />, color: '#059669', bg: 'bg-green-50' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center ${kpi.bg} group-hover:scale-110 transition-transform duration-300`} style={{ color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <ArrowUpRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-[13px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  {kpi.label}
                </p>
                <h3 className="text-3xl font-display font-bold text-[#091133]">
                  {kpi.value}
                </h3>
              </div>
            ))}
          </div>

          {/* ─── DOS COLUMNAS: PORTAFOLIO Y ACTIVIDAD ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Columna Izquierda: Lanzadores (2/3) */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#091133] font-display flex items-center gap-2">
                  <PlayCircle size={22} className="text-[#E84F51]" />
                  Portafolio de Productos
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PRODUCTS.map((product) => {
                  const meta = PRODUCT_META[product.key] || PRODUCT_META.funerario;
                  const isLaunching = launching === product.key;

                  return (
                    <div
                      key={product.key}
                      onClick={() => !isLaunching && handleLaunch(product)}
                      className="bg-white rounded-[24px] p-7 shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden group"
                    >
                      {/* Línea lateral de color */}
                      <div className="absolute top-0 bottom-0 left-0 w-1.5" style={{ backgroundColor: meta.gradient }}></div>
                      
                      <div className="flex items-center justify-between mb-5">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-white group-hover:shadow-md transition-all ${meta.cssIcon}`}>
                          {meta.icon}
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500 border border-gray-100">
                          <ExternalLink size={12} /> SSO
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#091133] mb-2">{product.label}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-auto pt-5 border-t border-gray-50">
                        {meta.modules.map((mod) => (
                          <span
                            key={mod}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-100"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>

                      {/* Overlay Carga */}
                      {isLaunching && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-20">
                          <div className="flex flex-col items-center gap-3 font-bold text-[#0F1A5A]">
                            <div className="w-10 h-10 border-4 border-[#0F1A5A]/20 border-t-[#E84F51] rounded-full animate-spin"></div>
                            Conectando...
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna Derecha: Timeline Actividad (1/3) */}
            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#091133] font-display flex items-center gap-2">
                  <Clock size={22} className="text-[#0F1A5A]" />
                  Bitácora Reciente
                </h2>
              </div>

              <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                  
                  {recentActivity.slice(0, 6).map((log, index) => (
                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-50 text-gray-400 group-hover:text-[#E84F51] group-hover:bg-red-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors z-10">
                        {log.accion.includes('rcv') ? <Car size={16} /> : log.accion.includes('patrimonial') ? <Building size={16} /> : <Zap size={16} />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#091133] text-sm">
                            {log.producto || 'Sistema'}
                          </span>
                          <time className="text-[11px] font-bold text-gray-400">{formatTimeAgo(log.createdAt)}</time>
                        </div>
                        <p className="text-xs text-gray-500 leading-tight">
                          {log.accion.replace('launch_', 'Lanzamiento de ')}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentActivity.length === 0 && (
                    <div className="text-center py-10 relative z-10">
                      <Activity size={32} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm font-bold text-gray-500">Sin movimientos</p>
                      <p className="text-xs text-gray-400 mt-1">Tu actividad reciente aparecerá aquí.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
