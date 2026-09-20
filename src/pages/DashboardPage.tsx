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
import { registerAudit, getToken } from '@/lib/nexus-auth';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [launching, setLaunching] = useState<string | null>(null);

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
      
      const targetUrl = buildModuleUrl(product.key, token);
      
      await registerAudit({
        accion: `launch_${product.key}`,
        producto: product.key,
        detalle: { method: 'direct_token', targetUrl: targetUrl.split('?')[0] },
      });
      
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error al lanzar módulo:', err);
      alert('Error al lanzar módulo. Verifica tu sesión.');
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
          {/* Menú limpio, sin mocks */}
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
            <h1 className="text-xl font-display font-bold text-[#0F1A5A]">Portal Corporativo</h1>
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

          {/* Área Principal - Lanzadores de Módulos */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <PlayCircle size={20} className="text-[#E84F51]" />
              Módulos Disponibles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRODUCTS.map((product) => {
                const deco = getProductDecorations(product.key);
                const isLaunching = launching === product.key;
                return (
                <div 
                  key={product.key} 
                  onClick={() => handleLaunch(product)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#0F1A5A]/30 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -z-10 group-hover:bg-[#0F1A5A]/5 transition-colors"></div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                         style={{ background: `linear-gradient(135deg, ${deco.color} 0%, ${deco.color}dd 100%)` }}>
                      <span className="text-white drop-shadow-md">{deco.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#0F1A5A] transition-colors">{product.label}</h3>
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 mt-1">
                        SSO Integrado
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">
                    {product.description}
                  </p>
                  
                  <div className="mt-6 pt-4 border-t border-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {deco.modules.map((mod, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
                          {mod}
                        </span>
                      ))}
                    </div>
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
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
