# Phase AW1 — IPC Handler Unit Tests for Hygiene/Cleanup Handlers — Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_a30bc290`

---

## 1. Current state — ground truth from AV7

The latest completed gate is **AV7**, which returned **READY-FOR-MANUAL-VALIDATION-ONLY**.

### Current local Windows package baseline

| Property | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip` |
| Windows UNC path | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip` |
| SHA256 | `77d91fe1b4f0349dfede21a4f7499b0a04d687adc5961841aec09c6f564e3d38` |
| Phase prefix | `av6` |
| Newest by mtime | PASS — newer than au6, at6, as6, ar3, aq6 |

### Current `dist/release/` inventory

| File | Role |
|---|---|
| `*av6-20260607-local.zip` | Newest/current manual validation target |
| `*au6-20260607-local.zip` | Older than AV6; archival-only |
| `*at6-20260607-local.zip` | Older than AV6; archival-only |
| `*as6-20260607-local.zip` | Older than AV6; archival-only |
| `*ar3-20260607-local.zip` | Older than AV6; archival-only |
| `*aq6-20260607-local.zip` | Older than AV6; archival-only |

---

## 2. What was deferred from AQ — what's done, what's not

The AQ release summary (`release-summary-AQ-2026-06-07.md`) deferred three items:

| # | Deferred item | Status | Phase(s) |
|---|---|---|---|
| 1 | Worktree acceptance card button wiring (Review diff, Copy package path, etc.) | ✅ **COMPLETE** | AS phase: scope (AS1), UX (AS2), implementation (AS3), QA (AS4), privacy (AS5), package (AS6), gate (AS7). All 5 buttons wired, mount-time status, dynamic metadata, 450 tests pass. |
| 2 | **Dedicated unit tests for handleHygieneScan, handleCleanupPreview, handleCleanupExecute** | ❌ **NOT STARTED** | No code written. No test file covers these three handlers. |
| 3 | Hardcoded display-string cleanup (dynamic package metadata, archival aliases, badge styling) | ✅ **COMPLETE** | AT phase (dynamic archival aliases), AU phase (current-package path/summary clarity), AV phase (badge styling + loading/unavailable state distinction). |

### Only remaining deferred item: IPC handler unit tests

Item #2 was never addressed by any subsequent phase (AS, AT, AU, AV). The three handlers exist in `worktree-ipc.ts` and are routed in `main.ts` and exposed in `preload.ts`, but **zero unit tests** cover them.

The existing `worktree-ipc.test.ts` has 384 lines and 16+ tests covering four handlers:
- `handleWorktreeGitDiff` ✅ (4 tests: success, sanitize, failure, empty diff)
- `handleWorktreeOpenDistRelease` ✅ (3 tests: success, error string, exception)
- `handleWorktreeStatus` ✅ (5 tests: dirty, clean, exec failure, staged-only, untracked)
- `handleWorktreePackageMetadata` ✅ (4+ tests: found, not found, readdir failure, multiple files)

**Missing:**
- `handleHygieneScan` — **0 tests**
- `handleCleanupPreview` — **0 tests**
- `handleCleanupExecute` — **0 tests**

---

## 3. Why this scope now — testing gap is the last unfilled AQ deferred item

The three AQ-deferred items represented the only known gaps after the AQ release. Items #1 and #3 were completed across 15 phases (AS1–AS7, AT1–AT7, AU1–AU2/AU7, AV1–AV7). Item #2 was simply never picked up.

Testing these handlers is important because:

1. **`handleHygieneScan`** reads `.gitignore`, scans `dist/release/`, checks `.local/video-analysis/`, and reports archive state — several `fs.readdirSync`/`existsSync`/`readFileSync` calls with multiple error paths that should be tested.
2. **`handleCleanupPreview`** enumerates `dist/release/`, filters by regex, groups by phase — non-trivial logic with edge cases (empty dir, no matches, throw scenarios).
3. **`handleCleanupExecute`** creates target directories and calls `renameSync` — destructive operation that must be tested with mocks to confirm correct phase-archival behavior without touching real filesystem.

These are the same IPC handlers that the UI (`App.tsx`) calls when the user clicks Refresh local scan, Cleanup preview, and Archive stale artifacts in the Repo Hygiene card. The handlers have been live in production builds (AQ3 → AQ6 → AR3 → AS6 → AT6 → AU6 → AV6) without dedicated unit test coverage.

---

## 4. Scope — what AW includes

### AW1 — Scope document (this document)

