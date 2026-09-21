import React from 'react';
import { Car, Heart, Building2 } from 'lucide-react';

const PILLS = [
  { Icon: Car, label: 'RCV', className: 'login-organic-pill login-organic-pill-1' },
  { Icon: Heart, label: 'Funerario', className: 'login-organic-pill login-organic-pill-2' },
  { Icon: Building2, label: 'Personas', className: 'login-organic-pill login-organic-pill-3' },
];

type Props = {
  intense?: boolean;
  variant?: 'hero-dark' | 'page-light';
};

/** Animaciones orgánicas visibles: mesh, orbes lime, pills flotantes. */
export function LoginOrganicAmbient({ intense = false, variant = 'page-light' }: Props) {
  const fast = intense ? 'login-organic-fast' : '';

  if (variant === 'hero-dark') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className={`login-organic-mesh login-organic-mesh-dark ${fast}`} />
        <div className={`login-organic-glow-orb login-organic-glow-1 ${fast}`} />
        <div className={`login-organic-glow-orb login-organic-glow-2 ${fast}`} />
        <div className={`login-organic-glow-orb login-organic-glow-3 ${fast}`} />
        {PILLS.map(({ Icon, label, className }) => (
          <div key={label} className={className}>
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </div>
        ))}
        <svg
          className="login-organic-wave absolute bottom-0 left-0 w-[200%] min-w-full h-24 text-bone-white"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            className="login-organic-wave-path"
            fill="currentColor"
            d="M0,64 C200,120 400,0 600,64 C800,128 1000,32 1200,64 L1200,120 L0,120 Z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className={`login-organic-mesh login-organic-mesh-light ${fast}`} />
      <div className={`login-organic-blob login-organic-blob-a ${fast}`} />
      <div className={`login-organic-blob login-organic-blob-b ${fast}`} />
    </div>
  );
}
