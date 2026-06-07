# Phase BI2 — Current-Package Label / Path Clarity Refresh — UX / Copy Spec

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-ui-designer`  
**Task:** `t_0920b66a`  
**Audience:** Alan first, then `sna-frontend-workbench` after approval  
**Privacy level:** sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

---

## 0. Preflight

**Goal**  
Turn the current-package handoff into an exact copy/layout spec that makes the Windows UNC path the first thing Alan sees, followed immediately by the current package filename, checksum, and mtime. Stale BG6 wording must be clearly archival so it cannot be mistaken for the active package.

**Known facts**
- This is a doc-only task: no runtime changes, no browser automation, no package rebuild.
- The current local Windows package for this handoff is the BH6 artifact.
- The exact current package facts are known locally:
  - Windows UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip`
  - package name: `servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip`
  - SHA-256: `583929076a1dd5fcb50b876ad199c7318e2407deb6bc74e158a2284eef7d5d1d`
  - mtime: `2026-06-07 20:36:14.278742551 +0800`
- The file is present locally at `dist/release/` and is the target the user should test.
- BG6 is not current for this task; any BG6 wording must read as archival predecessor context only.

**Assumptions**
- Alan wants the handoff to read like a precise operator asset summary, not a runbook lecture.
- The same copy should work in the handoff card, the START-HERE sidecar, and the runbook package-location block.
- The smallest safe change is to keep the structure simple and only change hierarchy, label precedence, and disabled-state text.

**Ambiguities**
- Whether archival aliases should show only the immediate predecessor or a compact history set.
- Whether the current package metadata should appear as one stacked block or split into a callout plus a detail list.
- Whether the checksum should be copy-first or fully visible by default.

**Chosen smallest approach**
- Make the UNC path the topmost, first-read line in the current-package block.
- Put the current package filename, checksum, and mtime directly under that path with no competing history text in between.
- Demote BG6 and any other aliases into a quiet archival-only section.
- Use one exact disabled/reason sentence everywhere a stale alias could appear.
- Avoid adding new product surfaces; only define copy and state ordering.

**Files likely affected**
- `docs/status/phase-BI2-current-package-label-path-clarity-ux-spec-2026-06-07.md` (new)
- Later implementation would likely touch the handoff card renderer, START-HERE generator, and runbook package-location block.

**Verification plan**
- Confirm the UNC path is the first thing in the current-package block.
- Confirm filename, checksum, and mtime follow immediately after the path.
- Confirm BG6 is explicitly archival-only and visually secondary.
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
- The repo is already bound to the Claude design system with the `web-prototype-taste-editorial` template.
- That pairing supports parchment-like warmth, editorial hierarchy, and restrained spacing.
- For this task, use that as a tone reference only; do not introduce a full redesign system.

GPT Images 2 note:
- One sanitized concept mockup was attempted for this task, but the image tool returned `FalClientHTTPError` twice.
- No image artifact was successfully generated in this run.

Design takeaways for this task:
- Put the current package identity first, not buried inside a note.
- Show the path before any archival reference.
- Treat archival aliases as history, not as the thing Alan should act on.
- Keep disabled reasons short and plain-language.
- Use readable spacing and large click/tap targets for the handoff card.

---

## 2. Scope framing

This task only changes the copy hierarchy and state language around the current package handoff.

It should answer:
1. What exact file should Alan use now?
2. What exact UNC path should he paste into Windows File Explorer?
3. What checksum should he verify?
4. What mtime confirms this is the latest refresh?
5. Which names are archival aliases only?
6. What exact text should a disabled stale alias state show?

### Intended user story

Alan opens the refreshed handoff and immediately sees:
- the current BH6 package name,
- the exact Windows UNC path,
- the current SHA-256 checksum,
- the current file mtime,
- and a secondary archival-alias note that cannot be mistaken for the current package.

