# Phase AQ2 — local repo hygiene archive-demotion UX / copy spec

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. All examples are fake. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Preflight

Goal
- Specify the user-visible cleanup workflow copy and layout for the local repo hygiene card.
- Keep `Cleanup preview` clearly preview-only.
- Add `Archive stale artifacts` as the safe local action for stale items.
- Keep the current item obvious at every step.

Known facts
- This is a local-only repo hygiene surface, not a live ServiceNow surface.
- Cleanup must never imply Save / Submit / Update / Resolve / Close, upload, push, release, or external writes.
- The current task is doc-only; no build gate is required in AQ2.
- Disabled states must explain why the action is unavailable.

Assumptions
- Alan wants a compact, readable workflow, not a large audit wall.
- The user should be able to see the selected item, its cleanup preview, and the archive action in one glance.
- The archive action is a local move into a safe archive area, not deletion.

Ambiguities
- Whether the archive action should be labeled `Archive stale artifacts` or `Archive demotion` in the primary button.
- Whether the preview must be generated before the archive button becomes enabled.
- Whether the current item indicator belongs in the queue row, the detail pane, or both.

Chosen smallest approach
- Use `Cleanup preview` as the preview-only step and `Archive stale artifacts` as the primary safe local action.
- Keep the selected item visually persistent in the queue and mirrored in the center detail pane.
- Use short, plain-language disabled reasons directly below or beside each control.

Files likely affected
- `docs/status/phase-AQ2-local-repo-hygiene-archive-demotion-ux-spec-2026-06-07.md` only in this task.
- Implementation handoff below is for `sna-frontend-workbench` in the next phase.

Verification plan
- Confirm the exact labels appear verbatim: `Pending`, `Closed as N/A`, `Verified`, `Cleanup preview`, `Archive stale artifacts`, `Local only`.
- Confirm `Cleanup preview` reads as preview-only and local-only.
- Confirm `Archive stale artifacts` never sounds like deletion or a ServiceNow write.
- Confirm the current item remains obvious in both queue and detail views.

## 1. Purpose

Turn the stale dist/release cleanup surface into one calm place where Alan can answer, in one glance:

1. Which local item is currently selected?
2. Is it still `Pending`, already `Verified`, or `Closed as N/A`?
3. What exactly does `Cleanup preview` show?
4. What does `Archive stale artifacts` do locally?
5. What boundary keeps this action local-only and non-destructive?

This is not a release dashboard and not a deletion console.
It is a local-only cleanup surface for stale artifacts, preview-only review, and safe archive demotion.

## 2. Research and design references

Public reference patterns used for layout direction:

- Linear: selected-item pattern with a focused detail pane and a clear action rail.
- Claude Code / modern agent workbench patterns: visible work state, compact metadata, and side-by-side review instead of a vertical dump.
- Open Design command-center framing: calm shell, clear selection, and progressive disclosure.

Design takeaways for this task:

- Put the current item in the center of attention.
- Keep the queue short and scannable.
- Make the local-only boundary obvious without turning it into a warning wall.
- Keep all copy short enough to scan comfortably in office lighting.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Local Repo Hygiene + Archive Demotion                                                                    │
│ Local only · No ServiceNow actions · No upload / push / release                                          │
├───────────────────────────────┬──────────────────────────────────────────────┬───────────────────────────┤
│ Left: local scan feed         │ Center: selected cleanup detail               │ Right: local actions      │
│                               │                                              │ + safety                  │
│ [Current] Stale dist/release  │ Selected: Stale dist/release/ artifacts      │ Refresh local scan        │
│ [Verified] .gitignore        │ - current state                              │ Open workspace root       │
│ [Closed as N/A] .local/...   │ - preview summary                            │ Export status markdown    │
│ [History] last local scan    │ - archive meaning                           │ Copy selected summary     │
│ [Settings] local scan prefs   │ - preserved items / counts                   │ Cleanup preview           │
│                               │                                              │ Archive stale artifacts   │
├───────────────────────────────┴──────────────────────────────────────────────┴───────────────────────────┤
│ Footer strip: Local only · disabled actions explain why they are unavailable · human-readable local state │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended behavior:

- Left column is the local scan feed: current item, verified items, closed-as-N/A items, and scan history.
- Center column is the evidence view: selected item, explanation, preview summary, and the exact text Alan should read.
- Right column is the action rail: refresh, open workspace root, export markdown, copy summary, cleanup preview, and archive.
- The footer should keep the local-only boundary visible even when the center item is expanded.

## 4. Column responsibilities

### Left column — scan feed / queue / history
Owns the list of hygiene items and their current state.

It should answer:
- What is selected right now?
- What is still pending cleanup review?
- What is already verified?
- What is closed as N/A because it is local-only / gitignored?
- What did the latest local scan find?

Include:
- current item row with a strong selection state
- verified row
- closed-as-N/A row
- last-scan history summary
- bottom-left settings entry point

Rules:
- Do not turn the feed into a dense audit log.
- Do not hide the current item behind the verified items.
- Keep each row short enough to scan in one pass.
- Preserve selection state visibly with a calm highlight, not just color.

