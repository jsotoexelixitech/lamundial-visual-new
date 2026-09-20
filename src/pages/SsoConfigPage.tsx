import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Save, Eye, EyeOff, Shield } from 'lucide-react';
import { PortalHeader } from '@/components/PortalHeader';
import { getCurrentUser } from '@/lib/nexus-auth';
import {
  isPortalAdmin,
  loadPortalSsoConfig,
  savePortalSsoConfig,
  type FlowSsoOverrides,
  type PortalSsoStorage,
} from '@/lib/portal-sso-config';
import type { ProductKey } from '@/lib/portal-config';
import { buildSsoPayload } from '@/lib/sso-launch';
import { PRODUCTS } from '@/lib/portal-config';

const FLOW_META: Record<ProductKey, { title: string; hint: string }> = {
  rcv: {
    title: 'RCV',
    hint: 'target: ocr · product: rcv · cramo 18',
  },
  patrimonial: {
    title: 'Patrimoniales',
    hint: 'target: emision · product: patrimoniales',
  },
  funerario: {
    title: 'Funerario',
    hint: 'target: ocr · product: funerario · cramo 9',
  },
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border border-[#dddddd] px-3 py-2 text-sm text-[#091133] focus:border-[#0F1A5A] focus:ring-1 focus:ring-[#0F1A5A] outline-none ${
          mono ? 'font-mono text-xs' : ''
        }`}
      />
    </label>
  );
}

function SecretField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">{label}</span>
      <div className="mt-1 flex gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 rounded-lg border border-[#dddddd] px-3 py-2 text-sm font-mono text-[#091133] focus:border-[#0F1A5A] focus:ring-1 focus:ring-[#0F1A5A] outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="px-3 rounded-lg border border-[#dddddd] text-[#777777] hover:bg-[#F7F7F7]"
          title={show ? 'Ocultar' : 'Mostrar'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

export const SsoConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [config, setConfig] = useState<PortalSsoStorage>(() => loadPortalSsoConfig());
  const [saved, setSaved] = useState(false);
  const [activeFlow, setActiveFlow] = useState<ProductKey>('rcv');

  useEffect(() => {
    if (!user) navigate('/login');
    else if (!isPortalAdmin(user)) navigate('/dashboard');
  }, [user, navigate]);

  if (!user || !isPortalAdmin(user)) return null;

  const updateFlow = (key: ProductKey, patch: Partial<FlowSsoOverrides>) => {
    setConfig((c) => ({
      ...c,
      flows: {
        ...c.flows,
        [key]: { ...c.flows[key], ...patch },
      },
    }));
    setSaved(false);
  };

  const flow = config.flows[activeFlow] ?? {};
  const previewProduct = PRODUCTS.find((p) => p.key === activeFlow)!;

  const handleSave = () => {
    savePortalSsoConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col">
      <PortalHeader active="settings" />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#0F1A5A] text-white flex items-center justify-center">
            <KeyRound size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-[#091133]">Configuración SSO</h1>
            <p className="text-sm text-[#777777] mt-1 max-w-xl">
              API Key de la empresa en Nexus (<code className="text-xs bg-white px-1 rounded">x-api-key</code>
              ) usada en <code className="text-xs bg-white px-1 rounded">POST /api/auth/sso-delegate</code> al
              abrir RCV, Patrimoniales o Funerario. Los metadatos siguen el esquema La Mundial (cproductor, cusuario,
              etc.).
            </p>
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-[#dddddd] p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-[#091133] mb-4 flex items-center gap-2">
            <Shield size={16} className="text-[#E84F51]" />
            API Key global (La Mundial)
          </h2>
          <SecretField
            label="Token SSO / API Key Nexus"
            value={config.globalApiKey}
            onChange={(v) => {
              setConfig((c) => ({ ...c, globalApiKey: v }));
              setSaved(false);
            }}
            placeholder="Pegar API Key de Nexus Admin → empresa"
          />
          <p className="text-xs text-[#ACACAC] mt-3">
            Se guarda solo en este navegador (localStorage). No la compartas ni la subas al repositorio.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-[#dddddd] p-6 shadow-sm mb-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {(Object.keys(FLOW_META) as ProductKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFlow(key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeFlow === key
                    ? 'bg-[#E84F51] text-white'
                    : 'bg-[#F0F2F8] text-[#0F1A5A] hover:bg-[#E8EBF5]'
                }`}
              >
                {FLOW_META[key].title}
              </button>
            ))}
          </div>

          <p className="text-xs text-[#777777] mb-4">{FLOW_META[activeFlow].hint}</p>

          <SecretField
            label="API Key solo para este flujo (opcional)"
            value={flow.apiKey ?? ''}
            onChange={(v) => updateFlow(activeFlow, { apiKey: v })}
            placeholder="Vacío = usar API Key global"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Field label="cproductor" value={flow.cproductor ?? ''} onChange={(v) => updateFlow(activeFlow, { cproductor: v })} placeholder="80080" mono />
            <Field label="cusuario" value={flow.cusuario ?? ''} onChange={(v) => updateFlow(activeFlow, { cusuario: v })} placeholder="4" mono />
            <Field label="centidad" value={flow.centidad ?? ''} onChange={(v) => updateFlow(activeFlow, { centidad: v })} placeholder="P" mono />
            <Field label="citem" value={flow.citem ?? ''} onChange={(v) => updateFlow(activeFlow, { citem: v })} placeholder="80080" mono />
            <Field label="cramo" value={flow.cramo ?? ''} onChange={(v) => updateFlow(activeFlow, { cramo: v })} placeholder={String(previewProduct.defaultCramo ?? '')} mono />
          </div>

          <details className="mt-6 rounded-lg bg-[#F7F7F7] p-4 text-xs">
            <summary className="cursor-pointer font-semibold text-[#0F1A5A]">Vista previa payload sso-delegate</summary>
            <pre className="mt-3 overflow-x-auto font-mono text-[#091133] whitespace-pre-wrap">
              {JSON.stringify(buildSsoPayload(previewProduct), null, 2)}
            </pre>
          </details>
        </section>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F1A5A] text-white font-semibold hover:bg-[#091133] transition-colors"
        >
          <Save size={18} />
          Guardar configuración
        </button>
        {saved && (
          <span className="ml-4 text-sm font-medium text-emerald-600">Guardado.</span>
        )}
      </main>
    </div>
  );
};
