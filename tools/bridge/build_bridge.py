"""Build the Holy Bridge (CIV102 Team 107 matboard box girder) as a rigged GLB.

Run headless:
  Blender -b -P tools/bridge/build_bridge.py -- --out public/media/civ102-bridge/bridge.glb \
      [--poster public/media/civ102-bridge/fig-bridge-render.jpg] [--preview DIR]

Every piece from the engineering assembly is one mesh object (32 pieces + sheet + test-day rig),
blue matboard face out, white core/back. Each piece carries glTF extras:
  part   top | layer | web | soffit | diaphragm | patch | tab | sheet
  half   A (X < 1016 mm) | B (X > 1016) — the top-flange splice the bridge failed at
         (Web_R_B runs 240–1256 and is tagged A; bisect it at 1016 if phase B needs it)
  sheet  [x, y, z, qx, qy, qz, qw] laid-flat pose on the matboard sheet, glTF frame
The site's BridgeStudio lerps every piece between its rest pose and `sheet`.

Units: modelled in mm, exported in metres (glTF Y-up). X runs along the span,
Y across, Z up, soffit underside at Z = 0. Design spec: docs/superpowers/specs/
2026-09-10-holy-bridge-studio-design.md.
"""
import argparse
import json
import math
import os
import struct
import sys

import bpy
from mathutils import Matrix, Vector

T = 1.27  # matboard thickness, mm
LEN = 1256.0
SPLICE = 1016.0  # every full-length piece is 1016 + 240: the sheet is 1016 long
FLAP = 936.0  # where the top sheet hinged up when the splice let go
SUPPORT = (28.0, 1228.0)  # support-plate centres, 1200 c/c (handout §1.5), 50 mm plates
INNER = 100.0 - 2 * T  # between the webs
TOP_Z = 78.77  # underside of the top sheet
SHEET_W, SHEET_H = 1016.0, 813.0  # the one matboard sheet
DIAPH_X = (50, 281, 512, 743, 991, 1041, 1141, 1226)
LAYERS = (("L1", 45.0, 1211.0), ("L2", 265.5, 990.5), ("L3", 408.0, 848.0))  # nested under the top

AXIS = {"+x": Vector((1, 0, 0)), "-x": Vector((-1, 0, 0)), "+y": Vector((0, 1, 0)),
        "-y": Vector((0, -1, 0)), "+z": Vector((0, 0, 1)), "-z": Vector((0, 0, -1))}


# --------------------------------------------------------------------------- pieces

def layers_above(x):
    return sum(1 for _, a, b in LAYERS if a <= x <= b)


def pieces():
    """(name, part, half, (x0, x1, y0, y1, z0, z1), blue face) for every piece, mm."""
    P = []
    half = lambda x0, x1: "A" if x1 <= SPLICE + 1e-6 else ("B" if x0 >= SPLICE - 1e-6 else "A")
    P.append(("Soffit_A", "soffit", "A", (0, SPLICE, -50, 50, 0, T), "-z"))
    P.append(("Soffit_B", "soffit", "B", (SPLICE, LEN, -50, 50, 0, T), "-z"))
    # the two webs are spliced at opposite ends (1016 | 240 on the left, 240 | 1016
    # on the right) so the seams never line up across the section
    P.append(("Web_L_A", "web", "A", (0, SPLICE, 50 - T, 50, T, TOP_Z), "+y"))
    P.append(("Web_L_B", "web", "B", (SPLICE, LEN, 50 - T, 50, T, TOP_Z), "+y"))
    P.append(("Web_R_A", "web", "A", (0, LEN - SPLICE, -50, -50 + T, T, TOP_Z), "-y"))
    P.append(("Web_R_B", "web", "A", (LEN - SPLICE, SPLICE, -50, -50 + T, T, TOP_Z), "-y"))
    P.append(("Web_R_C", "web", "B", (SPLICE, LEN, -50, -50 + T, T, TOP_Z), "-y"))  # one 1016 strip, torn here on test day
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
    P.append(("Patch_WebL", "patch", "A", (998, 1034, 50 - 2 * T, 50 - T, 22, 58), None))
    P.append(("Patch_WebR", "patch", "A", (222, 258, -50 + T, -50 + 2 * T, 22, 58), None))
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
    if abs(n.dot(l)) > 0.5:  # diaphragms: blue +x, long side +y → keep n, l is fine
        raise ValueError(f"long axis {long_axis} not perpendicular to up face {up}")
    return Matrix((l, n.cross(l), n)).to_quaternion()


