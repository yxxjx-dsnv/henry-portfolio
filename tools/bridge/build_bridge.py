"""Build the Holy Bridge (CIV102 Team 107 matboard box girder) and its test day as a rigged,
animated GLB.

Run headless:
  Blender -b -P tools/bridge/build_bridge.py -- --out public/media/civ102-bridge/bridge.glb \
      [--poster FILE.jpg] [--testday-poster FILE.jpg] [--preview DIR] [--blend FILE.blend]

Every piece from the engineering assembly is one mesh object (32 pieces + sheet), blue
matboard face out, white core/back, textured at real scale; the pencil title on the near web
is lifted from the test-day photo (tools/bridge/decal-web.png, made by make_decal.py).
Each piece carries glTF extras:
  part   top | layer | web | soffit | diaphragm | patch | tab | sheet
  half   A (X < 1016 mm) | B (X > 1016) — the top-flange splice the bridge failed at
  sheet  [x, y, z, qx, qy, qz, qw] laid-flat pose on the matboard sheet, glTF frame
The pieces hang under two empties, Half_A and Half_B, that stay at identity until test day.

Test day (part = rig, after the photos and the handout §1.5–1.6): the lab benches, two A-frames
set square across the bench with the bridge passing through them and resting on a plywood
stack on each crossbar, the steel beam on the apexes with the tether rail under it, the staging
board the train waits on, and the 400 N three-car train. One glTF animation, `testday`, runs
load case 1 the way it was run: one car alone across and back (pass 1, 133 N — held), then two
cars together (pass 2, 267 N) until the lead car sits on the splice; then the halves hinge
about their supports, the top sheet folds, the cars drop with the deck and their tethers take
up (a shape key). Train extras: t_back, t_pass2, t_break (s), speed (m/s), axle (m).

Units: modelled in mm, exported in metres (glTF Y-up). X runs along the span, Y across, Z up,
soffit underside at Z = 0. Design spec: docs/superpowers/specs/2026-09-10-holy-bridge-studio-design.md.
"""
import argparse
import json
import math
import os
import random
import struct
import sys
import tempfile

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

T = 1.27  # matboard thickness, mm
LEN = 1256.0
SPLICE = 1016.0  # every full-length piece is 1016 + 240: the sheet is 1016 long
FLAP = 936.0  # where the top sheet hinged up when the splice let go
SUPPORT = (28.0, 1228.0)  # support centres, 1200 c/c (handout §1.5)
INNER = 100.0 - 2 * T  # between the webs
TOP_Z = 78.77  # underside of the top sheet
DECK = TOP_Z + T  # the deck the train rolls on
SHEET_W, SHEET_H = 1016.0, 813.0  # the one matboard sheet
DIAPH_X = (50, 281, 512, 743, 991, 1041, 1141, 1226)
LAYERS = (("L1", 45.0, 1211.0), ("L2", 265.5, 990.5), ("L3", 408.0, 848.0))  # nested under the top
DECAL_X = (90.0, 1160.0)  # what tools/bridge/decal-web.png covers along the near web

# test day, mm (bench and frames measured off the photos, the train off the handout)
BENCH_Z = -330.0  # bench top; the bridge soffit is 330 above it
BENCH_FRONT, BENCH_D, BENCH_H = -330.0, 760.0, 900.0
BENCHES = ((-2400.0, -900.0), (-900.0, 600.0), (600.0, 2100.0))
FRAME_YAW, LEG_LEAN = math.radians(90), math.radians(10)  # frames stand square across the bench (the owner's call; the photos read as ~45°), legs splay 10°
APEX_Z = 495.0  # beam underside: the rail bottom sits ~393 above the deck in IMG_1625
RAIL_Z = APEX_Z  # the black tether bar is clipped tight under the beam
LUMBER = (38.0, 89.0)  # 2×4
STACK = (180.0, 90.0, 108.0)  # plywood stack on the crossbar: along the frame, across, tall
# load case 1 is run in stages: one car alone, then cars 1+2 together, then all three (400 N,
# the pass mark). This bridge carried the single car across and let go under the second pass.
CAR_X0 = (-238.0, -578.0, -918.0)  # car centres at the start, on the staging board (lead axle at −150)
PARK_X = 1600.0  # where the lone car parks on the exit board after pass 1
TRAIN_SPEED = 300.0  # mm/s, pushed across
RETURN_SPEED = 350.0  # mm/s, pushed back for the next pass (the handout allows reverse runs)
BREAK_X = SPLICE  # the lead car's centre when the splice lets go (its lead axle at 1104)
DROP = 70.0  # how far the splice sags in the break
FLAP_LIFT = 0.14  # rad — the free end kinks up ~11 mm, all the car body over it allows
BREAK_T, HOLD_T, FPS = 1.4, 0.7, 30
WHEEL_R = 22.5
AXLE = 88.0  # each car's axles sit ±88 from its centre (handout §1.6)

AXIS = {"+x": Vector((1, 0, 0)), "-x": Vector((-1, 0, 0)), "+y": Vector((0, 1, 0)),
        "-y": Vector((0, -1, 0)), "+z": Vector((0, 0, 1)), "-z": Vector((0, 0, -1))}
PLANE = {"x": ("y", "z"), "y": ("x", "z"), "z": ("x", "y")}  # in-plane axes of a face normal


# --------------------------------------------------------------------------- pieces

def layers_above(x):
    return sum(1 for _, a, b in LAYERS if a <= x <= b)


def pieces():
    """(name, part, half, (x0, x1, y0, y1, z0, z1), blue face) for every piece, mm."""
    P = []
    half = lambda x0, x1: "A" if x1 <= SPLICE + 1e-6 else ("B" if x0 >= SPLICE - 1e-6 else "A")
    P.append(("Soffit_A", "soffit", "A", (0, SPLICE, -50, 50, 0, T), "-z"))
    P.append(("Soffit_B", "soffit", "B", (SPLICE, LEN, -50, 50, 0, T), "-z"))
    # the webs are spliced at opposite ends so the seams never line up: the near (−Y,
    # camera-side) web is glued at 1016, the far (+Y) web at 240. On test day the near
    # web's glue let go cleanly; the far web, continuous there, tore at 1016 — so it is
    # cut there too, with no bevel, and reads as one strip until the break.
    P.append(("Web_R_A", "web", "A", (0, SPLICE, -50, -50 + T, T, TOP_Z), "-y"))
    P.append(("Web_R_B", "web", "B", (SPLICE, LEN, -50, -50 + T, T, TOP_Z), "-y"))
    P.append(("Web_L_A", "web", "A", (0, LEN - SPLICE, 50 - T, 50, T, TOP_Z), "+y"))
    P.append(("Web_L_B", "web", "A", (LEN - SPLICE, SPLICE, 50 - T, 50, T, TOP_Z), "+y"))
    P.append(("Web_L_C", "web", "B", (SPLICE, LEN, 50 - T, 50, T, TOP_Z), "+y"))
    # Top_A's last 80 mm is its own piece: on test day it folded up at the splice
    P.append(("Top_A", "top", "A", (0, FLAP, -60, 60, TOP_Z, TOP_Z + T), "+z"))
    P.append(("Top_Flap", "top", "A", (FLAP, SPLICE, -60, 60, TOP_Z, TOP_Z + T), "+z"))
    P.append(("Top_B", "top", "B", (SPLICE, LEN, -60, 60, TOP_Z, TOP_Z + T), "+z"))
    h = INNER / 2
    P.append(("L1_A", "layer", "A", (45, 770, -h, h, TOP_Z - T, TOP_Z), None))
    P.append(("L1_B", "layer", "A", (770, SPLICE, -h, h, TOP_Z - T, TOP_Z), None))
    P.append(("L1_C", "layer", "B", (SPLICE, 1211, -h, h, TOP_Z - T, TOP_Z), None))
    P.append(("L2", "layer", "A", (265.5, 990.5, -h, h, TOP_Z - 2 * T, TOP_Z - T), None))
    P.append(("L3", "layer", "A", (408, 848, -h, h, TOP_Z - 3 * T, TOP_Z - 2 * T), None))
    for i, x in enumerate(DIAPH_X):
        top = TOP_Z - layers_above(x) * T
        P.append((f"Diaph_{i}", "diaphragm", half(x - T / 2, x + T / 2),
                  (x - T / 2, x + T / 2, -h, h, T, top), "+x"))
    # splice backers on soffit and webs — none on the top sheet (that is the story)
    P.append(("Patch_Soffit", "patch", "A", (998, 1034, -18, 18, T, 2 * T), None))
    P.append(("Patch_WebR", "patch", "A", (998, 1034, -50 + T, -50 + 2 * T, 22, 58), None))
    P.append(("Patch_WebL", "patch", "A", (222, 258, 50 - 2 * T, 50 - T, 22, 58), None))
    for k, x in enumerate((160, 628, 1100)):
        P.append((f"Tab_{2 * k}", "tab", half(x - 30, x + 30), (x - 30, x + 30, 50 - T - 12, 50 - T, T, 2 * T), None))
        P.append((f"Tab_{2 * k + 1}", "tab", half(x - 30, x + 30), (x - 30, x + 30, -50 + T, -50 + T + 12, T, 2 * T), None))
    return P


