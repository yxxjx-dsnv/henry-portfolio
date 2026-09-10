"""Build the PHY180 pendulum rig as a GLB, from the report and the photos.

Run headless:
  Blender -b -P tools/pendulum/build_pendulum.py -- --out public/media/pendulum/pendulum.glb \
      [--poster public/media/pendulum/fig-lab-render.jpg]

The rig as built (report §2.1): an acrylic wrist rest (284 × 97 × 15 mm) on the
shelf edge, the laptop on it as ballast, a plastic protractor taped to the
rest's front face with the pivot at its origin, an orange thread with knots
every 50 mm, and the ~70 g 8-ball keychain (r = 21 mm) as the bob; lined paper
behind as the backdrop.

Rig nodes (three.js drives them): `Arm` — rotate about Z (glTF) by the swing
angle; `Thread` — a 1 m cylinder hanging from the pivot, scale.y = string
length; `Bob` — position.y = −L. Everything else is static. Origin = pivot,
metres, glTF Y-up (Blender Z-up converted on export).
"""
import argparse
import json
import math
import os
import struct
import sys

import bpy
from mathutils import Matrix, Vector

L0 = 0.221  # pivot to bob centre, the report's reference length
BOB_R = 0.021


def srgb(h):
    return tuple(((int(h[i:i + 2], 16) / 255) / 12.92 if int(h[i:i + 2], 16) / 255 <= 0.04045
                  else (((int(h[i:i + 2], 16) / 255) + 0.055) / 1.055) ** 2.4) for i in (0, 2, 4))


def material(name, hexcol, rough, metallic=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*srgb(hexcol), 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    return m


def link(name, me, parent, loc=(0, 0, 0), rot=(0, 0, 0)):
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = loc
    ob.rotation_euler = rot
    return ob


def empty(name, parent, loc=(0, 0, 0)):
    return link(name, None, parent, loc)


def box(name, size, at, mat, parent, rot=(0, 0, 0)):
    sx, sy, sz = size
    v = [(a * sx / 2, b * sy / 2, c * sz / 2) for a in (-1, 1) for b in (-1, 1) for c in (-1, 1)]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], faces)
    me.validate()
    me.materials.append(mat)
    ob = link(name, me, parent, at, rot)
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width, mod.segments, mod.limit_method = 0.0008, 2, "ANGLE"
    return ob


def lathe(name, profile, mat, parent, at=(0, 0, 0), rot=(0, 0, 0), segs=48, smooth=True):
    """Surface of revolution about local Z from a list of (radius, z)."""
    verts, faces = [], []
    n = len(profile)
    for r, z in profile:
        for i in range(segs):
            a = 2 * math.pi * i / segs
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for j in range(n - 1):
        for i in range(segs):
            k = (i + 1) % segs
            faces.append((j * segs + i, j * segs + k, (j + 1) * segs + k, (j + 1) * segs + i))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    me.materials.append(mat)
    return link(name, me, parent, at, rot)


def half_disc(name, r_in, r_out, thick, mat, parent, at, segs=64):
    """A flat half annulus (the protractor and its scale band), lying in XZ below z=0, faces ±Y."""
    verts, faces = [], []
    for y in (-thick / 2, thick / 2):
        for i in range(segs + 1):
            a = math.pi + math.pi * i / segs  # from 180° round the bottom to 360°
            for r in (r_in, r_out):
                verts.append((r * math.cos(a), y, r * math.sin(a)))
    per = 2 * (segs + 1)
    for i in range(segs):
        i0, i1 = 2 * i, 2 * (i + 1)
        faces.append((i0, i0 + 1, i1 + 1, i1))  # back face
        faces.append((per + i0, per + i1, per + i1 + 1, per + i0 + 1))  # front face
        faces.append((i0 + 1, per + i0 + 1, per + i1 + 1, i1 + 1))  # outer rim
        faces.append((i0, i1, per + i1, per + i0))  # inner rim
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.materials.append(mat)
    return link(name, me, parent, at)


