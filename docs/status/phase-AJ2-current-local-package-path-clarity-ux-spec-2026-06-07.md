# Phase AJ2 — Current Local Package Path Clarity UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only copy and micro-layout cleanup for package-path clarity

## 0. Preflight

Goal
- Make the worktree-acceptance surface unmistakable about which local Windows package Alan should test now and which older packages are archival only.
- Preserve the exact current local Windows package path as the test target until AJ6 refreshes a new AJ build.
- Remove stale AG wording from any user-visible copy or status-doc text in this round.

Known facts
- AJ1 established that the current local Windows package is the AI6 zip below and that older AF/AG/AH packages are archival only.
- The code path already uses the generic label `Current local Windows package`; this AJ2 round is about copy and micro-layout consistency in the acceptance surface and docs.
- This task is design/spec only; no live ServiceNow login, browser automation, upload, write, push, PR, merge, tag, release, or cron changes are allowed.

Assumptions
- Alan wants the current package to be visible without opening a drawer.
- Alan wants archival packages clearly demoted so they cannot be mistaken for the current checkpoint.
- The manual validation checklist should be short enough to read in one pass.

Ambiguities
- Whether archive rows should use the label `Archived local Windows package` or `Archived package` as the visible row title.
- Whether the checklist should live in the center column or the right-side detail area.
- Whether historical AG/AF aliases should appear in the surface at all, beyond archived history.

Chosen smallest approach
- Keep the existing acceptance surface structure.
- Change only copy and micro-layout emphasis: current package first, archival packages visually demoted, manual validation checklist compact.
- Avoid any new cards, actions, or external integrations.

Files likely affected
- `docs/status/phase-AJ2-current-local-package-path-clarity-ux-spec-2026-06-07.md` only

Verification plan
- Check that the exact current package label is specified and does not rely on AG/AF phase wording.
- Check that older AF/AG/AH aliases are explicitly archival only and never presented as current.
- Check that the manual validation checklist states what Alan should verify and what should be ignored.
- Check that no wording implies live ServiceNow writes, uploads, or release actions.

## 1. Purpose

Turn the package-path acceptance surface into one unambiguous local-only checkpoint where Alan can answer, in one glance:

1. What exact local Windows package should I test now?
2. Which older packages are historical only?
3. What does the manual validation checklist require me to confirm?
4. What wording prevents the archival packages from being mistaken for the current checkpoint?

This is not a new workflow, not a new action set, and not a release dashboard.
It is a copy-and-micro-layout clarification pass for the existing local acceptance surface.

## 2. Exact current package identity

