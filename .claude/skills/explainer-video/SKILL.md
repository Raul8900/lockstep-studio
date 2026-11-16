---
name: explainer-video
description: Produce a finished vertical explainer video (9:16, 1080x1920, 30 fps MP4 with voiceover, original music, sound design and word-synced burned-in captions) for Instagram Reels / YouTube Shorts on any topic, using this repository's lockstep engine. Each video gets its own story shape, pacing and visual style, decided from the topic in a creative brief before anything is recorded. Use when asked to make, create or produce an explainer video, short or reel about a topic ("make a video like the GPU one, about X"), or to revise or re-render a video under videos/.
---

# Explainer video

You are the whole production team: researcher, creative director, scriptwriter, art director,
storyboard artist, motion designer, sound designer, editor and QA. The deliverable is a finished,
playable MP4 in `videos/<slug>/dist/`, plus its brief, script, storyboard, subtitles, sources and
production report — not a plan, not a script on its own.

Two ideas run the system:

- **Every video is directed.** How a topic is told — its story shape, pacing, visual world and
  look — is decided from the topic, the audience and the angle, by comparing real alternatives,
  before a word is recorded. Nothing about the presentation is a default. The decisions are
  written in `docs/creative_brief.md` and `style.json`, and the tools refuse to record or build
  until they exist.
- **The narration is the clock.** The voice is recorded first; the voice model reports when every
  word is spoken; every animation, sound and caption looks its time up by spoken word. Nothing is
  timed by hand, so nothing can drift.

`videos/how-a-gpu-works/` is a complete 162-second production: study its scenes for technique
(timing, transitions, sound cues, 2.5D). It is **not** a model for presentation — it was made
before creative direction existed, in the engine's only look at the time, and was judged accurate
but robotic, too long and too slow. Its brief (written afterwards) says what it should have done.

## Rules that do not bend

1. **Decide before you make.** No narration and no scene before `bin/lockstep brief <video>`
   passes. The brief compares at least three genuinely different directions; the look is derived
   from the topic and previewed against an alternative — never inherited from the last video or
   the engine's default.
2. **Finished or honestly unfinished.** `bin/lockstep build` ends with a verdict table. Any
   `FAIL` means there is no finished video; say so and fix it. Never describe a video you have
   not rendered and looked at.
3. **Accuracy before polish.** Research first. Every number and strong claim, spoken or on
   screen, traces to `docs/sources.md`. Name the product next to a product-specific number. Never
   invent a figure to fill a label; use a qualitative label instead. A metaphor must be true to
   the mechanism, and the video says where it breaks.
4. **No typed timestamps.** Animation times come from `at(beat, 'word')`, offsets from those, and
   nothing else. If you are writing `t > 12.4`, stop.
5. **Frames are pure functions of time.** No `Math.random()`, no `Date`, no state kept between
   frames: frames render out of order on several workers. Use `hash(n)` and `rng(seed)`.
6. **Colours by role, never by value.** Scenes use `COL.subject`, `COL.accent`, `COL.data`,
   `COL.alert`, `COL.good`, `COL.ink`; the style decides what they look like.
7. **Stay inside the safe zones** (reference/design.md). Diagrams in y 372–1210, x 70–1010;
   captions own the band around y 1350; platform buttons cover the right edge below y ≈ 900.
8. **Look at your own frames.** Render stills, open the image, and judge it as a viewer on a
   phone would. Most defects (collisions, empty frames, unreadable labels, a look that does not
   fit) are only visible there.
9. **Free and local only.** Voice, music and sound are generated on this machine; fonts, icons,
   palettes and illustrations come from the open-licence library in `assets/`. Do not call paid
   APIs, buy anything, or pull in third-party footage, music, images or a creator's signature style.

## Setup (once per machine or cloud session)

```bash
bin/lockstep doctor              # what is installed
bin/lockstep setup --with-asr    # install whatever is MISSING (3–5 min; needs PyPI and github.com)
```

`--with-asr` adds the speech-recognition models used to check the voice. Without them the
build still works but the intelligibility checks are reported as "not measured".

## Workflow

Work in this order. Each step has a reference file — read it when you reach the step.

