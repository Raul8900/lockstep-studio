---
name: explainer-video
description: Produce a finished vertical explainer video (9:16, 1080x1920, 30 fps MP4 with voiceover, original music, sound design and word-synced burned-in captions) for Instagram Reels / YouTube Shorts on any topic, using this repository's lockstep engine. Use when asked to make, create or produce an explainer video, short or reel about a topic ("make a video like the GPU one, about X"), or to revise or re-render a video under videos/.
---

# Explainer video

You are the whole production team: researcher, scriptwriter, storyboard artist, motion designer,
sound designer, editor and QA. The deliverable is a finished, playable MP4 in
`videos/<slug>/dist/`, plus its script, storyboard, subtitles, sources and production report —
not a plan, not a script on its own.

The engine's one idea: **the narration is the clock.** The voice is recorded first; the voice
model reports when every word is spoken; every animation, sound and caption looks its time up
by spoken word. Nothing is timed by hand, so nothing can drift.

`videos/how-a-gpu-works/` is a complete 162-second production made this way. Read its
`script.py`, `storyboard.py` and two or three of its `scenes/` before writing your own — it is
the quality bar and the best source of working patterns.

## Rules that do not bend

1. **Finished or honestly unfinished.** `bin/lockstep build` ends with a verdict table. Any
   `FAIL` means there is no finished video; say so and fix it. Never describe a video you have
   not rendered and looked at.
2. **Accuracy before polish.** Research first (step 1). Every number and strong claim, spoken or
   on screen, traces to `docs/sources.md`. Name the product next to a product-specific number.
   Never invent a figure to fill a label; use a qualitative label instead.
3. **No typed timestamps.** Animation times come from `at(beat, 'word')`, offsets from those, and
   nothing else. If you are writing `t > 12.4`, stop.
4. **Frames are pure functions of time.** No `Math.random()`, no `Date`, no state kept between
   frames: frames render out of order on several workers. Use `hash(n)` and `rng(seed)`.
5. **Stay inside the safe zones** (reference/design.md). Diagrams in y 372–1210, x 70–1010;
   captions own y 1260–1440; platform buttons cover the right edge below y ≈ 900.
6. **Look at your own frames.** Render stills, open the image, and judge it as a viewer on a
   phone would. Most defects (collisions, empty frames, unreadable labels) are only visible there.
7. **Free and local only.** Voice, music and sound are generated on this machine. Do not call
   paid APIs, buy anything, or pull in third-party footage, music or images.

## Setup (once per machine or cloud session)

```bash
bin/lockstep doctor              # what is installed
bin/lockstep setup --with-asr    # install whatever is MISSING (3–5 min; needs PyPI and github.com)
```

`--with-asr` adds the speech-recognition models used to check the voice. Without them the
build still works but the intelligibility checks are reported as "not measured".

## Workflow

Work in this order. Each step has a reference file — read it when you reach the step.

| # | Step | You produce | Commands |
|---|---|---|---|
| 0 | Scaffold | `videos/<slug>/` | `bin/lockstep new <slug> "Title"` |
| 1 | Research | `docs/sources.md` | web search; primary sources first |
| 2 | Script | `script.py` | → reference/script.md |
| 3 | Voice | narration + word timings | `lockstep voice`, `check-voice`, `words` |
| 4 | Captions | `caption_phrases.json` | `lockstep captions <slug> --draft`, then edit |
| 5 | Chapters | `video.json` (names, moods) | → reference/audio.md |
| 6 | Storyboard | `storyboard.py` | plan every sequence before drawing |
| 7 | Scenes | `scenes/sNN_<beat>.js`, `components.js` | `still`, `sheet`, `scan` → reference/scene-api.md, reference/design.md |
| 8 | Build | MP4 + SRT + QA data + docs | `lockstep build <slug>` |
| 9 | Review and fix | a video you would publish | → reference/qa.md |
| 10 | Report and deliver | `docs/report_notes.md`, final report | `lockstep report <slug>` |

### 1. Research
Search before writing a word of script. Prefer the organisation that owns the fact (vendor
documentation, standards bodies, papers, official statistics). Record each source and the exact
claim it supports in `docs/sources.md`, including what you checked and rejected. Decide here
which simplifications are honest and write them down — the script must not need a lie to be clear.

### 2. Script
One beat per chapter, 6–10 beats, about 2.45 words per second of finished video
(≈ 390 words for 160 s). Hook in the first three seconds, one idea per beat, a payoff that
answers the hook. Details, pacing and the marker syntax: **reference/script.md**.

### 3. Voice
```bash
bin/lockstep voice <slug>          # records; prints the length of every beat
bin/lockstep check-voice <slug>    # transcribes it back; lists every word the recogniser heard differently
bin/lockstep words <slug>          # every word with its start time and its cue key
```
Fix mispronunciations with a phoneme override and re-record. Check the total length now: it is
set by the narration and nothing later can change it. Re-recording is deterministic — unchanged
text gives identical audio and timings.

