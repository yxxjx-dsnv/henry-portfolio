// The lab bench: what a visitor varies, how a trial is measured, the table it lands in,
// the axes a graph of that table can take and the fits it can carry, and the report's four
// experiments as presets of the same machinery. Pure functions; the lab's UI is built on
// these contracts (PendulumLab.tsx and its panels).
import { REPORT, bigAngle, fitLinear, fitQuadratic, type Point, type Rng } from './pendulumPhysics';
import { BENCH, smallAnglePeriod, swing, type Setup } from './pendulumModel';
import {
  REACTION,
  decayOfTrack,
  envelopeOfTrack,
  letGo,
  periodOfTrack,
  protractor,
  refused,
  stopwatchPeriod,
  track,
  type Result,
  type Track,
  type TrackerSettings,
} from './pendulumInstruments';

const DEG = Math.PI / 180;

// ── what can be varied ────────────────────────────────────────────────────

export type VarKey = 'stringLength' | 'theta0' | 'bobRadius' | 'bobMass' | 'g' | 'fluidRho' | 'pivotFriction';

/** Each knob in SI, with the range the bench allows (the panel's sliders and the sweep's bounds). */
export const VARIABLES: Record<
  VarKey,
  { label: string; unit: string; min: number; max: number; get: (s: Setup) => number; set: (s: Setup, v: number) => Setup }
> = {
  stringLength: { label: 'String length', unit: 'm', min: 0.03, max: 0.6, get: (s) => s.stringLength, set: (s, v) => ({ ...s, stringLength: v }) },
  theta0: { label: 'Release angle', unit: 'rad', min: 1 * DEG, max: 85 * DEG, get: (s) => s.theta0, set: (s, v) => ({ ...s, theta0: v }) },
  bobRadius: { label: 'Bob radius', unit: 'm', min: 0.005, max: 0.04, get: (s) => s.bobRadius, set: (s, v) => ({ ...s, bobRadius: v }) },
  bobMass: { label: 'Bob mass', unit: 'kg', min: 0.001, max: 2, get: (s) => s.bobMass, set: (s, v) => ({ ...s, bobMass: v }) },
  g: { label: 'Gravity', unit: 'm/s²', min: 0.5, max: 30, get: (s) => s.g, set: (s, v) => ({ ...s, g: v }) },
  fluidRho: { label: 'Fluid density', unit: 'kg/m³', min: 0, max: 1000, get: (s) => s.fluid.rho, set: (s, v) => ({ ...s, fluid: { ...s.fluid, rho: v } }) },
  pivotFriction: { label: 'Extra pivot friction', unit: 'N·m·s', min: 0, max: 0.002, get: (s) => s.pivotFriction, set: (s, v) => ({ ...s, pivotFriction: v }) },
};

/** `steps` evenly spaced values from `from` to `to` (both ends included), each `repeats` times. */
export function sweep(base: Setup, key: VarKey, from: number, to: number, steps: number, repeats = 1): Setup[] {
  const n = Math.max(1, Math.round(steps));
  const out: Setup[] = [];
  for (let i = 0; i < n; i++) {
    const v = n === 1 ? from : from + ((to - from) * i) / (n - 1);
    for (let r = 0; r < Math.max(1, Math.round(repeats)); r++) out.push(VARIABLES[key].set(base, v));
  }
  return out;
}

// ── how a trial is measured ───────────────────────────────────────────────

/** The instrument and what it reads: the period off Tracker's frames, the decay (and so τ and
 *  Q) off a long Tracker recording, or the period from a stopwatch timing `swings` swings. */
export type Measure = { kind: 'tracker'; fps: number; decay: boolean } | { kind: 'stopwatch'; swings: number };

export const FPS_CHOICES = [15, 30, 60, 240] as const;
export const SWING_CHOICES = [1, 5, 10, 20] as const;
export const JITTER = 0.0004; // m, Tracker's sub-pixel jitter on the bob (the report's video)
export const DECAY_SECONDS = 200; // the report's decay recording
export const DEFAULT_MEASURE: Measure = { kind: 'tracker', fps: 30, decay: false };

/** What records the swing: Tracker at its frame rate, or (under a stopwatch) the true motion
 *  finely, the hand's error being added when it is read. */
export const trackerOf = (m: Measure): TrackerSettings =>
  m.kind === 'tracker' ? { fps: m.fps, jitter: JITTER } : { fps: 240, jitter: 0 };

