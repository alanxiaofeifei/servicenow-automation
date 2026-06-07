# Phase AP1 — Repo-Hygiene Three-Column Sub-Layout and Action-Rail Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AO7 base:** AO1–AO7 changes present (stale archive entries removed from release-readiness-handoff card)
**Profile:** `sna-orchestrator`
**Task:** `t_c1967eeb`

---

## 1. Why this phase

### AO7 outcome

AO7 (final local readiness gate for stale-archive-removal) returned **READY-FOR-MANUAL-VALIDATION-ONLY**. The AO6 local Windows package (`servicenow-automation-windows-v0.1.0-rc.1-ao6-20260607-local.zip`) is checksum-verified, all 4 gates pass, and the stale archive entries in the release-readiness-handoff card were cleanly removed.

### Remaining gap: repo-hygiene card is still a single vertical column

The repo-hygiene card was implemented in two phases:
- **AG3** (original hardcoded implementation): single-vertical-card layout with three items in a queue, evidence block, and action bar — all in one column.
- **AL3** (dynamic live-scan replacement): replaced hardcoded strings with live IPC-backed scan, added all 5 action buttons (Refresh, Open, Export, Copy, Cleanup preview/archive). But the **layout stayed single-vertical-column**.

Both AG2 (original UX spec) and AL2 (dynamic UX spec) define a **three-column sub-layout within the repo-hygiene card**:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Local Repo Hygiene + Artifact Boundary                                               │
│ Local only · No ServiceNow actions · No upload / PR / merge / tag / release          │
├────────────────────┬──────────────────────────────────────┬───────────────────────────┤
│ Left: queue/feed   │ Center: selected hygiene detail      │ Right: local actions      │
│ [Verified] .gitig  │ Selected: Stale dist/release/        │ + safety boundary         │
│ [Pending]  dist/   │ - current state + evidence           │ Refresh local scan        │
│ [Closed]   .local/ │ - why it is pending                  │ Open workspace root       │
│                    │ - cleanup preview                     │ Export status markdown    │
│                    │ - boundary note                       │ Copy selected summary     │
│                    │                                       │ Cleanup preview           │
├────────────────────┴──────────────────────────────────────┴───────────────────────────┤
│ Footer: Local only · disabled actions explain why they are unavailable                │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Current implementation** (App.tsx lines 4259–4550+ , styles.css lines 6852–7045) uses a single vertical flow:

```
Header
  └─ Scan status / error
  └─ Queue (3 items stacked vertically)
  └─ Evidence block (summary + collapsible detail)
  └─ Actions row (5 buttons in flex-wrap row)
  └─ Cleanup preview / confirm overlay
  └─ Footer / boundary chip
```

The three functional sections (queue, evidence, actions) are stacked vertically inside the card. The spec calls for them to be side-by-side in three columns.

### What AP1 enables

1. **Restructure the repo-hygiene card from single-vertical to three-column sub-layout**: left = queue/list, center = selected detail + evidence, right = local actions + safety boundary.
2. **Preserve all existing behavior**: live scan, item selection, evidence show/hide, all 5 action buttons, cleanup preview, archive confirm, boundary copy.
3. **Keep the card the same size in the outer three-column workbench** — this is an internal restructuring, not an outer layout change.
4. **All red-zone prohibitions remain**: no live ServiceNow, no upload, no PR/merge/tag/release, no cron changes.

---

## 2. Current state vs. target

| Area | Current state (single vertical) | Target state (three-column sub-layout) |
|------|-------------------------------|--------------------------------------|
| **Left section** | Queue items are stacked vertically at the top of the card with `.repo-hygiene-queue` (CSS grid, 1 column) | Left column: queue/list of hygiene items — same items, same selection behavior, same state chips. Compact, scrollable if needed. |
| **Center section** | Evidence block (`repo-hygiene-evidence`) sits below the queue, inside the same vertical flow | Center column: selected item detail, summary, collapsible evidence, reason text. Separated from queue by a visual divider. |
| **Right section** | Action row (`repo-hygiene-actions-row`) sits below the evidence block, inside the same vertical flow | Right column: all 5 action buttons stacked vertically (or compact grid), safety boundary chip, disabled-state explanations. Separated from center by a visual divider. |
| **Cleanup preview** | `.cleanup-preview-card` appears inline below actions row | Cleanup preview expands inline within the right column (or overlays the right column). Same behavior, new position. |
| **Footer** | `.repo-hygiene-footer` at the bottom of the card, below all sections | Footer spans all three columns at the bottom of the card. Same boundary chip + safety copy. |
| **Header** | `.repo-hygiene-header` at the top of the card | Header unchanged — same title, eyebrow, boundary copy. |
| **Scan status/error** | `.repo-hygiene-scan-status` appears between header and queue | Scan status could span the top of the column area or sit in the center column. No functional change. |
| **Item selection** | `.repo-hygiene-item-selected` outline + background highlight | Same selection visual. Queue items remain selectable. |
| **All actions** | Already implemented (Refresh, Open, Export, Copy, Cleanup preview, Archive confirm) | Preserved. Actions relocate from below-evidence to right column. |
| **All IPC / behavior** | Already implemented (hygieneScan, openWorkspaceRoot, cleanupPreview, cleanupExecute) | Preserved. No IPC changes, no new Electron APIs. |

