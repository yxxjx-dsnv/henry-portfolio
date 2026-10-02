// The lanyard as rigid bodies. Card -> lobster clasp (ball joint) -> swivel eye
// (spins about y) -> strap fold, the "yoke" (hinges about x). Two straps hang the
// yoke from fixed points above the frame; each strap is a chain of tiny bodies
// tied by rope joints, stiffened with springs that skip one, two and three links,
// which is what makes webbing hold a curve instead of folding like string.
import type RAPIER_NS from '@dimforge/rapier3d-compat';

type Rapier = typeof RAPIER_NS;
type V = { x: number; y: number; z: number };
const v = (x = 0, y = 0, z = 0): V => ({ x, y, z });

export type PhysicsParams = {
  gravity: number;
  mass: number;
  damping: number;
  strapStiffness: number;
  antiTwist: number;
  swivelDamping: number;
};

export const PHYSICS: PhysicsParams = {
  gravity: 9.81,
  mass: 0.72,
  damping: 0.45,
  strapStiffness: 90,
  antiTwist: 2.2,
  swivelDamping: 0.15,
};

// collision groups: upper 16 bits = membership, lower 16 = what it collides with
const G_CARD = (0x1 << 16) | 0x6; // hits straps + wall
const G_STRAP = (0x2 << 16) | 0x5; // hits card + wall
const G_HARDWARE = (0x8 << 16) | 0x4; // wall only
const G_WALL = (0x4 << 16) | 0xb; // everything

export const CARD_REST_Y = 0.15;
export const CARD_HALF = [1.4, 2.22, 0.105] as const;
export const LINKS = 12;

export type Strap = {
  anchor: V;
  attachment: V; // where the strap meets the yoke, in yoke space
  links: RAPIER_NS.RigidBody[];
};

// The straps stretch like a slingshot band: each link may pull out to 1.6x its
// length, the stretch springs are softer (gain) and pre-tensioned (preload) so
// the badge still hangs where it always did and barely bobs at rest. Measured:
// rest y 0.167 (was 0.147), a hard pull reaches y -1.54, a release flies to 1.87.
export const ELASTIC = { slack: 1.6, preload: 0.963, gain: 0.5 };

