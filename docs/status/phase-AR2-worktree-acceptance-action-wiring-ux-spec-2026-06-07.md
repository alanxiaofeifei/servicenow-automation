# Phase AR2 — Worktree Acceptance Action Wiring UX / Copy Spec

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, customer data, or any external writes.

## 0. Preflight

Goal
- Define the exact wording for the worktree-acceptance surface.
- Make the current AQ6 package path explicit.
- Keep older rc.1 / AF / AG / AH / AI / AJ aliases clearly archival only.
- Specify button labels, disabled reasons, acceptance-state copy, and the manual checklist.

Known facts
- The IPC plumbing already exists; this task is renderer UX/copy only.
- The current package anchor is the AQ6 package path from AR1.
- The surface is local-only and must not imply ServiceNow writes, uploads, releases, or pushes.
- The task must not add new capabilities; it should only make the current acceptance flow legible.

Assumptions
- Alan wants a calm, high-confidence worktree acceptance surface rather than a dense audit panel.
- The current package path should be visible in plain text, not hidden behind a tooltip.
- Disabled actions should explain the next safe prerequisite in short, direct language.

Ambiguities
- Whether the “reviewed” and “accepted” states should appear as two chips or a single compact status line.
- Whether the diff preview should be collapsed by default when no dirty changes exist.
- Whether the summary copy should include the literal UNC path or a shortened local alias in the primary sentence.

Chosen smallest approach
- Use a three-column layout that keeps the package, the evidence, and the actions separated but always visible.
- Make the AQ6 path the primary package anchor and relegate older aliases to archival-only copy.
- Use short disabled reasons inline with the button row rather than long helper text blocks.

Files likely affected
- `docs/status/phase-AR2-worktree-acceptance-action-wiring-ux-spec-2026-06-07.md` only in this task.
- Implementation handoff below is for `sna-frontend-workbench` in the next phase.

Verification plan
- Confirm the exact button labels appear verbatim: `Review diff`, `Copy package path`, `Open dist/release`, `Mark reviewed`, `Copy summary`.
- Confirm the AQ6 package path is visible and older aliases are explicitly archival only.
- Confirm every disabled state tells the operator why the action is unavailable.
- Confirm the manual checklist keeps the current package path explicit on every step.

## 1. Purpose

Define the exact wording for the worktree-acceptance surface so the operator can answer, in one glance:

1. Which package is current?
2. Is the worktree fresh or dirty?
3. Has the diff been reviewed?
4. What path should be copied or opened?
5. What older package aliases are archival only?
6. What copy should appear in the final summary and checklist?

This is not a release console and not a write path.
It is a local-only acceptance surface for reviewing the current AQ6 package, copying the package path, opening the local dist/release folder, and recording that the diff was reviewed.

## 2. Research and design references

Public reference patterns used for layout direction:

- Claude Code desktop: one place for tasks, review, runtime status, and visible work state.
- Codex-style command center: split navigation, working artifact, and action rail so the active work stays calm.
- Antigravity-style manager/editor/artifact thinking: surface the artifact, surface the evidence, surface the action.
- Open Design / editorial workbench framing: warm light, restrained hierarchy, and progressive disclosure.

Design takeaways for this task:

- Keep the current package obvious, not implied.
- Put the acceptance state next to the actions, not in a hidden log.
- Treat older package aliases as history, not as active choices.
- Use short copy that scans well in office lighting.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Worktree Acceptance                                                                                      │
│ Local only · AQ6 is current · Older aliases are archival only                                            │
├───────────────────────────────┬──────────────────────────────────────────────┬───────────────────────────┤
│ Left: package feed / history   │ Center: current package detail               │ Right: actions / state    │
│                               │                                              │                           │
│ Current package                │ Selected package                              │ Review diff               │
│ - AQ6 current                 │ - current AQ6 path                            │ Copy package path         │
│ - older aliases archived      │ - diff summary                                │ Open dist/release         │
│ - last refresh                │ - acceptance notes                            │ Mark reviewed             │
│ - copy-ready status           │ - review status                               │ Copy summary              │
│ - settings                    │ - archival-only aliases                       │                           │
│                               │                                              │ Acceptance state          │
│ History                        │ Diff preview (collapsed by default)          │ - Fresh / Dirty           │
│ - last accepted package       │ - only shown when requested                   │ - Reviewed / Accepted     │
│ - previous archival-only set   │                                              │ - Current AQ6 package      │
│                               │ Manual checklist preview                       │                           │
└───────────────────────────────┴──────────────────────────────────────────────┴───────────────────────────┘
```

Recommended behavior:

- Left column is the package feed and history: current package, archival-only aliases, and refresh history.
- Center column is the selected package detail: current path, concise diff summary, and checklist-friendly acceptance notes.
- Right column is the action rail: the five explicit actions, compact acceptance state, and short disabled reasons.
- The current AQ6 path should stay visible even when the diff preview is collapsed.

## 4. Column responsibilities

### Left column — package feed / history / settings
Owns the package inventory and historical context.

It should answer:
- Which package is current?
- Which aliases are archival only?
- When was the package last refreshed?
- Where do I change local settings?

Include:
- current package row with strong selection state
- archival-only alias list
- last refresh timestamp
- compact history entry for the previous local package
- bottom-left settings access

Rules:
- Do not turn the feed into a verbose release log.
- Keep the current AQ6 item visually dominant.
- Show older aliases as muted archival entries, not as choices equal to the current package.
- Keep each row short enough to scan in one pass.

### Center column — current package detail / diff / checklist
Owns the actual acceptance evidence.

It should answer:
- What is the exact current package path?
- What changed in the diff?
- What should Alan check manually?
- What should the summary say?

Include:
- current AQ6 package path
- concise diff summary
- review state and acceptance state
- compact manual checklist preview
- archival-only note for older aliases

Rules:
- Preserve the order: package → path → diff → state → checklist.
- Keep the current path visible even while the diff preview is collapsed.
- Avoid a wall of raw text or long status prose.
- Never make an older alias look current.

### Right column — local actions / acceptance state / disabled reasons
Owns the action row and the compact state chip set.

It should answer:
- What can I do right now?
- Why is a button disabled?
- What is the current acceptance state?

Include:
- `Review diff`
- `Copy package path`
- `Open dist/release`
- `Mark reviewed`
- `Copy summary`
- compact acceptance state chips
- short disabled reason block

Rules:
- Buttons must be large and obvious.
- Disabled actions must explain why they are unavailable.
- The action rail should feel like local acceptance, not a release workflow.
- Do not add push, publish, merge, or external delivery affordances.

## 5. State matrix

| State | Visible label | Visible meaning | Action availability |
|---|---|---|---|
| Fresh current package | `Fresh` | The current AQ6 package is present and has not been reviewed yet. | `Review diff`, `Copy package path`, `Open dist/release`, and `Copy summary` available; `Mark reviewed` disabled until the diff has been reviewed. |
| Dirty current package | `Dirty` | The local package/worktree has changes that need review. | `Review diff` is the primary action; other actions remain available if metadata is ready. |
| Diff reviewed | `Reviewed` | The diff has been opened and inspected. | `Mark reviewed` becomes enabled; `Copy summary` should include the reviewed state. |
| Accepted locally | `Accepted` | The current AQ6 package has been acknowledged and is ready for manual validation. | All copy/open actions remain available; `Mark reviewed` becomes a completed state. |
| Metadata still loading | `Loading` | The app has not yet loaded the current package metadata. | `Copy package path`, `Open dist/release`, and `Copy summary` disabled with reasons. |
| Archival-only alias selected | `Archival only` | The selected item is an older alias and must not be treated as the current package. | Acceptance actions disabled; only history/context actions available. |

### State copy rules
- Use `Fresh`, `Dirty`, `Reviewed`, `Accepted`, `Loading`, and `Archival only` exactly where these labels appear.
- Do not rename the current package to `Latest`, `Active`, or `Primary` if the UI already uses `AQ6 current`.
- Do not let an older alias masquerade as the current package.
- Keep state copy short and calm.

## 6. Main components

### 6.1 Package header
- Title: `Worktree Acceptance`
- Eyebrow/boundary line: `Local only · AQ6 is current · Older aliases are archival only`
- Optional compact status chip: `AQ6 current`

### 6.2 Package feed rows
- One row for the current AQ6 package.
- One muted row for archival-only aliases.
- One short history entry for the previous refresh.
- A compact settings entry point at the bottom-left.

### 6.3 Current package detail block
- Exact package filename.
- Exact package path.
- One-line diff summary.
- One-line acceptance note.
- One compact archival-only note.

### 6.4 Action rail
- Button group with the exact labels required by the task.
- Each button either performs a safe local action or explains why it is disabled.
- Disabled reasons should be visible inline, not hidden in a tooltip.

### 6.5 Safety footer
- Keep the local-only boundary visible at all times.
- Use the footer as a reminder, not as a warning wall.

## 7. Empty / loading / error states

### Empty state
When no package metadata is available:
- Show `Loading` in the state chip.
- Replace the current package path with `Current AQ6 package path loading…`
- Disable `Copy package path` and `Open dist/release` with the explanation: `Package metadata is still loading.`
- Keep `Review diff` available if the diff result is ready; otherwise disable it with `Worktree status is still loading.`

### Loading state
When package metadata or worktree status is refreshing:
- Keep the package feed visible so the operator does not lose context.
- Show `Loading` in the acceptance state.
- Keep the AQ6 path placeholder calm and stable.
- Avoid generic spinners where a step label is clearer.

### Error state
When local metadata cannot be resolved:
- Keep the last known safe state visible.
- Show a short error message: `Local package lookup failed — refresh the workspace and try again.`
- Do not imply upload, login, ServiceNow, or external recovery steps.
- Keep disabled buttons explanatory, not silent.

## 8. Button enable / disable logic

### `Review diff`
Enabled when:
- the local worktree status has loaded
- there is a current AQ6 package or diff target

Disabled copy:
- `Worktree status is still loading.`
- `No local changes to review.`

### `Copy package path`
Enabled when:
- the current AQ6 package path is available

Disabled copy:
- `Package metadata is still loading.`
- `No current package path is available yet.`

### `Open dist/release`
Enabled when:
- the current AQ6 package path is available

Disabled copy:
- `Package path is still loading.`
- `No local dist/release folder is available yet.`

### `Mark reviewed`
Enabled when:
- the diff has been reviewed
- the current item is the AQ6 package, not an archival-only alias

Disabled copy:
- `Review the current diff first.`
- `Archival-only aliases cannot be marked reviewed.`

### `Copy summary`
Enabled when:
- current package metadata is available
- the acceptance state is known

Disabled copy:
- `Wait for package metadata.`
- `Nothing current to summarize yet.`

### General rules
- Never hide an important action without explaining the condition.
- Never imply Save / Submit / Update / Resolve / Close exists.
- Disabled reasons must be visible next to the control, not hidden in a tooltip.
- Keep labels literal and stable across the action rail and checklist copy.

## 9. Copy text

### Exact required copy
- `Review diff`
- `Copy package path`
- `Open dist/release`
- `Mark reviewed`
- `Copy summary`
- `Fresh`
- `Dirty`
- `Reviewed`
- `Accepted`
- `Archival only`
- `AQ6 current`
- `Local only`

### Suggested supporting copy
- `Local only · AQ6 is current · Older aliases are archival only`
- `Current package: AQ6 local Windows package`
- `Older aliases are archival only and should not be used as the current package.`
- `Review diff shows the current local changes before acceptance.`
- `Copy package path copies the exact AQ6 package path to the clipboard.`
- `Open dist/release opens the local package folder.`
- `Mark reviewed records that the current diff was inspected.`
- `Copy summary produces a local handoff note for manual validation.`

### Current package path copy
Use the exact current package path from AR1 in the UI copy and checklist:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip
```

