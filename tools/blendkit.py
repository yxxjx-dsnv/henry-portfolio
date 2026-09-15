"""Shared helpers for the headless Blender build scripts (tools/asrs/build_system.py; the
bridge script predates this and still carries its own copies).

Everything is modelled in millimetres and scaled to metres by hand before export; every
parent inverse is left at identity, so a node's local transform is its parent-relative one.
"""
import math
import os
import re

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

PLANE = {"x": ("y", "z"), "y": ("x", "z"), "z": ("x", "y")}  # in-plane axes of a face normal
FACES = {"-x": (0, 1, 3, 2), "+x": (4, 6, 7, 5), "-y": (0, 4, 5, 1), "+y": (2, 3, 7, 6),
         "-z": (0, 2, 6, 4), "+z": (1, 5, 7, 3)}  # vertex index = 4*sx + 2*sy + sz


# --------------------------------------------------------------------------- textures

def fbm(rng, h, w, radii, weights):
    """Tileable smooth noise: box-blurred white noise (np.roll wraps), unit variance per octave."""
    out = np.zeros((h, w))
    for r, wt in zip(radii, weights):
        a = rng.standard_normal((h, w))
        for axis in (0, 1):
            a = sum(np.roll(a, d, axis=axis) for d in range(-r, r + 1)) / (2 * r + 1)
        out += wt * a / a.std()
    return out


def tile_image(name, rgb, dirpath, alpha=None):
    """Save an (h, w, 3) sRGB float array as a PNG-backed Blender image. A byte image's
    pixels are the raw sRGB bytes — no colour management on the way in."""
    h, w, _ = rgb.shape
    img = bpy.data.images.new(name, w, h, alpha=alpha is not None)
    px = np.ones((h, w, 4), np.float32)
    px[..., :3] = np.clip(rgb, 0, 1)[::-1]  # Blender's pixel rows run bottom-up; row 0 of the array is the top
    if alpha is not None:
        px[..., 3] = np.clip(alpha, 0, 1)[::-1]
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = os.path.join(dirpath, name + ".png")
    img.file_format = "PNG"
    img.save()
    img.colorspace_settings.name = "sRGB"
    return img


# an SVG path rasterised with numpy — decals such as the Apple mark on a laptop lid

def path_polys(d, segs=18):
    """Flatten an SVG path (M/L/H/V/C/Q/Z, absolute or relative) into closed polygons of (x, y)."""
    tokens = re.findall(r"[MmLlHhVvCcQqZz]|-?\d*\.?\d+(?:e-?\d+)?", d)
    polys, cur, pos, start, cmd, i = [], [], (0.0, 0.0), (0.0, 0.0), None, 0

    def num():
        nonlocal i
        v = float(tokens[i])
        i += 1
        return v

    def bez(pts):
        p0 = pos
        for k in range(1, segs + 1):
            t = k / segs
            if len(pts) == 3:
                x = (1 - t) ** 3 * p0[0] + 3 * (1 - t) ** 2 * t * pts[0][0] + 3 * (1 - t) * t * t * pts[1][0] + t ** 3 * pts[2][0]
                y = (1 - t) ** 3 * p0[1] + 3 * (1 - t) ** 2 * t * pts[0][1] + 3 * (1 - t) * t * t * pts[1][1] + t ** 3 * pts[2][1]
            else:
                x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * pts[0][0] + t * t * pts[1][0]
                y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * pts[0][1] + t * t * pts[1][1]
            cur.append((x, y))
        return pts[-1]

    while i < len(tokens):
        if tokens[i].isalpha():
            cmd = tokens[i]
            i += 1
        rel = cmd.islower()
        c = cmd.upper()
        if c == "Z":
            if cur:
                polys.append(cur)
            cur, pos = [], start
            continue
        if c == "M":
            x, y = num(), num()
            pos = (pos[0] + x, pos[1] + y) if rel else (x, y)
            if cur:
                polys.append(cur)
            cur, start = [pos], pos
            cmd = "l" if rel else "L"  # further pairs are line-tos
            continue
        if c == "L":
            x, y = num(), num()
            pos = (pos[0] + x, pos[1] + y) if rel else (x, y)
        elif c == "H":
            x = num()
            pos = (pos[0] + x if rel else x, pos[1])
        elif c == "V":
            y = num()
            pos = (pos[0], pos[1] + y if rel else y)
        elif c in ("C", "Q"):
            n = 3 if c == "C" else 2
            pts = []
            for _ in range(n):
                x, y = num(), num()
                pts.append((pos[0] + x, pos[1] + y) if rel else (x, y))
            pos = bez(pts)
            continue
        cur.append(pos)
    if cur:
        polys.append(cur)
    return polys


