"""The butterfly under "A way of life", rendered from a real 3D model in Blender (Cycles).

The model: "Ulysses Butterfly" by eb78 on Sketchfab (CC BY-SA 4.0), its original .blend: a
rigged Papilio ulysses. It is given this site's look: the wing material reworked (velvet black
scales; blue scales that are structural: metallic, glinting along the scale rows, a thin film
shifting the hue), soft light from the upper left with rims, a shadow caught on an invisible
page behind it, and a roomy frame. Its wings are rebuilt to move like real ones (see "the
wings"). It makes one seamless loop with a transparent background, to be made into web video.

Build the scene and save it, to look at in Blender before anything is rendered:
  Blender -b --disable-autoexec -P tools/butterfly/render_model.py -- --model <file.blend>
      --blend _media-originals/butterfly/preview/butterfly-scene.blend [--gap 0.9] [--check 1]
Then render that very file (no "--": the script only switches the GPU on):
  Blender -b --disable-autoexec <scene.blend> -P tools/butterfly/render_model.py -a
"""
import math
import os
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "_media-originals", "butterfly", "render")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
opt = {argv[i].lstrip("-"): argv[i + 1] for i in range(0, len(argv) - 1, 2)}


def use_gpu():
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    bpy.context.scene.cycles.device = "GPU"


LOOP = 96  # frames at 30 fps: 3.2 s
# The frame is 1.6x the butterfly's own (1440 x 1200 at lens 40): the soft shadow fades out
# inside it rather than at its edge (measured: at 1.6x its alpha at the border is under 1%).
# The lens widens by the same factor, so the butterfly keeps its size in pixels.
FRAME = 1.6
# The beat, in degrees above flat: two quick strokes, then a slow lazy half-close.
BEAT = [(0, 8), (0.288, 64), (0.576, 6), (0.864, 60), (1.184, 8), (2.176, 30), (3.2, 8)]


def ease(t):
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def beat(sec):
    t = sec % 3.2
    for (t0, a0), (t1, a1) in zip(BEAT, BEAT[1:]):
        if t <= t1:
            return math.radians(a0 + (a1 - a0) * ease((t - t0) / (t1 - t0)))
    return math.radians(BEAT[0][1])


_TT = np.linspace(0, 3.2, 3201)
_TH = np.array([beat(x) for x in _TT])


def theta(t):  # the beat, for arrays of times
    return np.interp(np.mod(t, 3.2), _TT, _TH)


# ----------------------------------------------------------------------------- the wings
# The model's wings are flat cards (3 to 6 polygons each) hinged on the body's centre line:
# turned, they swept through the body. The forewing lies 0.1 mm over the hindwing, and the
# hindwing's picture stops where the forewing covered it in the source photo: moved apart,
# they cut into each other and showed that blank edge. So the wings are rebuilt here.
#  - Each is cut into a fine mesh (16 x 16 per polygon), so it can bend.
#  - It folds up on a hinge at the body wall (2.4 mm out from the centre line, just inside
#    the thorax), never down: the root stays in the thorax, the wing rises out of its side.
#  - It bends like a membrane, without stretching: along the span, each strip's slope is the
#    beat a little late, later toward the tip and later again toward the back and the tail;
#    so the tip trails the root, the trailing edge and the tail trail the leading edge.
#  - Fore- and hindwing take the same bend at the same place, as a butterfly's do where
#    they overlap (the forewing presses on the hindwing going down, is lifted by it going
#    up): the 0.1 mm between them is kept everywhere, so they cannot cut into each other
#    and the hidden edge stays hidden.
# Distances are in the model's own units (metres, life size: 10 cm across).
HINGE, PLANE = 0.0024, 0.01425  # hinge: out from the centre line; plane: between the two wings
LAG_SPAN, LAG_BACK = 0.045, 0.06  # s: lag at the forewing tip; extra lag at the far back (tail)


