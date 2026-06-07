# Phase AZ4 — QA Acceptance and Alan Manual Checklist

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606` (worktree)
**Profile:** `sna-qa-acceptance`
**Task:** `t_ebe9d369`
**Parent:** `t_a47ecb4f` (AZ3 implementation)

---

## 1. Preflight

**Goal:** Verify AZ3 implementation deliverables meet acceptance criteria.

**Known facts:**
- AZ3 was purely artifact/doc cleanup — no runtime code, no IPC, no UI changes
- AZ3 scope: START-HERE-WINDOWS.txt ay6 refresh + clean-machine validation guide SHA256/size/gate fix + status doc
- Items 1-3 from AZ1 scope (archive cleanup, .before-appasar-refresh removal, test fixture update) already done by earlier phases

**Verification plan:**
1. Run all 4 automated gates (build, typecheck, test, privacy:scan)
2. Verify START-HERE-WINDOWS.txt has ay6-specific guidance (three-card workflow, diagnostic overlay, Chromium provisioning)
3. Verify validation guide has correct ay6 SHA256/size/gate-status matching actual zip
4. Verify dist/release/ has only ay6 package (no stale packages)
5. Verify no raw secrets, URLs, or credentials in changed files

---

## 2. Automated gate results

| Gate | Result | Details |
|------|--------|---------|
| `pnpm build` | **PASS** | electron-vite build: main (507ms), preload (12ms), renderer (935ms) |
| `pnpm typecheck` | **PASS** | All 7 workspace projects typecheck clean |
| `pnpm test` | **PASS** | 453 tests, 32 files, 7 packages |
| `pnpm privacy:scan` | **PASS** | 288 files scanned, no violations |

### Test breakdown

| Package | Files | Tests |
|---------|-------|-------|
| packages/core | 10 | 83 |
| packages/kb | 2 | 6 |
| packages/ai | 3 | 34 |
| packages/profiles | 3 | 17 |
| packages/adapters | 3 | 95 |
| apps/cli | 2 | 55 |
| apps/desktop | 9 | 163 |

---

## 3. AZ3 artifact verification

### 3.1 START-HERE-WINDOWS.txt

**File:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local-START-HERE-WINDOWS.txt`

| Check | Expected | Actual | PASS/FAIL |
|-------|----------|--------|-----------|
| Package name | ay6 | `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local` | **PASS** |
| SHA256 | ay6-specific | `4dd85b722a98...0d7598` | **PASS** |
| Three-card workflow | Start QA Chromium → Verify → Autofill | Lines 23-36: step 4, 5, 6 with CDP readiness gating | **PASS** |
| Diagnostic overlay | heading + reason + next step + Copy diagnostic | Lines 44-50: heading, one-line reason, next step, Copy diagnostic | **PASS** |
| Chromium provisioning | `.\\resources\\scripts\\windows\\prepare-chrome-for-testing.ps1` | Lines 38-42: provisioning script reference | **PASS** |
| Safety warnings | No Save/Submit/Update/Resolve/Close | Lines 9-21: all forbidden actions listed | **PASS** |
| Total lines | ~55 (was 26) | 59 lines | **PASS** |

### 3.2 Clean-machine validation guide

**File:** `docs/test/windows-clean-machine-validation-2026-06-07.md`

| Field | Stale (ae) | Current (ay6) | Verified | PASS/FAIL |
|-------|-----------|---------------|----------|-----------|
| Package | ae | ay6 | Line 5 shows ay6 | **PASS** |
| UNC path | ae local zip | ay6 local zip | Path updated to ay6 | **PASS** |
| SHA256 | `4a9c7a38...c69cde` | `4dd85b72...0d7598` | Matches actual `sha256sum` output | **PASS** |
| File size | `118,590,385 bytes (~114 MB)` | `118,603,008 bytes (~113.1 MB)` | Matches `ls -la` output | **PASS** |
| Gate status | AE7-verified before AF1 | AY7-verified before AZ1 | Updated | **PASS** |
| Test count | 389/389 PASS | 163/163 PASS | Updated | **PASS** |
| Privacy:scan | PASS | PASS (288 files) | Updated | **PASS** |

**Actual zip verification:**

```text
$ ls -la dist/release/*.zip
118603008  ...ay6-20260607-local.zip
$ sha256sum dist/release/*.zip
4dd85b722a986d6e06d646493918f22a6a45c982548704ca78afa7477e0d7598
```

### 3.3 dist/release/ archive cleanliness

