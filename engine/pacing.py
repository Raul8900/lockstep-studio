"""How the time is shared between the beats: `lockstep pacing <video>` (also printed by `voice`).

  python3 engine/pacing.py <video-dir>

Each beat as it will play, from its first word to the next beat's first word: its length, the
words spoken in it and how fast, the time the voice is silent for 0.6 s or more (held: where the
picture speaks on its own) and the voice's speed. Read it against the brief's Pacing plan: the
beats that carry the story (the mechanism, the real footage, the reveal) are the long ones, with
held time; the setup beats are short. reference/story.md, "Pacing".
"""
import json
import sys
from pathlib import Path

HOLD = 0.6     # a silence at least this long counts as held time


def table(beats, words, duration, default_speed=None):
    lines = [f"  {'beat':<13} {'from':>7} {'to':>7} {'length':>7} {'words':>6} {'wpm':>5} {'held':>6}  speed"]
    for k, b in enumerate(beats):
        end = beats[k + 1]["t0"] if k + 1 < len(beats) else duration
        ws = [w for w in words if w["beat"] == b["id"]]
        if not ws:
            continue
        inner = [nx["t0"] - w["t1"] for w, nx in zip(ws, ws[1:])]
        held = sum(g for g in inner + [end - ws[-1]["t1"]] if g >= HOLD)
        speaking = (ws[-1]["t1"] - ws[0]["t0"]) - sum(g for g in inner if g >= HOLD)
        wpm = len(ws) / max(speaking, 0.1) * 60
        speed = b.get("speed", default_speed)
        lines.append(f"  {b['id']:<13} {b['t0']:7.2f} {end:7.2f} {end - b['t0']:6.1f}s {len(ws):6d} {wpm:5.0f} {held:5.1f}s"
                     + (f"  {speed:.2f}" if speed else ""))
    lines.append(f"  length: the beat's time on screen. held: the voice silent for {HOLD} s or more. wpm: while speaking.")
    return "\n".join(lines)


def main():
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from common import project_dir
    root = project_dir()
    try:
        takes = json.load(open(root / "data/takes.json"))
        words = json.load(open(root / "data/words.json"))
    except FileNotFoundError:
        sys.exit(f"no narration yet: lockstep voice {root.name}")
    print(table(takes["beats"], words, takes["meta"]["duration"], takes["meta"].get("speed")))
    print("  The beats that carry the story (the mechanism, the real footage, the reveal) should be the long ones,")
    print("  with held time; setup beats short. Compare with the brief's Pacing plan.")


if __name__ == "__main__":
    main()
