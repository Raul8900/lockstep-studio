"""Contact sheet of rendered stills, labelled with their time.

  python3 engine/sheet.py "<glob of jpgs>" out.jpg [cols=6] [thumb_width=360]
"""
import glob, sys
from PIL import Image, ImageDraw
fs = sorted(glob.glob(sys.argv[1]))
out = sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 360
th = tw * 16 // 9
rows = (len(fs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * th), (0, 0, 0))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * tw, (i // cols) * th
    sheet.paste(im, (x, y))
    label = f.rsplit("_", 1)[-1].replace(".jpg", "").replace(".png", "")
    d.rectangle([x, y, x + 74, y + 18], fill=(0, 0, 0))
    d.text((x + 4, y + 3), label, fill=(255, 255, 0))
sheet.save(out, quality=88)
print(len(fs), "frames ->", sheet.size, out)
