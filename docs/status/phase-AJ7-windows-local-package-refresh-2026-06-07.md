# AJ7 — Windows local package refresh after stale AI6 copy fix

**Date:** 2026-06-07
**Phase:** AJ7
**Dependency:** t_24dd5277 (stale AI6 copy fixed at App.tsx:4346 → "current local Windows package path above")
**Worker:** sna-windows-runtime

## Artifact

| Field | Value |
|---|---|
| **Package name** | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| **Local WSL path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| **SHA256** | `ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe` |
| **Size** | 118,601,041 bytes |
| **Modified (CST)** | 05:16 |
| **Newest artifact?** | Yes (newer than aj 05:09, ai6 04:38) |

## Checksum verification

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip: OK
```

## Gates

| Gate | Status |
|---|---|
| `pnpm build` | ✅ passed |
| `pnpm typecheck` | ✅ passed |
| `pnpm test` | ✅ 147/147 passed |
| `pnpm privacy:scan` | ✅ 288 files scanned, all clean |

## Safety

- START-HERE wording checked — red-zone safe (no ServiceNow URLs, ticket IDs, sys_ids, etc.)
- No live ServiceNow login, API write, Save/Submit/Update/Resolve/Close, screenshots, HAR, cookies, or sessions touched
- Archive listing verified: contains app.asar, CDP helper PS1, local CDP bridge

## Changes included

- **App.tsx:4346** — stale "AI6 zip path" copy replaced with generic "current local Windows package path above" (from parent task t_24dd5277)
- **App.test.ts:1756** — matching test assertion updated
- Zero AI6 references remain in `apps/desktop/src/`

## Archive listing verified

- `resources/app.asar` — present
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` — present
- `resources/scripts/local-cdp-bridge.py` — present
- No forbidden directories (`.git`, `.auth`, `logs`, `screenshots`, etc.)
- No forbidden files (`.har`, `.trace`, `.png`, `.cookies`, etc.)
