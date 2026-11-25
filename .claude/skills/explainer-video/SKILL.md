---
name: explainer-video
description: Produce a finished vertical explainer video (9:16, 1080x1920, 30 fps MP4 with voiceover, original music, sound design and word-synced burned-in captions) for Instagram Reels / YouTube Shorts on any topic, using this repository's lockstep engine. Each video tells a story in one world animated in code with three.js — objects, mechanisms and places built from shapes — with real photographs and film from free, licensed sources only where the real thing is the evidence, and a camera that never stops, planned in a creative brief before anything is recorded. Use when asked to make, create or produce an explainer video, short or reel about a topic ("make a video about X"), or to revise or re-render a video under videos/.
---

# Explainer video

You are the whole production team: researcher, writer, director, picture researcher, editor,
motion designer, sound designer and QA. The deliverable is a finished, playable MP4 in
`videos/<slug>/dist/` with its brief, script, sources, media credits and production report — not a
plan, not a script on its own.

What makes a short worth watching was learned from five successful science and history shorts,
frame by frame (reference/story.md, reference/shots.md):

- **A story, not a lecture.** A protagonist (a person, an object, or "you"), a mystery in the
  first line, an escalation, a twist or payoff that calls back to the first line. 190–210 spoken
  words a minute, no dead air.
- **One world built in code, one hero.** The animation is three.js, all code: a stage, a lab, a
  city, a cell, space — built from shapes — around one hero *thing* (the cell, the dish, the Moon,
  the coin) that acts out each line. No human figures made of shapes (they look cheap); real
  people appear in their real photographs. Nothing is downloaded or AI-generated for the animation. Abstract ideas become
  physical things (a dose is a stack of glowing blocks; a delay is a ring that counts).
- **Real pictures only as evidence.** A photograph or clip of the real person, place, event or
  document comes in when the real thing is the point — at most about one shot in three.
- **A camera that never stops.** Every shot fills the frame and moves: dollies, orbits and
  push-ins in 3D, pans across photographs, film that plays. There are no title cards, chapter
  bars, panels or diagrams on flat colour.
- **The narration is the clock.** The voice is recorded first; every cut, move, overlay, sound
  and caption is looked up from the moment a word is spoken. Nothing is timed by hand.

## Rules that do not bend

1. **Decide before you make.** No narration and no scene before `bin/lockstep brief <video>`
   passes: the story, the hook, the world and hero, and a shot plan that names the media for
   every shot.
2. **Animation is code; media only free, properly licensed, always credited.** Worlds, objects and
   places are built with three.js (`kit3d`), never downloaded or AI-generated; no human figures made of shapes. Pictures and film come from
   the free sources `lockstep find` searches (public domain, CC0, CC BY, the Pexels and Pixabay
   licences) or from files the person gives you with their licence (`lockstep media <v> add`).
   Never non-commercial or no-derivatives; share-alike only if the person accepts it for the whole
   video. Never paid services, never anything bought, never footage ripped from a platform, never
   AI-generated imagery passed off as real. Every file is in `media/credits.json`.
3. **When you cannot tell which picture is right, ask.** If two or three candidates are equally
   good, or none is clearly good enough, show the person the contact sheet
   (`out/find/<search>.jpg`, numbered) and ask them to choose — with the AskUserQuestion tool,
   naming the numbers and what each shows. Never fill a shot with a picture that does not show
   what the line says; say what is missing instead.
4. **Finished or honestly unfinished.** `bin/lockstep build` ends with a verdict table. Any
   `FAIL` means there is no finished video; say so and fix it. Never describe a video you have
   not rendered and looked at.
5. **Accuracy before polish.** Every number and strong claim, spoken or on screen, traces to
   `docs/sources.md`. A picture must show what the narration says it shows: check the file's
   description, date and place before using it as evidence. Never invent a figure.
6. **No typed timestamps.** Times come from `at(beat, 'word')` and offsets from it.
7. **Frames are pure functions of time.** No `Math.random()`, no `Date`, no state kept between
   frames: frames render out of order on several workers. Use `hash(n)` and `rng(seed)`.
8. **Look at your own frames.** Render stills and open them. Judge them as a viewer on a phone
   would: is the subject of the line on screen, big, and moving?

## Setup (once per machine or cloud session)

```bash
bin/lockstep doctor              # what is installed
bin/lockstep setup --with-asr    # install whatever is MISSING (3–5 min; needs PyPI and github.com)
bin/lockstep sources             # the media sources; Pexels and Pixabay need a free key each
```

Pexels and Pixabay hold most modern stock photos and footage. Their keys are free (pexels.com/api,
pixabay.com/api/docs) but belong to the person: if a topic needs modern footage and no key is set,
tell them how to add one (`PEXELS_API_KEY` / `PIXABAY_API_KEY` in the environment, or
`~/.config/lockstep/keys.json`) and carry on with the keyless sources.

