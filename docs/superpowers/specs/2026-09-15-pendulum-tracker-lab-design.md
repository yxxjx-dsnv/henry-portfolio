# Simple Pendulum — the lab as Tracker ran it

**Date:** 2026-09-15 · **Page:** `/projects/pendulum` · **Status:** built · supersedes the
"digital twin" section of `2026-09-10-pendulum-lab-design.md` (physics and calibration there
still hold).

## What the owner asked for

The simulation should *perform* the experiments the report describes, not just show their
fitted curves, and it should look like the Tracker session that read the real video: the
pendulum, the live x(t)/y(t) plots and the frame table moving together. Origin calibration
and Tracker's menus are not wanted. The rig itself is to be modelled in Blender in detail
first, from the report's §2.1 and the photographs.

## The rig (`tools/pendulum/build_pendulum.py`, on `tools/blendkit.py`)

Modelled in mm, baked to metres: the oak hutch (shelf slab with a rounded front, the board
under it, wallpaper above, the desk and its black mat), the frosted acrylic wrist rest
(97 × 284 × 15) lying lengthwise out over the shelf edge, as in the photographs, with the
thread wound round it three times and dropping through the notch at its top-front edge —
that edge is the pivot and the protractor's origin — the MacBook on it as ballast (a rounded
slab with the lid/base seam and the Apple mark on its lid; its back edge down on the shelf,
so it tilts), a clear 10 cm protractor taped to the rest's 97 mm front face with a printed scale (ticks every degree, numerals
0–180 as Blender text converted to mesh), an A3 sheet of lined paper taped under the shelf,
the orange thread with knots every 50 mm, and the 8-ball keychain (white circle, "8",
eyelet and ring). Rig nodes `Arm` / `Thread` / `Bob` are unchanged, so three.js drives it
as before. Textures are numpy (oak streaks, wallpaper, lined pad, mat, the tick band).
`pendulum.glb` ≈ 540 KB (six JPEG textures, the lid among them); the `.blend` sits in `_media-originals/pendulum/`.

## The window (`src/components/PendulumLab.tsx`)

Laid out like the Tracker session but in the site's own type and theme (Libre Baskerville,
light and dark): a header (Tracker · mass A · frame and time · play/pause · 1×/8×/32×), the 3D
rig as the video with the purple axes through the pivot and red step marks on the bob's
path, and beside it `x(t)` and `y(t)` drawn on canvases in the page's colours with a readout
under each, then the frame table (t, x, y, θ) at 30 fps — the rate the report's decay video
was tracked at — scrolling with the latest row highlighted. x and y are the bob relative to
the pivot, θ = atan2(x, −y). A rad/deg toggle sets the unit for θ, the release slider, the
trial labels and the angle graph's axis; the fits stay in radians. Below it the experiment
tabs, Run / finish now / clear, the manual release controls, and the result chart.

## The experiments (`src/components/pendulumExperiments.ts`, pure)

Each is a list of trials the twin plays one after another; a trial's tracked frames are
measured the way the report measured them (periods from interpolated zero crossings of x,
amplitude envelopes from the positive peaks), and the report's fit runs over the points so far.

| Experiment | Trials | Measurement | Fit |
|---|---|---|---|
| Lab 1 · Period vs angle | ±10°…±80° in 10° steps at 0.221 m, 4 s each | period | T = T₀(1 + Bθ + Cθ²) |
| Lab 1 · Amplitude vs time | +30° at 0.221 m, tracked 200 s | envelope | θ₀e^(−t/τ), Q = πτ/T, and the Q/4 swing count Q = 4N |
| Lab 2 · Period vs length | 0.05…0.30 m at +30°, 6 s each | period | T = kLⁿ |
| Lab 2 · Q vs length | the six lengths, tracked 200 s each | Q from the envelope fit | Q = aL + b |

Every release carries a lab day's scatter (`prepare`, `JITTER`): the hand at a 1° protractor
(σ 0.7°) and a nudge on release (σ 0.03 rad/s), the knot a hair off (σ 0.5 mm, the period
following √L), the air and the pivot damping differently (σ 1.5 % on τ), and the autotracker's
sub-pixel jitter on every frame (σ 0.4 mm). So no two runs give the same numbers — the owner
asked for this in place of a fixed answer — while the fits stay inside the report's error bars
(the seeded test checks T₀ within 0.006 s, C between 0.05 and 0.09, Q at 0.221 m within 40).
`prepare(trial, null)` is the ideal release, used for the exact-reference tests.

**First visit.** The lab runs Lab 1 by itself at 8× as soon as the rig is up, with a banner
saying what is happening and, once done, what the points are; a status pill on the video names
the experiment, the trial and the last measurement; each tab's blurb replaces the progress
line when idle, and a finished run invites another lab day.

`completeExperiment` runs the remaining trials without playing them ("finish now") and is
what the tests exercise (ideal releases): the twin lands on T₀ 0.934 s, C 0.069, τ 177 s, Q 590 (count 592),
k 1.94, n 0.434, a 1912, b 204 against the report's 0.936, 0.080, 178, 597 (592), 1.94, 0.433,
1960, 202. The C gap is the same honest one as before.

## Verification

`pendulumExperiments.test.ts` (4) and `pendulumPhysics.test.ts` (4); the page test unchanged
(12 images). Browser: the window fills at 30 fps, Lab 1 completes in 8 s at 8× with 16
points and the fit, the decay's note reads τ 177 / Q 590 / N 148, Q vs length via finish
now; the layout stacks at phone width without horizontal scroll.
