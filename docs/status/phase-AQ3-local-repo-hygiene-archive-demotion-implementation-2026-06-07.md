# Phase AQ3 — Local repo hygiene archive-demotion implementation

Date: 2026-06-07
Status: complete
Audience: Alan, QA
Privacy level: sanitized — all examples fake, no real ServiceNow URLs/hosts, ticket IDs, sys_ids, credentials, cookies, sessions, HAR, traces, or screenshots.

## Summary

Implemented the cleanup workflow IPC bridge and UI wiring for the Local Repo Hygiene + Archive Demotion card. Fixed structural corruption left by a prior timed-out run (nested JSX inside function declarations, missing handler functions). All gates pass.

## Files changed

| File | Change |
|------|--------|
| `apps/desktop/src/App.tsx` | Fixed structural corruption: restored `clearEnvironmentUrlSettings` body, removed duplicated `runOperatorAction`/`textFieldAutofillQaOperatorIncident` from inside the wrong scope. Added `handleHygieneRefresh`, `handleCleanupPreviewAction`, `handleConfirmArchiveOpen`, `handleCancelArchive`, `handleConfirmArchive` functions. |
| `docs/status/phase-AQ3-local-repo-hygiene-archive-demotion-implementation-2026-06-07.md` | This status document. |

## What was already in place (not changed)

- `scripts/hygiene/cleanup-stale-artifacts.sh` — shell archive-demotion script (already complete)
- `apps/desktop/electron/worktree-ipc.ts` — `handleCleanupPreview`, `handleCleanupExecute` already implemented with stale-count truthfulness (canonical v0.1.0-rc.1.zip excluded)
- `apps/desktop/electron/main.ts` — IPC handlers already registered for `sda:cleanup-preview` and `sda:cleanup-execute`
- `apps/desktop/electron/preload.ts` — `cleanupPreview` and `cleanupExecute` already exposed via contextBridge
- `apps/desktop/src/App.tsx` — HygieneScanResult, CleanupPreviewResult, CleanupExecuteResult types, state hooks, JSX card with left/center/right columns, confirmation dialog, disabled reasons, safety footer all already present

## What was fixed

The prior run (which timed out) left `apps/desktop/src/App.tsx` in a structurally broken state:
1. `function clearEnvironmentUrlSettings()` had been replaced with nested function declarations (`textFieldAutofillQaOperatorIncident` and `runOperatorAction`) that belonged at module scope
2. The `return (` statement had been lost, with JSX attributes appearing inside what was syntactically a function parameter list
3. The `handleHygieneRefresh`, `handleCleanupPreviewAction`, `handleConfirmArchiveOpen`, `handleCancelArchive`, `handleConfirmArchive` handler functions were referenced in JSX but never defined

Fixed by:
1. Restoring `clearEnvironmentUrlSettings` to its original implementation
2. Adding the five handler functions between `clearEnvironmentUrlSettings` and the `return` statement
3. Restoring the `return (` and `<main` element opening

## Gates passed

```
pnpm typecheck → ✓
pnpm test       → ✓ (150 tests, 104 in App.test.ts)
pnpm build      → ✓
```

## Stale-count truthfulness

The hygiene scan handler in `worktree-ipc.ts` correctly excludes the canonical `v0.1.0-rc.1.zip` from the stale count:

```typescript
const canonicalZipName = "v0.1.0-rc.1.zip";
const canonicalZipFile = zipFiles.find((f) => f.name === canonicalZipName);
const stale = zipFiles.slice(1).filter((f) => f.name !== canonicalZipName);
```

The newest zip is preserved, the canonical zip is preserved, and everything else is counted as stale. The shell script at `scripts/hygiene/cleanup-stale-artifacts.sh` uses the same logic.

## UI acceptance

The three-column repo-hygiene card provides:

**Left column** — Queue / feed: `.gitignore verification`, `Stale dist/release/ artifacts`, `.local/video-analysis/` items with state chips (`Verified`, `Pending`, `Closed as N/A`).

**Center column** — Evidence + preview: scan results, stale artifact counts, evidence detail expandable section, cleanup preview detail with phase breakdown, archive-done note.

**Right column** — Action rail: `Refresh local scan`, `Open workspace root`, `Export status markdown`, `Copy selected summary`, `Cleanup preview` / `Hide preview`, `Archive stale artifacts` with inline disabled reasons.

## Safety / privacy

- Cleanup preview is read-only dry-run (no files modified)
- Archive stale artifacts moves files to `dist/.release-archive/` — no deletion, no upload, no ServiceNow writes
- Confirmation dialog explicitly states the move is local and non-destructive
- Fresh scan after archive re-reads state so the UI stays accurate
- All safety copy uses compact plain language: "Local only", "No upload / PR / merge / tag / release"
- No real URLs, ticket IDs, sys_ids, credentials exposed

## Manual verification checklist

1. Open the app, navigate to Workbench page
2. Verify "Local Repo Hygiene + Archive Demotion" card appears
3. Click "Refresh local scan" — verify queue populates
4. Select the stale artifact item (it should be marked `Pending`)
5. Click "Cleanup preview" — verify preview detail appears with file counts
6. Click "Archive stale artifacts" — verify confirmation dialog appears with local-only copy
7. Confirm archive — verify archive-done note appears and scan refreshes
8. Verify `Verified` and `Closed as N/A` items have disabled cleanup/archive buttons with reasons

## Remaining risks

- The archive-execute IPC path (`sda:cleanup-execute`) has not been manually tested with real Electron (Windows double-click) — only unit-tested via worktree-ipc.test.ts
- The `getWorktreeApi()` function may return `undefined` in static/test context; handlers gracefully early-return in that case
