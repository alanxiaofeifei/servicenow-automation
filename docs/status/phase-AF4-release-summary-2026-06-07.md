# AF4 — Release Summary and Handoff for AF1 Deliverables

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-release-docs`
**Head commit:** `2469c04` (AF1-C runbook) + working-tree AF1-A/B implementation

---

## Conclusion

**READY FOR ALAN MANUAL VALIDATION**

All four mandatory gates pass. All three AF1 implementation deliverables (A, B1, B2) pass QA acceptance and privacy/security audit. The clean-machine runbook is committed and review-approved. No known blockers.

**What remains:** Alan must execute the clean-machine validation runbook (`docs/test/windows-clean-machine-validation-2026-06-07.md`) on actual Windows hardware — this is the only remaining gap to close for P0 recovery.

---

## 1. AF1 Deliverables — Status Summary

| Del | Title | Assignee | Status | QA | Privacy | Files |
|-----|-------|----------|--------|----|---------|-------|
| A | Startup Diagnostics Overlay | sna-frontend-workbench | **PASS** | AC1, AC2 pass | AC#1, AC#2 pass | App.tsx, styles.css, App.test.ts |
| B1 | Runtime Provisioning Precheck | sna-browser-cdp | **PASS** | AC3, AC4 pass | AC#3, AC#4 pass | runtime-provisioning-precheck.ts (+test), main.ts |
| B2 | Auto-Provisioning (stretch) | sna-browser-cdp | **PASS** | AC8 pass | AC#5 pass | chromium-provisioner.ts (+test), preload.ts |
| C | Clean-Machine Validation Runbook | sna-release-docs | **PASS** | AC6 pass | AC#6, AC#7 pass | windows-clean-machine-validation-2026-06-07.md |

**Total changed/added files:** 11 (5 existing modified, 6 new)

### What each deliverable does

**A — Startup Diagnostics Overlay:** When the app fails to start (missing Chromium runtime, missing dependencies), the renderer shows a visible diagnostic banner with: heading ("Startup blocked"), sanitized reason, next-step instructions, sanitized log path link, and a "Copy diagnostic" button. Copy-to-clipboard redacts all paths, secrets, URLs, fingerprints, and credentials via 16-rule `sanitizeOperatorDiagnosticText()`.

**B1 — Runtime Provisioning Precheck:** When "Start QA Chromium" is clicked, the Electron main process first checks for `chrome.exe` at `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`. If missing, returns `{blocked: true, blockedReason: "dedicated-browser-runtime-missing"}` to the renderer — no silent failure. The diagnostic overlay (A) displays this with clear instructions.

**B2 — Auto-Provisioning (stretch, implemented):** When the runtime is missing, the diagnostic overlay offers "Download Chrome for Testing automatically". After explicit user confirmation, downloads from the official Google Chrome for Testing metadata endpoint, shows a progress bar with percentage, extracts via PowerShell `Expand-Archive`, and auto-retries the browser launch on completion. Error state with retry button if download fails.

**C — Clean-Machine Validation Runbook:** `docs/test/windows-clean-machine-validation-2026-06-07.md` — 22-step runbook covering unzip → double-click → diagnostic overlay observation → Chromium provisioning → Start QA Chromium launch → CDP readiness verification → Verify read-only test. Includes expected diagnostics for each failure mode, safety instructions, and return channel.

---

## 2. Gate Results (Verified during AF2 and AF3)

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | PASS | All 7 workspace projects build |
| `pnpm typecheck` | PASS | All 7 packages/apps pass `tsc --noEmit` |
| `pnpm test` | **412/412 PASS** | Up from 389/389 at AE7; 31 test files across 7 packages/apps |
| `pnpm privacy:scan` | PASS | 273 files pass |

---

## 3. Package State (Unchanged from AE7)

| Property | Value |
|----------|-------|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` |
| SHA256 | `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde` |
| Size | 118,590,385 bytes (~114 MB) |
| mtime | 2026-06-07 02:00 CST |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` |
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` |
| SHA256 on disk | **Verified match** |

No new package was built during AF1 — the AE7 package is still the latest.

---

## 4. What Changed — Summary Table

