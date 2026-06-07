# Phase AU2 — Release Readiness Handoff Current-Package Path and Summary Clarity — UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan first, then `sna-frontend-workbench` after approval
Privacy level: sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Preflight

Goal
- Define the exact UX and copy for the Release Readiness Handoff card so the current-package path is the first thing Alan can use to test the build.
- Make the clipboard summary reflect the current package metadata, not a stale-looking alias.
- Keep archival-only aliases clearly labeled as archival-only.
- Avoid any layout redesign beyond the smallest copy and state-text changes needed for clarity.

Known facts
- Repo: `/home/alanxwsl/projects/servicenow-automation`
- Current local package baseline from AU1 ground truth:
  - Filename: `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip`
  - Windows UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip`
  - SHA256: `4f459b7a8c603a04a430e089d89a304d8bd844f27ffe5a460cad04a056ade328`
  - mtime: `2026-06-07 13:45:32 CST`
  - archival aliases: `AS6`, `AR3`, `AQ6`
- The wider workbench spec already exists; this task is intentionally narrower and should not introduce new layout behavior.
- No live ServiceNow operations, external writes, or broad UI redesign are allowed.

Assumptions
- Alan wants one clear “current package” line he can trust immediately.
- A single concise summary copy surface is better than a verbose metadata dump.
- Archival aliases are still useful, but only as secondary reference material.

Ambiguities
- Whether the current-package path line should be a selectable code-style line or a label/value row.
- Whether archival aliases should have their own copy action or remain display-only.
- Whether the summary copy should include the UNC path verbatim or only the filename plus checksum/mtime.

Chosen smallest approach
- Preserve the existing handoff card and only adjust copy, labels, and disabled-state text.
- Put the exact current-package path first, then the summary, then archival-only aliases.
- Keep the clipboard summary one line and metadata-based.
- Use plain-language disabled reasons that explain loading vs unavailable states.

Files likely affected
- `docs/status/phase-AU2-release-readiness-handoff-current-package-path-and-summary-clarity-ux-spec-2026-06-07.md` only for this task
- Later implementation would likely touch `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, and `apps/desktop/src/App.test.ts`

Verification plan
- Cross-check the copy against the AU1 current-package baseline.
- Confirm the spec stays local-only and does not imply any ServiceNow write path.
- Confirm the spec gives `sna-frontend-workbench` a surgical implementation target with no layout churn.

## 1. Research and design references

Public reference patterns used as direction, not branding:
- Claude Code docs: clear separation of navigation, work state, and action surfaces; obvious command labels; visible status near the action.
- Open Design binding already present in this repo (`claude` + `web-prototype-taste-editorial`): warm editorial tone, calm hierarchy, readable contrast, progressive disclosure.
- Existing operator workbench spec in `docs/design/operator-workbench-three-column-spec.md`: settings remain first-class; runtime actions stay obvious; safety stays compact.

Design takeaways for this task:
- Put the exact artifact path first.
- Keep the path, summary, and archival-only aliases visually distinct.
- Make disabled reasons visible and short.
- Avoid any copy that makes archival aliases look like the latest build.
- Use warm/light surfaces and large targets, but do not expand the layout.

## 2. UX direction

This task does not change the workbench structure. It only clarifies the Release Readiness Handoff card so Alan can quickly answer:

1. What exact current package should I test?
2. What should I copy for the handoff summary?
3. Which names are archival-only and not current?
4. Why is a button disabled right now?

The card must read as a calm local handoff surface, not a release dashboard, demo panel, or log dump.

### Mandatory order inside the card

```text
Release Readiness Handoff
Alan should test this file first.
Current package path
Current package summary
Archival-only aliases
Copy / open actions
Manual checklist
```

Rules:
- The current-package path line must be the first actionable content in the card.
- Archival-only aliases must be visually labeled as archival-only wherever they appear.
- The summary copy surface must describe the current package metadata, not an archival alias.
- No broad layout redesign, no new navigation, no new mode switch.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Release Readiness Handoff                                                     │
│ Alan should test this file first.                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Current package path                                                          │
│ └─ \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip │
│                                                                              │
│ Current package summary                                                       │
│ └─ Current package: servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip | path: ... | SHA256: ... | mtime: ... | archival-only aliases: AS6, AR3, AQ6 │
│                                                                              │
│ Archival-only aliases                                                         │
│ └─ AS6   AR3   AQ6                                                            │
│                                                                              │
│ [Copy current package path] [Copy current package summary] [Open package folder] [Open checklist] │
│                                                                              │
│ Manual checklist                                                              │
│ - ...                                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

Recommended visual treatment:
- The current-package path should be styled like selectable code or a high-visibility value row.
- The summary should be a single readable line with wrapping allowed only if needed.
- The archival-only aliases should be low-emphasis chips or a compact inline list.
- The copy/open buttons should be large, warm, and easy to hit.

## 4. Exact labels and button text

### Card labels
- `Release Readiness Handoff`
- `Alan should test this file first.`
- `Current package path`
- `Current package summary`
- `Archival-only aliases`
- `Manual checklist`

### Buttons
- `Copy current package path`
- `Copy current package summary`
- `Open package folder`
- `Open checklist`

### Alias label rules
- Use `Archival-only aliases` exactly.
- Do not shorten it to `Aliases` in the primary UI.
- If a chip or tag is used, prefix the cluster with `archival-only` or keep the heading explicit.

## 5. Exact clipboard summary format

The `Copy current package summary` action should copy a single line in this order:

