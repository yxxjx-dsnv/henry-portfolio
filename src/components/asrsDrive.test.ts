import { act, startDrive, stepDrive, toGrid, type Dir, type Drive } from './asrsDrive';

const RIG = { lo: -1, hi: 2, speed: 1, clamp: 0.47, attach: 0.45 };
const E: Dir = [1, 0];
const S: Dir = [0, 1];
const W: Dir = [-1, 0];

// a long frame eases grip and lift all the way, so each step of a sequence finishes
const settle = (s: Drive) => {
  for (let i = 0; i < 10; i++) stepDrive(s, null, 1);
};
const onLane = (s: Drive) => Number.isInteger(s.x) || Number.isInteger(s.z);

test('up is away from the viewer, snapped to the nearer grid axis', () => {
  // looking down -z
  expect(toGrid('up', 0, -1)).toEqual([0, -1]);
  expect(toGrid('right', 0, -1)).toEqual([1, 0]);
  expect(toGrid('down', 0, -1)).toEqual([0, 1]);
  expect(toGrid('left', 0, -1)).toEqual([-1, 0]);
  // a three-quarter view snaps to whichever axis it is closer to
  expect(toGrid('up', 0.9, -0.3)).toEqual([1, 0]);
  expect(toGrid('right', 0.9, -0.3)).toEqual([0, 1]);
});

test('it runs the lanes, and a sideways press waits for the next centre', () => {
  const s = startDrive(RIG, [0, 0], [2, 2]);
  stepDrive(s, E, 0.4);
  expect([s.x, s.z]).toEqual([0.4, 0]);
  stepDrive(s, S, 0.1); // pressed mid-lane: keeps going east
  expect(s.z).toBe(0);
  expect(s.x).toBeCloseTo(0.5);
  for (let i = 0; i < 40; i++) {
    stepDrive(s, null, 0.05); // let go: it still takes the turn it was given
    expect(onLane(s)).toBe(true);
  }
  expect([s.x, s.z]).toEqual([1, 1]);
});

test('let go mid-lane, it finishes on the next centre; back the way it came is allowed', () => {
  const s = startDrive(RIG, [0, 0], [2, 2]);
  stepDrive(s, E, 0.3);
  stepDrive(s, null, 5);
  expect([s.x, s.z]).toEqual([1, 0]);
  stepDrive(s, E, 0.3);
  stepDrive(s, W, 0.1);
  expect(s.x).toBeCloseTo(1.2);
  stepDrive(s, null, 5);
  expect([s.x, s.z]).toEqual([1, 0]);
});

test('it stays on the patch', () => {
  const s = startDrive(RIG, [0, 0], [2, 2]);
  for (let i = 0; i < 100; i++) stepDrive(s, E, 0.1);
  expect([s.x, s.z]).toEqual([2, 0]);
  for (let i = 0; i < 100; i++) stepDrive(s, W, 0.1);
  expect([s.x, s.z]).toEqual([-1, 0]);
});

test('spread and lift act only stopped on a centre', () => {
  const s = startDrive(RIG, [0, 0], [2, 2]);
  stepDrive(s, E, 0.5);
  act(s, 'grip');
  act(s, 'lift');
  expect([s.gripTo, s.liftTo]).toEqual([0, 0]);
  stepDrive(s, null, 5);
  act(s, 'grip');
  expect(s.gripTo).toBe(1);
});

test('pick up: centred under the bin, spread, lift, clamp; set down: over any cradle, spread, lower', () => {
  const s = startDrive(RIG, [1, 1], [0, 0]);
  stepDrive(s, W, 1);
  stepDrive(s, [0, -1], 1);
  expect([s.x, s.z]).toEqual([0, 0]);
  expect(act(s, 'lift')).toMatch(/spread/); // tabs in: the deck would meet the bin
  act(s, 'grip');
  settle(s);
  act(s, 'lift');
  settle(s);
  expect(s.carried).toBe(true);
  // spread, it won't drive off with the bin loose on the deck
  expect(stepDrive(s, E, 0.5)).toMatch(/lock/);
  expect([s.x, s.z]).toEqual([0, 0]);
  act(s, 'grip');
  expect(s.gripTo).toBe(RIG.clamp);
  settle(s);
  stepDrive(s, E, 1);
  stepDrive(s, null, 1);
  expect([s.x, s.z, s.carried]).toEqual([1, 0, true]);
  expect(act(s, 'lift')).toMatch(/spread/); // clamped, it won't lower through the arms
  act(s, 'grip');
  settle(s);
  act(s, 'lift');
  settle(s);
  expect(s.carried).toBe(false);
  expect([s.bx, s.bz]).toEqual([1, 0]);
});

test('empty, it passes under a stored bin with the deck down, not with it up', () => {
  const s = startDrive(RIG, [-1, 0], [0, 0]);
  act(s, 'lift');
  settle(s);
  expect(stepDrive(s, E, 0.5)).toMatch(/lower/);
  expect([s.x, s.z]).toEqual([-1, 0]);
  act(s, 'lift');
  settle(s);
  stepDrive(s, E, 1.5);
  stepDrive(s, null, 1);
  expect([s.x, s.z]).toEqual([1, 0]);
  expect(s.carried).toBe(false);
});

test('a press during a lift waits for it, then goes', () => {
  const s = startDrive(RIG, [0, 0], [2, 2]);
  act(s, 'lift');
  stepDrive(s, E, 0.05); // tapped while the deck is still rising
  expect([s.x, s.z]).toEqual([0, 0]);
  settle(s);
  expect([s.x, s.z]).toEqual([1, 0]);
  // and an action pressed while the last one runs goes next
  act(s, 'grip');
  act(s, 'lift');
  expect(s.liftTo).toBe(1);
  stepDrive(s, null, 0.05);
  expect(s.liftTo).toBe(1);
  settle(s);
  expect([s.gripTo, s.liftTo]).toEqual([1, 0]);
});
