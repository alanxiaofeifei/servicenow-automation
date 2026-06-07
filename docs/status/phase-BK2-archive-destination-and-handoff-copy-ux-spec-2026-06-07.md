# Phase BK2 — archive-destination `<phase>` → `BJ-<phase>` and handoff copy clarity — UX / copy spec

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, requester names, assignment groups, or customer data.

## 0. Preflight

Goal
- Fix the renderer copy mismatch so archive-destination always reads `BJ-<phase>` instead of bare `<phase>`.
- Make the release-readiness handoff open with the exact Windows UNC path so Alan can copy it immediately.
- Keep the cleanup preview, empty/loading/error states, and disabled reasons short, calm, and local-only.

Known facts
- This is a spec-only task: no runtime change, no browser automation, no package rebuild.
- The current manual-validation package is BJ6.
- The exact UNC path already documented in BK1 should be the first thing Alan sees in the release-readiness handoff.
- `worktree-ipc.ts` is already correct; it uses `BJ-<phase>` naming for the archive destination.
- The renderer currently shows `<phase>` in 5 places and must be updated to match the actual archive naming.

Assumptions
- Alan wants one compact copy spec, not a broad layout redesign.
- The smallest safe change is to keep the existing surfaces and update only copy, ordering, and state language.
- The handoff should feel like a trustworthy operator summary, not a release note or runbook lecture.

Ambiguities
- Whether the `BJ-` prefix should be represented as a concrete example or described as a naming convention.
- Whether the cleanup preview should keep the previous result visible when entering loading/error states.
- Whether the exact UNC path should appear in a dominant block, a callout, or both.

Chosen smallest approach
- Hardcode the `BJ-` prefix in the renderer copy.
- Make the exact UNC path the first line in the release-readiness handoff block.
- Keep archive-destination copy visually consistent across preview, confirmation, reminder, and footer surfaces.
- Add only the copy and state language needed for empty/loading/error verification.
- Avoid new abstractions, new configuration, or IPC changes.

Files likely affected
- `docs/status/phase-BK2-archive-destination-and-handoff-copy-ux-spec-2026-06-07.md` (this task)
- Later implementation would likely touch `apps/desktop/src/App.tsx` and only test files that assert copy text.

Verification plan
- Confirm the archive-destination copy says `BJ-<phase>` in all 5 renderer locations.
- Confirm the handoff opens with the exact UNC path before any prose.
- Confirm the cleanup preview, loading, and error states are readable and local-only.
- Confirm disabled buttons explain why they are disabled.
- Confirm no copy implies live ServiceNow, upload, release, or publish actions.

## 1. Purpose

Define the copy and state hierarchy for two related surfaces:

1. the archive-destination string shown in the local cleanup workflow, and
2. the release-readiness handoff that Alan uses to copy the current Windows UNC path.

This spec answers:

1. What should the archive destination say?
2. What should the handoff surface show first?
3. How should loading, empty, and error states speak?
4. What should disabled buttons say when the local data is missing?
5. How do we keep the copy clearly local and non-destructive?

Non-goals:
- no live ServiceNow login, browsing, API write, Save / Submit / Update / Resolve / Close
- no attachment upload
- no Microsoft Graph / Excel Web write
- no push, PR, merge, tag, GitHub Release, publish, or cron changes
- no archive-demotion logic changes
- no IPC changes
- no new layout system

## 2. Research and design references

Public reference patterns used as direction, not branding:
- Claude-style command-center framing: warm surfaces, calm hierarchy, and strong first-read ordering.
- Linear-style detail-plus-actions layout: the selected item and the action affordance sit close together.
- Open Design command-center guidance: stable zones, compact status, and no vertical card dump.
- Existing operator-workbench specs in this repo: warm/light shell, progressive disclosure, and large readable runtime controls.

OpenDesign context in this project:
- Bound design system: `claude`
- Bound template: `web-prototype-taste-editorial`
- Practical implication: warm parchment canvas, editorial hierarchy, soft containment, and readable operator copy.

