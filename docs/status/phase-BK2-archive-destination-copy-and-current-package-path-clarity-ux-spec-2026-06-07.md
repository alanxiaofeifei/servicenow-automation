# Phase BK2 — Archive-Destination Copy and Current-Package Path Clarity — UX / Copy Spec

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-ui-designer`  
**Task:** `t_45314a22`  
**Audience:** Alan first, then `sna-frontend-workbench` after approval  
**Privacy level:** sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, requester names, assignment groups, or customer data.

---

## 0. Preflight

**Goal**  
Make the handoff read in the right order for Alan: the exact Windows UNC path appears first, the current package block is visually dominant, and the archive destination reads as a local filesystem move rather than a remote publish action.

**Known facts**
- This is a spec-only task: no runtime change, no browser automation, no package rebuild.
- BK1 established the current baseline and path anchor.
- The current manual-validation package remains BJ6 until BK6 publishes a fresh dated package.
- The current package UNC path is already known locally and should be shown exactly once in the primary handoff block.
- The archive destination is a local folder under `dist/.release-archive/` and must not imply upload, release, publish, or ServiceNow behavior.

**Assumptions**
- Alan wants a compact operator handoff, not a long runbook lecture.
- The visible path order matters more than extra explanatory prose.
- Disabled states should explain why they are disabled, in plain language, without turning the page into a warning wall.

**Ambiguities**
- Whether the archive destination should be labeled as “local archive”, “move to archive”, or “archive locally”.
- Whether the current-package block should show the checksum before or after the filename.
- Whether copy buttons should sit inline with the values or below the block.

**Chosen smallest approach**
- Put the UNC path first in the current-package block.
- Keep the package name, checksum, and mtime directly under that path.
- Phrase the archive destination as a local filesystem move into `dist/.release-archive/BJ-<phase>/`.
- Keep the UI surface unchanged; only define the copy hierarchy, button wording, and disabled-state language.

**Files likely affected**
- `docs/status/phase-BK2-archive-destination-copy-and-current-package-path-clarity-ux-spec-2026-06-07.md` (this task)
- Later implementation would likely touch the handoff card renderer, START-HERE generator, and cleanup-preview copy.

**Verification plan**
- Confirm the UNC path is the first thing Alan sees in the current-package block.
- Confirm the archive destination reads as a local folder move, not a publish action.
- Confirm disabled states are explicit, short, and safe.
- Confirm no live ServiceNow or other restricted actions are implied.

---

## 1. Research and design references

Public reference patterns used as direction, not branding:
- Claude Code desktop: clear command-center layout, strong separation of task state and action rail, and compact operational status.
- Codex-style workbench framing: current work, readiness, and action affordances appear together without a dense vertical dump.
- Antigravity-style manager/editor/artifact model: current state first, supporting history second.
- Existing operator-workbench specs in this repo: warm/light shell, progressive disclosure, and large readable runtime controls.

OpenDesign note:
- The project is already bound to the Claude design system with the `web-prototype-taste-editorial` template.
- That pairing supports a warm editorial baseline, strong hierarchy, and restrained spacing.
- For this task, use that as tone reference only; do not introduce a new design system or redesign the app shell.

GPT Images 2 note:
- Two sanitized prompts were attempted for this task.
- The image backend returned `FalClientHTTPError` on both attempts.
- No raster mockup was successfully generated in this run.

Design takeaways for this task:
- Put the current package identity first, not buried inside a note.
- Show the UNC path before any archive-destination reminder.
- Keep archival language local and recovery-safe.
- Use short disabled reasons and large click/tap targets.

---

## 2. Scope framing

This task only changes the copy hierarchy and state language around the current-package handoff and archive-destination reminder.

It should answer:
1. What exact file should Alan use now?
2. What exact UNC path should he paste into File Explorer?
3. What checksum should he verify?
4. What mtime confirms this is the latest refresh?
5. What exact wording should explain where stale files move locally?
6. What exact text should appear when the current package data or cleanup preview is unavailable?

### Intended user story

Alan opens the refreshed handoff and immediately sees:
- the current BJ6 package name,
- the exact Windows UNC path,
- the current SHA-256 checksum,
- the current file mtime,
- a local-only archive destination reminder,
- and disabled-state copy that never suggests publish or remote action.

---

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Current package handoff                                                                      │
│ Paste this UNC path into File Explorer first. Archive destination is local only.           │
├───────────────────────────────┬──────────────────────────────────────────────┬──────────────┤
│ LEFT: SOURCE OF TRUTH         │ CENTER: CURRENT PACKAGE                      │ RIGHT: HISTORY│
│                               │                                              │              │
│ Current package source        │ Windows UNC path                              │ Archive destination
│ dist/release/CURRENT.txt      │ \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip │ dist/.release-archive/
│                               │                                              │ BJ-<phase>/
│ Marker                        │ Package name                                  │ Local move only
│ CURRENT=...bj6...zip          │ servicenow-automation-windows-v0.1.0-rc.1-   │ No publish, no upload,
│                               │ bj6-20260607-local.zip                        │ no ServiceNow action.
│ Status                        │ SHA-256 checksum                              │              │
│ Current · BJ6                 │ 336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e │ Recent evidence
│                               │ mtime                                          │ Last local scan
│ Copy path                     │ 2026-06-07 20:36:14.278742551 +0800          │ Cleanup preview status
│ [button]                      │                                              │              │
│ Copy checksum                 │ What Alan should do next                      │ START-HERE
│ [button]                      │ Copy the UNC path, verify the checksum,      │ Open sidecar
│ Copy filename                 │ then extract the ZIP locally on Windows.      │ [button]
│ [button]                      │                                              │              │
└───────────────────────────────┴──────────────────────────────────────────────┴──────────────┘
```

