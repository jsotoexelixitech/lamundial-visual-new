import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Animaciones de carga del monitor (sin dependencias): cifras que cuentan desde 0 y
 * gráficos que crecen. Todo dura ~700 ms y se apaga con «reducir movimiento».
 */
export const DURACION_MS = 700;

export function menosMovimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Cuenta de 0 al valor cada vez que cambia `clave` (carga o filtro). `null` = sin dato. */
export function useCuenta(objetivo: number | null, clave: unknown, ms = DURACION_MS): number {
  const [v, setV] = useState(0);
  const quieto = objetivo == null || objetivo === 0 || menosMovimiento();
  useEffect(() => {
    if (quieto) return;
    let raf = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(objetivo * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [objetivo, clave, ms, quieto]);
  return quieto ? (objetivo ?? 0) : v;
}

/**
 * Vuelve a disparar las animaciones CSS de crecimiento (`.mx-anim …`) del contenedor
 * cada vez que cambia `clave`, sin desmontar nada (los plegables conservan su estado).
 */
export function useReanimar<T extends HTMLElement>(clave: unknown) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('mx-anim');
    void el.offsetWidth; // reinicia las animaciones
    el.classList.add('mx-anim');
  }, [clave]);
  return ref;
}