---

## 3. Scope — what this phase includes

### 3.1 Restructure repo-hygiene card into three-column sub-layout

Convert the current single-vertical `.repo-hygiene-card` into a CSS grid (or flexbox) with three internal columns:

**Left column** (`~25-30%` width):
- Existing `.repo-hygiene-queue` (3 items: `.gitignore`, stale dist/release, video-analysis)
- Same selection behavior (`onClick`, `onKeyDown`, `aria-current`)
- Same state chips (`Verified`, `Pending`, `Closed as N/A`)
- Optional: last-scan history line at the bottom

**Center column** (`~40-50%` width):
- Existing `.repo-hygiene-evidence` block
- Selected item summary + collapsible detail
- Same structure: `.repo-hygiene-evidence-summary` + `details.repo-hygiene-evidence-detail`
- The `.repo-hygiene-scan-status` (loading/error) could also appear here

**Right column** (`~25-30%` width):
- Existing `.repo-hygiene-actions-row` (all 5 buttons)
- `.cleanup-preview-card` (appears inline when cleanup preview is open)
- `.cleanup-confirm-overlay` (if it appears, can overlay the right column or the whole card)
- Safety boundary chip / footer content that relates to actions
- Disabled-state explanations

**Footer** (spans all three columns):
- Existing `.repo-hygiene-footer` with boundary chip + safety copy
- Unchanged from current implementation

**Header** (spans all three columns):
- Existing `.repo-hygiene-header`
- Unchanged from current implementation

### 3.2 Preserve all existing behavior and state

- `hygieneScanResult`, `selectedHygieneItem`, `cleanupPreviewResult`, etc. — unchanged
- `hygieneScanLoading`, `hygieneScanError`, `cleanupLoading`, `cleanupError` — unchanged
- `showCleanupConfirm`, `cleanupSuccess`, `cleanupResult` — unchanged
- All IPC handlers (`hygieneScan`, `openWorkspaceRoot`, `cleanupPreview`, `cleanupExecute`) — unchanged
- All action button onClick handlers — unchanged
- `navigator.clipboard.writeText()` calls — unchanged

### 3.3 Minimal CSS changes

- Add new CSS for the three-column grid within `.repo-hygiene-card`
- Add column divider styling (hairline borders)
- Add responsive handling for narrow cards (fallback to vertical stacking below a width threshold)
- Remove or adapt existing vertical-margin rules that assumed single-column layout
- Preserve all existing `.repo-hygiene-*` class names where possible to minimize test impact

### 3.4 Test updates

- Update existing test(s) that assert on DOM ordering of queue → evidence → actions (since the DOM tree changes from vertical to grid)
- Verify that all 3 columns render and contain the expected content
- Verify that action button enable/disable logic still works after the move
- Verify that item selection still works after the grid restructure

---

## 4. Non-goals

| Item | Reason |
|------|--------|
| New IPC channels, main-process changes, or Electron APIs | No behavioral change beyond layout — all IPC is already implemented |
| New action buttons | All 5 actions already exist. No new buttons in this phase |
| New hygiene items | The 3 existing items (gitignore, stale artifacts, video-analysis) stay. No new items |
| Center column content rework (release readiness, worktree acceptance) | Out of scope — only the repo-hygiene card is restructured |
| Outer three-column workbench layout changes | The existing `.workbench-sidebar / .workbench-center / .workbench-runtime-rail` grid is untouched |
| Right-rail collapse behavior changes | The existing `initialRuntimeRailExpanded` is unchanged |
| Cleanup script changes | `cleanup-stale-artifacts.sh` is untouched |
| Real ServiceNow login/browsing/API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Attachment upload | Red-zone — out of scope for v0.x |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams/Outlook/phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, cookies, storage-state, secrets | Red-zone — never captured |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Modifying historical AG/AH/AI/AJ/AK/AL/AM/AN/AO status docs | They are archival records — do not alter |
| Cron job creation or modification | Red-zone — not in local-only scope |

