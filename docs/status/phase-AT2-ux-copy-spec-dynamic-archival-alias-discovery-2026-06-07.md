# Phase AT2 — UX / Copy Spec for Dynamic Archival Alias Discovery

Date: 2026-06-07
Status: design/spec only — local-only, no implementation in this task
Audience: Alan first, then `sna-frontend-workbench` after approval
Privacy level: sanitized. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Purpose

AT2 defines the copy and interaction language for the Worktree Acceptance card after AT1’s discovery that archival aliases should come from local artifact metadata instead of a hard-coded list.

Primary UX rule:
- Keep one explicit current-package path line visible at all times.
- Show older aliases as archival only.
- Make the alias list feel derived, not authored by hand.
- Keep the surface local-only and never imply a ServiceNow write action.

## 1. Design reference and fit

This spec keeps the existing local-only workbench pattern:
- warm/light desktop shell
- three-column information architecture
- compact safety boundary
- inline disabled reasons
- no mode tabs
- no demo clutter
- no vertical card dump

OpenDesign framing was used conceptually for the warm-light command-center feel. GPT Images 2 mockup generation was attempted with sanitized fake data, but the provider returned an error, so no raster mockup was generated in this run.

## 2. Wireframe in text

Left column: source / queue / todo / history / settings

- Current source feed
- Intake queue
- Todo list
- History
- Local navigation / mode switch
- Bottom-left settings entry

Center column: current package / normalized details / handoff copy

- Selected source detail
- Cleaned / normalized source
- Generated ticket draft summary
- ServiceNow-required/common field preview
- Autofill plan
- Current package path line
- Archival alias list with archival-only labels
- Handoff summary copy

Right column: runtime / safety / environment

- Runtime actions
- Start QA Chromium
- Verify current Incident
- Autofill current Incident
- Templates / settings
- CDP readiness status
- Safety boundary
- Environment controls
- Recent run evidence

## 3. Column responsibilities

### Left column
Purpose: orient the operator.

It should answer:
- What came in?
- What is queued?
- What still needs attention?
- What has already been handled?
- Where are settings?

### Center column
Purpose: explain the current package and handoff.

It should answer:
- What is the current package?
- What metadata was discovered locally?
- Which aliases are current vs archival?
- What should the human review next?

### Right column
Purpose: make the next runtime step obvious while keeping the safety boundary compact.

It should answer:
- Is QA Chromium available?
- Is CDP ready?
- What can be done now?
- What is intentionally blocked?

## 4. State matrix

| State | Current package path line | Archival aliases | Copy tone | Button state |
|---|---|---|---|---|
| Loading metadata | `Loading current package path...` | `Loading archival aliases...` | patient, explicit | copy buttons disabled with reason |
| Ready | exact current UNC path shown | discovered from local metadata | factual, concise | path / checksum copy enabled |
| No current package | `No current package path is available yet.` | may still list archival aliases | blocked, not fatal | path copy disabled |
| No archival aliases | current path still shown | `No archival aliases were found in local release metadata.` | honest, non-dramatic | alias-copy-related controls disabled |
| Archival item selected | current path still shown elsewhere | selected item labeled `Archival only` | cautionary | review/mark actions disabled |
| Metadata refresh needed | current path may still be visible but marked stale | alias list marked stale until refresh | explicit | refresh-first reason shown |

## 5. Exact labels

### Current-package line
Use exactly one visible line in the card body:

- `Current local Windows package`

Value line:
- render the exact current UNC path resolved from local metadata

Supporting copy below it:
- `This is the only package that should be treated as the current test target.`

### Archival section label
Use:
- `Archival aliases`

Section helper text:
- `Discovered from local release metadata. Older aliases are archival only.`

### Alias chip / row labels
Each discovered older alias should carry one of these labels:
- `Archival only`
- `Not current`
- `Superseded`

Preferred default label for the UI copy:
- `Archival only`

### Summary label
Use:
- `Local summary`

Summary sentence template:
- `Current package: {filename}. Archival aliases: {count}. Older aliases remain archival only.`

### Action buttons
Use these labels:
- `Copy path`
- `Copy SHA256`
- `Copy summary`
- `Open dist/release`
- `Refresh local scan`
- `Mark reviewed`

### Safety boundary copy
Keep it short:
- `Local only. No ServiceNow write path. Human reviews and submits manually.`

## 6. Disabled reasons

The disabled state must explain why. Use these exact reasons where applicable:

- `Disabled: current package metadata is still loading.`
- `Disabled: no current package path is available yet.`
- `Disabled: local release metadata has not been scanned yet.`
- `Disabled: refresh the local scan first.`
- `Disabled: no archival aliases were found in local release metadata.`
- `Disabled: archival-only packages cannot be marked reviewed.`
- `Disabled: another local action is still in progress.`
- `Disabled: the current item is not the current package.`

Rules:
- Disabled reasons should appear inline, close to the control.
- Do not use generic `unavailable` copy unless no better local reason exists.
- Do not mention ServiceNow writes as a reason for these local package controls.

## 7. History copy

The history area should show compact entries that explain what changed locally.

Use these patterns:
- `Current package path updated from local metadata.`
- `Archival aliases refreshed from the release inventory.`
- `Older aliases remain archival only.`
- `Summary copied without implying a write action.`

History entries should avoid phrasing that implies:
- save / submit / update / resolve / close
- external upload
- ServiceNow persistence

## 8. Manual checklist

Alan’s manual checklist for AT2 should read:

1. Confirm there is exactly one current-package path line.
2. Confirm the path shown is the current local UNC path, not a stale alias.
3. Confirm older aliases are shown as archival only.
4. Confirm the alias list is presented as discovered metadata, not a hard-coded list.
5. Confirm disabled buttons explain why they are disabled.
6. Confirm the summary copy never implies a ServiceNow write action.
7. Confirm the copy still feels local-only and review-first.
8. Confirm the right rail remains about runtime, safety, and environment, not demo content.

## 9. Local-only boundary and non-goals

This surface must not imply or enable:
- ServiceNow login, browsing, or API writes
- Save / Submit / Update / Resolve / Close
- attachment upload
- Microsoft Graph / Excel Web writes
- real Teams / Outlook / phone ingestion
- screenshots, HAR, traces, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, or real field values
- push, PR, merge, tag, GitHub Release, publish, or cron changes
- broad layout redesigns
- unrelated refactors outside the acceptance / archive-alias path

## 10. Implementation handoff for `sna-frontend-workbench`

The implementation task should:
- keep the existing local-only workbench shell
- make alias discovery data-driven from local artifact metadata
- preserve one explicit current-package path line
- label older aliases archival only
- keep disabled reasons visible and local
- avoid adding demo clutter or new mode tabs
- avoid implying any ServiceNow write action

## 11. Mockup record

Generated mockups:
- None. Two sanitized GPT Images 2 prompts were attempted for a warm-light three-column concept, but the provider returned `FalClientHTTPError` both times.

## 12. Status note

This document is design-only. No code, runtime, or ServiceNow action was performed.
