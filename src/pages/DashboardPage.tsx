import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Activity,
  Bell, Settings, LogOut, Search,
  PlayCircle, Car, Building, Heart,
  ExternalLink, CheckCircle2, Zap, ArrowRight, Clock
} from 'lucide-react';
import { getCurrentUser, logout, getToken, ssoDelegate, registerAudit, getAuditLogs } from '@/lib/nexus-auth';
import type { AuditLog } from '@/lib/nexus-auth';
import { PRODUCTS } from '@/lib/portal-config';
import type { ProductConfig } from '@/lib/portal-config';

/* ═══════════════════════════════════════════════════
   DASHBOARD V2 — BENTO BOX & FLOATING NAV
   La Mundial de Seguros
   ═══════════════════════════════════════════════════ */

const PRODUCT_META: Record<string, {
  icon: React.ReactNode;
  cssIcon: string;
  modules: string[];
  gradient: string;
}> = {
  rcv: {
    icon: <Car size={28} />,
    cssIcon: 'text-[#E84F51]',
    modules: ['OCR', 'Formulario', 'Emisión', 'Pagos'],
    gradient: 'from-[#E84F51] to-[#B23F44]',
  },
  patrimonial: {
    icon: <Building size={28} />,
    cssIcon: 'text-[#0F1A5A]',
    modules: ['Emisión', 'Cotización', 'Póliza'],
    gradient: 'from-[#0F1A5A] to-[#091133]',
  },
  funerario: {
    icon: <Heart size={28} />,
    cssIcon: 'text-gray-400',
    modules: ['OCR', 'Formulario', 'Emisión'],
    gradient: 'from-gray-400 to-gray-500',
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

      const response = await ssoDelegate({ target: product.target, product: product.product });
      if (!response.success || !response.redirect_url) throw new Error('Error de SSO.');

      await registerAudit({
        accion: `launch_${product.key}`,
        producto: product.key,
        detalle: { method: 'sso_delegate', target: product.target },
      });

      window.open(response.redirect_url, '_blank', 'noopener,noreferrer');
      getAuditLogs().then(setRecentActivity).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert(`No se pudo abrir: ${msg}`);
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
    <div className="min-h-screen bg-[#F0F2F5] font-sans flex flex-col items-center">

      {/* ─── FLOATING NAV (ISLA) ─── */}
      <div className="w-full max-w-7xl px-4 sm:px-8 pt-6 pb-2 sticky top-0 z-50">
        <header className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[32px] px-4 py-3 flex items-center justify-between">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-4 pl-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <img src="/logo-mundial.png" alt="Logo" className="h-6 object-contain" />
            </div>
            <span className="hidden md:block font-display font-bold text-[#0F1A5A] text-lg tracking-tight">
              Portal Corporativo
            </span>
          </div>

          {/* Menú Flotante Central */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-100/50 p-1.5 rounded-full border border-gray-200/50">
            {NAV_ITEMS.map(item => (
              <button key={item.label} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${item.active ? 'bg-white text-[#0F1A5A] shadow-sm' : 'text-gray-500 hover:text-[#091133] hover:bg-gray-200/50'}`}>
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Acciones e Info de Usuario */}
          <div className="flex items-center gap-3 pr-2">
            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <Search size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#E84F51] border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            
            <div className="group relative cursor-pointer flex items-center gap-3 pl-1">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-[#091133] leading-none">{user.nombre}</p>
                <p className="text-[11px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0F1A5A] to-[#162A7F] flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              {/* Dropdown Logout */}
              <div className="absolute top-full mt-2 right-0 bg-white shadow-xl rounded-2xl p-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all border border-gray-100">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  <Settings size={16} /> Configuración
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ─── CONTENIDO BENTO GRID ─── */}
      <main className="w-full max-w-7xl px-4 sm:px-8 pt-4 pb-12 flex-1">
        
        {/* Header de Sección */}
        <div className="flex items-end justify-between mb-8 px-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#091133] mb-2 tracking-tight">
              Buenos días, {user.nombre.split(' ')[0]}
            </h1>
            <p className="text-gray-500 font-medium">
              Aquí tienes el estado actual de la operación.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Sistemas Óptimos
          </div>
        </div>

        {/* GRID BENTO (Asimétrico) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[160px]">

          {/* WIDGET 1: KPI Principal (Ocupa 2x1) */}
          <div className="md:col-span-2 row-span-1 bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Total Operaciones</p>
              <h2 className="text-5xl font-display font-bold text-[#091133]">{recentActivity.length}</h2>
            </div>
            <div className="w-20 h-20 rounded-[24px] bg-blue-50 flex items-center justify-center text-[#0F1A5A] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <Activity size={36} />
            </div>
          </div>

          {/* WIDGET 2: KPI Secundario (1x1) */}
          <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col justify-between hover:-translate-y-1 transition-transform">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#E84F51]">
                <Zap size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#091133]">{todayCount}</h3>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-1">Accesos Hoy</p>
            </div>
          </div>

          {/* WIDGET 3: Lanzador RCV (Ocupa 1x2 - Vertical Grande) */}
          {PRODUCTS.filter(p => p.key === 'rcv').map(product => (
            <div 
              key={product.key}
              onClick={() => !launching && handleLaunch(product)}
              className="md:col-span-1 row-span-2 bg-gradient-to-br from-[#0F1A5A] to-[#091133] rounded-[32px] p-8 shadow-[0_12px_40px_rgba(15,26,90,0.2)] text-white cursor-pointer relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 flex flex-col"
            >
              {/* Brillo de fondo */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[60px] group-hover:opacity-10 transition-opacity"></div>
              
              <div className="flex justify-between items-start mb-auto relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[24px] border border-white/20 flex items-center justify-center text-white">
                  <Car size={32} />
                </div>
                <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20">
                  Popular
                </div>
              </div>

              <div className="relative z-10 mt-6">
                <h3 className="text-3xl font-display font-bold mb-3">{product.label}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  {product.description}
                </p>
                <div className="flex items-center justify-between text-sm font-bold text-[#E84F51]">
                  <span>Lanzar Módulo</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
              
              {launching === product.key && (
                <div className="absolute inset-0 bg-[#0F1A5A]/90 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-white/20 border-t-[#E84F51] rounded-full animate-spin"></div>
                  <span className="font-bold text-white tracking-widest text-xs uppercase">Conectando...</span>
                </div>
              )}
            </div>
          ))}

          {/* WIDGET 4: Lanzadores Secundarios (Ocupan 2x1 cada uno si hay espacio, o 1x1) */}
          {PRODUCTS.filter(p => p.key !== 'rcv').map(product => {
            const meta = PRODUCT_META[product.key] || PRODUCT_META.funerario;
            return (
              <div 
                key={product.key}
                onClick={() => !launching && handleLaunch(product)}
                className="bg-white rounded-[32px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col cursor-pointer group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden"
              >
                <div className="flex items-start gap-5">
                  <div className={`w-14 h-14 rounded-[20px] bg-gray-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${meta.cssIcon}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#091133] mb-1 group-hover:text-[#E84F51] transition-colors">{product.label}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  </div>
                </div>
                <div className="mt-auto pt-5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Abrir SSO</span>
                  <ArrowRight size={18} className="text-[#E84F51]" />
                </div>

                {launching === product.key && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E84F51] rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* WIDGET 5: Actividad Reciente (Ocupa 2x2 o lo que reste) */}
          <div className="md:col-span-2 lg:col-span-2 row-span-2 bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#091133]">Bitácora de Eventos</h3>
                <p className="text-sm text-gray-400">Últimos accesos del sistema</p>
              </div>
              <button className="text-[#E84F51] text-sm font-bold bg-red-50 px-4 py-2 rounded-full hover:bg-red-100 transition-colors">
                Ver todo
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {recentActivity.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Clock size={32} className="text-gray-200 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Sin registros</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.slice(0, 5).map(log => (
                    <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                          {log.accion.includes('rcv') ? <Car size={16} /> : <PlayCircle size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#091133]">
                            {log.accion.replace('launch_', 'Lanzamiento ')}
                          </p>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                            {log.producto || 'Módulo'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-300">{formatTimeAgo(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
