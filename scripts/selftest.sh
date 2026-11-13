#!/usr/bin/env bash
# End-to-end check of the installation: scaffold the template video in a temporary
# folder, record its narration, and run the whole build on it (about two minutes).
#
#   scripts/selftest.sh            build, print the verdict, delete the temporary folder
#   scripts/selftest.sh --keep     leave the folder in place and print where it is
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEEP=0; [ "${1:-}" = "--keep" ] && KEEP=1
TMP="$(mktemp -d "${TMPDIR:-/tmp}/lockstep-selftest.XXXXXX")"
cleanup() { if [ "$KEEP" = 0 ]; then rm -rf "$TMP"; fi; }
trap cleanup EXIT

python3 "$REPO/engine/new_video.py" selftest "Lockstep Self-Test" --into "$TMP" >/dev/null
V="$TMP/selftest"
echo "== voice";  "$REPO/bin/lockstep" voice "$V" | head -1
"$REPO/bin/lockstep" build "$V" --preset veryfast --crf 20
if [ "$KEEP" = 1 ]; then echo "kept: $V  (video in $V/dist/)"; fi
echo "selftest passed."
