#!/usr/bin/env bash
#
# cleanup-stale-artifacts.sh
# AM3 — Replace deletion with archive-demotion for stale dist/release/ artifacts
#
# Keeps: canonical rc.1 package + latest build
# Archives: all other stale phase builds into dist/.release-archive/<phase>/
#
# Usage:
#   bash scripts/hygiene/cleanup-stale-artifacts.sh          # real archive-demotion
#   bash scripts/hygiene/cleanup-stale-artifacts.sh --dry-run # preview only
#

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
RELEASE_DIR="$PROJECT_DIR/dist/release"
ARCHIVE_DIR="$PROJECT_DIR/dist/.release-archive"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "[DRY RUN] No files will be moved. Showing what would be archived."
    echo ""
fi

cd "$RELEASE_DIR"
echo "=== dist/release/ before archive-demotion ==="
ls -lh
echo ""

# Dynamic stale detection: find all zip files sorted by mtime (newest first)
# Keep: newest zip + canonical v0.1.0-rc.1.zip
# Archive: everything else
mapfile -t ZIP_FILES < <(find . -maxdepth 1 -name "*.zip" -printf "%T@ %p\n" 2>/dev/null | sort -rn | cut -d' ' -f2-)

if [[ ${#ZIP_FILES[@]} -eq 0 ]]; then
    echo "No zip files found. Nothing to clean up."
    exit 0
fi

CANONICAL_ZIP="v0.1.0-rc.1.zip"
NEWEST_ZIP="${ZIP_FILES[0]#./}"

# Stale = all zips except the newest one and the canonical
STALE_ZIPS=()
for zip_file in "${ZIP_FILES[@]}"; do
    name="${zip_file#./}"
    if [[ "$name" != "$NEWEST_ZIP" && "$name" != "$CANONICAL_ZIP" ]]; then
        STALE_ZIPS+=("$name")
    fi
done

if [[ ${#STALE_ZIPS[@]} -eq 0 ]]; then
    echo "No stale artifacts found. Nothing to archive."
    exit 0
fi

# Collect stale companion files (sha256, START-HERE, etc.)
STALE_FILES=()
TOTAL_BYTES=0

for zip_name in "${STALE_ZIPS[@]}"; do
    base_name="${zip_name%.zip}"
    phase=$(echo "$zip_name" | sed -n 's/.*-rc\.1-\([a-z0-9]\{1,\}\)-20.*/\1/p')
    [[ -z "$phase" ]] && phase="unknown"

    STALE_FILES+=("$zip_name:$phase")
    if [[ -f "$zip_name" ]]; then
        size=$(stat --format=%s "$zip_name" 2>/dev/null || echo 0)
        TOTAL_BYTES=$((TOTAL_BYTES + size))
    fi

    # Find companion files sharing the same base name or phase prefix
    while IFS= read -r -d '' comp; do
        comp_name="${comp#./}"
        if [[ "$comp_name" != "$zip_name" ]]; then
            STALE_FILES+=("$comp_name:$phase")
            if [[ -f "$comp_name" ]]; then
                csize=$(stat --format=%s "$comp_name" 2>/dev/null || echo 0)
                TOTAL_BYTES=$((TOTAL_BYTES + csize))
            fi
        fi
    done < <(find . -maxdepth 1 \( -name "${base_name}*" -o -name "*${phase}*" \) ! -name "*.zip" -print0 2>/dev/null)
done

total_human=$(numfmt --to=iec "$TOTAL_BYTES" 2>/dev/null || echo "$TOTAL_BYTES bytes")

echo "=== Stale artifacts to archive (${#STALE_FILES[@]} files, $total_human) ==="
for entry in "${STALE_FILES[@]}"; do
    filename="${entry%%:*}"
    phase="${entry#*:}"
    if [[ -f "$filename" ]]; then
        size=$(stat --format=%s "$filename" 2>/dev/null || echo "?")
        human=$(numfmt --to=iec "$size" 2>/dev/null || echo "$size bytes")
        printf "  %-12s  %s  → archive/%s/\n" "$human" "${filename#./}" "$phase"
    fi
done
echo ""

if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY RUN] Would archive ${#STALE_FILES[@]} stale entries to $ARCHIVE_DIR/<phase>/."
    exit 0
fi

echo "Archiving ${#STALE_FILES[@]} stale entries to $ARCHIVE_DIR/<phase>/..."
for entry in "${STALE_FILES[@]}"; do
    filename="${entry%%:*}"
    phase="${entry#*:}"
    target_dir="$ARCHIVE_DIR/$phase"
    mkdir -p "$target_dir"

    if mv "$filename" "$target_dir/" 2>/dev/null; then
        echo "  archived: ${filename#./} → $ARCHIVE_DIR/$phase/"
    else
        echo "  FAILED: ${filename#./}" >&2
    fi
done

echo ""
echo "=== dist/release/ after archive-demotion ==="
ls -lh
echo ""
echo "=== dist/.release-archive/ contents ==="
if [[ -d "$ARCHIVE_DIR" ]]; then
    find "$ARCHIVE_DIR" -type f -o -type d | sort | head -50
fi
echo ""
echo "Done. Archived $total_human of stale artifacts."
