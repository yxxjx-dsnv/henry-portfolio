import {
  REPORT,
  bigAngle,
  calibrate,
  fitExp,
  peaks,
  periodOf,
  runAngle,
  runLength,
  runQ,
  simulate,
} from './pendulumPhysics';

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

test('the four experiments land on the report’s fits', () => {
  const angle = runAngle();
  expect(Math.abs(angle.fit[0] - REPORT.T0)).toBeLessThan(0.003); // T0
  expect(Math.abs(angle.fit[1])).toBeLessThan(0.002); // B ≈ 0
  expect(angle.fit[2]).toBeGreaterThan(0.06); // C > 0: the period grows with angle²
  const length = runLength();
  expect(Math.abs(length.fit.k - REPORT.k) / REPORT.k).toBeLessThan(0.01);
  expect(Math.abs(length.fit.n - REPORT.n)).toBeLessThan(0.005);
  const q = runQ();
  expect(Math.abs(q.fit.a - REPORT.qa) / REPORT.qa).toBeLessThan(0.03);
  expect(Math.abs(q.fit.b - REPORT.qb)).toBeLessThan(15);
  expect(calibrate(REPORT.L).T0).toBeGreaterThan(0.9);
});
