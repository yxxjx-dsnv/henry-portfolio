import { useEffect, useRef, useState } from 'react';

// Typing "tetris" or "strikers" (or the palette) unfolds the dot field into a
// full-screen arcade cabinet and starts a game, still drawn in dots. Esc quits.
// A self-contained canvas game loop, mounted at the app root.

type Game = 'tetris' | 'shmup';

// 7 tetrominoes as 4x4 bitmasks per rotation (classic table)
const TETRO = [
  [0x0f00, 0x2222, 0x00f0, 0x4444],
  [0x6600, 0x6600, 0x6600, 0x6600],
  [0x4e00, 0x4640, 0x0e40, 0x4c40],
  [0x6c00, 0x4620, 0x06c0, 0x8c40],
  [0xc600, 0x2640, 0x0c60, 0x4c80],
  [0x8e00, 0x6440, 0x0e20, 0x44c0],
  [0x2e00, 0x4460, 0x0e80, 0xc440],
];
const TCOL = ['#31c7d4', '#f2c744', '#b06bd6', '#4caf50', '#e0524e', '#4571d6', '#e0913b'];
const cells = (type: number, rot: number): [number, number][] => {
  const m = TETRO[type][rot];
  const out: [number, number][] = [];
  for (let b = 0; b < 16; b++) if (m & (0x8000 >> b)) out.push([b % 4, Math.floor(b / 4)]);
  return out;
};

