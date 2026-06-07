# Phase AJ1 — Current Local Package Path Clarity and Stale-Label Cleanup Scope

**Date:** 2026-06-07 05:00 CST (+0800)
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-orchestrator`
**Task:** `t_c8acd3dc`
**AI7 base:** All AI1–AI7 changes present (dynamic metadata, local-only IPC wiring, QA actions, package refresh, final readiness gate)

---

## 1. Why this phase — the current package path must be unambiguous

### Current signal

AI7 (Final Local Readiness Gate for AI6, `t_...`, 2026-06-07 04:45 CST) returned **READY-FOR-MANUAL-VALIDATION-ONLY** with one non-blocking caveat:

> One non-blocking wording caveat remains: the queue label at `apps/desktop/src/App.tsx` line 4301 still says "AG local Windows package" even though the package metadata/path displayed and copied are dynamic and resolve to the AI6 zip verified in this gate.

### Investigation finding — the code is already clean

Reading the current `apps/desktop/src/App.tsx` at line 4301 reveals:

```
<strong>Current local Windows package</strong>
```

The label is **already generic** — it says "Current local Windows package" not "AG local Windows package." The dynamic package path via `worktreePkgMetadata` reads the newest zip in `dist/release/`. The AI implementation phases (AI1–AI6) already updated the hardcoded phase label to a dynamic/generic one.

**Conclusion:** The AI7 gate's caveat was based on a stale read or line-number shift. The code is clean.

### Remaining cleanup surface

While the code is clean, the following docs and handoff surfaces still reference the AG/AF/AH package paths as if they were current:

| File | Stale reference | Context |
|------|----------------|---------|
| `docs/status/phase-AH1-acceptance-decision-template-2026-06-07.md` | `ag-20260607-local.zip` | Decision template — historical, but should note archival status for AJ scope |
| `docs/status/phase-AH1-post-acceptance-next-phase-2026-06-07.md` | `ag-20260607-local.zip` | Post-acceptance handoff — historical, archival |
| `docs/status/phase-AH2-worktree-acceptance-ux-spec-2026-06-07.md` | `ag-20260607-local.zip` | UX spec wireframe — historical, archival |
| `docs/status/phase-AH1-worktree-acceptance-scope-2026-06-07.md` | `ag-20260607-local.zip` | Scope definition — historical, archival |

These are **historical records** — they correctly document what was current at the AH/AG phase. They should not be modified except to add archival disclaimer notes if they are referenced as authoritative sources by downstream workers.

The AI-phase docs (AI1–AI7) already reference the correct AI6 package path:

- `phase-AI6-windows-local-package-refresh-2026-06-07.md` — correctly lists AI6 as current, AG as stale
- `phase-AI7-final-local-readiness-gate-2026-06-07.md` — correctly references AI6 zip with full SHA256

**The real gap is not a code bug — it's copy/guidance consistency across the handoff chain.** New scope docs (this AJ series) must point to the AI6 package, and older AG/AF/AH aliases must be unambiguously archival in any new guidance surface.

---

## 2. Exact current Windows package path

The current local Windows package Alan should test today:

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip
```

| Property | Value |
|----------|-------|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` |
| **SHA256** | `aafd1b42cbd29aee5337ac011c621d68a97d6d64c34175b47f87ea4947d054ad` |
| **Size** | 118,600,763 bytes |
| **mtime** | 2026-06-07 04:38:42 CST (epoch 1780778322) |
| **Freshness rank** | #1 of 5 in `dist/release/` (newest dated) |
| **Checksum file** | `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip.sha256` |
| **Safety copy** | `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local-START-HERE-WINDOWS.txt` |

### Archival aliases — do not use as current guidance

These older packages are **archival only** and should not be referenced as current in new docs, handoff text, or package-path guidance:

| Package | Phase | mtime | Status |
|---------|-------|-------|--------|
| `...-rc.1-af-20260607-local.zip` | AF | 2026-06-07 01:39 CST | **Archival** — superseded |
| `...-rc.1-ag-20260607-local.zip` | AG | 2026-06-07 03:36 CST | **Archival** — superseded |
| `...-rc.1-ah-20260607-local.zip` | AH | 2026-06-07 03:59 CST | **Archival** — superseded |
| `...-rc.1-ai6-20260607-local.zip` | AI6 | 2026-06-07 04:38 CST | **CURRENT** |

Only the **AI6 zip** should be referenced as the current local Windows package for manual validation.

---

## 3. Scope — what AJ1 defines

### Deliverable A — This scope document

Defines the current package path, archival aliases, and the AJ2–AJ7 task chain.

### Deliverable B — AJ2–AJ7 task chain

| Task | Title | Assignee | Description |
|------|-------|----------|-------------|
| **AJ2** | UX/copy spec — normalize package-path references | `sna-ui-designer` | Survey the worktree-acceptance surface, handoff docs, and decision templates for any remaining stale AG/AF/AH phase labels. Define a copy spec that references the AI6 package or uses generic dynamic labels. |
| **AJ3** | Implementation — apply copy updates | `sna-frontend-workbench` | Apply the AJ2 copy spec: update any stale phase labels in App.tsx, App.test.ts, handoff prompt text, or decision templates. No functional changes — copy only. |
| **AJ4** | QA acceptance + Alan manual checklist | `sna-qa-acceptance` | Manual checklist for Alan to verify: (1) no stale AG/AF/AH labels remain in the worktree-acceptance UI, (2) copy actions produce correct AI6 filenames, (3) handoff text references current package. |
| **AJ5** | Privacy/security audit | `sna-privacy-security` | Audit the updated copy for any leaked phase identifiers, package paths, or stale references. Ensure no real ServiceNow identifiers appear. |
| **AJ6** | Windows local package refresh | `sna-windows-runtime` | Rebuild the Windows local package after AJ3 changes are merged. Verify the new zip reflects the current AI6-or-later phase label. |
| **AJ7** | Final local readiness gate | `sna-release-docs` | Run build/typecheck/test/privacy:scan gates. Verify the package path in the new artifact is correct and no stale labels remain. |

### Dependencies

```
AJ1 ──→ AJ2 ──→ AJ3 ──→ AJ4 ──→ AJ5 ──→ AJ6 ──→ AJ7
                                        ↗
                              (AJ5 must pass before AJ6)
