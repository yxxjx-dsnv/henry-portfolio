// The pendulum as a real object, not as the report's curve: a bob of a given size and
// material on a string of a given length and weight, swinging under a given gravity
// through a given fluid, losing energy to the fluid's drag and the pivot's friction.
// Everything a visitor can change is a physical quantity; the few things nobody can
// measure on the bench (where exactly the thread bends at the notch, how much the knot
// and thread add to the drag, how sticky the pivot is) are fitted once to the report's
// own measurements, so the default apparatus swings like the one on the lab day.
// Pure functions: no three.js, no React.

/** A fluid the bob swings through: density (kg/m³) and dynamic viscosity (Pa·s). */
export type Fluid = { rho: number; mu: number };

export const FLUIDS = {
  air: { rho: 1.204, mu: 1.81e-5 }, // 20 °C, sea level
  vacuum: { rho: 0, mu: 0 },
  water: { rho: 998, mu: 1.0e-3 },
} satisfies Record<string, Fluid>;

/** Surface gravity, m/s². Toronto's local value for the lab bench. */
export const GRAVITY = {
  earth: 9.805,
  moon: 1.62,
  mars: 3.71,
  jupiter: 24.79,
} satisfies Record<string, number>;

/** Solid-sphere materials, kg/m³. The lab's own bob is not solid: see BENCH. */
export const MATERIALS = {
  styrofoam: 30,
  wood: 700,
  plastic: 1050,
  aluminium: 2700,
  steel: 7850,
  brass: 8500,
  lead: 11340,
} satisfies Record<string, number>;

export type Setup = {
  stringLength: number; // m, from the pivot to where the thread meets the bob
  stringDensity: number; // kg/m, the thread's own weight per metre
  stringCompliance: number; // m/N, how far the thread stretches per newton of tension
  bobRadius: number; // m
  bobMass: number; // kg
  g: number; // m/s²
  fluid: Fluid;
  pivotFriction: number; // N·m·s, viscous torque per rad/s at the pivot
  theta0: number; // rad, the release angle
  omega0: number; // rad/s, a push on release (0 = let go from rest)
};

/** The apparatus of the report (§2.1): a 70 g hollow metal keychain bob of 2.1 cm radius
 *  on 20.00 cm of cotton thread, pivoting in a notch cut at the protractor's origin. */
export const BENCH: Setup = {
  stringLength: 0.2,
  stringDensity: 0.0002, // ~0.2 g per metre of sewing thread
  stringCompliance: 0.0005, // a cotton thread gives ~0.3 mm under the bob's weight
  bobRadius: 0.021,
  bobMass: 0.07,
  g: GRAVITY.earth,
  fluid: FLUIDS.air,
  pivotFriction: 0, // the bench's own pivot loss is in CAL below; this is for visitors to add
  theta0: 0.52,
  omega0: 0,
};

/**
 * What the bench cannot tell us, fitted to the report (pendulumModel.test.ts checks the
 * default apparatus against the report's T0, τ and Q):
 * - `pivotDrop`: the thread bends a little below the protractor's origin, in the notch,
 *   so the pendulum is 4.8 mm shorter than the ruler says — fitted to T0 = 0.936 s;
 * - `pivotFriction`: the notch's viscous loss — fitted to τ = 178 s at 0.52 rad;
 * - `dragFactor`: the thread and the knot add to a smooth sphere's drag; by estimate only
 *   ~2 %, so it stays 1.
 * What is left unfitted, honestly: the report's Q grows with length faster than any real
 * mix of air drag and pivot friction lets it (the twin agrees within 10 % from 20 cm up and
 * falls well short at 5 cm), and the large-angle curvature C (0.069 here, 0.080 measured).
 */
export type Calibration = { pivotDrop: number; dragFactor: number; pivotFriction: number };
export const CAL: Calibration = {
  pivotDrop: 0.00476,
  dragFactor: 1,
  pivotFriction: 3.02e-5,
};
/** No hidden losses and no notch: the textbook pendulum, for checking the physics. */
export const IDEAL: Calibration = { pivotDrop: 0, dragFactor: 1, pivotFriction: 0 };

const sphereVolume = (r: number) => (4 / 3) * Math.PI * r ** 3;

/** Solid sphere of `material` with radius r. */
export const solidBobMass = (density: number, r: number) => density * sphereVolume(r);

