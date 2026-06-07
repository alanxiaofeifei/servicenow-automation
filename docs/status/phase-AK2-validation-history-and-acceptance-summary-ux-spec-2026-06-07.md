# Phase AK2 — Validation History and Acceptance Summary UX/Copy Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only copy and micro-layout cleanup for validation history + acceptance summary clarity

## 0. Preflight

Goal
- Make the worktree acceptance surface show a clear validation history for the current local package instead of a static `No prior acceptance recorded` line.
- Preserve the exact current local package path and the existing archival/stale package demotion rules.
- Keep the current package visually and textually distinct from archival AJ/AI/AG/AH packages.

Known facts
- The current local Windows package remains the AJ7 zip below.
- The acceptance surface already has a `validationRunHistory` and `worktreeAccepted` state available to drive copy.
- Older AJ/AI/AG/AH packages are archival only and must not be presented as the current checkpoint.
- This task is design/spec only; no live ServiceNow login, browser automation, upload, write, push, PR, merge, tag, release, or cron changes are allowed.

Assumptions
- Alan wants the validation-history summary visible without opening a drawer.
- Alan wants the pending vs accepted state to read like a local human-review checkpoint, not a release log.
- The summary should stay short enough to scan in one pass.

Ambiguities
- Whether the history block should be titled `Validation history` or `Last validation round` in the final UI.
- Whether the accepted state should be phrased as `Accepted locally` or `Reviewed locally`.
- Whether the current package path should appear as a supporting line under the summary or as a separate metadata row.

Chosen smallest approach
- Keep the existing acceptance surface structure.
- Change only copy and micro-layout emphasis: current package first, validation history explicit, archival packages visually demoted.
- Avoid any new cards, actions, or external integrations.

Files likely affected
- `docs/status/phase-AK2-validation-history-and-acceptance-summary-ux-spec-2026-06-07.md` only

Verification plan
- Check that the exact current package path appears in the spec and is clearly treated as the current checkpoint artifact.
- Check that the pending and accepted validation-history copy is explicit and short.
- Check that older AJ/AI/AG/AH aliases are explicitly archival only and never presented as current.
- Check that no wording implies live ServiceNow writes, uploads, or release actions.

## 1. Purpose

Turn the validation-history and acceptance-summary surface into one visible place where Alan can answer, in one glance:

1. What is the exact local Windows package I should validate now?
2. Is this checkpoint still pending manual validation, or already accepted locally?
3. What is the last validation round, if any?
4. Which older packages are archival only?
5. What helper text tells me what to do next without implying a ServiceNow write?

This is not a release dashboard and not a live ServiceNow control panel.
It is a local-only acceptance checkpoint for validation history, manual sign-off, and archival clarity.

## 2. Exact current package identity

