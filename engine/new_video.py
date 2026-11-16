"""Scaffold a new video project from templates/video.

  python3 engine/new_video.py <slug> ["Title"] [--into DIR] [--example]

Creates videos/<slug>/ (or DIR/<slug>/) from templates/video: a complete, runnable 18-second
video whose script, scenes and storyboard are examples to replace.

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

# short label for the top-right of the chapter bar (about 18 characters fit beside the chapter name)
tag = re.sub(r"[^A-Z0-9 ]+", "", slug.replace("-", " ").upper()).strip()
if len(tag) > 18:
    tag = tag[:18].rsplit(" ", 1)[0]

shutil.copytree(REPO / "templates/video", dest)
if not example:
    shutil.copy(REPO / "templates/creative_brief.md", dest / "docs/creative_brief.md")
    (dest / "style.json").unlink()
for p in dest.rglob("*"):
    if p.is_file() and p.suffix in (".json", ".py", ".md", ".js"):
        s = p.read_text(encoding="utf-8")
        s2 = s.replace("__TITLE__", title.replace('"', '\\"')).replace("__TAG__", tag).replace("__OUTPUT__", slug.replace("-", "_") + "_vertical")
        if s2 != s:
            p.write_text(s2, encoding="utf-8")

rel = dest.relative_to(REPO) if dest.is_relative_to(REPO) else dest
print(f"""created {rel}/

First decide how this topic should be told and how it should look; nothing is recorded until then.
  1. research the topic             -> docs/sources.md
  2. creative direction             -> docs/creative_brief.md (blank, every section to fill)
                                       style.json (lockstep styles · tile · palettes · fonts · icons)
  3. lockstep brief {slug}  -> confirms both are complete; voice and build refuse until it passes

The script, scenes, storyboard and captions in the folder belong to the template's example video
(about the timing rule this engine is built on): replace them once the brief is written.
""")
