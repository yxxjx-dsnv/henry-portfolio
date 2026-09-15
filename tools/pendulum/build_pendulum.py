"""Build the PHY180 pendulum rig as a GLB, from the report (§2.1) and the photographs.

Run headless:
  Blender -b -P tools/pendulum/build_pendulum.py -- --out public/media/pendulum/pendulum.glb \
      [--poster public/media/pendulum/fig-lab-render.jpg] [--preview DIR] [--blend FILE.blend]

The rig as built: the oak desk hutch, the frosted acrylic wrist rest (97 × 284 × 15) lying out over the
shelf edge with the thread wound round it and dropping through the notch at its top-front
edge, the MacBook on it as ballast, a clear 10 cm protractor taped to the rest's front face
with its origin at that notch, an A3 sheet of lined paper taped under the shelf as the
backdrop, the orange thread with knots every 50 mm, and the ~70 g 8-ball keychain as the bob.

Rig nodes (three.js drives them): `Arm` — rotate about Z (glTF) by the swing angle; `Thread`
— a 1 m cylinder hanging from the pivot, scale.y = string length; `Bob` — position.y = −L.
Everything else is static. Origin = the pivot (the protractor's origin), modelled in mm and
baked to metres, glTF Y-up. Scene frame: X across, +Y toward the wall, Z up.
"""
import argparse
import json
import math
import os
import struct
import sys
import tempfile

import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from blendkit import Part, aim, box_mesh, empty, export_glb, fbm, link, material, shoot, srgb, tile_image, to_metres  # noqa: E402

L0 = 221.0  # pivot to bob centre, the report's reference length
BOB_R = 21.0
REST = (97.0, 284.0, 15.0)  # across × front-to-back × thick: it lies lengthwise, out from under the laptop
LAPTOP = (312.0, 221.0, 15.5)
LAPTOP_FRONT = 120.0  # how far back from the rest's front edge the laptop starts
SHELF_EDGE = 60.0  # the rest overhangs the shelf by this much
PROT_R = 50.0
PAPER = (420.0, 297.0)  # A3 landscape
SWING_Y = -4.0  # the swing plane, just in front of the protractor


# --------------------------------------------------------------------------- textures / materials

