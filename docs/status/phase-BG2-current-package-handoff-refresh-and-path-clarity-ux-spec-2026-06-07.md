# Phase BG2 — Current-Package Handoff Refresh and Exact UNC Path Clarity — UX / Copy Spec

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-ui-designer`  
**Task:** `t_c64249bd`  
**Audience:** Alan first, then `sna-frontend-workbench` after approval  
**Privacy level:** sanitized. All examples are local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

---

## 0. Preflight

**Goal**  
Define the exact copy and micro-layout for the current-package handoff refresh so Alan sees the current Windows UNC path and current checksum first, while archival aliases are clearly demoted and never mistaken for the live package.

**Known facts**
- The task is doc-only: no runtime changes, no product implementation, no package rebuild.
- The current local Windows package for this handoff is the BF6 artifact.
- The exact current package facts are already known locally:
  - package name: `servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip`
  - Windows UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip`
  - SHA-256: `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33`
- Earlier phase-letter packages exist in `dist/release/` and should be treated as archival aliases, not current guidance.
- The desired visual behavior is current-first, alias-second, with a compact state label and a plain disabled reason for stale aliases.

**Assumptions**
- Alan wants the current handoff card to read like a clear operator asset summary, not a runbook lecture.
- The same copy should work in three places: runbook, START-HERE, and an on-screen handoff card.
- The smallest safe change is to keep the structure simple and only change the text hierarchy.

**Ambiguities**
- Whether the archive list should show all historical phase aliases or only the nearest predecessor aliases.
- Whether BE6 should still be called out as “current local verification state” in some downstream docs or should be visually demoted everywhere.
- Whether the on-screen card should expose the checksum in full or only as a copy button with hover text.

**Chosen smallest approach**
- Put the BF6 current package path and checksum in a single high-priority metadata strip.
- Demote archival aliases into a collapsed or secondary note block.
- Use the same exact disable/reason text everywhere a stale alias can appear.
- Avoid adding new product surfaces; just define the copy and state model.

**Files likely affected**
- `docs/status/phase-BG2-current-package-handoff-refresh-and-path-clarity-ux-spec-2026-06-07.md` (new)
- Later implementation would likely touch the existing runbook, START-HERE sidecar generation, and the on-screen handoff card renderer.

**Verification plan**
- Confirm the spec puts the current UNC path and checksum first.
- Confirm archival aliases are explicitly secondary and visually demoted.
- Confirm the disabled/reason copy is exact, short, and safe.
- Confirm no live ServiceNow or other restricted actions are implied.

---

## 1. Research and design references

Public reference patterns used as direction, not branding:
- Codex-style command center layout: current work, readiness, and action affordances appear together.
- Claude Code-style desktop work surfaces: compact status, strong hierarchy, and calm warm-light visual rhythm.
- Antigravity-style manager/editor/artifact model: visible current state first, supporting context second.
- Existing operator workbench spec in this repo: warm/light three-column structure with settings and runtime clarity preserved.

Design takeaways for this task:
- Put the current package identity first, not buried inside a note.
- Show the path and checksum before any archival reference.
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
4. Which names are archival aliases?
5. What exact text should a disabled stale alias state show?

### Intended user story

Alan opens the refreshed handoff and immediately sees:
- the current BF6 package name,
- the exact Windows UNC path,
- the current SHA-256 checksum,
- and a secondary archival-alias note that cannot be mistaken for the current package.

---

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Current package handoff                                                      │
│ BF6 is the current local Windows package. Copy the UNC path and checksum.    │
├──────────────────────────────────────────────────────────────────────────────┤
│ CURRENT PACKAGE                                                              │
│ Package name: servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local │
│ Windows UNC path:                                                            │
│ \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\...zip │
│ SHA-256: 3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33   │
│                                                                              │
│ Archival aliases (secondary)                                                 │
│ BE6 / BD6 / BC6 / BB6 / BA6 / AZ6 / AY6                                      │
│ These labels are history only. Do not use them as the current package name.  │
│                                                                              │
│ START-HERE excerpt                                                           │
│ 1. Copy the UNC path                                                         │
│ 2. Verify the SHA-256                                                        │
│ 3. Extract locally on Windows                                                │
│ 4. Read the safety note first                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

