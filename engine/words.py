"""List every spoken word with the time it starts, for choosing animation cues.

  python3 engine/words.py <video-dir> [beat-id]

The key printed for each word is exactly what a scene passes to at():
    idea  1.84  word        ->  at('idea', 'word')
    idea  4.10  word#2      ->  at('idea', 'word', 2)      (second time it is said in that beat)
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import need, project_dir  # noqa: E402

ROOT = project_dir()
only = sys.argv[2] if len(sys.argv) > 2 else None
words = json.load(open(need(ROOT / "data/words.json", "run: lockstep voice <video>")))
doc = json.load(open(ROOT / "data/takes.json"))


def clean(w):
    return re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", w.lower())


if only and only not in [b["id"] for b in doc["beats"]]:
    sys.exit(f"no beat {only!r}; beats: " + ", ".join(b["id"] for b in doc["beats"]))
for b in doc["beats"]:
    if only and b["id"] != only:
        continue
    print(f"\n{b['id']}   {b['t0']:.2f} -> {b['t1']:.2f} s   (scene starts at {max(0, b['t0'] - 0.5):.2f})")
    seen = defaultdict(int)
    for tk in [t for t in doc["takes"] if t["beat"] == b["id"]]:
        cells = []
        for w in [x for x in words if x["take"] == tk["take"]]:
            k = clean(w["w"])
            seen[k] += 1
            cells.append(f"{w['t0']:.2f} {k}" + (f"#{seen[k]}" if seen[k] > 1 else ""))
        print(f"  take {tk['take']}  (ends {tk['t1']:.2f}, then {tk['pause_after']:.2f} s pause)")
        line = "   "
        for c in cells:
            if len(line) + len(c) > 118:
                print(line)
                line = "   "
            line += " " + c + "  |"
        print(line.rstrip(" |"))
m = doc["meta"]
print(f"\n{m['word_count']} words · speech ends {m['speech_end']:.2f} s · video length {m['duration']:.2f} s")