### AW2 — Unit test implementation (assigned: sna-frontend-workbench)

Add dedicated test suites to `apps/desktop/electron/worktree-ipc.test.ts` for:

#### handleHygieneScan (6+ test cases)

| # | Test | Expected |
|---|---|---|
| 1 | .gitignore exists and covers dist/ | `gitignoreVerified: true`, no error |
| 2 | .gitignore does not exist | `gitignoreVerified: false`, `error` includes ".gitignore not found" |
| 3 | dist/release/ has stale zip artifacts | `staleZipCount > 0`, `staleZips` list populated |
| 4 | .local/video-analysis/ directory exists with files | `videoAnalysisExists: true` |
| 5 | .local/video-analysis/ does not exist | `videoAnalysisExists: false` |
| 6 | readdirSync or readFileSync throws | `ok: false`, `error` message propagated |

#### handleCleanupPreview (5+ test cases)

| # | Test | Expected |
|---|---|---|
| 1 | dist/release/ has multiple non-newest zips | Preview result lists them grouped by phase |
| 2 | dist/release/ has only newest zip | Empty preview — no stale files |
| 3 | dist/release/ does not exist | `ok: false`, error message |
| 4 | readdirSync throws | `ok: false`, error propagated |
| 5 | No .zip files at all | Empty stale entries |

#### handleCleanupExecute (5+ test cases)

| # | Test | Expected |
|---|---|---|
| 1 | Archives stale files to correct phase directory | `renameSync` called with correct `dist/.release-archive/<phase>/` paths |
| 2 | Creates archive directory if it does not exist | `mkdirSync` called before `renameSync` |
| 3 | Only archives non-newest zips | Newest zip is NOT renamed |
| 4 | readdirSync throws | `ok: false`, error propagated |
| 5 | Dist/release directory does not exist | `ok: false`, error message |

### Acceptance criteria (AW2 implementation)

1. All test cases listed above pass with mocked fs/crypto/execSync
2. `pnpm test` passes — no regression in existing 432+ tests
3. No production code changes — tests only
4. No new dependencies added
5. Mocks use vitest (`vi.mock`, `vi.fn`, `vi.mocked`) consistent with existing test patterns
6. Home directory sanitization tests for any output that includes paths

### AW3 — QA acceptance (assigned: sna-qa-acceptance)

Run manual checklist:
- [ ] All handleHygieneScan tests present and pass
- [ ] All handleCleanupPreview tests present and pass
- [ ] All handleCleanupExecute tests present and pass
- [ ] `pnpm build` — PASS
- [ ] `pnpm typecheck` — PASS
- [ ] `pnpm test` — PASS (no regression)
- [ ] `pnpm privacy:scan` — PASS
- [ ] No production code changed (test-only scope)
- [ ] Mocks don't leak real file paths

### AW4 — Privacy/security audit (assigned: sna-privacy-security)

Independently verify:
- [ ] Tests use fake/mocked paths only — no real project root
- [ ] No real filesystem access during tests
- [ ] No sensitive data captured in test fixtures
- [ ] No new IPC channels or handlers tested (existing handlers only)
- [ ] No new dependencies introduced
- [ ] Privacy scan: PASS

### AW5 — Windows local package refresh (assigned: sna-windows-runtime)

Rebuild the Windows local package (`pnpm package`) and verify checksum after test changes.

### AW6 — Final local readiness gate (assigned: sna-release-docs)

Apply the standard readiness checklist:
- [ ] AW3 QA PASS
- [ ] AW4 privacy/security APPROVE
- [ ] AW5 package refresh PASS
- [ ] pnpm build PASS
- [ ] pnpm typecheck PASS
- [ ] pnpm test PASS
- [ ] pnpm privacy:scan PASS
- [ ] AW5 package is newest in dist/release/

---

## 5. Dependency graph

```
AW1 (scope doc) ──► AW2 (unit tests) ──► AW3 (QA) ──┐
                                             │       ├──► AW5 (package) ──► AW6 (gate)
                                             └──► AW4 (privacy) ─┘
```

Dependencies:
- AW2 depends on AW1 (scope defines what to test)
- AW3 depends on AW2 (must have tests to verify)
- AW4 depends on AW2 (must have code to audit)
- AW5 depends on AW3 + AW4 (both must pass before package refresh)
- AW6 depends on AW3 + AW4 + AW5 (all gates must pass)

---

## 6. Non-goals

These are explicitly **out of scope** for AW:

- **No production code changes** — AW2 is test-only. No changes to `worktree-ipc.ts`, `main.ts`, `preload.ts`, `App.tsx`, or `styles.css`.
- **No new IPC channels or handlers** — Only testing existing handlers.
- **No new cards, panels, or layout changes.**
- **No ServiceNow login, browsing, API writes, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion, screenshots, HAR, trace, cookies, storage-state, secrets, URLs, ticket IDs, sys_ids, or real field values.**
- **No push, PR, merge, tag, GitHub Release, publish, or cron changes.**
- **No refactoring of existing IPC handlers, preload bridge, or main.ts routing.**
- **No changes to existing test patterns or vitest configuration.**
- **No integration/e2e tests** — unit tests only, with mocked dependencies.
- **No test coverage for renderer-layer code** — IPC handler tests only.

---

## 7. Change budget

| Task | Files likely changed | Change budget |
|---|---|---|
| AW2 | `apps/desktop/electron/worktree-ipc.test.ts` | +150–200 lines (16+ test cases, shared mocks, beforeEach setup) |
| AW3 | QA checklist doc | < 40 lines |
| AW4 | Security audit doc | < 40 lines |
| AW5 | Build/packaging scripts | < 20 lines |
| AW6 | Gate document | < 40 lines |

**Total estimated change budget:** < 340 lines across 5 files.
**No production code changes.** All changes are in test code and status documents only.

---

## 8. Safety boundaries

### Safe (all operations local, mocked, read-only)

| Action | Safety boundary |
|---|---|
| Mocked `execFileSync` for git operations | No real process execution in tests |
| Mocked `readdirSync`, `readFileSync`, `statSync` for fs operations | No real filesystem access in tests |
| Mocked `renameSync`, `mkdirSync` for archive operations | No real filesystem mutation in tests |
| Mocked `createHash` for SHA256 | No real crypto computation in tests |
| All paths are fake (PROJECT_ROOT = `/home/user/projects/test-repo`) | No real project info leaked |

### Red-zone (explicit prohibitions — identical to existing project rules)

- No real ServiceNow login, browsing, or API writes
- No Save / Submit / Update / Resolve / Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- Local-only only; no external writes or deliveries
- No new IPC handlers (testing existing handlers only)
- No production code changes (test-only scope)

---

## 9. Required gates for downstream tasks

Each downstream task must pass these gates independently:

- `pnpm build` — production build succeeds (no production code change, but verify)
- `pnpm typecheck` — no type errors
- `pnpm test` — all existing + new tests pass
- `pnpm privacy:scan` — no new violations
- Windows local package refresh before QA handoff (AW5)
- Final local readiness gate before Alan manual validation (AW6)

---

## 10. Why this is not P0 recovery work

The system-level P0 goals (Windows double-click, startup diagnostics, QA Chromium visibility, CDP readiness, Verify/Verify-only separation, three-column layout, Windows package path) were all verified as PASS across the AQ–AV chain. The AQ release summary is the **latest gated backlog** and its remaining deferred item is IPC handler unit tests.

This scope is local-only, test-only, and zero-risk. It fills the last gap from the AQ release without introducing new features, new cards, new IPC, or new ServiceNow interactions.

---

## 11. Status

```
Phase AW1 — IPC HANDLER UNIT TESTS FOR HYGIENE/CLEANUP HANDLERS

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Latest gate base: AV7 (READY-FOR-MANUAL-VALIDATION-ONLY)
Current package: *av6-20260607-local.zip

AQ-deferred items remaining:
  - Item 1 (worktree acceptance card buttons): DONE (AS phase)
  - Item 2 (IPC handler unit tests): NOT STARTED ← THIS SCOPE
  - Item 3 (hardcoded display strings): DONE (AT/AU/AV phases)

Downstream tasks: 5
  - AW2: Unit test implementation (handleHygieneScan, handleCleanupPreview, handleCleanupExecute)
    → sna-frontend-workbench [first]
  - AW3: QA acceptance → sna-qa-acceptance [after AW2]
  - AW4: Privacy/security audit → sna-privacy-security [after AW2]
  - AW5: Windows local package refresh → sna-windows-runtime [after AW3 + AW4]
  - AW6: Final local readiness gate → sna-release-docs [after AW3 + AW4 + AW5]

Red-zone items excluded: 16
Non-goals: 10 (no production code changes, no new IPC, no new cards, no layout changes,
           no ServiceNow, no Git push, no refactoring, no test pattern changes,
           no integration tests, no renderer-layer coverage)
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