def bend(co, side, t, steps=32):
    """Where each wing vertex (rest position co, side -1 left / +1 right) is at time t."""
    u = side * co[:, 0]
    s = np.clip(u - HINGE, 0, None)
    d = co[:, 2] - PLANE
    back = np.clip((0.006 - co[:, 1]) / 0.05, 0, 1)

    def lag(sig):
        return LAG_SPAN * sig / 0.05 + LAG_BACK * back[:, None] * np.minimum(sig / 0.01, 1)

    sig = s[:, None] * ((np.arange(steps) + 0.5) / steps)
    phi = theta(t - lag(sig))
    run = s[:, None] / steps
    X, Z = (np.cos(phi) * run).sum(1), (np.sin(phi) * run).sum(1)
    tip = theta(t - lag(s[:, None]))[:, 0]
    out = co.copy()
    moving = s > 0
    out[moving, 0] = side[moving] * (HINGE + X[moving] - d[moving] * np.sin(tip[moving]))
    out[moving, 2] = PLANE + Z[moving] + d[moving] * np.cos(tip[moving])
    return out


def build_wings(body):
    """Split the wings off the body into their own fine mesh and bake the flight into it."""
    gname = {g.index: g.name for g in body.vertex_groups}

    def group(v):
        return gname[max(v.groups, key=lambda g: g.weight).group] if v.groups else ""

    wings = body.copy()
    wings.data = body.data.copy()
    wings.name = wings.data.name = "Wings"
    body.users_collection[0].objects.link(wings)
    for ob, keep_wings in ((wings, True), (body, False)):
        me = ob.data
        drop = [v.index for v in me.vertices if ("Wing" in group(v)) != keep_wings]
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[bm.verts[i] for i in drop], context="VERTS")
        bm.to_mesh(me)
        bm.free()
    wings.modifiers.clear()
    sub = wings.modifiers.new("fine", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = 4
    sub.uv_smooth = "NONE"
    dg = bpy.context.evaluated_depsgraph_get()
    fine = bpy.data.meshes.new_from_object(wings.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    wings.modifiers.clear()
    wings.data = fine
    fine.name = "Wings"

    co0 = np.array([tuple(v.co) for v in fine.vertices])
    side = np.array([-1.0 if group(v).startswith("Left") else 1.0 for v in fine.vertices])
    fore = np.array(["UpperWing" in group(v) for v in fine.vertices])
    frames = [bend(co0, side, f / 30) for f in range(LOOP)]

    # one shape per frame, played in turn (absolute shape keys, stepped by one fcurve)
    wings.shape_key_add(name="rest")
    for f, pos in enumerate(frames):
        kb = wings.shape_key_add(name=f"f{f:03d}", from_mix=False)
        kb.data.foreach_set("co", pos.ravel())
        kb.interpolation = "KEY_LINEAR"
    key = fine.shape_keys
    key.use_relative = False
    blocks = key.key_blocks
    for f in range(LOOP):  # a key on every frame: whatever the curve does between them, each frame is exact
        key.eval_time = blocks[f + 1].frame
        key.keyframe_insert("eval_time", frame=f)
    return wings, co0, side, fore, frames


def clear_padding(wings, img):
    """Make the texture's padding see-through where it lies on the wings. Around each painted
    wing the texture is filled out with stretched copies of its edge, and some of that filler
    is opaque: a grey tab off the forewing's back corner, a pale strip along the hindwing's
    front edge. Real scales are speckled every way; the filler is smooth along one direction,
    so it is found by how little it changes along a short line, in its flattest direction."""
    W, H = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(H, W, 4)
    rgb = px[..., :3]
    flat = np.full((H, W), np.inf, np.float32)
    for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):
        line = np.stack([np.roll(rgb, (dy * i, dx * i), (0, 1)) for i in range(-3, 4)])
        flat = np.minimum(flat, line.var(0).sum(-1))

    def box(a, r):  # mean over a (2r+1)^2 window
        c = np.cumsum(np.cumsum(np.pad(a.astype(float), ((r + 1, r), (r + 1, r)), mode="edge"), 0), 1)
        k = 2 * r + 1
        return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / k / k

    on = np.zeros((H, W), bool)  # texels the wings use
    uv = wings.data.uv_layers.active.data
    for p in wings.data.polygons:
        pts = np.array([uv[i].uv for i in p.loop_indices]) * [W - 1, H - 1]
        x0, y0 = np.floor(pts.min(0)).astype(int)
        x1, y1 = np.ceil(pts.max(0)).astype(int)
        X, Y = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
        n = len(pts)
        turn = np.sign(sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1] for i in range(n)))
        ins = np.ones(X.shape, bool)
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            ins &= ((b[0] - a[0]) * (Y - a[1]) - (b[1] - a[1]) * (X - a[0])) * turn >= -1.5
        on[y0:y1 + 1, x0:x1 + 1] |= ins
    filler = (box((flat < 3e-4) & on & (px[..., 3] > 0.05), 3) > 0.5) & on
    px[..., 3] *= 1 - box(filler, 1)  # a one-texel soft edge
    img.pixels.foreach_set(px.ravel())
    img.pack()
    print("TEXTURE padding cleared: %d texels" % filler.sum())