`Current package: {filename} | path: {UNC path} | SHA256: {sha256} | mtime: {mtime} | archival-only aliases: {alias-list}`

Example using the current baseline:

`Current package: servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip | path: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip | SHA256: 4f459b7a8c603a04a430e089d89a304d8bd844f27ffe5a460cad04a056ade328 | mtime: 2026-06-07 13:45:32 CST | archival-only aliases: AS6, AR3, AQ6`

Rules for the clipboard surface:
- The summary must begin with `Current package:`.
- The summary must not begin with an alias.
- The summary must not use a stale generic phrase such as `updated metadata`.
- The summary should always prefer current-package metadata first, then archival-only aliases last.

## 6. Disabled-state copy

Use the same short, plain-language disabled reasons across all current-package-dependent actions.

### While package metadata is loading
- Disabled reason: `Current package metadata is still loading.`

### When package metadata is unavailable
- Disabled reason: `Current package metadata is unavailable.`

### Optional supporting text
- `Wait for the current package to resolve before copying.`
- `The summary cannot be copied until the current package is available.`

Rules:
- Do not use separate jargon for path vs summary vs checklist unless the reason truly differs.
- Keep the disabled reason visible next to the disabled control.
- Avoid spinner-only feedback.
- Do not hide the action without explaining why.

## 7. State matrix

| State | Current package path | Current package summary | Archival-only aliases | Actions |
| --- | --- | --- | --- | --- |
| Loading | Placeholder or muted text | Placeholder or muted text | Hidden or muted until resolved | Disabled with `Current package metadata is still loading.` |
| Available / current | Exact UNC path visible first | One-line metadata summary visible | Clearly labeled archival-only chips | Copy/open actions enabled |
| Unavailable | Show `Current package metadata is unavailable.` | Summary replaced with the same unavailable state | Hidden or clearly secondary | Copy/open actions disabled with the unavailable reason |
| Archived reference only | Not treated as current | Summary not presented as current-package data | Visible and explicitly archival-only | Current-package copy actions disabled or de-emphasized |

Notes:
- The UI should keep the last safe current-package value visible whenever possible.
- A stale archival alias must never look like the active build.
- Error states should be calm and explicit, not alarming.

## 8. Main components

Keep the component set small and local to the existing handoff card.

- `ReleaseReadinessHandoffCard`
- `CurrentPackagePathLine`
- `CurrentPackageSummaryRow`
- `ArchivalOnlyAliasStrip`
- `HandoffActionRow`
- `ManualChecklistPanel`
- `LoadingUnavailableHint`

Component rules:
- Do not introduce a new page.
- Do not introduce a new mode switch.
- Do not add new IPC surfaces unless absolutely unavoidable.
- Keep the copy actions local-only.

## 9. Empty, loading, and error copy

### Empty
- `No current package selected yet.`
- `Wait for the latest local build to appear.`

### Loading
- `Current package metadata is still loading.`
- `Preparing the current package path and summary...`

### Error / unavailable
- `Current package metadata is unavailable.`
- `Open the latest local handoff again or refresh the package list.`

### Archive-only clarification
- `These aliases are archival-only.`
- `Use the current package path above to test the build.`

## 10. Manual-review checklist for Alan

- Confirm the first visible content in the card is the current package path.
- Confirm the clipboard summary starts with `Current package:` and not with an alias.
- Confirm archival-only aliases are explicitly labeled as archival-only.
- Confirm disabled actions say the metadata is still loading or unavailable.
- Confirm the panel stays read-only and local-only.
- Confirm the copy/open actions feel surgical, not like a redesign.
- Confirm no copy suggests an archival alias is the current build.

## 11. Accessibility notes

- Keep the current package path readable at a glance and selectable for copy/paste.
- Use large touch/click targets for copy and open actions.
- Keep disabled reasons adjacent to the buttons, not in distant helper text.
- Do not rely on color alone to distinguish current vs archival-only.
- Keep the summary line short enough to scan quickly, with wrapping only as needed.
- Preserve keyboard navigation for copy and open actions.

## 12. GPT Images 2 mockup notes

Attempted sanitized mockups with `image_generate` using fake/local-only data:
- warm-light three-column operator handoff panel
- compact current-package path and summary strip

Result:
- both image generation attempts returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

Retained prompt direction for a later image-capable rerun:
- Warm-light release-readiness handoff card with the current package path first, a one-line metadata summary beneath it, archival-only aliases clearly labeled, and large local-only copy buttons. Fake data only, no real URLs, no ticket IDs, no raw ServiceNow content.

## 13. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented later in frontend code, keep the change surgical and local-only.

Implementation requirements:
1. Preserve the existing handoff card and workbench structure.
2. Put the current package path first in the card’s visual flow.
3. Make the clipboard summary metadata-based and current-package-first.
4. Label archival aliases as archival-only everywhere they appear.
5. Use the same plain-language disabled reason for loading/unavailable states.
6. Do not add any new write path or live ServiceNow implication.
7. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

## 14. Acceptance criteria recap

This spec is ready for frontend implementation only when all of the following are true:
- The current package path is the first visible thing Alan can use to test the build.
- The summary clipboard surface reflects the current package metadata, not a stale alias.
- Archival-only aliases are clearly labeled as archival-only.
- Disabled reasons are explicit for loading and unavailable states.
- The change stays local-only, read-only, and surgically small.
- No broad layout redesign is introduced.
- Alan can review the spec without seeing any ambiguous alias-first copy.
