import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Activity, Settings, 
  Search, Bell, ChevronDown, Shield, TrendingUp, Clock, 
  ArrowUpRight, AlertCircle, PlayCircle, Car, Building, Heart
} from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/nexus-auth';
import { PRODUCTS } from '@/lib/portal-config';
import type { ProductConfig } from '@/lib/portal-config';
import { buildModuleUrl } from '@/lib/module-launcher';
import { registerAudit, getToken, ssoDelegate, getAuditLogs } from '@/lib/nexus-auth';
import type { AuditLog } from '@/lib/nexus-auth';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [launching, setLaunching] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  React.useEffect(() => {
    if (user) {
      getAuditLogs().then(setRecentActivity).catch(console.error);
    }
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock data para darle aspecto de CRM
  // Eliminar mocks innecesarios

  const handleLaunch = async (product: ProductConfig) => {
    setLaunching(product.key);
    try {
      const token = getToken();
      if (!token) throw new Error('No hay sesión activa.');
      
      const targetMap: Record<string, 'ocr' | 'emision' | 'formulario' | 'pagos'> = {
        'rcv': 'ocr',
        'patrimonial': 'emision',
        'funerario': 'ocr'
      };

      const response = await ssoDelegate({
        target: targetMap[product.key] || 'ocr',
        product: product.key
      });

      if (!response.success || !response.redirect_url) {
        throw new Error('Fallo al obtener URL de SSO');
      }
      
      await registerAudit({
        accion: `launch_${product.key}`,
        producto: product.key,
        detalle: { method: 'sso_delegate', targetUrl: response.redirect_url.split('?')[0] },
      });
      
      window.open(response.redirect_url, '_blank', 'noopener,noreferrer');
      
      // Update activity after launch
      getAuditLogs().then(setRecentActivity).catch(console.error);
    } catch (err) {
      console.error('Error al lanzar módulo:', err);
      alert('Error al lanzar módulo. Verifica tu sesión y permisos de la empresa.');
    } finally {
      setLaunching(null);
    }
  };

  const getProductDecorations = (key: string) => {
    switch(key) {
      case 'rcv': return { color: '#E84F51', icon: <Car size={24} />, modules: ['OCR', 'Formulario', 'Emisión', 'Pagos'] };
      case 'patrimonial': return { color: '#0F1A5A', icon: <Building size={24} />, modules: ['Emisión', 'Cotización', 'Póliza'] };
      case 'funerario': return { color: '#888888', icon: <Heart size={24} />, modules: ['OCR', 'Formulario', 'Emisión'] };
      default: return { color: '#ACACAC', icon: <Shield size={24} />, modules: ['General'] };
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F7FB] overflow-hidden font-sans">
      
      {/* ─── SIDEBAR (Navegación CRM) ─── */}
      <aside className="w-64 bg-[#0F1A5A] text-white flex flex-col flex-shrink-0 transition-all duration-300 z-20 shadow-2xl">
        <div className="h-20 flex items-center px-6 border-b border-white/10 bg-[#091133]">
          <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm w-full flex justify-center">
            <img src="/logo-mundial.png" alt="La Mundial" className="h-8 object-contain mix-blend-multiply" />
          </div>
        </div>
        
        <div className="px-6 py-4 border-b border-white/5">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-1">Entorno de Empresa</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E84F51] flex items-center justify-center text-sm font-bold shadow-inner">
              {user.empresaId}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.nombre}</p>
              <p className="text-xs text-white/60 truncate">Portal Corporativo</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Menú Principal</p>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 text-white font-medium border border-white/5 shadow-sm">
            <LayoutDashboard size={18} className="text-[#E84F51]" />
            Dashboard
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <Users size={18} />
            Mis Clientes
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <FileText size={18} />
            Pólizas
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <Activity size={18} />
            Siniestros
          </button>

          <p className="px-3 text-xs font-bold uppercase tracking-widest text-white/40 mt-8 mb-3">Configuración</p>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors">
            <Settings size={18} />
            Ajustes
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/80 hover:bg-[#E84F51] hover:text-white transition-colors text-sm font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header Superior */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-10 relative">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-display font-bold text-[#0F1A5A]">Resumen Operativo</h1>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <div className="relative hidden sm:block w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar póliza, cliente..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F1A5A]/20 focus:border-[#0F1A5A] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-gray-400 hover:text-[#0F1A5A] transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E84F51] rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0F1A5A] to-[#162a7f] flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-all">
                {user.nombre.charAt(0)}
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-800 leading-none">{user.nombre}</p>
                <p className="text-xs text-gray-500 mt-1">{user.email}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400 group-hover:text-[#0F1A5A] transition-colors" />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-auto p-6 lg:p-8 relative">
          
          {/* Alertas Globales */}
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
            <Shield size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-blue-900">Conexión Segura SSO Activa</h4>
              <p className="text-xs text-blue-700 mt-0.5">Estás conectado al servidor <strong>{import.meta.env.VITE_NEXUS_API_URL || 'cierrelmds'}</strong>. Los flujos iniciados arrastrarán tu identidad automáticamente.</p>
            </div>
          </div>

          {/* KPI Stats Row (Real data based on audit logs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 animate-slide-up-delay-1">
            {[
              { label: 'Conexiones SSO Hoy', value: recentActivity.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString()).length.toString(), trend: '+5%', positive: true },
              { label: 'Módulos Activos', value: PRODUCTS.length.toString(), trend: 'Estable', positive: true },
              { label: 'Historial Total', value: recentActivity.length.toString(), trend: '+12%', positive: true },
              { label: 'Estado del Portal', value: 'OK', trend: 'En línea', positive: true },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-3xl font-display font-bold text-[#0F1A5A]">{stat.value}</h3>
                  <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${stat.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {stat.positive && <ArrowUpRight size={12} className="mr-1" />}
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Lanzadores Rápidos (SSO Flows) */}
            <div className="xl:col-span-1 animate-slide-up-delay-2">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PlayCircle size={18} className="text-[#E84F51]" />
                Lanzadores de Negocio
              </h2>
              <div className="flex flex-col gap-4">
              {PRODUCTS.map((product) => {
                const deco = getProductDecorations(product.key);
                const isLaunching = launching === product.key;
                return (
                <div 
                  key={product.key} 
                  onClick={() => handleLaunch(product)}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#0F1A5A]/30 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -z-10 group-hover:bg-[#0F1A5A]/5 transition-colors"></div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                         style={{ background: `linear-gradient(135deg, ${deco.color} 0%, ${deco.color}dd 100%)` }}>
                      <span className="text-white drop-shadow-md">{deco.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0F1A5A] transition-colors">{product.label}</h3>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 mt-1">
                        Flujo Integrado
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {deco.modules.map((mod, idx) => (
                      <span key={idx} className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                        {mod}
                      </span>
                    ))}
                  </div>
                  {isLaunching && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="flex items-center gap-2 text-[#E84F51] font-bold">
                        <Activity className="animate-pulse" size={20} /> Conectando...
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
              </div>
            </div>

            {/* Tabla de Datos Central (Actividad Reciente) */}
            <div className="xl:col-span-2 animate-slide-up-delay-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={18} className="text-[#0F1A5A]" />
                    Actividad Reciente SSO
                  </h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        <th className="px-6 py-4">ID Transacción</th>
                        <th className="px-6 py-4">Acción</th>
                        <th className="px-6 py-4">Producto</th>
                        <th className="px-6 py-4 text-right">Tiempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentActivity.slice(0, 8).map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-[#0F1A5A]">LOG-{log.id}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                            {log.accion}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {log.producto || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 text-right whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {recentActivity.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                            No hay actividad reciente en el portal.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
