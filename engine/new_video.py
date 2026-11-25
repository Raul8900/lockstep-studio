"""Scaffold a new video project from templates/video.

  python3 engine/new_video.py <slug> ["Title"] [--into DIR] [--example]

Creates videos/<slug>/ (or DIR/<slug>/) from templates/video: a complete, runnable 17-second
video (a NASA photograph, a 3D Earth and Moon, Apollo film) whose script, scenes, media and
storyboard are examples to replace.

The new video starts with a blank docs/creative_brief.md and no style.json: its creative
direction has to be decided before `lockstep voice` and `lockstep build` will run.
--example keeps the template's own filled brief and style (used by scripts/selftest.sh).
"""
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO  # noqa: E402

args = sys.argv[1:]
example = "--example" in args
if example:
    args.remove("--example")
into = REPO / "videos"
if "--into" in args:
    i = args.index("--into")
    into = Path(args[i + 1]).resolve()
    del args[i:i + 2]
if not args:
    sys.exit('usage: lockstep new <slug> ["Title"]      e.g.  lockstep new how-vaccines-work "How Do Vaccines Actually Work?"')
slug = args[0]
if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,60}", slug):
    sys.exit("slug must be lower-case letters, digits and hyphens, e.g. how-vaccines-work")
title = args[1] if len(args) > 1 else slug.replace("-", " ").title()
dest = into / slug
if dest.exists():
    sys.exit(f"{dest} already exists")

shutil.copytree(REPO / "templates/video", dest, ignore=shutil.ignore_patterns("out", "audio", "data"))
if not example:
    shutil.copy(REPO / "templates/creative_brief.md", dest / "docs/creative_brief.md")
    (dest / "style.json").unlink()
for p in dest.rglob("*"):
    if p.is_file() and p.suffix in (".json", ".py", ".md", ".js"):
        s = p.read_text(encoding="utf-8")
        s2 = s.replace("__TITLE__", title.replace('"', '\\"')).replace("__OUTPUT__", slug.replace("-", "_") + "_vertical")
        if s2 != s:
            p.write_text(s2, encoding="utf-8")

rel = dest.relative_to(REPO) if dest.is_relative_to(REPO) else dest
print(f"""created {rel}/

Decide the story and the world before anything is recorded:
  1. research the topic                -> docs/sources.md
  2. story, hook, world, shot plan     -> docs/creative_brief.md (blank: every section to fill)
  3. the media for every shot          -> lockstep find {slug} photo "…"  ·  lockstep take {slug} last <n> --as <name>
                                          (when two candidates are equally good, show the sheet and ask)
  4. the look                          -> style.json  ·  lockstep look {slug}
  5. lockstep brief {slug}             -> confirms; voice and build refuse until it passes

The script, scenes, media and captions in the folder belong to the template's example video (the Moon
drifting away): replace them once the brief is written. Remove the example's files from media/ and its
entries from media/credits.json when they are no longer used (lockstep lint flags media without credits).
""")