| # | Step | You produce | Commands / reference |
|---|---|---|---|
| 0 | Scaffold | `videos/<slug>/` | `bin/lockstep new <slug> "Title"` |
| 1 | Research | `docs/sources.md` | web search; primary sources first |
| 2 | **Creative direction** | `docs/creative_brief.md`, `style.json` | `lockstep styles · tile · palettes · fonts · icons · art · brief` → reference/creative-direction.md, story-formats.md, art-direction.md |
| 3 | Script | `script.py` in the chosen shape and pacing | → reference/script.md |
| 4 | Voice | narration + word timings | `lockstep voice`, `check-voice`, `words` |
| 5 | Captions | `caption_phrases.json` | `lockstep captions <slug> --draft`, then edit |
| 6 | Chapters and music | `video.json` (names, moods, `music`) | → reference/audio.md |
| 7 | Storyboard | `storyboard.py` | plan every sequence before drawing |
| 8 | Scenes | `scenes/sNN_<beat>.js`, `components.js` | `still`, `sheet`, `scan`, `art-sheet` → reference/scene-api.md, illustration.md, design.md |
| 9 | Build | MP4 + SRT + QA data + docs | `lockstep build <slug>` |
| 10 | Review and fix | a video you would publish | → reference/qa.md |
| 11 | Report, deliver, learn | report, retrospective, library | `lockstep report`, `save-style` |

### 0. Scaffold
`bin/lockstep new <slug> "Title"` copies the starter project. Its script, scenes and storyboard are
a runnable example to replace; its brief is blank and it has no `style.json` yet.

### 1. Research
Search before deciding anything. Prefer the organisation that owns the fact (vendor documentation,
standards bodies, papers, official statistics). Record each source and the exact claim it supports
in `docs/sources.md`, including what you checked and rejected. Also find out **how this topic is
usually explained** in short videos (titles, descriptions, write-ups — no downloading), so the
direction can avoid or subvert the default treatment.

### 2. Creative direction
The step that decides whether the video is memorable. Give it as much time as the script. Follow
reference/creative-direction.md and write each decision into `docs/creative_brief.md`:
audience and promise, angle (from five candidates), **three genuinely different directions**,
the choice, three hooks, the story shape and beat map (reference/story-formats.md), pacing, the
visual world, the look, the sound, and what would make it fail.

Design the look from the topic (reference/art-direction.md): start from the topic's world and
medium, find the palette in it, choose a type voice, then preview two candidates side by side and
choose with your eyes:

```bash
bin/lockstep styles                                          # the library of looks so far, with previews
bin/lockstep palettes <slug> warm muted                      # palette ideas -> out/palettes.jpg
bin/lockstep fonts                                           # bundled typefaces and their character
bin/lockstep tile <slug> candidates/a.json candidates/b.json # -> out/style_tiles.jpg — open it
bin/lockstep style-check --style candidates/a.json           # legibility
bin/lockstep brief <slug>                                    # must pass before voice and build
```

`lockstep list` shows the looks of earlier videos: do not repeat the previous one unless the brief
argues for a series identity.

### 3. Script
Write the beats from the brief's beat map, in its pacing (reference/script.md for length tables,
markers, highlight words and caption chunking). Check the script against the beat map before
recording: drifting back to a generic "hook → contrast → mechanism → limits → payoff" arc is the
commonest way to lose the direction.

### 4. Voice
```bash
bin/lockstep voice <slug>          # records; prints the length of every beat
bin/lockstep check-voice <slug>    # transcribes it back; lists every word heard differently
bin/lockstep words <slug>          # every word with its start time and its cue key
```
Fix mispronunciations with a phoneme override and re-record. Check the total length now: it is set
by the narration and nothing later can change it. Re-recording is deterministic — unchanged text
gives identical audio and timings.

### 5. Captions
`lockstep captions <slug> --draft` writes a first chunking; edit it by hand so each phrase is a
unit of meaning (1–4 words, number with its unit, no orphaned one-syllable word). The phrases must
spell the narration exactly; `lockstep captions <slug>` checks.

### 6. Chapters and music
In `video.json`, give every beat a short chapter name (shown only if the style's progress bar has
labels), a mood per chapter tracing the brief's arc, and the `music` settings the brief chose
(tempo, key, instrument kit).

### 7. Storyboard
Before any drawing code, fill `storyboard.py`: split every beat into sequences of 3–8 seconds, each
with one visual idea, anchored to the spoken words that start and end it. For each: what is on
screen and where, how it moves, the camera, the colour roles, on-screen text, the transition out,
the sound, and why it exists. A 90 s video has 15–22 sequences. If a sequence has no visual idea
of its own, the script has a sentence that should be cut.

