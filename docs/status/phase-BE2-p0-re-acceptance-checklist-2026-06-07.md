# Phase BE2 — P0 Re-Acceptance Checklist

**Date:** 2026-06-07
**Target package:** BE6 (cumulative — AE through BD)
**Alan:** Use this checklist to re-validate all 8 P0 criteria from PR #97.

**Safety:** Do NOT test live ServiceNow. Do NOT fill fields. Do NOT click Save/Submit/Update/Resolve/Close. Only use the Verify (read-only) button.

---

## P0 checklist — expected behavior, verification, and pass condition

| # | P0 criterion | Expected behavior | Implemented in | Verification step (Alan) | Pass condition | Pass/Fail |
|---|-------------|-------------------|----------------|--------------------------|---------------|-----------|
| 1 | Windows double-click launches app | Double-clicking `ServiceNow Automation.exe` opens a window without crash | AE (electron-builder packaging) | Extract the BE6 ZIP on a clean Windows machine; double-click the .exe | Window opens within 3–10s, title reads "ServiceNow Automation" | ☐ |
| 2 | Startup failure shows sanitized diagnostics | If startup is blocked, a visible overlay explains why in plain language — no raw stack traces | AF1-A (App.tsx diagnostic overlay) | Open a Powershell, delete (or rename) the `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\` folder, launch the app again | Overlay shows "Browser runtime not found" with a next-step recommendation and a "Copy diagnostic" button | ☐ |
| 3 | Start QA Chromium opens visible dedicated Chromium window | Clicking "Start QA Chromium" opens a separate Chromium for Testing window (not hidden, not silent) | AF1-B1 (precheck) + AF1-B2 (auto-provisioning) | Run `prepare-chrome-for-testing.ps1` (runbook §4.4), then launch app and click "Start QA Chromium" | A visible Chromium window opens; the CDP chip transitions from "disconnected" → "connecting" → "connected" | ☐ |
| 4 | CDP readiness visible in app | A chip or indicator in the runtime rail shows the CDP connection status | AD3 (CDP chip) + AN (polish) | After Start QA Chromium succeeds, look at the runtime rail | Chip shows green "connected" state | ☐ |
| 5 | Verify enables only after CDP readiness | "Verify current Incident" button is disabled (grayed out) until CDP is "connected" | AQ + AP (runtime gating logic) | Before starting Chromium, check Verify button is disabled. After connected, check again. | Before: disabled/gray. After: enabled/clickable. | ☐ |
| 6 | Verify-only is read-only (no writes) | Verify inspects the page but never fills fields, never submits, never calls Save/Update/Resolve/Close | Runtime action contract (Verify action) | Click Verify after CDP connects. Confirm no fields were filled, no navigation to ServiceNow URLs occurred, no Save/Submit buttons exist. | Verification result shows read-only summary. No autofill, no navigation to real ServiceNow. | ☐ |
| 7 | Three-column Operator Workbench | The UI shows three columns: left (nav/history/settings), center (workbench/detail), right (runtime actions/status) | AN1-AN7 (visual polish) | After app launches, visually inspect the layout | Three distinct column regions visible with column headers. Left = source/nav, center = source detail, right = runtime actions. | ☐ |
| 8 | Packaged Windows artifact path is correct | The handoff card shows a local Windows-accessible UNC path (dynamic, not hardcoded Ubuntu-Compact) | AE7 (handoff card) + BD3 (dynamic UNC prefix) | In the app, look at the release-readiness handoff card or the package-info section | The path shown uses the correctly derived WSL distro name (not hardcoded). Path is `\\wsl.localhost\<distro>\...\servicenow-automation-...-be6-...-local.zip` | ☐ |

---

## Runbook refresh diff (AE-era → BD6/BE6)

| Aspect | AE-era (AD1 runbook, 9abd3eb) | BD6/BE6 runbook |
|--------|-------------------------------|-----------------|
| Package | `ac4` / no diagnostic overlay | `bd6` → `be6` |
| Startup diagnostics | Not covered | §4.3 — full diagnostic overlay verification (3 sub-steps + expected reasons table) |
| Chromium provisioning | Optional, no script path | §4.4 — exact PowerShell commands, failure recovery |
| CDP readiness | Not covered | §4.5 — chip states: disconnected → connecting → connected |
| Verify gating | Not covered | §4.5 step 23 — Verify button enables only after CDP connected |
| Three-column layout | Not referenced | §4.2 step 108 — "three-column layout visible" |
| Verify read-only safety | Not covered | §4.6 step 25 — "Confirm it is read-only" + safety checklist |
| Dynamic UNC path | Not referenced | §3 — dynamic `\\wsl.localhost\Ubuntu-Compact\...` path in runbook |

---

## BC7 closure statement

BC7 was **BLOCKED** with 2 test failures (safety-boundary copy assertion, release-readiness UNC path assertion) and the BC6 ZIP was never built because the gate halted. Both test failures were resolved in subsequent BD phases — by BD7, 455/455 tests pass. All BC implementation (Open checklist button wiring, runbook refresh) is present in the BD6/BE6 cumulative package. BC7 is **SUPERSEDED** by BE7.

---

## Reminders

- ❌ No live ServiceNow testing — all operations are local/mock
- ❌ No field filling, no Save/Submit/Update/Resolve/Close
- ❌ No real ServiceNow URLs, ticket IDs, sys_ids, or credentials in recorded results
- ✅ Record only pass/fail per criterion, exact error text (sanitized), and any blockers
