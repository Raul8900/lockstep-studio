# Airtime — plan

This file is the approved plan (below the line) plus the owner's answers to its open questions
(this addendum). **Where the addendum and the plan differ, the addendum wins.** Read both.

## Addendum — owner's answers, 2026-11-28

The owner's words: (1) "in my Google Chrome there is one Lockstep Studio profile, you can use it; if
a manual login is required I will do it before testing"; (2) "we won't run Claude inside a
container; figure out a way to use Claude dynamically like T3 (`~/.claude`, `~/.claude-second`),
choosing which one to use, but use the one on my machine directly, no Docker Claude"; (3) "I will
run [the calibration dry run]"; (4) "after it fails 3 times I will upload it manually"; and: test
end to end with the engine that the other thread is building on the `engine` branch.

### A. Claude runs on the host, never in Docker

- `brain` and `engine-bridge` are **host services**: uv projects started with `uv run` on the host
  (uv provides Python 3.12; system Python is 3.14 and externally managed). They have no Dockerfile.
  They spawn the host's `claude` CLI (`AIRTIME_CLAUDE_BIN`, default `claude` on `PATH`; it is
  `~/.local/bin/claude`, version 2.1.332).
- Drop `CLAUDE_CODE_OAUTH_TOKEN` and `claude setup-token`: authentication is whatever the host's
  config directories are signed in with.
- **Never pass `--bare`**: it disables OAuth, so the subscription would not be used.
- Child environment for every `claude` process: remove `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`,
  `ANTHROPIC_BASE_URL`, `CLAUDECODE`, `CLAUDE_CONFIG_DIR` and every inherited `CLAUDE_CODE_*` and
  `CLAUDE_AGENT_*` variable; then set `CLAUDE_CONFIG_DIR` for the chosen account (left unset for
  the default `~/.claude`, whose settings file is `~/.claude.json`). An API key would bill the API
  instead of the subscription, and variables inherited from a parent Claude session confuse a nested
  one.

### B. Claude account pool (like T3), owned by brain

`airtime/config/claude.yaml`:

```yaml
strategy: least_used          # least_used | ordered
cooldown_default_min: 60      # when a limit message has no parsable reset time
status_ttl_s: 300             # how long a `claude auth status` result is trusted
accounts:
  - id: main
    config_dir: ~/.claude     # the default directory: CLAUDE_CONFIG_DIR is left unset for it
    enabled: true
  - id: second
    config_dir: ~/.claude-second
    enabled: true
```

- **Status.** `claude auth status` (prints JSON) run with the account's environment gives
  `loggedIn`, `subscriptionType`, `orgName`. Cache it for `status_ttl_s`. Never log, store or
  return the account e-mail. Today `second` is signed in and `main` reports `loggedIn: false`; the
  pool must work with any subset signed in.
- **Choice per run.** Candidates are enabled, signed in and not cooling down. `least_used` picks the
  one with the fewest input + output tokens in brain's usage ledger over the last 5 hours (ties go
  to config order); `ordered` picks the first candidate.
- **Limits.** A run whose result, assistant text or stderr shows a usage limit (for example
  `You've hit your 5-hour limit · resets 2:10am (Asia/Kolkata)`, `Claude AI usage limit
  reached|<epoch>`, `usage limit`, `rate_limit`, HTTP 429) puts that account in cooldown until the
  parsed reset time (the next occurrence of that clock time in that time zone, or the epoch), or
  for `cooldown_default_min` if none parses; the run is then retried on the next candidate (each
  account at most once per run). An authentication failure (`Please run /login`, `Invalid API
  key`, `OAuth token has expired`, 401) marks the account signed out until its next status check.
- **None available** → the run fails with error code `claude_unavailable` and
  `details.retry_at` (the earliest cooldown end). control shows it and retries that step after
  `retry_at`.
- **API** (brain):
  - `GET /v1/accounts` → `{strategy, accounts:[{id, config_dir, enabled, logged_in,
    subscription_type, org_name, cooling_down_until, last_error, last_used_at,
    usage_5h:{input_tokens,output_tokens,runs}, usage_7d:{input_tokens,output_tokens,runs}}]}`
  - `POST /v1/accounts/lease {purpose, exclude:[ids]}` → `200 {lease_id, account_id, config_dir,
    set_env:{…}, unset_env:[…]}` or `503` with `{"error":{"code":"claude_unavailable",
    "details":{"retry_at":…}}}`
  - `POST /v1/accounts/leases/{lease_id}/release {outcome: ok|rate_limited|auth_failed|error,
    resets_at?, message?, usage?:{input_tokens,output_tokens,cache_read_input_tokens,
    cache_creation_input_tokens}}` → the ledger and cooldowns are updated
  - `POST /v1/accounts/{id}/refresh` → re-runs the status check now
- engine-bridge leases an account from brain for every engine session and releases it with the
  outcome and usage. If brain is unreachable it falls back to `AIRTIME_CLAUDE_CONFIG_DIRS`
  (comma-separated, in order) with the same limit detection.

### C. The engine under test is the `engine` branch

- The engine thread works in the owner's main checkout on the local branch `engine` (not pushed;
  it has uncommitted work). `ENGINE_REPO` is that checkout's absolute host path (init writes it);
  `ENGINE_REF` defaults to `engine`.
- The bridge never changes `ENGINE_REPO` (no checkout, stash, index or branch writes there). It
  keeps its own clone at `$AIRTIME_DATA_DIR/engine/repo` (`git clone --no-checkout`, then
  `git fetch` before each job) and one detached worktree per job at
  `$AIRTIME_DATA_DIR/engine/worktrees/<job_id>`.