| Area | Before AF1 | After AF1 |
|------|-----------|-----------|
| **Chromium runtime missing** | Silent failure (no visible effect) | Diagnostic overlay: "Startup blocked — dedicated browser runtime unavailable" + next-step instructions |
| **Start QA Chromium click** | No effect on clean machine | Precheck returns blocked reason → overlay shows with "Download Chrome for Testing automatically" option (B2) or manual instructions |
| **Auto-provisioning** | Not implemented | Confirmation dialog → progress bar → auto-retry on completion |
| **CDP chip on missing runtime** | Stayed "disconnected" | Transitions to "error" state with diagnostic text |
| **Clean-machine validation** | AB1 runbook (ab package, pre-AF1, dev-toolchain assumption) | AE package, covers diagnostic overlay + precheck + auto-provisioning, clean-machine prerequisites |
| **Test count** | 389/389 | 412/412 (new runtime precheck + provisioner tests) |
| **Privacy scan** | 273 files pass | 273 files pass (no new privacy regressions) |

---

## 5. What Alan Should Test

Alan must execute **`docs/test/windows-clean-machine-validation-2026-06-07.md`** on a clean Windows machine with no Node.js, no pnpm, no WSL, no uv. Minimal hardware requirement: Windows 10/11 with File Explorer.

### Priority test path

1. **Double-click launch:** Extract the ZIP, double-click `ServiceNow Automation.exe`. Expected: app opens to three-column layout, or diagnostic overlay if startup blocked.
2. **Missing runtime diagnostics:** If app starts but Chromium is not provisioned, click "Start QA Chromium". Expected: diagnostic overlay shows "dedicated browser runtime unavailable" with the `%LOCALAPPDATA%` runtime path and instructions to run `prepare-chrome-for-testing.ps1` (or click "Download automatically").
3. **Auto-provisioning (alternative):** Click "Download Chrome for Testing automatically". Expected: confirmation dialog → download progress bar → auto-extract → auto-retry launch.
4. **Manual provisioning (alternative):** Open PowerShell (as user, not admin), navigate to the extracted app folder, run `.\scripts\windows\prepare-chrome-for-testing.ps1`. Expected: Chrome for Testing downloads to `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`.
5. **Re-launch after provisioning:** Close and re-launch `ServiceNow Automation.exe`. Click "Start QA Chromium". Expected: dedicated Chromium window opens visibly. CDP chip transitions disconnected → connecting → connected. "Verify current Incident" button becomes enabled.
6. **Verify read-only:** Click "Verify current Incident". Expected: read-only inspection — no fields filled, no pages submitted, no tickets modified.

### Do NOT test (red zone)
- Live ServiceNow login, real ticket operations
- Field autofill, Save/Submit/Update/Resolve/Close
- Browser artifact capture (screenshots, HAR, trace, video)
- Cookie/session/storage-state manipulation
- Git push, PR creation, merge, tag, GitHub Release

---

## 6. Remaining Risks

1. **Clean-machine validation not yet executed.** All ACs are code-review and test-verified, but no actual clean Windows hardware has been tested.
2. **MSVC++ Redistributable dependency.** Electron on Windows requires the MSVC++ Redistributable. Not bundled. If missing, the app will crash before the renderer loads (no diagnostic overlay possible at this stage). Workaround documented in runbook.
3. **PowerShell execution policy.** Default Windows PowerShell settings may block the provisioning script. Workaround documented: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.
4. **WSL UNC path in handoff panel.** The release handoff panel exposes Alan's WSL UNC path — this is intentional operational content for Alan's own use but contains a real hostname (`alanxwsl`). Non-blocking for AF1 per AF3 audit.

---

## 7. What is Out of Scope (Unchanged from AF1 Scope)

- Live ServiceNow login, API writes, browser automation
- Save/Submit/Update/Resolve/Close automation
- Windows installer, MSI, signed executable, auto-update
- Cross-platform support (macOS, Linux)
- New demo scenarios or scenario library rework
- UI redesign of the three-column operator workbench layout
- Performance benchmarks, load testing

---

## 8. Parent Gate Summary

| Phase | Verdict | Key Results |
|-------|---------|-------------|
| AF1 Scope | COMPLETE | Definition only — 3 deliverables mapped, minimum viable path defined |
| AF2 QA | **PASS** | 8/8 ACs met, 412/412 tests, build/typecheck/privacy pass |
| AF3 Privacy | **APPROVE** | 7/7 ACs met, no blocking issues, 273 files pass privacy scan |

---

*This document was produced by `sna-release-docs` for AF4 release summary and handoff. No code change, merge, tag, push, release, or ServiceNow action was performed.*