---

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Current package handoff                                                                      │
│ Paste this UNC path into File Explorer first. BG6 is archival-only.                         │
├───────────────────────────────┬──────────────────────────────────────────────┬──────────────┤
│ LEFT: SOURCE OF TRUTH         │ CENTER: CURRENT PACKAGE                       │ RIGHT: HISTORY│
│                               │                                              │              │
│ Current package source        │ Windows UNC path                              │ Archival aliases
│ dist/release/CURRENT.txt      │ \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip │ BG6, BF6,
│                               │                                              │ BE6, BD6,
│ Marker                        │ Package name                                  │ BC6, BB6, BA6
│ CURRENT=...bh6...zip          │ servicenow-automation-windows-v0.1.0-rc.1-   │              │
│                               │ bh6-20260607-local.zip                        │ These labels are
│ Status                        │ SHA-256 checksum                              │ history only.
│ Current · BH6                 │ 583929076a1dd5fcb50b876ad199c7318e2407deb6bc74e158a2284eef7d5d1d │ Do not use them
│                               │ mtime                                          │ as the current
│ Copy path                     │ 2026-06-07 20:36:14.278742551 +0800          │ package name.
│ [button]                      │                                              │              │
│ Copy checksum                 │ What Alan should do next                      │ START-HERE
│ [button]                      │ Copy the UNC path, verify the checksum,      │ Open sidecar
│ Copy filename                 │ then extract the ZIP locally on Windows.      │ [button]
│ [button]                      │                                              │
└───────────────────────────────┴──────────────────────────────────────────────┴──────────────┘
```

Behavioral notes:
- The UNC path is the first line in the center column and the first actionable text in the primary block.
- The filename, checksum, and mtime appear directly after the path with no history text between them.
- Archival aliases are shown only in the right column and only as history.
- The first question answered by the card is: “What exact package should Alan use now?”

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
- a small `Current · BH6` status chip

Rules:
- Keep `CURRENT.txt` explicit and above everything else.
- Do not hide the current marker inside a footnote.
- Do not let BG6 language appear in the primary marker strip.

### Center column — current package path, filename, checksum, mtime, and next step
Owns action clarity.

It should answer:
- What exact file name is current?
- What exact UNC path should be pasted?
- What checksum should be verified?
- What mtime confirms the latest refresh?
- What should Alan do first?

Include:
- UNC path line
- package name line
- SHA-256 line
- mtime line
- `Copy UNC path` button
- `Copy filename` button
- `Copy checksum` button
- short next-step sentence: `Copy the UNC path first, then verify the checksum before extracting.`

Rules:
- Keep the path, filename, checksum, and mtime in the same primary visual block.
- Use a monospace or code-style line for the UNC path so selection is accurate.
- Do not interleave archival aliases between the path and the rest of the package metadata.

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
- Never present BG6 as equivalent to BH6 in the action hierarchy.
- The `Open START-HERE` action should point to the current package sidecar only.

---

## 5. Exact copy for the current-package handoff card

Use this exact copy for the on-screen handoff card.

```text
Current package handoff
Paste this UNC path into File Explorer first. BG6 is archival-only.

Current package
Windows UNC path:
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip
Package name: servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip
SHA-256 checksum: 583929076a1dd5fcb50b876ad199c7318e2407deb6bc74e158a2284eef7d5d1d
mtime: 2026-06-07 20:36:14.278742551 +0800

What Alan should do next
1. Copy the UNC path.
2. Verify the checksum.
3. Confirm the filename and mtime match the latest refresh.
4. Extract the ZIP locally on Windows.
5. Read START-HERE-WINDOWS.txt before launching the app.

Archival aliases (secondary)
BG6, BF6, BE6, BD6, BC6, BB6, BA6
These labels are history only. Do not use them as the current package name.
```

Copy rules:
- Keep the UNC path at the top of the current-package block.
- Keep the filename, checksum, and mtime directly visible in the same block.
- Do not place any archival alias text between the path and the filename/checksum/mtime.
- Do not soften the phrase `history only` into something ambiguous like `older version`.
- BG6 may appear only in the archival section and must never be phrased as current, newest, active, or recommended.

---

## 6. Exact copy for START-HERE-WINDOWS.txt

Use this text for the package-specific sidecar handoff file.

```text
ServiceNow Automation Windows Operator Preview

This package is the current BH6 local Windows package for supervised validation.
It does not approve live ServiceNow operation.

Package: servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip
Windows UNC path (paste into File Explorer):
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip
SHA-256 checksum:
583929076a1dd5fcb50b876ad199c7318e2407deb6bc74e158a2284eef7d5d1d
mtime:
2026-06-07 20:36:14.278742551 +0800