- `ENGINE_SOURCE=ref` (default) checks out `ENGINE_REF`. `ENGINE_SOURCE=working_tree` tests the
  engine thread's uncommitted work: check out `ENGINE_REPO`'s `HEAD` commit, then overlay its
  working-tree changes read-only (`git -C $ENGINE_REPO ls-files -m -o --exclude-standard -z` →
  copy; `ls-files -d` → delete), skipping `videos/` (other productions). Record
  `engine:{ref, commit, source, overlay_files}` in every handoff.
- **Engine environment.** The engine needs `.venv`, `node_modules` and `models/` (all git-ignored).
  `ENGINE_ENV_DIR` (default `ENGINE_REPO`, where `bin/lockstep setup --with-asr` has already been
  run) — the bridge symlinks those three into every job worktree instead of installing per job.
  `GET /v1/engine` reports `bin/lockstep doctor` run in a prepared worktree.
- **Revisions** start a fresh `claude -p` session in the same worktree (no `--resume`): the video
  folder on disk carries the state; the prompt is the bridge rules + the ReviewNotes
  `engine_feedback_md` + paths. Rendering and the engine's own QA happen inside the session, as the
  repo's `CLAUDE.md` and `.claude/skills/explainer-video` prescribe.
- The engine session must never commit, push, or touch anything outside its worktree.

### D. YouTube through the owner's "Lockstep-Studio" Chrome profile

- In the owner's Google Chrome 158 the profile named **Lockstep-Studio** is `Profile 15` of the
  default user-data-dir `~/.config/google-chrome`. Chrome ≥ 136 ignores `--remote-debugging-port`
  on the default user-data-dir, so `airtime/services/youtube/scripts/chrome-airtime.sh`:
  1. finds the profile folder by display name (`CHROME_PROFILE_NAME`, default `Lockstep-Studio`)
     in `~/.config/google-chrome/Local State` → `profile.info_cache`;
  2. the first time only (or with `--reseed`), copies it to
     `${AIRTIME_CHROME_USER_DATA_DIR:-$HOME/.config/airtime-chrome}/Default` with rsync, excluding
     caches (`Cache`, `Code Cache`, `GPUCache`, `Service Worker/CacheStorage`) and lock files, and
     writes a minimal `Local State`, so the sign-in carries over when Google accepts it;
  3. starts `google-chrome --user-data-dir=<that> --profile-directory=Default
     --remote-debugging-port=${CHROME_CDP_PORT:-9222} --remote-debugging-address=127.0.0.1
     --no-first-run --no-default-browser-check https://studio.youtube.com` detached (unless that
     port already answers) and waits for `http://127.0.0.1:<port>/json/version`;
  4. if YouTube is not signed in there, the owner signs in by hand once in that window.
- Nothing else in the owner's own Chrome folder is read or written.
- `CHROME_CDP_URL` defaults to `http://127.0.0.1:9222`.

### E. Native Docker Engine on the host network

- Use the native Docker Engine (`unix:///var/run/docker.sock`; the owner is in the `docker`
  group), not Docker Desktop. The CLI's current context is the inactive `desktop-linux`, so every
  script and command sets `DOCKER_CONTEXT=default`.
- Compose runs **postgres, control, web, scout, youtube** with `network_mode: host`, each binding
  127.0.0.1 only, so containers, the two host services and Chrome all meet on loopback. Ports:
  control 8000, brain 8001 (host), scout 8002, youtube 8003, engine-bridge 8004 (host), web 8080
  (nginx), postgres **5433** (a local Postgres already holds 5432). Default URLs are
  `http://127.0.0.1:<port>`; `DATABASE_URL=postgresql+psycopg://airtime:airtime@127.0.0.1:5433/airtime`.
- Containers run as `${AIRTIME_UID}:${AIRTIME_GID}` and mount `AIRTIME_DATA_DIR` (default
  `$HOME/.local/share/airtime`) at the same absolute path. `airtime/config` is mounted read-only
  at `/config` in containers; host services read it from the repo (`AIRTIME_CONFIG_DIR`).
- `airtime/scripts/airtime` (one CLI): `init`, `up` (compose + host services), `down`, `status`,
  `logs <service>`, `chrome`, `calibrate`, `smoke`, `dev <service>` (one service in the
  foreground). Host services run as systemd `--user` units (`airtime-brain`,
  `airtime-engine-bridge`) generated by `airtime/scripts/install-host-services.sh`
  (`Restart=on-failure`, `EnvironmentFile=airtime/.env`, `PATH` including `~/.local/bin`).

### F. Upload failures: three attempts, then the owner uploads by hand

- control tries an upload at most **3 times** (`upload_max_attempts: 3` in `autopilot.yaml`). Each
  attempt is a new youtube task; when an earlier attempt already created the video (its `video_id`
  is known), the next attempt passes `resume_video_id` and youtube continues on that video's edit
  page instead of uploading a duplicate.
- After the third failure the production goes to `needs_attention` (reason `upload_failed`). The
  dashboard shows an **Upload manually** panel with everything needed (the file and a download
  link, title, description, tags, thumbnail, captions, localizations, suggested schedule) and a
  **Mark as uploaded** form: `POST /api/productions/{id}/mark-uploaded {video_url}` → monitoring
  continues as if Airtime had uploaded it.
- If all three cuts fail a hard gate → `needs_attention` (reason `hard_gate`): the owner can choose
  a revision and press Upload anyway, or upload by hand and mark it.

### G. Calibration dry run

The owner runs it (`airtime calibrate` or the Settings button) after signing in.

### H. Branch base

`airtime` starts from `origin/foundation-v3`, the commit `engine` builds on.

### I. This machine

12 cores, 15 GB RAM with about 5 GB free, and the engine thread renders at the same time. Run
tests serially, at most one Chromium at a time, and remove containers when done. Before a heavy step
(a docker build, Chromium, the engine selftest) check `free -m` and wait while `available` is
under 2000 MB.

### Changes to the work units

