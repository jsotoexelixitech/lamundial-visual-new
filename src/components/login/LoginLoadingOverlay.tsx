import React from 'react';
import { ShieldCheck, Loader2, LogIn } from 'lucide-react';
import { LoginBrandShowcase } from '@/components/login/LoginBrandShowcase';

const STEPS = [
  { id: 'auth', label: 'Validando credenciales', icon: ShieldCheck },
  { id: 'session', label: 'Iniciando tu sesión segura', icon: LogIn },
  { id: 'ready', label: 'Entrando al portal', icon: ShieldCheck },
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
      className="login-overlay login-overlay-organic fixed inset-0 z-[200] flex items-center justify-center px-4 sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Iniciando sesión"
    >
      <div className="login-overlay-backdrop absolute inset-0 bg-bone-white/85 backdrop-blur-md" />

      <div className="login-organic-card relative w-full max-w-lg rounded-[20px] overflow-hidden login-modal-enter">
        <div className="h-1.5 bg-tissue">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #cef79e, #0F1A5A 55%, #E84F51)',
            }}
          />
        </div>

        <div className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6">
              <LoginBrandShowcase variant="overlay" theme="organic-dark" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 bg-tissue border border-lichen">
              <Loader2 size={18} className="animate-spin text-abyssal-ink" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-graphite font-[family-name:var(--font-roboto-mono)]">
                Portal La Mundial
              </span>
            </div>

            <p
              className="text-2xl font-semibold text-abyssal-ink mb-2 login-step-fade tracking-tight"
              key={step.id}
            >
              {step.label}
            </p>
            <p className="text-sm text-graphite max-w-sm">
              Un momento: estamos verificando tu acceso corporativo.
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
                    current ? 'bg-bioluminescent-lime/35 border border-bioluminescent-lime' : done ? 'opacity-90' : 'opacity-50'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      current
                        ? 'bg-abyssal-ink text-bioluminescent-lime'
                        : done
                          ? 'bg-mundial-blue/10 text-mundial-blue'
                          : 'bg-tissue text-graphite'
                    }`}
                  >
                    <Icon size={16} className={current ? 'login-icon-bounce' : ''} />
                  </span>
                  <span
                    className={`text-sm ${current ? 'font-medium text-abyssal-ink' : 'text-graphite'}`}
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
