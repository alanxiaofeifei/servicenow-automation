# AK6 — Windows local package refresh after validation-history polish

**Date:** 2026-06-07
**Phase:** AK6
**Dependency:** t_51484ccd (AK4 QA acceptance), t_cb3365d0 (AK5 privacy/security audit)
**Worker:** sna-windows-runtime

## Artifact

| Field | Value |
|---|---|
| **Package name** | `servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip` |
| **Local WSL path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip` |
| **SHA256** | `3b8b17b2b33bed6b39a8561efa27f56305845880d10a0b236d62d79ac06ca89a` |
| **Size** | 118,600,899 bytes |
| **Modified (CST)** | 05:48 |
| **Newest artifact?** | Yes (newer than aj7 05:16, aj 05:09, ai6 04:38) |

## Checksum verification

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1-ak-20260607-local.zip: OK
```

## Gates

| Gate | Status |
|---|---|
| `pnpm build` | ✅ passed |
| `pnpm typecheck` | ✅ passed |
| `pnpm test` | ✅ 438/438 passed |
| `pnpm privacy:scan` | ✅ 288 files scanned, all clean |

## Freshness ordering

From `dist/release/`, sorted by mtime (epoch → filename → size):

1. `1780782507` — `ak-20260607-local.zip` — 118,600,899 bytes — **current package** (05:48 CST)
2. `1780780594` — `aj7-20260607-local.zip` — 118,601,041 bytes — older/stale (05:16 CST)
3. `1780780145` — `aj-20260607-local.zip` — 118,600,788 bytes — older/stale (05:09 CST)
4. `1780778322` — `ai6-20260607-local.zip` — 118,600,763 bytes — older/stale (04:38 CST)
5. `1780775978` — `ah-20260607-local.zip` — 118,599,245 bytes — older/stale (03:59 CST)
6. `1780775971` — `v0.1.0-rc.1.zip` — 118,598,268 bytes — older/stale (03:59 CST)
7. `1780774566` — `ag-20260607-local.zip` — 118,596,760 bytes — older/stale (03:36 CST)
8. `1780771167` — `af-20260607-local.zip` — 118,592,457 bytes — older/stale (02:39 CST)

AK6 is the newest dated local build, superseding AJ7. All older AJ/AI/AG/AH/AF packages are archival only.

## Safety

- START-HERE wording checked — red-zone safe (no ServiceNow URLs, ticket IDs, sys_ids, etc.)
- No live ServiceNow login, API write, Save/Submit/Update/Resolve/Close, screenshots, HAR, cookies, or sessions touched
- Archive listing verified by build script: contains app.asar, CDP helper PS1, local CDP bridge
- No forbidden directories (`.git`, `.auth`, `logs`, `screenshots`, etc.)
- No forbidden files (`.har`, `.trace`, `.png`, `.cookies`, etc.)

## Changes included since AJ7

- AK5 privacy/security audit changes (4 IPC handlers, privacy improvements)
- No hardcoded sensitive test assertions remain (UNC path literal, SHA256 hash removed)
- Validation-history states now correctly reflect: Pending/Accepted × no runs/exists