export function buildLanyard(R: Rapier, p: PhysicsParams, elastic = ELASTIC) {
  const world = new R.World(v(0, -p.gravity, 0));
  world.timestep = 1 / 120;
  world.numSolverIterations = 32;

  // the page itself: the card can swing toward it but never through it
  world.createCollider(R.ColliderDesc.cuboid(50, 50, 0.2).setTranslation(0, 0, -1.2).setCollisionGroups(G_WALL).setFriction(0.4));

  const bodies: { body: RAPIER_NS.RigidBody; at: V }[] = [];
  const box = (at: V, half: readonly [number, number, number], mass: number, damping = 0.5, groups = G_HARDWARE) => {
    const body = world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(at.x, at.y, at.z)
        .setLinearDamping(damping)
        .setAngularDamping(0.6)
        .setCcdEnabled(true)
        .setCanSleep(false),
    );
    const collider = world.createCollider(
      R.ColliderDesc.cuboid(...half).setMass(mass).setCollisionGroups(groups).setFriction(0.45).setRestitution(0),
      body,
    );
    bodies.push({ body, at });
    return { body, collider };
  };

  const card = box(v(0, CARD_REST_Y, 0), CARD_HALF, p.mass, 0.5, G_CARD);
  const clasp = box(v(0, 2.35, 0.03), [0.21, 0.33, 0.13], 0.09).body;
  const eye = box(v(0, 2.79, 0.03), [0.22, 0.21, 0.09], 0.055).body;
  const yoke = box(v(0, 3.08, 0.03), [0.1, 0.22, 0.08], 0.045, 0.5, G_STRAP).body;

  world.createImpulseJoint(R.JointData.spherical(v(0, 2.025, 0.03), v(0, -0.175, 0)), card.body, clasp, true);
  world.createImpulseJoint(R.JointData.revolute(v(0, 0.26, 0), v(0, -0.18, 0), v(0, 1, 0)), clasp, eye, true);
  const fold = world.createImpulseJoint(R.JointData.revolute(v(0, 0.13, 0), v(0, -0.16, 0), v(1, 0, 0)), eye, yoke, true);
  (fold as RAPIER_NS.RevoluteImpulseJoint).setLimits(-1.15, 1.15);

  const straps: Strap[] = [];
  const segments: { collider: RAPIER_NS.Collider; link: number; strap: number }[] = [];
  const segLen: number[] = [];
  const anchors: RAPIER_NS.RigidBody[] = [];
  for (const side of [-1, 1]) {
    const anchor = v(side * 2.6, 9.5, -0.25);
    const attachment = v(0, 0.04, side * 0.061);
    const hook = v(side * 0.015, 0.04, 0);
    const end = v(hook.x, 3.08 + hook.y, 0.03);
    const d = v(end.x - anchor.x, end.y - anchor.y, end.z - anchor.z);
    const seg = Math.hypot(d.x, d.y, d.z) / LINKS;
    const fixed = world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(anchor.x, anchor.y, anchor.z));
    const links: RAPIER_NS.RigidBody[] = [];
    for (let i = 1; i <= LINKS; i++) {
      const at = v(anchor.x + (d.x * i) / LINKS, anchor.y + (d.y * i) / LINKS, anchor.z + (d.z * i) / LINKS);
      const { body, collider } = box(at, [0.025, 0.025, 0.018], 0.0125, 1.6, G_STRAP);
      body.setEnabledRotations(false, false, false, true);
      // each link carries a capsule reaching back to the previous one, so the
      // whole strap is solid against the card, not just its beads
      collider.setShape(new R.Capsule(seg / 2, 0.11));
      segments.push({ collider, link: i - 1, strap: straps.length });
      world.createImpulseJoint(R.JointData.rope(seg * elastic.slack, v(), v()), links[links.length - 1] ?? fixed, body, true);
      links.push(body);
    }
    world.createImpulseJoint(R.JointData.spherical(v(), hook), links[links.length - 1], yoke, true);
    straps.push({ anchor, attachment, links });
    segLen.push(seg);
    anchors.push(fixed);
  }

  const UP = { x: 0, y: 1, z: 0 };
  /** Re-aim each capsule so it spans its link and the one before it. */
  function alignSegments() {
    for (const s of segments) {
      const strap = straps[s.strap];
      const a = strap.links[s.link].translation();
      const b = s.link ? strap.links[s.link - 1].translation() : strap.anchor;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dz = b.z - a.z;
      s.collider.setTranslationWrtParent(v(dx / 2, dy / 2, dz / 2));
      const len = Math.hypot(dx, dy, dz);
      if (len < 1e-5) continue;
      // shortest rotation from +y onto the segment
      const nx = dx / len;
      const ny = dy / len;
      const nz = dz / len;
      const dot = UP.x * nx + UP.y * ny + UP.z * nz;
      if (dot < -0.9999) {
        s.collider.setRotationWrtParent({ x: 1, y: 0, z: 0, w: 0 });
        continue;
      }
      const q = { x: nz, y: 0, z: -nx, w: 1 + dot }; // up x n, 1 + up.n
      const ql = Math.hypot(q.x, q.y, q.z, q.w);
      s.collider.setRotationWrtParent({ x: q.x / ql, y: q.y / ql, z: q.z / ql, w: q.w / ql });
    }
  }
  alignSegments();

  let springs: RAPIER_NS.ImpulseJoint[] = [];
  let builtStiffness = -1;
  function stiffen(k: number) {
    if (k === builtStiffness) return;
    builtStiffness = k;
    springs.forEach((j) => world.removeImpulseJoint(j, true));
    springs = [];
    straps.forEach((s, si) => {
      const chain = [anchors[si], ...s.links];
      for (const skip of [1, 2, 3]) {
        const stiff = k * elastic.gain * (skip === 1 ? 0.6 : skip === 2 ? 1 : 0.45);
        const damp = 1.4 * Math.sqrt(stiff * 0.0125);
        for (let i = skip; i < chain.length; i++) {
          springs.push(world.createImpulseJoint(R.JointData.spring(segLen[si] * skip * elastic.preload, stiff, damp, v(), v()), chain[i - skip], chain[i], true));
        }
      }
    });
  }

  /** Bodies' rotation about world y, from their quaternion. */
  const yaw = (q: { x: number; y: number; z: number; w: number }) =>
    Math.atan2(2 * (q.x * q.z + q.w * q.y), 1 - 2 * (q.x * q.x + q.y * q.y));

  /** Damp the relative spin of two bodies about an axis fixed in `b`. */
  function dampRelative(a: RAPIER_NS.RigidBody, b: RAPIER_NS.RigidBody, local: V, rate: number, inertia: number) {
    const q = b.rotation();
    // rotate `local` by q
    const tx = 2 * (q.y * local.z - q.z * local.y);
    const ty = 2 * (q.z * local.x - q.x * local.z);
    const tz = 2 * (q.x * local.y - q.y * local.x);
    const ax = local.x + q.w * tx + (q.y * tz - q.z * ty);
    const ay = local.y + q.w * ty + (q.z * tx - q.x * tz);
    const az = local.z + q.w * tz + (q.x * ty - q.y * tx);
    const wa = a.angvel();
    const wb = b.angvel();
    const rel = (wa.x - wb.x) * ax + (wa.y - wb.y) * ay + (wa.z - wb.z) * az;
    const k = -rel * inertia * (1 - Math.exp(-rate * 10 * world.timestep));
    a.applyTorqueImpulse(v(ax * k, ay * k, az * k), true);
    b.applyTorqueImpulse(v(-ax * k, -ay * k, -az * k), true);
  }

  function step(params: PhysicsParams, calm: boolean) {
    alignSegments();
    world.gravity = v(0, -params.gravity, 0);
    card.body.setLinearDamping(params.damping + (calm ? 2 : 0));
    card.body.setAngularDamping(params.damping + 0.2 + (calm ? 2 : 0));
    stiffen(params.strapStiffness);

    dampRelative(clasp, eye, v(0, 1, 0), params.swivelDamping, 3.69e-4);
    dampRelative(eye, yoke, v(1, 0, 0), 0.08 + params.swivelDamping * 0.4, 1.99e-4);

    // the yoke wants to face the camera: an implicit spring on its yaw
    const dt = world.timestep;
    const yy = yaw(yoke.rotation());
    const compliance = 0.001;
    const c = 0.12;
    yoke.applyTorqueImpulse(v(0, (-(2 * yy + c * yoke.angvel().y) * dt) / (1 + (c * dt) / compliance + (2 * dt * dt) / compliance), 0), true);

    // and so does the card, harder the further it has turned (it can still spin
    // right round if you flick it; it just always comes home face-forward)
    const cy = yaw(card.body.rotation());
    const k = params.antiTwist;
    if (k) {
      const restoring = -k * cy * (1 + 3 * (Math.abs(cy) / Math.PI) ** 2) - 0.65 * Math.sqrt(k) * card.body.angvel().y;
      card.body.applyTorqueImpulse(v(0, Math.max(-18, Math.min(18, restoring)) * dt, 0), true);
    }
    world.step();
  }

  function reset() {
    for (const { body, at } of bodies) {
      body.setTranslation(at, true);
      body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      body.setLinvel(v(), true);
      body.setAngvel(v(), true);
    }
    alignSegments();
  }

  stiffen(p.strapStiffness);
  return { world, card: card.body, cardCollider: card.collider, clasp, eye, yoke, straps, step, reset };
}

export type Lanyard = ReturnType<typeof buildLanyard>;