# Laid-flat layout: greedy shelves (first-fit, tallest first) on the real 1016-long
# sheet. Diaphragms lie on their side so the 97 mm edge runs along the sheet.
# ponytail: the shelves overshoot the real 813 mm width by a few percent (the team
# nested by hand); the Sheet mesh grows to whatever the packer needs.
GAP = 4.0  # exaggerated kerf so the pieces read apart on the sheet


def pack(items):
    """items: [(name, along, across)] -> {name: (x0, y0)}, total across."""
    rows = []  # [x_used, height, y0]
    out = {}
    for name, along, across in sorted(items, key=lambda t: (-t[2], -t[1])):
        for row in rows:
            if row[0] + along <= SHEET_W and across <= row[1]:
                out[name] = (row[0], row[2])
                row[0] += along + GAP
                break
        else:
            y0 = rows[-1][2] + rows[-1][1] + GAP if rows else 0.0
            rows.append([along + GAP, across, y0])
            out[name] = (0.0, y0)
    return out, rows[-1][2] + rows[-1][1]


def thin_axis(ext):
    """The axis a white piece is thinnest along — the face that goes up on the sheet."""
    x, y, z = ext[1] - ext[0], ext[3] - ext[2], ext[5] - ext[4]
    return "+x" if x <= min(y, z) else ("+y" if y <= z else "+z")


def flat_rotation(up, long_axis):
    """Rotation that lays a piece face-up (`up` = blue face or thin axis) with `long_axis` along sheet X."""
    n = AXIS[up]
    l = AXIS[long_axis]
    if abs(n.dot(l)) > 0.5:
        raise ValueError(f"long axis {long_axis} not perpendicular to up face {up}")
    return Matrix((l, n.cross(l), n)).to_quaternion()


def footprint(ext, up, long_axis):
    """(along X, across Y) on the sheet after flat_rotation."""
    size = {"+x": ext[1] - ext[0], "-x": ext[1] - ext[0], "+y": ext[3] - ext[2], "-y": ext[3] - ext[2],
            "+z": ext[5] - ext[4], "-z": ext[5] - ext[4]}
    across = [a for a in ("+x", "+y", "+z") if a != long_axis and a != up.replace("-", "+")][0]
    return size[long_axis], size[across]


# --------------------------------------------------------------------------- textures

def _fbm(rng, h, w, radii, weights):
    """Tileable smooth noise: box-blurred white noise (np.roll wraps), unit variance per octave."""
    out = np.zeros((h, w))
    for r, wt in zip(radii, weights):
        a = rng.standard_normal((h, w))
        for axis in (0, 1):
            a = sum(np.roll(a, d, axis=axis) for d in range(-r, r + 1)) / (2 * r + 1)
        out += wt * a / a.std()
    return out


def _tile(name, rgb, dirpath):
    """Save an (h, w, 3) sRGB float array as a PNG-backed Blender image."""
    h, w, _ = rgb.shape
    img = bpy.data.images.new(name, w, h, alpha=False)
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = np.clip(rgb, 0, 1)  # a byte image: these are the PNG's sRGB bytes, no transform
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = os.path.join(dirpath, name + ".png")
    img.file_format = "PNG"
    img.save()
    img.colorspace_settings.name = "sRGB"
    return img


def make_tiles(dirpath):
    """The surface textures, generated: paper grain, SPF lumber, maple butcher block, plywood edge.
    Each is mapped at real scale by the UV scale in TILE_MM."""
    os.makedirs(dirpath, exist_ok=True)
    rng = np.random.default_rng(7)
    N = 512
    u = np.linspace(0, 1, N, endpoint=False)[None, :]
    v = np.linspace(0, 1, N, endpoint=False)[:, None]
    grain = _fbm(rng, N, N, (1, 3, 9), (0.5, 0.3, 0.2))
    fibre = _fbm(rng, N, N, (1, 2), (0.6, 0.4))
    fibre = sum(np.roll(fibre, d, axis=1) for d in range(-6, 7)) / 13  # streaks along u
    fibre /= fibre.std()
    tiles = {}
    tiles["paper_blue"] = _tile("paper_blue", np.array([0.251, 0.400, 0.639]) * (1 + 0.022 * grain + 0.018 * fibre)[..., None], dirpath)
    tiles["paper_white"] = _tile("paper_white", np.array([0.925, 0.910, 0.880]) * (1 + 0.02 * grain + 0.02 * fibre)[..., None], dirpath)
    wob = _fbm(rng, N, N, (6, 20), (0.5, 0.5))
    rings = np.sin(2 * np.pi * (v * 300 / 6 + 0.08 * wob + 0.06 * np.sin(2 * np.pi * u * 2)))  # 6 mm growth rings, nearly straight
    late = np.clip(rings, 0, 1) ** 6
    early, latewood = np.array([0.90, 0.79, 0.61]), np.array([0.80, 0.66, 0.47])
    tiles["lumber"] = _tile("lumber", (early + (latewood - early) * late[..., None]) * (1 + 0.03 * grain)[..., None], dirpath)
    W = 1024
    uu = np.linspace(0, 1, W, endpoint=False)[None, :]
    wob2 = _fbm(rng, N, W, (6, 24), (0.5, 0.5))
    strip = np.floor(v * 8).astype(int)  # 8 strips of 37.5 mm across the 300 mm tile
    tint = (rng.uniform(0.9, 1.08, size=8)[:, None] * np.array([1.0, 0.99, 0.97]))[strip[:, 0]]  # each strip its own shade, never its own hue
    lines = 1 + 0.03 * np.sin(2 * np.pi * (uu * 600 / 3 + 0.3 * wob2))  # 3 mm grain lines along the strip
    seam = np.where(np.abs((v * 8) % 1 - 0.5) > 0.492, 0.78, 1.0)
    maple = np.array([0.78, 0.63, 0.36]) * tint[:, None, :] * (lines * seam + 0.02 * _fbm(rng, N, W, (1, 4), (0.5, 0.5)))[..., None]
    tiles["maple"] = _tile("maple", maple, dirpath)
    M = 256
    vv = np.linspace(0, 1, M, endpoint=False)[:, None]
    ply = np.floor(vv * 6).astype(int)
    glue = (vv * 6) % 1 < 0.06
    base = np.array([0.80, 0.66, 0.45]) * (1 - 0.12 * (ply % 2))[..., None] * (1 + 0.04 * _fbm(rng, M, M, (1, 3), (0.5, 0.5)))[..., None]
    tiles["ply"] = _tile("ply", np.where(np.broadcast_to(glue[..., None], base.shape), np.array([0.40, 0.28, 0.16]), base), dirpath)
    return tiles


