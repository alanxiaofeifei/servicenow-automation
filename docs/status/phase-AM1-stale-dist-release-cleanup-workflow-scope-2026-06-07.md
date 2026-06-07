# Phase AM1 — Stale `dist/release/` Artifact Cleanup Workflow and Archive-Demotion Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AL7 base:** AL7 final gate (`t_91058aed`) — READY-FOR-MANUAL-VALIDATION-ONLY
**Profile:** `sna-orchestrator`
**Task:** `t_9ad21b17`

---

## 1. Why this phase — the growing stale-artifact problem after AL7

### AL7 outcome

AL7 (final local readiness gate for dynamic repo-hygiene polish) returned **READY-FOR-MANUAL-VALIDATION-ONLY**. The AL local Windows package is the newest dated zip, checksum-verified, and the repo-hygiene card now dynamically reads live state. All 4 gates pass.

**However, `dist/release/` now holds 7 stale artifact sets** — 21 extra files accumulating ~350 MB of unreferenced local build output. Every new pipeline iteration (AF → AG → AH → AI6 → AJ → AJ7 → AK → AL) adds another 3-file set (zip + sha256 + START-HERE). There is no workflow to remove or demote them.

### The four gaps that make cleanup workflow the next priority

| # | Gap | Detail | Blocking weight |
|---|-----|--------|-----------------|
| 1 | **Cleanup script is frozen in AG1** | `scripts/hygiene/cleanup-stale-artifacts.sh` patterns `*-ab-*`, `*-ad-*`, `*-ae-*` — those artifacts were deleted in AG1 and no longer exist. The script would delete nothing today. No one updated it as the stale artifact list evolved through AG→AL. | HIGH — the script is a dead codepath |
| 2 | **Cleanup preview copies to clipboard — does not execute** | The UI's "Cleanup preview" button (App.tsx:4457) runs `navigator.clipboard.writeText(preview)` with a short summary string. There is no `Execute cleanup` button, no IPC handler for actual artifact removal, and no confirmation dialog. The preview is read-only. | HIGH — users can see what's stale but cannot act |
| 3 | **No archive-demotion path** | The AG1 script used **deletion** (`rm -rf`). If Alan accidentally deletes a stale package he later needs, the only recovery is a full rebuild. For a local-only worktree, an archive directory is safer than deletion. | MEDIUM — deletion is functional but risky |
| 4 | **Outdated stale patterns** | The hygiene scan (`worktree-ipc.ts:216`: `zipFiles.slice(1)`) treats *everything except the newest zip* as stale, including the canonical `v0.1.0-rc.1.zip`. The fairness label says "only canonical + latest remain" but the actual stale-detection logic would include the canonical zip in the stale count if it's not the newest. This is a data-truth gap. | MEDIUM — cosmetic but impacts count accuracy |

### Why not a different next phase

- **Feature expansion** (new cards, three-column layout, CDP wiring) is out of scope until P0 recovery is done (system prompt caveats).
- **The cleanup workflow is purely local** — no ServiceNow, no browser, no release operations. It fits the local-only scope of the current worktree.
- **Every new pipeline phase adds more stale weight.** The cost of deferring grows with each AK/AJ/AH/AG/AL iteration.

---

## 2. Current state — `dist/release/` inventory as of AL6/AL7

### Freshness ordering (newest first)

| # | mtime (CST) | Package | Size | Keep/Stale |
|---|-------------|---------|------|------------|
| 1 | 06:20 | `servicenow-automation-windows-v0.1.0-rc.1-al-20260607-local.zip` + sha256 + START-HERE | 118,603,614 B | **KEEP** — current AL package |
| — | 06:20 | `v0.1.0-rc.1.zip` + sha256 + `START-HERE-WINDOWS.txt` | 118,602,637 B | **KEEP** — canonical published prerelease |
| 2 | 05:48 | `...-ak-20260607-local.zip` + sha256 + START-HERE | 118,600,899 B | Stale (superseded) |
| 3 | 05:16 | `...-aj7-20260607-local.zip` + sha256 + START-HERE | 118,601,041 B | Stale (superseded) |
| 4 | 05:09 | `...-aj-20260607-local.zip` + sha256 + START-HERE | 118,600,788 B | Stale (superseded) |
| 5 | 04:38 | `...-ai6-20260607-local.zip` + sha256 + START-HERE | 118,600,763 B | Stale (superseded) |
| 6 | 03:59 | `...-ah-20260607-local.zip` + sha256 + START-HERE | 118,599,245 B | Stale (superseded) |
| 7 | 03:36 | `...-ag-20260607-local.zip` + sha256 + START-HERE | 118,596,760 B | Stale (superseded) |
| 8 | 02:39 | `...-af-20260607-local.zip` + sha256 | 118,592,457 B | Stale (superseded) |

