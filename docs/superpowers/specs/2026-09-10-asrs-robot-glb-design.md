# ASRS robot — Blender-built GLB replaces the procedural three.js robot

**Date:** 2026-09-10 · **Page:** `/projects/incheon-robotics` · **Status:** draft for owner review

## Why

The robot in the three 3D embeds (`AsrsRobotInspector`, `AsrsRobotViewer`, `AsrsSim`) is
built from three.js primitives in `src/components/asrsScene.ts`. It reads as a sketch, not the
machine: wrong wheel size and no mecanum rollers, a 266 mm lift where the real stroke is 50 mm,
scissor bars that poke through the deck when folded, and the short-axis guides that overhang
the plate when closed (one `TAB_IN` for both axes). Photos of the latest build and the
company's own robot description give exact dimensions, so the model is rebuilt to them.

## Sources (local only — never committed)

- Owner's photo of the current build (`image.png`, repo root, untracked) — the visual truth for
  finish, colours, wheels, panel, brackets.
- Company ROS package `io_description` (URDF + STL) in the owner's Work folder: body tray,
  lifter plate, two gripper brackets, a plain wheel drum. Gives the bounding dimensions,
  wheel positions, lift and gripper strokes. The STL meshes are used as the base geometry of the
  tray, plate and brackets (owner's decision, 2026-09-10). The published GLB therefore carries
  company-derived geometry → **flag for CEO approval before deploy**, alongside the CAD renders.
- The CAD renders already in `public/media/incheon-robotics/` (r-*.jpg, ghost-*.jpg) for the
  internals: scissor, linear rails, hub cam links, motors.

## The machine (metres, robot frame: X long axis, Y up, Z short axis; origin on the floor at centre)

| Part | Dimension / position |
|---|---|
| Body tray (sheet metal) | 0.4906 × 0.332, floor 3 mm up, 45 mm tall; corner wheel bays 78 mm (X) × 46 mm (Z) |
| Wheels | mecanum Ø0.060 × 0.046, centres X ±0.205, Z ±0.148, axle along Z; 10 rubber rollers at 45°, two lobed steel hub plates with 10 screws |
| Lifter plate | 0.4577 × 0.332 × 0.002, top at 0.0495 (down) → 0.0995 (up); corner notches; 4 slots; hub bore Ø0.125 |
| Hub disc | blue anodized Ø0.120 × 0.006 in the bore, 4 screws + centre boss; rotates ≈100° between closed and open |
| Grippers (4 L-brackets, black) | 80 mm wide, 2 mm sheet, lip 24 mm tall; long-axis pair blade 0.0646→0.2288, short-axis pair 0.0646→0.166; **closed = lip flush with plate edge; stroke 0.080 outward** |
| Cam links | 4 curved links, hub pin radius 0.055, link length 0.120 → crank-slider gives the 80 mm stroke over ≈100° of hub turn |
| Linear rails | MGN9-style rail + carriage under each gripper blade (rail on plate underside) |
| Scissor | two X-linkages (Z ±0.11), flat bars 0.36 × 0.016 × 0.003, body pivot at X −0.16, deck pivot above it, sliders on rails at the free ends, lead-screw actuator between the sliders |
| Drive | 4 in-line gearmotors Ø0.024 × 0.060 inboard of each wheel |
| Front (−Z) long side | 2 rocker switches at X −0.015/+0.010, power button at X +0.045 with green LED ring |
| Electronics | control PCB (green, 0.06 × 0.04) beside the hub motor; hub motor block 0.04 × 0.04 × 0.03 under the disc |

Finish: plate brushed/anodized aluminium; tray, brackets, switches matte black; disc blue
anodized; rollers black rubber; hubs, screws, rails, pins bare steel; PCB green.

## Design

### 1. Build script — `tools/robot/build_robot.py` (Blender 5, headless)

```
/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/robot/build_robot.py -- \
    --meshes "$IO_MESHES" --out public/media/incheon-robotics/robot.glb --preview /tmp/robot-preview
```

- Reads `tools/robot/dims.json` (the table above as numbers) — the single source of truth
  shared with the TypeScript kinematics.
- Imports the four STLs (tray, plate, long/short bracket) from `--meshes`; everything else is
  built parametrically with bpy (cylinders, curves, booleans, bevels, solidify).
- Names the rig nodes exactly: `Body`, `Deck`, `Hub`, `Tab_F`, `Tab_B`, `Tab_L`, `Tab_R`,
  `Link_F/B/L/R`, `Scissor_A_L/R` (child of Body, origin at the body pivot),
  `Scissor_B_L/R` (child of Deck, origin at the deck pivot), `Slider_A_L/R`, `Slider_B_L/R`,
  `Wheel_FL/FR/RL/RR` (origin at axle centre). Everything else is a child of `Body` or `Deck`.
- Custom property `xray = "shell"` on the tray, plate and brackets → exported as glTF extras.
- Exports GLB with Draco (level 6), `export_apply`, extras on, no lights/cameras. Target ≤ 2 MB.
- With `--preview`, renders review images (EEVEE): the photo angle, plan view, the underside,
  and a wheel close-up, in closed/down and open/up poses.

### 2. Runtime — `src/components/asrsRobot.ts`

- `loadRobotAsset(THREE)` → cached promise: `GLTFLoader` + `DRACOLoader('/draco/')`, parses
  `/media/incheon-robotics/robot.glb` once per page.
- `makeRobot(THREE, asset)` → clones the scene (`scene.clone(true)`), clones materials per robot
  (for X-ray), resolves the rig nodes by name, and returns the existing `Robot` API:
  `{ group, setLift(t), setGrip(t, spin), roll(dx, dz), setXray(on), dispose }`.
  `spin` is ignored (the hub angle is derived from `t` so the links stay pinned).
- Pure kinematics (exported, unit-tested):
  - `liftPose(t)` → `{ deckY, theta }`: deck rises 0.05 on an ease curve; θ = asin(rise / L).
  - `gripPose(t)` → `{ hubAngle, pinDistance }`: hub angle interpolates closed→open, pin distance
    from the crank-slider `d(φ) = r cos φ + √(ℓ² − r² sin² φ)`; closed angle solved once by
    bisection so `d(closed)` = blade tip flush with the plate edge for each axis.
  - `wheelTurn(dx, dz, sign)` → radians, using the real 0.03 radius.
- `asrsScene.ts` loses `makeRobot` and the robot-only kit entries (hub/flange/bolt/roller/disc/
  pin geometries, deck/disc textures). Bins, cradles, decks, elevator, kiosk stay.

### 3. World constants (numbers only; warehouse visuals are phase 2)

`WHEEL_R 0.03 · DECK_REST 0.0495 · DECK_LIFT 0.0995 · CRADLE_H 0.088 · LEVEL_H 0.408`.
Cradle posts span the level (`LEVEL_H`) with the arms at `CRADLE_H`, matching the lab photo,
instead of ending at the arms. The fleet's `attach` fraction derives from these as before.

### 4. Viewers

All three await `loadRobotAsset` next to their dynamic `three` imports and build robots with the
new `makeRobot`. Figcaptions that claim "no mesh files" are rewritten. Posters unchanged.
`AsrsRobotViewer`'s stage notes keep their wording except numbers that change (lift height).

### 5. Verification

- `npm test`: new `asrsRobot.test.ts` — closed tabs flush on both axes, 80 mm stroke, scissor
  bars below the plate underside when down, 50 mm rise when up; fleet tests still green.
- `tsc --noEmit && vite build` clean; GLB ≤ 2 MB.
- Blender preview renders compared with `image.png` and `r-3.jpg` (plan) — sent to the owner.
- Browser check on `?3d`: inspector (spin, deck, tabs, x-ray), cycle viewer through all stages,
  fleet sim running — no bars through the deck, no overhang when closed, bins land on the arms.

## Out of scope (phase 2)

Tiles at the real 672 × 472 pitch, posts/arms/bins/elevator/kiosk from the company GLBs,
the picking-station geometry, and the story text of the cycle viewer.
