# Phase AH1 — Explicit Worktree Acceptance Scope after AG7

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AG7 base:** `019c502` with AG1–AG6 working-tree changes present
**Profile:** `sna-orchestrator`
**Task:** `t_c21155ec`

---

## 1. Why this phase — the worktree acceptance boundary after AG7

AG7 (Final Local Readiness Gate) returned **BLOCKED** with finding:

> The worktree is not clean and remaining changes are not limited to this AG7 status doc.

The analysis is correct: the working tree contains AG1–AG6 changes that were built incrementally by automated workers but **never explicitly accepted or committed by Alan**. The AG package (`ag` Windows local zip) was built from this state and all 4 gates pass, but there is no human-signaled acceptance of what the worktree currently holds.

**The gap is not technical — it is procedural.** The code works, the tests pass, the package builds, the privacy scan is clean. But no human has looked at the diff and said "yes, this set of changes is the intended AG phase output."

AH1 makes that boundary explicit: categorizes every dirty path, defines acceptance paths for each category, and presents Alan with a clear decision point.

---

## 2. Current worktree state — complete snapshot

Source: AG7 metadata (`t_4c5fb053` handoff), file reads confirmed 2026-06-07.

### 2.1 Dirty paths inventory

**Modified files (tracked, changed in working tree):**

| Path | Category | Origin | Lines changed | Content |
|------|----------|--------|------|---------|
| `.gitignore` | Config | AG1-DelB | +1 comment | `# .local/video-analysis/ — local-only workflow artifacts (gitignored)` |
| `apps/desktop/src/App.test.ts` | Code | AG3 impl | +28 lines | Repo hygiene card test: renders 3 items, correct state chips, boundary copy |
| `apps/desktop/src/App.tsx` | Code | AG3 impl | +47 lines | `<section>` JSX for repo-hygiene-card (lines 4112–4158) |
| `apps/desktop/src/styles.css` | Styles | AG3 impl | +151 lines | `.repo-hygiene-*` CSS classes: state chips, queue layout, evidence section, footer boundary |
| `docs/status/phase-AG1-local-repo-hygiene-and-artifact-boundary-scope-2026-06-07.md` | Doc | AG1 scope | ~291 lines | Scope definition for repo hygiene cleanup |
| (AG1 cleanup report — see untracked) | Doc | AG1 impl | ~N/A | Cleanup report |

**Untracked files (new, not in git):**

| Path | Category | Origin | Size | Content |
|------|----------|--------|------|---------|
| `.todo-ag1-check-gitignore.sh` | Script | AG1-DelC | 0 bytes | Empty placeholder — never populated |
| `docs/status/phase-AG1-cleanup-report-2026-06-07.md` | Doc | AG1 cleanup | ~N/A | Records stale artifact removal |
| `docs/status/phase-AG2-local-repo-hygiene-ux-spec-2026-06-07.md` | Doc | AG2 spec | 340 lines | Three-column UX spec for hygiene surface |
| `docs/status/phase-AG3-local-repo-hygiene-implementation-2026-06-07.md` | Doc | AG3 impl | 74 lines | Implementation report for hygiene card |
| `docs/status/phase-AG4-qa-acceptance-manual-checklist-2026-06-07.md` | Doc | AG4 QA | 124 lines | QA acceptance checklist — PASS |
| `docs/status/phase-AG5-privacy-security-audit-2026-06-07.md` | Doc | AG5 privacy | 140 lines | Privacy/security audit — APPROVE |
| `docs/status/phase-AG6-windows-local-package-refresh-2026-06-07.md` | Doc | AG6 package | 125 lines | AG Windows package refresh — PASS |
| `docs/status/phase-AG7-final-local-readiness-gate-2026-06-07.md` | Doc | AG7 gate | 117 lines | Final readiness gate — BLOCKED (this blocker) |
| `scripts/hygiene/` (dir) | Script | AG1-DelA | 94 lines | `cleanup-stale-artifacts.sh` — stale artifact removal script |

### 2.2 Category summary

| Category | Count | Paths | Primary concern |
|----------|-------|-------|----------------|
| **Status docs** | 8 files | All `docs/status/phase-AG*.md` | Expected phase output — should be committed with the branch |
| **Code changes** | 3 files | `App.tsx`, `App.test.ts`, `styles.css` | Functional code — needs human review of diff |
| **Scripts** | 2 files | `scripts/hygiene/cleanup-stale-artifacts.sh`, `.todo-ag1-check-gitignore.sh` | Optional tooling — `.todo-*` is empty placeholder |
| **Config** | 1 file | `.gitignore` | Comment-only — zero functional impact |

