/** Diagrama molecular decorativo (Auros Explore). */
export function LoginMoleculeDecor({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="100" cy="40" r="10" stroke="rgba(237,255,254,0.35)" strokeWidth="1" />
      <circle cx="48" cy="100" r="8" stroke="rgba(187,199,198,0.4)" strokeWidth="1" />
      <circle cx="152" cy="100" r="8" stroke="rgba(187,199,198,0.4)" strokeWidth="1" />
      <circle cx="72" cy="160" r="6" fill="rgba(203,255,252,0.25)" />
      <circle cx="128" cy="160" r="6" fill="rgba(253,233,255,0.2)" />
      <circle cx="100" cy="100" r="14" stroke="rgba(237,255,254,0.5)" strokeWidth="1" />
      <line x1="100" y1="50" x2="100" y2="86" stroke="rgba(187,199,198,0.35)" strokeWidth="1" />
      <line x1="92" y1="100" x2="56" y2="100" stroke="rgba(187,199,198,0.35)" strokeWidth="1" />
      <line x1="108" y1="100" x2="144" y2="100" stroke="rgba(187,199,198,0.35)" strokeWidth="1" />
      <line x1="88" y1="112" x2="76" y2="154" stroke="rgba(187,199,198,0.3)" strokeWidth="1" />
      <line x1="112" y1="112" x2="124" y2="154" stroke="rgba(187,199,198,0.3)" strokeWidth="1" />
    </svg>
  );
}
