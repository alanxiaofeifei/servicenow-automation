# Phase AL1 — Dynamic Repo Hygiene Scan and Artifact-Boundary Follow-Up Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AK7 base:** AK7 final gate (`t_c0ad55a7`) — READY-FOR-MANUAL-VALIDATION-ONLY
**Profile:** `sna-orchestrator`
**Task:** `t_87683170`

---

## 1. Why this phase — the remaining gaps after AK7

### AK7 outcome

AK7 (final local readiness gate for validation-history polish) returned **READY-FOR-MANUAL-VALIDATION-ONLY**. The AK local Windows package is the newest dated local zip, checksum-verified, and the validation-history / package-path copy is clear.

**However, PR #97 manual acceptance subsequently failed**, which resets the manual-validation chain. The next phase is P0 recovery, not feature expansion. AL1 defines the next safe local-only scope: making the repo hygiene / artifact-boundary surface read live local state instead of hardcoded strings.

### The three AG3/AG4 follow-up risks

The repo-hygiene card at `apps/desktop/src/App.tsx:4210-4256` was implemented and QA-accepted in the AG phase, but AG3 and AG4 explicitly documented three known gaps:

| # | Gap | Source | Details |
|---|-----|--------|---------|
| 1 | **Hardcoded hygiene state** | AG3 impl §Remaining Risks, AG4 QA §Remaining Risks | The card embeds literal strings for `.gitignore verification` (Verified), `Stale dist/release/ artifacts` (Pending), `.local/video-analysis/` (Closed as N/A). If repo state changes, strings must be manually updated. |
| 2 | **No refresh-local-scan action** | AG3 impl §Known UI Limitations | "No refresh-local-scan button is present (the right rail could host this in a future phase)." |
| 3 | **No export-to-markdown action** | AG3 impl §Known UI Limitations | "No export-to-markdown action is present." |

### Current code — the hardcoded block (App.tsx:4210-4256)

The three items are rendered as static JSX:

```
<Verified>  .gitignore verification           — "codegraph/ and worktrees/ gitignore coverage confirmed"
<Pending>   Stale dist/release/ artifacts     — "9 files, 340 MB — cleanup preview available"
<Closed>    .local/video-analysis/            — "Directory does not exist; the backlog item is closed as N/A"
```

There are:
- No IPC handlers for live repo inspection (git status, file existence checks, dist/release/ listing)
- No `Refresh local scan` action on the right rail
- No `Export status markdown` action
- No `Open workspace root` action
- No `Copy selected summary` action
- The `cleanup-stale-artifacts.sh` script exists (94 lines, dry-run safe) but is not wired into the UI

### What AL1 should enable

1. **Replace hardcoded state with live local inspection** — the card should read `.gitignore` coverage, `dist/release/` stale file count, and `.local/video-analysis/` directory status at runtime, not from hardcoded strings.
2. **Add safe local actions** — `Refresh local scan`, `Open workspace root`, `Export status markdown`, `Copy selected summary`, `Cleanup preview`.
3. **Keep the existing layout and boundary copy** — the card stays a center-workspace card with a left queue, center detail, right actions pattern. The `Local only` boundary chip and safety footer stay unchanged.
4. **Keep the existing worktree-acceptance card, handoff card, and selected-source card** in the correct DOM order.

---

## 2. Exact current AK7 Windows package path

The current local Windows package Alan should test today (archival after AL6 refresh):

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip
```

| Property | Value |
|---|---|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip` |
| **SHA256** | `3b8b17b2b33bed6b39a8561efa27f56305845880d10a0b236d62d79ac06ca89a` |
| **Size** | ~118,600,899 bytes |
| **Freshness rank** | #1 of 8+ in `dist/release/` (newest dated) |
| **Checksum file** | `servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip.sha256` |
| **Safety copy** | `servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local-START-HERE-WINDOWS.txt` |

### Archival aliases — do not use as current guidance

