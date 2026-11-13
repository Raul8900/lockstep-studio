"""Scaffold a new video project from templates/video.

  python3 engine/new_video.py <slug> ["Title"] [--into DIR]

Creates videos/<slug>/ (or DIR/<slug>/). The template is a complete, runnable 20-second
video, so the pipeline can be exercised before any of it is rewritten.
"""
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import REPO  # noqa: E402

args = sys.argv[1:]
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

# short label for the top-right of the chapter bar (about 18 characters fit beside the chapter name)
tag = re.sub(r"[^A-Z0-9 ]+", "", slug.replace("-", " ").upper()).strip()
if len(tag) > 18:
    tag = tag[:18].rsplit(" ", 1)[0]

shutil.copytree(REPO / "templates/video", dest)
for p in dest.rglob("*"):
    if p.is_file() and p.suffix in (".json", ".py", ".md", ".js"):
        s = p.read_text(encoding="utf-8")
        s2 = s.replace("__TITLE__", title.replace('"', '\\"')).replace("__TAG__", tag).replace("__OUTPUT__", slug.replace("-", "_") + "_vertical")
        if s2 != s:
            p.write_text(s2, encoding="utf-8")

rel = dest.relative_to(REPO) if dest.is_relative_to(REPO) else dest
print(f"""created {rel}/

  video.json             title, chapter names, music mood per chapter
  script.py              the narration (beats -> takes), caption highlight words
  caption_phrases.json   how the burned-in captions are chunked
  scenes/sNN_<beat>.js   one animated scene per beat
  components.js          drawing code shared by several scenes of this video
  storyboard.py          per-sequence notes for docs/visual_storyboard.md
  docs/sources.md        research and citations      docs/report_notes.md   accuracy review, QA notes

The template is runnable as it stands:
  bin/lockstep voice {slug} && bin/lockstep build {slug}
""")
