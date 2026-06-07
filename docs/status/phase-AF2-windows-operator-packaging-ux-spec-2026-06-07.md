# Phase AF2 — Windows Operator Packaging + Dedicated Chromium Runtime Readiness UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only Windows package handoff surface and dedicated Chromium runtime readiness copy

## 0. Preflight

Goal
- Define the exact copy and layout for a local-only Windows package handoff surface that starts with the UNC path Alan should test, then shows checksum, mtime, and what changed in one glance.
- Make the dedicated Chromium runtime readiness path readable and explicit without widening the product into a launch wizard or a live ServiceNow surface.
- Preserve the existing safety boundary: local-only, text-only by default, and human-reviewed before anything broader is introduced.

Known facts
- Repo: `/home/alanxwsl/projects/servicenow-automation`
- Task: `t_f9467549`
- Latest packaged Windows zip exists locally and is the current AF1 handoff artifact.
- Known artifact metadata from AF1:
  - Package: `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip`
  - Windows UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip`
  - SHA256: `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde`
  - mtime: `2026-06-07 02:00:01 CST`
  - Size: `118,590,385 bytes` (~114 MB)
- Current local guidance docs already say the packaged artifact is local-only, the runtime is tool-owned, and the operator path must stay text-only unless a separate reviewed checkpoint authorizes more.
- The Windows runtime paths of interest are `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser\chrome.exe` and `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`.

Assumptions
- Alan wants the first visible line to be the exact package path, not a generic release title.
- The handoff surface should remain usable on a clean Windows machine and in repo docs without extra tooling.
- “What changed” should be short enough to read before the user decides whether to retest.
- The dedicated Chromium runtime should be described as a readiness prerequisite, not as a general-purpose browser feature.

Ambiguities
- Whether the handoff is primarily a doc-local surface, an in-app surface, or both.
- Whether the surface should show archived rc/ad/ab packages in a side list or only as a “stale” warning.
- Whether the runtime readiness chip should show one combined state or separate CloakBrowser/Chromium sub-states.

Chosen smallest approach
- Specify a compact, read-only three-region surface: package recency on the left, package facts in the center, runtime readiness plus quickstart/checklist on the right.
- Keep the copy literal and local-only.
- Treat stale packages as visually demoted archival items, not as equivalent candidates.
- Avoid any new runtime authority, auto-download behavior, or live ServiceNow implication.

Files likely affected
- `docs/status/phase-AF2-windows-operator-packaging-ux-spec-2026-06-07.md` only

Verification plan
- Check that the first visible line starts with the exact Windows UNC path Alan should test.
- Check that checksum, mtime, and what-changed copy appear together in one compact metadata strip.
- Check that the text clearly distinguishes current vs stale rc/ad/ab artifacts.
- Check that the document stays local-only, text-only by default, and does not imply any live ServiceNow action.

## 1. Purpose

Turn the Windows package handoff into one visible place where Alan can answer, in one glance:

1. What exact file should I test?
2. Is it still the latest local build?
3. What changed since the last validation round?
4. Is the dedicated Chromium runtime ready yet?
5. What remains human-only?

This is not a new execution surface. It is a local-only handoff and validation aid.

The surface should feel like a calm operator command center, not a demo page, not a release dashboard, and not a vertical card dump.

## 2. Research and design references

Design cues used for this spec:

- The existing AF1 scope doc in this repo: it defines the packaging/runtime readiness gap and the AF1 package metadata.
- The Windows operator quickstart doc in this repo: it already names the dedicated runtime roots and the operator boundary.
- Modern command-center layouts: clear “current item” first, metadata directly beneath, and compact right-rail readiness states.
- Desktop workbench patterns: visible state, short labels, and progressive disclosure instead of a long diagnostics wall.

Design takeaways for this task:

- Put the exact artifact path first.
- Keep checksum, mtime, and change summary together.
- Make runtime readiness visible but compact.
- Treat stale packages as archival, not merely older options.
- Avoid raw ServiceNow URLs, ticket IDs, or any copy that implies a write action.

## 3. Layout wireframe in text

This spec supports a local-only handoff surface with three visible regions.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Windows Package Handoff                                                                                    │
│ \wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip │
│ Alan should test this file first.                                                                         │
├───────────────────────────────────────────────┬──────────────────────────────────────────────┬─────────────────┤
│ Package recency / archival list               │ Current package facts                         │ Runtime readiness │
│ - latest badge                                │ - SHA256                                      │ - Chromium runtime │
│ - current package highlighted                 │ - mtime                                       │ - CDP status       │
│ - older rc/ad/ab packages visually demoted    │ - what changed                                │ - launch checklist │
│ - stale warning banner                        │ - local-only safety summary                   │ - copy/open actions │
├───────────────────────────────────────────────┴──────────────────────────────────────────────┴─────────────────┤
│ Quickstart / checklist strip                                                                                 │
│ 1. Open the latest local package. 2. Double-click the packaged app. 3. Start QA Chromium. 4. Wait for CDP.   │
│ 5. Keep the flow text-only and local-only unless a separate reviewed checkpoint authorizes more.             │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Recommended behavior:

- The first visible line must be the exact Windows UNC path.
- The package facts strip must keep checksum, mtime, and what changed together.
- The runtime readiness region should answer “is the dedicated browser ready?” without a long diagnostic essay.
- The quickstart strip should stay short enough to read before any click.
- Stale rc/ad/ab artifacts should never look current.

## 4. Surface responsibilities

### Left region — package recency and archival control
Owns package selection, recency, and stale-package warning.

It should answer:

- Which package is the latest local build?
- Is the current row highlighted as the one Alan should test?
- Are there older rc/ad/ab artifacts nearby that should not be mistaken for current?
- Is the selected file clearly archival or current?

Include:

- current/latest badge
- recent local package list
- stale-package warning
- archival demotion for rc/ad/ab artifacts

Rules:

- Do not make the left side a long release log.
- Do not bury the latest path under older artifacts.
- Keep each row short enough to scan in one glance.
- Stale packages must be visibly older, quieter, and explicitly not current.

### Center region — current package facts
Owns the exact file and the metadata needed for validation.

It should answer:

- What exact file should Alan test?
- What is the checksum?
- When was it built?
- What changed since the last round?
- Why should this package be retested now?

Include:

- exact UNC path
- SHA256
- mtime
- one-line change summary
- local-only safety summary
- short why-retest copy

Rules:

- The UNC path must be the first visible line of the surface.
- The center must preserve the order: path → checksum → mtime → what changed → why retest.
- The center must not introduce any live ServiceNow implication.
- The center must stay readable without expanding a details drawer.

### Right region — runtime readiness and local actions
Owns the Chromium readiness story, quickstart, and local actions.

It should answer:

- Is the dedicated Chromium runtime present?
- Is CDP ready, disconnected, or blocked?
- What should Alan do next if the runtime is missing?
- What can be copied or opened locally right now?

Include:

- Chromium runtime readiness chip
- CDP readiness chip
- package folder action
- copy path / copy SHA / copy summary actions
- quickstart checklist
- compact safety boundary copy

Rules:

- Actions must be local-only.
- Disabled states must explain why they are disabled.
- No action may imply Save / Submit / Update / Resolve / Close.
- No action may imply a browser profile or runtime outside the tool-owned path.

## 5. State matrix

| State | Left region | Center region | Right region |
| --- | --- | --- | --- |
| Empty | No package chosen yet; latest candidate hinted at | Shows the prompt to open the latest local handoff first | Copy/open actions disabled with reasons |
| Current package selected | Latest row highlighted | Path/checksum/mtime/what-changed appear immediately | Runtime actions available only if readiness exists |
| Stale archive selected | Older rc/ad/ab row selectable but clearly not current | Warning explains this is archival only | Latest-only copy action is de-emphasized or disabled |
| Runtime missing | Current package still visible | Metadata remains visible and safe | Chromium chip shows blocked/not found with next-step copy |
| Chromium ready | Current package visible | Change summary remains readable | Start QA Chromium / Verify gating can proceed |
| CDP connected | Current package visible | No layout shift | Verify current Incident becomes eligible if the product gate allows it |
| Human-review needed | Package and metadata remain visible | Quickstart/checklist becomes the primary next step | Local-only actions stay enabled; write-like actions remain blocked |
| Error | No safe package metadata can be trusted | Center keeps last safe known info and explains the failure | Actions stay disabled until metadata is restored |

Notes:

- Avoid spinner-only states.
- Use muted placeholders or short status text while metadata is resolving.
- Keep the last safe package visible whenever possible.
- A stale package must never look like the current file by color alone.

## 6. Main components

- header with Windows package handoff title
- first-line UNC path banner
- metadata strip for SHA256 / mtime / what changed
- current-package facts panel
- stale-package warning banner
- dedicated Chromium runtime readiness chip
- CDP readiness chip
- quickstart strip
- local-only safety summary
- copy/open local actions row
- archived-package list with demotion styling

## 7. Empty, loading, and error states

### Empty states
- Use one sentence and one next action.
- Avoid giant blank panels.
- Keep the surface calm and local-only.

Recommended copy:
- `No local package selected yet.`
- `Open the latest handoff to begin.`
- `The UNC path, checksum, and mtime will appear here.`

### Loading states
- Use muted placeholders, not a spinner wall.
- Keep the current selection visible if metadata is still resolving.
- Prefer progress language over a generic busy icon.

Example copy:
- `Resolving the latest local package...`
- `Loading checksum and mtime...`
- `Preparing the runtime readiness summary...`

### Error states
- Show the exact step that failed.
- Keep the previous safe package visible if one exists.
- Explain the failure in plain language.

Example copy:
- `The latest package could not be resolved.`
- `Checksum verification is unavailable right now.`
- `Open the last safe handoff or refresh the local package list.`
- `Dedicated Chromium runtime not found.`

## 8. Button enable / disable logic

### Copy path
Enabled when:

- a valid package path is present
- the selection is current or intentionally archived

Disabled when:

- no package is selected
- the selected path is missing or invalid

Disabled reason:
- `Select a local package first.`

### Copy SHA256
Enabled when:

- checksum is present and trusted

Disabled when:

- checksum is missing
- checksum cannot be verified

Disabled reason:
- `Checksum is not available yet.`

### Copy what changed
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

### Start QA Chromium
Enabled when:

- the dedicated Chromium runtime exists in the tool-owned runtime path
- the runtime readiness chip is not blocked

Disabled when:

- the runtime is missing
- the runtime is incomplete
- the selection is stale and the handoff is not current

Disabled reason:
- `Dedicated Chromium is not ready yet. Run the runtime setup step first.`

### Verify current Incident
Enabled when:

- CDP readiness is connected
- the runtime is current and healthy

Disabled when:

- CDP is disconnected
- the runtime is missing
- the product gate has not been satisfied

Disabled reason:
- `Connect the dedicated Chromium runtime first.`

### Open quickstart/checklist
Enabled when:

- the handoff is readable and the package metadata is present

Disabled when:

- the surface is empty or in an error state

Disabled reason:
- `Open the latest handoff before reviewing the checklist.`

### General rules
- Never hide a useful local action without explaining why.
- Never imply a write action exists.
- Never offer Save / Submit / Update / Resolve / Close language.
- Keep disabled reasons short and visible next to the control.
- Prefer read-only status chips over long debug paragraphs.

## 9. Copy text

### First-line path pattern
- `\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip`
- `Alan should test this file first.`

### Metadata strip
- `SHA256: 4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde`
- `mtime: 2026-06-07 02:00:01 CST`
- `What changed: refreshed Windows handoff packaging, local launch helpers, dedicated Chromium runtime readiness copy, and updated startup guidance`

### Why retest copy
- `This is the latest local package for the Windows operator packaging and runtime readiness round.`
- `Retest it now to confirm the package still reads clearly before any further implementation.`
- `This surface is local-only and does not imply any live ServiceNow action.`

### Runtime readiness copy
- `Dedicated Chromium runtime: not found yet.`
- `Dedicated Chromium runtime: ready.`
- `CDP readiness: disconnected.`
- `CDP readiness: connected.`
- `Start QA Chromium is disabled until the tool-owned runtime is ready.`

### Stale-package warning copy
- `Older rc/ad/ab packages are archival only.`
- `If a package is not marked latest, do not treat it as the current test target.`
- `The latest badge wins over filename familiarity.`

### Human-only copy
- `No live ServiceNow login.`
- `No Save / Submit / Update / Resolve / Close.`
- `No external write paths.`
- `No raw customer or ticket data.`
- `Text-only unless a separate reviewed checkpoint authorizes more.`

### Quickstart / checklist copy
- `Open the latest local package first.`
- `Double-click the packaged Windows app.`
- `Run the dedicated Chromium readiness step only from the tool-owned runtime path.`
- `Wait for CDP to show connected before considering Verify.`
- `Stop if the package is stale, the runtime is missing, or the state is ambiguous.`

### Copy to avoid in the primary surface
- raw ServiceNow URLs or hosts
- ticket IDs or sys_ids
- customer names or email addresses
- save/submit/update/resolve/close wording
- demo clutter such as mock-provider labels
- long debug prose
- screenshot-like visual dumps

## 10. Accessibility notes

- Warm/light theme by default; avoid pure black surfaces.
- Use large click/touch targets for the copy, open, and launch actions.
- Keep line length readable for eye comfort.
- Make the exact UNC path unmistakable in the hierarchy.
- Keep disabled reasons readable and close to the disabled control.
- Do not rely on color alone to distinguish current vs stale package state.
- Use sufficient contrast for timestamps and metadata labels.
- Preserve keyboard navigation for copy/open/checklist/runtime actions.

## 11. GPT Images 2 mockup notes

Attempted sanitized mockups with `image_generate` using fake/local-only data:

- landscape warm-light three-column operator workbench concept
- simplified warm-light metadata strip concept

Result:
- both image generation attempts returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

Retained prompts for a later image-capable rerun:

1. Three-column local package handoff panel
   - Warm light local handoff surface with the exact UNC path first, checksum and mtime beneath it, a concise what-changed panel, and a runtime readiness panel. Fake data only, no live ServiceNow, no ticket IDs, no raw URLs.
2. Metadata strip detail
   - Warm light validation strip showing UNC path, SHA256, mtime, and a one-line change summary with large readable type and local-only copy actions. Sanitized fake data only.

## 12. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented later in frontend code, keep the change set surgical and local-only.

Implementation requirements:

1. Preserve the current safety model.
2. Keep the handoff surface read-only.
3. Surface the exact UNC path first.
4. Show SHA256, mtime, and one-line change summary together.
5. Keep the stale warning and runtime readiness copy adjacent to the package facts.
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
- Verify the stale warning clearly separates archive files from the current test target.
- Confirm the runtime readiness chip explains why Start QA Chromium is enabled or disabled.
- Confirm the panel does not imply any live ServiceNow write action.
- Confirm copy/open/checklist/runtime actions are local-only and explain disabled states.
- Confirm the main workbench center-order narrative remains unchanged.
- Approve the spec or send it back if any line suggests a write action or stale package.

## 14. Acceptance criteria recap

This spec is ready for AF3 only when all of the following are true:

- The first visible line is the exact latest Windows UNC path.
- The surface shows SHA256, mtime, and a one-line change summary together.
- The surface explains why retesting matters.
- The surface clearly marks stale rc/ad/ab artifacts as archival only.
- The surface makes dedicated Chromium readiness visible without a long diagnostics wall.
- The design preserves the local-only and text-only safety boundary.
- No live ServiceNow implication is introduced.
- Alan’s manual-review checklist is present and actionable.
