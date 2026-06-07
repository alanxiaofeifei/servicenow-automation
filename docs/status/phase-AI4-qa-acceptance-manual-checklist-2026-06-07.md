# AI4 — QA Acceptance Verdict: PASS

## Automated Gates (all pass)

| Gate | Status | Detail |
|------|--------|--------|
| pnpm build | PASS | main + preload + renderer |
| pnpm typecheck | PASS | 7/7 workspace projects |
| pnpm test | PASS | Desktop: 144/144 (9 files; 17 worktree-ipc, 98 App) |
| pnpm privacy:scan | PASS | 288 files |

## Alan's Manual Checklist (Windows)

### 1. Double-click entrypoint opens tool window

1. Navigate to `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\` in File Explorer.
2. Double-click the newest `.exe` (the one shown in the Worktree Acceptance Checkpoint card).
3. **Expected:** Desktop window opens showing the Operator Workbench with three-column layout.
4. **If fail:** Check `%APPDATA%/servicenow-automation/logs/` for the startup diagnostic.

### 2. Startup failure shows clear sanitized diagnostics

1. (To test this path, temporarily rename or remove the Chromium runtime.)
2. **Expected:** Startup Diagnostic Banner appears with:
   - Sanitized reason (e.g., "dedicated browser runtime unavailable")
   - Sanitized log path (no raw `/tmp/servicenow-automation/` — shows `.../startup-logs/...`)
   - Dismiss button
3. **Evidence:** Screenshot the diagnostic overlay. Redact any path that contains `/tmp/servicenow-automation`.

### 3. Start QA Chromium visibly launches dedicated Chromium

1. Click "Start QA Chromium" in the operator toolbar.
2. **Expected:** A separate Chromium window opens (not your default browser). The app shows CDP readiness.
3. **Evidence:** Screenshot the app showing "CDP ready" or similar readiness indicator.

### 4. App shows sanitized CDP readiness

1. After CDP connects, verify the runtime rail shows status text like "CDP ready" — no raw endpoint URL.

### 5. Verify Current Incident is disabled before CDP readiness

1. Before starting Chromium, check the "Verify current Incident" button.
2. **Expected:** Disabled with clear reason (e.g., "CDP not ready").

### 6. Verify Current Incident enables after CDP readiness

1. After starting Chromium, check the "Verify current Incident" button.
2. **Expected:** Enabled (though it will still use OnlyRead mode).

### 7. Verify-only does not write

1. With CDP ready, click "Verify current Incident".
2. **Expected:** Shows read-only field values. No Save/Submit/Update/Resolve/Close action occurs.
3. **Evidence:** Check the App logs for absence of write operations.

### 8. Autofill remains separated from Save/Submit/Update/Resolve/Close

1. Run Autofill in the QA panel.
2. **Expected:** Autofill completion message says "No Save, Submit, Update, Resolve, Close, upload, email, or ServiceNow API was used."

### 9. Three-column UI is visible

Open the app and verify:
- **Left column:** source navigation, history panel, settings gear
- **Center column:** source detail, TicketDraft panel, field plan markup
- **Right column:** runtime actions (Start/Verify/Autofill), templates, status rail, safety indicators

### 10. Worktree Acceptance Checkpoint card renders correctly

Already verified in unit tests, but confirm visually:

1. Locate the "Worktree Acceptance Checkpoint" card in the center column (below Repo Hygiene, above Selected Source).
2. Verify the current local Windows package path shows a UNC path starting with `\\\\wsl.localhost\\Ubuntu-Compact\\`.
3. Verify SHA256 and mtime are populated (not "Loading..." or "No package found").
4. Verify the queue shows: Dirty, Fresh, Stale, History state items.
5. Verify all 5 action buttons render: Review diff, Copy package path, Open dist/release, Mark reviewed, Copy summary.
6. Click "Review diff" — expected: diff panel opens showing `git diff --stat HEAD` output against the worktree branch.
7. Click "Open dist/release" — expected: Windows File Explorer opens to the repo's `dist/release/` directory.
8. "Mark reviewed" state: currently disabled (worktree has dirty changes from this phase). After committing changes and relaunching, it should enable. (Acceptance is a human decision — no auto-action.)
9. Verify footer says "Local only" and "No live ServiceNow action, upload, PR, merge, tag, or release is implied."

### 11. Privacy check

1. No raw ServiceNow URL, ticket ID, sys_id, requester name, assignment group, or credential appears in any log, diagnostic, or card text.
2. The UNC path shown is the SANITIZED `\\\\wsl.localhost\\Ubuntu-Compact\\...` form — not a raw Linux path.
3. No hardcoded SHA256 values remain (all loaded dynamically).

## PASS / FAIL Decision

- [ ] PASS — all checks above pass, all 4 automated gates pass, no stale paths, no forbidden writes.
- [ ] FAIL — note which manual step failed and rework requirement.

## Evidence Record

- App.tsx changes: Worktree acceptance card + handleReviewDiff + dynamic metadata (diff HEAD — `apps/desktop/src/App.tsx` + `+228` lines)
- main.ts changes: IPC handlers for 4 worktree operations (diff HEAD — `apps/desktop/electron/main.ts` +5/-1)
- preload.ts changes: worktreeApi bridge (diff HEAD — `apps/desktop/electron/preload.ts` +9/-1)
- worktree-ipc.ts: 129 lines, 4 handlers (git diff, open dist/release, status, package metadata)
- worktree-ipc.test.ts: 310 lines, 17 tests
- App.test.ts: 5 worktree acceptance tests
- Privacy: 288 files scanned, 0 leaks
- Commands run: `pnpm build && pnpm typecheck && pnpm test && pnpm privacy:scan`