| # | Unit | Change |
|---|---|---|
| 1 | platform | Compose has 5 services on the host network (no brain or engine-bridge); systemd user units for the two host services; `airtime` CLI; `config/claude.yaml`; schemas for the account API and `mark-uploaded`; port 5433 for Postgres |
| 2 | control | Upload attempts (max 3, `resume_video_id`), `needs_attention` reasons, `mark-uploaded`, `claude_unavailable` retry, account status in `/api/status`, `POST /api/claude/accounts/{id}/refresh` (proxy to brain) |
| 3 | web | Accounts panel (signed in, cooldown, 5 h usage, refresh) in Settings & connections; Upload manually panel; Mark as uploaded; upload attempts in the Upload log |
| 4 | brain | Host service, no Docker; the account pool and its API (B); child environment rules (A) |
| 5 | scout | Unchanged, apart from the host network |
| 6 | youtube | `chrome-airtime.sh` (D) replaces `chrome-login.sh` and `chrome-cdp.sh`; CDP on `127.0.0.1`; `resume_video_id` |
| 7 | engine-bridge | Host service, no Docker; `ENGINE_REPO`, `ENGINE_REF=engine`, `ENGINE_SOURCE`, environment symlinks (C); account lease from brain (B); fresh-session revisions |

### Changes to the end-to-end recipe

- **brain:** `uv run pytest` with a fake `claude`; then as a host process on port 18001 with the
  real CLI: `GET /v1/accounts` shows `second` signed in and `main` signed out (or whatever is true),
  one `translator` run (2 lines → hi, es) and one `critic` run on a fixture with an image. No
  docker build.
- **engine-bridge:** `uv run pytest` with a fake `claude`; as a host process on port 18004 in fake
  mode: POST the example brief → SSE until `job.completed` → a valid handoff → `revise` →
  revision 1. Real mode without Claude: prepare a worktree of `engine` (and once with
  `ENGINE_SOURCE=working_tree`) with the environment symlinks, `/readyz` reports `doctor: ok`,
  and `scripts/selftest.sh` passes in the prepared worktree (check memory first). No docker build.
- **youtube:** the container uses `network_mode: host` and
  `CHROME_CDP_URL=http://127.0.0.1:19222`; `bash -n` and shellcheck `chrome-airtime.sh`; run it
  with `--dry-run` only (prints what it would copy and start). Do not start the owner's profile.
- **platform, control, web, scout:** as written, with `DOCKER_CONTEXT=default` and the host
  network.

---

# Airtime — a self-improving YouTube manager for the lockstep engine (batch plan)

## Context

lockstep-studio makes finished vertical explainer Shorts. Today a Claude Code session runs the
`explainer-video` skill (`bin/lockstep new → brief → voice → build`). `foundation-v2` is the
production branch. Another thread is redesigning the engine on a local `engine` branch; its
proposal (`docs/architecture/`, uncommitted) plans a `/v1/jobs` API "for a future dashboard".

You want the second half of the system in the same repo: a YouTube manager that does the following:

- researches what people in about ten high-revenue countries are watching
- decides what to make and hands the engine a rich brief
- scores what comes back and sends it back for up to two rounds of revision
- uploads the best of the three cuts in one click, or on its own
- watches every video's performance and explains why it is or isn't working
- learns from recent results, letting anything older than about two months fade out
- shows all of this, including live engine monitoring, in one dashboard

Your constraints:

- **Free.** No paid services.
- **AI through Claude Code** (Opus 5.5, max effort) on your personal account.
- **YouTube through your own Chrome via the DevTools protocol**, using a scripted, deterministic
  flow with no API.
- **Docker Compose microservices** in this repo, with as little engineering as the job allows.
- **Priorities:** quality first, token use second.

## Decisions

- **Name.** The product is **Airtime**, in a new top-level folder, `airtime/`. The engine's files
  (`bin/ engine/ templates/ assets/ videos/ scripts/ .claude/`) are not touched.
- **Branches.** I push a new `airtime` branch from `origin/foundation-v2`. Every unit opens a PR
  into `airtime`; worker branches are named `airtime-<unit>`, because a branch named `airtime/x`
  can't exist alongside a branch named `airtime`. Merging `airtime` into production later is your
  decision.
- **Docker.** I run `systemctl --user start docker-desktop` before the workers start, and wait
  until `docker info` succeeds.
- **AI.** Every model call is `claude -p` (Claude Code CLI 2.1.x) with `--model claude-opus-5-5
  --effort max`, authenticated by `CLAUDE_CODE_OAUTH_TOKEN` from a one-time `claude setup-token`.
  There are no API keys. Per-role settings live in `airtime/config/roles.yaml`.
- **YouTube.** A Python Playwright service connects over CDP to your real Google Chrome, running a
  dedicated "airtime" profile that you sign in to once by hand. A separate profile is needed
  because Chrome 136+ refuses remote debugging on the default profile, and a manual sign-in avoids
  Google's block on signing in from an automated browser.
  - Upload, metadata, translations, captions, analytics export and YouTube search are fixed scripts
    with their selectors kept in YAML.
  - No AI runs inside these flows. Every step takes a screenshot; a failure stops at
    `needs_attention`.
  - A calibration dry run checks every selector against the real Studio and leaves only a private
    draft.
- **Engine.** An `engine-bridge` service runs the existing skill headlessly, through Claude Code
  in its own git worktree per job. It never runs in your working tree. It implements the engine
  thread's planned `/v1/jobs` API, so the native engine can replace it later without touching the
  other services.
- **Free data sources.**
  - Google Trends trending RSS per country
  - Wikimedia top-viewed articles per country and per language
  - YouTube search autocomplete
  - YouTube search results, read through your Chrome in an isolated, signed-out context
  - Hacker News
  - Claude Code's built-in web search, available inside the AI roles
