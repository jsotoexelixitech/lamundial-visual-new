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

/** Overlay claro Apple × La Mundial — showcase animado + progreso marca. */
export function LoginLoadingOverlay({ active, stepIndex = 0 }: Props) {
  if (!active) return null;

  const idx = Math.min(Math.max(stepIndex, 0), STEPS.length - 1);
  const step = STEPS[idx];
  const progress = ((idx + 1) / STEPS.length) * 100;

  return (
    <div
      className="login-apple-m-overlay fixed inset-0 z-[200] flex items-center justify-center px-4 sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Iniciando sesión"
    >
      <div className="absolute inset-0 bg-[#f7f7f7]/82 backdrop-blur-xl" />

      <div className="login-apple-m-overlay-card relative w-full max-w-lg overflow-hidden rounded-lg border border-[#d2d2d7] bg-white login-modal-enter">
        <div className="h-1 bg-[#e2e2e5]">
          <div
            className="h-full login-progress-fill transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #0f1a5a, #162a7f 55%, #e84f51)',
            }}
          />
        </div>

        <div className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6">
              <LoginBrandShowcase variant="overlay" theme="mundial-light" />
            </div>

            <div className="login-apple-m-chip inline-flex items-center gap-2 px-4 py-2 mb-4">
              <Loader2 size={18} className="animate-spin text-mundial-blue" />
              <span className="login-apple-m-caption font-semibold">Portal La Mundial</span>
            </div>

            <p className="login-apple-m-subtitle text-2xl font-semibold mb-2 login-step-fade" key={step.id}>
              {step.label}
            </p>
            <p className="login-apple-m-body text-sm max-w-sm">
              Un momento: estamos verificando tu acceso corporativo.
            </p>
          </div>

          <ul className="space-y-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < idx;
              const current = i === idx;
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-500 border ${
                    current
                      ? 'login-apple-m-step-active border-[#0f1a5a]/20 bg-[#eef1fb]'
                      : done
                        ? 'border-transparent opacity-90'
                        : 'border-transparent opacity-50'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      current
                        ? 'bg-[#0f1a5a]/10 text-mundial-blue'
                        : done
                          ? 'bg-[#e84f51]/10 text-mundial-red'
                          : 'bg-[#e2e2e5] text-[#707070]'
                    }`}
                  >
                    <Icon size={16} className={current ? 'login-icon-bounce' : ''} />
                  </span>
                  <span className={`text-sm ${current ? 'font-medium text-[#091133]' : 'text-[#707070]'}`}>
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
