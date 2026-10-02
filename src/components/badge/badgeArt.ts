// The printed card inside the badge sleeve, drawn on a canvas so the words stay
// editable here instead of living in a PNG. The name gets a rough "ink on paper"
// edge: the type is blurred, shaken with value noise, and cut back to a hard
// edge, so every letter frays a little the way a cheap badge print does.

export const CARD = {
  first: 'Henry',
  last: 'Kim',
  currently: ['Electrical & Computer Engineering @ U of T', 'AI/Robotics Intern @ Incheon Robotics'],
  previously: [
    { label: 'Branphic', bg: '#111111' },
    { label: 'MONO', bg: '#e01b24' },
    { label: 'WGSS LEO Club', bg: '#3a12b8' },
  ],
};

// The print area matches the card face in the scene (2.39 x 3.505 units).
export const ART_W = 1024;
export const ART_H = Math.round((ART_W * 3.505) / 2.39);

const INK = '#141414';
const BLUE = '#1f2ef2';
const PAPER = '#f6f5f1';
const SERIF = "'Libre Baskerville', Georgia, serif";

// deterministic, so the card prints the same on every visit
function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

/** Smooth noise on a coarse grid, bilinearly sampled — enough to wobble an edge. */
function valueNoise(w: number, h: number, cell: number, seed: number) {
  const r = rng(seed);
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const grid = new Float32Array(gw * gh).map(() => r());
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = y / cell;
    const y0 = Math.floor(gy);
    const fy = gy - y0;
    for (let x = 0; x < w; x++) {
      const gx = x / cell;
      const x0 = Math.floor(gx);
      const fx = gx - x0;
      const a = grid[y0 * gw + x0];
      const b = grid[y0 * gw + x0 + 1];
      const c = grid[(y0 + 1) * gw + x0];
      const d = grid[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    }
  }
  return out;
}

/** Separable box blur on one channel, run twice (close enough to a gaussian). */
function blur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(w * h);
  const pass = (a: Float32Array, b: Float32Array, horizontal: boolean) => {
    const n = horizontal ? w : h;
    const m = horizontal ? h : w;
    for (let j = 0; j < m; j++) {
      let acc = 0;
      const at = (i: number) => (horizontal ? j * w + i : i * w + j);
      for (let i = -r; i <= r; i++) acc += a[at(Math.min(n - 1, Math.max(0, i)))];
      for (let i = 0; i < n; i++) {
        b[at(i)] = acc / (2 * r + 1);
        acc += a[at(Math.min(n - 1, i + r + 1))] - a[at(Math.max(0, i - r))];
      }
    }
  };
  for (let k = 0; k < 2; k++) {
    pass(src, tmp, true);
    pass(tmp, src, false);
  }
}

/** Draw `text` in `color` with frayed edges onto `ctx`. */
function inkText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, seed: number) {
  const pad = Math.ceil(size * 0.4);
  ctx.save();
  ctx.font = `400 ${size}px ${SERIF}`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  ctx.restore();
  const h = Math.ceil(size * 1.5) + pad;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.font = `400 ${size}px ${SERIF}`;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#000';
  g.fillText(text, pad, size * 1.05 + pad / 2);

  const img = g.getImageData(0, 0, w, h);
  const a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = img.data[i * 4 + 3] / 255;
  blur(a, w, h, Math.max(2, Math.round(size / 80)));
  const coarse = valueNoise(w, h, 9, seed);
  const fine = valueNoise(w, h, 1.6, seed + 1);
  const [cr, cg, cb] = [1, 3, 5].map((o) => parseInt(color.slice(o, o + 2), 16));
  for (let i = 0; i < a.length; i++) {
    // ink bleeds a touch past the type (threshold under 0.5) and frays where the noise says
    const v = a[i] + (coarse[i] - 0.5) * 0.42 + (fine[i] - 0.5) * 0.46;
    const alpha = Math.min(1, Math.max(0, (v - 0.37) * 12));
    img.data[i * 4] = cr;
    img.data[i * 4 + 1] = cg;
    img.data[i * 4 + 2] = cb;
    img.data[i * 4 + 3] = alpha * 255;
  }
  g.putImageData(img, 0, 0);
  ctx.drawImage(c, x - pad, y - size * 1.05 - pad / 2);
}

function chip(ctx: CanvasRenderingContext2D, label: string, x: number, y: number, size: number, bg: string) {
  ctx.font = `400 ${size}px ${SERIF}`;
  const padX = size * 0.5;
  const w = ctx.measureText(label).width + padX * 2;
  const h = size * 1.65;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + padX, y + h / 2 + size * 0.04);
  ctx.textBaseline = 'alphabetic';
  return w;
}

export async function drawCardArt(): Promise<HTMLCanvasElement> {
  // the canvas only sees the web font once it has actually loaded
  try {
    await Promise.all([
      document.fonts.load(`400 200px 'Libre Baskerville'`),
      document.fonts.load(`italic 400 40px 'Libre Baskerville'`),
    ]);
  } catch {
    /* falls back to Georgia */
  }
  const c = document.createElement('canvas');
  c.width = ART_W;
  c.height = ART_H;
  const ctx = c.getContext('2d')!;

  // paper with a faint tooth
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, ART_W, ART_H);
  const r = rng(91);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.015 + r() * 0.03})`;
    ctx.fillRect(r() * ART_W, r() * ART_H, 1.2, 1.2);
  }

  // proportions measured off the reference card: the name about 83% of the
  // card wide, lines overlapping hard, the footer sitting low near the edge
  const left = 66;
  const big = 262;
  inkText(ctx, CARD.first, left - 6, 318, big, INK, 7);
  inkText(ctx, CARD.last, left - 6, 318 + big * 0.64, big, BLUE, 13);

  const small = 35;
  let y = ART_H - 420;
  ctx.fillStyle = INK;
  ctx.font = `italic 700 ${small}px ${SERIF}`;
  ctx.fillText('Currently', left, y);
  ctx.font = `400 ${small * 0.95}px ${SERIF}`;
  y += 80;
  for (const line of CARD.currently) {
    ctx.fillText(line, left, y);
    y += 52;
  }
  y += 48;
  ctx.font = `italic 700 ${small}px ${SERIF}`;
  ctx.fillText('Previously', left, y);
  y += 30;
  let x = left;
  for (const p of CARD.previously) x += chip(ctx, p.label, x, y, small, p.bg) + 14;
  return c;
}