/** How long a trial runs for its measurement: a period wants a few full swings (MIN_SWINGS and a
 *  margin), a decay the report's 200 s, a stopwatch its count. */
export function secondsFor(s: Setup, m: Measure): number {
  const T = smallAnglePeriod(s) * bigAngle(Math.abs(s.theta0));
  if (!Number.isFinite(T)) return 8;
  if (m.kind === 'stopwatch') return T * m.swings + 1.5;
  if (m.decay) return DECAY_SECONDS;
  return Math.max(4, 4.5 * T);
}

/** The words for an instrument, in the table and the CSV. */
export const measureLabel = (m: Measure) =>
  m.kind === 'stopwatch' ? `stopwatch ×${m.swings}` : `Tracker ${m.fps} fps${m.decay ? ' · decay' : ''}`;

/** One row of the lab table: what was set, what was read, what came out. */
export type Row = {
  id: number;
  setup: Setup; // as set (a hand's release angle is in angleRead)
  angleRead: number; // rad, the protractor's reading of the release, to the degree
  how: string; // measureLabel of the instrument
  byHand: boolean;
  period: Result;
  decay?: Result; // τ, when the measurement watched the swing die away
  q?: Result; // Q = π τ / T
  envelope?: Point[]; // the decay's positive peaks, (t, θ), for the amplitude graph
};

/** Read a recorded track: what one trial gives, or why it cannot yet. A stopwatch is read off
 *  the same motion: the true period, timed over `swings` swings by a hand. */
export function readTrack(tr: Track, m: Measure, rng?: Rng): Pick<Row, 'period' | 'decay' | 'q' | 'envelope'> {
  const tk = trackerOf(m);
  const truth = periodOfTrack(tr, tk);
  if (m.kind === 'stopwatch') {
    if (refused(truth)) return { period: truth };
    const timed = Math.floor((tr.n ? tr.t[tr.n - 1] : 0) / truth.value + 1e-6); // swings the recording holds
    const more = m.swings - timed;
    if (more > 0) return { period: { reason: `needs ${more} more swing${more === 1 ? '' : 's'} on the stopwatch` } };
    return { period: stopwatchPeriod(truth.value, m.swings, rng, REACTION) };
  }
  if (!m.decay) return { period: truth };
  const decay = decayOfTrack(tr);
  const q: Result = refused(decay)
    ? decay
    : refused(truth)
      ? truth
      : {
          value: (Math.PI * decay.value) / truth.value,
          uncertainty: Math.PI * Math.hypot(decay.uncertainty / truth.value, (decay.value * truth.uncertainty) / truth.value ** 2),
        };
  return { period: truth, decay, q, envelope: envelopeOfTrack(tr) };
}

/** One trial run straight through (a sweep or a preset): a hand lets go near the set angle
 *  (rng gives the lab's scatter; none = ideal), the instrument records it, and it is read. */
export function trial(s: Setup, m: Measure, rng?: Rng, id = 0): Row {
  const actual = { ...s, theta0: letGo(s.theta0, rng) };
  const seconds = secondsFor(s, m);
  const tr = track(swing(actual, seconds), seconds, trackerOf(m), rng);
  return { id, setup: s, angleRead: protractor(s.theta0).value, how: measureLabel(m), byHand: false, ...readTrack(tr, m, rng) };
}

// ── the table's columns and the graph's axes ──────────────────────────────

export type ColKey = 'L' | 'theta' | 'r' | 'm' | 'g' | 'rho' | 'friction' | 'T' | 'tau' | 'Q';
type Col = { label: string; unit: string; input: boolean; value: (r: Row) => number | undefined; err?: (r: Row) => number | undefined };

const val = (x: Result | undefined) => (x && !refused(x) ? x.value : undefined);
const unc = (x: Result | undefined) => (x && !refused(x) ? x.uncertainty : undefined);

/** Every column in SI (the UI scales for display: cm, g, degrees). `input` columns are what was
 *  set; the rest were measured. The length is the string's, as the report's ruler read it. */
