# Phase AQ1 — Local Repo Hygiene + Archive Demotion Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AP7 base:** AP1–AP7 changes present (three-column repo-hygiene sub-layout, dynamic hygiene scan IPC, archive-demotion IPC, cleanup-script rewrite)
**Profile:** `sna-orchestrator`
**Task:** `t_fe22badd`

---

## 1. Why this phase — the gap between IPC infrastructure and UI wiring

### Current implementation state

The AM, AL, AP, and AO phases set up the **IPC infrastructure** for live repo hygiene and archive-demotion, but the **UI wiring** was never completed. The repo-hygiene card has the three-column layout, the CSS grid, and all IPC handlers, but at runtime the card shows "Not scanned yet" because the `sda:hygiene-scan` handler is never called.

| Layer | Status | What exists |
|-------|--------|-------------|
| **IPC handlers** (`worktree-ipc.ts`) | DONE | `handleHygieneScan` (live .gitignore, stale count, archive dir, video-analysis), `handleCleanupPreview` (dry-run listing, canonical-zip exclusion), `handleCleanupExecute` (mv to `dist/.release-archive/<phase>/`) |
| **IPC routing** (`main.ts`) | DONE | `sda:hygiene-scan`, `sda:cleanup-preview`, `sda:cleanup-execute` registered |
| **Preload bridge** (`preload.ts`) | DONE | `hygieneScan`, `cleanupPreview`, `cleanupExecute` exposed |
| **Three-column CSS** (`styles.css`) | DONE | `.repo-hygiene-columns` grid (28/46/26% split), dividers, responsive fallback at 900px |
| **cleanup-stale-artifacts.sh** | DONE | Archive-demotion logic (mv instead of rm -rf), dry-run mode, dynamic stale detection |
| **Canonical zip exclusion** | DONE | `v0.1.0-rc.1.zip` excluded from both hygiene scan stale count and cleanup preview |
| **UI: mount-time scan trigger** | **NOT DONE** | `App` component defaults `hygieneScanResult` to `null`; no `useEffect` calls `sda:hygiene-scan` on mount |
| **UI: action button handlers** | **NOT DONE** | Refresh, Open, Export, Copy buttons have no `onClick` handlers; only Cleanup preview toggles a `cleanupPreviewOpen` boolean |
| **UI: cleanup preview content** | **NOT DONE** | Shows static placeholder text "Preview the local cleanup before applying it" instead of IPC-backed dry-run output |
| **UI: archive execute button** | **NOT DONE** | No "Archive stale artifacts" button; no confirmation dialog; the `sda:cleanup-execute` handler is unreachable from the UI |
| **UI: stale archive entries** | **NOT DONE** | Release-readiness handoff card still shows hardcoded `ae-20260607` archive entries (AO3 was never implemented) |
| **UI: Copy path references `ae`** | **NOT DONE** | The "Copy path" button copies a hardcoded `ae` path, not the current AP6 package |
| **Archive: companion file routing** | **BUG** | Companion files (sha256, START-HERE) archived under `unknown/` instead of their phase subdirectory |

### The six gaps

| # | Gap | Location | Severity | Root cause |
|---|-----|----------|----------|------------|
| 1 | **No mount-time hygiene scan** | `App.tsx` — no `useEffect` calling `window.electronAPI.hygieneScan()` | **BLOCKING** — card is permanently "Not scanned yet" | Mount-time IPC call was never implemented; tests use `initialHygieneScanResult` prop which isn't passed in production (`main.tsx: <App />` with no props) |
| 2 | **Action buttons are decorative** | `App.tsx` lines 4203–4206 — Refresh, Open, Export, Copy have no `onClick` | **HIGH** — four of five action buttons do nothing | AM3/AL3 implementation created buttons and disabled logic but never wired IPC calls |
| 3 | **Cleanup preview is static placeholder** | `App.tsx` lines 4215–4223 | **HIGH** — "Preview the local cleanup" text with no actual IPC output | Preview toggles `cleanupPreviewOpen` boolean but doesn't call `window.electronAPI.cleanupPreview()` |
| 4 | **No "Archive stale artifacts" execute button** | `App.tsx` — no button calling `window.electronAPI.cleanupExecute()` | **MEDIUM** — IPC handler exists but unreachable | AM3 spec defined the execute button + confirm dialog but it was never added to the JSX |
| 5 | **Stale `ae` archive entries in release-readiness card** | `App.tsx` lines 4047, 4067–4087, 4130 | **HIGH** — references AE (5+ phases out of date) | AO3 implementation was never completed; the hardcoded archive list and AE path remain |
| 6 | **Companion files archived to `unknown/`** | `handleCleanupExecute` / `extractPhasePrefix` | **MEDIUM** — archive structure is messy; makes recovery harder | Companion files (sha256, START-HERE) are assigned the stale-zip's phase, but the `extractPhasePrefix` regex may not match all filename patterns; 12+ files in `dist/.release-archive/unknown/` |

