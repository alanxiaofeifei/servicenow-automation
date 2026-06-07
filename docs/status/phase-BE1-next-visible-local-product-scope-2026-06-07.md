# Phase BE1 — P0 Re-Acceptance Gate for BD6 Cumulative Package — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_775a08a0`

---

## 1. Latest final gate / backlog state

### BD7 final gate — READY-FOR-MANUAL-VALIDATION-ONLY

The latest completed final gate is **BD7**, which returned **READY-FOR-MANUAL-VALIDATION-ONLY** for the Dynamic Current Package UNC Prefix Derivation scope.

Current local Windows package baseline:

| Property | Value |
|----------|-------|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip` |
| SHA256 | `3054053cd4b826b29067eb1e5c93b8274a6e6bfa02ce639f7373bf2bcb40c434` |
| Size | 118,604,358 bytes (~113.1 MiB) |
| Phase prefix | `bd6` |
| Gate status (BD7-verified) | build PASS, typecheck PASS, test 455/455 PASS, privacy:scan PASS, archive integrity PASS, SHA256 sidecar PASS, START-HERE sidecar PASS |

### Cumulative phase completion chain

| Phase | Scope | Final gate |
|-------|-------|------------|
| AE | First release-readiness handoff | PR #97 — ACCEPTANCE FAILED |
| AF–AX | P0 recovery chain (18 phases) | All DONE |
| AY | Cumulative phase artifact cleanup (AE–AX) | DONE (AY7) |
| AZ | Local package artifact housekeeping + validation guide refresh | DONE (AZ5 APPROVE) |
| BA | Runtime action evidence panel | DONE (BA7 READY) |
| BB | Acceptance summary refinement | DONE (BB7 READY) |
| BC | Checklist launcher + runbook refresh | BC7 — **BLOCKED** |
| BD | Dynamic current package UNC prefix derivation | DONE (BD7 READY) |

### BC7 blockade — what happened and why it's resolved

BC7 was BLOCKED for two reasons:

1. **Desktop test suite had 2 failing assertions** — one expected compact safety-boundary copy, one expected the release-readiness handoff card to render a local UNC package path. These assertion mismatches occurred because the tests were written against a stale intermediate state. By BD7, the same test suite passes 455/455 tests, including these specific assertions which were resolved during subsequent implementation phases.

2. **BC6 ZIP was not present under dist/release/** — the BC6 package was never rebuilt because the test failures blocked the gate. The BD6 package (current) subsumes all BC implementation changes: the Open checklist button is now wired (App.tsx line 4312-4316), the runbook has been refreshed (references BD6), and the dynamic UNC prefix fix (BD3) is separate from the BC scope.

**Honest assessment:** BC's implementation (open checklist button wiring, runbook refresh) was completed, but the BC7 gate never re-ran to capture the resolved state. The BC6 package was never built because the gate halted before the pipeline reached that step. The BD6 package now carries all BC changes plus BD changes. BC7 should be formally overridden or replaced by a BE7 gate that captures the complete cumulative state.

### What exists today — the cumulative BD6 baseline

All 8 P0 criteria from PR #97 are technically delivered and gated in the BD6 package:

| P0 goal | Implementation | BD6 status |
|---------|---------------|------------|
| Windows double-click opens the desktop app | Packaged via electron-builder through BD6 | ✅ BD6 ZIP exists, verified SHA256 |
| Startup failures show visible sanitized diagnostics | AF1-A — diagnostic overlay in App.tsx | ✅ Tests confirm diagnostic rendering (App.test.ts:587-727) |
| Start QA Chromium visibly opens dedicated Chromium window | AF1-B1 — runtime provisioning precheck + AF1-B2 auto-provisioning | ✅ Blocked-reason responses wired (App.test.ts:308-314) |
| CDP readiness is visible in the app | AD3 CDP chip + AN polish | ✅ Rendered in runtime rail |
| Verify current Incident enables only after CDP readiness | Runtime gating logic | ✅ Wired and tested |
| Verify-only performs read-only inspection | Runtime action contract | ✅ Gating exists |
| Three-column Operator Workbench | AN1-AN7 visual polish | ✅ AN7 READY-FOR-MANUAL-VALIDATION-ONLY |
| Packaged Windows artifact path designed and verified | AE7 handoff card + BD3 dynamic UNC prefix | ✅ BD6 verified path |

### What is NOT yet done

| Item | Status | Why not done |
|------|--------|-------------|
| P0 re-acceptance by Alan after fixes | **NOT DONE** | PR #97 failed before AF-BD fixes. No re-validation package has been presented to Alan. |
| BC7 formal closure | **NOT DONE** | BC7 shows BLOCKED; the resolution was absorbed into BD without re-running the BC7 gate. |
| Clean-machine validation with BD6 package | **NOT DONE** | The runbook references BD6 but Alan has not extracted and launched BD6 on a clean Windows machine. |
| Cumulative end-to-end acceptance gate | **NOT DONE** | No single document traces all P0 criteria to their implementation and invites re-validation. |

---

## 2. Why this scope now — the P0 re-validation loop has never been closed

### The problem

PR #97 was the last manual acceptance attempt. It failed because:
- Start QA Chromium had no visible effect (runtime not provisioned, no diagnostic)
- Three-column layout was not visually accepted

Since then, **20+ phases** have implemented all fixes:
- Diagnostic overlay tells the user why Chromium didn't launch
- Runtime precheck returns `RuntimeNotFound` reason
- Auto-provisioning (B2) downloads Chrome for Testing automatically
- Three-column layout polished with column headers, default-expanded right rail, distinct column tints
- Open checklist button wired
- Dynamic UNC prefix replaces the hardcoded distro name
- Runtime evidence panel shows action history in the right rail
- Acceptance summary ties current package to latest validation history

**But Alan has never been asked to re-validate.**

The BD6 package exists. The runbook is refreshed. All gates pass. What's missing is a **single, authoritative BE6 package** with a **P0 re-acceptance checklist** that Alan can use to confirm the P0 criteria now pass.

### Why this and not a new feature

| Candidate scope | Why not now |
|-----------------|-------------|
| New runtime actions (e.g., bulk autofill) | Scope creep — P0 re-validation first |
| UI redesign or theme | Feature — not P0 recovery |
| More docs/cleanup | Already done in AY + AZ |
| New IPC or Electron changes | Adds risk after the stable BD6 baseline |
| P0 re-acceptance package + checklist | ✅ Completes the loop: PR #97 → fixes → re-validation |

### What this enables

After BE completes, Alan will:
1. Have a single BE6 package with all cumulative fixes (AE through BD)
2. Have a complete P0 re-acceptance checklist tracing each criterion to its implementation
3. Be able to re-validate the app on a clean Windows machine with clear pass/fail criteria
4. Have a fully up-to-date runbook that covers all 8 P0 criteria
5. Have the BC7 blockade formally superseded by the BE7 gate

---

## 3. Scope — what BE includes

### BE1 — This scope document (current)

Documents:
- The latest gate state (BD7 READY-FOR-MANUAL-VALIDATION-ONLY)
- The cumulative P0 implementation status across AF–BD
- The BC7 blockade and why it's resolved
- Why P0 re-acceptance is the next visible scope
- BE2–BE7 task chain
- Safety boundaries and change budget

### BE2 — P0 re-acceptance checklist + gate document structure (assignee: `sna-qa-acceptance`)

Design the exact P0 re-acceptance checklist document that Alan will use. Must cover:

1. Each of the 8 P0 criteria with:
   - Expected behavior (one sentence)
   - Implementation reference (which phase, which component)
   - Verification step Alan should perform (concrete action)
   - Pass/fail checkbox
   - Pass condition (what Alan sees when it works)

2. Runbook refresh diff: what changed between the AF-era `ae` runbook and the current BD6 runbook
3. BC7 closure statement: acknowledge BC7 was blocked, confirm resolution in BD
4. Safety reminder: do NOT test live ServiceNow, do NOT fill fields, do NOT submit

**Acceptance criteria:**
- Document at `docs/status/phase-BE2-p0-re-acceptance-checklist-2026-06-07.md`
- All 8 P0 criteria listed with verification steps
- BC7 closure statement included
- Safety reminder explicit

**Change budget:** 1 file, < 60 lines of Markdown

### BE3 — Implementation: BE6 package build + P0 traceability document (assignee: `sna-frontend-workbench`)

Two deliverables:

**Deliverable A — P0 traceability document**

Write `docs/status/phase-BE3-p0-traceability-2026-06-07.md` tracing each P0 criterion to its implementation:

| P0 criterion | Implementation files | Phase | Test references | Gate verdict |
|-------------|---------------------|-------|-----------------|-------------|
| Startup diagnostics | App.tsx (diagnostic overlay), main.ts (blocked-reason responses) | AF | App.test.ts:587-727 | PASS |
| Chromium launch | main.ts (provisioning precheck), preload (IPC), prepare-chrome-for-testing.ps1 | AF | App.test.ts:308-314 | PASS |
| CDP readiness | App.tsx (CDP chip), runtime rail component | AD + AN | Layout tests | PASS |
| Verify gating | App.tsx (disabled-reason gating) | AQ + AP | App.test.ts:317-337 | PASS |
| Three-column layout | App.tsx + styles.css (grid layout + column headers) | AN | App.test.ts:103-490 | PASS |
| UNC prefix | App.tsx (formatPackagePathForDisplay), browser-session.ts (resolveWslDistroName) | BD | App.test.ts:410-430 | PASS |
| Open checklist | App.tsx (wire to shell openPath) | BC/BD | App.test.ts:1769-1775 | PASS |
| Runtime evidence | App.tsx (evidence panel in right rail) | BA | App.test.ts (evidence panel tests) | PASS |

**Deliverable B — Runbook final refresh**

If the runbook at `docs/test/windows-clean-machine-validation-2026-06-07.md` has any stale references (package name, SHA256, path), refresh them to the current BE6 values. Otherwise confirm it's already up-to-date.

**Deliverable C — BC7 closure**

Write a closure note at `docs/status/phase-BE3-bc7-closure-2026-06-07.md` documenting:
- BC7 BLOCKED state (2 test failures, missing BC6 ZIP)
- The specific test failures and how they were resolved in subsequent phases
- The BC6 package was never built because the gate halted
- All BC implementation (Open checklist wiring, runbook refresh) is present in BD6
- BC7 is superseded by BE7

**Acceptance criteria:**
- P0 traceability document covers all 8 criteria with implementation files, phases, test references, and gate verdicts
- Runbook references BE6 package (or confirmed current)
- BC7 closure document written
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS (no new test logic, only doc changes)
- `pnpm privacy:scan` — PASS

**Change budget:** 3 files, < 150 lines total of Markdown
**No production code changes.** Docs-only.

### BE4 — QA acceptance (assignee: `sna-qa-acceptance`)

Verify:
1. P0 traceability document — all 8 criteria traced with correct implementation references, test references, and gate verdicts
2. Runbook references the correct BE6 package path and SHA256
3. BC7 closure document — accurate and honest
4. All four gates pass (build, typecheck, test, privacy:scan)
5. No stale package references in docs
6. Safety reminder is present and prominent

**Change budget:** 1 file, < 40 lines of Markdown

### BE5 — Privacy/security audit (assignee: `sna-privacy-security`)

Verify:
1. P0 traceability document contains no raw ServiceNow URLs, ticket IDs, sys_ids, credentials, or real field values
2. Runbook references sanitized paths only (no real user home paths beyond the app directory, no real ServiceNow data)
3. BC7 closure document has no sensitive data
4. No privacy violations in the cumulative docs
5. Privacy scan passes

**Change budget:** 1 file, < 30 lines of Markdown

### BE6 — Windows local package refresh (assignee: `sna-windows-runtime`)

Rebuild a fresh BE6-dated Windows package. Must include:
- BE6 ZIP at `dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip`
- SHA256 sidecar
- START-HERE-WINDOWS.txt sidecar (must reference BE6 package)
- Archive integrity check (no forbidden markers, expected structure)

**Change budget:** Build/packaging scripts, < 20 lines

### BE7 — Final local readiness gate (assignee: `sna-qa-acceptance`)

Produce `docs/status/phase-BE7-final-local-readiness-gate-2026-06-07.md` with:
- Exact BE6 UNC path for Alan
- Package facts (size, SHA256, sidecar status, archive integrity)
- Fresh gate results (build, typecheck, test, privacy:scan)
- P0 re-acceptance checklist reference
- BC7 closure reference
- Verdict: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED

**Change budget:** 1 file, < 50 lines of Markdown

---

## 4. Pipeline and dependencies

```text
BE1 (scope) ──→ BE2 (P0 checklist design → sna-qa-acceptance)
              ──→ BE3 (traceability doc + BC7 closure + runbook → sna-frontend-workbench)
                    ↓
              BE4 (QA acceptance → sna-qa-acceptance) ──┐
                    ↓                                   ├──→ BE6 (package → sna-windows-runtime) ──→ BE7 (final gate → sna-qa-acceptance)
              BE5 (privacy/security → sna-privacy-security) ─┘