export const COLUMNS: Record<ColKey, Col> = {
  L: { label: 'L', unit: 'm', input: true, value: (r) => r.setup.stringLength },
  theta: { label: 'θ₀', unit: 'rad', input: true, value: (r) => r.angleRead },
  r: { label: 'r', unit: 'm', input: true, value: (r) => r.setup.bobRadius },
  m: { label: 'm', unit: 'kg', input: true, value: (r) => r.setup.bobMass },
  g: { label: 'g', unit: 'm/s²', input: true, value: (r) => r.setup.g },
  rho: { label: 'ρ', unit: 'kg/m³', input: true, value: (r) => r.setup.fluid.rho },
  friction: { label: 'pivot', unit: 'N·m·s', input: true, value: (r) => r.setup.pivotFriction },
  T: { label: 'T', unit: 's', input: false, value: (r) => val(r.period), err: (r) => unc(r.period) },
  tau: { label: 'τ', unit: 's', input: false, value: (r) => val(r.decay), err: (r) => unc(r.decay) },
  Q: { label: 'Q', unit: '', input: false, value: (r) => val(r.q), err: (r) => unc(r.q) },
};
export const INPUT_COLS: ColKey[] = ['L', 'theta', 'r', 'm', 'g', 'rho', 'friction'];
export const OUTPUT_COLS: ColKey[] = ['T', 'tau', 'Q'];

/** The input columns that differ between rows — the only ones worth a table column or an x
 *  axis (the rest are the same for every row and read once, in the setup). */
export function varying(rows: Row[]): ColKey[] {
  return INPUT_COLS.filter((k) => {
    const vs = rows.map((r) => COLUMNS[k].value(r));
    return vs.some((v) => v !== vs[0]);
  });
}

/** A graph's axes: an input column against a measured one, or the last decay's amplitude
 *  against time ('t' / 'A'). */
export type XAxis = ColKey | 't';
export type YAxis = 'T' | 'tau' | 'Q' | 'A';

/** A graph's points from the table (each with its uncertainty), or the last decay's envelope. */
export function series(rows: Row[], x: XAxis, y: YAxis): Point[] {
  if (y === 'A' || x === 't') {
    for (let i = rows.length - 1; i >= 0; i--) if (rows[i].envelope?.length) return rows[i].envelope!;
    return [];
  }
  const out: Point[] = [];
  for (const r of rows) {
    const xv = COLUMNS[x].value(r);
    const yv = COLUMNS[y].value(r);
    if (xv === undefined || yv === undefined) continue;
    out.push({ x: xv, y: yv, dy: COLUMNS[y].err?.(r) });
  }
  return out;
}

/** The textbook's period for a setup: a point bob on a weightless string, no air, and the
 *  exact large-angle stretch. The gap between this line and the bench is the real pendulum. */
export const textbookPeriod = (s: Setup) =>
  2 * Math.PI * Math.sqrt((s.stringLength + s.bobRadius) / s.g) * bigAngle(Math.abs(s.theta0));

/** The textbook line for a period graph against an input column, other knobs as in `base`. */
export function theoryLine(base: Setup, x: XAxis, y: YAxis): ((v: number) => number) | undefined {
  if (y !== 'T') return undefined;
  const key: Partial<Record<XAxis, VarKey>> = { L: 'stringLength', theta: 'theta0', r: 'bobRadius', m: 'bobMass', g: 'g' };
  const k = key[x];
  return k ? (v) => textbookPeriod(VARIABLES[k].set(base, v)) : undefined;
}

// ── fits ──────────────────────────────────────────────────────────────────

export type FitKind = 'linear' | 'quadratic' | 'power' | 'exponential';
export const FIT_KINDS: FitKind[] = ['linear', 'quadratic', 'power', 'exponential'];
export type Fit = { kind: FitKind; params: Record<string, number>; at: (x: number) => number; residuals: number[] };

const distinct = (xs: number[]) => new Set(xs.map((x) => x.toPrecision(9))).size;

/** Fit y(x). Refuses, with the reason in words, when the points cannot pin the curve down:
 *  too few distinct x values (all releases at one angle give no line), or values a log
 *  fit cannot take. */
