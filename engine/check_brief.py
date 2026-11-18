"""Gate: a video cannot be recorded or built until its creative direction is decided and written down.

  python3 engine/check_brief.py <video-dir>

Requires docs/creative_brief.md with every section written (no TODO left, no stubs) and a
style.json whose name the brief's Look section uses. The point is the order of work: decide the
story, the world it happens in and what fills every shot before writing narration or drawing a frame.
See .claude/skills/explainer-video/reference/story.md and reference/shots.md.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import project_dir  # noqa: E402

ROOT = project_dir()
# section heading -> minimum words of actual reasoning
SECTIONS = {
    "Audience and promise": 25,
    "Angle": 25,
    "Story": 60,
    "Hook": 40,
    "World and hero": 40,
    "Shot plan": 80,
    "Look": 25,
    "Sound and voice": 20,
    "What would make this fail": 30,
}
problems = []


def sections(text):
    """{heading: body} for every '## ' heading."""
    parts = re.split(r"^##\s+(?!#)(.+?)\s*$", text, flags=re.M)
    return {parts[i].strip(): parts[i + 1] for i in range(1, len(parts) - 1, 2)}


def find(secs, name):
    for h, body in secs.items():
        if h.lower().startswith(name.lower()):
            return body
    return None


brief = ROOT / "docs/creative_brief.md"
style = ROOT / "style.json"
if not brief.exists():
    problems.append("docs/creative_brief.md is missing (lockstep new writes a blank one to fill in)")
else:
    text = re.sub(r"<!--.*?-->", "", brief.read_text(encoding="utf-8"), flags=re.S)
    todo = len(re.findall(r"\bTODO\b", text))
    if todo:
        problems.append(f"docs/creative_brief.md still has {todo} TODO placeholder(s)")
    secs = sections(text)
    for name, min_words in SECTIONS.items():
        body = find(secs, name)
        if body is None:
            problems.append(f"no section '## {name}'")
            continue
        n = len(re.findall(r"[A-Za-z0-9']+", body))
        if n < min_words:
            problems.append(f"section '{name}' is a stub ({n} words; write at least {min_words} words of actual reasoning)")
    if style.exists():
        try:
            name = json.load(open(style, encoding="utf-8")).get("name", "")
        except json.JSONDecodeError as e:
            name = ""
            problems.append(f"style.json is not valid JSON: {e}")
        sbody = find(secs, "Look") or ""
        if name and name.lower() not in sbody.lower():
            problems.append(f"the brief's Look section does not name the look it chose: style.json is named '{name}'")
        if not name:
            problems.append("style.json has no \"name\"")
if not style.exists():
    problems.append("style.json is missing: decide this video's grade and captions (reference/look.md; lockstep look previews them on the media)")

if problems:
    print("creative direction is not done yet:")
    for p in problems:
        print("  -", p)
    print("see .claude/skills/explainer-video/reference/story.md and reference/shots.md")
    sys.exit(1)
print("creative brief and style.json are complete")
