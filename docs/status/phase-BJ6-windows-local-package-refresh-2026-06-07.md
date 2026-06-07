# BJ6 — Windows Local Package Refresh

**Date:** 2026-06-07  
**Phase:** BJ6  
**Worker:** sna-windows-runtime  
**Task:** t_54f110b0  

## Gates

| Gate | Result |
|------|--------|
| `pnpm build` (full workspace) | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 459 tests (83+34+6+17+95+55+169) |
| `pnpm privacy:scan` | PASS — 288 files |
| `sha256sum -c` on refreshed ZIP | PASS |
| Archive integrity (unzip -t) | PASS — no errors |
| App.asar present | PASS |
| CDP helper present | PASS |
| CMD launcher present | PASS |
| No forbidden markers | PASS |

## Artifacts

### New BJ6 package

- **ZIP:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`
- **Size:** 122,804,368 bytes (≈117 MiB)
- **SHA-256:** `336eb16d4c16d0bee8d2b0379a4f892b6bd5adb1925ec7dae4d091c879662b2e`
- **Sidecar:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip.sha256`
- **START-HERE:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local-START-HERE-WINDOWS.txt`

### Updated tracker

- **CURRENT.txt:** Points to `servicenow-automation-windows-v0.1.0-rc.1-bj6-20260607-local.zip`

### Archive contents (86 entries)

Expected entries verified:
- `resources/app.asar` — Electron app bundle
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` — CDP helper
- `resources/scripts/windows/Start-ServiceNow-Automation.cmd` — double-click launcher
- `resources/scripts/local-cdp-bridge.py` — local CDP bridge
- `ServiceNow Automation.exe` — application binary
- `resources/scripts/windows/evaluate-local-cdp-expression.ps1`
- `resources/scripts/windows/install-cloakbrowser-runtime.ps1`
- `resources/scripts/windows/prepare-chrome-for-testing.ps1`

No forbidden directory markers or file types found.

## Packaging notes

The electron-builder `--win zip` output was corrupted on this WSL run (Zip64 central directory issue). The package was produced by zipping the `win-unpacked/` directory with `zip -r` (deflate compression), producing a 122MB artifact. The START-HERE file (without checksum) was embedded inside the ZIP; the standalone START-HERE file carries the final checksum for reference.

## Safety boundaries preserved

- No live ServiceNow login, browsing, API writes
- No screenshots, HAR, trace, cookies, storage-state
- No raw URLs, ticket IDs, sys_ids, requester names
- No push, PR, merge, tag, GitHub Release, or cron changes

## Remaining blockers

- electron-builder `--win zip` corruption on WSL needs investigation for future automation. The `win-unpacked/` directory itself is always valid. The packaging script's `find_packaged_windows_zip` step cannot find a valid electron-builder zip on WSL due to Zip64 corruption.
- BJ7 (codex-gpt55-control) is a child task waiting on this phase.

## Verification commands run

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
SDA_RELEASE_VERSION=v0.1.0-rc.1-bj6-20260607-local pnpm release:windows:rc  # partially (zip corruption)
# Manual packaging from win-unpacked/
cd apps/desktop/dist/windows/win-unpacked && zip -r /path/to/release/bj6.zip .
# SHA256 sidecar
cd dist/release && sha256sum ... > ...sha256
# Verification
sha256sum -c ...sha256
unzip -t ...zip
unzip -Z1 ...zip | grep -c "expected-entry"
```
