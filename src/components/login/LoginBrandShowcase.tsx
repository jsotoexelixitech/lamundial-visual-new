import React from 'react';
import { publicAsset } from '@/lib/public-asset';
import { MUNDIAL_ISOTIPO, MundialLockup } from '@/components/brand/MundialBrand';

type Variant = 'hero' | 'overlay';

const layout: Record<
  Variant,
  { ring: string; lockup?: string; isotipo?: string; useLockup: boolean }
> = {
  hero: {
    ring: 'h-[min(72vw,280px)] w-[min(72vw,280px)] sm:h-[300px] sm:w-[300px]',
    lockup: 'w-[13.5rem] sm:w-[15.5rem] lg:w-[17rem]',
    useLockup: true,
  },
  overlay: {
    ring: 'h-44 w-44 sm:h-48 sm:w-48',
    isotipo: 'h-[5.5rem] w-[5.5rem] sm:h-24 sm:w-24',
    useLockup: false,
  },
};

export function LoginBrandShowcase({ variant = 'hero' }: { variant?: Variant }) {
  const cfg = layout[variant];

  return (
    <div
      className={`login-pulse-ring relative mx-auto flex items-center justify-center ${cfg.ring}`}
    >
      <span className="login-orbit-ring absolute -inset-2 sm:-inset-3 rounded-full border-2 border-dashed border-void-violet/45" />
      <span className="login-orbit-ring-delay absolute inset-1 sm:inset-2 rounded-full border border-blueprint-blue/35" />
      <span className="login-pulse-a absolute inset-3 sm:inset-4 rounded-full border-2 border-[#bad7f7]/35" />
      <span className="login-pulse-b absolute inset-8 sm:inset-10 rounded-full border border-void-violet/40" />

      <div className="login-hero-mark-plinth relative z-10 flex items-center justify-center">
        {cfg.useLockup ? (
          <MundialLockup onDark className={cfg.lockup} />
        ) : (
          <img
            src={publicAsset(MUNDIAL_ISOTIPO)}
            alt="La Mundial de Seguros"
            className={`${cfg.isotipo} login-logo-glow login-orbit-core object-contain`}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
