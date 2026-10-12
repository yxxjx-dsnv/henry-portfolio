// The instruments a visitor can measure the pendulum with, each with the errors the real
// one has: Tracker reading a video at some frame rate (the bob's position jitters by a
// fraction of a pixel), a stopwatch in a hand (reaction time at start and stop), the
// protractor (read to the nearest degree) and the ruler (to the nearest millimetre).
// A measurement either gives a value with its uncertainty, or says why it cannot yet.
import { fitExp, fitLinear, gauss, type Point, type Rng } from './pendulumPhysics';
import { thetaAt, type Motion } from './pendulumModel';

export type Reading = { value: number; uncertainty: number };
export type Refusal = { reason: string };
export type Result = Reading | Refusal;
export const refused = (r: Result): r is Refusal => 'reason' in r;

// ── Tracker ───────────────────────────────────────────────────────────────

export type TrackerSettings = { fps: number; jitter: number }; // jitter: m of position noise per frame
export const TRACKER: TrackerSettings = { fps: 30, jitter: 0.0004 }; // the report's decay video

/** A Tracker table: the bob at every frame, the pivot as the origin, y up (metres). */
export type Track = { t: Float32Array; x: Float32Array; y: Float32Array; n: number };

/** Read `seconds` of a motion the way Tracker read the video. */
export function track(m: Motion, seconds: number, tk: TrackerSettings = TRACKER, rng?: Rng): Track {
  const span = (m.theta.length - 1) * m.dt;
  const n = Math.floor(Math.min(seconds, span) * tk.fps) + 1;
  const t = new Float32Array(n);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const th = thetaAt(m, i / tk.fps);
    t[i] = i / tk.fps;
    x[i] = m.L * Math.sin(th) + (rng ? tk.jitter * gauss(rng) : 0);
    y[i] = -m.L * Math.cos(th) + (rng ? tk.jitter * gauss(rng) : 0);
  }
  return { t, x, y, n };
}

/** Upward zero crossings of x, interpolated between frames. Jitter near the bottom can
 *  fake a crossing, so a crossing only counts once x has gone well below zero since the
 *  last one (hysteresis of a few jitters). */
function crossings(tr: Track, band: number): number[] {
  const out: number[] = [];
  let armed = false;
  for (let i = 1; i < tr.n; i++) {
    if (tr.x[i - 1] < -band) armed = true;
    const a = tr.x[i - 1];
    const b = tr.x[i];
    if (armed && a < 0 && b >= 0) {
      out.push(tr.t[i - 1] + (tr.t[i] - tr.t[i - 1]) * (a / (a - b)));
      armed = false;
    }
  }
  return out;
}

/** Minimum full swings a period measurement needs: fewer, and one frame's error dominates. */
export const MIN_SWINGS = 3;

/** The period off a track: mean spacing of its upward crossings, ± the frame quantisation. */
export function periodOfTrack(tr: Track, tk: TrackerSettings = TRACKER): Result {
  const c = crossings(tr, 3 * tk.jitter);
  const swings = c.length - 1;
  if (swings < MIN_SWINGS) return { reason: `needs ${MIN_SWINGS - Math.max(0, swings)} more full swing${MIN_SWINGS - swings === 1 ? '' : 's'}` };
  const T = (c[c.length - 1] - c[0]) / swings;
  // each crossing time is good to about a tenth of a frame after interpolation
  return { value: T, uncertainty: (0.1 / tk.fps) * Math.SQRT2 / swings };
}

/** The amplitude envelope: every positive peak of x as (t, θ). */
export function envelopeOfTrack(tr: Track): Point[] {
  const out: Point[] = [];
  for (let i = 1; i < tr.n - 1; i++) {
    const v = tr.x[i];
    if (v > 0 && v >= tr.x[i - 1] && v > tr.x[i + 1]) out.push({ x: tr.t[i], y: Math.atan2(v, -tr.y[i]) });
  }
  return out;
}

/** The decay time τ from the envelope, A e^(−t/τ), ± from the fit's scatter. */
export function decayOfTrack(tr: Track): Result {
  const env = envelopeOfTrack(tr).filter((p) => p.y > 0);
  if (env.length < 6) return { reason: 'needs a longer recording to see the swing die away' };
  const t = env.map((p) => p.x);
  const ln = env.map((p) => Math.log(p.y));
  const f = fitLinear(t, ln);
  if (!(f.a < 0)) return { reason: 'the swing is not dying away in this recording' };
  // standard error of the slope → of τ = −1/slope
  const n = t.length;
  const mean = t.reduce((s, v) => s + v, 0) / n;
  const sxx = t.reduce((s, v) => s + (v - mean) ** 2, 0);
  const resid = ln.reduce((s, v, i) => s + (v - (f.a * t[i] + f.b)) ** 2, 0);
  const se = Math.sqrt(resid / Math.max(1, n - 2) / sxx);
  const tau = -1 / f.a;
  return { value: tau, uncertainty: (tau * tau * se) || tau * 0.01 };
}

export { fitExp };

// ── stopwatch, protractor, ruler ──────────────────────────────────────────

export const REACTION = 0.08; // s, a hand's reaction time scatter at start and at stop

/** Time `count` full swings by hand: the true time plus a reaction error at each end. */
export function stopwatchPeriod(trueT: number, count: number, rng?: Rng, reaction = REACTION): Result {
  if (count < 1) return { reason: 'count at least one swing' };
  const err = rng ? reaction * (gauss(rng) - gauss(rng)) : 0;
  return { value: (trueT * count + err) / count, uncertainty: (reaction * Math.SQRT2) / count };
}

const DEG = Math.PI / 180;
export const HAND = 0.7 * DEG; // how far a hand lets go from the angle it aimed for

/** Where a hand actually lets go when it aims for `theta`. */
export const letGo = (theta: number, rng?: Rng, hand = HAND) => theta + (rng ? hand * gauss(rng) : 0);

/** Read an angle off the protractor: to the nearest degree, ± half a degree (the report's Type B). */
export function protractor(theta: number): Reading {
  return { value: Math.round(theta / DEG) * DEG, uncertainty: 0.5 * DEG };
}

/** Read a length off the ruler: to the millimetre, ± 0.5 mm. */
export function ruler(length: number): Reading {
  return { value: Math.round(length * 1000) / 1000, uncertainty: 0.0005 };
}
