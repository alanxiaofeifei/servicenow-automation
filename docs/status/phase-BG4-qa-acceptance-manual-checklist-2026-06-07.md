# Phase BG4 — QA Acceptance and Alan's Manual Checklist

**Date:** 2026-06-07
**Profile:** `sna-qa-acceptance`
**Task:** `t_43fb17bf`
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD:** `019c502`

---

## Verdict: CONDITIONAL PASS

PASS with two findings (concurrent-package race, CURRENT.txt points to BF6 not BG6). See §5.

---

## 0. Scope

Accept the current-package handoff as defined by BG1 scope: the **BF6 Windows package** (`servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip`), building on BF7's READY-FOR-MANUAL-VALIDATION-ONLY verdict.

**Note:** A concurrent `bg6` package was built at 19:57 while gates were running. See §5.1 for details.

Deliverable: Automated gates, artifact verification, UNC path clarity check, archival alias demotion check, safety copy verification, and Alan's manual Windows checklist.

---

## 1. Automated gates — ALL PASS

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | PASS | 30 SSR + 1 preload + 56 renderer modules |
| `pnpm typecheck` | PASS | All 7 workspace packages typecheck clean |
| `pnpm test` | PASS | **459 tests** across all 7 packages |
| `pnpm privacy:scan` | PASS | 288 files scanned, no violations |

**Test breakdown:**

| Workspace | Tests | Status |
|-----------|-------|--------|
| packages/core | 83 | PASS |
| packages/ai | 34 | PASS |
| packages/kb | 6 | PASS |
| packages/profiles | 17 | PASS |
| packages/adapters | 95 | PASS |
| apps/cli | 55 | PASS |
| apps/desktop | 169 | PASS |
| **Total** | **459** | **ALL PASS** |

---

## 2. Artifact verification

### BF6 Windows Package (current per BG1/BF7 scope)

| Property | Expected | Actual | Match |
|----------|----------|--------|-------|
| ZIP exists at dist/release/ | Yes | `servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` | ✓ |
| Size | 118,607,518 bytes (113.11 MiB) | 118,607,518 bytes | ✓ |
| SHA256 | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` | matches `sha256sum` | ✓ |
| SHA256 sidecar matches ZIP | `3e12d093...` | `3e12d093...` in sidecar | ✓ |
| Files in ZIP | 86 (no node_modules/.git) | 86 files, clean | ✓ |
| External START-HERE | Present, references BF6, has UNC path, SHA256, safety wording | All present | ✓ |
| Internal START-HERE | Present, references BF6, redirects to sidecar for SHA256 | "See the accompanying .sha256 sidecar file" — robust approach | ✓ |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\...zip` | Resolves | ✓ |

### BG6 Windows Package (concurrent build — see §5.1)

| Property | Value |
|----------|-------|
| ZIP exists at dist/release/ | Yes — `servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip` |
| mtime | 2026-06-07 19:57 CST |
| Size | 118,607,518 bytes |
| SHA256 | `1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb` |
| SHA256 sidecar matches ZIP | ✓ |
| External START-HERE | Present, correct BG6 name, UNC path, SHA256, safety wording |
| Internal START-HERE | Present, redirects to sidecar (same robust approach as BF6) |
| Gate doc | Present: `docs/status/phase-BG6-windows-local-package-refresh-2026-06-07.md` |

### External START-HERE (BF6 companion file)

| Property | Status |
|----------|--------|
| Package name present | ✓ |
| UNC path present | ✓ |
| SHA256 correct (`3e12d093...`) | ✓ |
| Safety boundary ("No Save/Submit/Update/Resolve/Close") | ✓ |
| Privacy reminder ("Do not paste raw URLs, ticket IDs...") | ✓ |

### Internal START-HERE (BF6 inside ZIP)

| Property | Status |
|----------|--------|
| Package name present | ✓ |
| UNC path present | ✓ |
| SHA256 approach | **Robust** — redirects to sidecar, "See the accompanying .sha256 sidecar file" |
| Safety boundary present | ✓ |

### Runbook (`docs/test/windows-clean-machine-validation-2026-06-07.md`)