def footprint(ext, up, long_axis):
    """(along X, across Y) on the sheet after flat_rotation."""
    size = {"+x": ext[1] - ext[0], "-x": ext[1] - ext[0], "+y": ext[3] - ext[2], "-y": ext[3] - ext[2],
            "+z": ext[5] - ext[4], "-z": ext[5] - ext[4]}
    across = [a for a in ("+x", "+y", "+z") if a != long_axis and a != up.replace("-", "+")][0]
    return size[long_axis], size[across]


# --------------------------------------------------------------------------- blender

def material(name, rgb, rough):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = 0.0
    return m


def srgb(h):
    return tuple(((int(h[i:i + 2], 16) / 255) / 12.92 if int(h[i:i + 2], 16) / 255 <= 0.04045
                  else (((int(h[i:i + 2], 16) / 255) + 0.055) / 1.055) ** 2.4) for i in (0, 2, 4))


def box_mesh(name, ext, blue, mats):
    x0, x1, y0, y1, z0, z1 = ext
    cx, cy, cz = (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2
    hx, hy, hz = (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2
    v = [(sx * hx, sy * hy, sz * hz) for sx in (-1, 1) for sy in (-1, 1) for sz in (-1, 1)]
    # vertex index = 4*sx + 2*sy + sz with s in {0,1}
    faces = {"-x": (0, 1, 3, 2), "+x": (4, 6, 7, 5), "-y": (0, 4, 5, 1), "+y": (2, 3, 7, 6),
             "-z": (0, 2, 6, 4), "+z": (1, 5, 7, 3)}
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], list(faces.values()))
    me.validate()
    me.materials.append(mats["white"])
    me.materials.append(mats["blue"])
    for poly, key in zip(me.polygons, faces.keys()):
        poly.material_index = 1 if key == blue else 0
    return me, Vector((cx, cy, cz))


def build(mats):
    root = bpy.data.objects.new("Bridge", None)
    bpy.context.scene.collection.objects.link(root)
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
    for (name, part, half, ext, _), (_, along, across, up, long_axis, blue) in zip(pieces(), plan):
        me, centre = box_mesh(name, ext, blue, mats)
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = root
        ob.matrix_parent_inverse = Matrix.Identity(4)
        ob.location = centre
        ob["part"], ob["half"] = part, half
        x0, y0 = flat[name]
        pos = Vector((sx0 + x0 + along / 2, sy0 + y0 + across / 2, T / 2))
        q = flat_rotation(up, long_axis)
        ob["sheet"] = [pos.x / 1000, pos.z / 1000, -pos.y / 1000, q.x, q.z, -q.y, q.w]
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width, mod.segments, mod.limit_method = 0.2, 1, "ANGLE"
    # the sheet itself: blue on top, centred under the bridge, top face at Z = 0
    me, centre = box_mesh("Sheet", (sx0, sx0 + SHEET_W, sy0, sy0 + sheet_h, -T, 0), "+z",
                          {"white": mats["white"], "blue": mats["sheet"]})
    sheet = bpy.data.objects.new("Sheet", me)
    bpy.context.scene.collection.objects.link(sheet)
    sheet.parent = root
    sheet.matrix_parent_inverse = Matrix.Identity(4)
    sheet.location = centre
    sheet["part"] = "sheet"
    build_rig(root)
    root.scale = (0.001, 0.001, 0.001)
    print(f"laid flat on {SHEET_W:.0f} x {sheet_h:.0f} mm")
    return root


