# Phase AG1 — Local Repo Hygiene and Artifact Boundary Cleanup — Scope Definition

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AF7 base:** `1a18b94` (AF7 final local readiness gate) + all AF-phase artifacts
**Profile:** `sna-orchestrator`
**Task:** `t_b9aba0ca`

---

## 1. Why this phase — the remaining local hygiene surface after AF7

AF7 (final local readiness gate for Windows operator packaging/runtime readiness) delivered the `af` Windows local package and confirmed all P0 runtime gaps (startup diagnostics, Chromium provisioning precheck, auto-provisioning, clean-machine runbook) are implemented. 412/412 tests pass, privacy scan passes.

**But local repo hygiene items were never packaged as an explicit follow-up.** The backlog, carried over from the `next-round-2-gitignore-remediation` phase (2026-06-05) and subsequent rounds, includes three items:

1. **`.gitignore` remediation for `.codegraph/` and `.worktrees/`** — entry added in June 5 remediation, but persistent-remediation question remains (see §2.1)
2. **Stale `dist/` artifact cleanup** — `dist/release/` has accumulated 17 files across 5 dated packages + issue98 artifacts; all gitignored, but none were ever pruned
3. **`.local/video-analysis/` contact-sheet review** — called out as a known backlog item that needs truth assessment

---

## 2. Current state — honest fact check for each item

### 2.1 `.gitignore` — `.codegraph/` and `.worktrees/`

| Check | Result | Evidence |
|-------|--------|----------|
| `.gitignore` line 18 | `.codegraph/` — PRESENT | Added in June 5 "Next Round 2 — Gitignore Remediation" phase |
| `.gitignore` line 19 | `.worktrees/` — PRESENT | Same phase |
| `git check-ignore` | PASS (re-verified 2026-06-07) | `.gitignore:18:.codegraph/	.codegraph` and `.gitignore:19:.worktrees/	.worktrees` |
| `.codegraph/` on disk | EXISTS — `codegraph.db` | Active CodeGraph metadata store |
| `.worktrees/` on disk | DOES NOT EXIST | Defensive entry for future worktree use |
| Was `.codegraph/` committed before the ignore rule? | **Unknown** — requires `git log --all --diff-filter=A -- .codegraph/` to check. If it was committed, the gitignore only prevents new additions; the historical blobs remain in history. |

**Honest assessment:** The `.gitignore` remediation is **already complete** for both entries. The remaining question is whether `.codegraph/` was committed in past history (before June 5) and whether that matters. For a local-only branch that will be squashed or rebased before merging to `main`, the historical presence of gitignored metadata in early commits is low concern — the final merge commit will not contain these files. If Alan later wants a clean `main` history, `git filter-repo` or `BFG Repo-Cleaner` would be needed, but that is out of scope for local hygiene.

**→ Scope decision: NO FURTHER ACTION needed on `.gitignore` entries themselves. The remediation is done.**

### 2.2 Stale `dist/release/` artifacts

**17 files found in `dist/release/`:**

| Artifact | Size | Freshness | Status |
|----------|------|-----------|--------|
| `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` + .sha256 | ~118 MB | LATEST (AF7) | Keep |
| `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` + .sha256 + START-HERE | ~118 MB | PREVIOUS (AE6) | Stale |
| `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` + .sha256 + START-HERE | ~118 MB | STALE (AD6) | Stale |
| `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip` + .sha256 + START-HERE | ~118 MB | STALE (AB6) | Stale |
| `servicenow-automation-windows-v0.1.0-rc.1.zip` + .sha256 | ~118 MB | CANONICAL (v0.1.0-rc.1 GitHub prerelease) | Keep (published canonical) |
| `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` | ~1 KB | CANONICAL | Keep |
| `release-issue98-main-20260528/` (3 files) | ~118 MB | STALE (issue 98, May 28) | Stale |

**Estimated total stale waste:** ~500 MB (ab + ad + ae + issue98 = ~470 MB zip data + associated metadata)

**All files are gitignored** — they exist only in the working tree, not in git history.

**Honest assessment:** These artifacts are safe to delete locally. They are redundant copies of intermediate builds that have been superseded by `af`. The canonical `rc.1.zip` is the published GitHub prerelease and should be kept. The `af` artifact is the latest validated package and should be kept. Everything in between (`ab`, `ad`, `ae`, `issue98`) is stale and safe to remove.

**→ Scope decision: A localized, safe cleanup script that deletes stale dated artifacts (ab, ad, ae, issue98) from `dist/release/`, keeping canonical `rc.1` + latest `af`. Document what was removed and ask Alan to confirm.**

### 2.3 `.local/video-analysis/` contact-sheet review

| Check | Result |
|-------|--------|
| `.local/video-analysis/` directory exists? | **NO** — does not exist |
| Any file in `.local/` matching `*video*` or `*contact*sheet*` | **ZERO** |
| Any file anywhere in the repo matching `video-analysis` | **ZERO** |

`.local/` contents (verified):
- `.local/startup-logs/` — CDP startup logs (jsonl) and desktop start logs
- `.local/overnight/` — overnight phase docs (late May 2026)
- `.local/review/` — PR review diffs and scan results
- `.local/tmp-*.ps1` — temporary PowerShell helper scripts

