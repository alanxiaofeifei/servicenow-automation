# Phase BH2 — Release Readiness Handoff: Current-Package Marker and Path Clarity — UX / Copy Spec

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-ui-designer`  
**Task:** `t_ac7ba087`  
**Audience:** Alan first, then `sna-frontend-workbench` after approval  
**Privacy level:** sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, customer names, or customer data.

---

## 0. Preflight

**Goal**  
Define the exact UX/copy for the current-package marker and path clarity so the handoff always surfaces the freshest dated local Windows package first, while stale BF6 language is clearly demoted to archival history.

**Known facts**
- This is a spec-only task: no runtime change, no browser automation, no package rebuild.
- The current local package marker is `dist/release/CURRENT.txt`.
- `CURRENT.txt` currently points to the BG6 package:
  - package name: `servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip`
  - Windows UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip`
  - SHA-256: `1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb`
- Earlier phase-letter packages exist in `dist/release/` and should be treated as archival aliases, not current guidance.
- The specific UX risk is stale BF6 wording dominating the handoff even though BG6 is current.

**Assumptions**
- Alan wants the handoff to read like a clear operator asset summary, not a runbook lecture.
- The same copy should work in the on-screen handoff card, the START-HERE sidecar, and the runbook package-location block.
- The smallest safe change is to keep the structure simple and only change hierarchy, label precedence, and disabled-state text.

**Ambiguities**
- Whether the archive list should show all historical aliases or only the most recent predecessor aliases.
- Whether the current marker should appear as a chip, a status line, or both.
- Whether checksum visibility should be inline or copy-first with hover text.

**Chosen smallest approach**
- Make `CURRENT.txt` the visible source-of-truth anchor at the top of the handoff.
- Put the BG6 package name, UNC path, and checksum in one dominant current-package block.
- Demote BF6 and older labels into a collapsed or secondary archival block.
- Use the same exact disabled/reason copy everywhere a stale alias can appear.
- Avoid adding new product surfaces; only define copy and state ordering.

**Files likely affected**
- `docs/status/phase-BH2-release-readiness-handoff-current-package-marker-and-path-clarity-ux-spec-2026-06-07.md` (new)
- Later implementation would likely touch the handoff card renderer, START-HERE generator, and runbook package-location block.

**Verification plan**
- Confirm the spec makes `CURRENT.txt` the source of truth.
- Confirm the BG6 UNC path appears before any archival alias.
- Confirm BF6 is explicitly labeled archival-only and visually secondary.
- Confirm disabled/reason copy is short, plain, and safe.
- Confirm no live ServiceNow or other restricted actions are implied.

---

## 1. Research and design references

Public reference patterns used as direction, not branding:
- Codex-style command-center layout: current work, readiness, and action affordances appear together.
- Claude Code-style desktop surfaces: compact status, strong hierarchy, and calm warm-light rhythm.
- Antigravity-style manager/editor/artifact model: current state first, supporting history second.
- Existing operator workbench specs in this repo: warm/light shell, progressive disclosure, and large readable runtime controls.

OpenDesign note:
- The project’s bound design system is `claude`.
- The bound template is `web-prototype-taste-editorial`.
- That pairing implies warm parchment-like surfaces, strong hierarchy, and editorial spacing rather than dense dashboard styling.

Design takeaways for this task:
- Put the current marker first, not buried in a note.
- Show the exact UNC path before archival references.
- Treat archival aliases as history, not as the thing Alan should act on.
- Keep disabled reasons short and plain-language.
- Use readable spacing and large click/tap targets for the handoff card.

---

## 2. Scope framing

This task only changes the copy hierarchy and state language around the current package handoff.

It should answer:
1. What exact package is current right now?
2. What exact UNC path should Alan paste into File Explorer?
3. What checksum should he verify?
4. Which names are archival aliases only?
5. What exact text should a disabled stale alias state show?

### Intended user story

Alan opens the refreshed handoff and immediately sees:
- the current BG6 package name,
- the exact Windows UNC path,
- the current SHA-256 checksum,
- a compact `CURRENT.txt` marker,
- and a secondary archival note that cannot be mistaken for the current package.

