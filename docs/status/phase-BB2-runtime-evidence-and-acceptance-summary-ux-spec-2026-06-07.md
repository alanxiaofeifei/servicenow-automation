# Phase BB2 — Runtime Evidence and Acceptance Summary — UX/Copy Spec

**Date:** 2026-06-07  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**Profile:** `sna-ui-designer`  
**Task:** `t_9db308cb`

---

## 1. Purpose

This spec defines the exact UX/copy for the acceptance-summary refinement that sits beside the existing right-rail runtime evidence.

The goal is to make the local package anchor, latest validation run, and acceptance checkpoint readable at a glance without exposing raw sensitive values or adding any new panels.

Scope is copy/state only:

- keep the current right-rail runtime evidence panel
- keep the existing worktree acceptance checkpoint
- add a compact acceptance summary block that mirrors those two signals
- do not add new actions, IPC, or layout regions

---

## 2. Design references used

Open Design references used for this copy and hierarchy decision:

- `warm-editorial` — warm off-white paper, restrained chrome, readable long-form hierarchy
- `professional` — structured blocks, trustable enterprise scannability, clear status language

The resulting direction is warm-light, compact, and scannable:

- no pure black / pure white surfaces
- no always-expanded evidence wall
- no demo clutter
- no hidden meaning in color alone

---

## 3. Canonical block text

### 3.1 Acceptance summary block

Exact text to use:

- Eyebrow: `Local acceptance checkpoint`
- Heading: `Acceptance summary`

### 3.2 First line inside the block

The current package path must appear first and be visually dominant within the block.

Recommended copy order:

1. Label: `Current package`
2. Value: full local path, monospace
3. Optional utility text: `Open local workspace` or `Copied to clipboard` only when relevant

Example:

```text
Current package
/home/alanxwsl/projects/servicenow-automation
```

Rules:

- show the full local path first, before any validation details
- do not replace the path with a shortened nickname
- do not show remote hosts, repo URLs, or ticket-like identifiers
- if the path is too long, wrap it; do not hide it behind an unlabeled ellipsis

### 3.3 Latest validation summary

Show a single scannable sentence directly under the package path.

Canonical copy:

- Success: `Latest validation: PASS — 4 local gates passed; sanitized output only.`
- Running: `Latest validation: RUNNING — local checks are still in progress.`
- Failed: `Latest validation: FAIL — one or more local gates failed; see sanitized details.`
- No runs: `Latest validation: No local validation run yet.`

What counts as the “4 local gates” here:

- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm privacy:scan`

Do not print raw log lines, stack traces, file contents, URLs, IDs, or data values in the summary sentence.

### 3.4 Acceptance state line

Use one short line to reconcile the worktree checkpoint with the right-rail runtime evidence.

Canonical copy:

- Accepted: `Reviewed locally: accepted.`
- Reviewed, not accepted yet: `Reviewed locally: pending acceptance.`
- Dirty or stale: `Reviewed locally: changed since the last passing run.`
- No run yet: `Reviewed locally: waiting for the first passing run.`

This line must stay consistent with the right-rail runtime evidence state. The acceptance summary is a mirror, not a second source of truth.

---

## 4. Right-rail/runtime-evidence agreement rules

The acceptance summary block and the right-rail runtime evidence panel must agree on three things:

1. the current package anchor
2. the latest validation status
3. the acceptance state label

Agreement rules:

- if the runtime evidence panel says the latest run is `PASS`, the acceptance summary must also say `PASS`
- if runtime evidence is still loading, the acceptance summary must also show loading copy
- if no validation run exists, both surfaces must say so explicitly
- if the package path changes, both surfaces must update together
- if the latest run is stale, both surfaces should say `changed since the last passing run` or equivalent sanitized wording

Important: the summary block is derived from the same local state as the right rail. It must never drift into a separate interpretation.

---

## 5. Wireframe

```text
RIGHT RAIL
┌ Runtime Evidence ─────────────────────────────┐
│ recent local evidence items                    │
│ ...                                            │
└────────────────────────────────────────────────┘

