# AO6 — Windows local package refresh after next visible local product scope

**Date:** 2026-06-07
**Phase:** AO6
**Dependency:** t_15617b4c (AO4 QA acceptance — PASS), t_c934223c (AO5 privacy/security audit — APPROVE)
**Worker:** sna-windows-runtime

## Artifact

| Field | Value |
|---|---|
| **Package name** | `servicenow-automation-windows-v0.1.0-rc.1-ao6-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ao6-20260607-local.zip` |
| **Local WSL path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ao6-20260607-local.zip` |
| **SHA256** | `0b2981224f189740f283734897dca48eb954c9517b34a5b9509ac655a4983ef4` |
| **Size** | 118,605,047 bytes |
| **Modified (CST)** | 07:46 |
| **Newest artifact?** | Yes (only artifact in dist/release/) |

## Checksum verification

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ao6-20260607-local.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1-ao6-20260607-local.zip: OK
```

## Gates

| Gate | Status |
|---|---|
| `pnpm build` | ✅ passed |
| `pnpm typecheck` | ✅ passed (7 workspaces) |
| `pnpm test` | ✅ 205+ passed (150/150 desktop, 55/55 CLI, plus core/adapters/ai/kb) |
| `pnpm privacy:scan` | ✅ 288 files scanned, all clean |

## Freshness ordering

From `dist/release/`, after archive-demotion of stale packages to `dist/.release-archive/`:

1. **`ao6-20260607-local.zip`** — 118,605,047 bytes — **current package** (07:46 CST)

Previous AN6 package (`f9637002...`, 118,605,315 bytes, 07:24 CST) archived to `dist/.release-archive/an6/`.

AO6 is the newest and only local build in `dist/release/`. Package size 118,605,047 bytes — consistent with fresh build including AO3 changes.

## Archive listing verified

- `resources/app.asar` — present (10,276,238 bytes)
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` — present
- `resources/scripts/local-cdp-bridge.py` — present
- No forbidden directories (`.git`, `.auth`, `logs`, `screenshots`, etc.)
- No forbidden files (`.har`, `.trace`, `.png`, `.cookies`, etc.)
- 86 total entries in archive

## Hygiene

- `dist/release/` contains only the fresh AO6 package (no stale artifacts)
- Hygiene scan: no stale artifacts found, nothing to archive after AO6 build
- Old AN6 package safely archived to `dist/.release-archive/an6/`

## Safety

- START-HERE wording checked — red-zone safe (no ServiceNow URLs, ticket IDs, sys_ids, etc.)
- No live ServiceNow login, API write, Save/Submit/Update/Resolve/Close, screenshots, HAR, cookies, or sessions touched
- Archive listing verified by build script: contains app.asar, CDP helper PS1, local CDP bridge
- All build/archive operations local-only; no GitHub push/PR/merge/tag/release

## Changes included since AN6

- **AO3** — Next visible local product scope implementation
  - Package archive panel removed (no hardcoded stale entries)
  - Generic archival-only warning copy
  - Dynamic metadata block as source of truth for test history
  - Warm/light theme preserved
- All AO3 changes audited by AO5 (privacy/security — APPROVE, no blocking issues) and accepted by AO4 (QA acceptance — PASS)
- Package size 118,605,047 bytes — consistent with fresh build at same HEAD
