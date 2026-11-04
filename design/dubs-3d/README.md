# Dubs 3D

A stylized 3D version of Dubs, AcuPark's splash mascot, built in Blender 5 for the portfolio. He keeps the 2D sticker's look:
- cel (toon) shading and ink outlines
- the sticker palette, matched to the app's colors
- a mustard "W" bandana
- a UW-purple backdrop

| File | What it is |
|---|---|
| `build_dubs.py` | Builds the whole scene from scratch: model, materials, lights, camera and the bark animation. |
| `dubs.blend` | The scene the script saves. Open it in Blender to look around, pose him or render from other angles. |
| `renders/dubs-idle.png` | Hero still, sitting (1080×1350). |
| `renders/dubs-bark.png` | Hero still, mid-bark (1080×1350). |
| `renders/dubs-bark.mp4` | 4-second bark animation (1080×1080, 24 fps). |
| `renders/views/` | Turnaround check: front, three-quarter, side, back three-quarter and back (720×900). |
| `web/` | Interactive version for the browser: `index.html` + `dubs.glb` (see below). |

## Interactive web version (`web/`)

`web/index.html` + `web/dubs.glb` is a self-contained three.js page for the portfolio:

- **Watches you**: his head follows the cursor (or your finger), with a little lag.
- **Drag to spin**: orbit all the way around him; scroll or pinch to zoom.
- **Click / tap him to bark**: he rears back and snaps forward with his jaw open, his ears flick, his body squashes, and a slanted **"Go Dawgs!"** pops out. The **Bark** button and Space/Enter do the same, for touch and keyboard.
- **The tail chase is switched off in the page** (Ruby kept just the bark, 2026-11-04): clicking his tail barks like anywhere else, the
  Chase button and the T key are gone. The chase animation itself (`chase()`, the standing `S_` model, the sit↔stand morph) is still
  in `index.html` and `?pose=` still freezes it, so it can be turned back on by wiring a trigger to `chase()`.
- **Always alive**: he breathes, his tail wags (faster when you hover), and his ears perk on hover. With *reduce motion* turned on, only the interactions move.

Same look as the renders: toon materials stepped into three bands, the baked-in ink outlines from Blender, and the brand palette.

The page loads three.js r160 from jsDelivr, so the folder can be dropped into any static host (including the portfolio site). Preview it locally from the `Framer agent` folder with the `dubs-3d` launch config, or run:

```bash
cd web && npx http-server -p 4321 -c-1
```

`dubs.glb` is exported from `build_dubs.py` (`--gltf`), so re-run the export after changing the model. The page finds his head, jaw, ears, tail and body by their pivot names, so keep those names.

## Rebuild or re-render

From this folder:

```bash
/Applications/Blender.app/Contents/MacOS/Blender -b -P build_dubs.py -- --stills --views --anim --gltf
```

Each flag is optional (`--views` renders the turnaround); with none, it only rebuilds `dubs.blend`. Each run starts fresh, so change shapes, colors or timing in `build_dubs.py` (not by hand in the `.blend`) and run it again.

## How he's built

- **Shapes**: smooth primitives (ellipsoids, cones, curves) with a subdivision modifier. The inside of the mouth only shows while the jaw is open.
  - **Body**: one pear-shaped torso, leaning slightly forward for a gentle curve in profile.
  - **Tail**: grows out of his lower back and curls up on his right. It is smooth and ends in a point. The white tip is painted onto the same surface with a vertex-color fade (`TIP_FADE`), so it blends out of the black with no seam. The web viewer reads the same colors.
- **Ink outlines**: an inverted-hull Solidify modifier with a back-face-culled ink material.
- **Cel shading**: Diffuse → Shader to RGB → a stepped Color Ramp → multiplied by the brand color and emitted. Lit areas show the exact sticker color, and the color is rendered with the *Standard* view transform.
- **Backdrop**: a curved cyclorama with a smooth version of the same shading, plus a soft contact-shadow decal under him.
- **Standing model** (`build_standing()`, hidden in the Blender renders): a chibi husky, matched to a reference sheet of chibi/puppy huskies.
  - The big head is about half his height and as wide as the body is long.
  - He keeps the same chubby build as when sitting (about 1.0 wide). The body is a round, compact bean (chest and hindquarters fused with `blob()`), with a chunky neck.
  - His chest stays white like the sitting one: the white runs from under the chin down between the front legs and along the belly.
  - Short, thick, nearly straight legs set wide, with round paws, and the same big round grey haunches as the sitting Dubs.
  - The tail curls up over his back.
  - The same head and bandana as the sitting Dubs, with every name prefixed `S_`.
  - Its joints are `S_BodyPivot`, `S_NeckPivot`/`S_HeadPivot`, `S_FrontLegPivot.*`, `S_HindLegPivot.*`, `S_HockPivot.*` and `S_TailPivot`.
  - Render its turnaround with `--stand-views` into `renders/stand-views/`.
- **Joints**: pivots (empties) act as a simple rig.
  - The hip carries the torso, chest, tail and neck. The neck carries the bandana and head.
  - The front legs hang from the shoulders.
  - Each hind leg has the haunch and its own foot joint.
- **Animation**: pivots (empties) for the head, jaw, ears, tail and body.
  - The head tilts, rears back and snaps forward on the bark.
  - The jaw drops to show the mouth and tongue.
  - The ears flick, the body squashes, and the tail wags throughout.
