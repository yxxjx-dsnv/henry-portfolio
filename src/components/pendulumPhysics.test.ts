import { bigAngle, fitExp, fitLinear, fitPower, fitQuadratic, gauss } from './pendulumPhysics';

test('the report’s fits give back the curves they are fed', () => {
  const xs = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3];
  const lin = fitLinear(xs, xs.map((x) => 1960 * x + 202));
  expect(lin.a).toBeCloseTo(1960, 6);
  expect(lin.b).toBeCloseTo(202, 6);
  const [c0, c1, c2] = fitQuadratic(xs, xs.map((x) => 0.936 - 0.001 * x + 0.075 * x * x));
  expect([c0, c1, c2].map((c) => +c.toFixed(6))).toEqual([0.936, -0.001, 0.075]);
  const pow = fitPower(xs, xs.map((x) => 1.94 * x ** 0.433));
  expect(pow.k).toBeCloseTo(1.94, 6);
  expect(pow.n).toBeCloseTo(0.433, 6);
  const ts = [0, 20, 40, 60, 80];
  const exp = fitExp(ts, ts.map((t) => 0.52 * Math.exp(-t / 178)));
  expect(exp.A).toBeCloseTo(0.52, 6);
  expect(exp.tau).toBeCloseTo(178, 3);
});

test('a wide swing runs long by the textbook factor, and the scatter is a standard normal', () => {
  expect(bigAngle(0)).toBe(1);
  expect(bigAngle(Math.PI / 2)).toBeCloseTo(1.18034, 2); // exactly 2K(sin 45°)/π; the series is good to 0.1 %
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const draws = Array.from({ length: 20000 }, () => gauss(rng));
  const mean = draws.reduce((s, v) => s + v, 0) / draws.length;
  const sd = Math.sqrt(draws.reduce((s, v) => s + (v - mean) ** 2, 0) / draws.length);
  expect(Math.abs(mean)).toBeLessThan(0.03);
  expect(Math.abs(sd - 1)).toBeLessThan(0.03);
});