def make_tiles(dirpath):
    os.makedirs(dirpath, exist_ok=True)
    rng = np.random.default_rng(7)
    N = 1024
    T = {}
    # oak: streaks along u (the shelf's length), fine grain across
    streak = np.repeat(fbm(rng, N, N // 16, (2, 6), (0.6, 0.4)), 16, axis=1)
    fine = fbm(rng, N, N, (1,), (1,))
    oak = np.array([0.86, 0.66, 0.40])[None, None, :] * (1 + 0.07 * streak + 0.02 * fine)[..., None]
    T["oak"] = tile_image("oak", oak, dirpath)
    # textured wallpaper
    wall = np.array([0.90, 0.88, 0.84])[None, None, :] * (1 + 0.025 * fbm(rng, N, N, (1, 2), (0.6, 0.4)))[..., None]
    T["wall"] = tile_image("wall", wall, dirpath)
    # the lined pad: one texture = 420 mm square, a faint line every 8 mm
    mm = np.linspace(0, 420, N, endpoint=False)[:, None]
    paper = np.ones((N, N, 3)) * np.array([0.965, 0.96, 0.945])
    paper *= (1 + 0.012 * fbm(rng, N, N, (1,), (1,)))[..., None]
    line = (np.mod(mm, 8.0) < 0.45)[..., None]  # (N, 1, 1): a row every 8 mm, not a column
    paper = np.where(np.broadcast_to(line, paper.shape), np.array([0.62, 0.68, 0.80]), paper)
    T["paper"] = tile_image("paper", paper, dirpath)
    # the desk mat
    mat = np.array([0.075, 0.078, 0.082])[None, None, :] * (1 + 0.06 * fbm(rng, N, N, (1,), (1,)))[..., None]
    T["mat"] = tile_image("mat", mat, dirpath)
    # the MacBook lid: silver, the Apple mark at its centre — one 312 mm tile, the logo 45 mm tall
    M2 = 1024
    lx = (np.linspace(0, 1, M2, endpoint=False)[None, :] - 0.5) * LAPTOP[0] / 21.0  # units of the logo's half height
    ly = (np.linspace(0, 1, M2, endpoint=False)[:, None] - 0.5) * LAPTOP[0] / 21.0
    ly = ly[::-1]  # row 0 is the top of the tile (+y, the hinge side)
    disc = lambda cx, cy, r: (lx - cx) ** 2 + (ly - cy) ** 2 < r * r
    body = disc(-0.32, 0.18, 0.52) | disc(0.32, 0.18, 0.52) | disc(-0.28, -0.35, 0.5) | disc(0.28, -0.35, 0.5) | disc(0, -0.1, 0.62)
    body &= ~disc(0.74, 0.12, 0.30)  # the bite
    ca, sa = math.cos(math.radians(-38)), math.sin(math.radians(-38))
    u, v = (lx - 0.30) * ca - (ly - 1.02) * sa, (lx - 0.30) * sa + (ly - 1.02) * ca
    leaf = (u / 0.14) ** 2 + (v / 0.34) ** 2 < 1
    lid = np.ones((M2, M2, 3)) * np.array([0.80, 0.81, 0.83])
    lid = np.where(np.broadcast_to((body | leaf)[..., None], lid.shape), np.array([0.16, 0.16, 0.17]), lid)
    T["lid"] = tile_image("lid", lid, dirpath)
    # the protractor scale: 100 × 50 mm, ticks every degree round the rim, printed on the plastic
    W, H = 1024, 512
    x = np.linspace(-PROT_R, PROT_R, W, endpoint=False)[None, :] + PROT_R / W
    z = -np.linspace(0, PROT_R, H, endpoint=False)[:, None] - PROT_R / H / 2  # row 0 = z 0 (the top)
    r = np.hypot(x, z)
    a = np.degrees(np.arctan2(-z, x))  # 0° at the right, 180° at the left, through the bottom
    off = np.abs(a - np.round(a))
    ticks = ((off < 0.22) & (r > 47.6) & (r < 49.4)) | ((np.abs(a - 5 * np.round(a / 5)) < 0.22) & (r > 46.4) & (r < 49.4)) \
        | ((np.abs(a - 10 * np.round(a / 10)) < 0.25) & (r > 45.0) & (r < 49.4))
    rims = (np.abs(r - 49.4) < 0.18) | (np.abs(r - 45.0) < 0.18) | (np.abs(r - 36.0) < 0.15) | (np.abs(r - 6.5) < 0.2)
    ink = (ticks | rims) & (r <= 49.6)
    scale = np.zeros((H, W, 3)) + 0.15
    T["scale"] = tile_image("scale", scale, dirpath, alpha=ink.astype(float))
    return T


def materials(T):
    return {
        "oak": material("Oak", (1, 1, 1), 0.55, image=T["oak"]),
        "wall": material("Wallpaper", (1, 1, 1), 0.95, image=T["wall"]),
        "paper": material("Paper", (1, 1, 1), 0.9, image=T["paper"]),
        "mat": material("DeskMat", (1, 1, 1), 0.85, image=T["mat"]),
        "scale": material("Scale", (1, 1, 1), 0.5, image=T["scale"], alpha=True),
        "acrylic": material("Acrylic", srgb("e6ebee"), 0.5, alpha=0.55),
        "plastic": material("Protractor", srgb("dfe8ef"), 0.08, alpha=0.32),
        "tape": material("Tape", srgb("ffffff"), 0.45, alpha=0.35),
        "laptop": material("Laptop", (1, 1, 1), 0.32, metallic=0.85, image=T["lid"]),
        "dark": material("Dark", srgb("2a2b2e"), 0.45, metallic=0.6),
        "thread": material("Thread", srgb("d98a2b"), 0.75),
        "bob": material("Bob", srgb("0a0a0c"), 0.12),
        "white": material("White", srgb("f4f4f2"), 0.35),
        "ink": material("Ink", srgb("1c1c1e"), 0.6),
        "steel": material("Steel", srgb("b8bcc0"), 0.35, metallic=0.9),
        "board": material("Board", srgb("6e5238"), 0.85),
    }


# --------------------------------------------------------------------------- pieces

def half_annulus(name, r_in, r_out, thick, mat, parent, at, segs=96, uv=None):
    """A flat half annulus in XZ below z = 0 (faces ±Y); planar UVs (x, z) over 100 × 50 mm if uv."""
    verts, faces = [], []
    for y in (-thick / 2, thick / 2):
        for i in range(segs + 1):
            a = math.pi + math.pi * i / segs
            for r in (r_in, r_out):
                verts.append((r * math.cos(a), y, r * math.sin(a)))
    per = 2 * (segs + 1)
    for i in range(segs):
        i0, i1 = 2 * i, 2 * (i + 1)
        faces.append((i0, i0 + 1, i1 + 1, i1))
        faces.append((per + i0, per + i1, per + i1 + 1, per + i0 + 1))
        faces.append((i0 + 1, per + i0 + 1, per + i1 + 1, i1 + 1))
        faces.append((i0, i1, per + i1, per + i0))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.materials.append(mat)
    if uv:
        layer = me.uv_layers.new(name="UVMap")
        for poly in me.polygons:
            for li in poly.loop_indices:
                p = me.vertices[me.loops[li].vertex_index].co
                layer.data[li].uv = ((p.x + PROT_R) / (2 * PROT_R), (p.z + PROT_R) / PROT_R)
    return link(name, me, parent, at)


def outline_mesh(name, poly, z0, z1, mat, parent, loc=(0, 0, 0), rot=(0, 0, 0), uv_scale=None):
    """A polygon extruded z0..z1 with planar UVs (x, y) / uv_scale centred on the origin."""
    n = len(poly)
    verts = [(x, y, z0) for x, y in poly] + [(x, y, z1) for x, y in poly]
    faces = [list(range(n))[::-1], [n + i for i in range(n)]] + [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.materials.append(mat)
    if uv_scale:
        layer = me.uv_layers.new(name="UVMap")
        for poly_ in me.polygons:
            for li in poly_.loop_indices:
                q = me.vertices[me.loops[li].vertex_index].co
                layer.data[li].uv = (q.x / uv_scale + 0.5, q.y / uv_scale + 0.5)
    return link(name, me, parent, loc, rot)


def rounded_rect(w, h, r, segs=6):
    """Counter-clockwise outline of a w × h rectangle with corners of radius r, centred."""
    out = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(segs + 1):
            a = math.radians(a0 + 90 * i / segs)
            out.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return out


def text_mesh(name, body, size, mat, parent, loc, rot):
    """Blender's built-in font, converted to a flat mesh so the mm → m bake reaches it."""
    cu = bpy.data.curves.new(name, "FONT")
    cu.body, cu.size = body, size
    cu.align_x = cu.align_y = "CENTER"
    tmp = bpy.data.objects.new(name + "_font", cu)
    bpy.context.scene.collection.objects.link(tmp)
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(tmp)
    bpy.data.curves.remove(cu)
    me.materials.append(mat)
    return link(name, me, parent, loc, rot)


def bevel(ob, width, segments=3):
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width, mod.segments, mod.limit_method = width, segments, "ANGLE"
    return ob


def part(name, p, parent, loc=(0, 0, 0), rot=(0, 0, 0)):
    return link(name, p.mesh(name), parent, loc, rot)


def build(M):
    rig = empty("Rig", None)
    # the hutch: shelf slab with a rounded front, wood board under it, wallpaper above, the desk and its mat
    me, c = box_mesh("Shelf", (-1200, 1200, SHELF_EDGE, 352, -50, -15), [M["oak"]], uv=600, along="x")
    bevel(link("Shelf", me, rig, c), 4)
    p = Part()
    p.box((2400, 6, 385), (0, 349, -242.5), M["board"])
    part("HutchBack", p, rig)
    me, c = box_mesh("Wall", (-1500, 1500, 352, 356, -450, 520), [M["wall"]], uv=300)
    link("Wall", me, rig, c)
    me, c = box_mesh("Desk", (-1200, 1200, -350, 352, -445, -420), [M["oak"]], uv=600, along="x")
    link("Desk", me, rig, c)
    me, c = box_mesh("Mat", (-330, 330, -330, 220, -420, -418), [M["mat"]], uv=400)
    link("Mat", me, rig, c)
    # the lined paper under the shelf, taped at the top corners and mid-sides
    me, c = box_mesh("Paper", (-PAPER[0] / 2, PAPER[0] / 2, 343.5, 344.0, -52 - PAPER[1], -52), [M["paper"]], uv=420, along="x")
    link("Paper", me, rig, c)
    p = Part()
    for x, z in ((-180, -62), (180, -62), (-PAPER[0] / 2 + 2, -190), (PAPER[0] / 2 - 2, -190)):
        p.box((42, 0.3, 18), (x, 343.2, z), M["tape"])
    part("PaperTape", p, rig)
    # the wrist rest lying out over the shelf edge, its top-front edge the pivot; the thread
    # wound round it three times just behind the notch
    p = Part()
    p.box(REST, (0, REST[1] / 2, -REST[2] / 2), M["acrylic"])
    bevel(part("WristRest", p, rig), 2.5)
    p = Part()
    for y in (22, 34, 46):
        p.box((REST[0] + 1.6, 0.8, 0.8), (0, y, 0.4), M["thread"])
        p.box((REST[0] + 1.6, 0.8, 0.8), (0, y, -REST[2] - 0.4), M["thread"])
        for sx in (-1, 1):
            p.box((0.8, 0.8, REST[2] + 1.6), (sx * (REST[0] / 2 + 0.4), y, -REST[2] / 2), M["thread"])
    part("ThreadWraps", p, rig)
    # the MacBook as ballast, lid closed: a rounded slab with the mark on its lid and the
    # lid/base seam round its side; its front on the rest, its back edge down on the shelf
    tilt = -math.asin(REST[2] / LAPTOP[1])
    R = Matrix.Rotation(tilt, 4, "X")
    back_edge = Vector((0, LAPTOP_FRONT + LAPTOP[1], -REST[2]))
    base = back_edge - (R @ Vector((0, LAPTOP[1] / 2, 0)))
    laptop = outline_mesh("Laptop", rounded_rect(LAPTOP[0], LAPTOP[1], 11), 0, LAPTOP[2], M["laptop"], rig, base, (tilt, 0, 0), uv_scale=LAPTOP[0])
    bevel(laptop, 1.4)
    outline_mesh("LaptopSeam", rounded_rect(LAPTOP[0] + 0.5, LAPTOP[1] + 0.5, 11.25), 7.6, 8.2, M["dark"], rig, base, (tilt, 0, 0))
    # the protractor on the rest's front face, its origin at the notch; its printed scale; the tape
    half_annulus("Protractor", 6.5, PROT_R, 1.5, M["plastic"], rig, (0, -1.85, 0))
    half_annulus("ProtractorScale", 5.5, PROT_R, 0.2, M["scale"], rig, (0, -2.75, 0), uv=True)
    for a in range(0, 181, 10):
        phi = math.radians(360 - a)
        psi = math.atan2(-math.cos(phi), -math.sin(phi))
        text_mesh(f"Deg{a}", str(a), 3.2, M["ink"], rig, (41.5 * math.cos(phi), -2.95, 41.5 * math.sin(phi)), (math.pi / 2, psi, 0))
    p = Part()
    for x in (-30, 30):
        p.box((20, 0.3, 13), (x, -3.0, -7.0), M["tape"])
    part("ProtractorTape", p, rig)

    # the pendulum: Arm rotates, Thread scales to the string length, Bob rides at −L
    arm = empty("Arm", rig, (0, SWING_Y, 0))
    p = Part()
    p.cyl(0.4, 1000, (0, 0, -500), M["thread"], segs=8, smooth=False)
    thread = part("Thread", p, arm)
    thread.scale = (1, 1, (L0 - BOB_R) / 1000)
    p = Part()
    for k in range(1, 7):  # knots every 50 mm, where the bob is re-tied for the length runs
        p.sphere(1.1, (0, 0, -50 * k), M["thread"], segs=10)
    part("Knots", p, arm)
    bob = empty("Bob", arm, (0, 0, -L0))
    p = Part()
    p.sphere(BOB_R, (0, 0, 0), M["bob"], segs=48)
    part("BobBall", p, bob)
    p = Part()
    p.cyl(7.5, 2.0, (0, -BOB_R + 0.9, 0), M["white"], axis="Y", segs=32)  # the 8-ball's white circle, sunk into the ball
    part("BobCircle", p, bob)
    text_mesh("BobEight", "8", 9.5, M["ink"], bob, (0, -BOB_R - 0.3, -0.3), (math.pi / 2, 0, 0))
    p = Part()
    p.cyl(2.2, 5, (0, 0, BOB_R + 1.5), M["steel"], segs=16)  # keychain eyelet
    p.cyl(4.5, 1.2, (0, 0, BOB_R + 5.5), M["steel"], axis="Y", segs=20, r2=4.5)  # its split ring, edge on
    part("BobRing", p, bob)
    return rig


# --------------------------------------------------------------------------- checks / renders

def check_glb(path):
    with open(path, "rb") as f:
        f.seek(12)
        ln = struct.unpack("<I", f.read(4))[0]
        f.seek(20)
        js = json.loads(f.read(ln))
    names = [n.get("name") for n in js["nodes"]]
    for need in ("Rig", "Arm", "Thread", "Bob", "BobBall", "Protractor", "Deg90", "Paper"):
        assert names.count(need) == 1, f"node {need}: {names.count(need)}"
    assert "KHR_draco_mesh_compression" in js.get("extensionsRequired", [])
    size = os.path.getsize(path)
    assert size < 900_000, size
    print(f"GLB ok: {len(js['nodes'])} nodes, {len(js.get('images', []))} images, {size} bytes")


def lights(target):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.eevee.taa_render_samples = 64
    sc.eevee.use_shadows = True
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.32, 0.31, 0.30, 1)
    sc.world = world
    for name, energy, loc, size in (("Key", 140, (0.55, -0.9, 0.55), 1.0), ("Fill", 60, (-0.9, -0.7, 0.1), 1.4),
                                     ("Top", 45, (0.0, -0.3, 0.9), 1.2)):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.size = energy, size
        lt = bpy.data.objects.new(name, data)
        sc.collection.objects.link(lt)
        lt.location = loc
        lt.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    cam.data.lens = 40
    sc.collection.objects.link(cam)
    sc.camera = cam
    return cam


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", required=True)
    ap.add_argument("--poster")
    ap.add_argument("--preview")
    ap.add_argument("--blend")
    args = ap.parse_args(argv)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    tiles = make_tiles(tempfile.mkdtemp(prefix="pendulum-tex-"))
    rig = build(materials(tiles))
    to_metres(rig)
    export_glb(rig, args.out)
    check_glb(args.out)
    if args.poster or args.preview:
        cam = lights((0, 0, -0.14))
        bpy.data.objects["Arm"].rotation_euler = (0, 0.42, 0)  # mid-swing reads better than dead centre
        if args.poster:
            aim(cam, (0.0, 0.02, -0.10), 0.80, -106, 26)
            shoot(args.poster, 1600, 1000, "JPEG")
        if args.preview:
            os.makedirs(args.preview, exist_ok=True)
            aim(cam, (0.0, 0.0, -0.03), 0.26, -92, 4)
            shoot(os.path.join(args.preview, "protractor.png"), 1400, 900)
            aim(cam, (0.0, 0.0, -0.18), 1.1, -125, 14)
            shoot(os.path.join(args.preview, "overview.png"), 1400, 900)
            aim(cam, (0.0, 0.2, 0.0), 0.7, -100, 48)
            shoot(os.path.join(args.preview, "laptop.png"), 1400, 900)
    if args.blend:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.blend))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
