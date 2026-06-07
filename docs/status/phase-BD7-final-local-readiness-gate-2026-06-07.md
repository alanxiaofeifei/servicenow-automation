\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip

# Phase BD7 — Final Local Readiness Gate

Date: 2026-06-07
Profile: `codex-gpt55-control`
Task: `t_fed12d1c`
Branch: `next/post-release-operator-cockpit-ab-20260606`
Scope: Final local readiness gate for the BD6 Windows local package after the current-package UNC prefix phase.
Verdict: READY-FOR-MANUAL-VALIDATION-ONLY

## Alan manual validation package

Use the exact Windows UNC path on line 1 of this document. Alan should copy that path into Windows File Explorer or Win+R, extract the ZIP locally on Windows, read `START-HERE-WINDOWS.txt`, then launch `ServiceNow Automation.exe` for supervised manual validation only.

Linux path:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip
```

Windows UNC path:

```text
\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip
```

## Package facts verified locally

| Check | Result |
|---|---|
| Artifact name | `servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip` |
| Artifact path exists | PASS |
| Checksum sidecar exists | PASS — `servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip.sha256` |
| START-HERE sidecar exists | PASS — `servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local-START-HERE-WINDOWS.txt` |
| Size | 118,604,358 bytes (~113.1 MiB) |
| SHA256 | `3054053cd4b826b29067eb1e5c93b8274a6e6bfa02ce639f7373bf2bcb40c434` |
| `sha256sum -c` | PASS — `servicenow-automation-windows-v0.1.0-rc.1-bd6-20260607-local.zip: OK` from `dist/release/` |
| Zip structure spot-check | PASS — 86 entries; exactly one each of `START-HERE-WINDOWS.txt`, `resources/app.asar`, `resources/scripts/local-cdp-bridge.py`, `resources/scripts/windows/start-dedicated-chromium-cdp.ps1`, and `ServiceNow Automation.exe` |
| Forbidden archive markers checked | PASS — zero matches for `.git/`, `.auth/`, `coverage/`, `.har`, `.trace`, `.png`, `.cookies.json`, and `storage-state` |
| Test doc matches artifact | PASS — `docs/test/windows-clean-machine-validation-2026-06-07.md` names the BD6 ZIP, exact BD6 UNC path, SHA256, size, extraction folder, and local-only/manual validation flow |
| Handoff sidecar matches artifact | PASS — BD6 START-HERE sidecar filename matches the BD6 artifact stem; content is the intended generic safety handoff and contains no conflicting package name/checksum/path |

## Required local gates

Fresh local runs from `/home/alanxwsl/projects/servicenow-automation`:

| Gate | Result | Sanitized evidence |
|---|---|---|
| `pnpm build` | PASS | Desktop main/preload/renderer and CLI build completed cleanly. |
| `pnpm typecheck` | PASS | 7 workspace projects typechecked cleanly. |
| `pnpm test` | PASS | 455 tests passed across 7 packages: core 83, kb 6, profiles 17, ai 34, adapters 95, cli 55, desktop 165. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| Hermes profile show | PASS | `hermes profile show codex-gpt55-control` returned profile path/model/provider summary and gateway running status without secrets. |
| Hermes tools status | PASS | `hermes tools list` returned enabled/disabled toolset status successfully. |
| Hermes gateway status | PASS | `hermes gateway status` returned running in WSL foreground/manual mode. |

## Safety boundary verification

| Boundary | Result |
|---|---|
| No real ServiceNow login/browser/API write | PASS — local-only repo, docs, package, checksum, archive, Hermes status, and test commands only. |
| No Save / Submit / Update / Resolve / Close | PASS — no write-path workflow executed. |
| No attachment upload | PASS — no upload action executed. |
| No Microsoft Graph / Excel Web write | PASS — no Microsoft Graph or Excel Web action executed. |
| No real Teams / Outlook / phone data ingestion | PASS — no external ingestion action executed. |
| No secrets/cookies/storage-state/HAR/traces/screenshots printed or stored | PASS — this handoff contains sanitized local package and gate facts only. |
| No push / PR / merge / tag / GitHub Release / publish | PASS — local-only work; no publication action performed. |
| No cron job changes | PASS — no schedules or cron files were added or modified. |

## Manual validation requested

Alan should manually validate the BD6 package from the exact UNC path on line 1:

1. Open the UNC path in Windows File Explorer or Win+R.
2. Copy the ZIP to a local Windows folder and extract it.
3. Read `START-HERE-WINDOWS.txt` before launching.
4. Launch `ServiceNow Automation.exe` and follow `docs/test/windows-clean-machine-validation-2026-06-07.md` for local/manual checks.
5. Stop before any real ServiceNow login, real field interaction, save, submit, update, resolve, close, attachment, external ingestion, or live write action unless a separate checkpoint explicitly approves it.

## Final verdict

READY-FOR-MANUAL-VALIDATION-ONLY.

This BD7 gate approves local manual validation of the exact BD6 package above. It is not a release claim, merge approval, GitHub Release, tag, PR, publish action, or approval for live ServiceNow/browser/API writes.

---

This document is local-only. No real ServiceNow login, browser operation, API write, Microsoft Graph/Excel Web write, Teams/Outlook/phone ingestion, push, PR, merge, tag, release, publish, or cron change was performed.
