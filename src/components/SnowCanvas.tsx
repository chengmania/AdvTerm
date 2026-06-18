// AdvTerm — animated static snow overlay for Futurist theme
// Author: chengmania KC3SMW

import { useEffect, useRef } from 'react';

const FLAKE_COUNT = 350;

export default function SnowCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      // Partial fade — keeps a ghost of previous frame for trail effect
      ctx.fillStyle = 'rgba(5, 13, 26, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < FLAKE_COUNT; i++) {
        const x  = Math.random() * canvas.width;
        const y  = Math.random() * canvas.height;
        const br = 0.3 + Math.random() * 0.7;
        const sz = Math.random() < 0.85 ? 1 : 2;
        // Cyan-tinted pixel — matches Futurist foreground palette
        ctx.fillStyle = `rgba(${Math.floor(br * 80)}, ${Math.floor(br * 210)}, 255, ${br * 0.9})`;
        ctx.fillRect(x, y, sz, sz);
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 3,
        pointerEvents: 'none',
        opacity: 0.18,
      }}
    />
  );
}
