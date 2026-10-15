import React from 'react';

/** Fondo de la vitrina: los mismos planos de las ilustraciones (halo, arco, colina, estela), a escala de página. */
export const VitrinaBackdrop: React.FC = () => (
  <svg
    className="lm-backdrop"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden
    focusable="false"
  >
    <defs>
      <linearGradient id="lm-backdrop-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E3EBF8" />
        <stop offset="1" stopColor="#F1F4FA" />
      </linearGradient>
    </defs>
    <rect width="1440" height="900" fill="url(#lm-backdrop-sky)" />

    <path d="M0 380 L1440 110 V210 L0 480 Z" fill="#FFFFFF" opacity=".4" />

    <circle className="lm-bd-halo" cx="1290" cy="110" r="250" fill="#D5E1F4" opacity=".75" />
    <circle
      cx="1290"
      cy="110"
      r="360"
      fill="none"
      stroke="#D5E1F4"
      strokeWidth="26"
      opacity=".45"
    />

    <path
      d="M-60 900 V650 C-60 520 50 430 180 430 C310 430 420 520 420 650 V900 Z"
      fill="#D9E4F5"
      opacity=".8"
    />

    <path
      d="M0 800 C280 730 600 750 900 800 C1120 838 1300 822 1440 780 V900 H0 Z"
      fill="#CFDCF2"
      opacity=".75"
    />

    <path
      className="lm-bd-trail"
      d="M140 330 C420 250 700 300 980 210 C1100 172 1180 150 1250 150"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="4"
      strokeDasharray="2 16"
      strokeLinecap="round"
      opacity=".95"
    />

    <g stroke="#2E6DBF" strokeWidth="3" strokeLinecap="round" opacity=".28">
      <path d="M92 150 v18 M83 159 h18" />
      <path d="M720 96 v14 M713 103 h14" />
      <path d="M1368 520 v18 M1359 529 h18" />
      <path d="M560 640 v12 M554 646 h12" />
      <path d="M1040 700 v14 M1033 707 h14" />
    </g>
    <g fill="#2E6DBF" opacity=".22">
      <circle cx="300" cy="96" r="6" />
      <circle cx="1120" cy="420" r="8" />
      <circle cx="260" cy="560" r="5" />
      <circle cx="860" cy="560" r="6" />
    </g>
    <circle cx="1250" cy="150" r="7" fill="#E84F51" opacity=".75" />
  </svg>
);

export default VitrinaBackdrop;