```

BE2 and BE3 can run in parallel (both docs, no code changes). BE4 and BE5 run after BE3 completes. BE6 requires both QA and security sign-off. BE7 is the final gate.

### Minimum viable path

```text
BE1 → BE2 + BE3 → BE4 ∥ BE5 → BE6 → BE7
```

This is the smallest pipeline that produces a BE6 package with P0 traceability, BC7 closure, and a fresh readiness gate.

---

## 5. Specific changes for BE3 (implementation — docs only)

### Change 1: P0 traceability document

Write `docs/status/phase-BE3-p0-traceability-2026-06-07.md` with a table tracing each P0 criterion to:
- Implementation files (App.tsx, main.ts, styles.css, etc.)
- Phase where it was implemented (AF, AN, AQ, BA, BD, etc.)
- Test references (App.test.ts line ranges)
- Gate verdict (PASS from the respective phase gate)

### Change 2: Runbook final refresh

Check `docs/test/windows-clean-machine-validation-2026-06-07.md` for:
- Package name: should reference `be6` (or confirmed as `bd6` if BE build hasn't happened yet)
- SHA256: should match the actual BE6/BD6 package
- Paths: should be sanitized
- Safety wording: should be present and prominent

If the runbook already references the correct BD6 values (confirmed — it does), update only the package name from `bd6` → `be6` after BE6 is built. If no build has happened yet, the runbook stays as-is and the BE3 task simply confirms it's correct.

### Change 3: BC7 closure document

Write `docs/status/phase-BE3-bc7-closure-2026-06-07.md`:

```markdown
# BC7 Closure

