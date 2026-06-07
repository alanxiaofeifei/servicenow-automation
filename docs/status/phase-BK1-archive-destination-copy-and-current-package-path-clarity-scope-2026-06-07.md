# Phase BK1 — Archive-Destination Copy and Current-Package Path Clarity: Scope

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Parent scope task:** `t_99ed3151`
**Verdict:** SCOPE-DEFINED — see child tasks for execution

---

## 1. Current package anchor (Alan's testable artifact)

The current manual-validation package is the **BJ6** build, confirmed by BJ7 gate:

**Package name:** `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`

**Windows UNC path (paste into File Explorer):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip
```

**Linux path:**
```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip
```

### Package facts

| Property | Value |
|---|---|
| Size | 122,804,368 bytes (~117 MiB) |
| SHA-256 | `336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e` |
| Sidecar | `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip.sha256` — PASS |
| START-HERE | `...bj6-20260607-local-START-HERE-WINDOWS.txt` — correct references |
| CURRENT.txt | `CURRENT=...bj6-20260607-local.zip` — correct |

**Archive-demotion status (post-BJ7):**

`dist/.release-archive/` contains 11 BJ-prefixed phase directories:
`BJ-ay6`, `BJ-az6`, `BJ-ba6`, `BJ-bb6`, `BJ-bc6`, `BJ-bd6`, `BJ-be6`, `BJ-bf6`, `BJ-bg6`, `BJ-bh6`, `BJ-bi6`

The BJ6 current package set remains in `dist/release/`. No further archive-demotion needed.

---

## 2. Gap analysis

### Gap 1 — Copy mismatch: renderer says `<phase>` but implementation says `BJ-<phase>`

The IPC implementation (`apps/desktop/electron/worktree-ipc.ts`) writes the authentic archive destination as `dist/.release-archive/BJ-<phase>/` (lines 435–438). The renderer (`apps/desktop/src/App.tsx`) displays it in 6 places as `dist/.release-archive/<phase>/`.

**Renderer occurrences in App.tsx:**

| Line | Context | Current copy |
|------|---------|-------------|
| 4582 | Stale files listing (confirmation detail) | `Archive destination: <code>dist/.release-archive/&lt;phase&gt;/</code>` |
| 4612 | Second stale set detail | `Archive destination: <code>dist/.release-archive/&lt;phase&gt;/</code>` |
| 4672 | Archive reminder in hygiene card | `Moves stale files locally into <code>dist/.release-archive/&lt;phase&gt;/</code>` |
| 4684 | Hygiene card footer | `Stale files move locally to dist/.release-archive/&lt;phase&gt;/` |
| 4693 | Confirmation dialog | `Archive destination: <code>dist/.release-archive/&lt;phase&gt;/</code>` |

These should say `dist/.release-archive/BJ-<phase>/` to match the actual archive directory naming. The `BJ-` prefix disambiguates BJ-era archive directories from the older `aq6/` era.

**IPC implementation (correct — reference):**

```typescript
// worktree-ipc.ts line 435–438
/**
 * Handler for sda:cleanup-execute.
 * Moves stale files from dist/release/ to dist/.release-archive/BJ-<phase>/.
 * Uses BJ-<phase> naming to avoid clashing with older aq6-era archive
 * directories. Only renames — no copy, no delete.
 */
```

**BJ1 design doc (already updated — reference):**

The BJ1 scope doc correctly uses `dist/.release-archive/BJ-<phase>/` in its archive directory structure diagram (line 271). This is the correct reference. The renderer copy is the only stale surface.

### Gap 2 — No dedicated handoff surface for the exact UNC path

The BJ7 gate doc contains the full package path, but the handoff to Alan should **start with** the exact Windows UNC path as the first thing he sees, before any gates, checks, or prose. Currently the UNC path is embedded inside sections rather than being the anchor.

### Gap 3 — Archive-destination label should be verifiable at a glance

During manual validation, Alan should be able to open the app, trigger the stale-artifact cleanup preview or confirmation dialog, and verify the archive destination says `BJ-<phase>` not just `<phase>`. This is a visual verification item for the QA checklist.

---

## 3. Scope — what BK includes

### Deliverable A — This scope document

Documents the copy mismatch, current gap, and BK2–BK7 downstream chain.

### Deliverable B — BK2–BK7 child tasks

| Task | Title | Assignee | Depends on |
|------|-------|----------|------------|
| **BK2** | UX/copy spec — archive-destination `<phase>` → `BJ-<phase>` and handoff copy clarity | `sna-ui-designer` | BK1 |
| **BK3** | Implementation — update renderer copy from `<phase>` to `BJ-<phase>` in App.tsx | `sna-frontend-workbench` | BK2 |
| **BK4** | QA acceptance + Alan manual checklist — verify exact UNC path, archive-destination copy match | `sna-qa-acceptance` | BK3 |
| **BK5** | Privacy/security audit — verify no leaks in updated copy | `sna-privacy-security` | BK3 |
| **BK6** | Windows local package refresh (fresh BK-dated package) | `sna-windows-runtime` | BK4 + BK5 |
| **BK7** | Final local readiness gate | `codex-gpt55-control` | BK6 |

### Dependency graph

```
BK1 ──→ BK2 ──→ BK3 ──→ BK4 ──┐
                         │     ├──→ BK6 ──→ BK7
                         └──→ BK5 ──┘
