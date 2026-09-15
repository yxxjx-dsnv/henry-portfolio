import { REPORT, fitQuadratic, trackOf } from './pendulumPhysics';
import { EXPERIMENTS, completeExperiment, experiment, fitOf, measure, runOf } from './pendulumExperiments';

test('the trials are the report’s procedure', () => {
  const n = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e.trials.length]));
  expect(n).toEqual({ angle: 16, decay: 1, length: 6, q: 6 });
  expect(experiment('angle').trials.map((t) => Math.round((t.theta0 * 180) / Math.PI))).toEqual([
    -80, -70, -60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60, 70, 80,
  ]);
  expect(experiment('length').trials.map((t) => t.L)).toEqual(REPORT.lengths);
  expect(experiment('decay').trials[0]).toMatchObject({ L: REPORT.L, theta0: REPORT.theta0, seconds: 200 });
});

test('one tracked release measures its period', () => {
  const trial = experiment('angle').trials[8]; // +10°
  const [p] = measure('angle', trial, trackOf(runOf(trial), trial.L, trial.seconds));
  expect(p.x).toBeCloseTo(0.1745, 3);
  expect(Math.abs(p.y - REPORT.T0) / REPORT.T0).toBeLessThan(0.003);
});

test('the four experiments, run through, land on the report’s fits', () => {
  const angle = completeExperiment('angle');
  const [a, b, c] = fitQuadratic(
    angle.map((p) => p.x),
    angle.map((p) => p.y),
  );
  expect(Math.abs(a - REPORT.T0)).toBeLessThan(0.003);
  expect(Math.abs(b / a)).toBeLessThan(0.002);
  expect(c / a).toBeGreaterThan(0.06);
  expect(fitOf('angle', angle)!.note).toMatch(/T₀ = 0\.93/);

  const decay = completeExperiment('decay');
  const note = fitOf('decay', decay)!.note;
  expect(note).toMatch(/τ = 17\d s/);
  expect(note).toMatch(/Q = πτ\/T = (58|59|60)\d/);
  expect(note).toMatch(/Q = 4N = (5|6)\d\d/);

  const length = completeExperiment('length');
  const lf = fitOf('length', length)!;
  expect(Math.abs(lf.line(REPORT.L) - REPORT.k * REPORT.L ** REPORT.n)).toBeLessThan(0.01);
  expect(lf.note).toMatch(/k = 1\.9\d, n = 0\.43\d/);

  const q = completeExperiment('q');
  const qf = fitOf('q', q)!;
  expect(Math.abs(qf.line(0.221) - (REPORT.qa * 0.221 + REPORT.qb))).toBeLessThan(25);
});

test('finishing from part-way keeps the points already taken', () => {
  const first = completeExperiment('length', 0).slice(0, 2);
  const all = completeExperiment('length', 2, first);
  expect(all).toHaveLength(6);
  expect(all.slice(0, 2)).toEqual(first);
  expect(fitOf('length', first.slice(0, 1))).toBeNull();
});
