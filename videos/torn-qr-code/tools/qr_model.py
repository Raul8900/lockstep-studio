"""Build and verify the hero QR code of this video, and write it into components.js.

The video draws a real QR code ("STILL HERE", version 1, level H) and claims things about it:
how many bytes it has, which ones a tear destroys, that it still scans when torn, that a blank
"logo" square in the middle is survivable, and that a small tear through a corner square is not.
This script makes those claims checkable:

  * encodes the message with segno and reads back the 21 x 21 module matrix;
  * walks the standard zig-zag placement to find the 8 modules of each of the 26 codewords;
  * recomputes the 17 check bytes with an independent Reed-Solomon library (reedsolo) and asserts
    they match the code (so the codeword map, the mask and RS(26,9) over GF(256)/0x11D are right);
  * renders the code with each damage shape and decodes it with zxing-cpp;
  * writes tools/qr_model.json and the QR block between the markers in components.js.

Run (needs: pip install segno reedsolo zxing-cpp pillow numpy):
    python tools/qr_model.py
"""
import json, math, os, random, sys

import numpy as np
import reedsolo
import segno
import zxingcpp
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.dirname(HERE)
MSG = 'STILL HERE'

q = segno.make(MSG, error='h', version=1, boost_error=False, micro=False)
assert (q.version, q.error, q.mode) == (1, 'H', 'alphanumeric'), (q.version, q.error, q.mode)
mat = np.array([[1 if v else 0 for v in row] for row in q.matrix], dtype=np.uint8)
N = mat.shape[0]
assert N == 21

# ---- function modules (finder + separator, timing, format information, dark module) ----
fn = np.zeros((N, N), bool)
for (r0, c0) in [(0, 0), (0, N - 7), (N - 7, 0)]:
    for r in range(r0 - 1, r0 + 8):
        for c in range(c0 - 1, c0 + 8):
            if 0 <= r < N and 0 <= c < N:
                fn[r, c] = True
fn[6, :] = True
fn[:, 6] = True
for i in range(9):
    fn[8, i] = fn[i, 8] = True
for i in range(8):
    fn[8, N - 1 - i] = True
for i in range(8):
    fn[N - 1 - i, 8] = True

# ---- zig-zag placement: two-module columns from the bottom right, alternating up and down ----
order, right, upward = [], N - 1, True
while right >= 1:
    if right == 6:
        right = 5
    for r in (range(N - 1, -1, -1) if upward else range(N)):
        for c in (right, right - 1):
            if not fn[r, c]:
                order.append((r, c))
    upward, right = not upward, right - 2
assert len(order) == 208
cw = [order[i * 8:(i + 1) * 8] for i in range(26)]

