# Airtime

Airtime runs the lockstep engine's YouTube channel. It researches what people in ten markets are
watching, decides what to make, briefs the engine, scores each cut and sends it back for up to two
rounds of revision, uploads the best cut through your own Chrome, watches how every video performs,
explains why, and learns from the last two months of results. One dashboard shows all of it,
including the engine at work.

Everything is free: AI is Claude Code (Opus 5.5, max effort) on your own subscription, YouTube is
driven through your signed-in Chrome with a fixed script (no API), and trend data comes from free
public sources.

## How it fits together

```
 web (127.0.0.1:8080) ──/api──► control (127.0.0.1:8000) ── Postgres (127.0.0.1:5433)
                                   │
        ┌──────────────┬───────────┼────────────────┬───────────────────────┐
        ▼              ▼           ▼                ▼                       │
      scout          brain     engine-bridge      youtube ──CDP──► Chrome (your Lockstep-Studio
   (container)      (host)        (host)        (container)          profile, 127.0.0.1:9222)
   free trends     claude -p   claude -p + the
                   8 roles     explainer-video skill
                     │              │
                     └── your Claude accounts (~/.claude, ~/.claude-second), picked per run
```

- **Containers** (Docker Compose, host network): postgres, control, web, scout, youtube.
- **Host services** (systemd `--user`): brain and engine-bridge, because they run the host's
  `claude` CLI with your signed-in accounts. brain picks an account for every run and fails over
  when one hits its usage limit, like T3 does.
- **The engine** is the `engine` branch of this repository. engine-bridge never touches your
  checkout: it keeps its own clone and makes one git worktree per job.

Details: [docs/architecture.md](docs/architecture.md). The full plan and your decisions:
[docs/PLAN.md](docs/PLAN.md). Running it day to day: [docs/runbook.md](docs/runbook.md).

## Quick start

```bash
airtime/scripts/airtime init      # writes airtime/.env, the data folder, the host units
airtime/scripts/airtime up        # containers + host services; waits until all are healthy
airtime/scripts/airtime chrome    # your Lockstep-Studio profile with remote debugging; sign in if asked
airtime/scripts/airtime calibrate # checks every YouTube Studio step; leaves only a private draft
open http://127.0.0.1:8080
```

`airtime/scripts/airtime smoke` runs the whole pipeline end to end in fake mode (no Claude,
YouTube, engine or network). `airtime/scripts/airtime status` shows every service, Chrome, the
YouTube session and the Claude accounts.

## Layout

| Path | What |
|---|---|
| `compose.yaml`, `compose.fake.yaml` | the five containers; the fake override |
| `config/` | markets, rubric, autopilot, roles, Claude accounts |
| `contracts/` | JSON Schemas for every message between services, examples, `check_contracts.py` |
| `services/control` | orchestrator: state machine, scheduler, scoring, learning, dashboard API |
| `services/web` | the dashboard |
| `services/brain` | AI roles through Claude Code, and the account pool (host) |
| `services/scout` | free trend signals and demand probes |
| `services/youtube` | YouTube Studio through Chrome over the DevTools protocol |
| `services/engine-bridge` | runs the lockstep engine headlessly as a job API (host) |
| `scripts/airtime` | the one CLI |
| `docs/` | plan, architecture, runbook, engine contract |