RIG_MATS = {"ply": ("Plywood", "c9a56b", 0.8), "table": ("Table", "b9884a", 0.7), "wood": ("Lumber", "d9b98a", 0.75),
            "steel": ("Steel", "9a9ea3", 0.35), "car": ("Car", "1b1c1e", 0.5), "wheel": ("Wheel", "b8bcc0", 0.3)}


def rig_box(name, ext, mat, parent, part="rig", rot=None):
    me, centre = box_mesh(name, ext, None, {"white": mat, "blue": mat})
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = centre
    if rot:
        ob.rotation_euler = rot
    ob["part"] = part
    return ob


def build_rig(root):
    """Test-day apparatus (handout §1.5–1.6 + the photos): 50 mm support plates on
    plywood stacks at 1200 c/c, the bench, two A-frames carrying the steel beam,
    and the 400 N train — three cars, axles 176 apart, 164 between cars."""
    M = {k: material(name, srgb(hexcol), rough) for k, (name, hexcol, rough) in RIG_MATS.items()}
    for i, x in enumerate(SUPPORT):
        rig_box(f"Support_{i}", (x - 25, x + 25, -60, 60, -6, 0), M["steel"], root)
        rig_box(f"Stack_{i}", (x - 45, x + 45, -75, 75, -110, -6), M["ply"], root)
    rig_box("Table", (-420, LEN + 420, -360, 360, -145, -110), M["table"], root)
    for i, x in enumerate((-120.0, LEN + 120.0)):  # A-frames: legs spread along the span, meeting under the beam
        for lean in (-0.28, 0.28):
            cx = x - 375 * math.sin(lean)  # 750 mm leg, apex at x
            rig_box(f"Leg_{i}{'+' if lean > 0 else '-'}", (cx - 19, cx + 19, -45, 45, -110, 640), M["wood"], root, rot=(0, lean, 0))
        rig_box(f"Cap_{i}", (x - 60, x + 60, -30, 30, 620, 660), M["wood"], root)
    rig_box("Beam", (-260, LEN + 260, -22, 22, 660, 700), M["steel"], root)
    train = bpy.data.objects.new("Train", None)
    bpy.context.scene.collection.objects.link(train)
    train.parent = root
    train.matrix_parent_inverse = Matrix.Identity(4)
    train.location = (-150, 0, TOP_Z + T)  # lead axle 150 mm short of the bridge, wheels on the deck
    train["part"] = "rig"
    for k, front in enumerate((0.0, -340.0, -680.0)):  # lead axle of each car, from the train origin
        car = bpy.data.objects.new(f"Car_{k}", None)
        bpy.context.scene.collection.objects.link(car)
        car.parent = train
        car.matrix_parent_inverse = Matrix.Identity(4)
        car.location = (front - 88, 0, 0)  # car centre between its axles
        car["part"] = "rig"
        rig_box(f"Body_{k}", (-140, 140, -37.5, 37.5, 22, 85), M["car"], car)
        rig_box(f"Rod_{k}", (-6, 6, -6, 6, 85, 300), M["steel"], car)
        rig_box(f"Nut_{k}", (-14, 14, -14, 14, 120, 134), M["steel"], car)
        for ax in (88, -88):
            for side in (1, -1):
                w = bpy.data.objects.new(f"Wheel_{k}_{ax}_{side}", bpy.data.meshes.new("wheel"))
                w.data.from_pydata(*_disc(17.5, 8.0, 24))
                w.data.validate()
                w.data.materials.append(M["wheel"])
                bpy.context.scene.collection.objects.link(w)
                w.parent = car
                w.matrix_parent_inverse = Matrix.Identity(4)
                w.location = (ax, side * 42.0, 17.5)
                w.rotation_euler = (math.pi / 2, 0, 0)
                w["part"] = "rig"
    return train


def _disc(r, h, n):
    """Verts/edges/faces of a closed cylinder along local Z."""
    verts = [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), z) for z in (-h / 2, h / 2) for i in range(n)]
    faces = [[i, (i + 1) % n, n + (i + 1) % n, n + i] for i in range(n)]
    faces.append(list(range(n))[::-1])
    faces.append([n + i for i in range(n)])
    return verts, [], faces


