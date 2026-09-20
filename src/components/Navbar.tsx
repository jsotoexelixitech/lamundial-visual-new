import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart2, LayoutDashboard, ChevronDown, Shield } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/nexus-auth';
import clsx from 'clsx';
import { publicAsset } from '@/lib/public-asset';

interface Props {
  activePage?: 'dashboard' | 'audit';
}

export const Navbar: React.FC<Props> = ({ activePage = 'dashboard' }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar sticky top-0 z-40" id="navbar">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
               style={{ boxShadow: '0 4px 12px rgba(15,26,90,0.25)' }}>
            <img src={publicAsset('brand/mundial-isotipo.svg')} alt="La Mundial" className="w-full h-full object-contain p-1 bg-white" />
          </div>
          <div>
            <span className="font-display font-bold text-mundial-gray text-base leading-tight block">
              La Mundial
            </span>
            <span className="text-xs text-gray-400 leading-tight">Portal Corporativo</span>
          </div>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          <button
            id="nav-dashboard"
            onClick={() => navigate('/dashboard')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activePage === 'dashboard'
                ? 'text-white'
                : 'text-gray-500 hover:text-mundial-gray hover:bg-gray-100',
            )}
            style={activePage === 'dashboard'
              ? { background: 'linear-gradient(135deg, #E84F51, #b23f44)' }
              : {}}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
          <button
            id="nav-audit"
            onClick={() => navigate('/audit')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              activePage === 'audit'
                ? 'text-white'
                : 'text-gray-500 hover:text-mundial-gray hover:bg-gray-100',
            )}
            style={activePage === 'audit'
              ? { background: 'linear-gradient(135deg, #E84F51, #b23f44)' }
              : {}}
          >
            <BarChart2 size={16} />
            Auditoría
          </button>
        </div>

        {/* Usuario */}
        <div className="relative">
          <button
            id="user-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #0F1A5A, #091133)' }}>
              {user?.nombre?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-mundial-gray leading-tight">{user?.nombre ?? 'Usuario'}</p>
              <p className="text-xs text-gray-400 leading-tight">{user?.email ?? ''}</p>
            </div>
            <ChevronDown size={14} className={clsx('text-gray-400 transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-up">
              <div className="px-4 py-2 border-b border-gray-100 mb-2">
                {user?.empresa ? (
                  <p className="text-xs text-gray-400">{user.empresa}</p>
                ) : null}
              </div>
              <button
                id="nav-audit-menu"
                onClick={() => { setMenuOpen(false); navigate('/audit'); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <BarChart2 size={15} />
                Ver auditoría
              </button>
              <button
                id="logout-btn"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 transition-colors"
                style={{ color: '#E84F51' }}
              >
                <LogOut size={15} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
