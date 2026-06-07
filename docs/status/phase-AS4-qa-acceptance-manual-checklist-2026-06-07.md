# Phase AS4 — QA Acceptance Evidence + Alan Manual Checklist

**Date:** 2026-06-07
**QA Profile:** sna-qa-acceptance
**Task:** t_46a43fde
**Subject:** Worktree Acceptance card — Phase AS3 implementation verification + AS scope

**Privacy level:** sanitized. No real ServiceNow URLs, ticket IDs, sys_ids, credentials, cookies, sessions, HAR, traces, or customer data.

---

## Automated Gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (160 desktop tests: 114 App + 17 worktree-ipc + 29 other) |
| `pnpm privacy:scan` | PASS (288 files) |

**Evidence:**
- Build: `✓ built in 1.12s`, all workspace projects build clean
- Typecheck: 7 workspace projects all pass, `apps/desktop typecheck: Done`
- Tests: `apps/desktop test: 9 passed, 160 passed`, `apps/desktop test: Duration 2.45s`
- Privacy: `TRACKED_PRIVACY_SCAN_PASS files=288`

---

## Acceptance Criteria Verification

### AC1 — Three-column layout

**Spec:** Left = package feed/history/queue, Center = package path detail + metadata + checklist, Right = action buttons + disabled reasons + boundary chip.

**Code evidence:** `App.tsx`:
- `worktree-accept-left` (§4495) — queue with current package item (aria-current), archival aliases, history
- `worktree-accept-center` (§4523) — boundary card with package path + filename/size, manual validation checklist (§4533)
- `worktree-accept-right` (§4548) — action buttons grid (§4549), 5 disabled-reason paragraphs, boundary chip "Local only"

**Status: PASS** ✓

### AC2 — Fresh/Dirty/Reviewed/Accepted state chips

**Spec:** State chips render correctly for all states.

**Code evidence:** `App.tsx` §4478-4487:
- Fresh/Dirty: `worktreeHasDirtyChanges ? "Dirty" : "Fresh"` with `.worktree-accept-state-dirty` / `.worktree-accept-state-fresh`
- Reviewed/Accepted: `worktreeAccepted ? "Accepted" : worktreeReviewed ? "Reviewed" : "Not reviewed"` with `.worktree-accept-state-accepted` when accepted
- Archival only: shown when `!worktreeAccepted`

**Status: PASS** ✓

### AC3 — All 5 action buttons with correct disabled states

**Code evidence:** `App.tsx` §§4550-4556:
| Button | Disabled condition | Expected |
|--------|-------------------|----------|
| Review diff | Never disabled (no `disabled` prop) | Enabled always |
| Copy package path | `!packageMetadata?.path` | Disabled when no path |
| Open dist/release | `!packageMetadata?.path` | Disabled when no path |
| Mark reviewed | `(worktreeHasDirtyChanges && !worktreeDiffReviewed) \|\| worktreeReviewed` | Disabled when dirty+unreviewed, or already reviewed |
| Copy summary | `!packageMetadata?.path` | Disabled when no path |

**Status: PASS** ✓

### AC4 — Disabled reasons visible inline

**Code evidence:** `App.tsx` §§4558-4572:
- `packageMetadata && !packageMetadata.ok` → "No package found."
- `!packageMetadata` → "Package metadata is still loading."
- `worktreeHasDirtyChanges && !worktreeDiffReviewed` → "Review the current diff first."
- `worktreeReviewed && !justReviewed` → "Already reviewed locally."
- `justReviewed` → "Reviewed and accepted locally." (confirmation, not disabled)

**Status: PASS** ✓

### AC5 — Boundary copy contains `{phase}` from package metadata

**Code evidence:** `App.tsx` §4476:
```
{currentPhase
  ? `Local only · ${currentPhase} is current · Older aliases are archival only`
  : "Local only · Older aliases are archival only"}
```

Everywhere `currentPhase` is referenced: §§4476, 4490, 4502, 4530, 4536-4542 — all use `{currentPhase ? ... : ...}` patterns.

**Status: PASS** ✓

### AC6 — Summary clipboard format matches spec

**Code evidence:** `App.tsx` `handleCopySummary` (near §3880):
```
Worktree ${worktreeState}, ${reviewState}, ${acceptanceState}.
Package: ${filename} (${fileSize} MB) — ${packagePath}
```

