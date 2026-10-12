import { BENCH, swing } from './pendulumModel';
import { refused, track } from './pendulumInstruments';
import { DEFAULT_MEASURE, trial, trackerOf } from './pendulumBench';
import { MIN_PULL, isRelease, readNow, runSliced, trialRun } from './pendulumRun';

// a seeded uniform generator, so two runs draw the same scatter
const seeded = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const tick = () => new Promise((r) => setTimeout(r, 0));

test('a tap is not a release: letting go within 2° of hanging is ignored', () => {
  expect(MIN_PULL).toBeCloseTo((2 * Math.PI) / 180);
  expect(isRelease(0)).toBe(false);
  expect(isRelease(-0.03)).toBe(false); // 1.7°
  expect(isRelease(0.04)).toBe(true); // 2.3°
  expect(isRelease(-0.5)).toBe(true);
});

test('measuring too early refuses with the reason, and a few swings later it reads', () => {
  const m = swing({ ...BENCH, theta0: 0.3 }, 6);
  const early = readNow(track(m, 1.2, trackerOf(DEFAULT_MEASURE)), DEFAULT_MEASURE);
  expect('reason' in early && early.reason).toMatch(/needs \d more full swing/);
  const later = readNow(track(m, 6, trackerOf(DEFAULT_MEASURE)), DEFAULT_MEASURE);
  if ('reason' in later) throw new Error(later.reason);
  expect(refused(later.period)).toBe(false);
  // a decay asked for, on a recording too short to see it die away, is refused too
  expect(readNow(track(m, 4, trackerOf(DEFAULT_MEASURE)), { kind: 'tracker', fps: 30, decay: true })).toHaveProperty('reason');
});

test('a trial run keeps the very row trial() gives, with the track to show', () => {
  const s = { ...BENCH, stringLength: 0.15, theta0: 0.4 };
  const r = trialRun(s, DEFAULT_MEASURE, seeded(7), 3);
  expect(r.row).toEqual(trial(s, DEFAULT_MEASURE, seeded(7), 3));
  expect(r.track.n).toBeGreaterThan(100);
  expect(r.motion.theta[0]).not.toBeCloseTo(0.4, 3); // the hand's scatter on the release
});

test('a run goes a slice at a time, stops when told, and says when it is done', async () => {
  const seen: number[] = [];
  const stop = runSliced(5, (i) => seen.push(i), () => seen.push(-1), 0); // budget 0: one job a slice
  expect(seen).toEqual([]); // nothing until the page has had its turn
  await tick();
  expect(seen).toEqual([0]);
  stop();
  await tick();
  await tick();
  expect(seen).toEqual([0]);

  const all: number[] = [];
  await new Promise<void>((done) => runSliced(4, (i) => all.push(i), done));
  expect(all).toEqual([0, 1, 2, 3]);
});
