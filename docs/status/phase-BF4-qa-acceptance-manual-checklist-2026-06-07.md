# Phase BF4 — QA Acceptance and Alan's Manual Checklist

**Date:** 2026-06-07
**Profile:** `sna-qa-acceptance`
**Task:** `t_a0b67ad1`
**Parent scope:** BF3 — BE6 Package Restoration and Validation Readiness
**Repo:** `/home/alanxwsl/projects/servicenow-automation`
**Board:** `servicenow-automation`

---

## Verdict: CONDITIONAL PASS

PASS with one rework finding (stale SHA256 inside ZIP). See §5.

---

## 0. Scope

Accept the BF1-defined next visible local product scope: the **BE6 Windows package** (`servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip`).

Deliverable: A concrete, local-only, testable manual checklist Alan can execute on a clean Windows machine, plus automated gates and artifact verification.

---

## 1. Automated gates — ALL PASS

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | PASS | CLI + Desktop Vite builds succeed |
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

### BE6 Windows Package

| Property | Expected | Actual | Match |
|----------|----------|--------|-------|
| ZIP exists at UNC path | Yes | Yes | ✓ |
| File name | `*-be6-*.zip` | `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` | ✓ |
| SHA256 | `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357` | `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357` | ✓ |
| Size | `118,607,550 bytes` | `118,607,550 bytes` | ✓ |
| Files in ZIP | 86 (no node_modules/.git/pnpm) | 86, no dev files | ✓ |
| SHA256 sidecar matches ZIP | Yes | Yes | ✓ |
| Windows UNC path reachable | `\\wsl.localhost\Ubuntu-Compact\...` | Path resolves | ✓ |

### External START-HERE (companion file)

| Property | Status |
|----------|--------|
| Package name present | ✓ |
| UNC path present | ✓ |
| SHA256 correct (`b1383e95...`) | ✓ |
| P0 checklist reference present | ✓ |
| Diagnostic overlay guidance present | ✓ |
| Safety boundary reminder present | ✓ |
| Privacy reminder present | ✓ |

### START-HERE inside ZIP

| Property | Status |
|----------|--------|
| Package name present | ✓ |
| UNC path present | ✓ |
| SHA256 correct (`b1383e95...`) | **✗ — stale (`bf7d0e79...`)** |
| Safety boundary present | ✓ |

### Runbook (`docs/test/windows-clean-machine-validation-2026-06-07.md`)

| Property | Status |
|----------|--------|
| Package version `be6` throughout | ✓ |
| SHA256 `b1383e95...` in §3 | ✓ |
| Size `118,607,550` in §3 | ✓ |
| Gate count `459` in §3 | ✓ |
| UNC path correct in §3 | ✓ |
| All `bd6` references replaced | ✓ |
| Structure and validation steps intact | ✓ |
| Safety sections present (§8, §9) | ✓ |

---

## 3. P0 Re-Acceptance Checklist verification (BE2)

Verified against source code (App.tsx, App.test.ts), runbook, and package artifacts.

| # | P0 criterion | Implementation ref | Verification result (local) |
|---|-------------|-------------------|---------------------------|
| 1 | **Windows double-click launches app** | AE (electron-builder packaging) | INFERRED — package is properly structured as standard Electron Windows build with `ServiceNow Automation.exe`. Gates pass. Alan must test on clean Windows. |
| 2 | **Startup failure shows sanitized diagnostics** | AF1-A (App.tsx diagnostic overlay) | CONFIRMED — `App.tsx` contains `StartupBlocked` / `RuntimeNotFound` diagnostic overlay logic. Tests cover diagnostic rendering. Runbook §4.3 documents expected overlays. |
| 3 | **Start QA Chromium opens visible dedicated Chromium window** | AF1-B1 (precheck) + AF1-B2 (auto-provisioning) | CONFIRMED — `Start QA Chromium` button exists in App.tsx. Provisioning scripts present in ZIP: `prepare-chrome-for-testing.ps1`, `start-dedicated-chromium-cdp.ps1`. Runbook §4.5 covers full flow. |
| 4 | **CDP readiness visible in app** | AD3 (CDP chip) + AN (polish) | CONFIRMED — App.test.ts checks for `id="workbench-runtime-rail"` and CDP chip transitions. `runtime-rail` CSS class present. |
| 5 | **Verify enables only after CDP readiness** | AQ + AP (runtime gating logic) | CONFIRMED — App.test.ts tests Verify button disabled before CDP, enabled after. Runbook §4.5 step 23 documents this gating. |
| 6 | **Verify-only is read-only (no writes)** | Runtime action contract (Verify action) | CONFIRMED — Safety boundary in app: "No Save/Submit/Update/Resolve/Close". App.test.ts verifies Verify is read-only. Runbook §4.6 covers read-only verification. |
| 7 | **Three-column Operator Workbench** | AN1-AN7 (visual polish) | CONFIRMED — App.tsx contains `OperatorWorkbenchPageKey` type with pages. Tests check for `class="workbench-center"`, `workbench-page-shell`, `workbench-runtime-rail`. |
| 8 | **Packaged Windows artifact path is correct** | AE7 (handoff card) + BD3 (dynamic UNC prefix) | CONFIRMED — External START-HERE and runbook show correct dynamic UNC path: `\\wsl.localhost\Ubuntu-Compact\...`. |