TILE_MM = {"paper_blue": 120.0, "paper_white": 120.0, "lumber": 300.0, "maple": 300.0, "ply": 108.0}


# --------------------------------------------------------------------------- blender

def material(name, rgb, rough, metallic=0.0, image=None, alpha=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if image is not None:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = image
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if alpha:
            nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
            m.surface_render_method = "BLENDED"
    return m


def srgb(h):
    return tuple(((int(h[i:i + 2], 16) / 255) / 12.92 if int(h[i:i + 2], 16) / 255 <= 0.04045
                  else (((int(h[i:i + 2], 16) / 255) + 0.055) / 1.055) ** 2.4) for i in (0, 2, 4))


def add_uv(me, offset, scale, along, keys):
    """Planar UVs per face, in absolute mm / scale so tiles line up across neighbouring boxes;
    u follows `along` (the wood grain) when that axis lies in the face."""
    layer = me.uv_layers.new(name="UVMap")
    for poly, key in zip(me.polygons, keys):
        a, b = PLANE[key[1]]
        if along == b:
            a, b = b, a
        for li in poly.loop_indices:
            p = me.vertices[me.loops[li].vertex_index].co + offset
            layer.data[li].uv = (getattr(p, a) / scale, getattr(p, b) / scale)


FACES = {"-x": (0, 1, 3, 2), "+x": (4, 6, 7, 5), "-y": (0, 4, 5, 1), "+y": (2, 3, 7, 6),
         "-z": (0, 2, 6, 4), "+z": (1, 5, 7, 3)}  # vertex index = 4*sx + 2*sy + sz


def box_mesh(name, ext, mats, face_mat=None, uv=None, along="x"):
    """An axis-aligned box centred on its own origin. mats: materials; face_mat: {face: index}."""
    x0, x1, y0, y1, z0, z1 = ext
    centre = Vector(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    hx, hy, hz = (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2
    v = [(sx * hx, sy * hy, sz * hz) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], list(FACES.values()))
    me.validate()
    for m in mats:
        me.materials.append(m)
    for poly, key in zip(me.polygons, FACES):
        poly.material_index = (face_mat or {}).get(key, 0)
    if uv:
        add_uv(me, centre, uv, along, list(FACES))
    return me, centre


def tear_line(seed=3, n=30):
    """The far web's tear at the splice, bottom to top: a random walk that wanders a few mm
    either way with a slight lean, serrated at fibre scale so the white core reads as torn
    paper rather than a cut."""
    rng = random.Random(seed)
    x, pts = SPLICE - 3.0, []
    for i in range(n + 1):
        z = T + (TOP_Z - T) * i / n
        x += rng.uniform(-1.4, 1.4) + (0.3 if i < n / 2 else -0.3)
        pts.append((x + (0.5 if i % 2 else -0.5), z))
    return pts


TEAR = tear_line()  # x, z along the tear


def prism_mesh(name, poly_xz, y0, y1, mats, face_mat=None, uv=None):
    """An XZ polygon extruded from y0 to y1 (torn web halves, A-frame legs). face_mat keys:
    -y, +y (the caps), side."""
    n = len(poly_xz)
    verts = [(x, y0, z) for x, z in poly_xz] + [(x, y1, z) for x, z in poly_xz]
    faces = [list(range(n))[::-1], [n + i for i in range(n)]]  # −y cap, +y cap
    faces += [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.flip_normals()  # every caller hands a CCW polygon, which builds the prism inside-out
    for m in mats:
        me.materials.append(m)
    keys = ["-y", "+y"] + ["side"] * n
    for poly, key in zip(me.polygons, keys):
        poly.material_index = (face_mat or {}).get(key, 0)
    xs, zs = [x for x, _ in poly_xz], [z for _, z in poly_xz]
    centre = Vector(((min(xs) + max(xs)) / 2, (y0 + y1) / 2, (min(zs) + max(zs)) / 2))  # bbox centre, like the boxes
    for v in me.vertices:
        v.co -= centre
    if uv:
        layer = me.uv_layers.new(name="UVMap")
        for poly, key in zip(me.polygons, keys):
            for li in poly.loop_indices:
                p = me.vertices[me.loops[li].vertex_index].co + centre
                layer.data[li].uv = (p.z / uv, p.x / uv) if key != "side" else ((p.z + 0.2 * p.x) / uv, (p.y + 0.2 * p.x) / uv)
    return me, centre


class Part:
    """Accumulates primitives into one bmesh with per-face materials (the steel bits)."""

    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []

    def _tag(self, mat, smooth=False):
        if mat not in self.mats:
            self.mats.append(mat)
        idx = self.mats.index(mat)
        for f in self.bm.faces:
            if not f.tag:
                f.material_index, f.tag, f.smooth = idx, True, smooth

    def box(self, size, at, mat, rot=None):
        m = Matrix.Translation(Vector(at)) @ (rot or Matrix.Identity(4)) @ Matrix.Diagonal((*size, 1.0))
        bmesh.ops.create_cube(self.bm, size=1.0, matrix=m)
        self._tag(mat)

    def cyl(self, r, h, at, mat, axis="Z", segs=32):
        rot = {"Z": Matrix.Identity(4), "X": Matrix.Rotation(math.pi / 2, 4, "Y"), "Y": Matrix.Rotation(math.pi / 2, 4, "X")}[axis]
        m = Matrix.Translation(Vector(at)) @ rot
        res = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r, radius2=r, depth=h, matrix=m)
        self._tag(mat, smooth=True)
        for f in self.bm.faces:  # flat caps
            if f.material_index == self.mats.index(mat) and len(f.verts) > 4:
                f.smooth = False

    def mesh(self, name):
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        return me


def link(name, me, parent, loc=(0, 0, 0), rot=(0, 0, 0), part="rig"):
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = loc
    ob.rotation_euler = rot
    if part:
        ob["part"] = part
    return ob


def empty(name, parent, loc=(0, 0, 0), rot=(0, 0, 0), part=None):
    return link(name, None, parent, loc, rot, part)


def build(mats, decal_png):
    root = empty("Bridge", None)
    halves = {"A": empty("Half_A", root), "B": empty("Half_B", root)}
    plan = []
    for name, part, half, ext, blue in pieces():
        up = blue or thin_axis(ext)
        blue = blue or up  # matboard is blue on one side; hidden in the box, up on the sheet
        long_axis = "+y" if part == "diaphragm" else "+x"
        along, across = footprint(ext, up, long_axis)
        plan.append((name, along, across, up, long_axis, blue))
    flat, sheet_h = pack([(n, a, c) for n, a, c, *_ in plan])
    sheet_h = max(sheet_h, SHEET_H)
    sx0, sy0 = LEN / 2 - SHEET_W / 2, -sheet_h / 2  # sheet origin under the bridge
    board = [mats["white"], mats["blue"]]
    objs = {}
    for (name, part, half, ext, _), (_, along, across, up, long_axis, blue) in zip(pieces(), plan):
        if name == "Web_L_B":  # torn halves of the far web share one jagged edge
            me, centre = prism_mesh(name, [(ext[0], T)] + TEAR + [(ext[0], TOP_Z)], ext[2], ext[3], board, {blue: 1}, uv=TILE_MM["paper_blue"])
        elif name == "Web_L_C":
            me, centre = prism_mesh(name, [(ext[1], T), (ext[1], TOP_Z)] + TEAR[::-1], ext[2], ext[3], board, {blue: 1}, uv=TILE_MM["paper_blue"])
        else:
            me, centre = box_mesh(name, ext, board, {blue: 1}, uv=TILE_MM["paper_blue"])
        ob = link(name, me, halves[half], centre, part=part)
        ob["half"] = half
        x0, y0 = flat[name]
        pos = Vector((sx0 + x0 + along / 2, sy0 + y0 + across / 2, T / 2))
        q = flat_rotation(up, long_axis)
        ob["sheet"] = [pos.x / 1000, pos.z / 1000, -pos.y / 1000, q.x, q.z, -q.y, q.w]
        if name not in ("Web_L_B", "Web_L_C"):  # the tear line must not show as a seam
            mod = ob.modifiers.new("Bevel", "BEVEL")
            mod.width, mod.segments, mod.limit_method = 0.2, 1, "ANGLE"
        objs[name] = ob
    # the pencil title on the near web: a decal quad a hair outside the blue face, riding on the web
    if decal_png and os.path.exists(decal_png):
        img = bpy.data.images.load(decal_png)
        x0, x1, y, z0, z1 = DECAL_X[0], DECAL_X[1], -50 - 0.15, T + 0.5, TOP_Z - 0.5
        me = bpy.data.meshes.new("Decal")
        me.from_pydata([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], [], [(0, 1, 2, 3)])
        me.materials.append(material("Pencil", (1, 1, 1), 0.9, image=img, alpha=True))
        layer = me.uv_layers.new(name="UVMap")
        for li, uv in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))):
            layer.data[li].uv = uv
        web = objs["Web_R_A"]
        for v in me.vertices:
            v.co -= web.location
        link("Decal", me, web, part=None)
    # the sheet itself: blue on top, centred under the bridge, top face at Z = 0
    me, centre = box_mesh("Sheet", (sx0, sx0 + SHEET_W, sy0, sy0 + sheet_h, -T, 0), [mats["white"], mats["sheet"]], {"+z": 1}, uv=TILE_MM["paper_white"])
    link("Sheet", me, root, centre, part="sheet")
    build_rig(root, mats)
    root.scale = (0.001, 0.001, 0.001)
    print(f"laid flat on {SHEET_W:.0f} x {sheet_h:.0f} mm")
    return root


