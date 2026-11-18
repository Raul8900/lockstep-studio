"""Write docs/narration_script.md and docs/visual_storyboard.md for a video.

  python3 engine/make_docs.py <video-dir>

Every timestamp is looked up from data/words.json and data/timeline.json, so the
documents always match the rendered video. The prose comes from the video's own files:

  script.py      DIRECTIONS (per-beat delivery notes), PRONUNCIATION, ACCURACY_NOTES  (all optional)
  storyboard.py  sequences(at, S, dur) -> list of sequence tuples; COLOUR_LANGUAGE     (optional)
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load_config, load_module, load_script, need, project_dir  # noqa: E402

ROOT = project_dir()
CFG = load_config(ROOT)
SCRIPT = load_script(ROOT)
OUT = ROOT / "docs"
OUT.mkdir(exist_ok=True)
words = json.load(open(need(ROOT / "data/words.json", "run: lockstep voice <video>")))
takes_doc = json.load(open(ROOT / "data/takes.json"))
takes, beats, meta = takes_doc["takes"], takes_doc["beats"], takes_doc["meta"]
tl = json.load(open(need(ROOT / "data/timeline.json", "run: lockstep meta <video>")))
scenes = {s["id"]: s for s in tl["scenes"]}
TITLE = CFG.get("title", ROOT.name)
CHAPTER = {c["id"]: c.get("name", c["id"]) for c in CFG.get("chapters", [])}


def clean(w):
    return re.sub(r"^[^a-z0-9]+|[^a-z0-9]+$", "", w.lower())


def at(beat, word, nth=1, edge="t0"):
    n = 0
    for w in words:
        if w["beat"] == beat and clean(w["w"]) == word:
            n += 1
            if n == nth:
                return w[edge]
    raise KeyError(f"storyboard cue not found: {beat}/{word}#{nth}")


def tc(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"


def said(t0, t1):
    ws = [w["w"] for w in words if w["t0"] >= t0 - 0.02 and w["t0"] < t1 - 0.02]
    return " ".join(ws) if ws else "(no narration)"


# ------------------------------------------------------------------ narration
def narration_md():
    directions = getattr(SCRIPT, "DIRECTIONS", {})
    pron = getattr(SCRIPT, "PRONUNCIATION", [])
    notes = getattr(SCRIPT, "ACCURACY_NOTES", [])
    out = []
    out.append(f"# Narration Script — “{TITLE}”\n")
    speech = sum(t["t1"] - t["t0"] for t in takes)
    out.append(f"**Final recorded length:** {meta['duration']:.2f} s (speech ends at {meta['speech_end']:.2f} s, then a {meta['duration'] - meta['speech_end']:.1f} s end card)  \n"
               f"**Word count:** {len(words)} spoken words · **Average pace:** {len(words) / speech * 60:.0f} wpm while speaking, "
               f"{len(words) / meta['speech_end'] * 60:.0f} wpm overall  \n"
               f"**Voice:** Kokoro-82M neural TTS (Apache-2.0), voice `{meta['voice']}`, speed {meta['speed']:.2f}, synthesised locally  \n"
               "**Timing source:** every timestamp below is measured from the recorded audio "
               "(phoneme durations reported by the voice model, 25 ms resolution), not estimated from word counts.\n")
    out.append("Legend: **bold** = stressed / on-screen highlighted term · `‖ 0.3 s` = pause after the line · "
               "an em dash or ellipsis inside a line is a short breath, not a full stop.\n")
    out.append("---\n")
    for bi, b in enumerate(beats):
        bt = [t for t in takes if t["beat"] == b["id"]]
        out.append(f"## {bi + 1}. {CHAPTER.get(b['id'], b['title'])}  ·  {tc(b['t0'])} – {tc(b['t1'])}  ({b['t1'] - b['t0']:.1f} s of speech)\n")
        if directions.get(b["id"]):
            out.append(f"*Direction:* {directions[b['id']]}\n")
        out.append("| # | Start | End | Dur | Line | Pause after |")
        out.append("|---|---|---|---|---|---|")
        for t in bt:
            ws = [w for w in words if w["take"] == t["take"]]
            line = " ".join(f"**{w['w']}**" if w["cls"] else w["w"] for w in ws)
            line = re.sub(r"\*\* \*\*", " ", line)
            nxt = next((x for x in takes if x["take"] == t["take"] + 1), None)
            pause = f"‖ {nxt['t0'] - t['t1']:.2f} s" if nxt else "‖ end card"
            out.append(f"| {t['take'] + 1} | {tc(t['t0'])} | {tc(t['t1'])} | {t['t1'] - t['t0']:.2f} s | {line} | {pause} |")
        out.append("")
    out.append("---\n")
    if pron:
        out.append("## Pronunciation guide\n")
        out.append("| Term | Say it as | Note |")
        out.append("|---|---|---|")
        for a, b, c in pron:
            out.append(f"| {a} | {b} | {c} |")
        out.append("")
    out.append("## Plain reading copy\n")
    for b in beats:
        out.append(f"**{CHAPTER.get(b['id'], b['title'])}** — " + " ".join(t["text"] for t in takes if t["beat"] == b["id"]) + "\n")
    if notes:
        out.append("## Accuracy notes on the wording\n")
        out.append("\n".join("- " + n for n in notes) + "\n")
    return "\n".join(out)


# ------------------------------------------------------------------ storyboard
FIELDS = ["What fills the frame", "Media", "Camera", "Overlays", "Timing", "Transition out", "Sound", "Purpose"]
ROLE_MEANING = [("subject", "the subject"), ("accent", "numbers and the thing to look at"),
                ("data", "the secondary family"), ("alert", "danger, limits and negation"), ("good", "success")]
HIGHLIGHT_DESC = {"color": "the spoken key word takes the key colour, scales up slightly and lifts",
                  "box": "the spoken word sits on a filled box",
                  "underline": "the spoken word takes its colour and an underline draws in beneath it"}


def style_info():
    st = tl.get("style") or {}
    sj = ROOT / "style.json"
    about = json.load(open(sj, encoding="utf-8")).get("about", "") if sj.exists() else ""
    return st, about


def default_colour(st):
    pal = st.get("palette") or {}
    if not pal:
        return "Engine default palette."
    return " · ".join(f"{r.capitalize()} {pal[r]} = {m}" for r, m in ROLE_MEANING) + f" · Ink {pal.get('ink')} = the thing being talked about now."


def cap_for(t0, t1):
    cs = [c for c in tl["caps"] if c["t0"] >= t0 - 0.02 and c["t0"] < t1 - 0.02]
    return " | ".join(c["text"] for c in cs) if cs else "—"


def storyboard_md(seq, colour):
    o = []
    o.append(f"# Visual Storyboard — “{TITLE}”\n")
    o.append(f"{len(seq)} sequences · {tl['dur']:.2f} s · 1080 × 1920 · 30 fps. The look, story shape and pacing were decided in docs/creative_brief.md. Timestamps are taken from the recorded narration; "
             "the animation code reads the same word timings, so picture and voice cannot drift apart.\n")
    o.append("## Conventions that apply to every sequence\n")
    cst = (tl.get("style") or {}).get("captions", {})
    o.append("**Canvas.** 1080 × 1920, designed for 9:16. Every shot fills the frame — a photograph, a film clip or a 3D world — "
             "and the camera keeps moving through it. Essential text stays inside x 70–1010, y 270–1470 and left of x 950 below y 1000, "
             "clear of the platform's own interface.\n")
    st, about = style_info()
    fonts, caps_st = st.get("fonts", {}), st.get("captions", {})
    if st:
        g = st.get("grade") or {}
        o.append(f"**Look.** `{st.get('name')}`" + (f" — {about}" if about else "") + ". Every picture, clip and render gets one grade: "
                 + ", ".join(f"{k} {v}" for k, v in g.items() if v not in (None, 0) or k in ("contrast", "saturate")) + ".\n")
    o.append("**Colour language (overlays).** " + colour + "\n")
    if fonts:
        o.append(f"**Type.** {fonts.get('disp')} for numbers, stamps and names; {fonts.get('ui')} for small print.\n")
    if caps_st:
        o.append(f"**Captions.** {caps_st.get('family')} {caps_st.get('weight')}, {caps_st.get('size')} px"
                 + (", upper case" if caps_st.get("case") == "upper" else "") + f", centred on y {caps_st.get('y')}, two to four words at a time ("
                 + str(len(tl["caps"])) + " phrases); " + HIGHLIGHT_DESC.get(caps_st.get("highlight"), "") + ".\n")
    media = tl.get("media") or []
    if media:
        cred_path = ROOT / "media/credits.json"
        cred = json.load(open(cred_path, encoding="utf-8")) if cred_path.exists() else {}
        o.append("**Media.** " + "; ".join(f"`{m['name']}` ({m['kind']}{', cut out' if m.get('cutout') else ''}: “{cred.get(m['name'], {}).get('title', m['name'])}”, "
                                          f"{cred.get(m['name'], {}).get('licence', '?')})" for m in media) + ". Credits: docs/credits.md.\n")
    if tl.get("worlds"):
        o.append(f"**3D.** {tl['worlds']} world(s) rendered with three.js; models and skies listed under Media.\n")
    tr = st.get("transition") or {}
    if tr:
        o.append(f"**Scene changes.** default `{tr.get('default')}` ({tr.get('duration')} s); cuts inside a scene are shots, not transitions.\n")
    o.append("---\n")
    for i, q in enumerate(seq):
        title, t0, t1 = q[0], q[1], q[2]
        o.append(f"## {i + 1:02d} · {title}\n")
        o.append(f"**Time:** {tc(t0)} → {tc(t1)}  ({t1 - t0:.2f} s)  \n**Narration:** “{said(t0, t1)}”  \n**Caption phrases:** {cap_for(t0, t1)}\n")
        o.append("| | |\n|---|---|")
        for name, val in zip(FIELDS, q[3:]):
            o.append(f"| **{name}** | {val} |")
        o.append("")
    return "\n".join(o)


(OUT / "narration_script.md").write_text(narration_md(), encoding="utf-8")
print("docs/narration_script.md:", len(words), "words in", len(takes), "takes")

sb = ROOT / "storyboard.py"
if sb.exists():
    mod = load_module(sb, "video_storyboard")
    seq = mod.sequences(at, lambda k: scenes[k]["t0"], tl["dur"])
    bad = [q[0] for q in seq if len(q) != 3 + len(FIELDS)]
    if bad:
        sys.exit(f"storyboard.py: these sequences do not have {3 + len(FIELDS)} items: {bad}")
    (OUT / "visual_storyboard.md").write_text(storyboard_md(seq, getattr(mod, "COLOUR_LANGUAGE", None) or default_colour(style_info()[0])), encoding="utf-8")
    gaps = [(seq[i][0], round(seq[i][2], 2), round(seq[i + 1][1], 2)) for i in range(len(seq) - 1) if abs(seq[i][2] - seq[i + 1][1]) > 0.01]
    print("docs/visual_storyboard.md:", len(seq), "sequences; continuity gaps:", gaps or "none")
    if seq and (abs(seq[0][1]) > 0.01 or abs(seq[-1][2] - tl["dur"]) > 0.05):
        print("  note: the storyboard does not span the whole video (0 →", round(tl["dur"], 2), ")")
else:
    print("no storyboard.py in the video folder — visual_storyboard.md not written")
