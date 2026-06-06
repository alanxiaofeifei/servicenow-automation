# Windows clean-machine validation runbook

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Package:** `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip`
**Profile:** `sna-release-docs`
**Status:** Runbook — products not yet tested (Alan must execute)

---

## 1. Purpose

This runbook validates that the packaged Windows Electron artifact can be extracted
and launched on a **clean Windows machine** that has **no Node.js, no pnpm, no WSL,
no developer toolchain**. The only prerequisite is a Windows file explorer and
the ability to extract a ZIP archive.

The goal is **not** to validate every feature end-to-end. The goal is to confirm
that the double-click user path works — that the app starts, shows its UI,
and is usable via mock/demo workflows without any WSL or Node dependency.

This is the gap AB1 identified: all prior validation assumed the tester had a WSL
development environment. This runbook closes that gap.

---

## 2. Prerequisites

| Item | Required | Notes |
|------|----------|-------|
| Windows 10 or 11 | Yes | Home or Pro; 64-bit |
| 500 MB free disk space | Yes | After extraction |
| File Explorer | Yes | Built-in |
| ZIP extraction tool | Yes | Windows built-in `Expand-Archive` or 7-Zip |
| Internet connection | Optional | Only needed if the app tries to download a Chromium runtime (see §4) |
| Administrator access | No | The app does not require admin |
| Node.js / pnpm / WSL | **No** | This is the whole point — test without these |

---

## 3. Package location

The dated local package to test is:

**Windows UNC path (paste into File Explorer):**
```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
```

**SHA-256 checksum:**
```text
ea94272dd1a399c04851c26867e50dfd533affeb08953de2895ea308ebd786f1
```

**File size:** 118,588,267 bytes (~113 MB)

**What is inside (86 files, ~308 MB extracted):**
- `ServiceNow Automation.exe` (192 MB — the packaged Electron app)
- `resources/app.asar` (9.7 MB — bundled web app + Node modules)
- `resources/docs/` — bundled quickstart and manual test docs
- `resources/scripts/windows/` — CDP helper PowerShell scripts
- Electron runtime files (DLLs, locales, Chromium binary, etc.)

---

## 4. Validation steps

### 4.1 Copy and extract

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Open File Explorer and paste the UNC path from §3 | The zip file appears in the file listing | |
| 2 | Copy the zip to a local folder (e.g., Desktop) | File copies without error | |
| 3 | Right-click → Extract All (or use 7-Zip) | Creates a folder named something like `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local` | |
| 4 | Open the extracted folder | Contains `ServiceNow Automation.exe` and many DLL/locale files. Also contains `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` | |

**Verify:** No `node_modules/`, no `.git/`, no `pnpm-workspace.yaml`, no WSL paths anywhere inside the extracted folder.

### 4.2 Double-click launch

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 5 | **Double-click** `ServiceNow Automation.exe` | A new window opens within 3–10 seconds | |
| 6 | Check the window title | Window title says **"ServiceNow Automation"** | |
| 7 | Check the window size | Window is approximately 1320×900 pixels, three-column layout visible | |
| 8 | A Windows SmartScreen prompt may appear | This is expected for an unsigned executable. Click **"Run anyway"** or **"More info → Run"** | |

**PASS criteria:**
- The application window opens without a crash dialog
- The title reads "ServiceNow Automation"
- A three-column layout is visible (left nav, center workbench, right actions)

**FAIL criteria:**
- A Windows error dialog appears: "The application was unable to start correctly"
- The window opens and immediately closes (crash on startup)
- An error about missing VCRUNTIME140.dll or similar MSVC redistributable
- A .NET Framework installation dialog (this app does not use .NET)

