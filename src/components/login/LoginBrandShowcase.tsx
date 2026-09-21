import React from 'react';
import { publicAsset } from '@/lib/public-asset';
import { MUNDIAL_ISOTIPO } from '@/components/brand/MundialBrand';

type Variant = 'hero' | 'overlay' | 'compact';
type ShowcaseTheme = 'authkit' | 'mundial-light';

const layout: Record<
  Variant,
  { ring: string; medallion: string; img: string }
> = {
  hero: {
    ring: 'h-[min(68vw,260px)] w-[min(68vw,260px)] sm:h-[280px] sm:w-[280px]',
    medallion: 'login-logo-medallion login-logo-medallion--hero',
    img: 'h-[6.25rem] w-[6.25rem] sm:h-[7rem] sm:w-[7rem]',
  },
  compact: {
    ring: 'h-[11rem] w-[11rem] sm:h-[12.5rem] sm:w-[12.5rem]',
    medallion: 'login-logo-medallion login-logo-medallion--compact',
    img: 'h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20',
  },
  overlay: {
    ring: 'h-[13.5rem] w-[13.5rem] sm:h-[14.5rem] sm:w-[14.5rem]',
    medallion: 'login-logo-medallion login-logo-medallion--overlay',
    img: 'h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24',
  },
};

type Props = {
  variant?: Variant;
  theme?: ShowcaseTheme;
};

/** Isotipo oficial dentro de anillos orbitando — sin lockup apretado. */
export function LoginBrandShowcase({ variant = 'hero', theme = 'authkit' }: Props) {
  const cfg = layout[variant];
  const isLight = theme === 'mundial-light';

  return (
    <div
      className={`login-pulse-ring relative mx-auto flex items-center justify-center ${cfg.ring}`}
    >
      {isLight ? (
        <>
          <span className="login-orbit-ring absolute -inset-1 sm:-inset-2 rounded-full border-2 border-dashed border-[#0f1a5a]/35" />
          <span className="login-orbit-ring-delay absolute inset-2 sm:inset-3 rounded-full border border-[#162a7f]/40" />
          <span className="login-pulse-a absolute inset-5 sm:inset-6 rounded-full border border-[#e84f51]/30" />
        </>
      ) : (
        <>
          <span className="login-orbit-ring absolute -inset-1 sm:-inset-2 rounded-full border-2 border-dashed border-void-violet/40" />
          <span className="login-orbit-ring-delay absolute inset-2 sm:inset-3 rounded-full border border-blueprint-blue/30" />
          <span className="login-pulse-a absolute inset-5 sm:inset-6 rounded-full border border-[#bad7f7]/30" />
        </>
      )}

      <div
        className={`${cfg.medallion} relative z-10 ${isLight ? 'login-logo-medallion--mundial-light' : ''}`}
      >
        <img
          src={publicAsset(MUNDIAL_ISOTIPO)}
          alt="La Mundial de Seguros"
          className={`${cfg.img} ${isLight ? 'login-logo-glow-mundial' : 'login-logo-glow'} login-orbit-core object-contain`}
          draggable={false}
        />
      </div>
    </div>
  );
}
