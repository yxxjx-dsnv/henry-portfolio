# Holy Bridge — Bridge Studio (explode/assemble viewer) 

**Date:** 2026-09-10 · **Page:** `/projects/civ102-bridge` · **Status:** built 2026-09-10 (studio + test day), awaiting owner review

## Why

The page's 3D embed is a 12-box single-colour girder behind a poster that is a CAD
cross-section — a visitor cannot tell what it is. Replace it with a coloured, part-accurate
model built from the engineering assembly, shown in a studio viewer whose slider takes the
bridge from assembled to laid-flat on the one matboard sheet it was cut from (the
model-x-studio explode idea, adapted to the real cutting plan).

## Sources

`public/media/civ102-bridge/engineering-assembly.pdf` (cutting plan p.1, cross-section p.2,
top/side/bottom + splice drawings p.3), the construction photos, and the story text in
`src/pages/HolyBridge.tsx` (failure at the top-flange splice, 133 N). Reference UI:
model-x-studio (explode slider with damping, camera pull-back on smoothstep(e, 0.4, 1)).

## Geometry (mm; X along the span 0→1256, Y across, Z up, soffit underside at Z = 0; t = 1.27)

| Piece(s) | Size / placement |
|---|---|
| Soffit_A / Soffit_B | 100 wide, X 0–1016 / 1016–1256, Z 0–t |
| Web_R_A/B, Web_L_A/B/C | 77.5 tall × t, outer faces at Y ±50, Z t–78.77; splices staggered — the near (−Y, camera-side) web glued at X 1016, the far (+Y) web glued at X 240 and torn at 1016 on test day (a shared jagged edge, no bevel, so it reads as one strip until the break) |
| Top_A / Top_B | 120 wide sheet on the webs, Z 78.77–80.04, spliced at X 1016 — **the splice that failed; no patch** |
| L1_A / L1_B / L1_C | 97.46 wide (between webs) under the top sheet, Z 77.5–78.77, X 45–770 / 770–1016 / 1016–1211 (cut as 725 + 441 like the plan, the 441 bisected at the splice for phase B) |
| L2 | 97.46 wide, Z 76.23–77.5, X 265.5–990.5 |
| L3 | 97.46 wide, Z 74.96–76.23, X 408–848 |
| Diaph_0..7 | 97.46 wide × t, at X 50, 281, 512, 743, 991, 1041, 1141, 1226; height fills soffit top → underside of whatever layer is above |
| Patch_Soffit, Patch_WebL, Patch_WebR | 36 × 36 × t splice backers centred on X 1016, inside the box |
| Tab_0..5 | glue tabs 60 × 12 × t on the soffit against each web at X 160, 628, 1100 |
| Sheet | the matboard sheet 1016 × 813 × t, blue, lying flat centred under the bridge; visible only as the model spreads |

Matboard: blue face outward (`Board_Blue` #34619e, roughness 0.85), white core/back
(`Board_White` #ece9e2, roughness 0.9). Face material chosen by outward normal per piece.

## Laid-flat layout (slider = 100%)

Pieces lie on the Sheet plane with the blue face up, long side along X, packed by a greedy
first-fit shelf packer (tallest rows first, 4 mm kerf so pieces read apart); diaphragms lie on their side so the
97 mm edge runs along the sheet. Everything is ≤ 1016 long — that is why the bridge was
spliced. The packer overshoots the real 813 mm width by ~7 % (the team nested by hand), so
the Sheet mesh is drawn 1016 × 874 in a darker blue; the HUD quotes the real 1016 × 813.

## Deliverables

1. `tools/bridge/build_bridge.py` — Blender 5 headless; builds the pieces (one mesh object
   each, named as above, parent Empty `Bridge`), writes glTF node extras per piece:
   `part` (top | layer | web | soffit | diaphragm | patch | tab | sheet), `half` (A = X < 1016,
   B = X > 1016; pieces crossing 1016 are bisected so phase B can hinge the two halves),
   `sheet` = [x, y, z, qx, qy, qz, qw] laid-flat pose in metres. Exports
   `public/media/civ102-bridge/bridge.glb` (Draco, metres, Y-up) and renders the poster
   `public/media/civ102-bridge/fig-bridge-render.jpg` (assembled bridge, three-quarter, soft
   studio light, 1600 × 1000). Self-check parses the GLB: 31 nodes with extras (30 pieces + sheet), size < 600 KB.
2. `src/components/BridgeStudio.tsx` — click-to-activate like `ModelViewer` (same lazy import,
   cleanup, resize, dark-mode pattern), loads `bridge.glb` with Draco. Controls in the existing
   `.asrs-*` styles: **Assemble** (→ 0%), **Lay flat** (→ 100%), a native `<input type="range">`
   Explode 0–100, **See inside** toggle (top sheet, layers, webs → opacity 0.3; soffit,
   diaphragms, patches, tabs solid). Per frame: damp the explode value toward the slider
   (rate ≈ 4/s); per piece `pos = lerp(rest, sheet, e) + up·sin(πe)·(0.04 + 0.05·|sheet−rest|)`,
   `quat = slerp(rest, sheet, e)`; Sheet opacity = smoothstep(e, 0.6, 1); camera distance =
   lerp(fitAssembled, fitSheet, smoothstep(e, 0.4, 1)) along the orbit direction. HUD: `30 pieces ·
   one 1016 × 813 mm sheet` at 100%, otherwise `explode NN%`.
3. `src/pages/HolyBridge.tsx` — swap `ModelViewer` for `BridgeStudio`, poster =
   `fig-bridge-render.jpg`, rewrite the intro paragraph and caption (it no longer "drops the top
   flange to translucent"; it has a See-inside toggle and lays itself flat on the sheet).
   Delete `box-girder.glb`. ~10 lines of CSS for the range input.

## Verification

`npx vitest run`, `npx tsc --noEmit`, `npx vite build` clean; Blender renders checked against
the construction photos (blue outside, white inside, proportions); browser check of the
viewer on `?3d`-less click: slider both ways, Assemble/Lay flat, See inside, dark mode.

## Test day (built)

The GLB also carries the apparatus from the handout §1.5–1.6 and the test-day photos, tagged
`part: rig` and hidden until the run: 50 mm support plates on plywood stacks at 1200 c/c, the
bench, two A-frames with the steel beam, and the 400 N three-car train (axles 0, 176, 340,
516, 680, 856 mm; car bodies 280 × 75 mm with rods and wheels). `Top_Flap` (936–1016) and the
right web torn at 1016 (`Web_R_C`) exist for the break. Web splices are staggered — left web
at 1016, right web at 240 — as built.

`BridgeStudio variant="testday"` is its own figure after the failure photo (the rig on show, Run / Reset / X-ray only; A-frames straddle each support so the train passes between the legs): press Run and the train rolls in from
the 0 end at 0.15 m/s (HUD: load case 1 · 400 N train · N on the span). When the lead car
sits on the 1016 splice — 133 N, one car — the halves hinge about their supports (70 mm sag
at the splice, 1.4 s ease), the flap folds up 0.45 rad, the cars follow the sagging deck.
Scripted, no physics engine. Reset restores the studio; X-ray works throughout.

Later, if wanted: the Assemble run could follow the real gluing order (top layers first);
`ORDER` in BridgeStudio.tsx is the one line to change.
