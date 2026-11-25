"""Score, sound design and final mix.

The music is either a licensed track from the video's media/ (video.json "music": {"track":
"<name>", "start": seconds into the track} — taken with `lockstep find <video> music "…"`), or,
without one, an original score synthesised here. Sound effects are always synthesised.

  python3 engine/audio/make_audio.py <video-dir>

Inputs (inside the video folder)
  audio/narration_24k.wav      voice-over
  data/timeline.json           scene boundaries + sound cues emitted by the animation
  video.json                   chapters[].mood picks the arrangement per chapter; optional "mix" levels
Outputs
  audio/music.wav  audio/sfx.wav  audio/voice.wav      (48 kHz stemmed)
  audio/mix_premaster.wav                               (sum, before loudness normalisation)

The synthesised score and the effects use no samples: every sound is generated from oscillators
and noise below. A licensed track is levelled against the voice (music.rel_db, -9 dB by default),
faded in and out, looped with a crossfade if it is shorter than the video, and ducked under speech.
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal
from scipy.ndimage import minimum_filter1d

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import load_config, need, project_dir  # noqa: E402

ROOT = project_dir()
CFG = load_config(ROOT)
SR = 48000
TL = json.load(open(need(ROOT / "data/timeline.json", "run: lockstep meta <video>")))
TAKES = json.load(open(ROOT / "data/takes.json"))
DUR = TL["dur"]
N = int(round(DUR * SR))
rng = np.random.default_rng(7)


# ----------------------------------------------------------------- helpers
def db(x):
    return 10 ** (x / 20)


def t_axis(n):
    return np.arange(n) / SR


def butter(x, fc, kind="low", order=2):
    fc = np.clip(fc, 20, SR / 2 - 200) if np.isscalar(fc) else fc
    sos = signal.butter(order, fc, btype=kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def env_ar(n, a, r, curve=3.0):
    """attack / exponential release envelope of n samples"""
    e = np.ones(n)
    na = max(1, int(a * SR))
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    nr = n - na
    if nr > 0:
        e[na:] = np.exp(-curve * np.arange(nr) / max(1, int(r * SR)))
    return e


def adsr(n, a, d, s, r):
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    ns = max(0, n - na - nd - nr)
    e = np.concatenate([np.linspace(0, 1, max(1, na)), np.linspace(1, s, max(1, nd)), np.full(ns, s), np.linspace(s, 0, max(1, nr))])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def saw(freq, n, phase=0.0):
    """polyBLEP saw, freq scalar or array"""
    f = np.full(n, freq) if np.isscalar(freq) else freq
    dt = f / SR
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    lo = ph < dt
    hi = ph > 1 - dt
    tt = ph[lo] / dt[lo]
    y[lo] -= tt + tt - tt * tt - 1
    tt = (ph[hi] - 1) / dt[hi]
    y[hi] -= tt * tt + tt + tt + 1
    return y


def sine(freq, n, phase=0.0):
    f = np.full(n, freq) if np.isscalar(freq) else freq
    return np.sin(2 * np.pi * (phase + np.cumsum(f) / SR))


def noise(n):
    return rng.standard_normal(n)


def pan(mono, p):
    """equal-power pan, p in [-1, 1]"""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], axis=1)


def place(buf, x, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    if i < 0:
        x = x[-i:]
        i = 0
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * gain


def make_ir(seconds, decay, bright=6000, seed=1):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = r.standard_normal((n, 2)) * np.exp(-decay * np.arange(n) / SR)[:, None]
    ir = butter(ir, bright, "low", 2)
    ir = butter(ir, 180, "high", 2)
    ir[: int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR))[:, None]
    return ir / np.sqrt((ir ** 2).sum(axis=0)).max()


def reverb(x, ir, wet):
    out = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x + out * wet


MUSIC = CFG.get("music", {})                 # video.json: {"track": "name", "start": 0} or {"bpm": 100, "transpose": 0, "kit": "synth"}
TRACK = MUSIC.get("track")
TRANSPOSE = float(MUSIC.get("transpose", 0))  # semitones; moves the whole score (-5 .. +6 is a sensible range)


def midi(m):
    return 440.0 * 2 ** ((m + TRANSPOSE - 69) / 12)


# -------------------------------------------------------------------- score
BPM = float(MUSIC.get("bpm", 100.0))
if not 70 <= BPM <= 150:
    sys.exit(f"video.json music.bpm = {BPM:g}: choose 70-150")
# Kits re-voice the same arrangement. Multipliers on each layer, the pad filter, and how much saw is in the arpeggio.
KITS = {
    "synth": dict(pad=1.0, bass=1.0, arp=1.0, kick=1.0, hat=1.0, cut=1.0, arp_saw=0.6),      # bright electronic (default)
    "soft":  dict(pad=1.1, bass=0.8, arp=0.7, kick=0.55, hat=0.0, cut=0.55, arp_saw=0.0),     # warm, rounded, unhurried
    "pluck": dict(pad=0.55, bass=0.9, arp=1.5, kick=0.8, hat=0.7, cut=0.9, arp_saw=0.25),     # light, playful, melodic
    "deep":  dict(pad=1.2, bass=1.35, arp=0.45, kick=1.1, hat=0.0, cut=0.7, arp_saw=0.4),     # cinematic, heavy low end
    "pulse": dict(pad=0.6, bass=1.2, arp=1.0, kick=1.4, hat=1.5, cut=1.15, arp_saw=0.8),      # driving, punchy, fast formats
}
KIT_NAME = MUSIC.get("kit", "synth")
if KIT_NAME not in KITS:
    sys.exit(f"video.json music.kit = {KIT_NAME!r}: choose from " + ", ".join(KITS))
KIT = KITS[KIT_NAME]
BEAT = 60.0 / BPM
NOTE = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
CH = {  # chord -> (root pitch class, intervals)
    "Dm": ("D", [0, 3, 7, 10]), "Bb": ("Bb", [0, 4, 7, 11]), "F": ("F", [0, 4, 7, 9]), "C": ("C", [0, 4, 7, 14]),
    "Gm": ("G", [0, 3, 7, 10]), "A": ("A", [0, 4, 7, 10]), "Asus": ("A", [0, 5, 7, 10]), "D": ("D", [0, 4, 7, 14]),
    "Dm9": ("D", [0, 3, 7, 14]),
}
scene_t = [s["t0"] for s in TL["scenes"]] + [DUR]
scene_b = [int(round(t / BEAT)) for t in scene_t]
# Moods: one per chapter (video.json -> chapters[].mood). Each sets the chord cycle
# (4 beats per chord, D minor family), the level of every layer and the pad brightness.
MOODS = {
    "drone":      dict(ch=["Dm9"], pad=0.9, bass=0.0, arp=0.0, kick=0.0, hat=0.0, cut=1100),                      # held pad, no pulse: hooks, cold opens
    "light":      dict(ch=["Dm", "Bb", "F", "C"], pad=0.7, bass=0.55, arp=0.55, kick=0.35, hat=0.25, cut=1500),   # gentle, first explanation
    "groove":     dict(ch=["Dm", "Bb", "F", "C", "Dm"], pad=0.7, bass=0.7, arp=0.6, kick=0.5, hat=0.4, cut=1700),
    "build":      dict(ch=["Bb", "C", "Dm", "F", "Gm"], pad=0.85, bass=0.7, arp=0.7, kick=0.5, hat=0.45, cut=2000),  # rising, reveals
    "mechanical": dict(ch=["Dm", "Dm", "Bb", "Bb", "Gm", "Gm", "Asus", "A", "Dm", "Bb"], pad=0.5, bass=0.75, arp=0.3, kick=0.6, hat=0.3, cut=1300, kick_every=1),  # steady pulse, leaves room for sound effects
    "drive":      dict(ch=["Dm", "F", "C", "Gm"], pad=0.7, bass=0.75, arp=0.65, kick=0.55, hat=0.45, cut=1800),
    "dark":       dict(ch=["Gm", "Dm", "Bb", "Asus"], pad=0.85, bass=0.5, arp=0.35, kick=0.25, hat=0.0, cut=1200, half_time=True),  # slower, warning
    "bright":     dict(ch=["F", "C", "Dm", "Bb"], pad=0.8, bass=0.75, arp=0.8, kick=0.55, hat=0.5, cut=2300),     # major, payoff moments
    "tense":      dict(ch=["Gm", "Asus", "Gm", "A"], pad=0.75, bass=0.35, arp=0.0, kick=0.0, hat=0.3, cut=800, half_time=True),   # stripped, filtered
    "finale":     dict(ch=["Bb", "C", "Dm", "F", "Bb", "C", "D"], pad=0.9, bass=0.8, arp=0.75, kick=0.55, hat=0.45, cut=2300),    # full, resolves to D major
}
_DEFAULT_CYCLE = ["light", "groove", "build", "drive", "dark", "bright", "tense"]


def scene_moods():
    """Mood per timeline scene: from video.json if given, else a sensible default arc."""
    by_id = {c["id"]: c.get("mood") for c in CFG.get("chapters", [])}
    n, out = len(TL["scenes"]), []
    for i, sc in enumerate(TL["scenes"]):
        mood = by_id.get(sc["id"])
        if not mood:
            mood = "drone" if i == 0 else "finale" if i == n - 1 else _DEFAULT_CYCLE[(i - 1) % len(_DEFAULT_CYCLE)]
        if isinstance(mood, dict):               # a custom arrangement: {"like": "light", "ch": ["Dm", "F"], "arp": 0.9, ...}
            base = dict(MOODS[mood.get("like", "light")])
            base.update({k: v for k, v in mood.items() if k != "like"})
            bad = [c for c in base["ch"] if c not in CH]
            if bad:
                sys.exit(f"chapter {sc['id']!r}: unknown chord(s) {bad}; available: " + ", ".join(CH))
            m = base
        elif mood not in MOODS:
            sys.exit(f"unknown mood {mood!r} for chapter {sc['id']!r}; choose from: " + ", ".join(MOODS))
        else:
            m = MOODS[mood]
        m = dict(m)
        for k in ("pad", "bass", "arp", "kick", "hat", "cut"):
            m[k] = m[k] * KIT[k]
        out.append(m)
    return out


SCENES = scene_moods()


def chord_notes(name, octave=3):
    root, iv = CH[name]
    base = 12 * (octave + 1) + NOTE[root]
    return [base + i for i in iv]


def build_music():
    L = np.zeros((N + SR * 4, 2))
    pad_bus = np.zeros_like(L)
    arp_bus = np.zeros_like(L)
    dry = np.zeros_like(L)
    final_beat = int(round((TAKES["meta"]["speech_end"] + 0.25) / BEAT))       # last chord lands just after the final word
    for si, sc in enumerate(SCENES):
        b0, b1 = scene_b[si], scene_b[si + 1]
        segs, b, k = [], b0, 0
        while b < b1:
            e = min(b + 4, b1)
            if b1 - e < 2:
                e = b1                                                  # absorb a short tail into the last chord
            segs.append((b, e, sc["ch"][k % len(sc["ch"])]))
            b, k = e, k + 1
        if si == len(SCENES) - 1:                                       # ending: hold a D major from the end card on
            segs = [(a, min(e, final_beat), c) for a, e, c in segs if a < final_beat] + [(final_beat, b1 + 4, "D")]
        for (a, e, name) in segs:
            t0, dur = a * BEAT, (e - a) * BEAT
            n = int((dur + 1.6) * SR)
            notes = chord_notes(name, 3)
            last = si == len(SCENES) - 1 and name == "D" and a == final_beat
            # ---- pad: two detuned saws per note, slow attack, wide
            for j, m in enumerate(notes):
                f = midi(m)
                envp = adsr(n, 0.5 if not last else 0.08, 0.6, 0.8, 1.5)
                for det, pn in ((-0.06, -0.7), (0.07, 0.7)):
                    y = saw(f * 2 ** (det / 12), n, rng.random()) * envp
                    y = butter(y, sc["cut"] * (1.0 if j else 0.8), "low", 2)
                    place(pad_bus, pan(y, pn * (0.4 + 0.2 * j)), t0, 0.085 * sc["pad"] * (1.5 if last else 1))
            # ---- bass: root, octave 2, sine + a little harmonic for small speakers
            if sc["bass"] > 0:
                root = 12 * 3 + NOTE[CH[name][0]]
                if root > 12 * 3 + 7:
                    root -= 12
                steps = int(round((e - a) * 2))                           # eighth notes
                for s in range(steps):
                    if sc.get("half_time") and s % 4 != 0:                # half-time feel in the darker moods
                        continue
                    acc = 1.0 if s % 4 == 0 else 0.62 if s % 2 == 0 else 0.45
                    nn = int(0.34 * SR)
                    f = midi(root)
                    y = (sine(f, nn) + 0.35 * sine(2 * f, nn) + 0.12 * saw(f, nn)) * env_ar(nn, 0.006, 0.16, 3.5)
                    place(dry, pan(butter(y, 900, "low"), 0), t0 + s * BEAT / 2, 0.20 * sc["bass"] * acc)
            # ---- arp: eighth-note plucks over chord tones, two octaves
            if sc["arp"] > 0:
                tones = chord_notes(name, 4) + [chord_notes(name, 5)[0], chord_notes(name, 5)[2]]
                order = [0, 2, 1, 4, 2, 5, 3, 1]
                steps = int(round((e - a) * 2))
                for s in range(steps):
                    m = tones[order[(s + si) % 8] % len(tones)]
                    nn = int(0.5 * SR)
                    y = (saw(midi(m), nn, rng.random()) * KIT["arp_saw"] + sine(midi(m), nn)) * env_ar(nn, 0.003, 0.11, 4)
                    y = butter(y, 3400 + 900 * (s % 2), "low", 2)
                    vel = 0.75 if s % 2 == 0 else 0.5
                    place(arp_bus, pan(y, 0.55 * (1 if s % 2 else -1)), t0 + s * BEAT / 2, 0.075 * sc["arp"] * vel)
            # ---- soft kick + noise hat
            for bb in range(a, e):
                tb = bb * BEAT
                if sc["kick"] > 0 and (bb - b0) % sc.get("kick_every", 2) == 0:
                    nn = int(0.3 * SR)
                    fr = 46 + 62 * np.exp(-np.arange(nn) / (0.03 * SR))
                    y = sine(fr, nn) * env_ar(nn, 0.002, 0.11, 3.5)
                    place(dry, pan(y, 0), tb, 0.36 * sc["kick"])
                if sc["hat"] > 0:
                    for q in range(4):
                        nn = int(0.05 * SR)
                        y = butter(noise(nn), 7000, "high", 2) * env_ar(nn, 0.001, 0.012, 4)
                        place(dry, pan(y, 0.3 if q % 2 else -0.3), tb + q * BEAT / 4, 0.03 * sc["hat"] * (1.0 if q == 2 else 0.5))
    # arp ping-pong delay (dotted eighth)
    d = int(0.75 * BEAT * SR)
    echo = np.zeros_like(arp_bus)
    for k, g in enumerate([0.42, 0.24, 0.12]):
        sh = d * (k + 1)
        echo[sh:, k % 2] += arp_bus[:-sh, 0 if k % 2 == 0 else 1] * g
        echo[sh:, 1 - k % 2] += arp_bus[:-sh, 1 if k % 2 == 0 else 0] * g * 0.4
    arp_bus += echo
    ir = make_ir(2.8, 2.4, 5200, seed=3)
    music = reverb(pad_bus, ir, 0.55) + reverb(arp_bus, ir, 0.4) + dry
    music = butter(music, 34, "high", 2)
    return music[:N]


# ---------------------------------------------------------------------- sfx
def sfx_event(e):
    typ, g, pitch, dur = e["type"], e.get("gain", 1.0), e.get("pitch", 1.0), e.get("dur", None)
    p = ((sum(map(ord, typ)) * 31 + int(round(e["t"] * 10)) * 17) % 100 / 100 - 0.5) * 0.5   # small deterministic pan
    if typ == "tick":
        n = int(0.05 * SR)
        y = sine(1900 * pitch, n) * env_ar(n, 0.001, 0.012, 4)
        return pan(y, p), 0.10 * g, 0.1
    if typ == "blip":
        n = int(0.16 * SR)
        f = np.concatenate([np.full(n // 2, 880 * pitch), np.full(n - n // 2, 1320 * pitch)])
        y = (sine(f, n) + 0.3 * sine(2 * f, n)) * env_ar(n, 0.003, 0.05, 3.5)
        return pan(y, p), 0.13 * g, 0.3
    if typ == "pop":
        n = int(0.09 * SR)
        f = 520 * pitch * np.exp(-np.arange(n) / (0.03 * SR)) + 180
        y = sine(f, n) * env_ar(n, 0.001, 0.025, 3.5)
        return pan(y, p), 0.20 * g, 0.12
    if typ == "thump":
        n = int(0.34 * SR)
        f = 44 + 70 * np.exp(-np.arange(n) / (0.035 * SR))
        y = sine(f, n) * env_ar(n, 0.002, 0.12, 3.2) + 0.25 * sine(2 * f, n) * env_ar(n, 0.002, 0.06, 4)
        y[: int(0.004 * SR)] += butter(noise(int(0.004 * SR)), 2500, "low") * 0.3
        return pan(y, 0), 0.48 * g, 0.12
    if typ == "impact":
        n = int(1.5 * SR)
        f = 36 + 60 * np.exp(-np.arange(n) / (0.07 * SR))
        y = sine(f, n) * env_ar(n, 0.003, 0.42, 3) + 0.3 * sine(2 * f, n) * env_ar(n, 0.003, 0.2, 3.5)
        nz = butter(noise(n), 1800, "low", 2) * env_ar(n, 0.002, 0.25, 4) * 0.35
        hi = butter(noise(n), 3500, "high", 2) * env_ar(n, 0.001, 0.07, 4) * 0.12
        return pan(y + nz + hi, 0), 0.62 * g, 0.55
    if typ == "stamp":
        n = int(0.3 * SR)
        f = 70 + 110 * np.exp(-np.arange(n) / (0.02 * SR))
        y = sine(f, n) * env_ar(n, 0.001, 0.07, 3.5)
        y += butter(noise(n), 2200, "low", 2) * env_ar(n, 0.001, 0.03, 4) * 0.4
        return pan(y, p * 0.5), 0.34 * g, 0.18
    if typ == "whoosh":
        n = int(0.75 * SR)
        nz = noise(n)
        w = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
        a = butter(nz, [300, 1400], "band", 2)
        b = butter(nz, [1200, 5200], "band", 2)
        sweep = np.linspace(0, 1, n)
        y = (a * (1 - sweep) + b * sweep) * w
        sp = np.linspace(-0.7, 0.7, n) * (1 if p >= 0 else -1)
        ang = (sp + 1) * np.pi / 4
        return np.stack([y * np.cos(ang), y * np.sin(ang)], axis=1), 0.20 * g, 0.4
    if typ == "riser":
        d = dur or 1.0
        n = int(d * SR)
        up = np.linspace(0, 1, n)
        nz = butter(noise(n), [900, 7000], "band", 2) * up ** 2
        tone = sine(220 * 2 ** (up * 2.0), n) * up ** 2 * 0.35
        return pan(nz * 0.6 + tone, 0), 0.20 * g, 0.5
    if typ == "count":
        d = dur or 1.0
        n = int(d * SR)
        y = np.zeros(n)
        k, tt = 0, 0.0
        while tt < d - 0.03:
            nn = int(0.028 * SR)
            f = 1300 + 1700 * (tt / d)
            blip = sine(f, nn) * env_ar(nn, 0.001, 0.008, 4)
            i = int(tt * SR)
            y[i:i + nn] += blip[: max(0, min(nn, n - i))]
            tt += 0.055 - 0.02 * (tt / d)
            k += 1
        return pan(y, 0.15), 0.085 * g, 0.2
    if typ == "data":
        d = dur or 1.0
        n = int(d * SR)
        y = np.zeros((n, 2))
        r = np.random.default_rng(int(e["t"] * 100))
        tt = 0.0
        while tt < d - 0.05:
            nn = int(0.035 * SR)
            f = r.choice([1320, 1760, 1980, 2640, 990])
            blip = sine(f, nn) * env_ar(nn, 0.002, 0.01, 4)
            i = int(tt * SR)
            m = max(0, min(nn, n - i))
            y[i:i + m] += pan(blip[:m], r.uniform(-0.8, 0.8))
            tt += r.uniform(0.035, 0.11)
        fade = np.minimum(1, np.minimum(np.arange(n) / (0.08 * SR), (n - np.arange(n)) / (0.2 * SR)))
        return y * fade[:, None], 0.055 * g, 0.35
    if typ == "slide":
        d = dur or 0.5
        n = int(d * SR)
        w = np.sin(np.pi * np.linspace(0, 1, n))
        y = butter(noise(n), [500, 2600], "band", 2) * w
        return pan(y, p), 0.10 * g, 0.3
    if typ == "zip":
        n = int(0.34 * SR)
        f = 320 * 2 ** (np.linspace(0, 1, n) ** 1.5 * 3.4)
        y = (sine(f, n) + 0.3 * butter(noise(n), 3000, "high")) * np.sin(np.pi * np.linspace(0, 1, n))
        return pan(y, 0.3), 0.14 * g, 0.3
    if typ == "chime":
        n = int(1.3 * SR)
        y = sum(a * sine(fr * pitch, n) * env_ar(n, 0.002, dec, 3.2) for fr, a, dec in ((1046.5, 1.0, 0.5), (1568.0, 0.6, 0.42), (2093.0, 0.35, 0.3), (3136.0, 0.15, 0.2)))
        return pan(y, p * 0.6), 0.12 * g, 0.6
    if typ == "flip":
        n = int(0.3 * SR)
        y = butter(noise(n), [800, 5000], "band", 2) * np.sin(np.pi * np.linspace(0, 1, n)) ** 2
        y[n // 2: n // 2 + 240] += sine(1500, 240) * np.hanning(240) * 1.5
        return pan(y, 0), 0.20 * g, 0.3
    if typ == "rip":
        n = int(0.28 * SR)
        f = np.linspace(4200, 500, n)
        nz = noise(n)
        y = (butter(nz, 2500, "high") * np.linspace(1, 0, n) + butter(nz, 900, "low") * np.linspace(0, 1, n)) * env_ar(n, 0.004, 0.11, 3)
        return pan(y, p), 0.15 * g, 0.2
    if typ == "deny":
        n = int(0.3 * SR)
        y = (saw(98, n) + saw(104, n)) * env_ar(n, 0.004, 0.11, 3)
        y = butter(y, 900, "low", 2)
        return pan(y, 0), 0.20 * g, 0.15
    if typ == "lock":
        n = int(0.22 * SR)
        y = sine(1244 * pitch, n) * env_ar(n, 0.001, 0.035, 4) + 0.6 * sine(1865 * pitch, n) * env_ar(n, 0.001, 0.06, 4)
        y[: int(0.003 * SR)] += noise(int(0.003 * SR)) * 0.5
        return pan(y, p), 0.15 * g, 0.3
    if typ == "slice":
        n = int(0.2 * SR)
        y = butter(noise(n), 5000, "high", 2) * env_ar(n, 0.001, 0.035, 4) + 0.3 * sine(np.linspace(5000, 2500, n), n) * env_ar(n, 0.001, 0.03, 4)
        return pan(y, p), 0.12 * g, 0.25
    if typ == "fire":
        n = int(0.26 * SR)
        f = 1500 * pitch * np.exp(-np.arange(n) / (0.09 * SR)) + 500
        y = sine(f, n) * env_ar(n, 0.001, 0.06, 3.5) + 0.5 * butter(noise(n), [1500, 6000], "band", 2) * env_ar(n, 0.001, 0.045, 4)
        return pan(y, 0), 0.15 * g, 0.3
    if typ == "call":
        n = int(0.16 * SR)
        y = (sine(520 * pitch, n) + 0.7 * sine(780 * pitch, n) + 0.3 * sine(1560 * pitch, n)) * env_ar(n, 0.006, 0.04, 3)
        return pan(y, 0), 0.16 * g, 0.35
    if typ == "splash":
        n = int(0.45 * SR)
        y = butter(noise(n), [700, 3800], "band", 2) * env_ar(n, 0.02, 0.13, 3)
        st = np.stack([y, np.roll(y, 200)], axis=1)
        return st, 0.17 * g, 0.3
    if typ == "stall":
        n = int(0.5 * SR)
        f = 560 * 2 ** (-np.linspace(0, 1, n) ** 0.7 * 1.6)
        y = (sine(f, n) + 0.4 * saw(f * 0.5, n)) * env_ar(n, 0.005, 0.2, 3)
        y = butter(y, 1500, "low", 2)
        return pan(y, 0), 0.17 * g, 0.3
    if typ == "boot":
        n = int(1.1 * SR)
        up = np.linspace(0, 1, n)
        y = sine(55 + 55 * up ** 0.5, n) * np.sin(np.pi * up) ** 0.6 * 0.9 + butter(noise(n), [400, 3000], "band") * up * (1 - up) * 1.2
        return pan(y, 0), 0.26 * g, 0.4
    if typ == "swell":
        d = dur or 2.0
        n = int(d * SR)
        w = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.2
        y = sum(saw(midi(m) * 2 ** (dt / 12), n, rng.random()) for m in (62, 69, 74, 77) for dt in (-0.07, 0.07))
        y = butter(y, 1400, "low", 2) * w / 8
        return np.stack([y, np.roll(y, 300)], axis=1), 0.22 * g, 0.7
    raise KeyError(f"unknown sound cue type {typ!r} at t={e['t']}; see reference/audio.md for the list")


def build_sfx():
    dry = np.zeros((N + SR * 4, 2))
    wet = np.zeros_like(dry)
    for e in TL["sfx"]:
        x, gain, send = sfx_event(e)
        place(dry, x, e["t"], gain)
        place(wet, x, e["t"], gain * send)
    ir = make_ir(1.6, 4.2, 6500, seed=9)
    out = dry + (reverb(wet, ir, 1.0) - wet)
    return butter(out, 30, "high", 2)[:N]


# -------------------------------------------------------------------- voice
def build_voice():
    v, sr = sf.read(ROOT / "audio/narration_24k.wav", dtype="float64")
    v = signal.resample_poly(v, SR, sr)
    v = np.pad(v, (0, max(0, N - len(v))))[:N]
    v = butter(v, 75, "high", 2)
    # gentle presence lift
    hi = butter(v, 3800, "high", 1)
    v = v + 0.08 * hi
    # light compression (2.2:1 above -20 dBFS) with a fast/slow envelope pair
    a = np.abs(v)
    fast = signal.lfilter([1 - np.exp(-1 / (0.004 * SR))], [1, -np.exp(-1 / (0.004 * SR))], a)
    slow = signal.lfilter([1 - np.exp(-1 / (0.12 * SR))], [1, -np.exp(-1 / (0.12 * SR))], a)
    envl = np.maximum(fast, slow) + 1e-9
    thr = db(-20)
    gain = np.where(envl > thr, (envl / thr) ** (1 / 2.2 - 1), 1.0)
    v = v * gain
    # peak control: hold the crest factor to ~11 dB so the voice can sit at
    # broadcast-style loudness without the final limiter having to work hard
    speaking = np.maximum(fast, slow) > 0.012
    rms = np.sqrt((v[speaking] ** 2).mean())
    ceil = rms * db(11.0)
    g = np.minimum(1.0, ceil / np.maximum(np.abs(v), 1e-9))
    g = minimum_filter1d(g, size=int(0.004 * SR) | 1, mode="nearest")
    ar = np.exp(-1 / (0.06 * SR))
    zi = signal.lfilter_zi([1 - ar], [1, -ar])
    g = np.minimum(g, np.minimum(signal.lfilter([1 - ar], [1, -ar], g, zi=zi * g[0])[0], signal.lfilter([1 - ar], [1, -ar], g[::-1], zi=zi * g[-1])[0][::-1]))
    v = v * g
    v = v / np.abs(v).max() * db(-3.0)
    st = np.stack([v, v], axis=1)
    # a touch of room so the voice sits in the same space as the score
    ir = make_ir(0.35, 16, 7000, seed=5)
    return reverb(st, ir, 0.05), np.maximum(fast, slow)


def load_track():
    """The licensed track named in video.json, as stereo float at SR, cut (or looped) to the video's length."""
    cr_path = ROOT / "media/credits.json"
    cr = json.load(open(cr_path)) if cr_path.exists() else {}
    e = cr.get(TRACK)
    if not e:
        sys.exit(f"video.json music.track = {TRACK!r}: no such entry in media/credits.json (lockstep find <video> music \"…\", then take)")
    f = ROOT / "media" / e["file"]
    if not f.exists():
        sys.exit(f"media/{e['file']} is missing: lockstep media {ROOT.name} restore")
    start = float(MUSIC.get("start", 0))
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", str(f), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    if len(x) < SR:
        sys.exit(f"media/{e['file']}: less than a second of audio after start = {start}")
    while len(x) < N:                                # loop with a 1.5 s crossfade
        xf = int(1.5 * SR)
        ramp = np.linspace(0, 1, xf)[:, None]
        head = x[:xf] * ramp + x[-xf:] * (1 - ramp)
        x = np.concatenate([x[:-xf], head, x[xf:]])
    return x[:N]


