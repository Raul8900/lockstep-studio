"""Build dist/subtitles.srt from the measured word timings.

  python3 engine/make_srt.py <video-dir>


Burned-in captions show 1-4 words at a time; the SRT sidecar groups those
phrases into reading-length cues (<= 42 characters per line, <= 2 lines),
breaking only at phrase boundaries, with times taken from the same word
timings that drive the animation.
"""
import json
import re
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import project_dir  # noqa: E402

ROOT = project_dir()
words = json.load(open(ROOT / "data/words.json"))
phrases = json.load(open(ROOT / "caption_phrases.json"))
MAX_LINE, MAX_CHARS = 42, 74


def clean(w):
    return re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", w.lower())


def pretty(w):
    w = w.replace("—", " —").replace("…", "…")
    return w


# map phrases onto words
items, wi = [], 0
for ph in phrases:
    n = len(ph.split())
    ws = words[wi:wi + n]
    assert [clean(x["w"]) for x in ws] == [clean(p) for p in ph.split()], ph
    items.append({"text": " ".join(pretty(x["w"]) for x in ws), "t0": ws[0]["t0"], "t1": ws[-1]["t1"], "take": ws[0]["take"],
                  "end_sentence": bool(re.search(r"[.!?]$", ws[-1]["w"]))})
    wi += n
assert wi == len(words)

cues, cur = [], None
for it in items:
    start_new = cur is None or cur["take"] != it["take"] or cur["end_sentence"] or len(cur["text"]) + 1 + len(it["text"]) > MAX_CHARS \
        or it["t0"] - cur["t1"] > 0.6
    if start_new:
        if cur:
            cues.append(cur)
        cur = dict(it)
    else:
        cur["text"] += " " + it["text"]
        cur["t1"] = it["t1"]
        cur["end_sentence"] = it["end_sentence"]
if cur is not None:
    cues.append(cur)


def wrap(text):
    if len(text) <= MAX_LINE:
        return text
    ws = text.split()
    best, bd = None, 1e9
    for k in range(1, len(ws)):
        a, b = " ".join(ws[:k]), " ".join(ws[k:])
        if len(a) > MAX_LINE or len(b) > MAX_LINE:
            continue
        d = abs(len(a) - len(b)) + (4 if ws[k - 1].lower() in ("a", "the", "of", "to", "its", "and", "on", "in", "one") else 0)
        if d < bd:
            best, bd = (a, b), d
    return "\n".join(best) if best else text


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


out = []
for i, c in enumerate(cues):
    start = max(0.0, c["t0"] - 0.05)
    end = c["t1"] + 0.30
    if i + 1 < len(cues):
        end = min(end, cues[i + 1]["t0"] - 0.06)
    end = max(end, start + 0.7) if i + 1 == len(cues) or cues[i + 1]["t0"] - start > 0.8 else end
    out.append(f"{i + 1}\n{ts(start)} --> {ts(end)}\n{wrap(c['text'])}\n")
(ROOT / "dist").mkdir(exist_ok=True)
(ROOT / "dist/subtitles.srt").write_text("\n".join(out), encoding="utf-8")
print(len(cues), "cues ->", ROOT / "dist/subtitles.srt")
print("\n".join(out[:4]))
