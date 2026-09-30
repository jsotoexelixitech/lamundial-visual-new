import React from 'react';
import type { PortalProductDto } from '@/lib/nexus-auth';
import { productLine, type ProductLineId } from './product-lines';

type ArtKind =
  | 'car'
  | 'heartHand'
  | 'family'
  | 'fall'
  | 'care'
  | 'ambulance'
  | 'plane'
  | 'suitcase'
  | 'dove'
  | 'boat'
  | 'building';

interface Theme {
  bg: string;
  soft: string;
  light: string;
  ink: string;
  accent: string;
  detail: string;
}

/** Escenario por línea: tintes del manual (Pennsylvania, azules, plata) con un solo acento Imperial. */
const THEMES: Record<ProductLineId, Theme> = {
  autos: {
    bg: '#0F1A5A',
    soft: '#1C2A78',
    light: '#FFFFFF',
    ink: '#070D33',
    accent: '#E84F51',
    detail: '#7FA7E0',
  },
  personas: {
    bg: '#E4ECF9',
    soft: '#CCDBF2',
    light: '#FFFFFF',
    ink: '#0F1A5A',
    accent: '#E84F51',
    detail: '#2E6DBF',
  },
  viajes: {
    bg: '#D3E3F7',
    soft: '#B7CFEF',
    light: '#FFFFFF',
    ink: '#0F1A5A',
    accent: '#E84F51',
    detail: '#2E6DBF',
  },
  funerario: {
    bg: '#131A45',
    soft: '#222B62',
    light: '#F4F5F8',
    ink: '#0A0F2E',
    accent: '#E84F51',
    detail: '#ACACAC',
  },
  patrimoniales: {
    bg: '#EAEBF0',
    soft: '#D8DAE2',
    light: '#FFFFFF',
    ink: '#0F1A5A',
    accent: '#E84F51',
    detail: '#8A93B8',
  },
};

function productArtKind(product: PortalProductDto): ArtKind {
  const label = product.label.toLowerCase();
  const line = productLine(product);
  if (line === 'autos') return 'car';
  if (line === 'funerario') return 'dove';
  if (line === 'viajes') return /local|nacional/.test(label) ? 'suitcase' : 'plane';
  if (/embarc|nave|barco/.test(label) || Number(product.cramo) === 20) return 'boat';
  if (/4 en 1|integral/.test(label)) return 'heartHand';
  if (/familiar|hogar/.test(label)) return 'family';
  if (/accident/.test(label)) return 'fall';
  if (/combinad|personas|colectiv/.test(label)) return 'care';
  if (line === 'personas') return 'ambulance';
  return 'building';
}

const LINE_KIND: Record<ProductLineId, ArtKind> = {
  autos: 'car',
  personas: 'care',
  viajes: 'plane',
  funerario: 'dove',
  patrimoniales: 'building',
};

function Heart({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M10 18 C4 13 0 9.5 0 5.5 C0 2.4 2.4 0 5.4 0 C7.4 0 9 1.1 10 2.7 C11 1.1 12.6 0 14.6 0 C17.6 0 20 2.4 20 5.5 C20 9.5 16 13 10 18 Z"
      fill={fill}
    />
  );
}

