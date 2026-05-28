# Windows v0.1 RC manual test quickstart

This checklist is for supervised local testing of the Windows Operator Preview package.

## Scope

The release-candidate package proves that the local Windows/WSL operator path can start the desktop app and run mock/synthetic workflows.

It does not approve live ServiceNow operation.

## Hard stop rules

Stop immediately if any path asks you to perform or automate:

- automatic login
- Save / Submit / Update / Resolve / Close
- upload / email / bulk action
- ServiceNow API write
- production write or production-shadow write
- screenshots / HAR / trace / video capture from real ServiceNow pages
- cookies / sessions / storage-state export
- raw QA URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values

## Package contents

The portable zip contains source, scripts, docs, and prebuilt desktop renderer/main/preload outputs. It intentionally does not include:

- `node_modules/`
- `.git/`
- `.local/` startup logs
- `dist/`
- cookies, sessions, HARs, traces, screenshots, or recordings

The WSL startup helper installs workspace dependencies if Electron is missing.

## Test steps

1. Download the zip and `.sha256` from the Draft GitHub Release.
2. Verify checksum from WSL:

   ```bash
   sha256sum -c servicenow-automation-windows-v0.1.0-rc.1.zip.sha256
   ```

3. Extract into WSL, preferably:

   ```bash
   mkdir -p "$HOME/projects"
   unzip servicenow-automation-windows-v0.1.0-rc.1.zip -d "$HOME/projects"
   mv "$HOME/projects/servicenow-automation-windows-v0.1.0-rc.1" "$HOME/projects/servicenow-automation"
   cd "$HOME/projects/servicenow-automation"
   ```

4. Run a no-GUI readiness check:

   ```bash
   SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh
   ```

5. From Windows, double-click:

   ```text
   scripts\windows\Start-ServiceNow-Automation.cmd
   ```

6. In the desktop app, test mock workflows only:

   - Load VPN Demo
   - Load Windows Demo
   - Load Mock Account Access Demo — no browser login
   - edit a draft field
   - inspect KB matches / missing info / risk flags
   - inspect Mock ServiceNow form only

7. Optional dedicated browser smoke:

   - use `about:blank` only
   - confirm the profile is tool-owned
   - confirm CDP is loopback-only unless explicit dev-only flags are supplied
   - stop before any real QA login or field interaction

## What to report back

Report only:

- pass/fail for dry-run
- pass/fail for Windows launcher opening the desktop app
- pass/fail for mock demo workflows
- startup log path if needed
- sanitized visible error text if needed

Do not paste real ServiceNow/customer/ticket/browser data.
