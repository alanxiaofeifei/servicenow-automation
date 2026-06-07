# Phase BE3 — Next Visible Local Product Scope — Implementation

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-frontend-workbench`
**Task:** `t_735ae481`
**Parent spec:** `t_4d4fb344` — Phase BE2 UX/Copy Spec
**Privacy level:** sanitized. All examples are local-only and use fake/demo data only. No real ServiceNow URLs, ticket IDs, sys_ids, cookies, sessions, credentials, or browser evidence.

---

## 0. Preflight summary

**Goal:** Implement the BE2-approved P0 Re-Acceptance Checklist as a visible rendered card in the operator workbench center column, using the exact copy and structure defined in the BE2 UX spec and the existing BE2 checklist document (`docs/status/phase-BE2-p0-re-acceptance-checklist-2026-06-07.md`).

**Known facts at start:**
- BE2 UX spec at `docs/status/phase-BE2-next-visible-local-product-scope-ux-spec-2026-06-07.md`
- BE2 checklist doc exists at `docs/status/phase-BE2-p0-re-acceptance-checklist-2026-06-07.md`
- App.tsx = 8635 lines, App.test.ts = 1783 lines, styles.css = 7145 lines
- Three-column workbench shell with pages: inbox, workbench, knowledge, history, search
- Center column already shows Release Readiness Handoff card and Repo Hygiene card
- `pnpm typecheck` and `pnpm test` (165 tests) pass before changes

**Chosen smallest approach:**
1. Add a `workbench-card` section to the center column (between handoff and repo-hygiene cards)
2. Render: checklist title, safety label, target package, safety rules, 8-row P0 criteria table, runbook diff (collapsible), BC7 closure (collapsible), reminders
3. Copy from BE2 spec verbatim
4. Add CSS (~100 lines) for checklist-specific styling
5. Add 4 tests for the checklist card rendering
6. Run gates (typecheck, test, build, privacy:scan)
7. Write this BE3 status doc

**Files changed:**
- `apps/desktop/src/App.tsx` — added P0 checklist card JSX (~140 lines)
- `apps/desktop/src/styles.css` — added P0 checklist CSS (~100 lines)
- `apps/desktop/src/App.test.ts` — added 4 checklist tests
- `docs/status/phase-BE3-next-visible-local-product-scope-implementation-2026-06-07.md` — this file

---

## 1. Implementation

### 1.1 P0 Re-Acceptance Checklist card

The checklist renders as a `workbench-card` section (`p0-checklist-card`) in the workbench center column, immediately below the Release Readiness Handoff card and above the Repo Hygiene card. This placement is intentional — the checklist is for re-validating the cumulative BE6 package after the handoff provides the package details.

**Sections rendered:**

| Section | Content |
|---------|---------|
| Header | "P0 Re-Acceptance Checklist" eyebrow + "Use this checklist to re-validate all 8 P0 criteria from PR #97." title |
| Safety label | "Local-only: Verify only. No live ServiceNow writes." (accent-colored banner) |
| Target package | "BE6 cumulative package (AE through BD)" |
| Safety rules | 4-item list: No live ServiceNow, No fill fields, No Save/Submit/Update/Resolve/Close, Use Verify only |
| P0 criteria table | 7-column table with 8 P0 criteria rows: #, Criterion, Expected behavior, Implemented in, Verification step, Pass condition, Pass/Fail |
| Runbook refresh diff | Collapsible `<details>` with aspect comparison table (AE-era vs BD6/BE6) |
| BC7 closure | Collapsible `<details>` with BC7 blocking statement and resolution |
| Reminders | 4-item list with cross/check mark icons |
| Footer note | "Record only pass/fail per criterion and sanitized blockers." |

**Copy sources:** All copy is taken verbatim from the BE2 UX spec (`docs/status/phase-BE2-next-visible-local-product-scope-ux-spec-2026-06-07.md`) and the existing BE2 checklist doc (`docs/status/phase-BE2-p0-re-acceptance-checklist-2026-06-07.md`).

### 1.2 CSS additions

New styles in `styles.css` for:
- `.p0-checklist-card` — card padding
- `.p0-checklist-safety-label` — warm-branded safety banner with left accent border
- `.p0-check-section-label` — small uppercase section labels
- `.p0-checklist-table` — compact scannable table with subtle row separators, hover highlight, and compact code font
- `.p0-checklist-detail` — collapsible `<details>` sections with border, background, and summary styling
- `.p0-checklist-reminders` — unstyled list with compact vertical spacing
- `.p0-refresh-table` — margin reset for nested table

All styles use existing CSS custom properties (`--brand-accent`, `--warm-hairline`, `--surface-strong`, etc.) to match the warm/light theme.

### 1.3 Test additions

4 new tests in the `"P0 Re-Acceptance Checklist"` describe block:

1. **renders the P0 re-acceptance checklist card in the workbench center** — verifies all major sections render: card class, title, safety label, target package, safety rules, table, all 8 criteria, runbook diff, BC7 closure, reminders, footer note
2. **renders the runbook diff table inside a collapsible detail element** — verifies the `<details>` wrapping and table columns
3. **renders the BC7 closure statement inside a collapsible detail element** — verifies BLOCKED/455 tests/SUPERSEDED assertions
4. **renders reminders with cross-mark and check-mark icons** — verifies aria labels and reminder text

---

## 2. Gates

| Gate | Result |
|------|--------|
| `pnpm typecheck` | PASS — all projects |
| `pnpm test` | PASS — 169 tests (165 existing + 4 new) |
| `pnpm build` | PASS — desktop and CLI |
| `pnpm privacy:scan` | PASS — 288 files |

---

## 3. Local-only safety statement

This implementation introduces no:
- Live ServiceNow login, browser navigation, or API writes
- Save / Submit / Update / Resolve / Close automation
- Field filling or autofill behavior
- Display of real ServiceNow URLs, ticket IDs, sys_ids, credentials, cookies, sessions, tokens, or browser evidence
- New IPC/RPC endpoints, preload bridge methods, or electron main-process changes
- New npm dependencies, build steps, or infrastructure

All changes are local-only React rendering and CSS. The checklist is a read-only reference surface that mirrors the existing static markdown document. No runtime or safety behavior is altered.

## 4. Remaining risks

| Risk | Assessment | Mitigation |
|------|-----------|------------|
| Checklist table is wide for narrow viewports | Table has 7 columns; may overflow on very narrow windows (<800px) | Already benefits from existing `workbench-page-shell` min-width and scroll container behavior; `word-break: break-all` on `<code>` elements handles long paths |
| Collapsible sections start closed | Alan must click to expand runbook diff and BC7 closure | Intentional — these are secondary context, not part of the primary checkbox flow; matches progressive disclosure pattern |
| Copy drift between doc and rendered card | The rendered card copies from the BE2 spec verbatim | If the checklist doc is updated, the rendered card JSX would need manual sync |

## 5. Handoff for downstream QA/security

**What was built:**
A rendered P0 Re-Acceptance Checklist card in the operator workbench center column, displaying the 8 P0 criteria table, safety statement, target package info, runbook comparison, BC7 closure statement, and reminders — all local-only, read-only, and matching the BE2 spec copy.

**What should QA verify:**
1. The P0 checklist card renders below the Release Readiness Handoff card
2. All 8 P0 criteria rows are visible in the table
3. The safety banner and safety rules are prominent and readable
4. The runbook diff and BC7 closure sections are collapsible and expand on click
5. Reminders show cross marks (❌) and check mark (✅) with correct aria labels
6. No real ServiceNow URLs, ticket IDs, or credentials appear anywhere in the card
7. No Save/Submit/Update/Resolve/Close language appears

**What should security verify:**
1. No new write behavior introduced
2. No real data exposed
3. No new privileged IPC or electron bridge access
4. All copy is local-only and sanitized

## 6. Simplicity check

This is the smallest safe change because:
- Only 3 existing files modified (App.tsx, styles.css, App.test.ts)
- No new pages, routes, IPC handlers, or npm dependencies
- No new component architecture — uses existing `workbench-card` pattern
- Copy reused verbatim from the approved BE2 spec — no new UX decisions
- All tests pass without test restructuring

## 7. Surgical check

Each touched file is necessary because:
- `App.tsx` — the JSX for the checklist card lives in the workbench center column rendering
- `styles.css` — checklist-specific styling uses new classes that don't exist elsewhere
- `App.test.ts` — tests verify the new card renders all expected content
- `docs/status/phase-BE3-...` — the BE3 deliverable document
