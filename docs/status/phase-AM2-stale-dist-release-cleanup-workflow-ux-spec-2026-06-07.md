# Phase AM2 — stale dist/release cleanup workflow UX / copy spec

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Scope: local-only cleanup workflow, archive demotion, and preview copy

## 0. Preflight

Goal
- Turn the stale dist/release cleanup workflow into a precise, operator-safe UX/copy spec for the desktop workbench.
- Keep copy local-only and explicit about `Pending` vs `Closed as N/A` vs `Archive demotion` vs `Cleanup preview`.
- Make every disabled control explain why it is unavailable.

Known facts
- The workbench is a local operator surface, not a ServiceNow write surface.
- AM1 established the cleanup scope: stale packages are not deleted; they are archive-demoted into `dist/.release-archive/` instead.
- `Cleanup preview` is clipboard-only / preview-only; it does not execute cleanup.
- This task must not expose secrets, real URLs, ticket IDs, sys_ids, requesters, assignment groups, cookies, storage state, HAR, traces, screenshots, or raw logs.

Assumptions
- Alan wants one calm, readable cleanup surface, not a large audit wall.
- The selected stale item should remain visible while preview / demotion is reviewed.
- Archive demotion is a local filesystem action, not a release or deployment action.

Ambiguities
- Whether `Archive demotion` should appear as a row state, an outcome badge, or a primary action label.
- Whether `Cleanup preview` should copy text only, or also open a local modal that mirrors the clipboard content.
- Whether the left feed should include a verified baseline item in addition to the stale package candidate.

Chosen smallest approach
- Keep the three-item hygiene model and add only the labels needed for the cleanup story.
- Use progressive disclosure: one selected item, one compact evidence area, and one local-only action rail.
- Treat `Archive demotion` as the safe destination/result for stale release artifacts, while `Cleanup preview` remains preview-only.

Files likely affected
- `docs/status/phase-AM2-stale-dist-release-cleanup-workflow-ux-spec-2026-06-07.md` only for this task.
- Implementation handoff points below are for `sna-frontend-workbench` in the next phase.

Verification plan
- Confirm the exact labels appear verbatim: `Pending`, `Closed as N/A`, `Archive demotion`, `Cleanup preview`, `Local only`.
- Confirm `Cleanup preview` is clearly preview-only and local-only.
- Confirm `Archive demotion` never sounds like deletion or release.
- Confirm no copy implies real ServiceNow actions, upload, or write behavior.

## 1. Purpose

Turn the stale dist/release cleanup surface into one visible place where Alan can answer, in one glance:

1. Which local item is still pending cleanup review?
2. Which item is closed as N/A because it is local-only / gitignored?
3. What exactly does archive demotion mean for the stale package?
4. What does cleanup preview show, and why is it safe?
5. What boundary keeps this surface local-only and operator-safe?

This is not a release dashboard and not a deletion console.
It is a calm local-only cleanup surface for stale release artifacts, archive demotion, and preview-only copy.

## 2. Research and design references

Public reference patterns used for layout direction:

- Claude Code desktop: task-oriented workbench, visible work state, compact action clusters.
- Linear: selected-item pattern with an adjacent detail pane and a clear action rail.
- Open Design command-center framing: visible current item, compact metadata, and no vertical card dump.
- Existing project warm-light operator shell: calm surfaces, explicit safety copy, and first-class settings.

Design takeaways for this task:

- Put the selected stale item in the center and keep the queue short.
- Make the local boundary obvious without turning it into a warning wall.
- Show the scan state, the evidence, and the local action in that order.
- Keep all copy short enough to scan comfortably in office lighting.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Local Repo Hygiene + Archive Demotion                                                                    │
│ Local only · No ServiceNow actions · No upload / PR / merge / tag / release                              │
├───────────────────────────────┬──────────────────────────────────────────────┬───────────────────────────┤
│ Left: local scan feed         │ Center: selected cleanup detail               │ Right: local actions      │
│                               │                                              │ + safety                  │
│ [Verified] .gitignore         │ Selected: Stale dist/release/ artifacts      │ Refresh local scan        │
│ [Pending] dist/release/       │ - current state                              │ Open workspace root       │
│ [Closed as N/A] .local/...    │ - archive demotion meaning                   │ Export status markdown    │
│ [History] last local scan     │ - cleanup preview summary                    │ Copy selected summary     │
│ [Settings] local scan prefs   │ - evidence / counts / preserved items        │ Cleanup preview           │
│                               │                                              │ Archive demotion          │
├───────────────────────────────┴──────────────────────────────────────────────┴───────────────────────────┤
│ Footer strip: Local only · disabled actions explain why they are unavailable · human-readable local state │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended behavior:

- Left column is the local scan feed: verified items, pending cleanup, closed-as-N/A items, and scan history.
- Center column is the evidence view: selected item, explanation, and the exact summary Alan should read.
- Right column is the action rail: refresh, open workspace root, export markdown, copy summary, cleanup preview, and archive demotion.
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

### Center column — selected cleanup detail
Owns the selected item and its explanation.

It should answer:
- What exact item am I looking at?
- Why is it pending, closed as N/A, or eligible for archive demotion?
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
- `Archive demotion`
- compact safety badge
- disabled-state explanations

Rules:
- The action rail should feel like local maintenance, not release operations.
- `Cleanup preview` is preview-only and copies a local plan to the clipboard.
- `Archive demotion` is the safe local move into `dist/.release-archive/` and is never framed as deletion.
- Verified and closed items should show why cleanup preview is unavailable.

## 5. State matrix

| Item | State label | Visible meaning | Action availability |
|---|---|---|---|
| `.gitignore verification` | `Verified` | Local ignore coverage is confirmed and no action is required. | Refresh / open / export / copy summary available; `Cleanup preview` and `Archive demotion` disabled with explanation. |
| `Stale dist/release/ artifacts` | `Pending` | Local cleanup candidate remains and should be reviewed before archive demotion. | All actions available; `Cleanup preview` and `Archive demotion` are the main actions. |
| `.local/video-analysis/` | `Closed as N/A` | Item is local-only / gitignored and does not need follow-up. | Refresh / open / export / copy summary available; `Cleanup preview` and `Archive demotion` disabled with explanation. |
| `Stale dist/release/ artifacts` after action | `Archive demotion` | The stale package has been moved into `dist/.release-archive/`; it is no longer in the active release surface. | History / export / copy summary available; cleanup preview may remain for reference, but the primary action is complete. |

### State copy rules
- Use only the exact labels `Verified`, `Pending`, `Closed as N/A`, `Archive demotion`, `Cleanup preview`, and `Local only`.
- Do not rename the pending item to “Open”, “Investigating”, or “Needs review”.
- Do not reopen the closed item; it should stay explicitly closed as N/A.
- Do not describe archive demotion as deletion, purge, or release.

## 6. Main components

### 6.1 Local scan header
- Title: `Local Repo Hygiene + Archive Demotion`
- Eyebrow/boundary line: `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`
- Optional compact status chip: `Local only`

### 6.2 Hygiene queue rows
- Three rows only: verified, pending, closed-as-N/A.
- The pending row may include a subtle highlight so it is the current focus.
- The archive-demoted item should appear in history or evidence, not as a separate noisy queue block.

### 6.3 Evidence summary block
- One short summary sentence for the selected item.
- One optional collapsible evidence detail for counts, preserved items, or scan notes.
- Do not expose raw secrets, ticket IDs, or any remote system identifiers.

### 6.4 Action rail
- Button group with the exact labels required by the task.
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
- Disable `Cleanup preview` and `Archive demotion` with the explanation: `No cleanup candidate selected.`

### Loading state
When a local scan is running:
- Queue rows should stay visible so the operator does not lose context.
- Show `Refreshing local scan…` in the action rail.
- Disable `Cleanup preview` and `Archive demotion` until the scan result is current.

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
- Disabled for `Verified`, `Closed as N/A`, and already `Archive demotion` items.
- Disabled reasons:
  - Verified item: `No cleanup is needed for a verified item.`
  - Closed item: `This item is closed as N/A.`
  - No selection: `Select the stale dist/release/ item to preview cleanup.`
