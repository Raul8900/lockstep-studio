# lockstep-studio

Turn a topic into a finished vertical short — a story animated in code with three.js, with real
photographs and archive film as evidence, a voiceover, licensed music, sound design and word-synced
captions — on one machine, with no paid services.

- **Output:** 1080 × 1920 (9:16), 30 fps, H.264 + AAC MP4, −14 LUFS, ready for Instagram Reels and
  YouTube Shorts, plus subtitles, sources, media credits and a QA report.
- **Real pictures, free and licensed:** `lockstep find` searches Wikimedia Commons, NASA, the Art
  Institute of Chicago, the Cleveland Museum of Art, Openverse, the Internet Archive, Poly Haven,
  Khronos and ambientCG at once (Pexels and Pixabay too, with free keys) and tiles the candidates
  into one numbered sheet; music comes from Kevin MacLeod's Incompetech catalogue (CC BY 4.0). Every file taken is credited with its source and licence; non-commercial
  and no-derivatives licences are refused. When two pictures are equally right, the agent asks you
  to choose.
- **Animation built in code:** worlds, objects and mechanisms are made with three.js — shapes,
  materials, light, text and particles posed from the narration's clock — nothing downloaded or
  AI-generated for the animation. Real photographs and film come in only as evidence (the real
  person, place or event). The camera keeps moving; overlays are few: a number that counts, a
  ring, a pointer, a circle, a stamp, a name.
- **Story first, paced per scene:** scripts follow what was learned from a frame-by-frame study of
  five successful science and history shorts — a mystery in the first line, a protagonist,
  escalation, a payoff that calls back to the start. The setup is brisk; the explanation and the
  real footage get time and held moments, without making the video longer.
- **The narration is the clock:** the voice is recorded first (Kokoro, only its two best-graded
  voices); every cut, camera move, overlay, sound and caption is timed from the moment a word is
  spoken.
- **Made to be driven by Claude Code:** the repository carries a skill that holds the whole
  production process. You ask for a video; it researches, writes the story, finds the pictures,
  records, animates, mixes, renders and checks it.

The reference production, [`videos/tacoma-narrows/`](videos/tacoma-narrows/), is a 65-second story
of the 1940 Tacoma Narrows Bridge collapse: the bridge, the shores and the wind built in code, a
chase camera riding the bouncing deck, a cross-section showing why it twisted, the real 1940 film
of the collapse as proof, and Kevin MacLeod's "Impending Boom" under it. Its brief records what its
review asked to change (the real film needed more time). An earlier, photo-led production,
[`videos/penicillin-accident/`](videos/penicillin-accident/), tells penicillin's discovery over
archive photographs with a 3D bacterium that bursts.

## Make a video

See [PROMPTING.md](PROMPTING.md) for a request template and examples.

Open the repository in Claude Code (terminal, desktop, or claude.ai/code) and ask:

> Make a short about how the Titanic's sister ship survived a torpedo.

The `explainer-video` skill takes it from there: research, the story and a shot plan in a creative
brief, the media for every shot (asking you when the choice is close), the look, script, voice,
scenes, sound, render and QA. Useful things to add: length, audience, tone, the moments that need
time, pictures you want used. To revise: "make the hook punchier", "hold the real footage longer",
"use a different photo for the lab".

The finished files land in `videos/<slug>/dist/` and `videos/<slug>/docs/` — including
`docs/credits.md`, the credit lines to paste into the video's description.

To watch it take shape: `bin/lockstep preview <slug>` serves the video at http://localhost:4173
with the narration — scrub through scenes, words and sound cues, step frame by frame — and reloads
itself whenever a scene or the look is saved.

## Setup

Needs Python 3.10+, Node 18+ with Playwright and Chromium, FFmpeg, and network access to PyPI,
GitHub release downloads and the media sources.

```bash
bin/lockstep setup --with-asr
```

```bash
bin/lockstep doctor
```

Optional free keys for modern stock photos and footage: `PEXELS_API_KEY` (pexels.com/api) and
`PIXABAY_API_KEY` (pixabay.com/api/docs), in the environment or in `~/.config/lockstep/keys.json`.

## Commands