### Center column — selected cleanup detail
Owns the selected item and its explanation.

It should answer:
- What exact item am I looking at?
- Why is it pending, verified, or closed as N/A?
- What does cleanup preview show?
- What archive path or safe destination is implied?
- What text should Alan copy or export?

Include:
- exact item title
- current state chip
- short reason text
- compact evidence summary
- cleanup preview summary
- local-only boundary note

Rules:
- Preserve the order: item → state → reason → preview → next local action.
- Keep the current item visually obvious even while preview data is loading.
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
- `Archive stale artifacts`
- compact safety badge
- disabled-state explanations

Rules:
- The action rail should feel like local maintenance, not release operations.
- `Cleanup preview` is preview-only and copies a local plan to the clipboard.
- `Archive stale artifacts` is the safe local move into the archive area and is never framed as deletion.
- Verified and closed items should show why cleanup preview is unavailable.

## 5. State matrix

| Item state | Visible label | Visible meaning | Action availability |
|---|---|---|---|
| Fresh scan, no selection | `Local only` | The workspace is ready, but no item is selected yet. | `Cleanup preview` and `Archive stale artifacts` disabled with explanation; scan / export / settings available. |
| Current stale item selected | `Pending` | This item needs review before the local archive action. | All core actions available; `Cleanup preview` and `Archive stale artifacts` are the main actions. |
| Verified item selected | `Verified` | Local ignore coverage or cleanup state is already confirmed. | Refresh / open / export / copy summary available; cleanup and archive disabled with explanation. |
| Closed local-only item selected | `Closed as N/A` | The item is local-only / gitignored and does not need follow-up. | Refresh / open / export / copy summary available; cleanup and archive disabled with explanation. |
| Preview ready on current stale item | `Cleanup preview` | A local-only plan has been prepared for review. | `Archive stale artifacts` becomes enabled only after the preview is generated. |
| Archived locally | `Archive stale artifacts` | The stale artifacts were moved to the local archive area and remain visible in history. | History / export / copy summary available; archive is complete. |
| Scan loading | `Refreshing local scan…` | The surface is updating the local state. | Most action buttons disabled until the current scan result is current. |
| Scan error | `Scan failed` | The last known safe state remains visible, but the scan needs attention. | Disable destructive-looking actions; show a short retry reason. |

### State copy rules
- Use only the exact labels `Verified`, `Pending`, `Closed as N/A`, `Cleanup preview`, `Archive stale artifacts`, and `Local only` where those labels are shown to the user.
- Do not rename the pending item to `Open`, `Investigating`, or `Needs review`.
- Do not reopen the closed item; it should stay explicitly closed as N/A.
- Do not describe archive as deletion, purge, or release.

## 6. Main components

### 6.1 Local scan header
- Title: `Local Repo Hygiene + Archive Demotion`
- Eyebrow/boundary line: `Local only · No ServiceNow actions · No upload / push / release`
- Optional compact status chip: `Local only`

### 6.2 Hygiene queue rows
- Three rows only: current / verified / closed-as-N/A.
- The current row must have the strongest selection affordance.
- The current row should stay visible even if the center panel expands.
- The archive-able item should appear as the current item, not as a hidden secondary row.

### 6.3 Evidence summary block
- One short summary sentence for the selected item.
- One optional collapsible evidence detail for counts, preserved items, or scan notes.
- Do not expose raw secrets, ticket IDs, or any remote system identifiers.

### 6.4 Action rail
- Button group with the exact labels required by the task.
- Each button must either perform a safe local action or explain why it is disabled.
- Disabled reasons should be visible inline, not only via tooltip.

### 6.5 Safety footer
- Keep the local-only boundary visible at all times.
- Use the footer as a reminder, not as a warning dialog.

## 7. Empty / loading / error states

### Empty state
When no stale artifacts are found:
- Show `Verified` for `.gitignore` coverage.
- Show `Closed as N/A` for the local-only item.
- Replace the current row with a calm message: `No stale dist/release/ artifacts detected.`
- Disable `Cleanup preview` and `Archive stale artifacts` with the explanation: `No current stale item selected.`

### Loading state
When a local scan is running:
- Keep the queue visible so the operator does not lose context.
- Show `Refreshing local scan…` in the action rail.
- Disable `Cleanup preview` and `Archive stale artifacts` until the scan result is current.

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
- Enabled only for the current stale item.
- Disabled for `Verified`, `Closed as N/A`, and already archived items.
- Disabled reasons:
  - no selection: `Select the stale item to preview cleanup.`
  - verified item: `No cleanup preview is needed for a verified item.`
  - closed item: `This item is closed as N/A.`
  - archived item: `This item is already in the archive.`
- Preview behavior: copies a local-only plan to the clipboard; it does not execute changes.

### `Archive stale artifacts`
- Enabled only after the current stale item has a generated preview.
- Disabled for `Verified`, `Closed as N/A`, and already archived items.
- Disabled reasons:
  - no selection: `Select the stale item first.`
  - verified item: `Only stale items can be archived.`
  - closed item: `This item is closed as N/A.`
  - preview missing: `Generate Cleanup preview first.`
  - archive already complete: `This item is already archived.`
