# Phase BI6 — BI6 Windows Local Package Refresh

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD:** uncommitted (BI3 label/path clarity changes + accumulation)
**Profile:** `sna-windows-runtime`
**Task:** `t_963c905c`

---

## Gate results

| Gate | Result | Details |
|------|--------|---------|
| pnpm build | ✅ PASS | electron-vite: main, preload, renderer — all bundles built |
| pnpm typecheck | ✅ PASS | 7 workspace projects, no errors |
| pnpm test | ✅ PASS | 459/459 — 83+34+6+17+95+55+169 |
| pnpm privacy:scan | ✅ PASS | 288 files, no leaks |
| sha256sum -c | ✅ PASS | Checksum verified |

## Artifact

| Property | Value |
|----------|-------|
| Package | `servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip` |
| Size | 118,607,822 bytes (113M) |
| SHA-256 | `b794dee068bf79c7310820d2a60e61fe504003489e5c7410bcdd12b8734cbc21` |
| START-HERE | Present — correct bi6 package name, UNC path, and SHA-256 |
| CURRENT.txt | Updated to point to bi6 |
| Location | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\` |

## Files changed

| File | Action |
|------|--------|
| `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip` | NEW — packaged Windows artifact |
| `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local.zip.sha256` | NEW — checksum sidecar |
| `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bi6-20260607-local-START-HERE-WINDOWS.txt` | NEW — companion start-here file |
| `dist/release/CURRENT.txt` | UPDATED — bh6 → bi6 |
| `docs/status/phase-BI6-windows-local-package-refresh-2026-06-07.md` | NEW — this deliverable |

## Safety

- No live ServiceNow interaction (read, write, login, browser, API)
- No secrets, cookies, sessions, storage-state, HAR, trace, or screenshots
- No push, PR, merge, tag, GitHub Release, publish, or cron changes
- No raw ServiceNow URLs, ticket IDs, sys_ids, requester names, assignment groups, or real field values in any artifact