The current local Windows package Alan should test today remains:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip
```

This exact path is the test target until AK6 refreshes a new AK-dated package.

### Recommended current-package label

Use this exact visible label:

```text
Current local Windows package
```

Recommended supporting copy:

```text
This is the package Alan should validate now.
```

Do not prepend AJ/AI/AG/AH phase aliases to the current label.
Do not present an older archival package as the checkpoint by color, ordering, or proximity.

## 3. Validation-history summary copy

This round defines the exact wording for the validation-history summary in the two primary states.

### Pending state

Use this exact summary line when no local acceptance has been recorded yet:

```text
No prior acceptance recorded. The checkpoint remains unconfirmed.
```

Recommended helper text:

```text
Validate the current local Windows package, then mark reviewed once the result is confirmed.
```

Recommended supporting line:

```text
Current local package: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip
```

### Accepted state

Use this exact summary line when the current local package has been accepted locally:

```text
Accepted locally. The checkpoint is confirmed.
```

Recommended helper text:

```text
The current local Windows package has a recorded manual validation. Older AJ/AI/AG/AH packages stay archival only.
```

Recommended supporting line:

```text
Current local package: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip
```

### Optional last-run detail

If a last validation run exists, the summary may append one compact line below the state copy:

```text
Last validation round: {action} — {status} at {timestamp}. Sanitized summary: {summary}
```

Rules for that line:
- Keep the timestamp sanitized and local-only.
- Keep the summary short.
- Do not introduce raw URLs, ticket IDs, requester names, or other field values.
- Do not let the history detail replace the current-package identity line.

## 4. Archived package wording

Older AJ/AI/AG/AH packages are historical records only.
They may remain visible in history, but they must be explicitly demoted so they cannot be read as current.

### Recommended archive label

Use this exact visible label for older packages:

```text
Archived local Windows package
```

Recommended supporting copy:

```text
Superseded by the current package; do not test this checkpoint.
```

### Required archive badge wording

If a compact badge is shown, use one of these exact phrases only:

- `Archival only`
- `Superseded`
- `Not current`

Preferred default: `Archival only`

### Archive policy

- AJ, AI, AG, and AH aliases are archival only.
- They must not be presented as the current checkpoint.
- They must not be the first item in the list.
- They must not use stronger visual emphasis than the current package.
- They must not reuse the current-package label.

## 5. Micro-layout guidance

Keep the existing three-column acceptance surface, but adjust emphasis so the current package and validation summary dominate the first scan.

### Left column — package list and history
Owns the package rows and history entries.

Rules
- Current package appears first.
- Archived packages appear below it and use muted styling.
- History can mention AJ/AI/AG/AH aliases only as archival records.
- Do not use alias wording in the row title for the current package.

### Center column — selected package detail
Owns the exact path and the validation-history summary.

Rules
- Show the current package path immediately.
- Keep the archive explanation one level below the current path.
- Keep the validation summary short and directly actionable.
- Use progressive disclosure for archival details.

### Right column — safety and local actions
Owns compact safety copy and local-only controls.

Rules
- Keep local-only boundary copy visible.
- Disabled actions must say why they are disabled.
- No action should imply ServiceNow login, update, resolve, or close.

## 6. State matrix

| State | Visible label behavior | Copy requirement |
| --- | --- | --- |
| Empty | No package selected | `Current local Windows package` appears as the target label once a package is resolved |
| Pending local validation | Current row is visible but unaccepted | `No prior acceptance recorded. The checkpoint remains unconfirmed.` |
| Accepted locally, no runs yet | Current row is accepted | `Accepted locally. The checkpoint is confirmed.` with no last-run detail |
| Runs exist, not accepted | Last run is shown | `Last validation round: {action} — {status} at {timestamp}. Sanitized summary: {summary}` |
| Runs exist, accepted locally | Accepted state plus last run | `Accepted locally. The checkpoint is confirmed.` plus the last-run line |
| Archive row selected | Muted row | Label is `Archived local Windows package` and is clearly superseded |
| Error / unresolved path | Safe fallback text | Explain what failed without implying a different package is current |

Notes
- Avoid spinner-only states.
- Use muted placeholders or short status text while metadata is resolving.
- Keep the last safe package visible whenever possible.
- A stale package must never look current by color alone.

## 7. Main components

- title bar with validation-history and acceptance-summary title
- current-package banner with the exact UNC path
- current-state strip for pending vs accepted local validation
- validation-history summary block
- manual-validation boundary note, if shown, kept compact
- archived-package list with demotion styling
- compact safety badge / chip
- local-only actions row
- footer boundary note
- bottom-left settings entry

## 8. Empty, loading, and error states

### Empty states
Use one sentence and one next action.

Recommended copy:
- `No checkpoint selected yet.`
- `Open the latest local package to begin.`
- `The path, validation state, and archival notes will appear here.`

### Loading states
Use muted placeholders, not a spinner wall.

Example copy:
- `Resolving the current checkpoint...`
- `Loading validation history...`
- `Preparing the acceptance summary...`

### Error states
Show the exact step that failed.

Example copy:
- `The current package could not be resolved.`
- `Validation history is unavailable right now.`
- `Open the last safe checkpoint or refresh the local package list.`
- `The surface remains local-only; no remote action was attempted.`

## 9. Button enable / disable logic

This AK2 round does not add new actions.
Use only the existing local-only controls, with clearer disabled reasons.

### Enabled
- `Copy package path` — when a current package is selected.
- `Open dist/release` — when the local workspace path resolves.
- `Copy summary` — when a row or summary item is selected.

### Disabled with reasons
- `Archive details` — disabled unless an archived row is selected.
- `Mark reviewed` — disabled until the current package is visible and validation context is loaded.
- Any action that would imply ServiceNow writes — disabled and explained as local-only only.

### Disabled-state copy
Use explicit reasons such as:
- `Disabled until the current package is selected.`
- `Disabled because this row is archival only.`
- `Disabled: local-only surface, no ServiceNow action available.`

## 10. Copy rules

These rules apply to the acceptance surface and this status-doc family.

Must
- Use `Current local Windows package` for the current test target.
- Use `Archived local Windows package` for older AJ/AI/AG/AH items when shown.
- Use `No prior acceptance recorded. The checkpoint remains unconfirmed.` for the pending summary.
- Use `Accepted locally. The checkpoint is confirmed.` for the accepted summary.
- Use `Manual validation` language where a helper line is needed.
- Keep the current package path exact and unmodified.

Must not
- Say `AJ local Windows package`, `AI local Windows package`, `AG local Windows package`, or `AH local Windows package` for the current checkpoint.
- Present archival aliases as the active package.
- Make archival packages look current through color or ordering.
- Add any ServiceNow write implication.

## 11. Accessibility notes

- Use warm-light defaults and avoid pure black surfaces.
- Keep the current-package path in a readable font size with generous line height.
- Do not rely on color alone to distinguish pending, accepted, and archival states.
- Make disabled-state reasons visible in text, not only in tooltips.
- Keep the summary to one or two short sentences so it is readable for astigmatism-friendly scanning.
- Use progressive disclosure for archival detail so the first scan stays calm.

## 12. GPT Images 2 mockups generated

None were generated in this run.

I attempted two sanitized GPT Images 2 prompts for a warm-light three-column operator workbench, but image generation returned a failure, so no image artifacts were produced.

## 13. Implementation handoff for `sna-frontend-workbench`

This section is the minimal handoff for the implementation task that follows approval.

### Intent
- Replace the static `No prior acceptance recorded` line with the stateful copy defined above.
- Preserve the exact current local package path.
- Keep archival AJ/AI/AG/AH packages demoted and clearly non-current.

### Required behavior
- Pending state uses the exact pending summary copy.
- Accepted state uses the exact accepted summary copy.
- A last-run line may appear only when validation history exists.
- The current package path remains visible even when a last-run line is present.
- No new actions, integrations, or workflow changes are introduced.

### Likely touch points
- Acceptance-summary / validation-history rendering in the existing worktree acceptance surface.
- Copy constants or inline strings for the pending and accepted states.
- Tests for the pending/accepted and runs/no-runs combinations.

### Acceptance criteria
- The current package path is still explicit.
- The history text changes with validation state.
- Older AJ/AI/AG/AH packages remain archival only.
- The UI still reads as a local-only human-reviewed checkpoint.
- No copy implies a ServiceNow write or external side effect.

---

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
