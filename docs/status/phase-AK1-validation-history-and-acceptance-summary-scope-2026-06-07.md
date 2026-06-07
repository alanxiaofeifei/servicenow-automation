# Phase AK1 — Validation History and Acceptance Summary Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AJ7 base:** `a76dc28d` (AJ7 follow-up — rebuild Windows package after stale AI6 copy fix) + all AJ-phase artifacts
**Profile:** `sna-orchestrator`
**Task:** `t_c6ddbb69`

---

## 1. Why this phase — the remaining UX gap after AJ7

### AJ7 outcome

AJ7 (final local readiness gate for the package-path clarity round) returned **READY-FOR-MANUAL-VALIDATION-ONLY**. The current AJ7 zip is built, checksum-verified, and the worktree-acceptance UI has correct generic labels ("Current local Windows package," not "AG" or "AI6").

### The remaining gap — validation-history surface

The worktree-acceptance queue surface at `apps/desktop/src/App.tsx:4312-4318` has a **"Last validation round"** row that always renders:

```
<strong>Last validation round</strong>
<p>No prior acceptance recorded. The checkpoint remains unconfirmed.</p>
```

This copy is **static** — it never changes regardless of:

- Whether Alan has already performed a QA Chromium launch (validation run recorded in `validationRunHistory`)
- Whether Alan has clicked **Mark reviewed** (setting `worktreeAccepted = true`)
- How many validation runs exist in the run history

**The gap:** the acceptance surface should dynamically reflect the actual state rather than always showing the empty-state message.

### Current data already available

The `App.tsx` component already tracks:

| State variable | Type | What it holds |
|---|---|---|
| `validationRunHistory` | `QaValidationRunEntry[]` | Timestamped validation events (launch, verify, autofill) with status (ok/blocked/timeout/error) and sanitized summaries |
| `worktreeAccepted` | `boolean` | Whether Alan has clicked Mark reviewed |
| `worktreePkgMetadata` | `{path, sha256, mtime, filename, size}` | Current local package metadata, already dynamic |

The task is to **connect these existing data sources** to the queue item at line 4312–4318 so the "Last validation round" row reflects reality:

- **No runs, not accepted** → keep the empty state: "No prior acceptance recorded"
- **No runs, accepted** → "Accepted locally. No validation runs recorded yet."
- **Runs exist, not accepted** → "Last run: {action} — {status} at {timestamp}. Sanitized summary: {summary}"
- **Runs exist, accepted** → combine acceptance with last run info

---

## 2. Exact current AJ7 Windows package path

