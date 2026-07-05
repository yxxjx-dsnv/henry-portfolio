import { useEffect, useRef } from 'react';

// The site's signature hollow dot, multiplied into a quiet field.
// At rest: a faint static grid. Near the cursor: dots fill and lean in,
// like the timeline markers do. Click: a ripple runs through the field.
// Pure canvas, mono only, no colors. Renders static under reduced motion.

const SPACING = 22;
const DOT_R = 2.2;
const REACH = 85; // cursor influence radius
const RIPPLE_SPEED = 0.45; // px per ms
const RIPPLE_WIDTH = 60;
const RIPPLE_LIFE = 1400; // ms

type Ripple = { x: number; y: number; born: number };

export function DotField({ height = 132 }: { height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // jsdom / very old browsers

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let raf = 0;
    let running = false;
    const mouse = { x: -9999, y: -9999, inside: false, px: -9999, py: -9999, dragging: false };
    let ripples: Ripple[] = [];
    // per-dot stir displacement (index = grid cell), spring back to rest
    let stir = new Map<number, { ox: number; oy: number; vx: number; vy: number }>();
    // page-scroll inertia (shared spring, per-dot weight) + idle blinks
    let scrollOy = 0;
    let scrollVy = 0;
    let blinks: { i: number; j: number; born: number }[] = [];

    const colors = () => {
      const dark = document.body.classList.contains('dark-mode');
      return dark
        ? { stroke: '#3f3f3f', fill: '#dad9e2' }
        : { stroke: '#cfcfcf', fill: '#000000' };
    };

    const resize = () => {
      width = wrap.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    const draw = (now: number) => {
      const { stroke, fill } = colors();
      ctx.clearRect(0, 0, width, height);
      ripples = ripples.filter((r) => now - r.born < RIPPLE_LIFE);

      // scroll inertia settles back
      scrollVy = (scrollVy - scrollOy * 0.08) * 0.82;
      scrollOy += scrollVy;
      if (Math.abs(scrollOy) < 0.05 && Math.abs(scrollVy) < 0.05) {
        scrollOy = 0;
        scrollVy = 0;
      }
      blinks = blinks.filter((b) => now - b.born < 1600);

      // integrate stir springs; drop settled dots
      for (const [k, d] of stir) {
        d.vx = (d.vx - d.ox * 0.06) * 0.86;
        d.vy = (d.vy - d.oy * 0.06) * 0.86;
        d.ox += d.vx;
        d.oy += d.vy;
        if (Math.hypot(d.ox, d.oy) < 0.15 && Math.hypot(d.vx, d.vy) < 0.05) stir.delete(k);
      }

      const cols = Math.floor((width - SPACING) / SPACING);
      const rows = Math.floor((height - SPACING / 2) / SPACING);
      const offX = (width - (cols - 1) * SPACING) / 2;
      const offY = (height - (rows - 1) * SPACING) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const gx = offX + i * SPACING;
          const gy = offY + j * SPACING;

          // cursor influence: 0..1
          const dm = Math.hypot(gx - mouse.x, gy - mouse.y);
          let t = mouse.inside ? Math.max(0, 1 - dm / REACH) : 0;

          // idle blink influence
          for (const b of blinks) {
            if (b.i === i && b.j === j) {
              const ph = (now - b.born) / 1600;
              t = Math.max(t, Math.sin(ph * Math.PI) * 0.85);
            }
          }
          // ripple influence
          for (const r of ripples) {
            const age = now - r.born;
            const radius = age * RIPPLE_SPEED;
            const dr = Math.abs(Math.hypot(gx - r.x, gy - r.y) - radius);
            const fade = 1 - age / RIPPLE_LIFE;
            t = Math.max(t, Math.max(0, 1 - dr / RIPPLE_WIDTH) * fade);
          }

          // dots lean slightly toward the cursor, like they noticed
          let x = gx;
          let y = gy;
          const st = stir.get(i * 1000 + j);
          if (st) {
            x += st.ox;
            y += st.oy;
          }
          if (scrollOy !== 0) {
            // pseudo-random per-cell weight so the field flutters, not slides
            y += scrollOy * (0.4 + (((i * 7 + j * 13) % 5) / 5) * 0.6);
          }
          if (mouse.inside && dm > 0.001 && dm < REACH) {
            const pull = 3.5 * (1 - dm / REACH);
            x += ((mouse.x - gx) / dm) * pull;
            y += ((mouse.y - gy) / dm) * pull;
          }

          ctx.beginPath();
          ctx.arc(x, y, DOT_R + t * 0.9, 0, Math.PI * 2);
          if (t > 0.02) {
            ctx.globalAlpha = 0.25 + t * 0.75;
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    const loop = (now: number) => {
      draw(now);
      if (mouse.inside || ripples.length > 0 || stir.size > 0 || scrollOy !== 0 || blinks.length > 0) {
        raf = requestAnimationFrame(loop);
      } else {
        running = false;
        draw(performance.now()); // settle to the resting grid
      }
    };
    const wake = () => {
      if (!running && !reduced) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      // dragging stirs the field: fling nearby dots along the stroke
      if (mouse.dragging && mouse.px > -999) {
        const mvx = nx - mouse.px;
        const mvy = ny - mouse.py;
        const cols = Math.floor((width - SPACING) / SPACING);
        const rows = Math.floor((height - SPACING / 2) / SPACING);
        const offX = (width - (cols - 1) * SPACING) / 2;
        const offY = (height - (rows - 1) * SPACING) / 2;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const d = Math.hypot(offX + i * SPACING - nx, offY + j * SPACING - ny);
            if (d < 70) {
              const k = i * 1000 + j;
              const st = stir.get(k) ?? { ox: 0, oy: 0, vx: 0, vy: 0 };
              const w = (1 - d / 70) * 0.35;
              st.vx += mvx * w;
              st.vy += mvy * w;
              stir.set(k, st);
            }
          }
        }
      }
      mouse.px = nx;
      mouse.py = ny;
      mouse.x = nx;
      mouse.y = ny;
      mouse.inside = true;
      wake();
    };
    const onLeave = () => {
      mouse.inside = false;
      mouse.x = -9999;
      mouse.y = -9999;
      wake();
    };
    const onClick = (e: PointerEvent) => {
      if (reduced) return;
      mouse.dragging = true;
      const rect = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, born: performance.now() });
      wake();
    };
    const onUp = () => {
      mouse.dragging = false;
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onClick);
    window.addEventListener('pointerup', onUp);

    // the field flutters with page scroll
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      if (reduced) return;
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      scrollVy += Math.max(-6, Math.min(6, dy * 0.10));
      wake();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // while nobody's around, one dot occasionally blinks
    const blinkTimer = reduced
      ? undefined
      : setInterval(() => {
          if (document.hidden || mouse.inside) return;
          const cols = Math.floor((width - SPACING) / SPACING);
          const rows = Math.floor((height - SPACING / 2) / SPACING);
          if (cols < 1 || rows < 1) return;
          blinks.push({
            i: Math.floor(Math.random() * cols),
            j: Math.floor(Math.random() * rows),
            born: performance.now(),
          });
          wake();
        }, 7000);

    // repaint when the theme flips (the sweep repaints the page; we follow)
    const observer = new MutationObserver(() => draw(performance.now()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(wrap);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onClick);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
      if (blinkTimer) clearInterval(blinkTimer);
      observer.disconnect();
      ro?.disconnect();
    };
  }, [height]);

  return (
    <div className="dot-field" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} style={{ touchAction: 'pan-y' }} />
    </div>
  );
}
