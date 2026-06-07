# Phase AQ6 — Windows Local Package Refresh (after AQ3 wiring changes)

**Date**: 2026-06-07
**Task**: t_1ad56a77
**Worker**: sna-windows-runtime

## Result

✅ PASS — Fresh AQ6 Windows package built, verified, and ready.

## Artifacts

| File | Size | SHA256 |
|------|------|--------|
| `dist/release/servicenow-automation-windows-v0.1.0-rc.1-aq6-20260607-local.zip` | 114 MB | `03e64095222086490601b1252dce9833c012cc726bce27f73875ea442a3b245e` |
| `dist/release/*.sha256` | — | Checksum verified OK |
| `dist/release/*-START-HERE-WINDOWS.txt` | — | Present |

## Acceptance Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Fresh AQ-dated zip is newest in dist/release/ | ✅ | Built 09:06; all 3 files timestamped 09:06 |
| 2 | SHA256 checksum verified | ✅ | `sha256sum -c` returns OK |
| 3a | Archive contains `resources/app.asar` | ✅ | Listed in zip contents |
| 3b | Archive contains CDP PowerShell helper | ✅ | `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` present |
| 3c | Archive contains local-cdp-bridge.py | ✅ | `resources/scripts/local-cdp-bridge.py` present |
| 3d | No forbidden directories in archive | ✅ | (no .git, .local, private, etc.) |
| 3e | No forbidden sensitive files in archive | ✅ | (no storage-state, cookies, HAR, screenshots, etc.) |
| 4 | pnpm build passes in packaged context | ✅ | `pnpm build` + `electron-builder --win zip` completed successfully |

## Commands Run

```bash
SDA_RELEASE_VERSION=v0.1.0-rc.1-aq6-20260607-local \
  bash scripts/packaging/build-windows-rc.sh
```

## Changes from Previous AQ6 Package

- Previous package (09:02, SHA `093ab317...`, 118 MB) replaced by fresh build (09:06, SHA `03e64095...`, 114 MB)
- Both include AQ3 wiring changes (worktree-ipc.ts, main.ts IPC handlers, preload.ts channels, App.tsx UI)
- Size difference is normal asar-packing variation

## Safety / Privacy

- Build script uses no ServiceNow URLs, cookies, sessions, tickets, sys_ids, or field values
- No real ServiceNow login, browsing, API writes, or automation
- No GitHub push, PR, merge, or release
- All operations are local filesystem (pnpm build, electron-builder, zip, sha256sum)
