# Phase AS1 — Next Visible Local Product Scope: Worktree Acceptance Action Wiring

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD:** `019c502e9b4ada63e2a0884f3783aae1a8a9ee04` (dirty worktree; local-only phase artifacts remain open)
**Profile:** `sna-orchestrator`
**Task:** `t_380fc95e`

---

## 1. Latest final gate/backlog state

### Completed gates (all PASS, READY-FOR-MANUAL-VALIDATION-ONLY)

| Phase | Series | Final gate | Current package |
|-------|--------|------------|-----------------|
| AN    | Three-column operator workbench polish | AN7 ✅ | `rc.1-an6-20260607-local.zip` |
| AO    | Stale archive entries in release-readiness card | Merged into AQ — no standalone final gate | — |
| AP    | Repo-hygiene three-column action rail + IPC | AP7 ✅ | `rc.1-ap6-20260607-local.zip` |
| AQ    | Local repo hygiene + archive demotion UI wiring | Release summary ✅ (AQ3 implementation + AQ5 privacy + AQ6 package) | `rc.1-aq6-20260607-local.zip` |

### Current AR phase status

| Task | Title | Status | Notes |
|------|-------|--------|-------|
| AR1  | Worktree acceptance action wiring — scope | ✅ DONE | Identified 7 renderer wiring gaps vs. existing IPC infrastructure |
| AR2  | UX/copy spec | ✅ DONE | Three-column layout spec, exact button labels, state matrix, disabled-reason copy, disabled/enable logic, summary format, manual checklist |
| AR3  | Implementation — wire all 5 action buttons + mount-time status + dynamic metadata | ❌ NOT STARTED | `sna-frontend-workbench` assigned, never dispatched |
| AR4  | QA acceptance | ❌ NOT STARTED | — |
| AR5  | Privacy/security audit | ❌ NOT STARTED | — |
| AR6  | Windows package refresh | ❌ NOT STARTED | — |
| AR7  | Final readiness gate | ❌ NOT STARTED | — |

**Evidence of partial AR3 attempt:** A `servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip.sha256` file was found in `dist/release/` but the zip was absent, and no AR3 implementation doc exists. No implementation was verified or completed.

---

## 2. Why this phase — the worktree acceptance action gap is now the most visible remaining defect

### What the user currently sees

The Workbench has three columns: SOURCES / WORK PRODUCT / RUNTIME. The WORK PRODUCT column contains three cards: Release Readiness Handoff, Repo Hygiene, and Worktree Acceptance Checkpoint.

The **Worktree Acceptance Checkpoint** card shows 5 action buttons: `Review diff`, `Copy package path`, `Open dist/release`, `Mark reviewed`, and `Copy summary`. **All 5 are no-op placeholders** — clicking them produces no result. The card also displays a static "Newest dated local package" message instead of the actual dynamic package metadata that the IPC layer already provides.

This is the most visible remaining defect in the post-release Operator Workbench:

1. **User-facing no-op buttons** — A user opening the desktop app sees actionable-looking buttons that do nothing. This erodes confidence.
2. **IPC infrastructure already exists** — All 5 IPC handlers (`handleWorktreeGitDiff`, `handleWorktreeOpenDistRelease`, `handleWorktreeOpenWorkspaceRoot`, `handleWorktreeStatus`, `handleWorktreePackageMetadata`) are fully implemented in `worktree-ipc.ts`, routed in `main.ts`, and exposed in the preload bridge.
3. **No new IPC or backend work needed** — This is pure renderer wiring. Low risk, high impact.
4. **UX spec already exists** — AR2 defined exact labels, state matrix, disabled reasons, summary format, and manual checklist. No redesign needed.

### What the user should see after AS

- All 5 action buttons perform real local operations
- Package metadata is dynamic (filename, size, path from IPC)
- Mount-time worktree status fetch shows dirty/fresh state correctly
- Diff preview renders in a collapsible panel
- Mark reviewed toggles acceptance state
- Copy summary produces a formatted handoff text

---

## 3. Scope — what AS includes

### Deliverable A — This scope document (AS1)

Documents:
- The current final gate/backlog state
- Why the worktree acceptance action wiring is the next visible product scope
- The 7 specific implementation gaps (inherited from AR1)
- AS2–AS7 task chain
- Current package path and UNC context
- Safety boundaries and change budget

