import React, { useState } from 'react';
import { ArrowRight, Zap, Building2, Heart } from 'lucide-react';
import type { ProductConfig } from '@/lib/portal-config';
import clsx from 'clsx';

interface Props {
  product: ProductConfig;
  onLaunch: (product: ProductConfig) => void;
}

const ICONS = {
  rcv: <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
    <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z" fill="rgba(255,255,255,0.2)"/>
    <path d="M7 13l2.5 2.5L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 17h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M6 17c0-1 .5-2 1.5-2.5L9 15M18 17c0-1-.5-2-1.5-2.5L15 15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>,
  patrimonial: <Building2 size={28} color="white" strokeWidth={1.5} />,
  funerario: <Heart size={28} color="white" strokeWidth={1.5} />,
};

const CARD_CONFIG = {
  rcv: {
    iconClass: 'product-icon-rcv',
    cardClass: 'product-card-rcv',
    tag: 'Más usado',
    tagColor: '#E84F51',
    accentColor: '#E84F51',
    steps: ['OCR', 'Formulario', 'Emisión', 'Pagos'],
    stepColor: 'bg-red-100 text-red-700',
    btnColor: 'linear-gradient(135deg, #E84F51 0%, #b23f44 100%)',
    btnHover: 'rgba(232,79,81,0.08)',
  },
  patrimonial: {
    iconClass: 'product-icon-patrimonial',
    cardClass: 'product-card-patrimonial',
    tag: 'Patrimoniales',
    tagColor: '#0F1A5A',
    accentColor: '#0F1A5A',
    steps: ['Emisión', 'Cotización', 'Póliza'],
    stepColor: 'bg-blue-100 text-blue-800',
    btnColor: 'linear-gradient(135deg, #0F1A5A 0%, #091133 100%)',
    btnHover: 'rgba(15,26,90,0.08)',
  },
  funerario: {
    iconClass: 'product-icon-funerario',
    cardClass: 'product-card-funerario',
    tag: 'Vida',
    tagColor: '#ACACAC',
    accentColor: '#777777',
    steps: ['OCR', 'Formulario', 'Emisión'],
    stepColor: 'bg-gray-200 text-gray-700',
    btnColor: 'linear-gradient(135deg, #ACACAC 0%, #777777 100%)',
    btnHover: 'rgba(172,172,172,0.08)',
  },
};

export const ProductCard: React.FC<Props> = ({ product, onLaunch }) => {
  const [hovered, setHovered] = useState(false);
  const cfg = CARD_CONFIG[product.key];

  return (
    <div
      id={`card-${product.key}`}
      className={clsx('product-card rounded-3xl p-8 flex flex-col gap-6', cfg.cardClass)}
      style={{ animation: `card-float ${6 + Math.random() * 3}s ease-in-out infinite` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ícono + tag */}
      <div className="flex items-start justify-between">
        <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center', cfg.iconClass)}>
          {ICONS[product.key]}
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: `${cfg.accentColor}15`, color: cfg.accentColor }}
        >
          {cfg.tag}
        </span>
      </div>

      {/* Título y descripción */}
      <div className="flex-1">
        <h3 className="text-2xl font-display font-bold text-mundial-gray mb-2">{product.label}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
      </div>

      {/* Pasos del flujo */}
      <div className="flex flex-wrap gap-1.5">
        {cfg.steps.map((step, i) => (
          <span key={step} className={clsx('text-xs font-semibold px-2.5 py-1 rounded-lg', cfg.stepColor)}>
            {i > 0 && <span className="mr-1.5 opacity-50">→</span>}
            {step}
          </span>
        ))}
      </div>

      {/* Botón launch */}
      <button
        id={`launch-${product.key}`}
        onClick={() => onLaunch(product)}
        className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all"
        style={{
          background: cfg.btnColor,
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: hovered ? `0 12px 30px ${cfg.accentColor}35` : 'none',
        }}
      >
        <Zap size={16} className={hovered ? 'animate-bounce' : ''} />
        Iniciar flujo
        <ArrowRight size={16} className={clsx('transition-transform', hovered && 'translate-x-1')} />
      </button>
    </div>
  );
};

export default ProductCard;