def fill_polys(polys, w, h, transform, ss=4):
    """Even-odd scanline fill at ss× supersampling, returned as a (h, w) coverage in 0..1.
    `transform` maps path coordinates to pixel coordinates (x right, y down)."""
    W, H = w * ss, h * ss
    edges = []
    for poly in polys:
        pts = [transform(x, y) for x, y in poly]
        pts = [(x * ss, y * ss) for x, y in pts]
        for k in range(len(pts)):
            (x0, y0), (x1, y1) = pts[k], pts[(k + 1) % len(pts)]
            if y0 != y1:
                edges.append((x0, y0, x1, y1))
    e = np.array(edges)
    mask = np.zeros((H, W), bool)
    ys = np.arange(H) + 0.5
    ymin, ymax = np.minimum(e[:, 1], e[:, 3]), np.maximum(e[:, 1], e[:, 3])
    for r, y in enumerate(ys):
        hit = (y >= ymin) & (y < ymax)
        if not hit.any():
            continue
        s = e[hit]
        xs = s[:, 0] + (y - s[:, 1]) * (s[:, 2] - s[:, 0]) / (s[:, 3] - s[:, 1])
        xs = np.sort(xs)
        for a, b in zip(xs[0::2], xs[1::2]):
            lo, hi = int(np.ceil(a - 0.5)), int(np.floor(b - 0.5)) + 1
            if hi > lo:
                mask[r, max(lo, 0):min(hi, W)] = True
    return mask.reshape(h, ss, w, ss).mean(axis=(1, 3))


# --------------------------------------------------------------------------- materials

def srgb(h):
    return tuple(((int(h[i:i + 2], 16) / 255) / 12.92 if int(h[i:i + 2], 16) / 255 <= 0.04045
                  else (((int(h[i:i + 2], 16) / 255) + 0.055) / 1.055) ** 2.4) for i in (0, 2, 4))


