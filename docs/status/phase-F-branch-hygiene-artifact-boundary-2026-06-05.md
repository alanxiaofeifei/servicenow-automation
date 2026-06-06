# Phase F — Branch Hygiene and Artifact Boundary Audit

**Date**: 2026-06-05
**Branch**: `next/pr-rc-hardening-20260605`
**Parent**: `next/manual-validation-followups-20260605`
**Auditor**: sna-privacy-security
**Reviewer**: codex-gpt55-control

## Verdict: APPROVE WITH CONDITIONS

No blocking leaks. Two hygiene gaps require remediation.

---

## 1. Audit Summary

| Category | Status | Detail |
|---|---|---|
| Committed files | 196 files | All pass `pnpm privacy:scan` |
| Branch delta from parent | 0 commits | Branch is at same HEAD as parent |
| Dist/build artifacts committed | CLEAN | None committed |
| node_modules committed | CLEAN | None committed |
| .env / credentials committed | CLEAN | None found |
| Screenshots committed | CLEAN | None committed |
| .har / .trace / .webm committed | CLEAN | None committed |
| .db / .sqlite committed | CLEAN | None committed (except .codegraph — see gap) |
| ServiceNow URLs in committed docs | CLEAN | Code-only domain check, no real URLs |
| sys_id patterns in committed docs | CLEAN | None found |
| Customer emails in committed docs | CLEAN | None found |
| Demo profile data | CLEAN | All `example.invalid` domains, mock keywords |
| Untracked .local/ (14 MB) | CONTAINED | Gitignored; 32 screenshots + runtime artifacts, no real SN data |
| Untracked dist/ (227 MB) | CONTAINED | Gitignored; contains old build artifacts |
| Untracked .codegraph/ (3 MB) | GAP | Not in .gitignore |
| Untracked .worktrees/ (1.2 GB) | GAP | Not in .gitignore |

---

## 2. Evidence Reviewed

### 2.1 Committed Files (196)
- Full `git ls-files` inventory reviewed
- `pnpm privacy:scan` — **PASS** on all 196 tracked files
- Manual grep for ServiceNow URLs, sys_id, email patterns — **CLEAN**

### 2.2 Sensitive Pattern Scan (committed docs)
```
ServiceNow URLs:  0 real URLs (1 code-level domain check in service-now-environments.ts)
sys_id patterns:  0
Email patterns:   0
```

### 2.3 Artifact Boundary Check
| Artifact type | Committed? | Gitignored? | Risk |
|---|---|---|---|
| dist/ | No | Yes | LOW — contained |
| .local/ | No | Yes | LOW — contained, verified no real SN data |
| .codegraph/ | No | **No** | MEDIUM — 3MB db, could be accidentally staged |
| .worktrees/ | No | **No** | HIGH — 1.2GB, 10K files, nested repo copies |
| browser-profiles/ | No | N/A (doesn't exist) | NONE |
| node_modules/ | No | Yes | NONE |

### 2.4 .gitignore Assessment
- **Comprehensive** for all sensitive categories: dist/, build/, .local/, browser-profiles/, screenshots/, logs/, .har, .trace, .webm, .db, .sqlite, .env, credentials, OS/editor files
- **Missing**: `.codegraph/` and `.worktrees/` not covered

---

## 3. Findings

### GAP-1: `.codegraph/` not gitignored (MEDIUM)

- **Location**: `/home/alanxwsl/projects/servicenow-automation/.codegraph/`
- **Contents**: `codegraph.db` (3.0 MB SQLite database), `.gitignore`
- **Risk**: Codegraph indexing database could be accidentally `git add`'d. Contains source graph metadata — low sensitivity but not intended for version control.
- **Recommendation**: Add `.codegraph/` to `.gitignore`.

### GAP-2: `.worktrees/` not gitignored (HIGH)

- **Location**: `/home/alanxwsl/projects/servicenow-automation/.worktrees/`
- **Contents**: Full repo copies (1.2 GB, 10,348 files):
  - `hermes-b57a49bf/` — worktree with deeply nested sub-worktrees (5 levels deep)
  - `release-candidate-20260604/` — worktree with `dist/` and `node_modules/`
- **Risk**: Accidental `git add .worktrees/` would commit full repo copies including build artifacts, potentially sensitive diff fragments, and vendor code. High blast radius.
- **Recommendation**:
  1. Add `.worktrees/` to `.gitignore` immediately
  2. Consider managing worktrees via `git worktree` (which uses `.git/worktrees/` internally) rather than a project-level directory
  3. Clean up stale worktrees when branches are merged

### NOTE-1: Stale build artifacts in dist/ (LOW — informational)

- **Root dist/**: 227 MB across two release directories (`release/` and `release-issue98-main-20260528/`)
- **Worktree dist/**: Additional Windows packages in `.worktrees/release-candidate-20260604/dist/release/`
- **Status**: Properly gitignored. No action required, but cleanup recommended for disk space.

### NOTE-2: .local/ contains workflow recording contact sheets (LOW — informational)

- **Location**: `.local/video-analysis/workflow-recordings-2026-05-21/contact-sheets/`
- **Contents**: 10 JPG contact sheets extracted from screen recordings of ServiceNow workflows
- **Risk**: These images MAY contain visible ServiceNow UI with ticket metadata. They are properly gitignored but represent a local data risk.
- **Recommendation**: Review and delete if recordings are no longer needed for analysis.

---

## 4. Commands Run

```
git branch --show-current
git status --porcelain
git ls-files (full 196-file inventory)
git diff --stat next/manual-validation-followups-20260605..HEAD
git log --oneline -20
pnpm privacy:scan
git grep for ServiceNow URLs, sys_id, emails
git check-ignore for .codegraph/, .worktrees/, .local/
du -sh for storage audit
find for screenshot inventory
```

---

## 5. Required Rework

1. **[REQUIRED]** Add `.codegraph/` to `.gitignore`
2. **[REQUIRED]** Add `.worktrees/` to `.gitignore`
3. **[RECOMMENDED]** Clean up `.worktrees/release-candidate-20260604/dist/` after release
4. **[RECOMMENDED]** Review `.local/video-analysis/` contact sheets — delete if obsolete

---

## 6. Safety/Privacy Status

- **No ServiceNow data leaked in committed files** — VERIFIED
- **No credentials or secrets committed** — VERIFIED
- **No production write paths exposed** — VERIFIED
- **All local artifacts properly contained** — VERIFIED (except .codegraph/ and .worktrees/ gitignore gaps)

---

## 7. Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Accidental `git add .worktrees/` | HIGH | Add to .gitignore |
| Accidental `git add .codegraph/` | MEDIUM | Add to .gitignore |
| Contact sheets with SN UI in .local/ | LOW | Gitignored; review/delete when done |

---

## 8. Diff Scope

- **Files changed**: 1 (this report)
- **Net lines**: ~150
- **Simplicity check**: Audit-only — no code changes, report is the deliverable
- **Surgical check**: Only touched `docs/status/` — within scope

---

## 9. Suggested Next Tasks

- **Phase G**: Apply .gitignore fixes (add `.codegraph/` and `.worktrees/`)
- **Routine cleanup**: Remove stale `dist/release-issue98-main-20260528/` and old worktrees
