# Phase AO4 — QA Acceptance + Alan Manual Checklist

Date: 2026-06-07
Status: **PASS — ready for manual validation only**
Privacy level: sanitized. No real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, credentials, or customer data.

## Gate summary

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm build` | PASS | 30 modules → main.js 306 kB, preload.mjs 1.6 kB, renderer built |
| `pnpm typecheck` | PASS | 7 workspace projects pass tsc --noEmit |
| `pnpm test` | PASS | 150/150 desktop, 55/55 CLI, 95/95 adapters (300 total) |
| `pnpm privacy:scan` | PASS | 288 files clean |
| `sha256sum -c` | PASS | `dist/release/` an6 package: `f96370027b41... OK` |
| Archive integrity | PASS | Expected entries present (ServiceNow Automation.exe, locales/), no forbidden markers |
| Hygiene scan | PASS | No credential/secret/token/Session/HAR markers in source; only `.not.toContain` assertions for privacy |

## AO3 acceptance criteria verification

All 9 criteria verified via code review and test output:

1. ✅ **Stale `Package archive` panel removed** — `handoff-archive-list` CSS class not found anywhere in source or tests.
2. ✅ **Generic archival-only warning** — Line 4203: "Older local builds are archival only. The current test target is the Latest local package shown above."
3. ✅ **Dynamic metadata block preserved** — The current-package metadata (`handoff-current-package`) remains as the single source of truth above the grid.
4. ✅ **No demo clutter or mode-tab noise introduced** — No new mock/demo surfaces added by AO3 changes.
5. ✅ **Local copy actions still work** — "Copy path", "Copy SHA256", "Copy summary" buttons remain in the handoff card.
6. ✅ **No live ServiceNow actions added** — No Save/Submit/Update/Resolve/Close actions; runtime rail unchanged.
7. ✅ **No raw sensitive data in UI** — Privacy scan pass, no raw URL/host/fingerprint/credential in source.
8. ✅ **Warm/light visual language preserved** — No dark/high-contrast theme changes. `data-theme="warm"` unchanged.
9. ✅ **Grid layout 2-column** — `handoff-grid-row` CSS: `grid-template-columns: repeat(2, 1fr)` (was 3).

## What AO3 changed (3 files, surgical)

| File | Change |
|------|--------|
| `apps/desktop/src/App.tsx:4203` | Stale warning: phase-letter-specific → generic archival-only |
| `apps/desktop/src/App.tsx:4205+` | Removed `handoff-panel` with 4 hardcoded archive entries |
| `apps/desktop/src/App.tsx:4209-4212` | Why-retest bullets now reference dynamic metadata block |
| `apps/desktop/src/styles.css` | `handoff-grid-row` from 3→2 columns |
| `apps/desktop/src/App.test.ts:1633` | Test comment updated, assertion for `handoff-archive-list` removed |

## What did NOT change (verified)

- Quickstart checklist — unchanged, still visible
- Human-only boundaries panel — unchanged, still visible
- Current package metadata block — unchanged, still single source of truth
- Local copy actions — unchanged placement and behavior
- Runtime readiness section — unchanged
- Worktree Acceptance card — not touched (out of AO3 scope)
- No new runtime actions introduced
- No ServiceNow behavior changes

## Alan manual checklist

Below is the checklist Alan should run on Windows for manual product acceptance.

### Prerequisites

1. The local package at `dist/release/servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` is the newest build.
2. SHA256 of the package is verified (see gate above).
3. The package was built from current worktree branch `next/post-release-operator-cockpit-ab-20260606`.

### Manual acceptance checklist

| # | Step | Expected result | Pass |
|---|------|----------------|------|
| 1 | Double-click `ServiceNow Automation.exe` | Tool window opens cleanly | ☐ |
| 2 | Check for startup diagnostic banner | If failure occurs, shows clear sanitized diagnostics + log path | ☐ |
| 3 | Click "Start QA Chromium" | Dedicated Chromium visibly launches | ☐ |
| 4 | Wait for CDP readiness | App shows sanitized CDP readiness status (not raw endpoint) | ☐ |
| 5 | Check "Verify current Incident" before CDP ready | Button is disabled with clear reason | ☐ |
| 6 | After CDP ready, check "Verify current Incident" | Button enables | ☐ |
| 7 | Click "Verify current Incident" | Verify-only runs, no ServiceNow writes occur | ☐ |
| 8 | Check "Autofill" button | Stays separated from Save/Submit/Update/Resolve/Close | ☐ |
| 9 | Check three-column UI | Left: Sources/nav/history/settings. Center: Source/detail/TicketDraft/field plan. Right: Runtime actions/templates/status/safety | ☐ |
| 10 | Navigate to Release Readiness Handoff card | Stale warning says "Older local builds are archival only" (no phase letters) | ☐ |
| 11 | Check that "Package archive" panel is gone | No hardcoded archive entries visible | ☐ |
| 12 | Check "Why retest matters" bullets | Reference dynamic metadata block, runtime readiness, archival treatment | ☐ |
| 13 | Check "Human-only boundaries" panel | Still visible with No Save/Submit/Update/Resolve/Close boundary | ☐ |
| 14 | Check for raw ServiceNow URLs/hosts | No raw URL, ticket ID, sys_id, credential, session in any UI panel | ☐ |

### Safety verification checklist

| # | Check | Expected result | Pass |
|---|-------|----------------|------|
| 1 | No raw ServiceNow URL visible | Redacted or sanitized only | ☐ |
| 2 | No ticket ID / sys_id visible | Not printed in UI, controls, or status | ☐ |
| 3 | No credential / cookie / session / storage-state exposed | Not in logs, docs, or controls | ☐ |
| 4 | Verify-only remains read-only | Does not write to ServiceNow | ☐ |
| 5 | Autofill stays gated | Cannot trigger Save/Submit/Update/Resolve/Close | ☐ |

## Verdict

**PASS** — All 4 automated gates pass. All 9 AO3 acceptance criteria verified via code review and passing tests. The AO3 changes are surgical (3 files, <20 net changed lines for the AO3-specific scope). No safety or privacy violations detected.

Ready for Alan's manual validation on Windows using the checklist above.

## Risks

- The worktree has uncommitted changes from multiple phases (AN, AM, AL, AK, AJ, AI, AH, AG) interleaved with AO3. The AO3-specific changes are correct and isolated, but Alan should validate the full package on Windows.
- The manual checklist assumes the latest package (an6) includes all interleaved phase changes. If Alan rebuilds after committing, the sha256 will change and the package path may update.
