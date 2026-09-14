"""Build the Incheon ASRS *system* — everything around the robot — as a parts GLB.

Run headless:
  Blender -b -P tools/asrs/build_system.py -- --out public/media/incheon-robotics/asrs-system.glb \
      [--robot public/media/incheon-robotics/robot.glb] [--poster FILE.jpg] [--preview DIR] [--blend FILE.blend]

After the company's renders and the N09 prototype photo: white tube posts on flanged feet, a
cast cross joint under every tile corner, laminated deck tiles with the dark seam the robots
follow, a four-arm cradle star at every post that a Euro bin (600 × 400 × 220) rests on by its corners,
the elevator tower of black extrusion with a red hoist, and the kiosk.

The site instances the single-mesh parts per cell (`Post`, `Foot`, `DeckJoint`, `Cradle`,
`Tile`, `Bin_Blue`, `Bin_Black`) and drops the groups in whole (`Elevator` with its
`Carriage` and unit `Cable`, `Kiosk`, `Ground`). Origins: posts, feet, cables at their base;
tiles at the top face centre; cradles and deck joints on the post axis at deck level (the
joint hangs below, the cradle stands above); bins at their bottom centre.

Units: mm here, metres in the GLB (Y-up). Scene frame: X across the columns, Y toward the
front of the rack (three.js −Z), Z up. Level pitch 408, tile pitch 620, cradle arms top out at 88.
"""
import argparse
import math
import os
import sys
import tempfile

import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from blendkit import Part, aim, box_mesh, empty, export_glb, fbm, link, material, shoot, srgb, studio, tile_image, to_metres  # noqa: E402

PITCH, LEVEL_H, CRADLE_H = 620.0, 408.0, 88.0
TILE_T = 16.0
FLOOR_Z = -220.0  # the concrete floor under a rack that stands on its feet
POST_R = 17.0
BIN = {"bottom": (556.0, 376.0), "top": (588.0, 408.0), "body": 185.0, "rim": (600.0, 400.0, 30.0)}


# --------------------------------------------------------------------------- textures / materials

def make_tiles(dirpath):
    os.makedirs(dirpath, exist_ok=True)
    rng = np.random.default_rng(11)
    N = 512
    u = np.linspace(0, 1, N, endpoint=False)[None, :]
    v = np.linspace(0, 1, N, endpoint=False)[:, None]
    grain = fbm(rng, N, N, (1, 3, 8), (0.5, 0.3, 0.2))
    T = {}
    # laminated tile: near-white, a dark seam strip on every edge (two tiles make the guide line), bolt holes
    lam = np.array([0.94, 0.935, 0.925]) * (1 + 0.015 * grain)[..., None]
    edge = 6 / N
    seam = (u < edge) | (u > 1 - edge) | (v < edge) | (v > 1 - edge)
    lam = np.where(np.broadcast_to(seam[..., None], lam.shape), np.array([0.17, 0.18, 0.19]), lam)
    for hu in (0.097, 0.903):
        for hv in (0.097, 0.903):
            hole = (u - hu) ** 2 + (v - hv) ** 2 < (5 / N) ** 2
            lam = np.where(np.broadcast_to(hole[..., None], lam.shape), np.array([0.25, 0.25, 0.26]), lam)
    T["laminate"] = tile_image("laminate", lam, dirpath)
    # concrete floor
    conc = np.array([0.56, 0.57, 0.56]) * (1 + 0.06 * grain + 0.03 * fbm(rng, N, N, (20,), (1,)))[..., None]
    T["concrete"] = tile_image("concrete", conc, dirpath)
    # the kiosk screen: a dark UI with a header, four job rows, the talk button
    W, H = 256, 384
    su = np.linspace(0, 1, W, endpoint=False)[None, :]
    sv = np.linspace(0, 1, H, endpoint=False)[:, None]
    scr = np.zeros((H, W, 3)) + np.array([0.05, 0.09, 0.15])
    scr[sv[:, 0] < 0.12] = np.array([0.07, 0.13, 0.23])
    for i in range(4):
        y0 = 0.17 + i * 0.115
        row = (sv > y0) & (sv < y0 + 0.088) & (su > 0.05) & (su < 0.95)
        scr = np.where(np.broadcast_to(row[..., None], scr.shape), np.array([0.11, 0.19, 0.34]) if i == 0 else np.array([0.07, 0.11, 0.2]), scr)
        txt = row & (su > 0.09) & (su < 0.6) & (np.abs(sv - (y0 + 0.044)) < 0.012)
        scr = np.where(np.broadcast_to(txt[..., None], scr.shape), np.array([0.8, 0.87, 1.0]) if i == 0 else np.array([0.56, 0.63, 0.75]), scr)
    mic = (su - 0.5) ** 2 + ((sv - 0.84) * W / H) ** 2 < 0.13 ** 2
    scr = np.where(np.broadcast_to(mic[..., None], scr.shape), np.array([0.18, 0.48, 1.0]), scr)
    T["screen"] = tile_image("screen", scr, dirpath)
    return T


