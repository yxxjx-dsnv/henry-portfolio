# Simple Pendulum — the lab (digital twin) 

**Date:** 2026-09-10 · **Page:** `/projects/pendulum` · **Status:** built, awaiting owner review

## What it is

`src/components/PendulumLab.tsx` shows the PHY180 rig in 3D (`tools/pendulum/build_pendulum.py`
→ `public/media/pendulum/pendulum.glb`, built from the report's §2.1 dimensions and the photos:
acrylic wrist rest, laptop ballast, protractor at the pivot, orange thread with knots every
50 mm, the 8-ball bob, paper backdrop) swinging to the report's own damped model,
θ'' = −(2π/T₀)² sin θ − (2/τ) θ' (RK4, `src/components/pendulumPhysics.ts`), and re-runs the
four experiments on it with the report's data files laid over (`public/media/pendulum/data/`).

## Calibration — what is fitted, what emerges

| Experiment | Twin input (from the report) | What the twin produces | Report |
|---|---|---|---|
| Period vs angle | T₀ = 0.936 s, τ = 178 s at L = 0.221 | quadratic fit T₀ 0.934, B ≈ 0, **C = 0.068** | 0.936, −0.001, **0.080** |
| Amplitude vs time | same | τ = 177 s, Q = 590 | 178 ± 1, 597 ± 5 |
| Period vs length | T₀(L) = k Lⁿ / bigAngle(0.52), τ(L) from Q(L) | k = 1.94, n = 0.434 | 1.94, 0.433 |
| Q vs length | Q(L) = 1960 L + 202 | a = 1912, b = 204 | 1960 ± 30, 202 ± 5 |

The one honest gap is C: an ideal pendulum's curvature is θ²/16 = 0.0625 plus the quartic
term (≈0.067 over ±1.4 rad); the real rig measured 0.080. The lab says so under the chart —
the residual is the apparatus (pivot alignment, tape), as the report's limitations section
argues. No fudge parameter was added to force it.

## Controls

Experiment tabs (`.asrs-steps`), release-angle slider (angle), length buttons (length, Q),
playback speed 1×/8×/32× (decay and Q default to 16×), orbit/zoom. The chart is inline SVG:
measured points with error bars, the report's fit (dashed), the twin (blue) — hover reads
values; legend always present.

## Verification

`pendulumPhysics.test.ts` (4 tests): calibrated period, textbook large-angle factor,
τ/Q from the envelope, and all four fits within tolerance of the report. Page test image count
12. Browser: rig renders, tabs switch, measured points load from the data files.