```

### Non-goals

| Item | Reason |
|---|---|
| Live ServiceNow login, browsing, API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Attachment upload | Red-zone — out of scope |
| No push, PR, merge, tag, GitHub Release, publish, or cron changes | Requires explicit Alan approval |
| No modification of historical status docs | They are archival records |
| No new archive-demotion or stale-detection logic changes | Functional correctness already verified in BJ7 |
| No changes outside `apps/desktop/src/App.tsx` and test files | Scope is copy-only |
| No `worktree-ipc.ts` changes | IPC implementation is already correct |
| No rebuild of stale-cleanup workflow | Already working per BJ7 |

---

## 4. Design guidance — copy change scope

### What changes

**File: `apps/desktop/src/App.tsx`**

Replace `dist/.release-archive/<phase>/` with `dist/.release-archive/BJ-<phase>/` in all 5 renderer locations:

| Line | Current text | Replaced text |
|------|-------------|---------------|
| 4582 | `dist/.release-archive/&lt;phase&gt;/` | `dist/.release-archive/BJ-&lt;phase&gt;/` |
| 4612 | `dist/.release-archive/&lt;phase&gt;/` | `dist/.release-archive/BJ-&lt;phase&gt;/` |
| 4672 | `dist/.release-archive/&lt;phase&gt;/` | `dist/.release-archive/BJ-&lt;phase&gt;/` |
| 4684 | `dist/.release-archive/&lt;phase&gt;/` | `dist/.release-archive/BJ-&lt;phase&gt;/` |
| 4693 | `dist/.release-archive/&lt;phase&gt;/` | `dist/.release-archive/BJ-&lt;phase&gt;/` |

**No other files should change** unless tests reference the copy text.

### Why `BJ-` prefix?

The `BJ-` prefix distinguishes BJ-era archived phases (BJ-ay6 through BJ-bi6) from the older non-prefixed `aq6/` archive directory that was created during the AQ6 cleanup cycle. The prefix matches the actual naming convention implemented in `worktree-ipc.ts` and documented in the BJ1 design document.

### When to re-alphabet

The `BJ-` prefix is tied to the current phase letter. After the BK phase completes, the next phase will archive under `BK-<phase>/`. If the renderer copy used a generic placeholder, it would need updating every phase. To avoid this, the copy says `BJ-<phase>/` as a concrete example of the naming convention — it matches what the user will actually see when they open the archive directory after the BK-phase cleanup runs.

---

## 5. Surface audit — what needs verification after BK2

### 5.1 Surfaces that are already correct (no change)

| Surface | Current label | Status |
|---|---|---|
| `worktree-ipc.ts` lines 435–438 | `BJ-<phase>` | ✅ Correct — IPC already writes BJ-prefixed |
| `docs/status/phase-BJ1-stale-dist-release-cleanup-workflow-and-archive-demotion-scope-2026-06-07.md` line 271 | `BJ-<phase>` | ✅ Correct — design doc matches implementation |
| `dist/.release-archive/` actual directories | `BJ-ay6` through `BJ-bi6` | ✅ Correct — actual directories are BJ-prefixed |

### 5.2 Stale surfaces (need BK3 fix)

| Surface | Current label | Stale? | Lines affected |
|---|---|---|---|
| `apps/desktop/src/App.tsx` | `<phase>` (no `BJ-` prefix) | **STALE** | 5 occurrences: 4582, 4612, 4672, 4684, 4693 |

### 5.3 Test surfaces (need BK3 verification)

| Surface | Current label | Status |
|---|---|---|
| `apps/desktop/src/App.test.tsx` — any test that references archive destination copy | Unknown | **Must check** — if any test intercepts the copy text, update the expected value |

---

## 6. Safety boundaries

- No live ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified
- Copy change only — no logic, no IPC, no new features
- The `BJ-` prefix will need updating when the phase letter advances beyond `BJ` — this is acceptable because the next archive cycle will produce `BK-<phase>` directories anyway. The BK2 UX spec can decide whether to introduce a dynamic variable or keep the hardcoded prefix.

---

## 7. Gate policy

| Gate | Required for | Rationale |
|---|---|---|
| `pnpm build` | BK3, BK6 | Must confirm changes compile |
| `pnpm typecheck` | BK3 | TypeScript safety after any text changes |
| `pnpm test` | BK3, BK4 | Tests must pass with updated copy |
| `pnpm privacy:scan` | BK5 | No leaks in updated copy |
| `sha256sum -c` | BK6 | Package integrity after fresh build |

BK1 (this doc) and BK2 (UX spec) are document-only — no code gates required.

---

## 8. Acceptance criteria

### BK1 (this task) completion

- [x] Scope document written: `docs/status/phase-BK1-archive-destination-copy-and-current-package-path-clarity-scope-2026-06-07.md`
- [x] Current package path (BJ6) documented with UNC/Linux paths and SHA-256
- [x] Copy mismatch documented: renderer `<phase>` → should be `BJ-<phase>` (5 locations)
- [x] BK2–BK7 pipeline defined with dependency graph
- [x] Safety boundaries documented
- [x] No false promise of live ServiceNow or production action in scope
- [x] Explicit non-goals: no IPC changes, no archive-demotion logic changes, no deletion

### BK2 — UX/copy spec acceptance criteria

- [ ] Updated copy for archive-destination: `<phase>` → `BJ-<phase>` across all 5 renderer locations
- [ ] Decision: hardcoded `BJ-` vs dynamic phase-letter variable
- [ ] Handoff copy: the exact UNC path appears first in the release readiness handoff
- [ ] Empty/loading/error states for path metadata and cleanup preview verified
- [ ] Local-only boundary copy verified (no green/red buttons that imply release)

### BK3 — Implementation acceptance criteria

- [ ] All 5 renderer locations in App.tsx updated: `<phase>` → `BJ-<phase>`
- [ ] Tests pass (no regressions from copy change)
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] No other files changed unless tests reference archive-destination copy

### BK4 — QA acceptance criteria

- [ ] All 3 gates pass (build, typecheck, test)
- [ ] Exact UNC path verified in handoff
- [ ] Archive-destination copy in rendered app matches `BJ-<phase>` (not `<phase>`)
- [ ] Alan manual checklist provided
- [ ] Visual verification item: "Open app → trigger stale-artifact preview → confirm archive destination shows BJ-<phase>"

### BK5 — Privacy/security audit criteria

- [ ] No sensitive data in updated copy
- [ ] No ServiceNow identifiers, URLs, ticket IDs, or real field values in copy
- [ ] The `BJ-<phase>` pattern does not leak internal conventions (acceptable — phase letter is an internal convention already visible in package names)
- [ ] Approval (APPROVE) or block (BLOCKED) with sanitized evidence

### BK6 — Package refresh criteria

- [ ] Fresh BK-dated zip is newest in dist/release/
- [ ] SHA256 checksum verified
- [ ] Archive integrity verified (expected entries present, no forbidden markers)
- [ ] CURRENT.txt updated to BK-package

### BK7 — Final gate criteria

- [ ] Recommendation: READY-FOR-MANUAL-VALIDATION-ONLY or BLOCKED
- [ ] All 4 gates pass + checksum OK
- [ ] No release/push/merge authorization

---

## 9. Freshness ordering (as of BJ7)

| mtime | Filename | Status |
|---|---|---|
| Latest | `...bj6-20260607-local.zip` | **CURRENT — BJ6** |
| Archive | `...bi6-20260607-local.zip` | **→ archived under BJ-bi6/** |
| Archive | `...bh6-20260607-local.zip` | **→ archived under BJ-bh6/** |
| ... | (9 more stale phases in archive) | |

The BK6 package refresh will produce a fresh BK-dated package after implementation.

---

## 10. Status

```
Phase BK1 — ARCHIVE-DESTINATION COPY AND CURRENT-PACKAGE PATH CLARITY — SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream tasks to be created: 6
  - BK2: UX/copy spec — `<phase>` → `BJ-<phase>` and handoff clarity      → sna-ui-designer
  - BK3: Implementation — update renderer copy in App.tsx (5 locations)    → sna-frontend-workbench
  - BK4: QA acceptance + Alan manual checklist                             → sna-qa-acceptance
  - BK5: Privacy/security audit                                            → sna-privacy-security
  - BK6: Windows local package refresh                                     → sna-windows-runtime
  - BK7: Final local readiness gate                                        → codex-gpt55-control

Current state:
  - Current package: bj6 (confirmed by BJ7)
  - Copy mismatch: 5 locations in App.tsx say `<phase>` → should say `BJ-<phase>`
  - No IPC changes needed
  - No archive-demotion logic changes needed
  - All gates pass on BJ6 baseline

Red-zone items excluded: 8
Non-goals: 6
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*