def duck_curve(envl, depth_db, thr=0.012, attack=0.06, release=0.4):
    """gain curve that dips while the narrator speaks"""
    speak = (envl > thr).astype(float)
    # hold the gate open across short gaps between words
    k = int(0.22 * SR)
    speak = signal.fftconvolve(speak, np.ones(k) / k, mode="same")
    speak = np.clip(speak * 3, 0, 1)
    sm = signal.lfilter([1 - np.exp(-1 / (release * SR))], [1, -np.exp(-1 / (release * SR))], speak)
    sm = np.maximum(sm, signal.lfilter([1 - np.exp(-1 / (attack * SR))], [1, -np.exp(-1 / (attack * SR))], speak))
    return db(depth_db * np.clip(sm, 0, 1))


def main():
    print("voice ...")
    voice, envl = build_voice()
    print("music ..." + (f" (track: {TRACK})" if TRACK else " (synthesised score)"))
    music = load_track() if TRACK else build_music()
    print("sfx ...")
    sfx = build_sfx()

    # fades: music eases in under the first word and rings out with the end card
    fade = np.ones(N)
    fi = int((0.8 if TRACK else 0.35) * SR)
    fade[:fi] = np.linspace(0.0 if TRACK else 0.25, 1, fi)
    fo = int(1.6 * SR)
    fade[-fo:] *= np.linspace(1, 0, fo) ** 1.5
    music *= fade[:, None]
    sfx[-int(0.5 * SR):] *= np.linspace(1, 0, int(0.5 * SR))[:, None]

    mixcfg = CFG.get("mix", {})                    # optional overrides in video.json
    music_lvl, sfx_lvl = db(mixcfg.get("music_db", -4.0)), db(mixcfg.get("sfx_db", -0.5))
    duck_db = mixcfg.get("duck_music_db", -8.5)
    if TRACK:                                      # a mastered track: set its level against the voice, not by a fixed gain
        def rms(y):
            return np.sqrt((y ** 2).mean() + 1e-12)
        loud = music[np.abs(music).max(axis=1) > 1e-3]
        target = rms(voice[envl > 0.012]) * db(float(MUSIC.get("rel_db", -9.0)))
        music_lvl = target / max(1e-9, rms(loud if len(loud) else music))
        duck_db = mixcfg.get("duck_music_db", -7.5)
    music_d = music * music_lvl * duck_curve(envl, duck_db)[:, None]
    sfx_d = sfx * sfx_lvl * duck_curve(envl, mixcfg.get("duck_sfx_db", -3.5))[:, None]
    mix = voice + music_d + sfx_d
    peak = np.abs(mix).max()
    mix = np.tanh(mix / max(1.0, peak) * 1.15) / np.tanh(1.15) * min(1.0, peak) if peak > 0.98 else mix
    mix = mix / max(1e-9, np.abs(mix).max()) * db(-1.5)

    for name, x in (("voice", voice), ("music", music_d), ("sfx", sfx_d), ("mix_premaster", mix)):
        sf.write(ROOT / f"audio/{name}.wav", x, SR, subtype="PCM_24")

    def rms_db(x, mask=None):
        y = x if mask is None else x[mask]
        return 20 * np.log10(np.sqrt((y ** 2).mean()) + 1e-12)

    speaking = envl > 0.012
    stats = {
        "duration_s": round(N / SR, 3),
        "voice_rms_while_speaking_db": round(rms_db(voice, speaking), 1),
        "music_rms_while_speaking_db": round(rms_db(music_d, speaking), 1),
        "sfx_rms_while_speaking_db": round(rms_db(sfx_d, speaking), 1),
        "bed_rms_while_speaking_db": round(rms_db(music_d + sfx_d, speaking), 1),
        "music_rms_in_pauses_db": round(rms_db(music_d, ~speaking), 1),
        "premaster_peak_db": round(20 * np.log10(np.abs(mix).max()), 2),
        "sfx_cues": len(TL["sfx"]),
    }
    stats["speech_to_bed_ratio_db"] = round(stats["voice_rms_while_speaking_db"] - stats["bed_rms_while_speaking_db"], 1)
    json.dump(stats, open(ROOT / "data/audio_stats.json", "w"), indent=1)
    print(json.dumps(stats, indent=1))


if __name__ == "__main__":
    main()