Where states resolve to: `Fresh|Dirty`, `reviewed|not reviewed`, `accepted|not accepted`.

**Status: PASS** ✓ (clipboard write is non-SSR verifiable; button presence confirmed by tests)

### AC7 — Review diff shows git diff in collapsible section

**Code evidence:** `App.tsx` §4573:
```jsx
{diffOpen && diffResult && (
  <details className="worktree-diff-details" open>
    <summary>Git diff output</summary>
    <pre><code>{diffResult}</code></pre>
  </details>
)}
```

Handler `handleReviewDiff` (near §3845): calls `api.getGitDiff()`, stores result, copies to clipboard, and opens the details panel. `diffOpen` and `diffResult` are separate state vars that let the diff persist after the initial render.

**Status: PASS** ✓

### AC8 — Tests pass (114 App + 17 worktree-ipc)

**Evidence from test run:**
```
apps/desktop test: ✓ src/App.test.ts (114 tests) 666ms
apps/desktop test: ✓ electron/worktree-ipc.test.ts (17 tests) 28ms
apps/desktop test: Test Files  9 passed (9)
apps/desktop test:      Tests  160 passed (160)
```

**Status: PASS** ✓

### AC9 — No demo clutter added

**Code review:** The worktree acceptance card uses production class names (`.worktree-acceptance-card`, `.worktree-accept-left`, `.worktree-accept-center`, `.worktree-accept-right`, etc.). No demo CSS class names, no demo-specific markup, no placeholder copy. The card integrates into the existing three-column workbench without synthetic demo state.

**Status: PASS** ✓

---

## IPC Handler Verification

All handlers in `apps/desktop/electron/worktree-ipc.ts`:

| Handler | Channel | Read-only? | Notes |
|---------|---------|-----------|-------|
| `handleWorktreeGitDiff` | `sda:worktree-git-diff` | ✓ Read-only | git diff --stat HEAD; sanitizes homeDir from output |
| `handleWorktreeOpenDistRelease` | `sda:worktree-open-dist-release` | ✓ Read-only | shell.openPath; path from projectRoot |
| `handleWorktreeOpenWorkspaceRoot` | `sda:worktree-open-workspace-root` | ✓ Read-only | shell.openPath; path from projectRoot |
| `handleWorktreeStatus` | `sda:worktree-status` | ✓ Read-only | git status --porcelain |
| `handleWorktreePackageMetadata` | `sda:worktree-package-metadata` | ✓ Read-only | filesystem scan of dist/release/ |
| `handleHygieneScan` | `sda:hygiene-scan` | ✓ Read-only | file reads only |
| `handleCleanupPreview` | `sda:cleanup-preview` | ✓ Read-only | dry-run, no files modified |
| `handleCleanupExecute` | `sda:cleanup-execute` | ✗ Write | rename within dist/ only; confirmation required |

**Cleanup execute note:** `handleCleanupExecute` renames stale files from `dist/release/` to `dist/.release-archive/<phase>/`. This is a local filesystem rename only — no ServiceNow API writes, no network. The renderer requires user confirmation before calling. This is acceptable for the worktree acceptance scope because:
1. All operations are within the local project tree
2. No ServiceNow API calls
3. Operation is reversible (rename, not delete)
4. Confirmation dialog required in the UI

**Status: PASS** ✓ (all IPC handlers are local-only; the single write operation is local filesystem rename with confirmation)

---

## Safety & Privacy Verification

- [✓] No real ServiceNow login, browser automation, API writes
- [✓] All actions are local-only (clipboard, IPC file reads, local git commands)
- [✓] No Save / Submit / Update / Resolve / Close
- [✓] No real ServiceNow URL, ticket ID, sys_id, or customer data rendered
- [✓] IPC handlers construct paths from `projectRoot` only — no user-supplied path injection
- [✓] `execFileSync` uses hardcoded commands and arguments — no user input passed to shell
- [✓] Git diff output sanitizes home directory (`~` substitution)
- [✓] Boundary chip: "Local only" — clear safety affordance
- [✓] Verify-only disabled reason: "Disabled: start QA Chromium and wait until the browser connection is ready."
- [✓] All disabled reasons are informative without leaking sensitive information

**Status: PASS** ✓

---

## Known Limitations (carried from AS3)

