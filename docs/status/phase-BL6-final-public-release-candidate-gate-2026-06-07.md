# Phase BL6 — Final local gate for public release candidate

Date: 2026-06-07 / 2026-06-08 CST
Task: BL6 — final local gate for public release candidate
Workspace: `/home/alanxwsl/projects/servicenow-automation`
Branch: `next/post-release-operator-cockpit-ab-20260606`

## Conclusion

READY FOR ALAN MANUAL VALIDATION ONLY

This BL6 gate passes the local code, package, checksum, zip-integrity, and privacy checks for the public release candidate. It is not marked `READY FOR GITHUB PUBLIC RELEASE` because the current public package has not yet been manually validated by Alan in Windows after the screenshot-driven UI/content fixes, and the prior QA acceptance still records conditional visual/i18n risks.

No GitHub push, PR, merge, tag, or release was performed in BL6.

## Public candidate package

- Local path: `dist/release/servicenow-automation-windows-v0.1.0-public-20260607.zip`
- Windows UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-public-20260607.zip`
- Size: 118,610,088 bytes
- SHA256: `e0fdbbd69060e87ebbda96ed95c9bfbf4d40807e53f3b861777e78ad6f6fe692`
- Source-of-truth marker: `dist/release/CURRENT.txt` contains `CURRENT=servicenow-automation-windows-v0.1.0-public-20260607.zip`
- START-HERE file: `dist/release/servicenow-automation-windows-v0.1.0-public-20260607-START-HERE-WINDOWS.txt`

## Required local gates

| Gate | BL6 result |
| --- | --- |
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 335 tests: 83 core, 34 ai, 6 kb, 17 profiles, 95 adapters, 55 cli, 185 desktop |
| `pnpm privacy:scan` | PASS — initial BL6 run scanned 507 tracked files; final staged-doc rerun recorded below |

The four required gates were rerun locally in this workspace on 2026-06-08 around 00:22 CST.

## Package verification

| Check | Result |
| --- | --- |
| `sha256sum -c servicenow-automation-windows-v0.1.0-public-20260607.zip.sha256` from `dist/release/` | PASS |
| Independent SHA256 recompute | PASS — matches sidecar and START-HERE |
| ZIP integrity via Python `zipfile.testzip()` | PASS |
| ZIP entry count | 87 |
| Required entries | PASS — `ServiceNow Automation.exe`, `resources/app.asar`, `resources/release-metadata.json`, `resources/scripts/windows/start-dedicated-chromium-cdp.ps1`, `resources/scripts/local-cdp-bridge.py` |
| Forbidden release entries | PASS — 0 matches for `.git`, env files, cookies, storage-state, HAR, screenshots, traces, PEM/key material |
| Inner `resources/release-metadata.json` package filename | PASS — `servicenow-automation-windows-v0.1.0-public-20260607.zip` |
| Inner package phase | PASS — `PUBLIC` |
| Inner Windows UNC path | PASS — Ubuntu-Compact UNC path for the public zip |
| START-HERE safety text | PASS — includes no-write restriction: `No Save / Submit / Update / Resolve / Close automation.` |

Observation: the inner metadata `sha256` field is empty. This is not treated as blocking for Alan manual validation because the external checksum sidecar, START-HERE checksum, and independent recompute all match; however, a BM public-release worker should decide whether the inner metadata checksum should be populated before a GitHub Release.

## Screenshot-fix acceptance evidence

Alan's screenshot findings were checked against the BL1-BL5 implementation and package candidate:

1. Sidebar/source repetition: code has a single `workbench-sidebar` render path and source section; automated desktop tests pass.
2. Overcrowded release/checklist area: release/package details are now behind a collapsed `details` section; CSS uses a three-column grid (`minmax(15rem, 0.78fr) minmax(28rem, 1.9fr) minmax(18rem, 0.95fr)`).
3. Empty whitespace/status conflicts: the center workbench flow is first, with release details moved out of the primary flow; package state is backed by the current marker above.
4. Top handoff action dominance: package actions are no longer the primary visible work product; they are inside collapsed release details.
5. Copy/content fixes: old copy `Alan should test this file first`, `SOURCE OF TRUTH`, and `No archives aliases` are absent from `App.tsx`; current copy uses `Open the current package first and verify it locally.`, `Current package source`, and `No archival aliases found in local release metadata.`
6. Chinese primary headings: `SOURCES` and `WORK PRODUCT` now render through `workbenchCopy.nav.sources` and `workbenchCopy.workProduct` with zh-CN/zh-TW/es-ES entries.
7. Workflow separation/order: the primary center order is Selected source detail → Cleaned summary → Incident draft → Guided demo path → Local KB recommendations → Monthly Excel fill queue; release/package details are secondary.

Known conditional items inherited from BL3/BL5:

- Some secondary/collapsed release, repo hygiene, worktree, guided path, KB, and monthly Excel strings remain hardcoded English.
- Global text size/contrast still needs actual Windows Electron visual verification.
- This worker did not perform real Windows double-click/CDP manual validation.

These are why BL6 is `READY FOR ALAN MANUAL VALIDATION ONLY`, not a direct GitHub public-release green light.

## Safety and privacy

- No real ServiceNow login, browser operation, API write, or customer/ticket data was used.
- No Save / Submit / Update / Resolve / Close automation was added or executed.
- No attachment upload, Microsoft Graph/Excel Web write, Teams/Outlook/phone ingestion, GitHub push, PR, merge, tag, or release was performed.
- Package instructions retain the no-write safety boundary.

## Alan manual validation checklist

Before any BM GitHub public-release action, Alan should validate this exact file:

`\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-public-20260607.zip`

1. Extract the package on Windows.
2. Double-click `ServiceNow Automation.exe` and confirm it opens without crash.
3. Confirm the sidebar/source panel appears once, not repeated.
4. Confirm the workbench primary order is Selected source detail → Cleaned summary → Incident draft → Guided demo path → Local KB recommendations → Monthly Excel fill queue.
5. Confirm release/package details are collapsed or visually secondary and do not overlap the main workflow.
6. Switch to 简体中文 and confirm primary workbench labels are localized enough for the intended public preview.
7. Start QA Chromium locally, wait for CDP connected, and use Verify-only behavior only.
8. Do not perform any live ServiceNow writes or submit/update/resolve/close actions.

## Final staged privacy scan

PASS — after staging this BL6 status file and the BL1-BL5 release-line files, `pnpm privacy:scan` reported `TRACKED_PRIVACY_SCAN_PASS files=513`.