### Keep set (3 files)
- Canonical: `v0.1.0-rc.1.zip`, `v0.1.0-rc.1.zip.sha256`, `START-HERE-WINDOWS.txt`
- Current: `...-al-20260607-local.zip`, `...-al.sha256`, `...-al-START-HERE-WINDOWS.txt`

### Stale set (21 files)
- 7 stale zip files (ak, aj7, aj, ai6, ah, ag, af)
- 7 stale sha256 files
- 6 stale START-HERE files (af has no START-HERE)
- **Total stale: ~340 MB**

### What the hygiene scan reports

```
hygieneScanResult.staleArtifactCount = 8  (includes canonical zip in slice(1))
hygieneScanResult.staleArtifactSizeMb = ~340
staleArtifactDetails = "Stale ak, aj7, aj, ai6, ah, ag, af, v0.1.0-rc.1 remain. 8 files, 340 MB"
```

The count is off by 1 (8 reported, but only 7 are truly stale — canonical `v0.1.0-rc.1.zip` is included because `slice(1)` excludes only the newest zip). This must be fixed in the cleanup workflow.

---

## 3. Scope — what AM1 defines

### Deliverable A — This scope document

Documents the 4 gaps, the current stale-artifact inventory, and the AM2–AM7 task chain. No implementation.

### Deliverable B — AM2–AM7 task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **AM2** | UX/copy spec — stale-artifact cleanup workflow and archive-demotion | `sna-ui-designer` | AM1 | Design the user-visible path: a new "Archive stale artifacts" button vs. extending existing "Cleanup preview" to include execution, a confirmation dialog, archive-demotion UX, and post-cleanup state. |
| **AM3** | Implementation — cleanup workflow IPC and UI wiring | `sna-frontend-workbench` | AM2 | Replace the clipboard-only cleanup preview with a real IPC handler. Add archive-demotion logic that moves stale artifacts to `dist/.release-archive/`. Add confirmation dialog. Update stale-artifact detection to exclude canonical `v0.1.0-rc.1.zip`. |
| **AM4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AM3 | Verify archive-demotion moves files correctly, confirmation dialog shows correct counts, hygiene scan reflects post-cleanup state, stale count excludes canonical zip. |
| **AM5** | Privacy/security audit | `sna-privacy-security` | AM3 | Audit the archive-demotion path: no secrets leaked into archive directory, no file operations performed against user paths, no sensitive metadata included in confirmation dialog. |
| **AM6** | Windows local package refresh | `sna-windows-runtime` | AM4 + AM5 | Rebuild fresh AM-dated package after cleanup-workflow changes. Verify checksum and freshness. |
| **AM7** | Final local readiness gate | `codex-gpt55-control` | AM6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED. |

### Dependencies

```
AM1 ──→ AM2 ──→ AM3 ──→ AM4 ──┐
                         │     ├──→ AM6 ──→ AM7
                         └──→ AM5 ──┘
```

### Delta from AL-series pattern

- **AM3 has a larger change budget** than AL3. Expected: 6–9 files (main.ts, preload.ts, worktree-ipc.ts, App.tsx, App.test.ts, styles.css, the cleanup script itself, plus the new archive directory).
- **The cleanup script becomes IPC-backed** — no direct shell invocation from the UI. The IPC handler calls the script (or its logic) from Node.js.
- **Archive-demotion replaces deletion** — stale artifacts move to `dist/.release-archive/` instead of being deleted.
- **The canonical zip exclusion bug is fixed** in the hygiene scan logic.

---

## 4. Design proposal — archive-demotion workflow

### Overview

Instead of deleting stale artifacts (the AG1 approach), AM3 should implement **archive demotion**:

```
Current:  dist/release/          → (stale files stay, no action taken)
Proposed: dist/release/          → (current + canonical only)
          dist/.release-archive/ → (stale files moved here, gitignored)
```

This gives Alan a recoverable safety net: old packages are still available in the archive directory without cluttering the primary release directory.

### User-visible flow

