import React from 'react';
import { LoginParticleSphere } from '@/components/login/LoginParticleSphere';

const STEPS = ['Validando credenciales', 'Iniciando sesión segura', 'Entrando al portal'];

type Props = {
  active: boolean;
  stepIndex?: number;
};

/** Overlay Auros — esfera compacta + progreso aurora. */
export function LoginLoadingOverlay({ active, stepIndex = 0 }: Props) {
  if (!active) return null;

  const idx = Math.min(Math.max(stepIndex, 0), STEPS.length - 1);
  const progress = ((idx + 1) / STEPS.length) * 100;

  return (
    <div
      className="login-auros-overlay fixed inset-0 z-[200] flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-liquid-deep/85" />

      <div className="login-auros-panel relative w-full max-w-md overflow-hidden">
        <div className="login-auros-aurora-bar h-1">
          <div
            className="login-auros-aurora-fill h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative px-8 pt-10 pb-10">
          <div className="login-auros-orb-mini mx-auto mb-8">
            <LoginParticleSphere className="h-full w-full" particleCount={220} radius={90} />
          </div>

          <p className="login-auros-eyebrow mb-3 text-center">Portal La Mundial</p>
          <p className="login-auros-stat text-center text-3xl sm:text-4xl mb-2">{STEPS[idx]}</p>
          <p className="login-auros-body text-center text-sm mb-8">Sincronizando tu acceso corporativo.</p>

          <ol className="login-auros-steps">
            {STEPS.map((label, i) => {
              const activeStep = i === idx;
              const done = i < idx;
              return (
                <li
                  key={label}
                  className={`login-auros-step-row ${activeStep ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                >
                  <span className="login-auros-step-label">{label}</span>
                  {done && <span className="text-lavender-phosphor text-xs">●</span>}
                  {activeStep && <span className="login-auros-pulse-dot" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
