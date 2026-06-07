# Phase AF1 — Windows Operator Packaging + Dedicated Chromium Runtime Readiness — Scope Definition

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**AE7 base:** `923b67b` (AE7 final local readiness gate) + working-tree AE1-AE7 phase artifacts
**Profile:** `sna-orchestrator`

---

## 1. Why this phase — the P0 gap after AE7

AE7 delivered the release-readiness handoff panel (handoff card with UNC path, SHA256, mtime, change summary, copy-to-clipboard buttons) and a fresh `ae` Windows local package. The gates passed: build, typecheck, 389/389 tests, privacy scan.

**Manual acceptance (PR #97) failed.** The P0 criteria that Alan validated did not pass:

| P0 goal | Status after AE7 | Gap |
|---------|-----------------|-----|
| Windows double-click opens the desktop app | Package exists, but no clean-machine validation has been performed | **Unvalidated** — the `ae` package may or may not launch correctly on a clean Windows machine. No documented clean-validation result. |
| Startup failures show visible sanitized diagnostics | Not implemented. Current app startup on error shows Electron crash/blank window. No visible diagnostic overlay. | **Missing** — if the app fails to start (missing runtime, missing deps, permissions), the user sees nothing actionable. |
| Start QA Chromium visibly opens the dedicated/tool-owned Chromium window | CDP "Start QA Chromium" button exists but had **no visible effect** during manual acceptance. | **Broken** — the button does not actually launch a visible Chromium window. Likely root cause: dedicated Chromium runtime is not provisioned (Chrome for Testing not downloaded/extracted), OR the launch path resolution fails, OR the Electron `shell.openPath` / child-process path has a runtime error. |
| CDP readiness is visible in the app | AD3 added a CDP readiness chip (disconnected/connecting/connected/error) in the runtime rail. | **Not tested end-to-end** — because Start QA Chromium did not visibly launch, the chip stayed on "disconnected" or never transitioned. |
| Verify current Incident becomes enabled only after CDP readiness | Button stayed disabled during manual acceptance. | **Expected failure** — CDP was never ready. The gating logic may be correct, but the launch step is broken. |
| Verify-only performs read-only inspection | Could not be tested — never reached this step. | **Blocked** — gated on the two failures above. |
| Three-column Operator Workbench replaces the overloaded vertical flow | UI was **not accepted** as a real three-column layout during manual acceptance. | **Unclear** — this may be a visual/UX gap (the CSS grid that defines three columns isn't recognizable as a proper three-column layout) or a quality expectation mismatch. |
| Packaged Windows artifact path is designed and verified or honestly marked blocked | Handoff card shows the UNC path. Package exists with verified SHA256. | **Needs clean-machine verification** — the path design works on Alan's WSL machine but has never been validated on a clean Windows machine (no Node, no pnpm, no WSL, no uv). |

**The P0 gap chain is clear:**

```
Clean-machine validation never run
  → Startup diagnostics missing (no visible reason when app fails)
    → Chromium runtime not provisioned on clean machine
      → Start QA Chromium has no visible effect
        → CDP readiness stays disconnected
          → Verify stays disabled
            → Autofill cannot be tested
```

AF1 breaks this chain from the bottom: **fix the runtime provisioning and launch path** so Start QA Chromium actually works, then validate that the packaged app launches on a clean machine.

---

## 2. Current state — what exists today

### Packaging state

| Property | Value |
|----------|-------|
| Latest package | `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` |
| SHA256 | `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde` |
| Size | 118,590,385 bytes (~114 MB) |
| mtime | 2026-06-07 02:00:01 CST |
| Gate status (AE7-verified) | build PASS, typecheck PASS, test 389/389 PASS, privacy:scan PASS |
| Conclusion | READY FOR ALAN MANUAL VALIDATION ONLY — but manual validation failed |

### What the package contains

- `ServiceNow Automation.exe` — Electron app (packaged)
- `app.asar` — application bundle (AE phase: handoff card + CDP chip + center states)
- `START-HERE-WINDOWS.txt` — safety instructions
- `Start-ServiceNow-Automation.cmd` — WSL fallback launcher
- `start-dedicated-chromium-cdp.ps1` — CDP launch script (Windows-side)
- `local-cdp-bridge.py` — CDP bridge helper (Python)
- `install-cloakbrowser-runtime.ps1` — CloakBrowser runtime installer
- `prepare-chrome-for-testing.ps1` — Chrome for Testing installer

### Runtime readiness state

| Component | Status | Evidence |
|-----------|--------|----------|
| Chrome for Testing download script | EXISTS | `scripts/windows/prepare-chrome-for-testing.ps1` |
| Chrome for Testing provisioning | **NOT RUN (assumed)** | No evidence that this was executed on Alan's Windows machine. Test-Path at `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe` returned False during earlier prechecks. |
| CloakBrowser installer | EXISTS | `scripts/windows/install-cloakbrowser-runtime.ps1` |
| Dedicated Chromium CDP launch script | EXISTS | `scripts/windows/start-dedicated-chromium-cdp.ps1` |
| Electron launch path for Chromium | EXISTS in app code | Apps/desktop/src references dedicated runtime paths |
| CDP readiness indicator (chip) | EXISTS | AD3 CDP chip (4 states) rendered in runtime rail |
| Verify button gating on CDP | EXISTS | Gating logic present — stays disabled until CDP ready |
| Autofill buttons | EXISTS | Gated behind Verify + CDP readiness |

### What failed in manual acceptance

From project guardrails:

1. **"Start QA Chromium had no visible effect"** — The Chromium runtime is not provisioned on Alan's Windows machine. `prepare-chrome-for-testing.ps1` was never run, or failed silently. The Electron main process cannot find `chrome.exe` at the expected tool-owned path, so it either errors silently or falls through to an empty launch path.

2. **"Verify current Incident stayed disabled"** — Expected consequence of (1). The gating logic is likely correct.

3. **"Autofill could not be tested"** — Expected consequence of (1)+(2).

4. **"UI was not accepted as a real three-column Operator Workbench"** — This may be a visual quality issue. The current CSS grid creates three columns but perhaps the visual design doesn't read as a proper operator workbench (no clear column headers, no distinct spacing, no visual hierarchy). This is a separate concern from the runtime chain.

---

## 3. AF1 scope — three deliverables

### 3.1 Deliverable A — Startup Diagnostics Overlay

**Problem:** If the packaged app fails to start on a clean Windows machine (no runtime, missing deps, permissions), the user sees a blank window, a crash dialog, or nothing at all. There is no sanitized diagnostic overlay explaining *why* it failed or *what to do next*.

**Goal:** Add a visible diagnostic overlay that renders in the Electron renderer when the main process detects a startup-blocking condition. The overlay must:
- Show a plain-language error heading (e.g., "Startup blocked")
- Show a one-line sanitized reason (e.g., "Chromium runtime not found at %LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe")
- Show a recommended next step (e.g., "Run `prepare-chrome-for-testing.ps1` from the scripts/windows folder")
- Show a link to the startup log path (sanitized — no real ServiceNow paths, no user home paths beyond the log directory)
- Show a "Copy diagnostic" button that copies only the sanitized text (no raw paths beyond the log folder, no real ServiceNow URLs, no credentials)
- Be dismissible after reading (does not block forever — user can close and fix the issue)

**Non-goals:**
- Changing the app startup flow or Windows event handling
- Adding network diagnostics, telemetry, or error reporting
- Changing Electron main process error handling (only the renderer overlay)
- Surfacing raw stack traces, file paths beyond the log directory, or unsanitized error messages
- Adding crash recovery or auto-restart

**Acceptance criteria:**
1. When `cdpEndpointReady` stays false AND the runtime launch has failed (Electron main process returns a blocked-reason), the renderer shows the diagnostic overlay instead of an empty runtime rail.
2. The overlay uses the same safety boundary rules as the existing CDP chip: no raw paths beyond `%LOCALAPPDATA%\ServiceNowAutomation`, no real ServiceNow URLs, no credentials.
3. The "Copy diagnostic" button copies only the sanitized text to clipboard — no secrets, no raw paths, no sys_ids.
4. All four mandatory gates pass (build, typecheck, test, privacy:scan).
5. No new IPC channels, preload extensions, or network calls.

**Likely scope:** `apps/desktop/src/App.tsx` (new diagnostic overlay component in the runtime rail section), `apps/desktop/src/styles.css` (diagnostic overlay styles), `apps/desktop/src/App.test.ts` (new tests for overlay rendering and copy sanitization)

**Change budget:** ~60 lines TSX + ~30 lines CSS + ~40 lines test = ~130 lines

**Assigned profile:** `sna-frontend-workbench`

**Dependencies:** None (standalone frontend change)

---

### 3.2 Deliverable B — Chromium Runtime Provisioning Verification and Auto-Provisioning

**Problem:** The Chromium for Testing runtime is not present on a clean Windows machine. The `prepare-chrome-for-testing.ps1` script exists but is never run automatically. The Electron app launches Start QA Chromium, finds no chrome.exe, and silently fails.

**Goal:** Two-part fix:

**Part B1 — Provisioning precheck in Electron main process:** When "Start QA Chromium" is clicked, the Electron main process first checks whether the dedicated Chromium runtime exists at the expected path (`%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`). If not found, instead of silently failing, it:
1. Returns a structured `{blocked: true, blockedReason: "RuntimeNotFound", blockedDescription: "Dedicated Chromium runtime not found."}` to the renderer.
2. Does NOT attempt to auto-provision (see Part B2 below).
3. The renderer startup diagnostic overlay (Deliverable A) displays this reason with a clear next step.

**Part B2 — Auto-provisioning helper (optional, hot-path):** If the Electron app detects that a tool-owned runtime directory exists but is empty or incomplete, it may attempt to auto-provision Chrome for Testing via a bundled minimal download-and-extract script. This is a stretch goal — the minimum viable behavior is B1 (fail visibly with a clear reason).

**Non-goals:**
- Auto-downloading Chrome for Testing without user consent (if auto-provision is attempted, it must show a confirmation dialog)
- Downloading from non-official Google Chrome for Testing endpoints
- Modifying user's daily Chrome/Edge or browser profiles
- Adding credential stores, automatic login, or session persistence
- Network operations from the renderer process (download stays in main process)

**Acceptance criteria (minimum — B1 only):**
1. When Start QA Chromium is clicked and the runtime path does not exist, the main process returns `{blocked: true, blockedReason: "RuntimeNotFound"}` to the renderer.
2. The renderer shows a sanitized diagnostic (via Deliverable A): "Chromium runtime not found at %LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe — run prepare-chrome-for-testing.ps1 from the scripts folder."
3. The CDP readiness chip transitions from "disconnected" to "error" with the same diagnostic.
4. No raw ServiceNow URLs, credentials, or real user paths are exposed in the error payload or diagnostic overlay.
5. When the runtime IS present, Start QA Chromium behaves as before (attempts launch — existing behavior).
6. All four mandatory gates pass.
7. No daily Chrome/Edge path is introduced as a fallback.

**Acceptance criteria (stretch — B2 auto-provisioning):**
1. A new Electron IPC handler allows the renderer to request automatic provisioning.
2. The main process downloads Chrome for Testing from the official Google metadata endpoint.
3. A progress/taskbar indicator shows download progress (optional — text indicator is sufficient).
4. After download and extraction, a second precheck confirms the runtime path exists.
5. The user is explicitly informed before any download starts.
6. All four mandatory gates pass.
7. No daily Chrome/Edge path fallback, no credential storage, no browser launch from the download script.

**Likely scope:** `apps/desktop/src/main.ts` or new `apps/desktop/src/main/chromium-provisioner.ts` (main-process provisioning precheck + optionally the download-extract logic), `apps/desktop/src/preload/index.ts` (new IPC if B2), `apps/desktop/src/App.tsx` (updated Start QA Chromium click handler), `apps/desktop/src/App.test.ts` (new tests for runtime-not-found path)

**Change budget (B1 only):** ~40 lines TypeScript + ~20 lines TSX + ~30 lines test = ~90 lines
**Change budget (B1 + B2):** ~120 lines + ~30 lines CSS/progress + ~50 lines test = ~200 lines

**Assigned profile:** `sna-browser-cdp`

**Dependencies:** Deliverable A (startup diagnostic overlay) — the diagnostics are consumed by it.

---

### 3.3 Deliverable C — Clean-Machine Package Validation Runbook (Refreshed)

**Problem:** The AB1-phase clean-machine validation runbook was written for the `ab` package (2026-06-06). It needs to be refreshed for the `ae` package (the latest), and it needs to explicitly cover:
- What to test on a clean machine (no Node, no pnpm, no uv, no WSL)
- What START-HERE-WINDOWS.txt should say
- How to verify the Chromium runtime is provisioned after running the setup script
- How to verify the double-click launch
- What to do if diagnostics show a runtime-not-found reason (reference the new diagnostic overlay)
- How to report results back

**Non-goals:**
- Performing the validation itself (Alan does this)
- Changing the packaging, layout, or installer mechanism
- Adding an auto-installer or setup wizard

**Acceptance criteria:**
1. Document exists at `docs/test/windows-clean-machine-validation-2026-06-07.md`
2. References the `ae` package by name and SHA256
3. Lists prerequisites (what NOT to install; what IS required)
4. Step-by-step: unzip → double-click → observe diagnostic overlay (if any) → run prepare-chrome-for-testing.ps1 → re-launch → confirm Start QA Chromium works → confirm CDP readiness chip shows "connected" → close
5. Includes expected diagnostics for each failure mode (missing runtime, missing deps, permissions)
6. Includes a return channel for Alan's results

**Likely scope:** 1 new file in `docs/test/`
**Change budget:** 1 file, ~100 lines of Markdown

**Assigned profile:** `sna-release-docs`

**Dependencies:** Deliverable A (diagnostic overlay) and Deliverable B (runtime precheck) — the runbook references both.

---

## 4. Pipeline and dependencies

```
Deliverable A (startup diagnostics)        → sna-frontend-workbench   [standalone]
                                                          ↓
Deliverable B1 (runtime precheck)           → sna-browser-cdp         [depends on A]
                                                          ↓
Deliverable B2 (auto-provisioning, stretch) → sna-browser-cdp         [depends on B1]
                                                          ↓
Deliverable C (clean-machine runbook)       → sna-release-docs        [depends on A + B1/B2]
                                                          ↓
AF1 Final review                          → sna-qa-acceptance        [depends on A + B + C]
                                                          ↓
AF1 Privacy/security audit                → sna-privacy-security     [depends on A + B + C]
                                                          ↓
AF1 Release summary                        → sna-release-docs        [depends on QA + privacy]
```

### Minimum viable path (P0 unblocking)

```text
Deliverable A ──→ Deliverable B1 ──→ Deliverable C ──→ QA → Privacy → Summary
```

This chain unblocks the critical failure: **Start QA Chromium has no visible effect**. With A + B1:
- If the runtime is missing, the user sees a clear diagnostic (`RuntimeNotFound` with next step).
- The user runs `prepare-chrome-for-testing.ps1` manually.
- After that, Start QA Chromium launches the dedicated Chromium window.
- CDP readiness chip shows "connected".
- Verify button enables.

### Stretch path (if B2 is desired)

```text
Deliverable A ──→ Deliverable B1 ──→ Deliverable B2 ──→ Deliverable C ──→ QA → Privacy → Summary
```

B2 adds auto-provisioning so the user doesn't need to manually run `prepare-chrome-for-testing.ps1`. This is a better UX but requires more implementation (download progress, confirmation dialog, error handling).

---

## 5. What is NOT in scope (AF1 red-zone)

| Item | Reason |
|------|--------|
| Live ServiceNow login, browser automation, API writes | Red-zone — requires explicit Alan approval |
| Save / Submit / Update / Resolve / Close automation | Red-zone — never automated |
| Microsoft Graph / Excel Web writes | Red-zone — out of scope for v0.x |
| Real Teams / Outlook / phone ingestion | Red-zone — no live data pipeline |
| Screenshots, HAR, trace, video capture from live ServiceNow | Red-zone — never automated |
| Cookie, session, storage-state capture or export | Red-zone — never automated |
| Git push, PR creation, merge, tag, GitHub Release | Requires explicit Alan approval card |
| Windows installer, MSI, auto-update, signed executable | Feature — not P0 recovery |
| Cross-platform support (macOS, Linux) | Out of scope for v0.x |
| New demo scenarios, scenario library rework | Feature — not P0 |
| New language translations beyond EN/zh-CN/es-ES | Scope creep |
| New runtime actions beyond Start QA Chromium / Verify / Autofill | Feature — not P0 |
| UI redesign of the three-column layout (visual polish) | Separate concern — not packaging/runtime |
| Performance benchmarks, load testing | Out of scope |

---

## 6. Gate policy

All implementation tasks (all deliverables) must pass:

| Gate | Command |
|------|---------|
| Build | `pnpm build` |
| Typecheck | `pnpm typecheck` |
| Test | `pnpm test` |
| Privacy | `pnpm privacy:scan` |

If any gate fails, the worker must STOP and block with sanitized evidence. No code moves past a red gate.

---

## 7. What Alan should test

After AF1 implementation, Alan should test on a **clean Windows machine** (no Node, no pnpm, no uv, no WSL):

1. **Clean-machine double-click:** Copy the `ae` package from the UNC path, extract, double-click `ServiceNow Automation.exe`. Expected: The app opens showing the three-column operator layout. If it fails to start, a visible diagnostic overlay appears explaining why.
2. **Startup diagnostics test:** On a machine with NO Chromium for Testing provisioned, click "Start QA Chromium". Expected: The diagnostic overlay shows "Chromium runtime not found" with the exact path expected and instructions to run `prepare-chrome-for-testing.ps1`.
3. **Runtime provisioning:** Run `prepare-chrome-for-testing.ps1` (from the extracted app folder). Expected: Chrome for Testing downloads and appears at `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`.
4. **Start QA Chromium (after provisioning):** Click "Start QA Chromium" again. Expected: A dedicated Chromium window opens visibly (not hidden). The CDP readiness chip transitions from "disconnected" → "connecting" → "connected".
5. **Verify button enables:** After CDP readiness shows "connected", the "Verify current Incident" button should become enabled.
6. **Verify-only is read-only:** Click "Verify current Incident". Expected: A verification inspection occurs (read-only). No fields are filled, no pages are submitted, no tickets are modified.
7. **Do NOT test:** Live ServiceNow login, real ticket operations, field autofill, Save/Submit/Update/Resolve/Close, browser artifact capture, or any write action.

---

## 8. Status

```text
Phase AF1 — WINDOWS OPERATOR PACKAGING + DEDICATED CHROMIUM RUNTIME READINESS — SCOPE

State: COMPLETE (definition only, no implementation)
Deliverable: this document

Downstream deliverables defined: 3
  - A: Startup diagnostics overlay               → sna-frontend-workbench  [standalone]
  - B1: Runtime provisioning precheck             → sna-browser-cdp        [depends on A]
  - B2: Auto-provisioning (stretch)               → sna-browser-cdp        [depends on B1]
  - C: Clean-machine package validation runbook   → sna-release-docs       [depends on A + B1]

Minimum viable path: A → B1 → C → QA → Privacy → Summary
Stretch path:       A → B1 → B2 → C → QA → Privacy → Summary

Red-zone items excluded: 12
Non-goals: 8

Latest artifact (AE7):
  servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip
  SHA256: 4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde
  Gate: READY FOR ALAN MANUAL VALIDATION ONLY (manual acceptance failed — P0 gaps)
```

This document defines scope only. No implementation, code change, merge, tag, push, release, or ServiceNow action was performed.
