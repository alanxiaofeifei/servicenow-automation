# Phase BJ1 — Stale `dist/release/` Artifact Cleanup Workflow and Archive-Demotion Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Parent scope task:** `t_4c750260`
**Verdict:** SCOPE-DEFINED — see child tasks for execution

---

## 1. Current package anchor (Alan's testable artifact)

The current manual-validation package remains the **BI6** build, confirmed by BI7 gate:

**Package name:** `servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip`

**Windows UNC path (paste into File Explorer):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip
```

**Linux path:**
```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip
```

### Package facts

| Property | Value |
|---|---|
| Size | 118,607,822 bytes (113 MB) |
| SHA-256 | `b794dee068bf79c7310820d2a60e61fe504003489e5c7410bcdd12b8734cbc21` |
| Sidecar | `servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip.sha256` — PASS |
| START-HERE | `...-bi6-20260607-local-START-HERE-WINDOWS.txt` — correct references |
| CURRENT.txt | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip` — correct |

---

## 2. Current state — `dist/release/` inventory (as of BI7, 2026-06-07)

### Freshness ordering (newest first)

| # | Package | Keep/Stale |
|---|---------|------------|
| 1 | `...-bi6-20260607-local.zip` + sha256 + START-HERE | **KEEP** — current BI6 package |
| 2 | `...-bh6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 3 | `...-bg6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 4 | `...-bf6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 5 | `...-be6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 6 | `...-bd6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 7 | `...-bc6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 8 | `...-bb6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 9 | `...-ba6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 10 | `...-az6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |
| 11 | `...-ay6-20260607-local.zip` + sha256 + START-HERE | **STALE** — superseded |

### Summary

| Category | Count | Files |
|---|---|---|
| **Current** (bi6) | 1 build set | 3 files (zip + sha256 + START-HERE) |
| **Stale** (bh6 → ay6) | 10 build sets | 30 files |
| **Total in dist/release/** | 11 build sets | 33 files |
| **Estimated stale size** | ~1,130 MB (10 × ~113 MB) |

### .release-archive/ status

The archive directory already exists at `dist/.release-archive/` with a single `aq6/` subdirectory containing archived build sets from the AQ6 cleanup cycle (at6–ax6). This directory is gitignored via the existing `dist/` ignore rules.

---

## 3. Gap analysis

### Gap 1 — No cleanup workflow with archive-demotion

The previous AG1 implementation used deletion (`rm -rf`). The AM1 phase implemented archive-demotion via IPC, but that implementation covered the AL-era stale set (af–ak, canonical). After 10 subsequent pipeline phases (ay6 → bi6), the current stale set has grown to 30 files with NO archive-demotion performed.

The IPC handlers (`sda:cleanup-preview`, `sda:cleanup-execute`) exist from AM3 but the stale set has changed completely — the handlers need their stale-detection logic refreshed for the BI-era naming pattern.

### Gap 2 — Hygiene scan stale-detection patterns may be stale

The hygiene scan uses `zipFiles.slice(1)` which considers everything except the newest ZIP as stale. This worked for the AL-era scan but needs verification against the current BI-era file naming convention.

### Gap 3 — No UX surface for archive-demotion in current release handoff card

The release readiness handoff card shows "Stale dist/release/ artifacts" status but does not offer a visible "Archive stale artifacts" action that Alan can invoke. The previous AM2 UX spec was written for AL-era layouts.

### Gap 4 — Cumulative stale weight

30 stale files = ~1,130 MB of unreferenced local build output. Every future pipeline refresh adds another 3-file ~113 MB set. Without workflow, this grows unbounded.

---

## 4. Scope — what BJ1 defines

### Deliverable A — This scope document

Documents the current inventory, gaps, safety boundaries, and the BJ2–BJ7 downstream chain.

### Deliverable B — BJ2–BJ7 child tasks

| Task | Title | Assignee | Depends on |
|------|-------|----------|------------|
| **BJ2** | UX/copy spec — stale dist/release/ cleanup workflow and archive-demotion for BI-era stale set | sna-ui-designer | BJ1 |
| **BJ3** | Implementation — refresh stale-detection patterns, wire archive-demotion IPC for BI-era | sna-frontend-workbench | BJ2 |
| **BJ4** | QA acceptance + Alan manual checklist | sna-qa-acceptance | BJ3 |
| **BJ5** | Privacy/security audit | sna-privacy-security | BJ3 |
| **BJ6** | Windows local package refresh (fresh BJ-dated package) | sna-windows-runtime | BJ4 + BJ5 |
| **BJ7** | Final local readiness gate | codex-gpt55-control | BJ6 |

### Dependency graph

```
BJ1 ──→ BJ2 ──→ BJ3 ──→ BJ4 ──┐
                         │     ├──→ BJ6 ──→ BJ7
                         └──→ BJ5 ──┘
