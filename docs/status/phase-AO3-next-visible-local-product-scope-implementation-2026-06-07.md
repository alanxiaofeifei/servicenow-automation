# Phase AO3 — Next Visible Local Product Scope: Implementation

Date: 2026-06-07
Status: implementation complete — all gates pass
Privacy level: sanitized. No real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, credentials, or customer data.

## Goal

Implement the AO2-approved local-only UX/workbench changes for the Release Readiness Handoff card.

## Changes made (surgical — only 3 files)

### 1. `apps/desktop/src/App.tsx`

Three targeted edits:

a) **Replaced stale phase-letter warning** (line 4203)
   - Before: `Older AF/AG/AH packages are archival only. If a package is not marked Latest, do not treat it as the current test target.`
   - After: `Older local builds are archival only. The current test target is the Latest local package shown above.`
   - Rationale: generic archival-only note, no phase-letter-specific copy, shorter and clearer.

b) **Removed Package archive panel** (block starting at line 4205)
   - Removed the entire `handoff-panel` containing `h3>Package archive</h3>` and 4 hardcoded archive entries (`rc.1-ae-20260607`, `rc.1-ad-20260607`, `rc.1-ab-20260607`, `rc.1`).
   - The stale hardcoded entries are gone. No archival list is presented.
   - The other two panels in the grid (`Why retest matters`, `Human-only boundaries`) remain.

c) **Updated Why retest matters bullets** (lines 4209-4212)
   - Before: referenced stale-archive list and visual boundaries
   - After: references dynamic metadata block as single source of truth, runtime readiness, archival treatment, and AE metadata match.

### 2. `apps/desktop/src/styles.css`

- Changed `handoff-grid-row` from `grid-template-columns: repeat(3, 1fr)` to `repeat(2, 1fr)`, since there are now 2 panels (Why retest + Human-only boundaries) instead of 3.

### 3. `apps/desktop/src/App.test.ts`

- Removed `expect(output).toContain("handoff-archive-list")` assertion (the CSS class no longer exists).
- Updated comment from "Stale-archive and runtime readiness sections" to "Archival-only note and runtime readiness sections".

## What did NOT change

- Quickstart checklist — unchanged, still visible.
- Human-only boundaries panel — unchanged, still visible.
- Current package metadata block — unchanged, still the single source of truth.
- Local copy actions (Copy path / SHA256 / summary) — unchanged placement and behavior.
- Runtime readiness section — unchanged.
- Worktree Acceptance card — not touched (out of scope per AO2 3.2).
- Repo Hygiene card — not touched.
- No new runtime actions introduced.
- No ServiceNow behavior changes.

## Verification

| Gate | Result |
|------|--------|
| `pnpm build` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test` | Passed — 150/150 desktop, 55/55 CLI |
| `pnpm privacy:scan` | Passed — 288 files clean |

## Acceptance checklist

- [x] The stale `Package archive` panel with hardcoded entries is removed.
- [x] The warning text is generic archival-only: "Older local builds are archival only."
- [x] The dynamic metadata block remains the single current-package source of truth.
- [x] No demo clutter or mode-tab noise introduced.
- [x] Local copy actions still work.
- [x] No live ServiceNow actions added.
- [x] No raw sensitive data appears in the UI.
- [x] Warm/light visual language preserved.
- [x] Accessibility: grid layout respects 2-column structure; all existing interactive elements, focus rings, and hit targets unchanged.

## Remaining risks

None specific to this scope. The Release Readiness Handoff card now matches the AO2 spec exactly. The worktree acceptance checklist at `worktree-accept-checklist` still references `AF/AG/AH` in its copy — that was explicitly kept unchanged per AO2 3.2 and will be addressed in a separate phase if needed.

## Suggested next task

Phase AO4: refresh the worktree-acceptance-checklist copy to remove `AF/AG/AH` phase-letter references from its manual validation checklist items, making them generic like the Release Readiness card now is.
