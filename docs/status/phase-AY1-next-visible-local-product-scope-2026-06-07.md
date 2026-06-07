# Phase AY1 — Cumulative Phase Artifact Cleanup — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_06c7ad42`

---

## 1. Latest final gate / backlog state

### AX7 final gate — COMPLETE (READY-FOR-MANUAL-VALIDATION-ONLY)

The latest completed final gate is **AX7**, which returned **READY-FOR-MANUAL-VALIDATION-ONLY** for the repo-hygiene disabled-reason specificity scope.

| Check | Result |
|-------|--------|
| QA acceptance (AX4) | PASS |
| Privacy/security (AX5) | APPROVE |
| Windows package refresh (AX6) | PASS — `*ax6-20260607-local.zip` |
| pnpm build | PASS |
| pnpm typecheck | PASS |
| pnpm test (453 tests) | PASS |
| pnpm privacy:scan (288 files) | PASS |
| AX6 package newest in dist/release/ | PASS (mtime 15:26:23) |

### Current local Windows package baseline

| Property | Value |
|----------|-------|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip` |
| SHA256 | `8cd0c9b74b0ad4d2fa67efb073f2c016ae9baaedfa10314de53c3e0101036647` |
| Size | 118,603,008 bytes |
| Phase prefix | `ax6` |
| Newest by mtime | PASS — newer than aw5, av6, au6, at6, as6, ar3, aq6 |

### Cumulative phase completion chain

Phase A series (AE through AX) — all 18 phases complete:

| Phase | Scope | Final gate |
|-------|-------|------------|
| AE | First release-readiness handoff | PR #97 — ACCEPTANCE FAILED |
| AF | P0 recovery: startup diagnostics + runtime precheck | DONE |
| AG-AN | Three-column operator workbench polish | DONE (AN7) |
| AO | Stale archive entries in release-readiness card | DONE (AO7) |
| AP | Repo-hygiene three-column action rail + IPC | DONE (AP7) |
| AQ | Local repo hygiene + archive demotion UI wiring | DONE (AQ + release summary) |
| AR | Worktree acceptance action wiring (partial) | AR3 partial — ABANDONED |
| AS | Worktree acceptance action wiring (re-attempt) | DONE (AS7) |
| AT | Dynamic archival alias discovery | DONE (AT7) |
| AU | Release-readiness handoff current-package path + summary clarity | DONE (AU7) |
| AV | Release-readiness handoff badge styling + path state clarity | DONE (AV7) |
| AW | IPC handler unit tests for hygiene/cleanup handlers | DONE (AW5 + AW6) |
| AX | Repo-hygiene action-button disabled reason specificity | DONE (AX7) ✅ |

### AQ release — deferred items status

All 3 AQ-deferred items are now resolved:

| # | Deferred item | Resolution | Phase |
|---|---|---|---|
| 1 | Worktree acceptance card button wiring | ✅ COMPLETE | AS1-AS7 |
| 2 | IPC handler unit tests (handleHygieneScan, handleCleanupPreview, handleCleanupExecute) | ✅ COMPLETE | AW1-AW6 |
| 3 | Hardcoded display-string cleanup (dynamic metadata, archival aliases, badge styling) | ✅ COMPLETE | AT, AU, AV |

---

## 2. Current state — what exists today after 18 phases

### What works

All P0 criteria are technically delivered and gated:

1. ✅ Windows double-click opens the desktop app (packaged through ax6)
2. ✅ Startup failures show visible sanitized diagnostics (AF1-A)
3. ✅ Start QA Chromium visibly opens dedicated Chromium window (AF1-B1)
4. ✅ CDP readiness is visible in the app (AD3 → AN polish)
5. ✅ Verify current Incident enables only after CDP readiness (gating logic)
6. ✅ Verify-only performs read-only inspection (UI contract)
7. ✅ Three-column Operator Workbench replaces overloaded vertical flow (AN polish)
8. ✅ Packaged Windows artifact path is designed + verified (AE7 → ax6)

### What is stale — the accumulated artifact debt

Seven phases of local-only iteration (AS through AX) have left stale artifacts:

**1. Stale `ar3` package test fixture in App.test.ts** — 7 phases out of date

`apps/desktop/src/App.test.ts` line 47-56 defines `currentAr3PackageMetadata` with hardcoded AR3 values:
- Path: `...rc.1-ar3-20260607-local.zip` (should be ax6)
- SHA256: AR3 hash (should be ax6 hash)
- Filename: `...-ar3-...` (should be ax6)
- Phase: `"AR3"` (should be `"AX6"`)
- Size: 118,603,627 bytes (should be 118,603,008)

This test fixture was set during AR3 (June 7 ~12:08) and never refreshed through AS, AT, AU, AV, AW, or AX. The test passes because the mock data is internal — there's no assertion comparing it to the actual filesystem. But the naming (`currentAr3PackageMetadata`) and hardcoded values are misleading to anyone reading the test file.

**2. dist/release/ directory clutter** — 25 files across 8 phase prefixes

The `dist/release/` directory contains:
- `*ax6-20260607-local*` — Current package (3 files: .zip, .sha256, START-HERE.txt)
- `*aw5-20260607-local*` — Stale (3 files)
- `*av6-20260607-local*` — Stale (3 files)
- `*au6-20260607-local*` — Stale (3 files)
- `*at6-20260607-local*` — Stale (3 files)
- `*as6-20260607-local*` — Stale (3 files)
- `*ar3-20260607-local*` — Stale (4 files, including `.before-appasar-refresh` artifact)
- `*aq6-20260607-local*` — Stale (3 files)

The release-readiness handoff card correctly shows only the newest package. But the directory contains 7 stale packages totaling ~800+ MB of archival artifacts alongside the current build. The `.before-appasar-refresh` artifact is a development residue.

**3. START-HERE-WINDOWS.txt is generic** — no phase-specific guidance

The current START-HERE-WINDOWS.txt has generic "use mock/demo workflows first" copy. It doesn't reference the ax6 package specifically, doesn't mention the three-card operator workflow, and doesn't guide Alan through the specific validation steps for the post-P0-recovery state.

---

## 3. Why this scope now — the cumulative phase debt is the most visible remaining gap

After 18 phases of iteration (AE through AX), all technical P0 gaps are closed. The app is feature-complete for local operator workflow. What remains is not a new feature gap but **accumulated artifact debt** from the rapid phase iteration:

### What a code reviewer or Alan sees

1. **Test code says "AR3"** — a developer reading the test suite sees `currentAr3PackageMetadata` and wonders if AR3 is the current baseline. The test code was written during AR3 and never updated. This erodes confidence in the test suite's accuracy.

2. **dist/release/ looks like a work-in-progress** — 8 phase prefixes in one directory. The `.before-appasar-refresh` artifact is a development byproduct that shouldn't ship.

3. **No consolidated validation guide exists** — Alan has never re-run manual acceptance since AE7. The AF1-C clean-machine runbook references the `ae` package. The START-HERE-WINDOWS.txt is generic. There's no single document that tells Alan what to test with the ax6 package.

### Risk if not addressed

- The test fixture drift will compound with each additional phase
- The dist/release/ clutter makes it harder to identify the current package at a glance
- Alan has no way to know what's changed since AE7 / PR #97
- The next phase iteration (if any) starts from a codebase with stale references

---

## 4. Scope — what AY includes

### Deliverable A — This scope document (AY1)

Documents:
- The latest gate state (AX7)
- The cumulative artifact debt from 18 phases
- Why cumulative phase cleanup is the next visible scope
- AY2-AY7 task chain
- Safety boundaries and change budget

### Deliverable B — AY2-AY7 downstream task chain

| Task | Title | Assignee | Depends on | Description |
|------|-------|----------|------------|-------------|
| **AY2** | UX/copy spec — cumulative artifact cleanup | `sna-ui-designer` | AY1 | Define exact copy changes: updated test fixture variable name and values, START-HERE-WINDOWS.txt refresh copy, consolidated validation guide structure, and any stale display strings in the UI. |
| **AY3** | Implementation — refresh test fixtures, clean up archive, update runbook | `sna-frontend-workbench` | AY2 | Update `currentAr3PackageMetadata` → `currentPackageMetadata` with ax6 values in App.test.ts; move stale packages from `dist/release/` to `dist/.release-archive/`; remove `.before-appasar-refresh` artifact; refresh START-HERE-WINDOWS.txt; write consolidated clean-machine validation guide. |
| **AY4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | AY3 | Verify: test fixture uses current ax6 values, dist/release/ has only 1 current package, START-HERE-WINDOWS.txt is accurate, consolidated validation guide covers all P0 criteria, tests still pass, build/typecheck/privacy:scan pass. |
| **AY5** | Privacy/security audit | `sna-privacy-security` | AY3 | Verify: no stale package metadata (phase references, SHA256, paths) appears in source code, no real ServiceNow data in START-HERE.txt or validation guide, no secrets or credentials in any refreshed copy. |
| **AY6** | Windows local package refresh | `sna-windows-runtime` | AY4 + AY5 | Rebuild fresh AY-dated package after artifact cleanup changes. |
| **AY7** | Final local readiness gate | `codex-gpt55-control` | AY4 + AY5 + AY6 | Final gate: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED. |

### Dependencies

```
AY1 ──→ AY2 ──→ AY3 ──→ AY4 ──┐
                         │     ├──→ AY6 ──→ AY7
                         └──→ AY5 ──┘