### 2.3 Blocking judgment from AG7

AG7's clean-worktree gate required either:
- A completely clean working tree, OR
- Remaining changes limited to this AG7 status doc only

Neither condition is met. The AG1–AG6 code/script/doc changes exist in the worktree by design (they are the phase output), but they were never the subject of an explicit human acceptance gate.

---

## 3. AH1 scope — what this phase defines

### 3.1 Deliverable A — Worktree Acceptance Specification (this document)

Categorize every dirty path, define acceptance criteria, and present Alan with explicit binary choices for each category.

### 3.2 Deliverable B — Acceptance Decision Template

A structured document Alan can use to signal acceptance for each category. The template uses checkboxes and explicit language:

```
☐ I have reviewed the AG1–AG6 code changes and accept them.

  Changed files:
  - apps/desktop/src/App.tsx        (+47 lines — repo-hygiene-card JSX)
  - apps/desktop/src/App.test.ts    (+28 lines — hygiene card test)
  - apps/desktop/src/styles.css     (+151 lines — hygiene card CSS)

  I understand these changes add a read-only local repo hygiene surface
  to the desktop workbench. No live ServiceNow actions, no writes,
  no upload/PR/merge/release actions.

  ☐ Accept as-is
  ☐ Accept with conditions (specify below)
  ☐ Reject — revert and rework

☐ I have reviewed the GH1 scripts and config changes.

  Changed:
  - scripts/hygiene/cleanup-stale-artifacts.sh  (94 lines — cleanup tool)
  - .todo-ag1-check-gitignore.sh                (0 bytes — empty placeholder)
  - .gitignore                                  (+1 comment — video-analysis)

  ☐ Accept
  ☐ Reject / defer

☐ I have reviewed the AG1–AG7 status docs.

  These are 8 tracking/status documents in docs/status/ that record
  the AG phase progression. They should be committed with the branch.

  ☐ Commit to branch
  ☐ Squash into a single commit
  ☐ Keep uncommitted until branch merge
```

This template goes at the end of this document (Appendix A) and in a standalone file `docs/status/phase-AH1-acceptance-decision-template-2026-06-07.md` for easy printing/copying.

### 3.3 Deliverable C — Post-Acceptance Next Phase Definition

Define what comes after Alan explicitly accepts the worktree. Options include:

1. **If accepted as-is:** Commit AG1–AG7 changes to the branch, then proceed to the next product scope phase (AH2 — likely continuing the P0 recovery chain from AF1: clean-machine validation, startup diagnostics, Chromium provisioning)
2. **If accepted with conditions:** Address conditions, then commit
3. **If rejected:** Revert AG1–AG6 changes from worktree, re-scope the implementation

### 3.4 Safety boundary

- No live ServiceNow login, browser automation, or API writes
- No Save / Submit / Update / Resolve / Close
- No upload, Microsoft Graph / Excel Web writes, Teams/Outlook/phone ingestion
- No secrets/cookies/storage-state/HAR/trace/screenshot/real URL/ticket ID/sys_id/requester/assignment group/raw field values
- No push/PR/merge/tag/GitHub Release — acceptance decisions are local-only signals
- No cron recursion or modification
- The acceptance template is a local-only document; it does not trigger any automated action

---

## 4. Current gate status for the dirty worktree

All four required gates ran at AG6 and AG7 from the dirty state and **all passed**:

| Gate | Result | Sanitized evidence |
|------|--------|-------------------|
| `pnpm build` | PASS | Recursive workspace build: 3 Electron bundles (main/preload/renderer), 7 workspace projects |
| `pnpm typecheck` | PASS | All 7 workspace packages typecheck clean |
| `pnpm test` | PASS | 413/413 total, `apps/desktop` 123/123 (includes the hygiene card +28 test) |
| `pnpm privacy:scan` | PASS | 288 files tracked, no privacy violations |

The dirty worktree code is production-ready from a gates perspective. The only blocker is the absence of a human acceptance signal.

---

## 5. Actual path inventory and acceptance criteria

### 5.1 Category A — Status docs (8 files)

**What they are:** Tracking documents that record what was done in each AG sub-phase. No functional code, no runtime impact.

