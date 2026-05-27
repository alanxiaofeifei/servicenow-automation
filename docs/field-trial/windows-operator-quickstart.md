# Windows operator quickstart

Use this for the Windows/operator packaging slice tracked by issue #110.

## Status

This quickstart covers launcher/runtime readiness only. It does not approve live ServiceNow operation or full-field autofill exposure. Keep the operator path text-only or blocked unless a separate reviewed checkpoint explicitly allows more.

## Open the app

From Windows, double-click a launcher that points to:

```text
scripts\windows\Start-ServiceNow-Automation.cmd
```

The launcher assumes the repository is available in WSL at:

```text
$HOME/projects/servicenow-automation
```

If your checkout lives elsewhere, set this Windows environment variable before launching:

```cmd
set SDA_WSL_PROJECT_DIR=/path/to/servicenow-automation
```

Optional distro override:

```cmd
set SDA_WSL_DISTRO=Ubuntu
```

Keep the Windows command window open while the app is running. Startup logs are written under `.local/startup-logs/`, which is git-ignored and must not contain ServiceNow URLs, cookies, sessions, HARs, screenshots, ticket data, or real field values.

## Repair path

From WSL inside the repo:

```bash
./scripts/wsl/repair-env.sh
```

For a non-GUI dependency check:

```bash
SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh
```

## Dedicated browser runtime

The Windows CDP helper only uses tool-owned runtime roots, preferring:

```text
%LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser\chrome.exe
%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe
```

Daily Chrome and Edge profiles remain out of scope for the product runtime. CDP binds to loopback by default. WSL exposure requires the explicit dev-only flags in `scripts/windows/start-dedicated-chromium-cdp.ps1`.

Optional CloakBrowser installer dry-run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows\install-cloakbrowser-runtime.ps1 -DryRun
```

Install only after accepting CloakBrowser's binary license:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows\install-cloakbrowser-runtime.ps1 -AcceptBinaryLicense
```

## Operator boundary

Forbidden from this launcher/runtime slice:

- automatic login
- credential storage
- raw URL or ticket-content logging
- screenshot / HAR / trace / video capture
- storage-state / cookie / session export
- ServiceNow API write
- Save / Submit / Update / Resolve / Close
- upload / email / bulk action
- production write or production-shadow write
- external AI over real ServiceNow content

## Manual acceptance checklist

1. Run `SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh` from WSL and confirm dependency/log output only.
2. Double-click the Windows launcher and confirm the desktop app opens or a startup log path is printed.
3. Run the dedicated Chromium helper with `about:blank` only.
4. Confirm the profile is under `%LOCALAPPDATA%\ServiceNowAutomation\Profiles\...`.
5. Confirm CDP is loopback-only unless the explicit dev-only WSL exposure flags are supplied.
6. Stop before any real QA login or ServiceNow field interaction unless a separate checkpoint authorizes it.
