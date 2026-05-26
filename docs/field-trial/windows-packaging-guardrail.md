# Windows packaging guardrail

Status: not ready for packaged Windows delivery. Do not tell users that a Windows package is supported until the package/build check, a packaged double-click run, the dedicated browser launch, the browser connection, the read-only current-ticket check, and autofill-only safety checks all pass on the packaged app.

## Current Windows path

The current Windows operator entrypoint is still a development launcher:

1. The operator double-clicks `scripts/windows/Start-ServiceNow-Automation.cmd` or a desktop shortcut/copy of it.
2. The command file starts WSL and runs `scripts/wsl/start-desktop.sh`.
3. The WSL script loads the developer Node/pnpm tools from the source checkout.
4. The desktop app starts from the built files and dependency folder inside the checkout.
5. Start QA Chromium calls a Windows browser helper script from the checkout to open the dedicated browser.

That means today's double-click path still depends on WSL, source files, developer dependencies, and prebuilt desktop files. It is useful for field-trial repair work, but it is not a self-contained Windows package.

## GPU warnings are not a browser-runtime verdict

Startup logs may show GPU or graphics warnings while the desktop shell still opens or exits normally. Those warnings do not prove that the dedicated QA browser runtime is missing.

Check these items separately:

- Desktop app launch: WSL bootstrap, developer Node/pnpm tools, desktop app runtime, and built desktop files.
- Dedicated browser launch: Windows browser helper, tool-owned browser runtime, disposable browser profile, and a ready browser connection.
- Missing browser evidence: a clear blocked reason such as dedicated runtime not found, helper timeout, or browser connection failed.

Do not ask the operator to install random Chrome because a graphics warning appears. The app must detect the dedicated browser state and show a short sanitized repair message.

## Required resources for a real Windows package

A future packaged app must include or intentionally replace these resources:

- Built desktop app files.
- The Windows desktop app runtime.
- App dependencies bundled into the package, or a build that no longer needs the source checkout at runtime.
- The Windows dedicated browser helper script, or an equivalent packaged helper. This helper is what Start QA Chromium uses to open the tool-owned browser.
- A tool-owned browser runtime and profile strategy that keeps the operator's daily browser profile separate.
- Startup/runtime log handling that shows a safe log path and redacts ServiceNow targets.
- Short diagnostics for missing browser helper, missing PowerShell, missing browser runtime, failed browser connection, and package setup drift.

The dedicated browser runtime choice must be explicit before packaging can be accepted. The app must do one of these:

1. Bundle a pinned Chromium-compatible runtime that the project is licensed to redistribute.
2. Provision a pinned Chrome for Testing runtime through a verified installer step under `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium`.
3. Provision an optional CloakBrowser runtime through a verified installer step under `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\CloakBrowser`, with official download source, checksum verification, and binary-license acceptance.

Random user-installed Chrome/Edge and daily browser profiles are not acceptable product dependencies. If the dedicated runtime is missing or invalid, the final app must show a sanitized repair message instead of leaving Start QA Chromium stuck.

Do not bundle cookies, sessions, storage state, HAR files, traces, screenshots, videos, real ServiceNow URLs, ticket IDs, record identifiers, credentials, or page HTML.

## Package/build check

Run this before any packaging claim:

```bash
pnpm packaging:preflight
```

Expected result today: the command fails with `Packaging preflight result: INCOMPLETE` because no Windows packaging tool, package script, package build setup, bundled browser-helper resource, or dedicated browser runtime provisioning step is declared yet.

That failure is intentional. It prevents the WSL development launcher from being mistaken for a packaged Windows app.

## Local troubleshooting checklist

Use this checklist when the Windows desktop app opens but Start QA Chromium does not visibly lead to a ready browser connection:

1. Identify the failed user-visible step: desktop app opens, Start QA Chromium opens the dedicated browser, browser connection becomes ready, Check current ticket becomes available, or Autofill becomes available.
2. Read only the sanitized startup log path printed by the launcher or app. Graphics warnings alone do not diagnose the dedicated browser.
3. Run `pnpm packaging:preflight` from WSL. The expected current result is `INCOMPLETE`; this proves packaging is not accepted, not that the operator needs random Chrome.
4. Confirm the browser helper exists in the checkout and that the selected approved runtime installer/preparation script exists for the chosen runtime channel.
5. On Windows, check only tool-owned runtime roots under `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\...`. Do not switch to daily Chrome/Edge paths as a workaround.
6. If the runtime is missing, use only an approved project-managed installer/preparation path that verifies source, version/license requirements, and checksum where applicable.
7. If the runtime exists but the browser connection is not ready, record only sanitized status/block reasons and bounded timeout information. Do not print raw browser connection addresses, ServiceNow targets, page-check identifiers, cookies, sessions, or ticket data.
8. Keep Check current ticket and Autofill disabled until the browser connection is ready and the read-only current-ticket check passes.

## Release honesty notes if packaging remains blocked

If this branch/PR stays blocked, the next release note should say:

- Implemented: Windows packaging guardrail doc plus `pnpm packaging:preflight` fail-closed checks.
- Verified by automated checks: list only commands actually run and their pass/fail status.
- Manual acceptance: packaged Windows artifact acceptance is not attempted and not passed.
- Blocked: no self-contained Windows package, no package setup for helper/runtime resources, and no manual packaged double-click verification.
- Safety: no ServiceNow Save/Submit/Update/Resolve/Close, no ServiceNow API write, and no browser artifacts or secrets exported.
- Next PR recommendation: add real Windows packaging config, package/provision the dedicated browser runtime path, build a candidate artifact, and run Windows package double-click acceptance separately.

## Manual Windows package validation still required

After real packaging setup is added and a Windows artifact is built, validate on Windows without relying on WSL source scripts or developer dependency folders:

1. Install or extract the Windows artifact in a clean location.
2. Double-click the packaged app or its launcher.
3. Confirm a visible tool window opens and the startup surface shows a sanitized log path.
4. Click Start QA Chromium in QA mode only.
5. Confirm a dedicated tool-owned browser window opens.
6. Confirm the browser connection becomes ready before Check current ticket is enabled.
7. Confirm Check current ticket is read-only.
8. Confirm Autofill remains autofill-only and no Save/Submit/Update/Resolve/Close action occurs.
9. Confirm failures show sanitized diagnostics, not raw ServiceNow target data.

Packaging remains unaccepted until those steps pass on Windows.