def materials(tiles):
    return {
        "white": material("White_Powder", srgb("f2f0ec"), 0.35),
        "laminate": material("Laminate", (1, 1, 1), 0.45, image=tiles["laminate"]),
        "bin_blue": material("Bin_Blue", srgb("2434a4"), 0.32),
        "bin_black": material("Bin_Black", srgb("17181c"), 0.4),
        "anodised": material("Anodised", srgb("141416"), 0.4, metallic=0.6),
        "alu": material("Aluminium", srgb("c9ccd0"), 0.38, metallic=0.75),
        "red": material("Hoist_Red", srgb("a8332c"), 0.42),
        "steel": material("Steel", srgb("9a9ea3"), 0.45, metallic=0.6),
        "dark": material("Dark_Steel", srgb("3a3d43"), 0.4, metallic=0.7),
        "concrete": material("Concrete", (1, 1, 1), 0.9, image=tiles["concrete"]),
        "kiosk": material("Kiosk_Black", srgb("0c0d10"), 0.36, metallic=0.3),
        "screen": material("Screen", (1, 1, 1), 0.2, image=tiles["screen"], emission=1.2),
    }


# --------------------------------------------------------------------------- parts

def prism_xy(name, poly, z0, z1, mat, uv_scale):
    """A polygon in XY extruded from z0 to z1; planar UVs so a texture spans the polygon."""
    n = len(poly)
    verts = [(x, y, z0) for x, y in poly] + [(x, y, z1) for x, y in poly]
    faces = [list(range(n))[::-1], [n + i for i in range(n)]]
    faces += [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.materials.append(mat)
    layer = me.uv_layers.new(name="UVMap")
    for poly_ in me.polygons:
        for li in poly_.loop_indices:
            p = me.vertices[me.loops[li].vertex_index].co
            layer.data[li].uv = (p.x / uv_scale + 0.5, p.y / uv_scale + 0.5)
    return me


def build_parts(root, M):
    parts = {}
    # posts: 1 m long, base at the origin — the site scales each instance to its height
    p = Part()
    p.cyl(POST_R, 1000, (0, 0, 500), M["white"], segs=24)
    parts["Post"] = link("Post", p.mesh("Post"), root)
    # flanged foot
    p = Part()
    p.cyl(60, 10, (0, 0, 5), M["white"], segs=32)
    p.cyl(26, 40, (0, 0, 30), M["white"], segs=24)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        p.cyl(5, 5, (45 * math.cos(a), 45 * math.sin(a), 12.5), M["white"], segs=8)
    parts["Foot"] = link("Foot", p.mesh("Foot"), root)
    # the cast cross joint under a tile corner: collar round the post, arms under four tile corners
    p = Part()
    p.cyl(30, 40, (0, 0, -20), M["white"], segs=24)
    p.box((240, 40, 12), (0, 0, -6), M["white"])
    p.box((40, 240, 12), (0, 0, -6), M["white"])
    parts["DeckJoint"] = link("DeckJoint", p.mesh("DeckJoint"), root)
    # the cradle, after the company's render: a square hub cap on the post and a tapered
    # four-arm star turned 45° to the grid, so each arm reaches under the corner of the bin in
    # that cell (the bin's underside starts 32 × 122 mm in from the post). The tips stop short
    # of the robot's deck (81 × 144 mm in from the post) so a lift passes them.
    p = Part()
    p.box((60, 60, 46), (0, 0, 23), M["steel"])  # one material: the site instances it as one primitive
    p.cyl(28, 30, (0, 0, 61), M["steel"], segs=24)
    star = []
    for k in range(4):
        a = math.radians(45 + 90 * k)
        d, n = (math.cos(a), math.sin(a)), (-math.sin(a), math.cos(a))
        star += [(184 * d[0] - 12 * n[0], 184 * d[1] - 12 * n[1]), (184 * d[0] + 12 * n[0], 184 * d[1] + 12 * n[1]),
                 (45 * math.cos(a + math.pi / 4), 45 * math.sin(a + math.pi / 4))]
    p.prism(star, CRADLE_H - 12, CRADLE_H, M["steel"])
    parts["Cradle"] = link("Cradle", p.mesh("Cradle"), root)
    # the deck tile, corners notched round the posts, top face at the origin
    h, n = PITCH / 2, 45.0
    outline = [(-h + n, -h), (h - n, -h), (h - n, -h + n), (h, -h + n), (h, h - n), (h - n, h - n), (h - n, h),
               (-h + n, h), (-h + n, h - n), (-h, h - n), (-h, -h + n), (-h + n, -h + n)]
    parts["Tile"] = link("Tile", prism_xy("Tile", outline, -TILE_T, 0, M["laminate"], PITCH), root)
    # Euro bins, blue and black
    for name, mat in (("Bin_Blue", M["bin_blue"]), ("Bin_Black", M["bin_black"])):
        parts[name] = link(name, bin_mesh(name, mat), root)
    # the elevator tower for two storage levels (after the prototype: black corner extrusions,
    # silver ring frames at every deck, a hoist sub-frame on top), its lift module and a unit cable
    elev = empty("Elevator", root)
    top = 2 * LEVEL_H + 450
    p = Part()
    for sx, sy in ((-335, -270), (335, -270), (-335, 270), (335, 270)):
        p.box((40, 40, top - FLOOR_Z), (sx, sy, (top + FLOOR_Z) / 2), M["anodised"])
    for z in [lv * LEVEL_H - TILE_T - 40 for lv in range(3)] + [top]:
        for sy in (-270, 270):
            p.box((710, 20, 40), (0, sy, z - 20), M["alu"])
        for sx in (-335, 335):
            p.box((20, 580, 40), (sx, 0, z - 20), M["alu"])
    for s_ in (1, -1):  # diagonal braces on the back face
        L = math.hypot(670, top - FLOOR_Z)
        p.box((14, 14, L), (0, 270, (top + FLOOR_Z) / 2), M["anodised"], rot=Matrix.Rotation(s_ * math.atan2(670, top - FLOOR_Z), 4, "Y"))
    for sx, sy in ((-200, -150), (200, -150), (-200, 150), (200, 150)):  # the hoist sub-frame
        p.box((20, 20, 260), (sx, sy, top + 130), M["alu"])
    for sy in (-150, 150):
        p.box((420, 20, 20), (0, sy, top + 250), M["alu"])
    for sx in (-200, 200):
        p.box((20, 320, 20), (sx, 0, top + 250), M["alu"])
    p.box((200, 120, 140), (0, 0, top + 170), M["red"])  # the hoist, hung under the sub-frame
    p.cyl(30, 100, (0, 0, top + 80), M["dark"], axis="X", segs=16)  # its drum, the cable leaves it downward
    link("Frame", p.mesh("Frame"), elev)
    # the lift module: a truss of 25 mm extrusion under a floor plate, a vertical plate on each
    # long side carrying a lifting ring, a triangular yoke above joined to both rings — the hoist
    # cable takes the yoke's apex, so the deck stays clear for the robot
    p = Part()
    p.box((540, 420, 6), (0, 0, -3), M["steel"])
    for sy in (-207.5, 207.5):
        p.box((560, 25, 25), (0, sy, -18.5), M["alu"])
    for sx in (-267.5, 267.5):
        p.box((25, 440, 25), (sx, 0, -18.5), M["alu"])
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):  # corner → centre diagonals
        L = math.hypot(255, 195)
        p.box((L - 30, 25, 25), (sx * 127.5, sy * 97.5, -18.5), M["alu"], rot=Matrix.Rotation(math.atan2(sy * 195, sx * 255), 4, "Z"))
    p.box((510, 25, 25), (0, 0, -18.5), M["alu"])  # centre spine
    p.box((90, 90, 4), (0, 0, -8), M["steel"])  # the hub plate the diagonals meet under
    for sy in (-1, 1):
        p.box((140, 6, 215), (0, sy * 217, 76.5), M["steel"])  # end plates
        p.cyl(18, 6, (0, sy * 217, 200), M["steel"], axis="Y", segs=20)  # the lifting ring
        p.cyl(9, 8, (0, sy * 217, 200), M["dark"], axis="Y", segs=16)  # its eye (the hole)
        p.cyl(2.5, 118, (0, sy * 217 - sy * 34, 260), M["dark"], axis="Y", segs=6)  # short line to the yoke corner
    for sy in (-1, 1):  # the yoke: two bars up to the apex, a bar across the bottom
        L = math.hypot(150, 110)
        p.box((14, L, 14), (0, sy * 75, 375), M["steel"], rot=Matrix.Rotation(sy * math.atan2(150, 110), 4, "X"))
    p.box((14, 300, 14), (0, 0, 320), M["steel"])
    p.cyl(12, 10, (0, 0, 440), M["dark"], axis="Y", segs=16)  # the hook's ring at the apex
    link("Carriage", p.mesh("Carriage"), elev)
    p = Part()
    p.cyl(4, 1000, (0, 0, 500), M["dark"], segs=8)
    link("Cable", p.mesh("Cable"), elev)
    parts["Elevator"] = elev
    # the kiosk
    p = Part()
    p.box((300, 300, 20), (0, 0, 10), M["kiosk"])
    p.box((75, 55, 900), (0, 0, 470), M["kiosk"])
    tilt = Matrix.Rotation(math.radians(-9), 4, "X")
    p.box((340, 30, 470), (0, 0, 1150), M["kiosk"], rot=tilt)
    kiosk = link("Kiosk", p.mesh("Kiosk"), root)
    scr = bpy.data.meshes.new("Screen")
    scr.from_pydata([(-147, -16, -210), (147, -16, -210), (147, -16, 210), (-147, -16, 210)], [], [(0, 1, 2, 3)])
    scr.materials.append(M["screen"])
    layer = scr.uv_layers.new(name="UVMap")
    for li, uv in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))):
        layer.data[li].uv = uv
    link("Screen", scr, kiosk, (0, 0, 1150), (math.radians(-9), 0, 0))
    parts["Kiosk"] = kiosk
    # a 2 m ground swatch: the site stretches its material over the whole floor
    me, c = box_mesh("Ground", (-1000, 1000, -1000, 1000, -2, 0), [M["concrete"]], uv=1000)
    parts["Ground"] = link("Ground", me, root, c)
    return parts


