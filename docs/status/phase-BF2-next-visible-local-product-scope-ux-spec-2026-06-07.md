# Phase BF2 — BE6 Package Restoration and Validation Readiness UX/Copy Spec

**Date:** 2026-06-07  
**Parent scope:** BF1 — BE6 Package Restoration and Validation Readiness  
**Task:** `t_f17f1b8c`  
**Assignee:** `sna-ui-designer`

## 0. Preflight summary

Goal
- Specify the exact copy for a package-specific START-HERE-WINDOWS.txt and the exact replacement copy for runbook §3 (Package location), so BF3 can implement the refresh surgically.

Known facts
- BF1 defines the next visible scope as package restoration and validation readiness, not a new product feature.
- The current runbook still points at `bd6`.
- The generated START-HERE files in `dist/release/` are generic and do not include package-specific path/checksum guidance.
- BE6 is the current validation package referenced by BF1; the ZIP itself is missing from `dist/release/`, but the SHA256 sidecar remains.

Assumptions
- BF2 should name the BE6 package directly in the copy, because that is the current validation target in BF1.
- If BF3 rebuilds the package under a fresh `bf6` prefix, only the package prefix tokens should change; the structure and tone of the copy should stay the same.

Ambiguities
- Whether BF3 will rebuild the archive as `be6` again or as a fresh `bf6` package.
- Whether the start-here file should remain exactly generic-template-shaped or become a package-specific variant with the same section order.

Chosen smallest approach
- Keep the runbook structure unchanged.
- Keep the START-HERE structure unchanged.
- Replace only the stale package-specific copy with a compact, explicit block that names the exact path, checksum, checklist reference, diagnostic guidance, and safety boundary.

Files likely affected
- `docs/test/windows-clean-machine-validation-2026-06-07.md`
- The generated START-HERE-WINDOWS.txt content produced by `scripts/packaging/build-windows-rc.sh`

Verification plan
- Confirm the new copy contains the exact package path, checksum, and safety reminder.
- Confirm `bd6` is removed from the runbook package-location section.
- Confirm the copy still instructs Alan to stay local-only and to copy only sanitized diagnostic text.

---

## 1. Scope statement

This BF2 spec covers only two copy surfaces:

1. A package-specific `START-HERE-WINDOWS.txt` for the BE6 validation package.
2. The replacement text for runbook §3, Package location.

It does not change the runbook structure, validation steps, UI, or build pipeline behavior.

---

## 2. Design intent

The user experience should feel like a short, exact handoff card, not a generic safety essay.

The copy should do five things quickly:
- identify the exact package Alan should validate
- provide a copyable UNC path
- provide a checksum for verification
- point to the in-app P0 Re-Acceptance Checklist card
- keep the safety boundary explicit

Tone:
- calm
- direct
- package-specific
- no jargon beyond what the Windows validation flow already uses

---

## 3. Exact START-HERE-WINDOWS.txt copy

Use this text for the package-specific handoff file generated alongside the BE6 archive.

```text
ServiceNow Automation Windows Operator Preview

This package is for supervised local validation of the BE6 release artifact.
It does not approve live ServiceNow operation.

Package: servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip

Windows UNC path (paste into File Explorer):
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip

SHA-256 checksum:
bf7d0e79074f115eea00115ac48dd5d6b99abd039bcd730c7aad631234f9d097

Before you continue:
- Open the in-app P0 Re-Acceptance Checklist card and confirm the BE6 package name.
- If the app shows a startup diagnostic, copy the visible error text only.
- Do not paste raw URLs, ticket IDs, sys_ids, requester names, assignment groups, cookies, sessions, or field values.

Critical restriction:
No Save / Submit / Update / Resolve / Close automation.
Human reviews and manually submits in ServiceNow.
```

If BF3 rebuilds the archive under a fresh `bf6` prefix, change only these tokens in the same block:
- `be6`
- the package filename
- the UNC path filename segment
- the checksum line if the rebuilt archive hash differs

Keep the rest of the wording unchanged.

---

## 4. Exact runbook §3 replacement copy

Replace the current `bd6` package-location block in `docs/test/windows-clean-machine-validation-2026-06-07.md` with this text.

```md
## 3. Package location

The BE6 Windows local package to test:

**Windows UNC path (paste into File Explorer):**
```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip
```

**SHA-256 checksum:**
```text
bf7d0e79074f115eea00115ac48dd5d6b99abd039bcd730c7aad631234f9d097
```

**File size:** `118,607,657 bytes (~113.1 MB)`

**Gate status (current local verification state):**
- Build: PASS
- Typecheck: PASS
- Test: PASS (459 tests)
- Privacy:scan: PASS (288 files)

**What is inside:**
- `ServiceNow Automation.exe` — packaged Electron app
- `resources/app.asar` — bundled web app + Node modules
- `resources/scripts/windows/` — helper PowerShell scripts (including `prepare-chrome-for-testing.ps1`)
- `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local-START-HERE-WINDOWS.txt` — safety instructions (read this first)
- Electron runtime files (DLLs, locales, Chromium binary, etc.)
```

