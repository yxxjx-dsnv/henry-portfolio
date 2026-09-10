"""Build the Incheon ASRS robot as a rigged GLB with headless Blender 5.

    Blender -b -P tools/robot/build_robot.py -- --meshes DIR --out FILE.glb [--preview DIR]

Pipeline: factory-reset scene -> import the four company STLs from --meshes (tray, lifter
plate, long/short gripper; company files stay local, the path is only ever passed on the
CLI) -> build every other part parametrically (bmesh) under named rig Empties -> export the
GLB in the rest pose (tabs closed, deck down, all rig rotations 0) -> self-check the GLB
(node names, xray extras, Draco, size) -> optionally add lights/camera/ground, pose the rig
with the same kinematics three.js uses, and render the review set to --preview.

Frames: Blender X = long axis, Y = short axis, Z = up, metres, origin on the floor at the
robot centre. The glTF export is Y-up, so three.js Z = -Blender Y.
All numbers come from tools/robot/dims.json (DIMS); local layout tweaks live in LAYOUT.

Note: the raw GLB rest pose (all rig rotations 0, scissor bars flat) is NOT a physical pose --
Bar_B passes through the short-axis rails and Bar_A's free end sits in the floor channel until
setLift() is applied (the site does this immediately). Review the --preview renders, which are
posed with the real kinematics, not the raw GLB in a plain viewer.
"""
import argparse
import json
import math
import os
import struct
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, "dims.json")) as f:
    DIMS = json.load(f)

RIG_NODES = [
    "Robot", "Body", "Wheel_FL", "Wheel_FR", "Wheel_RL", "Wheel_RR",
    "Scissor_A_L", "Scissor_A_R", "Deck", "Hub",
    "Tab_XP", "Tab_XN", "Tab_YP", "Tab_YN",
    "Link_XP", "Link_XN", "Link_YP", "Link_YN",
    "Scissor_B_L", "Scissor_B_R",
]
TABS = {"XP": 0.0, "YP": 90.0, "XN": 180.0, "YN": 270.0}  # Blender angle beta (deg)

# Vertical stack under the plate and other placements not fixed by dims.json.
LAYOUT = {
    "rail_z": (0.036, 0.0395), "rail_w": 0.009, "rail_off": 0.0105, "rail_start": 0.072,
    "carriage_z": (0.0395, 0.0455), "carriage": (0.020, 0.024),
    "link_z": {"X": 0.028, "Y": 0.023}, "link_t": 0.004, "link_w": 0.010, "link_bow": 0.022,
    "pin_z": (0.019, 0.0515), "cam_z": (0.031, 0.036), "disc_r": 0.0635,
    "hub_motor": (0.040, 0.040, 0.013), "hub_motor_z": 0.018,
    "screw_z": 0.013, "screw_x": (-0.09, 0.17), "nut_x": 0.165, "screw_motor_x": -0.11,
    "battery": (0.09, 0.06, 0.030), "battery_at": (-0.18, 0.0, 0.020),
    "pcb_at": (0.09, 0.09, 0.008),
    "motor_r": 0.012, "motor_len": 0.058, "motor_y": 0.079, "pillow_y": 0.114,
    "channel_x": (0.10, 0.19),
    "panel_y": -DIMS["body"]["width"] / 2,
}

MATERIALS = {  # name: (hex, metallic, roughness, emission strength)
    "AlumPlate": ("b9bec5", 0.9, 0.35, 0), "BlackPowder": ("141518", 0.25, 0.55, 0),
    "BlueAnodized": ("2e5596", 0.4, 0.55, 0), "Rubber": ("0e0e0e", 0.0, 0.9, 0),
    "Steel": ("c9ccd0", 1.0, 0.28, 0), "MotorBlack": ("25272b", 0.6, 0.4, 0),
    "PCB": ("1d5d38", 0.0, 0.6, 0), "Plastic": ("0a0a0b", 0.0, 0.35, 0),
    "LED": ("35d07f", 0.0, 0.4, 4),
}
MAT = {}


def rad(deg):
    return math.radians(deg)