def apply_scale(root):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in [root] + root.children_recursive:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.select_all(action="DESELECT")


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
    nodes = [n for n in js["nodes"] if "extras" in n and "part" in n["extras"]]
    pieces_ = [n for n in nodes if n["extras"]["part"] not in ("sheet", "rig")]
    names = sorted(n["name"] for n in pieces_)
    assert len(pieces_) == 32 and len(set(names)) == 32, f"expected 32 pieces, got {len(pieces_)}"
    assert sum(n["extras"]["part"] == "sheet" for n in nodes) == 1, "no sheet"
    assert any(n["name"] == "Train" for n in nodes) and sum(n["name"].startswith("Car_") for n in nodes) == 3, "no train"
    for n in pieces_:
        assert n["extras"]["half"] in ("A", "B"), n["name"]
        assert len(n["extras"]["sheet"]) == 7, n["name"]
    assert "KHR_draco_mesh_compression" in js.get("extensionsRequired", []), "no draco"
    size = os.path.getsize(path)
    assert size < 900_000, f"GLB too big: {size}"
    print(f"GLB ok: {len(js['nodes'])} nodes, {len(js['meshes'])} meshes, {size} bytes")


# --------------------------------------------------------------------------- renders

def lay_flat(root, on):
    """Move every piece to its laid-flat pose (or back) — for the previews."""
    for ob in root.children:
        if ob.get("part") in (None, "sheet", "rig"):
            continue
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
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.30, 0.30, 0.30, 1)
    sc.world = world
    for name, energy, loc, size in (("Key", 160, (1.0, -1.4, 1.6), 1.6), ("Fill", 60, (-1.6, -0.6, 0.9), 2.0),
                                     ("Rim", 90, (0.4, 1.4, 1.2), 1.2)):
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
    return cam


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


# --------------------------------------------------------------------------- main

def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", required=True)
    ap.add_argument("--poster")
    ap.add_argument("--preview")
    args = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    mats = {"blue": material("Board_Blue", srgb("34619e"), 0.85),
            "white": material("Board_White", srgb("ece9e2"), 0.9),
            "sheet": material("Board_Sheet", srgb("22406e"), 0.9)}
    root = build(mats)
    apply_scale(root)
    export_glb(root, args.out)
    check_glb(args.out)

    if args.poster or args.preview:
        sheet = next(ob for ob in root.children if ob.get("part") == "sheet")
        sheet.hide_render = True
        rig = [ob for ob in root.children_recursive if ob.get("part") == "rig"]
        for ob in rig:
            ob.hide_render = True
        cam = studio((1.02, 0.0, 0.04), 0.78, -38, 20, lens=40)
        if args.poster:
            shoot(args.poster, 1600, 1000, "JPEG")
        if args.preview:
            os.makedirs(args.preview, exist_ok=True)
            aim(cam, (0.628, 0.0, 0.04), 1.45, -128, 30)
            shoot(os.path.join(args.preview, "assembled.png"), 1400, 900)
            aim(cam, (0.628, 0.0, 0.04), 1.2, -90, 12)
            shoot(os.path.join(args.preview, "end.png"), 1400, 900)
            for ob in root.children:
                if ob.get("part") in ("top", "layer"):
                    ob.hide_render = True
            aim(cam, (0.628, 0.0, 0.04), 1.55, -132, 34)
            shoot(os.path.join(args.preview, "inside.png"), 1400, 900)
            for ob in root.children:
                ob.hide_render = False
            for ob in rig:
                ob.hide_render = False
            aim(cam, (0.628, 0.0, 0.15), 2.3, -112, 14, )
            shoot(os.path.join(args.preview, "testday.png"), 1400, 900)
            for ob in rig:
                ob.hide_render = True
            lay_flat(root, True)
            sheet.hide_render = False
            aim(cam, (0.628, 0.0, 0.0), 1.9, -100, 62)
            shoot(os.path.join(args.preview, "laid_flat.png"), 1400, 900)
            lay_flat(root, False)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
