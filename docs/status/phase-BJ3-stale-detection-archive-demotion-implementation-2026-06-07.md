# Phase BJ3 — stale-detection and archive-demotion implementation result

Date: 2026-06-07
Status: IMPLEMENTED AND VERIFIED
Profile: sna-frontend-workbench

## Summary

Refreshed the archive-demotion workflow for the BI-era stale set. All verification items confirmed working; one surgical code fix applied.

## Files changed

### `apps/desktop/electron/worktree-ipc.ts`
- Updated `handleCleanupExecute` archive destination from `dist/.release-archive/<phase>/` to `dist/.release-archive/BJ-<phase>/` (line 470)
- Updated JSDoc comment to document BJ-<phase> naming to avoid clashing with older aq6-era archive directories (line 436)

### `apps/desktop/electron/worktree-ipc.test.ts`
- Added assertion verifying BJ-<phase> prefix in all rename destination paths (line 664-668)

## Verification results

| Item | Status | Evidence |
|------|--------|----------|
| Stale-detection logic works with BI-era naming | ✅ PASS | `zipFiles.slice(1)` correctly identifies bi6 as newest, bh6→ay6 (10 phases, 30 files, ~1,135 MB) as stale |
| `sda:cleanup-preview` returns correct dry-run | ✅ PASS | Regex `-rc.1-([a-z0-9]+)-\d{8}` correctly parses `-rc.1-bh6-20260607` → "bh6". Companion matching works for START-HERE-WINDOWS.txt and .sha256 files |
| `sda:cleanup-execute` uses BJ-<phase> archive destination | ✅ PASS | Updated to `join(archiveBase, \`BJ-${file.phase}\`)` producing e.g. `dist/.release-archive/BJ-bh6/` |
| Archive stale artifacts button + dialog | ✅ PASS | Existing UI wiring in App.tsx (button, disable logic, confirmation dialog) functions correctly |
| Archive-directory awareness | ✅ PASS | `handleHygieneScan` already reports archive existence separately at lines 267-272 |
| Error handling | ✅ PASS | Per-file rename failure catches and continues (failed++ counter, never throws) |

## Gates

| Gate | Result |
|------|--------|
| pnpm build | ✅ PASS |
| pnpm typecheck | ✅ PASS |
| pnpm test | ✅ PASS (319 tests, 9 test files) |
| pnpm privacy:scan | ✅ PASS (288 files) |

## Simplicity check

This is the smallest safe change. Only the archive destination prefix needed updating; all detection logic and UI wiring were already correct for BI-era naming.

## Surgical check

Both touched files were necessary: worktree-ipc.ts for the functional change, worktree-ipc.test.ts for the behavioral assertion.

## Safety/privacy

- No live ServiceNow login, browsing, API write, Save / Submit / Update / Resolve / Close
- No attachment upload
- No raw URL/host/ticket/field exposure
- Archive-demotion only — no deletion path
- IPC handlers do not accept user-supplied paths (only internally computed projectRoot)

## Remaining risks

- After executing the archive, the UI may show stale count > 0 until the user refreshes the local scan. This is expected and matches the existing behavior.
- The `BJ-` prefix is specific to this round; future rounds (BK/BL/etc.) should use their own prefix to keep archive directories clearly separated.

## Verification commands

```
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
```