### Why these gaps are the next priority

1. **User-visible defect** — A first-time user opening the app sees "Not scanned yet" on the hygiene card. The card looks broken.
2. **Stale data risk** — The release-readiness card still shows `ae` as the current package, which is 5+ phases out of date. A user following this guidance would test the wrong artifact.
3. **Safety inconsistency** — The IPC handlers for safe archive-demotion exist but cannot be triggered. The only way to clean up stale artifacts is by running the shell script manually.
4. **Accumulated technical debt** — All five phases (AM, AL, AP, AO, AQ) build on the same code. These wiring gaps have been documented as "follow-up" across multiple scope documents but never resolved.

---

## 2. Current state — `dist/release/` and `dist/.release-archive/`

### dist/release/ (as of AP6)

| File | Status |
|------|--------|
| `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` | **CURRENT** — AP6 package |
| `...-ap6-20260607-local.zip.sha256` | Checksum companion |
| `...-ap6-20260607-local-START-HERE-WINDOWS.txt` | Safety copy companion |

**No stale artifacts in `dist/release/`** — the archive-demotion system already runs or stale artifacts were cleaned manually.

### dist/.release-archive/ (archive state)

| Phase dir | Contents |
|-----------|----------|
| `af/`, `ag/`, `ah/`, `ai6/`, `aj/`, `aj7/`, `ak/` | Zip only (sha256 and START-HERE in `unknown/`) |
| `al/`, `am/` | Full triple (zip + sha256 + START-HERE) |
| `an6/`, `ao6/`, `ap6/` | Full triple |
| `unknown/` | 12+ companion files from phases af–ak |

**Bug:** Files in `unknown/` represent a phase-routing failure. The `extractPhasePrefix` function (or the companion file assignment logic) does not route companion filenames to the correct phase subdirectory when the archive runs via the shell script or IPC handler.

---

## 3. Scope — what AQ1 defines

### Deliverable A — This scope document

Documents the 6 wiring gaps, the current dist/release/ and archive state, the companion-file routing bug, and the AQ2–AQ7 task chain.

### Deliverable B — AQ2–AQ7 task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **AQ2** | UX/copy spec — stale dist/release cleanup workflow | `sna-ui-designer` | AQ1 | Define labels, button text, disabled reasons, confirmation dialog wording, archive-demotion copy, cleanup preview layout, and manual checklist |
| **AQ3** | Implementation — wire hygiene scan IPC, action buttons, preview, archive execute | `sna-frontend-workbench` | AQ2 | Wire `sda:hygiene-scan` on mount, add onClick handlers to all 5 action buttons, replace static cleanup preview with IPC-backed output, add "Archive stale artifacts" button + confirmation dialog, remove stale `ae` archive entries from release-readiness card, update Copy path to use dynamic package metadata |
| **AQ4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AQ3 | Verify hygiene scan populates on mount, all 5 action buttons work, cleanup preview shows real IPC output, archive execute moves files correctly, archive entries removed, Copy path copies current package |
| **AQ5** | Privacy/security audit | `sna-privacy-security` | AQ3 | Audit IPC calls, cleanup preview output, archive confirmation dialog, and action button disclosures |
| **AQ6** | Windows local package refresh | `sna-windows-runtime` | AQ4 + AQ5 | Rebuild fresh AQ-dated package after wiring changes |
| **AQ7** | Final local readiness gate | `sna-release-docs` | AQ4 + AQ5 + AQ6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED |

### Dependencies

```
AQ1 ──→ AQ2 ──→ AQ3 ──→ AQ4 ──┐
                         │     ├──→ AQ6 ──→ AQ7
                         └──→ AQ5 ──┘
```

### Delta from AP-series pattern

- **AQ3 has a larger change budget** than AP3. Expected: 6–8 files (App.tsx for all wiring, worktree-ipc.ts for companion-file bug fix, possibly styles.css for confirmation dialog). Previous phase layout changes were CSS-only (~150 lines); AQ3 is functional wiring.
- **Wiring is the primary change**, not layout. IPC handlers exist; the UI must call them.
- **The stale `ae` archive entries are removed** in AQ3 (carry-over from unimplemented AO3).
- **The companion-file routing bug** is fixed in AQ3.

---

## 4. Implementation guidance for AQ3

### What to change (6 items, ordered by priority)

**1. Mount-time scan (BLOCKING)**

Add a `useEffect` in `App.tsx` that calls `window.electronAPI.hygieneScan()` on mount and stores the result in `hygieneScanResult`:

```typescript
useEffect(() => {
  window.electronAPI.hygieneScan()
    .then((result) => {
      if (result.ok) {
        setHygieneScanResult(result.result);
      }
    })
    .catch((err) => console.error("hygiene scan failed:", err));
}, []);
```

Also add loading and error state:
- `hygieneScanLoading: boolean` — show scan-in-progress indicator in center column
- `hygieneScanError: string | null` — show error state in center column

**2. Action button onClick handlers**

| Button | IPC call | Implementation |
|--------|----------|----------------|
| `Refresh local scan` | `window.electronAPI.hygieneScan()` → `setHygieneScanResult(...)` | Same as mount-time scan; clear stale state before calling |
| `Open workspace root` | `window.electronAPI.openWorkspaceRoot()` → `shell.openPath(projectRoot)` | Add `sda:open-workspace-root` IPC handler in main.ts if not present |
| `Export status markdown` | Generate markdown from `hygieneScanResult` → open in editor | Generate markdown string, call IPC to write to temp file, open with `shell.openPath()` |
| `Copy selected summary` | `navigator.clipboard.writeText(selectedSummary)` | Use `hygieneScanResult` properties (gitignoreDetails, staleArtifactDetails, videoAnalysisDetails) |
| `Cleanup preview` | `window.electronAPI.cleanupPreview()` | See item 3 |

**3. Cleanup preview — IPC-backed output**

Replace lines 4215–4223 (static placeholder) with real IPC-backed rendering:

```typescript
{hygieneScanResult && cleanupPreviewOpen && (
  cleanupPreviewResult ? (
    <div className="cleanup-preview-card">
      <h4>Cleanup preview — {cleanupPreviewResult.totalFiles} files, {cleanupPreviewResult.totalSizeMb} MB</h4>
      <ul className="cleanup-preview-file-list">
        {cleanupPreviewResult.staleFiles.map((f) => (
          <li key={f.name}><code>{f.name}</code> → archive/{f.phase}/</li>
        ))}
      </ul>
      {/* Archive button — see item 4 */}
    </div>
  ) : (
    <p className="cleanup-preview-loading">Loading cleanup preview...</p>
  )
)}
```

Add state:
- `cleanupPreviewResult: CleanupPreviewResult | null`
- `cleanupPreviewLoading: boolean`

The `Cleanup preview` button onClick should:
1. Show loading state
2. Call `window.electronAPI.cleanupPreview()`
3. Set `cleanupPreviewResult`

**4. "Archive stale artifacts" execute button + confirmation dialog**

Add after the file list in the cleanup preview card:

```typescript
<button
  type="button"
  className="local-draft-button archive-button"
  onClick={() => setShowCleanupConfirm(true)}
  disabled={cleanupLoading}
>
  Archive stale artifacts
</button>
```

Add confirmation dialog:

