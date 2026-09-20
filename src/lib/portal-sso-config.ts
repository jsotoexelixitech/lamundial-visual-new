import type { ProductKey } from './portal-config';

const STORAGE_KEY = 'lamundial_portal_sso_v1';

/** Overrides por flujo (RCV / patrimoniales / funerario). */
export interface FlowSsoOverrides {
  apiKey?: string;
  cproductor?: string;
  cusuario?: string;
  centidad?: string;
  citem?: string;
  cramo?: string;
}

export interface PortalSsoStorage {
  /** API Key Nexus (`x-api-key`) — identifica la empresa en sso-delegate. */
  globalApiKey: string;
  flows: Partial<Record<ProductKey, FlowSsoOverrides>>;
}

const emptyConfig = (): PortalSsoStorage => ({
  globalApiKey: String(import.meta.env.VITE_PORTAL_SSO_API_KEY ?? '').trim(),
  flows: {},
});

export function loadPortalSsoConfig(): PortalSsoStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyConfig();
    const parsed = JSON.parse(raw) as PortalSsoStorage;
    return {
      globalApiKey: parsed.globalApiKey ?? emptyConfig().globalApiKey,
      flows: parsed.flows ?? {},
    };
  } catch {
    return emptyConfig();
  }
}

export function savePortalSsoConfig(config: PortalSsoStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** API Key efectiva: override del flujo o global. */
export function getEffectiveApiKey(productKey: ProductKey): string | undefined {
  const cfg = loadPortalSsoConfig();
  const flowKey = cfg.flows[productKey]?.apiKey?.trim();
  const global = cfg.globalApiKey?.trim();
  const key = flowKey || global;
  return key || undefined;
}

export function getFlowMetadataOverrides(productKey: ProductKey): FlowSsoOverrides {
  return loadPortalSsoConfig().flows[productKey] ?? {};
}

export function isPortalAdmin(user: { role?: string } | null): boolean {
  if (!user?.role) return false;
  const r = user.role.toLowerCase();
  return r.includes('admin') || r.includes('administrador');
}

export function maskSecret(value: string, visible = 8): string {
  if (!value || value.length <= visible + 4) return '••••••••';
  return `${value.slice(0, visible)}…${value.slice(-4)}`;
}