Behavioral notes:
- The current package strip is visually dominant.
- The checksum appears on the same visual tier as the path.
- Archival aliases are shown as a secondary footnote or collapsed disclosure.
- The user should not have to infer which package is current from chronology alone.

---

## 4. Column / section responsibilities

Because this is a copy-hierarchy task, think in sections rather than full app columns.

### Header section
Owns orientation.

It should answer:
- What is the current package?
- Is this the thing Alan should act on now?
- Is this local-only?

Include:
- `Current package handoff`
- `BF6 is the current local Windows package.`
- `Copy the UNC path and checksum.`

### Current package section
Owns action clarity.

It should answer:
- What exact file name is current?
- What exact UNC path should be pasted?
- What checksum should be verified?

Include:
- package name line
- UNC path line
- SHA-256 line
- copy affordance for both path and checksum if the UI supports it

### Archival aliases section
Owns demotion and ambiguity removal.

It should answer:
- Which older labels exist only for history?
- What should not be used as the current package identity?

Include:
- `Archival aliases (secondary)`
- a compact list of older phase aliases
- a plain-language note that they are history only

### START-HERE excerpt section
Owns first-step guidance.

It should answer:
- What should Alan do immediately after seeing the package info?
- What order should the instructions follow?

Include:
- copy the UNC path
- verify checksum
- extract locally
- read the safety note first

---

## 5. Exact copy for the current-package handoff card

Use this exact copy for the on-screen handoff card.

```text
Current package handoff
BF6 is the current local Windows package. Copy the UNC path and checksum.

Current package
Package name: servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
Windows UNC path:
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
SHA-256 checksum:
3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33

Archival aliases (secondary)
BE6, BD6, BC6, BB6, BA6, AZ6, AY6
These labels are history only. Do not use them as the current package name.

Next step
1. Copy the UNC path.
2. Verify the checksum.
3. Extract the ZIP locally on Windows.
4. Read START-HERE-WINDOWS.txt before launching the app.
```

Copy rules:
- Keep the package name, path, and checksum in the same primary visual block.
- Do not interleave historical aliases between the path and checksum.
- Do not soften the phrase “history only” into something ambiguous like “older version.”

---

## 6. Exact copy for START-HERE-WINDOWS.txt

Use this text for the package-specific sidecar handoff file.

```text
ServiceNow Automation Windows Operator Preview

This package is the current BF6 local Windows package for supervised validation.
It does not approve live ServiceNow operation.

Package: servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
Windows UNC path (paste into File Explorer):
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
SHA-256 checksum:
3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33

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

## 7. Exact copy for the runbook refresh

Use this text for the runbook section that needs current-package clarity.

```md
## 3. Current package location

The current local Windows package to test:

**Package name:** `servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip`

**Windows UNC path (paste into File Explorer):**
```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
```

**SHA-256 checksum:**
```text
3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33
```

**Current status:**
- This is the package Alan should use now.
- Older phase-letter packages are archival aliases only.
- Do not use archival aliases as the current package name.

