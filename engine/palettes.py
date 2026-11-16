"""Render palettes from assets/palettes to an image, to look at while designing a style.

  python3 engine/palettes.py <video-dir> [query ...]

query words: dark, light, pastel, vivid, muted, warm, cool, or a hex colour (#E63946) to find
palettes containing something close to it. Several words narrow the search. Writes
<video>/out/palettes.jpg (48 palettes, each labelled with its hex values).
"""
import colorsys
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO, project_dir  # noqa: E402

ROOT = project_dir()
query = [q.lower() for q in sys.argv[2:]]
pals = json.load(open(REPO / "assets/palettes/nice-1000.json"))


def hls(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    return colorsys.rgb_to_hls(r, g, b)


def dist(a, b):
    return sum((int(a[i:i + 2], 16) - int(b[i:i + 2], 16)) ** 2 for i in (1, 3, 5)) ** 0.5


def match(p, q):
    c = [hls(x) for x in p]
    L = [x[1] for x in c]
    S = [x[2] for x in c]
    hues = [x[0] * 360 for x in c if x[2] > 0.25]
    if q == "dark":
        return sum(l < 0.25 for l in L) >= 2
    if q == "light":
        return sum(l > 0.85 for l in L) >= 2
    if q == "pastel":
        return sum(L) / 5 > 0.72 and sum(S) / 5 < 0.75
    if q == "vivid":
        return sum(s > 0.7 for s in S) >= 3
    if q == "muted":
        return sum(S) / 5 < 0.35
    if q == "warm":
        return len(hues) >= 3 and sum(h < 70 or h > 320 for h in hues) >= len(hues) - 1
    if q == "cool":
        return len(hues) >= 3 and sum(150 < h < 280 for h in hues) >= len(hues) - 1
    return True


words = [q for q in query if not q.startswith("#")]
hexes = [q.upper() for q in query if q.startswith("#") and len(q) == 7]
unknown = [q for q in words if q not in ("dark", "light", "pastel", "vivid", "muted", "warm", "cool")]
if unknown:
    sys.exit(f"unknown query word(s) {unknown}: use dark, light, pastel, vivid, muted, warm, cool or a #hex colour")
sel = [p for p in pals if all(match(p, q) for q in words)]
for hx in hexes:
    sel = sorted(sel, key=lambda p: min(dist(hx, c) for c in p))
sel = sel[:48]
if not sel:
    sys.exit("no palette matches; try fewer words")
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 15)
except OSError:
    font = ImageFont.load_default()
cols, cw, ch = 4, 440, 96
img = Image.new("RGB", (cols * cw, ((len(sel) + cols - 1) // cols) * ch), (24, 24, 28))
d = ImageDraw.Draw(img)
for i, p in enumerate(sel):
    x, y = (i % cols) * cw + 10, (i // cols) * ch + 8
    for k, c in enumerate(p):
        d.rectangle([x + k * 84, y, x + k * 84 + 82, y + 56], fill=c)
        d.text((x + k * 84 + 4, y + 62), c.upper(), fill=(225, 225, 230), font=font)
out = ROOT / "out/palettes.jpg"
out.parent.mkdir(exist_ok=True)
img.save(out, quality=90)
print(f"{len(sel)} palettes ({' '.join(query) or 'top of the list'}) -> {out}")
for p in sel[:12]:
    print("  " + " ".join(c.upper() for c in p))
