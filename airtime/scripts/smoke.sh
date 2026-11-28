#!/usr/bin/env bash
# smoke.sh — the whole Airtime pipeline end to end in fake mode: research → production → revisions
# → upload to the fake Studio → analytics → diagnosis → learning. No real Claude, YouTube, engine or
# network. Starts the `airtime-fake` stack on a fresh database and data folder, and stops it again
# unless --keep is given.
#   airtime/scripts/airtime smoke [--keep]
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
CLI="$ROOT/scripts/airtime"
KEEP=0
[[ ${1:-} == --keep ]] && KEEP=1
export DOCKER_CONTEXT="${DOCKER_CONTEXT:-default}"

[[ -f $ROOT/.env.fake ]] || "$CLI" init
set -a
# shellcheck disable=SC1091
source "$ROOT/.env.fake"
set +a
API="http://127.0.0.1:${CONTROL_PORT:-8000}/api"
WEB="http://127.0.0.1:${WEB_PORT:-8080}"

step() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
fail() { echo "SMOKE FAILED: $*" >&2; exit 1; }
api() {  # api <METHOD> <path> [json]
  local method=$1 path=$2 body=${3:-}
  if [[ -n $body ]]; then
    curl -fsS -m 120 -X "$method" -H 'content-type: application/json' -d "$body" "$API$path"
  else
    curl -fsS -m 120 -X "$method" "$API$path"
  fi
}
wait_until() {  # wait_until <seconds> <what> <command that succeeds when done>
  local limit=$1 what=$2 deadline=$((SECONDS + $1)); shift 2
  until "$@" >/dev/null 2>&1; do
    ((SECONDS < deadline)) || fail "timed out after ${limit}s waiting for $what"
    sleep 3
  done
}
finish() {
  local status=$?
  if ((KEEP == 0)); then "$CLI" --fake down >/dev/null 2>&1 || true; fi
  ((status == 0)) && echo "SMOKE PASSED" || echo "logs: airtime/scripts/airtime --fake logs <service>"
}
trap finish EXIT

step "fresh fake stack"
"$CLI" --fake down >/dev/null 2>&1 || true
docker volume rm -f airtime-fake_pgdata >/dev/null 2>&1 || true
rm -rf "${AIRTIME_DATA_DIR:?}"
mkdir -p "$AIRTIME_DATA_DIR"
"$CLI" --fake up
curl -fsS -m 10 "$WEB/" >/dev/null || fail "the dashboard does not answer at $WEB"
api GET /status | jq -c '{services: (.services | map_values(.ok))}'

step "research"
api POST /research/run '{}' | jq -c .
opportunities() { api GET '/opportunities' | jq -e 'if type == "array" then . else .items end | length > 0'; }
wait_until 300 "opportunities" opportunities
OPP="$(api GET '/opportunities' | jq -r 'if type == "array" then . else .items end | .[0].opportunity_id // .[0].id')"
echo "opportunity: $OPP"

step "production"
PRD="$(api POST "/opportunities/$OPP/produce" '{}' | jq -r '.production_id // .id')"
[[ $PRD == prd_* ]] || fail "produce did not return a production id: $PRD"
echo "production: $PRD"
state() { api GET "/productions/$PRD" | jq -r '.state'; }
settled() { [[ $(state) =~ ^(awaiting_approval|uploading|scheduled|published|monitoring|done|needs_attention|failed|cancelled)$ ]]; }
wait_until 900 "the production to settle" settled
api GET "/productions/$PRD" | jq -c '{state, attention_reason, chosen_revision,
  revisions: [.revisions[] | {revision, total: .scorecard.total, gates: .scorecard.gates_passed}]}'
[[ $(state) =~ ^(failed|cancelled|needs_attention)$ ]] && fail "production ended in $(state)"

if [[ $(state) == awaiting_approval ]]; then
  step "upload (the owner's one click)"
  api POST "/productions/$PRD/upload" '{}' | jq -c '{state}'
fi
uploaded() { [[ $(state) =~ ^(scheduled|published|monitoring|done)$ ]]; }
wait_until 300 "the upload" uploaded
api GET "/productions/$PRD" | jq -c '{state, upload: {video_id: .upload.video_id, attempts: (.upload.attempts | length)}}'

step "analytics"
api POST /analytics/sync '{"period":"last_28_days"}' | jq -c .
videos() { api GET /videos | jq -e 'if type == "array" then . else .items end | length > 0'; }
wait_until 300 "analytics for the video" videos
VID="$(api GET /videos | jq -r 'if type == "array" then . else .items end | .[0].video_id')"
api GET "/videos/$VID" | jq -c '{video_id, views: (.snapshots[-1].metrics.views // .metrics.views // null), diagnosis: (.diagnosis.verdict // null)}'

step "learning"
api POST /learning/run '{}' | jq -c . || fail "learning run failed"
api GET /learnings | jq -c 'if type == "array" then . else .items end | length as $n | {learnings: $n}'
api GET /calibration | jq -c 'keys'

step "events"
curl -fsS -m 5 -N "$API/events?after=0" 2>/dev/null | head -c 600 || true
echo
