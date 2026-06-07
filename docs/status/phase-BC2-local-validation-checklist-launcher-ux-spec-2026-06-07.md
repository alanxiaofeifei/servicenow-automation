# Phase BC2 — UX / Copy Spec for Local Validation Checklist Launcher

Date: 2026-06-07  
Status: design/spec only — local-only, no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Purpose

BC2 defines the exact copy and interaction language for the existing handoff/checklist area so the disabled Open checklist affordance becomes explicit, local-only, and tied to the current package.

Primary UX rule:
- keep the checklist entry point inside the existing handoff/checklist area
- do not add a new panel, modal, or mode tab
- make the local doc target obvious
- make loading / unavailable / stale / ready states readable at a glance
- keep the current package path first in the runbook body

## 1. Design inputs

This spec follows the same warm-light three-column operator workbench direction as the existing design spec.

Public reference patterns used as layout direction, not branding:
- Claude Code docs and desktop-style command-center layouts: clear separation between navigation, active work, and execution status
- modern agent workbench patterns: readiness and disabled reasons stay near the action, not buried in logs
- three-pane productivity tools: source / work product / runtime affordance separation

OpenDesign note:
- the broader workbench already uses a warm-light, calm command-center feel
- BC2 keeps that editorial tone and only tightens the checklist launcher copy

GPT Images 2 note:
- a sanitized mockup prompt was attempted for this phase
- the provider returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

## 2. Wireframe in text

Left column: source / queue / todo / history / settings
- source feed
- intake queue
- todo list
- history
- settings access

Center column: current source / cleaned source / TicketDraft / field preview / autofill plan
- selected source detail
- cleaned / normalized source
- generated TicketDraft
- ServiceNow required/common field preview
- autofill plan
- any KB / recommendation detail when selected

Right column: runtime / safety / environment / handoff
- runtime actions
- Start QA Chromium
- Verify current Incident
- Autofill current Incident
- templates / settings
- CDP readiness status
- safety boundary
- environment controls
- recent run evidence
- existing handoff/checklist area with the local checklist launcher

BC2 only changes the handoff/checklist area. No new visible surface is allowed beyond that area.

## 3. Column responsibilities

### Left column
Purpose: orient the operator.

It should answer:
- what came in?
- what is waiting?
- what has already been handled?
- where are settings?

BC2 impact: none, except that the left column must not introduce a competing checklist entry point.

### Center column
Purpose: explain the current work product.

It should answer:
- what is the selected source?
- what did normalization produce?
- what draft am I reviewing?
- what will autofill touch?

BC2 impact: none, except that the center column should not duplicate the checklist launcher.

### Right column
Purpose: make the next runtime or handoff step obvious.

It should answer:
- can I start QA Chromium now?
- is the current Incident verifiable yet?
- is autofill allowed yet?
- where is the local checklist?

BC2 impact: this is the only column that changes. The checklist launcher stays in the existing handoff/checklist area and behaves like a local-only document opener.

## 4. State matrix

| State | Launcher label | Helper copy | Button state | Why |
|---|---|---|---|---|
| Loading | `Open validation checklist` | `Loading the local validation checklist...` | disabled | the local doc target is still resolving |
| Unavailable | `Open validation checklist` | `Local validation checklist not found.` | disabled | the expected local runbook file is missing |
| Stale | `Open validation checklist` | `Checklist is stale. Refresh the runbook so the current package path appears first.` | disabled | the runbook still points at an older package |
| Ready | `Open validation checklist` | `Opens docs/test/windows-clean-machine-validation-2026-06-07.md` | enabled | the local runbook exists and its body starts with the current package path |

Rules:
- keep the label stable across states
- change only helper copy and state, not the visual shape of the control
- explain why the control is disabled
- do not surface a new panel when the doc is missing; keep the explanation inline

## 5. Exact labels and copy

### Button label
Use exactly:
- `Open validation checklist`

This is more explicit than the current vague `Open checklist` wording and keeps the action local-only.

### Tooltip / title copy
Use exactly:
- `Open the local validation runbook for the current package.`

### Helper copy under the button
Use exactly one line depending on state:
- `Loading the local validation checklist...`
- `Local validation checklist not found.`
- `Checklist is stale. Refresh the runbook so the current package path appears first.`
- `Opens docs/test/windows-clean-machine-validation-2026-06-07.md`

