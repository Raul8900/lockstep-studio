"""Opt-in production choices, clocks and reviewed external narration.

No model calls. Legacy productions are not rewritten by preflight.
"""
import argparse
import hashlib
import json
import math
import shutil
from pathlib import Path

from common import REPO, load_config, project_dir


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def local_asset(root, name):
    """Only project paths or the explicitly named bundled assets namespace."""
    if not isinstance(name, str) or not name:
        raise ValueError("an asset needs a nonempty local path")
    base = REPO if name.startswith("assets/production/") else root
    path = (base / name).resolve()
    if not path.is_relative_to(base.resolve()) or not path.is_file():
        raise ValueError(f"missing local asset {name!r}; place the file in {base}, then update video.json")
    return path


def music_only(cfg):
    return cfg.get("clock", {}).get("mode") == "music"


def clock_data(cfg):
    clock = cfg["clock"]
    dur = float(clock["duration"])
    bpm = float(clock.get("bpm", cfg.get("music", {}).get("bpm", 100)))
    if not math.isfinite(dur) or not 0.5 <= dur <= 3600 or not 70 <= bpm <= 150:
        raise ValueError("music clock needs duration 0.5–3600 seconds and bpm 70–150")
    if abs(dur * 30 - round(dur * 30)) > 1e-6:
        raise ValueError("clock.duration must end on a 30 fps frame")
    if cfg.get("music", {}).get("bpm", bpm) != bpm:
        raise ValueError("clock.bpm and music.bpm must agree")
    chapters = cfg.get("chapters", [])
    if not chapters or chapters[0].get("start") != 0:
        raise ValueError("music-only chapters need explicit start seconds; first start must be 0")
    beats = []
    ids = set()
    for i, chapter in enumerate(chapters):
        a = float(chapter["start"])
        b = float(chapters[i + 1]["start"]) if i + 1 < len(chapters) else dur
        if chapter["id"] in ids or not 0 <= a < b <= dur:
            raise ValueError("chapter IDs must be unique and starts strictly increasing within duration")
        ids.add(chapter["id"])
        beats.append(dict(id=chapter["id"], title=chapter.get("name", chapter["id"]), t0=a, t1=b))
    for name, spec in clock.get("markers", {}).items():
        if not isinstance(spec, dict) or len(set(spec) & {"beat", "frame", "seconds"}) != 1:
            raise ValueError(f"clock marker {name}: use exactly one of beat, frame, seconds")
        t = spec.get("seconds", spec.get("frame", 0) / 30 if "frame" in spec else spec.get("beat", 0) * 60 / bpm)
        if not math.isfinite(t) or not 0 <= t <= dur:
            raise ValueError(f"clock marker {name} lies outside the production")
    return dict(meta=dict(duration=dur, speech_end=None, word_count=0, voice=None, speed=None,
                          timing_provenance="explicit duration/beat clock", clock=clock), beats=beats, takes=[])


def prepare_clock(root, cfg):
    data = clock_data(cfg)
    dump(root / "data/takes.json", data)
    dump(root / "data/words.json", [])
    dump(root / "caption_phrases.json", [])
    return data


def preflight(root):
    cfg = load_config(root)
    if music_only(cfg):
        prepare_clock(root, cfg)
    choices = cfg.get("choices")
    if not choices and not cfg.get('audio') and not cfg.get('music', {}).get('source') and not music_only(cfg):
        return None
    from catalogue import items_by_id
    catalogue = items_by_id()
    selected, assets, backends = [], {}, set()
    for slot, spec in (choices or {}).items():
        specs = spec.values() if slot == "shots" else spec if isinstance(spec, list) else [spec]
        for selection in specs:
            if not isinstance(selection, dict) or selection.get("item") not in catalogue:
                raise ValueError(f"invalid choice in {slot}; search with bin/lockstep catalog search <intent>")
            item = catalogue[selection["item"]]
            if slot == "shots" and item["kind"] != "visual" or slot != "shots" and item["kind"] != slot:
                raise ValueError(f"{item['id']} is not a {slot} choice")
            selected.append(dict(id=item["id"], version=item["version"], slot=slot, backend=item["backend"],
                                 inputs=selection.get("inputs", {}), source=item["source"], license=item["license"]))
            backends.add(item["backend"])
            for asset in item.get("assets", []):
                p = local_asset(root, asset)
                assets[asset] = sha256(p)
    for backend in backends & {"three", "maps"}:
        pkg = "three" if backend == "three" else "d3-geo"
        if not (REPO / f"engine/optional/{backend}/node_modules/{pkg}/package.json").exists():
            raise ValueError(f"selected {backend} backend is not installed; run bin/lockstep setup-optional {backend}")
    for selection in (choices or {}).get("shots", {}).values():
        for key in ("asset", "model"):
            if key in selection.get("inputs", {}):
                name = selection["inputs"][key]
                assets[name] = sha256(local_asset(root, name))
    for stem in cfg.get("audio", {}).get("stems", []):
        name = stem["file"]
        assets[name] = sha256(local_asset(root, name))
    for cue in cfg.get("audio", {}).get("cues", []):
        for name in cue.get("files", [cue["file"]] if "file" in cue else []):
            assets[name] = sha256(local_asset(root, name))
    narration = (choices or {}).get("narration", {}).get("item", "voice.none" if music_only(cfg) else "voice.kokoro")
    if music_only(cfg) and narration != 'voice.none':
        raise ValueError('a music clock has no narration; choose voice.none or remove clock.mode=music')
    if narration == "voice.none" and not music_only(cfg):
        raise ValueError("voice.none needs clock.mode=music with explicit duration and chapter starts")
    timing = {}
    if (root / "data/takes.json").exists():
        timing = json.loads((root / "data/takes.json").read_text())["meta"]
    if narration == "voice.supplied":
        provenance = timing.get("timing_provenance", {})
        if not isinstance(provenance, dict) or provenance.get("provider") != "reviewed-external":
            raise ValueError("voice.supplied needs bin/lockstep import-voice <video> <wav> <reviewed.json>")
        if sha256(root / "audio/narration_24k.wav") != provenance["render_wav_sha256"]:
            raise ValueError("narration audio changed; import it again with reviewed timings for this recording")
    resolved = dict(schema=1, selected=selected, assets=assets, backends=sorted(backends),
                    clock=cfg.get("clock", {"mode": "narration"}),
                    timing_provenance=timing.get("timing_provenance", "Kokoro phoneme durations, 25 ms"),
                    audio=dict(music=cfg.get("music", {}), mix=cfg.get("mix", {}), direction=cfg.get("audio", {})),
                    render_model_calls=0)
    dump(root / "data/choices_resolved.json", resolved)
    return resolved


