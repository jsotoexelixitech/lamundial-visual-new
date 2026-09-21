import { LogOut, ClipboardList, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { logout, getCurrentUser } from '@/lib/nexus-auth';

type Props = {
  active?: 'dashboard' | 'audit';
  theme?: 'light' | 'dark';
};

export function PortalHeader({ active = 'dashboard', theme = 'light' }: Props) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { key: 'dashboard' as const, label: 'Emisiones', icon: LayoutGrid, to: '/dashboard' },
    { key: 'audit' as const, label: 'Bitácora', icon: ClipboardList, to: '/audit' },
  ];

  const initials = (user?.nombre ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const isDark = theme === 'dark';

  return (
    <header className={isDark ? 'portal-header-dark' : 'bg-white shadow-[0_1px_0_rgba(9,17,51,0.06)]'}>
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(90deg, #663af3, #2E6DBF 45%, #E84F51)' }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={() => navigate('/dashboard')} className="text-left">
          <MundialBrand variant={isDark ? 'light' : 'dark'} isotipoClassName="h-10 w-10" />
        </button>

        <nav className="flex items-center gap-1 sm:gap-1.5">
          {navItems.map(({ key, label, icon: Icon, to }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(to)}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                active === key
                  ? isDark
                    ? 'bg-void-violet text-white shadow-sm'
                    : 'bg-[#0F1A5A] text-white shadow-sm'
                  : isDark
                    ? 'text-moon-mist hover:bg-white/5'
                    : 'text-[#0F1A5A] hover:bg-[#F0F2F8]'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}

          {user && (
            <div
              className={`hidden md:flex items-center gap-3 ml-3 pl-4 border-l ${
                isDark ? 'border-white/10' : 'border-[#e4e6ee]'
              }`}
            >
              <div
                className="h-9 w-9 rounded-full grid place-items-center text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #663af3, #0F1A5A)' }}
              >
                {initials}
              </div>
              <div className="leading-tight">
                <p className={`text-sm font-bold ${isDark ? 'text-ice-highlight' : 'text-[#091133]'}`}>
                  {user.nombre}
                </p>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                    isDark ? 'text-fog-veil' : 'text-[#ACACAC]'
                  }`}
                >
                  {user.empresa ?? 'La Mundial'}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className={`ml-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              isDark ? 'text-[#f0a9a9] hover:bg-white/5' : 'text-[#E84F51] hover:bg-red-50'
            }`}
            title="Cerrar sesión"
          >
            <LogOut size={17} />
            <span className="hidden lg:inline">Salir</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