```typescript
{showCleanupConfirm && (
  <div className="cleanup-confirm-overlay">
    <div className="cleanup-confirm-dialog">
      <p>Archive {cleanupPreviewResult.totalFiles} stale packages ({cleanupPreviewResult.totalSizeMb} MB) to dist/.release-archive/?</p>
      <p className="cleanup-confirm-note">This preserves the files for recovery. The release directory will only contain the current package + canonical release.</p>
      <div className="cleanup-confirm-actions">
        <button onClick={handleCleanupExecute}>Confirm archive</button>
        <button onClick={() => setShowCleanupConfirm(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}
```

`handleCleanupExecute` calls `window.electronAPI.cleanupExecute()`, then:
- Shows success toast with file count
- Re-runs `hygieneScan()` to refresh state
- Hides cleanup preview
- Resets `cleanupPreviewResult`

**5. Remove stale `ae` archive entries from release-readiness card**

Remove the `div.handoff-panel` containing "Package archive" (lines 4067–4087). The stale warning (line 4063–4065) should be updated to generic wording since it mentions "older rc/ad/ab packages."

Update the Copy path button (line 4130) to use `worktreePkgMetadata` dynamically instead of the hardcoded `ae` path.

**6. Fix companion-file routing bug**

In `worktree-ipc.ts`, the `handleCleanupExecute` function assigns the `phase` from the stale zip to all companion files. The companion files should have their own phase extracted from their filenames. Verify that `extractPhasePrefix` handles all companion filename patterns (`.sha256`, `-START-HERE-WINDOWS.txt`).

The regex `/-rc\.1-([a-z0-9]+)-20/` should match:
- `servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip.sha256` → extracts `ak`
- `servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local-START-HERE-WINDOWS.txt` → extracts `ak`

If it doesn't, update the regex or add a fallback.

### Scope of changes

| File | Expected change | Reason |
|------|----------------|--------|
| `apps/desktop/src/App.tsx` | Add `useEffect` for mount-time scan, onClick handlers for 5 action buttons, IPC-backed cleanup preview, "Archive stale artifacts" button + confirmation dialog, remove stale `ae` archive entries, update Copy path to dynamic | Core wiring — 6 changes in 1 file |
| `apps/desktop/src/App.test.ts` | Update tests for IPC mock expectations, new action button tests, confirm dialog tests, archive execute tests | Test coverage |
| `apps/desktop/src/styles.css` | May need `.cleanup-confirm-dialog`, `.archive-button` styles (check if they already exist) | Styling for new UI elements |
| `apps/desktop/electron/main.ts` | Add `sda:open-workspace-root` and `sda:export-markdown` IPC handlers if not present | New IPC handlers |
| `apps/desktop/electron/preload.ts` | Expose new bridge methods | IPC bridge |
| `apps/desktop/electron/worktree-ipc.ts` | Fix companion-file routing in `handleCleanupExecute`; fix `extractPhasePrefix` if needed | Bug fix |

---

## 5. Non-goals

| Item | Reason |
|------|--------|
| New center-workspace cards | Out of scope — only wiring existing hygiene card |
| Live ServiceNow login, browsing, API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Attachment upload | Red-zone — out of scope for v0.x |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams/Outlook/phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, cookies, storage-state, secrets | Red-zone — never captured |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Modifying historical AG/AH/AI/AJ/AK/AL/AM/AN/AO/AP status docs | They are archival records — do not alter |
| Three-column outer workbench layout redesign | Separate P0 recovery threads |
| Chromium provisioning, startup diagnostics | Separate P0 recovery threads |
| Windows packaging toolchain changes | Out of scope — package refresh only (AQ6) |
| Cron job creation or modification | Red-zone — not in local-only scope |
| New hygiene scan items | The 3 existing items stay. No new items. |
| Re-architecting the IPC layer | IPC handlers work correctly; only UI wiring is missing |

---

## 6. Safety boundary

- No real ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified — only new AQ-phase docs and the updated hygiene card are in scope
- AQ3 implementation is UI wiring + IPC calls only — no new IPC channels that introduce ServiceNow connectivity
- The "Archive stale artifacts" button and confirmation dialog must stay local-only — no green/red buttons that imply release
- The archive-demotion path uses `fs.renameSync()` (same-filesystem), not copy-then-delete
- If a file rename fails, the handler logs the error, skips the file, and continues — no cascade failure
- Archive directory `dist/.release-archive/` is gitignored (already covered by `dist/` ignore rules)
- The `cleanupExecute` handler must NOT accept user-supplied paths — only the internally computed project root

