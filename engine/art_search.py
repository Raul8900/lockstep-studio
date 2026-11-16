"""Find illustrations by meaning.

  python3 engine/art_search.py <words...> [--set color|flat|line] [--limit 40]
  python3 engine/art_search.py --resolve [--video DIR] [--set S] <names or words...>   (names for an art sheet)

Searches assets/illustrations/index.json: names, English labels, CLDR keywords and groups.
Several words narrow the search (every word must match). People and hands come in five skin
tones: art('cook', { tone: 'medium-dark' }) — the tones column says which subjects have them.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO  # noqa: E402

INDEX = json.load(open(REPO / "assets/illustrations/index.json", encoding="utf-8"))
TONES = ["light", "medium-light", "medium", "medium-dark", "dark"]


def score(name, e, word):
    w = word.lower()
    parts, label = name.split("-"), e.get("label", "").lower()
    s = 0
    if w == name:
        s += 100
    loose = len(w) >= 5                                  # partial matches only for longer words ("bee" must not find "beetle")
    if w in parts:
        s += 40
    elif loose and w in name:
        s += 15
    if w in label.split():
        s += 30
    if w in e.get("tags", []):
        s += 25
    elif loose and any(t.startswith(w) for t in e.get("tags", [])):
        s += 8
    if w in e.get("group", "") or w in e.get("subgroup", ""):
        s += 4
    return s


def search(words, art_set=None, limit=40):
    hits = []
    for name, e in INDEX.items():
        if art_set and art_set not in e["sets"]:
            continue
        parts = [score(name, e, w) for w in words]
        if all(parts):
            hits.append((-sum(parts), len(name), name))
    return [n for _, _, n in sorted(hits)[:limit]]


def concrete(name):
    """'cook-medium-dark' -> ('cook', 'medium-dark') when that is a real tone variant."""
    for t in sorted(TONES, key=len, reverse=True):
        if name.endswith("-" + t) and name[: -len(t) - 1] in INDEX and t in INDEX[name[: -len(t) - 1]]["tones"]:
            return name[: -len(t) - 1], t
    return (name, None) if name in INDEX else (None, None)


args = sys.argv[1:]
opt = {}
for k in ("--set", "--limit", "--video"):
    if k in args:
        i = args.index(k)
        opt[k] = args[i + 1]
        del args[i:i + 2]
resolve = "--resolve" in args
args = [a for a in args if a != "--resolve"]
art_set = opt.get("--set")
if resolve:
    if not art_set and opt.get("--video"):
        sj = Path(opt["--video"]) / "style.json"
        art_set = (json.load(open(sj)).get("illustrations", {}).get("set") if sj.exists() else None) or "color"
    art_set = art_set or "color"
    names, notes = [], []
    for a in args:
        base, tone = concrete(a)
        if base:
            if art_set not in INDEX[base]["sets"]:
                notes.append(f"{a}: not in the {art_set} set")
                continue
            names.append(a if art_set != "line" else base)
        else:
            found = search(re.split(r"[\s,]+", a), art_set, 8)
            if not found:
                notes.append(f"{a}: nothing found")
            names += found
    seen = []
    for n in names:
        if n not in seen:
            seen.append(n)
    for n in notes:
        print(n, file=sys.stderr)
    if len(seen) > 24:
        print(f"showing the first 24 of {len(seen)}", file=sys.stderr)
    print(",".join(seen[:24]))
    sys.exit(0 if seen else 1)

if not args:
    sys.exit(__doc__)
hits = search(args, art_set, int(opt.get("--limit", 40)))
if not hits:
    sys.exit(f"nothing matches {' '.join(args)!r} — try a broader or different word (a synonym, the category: animal, food, tool…)")
print(f"{len(hits)} match{'es' if len(hits) != 1 else ''} for {' '.join(args)!r}" + (f" in the {art_set} set" if art_set else "") + ":")
for n in hits:
    e = INDEX[n]
    tones = "5 tones" if e["tones"] else ""
    sets = "" if len(e["sets"]) == 3 else "only " + "/".join(e["sets"])
    print(f"  {n:<36} {e.get('label', '')[:38]:<38} {tones:<8} {sets}")
print("preview in a video's look: bin/lockstep art-sheet <video> " + " ".join(hits[:6]))
