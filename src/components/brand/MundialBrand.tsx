import { publicAsset } from '@/lib/public-asset';

/** Isotipo oficial (M del logo, fondo transparente). */
export const MUNDIAL_ISOTIPO = 'brand/mundial-isotipo.png';
/** Lockup vertical oficial: isotipo + "La Mundial de Seguros". */
export const MUNDIAL_LOCKUP_DARK_TEXT = 'brand/mundial-lockup.png';
/** Lockup para fondos oscuros (texto en blanco). */
export const MUNDIAL_LOCKUP_LIGHT_TEXT = 'brand/mundial-lockup-light.png';

type Props = {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  isotipoClassName?: string;
  subtitle?: string;
};

/** Marca compacta para barras y encabezados: isotipo oficial + wordmark tipográfico. */
export function MundialBrand({
  variant = 'dark',
  showWordmark = true,
  isotipoClassName = 'h-11 w-11',
  subtitle = 'Portal de emisión',
}: Props) {
  const titleColor = variant === 'light' ? 'text-white' : 'text-[#091133]';
  const subtitleColor = variant === 'light' ? 'text-white/65' : 'text-[#777777]';

  return (
    <div className="flex items-center gap-3">
      <img
        src={publicAsset(MUNDIAL_ISOTIPO)}
        alt=""
        className={`${isotipoClassName} object-contain shrink-0`}
        draggable={false}
      />
      {showWordmark && (
        <div className="min-w-0">
          <p className={`font-display text-lg sm:text-xl font-bold leading-tight ${titleColor}`}>
            La Mundial
            <span className="text-[#E84F51] italic font-semibold"> de Seguros</span>
          </p>
          <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] mt-0.5 ${subtitleColor}`}>
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}

/** Lockup oficial con halo, para portadas (login / splash). */
export function MundialLockup({
  onDark = false,
  className = 'w-64',
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <span
        aria-hidden
        className="absolute inset-0 blur-3xl rounded-full"
        style={{
          background: onDark
            ? 'radial-gradient(circle at 35% 30%, rgba(74,141,213,0.35), transparent 62%), radial-gradient(circle at 70% 70%, rgba(232,79,81,0.25), transparent 65%)'
            : 'radial-gradient(circle at 40% 35%, rgba(15,26,90,0.12), transparent 65%)',
        }}
      />
      <img
        src={publicAsset(onDark ? MUNDIAL_LOCKUP_LIGHT_TEXT : MUNDIAL_LOCKUP_DARK_TEXT)}
        alt="La Mundial de Seguros"
        className={`relative ${className} h-auto object-contain select-none`}
        draggable={false}
      />
    </div>
  );
}
