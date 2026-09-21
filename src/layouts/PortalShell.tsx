import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Radio,
  Building2,
  UserCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { MundialBrand } from '@/components/brand/MundialBrand';
import { logout } from '@/lib/nexus-auth';
import { usePortalSession } from '@/context/PortalSessionContext';
import { isPortalAdmin } from '@/lib/portal-sso-config';

const NAV = [
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Emisiones',
    hint: 'Catálogo de emisión',
    icon: LayoutGrid,
  },
  {
    id: 'audit',
    to: '/audit',
    label: 'Bitácora',
    hint: 'Historial de acciones',
    icon: ClipboardList,
  },
] as const;

const ADMIN_NAV = {
  id: 'usuarios',
  to: '/usuarios',
  label: 'Usuarios',
  hint: 'Operadores del portal',
  icon: Users,
} as const;

function userInitials(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function PortalShell() {
  const navigate = useNavigate();
  const { profile, profileLoading, profileError, storageUser } = usePortalSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile?.user.nombre ?? storageUser?.nombre ?? 'Usuario';
  const displayEmail = profile?.user.email ?? storageUser?.email ?? '';
  const displayRole = profile?.user.role ?? storageUser?.role ?? 'Operador';
  const displayEmpresa = profile?.empresa.nombre ?? storageUser?.empresa ?? 'La Mundial de Seguros';
  const canal = profile?.canal;
  const navItems = isPortalAdmin(storageUser ?? profile?.user ?? null)
    ? [...NAV, ADMIN_NAV]
    : [...NAV];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <div className="portal-sidebar-inner flex flex-col h-full min-h-0">
      <div className="px-4 sm:px-5 pt-6 pb-5 border-b border-[#e8eaf0] shrink-0">
        <MundialBrand subtitle="Portal corporativo" isotipoClassName="h-10 w-10" />
      </div>

      <div className="px-3 sm:px-4 py-4 border-b border-[#e8eaf0] shrink-0 min-w-0">
        {profileLoading ? (
          <div className="flex items-center gap-3 px-2 py-2 text-[#777777]">
            <Loader2 size={20} className="animate-spin text-[#0F1A5A]" />
            <span className="text-sm">Cargando sesión…</span>
          </div>
        ) : (
          <div className="portal-user-card rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div
                className="h-11 w-11 shrink-0 rounded-full grid place-items-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #0F1A5A, #2E6DBF)' }}
              >
                {userInitials(displayName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#091133] leading-snug truncate">{displayName}</p>
                <p className="text-[11px] text-[#777777] truncate mt-0.5">{displayEmail}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E84F51] mt-2">
                  {displayRole}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#eceef4] space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#555]">
                <Building2 size={14} className="text-[#0F1A5A] shrink-0" />
                <span className="truncate font-medium">{displayEmpresa}</span>
              </div>
              {canal && (
                <div className="flex items-start gap-2 text-xs text-[#555]">
                  <Radio size={14} className="text-[#2E6DBF] shrink-0 mt-0.5" />
                  <div className="min-w-0 leading-snug">
                    <p>
                      Productor <span className="font-semibold text-[#091133]">{canal.cproductor}</span>
                    </p>
                    <p className="text-[#777777]">
                      Canal {canal.centidad} · {canal.citem}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {profileError && (
              <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5">
                {profileError}
              </p>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ACACAC]">
          Menú
        </p>
        {navItems.map(({ id, to, label, hint, icon: Icon }) => (
          <NavLink
            key={id}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `portal-nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                isActive ? 'portal-nav-item-active' : 'text-[#0F1A5A] hover:bg-[#F0F2F8]'
              }`
            }
          >
            <span className="portal-nav-icon grid place-items-center h-9 w-9 rounded-lg shrink-0">
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{label}</span>
              <span className="block text-[11px] opacity-70 truncate">{hint}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 sm:p-4 border-t border-[#e8eaf0] mt-auto shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0d0d0] bg-white px-4 py-2.5 text-sm font-semibold text-[#E84F51] hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="portal-app min-h-screen bg-[#F7F7F7] flex">
      <aside className="portal-sidebar hidden lg:flex lg:w-[272px] lg:shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30">
        {sidebar}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-[#091133]/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`portal-sidebar fixed inset-y-0 left-0 z-50 w-[min(100vw,288px)] transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          className="absolute top-4 right-3 p-2 rounded-lg text-[#777] hover:bg-[#F0F2F8] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
        {sidebar}
      </aside>

      <div className="flex flex-col flex-1 min-w-0 lg:pl-[272px] min-h-screen">
        <header className="portal-topbar lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8eaf0]">
          <button
            type="button"
            className="p-2 rounded-lg text-[#0F1A5A] hover:bg-[#F0F2F8]"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <UserCircle size={20} className="text-[#2E6DBF] shrink-0" />
            <span className="text-sm font-semibold text-[#091133] truncate">{displayName}</span>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
