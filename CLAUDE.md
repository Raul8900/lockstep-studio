# lockstep-studio

A pipeline that turns a topic into a finished vertical explainer video (1080 × 1920, 30 fps,
voiceover, original music and sound design, word-synced captions). The narration is recorded
first and every animation, sound and caption is timed from its measured word timings.

## When asked to make or change a video

Use the `explainer-video` skill (`.claude/skills/explainer-video/SKILL.md`). It holds the
workflow, the scene API, the design rules and the QA checklist. Do not improvise a different
pipeline.

## Layout

- `bin/lockstep` — the only entry point. `bin/lockstep help` lists the commands.
- `engine/` — shared by every video: renderer (`render.js`, `anim/`), voice (`tts/`), score and
  mix (`audio/`), encode (`assemble.py`), QA (`validate.py`, `summary.py`), documents.
- `templates/video/` — what `bin/lockstep new` copies: a small runnable video.
- `videos/<slug>/` — one folder per video. `videos/how-a-gpu-works/` is the reference production.
- `scripts/setup.sh` — installs Python packages, the voice model, fonts; `scripts/selftest.sh`
  builds the template end to end.

## Conventions

- First thing in a new session: `bin/lockstep doctor`; run `bin/lockstep setup --with-asr` if
  anything is missing.
- Topic-specific drawing code goes in `videos/<slug>/components.js`, not in `engine/`. Change the
  engine only for something every video should get, and afterwards confirm the reference video
  still renders: `bin/lockstep scan how-a-gpu-works`.
- Generated folders (`out/`, `audio/`, `models/`) and MP4s are git-ignored. Commit a video's
  sources, `data/`, `docs/` and the small files in `dist/`.
- Engine scripts take the video folder (or its name under `videos/`) as their first argument and
  never write outside it.
- After changing engine code: `scripts/selftest.sh` must pass.
