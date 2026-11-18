"""Check a video's style.json for legibility and for things the renderer cannot resolve.

  python3 engine/style_check.py <video-dir>
  python3 engine/style_check.py --style path/to/style.json     (a candidate on its own)

style.json decides what is not the picture itself: the colour grade every photograph, clip and
3D render gets, the captions, the fonts and colours of the overlays, the finish and the default
cut. All of it is optional — the defaults are the short-form look (big white captions with a
shadow, one key word in yellow). FAIL rows stop the build; warn rows need a decision.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO, project_dir  # noqa: E402

if len(sys.argv) > 2 and sys.argv[1] == "--style":
    STYLE_PATH = Path(sys.argv[2])
else:
    STYLE_PATH = project_dir() / "style.json"
TRANSITIONS = ["fade", "cut", "zoomIn", "zoomOut", "panDown", "panUp", "slideLeft", "slideRight", "flash"]
GL_NAMES = {t["name"].lower(): t["name"] for t in json.load(open(REPO / "engine/anim/vendor/gl-transitions/transitions.json"))["transitions"]}
KEYS = {"name", "about", "mode", "palette", "fonts", "post", "grade", "captions", "shape", "transition"}
ROLES = ("subject", "accent", "data", "alert", "good", "ink", "bg", "text", "dim", "faint", "panel", "panelHi", "line", "lineHi", "onAccent")
rows, failed = [], 0


def row(status, name, detail):
    global failed
    failed += status == "FAIL"
    rows.append((status, name, detail))


def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


HEX = re.compile(r"^#[0-9a-fA-F]{6}$")
if not STYLE_PATH.exists():
    print("  no style.json: the video uses the engine's defaults (the short-form look).")
    S = {}
else:
    try:
        S = json.load(open(STYLE_PATH, encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"{STYLE_PATH.name} is not valid JSON: {e}")

unknown = sorted(set(S) - KEYS)
if unknown:
    row("warn", "unknown keys", f"{unknown} are ignored (known: {sorted(KEYS)}; the old backdrop, hud and lottie keys are gone)")

# ---- palette: the colours overlays and 3D materials take by role
P = S.get("palette", {})
bad = [f"{k}: {v}" for k, v in P.items() if k in ROLES and not (isinstance(v, str) and HEX.match(v)) and k != "bg"]
if bad:
    row("FAIL", "palette values", "must be 6-digit hex like #FFD23F: " + ", ".join(bad))
odd = sorted(set(P) - set(ROLES))
if odd:
    row("warn", "palette keys", f"{odd} are not roles (roles: {', '.join(ROLES[:6])}, bg …)")
row("PASS", "palette", ", ".join(f"{k} {v}" for k, v in P.items() if isinstance(v, str)) or "engine defaults")

# ---- grade: one look for every picture, clip and render
G = S.get("grade", {})
LIMITS = {"contrast": (0.75, 1.4), "saturate": (0, 1.8), "brightness": (0.7, 1.3), "sepia": (0, 1), "tintAmount": (0, 0.5)}
for k, (lo, hi) in LIMITS.items():
    if k in G and not (isinstance(G[k], (int, float)) and lo <= G[k] <= hi):
        row("FAIL", f"grade.{k}", f"{G.get(k)!r}: keep it within {lo}–{hi} (outside that, pictures fall apart)")
if G.get("tint") and not (G["tint"] in ROLES or HEX.match(str(G["tint"]))):
    row("FAIL", "grade.tint", f"{G['tint']!r}: a palette role or #hex")
if G:
    row("PASS", "grade", ", ".join(f"{k} {v}" for k, v in G.items()))

# ---- captions
C = S.get("captions", {})
fill, key = C.get("fill", "#FFFFFF"), C.get("key", "#FFD23F")
for name, v in (("fill", fill), ("key", key)):
    if not (HEX.match(str(v)) or v in ROLES):
        row("FAIL", f"captions.{name}", f"{v!r}: #hex or a palette role")
if C.get("size", 70) < 56:
    row("FAIL", "caption size", f"{C['size']} px is too small for a phone (56 or more; 64-80 is typical)")
if not 1000 <= C.get("y", 1265) <= 1420:
    row("FAIL", "caption position", f"y = {C['y']}: keep the caption centre between 1000 and 1420 (the platform's text and buttons sit below)")
if C.get("maxW", 820) > 860:
    row("FAIL", "caption width", "maxW over 860 runs under the platform buttons")
if C.get("highlight", "color") not in ("color", "box", "underline"):
    row("FAIL", "captions.highlight", f"{C['highlight']!r}: choose color, box or underline")
if C.get("strokeW", 9) == 0 and C.get("shadow", 0.85) < 0.4:
    row("warn", "captions on pictures", "no outline and little shadow: white captions vanish on bright skies and paper — keep strokeW or shadow")
if HEX.match(str(fill)) and lum(fill) < 0.5:
    row("warn", "caption colour", f"{fill} is dark: on real pictures, light captions with a dark outline read best")
if HEX.match(str(key)) and HEX.match(str(fill)) and contrast(key, fill) < 1.25:
    row("warn", "key word colour", f"{key} is hard to tell from the caption colour {fill}")

# ---- fonts
index = json.load(open(REPO / "assets/fonts/index.json")) if (REPO / "assets/fonts/index.json").exists() else {}
try:
    installed = subprocess.run(["fc-list", ":", "family"], capture_output=True, text=True).stdout
except FileNotFoundError:
    installed = ""
fonts = {"display": "Poppins", "body": "Inter", "mono": "JetBrains Mono"}
fonts.update(S.get("fonts", {}))
for role, fam in fonts.items():
    if fam in index:
        row("PASS", f"font {role}", f"{fam} — bundled, weights {[f['weight'] for f in index[fam]]}")
    elif re.search(rf"(^|[:,]){re.escape(fam)}(,|:|$)", installed, re.M):
        row("PASS", f"font {role}", f"{fam} — installed on this machine")
    else:
        row("FAIL", f"font {role}", f"{fam!r} is not in assets/fonts and not installed (lockstep fonts lists what is available)")
cf = C.get("font", "disp")
if cf not in ("disp", "ui", "mono") and cf not in index:
    row("FAIL", "captions.font", f"{cf!r}: use disp, ui or mono, or a bundled family name")

# ---- transition
T = S.get("transition", {})
d = T.get("default", "cut")
if not (d in TRANSITIONS or (d.startswith("gl:") and d[3:].lower() in GL_NAMES)):
    row("FAIL", "transition.default", f"{d!r}: one of {', '.join(TRANSITIONS)} or gl:<Name> (lockstep transitions)")
if not 0.1 <= T.get("duration", 0.35) <= 1.5:
    row("FAIL", "transition.duration", f"{T['duration']} s: between 0.1 and 1.5")

for st, name, detail in rows:
    print(f"  {st:<4}  {name:<22} {detail}")
sys.exit(1 if failed else 0)