Design takeaways for this task:
- Put the exact path before supporting prose.
- Use the same `BJ-<phase>` wording everywhere the archive destination appears.
- Keep local-only language concise and calm.
- Make disabled reasons explainable in one short sentence.
- Avoid chromatic warning language or red/green release semantics.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Release readiness handoff                                                                                │
│ EXACT UNC PATH FIRST · CURRENT package stays current · ARCHIVE destination is BJ-prefixed                │
├───────────────────────────────┬──────────────────────────────────────────────┬───────────────────────────┤
│ Left: source / history        │ Center: handoff / cleanup detail             │ Right: actions / safety   │
│                               │                                              │                           │
│ Current package                │ Exact UNC path                               │ Local runtime actions     │
│ BJ6 current package           │ \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\...zip │ Refresh scan              │
│                               │                                              │ Cleanup preview           │
│ History                        │ Package name                                 │ Archive preview/confirm    │
│ Previous local packages       │ servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip │                           │
│                               │                                              │ Archive destination        │
│ Settings                       │ SHA-256 checksum                             │ dist/.release-archive/     │
│ bottom-left settings           │ 336eb16d...                                  │ BJ-<phase>/                │
│                               │                                              │                           │
│ Cleanup preview                │ Empty / loading / error copy                 │ Safety boundary            │
│ read-only state only          │ local-only, short, explainable               │ Local only · no release    │
└───────────────────────────────┴──────────────────────────────────────────────┴───────────────────────────┘
```

Behavioral notes:
- The UNC path is the first item in the handoff’s primary reading order.
- The archive destination is visible as a destination reminder, not as a destructive action.
- The current BJ6 package remains visually distinct from any archive history.
- The right rail should feel like local maintenance, not a release control room.

## 4. Column responsibilities

### Left column — source / history / settings
Owns orientation and provenance.

It should answer:
- What is the current package?
- What older labels are just history?
- Where are local settings?

Include:
- current package anchor card
- compact history list
- bottom-left settings entry
- small status chip for current / archived / loading

Rules:
- Keep the current package visually dominant over history.
- Do not bury the current package below archival items.
- Keep settings available without turning the column into a control panel.

### Center column — handoff / cleanup detail
Owns the exact copy Alan needs to read or copy.

It should answer:
- What exact UNC path should I paste into File Explorer?
- What package name is current?
- What checksum should I verify?
- What does the cleanup preview say right now?

Include:
- exact UNC path block
- package name line
- checksum line
- read-only cleanup preview block
- empty/loading/error states for path metadata and preview metadata

Rules:
- The UNC path must be the first line in the handoff surface.
- Keep the path and checksum in the same primary visual block.
- Make read-only states obviously read-only.
- Keep the current package separate from any archive explanation.

### Right column — actions / safety
Owns the local action set and the compact boundary copy.

It should answer:
- What can I do right now?
- Is the action enabled, loading, or disabled?
- Why is it disabled?
- What is the archive destination?

Include:
- `Refresh scan`
- `Cleanup preview`
- `Archive stale artifacts`
- archive destination reminder
- compact safety boundary
- recent evidence summary

Rules:
- The action rail should feel like local maintenance.
- No button should imply live ServiceNow or release publication.
- Disabled buttons must explain why in one short sentence.
- The safety copy should stay compact and non-alarming.

## 5. State matrix

| State | Handoff path metadata | Cleanup preview | Archive destination copy | Action buttons |
|---|---|---|---|---|
| Loading path metadata | show `Loading current package path…` | keep previous preview collapsed or show loading skeleton | visible but muted | buttons disabled with reason |
| Path metadata ready | exact UNC path visible first | preview can render if available | `dist/.release-archive/BJ-<phase>/` | buttons enabled by prerequisites |
| Cleanup preview ready | exact UNC path stays visible | dry-run list visible | visible in the preview/confirm area | archive button enabled only after preview |
| Empty path metadata | show `No path metadata yet.` | preview stays empty or collapsed | still visible as static guidance | actions disabled with reason |
| Error loading path metadata | keep last known good path if one exists | preview can remain if already known | visible but muted | actions disabled with reason |
| Error loading preview | keep path visible | show short failure line | visible in action rail | archive disabled with reason |
| Archive complete | handoff path remains current | preview can collapse into history | destination reminder may stay visible | archive button disabled with completion reason |

### State copy rules
- Use `Loading current package path…` for active path metadata loading.
- Use `No path metadata yet.` when the app has no path information at all.
- Use a short failure line for errors, not a stack trace or technical dump.
- Keep the current path visible whenever there is a trustworthy previous value.
- Keep the archive destination reminder visible even when the preview is empty, so the naming convention stays obvious.

## 6. Main components

### 6.1 Handoff header
- Title: `Release readiness handoff`
- Boundary line: `Exact UNC path first · Local only · No release / publish actions`
- Optional status chip: `Current · BJ6`

### 6.2 Current package anchor
- Title: `Current package (BJ6)`
- Helper text: `The current manual-validation package stays separate from archival items.`
- Value line: `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`
- Supporting note: `This is the only package that should stay in the active release surface.`

### 6.3 Exact UNC path block
- Title: `Windows UNC path`
- Helper text: `Copy this first.`
- Value line: the exact UNC path from BK1
- Action: `Copy UNC path`

### 6.4 Checksum block
- Title: `SHA-256 checksum`
- Helper text: `Verify before extracting.`
- Value line: `336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e`
- Action: `Copy checksum`

### 6.5 Cleanup preview block
- Title: `Cleanup preview (read-only)`
- Helper text: `This is a dry run. Nothing moves until you confirm.`
- Show exact counts for any stale items if present.
- Keep the block visually calm and obviously non-destructive.

### 6.6 Archive-destination reminder
- Title: `Archive destination`
- Copy: `dist/.release-archive/BJ-<phase>/`
- Helper text: `Hardcoded BJ prefix matches the real archive naming used by the local cleanup workflow.`
- This copy can appear in preview, confirmation, reminder, and footer surfaces.

### 6.7 Safety footer / status
- Keep the local-only boundary visible at all times.
- Use the footer as a reminder, not a warning wall.
- Keep the safety copy short and specific.

## 7. Empty / loading / error states

### Empty state
When no path metadata exists yet:
- keep the current package card visible if known
- show `No path metadata yet.` in the center column
- show `No cleanup preview available.` if preview data is absent
- disable `Copy UNC path` and `Archive stale artifacts`
- use the disabled reason: `Path metadata is not ready.`

### Loading state
When local path metadata is being refreshed:
- keep the current package visible
- show `Loading current package path…`
- keep the cleanup preview collapsed or show a small skeleton
- disable preview/archive actions until the refresh completes
- use the disabled reason: `Path metadata still loading.`

### Error state
When the path metadata or preview lookup fails:
- keep the last known good path visible if one exists
- show `Could not refresh the current package path.`
- keep the archive-destination reminder visible but muted
- disable preview/archive actions until the next refresh
- use the disabled reason: `Refresh the local scan first.`

### Cleanup-preview empty state
When there are no items to preview:
- show `No cleanup preview available.`
- keep the current package visible
- disable `Archive stale artifacts`
- use the disabled reason: `No stale items selected.`

### Archive-complete state
After the archive move and rescan:
- show `No stale artifacts.`
- keep the current BJ6 package visible
- keep the archive destination available as history/reference only
- do not show any delete-style completion message

## 8. Button enable / disable logic

### `Refresh scan`
- Enabled when the app can read the local workspace.
- Disabled reason: `Workspace root unavailable.`

### `Copy UNC path`
- Enabled only when the current package path is known.
- Disabled reason: `Path metadata is not ready.`

### `Cleanup preview`
- Enabled only when local metadata can be scanned and path data is available.
- Disabled reason: `Path metadata still loading.`
- Disabled reason: `No path metadata yet.`

### `Archive stale artifacts`
- Enabled only after a fresh dry-run preview exists.
- Disabled reason: `Run Cleanup preview first.`
- Disabled reason: `No stale artifacts found.`
- Disabled reason: `Archive already complete.`

### General rules
- Disabled text should be short, plain, and specific.
- Never use generic `unavailable` copy if a local reason is available.
- Never frame the archive action as release, publish, or deletion.
- Avoid red/green button semantics that imply release approval.

## 9. Exact copy

### Header copy
- `Exact UNC path first · Local only · No release / publish actions`

### Current package copy
- `Current package (BJ6)`
- `The current manual-validation package stays separate from archival items.`
- `This is the only package that should stay in the active release surface.`

### Path copy
- `Windows UNC path`
- `Copy this first.`
- `Paste this into File Explorer, then verify the checksum before extracting.`

### Preview copy
- `Cleanup preview (read-only)`
- `This is a dry run. Nothing moves until you confirm.`
- `Recoverable locally`

### Archive copy
- `Archive stale artifacts`
- `Moves stale files locally into dist/.release-archive/BJ-<phase>/`
- `Confirm archive of [N] packages and [M] files?`
- `This is local and recoverable.`

### Destination copy
- `Archive destination`
- `dist/.release-archive/BJ-<phase>/`
- `Hardcoded BJ prefix matches the real archive naming used by the local cleanup workflow.`

### Loading / empty / error copy
- `Loading current package path…`
- `No path metadata yet.`
- `No cleanup preview available.`
- `Could not refresh the current package path.`
- `Path metadata is not ready.`
- `Path metadata still loading.`
- `Refresh the local scan first.`

### Post-archive copy
- `Archived locally.`
- `No stale artifacts.`
- `Re-scanned after archive.`

## 10. Accessibility notes

- Use large click targets for the copy, preview, and archive buttons.
- Keep the current package and archival items separated by spacing and section headers, not color alone.
- Do not rely on red/green only to communicate state.
- Make disabled state reasons visible inline, not hidden only in tooltips.
- Keep the content warm and high-legibility for office lighting and astigmatism comfort.
- Avoid all-caps warning blocks and avoid dense prose in the safety area.
- Keep the exact UNC path in a code-styled block for accurate copying.

## 11. GPT Images 2 mockups

Attempted in this run but not successfully generated.

Prompts used:
1. Warm-light desktop operator workbench mockup focused on release-readiness handoff. Three-column layout, exact UNC path first, checksum below, archive destination reminder as `dist/.release-archive/BJ-<phase>/`, fake BJ6 package data, warm parchment canvas, terracotta accent, no demo clutter.
2. Warm-light desktop operator workbench mockup focused on cleanup preview and path metadata states. Three-column layout, read-only preview, loading/empty/error copy, archive destination reminder, and compact local-only safety boundary, fake data only.

Result:
- `FalClientHTTPError` from the image backend on both attempts.
- No raster mockup was produced in this run.

## 12. Implementation handoff for `sna-frontend-workbench`

The implementation task should:
- update the 5 renderer locations in `App.tsx` so archive-destination says `BJ-<phase>` instead of `<phase>`
- keep the `BJ-` prefix hardcoded, matching the current local archive naming convention
- make the exact UNC path the first thing visible in the release-readiness handoff
- keep the current package, checksum, and copy actions in one primary block
- add short, local-only empty/loading/error copy for path metadata and cleanup preview
- keep disabled reasons short, plain, and specific
- avoid any copy that implies live ServiceNow, upload, release, or publish actions
- avoid red/green button semantics that suggest approval or release gating

Acceptance reminder for the next phase:
- archive-destination copy is `BJ-<phase>` in all 5 renderer locations
- handoff begins with the exact UNC path
- path metadata and cleanup preview have verified empty/loading/error copy
- disabled buttons explain why
- the local-only boundary stays compact and honest
