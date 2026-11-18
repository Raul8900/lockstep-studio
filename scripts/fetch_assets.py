#!/usr/bin/env python3
"""Rebuild assets/ from their open-licence sources (the results are committed; run this only to add or update).

  python3 scripts/fetch_assets.py [fonts] [icons]        (no argument = both)

  fonts     Open Font License families from the Fontsource npm packages (Latin subset, WOFF2)
            -> assets/fonts/<id>/*.woff2 + LICENSE, assets/fonts/index.json
  icons     Lucide (ISC licence) -> assets/icons/lucide.json (name -> SVG path data), names.txt

Needs npm and network access to the npm registry. To add a font: add its Fontsource id to FONTS and run
`python3 scripts/fetch_assets.py fonts`. Only add families whose licence allows redistribution (OFL, Apache).
"""
import json
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ASSETS = REPO / "assets"

# id -> (role hint, character)
FONTS = {
    # display
    "space-grotesk": ("display", "geometric, technical, a little quirky"),
    "archivo": ("display/body", "sturdy grotesque, wide weight range"),
    "archivo-black": ("display", "heavy grotesque headline"),
    "anton": ("display", "tall condensed impact, poster caps"),
    "bebas-neue": ("display", "condensed caps, cinematic titles"),
    "oswald": ("display", "condensed gothic, news and sport"),
    "unbounded": ("display", "wide, rounded, futuristic"),
    "syne": ("display", "art-school, expressive extra-bold"),
    "poppins": ("display/body", "friendly geometric"),
    "rubik": ("display/body", "soft-cornered, approachable"),
    "fredoka": ("display", "rounded, playful, kids and food"),
    "baloo-2": ("display", "chunky rounded, warm"),
    "bangers": ("display", "comic-book caps"),
    "fraunces": ("display", "soft old-style serif, warm editorial"),
    "playfair-display": ("display", "high-contrast serif, elegant, history and culture"),
    "dm-serif-display": ("display", "confident serif headline"),
    "abril-fatface": ("display", "fat-face serif, magazine drama"),
    "caveat": ("display/accent", "quick handwriting, annotations"),
    "permanent-marker": ("accent", "marker pen"),
    "patrick-hand": ("body/accent", "neat handwriting, notebook"),
    "special-elite": ("accent", "typewriter, documents and mystery"),
    # body
    "dm-sans": ("body", "clean low-contrast sans"),
    "manrope": ("body", "modern, slightly geometric sans"),
    "nunito": ("body", "rounded sans, gentle"),
    "work-sans": ("body", "neutral grotesque"),
    "ibm-plex-sans": ("body", "engineered, corporate-technical"),
    "lora": ("body", "calligraphic serif for reading"),
    "source-serif-4": ("body", "sober serif, science and essays"),
    # mono
    "space-mono": ("mono", "retro-futurist mono"),
    "ibm-plex-mono": ("mono", "engineered mono"),
    "dm-mono": ("mono", "soft, light mono"),
    "courier-prime": ("mono", "typewriter mono"),
    "fira-code": ("mono", "programmer mono"),
}
WEIGHTS = [400, 500, 600, 700, 800, 900]


def npm_pack(pkg, tmp):
    out = subprocess.run(["npm", "pack", pkg, "--silent"], cwd=tmp, capture_output=True, text=True)
    if out.returncode != 0:
        raise RuntimeError(f"npm pack {pkg}: {out.stderr.strip()[:300]}")
    tgz = Path(tmp) / out.stdout.strip().splitlines()[-1]
    dest = Path(tmp) / (pkg.replace("/", "_").replace("@", "") + "_x")
    with tarfile.open(tgz) as t:
        t.extractall(dest, filter="data")
    return dest / "package"