def material(name, rgb, rough, metallic=0.0, image=None, alpha=False, emission=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metallic
    if isinstance(alpha, float):  # a constant translucency (acrylic, tape, plastic)
        bsdf.inputs["Alpha"].default_value = alpha
        m.surface_render_method = "BLENDED"
    if image is not None:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = image
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if alpha is True:
            nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
            m.surface_render_method = "BLENDED"
        if emission is not None:
            nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
            bsdf.inputs["Emission Strength"].default_value = emission
    return m


# --------------------------------------------------------------------------- meshes

def add_uv(me, offset, scale, along, keys):
    """Planar UVs per face in absolute mm / scale; u follows `along` when it lies in the face."""
    layer = me.uv_layers.new(name="UVMap")
    for poly, key in zip(me.polygons, keys):
        a, b = PLANE[key[1]]
        if along == b:
            a, b = b, a
        for li in poly.loop_indices:
            p = me.vertices[me.loops[li].vertex_index].co + offset
            layer.data[li].uv = (getattr(p, a) / scale, getattr(p, b) / scale)


def box_mesh(name, ext, mats, face_mat=None, uv=None, along="x"):
    """An axis-aligned box centred on its own origin; returns (mesh, centre)."""
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


class Part:
    """Accumulates primitives into one bmesh with per-face materials."""

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

    def frustum(self, bottom, top, h, at, mat):
        """A box whose top is a different size from its bottom (drafted walls), base at `at`."""
        bx, by = bottom[0] / 2, bottom[1] / 2
        tx, ty = top[0] / 2, top[1] / 2
        vs = [self.bm.verts.new((sx * bx, sy * by, 0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        vt = [self.bm.verts.new((sx * tx, sy * ty, h)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        faces = [self.bm.faces.new(vs[::-1]), self.bm.faces.new(vt)]
        for i in range(4):
            faces.append(self.bm.faces.new((vs[i], vs[(i + 1) % 4], vt[(i + 1) % 4], vt[i])))
        bmesh.ops.translate(self.bm, verts=vs + vt, vec=Vector(at))
        self._tag(mat)

    def prism(self, poly, z0, z1, mat):
        """A polygon in XY (counter-clockwise, concave allowed) extruded from z0 to z1."""
        vb = [self.bm.verts.new((x, y, z0)) for x, y in poly]
        vt = [self.bm.verts.new((x, y, z1)) for x, y in poly]
        self.bm.faces.new(vb[::-1])
        self.bm.faces.new(vt)
        for i in range(len(poly)):
            j = (i + 1) % len(poly)
            self.bm.faces.new((vb[i], vb[j], vt[j], vt[i]))
        self._tag(mat)

    def sphere(self, r, at, mat, segs=32):
        bmesh.ops.create_uvsphere(self.bm, u_segments=segs, v_segments=segs // 2, radius=r, matrix=Matrix.Translation(Vector(at)))
        self._tag(mat, smooth=True)

    def cyl(self, r, h, at, mat, axis="Z", segs=32, r2=None, smooth=True):
        rot = {"Z": Matrix.Identity(4), "X": Matrix.Rotation(math.pi / 2, 4, "Y"), "Y": Matrix.Rotation(math.pi / 2, 4, "X")}[axis]
        m = Matrix.Translation(Vector(at)) @ rot
        bmesh.ops.create_cone(self.bm, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h, matrix=m)
        self._tag(mat, smooth=smooth)
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


# --------------------------------------------------------------------------- scene

def link(name, me, parent, loc=(0, 0, 0), rot=(0, 0, 0), extras=None):
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = parent
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.location = loc
    ob.rotation_euler = rot
    for k, v in (extras or {}).items():
        ob[k] = v
    return ob


def empty(name, parent, loc=(0, 0, 0), rot=(0, 0, 0), extras=None):
    return link(name, None, parent, loc, rot, extras)


def to_metres(root):
    """Bake the mm → m scale by hand: locations, vertices and bevel widths."""
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


def export_glb(root, path, **extra):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for ob in [root] + root.children_recursive:
        ob.select_set(True)
    opts = dict(filepath=path, export_format="GLB", use_selection=True, export_apply=True,
                export_extras=True, export_draco_mesh_compression_enable=True,
                export_draco_mesh_compression_level=6, export_lights=False, export_cameras=False,
                export_yup=True, export_image_format="JPEG", export_jpeg_quality=82,
                export_animations=False)
    opts.update(extra)
    bpy.ops.export_scene.gltf(**opts)


# --------------------------------------------------------------------------- renders

def studio(target, distance, azimuth, elevation, lens=45, backdrop_z=None, world_grey=0.30):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.eevee.taa_render_samples = 64
    sc.eevee.use_shadows = True
    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (world_grey, world_grey, world_grey, 1)
    sc.world = world
    for name, energy, loc, size in (("Key", 900, (2.5, -4.0, 5.0), 3.0), ("Fill", 350, (-4.5, -2.0, 3.0), 4.0),
                                     ("Rim", 450, (1.5, 4.0, 4.0), 3.0)):
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.size = energy, size
        lt = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(lt)
        lt.location = loc
        lt.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    if backdrop_z is not None:
        backdrop = bpy.data.meshes.new("Backdrop")
        backdrop.from_pydata([(-20, -20, backdrop_z), (20, -20, backdrop_z), (20, 20, backdrop_z), (-20, 20, backdrop_z)], [], [(0, 1, 2, 3)])
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
