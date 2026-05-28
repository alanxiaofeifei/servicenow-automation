#!/usr/bin/env bash
set -Eeuo pipefail

# Build a portable Windows/WSL release-candidate archive for supervised local testing.
# Keep this script free of ServiceNow URLs, ticket IDs, cookies, sessions, and field values.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSION="${SDA_RELEASE_VERSION:-v0.1.0-rc.1}"
PACKAGE_NAME="servicenow-automation-windows-${VERSION}"
RELEASE_ROOT="${SDA_RELEASE_ROOT:-$PROJECT_DIR/dist/release}"
STAGE_DIR="$RELEASE_ROOT/$PACKAGE_NAME"
ARCHIVE_PATH="$RELEASE_ROOT/$PACKAGE_NAME.zip"
CHECKSUM_PATH="$ARCHIVE_PATH.sha256"

RSYNC_SAFETY_EXCLUDES=(
  --exclude '.git'
  --exclude '.git/'
  --exclude '.codegraph'
  --exclude '.codegraph/'
  --exclude '.local'
  --exclude '.local/'
  --exclude '.auth/'
  --exclude '.env'
  --exclude '.env.*'
  --exclude 'node_modules/'
  --exclude 'dist/'
  --exclude 'build/'
  --exclude 'release/'
  --exclude 'private/'
  --exclude 'coverage/'
  --exclude 'logs/'
  --exclude 'browser-profiles/'
  --exclude 'servicenow-browser-profiles/'
  --exclude 'screenshots/'
  --exclude 'drafts/'
  --exclude 'field-test-results/'
  --exclude 'field-test-notes/'
  --exclude 'playwright-report/'
  --exclude 'test-results/'
  --exclude '.local-downloads/'
  --exclude '.local-screenshots/'
  --exclude '.local-traces/'
  --exclude 'storage-state*.json'
  --exclude 'storageState.json'
  --exclude '*.cookies.json'
  --exclude '*.session.json'
  --exclude '*.har'
  --exclude '*.trace'
  --exclude '*.webm'
  --exclude '*.mp4'
  --exclude '*.mov'
  --exclude '*.png'
  --exclude '*.jpg'
  --exclude '*.jpeg'
  --exclude '*.gif'
  --exclude '*.webp'
  --exclude '*.zip'
  --exclude '*.7z'
  --exclude '*.tar'
  --exclude '*.gz'
  --exclude '*.sqlite'
  --exclude '*.sqlite3'
  --exclude '*.db'
  --exclude '*.log'
  --exclude '*.pem'
  --exclude '*.key'
  --exclude '*.pfx'
  --exclude '*.p12'
  --exclude '*.wav'
  --exclude '*.mp3'
  --exclude '*.m4a'
  --exclude '*.aac'
  --exclude '*.flac'
  --exclude '*.ogg'
)

FORBIDDEN_ARCHIVE_DIR_PATTERN='(^|/)(\.git|\.local|\.codegraph|\.auth|node_modules|dist|build|release|private|coverage|logs|browser-profiles|servicenow-browser-profiles|screenshots|drafts|field-test-results|field-test-notes|playwright-report|test-results|\.local-downloads|\.local-screenshots|\.local-traces)(/|$)'
FORBIDDEN_ARCHIVE_FILE_PATTERN='(^|/)(storage-state[^/]*\.json|storageState\.json|[^/]*\.(cookies|session)\.json|[^/]*\.(har|trace|webm|mp4|mov|png|jpg|jpeg|gif|webp|zip|7z|tar|gz|sqlite|sqlite3|db|log|pem|key|pfx|p12|wav|mp3|m4a|aac|flac|ogg))$'

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $name" >&2
    return 1
  fi
}

