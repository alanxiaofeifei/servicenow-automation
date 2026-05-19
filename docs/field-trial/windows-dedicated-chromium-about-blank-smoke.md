# Windows Dedicated Chromium `about:blank` Smoke Runbook

## Status

Draft runbook for GitHub issue #32.

This runbook exists because GPT-5.5 Pro returned **NO-GO** for a Windows Chromium QA ServiceNow field trial. The next approved direction is local architecture validation only: prove that a dedicated/tool-owned Windows Chromium runtime can be planned for an `about:blank` launch with a tool-owned disposable profile before any QA ServiceNow login page is opened.

## Scope

Allowed in this stage:

- `sda browser smoke` dry-run JSON output.
- Target `about:blank` only.
- Tool-owned Windows Chromium runtime path validation.
- Tool-owned disposable profile root validation.
- Optional real `about:blank` launch only after a separate checkpoint returns READY / READY WITH CONDITIONS.

Forbidden in this stage:

- ServiceNow QA/dev/production URLs.
- QA login page.
- Post-login exploration.
- DOM automation or page inspection.
- Browser artifact export.
- Ticket field fill.
- Save / Submit / Update / Close.
- ServiceNow API calls.
- Using daily Chrome or Edge as the product runtime.
- Using daily Chrome, Edge, or Firefox profile roots.

## Current command surface

The dedicated smoke command is intentionally separate from `sda browser launch`.

```bash
pnpm --silent --filter @servicenow-automation/cli sda browser smoke \
  --browser-executable '%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe' \
  --profile-root '%LOCALAPPDATA%\ServiceNowAutomation\Profiles\smoke\session-smoke-001' \
  --target about:blank \
  --json
```

Expected dry-run properties:

```text
smoke.status = dry-run
smoke.targetValidation.status = allowed
smoke.targetValidation.target = about:blank
smoke.runtimeClassification.status = allowed
smoke.profileValidation.status = allowed
smoke.safety.browserProcessLaunched = false
smoke.safety.targetTouchesServiceNow = false
smoke.safety.pageInspectionAllowed = false
smoke.safety.captureArtifactsAllowed = false
```

## Windows PowerShell path guidance

For a future real launch, do **not** pass literal `%LOCALAPPDATA%` strings from PowerShell. PowerShell does not expand `%LOCALAPPDATA%` the same way `cmd.exe` does.

Use expanded variables instead:

```powershell
$Runtime = Join-Path $env:LOCALAPPDATA 'ServiceNowAutomation\Runtime\Chromium\chrome.exe'
$Profile = Join-Path $env:LOCALAPPDATA 'ServiceNowAutomation\Profiles\smoke\session-smoke-001'

Test-Path $Runtime
```

Only continue if `$Runtime` points to a dedicated/portable/tool-owned Chromium binary. It must not point to either of these daily browser locations:

```text
C:\Program Files\Google\Chrome\Application\chrome.exe
C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
C:\Program Files\Microsoft\Edge\Application\msedge.exe
C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
```

## Dry-run only check

Run dry-run first:

```powershell
pnpm --silent --filter @servicenow-automation/cli sda browser smoke `
  --browser-executable "$Runtime" `
  --profile-root "$Profile" `
  --target about:blank `
  --json
```

Confirm:

```text
status = dry-run
browserProcessLaunched = false
target = about:blank
runtimeClassification = allowed
profileValidation = allowed
```

## Real launch gate

A real `about:blank` launch is not automatic. It requires both flags:

```text
--execute
--confirm-no-write-launch
```

Do not run a real launch until the relevant GPT-5.5 Pro checkpoint has approved it.

When approved, the only allowed real-launch command shape is:

```powershell
pnpm --silent --filter @servicenow-automation/cli sda browser smoke `
  --browser-executable "$Runtime" `
  --profile-root "$Profile" `
  --target about:blank `
  --execute `
  --confirm-no-write-launch `
  --json
```

Manual observations allowed:

```text
- A browser window opens.
- The page is blank.
- The profile is not the user's daily Chrome/Edge profile.
- No ServiceNow page is opened.
- No data is captured from the page.
```

Manual observations forbidden:

```text
- Do not navigate to QA ServiceNow.
- Do not log in.
- Do not inspect DOM.
- Do not capture screenshots or browser artifacts.
- Do not export browser state.
```

## Cleanup rule

This stage does not add automatic cleanup-on-close. Use explicit cleanup only after confirming the profile path is tool-owned and disposable.

Allowed cleanup target shape:

```text
%LOCALAPPDATA%\ServiceNowAutomation\Profiles\smoke\<session-id>
```

Forbidden cleanup targets:

```text
%LOCALAPPDATA%\Google\Chrome\User Data
%LOCALAPPDATA%\Microsoft\Edge\User Data
%APPDATA%\Mozilla\Firefox\Profiles
```

## Stop conditions

Stop immediately and create a blocker if any of these happen:

- The command accepts an HTTP/HTTPS/ServiceNow target.
- The command opens daily Chrome or Edge.
- The browser appears to reuse Alan's daily work profile.
- The JSON output includes ServiceNow URL details or sensitive parameters.
- The command captures page content or browser artifacts.
- Any write-capable ServiceNow workflow is introduced.

## Next checkpoint

After #32 is implemented and verified, send `docs/prompts/gpt-5.5-pro/windows-dedicated-chromium-about-blank-smoke-review.md` to GPT-5.5 Pro before any real Windows launch or QA login-page checkpoint.
