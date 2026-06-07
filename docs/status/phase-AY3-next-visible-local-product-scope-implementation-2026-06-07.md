# Phase AY3 — Stale AR3 Test Data Update — Implementation Report

**Date:** 2026-06-07
**Status:** implementation complete
**Privacy:** sanitized local-only

## Preflight

**Goal:** Update stale AR3 test data references in `App.test.ts` to reflect the current AX6 package, as specified in the AY2 UX spec.

**Known facts:**
- `App.tsx` had no stale AR3 literal strings — already dynamic via `currentPhase` from `packageMetadata?.phase`
- `App.test.ts` had `currentAr3PackageMetadata` test data block with AR3 phase/path/filename/sha256/aliases
- `worktree-ipc.test.ts` also has AR3 test data references — explicitly out of AY2 scope

**Scope from AY2 spec §6:**
- `apps/desktop/src/App.test.ts`: rename `currentAr3PackageMetadata` → `currentPackageMetadata`, update test data to AX6
- `apps/desktop/src/App.tsx`: only for copy strings (none were stale)
- `docs/test/windows-clean-machine-validation-2026-06-07.md`: already exists (created by earlier phase)

## Changes made

### File changed: `apps/desktop/src/App.test.ts`

**1. Line 47 — Variable rename + test data update**
- Renamed `currentAr3PackageMetadata` → `currentPackageMetadata`
- Updated `path` to AX6 path (`…-ax6-20260607-…`)
- Updated `sha256` to `8cd0c9b74b0ad4d2fa67efb073f2c016ae9baaedfa10314de53c3e0101036647`
- Updated `mtime` to `2026-06-07T15:26:23+08:00`
- Updated `filename` to `…-ax6-20260607-…`
- Updated `size` to `118603008`
- Updated `phase` from `"AR3"` to `"AX6"`
- Updated `archivalAliases` from `["AQ6", "AK"]` to `["AW5", "AV6", "AU6", "AT6", "AS6", "AR3", "AQ6"]`

**2. Line 1631 — Usage reference update**
- `initialPackageMetadata: currentAr3PackageMetadata` → `initialPackageMetadata: currentPackageMetadata`

**3. Line 1648 — Test assertion update**
- Changed `expect(output).toContain("AK")` → `expect(output).toContain("AR3")` since `AK` was replaced by the full AW5→AQ6 alias chain

## Verification

| Gate | Result |
|------|--------|
| `pnpm typecheck` | PASS — no type errors |
| `pnpm test` (desktop) | PASS — 163/163 tests (98 in App.test.ts) |
| `pnpm test` (all) | PASS — 163 desktop + 55 CLI = 218 tests |
| `pnpm privacy:scan` | PASS — 288 files |
| No stale AR3 literals in App.test.ts | PASS — only 2 legitimate references (archival alias + test assertion) |

## Why this is minimal

- Only 1 file touched: `apps/desktop/src/App.test.ts`
- 3 patch sites: variable + data block, usage reference, test assertion alias check
- No changes to runtime behavior, UI layout, IPC, or external systems
- Only stale test data — no production code changed

## Why every touched file was necessary

**`apps/desktop/src/App.test.ts`** — the only file with stale AR3 test data in the AY2 allowed surface. The test data feeds the release-readiness handoff render test, so it must reflect the current AX6 package.

## Remaining AR3 references (intentional)

- `worktree-ipc.test.ts` (8 lines) — AR3 test data in IPC handler tests. Not in AY2 scope. Should be handled in a follow-up task.

## Safety/privacy status

- No real ServiceNow URLs, credentials, or secrets
- No IPC or runtime behavior changes
- No browser automation, URL access, or external writes
- All test data uses sanitized local file paths

## Remaining risks

- `worktree-ipc.test.ts` still has AR3 test data. These tests pass because the AR3 path content is just dummy test fixture data, but they should be updated in a future phase for hygiene.

## Handoff to Alan

- Phase AY3 complete: stale AR3 test data in `App.test.ts` has been updated to AX6
- 1 file changed, 3 edit sites, all gates pass
- Next: consider AY4 — update `worktree-ipc.test.ts` AR3 test data, and refresh the clean-machine validation doc package references (currently references `ae` package)
