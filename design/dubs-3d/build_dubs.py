"""Build a stylized 3D Dubs (AcuPark's mascot) in Blender, matching the 2D splash sticker.

Run headless from this folder:
    /Applications/Blender.app/Contents/MacOS/Blender -b -P build_dubs.py -- [--stills] [--anim] [--gltf]

It rebuilds the scene from scratch every time, saves dubs.blend next to this script, and with
--stills / --anim renders into ./renders; --gltf exports web/dubs.glb for the interactive viewer. Everything is primitives + modifiers, so shapes are
tweaked by editing the numbers below and re-running.

Axes: Z up, Dubs faces -Y (toward the camera). 1 unit ~ 100px of the 2D sticker.
"""

import math
import os
import re
import shutil
import subprocess
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
RENDERS = os.path.join(HERE, "renders")

# Palette from DubsBark.tsx (sRGB hex) — the sticker's matte retro colors.
INK = "#211f27"
DARK = "#3b3742"
GREY = "#8c8794"
FUR = "#f6efe1"
MUSTARD = "#f0bf3e"
PURPLE = "#502e83"
PINK = "#e7a7a4"
MOUTH = "#5c1f2c"
TONGUE = "#e8798a"
BACKDROP = "#4b2e7e"  # splash purple

FPS = 24
FRAMES = 96  # 4 s: settle, bark, settle


# ---------------------------------------------------------------- helpers


def linear(hex_color):
    """sRGB hex -> linear RGBA (Blender color sockets are linear)."""
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


_materials = {}


