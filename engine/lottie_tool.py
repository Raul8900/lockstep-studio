"""Find, fetch, inspect and check Lottie animations for a video.

  python3 engine/lottie_tool.py search <video> <words...> [--n 8]
      Searches LottieFiles' free public animations, ranks the matches by popularity, downloads the
      best <n> into <video>/out/lottie_cache/ (git-ignored) and renders them as filmstrips in the
      video's look -> <video>/out/lottie_search.jpg. Prints each candidate's id and warnings.
  python3 engine/lottie_tool.py get <video> <id> [name]
      Copies a searched animation into <video>/lottie/<name>.json and records where it came from,
      who made it and its licence in <video>/lottie/credits.json.
  python3 engine/lottie_tool.py info <video>
      Duration, frame rate, size, markers and warnings for every file in <video>/lottie/.
  python3 engine/lottie_tool.py check <video>
      Fails if any file in <video>/lottie/ has no credits entry (used by `lockstep build`).

Files that are not from LottieFiles (made by you or a designer) go in <video>/lottie/ by hand,
with an entry in credits.json: {"name": {"title", "author", "source", "licence"}}.
"""
import datetime
import json
import math
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import ENGINE, project_dir  # noqa: E402

API = "https://graphql.lottiefiles.com/2022-08"
LICENCE = "Lottie Simple License (FL 9.13.21)"
LICENCE_URL = "https://lottiefiles.com/page/license"
UA = {"User-Agent": "lockstep-studio", "Content-Type": "application/json"}
MAX_BYTES = 4_000_000


def gql(query, variables):
    req = urllib.request.Request(API, data=json.dumps({"query": query, "variables": variables}).encode(), headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        out = json.load(r)
    if out.get("errors"):
        raise RuntimeError(out["errors"][0].get("message", "LottieFiles API error"))
    return out["data"]


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "lockstep-studio"})
    with urllib.request.urlopen(req, timeout=40) as r:
        data = r.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise RuntimeError("larger than 4 MB")
    return data


def analyse(d):
    """facts and warnings for one Lottie JSON"""
    layers = list(d.get("layers", []))
    for a in d.get("assets", []):
        layers += a.get("layers", [])
    images = [a for a in d.get("assets", []) if a.get("p") and "layers" not in a]
    text = [lyr for lyr in layers if lyr.get("ty") == 5]
    raw = json.dumps(d)
    expressions = len(re.findall(r'"x":\s*"', raw))
    colours = set(re.findall(r'"c":\{"a":0,"k":\[([0-9.]+),([0-9.]+),([0-9.]+)', raw.replace(" ", "")))
    fr, ip, op = d.get("fr", 30), d.get("ip", 0), d.get("op", 0)
    warn = []
    if images:
        warn.append(f"{len(images)} embedded image(s): bitmaps do not recolour and blur when scaled")
    if text:
        warn.append(f"{len(text)} text layer(s): fonts may not match the look; prefer shape-only files")
    if expressions:
        warn.append(f"{expressions} expression(s): usually fine, occasionally not deterministic")
    if fr and (op - ip) / fr < 0.3:
        warn.append("shorter than 0.3 s")
    return {"duration_s": round((op - ip) / fr, 2) if fr else None, "fps": round(fr, 2), "frames": round(op - ip, 1),
            "size": f"{d.get('w')}x{d.get('h')}", "layers": len(layers), "colours": len(colours),
            "markers": [m.get("cm") for m in d.get("markers", [])], "warnings": warn}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40] or "animation"


