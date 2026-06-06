# Phase I — Approval Matrix and Draft PR Body Finalization

**Date:** 2026-06-05
**Owner:** sna-release-docs
**Reviewers:** sna-pm-acceptance, codex-gpt55-control, sna-privacy-security

---

## Contents

1. [Approval Matrix](#1-approval-matrix)
2. [What Passed — Phase-by-Phase Status](#2-what-passed)
3. [What Remains Manual](#3-what-remains-manual)
4. [What Is Explicitly Out of Scope](#4-what-is-explicitly-out-of-scope)
5. [Draft PR Body (Copy-Paste Ready)](#5-draft-pr-body)
6. [Amber Approval Checklist](#6-amber-approval-checklist)
7. [Safety and Privacy Summary](#7-safety-and-privacy-summary)
8. [Remaining Risks](#8-remaining-risks)

---

## 1. Approval Matrix

| Phase | Area | Owner | Verdict | Requires Human Review? |
|-------|------|-------|---------|----------------------|
| **A** — Validation/Run History panel | Code + tests | sna-frontend-workbench | **PASS** (all gates) | YES — Alan to review UI |
| **B** — Autofill safety UX polish | Code + tests | sna-ui-designer | **PASS** (all gates) | YES — Alan to review UX copy |
| **C** — Local validation report export | Code + tests | sna-release-docs | **PASS** (all gates) | YES — Alan to review export feature |
| **D** — Safety regression expansion | Tests only | sna-qa-acceptance | **PASS** (all gates) | YES — Alan to review test coverage |
| **E** — Release/PR readiness package | Documentation | sna-release-docs | **PASS** (all gates) | YES — Alan to review this package |
| **F** — Privacy audit + branch hygiene | Audit only | sna-privacy-security | **APPROVE WITH CONDITIONS** | YES — 2 gitignore gaps remain open |
| **G** — E2E local demo regression | Verification | sna-qa-acceptance | **PASS** (all 4 gates, 374 tests) | YES — Alan to confirm regression pass |
| **H** — RC artifact refresh | Verification | sna-windows-runtime | **NO REBUILD NEEDED** | YES — Alan to confirm decision |

### Overall Branch Verdict

> **MERGE-READY WITH CONDITIONS**
>
> All automated gates pass. No code changes in F/G/H — these phases are audit-and-documentation-only. The branch is 3 commits ahead of `nightly/release-candidate-20260604` (1 feature commit + 2 status doc commits).
>
> **Blocking condition:** Two gitignore gaps (.codegraph/, .worktrees/) from Phase F must be remediated before merge, OR explicitly acknowledged and deferred by Alan.

---

## 2. What Passed

### Automated Gates (All Phases)

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | **PASS** | All 7 workspace projects build clean |
| `pnpm typecheck` | **PASS** | All TypeScript strict checks pass |
| `pnpm test` | **PASS** | 374 tests across 26 test files, all passing |
| `pnpm privacy:scan` | **PASS** | 196 committed files, zero violations |

### Phase A — Validation/Run History Panel

- **Deliverable:** Run history tracking (last 20 entries, ephemeral in-memory), sanitized evidence display, blocked-reason text mapping, History page with table + stats
- **Files changed:** `apps/desktop/src/App.tsx`, `apps/desktop/src/App.test.ts`, `apps/desktop/src/styles.css`, `docs/architecture/manual-validation-evidence.md`
- **Tests:** Verified rendering of History page, validation run entries, sanitized output

### Phase B — Autofill Safety UX Polish

- **Deliverable:** Emphasized manual login, inspection before fill, text-fields-only autofill, manual review. Success message explicitly states no Save/Submit/Update/Resolve/Close/upload/email/API
- **Files changed:** `apps/desktop/src/App.tsx`, `apps/desktop/src/App.test.ts`, `apps/desktop/src/styles.css`
- **Tests:** Safety copy assertions in browser operation rail

### Phase C — Local Validation Report Export

- **Deliverable:** `exportValidationRunsToMarkdown`, `exportValidationRunsToCsv` (pure functions), `triggerStringDownload` DOM helper, export buttons in History page header
- **Tests:** 6 new tests for export formatting + DOM download
- **Safety:** No cloud writes, no API calls, no real metadata export

### Phase D — Safety Regression Expansion

- **Deliverable:** Fixture test asserting `writeActionsAttempted=false`, `artifactsCaptured=false`; UI wording scan across 16 active-verb patterns for automation-implying language
- **Tests:** Expanded from 306 → 317 → 374 tests (across all phases)

### Phase E — Release/PR Readiness Package

- **Deliverable:** PR description, release checklist, status files — all in `docs/status/next-round-ready-for-alan-review-2026-06-05.md`
- **PR target (at Phase E time):** `next/manual-validation-followups-20260605` → `nightly/release-candidate-20260604`

### Phase F — Privacy Audit + Branch Hygiene

- **Verdict:** APPROVE WITH CONDITIONS
- **Committed files (196):** Clean — no SN URLs, sys_ids, emails, credentials, screenshots
- **Findings (2 gaps):**
  - GAP-1 (MEDIUM): `.codegraph/` (3MB) not gitignored
  - GAP-2 (HIGH): `.worktrees/` (1.2GB, 10K+ files) not gitignored
- **Clean items:** All dist/, node_modules/, .local/, screenshots/, .env properly gitignored; no committed artifacts

### Phase G — E2E Local Demo Regression

- **Verdict:** PASS
- **Pages verified:** Intake, Knowledgebase, History/Validation Runs, Browser operation rail
- **Note:** "Reports" page not a standalone nav item — History export serves reporting needs
- **Safety:** No real browser/ServiceNow operation, no Save/Submit/Update/Resolve/Close, verify-only is read-only

### Phase H — RC Artifact Refresh

- **Verdict:** NO REBUILD NEEDED
- **Evidence:** SHA256 valid (`b73d5484aeb1f068f6d1f4ba92158c0dd2bf69d09331087ffcadade67d6f136d`), forbidden content audit PASS, START-HERE contains exact no-write sentence, all 86 expected files present
- **Rationale:** Phase G commit was documentation-only — binary identical to existing RC.1

---

## 3. What Remains Manual

The following items are **NOT automated** and require Alan (human) action:

### Before Merge
- [ ] **Alan reviews this Phase I approval matrix** and decides to proceed
- [ ] **Amber approvals** obtained from all 3 required profiles (see [checklist](#6))
- [ ] **Two gitignore gaps** remediated or explicitly deferred by Alan
- [ ] **Final PR body** copy-pasted and adjusted as Alan prefers

### After Merge (Always Manual — Product Rule)
- [ ] **PR creation** — the agent does NOT push or create PRs
- [ ] **Save / Submit / Update / Resolve / Close** in ServiceNow — never automated
- [ ] **Windows packaged artifact double-click test** on clean Windows machine (no WSL crutch)
- [ ] **Live browser integration test** with dedicated Chromium against real ServiceNow (if/when approved)
- [ ] **Production go/no-go decision** per `docs/field-trial/production-shadow-go-no-go-checklist.md`

### Never Automated (Out of Scope Permanently)
- Human review and approval of AI-drafted content
- Final submission in ServiceNow
- ServiceNow API writes of any kind
- production writes or production-shadow writes

---

## 4. What Is Explicitly Out of Scope

The following work is **specifically excluded** from this PR and its RC hardening phase:

| Item | Reason | Target Release |
|------|--------|----------------|
| Live browser integration test with dedicated Chromium | Requires real SN access, separate QA session | Future PR |
| Production packaging PR (portable zip with checksums) | Already exists as RC.1 artifact | Already done |
| GitHub Draft Release | Human gate — Alan does this after merge | After merge |
| GitHub Release / Tag / Push | Red zone — agent never executes | Never automated |
| Windows double-click test on clean machine | Requires physical Windows machine without WSL | Manual only |
| `.gitignore` remediation for `.codegraph/` and `.worktrees/` | Found in Phase F; either do now or defer as follow-up | This PR or follow-up |
| Cleanup of stale dist/ artifacts (227MB) | Low priority, informational note | When convenient |
| Review of `.local/video-analysis/` contact sheets | Low priority, informational note | When convenient |
| History persistence to disk/cloud | Intentional — privacy design (ephemeral only) | Future consideration |
| CLI-mode export (browser-download only) | Implementation limitation — DOM-API only | Future consideration |
| Full CI/CD pipeline | Not established | Future |

---

## 5. Draft PR Body

> Copy the following block into the GitHub PR description. Adjust any details as Alan prefers.

---

```markdown
## Manual validation follow-ups + RC hardening phases (A–H)

### Summary

This PR brings together both rounds of work after Alan's Windows app launch + autofill success on 2026-06-05:

**Round 1 (Phase A–E):** History panel, safety UX polish, local export, expanded tests, release readiness package.
**Round 2 (Phase F–H):** Privacy audit, E2E regression verification, RC artifact refresh confirmation.

Total: **3 commits** ahead of `nightly/release-candidate-20260604` — one feature commit + two documentation-only status commits.

### Phases

| Phase | What | Status |
|-------|------|--------|
| **A** — Validation/Run History panel | Sanitized evidence display, history tracking (last 20 runs, ephemeral), blocked-reason text mapping | ✅ PASS |
| **B** — Autofill safety UX polish | Clearer labels: manual login, inspection before fill, text fields only, manual review; success state says no Save/Submit/Update/Resolve/Close used | ✅ PASS |
| **C** — Local validation report export | Markdown/CSV export of sanitized validation run history (pure functions, browser download only, no cloud writes) | ✅ PASS |
| **D** — Safety regression expansion | Additional tests for sanitized evidence mode and no automation-implying UI wording | ✅ PASS |
| **E** — Release/PR readiness package | PR description, release checklist, status files | ✅ PASS |
| **F** — Privacy audit + branch hygiene | 196 committed files scanned — clean. **2 gitignore gaps found** (see Safety section) | ✅ APPROVE WITH CONDITIONS |
| **G** — E2E local demo regression | All 4 gates pass (build, typecheck, 374 tests, privacy scan). All workbench pages render correctly | ✅ PASS |
| **H** — RC artifact refresh | SHA256 valid, forbidden content audit PASS, no rebuild needed | ✅ PASS |

### Gates

- `pnpm build` — ✅ PASS
- `pnpm typecheck` — ✅ PASS
- `pnpm test` — ✅ PASS (374 tests across 26 files, 7 packages)
- `pnpm privacy:scan` — ✅ PASS (196 tracked files, zero violations)

### Manual acceptance (Alan, 2026-06-05)

- ✅ Windows app launch — PASS
- ✅ Autofill success — PASS
- ✅ Full three-column workbench UI and Chromium CDP flow — working (Phase G regression re-verified all pages)

### Safety

- 🔒 **No Save/Submit/Update/Resolve/Close automation** added or enabled
- 🔒 All evidence is sanitized (no ticket IDs, sys_ids, URLs, customer data, credentials)
- 🔒 History is ephemeral in-memory only — never persisted to disk or cloud
- 🔒 Export is local browser download only — no cloud/API writes
- 🔒 Privacy scan: 196 files clean — no leaks detected
- 🔒 Verify-only is read-only — never modifies ServiceNow data

### Gitignore gaps found (Phase F audit)

| Gap | Severity | Description |
|-----|----------|-------------|
| `.codegraph/` (3MB) | MEDIUM | Codegraph indexing database — not gitignored |
| `.worktrees/` (1.2GB) | HIGH | Full repo copies including nested git repos and build artifacts |

**Recommendation:** Add both to `.gitignore` before merge, or explicitly acknowledge and defer.

### Do NOT merge without

- [ ] Alan explicit approval
- [ ] `sna-pm-acceptance` profile gate approval
- [ ] `sna-privacy-security` profile gate approval
- [ ] `codex-gpt55-control` profile gate approval
- [ ] Gitignore gaps resolved or explicitly deferred

### Future work (after this PR)

- Live browser integration test with dedicated Chromium
- `.gitignore` remediation for `.codegraph/` and `.worktrees/`
- GitHub Draft Release for final Alan check
- Windows packaged artifact double-click test on clean machine
- Production go/no-go decision
```

---

## 6. Amber Approval Checklist

Before any push, PR creation, merge, or release, obtain **all three** Amber approvals in this order:

### 1. `codex-gpt55-control` — Code Quality Gate
- [ ] Review code diff for unexpected behavior
- [ ] Confirm all phases deliver what they claim
- [ ] Verify no stealth features or scope creep
- [ ] **Status:** ⏳ Not yet obtained

### 2. `sna-privacy-security` — Privacy and Security Gate
- [ ] Review Phase F audit results
- [ ] Confirm gitignore gaps are understood and either fixed or deferred
- [ ] Verify no committed sensitive data
- [ ] Confirm the RC artifact boundary is secure
- [ ] **Status:** ⏳ Not yet obtained

### 3. `sna-pm-acceptance` — Product Acceptance Gate
- [ ] Review the complete PR body and status files
- [ ] Confirm manual acceptance criteria are met
- [ ] Sign off on the scope vs. out-of-scope boundaries
- [ ] **Status:** ⏳ Not yet obtained

### 4. Alan (human) — Final Decision
- [ ] Review this approval matrix
- [ ] Review the draft PR body
- [ ] Decide on gitignore gap treatment (fix or defer)
- [ ] Explicit approval to proceed with PR creation
- [ ] **Status:** ⏳ Awaiting Alan review

### Process Notes

- The three profile gates (`codex-gpt55-control`, `sna-privacy-security`, `sna-pm-acceptance`) should be run as separate kanban worker tasks.
- Each gate produces its own review artifact in `docs/status/`.
- Alan's approval is the **final gate** — no PR action happens without it.
- After all Amber gates pass: **human** creates the PR using the draft body above. The agent does NOT push, tag, release, or create the PR.

---

## 7. Safety and Privacy Summary

| Check | Status |
|-------|--------|
| No ServiceNow URLs, ticket IDs, sys_ids, customer data in committed files | ✅ VERIFIED |
| No credentials or secrets committed | ✅ VERIFIED |
| No production write paths exposed | ✅ VERIFIED |
| No Save/Submit/Update/Resolve/Close automation | ✅ VERIFIED (product rule enforced) |
| All evidence display is sanitized | ✅ VERIFIED |
| History is ephemeral (not persisted) | ✅ VERIFIED |
| Export is browser-download only (no cloud/API) | ✅ VERIFIED |
| Verify-only is read-only | ✅ VERIFIED |
| RC artifact contains no forbidden content | ✅ VERIFIED (86 files audited) |
| START-HERE includes explicit no-write warning | ✅ VERIFIED |
| Privacy:scan passes 196 committed files | ✅ VERIFIED |

### Open Items (not blocking but flagged)

| Item | Risk | Status |
|------|------|--------|
| `.codegraph/` not gitignored (3MB) | MEDIUM — could be accidentally staged | Not yet fixed |
| `.worktrees/` not gitignored (1.2GB) | HIGH — could be accidentally committed | Not yet fixed |
| `.local/` contains workflow recording contact sheets | LOW — properly gitignored, review/delete when convenient | Informational |

---

## 8. Remaining Risks

1. **Windows packaged artifact not double-click-tested on clean Windows.** The existing RC.1 has been validated only within the WSL dev environment. A clean Windows machine test (no WSL, no Node.js, no pnpm) has not been performed. This is the single highest-risk gap before production.

2. **Export is browser/Electron-only.** `triggerStringDownload` requires DOM APIs; not usable in headless/CLI mode. Acceptable for the current desktop-focused release.

3. **History is ephemeral.** Page refresh clears validation runs. Intentional for privacy but limits debugging. Acceptable trade-off for the preview release.

4. **No open PR yet.** This branch (`next/pr-rc-hardening-20260605`) has no GitHub PR open. The draft body above is for manual PR creation after Amber approvals.

5. **Gitignore gaps exist.** If left unfixed, an accidental `git add .` could commit 1.2GB of worktree files including nested repos and build artifacts. Recommend fixing before merge.

---

## Appendix A: Branch State

| Property | Value |
|----------|-------|
| Branch | `next/pr-rc-hardening-20260605` |
| Base | `nightly/release-candidate-20260604` |
| Behind base | 0 commits (base is ancestor) |
| Ahead of base | 3 commits |
| Commits | `7287ba1` (Phase A–E feature merge), `cbf73a6` (Phase G status doc), `9ccfe3b` (Phase H status doc) |
| Total files changed | 196 committed files |
| Code change scope | Only Phase A–E commit changes code; Phase G–H are documentation-only |

## Appendix B: Key Artifacts

| Artifact | Path |
|----------|------|
| This approval matrix | `docs/status/phase-I-approval-matrix-pr-packet-2026-06-05.md` |
| Phase E readiness package | `docs/status/next-round-ready-for-alan-review-2026-06-05.md` |
| Phase F privacy audit | `docs/status/phase-F-branch-hygiene-artifact-boundary-2026-06-05.md` |
| Phase G regression report | `docs/status/phase-G-local-demo-regression-2026-06-05.md` |
| Phase H RC refresh decision | `docs/status/phase-H-rc-artifact-refresh-2026-06-05.md` |
| Draft release notes | `docs/releases/windows-v0.1-rc-draft-release-notes.md` |
| RC artifact | `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` |

---

*Prepared by Phase I — Approval matrix packet and draft PR body finalization. 2026-06-05.*
