import React from 'react';

/** Capa ambiental siempre animada (orbs + grid); estilos críticos inline por si el CSS cacheado va desfasado. */
export function LoginAmbientLayer({ intense = false }: { intense?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className={`login-aurora login-aurora-a ${intense ? 'login-aurora-fast' : ''}`}
        style={{
          position: 'absolute',
          width: 'min(90vw, 520px)',
          height: 'min(90vw, 520px)',
          left: '-12%',
          top: '8%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(102, 58, 243, 0.45) 0%, rgba(102, 58, 243, 0) 68%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className={`login-aurora login-aurora-b ${intense ? 'login-aurora-fast' : ''}`}
        style={{
          position: 'absolute',
          width: 'min(85vw, 480px)',
          height: 'min(85vw, 480px)',
          right: '-8%',
          bottom: '6%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(46, 109, 191, 0.5) 0%, rgba(46, 109, 191, 0) 70%)',
          filter: 'blur(36px)',
        }}
      />
      <div
        className={`login-aurora login-aurora-c ${intense ? 'login-aurora-fast' : ''}`}
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          left: '42%',
          top: '38%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(232, 79, 81, 0.28) 0%, rgba(232, 79, 81, 0) 72%)',
          filter: 'blur(28px)',
        }}
      />
      <div className="login-grid-bg login-grid-animate absolute inset-0" />
      <div className="login-spotlight login-spotlight-spin absolute inset-0 opacity-90" />
      <div className="login-scan-beam absolute inset-0" />
    </div>
  );
}