---

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Release readiness handoff                                                                    │
│ CURRENT.txt is the source of truth. BG6 is current. BF6 is archival only.                  │
├───────────────────────────────┬──────────────────────────────────────────────┬──────────────┤
│ LEFT: CURRENT MARKER          │ CENTER: CURRENT PACKAGE PATH                  │ RIGHT: HISTORY│
│                               │                                              │              │
│ Source of truth               │ Current package                               │ Archival aliases
│ dist/release/CURRENT.txt      │ Package name:                                 │ BF6, BE6, BD6,
│                               │ servicenow-automation-windows-v0.1.0-rc.1-    │ BC6, BB6, BA6,
│ Current marker                │ bg6-20260607-local.zip                         │ AZ6, AY6
│ CURRENT=...bg6...zip          │                                              │              │
│                               │ Windows UNC path                              │ These labels are
│ Copy CURRENT marker           │ \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\...zip │ history only.
│ [button]                      │                                              │ Do not use them
│                               │ SHA-256 checksum                              │ as current.
│ Compact status                │ 1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb │
│ Current · BG6                 │                                              │              │
│                               │ What Alan should test                         │ START-HERE
│ Copy path                     │ Paste the UNC path into File Explorer, then   │ Open sidecar
│ [button]                      │ verify the checksum before extracting.        │ [button]
└───────────────────────────────┴──────────────────────────────────────────────┴──────────────┘
```

Behavioral notes:
- The current marker strip is visually dominant.
- The UNC path and checksum appear in the same primary reading block.
- Archival aliases are shown as secondary history, not as alternative current options.
- The first question answered by the card is: “What is current right now?”

---

## 4. Column responsibilities

Because this task is about a handoff surface, think in sections rather than a large app shell.

### Left column — source of truth / current marker / copy actions
Owns orientation and provenance.

It should answer:
- What file says what is current?
- What is the marker string?
- What copy action should Alan use if he only needs the marker?

Include:
- `dist/release/CURRENT.txt`
- compact `CURRENT=...` marker line
- `Copy CURRENT marker` button
- a small `Current · BG6` status chip

Rules:
- Keep `CURRENT.txt` explicit and above everything else.
- Do not hide the current marker inside a footnote.
- Do not let BF6 language appear in the primary marker strip.

### Center column — current package path, checksum, and next step
Owns action clarity.

It should answer:
- What exact file name is current?
- What exact UNC path should be pasted?
- What checksum should be verified?
- What should Alan do first?

Include:
- package name line
- UNC path line
- SHA-256 line
- `Copy UNC path` button
- `Copy checksum` button
- short next-step sentence: `Paste the UNC path into File Explorer, then verify the checksum before extracting.`

Rules:
- Keep the package name, path, and checksum in the same primary visual block.
- Use a monospace or code-style line for the UNC path so selection is accurate.
- Do not interleave archival aliases between the path and checksum.

### Right column — archival aliases / status / START-HERE
Owns demotion and first-step guidance.

It should answer:
- Which labels exist only for history?
- What should not be used as the current package identity?
- What file should Alan open next?

Include:
- `Archival aliases (secondary)`
- compact alias list
- plain-language note that they are history only
- `Open START-HERE` button

Rules:
- Keep archival aliases collapsed by default or visually quieter.
- Never present BF6 as equivalent to BG6 in the action hierarchy.
- The `Open START-HERE` action should point to the current package sidecar only.

---

## 5. Exact copy for the current-package handoff card

Use this exact copy for the on-screen handoff card.

```text
Release readiness handoff
CURRENT.txt is the source of truth. BG6 is current. BF6 is archival only.

Current marker
File: dist/release/CURRENT.txt
Marker: CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip
Status: Current · BG6

Current package
Package name: servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip
Windows UNC path:
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip
SHA-256 checksum:
1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb

What Alan should do next
1. Copy the UNC path.
2. Verify the checksum.
3. Extract the ZIP locally on Windows.
4. Open START-HERE-WINDOWS.txt for the current package.

Archival aliases (secondary)
BF6, BE6, BD6, BC6, BB6, BA6, AZ6, AY6
These labels are history only. Do not use them as the current package name.
```

Copy rules:
- Keep the current marker above the current package.
- Keep the exact UNC path and checksum in the same primary block.
- Use `current`, `source of truth`, and `archival only` rather than vague terms like `older` or `legacy`.
- Never place BF6 above BG6 in the visual order.

---

## 6. Exact copy for START-HERE-WINDOWS.txt

Use this text for the package-specific sidecar handoff file.

```text
ServiceNow Automation Windows Operator Preview

This package is the current BG6 local Windows package for supervised validation.
It does not approve live ServiceNow operation.

Package: servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip
Windows UNC path (paste into File Explorer):
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip
SHA-256 checksum:
1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb

Before you continue:
- Copy the UNC path into File Explorer.
- Verify the checksum before extracting.
- Read the package handoff card first.
- Do not paste raw URLs, ticket IDs, sys_ids, requester names, assignment groups, cookies, sessions, or field values.