```

AY3 (implementation) is the only code/file-change task. AY4 and AY5 can run in parallel after AY3 completes. AY6 (package refresh) requires both QA and security sign-off.

---

## 5. Specific changes for AY3 (implementation)

### Change 1: Refresh stale test fixture in App.test.ts

**Current state (approximate line 47-56):**
```typescript
const currentAr3PackageMetadata: PackageMetadataResult = {
  ok: true,
  path: "/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip",
  sha256: "bd4cde9e18269b8e188e1dc7b8dcec892664a33b0ce5083521f6c5b794b6d0a2",
  mtime: Math.floor(new Date("2026-06-07T12:08:26+08:00").getTime() / 1000),
  filename: "servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip",
  size: 118603627,
  phase: "AR3",
  archivalAliases: ["AQ6", "AK"],
};
```

**Target state:**
```typescript
const currentPackageMetadata: PackageMetadataResult = {
  ok: true,
  path: "/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip",
  sha256: "8cd0c9b74b0ad4d2fa67efb073f2c016ae9baaedfa10314de53c3e0101036647",
  mtime: Math.floor(new Date("2026-06-07T15:26:23+08:00").getTime() / 1000),
  filename: "servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip",
  size: 118603008,
  phase: "AX6",
  archivalAliases: ["AW5", "AV6", "AU6", "AT6", "AS6", "AR3", "AQ6"],
};
```

**Rationale:** Variable renamed from phase-specific `currentAr3PackageMetadata` to generic `currentPackageMetadata` so it doesn't go stale again. Values updated to current ax6 package. `archivalAliases` updated to include all stale packages from the cumulative chain.

**Note:** If any of the actual path, SHA256, size, or mtime values differ from what is shown above (because dist/release/ may have been modified between when AX7 gate ran and now), the implementation task must read the actual filesystem values and use those.

### Change 2: Clean up dist/release/ stale archives

Move all stale packages (aw5, av6, au6, at6, as6, ar3, aq6) and their sidecars (.sha256, START-HERE.txt) to `dist/.release-archive/<phase>/`.

Remove the `.before-appasar-refresh` development artifact.

After cleanup, `dist/release/` should contain only:
- `*ax6-20260607-local.zip`
- `*ax6-20260607-local.zip.sha256`
- `*ax6-20260607-local-START-HERE-WINDOWS.txt`

**Safety:** The `.release-archive/` directory is gitignored (already exists from the archive-demotion feature). This is a local-only filesystem operation.

### Change 3: Refresh START-HERE-WINDOWS.txt

Update the START-HERE-WINDOWS.txt to reflect the ax6 consolidated baseline:
- Reference the three completed cards: Release Readiness Handoff, Repo Hygiene, Worktree Acceptance
- Include validation steps from the clean-machine runbook
- Keep all existing safety warnings intact

### Change 4: Write consolidated clean-machine validation guide

Write `docs/test/windows-clean-machine-validation-2026-06-07.md` — refreshed from the AF-era runbook but now covering:
- All 8 P0 criteria with expected results
- Current ax6 package path and SHA256
- Three-card local workflow steps
- Chromium runtime provisioning steps
- What to do if diagnostics appear
- How to report results

---

## 6. Non-goals

These are explicitly **out of scope** for AY:

- **No new features, new cards, new panels, or new IPC handlers.**
- **No behavioral changes** — button logic, disabled/enabled states, state management all stay identical.
- **No layout, CSS, or UI redesign.**
- **No changes to renderer logic, IPC, preload, or Electron main process.**
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values.**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes.**
- **No refactoring beyond the specific stale fixture, archive cleanup, and copy updates listed in Section 5.**
- **No changes to existing tests** — only updating the stale mock data.
- **No new IPC handlers or Electron API usage.**
- **No clean-machine validation execution** — the guide is for Alan to follow.

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| AY2 | `docs/status/phase-AY2-ux-spec-*.md` | < 40 lines |
| AY3 | `apps/desktop/src/App.test.ts` (~12 lines), `dist/release/` (archive cleanup), `dist/release/*START-HERE*.txt` (~15 lines), `docs/test/windows-clean-machine-validation-2026-06-07.md` (~100 lines) | < 170 lines total |
| AY4 | QA checklist doc | < 30 lines |
| AY5 | Security audit doc | < 30 lines |
| AY6 | Build/packaging scripts | < 20 lines |
| AY7 | Gate document | < 40 lines |

**Total estimated change budget:** < 330 lines across 5–8 files.
**No production logic changes.** All changes are test data, file cleanup, docs, and copy.

---

## 8. Safety boundaries

### Safe (local-only, copy/docs cleanup)

| Concern | Why it's safe |
|---------|---------------|
| Test fixture refresh | Mock data update only — no runtime code change |
| dist/release/ cleanup | Files moved to gitignored archive directory; no deletion of necessary files |
| START-HERE-WINDOWS.txt refresh | Text copy update only — no functional change |
| Clean-machine validation guide | New doc only — no code change, no automation |
| No new IPC, no new handlers, no new Electron API | By explicit non-goal |
| No behavioral changes | Test mock data has no effect on app behavior |

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
- `pnpm test` — all existing + new tests pass (test fixture refresh does not change test logic)
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (AY6)
- Final local readiness gate before Alan manual validation (AY7)

---

## 10. Why this is the right next scope — honest assessment

### Not P0 recovery (P0s are already delivered)

All 8 P0 criteria from PR #97 have been technically delivered across the AF-AX chain:
- Startup diagnostics: ✅ AF1-A (diagnostic overlay)
- Chromium runtime provisioning: ✅ AF1-B1 (precheck) + B2 (auto-provisioning stretch)
- Three-column layout: ✅ AN (polish)
- All cards wired: ✅ AS (worktree), AQ+AP (hygiene), AE+AU+AV (handoff)
- IPC tested: ✅ AW (unit tests)
- UI polish: ✅ AT (aliases), AX (disabled reasons)

### What remains is consolidating the artifact debt

The cumulative phase cleanup is:
- **Visible** — stale test data and directory clutter are visible to anyone inspecting the codebase
- **Local-only** — no ServiceNow interaction, no network
- **Small** — ~170 lines of changes, no new features
- **High impact** — makes the codebase honest for the next person who reads it
- **Honest** — acknowledges that 18 rapid phases left behind stale metadata

### What this enables

After AY completes, the codebase will:
1. Have test fixtures that reflect the actual current package
2. Have a clean dist/release/ directory with only the current package
3. Have an up-to-date START-HERE-WINDOWS.txt for the ax6 baseline
4. Have a consolidated clean-machine validation guide reflecting all P0 criteria
5. Be ready for the next phase iteration (whether that's a new feature scope or feature expansion) from a clean baseline

---

## 11. Status

```
Phase AY1 — CUMULATIVE PHASE ARTIFACT CLEANUP

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: AX7 (READY-FOR-MANUAL-VALIDATION-ONLY)
Current package: servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip

Phase chain: AE → AF → AG/AN → AO → AP → AQ → AR → AS → AT → AU → AV → AW → AX → AY
  18 phases completed. AY closes the loop on cumulative artifact debt.

Artifact debt identified:
  1. Stale ar3 test fixture in App.test.ts (7 phases out of date)
  2. dist/release/ directory clutter (25 files, 8 phase prefixes)
  3. Generic START-HERE-WINDOWS.txt (no ax6-specific guidance)
  4. No consolidated clean-machine validation guide since AF-era

Downstream pipeline created: AY2 → AY3 → AY4 ∥ AY5 → AY6 → AY7
  AY2: UX/copy spec                 → sna-ui-designer [first]
  AY3: Implementation                  → sna-frontend-workbench [after AY2]
  AY4: QA acceptance                   → sna-qa-acceptance [after AY3]
  AY5: Privacy/security audit          → sna-privacy-security [after AY3]
  AY6: Windows local package refresh   → sna-windows-runtime [after AY4 + AY5]
  AY7: Final local readiness gate      → codex-gpt55-control [after AY4 + AY5 + AY6]

Red-zone items excluded: 14
Non-goals: 9 (no new features, no new IPC, no behavioral changes, no layout changes,
           no ServiceNow, no Git push, no refactoring, no test logic changes, no validation execution)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