write_start_here() {
  cat > "$STAGE_DIR/START-HERE-WINDOWS.txt" <<'START_HERE'
ServiceNow Automation Windows Operator Preview

This release candidate is for supervised local testing only.
It does not approve live ServiceNow operation.

Forbidden during this test:
- automatic login
- Save / Submit / Update / Resolve / Close
- upload / email / bulk action
- ServiceNow API write
- production or production-shadow write
- screenshots / HAR / trace / video capture from real ServiceNow pages
- cookies / sessions / storage-state export
- raw QA URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values

Quick test path:

1. Extract this zip into WSL, ideally:
   $HOME/projects/servicenow-automation

2. From WSL inside the extracted folder, run the dependency/readiness check:
   SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh

3. From Windows, double-click:
   scripts\windows\Start-ServiceNow-Automation.cmd

4. If your extracted folder is not $HOME/projects/servicenow-automation, set this Windows environment variable before double-clicking:
   set SDA_WSL_PROJECT_DIR=/your/wsl/path/to/servicenow-automation

5. For dedicated browser smoke, use about:blank only. Stop before any real ServiceNow login or field interaction unless a separate checkpoint explicitly approves it.

6. If the app does not start, copy only the visible error text and the startup log path. Do not paste ServiceNow URLs, ticket data, cookies, sessions, HARs, screenshots, or real field values.
START_HERE
}

verify_archive_listing() {
  local archive="$1"
  local listing="$RELEASE_ROOT/$PACKAGE_NAME.zip.listing.txt"
  unzip -Z1 "$archive" > "$listing"

  if grep -E "$FORBIDDEN_ARCHIVE_DIR_PATTERN" "$listing" >/dev/null; then
    echo "ERROR: archive contains forbidden generated/private directories." >&2
    grep -E "$FORBIDDEN_ARCHIVE_DIR_PATTERN" "$listing" >&2
    return 1
  fi

  if grep -Ei "$FORBIDDEN_ARCHIVE_FILE_PATTERN" "$listing" >/dev/null; then
    echo "ERROR: archive contains forbidden binary/media/archive/runtime artifact names." >&2
    grep -Ei "$FORBIDDEN_ARCHIVE_FILE_PATTERN" "$listing" >&2
    return 1
  fi

  rm -f "$listing"
}

main() {
  cd "$PROJECT_DIR"

  require_command pnpm
  require_command rsync
  require_command zip
  require_command sha256sum
  require_command unzip

  echo "Building desktop artifacts..."
  pnpm install --frozen-lockfile
  pnpm --filter @servicenow-automation/desktop build

  echo "Preparing release stage: $STAGE_DIR"
  rm -rf "$STAGE_DIR" "$ARCHIVE_PATH" "$CHECKSUM_PATH"
  mkdir -p "$STAGE_DIR" "$RELEASE_ROOT"

  copy_path() {
    local rel="$1"
    if [ ! -e "$PROJECT_DIR/$rel" ]; then
      echo "ERROR: release input missing: $rel" >&2
      return 1
    fi
    if [ -d "$PROJECT_DIR/$rel" ]; then
      mkdir -p "$STAGE_DIR/$rel"
      rsync -a \
        "${RSYNC_SAFETY_EXCLUDES[@]}" \
        "$PROJECT_DIR/$rel/" "$STAGE_DIR/$rel/"
      return 0
    fi

    mkdir -p "$STAGE_DIR/$(dirname "$rel")"
    rsync -a "$PROJECT_DIR/$rel" "$STAGE_DIR/$rel"
  }

  for rel in \
    package.json \
    pnpm-lock.yaml \
    pnpm-workspace.yaml \
    README.md \
    README.en-US.md \
    README.zh-CN.md \
    apps/desktop \
    packages/core \
    packages/adapters \
    packages/ai \
    packages/kb \
    packages/profiles \
    scripts/windows \
    scripts/wsl \
    scripts/local-cdp-bridge.py \
    scripts/packaging \
    docs/field-trial/windows-operator-quickstart.md \
    docs/releases \
    docs/en-US/user-guide.md \
    docs/en-US/demo-script.md \
    docs/en-US/security-and-compliance.md \
    docs/zh-CN/user-guide.md \
    docs/zh-CN/demo-script.md \
    docs/zh-CN/security-and-compliance.md \
    docs/security-and-compliance.md; do
    copy_path "$rel"
  done

  write_start_here

  echo "Creating archive: $ARCHIVE_PATH"
  (cd "$RELEASE_ROOT" && zip -qr "$PACKAGE_NAME.zip" "$PACKAGE_NAME")

  verify_archive_listing "$ARCHIVE_PATH"

  (cd "$RELEASE_ROOT" && sha256sum "$PACKAGE_NAME.zip" > "$PACKAGE_NAME.zip.sha256")

  echo "Release archive ready: $ARCHIVE_PATH"
  echo "Checksum ready: $CHECKSUM_PATH"
  cat "$CHECKSUM_PATH"
}

main "$@"