function Scene({ kind, t }: { kind: ArtKind; t: Theme }) {
  switch (kind) {
    case 'car':
      return (
        <>
          <path
            className="art-speed"
            d="M18 116 H50 M28 132 H54 M14 148 H46"
            stroke={t.detail}
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".7"
          />
          <g className="art-subject">
            <ellipse cx="166" cy="168" rx="116" ry="6" fill={t.ink} opacity=".45" />
            <g className="art-bob">
              <path
                d="M58 150 V126 C58 118 64 113 72 112 L104 108 L132 84 C137 80 143 78 150 78 H204 C212 78 218 81 223 87 L242 108 L262 112 C270 114 274 120 274 128 V150 Z"
                fill={t.light}
              />
              <path d="M141 88 L121 107 H176 V88 Z" fill={t.detail} />
              <path d="M184 88 V107 H231 L217 91 C215 89 212 88 209 88 Z" fill={t.detail} />
              <rect x="58" y="130" width="216" height="6" fill={t.accent} />
              <path d="M180 110 V148" stroke="#D5DCEE" strokeWidth="2" />
              <rect x="262" y="116" width="12" height="7" rx="2" fill="#FFD9D9" />
              <circle cx="104" cy="152" r="21" fill={t.ink} />
              <circle cx="104" cy="152" r="9" fill={t.detail} />
              <circle cx="230" cy="152" r="21" fill={t.ink} />
              <circle cx="230" cy="152" r="9" fill={t.detail} />
            </g>
          </g>
          <g className="art-badge">
            <path
              d="M262 40 L284 49 V66 C284 79 274 88 262 93 C250 88 240 79 240 66 V49 Z"
              fill={t.accent}
            />
            <path
              d="M252 66 L259 73 L272 59"
              stroke={t.light}
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      );
    case 'heartHand':
      // 4 en 1: mano que sostiene un corazón protegido (como en el marketplace).
      return (
        <>
          <path
            d="M58 58 v14 M51 65 h14 M268 124 v12 M262 130 h12"
            stroke={t.detail}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g className="art-subject">
            <g className="art-beat">
              <Heart x={112} y={30} s={4.6} fill={t.light} />
              <Heart x={134} y={50} s={2.4} fill={t.soft} />
            </g>
            <path
              d="M40 150 H92 C104 150 112 146 122 140 L150 124 C160 118 172 122 172 132 C172 140 166 144 158 148 L136 158 H172 C188 158 206 150 224 136 C234 128 248 134 244 146 C238 162 212 182 176 184 H40 Z"
              fill={t.ink}
            />
            <rect x="24" y="144" width="26" height="46" rx="4" fill={t.detail} />
          </g>
          <g className="art-badge">
            <path
              d="M214 68 L238 77 V94 C238 108 227 117 214 122 C201 117 190 108 190 94 V77 Z"
              fill={t.accent}
            />
            <path
              d="M203 94 L211 102 L225 87"
              stroke={t.light}
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      );
    case 'family':
      // Combinado Familiar: padre, madre e hijo de la mano.
      return (
        <>
          <path d="M20 176 H300" stroke={t.detail} strokeWidth="2" opacity=".35" />
          <g className="art-subject">
            <g className="art-sway">
              <circle cx="108" cy="58" r="16" fill={t.ink} />
              <path
                d="M88 80 H128 C136 80 142 86 142 94 V128 C142 132 139 134 135 134 H132 V176 H116 V140 H100 V176 H84 V134 H81 C77 134 74 132 74 128 V94 C74 86 80 80 88 80 Z"
                fill={t.ink}
              />
              <circle cx="212" cy="58" r="16" fill={t.detail} />
              <path
                d="M192 80 H232 C240 80 246 86 246 94 V128 C246 132 243 134 239 134 H236 L242 176 H182 L188 134 H185 C181 134 178 132 178 128 V94 C178 86 184 80 192 80 Z"
                fill={t.detail}
              />
              <circle cx="160" cy="102" r="12" fill={t.accent} />
              <path
                d="M149 120 H171 C176 120 180 124 180 129 V146 C180 149 178 150 176 150 H174 V176 H164 V154 H156 V176 H146 V150 H144 C142 150 140 149 140 146 V129 C140 124 144 120 149 120 Z"
                fill={t.accent}
              />
              <path
                d="M140 126 L136 118 M180 126 L184 118"
                stroke={t.accent}
                strokeWidth="7"
                strokeLinecap="round"
              />
            </g>
          </g>
          <g className="art-beat">
            <Heart x={150} y={40} s={1} fill={t.accent} />
          </g>
        </>
      );
    case 'fall':
      // Accidentes Personales: persona que cae de una escalera.
      return (
        <>
          <g className="art-subject">
            <ellipse cx="170" cy="178" rx="96" ry="5" fill={t.ink} opacity=".12" />
            <path
              d="M206 34 V178 M244 34 V178 M206 58 H244 M206 84 H244 M206 110 H244 M206 136 H244 M206 162 H244"
              stroke={t.ink}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <g className="art-wobble">
              <g transform="rotate(-28 128 112)">
                <circle cx="128" cy="62" r="15" fill={t.ink} />
                <rect x="114" y="82" width="28" height="50" rx="12" fill={t.detail} />
                <path
                  d="M116 90 L94 70 M140 90 L160 66 M120 128 L110 164 M136 128 L150 162"
                  stroke={t.ink}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </g>
            </g>
            <path
              className="art-blink"
              d="M72 118 C64 126 64 138 72 146 M58 110 C46 124 46 142 58 156"
              stroke={t.detail}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g className="art-badge">
            <rect x="268" y="30" width="10" height="34" rx="5" fill={t.accent} />
            <circle cx="273" cy="78" r="6" fill={t.accent} />
          </g>
        </>
      );
    case 'care':
      // Combinado de Personas: dos manos que cuidan un corazón con cruz.
      return (
        <>
          <path
            d="M60 50 v12 M54 56 h12 M262 48 v14 M255 55 h14"
            stroke={t.detail}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g className="art-subject">
            <circle cx="160" cy="86" r="58" fill={t.light} />
            <g className="art-beat">
              <Heart x={124} y={52} s={3.6} fill={t.accent} />
              <path
                d="M154 70 H166 V80 H176 V92 H166 V102 H154 V92 H144 V80 H154 Z"
                fill={t.light}
              />
            </g>
            <path
              className="art-hand-l"
              d="M20 150 H58 C74 150 88 142 102 128 C110 120 122 124 120 134 C118 144 110 152 100 158 L84 168 C102 168 118 164 132 154 L140 148 C146 144 152 152 148 158 C136 176 112 186 84 186 H20 Z"
              fill={t.ink}
            />
            <path
              className="art-hand-r"
              d="M300 150 H262 C246 150 232 142 218 128 C210 120 198 124 200 134 C202 144 210 152 220 158 L236 168 C218 168 202 164 188 154 L180 148 C174 144 168 152 172 158 C184 176 208 186 236 186 H300 Z"
              fill={t.detail}
            />
          </g>
        </>
      );
    case 'ambulance':
      // Salud Individual: ambulancia (como en el marketplace).
      return (
        <>
          <path
            className="art-speed"
            d="M18 118 H48 M26 134 H52 M14 150 H44"
            stroke={t.detail}
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".6"
          />
          <path
            className="art-blink"
            d="M126 50 L118 40 M146 46 V34 M166 50 L174 40"
            stroke={t.detail}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <g className="art-subject">
            <ellipse cx="166" cy="172" rx="108" ry="5" fill={t.ink} opacity=".14" />
            <g className="art-bob">
              <rect x="128" y="56" width="36" height="14" rx="5" fill={t.detail} />
              <rect x="66" y="70" width="150" height="84" rx="12" fill={t.light} />
              <path d="M216 92 H246 C254 92 260 96 264 103 L278 128 V154 H216 Z" fill={t.light} />
              <path d="M224 100 H244 L258 126 H224 Z" fill={t.detail} />
              <rect x="66" y="136" width="212" height="6" fill={t.soft} />
              <path
                d="M132 88 H150 V102 H164 V120 H150 V134 H132 V120 H118 V102 H132 Z"
                fill={t.accent}
              />
              <circle cx="106" cy="156" r="18" fill={t.ink} />
              <circle cx="106" cy="156" r="7" fill={t.soft} />
              <circle cx="240" cy="156" r="18" fill={t.ink} />
              <circle cx="240" cy="156" r="7" fill={t.soft} />
            </g>
          </g>
        </>
      );
    case 'dove':
      // Funerario: paloma (como en el marketplace).
      return (
        <>
          <circle cx="160" cy="96" r="62" fill={t.soft} />
          <g className="art-subject">
            <g className="art-float">
              <path
                d="M70 150 C86 146 98 140 108 130 C112 108 136 92 172 94 C184 80 204 72 222 76 C232 78 238 86 236 94 L250 100 L234 104 C230 132 204 154 170 158 C146 160 124 154 108 146 L78 162 C80 156 76 152 70 150 Z"
                fill={t.light}
              />
              <path
                className="art-flap"
                d="M126 110 C122 76 136 50 166 36 C170 58 168 84 158 106 C148 112 136 114 126 110 Z"
                fill={t.detail}
              />
              <path d="M236 96 L252 100 L236 104 Z" fill={t.accent} />
              <circle cx="222" cy="90" r="3" fill={t.ink} />
              <path
                d="M196 150 C204 164 214 170 228 172 M212 162 C218 156 226 154 232 156"
                stroke={t.detail}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          </g>
        </>
      );
    case 'plane':
      return (
        <>
          <path
            className="art-dash"
            d="M26 176 C86 158 142 128 188 100"
            stroke={t.light}
            strokeWidth="4"
            strokeDasharray="2 11"
            strokeLinecap="round"
            fill="none"
          />
          <g className="art-drift" fill={t.light}>
            <circle cx="72" cy="138" r="16" />
            <circle cx="94" cy="128" r="22" />
            <circle cx="118" cy="140" r="14" />
            <rect x="56" y="138" width="76" height="16" rx="8" />
            <circle cx="246" cy="160" r="12" opacity=".8" />
            <circle cx="264" cy="152" r="17" opacity=".8" />
            <rect x="234" y="158" width="52" height="12" rx="6" opacity=".8" />
          </g>
          <g className="art-subject">
            <g className="art-fly">
              <g transform="translate(222 82) rotate(-24)">
                <path d="M-6 -8 L-22 -56 H-8 L28 -8 Z" fill={t.detail} />
                <path d="M-6 8 L-22 56 H-8 L28 8 Z" fill={t.detail} />
                <path d="M-40 -7 L-54 -28 H-45 L-28 -7 Z" fill={t.accent} />
                <path d="M-40 7 L-54 28 H-45 L-28 7 Z" fill={t.accent} />
                <path
                  d="M-54 0 C-54 -6 -46 -9 -36 -9 H40 C52 -9 62 -5 66 0 C62 5 52 9 40 9 H-36 C-46 9 -54 6 -54 0 Z"
                  fill={t.ink}
                />
                <path d="M44 -5 C52 -5 58 -3 61 0 H44 Z" fill={t.detail} />
              </g>
            </g>
          </g>
        </>
      );
    case 'suitcase':
      return (
        <>
          <path
            className="art-dash"
            d="M186 126 C214 118 228 106 234 94"
            stroke={t.detail}
            strokeWidth="3.5"
            strokeDasharray="1 9"
            strokeLinecap="round"
            fill="none"
          />
          <g className="art-subject">
            <ellipse cx="148" cy="174" rx="58" ry="5" fill={t.ink} opacity=".15" />
            <path
              d="M130 72 V58 C130 51 135 46 142 46 H154 C161 46 166 51 166 58 V72"
              stroke={t.ink}
              strokeWidth="8"
              fill="none"
            />
            <rect x="96" y="70" width="104" height="96" rx="14" fill={t.ink} />
            <rect x="118" y="70" width="10" height="96" fill={t.light} opacity=".92" />
            <rect x="168" y="70" width="10" height="96" fill={t.light} opacity=".92" />
            <circle cx="148" cy="118" r="11" fill={t.accent} />
            <circle cx="112" cy="170" r="5" fill={t.ink} />
            <circle cx="184" cy="170" r="5" fill={t.ink} />
          </g>
          <g className="art-badge">
            <path
              d="M242 30 C229 30 219 40 219 53 C219 70 242 94 242 94 C242 94 265 70 265 53 C265 40 255 30 242 30 Z"
              fill={t.accent}
            />
            <circle cx="242" cy="53" r="8" fill={t.light} />
          </g>
        </>
      );
    case 'boat':
      return (
        <>
          <path
            d="M0 158 C26 150 52 150 80 158 C108 166 134 166 160 158 C186 150 212 150 240 158 C268 166 294 166 320 158 V200 H0 Z"
            fill={t.soft}
          />
          <g className="art-subject">
            <g className="art-rock">
              <path d="M164 40 V142" stroke={t.ink} strokeWidth="4" />
              <path d="M170 46 L170 132 L234 132 Z" fill={t.light} />
              <path d="M158 58 L158 132 L108 132 Z" fill={t.accent} />
              <path className="art-flag" d="M166 40 L184 46 L166 52 Z" fill={t.accent} />
              <path d="M92 140 H240 L220 166 H114 Z" fill={t.ink} />
              <circle cx="140" cy="152" r="3.5" fill={t.light} />
              <circle cx="160" cy="152" r="3.5" fill={t.light} />
              <circle cx="180" cy="152" r="3.5" fill={t.light} />
            </g>
          </g>
          <path
            d="M20 180 C40 174 60 174 80 180 M220 184 C240 178 260 178 280 184"
            stroke={t.detail}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
    case 'building':
    default:
      return (
        <>
          <path d="M0 172 H320" stroke={t.detail} strokeWidth="2" opacity=".4" />
          <g className="art-subject">
            <rect x="118" y="40" width="70" height="132" rx="4" fill={t.ink} />
            {[0, 1, 2, 3, 4].map((r) =>
              [0, 1, 2].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  className="art-window"
                  style={{ animationDelay: `${((r * 3 + c * 7) % 11) * 0.45}s` }}
                  x={128 + c * 18}
                  y={52 + r * 22}
                  width="12"
                  height="14"
                  rx="2"
                  fill={t.light}
                  opacity={r === 1 && c === 2 ? 1 : 0.85}
                />
              )),
            )}
            <rect x="184" y="92" width="62" height="80" rx="4" fill={t.light} />
            <rect x="196" y="106" width="14" height="16" rx="2" fill={t.detail} />
            <rect x="220" y="106" width="14" height="16" rx="2" fill={t.detail} />
            <rect x="206" y="140" width="18" height="32" rx="2" fill={t.accent} />
          </g>
          <circle cx="82" cy="148" r="18" fill={t.detail} opacity=".6" />
          <rect x="80" y="160" width="4" height="12" fill={t.ink} opacity=".7" />
        </>
      );
  }
}