| Package | Phase | Status |
|---|---|---|
| `...-ak-20260607-local.zip` | **AK** | **CURRENT** (until AL6) |
| `...-aj7-20260607-local.zip` | AJ7 | **Archival** — superseded |
| `...-aj-20260607-local.zip` | AJ | **Archival** — superseded |
| `...-ai6-20260607-local.zip` | AI6 | **Archival** — superseded |
| `...-ah-20260607-local.zip` | AH | **Archival** — superseded |
| `...-ag-20260607-local.zip` | AG | **Archival** — superseded |
| `...-af-20260607-local.zip` | AF | **Archival** — superseded |
| `...-ae-20260607-local.zip` | AE | **Archival** — superseded |
| `...-ad-20260607-local.zip` | AD | **Archival** — superseded |
| `...-ab-20260607-local.zip` | AB | **Archival** — superseded |
| `...-rc.1.zip` | Canonical v0.1.0-rc.1 | **Published** — do not overwrite |

Only the **AK zip** (until AL6) should be referenced as the current local Windows package for manual validation.

---

## 3. Scope — what AL1 defines

### Deliverable A — This scope document

Documents the hardcoded-hygiene-state gap, the AG3/AG4 follow-up risks, the current AK7 package path, archival aliases, and the AL2–AL7 task chain. No implementation is performed in this task.

### Deliverable B — AL2–AL7 task chain (already created by user)

The full AL2–AL7 pipeline is already on the kanban board:

| Task | Title | Assignee | Depends on | Description |
|---|---|---|---|---|
| **AL2** (t_0fcbc5d5) | UX/copy spec — dynamic repo hygiene scan | `sna-ui-designer` | AL1 | Define exact copy, micro-layout, state labels (Verified/Pending/Closed), action labels (Refresh/Open/Export/Copy/Cleanup), and local-only boundary for the dynamic hygiene surface |
| **AL3** (t_916238e0) | Implementation — dynamic repo hygiene scan and actions | `sna-frontend-workbench` | AL2 | Replace hardcoded hygiene state with live local inspection. Wire Refresh, Open, Export, Copy, Cleanup preview actions via IPC. Keep existing card layout and boundary copy. |
| **AL4** (t_89f4422e) | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AL3 | Verify live scan states, local actions, cleanup preview, boundary copy. Provide manual checklist. |
| **AL5** (t_54adafe5) | Privacy/security audit | `sna-privacy-security` | AL3 | Audit scan/export paths for secrets, sensitive metadata, stale labels. Verify local-only boundary remains explicit. |
| **AL6** (t_b2b226da) | Windows local package refresh | `sna-windows-runtime` | AL4 + AL5 | Rebuild fresh AL-dated package after repo-hygiene changes. Verify checksum and freshness. |
| **AL7** (t_91058aed) | Final local readiness gate | `codex-gpt55-control` | AL6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED. |

### Dependencies

```
AL1 ──→ AL2 ──→ AL3 ──→ AL4 ──┐
                         │     ├──→ AL6 ──→ AL7
                         └──→ AL5 ──┘

AL2 (UX spec) must finish before AL3 (implementation).
AL4 (QA) and AL5 (privacy) both depend on AL3 and gate AL6.
AL6 (package refresh) depends on both QA and privacy passing.
AL7 (final gate) depends on AL6.
```

### Delta from AK-series pattern

The AL pipeline follows the same scope → UX spec → implement → QA → privacy → package → final gate structure, with these differences:

- **Live local inspection replaces hardcoded strings.** This is not a copy-only change. It requires IPC handlers to read git state, file existence, and dist/release/ contents at runtime.
- **New local actions added.** The right rail gets 5 action buttons (Refresh local scan, Open workspace root, Export status markdown, Copy selected summary, Cleanup preview). These are local-only and do not touch ServiceNow.
- **The `.local/video-analysis/` item remains hardcoded as N/A.** It refers to a directory that does not exist and is gitignored. Live inspection can verify absence but the label "Closed as N/A" is by design — no action needed.
- **Change budget is larger than AK.** Expected: 5–7 files (App.tsx, styles.css, App.test.ts, main.ts (new IPC handlers), preload.ts (IPC bridge), possibly a small helper script).

---

## 4. Non-goals

| Item | Reason |
|---|---|
| Adding new center-workspace cards | Out of scope — hygiene card already exists; only improving it |
| Live ServiceNow login, browsing, API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Attachment upload | Red-zone — out of scope for v0.x |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams/Outlook/phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, cookies, storage-state, secrets | Red-zone — never captured |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Modifying historical AG/AH/AI/AJ/AK status docs | They are archival records — do not alter |
| Three-column layout redesign | Separate P0 recovery threads (see system prompt) |
| Chromium provisioning, startup diagnostics | Separate P0 recovery threads |
| Windows packaging toolchain changes | Out of scope — package refresh only (AL6) |
| Cron job creation or modification | Red-zone — not in local-only scope |