**What is inside:**
- `ServiceNow Automation.exe` — packaged Electron app
- `resources/app.asar` — bundled web app + Node modules
- `resources/scripts/windows/` — helper PowerShell scripts
- `START-HERE-WINDOWS.txt` — safety instructions (read this first)
```

If the runbook must mention older packages, keep them in a separate note titled `Archival aliases` and never place them above the current package block.

---

## 8. State matrix

| State | Visible text | User meaning | Copy behavior |
|---|---|---|---|
| Current package active | current BF6 package name + UNC path + checksum | Alan can act now | Show current identity first, archive last |
| Archival alias shown | older phase label appears in secondary note | historical reference only | Demote the alias into a secondary disclosure or footnote |
| Alias disabled | `Archive-only alias` | alias cannot be used as current guidance | Show why it is disabled in plain language |
| Alias selected | `This label is historical only. Use the BF6 package above.` | user picked a stale label | Redirect attention to the current package block |
| Checksum missing | checksum line unavailable | validation blocked | Say not to guess; tell Alan to wait for the checksum |
| Path missing | UNC path unavailable | handoff incomplete | Say the current package path is unavailable and stop |
| START-HERE stale | file still names an older alias as current | copy is misleading | Replace the package identity block before release |
| Read-only handoff | card visible with copy affordances | safe to continue reading | Keep action copy compact and visible |

---

## 9. Disabled / reason text for stale aliases

Use these exact lines whenever a stale alias appears as an option, label, or button.

- `Archive-only alias: this label is historical. Use the BF6 package above.`
- `Disabled: archival alias only. It cannot be used as the current package identity.`
- `Blocked: the selected package label is stale. Copy the current UNC path and checksum instead.`
- `History only: this entry is preserved for reference, not for current handoff.`

Style rules:
- Keep the reason in one sentence.
- Never make the user infer that an archival alias is still actionable.
- Prefer `historical`, `archive-only`, and `current package` over vague terms like `old`, `legacy`, or `previous`.

---

## 10. Button enable / disable logic

### Copy UNC path
Enabled when:
- the current package path is present
- the path belongs to the BF6 current package block

Disabled copy:
- `Current package path is unavailable.`
- `This item is an archival alias only.`

### Copy checksum
Enabled when:
- the current package checksum is present
- the checksum matches the current package block

Disabled copy:
- `Current package checksum is unavailable.`
- `This entry is historical only.`

### Show archival aliases
Enabled when:
- the current package block is visible
- the archival section is collapsed by default

Disabled copy:
- `Archival aliases are hidden until the current package is reviewed.`

### Open START-HERE
Enabled when:
- the current package block is present
- the sidecar content has been generated or verified

Disabled copy:
- `START-HERE is missing for the current package.`
- `Do not continue from an archival alias.`

---

## 11. Accessibility / readability notes

- Put the UNC path and checksum on their own labeled lines.
- Use a code block or monospaced field for the path so it can be selected accurately.
- Keep the current package block visually stronger than the archival block.
- Use large tap/click targets for copy actions.
- Keep the archival alias note collapsed by default or visually quieter.
- Avoid all-caps warnings; the tone should be calm and exact.
- The first line should answer the operator’s immediate question: “What is current right now?”

---

## 12. Open Design / research note

Public product references reviewed for layout principles only:
- command-center style desktop work surfaces with status near action
- calm warm-light operator layouts with visible current state first
- artifact-centric manager/editor patterns that separate current work from history

No brand text or UI copy was reused.

---

## 13. GPT Images 2 mockup note

A sanitized GPT Images 2 mockup was attempted with a warm-light three-column operator workbench prompt, but the generation call failed with `FalClientHTTPError`.

Result:
- no mockup asset was produced
- this spec was completed without image artifacts

---

## 14. Implementation handoff for `sna-frontend-workbench`

If approved, the implementation should be surgical:
- keep the current-package block first in the handoff card
- demote archival aliases to a secondary disclosure
- reuse the exact path/checksum strings above
- preserve the warm-light reading order
- do not add a new design system or a new settings layer for this change

Suggested file intent:
- update the handoff card copy
- update the START-HERE generator copy
- update the runbook package-location block if it still suggests an archival alias is current

Minimal acceptance checklist:
- the current BF6 UNC path is the first thing Alan sees
- the checksum is visible immediately after the path
- archival aliases are clearly labeled as historical only
- stale alias controls show a plain disabled reason
- no live ServiceNow behavior is implied