The current local Windows package Alan should test today remains:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip
```

This exact path is the test target until AJ6 refreshes a new AJ build.

### Recommended current-package label

Use this exact visible label:

```text
Current local Windows package
```

Recommended supporting copy:

```text
This is the package Alan should test now.
```

Do not prepend AG/AF/AH phase aliases to the current label.
Do not present an older archival package as the checkpoint by color, ordering, or proximity.

## 3. Archived package wording

Older AF/AG/AH packages are historical records only.
They may remain visible in history, but they must be explicitly demoted so they cannot be read as current.

### Recommended archive label

Use this exact visible label for older packages:

```text
Archived local Windows package
```

Recommended supporting copy:

```text
Superseded by the current package; do not test this checkpoint.
```

### Required archive badge wording

If a compact badge is shown, use one of these exact phrases only:

- `Archival only`
- `Superseded`
- `Not current`

Preferred default: `Archival only`

### Archive policy

- AF, AG, and AH aliases are archival only.
- They must not be presented as the current checkpoint.
- They must not be the first item in the list.
- They must not use stronger visual emphasis than the current package.
- They must not reuse the current-package label.

## 4. Inventory of stale labels to normalize

This is the survey result for the current worktree-acceptance surface, handoff docs, and decision templates. The code path is already generic; the stale labels live in copy surfaces that still name AG as if it were current.

| Surface | File / area | Before | After | Notes |
| --- | --- | --- | --- | --- |
| Worktree-acceptance UI | `docs/status/phase-AH2-worktree-acceptance-ux-spec-2026-06-07.md` wireframe | `[Fresh] AG local Windows package` | `[Fresh] Current local Windows package` | Keep the exact package path line as the AI6/current local package; only the row label changes. |
| QA checklist | `docs/status/phase-AH4-qa-acceptance-manual-checklist-2026-06-07.md` | `Fresh package: "AG local Windows package" (newest dated)` | `Fresh package: "Current local Windows package" (newest dated)` | The checklist should describe the same current package without a phase alias. |
| Acceptance decision template | `docs/status/phase-AH1-acceptance-decision-template-2026-06-07.md` | `The AG Windows package` / `AG package` / `AG1–AG7 changes` | `The current Windows package` / `current package` / `current worktree changes` | Replace all package and change labels with generic current-state language. |
| Post-acceptance handoff | `docs/status/phase-AH1-post-acceptance-next-phase-2026-06-07.md` | `AG1–AG7 changes`, `AG7 final readiness gate`, `AG Windows package` | `current worktree changes`, `current final readiness gate`, `current local Windows package` | This is the clearest handoff surface for downstream workers, so the copy must be explicit. |
| Worktree acceptance scope | `docs/status/phase-AH1-worktree-acceptance-scope-2026-06-07.md` | `AG package (ag Windows local zip)` / `AG phase output` | `current local Windows package` / `current worktree output` | Keep historical context only if it is marked archival. |

### Normalization rule

If a sentence must mention AF/AG/AH for historical continuity, mark it explicitly as archival at first use:

- `AG (archival alias)`
- `AF (archival alias)`
- `AH (archival alias)`

Do not use those aliases as the visible label for the current checkpoint.

## 5. Manual validation checklist copy

The checklist should read as a short operator checklist, not a release note.
It should fit inside the existing acceptance surface without forcing a new panel.

### Recommended checklist title

```text
Manual validation checklist
```

### Recommended checklist items

1. Confirm the current package label reads `Current local Windows package`.
2. Confirm the current package path matches the exact AI6 zip path above.
3. Confirm older AF/AG/AH packages are labeled `Archived local Windows package` or `Archival only`.
4. Confirm no archival package is presented as the current checkpoint.
5. Confirm the surface stays local-only and does not imply any ServiceNow write action.

### Optional helper line

```text
Check the current package first; treat all older packages as archival only.
```

## 6. Micro-layout guidance

Keep the existing three-column acceptance surface, but adjust emphasis so the current package and checklist dominate the first scan.

### Left column — package list and history
Owns the package rows and history entries.

Rules
- Current package appears first.
- Archived packages appear below it and use muted styling.
- History can mention AF/AG/AH aliases only as archival records.
- Do not use AG/AF wording in the row title for the current package.

### Center column — selected package detail
Owns the exact path and the manual validation checklist.

Rules
- Show the current package path immediately.
- Keep the archive explanation one level below the current path.
- Keep the checklist short and directly actionable.
- Use progressive disclosure for archival details.

### Right column — safety and local actions
Owns compact safety copy and local-only controls.

Rules
- Keep local-only boundary copy visible.
- Disabled actions must say why they are disabled.
- No action should imply ServiceNow login, update, resolve, or close.

## 7. State matrix

| State | Visible label behavior | Copy requirement |
| --- | --- | --- |
| Empty | No package selected | `Current local Windows package` appears as the target label once a package is resolved |
| Current package selected | Prominent current row | Exact AI6 path shown; current label stays generic |
| Archive row selected | Muted row | Label is `Archived local Windows package` and is clearly superseded |
| Checklist only view | Checklist in focus | Checklist title is `Manual validation checklist` |
| Error / unresolved path | Safe fallback text | Explain what failed without implying a different package is current |

## 8. Empty, loading, and error states

### Empty state
Recommended copy:
- `No current package selected yet.`
- `Open the latest local package to begin.`

### Loading state
Recommended copy:
- `Resolving the current local Windows package...`
- `Loading the manual validation checklist...`

### Error state
Recommended copy:
- `The current package could not be resolved.`
- `Use the last known local package path or refresh the local package list.`

## 9. Button enable / disable logic

This AJ2 round does not add new actions.
Use only the existing local-only controls, with clearer disabled reasons.

### Enabled
- `Copy package path` — when a current package is selected.
- `Open dist/release` — when the local workspace path resolves.
- `Copy summary` — when a row or checklist item is selected.

### Disabled with reasons
- `Archive details` — disabled unless an archived row is selected.
- `Mark reviewed` — disabled until the current package is visible and checklist context is loaded.
- Any action that would imply ServiceNow writes — disabled and explained as local-only only.

### Disabled-state copy
Use explicit reasons such as:
- `Disabled until the current package is selected.`
- `Disabled because this row is archival only.`
- `Disabled: local-only surface, no ServiceNow action available.`

## 10. Copy rules

These rules apply to the acceptance surface and this status-doc family.

Must
- Use `Current local Windows package` for the current test target.
- Use `Archived local Windows package` for older AF/AG/AH items when shown.
- Use `Manual validation checklist` as the checklist title.
- Say `Archival only` or `Superseded` when demoting old packages.
- Keep the current package path exact and unmodified.

Must not
- Say `AG local Windows package` for the current checkpoint.
- Present AF/AG/AH aliases as the active package.
- Make archival packages look current through color or ordering.
- Add any ServiceNow write implication.
- Add any new card, mode tab, or external integration.

## 11. Implementation handoff for `sna-frontend-workbench`

When this spec is approved, implement only the copy and micro-layout wording changes in the existing acceptance surface.

Expected implementation behavior
- Keep the exact current package path unchanged.
- Replace any stale current-package wording with `Current local Windows package`.
- Demote older AF/AG/AH rows to `Archived local Windows package` / `Archival only`.
- Update the checklist title and the five checklist lines above.
- Preserve the existing local-only, human-reviewed boundary copy.

Non-goals for implementation
- No new UI sections.
- No functional state changes.
- No ServiceNow automation.
- No package refresh work; AJ6 owns that.

## 12. Status

```text
Phase AJ2 — CURRENT LOCAL PACKAGE PATH CLARITY UX/COPY SPEC

State: COMPLETE (definition only, no implementation)
Deliverable: this document
Current package: servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip
Archive policy: AF/AG/AH are archival only
Checklist title: Manual validation checklist
```

*This document defines copy and micro-layout guidance only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
