# Phase BD2 — Current Package UNC Prefix Derivation — UX/Copy Spec

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Preflight

Goal
- Define the exact handoff-card UX and copy for the current-package UNC prefix so Alan always sees one explicit current package path.
- Make the path derivation feel runtime-derived and portable, not hardcoded to one WSL distro name.
- Keep copy/open actions honest when the distro/prefix source is unavailable.
- Avoid any layout redesign or new live integration.

Known facts
- Repo: `/home/alanxwsl/projects/servicenow-automation`
- Current local package baseline from BD1:
  - Filename: `servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip`
  - Windows UNC path currently displayed in the workbench: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip`
  - The renderer currently hardcodes `Ubuntu-Compact` in `formatPackagePathForDisplay()`
- The broader three-column operator workbench spec already exists; this task is intentionally narrower and should not change the overall shell.
- OpenDesign is bound to this repo with a warm editorial baseline (`claude` + `web-prototype-taste-editorial`).

Assumptions
- Alan wants the current package path to remain the primary object in the handoff card.
- If the runtime cannot derive a distro name, the UI should be explicit about unavailability rather than silently inventing a plausible-looking path.
- A single concise clipboard summary is better than a verbose log-style dump.

Ambiguities
- Whether fallback should display `unknown distro` inline or replace the entire path line with an unavailable message.
- Whether summary copying should remain enabled when only the path source is unavailable.
- Whether the UI should expose a small “path source” note or keep the card limited to path + summary + actions.

Chosen smallest approach
- Preserve the existing handoff card structure and only refine labels, state text, and clipboard behavior.
- Keep the current package path line first and visually dominant.
- Keep the summary one line and metadata-first.
- Use short, plain disabled reasons that explain loading vs unavailable states.

Files likely affected
- This doc only for the current task.
- Later implementation would likely touch `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, and `apps/desktop/src/App.test.ts`.

Verification plan
- Cross-check that the exact labels below do not imply a redesign.
- Confirm the copy remains local-only and does not imply ServiceNow writes or external calls.
- Confirm the spec gives `sna-frontend-workbench` a surgical implementation target.

## 1. Research and design references

Public reference patterns used as direction, not branding:
- Claude Code-style work surfaces: calm command-center layout, visible action readiness, clear status near the action.
- OpenDesign warm editorial baseline: parchment-toned canvas, warm neutrals, readable hierarchy, progressive disclosure.
- Existing operator workbench spec in `docs/design/operator-workbench-three-column-spec.md`: settings remain first-class; runtime controls stay obvious; safety stays compact.

Design takeaways for this task:
- Put the exact current package path first.
- Keep the path and summary visually distinct.
- Make disabled reasons visible and short.
- Avoid any copy that makes a fallback look like a confirmed path.
- Use warm/light surfaces and large targets, but do not expand the layout.

## 2. UX direction

This task does not change the workbench structure. It only clarifies the Release Readiness Handoff card so Alan can quickly answer:

1. What exact current package should I test?
2. How do I copy the path and summary?
3. What happens if the runtime cannot derive the WSL distro name?
4. Why is a copy button disabled right now?

The card must read as a calm local handoff surface, not a release dashboard, demo panel, or log dump.

### Mandatory order inside the card

```text
Release Readiness Handoff
Alan should test this file first.
Current package path
Current package summary
Path source / runtime status
Copy actions
Manual checklist
```

Rules:
- The current-package path line must be the first actionable content in the card.
- The runtime source note, if shown, must be compact and secondary.
- The summary copy surface must describe the current package metadata, not an archival alias.
- No broad layout redesign, no new navigation, no new mode switch.

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Release Readiness Handoff                                                     │
│ Alan should test this file first.                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ Current package path                                                          │
│ └─ \\wsl.localhost\<runtime-distro>\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip │
│                                                                              │
│ Current package summary                                                       │
│ └─ Current package: servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip | path: ... | SHA256: ... | mtime: ... │
│                                                                              │
│ Path source / runtime status                                                  │
│ └─ WSL distro resolved at runtime · portable prefix active                   │
│                                                                              │
│ [Copy current package path] [Copy current package summary] [Open package folder] │
│                                                                              │
│ Manual checklist                                                              │
│ - ...                                                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

Recommended visual treatment:
- The current-package path should be styled like selectable code or a high-visibility value row.
- The summary should be a single readable line with wrapping allowed only if needed.
- The runtime status note should be a low-emphasis helper line, not a banner.
- The copy/open buttons should be large, warm, and easy to hit.

## 4. Exact labels and button text

### Card labels
- `Release Readiness Handoff`
- `Alan should test this file first.`
- `Current package path`
- `Current package summary`
- `Path source / runtime status`
- `Manual checklist`

### Buttons
- `Copy current package path`
- `Copy current package summary`
- `Open package folder`

### Runtime status labels
Use one of these exact runtime notes when relevant:
- `WSL distro resolved at runtime · portable prefix active`
- `Resolving WSL distro name...`
- `WSL distro unavailable · path cannot be derived`
- `Current package path unavailable`

### Label rules
- Use `Current package path` exactly.
- Use `Current package summary` exactly.
- Do not shorten the runtime note to a generic `Status`.
- Do not expose a fake distro name in fallback UI.

