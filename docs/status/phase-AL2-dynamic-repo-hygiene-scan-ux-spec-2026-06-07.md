# Phase AL2 — UX / copy spec: dynamic repo hygiene scan

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Scope: local-only repo-hygiene / artifact-boundary surface

## 0. Preflight

Goal
- Define the exact copy, micro-layout, and local-action behavior for the dynamic repo-hygiene / artifact-boundary surface.
- Keep the current local-only hygiene items visible in one glance: `.gitignore` verification, stale `dist/release/` artifacts, and `.local/video-analysis/` closure.
- Preserve the local-only boundary copy and ensure every disabled control explains why it is disabled.

Known facts
- AG3 already rendered the repo-hygiene card, but its data is hardcoded and the right rail still lacks the live refresh/export actions.
- The panel should stay calm, compact, and local-only — no ServiceNow, no upload, no release, no repo-wide write actions beyond local cleanup/export.
- The current workbench already has the hygiene card and the worktree acceptance card; this spec is only about improving the hygiene side of the local operator surface.
- Public design cues used for this spec: Claude Code desktop’s side-by-side task surface and Linear’s command-center issue/detail layout.
- Open Design was available as a design substrate reference; this task uses its command-center framing, not a new brand system.

Assumptions
- Alan wants the local scan summary to read like an operator workbench, not a status wall.
- The panel should expose the current selection, not every historical detail at once.
- Local actions should stay local: filesystem / clipboard / markdown export only.
- Cleanup preview is only useful when the stale `dist/release/` item is selected.

Ambiguities
- Whether the live scan refresh runs on demand only or also on workspace focus.
- Whether “Open workspace root” launches the OS file manager or a specific editor folder view.
- Whether the export action should write a file immediately or open a save dialog first.

Chosen smallest approach
- Keep the current three-item hygiene model and make it dynamic, not broader.
- Use progressive disclosure: one selected item, one compact evidence area, one local-only action rail.
- Preserve the exact state labels and boundary copy required by the task.
- Make disabled states self-explaining rather than hiding actions.

Files likely affected
- `docs/status/phase-AL2-dynamic-repo-hygiene-scan-ux-spec-2026-06-07.md` only for this task.
- Implementation handoff points below are for `sna-frontend-workbench` in the next phase.

Verification plan
- Check that the exact required labels appear verbatim: `Verified`, `Pending`, `Closed as N/A`, `Local only`, `Refresh local scan`, `Open workspace root`, `Export status markdown`, `Copy selected summary`, `Cleanup preview`.
- Check that `Cleanup preview` is disabled or explanatory for verified/closed items and only useful for the stale `dist/release/` item.
- Check that `.local/video-analysis/` is explicitly closed as N/A and described as local-only / gitignored.
- Check that no copy implies ServiceNow login, browser automation, upload, or write actions.

## 1. Purpose

Turn the repo-hygiene surface into one visible place where Alan can answer, in one glance:

1. What local hygiene items are already verified?
2. Which item is still pending and worth cleaning up?
3. Which item is closed as N/A because it is local-only / gitignored?
4. What local actions are safe to take right now?
5. What boundary copy prevents this from feeling like a release or ServiceNow surface?

This is not a release dashboard and not a live ServiceNow control panel.
It is a calm local-only scan surface for repository hygiene and artifact boundary clarity.

## 2. Research and design references

Public reference patterns used for layout direction:

- Claude Code desktop: a task-oriented desktop surface with visible work state, side-by-side review, and compact action clusters.
- Linear: left navigation plus focused issue/detail pane plus action rail, with a strong selected-item pattern.
- Open Design command-center framing: visible current item, compact metadata, and no vertical card dump.

Design takeaways for this task:

- Put the selected hygiene item in the center and keep the queue short.
- Make the local boundary obvious without turning it into a warning wall.
- Show the scan state, the evidence, and the local action in that order.
- Keep all copy short enough to scan comfortably in bright office lighting.