1. Alan opens the hygiene card. "Stale dist/release/ artifacts" shows **Pending** with count & size.
2. Alan selects the stale item. The right action rail shows "Cleanup preview" (enabled).
3. **New: "Cleanup preview" now calls an IPC handler** that returns the dry-run output instead of formatting a string in the renderer. This shows the exact file listing that would be archived.
4. **New: "Archive stale artifacts" button** appears below "Cleanup preview" when stale artifacts exist. Disabled during loading.
5. Clicking "Archive stale artifacts" shows a **confirmation dialog**: "Archive [N] stale packages ([N] MB) to dist/.release-archive/? This preserves the files for recovery. The release directory will only contain the current package + canonical release."
6. Alan confirms → IPC handler moves files → confirmation toast: "Archived [N] stale packages to dist/.release-archive/. Release directory now clean."
7. Hygiene scan refreshes → "Stale dist/release/ artifacts" shows **Verified** with "No stale artifacts remain."

### Archive directory structure

```
dist/.release-archive/
  ↳ af-20260607/
      ↳ servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip
      ↳ servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip.sha256
  ↳ ag-20260607/
      ↳ ...
  ↳ ah-20260607/
      ↳ ...
  ↳ ai6-20260607/
      ↳ ...
  ↳ aj-20260607/
      ↳ ...
  ↳ aj7-20260607/
      ↳ ...
  ↳ ak-20260607/
      ↳ ...
```

Each stale phase gets its own subdirectory named after its phase prefix and date. This keeps the archive organized and recoverable.

### Hygiene scan changes

The `worktree-ipc.ts:handleHygieneScan` function needs two fixes:

1. **Exclude canonical zip from stale count.** Currently `zipFiles.slice(1)` treats everything except the absolute newest zip as stale. The canonical `v0.1.0-rc.1.zip` should be excluded from the stale count even if it's not the newest.
2. **Add archive-directory awareness.** The scan should check `dist/.release-archive/` existence and list what's in it, but not count archived files as stale.

### New IPC handlers needed

| Handler | Purpose |
|---------|---------|
| `sda:cleanup-preview` | Returns dry-run output: list of files that would be archived, total size. No writes. |
| `sda:cleanup-execute` | Moves stale files from `dist/release/` to `dist/.release-archive/`. Requires confirmation from renderer first. Returns success count, new archive path, freed bytes. |

The `sda:cleanup-execute` handler must:
- Use `fs.renameSync()` (same-filesystem move, instant — no copy overhead)
- Handle errors per-file (if one file fails, log it and continue)
- Return a structured result ({ archived: number, failed: number, archiveDir: string })
- Not delete anything — only move

---

## 5. Implementation guidance for AM3

### What to change

**1. `scripts/hygiene/cleanup-stale-artifacts.sh` — replace deletion with archive-demotion**

Replace the `rm -rf` section with `mv` logic that moves stale files to `../../dist/.release-archive/<phase>/`. Keep the dry-run mode for preview. Update stale globs to be dynamic-based (not hardcoded `ab`/`ad`/`ae`):

- **Keep:** canonical `v0.1.0-rc.1.zip`, `v0.1.0-rc.1.zip.sha256`, `START-HERE-WINDOWS.txt`
- **Keep:** newest zip (whichever it is at runtime)
- **Archive:** everything else that matches `*-<phase>-*-local.zip`, `*-<phase>-sha256`, `*-<phase>-START-HERE*`

Alternatively, replace the shell script entirely with a Node.js implementation in `worktree-ipc.ts` for safety and platform independence.

**2. `apps/desktop/electron/worktree-ipc.ts` — add archive-demotion logic**

| Function | Purpose |
|----------|---------|
| `handleCleanupPreview(projectRoot)` | Returns dry-run listing from the script or native Node.js logic. No writes. |
| `handleCleanupExecute(projectRoot)` | Confirms user already confirmed via dialog in renderer. Moves files to `dist/.release-archive/`. Returns structured result. |
| `handleHygieneScan` fix | Exclude canonical zip from stale count. Add archive-directory awareness. |

**3. `apps/desktop/electron/main.ts` — register new IPC handlers**

```typescript
ipcMain.handle("sda:cleanup-preview", async () => {
  const projectRoot = findProjectRoot();
  return handleCleanupPreview(projectRoot);
});
ipcMain.handle("sda:cleanup-execute", async () => {
  const projectRoot = findProjectRoot();
  return handleCleanupExecute(projectRoot);
});
```

**4. `apps/desktop/electron/preload.ts` — expose new bridge methods**

```typescript
cleanupPreview: () => ipcRenderer.invoke("sda:cleanup-preview"),
cleanupExecute: () => ipcRenderer.invoke("sda:cleanup-execute"),
```

**5. `apps/desktop/src/App.tsx` — add "Archive stale artifacts" button and confirmation dialog**

