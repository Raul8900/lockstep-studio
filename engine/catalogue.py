"""Small intent index and direct lookup. No service and no model calls."""
import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

from common import REPO, project_dir, load_config


def items_by_id():
    return {i["id"]: i for i in json.loads((REPO / "catalogue/index.json").read_text())}


def search(query):
    terms = set(re.findall(r"[a-z0-9]+", query.lower())) - {"a", "the", "this", "to", "of"}
    scored = []
    for item in items_by_id().values():
        words = set(re.findall(r"[a-z0-9]+", " ".join([item["id"], item["purpose"], *item["tags"]]).lower()))
        score = len(terms & words)
        if score or not terms:
            scored.append((score, item))
    return [dict(id=i["id"], purpose=i["purpose"], backend=i["backend"], preview=i["preview"])
            for _, i in sorted(scored, key=lambda s: (-s[0], s[1]["id"]))[:6]]


def select(root, slot, item_id, shot=None, inputs=None):
    from production import dump
    item = items_by_id()[item_id]
    if item["kind"] != ("visual" if slot == "shot" else slot):
        raise ValueError(f"{item_id} is a {item['kind']} item, not {slot}")
    cfg = load_config(root)
    choice = {"item": item_id, "inputs": {**item["inputs"], **(inputs or {})}}
    choices = cfg.setdefault("choices", {})
    if slot == "shot":
        if shot not in {c["id"] for c in cfg.get("chapters", [])}:
            raise ValueError(f"no chapter {shot!r} in video.json")
        choices.setdefault("shots", {})[shot] = choice
    elif slot == "event":
        raise ValueError("events are per cue: use sfx(t, 'sample', gain, {file}) or audio.cues; see catalog show")
    elif slot == "ambience":
        choices[slot] = [choice]
        stems = cfg.setdefault("audio", {}).setdefault("stems", [])
        stems[:] = [s for s in stems if s.get("role") != "ambience"]
        stems.append({"role": "ambience", "loop": True, **choice["inputs"]})
    else:
        choices[slot] = choice
        if slot == "score":
            cfg.setdefault("music", {})["source"] = item_id.split(".")[1]
            if item_id == 'score.local' and choice['inputs'].get('file'):
                stems = cfg.setdefault('audio', {}).setdefault('stems', [])
                stems[:] = [s for s in stems if s.get('role') != 'music']
                stems.append({'role': 'music', **choice['inputs']})
        if slot == "effects":
            cfg.setdefault("audio", {})["effects"] = item_id.split(".")[1]
    dump(root / "video.json", cfg)
    print(json.dumps(choice, indent=2))


def preview(item, destination):
    from production import dump
    target = Path(destination).resolve()
    target.mkdir(parents=True, exist_ok=True)
    if item["backend"] == "wav":
        src = REPO / item["assets"][0]
        dst = target / src.name
        shutil.copy2(src, dst)
        (target / "preview.html").write_text(f'<title>{item["id"]}</title><h1>{item["purpose"]}</h1><audio controls src="{dst.name}"></audio>')
        print(dst)
        return
    # A preview is an ordinary project that can be revised or built as a video.
    slug = item["id"].replace(".", "-")
    root = target / slug
    if not (root / "video.json").exists():
        subprocess.run(["python3", str(REPO / "engine/new_video.py"), slug, item["purpose"], "--into", str(target), "--example"], check=True)
    if item["id"] == "voice.kokoro":
        subprocess.run([str(REPO / "bin/lockstep"), "audition", str(root), "0"], check=True)
        return
    if item["id"] == "voice.supplied":
        raise ValueError("a supplied voice preview needs your WAV and reviewed timing JSON; use import-voice and audition the supplied file")
    for file in (root / "scenes").glob("*.js"):
        file.unlink()
    cfg = load_config(root)
    cfg.update(clock={"mode": "music", "duration": 6, "bpm": 100}, chapters=[{"id": "preview", "name": item["id"], "start": 0, "mood": "light"}],
               choices={"shots": {"preview": {"item": item["id"], "inputs": item["inputs"]}}}, music={"bpm": 100, "kit": "soft"})
    if item["kind"] != "visual":
        cfg["choices"] = {"shots": {"preview": {"item": "native.signal"}}}
        if item["kind"] in ("score", "effects", "narration"):
            cfg["choices"][item["kind"]] = {"item": item["id"]}
        cfg["music"]["source"] = "none" if item["id"] == "score.none" else "synth"
    dump(root / "video.json", cfg)
    (root / "components.js").write_text("")
    cues = ""
    if item["id"] in ("effects.synth", "effects.mixed"):
        cues += "sfx(.5,'lock',.5);sfx(2,'thump',.5);"
    if item["id"] in ("effects.local", "effects.mixed"):
        cfg.setdefault("audio", {})["effects"] = item["id"].split(".")[1]
        cues += "sfx(3,'sample',.5,{file:'assets/production/contact.wav'});"
    dump(root / "video.json", cfg)
    (root / "scenes/s01_preview.js").write_text("(window.SCENE_DEFS=window.SCENE_DEFS||[]).push(()=>{" + cues + "const shot=prepareChoice('preview');addScene('preview',(ctx,t)=>shot.draw(ctx,t));});\n")
    subprocess.run([str(REPO / "bin/lockstep"), "clock", str(root)], check=True)
    subprocess.run([str(REPO / "bin/lockstep"), "still", str(root), "1s", "3s", "5s"], check=True)
    if item["kind"] != "visual":
        subprocess.run([str(REPO / "bin/lockstep"), "meta", str(root)], check=True)
        subprocess.run([str(REPO / "bin/lockstep"), "audio", str(root)], check=True)
        print(root / "audio/mix_premaster.wav")
    print(root / "out/stills")


def main():
    ap = argparse.ArgumentParser()
    subs = ap.add_subparsers(dest="command", required=True)
    p = subs.add_parser("search"); p.add_argument("query", nargs="*")
    p = subs.add_parser("show"); p.add_argument("id")
    p = subs.add_parser("preview"); p.add_argument("id"); p.add_argument("--out", default="work/catalogue-preview")
    p = subs.add_parser("choose"); p.add_argument("project"); p.add_argument("slot"); p.add_argument("values", nargs="+"); p.add_argument("--inputs", default="{}")
    args = ap.parse_args()
    try:
        if args.command == "search":
            print(json.dumps(search(" ".join(args.query)), indent=2))
        elif args.command == "show":
            print(json.dumps(items_by_id()[args.id], indent=2))
        elif args.command == "preview":
            preview(items_by_id()[args.id], args.out)
        else:
            shot = args.values[0] if args.slot == "shot" else None
            if len(args.values) != (2 if shot else 1):
                raise ValueError("choose <video> shot <scene-id> <item-id> OR choose <video> <narration|score|effects|ambience> <item-id>")
            select(project_dir(args.project), args.slot, args.values[-1], shot, json.loads(args.inputs))
    except (KeyError, ValueError) as error:
        ap.exit(2, str(error) + "\nSearch with: bin/lockstep catalog search <intent>\n")


if __name__ == "__main__":
    main()
