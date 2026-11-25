# lockstep-studio

A pipeline that turns a topic into a finished vertical short (1080 × 1920, 30 fps, voiceover,
licensed music, synthesised sound design, word-synced captions): a story animated in code with
three.js (objects, mechanisms and places built from shapes; no human figures made of shapes,
nothing AI-generated), with real photographs and film from free, licensed sources only as evidence.
The narration is recorded first and every cut, camera move, overlay, sound and caption is timed
from its measured word timings.

## When asked to make or change a video

Use the `explainer-video` skill (`.claude/skills/explainer-video/SKILL.md`). It holds the
workflow, how to write and pace the story (reference/story.md), what fills the frame
(reference/shots.md), how to find and credit media (reference/media.md), the scene API and the QA
checklist. Do not improvise a different pipeline.

Every video is planned before anything is recorded: its story, hook, world, hero, a shot plan
naming the media for every shot, and its pacing are written in `docs/creative_brief.md`, and its
grade and captions in `style.json` (`bin/lockstep brief` must pass; `voice` and `build` enforce it).

Pacing is decided per beat, never one speed for the whole video: brisk through the setup; the
explanation and the real footage get time and held moments (the voice silent while the picture
plays), paid for by a shorter setup, not by a longer video. `bin/lockstep pacing <slug>` measures
it; `lint` warns when real footage is rushed.

Media rules: only free, properly licensed media (public domain, CC0, CC BY, the Pexels and Pixabay
licences; never NC or ND; share-alike only if the person accepts it), every file credited in
`media/credits.json`; no paid services, nothing bought, nothing ripped from a platform. Music is a
licensed track (Incompetech, Kevin MacLeod, CC BY 4.0, credited) or the engine's own score. When
two candidates are equally right or none is good enough, ask the person to choose from the contact
sheet.

## Layout

- `bin/lockstep` — the only entry point. `bin/lockstep help` lists the commands.
- `engine/` — shared by every video: renderer (`render.js`, `anim/js/`: `media.js` pictures and
  film, `world3d.js` three.js worlds, `kit3d.js` things built in code, `overlays.js`, `text.js`,
  `gl.js`), media sourcing (`media.py`), voice (`tts/`), pacing (`pacing.py`), score and mix
  (`audio/`), encode (`assemble.py`), QA (`lint.py`, `validate.py`, `summary.py`), documents.
- `templates/video/` — what `bin/lockstep new` copies: a runnable 17-second example with its media
  (a NASA photograph, a 3D Earth and Moon, Apollo film with a held moment); its brief and style are
  replaced by `templates/creative_brief.md` and nothing, so each video decides its own.
- `assets/` — open-licence fonts and icons the renderer loads directly.
- `videos/<slug>/` — one folder per video. `videos/tacoma-narrows/` is the reference production:
  animated in code, the real film as evidence, a licensed track; its brief's Pacing section records
  what its review asked to change. `videos/penicillin-accident/` is an earlier, photo-led one.
- `scripts/setup.sh` — installs Python packages, the voice model, fonts; `scripts/selftest.sh`
  builds the template end to end.

## Requests

`PROMPTING.md` is the template for asking for a video; follow its checkpoints when a request uses them.

## Branches

`foundation-v2` is the production branch: the current engine and skill, and the branch new videos
are made from. Start work on a new branch from `origin/foundation-v2` (one per video or engine
change) and merge it back into `foundation-v2` through a pull request. `develop` holds the earlier
engine and `main` is legacy: do not commit or push to either.

## Conventions

- First thing in a new session: `bin/lockstep doctor`; run `bin/lockstep setup --with-asr` if
  anything is missing. In a fresh clone, `bin/lockstep media <slug> restore` downloads a video's
  media again from its credits, and `bin/lockstep voice <slug>` re-records its narration (audio is
  not committed; the same script records the same audio) before any rebuild.
- Long steps run in the background: a full `build` of a minute of 3D takes 15–20 minutes, `lint`
  a few minutes. Keep working meanwhile.
- The container is discarded after the session: give the person the finished MP4 itself (a
  phone-size copy with SendUserFile when available), with `docs/credits.md`.
- Topic-specific drawing code goes in `videos/<slug>/components.js` or the scene files, and a
  topic-specific look in `videos/<slug>/style.json`, not in `engine/`. Change the engine only for
  something every video should get.
- Overlays use colour roles (`COL.subject`, `COL.accent`, `COL.data`, `COL.alert`, `COL.good`,
  `COL.ink`), never hex values; the style decides the colours.
- Generated folders (`out/`, `audio/`, `models/`), media files and MP4s are git-ignored. Commit a
  video's sources, `media/credits.json`, `data/`, `docs/` and the small files in `dist/`.
- Engine scripts take the video folder (or its name under `videos/`) as their first argument and
  never write outside it.
- After changing engine code: `scripts/selftest.sh` must pass.
