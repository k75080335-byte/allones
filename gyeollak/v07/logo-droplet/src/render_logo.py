#!/usr/bin/env python3
"""Render the official ㄱㄹ 결 mark as a water-droplet / liquid-glass object.

Shape is a union of the official logo rectangles (438x390 units, snapped from
the 01 / GYEOLLAK logo-system board and draft-v07 mark-ink.png). The 15-unit
gap between the ㄱ stem and the ㄹ top bar is kept. A 2-unit overlap square is
added only at the ㄱ/ㄹ pinch corner so the mesh is manifold for bevel — this
does not change the readable silhouette.

Run:
  blender -b -P render_logo.py -- --test
  blender -b -P render_logo.py -- --stills
  blender -b -P render_logo.py -- --anim
  blender -b -P render_logo.py -- --all
"""
from __future__ import annotations

import argparse
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector, Euler

# ---------------------------------------------------------------------------
# Paths / official geometry
# ---------------------------------------------------------------------------
SRC = Path(__file__).resolve().parent
ROOT = SRC.parent
HDRI = SRC / "studio_small_08_1k.hdr"
FRAMES_DIR = ROOT / "frames"
STILLS_DIR = ROOT

# Official units (Y down in the 2D source)
RECTS = [
    (0, 0, 279, 72),          # ㄱ top bar
    (202, 0, 279, 180),       # ㄱ stem
    (126, 180, 202, 390),     # left vertical
    (294, 128, 438, 196),     # ㄹ top bar
    (370, 196, 438, 220),     # ㄹ right connector
    (126, 220, 438, 285),     # middle bar
    (126, 321, 438, 390),     # bottom bar
    (200, 178, 204, 182),     # 2x2 manifold join at the pinch (see header)
]
SRC_W, SRC_H = 438.0, 390.0

LOGO_WIDTH = 2.4          # Blender units
THICKNESS = 0.36
BEVEL_WIDTH = 0.028
BEVEL_SEGS = 4
SCALE = LOGO_WIDTH / SRC_W
LOGO_HEIGHT = SRC_H * SCALE


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def enable_cycles_cpu():
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "NONE"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 128
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    scene.cycles.max_bounces = 16
    scene.cycles.transparent_max_bounces = 16
    scene.cycles.transmission_bounces = 16
    scene.cycles.glossy_bounces = 8
    scene.cycles.diffuse_bounces = 4
    scene.cycles.caustics_reflective = True
    scene.cycles.caustics_refractive = True
    scene.cycles.filter_glossy = 0.25
    scene.render.threads_mode = "AUTO"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 15
    scene.render.film_transparent = True
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0.15
    scene.view_settings.gamma = 1.0
    # slightly cooler
    scene.render.use_persistent_data = True


def add_box_from_rect(x0, y0, x1, y1):
    """SVG-space rect (Y down) → a cuboid in XY, Z = thickness, origin later centered."""
    cx = (x0 + x1) / 2.0 * SCALE
    # flip Y so logo sits upright in XY (Y up)
    cy = (SRC_H - (y0 + y1) / 2.0) * SCALE
    sx = (x1 - x0) * SCALE
    sy = (y1 - y0) * SCALE
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, 0.0))
    ob = bpy.context.active_object
    ob.scale = (sx, sy, THICKNESS)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return ob


