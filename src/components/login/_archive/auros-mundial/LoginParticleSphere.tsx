import { useEffect, useRef } from 'react';

type Props = {
  className?: string;
  particleCount?: number;
  radius?: number;
};

/** Esfera de partículas estilo Auros — bioluminescent data orb (canvas 2D). */
export function LoginParticleSphere({ className = '', particleCount = 360, radius = 150 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const particles = Array.from({ length: particleCount }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      size: 0.7 + Math.random() * 2.4,
      tone: Math.random(),
    }));

    let angleY = 0;
    let t = 0;

    const palette = [
      { r: 15, g: 26, b: 90 },
      { r: 22, g: 42, b: 127 },
      { r: 255, g: 255, b: 255 },
      { r: 232, g: 79, b: 81 },
    ];

    const drawFrame = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;

      ctx.clearRect(0, 0, w, h);

      if (!reduced) {
        angleY += 0.0038;
        t += 16;
      }

      const angleX = 0.2 + Math.sin(t * 0.0007) * 0.07;
      const cx = w / 2;
      const cy = h / 2;
      const scale = (Math.min(w, h) / 420) * (radius / 150);

      type Proj = { x: number; y: number; z: number; size: number; tone: number };
      const projected: Proj[] = [];

      for (const p of particles) {
        let x = Math.sin(p.phi) * Math.cos(p.theta);
        let y = Math.cos(p.phi);
        let z = Math.sin(p.phi) * Math.sin(p.theta);

        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        x = x1;
        z = z1;

        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y2 = y * cosX - z * sinX;
        const z2 = y * sinX + z * cosX;
        y = y2;
        z = z2;

        const perspective = 2 / (2.15 - z);
        projected.push({
          x: cx + x * radius * scale * perspective,
          y: cy + y * radius * scale * perspective,
          z,
          size: p.size * perspective,
          tone: p.tone,
        });
      }

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        const depth = (pt.z + 1) / 2;
        let c = palette[0];
        if (pt.tone > 0.9) c = palette[3];
        else if (pt.tone > 0.72) c = palette[2];
        else if (pt.tone > 0.38) c = palette[1];

        const alpha = 0.2 + depth * 0.72;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
        ctx.fill();
      }

      const glowR = radius * scale * 0.55;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grad.addColorStop(0, 'rgba(22,42,127,0.2)');
      grad.addColorStop(0.45, 'rgba(232,79,81,0.08)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };

    const loop = () => {
      drawFrame();
      if (!reduced) rafRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [particleCount, radius]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
