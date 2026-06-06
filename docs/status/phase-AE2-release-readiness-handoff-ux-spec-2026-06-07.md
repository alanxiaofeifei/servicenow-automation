# Phase AE2 — Release-Readiness Handoff Panel UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only ServiceNow Automation release-readiness handoff surface and validation flow

## 0. Preflight

Goal
- Specify the copy and layout for a visible release-readiness handoff surface that starts with the exact latest Windows UNC path, then shows checksum, mtime, what changed, why retest matters, and what remains human-only.
- Preserve the center-order narrative already approved for the operator workbench.
- Keep the result local-only, read-only, and implementable without new runtime authority or external write paths.

Known facts
- Repo: `/home/alanxwsl/projects/servicenow-automation`
- Board task: `t_2786a549`
- Latest local package path resolves to the Windows UNC path below.
- This task is docs/spec only; no ServiceNow login, browser automation, or API writes should be added.
- The project already has a bound Open Design reference: `claude` + `web-prototype-taste-editorial`.

Assumptions
- Alan wants a first-glance handoff surface he can open before manual validation.
- The handoff surface should be readable on Windows and in the repo docs without extra tooling.
- The surface should remain local-only and should not imply any live ServiceNow action.

Ambiguities
- Whether AE3 will implement this as an in-app panel, a doc-local panel, or both.
- Whether the handoff surface should include a separate “copy all metadata” action or only individual copy buttons.
- Whether the manual-review checklist should live in the same page or a follow-on checklist doc.

Chosen smallest approach
- Define a compact, read-only handoff panel/doc structure that reuses existing package metadata and does not expand runtime authority.
- Keep the main workbench order unchanged.
- Use short, literal copy and visible disabled reasons rather than a denser status dump.

Files likely affected
- `docs/status/phase-AE2-release-readiness-handoff-ux-spec-2026-06-07.md` only

Verification plan
- Cross-check the path/checksum/mtime against the local artifact metadata.
- Confirm the spec does not introduce any live-ServiceNow implication.
- Confirm the document can be handed to AE3 without rework.

## 1. Purpose

Turn the release-readiness handoff into a single visible place where Alan can answer, in one glance:

1. What exact package should I test?
2. Is it still the latest local build?
3. What changed since the last validation round?
4. Why should I retest now?
5. What must remain human-only?

This is not a new action surface. It is a local-only handoff and validation aid.

The main operator workbench still keeps its approved center-order narrative intact:

- Selected source detail
- Cleaned summary
- Incident draft
- Guided demo path
- Local KB recommendations
- Monthly Excel fill queue

This AE2 surface must not change that order or introduce a new mode switch.

## 2. Research and design references

Design cues used for this spec:

- Claude Code docs: clear navigation, visible session/state concepts, and prominent command surfaces.
- Command-center style desktop workbenches: keep the important metadata visible near the primary action.
- The existing Open Design binding in this repo: warm editorial tone, calm hierarchy, readable contrast, and progressive disclosure.

Design takeaways for this task:

- Put the exact artifact path first.
- Keep package metadata in a compact, scannable strip.
- Explain why the package should be retested, not only what it is.
- Keep human-only boundaries adjacent to the artifact reference.
- Avoid endpoint details, raw ServiceNow URLs, or any implication of a write action.

## 3. Layout wireframe in text

This spec supports a read-only handoff surface with a simple, progressive layout:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Release Readiness Handoff                                                                      │
│ Alan should test this file: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Path / checksum / mtime strip                                                                  │
│ - SHA256: 7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006                      │
│ - mtime: 2026-06-07 01:32:24.198127755 +0800                                                 │
│ - what changed: AD3 CDP readiness chip + center empty/loading/error states (3 runtime files)   │
├───────────────────────────────┬───────────────────────────────────┬──────────────────────────┤
│ Package facts                 │ Why retest matters                │ Human-only boundaries     │
│ - latest build marker         │ - validates the latest polish     │ - no live ServiceNow      │
│ - one-line summary            │ - confirms readable empty/loading │ - no Save / Submit /      │
│ - local-only artifact         │   /error copy                     │   Update / Resolve / Close│
│ - freshness check             │ - verifies the handoff still      │ - no external write paths │
│                               │   matches the artifact            │ - no raw ticket data      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ Manual review checklist + local-only actions                                                   │
│ [Copy path] [Copy SHA256] [Copy summary] [Open package folder] [Open checklist]                │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended behavior:

- The first line shown to Alan must be the exact Windows UNC path.
- The metadata strip must appear directly under the path and must stay visible without expanding anything.
- The “why retest” block must stay concise and human-readable.
- The human-only boundaries block must be adjacent to the package facts, not buried in a separate appendix.
- The panel should look like a calm local handoff surface, not a release dashboard or a demo page.

## 4. Column responsibilities

### Left column
Owns package selection and recency.

It should answer:

- Which local package is the latest?
- Is this the one Alan should test first?
- Is there an older package nearby that should not be confused with the latest one?

Include:

- package list / recent artifacts
- latest marker
- timestamp / freshness hint
- local folder shortcut

Rules:

- Do not make the left side a long release log.
- Do not surface unrelated implementation notes here.
- Keep each row short enough to scan in one glance.

### Center column
Owns the handoff facts and validation narrative.

It should answer:

- What exact file should Alan test?
- What is the checksum?
- When was it built?
- What changed since the last round?
- Why does this retest matter?

Include:

- exact Windows UNC path
- SHA256
- mtime
- one-line change summary
- retest rationale
- compact validation checklist

Rules:

- The first visible line is the exact UNC path.
- The center must preserve the story order: path → checksum → mtime → change summary → why retest → human-only boundaries.
- Do not add a mode switch or a live write action.

### Right column
Owns local actions and safety.

It should answer:

- What can I copy now?
- What local folder can I open?
- Where is the human checklist?
- What is explicitly out of bounds?

Include:

- copy buttons
- open-folder action
- open-checklist action
- compact safety boundary
- optional freshness badge

Rules:

- Actions must be local-only.
- Disabled reasons must be visible and plain-language.
- No action may imply ServiceNow submission, update, or resolve.

## 5. State matrix

| State | Left column | Center column | Right column |
| --- | --- | --- | --- |
| Empty | No package chosen yet; shows one suggested latest candidate | Shows the prompt to open the latest handoff first | Copy/open actions disabled with reasons |
| Package selected | Latest row highlighted | Path/checksum/mtime appear immediately | Copy actions enabled |
| Fresh / current | Latest marker visible | Change summary and retest rationale are visible | Open-folder and checklist actions enabled |
| Stale selection | Older row selectable but clearly not latest | Warning explains this is not the current package | Latest-only copy action disabled or de-emphasized |
| Metadata mismatch | Selected package is present but checksum or mtime cannot be trusted | Error explains the mismatch and preserves the last safe values | Copy path may remain enabled; checksum copy is disabled |
| Human-review needed | Package is present and metadata is visible | Checklist is the primary next step | Checklist action is enabled; any non-local action remains disabled |
| Error | No safe package metadata can be trusted | Center keeps the last safe known info and explains the failure | Actions stay disabled until the metadata is restored |

Notes:

- Avoid spinner-only states.
- Use muted placeholders or short status text while metadata is loading.
- Keep the last safe package visible whenever possible.

## 6. Main components

- header with release-readiness title
- primary UNC path line
- metadata strip for SHA256 / mtime / change summary
- package facts block
- why-retest block
- human-only boundaries block
- manual-review checklist
- local-only actions row
- freshness / latest marker
- optional archived-package list

## 7. Empty, loading, and error states

### Empty states
- Use one sentence and one next action.
- Avoid giant blank panels.
- Keep the surface calm and local-only.

Recommended copy:
- `No package selected yet.`
- `Open the latest local handoff to begin.`
- `The latest path, checksum, and mtime will appear here.`

### Loading states
- Use muted placeholders, not a spinner wall.
- Keep the current selection visible if the metadata is still resolving.
- Prefer progress language over a generic busy icon.

Example copy:
- `Resolving the latest local package...`
- `Loading checksum and mtime...`
- `Preparing the validation summary...`

### Error states
- Show the exact step that failed.
- Keep the previous safe package visible if one exists.
- Explain the failure in plain language.

Example copy:
- `The latest package could not be resolved.`
- `Checksum verification is unavailable right now.`
- `Open the last safe handoff or refresh the local package list.`

## 8. Button enable / disable logic

### Copy path
Enabled when:

- a valid package path is present
- the package is the current latest or intentionally selected archived candidate

Disabled when:

- no package is selected
- the selection is stale and marked as not current

Disabled reason:
- `Select the latest local package first.`

### Copy SHA256
Enabled when:

- checksum is present and trusted

Disabled when:

- checksum is missing
- checksum cannot be verified

Disabled reason:
- `Checksum is not available yet.`

### Copy summary
Enabled when:

- the one-line change summary is present

Disabled when:

- the summary has not been generated yet

