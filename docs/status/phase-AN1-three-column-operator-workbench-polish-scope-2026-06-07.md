# Phase AN1 — Three-Column Operator Workbench Polish Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AM7 base:** AM1–AM7 changes present (stale dist/release cleanup workflow — scope → UX spec → implementation → QA acceptance → privacy/safety → package refresh → final gate)
**Profile:** `sna-orchestrator`
**Task:** `t_d62b4c34`

---

## 1. Why this phase

The AM series is complete — the stale dist/release cleanup workflow is shipped through all 7 gates (scope → UX spec → IPC bridge → UI integration → QA acceptance → privacy/safety → package refresh → final gate). The board is clear.

The three-column Operator Workbench layout already exists in the codebase (CSS grid at `styles.css` lines 2687–2693, rendered in `App.tsx` lines 3860–5121). The design spec at `docs/design/operator-workbench-three-column-spec.md` is comprehensive (349 lines covering layout, column responsibilities, state matrix, components, empty/loading/error states, button logic, copy text, accessibility, and acceptance criteria).

However, the current implementation has **visual polish gaps** between what the spec describes and what the user sees:

1. **No visible column headers** — The spec wireframe shows labeled columns (LEFT: SOURCE + QUEUE / CENTER: WORK PRODUCT / RIGHT: RUNTIME), but the current UI has no such labels.
2. **Right rail defaults collapsed** — `initialRuntimeRailExpanded = false`. The spec says runtime actions "must be large and obvious." When collapsed, the entire right column is hidden with no persistent affordance.
3. **Column visual distinction is subtle** — All three columns share the same warm background and card surface. The spec calls for the three-column shell to be "obvious at a glance."
4. **Disabled reasons may not be immediately visible** — The spec says disabled button reasons must be "visible next to the control, not hidden in a tooltip." The current implementation needs verification.
5. **Keyboard navigation and focus state coverage** — The spec requires "keyboard navigation and visible focus states" across the workbench. The existing implementation has focus handling on some elements but may not cover all interactive regions consistently.

**This phase is a focused visual polish pass that makes the three-column layout unmistakable, keeps column responsibilities obvious, and preserves all existing safety boundaries.**

---

## 2. Current state vs. spec gap inventory

| # | Area | Spec requirement (§) | Current implementation | Gap |
|---|------|---------------------|----------------------|-----|
| 1 | Column headers | Visible left/center/right labels (§2 wireframe) | No column header labels in UI | Missing — columns have no visible titles |
| 2 | Right rail default | Runtime actions "large and obvious" (§3, §7) | `initialRuntimeRailExpanded=false` | Hidden when collapsed — no persistent stripe |
| 3 | Column visual distinction | Shell "obvious at a glance" (§9) | Uniform warm background on all columns | Subtle — columns blend together |
| 4 | Disabled reason placement | "Visible next to control, not hidden in tooltip" (§7) | QuaOperatorRuntimePanel renders disabled buttons with `title` attr | Needs audit — some reasons may only be in `title` |
| 5 | Keyboard navigation | "Preserve keyboard navigation and visible focus states" (§9) | Partial — sidebar handle, nav items, queue items have focus | Needs audit — runtime rail, settings panel, center cards need verification |
| 6 | Safety boundary copy | "Visible safety boundary copy" (§5, §8) | Present at top bar and some cards | Verify — consistent placement across all states |
| 7 | Copy text alignment | Exact labels from §8 | Mostly matching | Minor tweaks possible — verify labels match spec |
| 8 | Right rail elements | "CDP readiness, safety boundary, environment controls, recent evidence" (§3) | QaOperatorRuntimePanel + HighSeverityMonitorSimulator | Audit present vs. missing sub-elements |
| 9 | Center column elements | "Selected source detail, cleaned source, TicketDraft, field preview, autofill plan, KB detail" (§3) | Release readiness + repo hygiene cards | This gap is intentional — center content evolves per phase |

---

## 3. Scope — what this polish pass includes

### 3.1 Column headers (visual labels)

Add visible, compact column header labels to the three-column layout:

- Left column: `"SOURCE + QUEUE"` or `"SOURCES"` (compact, at top of `workbench-sidebar`)
- Center column: `"WORK PRODUCT"` (compact, at top of `workbench-center`)
- Right column: `"RUNTIME"` or `"ACTIONS"` (compact, at top of `workbench-runtime-rail`)