The current local Windows package Alan should test today:

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip
```

| Property | Value |
|---|---|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| **SHA256** | Verified in AJ7 gate |
| **Size** | ~118 MB |
| **Freshness rank** | #1 of 10+ in `dist/release/` (newest dated) |
| **Checksum file** | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip.sha256` |
| **Safety copy** | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local-START-HERE-WINDOWS.txt` |

### Archival aliases — do not use as current guidance

These older packages are **archival only** and should not be referenced as current in new docs, handoff text, or package-path guidance:

| Package | Phase | Status |
|---|---|---|
| `...-ai6-20260607-local.zip` | AI6 | **Archival** — superseded |
| `...-ah-20260607-local.zip` | AH | **Archival** — superseded |
| `...-ag-20260607-local.zip` | AG | **Archival** — superseded |
| `...-af-20260607-local.zip` | AF | **Archival** — superseded |
| `...-ae-20260607-local.zip` | AE | **Archival** — superseded |
| `...-ad-20260607-local.zip` | AD | **Archival** — superseded |
| `...-ab-20260607-local.zip` | AB | **Archival** — superseded |
| `...-rc.1.zip` | Canonical v0.1.0-rc.1 | **Published** — do not overwrite |
| `...-aj-20260607-local.zip` (pre-AJ7) | AJ intermediate | **Archival** — superseded by AJ7 |
| `...-aj7-20260607-local.zip` | **AJ7** | **CURRENT** |

Only the **AJ7 zip** should be referenced as the current local Windows package for manual validation. Older aliases are archival only.

---

## 3. Scope — what AK1 defines

### Deliverable A — This scope document

Defines the validation-history gap, the current AJ7 package path, archival aliases, and the AK2–AK7 task chain.

### Deliverable B — AK2–AK7 task chain (already created)

The full AK2–AK7 pipeline is already created on the kanban board by the user before this orchestrator spawn. The chain is:

| Task | Title | Assignee | Depends on | Description |
|---|---|---|---|---|
| **AK2** (t_ce84687a) | UX/copy spec — validation-history and acceptance-summary | `sna-ui-designer` | AK1 | Define exact wording for the validation-history queue item in all states (empty, runs-present, accepted, combined) |
| **AK3** (t_253386d6) | Implementation — apply validation-history polish | `sna-frontend-workbench` | AK2 | Implement the AK2 copy spec in App.tsx: make the "Last validation round" row dynamic using existing `validationRunHistory` and `worktreeAccepted` state |
| **AK4** (t_51484ccd) | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AK3 | Run all 4 gates, verify the validation-history summary updates correctly with acceptance state, provide Alan's local manual checklist |
| **AK5** (t_cb3365d0) | Privacy/security audit | `sna-privacy-security` | AK3 | Audit the updated copy for any stale/sensitive wording; no Package-path or ServiceNow identifiers leaked |
| **AK6** (t_f176db59) | Windows local package refresh | `sna-windows-runtime` | AK4 + AK5 | Rebuild a fresh AK-dated package after AK3 changes land |
| **AK7** (t_c0ad55a7) | Final local readiness gate | `codex-gpt55-control` | AK6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED |

### Dependencies

```
AK1 ──→ AK2 ──→ AK3 ──→ AK4 ──┐
                        │       ├──→ AK6 ──→ AK7
                        └──→ AK5 ──┘

AK2 (UX spec) must finish before AK3 (implementation).
AK4 (QA) and AK5 (privacy) both depend on AK3 and gate AK6.
AK6 (package refresh) depends on both QA and privacy passing.
AK7 (final gate) depends on AK6.
```

### Delta from AJ-series pattern

This AK series follows the same pipeline structure as AJ (scope → UX spec → implement → QA → privacy → package → final gate), with one difference:

- The **implementation** task (AK3) is a small copy-and-state-connectivity change in the worktree-acceptance surface, not a system-wide refactor. It connects existing state variables (`validationRunHistory`, `worktreeAccepted`) to the queue row at App.tsx:4312-4318.
- No new IPC, no new state beyond what already exists.
- The change budget is small: 1-2 files, under 50 lines.

---

## 4. Non-goals

| Item | Reason |
|---|---|
| Adding new validation-run capture mechanism | The `validationRunHistory` already exists; no new events needed |
| Adding new buttons, cards, or remote actions | Out of scope — copy and state connectivity only |
| Real ServiceNow login, browsing, API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams/Outlook/phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, cookies, storage-state, secrets | Red-zone — never captured |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Modifying historical AJ/AI/AG/AH status docs | They are archival records — do not alter |
| New feature design or implementation | Out of scope — validation-history clarity only |
| Windows packaging toolchain changes | Out of scope — package refresh only (AK6) |
| Chromium provisioning, startup diagnostics, three-column layout redesign | Separate P0 recovery threads (not AK) |

---

## 5. Safety boundary

- No real ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified — only new AK-phase docs and the updated acceptance-queue copy are in scope
- AK3 implementation is copy + state-connectivity only — no new IPC, no new actions, no functional changes beyond the validation-history display

---

## 6. Gate policy

| Gate | Required? | Rationale |
|---|---|---|
| `pnpm build` | YES (for AK3, AK6) | Must confirm changes compile |
| `pnpm typecheck` | YES (for AK3) | Must confirm TypeScript type safety after edits |
| `pnpm test` | YES (for AK3) | Tests must verify dynamic validation-history behavior |
| `pnpm privacy:scan` | YES (for AK5) | Docs and copy must not leak stale phase identifiers or real data |

AK1 (this doc) and AK2 (UX spec) are document-only — no code gates required.

---

## 7. Implementation guidance for AK3

### What to change in App.tsx (lines 4312-4318)

The "Last validation round" queue item should derive its text from existing state:

```
validationRunHistory.length === 0 && !worktreeAccepted
  → "No prior acceptance recorded. The checkpoint remains unconfirmed."