def import_voice(root, wav, review):
    import numpy as np
    import soundfile as sf
    from scipy.signal import resample_poly
    import math
    data = json.loads(Path(review).read_text())
    source_hash = sha256(wav)
    if data.get("reviewed") is not True or data.get("audio_sha256") != source_hash:
        raise ValueError("review must have reviewed:true and audio_sha256 matching this exact WAV; never reuse another recording's timings")
    audio, sr = sf.read(wav, always_2d=True)
    duration = len(audio) / sr
    words, takes, beats = data["words"], data["takes"], data["beats"]
    if not words or not takes or not beats or not np.isfinite(audio).all() or np.max(np.abs(audio)) == 0:
        raise ValueError("supply non-silent audio with complete words, takes and beats")
    beat_ids, take_ids = {b["id"] for b in beats}, {t["take"] for t in takes}
    if len(beat_ids) != len(beats) or len(take_ids) != len(takes):
        raise ValueError("duplicate beat or take IDs")
    for name, rows in (("words", words), ("takes", takes), ("beats", beats)):
        prev = -1
        for row in rows:
            if not 0 <= row["t0"] < row["t1"] <= duration or row["t0"] < prev:
                raise ValueError(f"{name} timings must be ordered, nonoverlapping and within the supplied WAV")
            prev = row["t1"]
    for word in words:
        if word["beat"] not in beat_ids or word["take"] not in take_ids:
            raise ValueError("word refers to an unknown take/beat")
        take = next(t for t in takes if t["take"] == word["take"])
        beat = next(b for b in beats if b["id"] == word["beat"])
        if take["beat"] != word["beat"] or not take["t0"] <= word["t0"] < word["t1"] <= take["t1"] or not beat["t0"] <= word["t0"] < word["t1"] <= beat["t1"]:
            raise ValueError("word must lie within its reviewed take and beat")
        word.setdefault("cls", None)
    root.joinpath("audio").mkdir(exist_ok=True)
    out = root / "audio/narration_24k.wav"
    divisor = math.gcd(sr, 24000)
    sf.write(out, resample_poly(audio.mean(axis=1), 24000 // divisor, sr // divisor), 24000, subtype="PCM_16")
    provenance = dict(provider="reviewed-external", source_audio_sha256=source_hash,
                      render_wav_sha256=sha256(out), review_sha256=sha256(review),
                      reviewer=data.get("reviewer", "author"), method=data.get("method", "manual review"))
    dump(root / "data/words.json", words)
    dump(root / "data/takes.json", dict(meta=dict(duration=round(duration, 3), speech_end=words[-1]["t1"],
         word_count=len(words), voice="supplied WAV", speed=1, sample_rate=24000, timing_provenance=provenance), takes=takes, beats=beats))
    cfg = load_config(root)
    cfg.setdefault("choices", {})["narration"] = {"item": "voice.supplied"}
    dump(root / "video.json", cfg)
    print("Imported supplied audio and its reviewed timings; regenerate captions and rebuild picture.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["preflight", "clock", "import-voice"])
    ap.add_argument("project")
    ap.add_argument("files", nargs="*")
    args = ap.parse_args()
    root = project_dir(args.project)
    try:
        if args.command == "import-voice":
            if len(args.files) != 2:
                ap.error("import-voice requires WAV and reviewed JSON")
            import_voice(root, *args.files)
        elif args.command == "clock":
            cfg = load_config(root)
            if not music_only(cfg):
                raise ValueError("clock needs video.json clock.mode=music")
            prepare_clock(root, cfg)
        else:
            preflight(root)
    except (ValueError, KeyError) as error:
        ap.exit(2, str(error) + "\n")


if __name__ == "__main__":
    main()