### 4.3 Initial UI inspection

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 9 | Left column — check for source/queue items | At least one queue item or demo/load button visible | |
| 10 | Center column — workbench area | Shows cards or prompts to select a source | |
| 11 | Right column — runtime action buttons | Three buttons: **Start QA Chromium**, **Verify current Incident**, **Autofill current Incident** | |
| 12 | Look for safety text | Text somewhere visible: "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." | |
| 13 | Incident draft card (if visible) | No Save/Submit/Update/Resolve/Close buttons present | |
| 14 | Open DevTools console (Ctrl+Shift+I) | No red errors or crash dialogs. A few informational messages are OK. | |

### 4.4 Mock/demo workflow (no browser required)

These steps test the workbench without needing a real browser:

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 15 | Click any demo/load button (if present) | Workbench center shows cards in vertical order | |
| 16 | Check card order (top to bottom) | 1. Selected source → 2. Cleaned summary → 3. Incident draft → 4. Guided Review Path → 5. KB recommendations → 6. Monthly Excel fill queue | |
| 17 | Try typing in a draft field | Text appears in the text field | |
| 18 | Check Guided Review Path | Shows a numbered stepper with 6 steps | |
| 19 | Check KB recommendations | Shows KB article cards with text (not linking to real ServiceNow) | |
| 20 | Check Monthly Excel fill queue | Shows Queued/Deferred/Pending badge. No "Export to Excel" button visible | |

**If the card order is different from §4.4 step 16, report it immediately — the product is broken.**

### 4.5 Browser runtime (optional, requires Chromium)

