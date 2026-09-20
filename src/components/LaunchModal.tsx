import React, { useState } from 'react';
import { X, ExternalLink, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { ssoDelegate, registerAudit, getToken } from '@/lib/nexus-auth';
import { buildModuleUrl } from '@/lib/module-launcher';
import type { ProductConfig } from '@/lib/portal-config';
import clsx from 'clsx';

type Mode = 'sso' | 'token';

interface Props {
  product: ProductConfig;
  onClose: () => void;
}

export const LaunchModal: React.FC<Props> = ({ product, onClose }) => {
  const [mode, setMode] = useState<Mode>('sso');
  const [apiKey, setApiKey] = useState('');
  const [cproductor, setCproductor] = useState('');
  const [cusuario, setCusuario] = useState('');
  const [cramo, setCramo] = useState(String(product.defaultCramo ?? ''));
  const [ccanalalt, setCcanalalt] = useState('');
  const [cgestor, setCgestor] = useState('');
  const [directToken, setDirectToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLaunch = async () => {
    setError('');
    setLoading(true);

    try {
      let targetUrl: string;

      if (mode === 'token') {
        if (!directToken.trim()) throw new Error('Ingresa el token nexus.');
        targetUrl = buildModuleUrl(product.key, directToken.trim());
      } else {
        if (!apiKey.trim()) throw new Error('Ingresa la API Key.');
        const result = await ssoDelegate(apiKey.trim(), {
          target: product.target,
          cproductor: cproductor || undefined,
          cusuario: cusuario || undefined,
          cramo: cramo ? Number(cramo) : product.defaultCramo,
          ccanalalt_in: ccanalalt || undefined,
          cgestor_in: cgestor || undefined,
          product: product.product,
        });
        targetUrl = result.redirect_url;
      }

      // Registrar audit
      await registerAudit({
        accion: `launch_${product.key}`,
        producto: product.key,
        detalle: { mode, targetUrl: targetUrl.split('?')[0] },
      });

      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Error al generar el acceso.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div
          className="px-8 py-6 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #D01229 0%, #9B0D1E 100%)' }}
        >
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
              Lanzar módulo
            </p>
            <h3 className="text-2xl font-display font-bold text-white">{product.label}</h3>
          </div>
          <button
            id="modal-close"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8">
          {/* Tabs modo */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {(['sso', 'token'] as Mode[]).map((m) => (
              <button
                key={m}
                id={`tab-${m}`}
                onClick={() => setMode(m)}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                  mode === m
                    ? 'bg-white shadow-sm text-mundial-red'
                    : 'text-gray-500 hover:text-gray-700',
                )}
                style={mode === m ? { color: '#D01229' } : {}}
              >
                {m === 'sso' ? '🔑 Credenciales API' : '🎫 Token directo'}
              </button>
            ))}
          </div>

          {/* Modo SSO */}
          {mode === 'sso' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="modal-apikey">
                  API Key <span style={{ color: '#D01229' }}>*</span>
                </label>
                <input
                  id="modal-apikey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1">No se guarda. Solo se usa en esta solicitud.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="modal-cproductor">
                    Productor (cproductor)
                  </label>
                  <input
                    id="modal-cproductor"
                    type="text"
                    value={cproductor}
                    onChange={(e) => setCproductor(e.target.value)}
                    placeholder="ej. 80080"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="modal-cusuario">
                    Usuario (cusuario)
                  </label>
                  <input
                    id="modal-cusuario"
                    type="text"
                    value={cusuario}
                    onChange={(e) => setCusuario(e.target.value)}
                    placeholder="ej. 7"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="modal-cramo">
                    Ramo (cramo)
                  </label>
                  <input
                    id="modal-cramo"
                    type="number"
                    value={cramo}
                    onChange={(e) => setCramo(e.target.value)}
                    placeholder={String(product.defaultCramo)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="modal-canal">
                    Canal alterno
                  </label>
                  <input
                    id="modal-canal"
                    type="text"
                    value={ccanalalt}
                    onChange={(e) => setCcanalalt(e.target.value)}
                    placeholder="ej. 27"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              {/* Avanzado - gestor */}
              <details className="group">
                <summary className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer hover:text-gray-600 list-none select-none">
                  <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                  Opciones avanzadas
                </summary>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="modal-gestor">
                    Gestor (cgestor_in)
                  </label>
                  <input
                    id="modal-gestor"
                    type="text"
                    value={cgestor}
                    onChange={(e) => setCgestor(e.target.value)}
                    placeholder="GESTOR-01"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </details>
            </div>
          )}

          {/* Modo Token directo */}
          {mode === 'token' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="modal-token">
                nexus_token <span style={{ color: '#D01229' }}>*</span>
              </label>
              <textarea
                id="modal-token"
                value={directToken}
                onChange={(e) => setDirectToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Pega aquí el token obtenido de nexus-api. El módulo se abrirá directamente.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              id="modal-cancel"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              id="modal-launch"
              onClick={handleLaunch}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: loading ? '#ccc' : 'linear-gradient(135deg, #D01229 0%, #9B0D1E 100%)', color: 'white' }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generando...</>
              ) : (
                <><ExternalLink size={16} /> Abrir módulo</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchModal;
