import React from 'react';

/** Orbes suaves animados — canvas claro estilo Apple, colores La Mundial. */
export function LoginAppleMundialAmbient({ intense = false }: { intense?: boolean }) {
  const fast = intense ? 'login-apple-m-aurora-fast' : '';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className={`login-apple-m-aurora login-apple-m-aurora-a ${fast}`} />
      <div className={`login-apple-m-aurora login-apple-m-aurora-b ${fast}`} />
      <div className={`login-apple-m-aurora login-apple-m-aurora-c ${fast}`} />
    </div>
  );
}