validationRunHistory.length > 0 && !worktreeAccepted
  → "Last run: {lastRun.action} — {lastRun.status} ({lastRun.timestamp}). {lastRun.sanitizedSummary}"

validationRunHistory.length === 0 && worktreeAccepted
  → "Accepted locally. No validation runs recorded."

validationRunHistory.length > 0 && worktreeAccepted
  → "Accepted locally. Last run: {lastRun.action} — {lastRun.status} ({lastRun.timestamp}). {lastRun.sanitizedSummary}"
```

Where `lastRun = validationRunHistory[validationRunHistory.length - 1]`.

The chip color and label should also be dynamic:
- No runs, not accepted: History chip (as now)
- Runs present: OK chip (green) if last run status is "ok", Blocked chip (amber) otherwise
- Accepted: Accepted chip (green)

### Test changes in App.test.ts

- Update the existing test at line 1392 (`shows validation run stats on the history page, including zero-run empty state`) or add a dedicated test
- Test each of the 4 states above
- Verify the acceptance-queue item reflects `worktreeAccepted` changes
- Verify the chip class is correct for each state

### Scope of changes

- **App.tsx**: lines 4312-4318 — change from static `<p>` to dynamic expression
- **App.test.ts**: 1-2 new test cases covering the 4 states
- **No other files** unless the copy spec demands helper text in styles.css

---

## 8. Status

```
Phase AK1 — VALIDATION HISTORY AND ACCEPTANCE SUMMARY SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream tasks already created: 6
  - AK2 (t_ce84687a): UX/copy spec                              → sna-ui-designer
  - AK3 (t_253386d6): Implementation — apply copy updates        → sna-frontend-workbench
  - AK4 (t_51484ccd): QA acceptance + Alan manual checklist      → sna-qa-acceptance
  - AK5 (t_cb3365d0): Privacy/security audit                     → sna-privacy-security
  - AK6 (t_f176db59): Windows local package refresh               → sna-windows-runtime
  - AK7 (t_c0ad55a7): Final local readiness gate                 → codex-gpt55-control

UX gap identified:
  - App.tsx:4312-4318 static "No prior acceptance recorded" text
  - Existing state (validationRunHistory, worktreeAccepted) available to make it dynamic

Current AJ7 package: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\
  servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip

Note: Older AJ/AI/AG/AH/AF/AE/AD/AB phase aliases are archival only.
The AK series will produce a fresh AK-dated package at AK6.

Red-zone items excluded: 12
Non-goals: 12
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*

---

## Appendix A — Freshness ordering from dist/release (as of AJ7)

| mtime | Filename | Status |
|---|---|---|
| Latest | `...-aj7-20260607-local.zip` | **CURRENT — AJ7** |
| ↓ | `...-aj-20260607-local.zip` | Archival (AJ intermediate) |
| ↓ | `...-ai6-20260607-local.zip` | Archival (AI6) |
| ↓ | `...-ah-20260607-local.zip` | Archival (AH) |
| ↓ | `...-ag-20260607-local.zip` | Archival (AG) |
| ↓ | `...-af-20260607-local.zip` | Archival (AF) |
| ↓ | `...-ae-20260607-local.zip` | Archival (AE) |
| ↓ | `...-ad-20260607-local.zip` | Archival (AD) |
| ↓ | `...-ab-20260607-local.zip` | Archival (AB) |
| Oldest | `...-rc.1.zip` | Canonical (published GitHub prerelease) |

The AK6 package refresh will insert a new AK-dated entry at the top of this ordering.