- **Markets (starting weights).** Re-weighted automatically from your measured views and revenue by
  country.

  | Market | Weight | Languages |
  |---|---|---|
  | US | 0.30 | en |
  | IN | 0.20 | en, hi |
  | GB | 0.10 | en |
  | CA | 0.07 | en, fr |
  | DE | 0.07 | de |
  | AU | 0.06 | en |
  | BR | 0.06 | pt |
  | MX | 0.05 | es |
  | JP | 0.05 | ja |
  | PH | 0.04 | en |

  Titles, descriptions and captions are translated into hi, fr, de, pt, es and ja.

## Architecture

```
 web (React, 127.0.0.1:8080) ──/api──► control (FastAPI · Postgres · scheduler · state machine)
                                          │ HTTP JSON (contracts in airtime/contracts)
        ┌──────────────┬──────────────────┼───────────────────┬──────────────────────┐
        ▼              ▼                  ▼                   ▼                      │
      scout          brain          engine-bridge          youtube ──CDP──► your Chrome (host,
  free trend      claude -p roles   claude -p + skill      Playwright,        "airtime" profile)
  collectors      (Opus 5.5 max)    → lockstep build        deterministic
 Every service mounts $AIRTIME_DATA_DIR at the SAME absolute path as on the host, so a path written by
 one container is valid for every other container and for the host Chrome that uploads the file.
```

### Lifecycle (control)

1. **Research** (cron or button). scout collects signals → brain `ideator` → scout probes YouTube
   demand and competition per market → brain `strategist` → opportunities.
2. **Produce** (button or autopilot). brain `brief_writer` writes a GrowthBrief, rendered in
   `PROMPTING.md` format → engine-bridge job, revision 0.
3. **Score.** brain `critic` scores 8 dimensions from frames, script, QA and the publish kit.
   control computes the `technical` dimension and the weighted total deterministically.
4. **Revise or pass.** A total of 90 or more with no hard-gate failure passes. Otherwise the
   critic's notes, in the timestamped feedback style of `PROMPTING.md`, go to `revise` (round 1),
   and the same again for round 2.
5. **Pick a cut.** After round 2, the highest-scoring cut that passes the hard gates is used. If
   every cut fails a hard gate, the production goes to `needs_attention` instead of uploading.
6. **Finalise.** brain `seo` writes the final title, description, tags and localizations; brain
   `translator` translates the captions. control enforces YouTube's limits and the CC BY credits.
7. **Upload.** youtube uploads the video (then needs your one click unless `auto_upload` is on) and
   adds the localizations and captions, published or scheduled at the main market's prime time.
8. **Monitor.** Analytics checkpoints at 24 h, 72 h, 7 d, 14 d and 28 d. brain `analyst` writes a
   diagnosis; a retention drop is mapped to the script line and beat on screen at that moment.
9. **Learn.** brain `learner` adds, confirms or retires learnings. Each learning's weight is
   confidence × 0.5^(age/21 d), and it retires after 60 d without being confirmed. Rubric weights
   are calibrated against actual results (bounded to ±50 % of their defaults once 8 or more videos
   have data), and market weights are re-fit. All of this feeds back into step 1.

### Autopilot

Settings start from `config/autopilot.yaml` and are editable in the dashboard:

- **Modes:** `off`, `assist` (researches and suggests) and `auto` (the full loop, within daily caps).
- **Schedules:** research every 6 h, autopilot production at 01:30, analytics every 6 h, learning
  at 03:00.
- **Limits:** at most 2 productions a day and one production at a time.
- **Every step also has a manual button.**

## Work units (each is one worker, one worktree, one PR into `airtime`; the paths are disjoint)

| # | Unit | Paths | What it delivers |
|---|---|---|---|
| 1 | Platform & contracts | `airtime/{README.md,compose.yaml,compose.fake.yaml,.env.example,.gitignore,contracts/,config/,docs/,scripts/}` | Compose stack (7 services, healthchecks, same-path data mount, `/repo:ro` for the bridge); fake override; JSON Schemas + examples + `check_contracts.py`; the four config YAMLs; `init.sh` (writes `.env` with absolute paths/uid), `smoke.sh` (full-pipeline smoke on fakes); architecture, engine-contract and runbook docs |
| 2 | control | `airtime/services/control/` | FastAPI + SQLAlchemy 2 + Alembic (Postgres; tests also on SQLite); production/research state machines; APScheduler crons; contract clients for the four services; deterministic scoring, hard gates, calibration, playbook decay, market re-weighting, schedule time, topic de-duplication (rapidfuzz); dashboard REST + SSE; file serving from the data dir with Range support |
| 3 | web | `airtime/services/web/` | Vite + React + TS + Tailwind + TanStack Query + Recharts dashboard. Pages: Overview, Trends & Opportunities, Productions (Brief / Live engine log / Script / Components / Revisions / Publish / Upload log), Channel and video detail (retention chart with script lines overlaid, countries, traffic, diagnosis), Playbook & calibration, Settings & connections. MSW mock mode; nginx image proxying `/api` with SSE |
| 4 | brain | `airtime/services/brain/` | Claude Code runner: 8 roles (prompt, input model and output JSON Schema each); `claude -p --output-format stream-json --json-schema …` run in an empty temp dir; validation plus one repair retry; transcripts and usage ledger; concurrency limit; fake mode with canned outputs |
| 5 | scout | `airtime/services/scout/` | Free collectors (Trends RSS, Wikimedia per country and language, YouTube autocomplete, Hacker News) → SignalPacks with TTL cache; `/v1/probe` (autocomplete + youtube `/v1/search`) → TopicProbes; source health; fixtures and fake mode |
| 6 | youtube | `airtime/services/youtube/` | Playwright over CDP to host Chrome (handles Docker Desktop and Chrome's Host-header check); session/channel check; deterministic upload → details → tags/category/language/altered-content → visibility or schedule → localizations → captions; Studio Advanced-mode CSV export plus best-effort JSON for analytics; signed-out YouTube search; calibration dry run; `scripts/chrome-login.sh`, `scripts/chrome-cdp.sh`; mock-Studio test site; fake mode |
| 7 | engine-bridge | `airtime/services/engine-bridge/` | `/v1/jobs` API per the engine design (create, get, SSE events, revise, cancel, handoff, files); clones the engine from `/repo` and uses one git worktree per job at `ENGINE_REF`; runs the engine's own `bin/lockstep setup --with-asr` into cached dirs; drives `claude -p` with the GrowthBrief and bridge rules; maps tool calls to stages; watches the video folder to stream script, components and QA; builds and validates `handoff.json` (ffprobe, `data/validation.json`, keyframes, thumbnail candidates); snapshots each revision; fake-claude mode |

## End-to-end recipe (each worker runs its own row; it never signs in to or posts to a real
YouTube account, and never starts a real Claude engine job)