```

### Non-goals

| Item | Reason |
|------|--------|
| Adding new center-workspace cards | Out of scope — only cleanup workflow |
| Live ServiceNow login, browsing, API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Attachment upload | Red-zone — out of scope |
| No push, PR, merge, tag, GitHub Release, publish, or cron changes | Requires explicit Alan approval |
| No modification of historical status docs | They are archival records |
| Trash/recycle bin integration | Over-engineering — archive dir is simpler |
| Changes outside dist/ directory tree | Scope is local artifact cleanup only |

---

## 5. Design proposal — archive-demotion workflow (refreshed for BI-era)

### Overview

Reuse the AM3 IPC infrastructure (`sda:cleanup-preview`, `sda:cleanup-execute`) but update the stale-detection logic for the BI-era naming pattern (`-<phase>-20260607-`).

### Keep set logic

```
KEEP: current package (newest dated ZIP in dist/release/) — bi6
STALE: everything else matching `*-local.zip` pattern except current
ARCHIVE DESTINATION: dist/.release-archive/BI-<phase>/
```

**Note:** There is no separate canonical `v0.1.0-rc.1.zip` in the current dist/release/ — it was archived during earlier cleanup cycles. The keep set is simply: the current package (newest dated ZIP, per CURRENT.txt or mtime).

### User-visible flow

1. Alan opens the hygiene card / release readiness handoff card.
2. "Stale dist/release/ artifacts" shows **Pending** with count & size.
3. Alan selects the stale item. The right action rail shows "Cleanup preview" (enabled).
4. "Cleanup preview" calls IPC handler returning dry-run listing.
5. "Archive stale artifacts" button appears below preview when stale artifacts exist.
6. Confirmation dialog: "Archive [N] stale packages ([N] MB) to dist/.release-archive/? This preserves files for recovery."
7. Alan confirms → IPC moves files → toast: "Archived [N] stale packages."
8. Scan refreshes → stale count = 0.

### Archive directory structure

```
dist/.release-archive/
  ↳ aq6/                          (existing — from AQ6 cycle)
  ↳ BJ-bh6-20260607/
      ↳ ...bh6-20260607-local.zip
      ↳ ...bh6-20260607-local.zip.sha256
      ↳ ...bh6-20260607-local-START-HERE-WINDOWS.txt
  ↳ BJ-bg6-20260607/
      ↳ ...
  ↳ BJ-bf6-20260607/
      ↳ ...
  ... (7 more stale phases)
```

### Hygiene scan changes

- Stale detection: list all ZIPS in dist/release/, exclude newest (current), exclude any non-zip marker files.
- Add archive-directory awareness: check dist/.release-archive/ existence and count archived phases but do NOT count them as stale.

---

## 6. Implementation guidance for BJ3

### What to change

**1. `apps/desktop/electron/worktree-ipc.ts` — update stale-detection logic**

The `handleHygieneScan` function needs its stale-detection refreshed:
- Keep the current `zipFiles.slice(1)` approach but verify it works with BI-era naming.
- Ensure the scan recognizes dist/.release-archive/ and reports archived count separately.

**2. `apps/desktop/electron/main.ts` — verify IPC handlers registered**

`sda:cleanup-preview` and `sda:cleanup-execute` should already be registered from AM3. Verify they still work with the current stale set.

**3. `apps/desktop/electron/preload.ts` — verify bridge methods**

`cleanupPreview` and `cleanupExecute` should already be exposed. Verify.

**4. `apps/desktop/src/App.tsx` — verify cleanup UI wiring**

The "Archive stale artifacts" button, confirmation dialog, and post-cleanup state update should already exist. Verify they still work with the current stale set.

### Scope of changes

| File | Expected change | Reason |
|------|----------------|--------|
| `apps/desktop/electron/worktree-ipc.ts` | Update stale-detection patterns if needed | Current stale set differs from AM3 era |
| `apps/desktop/src/App.tsx` | Verify existing UI wiring still functional | No major changes expected |
| `apps/desktop/src/App.test.ts` | Update tests if stale-detection logic changed | Test coverage |

This is expected to be a **smaller change budget** than AM3 (1–3 files) because the IPC infrastructure already exists. The primary work is verifying the stale-detection logic works with the current file naming and date patterns.

---

## 7. Safety boundary

- No live ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified
- Archive-demotion only — no deletion path
- Archive directory `dist/.release-archive/` is gitignored
- IPC handlers must NOT accept user-supplied paths — only internally computed project root
- If a file rename fails, the handler logs the error, skips the file, and continues — no cascade failure

---

## 8. Gate policy

| Gate | Required for | Rationale |
|------|-------------|-----------|
| `pnpm build` | BJ3, BJ6 | Must confirm changes compile |
| `pnpm typecheck` | BJ3 | TypeScript safety after any logic changes |
| `pnpm test` | BJ3, BJ4 | Tests must verify stale detection and archive behavior |
| `pnpm privacy:scan` | BJ5 | No leaks in IPC handlers or confirmation dialog copy |
| `sha256sum -c` | BJ6 | Package integrity after fresh build |

BJ1 (this doc) and BJ2 (UX spec) are document-only — no code gates required.

---

## 9. Acceptance criteria

### BJ1 (this task) completion

- [x] Scope document written: `docs/status/phase-BJ1-stale-dist-release-cleanup-workflow-and-archive-demotion-scope-2026-06-07.md`
- [x] Current dist/release/ inventory documented (11 sets, 33 files, 10 stale)
- [x] Gap analysis: stale-detection patterns, no archive-demotion performed for BI-era, cumulative stale weight
- [x] BJ2–BJ7 pipeline defined with dependency graph
- [x] Safety boundaries documented
- [x] No false promise of live ServiceNow or production action in scope
- [x] Implementation guidance scoped for BJ3 (expected smaller change budget)

### BJ2 — UX/copy spec acceptance criteria

- [ ] Updated copy for the BI-era stale set (bh6 → ay6 phase names)
- [ ] Verify existing archive-demotion UX copy is still correct
- [ ] Decision: whether to show archive path in confirmation dialog
- [ ] Local-only boundary copy verified (no green/red buttons that imply release)

### BJ3 — Implementation acceptance criteria

- [ ] `Cleanup preview` returns dry-run listing for current BI-era stale set
- [ ] `Archive stale artifacts` button visible when stale artifacts exist
- [ ] Confirmation dialog shows exact stale file count and size
- [ ] Archive-demotion: files move to `dist/.release-archive/BJ-<phase>/`
- [ ] Post-cleanup hygiene scan shows "No stale artifacts" (stale count = 0)
- [ ] Hygiene scan references archive directory separately (not stale)
- [ ] All error cases handled with user-visible messages
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm privacy:scan` passes