Behavioral notes:
- The UNC path is the first line in the center column and the first actionable text in the primary block.
- The filename, checksum, and mtime appear directly after the path with no history text between them.
- The archive destination is framed as a local move, not as a publish operation.
- The first question answered by the card is: “What exact package should Alan use now?”

---

## 4. Column responsibilities

Because this task is about handoff clarity, think in sections rather than a large new app shell.

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
- a small `Current · BJ6` status chip

Rules:
- Keep `CURRENT.txt` explicit and above everything else.
- Do not hide the current marker inside a footnote.
- Do not let archival language appear in the primary marker strip.

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
- Do not interleave archive-destination text between the path and the rest of the package metadata.

### Right column — archive destination / status / START-HERE
Owns demotion and first-step guidance.

It should answer:
- Where do stale files move locally?
- What should not be interpreted as a remote action?
- What file should Alan open next?

Include:
- `Archive destination (local only)`
- compact destination string
- plain-language note that the move stays on this machine
- `Open START-HERE` button

Rules:
- Keep the archive destination visually quieter than the current package.
- Never present the archive path as publish, upload, or release output.
- The `Open START-HERE` action should point to the current package sidecar only.

---

## 5. Exact copy for the current-package handoff card

Use this exact copy for the on-screen handoff card.

```text
Current package handoff
Paste this UNC path into File Explorer first. Archive destination is local only.

Current package
Windows UNC path:
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip
Package name: servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip
SHA-256 checksum: 336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e
mtime: 2026-06-07 20:36:14.278742551 +0800

What Alan should do next
1. Copy the UNC path.
2. Verify the checksum.
3. Confirm the filename and mtime match the latest refresh.
4. Extract the ZIP locally on Windows.
5. Read START-HERE-WINDOWS.txt before launching the app.

Archive destination (local only)
dist/.release-archive/BJ-<phase>/
This move stays on the local machine. It does not publish, upload, or perform any ServiceNow action.
```

Copy rules:
- Keep the UNC path at the top of the current-package block.
- Keep the filename, checksum, and mtime directly visible in the same block.
- Do not place archive-destination text between the path and the filename/checksum/mtime.
- Do not soften the phrase `local only` into something vague like `safer` or `internal`.
- The archive destination may appear after the current-package block, but it must remain visually secondary.

---

## 6. Exact copy for the archive-destination reminder

Use this text for any compact reminder, helper label, or confirmation copy tied to the local archive destination.