Docker Desktop is running (`docker info` succeeds). Use compose project or container names
`airtime-<unit>-*`, only the unit's host ports below, and remove containers when finished.

| Unit | Ports | E2E |
|---|---|---|
| platform | none | `docker compose -f airtime/compose.yaml --env-file airtime/.env.example config -q` (and again with `-f compose.fake.yaml`); `uv run --with jsonschema --with pyyaml python airtime/contracts/check_contracts.py`; `bash -n` and shellcheck on the scripts; `scripts/init.sh --dry-run` |
| control | 18000, 15432 | Postgres 16 container → `uv run pytest` (on Postgres and on SQLite) → `docker build` → run control against pg and the unit's own stub server for scout, brain, engine and youtube (the critic scores 84 → 88 → 91). With curl: POST a production → it reaches `published` with 3 revisions and the right revision chosen → analytics sync → diagnosis → learning → calibration and settings endpoints. Paste the transcript into the PR |
| web | 18080 | `pnpm i && pnpm test && pnpm build`; `pnpm preview` in mock mode; a Playwright script visits every page and tab at 1440×900 and 390×844, fails on console errors and saves screenshots; `docker build` + run + curl `/` |
| brain | 18001 | `uv run pytest` (a fake `claude` on PATH). Live on the host's signed-in `claude`: one `translator` run (2 lines → hi, es) and one `critic` run on a fixture with an image, proving the real CLI's `--json-schema` output and image reading are parsed correctly; then `docker build` + fake-mode container + curl each role |
| scout | 18002 | `uv run pytest` (recorded fixtures); live `collect --markets US,IN` against the real free sources, with a count per source; `docker build` + run + curl `/v1/signals?markets=US,IN` and `/v1/probe` (fake youtube) |
| youtube | 18003, CDP 19222 | `uv run pytest` against the mock Studio, with Playwright's Chromium started with `--remote-debugging-port` and reached over CDP exactly as in production. Fake-mode container: upload a 5-second ffmpeg clip → `published`, with step screenshots. Host path: `google-chrome --headless=new --remote-debugging-port=19222 --user-data-dir=$(mktemp -d)`; the container with `CHROME_CDP_URL=http://host.docker.internal:19222` → `/readyz` reports `reachable:true, logged_in:false`; one live signed-out `/v1/search` returns parsed results |
| engine-bridge | 18004 | `uv run pytest` (fake claude). Fake-mode container with `/repo` mounted: POST the example brief → SSE until `job.completed` → a valid handoff → `revise` → revision 1. Real mode without Claude: startup runs the engine setup, `/readyz` reports `doctor: ok`, and `docker exec` runs `scripts/selftest.sh` in a worktree of `origin/foundation-v2`, which passes |

**After the batch (me, with your OK):**

1. Merge the PRs into `airtime`.
2. Run `airtime/scripts/init.sh`.
3. Run `docker compose -f compose.yaml -f compose.fake.yaml up -d --build && scripts/smoke.sh`,
   which runs research → produce → 2 revisions → upload to the mock → analytics → learning end to
   end on fakes.
4. Screenshot the dashboard, and fix any integration issues in a follow-up PR.
5. The real first run is yours: `scripts/chrome-login.sh`, `claude setup-token`, then a calibration
   dry run.

## Shared worker brief (pasted into every worker prompt, followed by that worker's unit row)

**Goal.** Build Airtime as described above. Build only your unit and stay inside its paths. The
other units are being built in parallel and match the contracts below, so code to the contracts and
stub the other services in your tests.