## 5. Exact clipboard behavior

### Copy current package path
Copy only the UNC path string, with no label, no quotes, and no trailing whitespace.

Example:
`\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bc6-20260607-local.zip`

Rules:
- If runtime derivation succeeds, the clipboard path must use the derived distro segment.
- If runtime derivation fails, the copy action must be disabled.
- Do not copy a placeholder path that looks valid but is not confirmed.

### Copy current package summary
Copy one line in this order:

`Current package: {filename} | path: {UNC path} | SHA256: {sha256} | mtime: {mtime}`

Rules:
- The summary must begin with `Current package:`.
- The summary must include the derived path, not a hardcoded distro name.
- The summary must not begin with an alias or a generic phrase like `updated metadata`.
- If the path is unavailable, the summary copy action must be disabled.

### Disabled-state copy
Use plain-language reasons that explain the exact state:
- `Resolving the WSL distro name now.`
- `Current package path is unavailable.`
- `Current package metadata is still loading.`

Keep disabled reasons visible next to the disabled control.

## 6. State matrix

| State | Current package path | Current package summary | Runtime status note | Actions |
| --- | --- | --- | --- | --- |
| Empty | `No current package selected yet.` | Hidden or muted placeholder | `Waiting for the current package to resolve.` | Disabled with `Current package metadata is still loading.` |
| Loading | Placeholder or muted text | Placeholder or muted text | `Resolving WSL distro name...` | Disabled with `Resolving the WSL distro name now.` |
| Current / available | Exact UNC path visible first | One-line metadata summary visible | `WSL distro resolved at runtime · portable prefix active` | Copy/open actions enabled |
| Unavailable | `Current package path unavailable.` | Summary replaced with the same unavailable state | `WSL distro unavailable · path cannot be derived` | Copy/open actions disabled with the unavailable reason |

Notes:
- The UI should keep the last safe current-package value visible whenever possible.
- A fallback state must never look like a confirmed package path.
- Error states should be calm and explicit, not alarming.

## 7. Main components

Keep the component set small and local to the existing handoff card.

- `ReleaseReadinessHandoffCard`
- `CurrentPackagePathLine`
- `CurrentPackageSummaryRow`
- `RuntimeStatusNote`
- `HandoffActionRow`
- `ManualChecklistPanel`
- `LoadingUnavailableHint`

Component rules:
- Do not introduce a new page.
- Do not introduce a new mode switch.
- Do not add new IPC surfaces unless absolutely unavoidable.
- Keep the copy actions local-only.

## 8. Empty, loading, and error copy

### Empty
- `No current package selected yet.`
- `Wait for the latest local build to appear.`

### Loading
- `Current package metadata is still loading.`
- `Resolving WSL distro name...`

### Error / unavailable
- `Current package path unavailable.`
- `WSL distro unavailable · path cannot be derived.`

### Runtime clarification
- `WSL distro resolved at runtime · portable prefix active.`
- `The path uses the local runtime distro name, not a hardcoded prefix.`

## 9. Manual-review checklist for Alan

- Confirm the first visible content in the card is the current package path.
- Confirm the path uses a runtime-derived WSL distro segment, not a hardcoded one.
- Confirm the clipboard path copies only the UNC path string.
- Confirm the clipboard summary starts with `Current package:` and includes the derived path.
- Confirm the UI says `Resolving WSL distro name...` while loading.
- Confirm unavailable state does not fake a valid UNC path.
- Confirm disabled actions say the path is loading or unavailable.
- Confirm the panel stays read-only and local-only.
- Confirm the copy/open actions feel surgical, not like a redesign.

## 10. Accessibility notes

- Keep the current package path readable at a glance and selectable for copy/paste.
- Use large touch/click targets for copy and open actions.
- Keep disabled reasons adjacent to the buttons, not in distant helper text.
- Do not rely on color alone to distinguish current vs loading vs unavailable.
- Keep the summary line short enough to scan quickly, with wrapping only as needed.
- Preserve keyboard navigation for copy and open actions.

## 11. GPT Images 2 mockup notes

Attempted a sanitized mockup with `image_generate` using fake/local-only data:
- warm-light release handoff card
- current package path and runtime status line

Result:
- the image generation call returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

Retained prompt direction for a later image-capable rerun:
- warm-light operator handoff card
- one explicit current package path
- compact runtime status note
- sanitized fake data only
- no real URLs, no ticket IDs, no logs, no screenshots

## 12. Implementation handoff for `sna-frontend-workbench`

What to change later
- Keep the existing Release Readiness Handoff card.
- Replace the hardcoded distro text with a runtime-derived prefix.
- Preserve the current package path as the primary line.
- Keep the summary clipboard format one-line and metadata-first.
- Add a small runtime status note for loading/unavailable states.
- Disable copy actions when the path source is unavailable.

Why this is the smallest safe change
- It preserves the current card and overall workbench shell.
- It only narrows copy, states, and action enablement.
- It does not introduce a new integration surface or a broader redesign.
- It keeps the user-facing behavior honest when runtime derivation cannot succeed.

Remaining risk
- If the renderer cannot access a reliable runtime distro name source, the unavailable state must stay explicit rather than guessing.
