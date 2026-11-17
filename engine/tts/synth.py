"""Record the narration and extract exact word timings.

  python3 engine/tts/synth.py <video-dir> [voice] [speed]
  python3 engine/tts/synth.py <video-dir> list            (print the available voices)

Pipeline
  text --misaki G2P--> phonemes per word --Kokoro ONNX--> audio + frames per phoneme
Each duration frame is exactly 600 samples at 24 kHz, so word boundaries are
read straight from the acoustic model rather than estimated.

Outputs
  audio/narration_24k.wav     mono narration, takes joined with scripted pauses
  data/words.json             [{w, t0, t1, beat, take, cls}]
  data/takes.json             per-take and per-beat timing
"""
import json
import re
import sys
import warnings
from pathlib import Path

import numpy as np
import onnxruntime as ort
import soundfile as sf

warnings.filterwarnings("ignore")

import espeakng_loader
from phonemizer.backend.espeak.wrapper import EspeakWrapper

EspeakWrapper.set_library(espeakng_loader.get_library_path())
EspeakWrapper.set_data_path(espeakng_loader.get_data_path())

from misaki import en, espeak  # noqa: E402
from kokoro_onnx.config import get_vocab  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import MODELS, load_config, load_script, need, project_dir  # noqa: E402

ROOT = project_dir()
S = load_script(ROOT)
need(MODELS / "kokoro-v1.0-dur.onnx", "run scripts/setup.sh to download and patch the voice model")
SR = 24000
FRAME = 600  # samples per duration frame

sess = ort.InferenceSession(str(MODELS / "kokoro-v1.0-dur.onnx"),
                            providers=["CPUExecutionProvider"])
voices = np.load(MODELS / "voices-v1.0.bin")
VOCAB = get_vocab()
g2p = en.G2P(trf=False, british=False, fallback=espeak.EspeakFallback(british=False))

PAUSE_RE = re.compile(r"\{p:([0-9.]+)\}")


def phonemize(text):
    """Return (token ids, per-id word index, words, pause requests).

    words: [{"text": display word, "ids": [index into token ids]}]
    pause requests: [(word index the pause follows, minimum seconds)]
    """
    # Split on pause markers so we know which word each marker follows.
    parts = PAUSE_RE.split(text)
    segments, pauses = [], []
    for i in range(0, len(parts), 2):
        segments.append(parts[i].strip())
        if i + 1 < len(parts):
            pauses.append(float(parts[i + 1]))
    clean = " ".join(s for s in segments if s)
    _, mtokens = g2p(clean)

    ids, words = [], []
    cur = None
    for t in mtokens:
        ph = t.phonemes or ""
        is_punct = not any(ch.isalnum() for ch in t.text)
        if cur is None and not is_punct:
            cur = {"text": "", "ids": []}
            words.append(cur)
        target = cur if cur is not None else (words[-1] if words else None)
        if target is not None:
            target["text"] += t.text
        for ch in ph:
            if ch in VOCAB:
                ids.append(VOCAB[ch])
                if target is not None and not is_punct:
                    target["ids"].append(len(ids) - 1)
                elif target is not None:
                    target.setdefault("punct_ids", []).append(len(ids) - 1)
        if t.whitespace:
            if " " in VOCAB:
                ids.append(VOCAB[" "])
            cur = None
    # Map each pause marker to the last word of the segment preceding it.
    pause_after, count = [], 0
    for seg, p in zip(segments, pauses):
        _, seg_tokens = g2p(seg)
        n = 0
        open_word = False
        for t in seg_tokens:
            is_punct = not any(ch.isalnum() for ch in t.text)
            if not open_word and not is_punct:
                n += 1
                open_word = True
            if t.whitespace:
                open_word = False
        count += n
        pause_after.append((count - 1, p))
    return ids, words, pause_after


def synth_take(text, voice, speed):
    ids, words, pause_after = phonemize(text)
    assert 0 < len(ids) <= 510, f"take too long: {len(ids)} tokens"
    style = voices[voice][len(ids) - 1].astype(np.float32)
    audio, dur = sess.run(None, {
        "tokens": np.array([[0, *ids, 0]], dtype=np.int64),
        "style": style,
        "speed": np.array([speed], dtype=np.float32),
    })
    dur = dur.ravel()
    assert int(dur.sum()) * FRAME == len(audio), "duration/audio mismatch"
    edges = np.concatenate([[0], np.cumsum(dur)]) * FRAME  # sample offset of each boundary
    # token i (0-based in ids) occupies edges[i+1] .. edges[i+2]
    for w in words:
        w["s0"] = int(edges[w["ids"][0] + 1])
        w["s1"] = int(edges[w["ids"][-1] + 2])
    return audio.astype(np.float32), words, pause_after


def trim_bounds(audio, words, pad=0.045):
    """Cut the silence the model adds before the first and after the last word."""
    thr = 10 ** (-42 / 20)
    env = np.abs(audio)
    loud = np.where(env > thr)[0]
    head = max(0, min(words[0]["s0"], int(loud[0])) - int(pad * SR))
    tail = min(len(audio), max(words[-1]["s1"], int(loud[-1])) + int(0.09 * SR))
    return head, tail


def fade(x, n_in=96, n_out=480):
    x = x.copy()
    x[:n_in] *= np.linspace(0, 1, n_in, dtype=np.float32)
    x[-n_out:] *= np.linspace(1, 0, n_out, dtype=np.float32)
    return x


