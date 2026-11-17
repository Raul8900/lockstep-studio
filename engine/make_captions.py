"""Draft or check caption_phrases.json (how the burned-in captions are chunked).

  python3 engine/make_captions.py <video-dir>            check the existing file against the narration
  python3 engine/make_captions.py <video-dir> --draft    write a first draft (refuses to overwrite)
  python3 engine/make_captions.py <video-dir> --draft --force

caption_phrases.json is a flat list of phrases; joined together they must be the narration,
word for word, in order. The draft breaks at punctuation and keeps phrases to 1-4 words and
about 22 characters. Edit it by hand afterwards: keep a number with its unit, an adjective with
its noun, and never leave a one-syllable word alone on screen.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import need, project_dir  # noqa: E402

ROOT = project_dir()
draft, force = "--draft" in sys.argv, "--force" in sys.argv
words = json.load(open(need(ROOT / "data/words.json", "run: lockstep voice <video>")))
path = ROOT / "caption_phrases.json"
MAX_WORDS, MAX_CHARS = 4, 22
BREAK = re.compile(r"[.,;:!?—…]$")


def clean(w):
    return re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", w.lower())


def make_draft():
    phrases, cur, take = [], [], None
    for w in words:
        text = w["w"]
        too_long = cur and (len(cur) >= MAX_WORDS or len(" ".join(cur + [text])) > MAX_CHARS)
        if cur and (w["take"] != take or too_long):
            phrases.append(cur)
            cur = []
        cur.append(text)
        take = w["take"]
        if BREAK.search(text):
            phrases.append(cur)
            cur = []
    if cur:
        phrases.append(cur)
    # do not leave a single short word on its own: join it to a neighbour when the result still fits
    out = []
    for i, p in enumerate(phrases):
        prev_ok = out and not BREAK.search(out[-1][-1]) and len(" ".join(out[-1] + p)) <= MAX_CHARS + 6
        if len(p) == 1 and len(p[0]) <= 4 and prev_ok:
            out[-1] = out[-1] + p
        else:
            out.append(p)
    return [" ".join(p) for p in out]


def check(phrases):
    """Return None if the phrases cover the narration exactly, else a message naming the first mismatch."""
    i = 0
    for ph in phrases:
        for part in ph.split():
            if i >= len(words):
                return f'phrase "{ph}" runs past the end of the narration ({len(words)} words)'
            if clean(part) != clean(words[i]["w"]):
                return (f'mismatch at word {i + 1} (beat {words[i]["beat"]}, {words[i]["t0"]:.2f} s): '
                        f'caption has "{part}", narration has "{words[i]["w"]}"  (phrase "{ph}")')
            i += 1
    if i != len(words):
        return f'phrases cover {i} of {len(words)} words; next spoken word is "{words[i]["w"]}" (beat {words[i]["beat"]})'
    return None


if draft:
    if path.exists() and not force:
        sys.exit(f"{path} already exists (use --force to replace it)")
    phrases = make_draft()
    lines, row, take, wi = [], [], words[0]["take"] if words else None, 0
    for ph in phrases:                       # one line of the file per take, for easy hand-editing
        if words[wi]["take"] != take and row:
            lines.append(" " + ", ".join(json.dumps(x, ensure_ascii=False) for x in row))
            row, take = [], words[wi]["take"]
        row.append(ph)
        wi += len(ph.split())
    lines.append(" " + ", ".join(json.dumps(x, ensure_ascii=False) for x in row))
    path.write_text("[\n" + ",\n".join(lines) + "\n]\n", encoding="utf-8")
    print(f"{path.name}: drafted {len(phrases)} phrases for {len(words)} words — now edit the breaks by hand")
else:
    phrases = json.load(open(need(path, "run: lockstep captions <video> --draft")))
    err = check(phrases)
    if err:
        sys.exit("caption_phrases.json does not match the narration: " + err)
    longest = max(phrases, key=len, default="")
    many = [p for p in phrases if len(p.split()) > 5]
    print(f"caption_phrases.json: {len(phrases)} phrases cover all {len(words)} words; longest: \"{longest}\" ({len(longest)} chars)")
    if many:
        print("  more than 5 words (hard to read at a glance):", many)