## Workflow

| # | Step | You produce | Commands / reference |
|---|---|---|---|
| 0 | Scaffold | `videos/<slug>/` | `lockstep new <slug> "Title"` |
| 1 | Research | `docs/sources.md` | web search; primary sources first |
| 2 | **Story and shots** | `docs/creative_brief.md` | reference/story.md, reference/shots.md |
| 3 | **Media** | `media/` + `media/credits.json` | `find`, `take`, `cutout`, `look` → reference/media.md |
| 4 | Look | `style.json` | `look`, `style-check`, `brief` → reference/shots.md "The look" |
| 5 | Script | `script.py` | reference/story.md |
| 6 | Voice and captions | narration, word timings, `caption_phrases.json` | `voice`, `check-voice`, `words`, `captions` |
| 7 | Music | moods in `video.json` | reference/audio.md |
| 8 | Scenes | `scenes/sNN_<beat>.js` | `lint`, `still`, `sheet`, `preview` → reference/scene-api.md |
| 9 | Build | MP4 + SRT + QA + docs + credits | `lockstep build <slug>` |
| 10 | Review and fix | a video you would publish | reference/qa.md |
| 11 | Deliver | report, credits, retrospective | `lockstep report`, `lockstep media <slug> credits` |

### 0. Scaffold
`bin/lockstep new <slug> "Title"` copies the starter project: a runnable 15-second example (a NASA
photograph, a 3D Earth and Moon, Apollo film) whose script, scenes and media are there to be
replaced. Its brief is blank and it has no `style.json`.

### 1. Research
Search before deciding anything. Prefer the organisation that owns the fact. Record each source
and the exact claim it supports in `docs/sources.md`. While researching, collect the **story**:
the people, the dates, the place, the accident, the number that sounds wrong — and note what
pictures of them exist (an archive photograph of the lab, film of the launch). The best angle is
often the one with the best pictures.

### 2. Story and shots — the brief
Write `docs/creative_brief.md` (reference/story.md, then reference/shots.md): audience and promise,
five candidate angles and the one kept, the story with its beats, three hooks, the world and the
hero, the shot plan (one line per beat: what fills the frame, the camera move, the overlay, and
the media search that will fill it), the look, the sound, and what would make it fail.

### 3. Media
For every shot in the plan (reference/media.md):
```bash
bin/lockstep find <slug> photo "Alexander Fleming laboratory"     # every source at once -> out/find/<search>.jpg
bin/lockstep take <slug> last 3 --as fleming-lab                   # candidate 3 -> media/fleming-lab.jpg + credit
bin/lockstep find <slug> video "petri dish bacteria"               # film: wikimedia, nasa, archive (+ pexels, pixabay with keys)
bin/lockstep find <slug> model "microscope"                        # a realistic prop, if code will not do: poly haven, khronos
bin/lockstep cutout <slug> fleming-lab                             # the person without the room -> media/fleming-lab.cut.png
bin/lockstep look <slug>                                           # everything taken, through the grade -> out/look.jpg
```
Open every contact sheet. Read the titles and licences on it. Take the picture that shows what
the line says, at the size the shot needs (a full-frame push-in wants at least 1500 px on the
short side). When candidates are close or all weak, **ask the person** (rule 3). Record in the
brief which shots you asked about and any gap no free source could fill.

### 4. Look
`style.json` decides what is not the picture: the colour grade every photograph, clip and render
gets (so archive photos, stock film and 3D read as one film), the captions, the overlay colours and
fonts, the default cut. Small is fine — `{"name": "…", "grade": {…}}` — but it must be decided:
check it on the real media with `lockstep look <slug>`, then `lockstep brief <slug>` must pass.

### 5. Script
Write `script.py` from the brief's story (reference/story.md): short sentences, one idea each, the
hook in the first line, 190–210 words a minute (`SPEED` 1.1–1.2), short pauses. Read it aloud in
your head against the shot plan: every line must have a picture.

### 6. Voice and captions
```bash
bin/lockstep voice <slug>             # records with af_heart (or af_bella): the two best-graded voices
bin/lockstep check-voice <slug>       # transcribes it back; lists every word heard differently
bin/lockstep words <slug>             # every word with its start time — your cue sheet
bin/lockstep captions <slug> --draft  # then edit: 2–4 words a phrase, a number with its unit
```
Only the best voices are offered (`lockstep voice <slug> list`); the others sound synthetic.
Fix mispronunciations with a phoneme override and re-record.