| Property | Status |
|----------|--------|
| Package reference `bf6` throughout | ✓ |
| SHA256 `3e12d093...` in §3 | ✓ |
| Size `118,607,518` in §3 | ✓ |
| UNC path correct in §3 | ✓ |
| No `be6` or `ae` stale references | ✓ |
| Safety sections present (§8, §9) | ✓ |
| Structure and validation steps intact | ✓ |

---

## 3. UNC path clarity check

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Exact UNC path is obvious in runbook | ✓ | §3 shows BF6 UNC path as first visible block |
| Exact UNC path in external START-HERE | ✓ | Line 9 of companion file |
| Exact UNC path in internal START-HERE | ✓ | Inside ZIP |
| CURRENT.txt exists in dist/release/ | ✓ | `dist/release/CURRENT.txt` at 19:57 |
| CURRENT.txt content | **Finding** — points to BF6, not newest BG6 | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip` |

**Verdict:** UNC path IS obvious for the BF6 package. The CURRENT.txt marker exists but is one phase behind the newest build (BG6).

---

## 4. Archival alias demotion check

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Archive demotion convention doc exists | ✓ | `docs/status/archive-demotion-convention-2026-06-07.md` — answers all 5 required questions |
| CURRENT.txt clearly separates current from archival | ✓ | Convention doc states: "The package named by CURRENT.txt is current; every other package is archival" |
| Older packages visually distinguishable | Partial | No folder structure change, but convention doc now documents the rule |
| 8 older packages (ay6–be6) remain | N/A | Not in scope — convention doc explicitly defers lifecycle policy |

**Verdict:** Convention doc exists and is correct. Archival aliases are now documented as demoted.

---

## 5. Findings

### 5.1 Concurrent-package race: BG6 built after CURRENT.txt

**Severity:** LOW

**Issue:** A concurrent `sna-windows-runtime` worker built `bg6` package at 19:57 (ZIP + sidecar + START-HERE). However, `CURRENT.txt` (also created at 19:57) points to `bf6`, not `bg6`. The runbook still references BF6.

**Impact:** If Alan opens `dist/release/` and reads `CURRENT.txt`, he will use BF6. The BG6 package is newer and identically sized, but not referenced by CURRENT.txt or the runbook.

**Root cause:** Concurrent workers operating in the same workspace — the CURRENT.txt creator did not know about the concurrent BG6 build.

**Recommendation:** Either:
- A. Update `CURRENT.txt` to point to BG6, generate a BG7 gate doc, and refresh the runbook to BG6; or
- B. Leave CURRENT.txt at BF6, keep BF6 as the "current" package, and demote BG6 to archival until a future gate cycle.

### 5.2 BG6 package gate test count mismatch

**Severity:** LOW

**Issue:** The BG6 package refresh doc (`phase-BG6-windows-local-package-refresh-2026-06-07.md`) reports **370 tests** passed, omitting core (83) and KB (6) tests. My independent run shows **459 tests** across all 7 packages — core and KB both pass cleanly.

**Impact:** The BG6 doc's gate section is incomplete. If a core or KB test failure caused the lower count, it would have been missed.

**Recommendation:** Re-run `pnpm -r --workspace-concurrency=1 --if-present test` for BG6 and update its gate section with the full 459 test count.

---

## 6. Alan's manual Windows checklist

### Prerequisites

- True clean Windows 10/11 machine (no Node.js, pnpm, WSL, Chrome/Edge Dev)
- 500 MB free disk space
- Internet connection (for Chromium provisioning)
- Admin access: NOT required (but SmartScreen may prompt)

### Step 0: Determine which package to test

The formal current package per BG1/BF7 scope is **BF6**. However, a newer **BG6** package exists at the same size. Choose one:

**Option A (recommended — formally gated):** Use BF6
- CURRENT.txt points here
- Runbook references this
- BF7 gate validated this

**Option B (newer build):** Use BG6
- Newest package (19:57)
- Same robust START-HERE format
- No formal readiness gate yet

**UNC path (for BF6, paste into File Explorer):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip
```

**SHA-256 checksum (BF6):**
```
3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33
```

