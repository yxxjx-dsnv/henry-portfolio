// The four experiments of the PHY180 project, as procedures the twin can run one release at
// a time: what each trial is, how the tracked frames of a trial are turned into a number,
// and the fit the report ran on the numbers. Pure functions; the lab component plays the
// trials and pendulumExperiments.test.ts runs them straight through.
import {
  REPORT,
  calibrate,
  envelopeFromTrack,
  fitExp,
  fitLinear,
  fitPower,
  fitQuadratic,
  periodFromTrack,
  simulate,
  trackOf,
  type Point,
  type Run,
  type Track,
} from './pendulumPhysics';

export type ExpId = 'angle' | 'decay' | 'length' | 'q';
export type Trial = { L: number; theta0: number; seconds: number; label: string };
export type Experiment = {
  id: ExpId;
  lab: string;
  name: string;
  x: string;
  y: string;
  xRange: [number, number];
  yRange: [number, number];
  speed: number; // the playback the lab picks for it
  data: string; // the report's data file laid over the result
  trials: Trial[];
};

const DEG = Math.PI / 180;
const angles = [-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8];
const sign = (v: number) => (v > 0 ? '+' : '−');

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'angle',
    lab: 'Lab 1',
    name: 'Period vs angle',
    x: 'Release angle (rad)',
    y: 'Period (s)',
    xRange: [-1.5, 1.5],
    yRange: [0.9, 1.12],
    speed: 1,
    data: 'period-vs-angle.txt',
    // ±10° to ±80° in 10° steps at the reference length, a few periods each
    trials: angles.map((i) => ({ L: REPORT.L, theta0: i * 10 * DEG, seconds: 4, label: `release ${sign(i)}${Math.abs(i) * 10}°` })),
  },
  {
    id: 'decay',
    lab: 'Lab 1',
    name: 'Amplitude vs time',
    x: 'Time (s)',
    y: 'Amplitude (rad)',
    xRange: [0, 200],
    yRange: [0.15, 0.5],
    speed: 32,
    data: 'amplitude-decay.txt',
    trials: [{ L: REPORT.L, theta0: REPORT.theta0, seconds: 200, label: 'release +30°, tracked 200 s' }],
  },
  {
    id: 'length',
    lab: 'Lab 2',
    name: 'Period vs length',
    x: 'Length (m)',
    y: 'Period (s)',
    xRange: [0.03, 0.32],
    yRange: [0.45, 1.25],
    speed: 1,
    data: 'period-vs-length.txt',
    trials: REPORT.lengths.map((L) => ({ L, theta0: REPORT.theta0, seconds: 6, label: `L = ${L.toFixed(2)} m, release +30°` })),
  },
  {
    id: 'q',
    lab: 'Lab 2',
    name: 'Q vs length',
    x: 'Length (m)',
    y: 'Q-factor',
    xRange: [0.03, 0.32],
    yRange: [250, 850],
    speed: 32,
    data: 'q-factor-vs-length.txt',
    trials: REPORT.lengths.map((L) => ({ L, theta0: REPORT.theta0, seconds: 200, label: `L = ${L.toFixed(2)} m, tracked 200 s` })),
  },
];

export const experiment = (id: ExpId): Experiment => EXPERIMENTS.find((e) => e.id === id)!;

/** The twin's constants: the report's own at its reference length, its length laws elsewhere. */
export function constantsFor(L: number): { T0: number; tau: number } {
  return Math.abs(L - REPORT.L) < 1e-9 ? { T0: REPORT.T0, tau: REPORT.tau } : calibrate(L);
}

export function runOf(trial: Trial): Run {
  const c = constantsFor(trial.L);
  return simulate(c.T0, c.tau, trial.theta0, trial.seconds, trial.seconds > 60 ? 1 / 300 : 1 / 600);
}

