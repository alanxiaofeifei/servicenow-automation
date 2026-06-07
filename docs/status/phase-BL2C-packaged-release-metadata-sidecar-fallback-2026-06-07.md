# Phase BL2C — Packaged-mode Release Metadata Sidecar Fallback

**Date:** 2026-06-07  
**Phase:** BL2C (sidecar follow-up after BL2 current-package loading regression fix)  
**Status:** Implementation complete — all gates pass

## Goal

Make the packaged Electron app able to display current package identity
(filename, SHA256, size, mtime, phase) from a bundled metadata sidecar when
the repo `dist/release/` directory is not available.

## Implementation

### What changed

1. **`scripts/generate-release-metadata.sh`** (NEW)
   A portable shell script that reads `dist/release/CURRENT.txt`, computes
   SHA256/size/mtime of the referenced zip, resolves Linux and Windows UNC
   paths, and writes `dist/release/release-metadata.json`.

2. **`apps/desktop/package.json`**
   - Added `generate:release-metadata` npm script calling the sidecar script.
   - Updated `package:windows` to run sidecar generation before electron-builder.
   - Added `release-metadata.json` to `extraResources` → bundled at
     `resources/release-metadata.json` in the packaged app.

3. **`apps/desktop/electron/worktree-ipc.ts`**
   - Added `readReleaseMetadataSidecar()` — validates JSON structure, version
     check (v1 only), required field presence (filename, sha256, size, mtime).
   - Modified `handleWorktreePackageMetadata()` to try three sources in order:
     - Phase 1: `dist/release/CURRENT.txt` (dev repo — source of truth)
     - Phase 2: `release-metadata.json` at projectRoot (packaged mode via
       extraResources, or dev repo if sidecar was generated)
     - Phase 3: Newest zip by mtime (dev repo fallback)
     - Unavailable: true error when all sources fail

4. **`apps/desktop/src/App.tsx`**
   - Added `source` field to `PackageMetadataResult` interface.
   - Updated source-of-truth display to show `release-metadata.json` when
     `source === "packaged-metadata"` with a green "packaged metadata" badge.
   - Shows amber "zip fallback" badge when `source === "newest-zip-fallback"`.

5. **`apps/desktop/electron/worktree-ipc.test.ts`** (NEW — file was previously untracked)
   Added 6 tests covering:
   - Packaged mode: reads sidecar at project root
   - Packaged mode: returns unavailable when no dist/release/ and no sidecar
   - Malformed JSON sidecar rejection
   - Version mismatch sidecar rejection (version !== 1)
   - Missing required fields sidecar rejection
   - Dev repo mode: reads sidecar from dist/release/release-metadata.json when
     CURRENT.txt is absent

6. **`apps/desktop/electron/packaging-config.test.ts`**
   Updated `package:windows` script expectation to include the new
   `generate:release-metadata` prefix.

### Sidecar JSON Schema (v1)

```json
{
  "version": 1,
  "filename": "servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip",
  "sha256": "6258758a89f8d960...",
  "size": 118608396,
  "mtime": 1780841992,
  "linuxPath": "/home/.../dist/release/...zip",
  "windowsUncPath": "\\\\wsl.localhost\\Ubuntu\\home\\...",
  "phase": "BL3",
  "source": "packaged-metadata"
}
```

## Gates

| Gate | Result |
|------|--------|
| `pnpm build` (electron-vite) | PASS |
| `pnpm typecheck` (tsc --noEmit) | PASS |
| `pnpm test` (vitest, 9 files, 181 tests) | PASS |
| `pnpm privacy:scan` (292 files) | PASS |

## Files Changed

| File | Change |
|------|--------|
| `scripts/generate-release-metadata.sh` | NEW — sidecar generation script |
| `apps/desktop/package.json` | Added script + extraResources |
| `apps/desktop/electron/worktree-ipc.ts` | Added readReleaseMetadataSidecar + Phase 2 |
| `apps/desktop/electron/worktree-ipc.test.ts` | NEW — 6 sidecar tests |
| `apps/desktop/electron/packaging-config.test.ts` | Updated script expectation |
| `apps/desktop/src/App.tsx` | Added source field + dynamic source display |
| `docs/status/phase-BL2C-...md` | This file |

## Acceptance criteria

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Sidecar generated at `dist/release/release-metadata.json` | ✓ |
| 2 | Sidecar bundled via `extraResources` in packaged app | ✓ |
| 3 | IPC tries CURRENT.txt → sidecar → newest zip → unavailable | ✓ |
| 4 | Renderer shows `release-metadata.json` source with badge | ✓ |
| 5 | No misleading `CURRENT=N/A` when sidecar is available | ✓ |
| 6 | Tests cover sidecar success and malformed rejection | ✓ |

## Manual QA checklist

1. In dev repo mode, verify `dist/release/CURRENT.txt` is still the
   primary source (green badge not shown).
2. Run `pnpm generate:release-metadata` → verify
   `dist/release/release-metadata.json` contains valid JSON.
3. Build a Windows package with `pnpm package:windows` and verify the
   sidecar is inside the package's `resources/` directory.
4. Launch the packaged app on Windows and verify the Release Readiness
   Handoff card shows `release-metadata.json → CURRENT=...` with a green
   "packaged metadata" badge.
5. Delete or corrupt the sidecar in a test package → verify app shows
   "Current package metadata is unavailable."

## Remaining risks

- The `release-metadata.json` is regenerated at build time. If the dist/
  layout changes, the sidecar generation script must be updated.
- Windows UNC path derivation assumes a single WSL distro name "Ubuntu".
  Multi-distro setups may need adjustment.
- ExtraResources bundling is confirmed via electron-builder config but
  not yet tested with an actual packaged Windows build.
