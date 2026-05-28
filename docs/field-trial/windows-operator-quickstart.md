# Windows operator quickstart

Use this for the Windows/operator packaging slice tracked by issue #128.

## Status

This quickstart covers packaged Windows artifact and browser-runtime readiness only. It does not approve live ServiceNow operation or full-field autofill exposure. Keep the operator path text-only or blocked unless a separate reviewed checkpoint explicitly allows more.

The older WSL launcher remains a dev/field-trial fallback only. It is not the release artifact.

## Build the packaged artifact

From WSL inside a clean checkout:

```bash
pnpm install --frozen-lockfile
pnpm --filter @servicenow-automation/desktop package:windows
```

The packaged Windows zip is written under:

```text
apps/desktop/dist/windows/
```

For the RC wrapper and checksum:

```bash
pnpm release:windows:rc
```

## Open the packaged app

1. Copy or download the RC zip on Windows.
2. Verify the `.sha256` checksum from a trusted shell.
3. Extract the zip on Windows.
4. Double-click the packaged `ServiceNow Automation` executable.
5. Use mock/demo workflows first.

Do not use the WSL source-tree launcher as proof that the packaged artifact works.

## Dev/field-trial fallback only

If you are debugging the old source-tree launcher, it points to:

```text
scripts\windows\Start-ServiceNow-Automation.cmd
```

That launcher assumes the repository is available in WSL and may install dev dependencies. It is useful for local diagnosis only; packaged acceptance must use the built Windows artifact.

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

1. Build the packaged artifact and checksum.
2. Extract the packaged Windows zip on Windows.
3. Double-click the packaged executable and confirm the desktop app opens.
4. Run mock/demo workflows first.
5. Run the dedicated Chromium helper with `about:blank` only.
6. Confirm the profile is under `%LOCALAPPDATA%\ServiceNowAutomation\Profiles\...`.
7. Confirm CDP is loopback-only unless the explicit dev-only WSL exposure flags are supplied.
8. Stop before any real QA login or ServiceNow field interaction unless a separate checkpoint authorizes it.