## 3. Layout wireframe in text

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Local Repo Hygiene + Artifact Boundary                                                                     │
│ Local only · No ServiceNow actions · No upload / PR / merge / tag / release                                │
├───────────────────────────────┬──────────────────────────────────────────────┬─────────────────────────────┤
│ Left: local scan feed         │ Center: selected hygiene detail              │ Right: local actions        │
│                               │                                              │ + safety                    │
│ [Verified] .gitignore         │ Selected: Stale dist/release/ artifacts      │ Refresh local scan          │
│ [Pending] dist/release/       │ - current state                              │ Open workspace root         │
│ [Closed as N/A] .local/...    │ - why it is pending                          │ Export status markdown      │
│ [History] last local scan     │ - cleanup preview summary                    │ Copy selected summary       │
│ [Settings] local scan prefs   │ - evidence / counts / preserved items        │ Cleanup preview             │
│                               │                                              │ (disabled when not relevant) │
├───────────────────────────────┴──────────────────────────────────────────────┴─────────────────────────────┤
│ Footer strip: Local only · disabled actions explain why they are unavailable · human-readable local state  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended behavior:

- Left column is the local scan feed: verified items, pending cleanup, closed-as-N/A items, and scan history.
- Center column is the evidence view: selected item, explanation, and the exact summary Alan should read.
- Right column is the action rail: refresh, open workspace root, export markdown, copy summary, and cleanup preview.
- The footer should keep the local-only boundary visible even when the center item is expanded.

## 4. Column responsibilities

### Left column — scan feed / queue / history
Owns the list of hygiene items and their current state.

It should answer:
- What is verified?
- What is still pending?
- What is closed as N/A?
- What did the latest local scan find?
- Where do I adjust local scan preferences?

Include:
- `.gitignore` verification item
- stale `dist/release/` cleanup candidate
- `.local/video-analysis/` closed-as-N/A item
- last scan history summary
- bottom-left settings entry point

Rules:
- Do not turn the feed into a dense audit log.
- Do not hide the pending item behind the verified items.
- Keep each row short enough to scan in one pass.

### Center column — selected hygiene detail
Owns the selected item and its explanation.

It should answer:
- What exact item am I looking at?
- Why is it verified, pending, or closed as N/A?
- What is the cleanup preview, if any?
- What evidence supports the current state?
- What text should Alan copy or export?

Include:
- exact item title
- current state chip
- short reason text
- compact evidence summary
- copied-selected-summary text
- local-only boundary note

Rules:
- The selected item must be visually obvious.
- Preserve the order: item → state → reason → evidence → next local action.
- Avoid a wall of raw paths or full scan logs.
- Keep the closed-as-N/A item explicitly local-only / gitignored.

### Right column — local actions and safety boundary
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

## 5. State matrix

| Item | State label | Visible meaning | Action availability |
|---|---|---|---|
| `.gitignore verification` | `Verified` | Local ignore coverage is confirmed and no action is required. | Refresh / open / export / copy summary available; `Cleanup preview` disabled with explanation. |
| `Stale dist/release/ artifacts` | `Pending` | Local cleanup candidate remains and should be reviewed before removal. | All actions available; `Cleanup preview` enabled and focused on this item. |
| `.local/video-analysis/` | `Closed as N/A` | Item is local-only / gitignored and does not need follow-up. | Refresh / open / export / copy summary available; `Cleanup preview` disabled with explanation. |

### State copy rules
- Use only the exact labels `Verified`, `Pending`, and `Closed as N/A`.
- Do not rename the pending item to “Open”, “Investigating”, or “Needs review”.
- Do not reopen the closed item; it should stay explicitly closed as N/A.

## 6. Main components

### 6.1 Local scan header
- Title: `Local Repo Hygiene + Artifact Boundary`
- Eyebrow/boundary line: `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`
- Optional compact status chip: `Local only`

### 6.2 Hygiene queue rows
- Three rows only: verified, pending, closed-as-N/A.
- Each row should have a short label, a one-line reason, and a visible state chip.
- The pending row may include a subtle highlight so it is the current focus.

### 6.3 Evidence summary block
- One short summary sentence for the selected item.
- One optional collapsible evidence detail for counts, preserved items, or scan notes.
- Do not expose raw secrets, ticket IDs, or any remote system identifiers.

### 6.4 Action rail
- Button group with the five exact labels required by the task.
- Each button must either perform a safe local action or explain why it is disabled.
- Disabled buttons should show the reason inline, not only via tooltip.

### 6.5 Safety footer
- Keep the local-only boundary visible at all times.
- Use the footer as a reminder, not as a warning dialog.

## 7. Empty / loading / error states

### Empty state
When no stale artifacts are found:
- Show `Verified` for `.gitignore` coverage.
- Show `Closed as N/A` for `.local/video-analysis/`.
- Replace the pending row with a calm message: `No stale dist/release/ artifacts detected.`
- Disable `Cleanup preview` with the explanation: `No cleanup candidate selected.`