┌ Local acceptance checkpoint ───────────────────┐
│ Acceptance summary                              │
│ Current package                                 │
│ /home/alanxwsl/projects/servicenow-automation   │
│ Latest validation: PASS — 4 local gates passed │
│ Reviewed locally: accepted.                    │
└────────────────────────────────────────────────┘
```

This is a compact mirror of the evidence rail, not a new top-level card family.

---

## 6. State matrix

| State | Eyebrow | Heading | Package line | Validation line | Acceptance line | Notes |
|---|---|---|---|---|---|---|
| Loading | `Local acceptance checkpoint` | `Acceptance summary` | `Current package` shown as skeleton/placeholder | `Loading local acceptance summary…` | `Reviewed locally: waiting for the first passing run.` | Keep the block visible so the rail does not jump |
| No package selected | same | same | `Current package unavailable` | `Latest validation: No local validation run yet.` | `Reviewed locally: waiting for a package.` | Use one sentence only; do not invent a path |
| No runs | same | same | full local path | `Latest validation: No local validation run yet.` | `Reviewed locally: waiting for the first passing run.` | This is the default empty state |
| Running | same | same | full local path | `Latest validation: RUNNING — local checks are still in progress.` | `Reviewed locally: pending acceptance.` | Show a busy indicator, not a spinner wall |
| Pass, not yet accepted | same | same | full local path | `Latest validation: PASS — 4 local gates passed; sanitized output only.` | `Reviewed locally: pending acceptance.` | This is the common “ready for review” state |
| Accepted | same | same | full local path | `Latest validation: PASS — 4 local gates passed; sanitized output only.` | `Reviewed locally: accepted.` | Use a compact success chip, not a celebratory banner |
| Dirty after pass | same | same | full local path | `Latest validation: PASS — 4 local gates passed; sanitized output only.` | `Reviewed locally: changed since the last passing run.` | Mark as stale if local edits happened after the pass |
| Failed | same | same | full local path | `Latest validation: FAIL — one or more local gates failed; see sanitized details.` | `Reviewed locally: pending acceptance.` | Failure should be explicit but not noisy |
| Error reading local state | same | same | `Current package unavailable` | `Latest validation unavailable.` | `Reviewed locally: unavailable.` | This is for read/parse failure only |

---

## 7. Disabled-reason language

Any control that depends on run state or acceptance state must explain why it is disabled.

Use these exact reason strings:

- No package selected: `Disabled until a local package is selected.`
- No validation run yet: `Disabled until the first local validation run completes.`
- Run still in progress: `Disabled while the latest validation run is still in progress.`
- Latest run failed: `Disabled until a passing local validation run is available.`
- Package changed after pass: `Disabled until the package is revalidated.`
- Already accepted: `Disabled because this package is already accepted.`
- Local state unavailable: `Disabled because the local acceptance state could not be read.`

Rules for disabled copy:

- say what is missing, not what the user “did wrong”
- keep the phrase short enough to fit in a tooltip or inline help row
- do not use a generic “not available” unless the read itself failed
- pair the disabled reason with a visible state label in the same block

---

## 8. Empty / loading / error copy

### 8.1 Loading

Primary copy:

- `Loading local acceptance summary…`

Support copy:

- `Reading the current package path and latest sanitized validation result.`

### 8.2 No runs

Primary copy:

- `No local validation run yet.`

Support copy:

- `Run build, typecheck, test, and privacy scan locally to create the first summary.`

### 8.3 Error

Primary copy:

- `Acceptance summary unavailable.`

Support copy:

- `The local package state could not be read.`

### 8.4 No package selected

Primary copy:

- `No current package selected.`

Support copy:

- `Open a local worktree to show the package path and validation summary.`

---

## 9. Accessibility and readability notes

- Use a warm-light background and avoid pure black text/surfaces.
- Keep the package path in monospace, but keep the heading and status lines in the normal UI font.
- Preserve large touch/click targets for any related action in the rail.
- Use clear text labels such as `PASS`, `FAIL`, `RUNNING`, `No local validation run yet` so color is not the only signal.
- Support wrapping for the full package path; do not make the user horizontally scroll to understand the current package.
- Keep line length short enough for comfortable scanning in the right rail.
- Announce validation-state changes with polite live-region behavior if the summary updates while the user is on the page.
- Use sentence case for the summary lines so the block reads like operational status, not marketing.
- Do not overstate certainty: only say `accepted` when the local state actually says accepted.

---

## 10. GPT Images 2 mockups

Attempted in this run with sanitized fake data only.

Result:

- prompt 1: warm-light three-column operator workbench mockup with fake package path and validation summary
- prompt 2: warm-light acceptance-summary concept with current package path first and runtime evidence rail on the right
- outcome: both image generation calls returned `FalClientHTTPError`, so no image artifact was produced in this run

If image generation is retried later, keep the same sanitized constraints:

- use a fake local package path only
- do not use real ServiceNow data
- do not include raw URLs, ticket IDs, sys_ids, requester names, or field values
- keep the summary copy identical to the spec above so the mockup validates the text, not just the layout

---

## 11. Implementation handoff for `sna-frontend-workbench`

### What to update

- keep the existing runtime evidence panel
- add or revise the acceptance summary block text only
- derive both surfaces from the same local state source
- ensure the package path is the first visible data line in the summary block
- ensure no raw sensitive values enter the summary text

### Files likely affected

- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

### Expected behavior

- the summary appears warm, compact, and readable
- the current package path is shown first and clearly
- the latest validation state and acceptance state agree with the runtime evidence rail
- empty/loading/no-runs/error states use the exact copy above
- disabled controls explain why they are disabled

### Verification focus

- confirm the summary mirrors the runtime evidence panel
- confirm no sensitive values are copied into the new copy strings
- confirm the block remains readable at a glance
- confirm disabled reasons are present wherever acceptance/run state is required
- confirm the implementation stays local-only and read-only

---

## 12. Safety / privacy status

This spec is local-only and read-only.

No ServiceNow login, browsing, update, submit, resolve, close, attachment upload, Microsoft Graph / Excel write, Teams / Outlook ingestion, push, PR, merge, tag, release, or cron change is requested by this document.

The copy intentionally avoids raw URLs, ticket IDs, sys_ids, requester names, assignment groups, storage-state, traces, screenshots, and other sensitive artifacts.

---

## 13. Final note

This refinement is intentionally small: one acceptance-summary block, one mirrored runtime-evidence relationship, and one consistent disabled-state vocabulary.

The operator should be able to glance at the package path, latest validation result, and acceptance state without cross-checking multiple rails in their head.