**Date:** 2026-06-07

## Original blockade

BC7 was BLOCKED at 2026-06-07 for:
1. 2 test failures (safety-boundary copy assertion, release-readiness UNC path assertion)
2. BC6 ZIP not present at dist/release/

## Resolution

Both test failures were resolved in subsequent phases (BD). By BD7, 455/455 tests pass, including the specific assertions that failed in BC7.

The BC implementation (Open checklist button wiring, runbook refresh) is present in the current BD6 package:
- App.tsx line 4312-4316: Open checklist button wired with shell.openPath
- App.tsx line 4296: Clipboard workaround removed (UNC prefix is now dynamic)
- docs/test/windows-clean-machine-validation-2026-06-07.md: References BD6 package

The BC6 package was never rebuilt because the BC7 gate halted before the pipeline reached BC6. The BD6 package now carries all BC changes plus BD changes.

## Disposition

BC7 is closed as SUPERSEDED by BE7. All BC implementation deliverables are present in the BD6/BE6 cumulative package.
```

### File budget

| File | Change | Budget |
|------|--------|--------|
| `docs/status/phase-BE3-p0-traceability-2026-06-07.md` | New — P0 criteria traceability table | < 60 lines |
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | Update package name bd6→be6 (if applicable) | < 5 lines |
| `docs/status/phase-BE3-bc7-closure-2026-06-07.md` | New — BC7 blockade closure | < 30 lines |

**Total estimated change budget:** < 95 lines across 3 files. All Markdown. No production code changes.

---

## 6. Non-goals

These are explicitly **out of scope** for BE:

- **No new features** — no new IPC handlers, no new UI panels, no new runtime actions, no new state variables
- **No behavioral changes** — button logic, disabled/enabled states, state management, CDP connection, runtime actions all stay identical
- **No layout or CSS changes** — three-column layout, rail positions, tints stay as-is
- **No test logic changes** — only new doc files; no test code is modified
- **No production code changes** — BE3 deliverables are docs only
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes**
- **No refactoring beyond the specific doc files listed in Section 5**
- **No automatic clean-machine validation** — the runbook is for Alan to follow; BE does not execute it

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|------|---------------------|---------------|
| BE2 | `docs/status/phase-BE2-p0-re-acceptance-checklist-2026-06-07.md` | < 60 lines |
| BE3 | `docs/status/phase-BE3-p0-traceability-2026-06-07.md` (< 60 lines), `docs/test/windows-clean-machine-validation-2026-06-07.md` (< 5 lines), `docs/status/phase-BE3-bc7-closure-2026-06-07.md` (< 30 lines) | < 95 lines |
| BE4 | QA acceptance doc | < 40 lines |
| BE5 | Privacy/security audit doc | < 30 lines |
| BE6 | Build/packaging scripts | < 20 lines |
| BE7 | Gate document | < 50 lines |

**Total estimated change budget:** < 295 lines across 6–8 files.
**No production code changes.** All changes are documentation and packaging.

---

## 8. Safety boundaries

### Safe (documentation and packaging only)

| Concern | Why it's safe |
|---------|---------------|
| P0 traceability document | Markdown only — no code, no IPC, no behavioral change |
| Runbook refresh | One-line package name update — no functional change |
| BC7 closure document | Markdown only — acknowledges and closes historic blockade |
| QA acceptance checklist | Markdown only — Alan's manual reference |
| Security audit | Markdown only — no security-sensitive data in these docs |
| BE6 package refresh | Standard build pipeline — same as BD6, BA6, BB6, etc. |
| No production code changes | By explicit constraint |

### Red-zone prohibitions (identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams / Outlook / phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- No production code changes — BE3 is docs-only
- No test logic changes — test files are NOT in scope
- No new IPC handlers, Electron API, or behavioral changes
- No automatic clean-machine validation execution

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing tests pass (no new test logic in BE scope)
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (BE6)
- Final local readiness gate before Alan manual validation (BE7)

---

## 10. Why this is the right next scope — honest assessment

### This is P0 re-acceptance, not feature expansion

The project truth says: "PR #97 manual acceptance failed. The next phase is P0 recovery, not feature expansion."

BE is consistent with this directive. It does not add features. It closes the **validation loop** that PR #97 opened:

1. PR #97 failed → AF–BD implemented fixes → but no re-validation package was produced
2. BE produces a fresh BE6 package with full P0 traceability
3. Alan can re-validate against the same P0 criteria that failed in PR #97
4. If BE7 says READY-FOR-MANUAL-VALIDATION-ONLY, Alan has a single package to validate against a single checklist

### What about the BC7 blockade?

BC7 was BLOCKED but its failures were resolved in BD. The BC7 gate never re-ran. BE closes this honesty gap by:
1. Documenting the BC7 blockade in the BE3 closure document
2. Acknowledging that BC implementation is present in the BD6 cumulative package
3. Replacing BC7's BLOCKED verdict with BE7's READY / BLOCKED verdict

### What this scope does NOT do

It does not add new features, change existing behavior, refactor code, modify tests, create new IPC handlers, or touch ServiceNow. It is a **documentation and packaging phase** that produces the final re-validation artifact for Alan.

---

## 11. Status

```
Phase BE1 — P0 RE-ACCEPTANCE GATE FOR BD6 CUMULATIVE PACKAGE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: BD7 (READY-FOR-MANUAL-VALIDATION-ONLY)
Current branch: next/post-release-operator-cockpit-ab-20260606

