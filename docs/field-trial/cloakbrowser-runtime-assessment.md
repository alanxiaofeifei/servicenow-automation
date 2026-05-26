# CloakBrowser Runtime Assessment

## Decision

Use CloakBrowser only as an optional dedicated Chromium runtime channel. Do not switch the ServiceNow Automation runtime model to CloakBrowser's Playwright wrapper in the current phase.

The safe integration path is:

```text
ServiceNow Automation
  -> Windows helper script
  -> %LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser\chrome.exe
  -> tool-owned disposable profile
  -> manual login
  -> localhost CDP verify-only / approved autofill slices only
```

## Why it is useful

CloakBrowser provides a Chromium build with source-level fingerprint and automation-signal patches. For an authorized enterprise ServiceNow workflow, the useful part is not scraping or CAPTCHA bypass. The useful part is a dedicated Chromium runtime that may reduce false-positive bot/automation detection while keeping the product away from the operator's daily Chrome or Edge profile.

Potential benefits for this project:

- dedicated Chromium executable separate from daily Chrome/Edge
- source-level browser fingerprint hardening rather than fragile JavaScript stealth injections
- Chromium/Playwright compatibility if a later reviewed browser-runtime slice needs it
- direct binary launch still works with the current no-write/manual-login/CDP boundary

## Why not direct Playwright integration now

The current safety model intentionally separates browser launch from DOM automation. CloakBrowser's wrapper is a Playwright/Puppeteer convenience API that downloads a binary into its own cache and launches pages programmatically. That is not the current product boundary.

Do not introduce the wrapper as a direct runtime dependency until a separate issue/checkpoint approves:

- Playwright as a runtime dependency
- exact profile-root control for the downloaded binary
- disabled or managed auto-update behavior
- no ServiceNow DOM reads/writes beyond the approved runtime slice
- no screenshots, HAR, traces, storage-state, cookies, or session export

## License finding

Repository source wrappers are MIT licensed, but the compiled CloakBrowser Chromium binary uses `BINARY-LICENSE.md`.

Important binary-license constraints:

- internal personal/commercial use is allowed
- listing CloakBrowser as a dependency is not redistribution if end users download from official CloakHQ channels
- redistributing, reselling, sublicensing, repackaging, or embedding the binary into a product distributed to third parties is prohibited without a separate OEM/SaaS license
- internal Docker/VM/CI artifacts are allowed only for the organization's internal operational purposes

Therefore this repository must not vendor or commit the CloakBrowser binary. The supported path is an installer script that downloads the binary from official CloakHQ/GitHub release URLs on the operator's machine and verifies SHA-256 checksums.

## Packaged integration added here

Script:

```text
scripts/windows/install-cloakbrowser-runtime.ps1
```

The script:

- downloads `cloakbrowser-windows-x64.zip` from the official GitHub release
- downloads `SHA256SUMS` from the same release
- verifies the Windows archive SHA-256 before extraction
- installs to `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser\`
- writes a source/license notice beside the installed runtime
- never launches a browser
- never opens ServiceNow
- never performs ServiceNow API calls or writes
- refuses real install unless `-AcceptBinaryLicense` is supplied

Dry-run command:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows\install-cloakbrowser-runtime.ps1 -DryRun
```

Install command, only after accepting CloakBrowser's binary license:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows\install-cloakbrowser-runtime.ps1 -AcceptBinaryLicense
```

Replace an existing CloakBrowser runtime:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows\install-cloakbrowser-runtime.ps1 -AcceptBinaryLicense -Force
```

## Launch behavior

The dedicated CDP helper now prefers the optional CloakBrowser runtime when present:

1. `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser\chrome.exe`
2. `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`

Both are tool-owned runtime roots. Daily installed Chrome and Edge remain blocked as product runtimes.

The helper still launches with:

- tool-owned disposable profile under `%LOCALAPPDATA%\ServiceNowAutomation\Profiles\...`
- CDP is bound to the local loopback interface by default
- dynamic CDP port with ready output redacted to status/diagnostics
- manual login
- no Save, Submit, Update, Close, upload, email, screenshot, HAR, trace, storage-state, cookie export, or ServiceNow API call

## Remaining gates before any real QA use

Before using CloakBrowser with a real QA/dev ServiceNow page:

1. Run the installer dry-run and review JSON safety output.
2. Install only after accepting the binary license.
3. Run the Windows dedicated Chromium about:blank smoke test.
4. Verify the CDP endpoint is loopback-only.
5. Keep first ServiceNow use manual-login/no-write.
6. Treat any autofill as a separate fingerprint-bound approval slice.

## Recommendation

CloakBrowser is worth keeping as an optional runtime candidate, but not as a direct automation framework dependency yet. The best current borrow is its dedicated patched Chromium binary, installed on demand into the existing tool-owned runtime boundary.