MASKS = [lambda r, c: (r + c) % 2 == 0, lambda r, c: r % 2 == 0, lambda r, c: c % 3 == 0,
         lambda r, c: (r + c) % 3 == 0, lambda r, c: (r // 2 + c // 3) % 2 == 0,
         lambda r, c: (r * c) % 2 + (r * c) % 3 == 0, lambda r, c: ((r * c) % 2 + (r * c) % 3) % 2 == 0,
         lambda r, c: ((r + c) % 2 + (r * c) % 3) % 2 == 0]
mk = MASKS[q.mask]
vals = []
for mods in cw:
    b = 0
    for (r, c) in mods:
        b = (b << 1) | int(mat[r, c] ^ (1 if mk(r, c) else 0))
    vals.append(b)
reedsolo.init_tables(0x11d)
ec = reedsolo.rs_encode_msg(bytes(vals[:9]), 17, gen=reedsolo.rs_generator_poly(17))
assert list(ec[9:]) == vals[9:], 'codeword map does not reproduce the Reed-Solomon check bytes'

# ---- damage shapes, in module coordinates (x = column, y = row; the code spans 0..21) ----
def ragged(p0, p1, seed, amp, n):
    rnd = random.Random(seed)
    pts = []
    for i in range(n + 1):
        t = i / n
        x, y = p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t
        if 0 < i < n:
            nx, ny = -(p1[1] - p0[1]), (p1[0] - p0[0])
            L = math.hypot(nx, ny)
            j = (rnd.random() - 0.5) * 2 * amp
            x, y = x + nx / L * j, y + ny / L * j
        pts.append((round(x, 3), round(y, 3)))
    return pts

STICKER = 2.0   # sticker margin around the code, in modules
# the hook's tear: a diagonal rip across the bottom-right corner of the sticker
tear_edge = ragged((10.2, N + STICKER), (N + STICKER, 10.2), seed=5, amp=0.55, n=18)
TEAR = tear_edge + [(N + STICKER, N + STICKER)]
# the fine print: a small rip through the top-left corner square only
FINDER_EDGE = ragged((7.0, -STICKER), (-STICKER, 7.0), seed=7, amp=0.35, n=12)
FINDER_TEAR = [(-STICKER, -STICKER)] + FINDER_EDGE
# the logo: a blank 7 x 7 square in the middle
LOGO = [(7, 7), (14, 7), (14, 14), (7, 14)]

S, QZ = 20, 4
def render(polys=()):
    img = Image.new('L', ((N + 2 * QZ) * S, (N + 2 * QZ) * S), 255)
    d = ImageDraw.Draw(img)
    for r in range(N):
        for c in range(N):
            if mat[r, c]:
                d.rectangle([(c + QZ) * S, (r + QZ) * S, (c + QZ + 1) * S - 1, (r + QZ + 1) * S - 1], fill=0)
    for poly in polys:
        d.polygon([((x + QZ) * S, (y + QZ) * S) for (x, y) in poly], fill=255)
    return img

def decode(img):
    return [r.text for r in zxingcpp.read_barcodes(img)]

def damage(poly):
    im = Image.new('L', (N * 10, N * 10), 0)
    ImageDraw.Draw(im).polygon([(x * 10, y * 10) for (x, y) in poly], fill=255)
    a = np.array(im)
    inside = a[5::10, 5::10] > 0                       # module centres inside the shape
    m2 = mat.copy()
    m2[inside] = 0                                     # torn or covered -> reads as light
    changed = [k for k, mods in enumerate(cw) if any(m2[r, c] != mat[r, c] for (r, c) in mods)]
    hit_fn = int((inside & fn).sum())
    area = float((a > 0).mean())
    return changed, hit_fn, area, inside

results = {}
for name, poly in (('clean', None), ('tear', TEAR), ('logo', LOGO), ('finder_tear', FINDER_TEAR)):
    if poly is None:
        results[name] = {'decoded': decode(render())}
        continue
    changed, hit_fn, area, inside = damage(poly)
    results[name] = {'decoded': decode(render([poly])), 'changed_codewords': changed,
                     'function_modules_hit': hit_fn, 'area_of_code': round(area, 4),
                     'modules': [[int(r), int(c)] for r, c in zip(*np.nonzero(inside))]}
for k, v in results.items():
    print(f"{k:12s} decoded={v['decoded']}", {kk: vv for kk, vv in v.items() if kk not in ('decoded', 'modules')})
assert results['clean']['decoded'] == [MSG]
assert results['tear']['decoded'] == [MSG] and len(results['tear']['changed_codewords']) <= 8
assert results['logo']['decoded'] == [MSG]
assert results['finder_tear']['decoded'] == [] and results['finder_tear']['changed_codewords'] == []

# the limit: 8 changed codewords decode, 9 do not (flip every module of k codewords)
limit = {}
for k in (7, 8, 9, 10):
    worst = []
    for start in range(0, 26 - k + 1, 3):
        m2 = mat.copy()
        for idx in range(start, start + k):
            for (r, c) in cw[idx]:
                m2[r, c] ^= 1
        img = Image.new('L', ((N + 2 * QZ) * S, (N + 2 * QZ) * S), 255)
        d = ImageDraw.Draw(img)
        for r in range(N):
            for c in range(N):
                if m2[r, c]:
                    d.rectangle([(c + QZ) * S, (r + QZ) * S, (c + QZ + 1) * S - 1, (r + QZ + 1) * S - 1], fill=0)
        worst.append(decode(img) == [MSG])
    limit[k] = f'{sum(worst)}/{len(worst)} decode'
print('codewords fully flipped ->', limit)

# robustness: each damage shape under random scale, rotation, sub-pixel offset and JPEG quality
import io
def render_var(poly, m, rot, off, q, bg=(240, 234, 220)):
    size = int((N + 2 * STICKER) * m) + 200
    img = Image.new('RGB', (size, size), bg)
    d = ImageDraw.Draw(img)
    P = lambda x, y: (100 + off[0] + (x + STICKER) * m, 100 + off[1] + (y + STICKER) * m)
    d.rectangle([P(-STICKER, -STICKER), P(N + STICKER, N + STICKER)], fill=(255, 253, 248))
    for r in range(N):
        for c in range(N):
            if mat[r, c]:
                a, b = P(c, r), P(c + 1, r + 1)
                d.rectangle([a, (b[0] - 1, b[1] - 1)], fill=(27, 26, 31))
    if poly:
        d.polygon([P(x, y) for x, y in poly], fill=bg)
    img = img.rotate(rot, resample=Image.BICUBIC, fillcolor=bg)
    buf = io.BytesIO(); img.save(buf, 'JPEG', quality=q); buf.seek(0)
    return Image.open(buf)
robust = {}
for name, poly in (('tear', TEAR), ('logo', LOGO), ('finder_tear', FINDER_TEAR)):
    rnd, ok = random.Random(1), 0
    for i in range(80):
        img = render_var(poly, rnd.uniform(14, 30), rnd.uniform(-2.5, 2.5), (rnd.random(), rnd.random()), rnd.choice([70, 85, 95]))
        ok += decode(img) == [MSG]
    robust[name] = f'{ok}/80 decode'
print('robustness ->', robust)
assert robust['tear'] == '80/80 decode' and robust['logo'] == '80/80 decode' and robust['finder_tear'] == '0/80 decode', robust

# ---- boundaries of each codeword (for drawing them as bricks) ----
owner = -np.ones((N, N), int)
for k, mods in enumerate(cw):
    for (r, c) in mods:
        owner[r, c] = k
edges = []
for k, mods in enumerate(cw):
    segs = []
    for (r, c) in mods:
        for (dr, dc, seg) in ((-1, 0, ((c, r), (c + 1, r))), (1, 0, ((c, r + 1), (c + 1, r + 1))),
                              (0, -1, ((c, r), (c, r + 1))), (0, 1, ((c + 1, r), (c + 1, r + 1)))):
            rr, cc = r + dr, c + dc
            if not (0 <= rr < N and 0 <= cc < N) or owner[rr, cc] != k:
                segs.append([list(seg[0]), list(seg[1])])
    edges.append(segs)

model = {
    'msg': MSG, 'version': 1, 'level': 'H', 'mask': int(q.mask), 'n': N, 'sticker': STICKER,
    'matrix': [''.join(str(int(v)) for v in row) for row in mat],
    'fn': [''.join('1' if v else '0' for v in row) for row in fn],
    'codewords': [[[int(r), int(c)] for (r, c) in mods] for mods in cw],
    'values': [int(v) for v in vals], 'data': 9, 'ec': 17,
    'edges': edges,
    'tear': TEAR, 'tearEdge': tear_edge, 'finderTear': FINDER_TEAR, 'finderEdge': FINDER_EDGE, 'logo': LOGO,
    'damage': {k: {kk: vv for kk, vv in v.items() if kk != 'decoded'} for k, v in results.items() if k != 'clean'},
    'checks': {k: v['decoded'] for k, v in results.items()} | {'limit': limit, 'robustness': robust},
}
json.dump(model, open(os.path.join(HERE, 'qr_model.json'), 'w'), indent=1)

# ---- write the QR block into components.js ----
js = 'const QRM = ' + json.dumps({k: model[k] for k in ('msg', 'n', 'sticker', 'matrix', 'fn', 'codewords', 'values', 'data', 'ec',
                                                    'edges', 'tear', 'tearEdge', 'finderTear', 'finderEdge', 'logo', 'damage')},
                                  separators=(',', ':')) + ';'
comp = os.path.join(VIDEO, 'components.js')
src = open(comp).read()
B, E = '/* QR-MODEL:BEGIN (written by tools/qr_model.py) */', '/* QR-MODEL:END */'
if B in src and E in src:
    src = src[:src.index(B)] + B + '\n' + js + '\n' + src[src.index(E):]
    open(comp, 'w').write(src)
    print('components.js: QR block updated')
else:
    print('components.js has no QR-MODEL markers; block not written')