```text
Archive destination (local only)
dist/.release-archive/BJ-<phase>/
Moves stale files locally on this machine only.
No publish, no upload, no ServiceNow action.
```

Alternative short variants allowed for tiny surfaces:
- `Archive destination: local only`
- `Moves stale files locally into dist/.release-archive/BJ-<phase>/`
- `Local move only — no publish or upload`

Do not use:
- `publish destination`
- `release destination`
- `remote archive`
- `upload target`
- `cleanup output`

---

## 7. Exact copy for START-HERE-WINDOWS.txt

Use this text for the package-specific sidecar handoff file.

```text
ServiceNow Automation Windows Operator Preview

This package is the current BJ6 local Windows package for supervised validation.
It does not approve live ServiceNow operation.

Package: servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip
Windows UNC path (paste into File Explorer):
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip
SHA-256 checksum:
336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e
mtime:
2026-06-07 20:36:14.278742551 +0800

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

## 8. State matrix

| State | Visible text | User meaning | Copy behavior |
|---|---|---|---|
| Current package active | `Current · BJ6` plus the BJ6 package name/path/checksum | Alan can act now | Show current identity first, archive last |
| Current marker present | `CURRENT.txt` and `CURRENT=...bj6...zip` | Source of truth is explicit | Keep the marker chip above the package block |
| Archive destination shown | `dist/.release-archive/BJ-<phase>/` | Local move destination is visible | Demote it under the current package |
| Archive-destination reminder disabled | `Local move only` with a reason | Reminder exists but action is unavailable | Explain why in one short sentence |
| Checksum missing | checksum line unavailable | verification blocked | Say not to guess; tell Alan to wait for the checksum |
| Path missing | UNC path unavailable | handoff incomplete | Say the current package path is unavailable and stop |
| Read-only handoff | card visible with copy affordances | safe to continue reading | Keep action copy compact and visible |

---

## 9. Button enable / disable logic

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
- the path belongs to the BJ6 current package block

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

### `Copy archive destination`
Enabled when:
- the local archive destination is known
- the destination is explicitly local-only

Disabled copy:
- `Archive destination is unavailable.`
- `Local archive destination not resolved yet.`

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

## 10. Accessibility / readability notes

- Put `CURRENT.txt`, the UNC path, and the checksum on their own labeled lines.
- Use a code block or monospaced field for the path so it can be selected accurately.
- Keep the current package block visually stronger than the archive-destination block.
- Use large tap/click targets for copy actions.
- Keep the archive-destination reminder collapsed by default or visually quieter.
- Avoid all-caps warnings; the tone should be calm and exact.
- The first line should answer the operator’s immediate question: “What is current right now?”
- Use a warm, low-glare surface treatment; do not drift to pure black or harsh white.

---

## 11. What GPT Images 2 mockups were generated, if any

- No successful mockup image was generated in this run.
- Two sanitized attempts were made with warm-light operator-workbench prompts.
- The image backend returned `FalClientHTTPError` both times.
- The spec therefore relies on text wireframe and copy rules only.

---

## 12. Implementation handoff for `sna-frontend-workbench`

If this spec is approved, the implementation should:
- keep the current-package handoff surface focused on the exact UNC path first,
- show filename, checksum, and mtime immediately after the path,
- keep the archive destination visibly local-only,
- preserve the current-package copy actions,
- and keep all disabled states explainable in plain language.

Non-goals:
- Do not add new package-tracking concepts.
- Do not create a separate archive viewer.
- Do not widen the scope to live ServiceNow behavior.
- Do not change release packaging or verification semantics.

Minimal acceptance checklist:
- the current UNC path is the first thing Alan sees after the header
- the checksum is visible immediately after the path
- the archive destination is clearly local-only
- disabled states include a reason
- no copy implies live ServiceNow, upload, release, or publish actions

---

## 13. Handoff summary

This spec narrows BK2 to a single readability goal: current package first, archive destination second, and no remote-action implication anywhere in the copy. The exact Windows UNC path, filename, checksum, and mtime are specified together so Alan can verify the right file without mistaking the local archive destination for a publish target.
