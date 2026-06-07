#!/usr/bin/env bash
# generate-release-metadata.sh
#
# Generate a release-metadata.json sidecar from the current dist/release/ artifacts.
# This sidecar is bundled into packaged Electron apps via electron-builder's
# extraResources so the app can display current package identity even when
# the repo dist/release/ directory is not available.
#
# IMPORTANT: This script runs BEFORE electron-builder creates the target zip.
# The zip being built does not exist yet, so SHA256 cannot be self-referential.
# The generated metadata has checksumScope="external", meaning the authoritative
# checksum lives in the outer dist/release/release-metadata.json and .zip.sha256.
# The inner sidecar identifies the package by filename, phase, and path only.
#
# Output: dist/release/release-metadata.json
#
# Usage: ./scripts/generate-release-metadata.sh [project-root]
#   If project-root is omitted, the script infers it from its own location.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${1:-$(cd "$SCRIPT_DIR/.." && pwd)}"
DIST_RELEASE="$PROJECT_ROOT/dist/release"
SIDECAR="$DIST_RELEASE/release-metadata.json"

if [ ! -d "$DIST_RELEASE" ]; then
  echo "ERROR: $DIST_RELEASE does not exist. Run pnpm build first." >&2
  exit 1
fi

# Read CURRENT.txt to find the target zip filename
CURRENT_TXT="$DIST_RELEASE/CURRENT.txt"
if [ ! -f "$CURRENT_TXT" ]; then
  echo "ERROR: $CURRENT_TXT not found. No current package to generate metadata for." >&2
  exit 1
fi

CURRENT_FILENAME=""
while IFS= read -r line; do
  trimmed="$(echo "$line" | xargs)"
  case "$trimmed" in
    CURRENT=*)
      CURRENT_FILENAME="${trimmed#CURRENT=}"
      ;;
  esac
done < "$CURRENT_TXT"

if [ -z "$CURRENT_FILENAME" ]; then
  echo "ERROR: Could not parse CURRENT= line from $CURRENT_TXT" >&2
  exit 1
fi

ZIP_PATH="$DIST_RELEASE/$CURRENT_FILENAME"

# NOTE: The zip does NOT need to exist. electron-builder creates it AFTER
# this script runs. We only need the target filename from CURRENT.txt
# to populate the sidecar identity fields (filename, phase, linuxPath).

# Pre-compute the path the zip will have (before it exists), for display.
# realpath will fail if the file doesn't exist, so construct the path directly.
LINUX_PATH="$ZIP_PATH"

# Windows UNC path (if running under WSL) — derived from the target path
WINDOWS_UNC=""
if grep -qi microsoft /proc/version 2>/dev/null; then
  # Construct the WSL UNC path directly without requiring the file to exist
  # Use wslpath -m for a non-existence-tolerant path, or construct from the linux path
  WINDOWS_UNC="$(wslpath -w "$ZIP_PATH" 2>/dev/null || true)"
fi

# Extract phase from filename
PHASE=""
if [[ "$CURRENT_FILENAME" =~ -rc\.1-([a-z0-9]+)-([0-9]{8}) ]]; then
  PHASE="${BASH_REMATCH[1]^^}"
elif [[ "$CURRENT_FILENAME" =~ -rc\.1-([a-z0-9]{2,4})-local ]]; then
  PHASE="${BASH_REMATCH[1]^^}"
fi

SOURCE="packaged-metadata"

# Write sidecar using Python for correct JSON escaping
# Export Windows UNC via env var to avoid backslash escaping in shell→Python string interpolation
if [ -n "$WINDOWS_UNC" ]; then
  export SNA_WINDOWS_UNC="$WINDOWS_UNC"
fi

python3 -c "
import json, os

windows_unc = os.environ.get('SNA_WINDOWS_UNC', '')

data = {
    'version': 1,
    'filename': '$CURRENT_FILENAME',
    # sha256 is empty because the zip being built does not exist yet.
    # The authoritative checksum is in dist/release/release-metadata.json (post-build)
    # and <filename>.zip.sha256. checksumScope='external' signals that the
    # checksum, if present, is not self-referential to this package.
    'sha256': '',
    'checksumScope': 'external',
    'size': 0,
    'mtime': 0,
    'linuxPath': '$LINUX_PATH',
    'windowsUncPath': windows_unc,
    'phase': '$PHASE',
    'source': '$SOURCE',
}

with open('$SIDECAR', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\\n')
"

echo "OK: $SIDECAR generated (pre-build sequencing — checksum is external)"
echo "  filename: $CURRENT_FILENAME"
echo "  checksumScope: external (authoritative checksum in outer .zip.sha256)"
if [ -n "$WINDOWS_UNC" ]; then
  echo "  windowsUncPath: $WINDOWS_UNC"
fi
echo "  phase: $PHASE"