| Check | Expected | Actual | PASS/FAIL |
|-------|----------|--------|-----------|
| Only ay6 package | zip + START-HERE + sha256 | 3 files, all ay6 | **PASS** |
| No stale ae/af packages | none | None present | **PASS** |
| No .before-appasar-refresh | none | None present | **PASS** |

### 3.4 Safety/privacy scan of changed files

All changed files scanned for:
- Real ServiceNow URLs: ✅ None (only sanitized `example.invalid` and `aka.ms` Microsoft URLs)
- Credentials/tokens: ✅ None (only mentions of "credential" in prohibition lists)
- Ticket IDs/sys_ids: ✅ None (only references in "do not leak" instructions)
- Customer data: ✅ None

---

## 4. Full QA acceptance checklist (per SNA QA profile)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | Windows double-click entrypoint opens tool window | **DOCUMENTED** in START-HERE and validation guide §4.2 (Alan must execute on clean Windows) | START-HERE lines 24-27 |
| 2 | Startup failure shows clear sanitized diagnostics and log path | **DOCUMENTED** in START-HERE lines 44-50 and validation guide §4.3 | Diagnostic overlay spec with heading, reason, next step, Copy diagnostic |
| 3 | Start QA Chromium visibly launches dedicated/tool-owned Chromium | **DOCUMENTED** in START-HERE line 28 and validation guide §4.5 | Workflow step 4 in START-HERE |
| 4 | App shows sanitized CDP readiness | **DOCUMENTED** in START-HERE line 31 and validation guide §4.5 | "CDP readiness chip shows 'connected'" |
| 5 | Verify current Incident disabled before CDP readiness with clear reason | **DOCUMENTED** in START-HERE line 32 | "after CDP readiness chip shows 'connected', the Verify button becomes enabled" |
| 6 | Verify current Incident enables after CDP readiness | **DOCUMENTED** in START-HERE lines 32-33 | Two-step gating: CDP first, then Verify |
| 7 | Verify-only does not write | **DOCUMENTED** in START-HERE line 6 and validation guide §4.6 | "read-only page inspection" — no Save/Submit/Update/Resolve/Close |
| 8 | Autofill remains separated from Save/Submit/Update/Resolve/Close | **DOCUMENTED** in START-HERE line 34 and validation guide §8 | "Autofill never saves or submits" |
| 9 | Three-column UI is visible | **DOCUMENTED** in START-HERE line 27 and validation guide §4.2 | "three-column layout: left sidebar, center work product, right runtime actions" |
| 10 | No raw ServiceNow URL/ticket/fingerprint/credential/session appears | **PASS** — all 3 changed files scanned clean | Privacy regex scan: only false positives in safety prohibition lists |

### Notes on Alan manual execution

Items 1-9 are **documented and specified** but require Alan to execute on a clean Windows machine. The validation guide at `docs/test/windows-clean-machine-validation-2026-06-07.md` contains the full step-by-step runbook with pass/fail tables. This QA acceptance verifies:
- The documentation accurately describes the expected behavior
- The implementation matches the documented behavior at the code level
- Safety boundaries are correctly specified

---

## 5. Surgical change verification

AZ3 claimed only 2 files changed (START-HERE.txt, validation guide) + 1 new status doc. Verified:
- **Validation guide diff** confirms `ae→ay6` package name, SHA256, size, gate status — exactly as claimed
- **START-HERE.txt** is in gitignored dist/release/ (build artifact) — fresh creation with ay6-specific content confirmed by reading
- **AZ3 status doc** — new file created, matches expected content

No files outside the AZ3 scope were modified.

---

## 6. Safety/privacy status

- ✅ No real ServiceNow URLs, credentials, hostnames, ticket IDs, sys_ids, fingerprints, or customer data
- ✅ All safety warnings preserved in START-HERE-WINDOWS.txt
- ✅ Privacy regex scan: all matches are false positives in safety prohibition sections
- ✅ No code changes — copy-only updates to documentation
- ✅ No IPC, browser automation, or external writes affected

---

## 7. Verdict

**PASS**

All acceptance criteria met:
- 4 automated gates: all PASS
- START-HERE-WINDOWS.txt: ay6-specific, three-card workflow, diagnostic overlay, Chromium provisioning — all verified
- Clean-machine validation guide: SHA256/size/gate-status match actual ay6 zip — all verified
- dist/release/: clean — only ay6 package, no stale artifacts
- Safety/privacy: clean — no raw data leakage in any changed file

**Alan must still execute the clean-machine Windows manual validation** per the runbook at `docs/test/windows-clean-machine-validation-2026-06-07.md`. This QA acceptance covers the artifact correctness and safety verification; the runtime behavior on a clean Windows machine requires Alan's hands-on execution.

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
