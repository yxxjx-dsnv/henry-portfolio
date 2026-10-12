// What the PHY180 report measured, the shared types and the scatter of a lab day, and the
// fits the report's scripts ran (least squares, closed form). The twin itself is
// pendulumModel.ts; the instruments that read it are pendulumInstruments.ts.

// what the report measured (final-report.pdf §3)
export const REPORT = {
  L: 0.221, // m, pivot to bob centre
  T0: 0.936, // s, small-angle period at L
  B: -0.001,
  C: 0.08, // T = T0 (1 + Bθ + Cθ²)
  theta0: 0.52, // rad, the decay release
  tau: 178, // s
  Q: 597,
  k: 1.94, // T = k L^n, measured at 0.52 rad
  n: 0.433,
  qa: 1960, // Q = qa L + qb
  qb: 202,
  lengths: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3],
};

export type Point = { x: number; y: number; dy?: number };

export type Rng = () => number;

/** A standard normal draw (Box–Muller) from a uniform generator. */
export function gauss(rng: Rng): number {
  const u = Math.max(1e-12, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Exact large-angle period ratio T/T0 for a release at θ (series to θ⁶). */
export function bigAngle(theta: number): number {
  const s = theta * theta;
  return 1 + s / 16 + (11 * s * s) / 3072 + (173 * s * s * s) / 737280;
}

// ── the fits the report ran (least squares, closed form) ────────────────────

export function fitLinear(x: number[], y: number[]): { a: number; b: number } {
  const n = x.length;
  const sx = x.reduce((s, v) => s + v, 0);
  const sy = y.reduce((s, v) => s + v, 0);
  const sxx = x.reduce((s, v) => s + v * v, 0);
  const sxy = x.reduce((s, v, i) => s + v * y[i], 0);
  const a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  return { a, b: (sy - a * sx) / n };
}

/** y = c0 + c1 x + c2 x² by normal equations. */
export function fitQuadratic(x: number[], y: number[]): [number, number, number] {
  const m = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const r = [0, 0, 0];
  x.forEach((v, i) => {
    const p = [1, v, v * v];
    for (let a = 0; a < 3; a++) {
      r[a] += p[a] * y[i];
      for (let b = 0; b < 3; b++) m[a][b] += p[a] * p[b];
    }
  });
  // Gaussian elimination, 3×3
  for (let c = 0; c < 3; c++) {
    const piv = m[c][c];
    for (let a = c + 1; a < 3; a++) {
      const f = m[a][c] / piv;
      for (let b = c; b < 3; b++) m[a][b] -= f * m[c][b];
      r[a] -= f * r[c];
    }
  }
  const out = [0, 0, 0];
  for (let a = 2; a >= 0; a--) {
    let s = r[a];
    for (let b = a + 1; b < 3; b++) s -= m[a][b] * out[b];
    out[a] = s / m[a][a];
  }
  return [out[0], out[1], out[2]];
}

/** T = k L^n via the log–log line. */
export function fitPower(L: number[], T: number[]): { k: number; n: number } {
  const f = fitLinear(L.map(Math.log10), T.map(Math.log10));
  return { k: 10 ** f.b, n: f.a };
}

/** A e^(−t/τ) via the log line. */
export function fitExp(t: number[], y: number[]): { A: number; tau: number } {
  const f = fitLinear(t, y.map(Math.log));
  return { A: Math.exp(f.b), tau: -1 / f.a };
}