def srgb(hexstr):
    c = [int(hexstr[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c] + [1.0]


def make_materials():
    for name, (hexstr, metal, rough, emit) in MATERIALS.items():
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = srgb(hexstr)
        b.inputs["Metallic"].default_value = metal
        b.inputs["Roughness"].default_value = rough
        if emit:
            b.inputs["Emission Color"].default_value = srgb(hexstr)
            b.inputs["Emission Strength"].default_value = emit
        MAT[name] = m


# --------------------------------------------------------------------------- scene helpers

def link(name, data, parent, loc=(0, 0, 0), rot=(0, 0, 0), xray=None):
    ob = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = loc
    ob.rotation_euler = rot
    if xray:
        ob["xray"] = xray
    return ob


def empty(name, parent, loc=(0, 0, 0)):
    return link(name, None, parent, loc)


def mark_smooth(bm, angle_deg):
    thr = rad(angle_deg)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        e.smooth = len(e.link_faces) == 2 and e.calc_face_angle(0.0) <= thr


def add_bevel(ob, width=0.0008):
    mod = ob.modifiers.new("Bevel", "BEVEL")
    mod.width, mod.segments, mod.limit_method = width, 2, "ANGLE"


def axis_matrix(axis):
    return {"Z": Matrix.Identity(4), "X": Matrix.Rotation(rad(90), 4, "Y"),
            "Y": Matrix.Rotation(rad(90), 4, "X")}[axis]


class Part:
    """Accumulates primitives into one bmesh with per-face materials."""

    def __init__(self):
        self.bm = bmesh.new()
        self.mats = []

    def _tag(self, mat, faces=None):
        """Assign mat to the given faces, or to every untagged face (bmesh face order is not stable)."""
        if mat not in self.mats:
            self.mats.append(mat)
        idx = self.mats.index(mat)
        for f in faces or (f for f in self.bm.faces if not f.tag):
            f.material_index, f.tag = idx, True

    def cyl(self, r, h, at, mat, axis="Z", segs=32, r2=None, matrix=None):
        m = matrix or Matrix.Translation(Vector(at)) @ axis_matrix(axis)
        bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r,
                              radius2=r if r2 is None else r2, depth=h, matrix=m)
        self._tag(mat)

    def box(self, size, at, mat, matrix=None):
        m = (matrix or Matrix.Translation(Vector(at))) @ Matrix.Diagonal((*size, 1.0))
        bmesh.ops.create_cube(self.bm, size=1.0, matrix=m)
        self._tag(mat)

    def barrel(self, r_of_s, length, matrix, mat, segs=16, rings=14):
        """Solid of revolution along local Z: radius r_of_s(s) at axial coordinate s in [-length/2, length/2]."""
        res = bmesh.ops.create_uvsphere(self.bm, u_segments=segs, v_segments=rings, radius=1.0)
        for v in res["verts"]:
            z = v.co.z
            rho, s = r_of_s(z * length / 2), math.sqrt(max(v.co.x ** 2 + v.co.y ** 2, 1e-12))
            v.co = (v.co.x * rho / s, v.co.y * rho / s, z * length / 2)
        bmesh.ops.transform(self.bm, matrix=matrix, verts=res["verts"])
        self._tag(mat)

    def prism(self, pts, h, mat, matrix=Matrix.Identity(4)):
        """Polygon in XY (list of (x, y)) extruded +Z by h, then transformed."""
        verts = [self.bm.verts.new((x, y, 0.0)) for x, y in pts]
        face = self.bm.faces.new(verts)
        res = bmesh.ops.extrude_face_region(self.bm, geom=[face])
        top = [g for g in res["geom"] if isinstance(g, bmesh.types.BMVert)]
        bmesh.ops.translate(self.bm, verts=top, vec=(0, 0, h))
        faces = list({f for v in verts + top for f in v.link_faces})
        bmesh.ops.recalc_face_normals(self.bm, faces=faces)
        bmesh.ops.transform(self.bm, matrix=matrix, verts=verts + top)
        self._tag(mat, faces)

    def mesh(self, name, smooth=None):
        if smooth is not None:
            mark_smooth(self.bm, smooth)
        me = bpy.data.meshes.new(name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        return me

    def obj(self, name, parent, loc=(0, 0, 0), rot=(0, 0, 0), smooth=None, bevel=False):
        ob = link(name, self.mesh(name, smooth), parent, loc, rot)
        if bevel:
            add_bevel(ob)
        return ob


# --------------------------------------------------------------------------- company STLs

def import_stl(meshes_dir, filename, name, mat, bbox, smooth=None):
    bpy.ops.wm.stl_import(filepath=os.path.join(meshes_dir, filename))
    ob = bpy.context.selected_objects[0]
    me = ob.data
    bpy.data.objects.remove(ob)
    me.name = name
    lo = [min(v.co[i] for v in me.vertices) for i in range(3)]
    hi = [max(v.co[i] for v in me.vertices) for i in range(3)]
    for i, (a, b) in enumerate(bbox):
        assert abs(lo[i] - a) < 1e-3 and abs(hi[i] - b) < 1e-3, f"{filename} bbox axis {i}: {lo[i]}..{hi[i]}"
    if smooth is not None:
        bm = bmesh.new()
        bm.from_mesh(me)
        mark_smooth(bm, smooth)
        bm.to_mesh(me)
        bm.free()
    me.materials.append(MAT[mat])
    return me


def plate_hole_centres(me, top_z, max_perimeter=0.02):
    """Centres of small circular holes in the plate top face (bmesh boundary loops)."""
    bm = bmesh.new()
    bm.from_mesh(me)
    adj = {}
    for e in bm.edges:
        if all(abs(v.co.z - top_z) < 1e-5 for v in e.verts) and \
                sum(1 for f in e.link_faces if f.normal.z > 0.9) == 1:
            a, b = e.verts
            adj.setdefault(a, []).append(b)
            adj.setdefault(b, []).append(a)
    seen, centres = set(), []
    for start in adj:
        if start in seen:
            continue
        loop, cur = [start], start
        seen.add(start)
        while True:
            nxt = [n for n in adj[cur] if n not in seen]
            if not nxt:
                break
            cur = nxt[0]
            seen.add(cur)
            loop.append(cur)
        per = sum((loop[i].co - loop[(i + 1) % len(loop)].co).length for i in range(len(loop)))
        if per < max_perimeter:
            centres.append(sum((v.co for v in loop), Vector()) / len(loop))
    bm.free()
    return centres


# --------------------------------------------------------------------------- parts

def build_wheel_mesh(name, tilt_sign):
    """Mecanum wheel, axle along local Y, outer face at -Y. Returns a mesh."""
    W = DIMS["wheel"]
    P = Part()
    roller_len, ring_r, n = 0.040, 0.024, W["rollers"]
    pin_half, plate_y, plate_t = 0.026, 0.0185, 0.003  # pin ends at |y| 0.0184, inside the plate lobes
    to_y = Matrix.Rotation(rad(-90), 4, "X")  # local Z -> +Y

    def roller_r(s):  # mecanum profile: the 45-degree roller fills the wheel's circular envelope, ends rounded
        return (W["radius"] - math.sqrt(ring_r ** 2 + s * s / 2)) * (1 - (2 * s / roller_len) ** 6) ** (1 / 6)

    end_angles = {1: [], -1: []}
    for i in range(n):
        phi = 2 * math.pi * i / n
        u = Vector((math.cos(phi), 0, math.sin(phi)))
        c = u * ring_r
        m = Matrix.Translation(c) @ Matrix.Rotation(tilt_sign * rad(45), 4, u) @ to_y
        P.barrel(roller_r, roller_len, m, MAT["Rubber"])
        P.cyl(0.0015, 2 * pin_half, None, MAT["Steel"], segs=8, matrix=m)
        axis = (m.to_3x3() @ Vector((0, 0, 1))).normalized()
        for side in (1, -1):
            p = c + axis * (side * pin_half)
            end_angles[side].append(math.atan2(p.z, p.x))
    plate_r, lobe = 0.0265, 0.0025  # lobe tips at r 0.029 = pin-end radius
    for side in (1, -1):
        phase = end_angles[side][0]
        pts = []
        for k in range(120):
            th = 2 * math.pi * k / 120
            r = plate_r + lobe * math.cos(n * (th + phase))  # polygon angle th maps to phi = -th
            pts.append((r * math.cos(th), r * math.sin(th)))
        y0 = plate_y if side > 0 else -(plate_y + plate_t)
        P.prism(pts, plate_t, MAT["Steel"], Matrix.Translation((0, y0, 0)) @ to_y)
        y_head = side * (plate_y + plate_t + 0.00075)
        for i in range(n):
            phi = phase + 2 * math.pi * i / n  # lobe angles on this plate
            P.cyl(0.002, 0.0015, (0.020 * math.cos(phi), y_head, 0.020 * math.sin(phi)),
                  MAT["Steel"], axis="Y", segs=10)
    P.cyl(0.011, 2 * plate_y + 0.002, (0, 0, 0), MAT["MotorBlack"], axis="Y")
    y_out = -(plate_y + plate_t)
    P.cyl(0.007, 0.002, (0, y_out - 0.001, 0), MAT["Steel"], axis="Y")             # flange on the outer (-Y) face
    P.cyl(0.003, 0.001, (0, y_out - 0.002, 0), MAT["BlackPowder"], axis="Y", segs=12)  # bore
    return P.mesh(name, smooth=30)


def build_wheels(body):
    W = DIMS["wheel"]
    meshes = {1: build_wheel_mesh("WheelMesh_P", 1), -1: build_wheel_mesh("WheelMesh_N", -1)}
    for tag, dx, dy in (("FL", 1, 1), ("FR", 1, -1), ("RL", -1, 1), ("RR", -1, -1)):
        e = empty(f"Wheel_{tag}", body, (dx * W["x"], dy * W["y"], W["radius"]))
        link(f"Wheel_{tag}_mesh", meshes[-dx * dy], e, rot=(0, 0, math.pi if dy > 0 else 0))


def build_drive(body):
    """Drive motors, axles, pillow blocks, lead screw + nut + motor, PCB, battery."""
    W, L = DIMS["wheel"], LAYOUT
    P = Part()
    for dx in (1, -1):
        for dy in (1, -1):
            x, z = dx * W["x"], W["radius"]
            P.cyl(L["motor_r"], L["motor_len"], (x, dy * L["motor_y"], z), MAT["MotorBlack"], axis="Y")
            P.cyl(0.004, 0.050, (x, dy * (W["y"] - 0.023), z), MAT["Steel"], axis="Y", segs=12)
            P.box((0.020, 0.012, 0.032), (x, dy * L["pillow_y"], 0.021), MAT["MotorBlack"])
    x0, x1 = L["screw_x"]
    P.cyl(0.003, x1 - x0, ((x0 + x1) / 2, 0, L["screw_z"]), MAT["Steel"], axis="X", segs=12)
    P.box((0.016, 0.024, 0.010), (L["nut_x"], 0, L["screw_z"]), MAT["Steel"])  # top 0.018 < slot-pin bottom 0.019
    P.cyl(0.008, 0.040, (L["screw_motor_x"], 0, L["screw_z"]), MAT["MotorBlack"], axis="X")
    P.box((*L["battery"],), L["battery_at"], MAT["Plastic"])
    px, py, pz = L["pcb_at"]
    P.box((0.06, 0.04, 0.0016), (px, py, pz), MAT["PCB"])
    for cx, cy, s in ((-0.012, 0.005, 0.012), (0.010, -0.008, 0.008), (0.018, 0.010, 0.006)):
        P.box((s, s, 0.003), (px + cx, py + cy, pz + 0.0023), MAT["Plastic"])
    P.obj("Drive", body, smooth=30, bevel=True)


def build_front_panel(body):
    y = LAYOUT["panel_y"]
    z = 0.026
    P = Part()
    for x in (-0.015, 0.010):  # bezel frame 0.020 x 0.013 with the rocker recessed 0.001 in its window
        for dz in (0.00525, -0.00525):
            P.box((0.020, 0.002, 0.0025), (x, y - 0.001, z + dz), MAT["Plastic"])
        for dx in (0.0075, -0.0075):
            P.box((0.005, 0.002, 0.008), (x + dx, y - 0.001, z), MAT["Plastic"])
        P.box((0.010, 0.002, 0.008), (x, y, z), MAT["Plastic"])
    P.cyl(0.008, 0.003, (0.045, y - 0.0015, z), MAT["Steel"], axis="Y")
    P.cyl(0.0055, 0.0006, (0.045, y - 0.0033, z), MAT["LED"], axis="Y")
    P.cyl(0.0040, 0.0010, (0.045, y - 0.0040, z), MAT["Steel"], axis="Y")
    P.obj("FrontPanel", body, smooth=30, bevel=True)


def build_scissor(parent, level, side):
    """One scissor bar. level 'A' (body pivot) or 'B' (deck pivot); side +1 = L, -1 = R."""
    S = DIMS["scissor"]
    z = S["body_pivot_z"] if level == "A" else S["deck_pivot_z"]
    node = empty(f"Scissor_{level}_{side_tag(side)}", parent, (S["pivot_x"], side * S["plane_y"], z))
    y_off = -0.002 * side if level == "A" else 0.002 * side
    P = Part()
    P.box((S["bar_length"], S["bar_thick"], S["bar_height"]), (S["bar_length"] / 2, y_off, 0), MAT["BlackPowder"])
    P.cyl(0.003, 0.010, (0, 0, 0), MAT["Steel"], axis="Y", segs=12)
    P.obj(f"Bar_{level}_{side_tag(side)}", node, smooth=30, bevel=True)
    P = Part()
    P.box((0.016, 0.012, 0.010), (0, 0, 0), MAT["Steel"])
    P.obj(f"Slider_{level}_{side_tag(side)}", node, (S["bar_length"], 0, 0), bevel=True)
    if level == "A":
        P = Part()
        P.cyl(0.003, 0.010, (0, 0, 0), MAT["Steel"], axis="Y", segs=12)
        P.obj(f"Pin_Centre_{side_tag(side)}", node, (S["bar_length"] / 2, 0, 0), smooth=30)
        # No cross shaft between the centre pins: it would run through the hub motor, links and
        # Y slot pins in the down pose; the company CAD shows two independent X-linkages.


def side_tag(side):
    return "L" if side > 0 else "R"


def build_channels(body, deck):
    """Slider channels: on the floor (Body) and hanging under the deck (Deck)."""
    S, L = DIMS["scissor"], LAYOUT
    x0, x1 = L["channel_x"]
    cx, length = (x0 + x1) / 2, x1 - x0
    for side in (1, -1):
        y = side * S["plane_y"]
        P = Part()
        P.box((length, 0.020, 0.002), (cx, y, 0.006), MAT["Steel"])
        for ly in (-0.008, 0.008):
            P.box((length, 0.002, 0.008), (cx, y + ly, 0.009), MAT["Steel"])
        P.obj(f"Channel_Floor_{side_tag(side)}", body, bevel=True)
        P = Part()  # sheet-metal channel hanging under the plate around Slider_A (z 0.030-0.040)
        z_top = DIMS["deck"]["plate_bottom_z"]
        P.box((length, 0.020, 0.004), (cx, y, z_top - 0.002), MAT["MotorBlack"])
        for ly in (-0.009, 0.009):
            P.box((length, 0.002, 0.014), (cx, y + ly, z_top - 0.011), MAT["MotorBlack"])
        P.obj(f"Channel_Deck_{side_tag(side)}", deck, bevel=True)


def hub_pin_xy(tab):
    """Rest (closed) hub-pin position for a tab, in the deck frame."""
    G = DIMS["gripper"]
    r = G["long" if tab[0] == "X" else "short"]["crank_r"]
    a = rad(TABS[tab] + G["hub_angle_closed_deg"])
    return Vector((r * math.cos(a), r * math.sin(a)))


def slot_pin_xy(tab, extra=0.0):
    G = DIMS["gripper"]
    d = G["long" if tab[0] == "X" else "short"]["pin_closed"] + extra
    b = rad(TABS[tab])
    return Vector((d * math.cos(b), d * math.sin(b)))


def build_hub(deck):
    D, L = DIMS["deck"], LAYOUT
    hub = empty("Hub", deck)
    top = D["plate_top_z"]
    # the visible blue disc is its own shell so X-ray can ghost it and show the cam links turning
    D2 = Part()
    D2.cyl(L["disc_r"], 0.004, (0, 0, top - 0.002), MAT["BlueAnodized"], segs=96)
    for sx in (1, -1):
        for sy in (1, -1):
            D2.cyl(0.0015, 0.0012, (sx * 0.036, sy * 0.036, top - 0.0004), MAT["Steel"], segs=12, r2=0.003)
    D2.cyl(0.006, 0.003, (0, 0, top + 0.0015), MAT["BlackPowder"], segs=24)   # centre boss with a screw slot
    D2.box((0.006, 0.001, 0.0006), (0, 0, top + 0.003), MAT["MotorBlack"])
    link("HubDisc", D2.mesh("HubDisc", 30), hub, xray="shell")
    P = Part()
    cz0, cz1 = L["cam_z"]
    P.cyl(0.020, top - 0.004 - cz1, (0, 0, (top - 0.004 + cz1) / 2), MAT["BlackPowder"])
    P.cyl(0.075, cz1 - cz0, (0, 0, (cz0 + cz1) / 2), MAT["BlackPowder"], segs=96)
    pz0 = L["pin_z"][0]
    for tab in TABS:  # hub pins end at the cam-plate bottom so nothing steel shows through the ring gap
        x, y = hub_pin_xy(tab)
        P.cyl(0.0025, cz0 - pz0, (x, y, (cz0 + pz0) / 2), MAT["Steel"], segs=12)
    P.obj("HubBody", hub, smooth=30)
    return hub


def tab_rot(tab):
    return (0, 0, rad(TABS[tab]))


def build_tabs(deck, gripper_meshes):
    G, L = DIMS["gripper"], LAYOUT
    for tab in TABS:
        kind = "long" if tab[0] == "X" else "short"
        node = empty(f"Tab_{tab}", deck)
        link(f"Gripper_{tab}", gripper_meshes[kind], node, rot=tab_rot(tab), xray="shell")
        pin = G[kind]["pin_closed"]
        cz0, cz1 = L["carriage_z"]
        ca, cb = L["carriage"]
        P = Part()
        P.box((ca, cb, cz1 - cz0), (pin, cb / 2 - 0.006, (cz0 + cz1) / 2), MAT["Steel"])
        pz0, pz1 = L["pin_z"]
        P.cyl(0.002, pz1 - pz0, (pin, 0, (pz0 + pz1) / 2), MAT["Steel"], segs=12)
        P.cyl(0.003, 0.0015, (pin, 0, pz1 - 0.00075), MAT["Steel"], segs=12)
        P.obj(f"Carriage_{tab}", node, rot=tab_rot(tab), smooth=30, bevel=True)


def build_rails(deck):
    G, L = DIMS["gripper"], LAYOUT
    z0, z1 = L["rail_z"]
    for tab in TABS:
        kind = "long" if tab[0] == "X" else "short"
        a, b = L["rail_start"], G[kind]["pin_closed"] + G[kind]["stroke"] + L["carriage"][0] / 2
        P = Part()
        P.box((b - a, L["rail_w"], z1 - z0), ((a + b) / 2, L["rail_off"], (z0 + z1) / 2), MAT["Steel"])
        P.obj(f"Rail_{tab}", deck, rot=tab_rot(tab), bevel=True)


def build_links(deck):
    G, L = DIMS["gripper"], LAYOUT
    for tab in TABS:
        kind = "long" if tab[0] == "X" else "short"
        ell = G[kind]["link_l"]
        hub, slot = hub_pin_xy(tab), slot_pin_xy(tab)
        assert abs((hub - slot).length - ell) < 1e-4, f"Link_{tab}: pin distance {(hub - slot).length} != {ell}"
        z = L["link_z"][tab[0]]
        w, bow, n = L["link_w"] / 2, L["link_bow"], 24
        spine = [Vector((ell * t, 4 * bow * t * (1 - t))) for t in (k / n for k in range(n + 1))]
        left, right = [], []
        for i, p in enumerate(spine):
            d = (spine[min(i + 1, n)] - spine[max(i - 1, 0)]).normalized()
            nrm = Vector((-d.y, d.x)) * w
            left.append(p + nrm)
            right.append(p - nrm)
        P = Part()
        P.prism([(p.x, p.y) for p in right + left[::-1]], L["link_t"], MAT["Steel"],
                Matrix.Translation((0, 0, z - L["link_t"] / 2)))
        for x in (0.0, ell):
            P.cyl(0.006, L["link_t"], (x, 0, z), MAT["Steel"], segs=20)
        P.obj(f"Link_{tab}", deck, (hub.x, hub.y, 0), smooth=30)


def build_deck(body, meshes):
    D, L = DIMS["deck"], LAYOUT
    deck = empty("Deck", body)
    link("Plate", meshes["plate"], deck, xray="shell")
    P = Part()
    holes = plate_hole_centres(meshes["plate"], D["plate_top_z"])
    for c in holes:  # the clustered corner holes are open in the photo; heads only on the lone ones
        if all(c is o or (c - o).length > 0.02 for o in holes):
            P.cyl(0.002, 0.0012, (c.x, c.y, D["plate_top_z"] + 0.0006), MAT["Steel"], segs=12)
    P.obj("PlateScrews", deck, smooth=30)
    P = Part()
    hm = L["hub_motor"]
    P.box(hm, (0, 0, L["hub_motor_z"] + hm[2] / 2), MAT["MotorBlack"])
    P.box((0.012, 0.008, 0.006), (hm[0] / 2 + 0.006, 0.008, L["hub_motor_z"] + 0.005), MAT["Plastic"])
    P.obj("HubMotor", deck, bevel=True)
    build_hub(deck)
    build_tabs(deck, meshes)
    build_rails(deck)
    build_links(deck)
    for side in (1, -1):
        build_scissor(deck, "B", side)
    return deck


def build_robot(meshes_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    make_materials()
    B, D, G = DIMS["body"], DIMS["deck"], DIMS["gripper"]
    meshes = {
        "tray": import_stl(meshes_dir, "io_body.stl", "Tray", "BlackPowder",
                           ((-B["length"] / 2, B["length"] / 2), (-B["width"] / 2, B["width"] / 2),
                            (B["floor_z"], B["top_z"])), smooth=30),
        "plate": import_stl(meshes_dir, "io_lifter.stl", "Plate", "AlumPlate",
                            ((-D["long_half"], D["long_half"]), (-D["short_half"], D["short_half"]),
                             (D["plate_bottom_z"], D["plate_top_z"]))),
        "long": import_stl(meshes_dir, "io_gripper_long.stl", "GripperLong", "BlackPowder",
                           ((0.0646, G["long"]["tip"]), (-0.04, 0.04), (G["blade_bottom_z"], G["lip_top_z"])),
                           smooth=30),
        "short": import_stl(meshes_dir, "io_gripper_short.stl", "GripperShort", "BlackPowder",
                            ((0.0646, G["short"]["tip"]), (-0.04, 0.04), (G["blade_bottom_z"], G["lip_top_z"])),
                            smooth=30),
    }
    robot = empty("Robot", None)
    body = empty("Body", robot)
    link("Tray", meshes["tray"], body, xray="shell")
    build_wheels(body)
    build_drive(body)
    build_front_panel(body)
    for side in (1, -1):
        build_scissor(body, "A", side)
    deck = build_deck(body, meshes)
    build_channels(body, deck)
    return robot


# --------------------------------------------------------------------------- export + check

def export_glb(path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path, export_format="GLB", export_apply=True, export_extras=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_lights=False, export_cameras=False, export_yup=True)


def check_glb(path):
    with open(path, "rb") as f:
        data = f.read()
    magic, _, _ = struct.unpack_from("<III", data, 0)
    assert magic == 0x46546C67, "not a GLB"
    length, ctype = struct.unpack_from("<II", data, 12)
    assert ctype == 0x4E4F534A, "first chunk is not JSON"
    g = json.loads(data[20:20 + length])
    names = [n.get("name") for n in g["nodes"]]
    missing = [n for n in RIG_NODES if names.count(n) != 1]
    assert not missing, f"rig nodes missing/duplicated: {missing}"
    shells = [n["name"] for n in g["nodes"] if n.get("extras", {}).get("xray") == "shell"]
    assert len(shells) == 7, f"expected 7 xray shells, got {shells}"
    assert "KHR_draco_mesh_compression" in g.get("extensionsRequired", []), "Draco not required"
    size = len(data)
    assert size < 2_000_000, f"GLB too big: {size}"
    tris = sum(g["accessors"][p["indices"]]["count"] // 3
               for m in g["meshes"] for p in m["primitives"] if "indices" in p)
    print(f"GLB OK: {len(g['nodes'])} nodes, {len(g['meshes'])} meshes, ~{tris} triangles, {size} bytes")
    return len(g["nodes"]), size


# --------------------------------------------------------------------------- preview

def smoothstep(t):
    return t * t * (3 - 2 * t)


def pose(lift, grip):
    """Apply the three.js kinematics in Blender terms."""
    O, D, G, S = bpy.data.objects, DIMS["deck"], DIMS["gripper"], DIMS["scissor"]
    rise = D["stroke"] * smoothstep(lift)
    O["Deck"].location.z = rise
    theta = math.asin((S["deck_pivot_z"] - S["body_pivot_z"] + rise) / S["bar_length"])
    for side in "LR":
        O[f"Scissor_A_{side}"].rotation_euler.y = -theta
        O[f"Scissor_B_{side}"].rotation_euler.y = theta
    a0, a1 = G["hub_angle_closed_deg"], G["hub_angle_open_deg"]
    alpha = a0 + grip * (a1 - a0)
    O["Hub"].rotation_euler.z = rad(alpha - a0)

    def d(kind, a):
        r, ell = G[kind]["crank_r"], G[kind]["link_l"]
        return r * math.cos(rad(a)) + math.sqrt(ell ** 2 - (r * math.sin(rad(a))) ** 2)

    for tab, beta in TABS.items():
        kind = "long" if tab[0] == "X" else "short"
        out = d(kind, alpha) - d(kind, a0)
        O[f"Tab_{tab}"].location = (out * math.cos(rad(beta)), out * math.sin(rad(beta)), 0)
        r = G[kind]["crank_r"]
        hub = Vector((r * math.cos(rad(beta + alpha)), r * math.sin(rad(beta + alpha))))
        slot = slot_pin_xy(tab, out)
        lk = O[f"Link_{tab}"]
        lk.location = (hub.x, hub.y, 0)
        lk.rotation_euler.z = math.atan2(slot.y - hub.y, slot.x - hub.x)


def setup_preview_scene():
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = 1400, 900
    sc.eevee.taa_render_samples = 48
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.32, 0.32, 0.33, 1)
    sc.world = world
    for name, kind, energy, loc, size in (("Key", "AREA", 70, (0.5, -0.9, 1.0), 0.8),
                                          ("Fill", "AREA", 25, (-1.0, -0.4, 0.6), 1.2),
                                          ("Rim", "AREA", 40, (0.2, 0.9, 0.8), 0.6)):
        data = bpy.data.lights.new(name, kind)
        data.energy, data.size = energy, size
        lt = link(name, data, None, loc)
        lt.rotation_euler = (Vector((0, 0, 0.03)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    P = Part()
    P.box((4, 4, 0.002), (0, 0, -0.001), MAT["Ground"])
    ground = P.obj("Ground", None)
    cam = link("Camera", bpy.data.cameras.new("Camera"), None)
    sc.camera = cam
    return cam, ground


def shoot(cam, path, loc, target, lens=50, ortho=None):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    cam.data.type = "ORTHO" if ortho else "PERSP"
    cam.data.lens = lens
    if ortho:
        cam.data.ortho_scale = ortho
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("rendered", path)


def render_previews(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    ground_mat = bpy.data.materials.new("Ground")
    ground_mat.use_nodes = True
    ground_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.42, 0.43, 1)
    ground_mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
    MAT["Ground"] = ground_mat
    cam, ground = setup_preview_scene()
    W = DIMS["wheel"]
    wheel_fr = (W["x"], -W["y"], W["radius"])
    views = {
        "photo": dict(loc=(-0.40, -0.58, 0.48), target=(0.0, 0.0, 0.03), lens=50),
        "top": dict(loc=(0, 0, 1.5), target=(0, 0, 0.03), ortho=0.64),
        "under": dict(loc=(0.32, -0.45, -0.45), target=(0, 0, 0.02), lens=50),
        "wheel": dict(loc=(0.30, -0.36, 0.10), target=wheel_fr, lens=90),
    }
    shells = [o for o in bpy.data.objects if o.get("xray") == "shell"]
    for pose_name, (lift, grip) in (("closed_down", (0, 0)), ("open_up", (1, 1))):
        pose(lift, grip)
        for view, kw in views.items():
            ground.hide_render = view == "under"
            shoot(cam, os.path.join(out_dir, f"{view}_{pose_name}.png"), **kw)
    for o in shells:
        o.hide_render = True
    ground.hide_render = False
    shoot(cam, os.path.join(out_dir, "xray.png"), **views["photo"])


# --------------------------------------------------------------------------- main

def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--meshes", required=True, help="directory with the company io_*.stl files")
    ap.add_argument("--out", required=True, help="output .glb path")
    ap.add_argument("--preview", help="directory for review renders")
    args = ap.parse_args(argv)

    build_robot(args.meshes)
    export_glb(args.out)
    check_glb(args.out)
    if args.preview:
        render_previews(args.preview)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