**Acceptance criteria:**
- [ ] Alan reviews the AG1 through AG7 doc titles and confirms the phase progression is accurate
- [ ] No secrets, raw identifiers, real ServiceNow URLs, ticket IDs, sys_ids in any doc
- [ ] Privacy/security boundary language is present and correct in each doc
- [ ] Alan decides commit strategy: individual commits vs. one squashed commit

**Chosen approach:** Minimal — Alan can skim doc titles in 30 seconds. The privacy audit (AG5) already confirmed no sensitive data in the docs.

### 5.2 Category B — Code changes (3 files)

**What they are:** The repo hygiene panel (AG3 implementation). A read-only card in the desktop workbench center workspace that shows `.gitignore` verification status, stale artifact cleanup state, and `.local/video-analysis/` closure.

**Acceptance criteria:**
- [ ] Alan reviews the 3-file diff (App.tsx +47, App.test.ts +28, styles.css +151 = 226 lines)
- [ ] Confirms no live ServiceNow actions, no browser automation, no writes
- [ ] Confirms the three hygiene items display with correct states (Verified / Pending / Closed as N/A)
- [ ] Confirms the boundary footer is present and explicit
- [ ] Confirms the card is ordered correctly (handoff → hygiene → selected source)
- [ ] Makes binary decision: accept as-is, accept with conditions, or reject

**Chosen approach:** Provide Alan with the exact diff statistics so he can review at a glance. The code was QA'd (AG4 — PASS), privacy-audited (AG5 — APPROVE), and tested (123/123 desktop tests pass).

### 5.3 Category C — Scripts and config (3 files)

**What they are:**
1. `scripts/hygiene/cleanup-stale-artifacts.sh` (94 lines) — dry-run-safe bash script that removes ab/ad/ae stale artifacts from `dist/release/`, keeping canonical `rc.1` and latest `af` package.
2. `.todo-ag1-check-gitignore.sh` (0 bytes) — empty placeholder, never populated. Debatable whether to keep or delete.
3. `.gitignore` (1 comment line) — `# .local/video-analysis/ — local-only workflow artifacts (gitignored)`

**Acceptance criteria:**
- [ ] Alan reviews the cleanup script logic (dry-run mode, stale pattern matching, keep lists)
- [ ] Confirms the empty `.todo-*` file should either be populated or deleted
- [ ] Confirms the `.gitignore` comment is correct
- [ ] Makes binary decision for each: accept, reject, or defer

**Chosen approach:** The cleanup script is optional tooling — Alan can decide whether to keep or remove it. The `.todo-*` file should be either populated with verification logic or deleted.

### 5.4 Category D — AG Windows package

**What it is:** `servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip` (118 MB, SHA256 `6105d1da...`) — the AG phase Windows local package built from the dirty worktree.

**Status:** The package exists and is fresh (03:36 CST), but Alan has never double-clicked it on a clean Windows machine.

**Note:** The AG package is a build artifact from the dirty worktree. If Alan rejects any code change, the package would need to be rebuilt after reverting. If Alan accepts the changes, the package can be manually validated per the AG7 validation checklist.

---

## 6. Decision tree for Alan

```
┌──────────────────────────────────────────────┐
│  AH1: Worktree Acceptance Scope Document     │
│  (this file)                                 │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─ Do you want to review the 3-file code    │
│  │  diff?                                    │
│  │  Yes ──→ Review App.tsx +47 / App.test.ts │
│  │           +28 / styles.css +151           │
│  │  No  ──→ Trust the gates (all PASS)       │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─ Which is your acceptance decision?       │
│  │                                          │
│  │  ACCEPT AS-IS ─────────────────────────┐ │
│  │  → Commit AG1–AG7 to branch            │ │
│  │  → Proceed to AH2 (next product scope) │ │
│  │  → AG package is validated artifact    │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  ACCEPT WITH CONDITIONS ──────────────────┐ │
│  → Specify conditions                    │ │
│  → Address conditions                    │ │
│  → Then follow "Accept as-is" path       │ │
│  └────────────────────────────────────────┘ │
│                                              │
│  REJECT ───────────────────────────────────┐ │
│  → Revert AG1–AG6 code changes           │ │
│  → Rebuild AG package (or use af)        │ │
│  → Re-scope implementation               │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 7. What is NOT in scope (AH1 red-zone)

| Item | Reason |
|------|--------|
| Live ServiceNow login, browser automation, API writes | Red-zone — requires explicit Alan approval |
| Save / Submit / Update / Resolve / Close automation | Red-zone — never automated |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams / Outlook / phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, video capture from live ServiceNow | Red-zone — never automated |
| Cookie, session, storage-state capture or export | Red-zone — never automated |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Committing the AG1–AG7 changes | This doc defines acceptance; committing is a separate action |
| Running the stale-artifact cleanup script | This doc defines acceptance; cleanup is a separate action |
| Manual Windows validation of the AG package | Part of post-acceptance validation, not acceptance itself |
| Creating `ah` or `ai` phase packages | Next phase — not acceptance |
| New feature design or implementation | Out of scope for acceptance gate |

---

## 8. Pipeline and dependencies

```
AH1 is a definition-only phase — no code changes, no implementation.
It produces 3 documents:

