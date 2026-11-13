"""Independent QA of the narration (needs the optional speech-recognition models).

  python3 engine/tts/asr_check.py <video-dir> [audio_24k.wav]

1. Whisper small.en transcribes every take; the transcript is compared with the
   script (word error rate + list of differences) to catch mispronunciations.
2. A Zipformer transducer gives token timestamps; these are compared with the word
   timings derived from the TTS durations, which checks caption timing against a
   second, unrelated model.

With no audio argument the clean narration is checked. validate.py passes the audio
of the finished MP4 instead, to confirm the voice is still clear under music and effects.
Numbers are spelled out on both sides before comparing ("20,000" == "twenty thousand"),
and differences that are only spacing ("scratch pad" / "scratchpad") are listed but not
counted as errors.
"""
import difflib
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import MODELS, project_dir  # noqa: E402

ROOT = project_dir()
A = MODELS / "asr"
if not (A / "sherpa-onnx-whisper-small.en").exists():
    print("speech-recognition models not installed: run scripts/setup.sh --with-asr")
    sys.exit(3)

import sherpa_onnx  # noqa: E402
from num2words import num2words  # noqa: E402
from scipy.signal import resample_poly  # noqa: E402

final_mix = len(sys.argv) > 2
audio_path = sys.argv[2] if final_mix else ROOT / "audio/narration_24k.wav"
audio, sr = sf.read(audio_path, dtype="float32")
if audio.ndim > 1:
    audio = audio.mean(axis=1)
assert sr == 24000, "expects 24 kHz audio"
takes = json.load(open(ROOT / "data/takes.json"))["takes"]
words = json.load(open(ROOT / "data/words.json"))

whisper = sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=str(A / "sherpa-onnx-whisper-small.en/small.en-encoder.int8.onnx"),
    decoder=str(A / "sherpa-onnx-whisper-small.en/small.en-decoder.int8.onnx"),
    tokens=str(A / "sherpa-onnx-whisper-small.en/small.en-tokens.txt"),
    num_threads=2, language="en", task="transcribe")

BIG = ("hundred", "thousand", "million", "billion", "trillion")


def _spell(m):
    tok = m.group(0)
    try:
        return " " + num2words(float(tok) if "." in tok else int(tok)).replace("-", " ").replace(",", " ") + " "
    except Exception:
        return tok


def to_words(text):
    """Lower-case word list with numbers spelled out, so digits and words compare equal."""
    s = text.lower()
    for ch in "—–…":
        s = s.replace(ch, " ")
    s = re.sub(r"(?<=\d),(?=\d{3})", "", s)                                  # 20,000 -> 20000
    s = re.sub(r"(?<![a-z0-9.])\d+(?:\.\d+)?(?![a-z0-9])", _spell, s)        # standalone numbers only ("4k" stays)
    s = s.replace("-", " ").replace("'", "").replace("’", "")
    ws = re.sub(r"[^a-z0-9 ]+", " ", s).split()
    out = []
    for i, w in enumerate(ws):
        if w == "a" and i + 1 < len(ws) and ws[i + 1] in BIG:
            out.append("one")                                                # "a hundred" == "one hundred"
        elif w == "and" and out and out[-1] in BIG:
            continue                                                         # "hundred and seventy" == "hundred seventy"
        else:
            out.append(w)
    return out


tot_ref = tot_err = 0
report, variants = [], []
for tk in takes:
    a = max(0, int((tk["t0"] - 0.25) * sr))
    b = min(len(audio), int((tk["t1"] + 0.3) * sr))
    st = whisper.create_stream()
    st.accept_waveform(sr, audio[a:b])
    whisper.decode_stream(st)
    hyp, ref = to_words(st.result.text), to_words(tk["text"])
    sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    errs, n_err = [], 0
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        r_, h_ = " ".join(ref[i1:i2]), " ".join(hyp[j1:j2])
        if r_.replace(" ", "") == h_.replace(" ", ""):
            variants.append(f"{r_} -> {h_}")                                 # spacing only
            continue
        n_err += max(i2 - i1, j2 - j1)
        errs.append(f"{r_ or '∅'} -> {h_ or '∅'}")
    tot_ref += len(ref)
    tot_err += n_err
    report.append(f"[{'OK ' if not errs else 'DIFF'}] take {tk['take']:>2}: {st.result.text.strip()}" + (f"\n        diffs: {errs}" if errs else ""))
print("\n".join(report))
if variants:
    print("\nspacing-only variants (not counted):", variants)
print(f"\nWER (script vs Whisper small.en): {tot_err}/{tot_ref} = {100 * tot_err / tot_ref:.2f}%")

# ---- timing cross-check with a transducer ---------------------------------
Z = A / "sherpa-onnx-zipformer-en-2023-06-26"
zf = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=str(Z / "encoder-epoch-99-avg-1.int8.onnx"), decoder=str(Z / "decoder-epoch-99-avg-1.int8.onnx"),
    joiner=str(Z / "joiner-epoch-99-avg-1.int8.onnx"), tokens=str(Z / "tokens.txt"),
    num_threads=2, decoding_method="greedy_search")
a16 = resample_poly(audio, 2, 3).astype(np.float32)
asr_words = []
for tk in takes:
    a = max(0, int((tk["t0"] - 0.3) * 16000))
    b = min(len(a16), int((tk["t1"] + 0.3) * 16000))
    st = zf.create_stream()
    st.accept_waveform(16000, a16[a:b])
    zf.decode_stream(st)
    cur = None
    for tok, ts in zip(st.result.tokens, st.result.timestamps):
        if tok.startswith("▁") or tok.startswith(" ") or cur is None:
            cur = {"w": tok.lstrip("▁ ").lower(), "t": ts + a / 16000}
            asr_words.append(cur)
        else:
            cur["w"] += tok.strip().lower()
ref_w = [re.sub(r"[^a-z0-9']", "", w["w"].lower()) for w in words]
hyp_w = [re.sub(r"[^a-z0-9']", "", w["w"]) for w in asr_words]
sm = difflib.SequenceMatcher(a=ref_w, b=hyp_w, autojunk=False)
diffs = np.array([asr_words[blk.b + k]["t"] - words[blk.a + k]["t0"] for blk in sm.get_matching_blocks() for k in range(blk.size)])
out = {"wer_percent": round(100 * tot_err / tot_ref, 2), "ref_words": tot_ref, "errors": tot_err, "spacing_variants": variants}
if len(diffs):
    dev = np.abs(diffs - np.median(diffs))
    print(f"\nTiming cross-check on {len(diffs)}/{len(words)} matched words (transducer start - TTS start):")
    print(f"  median {np.median(diffs) * 1000:+.0f} ms | mean abs {dev.mean() * 1000:.0f} ms | p95 abs {np.percentile(dev, 95) * 1000:.0f} ms | max {dev.max() * 1000:.0f} ms")
    out.update({"timing_matched_words": int(len(diffs)), "timing_median_ms": float(np.median(diffs) * 1000),
                "timing_mean_abs_ms": float(dev.mean() * 1000), "timing_p95_abs_ms": float(np.percentile(dev, 95) * 1000)})
json.dump(out, open(ROOT / f"data/asr_check{'_final_mix' if final_mix else ''}.json", "w"), indent=1)
