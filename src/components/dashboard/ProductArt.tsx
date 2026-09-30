import React from 'react';
import type { PortalProductDto } from '@/lib/nexus-auth';
import { productLine, type ProductLineId } from './product-lines';

type ArtKind =
  | 'car'
  | 'quad'
  | 'home'
  | 'bandage'
  | 'people'
  | 'health'
  | 'plane'
  | 'suitcase'
  | 'candle'
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
  if (line === 'funerario') return 'candle';
  if (line === 'viajes') return /local|nacional/.test(label) ? 'suitcase' : 'plane';
  if (/embarc|nave|barco/.test(label) || Number(product.cramo) === 20) return 'boat';
  if (/4 en 1|integral/.test(label)) return 'quad';
  if (/familiar|hogar/.test(label)) return 'home';
  if (/accident/.test(label)) return 'bandage';
  if (/combinad|personas|colectiv/.test(label)) return 'people';
  if (line === 'personas') return 'health';
  return 'building';
}

const LINE_KIND: Record<ProductLineId, ArtKind> = {
  autos: 'car',
  personas: 'people',
  viajes: 'plane',
  funerario: 'candle',
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
            d="M18 116 H50 M28 132 H54 M14 148 H46"
            stroke={t.detail}
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".7"
          />
          <g className="art-subject">
            <ellipse cx="166" cy="168" rx="116" ry="6" fill={t.ink} opacity=".45" />
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
    case 'quad':
      return (
        <g className="art-subject">
          <ellipse cx="160" cy="176" rx="62" ry="6" fill={t.ink} opacity=".12" />
          <path
            d="M160 26 L218 46 V98 C218 134 192 158 160 170 C128 158 102 134 102 98 V46 Z"
            fill={t.light}
          />
          <path d="M160 26 L218 46 V98 C218 134 192 158 160 170 Z" fill={t.soft} opacity=".55" />
          {/* Cuatro coberturas: vida, salud, accidentes y funerario. */}
          <rect x="128" y="62" width="28" height="28" rx="7" fill={t.soft} />
          <rect x="164" y="62" width="28" height="28" rx="7" fill={t.soft} />
          <rect x="128" y="98" width="28" height="28" rx="7" fill={t.soft} />
          <rect x="164" y="98" width="28" height="28" rx="7" fill={t.soft} />
          <Heart x={132} y={67} s={1} fill={t.accent} />
          <path
            d="M175 67 H181 V73 H187 V79 H181 V85 H175 V79 H169 V73 H175 Z"
            fill={t.ink}
          />
          {/* Curitas cruzadas, como en la escena de Accidentes. */}
          <g transform="rotate(-40 142 112)">
            <rect x="131" y="108.5" width="22" height="7" rx="3.5" fill={t.detail} />
          </g>
          <g transform="rotate(40 142 112)">
            <rect x="131" y="108.5" width="22" height="7" rx="3.5" fill={t.ink} />
            <rect x="138.5" y="108.5" width="7" height="7" fill={t.light} />
          </g>
          {/* Vela, como en la escena de Funerario. */}
          <rect x="174" y="110" width="8" height="12" rx="1.5" fill={t.light} />
          <path
            d="M178 100 C180.5 103.5 182 106 182 107.8 C182 109.8 180.3 111 178 111 C175.7 111 174 109.8 174 107.8 C174 105.8 175.6 103.2 178 100 Z"
            fill={t.accent}
          />
          <rect x="171" y="121.5" width="14" height="2.5" rx="1.25" fill={t.ink} />
          <path
            d="M62 60 v14 M55 67 h14 M262 118 v12 M256 124 h12 M250 44 v8 M246 48 h8"
            stroke={t.detail}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    case 'home':
      return (
        <>
          <path d="M0 172 H320" stroke={t.detail} strokeWidth="2" opacity=".3" />
          <g className="art-subject">
            <rect x="196" y="58" width="14" height="30" fill={t.ink} />
            <rect x="108" y="98" width="104" height="74" fill={t.light} />
            <path d="M92 104 L160 48 L228 104 Z" fill={t.ink} />
            <rect x="148" y="130" width="26" height="42" rx="3" fill={t.detail} />
            <rect x="120" y="112" width="22" height="22" rx="3" fill={t.soft} />
            <Heart x={124} y={117} s={0.7} fill={t.accent} />
            <rect x="182" y="112" width="20" height="20" rx="3" fill={t.soft} />
          </g>
          <circle cx="262" cy="132" r="22" fill={t.detail} opacity=".85" />
          <rect x="259" y="150" width="6" height="22" fill={t.ink} />
          <circle cx="56" cy="146" r="14" fill={t.detail} opacity=".5" />
          <rect x="54" y="156" width="4" height="16" fill={t.ink} opacity=".7" />
        </>
      );
    case 'bandage':
      return (
        <>
          <path
            d="M24 174 H112 L124 156 L138 188 L152 164 H296"
            stroke={t.accent}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g className="art-subject">
            <circle cx="160" cy="92" r="58" fill={t.light} />
            <g transform="rotate(-40 160 92)">
              <rect x="98" y="77" width="124" height="30" rx="15" fill={t.detail} />
            </g>
            <g transform="rotate(40 160 92)">
              <rect x="98" y="77" width="124" height="30" rx="15" fill={t.ink} />
              <rect x="144" y="80" width="32" height="24" rx="4" fill={t.soft} />
              <circle cx="152" cy="88" r="2" fill={t.ink} />
              <circle cx="160" cy="92" r="2" fill={t.ink} />
              <circle cx="168" cy="88" r="2" fill={t.ink} />
              <circle cx="152" cy="96" r="2" fill={t.ink} />
              <circle cx="168" cy="96" r="2" fill={t.ink} />
            </g>
          </g>
        </>
      );
    case 'people':
      return (
        <>
          <path d="M40 174 H280" stroke={t.detail} strokeWidth="2" opacity=".3" />
          <g className="art-subject">
            <circle cx="108" cy="92" r="17" fill={t.ink} />
            <path d="M78 172 C78 138 92 118 108 118 C124 118 138 138 138 172 Z" fill={t.ink} />
            <circle cx="212" cy="92" r="17" fill={t.detail} />
            <path
              d="M182 172 C182 138 196 118 212 118 C228 118 242 138 242 172 Z"
              fill={t.detail}
            />
            <circle cx="160" cy="80" r="22" fill={t.light} />
            <path d="M120 174 C120 132 138 110 160 110 C182 110 200 132 200 174 Z" fill={t.light} />
            <path
              d="M146 112 L160 128 L174 112"
              stroke={t.accent}
              strokeWidth="5"
              fill="none"
              strokeLinejoin="round"
            />
          </g>
          <Heart x={236} y={36} s={1.3} fill={t.accent} />
        </>
      );
    case 'health':
      return (
        <>
          <path
            d="M20 132 H96 L110 108 L126 160 L140 124 H300"
            stroke={t.detail}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity=".55"
          />
          <g className="art-subject">
            <rect x="112" y="46" width="96" height="96" rx="26" fill={t.light} />
            <path
              d="M148 66 H172 V82 H188 V106 H172 V122 H148 V106 H132 V82 H148 Z"
              fill={t.accent}
            />
            <circle cx="160" cy="166" r="6" fill={t.ink} />
          </g>
          <circle cx="258" cy="56" r="9" fill={t.detail} opacity=".5" />
          <circle cx="64" cy="70" r="6" fill={t.detail} opacity=".5" />
        </>
      );
    case 'plane':
      return (
        <>
          <path
            d="M26 176 C86 158 142 128 188 100"
            stroke={t.light}
            strokeWidth="4"
            strokeDasharray="2 11"
            strokeLinecap="round"
            fill="none"
          />
          <g fill={t.light}>
            <circle cx="72" cy="138" r="16" />
            <circle cx="94" cy="128" r="22" />
            <circle cx="118" cy="140" r="14" />
            <rect x="56" y="138" width="76" height="16" rx="8" />
            <circle cx="246" cy="160" r="12" opacity=".8" />
            <circle cx="264" cy="152" r="17" opacity=".8" />
            <rect x="234" y="158" width="52" height="12" rx="6" opacity=".8" />
          </g>
          <g className="art-subject">
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
        </>
      );
    case 'suitcase':
      return (
        <>
          <path
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
    case 'candle':
      return (
        <>
          <circle cx="160" cy="80" r="56" fill={t.soft} />
          <circle cx="160" cy="80" r="34" fill={t.soft} opacity=".9" />
          <g className="art-subject">
            <path d="M144 166 C118 162 102 148 98 128 C120 130 136 144 144 166 Z" fill={t.detail} />
            <path
              d="M176 166 C202 162 218 148 222 128 C200 130 184 144 176 166 Z"
              fill={t.detail}
            />
            <rect x="143" y="96" width="34" height="70" rx="5" fill={t.light} />
            <path d="M160 96 V86" stroke={t.ink} strokeWidth="3" strokeLinecap="round" />
            <path
              d="M160 48 C169 60 174 69 174 76 C174 83 168 88 160 88 C152 88 146 83 146 76 C146 68 152 59 160 48 Z"
              fill={t.accent}
            />
            <path
              d="M160 64 C164 70 166 74 166 78 C166 82 163 84 160 84 C157 84 154 82 154 78 C154 74 156 70 160 64 Z"
              fill="#FFE3E3"
            />
            <rect x="116" y="164" width="88" height="8" rx="4" fill={t.detail} />
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
            <path d="M164 40 V142" stroke={t.ink} strokeWidth="4" />
            <path d="M170 46 L170 132 L234 132 Z" fill={t.light} />
            <path d="M158 58 L158 132 L108 132 Z" fill={t.accent} />
            <path d="M166 40 L184 46 L166 52 Z" fill={t.accent} />
            <path d="M92 140 H240 L220 166 H114 Z" fill={t.ink} />
            <circle cx="140" cy="152" r="3.5" fill={t.light} />
            <circle cx="160" cy="152" r="3.5" fill={t.light} />
            <circle cx="180" cy="152" r="3.5" fill={t.light} />
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
    case 'quad':
    case 'candle':
      return (
        <path
          d="M76 200 V112 C76 64 114 30 160 30 C206 30 244 64 244 112 V200 Z"
          fill={t.soft}
          opacity=".7"
        />
      );
    case 'home':
    case 'suitcase':
    case 'building':
      return (
        <>
          <ellipse cx="170" cy="236" rx="240" ry="84" fill={t.soft} opacity=".75" />
          <circle cx="64" cy="54" r="26" fill={t.soft} />
        </>
      );
    case 'bandage':
      return (
        <g fill="none" stroke={t.soft}>
          <circle cx="160" cy="92" r="78" strokeWidth="16" opacity=".8" />
          <circle cx="160" cy="92" r="112" strokeWidth="12" opacity=".45" />
        </g>
      );
    case 'health':
      return <path d="M0 132 L320 28 V104 L0 208 Z" fill={t.soft} opacity=".6" />;
    case 'people':
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
