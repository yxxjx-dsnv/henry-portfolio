import { BENCH, FLUIDS, GRAVITY, IDEAL, dynamics, smallAnglePeriod, swing, type Setup } from './pendulumModel';
import { decayOfTrack, periodOfTrack, refused, track, type Result } from './pendulumInstruments';
import { REPORT, bigAngle } from './pendulumPhysics';

const FINE = { fps: 240, jitter: 0 };
const value = (r: Result) => {
  if (refused(r)) throw new Error(r.reason);
  return r.value;
};
const periodOf = (s: Setup, seconds = 8, cal = IDEAL) => value(periodOfTrack(track(swing(s, seconds, cal), seconds, FINE), FINE));
const vacuum: Setup = { ...BENCH, fluid: FLUIDS.vacuum };

test('in a vacuum with no hidden losses the swing keeps its energy', () => {
  const m = swing(vacuum, 20, IDEAL);
  const d = dynamics(vacuum, IDEAL);
  const energy = (i: number) => 0.5 * d.I * m.omega[i] ** 2 + d.grav * (1 - Math.cos(m.theta[i]));
  expect(Math.abs(energy(m.theta.length - 1) / energy(0) - 1)).toBeLessThan(1e-4);
});

test('a small swing keeps the physical pendulum’s period, a wide one the textbook stretch', () => {
  const T0 = smallAnglePeriod(vacuum, IDEAL);
  expect(Math.abs(periodOf({ ...vacuum, theta0: 0.05 }) / T0 - 1)).toBeLessThan(0.001);
  expect(Math.abs(periodOf({ ...vacuum, theta0: 1.4 }) / T0 - bigAngle(1.4))).toBeLessThan(0.006);
});

test('the default apparatus swings like the one on the lab day', () => {
  expect(Math.abs(smallAnglePeriod(BENCH) / REPORT.T0 - 1)).toBeLessThan(0.003);
  const tr = track(swing(BENCH, 200), 200, FINE);
  const tau = value(decayOfTrack(tr));
  const T = value(periodOfTrack(tr, FINE));
  expect(Math.abs(tau / REPORT.tau - 1)).toBeLessThan(0.03);
  expect(Math.abs((Math.PI * tau) / T / REPORT.Q - 1)).toBeLessThan(0.03);
});

test('on the Moon it swings slower by √(g ratio)', () => {
  const ratio = smallAnglePeriod({ ...BENCH, g: GRAVITY.moon }) / smallAnglePeriod(BENCH);
  expect(Math.abs(ratio / Math.sqrt(GRAVITY.earth / GRAVITY.moon) - 1)).toBeLessThan(0.005);
});

test('in water it swings slower and dies away far sooner', () => {
  const water: Setup = { ...BENCH, fluid: FLUIDS.water };
  expect(smallAnglePeriod(water)).toBeGreaterThan(smallAnglePeriod(BENCH) * 1.2);
  const peak = (s: Setup) => Math.max(...swing(s, 6).theta.slice(-1000));
  expect(peak(water)).toBeLessThan(peak(BENCH) / 2);
});
