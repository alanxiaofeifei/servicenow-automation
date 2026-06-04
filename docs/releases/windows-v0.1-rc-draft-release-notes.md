# Windows v0.1.0-rc.1 Release Notes

ServiceNow Automation v0.1.0-rc.1 is a Windows Operator Preview for supervised local testing.

> **Manual validation**: Alan ran Windows app launch + autofill success on 2026-06-05 (commit `20e5cdf`). See `docs/status/next-round-ready-for-alan-review-2026-06-05.md` for full status.

## What's included

- Electron desktop app source and prebuilt desktop outputs.
- Windows double-click launcher.
- WSL startup and repair helpers.
- Dedicated browser runtime helper scripts.
- Sanitized operator quickstart and manual test checklist.
- SHA256 checksum for the portable zip.

## What to test

- WSL dry-run readiness check.
- Windows launcher opens the desktop app.
- Mock/synthetic desktop workflows:
  - VPN Demo
  - Windows Demo
  - Mock Account Access Demo — no browser login
- Draft editing, KB matches, missing info, risk flags, and Mock ServiceNow form mapping.
- Optional dedicated browser smoke with `about:blank` only.

## Safety boundary

This prerelease does not approve live ServiceNow operation.

Forbidden:

- automatic login
- Save / Submit / Update / Resolve / Close
- upload / email / bulk action
- ServiceNow API write
- production write or production-shadow write
- screenshots / HAR / trace / video capture from real ServiceNow pages
- cookies / sessions / storage-state export
- raw QA URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values

## Install / test summary

1. Download the zip and `.sha256`.
2. Verify checksum with `sha256sum -c`.
3. Extract into WSL, ideally `$HOME/projects/servicenow-automation`.
4. Run `SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh`.
5. From Windows, double-click `scripts\windows\Start-ServiceNow-Automation.cmd`.
6. Test mock workflows only.

See `docs/releases/windows-v0.1-rc-manual-test.md` inside the package for the full checklist.