**Implementation notes:**
- Small, muted, uppercase label (like `.eyebrow` style already used in the app)
- Use `aria-label` on each column `<aside>` / `<section>` as the canonical semantic identifier
- The visible label is secondary to the ARIA label
- Do not add decorative icons or large banners — keep it compact

### 3.2 Right rail expanded by default

Change `initialRuntimeRailExpanded` from `false` to `true`.

**Rationale:** The runtime actions (Start QA Chromium, Verify, Autofill) and CDP readiness are the primary operational surface. Hiding them behind a collapsed toggle contradicts the spec's requirement that they be "large and obvious."

**What this changes:**
- `App.tsx` line 2993: `initialRuntimeRailExpanded = true` (default)
- The topbar toggle button still allows collapse for power users who want more center workspace
- All other runtime rail behavior unchanged

### 3.3 Column background tints for visual distinction

Apply subtle, distinct background tints to each column to make the three-column shell unmistakable at a glance:

- Left sidebar: Very faint warm tint (existing or slightly warmed)
- Center: Clean white/cream surface (existing — already the brightest area)
- Right rail: Very faint cool/blue tint to distinguish from left and center

**Implementation notes:**
- Use CSS custom properties on `data-column` or similar
- Tint must be subtle — not a different theme, just a barely visible cue
- Must not interfere with card borders, shadows, or readability
- Should work in both warm and cool themes

### 3.4 Disabled reason placement audit

Audit all disabled buttons across the workbench to ensure:

- Every disabled button has a visible text reason next to it (not just a `title` attribute or tooltip)
- The reason is readable at normal font size (not hidden behind hover)
- The reason explains what condition would enable the button

**Components to audit:**
- `QaOperatorRuntimePanel` — Start QA Chromium, Verify current Incident, Autofill
- Worktree acceptance card — Review diff, Open dist/release, Mark reviewed
- Any other disabled buttons in the center workspace

### 3.5 Keyboard navigation and focus state audit

Audit and fix keyboard navigation across the workbench:

- Verify Tab order flows logically: left column → center → right rail
- Every interactive element has a visible `:focus-visible` outline
- The right rail runtime actions are reachable via keyboard
- Collapse/expand toggles for sidebar and rail are keyboard-accessible
- Settings panel is keyboard-accessible

### 3.6 Copy precision pass

Cross-reference the existing copy against §8 of the spec. Fix any discrepancies:

- Button labels match spec exactly (Start QA Chromium, Verify current Incident, Autofill current Incident)
- Safety copy matches spec ("Manual paste only. Fake data only. Local demo only.")
- Disabled reasons use the exact wording from §7

### 3.7 Safety boundary verification

Verify that safety boundary copy is present and visible:

- Top bar always shows safety context (environment label, target status)
- Right rail shows CDP readiness and safety state
- Disabled actions explain why in plain language
- No Save / Submit / Update / Resolve / Close automation is introduced
- No real ServiceNow data is exposed

---

## 4. Non-goals

These are explicitly **out of scope** for AN1:

- **No structural layout changes** — The CSS grid `grid-template-columns` proportions stay as-is. No new columns, no column reordering.
- **No new components** — No new React components beyond the compact column header labels. All polish is CSS and prop changes.
- **No live ServiceNow behavior** — No login, no browser automation, no API writes, no ticket operations.
- **No center content rework** — The center column content (release readiness, repo hygiene) stays as-is from AM7. Center content evolution is a separate phase.
- **No right rail component additions** — No new sub-panels in the runtime rail. Existing QaOperatorRuntimePanel + HighSeverityMonitorSimulator stay.
- **No settings panel changes** — The settings sidebar content is out of scope.
- **No mock/demo removal beyond existing** — Existing demo scenario library stays. No new mock surfaces.
- **No file upload, PR, push, tag, release** — All work is local-only.
- **No cron job creation or modification.**
- **No reading/printing/submitting secrets, cookies, storage state, HAR, traces, screenshots, URLs, ticket IDs, sys_ids, or real field values.**

---

## 5. Red-zone prohibitions (unchanged from AM phase rules)