def enforce_pauses(audio, words, pause_after):
    """Stretch the gap after a word to the requested minimum by inserting silence."""
    for idx, min_gap in sorted(pause_after, reverse=True):
        if idx + 1 >= len(words):
            continue
        a, b = words[idx]["s1"], words[idx + 1]["s0"]
        gap = (b - a) / SR
        if gap >= min_gap:
            continue
        # insert at the quietest point of the existing gap
        if b - a > 240:
            win = 120
            seg = np.abs(audio[a:b])
            csum = np.convolve(seg, np.ones(win), mode="valid")
            cut = a + int(np.argmin(csum)) + win // 2
        else:
            cut = (a + b) // 2
        extra = int((min_gap - gap) * SR)
        left, right = audio[:cut].copy(), audio[cut:].copy()
        k = min(120, len(left), len(right))
        left[-k:] *= np.linspace(1, 0, k, dtype=np.float32)
        right[:k] *= np.linspace(0, 1, k, dtype=np.float32)
        audio = np.concatenate([left, np.zeros(extra, np.float32), right])
        for w in words[idx + 1:]:
            w["s0"] += extra
            w["s1"] += extra
    return audio, words


def clean_word(text):
    return re.sub(r"^[^\w]+|[^\w]+$", "", text).lower()


def main():
    cfg = load_config(ROOT)
    direction = cfg.get('choices', {}).get('narration', {})
    if direction.get('item') == 'voice.supplied' and (len(sys.argv) < 3 or sys.argv[2] != 'list'):
        sys.exit('This production uses a supplied recording. Use import-voice with reviewed timings, then build; Kokoro will not overwrite it.')
    inputs = direction.get('inputs', {})
    voice = sys.argv[2] if len(sys.argv) > 2 else inputs.get('voice', getattr(S, "VOICE", "af_heart"))
    speed = float(sys.argv[3]) if len(sys.argv) > 3 else inputs.get('speed', getattr(S, "SPEED", 1.0))
    out_tag = ""
    english = sorted(v for v in voices if v[0] in "ab")      # a* = American, b* = British; second letter f/m = female/male
    if voice == "list":
        print("English voices (af_/am_ American, bf_/bm_ British):\n  " + "  ".join(english))
        return
    if voice not in voices:
        sys.exit(f"unknown voice {voice!r}; available: " + ", ".join(english))
    ids = [b["id"] for b in S.BEATS]
    assert len(ids) == len(set(ids)), "beat ids in script.py must be unique"

    pieces = [np.zeros(int(getattr(S, "LEAD_IN", 0.30) * SR), np.float32)]
    cursor = len(pieces[0])
    all_words, takes, beats = [], [], []
    take_no = 0
    for beat in S.BEATS:
        b0 = None
        for text, pause in beat["takes"]:
            tts_text = text.replace("*", "")
            audio, words, pause_after = synth_take(tts_text, voice, speed)
            audio, words = enforce_pauses(audio, words, pause_after)
            head, tail = trim_bounds(audio, words)
            clip = fade(audio[head:tail])
            t_start = cursor / SR
            for w in words:
                key = clean_word(w["text"])
                all_words.append({
                    "w": w["text"],
                    "t0": round((cursor + w["s0"] - head) / SR, 4),
                    "t1": round((cursor + w["s1"] - head) / SR, 4),
                    "beat": beat["id"],
                    "take": take_no,
                    "cls": getattr(S, "HIGHLIGHT", {}).get(key),
                })
            if b0 is None:
                b0 = all_words[-len(words)]["t0"]
            pieces.append(clip)
            cursor += len(clip)
            plain = re.sub(r"\[([^\]]+)\]\(/[^)]*/\)", r"\1", PAUSE_RE.sub("", tts_text))
            plain = re.sub(r"\s+", " ", plain).strip()
            takes.append({"take": take_no, "beat": beat["id"], "text": plain,
                          "t0": all_words[-len(words)]["t0"], "t1": all_words[-1]["t1"],
                          "pause_after": pause})
            gap = np.zeros(int(pause * SR), np.float32)
            pieces.append(gap)
            cursor += len(gap)
            take_no += 1
        beats.append({"id": beat["id"], "title": beat["title"], "t0": b0,
                      "t1": all_words[-1]["t1"]})
    pieces.append(np.zeros(int(getattr(S, "TAIL", 2.6) * SR), np.float32))
    narration = np.concatenate(pieces)
    peak = float(np.abs(narration).max())
    narration = narration / peak * 0.89

    (ROOT / "audio").mkdir(exist_ok=True)
    (ROOT / "data").mkdir(exist_ok=True)
    sf.write(ROOT / f"audio/narration_24k{out_tag}.wav", narration, SR, subtype="PCM_16")
    meta = {"voice": voice, "speed": speed, "sample_rate": SR,
            "duration": round(len(narration) / SR, 3),
            "speech_end": all_words[-1]["t1"], "word_count": len(all_words)}
    if cfg.get('choices'):
        from production import sha256
        meta['timing_provenance'] = dict(provider='kokoro-phoneme-durations', resolution_ms=25,
            model_sha256=sha256(MODELS / 'kokoro-v1.0-dur.onnx'), voices_sha256=sha256(MODELS / 'voices-v1.0.bin'),
            script_sha256=sha256(ROOT / 'script.py'), render_wav_sha256=sha256(ROOT / 'audio/narration_24k.wav'))
    json.dump(all_words, open(ROOT / f"data/words{out_tag}.json", "w"), ensure_ascii=False, indent=0)
    json.dump({"meta": meta, "beats": beats, "takes": takes},
              open(ROOT / f"data/takes{out_tag}.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps(meta))
    for b in beats:
        print(f"  {b['id']:<13} {b['t0']:7.2f} -> {b['t1']:7.2f}  ({b['t1'] - b['t0']:.2f}s)")


if __name__ == "__main__":
    main()