### Safety boundary copy
Keep it short:
- `Local only. Human validates manually. No ServiceNow write path.`

### Disabled reasons
Use these exact reasons where applicable:
- `Disabled: local validation checklist is still loading.`
- `Disabled: local validation checklist file is missing.`
- `Disabled: refresh the runbook so the current package path appears first.`
- `Disabled: another local action is still in progress.`

Rules:
- disabled reasons must be visible next to the control, not hidden in a tooltip
- do not use generic `unavailable` copy when a more specific local reason exists
- do not mention ServiceNow writes as the reason for this local document control

## 6. Local doc target

The checklist launcher must open exactly this local repository file:

```text
docs/test/windows-clean-machine-validation-2026-06-07.md
```

Implementation notes:
- open the file through the OS file handler or the existing worktree bridge
- keep the behavior local-only
- do not convert the launcher into a web navigation action
- do not introduce a new modal or browser surface

## 7. Runbook first-line rule

The runbook body must begin with the current package path before any historical context.

Exact rule:
1. After the title and metadata header, the first substantive line in the document body must be:
   `Current Windows package: {exact current UNC path}`
2. The current package path must appear before checksum, file size, or any explanatory paragraph.
3. No older package alias may appear above that line.
4. If a history section exists, it must come later in the document and be clearly labeled as historical / superseded.

Preferred body order:
- current Windows package path
- checksum
- file size
- short validation intent
- historical / superseded package notes later, if needed

This rule exists so Alan sees the current package first, without having to hunt through older references.

## 8. Button enable / disable logic

### Enable when
- the local runbook file exists
- the runbook is current for the current package
- another local action is not already running

### Disable when
- the local runbook file is still loading
- the local runbook file is missing
- the runbook is stale and must be refreshed so the current package path appears first
- another local action is already in progress

### Do not do
- do not auto-open a browser tab
- do not imply a ServiceNow action
- do not expose raw URLs, ticket IDs, or other sensitive values
- do not add a new button group or a second checklist launcher

## 9. Empty / loading / error copy

### Empty
- `Local validation checklist not yet available.`
- `The launcher stays disabled until the runbook is present.`

### Loading
- `Loading the local validation checklist...`
- `Please wait while the local doc target resolves.`

### Error / missing file
- `Local validation checklist not found.`
- `Open the runbook file in the project docs directory or refresh the package notes.`

### Stale
- `Checklist is stale. Refresh the runbook so the current package path appears first.`
- `Older package references should move below the current package block.`

### Ready
- `Opens docs/test/windows-clean-machine-validation-2026-06-07.md`
- `Current package path appears first in the runbook body.`

## 10. Accessibility notes

- keep the launcher in the existing handoff/checklist area; no extra panel
- use large click targets and plain-language helper copy
- keep the disabled reason adjacent to the button
- avoid pure black or high-contrast dark styling in this area
- preserve keyboard focus order so the checklist launcher is reachable after the other handoff actions
- keep line length short enough for comfortable scanning
- progressive disclosure only; no always-expanded explanation wall

## 11. Implementation handoff for `sna-frontend-workbench`

If BC2 is implemented in frontend code, keep the change set surgical and local.

Implementation requirements:
1. Preserve the existing warm-light three-column shell.
2. Keep the checklist launcher inside the current handoff/checklist area.
3. Change the label to `Open validation checklist`.
4. Keep the tooltip explicit and local-only.
5. Gate the control on the local runbook file, stale state, and busy state.
6. Make the runbook body start with the current package path.
7. Avoid introducing any new panel, tab, or demo-only surface.
8. Verify with the normal local gates before handing back to Alan.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/App.test.ts`
- `docs/test/windows-clean-machine-validation-2026-06-07.md`

## 12. Acceptance criteria

This spec is ready for implementation only when all of the following are true:
- the launcher is explicit, local-only, and tied to the current package
- the label and tooltip are exact and stable
- loading, unavailable, stale, and ready states have exact copy
- the runbook first substantive line shows the current package path first
- the user does not encounter a new panel or modal
- the control remains in the existing handoff/checklist area only
- no real ServiceNow URL, ticket ID, sys_id, credential, cookie, or screenshot is exposed
- no Save / Submit / Update / Resolve / Close automation is introduced

## 13. Status note

This document is design-only. No code, runtime, or ServiceNow action was performed.
