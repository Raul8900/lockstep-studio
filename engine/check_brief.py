"""Gate: a video cannot be recorded or built until its creative direction is decided and written down.

  python3 engine/check_brief.py <video-dir>

Requires docs/creative_brief.md with every section written (no TODO left, no stubs), at least three
genuinely different directions compared, and a style.json designed for this video whose name the
brief's Style section uses. The point is the order of work: decide how this topic should be told
and how it should look before writing narration or drawing a frame.
See .claude/skills/explainer-video/reference/creative-direction.md.
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
    "Directions considered": 90,
    "Chosen direction": 40,
    "Hook": 40,
    "Story shape": 50,
    "Pacing": 25,
    "Visual world": 50,
    "Style": 40,
    "Sound": 25,
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
    body = find(secs, "Directions considered")
    if body is not None:
        subs = re.split(r"^###\s+(.+?)\s*$", body, flags=re.M)
        dirs = [(subs[i].strip(), len(re.findall(r"[A-Za-z0-9']+", subs[i + 1]))) for i in range(1, len(subs) - 1, 2)]
        if len(dirs) < 3:
            problems.append(f"'Directions considered' has {len(dirs)} direction(s): compare at least three genuinely different ones, each under its own ### heading")
        thin = [h for h, n in dirs if n < 30]
        if thin:
            problems.append(f"directions too thin to compare (under 30 words): {thin}")
    if style.exists():
        try:
            name = json.load(open(style, encoding="utf-8")).get("name", "")
        except json.JSONDecodeError as e:
            name = ""
            problems.append(f"style.json is not valid JSON: {e}")
        sbody = find(secs, "Style") or ""
        if name and name.lower() not in sbody.lower():
            problems.append(f"the brief's Style section does not mention the style it chose: style.json is named '{name}'")
        if not name:
            problems.append("style.json has no \"name\"")
if not style.exists():
    problems.append("style.json is missing: design this video's look (lockstep styles shows the library; lockstep tile previews a candidate)")

if problems:
    print("creative direction is not done yet:")
    for p in problems:
        print("  -", p)
    print("see .claude/skills/explainer-video/reference/creative-direction.md")
    sys.exit(1)
print("creative brief and style.json are complete")