**Git.** Start from the integration branch:
`git fetch origin && git switch -c airtime-<unit> origin/airtime`. Commit only within your paths.
End each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Open the PR
with `gh pr create --base airtime` and end its body with
`🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Never commit `.env`, tokens or
media. Never edit the engine (`bin/ engine/ templates/ assets/ videos/ scripts/ .claude/`, root
files).

**Stack conventions.**

- **Python services:** Python 3.12, a `uv` project (`pyproject.toml` + `uv.lock`), FastAPI, pydantic
  v2, httpx and ruff. Code goes in `src/<service>/`, tests in `tests/`.
- **Docker image:** `python:3.12-slim-bookworm` plus uv, running as a non-root user with uid/gid
  `${AIRTIME_UID:-1000}`, with a `HEALTHCHECK`.
- **Endpoints:** every service exposes `GET /healthz` returning `{status, service, version}`, and
  `GET /readyz` checking its dependencies.
- **Errors:** `{"error":{"code","message","details"}}`.
- **Config:** environment variables via pydantic-settings, documented in the service's `README.md`.
- **Data:** UTC ISO-8601 times; snake_case JSON; ids are a prefix plus a ULID (`prd_ opp_ brf_ sc_
  upl_ lrn_ run_ job_ syn_`).
- **Fake mode:** `AIRTIME_FAKE=1` means no real Claude, YouTube, engine or network, with realistic,
  schema-valid canned behaviour.
- **Files:** passed between services only as absolute paths under `AIRTIME_DATA_DIR`, which is
  mounted at the same path everywhere. The layout:
  - `engine/` and `artifacts/<job_id>/rev-<n>/` — engine-bridge
  - `publish/<production_id>/` — control
  - `youtube/{screens,downloads,dom}/<task_id>/` — youtube
  - `brain/runs/<run_id>/` — brain
  - `scout/cache.db` — scout

**Services, ports and environment variables.**

| Service | URL | Notes |
|---|---|---|
| control | `control:8000` | Host port 8000 for debugging |
| brain | `brain:8001` | |
| scout | `scout:8002` | |
| youtube | `youtube:8003` | |
| engine-bridge | `engine-bridge:8004` | |
| web | nginx `:80` | Published on host port 8080 |
| postgres | `postgres:5432` | Database `airtime` |

The environment variables:

- `AIRTIME_DATA_DIR`
- `AIRTIME_UID`, `AIRTIME_GID`
- `AIRTIME_FAKE`
- `CLAUDE_CODE_OAUTH_TOKEN`
- `AIRTIME_MODEL` (default `claude-opus-5-5`), `AIRTIME_EFFORT` (default `max`)
- `CHROME_CDP_URL` (default `http://host.docker.internal:9222`)
- `ENGINE_REF` (default `origin/foundation-v2`), `ENGINE_MAX_CONCURRENCY` (default 1),
  `ENGINE_JOB_TIMEOUT_MIN` (default 240)
- `DATABASE_URL`
- `BRAIN_URL`, `SCOUT_URL`, `YOUTUBE_URL`, `ENGINE_URL`
- `AIRTIME_CONFIG_DIR` (default `/config`, which is `airtime/config` mounted read-only)

**Contracts.** These are the canonical shapes. Unit 1 writes them as JSON Schema; every other unit
mirrors them in pydantic models.

- **A. GrowthBrief** (control → engine)
  - `schema_version:"1"`, `brief_id`, `opportunity_id|null`, `created_at`
  - `format: short|long`, `duration_s:{target,max}`
  - `topic`, `angle`, `why_now`, `audience`, `markets:[{code,weight}]`, `language`, `tone:[]`
  - `hook_options:[]`, `title_options:[]`, `keywords:{primary:[],secondary:[]}`
  - `must_include:[]`, `avoid:[]`, `visual_direction`, `give_time_to:[]`, `music_mood`
  - `competitors:[{title,url,views,age_days,duration_s,takeaway}]`
  - `learnings:[{id,statement,weight}]`
  - `rubric:{threshold, dimensions:[{id,weight,what}]}`
  - `engine_request_md`: the brief rendered in the `PROMPTING.md` template — angle, audience,
    platform, tone, visuals, give time to, music, must include, avoid
- **B. ReviewNotes** (critic → engine `revise`)
  - `round`, `score`, `threshold`, `summary`
  - `notes:[{priority,dimension,at_s|null,beat|null,issue,change,expected_gain}]`
  - `keep:[]`
  - `engine_feedback_md`: written in the `PROMPTING.md` "Giving feedback" style, e.g. "0:11, the
    plate shot: show …"
- **C. Handoff** (engine → Airtime, one per revision; the agent writes
  `videos/<slug>/handoff.json`, and the bridge completes and validates it)
  - `schema_version:"1"`, `job_id`, `revision`, `slug`, `status: completed|unfinished`
  - `video:{path,phone_path,duration_s,width,height,fps,size_mb}`
  - `script:{title,text,lines:[{id,beat,text,start_s,end_s}],words_path}`,
    `beats:[{id,start_s,end_s,summary}]`
  - `components:[{name,kind: custom|engine|media|transition|overlay|three,source,used_in:[]}]`
  - `style:{name,palette:{role:hex},fonts:[],path}`
  - `media:[{file,title,licence,author,source_url}]`, `music:{track,credit}`,
    `sources:[{claim,url}]`
  - `qa:{passed,validation_path,summary:{loudness_lufs,true_peak_dbtp,sync_ms,wer_percent,freeze_segments,black_segments,decode_errors,lint_warnings},issues:[]}`
  - `frames:{contact_sheet,keyframes:[{t,path}]}`, `captions:{srt,language}`
  - `publish_kit:{title_options:[],description,tags:[],hashtags:[],category,language,made_for_kids:false,altered_content:false,thumbnail_candidates:[{path,t,why}],chapters:[],credits_text,pinned_comment}`
  - `decisions:[{question,choice,alternatives:[]}]`, `engine:{ref,commit,build_seconds}`, `notes`
  - Engine facts: the final MP4 is `dist/<video.json:output>.mp4`, the phone copy comes from
    `bin/lockstep share`, QA is in `data/validation.json`, timings in `data/words.json`, captions in
    `dist/subtitles.srt`, the contact sheet in `dist/contact_sheet.jpg`, credits in
    `media/credits.json` and `docs/credits.md`, and sources in `docs/sources.md`.
