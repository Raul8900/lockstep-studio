#!/usr/bin/env python3
"""Rebuild assets/ from their open-licence sources (the results are committed; run this only to add or update).

  python3 scripts/fetch_assets.py [fonts] [icons] [palettes] [illustrations]     (no argument = all)

  fonts     Open Font License families from the Fontsource npm packages (Latin subset, WOFF2)
            -> assets/fonts/<id>/*.woff2 + LICENSE, assets/fonts/index.json
  icons     Lucide (ISC licence) -> assets/icons/lucide.json (name -> SVG path data), names.txt
  palettes  nice-color-palettes (MIT; 1000 five-colour palettes) and Open Color (MIT; 13 hues x 10 shades)
            -> assets/palettes/
  illustrations  Microsoft Fluent Emoji (MIT) in three styles, via the Iconify packages, plus English
            keywords from emojibase-data (MIT; derived from Unicode CLDR)
            -> assets/illustrations/fluent-{color,flat,line}.json.gz, index.json

Needs npm and network access to the npm registry. To add a font: add its Fontsource id to FONTS and run
`python3 scripts/fetch_assets.py fonts`. Only add families whose licence allows redistribution (OFL, Apache).
"""
import gzip
import io
import json
import re
import shutil
import urllib.request
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


def palettes():
    out = ASSETS / "palettes"
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        pkg = npm_pack("nice-color-palettes", tmp)
        shutil.copy(pkg / "1000.json", out / "nice-1000.json")
        lic = next((pkg / n for n in ("LICENSE.md", "LICENSE") if (pkg / n).exists()), None)
        if lic:
            shutil.copy(lic, out / "LICENSE-nice-color-palettes")
        pkg = npm_pack("open-color", tmp)
        oc = json.load(open(pkg / "open-color.json"))
        json.dump(oc, open(out / "open-color.json", "w"), indent=1)
        shutil.copy(pkg / "LICENSE", out / "LICENSE-open-color")
    (out / "README.md").write_text(
        "# Palettes\n\nRaw material for designing a style's palette — not ready-made styles.\n\n"
        "- `nice-1000.json` — 1000 five-colour palettes (nice-color-palettes, MIT): good for finding a colour mood.\n"
        "- `open-color.json` — 13 hues × 10 shades (Open Color, MIT): good for picking a readable shade of a hue.\n\n"
        "`bin/lockstep palettes warm` / `dark` / `pastel` / `vivid` / `#E63946` renders matching palettes to an image you can look at.\n"
        "A palette from here still has to be assigned to roles (background, ink, subject, accent, data, alert, good) and pass\n"
        "`bin/lockstep style-check <video>`.\n")
    print("  palettes: nice-1000, open-color")


# ---------------------------------------------------------------- illustrations
ART_SETS = {  # our name -> (npm package, what it looks like)
    "color": ("@iconify-json/fluent-emoji", "soft gradients, a gentle 3D feel"),
    "flat": ("@iconify-json/fluent-emoji-flat", "flat fills, no gradients"),
    "line": ("@iconify-json/fluent-emoji-high-contrast", "single-colour line art, tinted to any colour"),
}
TONES = ["light", "medium-light", "medium", "medium-dark", "dark"]
# Fluent names whose CLDR label differs by more than punctuation
ART_ALIAS = {
    "hugging-face": "smiling face with open hands", "pouting-face": "enraged face", "knocked-out-face": "face with crossed-out eyes",
    "piata": "pinata", "blackbird": "black bird", "phoenix-bird": "phoenix", "red-triangle": "red triangle pointed up",
    "keycap-asterisk": "keycap: *", "keycap-hashtag": "keycap: #", "person-deaf": "deaf person", "man-deaf": "deaf man",
    "woman-deaf": "deaf woman", "person-wrestling": "people wrestling", "person-with-bunny-ears": "people with bunny ears",
    "man-blonde-hair": "man: blond hair", "woman-blonde-hair": "woman: blond hair", "person-blonde-hair": "person: blond hair",
    "person-merpeople": "merperson", "man-merpeople": "merman", "woman-merpeople": "mermaid",
}


def _slug(text):
    text = text.lower().replace("’", "").replace("'", "").replace("ñ", "n").replace("é", "e").replace("ç", "c").replace("ô", "o")
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def _gz_json(obj, path):
    raw = json.dumps(obj, separators=(",", ":"), sort_keys=True).encode()
    with open(path, "wb") as f, gzip.GzipFile(filename="", mode="wb", fileobj=f, mtime=0, compresslevel=9) as g:
        g.write(raw)
    return len(raw), path.stat().st_size


