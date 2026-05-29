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
6. Confirm the profile is under `%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\...`.
7. Confirm CDP is loopback-only unless the explicit dev-only WSL exposure flags are supplied.
8. Stop before any real QA login or ServiceNow field interaction unless a separate checkpoint authorizes it.

## Troubleshooting

### Packaging preflight fails

Run `pnpm packaging:preflight` from WSL inside a clean checkout. Each `FAIL` message now includes a `HINT:` line with the exact fix needed.

Common failures and their fixes:

| Failure | Likely root cause | Fix |
|---|---|---|
| `Node.js was not found on PATH` | Missing Node.js in WSL | `nvm install 22` or download from nodejs.org |
| `pnpm was not found on PATH` | Missing pnpm/corepack | `corepack enable && corepack prepare pnpm@9.15.4 --activate` |
| `desktop main build output missing` | Desktop package not built | `pnpm --filter @servicenow-automation/desktop build` |
| `Electron Builder dependency missing` | electron-builder not installed | `pnpm --filter @servicenow-automation/desktop add -D electron-builder` |
| `package:windows script missing or unexpected` | Missing packaging script | Add the standard `package:windows` script to `apps/desktop/package.json` |
| `packaging resources do not include required helpers` | extraResources incomplete | Add scripts/windows entries and local-cdp-bridge.py to electron-builder config |
| `main bundle still imports internal workspace packages` | Bundled Electron imports source TypeScript | Configure Vite builder to bundle all internal packages |
| `dedicated browser runtime provisioning scripts are missing` | No runtime installer script | Create `scripts/windows/install-cloakbrowser-runtime.ps1` or `prepare-chrome-for-testing.ps1` |

After fixing, re-run `pnpm packaging:preflight` to confirm all checks pass.

### Double-click does not open the app

1. Confirm the zip was extracted completely (all files present).
2. Verify the `.sha256` checksum against the zip.
3. Check Windows Defender or antivirus for quarantine.
4. Run the executable from a Command Prompt to see error output.
5. Check the startup log path printed by the launcher. Logs are under `.local/startup-logs/` (git-ignored, no ServiceNow content).

### Start QA Chromium has no visible effect

1. Run `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\\windows\\install-cloakbrowser-runtime.ps1 -DryRun` from the project root on Windows to confirm the runtime setup path.
2. Check that `%LOCALAPPDATA%\\ServiceNowAutomation\\Runtime\\` contains a `chrome.exe` from one of the dedicated runtime channels.
3. The CDP helper will fail with a JSON blocked-reason payload — read the `blockedReason` field.
4. Do NOT switch to daily Chrome/Edge paths as a workaround.
