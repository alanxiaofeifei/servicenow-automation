# Phase AO1 — Stale Package-Archive Entries in Release Readiness Handoff Card

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AN7 base:** AN1–AN7 changes present (three-column operator workbench polish — scope → UX spec → implementation → QA acceptance → privacy/safety → package refresh → final gate)
**Profile:** `sna-orchestrator`
**Task:** `t_5252ba2e`

---

## 1. Why this phase

The AN series is complete — the three-column Operator Workbench polish passed all 7 gates (scope → UX spec → implementation → QA acceptance → privacy/safety → package refresh → final gate). The latest AN6 package at `dist/release/servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` is the current validation target.

During review of the center column content after AN7, a **stale data gap** was found in the `release-readiness-handoff-card`:

**The "Package archive" section (App.tsx lines 4208–4225) contains hardcoded archive entries that reference AE-phase packages** (`rc.1-ae-20260607 (02:00)`, `rc.1-ad-20260607 (01:32)`, etc.). These entries:

1. **Show the wrong "Latest" label** — The hardcoded list says `Latest: rc.1-ae-20260607`, but dynamic package metadata (from IPC `worktreePkgMetadata`) correctly identifies the AN6 package as current.
2. **Are never updated by the phase pipeline** — Every phase (AF, AG, AH, AI, AJ, AK, AL, AM, AN) produces a new package, but the archive list is static text that a human must manually patch.
3. **Contradict the Worktree Acceptance card** — The Worktree Acceptance Checkpoint card directly below dynamically renders the current package path/SHA256/mtime, making the hardcoded archive list both duplicate and potentially misleading.

**This phase is a focused surgical fix: remove or replace the stale hardcoded archive entries so the center column presents consistent, up-to-date information.**

---

## 2. Current state vs. target

| Area | Current state | Target state |
|------|--------------|--------------|
| `release-readiness-handoff-card` Package archive section | Hardcoded list: `Latest: rc.1-ae-20260607 (02:00)`, `Archival only: rc.1-ad-20260607 (01:32)`, etc. | No hardcoded archive entries shown. The dynamic package path/SHA256/mtime block and the Worktree Acceptance card are the single source of truth for package identity. |
| Dynamic metadata consistency | Works correctly for current package path/SHA256/mtime (lines 4185–4196) | Unchanged — already correct |
| Stale package warning (lines 4202–4204) | Refers to "AF/AG/AH packages" — out-of-date phase letters | Update to generic archive-phase wording, or remove entirely since archive demotion is handled by the repo-hygiene system |
| Redundancy with Worktree Acceptance card | Both cards show current package info — one is dynamic (worktree-accept), one has a hardcoded list (release-readiness) | Eliminate duplicate/hardcoded information; keep only the dynamic path/SHA256/mtime block and point users to Worktree Acceptance for acceptance-tracking |

---

## 3. Scope — what this phase includes

### 3.1 Remove stale hardcoded Package archive section

Remove the `div.handoff-panel` containing the hardcoded archive list (lines ~4206–4225 in App.tsx).

**Rationale:**
- The archive entries are never kept current by the phase pipeline
- The repo-hygiene/archive-demotion system provides the canonical stale-artifact view via IPC
- The Worktree Acceptance Card already shows the current package path dynamically
- Removing stale hardcoded data eliminates a source of confusion without losing information

### 3.2 Update stale package warning copy (optional, if still present after removal)

If the `handoff-stale-warning` text at line ~4202 still references specific old phase letters ("AF/AG/AH"), update it to generic wording. Example replacement:

> `Older packages are archival only. If no package is marked Latest, do not treat any package as the current test target.`

Or simply remove the warning entirely since:
- The Worktree Acceptance card handles freshness labeling
- Archive demotion keeps only the current + canonical release in `dist/release/`
- The repo-hygiene card shows stale-artifact details

### 3.3 Verify no functional regression

- The dynamic package path/SHA256/mtime metadata block (lines 4185–4196, `worktreePkgMetadata`) must remain **unchanged**
- The `Copy path`, `Copy SHA256`, `Copy summary` buttons must remain **unchanged**
- The Release Readiness Handoff card header and Quickstart checklist must remain **unchanged**
- The Worktree Acceptance card, repo hygiene card, and runtime rail must remain **unchanged**

---

## 4. Non-goals

These are explicitly **out of scope** for AO1:

- **No IPC changes** — No new IPC channels, no main-process changes. The fix is purely removing stale JSX.
- **No new components** — No new React components. Just removing a section of JSX.
- **No center column restructure** — The `release-readiness-handoff-card` stays. Only its stale archive section is removed.
- **No archive demotion changes** — The cleanup-preview / archive-demotion system is untouched.
- **No Worktree Acceptance Card changes** — That card already works correctly; no functional or copy changes.
- **No repository-hygiene system changes** — Stale-artifact tracking is already handled by AM-series changes.
- **No build/dependency changes** — Only one file changes: `apps/desktop/src/App.tsx`.
- **No behavioral changes** — No change to runtime action flow, environment settings, CDP state, verification, or autofill.
- **No file upload, PR, push, tag, release** — All work is local-only.
- **No cron job creation or modification.**
- **No reading/printing/submitting secrets, cookies, storage state, HAR, traces, screenshots, URLs, ticket IDs, sys_ids, or real field values.**

---

## 5. Change budget

| File | Change | Budget |
|------|--------|--------|
| `apps/desktop/src/App.tsx` | Remove Package archive `<div>` (~20 lines), update stale-warning copy (~2 lines) | ~25 lines removed or changed |
| `apps/desktop/src/App.test.ts` | May need test updates if tests assert on the removed archive entries | ~5 lines (if any) |
| `docs/status/phase-AO2-*-ux-spec-*.md` | UX/copy spec document (new) | < 50 lines |
| `docs/status/phase-AO3-*-implementation-*.md` | Implementation evidence document (new) | < 30 lines |

**Total estimated change budget:** < 50 lines of source changes, no new IPC, no behavioral change.

---

## 6. Safety boundaries

All operations in this phase are **local-only JSX removal/changes** in the Electron renderer:

- Archive section removal is a JSX node deletion — no network, no filesystem, no IPC
- Warning copy update is a text change only — no functional change
- No IPC channels, no main process changes, no new Electron APIs
- All changes are revertable via `git checkout`
- The dynamic `worktreePkgMetadata` block is explicitly preserved — this is the canonical source of truth
- No ServiceNow data, real URLs, credentials, or sensitive information is involved

---

## 7. Task decomposition

### AO2 — Stale Package-Archive UX/copy spec

**Goal:** Write the precise UX/copy spec for removing the stale archive entries. Define:
- Exact text changes for the stale-warning section (if kept)
- Any updated aria labels
- Acceptance wording for QA

**Assignee:** `sna-ui-designer`

**Deliverable:** `docs/status/phase-AO2-stale-package-archive-ux-spec-2026-06-07.md`

**Depends on:** AO1 (this document — completes first)

---

### AO3 — Remove stale archive entries

**Goal:** Implement the JSX removal in `apps/desktop/src/App.tsx`:
1. Remove the `div.handoff-panel` containing the hardcoded archive list
2. Update the stale-warning text (if still present) to generic wording
3. Update tests in `App.test.ts` if they assert on the removed archive entries

**Non-goals:**
- No changes to dynamic package metadata block
- No changes to Worktree Acceptance, repo hygiene, or runtime rail
- No IPC or main-process changes

**Assignee:** `sna-frontend-workbench`

**Files changed:**
- `apps/desktop/src/App.tsx` — JSX removal and copy update
- `apps/desktop/src/App.test.ts` — test assertion updates (if applicable)

**Verification:**
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — all existing tests pass
- `pnpm privacy:scan` — PASS
- Visual: Release Readiness Handoff card no longer shows hardcoded archive entries
- Visual: Dynamic package path/SHA256/mtime block is unchanged
- Visual: Worktree Acceptance card still shows current package correctly
- Visual: Copy path/SHA256/summary buttons still work

**Depends on:** AO2 (UX/copy spec complete)

---

### AO4 — QA acceptance

**Goal:** Run full build/typecheck/test/privacy:scan gates. Verify:
- All 4 gates pass
- Release Readiness card no longer shows stale hardcoded archive entries
- Dynamic package metadata block is unaffected
- Worktree Acceptance card is unaffected
- Copy path/SHA256/summary buttons still work
- No regression in existing 440+ tests
- No privacy violations

**Assignee:** `sna-qa-acceptance`

**Deliverable:** QA evidence (test output, manual acceptance notes)

**Depends on:** AO3 (implementation complete)

---

### AO5 — Privacy/safety review

**Goal:** Review the change for privacy and safety. Since the change is purely removing stale JSX text:
- Verify no new data surfaces
- Verify no real ServiceNow data leakage
- Verify no Save/Submit/Update/Resolve/Close automation introduced
- Verify `pnpm privacy:scan` passes

**Assignee:** `sna-privacy-security`

**Deliverable:** Privacy/safety sign-off

**Depends on:** AO3 (implementation complete)

---

### AO6 — Package refresh (optional)

