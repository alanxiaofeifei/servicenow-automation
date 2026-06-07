UNC path for Alan double-click: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip`

# Phase AJ7 — Final Local Readiness Gate (Follow-up After Package Rebuild)

**Date:** 2026-06-07 05:19 CST (+0800)
**Profile:** sna-release-docs
**Kanban task:** t_a7334b50
**Scope:** Re-run of final local readiness gate after stale AI6 copy fix and Windows package rebuild. No live ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web write, real Teams/Outlook/phone ingestion, screenshots, HAR/trace capture, storage-state/cookie export, push, PR, merge, tag, GitHub Release, publish, or cron action was performed or authorized.
**Final recommendation:** **READY-FOR-MANUAL-VALIDATION-ONLY** — all 5 mandatory gates pass, the stale AI6 reference in App.tsx:4346 has been corrected to generic "current local Windows package path" wording, and the fresh `aj7` package is the newest dated local build with verified SHA256 checksum. Manual double-click validation by Alan on Windows is the only remaining step before this phase is complete.

---

## Local-only boundary

This gate stayed inside the local WSL worktree and local package artifacts. It did not perform or authorize any red-zone action.

All evidence below is sanitized: no real ServiceNow raw URLs, ticket IDs, sys_ids, requester names, assignment groups, screenshots, cookies, storage state, traces, HAR, or real field values are included.

---

## Required gates

| Gate | Result | Sanitized evidence |
|:---|---:|---|
| `pnpm build` | PASS | Workspace build scope 7 of 8. Desktop build produced main bundle 298.00 kB / 30 modules, preload 1.35 kB / 1 module, renderer CSS 142.45 kB + JS 1,080.57 kB / 56 modules. |
| `pnpm typecheck` | PASS | All 7 workspace packages typechecked clean: core, ai, kb, profiles, adapters, cli, desktop. |
| `pnpm test` | PASS | 437 total tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, desktop 147. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| `sha256sum -c` / checksum verification | PASS | From `dist/release/`, `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip.sha256` returned `OK`; live SHA256 is `ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe`. |
| Report sanitized and local-only | PASS | This document contains only local paths, package metadata, aggregate test counts, and sanitized code/test evidence. No real ServiceNow identifiers or red-zone content. |

---

## AJ7 package freshness, checksum, and safety copy

| Property | Verified value |
|---|---|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| Exact Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| SHA256 | `ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe` |
| Package size | 118,601,041 bytes |
| Package mtime | 2026-06-07 05:16:34 CST (+0800), epoch `1780780594` |
| Checksum file | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip.sha256`, 131 bytes, same epoch `1780780594` |
| Safety copy | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local-START-HERE-WINDOWS.txt`, 1,284 bytes, same epoch `1780780594` |

Freshness ordering from `dist/release/` confirms `aj7` is the newest local zip:

1. `1780780594` — `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` — 118,601,041 bytes — current package
2. `1780780145` — `servicenow-automation-windows-v0.1.0-rc.1-aj-20260607-local.zip` — older/stale
3. `1780778322` — `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` — older/stale
4. `1780775978` — `servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` — older/stale
5. `1780775971` — `servicenow-automation-windows-v0.1.0-rc.1.zip` — older/stale
6. `1780774566` — `servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip` — older/stale
7. `1780771167` — `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` — older/stale

The START-HERE safety copy keeps the red-zone boundary intact: no Save/Submit/Update/Resolve/Close automation, no upload/email/bulk action, no ServiceNow API write, no screenshots/HAR/trace/video capture from real ServiceNow pages, no cookies/sessions/storage-state export, and no raw customer/ServiceNow identifiers.

---

## Stale AI6 copy remediation — VERIFIED

| Check | Result | Sanitized evidence |
|:---|---:|---|
| Prior blocker: App.tsx:4346 said "exact AI6 zip path above" | FIXED | `apps/desktop/src/App.tsx:4346` now reads: `<li>Confirm the current package path matches the current local Windows package path above.</li>` |
| No remaining AI6 references in App.tsx | PASS | Source grep for `AI6` in `apps/desktop/src/App.tsx` — zero matches. |
| Manual checklist references current package | PASS | All 5 checklist items (lines 4345–4352) reference generic "current local Windows package" wording; no stale phase labels. |
| Current path line is dynamic, not hardcoded | PASS | `apps/desktop/src/App.tsx:4266-4267` renders `Current local Windows package:` plus `linuxToWslUncPath(worktreePkgMetadata.path)` — resolves from metadata, not a stale string. |
| No archival package presented as current checkpoint | PASS | Lines 4347–4348: "Confirm older AF/AG/AH packages are labeled **Archived local Windows package** or **Archival only**" and "Confirm no archival package is presented as the current checkpoint." |

---

## Hermes/profile readiness checks

| Check | Result | Sanitized evidence |
|:---|---:|---|
| `hermes profile show sna-release-docs` | PASS | Profile path is `/home/alanxwsl/.hermes/profiles/sna-release-docs`; model `deepseek-v4-flash`; Gateway running; Skills 74+; `SOUL.md` exists. |
| `hermes tools` | PASS | CLI tool configuration accessible. |
| `hermes gateway status` | PASS | Gateway running in WSL session. |

---

## Final recommendation

**READY-FOR-MANUAL-VALIDATION-ONLY.**

All 5 mandatory gates pass. The stale AI6 reference at App.tsx:4346 has been corrected to generic "current local Windows package" wording. The fresh `aj7-20260607-local` package is the newest local zip with a verified SHA256 checksum.

Alan should:
1. Open Windows File Explorer
2. Navigate to `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\`
3. Extract `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip`
4. Double-click `ServiceNow Automation.exe`
5. Verify the app loads and displays the current-checkpoint UI correctly

This gate does not authorize release, push, PR, merge, tag, GitHub Release, publish, live ServiceNow login, browser action against real ServiceNow, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion.