---

## 5. Safety boundaries

- No real ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified — only new AP-phase docs and the repo-hygiene card layout are in scope
- AP3 implementation is CSS/JSX layout restructuring only — no IPC changes, no new Electron APIs, no behavioral changes
- The `.local/video-analysis/` item must remain explicitly closed as N/A

---

## 6. Gate policy

| Gate | Required? | Rationale |
|------|-----------|-----------|
| `pnpm build` | YES (for AP3, AP6) | Must confirm layout changes compile |
| `pnpm typecheck` | YES (for AP3) | Must confirm TypeScript type safety after JSX restructure |
| `pnpm test` | YES (for AP3, AP4) | Tests must verify grid renders correctly and all behavior is preserved |
| `pnpm privacy:scan` | YES (for AP5) | Docs and copy must not leak stale phase identifiers or real data |

AP1 (this doc) and AP2 (UX spec) are document-only — no code gates required.

---

## 7. Change budget

| File | Expected change | Budget |
|------|----------------|--------|
| `apps/desktop/src/App.tsx` | Restructure repo-hygiene card JSX from vertical to 3-column grid. Preserve all existing handlers and state references. | ~20–40 lines changed (primarily wrapper `<div>` changes) |
| `apps/desktop/src/styles.css` | Add `.repo-hygiene-card-grid`, column divider, responsive fallback. Remove/update vertical-margin rules. | ~50–80 lines added, ~10 lines removed |
| `apps/desktop/src/App.test.ts` | Update DOM-order assertions for grid layout. No new behavioral tests needed (behavior is unchanged). | ~10–20 lines changed |
| `docs/status/phase-AP2-*-ux-spec-*.md` | UX/copy spec (new) | < 50 lines |
| `docs/status/phase-AP3-*-implementation-*.md` | Implementation evidence (new) | < 30 lines |

**Total estimated change budget:** < 150 lines of source changes, no IPC, no behavioral change.

---

## 8. Task decomposition

### AP2 — Repo-hygiene three-column sub-layout UX/copy spec

**Goal:** Write the precise UX/copy spec for the three-column sub-layout. Define:
- Column widths, dividers, padding
- Exact action positions in the right column
- Empty/loading/error state placement across three columns
- Responsive behavior for narrow cards
- Accessibility requirements for the grid layout

**Assignee:** `sna-ui-designer`
**Deliverable:** `docs/status/phase-AP2-repo-hygiene-three-column-ux-spec-2026-06-07.md`
**Depends on:** AP1 (this document)

### AP3 — Implement repo-hygiene three-column sub-layout

**Goal:** Restructure the repo-hygiene card from single vertical column to three-column sub-layout.

**Implementation scope:**
1. Wrap queue, evidence, and action sections in a CSS grid container
2. Add column divider styling
3. Ensure responsive fallback for narrow cards
4. Keep all existing behavior and state management exactly as-is
5. Move cleanup preview and confirm overlay to the right column
6. Update tests for DOM order changes

**Non-goals:**
- No IPC changes
- No new actions or components
- No external layout changes
- No behavioral changes

**Assignee:** `sna-frontend-workbench`
**Files changed:** `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, `apps/desktop/src/App.test.ts`
**Verification:** `pnpm build` PASS, `pnpm typecheck` PASS, `pnpm test` PASS, `pnpm privacy:scan` PASS
**Depends on:** AP2 (UX/copy spec complete)

### AP4 — QA acceptance

**Goal:** Run full build/typecheck/test/privacy:scan gates. Verify:
- Three-column sub-layout renders correctly
- All 3 functional areas (queue, evidence, actions) are visually separated
- All existing behavior works: scan, selection, actions, cleanup preview
- No regression in existing 440+ tests
- No privacy violations

**Assignee:** `sna-qa-acceptance`
**Deliverable:** QA evidence (test output, manual acceptance notes)
**Depends on:** AP3 (implementation complete)

### AP5 — Privacy/safety review

**Goal:** Review the layout change for privacy and safety. Since the change is purely CSS/JSX restructuring:
- Verify no new data surfaces
- Verify no real ServiceNow data leakage
- Verify no Save/Submit/Update/Resolve/Close automation introduced
- Verify `pnpm privacy:scan` passes

**Assignee:** `sna-privacy-security`
**Deliverable:** Privacy/safety sign-off
**Depends on:** AP3 (implementation complete)

### AP6 — Package refresh

**Goal:** Rebuild the packaged Windows artifact after AP3 changes.

**Assignee:** `sna-windows-runtime`
**Deliverable:** Rebuilt `dist/release/` artifact
**Depends on:** AP3 (implementation merged)

### AP7 — Final gate

**Goal:** Final acceptance and phase closure. Verify:
- All 4 gates: `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm privacy:scan`
- All AP4 QA findings resolved
- AP5 privacy/safety sign-off obtained
- AP6 package refresh completed
- Phase status documented

**Assignee:** `sna-release-docs`
**Deliverable:** Phase completion record + release summary
**Depends on:** AP4, AP5, AP6 (all must complete first)

---

## 9. Dependency graph

```
AP1 ──(this document)──► AP2 ──► AP3 ◄──► AP4
                                        │
                                        ├──► AP5 ──► AP7 (final gate)
                                        │
                                        └──► AP6 ──► (rebuild artifact)