def build_logo_mesh():
    boxes = [add_box_from_rect(*r) for r in RECTS]
    base = boxes[0]
    base.name = "GyeollakMark"
    for other in boxes[1:]:
        bpy.ops.object.select_all(action="DESELECT")
        base.select_set(True)
        bpy.context.view_layer.objects.active = base
        mod = base.modifiers.new(name=f"union_{other.name}", type="BOOLEAN")
        mod.operation = "UNION"
        mod.solver = "EXACT"
        # operand
        if hasattr(mod, "operand_type"):
            mod.operand_type = "OBJECT"
        mod.object = other
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(other, do_unlink=True)

    # cleanup
    bpy.ops.object.select_all(action="DESELECT")
    base.select_set(True)
    bpy.context.view_layer.objects.active = base
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=1e-4)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    # center, then stand the mark upright (face in XZ, thickness along Y)
    # so a front camera on -Y sees the ㄱㄹ 결 shape, not the slab edge.
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    base.rotation_euler = (math.radians(90), 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    bpy.context.view_layer.update()
    # bottom slightly above the floor for a soft contact shadow
    zs = [(base.matrix_world @ Vector(c)).z for c in base.bound_box]
    ys = [(base.matrix_world @ Vector(c)).y for c in base.bound_box]
    xs = [(base.matrix_world @ Vector(c)).x for c in base.bound_box]
    base.location.x -= (min(xs) + max(xs)) / 2.0
    base.location.y -= (min(ys) + max(ys)) / 2.0
    base.location.z -= min(zs)
    base.location.z += 0.04
    bpy.context.view_layer.update()

    bevel = base.modifiers.new(name="bevel", type="BEVEL")
    bevel.width = BEVEL_WIDTH
    bevel.segments = BEVEL_SEGS
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(30)
    bevel.miter_outer = "MITER_ARC"
    bevel.affect = "EDGES"
    return base


def _principled_glass(nt, density=0.7):
    """Physical water-glass (studio stills / animation)."""
    pr = nt.nodes.new("ShaderNodeBsdfPrincipled")
    pr.location = (0, 0)
    pr.inputs["Base Color"].default_value = (0.82, 0.93, 1.0, 1.0)
    pr.inputs["Metallic"].default_value = 0.0
    pr.inputs["Roughness"].default_value = 0.028
    pr.inputs["IOR"].default_value = 1.40
    if "Transmission Weight" in pr.inputs:
        pr.inputs["Transmission Weight"].default_value = 1.0
    elif "Transmission" in pr.inputs:
        pr.inputs["Transmission"].default_value = 1.0
    if "Coat Weight" in pr.inputs:
        pr.inputs["Coat Weight"].default_value = 0.7
        pr.inputs["Coat Roughness"].default_value = 0.015
        if "Coat IOR" in pr.inputs:
            pr.inputs["Coat IOR"].default_value = 1.5
    if "Specular IOR Level" in pr.inputs:
        pr.inputs["Specular IOR Level"].default_value = 0.7
    vol = nt.nodes.new("ShaderNodeVolumeAbsorption")
    vol.location = (0, -400)
    vol.inputs["Color"].default_value = (0.50, 0.76, 1.0, 1.0)
    vol.inputs["Density"].default_value = density
    return pr, vol


def make_glass_material():
    """Physical glass for studio backgrounds (white / pastel / black / video)."""
    mat = bpy.data.materials.new("DropletGlass")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (600, 0)
    pr, vol = _principled_glass(nt, density=0.65)
    nt.links.new(pr.outputs["BSDF"], out.inputs["Surface"])
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    try:
        mat.use_screen_refraction = True
        mat.refraction_depth = 0.4
    except Exception:
        pass
    return mat


def make_alpha_glass_material():
    """Compositable PNG glass: transmission is real Transparent (alpha),
    rims are Fresnel glossy so a page background can show through."""
    mat = bpy.data.materials.new("DropletGlassAlpha")
    mat.use_nodes = True
    nt = mat.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (900, 0)

    # edge factor
    fres = nt.nodes.new("ShaderNodeFresnel")
    fres.location = (-400, 100)
    fres.inputs["IOR"].default_value = 1.45
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.location = (-400, -80)
    lw.inputs["Blend"].default_value = 0.35

    # transparent body: almost clear, slight pale-blue; darker at the rim
    col_mid = nt.nodes.new("ShaderNodeMix")
    col_mid.data_type = "RGBA"
    col_mid.location = (-80, -80)
    # Blender 4 mix: Factor, A, B
    col_mid.inputs["A"].default_value = (0.90, 0.96, 1.0, 1.0)
    col_mid.inputs["B"].default_value = (0.55, 0.75, 0.95, 1.0)
    nt.links.new(lw.outputs["Fresnel"], col_mid.inputs["Factor"])

    trans = nt.nodes.new("ShaderNodeBsdfTransparent")
    trans.location = (160, -80)
    # Mix RGB output name in 4.x is "Result"
    result = col_mid.outputs.get("Result") or col_mid.outputs[0]
    nt.links.new(result, trans.inputs["Color"])

    gloss = nt.nodes.new("ShaderNodeBsdfGlossy")
    gloss.location = (160, 180)
    gloss.inputs["Color"].default_value = (1, 1, 1, 1)
    gloss.inputs["Roughness"].default_value = 0.025

    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.location = (480, 40)
    nt.links.new(fres.outputs["Fac"], mix.inputs["Fac"])
    nt.links.new(trans.outputs["BSDF"], mix.inputs[1])
    nt.links.new(gloss.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    try:
        mat.blend_method = "BLEND"
        mat.use_screen_refraction = True
    except Exception:
        pass
    return mat


def setup_world_hdri(strength=1.05):
    world = bpy.data.worlds.new("StudioWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    out.location = (500, 0)
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.location = (250, 0)
    bg.inputs["Strength"].default_value = strength
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.location = (0, 0)
    if HDRI.exists():
        img = bpy.data.images.load(str(HDRI))
        env.image = img
    mapn = nt.nodes.new("ShaderNodeMapping")
    mapn.location = (-200, 0)
    mapn.inputs["Rotation"].default_value = (0.0, 0.0, math.radians(35))
    texc = nt.nodes.new("ShaderNodeTexCoord")
    texc.location = (-400, 0)
    nt.links.new(texc.outputs["Generated"], mapn.inputs["Vector"])
    nt.links.new(mapn.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    return bg


def add_lights():
    # Key — sharp white window highlight (pin-3 style catch)
    bpy.ops.object.light_add(type="AREA", location=(2.6, -1.8, 3.2))
    key = bpy.context.active_object
    key.name = "Key"
    key.data.energy = 320
    key.data.color = (1.0, 0.98, 0.95)
    key.data.shape = "RECTANGLE"
    key.data.size = 1.6
    key.data.size_y = 0.55
    key.data.spread = math.radians(80)
    key.rotation_euler = Euler((math.radians(-40), math.radians(20), math.radians(35)), "XYZ")

    # Cool fill
    bpy.ops.object.light_add(type="AREA", location=(-2.8, -2.2, 1.8))
    fill = bpy.context.active_object
    fill.name = "Fill"
    fill.data.energy = 40
    fill.data.color = (0.75, 0.88, 1.0)
    fill.data.shape = "DISK"
    fill.data.size = 3.0
    fill.rotation_euler = Euler((math.radians(-50), math.radians(-15), math.radians(-20)), "XYZ")

    # Rim / backlight, slightly cobalt
    bpy.ops.object.light_add(type="AREA", location=(0.4, 3.0, 2.2))
    rim = bpy.context.active_object
    rim.name = "Rim"
    rim.data.energy = 90
    rim.data.color = (0.55, 0.72, 1.0)
    rim.data.size = 2.2
    rim.rotation_euler = Euler((math.radians(160), 0, 0), "XYZ")

    # Tight specular speck
    bpy.ops.object.light_add(type="AREA", location=(1.1, -2.6, 2.4))
    speck = bpy.context.active_object
    speck.name = "Speck"
    speck.data.energy = 140
    speck.data.color = (1, 1, 1)
    speck.data.shape = "RECTANGLE"
    speck.data.size = 0.25
    speck.data.size_y = 0.08
    speck.rotation_euler = Euler((math.radians(-55), math.radians(10), 0), "XYZ")
    return key, fill, rim, speck


def _aim(cam, target):
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def _cam_distance(cover=0.72):
    """Distance so the taller logo dimension covers `cover` of a square frame."""
    # 100mm lens, 36mm sensor, square frame uses the 36mm side
    fov = 2 * math.atan((36.0 / 2) / 100.0)
    half = max(LOGO_WIDTH, LOGO_HEIGHT) / 2.0
    return (half / math.tan(fov / 2.0)) / cover


def add_camera(kind="front"):
    bpy.ops.object.camera_add()
    cam = bpy.context.active_object
    cam.name = "Cam"
    cam.data.lens = 100
    cam.data.sensor_width = 36
    cam.data.clip_start = 0.05
    cam.data.clip_end = 40
    cam.data.dof.use_dof = False
    bpy.context.scene.camera = cam
    set_camera(kind)
    return cam


def set_camera(kind):
    cam = bpy.context.scene.camera
    # logo stands in XZ, thickness along Y, center roughly (0, 0, LOGO_HEIGHT/2 + 0.04)
    target = (0.0, 0.0, LOGO_HEIGHT / 2.0 + 0.04)
    d = _cam_distance(0.70)
    if kind == "front":
        # a tiny elevation so the bevel lip reads, still clearly face-on
        cam.location = (0.0, -d, target[2] + 0.18)
        _aim(cam, target)
    elif kind == "quarter":
        # ~28° yaw, ~12° pitch — 3/4 product view, full mark in frame
        yaw = math.radians(28)
        pitch = math.radians(14)
        cam.location = (
            d * math.sin(yaw) * math.cos(pitch),
            -d * math.cos(yaw) * math.cos(pitch),
            target[2] + d * math.sin(pitch),
        )
        _aim(cam, target)
    elif kind == "spin":
        # 16:9 frame is shorter vertically than the square stills, and a
        # 360° turn makes the bounding box as wide as the diagonal.
        # Fit the bounding sphere with comfortable margin.
        radius = math.sqrt((LOGO_WIDTH / 2) ** 2 + (LOGO_HEIGHT / 2) ** 2 + (THICKNESS / 2) ** 2)
        # vertical FOV of a 16:9 100mm lens on a 36mm-wide sensor
        sensor_h = 36.0 * 9.0 / 16.0
        vfov = 2 * math.atan((sensor_h / 2) / 100.0)
        dist = (radius / math.tan(vfov / 2.0)) / 0.72
        pitch = math.radians(11)
        cam.location = (0.0, -dist * math.cos(pitch), target[2] + dist * math.sin(pitch))
        _aim(cam, target)
        print(f"spin cam dist={dist:.2f} radius={radius:.2f} loc={tuple(round(x,3) for x in cam.location)}", flush=True)


def add_backdrop(color=(1, 1, 1, 1), large=True):
    """Seamless cyclorama behind + under the logo."""
    bpy.ops.mesh.primitive_plane_add(size=16, location=(0, 0, -0.001))
    floor = bpy.context.active_object
    floor.name = "Floor"
    # raise back into a cove via a simple second plane
    bpy.ops.mesh.primitive_plane_add(size=16, location=(0, 6.0, 4.0))
    back = bpy.context.active_object
    back.name = "Back"
    back.rotation_euler = Euler((math.radians(90), 0, 0), "XYZ")
    mat = bpy.data.materials.new("Backdrop")
    mat.use_nodes = True
    pr = mat.node_tree.nodes["Principled BSDF"]
    pr.inputs["Base Color"].default_value = color
    pr.inputs["Roughness"].default_value = 0.85
    if "Specular IOR Level" in pr.inputs:
        pr.inputs["Specular IOR Level"].default_value = 0.15
    floor.data.materials.append(mat)
    back.data.materials.append(mat)
    return floor, back


def add_shadow_catcher():
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0.0))
    pl = bpy.context.active_object
    pl.name = "Catcher"
    pl.is_shadow_catcher = True
    # no material needed; catcher with transparent film gives shadow alpha
    return pl


def hide_backdrops(hide=True):
    for name in ("Floor", "Back", "Catcher"):
        ob = bpy.data.objects.get(name)
        if ob:
            ob.hide_render = hide
            ob.hide_viewport = hide


def remove_named(*names):
    for name in names:
        ob = bpy.data.objects.get(name)
        if ob:
            bpy.data.objects.remove(ob, do_unlink=True)


def set_world_solid(color, strength=1.0):
    # mix: keep HDRI for lighting via light objects mostly; dim world to a solid
    world = bpy.context.scene.world
    nt = world.node_tree
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    # disconnect env, set solid
    for l in list(nt.links):
        if l.to_socket == bg.inputs["Color"]:
            nt.links.remove(l)
    bg.inputs["Color"].default_value = (*color[:3], 1.0)
    bg.inputs["Strength"].default_value = strength


def restore_hdri(strength=1.05):
    world = bpy.context.scene.world
    nt = world.node_tree
    bg = next(n for n in nt.nodes if n.type == "BACKGROUND")
    env = next(n for n in nt.nodes if n.type == "TEX_ENVIRONMENT")
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = strength


def setup_all():
    reset_scene()
    enable_cycles_cpu()
    logo = build_logo_mesh()
    mat = make_glass_material()
    logo.data.materials.append(mat)
    setup_world_hdri()
    add_lights()
    add_camera("front")
    return logo


def render_to(path, w, h, transparent, samples=None):
    scene = bpy.context.scene
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.film_transparent = transparent
    if samples is not None:
        scene.cycles.samples = samples
    scene.render.filepath = str(path)
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    print(f"RENDER {path} {w}x{h} transp={transparent} spp={scene.cycles.samples}", flush=True)
    bpy.ops.render.render(write_still=True)
    print("wrote", path, "exists", Path(path).exists(), "size", Path(path).stat().st_size if Path(path).exists() else 0, flush=True)


def stills(test=False):
    logo = setup_all()
    res = 768 if test else 2048
    spp = 24 if test else 96
    spp_anim_preview = spp

    # Switch to compositable alpha glass for the transparent PNGs
    alpha_mat = make_alpha_glass_material()
    logo.data.materials.clear()
    logo.data.materials.append(alpha_mat)

    # 1. front, transparent, no shadow
    set_camera("front")
    hide_backdrops(True)
    restore_hdri(1.15)
    if hasattr(bpy.context.scene.world, "cycles_visibility"):
        bpy.context.scene.world.cycles_visibility.camera = False
    render_to(STILLS_DIR / ("front-transparent-test.png" if test else "front-transparent.png"),
              res, res, True, spp)

    # 2 / 3 / 3b — shadow is added in post (a floor catcher would show
    # through the ㄹ openings and fill the mark). Render clean alpha only.
    set_camera("quarter")
    render_to(STILLS_DIR / ("quarter-transparent-test.png" if test else "quarter-transparent.png"),
              res, res, True, spp)

    # restore physical glass for studio backdrops
    phys = make_glass_material()
    logo.data.materials.clear()
    logo.data.materials.append(phys)

    # 4. front on white
    set_camera("front")
    add_backdrop((0.99, 0.99, 0.995, 1.0))
    # keep HDRI for lighting (invisible to camera via film? we'll turn film off and
    # use the physical backdrop so edges have a surface to refract)
    render_to(STILLS_DIR / ("front-white-test.png" if test else "front-white.png"),
              res, res, False, spp)

    # 5. front on pastel blue — site --pale #DCE6F2
    # 220 230 242
    remove_named("Floor", "Back")
    add_backdrop((220 / 255, 230 / 255, 242 / 255, 1.0))
    render_to(STILLS_DIR / ("front-pastel-test.png" if test else "front-pastel.png"),
              res, res, False, spp)

    # 6. 3/4 on pastel (helps read the thickness)
    set_camera("quarter")
    render_to(STILLS_DIR / ("quarter-pastel-test.png" if test else "quarter-pastel.png"),
              res, res, False, spp)

    # 7. front on black (pin 3 reading of the rims) — bonus
    set_camera("front")
    remove_named("Floor", "Back")
    add_backdrop((0.01, 0.012, 0.02, 1.0))
    render_to(STILLS_DIR / ("front-black-test.png" if test else "front-black.png"),
              res, res, False, spp)

    # save blend for reuse
    bpy.ops.wm.save_as_mainfile(filepath=str(SRC / "gyeollak-droplet.blend"))
    print("stills done, blend saved")


def enable_eevee():
    scene = bpy.context.scene
    # Blender 4.5: EEVEE Next
    engine = "BLENDER_EEVEE_NEXT"
    if engine not in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys():
        engine = "BLENDER_EEVEE"
    scene.render.engine = engine
    ev = scene.eevee
    if hasattr(ev, "use_raytracing"):
        ev.use_raytracing = True
    if hasattr(ev, "use_shadows"):
        ev.use_shadows = True
    if hasattr(ev, "taa_render_samples"):
        ev.taa_render_samples = 8
    if hasattr(ev, "use_volumetric_shadows"):
        ev.use_volumetric_shadows = True
    if hasattr(ev, "ray_tracing_options"):
        try:
            ev.ray_tracing_options.resolution_scale = "1"
            ev.ray_tracing_options.trace_max_roughness = 0.5
        except Exception:
            pass


def anim(test=False):
    logo = setup_all()
    set_camera("spin")
    add_backdrop((220 / 255, 230 / 255, 242 / 255, 1.0))
    enable_eevee()

    nframes = 24 if test else 150  # 5s @ 30fps
    scene = bpy.context.scene
    scene.render.fps = 30
    scene.frame_start = 0
    scene.frame_end = nframes - 1
    scene.render.resolution_x = 960 if test else 1280
    scene.render.resolution_y = 540 if test else 720
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"

    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    # clear old
    for p in FRAMES_DIR.glob("frame_*.png"):
        p.unlink()

    logo.rotation_mode = "XYZ"
    logo.rotation_euler = (0, 0, 0)
    logo.keyframe_insert(data_path="rotation_euler", frame=0)
    # full turn, linear, frame 0 and nframes would be the same pose;
    # we render 0..nframes-1 so it loops
    logo.rotation_euler = (0, 0, math.radians(360.0 * (nframes - 1) / nframes))
    logo.keyframe_insert(data_path="rotation_euler", frame=nframes - 1)
    # also a dummy key at nframes (= 360°) so interpolation is exact
    logo.rotation_euler = (0, 0, math.radians(360.0))
    logo.keyframe_insert(data_path="rotation_euler", frame=nframes)
    ad = logo.animation_data.action
    for fc in ad.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

    scene.render.filepath = str(FRAMES_DIR / "frame_")
    print(f"ANIM {nframes} frames engine={scene.render.engine} {scene.render.resolution_x}x{scene.render.resolution_y}", flush=True)
    bpy.ops.render.render(animation=True)
    print("anim frames done")


def parse_args():
    # blender passes args after --
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    p = argparse.ArgumentParser()
    p.add_argument("--test", action="store_true")
    p.add_argument("--stills", action="store_true")
    p.add_argument("--anim", action="store_true")
    p.add_argument("--all", action="store_true")
    return p.parse_args(argv)


def main():
    args = parse_args()
    if not (args.test or args.stills or args.anim or args.all):
        args.test = True
    if args.test:
        stills(test=True)
    elif args.stills or args.all:
        stills(test=False)
    if args.anim or args.all:
        anim(test=False)
    elif args.test:
        # skip anim in test by default (slow); opt-in via --all/--anim
        pass


if __name__ == "__main__":
    main()