**UNC path (for BG6):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bg6-20260607-local.zip
```

**SHA-256 checksum (BG6):**
```
1d1d9dbed6bc56357172af992b5fc60c64784270812f4c6bd86e3577a251e6cb
```

### Step 1: Extract and verify package integrity

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 1.1 | Open UNC path in File Explorer | ZIP file visible | ☐ |
| 1.2 | Copy ZIP to Desktop | File copies without error | ☐ |
| 1.3 | Extract ZIP (right-click → Extract All or 7-Zip) | Creates folder: `servicenow-automation-windows-v0.1.0-rc.1-*-20260607-local` | ☐ |
| 1.4 | Open extracted folder | Contains `ServiceNow Automation.exe`, DLLs, `resources/` folder, `START-HERE-WINDOWS.txt` | ☐ |
| 1.5 | **Read** `START-HERE-WINDOWS.txt` | Safety instructions visible. Note: internal SHA256 redirects to sidecar — verify against sidecar file | ☐ |

**PASS criteria:** Folder opens correctly, no WSL/Node.js files visible, no error dialogs.

### Step 2: Double-click launch (P0 criterion 1)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 2.1 | **Double-click** `ServiceNow Automation.exe` | Window opens within 3–10 seconds | ☐ |
| 2.2 | Check window title | Says **"ServiceNow Automation"** | ☐ |
| 2.3 | Check window size | ~1320×900 pixels | ☐ |
| 2.4 | SmartScreen prompt (may appear) | Click **"Run anyway"** or **"More info → Run"** | ☐ |

**PASS:** Window opens, title correct, no crash dialog.
**FAIL:** Crash dialog, VCRUNTIME140.dll missing, .NET installation prompt, immediate close.

### Step 3: Startup diagnostic overlay (P0 criterion 2)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 3.1 | If diagnostic overlay appears | Has heading ("Startup blocked" or similar), plain-language reason, next-step recommendation, **"Copy diagnostic"** button | ☐ |
| 3.2 | Click **"Copy diagnostic"** | Only sanitized text copied — no raw stack traces, no secrets | ☐ |
| 3.3 | Dismiss overlay | App continues to runtime rail | ☐ |

**PASS:** Overlay is readable, no raw stack traces, "Copy diagnostic" works safely.
**If no overlay appears:** Also OK — proceed to step 4.

### Step 4: Chromium provisioning (P0 criteria 3-4)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 4.1 | Open **PowerShell** (non-admin) | PowerShell prompts | ☐ |
| 4.2 | `cd "$env:USERPROFILE\Desktop\servicenow-automation-windows-...-local"` | No error | ☐ |
| 4.3 | Run: `.\resources\scripts\windows\prepare-chrome-for-testing.ps1` | Downloads Chromium for Testing, progress visible | ☐ |
| 4.4 | Wait for completion | Message: "Chrome for Testing installed at %LOCALAPPDATA%\..." | ☐ |
| 4.5 | Verify: `Test-Path "$env:LOCALAPPDATA\ServiceNowAutomation\Runtime\Chromium\chrome.exe"` | Returns `True` | ☐ |

**PASS:** Script completes, runtime exists at expected path.
**FAIL:** Download error, PowerShell execution policy error, admin required.

### Step 5: Start QA Chromium and CDP readiness (P0 criteria 3-4-5)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 5.1 | Close and re-launch the app (double-click) | App re-opens | ☐ |
| 5.2 | **Before clicking Start QA Chromium:** Check **Verify current Incident** button | Button is **disabled** (grayed out) | ☐ |
| 5.3 | Click **Start QA Chromium** | Dedicated Chromium window opens visibly | ☐ |
| 5.4 | Wait 3–5 seconds | CDP chip transitions: disconnected → connecting → connected | ☐ |
| 5.5 | Check CDP chip shows **"connected"** | Green "connected" state | ☐ |
| 5.6 | Check **Verify current Incident** button | Now **enabled** (clickable) | ☐ |

**PASS:** Before CDP: Verify disabled. After CDP: Verify enabled, chip green.
**FAIL:** Chromium doesn't open, chip stays "disconnected", Verify never enables.

### Step 6: Verify current Incident (read-only) (P0 criterion 6)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 6.1 | Click **Verify current Incident** | Read-only inspection runs | ☐ |
| 6.2 | Confirm **no fields were filled** | Nothing modified in the Chromium window | ☐ |
| 6.3 | Confirm **no Save/Submit/Update/Resolve/Close** | No such buttons exist — read-only only | ☐ |
| 6.4 | Check verification result | Read-only summary shown | ☐ |

**PASS:** Verify is truly read-only, no autofill, no submission buttons.
**FAIL:** Any field filled, any submit action triggered, any navigation to real ServiceNow.

### Step 7: Three-column layout (P0 criterion 7)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 7.1 | Look at the app window | **Three distinct column regions** visible | ☐ |
| 7.2 | Left column | Navigation, history, settings, source | ☐ |
| 7.3 | Center column | Workbench/detail, TicketDraft, field plan | ☐ |
| 7.4 | Right column | Runtime actions, templates, status, safety info | ☐ |

**PASS:** Three columns clearly visible with distinct content areas.
**FAIL:** Single column, collapsed panels, no column headers.

### Step 8: Safety and privacy checks (P0 criterion 8, safety boundary)

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 8.1 | Confirm "No Save/Submit/Update/Resolve/Close" text visible | Safety boundary text present in UI | ☐ |
| 8.2 | Confirm "AI drafts and fills allowed text fields only" visible | Human-in-the-loop disclaimer | ☐ |
| 8.3 | Confirm UNC path in handoff card uses correct WSL distro | Not hardcoded "Ubuntu-Compact" (might differ on Alan's machine) | ☐ |

---

## 7. Overall PASS/FAIL criteria

### Overall PASS (all of:)
- [x] All 4 automated gates pass
- [ ] ZIP extracts without errors on Windows (Alan to test)
- [ ] Double-click opens window with "ServiceNow Automation" title (Alan to test)
- [ ] Startup diagnostic overlay is clean if triggered (Alan to test)
- [ ] `prepare-chrome-for-testing.ps1` provisions Chromium (Alan to test)
- [ ] Start QA Chromium opens visible window (Alan to test)
- [ ] CDP chip shows "connected" (Alan to test)
- [ ] Verify button enables only after CDP (Alan to test)
- [ ] Verify is read-only (no fills, no submits) (Alan to test)
- [ ] Three-column layout visible (Alan to test)
- [ ] No Save/Submit/Update/Resolve/Close in UI (Alan to test)
- [ ] Safety text visible in UI (Alan to test)
- [ ] No developer-only files in ZIP (verified ✓)
- [ ] No raw URLs/ticket IDs/credentials in docs/artifacts (verified ✓)

### Overall FAIL (any of:)
- [ ] App crashes on startup
- [ ] App requires Node.js/pnpm/WSL to run
- [ ] App attempts writes to real ServiceNow
- [ ] ZIP contains developer-only files (verified ✓ — clean)
- [ ] `prepare-chrome-for-testing.ps1` fails on clean Windows
- [ ] Start QA Chromium has no visible effect after provisioning

---

## 8. Recommendations

| # | Item | Severity | Action |
|---|------|----------|--------|
| 1 | **Concurrent-package race: BG6 vs BF6** | LOW | Resolve which package is current — update CURRENT.txt to BG6 or leave at BF6 |
| 2 | **BG6 gate test count 370 vs 459** | LOW | Re-run full test suite for BG6 package doc (missing core + KB) |
| 3 | **CURRENT.txt points to BF6 despite BG6 existing** | LOW | §5.1 covers this — needs explicit resolution before Alan tests |

---

## 9. Summary

**Verdict: CONDITIONAL PASS**

All automated gates pass (build, typecheck, 459 tests, privacy:scan 288 files).

The BF6 package is properly formed: SHA256 matches sidecar, UNC path is obvious in runbook and both START-HERE files, safety wording is present, and archival aliases now have a documented demotion convention.

Two concurrent-package findings (BG6 vs BF6 race, BG6 test count mismatch) need resolution before Alan's manual validation. The manual checklist in §6 is ready for Alan's clean Windows machine execution regardless of which package is ultimately designated as current.

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
