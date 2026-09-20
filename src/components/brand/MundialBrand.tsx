import { publicAsset } from '@/lib/public-asset';

type Props = {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  isotipoClassName?: string;
};

export function MundialBrand({
  variant = 'dark',
  showWordmark = true,
  isotipoClassName = 'h-14 w-14',
}: Props) {
  const titleColor = variant === 'light' ? 'text-white' : 'text-[#091133]';
  const subtitleColor = variant === 'light' ? 'text-white/70' : 'text-[#777777]';

  return (
    <div className="flex items-center gap-4">
      <img
        src={publicAsset('brand/mundial-isotipo.svg')}
        alt=""
        className={`${isotipoClassName} object-contain shrink-0`}
        draggable={false}
      />
      {showWordmark && (
        <div className="min-w-0">
          <p className={`font-display text-xl sm:text-2xl font-bold leading-tight ${titleColor}`}>
            La Mundial
            <span className="text-[#E84F51] italic font-semibold"> de Seguros</span>
          </p>
          <p className={`text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] mt-1 ${subtitleColor}`}>
            Portal de emisión
          </p>
        </div>
      )}
    </div>
  );
}
