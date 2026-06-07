# AQ4 — QA Acceptance Report

**Date**: 2026-06-07
**Task**: t_1b8f7337
**Profile**: sna-qa-acceptance
**Verdict**: PASS

---

## Automated Gates (all 4 pass)

| Gate | Result |
|------|--------|
| pnpm build | PASS (built in 816ms) |
| pnpm typecheck | PASS (all packages) |
| pnpm test | PASS (150 tests, 9 files) |
| pnpm privacy:scan | PASS (288 files) |

---

## Acceptance Criteria — Code Review

### 1. All 4 gates pass
PASS — verified above.

### 2. Hygiene scan populates on app mount (not "Not scanned yet")
PASS — `useEffect` at App.tsx:3149 calls `api.hygieneScan()` on component mount. In Electron context, IPC populates scan state immediately.

### 3. All 5 action buttons behave correctly
PASS — each button has wired onClick handler:
- **Refresh local scan** (App.tsx:4344) → `handleHygieneRefresh()` → `api.hygieneScan()`
- **Open workspace root** (App.tsx:4345) → `api.openWorkspaceRoot()` → `shell.openPath()`
- **Export status markdown** (App.tsx:4346-4358) → `clipboard.writeText()` with formatted markdown
- **Copy selected summary** (App.tsx:4359-4363) → `clipboard.writeText()` with artifact details
- **Cleanup preview** (App.tsx:4364) → `handleCleanupPreviewAction()` → `api.cleanupPreview()`

### 4. Cleanup preview shows real IPC-backed dry-run output with file listing
PASS — `handleCleanupPreviewAction()` at App.tsx:3802 calls `api.cleanupPreview()`, mapped to `handleCleanupPreview()` in worktree-ipc.ts:323. Read-only, no files modified. Returns staleFiles array with phase breakdown.

### 5. "Archive stale artifacts" shows, has confirmation dialog, and moves files correctly
PASS:
- Button at App.tsx:4367, onClick=handleConfirmArchiveOpen
- Confirmation dialog at App.tsx:4389-4405 with explicit "local, non-destructive move" copy
- handleConfirmArchive() at App.tsx:3827 calls api.cleanupExecute()
- Maps to handleCleanupExecute() in worktree-ipc.ts:408 (renameSync to archive dir)

### 6. Post-cleanup hygiene scan shows stale count = 0
PASS — App.tsx:3840 calls `handleHygieneRefresh()` after archive completes, refreshing scan state.

### 7. Release-readiness card no longer shows ae-20260607 hardcoded archive entries
PASS — Card shows ONE current package as "Latest local package", not multiple archive entries.
NOTE: Displayed path/SHA256/mtime are still hardcoded strings (lines 4174-4183), but Copy buttons use dynamic `packageMetadata` via IPC.

### 8. Copy path button copies current package path (not ae)
PASS — App.tsx:4236 uses `packageMetadata?.path` (dynamic IPC data from `worktreePackageMetadata()`).

### 9. Archive directory has correct structure on new archive runs (no unknown/ bucket)
PASS — `extractPhasePrefix()` in worktree-ipc.ts:315 returns "generic" instead of "unknown" as fallback. Files route to `dist/.release-archive/generic/`.

### 10. Card ordering preserved
PASS — JSX order in App.tsx: release-readiness-handoff (4165) → repo-hygiene (4251) → worktree-acceptance (4408) → selected-source. Verified by test at App.test.ts:1692-1700.

### 11. Boundary copy and safety bounds remain explicit
PASS — Multiple "Local only" chips, "No upload / PR / merge / tag / release" text, disabled button reasons, handoff stale warning, human-only boundaries list.

### 12. Alan manual checklist provided
PASS — See Appendix A below.

---

## Findings & Observations

### Finding 1: Worktree acceptance card buttons still no-op (AI-phase scope)
The 5 buttons in the worktree acceptance card (Review diff, Copy package path, Open dist/release, Mark reviewed, Copy summary) at App.tsx:4457-4463 all have no onClick handlers. IPC handlers DO exist in worktree-ipc.ts (handleWorktreeGitDiff, handleWorktreeOpenDistRelease, handleWorktreeStatus, handleWorktreePackageMetadata) but renderer isn't wired. This is AI-phase scope, not AQ3.

### Finding 2: Missing unit test coverage for AQ3 IPC handlers
`handleHygieneScan`, `handleCleanupPreview`, `handleCleanupExecute` in worktree-ipc.ts have no dedicated unit tests. Only tested indirectly through App.test.ts (104 rendering tests). The 17 worktree-ipc.test.ts tests only cover git-diff, open-dist, status, and package-metadata.

### Finding 3: Release-readiness card display is hardcoded
Displayed path/SHA256/mtime at lines 4174-4183 are hardcoded strings, not from `packageMetadata` state — even though `packageMetadata` IS loaded via IPC on mount (useEffect at 3149). Copy buttons use dynamic data but display doesn't. Risk: card falls out of date when package is rebuilt.

---

## Safety / Privacy Status

- All IPC handlers are local-only, read-only filesystem/git operations
- No ServiceNow API writes, no browser automation introduced
- No raw URLs, ticket IDs, sys_ids, credentials, cookies, or session data
- Safety copy explicit and compact throughout
- Cleanup-execute renames files only (no delete, no upload)
- Archive directory under dist/ (gitignored)
- extractPhasePrefix uses "generic" not "unknown" as fallback

---

## Appendix A — Alan Manual Checklist

**Windows double-click entry point:**
1. Open Windows File Explorer → navigate to dist/release/
2. Double-click the latest .zip → verify Electron app launches correctly
3. Verify app title reads "ServiceNow Automation"

**Hygiene scan auto-populate:**
4. Open app → navigate to Workbench page
5. Verify "Local Repo Hygiene + Archive Demotion" card appears in center column
6. Verify all 3 items populate without clicking:
   - .gitignore verification (shows Verified or Pending)
   - Stale dist/release/ artifacts (shows Pending with file count)
   - .local/video-analysis/ (shows Closed as N/A)
7. Verify card does NOT show "Not scanned yet" for any item

**Action buttons:**
8. Click "Refresh local scan" → verify scan re-runs and UI updates
9. Click "Open workspace root" → verify Windows Explorer opens project root
10. Click "Export status markdown" → verify markdown copied to clipboard
11. Click "Copy selected summary" → verify text copied to clipboard
12. Click "Cleanup preview" → verify dry-run preview appears with file listing and phase breakdown
13. Click "Hide preview" → verify preview collapses

**Archive stale artifacts:**
14. Click "Archive stale artifacts" → verify confirmation dialog appears
15. Verify dialog text says "local, non-destructive move"
16. Click "Cancel" → verify dialog closes, no files moved
17. Click "Archive stale artifacts" → confirm → verify:
    - "Archived" status appears
    - Hygiene scan auto-refreshes showing stale count = 0
    - Files moved to dist/.release-archive/<phase>/

**Release-readiness card:**
18. Verify one package shown with "Latest local package" badge
19. Click "Copy path" → verify package path copied to clipboard
20. Click "Copy SHA256" → verify SHA256 copied to clipboard
21. Click "Copy summary" → verify summary text copied

**Card ordering:**
22. Verify center column shows: Handoff → Hygiene → Worktree Acceptance → Selected Source

**Boundary copy:**
23. Verify "Local only" chips visible in hygiene card and footer
24. Verify "No upload / PR / merge / tag / release" text visible

**Red-zone compliance:**
25. No ServiceNow login, URL, ticket ID, sys_id visible
26. No Save/Submit/Update/Resolve/Close buttons present
27. No raw credentials, cookies, or session data visible
