# Windows v0.1.0-rc.1 Release Notes

ServiceNow Automation v0.1.0-rc.1 is a Windows Operator Preview for supervised local testing.

> **Validation status: ALAN MANUAL VALIDATION PASS**
> Branch: `next/product-clarity-demo-polish-20260605`
> Alan validated the current-HEAD Windows RC artifact on 2026-06-06 and confirmed:
> - 手动测试全部通过 (all manual tests passed)
> - 版本没问题 (version is good)
> - 确认进入 PR 创建流程 (confirmed entering PR creation flow)
>
> PR: https://github.com/alanxiaofeifei/servicenow-automation/pull/140 (open, clean)
>
> This is a **local artifact validation PASS** only — it does not represent
> production readiness, live ServiceNow approval, or cross-platform certification.

## Artifact

| Item | Value |
|---|---|
| Package | `servicenow-automation-windows-v0.1.0-rc.1.zip` |
| SHA256 | `16f32bcf07b69580a3f5b641619130b5173ea1b8b4a42f064fc831b3abcf8314` |
| Size | 118,586,291 bytes |
| Format | Portable ZIP (no installer) |

## What's included

- Electron desktop app source and prebuilt desktop outputs.
- Windows double-click launcher and repair helpers.
- Dedicated browser runtime helper scripts.
- Sanitized operator quickstart and manual test checklist.
- SHA256 checksum file for the portable zip.

## What's new in this release

### Demo Scenario Library
Collapsible in-app scenario library in the left sidebar. Click any of 6 preset fake scenarios (VPN, Windows, Account Access, etc.) to instantly populate the full intake → draft → KB → report pipeline without manual copy/paste setup. Each card shows source channel, scenario label, and a DEMO badge. Safety notice at the bottom.

### Guided Demo Stepper
Center-column guided path showing the operator flow: Selected source → Cleaned context → TicketDraft → KB → Verify/Report → optional QA/dev text-field assistance. Non-interactive; derived from local sanitized state only. Safety footer repeats the allowed-text-field boundary.

### Local KB Recommendations
Visible KB recommendation cards on the main workbench showing each local suggestion's title, match confidence, matched evidence keywords, and sanitized excerpt. Also shows the recommended support group and routing reason summary.

### Monthly Excel Fill Queue
Workbench panel with current/previous month selectors and ticket-fill decision buttons ("Fill this ticket into monthly Excel" / "Do later — keep in pending queue"). Safety text confirms no Microsoft Graph or Excel Web write is performed from this local demo. Placeholder UI only — no live Excel integration.

### Product-Review Report Export
Export button on the History page generates a self-contained Markdown report covering the complete demo session: selected scenario, TicketDraft summary, KB/support recommendation, safety boundary, validation results, what this proves, and what remains human-only. Uses browser Blob download only; no network writes.

### Reordered Workbench (Incident Draft above Guided Path)
The central workbench now flows in logical operator order:
1. Selected source
2. Cleaned summary
3. Incident draft (editable fields)
4. Guided demo path (stepper)
5. Local KB recommendations
6. Monthly Excel fill queue

Previously the Incident draft was below Monthly Excel fill queue, which made the workflow harder to follow.

### User Guide, Demo Script, and Field-Trial Script
Docs refreshed to match the new three-column layout, guided stepper, KB recommendations, Excel queue, and demo scenario library.

## What to test

- Authoritative next-morning checklist: `docs/status/phase-V1-next-morning-alan-manual-validation-checklist-2026-06-05.md`
- Windows launcher double-click (on a test/clean machine)
- Mock/synthetic desktop workflows:
  - VPN Demo
  - Windows Demo
  - Mock Account Access Demo — no browser login
- Demo Scenario Library: click any scenario, verify intake + draft + KB + report populate.
- Guided Demo Stepper: verify the step labels match the center-column order.
- Draft editing, KB matches with evidence, monthly Excel fill queue buttons.
- Product-Review Report export from History page.
- Optional dedicated browser smoke test with `about:blank` only.

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

1. Download the zip and `.sha256` file from the release assets.
2. Verify checksum: `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1.zip.sha256`
3. Extract into WSL, ideally `$HOME/projects/servicenow-automation`.
4. Run `SDA_LAUNCH_DRY_RUN=1 ./scripts/wsl/start-desktop.sh` (WSL environment).
5. From Windows, double-click `scripts\windows\Start-ServiceNow-Automation.cmd`.
6. Test mock workflows only.

See `docs/releases/windows-v0.1-rc-manual-test.md` inside the package for the full checklist.

## Known limitations

- Clean-machine (fresh Windows without WSL) double-click validation: **NOT YET TESTED**
- Live ServiceNow integration: **NOT READY** — this release is for supervised demo/local use only
- Cross-platform (macOS/Linux): **NOT TESTED**
- Auto-update mechanism: **NOT IMPLEMENTED**
