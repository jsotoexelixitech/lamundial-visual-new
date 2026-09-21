import React from 'react';

/** Fondo claro: manchas suaves lime + tissue (sin grid ni rotaciones). */
export function LoginOrganicAmbient({ intense = false }: { intense?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={`login-organic-blob login-organic-blob-a ${intense ? 'login-organic-fast' : ''}`}
      />
      <div
        className={`login-organic-blob login-organic-blob-b ${intense ? 'login-organic-fast' : ''}`}
      />
      <div className="login-organic-grain absolute inset-0 opacity-[0.35]" />
    </div>
  );
}
