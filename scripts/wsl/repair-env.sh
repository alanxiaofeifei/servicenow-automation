#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=operator-env.sh
. "$SCRIPT_DIR/operator-env.sh"

LOG_DIR="${SDA_STARTUP_LOG_DIR:-$SDA_PROJECT_DIR/.local/startup-logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/repair-env-$(date +%Y%m%d-%H%M%S).log"
touch "$LOG_FILE"

on_exit() {
  local exit_code=$?
  echo
  if [ "$exit_code" -eq 0 ]; then
    echo "Repair check completed successfully."
  else
    echo "Repair check failed with code $exit_code."
  fi
  echo "Repair log: $LOG_FILE"
  echo "Windows log path: $(sda_to_unc_path "$LOG_FILE")"
}
trap on_exit EXIT

exec > >(tee -a "$LOG_FILE") 2>&1

echo "Repairing/checking ServiceNow Automation desktop operator environment..."
echo "Repair log: $LOG_FILE"
echo "Windows log path: $(sda_to_unc_path "$LOG_FILE")"
echo

cd "$SDA_PROJECT_DIR"
sda_load_node_runtime
sda_require_node
sda_ensure_pnpm
sda_ensure_desktop_dependencies

echo "Building desktop artifacts..."
pnpm --filter @servicenow-automation/desktop build

echo
sda_print_runtime_summary
echo
echo "PASS: desktop operator environment is ready for Windows double-click launch."
