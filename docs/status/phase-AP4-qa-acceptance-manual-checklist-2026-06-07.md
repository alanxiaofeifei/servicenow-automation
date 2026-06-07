# Phase AP4 — QA Acceptance and Alan Manual Checklist

**Date:** 2026-06-07
**Status:** ALL GATES PASS — READY-FOR-MANUAL-VALIDATION-ONLY
**Scope:** Repo-hygiene three-column action-rail polish
**Tester:** `sna-qa-acceptance`
**Task:** `t_728adb98`

## Summary

QA acceptance run on commit `019c502` (branch `next/post-release-operator-cockpit-ab-20260606`). The repo-hygiene card has been restructured from a single vertical column to an internal three-column sub-layout (queue | evidence | actions). All automated gates pass. One minor note: the action-button disabled logic from AL3 was preserved as-is (no new item-specific disabled reasons added in this phase), which is correct per the non-goals.

## Automated Gates

### 1. pnpm build — PASS ✓

```
apps/desktop build: ✓ built in 985ms
apps/cli build: Done
apps/desktop build: Done
```

### 2. pnpm typecheck — PASS ✓

```
packages/core typecheck: Done
packages/profiles typecheck: Done
packages/kb typecheck: Done
packages/ai typecheck: Done
packages/adapters typecheck: Done
apps/cli typecheck: Done
apps/desktop typecheck: Done
```

### 3. pnpm test — PASS ✓ (440 tests)

| Package | Tests Passed |
|---------|-------------|
| packages/core | 83 |
| packages/kb | 6 |
| packages/profiles | 17 |
| packages/ai | 34 |
| packages/adapters | 95 |
| apps/cli | 55 |
| apps/desktop | 150 |
| **Total** | **440** |

No test failures, no flaky test observations.

### 4. pnpm privacy:scan — PASS ✓

```
TRACKED_PRIVACY_SCAN_PASS files=288
```

### 5. sha256sum -c — PASS ✓

Both packages in `dist/release/` verify:

```
AO6: servicenow-automation-windows-v0.1.0-rc.1-ao6-20260607-local.zip — OK
AP6: servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip — OK
```

### 6. Archive integrity — PASS ✓

- Main executable present: `ServiceNow Automation.exe`
- App bundle present: `resources/app.asar`
- No forbidden markers (credentials, tokens, .env, .gitignore)
- AO6: 91 archive entries; AP6: similar structure

### 7. Hygiene scan (post-cleanup state) — PASS ✓

- `dist/release/` contains only latest AO6 + AP6 packages
- Stale phase archives properly moved to `dist/.release-archive/` (af, ag, ah, ai6, aj, aj7, ak, al, am, an6, unknown)
- `.gitignore` remediation confirmed: `.codegraph/` and `.worktrees/` entries added
- No stale `dist/release-issue98-main-20260528/` artifacts in current build path

## Code Review

### Files Changed (AP3 scope)

| File | Change | Lines |
|------|--------|-------|
| `apps/desktop/src/App.tsx` | Restructured repo-hygiene card JSX from single vertical to 3-column grid | ~50 lines |
| `apps/desktop/src/styles.css` | Updated grid column ratios per AP2 spec | 1 line |

### Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Three-column sub-layout renders (queue \| evidence \| actions) | ✓ | `App.tsx` lines 4146-4226: `repo-hygiene-columns` grid container with 3 child `<div>` elements |
| 2 | Column hairline dividers present | ✓ | `styles.css` line 7177: `.repo-hygiene-columns > div + div { border-left: 1px solid var(--warm-hairline); }` |
| 3 | Responsive fallback below 900px | ✓ | `styles.css` line 7191: `@media (max-width: 900px)` stacks to 1fr, removes borders |
| 4 | All 3 hygiene items with correct state chips | ✓ | `.gitignore` (Verified/Pending), `Stale dist/release/` (Pending/Verified), `.local/video-analysis/` (Closed as N/A/Pending) |
| 5 | All 5 action buttons in right column | ✓ | Refresh local scan, Open workspace root, Export status markdown, Copy selected summary, Cleanup preview |
| 6 | Cleanup preview in right column when toggled | ✓ | `cleanupPreviewOpen` state conditionally renders `.cleanup-preview-card` inside right col div |
| 7 | Boundary copy preserved | ✓ | Footer: "Local only", "No upload / PR / merge / tag / release", "This surface only reports local repository state" |
| 8 | Dynamic scan data via `initialHygieneScanResult` prop | ✓ | `hygieneScanResult` prop populates gitignore state, stale counts, video status |
| 9 | All 4 gates pass | ✓ | build ✓ typecheck ✓ test ✓ privacy:scan ✓ |

### Safety / Privacy