---

## 5. Safety boundary

- No real ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified — only new AL-phase docs and the updated hygiene card are in scope
- AL3 implementation is local-inspection + local-actions only — no ServiceNow connectivity, no upload, no release actions
- The `.local/video-analysis/` item must remain explicitly closed as N/A and clearly local-only/gitignored
- The `Cleanup preview` action must remain preview-only unless the user explicitly confirms the cleanup script's `--dry-run` mode first

---

## 6. Gate policy

| Gate | Required? | Rationale |
|---|---|---|
| `pnpm build` | YES (for AL3, AL6) | Must confirm changes compile |
| `pnpm typecheck` | YES (for AL3) | Must confirm TypeScript type safety after IPC additions |
| `pnpm test` | YES (for AL3, AL4) | Tests must verify dynamic hygiene state and action behavior |
| `pnpm privacy:scan` | YES (for AL5) | Docs and copy must not leak stale phase identifiers or real data |

AL1 (this doc) and AL2 (UX spec) are document-only — no code gates required.

---

## 7. Implementation guidance for AL3

### What to change

**1. App.tsx — replace hardcoded hygiene state with dynamic rendering**

The repo-hygiene-card section (~47 lines, lines 4210–4256) currently embeds 3 hardcoded items. Replace with a single function or derived state that reads from a `hygieneState` object populated via IPC:

```
interface HygieneItemState {
  label: string;
  status: 'verified' | 'pending' | 'closed';
  detail: string;
  evidence: string[];
  actionAvailable: boolean;
}
```

This state would be populated on mount (and on refresh) via `window.electronAPI.refreshRepositoryHygiene()` or similar IPC call.

**2. main.ts / preload.ts — add IPC handlers for live local inspection**

```
ipcMain.handle('repo:refresh-hygiene', async () => {
  const gitignoreVerified = checkGitignoreCoverage(projectRoot);
  const staleArtifacts = listStaleArtifacts(releaseDir);
  const videoDirExists = fs.existsSync(path.join(projectRoot, '.local', 'video-analysis'));

  return {
    gitignore: { status: gitignoreVerified ? 'verified' : 'pending', ... },
    distRelease: { status: staleArtifacts.length > 0 ? 'pending' : 'verified', ... },
    videoAnalysis: { status: 'closed', ... },
  };
});
```

**3. App.tsx — add action handlers for right-rail buttons**

- `Refresh local scan` → calls `repo:refresh-hygiene` IPC again
- `Open workspace root` → calls `shell.openPath(projectRoot)`
- `Export status markdown` → generates a markdown string and calls IPC to write a temp file + open it
- `Copy selected summary` → `navigator.clipboard.writeText(selectedSummary)`
- `Cleanup preview` → calls `repo:cleanup-preview` IPC that runs `cleanup-stale-artifacts.sh --dry-run`

**4. App.test.ts — update tests**

- Existing test at lines 1645–1672 needs to account for dynamic rendering (may need to mock the IPC call)
- Add test for each action button rendering and disabled state
- Add test for cleanup preview content

**5. styles.css — minimal additions if needed**

The existing `.repo-hygiene-*` classes likely cover the layout. New action button styles may be needed.

### Scope of changes

| File | Expected change | Reason |
|---|---|---|
| `apps/desktop/src/App.tsx` | Replace hardcoded hygiene JSX with dynamic rendering + action buttons + IPC calls | Core of the change |
| `apps/desktop/src/App.test.ts` | Update existing test + add action/test coverage | Must verify dynamic behavior |
| `apps/desktop/src/styles.css` | Minor additions for action buttons if needed | Style new elements |
| `apps/desktop/electron/main.ts` | Add `repo:refresh-hygiene` and `repo:cleanup-preview` IPC handlers | Live inspection requires Node.js |
| `apps/desktop/electron/preload.ts` | Expose new IPC bridge methods | Renderer needs IPC access |

---

## 8. Detailed start/acceptance criteria

### AL1 (this task) completion

- [x] Scope document written: `docs/status/phase-AL1-dynamic-repo-hygiene-scan-and-artifact-boundary-scope-2026-06-07.md`
- [x] Gap identified: hardcoded hygiene state, no refresh/export/cleanup actions
- [x] AL2–AL7 pipeline already created on kanban board by user
- [x] Safety boundaries documented
- [x] No false promise of live ServiceNow or production action in scope
- [x] Implementation guidance scoped for AL3

