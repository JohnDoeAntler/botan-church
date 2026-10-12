#!/usr/bin/env python3
"""
Imports hand-edited teal shards from an SVG exported by a vector editor (SVGMaker, Figma, Illustrator…)
back into the title config, then rebuilds the title.

  python scripts/import-title-shards.py path/to/edited.svg

Editors usually drop our ids, move everything into new groups / transforms and restyle fills, so the file
can't be pasted over src/sections/hero/art/botan-church.svg. This script instead:
  1. reads every <path>, applying its ancestors' transforms, and sorts them by fill colour into teal shards and
     ink (letter) outlines;
  2. finds where the editor moved things by lining up the bounding box of its ink outlines with ours;
  3. moves the teal shards back into the title's coordinates and writes them to `shardsTraced` in the config
     (the build gives each one to the letter it overlaps most). Letter outlines always come from the font.
"""
import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NUM = r"-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?"

p = argparse.ArgumentParser()
p.add_argument("svg", help="SVG exported from the editor")
p.add_argument("--config", default="scripts/titles/botan-church.json")
p.add_argument("--no-build", action="store_true")
a = p.parse_args()


def parse_transform(t):
    """Affine (a, b, c, d, e, f) of a transform attribute (matrix / translate / scale)."""
    m = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    for name, args in re.findall(r"(\w+)\s*\(([^)]*)\)", t or ""):
        v = [float(x) for x in re.findall(NUM, args)]
        if name == "matrix":
            n = tuple(v)
        elif name == "translate":
            n = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif name == "scale":
            n = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        else:
            raise SystemExit(f"unsupported transform: {name}")
        m = mul(m, n)
    return m


def mul(m, n):
    a1, b1, c1, d1, e1, f1 = m
    a2, b2, c2, d2, e2, f2 = n
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2, a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def map_path(d, m):
    """Applies affine `m` to a path made of absolute M/L/Q/C/T/S/Z commands (every number is an x,y pair)."""
    bad = sorted(set(re.findall(r"[HVAhvamlqcts]", d)))
    if bad:
        raise SystemExit(f"path uses commands this importer doesn't handle: {bad} (export with absolute coordinates)")
    out, pending = [], []
    for tok in re.findall(rf"[A-Za-z]|{NUM}", d):
        if tok.isalpha():
            out.append(tok)
            continue
        pending.append(float(tok))
        if len(pending) == 2:
            x, y = pending
            pending = []
            out.append(f"{m[0] * x + m[2] * y + m[4]:.2f} {m[1] * x + m[3] * y + m[5]:.2f}")
    return " ".join(out).replace(" Z", "Z")


def bbox(ds):
    pts = [tuple(map(float, re.findall(NUM, pair))) for d in ds for pair in re.findall(rf"{NUM}\s+{NUM}", d)]
    xs = [x for x, _ in pts]
    ys = [y for _, y in pts]
    return min(xs), min(ys), max(xs), max(ys)


def fill_of(el):
    style = el.get("style", "")
    m = re.search(r"fill\s*:\s*([^;]+)", style)
    return (m.group(1) if m else el.get("fill", "")).strip().lower()


def is_teal(fill):
    nums = [float(v) for v in re.findall(NUM, fill)]
    if fill.startswith("#") and len(fill) in (4, 7):
        h = fill[1:] if len(fill) == 7 else "".join(c * 2 for c in fill[1:])
        nums = [int(h[i : i + 2], 16) for i in (0, 2, 4)]
    if len(nums) < 3:
        return False
    r, g, b = nums[:3]
    return g - r > 40 and b - r > 30


# 1. collect paths with their accumulated transform, split by colour
teal, ink = [], []


def walk(el, m):
    m = mul(m, parse_transform(el.get("transform")))
    if el.tag.endswith("path") and el.get("d"):
        (teal if is_teal(fill_of(el)) else ink).append(map_path(el.get("d"), m))
    for child in el:
        walk(child, m)


walk(ET.parse(a.svg).getroot(), (1, 0, 0, 1, 0, 0))
if not teal or not ink:
    raise SystemExit(f"found {len(teal)} teal and {len(ink)} ink paths — need both to line the file up")

# 2. line the editor's letters up with ours
cfg_path = ROOT / a.config
cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
# our letters: rebuild the title from the config first, so this works even if the editor's file was pasted over it
subprocess.run(["node", "scripts/build-title-svg.mjs", a.config], cwd=ROOT, check=True)
ours = re.findall(r'id="glyph-\d+-ink"[^>]*\sd="([^"]+)"', (ROOT / cfg["out"]).read_text(encoding="utf-8"))
def first_point(d):
    return tuple(map(float, re.findall(NUM, d)[:2]))


# exact: the editor keeps each outline's points, so the start points of matching letters give the offset
if len(ink) == len(ours):
    offs = [(o[0] - e[0], o[1] - e[1]) for e, o in ((first_point(e), first_point(o)) for e, o in zip(ink, ours))]
    xs = sorted(x for x, _ in offs)
    ys = sorted(y for _, y in offs)
    mx, my = xs[len(xs) // 2], ys[len(ys) // 2]
    spread = max(max(abs(x - mx), abs(y - my)) for x, y in offs)
    if spread > 1:
        print(f"note: letter outlines don't line up uniformly (up to {spread:.1f}px off) — were letters moved in the editor?")
    align = (1, 0, 0, 1, mx, my)
else:
    # fallback: line up the bounding boxes of all letter outlines
    ex0, ey0, ex1, ey1 = bbox(ink)
    ox0, oy0, ox1, oy1 = bbox(ours)
    sx = (ox1 - ox0) / (ex1 - ex0)
    sy = (oy1 - oy0) / (ey1 - ey0)
    align = (sx, 0, 0, sy, ox0 - ex0 * sx, oy0 - ey0 * sy)
    print(f"note: {len(ink)} outlines in the file vs {len(ours)} letters; aligned by bounding box")
print(f"{len(ink)} letter outlines, {len(teal)} teal shards; editor offset {align[4]:+.2f}, {align[5]:+.2f}")

# 3. back into title coordinates → config → build
cfg["shardsTraced"] = [map_path(d, align) for d in teal]
cfg_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"wrote {len(teal)} shards into {a.config}")
if not a.no_build:
    subprocess.run(["node", "scripts/build-title-svg.mjs", a.config], cwd=ROOT, check=True)
