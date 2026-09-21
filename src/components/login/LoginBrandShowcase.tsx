import React from 'react';
import { publicAsset } from '@/lib/public-asset';
import { MUNDIAL_ISOTIPO } from '@/components/brand/MundialBrand';

type Variant = 'hero' | 'overlay';
type Theme = 'organic' | 'organic-dark' | 'authkit';

const layout: Record<Variant, { ring: string; medallion: string; img: string }> = {
  hero: {
    ring: 'h-[min(68vw,260px)] w-[min(68vw,260px)] sm:h-[280px] sm:w-[280px]',
    medallion: 'login-logo-medallion login-logo-medallion--hero',
    img: 'h-[6.25rem] w-[6.25rem] sm:h-[7rem] sm:w-[7rem]',
  },
  overlay: {
    ring: 'h-[13.5rem] w-[13.5rem] sm:h-[14.5rem] sm:w-[14.5rem]',
    medallion: 'login-logo-medallion login-logo-medallion--overlay',
    img: 'h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24',
  },
};

type Props = {
  variant?: Variant;
  theme?: Theme;
};

export function LoginBrandShowcase({ variant = 'hero', theme = 'organic' }: Props) {
  const cfg = layout[variant];
  const isDark = theme === 'organic-dark';
  const isAuthkit = theme === 'authkit';

  return (
    <div
      className={`login-pulse-ring relative mx-auto flex items-center justify-center ${cfg.ring} ${
        isDark ? 'login-showcase-dark' : ''
      }`}
    >
      <span
        className={`login-orbit-ring absolute -inset-1 sm:-inset-2 rounded-full border-2 border-dashed ${
          isDark
            ? 'border-bioluminescent-lime/80'
            : isAuthkit
              ? 'border-void-violet/40'
              : 'border-bioluminescent-lime/70'
        }`}
      />
      <span
        className={`login-orbit-ring-delay absolute inset-2 sm:inset-3 rounded-full border ${
          isDark ? 'border-bioluminescent-lime/35' : isAuthkit ? 'border-blueprint-blue/30' : 'border-lichen'
        }`}
      />
      {isAuthkit && (
        <span className="login-pulse-a absolute inset-5 sm:inset-6 rounded-full border border-[#bad7f7]/30" />
      )}
      {isDark && <span className="login-organic-ring-pulse absolute inset-4 rounded-full" />}

      <div
        className={`${cfg.medallion} ${
          isDark ? 'login-logo-medallion--organic-dark' : isAuthkit ? '' : 'login-logo-medallion--organic'
        } relative z-10`}
      >
        <img
          src={publicAsset(MUNDIAL_ISOTIPO)}
          alt="La Mundial de Seguros"
          className={`${cfg.img} ${isAuthkit ? 'login-logo-glow' : isDark ? 'login-logo-lime-pulse' : ''} login-orbit-core object-contain`}
          draggable={false}
        />
      </div>
    </div>
  );
}