Critical restriction:
No Save / Submit / Update / Resolve / Close automation.
Human reviews and manually submits in ServiceNow.
```

Copy rules:
- Start with the package identity and supervised-validation framing.
- Keep the path and checksum on separate lines for easy copy/paste.
- Keep the safety restriction short and final.
- Do not add archive history inside the START-HERE file.

---

## 7. State matrix

| State | Visible text | User meaning | Copy behavior |
|---|---|---|---|
| Current package active | `Current · BG6` plus the BG6 package name/path/checksum | Alan can act now | Show current identity first, archive last |
| Current marker present | `CURRENT.txt` and `CURRENT=...bg6...zip` | Source of truth is explicit | Keep the marker chip above the package block |
| Archival alias shown | older phase label appears in a secondary note | historical reference only | Demote the alias into secondary disclosure or footnote |
| Alias disabled | `Archive-only alias` | alias cannot be used as current guidance | Show why it is disabled in plain language |
| Alias selected | `This label is historical only. Use the BG6 package above.` | user picked a stale label | Redirect attention to the current package block |
| Checksum missing | checksum line unavailable | validation blocked | Say not to guess; tell Alan to wait for the checksum |
| Path missing | UNC path unavailable | handoff incomplete | Say the current package path is unavailable and stop |
| START-HERE stale | file still names an older alias as current | copy is misleading | Replace the package identity block before release |
| Read-only handoff | card visible with copy affordances | safe to continue reading | Keep action copy compact and visible |

---

## 8. Button enable / disable logic

### `Copy CURRENT marker`
Enabled when:
- `dist/release/CURRENT.txt` is present
- the marker line points to a package that exists

Disabled copy:
- `CURRENT.txt is unavailable.`
- `The current marker is missing.`

### `Copy UNC path`
Enabled when:
- the current package path is present
- the path belongs to the BG6 current package block

Disabled copy:
- `Current package path is unavailable.`
- `This item is an archival alias only.`

### `Copy checksum`
Enabled when:
- the current package checksum is present
- the checksum matches the current package block

Disabled copy:
- `Current package checksum is unavailable.`
- `This entry is historical only.`

### `Show archival aliases`
Enabled when:
- the current package block is visible
- the archival section is collapsed by default

Disabled copy:
- `Archival aliases are hidden until the current package is reviewed.`

### `Open START-HERE`
Enabled when:
- the current package block is present
- the sidecar content has been generated or verified

Disabled copy:
- `START-HERE is missing for the current package.`
- `Do not continue from an archival alias.`

### General rules
- Button labels stay exact and stable.
- Disabled reasons are visible next to the control, not hidden in a tooltip.
- A disabled button must explain the next safe prerequisite.
- If the prerequisite is environment-related, the copy should point to the current package block rather than log output.

---

## 9. Accessibility / readability notes

- Put `CURRENT.txt`, the UNC path, and the checksum on their own labeled lines.
- Use a code block or monospaced field for the path so it can be selected accurately.
- Keep the current package block visually stronger than the archival block.
- Use large tap/click targets for copy actions.
- Keep the archival alias note collapsed by default or visually quieter.
- Avoid all-caps warnings; the tone should be calm and exact.
- The first line should answer the operator’s immediate question: “What is current right now?”
- Use a warm, low-glare surface treatment; do not drift to pure black or harsh white.

---

## 10. Open Design / GPT Images 2 note

OpenDesign was used as the design-system reference for the warm editorial baseline.

GPT Images 2 / `image_generate` attempts:
- Attempt 1: warm-light three-column operator workbench concept with current marker, path clarity, archival aliases, and safe copy
- Attempt 2: alternate sanitized operator handoff concept with strong current-state hierarchy and a compact history rail

Result:
- no raster mockup was successfully generated in this run
- the image backend returned `FalClientHTTPError` for both attempts
- this spec was completed without image artifacts

If a future rerun succeeds, the intended visual prompt is:
- warm ivory background
- current marker block first
- center UNC path and checksum block dominant
- archival aliases visually quiet and secondary
- no branding, no dark theme, no real ServiceNow content

---

## 11. Implementation handoff for `sna-frontend-workbench`

If approved, the implementation should be surgical:
- keep `CURRENT.txt` as the explicit source-of-truth label
- surface the BG6 package name and UNC path above archival aliases
- demote BF6 language to a secondary history note
- reuse the exact path/checksum strings above
- preserve the warm-light reading order
- do not add a new design system or a new settings layer for this change

Suggested file intent:
- update the handoff card copy
- update the START-HERE generator copy
- update the runbook package-location block if it still suggests an archival alias is current

Minimal acceptance checklist:
- the current BG6 UNC path is the first thing Alan sees after the marker
- the checksum is visible immediately after the path
- BF6 and older labels are clearly labeled as historical only
- stale alias controls show a plain disabled reason
- no live ServiceNow behavior is implied
