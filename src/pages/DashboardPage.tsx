import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, Clock, Shield } from 'lucide-react';
import { getCurrentUser } from '@/lib/nexus-auth';
import { PRODUCTS } from '@/lib/portal-config';
import type { ProductConfig } from '@/lib/portal-config';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { LaunchModal } from '@/components/LaunchModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [selectedProduct, setSelectedProduct] = useState<ProductConfig | null>(null);

  // Redirigir si no hay sesión
  if (!user) {
    navigate('/login');
    return null;
  }

  const stats = [
    { icon: <Zap size={20} />, label: 'Módulos activos', value: '4', color: '#0F1A5A' },
    { icon: <Shield size={20} />, label: 'SSO seguro', value: '✓', color: '#E84F51' },
    { icon: <TrendingUp size={20} />, label: 'Productos', value: '3', color: '#ACACAC' },
    { icon: <Clock size={20} />, label: 'Sesión activa', value: '1h', color: '#091133' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F7' }} id="dashboard-page">
      <Navbar activePage="dashboard" />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Hero bienvenida */}
        <div className="mb-10 animate-slide-up">
          <div
            className="rounded-3xl p-10 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #091133 0%, #0F1A5A 50%, #162a7f 100%)' }}
          >
            {/* Decoración */}
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
                 style={{ background: 'white', transform: 'translate(30%, -40%)' }} />
            <div className="absolute bottom-0 left-20 w-64 h-64 rounded-full opacity-10"
                 style={{ background: '#E84F51', transform: 'translate(-30%, 50%)' }} />

            <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
              <div>
                <p className="text-white/70 text-sm font-semibold uppercase tracking-widest mb-2">
                  Bienvenido al portal
                </p>
                <h1 className="text-4xl font-display font-bold mb-2">
                  ¡Hola, {user.nombre?.split(' ')[0]}! 👋
                </h1>
                <p className="text-white/80 text-base max-w-lg">
                  Selecciona un producto para iniciar el flujo SSO. El sistema generará el acceso seguro automáticamente.
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 opacity-90"
                   style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
                <img src="/logo-mundial.png" alt="La Mundial" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-slide-up-delay-1">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                   style={{ background: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
              <p className="text-2xl font-display font-bold text-mundial-gray">{stat.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Título productos */}
        <div className="mb-6 animate-slide-up-delay-2">
          <h2 className="text-2xl font-display font-bold text-mundial-gray">Productos disponibles</h2>
          <p className="text-gray-500 text-sm mt-1">
            Haz clic en un producto para configurar y lanzar el flujo SSO correspondiente.
          </p>
        </div>

        {/* Cards de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-slide-up-delay-3">
          {PRODUCTS.map((product) => (
            <ProductCard
              key={product.key}
              product={product}
              onLaunch={setSelectedProduct}
            />
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-10 p-6 bg-white rounded-2xl border border-gray-100 animate-slide-up-delay-4">
          <div className="flex flex-wrap gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Shield size={14} style={{ color: '#0F1A5A' }} />
              SSO mediante <strong className="text-gray-700">nexus-api</strong> — token con metadata canal
            </span>
            <span className="flex items-center gap-2">
              <Zap size={14} style={{ color: '#E84F51' }} />
              Empresa: <strong className="text-gray-700">ID {user.empresaId}</strong>
            </span>
            <span className="flex items-center gap-2">
              <Clock size={14} style={{ color: '#404040' }} />
              Env: <strong className="text-gray-700">{import.meta.env.VITE_NEXUS_API_URL || 'cierrelmds'}</strong>
            </span>
          </div>
        </div>
      </main>

      {/* Modal */}
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
