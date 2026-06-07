# BK7 — Final Local Readiness Gate

**Date:** 2026-06-07  
**Verdict:** READY-FOR-MANUAL-VALIDATION-ONLY

## Current package Alan should test

`servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip`

- **Windows UNC path (paste into File Explorer):** `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip`
- **Linux path:** `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip`
- **Size observed at BK7:** 118,608,380 bytes
- **SHA-256:** `059266c38b9e1b102016e0ea06942780724dc3c09e3e1d73fc679c184c388d54`
- **Sidecar:** `servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip.sha256`
- **START-HERE:** `servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local-START-HERE-WINDOWS.txt`

## Required local gates

| Gate | Result | Evidence |
|---|---:|---|
| `pnpm build` | PASS | Electron/Vite renderer build completed; renderer asset `apps/desktop/out/renderer/assets/index-fjLy4lGB.js` produced |
| `pnpm typecheck` | PASS | 7 workspace projects completed typecheck |
| `pnpm test` | PASS | 459/459 tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, CLI 55, desktop 169 |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288` |
| `sha256sum -c` on BK6 ZIP | PASS | `servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip: OK` |

## Package freshness checks

| Surface | Result | Evidence |
|---|---:|---|
| `dist/release/CURRENT.txt` | PASS | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip` |
| BK6 package mtime | PASS | BK6 ZIP and sidecars are newer than the prior local package set |
| START-HERE beside ZIP | PASS | Package name, UNC path, and SHA-256 all point to BK6 |
| Checksum sidecar | PASS | Sidecar hash is `059266c38b9e1b102016e0ea06942780724dc3c09e3e1d73fc679c184c388d54` |

## Archive-destination copy verification

| Check | Result | Evidence |
|---|---:|---|
| Source copy uses `BJ-<phase>` | PASS | `apps/desktop/src/App.tsx` uses `dist/.release-archive/BJ-&lt;phase&gt;/` in the stale block, preview block, reminder, footer, and confirmation copy |
| Rendered app bundle uses `BJ-<phase>` | PASS | Built renderer asset `apps/desktop/out/renderer/assets/index-fjLy4lGB.js` contains `dist/.release-archive/BJ-<phase>/` in the same rendered copy surfaces |
| Bare `<phase>` archive destination absent | PASS | No built renderer match for `dist/.release-archive/<phase>/` or `dist/.release-archive/&lt;phase&gt;/` |
| Local-only archive language preserved | PASS | Rendered copy says no upload / PR / merge / tag / release, and describes the archive destination as a local move |

## Local profile/tooling gate

| Check | Result | Evidence |
|---|---:|---|
| `hermes profile show codex-gpt55-control` | PASS | Profile resolves at `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; model `gpt-5.5`; gateway running |
| `hermes tools list` | PASS | CLI returned enabled/disabled built-in toolset list |
| `hermes gateway status` | PASS | Gateway running in WSL manual mode; SNA profiles reported running |

## Safety boundary

- No live ServiceNow login, browsing, API write, Save / Submit / Update / Resolve / Close, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion was performed.
- No screenshots, HAR, traces, cookies, storage-state, secrets, requester names, assignment groups, real field values, ticket IDs, sys_ids, raw ServiceNow URLs, or page fingerprints were captured or included here.
- No push, PR, merge, tag, GitHub Release, publish, or cron changes were performed.
- This verdict does **not** authorize release, publish, merge, tag, push, GitHub Release creation, live validation, attachment upload, or external write activity.

## Manual validation instruction for Alan

Alan should test **only** the BK6 package above:

1. Paste this UNC path into Windows File Explorer:  
   `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip`
2. Confirm the package name is exactly:  
   `servicenow-automation-windows-v0.1.0-rc.1-bk6-20260607-local.zip`
3. Confirm the SHA-256 is exactly:  
   `059266c38b9e1b102016e0ea06942780724dc3c09e3e1d73fc679c184c388d54`
4. Read the START-HERE sidecar before launching the app.

This verdict is **manual-validation only**. It is not release approval and it does not authorize live ServiceNow operation, external writes, release publication, GitHub Release creation, tagging, merging, or attachment upload.