```
bin/lockstep new <slug> ["Title"]           scaffold videos/<slug>/ from the template
bin/lockstep brief <video>                  is the story, world and shot plan written? (voice and build need it)
bin/lockstep sources                        the media sources and which need a key
bin/lockstep find <video> <kind> "<query>"  search them all: photo, video, model, hdri, texture, music -> numbered sheet
bin/lockstep take <video> last <n> --as x   download candidate n into media/, with its credit and licence
bin/lockstep media <video> [restore|credits|add …]   list, re-download, write credits, add your own file
bin/lockstep cutout <video> <name>          cut the subject of a photo out of its background
bin/lockstep look <video>                   every picture through the video's grade, with captions
bin/lockstep voice <video>                  record the narration, extract word timings
bin/lockstep check-voice <video>            transcribe it back and compare with the script
bin/lockstep words <video> [beat]           every spoken word with its time
bin/lockstep pacing <video>                 each beat's length, words a minute and held time
bin/lockstep captions <video>               check (or --draft) the caption chunking
bin/lockstep lint <video>                   check the scenes: cues, media and licences, where text lands
bin/lockstep still|sheet|scan <video>       review frames while designing
bin/lockstep preview <video>                play and scrub in a browser with sound; reloads on every save
bin/lockstep transitions <video>            scene transitions: built-ins and 223 GPU shaders
bin/lockstep build <video>                  everything from scenes to validated MP4, docs, credits and verdict
bin/lockstep help                           the full list
```

## Layout

```
bin/lockstep                 command-line entry point
engine/                      renderer (media, 3D, overlays), voice, score and mix, encode, media sourcing, QA
templates/video/             starter project copied by `lockstep new` (a 17-second NASA example)
templates/creative_brief.md  the blank brief every new video starts from
assets/                      open-licence fonts (33 families) and icons (2,359)
videos/<slug>/               one folder per video (brief, script, scenes, media credits, data, docs)
.claude/skills/explainer-video/   the production process Claude follows
scripts/setup.sh  selftest.sh
```

## What is and is not in git

Models, media files, rendered frames, audio stems and finished MP4s are ignored. Everything needed
to rebuild a video is committed — including `media/credits.json`, which says exactly where every
picture, clip and model came from:

```bash
bin/lockstep media tacoma-narrows restore
```

```bash
bin/lockstep voice tacoma-narrows
```

```bash
bin/lockstep build tacoma-narrows
```

Rebuilds are deterministic: the same script gives the same audio and timings, and the same scenes
and media give the same frames.

## Limits

- English narration only, with Kokoro's two best voices (`af_heart`, `af_bella`).
- Pictures are only as good as the free archives. Old history is rich (public-domain photographs,
  paintings, film); modern subjects need Pexels and Pixabay keys; some exact pictures (a famous
  photograph still in copyright) do not exist under a usable licence — the agent says so and asks.
- 3D is rendered in software: about 0.2–0.4 s a frame; a full build of a minute takes 15–20 minutes.
- Music is chosen from each track's description, tempo and length: the agent cannot listen to it.
  Listen to the mix yourself; ask for another track by mood if it is wrong.
- Taste is checked by the agent looking at its own frames, not by an audience. Watch each video
  yourself before publishing; the brief's retrospective is where feedback goes.
- Facts are only as good as the research step. Read `docs/sources.md`.

## Third-party components

Stored in `assets/` (see `assets/README.md`): 33 type families from Google Fonts via Fontsource
(SIL Open Font License, two under Apache 2.0) and Lucide icons (ISC), each with its licence file.

In `engine/anim/vendor/`: three.js r187 (MIT) with its glTF and HDR loaders; gl-transitions (MIT),
223 shader transitions, each with its author in `gl-transitions/transitions.json`.

Downloaded when first needed, not stored here: Kokoro-82M and `kokoro-onnx` (Apache-2.0 / MIT),
`misaki` (Apache-2.0), sherpa-onnx with Whisper small.en and a Zipformer model (optional QA), the
IS-Net background-removal model (`lockstep cutout`, via rembg's release, Apache-2.0). Media are
downloaded per video from their sources under their own licences and credited in that video's
`media/credits.json` — music included (Incompetech tracks, CC BY 4.0, credited in the video's
`docs/credits.md`). FFmpeg, Chromium and Playwright are used as installed tools. Sound effects, and
the score when a video uses no track, are generated by this code and are original.