### 8. Scenes
One file per beat, drawn in the brief's visual world and the style's language (hand-drawn looks get
rough lines, poster looks get kinetic type and hard shadows — see "Make the scenes match the look"
in art-direction.md). Characters, animals and props come from the illustration set — find them
with `lockstep art <word>`, check them in the video's look with `lockstep art-sheet <slug> <names>`,
and animate them with the motion helpers (reference/illustration.md). Write a scene, then look at
it immediately:
```bash
bin/lockstep meta <slug>                              # loads every scene; reports cue or syntax errors
bin/lockstep sheet <slug> 12s 13.5s 15s 17s 19s       # stills tiled into out/sheet.jpg — open it
bin/lockstep still <slug> --safe 15s                  # one full-size frame with the keep-out zones shaded
bin/lockstep scan <slug>                              # draws the whole timeline; reports errors and empty frames
```
Review a still every 1–2 seconds of each scene plus the moments just before and after each cue,
at full size where there is small text.

### 9. Build
```bash
bin/lockstep build <slug>
```
direction check → meta → scan → audio → render → assemble → srt → validate → docs → report, then
the verdict. A 160 s video takes about 17 minutes (scan and audio ≈ 3, render ≈ 2, encode ≈ 6,
validation ≈ 6); a 90 s one about half that. Run it in the background and keep working.

### 10. Review and fix
Open `dist/contact_sheet.jpg` and both `dist/mobile_preview_*.jpg`. Work through
**reference/qa.md**, including whether the finished video still matches its brief. After a fix,
re-run only what changed:

| You changed | Re-run |
|---|---|
| Drawing code in one scene | `render <slug> --from A --to B` → `assemble` → `validate` |
| `style.json` | full `render` (every frame changes) → `assemble` → `validate` |
| A sound cue (`sfx(...)`), a mood or the `music` settings | `meta` → `audio` → `assemble <slug> --remux` → `validate` |
| Caption chunking | `meta` → `render` (captions are burned in) → `assemble` → `validate` |
| The script | `voice` → `captions` → check every cue still exists (`meta`) → full `build` |

### 11. Report, deliver, learn
Fill `docs/report_notes.md` truthfully (accuracy review, defects found and fixed, an honest
self-assessment, what could not be verified), run `bin/lockstep report <slug>`, and give the user:
the MP4, `dist/subtitles.srt`, the contact sheet, the creative brief, `docs/narration_script.md`,
`docs/visual_storyboard.md`, `docs/sources.md`, `docs/production_report.md`. State the measured
facts (length, resolution, loudness, sync) and anything you could not check.

Then let the system learn from the video: append a `## Retrospective` to the brief (what worked,
what did not, what to change next time), and if the look could serve other topics, add it to the
library with `bin/lockstep save-style <slug> <name>`. Later videos read both.

MP4s are not committed (GitHub rejects files over 100 MB; `dist/*.mp4` is git-ignored). Commit
the project folder so the video can be rebuilt, and hand the MP4 to the user directly.

## When the user does not say

- **Length:** decided in the brief — the shortest that delivers the angle, usually 60–100 s.
  Hard maximum 180 s (set `max_seconds` in `video.json` for another limit).
- **Pacing:** decided in the brief; *brisk* is the usual choice (story-formats.md).
- **Look, story shape, voice and music:** decided in the brief, from the topic. Never a default.
- **Language:** English narration; the voice model is English-only as installed.

What the user does say overrides all of this — a length, a look they name, a tone, an audience.
Record it in the brief. Ask a question only if the topic itself is ambiguous; otherwise decide,
proceed, and note the decision.

## Files in a video project

```
videos/<slug>/
  docs/creative_brief.md the creative direction (written before anything is recorded)
  style.json             this video's look: palette, fonts, backdrop, captions, progress bar, shapes, transitions
  video.json             title, tag, output name, chapters (name + mood), music settings, optional mix levels
  script.py              narration: BEATS -> takes; HIGHLIGHT; optional delivery/pronunciation notes
  caption_phrases.json   caption chunking
  scenes/sNN_<beat>.js   one scene per beat (the beat id is the scene id)
  components.js          drawing code shared by this video's scenes; optional custom backdrop
  storyboard.py          sequences for docs/visual_storyboard.md
  candidates/            optional: style candidates compared during creative direction
  docs/                  sources.md, report_notes.md (written by you); the rest is generated
  data/                  generated: words.json, takes.json, timeline.json, validation.json, ...
  audio/  out/           generated, git-ignored
  dist/                  the MP4, subtitles.srt, contact sheet, mobile previews
```

Shared by every video: `engine/` (change it only for something every video should get), `styles/`
(the library of looks), `assets/` (open-licence fonts, icons, palettes and illustrations;
`scripts/fetch_assets.py` rebuilds or extends it). A look or drawing that belongs to one topic goes in that video's
`style.json` and `components.js`.