Deliverable A — this scope document           → sna-orchestrator   [standalone]
Deliverable B — acceptance decision template  → sna-release-docs   [standalone]
Deliverable C — post-acceptance next phase    → sna-orchestrator   [depends on Alan decision]

All three are independent — can be produced in parallel.
    ↓
AH1 Final review                → sna-qa-acceptance    [after Alan decision]
AH1 Privacy/security audit      → sna-privacy-security [after Alan decision]
AH1 Release summary             → sna-release-docs     [after Alan decision]
```

### Minimum viable path

```
AH1 scope doc ──→ Alan reads ──→ Alan decides ──→ AH2 (next scope)
                                   accept/reject
```

---

## 9. Gate policy

This phase produces documents only — no code changes, no runtime artifacts.

| Gate | Required? | Rationale |
|------|-----------|-----------|
| `pnpm build` | NO | Scope-only — no code changed |
| `pnpm typecheck` | NO | Scope-only — no code changed |
| `pnpm test` | NO | Scope-only — no code changed |
| `pnpm privacy:scan` | YES | Docs must not contain secrets, real URLs, PII |

The privacy scan must pass on this document (and the acceptance template document) to confirm no sensitive identifiers were leaked into the status docs.

---

## 10. Status

```
Phase AH1 — EXPLICIT WORKTREE ACCEPTANCE SCOPE AFTER AG7

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Backlog items addressed: 1
  - Worktree acceptance boundary after AG7: DEFINED

Downstream deliverables defined: 3
  - A: Worktree acceptance specification        → sna-orchestrator   [standalone]
  - B: Acceptance decision template              → sna-release-docs  [standalone]
  - C: Post-acceptance next phase definition     → sna-orchestrator  [after Alan decision]

Red-zone items excluded: 14
Non-goals: 9
```

This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.

---

## Appendix A — Acceptance Decision Template

```markdown
# Worktree Acceptance Decision — AG1–AG7 Changes on `next/post-release-operator-cockpit-ab-20260606`

Date: _______________
Signed by: Alan

## 1. Code changes (3 files, ~226 lines)

- [ ] I have reviewed the 3-file diff
- [ ] I confirm the hygiene card shows correct states (Verified / Pending / Closed as N/A)
- [ ] I confirm the boundary footer says "Local only · No ServiceNow actions"
- [ ] I confirm no live ServiceNow actions or writes

Decision:
☐ Accept as-is
☐ Accept with conditions: __________________________________________
☐ Reject — revert and rework

## 2. Scripts and config (3 files)

- `scripts/hygiene/cleanup-stale-artifacts.sh` (94 lines, dry-run safe)
- `.todo-ag1-check-gitignore.sh` (0 bytes — empty placeholder)
- `.gitignore` (+1 comment — video-analysis)

Decision:
☐ Accept all
☐ Delete .todo-ag1-check-gitignore.sh, keep the rest
☐ Delete all — revert cleanup script and .todo placeholder
☐ Defer decision to later phase

## 3. Status docs (8 files in docs/status/phase-AG*.md)

Decision:
☐ Individual commits — commit each AG phase doc separately
☐ Squash — commit all 8 docs as a single "AG phase status docs" commit
☐ Keep uncommitted until branch merge

## 4. AG Windows package

`servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip`
SHA256: 6105d1da...

☐ Accept — this is the validated AG artifact
☐ Reject — rebuild after reverting code changes

## 5. Next step preference

After acceptance, I would like to proceed to:
☐ AH2 — clean-machine validation of the AG package
☐ AH2 — startup diagnostics visibility (P0 gap)
☐ AH2 — Chromium provisioning fix (P0 gap chain)
☐ AH2 — three-column UI polish
☐ Something else: __________________________________________________
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
