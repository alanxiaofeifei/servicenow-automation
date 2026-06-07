# Phase AY4 — QA Acceptance: Cumulative Phase Artifact Cleanup

**Date:** 2026-06-07
**QA Profile:** sna-qa-acceptance
**Parent task:** t_9998f3ae (AY3 implementation)
**Workspace:** `next/post-release-operator-cockpit-ab-20260606`
**Scope:** AY3 — update stale AR3 test fixture in App.test.ts to current AX6 package

---

## Automated Gates

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm build` | ✅ PASS | 30 modules (desktop) + 56 modules (renderer) + CLI — all build |
| `pnpm typecheck` | ✅ PASS | 7 workspace projects pass tsc --noEmit |
| `pnpm test` | ✅ PASS | 163 desktop + 55 CLI = **218 tests passed** |
| `pnpm privacy:scan` | ✅ PASS | 288 files scanned, no violations |

## AY3 Implementation Verification

### AC1 — Variable renamed from `currentAr3PackageMetadata` to `currentPackageMetadata`

| Check | Result |
|-------|--------|
| No `currentAr3` variable name remains in any `.ts` source file | ✅ PASS |
| New variable `currentPackageMetadata` exists in App.test.ts (line 47) | ✅ PASS |
| Usage reference at line 1631 updated to use new variable name | ✅ PASS |
| Variable is phase-generic (not tied to any specific phase prefix) | ✅ PASS |

**Evidence:**
```bash
# No stale currentAr3 references
$ grep -r "currentAr3" apps/desktop/src/
# → no matches