# --------------------------------------------------------------------------- test day

def rig_box(name, ext, mat, parent, rot=(0, 0, 0), uv=None, along="x", face_mat=None, mats=None):
    me, centre = box_mesh(name, ext, mats or [mat], face_mat, uv, along)
    return link(name, me, parent, centre, rot)


def frame_geometry():
    """The A-frame in its own plane: ξ along the base, z up. Legs are 2×4s leaning LEG_LEAN in,
    meeting a vertical apex block under the beam; the crossbar carries the plywood stack."""
    t = math.tan(LEG_LEAN)
    wf = LUMBER[1] / math.cos(LEG_LEAN)  # a leg's horizontal width
    inner = lambda z: (APEX_Z - 15 - z) * t  # ξ of a leg's inner face at height z: the legs meet under the pad
    return t, wf, inner


def build_frame(i, x, root, M):
    t, wf, inner = frame_geometry()
    fr = empty(f"Frame_{i}", root, (x, 0, 0), (0, 0, FRAME_YAW), part="rig")
    zb, za = BENCH_Z, APEX_Z - 15
    for s, tag, top in ((-1, "F", za), (1, "B", za - 60)):  # the front leg carries the pad; the back leg butts its side
        poly = [(s * inner(zb), zb), (s * (inner(zb) + wf), zb), (s * (inner(top) + wf), top), (s * inner(top), top)]
        me, centre = prism_mesh(f"Leg_{i}{tag}", poly if s > 0 else poly[::-1], -LUMBER[0] / 2, LUMBER[0] / 2, [M["lumber"]], uv=TILE_MM["lumber"])
        link(f"Leg_{i}{tag}", me, fr, centre)
    rig_box(f"Pad_{i}", (-wf - 5, 5, -50, 50, za, APEX_Z), M["ply"], fr, uv=TILE_MM["ply"], face_mat={"+z": 1, "-z": 1}, mats=[M["ply"], M["ply_face"]])
    # the sill lies beside the legs and runs out to the bench edge, where the C-clamp grips it (IMG_1642)
    rig_box(f"Sill_{i}", (BENCH_FRONT + 22, inner(zb), LUMBER[0] / 2, LUMBER[0] / 2 + LUMBER[1], zb, zb + LUMBER[0]), M["lumber"], fr, uv=TILE_MM["lumber"])
    zc = STACK[2]  # crossbar: a 2×4 on edge with a flat one on top, the stack top landing at Z = 0
    rig_box(f"Cross_{i}", (-inner(-zc - 80), inner(-zc - 80), -LUMBER[0] / 2, LUMBER[0] / 2, -zc - LUMBER[0] - LUMBER[1], -zc - LUMBER[0]), M["lumber"], fr, uv=TILE_MM["lumber"])
    rig_box(f"Cross_{i}b", (-inner(-zc - 20), inner(-zc - 20), -LUMBER[1] / 2, LUMBER[1] / 2, -zc - LUMBER[0], -zc), M["lumber"], fr, uv=TILE_MM["lumber"])
    rig_box(f"Stack_{i}", (-STACK[0] / 2, STACK[0] / 2, -STACK[1] / 2, STACK[1] / 2, -zc, 0), M["ply"], fr, uv=TILE_MM["ply"],
            face_mat={"+z": 1, "-z": 1}, mats=[M["ply"], M["ply_face"]])
    # kicker brace on the back leg: a plywood strip from the leg's outer face down to the bench
    top = Vector((inner(zb + 250) + wf, zb + 250))
    foot = Vector((inner(zb) + wf + 260, zb))
    d = foot - top
    rig_box(f"Kick_{i}", (-d.length / 2, d.length / 2, LUMBER[0] / 2, LUMBER[0] / 2 + 12, -45, 45), M["ply"], fr,
            rot=(0, math.atan2(-d.y, d.x), 0), uv=TILE_MM["ply"])
    kick = bpy.data.objects[f"Kick_{i}"]
    kick.location = ((top.x + foot.x) / 2, kick.location.y, (top.y + foot.y) / 2)
    # the C-clamp holding the sill's end to the bench edge (axis-aligned to the bench, so not under the frame)
    sill_c = LUMBER[0] / 2 + LUMBER[1] / 2  # η of the sill's centre line
    fx = x - sill_c * math.sin(FRAME_YAW)  # η turns toward −X under the 90° yaw
    clamp = Part()
    y_bar, screw = BENCH_FRONT - 28, BENCH_FRONT + 48
    jaw = screw + 12
    z_lo, z_hi, z_pad = BENCH_Z - 45 - 30, BENCH_Z + 75, BENCH_Z + LUMBER[0] + 2.5
    clamp.box((22, 12, z_hi - z_lo), (0, y_bar, (z_lo + z_hi) / 2), M["iron"])
    clamp.box((22, jaw - y_bar, 20), (0, (y_bar + jaw) / 2, z_lo + 10), M["iron"])
    clamp.box((22, jaw - y_bar, 20), (0, (y_bar + jaw) / 2, z_hi - 10), M["iron"])
    clamp.cyl(6, z_hi + 30 - z_pad, (0, screw, (z_hi + 30 + z_pad) / 2), M["iron"])
    clamp.cyl(11, 5, (0, screw, z_pad - 2.5), M["iron"])
    clamp.cyl(4, 70, (0, screw, z_hi + 26), M["iron"], axis="X")
    assert BENCH_FRONT < -(inner(zb) + wf) - 30, "the front foot hangs over the bench edge"
    link(f"Clamp_{i}", clamp.mesh(f"Clamp_{i}"), root, (fx, 0, 0))
    return fr


