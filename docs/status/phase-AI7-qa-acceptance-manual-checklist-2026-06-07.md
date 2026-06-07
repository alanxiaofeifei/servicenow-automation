# AI7 — Final QA Acceptance Checklist

**Date:** 2026-06-07
**Phase:** AI7 — Final QA acceptance after all wiring
**Tester:** sna-qa-acceptance (automated + code review)
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Worktree:** Dirty (uncommitted changes from AG/AH/AI phases)

---

## Automated Gates

### `pnpm build` — PASS
- main bundle: 298.00 kB, 30 modules
- preload bundle: 1.35 kB, 1 module
- renderer bundle: index.html + 141.98 kB CSS + 1,078.60 kB JS, 56 modules

### `pnpm typecheck` — PASS
- Clean, no errors

### `pnpm test` — PASS
- 9 test files, 146 tests, all passed
- Tests include: 17 worktree-ipc tests (git diff, open dist, status, package metadata), 100 App.tsx tests (including worktree acceptance card, Mark reviewed, Review diff, dynamic metadata, safety boundaries)

### `pnpm privacy:scan` — PASS
- 288 files scanned, no violations

---

## Acceptance Criteria Verification

### 1. Review diff button — PASS

**Code evidence:**
- `handleReviewDiff` callback (line 3075) calls `window.worktreeApi.getGitDiff()` via IPC
- IPC handler `handleWorktreeGitDiff()` runs `git diff --stat HEAD` with sanitization
- States: loading ("Loading diff..."), error (red error message), success (preformatted diff), prompt (instructions before first click)
- Collapsible diff panel `<details>` with open state control
- Tests: `buttonAttrs(output, "Review diff").not.toContain("disabled")`

**Actual behavior:** Click toggles diff panel open/closed. First click marks `worktreeDiffReviewed=true`, enabling Mark reviewed.

### 2. Open dist/release — PASS

**Code evidence:**
- Calls `worktreeApi.openDistRelease()` → `ipcMain.handle("sda:worktree-open-dist-release")` → `shell.openPath(distReleasePath)`
- Path: `join(projectRoot, "dist", "release")` — no user-supplied paths
- States: idle → "Opening…" (disabled) → done ("dist/release opened in Explorer.") / error (red message)
- Tests: 3 worktree-ipc tests for openDistRelease (success, error string, throw)

### 3. Dynamic package metadata — PASS

**Code evidence:**
- `worktreePkgMetadata` state populated via `worktreeApi.worktreePackageMetadata()` IPC on mount (useEffect line 3130)
- IPC handler `handleWorktreePackageMetadata()` scans `dist/release/` for newest `.zip`, computes SHA256, returns path/sha256/mtime/filename/size
- Card shows dynamic values (not hardcoded):
  - Path: `worktreePkgMetadata.path` converted via `linuxToWslUncPath()`
  - SHA256: `worktreePkgMetadata.sha256.substring(0, 16) + "…"`
  - mtime: `new Date(worktreePkgMetadata.mtime * 1000).toISOString()`
- Tests: 4 worktree-ipc tests for packageMetadata (newest selection, no zip, readdir error, multiple zips)

**On-disk verification:**
- Newest package: `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip`
- SHA256: `aafd1b42cbd29aee5337ac011c621d68a97d6d64c34175b47f87ea4947d054ad`
- Size: 118,600,763 bytes
- mtime: `1780778322` (2026-06-07 04:38 CST)

### 4. Mark reviewed — PASS

**Code evidence:**
- Disabled when `worktreeHasDirtyChanges && !worktreeDiffReviewed` (line 4390)
- Enabled when worktree is clean OR Review diff has been clicked
- Clicking sets `worktreeReviewed=true` and `worktreeAccepted=true`
- State chip shows "Dirty" → "Accepted" with CSS class toggle
- Tests: 5 worktree acceptance tests covering all 4 states

### 5. Copy package path — PASS

- Writes `linuxToWslUncPath(worktreePkgMetadata.path)` to clipboard
- Dynamic — uses real path from IPC metadata
- Tests: button rendered in card

### 6. Copy summary — PASS

- Writes `worktreePkgMetadata.filename + " — newest dated local build, checksum verified, local-only — worktree acceptance pending"`
- Dynamic — uses real filename from IPC metadata
- Tests: button rendered in card

### 7. Three-column card layout — PASS

- Left: Queue · State (Dirty/Accepted/Fresh/Stale/History chips)
- Center: Boundary · Detail (dirty vs accepted explanation, safe next steps)
- Right: Actions · Safety (Review diff, Copy path, Open dist, Mark reviewed, Copy summary)
- Consistent with existing card rendering style

### 8. Safety/privacy — PASS

- All buttons are local-only (no ServiceNow writes, no API calls, no uploads)
- `worktree-ipc.ts` handlers accept NO user-supplied arguments (paths are constructed from `findProjectRoot()`)
- Diff output sanitizes home directory
- Privacy scan: 288 files PASS
- Footer: "No live ServiceNow action, upload, PR, merge, tag, or release is implied"
- No hardcoded package filenames, SHA256s, or paths in source code

### 9. No regression — PASS

- All 146 tests pass (same as AH4 baseline of 146, no regression from previous phases)
- Build passes with 3 bundles
- Typecheck clean
- Card ordering: handoff → hygiene → worktree acceptance → selected source (verified by tests)
- No new privacy violations

---

## Verdict

**PASS** — All acceptance criteria verified.

| Criterion | Result | Evidence |
|---|---|---|
| pnpm build | PASS | main+preload+renderer bundles |
| pnpm typecheck | PASS | clean |
| pnpm test (146/146) | PASS | 9 test files, all pass |
| pnpm privacy:scan | PASS | 288 files clean |
| Review diff button | PASS | IPC to git diff, inline collapsible panel, loading/error/success/prompt states |
| Open dist/release button | PASS | IPC to shell.openPath, loading/error/done states |
| Dynamic metadata | PASS | Package path, SHA256, mtime, filename, size all loaded dynamically via IPC |
| Mark reviewed logic | PASS | Disabled when dirty+undiffed, enabled otherwise; toggles Dirty→Accepted chip |
| Copy package path | PASS | Dynamic UNC path from IPC metadata |
| Copy summary | PASS | Dynamic filename + status from IPC metadata |
| Three-column layout | PASS | Queue/State · Boundary/Detail · Actions/Safety |
| Safety/privacy | PASS | No ServiceNow writes, no hardcoded values, no raw URLs, sanitized diff output |
| No regression | PASS | All tests pass, no new violations, card ordering preserved |

**Files changed (this task only):**
- `docs/status/phase-AI7-qa-acceptance-manual-checklist-2026-06-07.md` (new)

**Remaining risks:**
- Manual Windows test (double-click entry point, Start QA Chromium) not performed in this session (no Windows desktop available from WSL)
- Mark reviewed is in-memory only — no persistence across app restarts (by design, acceptance is per-session human decision)
