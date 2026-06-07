# Phase AP2 — Repo-Hygiene Three-Column Sub-Layout UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan first, then `sna-frontend-workbench` after approval
Privacy level: sanitized. All examples are fake. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Preflight

Goal
- Define the exact UX/copy spec for the repo-hygiene card’s internal three-column sub-layout.
- Lock the column widths, dividers, padding, action placement, and state placement so AP3 can be implemented surgically.
- Keep the surface local-only and read-only: no ServiceNow login, browser automation, API writes, upload, PR, merge, tag, or release.

Known facts
- AP1 established that the repo-hygiene card is still a single vertical stack today.
- AG2 and AL2 already defined the intended internal structure: left = queue/feed, center = selected detail + evidence, right = local actions + boundary.
- The outer workbench layout must not change in this phase.
- All existing action handlers already exist; this task only specifies placement and copy.

Assumptions
- Alan wants a compact, calm, warm-light card that is readable in one glance.
- The card should preserve the current item, evidence, and action affordances while changing only internal layout.
- The right column should remain the action rail even when a cleanup preview is open.

Ambiguities
- Whether the card should use hard column percentages or flexible minmax columns.
- Whether the cleanup preview should expand in-flow below the actions or overlay within the right column.
- Whether the footer boundary note should span the full card or remain inside the right rail.

Chosen smallest approach
- Use a three-column internal CSS grid with flexible widths, one hairline divider between columns, and a full-width footer.
- Keep the queue in the left rail, the selected detail/evidence in the center, and all actions in the right rail.
- Keep disabled reasons inline and short; never rely on tooltips alone.