1. `Mark reviewed` sets both `reviewed` and `accepted` simultaneously (no separate acceptance step).
2. No persistent storage of review/acceptance state — in-memory only, resets on reload.
3. No visual diff renderer — git diff displayed as raw text in `<pre>` block.
4. `handleReviewDiff` copies diff to clipboard AND opens collapsible; clipboard is a side effect.
5. Archival alias list is hard-coded (`rc.1, AQ6, AF, AG, AH, AI, AJ`) rather than dynamically discovered.

---

## Manual Checklist for Alan

### Before startup
- [ ] Windows `servicenow-automation.exe` double-click launches Electron window
- [ ] Startup failure shows sanitized diagnostics with log path (no raw paths exposed)

### Worktree Acceptance Card
- [ ] Card titled "Worktree Acceptance" visible in the center work product column
- [ ] Status chip shows "Fresh" (clean worktree) or "Dirty" (uncommitted changes)
- [ ] Package path shows the actual Windows path to the newest `.zip` release artifact
- [ ] Package metadata shows filename and size from disk
- [ ] `"Package metadata is still loading."` shown before IPC fetch completes
- [ ] `"No package found."` shown if no metadata exists

### Three-column layout
- [ ] **Left column** (SOURCES): Package feed with current package item (highlighted), archival aliases, history entry
- [ ] **Center column** (WORK PRODUCT): Package path detail, filename + size, manual validation checklist with 8 steps
- [ ] **Right column** (RUNTIME/ACTIONS): 5 action buttons, disabled reasons, `"Local only"` boundary chip

### Action buttons
- [ ] **Review diff** — clickable; fetches `git diff --stat HEAD`; shows collapsible `<details>` panel with diff output; copies diff to clipboard as side effect
- [ ] **Copy package path** — copies full package path to clipboard; disabled when no path exists
- [ ] **Open dist/release** — opens Windows Explorer at `dist/release/` folder; disabled when no path
- [ ] **Mark reviewed** — enabled when worktree is clean (Fresh) OR diff has been reviewed; after clicking changes to "Reviewed" + shows "Reviewed and accepted locally." confirmation; disabled when dirty changes exist but Review diff not yet clicked (shows "Review the current diff first.")
- [ ] **Copy summary** — copies formatted summary: `Worktree {Fresh|Dirty}, {reviewed|not reviewed}, {accepted|not accepted}. Package: {filename} ({size} MB) — {packagePath}`; disabled when no metadata path

### Disabled states
- [ ] "No package found." — visible when metadata fetch returns `ok: false`
- [ ] "Package metadata is still loading." — visible while metadata is null (before IPC resolves)
- [ ] "Review the current diff first." — visible when dirty changes exist and diff not yet reviewed
- [ ] "Already reviewed locally." — visible when reviewed and not just reviewed this session
- [ ] "Reviewed and accepted locally." — confirmation shown immediately after Mark reviewed clicked

### Boundary copy
Expected: `Local only · {phase} is current · Older aliases are archival only`
Where `{phase}` is the phase tag extracted from the package filename (e.g., AR3, AS3)

### Summary format
Expected clipboard output:
```
Worktree Fresh, not reviewed, not accepted. Package: servicenow-automation-windows-v0.1.0-rc.1-as3-20260607-local.zip (113.1 MB) — /home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-as3-20260607-local.zip
```

### Safety
- [ ] Verify-only never writes to ServiceNow — button properly disabled until CDP readiness
- [ ] Autofill remains separated from Save/Submit/Update/Resolve/Close
- [ ] No raw ServiceNow URL/ticket/fingerprint/credential/session visible in logs/docs
- [ ] All worktree acceptance actions are local-only (clipboard writes, IPC read-only, local git commands)

---

## Verdict

**PASS** ✓

All 9 acceptance criteria verified via code review and test evidence. All 4 automated gates pass. IPC handlers are all local-only (one write handler is local filesystem rename with confirmation). No privacy leaks detected. Manual checklist provided for Alan.

| Category | Result |
|----------|--------|
| pnpm build | PASS |
| pnpm typecheck | PASS |
| pnpm test (160) | PASS |
| pnpm privacy:scan (288 files) | PASS |
| Three-column layout | PASS |
| State chips | PASS |
| 5 action buttons + disabled states | PASS |
| Disabled reasons inline | PASS |
| Boundary copy with `{phase}` | PASS |
| Summary clipboard format | PASS |
| Git diff collapsible | PASS |
| No demo clutter | PASS |
| Safety & privacy | PASS |
| **Overall** | **PASS** |