def build():
    M = {
        "wood": material("Shelf", "b98a55", 0.7),
        "acrylic": material("Acrylic", "e8ecef", 0.15, alpha=0.45),
        "laptop": material("Laptop", "c9ccd0", 0.35, metallic=0.8),
        "protractor": material("Protractor", "dfe6ee", 0.2, alpha=0.5),
        "scale": material("Scale", "2a2d33", 0.6),
        "paper": material("Paper", "f4f2ec", 0.9),
        "tape": material("Tape", "f0efe8", 0.4, alpha=0.6),
        "thread": material("Thread", "d9822b", 0.7),
        "bob": material("Bob", "0b0b0d", 0.18),
        "decal": material("Decal", "f2f2f2", 0.4),
    }
    rig = empty("Rig", None)
    # the shelf edge the rest sits on; +Y is away from the camera, pivot at the origin
    box("Shelf", (0.90, 0.32, 0.024), (0.0, 0.16, -0.012), M["wood"], rig)
    box("ShelfFront", (0.90, 0.006, 0.09), (0.0, -0.003, -0.045 - 0.024), M["wood"], rig)
    box("WristRest", (0.284, 0.097, 0.015), (0.0, 0.0485, 0.0075), M["acrylic"], rig)
    box("Laptop", (0.304, 0.215, 0.016), (0.0, 0.11, 0.023), M["laptop"], rig)
    # protractor: r 60 mm plastic half disc hanging from the rest's front face, scale band inside the rim
    half_disc("Protractor", 0.012, 0.062, 0.0015, M["protractor"], rig, (0, -0.0105, 0))
    half_disc("ProtractorScale", 0.046, 0.058, 0.0006, M["scale"], rig, (0, -0.0117, 0))  # printed on the front face
    for x in (-0.05, 0.05):  # tape holding it on
        box(f"Tape{'L' if x < 0 else 'R'}", (0.02, 0.001, 0.02), (x, -0.0118, 0.0), M["tape"], rig)
    # the lined-paper backdrop taped under the shelf, behind the swing
    box("Paper", (0.30, 0.0008, 0.285), (0.0, 0.03, -0.024 - 0.1425 - 0.02), M["paper"], rig)

    # the pendulum: Arm rotates, Thread scales to the string length, Bob rides at -L
    arm = empty("Arm", rig, (0, -0.0105, 0))  # the swing plane, just in front of the shelf fascia
    thread = lathe("Thread", [(0.0004, 0.0), (0.0004, -1.0)], M["thread"], arm, segs=8, smooth=False)
    thread.scale = (1, 1, L0 - BOB_R)
    for k in range(1, 7):  # knots every 50 mm, where the bob can be re-tied
        lathe(f"Knot_{k}", [(0.0, -0.0012), (0.0012, 0.0), (0.0, 0.0012)], M["thread"], arm, at=(0, 0, -0.05 * k), segs=8)
    bob = empty("Bob", arm, (0, 0, -L0))
    lathe("BobBall", [(0.0, -BOB_R)] + [(BOB_R * math.sin(t), -BOB_R * math.cos(t)) for t in
                       [math.pi * i / 24 for i in range(1, 24)]] + [(0.0, BOB_R)], M["bob"], bob, segs=48)
    lathe("BobEight", [(0.0, 0.0), (0.0075, 0.0)], M["decal"], bob, at=(0, -BOB_R - 0.0002, 0),
          rot=(math.pi / 2, 0, 0), segs=32, smooth=False)  # the white circle of the 8-ball, facing the camera
    lathe("BobRing", [(0.004, 0.0), (0.004, 0.006)], M["laptop"], bob, at=(0, 0, BOB_R - 0.001), segs=16)  # keychain eyelet
    return rig


def export_glb(root, path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in [root] + root.children_recursive:
        ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", use_selection=True, export_apply=True,
        export_extras=True, export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6, export_lights=False, export_cameras=False,
        export_yup=True)


def check_glb(path):
    with open(path, "rb") as f:
        f.seek(12)
        ln = struct.unpack("<I", f.read(4))[0]
        f.seek(20)
        js = json.loads(f.read(ln))
    names = [n.get("name") for n in js["nodes"]]
    for need in ("Rig", "Arm", "Thread", "Bob", "BobBall", "Protractor"):
        assert names.count(need) == 1, f"node {need}: {names.count(need)}"
    assert "KHR_draco_mesh_compression" in js.get("extensionsRequired", [])
    size = os.path.getsize(path)
    assert size < 400_000, size
    print(f"GLB ok: {len(js['nodes'])} nodes, {size} bytes")


def render_poster(path):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.eevee.taa_render_samples = 64
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.35, 0.34, 0.33, 1)
    sc.world = world
    for name, energy, loc, size in (("Key", 120, (0.5, -0.8, 0.6), 1.0), ("Fill", 50, (-0.8, -0.6, 0.2), 1.4)):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.size = energy, size
        lt = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(lt)
        lt.location = loc
        lt.rotation_euler = (Vector((0, 0, -0.12)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    wall = box("Wall", (2.0, 0.01, 1.4), (0, 0.33, -0.2), material("Wall", "e9e4dc", 0.9), None)
    wall.hide_viewport = False
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    cam.data.lens = 45
    bpy.context.scene.collection.objects.link(cam)
    sc.camera = cam
    loc = Vector((0.30, -0.58, -0.02))
    cam.location = loc
    cam.rotation_euler = (Vector((0.0, 0, -0.10)) - loc).to_track_quat("-Z", "Y").to_euler()
    # a mid-swing pose reads better than dead centre
    bpy.data.objects["Arm"].rotation_euler = (0, 0.42, 0)
    sc.render.resolution_x, sc.render.resolution_y = 1600, 1000
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 88
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", required=True)
    ap.add_argument("--poster")
    args = ap.parse_args(argv)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    rig = build()
    export_glb(rig, args.out)
    check_glb(args.out)
    if args.poster:
        render_poster(args.poster)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