If BF3 chooses `bf6` instead of `be6`, replace only the package prefix and dependent path/file tokens in the block above.

---

## 5. State matrix

| State | Visible text | User meaning | Copy behavior |
|---|---|---|---|
| Archive present | package filename + UNC path | Alan can validate now | Show the exact package name and path first |
| Archive missing | package name without a ZIP file on disk | validation is blocked | Say the package must be rebuilt before manual validation |
| SHA256 present | checksum line visible | Alan can verify the archive | Keep checksum on its own line for easy copy/paste |
| SHA256 missing | checksum unavailable | validation blocked | Do not invent a hash; tell Alan to stop and rebuild |
| START-HERE generic | no package-specific path/checksum | handoff is too vague | Replace with package-specific copy only |
| Runbook stale | `bd6` appears anywhere in package location | instructions point at the wrong artifact | Replace only the stale package-location text |
| Diagnostic overlay shown | startup block text appears | app needs a runtime fix | Instruct Alan to copy the visible error text only |
| Safe to continue | no blocker, checklist card visible | local validation can proceed | Keep the safety reminder visible but brief |

---

## 6. Disabled-reason text

Use these exact lines when the package or handoff is not ready:

- `Validation blocked: the BE6 ZIP is missing from dist/release/. Rebuild the package before asking Alan to test.`
- `Validation blocked: the START-HERE handoff is still generic. It must name the current package and checksum.`
- `Validation blocked: the runbook still points at bd6. Refresh the package-location copy first.`
- `Validation blocked: no checksum is available for the current archive. Do not ask Alan to guess.`

If the rebuilt archive becomes `bf6`, replace `BE6` with `BF6` in the first message and update the package prefix tokens in the other messages.

---

## 7. Manual checklist wording

The copy should guide Alan through the following exact reading order on Windows:

1. Open File Explorer and paste the UNC path.
2. Copy the ZIP to a local folder.
3. Extract the ZIP.
4. Open the extracted folder.
5. Read `START-HERE-WINDOWS.txt` before launching the app.
6. Confirm the P0 Re-Acceptance Checklist card is visible in the app.
7. If a startup diagnostic appears, copy only the visible error text.
8. Proceed only with local validation; do not touch live ServiceNow.

The wording should stay short enough to fit on one screen without turning into a runbook lecture.

---

## 8. Accessibility / readability notes

- Keep the wording short and concrete.
- Put the UNC path in a plain code block so it is easy to select.
- Put the checksum on its own line so it can be copied without hunting.
- Keep the safety reminder as a final short paragraph, not a wall of text.
- Avoid synonyms for the package name in the same block; use the exact prefix consistently.

---

## 9. Open Design / research note

Public product references reviewed for layout principles only:
- Claude Code desktop/product page: command-center thinking, multiple parallel tasks, visible status, and a central work surface.
- Open Design content root is available locally, but no bound project template was needed for this copy-only task.

No brand text or UI copy was reused.

---

## 10. GPT Images 2 mockup note

Attempted sanitized mockup generation twice with `image_generate` using fake three-column operator workbench prompts.

Result:
- both attempts failed with `FalClientHTTPError`
- no image artifact was produced

Because this task is copy-focused and the image backend failed, the spec proceeds without an attached mockup artifact.

---

## 11. Implementation handoff for `sna-frontend-workbench`

Smallest safe implementation plan:
1. Update the `write_start_here()` block in `scripts/packaging/build-windows-rc.sh` with the package-specific text above.
2. Replace runbook §3 in `docs/test/windows-clean-machine-validation-2026-06-07.md` with the exact package-location block above.
3. Keep every other validation step, heading, and safety rule unchanged.
4. Verify the resulting text still blocks live ServiceNow activity and still tells Alan exactly where to find the package, checksum, and checklist card.

Why this is minimal:
- only copy changes
- no structural runbook edits
- no UI changes
- no runtime behavior changes
- no new instructions beyond the package handoff already required by BF1

---

## 12. Approval checkpoint

This BF2 spec is ready for implementation only if Alan agrees that the BE6 package name is still the correct validation target.

If the package prefix changes to `bf6`, the copy should be updated by token substitution only; the rest of the language should remain unchanged.