def fonts():
    root = ASSETS / "fonts"
    index, rows = {}, []
    for fid, (role, character) in FONTS.items():
        with tempfile.TemporaryDirectory() as tmp:
            try:
                pkg = npm_pack(f"@fontsource/{fid}", tmp)
            except RuntimeError as e:
                print("  skipped", fid, "-", e)
                continue
            meta = json.load(open(pkg / "package.json"))
            family = meta.get("fontName") or " ".join(w.upper() if w in ("dm", "ibm") else w.capitalize() for w in fid.split("-"))
            lic = meta.get("license", "?")
            if not re.search(r"OFL|Apache", lic, re.I):
                print("  skipped", fid, "- licence", lic)
                continue
            out = root / fid
            if out.exists():
                shutil.rmtree(out)
            out.mkdir(parents=True)
            files = []
            for w in WEIGHTS:
                src = pkg / "files" / f"{fid}-latin-{w}-normal.woff2"
                if src.exists():
                    shutil.copy(src, out / src.name)
                    files.append({"weight": w, "file": f"{fid}/{src.name}"})
            if not files:
                shutil.rmtree(out)
                print("  skipped", fid, "- no Latin WOFF2 files")
                continue
            for name in ("LICENSE", "LICENSE.md", "LICENSE.txt"):
                if (pkg / name).exists():
                    shutil.copy(pkg / name, out / "LICENSE")
            index[family] = files
            rows.append((family, role, character, ", ".join(str(f["weight"]) for f in files), lic))
            print(f"  {family}: {len(files)} weights")
    json.dump(index, open(root / "index.json", "w"), indent=1)
    with open(root / "README.md", "w") as f:
        f.write("# Fonts\n\nOpen-licence families, Latin subset, loaded by the renderer straight from this folder — nothing to install.\n"
                "Use the family name in a video's `style.json` (`fonts.display`, `fonts.body`, `fonts.mono`).\n"
                "Each family's licence is in its folder. A weight a scene asks for that is not listed falls back to the nearest one.\n"
                "The Latin subset has no arrows other than ↑ ↓; other symbols fall back to Inter.\n\n"
                "Inter, Inter Display and JetBrains Mono (the default style) are installed on the system by `scripts/setup.sh`.\n\n"
                "| Family | Role | Character | Weights | Licence |\n|---|---|---|---|---|\n")
        for r in sorted(rows):
            f.write("| " + " | ".join(r) + " |\n")
        f.write("\nAdd a family: put its Fontsource id in `scripts/fetch_assets.py` and run `python3 scripts/fetch_assets.py fonts`.\n")


NUM = r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?"


def shape_to_d(el):
    tag = el.tag.split("}")[-1]
    g = lambda k, d=0.0: float(el.get(k, d))
    if tag == "path":
        return el.get("d")
    if tag == "line":
        return f"M{g('x1')} {g('y1')}L{g('x2')} {g('y2')}"
    if tag in ("polyline", "polygon"):
        n = [float(x) for x in re.findall(NUM, el.get("points", ""))]
        d = "M" + "L".join(f"{n[i]} {n[i + 1]}" for i in range(0, len(n) - 1, 2))
        return d + ("Z" if tag == "polygon" else "")
    if tag in ("circle", "ellipse"):
        cx, cy = g("cx"), g("cy")
        rx = g("r") if tag == "circle" else g("rx")
        ry = g("r") if tag == "circle" else g("ry")
        return f"M{cx - rx} {cy}A{rx} {ry} 0 1 0 {cx + rx} {cy}A{rx} {ry} 0 1 0 {cx - rx} {cy}Z"
    if tag == "rect":
        x, y, w, h = g("x"), g("y"), g("width"), g("height")
        rx = float(el.get("rx", el.get("ry", 0)))
        ry = float(el.get("ry", el.get("rx", 0)))
        rx, ry = min(rx, w / 2), min(ry, h / 2)
        if rx == 0 and ry == 0:
            return f"M{x} {y}H{x + w}V{y + h}H{x}Z"
        return (f"M{x + rx} {y}H{x + w - rx}A{rx} {ry} 0 0 1 {x + w} {y + ry}V{y + h - ry}A{rx} {ry} 0 0 1 {x + w - rx} {y + h}"
                f"H{x + rx}A{rx} {ry} 0 0 1 {x} {y + h - ry}V{y + ry}A{rx} {ry} 0 0 1 {x + rx} {y}Z")
    return None


def icons():
    out = ASSETS / "icons"
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        pkg = npm_pack("lucide-static", tmp)
        data = {}
        for svg in sorted((pkg / "icons").glob("*.svg")):
            ds = [shape_to_d(el) for el in ET.parse(svg).getroot().iter() if el.tag.split("}")[-1] != "svg"]
            ds = [d for d in ds if d]
            if ds:
                data[svg.stem] = ds
        json.dump(data, open(out / "lucide.json", "w"), separators=(",", ":"))
        (out / "names.txt").write_text("\n".join(sorted(data)) + "\n")
        shutil.copy(pkg / "LICENSE", out / "LICENSE")
        ver = json.load(open(pkg / "package.json"))["version"]
    (out / "README.md").write_text(
        f"# Icons\n\nLucide {ver} (ISC licence, see LICENSE): {len(data)} line icons on a 24-unit grid, stored as SVG path data.\n\n"
        "In a scene: `icon(ctx, 'heart-pulse', cx, cy, size, COL.alert, { lw: 2, p: progress })`.\n"
        "Find one: `bin/lockstep icons heart` searches the names; `names.txt` is the full list.\n"
        "They are stroke icons: they take the style's colours and can draw themselves on.\n")
    print(f"  lucide {ver}: {len(data)} icons")



if __name__ == "__main__":
    todo = sys.argv[1:] or ["fonts", "icons"]
    for name in todo:
        print(name)
        {"fonts": fonts, "icons": icons}[name]()
