# AM6 — Windows local package refresh after stale dist/release cleanup workflow

**Date:** 2026-06-07
**Phase:** AM6
**Dependency:** t_4a1f41b5 (AM4 QA acceptance — PASS), t_abf62bef (AM5 privacy/security audit — APPROVE)
**Worker:** sna-windows-runtime

## Artifact

| Field | Value |
|---|---|
| **Package name** | `servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip` |
| **Local WSL path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip` |
| **SHA256** | `3d05e428685acbbb64fb963e7029b5522af5c357b42ebc23a8e85936b81114e6` |
| **Size** | 118,604,799 bytes |
| **Modified (CST)** | 06:50 |
| **Newest artifact?** | Yes (supersedes al 06:20, ak 05:48, aj7 05:16) |

## Checksum verification

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip: OK
```

## Gates

| Gate | Status |
|---|---|
| `pnpm build` | ✅ passed |
| `pnpm typecheck` | ✅ passed |
| `pnpm test` | ✅ 440/440 passed |
| `pnpm privacy:scan` | ✅ 288 files scanned, all clean |

## Freshness ordering

From `dist/release/`, after archive-demotion of stale packages to `dist/.release-archive/`:

1. **`am-20260607-local.zip`** — 118,604,799 bytes — **current package** (06:50 CST)

All older phase packages (al, ak, aj7, aj, ai6, ah, ag, af) have been archived to `dist/.release-archive/<phase>/`. The canonical `v0.1.0-rc.1.zip` is also archived.

AM6 is the newest and only local build in `dist/release/`. Package size increased ~1,185 bytes vs AL6 (118,603,614 → 118,604,799), consistent with fresh build including AM3 stale-artifact cleanup implementation.

## Archive listing verified

- `resources/app.asar` — present
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` — present
- `resources/scripts/local-cdp-bridge.py` — present
- No forbidden directories (`.git`, `.auth`, `logs`, `screenshots`, etc.)
- No forbidden files (`.har`, `.trace`, `.png`, `.cookies`, etc.)

## Safety

- START-HERE wording checked — red-zone safe (no ServiceNow URLs, ticket IDs, sys_ids, etc.)
- No live ServiceNow login, API write, Save/Submit/Update/Resolve/Close, screenshots, HAR, cookies, or sessions touched
- Archive listing verified: contains app.asar, CDP helper PS1, local CDP bridge

## Changes included since AL6

- **AM1** — Stale dist/release cleanup workflow scope definition
- **AM2** — UX spec for stale-artifact cleanup UI (disabled archive button, preview-only behavior)
- **AM3** — Implementation: rename-based archive demotion (no deletion), stale ZIP detection by mtime
- **AM4** — QA acceptance: all 10 acceptance criteria verified (PASS)
- **AM5** — Privacy/security audit: VERDICT APPROVE, no blocking issues across 12 audited files
- All changes audited by AM5 and accepted by AM4
- Package derives from commit `019c502` (AG1-DelC: Verify .gitignore remediation complete — same baseline as AL6)