**Goal:** If Alan wants a refreshed package after AO3, rebuild the Windows artifact. Otherwise mark as SKIP.

**Assignee:** `sna-windows-runtime`

**Deliverable:** Rebuilt `dist/release/` artifact (if needed)

**Depends on:** AO3 (implementation merged)

**Note:** Since the change is only removing ~25 lines of JSX, the existing AN6 package already contains the three-column workbench polish. A package refresh may not be needed unless a full end-to-end package is desired.

---

### AO7 — Final gate

**Goal:** Final acceptance and phase closure. Verify:
- All 4 gates: `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm privacy:scan`
- All AO4 QA findings resolved
- AO5 privacy/safety sign-off obtained
- AO6 package refresh completed (or explicitly marked SKIP)
- Phase status documented

**Assignee:** `sna-release-docs`

**Deliverable:** Phase completion record + release summary

**Depends on:** AO4, AO5, AO6 (all must complete first)

---

## 8. Dependency graph

```
AO1 ──(this document)──► AO2 ──► AO3 ◄──► AO4
                                          │
                                          ├──► AO5 ──► AO7 (final gate)
                                          │
                                          └──► AO6 ──► (rebuild artifact, optional)
```

Key:
- AO1: Scope definition (this document) — state: COMPLETE (once this document is written)
- AO2: UX/copy spec by `sna-ui-designer` — state: TODO
- AO3: Implementation by `sna-frontend-workbench` — state: TODO
- AO4: QA acceptance by `sna-qa-acceptance` — state: TODO
- AO5: Privacy/safety review by `sna-privacy-security` — state: TODO
- AO6: Package refresh by `sna-windows-runtime` — state: TODO (OPTIONAL)
- AO7: Final gate by `sna-release-docs` — state: TODO

Annotations:
- AO4 and AO5 run in parallel after AO3 — QA and privacy review are independent
- AO6 runs after AO3 (if needed) so the package reflects the change
- AO7 gates on all of AO4, AO5, AO6

---

## 9. Red-zone prohibitions (unchanged from AN phase rules)

- 不做真实 ServiceNow 登录/浏览器操作/API 写入。
- 不做 Save / Submit / Update / Resolve / Close。
- 不上传附件。
- 不写 Microsoft Graph / Excel Web。
- 不做真实 Teams/Outlook/phone ingestion。
- 不读取/打印/提交 secrets、cookie、storage state、HAR、trace、截图、真实 URL、ticket ID、sys_id、requester、assignment group、真实字段值。
- 不 push、PR、merge、tag、GitHub Release；Alan 睡觉期间只允许 local-only 工作。
- 不递归创建/修改 cron jobs。

---

## 10. Verification plan

### AO2 (UX/copy spec)
- Spec is reviewed and approved by Alan before AO3 begins

### AO3 (Implementation)
- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — all existing tests pass
- `pnpm privacy:scan` — PASS
- Visual: hardcoded archive entries removed
- Visual: stale-warning copy is either removed or updated to generic wording
- Visual: dynamic package metadata block is unchanged
- Visual: all other cards are unchanged

### AO4 (QA acceptance)
- All 4 gates pass
- Hardcoded archive removal verified
- No regression in existing behavior
- Dynamic metadata and acceptance card verified

### AO5 (Privacy/safety)
- No new privacy violations
- Safety boundary copy verified (unchanged)
- No real data exposure

### AO6 (Package refresh)
- Fresh artifact produced (or SKIP marked explicitly)
- Artifact includes AO3 changes (if refreshed)

### AO7 (Final gate)
- All upstream gates complete
- Phase status recorded
- Release summary written

---

## 11. Status

```
Phase AO1 — STALE PACKAGE-ARCHIVE ENTRIES IN RELEASE READINESS HANDOFF CARD

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Scope gap identified: 1
  - Hardcoded archive entries in release-readiness-handoff-card (App.tsx lines 4208–4225)
    reference AE-phase packages and are never updated by the phase pipeline

Downstream tasks defined: 6
  - AO2: UX/copy spec for archive section removal       → sna-ui-designer       [first, created as t_7fe7ab3d]
  - AO3: Implement archive section removal               → sna-frontend-workbench [after AO2]
  - AO4: QA acceptance                                   → sna-qa-acceptance     [after AO3]
  - AO5: Privacy/safety review                           → sna-privacy-security  [after AO3]
  - AO6: Package refresh (optional)                      → sna-windows-runtime   [after AO3]
  - AO7: Final gate                                      → sna-release-docs      [after AO4, AO5, AO6]

Red-zone items excluded: 9
Non-goals: 10

Change budget: < 50 lines of source changes, no IPC, no behavioral change
```