def bin_mesh(name, mat):
    """A Euro bin: drafted body, the rim, ribs on the walls, an inner cavity."""
    p = Part()
    b, t, h = BIN["bottom"], BIN["top"], BIN["body"]
    p.frustum(b, t, h, (0, 0, 0), mat)
    rw, rd, rh = BIN["rim"]
    for sy in (-1, 1):
        p.box((rw, 10, rh), (0, sy * (rd / 2 - 5), h + rh / 2), mat)
    for sx in (-1, 1):
        p.box((10, rd, rh), (sx * (rw / 2 - 5), 0, h + rh / 2), mat)
    for x in (-150, 0, 150):
        for sy in (-1, 1):
            p.box((8, 10, 150), (x, sy * (b[1] / 2 + 6), 95), mat)
    for y in (-100, 100):
        for sx in (-1, 1):
            p.box((10, 8, 150), (sx * (b[0] / 2 + 6), y, 95), mat)
    # the cavity, faces turned inward
    before = set(p.bm.faces)
    p.frustum((b[0] - 8, b[1] - 8), (t[0] - 8, t[1] - 8), h + rh - 6, (0, 0, 6), mat)
    import bmesh as _bm
    _bm.ops.reverse_faces(p.bm, faces=[f for f in p.bm.faces if f not in before])
    return p.mesh(name)


