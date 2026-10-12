// "Drive it yourself" for the mechanism viewer: the robot under the visitor's keys, held to
// the real machine's rules. It never turns: it runs the guide lines through the cell centres
// and changes lane only on a centre (a sideways press waits for the next one). It spreads and
// lifts only when stopped on a centre, one thing at a time, and the bin changes hands exactly
// as in the cycle. Positions are in cells (× PITCH for metres); no three.js here.

export type Dir = readonly [number, number]; // one cell step on the grid: [dx, dz]
export type Screen = 'up' | 'down' | 'left' | 'right';

export type Rig = {
  lo: number; // the patch, in cells, the same on both axes
  hi: number;
  speed: number; // cells per second
  clamp: number; // grip fraction where the tabs meet the bin's sides
  attach: number; // lift fraction where the deck reaches a stored bin's underside
};

export type Drive = {
  rig: Rig;
  x: number; // the robot, always on a lane: x or z is whole
  z: number;
  tx: number; // the centre it is heading for (= x, z when stopped)
  tz: number;
  turn: Dir | null; // a press it could not take yet, kept for the next centre
  next: 'grip' | 'lift' | null; // an action pressed while the last one was still running
  grip: number; // eased, and where it is heading
  gripTo: number;
  lift: number;
  liftTo: number;
  carried: boolean;
  bx: number; // the bin's cell while it sits on a cradle
  bz: number;
};

// a move or an action waits until the last one has nearly finished — near enough that the
// handoff (grip past 0.9, deck past the cradle) has already happened
const NEAR = 0.08;

export const startDrive = (rig: Rig, at: Dir, bin: Dir): Drive => ({
  rig,
  x: at[0],
  z: at[1],
  tx: at[0],
  tz: at[1],
  turn: null,
  next: null,
  grip: 0,
  gripTo: 0,
  lift: 0,
  liftTo: 0,
  carried: false,
  bx: bin[0],
  bz: bin[1],
});

/** A screen direction as a grid step: "up" is away from the viewer, snapped to the nearer axis. */
export function toGrid(key: Screen, fx: number, fz: number): Dir {
  const f: Dir = Math.abs(fx) >= Math.abs(fz) ? [fx < 0 ? -1 : 1, 0] : [0, fz < 0 ? -1 : 1];
  const back = (d: Dir): Dir => [0 - d[0], 0 - d[1]]; // 0 - x, not -x: no -0 in a step
  const right: Dir = [0 - f[1], f[0]]; // three.js is y-up, so screen right is forward × up
  if (key === 'up') return f;
  if (key === 'down') return back(f);
  return key === 'right' ? right : back(right);
}

const stopped = (s: Drive) => s.x === s.tx && s.z === s.tz;
const busy = (s: Drive) => Math.abs(s.grip - s.gripTo) > NEAR || Math.abs(s.lift - s.liftTo) > NEAR;
const inside = (s: Drive, d: Dir) =>
  Math.min(s.x + d[0], s.z + d[1]) >= s.rig.lo && Math.max(s.x + d[0], s.z + d[1]) <= s.rig.hi;

/** Why the robot can't take this step from the centre it is on, if it can't. */
function refuse(s: Drive, d: Dir): string | null {
  if (s.carried && s.gripTo === 1) return 'lock the bin first (E / B)';
  if (!s.carried && s.liftTo === 1 && s.x + d[0] === s.bx && s.z + d[1] === s.bz)
    return 'lower the deck to pass under the bin (F / A)';
  return null;
}

/**
 * One frame: ease the mechanism, drive toward `want` (a grid step held down, or null), and
 * hand the bin over. Returns a hint when a move is refused.
 */
export function stepDrive(s: Drive, want: Dir | null, dt: number): string | null {
  s.grip += (s.gripTo - s.grip) * Math.min(1, dt * 1.6);
  s.lift += (s.liftTo - s.lift) * Math.min(1, dt * 1.5);
  let hint: string | null = null;
  if (s.next && stopped(s) && !busy(s)) {
    hint = act(s, s.next);
    s.next = null;
  }
  let left = s.rig.speed * dt;
  for (let guard = 0; left > 0 && guard < 8; guard++) {
    const dx = s.tx - s.x;
    const dz = s.tz - s.z;
    if (!dx && !dz) {
      // on a centre: a kept turn first, then whatever is held
      const go = [s.turn, want].find((d) => d && inside(s, d)) ?? null;
      s.turn = null;
      if (!go) break;
      if (busy(s)) {
        s.turn = go; // the press waits for the mechanism
        break;
      }
      const no = refuse(s, go); // keeps a queued action's refusal when the move goes ahead
      if (no) {
        hint = no;
        break;
      }
      s.tx += go[0];
      s.tz += go[1];
      continue;
    }
    if (want) {
      const dot = want[0] * dx + want[1] * dz;
      if (dot === 0) s.turn = want; // sideways: only at the next centre
      else if (dot < 0) {
        s.tx -= Math.sign(dx); // straight back along the same lane is allowed
        s.tz -= Math.sign(dz);
        continue;
      }
    }
    const d = Math.abs(dx) + Math.abs(dz);
    if (left >= d) {
      s.x = s.tx;
      s.z = s.tz;
      left -= d;
    } else {
      s.x += Math.sign(dx) * left;
      s.z += Math.sign(dz) * left;
      left = 0;
    }
  }

  // the handoff matches the cycle: onto the deck when spread and the deck reaches the bin,
  // onto whichever cradle it is over when spread again with the deck back below the arms
  if (stopped(s)) {
    if (!s.carried && s.x === s.bx && s.z === s.bz && s.grip > 0.9 && s.lift >= s.rig.attach) s.carried = true;
    else if (s.carried && s.grip > 0.9 && s.lift < s.rig.attach) {
      s.carried = false;
      s.bx = s.x;
      s.bz = s.z;
    }
  }
  return hint;
}

/**
 * E/B spreads or grips, F/A lifts or lowers — only stopped on a centre; pressed while the
 * robot rolls or the last action is still running, it goes next. Returns a hint when refused.
 */
export function act(s: Drive, what: 'grip' | 'lift'): string | null {
  if (!stopped(s) || busy(s)) {
    s.next = what;
    return null;
  }
  if (what === 'grip') {
    // out ↔ in; with a bin on the raised deck, out ↔ clamped on its sides
    s.gripTo = s.gripTo !== 1 ? 1 : s.carried ? s.rig.clamp : 0;
  } else if (s.liftTo === 0) {
    // tabs in, the deck would meet the bin's underside with them
    if (!s.carried && s.x === s.bx && s.z === s.bz && s.gripTo !== 1) return 'spread the tabs first (E / B)';
    s.liftTo = 1;
  } else {
    // clamped, the bin would ride down through the cradle arms
    if (s.carried && s.gripTo !== 1) return 'spread the tabs to set it down (E / B)';
    s.liftTo = 0;
  }
  return null;
}
