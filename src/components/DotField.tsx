import { useEffect, useRef } from 'react';
import { SKYLINE_EVENT } from './KoreaEasterEgg';

// The site's signature hollow dot, multiplied into a quiet field.
// At rest: a faint static grid. Near the cursor: dots fill and lean in,
// like the timeline markers do. Click: a ripple runs through the field.
// Pure canvas, mono only — except once: clicking "South Korea" makes the field
// bloom, briefly, into a taegukgi drawn in its own dots. Renders static under
// reduced motion.

const SPACING = 10;
const DOT_R = 1.9;
const REACH = 85; // cursor influence radius
const RIPPLE_SPEED = 0.45; // px per ms
const RIPPLE_WIDTH = 60;
const RIPPLE_LIFE = 1400; // ms

type Ripple = { x: number; y: number; born: number };

// --- Seoul skyline easter egg (clicking "South Korea"): a baked 128x32 dot mask
// of the skyline — N Seoul Tower, Lotte World Tower, the Han river bridge ---
const FLAG_TOTAL = 4200; // ms the skyline stays on
const FLAG_IN = 550;
const FLAG_OUT = 900;
const SKY_W = 128;
const SKY_H = 32;
const SKYLINE = [
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000800000000',
  '00000000000000000000000e00000000',
  '00000000000000000000000e00000000',
  '00000000000000000000000e00000000',
  '00000000000000000000001e00000000',
  '00000000000000000000001e00000000',
  '00000000000000000000001e00000000',
  '00000000000000000000001e00000000',
  '00000000000000000000001f00000000',
  '00000000000000000000001f00000000',
  '00000000000000000000001f00000000',
  '00000000000000000000001f00000000',
  '00000000000008000000003f00000000',
  '00000007800008000000003f00000000',
  '0000000f80000c000000003f00000000',
  '0000000f80000c000000003f00000000',
  '0000000f800008000000003f00000000',
  '0000000f800008000000003f00000000',
  '0000000f800009000000003f00000000',
  '0000260f80000d000000103f00000000',
  '0000770f8007ffc000191cff80000000',
  '0000772f807ffffdc8ff9cffc0f40000',
  '000c777f83fffffffdffffffe0fc0000',
  '001e77fffffffffffffffffffdfd8400',
  '003f7fffffffffffffffffffffffee00',
  '007ffffffffffffffffffffffffffe00',
  '00ffffffffff807ffffffffffffffe00',
  '01fffffffffffffffffffffffffffe00',
  '07ffffffffffffffffffffffffffff80',
];
// true if field cell (i,j of cols×rows) falls on a building
function skylineOn(i: number, j: number, cols: number, rows: number): boolean {
  const gx0 = Math.floor((i / cols) * SKY_W);
  const gx1 = Math.max(gx0 + 1, Math.floor(((i + 1) / cols) * SKY_W));
  const gy0 = Math.floor((j / rows) * SKY_H);
  const gy1 = Math.max(gy0 + 1, Math.floor(((j + 1) / rows) * SKY_H));
  let tot = 0;
  let dk = 0;
  for (let y = gy0; y < gy1 && y < SKY_H; y++) {
    const rowHex = SKYLINE[y];
    for (let x = gx0; x < gx1 && x < SKY_W; x++) {
      tot++;
      if ((parseInt(rowHex[x >> 2], 16) >> (3 - (x & 3))) & 1) dk++;
    }
  }
  return tot > 0 && dk / tot > 0.28;
}

// --- birthday easter egg: App fires 'henry:hbd' (the 0627 code) and this blooms it ---
const HBD_COLOR = '#e0a43b';
const HBD_L1 = 'HBD';
const HBD_L2 = 'HENRY';
// 5x5 glyphs, one 5-bit mask per row (MSB = leftmost pixel)
const HBD_FONT: Record<string, number[]> = {
  H: [0b10001, 0b10001, 0b11111, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b11110, 0b10001, 0b11110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b11110, 0b10000, 0b11111],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001],
  R: [0b11110, 0b10001, 0b11110, 0b10100, 0b10001],
  Y: [0b10001, 0b01010, 0b00100, 0b00100, 0b00100],
};
const glyphW = (s: string) => s.length * 5 + (s.length - 1); // 5 wide + 1 gap each

