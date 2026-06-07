# Phase BL2 — Current Package Loading Regression Fix

Date: 2026-06-07
Task: t_33b359a2
Profile: sna-frontend-workbench
Privacy level: sanitized local-only. No live ServiceNow operations, no browser automation, no real ticket/customer data.

## Summary

Implemented two surgical fixes for the current package loading regression identified in BL1:

1. **Renderer fix** (App.tsx): Always store IPC metadata response regardless of `ok` value. Previously `ok:false` responses were dropped, leaving state as `null` (perpetual "still loading"). Now they render "Current package metadata is unavailable." with proper disabled-button tooltips.

2. **IPC fix** (worktree-ipc.ts): Read `dist/release/CURRENT.txt` first as the source of truth. Parse `CURRENT=<filename>` and validate the filename (reject path traversal, require `.zip` suffix). Fall back to newest ZIP by mtime only when CURRENT.txt is missing or references a non-existent file. Return a `source` field (`"current-txt"`, `"newest-zip-fallback"`, or `"unavailable"`).

## Changes

### 1. apps/desktop/src/App.tsx (2 lines changed)

**Line 3174-3178**: Change mount-effect to always store metadata:

```typescript
// Before:
api.worktreePackageMetadata().then((meta) => {
  if (meta.ok) {
    setPackageMetadata(meta);
  }
});

// After:
api.worktreePackageMetadata().then((meta) => {
  setPackageMetadata(meta);
});
```

This single change fixes the core symptom: `ok:false` now renders "unavailable" with disabled-but-explanatory buttons instead of indefinite "still loading".

### 2. apps/desktop/electron/worktree-ipc.ts (~70 new lines)

New `readCurrentTxt()` helper function:
- Checks `dist/release/CURRENT.txt` for `CURRENT=<filename>` format
- Rejects path traversal (`/`, `\`, `..`) or non-`.zip` suffixes
- Converts Buffer to String before string operations (handles test mock scenarios)

Updated `handleWorktreePackageMetadata()`:
- Checks if `dist/release/` exists before attempting reads
- Phase 1: Try CURRENT.txt as source of truth
  - If found + ZIP exists → return `ok:true` with `source:"current-txt"`
  - If found but ZIP missing → return `ok:false` with descriptive error
- Phase 2: Fallback to newest ZIP by mtime (existing behavior, now with `source:"newest-zip-fallback"`)
- All error/fallback states return `source:"unavailable"`

### 3. apps/desktop/electron/worktree-ipc.test.ts (+12 tests, existing tests updated)

Added `mockDistReleaseDir()` helper for consistent `existsSync` mocking.

New tests:
- CURRENT.txt takes precedence over newest by mtime
- CURRENT.txt pointing to missing ZIP returns error
- `dist/release/` directory not found returns immediate error
- No CURRENT.txt + no ZIPs returns "no package found"
- Path traversal in CURRENT= line is rejected (falls through to fallback)

Updated all existing tests to include `existsSync` mocking and `source` field assertions.

### 4. apps/desktop/src/App.test.ts (+1 new test, +1 import)

New `PackageMetadataResult` import.

New test: "renders unavailable state when package metadata returns ok:false":
- Verifies "Current package metadata is unavailable." text
- Verifies "Current package path is unavailable." text
- Verifies `CURRENT=N/A` in source-of-truth line
- Verifies copy buttons are disabled with "unavailable" in title
- Verifies NO "still loading" text
- Verifies no badge/chip when no path/phase

## Gates

All 4 gates pass:

| Gate | Status |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (175 tests, 9 files) |
| `pnpm privacy:scan` | PASS (289 files) |

## Test summary

- 175 desktop tests pass (102 App + 44 IPC worktree + others)
- BL2 adds: 12 new IPC tests (CURRENT.txt behavior) + 1 new renderer test (ok:false state)
- All existing tests preserved with updated mocking

## Files changed

| File | Lines changed | Reason |
|------|---------------|--------|
| `apps/desktop/src/App.tsx` | 2 | Always store metadata, not just when ok |
| `apps/desktop/electron/worktree-ipc.ts` | ~70 | readCurrentTxt helper + CURRENT.txt priority + source field |
| `apps/desktop/electron/worktree-ipc.test.ts` | ~140 | 12 new tests + mockDistReleaseDir helper + existing test updates |
| `apps/desktop/src/App.test.ts` | ~35 | ok:false renderer test + PackageMetadataResult import |

## Surgical check

Every touched file is directly required by the fix:
- `App.tsx`: The renderer fix for dropping ok:false metadata
- `worktree-ipc.ts`: The IPC fix for CURRENT.txt as source of truth
- `App.test.ts`: Coverage for ok:false renderer state
- `worktree-ipc.test.ts`: Coverage for CURRENT.txt precedence, missing ZIP, unavailable states

## Remaining risks

1. **Packaged mode CURRENT.txt**: The current fix works for dev/source-checkout mode where `dist/release/` exists. For packaged mode (no `dist/release/`), the handler returns `ok:false` with "dist/release/ directory does not exist". This is now rendered as "unavailable" instead of indefinite loading — an improvement, but the packaged sidecar/START-HERE fallback is not implemented yet.
2. **WSL path conversion**: `formatPackagePathForDisplay` still converts all paths to `\\wsl.localhost\...` format. For Windows-native packaged paths this may produce incorrect UNC paths. A future task should add an IPC-returned `displayPath` field.
3. **runtime-paths.ts**: Not modified in this task. Packaged mode still uses `process.resourcesPath` as `projectRoot`, which lacks `dist/release/`. This is a separate fix for a future phase.

## Suggested next tasks

1. **BL3**: Add packaged sidecar / START-HERE fallback for packaged mode so the handoff card can show current package metadata even when `dist/release/` is absent.
2. **BL4**: Add `displayPath` / `uncPath` field to IPC response so the renderer doesn't invent WSL UNC paths for Windows-native paths.
3. **BL5**: Fix `runtime-paths.ts` to return separate roots for bundled resources vs release metadata.