### AL2 — UX/copy spec acceptance criteria

- [ ] Exact copy for all 3 hygiene items in each state
- [ ] Exact action labels and disabled-reason text for all 5 actions
- [ ] Wireframe or micro-layout for the right-rail action panel
- [ ] State transition diagram: what happens on Refresh, Cleanup preview, Export, etc.
- [ ] Local-only boundary copy verified

### AL3 — Implementation acceptance criteria

- [ ] `.gitignore` verification reads live repo state (not hardcoded)
- [ ] Stale `dist/release/` artifacts read live directory listing
- [ ] `.local/video-analysis/` still shows as Closed as N/A (verified absent)
- [ ] `Refresh local scan` button re-runs inspection
- [ ] `Open workspace root` opens the project directory
- [ ] `Export status markdown` produces a sanitized markdown report
- [ ] `Copy selected summary` copies the selected item's summary text
- [ ] `Cleanup preview` shows the dry-run output of `cleanup-stale-artifacts.sh --dry-run`
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (existing + new tests)
- [ ] `pnpm privacy:scan` passes

### AL4 — QA acceptance criteria

- [ ] All 4 gates pass
- [ ] Dynamic hygiene states match live repo state
- [ ] All 5 actions behave as documented
- [ ] Card ordering preserved (handoff → hygiene → worktree-acceptance → selected source)
- [ ] Boundary copy remains explicit
- [ ] Alan manual checklist provided

### AL5 — Privacy/security audit criteria

- [ ] No sensitive data in IPC handlers or exported markdown
- [ ] No stale phase labels in user-visible copy
- [ ] No ServiceNow identifiers, URLs, ticket IDs, or real field values
- [ ] Approval (APPROVE) or block (BLOCKED) with sanitized evidence

### AL6 — Package refresh criteria

- [ ] Fresh AL-dated zip is newest in `dist/release/`
- [ ] SHA256 checksum verified
- [ ] Archive integrity verified (expected entries present, no forbidden markers)

### AL7 — Final gate criteria

- [ ] Recommendation: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED
- [ ] All 4 gates pass + checksum OK
- [ ] No release/push/merge authorization

---

## 9. Freshness ordering from dist/release (as of AK7)

| mtime | Filename | Status |
|---|---|---|
| Latest | `...-ak-20260607-local.zip` | **CURRENT — AK** |
| ↓ | `...-aj7-20260607-local.zip` | Archival (AJ7) |
| ↓ | `...-aj-20260607-local.zip` | Archival (AJ) |
| ↓ | `...-ai6-20260607-local.zip` | Archival (AI6) |
| ↓ | `...-ah-20260607-local.zip` | Archival (AH) |
| ↓ | `...-ag-20260607-local.zip` | Archival (AG) |
| ↓ | `...-rc.1.zip` | Canonical (published GitHub prerelease) |

The AL6 package refresh will insert a new AL-dated entry at the top of this ordering.

---

## 10. Status

```
Phase AL1 — DYNAMIC REPO HYGIENE SCAN AND ARTIFACT-BOUNDARY FOLLOW-UP SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream tasks already created: 6
  - AL2 (t_0fcbc5d5): UX/copy spec                                     → sna-ui-designer
  - AL3 (t_916238e0): Implementation — dynamic repo hygiene scan        → sna-frontend-workbench
  - AL4 (t_89f4422e): QA acceptance + Alan manual checklist             → sna-qa-acceptance
  - AL5 (t_54adafe5): Privacy/security audit                            → sna-privacy-security
  - AL6 (t_b2b226da): Windows local package refresh                     → sna-windows-runtime
  - AL7 (t_91058aed): Final local readiness gate                        → codex-gpt55-control

Gaps identified:
  - App.tsx:4210-4256 hardcoded hygiene state (3 items)
  - No refresh-local-scan action (AG3 known limitation)
  - No export-to-markdown action (AG3 known limitation)
  - No open-workspace-root action
  - No copy-selected-summary action
  - Cleanup-preview script exists but is not wired to UI

Current AK7 package: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\
  servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip

Note: Older AK/AJ/AI/AH/AG phase aliases are archival only.
The AL6 refresh will produce a fresh AL-dated package.

Red-zone items excluded: 12
Non-goals: 12
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