export function fit(kind: FitKind, xs: number[], ys: number[]): Fit | { reason: string } {
  const pts = xs.map((x, i) => [x, ys[i]]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  const x = pts.map((p) => p[0]);
  const y = pts.map((p) => p[1]);
  const need = kind === 'quadratic' ? 3 : 2;
  if (distinct(x) < need) return { reason: `needs points at ${need} or more different x values` };
  if ((kind === 'power' && x.some((v) => v <= 0)) || ((kind === 'power' || kind === 'exponential') && y.some((v) => v <= 0)))
    return { reason: 'a log fit needs every value above zero' };
  let at: (v: number) => number;
  let params: Record<string, number>;
  if (kind === 'linear') {
    const f = fitLinear(x, y);
    params = { slope: f.a, intercept: f.b };
    at = (v) => f.a * v + f.b;
  } else if (kind === 'quadratic') {
    const [c0, c1, c2] = fitQuadratic(x, y);
    params = { c0, c1, c2 };
    at = (v) => c0 + c1 * v + c2 * v * v;
  } else if (kind === 'power') {
    const f = fitLinear(x.map(Math.log), y.map(Math.log));
    params = { k: Math.exp(f.b), n: f.a };
    at = (v) => Math.exp(f.b) * v ** f.a;
  } else {
    const f = fitLinear(x, y.map(Math.log));
    params = { A: Math.exp(f.b), tau: -1 / f.a };
    at = (v) => Math.exp(f.b + f.a * v);
  }
  if (Object.values(params).some((v) => !Number.isFinite(v))) return { reason: 'these points do not determine the fit' };
  return { kind, params, at, residuals: x.map((v, i) => y[i] - at(v)) };
}

/** A fit's one line: the equation with its numbers. */
export function fitEquation(f: Fit): string {
  const p = f.params;
  const n = (v: number, d = 3) => (Math.abs(v) >= 1000 ? v.toFixed(0) : String(+v.toPrecision(d)));
  const sign = (v: number) => (v < 0 ? '−' : '+');
  if (f.kind === 'linear') return `y = ${n(p.slope)}·x ${sign(p.intercept)} ${n(Math.abs(p.intercept))}`;
  if (f.kind === 'quadratic') return `y = ${n(p.c0, 4)} ${sign(p.c1)} ${n(Math.abs(p.c1))}·x ${sign(p.c2)} ${n(Math.abs(p.c2))}·x²`;
  if (f.kind === 'power') return `y = ${n(p.k)}·x^${n(p.n)}`;
  return `y = ${n(p.A)}·e^(−x/${n(p.tau)})`;
}

// ── the report's experiments, as presets ──────────────────────────────────

export type PresetId = 'angle' | 'decay' | 'length' | 'q';
export type Preset = { id: PresetId; lab: string; name: string; setups: Setup[]; measure: Measure; x: XAxis; y: YAxis; fit: FitKind };

const atLength = (L: number): Setup => ({ ...BENCH, stringLength: L }); // the report's lengths are the string's, as its ruler read them

export const PRESETS: Preset[] = [
  {
    id: 'angle',
    lab: 'Lab 1',
    name: 'Period vs angle',
    setups: [-80, -70, -60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60, 70, 80].map((d) => ({ ...BENCH, theta0: d * DEG })),
    measure: { kind: 'tracker', fps: 60, decay: false }, // the report's 60 fps clips
    x: 'theta',
    y: 'T',
    fit: 'quadratic',
  },
  { id: 'decay', lab: 'Lab 1', name: 'Amplitude vs time', setups: [BENCH], measure: { kind: 'tracker', fps: 30, decay: true }, x: 't', y: 'A', fit: 'exponential' },
  { id: 'length', lab: 'Lab 2', name: 'Period vs length', setups: REPORT.lengths.map(atLength), measure: { kind: 'tracker', fps: 60, decay: false }, x: 'L', y: 'T', fit: 'power' },
  { id: 'q', lab: 'Lab 2', name: 'Q vs length', setups: REPORT.lengths.map(atLength), measure: { kind: 'tracker', fps: 30, decay: true }, x: 'L', y: 'Q', fit: 'linear' },
];

/** The report's own data and fitted curve for a graph whose axes are one of the report's: the
 *  file under /media/pendulum/data/ (columns x y dx dy; the decay file is the raw track, to be
 *  reduced to its positive peaks) and the curve the report fitted. */
export function reportSeries(x: XAxis, y: YAxis): { file: string; peaks: boolean; line: (v: number) => number } | undefined {
  if (x === 'theta' && y === 'T') return { file: 'period-vs-angle.txt', peaks: false, line: (v) => REPORT.T0 * (1 + REPORT.B * v + REPORT.C * v * v) };
  if (x === 't' && y === 'A') return { file: 'amplitude-decay.txt', peaks: true, line: (v) => REPORT.theta0 * Math.exp(-v / REPORT.tau) };
  if (x === 'L' && y === 'T') return { file: 'period-vs-length.txt', peaks: false, line: (v) => REPORT.k * v ** REPORT.n };
  if (x === 'L' && y === 'Q') return { file: 'q-factor-vs-length.txt', peaks: false, line: (v) => REPORT.qa * v + REPORT.qb };
  return undefined;
}

/** Parse a report data file: whitespace columns, header and comment lines skipped; with
 *  `peaks`, a raw track reduced to its positive peaks. */
export function parseReport(text: string, peaks: boolean): Point[] {
  const pts: Point[] = [];
  for (const line of text.split('\n')) {
    const c = line.trim().split(/\s+/).map(Number);
    if (c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1])) pts.push({ x: c[0], y: c[1], dy: Number.isFinite(c[3]) ? c[3] : undefined });
  }
  if (!peaks) return pts;
  return pts.filter((p, i) => i > 0 && i < pts.length - 1 && p.y > 0 && p.y >= pts[i - 1].y && p.y > pts[i + 1].y);
}

