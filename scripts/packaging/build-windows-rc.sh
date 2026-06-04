#!/usr/bin/env bash
set -Eeuo pipefail

# Build a real packaged Windows release-candidate artifact for supervised local testing.
# Keep this script free of ServiceNow URLs, ticket IDs, cookies, sessions, and field values.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSION="${SDA_RELEASE_VERSION:-v0.1.0-rc.1}"
PACKAGE_NAME="servicenow-automation-windows-${VERSION}"
RELEASE_ROOT="${SDA_RELEASE_ROOT:-$PROJECT_DIR/dist/release}"
ARCHIVE_PATH="$RELEASE_ROOT/$PACKAGE_NAME.zip"
CHECKSUM_PATH="$ARCHIVE_PATH.sha256"
START_HERE_PATH="$RELEASE_ROOT/$PACKAGE_NAME-START-HERE-WINDOWS.txt"
DESKTOP_DIST_DIR="$PROJECT_DIR/apps/desktop/dist/windows"

FORBIDDEN_ARCHIVE_DIR_PATTERN='(^|/)(\.git|\.local|\.codegraph|\.auth|private|coverage|logs|browser-profiles|servicenow-browser-profiles|screenshots|drafts|field-test-results|field-test-notes|playwright-report|test-results|\.local-downloads|\.local-screenshots|\.local-traces)(/|$)'
FORBIDDEN_ARCHIVE_FILE_PATTERN='(^|/)(storage-state[^/]*\.json|storageState\.json|[^/]*\.(cookies|session)\.json|[^/]*\.(har|trace|webm|mp4|mov|png|jpg|jpeg|gif|webp|7z|tar|gz|sqlite|sqlite3|db|log|pem|key|pfx|p12|wav|mp3|m4a|aac|flac|ogg))$'

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $name" >&2
    return 1
  fi
}

write_start_here() {
  cat > "$START_HERE_PATH" <<'START_HERE'
ServiceNow Automation Windows Operator Preview

This release candidate is for supervised local testing of a packaged Windows artifact.
It does not approve live ServiceNow operation.

## Critical restriction
No Save / Submit / Update / Resolve / Close automation.

Full forbidden list during this test:
- automatic login
- Save / Submit / Update / Resolve / Close (repeated for emphasis)
- upload / email / bulk action
- ServiceNow API write
- production or production-shadow write
- screenshots / HAR / trace / video capture from real ServiceNow pages
- cookies / sessions / storage-state export
- raw QA URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values

Quick test path:

1. Extract this zip on Windows.
2. Double-click the packaged ServiceNow Automation executable.
3. Use mock/demo workflows first.
4. For dedicated browser smoke, use about:blank only and confirm the dedicated profile is tool-owned.
5. Stop before any real ServiceNow login or field interaction unless a separate checkpoint explicitly approves it.
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
    echo "ERROR: archive contains forbidden sensitive/runtime artifact names." >&2
    grep -Ei "$FORBIDDEN_ARCHIVE_FILE_PATTERN" "$listing" >&2
    return 1
  fi

  if ! grep -Eq '(^|/)resources/app\.asar$' "$listing"; then
    echo "ERROR: packaged Electron app.asar missing from Windows artifact." >&2
    return 1
  fi

  if ! grep -Eq '(^|/)resources/scripts/windows/start-dedicated-chromium-cdp\.ps1$' "$listing"; then
    echo "ERROR: packaged Windows CDP helper missing from Windows artifact." >&2
    return 1
  fi

  if ! grep -Eq '(^|/)resources/scripts/local-cdp-bridge\.py$' "$listing"; then
    echo "ERROR: packaged local CDP bridge missing from Windows artifact." >&2
    return 1
  fi

  rm -f "$listing"
}

find_packaged_windows_zip() {
  local artifact_count
  artifact_count="$(find "$DESKTOP_DIST_DIR" -maxdepth 1 -type f -name '*.zip' | wc -l | tr -d ' ')"
  if [ "$artifact_count" != "1" ]; then
    echo "ERROR: expected exactly one Electron Builder Windows zip in $DESKTOP_DIST_DIR; found $artifact_count." >&2
    find "$DESKTOP_DIST_DIR" -maxdepth 1 -type f -name '*.zip' >&2 || true
    return 1
  fi

  find "$DESKTOP_DIST_DIR" -maxdepth 1 -type f -name '*.zip' | head -n 1
}

main() {
  cd "$PROJECT_DIR"

  require_command pnpm
  require_command zip
  require_command sha256sum
  require_command unzip

  echo "Building packaged desktop Windows artifact..."
  pnpm install --frozen-lockfile
  rm -rf "$DESKTOP_DIST_DIR"
  pnpm --filter @servicenow-automation/desktop package:windows

  echo "Preparing release output: $RELEASE_ROOT"
  rm -rf "$ARCHIVE_PATH" "$CHECKSUM_PATH" "$START_HERE_PATH"
  mkdir -p "$RELEASE_ROOT"

  packaged_zip="$(find_packaged_windows_zip)"
  cp "$packaged_zip" "$ARCHIVE_PATH"
  write_start_here
  (cd "$RELEASE_ROOT" && zip -q "$ARCHIVE_PATH" "$(basename "$START_HERE_PATH")")

  verify_archive_listing "$ARCHIVE_PATH"

  (cd "$RELEASE_ROOT" && sha256sum "$PACKAGE_NAME.zip" > "$PACKAGE_NAME.zip.sha256")

  echo "Packaged Windows release archive ready: $ARCHIVE_PATH"
  echo "Checksum ready: $CHECKSUM_PATH"
  cat "$CHECKSUM_PATH"
}

main "$@"
