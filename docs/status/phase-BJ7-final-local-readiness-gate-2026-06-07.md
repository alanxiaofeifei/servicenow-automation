# BJ7 — Final Local Readiness Gate

**Date:** 2026-06-07  
**Verdict:** READY-FOR-MANUAL-VALIDATION-ONLY

## Current package Alan should test

`servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`

- **Windows UNC path (paste into File Explorer):** `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`
- **Linux path:** `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`
- **Size observed at BJ7:** 122,804,335 bytes
- **SHA-256:** `336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e`
- **Sidecar:** `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip.sha256`
- **START-HERE:** `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local-START-HERE-WINDOWS.txt`

## Required local gates

| Gate | Result | Evidence |
|---|---:|---|
| `pnpm build` | PASS | Electron/Vite and CLI builds completed |
| `pnpm typecheck` | PASS | 7 workspace projects completed typecheck |
| `pnpm test` | PASS | 459/459 tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, CLI 55, desktop 169 |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288` |
| `sha256sum -c` on BJ6 ZIP | PASS | `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip: OK` |

## Freshness checks

| Surface | Result | Evidence |
|---|---:|---|
| `dist/release/CURRENT.txt` | PASS | `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip` |
| Current release directory after cleanup | PASS | Only BJ6 ZIP, BJ6 sidecar, BJ6 START-HERE, and `CURRENT.txt` remain |
| START-HERE beside ZIP | PASS | Package name, UNC path, and SHA-256 all point to BJ6 |
| Checksum sidecar | PASS | Sidecar hash is `336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e` |

## Archive-demotion feature checks

| Feature check | Result | Evidence |
|---|---:|---|
| Archive-demotion works | PASS | `handleCleanupExecute` archived 33/33 stale local files with 0 failures |
| Stale count after cleanup | PASS | `handleCleanupPreview` after execution returned `totalFiles: 0`, `totalSizeBytes: 0`; `handleHygieneScan` returned `staleArtifactCount: 0` |
| Confirmation dialog shows correct counts | PASS | Renderer dialog uses `cleanupPreviewResult.totalFiles` in `Confirm archive of {cleanupPreviewResult.totalFiles} packages and files?`; the BJ7 preview count before execution was 33 |
| Post-archive re-scan shows clean state | PASS | Hygiene scan returned `staleArtifactDetails: No stale dist/release/ artifacts detected.` |
| Archive directory populated correctly | PASS | `dist/.release-archive/` now contains 11 BJ-prefixed phase directories: `BJ-ay6`, `BJ-az6`, `BJ-ba6`, `BJ-bb6`, `BJ-bc6`, `BJ-bd6`, `BJ-be6`, `BJ-bf6`, `BJ-bg6`, `BJ-bh6`, `BJ-bi6`; each contains 3 files |
| Current package kept separate | PASS | BJ6 package set stayed in `dist/release/`; stale phases moved under `dist/.release-archive/BJ-*/` |

**Count note:** BJ1/BJ4 expected 10 stale phases / 30 files while BI6 was current. BJ6 then refreshed the package to BJ6, so BI6 correctly became stale for the final BJ7 cleanup. The actual BJ7 cleanup therefore archived 11 stale phases / 33 files and left BJ6 as the only current package set.

**Non-blocking copy note:** BJ5 already noted that some renderer destination copy says `dist/.release-archive/<phase>/` while the IPC implementation writes `dist/.release-archive/BJ-<phase>/`. This final gate verified the functional archive destination is BJ-prefixed. The copy mismatch is not a blocker for local manual validation, but future UX cleanup should align the displayed destination with the actual BJ-prefixed path.

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
- The only local artifact mutation was the requested archive-demotion move from `dist/release/` into gitignored `dist/.release-archive/BJ-*/`.

## Manual validation instruction for Alan

Alan should test **only** the BJ6 package above:

1. Paste this UNC path into Windows File Explorer:  
   `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`
2. Confirm the package name is exactly:  
   `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`
3. Confirm the SHA-256 is exactly:  
   `336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e`

This verdict is **manual-validation only**. It does not approve live ServiceNow operation, external writes, release publication, GitHub Release creation, tagging, merging, or attachment upload.
