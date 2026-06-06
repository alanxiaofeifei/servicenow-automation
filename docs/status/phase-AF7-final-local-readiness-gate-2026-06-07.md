Alan should test this file: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip

# Phase AF7 — Final Local Readiness Gate for Windows Operator Packaging/Runtime Readiness

**Date:** 2026-06-07
**Profile:** codex-gpt55-control
**Task:** t_62bac5e5
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Source checkpoint before AF local commit:** `2469c04`

---

## Final recommendation

**READY FOR ALAN MANUAL VALIDATION ONLY.** Alan should open the dated local Windows zip named on the first line. This is not a release, upload, GitHub Release, ServiceNow approval, or permission to perform any live write action.

---

## Package Alan should test

- **Windows UNC path:** `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip`
- **Local WSL path:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip`
- **SHA256:** `14ce20d64d89b796defb222389f5119e88cc56cd32567d41320eb1d32f7c2e79`
- **Checksum file:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip.sha256` contains the same hash.
- **mtime:** `2026-06-07 02:39:27.898514218 CST +0800`.
- **Size:** `118,592,457` bytes.
- **Freshness:** newest Windows zip in `dist/release/`; it is newer than the undated `rc.1.zip` alias and the dated `ae`, `ad`, and `ab` local packages. Use the dated `af-20260607-local.zip` path to avoid stale artifact ambiguity.

---

## Required gates rerun for AF7

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | recursive workspace build completed; electron-vite emitted main, preload, and renderer bundles. |
| `pnpm typecheck` | PASS | all 7 workspace packages typecheck clean. |
| `pnpm test` | PASS | 7 workspace projects passed; 412/412 tests passed, including `apps/desktop` 122/122 and `electron/chromium-provisioner.test.ts` 9/9. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=273` before staging; `TRACKED_PRIVACY_SCAN_PASS files=287` after staging AF implementation/tests/status docs for local commit. |

No gateway failure occurred during the required gate sequence.

---

## Safety and archive hygiene

- Package remains local-only under `dist/release/`; no upload or external publication occurred.
- Required archive entries verified: `ServiceNow Automation.exe`, `resources/app.asar`, `resources/scripts/windows/start-dedicated-chromium-cdp.ps1`, `resources/scripts/local-cdp-bridge.py`, and `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt`.
- START-HERE safety wording remains intact and includes: `No Save / Submit / Update / Resolve / Close automation.`
- START-HERE also forbids automatic login, upload/email/bulk action, ServiceNow API write, screenshots/HAR/trace/video from real ServiceNow pages, cookies/sessions/storage-state export, raw QA URLs/ticket IDs/sys_ids/requester names/assignment groups/browser endpoints/page fingerprints/real field values, and real ServiceNow login or field interaction without a separate checkpoint.
- Archive path scan found 0 forbidden hits for `.git`, `.auth`, `coverage`, screenshots, HAR/trace, cookies, or storage-state patterns.
- This AF7 pass performed no real ServiceNow login, browse, API write, Save, Submit, Update, Resolve, Close, upload, Microsoft Graph or Excel Web write, Teams/Outlook/phone ingestion, screenshot, HAR, trace, cookie export, storage-state export, push, PR, merge, tag, GitHub Release, cron edit, release, or publish action.

---

## Worktree state

AF implementation/test/status-doc changes are staged for a local commit in this handoff. Final verification after that local commit must show `git status --short` clean; no push, PR, merge, tag, GitHub Release, upload, or release/publish action is part of this gate.

---

## Hermes profile/tool/gateway checks

| Check | Result |
|---|---|
| `hermes profile show codex-gpt55-control` | PASS — profile exists, model `gpt-5.5 (openai-codex)`, gateway running, 74 skills, `.env` not configured. |
| `hermes tools list` | PASS — CLI tool status listed; core local toolsets available (`terminal`, `file`, `code_execution`, `skills`, `todo`, `session_search`, etc.). |
| `hermes gateway status` | PASS — gateway running manually in WSL; no gateway failure reported. |

---

## Next local-only step

Alan should manually validate only the dated local Windows zip on a Windows machine. Use mock/demo workflows first, use about:blank for dedicated browser smoke, and stop before any real ServiceNow login or field interaction unless a separate checkpoint explicitly approves it.