**Note:** The app may need to download or find a Chromium runtime for browser automation features.
On a clean machine without Chrome/Edge installed, the CDP helper scripts in `resources/scripts/windows/`
may attempt to install a tool-owned Chromium runtime under `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\`.
This is expected and acceptable.

| Step | Action | Expected result | Pass/Fail |
|------|--------|-----------------|-----------|
| 21 | Click **Start QA Chromium** | App shows status "QA Chromium launch" (or similar). A new Chromium window opens | |
| 22 | Wait a few seconds | **Verify current Incident** button becomes enabled | |
| 23 | Close the Chromium window | The app should detect the browser closed and disable Verify/Autofill buttons | |

**If the browser does not start:**
- This is acceptable if the clean machine has no Chrome version compatible with the bundled Chromium driver
- The non-browser mock/demo workflow (§4.4) is the primary validation target
- Record the exact error text shown in the app (not a screenshot, not a raw URL)

---

## 5. Where logs are written

This build does **not** configure an explicit log file or third-party logger.
Here is what to check if something fails:

| Source | Location | How to access |
|--------|----------|---------------|
| Electron console output | stdout/stderr (not visible in double-click mode) | Open DevTools with **Ctrl+Shift+I**, check the Console tab |
| Electron crash logs | `%APPDATA%\ServiceNow Automation\Crashpad\` | Only present if the app crashed with a minidump |
| Windows Event Viewer | Application logs | `eventvwr.msc` → Windows Logs → Application. Filter for `.NET Runtime` or `Application Error` |
| DevTools console | In-app | Ctrl+Shift+I after the window opens. Clear and reproduce the issue to see fresh logs |
| App resources/docs | Inside the extracted folder | `resources/docs/windows-operator-quickstart.md` and `resources/docs/windows-v0.1-rc-manual-test.md` contain startup guidance |
| CDP PowerShell scripts | Inside the extracted folder | `resources/scripts/windows/` contains logs generated by helper scripts during browser setup |

**If the app crashes on startup:**
1. Check Windows Event Viewer for an Application Error
2. Open a Command Prompt in the extracted folder and run: `ServiceNow Automation.exe --no-sandbox` (this may show console output)
3. Report the exact error text from the dialog or Event Viewer

---

## 6. What Alan should record

Do **not** record:
- ❌ Screenshots of real ServiceNow pages (there shouldn't be any)
- ❌ Cookies, sessions, HAR files, storage state
- ❌ Raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups
- ❌ Credentials, tokens, or approval phrases

Do record:
- ✅ Whether each step in §4 passed or failed
- ✅ Exact error text from dialogs (copy text, not screenshot)
- ✅ If the app starts — how long it took
- ✅ If the browser runtime starts — whether it succeeded
- ✅ Any console errors visible in DevTools (text only)
- ✅ Whether the app window closes cleanly or crashes
- ✅ A note about whether Windows Defender/SmartScreen blocked it

---

## 7. Pass/fail criteria

### Overall PASS

All of the following must be true:
- [ ] The zip extracts without errors on Windows (no WSL involved)
- [ ] Double-clicking `ServiceNow Automation.exe` opens a window
- [ ] The window title is "ServiceNow Automation"
- [ ] The three-column layout is visible
- [ ] At least one mock/demo workflow card loads in the workbench
- [ ] No crash dialog appears on startup
- [ ] The safety text is visible in the UI
- [ ] No Save/Submit/Update/Resolve/Close buttons exist in the UI
- [ ] Card order matches the approved sequence (§4.4 step 16)

### Overall FAIL

Any of the following:
- [ ] The app crashes on startup (cannot open at all)
- [ ] The app requires Node.js, pnpm, or WSL to run
- [ ] The app attempts to write to a real ServiceNow instance
- [ ] A security prompt that cannot be bypassed blocks app launch
- [ ] Missing MSVC runtime DLL prevents startup
- [ ] The zip contains developer-only files (node_modules, .git, pnpm config)

### Partial PASS (document)

If the app starts and shows its UI but the browser runtime does not start:
- This is an expected limitation on a machine without a compatible Chromium
- The primary validation goal (double-click works without dev toolchain) is still met
- Document the browser failure but pass the clean-machine test

---

## 8. What NOT to test in this session

| Do NOT test | Reason |
|-------------|--------|
| Real ServiceNow login | Not automated in this build; requires daytime manual action |
| Save/Submit/Update/Resolve/Close | Explicitly forbidden in all project safety docs |
| Auto-fill against production | Out of scope |
| Screenshots of real ServiceNow URLs | Privacy boundary |
| Performance under heavy load | Not a clean-machine validation goal |
| Long-running session stability | Not a clean-machine validation goal |
| Windows Installer (.exe/.msi setup) | The artifact is a portable zip, not an installer |
| Uninstall behavior | There is no installer; deleting the folder is the uninstall |
| WSL source-tree launcher | Dev fallback only; packaged acceptance must use the .exe |
| GitHub push/merge/tag/release | Not part of validation |

---

## 9. If validation fails

If any step fails, do the following:

1. **Record the exact error text** from the dialog (copy, don't screenshot)
2. **Check Event Viewer** for application error details: `eventvwr.msc` → Windows Logs → Application
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

Do **not** retry with real ServiceNow after a failure. All operations here are local.

---

## 10. Open questions for engineering

These are gaps discovered while writing this runbook — things that would make clean-machine
validation easier:

1. **Explicit log file:** The app writes no log file to `%APPDATA%\ServiceNow Automation\`.
   Adding electron-log or a simple startup log would make post-crash diagnostics easier.
2. **Error dialogs:** It is unclear what error dialog appears when the CDP browser fails to
   start on a machine with no Chromium. This needs to be tested.
3. **VCRUNTIME140.dll:** Electron on Windows requires the MSVC++ Redistributable. The
   packaged zip does not bundle it. If the clean machine lacks it, the app will not start.
   This should be documented in START-HERE-WINDOWS.txt.
4. **Antivirus false positives:** Electron-packaged apps are sometimes flagged by Windows
   Defender. If this happens, the runbook should tell Alan to submit a false-positive
   report or add an exclusion.

---

## Appendices

### A. Expected extracted folder structure (top level)

```
ServiceNow Automation.exe     (the app, ~192 MB)
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
  app.asar                     (bundled web app, ~9.7 MB)
  docs/
    windows-operator-quickstart.md
    windows-v0.1-rc-manual-test.md
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
- Autofill does not Submit/Save/Update/Resolve/Close
- Production mode (if visible) has all runtime actions disabled
