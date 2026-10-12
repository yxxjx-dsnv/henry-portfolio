import { BENCH, swing } from './pendulumModel';
import { refused, track } from './pendulumInstruments';
import {
  DEFAULT_MEASURE,
  display,
  fmtReading,
  PRESETS,
  fit,
  parseReport,
  readTrack,
  series,
  sweep,
  textbookPeriod,
  toCSV,
  trackerOf,
  trial,
  varying,
} from './pendulumBench';
import { REPORT } from './pendulumPhysics';

test('a sweep runs from end to end, each value repeated', () => {
  const s = sweep(BENCH, 'stringLength', 0.1, 0.3, 3, 2);
  expect(s.map((x) => x.stringLength)).toEqual([0.1, 0.1, 0.2, 0.2, 0.3, 0.3]);
});

test('a fit refuses points that cannot pin it down, instead of drawing NaN', () => {
  expect(fit('linear', [0.5, 0.5, 0.5], [1, 1.1, 0.9])).toHaveProperty('reason');
  expect(fit('quadratic', [0.1, 0.2, 0.1, 0.2], [1, 2, 1, 2])).toHaveProperty('reason');
  expect(fit('power', [0, 0.1, 0.2], [1, 2, 3])).toHaveProperty('reason');
  const line = fit('linear', [0, 1, 2], [1, 3, 5]);
  expect('params' in line && line.params.slope).toBeCloseTo(2);
});

test('one trial on the bench reads the period the apparatus swings at, within 1 % of the textbook’s', () => {
  const r = trial(BENCH, DEFAULT_MEASURE);
  if (refused(r.period)) throw new Error(r.period.reason);
  expect(r.period.value).toBeGreaterThan(0.94);
  expect(r.period.value).toBeLessThan(0.96);
  expect(Math.abs(textbookPeriod(BENCH) / r.period.value - 1)).toBeLessThan(0.01);
});

test('a stopwatch that has not seen enough swings says so; with them it times the period', () => {
  const sw = { kind: 'stopwatch', swings: 10 } as const;
  const early = readTrack(track(swing(BENCH, 6), 6, trackerOf(sw)), sw);
  expect(refused(early.period) && early.period.reason).toMatch(/more swings on the stopwatch/);
  const r = trial(BENCH, sw);
  if (refused(r.period)) throw new Error(r.period.reason);
  expect(Math.abs(r.period.value - 0.952)).toBeLessThan(0.01);
});

test('the period-vs-length preset comes out near the report’s power law', () => {
  const p = PRESETS.find((x) => x.id === 'length')!;
  const rows = p.setups.map((s, i) => trial(s, p.measure, undefined, i + 1));
  expect(varying(rows)).toEqual(['L']);
  const pts = series(rows, p.x, p.y);
  const f = fit(p.fit, pts.map((q) => q.x), pts.map((q) => q.y));
  if ('reason' in f) throw new Error(f.reason);
  expect(Math.abs(f.params.n - REPORT.n)).toBeLessThan(0.05);
});

test('the decay preset gives the amplitude envelope and a Q near the report’s', () => {
  const p = PRESETS.find((x) => x.id === 'decay')!;
  const r = trial(p.setups[0], p.measure);
  expect(series([r], p.x, p.y).length).toBeGreaterThan(100);
  if (!r.q || refused(r.q)) throw new Error('no Q');
  expect(Math.abs(r.q.value / REPORT.Q - 1)).toBeLessThan(0.03);
});

test('the report’s files parse, the decay track reduced to its peaks', () => {
  expect(parseReport('x y dx dy\n0.05 0.5444 0.001 0.0047\n# note\n', false)).toEqual([{ x: 0.05, y: 0.5444, dy: 0.0047 }]);
  expect(parseReport('t theta\n0 0.1\n1 0.3\n2 0.2\n3 -0.1\n4 0.25\n5 0.1', true).map((p) => p.x)).toEqual([1, 4]);
});

test('the table goes out as CSV, a refused measurement with its reason', () => {
  const ok = trial(BENCH, DEFAULT_MEASURE, undefined, 1);
  const short = { ...ok, id: 2, period: { reason: 'needs 2 more full swings' } };
  const csv = toCSV([ok, short]).split('\n');
  expect(csv[0]).toMatch(/^n,how,L_m/);
  expect(csv[1]).toMatch(/^1,Tracker 30 fps,0\.2,/);
  expect(csv[2]).toMatch(/needs 2 more full swings$/);
});

test('a reading shows the decimals its uncertainty earns', () => {
  expect(fmtReading(0.95163, 0.0011)).toBe('0.952 ± 0.001');
  expect(fmtReading(594.2, 7.3)).toBe('594 ± 7');
  expect(fmtReading(178.4, undefined)).toBe('178');
  expect(display('L', 'rad')).toEqual({ unit: 'cm', scale: 100, digits: 1 });
});