def wheel_mesh(M):
    w = Part()
    w.cyl(WHEEL_R, 8, (0, 0, 0), M["wheel"])
    w.cyl(6, 10.5, (0, 0, 0), M["nut"], segs=16)
    return w.mesh("Wheel")


def build_train(root, M):
    train = empty("Train", root, (0, 0, DECK), part="rig")  # wheels on the deck; the cars carry their own X
    wheel = wheel_mesh(M)
    rz = RAIL_Z - DECK
    for k, cx in enumerate(CAR_X0):
        car = empty(f"Car_{k}", train, (cx, 0, 0), part="rig")
        body = Part()
        body.box((280, 75, 75), (0, 0, 49.5), M["black"])  # welded steel box, 280 × 75 × 75
        body.cyl(4, 98, (AXLE, 0, WHEEL_R), M["nut"], axis="Y", segs=12)
        body.cyl(4, 98, (-AXLE, 0, WHEEL_R), M["nut"], axis="Y", segs=12)
        body.cyl(6, 198, (0, 0, 87 + 99), M["black"], segs=16)  # the threaded rod
        body.cyl(17, 3, (0, 0, 151.5), M["nut"], segs=24)  # washer
        body.cyl(10.5, 9, (0, 0, 157.5), M["nut"], segs=6)  # nut
        body.box((16, 6, 108), (-125, 0, 87 + 54), M["black"])  # the tether post: flat bar on the rear end
        body.cyl(5, 6, (-125, 0, 195), M["black"], axis="Y", segs=12)  # its eye
        if k < 2:  # the coupling bar to the car behind
            body.box((80, 12, 5), (-170, 0, 50), M["black"])
        link(f"Body_{k}", body.mesh(f"Body_{k}"), car)
        for ax in (AXLE, -AXLE):
            for side in (1, -1):
                link(f"Wheel_{k}_{int(ax)}_{side}", wheel.copy(), car, (ax, side * 45.5, WHEEL_R), (math.pi / 2, 0, 0))  # own copy: the scale apply refuses shared meshes
        # each car's tether hangs from a clip that slides along the rail with it (the cable is added after scaling)
        carrier = empty(f"Carrier_{k}", train, (cx, 0, 0), part="rig")
        rig_box(f"Clip_{k}", (-33, -17, -27, 27, rz - 26, rz - 4), M["black"], carrier)
    rig_box("Rail", (-1000, 1650, -12.5, 12.5, rz - 22, rz), M["black"], train)  # 22 mm flat bar against the beam
    return train


def build_rig(root, M):
    rig = empty("Rig", root, part="rig")
    floor_z = BENCH_Z - BENCH_H
    rig_box("Floor", (-2700, 2400, -1500, 1500, floor_z - 10, floor_z), M["floor"], rig)
    for i, (x0, x1) in enumerate(BENCHES):  # maple lab benches: slab top, apron, square legs
        yf, yb = BENCH_FRONT, BENCH_FRONT + BENCH_D
        rig_box(f"Bench_{i}", (x0, x1, yf, yb, BENCH_Z - 45, BENCH_Z), M["maple"], rig, uv=TILE_MM["maple"])
        for j, (ya, yb_) in enumerate(((yf + 15, yf + 40), (yb - 40, yb - 15))):
            rig_box(f"Apron_{i}{j}", (x0 + 15, x1 - 15, ya, yb_, BENCH_Z - 45 - 90, BENCH_Z - 45), M["maple"], rig, uv=TILE_MM["maple"])
        for j, (xa, xb) in enumerate(((x0 + 15, x0 + 40), (x1 - 40, x1 - 15))):
            rig_box(f"Apron_{i}{j + 2}", (xa, xb, yf + 40, yb - 40, BENCH_Z - 45 - 90, BENCH_Z - 45), M["maple"], rig, uv=TILE_MM["maple"], along="y")
        for j, (lx, ly) in enumerate(((x0 + 20, yf + 20), (x1 - 90, yf + 20), (x0 + 20, yb - 90), (x1 - 90, yb - 90))):
            rig_box(f"BenchLeg_{i}{j}", (lx, lx + 70, ly, ly + 70, floor_z, BENCH_Z - 45), M["maple"], rig, uv=TILE_MM["maple"], along="z")
    for i, x in enumerate(SUPPORT):
        build_frame(i, x, rig, M)
    rig_box("Beam", (-1300, 1700, -25, 25, APEX_Z, APEX_Z + 50), M["steel"], rig)
    # the staging board the train waits on, level with the deck, on two 2×4 posts
    rig_box("Stage", (-1110, -8, -70, 70, DECK - LUMBER[0], DECK), M["lumber"], rig, uv=TILE_MM["lumber"])
    for j, px in enumerate((-1000, -120)):
        rig_box(f"Post_{j}", (px - LUMBER[1] / 2, px + LUMBER[1] / 2, -LUMBER[0] / 2, LUMBER[0] / 2, BENCH_Z, DECK - LUMBER[0]), M["lumber"], rig, uv=TILE_MM["lumber"], along="z")
    for j, (ta, tb) in enumerate(((-620, -470), (-250, -140))):
        rig_box(f"Tape_{j}", (ta, tb, -40, 70, DECK, DECK + 0.3), M["tape_green"], rig)
    rig_box("Exit", (LEN + 8, 2090, -70, 70, DECK - LUMBER[0], DECK), M["lumber"], rig, uv=TILE_MM["lumber"])  # where a car that made it rolls off to
    for j, px in enumerate((1380, 1980)):
        rig_box(f"ExitPost_{j}", (px - LUMBER[1] / 2, px + LUMBER[1] / 2, -LUMBER[0] / 2, LUMBER[0] / 2, BENCH_Z, DECK - LUMBER[0]), M["lumber"], rig, uv=TILE_MM["lumber"], along="z")
    build_train(rig, M)


