import { BENCH, swing } from './pendulumModel';
import { MIN_SWINGS, TRACKER, decayOfTrack, periodOfTrack, refused, stopwatchPeriod, track } from './pendulumInstruments';

// a seeded uniform generator, so the noisy tests are the same every run
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

test('a recording too short for three full swings is refused, not measured', () => {
  const short = periodOfTrack(track(swing(BENCH, 2), 2));
  expect(refused(short) && short.reason).toMatch(/more full swing/);
  expect(MIN_SWINGS).toBe(3);
});

test('frame noise on a hanging bob makes no swings out of nothing', () => {
  const still = track(swing({ ...BENCH, theta0: 0 }, 8), 8, TRACKER, seeded(7));
  expect(refused(periodOfTrack(still))).toBe(true);
});

test('a noisy recording still reads the period to within its stated uncertainty', () => {
  const clean = periodOfTrack(track(swing(BENCH, 8), 8, { fps: 240, jitter: 0 }), { fps: 240, jitter: 0 });
  const noisy = periodOfTrack(track(swing(BENCH, 8), 8, TRACKER, seeded(3)));
  if (refused(clean) || refused(noisy)) throw new Error('refused');
  expect(Math.abs(noisy.value - clean.value)).toBeLessThan(3 * noisy.uncertainty + 1e-3);
});

test('timing more swings by hand shrinks the reaction error in proportion', () => {
  const one = stopwatchPeriod(0.95, 1);
  const ten = stopwatchPeriod(0.95, 10);
  if (refused(one) || refused(ten)) throw new Error('refused');
  expect(one.uncertainty / ten.uncertainty).toBeCloseTo(10);
  expect(refused(stopwatchPeriod(0.95, 0))).toBe(true);
});

test('a decay needs a recording long enough to see it', () => {
  expect(refused(decayOfTrack(track(swing(BENCH, 4), 4)))).toBe(true);
});
