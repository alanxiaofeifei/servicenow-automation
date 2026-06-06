# Windows clean-machine validation runbook (AF1 refresh)

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Package:** `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip`
**Profile:** `sna-release-docs`
**Status:** Runbook — products not yet tested (Alan must execute)

---

## 1. Purpose

This runbook validates that the packaged Windows Electron artifact (the `ae` package)
can be extracted and launched on a **clean Windows machine** that has **no Node.js,
no pnpm, no WSL, no developer toolchain**. The only prerequisite is a Windows
machine with File Explorer and the ability to extract a ZIP archive.

The goal is to confirm the full double-click-to-functionality path, including
the new AF1 startup diagnostics overlay and Chromium runtime provisioning precheck:

- App starts without crash on a clean machine
- If startup fails, a visible diagnostic overlay explains why
- After provisioning Chromium for Testing, Start QA Chromium launches a visible
  dedicated Chromium window
- CDP readiness chip shows "connected"
- Verify button becomes enabled and performs a read-only inspection

This runbook replaces the AB1-phase runbook from the same date. All prior
validation assumed the tester had a WSL development environment. This runbook
closes that gap and covers the new AF1 deliverables.

---

## 2. Prerequisites

| Item | Required | Notes |
|------|----------|-------|
| Windows 10 or 11 | Yes | Home or Pro; 64-bit |
| 500 MB free disk space | Yes | After extraction |
| File Explorer | Yes | Built-in |
| ZIP extraction tool | Yes | Windows built-in `Expand-Archive` or 7-Zip |
| Internet connection | Yes (for runtime provisioning) | Required to download Chrome for Testing via `prepare-chrome-for-testing.ps1` |
| Administrator access | No | The app does not require admin |
| Node.js / pnpm / WSL / uv | **No** | This is the whole point — test without these |
| Visual Studio / MSVC tools | **No** | Not needed |

**What a clean machine means:** No developer toolchain at all. If this machine has
ever had Node.js, WSL, or Chrome/Edge for development, the test is invalid.
Use a truly clean Windows VM or a colleague's non-dev machine.

---

## 3. Package location

The `ae` Windows local package to test:

**Windows UNC path (paste into File Explorer):**
```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip
```

**SHA-256 checksum:**
```text
4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde
```

**File size:** 118,590,385 bytes (~114 MB)

**Gate status (AE7-verified before AF1 implementation):**
- Build: PASS
- Typecheck: PASS
- Test: 389/389 PASS
- Privacy:scan: PASS

**What is inside:**
- `ServiceNow Automation.exe` — packaged Electron app
- `resources/app.asar` — bundled web app + Node modules
- `resources/scripts/windows/` — helper PowerShell scripts (including
  `prepare-chrome-for-testing.ps1`)
- `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` — safety
  instructions (read this first)
- Electron runtime files (DLLs, locales, Chromium binary, etc.)

---

## 4. Validation steps

### 4.1 Copy and extract

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open File Explorer and paste the UNC path from §3 | The zip file appears in the file listing | |
| 2 | Copy the zip to a local folder (e.g., Desktop) | File copies without error | |
| 3 | Right-click → Extract All (or use 7-Zip) | Creates a folder named `servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local` | |
| 4 | Open the extracted folder | Contains `ServiceNow Automation.exe` and many DLL/locale files. Also contains `START-HERE-WINDOWS.txt` | |
| 5 | **Read** `START-HERE-WINDOWS.txt` | Safety instructions visible. No WSL paths, no Node commands | |

**Verify:** No `node_modules/`, no `.git/`, no `pnpm-workspace.yaml`, no WSL paths
anywhere inside the extracted folder.

### 4.2 Double-click launch

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 6 | **Double-click** `ServiceNow Automation.exe` | A new window opens within 3–10 seconds | |
| 7 | Check the window title | Window title says **"ServiceNow Automation"** | |
| 8 | Check the window size | Window is approximately 1320×900 pixels, three-column layout visible | |
| 9 | A Windows SmartScreen prompt may appear | Expected for an unsigned executable. Click **"Run anyway"** or **"More info → Run"** | |