def sag(x):
    """Deck drop at x (mm) once the splice has let go: each half hinged about its support."""
    if x <= SUPPORT[0] or x >= SUPPORT[1]:
        return 0.0
    return -(x - SUPPORT[0]) / (SPLICE - SUPPORT[0]) * DROP if x < SPLICE else -(SUPPORT[1] - x) / (SUPPORT[1] - SPLICE) * DROP


def cable_points(p0, p3, n=26):
    """A slack tether: cubic from the car's post up to the rail, bulging forward and out."""
    p1 = p0 + Vector((200, -40, 60))
    p2 = p3 + Vector((170, -40, -40))
    pts = []
    for i in range(n):
        t = i / (n - 1)
        pts.append((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3)
    return pts


def tube(pts, r, segs, verts, faces, mat, caps=False):
    """Ring a polyline; appends to verts/faces, returns nothing. Frames from a global up so
    successive rings do not twist."""
    base = len(verts)
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        a = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        n = t.cross(a).normalized()
        b = t.cross(n)
        for k in range(segs):
            ph = 2 * math.pi * k / segs
            verts.append(p + r * (math.cos(ph) * n + math.sin(ph) * b))
    for i in range(len(pts) - 1):
        for k in range(segs):
            faces.append(([base + i * segs + k, base + i * segs + (k + 1) % segs,
                           base + (i + 1) * segs + (k + 1) % segs, base + (i + 1) * segs + k], mat))
    if caps:
        faces.append(([base + k for k in range(segs)][::-1], mat))
        faces.append(([base + (len(pts) - 1) * segs + k for k in range(segs)], mat))


def cable_mesh(name, p0, p3, p0_drop, parent, M):
    """One tether as a mesh in its carrier's frame (metres), optionally with a `drop` shape key
    for the break: the car end moves to p0_drop (where the eye ends up on the sagging, pitched
    car), the rail end stays. Sleeves and tape at both ends."""
    def geometry(p0):
        verts, faces = [], []
        pts = cable_points(p0, p3)
        tube(pts, 3.0, 8, verts, faces, "cable")
        for lo, hi in ((0.02, 0.09), (0.91, 0.98)):  # aluminium ferrules
            tube(_slice(pts, lo, hi), 5.0, 12, verts, faces, "sleeve", caps=True)
        for lo, hi in ((0.09, 0.14), (0.86, 0.91)):  # the yellow tape
            tube(_slice(pts, lo, hi), 5.5, 12, verts, faces, "tape", caps=True)
        return [v * 0.001 for v in verts], faces
    verts, faces = geometry(p0)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], [f for f, _ in faces])
    me.validate()
    mats = ["cable", "sleeve", "tape"]
    for m in mats:
        me.materials.append(M[m])
    for poly, (_, m) in zip(me.polygons, faces):
        poly.material_index = mats.index(m)
        poly.use_smooth = True
    ob = link(name, me, parent)
    if p0_drop is None:
        return ob, None
    verts_drop, _ = geometry(p0_drop)
    ob.shape_key_add(name="Basis", from_mix=False)
    key = ob.shape_key_add(name="drop", from_mix=False)
    for i, v in enumerate(verts_drop):
        key.data[i].co = v
    return ob, key


def _slice(pts, lo, hi):
    n = len(pts)
    return pts[int(lo * (n - 1)):int(hi * (n - 1)) + 1]


def car_at_break(k):
    """Where car k's centre is when the splice lets go: the lead car on the splice, the second
    340 behind it; the third never left the staging board."""
    return BREAK_X - 340.0 * k if k < 2 else CAR_X0[k]


def car_pose(cx, k=1.0):
    """(z, pitch) of a car centred at cx on the sagged deck, k = break progress — the same
    numbers animate() keys, so the tethers land on the eyes."""
    z1, z2 = sag(cx - AXLE) * k, sag(cx + AXLE) * k
    return (z1 + z2) / 2, math.atan2(z1 - z2, 2 * AXLE)


def build_cables(M):
    """After scaling: one tether per car from its post up to its clip on the rail, in the
    carrier's frame (mm → m). The two cars on the span at the break get a `drop` key."""
    rz = RAIL_Z - DECK
    keys = {}
    eye = Vector((-125, 0, 195))  # car-local
    for k in range(3):
        carrier = bpy.data.objects[f"Carrier_{k}"]
        p3 = Vector((-25, 0, rz - 22))
        eye_drop = None
        if k < 2:
            zc, pitch = car_pose(car_at_break(k))
            eye_drop = Vector((0, 0, zc)) + Matrix.Rotation(pitch, 3, "Y") @ eye
        _, key = cable_mesh(f"Cable_{k}", eye, p3, eye_drop, carrier, M)
        if key:
            keys[k] = key
    train = bpy.data.objects["Train"]
    train["speed"] = TRAIN_SPEED / 1000
    train["axle"] = AXLE / 1000
    return keys


# --------------------------------------------------------------------------- animation

