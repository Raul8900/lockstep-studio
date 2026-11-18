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
import unicodedata
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
# Spelling that differs from the recogniser's (American) output without being a mishearing.
UNITS = {"ghz": "gigahertz", "mhz": "megahertz", "khz": "kilohertz", "hz": "hertz"}
_OUR = re.compile(r"^(\w+?)our(s|ed|ing|ite|ites|ful|less|able|hood|hoods|er|ers|ly)?$")
_OUR_KEEP = {"fl", "sc", "dev", "cont", "det", "am", "vel", "glam", "troubad", "param"}   # flour, scour, devour, contour...
_BRITISH = {"centre": "center", "centres": "centers", "metre": "meter", "metres": "meters", "litre": "liter",
            "litres": "liters", "theatre": "theater", "fibre": "fiber", "grey": "gray", "programme": "program",
            "programmes": "programs", "travelled": "traveled", "travelling": "traveling", "cancelled": "canceled",
            "centimetre": "centimeter", "centimetres": "centimeters", "millimetre": "millimeter", "millimetres": "millimeters",
            "kilometre": "kilometer", "kilometres": "kilometers", "nanometre": "nanometer", "nanometres": "nanometers",
            "mould": "mold", "moulds": "molds", "mouldy": "moldy", "moult": "molt", "smoulder": "smolder", "plough": "plow",
            "ageing": "aging", "aluminium": "aluminum", "tyre": "tire", "tyres": "tires", "sulphur": "sulfur", "haemoglobin": "hemoglobin",
            "oesophagus": "esophagus", "foetus": "fetus", "anaemia": "anemia", "diarrhoea": "diarrhea", "paediatric": "pediatric"}
_ONES = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9}
_TEENS = {"ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15, "sixteen": 16,
          "seventeen": 17, "eighteen": 18, "nineteen": 19}
_TENS = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}


def _american(w):
    """neighbour -> neighbor, colours -> colors, centre -> center: the recogniser writes American English."""
    if w in _BRITISH:
        return _BRITISH[w]
    m = _OUR.match(w)
    if m and len(m.group(1)) >= 2 and m.group(1) not in _OUR_KEEP:
        return m.group(1) + "or" + (m.group(2) or "")
    return w


def _fold_hundreds(ws):
    """'sixteen hundred' == 1600 == 'one thousand six hundred': rewrite the first as the last."""
    out, i = [], 0
    while i < len(ws):
        n, k = None, 0
        if ws[i] in _TEENS and ws[i] != "ten":
            n, k = _TEENS[ws[i]], 1
        elif ws[i] in _TENS:
            n, k = _TENS[ws[i]], 1
            if i + 1 < len(ws) and ws[i + 1] in _ONES:
                n, k = n + _ONES[ws[i + 1]], 2
        if n and i + k < len(ws) and ws[i + k] == "hundred":
            out += num2words(n * 100).replace("-", " ").replace(",", " ").replace(" and ", " ").split()
            i += k + 1
            continue
        out.append(ws[i])
        i += 1
    return out


def _spell(m):
    tok = m.group(0)
    try:
        return " " + num2words(float(tok) if "." in tok else int(tok)).replace("-", " ").replace(",", " ") + " "
    except Exception:
        return tok


def to_words(text):
    """Lower-case word list with numbers spelled out, so digits and words compare equal."""
    s = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode()   # café == cafe
    for ch in "—–…":
        s = s.replace(ch, " ")
    s = re.sub(r"(?<=\d),(?=\d{3})", "", s)                                  # 20,000 -> 20000
    s = re.sub(r"(?<=\d)\s?(ghz|mhz|khz|hz)\b", lambda m: " " + UNITS[m.group(1)], s)   # 2.4GHz == 2.4 gigahertz
    s = re.sub(r"(?<![a-z0-9.])\d+(?:\.\d+)?(?![a-z0-9])", _spell, s)        # standalone numbers only ("4k" stays)
    s = s.replace("-", " ").replace("'", "").replace("’", "")
    ws = _fold_hundreds([_american(w) for w in re.sub(r"[^a-z0-9 ]+", " ", s).split()])
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
