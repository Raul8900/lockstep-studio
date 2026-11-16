"""Optional sample cues and editorial gain envelopes. Independent of the synth RNG."""
import hashlib
import math
from functools import lru_cache

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

from production import local_asset


def finite(value, name, minimum=None):
    value = float(value)
    if not math.isfinite(value) or minimum is not None and value < minimum:
        raise ValueError(f"{name} must be finite" + (f" and >= {minimum}" if minimum is not None else ""))
    return value


@lru_cache(maxsize=32)
def read_sample(path, sr):
    audio, rate = sf.read(path, always_2d=True, dtype="float64")
    if audio.shape[1] not in (1, 2) or not len(audio) or not np.isfinite(audio).all():
        raise ValueError(f"{path}: expected a finite mono/stereo sample")
    if audio.shape[1] == 1:
        audio = np.repeat(audio, 2, axis=1)
    if rate != sr:
        divisor = math.gcd(rate, sr)
        audio = resample_poly(audio, sr // divisor, rate // divisor, axis=0)
    return audio


def sample(root, cue, sr, default_duration=None):
    files = cue.get("files", [cue["file"]] if "file" in cue else [])
    if not files:
        raise ValueError("sample cue needs file or nonempty files (local WAV paths)")
    seed = str(cue.get("seed", 0)) + ":" + str(cue.get("id", cue.get("t", 0)))
    idx = int(hashlib.sha256(seed.encode()).hexdigest()[:8], 16) % len(files)
    path = local_asset(root, files[idx])
    audio = read_sample(str(path), sr)
    a = int(finite(cue.get("trim_start", 0), "trim_start", 0) * sr)
    b = int(finite(cue.get("trim_end", len(audio) / sr), "trim_end", 0) * sr)
    if not 0 <= a < b <= len(audio):
        raise ValueError(f"{files[idx]}: trim interval is empty or outside the recording")
    audio = audio[a:b].copy()
    duration = cue.get("dur", cue.get("duration", default_duration))
    if duration is not None:
        n = round(finite(duration, "duration", .001) * sr)
        if cue.get("loop") and n > len(audio):
            # Overlap adjacent loops, preventing a discontinuity on arbitrary recordings.
            cross = min(round(.02 * sr), len(audio) // 4)
            period = len(audio) - cross
            out = np.zeros((n + len(audio), 2))
            chunk = audio.copy()
            ramp = np.linspace(0, 1, cross, endpoint=False)
            chunk[:cross] *= ramp[:, None]; chunk[-cross:] *= (1 - ramp)[:, None]
            for offset in range(0, n, period):
                out[offset:offset + len(chunk)] += chunk
            audio = out[:n]
        else:
            audio = audio[:n]
    for key, default, reverse in (("fade_in", .005, False), ("fade_out", .02, True)):
        count = min(len(audio), round(finite(cue.get(key, default), key, 0) * sr))
        if count:
            ramp = np.linspace(0, 1, count)
            if reverse: audio[-count:] *= ramp[::-1, None]
            else: audio[:count] *= ramp[:, None]
    gain = finite(cue.get("gain", 1), "sample gain", 0) * 10 ** (finite(cue.get("gain_db", 0), "gain_db") / 20)
    return audio * gain


def cue_time(spec, cfg, timeline, words):
    if isinstance(spec, (float, int)):
        return finite(spec, "cue time", 0)
    if "marker" in spec:
        return cue_time(cfg.get("clock", {}).get("markers", {})[spec["marker"]], cfg, timeline, words) + spec.get("offset", 0)
    if "word" in spec:
        matches = [w for w in words if w["beat"] == spec["chapter"] and w["w"].lower().strip('.,!?;:—') == spec["word"]]
        try: return matches[spec.get("nth", 1) - 1][spec.get("edge", "t0")] + spec.get("offset", 0)
        except IndexError: raise ValueError(f"audio cue word not found: {spec}")
    if "chapter" in spec:
        return next(s for s in timeline["scenes"] if s["id"] == spec["chapter"])[spec.get("edge", "t0")] + spec.get("offset", 0)
    if "beat" in spec:
        return spec["beat"] * 60 / cfg.get("clock", {}).get("bpm", cfg.get("music", {}).get("bpm", 100))
    if "frame" in spec: return spec["frame"] / 30
    if "seconds" in spec: return finite(spec["seconds"], "cue time", 0)
    raise ValueError(f"invalid audio cue time: {spec}")


def envelope(n, sr, cues, cfg, timeline, words):
    gain = np.ones(n)
    t = np.arange(n) / sr
    for cue in cues:
        if "chapter" in cue:
            a = cue_time({"chapter": cue["chapter"]}, cfg, timeline, words)
            b = cue_time({"chapter": cue["chapter"], "edge": "t1"}, cfg, timeline, words)
        else:
            a = cue_time(cue["from"], cfg, timeline, words)
            b = cue_time(cue["to"], cfg, timeline, words)
        if not 0 <= a < b <= n / sr + 1 / sr:
            raise ValueError("gain envelope interval must lie within production duration")
        fade = min(finite(cue.get("fade", .12), "envelope fade", .005), (b - a) / 2)
        weight = np.minimum(np.clip((t - a) / fade, 0, 1), np.clip((b - t) / fade, 0, 1))
        weight = weight * weight * (3 - 2 * weight)
        target = 0 if cue.get("rest") else 10 ** (finite(cue.get("gain_db", 0), "envelope gain_db") / 20)
        gain *= 1 + (target - 1) * weight
    return gain


def stems(root, cfg, timeline, words, sr):
    n = round(timeline["dur"] * sr)
    music, ambience = np.zeros((n, 2)), np.zeros((n, 2))
    seen = set()
    for stem in cfg.get("audio", {}).get("stems", []):
        role = stem.get("role", "ambience")
        if role not in ("music", "ambience"):
            raise ValueError("local stem role must be music or ambience")
        t = cue_time(stem.get("at", 0), cfg, timeline, words)
        key = (stem["file"], t)
        if key in seen: raise ValueError("duplicate local stem would play twice: " + stem["file"])
        seen.add(key)
        x = sample(root, stem, sr, max(.001, timeline["dur"] - t))
        x *= envelope(len(x), sr, [], cfg, timeline, words)[:, None]
        offset = round(t * sr); end = min(n, offset + len(x))
        if offset >= n: raise ValueError("local stem starts after the production ends")
        (music if role == "music" else ambience)[offset:end] += x[:end - offset]
    return music, ambience