def linear(ob):
    ad = ob.animation_data
    if ad and ad.action:
        for fc in ad.action.fcurves if hasattr(ad.action, "fcurves") else ad.action.layers[0].strips[0].channelbag(ad.action_slot).fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def animate(keys):
    """Keyframe the staged run in metres (after scaling): car 0 crosses alone and is pushed
    back; cars 0+1 cross together until the lead car sits on the splice; then the break."""
    sc = bpy.context.scene
    sc.render.fps = FPS
    O = bpy.data.objects
    x0 = [x / 1000 for x in CAR_X0]
    park, brk = PARK_X / 1000, BREAK_X / 1000
    f1a = 1 + round((PARK_X - CAR_X0[0]) / TRAIN_SPEED * FPS)  # the lone car is off the far end
    f1b = f1a + round(0.5 * FPS)
    f1c = f1b + round((PARK_X - CAR_X0[0]) / RETURN_SPEED * FPS)  # and back at the start
    f2 = f1c + round(0.6 * FPS)
    f_break = f2 + round((BREAK_X - CAR_X0[0]) / TRAIN_SPEED * FPS)
    nb = round(BREAK_T * FPS)
    f_end = f_break + nb + round(HOLD_T * FPS)
    sc.frame_start, sc.frame_end = 1, f_end
    train = O["Train"]
    for name, f in (("t_back", f1b), ("t_pass2", f2), ("t_break", f_break)):
        train[name] = f / FPS  # the exporter stamps frame f at f/FPS
    cars = [O[f"Car_{k}"] for k in range(3)]
    carriers = [O[f"Carrier_{k}"] for k in range(3)]
    xkeys = {0: [(1, x0[0]), (f1a, park), (f1b, park), (f1c, x0[0]), (f2, x0[0]), (f_break, brk)],
             1: [(1, x0[1]), (f2, x0[1]), (f_break, x0[1] + brk - x0[0])],
             2: [(1, x0[2])]}
    for k in range(3):
        for f, x in xkeys[k]:
            for ob in (cars[k], carriers[k]):
                ob.location = (x, 0, 0)
                ob.keyframe_insert("location", frame=f)
        cars[k].rotation_euler = (0, 0, 0)
        cars[k].keyframe_insert("rotation_euler", frame=1)

    def x_at(k, f):  # the piecewise-linear x the keys above give
        ks = xkeys[k]
        for (fa, xa), (fb, xb) in zip(ks, ks[1:]):
            if fa <= f <= fb:
                return xa + (xb - xa) * (f - fa) / (fb - fa)
        return ks[-1][1]

    tilt = Quaternion((1, 0, 0), math.pi / 2)
    wheels = []
    for k in range(2):  # car 2 never moves
        for ob in [o for o in cars[k].children if o.name.startswith("Wheel_")]:
            ob.rotation_mode = "QUATERNION"
            wheels.append(ob)
            for f in range(1, f_break + 1):
                spin = (x_at(k, f) - x0[k]) * 1000 / WHEEL_R
                ob.rotation_quaternion = tilt @ Quaternion((0, 0, 1), -spin)  # local Z is the axle, pointing −Y
                ob.keyframe_insert("rotation_quaternion", frame=f)
    halves = {"A": (O["Half_A"], SUPPORT[0]), "B": (O["Half_B"], SUPPORT[1])}
    flap = O["Top_Flap"]
    flap_rest = flap.location.copy()
    # the short B half swings 19° about its support, so its web ends move ~17 mm into the A
    # half's near the top: the parted webs slide past each other sideways instead of through
    slip = {O["Web_R_B"]: -0.0025, O["Web_L_C"]: 0.0025}
    slip_rest = {ob: ob.location.copy() for ob in slip}
    for f in list(range(f_break, f_break + nb + 1)) + [1]:
        t = 0 if f == 1 else min(1, (f - f_break) / nb)
        k = t * t * (3 - 2 * t)
        for half, (ob, px) in halves.items():
            phi = math.asin(DROP * k / (SPLICE - SUPPORT[0])) if half == "A" else -math.asin(DROP * k / (SUPPORT[1] - SPLICE))
            R = Matrix.Rotation(phi, 3, "Y")
            P = Vector((px / 1000, 0, 0))
            ob.location = P - R @ P
            ob.rotation_euler = (0, phi, 0)
            ob.keyframe_insert("location", frame=f)
            ob.keyframe_insert("rotation_euler", frame=f)
        R = Matrix.Rotation(-FLAP_LIFT * k, 3, "Y")  # the flap folds up about its hinge on Half_A
        P = Vector((FLAP / 1000, 0, TOP_Z / 1000))
        flap.location = P + R @ (flap_rest - P)
        flap.rotation_euler = (0, -FLAP_LIFT * k, 0)
        flap.keyframe_insert("location", frame=f)
        flap.keyframe_insert("rotation_euler", frame=f)
        for ob, dy in slip.items():
            ob.location = slip_rest[ob] + Vector((0, dy * k, 0))
            ob.keyframe_insert("location", frame=f)
        if f == 1:
            continue
        for c in range(2):  # the two cars on the span ride the sag
            cx = car_at_break(c)
            zc, pitch = car_pose(cx, k)
            cars[c].location = (cx / 1000, 0, zc / 1000)
            cars[c].rotation_euler = (0, pitch, 0)
            cars[c].keyframe_insert("location", frame=f)
            cars[c].keyframe_insert("rotation_euler", frame=f)
            keys[c].value = k
            keys[c].keyframe_insert("value", frame=f)
    for ob in [flap, *wheels, *cars, *carriers, *slip] + [h for h, _ in halves.values()]:
        linear(ob)
    sc.frame_set(1)
    return f2, f_break, f_end


# --------------------------------------------------------------------------- export

def to_metres(root):
    """Bake the mm → m scale by hand: every parent inverse is identity by construction, so
    scaling locations, vertices and bevel widths is the whole job (transform_apply mangled the
    Train → Car parent inverses)."""
    for ob in root.children_recursive:
        ob.location *= 0.001
        if ob.type == "MESH":
            for v in ob.data.vertices:
                v.co *= 0.001
            for mod in ob.modifiers:
                if mod.type == "BEVEL":
                    mod.width *= 0.001
    root.scale = (1, 1, 1)
    bpy.context.view_layer.update()
    assert abs(bpy.data.objects["Car_0"].matrix_world.translation.z - DECK / 1000) < 1e-6, "the train is off the deck"


def export_glb(root, path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in [root] + root.children_recursive:
        ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True, export_apply=True,
        export_extras=True, export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6, export_lights=False, export_cameras=False,
        export_yup=True, export_image_format="JPEG", export_jpeg_quality=82,
        export_animations=True, export_animation_mode="ACTIVE_ACTIONS",
        export_nla_strips_merged_animation_name="testday", export_force_sampling=True,
        export_frame_step=1, export_morph=True)


def check_glb(path):
    with open(path, "rb") as f:
        f.seek(12)
        ln = struct.unpack("<I", f.read(4))[0]
        f.seek(20)
        js = json.loads(f.read(ln))
    nodes = [n for n in js["nodes"] if "extras" in n and "part" in n["extras"]]
    pieces_ = [n for n in nodes if n["extras"]["part"] not in ("sheet", "rig")]
    names = sorted(n["name"] for n in pieces_)
    assert len(pieces_) == 32 and len(set(names)) == 32, f"expected 32 pieces, got {len(pieces_)}"
    assert sum(n["extras"]["part"] == "sheet" for n in nodes) == 1, "no sheet"
    train = next(n for n in nodes if n["name"] == "Train")
    assert all(k in train["extras"] for k in ("t_back", "t_pass2", "t_break", "axle")) and sum(n["name"].startswith("Car_") for n in nodes) == 3, "no train"
    for n in pieces_:
        assert n["extras"]["half"] in ("A", "B"), n["name"]
        assert len(n["extras"]["sheet"]) == 7, n["name"]
    assert not any("scale" in n for n in js["nodes"]), "a node kept a scale: the mm → m apply did not reach it"
    anims = js.get("animations", [])
    assert len(anims) == 1 and anims[0]["name"] == "testday", f"animations: {[a.get('name') for a in anims]}"
    paths = [c["target"]["path"] for c in anims[0]["channels"]]
    assert paths.count("translation") >= 10 and paths.count("rotation") >= 12 and paths.count("weights") == 2, paths
    assert "KHR_draco_mesh_compression" in js.get("extensionsRequired", []), "no draco"
    size = os.path.getsize(path)
    assert size < 1_800_000, f"GLB too big: {size}"
    print(f"GLB ok: {len(js['nodes'])} nodes, {len(js['meshes'])} meshes, {len(js.get('images', []))} images, "
          f"{len(anims[0]['channels'])} channels, {size} bytes")


# --------------------------------------------------------------------------- renders

def piece_objects(root):
    return [ob for ob in root.children_recursive if ob.get("part") not in (None, "sheet", "rig")]


def lay_flat(root, on):
    """Move every piece to its laid-flat pose (or back) — for the previews."""
    for ob in piece_objects(root):
        if not ob.get("rest"):
            ob["rest"] = [*ob.location, *ob.rotation_quaternion]
        ob.rotation_mode = "QUATERNION"
        if on:
            x, y, z, qx, qy, qz, qw = ob["sheet"]
            ob.location = (x, -z, y)  # back from glTF to Blender
            ob.rotation_quaternion = (qw, qx, -qz, qy)
        else:
            r = ob["rest"]
            ob.location, ob.rotation_quaternion = r[:3], r[3:]


