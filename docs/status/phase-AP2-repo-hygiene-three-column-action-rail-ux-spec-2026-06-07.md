# Phase AP2 — Repo-Hygiene Three-Column Action-Rail UX/Copy Spec

Date: 2026-06-07  
Status: design handoff only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench`  
Privacy level: sanitized. All examples are fake. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Goal

Define the exact UX and copy for the repo-hygiene three-column action-rail polish pass so implementation can be surgical and low-risk.

This phase is intentionally narrow:
- it does not add new product capabilities
- it does not change ServiceNow behavior
- it does not introduce demo clutter
- it does not weaken safety boundaries
- it stays local-only and read-only

Primary story:
1. The operator opens the repo-hygiene card.
2. The left column shows the local scan feed, queue, todo, history, and compact navigation/settings.
3. The center column shows the selected hygiene item and its cleaned evidence.
4. The right column keeps local actions obvious and explicit.
5. Disabled actions explain why they are unavailable.
6. The safety boundary stays compact and visible.

Non-goals:
- no live ServiceNow login/browsing/API write
- no Save / Submit / Update / Resolve / Close
- no attachment upload
- no Microsoft Graph / Excel Web writes
- no real Teams/Outlook/phone ingestion
- no push, PR, merge, tag, or release affordances
- no cron changes
- no vertical card dump

## 1. Research inputs

Public reference patterns used as direction, not branding:
- Codex-style command center: keep navigation/context separate from active work and execution status.
- Claude Code-style workbench: keep the current artifact in focus while the rest of the shell stays calm.
- Antigravity-style manager/editor/artifact model: separate source management, working artifact, and runtime evidence.
- Modern agent workbench pattern: readiness and disabled reasons belong next to the action, not hidden in logs.

OpenDesign note:
- keep the warm, editorial baseline
- the surface should feel like a real operator tool, not a demo stack of cards

GPT Images 2 note:
- two sanitized mockup prompts were attempted in this run
- both attempts returned `FalClientHTTPError`
- no raster mockup was successfully generated

## 2. Layout wireframe in text

Desktop target: 1366px+ Electron window, ideal design canvas 1440x900.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ServiceNow Automation        Local only      Boundary: Locked      [Settings]  Safety: On   │
│ AI drafts and local tools only. Human reviews any final ServiceNow step manually.           │
├──────────────────┬──────────────────────────────────────────────┬────────────────────────────┤
│ LEFT RAIL        │ CENTER WORKSPACE                             │ RIGHT ACTION RAIL          │
│ 280-320px        │ fluid / min 640px                            │ 320-360px                  │
│                  │                                              │                            │
│ Local feed       │ Selected hygiene item                        │ Local actions              │
│ - loading source │ - item name / state / timestamp              │ [Refresh local scan]       │
│ - scan feed      │ - why it is selected                         │ [Open workspace root]      │
│ - intake queue   │                                              │ [Export status markdown]   │
│ - todo list      │ Cleaned / normalized detail                  │ [Copy selected summary]    │
│ - history        │ - current state + evidence                   │ [Cleanup preview]          │
│ - compact mode   │ - why it is pending / verified / closed     │                            │
│ - settings       │                                              │ Boundary badge             │
│                  │ Cleanup preview                              │ - Local only               │
│                  │ - what would change                          │ - No ServiceNow writes     │
│                  │ - what stays untouched                       │ - No upload / PR / merge   │
│                  │                                              │                            │
│                  │ Scan / evidence notes                        │ Disabled reason block      │
│                  │ - current scan result                         │ - reason for each disabled │
│                  │ - last successful refresh                    │   action                   │
└──────────────────┴──────────────────────────────────────────────┴────────────────────────────┘
```

Behavioral notes:
- top bar stays fixed
- each column may scroll internally if needed
- the center keeps the selected item and evidence visible without becoming a long scroll wall
- the right rail keeps the five local actions visible without requiring page scroll
- settings stay discoverable in the left column, not buried in a dialog

## 3. Column responsibilities

### 3.1 Left column — source / queue / todo / history / mode switching / settings

The left column answers:
- What arrived?
- What is waiting?
- What did I already touch?
- Where are the local controls?

Include:
- source / loading information feed
- intake queue
- todo list
- history
- compact function switching if it already exists
- bottom-left settings access