- **D. Engine job API** (engine-bridge; mirrors the engine design §3.8)
  - Endpoints:
    - `POST /v1/jobs {request_id, brief, options:{engine_ref?}}` → `201 {job_id,state}`
    - `GET /v1/jobs/{id}` → `Job`
    - `GET /v1/jobs?state=&limit=`
    - `GET /v1/jobs/{id}/events?after=<seq>` (SSE), plus `/events.json` for polling
    - `POST /v1/jobs/{id}/revise {notes: ReviewNotes}` → `202 {revision}`
    - `POST /v1/jobs/{id}/cancel`
    - `GET /v1/jobs/{id}/revisions/{n}/handoff`
    - `GET /v1/jobs/{id}/files/{path}` (Range)
    - `GET /v1/engine` → `{ref,commit,doctor,queue}`
  - `Job` fields:
    - `job_id`, `request_id`
    - `state: queued|preparing|running|revising|packaging|completed|failed|cancelled`
    - `stage: briefing|media|scripting|voicing|scenes|rendering|qa|packaging|null`
    - `revision`, `revisions:[{revision,state,started_at,finished_at}]`
    - `slug`, `error`
    - `claude:{session_id,model,effort,turns,usage,duration_ms}`
  - `JobEvent` fields: `{seq,ts,job_id,revision,type,stage,data}`, where `type` is one of:
    - `job.state_changed`, `stage.changed`
    - `agent.message`, `agent.tool`
    - `file.changed`, `script.updated`, `components.updated`
    - `qa.result`, `artifact.created`
    - `revision.completed`
    - `job.completed`, `job.failed`, `job.cancelled`
    - `log`
- **E. Brain runs**
  - `POST /v1/runs {role,input,files:[abs paths],wait:true,timeout_s?,options:{model?,effort?}}` →
    `BrainRun {run_id,role,state: queued|running|succeeded|failed,output,error,usage:{input_tokens,output_tokens,cache_read_input_tokens,cache_creation_input_tokens},model,effort,num_turns,duration_ms,session_id,created_at,finished_at}`
  - `GET /v1/runs/{id}`, `GET /v1/runs?role=&limit=`, `GET /v1/runs/{id}/transcript`,
    `GET /v1/roles`, `GET /v1/usage?since=`
- **F. Role outputs**
  - `ideator` → `{candidates:[{topic,angle,queries:[{market,language,query}],source_items:[],why}]}`
    (at most 15)
  - `strategist` → `{opportunities:[{topic,angle,format,markets:[{code,weight,evidence:[]}],scores:{demand,timeliness,competition_gap,channel_fit,revenue_potential,explainability},priority,evidence:[{source,title,url,metric}],why,risks:[],expires_in_days}]}`
    (at most 5, every score 0–100)
  - `brief_writer` → a GrowthBrief without its ids, timestamps and rubric
  - `critic` → `{dimensions:[{id,score,evidence,issues:[]}] (all except technical), review_notes:{summary,notes,keep,engine_feedback_md}, predicted:{avg_view_pct,viewed_vs_swiped_pct}}`
  - `seo` → `{title,title_alternates:[],description,tags:[],hashtags:[],category,default_language,localizations:[{language,title,description}],thumbnail:{path,why},pinned_comment,schedule:{market,why}}`
  - `translator` → `{translations:[{language,lines:[{i,text}]}]}`
  - `analyst` → Diagnosis: `{video_id,as_of,verdict: outperforming|on_track|underperforming|too_early,percentile_vs_channel,primary_cause: hook|packaging|topic_demand|retention_midroll|distribution|timing|market_mismatch|unknown,findings:[{metric,value,baseline,interpretation}],retention_drops:[{t_s,drop_pct,line_id,beat,on_screen}],actions:[],hypotheses:[{statement,confidence}]}`
  - `learner` → `{add:[{scope,statement,evidence:[],effect,confidence,applies_to:[]}],confirm:[ids],retire:[{id,why}]}`
- **G. Scout**
  - `GET /v1/signals?markets=&max_age_h=` → `{packs:[{market,collected_at,items:[{source,title,url,language,rank,metric:{name,value},first_seen,category}],errors:[]}]}`
  - `POST /v1/probe {queries:[{query,market,language}],max_results}` →
    `{probes:[{query,market,language,probed_at,results:[{video_id,title,channel,views,age_days,duration_s,is_short}],stats:{result_count,median_views,recent_breakouts,shorts_share},suggestions:[]}]}`
  - `GET /v1/sources`
- **H. YouTube**
  - `GET /v1/session` → `{chrome:{reachable,version},youtube:{logged_in,channel_id,channel_name}}`
  - Upload:
    - `POST /v1/uploads {upload_id,video_path,title,description,tags,thumbnail_path?,category,language,made_for_kids,altered_content,playlist?,visibility: public|unlisted|private,schedule_at?,captions:[{language,path}],localizations:[{language,title,description}],dry_run}`
    - `GET /v1/uploads/{id}` →
      `{upload_id,state: queued|running|scheduled|published|failed|needs_attention,video_id,url,steps:[{name,ok,screenshot,at,detail}],error}`
  - Analytics:
    - `POST /v1/analytics/sync {period: last_7_days|last_28_days|last_90_days|lifetime, video_ids?}`
      → `{sync_id}`
    - `GET /v1/analytics/sync/{id}` →
      `{state,snapshot:{taken_at,period:{start,end},channel:{subscribers,views,watch_hours,estimated_revenue_usd},videos:[{video_id,title,published_at,is_short,metrics:{views,engaged_views,watch_hours,avg_view_duration_s,avg_view_pct,impressions,ctr_pct,viewed_vs_swiped_pct,likes,comments,shares,subscribers_gained,estimated_revenue_usd,rpm_usd},by_country:[{country,views,watch_hours,estimated_revenue_usd}],traffic_sources:[{source,views}],retention:[{t_ratio,audience_watch_ratio}]}],missing:[]}}`
      (any metric may be null)
  - Search and calibration:
    - `POST /v1/search {query,market,language,filters:{upload_date,type,sort}}` → the `results` and
      `stats` of a TopicProbe
    - `POST /v1/calibrate` → `{steps:[{name,selector,ok,screenshot}]}`
