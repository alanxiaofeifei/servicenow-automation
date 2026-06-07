# Phase BL3 — Windows Local Package Refresh

**Date:** 2026-06-07
**Worker:** @sna-windows-runtime
**Parent task:** t_33b359a2 (BL2 — current package loading regression fix)

## Package artifact

| Attribute | Value |
|---|---|
| Linux path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` |
| SHA-256 | `6258758a89f8d9602a913ce37eb8e80e7f2e689f8859c5b0a02a4839dd03c52d` |
| Size | 118,608,396 bytes (~113 MB) |
| mtime | 2026-06-07 22:19:52 CST |
| Phase marker | `bl3-20260607-local` |

## Companion files

| File | Path |
|---|---|
| START-HERE | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local-START-HERE-WINDOWS.txt` |
| SHA256 sidecar | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip.sha256` |
| CURRENT.txt | `dist/release/CURRENT.txt` — updated to `bl3` |

## Gates

| Gate | Result |
|---|---|
| `pnpm build` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass — 465 tests across 36 test files |
| `pnpm privacy:scan` | Pass — 289 files scanned |

## Archive verification

- `sha256sum -c` — OK (checksum matches)
- `unzip -t` — No errors detected in compressed data
- `app.asar` — present at `resources/app.asar`
- `start-dedicated-chromium-cdp.ps1` — present in archive
- `local-cdp-bridge.py` — present in archive
- START-HERE safety wording — contains P0 restriction, no raw ServiceNow instructions

## What's included

This package incorporates the BL2 fix (current package loading regression):

1. **Renderer fix** (App.tsx) — metadata is always stored (including `ok:false`), so the UI renders "unavailable" instead of indefinite "still loading"
2. **IPC fix** (worktree-ipc.ts) — reads `dist/release/CURRENT.txt` first as source of truth before falling back to newest ZIP

## What Alan should test (manual Windows)

1. **Double-click launch** — open the UNC path in File Explorer, extract the zip, run `ServiceNow Automation.exe`
2. **App window opens** — a visible tool window should appear
3. **Startup diagnostic** — verify the app shows clear startup status without raw ServiceNow data
4. **Current package label** — verify the app shows `bl3` package as current, not indefinite "still loading"
5. **CURRENT.txt content** — verify it matches `servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip`
6. **Safety boundaries** — verify no Save/Submit/Update/Resolve/Close automation activated
7. **Privacy** — verify no raw ServiceNow URLs, ticket IDs, sys_ids, or credential leakage in logs or UI

## Safety/privacy status

- No real ServiceNow credentials, URLs, ticket IDs, or session data in the build output
- P0 restriction wording included in START-HERE
- `privacy:scan` passes with all 289 tracked files clean
- No push/merge/tag/release performed

## Remaining risks

- Manual Windows double-click validation still needed (not automated in this phase)
- Packaged-mode `runtime-paths.ts` fix deferred (see parent BL2 notes)
- WSL path conversion for Windows-native paths not yet tested end-to-end
