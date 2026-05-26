# Windows Dedicated Chromium Runtime Setup

## Status

Runbook for GitHub issue #34.

This step prepares the tool-owned Chromium runtime required by #33. It does **not** open a browser and does **not** touch ServiceNow.

## Why this is needed

Alan's Windows PowerShell precheck returned:

```text
Test-Path $Runtime = False
$Runtime = %LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe
```

Therefore #33 cannot proceed to `about:blank` smoke until the runtime exists.

## Safety boundary

Allowed in this step:

```text
Download official Chrome for Testing metadata
Download official Chrome for Testing win64 archive
Extract it into a temporary directory
Copy it under %LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium
Print the runtime path and next dry-run command
```

Forbidden in this step:

```text
Open browser
Open QA ServiceNow
Open any ServiceNow URL
Login
DOM automation
Page inspection
Browser artifact export
Credential/session/state export
Field fill
Save / Submit / Update / Close
ServiceNow API calls
Daily Chrome/Edge runtime reuse
Daily Chrome/Edge/Firefox profile root reuse
```

## Script

```text
scripts/windows/prepare-chrome-for-testing.ps1
```

The script downloads official Chrome for Testing from Google's public Chrome for Testing metadata endpoint:

```text
https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json
```

Default output path:

```text
%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe
```

## Run from Windows PowerShell

Open **Windows PowerShell**, then enter the repo path:

```powershell
cd "PASTE_REPO_UNC_PATH_HERE"
```

For Alan's current WSL setup, Hermes can provide the exact UNC path when needed; do not guess it.

Run the setup script:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\prepare-chrome-for-testing.ps1
```

Optional JSON output:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\prepare-chrome-for-testing.ps1 -Json
```

Force reinstall:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\prepare-chrome-for-testing.ps1 -Force
```

## Expected result

The script should print something like:

```text
Status: installed
Runtime: %LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe
Runtime exists: True
Chrome for Testing version: <version>

Next dry-run command:
pnpm --silent --filter @servicenow-automation/cli sda browser smoke ...

Safety: script did not open a browser, did not touch ServiceNow, and did not modify browser profiles.
```

## Verification after setup

In Windows PowerShell:

```powershell
$Runtime = Join-Path $env:LOCALAPPDATA 'ServiceNowAutomation\Runtime\Chromium\chrome.exe'
$Profile = Join-Path $env:LOCALAPPDATA 'ServiceNowAutomation\Profiles\smoke\session-smoke-001'

Test-Path $Runtime
$Runtime
$Profile
```

Expected:

```text
True
%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\Chromium\\chrome.exe
%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\smoke\\session-smoke-001
```

## Important PowerShell path note

Do not run unquoted paths with spaces like this:

```powershell
C:\Program Files\Google\Chrome\Application\chrome.exe
```

PowerShell treats `C:\Program` as a command and fails. Use `Test-Path` with quotes if checking a path:

```powershell
Test-Path 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

However, daily Chrome/Edge paths remain forbidden for this project.

## About Windows `pnpm`

The runtime setup script does **not** require Windows `pnpm`.

Alan's earlier error:

```text
pnpm : The term 'pnpm' is not recognized
```

means Windows PowerShell currently cannot run the Node/pnpm-based CLI directly. That is a separate execution-environment blocker for #33 real smoke. Do not work around it by using daily Chrome/Edge. First prepare the dedicated runtime, then decide whether to install Windows Node/pnpm or create a packaged Windows runner in a separate issue.

## Stop conditions

Stop and report the output if:

- The script cannot download Chrome for Testing metadata.
- The download fails.
- Extraction fails.
- `chrome-win64\chrome.exe` is not found after extraction.
- The final runtime path is not under `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium`.
- The script attempts to use Program Files Chrome/Edge.

## Relationship to #33

After #34 is complete and `Test-Path $Runtime` returns `True`, #33 can resume with dry-run only.

#33 still does **not** approve QA ServiceNow login or post-login exploration.
