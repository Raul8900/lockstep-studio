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
FIELDS = ["Objects on screen", "Position and size (1080 × 1920)", "Background", "Movement", "Timing and easing", "Camera",
          "Colour and emphasis", "Text overlays", "Transition out", "Sound", "Purpose"]
DEFAULT_COLOUR = ("Cyan #27E1FF = the subject and its core mechanism · Amber #FFA91E = numbers and the contrasting element · "
                  "Violet #A073FF = data and memory · Coral #FF5F70 = limits and negation · Mint #4DFFB5 = success · "
                  "White = the thing being talked about now.")


def cap_for(t0, t1):
    cs = [c for c in tl["caps"] if c["t0"] >= t0 - 0.02 and c["t0"] < t1 - 0.02]
    return " | ".join(c["text"] for c in cs) if cs else "—"


def storyboard_md(seq, colour):
    o = []
    o.append(f"# Visual Storyboard — “{TITLE}”\n")
    o.append(f"{len(seq)} sequences · {tl['dur']:.2f} s · 1080 × 1920 · 30 fps. Timestamps are taken from the recorded narration; "
             "the animation code reads the same word timings, so picture and voice cannot drift apart.\n")
    o.append("## Conventions that apply to every sequence\n")
    o.append("**Canvas and safe areas.** Designed natively for 9:16; nothing is cropped from a wider layout.\n\n"
             "| Zone | y range | Use |\n|---|---|---|\n"
             "| Top UI band | 0–270 | Backdrop only |\n"
             f"| Chapter bar | 286–340 | {len(tl['scenes'])}-segment progress bar (y 292) and chapter label (y 334) |\n"
             "| Diagram zone | 372–1210 | All essential graphics, x 70–1010 |\n"
             "| Caption band | 1250–1450 | Burned-in captions, centred on x 540, y 1350, max width 800 px |\n"
             "| Bottom UI band | 1470–1920 | Backdrop, perspective floor, non-essential spill only |\n\n"
             "Below y 900, numbers and names stay left of x ≈ 910, where both platforms stack their action buttons; only repeated or decorative elements extend further right.\n")
    o.append("**Backdrop.** Charcoal vertical gradient (#05080D → #090E17 → #04060A); three slow fog blobs (cyan, violet, deep cyan); "
             "a 60 px dot lattice drifting upward at 7 px/s; six faint vertical traces with pulses travelling top to bottom; "
             "a perspective floor grid below y 1500; vignette; a fixed, barely visible dither (about 1.5 code values) that prevents banding in the dark gradients.\n")
    o.append("**Colour language.** " + colour + "\n")
    o.append("**Type.** Inter Display 800–900 for headlines, Inter 500–700 for glosses, JetBrains Mono 600–800 for labels, code and counters. "
             "Smallest label 19–22 px; primary labels ≥ 24 px; headlines 54–250 px.\n")
    o.append("**Captions.** Inter Display ExtraBold 74 px, white with a 15 px near-black outline, 1–5 words per phrase ("
             + str(len(tl["caps"])) + " phrases, " + str(sum(1 for c in tl["caps"] if c["lines"] > 1)) + " of them two-line). "
             "Words not yet spoken sit at 44 % opacity; the spoken word scales to 107.5 %, lifts 5 px, and key terms take their semantic colour with a soft halo. "
             "Each phrase pops in over 0.14 s (ease-out-back). Position never changes.\n")
    o.append("**Light.** A two-stage bloom (soft-thresholded quarter- and eighth-resolution blurs added back) gives every bright stroke a glow; "
             "captions and the chapter bar are drawn after it so they stay crisp.\n")
    o.append("**Scene changes.** 0.84 s, ease-in-out-cubic, one of: zoom-in (dive into a point), zoom-out (pull back), pan-down / pan-up (camera travels), cross-fade. "
             "The incoming scene is already drawn and moving before the outgoing one has gone.\n")
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
    (OUT / "visual_storyboard.md").write_text(storyboard_md(seq, getattr(mod, "COLOUR_LANGUAGE", DEFAULT_COLOUR)), encoding="utf-8")
    gaps = [(seq[i][0], round(seq[i][2], 2), round(seq[i + 1][1], 2)) for i in range(len(seq) - 1) if abs(seq[i][2] - seq[i + 1][1]) > 0.01]
    print("docs/visual_storyboard.md:", len(seq), "sequences; continuity gaps:", gaps or "none")
    if seq and (abs(seq[0][1]) > 0.01 or abs(seq[-1][2] - tl["dur"]) > 0.05):
        print("  note: the storyboard does not span the whole video (0 →", round(tl["dur"], 2), ")")
else:
    print("no storyboard.py in the video folder — visual_storyboard.md not written")