# New variable present
$ grep "currentPackageMetadata" apps/desktop/src/App.test.ts
# → line 47: const currentPackageMetadata: PackageMetadataResult = {
# → line 1631: initialPackageMetadata: currentPackageMetadata
```

### AC2 — Test data updated to current AX6 package values

| Field | Expected (AX6) | Actual | Match |
|-------|---------------|--------|-------|
| `phase` | `"AX6"` | `"AX6"` | ✅ |
| `path` | `...ax6-20260607-local.zip` | `...ax6-20260607-local.zip` | ✅ |
| `filename` | `...ax6-20260607-local.zip` | `...ax6-20260607-local.zip` | ✅ |
| `sha256` | `8cd0c9b74b0ad4d2fa67efb073f2c016ae9baaedfa10314de53c3e0101036647` | same | ✅ |
| `size` | `118603008` | `118603008` | ✅ |
| `mtime` | `2026-06-07T15:26:23+08:00` | same | ✅ |

**Evidence:** Verified by reading `apps/desktop/src/App.test.ts` lines 47-60.

### AC3 — `archivalAliases` includes the full stale-phase chain

| Check | Result |
|-------|--------|
| Chain starts at AW5 (newest stale) | ✅ |
| Includes AV6, AU6, AT6, AS6 | ✅ |
| Includes AR3, AQ6 | ✅ |
| No stale phases missing from the alias chain | ✅ |

**Evidence:** `archivalAliases: ["AW5", "AV6", "AU6", "AT6", "AS6", "AR3", "AQ6"]` — matches the 7 stale A-phase packages in dist/release/.

### AC4 — Test assertion validates AR3 appears as archival alias

| Check | Result |
|-------|--------|
| `expect(output).toContain("AR3")` at line 1648 | ✅ PASS |
| This is a legitimate archival alias check, not a stale-phase reference | ✅ PASS |

### AC5 — No stale AR3 display strings in App.tsx or styles.css

| Check | Result |
|-------|--------|
| No `"AR3"` string in App.tsx | ✅ PASS |
| No `"AR3"` string in styles.css | ✅ PASS |
| Display strings use `currentPhase` dynamically (not hardcoded) | ✅ PASS |

**Evidence:**
```bash
$ grep -r "AR3" apps/desktop/src/App.tsx apps/desktop/src/styles.css
# → no matches
```

### AC6 — No raw ServiceNow URL/ticket/fingerprint/credential/session in changed source

| Check | Result |
|-------|--------|
| No real ServiceNow URLs in App.test.ts | ✅ PASS |
| No ticket IDs, sys_ids, or credentials | ✅ PASS |
| All paths use sanitized local file paths | ✅ PASS |
| No real user/requester/assignment group data | ✅ PASS |

---

## Remaining Issues (documented, out of AY scope)

### OOS-1: worktree-ipc.test.ts — 8 stale AR3 references

This was explicitly excluded from AY2 scope. The 8 references in `apps/desktop/electron/worktree-ipc.test.ts` use `ar3` as test fixture data for IPC handler tests (filenames, mtime conditions, sha256 hash values). These tests pass because the mock values are internally consistent.

**Recommendation:** Handle in a follow-up phase (AY8 or later). Risk is low — test fixture data, not production code.

### OOS-2: dist/release/ — 25 files, 8 phase prefixes (aq6 through ax6)

The AY1 scope planned dist/release/ cleanup but AY2 narrowed the allowed touch surface to App.test.ts only. The directory still contains:
- `.before-appasar-refresh` artifact (dev residue)
- 7 stale packages (aw5, av6, au6, at6, as6, ar3, aq6) with sidecar files

**Recommendation:** Plan a future phase for archive cleanup. The archive-demotion infrastructure (`dist/.release-archive/` with gitignored per-phase subdirs) already exists.

### OOS-3: START-HERE-WINDOWS.txt — generic copy across all packages

All 8 START-HERE.txt copies are identical, generic safety text. None reference AX6 specifically or the three-card workflow.

**Recommendation:** Refresh START-HERE copy for the ax6 package in a future phase.

### OOS-4: Clean-machine validation guide — references `ae` package

`docs/test/windows-clean-machine-validation-2026-06-07.md` still references the `ae` package (path, sha256, size). Not refreshed for ax6.

**Recommendation:** Refresh the validation guide in a future phase.

---

## Alan's Manual Checklist (local-only, Windows)

### Before testing

- [ ] **Read this checklist** — it tells you what AY changed and what to look for.
- [ ] **AY scope is narrow** — only App.test.ts was updated (stale AR3 test fixture → current AX6). No UI, no behavior, no IPC changed.
- [ ] **All 4 automated gates pass** — build, typecheck, 218 tests, privacy:scan (288 files).

### Code inspection (on WSL)

These checks confirm the AY3 changes are correct without running the app:

- [ ] Open `apps/desktop/src/App.test.ts`, lines 47-60. Confirm `currentPackageMetadata` has AX6 values (phase, path, sha256, filename, size, mtime).
- [ ] Confirm `archivalAliases` includes `["AW5", "AV6", "AU6", "AT6", "AS6", "AR3", "AQ6"]`.
- [ ] Confirm no `currentAr3` variable name remains anywhere in the file.
- [ ] Confirm `expect(output).toContain("AR3")` at line 1648 is checking the archival alias, not treating AR3 as current.
- [ ] Run `git diff HEAD -- apps/desktop/src/App.test.ts` to see the 162-line diff — verify only test fixture data changed.

### App smoke test (on Windows)

Only if you want to confirm the app still starts and the release-readiness card renders correctly:

- [ ] Extract the ax6 Windows package in a clean Windows folder.
- [ ] Double-click `ServiceNow Automation.exe`.
- [ ] When the app starts, inspect the **Release Readiness Handoff** card.
- [ ] Confirm the package path shown is the ax6 path (not ar3).
- [ ] Confirm the archival aliases section shows the full AW5→AQ6 chain.
- [ ] Confirm the "Loading current..." strings dynamically show AX6 (not hardcoded AR3).

### Safety checks

- [ ] Confirm no raw ServiceNow URL, ticket ID, sys_id, credential, or real user data appears in any log or doc produced by this phase.
- [ ] Confirm all docs and code use sanitized local-only paths.

---

## Verdict

```
╔══════════════════════════════════════════════════════╗
║   PHASE AY4 QA ACCEPTANCE: PASS                     ║
║                                                      ║
║   Automated gates: 4/4 PASS                        ║
║   Acceptance criteria: 6/6 PASS                     ║
║   Remaining issues: 4 (all documented OOS)          ║
║                                                      ║
║   The AY3 implementation correctly:                  ║
║   1. Renamed currentAr3PackageMetadata →             ║
║      currentPackageMetadata (phase-generic)          ║
║   2. Updated test data to current AX6 values          ║
║   3. Updated archivalAliases to full stale chain      ║
║   4. Left no stale AR3 display strings in App.tsx    ║
║                                                      ║
║   No production logic changed.                        ║
║   No ServiceNow data leaked.                          ║
║   All changes are test fixture data only.             ║
╚══════════════════════════════════════════════════════╝
```

## Files changed (AY3 scope)

| File | Change |
|------|--------|
| `apps/desktop/src/App.test.ts` | Rename variable + update test data to AX6 (3 edit sites) |

## Privacy/Safety

All clear. No real ServiceNow data, credentials, URLs, or user information in any file touched by AY3 or this QA document. All paths are sanitized local-only.

---

*This document is local-only. No push, PR, merge, tag, or release was performed.*