def check_wings(body, wings, co0, side, fore, frames):
    """Prove it: the wings never cut into each other, the body, or across the centre line."""
    polys = [tuple(p.vertices) for p in wings.data.polygons]
    fpolys = [p for p in polys if fore[p[0]]]
    rest_fore = BVHTree.FromPolygons([tuple(c) for c in co0], fpolys)
    hind = np.where(~fore)[0]
    under, sign0 = [], []
    for i in hind:  # hindwing points lying under the forewing at rest
        hit = rest_fore.ray_cast(Vector(co0[i]), Vector((0, 0, 1)), 0.001)
        if hit[0] is not None:
            under.append(i)
            sign0.append(np.sign((Vector(co0[i]) - hit[0]).dot(hit[1])))
    dg = bpy.context.evaluated_depsgraph_get()
    bme = body.evaluated_get(dg).to_mesh()
    btree = BVHTree.FromPolygons([tuple(v.co) for v in bme.vertices], [tuple(p.vertices) for p in bme.polygons])

    def inside(p):  # odd ray crossings in most directions (the model's normals are not consistent)
        p = Vector(p)
        if btree.find_nearest(p, 0.006)[0] is None:
            return False
        odd = 0
        for d in (Vector((1, 0, 0)), Vector((-1, 0, 0)), Vector((0, 0, 1)), Vector((0, 1, 0)), Vector((0, -1, 0))):
            n, o = 0, p
            while (hit := btree.ray_cast(o, d))[0] is not None and n < 50:
                n, o = n + 1, hit[0] + d * 1e-7
            odd += n % 2
        return odd >= 3

    s = side * co0[:, 0] - HINGE
    probe = np.where(s > 0.0015)[0][::3]
    outside0 = [i for i in probe if not inside(co0[i])]
    cut = into = across = far = 0
    gaps, depth = [], [0.0]
    for pos in frames:
        ft = BVHTree.FromPolygons([tuple(c) for c in pos], fpolys)
        for i, s0 in zip(under, sign0):
            q, n, _, dist = ft.find_nearest(Vector(pos[i]))
            gaps.append(dist)
            cut += np.sign((Vector(pos[i]) - q).dot(n)) != s0
        sunk = [i for i in outside0 if inside(pos[i])]
        into += len(sunk)
        depth += [btree.find_nearest(Vector(pos[i]))[3] for i in sunk]
        far += sum(s[i] > 0.0025 for i in sunk)
        across += int((side[s > 0] * pos[s > 0, 0] < 0).sum())
    print("CHECK wings: %d hindwing points under the forewing, over %d frames: crossed %d, gap %.5f-%.5f m"
          % (len(under), len(frames), cut, min(gaps), max(gaps)))
    print("CHECK body: %d wing points outside it at rest, over %d frames: went inside %d (deepest %.5f m;"
          " beyond the wing base, 2.5 mm out from the hinge: %d); crossed the centre line %d"
          % (len(outside0), len(frames), into, max(depth), far, across))
    body.evaluated_get(dg).to_mesh_clear()


# ----------------------------------------------------------------------------- the scene


