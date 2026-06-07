\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip

# Phase BA7 — Final Local Readiness Gate

Date: 2026-06-07
Scope: BA final local readiness gate for the refreshed BA6 Windows package.
Verdict: READY-FOR-MANUAL-VALIDATION-ONLY

## Alan manual validation package

Use the exact Windows UNC path on line 1 of this document. Alan should copy that path into Windows File Explorer or Win+R, extract the ZIP locally on Windows, then launch `ServiceNow Automation.exe` for supervised manual validation only.

Linux path:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip
```

## Package facts verified locally

| Check | Result |
|---|---|
| Package filename | `servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip` |
| Size | 118,603,741 bytes |
| SHA256 | `1e784ea3dfdb0f37da2da75a6beaaec46fa8d4da4ec1359b4843edeefb3cd07b` |
| Sidecar SHA256 | PASS — `sha256sum -c` returned `servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip: OK` from `dist/release/` |
| mtime local | 2026-06-07 16:54:39 CST +0800 |
| Newest `.zip` in `dist/release/` | PASS — BA6 is newest; AZ6 and AY6 remain archival local builds |
| Archive verification | PASS — 86 archive entries; `resources/app.asar`, `resources/scripts/local-cdp-bridge.py`, `resources/scripts/windows/evaluate-local-cdp-expression.ps1`, and `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` present; no forbidden filename matches found |
| START-HERE handoff line 1 | PASS — `servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local-START-HERE-WINDOWS.txt` now starts with the same exact Windows UNC path |

## Required readiness gates

| Requirement | Result | Sanitized evidence |
|---|---|---|
| BA4 QA acceptance | PASS | Parent BA6 handoff recorded BA4 QA verdict PASS. Fresh local gates below also pass. |
| BA5 privacy/security | APPROVE | Parent BA6 handoff recorded BA5 privacy verdict APPROVE. Fresh privacy scan below also passes. |
| BA6 package refresh | PASS | BA6 ZIP exists, sidecar SHA256 matches the current ZIP, and BA6 is the newest local release ZIP. |
| Hermes profile show | PASS | `hermes profile show codex-gpt55-control` returned profile path, model/provider, skills count, and gateway running status without secrets. |
| Hermes tools status | PASS | `hermes tools list` returned enabled/disabled toolset status successfully. |
| Hermes gateway status | PASS | `hermes gateway status` returned running in WSL foreground/manual mode. |
| `pnpm build` | PASS | Fresh local run: desktop main/preload/renderer and CLI build passed. |
| `pnpm typecheck` | PASS | Fresh local run: 7 workspace projects typechecked clean. |
| `pnpm test` | PASS | Fresh local run: 457 tests passed across core, ai, kb, profiles, adapters, cli, and desktop. |
| `pnpm privacy:scan` | PASS | Fresh local run: `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| No real ServiceNow login/browser/API write | PASS | Local-only repo, package, and Hermes status commands only. |
| No Save/Submit/Update/Resolve/Close | PASS | No write-path workflow executed. |
| No attachment upload | PASS | No upload action executed. |
| No Microsoft Graph / Excel Web write | PASS | No Microsoft Graph or Excel Web action executed. |
| No real Teams/Outlook/phone ingestion | PASS | No external ingestion action executed. |
| No secrets/cookies/storage/HAR/trace/screenshots printed or submitted | PASS | Handoff contains sanitized local package and gate facts only. |
| No push / PR / merge / tag / GitHub Release | PASS | Local-only work; no publication action performed. |
| No recursive cron-job changes | PASS | No cron files or schedules changed. |

## BA scope summary

This BA gate covers the local-only runtime evidence/operator feedback package readiness checkpoint and the refreshed BA6 Windows package. The local package sidecar and archive structure were verified after the parent QA, privacy/security, and package-refresh gates.

No production release is approved by this gate. The package is ready for Alan manual validation only.

## Manual validation requested

Alan should manually validate the local Windows package from the UNC path on line 1. Suggested local-only checks:

- Extract the ZIP in a clean Windows folder.
- Launch `ServiceNow Automation.exe`.
- Confirm the runtime evidence panel appears in the operator workbench right rail and shows sanitized history only.
- Confirm status indicators, timestamps, collapsible detail rows, and empty state behave as expected.
- Confirm disabled reasons remain specific and safety-first.
- Stop before any real ServiceNow login, real field interaction, save, submit, update, resolve, close, attachment, external ingestion, or live write action unless a separate checkpoint explicitly approves it.

## Final verdict

READY-FOR-MANUAL-VALIDATION-ONLY.

This is not a release claim, not a merge approval, and not a GitHub Release/tag/PR action.

---

This document is local-only. No real ServiceNow login, browser operation, API write, Microsoft Graph/Excel Web write, Teams/Outlook/phone ingestion, push, PR, merge, tag, or release was performed.