### BJ4 — QA acceptance criteria

- [ ] All 4 gates pass
- [ ] Archive-demotion works on current BI-era stale set
- [ ] Confirmation dialog content matches spec
- [ ] Post-cleanup state: dist/release/ has 3 files (current bi6 set only), archive has the rest
- [ ] Alan manual checklist provided

### BJ5 — Privacy/security audit criteria

- [ ] No sensitive data in IPC handlers or confirmation dialog content
- [ ] No stale phase labels in user-visible copy that expose internal conventions
- [ ] No ServiceNow identifiers, URLs, ticket IDs, or real field values
- [ ] Archive directory is gitignored (verified)
- [ ] Handler does not accept user-supplied paths
- [ ] Approval (APPROVE) or block (BLOCKED) with sanitized evidence

### BJ6 — Package refresh criteria

- [ ] Fresh BJ-dated zip is newest in dist/release/
- [ ] SHA256 checksum verified
- [ ] Archive integrity verified (expected entries present, no forbidden markers)
- [ ] CURRENT.txt updated to BJ-package

### BJ7 — Final gate criteria

- [ ] Recommendation: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED
- [ ] All 4 gates pass + checksum OK
- [ ] No release/push/merge authorization

---

## 10. Freshness ordering (as of BI7)

| mtime | Filename | Status |
|-------|----------|--------|
| Latest | `...bi6-20260607-local.zip` | **CURRENT — BI6** |
| ↓ | `...bh6-20260607-local.zip` | **→ to archive** |
| ↓ | `...bg6-20260607-local.zip` | **→ to archive** |
| ↓ | `...bf6-20260607-local.zip` | **→ to archive** |
| ↓ | `...be6-20260607-local.zip` | **→ to archive** |
| ↓ | `...bd6-20260607-local.zip` | **→ to archive** |
| ↓ | `...bc6-20260607-local.zip` | **→ to archive** |
| ↓ | `...bb6-20260607-local.zip` | **→ to archive** |
| ↓ | `...ba6-20260607-local.zip` | **→ to archive** |
| ↓ | `...az6-20260607-local.zip` | **→ to archive** |
| ↓ | `...ay6-20260607-local.zip` | **→ to archive** |

The BJ6 package refresh will produce a fresh BJ-dated package after cleanup.

---

## 11. Status

```
Phase BJ1 — STALE DIST/RELEASE/ ARTIFACT CLEANUP WORKFLOW AND ARCHIVE-DEMOTION SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream tasks to be created: 6
  - BJ2: UX/copy spec — stale dist/release/ cleanup workflow and archive-demotion  → sna-ui-designer
  - BJ3: Implementation — refresh stale-detection and archive-demotion for BI-era   → sna-frontend-workbench
  - BJ4: QA acceptance + Alan manual checklist                                       → sna-qa-acceptance
  - BJ5: Privacy/security audit                                                       → sna-privacy-security
  - BJ6: Windows local package refresh                                                → sna-windows-runtime
  - BJ7: Final local readiness gate                                                   → codex-gpt55-control

Current state:
  - 11 build sets in dist/release (33 files)
  - 10 stale sets (30 files, ~1,130 MB) — bh6 through ay6
  - .release-archive/ exists with aq6-phase content
  - IPC handlers exist from AM3 but stale-detection patterns need verification
  - CURRENT.txt correctly points to bi6

Red-zone items excluded: 10
Non-goals: 7
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