/** What one tracked trial contributes to the experiment's graph. */
export function measure(id: ExpId, trial: Trial, tr: Track): Point[] {
  if (id === 'angle') return [{ x: trial.theta0, y: periodFromTrack(tr) }];
  if (id === 'length') return [{ x: trial.L, y: periodFromTrack(tr) }];
  if (id === 'decay') return envelopeFromTrack(tr);
  const env = envelopeFromTrack(tr);
  const { tau } = fitExp(
    env.map((p) => p.x),
    env.map((p) => p.y),
  );
  return [{ x: trial.L, y: (Math.PI * tau) / periodFromTrack(tr) }];
}

export type Fit = { line: (x: number) => number; note: string };

const f3 = (v: number) => v.toFixed(3);

/** The report's fit over the points gathered so far; null until there are enough. */
export function fitOf(id: ExpId, points: Point[]): Fit | null {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  if (id === 'angle') {
    if (points.length < 3) return null;
    const [a, b, c] = fitQuadratic(xs, ys);
    return {
      line: (x) => a + b * x + c * x * x,
      note: `fit T = T₀(1 + Bθ + Cθ²): T₀ = ${f3(a)} s, B = ${f3(b / a)}, C = ${f3(c / a)} · report: 0.936 s, −0.001, 0.080. An ideal pendulum's curvature is the textbook θ²/16 (0.0625); the real one bent a little more — the report's apparatus notes say why.`,
    };
  }
  if (id === 'decay') {
    if (points.length < 3) return null;
    const { A, tau } = fitExp(xs, ys);
    const T = (xs[xs.length - 1] - xs[0]) / (xs.length - 1); // one positive peak per period
    const Q = (Math.PI * tau) / T;
    const n = points.findIndex((p) => p.y <= points[0].y * Math.exp(-Math.PI / 4)); // the report's Q/4 count
    return {
      line: (x) => A * Math.exp(-x / tau),
      note: `fit θ = θ₀e^(−t/τ): τ = ${tau.toFixed(0)} s, Q = πτ/T = ${Q.toFixed(0)}${n > 0 ? ` · counting swings to 46 %: N = ${n}, Q = 4N = ${4 * n}` : ''} · report: τ = 178 ± 1 s, Q = 597 ± 5 (hand count 592 ± 8).`,
    };
  }
  if (id === 'length') {
    if (points.length < 2) return null;
    const { k, n } = fitPower(xs, ys);
    return {
      line: (x) => k * x ** n,
      note: `fit T = kLⁿ: k = ${k.toFixed(2)}, n = ${n.toFixed(3)} · report: k = 1.94 ± 0.02, n = 0.433 ± 0.004 (theory: 2.0, 0.5). Released at 0.52 rad, like the report.`,
    };
  }
  if (points.length < 2) return null;
  const { a, b } = fitLinear(xs, ys);
  return {
    line: (x) => a * x + b,
    note: `fit Q = aL + b: a = ${a.toFixed(0)}, b = ${b.toFixed(0)} · report: a = 1960 ± 30, b = 202 ± 5; the report's Q at 0.221 m, 594 ± 16, is the point they all agree on.`,
  };
}

/** The report's own curve for the graph. */
export function reportLine(id: ExpId, A0 = REPORT.theta0): (x: number) => number {
  if (id === 'angle') return (x) => REPORT.T0 * (1 + REPORT.B * x + REPORT.C * x * x);
  if (id === 'decay') return (x) => A0 * Math.exp(-x / REPORT.tau);
  if (id === 'length') return (x) => REPORT.k * x ** REPORT.n;
  return (x) => REPORT.qa * x + REPORT.qb;
}

/** Run trials `from` onward without playing them — the lab's "finish now", and the tests. */
export function completeExperiment(id: ExpId, from = 0, points: Point[] = []): Point[] {
  const out = points.slice();
  for (const trial of experiment(id).trials.slice(from)) out.push(...measure(id, trial, trackOf(runOf(trial), trial.L, trial.seconds)));
  return out;
}