// --- cat easter egg: a cute cat silhouette (not dots) that trots after the cursor ---
function drawCat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  face: number,
  phase: number,
  color: string,
) {
  const P = (px: number, py: number): [number, number] => [x + face * px * s, y + py * s];
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // tail
  ctx.lineWidth = 0.26 * s;
  const tail: [number, number][] = [
    [-0.9, 0.15],
    [-1.5, 0.0],
    [-1.6, -0.6],
    [-1.25, -0.95],
  ];
  ctx.beginPath();
  tail.forEach((t, i) => {
    const [tx, ty] = P(t[0], t[1]);
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  });
  ctx.stroke();
  // legs (walk animation)
  ctx.lineWidth = 0.2 * s;
  const sw = Math.sin(phase) * 0.16;
  ([
    [-0.55, sw],
    [-0.15, -sw],
    [0.5, sw * 0.8],
    [0.85, -sw * 0.8],
  ] as [number, number][]).forEach(([lx, ph]) => {
    const a = P(lx, 0.45);
    const b = P(lx + ph, 1.05);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  });
  // body
  const bc = P(0, 0);
  ctx.beginPath();
  ctx.ellipse(bc[0], bc[1], 1.05 * s, 0.58 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // head
  const hc = P(0.95, -0.28);
  ctx.beginPath();
  ctx.arc(hc[0], hc[1], 0.52 * s, 0, Math.PI * 2);
  ctx.fill();
  // ears
  const ear = (a: [number, number], b: [number, number], c: [number, number]) => {
    const pa = P(...a);
    const pb = P(...b);
    const pc = P(...c);
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.lineTo(pc[0], pc[1]);
    ctx.closePath();
    ctx.fill();
  };
  ear([0.6, -0.55], [0.68, -1.05], [0.98, -0.62]);
  ear([1.05, -0.62], [1.32, -1.0], [1.4, -0.5]);
  ctx.restore();
}

// the cursor becomes a cat teaser wand: a rod, a swaying string, a dangling feather
function drawWand(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, sway: number) {
  const ax = x + 44; // where the string meets the rod (up and to the right)
  const ay = y - 50;
  const rx = ax + 34; // far end of the rod
  const ry = ay - 28;
  ctx.save();
  ctx.lineCap = 'round';
  // rod
  ctx.strokeStyle = '#9c6b3f';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(rx, ry);
  ctx.stroke();
  ctx.fillStyle = '#7c5230';
  ctx.beginPath();
  ctx.arc(rx, ry, 2.6, 0, Math.PI * 2);
  ctx.fill();
  // string, swaying with motion
  ctx.strokeStyle = 'rgba(160,160,160,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo((ax + x) / 2 + sway, (ay + y) / 2, x, y);
  ctx.stroke();
  // feather dangling at the cursor
  ctx.translate(x, y);
  ctx.rotate(0.45 - sway * 0.02 + Math.sin(t * 0.006) * 0.12);
  ctx.fillStyle = '#ef6b8e';
  ctx.beginPath();
  ctx.ellipse(0, 13, 6, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c94f70';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.lineTo(0, 25);
  ctx.stroke();
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const yy = 5 + i * 5;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(-5, yy + 3);
    ctx.moveTo(0, yy);
    ctx.lineTo(5, yy + 3);
    ctx.stroke();
  }
  ctx.restore();
}

// sitting cat (groom = 0..~0.35 dips the head, as if washing)
function drawCatSit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  face: number,
  color: string,
  groom: number,
) {
  const P = (px: number, py: number): [number, number] => [x + face * px * s, y + py * s];
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.2 * s;
  const tail: [number, number][] = [
    [-0.7, 0.9],
    [-1.0, 0.5],
    [-0.6, 0.2],
    [0.1, 0.5],
    [0.6, 0.85],
  ];
  ctx.beginPath();
  tail.forEach((p, i) => {
    const q = P(p[0], p[1]);
    if (i) ctx.lineTo(q[0], q[1]);
    else ctx.moveTo(q[0], q[1]);
  });
  ctx.stroke();
  ctx.lineWidth = 0.18 * s;
  for (const lx of [0.2, 0.5]) {
    const a = P(lx, 0.35);
    const b = P(lx, 1.0);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }
  const bc = P(-0.15, 0.05);
  ctx.beginPath();
  ctx.ellipse(bc[0], bc[1], 0.72 * s, 0.92 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const hc = P(0.35, -0.75 + groom);
  ctx.beginPath();
  ctx.arc(hc[0], hc[1], 0.5 * s, 0, Math.PI * 2);
  ctx.fill();
  const ear = (a: [number, number], b: [number, number], c: [number, number]) => {
    const pa = P(a[0], a[1] + groom);
    const pb = P(b[0], b[1] + groom);
    const pc = P(c[0], c[1] + groom);
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.lineTo(pc[0], pc[1]);
    ctx.closePath();
    ctx.fill();
  };
  ear([0.02, -1.0], [0.1, -1.5], [0.4, -1.05]);
  ear([0.45, -1.05], [0.72, -1.45], [0.8, -0.95]);
  ctx.restore();
}

// curled-up sleeping cat with a rising "z"
function drawCatSleep(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, t: number) {
  const P = (px: number, py: number): [number, number] => [x + px * s, y + py * s];
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.18 * s;
  const tail: [number, number][] = [
    [-1.0, 0.3],
    [-1.3, -0.2],
    [-0.9, -0.5],
    [-0.3, -0.55],
  ];
  ctx.beginPath();
  tail.forEach((p, i) => {
    const q = P(p[0], p[1]);
    if (i) ctx.lineTo(q[0], q[1]);
    else ctx.moveTo(q[0], q[1]);
  });
  ctx.stroke();
  const bc = P(0, 0.1);
  ctx.beginPath();
  ctx.ellipse(bc[0], bc[1], 1.15 * s, 0.62 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const hc = P(0.75, 0.15);
  ctx.beginPath();
  ctx.arc(hc[0], hc[1], 0.45 * s, 0, Math.PI * 2);
  ctx.fill();
  const ear = (a: [number, number], b: [number, number], c: [number, number]) => {
    const pa = P(...a);
    const pb = P(...b);
    const pc = P(...c);
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.lineTo(pc[0], pc[1]);
    ctx.closePath();
    ctx.fill();
  };
  ear([0.5, -0.2], [0.5, -0.6], [0.85, -0.25]);
  ear([0.9, -0.3], [1.15, -0.55], [1.15, -0.05]);
  ctx.font = `${Math.round(0.8 * s)}px Georgia, serif`;
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.004);
  ctx.fillText('z', x + 1.35 * s, y - 0.7 * s - ((t * 0.012) % 22));
  ctx.globalAlpha = 1;
  ctx.restore();
}

// a "bread loaf" resting cat — rounded, paws tucked, head up
function drawCatLoaf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, face: number, color: string) {
  const P = (px: number, py: number): [number, number] => [x + face * px * s, y + py * s];
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.18 * s;
  const tail: [number, number][] = [
    [-1.0, 0.55],
    [-1.25, 0.1],
    [-0.85, -0.1],
    [0.4, 0.25],
    [0.95, 0.55],
  ];
  ctx.beginPath();
  tail.forEach((p, i) => {
    const q = P(p[0], p[1]);
    if (i) ctx.lineTo(q[0], q[1]);
    else ctx.moveTo(q[0], q[1]);
  });
  ctx.stroke();
  const bc = P(-0.1, 0.18);
  ctx.beginPath();
  ctx.ellipse(bc[0], bc[1], 1.05 * s, 0.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const hc = P(0.72, -0.48);
  ctx.beginPath();
  ctx.arc(hc[0], hc[1], 0.5 * s, 0, Math.PI * 2);
  ctx.fill();
  const ear = (a: [number, number], b: [number, number], c: [number, number]) => {
    const pa = P(...a);
    const pb = P(...b);
    const pc = P(...c);
    ctx.beginPath();
    ctx.moveTo(pa[0], pa[1]);
    ctx.lineTo(pb[0], pb[1]);
    ctx.lineTo(pc[0], pc[1]);
    ctx.closePath();
    ctx.fill();
  };
  ear([0.42, -0.72], [0.5, -1.18], [0.74, -0.78]);
  ear([0.78, -0.8], [1.02, -1.12], [1.06, -0.66]);
  ctx.restore();
}

// --- band easter egg: little NPC musicians playing to a beat ---
const BAND_BASS = [110, 110, 146.83, 98]; // A2 A2 D3 G2 — a simple bass loop
const BAND_KINDS = ['drum', 'guitar', 'bass', 'sing', 'key'];
function drawMusician(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  kind: string,
  bob: number,
  arm: number,
  color: string,
) {
  const P = (px: number, py: number): [number, number] => [x + px * s, y + py * s - bob * s];
  const line = (a: [number, number], b: [number, number]) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  };
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const lw = Math.max(2, 0.16 * s);
  ctx.lineWidth = lw;
  line(P(-0.05, 0.45), P(-0.22, 1.0));
  line(P(0.05, 0.45), P(0.22, 1.0));
  ctx.lineWidth = 0.34 * s;
  line(P(0, -0.45), P(0, 0.45));
  ctx.lineWidth = lw;
  const [hx, hy] = P(0, -0.8);
  ctx.beginPath();
  ctx.arc(hx, hy, 0.34 * s, 0, Math.PI * 2);
  ctx.fill();
  const sh = P(0, -0.4);
  if (kind === 'guitar' || kind === 'bass') {
    const [gx, gy] = P(0.35, 0.15);
    ctx.beginPath();
    ctx.ellipse(gx, gy, 0.32 * s, 0.24 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 0.1 * s;
    line(P(0.35, 0.05), P(-0.5, -0.45));
    ctx.lineWidth = lw;
    line(sh, P(0.3 + arm * 0.15, 0.1));
    line(sh, P(-0.45, -0.35));
  } else if (kind === 'drum') {
    const [dx, dy] = P(0, 0.5);
    ctx.beginPath();
    ctx.ellipse(dx, dy, 0.4 * s, 0.28 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    line(sh, P(-0.35, 0.35 - arm * 0.4));
    line(sh, P(0.35, 0.35 - (1 - arm) * 0.4));
  } else if (kind === 'sing') {
    line(sh, P(0.06, -0.72));
    const [mx, my] = P(0.12, -0.78);
    ctx.beginPath();
    ctx.arc(mx, my, 0.11 * s, 0, Math.PI * 2);
    ctx.fill();
    line(sh, P(-0.4, -0.62 + arm * 0.22));
  } else {
    const [kx, ky] = P(0, 0.28);
    ctx.fillRect(kx - 0.45 * s, ky - 0.05 * s, 0.9 * s, 0.13 * s);
    line(sh, P(-0.25, 0.2 + arm * 0.04));
    line(sh, P(0.25, 0.2 + (1 - arm) * 0.04));
  }
  ctx.restore();
}

// --- piano easter egg: the field becomes a keyboard (white keys + black keys) ---
const PIANO_WHITES = 10; // white keys spanning the field (q w e r t y u i o p)
const PIANO_GOLD = '#e0a43b';
const WHITE_SEMI = [0, 2, 4, 5, 7, 9, 11];
const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const whiteMidi = (i: number) => 60 + WHITE_SEMI[i % 7] + 12 * Math.floor(i / 7); // q = middle C (도)
// a black key sits after white C, D, F, G, A in each octave (the 2-then-3 groups)
const PIANO_BLACKS: { cx: number; midi: number }[] = [];
for (let i = 0; i < PIANO_WHITES - 1; i++) {
  if ([0, 1, 3, 4, 5].includes(i % 7)) {
    PIANO_BLACKS.push({ cx: (i + 1) / PIANO_WHITES, midi: whiteMidi(i) + 1 });
  }
}

function hbdLit(i: number, j: number, cols: number, rows: number): boolean {
  const top = Math.floor((rows - 12) / 2); // two 5-row lines + a 2-row gap = 12
  const lines: [string, number][] = [
    [HBD_L1, top],
    [HBD_L2, top + 7],
  ];
  for (const [line, r0] of lines) {
    if (j >= r0 && j <= r0 + 4) {
      const r = j - r0;
      const c0 = Math.floor((cols - glyphW(line)) / 2);
      const loc = i - c0;
      if (loc >= 0 && loc < glyphW(line)) {
        const ci = loc % 6;
        if (ci < 5 && (HBD_FONT[line[Math.floor(loc / 6)]][r] >> (4 - ci)) & 1) return true;
      }
    }
  }
  return false;
}

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
    let flagStart = -Infinity; // taeguk bloom start (performance.now)
    let hbdStart = -Infinity; // "HBD HENRY" bloom start (performance.now)
    // generative / game modes that take over the whole field
    let mode: 'idle' | 'life' | 'snake' | 'cat' | 'piano' | 'band' = 'idle';
    let bandStart = 0;
    let bandBeat = -1;
    let catX = 0;
    let catY = 0;
    let catFace = 1;
    let catWalk = 0;
    let catJumpY = 0;
    let catJumpV = 0;
    let catJumpAt = 0;
    let catState:
      | 'chase'
      | 'sit'
      | 'groom'
      | 'wander'
      | 'zoom'
      | 'sleep'
      | 'stalk'
      | 'pounce'
      | 'startle'
      | 'spin'
      | 'stretch'
      | 'loaf'
      | 'caught' = 'sit';
    let catStateAt = 0;
    let toyPX = 0;
    let toyPY = 0;
    let toyStill = 0;
    let wanderX = 0;
    let wanderY = 0;
    let wandVX = 0;
    let catLungeVX = 0; // horizontal momentum from a pounce or bat
    let audio: AudioContext | null = null;
    let whiteLit: number[] = [];
    let blackLit: number[] = [];
    let pianoKey = '';
    let life: Uint8Array | null = null; // Conway grid, cols*rows
    let lifeTick = 0;
    let lifeStart = 0;
    let snakeBody: [number, number][] = [];
    let snakeDir: [number, number] = [1, 0];
    let snakeNextDir: [number, number] = [1, 0];
    let snakeFood: [number, number] = [0, 0];
    let snakeTick = 0;
    let snakeOver = false;
    let snakeDeadAt = 0;

    const colors = () => {
      const dark = document.body.classList.contains('dark-mode');
      // `black` = the piano's black keys: darker than the white keys in dark mode,
      // lighter than them in light mode, so they read as the recessed keys either way
      return dark
        ? { stroke: '#3f3f3f', fill: '#dad9e2', black: '#54555b' }
        : { stroke: '#cfcfcf', fill: '#000000', black: '#b4b4b4' };
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
      const { stroke, fill, black } = colors();
      ctx.clearRect(0, 0, width, height);
      // in cat mode, the field hides the cursor and shows only the laser
      wrap.classList.toggle('cat-mode', mode === 'cat');
      document.body.classList.toggle('cat-laser', mode === 'cat' && mouse.inside);
      // while an egg game/instrument is live, page number-nav yields its keys to it
      document.body.classList.toggle('egg-playing', mode !== 'idle');
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

      // Conway's Game of Life — the field comes alive for ~18s
      if (mode === 'life') {
        if (!life || life.length !== cols * rows) {
          mode = 'idle';
        } else {
          if (now - lifeTick >= 120) {
            const nx = new Uint8Array(cols * rows);
            for (let x = 0; x < cols; x++) {
              for (let y = 0; y < rows; y++) {
                let nb = 0;
                for (let a = -1; a <= 1; a++) {
                  for (let b = -1; b <= 1; b++) {
                    if (!a && !b) continue;
                    nb += life[((x + a + cols) % cols) * rows + ((y + b + rows) % rows)];
                  }
                }
                const al = life[x * rows + y];
                nx[x * rows + y] = (al ? nb === 2 || nb === 3 : nb === 3) ? 1 : 0;
              }
            }
            life = nx;
            lifeTick = now;
          }
          for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
              const gx = offX + x * SPACING;
              const gy = offY + y * SPACING;
              ctx.beginPath();
              if (life[x * rows + y]) {
                ctx.arc(gx, gy, DOT_R + 1.5, 0, Math.PI * 2);
                ctx.fillStyle = fill;
                ctx.fill();
              } else {
                ctx.arc(gx, gy, DOT_R, 0, Math.PI * 2);
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          }
          if (now - lifeStart > 18000) mode = 'idle';
          return;
        }
      }

      // Snake — steer with the arrow keys or WASD, Esc to quit
      if (mode === 'snake') {
        if (!snakeOver && now - snakeTick >= 130) {
          snakeDir = snakeNextDir;
          const [hx, hy] = snakeBody[0];
          const nh: [number, number] = [hx + snakeDir[0], hy + snakeDir[1]];
          const hit =
            nh[0] < 0 ||
            nh[0] >= cols ||
            nh[1] < 0 ||
            nh[1] >= rows ||
            snakeBody.some(([bx, by]) => bx === nh[0] && by === nh[1]);
          if (hit) {
            snakeOver = true;
            snakeDeadAt = now;
          } else {
            snakeBody.unshift(nh);
            if (nh[0] === snakeFood[0] && nh[1] === snakeFood[1]) {
              let f: [number, number];
              do {
                f = [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
              } while (snakeBody.some(([x, y]) => x === f[0] && y === f[1]));
              snakeFood = f;
            } else {
              snakeBody.pop();
            }
          }
          snakeTick = now;
        }
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            ctx.beginPath();
            ctx.arc(offX + x * SPACING, offY + y * SPACING, DOT_R, 0, Math.PI * 2);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(offX + snakeFood[0] * SPACING, offY + snakeFood[1] * SPACING, DOT_R + 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#e0a43b';
        ctx.fill();
        snakeBody.forEach(([bx, by], k) => {
          ctx.beginPath();
          ctx.arc(offX + bx * SPACING, offY + by * SPACING, DOT_R + (k === 0 ? 2 : 1.4), 0, Math.PI * 2);
          ctx.fillStyle = snakeOver ? '#dc2626' : fill;
          ctx.fill();
        });
        if (snakeOver && now - snakeDeadAt > 1500) mode = 'idle';
        return;
      }

      // a cat with a real cat's attention span (oneko-style): it chases the toy,
      // loses interest when the toy sits still, sits, grooms, gets the zoomies,
      // wanders, and finally sleeps — then springs awake when the toy darts again
      if (mode === 'cat') {
        const toyX = mouse.inside ? mouse.x : toyPX;
        const toyY = mouse.inside ? mouse.y : toyPY;
        const toyDX = toyX - toyPX;
        const toyMove = Math.hypot(toyDX, toyY - toyPY);
        wandVX = wandVX * 0.82 + toyDX * 0.18;
        toyPX = toyX;
        toyPY = toyY;
        if (toyMove > 2.5) toyStill = 0;
        else toyStill += 16;
        const dToy = Math.hypot(toyX - catX, toyY - catY);
        const rightEdge = offX + (cols - 1) * SPACING;

        const busy = catState === 'stalk' || catState === 'pounce' || catState === 'startle' || catState === 'caught';
        // toy jabbed right onto the cat, fast → startle: arch up and hop back
        if (mouse.inside && toyMove > 20 && dToy < SPACING * 2.6 && !busy) {
          catState = 'startle';
          catStateAt = now;
          catLungeVX = -Math.sign(toyX - catX || 1) * 5;
          catJumpV = -2.4;
        } else if (mouse.inside && toyMove > 5 && !busy && catState !== 'chase') {
          // a darting toy wakes the cat from any restful/idle state
          catState = 'chase';
          catStateAt = now;
        }
        if (catState === 'startle') {
          if (now - catStateAt > 550) {
            catState = 'chase';
            catStateAt = now;
          }
        } else if (catState === 'caught') {
          if (now - catStateAt > 750) {
            catState = 'chase'; // the feather wriggles free
            catStateAt = now;
          }
        } else if (catState === 'chase') {
          if (toyStill > 1500 && dToy < SPACING * 3) {
            catState = 'sit';
            catStateAt = now;
          } else if (
            // toy is near and calm — drop low and stalk it
            dToy < SPACING * 6 &&
            dToy > SPACING * 2.4 &&
            toyMove < 6 &&
            now - catStateAt > 500 &&
            Math.random() < 0.02
          ) {
            catState = 'stalk';
            catStateAt = now;
          }
        } else if (catState === 'stalk') {
          if (toyMove > 10) {
            catState = 'chase'; // toy bolted
            catStateAt = now;
          } else if (dToy < SPACING * 2.3 || now - catStateAt > 1700) {
            // POUNCE — leap at the toy
            catState = 'pounce';
            catStateAt = now;
            const dx = toyX - catX;
            const dy = toyY - catY;
            const d = Math.hypot(dx, dy) || 1;
            catLungeVX = (dx / d) * 7.5;
            catJumpV = -4.4;
            catFace = dx > 0 ? 1 : -1;
          }
        } else if (catState === 'pounce') {
          if (catJumpY >= 0 && Math.abs(catLungeVX) < 0.6) {
            catState = dToy < SPACING * 1.7 ? 'caught' : toyStill > 900 ? 'sit' : 'chase';
            catStateAt = now;
          }
        } else if (catState === 'spin') {
          if (now - catStateAt > 1200) {
            catState = 'sit';
            catStateAt = now;
          }
        } else if (catState === 'stretch') {
          if (now - catStateAt > 750) {
            catState = 'sit';
            catStateAt = now;
          }
        } else if (catState === 'loaf') {
          if (now - catStateAt > 6000) {
            catState = Math.random() < 0.5 ? 'sleep' : 'sit';
            catStateAt = now;
          }
        } else if (catState === 'sit') {
          const el = now - catStateAt;
          if (el > 9000) {
            catState = 'sleep';
            catStateAt = now;
          } else if (el > 1500 && Math.random() < 0.022) {
            const r = Math.random();
            if (r < 0.22) catState = 'groom';
            else if (r < 0.5) {
              catState = 'wander';
              wanderX = offX + (0.1 + Math.random() * 0.8) * (cols - 1) * SPACING;
              wanderY = offY + (0.3 + Math.random() * 0.5) * (rows - 1) * SPACING;
            } else if (r < 0.68) catState = 'zoom';
            else if (r < 0.82) catState = 'spin';
            else if (r < 0.92) catState = 'stretch';
            else catState = 'loaf';
            catStateAt = now;
          }
        } else if (catState === 'groom') {
          if (now - catStateAt > 2600) {
            catState = 'sit';
            catStateAt = now;
          }
        } else if (catState === 'wander') {
          if (Math.hypot(wanderX - catX, wanderY - catY) < SPACING) {
            catState = 'sit';
            catStateAt = now;
          } else if (Math.random() < 0.01) {
            // change its mind mid-stroll
            wanderX = offX + (0.1 + Math.random() * 0.8) * (cols - 1) * SPACING;
            wanderY = offY + (0.3 + Math.random() * 0.5) * (rows - 1) * SPACING;
          }
        } else if (catState === 'zoom') {
          if (now - catStateAt > 1600) {
            catState = 'sit';
            catStateAt = now;
          }
        }

        // movement per state
        if (catState === 'chase') {
          const stop = SPACING * 2.6; // trail well behind the toy, don't glue
          const dx = toyX - catX;
          const dy = toyY - catY;
          if (dToy > stop) {
            const ex = 0.03 + Math.min(0.1, (dToy - stop) * 0.0016);
            catX += dx * ex;
            catY += dy * ex * 0.55;
            catFace = dx > 0 ? 1 : -1;
            catWalk += Math.min(0.5, dToy * 0.013);
          } else {
            catFace = toyX > catX ? 1 : -1;
            // bat at the toy with a paw when it's right there
            if (catLungeVX === 0 && now - catJumpAt > 700 && Math.random() < 0.04) {
              catLungeVX = Math.sign(dx || 1) * 3.2;
              catJumpV = -1.6;
              catJumpAt = now;
            }
          }
          if (catJumpY > -1 && now - catJumpAt > 1500 && Math.random() < 0.01) {
            catJumpV = -3.2; // occasional idle hop
            catJumpAt = now;
          }
        } else if (catState === 'stalk') {
          const dx = toyX - catX;
          const dy = toyY - catY;
          catX += dx * 0.018; // slow, low creep
          catY += dy * 0.018 * 0.55;
          if (Math.abs(dx) > 1) catFace = dx > 0 ? 1 : -1;
          catWalk += 0.07;
          // the tell-tale butt wiggle just before a pounce
          if (dToy < SPACING * 3.4 || now - catStateAt > 1100) catX += Math.sin(now * 0.033) * 1.3;
        } else if (catState === 'wander') {
          const dx = wanderX - catX;
          const dy = wanderY - catY;
          catX += dx * 0.03;
          catY += dy * 0.03;
          if (Math.abs(dx) > 1) catFace = dx > 0 ? 1 : -1;
          catWalk += 0.18;
        } else if (catState === 'zoom') {
          catX += catFace * 6;
          if (catX < offX + 24) catFace = 1;
          if (catX > rightEdge - 24) catFace = -1;
          catWalk += 0.9;
          if (catJumpY > -1 && now - catJumpAt > 600 && Math.random() < 0.05) {
            catJumpV = -3;
            catJumpAt = now;
          }
        } else if (catState === 'spin') {
          catWalk += 1.2; // chasing its own tail
        } else if (catState === 'pounce') {
          catWalk += 0.35;
        } else if (catState === 'sit' || catState === 'groom' || catState === 'loaf') {
          // rest, but keep an eye on the toy (turn to face it)
          if (mouse.inside && Math.abs(toyX - catX) > SPACING) catFace = toyX > catX ? 1 : -1;
        }

        // pounce/bat momentum, then gravity for the jump arc
        catX += catLungeVX;
        catLungeVX *= 0.86;
        if (Math.abs(catLungeVX) < 0.3) catLungeVX = 0;
        catJumpV += 0.34;
        catJumpY += catJumpV;
        if (catJumpY > 0) {
          catJumpY = 0;
          catJumpV = 0;
        }
        catX = Math.max(offX + 8, Math.min(rightEdge - 8, catX));
        catY = Math.max(offY, Math.min(offY + (rows - 1) * SPACING, catY));

        // faint field behind
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            ctx.beginPath();
            ctx.arc(offX + x * SPACING, offY + y * SPACING, DOT_R, 0, Math.PI * 2);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        const drawY = catY - 6 + catJumpY;
        if (catState === 'sleep') drawCatSleep(ctx, catX, drawY, SPACING * 1.35, fill, now);
        else if (catState === 'loaf') drawCatLoaf(ctx, catX, drawY, SPACING * 1.32, catFace, fill);
        else if (catState === 'sit') drawCatSit(ctx, catX, drawY, SPACING * 1.3, catFace, fill, 0);
        else if (catState === 'groom')
          drawCatSit(ctx, catX, drawY, SPACING * 1.3, catFace, fill, Math.abs(Math.sin(now * 0.012)) * 0.35);
        else if (catState === 'stretch') {
          const st = Math.sin(Math.min(1, (now - catStateAt) / 750) * Math.PI); // 0→1→0
          ctx.save();
          ctx.translate(catX, drawY);
          ctx.scale(1 + st * 0.5, 1 - st * 0.12);
          drawCat(ctx, 0, 0, SPACING * 1.3, catFace, catWalk, fill);
          ctx.restore();
        } else if (catState === 'startle') {
          ctx.save();
          ctx.translate(catX, drawY);
          ctx.scale(1, 1.35); // arched up
          drawCat(ctx, 0, 0, SPACING * 1.3, catFace, catWalk, fill);
          ctx.restore();
        } else if (catState === 'spin') {
          ctx.save();
          ctx.translate(catX, drawY);
          ctx.rotate((now * 0.02) % (Math.PI * 2)); // chasing its tail
          drawCat(ctx, 0, 0, SPACING * 1.2, catFace, catWalk, fill);
          ctx.restore();
        } else if (catState === 'caught')
          drawCat(ctx, catX, drawY + 5, SPACING * 1.25, catFace, catWalk, fill); // pounced low over the toy
        else if (catState === 'stalk')
          drawCat(ctx, catX, drawY + 4, SPACING * 1.25, catFace, catWalk, fill); // crouched low
        else drawCat(ctx, catX, drawY, SPACING * 1.35, catFace, catWalk, fill);
        if (mouse.inside) drawWand(ctx, toyX, toyY, now, Math.max(-16, Math.min(16, wandVX * 1.6)));
        return;
      }

      // Piano — the field IS a keyboard: hollow-dot white keys with dividers,
      // solid-dot black keys up top in the 2-then-3 groups, gold flash on press
      if (mode === 'piano') {
        const blackZoneY = offY + (rows - 1) * SPACING * 0.5;
        const blackHalf = 0.32 / PIANO_WHITES;
        for (let x = 0; x < cols; x++) {
          const gx = offX + x * SPACING;
          const frac = gx / (width || 1);
          const wi = Math.max(0, Math.min(PIANO_WHITES - 1, Math.floor(frac * PIANO_WHITES)));
          const within = frac * PIANO_WHITES - wi;
          const divider = within < 0.06 || within > 0.94;
          for (let y = 0; y < rows; y++) {
            const gy = offY + y * SPACING;
            let bk = -1;
            if (gy < blackZoneY) {
              for (let k = 0; k < PIANO_BLACKS.length; k++) {
                if (Math.abs(frac - PIANO_BLACKS[k].cx) < blackHalf) {
                  bk = k;
                  break;
                }
              }
            }
            ctx.beginPath();
            if (bk >= 0) {
              // black key: a dimmer grey dot (visible in either theme), sitting on top
              const lit = now - blackLit[bk];
              if (lit < 320) {
                ctx.globalAlpha = 1 - lit / 320;
                ctx.arc(gx, gy, DOT_R + 1.7, 0, Math.PI * 2);
                ctx.fillStyle = PIANO_GOLD;
                ctx.fill();
                ctx.globalAlpha = 1;
              } else {
                ctx.arc(gx, gy, DOT_R + 0.4, 0, Math.PI * 2);
                ctx.fillStyle = black;
                ctx.fill();
              }
            } else {
              // white key: the bright, prominent surface (dimmed only at the dividers)
              const lit = now - whiteLit[wi];
              if (lit < 320) {
                ctx.globalAlpha = 1 - lit / 320;
                ctx.arc(gx, gy, DOT_R + 1.7, 0, Math.PI * 2);
                ctx.fillStyle = PIANO_GOLD;
                ctx.fill();
                ctx.globalAlpha = 1;
              } else {
                ctx.globalAlpha = divider ? 0.22 : 1;
                ctx.arc(gx, gy, DOT_R + 1, 0, Math.PI * 2);
                ctx.fillStyle = fill;
                ctx.fill();
                ctx.globalAlpha = 1;
              }
            }
          }
        }
        return;
      }

      // Band — NPC musicians playing to a drum-and-bass beat
      if (mode === 'band') {
        const beatMs = 460;
        const beat = Math.floor((now - bandStart) / beatMs);
        if (beat !== bandBeat) {
          bandBeat = beat;
          const b = ((beat % 4) + 4) % 4;
          playDrum('hat');
          if (b === 0 || b === 2) playDrum('kick');
          else playDrum('snare');
          playNote(BAND_BASS[((beat % BAND_BASS.length) + BAND_BASS.length) % BAND_BASS.length]);
        }
        const phase = ((now - bandStart) % beatMs) / beatMs;
        for (let x = 0; x < cols; x++) {
          for (let y = 0; y < rows; y++) {
            ctx.beginPath();
            ctx.arc(offX + x * SPACING, offY + y * SPACING, DOT_R, 0, Math.PI * 2);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        const fw = (cols - 1) * SPACING;
        const my = offY + (rows - 1) * SPACING * 0.6;
        for (let m = 0; m < BAND_KINDS.length; m++) {
          const mx = offX + fw * ((m + 0.5) / BAND_KINDS.length);
          const bob = Math.max(0, Math.sin((phase + m * 0.13) * Math.PI)) * 0.14;
          const arm = 0.5 + 0.5 * Math.sin(now * 0.02 + m * 1.3);
          drawMusician(ctx, mx, my, SPACING * 1.5, BAND_KINDS[m], bob, arm, fill);
        }
        return;
      }

      // Seoul skyline bloom: light the field's own dots into the skyline shape
      const fAge = now - flagStart;
      const flagOn = fAge >= 0 && fAge < FLAG_TOTAL;
      const fEnv = !flagOn
        ? 0
        : reduced
          ? 1
          : fAge < FLAG_IN
            ? fAge / FLAG_IN
            : fAge > FLAG_TOTAL - FLAG_OUT
              ? (FLAG_TOTAL - fAge) / FLAG_OUT
              : 1;
      const fcx = width / 2;
      const fcy = height / 2;

      const hAge = now - hbdStart;
      const hbdOn = hAge >= 0 && hAge < FLAG_TOTAL;
      const hEnv = !hbdOn
        ? 0
        : reduced
          ? 1
          : hAge < FLAG_IN
            ? hAge / FLAG_IN
            : hAge > FLAG_TOTAL - FLAG_OUT
              ? (FLAG_TOTAL - hAge) / FLAG_OUT
              : 1;
      const dmax = Math.hypot(((cols - 1) * SPACING) / 2, ((rows - 1) * SPACING) / 2) || 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const gx = offX + i * SPACING;
          const gy = offY + j * SPACING;

          // skyline (or birthday) recolours this dot
          let fCol = '';
          let fA = 0;
          if (flagOn) {
            if (skylineOn(i, j, cols, rows)) {
              // buildings rise from the base upward
              const appear = reduced ? 1 : Math.max(0, Math.min(1, (fAge - (rows - 1 - j) * 45) / 320));
              fA = fEnv * appear;
              if (fA > 0.02) fCol = fill;
            }
          } else if (hbdOn && hbdLit(i, j, cols, rows)) {
            const dd = Math.hypot(gx - fcx, gy - fcy) / dmax;
            const appear = reduced ? 1 : Math.max(0, Math.min(1, (hAge - dd * 220) / 300));
            fA = hEnv * appear;
            if (fA > 0.02) fCol = HBD_COLOR;
          }

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
          ctx.arc(x, y, DOT_R + (fCol ? 1.6 : t * 0.9), 0, Math.PI * 2);
          if (fCol) {
            ctx.globalAlpha = Math.min(1, fA);
            ctx.fillStyle = fCol;
            ctx.fill();
            ctx.globalAlpha = 1;
          } else if (t > 0.02) {
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
      if (
        mouse.inside ||
        ripples.length > 0 ||
        stir.size > 0 ||
        scrollOy !== 0 ||
        blinks.length > 0 ||
        now - flagStart < FLAG_TOTAL ||
        now - hbdStart < FLAG_TOTAL ||
        mode !== 'idle'
      ) {
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
      if (mode === 'piano' && mouse.dragging) pianoHit(nx, ny, performance.now());
      wake();
    };
    const onLeave = () => {
      mouse.inside = false;
      mouse.x = -9999;
      mouse.y = -9999;
      wake();
    };
    const onClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      if (mode === 'piano') {
        mouse.dragging = true;
        pianoKey = '';
        pianoHit(px, e.clientY - rect.top, performance.now());
        return;
      }
      if (reduced) return;
      mouse.dragging = true;
      ripples.push({ x: px, y: e.clientY - rect.top, born: performance.now() });
      wake();
    };
    const onUp = () => {
      mouse.dragging = false;
      pianoKey = '';
    };

    // clicking "South Korea" anywhere on the page blooms the Seoul skyline here
    const onSkyline = () => {
      endCurrentEgg();
      flagStart = performance.now();
      if (reduced) {
        draw(performance.now());
        window.setTimeout(() => {
          flagStart = -Infinity;
          draw(performance.now());
        }, 2800);
      } else {
        wake();
      }
    };
    window.addEventListener(SKYLINE_EVENT, onSkyline);

    // the birthday code (0627) is detected in App; here we just bloom "HBD HENRY"
    const onHbd = () => {
      endCurrentEgg();
      hbdStart = performance.now();
      if (reduced) {
        draw(performance.now());
        window.setTimeout(() => {
          hbdStart = -Infinity;
          draw(performance.now());
        }, 3200);
      } else {
        wake();
      }
    };
    window.addEventListener('henry:hbd', onHbd);

    // --- generative / game easter eggs ---
    const forceWake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    // end whatever egg is currently running before another one begins
    const endCurrentEgg = () => {
      mode = 'idle';
      flagStart = -Infinity;
      hbdStart = -Infinity;
    };
    const startLife = () => {
      endCurrentEgg();
      const c = Math.floor((width - SPACING) / SPACING);
      const r = Math.floor((height - SPACING / 2) / SPACING);
      life = new Uint8Array(c * r);
      for (let k = 0; k < life.length; k++) life[k] = Math.random() < 0.32 ? 1 : 0;
      mode = 'life';
      lifeStart = performance.now();
      lifeTick = 0;
      forceWake();
    };
    const startSnake = () => {
      endCurrentEgg();
      const c = Math.floor((width - SPACING) / SPACING);
      const r = Math.floor((height - SPACING / 2) / SPACING);
      const cx = Math.floor(c / 2);
      const cy = Math.floor(r / 2);
      snakeBody = [
        [cx, cy],
        [cx - 1, cy],
        [cx - 2, cy],
      ];
      snakeDir = [1, 0];
      snakeNextDir = [1, 0];
      snakeFood = [Math.min(c - 2, cx + 4), cy];
      snakeOver = false;
      snakeTick = 0;
      mode = 'snake';
      forceWake();
    };
    const startCat = () => {
      endCurrentEgg();
      catX = width / 2;
      catY = height / 2;
      catFace = 1;
      catWalk = 0;
      catJumpY = 0;
      catJumpV = 0;
      catLungeVX = 0;
      catState = 'sit';
      catStateAt = performance.now();
      toyPX = catX;
      toyPY = catY;
      toyStill = 0;
      mode = 'cat';
      forceWake();
    };
    const playNote = (freq: number) => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audio) audio = new AC();
        const t = audio.currentTime;
        const osc = audio.createOscillator();
        const g = audio.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.2, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.6);
        osc.connect(g).connect(audio.destination);
        osc.start(t);
        osc.stop(t + 0.62);
      } catch {
        /* no audio available */
      }
    };
    const pianoHit = (px: number, py: number, t: number) => {
      const frac = px / (width || 1);
      const rws = Math.floor((height - SPACING / 2) / SPACING);
      const oY = (height - (rws - 1) * SPACING) / 2;
      if (py < oY + (rws - 1) * SPACING * 0.5) {
        for (let k = 0; k < PIANO_BLACKS.length; k++) {
          if (Math.abs(frac - PIANO_BLACKS[k].cx) < 0.32 / PIANO_WHITES) {
            const id = 'b' + k;
            if (pianoKey === id) return;
            pianoKey = id;
            blackLit[k] = t;
            playNote(midiToFreq(PIANO_BLACKS[k].midi));
            forceWake();
            return;
          }
        }
      }
      const wi = Math.max(0, Math.min(PIANO_WHITES - 1, Math.floor(frac * PIANO_WHITES)));
      const id = 'w' + wi;
      if (pianoKey === id) return;
      pianoKey = id;
      whiteLit[wi] = t;
      playNote(midiToFreq(whiteMidi(wi)));
      forceWake();
    };
    const startPiano = () => {
      endCurrentEgg();
      whiteLit = new Array(PIANO_WHITES).fill(-Infinity);
      blackLit = new Array(PIANO_BLACKS.length).fill(-Infinity);
      pianoKey = '';
      mode = 'piano';
      forceWake();
    };
    const playDrum = (kind: 'kick' | 'snare' | 'hat') => {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audio) audio = new AC();
        const a = audio;
        const t = a.currentTime;
        if (kind === 'kick') {
          const o = a.createOscillator();
          const g = a.createGain();
          o.frequency.setValueAtTime(150, t);
          o.frequency.exponentialRampToValueAtTime(45, t + 0.13);
          g.gain.setValueAtTime(0.6, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          o.connect(g).connect(a.destination);
          o.start(t);
          o.stop(t + 0.22);
        } else {
          const dur = kind === 'snare' ? 0.18 : 0.04;
          const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
          const ch = buf.getChannelData(0);
          for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
          const src = a.createBufferSource();
          src.buffer = buf;
          const f = a.createBiquadFilter();
          f.type = 'highpass';
          f.frequency.value = kind === 'snare' ? 1400 : 7000;
          const g = a.createGain();
          g.gain.setValueAtTime(kind === 'snare' ? 0.28 : 0.13, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + dur);
          src.connect(f).connect(g).connect(a.destination);
          src.start(t);
        }
      } catch {
        /* no audio */
      }
    };
    const startBand = () => {
      endCurrentEgg();
      bandStart = performance.now();
      bandBeat = -1;
      mode = 'band';
      forceWake();
    };
    window.addEventListener('henry:life', startLife);
    window.addEventListener('henry:snake', startSnake);
    window.addEventListener('henry:cat', startCat);
    window.addEventListener('henry:piano', startPiano);
    window.addEventListener('henry:band', startBand);
    const onGameKey = (e: KeyboardEvent) => {
      // typing in the command palette (or any field) must not steer games or play notes
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === 'escape' && mode !== 'idle') {
        mode = 'idle';
        wake();
        return;
      }
      // computer-keyboard piano: white keys q..], black keys 2 3 · 5 6 7 · 9 0 =
      if (mode === 'piano') {
        if (e.repeat) return;
        const wi = 'qwertyuiop'.split('').indexOf(key);
        if (wi >= 0) {
          e.preventDefault();
          whiteLit[wi] = performance.now();
          playNote(midiToFreq(whiteMidi(wi)));
          forceWake();
          return;
        }
        const bi = ['2', '3', '5', '6', '7', '9', '0'].indexOf(key);
        if (bi >= 0 && bi < PIANO_BLACKS.length) {
          e.preventDefault();
          blackLit[bi] = performance.now();
          playNote(midiToFreq(PIANO_BLACKS[bi].midi));
          forceWake();
        }
        return;
      }
      if (mode !== 'snake') return;
      const k = e.key.toLowerCase();
      let nd: [number, number] | null = null;
      if (k === 'arrowup' || k === 'w') nd = [0, -1];
      else if (k === 'arrowdown' || k === 's') nd = [0, 1];
      else if (k === 'arrowleft' || k === 'a') nd = [-1, 0];
      else if (k === 'arrowright' || k === 'd') nd = [1, 0];
      else if (k === 'escape') {
        mode = 'idle';
        return;
      }
      if (!nd) return;
      e.preventDefault();
      if (nd[0] === -snakeDir[0] && nd[1] === -snakeDir[1]) return; // no reversing onto itself
      snakeNextDir = nd;
    };
    window.addEventListener('keydown', onGameKey);

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onClick);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

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
      wrap.classList.remove('cat-mode');
      document.body.classList.remove('cat-laser');
      document.body.classList.remove('egg-playing');
      window.removeEventListener(SKYLINE_EVENT, onSkyline);
      window.removeEventListener('henry:hbd', onHbd);
      window.removeEventListener('henry:life', startLife);
      window.removeEventListener('henry:snake', startSnake);
      window.removeEventListener('henry:cat', startCat);
      window.removeEventListener('henry:piano', startPiano);
      window.removeEventListener('henry:band', startBand);
      window.removeEventListener('keydown', onGameKey);
      audio?.close();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onClick);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll);
      if (blinkTimer) clearInterval(blinkTimer);
      observer.disconnect();
      ro?.disconnect();
      // Release the canvas backing store while it is still attached, so WebKit
      // invalidates the composited layer instead of leaving a ghost of the field
      // painted over the next page after Home unmounts during SPA navigation.
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [height]);

  return (
    <div className="dot-field" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} style={{ touchAction: 'pan-y' }} />
    </div>
  );
}
