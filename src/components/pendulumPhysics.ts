// The pendulum twin: a damped pendulum integrated numerically, calibrated to the
// constants the PHY180 report measured, plus the same fits the report's scripts
// ran. Pure functions, so the lab can run every experiment in one go.

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

export type Run = { dt: number; theta: Float32Array; omega: Float32Array };
export type Point = { x: number; y: number; dy?: number };

export const FPS = 30; // the frame rate the report's decay video was tracked at

/** A Tracker table: the bob at every frame, the pivot as the origin, y up (metres). */
export type Track = { t: Float32Array; x: Float32Array; y: Float32Array; n: number };

/** θ at time t, nearest step. */
export function thetaAt(run: Run, t: number): number {
  return run.theta[Math.max(0, Math.min(run.theta.length - 1, Math.round(t / run.dt)))];
}

/** Sample a run the way Tracker sampled the video: the bob's (x, y) at `fps`, up to `seconds`. */
export function trackOf(run: Run, L: number, seconds: number, fps = FPS): Track {
  const n = Math.min(Math.floor(seconds * fps) + 1, Math.floor((run.theta.length - 1) * run.dt * fps) + 1);
  const t = new Float32Array(n);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const th = thetaAt(run, i / fps);
    t[i] = i / fps;
    x[i] = L * Math.sin(th);
    y[i] = -L * Math.cos(th);
  }
  return { t, x, y, n };
}

/** Mean period from the track's upward zero crossings of x, interpolated between frames —
 *  the report read periods to the millisecond the same way, off the video. */
export function periodFromTrack(tr: Track): number {
  const times: number[] = [];
  for (let i = 1; i < tr.n; i++) {
    const a = tr.x[i - 1];
    const b = tr.x[i];
    if (a < 0 && b >= 0) times.push(tr.t[i - 1] + (tr.t[i] - tr.t[i - 1]) * (a / (a - b)));
  }
  if (times.length < 2) return NaN;
  return (times[times.length - 1] - times[0]) / (times.length - 1);
}

/** The amplitude envelope off the track: every positive peak of x as (t, θ), θ = atan2(x, −y). */
export function envelopeFromTrack(tr: Track): Point[] {
  const out: Point[] = [];
  for (let i = 1; i < tr.n - 1; i++) {
    const v = tr.x[i];
    if (v > 0 && v >= tr.x[i - 1] && v > tr.x[i + 1]) out.push({ x: tr.t[i], y: Math.atan2(v, -tr.y[i]) });
  }
  return out;
}

/** θ'' = −(2π/T0)² sin θ − (2/τ) θ' — the report's model [1] with an exact restoring force.
 *  T0 is the small-angle period the twin is calibrated to (it fixes g/L). */
export function simulate(T0: number, tau: number, theta0: number, tEnd: number, dt = 1 / 600): Run {
  const w2 = (2 * Math.PI) / T0;
  const k = w2 * w2;
  const c = 2 / tau;
  const n = Math.max(2, Math.round(tEnd / dt));
  const theta = new Float32Array(n);
  const omega = new Float32Array(n);
  let th = theta0;
  let om = 0;
  const f = (t: number, o: number) => -k * Math.sin(t) - c * o;
  for (let i = 0; i < n; i++) {
    theta[i] = th;
    omega[i] = om;
    const k1t = om;
    const k1o = f(th, om);
    const k2t = om + (dt / 2) * k1o;
    const k2o = f(th + (dt / 2) * k1t, om + (dt / 2) * k1o);
    const k3t = om + (dt / 2) * k2o;
    const k3o = f(th + (dt / 2) * k2t, om + (dt / 2) * k2o);
    const k4t = om + dt * k3o;
    const k4o = f(th + dt * k3t, om + dt * k3o);
    th += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    om += (dt / 6) * (k1o + 2 * k2o + 2 * k3o + k4o);
  }
  return { dt, theta, omega };
}

/** Mean period from successive upward zero crossings, interpolated. */
export function periodOf(run: Run): number {
  const times: number[] = [];
  for (let i = 1; i < run.theta.length; i++) {
    const a = run.theta[i - 1];
    const b = run.theta[i];
    if (a < 0 && b >= 0) times.push((i - 1 + a / (a - b)) * run.dt);
  }
  if (times.length < 2) return NaN;
  return (times[times.length - 1] - times[0]) / (times.length - 1);
}

/** The amplitude envelope: every positive peak as [t, θ]. */
export function peaks(run: Run): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 1; i < run.theta.length - 1; i++) {
    if (run.theta[i] > 0 && run.theta[i] >= run.theta[i - 1] && run.theta[i] > run.theta[i + 1])
      out.push([i * run.dt, run.theta[i]]);
  }
  return out;
}

/** Exact large-angle period ratio T/T0 for a release at θ (series to θ⁶). */
export function bigAngle(theta: number): number {
  const s = theta * theta;
  return 1 + s / 16 + (11 * s * s) / 3072 + (173 * s * s * s) / 737280;
}

/** The report's length law gives each length its calibration: T0 from k L^n (measured at
 *  0.52 rad, so the large-angle factor is taken back out) and τ from Q(L) = qa L + qb. */
export function calibrate(L: number): { T0: number; tau: number } {
  const T0 = (REPORT.k * L ** REPORT.n) / bigAngle(REPORT.theta0);
  return { T0, tau: ((REPORT.qa * L + REPORT.qb) * T0) / Math.PI };
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