Files likely affected
- `docs/status/phase-AP2-repo-hygiene-three-column-ux-spec-2026-06-07.md` only in this task.
- AP3 implementation is expected to touch `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, and `apps/desktop/src/App.test.ts`.

Verification plan
- Confirm the spec defines exact widths, padding, divider treatment, and responsive breakpoints.
- Confirm the spec keeps all ServiceNow risk boundaries explicit and local-only.
- Confirm every required state has placement across left / center / right columns.
- Confirm the spec includes implementation handoff guidance for the next phase.

## 1. Purpose

Turn the repo-hygiene card into a compact operator sub-surface where Alan can answer, in one glance:

1. What hygiene item is selected?
2. Is it verified, pending, or closed as N/A?
3. What evidence supports the current state?
4. What local-only action can I take now?
5. What boundary copy makes it clear this is not a live ServiceNow action surface?

This is not a release dashboard and not a ServiceNow control panel.
It is a local-only status surface for repository hygiene and artifact-boundary clarity.

## 2. Research and design references

Public reference patterns used for layout direction:

- Linear: left navigation plus focused issue/detail pane plus action rail, with a strong selected-item pattern.
- Claude Code desktop / modern agent workbench patterns: visible current item, compact metadata, and side-by-side review instead of a vertical dump.
- Open Design command-center framing: calm shell, clear selection, and progressive disclosure.

Design takeaways for this task:

- Put the current hygiene item in the center of attention.
- Keep the queue short and scannable.
- Make the local-only boundary obvious without turning it into a warning wall.
- Keep all copy short enough to scan comfortably in bright office lighting.

## 3. Layout wireframe in text

Desktop target: 1366px+ Electron window, ideal canvas 1440x900.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Local Repo Hygiene + Artifact Boundary                                                                     │
│ Local only · No ServiceNow actions · No upload / PR / merge / tag / release                               │
├───────────────────────────────┬──────────────────────────────────────────────┬─────────────────────────────┤
│ Left column                   │ Center column                                │ Right column                │
│ queue / feed / history        │ selected detail / evidence                   │ local actions / boundary    │
│ 280-320 px                    │ 460-560 px                                   │ 300-360 px                  │
│                               │                                              │                             │
│ [Verified] .gitignore         │ Selected: Stale dist/release/ artifacts      │ Refresh local scan          │
│ [Pending] dist/release/       │ - current state                              │ Open workspace root         │
│ [Closed as N/A] .local/...    │ - why it is pending                          │ Export status markdown      │
│ [History] last local scan     │ - cleanup preview summary                    │ Copy selected summary       │
│ [Settings] local scan prefs   │ - evidence / counts / preserved items        │ Cleanup preview             │
│                               │                                              │ [disabled reason inline]    │
│ Bottom-left settings          │                                              │ Compact safety badge        │
├───────────────────────────────┴──────────────────────────────────────────────┴─────────────────────────────┤
│ Footer strip: Local only · disabled actions explain why they are unavailable · human-readable local state  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended geometry:
- Card padding: 20 px on all sides.
- Internal grid gap: 16 px.
- Column divider: 1 px hairline, visible but quiet.
- Vertical spacing between rows inside each column: 12 px.
- Row/button minimum height: 40 px; preferred 44 px for touch comfort.
- Outer card radius: preserve existing shell radius; do not introduce a harsher corner style.

Recommended column sizing:
- Left: `minmax(280px, 0.28fr)`
- Center: `minmax(460px, 0.46fr)`
- Right: `minmax(300px, 0.26fr)`

Use flexible sizing so the center stays the dominant reading area, but keep the right rail wide enough for stacked buttons and explanatory copy.

## 4. Column responsibilities

### Left column — queue / feed / history / settings
Owns the list of local hygiene items and their current state.

It should answer:
- Which hygiene item is selected?
- Which items are verified closed?
- Which item is still pending cleanup?
- What was the last successful local scan?
- Where do I adjust local scan preferences?

Include:
- item list with state chips
- history / last-scan summary
- pending / closed filter if present today
- short local-scan scope summary
- bottom-left settings entry point

Rules:
- Do not turn the left side into a long audit log.
- Do not bury the pending item behind the verified items.
- Keep each row short enough to scan in one pass.
- Preserve selection state visibly with a calm highlight.

### Center column — selected detail + evidence
Owns the selected hygiene item and its explanation.

It should answer:
- What exact item am I looking at?
- Why is it verified, pending, or closed as N/A?
- What cleanup preview exists, if any?
- What evidence supports the current state?
- What text should Alan copy or export?

Include:
- exact item title
- current state chip
- short reason text
- compact evidence summary
- cleanup preview summary
- local-only boundary note

Rules:
- Preserve the order: item → state → reason → evidence → next local action.
- Keep the selected item visually obvious even while evidence is loading.
- Avoid a wall of raw paths or full scan logs.
- Keep the closed-as-N/A item explicitly local-only / gitignored.

### Right column — local actions + safety boundary
Owns the local-only action set and the explicit safety copy.

It should answer:
- What can I do right now?
- Is the action enabled, loading, or disabled?
- Why is it disabled?
- What boundary keeps this local-only?

Include:
- `Refresh local scan`
- `Open workspace root`
- `Export status markdown`
- `Copy selected summary`
- `Cleanup preview`
- compact safety badge
- disabled-state explanations

Rules:
- The action rail should feel like local maintenance, not release operations.
- `Cleanup preview` is only meaningful for the pending `dist/release/` item.
- Verified and closed items should show why cleanup preview is unavailable.
- Keep the most important actions stacked top to bottom in priority order.

## 5. State matrix

| State | Left column | Center column | Right column |
|---|---|---|---|
| Empty | No scan has run yet; rows are hidden or replaced with placeholders. | Shows the prompt to run a local scan. | Refresh and export actions disabled with reasons. |
| Loading | Scan row shows progress; list remains visible. | Selected item skeleton appears with muted placeholders. | Only refresh / cancel-like local controls remain active. |
| Ready with open item | `.gitignore` shows verified; stale `dist/release/` is selected. | Shows selected cleanup details and evidence. | Cleanup preview enabled; export enabled. |
| Ready with only closed items | All items show verified / closed / N/A. | Shows the clean-worktree summary. | Cleanup preview disabled because nothing is pending. |
| Pending cleanup selected | Stale `dist/release/` highlighted as the open item. | Shows what remains to remove and why. | Cleanup preview and evidence copy enabled. |
| Closed / N/A selected | `.local/video-analysis/` marked closed as local-only and gitignored. | Shows local-only / gitignored evidence and closure copy. | Cleanup action disabled; explanation shown. |
| Error | Items remain visible if last safe state exists. | Shows the last safe item and the failure reason. | Most actions disabled until local state is restored. |

Notes:
- Avoid spinner-only states.
- Use muted placeholders or a short status sentence while data resolves.
- Keep the last safe state visible whenever possible.
- Never let a closed item look more urgent than the open stale-artifact item.

## 6. Main components

Keep the component set small. Do not introduce a large design system.

### Structural pieces
- `RepoHygieneCard`
- `RepoHygieneHeader`
- `RepoHygieneThreeColumnGrid`
- `RepoHygieneFooterStrip`

### Left rail
- `RepoHygieneQueue`
- `RepoHygieneQueueRow`
- `RepoHygieneHistoryLine`
- `RepoHygieneSettingsLink`

### Center column
- `RepoHygieneSelectedDetail`
- `RepoHygieneStateChip`
- `RepoHygieneEvidenceSummary`
- `RepoHygieneCleanupPreviewSummary`
- `RepoHygieneBoundaryNote`

### Right rail
- `RepoHygieneActionRail`
- `RepoHygieneActionButton`
- `RepoHygieneSafetyBadge`
- `RepoHygieneDisabledReason`

Component rules:
- Keep the queue rows selectable.
- Keep evidence collapsed until selected.
- Keep actions visible without requiring extra scrolling.
- Keep disabled reason copy inline under the button or directly beside it.

## 7. Empty / loading / error states

### Empty state
Use one sentence and one next action.

Recommended copy:
- `No local hygiene scan has run yet.`
- `Run a local scan to populate .gitignore, dist/release/, and .local/video-analysis/ state.`
- `This surface only reports local repository state.`

Placement:
- Left: show placeholder rows or an onboarding stub.
- Center: show a calm prompt and a muted example selection card.
- Right: disable actions with explicit reasons such as `Disabled: no scan data yet.`

### Loading state
Use muted placeholders, not a spinner wall.

Recommended copy:
- `Scanning local repo state...`
- `Checking .gitignore verification...`
- `Reviewing stale dist/release/ artifacts...`
- `Confirming .local/video-analysis/ closure...`

Placement:
- Left: keep the queue visible and dimmed.
- Center: keep the last selected item visible if present; otherwise show skeleton cards.
- Right: keep local-only controls visible, but disable anything that depends on fresh scan data.

### Error state
Show the exact step that failed.

Recommended copy:
- `The local scan could not read the repository state.`
- `Evidence is temporarily unavailable.`
- `Refresh the local scan or open the workspace root.`
- `The surface remains local-only; no remote action was attempted.`

Placement:
- Left: keep the last safe queue state visible.
- Center: show the last safe selected item plus the failure reason.
- Right: keep actions visible and disabled with explicit reasons.

## 8. Button enable / disable logic

### `Refresh local scan`
Enabled when:
- the app can read the local workspace
- the card is not already executing a refresh

Disabled reason:
- `Workspace root unavailable.`

### `Open workspace root`
Enabled when:
- a workspace root is configured

Disabled reason:
- `No local workspace root configured.`

### `Export status markdown`
Enabled when:
- the current scan has at least one item
- the card has a stable last-scan result to export

Disabled reason:
- `Nothing to export yet.`

### `Copy selected summary`
Enabled when:
- a row is selected

Disabled reason:
- `Select a hygiene item first.`

### `Cleanup preview`
Enabled only when:
- the selected item is the pending `dist/release/` item
- the current scan state is fresh enough to preview

Disabled reasons:
- Verified item: `No cleanup is needed for a verified item.`
- Closed / N/A item: `This item is already closed as N/A.`
- No selection: `Select the pending cleanup item first.`
- No fresh data: `Refresh the scan before previewing cleanup.`

### General button rules
- Disabled buttons must explain why in plain language.
- Never hide a button that the operator needs for comprehension; disable it instead.
- Never make a local-only button look like a ServiceNow action.

## 9. Copy text

### Header copy
- Title: `Local Repo Hygiene + Artifact Boundary`
- Boundary line: `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`
- Compact chip: `Local only`

### Left-column labels
- `Verified`
- `Pending`
- `Closed as N/A`
- `History`
- `Settings`

### Right-column labels
- `Refresh local scan`
- `Open workspace root`
- `Export status markdown`
- `Copy selected summary`
- `Cleanup preview`

### Empty / loading / error copy
- Empty: `No local hygiene scan has run yet.`
- Loading: `Scanning local repo state...`
- Error: `The local scan could not read the repository state.`

### Safety copy
- `Local only.`
- `No ServiceNow login or browser automation.`
- `No upload, PR, merge, tag, or release.`
- `Disabled actions explain why they are unavailable.`

### Cleanup preview copy
- `Preview the local cleanup before applying it.`
- `This preview only applies to stale dist/release artifacts.`
- `Verified and closed items do not need cleanup preview.`

## 10. Accessibility notes

- Maintain a logical tab order: left queue → center detail → right actions.
- Use `aria-selected` for the active queue row and keep the selected state visible without relying on color alone.
- Use `aria-live="polite"` for refresh status, loading state changes, and scan errors.
- Ensure every action button has a visible text label; do not rely on icons alone.
- Keep minimum target height at 40 px, preferred 44 px, with sufficient spacing for pointer and touch use.
- Use a warm-light palette with comfortable contrast; avoid pure black backgrounds and harsh neon accents.
- Provide focus rings that are clearly visible on the warm background.
- Keep motion subtle and respect reduced-motion preferences.
- Keep the disabled reason text adjacent to the disabled button so the reason is discoverable by keyboard and screen reader users.

## 11. What GPT Images 2 mockups were generated, if any

Attempted one warm-light landscape mockup for this spec using sanitized fake data only.
The image-generation tool returned `FalClientHTTPError` twice, so no usable mockup artifact was produced in this run.

If AP2 is revisited later, the intended mockup concept is:
- warm ivory background
- left queue / center evidence / right action rail
- stacked local-only actions on the right
- large readable labels and clear disabled reasons
- no branding, no dark theme, no real ServiceNow content

## 12. Implementation handoff for `sna-frontend-workbench`

This spec is the blueprint for AP3. Keep the implementation surgical.

Target files for AP3:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Implementation intent:
1. Wrap the existing repo-hygiene queue, selected evidence, and action section in an internal three-column grid.
2. Add hairline dividers and the warm-light spacing described above.
3. Keep all existing state and handlers intact.
4. Move cleanup preview and confirmation into the right column only.
5. Update tests to reflect grid layout without changing behavior assertions.

Acceptance criteria for the next phase:
- The card visibly reads as three columns on desktop width.
- The left queue remains scannable.
- The center detail remains the primary reading area.
- The right rail shows all local actions and their disabled reasons.
- The footer boundary copy remains visible.
- No behavioral or IPC changes are introduced.

## 13. Summary for AP3

AP2 locks the UI contract for the repo-hygiene card’s internal sub-layout.
It preserves the current behavior, clarifies the column responsibilities, and gives AP3 a minimal CSS/JSX target with explicit copy, state, and accessibility rules.
