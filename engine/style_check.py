"""Check a video's style.json for legibility and for things the renderer cannot resolve.

  python3 engine/style_check.py <video-dir>
  python3 engine/style_check.py --style path/to/style.json     (a candidate or library style on its own)

A style is free to look like anything, but text must stay readable on a phone, the five
colour roles must be told apart, and every font must exist. FAIL rows stop the build;
warn rows need a decision.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO, project_dir  # noqa: E402

if len(sys.argv) > 2 and sys.argv[1] == "--style":
    ROOT, STYLE_PATH = None, Path(sys.argv[2])
else:
    ROOT = project_dir()
    STYLE_PATH = ROOT / "style.json"
BACKDROPS = re.findall(r"^  (?:/\*.*?\*/\s*)?(\w+)\s*(?:\(|:)", (REPO / "engine/anim/js/backdrops.js").read_text().split("const BACKDROPS = {")[1], re.M)
TRANSITIONS = ["fade", "cut", "zoomIn", "zoomOut", "panDown", "panUp", "slideLeft", "slideRight", "flash"]
KEYS = {"name", "about", "first_used_in", "mode", "palette", "fonts", "backdrop", "post", "captions", "hud", "shape", "transition"}
DEFAULT = {"bg": ["#05080D", "#090E17", "#04060A"], "ink": "#F3F8FF", "subject": "#27E1FF", "accent": "#FFA91E", "data": "#A073FF",
           "alert": "#FF5F70", "good": "#4DFFB5"}
rows, failed = [], 0


def row(status, name, detail):
    global failed
    failed += status == "FAIL"
    rows.append((status, name, detail))


def rgb(h):
    return [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def lum(h):
    c = [(v / 255 / 12.92) if v / 255 <= 0.03928 else ((v / 255 + 0.055) / 1.055) ** 2.4 for v in rgb(h)]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def lab(h):
    c = [(v / 255 / 12.92) if v / 255 <= 0.04045 else ((v / 255 + 0.055) / 1.055) ** 2.4 for v in rgb(h)]
    x = (0.4124 * c[0] + 0.3576 * c[1] + 0.1805 * c[2]) / 0.95047
    y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    z = (0.0193 * c[0] + 0.1192 * c[1] + 0.9505 * c[2]) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def delta_e(a, b):
    return sum((p - q) ** 2 for p, q in zip(lab(a), lab(b))) ** 0.5


path = STYLE_PATH
if not path.exists():
    print("  no style.json: the video uses the engine's built-in look (neon-blueprint).")
    S = {}
else:
    try:
        S = json.load(open(path, encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"{path.name} is not valid JSON: {e}")

unknown = sorted(set(S) - KEYS)
if unknown:
    row("warn", "unknown keys", f"{unknown} are ignored — check the spelling (known: {sorted(KEYS)})")

# ---- palette
P = dict(DEFAULT)
given = S.get("palette", {})
bad = [f"{k}={v!r}" for k, v in given.items() for h in (v if isinstance(v, list) else [v]) if not re.fullmatch(r"#[0-9A-Fa-f]{6}", str(h))]
if bad:
    row("FAIL", "palette values", "must be 6-digit hex like #1F5FBF: " + ", ".join(bad))
else:
    P.update(given)
    if given:
        missing = [k for k in ("bg", "ink", "subject", "accent", "data", "alert", "good") if k not in given]
        if missing:
            row("FAIL", "palette is incomplete", f"missing {missing}: a palette needs bg, ink and all five roles")
    bg = P["bg"] if isinstance(P["bg"], list) else [P["bg"]]
    mid = bg[min(1, len(bg) - 1)]
    light = S.get("mode", "light" if lum(mid) > 0.4 else "dark") == "light"
    worst = min(contrast(P["ink"], b) for b in bg)
    row("PASS" if worst >= 7 else "warn" if worst >= 4.5 else "FAIL", "ink on background", f"contrast {worst:.1f}:1 (aim for 7 or more; under 4.5 is unreadable on a phone)")
    for r in ("subject", "accent", "data", "alert", "good"):
        c = min(contrast(P[r], b) for b in bg)
        row("PASS" if c >= 3 else "warn" if c >= 2.2 else "FAIL", f"{r} on background", f"{P[r]}  contrast {c:.1f}:1 (3 or more for lines and labels in this colour)")
    roles = ["subject", "accent", "data", "alert", "good"]
    close = [(a, b, delta_e(P[a], P[b])) for i, a in enumerate(roles) for b in roles[i + 1:] if delta_e(P[a], P[b]) < 20]
    row("warn" if close else "PASS", "roles are distinct", "; ".join(f"{a}/{b} look alike (ΔE {d:.0f})" for a, b, d in close) or "all five can be told apart")
    span = max(lum(b) for b in bg) - min(lum(b) for b in bg)
    if span > 0.25:
        row("warn", "background gradient", "very wide brightness range: text will not be equally readable top and bottom")
    C = S.get("captions", {})
    if C.get("highlight") == "box":
        # same rule as applyStyle() in engine/anim/js/core.js
        on = C.get("boxText") or given.get("onAccent") or ((P["ink"] if light else bg[-1]) if lum(P["subject"]) > 0.35 else (bg[min(1, len(bg) - 1)] if light else P["ink"]))
        on = P.get(on, on) if not str(on).startswith("#") else on
        c = min(contrast(on, P[r]) for r in ("subject", "accent", "data", "alert"))
        row("PASS" if c >= 3 else "warn", "caption box text", f"text on the highlight boxes: contrast {c:.1f}:1 at worst (set palette.onAccent or captions.boxText if low)")
    if C.get("strokeW", 15) == 0 and S.get("post", {}).get("scrim", 0.6) == 0 and worst < 9:
        row("warn", "captions without outline", "no outline and no scrim: captions rely on plain contrast with whatever a scene draws behind them")

# ---- fonts
index = json.load(open(REPO / "assets/fonts/index.json")) if (REPO / "assets/fonts/index.json").exists() else {}
try:
    installed = subprocess.run(["fc-list", ":", "family"], capture_output=True, text=True).stdout
except FileNotFoundError:
    installed = ""
fonts = {"display": "Inter Display", "body": "Inter", "mono": "JetBrains Mono"}
fonts.update(S.get("fonts", {}))
for role, fam in fonts.items():
    if fam in index:
        ws = [f["weight"] for f in index[fam]]
        note = "" if len(ws) > 1 else "  (one weight only: every bold/regular request renders the same)"
        row("PASS", f"font {role}", f"{fam} — bundled, weights {ws}{note}")
    elif re.search(rf"(^|[:,]){re.escape(fam)}(,|:|$)", installed, re.M):
        row("PASS", f"font {role}", f"{fam} — installed on this machine")
    else:
        row("FAIL", f"font {role}", f"{fam!r} is not in assets/fonts and not installed (bin/lockstep fonts lists what is available)")
cap = S.get("captions", {})
cf = cap.get("font", "disp")
if cf not in ("disp", "ui", "mono") and cf not in index:
    row("FAIL", "captions.font", f"{cf!r}: use disp, ui or mono, or a bundled family name")
if cap.get("size", 74) < 56:
    row("FAIL", "caption size", f"{cap['size']} px is too small for a phone (56 or more; 68-92 is typical)")
if not 1150 <= cap.get("y", 1350) <= 1400:
    row("FAIL", "caption position", f"y = {cap['y']}: keep the caption centre between 1150 and 1400 (platform interface below, diagrams above)")
if cap.get("highlight", "color") not in ("color", "box", "underline"):
    row("FAIL", "captions.highlight", f"{cap['highlight']!r}: choose color, box or underline")
if cap.get("maxW", 800) > 860:
    row("FAIL", "caption width", "maxW over 860 runs under the platform buttons")

# ---- backdrop, transitions, hud
bd = S.get("backdrop", {}).get("type", "circuit")
custom = ROOT is not None and (ROOT / "components.js").exists() and "window.drawBackdrop" in (ROOT / "components.js").read_text()
if custom:
    row("PASS", "backdrop", "custom (window.drawBackdrop in components.js)")
elif bd in BACKDROPS:
    row("PASS", "backdrop", bd)
else:
    row("FAIL", "backdrop", f"unknown type {bd!r}; library: {', '.join(BACKDROPS)} — or draw your own in components.js")
tr = S.get("transition", {})
if tr.get("default", "fade") not in TRANSITIONS:
    row("FAIL", "transition.default", f"{tr['default']!r}; choose from {', '.join(TRANSITIONS)}")
if not 0.2 <= tr.get("duration", 0.84) <= 1.2:
    row("FAIL", "transition.duration", f"{tr['duration']} s: keep between 0.2 and 1.2")
if S.get("hud", {}).get("type", "segments") not in ("segments", "line", "none"):
    row("FAIL", "hud.type", "choose segments, line or none")

# ---- is this just an example, unchanged?
core = lambda d: json.dumps({k: d.get(k) for k in ("palette", "fonts", "backdrop")}, sort_keys=True)
for ex in sorted((REPO / "styles").glob("*.json")):
    if S and ex.resolve() != path.resolve() and core(json.load(open(ex))) == core(S):
        row("warn", "same as an example", f"palette, fonts and backdrop are identical to styles/{ex.name}: fine only if the brief argues this topic calls for exactly that look")

print(f"\n  style: {S.get('name', 'neon-blueprint (built-in)')}")
for st, name, detail in rows:
    print(f"  {st:<5} {name:<24} {detail}")
print()
sys.exit(1 if failed else 0)