def render_sheet(video, names, out, labels=None, dir_=None, frames=6):
    cmd = ["node", str(ENGINE / "render.js"), str(video), "lottiesheet", "--names", ",".join(names), "--frames", str(frames), "--crop", "--out", str(out)]
    if dir_:
        cmd += ["--dir", dir_]
    if labels:
        cmd += ["--labels", "|".join(lbl.replace("|", "/") for lbl in labels)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print((r.stdout + r.stderr).strip()[-600:], file=sys.stderr)
    return r.returncode == 0


def cmd_search(video, words, n):
    cache = video / "out/lottie_cache"
    cache.mkdir(parents=True, exist_ok=True)
    q = """query($q: String!, $n: Int) { searchPublicAnimations(query: $q, first: $n) { totalCount edges { node {
             id name url jsonUrl downloads likesCount lottieFileSize createdBy { username firstName lastName } } } } }"""
    try:
        res = gql(q, {"q": " ".join(words), "n": 40})["searchPublicAnimations"]
    except Exception as e:  # network policy, API change
        sys.exit(f"LottieFiles search failed: {e}\n(needs network access to graphql.lottiefiles.com and assets-v2.lottiefiles.com)")
    nodes = [e["node"] for e in res["edges"]]
    if not nodes:
        sys.exit("no animations found — try other words (an object, an action, a mood)")
    # the API orders by relevance only; lift what people actually downloaded and liked, keep relevance as a tie-breaker
    ranked = sorted(enumerate(nodes), key=lambda p: -(math.log10(1 + (p[1].get("downloads") or 0)) * 2
                                                     + math.log10(1 + (p[1].get("likesCount") or 0)) - p[0] * 0.04))
    index = json.load(open(cache / "index.json")) if (cache / "index.json").exists() else {}
    picked, rows = [], []
    for _, node in ranked:
        if len(picked) >= n:
            break
        f = cache / f"{node['id']}.json"
        try:
            if not f.exists():
                data = json.loads(fetch(node["jsonUrl"]))
                f.write_text(json.dumps(data, separators=(",", ":")))
            info = analyse(json.load(open(f)))
        except Exception as e:
            print(f"  skipped {node['id']} ({node['name']}): {e}", file=sys.stderr)
            continue
        by = node.get("createdBy") or {}
        author = " ".join(x for x in (by.get("firstName"), by.get("lastName")) if x) or by.get("username", "").strip("/") or "unknown"
        index[str(node["id"])] = {"title": node["name"], "author": author, "source": node["url"], "json_url": node["jsonUrl"],
                                  "downloads": node.get("downloads"), "likes": node.get("likesCount"), **info}
        picked.append(str(node["id"]))
        rows.append((node, author, info))
    json.dump(index, open(cache / "index.json", "w"), indent=1)
    print(f"{res['totalCount']} matches for {' '.join(words)!r}; the {len(picked)} most downloaded:")
    for node, author, info in rows:
        print(f"  {node['id']:<8} {node['name'][:34]:<34} by {author[:24]:<24} {node.get('downloads') or 0:>6} dl  {info['duration_s']} s  {info['size']}")
        for w in info["warnings"]:
            print(f"           ! {w}")
    out = video / "out/lottie_search.jpg"
    labels = [f"{i} · {index[i]['title'][:30]}" for i in picked]
    if render_sheet(video, picked, out, labels, "out/lottie_cache"):
        print(f"filmstrips in this video's look -> {out}   (open it before choosing)")
    print(f"take one: bin/lockstep lottie-get {video.name} <id> <short-name>")


def cmd_get(video, ident, name):
    cache = video / "out/lottie_cache"
    index = json.load(open(cache / "index.json")) if (cache / "index.json").exists() else {}
    if ident not in index or not (cache / f"{ident}.json").exists():
        sys.exit(f"no searched animation with id {ident}: run bin/lockstep lottie-search {video.name} <words> first")
    meta = index[ident]
    name = slug(name or meta["title"])
    dest = video / "lottie"
    dest.mkdir(exist_ok=True)
    shutil.copy(cache / f"{ident}.json", dest / f"{name}.json")
    credits_path = dest / "credits.json"
    credits = json.load(open(credits_path)) if credits_path.exists() else {}
    credits[name] = {"title": meta["title"], "author": meta["author"], "source": meta["source"], "lottiefiles_id": int(ident),
                     "licence": LICENCE, "licence_url": LICENCE_URL, "downloaded": datetime.date.today().isoformat()}
    credits_path.write_text(json.dumps(credits, indent=1, ensure_ascii=False) + "\n")
    lic = dest / "LICENSE-LottieFiles.txt"
    if not lic.exists():
        shutil.copy(ENGINE / "lottie_simple_license.txt", lic)
    print(f"lottie/{name}.json  ({meta['title']} by {meta['author']}, {meta['duration_s']} s, {meta['fps']} fps)")
    for w in meta.get("warnings", []):
        print(f"  ! {w}")
    parts = [x for x in re.split(r"[^a-zA-Z0-9]+", name) if x]
    var = (parts[0] + "".join(x.capitalize() for x in parts[1:])) if parts else "anim"
    if var[0].isdigit():
        var = "anim" + var
    print(f"in a scene: const {var} = useLottie('{name}');   then drawLottie(ctx, {var}, t, x, y, size, {{ at: c.someWord }})")


def video_files(video):
    d = video / "lottie"
    return sorted(p for p in d.glob("*.json") if p.name != "credits.json") if d.exists() else []


def cmd_info(video):
    files = video_files(video)
    if not files:
        print("no Lottie files in this video (bin/lockstep lottie-search <video> <words>)")
        return
    credits = json.load(open(video / "lottie/credits.json")) if (video / "lottie/credits.json").exists() else {}
    for f in files:
        i = analyse(json.load(open(f)))
        c = credits.get(f.stem)
        print(f"  {f.stem:<24} {i['duration_s']} s  {i['fps']} fps  {i['size']}  {i['layers']} layers"
              + (f"  markers {i['markers']}" if i["markers"] else "")
              + ("" if c else "   ! NO CREDITS ENTRY"))
        if c:
            print(f"  {'':<24} {c.get('title')} — {c.get('author')} — {c.get('licence')}")
        for w in i["warnings"]:
            print(f"  {'':<24} ! {w}")
    print(f"preview in the video's look: bin/lockstep lottie-sheet {video.name}")


def cmd_check(video):
    files = video_files(video)
    if not files:
        return
    credits = json.load(open(video / "lottie/credits.json")) if (video / "lottie/credits.json").exists() else {}
    missing = [f.stem for f in files if not (credits.get(f.stem) or {}).get("licence") or not (credits.get(f.stem) or {}).get("source")]
    if missing:
        sys.exit(f"Lottie files without a source and licence in lottie/credits.json: {missing}\n"
                 "  every animation needs one (lockstep lottie-get writes it; add your own files by hand)")
    print(f"{len(files)} Lottie file(s), all credited")


args = sys.argv[1:]
if len(args) < 2:
    sys.exit(__doc__)
cmd, video = args[0], project_dir(args[1])
rest = args[2:]
if cmd == "search":
    n = 8
    if "--n" in rest:
        i = rest.index("--n")
        n = max(1, min(10, int(rest[i + 1])))
        del rest[i:i + 2]
    if not rest:
        sys.exit("give words to search for, e.g.: lockstep lottie-search <video> bee flying")
    cmd_search(video, rest, n)
elif cmd == "get":
    if not rest:
        sys.exit("give the id of a searched animation: lockstep lottie-get <video> <id> [name]")
    cmd_get(video, rest[0], rest[1] if len(rest) > 1 else None)
elif cmd == "info":
    cmd_info(video)
elif cmd == "check":
    cmd_check(video)
else:
    sys.exit(__doc__)