def illustrations():
    out = ASSETS / "illustrations"
    out.mkdir(parents=True, exist_ok=True)
    names_by_set, versions = {}, {}
    with tempfile.TemporaryDirectory() as tmp:
        for key, (pkg_name, _) in ART_SETS.items():
            pkg = npm_pack(pkg_name, tmp)
            ic = json.load(open(pkg / "icons.json"))
            versions[key] = json.load(open(pkg / "package.json"))["version"]
            icons = {}
            for name, v in ic["icons"].items():
                if v.get("hidden"):
                    continue
                extra = {k: v[k] for k in ("width", "height", "left", "top") if k in v}
                icons[name] = dict(body=v["body"], **extra) if extra else v["body"]
            aliases = {a: {k: v[k] for k in ("parent", "hFlip") if k in v} for a, v in ic.get("aliases", {}).items() if v.get("parent") in icons}
            bundle = {"source": f"{pkg_name}@{versions[key]}", "width": ic.get("width", 16), "height": ic.get("height", 16),
                      "icons": icons, "aliases": aliases}
            raw, packed = _gz_json(bundle, out / f"fluent-{key}.json.gz")
            names_by_set[key] = set(icons) | set(aliases)
            print(f"  {key}: {len(icons)} illustrations + {len(aliases)} aliases ({raw / 1e6:.1f} MB -> {packed / 1e6:.1f} MB gzip)")
        eb = npm_pack("emojibase-data", tmp)
        data = json.load(open(eb / "en/data.json"))
        groups = json.load(open(eb / "meta/groups.json"))
        shutil.copy(eb / "LICENSE", out / "LICENSE-emojibase")
        eb_version = json.load(open(eb / "package.json"))["version"]
    by_label = {_slug(e["label"]): e for e in data}
    all_names = set().union(*names_by_set.values())

    def split_tone(n):
        for t in sorted(TONES, key=len, reverse=True):
            if n.endswith("-" + t) and n[: -len(t) - 1] in all_names:
                return n[: -len(t) - 1], t
        return n, None

    index = {}
    for n in sorted(all_names):
        b, tone = split_tone(n)
        e = index.setdefault(b, {"sets": [], "tones": []})
        for key in ART_SETS:
            if n in names_by_set[key] and key not in e["sets"] and tone is None:
                e["sets"].append(key)
        if tone and tone not in e["tones"]:
            e["tones"].append(tone)
    matched = 0
    for b, e in index.items():
        src = by_label.get(_slug(ART_ALIAS.get(b, b))) or by_label.get(_slug(b.replace("person-", "", 1)))
        if src:
            matched += 1
            e["label"] = src["label"]
            e["group"] = groups["groups"].get(str(src.get("group")), "")
            e["subgroup"] = groups["subgroups"].get(str(src.get("subgroup")), "")
            e["tags"] = sorted({t.lower() for t in src.get("tags", [])} - set(b.split("-")))
        else:
            e["label"], e["group"], e["subgroup"], e["tags"] = b.replace("-", " "), "", "", []
        e["tones"] = [t for t in TONES if t in e["tones"]]
    lines = [json.dumps(k) + ": " + json.dumps(index[k], ensure_ascii=False, separators=(", ", ": ")) for k in sorted(index)]
    (out / "index.json").write_text("{\n" + ",\n".join(lines) + "\n}\n", encoding="utf-8")
    print(f"  index: {len(index)} subjects, {matched} with keywords from emojibase-data {eb_version}")
    for name, url in (("LICENSE-fluent-emoji", "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/LICENSE"),
                      ("LICENSE-unicode-cldr", "https://raw.githubusercontent.com/unicode-org/cldr/main/LICENSE")):
        with urllib.request.urlopen(url, timeout=30) as r:
            (out / name).write_bytes(r.read())
    sizes = {k: (out / f"fluent-{k}.json.gz").stat().st_size / 1e6 for k in ART_SETS}
    (out / "README.md").write_text(
        "# Illustrations\n\n"
        "Microsoft Fluent Emoji (MIT licence, `LICENSE-fluent-emoji`) in three styles — "
        f"{len(index)} subjects: people (with five skin tones), faces, animals, plants, food, objects, places, symbols.\n\n"
        "| Set | Looks like | File |\n|---|---|---|\n"
        + "".join(f"| `{k}` | {ART_SETS[k][1]} | `fluent-{k}.json.gz` ({sizes[k]:.1f} MB, from `{ART_SETS[k][0]}` {versions[k]}) |\n" for k in ART_SETS)
        + "\n`index.json` lists every subject with its English label, group, keywords and the skin tones available. "
        "The keywords come from emojibase-data (MIT, `LICENSE-emojibase`), which derives them from Unicode CLDR "
        "(Unicode License, `LICENSE-unicode-cldr`).\n\n"
        "Search: `bin/lockstep art honey`. Preview in a video's look: `bin/lockstep art-sheet <video> honeybee flower`.\n"
        "In a scene: `const bee = art('honeybee')` in the setup, `drawArt(ctx, bee, x, y, size)` in the draw function\n"
        "(see `.claude/skills/explainer-video/reference/illustration.md`).\n\n"
        "The bundles are gzip-compressed Iconify JSON (`{icons: {name: svg body}, aliases, width, height}`); the render server\n"
        "unpacks them on demand. `python3 scripts/fetch_assets.py illustrations` rebuilds this folder.\n")


if __name__ == "__main__":
    todo = sys.argv[1:] or ["fonts", "icons", "palettes", "illustrations"]
    for name in todo:
        print(name)
        {"fonts": fonts, "icons": icons, "palettes": palettes, "illustrations": illustrations}[name]()
