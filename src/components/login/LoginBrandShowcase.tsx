import React from 'react';
import { publicAsset } from '@/lib/public-asset';
import { MUNDIAL_ISOTIPO } from '@/components/brand/MundialBrand';

type Variant = 'hero' | 'overlay';
type Theme = 'organic' | 'authkit';

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
  const ringOrganic = theme === 'organic';

  return (
    <div
      className={`login-pulse-ring relative mx-auto flex items-center justify-center ${cfg.ring}`}
    >
      <span
        className={`login-orbit-ring absolute -inset-1 sm:-inset-2 rounded-full border-2 border-dashed ${
          ringOrganic ? 'border-bioluminescent-lime/70' : 'border-void-violet/40'
        }`}
      />
      <span
        className={`login-orbit-ring-delay absolute inset-2 sm:inset-3 rounded-full border ${
          ringOrganic ? 'border-lichen' : 'border-blueprint-blue/30'
        }`}
      />
      {!ringOrganic && (
        <span className="login-pulse-a absolute inset-5 sm:inset-6 rounded-full border border-[#bad7f7]/30" />
      )}

      <div
        className={`${cfg.medallion} ${ringOrganic ? 'login-logo-medallion--organic' : ''} relative z-10`}
      >
        <img
          src={publicAsset(MUNDIAL_ISOTIPO)}
          alt="La Mundial de Seguros"
          className={`${cfg.img} ${ringOrganic ? '' : 'login-logo-glow'} login-orbit-core object-contain`}
          draggable={false}
        />
      </div>
    </div>
  );
}