Rules:
- keep it compact and task-oriented
- avoid demo scenario clutter
- avoid expanding every item by default
- do not show raw URLs, ticket IDs, or customer data
- keep list items touch-friendly and selectable
- the current function should read as a simple label or compact selector, not as large mode tabs

### 3.2 Center column — selected detail, cleaned detail, evidence, cleanup preview

The center column answers:
- Which hygiene item is selected?
- What did the scan or cleanup preview find?
- What is the safe next action?

Include:
- selected source / selected hygiene item detail
- cleaned / normalized detail
- scan evidence summary
- cleanup preview context
- short explanatory notes about what changes and what does not

Rules:
- keep the selected item readable at a glance
- collapse secondary evidence by default
- keep the work product visible as the main focus
- the center should feel like a focused inspector, not a log dump

### 3.3 Right column — local actions, boundary badge, disabled reasons

The right column answers:
- What can I do locally right now?
- Why is a given action disabled?
- What boundary am I operating under?

Include:
- local actions
- compact boundary badge
- one short block for disabled reasons
- optional tiny hint text for the current workspace state

Rules:
- local actions must be large and obvious
- disabled actions must explain why
- the boundary badge must always be visible
- the action rail should never imply a live ServiceNow write path
- do not add upload, submit, or release affordances

## 4. State matrix

| State | Left column | Center column | Right column |
|---|---|---|---|
| Empty | Onboarding copy + example hygiene categories | Placeholder cards for selected item and evidence | Disabled actions with explanations |
| Loading scan | Scan feed shows loading rows; history unchanged | Skeleton selected item and evidence cards | Actions remain disabled until scan state is known |
| Item selected | Queue row active | Selected item detail + cleaned summary | Refresh may stay enabled; copy/export may enable if data exists |
| Cleanup preview ready | Queue row active | Preview details become primary | Cleanup preview button may open/close the preview panel |
| Busy / refresh running | Queue row locked to current selection | Existing data stays visible | Action buttons show busy state and clear reason text |
| Blocked / error | Queue may still show selection | Blocked panel explains last safe checkpoint | Disabled buttons show plain-language reasons |

State rules:
- loading and empty states keep the layout stable
- the selected item never disappears just because preview is unavailable
- the boundary badge remains visible in every state
- the current safe state should stay visible if an action fails

## 5. Main components

Keep the component set small. Do not introduce a large design system.

### Shell and top bar
- `OperatorWorkbenchShell`
- `WorkbenchTopBar`
- `CompactSafetyBadge`
- `BoundaryStatusChip`

### Left rail
- `LocalFeedCard`
- `IntakeQueueRail`
- `TodoListCard`
- `HistoryCard`
- `CompactFunctionSwitch`
- `BottomSettingsEntry`

### Center workspace
- `SelectedHygieneItemCard`
- `CleanedSummaryCard`
- `ScanEvidenceCard`
- `CleanupPreviewCard`
- `SelectedSummaryFooter`

### Right rail
- `LocalActionRail`
- `LocalActionButton`
- `BoundaryBadge`
- `DisabledReasonList`
- `WorkspaceHintChip`

### Settings
- `SettingsPanel`
- `EnvironmentUrlFields`
  - QA URL
  - Dev URL
  - Production URL
  - default environment selector
- `DisplaySettings`
- `ClearSavedSettings`

## 6. Empty, loading, and error states

### Empty states
Use one sentence, one next action, and one calm placeholder.

Recommended copy:
- `No hygiene item selected.`
- `Run a local scan or choose a queue item to begin.`
- `Open Settings to confirm the workspace root and default environment.`

### Loading states
Use skeleton cards or muted placeholders only.

Rules:
- keep the current item visible if the user already selected one
- avoid generic spinners where a step label is clearer
- use progress language such as `Refreshing local scan...` or `Building cleanup preview...`

### Error states
Explain the safe stop point, not just the failure.

Rules:
- show the exact step that failed
- keep the previous safe state visible
- do not imply ServiceNow changed when it did not
- explain why a button is disabled in plain language
- keep recovery actions visible when possible

Recommended copy:
- `Local scan failed — refresh the workspace and try again.`
- `Cleanup preview is unavailable until a queue item is selected.`
- `Workspace root is missing — open Settings to repair the local path.`

## 7. Button enable / disable logic

### Refresh local scan
Enabled when:
- workspace root is available
- no other local action is busy

