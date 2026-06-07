# Phase BJ2 — stale `dist/release/` cleanup workflow UX / copy spec

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. All examples are fake or local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, requester names, assignment groups, or customer data.

## 0. Preflight

Goal
- Turn the stale `dist/release/` cleanup workflow into a calm, exact UX/copy spec.
- Keep the current manual-validation package clearly anchored on BI6.
- Make archive-demotion feel safe, recoverable, and obviously local.

Known facts
- BI6 remains the current manual-validation package; the exact UNC path is documented in BI7.
- Archive-demotion is local filesystem work only; no deletion language should be used.
- The cleanup preview is read-only / dry-run only.
- The archive destination must be shown as `dist/.release-archive/<phase>/`.
- After archive, the UI should re-scan and show a clean post-archive state.

Assumptions
- Alan wants one compact cleanup surface, not a large audit wall.
- The current package should stay visually separate from archival items.
- The confirmation dialog should speak in local, recovery-safe language.

Ambiguities
- Whether the archive destination should be shown in the action label or only in the confirmation dialog.
- Whether the post-archive state should keep the last dry-run evidence collapsed or clear it.

Chosen smallest approach
- Reuse the existing three-column operator-workbench shell.
- Keep the left side for scan/feed/history, the center for selected-package detail, and the right side for runtime actions + safety.
- Add only the copy and layout needed for cleanup preview, archive demotion, and the clean post-archive rescan.

Files likely affected
- `docs/status/phase-BJ2-stale-dist-release-cleanup-workflow-and-archive-demotion-ux-spec-2026-06-07.md` (this task)
- `sna-frontend-workbench` implementation files in the next phase, after approval

Verification plan
- Confirm the current package is visually separated from archival items.
- Confirm `Cleanup preview` is read-only and clearly labeled as such.
- Confirm `Archive stale artifacts` is local-only and recoverable.
- Confirm the confirmation dialog states exact counts and the archive destination.
- Confirm the empty post-archive state says there are no stale artifacts.
- Confirm no copy implies live ServiceNow, upload, release, or publish actions.

## 1. Purpose

Define the exact local-only copy and layout for the stale release-artifact cleanup workflow.

This spec answers:

1. What is the current package?
2. What items are stale and eligible for archive-demotion?
3. What does the dry-run preview show?
4. What does `Archive stale artifacts` do?
5. How does the UI prove the operation is local and recoverable?

Non-goals:
- no live ServiceNow login, browsing, API write, Save / Submit / Update / Resolve / Close
- no attachment upload
- no Microsoft Graph / Excel Web write
- no push, PR, merge, tag, GitHub Release, publish, or cron changes
- no deletion language in the user-facing flow
- no changes outside local artifact directories

## 2. Research and design references

Public patterns used for layout direction:

- Linear: selected item + adjacent detail pane + clear action rail.
- Claude-style warm editorial surfaces: calm off-white canvas, readable hierarchy, low-noise cards.
- Open Design command-center framing: stable zones, compact status, no vertical card dump.
- Existing operator-workbench pattern in this repo: three-column shell with progressive disclosure.

Design takeaways:

- Keep the current item pinned and obvious.
- Separate the working set from archival items.
- Put readiness and disabled reasons next to the action, not in a log wall.
- Use warm, neutral visual language rather than warning-heavy chromatic UI.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Local Repo Hygiene + Archive Demotion                                                                    │
│ Local only · No ServiceNow actions · No upload / PR / merge / tag / release                              │
├───────────────────────────────┬──────────────────────────────────────────────┬───────────────────────────┤
│ Left: scan feed / history     │ Center: current package / cleanup detail     │ Right: actions + safety   │
│                               │                                              │                           │
│ [Current] BI6 package         │ Current package                               │ Refresh local scan        │
│ [Pending] stale dist/release/ │ - exact BI6 current package path             │ Cleanup preview           │
│ [History] last scan result    │ - current package stays separate              │ Archive stale artifacts   │
│ [Settings] local preferences   │                                              │                          │
│                               │ Stale artifacts                               │ Archive destination       │
│                               │ - grouped by phase                            │ dist/.release-archive/    │
│                               │ - archival items only                         │ <phase>/                  │
│                               │                                              │                          │
│                               │ Cleanup preview (read-only)                   │ Recent evidence            │
│                               │ - dry-run list                                │ - last local scan          │
│                               │ - counts / size                               │ - post-archive rescan      │
│                               │                                              │                          │
│                               │ Post-archive state                            │ Safety boundary            │
│                               │ - clean rescan                                │ Local only · recoverable   │
└───────────────────────────────┴──────────────────────────────────────────────┴───────────────────────────┘
```

Recommended behavior:

- Left column owns the local scan feed, current-package anchor, and history.
- Center column owns the selected package detail, the dry-run preview, and the archive explanation.
- Right column owns the local action rail, archive destination reminder, and the compact safety boundary.
- The current package card and archival items must never look interchangeable.

## 4. Column responsibilities

### Left column — scan feed / queue / history
Owns the local inventory and the current-state snapshot.

It should answer:
- What is the current BI6 package?
- What is pending cleanup review?
- What did the last local scan find?
- Where are local preferences?

Include:
- current package anchor card
- stale cleanup candidate card
- history summary
- bottom-left settings entry

Rules:
- keep the feed short and glanceable
- do not turn it into a dense audit log
- do not bury the current package below archival items

### Center column — selected cleanup detail
Owns the selected current package and the cleanup explanation.

It should answer:
- What exact package is current?
- Which files are stale?
- What does the dry-run preview show?
- What will move if I confirm archive-demotion?
- What remains recoverable locally after the move?

Include:
- current package detail
- stale-artifact group list
- cleanup preview block
- archive-demotion explanation
- post-archive rescan state

Rules:
- keep the current package visually separate from archival items
- preview must be clearly read-only
- never label the action as delete, purge, or release

### Right column — local actions and safety boundary
Owns the local-only action set and the explicit safety copy.

It should answer:
- What can I do right now?
- Is the action enabled, loading, or disabled?
- Why is it disabled?
- Where do stale artifacts move?

Include:
- `Refresh local scan`
- `Cleanup preview`
- `Archive stale artifacts`
- archive destination reminder
- compact safety badge
- recent run evidence

Rules:
- the action rail should feel like local maintenance, not release operations
- `Cleanup preview` is read-only
- `Archive stale artifacts` is the safe local move into `dist/.release-archive/<phase>/`
- disabled buttons must explain why in one short sentence

## 5. State matrix

| State | Current package | Cleanup preview | Archive stale artifacts | Post-archive scan |
|---|---|---|---|---|
| Loading local scan | current package remains visible if already known | disabled with reason | disabled with reason | not yet available |
| Preview ready | BI6 current package clearly shown | dry-run list visible | enabled when stale items exist | pending |
| Confirm dialog open | current package still visible | preview still visible in background | confirmation requires action | pending |
| Archive in progress | current package remains separate | preview locked or dimmed | busy state with exact counts | pending |
| Archive complete | current package remains current | old preview may collapse into history | complete | clean rescan visible |
| No stale artifacts | current package remains current | empty-state copy visible | disabled with reason | clean state visible |
| Scan error | last known current package stays visible | last known preview can remain | disabled with reason | stale until refreshed |

### State copy rules
- Use `Cleanup preview` only for the read-only dry-run.
- Use `Archive stale artifacts` only for the local move into archive.
- Use `No stale artifacts` for the clean post-archive state.
- Keep the current package separate from archival items in every state.

## 6. Main components

### 6.1 Header / boundary line
- Title: `Local Repo Hygiene + Archive Demotion`
- Boundary line: `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`
- Optional status chip: `Local only`

### 6.2 Current package card
- Title: `Current package (BI6)`
- Helper text: `The current manual-validation package stays separate from archival items.`
- Value line: exact BI6 UNC path from BI7
- Supporting note: `This is the only package that should stay in the active release surface.`

### 6.3 Stale-artifacts group
- Title: `Stale artifacts`
- Helper text: `Older packages are archival only.`
- Rows should show phase, package count, and file count.
- Archival rows should be visually muted relative to the current package card.

### 6.4 Cleanup preview block
- Title: `Cleanup preview (read-only)`
- Helper text: `This is a dry run. Nothing moves until you confirm.`
- Show exact counts for packages and files.
- Show total size if available.
- Show the archive destination before confirmation.

### 6.5 Archive-demotion action block
- Title: `Archive stale artifacts`
- Helper text: Moves stale files locally into dist/.release-archive/<phase>/.
- Should never use delete/purge/release language.
- Button should be visually calm, not red, and should not imply a destructive release action.

### 6.6 Safety footer / status
- Keep the local-only boundary visible at all times.
- Use the footer as a reminder, not as a warning wall.
- Keep the safety copy short and specific.

## 7. Empty / loading / error states

### Empty state
When no stale artifacts are found:
- keep the current package card visible
- show `No stale artifacts.` in the center column
- disable `Cleanup preview` and `Archive stale artifacts`
- use the disabled reason: `No stale items selected.`

### Loading state
When a local scan is running:
- keep the current package visible
- show `Refreshing local scan…`
- disable both action buttons until the scan completes
- use the disabled reason: `Scan still running.`

### Preview state
When a dry-run exists:
- show the exact count of packages/files that will move
- show `Recoverable locally` in the confirmation copy
- keep the archive destination visible as `dist/.release-archive/<phase>/`

### Archive-complete state
After archive and rescan:
- show `No stale artifacts.`
- keep the current BI6 package visible
- collapse the archive evidence into history unless the operator re-opens it
- do not show any delete-style completion message

### Error state
When the local scan or archive move fails:
- keep the last known current package visible
- show a short failure line: `Local cleanup failed — refresh the scan and try again.`
- keep disabled buttons explanatory, not silent
- do not imply upload, ServiceNow, or release recovery steps

## 8. Button enable / disable logic

### `Refresh local scan`
- Enabled when the app can read the local workspace.
- Disabled reason: `Workspace root unavailable.`

### `Cleanup preview`
- Enabled only when stale artifacts are detected and a current package is known.
- Disabled reason: `No stale items selected.`
- Disabled reason: `Scan still running.`

### `Archive stale artifacts`
- Enabled only after a fresh dry-run preview exists.
- Disabled reason: `Run Cleanup preview first.`
- Disabled reason: `No stale artifacts found.`
- Disabled reason: `Archive already complete.`

### General rules
- Disabled text should be short, plain, and specific.
- Never use generic `unavailable` copy if a local reason is available.
- Never frame the archive action as release, publish, or deletion.

## 9. Exact copy

### Header copy
- `Local only · No ServiceNow actions · No upload / PR / merge / tag / release`

### Current package copy
- `Current package (BI6)`
- `The current manual-validation package stays separate from archival items.`
- `This is the only package that should stay in the active release surface.`

### Preview copy
- `Cleanup preview (read-only)`
- `This is a dry run. Nothing moves until you confirm.`
- `Recoverable locally`

### Archive copy
- `Archive stale artifacts`
- `Moves stale files locally into dist/.release-archive/<phase>/.`
- `Confirm archive of [N] packages and [M] files?`
- `This is local and recoverable.`

### Post-archive copy
- `Archived locally.`
- `No stale artifacts.`
- `Re-scanned after archive.`

### Disabled reasons
- `No stale items selected.`
- `Scan still running.`
- `Run Cleanup preview first.`
- `Workspace root unavailable.`
- `No stale artifacts found.`

## 10. Accessibility notes

- Use large click targets for the preview and archive buttons.
- Keep the current package and archival items separated by more than color alone; use section headers and spacing.
- Do not rely on red/green alone to communicate state.
- Make disabled state reasons visible inline, not hidden only in tooltips.
- Keep the content warm and high-legibility for office lighting and astigmatism comfort.
- Avoid all-caps warning blocks and avoid dense prose in the safety area.

## 11. GPT Images 2 mockups

Attempted but not successfully generated in this run.

Prompts used:
1. Warm-light desktop operator workbench mockup, local-only stale artifact cleanup workflow. Three-column layout with read-only cleanup preview, archive-demotion explanation, and archive destination shown as `dist/.release-archive/BJ-<phase>/`.
2. Warm-light post-archive state mockup showing current package separate from archival items and a clean rescan with zero stale artifacts.

Result:
- `FalClientHTTPError` from the image backend on both attempts.
- No raster mockup was produced in this run.

## 12. Implementation handoff for `sna-frontend-workbench`

The implementation task should:
- keep the existing three-column operator-workbench shell
- preserve the BI6 current package as the visually distinct active item
- add the read-only `Cleanup preview` state before any archive move
- label the action `Archive stale artifacts`, not delete
- show the archive destination as `dist/.release-archive/<phase>/`
- confirm exact package/file counts and local recoverability
- rescan immediately after archive and show `No stale artifacts.` when clean
- keep disabled reasons short, plain, and specific
- keep all file operations local-only within `dist/`

Acceptance reminder for the next phase:
- `Cleanup preview` is dry-run only
- `Archive stale artifacts` is local and recoverable
- current package and archival items remain visually separate
- post-archive state is clean and re-scanned
- no copy implies live ServiceNow, upload, release, or publish actions
