# Phase BL2E — fix packaged inner release metadata sequencing and schema

**Date:** 2026-06-07
**Status:** Complete

## Problem

Operator verified that BL3D zip internally still contains `resources/release-metadata.json` for BL3C while the outer `dist/release/release-metadata.json` is BL3D. Packaged Electron reads the inner sidecar, so the user sees the old package identity.

**Root cause:** `scripts/generate-release-metadata.sh` runs BEFORE `electron-builder --win zip` in the `package:windows` pipeline. At generation time the target zip does not exist yet. The script previously required the zip to exist, computed its SHA256 (from a stale previous build), and baked that stale identity into the sidecar bundled inside the new zip.

## Solution

Three-file surgical change:

### 1. `scripts/generate-release-metadata.sh`

- **Removed** the zip existence requirement (`if [ ! -f "$ZIP_PATH" ]`) — the zip being built does not exist yet
- **Removed** SHA256 computation (`sha256sum "$ZIP_PATH"`) — can't compute self-checksum before build
- **Added** `checksumScope: "external"` field to the JSON output, signaling that the authoritative checksum lives in the outer `dist/release/release-metadata.json` (post-build) and `<filename>.zip.sha256`
- **Set** `sha256: ""` (empty) — the renderer treats falsy sha256 as "not displayed" (line 4281 in `App.tsx`)
- **Set** `size: 0` and `mtime: 0` — can't know zip size/mtime before build
- **Kept** correct filename, phase, `linuxPath`, and `windowsUncPath` derived from `CURRENT.txt`
- `wslpath -w` confirmed to work on non-existent paths (tested)

### 2. `apps/desktop/electron/worktree-ipc.ts`

- **Updated** `readReleaseMetadataSidecar` to accept empty `sha256` when `checksumScope` is `"external"`
- When `checksumScope` is absent or `"self"`, `sha256` is still required (backward compatible)
- Added `checksumScope` to the return type for transparency
- Empty `sha256` with external scope → renderer doesn't display empty SHA (falsy check at line 4281)

### 3. `apps/desktop/electron/worktree-ipc.test.ts`

- Added `checksumScope: "self"` to existing packaged-mode and dist-sidecar test fixtures
- **New test:** Accepts sidecar with empty sha256 and `checksumScope: "external"` (BL2E core behavior)
- **New test:** Rejects sidecar with missing sha256 and no `checksumScope` (not external — must fail validation)

## Files changed

| File | Change | Reason |
|------|--------|--------|
| `scripts/generate-release-metadata.sh` | ~20 lines changed | Removed zip-exists requirement, added external checksum schema |
| `apps/desktop/electron/worktree-ipc.ts` | ~20 lines changed | Updated validation for external checksum scope |
| `apps/desktop/electron/worktree-ipc.test.ts` | ~60 lines added | 2 new tests + `checksumScope` in 2 existing fixtures |

## Gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (185 tests, 9 files) |
| `pnpm privacy:scan` | PASS (299 files) |

## Why the change is minimal

- Only 3 files touched
- No new abstractions or config layers
- Backward compatible: existing sidecars with `sha256` work (no `checksumScope` defaults to requiring sha256)
- Renderer logic unchanged — empty/falsy sha256 is already handled at line 4281

## Remaining risks

- **Outer sidecar update after build:** The outer `dist/release/release-metadata.json` is NOT automatically updated after electron-builder creates the zip. If someone builds the zip manually and expects the outer sidecar to have the correct sha256, they must regenerate it manually. This is the existing workflow — `build-windows-rc.sh` generates `.zip.sha256` but not a new `release-metadata.json`.
- **CURRENT.txt accuracy:** The generated metadata is only as accurate as `CURRENT.txt`. If `CURRENT.txt` is stale, the inner sidecar will still describe the wrong package. This is by design — `CURRENT.txt` is the developer's responsibility.

## Manual verification checklist

1. Verify `pnpm package:windows` runs successfully (generates sidecar before electron-builder)
2. Verify inner `resources/release-metadata.json` has correct filename/phase for BL3E
3. Verify inner sidecar has `checksumScope: "external"` and `sha256: ""`
4. Verify outer `dist/release/release-metadata.json` (if regenerated post-build) has authoritative sha256
5. Verify `dist/release/<zip>.sha256` has the correct authoritative checksum