def build():
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(opt["model"]), load_ui=False, use_scripts=False)
    scene = bpy.context.scene
    arm = bpy.data.objects["Armature"]
    body = bpy.data.objects["UlyssesButterfly"]
    arm.data.pose_position = "POSE"  # saved showing the rest pose; legs and antennae stay as posed
    ad = arm.animation_data or arm.animation_data_create()
    for tr in ad.nla_tracks:
        tr.mute = True  # the file's own flight cycle: the wings are driven below instead
    ad.action = None
    for name in ("Camera", "Sun"):
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name])

    # the model is life size (10 cm across): make it 2 units across, as the rest of this scene is
    span = max((body.matrix_world @ Vector(c)).x for c in body.bound_box) * 2
    k = 2 / span
    arm.scale = tuple(s * k for s in arm.scale)
    bpy.context.view_layer.update()
    zmin = min((body.matrix_world @ Vector(c)).z for c in body.bound_box)
    zc = (zmin + max((body.matrix_world @ Vector(c)).z for c in body.bound_box)) / 2

    # render setup
    scene.render.engine = "CYCLES"
    use_gpu()
    scene.cycles.samples = int(opt.get("samples", "96"))
    scene.cycles.adaptive_threshold = 0.015
    scene.cycles.use_denoising = True
    scene.cycles.transparent_max_bounces = 24
    scene.render.film_transparent = True
    scene.render.resolution_x, scene.render.resolution_y = round(1440 * FRAME), round(1200 * FRAME)
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = float(opt.get("exposure", "-1.0"))
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = os.path.join(OUT, "####")
    scene.frame_start, scene.frame_end = 0, LOOP - 1
    scene.frame_current = 0

    world = scene.world or bpy.data.worlds.new("world")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background") or world.node_tree.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.82, 0.85, 0.9, 1)
    bg.inputs["Strength"].default_value = 0.25

    # the material: how blue a texel is decides how much it is structural scale
    mat = body.data.materials[0]
    nt = mat.node_tree
    n, L = nt.nodes, nt.links.new
    tex = next(x for x in n if x.bl_idname == "ShaderNodeTexImage")
    bsdf = next(x for x in n if x.bl_idname == "ShaderNodeBsdfPrincipled")
    sep = n.new("ShaderNodeSeparateColor")
    L(tex.outputs["Color"], sep.inputs["Color"])
    g7 = n.new("ShaderNodeMath"); g7.operation = "MULTIPLY"; g7.inputs[1].default_value = 0.7
    L(sep.outputs["Green"], g7.inputs[0])
    mx = n.new("ShaderNodeMath"); mx.operation = "MAXIMUM"
    L(sep.outputs["Red"], mx.inputs[0]); L(g7.outputs["Value"], mx.inputs[1])
    sub = n.new("ShaderNodeMath"); sub.operation = "SUBTRACT"
    L(sep.outputs["Blue"], sub.inputs[0]); L(mx.outputs["Value"], sub.inputs[1])
    blue = n.new("ShaderNodeMath"); blue.operation = "MULTIPLY"; blue.use_clamp = True; blue.inputs[1].default_value = 3.0
    L(sub.outputs["Value"], blue.inputs[0])

    def by_blue(socket, black, bright):
        r = n.new("ShaderNodeMapRange")
        r.inputs["To Min"].default_value = black
        r.inputs["To Max"].default_value = bright
        L(blue.outputs["Value"], r.inputs["Value"])
        L(r.outputs["Result"], bsdf.inputs[socket])

    by_blue("Metallic", 0.0, 0.6)
    by_blue("Roughness", 0.85, 0.32)
    by_blue("Anisotropic", 0.0, 0.7)
    by_blue("Thin Film Thickness", 0.0, 380.0)
    by_blue("Sheen Weight", 0.35, 0.0)
    by_blue("Specular IOR Level", 0.15, 0.6)
    bsdf.inputs["Thin Film IOR"].default_value = 1.35
    bsdf.inputs["Sheen Tint"].default_value = (0.16, 0.13, 0.11, 1)
    bsdf.inputs["Sheen Roughness"].default_value = 0.55
    bw = n.new("ShaderNodeRGBToBW")  # veins and scale rows catch the light: a fine bump from the texture
    L(tex.outputs["Color"], bw.inputs["Color"])
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    bump.inputs["Distance"].default_value = 0.002
    L(bw.outputs["Val"], bump.inputs["Height"])
    L(bump.outputs["Normal"], bsdf.inputs["Normal"])

    wings, co0, side, fore, frames = build_wings(body)
    clear_padding(wings, tex.image)

    # it hangs in the air: a slow drift, and the body lifts a little as each stroke comes down
    hover = bpy.data.objects.new("hover", None)
    scene.collection.objects.link(hover)
    arm.parent = hover
    mid, half = math.radians(35), math.radians(29)
    for f in range(LOOP + 1):
        h = math.sin(2 * math.pi * f / LOOP)
        lift = -0.02 * (beat(f / 30 - 0.05) - mid) / half
        hover.location = (0, 0.035 * h, 0.07 * h + lift)
        hover.rotation_euler = (0, 0, 0.025 * math.sin(2 * math.pi * f / LOOP + 1))
        hover.keyframe_insert("location", frame=f)
        hover.keyframe_insert("rotation_euler", frame=f)

    # page (catches the shadow), lights, camera
    page = bpy.data.objects.new("page", bpy.data.meshes.new("page"))
    page.data.from_pydata([(-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0)], [], [(0, 1, 2, 3)])
    page.location.z = zmin - float(opt.get("gap", "0.9"))
    page.is_shadow_catcher = True
    scene.collection.objects.link(page)

    def light(name, loc, energy, size, color=(1, 1, 1), shadow=True):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy, ld.color, ld.size = energy, color, size
        ld.use_shadow = shadow
        ob = bpy.data.objects.new(name, ld)
        ob.location = Vector(loc) + Vector((0, 0, zc))
        ob.rotation_euler = (Vector((0, 0, zc)) - ob.location).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(ob)

    # Only the key light casts a shadow, as the sun would: one shadow, shaped like the butterfly.
    # The rims sit low behind it and threw long shadows of their own, out past any frame (two
    # lobes, split apart when the wings rose); they and the softbox now only light it.
    light("key", (-1.4, 1.7, 4.3), 600, 2.2, (1.0, 0.98, 0.95))
    light("softbox", (1.9, 0.6, 3.4), 320, 3.2, (0.95, 0.98, 1.0), shadow=False)
    light("rim", (2.6, 3.2, 0.9), 420, 1.2, (0.9, 0.95, 1.0), shadow=False)
    light("rim2", (-2.8, 3.0, 0.6), 300, 1.2, (0.9, 0.95, 1.0), shadow=False)

    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = 40 / FRAME
    cam.location = (0, -2.2, 3.9 + zc)
    cam.rotation_euler = (Vector((0, 0.05, zc)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(cam)
    scene.camera = cam

    check_wings(body, wings, co0, side, fore, frames)
    if "check" in opt:
        from bpy_extras.object_utils import world_to_camera_view
        worst = [1, 1, 0, 0]
        for f in range(0, LOOP, 2):
            scene.frame_set(f)
            dg = bpy.context.evaluated_depsgraph_get()
            for ob in (body, wings):
                ev = ob.evaluated_get(dg)
                for v in list(ev.data.vertices)[::3]:
                    p = world_to_camera_view(scene, cam, ev.matrix_world @ v.co)
                    worst = [min(worst[0], p.x), min(worst[1], p.y), max(worst[2], p.x), max(worst[3], p.y)]
        print("CHECK frame extent x %.3f-%.3f y %.3f-%.3f" % (worst[0], worst[2], worst[1], worst[3]))
        scene.frame_set(0)

    # opened in Blender: through the camera, in colour, ready to play with Space
    for scr in bpy.data.screens:
        for area in scr.areas:
            if area.type == "VIEW_3D":
                sp = area.spaces.active
                sp.shading.type = "MATERIAL"
                sp.region_3d.view_perspective = "CAMERA"
    if "blend" in opt:
        path = os.path.abspath(opt["blend"])
        os.makedirs(os.path.dirname(path), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=path)
    if "render" in opt:
        os.makedirs(OUT, exist_ok=True)
        if "frames" in opt:
            scene.frame_start, scene.frame_end = (int(x) for x in opt["frames"].split("-"))
        scene.render.filepath = os.path.join(OUT, opt.get("prefix", "") + "####")
        bpy.ops.render.render(animation=True)


if "model" in opt:
    build()
else:  # rendering a scene built earlier: only the GPU to switch on (it is not saved in the file)
    use_gpu()
