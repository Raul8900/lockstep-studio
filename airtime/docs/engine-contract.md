# The engine contract

What Airtime gives the engine, and what it needs back. engine-bridge implements both sides today by
driving the engine through Claude Code; the engine can produce them natively later without any
other Airtime service changing.

- **In: a GrowthBrief** ([schema](../contracts/growth-brief.schema.json),
  [example](../contracts/examples/growth-brief.json)). `engine_request_md` is the brief in the
  engine's own `PROMPTING.md` template; the structured fields carry the evidence (markets,
  competitors, keywords, learnings, the rubric the cut will be scored on).
- **In, for a revision: ReviewNotes** ([schema](../contracts/review-notes.schema.json)).
  `engine_feedback_md` is written in `PROMPTING.md`'s "Giving feedback" style ("0:11, the plate
  shot: show …").
- **Out: a Handoff per revision** ([schema](../contracts/handoff.schema.json),
  [example](../contracts/examples/handoff.json)), written by the engine session to
  `videos/<slug>/handoff.json` and completed by engine-bridge from the engine's own files:

| Handoff field | Engine file |
|---|---|
| `video.path` | `dist/<video.json:output>.mp4` |
| `video.phone_path` | `bin/lockstep share` |
| `qa` | `data/validation.json` |
| `script.lines`, `words_path` | `data/words.json` |
| `captions.srt` | `dist/subtitles.srt` |
| `frames.contact_sheet` | `dist/contact_sheet.jpg` |
| `media`, `music` | `media/credits.json`, `docs/credits.md` |
| `sources` | `docs/sources.md` |

- **The job API** ([schema](../contracts/engine-job.schema.json)) mirrors the job harness in the
  engine's design (`docs/architecture/03-architecture.md` §3.8 on the `engine` branch).

engine-bridge's own notes on how it drives the engine are in
`services/engine-bridge/docs/engine-contract.md`.
