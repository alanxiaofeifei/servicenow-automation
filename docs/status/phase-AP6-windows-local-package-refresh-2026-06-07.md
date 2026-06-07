# AP6 — Windows local package refresh after AP4 + AP5 acceptance

**Date:** 2026-06-07
**Phase:** AP6
**Dependency:** t_5e27ba49 (AP5 privacy/security audit — APPROVE), t_728adb98 (AP4 QA acceptance — PASS)
**Worker:** sna-windows-runtime

## Artifact

| Field | Value |
|---|---|
| **Package name** | `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` |
| **Local WSL path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` |
| **SHA256** | `75178630c1b5ce5c1e8fc3e7687a88c48d1409f3b3267f9179ce1245b2a9f590` |
| **Size** | 118,601,823 bytes |
| **Modified (CST)** | 08:28 |
| **Newest AP artifact?** | Yes |

## Checksum verification

```
$ sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip.sha256
servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip: OK
```

## Gates

| Gate | Status |
|---|---|
| `pnpm build` | ✅ passed |
| `pnpm typecheck` | ✅ passed (7 workspaces) |
| `pnpm test` | ✅ 440/440 passed (core 83, kb 6, profiles 17, ai 34, adapters 95, cli 55, desktop 150) |
| `pnpm privacy:scan` | ✅ 288 files scanned, all clean |
| `sha256sum -c` | ✅ verified |
| Archive integrity | ✅ 86 entries, `resources/app.asar` present, CDP helpers present, 0 forbidden markers |

## Freshness ordering

From `dist/release/`, after archive-demotion of stale packages to `dist/.release-archive/`:

1. **`ap6-20260607-local.zip`** — 114 MB — **current package** (08:28 CST)
2. **`ao6-20260607-local.zip`** — 118 MB — previous build (07:46 CST)

The previous AP6 package (built at 08:24 at commit 019c502, SHA256 `95c43efa04bf...`, 118 MB) contained only the AG1-DelC commit state without the AP3 three-column polish. The refreshed package includes the AP3 working-tree changes (repo-hygiene three-column action-rail grid), which accounts for the smaller 114 MB size (AP3 removed some dead code/stale references).

## Archive listing verified

- `resources/app.asar` — present
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` — present
- `resources/scripts/local-cdp-bridge.py` — present
- No forbidden directories (`.git`, `.local`, `.codegraph`, `.auth`, etc.)
- No forbidden files (`.har`, `.trace`, `.png`, `.cookies`, `.session`, etc.)
- 86 total entries in archive

## Hygiene

- `dist/release/` contains AO6 + AP6 fresh packages (both current)
- Previous AP6 package at commit 019c502 safely archived to `dist/.release-archive/ap6/`
- Archive-retained packages in `.release-archive/`: af, ag, ah, ai6, aj, aj7, ak, al, am, an6, ap6, unknown

## Changes included since previous AP6 (commit 019c502)

- **AP3** — Repo-hygiene three-column action-rail polish
  - Restructured repo-hygiene card from single vertical to 3-column grid in `App.tsx`
  - Updated column ratio and responsive fallback in `styles.css`
  - Added worktree-ipc.ts for archive hygiene scanning
- All AP3 changes audited by AP5 (privacy/security — APPROVE, no blocking issues) and accepted by AP4 (QA acceptance — PASS)
- Package size 114 MB — smaller than previous 118 MB due to AP3 refactoring

## Safety

- START-HERE wording checked — red-zone safe (no ServiceNow URLs, ticket IDs, sys_ids, etc.)
- No live ServiceNow login, API write, Save/Submit/Update/Resolve/Close, screenshots, HAR, cookies, or sessions touched
- Archive listing verified by build script: contains app.asar, CDP helper PS1, local CDP bridge
- All build/archive operations local-only; no GitHub push/PR/merge/tag/release
