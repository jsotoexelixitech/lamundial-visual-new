import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchPortalMe,
  getCurrentUser,
  type PortalCanalDto,
  type LoginResponse,
} from '@/lib/nexus-auth';

export type PortalSessionProfile = {
  user: {
    id: number;
    nombre: string;
    email: string;
    role: string;
  };
  empresa: {
    id: number;
    nombre: string;
  };
  canal?: PortalCanalDto;
};

type PortalSessionContextValue = {
  storageUser: LoginResponse['user'] | null;
  profile: PortalSessionProfile | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const PortalSessionContext = createContext<PortalSessionContextValue | null>(null);

export function PortalSessionProvider({ children }: { children: React.ReactNode }) {
  const storageUser = getCurrentUser();
  const [profile, setProfile] = useState<PortalSessionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const me = await fetchPortalMe();
      if (me?.user && me?.empresa) {
        setProfile({
          user: me.user,
          empresa: me.empresa,
          canal: me.canal,
        });
      } else {
        setProfile(null);
      }
    } catch {
      setError('No se pudo cargar tu perfil de portal.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <PortalSessionContext.Provider value={{ storageUser, profile, loading, error, refresh }}>
      {children}
    </PortalSessionContext.Provider>
  );
}

export function usePortalSession() {
  const ctx = useContext(PortalSessionContext);
  if (!ctx) throw new Error('usePortalSession debe usarse dentro de PortalSessionProvider');
  return ctx;
}
