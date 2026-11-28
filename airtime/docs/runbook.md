# Runbook

Commands are `airtime/scripts/airtime <command>` (call it `airtime` below; add it to your PATH or
make an alias). Everything binds 127.0.0.1.

## First run

1. **Docker.** Airtime uses the native Docker Engine (`systemctl status docker`), not Docker
   Desktop. The CLI sets `DOCKER_CONTEXT=default` for you.
2. **Claude.** Sign in to at least one account on this machine: `claude` in a terminal for
   `~/.claude`, or `CLAUDE_CONFIG_DIR=~/.claude-third claude` for another folder. brain finds every
   `~/.claude*` folder by itself (`discover` in `config/claude.yaml`) and uses the signed-in ones;
   disable or order accounts there.
3. **Set up.** `airtime init` writes `airtime/.env` and `.env.fake` (absolute paths for this
   machine), creates `~/.local/share/airtime`, and installs the systemd `--user` units for brain
   and engine-bridge. `airtime init --dry-run` shows what it would write.
4. **Start.** `airtime up` builds and starts the containers and the host services and waits until
   all are healthy. The dashboard is at http://127.0.0.1:8080.
5. **Chrome.** `airtime chrome` copies your **Lockstep-Studio** Chrome profile once into
   `~/.config/airtime-chrome` (Chrome refuses remote debugging on its default folder) and starts
   Chrome on it with remote debugging on 127.0.0.1:9222. If YouTube asks you to sign in, do it by
   hand in that window. Keep the window open while Airtime uploads or reads analytics.
6. **Calibrate.** `airtime calibrate` (or Settings → Calibrate) walks every YouTube Studio step
   against the real page and leaves only a private draft. Fix any failing selector in
   `services/youtube` before the first real upload.
7. **Check.** `airtime status` shows every service, Chrome, the YouTube session and the Claude
   accounts.

## Every day

- **Modes** (Settings): `off`, `assist` (researches and suggests; you press Produce and Upload),
  `auto` (the full loop within the daily limits). Every step also has a button.
- **Productions** move through `briefing → producing → scoring → revising → … → awaiting_approval
  → uploading → published/scheduled → monitoring → done`. The production page shows the brief, the
  engine's live log, the script, components, each cut's scorecard, the publish kit and the upload
  log with a screenshot per step.
- **needs_attention** always says why:
  - `upload_failed` — three attempts failed. Use **Upload manually** (everything is there to copy)
    in YouTube Studio, then **Mark as uploaded** with the video's URL; monitoring carries on.
  - `hard_gate` — every cut failed a hard gate (technical, accuracy or policy). Choose a cut and
    press Upload anyway, upload by hand, or cancel.
  - `claude_unavailable` — every Claude account is signed out or at its limit; the step retries by
    itself after the earliest reset.
  - `engine_failed`, `youtube_session` — see the production's timeline and the service log.

## Logs and state

- `airtime logs <service> [-f]` — host services through journald, containers through Docker.
- Data: `~/.local/share/airtime` (see docs/architecture.md for the layout). The database is the
  `airtime_pgdata` Docker volume.
- `airtime down` stops everything and keeps the data.

## Fake mode

`airtime smoke` brings up the `airtime-fake` stack (its own database and `~/.local/share/airtime/fake`),
runs research → production → two revisions → upload to the fake Studio → analytics → learning, and
stops it. `airtime --fake up` keeps it running for clicking through the dashboard. Real and fake
stacks use the same ports, so stop one before starting the other.

## The engine

engine-bridge runs the `engine` branch of your main checkout (`ENGINE_REPO`, `ENGINE_REF` in
`.env`) in its own clone and worktrees, and never writes to your checkout. To try the engine
thread's uncommitted work, set `ENGINE_SOURCE=working_tree`. The engine's tool chain (`.venv`,
`node_modules`, `models/`) is linked from `ENGINE_ENV_DIR`; after the engine changes its setup,
run `bin/lockstep setup --with-asr` there once.

## Troubleshooting

| Symptom | Check |
|---|---|
| `airtime up` says Docker is unreachable | `systemctl status docker`; you are in the `docker` group |
| brain or engine-bridge DOWN | `airtime logs brain`; `systemctl --user status airtime-brain` |
| Chrome not reachable | `airtime chrome`; only one Chrome may use `~/.config/airtime-chrome` |
| YouTube logged out | sign in again in the Airtime Chrome window |
| A Studio step fails | the upload log's screenshot and DOM dump; `airtime calibrate` |
| Port already in use | `ss -ltnp | grep -E ':(800[0-4]|8080|5433|9222) '` |
