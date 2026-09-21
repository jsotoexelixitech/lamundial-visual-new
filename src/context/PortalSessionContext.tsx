import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchPortalMe,
  fetchPortalProducts,
  getCurrentUser,
  type PortalCanalDto,
  type PortalProductDto,
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
  profileLoading: boolean;
  profileError: string;
  products: PortalProductDto[];
  productsLoading: boolean;
  productsError: string;
  refresh: () => Promise<void>;
  refreshProducts: () => Promise<void>;
};

const PortalSessionContext = createContext<PortalSessionContextValue | null>(null);

export function PortalSessionProvider({ children }: { children: React.ReactNode }) {
  const storageUser = getCurrentUser();
  const [profile, setProfile] = useState<PortalSessionProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [products, setProducts] = useState<PortalProductDto[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError('');
    try {
      const list = await fetchPortalProducts();
      setProducts(list);
    } catch (err) {
      const detail =
        err instanceof Error && err.message
          ? err.message
          : 'No se pudieron cargar tus productos.';
      setProductsError(detail);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');
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
      setProfileError('No se pudo cargar tu perfil de portal.');
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    void refreshProducts();
  }, [refresh, refreshProducts]);

  return (
    <PortalSessionContext.Provider
      value={{
        storageUser,
        profile,
        profileLoading,
        profileError,
        products,
        productsLoading,
        productsError,
        refresh,
        refreshProducts,
      }}
    >
      {children}
    </PortalSessionContext.Provider>
  );
}

export function usePortalSession() {
  const ctx = useContext(PortalSessionContext);
  if (!ctx) throw new Error('usePortalSession debe usarse dentro de PortalSessionProvider');
  return ctx;
}
