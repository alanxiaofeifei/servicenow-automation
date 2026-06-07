# Phase AO7 — Final Gate: Stale Package-Archive Removal

**Date:** 2026-06-07
**Profile:** `sna-release-docs`
**Task:** `t_437318b1`
**Parent tasks:** AO3 (t_16aa5149), AO4 (t_44316243), AO5 (t_9b5ae2b7), AO6 (t_21a26e1e)

---

## Gate results (re-run by AO7)

| Gate | Result |
|------|--------|
| `pnpm build` | PASS — all 7 workspace projects build cleanly |
| `pnpm typecheck` | PASS — all 6 projects typecheck cleanly |
| `pnpm test` | PASS — 440 tests across 7 packages (core=83, kb=6, ai=34, profiles=17, adapters=95, cli=55, desktop=150) |
| `pnpm privacy:scan` | PASS — 288 files scanned, no violations |

All 4 mandatory gates pass. Same results as AO4 QA acceptance.

---

## Upstream phase status

| Phase | Status | Evidence |
|-------|--------|----------|
| **AO1** (scope) | COMPLETE | `docs/status/phase-AO1-next-visible-local-product-scope-2026-06-07.md` |
| **AO2** (UX/copy spec) | COMPLETE | Delivered by `sna-ui-designer` (parent of AO3) |
| **AO3** (implementation) | COMPLETE | Hardcoded archive entries removed from App.tsx; stale-warning updated; test assertions updated |
| **AO4** (QA acceptance) | PASS | All 4 gates pass; no regression; dynamic metadata block preserved |
| **AO5** (privacy/safety) | APPROVE | No blocking issues; privacy:scan passes; no new data surfaces |
| **AO6** (package refresh) | SKIP | Explicitly optional per task body — AO3 changes are uncommitted; existing AN6 package does not include them |

---

## Verification details

### Workspace evidence (verified by AO7)

- **Archive panel removed:** `handoff-archive-list`, `handoff-archive-entry`, "Package archive" heading all removed from `apps/desktop/src/App.tsx` ✓
- **Stale-warning copy updated:** "Older local builds are archival only. The current test target is the Latest local package shown above." ✓
- **Dynamic metadata block:** Preserved at App.tsx lines 4185-4201 (worktreePkgMetadata) ✓
- **Copy buttons:** Copy path/SHA256/summary present at lines 4248-4256, using dynamic data ✓
- **Retest bullets updated:** Reference dynamic metadata block (lines 4209-4212) ✓
- **Worktree Acceptance card:** Fully intact (line 4569) ✓
- **Test assertions updated:** `App.test.ts` updated for removed archive-list class ✓

### Non-goals confirmed

- No IPC changes ✓
- No center column restructure ✓
- No behavioral changes ✓
- No new components ✓
- No package/build dependency changes ✓
- No production writes ✓

---

## Release summary

**Phase:** AO — Stale Package-Archive Removal in Release Readiness Handoff Card

**Change:** Removed hardcoded archive entries (4 entries referencing AE-phase packages) from the Release Readiness Handoff card in the operator workbench. Stale-warning copy updated from phase-letter-specific wording to generic archival-only text. "Why retest matters" bullets updated to reference the dynamic package metadata block instead of the removed archive list.

**Files changed:**
- `apps/desktop/src/App.tsx` — ~25 lines removed (archive panel + stale-warning update)
- `apps/desktop/src/App.test.ts` — test assertion updates

**Impact:** Minimal — purely stale JSX text removal. No functional change. No IPC. No behavioral change.

**Safety:** No new data surfaces. No write automation. All privacy gates pass.

**Package:** AO6 was SKIP (optional). Existing AN6 package at `dist/release/servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` does not include AO3 changes. A refresh can be requested if an end-to-end package is needed.

---

## Phase closure

All upstream phases complete. AO series closed successfully.

**Verdict:** PASS
**Date:** 2026-06-07
**Signed off by:** `sna-release-docs` (kanban task t_437318b1)
