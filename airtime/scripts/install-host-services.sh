#!/usr/bin/env bash
# Install the systemd --user units for Airtime's two host services (brain, engine-bridge).
# They run on the host, not in Docker, because they drive the host's Claude Code CLI.
#   install-host-services.sh [--dry-run | --uninstall]
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
SERVICES=(brain engine-bridge)
mode=${1:-install}

unit() {
  cat <<UNIT
[Unit]
Description=Airtime $1 (host service: drives the host's Claude Code)
Documentation=file://$ROOT/docs/runbook.md
After=network-online.target

[Service]
Type=exec
ExecStart=$ROOT/scripts/airtime serve $1
Restart=on-failure
RestartSec=5
# engine-bridge supervises long Claude sessions and renders: give it time to stop them cleanly.
KillMode=mixed
TimeoutStopSec=90

[Install]
WantedBy=default.target
UNIT
}

case $mode in
  --dry-run)
    for svc in "${SERVICES[@]}"; do echo "── would write $UNIT_DIR/airtime-$svc.service"; unit "$svc"; done ;;
  --uninstall)
    for svc in "${SERVICES[@]}"; do
      systemctl --user disable --now "airtime-$svc.service" 2>/dev/null || true
      rm -f "$UNIT_DIR/airtime-$svc.service"
    done
    systemctl --user daemon-reload ;;
  install)
    mkdir -p "$UNIT_DIR"
    for svc in "${SERVICES[@]}"; do unit "$svc" >"$UNIT_DIR/airtime-$svc.service"; done
    systemctl --user daemon-reload
    systemctl --user enable "${SERVICES[@]/#/airtime-}" >/dev/null 2>&1 || true
    echo "› installed and enabled airtime-brain and airtime-engine-bridge (systemd --user); start them with: airtime/scripts/airtime up" ;;
  *) echo "usage: $0 [--dry-run | --uninstall]" >&2; exit 2 ;;
esac