### Deliverable B — AS2–AS7 downstream task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **AS2** | UX/copy spec — worktree acceptance action wiring | `sna-ui-designer` | AS1 | Review and adopt AR2 UX spec as-is; update stale package reference (A→AQ6→current ar3 or later); confirm exact labels, disabled reasons, state matrix, summary format, manual checklist. No redesign — adopt existing AR2 spec. |
| **AS3** | Implementation — wire all 5 action buttons + mount-time status + dynamic metadata | `sna-frontend-workbench` | AS2 | Add mount-time `getWorktreeStatus()` call in mount `useEffect`; wire onClick handlers for Review diff, Copy package path, Open dist/release, Mark reviewed, Copy summary; add collapsible diff panel; display dynamic package metadata; update tests for each of the 7 behaviors. |
| **AS4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AS3 | Verify: mount-time status populates correctly, all 5 buttons perform real actions, diff panel shows git output, Mark reviewed toggles state, Copy summary produces formatted text, dynamic metadata displays, no regression in existing 440+ tests. |
| **AS5** | Privacy/security audit | `sna-privacy-security` | AS3 | Audit: all action wiring is local-only read operations, clipboard writes are user-initiated, git diff output is sanitized (no home dir leak), no new IPC channels added, no ServiceNow data exposed. |
| **AS6** | Windows local package refresh | `sna-windows-runtime` | AS4 + AS5 | Rebuild fresh AS-dated package after action wiring changes. |
| **AS7** | Final local readiness gate | `sna-release-docs` | AS4 + AS5 + AS6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED. |

### Dependencies

```
AS1 ──→ AS2 ──→ AS3 ──→ AS4 ──┐
                         │     ├──→ AS6 ──→ AS7
                         └──→ AS5 ──┘
```

AS3 (implementation) is the only code-change task. AS4 and AS5 can run in parallel after AS3 completes. AS6 (package refresh) requires both QA and security sign-off.

---

## 4. The 7 implementation gaps (inherited from AR1)

| # | Gap | Location | Severity | Root cause |
|---|-----|----------|----------|------------|
| 1 | **No mount-time worktree status fetch** | `App.tsx` — no `useEffect` calling `api.getWorktreeStatus()` | **BLOCKING** — `worktreeHasDirtyChanges` permanently `false`, card always shows "Fresh" even when dirty | Mount-time IPC call omitted; only hygiene scan and package metadata are fetched |
| 2 | **Review diff button does nothing** | `App.tsx:4457` (approximately) | **HIGH** — click produces no result | No onClick handler wired |
| 3 | **Copy package path button does nothing** | `App.tsx:4458` | **HIGH** — click produces no result | No onClick handler wired |
| 4 | **Open dist/release button does nothing** | `App.tsx:4459` | **HIGH** — click produces no result | No onClick handler wired |
| 5 | **Mark reviewed button has no toggle logic** | `App.tsx:4460-4462` | **HIGH** — disabled logic exists but no onClick to set reviewed/accepted state | onClick handler never implemented |
| 6 | **Copy summary button does nothing** | `App.tsx:4463` | **HIGH** — click produces no result | No onClick handler wired |
| 7 | **No dynamic package metadata display** | `App.tsx:4429-4439` | **MEDIUM** — static text only, real path/SHA256/size not shown | `packageMetadata` is fetched on mount but never used in the worktree acceptance card |

### Acceptance criteria for AS3 (implementation)

1. **Mount-time worktree status fetch** — On mount, `api.getWorktreeStatus()` is called and `worktreeHasDirtyChanges` is set from the response.
2. **Review diff** — Clicking calls `api.getGitDiff()`, output renders in an inline collapsible `pre` block below the action buttons.
3. **Copy package path** — Clicking copies `packageMetadata.path` to clipboard.
4. **Open dist/release** — Clicking calls `api.openDistRelease()`.
5. **Mark reviewed** — Clicking sets `worktreeReviewed = true` and `worktreeAccepted = true`. Shows brief confirmation text. Button disabled logic unchanged (dirty + unreviewed = disabled).
6. **Copy summary** — Clicking composes a formatted summary string from current state and copies to clipboard. Summary format: "Worktree [dirty/fresh], [reviewed/not reviewed], [accepted/not accepted]. Package: {filename} ({size}) — {path}"
7. **Dynamic package metadata** — Card shows actual filename and size from `packageMetadata` state. When no package found, shows "No package found" fallback.
8. **No new IPC channels** — All wiring uses existing `worktreeApi` methods.
9. **No layout changes** — The 3-column card structure, state queue, chips, checklist, and boundary card remain exactly as they are.
10. **Existing tests pass** — All current worktree acceptance tests continue working. New tests added for each of the 7 behaviors.

---

## 5. Non-goals

These are explicitly **out of scope** for AS:

- **No new IPC handlers or main-process changes** — All IPC already exists.
- **No new cards, panels, or layout changes** — Only wiring existing buttons and adding a single inline diff panel.
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR/trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values.**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes.**
- **No refactoring of existing IPC handlers, preload bridge, or main.ts routing.**
- **No changes to the repo-hygiene card, release-readiness handoff card, runtime rail, or SOURCES column.**
- **No test refactoring** beyond adding new tests for the 7 behaviors.
- **No CSS refactoring** — only minimal CSS for the diff panel if needed.

---

## 6. Current package/UNC path context

The AR1 and AR2 docs reference the AQ6 package at:
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip
```

An AR3 build attempt produced a checksum for `rc.1-ar3-20260607-local.zip` but the zip is absent and no implementation doc exists.

**AS3 must build against whatever the current `dist/release/` active-release zip is at implementation time.** The AS6 package refresh will produce the final dated artifact for Alan's manual validation.

Older aliases (archival only): AF, AG, AH, AI, AJ, AK, AL, AM, AN6, AO6, AP6, AQ6. These must be referenced only in archival context.

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| AS2 | `docs/status/phase-AS2-ux-spec-*.md` | < 40 lines (adopt AR2 spec; update package reference) |
| AS3 | `apps/desktop/src/App.tsx`, `apps/desktop/src/App.test.ts`, `apps/desktop/src/styles.css` | < 120 lines total |
| AS4 | QA checklist doc | < 60 lines |
| AS5 | Security audit doc | < 60 lines |
| AS6 | Build/packaging scripts | < 20 lines |
| AS7 | Gate document | < 40 lines |

**Total estimated change budget:** < 340 lines across 8–10 files.
**No new IPC handlers required.** All changes are in the renderer layer.

---

## 8. Safety boundaries

### Safe (local-only, read-only, no network)

| Action | Safety boundary |
|--------|----------------|
| `git diff --stat HEAD` | Read-only git query. Existing handler already sanitizes home directory from output. |
| `git status --porcelain` | Read-only git query. Returns clean/dirty boolean. |
| `shell.openPath('dist/release')` | Opens Windows Explorer on local filesystem. No data leaves the machine. |
| `navigator.clipboard.writeText(packagePath)` | User-initiated clipboard write. No data leaves the machine. |
| Inline `pre` block for diff output | Read-only display of sanitized git output. No data leaves the machine. |
| In-memory `worktreeReviewed`/`worktreeAccepted` state | Session-only React state. No localStorage, no file write, no network. |

### Red-zone (explicit prohibitions — identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- Local-only only; no external writes or deliveries
- No new IPC handlers (all IPC already exists)
- No new UI cards, panels, or layout changes — only wiring existing buttons and adding a single inline diff panel

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing + new tests pass
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (AS6)
- Final local readiness gate before Alan manual validation (AS7)

---

## 10. Status

```
Phase AS1 — NEXT VISIBLE LOCAL PRODUCT SCOPE: WORKTREE ACCEPTANCE ACTION WIRING

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: AP7 + AQ release summary (both READY-FOR-MANUAL-VALIDATION-ONLY)
AR1/AR2 inherited: AR1 scope + AR2 UX spec adopted as the implementation target

Gaps to implement: 7 (inherited from AR1)
  - Gap 1: No mount-time worktree status fetch (BLOCKING)
  - Gap 2: Review diff button no-op (HIGH)
  - Gap 3: Copy package path button no-op (HIGH)
  - Gap 4: Open dist/release button no-op (HIGH)
  - Gap 5: Mark reviewed has no onClick toggle (HIGH)
  - Gap 6: Copy summary button no-op (HIGH)
  - Gap 7: No dynamic package metadata display (MEDIUM)

Downstream tasks created: 6
  - AS2: UX/copy spec — adopt AR2 spec, update package reference      → sna-ui-designer [first]
  - AS3: Implementation — wire all action buttons                      → sna-frontend-workbench [after AS2]
  - AS4: QA acceptance + Alan manual checklist                         → sna-qa-acceptance [after AS3]
  - AS5: Privacy/security audit                                        → sna-privacy-security [after AS3]
  - AS6: Windows local package refresh                                 → sna-windows-runtime [after AS4 + AS5]
  - AS7: Final local readiness gate                                    → sna-release-docs [after AS4 + AS5 + AS6]

Red-zone items excluded: 16
Non-goals: 10 (no new IPC, no new cards, no layout changes, no ServiceNow, no Git push, no refactoring, no CSS changes beyond diff panel, no test refactoring, no package experiments)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