- Replace clipboard-only preview with IPC-backed preview
- Add "Archive stale artifacts" button below "Cleanup preview"
- Add confirmation dialog component (modal or inline expand)
- Add toast notification on success
- Update selected hygiene item after cleanup completes

**6. `apps/desktop/src/App.test.ts` — update tests**

- Update existing cleanup-preview test to mock IPC call instead of clipboard assertion
- Add test for "Archive stale artifacts" button render state
- Add test for confirmation dialog content
- Add test for post-cleanup state (stale count = 0)

**7. `apps/desktop/src/styles.css` — new styles**

- `.cleanup-confirm-dialog` — confirmation modal
- `.archive-button` — visual distinction from preview button

### Scope of changes

| File | Expected change | Reason |
|------|----------------|--------|
| `scripts/hygiene/cleanup-stale-artifacts.sh` | Replace deletion with archive-demotion; dynamic stale detection | Core of archive-demotion |
| `apps/desktop/electron/worktree-ipc.ts` | Add `handleCleanupPreview`, `handleCleanupExecute`, fix `handleHygieneScan` stale/canonical exclusion | IPC layer needs new handlers |
| `apps/desktop/electron/main.ts` | Register `sda:cleanup-preview` and `sda:cleanup-execute` | IPC routing |
| `apps/desktop/electron/preload.ts` | Expose `cleanupPreview` and `cleanupExecute` | Renderer bridge |
| `apps/desktop/src/App.tsx` | Replace clipboard preview with IPC call; add "Archive" button + confirmation dialog | User-visible workflow |
| `apps/desktop/src/App.test.ts` | Update preview test; add archive-button and post-cleanup tests | Test coverage |
| `apps/desktop/src/styles.css` | New modal and archive-button styles | Visual polish |

---

## 6. Non-goals

| Item | Reason |
|------|--------|
| Adding new center-workspace cards | Out of scope — only modifying existing hygiene card |
| Live ServiceNow login, browsing, API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Attachment upload | Red-zone — out of scope for v0.x |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams/Outlook/phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, cookies, storage-state, secrets | Red-zone — never captured |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Modifying historical AG/AH/AI/AJ/AK/AL status docs | They are archival records — do not alter |
| Three-column layout redesign | Separate P0 recovery threads (see system prompt) |
| Chromium provisioning, startup diagnostics | Separate P0 recovery threads |
| Windows packaging toolchain changes | Out of scope — package refresh only (AM6) |
| Cron job creation or modification | Red-zone — not in local-only scope |
| Trash/recycle bin integration | Over-engineering — archive dir is simpler |
| `git rm` or history rewriting | Archive dir is gitignored; no git commands |

---

## 7. Safety boundary

- No real ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified — only new AM-phase docs and the updated hygiene card/script are in scope
- AM3 implementation is local-archive-demotion only — no ServiceNow connectivity, no upload, no release actions
- The `sda:cleanup-execute` handler must NOT accept user-supplied paths — only the internally computed project root
- Archive directory `dist/.release-archive/` is gitignored (already covered by `dist/` ignore rules)
- The `mv` operation is same-filesystem and instant — no copy/delete windows that could lose data
- If a file rename fails, the handler logs the error, skips the file, and continues — no cascade failure

---

## 8. Gate policy

| Gate | Required? | Rationale |
|------|-----------|-----------|
| `pnpm build` | YES (for AM3, AM6) | Must confirm changes compile |
| `pnpm typecheck` | YES (for AM3) | Must confirm TypeScript type safety after IPC additions |
| `pnpm test` | YES (for AM3, AM4) | Tests must verify archive-demotion behavior and post-cleanup state |
| `pnpm privacy:scan` | YES (for AM5) | Docs and copy must not leak stale phase identifiers or real data |

AM1 (this doc) and AM2 (UX spec) are document-only — no code gates required.

---

## 9. Start/acceptance criteria

### AM1 (this task) completion

- [x] Scope document written: `docs/status/phase-AM1-stale-dist-release-cleanup-workflow-scope-2026-06-07.md`
- [x] Gap identified: stale cleanup script, clipboard-only preview, no archive-demotion, canonical zip counted as stale
- [x] AM2–AM7 pipeline defined
- [x] Safety boundaries documented
- [x] No false promise of live ServiceNow or production action in scope
- [x] Implementation guidance scoped for AM3

### AM2 — UX/copy spec acceptance criteria

