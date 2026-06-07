#!/usr/bin/env bash
# generate-release-metadata.sh
#
# Generate a release-metadata.json sidecar from the current dist/release/ artifacts.
# This sidecar is bundled into packaged Electron apps via electron-builder's
# extraResources so the app can display current package identity even when
# the repo dist/release/ directory is not available.
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

# Read CURRENT.txt to find the current zip
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
if [ ! -f "$ZIP_PATH" ]; then
  echo "ERROR: Referenced zip $CURRENT_FILENAME not found at $ZIP_PATH" >&2
  exit 1
fi

# Compute SHA256
SHA256="$(sha256sum "$ZIP_PATH" | cut -d' ' -f1)"

# File size and mtime (Unix timestamp)
SIZE="$(stat --format=%s "$ZIP_PATH")"
MTIME="$(stat --format=%Y "$ZIP_PATH")"

# Linux path
LINUX_PATH="$(realpath "$ZIP_PATH")"

# Windows UNC path (if running under WSL)
WINDOWS_UNC=""
if grep -qi microsoft /proc/version 2>/dev/null; then
  LINUX_ABS="$(realpath "$ZIP_PATH")"
  # Convert /home/alanxwsl/... to \\wsl.localhost\Ubuntu\home\alanxwsl\...
  # Derive WSL distro name from /proc/version or /etc/wsl.conf
  DISTRO_NAME=""
  if [ -f /etc/wsl.conf ] && grep -q '\[automount\]' /etc/wsl.conf 2>/dev/null; then
    DISTRO_NAME="$(grep -oP '(?<=root = /mnt/)[a-zA-Z]+' /etc/wsl.conf 2>/dev/null || echo "")"
  fi
  if [ -z "$DISTRO_NAME" ]; then
    DISTRO_NAME="Ubuntu"
  fi
  WINDOWS_UNC="\\\\wsl.localhost\\${DISTRO_NAME}${LINUX_ABS//\//\\}"
fi

# Extract phase from filename
PHASE=""
if [[ "$CURRENT_FILENAME" =~ -rc\.1-([a-z0-9]+)-([0-9]{8}) ]]; then
  PHASE="${BASH_REMATCH[1]^^}"
elif [[ "$CURRENT_FILENAME" =~ -rc\.1-([a-z0-9]{2,4})-local ]]; then
  PHASE="${BASH_REMATCH[1]^^}"
fi

SOURCE="packaged-metadata"

# Write sidecar
cat > "$SIDECAR" <<JSON
{
  "version": 1,
  "filename": "$CURRENT_FILENAME",
  "sha256": "$SHA256",
  "size": $SIZE,
  "mtime": $MTIME,
  "linuxPath": "$LINUX_PATH",
  "windowsUncPath": "$WINDOWS_UNC",
  "phase": "$PHASE",
  "source": "$SOURCE"
}
JSON

echo "OK: $SIDECAR generated"
echo "  filename: $CURRENT_FILENAME"
echo "  sha256: ${SHA256:0:16}..."
echo "  size: $SIZE bytes"
echo "  mtime: $MTIME"
if [ -n "$WINDOWS_UNC" ]; then
  echo "  windowsUncPath: $WINDOWS_UNC"
fi
echo "  phase: $PHASE"
