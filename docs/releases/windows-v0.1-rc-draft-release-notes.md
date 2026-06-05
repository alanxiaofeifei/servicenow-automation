# Windows v0.1.0-rc.2 Release Notes

ServiceNow Automation v0.1.0-rc.2 is a Windows Operator Preview for supervised local testing.

> **Manual validation**: Alan ran Windows app launch + UX review on 2026-06-05 (commit `269b9fe`).
> Workbench order verified: Selected source → Cleaned summary → Incident draft → Guided demo path → Local KB recommendations → Monthly Excel fill queue.
> See `docs/status/alan-manual-validation-pass-2026-06-05.md` for full status.

## What's included

- Electron desktop app source and prebuilt desktop outputs.
- Windows double-click launcher and repair helpers.
- Dedicated browser runtime helper scripts.
- Sanitized operator quickstart and manual test checklist.
- SHA256 checksum for the portable zip.

## What changed since rc.1

### New: Demo Scenario Library (Phase O)
Collapsible in-app scenario library in the left sidebar. Click any of 6 preset fake scenarios (VPN, Windows, Account Access, etc.) to instantly populate the full intake → draft → KB → report pipeline without manual copy/paste setup. Each card shows source channel, scenario label, and a DEMO badge. Safety notice at the bottom.

### New: Guided Demo Stepper (Phase P)
Center-column guided path showing the operator flow: Selected source → Cleaned context → TicketDraft → KB → Verify/Report → optional QA/dev text-field assistance. Non-interactive; derived from local sanitized state only. Safety footer repeats the allowed-text-field boundary.

### New: Local KB Recommendations (Alan guided-demo review fix)
Visible KB recommendation cards on the main workbench showing each local suggestion's title, match confidence, matched evidence keywords, and sanitized excerpt. Also shows the recommended support group and routing reason summary.

### New: Monthly Excel Fill Queue (Alan guided-demo review fix)
Workbench panel with current/previous month selectors and ticket-fill decision buttons ("Fill this ticket into monthly Excel" / "Do later — keep in pending queue"). Safety text confirms no Microsoft Graph or Excel Web write is performed from this local demo. Placeholder UI only — no live Excel integration.

### New: Product-Review Report Export (Phase Q)
Export button on the History page generates a self-contained Markdown report covering the complete demo session: selected scenario, TicketDraft summary, KB/support recommendation, safety boundary, validation results, what this proves, and what remains human-only. Uses browser Blob download only; no network writes.

### Reorder: Incident Draft above Guided Path (Phase S)
The central workbench now flows in logical operator order:
1. Selected source
2. Cleaned summary
3. Incident draft (editable fields)
4. Guided demo path (stepper)
5. Local KB recommendations
6. Monthly Excel fill queue

Previously the Incident draft was below Monthly Excel fill queue, which made the workflow harder to follow.

### Updated: User guide, demo script, and field-trial script
Docs refreshed to match the new three-column layout, guided stepper, KB recommendations, Excel queue, and demo scenario library.

## What to test

- WSL dry-run readiness check.
- Windows launcher opens the desktop app.
- Mock/synthetic desktop workflows:
  - VPN Demo
  - Windows Demo
  - Mock Account Access Demo — no browser login
- Demo Scenario Library: click any scenario, verify intake + draft + KB + report populate.
- Guided Demo Stepper: verify the step labels match the center-column order.
- Draft editing, KB matches with evidence, monthly Excel fill queue buttons.
- Product-Review Report export from History page.
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