- Action behavior: moves the stale artifact set into the local archive area; it never deletes the item or writes externally.

### General rules
- Never hide an important action without explaining the condition.
- Never imply Save / Submit / Update / Resolve / Close exists.
- Disabled reasons must be visible next to the control, not hidden in a tooltip.
- Keep the labels literal and consistent across the runtime rail and settings help text.

## 9. Copy text

### Exact required copy
- `Verified`
- `Pending`
- `Closed as N/A`
- `Cleanup preview`
- `Archive stale artifacts`
- `Local only`
- `Refresh local scan`
- `Open workspace root`
- `Export status markdown`
- `Copy selected summary`

### Suggested supporting copy
- `Local only · No ServiceNow actions · No upload / push / release`
- `This surface only reports local repository state. Disabled actions explain why they are unavailable.`
- `Selected: Stale dist/release/ artifacts`
- `Cleanup preview copies a local plan to the clipboard only.`
- `Archive stale artifacts moves the selected item into the local archive area.`
- `The current item stays visible in history.`
- `.local/video-analysis/ is local-only and gitignored; no follow-up is required.`

### Item copy
- `.gitignore verification` → `Gitignore coverage confirmed. Remediation is complete.`
- `Stale dist/release/ artifacts` → `Stale build artifacts remain. Cleanup preview is available before archiving.`
- `.local/video-analysis/` → `Directory does not exist; the backlog item is closed as N/A.`

### Confirmation dialog copy
Title:
- `Archive stale artifacts?`

Body:
- `Move the selected stale artifacts into the local archive area.`
- `This is a local, non-destructive move. Nothing is deleted, uploaded, or sent to ServiceNow.`
- `The current item remains visible in history.`

Primary button:
- `Archive stale artifacts`

Secondary button:
- `Cancel`

Success toast:
- `Archived locally. The selected item moved to the archive and remains visible in history.`

## 10. Manual checklist

Short operator checklist:

1. Select the stale item and confirm it is visually obvious in the queue.
2. Open `Cleanup preview` and verify the preview copy says it is local-only and preview-only.
3. Confirm the preview does not imply deletion, upload, or ServiceNow writes.
4. Confirm `Archive stale artifacts` stays disabled until the preview exists.
5. Open the confirmation dialog and verify it says the move is local and non-destructive.
6. Confirm the success toast keeps the current item visible in history.

## 11. Accessibility notes

- Use high-legibility warm-light colors with strong text contrast, not pure black.
- Keep state chips large enough to read at a glance.
- Every disabled button must say why it is disabled.
- Make the selected row obvious with more than color alone, e.g. border + background + text.
- Support keyboard navigation between rows and actions.
- Keep line lengths short enough for comfortable scanning under office lighting.
- Separate `Cleanup preview` and `Archive stale artifacts` visually so their different safety profiles are obvious.

## 12. GPT Images 2 mockup notes

Attempted mockup generation with sanitized fake data only:
- landscape three-column local repo hygiene concept with `Pending`, `Verified`, `Closed as N/A`, `Cleanup preview`, and `Archive stale artifacts`
- portrait action-rail concept with local-only safety copy and inline disabled reasons

Result:
- `image_generate` returned `FalClientHTTPError` on the attempted runs
- no usable raster mockup was produced in this run

## 13. Open Design notes

Open Design content root was available during this task and used as a warm editorial framing reference only.
No project binding was created, and this spec remains the source of truth for the local repo hygiene workflow.

## 14. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented in frontend code, keep the change set surgical and preserve the accepted cleanup story.

Implementation requirements:
1. Preserve the current local-only safety model.
2. Keep the left / center / right responsibilities stable.
3. Keep `Cleanup preview` compact and clearly preview-only.
4. Keep `Archive stale artifacts` explicit, local, and non-destructive.
5. Keep disabled button reasons plain-language and visible.
6. Keep the current stale item prominent when present.
7. Keep closed-as-N/A items visibly closed and local-only.
8. Do not reintroduce demo clutter, mock-provider labels, or always-open debug surfaces.
9. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

## 15. Acceptance criteria

This spec is ready for frontend implementation only when all of the following are true:
- the app presents a warm/light local cleanup workbench
- the left column owns the scan feed, queue, history, and settings entry point
- the center column owns selected cleanup detail, preview summary, archive meaning, and evidence
- the right column owns local actions, cleanup preview, archive action, safety boundary, and recent evidence
- `Cleanup preview` is visible, clearly labeled, and preview-only
- `Archive stale artifacts` is visible, clearly labeled, and clearly local/non-destructive
- `Pending` is used for the stale cleanup candidate
- `Closed as N/A` is used for the local-only / gitignored item
- the current item remains visually obvious in both queue and detail views
- disabled buttons explain why they are disabled
- no real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or raw fingerprints are exposed
- no Save / Submit / Update / Resolve / Close automation is introduced
- no mock/demo clutter reappears in the primary UI