### 4. Captions
`lockstep captions <slug> --draft` writes a first chunking; edit it by hand so each phrase is a
unit of meaning (1–4 words, number with its unit, no orphaned one-syllable word). The phrases
must spell the narration exactly; `lockstep captions <slug>` checks.

### 5. Chapters
In `video.json`, give every beat a short upper-case chapter name (≤ 16 characters) and a music
mood. The moods should trace an arc: quiet opening, build, a dark or tense turn, a full finale.

### 6. Storyboard
Before any drawing code, fill `storyboard.py`: split every beat into sequences of 3–8 seconds,
each with one visual idea, anchored to the spoken words that start and end it. For each: what is
on screen and where, how it moves, the camera, the colour meaning, on-screen text, the
transition out, the sound, and why the sequence exists. A 160 s video has 25–35 sequences. If a
sequence has no visual idea of its own, the script has a sentence that should be cut.

### 7. Scenes
One file per beat. Write a scene, then immediately look at it:
```bash
bin/lockstep meta <slug>                              # loads every scene; reports cue or syntax errors
bin/lockstep sheet <slug> 12s 13.5s 15s 17s 19s       # stills tiled into out/sheet.jpg — open it
bin/lockstep still <slug> --safe 15s                  # one full-size frame with the keep-out zones shaded
bin/lockstep scan <slug>                              # draws the whole timeline; reports errors and empty frames
```
Review a still every 1–2 seconds of each scene plus the moments just before and after each cue,
at full size where there is small text. API and patterns: **reference/scene-api.md**. Layout,
colour, type and motion rules: **reference/design.md**. Sound cues: **reference/audio.md**.

### 8. Build
```bash
bin/lockstep build <slug>
```
meta → scan → audio → render → assemble → srt → validate → docs → report, then the verdict.
A 160 s video takes roughly 15 minutes (render ≈ 2, encode ≈ 6, validation ≈ 5). Run it in the
background and keep working.

### 9. Review and fix
Open `dist/contact_sheet.jpg` and both `dist/mobile_preview_*.jpg`. Work through
**reference/qa.md**. After a fix, re-run only what changed:

| You changed | Re-run |
|---|---|
| Drawing code in one scene | `render <slug> --from A --to B` → `assemble` → `validate` |
| A sound cue (`sfx(...)`) or a mood | `meta` → `audio` → `assemble <slug> --remux` → `validate` |
| Caption chunking | `meta` → `render` (captions are burned in) → `assemble` → `validate` |
| The script | `voice` → `captions` → check every cue still exists (`meta`) → full `build` |

### 10. Report and deliver
Fill `docs/report_notes.md` truthfully (accuracy review, defects found and fixed, an honest
self-assessment, what could not be verified), run `bin/lockstep report <slug>`, and give the
user: the MP4, `dist/subtitles.srt`, the contact sheet, `docs/narration_script.md`,
`docs/visual_storyboard.md`, `docs/sources.md`, `docs/production_report.md`. State the measured
facts (length, resolution, loudness, sync) and anything you could not check.

MP4s are not committed (GitHub rejects files over 100 MB; `dist/*.mp4` is git-ignored). Commit
the project folder so the video can be rebuilt, and hand the MP4 to the user directly.

## Defaults when the user does not say

- Length 150–170 s (hard maximum 180 s; set `max_seconds` in `video.json` for another limit).
- Voice `af_heart`, speed 1.0. `bin/lockstep voice <slug> list` shows the alternatives.
- Dark charcoal style with the engine's colour language. Keep it unless asked: it is tuned for
  small screens and for the encoder.
- English narration. The voice model is English-only as installed.

Ask the user a question only if the topic itself is ambiguous. Otherwise decide, proceed, and
note the decision in the report.

## Files in a video project

```
videos/<slug>/
  video.json             title, HUD tag, output name, chapters (name + mood), optional mix levels
  script.py              narration: BEATS -> takes; HIGHLIGHT; optional delivery/pronunciation notes
  caption_phrases.json   caption chunking
  scenes/sNN_<beat>.js   one scene per beat (the beat id is the scene id)
  components.js          drawing code shared by this video's scenes
  storyboard.py          sequences for docs/visual_storyboard.md
  docs/                  sources.md, report_notes.md (written by you); the rest is generated
  data/                  generated: words.json, takes.json, timeline.json, validation.json, ...
  audio/  out/           generated, git-ignored
  dist/                  the MP4, subtitles.srt, contact sheet, mobile previews
```

Engine code lives in `engine/` and is shared by every video. Change it only for something every
video should get; a look that belongs to one topic goes in that video's `components.js`.
