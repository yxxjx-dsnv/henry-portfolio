import { REPORT, bigAngle, fitExp, peaks, periodFromTrack, periodOf, simulate, trackOf } from './pendulumPhysics';

test('a small swing keeps the period it was calibrated to', () => {
  const T = periodOf(simulate(REPORT.T0, REPORT.tau, 0.05, 6));
  expect(Math.abs(T - REPORT.T0) / REPORT.T0).toBeLessThan(0.002);
});

test('a wide swing runs long by the textbook factor', () => {
  const T = periodOf(simulate(REPORT.T0, REPORT.tau, 1.4, 6));
  expect(Math.abs(T / REPORT.T0 - bigAngle(1.4))).toBeLessThan(0.006);
});

test('the decay envelope gives back τ and the report’s Q', () => {
  const run = simulate(REPORT.T0, REPORT.tau, REPORT.theta0, 200, 1 / 300);
  const env = peaks(run);
  const { tau } = fitExp(
    env.map((p) => p[0]),
    env.map((p) => p[1]),
  );
  expect(Math.abs(tau - REPORT.tau) / REPORT.tau).toBeLessThan(0.02);
  expect(Math.abs((Math.PI * tau) / periodOf(run) - REPORT.Q)).toBeLessThan(15);
});

test('a 30 fps track still gives the period to a millisecond', () => {
  const run = simulate(REPORT.T0, REPORT.tau, 0.1, 8);
  const T = periodFromTrack(trackOf(run, REPORT.L, 8));
  expect(Math.abs(T - periodOf(run))).toBeLessThan(0.001);
});