**PASS criteria:**
- The application window opens without a crash dialog
- The title reads "ServiceNow Automation"
- A three-column layout is visible (left nav, center workbench, right actions)

**FAIL criteria:**
- A Windows error dialog appears: "The application was unable to start correctly"
- The window opens and immediately closes (crash on startup)
- An error about missing VCRUNTIME140.dll or similar MSVC redistributable
- A .NET Framework installation dialog (this app does not use .NET)

### 4.3 Startup diagnostic overlay (AF1-A)

This step tests the new startup diagnostics overlay. It only applies if the
app fails to start or shows a diagnostic message after launch.

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 10 | If the app shows a **diagnostic overlay** covering the center area | The overlay has: a heading ("Startup blocked" or similar), a one-line reason (e.g., "Chromium runtime not found"), a recommended next step, and a "Copy diagnostic" button | |
| 11 | Read the reason text | It should be plain language, no raw stack traces, no raw file paths beyond `%LOCALAPPDATA%\ServiceNowAutomation`, no ServiceNow URLs, no credentials | |
| 12 | Click **"Copy diagnostic"** | Only sanitized text is copied to clipboard — no secrets, no raw paths, no sys_ids | |
| 13 | Dismiss the overlay | The overlay closes and the app continues to the runtime rail | |

**Expected diagnostic reasons:**

| Condition | Expected diagnostic heading | Expected text | Next step in overlay |
|-----------|---------------------------|---------------|---------------------|
| Chromium runtime not found at `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe` | "Startup blocked" or "Runtime not found" | "Browser runtime not found at tool-owned path" | "Run `prepare-chrome-for-testing.ps1` from the `resources/scripts/windows/` folder" |
| Missing MSVC redistributable (app crash on double-click) | No overlay — app crashes before renderer loads | N/A (crash dialog only) | Check Windows Event Viewer |
| Permissions issue (cannot write to `%LOCALAPPDATA%`) | "Startup blocked" or "Permissions error" | "Cannot access the runtime directory. Check folder permissions." | "Run the app as normal user (not Administrator). Check Windows Defender exclusions." |

**If no diagnostic overlay appears:** That is also OK — it means the app started
without any startup-blocking condition. Proceed to §4.4.

### 4.4 Chromium runtime provisioning

The Chromium for Testing runtime is **not** bundled in the zip. It must be
downloaded and extracted using the included provisioning script.

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 14 | Open a **PowerShell** window (as normal user, **not** Administrator) | PowerShell opens at a prompt | |
| 15 | Navigate to the extracted package folder: `cd "$env:USERPROFILE\Desktop\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local"` | No error | |
| 16 | Run: `.\resources\scripts\windows\prepare-chrome-for-testing.ps1` | Script downloads Chrome for Testing from the official Google endpoint. A progress indicator or text output appears | |
| 17 | Wait for the script to complete | Completion message appears: "Chrome for Testing installed at %LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe" | |
| 18 | Verify the runtime exists: `Test-Path "$env:LOCALAPPDATA\ServiceNowAutomation\Runtime\Chromium\chrome.exe"` | Returns `True` | |

