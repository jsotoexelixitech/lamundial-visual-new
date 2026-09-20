import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Activity, Settings, 
  Search, Bell, ChevronDown, Shield, TrendingUp, Clock, 
  ArrowUpRight, AlertCircle, PlayCircle 
} from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/nexus-auth';
import { PRODUCTS } from '@/lib/portal-config';
import type { ProductConfig } from '@/lib/portal-config';
import { LaunchModal } from '@/components/LaunchModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [selectedProduct, setSelectedProduct] = useState<ProductConfig | null>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock data para darle aspecto de CRM
  const recentActivity = [
    { id: 'POL-2026-8921', type: 'Emisión RCV', client: 'Constructora Alfa', amount: '$120.00', status: 'Completado', time: 'Hace 10 min' },
    { id: 'COT-2026-3341', type: 'Cotización Patrimonial', client: 'Inversiones Omega', amount: '$4,500.00', status: 'Pendiente', time: 'Hace 1 hora' },
    { id: 'FUN-2026-1102', type: 'Póliza Funerario', client: 'Juan Carlos Pérez', amount: '$45.00', status: 'Completado', time: 'Hace 3 horas' },
    { id: 'POL-2026-8920', type: 'Emisión RCV', client: 'Distribuidora Retail', amount: '$85.00', status: 'Completado', time: 'Ayer' },
    { id: 'SIN-2026-0042', type: 'Siniestro Auto', client: 'María González', amount: '-', status: 'En revisión', time: 'Ayer' },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pendiente': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'En revisión': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

          {/* KPI Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 animate-slide-up-delay-1">
            {[
              { label: 'Pólizas Emitidas (Mes)', value: '142', trend: '+12%', positive: true },
              { label: 'Cotizaciones Pendientes', value: '28', trend: '-5%', positive: false },
              { label: 'Ingresos Estimados', value: '$24,500', trend: '+18%', positive: true },
              { label: 'Siniestros Activos', value: '5', trend: 'Estable', positive: true },
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
                {PRODUCTS.map((product) => (
                  <div 
                    key={product.key} 
                    onClick={() => setSelectedProduct(product)}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#0F1A5A]/30 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -z-10 group-hover:bg-[#0F1A5A]/5 transition-colors"></div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                           style={{ background: `linear-gradient(135deg, ${product.color} 0%, ${product.color}dd 100%)` }}>
                        <span className="text-white drop-shadow-sm">{product.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0F1A5A] transition-colors">{product.title}</h3>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 mt-1">
                          Flujo Integrado
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {product.modules.map((mod, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                          {mod.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla de Datos Central (Actividad Reciente) */}
            <div className="xl:col-span-2 animate-slide-up-delay-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock size={18} className="text-[#0F1A5A]" />
                    Actividad Reciente
                  </h2>
                  <button className="text-sm font-semibold text-[#0F1A5A] hover:text-[#E84F51] transition-colors">
                    Ver todo
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                        <th className="px-6 py-4">ID Transacción</th>
                        <th className="px-6 py-4">Tipo</th>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Monto</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Tiempo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentActivity.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-[#0F1A5A]">{row.id}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-medium">{row.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{row.client}</td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-800">{row.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 text-right whitespace-nowrap">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <AlertCircle size={12} />
                    Los datos mostrados son un resumen de las últimas 24 horas.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* Modal de Lanzamiento SSO */}
      {selectedProduct && (
        <LaunchModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