export function ArcadeOverlay() {
  const [game, setGame] = useState<Game | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const onT = () => setGame('tetris');
    const onS = () => setGame('shmup');
    window.addEventListener('henry:tetris', onT);
    window.addEventListener('henry:shmup', onS);
    return () => {
      window.removeEventListener('henry:tetris', onT);
      window.removeEventListener('henry:shmup', onS);
    };
  }, []);

  useEffect(() => {
    if (!game) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 0;
    let H = 0;
    let raf = 0;
    let phase: 'in' | 'play' | 'out' = 'in';
    let phaseAt = performance.now();
    const EXPAND = 480;
    const COLLAPSE = 360;
    const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const isDark = () => document.body.classList.contains('dark-mode');
    const inkOf = () => (isDark() ? '#e8e8e8' : '#1a1a1a');
    const faintOf = () => (isDark() ? '#3a3a3a' : '#cfcfcf');

    const dot = (x: number, y: number, r: number, color: string, a = 1) => {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    // faint dot background across the whole cabinet
    const drawField = (alpha: number) => {
      const sp = 24;
      const faint = faintOf();
      for (let x = sp / 2; x < W; x += sp) {
        for (let y = sp / 2; y < H; y += sp) {
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.strokeStyle = faint;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    };

    // ---------- Tetris ----------
    const TW = 10;
    const TH = 20;
    let board = new Uint8Array(TW * TH);
    let tType = 0;
    let tRot = 0;
    let tX = 3;
    let tY = -1;
    let tDrop = 0;
    let tOver = false;
    let tScore = 0;
    let tLines = 0;
    const tColl = (type: number, rot: number, x: number, y: number) =>
      cells(type, rot).some(([cx, cy]) => {
        const bx = x + cx;
        const by = y + cy;
        return bx < 0 || bx >= TW || by >= TH || (by >= 0 && board[by * TW + bx] > 0);
      });
    const tSpawn = () => {
      tType = Math.floor(Math.random() * 7);
      tRot = 0;
      tX = 3;
      tY = -1;
      tDrop = performance.now();
      if (tColl(tType, tRot, tX, tY)) tOver = true;
    };
    const tLock = () => {
      cells(tType, tRot).forEach(([cx, cy]) => {
        const by = tY + cy;
        if (by >= 0) board[by * TW + (tX + cx)] = tType + 1;
      });
      let cleared = 0;
      for (let y = TH - 1; y >= 0; ) {
        let full = true;
        for (let x = 0; x < TW; x++) if (!board[y * TW + x]) full = false;
        if (full) {
          cleared++;
          for (let yy = y; yy > 0; yy--) for (let x = 0; x < TW; x++) board[yy * TW + x] = board[(yy - 1) * TW + x];
          for (let x = 0; x < TW; x++) board[x] = 0;
        } else y--;
      }
      if (cleared) {
        tLines += cleared;
        tScore += [0, 100, 300, 500, 800][cleared];
      }
      tSpawn();
    };
    const tRotate = () => {
      const nr = (tRot + 1) % 4;
      if (!tColl(tType, nr, tX, tY)) tRot = nr;
      else if (!tColl(tType, nr, tX - 1, tY)) {
        tX--;
        tRot = nr;
      } else if (!tColl(tType, nr, tX + 1, tY)) {
        tX++;
        tRot = nr;
      }
    };
    const tetrisStart = () => {
      board = new Uint8Array(TW * TH);
      tOver = false;
      tScore = 0;
      tLines = 0;
      tSpawn();
    };
    const drawTetris = (alpha: number) => {
      const cell = Math.min(30, Math.floor((H - 140) / TH), Math.floor((W * 0.6) / TW));
      const x0 = (W - TW * cell) / 2;
      const y0 = (H - TH * cell) / 2 + 10;
      const ink = inkOf();
      ctx.globalAlpha = alpha;
      // well frame
      ctx.strokeStyle = faintOf();
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 - 6, y0 - 6, TW * cell + 12, TH * cell + 12);
      ctx.globalAlpha = 1;
      const r = cell * 0.42;
      for (let y = 0; y < TH; y++) {
        for (let x = 0; x < TW; x++) {
          const cx = x0 + x * cell + cell / 2;
          const cy = y0 + y * cell + cell / 2;
          const v = board[y * TW + x];
          if (v) dot(cx, cy, r, TCOL[v - 1], alpha);
          else dot(cx, cy, 2, faintOf(), alpha * 0.4);
        }
      }
      if (!tOver) {
        for (const [cx2, cy2] of cells(tType, tRot)) {
          const gx = tX + cx2;
          const gy = tY + cy2;
          if (gy < 0) continue;
          dot(x0 + gx * cell + cell / 2, y0 + gy * cell + cell / 2, r, TCOL[tType], alpha);
        }
      }
      // HUD
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ink;
      ctx.font = '600 15px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE ${tScore}`, x0 - 6, y0 - 16);
      ctx.textAlign = 'right';
      ctx.fillText(`LINES ${tLines}`, x0 + TW * cell + 6, y0 - 16);
      if (tOver) {
        ctx.textAlign = 'center';
        ctx.font = '700 26px -apple-system, system-ui, sans-serif';
        ctx.fillText('GAME OVER', W / 2, y0 + TH * cell * 0.5);
        ctx.font = '500 14px -apple-system, system-ui, sans-serif';
        ctx.fillText('press Enter to play again', W / 2, y0 + TH * cell * 0.5 + 26);
      }
      ctx.globalAlpha = 1;
    };
    const updateTetris = (now: number) => {
      if (tOver) return;
      const speed = Math.max(120, 640 - tLines * 24);
      const soft = keys.has('arrowdown') || keys.has('s');
      if (now - tDrop >= (soft ? 55 : speed)) {
        if (!tColl(tType, tRot, tX, tY + 1)) tY++;
        else tLock();
        tDrop = now;
      }
    };

    // ---------- Shmup (1943-ish) ----------
    type Bul = { x: number; y: number };
    type Enemy = { x: number; y: number; vx: number; hp: number; t: number };
    let ship = W / 2;
    let bullets: Bul[] = [];
    let enemies: Enemy[] = [];
    let eBullets: Bul[] = [];
    let sFire = 0;
    let sSpawn = 0;
    let sScore = 0;
    let sLives = 3;
    let sOver = false;
    let sInvuln = 0;
    const shmupStart = () => {
      ship = W / 2;
      bullets = [];
      enemies = [];
      eBullets = [];
      sScore = 0;
      sLives = 3;
      sOver = false;
      sSpawn = 0;
      sInvuln = 0;
    };
    const updateShmup = (now: number, dt: number) => {
      if (sOver) return;
      const spd = 0.42 * dt;
      if (keys.has('arrowleft') || keys.has('a')) ship -= spd;
      if (keys.has('arrowright') || keys.has('d')) ship += spd;
      ship = Math.max(30, Math.min(W - 30, ship));
      const shipY = H - 70;
      // auto fire
      if (now - sFire > 150) {
        bullets.push({ x: ship, y: shipY - 20 });
        sFire = now;
      }
      bullets.forEach((b) => (b.y -= 0.7 * dt));
      bullets = bullets.filter((b) => b.y > -20);
      eBullets.forEach((b) => (b.y += 0.34 * dt));
      eBullets = eBullets.filter((b) => b.y < H + 20);
      // spawn
      const rate = Math.max(420, 1100 - sScore * 2);
      if (now - sSpawn > rate) {
        const ex = 40 + Math.random() * (W - 80);
        enemies.push({ x: ex, y: -20, vx: (Math.random() - 0.5) * 0.12, hp: 1, t: now });
        sSpawn = now;
      }
      enemies.forEach((e) => {
        e.y += 0.14 * dt;
        e.x += e.vx * dt + Math.sin((now - e.t) * 0.003) * 0.3;
        e.x = Math.max(20, Math.min(W - 20, e.x));
        if (Math.random() < 0.004) eBullets.push({ x: e.x, y: e.y + 16 });
      });
      // bullet vs enemy
      for (const e of enemies) {
        for (const b of bullets) {
          if (Math.abs(b.x - e.x) < 18 && Math.abs(b.y - e.y) < 18) {
            e.hp = 0;
            b.y = -999;
            sScore += 10;
          }
        }
      }
      enemies = enemies.filter((e) => {
        if (e.hp <= 0) return false;
        if (e.y > H + 20) return false;
        return true;
      });
      // enemy/enemy-bullet vs ship
      const hit =
        now > sInvuln &&
        (enemies.some((e) => Math.abs(e.x - ship) < 22 && Math.abs(e.y - shipY) < 22) ||
          eBullets.some((b) => Math.abs(b.x - ship) < 14 && Math.abs(b.y - shipY) < 16));
      if (hit) {
        sLives--;
        sInvuln = now + 1400;
        eBullets = [];
        if (sLives <= 0) sOver = true;
      }
    };
    const drawShip = (x: number, y: number, color: string, a: number) => {
      // a little dot plane pointing up
      const pts: [number, number][] = [
        [0, -14],
        [0, -6],
        [-6, 2],
        [0, 2],
        [6, 2],
        [-12, 8],
        [-4, 8],
        [4, 8],
        [12, 8],
        [0, 10],
      ];
      for (const [px, py] of pts) dot(x + px, y + py, 3, color, a);
    };
    const drawShmup = (alpha: number, now: number) => {
      const ink = inkOf();
      const shipY = H - 70;
      for (const b of bullets) dot(b.x, b.y, 3, '#f2c744', alpha);
      for (const b of eBullets) dot(b.x, b.y, 3.2, '#e0524e', alpha);
      for (const e of enemies) {
        const c = '#e0524e';
        [
          [0, 0],
          [-8, -2],
          [8, -2],
          [-5, 6],
          [5, 6],
          [0, -8],
        ].forEach(([px, py]) => dot(e.x + px, e.y + py, 3, c, alpha));
      }
      const blink = now < sInvuln && Math.floor(now / 120) % 2 === 0;
      if (!sOver && !blink) drawShip(ship, shipY, isDark() ? '#dbe6ff' : '#2b3f7a', alpha);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ink;
      ctx.font = '600 15px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE ${sScore}`, 24, 30);
      ctx.textAlign = 'right';
      ctx.fillText('♥'.repeat(Math.max(0, sLives)), W - 24, 30);
      if (sOver) {
        ctx.textAlign = 'center';
        ctx.font = '700 26px -apple-system, system-ui, sans-serif';
        ctx.fillText('GAME OVER', W / 2, H / 2);
        ctx.font = '500 14px -apple-system, system-ui, sans-serif';
        ctx.fillText('press Enter to play again', W / 2, H / 2 + 26);
      }
      ctx.globalAlpha = 1;
    };

    if (game === 'tetris') tetrisStart();
    else shmupStart();

    const keys = new Set<string>();
    let last = performance.now();
    const close = () => setGame(null);

    const loop = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      ctx.clearRect(0, 0, W, H);
      // backdrop
      ctx.fillStyle = isDark() ? 'rgba(10,10,12,0.92)' : 'rgba(245,245,247,0.94)';
      ctx.fillRect(0, 0, W, H);

      let anim = 1;
      if (phase === 'in') {
        anim = ease((now - phaseAt) / EXPAND);
        if (now - phaseAt >= EXPAND) {
          phase = 'play';
        }
      } else if (phase === 'out') {
        anim = 1 - ease((now - phaseAt) / COLLAPSE);
        if (now - phaseAt >= COLLAPSE) {
          close();
          return;
        }
      }

      if (phase === 'play') {
        if (game === 'tetris') updateTetris(now);
        else updateShmup(now, dt);
      }

      ctx.save();
      ctx.translate(W / 2, H / 2);
      const sc = 0.55 + 0.45 * anim;
      ctx.scale(sc, sc);
      ctx.translate(-W / 2, -H / 2);
      drawField(anim);
      if (game === 'tetris') drawTetris(anim);
      else drawShmup(anim, now);
      ctx.restore();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        if (phase !== 'out') {
          phase = 'out';
          phaseAt = performance.now();
        }
        return;
      }
      if (phase !== 'play') return;
      keys.add(k);
      if (game === 'tetris') {
        if (k === 'arrowleft' || k === 'a') {
          e.preventDefault();
          if (!tOver && !tColl(tType, tRot, tX - 1, tY)) tX--;
        } else if (k === 'arrowright' || k === 'd') {
          e.preventDefault();
          if (!tOver && !tColl(tType, tRot, tX + 1, tY)) tX++;
        } else if ((k === 'arrowup' || k === 'w') && !e.repeat) {
          e.preventDefault();
          if (!tOver) tRotate();
        } else if (k === ' ' && !e.repeat) {
          e.preventDefault();
          if (!tOver) {
            while (!tColl(tType, tRot, tX, tY + 1)) tY++;
            tLock();
          }
        } else if (k === 'arrowdown' || k === 's') {
          e.preventDefault();
        } else if (k === 'enter' && tOver) {
          tetrisStart();
        }
      } else {
        if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') e.preventDefault();
        else if (k === 'enter' && sOver) shmupStart();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', resize);
    document.body.classList.add('arcade-open');

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', resize);
      document.body.classList.remove('arcade-open');
    };
  }, [game]);

  if (!game) return null;
  return (
    <div className="arcade-overlay" role="dialog" aria-label={`${game} game`}>
      <canvas ref={canvasRef} />
      <button type="button" className="arcade-close" onClick={() => setGame(null)} aria-label="Close game">
        Esc ✕
      </button>
      <p className="arcade-hint">
        {game === 'tetris'
          ? '← → move · ↑ rotate · ↓ soft drop · space hard drop · Esc quit'
          : '← → move · auto-fire · dodge · Esc quit'}
      </p>
    </div>
  );
}
