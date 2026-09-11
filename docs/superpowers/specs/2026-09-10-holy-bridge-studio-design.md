# Holy Bridge — Bridge Studio (explode/assemble viewer) 

**Date:** 2026-09-10 · **Page:** `/projects/civ102-bridge` · **Status:** built 2026-09-10; rebuilt the same evening with real materials, the photographed rig and a baked animation (see *Test day, rebuilt* below), awaiting owner review

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
| Decal | the pencil title from the photo, an alpha quad 0.15 mm outside the near web, X 90–1160, child of Web_R_A |

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

## Test day, rebuilt (2026-09-10 evening)

The owner asked for the test-day scene to be modelled properly in Blender first, animation
included, and the bridge itself given real materials. `tools/bridge/build_bridge.py` now does
all of it; the web only plays back.

**Materials.** Generated, tileable textures (numpy inside Blender, saved as PNG, embedded as
JPEG in the GLB): blue and white paper grain at 1 tile / 120 mm on every piece (planar UVs in
absolute mm so tiles line up across pieces), SPF lumber with 6 mm growth rings, maple butcher
block for the benches (37.5 mm strips), plywood edge stripes (6 plies / 108 mm). Constant
PBR for the steel, black car bodies, wheels, cables, tapes. The pencil title on the near web
("HOLY ✝ BRIDGE" and the doodles) is lifted from IMG_1642 by `tools/bridge/make_decal.py`
into `tools/bridge/decal-web.png`, an alpha-blended quad riding on `Web_R_A` — the owner
rates it unimportant, so it is left as is.

**Rig, after the photos** (`part: rig`, under one `Rig` empty): three maple lab benches
(top at Z = −330, front edge at Y = −330); two A-frames standing square across the bench
(`FRAME_YAW` = 90°, the owner's call — the photos read as ~45°, one constant to change),
2×4 legs splayed 10° (`LEG_LEAN`) as prisms in the frame's own plane (`Frame_i` empties at
the supports): the front leg runs up to a plywood pad under the beam (underside Z = 495), the
back leg butts its side 60 mm lower; a sill beside the legs runs out to the bench edge where
the C-clamp grips it; a crossbar (2×4 on edge + one flat) carries the 180 × 90 × 108 plywood
stack whose top is the support at Z = 0; a plywood kicker on the back foot. The bridge and
train pass through the frame opening between the legs. Galvanized 50 mm beam on the pads
with the 22 mm black tether bar clipped tight under it, travelling with the train; the staging
board (2×6 on two 2×4 posts, green tape) the train waits on, level with the deck; three cars
per the handout (280 × 75 × 75 black boxes, Ø45 wheels on Ø8 axles, the threaded rod with
washer and nut, a flat-bar tether post on the rear end with its eye at 195, links between
cars) and three tether cables (Ø6 tube meshes with ferrules and yellow tape) looping forward
from each post up to the rail.

**Animation.** One glTF clip, `testday`, keyframed in Blender at 30 fps: the train rolls from
X = −150 at 0.15 m/s (LINEAR keys), wheels turning, until its lead axle reaches 1104 mm
(`t_break` = 8.36 s); then 1.4 s of collapse — `Half_A`/`Half_B` (the empties the pieces
hang under) rotate about their supports so the splice sags 70 mm (empty location = P − R·P
keeps the pieces' rest poses Bridge-local for the studio), `Top_Flap` folds up 0.45 rad about
X = 936, the cars follow the deck's sag and pitch, and each cable's `drop` shape key moves
its car end to where the eye lands on the sagged, pitched car. `Train` extras: `t_break`
(stamped as f_break / FPS, the exporter's own time for that frame), `speed`, `axles`. The
pieces are scaled mm → m by hand (`to_metres`), not `transform_apply`, which mangled the
Train → Car parent inverses. Generated tiles are written as raw sRGB bytes (a byte image's
`pixels` are not colour-managed); `prism_mesh` flips its normals outward.

**Web.** `BridgeStudio` plays the clip with an `AnimationMixer` (Run = `reset().play()`,
Reset = `reset()`, `update(0)`, `stop()`), skips its own piece lerp while the clip runs, and
reads the train's X back for the HUD load count; a `RoomEnvironment` map so the metals read;
the Decal mesh gets `renderOrder` 1 so X-ray draws it over its ghosted web deterministically.
The studio variant never plays the clip. A `.blend` of the whole scene (textures packed) is
saved beside the originals: `_media-originals/civ102-bridge/holy-bridge-testday.blend`.

Rebuild:
```
Blender -b -P tools/bridge/build_bridge.py -- --out public/media/civ102-bridge/bridge.glb \
  --poster public/media/civ102-bridge/fig-bridge-render.jpg \
  --testday-poster public/media/civ102-bridge/fig-testday-render.jpg \
  --blend _media-originals/civ102-bridge/holy-bridge-testday.blend [--preview DIR]
```

Later, if wanted: the Assemble run could follow the real gluing order (top layers first);
`ORDER` in BridgeStudio.tsx is the one line to change. Team photos on the cars and the blue
weight plates on the bench are deliberately left out.