---

## 7. Gate policy

| Gate | Required? | Rationale |
|------|-----------|-----------|
| `pnpm build` | YES (for AQ3, AQ6) | Must confirm wiring changes compile |
| `pnpm typecheck` | YES (for AQ3) | Must confirm TypeScript type safety after IPC additions |
| `pnpm test` | YES (for AQ3, AQ4) | Tests must verify mount-time scan, action buttons, cleanup preview, archive execute |
| `pnpm privacy:scan` | YES (for AQ5) | Docs and copy must not leak stale phase identifiers or real data |

AQ1 (this doc) and AQ2 (UX spec) are document-only — no code gates required.

---

## 8. Detailed start/acceptance criteria

### AQ1 (this task) completion

- [x] Scope document written: `docs/status/phase-AQ1-local-repo-hygiene-archive-demotion-scope-2026-06-07.md`
- [x] Gap identified: mount-time scan missing, action buttons decorative, cleanup preview static, no archive execute button, stale `ae` entries, companion-file routing bug
- [x] AQ2–AQ7 pipeline defined
- [x] Safety boundaries documented
- [x] No false promise of live ServiceNow or production action in scope
- [x] Implementation guidance scoped for AQ3

### AQ2 — UX/copy spec acceptance criteria

- [ ] Exact copy for "Refresh local scan", "Open workspace root", "Export status markdown", "Copy selected summary", "Cleanup preview" button labels and disabled-reason text
- [ ] Exact copy for "Archive stale artifacts" button label, confirmation dialog, toast notification, and post-cleanup state
- [ ] Exact copy for cleanup preview dry-run output display (file listing, size, target archive path)
- [ ] Decision: confirmation dialog layout (modal vs inline overlay)
- [ ] Decision: whether to show archive path in confirmation
- [ ] Decision: what "Copy selected summary" copies (which hygiene item fields)
- [ ] Copy for cleanup preview loading state
- [ ] Copy for cleanup execute error state (per-file failure message)
- [ ] Local-only boundary copy verified (no green/red buttons that imply release)

### AQ3 — Implementation acceptance criteria

- [ ] Hygiene scan runs on mount via `useEffect` — card populates with live data, not "Not scanned yet"
- [ ] Loading indicator shown while scan runs
- [ ] Error message shown if scan fails
- [ ] "Refresh local scan" button re-runs hygiene scan
- [ ] "Open workspace root" opens the project directory via `shell.openPath()`
- [ ] "Export status markdown" produces a sanitized markdown file and opens it
- [ ] "Copy selected summary" copies the selected hygiene item's detail text
- [ ] "Cleanup preview" button calls `sda:cleanup-preview` IPC and shows real file listing
- [ ] Cleanup preview shows dry-run file listing with archive target paths
- [ ] "Archive stale artifacts" button appears below cleanup preview when stale artifacts exist
- [ ] "Archive stale artifacts" button is disabled during loading
- [ ] Confirmation dialog shows exact file count and size
- [ ] Confirmed archive-demotion moves files to `dist/.release-archive/<phase>/`
- [ ] Post-archive hygiene scan refresh shows stale count = 0
- [ ] Success toast shown after archive completes
- [ ] Stale `ae` hardcoded archive entries removed from release-readiness handoff card
- [ ] Stale `ae` hardcoded path removed from Copy path button (uses dynamic `worktreePkgMetadata`)
- [ ] Stale warning copy updated to generic wording (no specific phase letters)
- [ ] Companion-file routing bug fixed — no files land in `unknown/` bucket
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (existing + new tests)
- [ ] `pnpm privacy:scan` passes

### AQ4 — QA acceptance criteria

- [ ] All 4 gates pass
- [ ] Hygiene scan populates on app mount (not "Not scanned yet")
- [ ] All 5 action buttons behave correctly
- [ ] Cleanup preview shows real IPC output
- [ ] Archive execute moves files correctly
- [ ] Post-cleanup state shows stale count = 0
- [ ] Release-readiness card no longer shows `ae` archive entries
- [ ] Copy path copies the current (AP6+) package path
- [ ] Archive directory has correct structure (no `unknown/` files for new archives)
- [ ] Card ordering preserved (handoff → hygiene → worktree-acceptance → selected source)
- [ ] Boundary copy and safety bounds remain explicit and unchanged
- [ ] Alan manual checklist provided