Disabled copy:
- `Open the workspace root first.`
- `A scan is already running.`

### Open workspace root
Enabled when:
- the workspace root is configured

Disabled copy:
- `No workspace root configured yet.`

### Export status markdown
Enabled when:
- the current scan or selected item has data to export
- no other local action is busy

Disabled copy:
- `Run a local scan first.`
- `Wait for the current action to finish.`

### Copy selected summary
Enabled when:
- a queue item is selected

Disabled copy:
- `Select a hygiene item first.`

### Cleanup preview
Enabled when:
- a previewable queue item is selected
- preview is not already open
- no other local action is busy

Disabled copy:
- `Select a previewable item first.`
- `Cleanup preview is already open.`
- `Wait for the current action to finish.`

### General rules
- button labels stay exact and stable
- disabled reasons are visible next to the control, not hidden in a tooltip
- a disabled button must explain the next safe prerequisite
- if the prerequisite is workspace-related, the copy should point to Settings rather than log output

## 8. Copy text

### Top bar
- Product name: `ServiceNow Automation`
- Boundary chip: `Local only`
- Safety line: `AI drafts and local tools only. Human reviews any final ServiceNow step manually.`

### Left column
- Section labels: `Local feed`, `Intake queue`, `Todo`, `History`, `Function`, `Settings`
- Queue action copy: `Paste or load source`
- Empty history copy: `No recent items yet.`

### Center column
- Selected header: `Selected hygiene item`
- Cleaned header: `Cleaned / normalized detail`
- Evidence header: `Scan evidence`
- Preview header: `Cleanup preview`
- Footer hint: `This preview is local only and does not write to ServiceNow.`

### Right column
- Runtime header: `Local actions`
- Action buttons: `Refresh local scan`, `Open workspace root`, `Export status markdown`, `Copy selected summary`, `Cleanup preview`
- Boundary panel label: `Boundary badge`
- Disabled panel label: `Disabled reasons`

### Short disabled-state helpers
- `Open Settings to configure the workspace root.`
- `Run a local scan first.`
- `Select a queue item first.`
- `Wait for the current action to finish.`
- `No preview is available for the current selection.`

### Avoid in primary UI
- `MockAIProvider`
- language simulation wording
- high-severity simulator wording
- Excel dry-run wording
- demo scenario wording
- long safety essays
- raw URLs, raw ticket IDs, raw sys_ids, raw fingerprints
- upload / submit / resolve / release labels

## 9. Accessibility notes

- minimum 44px hit targets for all interactive rows and buttons
- visible focus ring on every interactive control
- keyboard order should flow left column → center column → right rail → settings
- disabled buttons must still be readable and explain why they are disabled
- use short section headings and avoid dense paragraphs inside cards
- keep contrast comfortable in the warm/light theme; do not drift to pure black or harsh white
- make selected states clear with more than color alone
- collapsed secondary panels must still expose their label and expansion affordance
- do not hide safety boundaries behind hover-only cues
- use clear spacing so the right action rail can be scanned with a single glance

## 10. OpenDesign / mockup note

OpenDesign was used as the design-system reference for the warm editorial baseline.

GPT Images 2 / `image_generate` attempts:
- Attempt 1: warm-light three-column repo-hygiene operator workbench with left queue, center evidence, and right action rail
- Attempt 2: alternate editorial mockup with stronger action-rail hierarchy and compact boundary badge

Result:
- no raster mockup was successfully generated in this run
- the image backend returned `FalClientHTTPError` for both attempts

## 11. Implementation handoff for `sna-frontend-workbench`

Implement this spec with the smallest possible UI-only polish pass.

Suggested files to inspect first:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Implementation intent:
- keep the existing shell and behavior intact
- make the right action rail unmistakable without adding demo clutter
- keep disabled reasons visible and plain-language
- keep settings first-class and easy to find
- preserve the local-only boundary copy
- do not introduce any live ServiceNow write behavior

Acceptance checklist for the implementer:
- warm/light three-column shell is obvious at a glance
- left, center, and right column responsibilities match this spec
- disabled buttons explain why they are disabled
- local actions are exact and explicit
- settings include QA URL, Dev URL, Production URL, default environment, and compact safety state
- no demo clutter or mode-tab noise in the primary UI
- no live ServiceNow actions are added
- no raw sensitive data appears in the UI