**If the download fails:**
- Check internet connectivity
- Try running PowerShell **as Administrator** if a permissions issue blocks extraction
- If the script fails with a PowerShell execution policy error, run:
  `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
  then retry step 16

### 4.5 Launch Start QA Chromium — CDP readiness verification (AF1-B1)

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 19 | Close the app window if it is still open, then **double-click** `ServiceNow Automation.exe` again | App re-launches | |
| 20 | In the right column, click **Start QA Chromium** | A dedicated Chromium window opens visibly (not hidden behind other windows) | |
| 21 | Wait 3–5 seconds | The **CDP readiness chip** (in the runtime rail, near Start QA Chromium) transitions from "disconnected" → "connecting" → "connected" | |
| 22 | Confirm the chip shows **"connected"** | Green or "connected" state visible | |
| 23 | Check the **Verify current Incident** button | It becomes **enabled** (not grayed out) | |

**If Start QA Chromium has no visible effect:**
- This was the P0 gap that AF1 was built to fix
- Check whether the diagnostic overlay appeared (see §4.3)
- The diagnostic should show "Chromium runtime not found" — go back to §4.4
- If the diagnostic shows a different reason, record the exact text

### 4.6 Verify current Incident (read-only)

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 24 | Click **Verify current Incident** | A verification inspection runs against the current page in the dedicated Chromium window | |
| 25 | Confirm it is **read-only** | No fields are filled, no pages are submitted, no tickets are modified | |
| 26 | Check the verification result | Read-only summary is shown. The app does not write to ServiceNow | |

**Key safety check:** After Verify completes, confirm there is NO:
- Save / Submit / Update / Resolve / Close button or action
- Field autofill or modification
- Navigation to real ServiceNow that could trigger a write

---

## 5. Expected diagnostics for each failure mode

| Failure mode | What the user sees | Expected diagnostic | Action |
|-------------|-------------------|---------------------|--------|
| Chromium runtime not provisioned | Startup diagnostic overlay appears | "Browser runtime not found. Run `prepare-chrome-for-testing.ps1` from the scripts folder." | Run §4.4, then §4.5 |
| No internet (runtime download fails) | PowerShell script shows download error | N/A (PowerShell error, not app diagnostic) | Check connection, retry |
| Missing MSVC redistributable (VCRUNTIME140.dll) | App crash dialog on double-click | No app diagnostic (crash is before renderer) | Install VC++ redistributable from Microsoft, or check Event Viewer |
| Windows Defender blocks the .exe | SmartScreen dialog | No app diagnostic | Click "Run anyway" |
| Permissions — cannot write to AppData | Startup diagnostic overlay appears | "Cannot access runtime directory. Check folder permissions." | Run as normal user; add Windows Defender exclusion for `%LOCALAPPDATA%\ServiceNowAutomation` |
| CDP connection fails after Chromium launches | CDP chip stays on "connecting" or shows "error" | Chip shows "error" with brief reason | Check whether the Chromium window opened on a different display. Close and retry. |
| SmartScreen blocks the download | Windows shows a download-blocked dialog | No app diagnostic | Click "Keep" or "Show more → Keep anyway" |

---

## 6. What Alan should record

**Do not record:**
- ❌ Screenshots of real ServiceNow pages (there should not be any)
- ❌ Cookies, sessions, HAR files, storage state
- ❌ Raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups
- ❌ Credentials, tokens, or approval phrases
- ❌ Full diagnostic overlay text if it contains raw paths (copy only the sanitized "Copy diagnostic" text)

**Do record:**
- ✅ Whether each step in §4 passed or failed
- ✅ Exact error text from dialogs or the diagnostic overlay (use "Copy diagnostic" button)
- ✅ How long the app took to start
- ✅ Whether the CDP chip showed "connected" after provisioning
- ✅ Whether the Verify button became enabled
- ✅ Whether Verify was read-only (no fills, no submits)
- ✅ Any console errors visible in DevTools (text only)
- ✅ Whether Windows Defender / SmartScreen blocked anything
- ✅ Whether the PowerShell provisioning script succeeded or failed

**Return channel:** Report pass/fail results with notes to Alan by:
1. Recording pass/fail in the §4 table above
2. Adding any failure notes
3. Sending the results to the engineering team via Teams or the project channel

---

## 7. Pass/fail criteria

### Overall PASS

All of the following must be true:
- [ ] The zip extracts without errors on Windows (no WSL involved)
- [ ] Double-clicking `ServiceNow Automation.exe` opens a window
- [ ] The window title is "ServiceNow Automation"
- [ ] The three-column layout is visible
- [ ] The `prepare-chrome-for-testing.ps1` script runs and provisions Chromium
- [ ] After re-launch, Start QA Chromium opens a visible Chromium window
- [ ] The CDP readiness chip shows "connected"
- [ ] The Verify button becomes enabled
- [ ] Verify current Incident is read-only (no fills, no submits)
- [ ] No Save/Submit/Update/Resolve/Close buttons exist in the UI
- [ ] The safety text is visible in the UI

### Overall FAIL

Any of the following:
- [ ] The app crashes on startup (cannot open at all)
- [ ] The app requires Node.js, pnpm, or WSL to run
- [ ] The app attempts to write to a real ServiceNow instance
- [ ] A security prompt that cannot be bypassed blocks app launch
- [ ] Missing MSVC runtime DLL prevents startup
- [ ] The zip contains developer-only files (node_modules, .git, pnpm config)
- [ ] Start QA Chromium has no visible effect **after** Chromium runtime is provisioned

### Partial PASS (document)

If the app starts and shows its UI but the Chromium runtime cannot be provisioned
(e.g., no internet, PowerShell blocked by policy):
- The provisioning is a one-time setup — a machine with internet should be able to complete it
- Record the exact reason and whether manual download workaround was attempted
- The P0 chain is not unblocked until the full CDP flow works

---

## 8. Safety — what NOT to do in this session

| Do NOT do | Why |
|-----------|-----|
| Test against live ServiceNow | This build is not connected to a real ServiceNow instance for QA. All operations are local/mock. |
| Fill any fields in the dedicated Chromium window | The Verify action is read-only inspection only. Autofill is not tested in this session. |
| Click Submit, Save, Update, Resolve, or Close | These actions are never automated by this project. They do not exist in the UI (if they do, report it). |
| Navigate to a real ServiceNow URL in the Chromium window | The browser is only for CDP connectivity testing. Real ServiceNow navigation needs separate approval. |
| Log in to any production system | This is a clean-machine validation. No production credentials should be used. |
| Capture screenshots of real data | Only sanitized diagnostic text should be recorded. No screenshots of dialogs containing raw paths or ticket data. |
| Push, merge, tag, or release from this branch | Git operations are not part of validation. |
| Install Node.js, pnpm, or WSL to "fix" a failing step | That invalidates the clean-machine test. Record the failure and report it. |

---

## 9. If validation fails

If any step fails, do the following:

1. **Record the exact error text** from the dialog or diagnostic overlay (use "Copy diagnostic" if available)
2. **Check Event Viewer** for application error details:
   `eventvwr.msc` → Windows Logs → Application
3. **Try running with `--no-sandbox`** from a Command Prompt in the extracted folder:
   ```cmd
   "ServiceNow Automation.exe" --no-sandbox
   ```
4. **Open DevTools** (Ctrl+Shift+I) after the window opens and check the Console tab
5. **Report to engineering** with:
   - What step failed
   - What you saw vs what you expected
   - The exact error text (no screenshots with real data)
   - Whether `--no-sandbox` made a difference
   - Whether SmartScreen blocked the initial launch
   - Whether `prepare-chrome-for-testing.ps1` succeeded or failed

Do **not** retry with real ServiceNow after a failure. All operations here are local.

---

## 10. Open question for engineering

1. **MSVC redistributable.** Electron on Windows requires the MSVC++ Redistributable.
   The packaged zip does not bundle it. If the clean machine lacks it, the app will
   not start. This should be documented in START-HERE-WINDOWS.txt. If encountered,
   install from: https://aka.ms/vs/17/release/vc_redist.x64.exe

---

## Appendices

### A. Expected extracted folder structure (top level)

```
ServiceNow Automation.exe     (the app, ~114 MB)
LICENSE.electron.txt
LICENSES.chromium.html
chrome_100_percent.pak
chrome_200_percent.pak
d3dcompiler_47.dll
ffmpeg.dll
icudtl.dat
libEGL.dll
libGLESv2.dll
locales/                       (67 locale .pak files)
resources.pak
resources/
  app.asar                     (bundled web app)
  scripts/
    local-cdp-bridge.py
    windows/
      Start-ServiceNow-Automation.cmd
      evaluate-local-cdp-expression.ps1
      install-cloakbrowser-runtime.ps1
      prepare-chrome-for-testing.ps1
      start-dedicated-chromium-cdp.ps1
snapshot_blob.bin
v8_context_snapshot.bin
vk_swiftshader.dll / .json
vulkan-1.dll
servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt
```

### B. Key product safety boundaries (in-app)

The app enforces these at runtime — confirm they are present and correct:

- "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow."
- No Save/Submit/Update/Resolve/Close buttons in the UI
- Verify and Autofill buttons are disabled until CDP browser is connected
- If Chromium runtime is missing, the diagnostic overlay shows a clear reason
  and next step — no silent failure
- Verify is read-only: it inspects but does not fill or submit
