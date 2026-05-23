#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=operator-env.sh
. "$SCRIPT_DIR/operator-env.sh"

LOG_DIR="${SDA_STARTUP_LOG_DIR:-$SDA_PROJECT_DIR/.local/startup-logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/desktop-start-$(date +%Y%m%d-%H%M%S).log"
touch "$LOG_FILE"

on_exit() {
  local exit_code=$?
  echo
  if [ "$exit_code" -eq 0 ]; then
    echo "ServiceNow Automation exited normally."
  else
    echo "ServiceNow Automation exited with code $exit_code."
  fi
  echo "Startup log: $LOG_FILE"
  echo "Windows log path: $(sda_to_unc_path "$LOG_FILE")"
}
trap on_exit EXIT

exec > >(tee -a "$LOG_FILE") 2>&1

echo "Starting ServiceNow Automation desktop operator..."
echo "This launcher uses a WSL bootstrap script instead of inline shell commands."
echo "Startup log: $LOG_FILE"
echo "Windows log path: $(sda_to_unc_path "$LOG_FILE")"
echo

cd "$SDA_PROJECT_DIR"
sda_load_node_runtime
sda_require_node
sda_ensure_desktop_dependencies
sda_ensure_desktop_build
sda_print_runtime_summary

if [ "${SDA_LAUNCH_DRY_RUN:-0}" = "1" ]; then
  echo
  echo "Dry run complete: Electron launch skipped because SDA_LAUNCH_DRY_RUN=1."
  exit 0
fi

echo
echo "Launching Electron desktop app..."
echo "Keep this Windows command window open while the app is running."
echo

cd "$SDA_DESKTOP_DIR"
"$(sda_desktop_electron_bin)" .
