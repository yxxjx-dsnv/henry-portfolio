import { readFileSync } from 'node:fs';
import dims from '../../tools/robot/dims.json';
import { liftPose, liftFraction, gripPose, crankPin, TABS, WHEELS } from './asrsRobot';

const { gripper: G, scissor: S } = dims;

test('tabs are flush when closed and run out the full stroke when open', () => {
  expect(gripPose(0).slide.long).toBe(0);
  expect(gripPose(0).slide.short).toBe(0);
  expect(Math.abs(gripPose(1).slide.long - G.long.stroke)).toBeLessThan(0.0005);
  expect(Math.abs(gripPose(1).slide.short - G.short.stroke)).toBeLessThan(0.0005);
});

test('the deck rises the real 50 mm', () => {
  expect(liftPose(0).rise).toBe(0);
  expect(liftPose(1).rise).toBeCloseTo(dims.deck.stroke, 10);
});

test('the folded scissor stays under the plate', () => {
  const top = S.body_pivot_z + S.bar_length * Math.sin(liftPose(0).theta) + S.bar_height / 2;
  expect(top).toBeLessThan(dims.deck.plate_bottom_z);
});

test('hub pin to slot pin is always one link long', () => {
  for (const [axis, u] of [
    ['long', { x: 1, z: 0 }],
    ['short', { x: 0, z: -1 }],
  ] as const) {
    for (const t of [0, 1]) {
      const { hubAngle, slide } = gripPose(t);
      const pin = crankPin(axis, hubAngle, u);
      const d = G[axis].pin_closed + slide[axis];
      const len = Math.hypot(u.x * d - pin.x, u.z * d - pin.z);
      expect(Math.abs(len - G[axis].link_l)).toBeLessThan(2e-4);
    }
  }
});

test('liftFraction inverts the lift curve', () => {
  for (const rise of [0, 0.0125, 0.0385, dims.deck.stroke])
    expect(liftPose(liftFraction(rise)).rise).toBeCloseTo(rise, 9);
});

// The shipped GLB must agree with the kinematics table: same rig node names,
// links hanging from the closed hub pins, wheels on their axles.
test('robot.glb rig matches the kinematics table', () => {
  const buf = readFileSync('public/media/incheon-robotics/robot.glb') // vitest runs at the repo root;
  const len = buf.readUInt32LE(12); // JSON chunk length; chunk data starts at byte 20
  const gltf = JSON.parse(buf.subarray(20, 20 + len).toString()) as {
    nodes: Array<{ name: string; translation?: number[]; extras?: { xray?: string } }>;
  };
  const byName = (name: string) => {
    const hits = gltf.nodes.filter((n) => n.name === name);
    expect(hits, name).toHaveLength(1);
    return hits[0];
  };
  const rig = ['Robot', 'Body', 'Deck', 'Hub', 'Scissor_A_L', 'Scissor_A_R', 'Scissor_B_L', 'Scissor_B_R'];
  for (const t of TABS) rig.push(`Tab_${t.name}`, `Link_${t.name}`);
  for (const w of WHEELS) rig.push(`Wheel_${w.name}`);
  for (const name of rig) byName(name);
  expect(gltf.nodes.filter((n) => n.extras?.xray === 'shell')).toHaveLength(7);

  const CLOSED = (G.hub_angle_closed_deg * Math.PI) / 180;
  for (const t of TABS) {
    const pin = crankPin(t.axis, CLOSED, t.u);
    const [x, , z] = byName(`Link_${t.name}`).translation ?? [0, 0, 0];
    expect(Math.hypot(x - pin.x, z - pin.z), `Link_${t.name}`).toBeLessThan(1e-3);
  }
  for (const w of WHEELS) {
    const [x, y, z] = byName(`Wheel_${w.name}`).translation ?? [0, 0, 0];
    expect([x, y, z]).toEqual([
      expect.closeTo(w.sx * dims.wheel.x, 5),
      expect.closeTo(dims.wheel.radius, 5),
      expect.closeTo(w.sz * dims.wheel.y, 5),
    ]);
  }
});
