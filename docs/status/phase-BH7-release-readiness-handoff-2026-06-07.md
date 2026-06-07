# BH7 — Final Local Readiness Gate

**Date:** 2026-06-07  
**Verdict:** READY-FOR-MANUAL-VALIDATION-ONLY

## Current package Alan should test

`servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip`

- **Windows UNC path (paste into File Explorer):** `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip`
- **Linux path:** `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip`
- **Size:** 118,607,782 bytes
- **SHA-256:** `583929076a1dd5fcb50b876ad199c7318e2407deb6bc74e158a2284eef7d5d1d`
- **Sidecar:** `servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip.sha256`

## Freshness checks

| Surface | Result | Evidence |
|---|---:|---|
| `dist/release/CURRENT.txt` | PASS | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bh6-20260607-local.zip` |
| Newest ZIP in `dist/release/` | PASS | newest mtime is the BH6 ZIP; it matches the current marker |
| Checksum sidecar | PASS | `sha256sum -c` returns OK for the BH6 ZIP |
| START-HERE beside ZIP | PASS | package name, explicit UNC path, and SHA-256 all point to BH6 |
| START-HERE embedded in ZIP | PASS | package name and explicit UNC path point to BH6; checksum delegates to the sidecar |
| Release handoff copy surfaces | PASS | source code builds current marker/path/summary from local package metadata, not a hardcoded phase |

## Required local gates

| Gate | Result |
|---|---:|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 459/459 tests |
| `pnpm privacy:scan` | PASS — `TRACKED_PRIVACY_SCAN_PASS files=288` |
| `sha256sum -c` on refreshed ZIP | PASS |

## Local profile/tooling gate

| Check | Result |
|---|---:|
| `hermes profile show codex-gpt55-control` | PASS — profile resolves; gateway reported running |
| `hermes tools list` | PASS — CLI tool listing returned enabled/disabled status |
| `hermes gateway status` | PASS — gateway running; related SNA profiles reported running |

## Safety boundary

- No live ServiceNow login, browsing, API write, Save / Submit / Update / Resolve / Close, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion was performed.
- No screenshots, HAR, traces, cookies, storage-state, secrets, requester names, assignment groups, real field values, ticket IDs, or sys_ids were captured or included here.
- No push, PR, merge, tag, GitHub Release, publish, or cron changes were performed.

## Manual validation instruction

Alan should use the BH6 UNC path above as the current package anchor. This verdict is **manual-validation only**; it does not approve live ServiceNow operation or any release/publish action.