- No raw ServiceNow URLs, sys_ids, credentials, or session data in the repo-hygiene card code
- No new IPC handlers or Electron API usage
- No behavioral changes — only CSS/JSX layout restructure
- Footer boundary copy explicitly states local-only scope
- "No upload / PR / merge / tag / release" remains visible

### Minimality Check

- Only `App.tsx` (~50 lines restructured) and `styles.css` (1 line grid ratio update) were touched for the card layout
- No new components, no new state, no new IPC handlers
- All existing handlers, onClick, state variables preserved exactly
- No drive-by refactors or unrelated file changes

## Alan Manual Validation Checklist

For Alan to verify the three-column action-rail polish on Windows:

### Windows Launch

- [ ] Double-click `dist/release/servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` → extract → run `ServiceNow Automation.exe`
- [ ] App window opens without crash or error dialog
- [ ] `Local Repo Hygiene + Archive Demotion` card is visible in the center workbench area

### Three-Column Layout (Visual)

- [ ] The repo-hygiene card shows **three internal columns**: left (queue), center (evidence/detail), right (actions)
- [ ] **Left column** contains 3 hygiene items:
  - `.gitignore verification` — state chip shows "Verified" (or "Pending" before first scan)
  - `Stale dist/release/ artifacts` — state chip shows "Pending" (or count)
  - `.local/video-analysis/` — state chip shows "Closed as N/A"
- [ ] Selected item is highlighted with a calm selection outline
- [ ] **Center column** shows selected item detail + evidence block (summary, collapsible "Evidence detail", archive details)
- [ ] **Right column** shows all 5 action buttons stacked vertically:
  1. Refresh local scan
  2. Open workspace root
  3. Export status markdown
  4. Copy selected summary
  5. Cleanup preview
- [ ] Hairline dividers separate the three columns
- [ ] **Footer spans all three columns**: "Local only · No upload / PR / merge / tag / release · This surface only reports local repository state."
- [ ] **Header spans all three columns**: "Local Repo Hygiene + Archive Demotion" + "Local only · No ServiceNow actions" eyebrow

### Action Buttons (Disabled State)

- [ ] **Export status markdown** is disabled (greyed out) before first scan, enabled after
- [ ] **Copy selected summary** is disabled before first scan, enabled after
- [ ] **Cleanup preview** is disabled before first scan, enabled after (shows "Hide preview" when open)
- [ ] Disabled buttons show inline reason text: "Disabled: no scan data yet."
- [ ] **Refresh local scan** and **Open workspace root** are always enabled

### Cleanup Preview

- [ ] Click **Cleanup preview** → a preview card appears below the buttons in the right column
- [ ] Preview card shows copy: "Preview the local cleanup before applying it."
- [ ] Click again → hides the preview

### Boundary / Safety

- [ ] No "Save", "Submit", "Update", "Resolve", "Close", "Upload", "PR", "Merge", "Tag", "Release" buttons exist inside the repo-hygiene card
- [ ] "Local only" badge visible in both right column and footer
- [ ] Footer copy visible without scrolling

### Regression Check

- [ ] Other cards (Release Readiness Handoff, Worktree Acceptance Checkpoint, Selected Source, Runtime Actions) are unaffected
- [ ] The outer workbench three-column layout (left sidebar / center / right runtime rail) is unchanged
- [ ] Resize to narrow (< 900px) → columns stack vertically with horizontal hairline dividers

### Performance

- [ ] No visible layout shift or CLS (Cumulative Layout Shift) on page load
- [ ] Action buttons respond immediately on click

## Verdict

### PASS — READY-FOR-MANUAL-VALIDATION-ONLY

| Gate | Result |
|------|--------|
| pnpm build | PASS ✓ |
| pnpm typecheck | PASS ✓ |
| pnpm test (440 tests) | PASS ✓ |
| pnpm privacy:scan (288 files) | PASS ✓ |
| sha256sum -c | PASS ✓ |
| Archive integrity | PASS ✓ |
| Hygiene scan (post-cleanup) | PASS ✓ |
| Three-column card layout (code review) | PASS ✓ |
| Boundary copy verification | PASS ✓ |

**Evidence:** All automated gates pass. Code review confirms the repo-hygiene card is restructured to three-column sub-layout per AP2 spec. No behavioral changes, no new IPC, no privacy violations.

**Note to Alan:** The action-button disabled logic was preserved from AL3 (no item-specific disabled reasons like "Selected item is already verified" for Cleanup preview). That level of polish is a separate enhancement, not part of this layout-only phase.

**Depends on:** AP5 (privacy/safety review) and AP6 (package refresh) for full phase completion.

## Remaining Risks

- None specific to the three-column layout change. The change is purely CSS/JSX restructuring with no behavioral impact.
- The disabled reasons on action buttons are basic (`!hygieneScanResult`). Item-specific disabled reasons (e.g., "Cleanup preview disabled: item is already verified") could be added in a future phase.