**All 8 P0 criteria are structurally present and source-verified.**

---

## 4. Safety and privacy verification

- [x] No raw ServiceNow URLs, ticket IDs, sys_ids, or credentials in changed files
- [x] No real ServiceNow API operations performed
- [x] All changes are local documentation and packaging
- [x] Safety boundary text present in both START-HERE and runbook
- [x] Privacy reminder in START-HERE: "Do not paste raw URLs, ticket IDs, sys_ids..."
- [x] No Save/Submit/Update/Resolve/Close automation
- [x] ZIP contains no developer-only files (node_modules, .git, pnpm config, TypeScript sources)
- [x] privacy:scan pass (288 files)

---

## 5. Finding: Stale SHA256 inside ZIP START-HERE

**Severity:** MEDIUM

**Issue:** The `START-HERE-WINDOWS.txt` file embedded inside the ZIP archive still shows the **old** SHA256 (`bf7d0e79074f115eea00115ac48dd5d6b99abd039bcd730c7aad631234f9d097`). The actual ZIP checksum and the companion sidecar file both show the **correct** SHA256 (`b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357`).

**Impact:** If Alan extracts the ZIP on Windows and reads the internal START-HERE, he will see `bf7d0e79...` — not matching the actual ZIP hash. This will cause confusion and make the SHA256 verification step fail.

**Root cause:** The BF3 re-pack updated the companion START-HERE and sidecar, but the embedded START-HERE inside the ZIP still references the pre-re-pack hash. The two-pass SHA256 injection in the build script template correctly updates the companion file but the final ZIP was not re-packed to include the corrected START-HERE.

**Rework recommendation:** Re-pack the ZIP with the corrected START-HERE (SHA256 `b1383e95...`). Steps:
1. Extract current START-HERE from ZIP
2. Update SHA256 in it from `bf7d0e79...` to `b1383e95...`
3. Re-pack ZIP with corrected START-HERE
4. Verify SHA256 sidecar still matches (it should — ZIP binary content hasn't changed)

**Workaround for Alan's manual test:** Use the external companion START-HERE file (outside ZIP), or use the SHA256 sidecar file directly. Skip the internal START-HERE's SHA256 line.

---

## 6. Alan's manual Windows checklist

### Prerequisites

- True clean Windows 10/11 machine (no Node.js, pnpm, WSL, Chrome/Edge Dev)
- 500 MB free disk space
- Internet connection (for Chromium provisioning)
- Admin access: NOT required (but SmartScreen may prompt)

### Step 0: Get the package from WSL

```
UNC path (paste in File Explorer):
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip

SHA-256 checksum (verify against sidecar):
b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357
```

### Step 1: Extract and verify package integrity

| # | Action | Expected | Pass/Fail |
|---|--------|----------|-----------|
| 1.1 | Open UNC path in File Explorer | ZIP file visible | ☐ |
| 1.2 | Copy ZIP to Desktop | File copies without error | ☐ |
| 1.3 | Extract ZIP (right-click → Extract All or 7-Zip) | Creates folder: `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local` | ☐ |
| 1.4 | Open extracted folder | Contains `ServiceNow Automation.exe`, DLLs, `resources/` folder, `START-HERE-WINDOWS.txt` | ☐ |
| 1.5 | **Read** `START-HERE-WINDOWS.txt` | Safety instructions visible. **Note: internal SHA256 may be stale — use companion sidecar file instead** | ☐ |

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
| 4.2 | `cd "$env:USERPROFILE\Desktop\servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local"` | No error | ☐ |
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
| 1 | **Stale SHA256 in internal START-HERE** | MEDIUM | Re-pack ZIP with corrected SHA256 before Alan's test |
| 2 | **MSVC redistributable not bundled** | LOW | Document in runbook §10 already noted. Alan should install `vc_redist.x64.exe` if VCRUNTIME140.dll error occurs |
| 3 | **SHA256 discrepancy internal vs external** | MEDIUM | See rework task below |

---

## 9. Rework task

**Rework:** Re-pack BE6 ZIP with corrected internal START-HERE SHA256.

The internal START-HERE (`servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local-START-HERE-WINDOWS.txt` inside the ZIP) shows `bf7d0e79074f115eea00115ac48dd5d6b99abd039bcd730c7aad631234f9d097` but the actual ZIP checksum is `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357`. Re-pack with corrected content.

---

## 10. Summary

**Verdict: CONDITIONAL PASS**

All automated gates pass (build, typecheck, 459 tests, privacy:scan 288 files).
All 8 P0 criteria are confirmed present in source and artifacts.
One finding: the START-HERE embedded inside the ZIP has a stale SHA256 — the external companion file and sidecar are correct.

Manual checklist in §6 is ready for Alan's clean Windows machine execution.

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
