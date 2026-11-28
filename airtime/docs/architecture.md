# Architecture

## Services

| Service | Runs | Port | Job |
|---|---|---|---|
| control | container | 8000 | The only stateful orchestrator: research and production state machines, crons, scoring and gates, learning, the dashboard API and its event stream |
| web | container | 8080 | The dashboard (nginx serving the React app and proxying `/api` to control) |
| postgres | container | 5433 | control's database |
| scout | container | 8002 | Free trend signals per market (Google Trends RSS, Wikimedia top articles per country and language, YouTube autocomplete, Hacker News) and demand/competition probes |
| youtube | container | 8003 | Deterministic YouTube Studio flows over CDP: session check, upload and metadata, localizations, captions, analytics export, signed-out search, calibration |
| brain | host | 8001 | Every AI call: `claude -p` with a role prompt and a JSON Schema; the Claude account pool |
| engine-bridge | host | 8004 | The engine as a job API: one git worktree and one Claude Code session per job, the handoff |

All of them bind 127.0.0.1. Containers use `network_mode: host`, so containers, host services and
Chrome reach each other on loopback, and the remote-debugging port of the signed-in Chrome never
leaves the machine.

Files move between services only as absolute paths under `AIRTIME_DATA_DIR`
(`~/.local/share/airtime`), mounted at the same path in every container, so a path written by one
service is valid for every other one and for the host Chrome's file chooser:

```
engine/repo, engine/worktrees/<job_id>   engine-bridge's clone and job worktrees
artifacts/<job_id>/rev-<n>/              each revision's snapshot: video, keyframes, handoff.json
publish/<production_id>/                 the chosen cut, thumbnail, captions per language
youtube/{screens,dom,downloads}/<task>/  a screenshot and DOM dump of every Studio step
brain/runs/<run_id>/                     prompt, input, transcript and output of every AI run
scout/cache.db                           cached signals
```

## Why brain and engine-bridge run on the host

Claude Code runs on your subscription through the config folders you are signed in with
(`~/.claude`, `~/.claude-second`, `~/.claude-third`, any `~/.claude*`). Putting it in a container would mean copying credentials into
images; running it on the host uses exactly what T3 uses. The engine also needs the host's tool
chain (Python venv, Node, Playwright, ffmpeg, the voice model), which `bin/lockstep setup` already
installed in your checkout; engine-bridge links those into each job worktree.

## The Claude account pool

brain reads `config/claude.yaml`, checks each account with `claude auth status`, and for every run
picks a signed-in account that is not cooling down (the least used in the last 5 hours by default).
When a run hits a usage limit, that account cools down until the reset time in the message and the
run moves to the next account; when none is left the step waits until the earliest reset.
engine-bridge leases accounts from brain for its long engine sessions. Child processes never see
an API key, so usage always goes to the subscription.

## A production

1. **Research** — scout collects signals; brain `ideator` proposes candidates; scout probes demand
   and competition on YouTube per market; brain `strategist` ranks opportunities.
2. **Brief** — brain `brief_writer` writes a GrowthBrief and renders it in the engine's
   `PROMPTING.md` format.
3. **Produce** — engine-bridge runs the `explainer-video` skill headlessly in a fresh worktree of
   the `engine` branch and returns a handoff (video, script with timings, components, QA, frames,
   publish kit).
4. **Score** — brain `critic` scores 8 dimensions from frames, script, QA and the kit; control
   computes `technical` from QA, the weighted total and the hard gates.
5. **Revise** — below 90, the critic's timestamped notes go back to the engine (round 1, round 2).
6. **Choose** — the best cut that passes the gates; if none does, `needs_attention`.
7. **Finalize** — brain `seo` writes title, description, tags and localizations; brain
   `translator` translates the captions.
8. **Upload** — youtube uploads through your Chrome (your one click, unless auto-upload is on), up
   to 3 attempts; then you upload by hand and mark it uploaded.
9. **Monitor and learn** — analytics at 24 h, 72 h, 7 d, 14 d and 28 d; brain `analyst` explains
   each video, mapping retention drops to the script line on screen; brain `learner` keeps the
   playbook, whose learnings fade with a 21-day half-life and retire after 60 days unconfirmed.