- Preview behavior: copies a local-only plan to the clipboard; it does not execute changes.

### `Archive demotion`
- Enabled only for the pending `dist/release/` item after review.
- Disabled for `Verified`, `Closed as N/A`, and already archive-demoted items.
- Disabled reasons:
  - Verified item: `No archive demotion is needed for a verified item.`
  - Closed item: `This item is closed as N/A.`
  - No selection: `Select the stale dist/release/ item to archive-demote.`
- Action behavior: moves the stale package into `dist/.release-archive/` locally; it never deletes the item.

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
- `Archive demotion`
- `Cleanup preview`
- `Local only`
- `Refresh local scan`
- `Open workspace root`
- `Export status markdown`
- `Copy selected summary`

### Suggested supporting copy
- `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`
- `This surface only reports local repository state. Disabled actions explain why they are unavailable.`
- `Selected: Stale dist/release/ artifacts`
- `Cleanup preview copies a local plan to the clipboard only.`
- `Archive demotion moves the stale package into dist/.release-archive/.`
- `.local/video-analysis/ is local-only and gitignored; no follow-up is required.`

### Item copy
- `.gitignore verification` → `codegraph/ and worktrees/ gitignore coverage confirmed. Remediation is complete.`
- `Stale dist/release/ artifacts` → `Stale build artifacts remain. Cleanup preview is available before archive demotion.`
- `.local/video-analysis/` → `Directory does not exist; the backlog item is closed as N/A.`

## 10. Accessibility notes

- Use high-legibility warm-light colors with strong text contrast, not pure black.
- Keep state chips large enough to read at a glance.
- Every disabled button must say why it is disabled.
- Make the selected row obvious with more than color alone, e.g. border + background + text.
- Support keyboard navigation between rows and actions.
- Keep line lengths short enough for comfortable scanning under office lighting.
- Avoid visual clutter that would make the pending row hard to distinguish.
- Keep the cleanup preview and archive demotion actions separated visually so their different safety profiles are obvious.

## 11. GPT Images 2 mockup notes

Attempted mockup generation with sanitized fake data only:
- landscape three-column cleanup concept with `Pending`, `Closed as N/A`, `Archive demotion`, and `Cleanup preview`
- portrait right-rail action concept with local-only safety copy

Result:
- both `image_generate` attempts returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

## 12. Open Design notes

The project already has an OpenDesign binding:
- design system: `claude`
- template: `web-prototype-taste-editorial`

That binding was used as a warm editorial reference point only. This spec remains the source of truth for ServiceNow Automation implementation decisions.

## 13. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented in frontend code, keep the change set surgical and preserve the accepted cleanup story.

Implementation requirements:
1. Preserve the current local-only safety model.
2. Keep settings first-class and visible.
3. Keep the left / center / right responsibilities stable.
4. Keep the cleanup preview compact and clipboard-only.
5. Keep archive demotion explicit, local, and non-destructive.
6. Keep disabled button reasons plain-language and visible.
7. Keep the stale `dist/release/` candidate prominent when present.
8. Keep `Closed as N/A` items visibly closed and local-only.
9. Do not reintroduce demo clutter, mock-provider labels, or always-open debug surfaces.
10. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

## 14. Acceptance criteria

This spec is ready for frontend implementation only when all of the following are true:
- the app presents a warm/light three-column local cleanup workbench
- the left column owns source, queue, todo, history, mode/function switching, and bottom-left settings
- the center column owns selected cleanup detail, preview summary, archive demotion meaning, and evidence
- the right column owns local actions, cleanup preview, archive demotion, safety boundary, environment controls, and recent evidence
- `Cleanup preview` is visible, clearly labeled, and preview-only
- `Archive demotion` is visible, clearly labeled, and clearly local/non-destructive
- `Pending` is used for the stale cleanup candidate
- `Closed as N/A` is used for the local-only / gitignored item
- disabled buttons explain why they are disabled
- settings remain first-class and editable for local scan preferences
- no real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or raw fingerprints are exposed
- no Save / Submit / Update / Resolve / Close automation is introduced
- no mock/demo clutter reappears in the primary UI
