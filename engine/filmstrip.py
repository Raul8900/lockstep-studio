"""Filmstrips of consecutive rendered frames, for checking motion through a transition.

  python3 engine/filmstrip.py <video-dir> out.jpg start:end[:n] [start:end[:n] ...]

Each start:end[:n] (seconds) becomes one row of n evenly spaced frames (default 10),
read from <video-dir>/out/frames, so render that range first.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import project_dir  # noqa: E402

P = project_dir()
F = str(P / "out/frames/f%05d.jpg")
out = sys.argv[2]
specs = [a.split(":") for a in sys.argv[3:]]
tw, th = 216, 384
rows = []
for sp in specs:
    a, b = float(sp[0]), float(sp[1])
    n = int(sp[2]) if len(sp) > 2 else 10
    rows.append([a + (b - a) * k / (n - 1) for k in range(n)])
W = max(len(r) for r in rows) * tw
sheet = Image.new("RGB", (W, len(rows) * th), (0, 0, 0))
d = ImageDraw.Draw(sheet)
for j, r in enumerate(rows):
    for i, t in enumerate(r):
        im = Image.open(F % round(t * 30)).convert("RGB").resize((tw, th), Image.LANCZOS)
        sheet.paste(im, (i * tw, j * th))
        d.rectangle([i * tw, j * th, i * tw + 54, j * th + 14], fill=(0, 0, 0))
        d.text((i * tw + 3, j * th + 1), f"{t:.2f}", fill=(255, 255, 0))
sheet.save(out, quality=88)
print(out, sheet.size)