### Loading state
When a local scan is running:
- Queue rows should stay visible so the operator does not lose context.
- Show `Refreshing local scan…` in the action rail.
- Disable `Cleanup preview` until the scan result is current.

### Error state
When the local scan fails:
- Keep the last known state visible.
- Show a short error message: `Local scan failed — check the workspace path and refresh again.`
- Do not imply upload, login, or ServiceNow recovery steps.
- Keep disabled buttons explanatory, not silent.

## 8. Button enable / disable logic

### `Refresh local scan`
- Enabled when the app can read the local workspace.
- Disabled only if the workspace root is unavailable.
- Disabled reason: `Workspace root unavailable.`

### `Open workspace root`
- Enabled when a workspace root is configured.
- Disabled reason: `No local workspace root configured.`

### `Export status markdown`
- Enabled when the current scan has at least one item.
- Disabled reason: `Nothing to export yet.`
- Export should stay local and write only the status summary.

### `Copy selected summary`
- Enabled when a row is selected.
- Disabled reason: `Select a hygiene item first.`

### `Cleanup preview`
- Enabled only for the pending `dist/release/` item.
- Disabled for `Verified` and `Closed as N/A` items.
- Disabled reasons:
  - Verified item: `No cleanup is needed for a verified item.`
  - Closed item: `This item is closed as N/A.`
  - No selection: `Select the stale dist/release/ item to preview cleanup.`
- The preview should only describe the stale `dist/release/` cleanup candidate and should not promise a repo-wide delete.

## 9. Copy text

### Exact required copy
- `Verified`
- `Pending`
- `Closed as N/A`
- `Local only`
- `Refresh local scan`
- `Open workspace root`
- `Export status markdown`
- `Copy selected summary`
- `Cleanup preview`

### Suggested supporting copy
- `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`
- `This surface only reports local repository state. Disabled actions explain why they are unavailable.`
- `Selected: Stale dist/release/ artifacts`
- `Cleanup preview available for the stale local artifact candidate only.`
- `.local/video-analysis/ is local-only and gitignored; no follow-up is required.`

### Item copy
- `.gitignore verification` → `codegraph/ and worktrees/ gitignore coverage confirmed. Remediation is complete.`
- `Stale dist/release/ artifacts` → `Stale ab, ad, ae build artifacts remain. Cleanup preview available.`
- `.local/video-analysis/` → `Directory does not exist; the backlog item is closed as N/A.`

## 10. Accessibility notes

- Use high-legibility warm-light colors with strong text contrast, not pure black.
- Keep state chips large enough to read at a glance.
- Every disabled button must say why it is disabled.
- Make the selected row obvious with more than color alone, e.g. border + background + text.
- Support keyboard navigation between rows and actions.
- Keep line lengths short enough for comfortable scanning under office lighting.
- Avoid visual clutter that would make the pending row hard to distinguish.

## 11. GPT Images 2 mockups

Attempted mockups:
- Warm-light three-column operator workbench, sanitized fake content, left queue / center detail / right actions.
- Alternative warm-light command-center variant with compact safety state and disabled-action explanations.

Result:
- The image generation backend returned `FalClientHTTPError` for both attempts.
- No image artifact was produced in this run.

## 12. Implementation handoff for `sna-frontend-workbench`

This spec should be implemented as a small, surgical local-surface update.

Likely implementation steps:
1. Replace any hardcoded hygiene state with live local scan state.
2. Keep the three-item model and the exact state labels.
3. Wire the five action labels into the right rail with explicit disabled reasons.
4. Preserve the `Local only` boundary copy in the footer and eyebrow.
5. Add/adjust tests for state labels, action enablement, and cleanup-preview restrictions.
6. Run the required gates before QA handoff.

Likely files for the next phase:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Non-goals for the next phase:
- No ServiceNow write actions.
- No upload, PR, merge, tag, or release behaviors.
- No cron changes.
- No raw secrets, URLs, ticket IDs, or storage state in UI or logs.

Acceptance intent for the next phase:
- Alan can glance once and understand what is verified, pending, and closed as N/A.
- `Cleanup preview` only points at stale `dist/release/` artifacts.
- Every disabled action explains itself.
- The panel still feels like a calm local operator workbench.
