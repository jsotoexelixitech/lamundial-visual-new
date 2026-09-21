import React from 'react';
import { Car, Heart, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';

const STEPS = [
  { id: 'auth', label: 'Validando credenciales', icon: ShieldCheck },
  { id: 'catalog', label: 'Consultando productos del canal', icon: Building2 },
  { id: 'sso', label: 'Preparando acceso SSO', icon: Heart },
  { id: 'ready', label: 'Abriendo tu portal', icon: Car },
] as const;

type Props = {
  active: boolean;
  stepIndex?: number;
};

export function LoginLoadingOverlay({ active, stepIndex = 0 }: Props) {
  if (!active) return null;

  const idx = Math.min(Math.max(stepIndex, 0), STEPS.length - 1);
  const step = STEPS[idx];
  const progress = ((idx + 1) / STEPS.length) * 100;

  return (
    <div
      className="login-overlay login-overlay-authkit fixed inset-0 z-[200] flex items-center justify-center px-4 sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Iniciando sesión"
    >
      <div className="login-overlay-backdrop absolute inset-0 bg-[#05060f]/88 backdrop-blur-xl" />
      <div className="login-spotlight absolute inset-0 pointer-events-none opacity-80" aria-hidden />

      <div className="login-glass-modal relative w-full max-w-lg rounded-2xl overflow-hidden login-modal-enter login-overlay-card-glow">
        <div className="h-1.5 bg-white/5">
          <div
            className="h-full login-progress-fill transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #663af3, #2E6DBF 55%, #E84F51)',
            }}
          />
        </div>

        <div className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6">
              <LoginBrandShowcase variant="overlay" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 login-glass-chip">
              <Loader2 size={18} className="animate-spin text-[#d1e4fa]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c7d3ea]">
                Portal La Mundial
              </span>
            </div>

            <p className="text-2xl font-semibold text-[#d8ecf8] mb-2 login-step-fade" key={step.id}>
              {step.label}
            </p>
            <p className="text-sm text-[#9da7ba] max-w-sm">
              Sincronizando catálogo Sis2000 y permisos de emisión…
            </p>
          </div>

          <ul className="space-y-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < idx;
              const current = i === idx;
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-500 ${
                    current ? 'login-glass-chip scale-[1.02]' : done ? 'opacity-90' : 'opacity-45'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      current
                        ? 'bg-[#663af3]/25 text-[#d1e4fa]'
                        : done
                          ? 'bg-[#2E6DBF]/20 text-[#98c0ef]'
                          : 'bg-white/5 text-[#9da7ba]'
                    }`}
                  >
                    <Icon size={16} className={current ? 'login-icon-bounce' : ''} />
                  </span>
                  <span
                    className={`text-sm ${
                      current ? 'font-medium text-[#d1e4fa]' : 'text-[#c7d3ea]'
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