Phase chain: AE → AF → ... → AY → AZ → BA → BB → BC → BD → BE
  25+ phases completed. BE closes the P0 re-validation loop.

Accumulated P0 implementation across AF–BD:
  ✅ Startup diagnostics overlay          (AF1-A)
  ✅ Chromium runtime provisioning        (AF1-B1 + B2)
  ✅ CDP readiness chip                    (AD3 + AN polish)
  ✅ Verify gating on CDP readiness        (AQ + AP)
  ✅ Three-column operator workbench       (AN1–AN7)
  ✅ Dynamic UNC prefix derivation         (BD1–BD7)
  ✅ Open checklist button wired           (BC/BD)
  ✅ Runtime evidence panel                (BA1–BA7)
  ✅ Acceptance summary refinement          (BB1–BB7)

What remains:
  1. P0 re-acceptance checklist     → BE2 (sna-qa-acceptance)
  2. P0 traceability document       → BE3 (sna-frontend-workbench)
  3. BC7 closure                    → BE3 (sna-frontend-workbench)
  4. Runbook final refresh          → BE3 (sna-frontend-workbench)
  5. QA acceptance                  → BE4 (sna-qa-acceptance)
  6. Privacy/security audit         → BE5 (sna-privacy-security)
  7. BE6 Windows package refresh    → BE6 (sna-windows-runtime)
  8. BE7 final readiness gate       → BE7 (sna-qa-acceptance)

BC7 blockade: SUPERSEDED — all BC implementation present in BD6.

Downstream pipeline created: BE2 + BE3 → BE4 ∥ BE5 → BE6 → BE7
  BE2: P0 re-acceptance checklist              → sna-qa-acceptance
  BE3: Traceability doc + BC7 closure + runbook → sna-frontend-workbench
  BE4: QA acceptance                            → sna-qa-acceptance
  BE5: Privacy/security audit                   → sna-privacy-security
  BE6: Windows package refresh                  → sna-windows-runtime
  BE7: Final readiness gate                     → sna-qa-acceptance

Red-zone items excluded: 14
Non-goals: 11 (no features, no behavioral changes, no test logic changes,
             no production code changes, no IPC, no ServiceNow,
             no Git push, no refactoring, no automatic validation execution,
             no layout/CSS changes, no new state variables)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
