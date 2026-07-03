import { useEffect, useRef, useState } from 'react';

// The 404 page's resident: a lost hollow dot wandering its box.
// It shies away from the cursor; catch it and it settles, filled.
export function LostDot() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [caught, setCaught] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const H = 140;
    let W = wrap.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    const size = () => {
      W = wrap.clientWidth;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dot = { x: W / 2, y: H / 2, vx: 0.4, vy: 0.3 };
    const mouse = { x: -999, y: -999 };
    let isCaught = false;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const dark = document.body.classList.contains('dark-mode');
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
      if (isCaught) {
        ctx.fillStyle = dark ? '#dad9e2' : '#000000';
        ctx.fill();
      } else {
        ctx.strokeStyle = dark ? '#c6c4c4' : '#787878';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    };

    const loop = () => {
      if (!isCaught) {
        // gentle wander
        dot.vx += (Math.random() - 0.5) * 0.12;
        dot.vy += (Math.random() - 0.5) * 0.12;
        // shy of the cursor
        const dm = Math.hypot(dot.x - mouse.x, dot.y - mouse.y);
        if (dm < 80 && dm > 0.001) {
          dot.vx += ((dot.x - mouse.x) / dm) * 0.6;
          dot.vy += ((dot.y - mouse.y) / dm) * 0.6;
        }
        // speed cap + walls
        const sp = Math.hypot(dot.vx, dot.vy);
        const max = 2.4;
        if (sp > max) {
          dot.vx = (dot.vx / sp) * max;
          dot.vy = (dot.vy / sp) * max;
        }
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < 8) (dot.x = 8), (dot.vx = Math.abs(dot.vx));
        if (dot.x > W - 8) (dot.x = W - 8), (dot.vx = -Math.abs(dot.vx));
        if (dot.y < 8) (dot.y = 8), (dot.vy = Math.abs(dot.vy));
        if (dot.y > H - 8) (dot.y = H - 8), (dot.vy = -Math.abs(dot.vy));
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -999;
      mouse.y = -999;
    };
    const onDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const d = Math.hypot(e.clientX - r.left - dot.x, e.clientY - r.top - dot.y);
      if (d < 16 && !isCaught) {
        isCaught = true;
        setCaught(true);
        try {
          localStorage.setItem('lost-dot-rescued', '1');
        } catch {
          /* fine */
        }
      }
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(size) : null;
    ro?.observe(wrap);

    if (reduced) {
      draw(); // it just sits there, resting
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      ro?.disconnect();
    };
  }, []);

  return (
    <div className="lost-dot" ref={wrapRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <p className="lost-dot-caption">
        {caught ? 'You caught it. It lives with you now.' : 'One dot did get lost, though. It’s quick.'}
      </p>
    </div>
  );
}