interface ArtProps {
  kind: ArtKind;
  line: ProductLineId;
  className?: string;
}

/** Plano de fondo propio por tipo de escena, para que la galería no repita un mismo telón. */
function Backdrop({ kind, t }: { kind: ArtKind; t: Theme }) {
  switch (kind) {
    case 'heartHand':
      return (
        <path
          d="M76 200 V112 C76 64 114 30 160 30 C206 30 244 64 244 112 V200 Z"
          fill={t.soft}
          opacity=".7"
        />
      );
    case 'family':
    case 'suitcase':
    case 'building':
      return (
        <>
          <ellipse cx="170" cy="236" rx="240" ry="84" fill={t.soft} opacity=".75" />
          <circle cx="64" cy="54" r="26" fill={t.soft} />
        </>
      );
    case 'care':
      return (
        <g fill="none" stroke={t.soft}>
          <circle cx="160" cy="92" r="78" strokeWidth="16" opacity=".8" />
          <circle cx="160" cy="92" r="112" strokeWidth="12" opacity=".45" />
        </g>
      );
    case 'ambulance':
      return <path d="M0 132 L320 28 V104 L0 208 Z" fill={t.soft} opacity=".6" />;
    case 'fall':
      return (
        <>
          <circle cx="66" cy="60" r="54" fill={t.soft} opacity=".7" />
          <circle cx="292" cy="170" r="64" fill={t.soft} opacity=".5" />
        </>
      );
    case 'boat':
      return <circle cx="82" cy="70" r="40" fill={t.soft} />;
    case 'plane':
      return (
        <>
          <circle cx="258" cy="58" r="66" fill={t.soft} opacity=".6" />
          <path d="M0 190 C80 150 170 150 320 176 V200 H0 Z" fill={t.soft} opacity=".5" />
        </>
      );
    case 'car':
    default:
      return (
        <>
          <circle cx="252" cy="58" r="62" fill={t.soft} opacity=".7" />
          <circle cx="40" cy="190" r="74" fill={t.soft} opacity=".55" />
        </>
      );
  }
}

function Art({ kind, line, className }: ArtProps) {
  const t = THEMES[line];
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      data-art={kind}
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="320" height="200" fill={t.bg} />
      <Backdrop kind={kind} t={t} />
      <Scene kind={kind} t={t} />
    </svg>
  );
}

/** Ilustración del producto (escena propia por tipo de cobertura). */
export const ProductArt: React.FC<{
  product: PortalProductDto;
  className?: string;
}> = ({ product, className }) => (
  <Art kind={productArtKind(product)} line={productLine(product)} className={className} />
);

/** Ilustración representativa de una línea comercial (pestañas). */
export const LineArt: React.FC<{ line: ProductLineId; className?: string }> = ({
  line,
  className,
}) => <Art kind={LINE_KIND[line]} line={line} className={className} />;