/** Drag coefficient of a sphere at Reynolds number Re (Clift–Gauvin): Stokes at low Re,
 *  ~0.4–0.5 through the range a pendulum bob swings in. */
export function sphereCd(Re: number): number {
  if (Re <= 0) return 0;
  return (24 / Re) * (1 + 0.15 * Re ** 0.687) + 0.42 / (1 + 42500 * Re ** -1.16);
}

/** The constants of the equation of motion for a setup. */
export function dynamics(s: Setup, cal: Calibration = CAL) {
  const r = s.bobRadius;
  const m = s.bobMass;
  const V = sphereVolume(r);
  const rho = s.fluid.rho;
  // pivot to the bob's centre: the thread (shortened at the notch, stretched by the
  // bob's weight) plus the radius
  const ls = Math.max(0.005, s.stringLength - cal.pivotDrop + s.stringCompliance * m * s.g);
  const L = ls + r;
  const ms = s.stringDensity * ls;
  // moment of inertia about the pivot: the bob (a sphere, not a point), the thread (a
  // rod), and the fluid the bob drags along with it (added mass, half its volume)
  const I = m * (L * L + 0.4 * r * r) + (ms * ls * ls) / 3 + 0.5 * rho * V * L * L;
  // gravity's torque arm, net of buoyancy on the bob
  const grav = s.g * (m * L + (ms * ls) / 2 - rho * V * L);
  return {
    L,
    I,
    grav,
    area: Math.PI * r * r,
    diameter: 2 * r,
    rho,
    mu: s.fluid.mu,
    pivot: cal.pivotFriction + s.pivotFriction,
    drag: cal.dragFactor,
  };
}

/** The small-angle period of a setup, with no losses: 2π √(I / (m g d)). */
export function smallAnglePeriod(s: Setup, cal: Calibration = CAL): number {
  const d = dynamics(s, cal);
  return d.grav > 0 ? 2 * Math.PI * Math.sqrt(d.I / d.grav) : Infinity;
}

export type Motion = { dt: number; theta: Float32Array; omega: Float32Array; L: number };

/** θ(t) for a setup from release, integrated with RK4 to `seconds`. The step is a fixed
 *  fraction of the period, so short and long pendulums are integrated equally well. */
export function swing(s: Setup, seconds: number, cal: Calibration = CAL): Motion {
  const d = dynamics(s, cal);
  const T = smallAnglePeriod(s, cal);
  const dt = Number.isFinite(T) ? Math.min(1 / 240, T / 400) : 1 / 240;
  const n = Math.max(2, Math.round(seconds / dt) + 1);
  const theta = new Float32Array(n);
  const omega = new Float32Array(n);
  const accel = (th: number, om: number) => {
    const v = d.L * om; // the bob's speed
    let drag = 0;
    if (d.rho > 0 && v !== 0) {
      const Re = (d.rho * Math.abs(v) * d.diameter) / d.mu;
      drag = 0.5 * d.rho * sphereCd(Re) * d.drag * d.area * v * Math.abs(v); // N, along the swing
    }
    return (-d.grav * Math.sin(th) - d.L * drag - d.pivot * om) / d.I;
  };
  let th = s.theta0;
  let om = s.omega0;
  for (let i = 0; i < n; i++) {
    theta[i] = th;
    omega[i] = om;
    const a1 = accel(th, om);
    const a2 = accel(th + (dt / 2) * om, om + (dt / 2) * a1);
    const a3 = accel(th + (dt / 2) * (om + (dt / 2) * a1), om + (dt / 2) * a2);
    const a4 = accel(th + dt * (om + (dt / 2) * a2), om + dt * a3);
    th += (dt / 6) * (om + 2 * (om + (dt / 2) * a1) + 2 * (om + (dt / 2) * a2) + (om + dt * a3));
    om += (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
  }
  return { dt, theta, omega, L: d.L };
}

/** θ at time t, linearly interpolated. */
export function thetaAt(m: Motion, t: number): number {
  const f = t / m.dt;
  const i = Math.max(0, Math.min(m.theta.length - 2, Math.floor(f)));
  const u = Math.max(0, Math.min(1, f - i));
  return m.theta[i] + (m.theta[i + 1] - m.theta[i]) * u;
}