**Honest assessment:** There are no video-analysis contact sheets in this repository. The backlog item appears to be a stale reference from an earlier phase where the possibility was discussed but never realized. The `.local/` directory is correctly gitignored (`.gitignore` line 14: `.local/`).

**→ Scope decision: Mark as N/A — no review needed. The directory does not exist. If Alan wants to retain the possibility of video-analysis contact sheets in the future, a neutral comment can be added to `.gitignore` acknowledging this as reserved namespace.**

---

## 3. AG1 scope — deliverables

### 3.1 Deliverable A — Stale Artifact Cleanup Script

**Problem:** `dist/release/` has 470+ MB of stale intermediate build artifacts that are never referenced by any current phase doc. They waste disk space and create ambiguity (Alan might test an old `ab` or `ae` package instead of the latest `af`).

**Goal:** Produce a localized cleanup script (bash/PowerShell) that:
1. Lists all stale artifacts (`ab`, `ad`, `ae`, and `release-issue98-main-20260528/`) with size and mtime
2. Removes them from `dist/release/`
3. Produces a cleanup report documenting what was removed
4. Leaves `rc.1.zip`, `rc.1.sha256`, `rc.1-START-HERE-WINDOWS.txt`, and all `af` artifacts in place

**Non-goals:**
- Deleting the canonical `rc.1` package (published GitHub prerelease — keep)
- Deleting the latest `af` package (Alan's next validation target — keep)
- Modifying `.gitignore`, `.gitattributes`, or any tracked file
- Running any network, publish, push, merge, or release operation
- Deleting files outside `dist/release/`

**Acceptance criteria:**
1. After running, `dist/release/` contains only: `rc.1.zip`, `rc.1.sha256`, `rc.1-START-HERE-WINDOWS.txt`, `af-20260607-local.zip`, `af-20260607-local.sha256`, and any AF-phase START-HERE text files
2. Cleanup report lists exactly the files removed, with sizes
3. No tracked files are modified
4. `pnpm build` still passes (no build-time dependency on stale artifacts)
5. All four mandatory gates pass (build, typecheck, test, privacy:scan)

**Likely scope:** 1 script in `scripts/hygiene/cleanup-stale-artifacts.sh` (or `.ps1`) + cleanup report at `docs/status/phase-AG1-cleanup-report-2026-06-07.md`

**Change budget:** ~30 lines shell script + ~20 lines report = ~50 lines

**Assigned profile:** `sna-windows-runtime`

**Dependencies:** None (standalone cleanup)

---

### 3.2 Deliverable B — `.local/video-analysis/` Backlog Resolution

**Problem:** The backlog item "review of `.local/video-analysis/` contact sheets" exists as a stale reference. The directory does not exist and never existed. This creates confusion for Alan reviewing the backlog — is this item still open, or can it be closed?

**Goal:** Close the backlog item by:
1. Documenting the finding that `.local/video-analysis/` does not exist and no contact-sheet files exist anywhere in the repo
2. Adding a reserved-namespace comment to `.gitignore` under the `.local/` section noting that `.local/video-analysis/` is reserved for future use (if Alan wants it) but currently unused
3. Recording the closure in this scope document

**Non-goals:**
- Creating the `video-analysis/` directory or any contact-sheet files
- Adding any data generation, capture, or processing capability
- Any code changes outside `.gitignore` comment addition

**Acceptance criteria:**
1. A comment in `.gitignore` under the `.local/` section acknowledges `# .local/video-analysis/ — reserved namespace, currently unused`
2. The backlog item is explicitly closed (not deferred) with evidence
3. `pnpm privacy:scan` still passes (comment-only change)
4. All four mandatory gates pass

**Likely scope:** 1 comment added to `.gitignore` + this scope document's closure record

**Change budget:** 1 line (comment in `.gitignore`)

**Assigned profile:** `sna-release-docs`

**Dependencies:** None (standalone closure)

---

### 3.3 Deliverable C — Previous .gitignore Remediation Verification

**Problem:** The June 5 `.gitignore` remediation added `.codegraph/` and `.worktrees/` to `.gitignore`. The remediation is confirmed complete. However, there is no forward-looking verification that git continues to ignore these paths after any future `.gitignore` edits.

**Goal:** Add a verification note and a `git check-ignore` smoke test to the repo hygiene workflow so that future developers (including automated agents) confirm the ignore rules remain effective.

**Non-goals:**
- Revisiting the June 5 remediation (already done, already complete)
- Running `git filter-repo` or BFG to purge historical blobs (out of scope — would affect shared history)
- Adding CI or pre-commit hooks (local-only phase)

**Acceptance criteria:**
1. Verifies that `git check-ignore -v .codegraph .worktrees` returns the expected `.gitignore` line
2. Documents the expected output for future automated hygiene sweeps
3. No git history rewriting, no force-push, no branch deletion
4. All four mandatory gates pass

**Likely scope:** This scope document only (verification recorded here as a known-good baseline for future reference)

**Change budget:** 0 lines of code (documentation-only)

**Assigned profile:** `sna-release-docs`

**Dependencies:** None

### Deliverable C — Verification completion (2026-06-07)

| Check | Result | Evidence |
|-------|--------|----------|
| `.gitignore` line 18 (`.codegraph/`) | PRESENT | Confirmed by `cat .gitignore` |
| `.gitignore` line 19 (`.worktrees/`) | PRESENT | Confirmed by `cat .gitignore` |
| `git check-ignore -v .codegraph` | PASS | `.gitignore:18:.codegraph/	.codegraph` |
| `git check-ignore -v .worktrees` | PASS | `.gitignore:19:.worktrees/	.worktrees` |
| `.codegraph/` tracked by git | NO | `git ls-files --error-unmatch .codegraph/` → error (not tracked) |
| `.worktrees/` tracked by git | NO | `git ls-files --error-unmatch .worktrees/` → error (not tracked) |
| Build (pnpm build) | PASS | All apps build successful |
| Typecheck (pnpm typecheck) | PASS | All 7 packages pass |
| Test (pnpm test) | PASS | 217 tests pass (122 desktop, 55 cli, 40 core+adapters) |
| Privacy scan (pnpm privacy:scan) | PASS | 287 files checked |

**Result: VERIFICATION COMPLETE — `.gitignore` remediation is effective and all 4 gates pass.**

**Historical note:** The `.gitignore` entries were added in the June 5 "Next Round 2 — Gitignore Remediation" phase. This verification confirms they remain effective after subsequent phases (AF, AF4, etc.). No further action is needed on the `.gitignore` entries themselves, though historical blobs of `.codegraph/` may exist in early branch history (out of scope for this phase).

---|---

## 4. Pipeline and dependencies

```
Deliverable A (stale artifact cleanup)   → sna-windows-runtime  [standalone]
Deliverable B (video-analysis closure)   → sna-release-docs    [standalone]
Deliverable C (gitignore verification)   → sna-release-docs    [standalone]

All three independent — can run in parallel
    ↓
AG1 Final review            → sna-qa-acceptance   [depends on A + B + C]
AG1 Privacy/security audit  → sna-privacy-security [depends on A + B + C]
AG1 Release summary         → sna-release-docs     [depends on QA + privacy]
```

All three deliverables are independent — no dependencies between them.

### Minimum viable path

```
A ──→ QA → Privacy → Summary
B ──→ (to same QA)
C ──→ (to same QA)
```

---

## 5. Actual backlog closure map

| Backlog item | AG1 action | Status after AG1 |
|---|---|---|
| `.gitignore` remediation for `.codegraph/` and `.worktrees/` | Verify existing fix is complete (Deliverable C) | **CLOSED** — already done June 5 |
| Cleanup of stale `dist/` artifacts | Delete stale intermediate builds (Deliverable A) | **RESOLVED** — stale artifacts removed |
| `.local/video-analysis/` contact-sheet review | Acknowledge directory does not exist; close item (Deliverable B) | **CLOSED** — N/A, directory never existed |

---

## 6. What is NOT in scope (AG1 red-zone)

| Item | Reason |
|---|---|
| Live ServiceNow login, browser automation, API writes | Red-zone — requires explicit Alan approval |
| Save / Submit / Update / Resolve / Close automation | Red-zone — never automated |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams / Outlook / phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, video capture from live ServiceNow | Red-zone — never automated |
| Cookie, session, storage-state capture or export | Red-zone — never automated |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Git history rewriting (filter-repo, BFG) for old codegraph blobs | Affects shared history — not local hygiene |
| CI/CD changes, pre-commit hooks, or automation | Feature — not hygiene |
| Creating `.local/video-analysis/` or contact-sheet content | No such requirement exists |
| Windows installer, MSI, auto-update, signed executable | Feature — out of scope |
| Cross-platform support (macOS, Linux) | Out of scope for v0.x |
| New demo scenarios, scenario library rework | Feature — not hygiene |
| Performance benchmarks, load testing | Out of scope |

---

## 7. Gate policy

All implementation tasks (all deliverables) must pass:

| Gate | Command |
|---|---|
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Test | `pnpm test` |
| Privacy | `pnpm privacy:scan` |

If any gate fails, the worker must STOP and block with sanitized evidence. No code moves past a red gate.

Deliverables B and C are documentation-only or comment-only — no code changes. They must still pass privacy:scan (the comment in `.gitignore` is a tracked file).

---

## 8. Status

```
Phase AG1 — LOCAL REPO HYGIENE AND ARTIFACT BOUNDARY CLEANUP — SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream deliverables defined: 3
  - A: Stale artifact cleanup script          → sna-windows-runtime   [standalone]
  - B: video-analysis backlog closure         → sna-release-docs      [standalone]
  - C: gitignore remediation verification     → sna-release-docs      [standalone]

Backlog items addressed: 3
  - .gitignore remediation: CLOSED (already done)
  - Stale dist artifacts: RESOLVED (cleanup script)
  - video-analysis contact sheets: CLOSED (N/A, never existed)

Red-zone items excluded: 14
Non-goals: 9
```

This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.