- 不做真实 ServiceNow 登录/浏览器操作/API 写入。
- 不做 Save / Submit / Update / Resolve / Close。
- 不上传附件。
- 不写 Microsoft Graph / Excel Web。
- 不做真实 Teams/Outlook/phone ingestion。
- 不读取/打印/提交 secrets、cookie、storage state、HAR、trace、截图、真实 URL、ticket ID、sys_id、requester、assignment group、真实字段值。
- 不 push、PR、merge、tag、GitHub Release；Alan 睡觉期间只允许 local-only 工作。
- 不递归创建/修改 cron jobs。

---

## 6. Safety boundaries

All operations in this phase are **local-only CSS/JSX changes** to the Electron renderer:

- Column headers are static text in JSX — no network, no filesystem, no IPC
- Background tints are CSS-only — no runtime computation
- Disabled reason audit is a copy/text change only — no behavioral changes
- Keyboard nav audit is attribute/`:focus-visible` changes — no structural DOM changes
- Right rail default is a `useState` initial value change — no behavioral change
- No IPC channels, no main process changes, no new Electron APIs
- All changes are revertable via git checkout

---

## 7. Task decomposition

### AN2 — Three-column operator workbench UX/copy spec (ALREADY CREATED as `t_33b961e1`)

**Goal:** Write the UX/copy spec for the three-column operator workbench polish. Make the visual hierarchy, column responsibilities, copy, and accessibility expectations explicit so implementation can be surgical.

**Assignee:** `sna-ui-designer`

**Deliverable:** `docs/status/phase-AN2-three-column-workbench-ux-spec-2026-06-07.md`

**Depends on:** AN1 (this document — completes first)

---

### AN3 — Implement three-column workbench visual polish

**Goal:** Apply the polish items defined in AN1 and specified in AN2 to the desktop app source. Specifically:

1. Add visible column header labels (LEFT/CENTER/RIGHT)
2. Change `initialRuntimeRailExpanded` to `true`
3. Apply subtle column background tints
4. Fix any disabled reasons found in the audit
5. Apply any copy precision fixes from the spec cross-reference
6. Apply any keyboard nav / focus state fixes from the audit

**Non-goals:**
- No structural layout changes (grid ratios, column order, DOM structure)
- No new components or cards
- No behavioral changes beyond the right rail default
- No IPC, main process, or Electron API changes
- No center content rework

**Assignee:** `sna-frontend-workbench`

**Files likely changed:**
- `apps/desktop/src/App.tsx` — column header labels, right rail default, disabled reasons, copy fixes
- `apps/desktop/src/styles.css` — column background tints, focus state refinements
- `apps/desktop/src/App.test.ts` — test updates for new copy/labels (if applicable)

**Verification:**
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — all existing tests pass + new tests for column labels if testable
- `pnpm privacy:scan` — PASS
- Visual: three columns are distinguishable at a glance
- Visual: right rail is expanded by default (can still be collapsed)
- Visual: column headers are visible on each column
- A11y: Tab order flows left → center → right
- A11y: Every interactive element has visible `:focus-visible`

**Depends on:** AN2 (UX/copy spec must be complete)

---

### AN4 — QA acceptance for three-column workbench polish

**Goal:** Run full build/typecheck/test/privacy:scan gates. Verify:

- Column headers are visible and readable
- Right rail defaults to expanded
- Column background tints are subtle and distinguishable
- All disabled buttons show visible reasons (not just tooltips)
- Copy matches the spec cross-reference
- Keyboard navigation flows left → center → right
- All focus states are visible
- No regression in existing 414+ tests
- No privacy violations
- All safety boundaries preserved (no real ServiceNow data, no automation)

**Assignee:** `sna-qa-acceptance`

**Deliverable:** QA evidence (test output, manual acceptance notes)

**Depends on:** AN3 (implementation complete)

---

### AN5 — Privacy/safety review for three-column workbench polish

**Goal:** Review the polish changes for privacy and safety. Since all changes are local-only CSS/JSX:

- Verify no new IPC channels or main-process changes were introduced
- Verify no new data surfaces that could leak real ServiceNow data
- Verify safety boundary copy is correct and visible
- Verify no Save / Submit / Update / Resolve / Close automation is introduced
- Verify no real URLs, ticket IDs, sys_ids, credentials, or fingerprints are exposed
- Verify `pnpm privacy:scan` passes

**Assignee:** `sna-privacy-security`

**Deliverable:** Privacy/safety sign-off (comment in task thread)

**Depends on:** AN3 (implementation complete)

---

### AN6 — Package refresh for AN3 changes

