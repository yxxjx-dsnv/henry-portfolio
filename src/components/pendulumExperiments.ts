// The four experiments of the PHY180 project, as procedures the twin can run one release at
// a time: what each trial is, the lab-day scatter every release carries, how the tracked
// frames of a trial are turned into a number, and the fit the report ran on the numbers.
// Pure functions; the lab component plays the trials and pendulumExperiments.test.ts runs
// them straight through.
import {
  REPORT,
  calibrate,
  envelopeFromTrack,
  fitExp,
  fitLinear,
  fitPower,
  fitQuadratic,
  gauss,
  periodFromTrack,
  simulate,
  trackOf,
  type Point,
  type Rng,
  type Run,
  type Track,
} from './pendulumPhysics';

export type ExpId = 'angle' | 'decay' | 'length' | 'q';
export type Trial = { L: number; theta0: number; seconds: number };
export type Experiment = {
  id: ExpId;
  lab: string;
  name: string;
  blurb: string; // the question the experiment asks, for someone who has just opened the lab
  x: string;
  y: string;
  xRange: [number, number];
  yRange: [number, number];
  data: string; // the report's data file laid over the result
  trials: Trial[];
};

const DEG = Math.PI / 180;
const angles = [-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8];

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'angle',
    lab: 'Lab 1',
    name: 'Period vs angle',
    blurb: 'Pull the bob back further — does a swing take longer? The textbook says the period should not change.',
    x: 'Release angle (rad)',
    y: 'Period (s)',
    xRange: [-1.5, 1.5],
    yRange: [0.9, 1.12],
    data: 'period-vs-angle.txt',
    // ±10° to ±80° in 10° steps at the reference length, a few periods each
    trials: angles.map((i) => ({ L: REPORT.L, theta0: i * 10 * DEG, seconds: 4 })),
  },
  {
    id: 'decay',
    lab: 'Lab 1',
    name: 'Amplitude vs time',
    blurb: 'Release it at 30° and leave it: how fast does the swing die away, and what Q-factor does that give?',
    x: 'Time (s)',
    y: 'Amplitude (rad)',
    xRange: [0, 200],
    yRange: [0.15, 0.5],
    data: 'amplitude-decay.txt',
    trials: [{ L: REPORT.L, theta0: REPORT.theta0, seconds: 200 }],
  },
  {
    id: 'length',
    lab: 'Lab 2',
    name: 'Period vs length',
    blurb: 'Re-tie the bob knot by knot, 5 cm to 30 cm: the period should follow T = 2√L.',
    x: 'Length (m)',
    y: 'Period (s)',
    xRange: [0.03, 0.32],
    yRange: [0.45, 1.25],
    data: 'period-vs-length.txt',
    trials: REPORT.lengths.map((L) => ({ L, theta0: REPORT.theta0, seconds: 6 })),
  },
  {
    id: 'q',
    lab: 'Lab 2',
    name: 'Q vs length',
    blurb: 'Does a shorter pendulum lose its energy faster? The decay is tracked at each of the six lengths.',
    x: 'Length (m)',
    y: 'Q-factor',
    xRange: [0.03, 0.32],
    yRange: [250, 850],
    data: 'q-factor-vs-length.txt',
    trials: REPORT.lengths.map((L) => ({ L, theta0: REPORT.theta0, seconds: 200 })),
  },
];

export const experiment = (id: ExpId): Experiment => EXPERIMENTS.find((e) => e.id === id)!;

/** The twin's constants: the report's own at its reference length, its length laws elsewhere. */
export function constantsFor(L: number): { T0: number; tau: number } {
  return Math.abs(L - REPORT.L) < 1e-9 ? { T0: REPORT.T0, tau: REPORT.tau } : calibrate(L);
}

/** What a lab day adds to every release, one standard deviation each: the hand cannot set the
 *  protractor or let go perfectly, the knot sits a hair off the mark, the air and the pivot
 *  damp a little differently each time, and the autotracker jitters within a pixel. */
export const JITTER = {
  angle: 0.012, // rad — about 0.7°, the hand at a 1° protractor
  omega: 0.03, // rad/s — a nudge on release
  length: 0.0005, // m — the report's ±0.5 mm
  tau: 0.015, // fraction — air density, temperature, the pivot
  track: 0.0004, // m — Tracker's sub-pixel jitter on the bob
};

/** One release as it actually happens: the trial as set, plus the day's scatter. Pass `null`
 *  for the ideal release — the model exactly at the report's constants. */
export type Release = { run: Run; L: number; noise: number };
export function prepare(trial: Trial, rng: Rng | null = Math.random, jitter = JITTER): Release {
  const j = rng ? (sd: number) => sd * gauss(rng) : () => 0;
  const L = trial.L + j(jitter.length);
  const c = constantsFor(trial.L);
  const T0 = c.T0 * Math.sqrt(L / trial.L); // the period goes with √L
  const tau = c.tau * (1 + j(jitter.tau));
  const run = simulate(T0, tau, trial.theta0 + j(jitter.angle), trial.seconds, trial.seconds > 60 ? 1 / 300 : 1 / 600, j(jitter.omega));
  return { run, L, noise: rng ? jitter.track : 0 };
}

/** A release by the viewer's own hand: the angle is theirs, so only the knot, the air and
 *  the tracker scatter; the graph records the protractor reading, to the degree. */
export const BY_HAND = { ...JITTER, angle: 0 };
export const protractorReading = (theta: number) => (Math.round((theta * 180) / Math.PI) * Math.PI) / 180;

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
      note: `T₀ ${f3(a)} s · curvature C ${f3(c / a)} — report 0.936 s · 0.080`,
    };
  }
  if (id === 'decay') {
    if (points.length < 3) return null;
    const { A, tau } = fitExp(xs, ys);
    const T = (xs[xs.length - 1] - xs[0]) / (xs.length - 1); // one positive peak per period
    const Q = (Math.PI * tau) / T;
    return {
      line: (x) => A * Math.exp(-x / tau),
      note: `τ ${tau.toFixed(0)} s · Q ${Q.toFixed(0)} — report 178 s · 597`,
    };
  }
  if (id === 'length') {
    if (points.length < 2) return null;
    const { k, n } = fitPower(xs, ys);
    return {
      line: (x) => k * x ** n,
      note: `T = k·Lⁿ with k ${k.toFixed(2)} · n ${n.toFixed(3)} — report 1.94 · 0.433`,
    };
  }
  if (points.length < 2) return null;
  const { a, b } = fitLinear(xs, ys);
  return {
    line: (x) => a * x + b,
    note: `Q ≈ ${a.toFixed(0)}·L + ${b.toFixed(0)} — report 1960·L + 202`,
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
export function completeExperiment(id: ExpId, from = 0, points: Point[] = [], rng: Rng | null = Math.random): Point[] {
  const out = points.slice();
  for (const trial of experiment(id).trials.slice(from)) {
    const r = prepare(trial, rng);
    out.push(...measure(id, trial, trackOf(r.run, r.L, trial.seconds, undefined, r.noise, rng ?? undefined)));
  }
  return out;
}