- [ ] Exact copy for "Archive stale artifacts" button, confirmation dialog, toast notification, and post-cleanup state
- [ ] Wireframe for confirmation dialog layout
- [ ] Decision: modal vs inline confirmation
- [ ] Decision: whether to show archive path in confirmation
- [ ] Local-only boundary copy verified (no green/red buttons that imply release)

### AM3 — Implementation acceptance criteria

- [ ] `Cleanup preview` calls actual IPC and returns dry-run listing (not clipboard-only)
- [ ] `Archive stale artifacts` button visible when stale artifacts exist
- [ ] Confirmation dialog shows exact stale file count and size
- [ ] Confirmed archive-demotion: files move to `dist/.release-archive/` within same `dist/` filesystem
- [ ] Post-cleanup hygiene scan shows "No stale artifacts" (stale count = 0)
- [ ] Canonical `v0.1.0-rc.1.zip` excluded from stale count
- [ ] Hygiene scan references archive directory in a separate info row (not stale)
- [ ] All error cases handled with user-visible messages
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (existing + new tests)
- [ ] `pnpm privacy:scan` passes

### AM4 — QA acceptance criteria

- [ ] All 4 gates pass
- [ ] Archive-demotion works on both small and large file counts
- [ ] Confirmation dialog content matches spec
- [ ] Post-cleanup state: `dist/release/` has 3 files (canonical + current package triple), archive directory has the rest
- [ ] Alan manual checklist provided

### AM5 — Privacy/security audit criteria

- [ ] No sensitive data in IPC handlers or confirmation dialog content
- [ ] No stale phase labels in user-visible copy
- [ ] No ServiceNow identifiers, URLs, ticket IDs, or real field values
- [ ] Archive directory is gitignored (verified)
- [ ] Handler does not accept user-supplied paths
- [ ] Approval (APPROVE) or block (BLOCKED) with sanitized evidence

### AM6 — Package refresh criteria

- [ ] Fresh AM-dated zip is newest in `dist/release/`
- [ ] SHA256 checksum verified
- [ ] Archive integrity verified (expected entries present, no forbidden markers)

### AM7 — Final gate criteria

- [ ] Recommendation: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED
- [ ] All 4 gates pass + checksum OK
- [ ] No release/push/merge authorization

---

## 10. Freshness ordering (as of AL7)

| mtime | Filename | Status |
|-------|----------|--------|
| Latest | `...-al-20260607-local.zip` | **CURRENT — AL** |
| ↓ | `...-ak-20260607-local.zip` | **→ to archive** |
| ↓ | `...-aj7-20260607-local.zip` | **→ to archive** |
| ↓ | `...-aj-20260607-local.zip` | **→ to archive** |
| ↓ | `...-ai6-20260607-local.zip` | **→ to archive** |
| ↓ | `...-ah-20260607-local.zip` | **→ to archive** |
| ↓ | `...-ag-20260607-local.zip` | **→ to archive** |
| ↓ | `...-af-20260607-local.zip` | **→ to archive** |
| ↓ | `v0.1.0-rc.1.zip` | Canonical (kept) |

The AM6 package refresh will produce a new AM-dated zip and a fresh archive round.

---

## 11. Status

```
Phase AM1 — STALE DIST/RELEASE/ ARTIFACT CLEANUP WORKFLOW AND ARCHIVE-DEMOTION SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream tasks to be created: 6
  - AM2 (t_...): UX/copy spec — stale-artifact cleanup workflow and archive-demotion  → sna-ui-designer
  - AM3 (t_...): Implementation — cleanup workflow IPC and UI wiring                 → sna-frontend-workbench
  - AM4 (t_...): QA acceptance + Alan manual checklist                                → sna-qa-acceptance
  - AM5 (t_...): Privacy/security audit                                              → sna-privacy-security
  - AM6 (t_...): Windows local package refresh                                       → sna-windows-runtime
  - AM7 (t_...): Final local readiness gate                                          → codex-gpt55-control

Gaps identified:
  - Cleanup script (cleanup-stale-artifacts.sh) patterns are stale — still targets ab/ad/ae
  - Cleanup preview copies to clipboard only — no IPC-backed execution
  - No archive-demotion path (the AG1 approach used deletion)
  - Canonical v0.1.0-rc.1.zip counted as stale by hygiene scan logic
  - 21 stale files, ~340 MB accumulating in dist/release/

Current AL package pointer:
  \\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\
    servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-al-20260607-local.zip

Note: Older AK/AJ/AI/AH/AG/AF phase aliases will be moved to dist/.release-archive/.
The AM6 refresh will produce a fresh AM-dated package.

Red-zone items excluded: 12
Non-goals: 14
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