**Goal:** Rebuild the packaged Windows artifact after AN3 implementation changes to produce a fresh dist/release/ zip with the three-column polish included.

**Assignee:** `sna-windows-runtime`

**Deliverable:** Rebuilt dist/release/ artifact

**Depends on:** AN3 (implementation merged)

---

### AN7 — Final gate for three-column workbench polish

**Goal:** Final acceptance and release notes for the AN1 phase. Verify:

- All 4 gates: `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm privacy:scan`
- All AN4 Q/A findings resolved
- AN5 privacy/safety sign-off obtained
- AN6 package refresh completed
- Phase status documented

**Assignee:** `sna-release-docs`

**Deliverable:** Phase completion record + release summary

**Depends on:** AN4, AN5, AN6 (all must complete first)

---

## 8. Dependency graph

```
AN1 ──(this document)──► AN2 ──► AN3 ◄──► AN4
                                          │
                                          ├──► AN5 ──► AN7 (final gate)
                                          │
                                          └──► AN6 ──► (rebuild artifact)
```

Key:
- AN1: Scope definition (this document) — state: COMPLETE (once this document is written)
- AN2: UX/copy spec by `sna-ui-designer` — state: TODO (ALREADY CREATED as `t_33b961e1`)
- AN3: Implementation by `sna-frontend-workbench` — state: TODO
- AN4: QA acceptance by `sna-qa-acceptance` — state: TODO
- AN5: Privacy/safety review by `sna-privacy-security` — state: TODO
- AN6: Package refresh by `sna-windows-runtime` — state: TODO
- AN7: Final gate by `sna-release-docs` — state: TODO

Annotations:
- AN4 and AN5 run in parallel after AN3 — QA and privacy review are independent
- AN6 runs after AN3 so the package includes the polish changes
- AN7 gates on all of AN4, AN5, AN6

---

## 9. Verification plan

### AN2 (UX/copy spec)
- Spec is reviewed and approved by Alan before AN3 begins

### AN3 (Implementation)
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — all existing tests pass
- `pnpm privacy:scan` — PASS
- Visual verification: columns distinguishable, headers visible, right rail expanded
- A11y verification: Tab order, focus-visible outlines

### AN4 (QA acceptance)
- All 4 gates pass
- All visual polish items verified
- No regression in existing behavior
- Disabled reason audit complete

### AN5 (Privacy/safety)
- No new privacy violations
- Safety boundary copy verified
- No real data exposure

### AN6 (Package refresh)
- Fresh artifact produced
- Artifact includes AN3 changes

### AN7 (Final gate)
- All upstream gates complete
- Phase status recorded
- Release summary written

---

## 10. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| AN2 | `docs/status/phase-AN2-three-column-workbench-ux-spec-2026-06-07.md` (new) | < 200 lines |
| AN3 | `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, `apps/desktop/src/App.test.ts` | < 80 lines total |
| AN4 | QA evidence artifact | < 50 lines |
| AN5 | Privacy review artifact (comment) | < 30 lines |
| AN6 | Package refresh (no source changes) | 0 lines |
| AN7 | Phase completion record | < 50 lines |

**Total estimated change budget:** < 400 lines across 4–5 documents/files.

---

## 11. Status

```
Phase AN1 — THREE-COLUMN OPERATOR WORKBENCH POLISH SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Backlog items addressed: 1
  - Polish the three-column Operator Workbench layout to be unmistakable at a glance

Gaps inventoried: 9
  (1) Column headers missing
  (2) Right rail defaults collapsed
  (3) Column visual distinction subtle
  (4) Disabled reason placement needs audit
  (5) Keyboard navigation needs audit
  (6) Safety boundary copy needs verification
  (7) Copy text alignment needs cross-reference
  (8) Right rail elements
  (9) Center column elements

Downstream tasks defined: 6
  - AN2: UX/copy spec for three-column polish  → sna-ui-designer        [first, already created as t_33b961e1]
  - AN3: Implement visual polish               → sna-frontend-workbench [after AN2]
  - AN4: QA acceptance                         → sna-qa-acceptance      [after AN3]
  - AN5: Privacy/safety review                 → sna-privacy-security   [after AN3]
  - AN6: Package refresh                       → sna-windows-runtime    [after AN3]
  - AN7: Final gate                            → sna-release-docs       [after AN4, AN5, AN6]

Red-zone items excluded: 16
Non-goals: 10
```
