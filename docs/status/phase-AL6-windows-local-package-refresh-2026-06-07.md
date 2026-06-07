# AL6 — Windows local package refresh after repo hygiene polish

**Date:** 2026-06-07
**Phase:** AL6
**Dependency:** t_54adafe5 (AL5 privacy/security audit), t_89f4422e (AL4 QA acceptance)
**Worker:** sna-windows-runtime

## Artifact

| Field | Value |
|---|---|
| **Package name** | `servicenow-automation-windows-v0.1.0-rc.1-al-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-al-20260607-local.zip` |
| **Local WSL path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-al-20260607-local.zip` |
| **SHA256** | `6005072428f2695bb6788cdddc0d2c94d4492844e08953a00487b8168f58d6db` |
| **Size** | 118,603,614 bytes |
| **Modified (CST)** | 06:20 |
| **Newest artifact?** | Yes (newer than ak 05:48, aj7 05:16, aj 05:09) |

## Checksum verification

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-al-20260607-local.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1-al-20260607-local.zip: OK
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

1. `1780784422` — `al-20260607-local.zip` — 118,603,614 bytes — **current package** (06:20 CST)
2. `1780784415` — `v0.1.0-rc.1.zip` — 118,602,637 bytes — base artifact (06:20 CST)
3. `1780782507` — `ak-20260607-local.zip` — 118,600,899 bytes — older/stale (05:48 CST)
4. `1780780594` — `aj7-20260607-local.zip` — 118,601,041 bytes — older/stale (05:16 CST)
5. `1780780145` — `aj-20260607-local.zip` — 118,600,788 bytes — older/stale (05:09 CST)
6. `1780778322` — `ai6-20260607-local.zip` — 118,600,763 bytes — older/stale (04:38 CST)
7. `1780775978` — `ah-20260607-local.zip` — 118,599,245 bytes — older/stale (03:59 CST)
8. `1780774566` — `ag-20260607-local.zip` — 118,596,760 bytes — older/stale (03:36 CST)
9. `1780771167` — `af-20260607-local.zip` — 118,592,457 bytes — older/stale (02:39 CST)

AL6 is the newest dated local build, superseding AK6. All older AK/AJ/AI/AG/AH/AF packages are archival only.

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

## Changes included since AK6

- AL3 repo-hygiene / artifact-boundary implementation (commit `019c502` — AG1-DelC: Verify .gitignore remediation complete)
  - Worktree hygiene IPC handlers (scan, export, status, cleanup preview)
  - Dynamic stale-artifact detection with mtime-sorted freshness ordering
  - `.local/video-analysis/` existence check
  - Home-directory sanitization in git diff output
  - Boundary disclaimers in UI and exported markdown
- All AL3 changes audited by AL5 (privacy/security — APPROVE, no blocking issues) and accepted by AL4 (QA acceptance — PASS)
- Package size increased ~2,715 bytes vs AK6 (118,600,899 → 118,603,614), consistent with new resources/app.asar containing the AL3 code