```

Key:
- AP1: Scope definition (this document) — state: COMPLETE (once this document is written)
- AP2: UX/copy spec by `sna-ui-designer` — state: TODO
- AP3: Implementation by `sna-frontend-workbench` — state: TODO
- AP4: QA acceptance by `sna-qa-acceptance` — state: TODO
- AP5: Privacy/safety review by `sna-privacy-security` — state: TODO
- AP6: Package refresh by `sna-windows-runtime` — state: TODO
- AP7: Final gate by `sna-release-docs` — state: TODO

Annotations:
- AP4 and AP5 run in parallel after AP3 — QA and privacy review are independent
- AP6 runs after AP3 so the package includes the layout changes
- AP7 gates on all of AP4, AP5, AP6

---

## 10. Red-zone prohibitions (unchanged from AO phase rules)

- 不做真实 ServiceNow 登录/浏览器操作/API 写入。
- 不做 Save / Submit / Update / Resolve / Close。
- 不上传附件。
- 不写 Microsoft Graph / Excel Web。
- 不做真实 Teams/Outlook/phone ingestion。
- 不读取/打印/提交 secrets、cookie、storage state、HAR、trace、截图、真实 URL、ticket ID、sys_id、requester、assignment group、真实字段值。
- 不 push、PR、merge、tag、GitHub Release；Alan 睡觉期间只允许 local-only 工作。
- 不递归创建/修改 cron jobs。

---

## 11. Verification plan

### AP2 (UX/copy spec)
- Spec reviewed and approved by Alan before AP3 begins

### AP3 (Implementation)
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — all existing tests pass
- `pnpm privacy:scan` — PASS
- Visual: three-column sub-layout renders with queue / evidence / actions in separate columns
- Visual: all existing styling preserved (state chips, selection outline, boundary chip)
- Visual: all 5 action buttons present and functional in the right column
- Visual: cleanup preview appears in the right column
- Behavior: scan, selection, evidence, actions, archive confirm all work as before

### AP4 (QA acceptance)
- All 4 gates pass
- Three-column sub-layout verified
- No regression in existing behavior
- All actions and interactions verified

### AP5 (Privacy/safety)
- No new privacy violations
- Safety boundary copy verified (unchanged)
- No real data exposure

### AP6 (Package refresh)
- Fresh artifact produced
- Artifact includes AP3 changes

### AP7 (Final gate)
- All upstream gates complete
- Phase status recorded
- Release summary written

---

## 12. Status

```
Phase AP1 — REPO-HYGIENE THREE-COLUMN SUB-LAYOUT AND ACTION-RAIL SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Gap identified:
  - Repo-hygiene card is still a single vertical column (AG3 layout)
  - AG2/AL2 UX spec calls for three-column sub-layout:
    left=queue, center=detail+evidence, right=actions+boundary

Downstream tasks to create: 6
  - AP2: UX/copy spec for three-column sub-layout        → sna-ui-designer      [first]
  - AP3: Implement three-column sub-layout                → sna-frontend-workbench [after AP2]
  - AP4: QA acceptance                                    → sna-qa-acceptance    [after AP3]
  - AP5: Privacy/safety review                            → sna-privacy-security [after AP3]
  - AP6: Package refresh                                  → sna-windows-runtime  [after AP3]
  - AP7: Final gate                                       → sna-release-docs     [after AP4, AP5, AP6]

Red-zone items excluded: 12
Non-goals: 13

Change budget: < 150 lines of source changes, no IPC, no behavioral change
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