# --------------------------------------------------------------------------- the demo layout (renders only)

def instance(part, name, parent, loc, scale=(1, 1, 1)):
    ob = bpy.data.objects.new(name, part.data)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = loc
    ob.scale = scale
    return ob


def demo(parts, robot_glb):
    """The layout the site runs, laid out for the poster: 5 columns, rows −1..3, two storage
    levels, bins in rows 1 and 3, the elevator at column 5, the kiosk out front."""
    root = empty("Demo", None)
    cols, rows, levels = 5, (-1, 0, 1, 2, 3), 2
    xy = lambda c, r: (c * PITCH, -r * PITCH)  # three.js +z (rows) is Blender −y
    corners = set()
    for lv in range(levels + 1):
        z = lv * LEVEL_H
        for r in rows:
            if lv > 0 and r < 0:
                continue
            for c in range(cols):
                x, y = xy(c, r)
                instance(parts["Tile"], "t", root, (x, y, z))
                for dx, dy in ((-0.5, -0.5), (0.5, -0.5), (-0.5, 0.5), (0.5, 0.5)):
                    cx, cy = x + dx * PITCH, y + dy * PITCH
                    corners.add((round(cx), round(cy)))
                    instance(parts["DeckJoint"], "j", root, (cx, cy, z - TILE_T))
                    if r >= 0:
                        instance(parts["Cradle"], "cr", root, (cx, cy, z))
    top = levels * LEVEL_H + 300
    for cx, cy in corners:
        instance(parts["Post"], "p", root, (cx, cy, FLOOR_Z), (1, 1, (top - FLOOR_Z) / 1000))
        instance(parts["Foot"], "f", root, (cx, cy, FLOOR_Z))
    k = 0
    for lv in (1, 2):
        for r in (1, 3):
            for c in range(cols):
                if k % 3 != 2:
                    x, y = xy(c, r)
                    instance(parts["Bin_Black" if k % 7 == 3 else "Bin_Blue"], "b", root, (x, y, lv * LEVEL_H + CRADLE_H))
                k += 1
    ex, ey = xy(cols, 0)
    elev = bpy.data.objects.new("DemoElevator", None)
    bpy.context.scene.collection.objects.link(elev)
    elev.parent = root
    elev.matrix_parent_inverse = Matrix.Identity(4)
    elev.location = (ex, ey, 0)
    for ch in parts["Elevator"].children:
        ob = instance(ch, "e", elev, ch.location * 1000)  # the parts sit in metres now
        if ch.name == "Cable":
            ob.scale = (1, 1, (2 * LEVEL_H + 450 + 80 - 440) / 1000)
            ob.location = (0, 0, 440)
    kx, ky = -1.35 * PITCH, 1.05 * PITCH
    kiosk = instance(parts["Kiosk"], "k", root, (kx, ky, FLOOR_Z))
    kiosk.rotation_euler = (0, 0, math.pi)  # turned to face the rack and its stations, as the owner asked
    for ch in parts["Kiosk"].children:
        instance(ch, "ks", kiosk, ch.location * 1000).rotation_euler = ch.rotation_euler
    me, c = box_mesh("DemoGround", (-4000, 6000, -4000, 3000, FLOOR_Z - 2, FLOOR_Z), [parts["Ground"].data.materials[0]], uv=1000)
    link("DemoGround", me, root, c)
    # three robots from the robot build: one under a stored bin on L1, one on the carriage, one on the deck
    if robot_glb and os.path.exists(robot_glb):
        for i, (loc, rot) in enumerate((((*xy(1, 1), LEVEL_H), 0), ((ex, ey, 0), 0), ((*xy(3, 0), 0), math.pi / 2))):
            before = set(bpy.data.objects)
            bpy.ops.import_scene.gltf(filepath=robot_glb)
            new = [o for o in bpy.data.objects if o not in before]
            holder = empty(f"Robot_{i}", root, loc, (0, 0, rot))
            for o in new:
                if o.parent is None or o.parent not in new:
                    o.parent = holder
                    o.matrix_parent_inverse = Matrix.Identity(4)
                    o.scale = (1000, 1000, 1000)  # the robot is in metres; this scene is still in mm
    return root


