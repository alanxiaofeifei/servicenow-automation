Alan should test this file: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip

# Phase AT7 — Final Local Readiness Gate (Dynamic Archival Alias Discovery)

**Date:** 2026-06-07 13:49 CST (+0800)  
**Task:** `t_e59c8ba5`  
**Worker:** `codex-gpt55-control`  
**Verdict:** **READY-FOR-MANUAL-VALIDATION-ONLY**

---

## Summary

The AT6 Windows zip is the newest local Windows package on disk, its checksum sidecar matches, required package contents are present, the current package path is explicit and unambiguous, older aliases remain archival-only, and all required local automated gates pass.

Return value for this gate: **READY-FOR-MANUAL-VALIDATION-ONLY**.

---

## Upstream Dependencies

| Phase | Status | Source |
|---|---:|---|
| AT4 QA acceptance | PASS | Parent AT6 handoff gating context |
| AT5 privacy/security audit | APPROVE | Parent AT6 handoff gating context |
| AT6 Windows local package refresh | PASS | Parent `t_faf3a178`; package `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` |

---

## Required Gates Run in This Pass

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | Workspace build completed; Electron/Vite transformed 30 main modules, 1 preload module, and 56 renderer modules. |
| `pnpm typecheck` | PASS | All 7 workspace projects with `--if-present` typecheck completed with no type errors. |
| `pnpm test` | PASS | 455 tests passed across core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, and desktop 165. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| Package checksum | PASS | From `dist/release/`, `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip.sha256` returned `OK`; calculated SHA256 matches the sidecar. |
| Package contents spot-check | PASS | Zip integrity `testzip()` returned `None`; 86 zip entries; required executable, `resources/app.asar`, CDP PowerShell helper, local CDP bridge, and package-specific `START-HERE-WINDOWS.txt` are present. |
| Forbidden package-entry spot-check | PASS | Forbidden screenshot/HAR/trace/storage/cookie/media entry count: 0. |
| START-HERE safety spot-check | PASS | Package-specific START-HERE file frames the artifact as supervised local testing, states it does not approve live ServiceNow operation, requires mock/demo workflows first, and repeats the no Save/Submit/Update/Resolve/Close boundary. |
| Current package path clarity | PASS | `wslpath -w` produced exactly one UNC path for the AT6 zip, shown on the first line of this document. |
| Dynamic archival alias behavior | PASS | Desktop renderer tests cover dynamic archival aliases from package metadata and confirm the removed hard-coded alias phrase; Electron IPC tests cover deriving aliases from older zips, no-alias behavior, and deduplication. |
| Older packages archival-only | PASS | AT6 is newest by mtime; AS6, AR3, and AQ6 packages remain older local artifacts and are not the current manual validation target. Local release inventory derives archival aliases as `AQ6`, `AR3`, and `AS6`. |
| Hermes/profile/gateway status | PASS | `codex-gpt55-control` profile show succeeded; `hermes tools list` succeeded; gateway status reports running. |

---

## Current Package Verification

Newest local Windows package on disk:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip
```

Windows UNC path Alan should test:

```text
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip
```

Verified artifact metadata:

| Field | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` |
| Size | 118,604,635 bytes |
| SHA256 | `4f459b7a8c603a04a430e089d89a304d8bd844f27ffe5a460cad04a056ade328` |
| SHA256 sidecar | `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip.sha256` matches (`OK`) |
| Package mtime | 2026-06-07 13:45:32 CST (+0800) |
| Newest by mtime | PASS — newer than AS6 (`2026-06-07 13:06:25 CST +0800`), AR3 (`2026-06-07 12:08:26 CST +0800`), and AQ6 (`2026-06-07 09:06:54 CST +0800`) |

`dist/release/` currently contains these local Windows packages:

| File | Role observed by this gate |
|---|---|
| `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local.zip` | Newest/current manual validation target |
| `servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip` | Older than AT6; archival-only, not the current manual validation target |
| `servicenow-automation-windows-v0.1.0-rc.1-ar3-20260607-local.zip` | Older than AT6; archival-only, not the current manual validation target |
| `servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip` | Older than AT6; archival-only, not the current manual validation target |

---

## Package / Handoff Spot-Checks

- Package checksum sidecar matches the AT6 zip hash.
- Zip integrity check found no corrupt member.
- Required entries present: `ServiceNow Automation.exe`, `resources/app.asar`, `resources/scripts/windows/start-dedicated-chromium-cdp.ps1`, `resources/scripts/local-cdp-bridge.py`, and `servicenow-automation-windows-v0.1.0-rc.1-at6-20260607-local-START-HERE-WINDOWS.txt`.
- Package entry scan found zero screenshot/HAR/trace/storage/cookie/media entries.
- `apps/desktop/electron/worktree-ipc.ts` derives archival aliases from older local zip metadata rather than accepting user-supplied arguments.
- `apps/desktop/src/App.test.ts` confirms dynamic alias rendering, archival-only copy, no-alias copy, and removal of the stale hard-coded alias phrase.

---

## Safety / Red-Zone Compliance

This gate stayed local-only:

- No real ServiceNow login, browsing, or API writes.
- No Save / Submit / Update / Resolve / Close.
- No attachment upload.
- No Microsoft Graph / Excel Web writes.
- No real Teams / Outlook / phone ingestion.
- No screenshots, HAR, traces, cookies, storage-state, secrets, raw ticket/customer identifiers, or real field values captured, printed, or submitted.
- No push, PR, merge, tag, GitHub Release, publish, or cron changes.
- Evidence in this report is sanitized and limited to local gate outcomes, package names, sizes, checksums, and local paths.

---

## Recommendation

**READY-FOR-MANUAL-VALIDATION-ONLY.**

Alan should manually validate the AT6 package at the UNC path above on Windows, extract it, read `START-HERE-WINDOWS.txt`, and proceed only with local/mock-safe checks. Older AS6/AR3/AQ6 packages are archival-only and should not be used as the current validation target.
