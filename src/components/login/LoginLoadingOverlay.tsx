import React, { useEffect, useState } from 'react';
import { Car, Heart, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { MUNDIAL_ISOTIPO } from '@/components/brand/MundialBrand';
import { publicAsset } from '@/lib/public-asset';

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
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2400);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  const idx = Math.min(stepIndex + (tick % STEPS.length), STEPS.length - 1);
  const step = STEPS[idx];

  return (
    <div
      className="login-overlay fixed inset-0 z-50 flex items-center justify-center px-6"
      role="status"
      aria-live="polite"
      aria-label="Iniciando sesión"
    >
      <div className="login-overlay-backdrop absolute inset-0 bg-[#091133]/55 backdrop-blur-md" />

      <div className="login-overlay-card relative w-full max-w-md rounded-3xl border border-white/20 bg-white/95 shadow-[0_32px_80px_-24px_rgba(9,17,51,0.55)] overflow-hidden">
        <div
          className="h-1.5 w-full login-progress-bar"
          style={{ background: 'linear-gradient(90deg, #0F1A5A, #2E6DBF 45%, #E84F51)' }}
        />

        <div className="px-8 py-10 text-center">
          <div className="login-orbit mx-auto mb-8 relative h-36 w-36">
            <span className="login-orbit-ring absolute inset-0 rounded-full border border-[#0F1A5A]/15" />
            <span className="login-orbit-ring-delay absolute inset-2 rounded-full border border-[#E84F51]/25" />
            <img
              src={publicAsset(MUNDIAL_ISOTIPO)}
              alt=""
              className="absolute inset-0 m-auto h-14 w-14 login-orbit-core"
              draggable={false}
            />
            <span className="login-orbit-icon login-orbit-pos-1 absolute flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #E84F51, #B23F44)' }}>
              <Car size={18} />
            </span>
            <span className="login-orbit-icon login-orbit-pos-2 absolute flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2E6DBF, #0F1A5A)' }}>
              <Heart size={18} />
            </span>
            <span className="login-orbit-icon login-orbit-pos-3 absolute flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0F1A5A, #091133)' }}>
              <Building2 size={18} />
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F1A5A]/08 px-4 py-2 mb-4">
            <Loader2 size={16} className="animate-spin text-[#0F1A5A]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0F1A5A]">
              La Mundial · Portal
            </span>
          </div>

          <p className="font-display text-xl font-bold text-[#091133] mb-1 login-step-fade" key={step.id}>
            {step.label}
          </p>
          <p className="text-sm text-[#777777] mb-6">Un momento, estamos armando tu catálogo de emisiones.</p>

          <ul className="text-left space-y-2 max-w-xs mx-auto">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < idx;
              const current = i === idx;
              return (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 text-xs transition-all duration-500 ${
                    current ? 'text-[#091133] font-semibold scale-[1.02]' : done ? 'text-[#2E6DBF]' : 'text-[#ACACAC]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                      current
                        ? 'border-[#E84F51]/40 bg-[#E84F51]/10'
                        : done
                          ? 'border-[#2E6DBF]/30 bg-[#2E6DBF]/10'
                          : 'border-[#e4e6ee] bg-[#FAFBFD]'
                    }`}
                  >
                    <Icon size={14} className={current ? 'text-[#E84F51]' : done ? 'text-[#2E6DBF]' : ''} />
                  </span>
                  {s.label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
