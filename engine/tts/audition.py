"""Synthesize one take in isolation; never replaces a production's timing files."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from common import ENGINE, load_config, load_script, project_dir

ap = argparse.ArgumentParser()
ap.add_argument("project")
ap.add_argument("take", type=int)
ap.add_argument("voice", nargs="?")
ap.add_argument("speed", nargs="?", type=float)
args = ap.parse_args()
root = project_dir(args.project)
script = load_script(root)
takes = [(b, t) for b in script.BEATS for t in b["takes"]]
if not 0 <= args.take < len(takes):
    ap.error(f"take index must be 0–{len(takes)-1}")
subprocess.run([sys.executable, str(ENGINE / "check_brief.py"), str(root)], check=True)
beat, take = takes[args.take]
inputs = load_config(root).get('choices', {}).get('narration', {}).get('inputs', {})
voice = args.voice or inputs.get('voice', getattr(script, "VOICE", "af_heart"))
speed = args.speed or inputs.get('speed', getattr(script, "SPEED", 1.0))
out = root / "out/auditions" / f"take-{args.take:03d}-{voice}"
out.mkdir(parents=True, exist_ok=True)
(out / "video.json").write_text(json.dumps({"title": f"Take {args.take}"}))
(out / "script.py").write_text(f"VOICE={voice!r}\nSPEED={speed!r}\nLEAD_IN=0.1\nTAIL=0.4\nBEATS={ [dict(id=beat['id'], title=beat['title'], takes=[(take[0], .15)])]!r}\nHIGHLIGHT={getattr(script, 'HIGHLIGHT', {})!r}\n")
subprocess.run([sys.executable, str(ENGINE / "tts/synth.py"), str(out)], check=True)
print("Audition:", out / "audio/narration_24k.wav")
