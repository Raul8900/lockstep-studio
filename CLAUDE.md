# lockstep-studio

A pipeline that turns a topic into a finished vertical short (1080 × 1920, 30 fps, voiceover,
original music and sound design, word-synced captions): a story told over real photographs,
archive film and 3D from free, licensed sources. The narration is recorded first and every cut,
camera move, overlay, sound and caption is timed from its measured word timings.

## When asked to make or change a video

Use the `explainer-video` skill (`.claude/skills/explainer-video/SKILL.md`). It holds the
workflow, how to write the story (reference/story.md), what fills the frame (reference/shots.md),
how to find and credit media (reference/media.md), the scene API and the QA checklist. Do not
improvise a different pipeline.

Every video is planned before anything is recorded: its story, hook, world, hero and a shot plan
naming the media for every shot are written in `docs/creative_brief.md`, and its grade and
captions in `style.json` (`bin/lockstep brief` must pass; `voice` and `build` enforce it).

Media rules: only free, properly licensed media (public domain, CC0, CC BY, the Pexels and Pixabay
licences; never NC or ND; share-alike only if the person accepts it), every file credited in
`media/credits.json`; no paid services, nothing bought, nothing ripped from a platform. When two
candidates are equally right or none is good enough, ask the person to choose from the contact
sheet.

## Layout

- `bin/lockstep` — the only entry point. `bin/lockstep help` lists the commands.
- `engine/` — shared by every video: renderer (`render.js`, `anim/js/`: `media.js` pictures and
  film, `world3d.js` three.js worlds, `overlays.js`, `text.js`, `gl.js`), media sourcing
  (`media.py`), voice (`tts/`), score and mix (`audio/`), encode (`assemble.py`), QA
  (`lint.py`, `validate.py`, `summary.py`), documents.
- `templates/video/` — what `bin/lockstep new` copies: a 15-second runnable example with its media
  (a NASA photograph, a 3D Earth and Moon, Apollo film); its brief and style are replaced by
  `templates/creative_brief.md` and nothing, so each video decides its own.
- `assets/` — open-licence fonts and icons the renderer loads directly.
- `videos/<slug>/` — one folder per video. `videos/penicillin-accident/` is the reference production.
- `scripts/setup.sh` — installs Python packages, the voice model, fonts; `scripts/selftest.sh`
  builds the template end to end.

## Branches

`develop` is the default branch. Start new work on a feature branch from `origin/develop` and merge it
back through a pull request into `develop`. `main` is the legacy branch: do not commit or push to it.

## Conventions

- First thing in a new session: `bin/lockstep doctor`; run `bin/lockstep setup --with-asr` if
  anything is missing. In a fresh clone, `bin/lockstep media <slug> restore` downloads a video's
  media again from its credits.
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