# --------------------------------------------------------------------------- main

def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", required=True)
    ap.add_argument("--robot")
    ap.add_argument("--poster")
    ap.add_argument("--preview")
    ap.add_argument("--blend")
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    M = materials(make_tiles(tempfile.mkdtemp(prefix="asrs-tiles-")))
    root = empty("System", None)
    parts = build_parts(root, M)
    root.scale = (0.001, 0.001, 0.001)
    to_metres(root)
    export_glb(root, args.out)
    check_glb(args.out)

    if args.poster or args.preview or args.blend:
        # the demo is built in mm on the exported (metre) parts' meshes, so scale the whole demo down
        for ob in root.children_recursive:
            if ob.type == "MESH":
                for v in ob.data.vertices:
                    v.co *= 1000
        d = demo(parts, args.robot)
        d.scale = (0.001, 0.001, 0.001)
        root.hide_render = root.hide_viewport = True
        for ob in root.children_recursive:
            ob.hide_render = ob.hide_viewport = True
        # the site's viewer stands on the three.js +Z side (Blender −Y), columns running to the right
        cam = studio((1.5, -0.7, 0.45), 6.6, -62, 24, lens=40)
        if args.poster:
            shoot(args.poster, 1600, 991, "JPEG")
        if args.preview:
            os.makedirs(args.preview, exist_ok=True)
            shoot(os.path.join(args.preview, "overview.png"), 1400, 900)
            aim(cam, (0.62, -0.62, 0.55), 1.6, -55, 18)
            shoot(os.path.join(args.preview, "cell.png"), 1400, 900)
            aim(cam, (3.1, 0.0, 0.7), 2.6, -40, 14)
            shoot(os.path.join(args.preview, "elevator.png"), 1400, 900)
            aim(cam, (-0.84, 0.65, 0.9), 1.6, -80, 10)
            shoot(os.path.join(args.preview, "kiosk.png"), 1400, 900)
        if args.blend:
            for screen in bpy.data.screens:
                for area in screen.areas:
                    if area.type == "VIEW_3D":
                        area.spaces[0].shading.type = "MATERIAL"
            bpy.ops.file.pack_all()
            bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.blend))


def check_glb(path):
    import json
    import struct
    with open(path, "rb") as f:
        f.seek(12)
        ln = struct.unpack("<I", f.read(4))[0]
        f.seek(20)
        js = json.loads(f.read(ln))
    names = {n.get("name") for n in js["nodes"]}
    for need in ("Post", "Foot", "DeckJoint", "Cradle", "Tile", "Bin_Blue", "Bin_Black", "Elevator", "Frame", "Carriage", "Cable", "Kiosk", "Screen", "Ground"):
        assert need in names, f"missing {need}"
    # the instanced parts must come through as one primitive each (one material), or the
    # loader wraps them in Groups the site cannot instance
    for n in js["nodes"]:
        if n.get("name") in ("Post", "Foot", "DeckJoint", "Cradle", "Tile", "Bin_Blue", "Bin_Black") and "mesh" in n:
            assert len(js["meshes"][n["mesh"]]["primitives"]) == 1, n["name"]
    size = os.path.getsize(path)
    assert size < 900_000, size
    print(f"GLB ok: {len(js['nodes'])} nodes, {len(js.get('images', []))} images, {size} bytes")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