Disabled reason:
- `The change summary is not ready yet.`

### Open package folder
Enabled when:

- the artifact path is known locally

Disabled when:

- the path is missing or invalid

Disabled reason:
- `No local package folder is available.`

### Open checklist
Enabled when:

- the handoff is readable and the package metadata is present

Disabled when:

- the panel is empty or in an error state

Disabled reason:
- `Open the latest handoff before reviewing the checklist.`

### General rules
- Never hide a useful local action without explaining why.
- Never imply a write action exists.
- Never offer Save / Submit / Update / Resolve / Close language.
- Keep disabled reasons short and visible next to the control.

## 9. Copy text

### First-line path pattern
- `Alan should test this file: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip`

### Metadata strip
- `SHA256: 7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006`
- `mtime: 2026-06-07 01:32:24.198127755 +0800`
- `What changed: AD3 CDP readiness chip + center empty/loading/error states (3 runtime files modified)`

### Why retest copy
- `This is the latest local package for the new UI polish round.`
- `Retest it now to confirm the new readiness and empty-state copy still reads cleanly.`
- `This surface is local-only and does not imply any live ServiceNow action.`

### Human-only copy
- `No live ServiceNow login.`
- `No Save / Submit / Update / Resolve / Close.`
- `No external write paths.`
- `No raw customer or ticket data.`

### Checklist copy
- `Verify the UNC path matches the latest local package.`
- `Confirm the SHA256 matches the package metadata.`
- `Check the mtime is the newest available package timestamp.`
- `Read the one-line change summary before retesting.`
- `Confirm the boundaries remain human-only.`

### Copy to avoid in the primary UI
- raw ServiceNow URLs or hosts
- ticket IDs or sys_ids
- customer names or email addresses
- save/submit/update/resolve/close wording
- demo clutter such as mock-provider labels
- long debug prose

## 10. Accessibility notes

- Warm/light theme by default; avoid pure black surfaces.
- Use large click/touch targets for the copy and open actions.
- Keep line length readable for eye comfort.
- Use clear hierarchy so the path line is unmistakable.
- Keep disabled reasons readable and close to the disabled control.
- Do not rely on color alone to distinguish current vs stale package state.
- Use sufficient contrast for timestamps and metadata labels.
- Preserve keyboard navigation for copy/open/checklist actions.

## 11. GPT Images 2 mockup notes

Attempted sanitized mockups with `image_generate` using fake/local-only data:

- landscape three-column release-readiness handoff panel
- portrait metadata strip and safety boundary detail

Result:
- both image generation attempts returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

Retained prompts for a later image-capable rerun:

1. Three-column release-readiness handoff panel
   - Warm light local handoff surface with exact UNC path first, checksum and mtime beneath it, a concise why-retest panel, and a human-only boundaries panel. Fake data only, no live ServiceNow, no ticket IDs, no raw URLs.
2. Metadata strip detail
   - Warm light validation strip showing UNC path, SHA256, mtime, and a one-line change summary with large readable type and local-only copy actions. Sanitized fake data only.

## 12. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented later in frontend code, keep the change set surgical and local-only.

Implementation requirements:

1. Preserve the current safety model.
2. Keep the handoff surface read-only.
3. Surface the exact UNC path first.
4. Show SHA256, mtime, and one-line change summary together.
5. Keep the why-retest and human-only blocks adjacent to the package facts.
6. Keep all actions local-only and explain disabled states.
7. Do not add any write path or live ServiceNow implication.
8. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

## 13. Manual-review checklist for Alan

- Open the handoff surface and confirm the first visible line is the exact Windows UNC path.
- Confirm the checksum matches the package metadata.
- Confirm the mtime is the newest available local build timestamp.
- Read the one-line change summary and understand why this round should be retested.
- Verify the human-only boundaries are visible next to the package facts.
- Confirm the panel does not imply any live ServiceNow write action.
- Confirm copy/open/checklist actions are local-only and explain disabled states.
- Confirm the main workbench center-order narrative remains unchanged.
- Approve the spec or send it back if any line suggests a write action or stale package.

## 14. Acceptance criteria recap

This spec is ready for AE3 only when all of the following are true:

- The first visible line is the exact latest Windows UNC path.
- The surface shows SHA256, mtime, and a one-line change summary.
- The surface explains why retesting matters.
- The surface clearly marks what remains human-only.
- The design preserves the approved center-order narrative elsewhere.
- The spec is implementable without new runtime authority or external write paths.
- No live ServiceNow implication is introduced.
- Alan’s manual-review checklist is present and actionable.
