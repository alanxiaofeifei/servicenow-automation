# Phase AZ7 — Final Local Readiness Gate

Date: 2026-06-07
Scope: AZ scope final local readiness gate — package housekeeping / AZ6 refreshed local Windows package
Verdict: READY-FOR-MANUAL-VALIDATION-ONLY

## Alan manual validation package

Use this exact Windows UNC path:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip
```

Linux path:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip
```

Alan should copy the UNC path above into Windows File Explorer, extract the zip locally, and run `ServiceNow Automation.exe` for manual validation only.

## Package facts verified locally

| Check | Result |
|---|---|
| Package filename | `servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip` |
| Size | 118,603,008 bytes |
| SHA256 | `cf936e3269d34a26e2550adb863e2e1e694150ac0ab2441733d67fe67d69fe19` |
| Sidecar SHA256 | PASS — `sha256sum -c` returned `servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip: OK` |
| mtime local | 2026-06-07 16:25:56 CST +0800 |
| Newest `.zip` in `dist/release/` | PASS — AZ6 zip is newest; AY6 remains archival |

## Required readiness gates

| Requirement | Result | Sanitized evidence |
|---|---|---|
| QA acceptance gate | PASS | AZ4 verdict PASS; automated gates and AZ acceptance criteria passed. Alan clean-machine manual execution is still required. |
| Privacy/security gate | APPROVE | AZ5 privacy/security audit has no blocking issues. Kanban handoff carried one non-blocking condition about stale `App.test.ts` AX6 fixture metadata; automated gates still pass and this does not approve real ServiceNow use. |
| Package-refresh gate | PASS | AZ6 package exists, sidecar SHA256 matches current package, and AZ6 is the newest local release zip. |
| Hermes profile show | PASS | `hermes profile show codex-gpt55-control` returned profile path, model/provider, skills count, and gateway running status without secrets. |
| Hermes tools status | PASS | `hermes tools list` returned enabled/disabled toolset status successfully. |
| Hermes gateway status | PASS | `hermes gateway status` returned running in WSL foreground/manual mode. |
| `pnpm build` | PASS | Fresh local run: desktop main/preload/renderer and CLI build passed. |
| `pnpm typecheck` | PASS | Fresh local run: 7 workspace projects typechecked clean. |
| `pnpm test` | PASS | Fresh local run: 453 tests passed across core, ai, kb, profiles, adapters, cli, and desktop. |
| `pnpm privacy:scan` | PASS | Fresh local run: `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| No real ServiceNow login/browser/API write | PASS | Local-only repo commands, package inspection, and Hermes status checks only. |
| No Save/Submit/Update/Resolve/Close | PASS | No write-path workflow executed. |
| No attachment upload | PASS | No upload action executed. |
| No Microsoft Graph / Excel Web write | PASS | No Microsoft Graph or Excel Web action executed. |
| No real Teams/Outlook/phone ingestion | PASS | No external ingestion action executed. |
| No secrets/cookies/storage/HAR/trace/screenshots printed or submitted | PASS | Handoff contains sanitized local package and gate facts only. |
| No push / PR / merge / tag / GitHub Release | PASS | Local-only work; no publication action performed. |
| Exact Windows UNC path present | PASS | Prominent path appears at the top of this document. |

## AZ scope summary

This AZ gate covers the local-only package housekeeping readiness checkpoint and the refreshed AZ6 Windows package. The local package sidecar and current ZIP content were verified after the parent QA, privacy/security, and package-refresh gates.

No production release is approved by this gate. The package is ready for Alan manual validation only.

## Manual validation requested

Alan should manually validate the local Windows package from the UNC path above. Suggested local-only checks:

- Extract the zip in a clean Windows folder.
- Launch `ServiceNow Automation.exe`.
- Confirm the Release Readiness Handoff card presents the current AZ6 package path/hash and treats older phases as archival aliases where applicable.
- Confirm the three-card workflow remains separated: Start QA Chromium, Verify current Incident, then Autofill only after read-only verification.
- Confirm no workflow asks Alan to Save, Submit, Update, Resolve, Close, upload attachments, or perform any live ServiceNow write action.

## Final verdict

READY-FOR-MANUAL-VALIDATION-ONLY.

This is not a release claim, not a merge approval, and not a GitHub Release/tag/PR action.

---

This document is local-only. No real ServiceNow login, browser operation, API write, Microsoft Graph/Excel Web write, Teams/Outlook/phone ingestion, push, PR, merge, tag, or release was performed.