Before you continue:
- Copy the UNC path into File Explorer.
- Verify the checksum before extracting.
- Read the package handoff card first.
- Do not paste raw URLs, ticket IDs, sys_ids, requester names, assignment groups, cookies, sessions, or field values.
```

---

## 7. State matrix

| State | Left column | Center column | Right column | Primary copy |
|---|---|---|---|---|
| Default / ready | `Current · BH6` chip visible | UNC path, filename, checksum, mtime all visible | Archival aliases collapsed | `Paste this UNC path into File Explorer first.` |
| Hover on copy buttons | Button affordance brightens | No reflow | No change | Tooltip: `Copies only the current package path` / `Copies only the current checksum` |
| Archival section expanded | Source-of-truth stays stable | No change | Alias list expands with history-only labels | `These labels are history only.` |
| Missing checksum context | Left chip stays visible | Checksum line marked incomplete | Right column unchanged | `Checksum unavailable. Do not treat the package as verified.` |
| Missing mtime context | Left chip stays visible | mtime line marked incomplete | Right column unchanged | `mtime unavailable. Confirm the refreshed file before using it.` |
| Stale BG6 alias encountered | BG6 is never promoted | No current-package emphasis on BG6 | BG6 appears only in archival history | `BG6 is archival-only.` |
| Copy action unavailable | Button disabled with reason | Metadata still readable | No change | `Copy unavailable until the current package block is loaded.` |

---

## 8. Main components

1. Header / title
   - States the purpose in one short sentence.
   - Never leads with archival language.

2. Current marker chip
   - Shows `Current · BH6`.
   - Uses the chip only as a summary, not as the main instruction.

3. Current package block
   - Contains the UNC path, filename, checksum, and mtime.
   - The UNC path is the most prominent line in the block.

4. Action row
   - Separate buttons for `Copy UNC path`, `Copy filename`, and `Copy checksum`.
   - Keep actions large enough for easy touch/click targeting.

5. Archival aliases section
   - Collapsed by default.
   - Secondary-only, history-only.

6. START-HERE sidecar shortcut
   - A direct affordance to open the local instruction file.
   - No extra bundling or deep navigation.

---

## 9. Empty / loading / error states

### Empty state
If the current-package block cannot be populated, show:
- `Current package data not loaded yet.`
- `Do not use archival aliases as a substitute.`
- One retry action: `Reload current package data`

### Loading state
If the package metadata is still resolving, show:
- `Loading current package details…`
- Keep the left marker chip visible.
- Do not reveal BG6 or any alias as a fallback current package.

### Error state
If the current package metadata cannot be loaded:
- `Current package details unavailable.`
- `No archival alias should be treated as current.`
- Show only the retry action and a disabled copy row.

Disabled state reason copy:
- `Disabled until the current package block is available.`
- `Disabled because archival aliases are reference-only.`

---

## 10. Button enable / disable logic

### Enable when
- `Copy UNC path` is enabled only when the current package path is resolved.
- `Copy filename` is enabled only when the current package filename is resolved.
- `Copy checksum` is enabled only when the current package checksum is resolved.
- `Open START-HERE` is enabled only when the sidecar file exists locally.
- `Expand archival aliases` is enabled only if there are aliases to show.

### Disable when
- The button would copy an archival alias instead of the current package.
- The current package block is missing or partial.
- The sidecar is unavailable.

### Disabled copy guidance
- Every disabled button must explain why in plain language.
- Use `Reference-only` or `Current package unavailable` rather than technical failure jargon.
- Never leave a button visually silent when disabled.

---

## 11. Accessibility notes

- Preserve the warm/light visual tone, but keep contrast readable for eye comfort.
- Use large text for the UNC path and filename so the user can scan and copy accurately.
- Use monospace for the UNC path and checksum to reduce transcription errors.
- Keep copy buttons large enough for keyboard and pointer use.
- Ensure the archival section is truly secondary in both order and emphasis.
- Avoid color-only distinction between current and archival; pair color with labels like `Current` and `Archival only`.
- The current-package path should be keyboard focusable and selectable without requiring a hover state.
- Disabled states must include a short reason in visible text, not just a grayed-out button.

---

## 12. What GPT Images 2 mockups were generated, if any

- No successful mockup image was generated in this run.
- Two sanitized attempts were made, but the image tool returned `FalClientHTTPError` both times.
- The spec therefore relies on the text wireframe and copy rules only.

---

## 13. Implementation handoff for `sna-frontend-workbench`

If this spec is approved, the implementation should:
- update the current-package handoff surface so the UNC path is first in the primary block,
- show filename, checksum, and mtime immediately after the path,
- demote BG6 and all older aliases into archival-only history,
- preserve the current-package copy actions,
- and keep all disabled states explainable in plain language.

Non-goals:
- Do not add new package-tracking concepts.
- Do not create a separate archival viewer.
- Do not widen the scope to live ServiceNow behavior.
- Do not change release packaging or verification semantics.

Minimal verification for implementation:
- visual check that the UNC path is first,
- check that filename/checksum/mtime are visible without scrolling,
- check that BG6 cannot be mistaken for current,
- check that disabled states include a reason.

---

## 14. Handoff summary

This spec narrows BI2 to a single readability goal: current package first, archival aliases second. The exact Windows UNC path, filename, checksum, and mtime are now specified together so Alan can verify the right file without accidentally treating BG6 wording as active.
