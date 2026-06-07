# AN6 — Windows local package refresh after three-column polish

**Date:** 2026-06-07
**Phase:** AN6
**Dependency:** t_5945b34c (AN5 privacy/security audit), t_b60b5062 (AN4 QA acceptance)
**Worker:** sna-windows-runtime

## Artifact

| Field | Value |
|---|---|
| **Package name** | `servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` |
| **Local WSL path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` |
| **SHA256** | `f96370027b41a0a86c6bb9b276619d63e5cdf0e26ec93bbd43aca85630276bdf` |
| **Size** | 118,605,315 bytes |
| **Modified (CST)** | 07:24 |
| **Newest artifact?** | Yes (only artifact in dist/release/) |

## Checksum verification

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip: OK
```

## Gates

| Gate | Status |
|---|---|
| `pnpm build` | ✅ passed |
| `pnpm typecheck` | ✅ passed |
| `pnpm test` | ✅ 440/440 passed |
| `pnpm privacy:scan` | ✅ 288 files scanned, all clean |

## Freshness ordering

From `dist/release/`, sorted by mtime (epoch → filename → size):

1. `1780788270` — `an6-20260607-local.zip` — 118,605,315 bytes — **current package** (07:24 CST)

AN6 is the only active build. AM6 was archived to `.release-archive/am/`.

## Archive listing verified

- `resources/app.asar` — present
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` — present
- `resources/scripts/local-cdp-bridge.py` — present
- No forbidden directories (`.git`, `.auth`, `logs`, `screenshots`, etc.)
- No forbidden files (`.har`, `.trace`, `.png`, `.cookies`, etc.)

## Safety

- START-HERE wording checked — red-zone safe (no ServiceNow URLs, ticket IDs, sys_ids, etc.)
- No live ServiceNow login, API write, Save/Submit/Update/Resolve/Close, screenshots, HAR, cookies, or sessions touched
- Archive listing verified by build script: contains app.asar, CDP helper PS1, local CDP bridge

## Changes included since AM6

- AN3 three-column operator workbench polish (merged)
  - SOURCES/WORK PRODUCT/RUNTIME column headers
  - Border-right/border-left CSS separation for column structure
  - Warm/cool background tint distinction
  - 11 copy-string changes across 4 languages (en-US, zh-CN, zh-TW, es-ES)
  - Focus-visible keyboard navigation
  - Clear disabled reasons for unavailable runtime actions
  - Autofill separated from Save — no write-path semantics
- All AN3 changes audited by AN5 (privacy/security — APPROVE, no blocking issues) and accepted by AN4 (QA acceptance — PASS)
- Package size 118,605,315 bytes — consistent with previous AN6 build at same HEAD