- **I. Control API for web**
  - Overview: `GET /api/overview` →
    `{pipeline:{active:[ProductionSummary],queued,next_runs:[{job,at}],last_research_at},channel:{connected,channel_name,subscribers,views_28d,watch_hours_28d,revenue_28d_usd,rpm_28d_usd},markets:[{code,name,weight,views_28d,revenue_28d_usd}],alerts:[{level,message,link}]}`
  - Opportunities and research:
    - `GET /api/opportunities?status=&market=`
    - `POST /api/opportunities/{id}/produce|dismiss`
    - `POST /api/research/run`
    - `GET /api/signals?market=`
  - Productions:
    - `POST /api/productions {topic,angle?,markets?,notes?}`
    - `GET /api/productions?state=`
    - `GET /api/productions/{id}` → ProductionDetail:
      `{…summary,opportunity,brief,engine:{job_id,state,stage,revision,claude},revisions:[{revision,state,handoff,scorecard}],chosen_revision,final_kit,upload,error,timeline:[{at,state,note}]}`
    - `GET /api/productions/{id}/live?after=` (proxied JobEvents, SSE)
    - `POST /api/productions/{id}/revise|rescore|cancel|upload`
    - `POST /api/productions/{id}/choose {revision}`
    - `PUT /api/productions/{id}/final-kit`
  - Channel and analytics:
    - `GET /api/videos`
    - `GET /api/videos/{id}` (snapshots, by_country, traffic, retention, script_lines, diagnosis)
    - `POST /api/analytics/sync`
  - Playbook:
    - `GET /api/learnings` (including current_weight and expires_in_days)
    - `PATCH /api/learnings/{id}`
    - `GET /api/calibration`
  - Settings and status:
    - `GET|PUT /api/settings`
    - `GET /api/status`
  - Streams and files:
    - `GET /api/events` (SSE `{seq,at,type,production_id,data}`)
    - `GET /api/files?path=` (Range; only under the data dir)
  - Production states: `queued`, `briefing`, `producing`, `scoring`, `revising`, `finalizing`,
    `awaiting_approval`, `uploading`, `scheduled`, `published`, `monitoring`, `done`, `failed`,
    `cancelled`, `needs_attention`
- **J. Config files** (`airtime/config/`)
  - `markets.yaml`: `{code,name,languages,tz,prime_time,weight,rpm_index,enabled}` for the ten
    markets above
  - `rubric.yaml`: threshold 90 and max_rounds 2, with these dimensions:
    - hook 15
    - retention 15
    - visuals 15
    - demand 15
    - packaging 10
    - seo 10
    - accuracy 10
    - technical 5 (deterministic)
    - policy 5

    Hard gates are technical ≥ 60, accuracy ≥ 70 and policy ≥ 70. A failed gate caps the total
    at threshold − 1. Calibration needs at least 8 videos, moves a weight by at most ±50 % and uses
    a 60-day window.
  - `autopilot.yaml`:
    - `mode: assist`, `auto_upload: false`, `upload_visibility: public`
    - Schedules: `research_cron "0 */6 * * *"`, `production_cron "30 1 * * *"`,
      `analytics_cron "15 */6 * * *"`, `learning_cron "0 3 * * *"`
    - Limits: `max_productions_per_day 2`, `max_concurrent 1`
    - Timing: `schedule_strategy market_prime_time`, `half_life_days 21`, `max_age_days 60`,
      `signal_max_age_days 14`, `topic_cooldown_days 45`
  - `roles.yaml`: the defaults are `{model: claude-opus-5-5, effort: max, max_turns, timeout_s}`,
    with these tools per role:
    - ideator, strategist, brief_writer: WebSearch, WebFetch
    - critic, analyst: Read
    - seo, translator, learner: none

**Token rules, keeping quality first.**

- Every brain run happens in an empty temp dir, with its input files copied in so the Read tool
  can open them, and with `--setting-sources ""`, the role's minimal
  `--tools` list and `--exclude-dynamic-system-prompt-sections`. The role prompt goes in as a
  stable `--append-system-prompt-file` so the prompt cache is reused.
- Inputs are compact JSON with only the top-K items.
- Images go in as one contact sheet plus at most 8 keyframes at 540×960 JPEG.
- `--json-schema` structures every output.
- Results are cached by input hash.

## Worker instructions (verbatim, appended to every worker prompt)

```
After you finish implementing the change:
1. **Code review** — Invoke the `Skill` tool with `skill: "code-review"` to find correctness bugs (it reports findings; it does not edit code). Fix any findings it surfaces before continuing.
2. **Run unit tests** — Run the project's test suite (check for package.json scripts, Makefile targets, or common commands like `npm test`, `bun test`, `pytest`, `go test`). If tests fail, fix them.
3. **Test end-to-end** — Follow the e2e test recipe from the coordinator's prompt (below). If the recipe says to skip e2e for this unit, skip it.
4. **Commit and push** — Commit all changes with a clear message, push the branch, and create a PR with `gh pr create`. Use a descriptive title. If `gh` is not available or the push fails, note it in your final message.
5. **Report** — End with a single line: `PR: <url>` so the coordinator can track it. If no PR was created, end with `PR: none — <reason>`.
```

## Risks

- **Studio's interface changes.** Mitigated by YAML selectors with fallbacks, English UI forced
  with `hl=en`, a screenshot and DOM dump at every step, `needs_attention` instead of guessing, and
  a calibration dry run.
- **YouTube's terms discourage automated access.** Keep the volume to a person's pace (2 uploads
  a day at most by default).
- **The remote-debugging port controls a signed-in browser.** Keep it on loopback only; the
  scripts never bind it to 0.0.0.0.
- **Subscription usage limits, not money, cap throughput.** The daily caps and one-at-a-time engine
  runs keep it within them.
- **Shorts earn far less per view than long-form.** Briefs already carry `format`, so long-form
  can be added once the engine has a 16:9 output.
- **The engine thread keeps changing its branch.** The bridge reads the engine only through its
  own clone at `ENGINE_REF` and the handoff contract, which is documented in
  `airtime/docs/engine-contract.md` so the engine can produce it natively.