```

AJ2 (spec) and AJ4 (QA) can share some investigation, but AJ3 (implementation) depends on AJ2 (spec). AJ5 (privacy) gates AJ6 (package rebuild) — do not rebuild the package until privacy approves the copy changes.

---

## 4. Non-goals

| Item | Reason |
|------|--------|
| Code logic changes (IPC, wiring, state management) | Out of scope — copy/labels only |
| Real ServiceNow login, browsing, API writes | Red-zone — never automated |
| Save/Submit/Update/Resolve/Close automation | Red-zone — never automated |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams/Outlook/phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, cookies, storage-state, secrets | Red-zone — never captured |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Modifying historical AG/AH/AF status docs | They are archival records — do not alter |
| New feature design or implementation | Out of scope — copy cleanup only |
| Windows packaging toolchain changes | Out of scope — package refresh only (AJ6) |
| Chromium provisioning, startup diagnostics, three-column layout redesign | Separate P0 recovery thread (not AJ) |

---

## 5. Safety boundary

- No real ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close
- No attachment upload
- No Microsoft Graph / Excel Web writes
- No real Teams/Outlook/phone ingestion
- No screenshots, HAR, trace, cookies, storage-state, secrets, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- All historical docs remain unmodified — only new AJ-phase docs and the updated UI surface are in scope
- AJ3 implementation is copy-only — no state logic, IPC, or functional changes

---

## 6. Gate policy

| Gate | Required? | Rationale |
|------|-----------|-----------|
| `pnpm build` | YES (for AJ3, AJ6) | Must confirm copy changes compile |
| `pnpm typecheck` | YES (for AJ3) | Must confirm TypeScript type safety after edits |
| `pnpm test` | YES (for AJ3) | Tests may need updating if labels changed |
| `pnpm privacy:scan` | YES (for AJ5) | Docs and copy must not leak stale phase identifiers or real data |

AJ1 (this doc) and AJ2 (UX spec) are document-only — no code gates required.

---

## 7. Status

```
Phase AJ1 — CURRENT LOCAL PACKAGE PATH CLARITY AND STALE-LABEL CLEANUP SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Backlog items addressed: 1
  - Package-path clarity and stale AG/AF/AH alias cleanup scope: DEFINED

Downstream tasks defined: 6
  - AJ2: UX/copy spec                                    → sna-ui-designer
  - AJ3: Implementation — apply copy updates              → sna-frontend-workbench
  - AJ4: QA acceptance + Alan manual checklist            → sna-qa-acceptance
  - AJ5: Privacy/security audit                           → sna-privacy-security
  - AJ6: Windows local package refresh                    → sna-windows-runtime
  - AJ7: Final local readiness gate                       → sna-release-docs

Key finding:
  - The code is already clean (label says "Current local Windows package").
  - No stale AG/AF/AH phase labels remain in App.tsx at time of this writing.
  - The AI7 gate's caveat was based on a stale read — the copy was already corrected.
  - Scope is primarily about guidance consistency in new docs and downstream verification.

Red-zone items excluded: 14
Non-goals: 10
```

*This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.*

---

## Appendix A — Freshness ordering from dist/release

| Timestamp | Filename | Size | Status |
|-----------|----------|------|--------|
| 1780778322 | `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` | 118,600,763 B | **CURRENT** |
| 1780775978 | `servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` | ~118 MB | Archival |
| 1780775971 | `servicenow-automation-windows-v0.1.0-rc.1.zip` | ~117 MB | Archival (undated alias) |
| 1780774566 | `servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip` | ~118 MB | Archival |
| 1780771167 | `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` | ~118 MB | Archival |