def material(name, hex_color, bands=((0.0, 0.62), (0.3, 0.84), (0.6, 1.0)), smooth=False, color_attr=None):
    """Cel-shaded matte material, cached by name.

    Light is quantized into flat bands (shadow / mid / lit) and multiplied by the brand color,
    then emitted, so lit areas show the exact sticker color and shading reads as flat print.
    """
    if name in _materials:
        return _materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    diffuse = nt.nodes.new("ShaderNodeBsdfDiffuse")
    to_rgb = nt.nodes.new("ShaderNodeShaderToRGB")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "LINEAR" if smooth else "CONSTANT"
    els = ramp.color_ramp.elements
    while len(els) < len(bands):
        els.new(0.5)
    for el, (pos, val) in zip(els, bands):
        el.position = pos
        el.color = (val, val, val, 1)
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    mix.inputs["B"].default_value = linear(hex_color)
    if color_attr:  # take the color from a vertex color layer instead of a flat swatch
        attr = nt.nodes.new("ShaderNodeVertexColor")
        attr.layer_name = color_attr
        nt.links.new(attr.outputs["Color"], mix.inputs["B"])
    emit = nt.nodes.new("ShaderNodeEmission")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(diffuse.outputs[0], to_rgb.inputs[0])
    nt.links.new(to_rgb.outputs["Color"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs["A"])
    nt.links.new(mix.outputs["Result"], emit.inputs["Color"])
    nt.links.new(emit.outputs[0], out.inputs[0])
    m.diffuse_color = linear(hex_color)
    _materials[name] = m
    return m


def outline_material():
    """Ink outline for the inverted-hull trick: black, only back faces show."""
    if "Outline" in _materials:
        return _materials["Outline"]
    m = bpy.data.materials.new("Outline")
    m.use_nodes = True
    nodes = m.node_tree.nodes
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(INK)
    out = nodes.new("ShaderNodeOutputMaterial")
    m.node_tree.links.new(emit.outputs[0], out.inputs[0])
    m.use_backface_culling = True
    _materials["Outline"] = m
    return m


def finish(obj, mat, outline=0.018, subdiv=1, parent=None):
    """Smooth, material, optional subdivision, ink outline, and parenting (keeping transform)."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)
    if obj.type == "MESH":
        for p in obj.data.polygons:
            p.use_smooth = True
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    if subdiv:
        sub = obj.modifiers.new("Subdiv", "SUBSURF")
        sub.levels = subdiv
        sub.render_levels = subdiv
    if outline:
        obj.data.materials.append(outline_material())
        sol = obj.modifiers.new("Outline", "SOLIDIFY")
        sol.thickness = outline
        sol.offset = 1
        sol.use_flip_normals = True
        sol.use_rim = False
        sol.material_offset = 1
    if parent:
        set_parent(obj, parent)
    return obj


def set_parent(obj, parent):
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()


def ellipsoid(name, loc, scale, mat, rot=(0, 0, 0), **kw):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=20, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    return finish(obj, mat, **kw)


def blob(name, parts, mat, voxel=0.016, smooth=12, parent=None):
    """Fuse overlapping ellipsoids into ONE continuous surface (voxel remesh + smoothing), so the
    junctions blend and the ink outline only traces the outside."""
    objs = []
    for loc, scale, rot in parts:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=loc, rotation=rot)
        o = bpy.context.active_object
        o.scale = scale
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        objs.append(o)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = objs[0]
    obj.name = name
    remesh = obj.modifiers.new("Fuse", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = voxel
    bpy.ops.object.modifier_apply(modifier="Fuse")
    soften = obj.modifiers.new("Blend", "SMOOTH")
    soften.factor = 0.9
    soften.iterations = smooth
    bpy.ops.object.modifier_apply(modifier="Blend")
    obj.select_set(False)
    return finish(obj, mat, subdiv=0, parent=parent)


def cone(name, loc, r1, depth, rot, scale, mat, r2=0.0, **kw):
    bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    return finish(obj, mat, **kw)


def tube(name, points, radius, parent=None):
    """Thin ink line through 3D points (a beveled poly curve converted to mesh)."""
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    curve.use_fill_caps = True
    spline = curve.splines.new("NURBS")
    spline.points.add(len(points) - 1)
    for pt, co in zip(spline.points, points):
        pt.co = (*co, 1)
    spline.use_endpoint_u = True
    spline.order_u = min(3, len(points))
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(outline_material())
    if parent:
        set_parent(obj, parent)
    return obj


def pivot(name, loc, parent=None):
    """Empty used as an animation pivot (head, jaw, ears, tail)."""
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.15
    e.location = loc
    bpy.context.collection.objects.link(e)
    bpy.context.view_layer.update()
    if parent:
        set_parent(e, parent)
    return e


def mirrored(fn, name, x, *args, **kw):
    """Build a left/right pair; fn receives the signed x and a side suffix."""
    return [fn(f"{name}.{s}", sx, *args, **kw) for s, sx in (("L", -x), ("R", x))]


# ---------------------------------------------------------------- scene


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _materials.clear()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.fps = FPS
    scene.frame_start, scene.frame_end = 1, FRAMES
    scene.view_settings.view_transform = "Standard"  # keep brand colors exact
    scene.view_settings.look = "None"
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = linear(BACKDROP)
    bg.inputs["Strength"].default_value = 1.0
    return scene


def build_body():
    """Sitting Dubs, built on joints so the web viewer can stand him up and make him trot:

    BodyPivot
      HipPivot (torso center): Torso, Chest, TailPivot, NeckPivot (bandana, HeadPivot)
      FrontLegPivot.L/R (shoulder): Leg, Paw
      HindLegPivot.L/R (haunch): Haunch, HindFootPivot: BackFoot
    """
    dark, fur, grey = material("Dark", DARK), material("Fur", FUR), material("Grey", GREY)
    body = pivot("BodyPivot", (0, 0, 0))
    hip = pivot("HipPivot", (0, 0.08, 0.72), parent=body)

    # Pear-shaped sitting torso, leaning slightly forward for a gentle curve in his side profile.
    ellipsoid("Torso", (0, 0.08, 0.72), (0.5, 0.45, 0.68), dark, rot=(math.radians(10), 0, 0), parent=hip)
    ellipsoid("Chest", (0, -0.2, 0.78), (0.32, 0.27, 0.5), fur, parent=hip)
    pivot("NeckPivot", (0, -0.1, 1.12), parent=hip)

    # Hind legs: round grey haunch, and the back foot on its own joint.
    for s, x in (("L", -0.38), ("R", 0.38)):
        hind = pivot(f"HindLegPivot.{s}", (x, 0.08, 0.32), parent=body)
        ellipsoid(f"Haunch.{s}", (x, 0.08, 0.32), (0.27, 0.4, 0.31), grey, parent=hind)
        foot = pivot(f"HindFootPivot.{s}", (x * 1.13, -0.3, 0.06), parent=hind)
        ellipsoid(f"BackFoot.{s}", (x * 1.13, -0.3, 0.06), (0.13, 0.18, 0.07), fur, parent=foot)

    # Long front legs and wide front paws, hung from the shoulder so they can swing.
    for s, x in (("L", -0.14), ("R", 0.14)):
        shoulder = pivot(f"FrontLegPivot.{s}", (x, -0.36, 0.84), parent=body)
        ellipsoid(f"Leg.{s}", (x, -0.36, 0.42), (0.12, 0.12, 0.42), fur, parent=shoulder)
        ellipsoid(f"Paw.{s}", (x * 1.07, -0.47, 0.06), (0.15, 0.19, 0.08), fur, parent=shoulder)

    build_bandana(bpy.data.objects["NeckPivot"])
    return body


def build_bandana(parent):
    mustard, purple = material("Mustard", MUSTARD), material("Purple", PURPLE)

    # Triangular flap draped over the chest (a slightly bowed sheet, then thickened).
    verts = [(-0.44, -0.3, 1.14), (0, -0.58, 1.12), (0.44, -0.3, 1.14), (-0.2, -0.57, 0.88), (0.2, -0.57, 0.88), (0, -0.6, 0.62)]
    faces = [(0, 3, 1), (1, 3, 4), (1, 4, 2), (3, 5, 4)]
    me = bpy.data.meshes.new("Flap")
    me.from_pydata(verts, [], faces)
    flap = bpy.data.objects.new("Flap", me)
    bpy.context.collection.objects.link(flap)
    sol = flap.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness = 0.03
    finish(flap, mustard, outline=0.012, subdiv=1, parent=parent)
    flap.modifiers.move(flap.modifiers.find("Thick"), 0)

    font_path = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
    curve = bpy.data.curves.new("W", "FONT")
    curve.body = "W"
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = 0.2
    curve.extrude = 0.012
    if os.path.exists(font_path):
        curve.font = bpy.data.fonts.load(font_path)
    w = bpy.data.objects.new("W", curve)
    bpy.context.collection.objects.link(w)
    w.location = (0, -0.615, 0.9)
    w.rotation_euler = (math.radians(86), 0, 0)
    w.data.materials.append(purple)
    set_parent(w, parent)


def build_head(neck):
    dark, fur, ink = material("Dark", DARK), material("Fur", FUR), material("Ink", INK)
    pink = material("Pink", PINK)
    head = pivot("HeadPivot", (0, -0.05, 1.18), parent=neck)

    ellipsoid("Skull", (0, 0, 1.65), (0.64, 0.55, 0.56), dark, parent=head)
    # White mask: sits forward of the skull so the dark shows on the forehead and outer cheeks.
    ellipsoid("Mask", (0, -0.17, 1.57), (0.55, 0.42, 0.44), fur, outline=0, parent=head)
    ellipsoid("Stripe", (0, -0.55, 1.8), (0.07, 0.06, 0.13), dark, outline=0, parent=head)
    mirrored(lambda n, x: ellipsoid(n, (x, -0.49, 1.87), (0.07, 0.04, 0.04), fur, outline=0, parent=head), "Brow", 0.2)

    # Cheek fluff: a few soft spikes flicking out of each side of the head.
    for side in (-1, 1):
        for i, z in enumerate((1.46, 1.62)):
            cone(
                f"Fluff.{'L' if side < 0 else 'R'}{i}",
                (side * 0.62, -0.08, z),
                0.11,
                0.24,
                (0, math.radians(side * 122), 0),
                (1, 0.7, 1),
                dark,
                outline=0.012,
                parent=head,
            )

    # Ears: tall triangles tilted outward, pink inside. Each has its own pivot for flicks.
    ears = []
    for side in (-1, 1):
        s = "L" if side < 0 else "R"
        ear = pivot(f"EarPivot.{s}", (side * 0.34, -0.02, 1.98), parent=head)
        tilt = (0, math.radians(side * 18), 0)
        cone(f"Ear.{s}", (side * 0.38, -0.02, 2.24), 0.22, 0.55, tilt, (1, 0.42, 1), dark, outline=0.016, parent=ear)
        cone(f"EarInner.{s}", (side * 0.38, -0.085, 2.2), 0.13, 0.36, tilt, (1, 0.2, 1), pink, outline=0, subdiv=1, parent=ear)
        ears.append(ear)

    # Eyes: simple black ovals with one white sparkle.
    for side in (-1, 1):
        s = "L" if side < 0 else "R"
        ellipsoid(f"Eye.{s}", (side * 0.19, -0.55, 1.7), (0.075, 0.035, 0.088), ink, outline=0, parent=head)
        ellipsoid(f"Glint.{s}", (side * 0.19 + 0.025, -0.585, 1.735), (0.024, 0.012, 0.024), material("White", "#ffffff"), outline=0, subdiv=0, parent=head)

    # Muzzle, nose, mouth and a jaw that drops to bark.
    ellipsoid("Muzzle", (0, -0.62, 1.5), (0.2, 0.14, 0.13), fur, outline=0.012, parent=head)
    ellipsoid("Nose", (0, -0.76, 1.56), (0.085, 0.06, 0.06), ink, outline=0, parent=head)
    ellipsoid("Mouth", (0, -0.57, 1.415), (0.13, 0.1, 0.085), material("MouthIn", MOUTH), outline=0, parent=head)
    ellipsoid("Tongue", (0, -0.6, 1.375), (0.08, 0.07, 0.04), material("Tongue", TONGUE), outline=0, parent=head)
    # Lip line along the muzzle's bottom edge, exactly where the jaw hinges open, so the bark
    # opens at the "smile" (the 2D sticker's lip line), not below it.
    tube("Smile", [(-0.13, -0.69, 1.422), (-0.06, -0.703, 1.396), (0, -0.718, 1.405), (0.06, -0.703, 1.396), (0.13, -0.69, 1.422)], 0.011, parent=head)
    tube("Philtrum", [(0, -0.768, 1.505), (0, -0.758, 1.455), (0, -0.718, 1.405)], 0.01, parent=head)
    jaw = pivot("JawPivot", (0, -0.5, 1.43), parent=head)
    ellipsoid("Jaw", (0, -0.6, 1.38), (0.15, 0.13, 0.065), fur, outline=0.012, parent=jaw)
    return head, jaw, ears


def catmull_rom(points, t):
    """Point and tangent at t (0..1) along a Catmull-Rom spline through `points`."""
    pts = [points[0], *points, points[-1]]
    n = len(points) - 1
    seg = min(int(t * n), n - 1)
    u = t * n - seg
    p0, p1, p2, p3 = (Vector(pts[seg + i]) for i in range(4))
    pos = 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)
    tan = 0.5 * ((-p0 + p2) + 2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * u + 3 * (-p0 + 3 * p1 - 3 * p2 + p3) * u * u)
    return pos, tan.normalized()


TIP_FADE = (0.76, 0.83)  # where along the tail (0 root .. 1 tip) black fades into the white tip


def build_tail(body):
    # Root sits inside the lower back of the torso, so the tail grows out of his body with no gap.
    path = [(0.06, 0.45, 0.3), (0.4, 0.66, 0.36), (0.72, 0.6, 0.62), (0.8, 0.42, 0.9), (0.7, 0.29, 1.07)]
    return make_tail("TailPivot", "Tail", path, [0.9, 1.05, 1.0, 0.75, 0.02], bpy.data.objects["HipPivot"])


def make_tail(pivot_name, name, path, radii, parent):
    """Tail along `path`, tapering to a point, with the white tip painted on as a vertex-color
    fade (no separate piece, so no seam)."""
    tail_mat = material("TailFur", FUR, color_attr="Col")
    tail = pivot(pivot_name, path[0], parent=parent)

    curve = bpy.data.curves.new(name + "Curve", "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = 0.14
    curve.bevel_resolution = 6
    curve.use_fill_caps = True
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(path) - 1)
    for bp, co, radius in zip(spline.bezier_points, path, radii):
        bp.co = co
        bp.radius = radius
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.select_set(False)

    # Paint the fade: each vertex's position along the tail picks black, white, or a blend.
    samples = [catmull_rom(path, i / 300)[0] for i in range(301)]
    dark_c, fur_c = linear(DARK), linear(FUR)
    lo, hi = TIP_FADE
    colors = obj.data.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
    for v in obj.data.vertices:
        t = min(range(301), key=lambda i: (samples[i] - v.co).length_squared) / 300
        k = min(max((t - lo) / (hi - lo), 0.0), 1.0)
        k = k * k * (3 - 2 * k)
        colors.data[v.index].color = tuple(d + (f - d) * k for d, f in zip(dark_c, fur_c))
    finish(obj, tail_mat, outline=0.016, parent=tail)

    return tail


def build_standing():
    """A second, standing Dubs for the web viewer's tail chase (hidden in the Blender renders).

    A chibi husky with the same chubby build as the sitting Dubs: a round chest and round
    hindquarters fused into one bean, a chunky neck, a white chest and belly, big round grey
    haunches, thick short legs, the tail curled over his back, and the same head and bandana.

    StandPivot
      S_BodyPivot (bob / pitch): S_Torso, bib, belly, S_NeckPivot (head), bandana, S_TailPivot
      S_FrontLegPivot.L/R (shoulder): leg, paw
      S_HindLegPivot.L/R (hip): thigh, S_HockPivot (knee): lower leg, foot
    """
    dark, fur, grey = material("Dark", DARK), material("Fur", FUR), material("Grey", GREY)
    r = math.radians
    stand = pivot("StandPivot", (0, 0, 0))
    torso = pivot("S_BodyPivot", (0, 0.0, 0.7), parent=stand)

    # Same chubby build as the sitting Dubs (the sitting torso is ~1.0 wide with big round
    # haunches), just turned horizontal: a round chest and round hindquarters fused into one bean,
    # a chunky neck, big grey haunches and thick legs. Chibi head: about half his height.
    blob("S_Torso", [
        ((0, -0.22, 0.7), (0.48, 0.42, 0.42), (0, 0, 0)),     # round chest
        ((0, 0.26, 0.66), (0.46, 0.42, 0.4), (0, 0, 0)),      # round hindquarters
        ((0, -0.42, 1.0), (0.34, 0.3, 0.26), (r(20), 0, 0)),  # chunky neck
    ], dark, parent=torso)
    # White chest and belly like the sitting Dubs: the white chest runs from under the chin down
    # between the front legs and along his underside.
    ellipsoid("S_Bib", (0, -0.52, 0.64), (0.33, 0.23, 0.42), fur, rot=(r(8), 0, 0), parent=torso)
    ellipsoid("S_Belly", (0, -0.04, 0.32), (0.31, 0.46, 0.13), fur, parent=torso)

    # Thick, short, nearly straight front legs set wide, with round paws.
    for s, x in (("L", -0.22), ("R", 0.22)):
        shoulder = pivot(f"S_FrontLegPivot.{s}", (x, -0.3, 0.55), parent=stand)
        ellipsoid(f"S_Leg.{s}", (x, -0.33, 0.27), (0.15, 0.16, 0.28), fur, parent=shoulder)
        ellipsoid(f"S_Paw.{s}", (x, -0.4, 0.07), (0.16, 0.19, 0.08), fur, parent=shoulder)

    # Big round grey haunches like the sitting ones, white lower legs and feet.
    for s, x in (("L", -0.34), ("R", 0.34)):
        hip = pivot(f"S_HindLegPivot.{s}", (x, 0.3, 0.6), parent=stand)
        ellipsoid(f"S_Thigh.{s}", (x * 1.06, 0.3, 0.42), (0.26, 0.32, 0.3), grey, rot=(r(-10), 0, 0), parent=hip)
        knee = pivot(f"S_HockPivot.{s}", (x * 1.06, 0.26, 0.2), parent=hip)
        ellipsoid(f"S_Shin.{s}", (x * 1.06, 0.28, 0.14), (0.13, 0.14, 0.14), fur, parent=knee)
        ellipsoid(f"S_Foot.{s}", (x * 1.08, 0.2, 0.07), (0.15, 0.19, 0.075), fur, parent=knee)

    # Head and bandana: built at the sitting positions under a joint, then the joint is moved, so
    # they're identical to the sitting ones. The big head sits low, almost on the body.
    neck = pivot("S_NeckPivot", (0, -0.1, 1.12), parent=torso)
    build_head(neck)
    neck.location = (0, -0.6, 0.99)
    band = pivot("S_BandanaPivot", (0, -0.1, 1.12), parent=torso)
    build_bandana(band)
    band.location = (0, -0.4, 1.07)

    # Tail curled up over his back, like the references.
    make_tail(
        "S_TailPivot",
        "S_Tail",
        [(0, 0.55, 0.82), (0.02, 0.82, 1.02), (0.04, 0.8, 1.3), (0.03, 0.56, 1.4), (0.0, 0.44, 1.24)],
        [0.95, 1.05, 1.0, 0.8, 0.05],
        torso,
    )

    # Copies of head/bandana parts got Blender's ".001" names: give the whole model an S_ prefix.
    for obj in stand.children_recursive:
        base = re.sub(r"\.\d{3}$", "", obj.name)
        obj.name = base if base.startswith("S_") else "S_" + base
    for obj in [stand, *stand.children_recursive]:
        obj.hide_render = True
    return stand


def contact_shadow():
    """Soft purple shadow pooled under Dubs (a faded decal, since flat-shaded floors don't show one)."""
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0.08, -0.08, 0.004))
    obj = bpy.context.active_object
    obj.name = "ContactShadow"
    obj.scale = (0.95, 0.62, 1)
    obj.visible_shadow = False
    m = bpy.data.materials.new("ContactShadow")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    coords = nt.nodes.new("ShaderNodeTexCoord")
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 0.9
    ramp.color_ramp.elements[1].color = (0.6, 0.6, 0.6, 1)
    transparent = nt.nodes.new("ShaderNodeBsdfTransparent")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear("#24104a")
    mix = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(coords.outputs["Object"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(transparent.outputs[0], mix.inputs[1])
    nt.links.new(emit.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    if hasattr(m, "surface_render_method"):
        m.surface_render_method = "BLENDED"
    elif hasattr(m, "blend_method"):
        m.blend_method = "BLEND"
    obj.data.materials.append(m)


def build_stage():
    # Seamless curved backdrop (floor sweeping up into a wall), flat brand purple that only
    # darkens in shadow, so there's no horizon line behind him.
    profile = [(y, 0.0) for y in (-30, -6, -2, 0, 1.5, 2.5)]
    for i in range(1, 9):
        a = math.radians(i * 10)
        profile.append((2.5 + 3 * math.sin(a), 3 - 3 * math.cos(a)))
    profile += [(5.5, z) for z in (4, 8, 20)]
    me = bpy.data.meshes.new("Backdrop")
    verts, faces = [], []
    for x in (-30, 30):
        verts += [(x, y, z) for y, z in profile]
    n = len(profile)
    faces = [(i, i + 1, n + i + 1, n + i) for i in range(n - 1)]
    me.from_pydata(verts, [], faces)
    floor = bpy.data.objects.new("Backdrop", me)
    bpy.context.collection.objects.link(floor)
    for p in me.polygons:
        p.use_smooth = True
    floor.data.materials.append(material("Backdrop", BACKDROP, bands=((0.0, 0.7), (0.45, 1.0)), smooth=True))

    contact_shadow()

    def light(name, kind, loc, energy, size, color="#ffffff", shadow=True):
        data = bpy.data.lights.new(name, kind)
        data.energy = energy
        data.use_shadow = shadow
        if kind == "AREA":
            data.size = size
        data.color = linear(color)[:3]
        obj = bpy.data.objects.new(name, data)
        obj.location = loc
        bpy.context.collection.objects.link(obj)
        direction = Vector((0, 0, 1.0)) - Vector(loc)
        obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        return obj

    light("Key", "AREA", (-2.6, -3.4, 4.2), 900, 1.0, "#fff4e6")
    light("Fill", "AREA", (3.2, -2.6, 2.0), 260, 3.0, "#e9e2ff", shadow=False)
    light("Rim", "AREA", (0.6, 3.2, 3.4), 700, 2.5, shadow=False)

    target = pivot("CamTarget", (0, 0, 1.12))
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 62
    cam = bpy.data.objects.new("Camera", cam_data)
    cam.location = (1.15, -5.6, 1.45)
    bpy.context.collection.objects.link(cam)
    track = cam.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    bpy.context.scene.camera = cam
    return cam


# ---------------------------------------------------------------- animation


def key(obj, frame, rot=None, scale=None, loc=None):
    if rot is not None:
        obj.rotation_euler = [math.radians(a) for a in rot]
        obj.keyframe_insert("rotation_euler", frame=frame)
    if scale is not None:
        obj.scale = scale
        obj.keyframe_insert("scale", frame=frame)
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert("location", frame=frame)


def animate(body, head, jaw, ears, tail):
    """Sit, tilt, rear back, bark once (jaw drops, ears flick, body squashes), settle."""
    key(head, 1, rot=(0, 0, 0))
    key(head, 18, rot=(0, -6, 4))
    key(head, 30, rot=(-9, -2, 0))  # rear back
    key(head, 36, rot=(7, 0, 0))  # snap forward on the bark
    key(head, 48, rot=(-2, 3, -3))
    key(head, 64, rot=(0, 5, -4))
    key(head, FRAMES, rot=(0, 0, 0))

    key(jaw, 1, rot=(0, 0, 0))
    key(jaw, 32, rot=(0, 0, 0))
    key(jaw, 36, rot=(34, 0, 0))
    key(jaw, 41, rot=(30, 0, 0))
    key(jaw, 47, rot=(0, 0, 0))

    # The inside of the mouth only exists while the jaw is open, so no dark sliver shows at rest.
    for name in ("Mouth", "Tongue"):
        part = bpy.data.objects[name]
        for f, s in ((1, 0.001), (32, 0.001), (34, 1), (45, 1), (47, 0.001)):
            key(part, f, scale=(s, s, s))

    for ear, side in zip(ears, (-1, 1)):
        key(ear, 1, rot=(0, 0, 0))
        key(ear, 33, rot=(0, 0, 0))
        key(ear, 37, rot=(-8, side * 14, 0))
        key(ear, 42, rot=(4, side * -6, 0))
        key(ear, 48, rot=(0, 0, 0))

    key(body, 1, scale=(1, 1, 1))
    key(body, 34, scale=(1.02, 1.02, 0.97))
    key(body, 38, scale=(0.99, 0.99, 1.02))
    key(body, 46, scale=(1, 1, 1))

    # Tail wags the whole time.
    for f in range(1, FRAMES + 1, 6):
        key(tail, f, rot=(0, 0, 14 if (f // 6) % 2 == 0 else -10))

    for obj in (head, jaw, *ears, body, tail):
        if obj.animation_data and obj.animation_data.action:
            for fc in getattr(obj.animation_data.action, "fcurves", []):
                for kp in fc.keyframe_points:
                    kp.interpolation = "BEZIER"
                    kp.easing = "AUTO"


# ---------------------------------------------------------------- render


def render_still(scene, path, frame, res=(1080, 1350), samples=128):
    scene.frame_set(frame)
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.eevee.taa_render_samples = samples
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def render_anim(scene, path, res=(1080, 1080), samples=32, frames_dir="frames"):
    """Render PNG frames, then encode an MP4 with ffmpeg (Blender 5 moved its own video output)."""
    frames = os.path.join(os.path.dirname(path), frames_dir)
    os.makedirs(frames, exist_ok=True)
    scene.render.resolution_x, scene.render.resolution_y = res
    scene.render.resolution_percentage = 100
    scene.eevee.taa_render_samples = samples
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(frames, "f_")
    bpy.ops.render.render(animation=True)
    ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
    if os.path.exists(ffmpeg):
        subprocess.run(
            [ffmpeg, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(frames, "f_%04d.png"),
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", path],
            check=True,
        )
        print("Saved video:", path)
    else:
        print("ffmpeg not found; PNG frames are in", frames)


def render_views(scene, folder):
    """Turnaround check: front, 3/4, side, back and 3/4-back at rest, for reviewing the model."""
    os.makedirs(folder, exist_ok=True)
    backdrop = bpy.data.objects["Backdrop"]
    backdrop.hide_render = True
    cam = scene.camera
    target = Vector((0, 0, 1.05))
    dist = (cam.location - target).length
    for name, deg in (("front", 0), ("three-quarter", 35), ("side", 90), ("back-three-quarter", 145), ("back", 180)):
        a = math.radians(deg)
        cam.location = target + Vector((math.sin(a) * dist, -math.cos(a) * dist, 0.35))
        render_still(scene, os.path.join(folder, f"{name}.png"), 1, res=(720, 900), samples=48)


def export_gltf(scene, body, stand, path):
    """Export just Dubs (rest pose, pivots kept as named nodes) as a GLB for the web viewer.

    Curves and text become meshes, subdivision is skipped (the 40x20 spheres are smooth enough on
    the web) and the ink-outline hulls are baked in, so the page only needs to swap materials.
    Runs after dubs.blend is saved, so these export-only changes never reach the .blend.
    """
    scene.frame_set(1)
    # The web page shows/hides the mouth itself, so export it at full size, not frame 1's 0.001.
    for name in ("Mouth", "Tongue"):
        obj = bpy.data.objects[name]
        obj.animation_data_clear()
        obj.scale = (1, 1, 1)
    bpy.context.view_layer.update()
    parts = [body, *body.children_recursive, stand, *stand.children_recursive]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in parts:
        if obj.type in {"CURVE", "FONT"}:
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            bpy.ops.object.convert(target="MESH")
            obj.select_set(False)
        for mod in getattr(obj, "modifiers", []):
            if mod.type == "SUBSURF":
                mod.levels = 0
    for obj in [body, *body.children_recursive, stand, *stand.children_recursive]:
        obj.select_set(True)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
        export_vertex_color="ACTIVE",  # the tail's black-to-white fade
    )
    print("Saved glTF:", path)


def main():
    scene = reset()
    body = build_body()
    head, jaw, ears = build_head(bpy.data.objects["NeckPivot"])
    tail = build_tail(body)
    stand = build_standing()
    build_stage()
    animate(body, head, jaw, ears, tail)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "dubs.blend"))

    os.makedirs(RENDERS, exist_ok=True)
    if "--stills" in ARGS:
        render_still(scene, os.path.join(RENDERS, "dubs-idle.png"), 1)
        render_still(scene, os.path.join(RENDERS, "dubs-bark.png"), 37)
    if "--anim" in ARGS:
        render_anim(scene, os.path.join(RENDERS, "dubs-bark.mp4"))
    if "--views" in ARGS:
        render_views(scene, os.path.join(RENDERS, "views"))
    if "--stand-views" in ARGS:
        # Turnaround of the standing model (normally hidden in renders) for checking proportions.
        for obj in [body, *body.children_recursive]:
            obj.hide_render = True
        for obj in [stand, *stand.children_recursive]:
            obj.hide_render = False
        render_views(scene, os.path.join(RENDERS, "stand-views"))
        for obj in [body, *body.children_recursive]:
            obj.hide_render = False
        for obj in [stand, *stand.children_recursive]:
            obj.hide_render = True
    if "--hero" in ARGS:
        # Wide 16:9 bark for the portfolio hero: same shot, camera pulled back so he sits in the
        # upper middle of the frame with purple room around him for the title over the bottom.
        cam = scene.camera
        target = Vector((0, 0, 1.0))
        cam.location = target + (cam.location - target) * 1.85
        bpy.data.objects["CamTarget"].location = (0, 0, 0.98)  # aim a little low, so he sits in the upper-middle of the frame
        render_anim(scene, os.path.join(RENDERS, "dubs-hero.mp4"), res=(1920, 1080), samples=48, frames_dir="frames-hero")
    if "--gltf" in ARGS:
        export_gltf(scene, body, stand, os.path.join(HERE, "web", "dubs.glb"))


main()