### Archival-only copy for older packages
- `rc.1, AF, AG, AH, AI, and AJ are archival-only aliases.`
- `Do not use archival-only aliases as the current package anchor.`
- `The current acceptance surface always points at AQ6.`

### Suggested summary format
`Worktree: {Fresh|Dirty} · Review: {pending|done} · Acceptance: {not yet accepted|accepted} · Package: AQ6 current · Path: {exact AQ6 path}`

### Manual checklist copy
1. Confirm the current package is AQ6 and not an archival-only alias.
2. Confirm the exact package path matches the current AQ6 path shown above.
3. Click `Review diff` and verify the current local changes are visible.
4. Click `Copy package path` and confirm the clipboard contains the exact AQ6 path.
5. Click `Open dist/release` and verify the local package folder opens.
6. Click `Mark reviewed` only after the diff has been inspected.
7. Click `Copy summary` and confirm the summary includes the current AQ6 package and the reviewed state.
8. Confirm older aliases remain archival only and are not presented as the current package.

## 10. Accessibility notes

- Minimum 44px hit targets for all interactive rows and buttons.
- Visible focus ring on every interactive control.
- Keyboard order should flow left column → center column → right rail → settings.
- Disabled buttons must still be readable and explain why they are disabled.
- Use short section headings and avoid dense paragraphs inside cards.
- Keep contrast comfortable in the warm/light theme; avoid pure black or harsh white.
- Make selected states clear with more than color alone.
- Collapsed secondary panels must still expose their label and expansion affordance.
- Do not hide the AQ6/current-vs-archival boundary behind hover-only cues.

## 11. OpenDesign / mockup note

OpenDesign was available during this task and used as the warm editorial framing reference.

GPT Images 2 / `image_generate` attempt:
- Attempted a sanitized three-column worktree acceptance mockup with fake-only data and the AQ6 package anchor.

Result:
- `image_generate` returned `FalClientHTTPError`.
- No raster mockup was successfully generated in this run.

## 12. Implementation handoff for `sna-frontend-workbench`

Implement this spec with the smallest possible UI-only polish pass.

Suggested files to inspect first:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Implementation intent:
- keep the existing shell and behavior intact
- make the acceptance state unmistakable without adding demo clutter
- keep disabled reasons visible and plain-language
- keep the current AQ6 package path explicit in the UI and summary
- keep archival-only aliases clearly demoted
- do not introduce any live ServiceNow write behavior

Acceptance checklist for the implementer:
- warm/light three-column shell is obvious at a glance
- left, center, and right column responsibilities match this spec
- disabled buttons explain why they are disabled
- local actions are exact and explicit
- AQ6 current package path is visible and copyable
- archival-only aliases are visibly archived, not current
- no demo clutter or mode-tab noise appears in the primary UI
- no live ServiceNow actions are added
- no raw sensitive data appears in the UI
