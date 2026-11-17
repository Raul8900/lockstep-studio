"""Tile the frames that `render.js <video> blocks` drew into one sheet.

  python3 engine/blocks_sheet.py <manifest.json> <out.jpg>

One frame per block: a grid, three to a row, each cell labelled with the block's name and what
it is for. Several frames per block (`lockstep blocks <video> barChart …`): one row per block,
its build-in from left to right, with the build-in progress under each frame.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
man = json.load(open(sys.argv[1]))
out = Path(sys.argv[2])
x0, y0, x1, y1 = man["crop"]
rows = man["rows"]
BG, INK, DIM = (22, 23, 27), (240, 242, 246), (150, 156, 168)


def font(size, bold=False):
    for f in ([REPO / f"assets/fonts/dm-sans/dm-sans-latin-{700 if bold else 500}-normal.woff2"]
              + [Path(f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf")]):
        try:
            return ImageFont.truetype(str(f), size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


def wrap(d, s, f, width):
    lines, cur = [], ""
    for w in s.split():
        nxt = (cur + " " + w).strip()
        if cur and d.textlength(nxt, font=f) > width:
            lines.append(cur)
            cur = w
        else:
            cur = nxt
    return lines + ([cur] if cur else [])


def frame(path, width):
    im = Image.open(path).convert("RGB").crop((x0, y0, x1, y1))
    return im.resize((width, round(width * (y1 - y0) / (x1 - x0))), Image.LANCZOS)


strips = any(len(r["images"]) > 1 for r in rows)
f_name, f_about, f_head = font(26, True), font(18), font(30, True)
pad, head = 24, 76
probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))

if not strips:                                     # every block, finished: a labelled grid
    cols, cw = 3, 400
    ch = round(cw * (y1 - y0) / (x1 - x0))
    lab = 32 + 3 * 24
    nrows = (len(rows) + cols - 1) // cols
    W, H = pad + cols * (cw + pad), head + nrows * (ch + lab + pad)
    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((pad, 22), f"lockstep blocks · look: {man.get('style', '')}", font=f_head, fill=INK)
    for i, r in enumerate(rows):
        x, y = pad + (i % cols) * (cw + pad), head + (i // cols) * (ch + lab + pad)
        sheet.paste(frame(r["images"][0], cw), (x, y))
        d.text((x, y + ch + 8), r["name"], font=f_name, fill=INK)
        for j, ln in enumerate(wrap(d, r["about"], f_about, cw)[:3]):
            d.text((x, y + ch + 42 + j * 22), ln, font=f_about, fill=DIM)
else:                                              # build-ins: one strip per block
    n = max(len(r["images"]) for r in rows)
    cw = 300 if n > 3 else 360
    ch = round(cw * (y1 - y0) / (x1 - x0))
    rh = 64 + ch + 30
    W, H = pad + n * (cw + 12), head + len(rows) * (rh + pad)
    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((pad, 22), f"lockstep blocks · build-in · look: {man.get('style', '')}", font=f_head, fill=INK)
    for i, r in enumerate(rows):
        y = head + i * (rh + pad)
        d.text((pad, y), r["name"], font=f_name, fill=INK)
        d.text((pad, y + 34), wrap(probe, r["about"], f_about, W - 2 * pad)[0], font=f_about, fill=DIM)
        for k, img in enumerate(r["images"]):
            x = pad + k * (cw + 12)
            sheet.paste(frame(img, cw), (x, y + 64))
            d.text((x, y + 64 + ch + 4), f"p = {r['stages'][k]:g}", font=f_about, fill=DIM)

sheet.save(out, quality=86)
print(f"{len(rows)} block{'s' if len(rows) != 1 else ''} -> {out}  ({sheet.size[0]} x {sheet.size[1]})")
