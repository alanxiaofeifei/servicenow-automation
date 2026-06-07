# Phase AX1 — Repo-Hygiene Action-Button Disabled Reason Specificity — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_c34c155c`

---

## 1. Current state — ground truth from AW6

The latest completed gate is **AW6 final local readiness gate**. The current local Windows package baseline is the **AW5 build**:

| Property | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-aw5-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aw5-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-aw5-20260607-local.zip` |

**dist/release/ inventory:**

| File | Role |
|---|---|
| `*aw5-20260607-local.zip` | **Newest/current** manual validation target |
| `*av6-20260607-local.zip` | Older — archive-only |
| `*au6-20260607-local.zip` | Older — archive-only |
| `*at6-20260607-local.zip` | Older — archive-only |
| `*as6-20260607-local.zip` | Older — archive-only |
| `*ar3-20260607-local.zip` | Older — archive-only |
| `*aq6-20260607-local.zip` | Older — archive-only |

---

## 2. What was deferred from AP4 — the problem statement

The AP4 QA acceptance document (phase-AP4-qa-acceptance-manual-checklist-2026-06-07.md) explicitly noted:

> "The action-button disabled logic from AL3 was preserved as-is (no new item-specific disabled reasons added in this phase), which is correct per the non-goals."

The remaining-risk section stated:

> "The disabled reasons on action buttons are basic (`!hygieneScanResult`). Item-specific disabled reasons (e.g., 'Cleanup preview disabled: item is already verified') could be added in a future phase."

This is the **last remaining AP4 polish gap**. The three-column layout, state chips, evidence display, and boundary copy are all complete. Only the disabled-reason strings need enhancement.

---

## 3. Current disabled-reason implementation — ground truth

### Repo-hygiene action buttons (App.tsx lines 4402–4442)

| Button | Disabled condition | Current inline reason |
|---|---|---|
| **Refresh local scan** | Always enabled | — |
| **Open workspace root** | Always enabled | — |
| **Export status markdown** | `!hygieneScanResult` | "No scan data yet. Run Refresh local scan first." |
| **Copy selected summary** | `!hygieneScanResult` | (same generic reason) |
| **Cleanup preview** | `!hygieneScanResult \|\| cleanupArchiveDone` | (same generic reason) |
| **Archive stale artifacts** | `!cleanupPreviewResult \|\| !cleanupPreviewOpen \|\| cleanupArchiveInProgress \|\| cleanupArchiveDone` | "Generate Cleanup preview first to enable archiving." or "Archive complete…" |

All six buttons use a **single shared block** of inline disabled-reason `<small>` elements:

```tsx
{/* Inline disabled reasons */}
{!hygieneScanResult && (
  <small className="hygiene-action-disabled">No scan data yet. Run Refresh local scan first.</small>
)}
{hygieneScanResult && !cleanupPreviewResult && (
  <small className="hygiene-action-disabled">Generate Cleanup preview first to enable archiving.</small>
)}
{cleanupArchiveDone && (
  <small className="hygiene-action-disabled-green">Archive complete. The selected item moved to the local archive area.</small>
)}
```

**Problem:** The first reason ("No scan data yet. Run Refresh local scan first.") applies to three different buttons with different functions — Export, Copy, and Cleanup preview each have different purposes, yet share the same generic message. The "Archive stale artifacts" button currently has no explicit disabled reason for its `cleanupArchiveInProgress` state.

### Worktree acceptance card — model to follow (App.tsx lines 4547–4567)

The worktree acceptance card uses **per-condition item-specific disabled reasons**, each placed adjacent to the exact button it describes:

```tsx
{packageMetadata && !packageMetadata.ok && (
  <p className="worktree-accept-action-disabled-reason">No package found.</p>
)}
{!packageMetadata && (
  <p className="worktree-accept-action-disabled-reason">Package metadata is still loading.</p>
)}
{worktreeHasDirtyChanges && !worktreeDiffReviewed && (
  <p className="worktree-accept-action-disabled-reason">Review the current diff first.</p>
)}
{worktreeReviewed && !justReviewed && (
  <p className="worktree-accept-action-disabled-reason">Already reviewed locally.</p>
)}
```

Each disabled reason is **physically positioned next to the button it describes** and is **conditionally rendered only when that specific condition applies**.

---

## 4. Scope — what AX includes

### AX1 — Scope document (this document)

### AX2 — UX spec (assigned: sna-ui-designer)

Define the exact per-button disabled reason strings and placement rules. The target pattern is:

#### Export status markdown
| Condition | Disabled reason |
|---|---|
| `!hygieneScanResult` | "Scan first to generate a status report." |

#### Copy selected summary
| Condition | Disabled reason |
|---|---|
| `!hygieneScanResult` | "Scan first before copying item summaries." |

#### Cleanup preview
| Condition | Disabled reason |
|---|---|
| `!hygieneScanResult` | "Scan first to preview cleanup." |
| `cleanupArchiveDone` | "Cleanup already applied for this batch." |

#### Archive stale artifacts
| Condition | Disabled reason |
|---|---|
| `!cleanupPreviewResult` | "Generate preview first before archiving." |
| `!cleanupPreviewOpen` | "Open the cleanup preview to enable archiving." |
| `cleanupArchiveInProgress` | "Archiving stale artifacts…" |
| `cleanupArchiveDone` | "Archive already complete." |

**Placement rule:** Each disabled reason `<p>` (using `worktree-accept-action-disabled-reason` class for consistency) should be placed immediately after its corresponding button within the same DOM container, matching the worktree card pattern.

**Acceptance criteria:**
- [ ] Each of the 5 buttons (excluding always-enabled Refresh and Open) has its own disabled reason(s)
- [ ] Multiple conditions per button are OR'd — only the first matching condition is shown
- [ ] Reason string uses `worktree-accept-action-disabled-reason` class (consistent with worktree card)
- [ ] Green confirmation color (`disbaled-green` variant) preserved for post-archive success message
- [ ] No behavioral changes — disabled/enabled logic stays identical
- [ ] No new state variables or IPC handlers

### AX3 — Implementation (assigned: sna-frontend-workbench)

Wire item-specific disabled reasons in `apps/desktop/src/App.tsx` following the UX spec (AX2).

**Change pattern:**
- Replace the single shared disabled-reason block (lines 4431–4440) with per-button disabled-reason elements
- Each button gets its own `<p className="worktree-accept-action-disabled-reason">` rendered conditionally
- Use CSS class `worktree-accept-action-disabled-reason` (already exists, used by worktree card)
- Preserve `hygiene-action-disabled-green` class for the post-archive success message
- No changes to button `disabled` logic, `onClick` handlers, state variables, or JSX structure outside the disabled-reason block

**Files affected:**
- `apps/desktop/src/App.tsx` — ~20 lines changed (disabled reason block only)
- No CSS changes (reuses existing `worktree-accept-action-disabled-reason` class)
- No other files touched

**Acceptance criteria:**
- [ ] Per-button disabled reasons match AX2 spec exactly
- [ ] `!hygieneScanResult` reason shows only when applicable button is disabled
- [ ] `cleanupArchiveDone` reason shows only for Cleanup preview and Archive buttons when done
- [ ] `cleanupArchiveInProgress` reason shows for Archive button during archiving
- [ ] No duplicate or overlapping disabled reasons rendered at the same time
- [ ] `pnpm build` — PASS
- [ ] `pnpm typecheck` — PASS
- [ ] `pnpm test` — PASS (no regression)
- [ ] `pnpm privacy:scan` — PASS
- [ ] No state/logic changes beyond the disabled reason block

### AX4 — QA acceptance (assigned: sna-qa-acceptance)

Run the following checks:
- [ ] All 4 gates pass (build, typecheck, test, privacy:scan)
- [ ] Each button's disabled reason is correct per AX2 spec
- [ ] No duplicate reasons shown simultaneously
- [ ] Only first-matching condition is rendered per button
- [ ] CSS classes render correctly (`worktree-accept-action-disabled-reason` and `hygiene-action-disabled-green`)
- [ ] Regression: worktree acceptance card disabled reasons unchanged
- [ ] No behavioral changes to button enabled/disabled logic

### AX5 — Privacy/security audit (assigned: sna-privacy-security)

Independently verify:
- [ ] No new data exposure — disabled reasons are static strings, not dynamic content
- [ ] No new IPC channels or Electron API usage
- [ ] No raw ServiceNow URLs, sys_ids, credentials, or session data in disabled reason strings
- [ ] No new state variables — UI-presentation only
- [ ] Privacy scan: PASS

### AX6 — Windows local package refresh (assigned: sna-windows-runtime)

Rebuild the Windows local package after implementation:
- [ ] `pnpm package` — PASS
- [ ] Package file created in `dist/release/` with AX-phase prefix
- [ ] SHA256 checksum recorded

### AX7 — Final local readiness gate (assigned: sna-release-docs)

Apply the standard readiness checklist:
- [ ] AX4 QA PASS
- [ ] AX5 privacy/security APPROVE
- [ ] AX6 package refresh PASS
- [ ] pnpm build PASS
- [ ] pnpm typecheck PASS
- [ ] pnpm test PASS
- [ ] pnpm privacy:scan PASS
- [ ] AX6 package is newest in dist/release/

---

## 5. Dependency graph

```
AX1 (scope doc) ──► AX2 (UX spec) ──► AX3 (implementation) ──► AX4 (QA) ──┐
                                                                   │       ├──► AX6 (package) ──► AX7 (gate)
                                                                   └──► AX5 (privacy) ─┘
