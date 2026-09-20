import { LogOut, ClipboardList, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { logout, getCurrentUser } from '@/lib/nexus-auth';
import { isPortalAdmin } from '@/lib/portal-sso-config';

type Props = {
  active?: 'dashboard' | 'audit' | 'settings';
};

export function PortalHeader({ active = 'dashboard' }: Props) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="border-b-2 border-[#E84F51] bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <MundialBrand variant="dark" isotipoClassName="h-12 w-12" />

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              active === 'dashboard'
                ? 'bg-[#0F1A5A] text-white'
                : 'text-[#0F1A5A] hover:bg-[#F0F2F8]'
            }`}
          >
            Productos
          </button>
          <button
            type="button"
            onClick={() => navigate('/audit')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              active === 'audit'
                ? 'bg-[#0F1A5A] text-white'
                : 'text-[#0F1A5A] hover:bg-[#F0F2F8]'
            }`}
          >
            <ClipboardList size={16} />
            Bitácora
          </button>
          {user && isPortalAdmin(user) && (
            <button
              type="button"
              onClick={() => navigate('/settings/sso')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active === 'settings'
                  ? 'bg-[#0F1A5A] text-white'
                  : 'text-[#0F1A5A] hover:bg-[#F0F2F8]'
              }`}
            >
              <Settings size={16} />
              SSO
            </button>
          )}

          {user && (
            <div className="hidden sm:flex flex-col items-end pl-2 border-l border-[#dddddd] ml-1">
              <span className="text-sm font-bold text-[#091133]">{user.nombre}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#777777] font-semibold">
                {user.empresa ?? 'La Mundial'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[#E84F51] hover:bg-red-50 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