### AQ5 — Privacy/security audit criteria

- [ ] No sensitive data in IPC handler responses or confirmation dialog content
- [ ] No stale phase labels in user-visible copy (except in file paths in archive listing)
- [ ] No ServiceNow identifiers, URLs, ticket IDs, or real field values
- [ ] All IPC handlers are pre-approved (sda:hygiene-scan, sda:cleanup-preview, sda:cleanup-execute — all exist)
- [ ] Archive directory is gitignored (verified)
- [ ] No user-supplied path accepted by cleanup-execute handler
- [ ] Approval (APPROVE) or block (BLOCKED) with sanitized evidence

### AQ6 — Package refresh criteria

- [ ] Fresh AQ-dated zip is newest in `dist/release/`
- [ ] SHA256 checksum verified
- [ ] Archive integrity verified (expected entries present, no forbidden markers)

### AQ7 — Final gate criteria

- [ ] Recommendation: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED
- [ ] All 4 gates pass + checksum OK
- [ ] No release/push/merge authorization
- [ ] Phase status recorded in release summary

---

## 9. Verification plan

### AQ2 (UX/copy spec)
- Spec reviewed and approved by Alan before AQ3 begins

### AQ3 (Implementation)
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — all existing tests pass
- `pnpm privacy:scan` — PASS
- Visual: hygiene card shows live data on mount (no "Not scanned yet")
- Visual: all 5 action buttons functional in right column
- Visual: cleanup preview shows file listing with archive target paths
- Visual: "Archive stale artifacts" button + confirmation dialog renders
- Visual: release-readiness card no longer shows `ae` archive entries
- Visual: Copy path copies current (AP6) path, not `ae`
- Behavior: archive execute moves files correctly, refresh shows clean state
- Bug fix: new archive runs route companion files to correct phase dirs, not `unknown/`

### AQ4 (QA acceptance)
- All 4 gates pass
- Hygiene scan live data verified
- All action buttons verified
- Cleanup preview + archive execute verified
- Archive structure correct
- No regression

### AQ5 (Privacy/safety)
- No new privacy violations
- Safety boundary copy verified (unchanged)
- No real data exposure

### AQ6 (Package refresh)
- Fresh artifact produced
- Artifact includes AQ3 changes

### AQ7 (Final gate)
- All upstream gates complete
- Phase status recorded
- Release summary written

---

## 10. Status

```
Phase AQ1 — LOCAL REPO HYGIENE + ARCHIVE DEMOTION SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Gaps identified:
  1. (BLOCKING) Mount-time hygiene scan never called — card shows "Not scanned yet" permanently
  2. (HIGH)     Action buttons (Refresh, Open, Export, Copy) have no onClick handlers
  3. (HIGH)     Cleanup preview is static placeholder text, not IPC-backed output
  4. (MEDIUM)   No "Archive stale artifacts" execute button — IPC handler unreachable
  5. (HIGH)     Stale `ae-20260607` hardcoded archive entries in release-readiness card (AO3 never done)
  6. (MEDIUM)   Companion files archived to `unknown/` bucket instead of correct phase dir

Downstream tasks:
  - AQ2 (t_17779f68): UX/copy spec for stale dist/release cleanup workflow → sna-ui-designer
  - AQ3: Implementation — wire hygiene scan IPC, action buttons, preview, archive execute → sna-frontend-workbench
  - AQ4: QA acceptance + Alan manual checklist → sna-qa-acceptance
  - AQ5: Privacy/security audit → sna-privacy-security
  - AQ6: Windows local package refresh → sna-windows-runtime
  - AQ7: Final local readiness gate → sna-release-docs

Current AP6 package:
  \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\
    servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip

Note: The AQ6 refresh will produce a fresh AQ-dated package after wiring changes.
The companion-file routing bug (unknown/ bucket) should be fixed in AQ3.

Red-zone items excluded: 12
Non-goals: 14
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
