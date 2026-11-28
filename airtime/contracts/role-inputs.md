# Brain role inputs (control → brain)

`POST /v1/runs {role, input, files}`. The plan fixes each role's **output** (contract F,
`role-outputs.schema.json`); this page fixes what control puts in **`input`**. Both sides are
lenient: brain accepts extra keys and tolerates missing optional ones (the role prompt works with
whatever context is present); control sends compact JSON with only the top items.

Common keys (any role may receive them): `now` (UTC ISO time), `markets`
(`[{code, name, languages, weight, rpm_index}]`, enabled only), `learnings`
(`[{id, statement, weight, scope}]`, current weight > 0.05, top 20 by weight).

| Role | `input` keys | `files` |
|---|---|---|
| ideator | `now`, `markets`, `signals: [{market, items: [{source, title, rank, metric, url, language}]}]` (top 25 per market, ≤ `signal_max_age_days` old), `recent_topics: [{topic, angle, published_at, verdict}]` (last 60 days), `learnings`, `max_candidates: 15` | — |
| strategist | `now`, `markets`, `candidates` (ideator output), `probes: [TopicProbe]` (contract G), `channel: {subscribers, views_28d, median_views_per_video}`, `recent_topics`, `learnings`, `max_opportunities: 5` | — |
| brief_writer | `now`, `opportunity` (a strategist opportunity plus its `opportunity_id`), `markets`, `competitors` (from the probes), `learnings`, `rubric: {threshold, dimensions}`, `format: {name: short, duration_s: {target, max}}`, `engine_template_md` (the template block of the engine's `PROMPTING.md`) | — |
| critic | `round` (0 for the first cut), `brief` (GrowthBrief), `handoff` (Handoff, paths rewritten to the copied file names), `rubric`, `previous: [{revision, scorecard, review_notes}]` | contact sheet + ≤ 8 keyframes (540×960 JPEG), `subtitles.srt` |
| seo | `brief`, `publish_kit` (from the chosen handoff), `script: {title, text}`, `markets`, `languages` (`translate_to` from markets.yaml), `competitors`, `scorecard` | thumbnail candidates (≤ 4) |
| translator | `source_language`, `languages`, `lines: [{i, text}]`, `context: {topic, title}` | — |
| analyst | `video: {video_id, title, published_at, duration_s, is_short}`, `snapshot` (this video's analytics, contract H), `history: [earlier snapshots' metrics]`, `channel_baseline: {median of each metric over the last 60 days}`, `script: {lines: [{id, beat, text, start_s, end_s}]}`, `beats`, `brief: {topic, angle, markets, hook}`, `predicted` (the critic's) | ≤ 8 keyframes |
| learner | `now`, `learnings` (all active, with `confidence`, `weight`, `age_days`, `last_confirmed_at`), `diagnoses` (last 60 days), `productions: [{topic, angle, markets, scorecard_total, metrics}]`, `half_life_days`, `max_age_days` | — |