def studio(target, distance, azimuth, elevation, lens=45):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.eevee.taa_render_samples = 64
    sc.eevee.use_shadows = True
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.30, 0.30, 0.30, 1)
    sc.world = world
    for name, energy, loc, size in (("Key", 200, (1.0, -1.6, 2.0), 1.6), ("Fill", 80, (-1.8, -0.8, 1.2), 2.4),
                                     ("Rim", 110, (0.6, 1.6, 1.6), 1.4)):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.size = energy, size
        lt = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(lt)
        lt.location = loc
        lt.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    backdrop = bpy.data.meshes.new("Backdrop")
    backdrop.from_pydata([(-6, -6, -0.0013), (6, -6, -0.0013), (6, 6, -0.0013), (-6, 6, -0.0013)], [], [(0, 1, 2, 3)])
    backdrop.materials.append(material("Backdrop", (0.55, 0.54, 0.52), 0.95))
    bd = bpy.data.objects.new("Backdrop", backdrop)
    bpy.context.scene.collection.objects.link(bd)
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    cam.data.lens = lens
    bpy.context.scene.collection.objects.link(cam)
    sc.camera = cam
    aim(cam, target, distance, azimuth, elevation)
    return cam, bd


def aim(cam, target, distance, azimuth, elevation):
    a, e = math.radians(azimuth), math.radians(elevation)
    loc = Vector(target) + distance * Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))
    cam.location = loc
    cam.rotation_euler = (Vector(target) - loc).to_track_quat("-Z", "Y").to_euler()


def shoot(path, w, h, fmt="PNG", quality=88):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.image_settings.file_format = fmt
    if fmt == "JPEG":
        sc.render.image_settings.quality = quality
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def save_blend(root, path):
    """The whole scene for opening in Blender: everything renderable again, textures packed,
    every 3D viewport in material preview, the timeline at frame 1."""
    for ob in root.children_recursive:
        ob.hide_render = False
    if not bpy.context.scene.camera:
        studio((0.628, 0.0, 0.16), 2.4, -100, 11, lens=40)
    for bd in bpy.data.objects:
        if bd.name == "Backdrop":
            bd.hide_render = bd.hide_viewport = True
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces[0].shading.type = "MATERIAL"
    bpy.context.scene.frame_set(1)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(path))


# --------------------------------------------------------------------------- main

def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", required=True)
    ap.add_argument("--poster")
    ap.add_argument("--testday-poster")
    ap.add_argument("--preview")
    ap.add_argument("--blend", help="also save the scene, for opening in Blender")
    ap.add_argument("--decal", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "decal-web.png"))
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    tiles = make_tiles(tempfile.mkdtemp(prefix="bridge-tiles-"))  # packed into the .blend, embedded in the GLB
    mats = {"blue": material("Board_Blue", (1, 1, 1), 0.85, image=tiles["paper_blue"]),
            "white": material("Board_White", (1, 1, 1), 0.9, image=tiles["paper_white"]),
            "sheet": material("Board_Sheet", srgb("22406e"), 0.9),
            "lumber": material("Lumber", (1, 1, 1), 0.75, image=tiles["lumber"]),
            "maple": material("Maple", (1, 1, 1), 0.55, image=tiles["maple"]),
            "ply": material("Plywood", (1, 1, 1), 0.8, image=tiles["ply"]),
            "ply_face": material("Plywood_Face", srgb("d9b585"), 0.8),
            "floor": material("Floor", srgb("6b716c"), 0.9),
            "steel": material("Galvanized", srgb("a3a6a4"), 0.45, metallic=0.6),
            "black": material("Black_Steel", srgb("141416"), 0.55, metallic=0.4),
            "iron": material("Cast_Iron", srgb("1a1a1c"), 0.65, metallic=0.3),
            "wheel": material("Wheel", srgb("c4c6c8"), 0.35, metallic=0.7),
            "nut": material("Bright_Steel", srgb("8d9093"), 0.5, metallic=0.6),
            "cable": material("Cable", srgb("5a5d60"), 0.55, metallic=0.5),
            "sleeve": material("Ferrule", srgb("d0d2d4"), 0.35, metallic=0.6),
            "tape": material("Tape_Yellow", srgb("f2c516"), 0.6),
            "tape_green": material("Tape_Green", srgb("3d9c58"), 0.7)}
    root = build(mats, args.decal)
    to_metres(root)
    bpy.context.view_layer.update()
    keys = build_cables(mats)
    f2, f_break, f_end = animate(keys)
    f_two = f2 + round((600 - CAR_X0[0]) / TRAIN_SPEED * FPS)  # pass 2, both cars on the span
    export_glb(root, args.out)
    check_glb(args.out)
    if args.poster or args.preview or args.testday_poster:
        sc = bpy.context.scene
        sheet = next(ob for ob in root.children if ob.get("part") == "sheet")
        sheet.hide_render = True
        rig = [ob for ob in root.children_recursive if ob.get("part") == "rig"]
        def show_rig(on):
            for ob in rig:
                ob.hide_render = not on
            bd.hide_render = on
        cam, bd = studio((1.02, 0.0, 0.04), 0.78, -38, 20, lens=40)
        show_rig(False)
        if args.poster:
            shoot(args.poster, 1600, 1000, "JPEG")
        if args.testday_poster:
            show_rig(True)
            sc.frame_set(f_two)
            aim(cam, (0.628, 0.0, 0.16), 2.4, -100, 11)
            shoot(args.testday_poster, 1600, 1000, "JPEG")
            sc.frame_set(1)
            show_rig(False)
        if args.preview:
            os.makedirs(args.preview, exist_ok=True)
            aim(cam, (0.628, 0.0, 0.04), 1.45, -128, 30)
            shoot(os.path.join(args.preview, "assembled.png"), 1400, 900)
            aim(cam, (0.628, 0.0, 0.04), 1.2, -90, 12)
            shoot(os.path.join(args.preview, "end.png"), 1400, 900)
            aim(cam, (0.628, 0.0, 0.04), 0.5, -80, 14)
            shoot(os.path.join(args.preview, "title.png"), 1400, 900)
            for ob in piece_objects(root):
                if ob.get("part") in ("top", "layer"):
                    ob.hide_render = True
            aim(cam, (0.628, 0.0, 0.04), 1.55, -132, 34)
            shoot(os.path.join(args.preview, "inside.png"), 1400, 900)
            for ob in piece_objects(root):
                ob.hide_render = False
            show_rig(True)
            sc.frame_set(f_two)
            aim(cam, (0.628, 0.0, 0.15), 2.3, -112, 14)
            shoot(os.path.join(args.preview, "testday.png"), 1400, 900)
            aim(cam, (0.05, 0.0, -0.05), 0.9, -120, 16)
            shoot(os.path.join(args.preview, "frame.png"), 1400, 900)
            aim(cam, (0.45, 0.0, 0.2), 0.9, -105, 8)
            shoot(os.path.join(args.preview, "train.png"), 1400, 900)
            sc.frame_set(f_end)
            aim(cam, (1.0, 0.0, 0.05), 0.8, -70, 18)
            shoot(os.path.join(args.preview, "collapse.png"), 1400, 900)
            aim(cam, (0.628, 0.0, 0.15), 2.3, -112, 14)
            shoot(os.path.join(args.preview, "collapse_wide.png"), 1400, 900)
            sc.frame_set(1)
            show_rig(False)
            lay_flat(root, True)
            sheet.hide_render = False
            aim(cam, (0.628, 0.0, 0.0), 1.9, -100, 62)
            shoot(os.path.join(args.preview, "laid_flat.png"), 1400, 900)
            lay_flat(root, False)
    if args.blend:
        save_blend(root, args.blend)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