```

Dependencies:
- AX2 depends on AX1 (scope defines what to spec)
- AX3 depends on AX2 (must have UX spec to implement)
- AX4 depends on AX3 (must have code to verify)
- AX5 depends on AX3 (must have code to audit)
- AX6 depends on AX4 + AX5 (both must pass before package refresh)
- AX7 depends on AX4 + AX5 + AX6 (all gates must pass)

---

## 6. Non-goals

These are explicitly **out of scope** for AX:

- **No behavioral changes** — the disabled/enabled logic for every button stays identical. Only the displayed reason string changes.
- **No new state variables, IPC handlers, or Electron APIs.**
- **No new cards, panels, or layout changes.**
- **No CSS changes** — reuses existing `worktree-accept-action-disabled-reason` class.
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values.**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes.**
- **No refactoring of existing IPC handlers, preload bridge, or main.ts routing.**
- **No changes to worktree acceptance card disabled reasons** — those are already item-specific and outside scope.
- **No integration/e2e tests** — unit tests already pass.
- **No changes to test files** — this is UI text only.

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|---|---|---|
| AX2 | `docs/status/phase-AX2-ux-spec-*.md` | < 40 lines |
| AX3 | `apps/desktop/src/App.tsx` | ~20 lines (disabled reason block only) |
| AX4 | QA checklist doc | < 30 lines |
| AX5 | Security audit doc | < 30 lines |
| AX6 | Build/packaging scripts | < 20 lines |
| AX7 | Gate document | < 40 lines |

**Total estimated change budget:** < 180 lines across 6 files.
**No production logic changes.** Only UI text strings change in the implementation task.

---

## 8. Safety boundaries

### Safe (UI text changes only)

| Concern | Why it's safe |
|---|---|
| Disabled reasons are static string literals | No dynamic content, no template injection, no data exposure |
| Reuses existing CSS class | No new styling, no layout impact |
| No behavioral changes | `disabled` attribute logic unchanged; only the rendered explanation text changes |
| No new state | All conditions already exist in component state |
| No new IPC | No new handlers, channels, or Electron API calls |

### Red-zone (explicit prohibitions — identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- Local-only only; no external writes or deliveries
- No new IPC handlers or Electron API usage

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing + new tests pass
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (AX6)
- Final local readiness gate before Alan manual validation (AX7)

---

## 10. Why this is not P0 recovery work

The system-level P0 goals (Windows double-click, startup diagnostics, QA Chromium visibility, CDP readiness, Verify/Verify-only separation, three-column layout, Windows package path) were all verified as PASS across the AQ–AW chain. The remaining repo-hygiene disabled-reason polish was explicitly deferred from AP4 as a non-goal, not a bug or regression.

This scope is UI-text-only, zero-behavioral-risk, and closes the last visible polish gap from the AP4 milestone.

---

## 11. Status

```
Phase AX1 — REPO-HYGIENE ACTION-BUTTON DISABLED REASON SPECIFICITY

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: AW6 (final local readiness gate)
Current package: *aw5-20260607-local.zip

AP4 polish gap remaining:
  - Action-button disabled reason specificity: NOT STARTED ← THIS SCOPE

Downstream tasks: 6
  - AX2: UX spec — per-button disabled reason strings and placement rules
    → sna-ui-designer [first]
  - AX3: Implementation — wire per-button disabled reasons in App.tsx
    → sna-frontend-workbench [after AX2]
  - AX4: QA acceptance → sna-qa-acceptance [after AX3]
  - AX5: Privacy/security audit → sna-privacy-security [after AX3]
  - AX6: Windows local package refresh → sna-windows-runtime [after AX4 + AX5]
  - AX7: Final local readiness gate → sna-release-docs [after AX4 + AX5 + AX6]

Red-zone items excluded: 16
Non-goals: 8 (no behavioral changes, no new state, no CSS changes, no new IPC,
           no ServiceNow, no Git push, no refactoring, no test changes)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