### 7. Music
A licensed track by default: `lockstep find <slug> music "suspenseful building"` searches Kevin
MacLeod's 1,400 tracks on Incompetech (CC BY 4.0) by feel, instruments and description, with tempo
and length on the sheet; take one and name it in `video.json`: `"music": { "track": "name", "start": 0 }`.
Choose by the story's arc and the track's length (longer than the video; it loops otherwise). The
mixer levels it against the voice and ducks it under speech. Without a track the engine synthesises
a score from moods per beat (reference/audio.md).

### 8. Scenes
One file per beat, drawing the shot plan (reference/scene-api.md has the whole API):
```js
const lab = useImage('fleming-lab');                    // setup: declare the media
addScene('discovery', (ctx, t) => {
  const pic = photo(ctx, lab, tw(t, c.start, c.end), { move: 'in', focus: [0.6, 0.45] });   // full frame, moving
  circleIt(ctx, ...pic.at(0.62, 0.58), 120, 90, { p: tw(t, c.mould, c.mould + 0.6) });       // pinned to the picture
});
```
3D worlds built in code — a stage, shapes, labels, lines, arrows, crowds of
instances (`world3d` + the kit: `w.studio`, `w.box`, `w.instances` …, `view3d`, `camPath`); real
pictures as evidence (`photo`, `photoPath`, `film`, `cutout`, or `w.picture` on a board inside the
world); several shots inside one beat
(`shots`), and overlays that read on any picture (`bigNumber`, `ringGauge`, `pointer`, `circleIt`,
`arrowTo`, `spotlight`, `stamp`, `nameTag`). Look at every scene as soon as it draws:
```bash
bin/lockstep lint <slug>                          # cues, sounds, media names and licences, determinism; where text lands
bin/lockstep sheet <slug> 1s 2.5s 4s 6s 8s        # stills tiled into out/sheet.jpg — open it
bin/lockstep still <slug> --safe 6s               # one full frame with the platform's keep-out zones shaded
```
Let the person watch it take shape: start `bin/lockstep preview <slug>` in the background and
tell them the address it prints (and report the port with `report_preview_port` in a cloud
session). It plays with the narration, scrubs, and reloads when a file is saved.

### 9. Build
```bash
bin/lockstep build <slug>
```
direction → captions → lint → meta → scan → audio → render → assemble → srt → validate → docs →
credits → report, then the verdict. Run it in the background and keep working.

### 10. Review and fix
Open `dist/contact_sheet.jpg` and both `dist/mobile_preview_*.jpg` and work through
reference/qa.md. After a fix, re-run only what changed:

| You changed | Re-run |
|---|---|
| Drawing code in one scene | `render <slug> --from A --to B` → `assemble` → `validate` |
| `style.json` | full `render` → `assemble` → `validate` |
| A sound cue, a mood | `meta` → `audio` → `assemble <slug> --remux` → `validate` |
| Caption chunking | `meta` → `render` → `assemble` → `validate` |
| The script | `voice` → `captions` → `meta` (every cue must still exist) → full `build` |

### 11. Deliver
Fill `docs/report_notes.md` truthfully, run `bin/lockstep report <slug>`, and give the person the
MP4, `dist/subtitles.srt`, the contact sheet, the brief, `docs/sources.md` and **`docs/credits.md`
— the credit lines the licences require, to paste into the video's description.** State the
measured facts and anything you could not check. Append a `## Retrospective` to the brief.

Media files and MP4s are not committed (`media/credits.json` is, so `lockstep media <slug>
restore` downloads everything again). Commit the project folder and hand the MP4 over directly.

## When the person does not say

- **Length:** the shortest that tells the story, usually 45–90 s. Hard maximum 180 s.
- **Topic angle, world, look, voice, music:** decided in the brief, from the topic.
- **Language:** English narration.

What the person does say overrides all of this. Ask a question only when the topic is ambiguous
or when choosing between pictures (rule 3); otherwise decide, proceed and note the decision.

## Files in a video project

```
videos/<slug>/
  docs/creative_brief.md the story, the world, the shot plan (written before anything is recorded)
  media/                 photographs, film, models, skies (git-ignored) + credits.json (committed)
  style.json             the grade, captions, overlay colours and fonts, default cut
  video.json             title, output name, a mood per beat, music settings
  script.py              narration: BEATS -> takes; HIGHLIGHT key words
  caption_phrases.json   caption chunking
  scenes/sNN_<beat>.js   one scene per beat (the beat id is the scene id)
  components.js          optional: drawing code shared by this video's scenes
  storyboard.py          optional: sequences for docs/visual_storyboard.md
  docs/                  sources.md, report_notes.md (yours); credits.md and the rest generated
  data/ audio/ out/      generated
  dist/                  the MP4, subtitles.srt, contact sheet, mobile previews
```