// ── the table out ─────────────────────────────────────────────────────────

const cell = (v: number | undefined, d = 6) => (v === undefined ? '' : String(+v.toPrecision(d)));

/** The table as CSV, SI units, one row per measurement; a refused measurement keeps its reason. */
export function toCSV(rows: Row[]): string {
  const head = ['n', 'how', 'L_m', 'theta0_rad', 'r_m', 'm_kg', 'g_m_s2', 'rho_kg_m3', 'pivot_Nms', 'T_s', 'dT_s', 'tau_s', 'dtau_s', 'Q', 'dQ', 'note'];
  const lines = rows.map((r) => {
    const note = [r.period, r.decay, r.q].find((x) => x && refused(x)) as { reason: string } | undefined;
    return [
      r.id,
      r.how + (r.byHand ? ' · by hand' : ''),
      cell(r.setup.stringLength),
      cell(r.angleRead),
      cell(r.setup.bobRadius),
      cell(r.setup.bobMass),
      cell(r.setup.g),
      cell(r.setup.fluid.rho),
      cell(r.setup.pivotFriction),
      cell(val(r.period)),
      cell(unc(r.period), 2),
      cell(val(r.decay)),
      cell(unc(r.decay), 2),
      cell(val(r.q)),
      cell(unc(r.q), 2),
      note?.reason ?? '',
    ]
      .map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v)))
      .join(',');
  });
  return [head.join(','), ...lines].join('\n');
}

// ── how the panels show numbers ───────────────────────────────────────────

export type AngleUnit = 'rad' | 'deg';

/** Each column as the panels show it: the unit, the factor from SI, the decimals. Lengths in
 *  cm and mass in g, as on the bench; an angle in the lab's chosen unit. */
export function display(k: ColKey | 't' | 'A', u: AngleUnit): { unit: string; scale: number; digits: number } {
  switch (k) {
    case 'L':
    case 'r':
      return { unit: 'cm', scale: 100, digits: 1 };
    case 'theta':
    case 'A':
      return u === 'deg' ? { unit: '°', scale: 180 / Math.PI, digits: 1 } : { unit: 'rad', scale: 1, digits: 3 };
    case 'm':
      return { unit: 'g', scale: 1000, digits: 1 };
    case 'g':
      return { unit: 'm/s²', scale: 1, digits: 2 };
    case 'rho':
      return { unit: 'kg/m³', scale: 1, digits: 1 };
    case 'friction':
      return { unit: 'µN·m·s', scale: 1e6, digits: 0 };
    case 'T':
      return { unit: 's', scale: 1, digits: 3 };
    case 'tau':
    case 't':
      return { unit: 's', scale: 1, digits: 0 };
    case 'Q':
      return { unit: '', scale: 1, digits: 0 };
  }
}

/** A reading as "0.952 ± 0.001": the value to the decimals its uncertainty earns (one
 *  significant figure of uncertainty), never fewer than `min`. */
export function fmtReading(value: number, uncertainty: number | undefined, min = 0): string {
  if (!uncertainty || !(uncertainty > 0)) return value.toFixed(min);
  const d = Math.max(min, Math.min(6, -Math.floor(Math.log10(uncertainty))));
  return `${value.toFixed(d)} ± ${uncertainty.toFixed(d)}`;
}
