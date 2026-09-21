import React from 'react';

const STEPS = ['Validando credenciales', 'Iniciando sesión segura', 'Entrando al portal'];

type Props = {
  active: boolean;
  stepIndex?: number;
};

/** Overlay plano estilo laboratorio — sin anillos ni órbitas. */
export function LoginLoadingOverlay({ active, stepIndex = 0 }: Props) {
  if (!active) return null;

  const idx = Math.min(Math.max(stepIndex, 0), STEPS.length - 1);
  const progress = ((idx + 1) / STEPS.length) * 100;

  return (
    <div
      className="login-ib-overlay fixed inset-0 z-[200] flex items-center justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-abyssal-ink/72" />

      <div className="login-ib-card login-ib-overlay-panel relative w-full max-w-md">
        <div className="h-px bg-lichen overflow-hidden">
          <div className="h-full bg-bioluminescent-lime transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-10">
          <p className="login-ib-tag login-ib-tag--dark mb-4">
            <span className="login-ib-dot" aria-hidden />
            Portal La Mundial
          </p>
          <p className="login-ib-card-title text-2xl mb-2">{STEPS[idx]}</p>
          <p className="login-ib-meta mb-8">Verificando tu acceso corporativo.</p>

          <ol className="space-y-0 border border-lichen rounded-lg overflow-hidden">
            {STEPS.map((label, i) => {
              const activeStep = i === idx;
              const done = i < idx;
              return (
                <li
                  key={label}
                  className={`flex items-center justify-between px-4 py-3 border-b border-lichen last:border-b-0 login-ib-meta ${
                    activeStep ? 'bg-tissue text-abyssal-ink' : done ? 'text-graphite' : 'text-lichen'
                  }`}
                >
                  <span>{label}</span>
                  {done && <span className="text-bioluminescent-lime">●</span>}
                  {activeStep && <span className="login-ib-dot shrink-0" />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
