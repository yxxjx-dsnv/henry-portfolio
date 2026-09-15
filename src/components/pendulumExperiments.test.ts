import { REPORT, fitQuadratic, trackOf } from './pendulumPhysics';
import { EXPERIMENTS, completeExperiment, experiment, fitOf, measure, prepare } from './pendulumExperiments';

/** mulberry32: a seeded lab day, so the scatter is the same every test run. */
const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

test('the trials are the report’s procedure', () => {
  const n = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e.trials.length]));
  expect(n).toEqual({ angle: 16, decay: 1, length: 6, q: 6 });
  expect(experiment('angle').trials.map((t) => Math.round((t.theta0 * 180) / Math.PI))).toEqual([
    -80, -70, -60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60, 70, 80,
  ]);
  expect(experiment('length').trials.map((t) => t.L)).toEqual(REPORT.lengths);
  expect(experiment('decay').trials[0]).toMatchObject({ L: REPORT.L, theta0: REPORT.theta0, seconds: 200 });
  for (const e of EXPERIMENTS) expect(e.blurb.length).toBeGreaterThan(40);
});

test('an ideal release measures its period exactly', () => {
  const trial = experiment('angle').trials[8]; // +10°
  const r = prepare(trial, null);
  const [p] = measure('angle', trial, trackOf(r.run, r.L, trial.seconds));
  expect(p.x).toBeCloseTo(0.1745, 3);
  expect(Math.abs(p.y - REPORT.T0) / REPORT.T0).toBeLessThan(0.003);
});

test('the ideal experiments land on the report’s fits', () => {
  const angle = completeExperiment('angle', 0, [], null);
  const [a, b, c] = fitQuadratic(
    angle.map((p) => p.x),
    angle.map((p) => p.y),
  );
  expect(Math.abs(a - REPORT.T0)).toBeLessThan(0.003);
  expect(Math.abs(b / a)).toBeLessThan(0.002);
  expect(c / a).toBeGreaterThan(0.06);
  expect(fitOf('angle', angle)!.note).toMatch(/T₀ = 0\.93/);

  const decay = completeExperiment('decay', 0, [], null);
  const note = fitOf('decay', decay)!.note;
  expect(note).toMatch(/τ = 17\d s/);
  expect(note).toMatch(/Q = πτ\/T = (58|59|60)\d/);
  expect(note).toMatch(/Q = 4N = (5|6)\d\d/);

  const length = completeExperiment('length', 0, [], null);
  const lf = fitOf('length', length)!;
  expect(Math.abs(lf.line(REPORT.L) - REPORT.k * REPORT.L ** REPORT.n)).toBeLessThan(0.01);
  expect(lf.note).toMatch(/k = 1\.9\d, n = 0\.43\d/);

  const q = completeExperiment('q', 0, [], null);
  const qf = fitOf('q', q)!;
  expect(Math.abs(qf.line(0.221) - (REPORT.qa * 0.221 + REPORT.qb))).toBeLessThan(25);
});

test('a lab day scatters every release, but the fits stay inside the report’s error bars', () => {
  const dayA = completeExperiment('angle', 0, [], seeded(1));
  const dayB = completeExperiment('angle', 0, [], seeded(2));
  const ideal = completeExperiment('angle', 0, [], null);
  expect(dayA.map((p) => p.y)).not.toEqual(dayB.map((p) => p.y));
  const spread = Math.max(...dayA.map((p, i) => Math.abs(p.y - ideal[i].y)));
  expect(spread).toBeGreaterThan(0.0005); // it does move
  expect(spread).toBeLessThan(0.02); // a period off by less than the report's biggest error bar
  for (const seed of [3, 4, 5]) {
    const [a, , c] = fitQuadratic(
      dayA.map((p) => p.x),
      completeExperiment('angle', 0, [], seeded(seed)).map((p) => p.y),
    );
    expect(Math.abs(a - REPORT.T0)).toBeLessThan(0.006);
    expect(c / a).toBeGreaterThan(0.05);
    expect(c / a).toBeLessThan(0.09);
  }
  const q = fitOf('q', completeExperiment('q', 0, [], seeded(6)))!;
  expect(Math.abs(q.line(0.221) - 594)).toBeLessThan(40);
});

test('finishing from part-way keeps the points already taken', () => {
  const first = completeExperiment('length', 0, [], null).slice(0, 2);
  const all = completeExperiment('length', 2, first, null);
  expect(all).toHaveLength(6);
  expect(all.slice(0, 2)).toEqual(first);
  expect(fitOf('length', first.slice(0, 1))).toBeNull();
});
