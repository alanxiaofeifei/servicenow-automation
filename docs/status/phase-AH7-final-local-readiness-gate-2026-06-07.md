Alan should test this file: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip

# Phase AH7 — Final Local Readiness Gate for Worktree Acceptance

**Date:** 2026-06-07  
**Profile:** codex-gpt55-control  
**Task:** t_daa63a5f  
**Branch:** `next/post-release-operator-cockpit-ab-20260606`  
**HEAD checked:** `019c502` with AG/AH worktree acceptance changes present.  
**Scope:** local-only package/readiness verification before Alan manual validation.

---

## Final recommendation

**READY FOR ALAN MANUAL VALIDATION ONLY.** Alan should open the dated local Windows zip named on the first line and validate the packaged worktree-acceptance checkpoint locally.

This is **not** a release, upload, publish, PR, merge, tag, GitHub Release, ServiceNow approval, or permission to perform any live ServiceNow/browser/API/write action. Worktree acceptance remains a human review decision; this gate only confirms the local package, checksum, freshness, safety copy, archive hygiene, required local gates, and local-only boundary.

---

## Package Alan should test

| Property | Value |
|---|---|
| Artifact | `servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` |
| Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` |
| Local WSL path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` |
| SHA256 | `6501e86dcf4854ece610f74c9a1273ab51bc635026aba6835aec05bfa6cfa2e0` |
| Checksum file | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip.sha256`; `sha256sum -c` from repo root returned `OK`. |
| Size | `118,599,245` bytes |
| mtime | `2026-06-07 03:59:38 CST` |
| Safety copy | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local-START-HERE-WINDOWS.txt` (`1,284` bytes) |
| Freshness | Newest dated local Windows package in `dist/release/`; newer than `ag` (`03:36:06 CST`) and `af` (`02:39:27 CST`). The undated `rc.1.zip` alias is also older (`03:59:31 CST`) than the dated AH package. |

Use the dated `ah-20260607-local.zip` path above to avoid stale artifact ambiguity.

---

## Required local gates rerun for AH7

All required gates were rerun locally in `/home/alanxwsl/projects/servicenow-automation`.

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | Recursive workspace build completed; `apps/cli` TypeScript and Electron main/preload/renderer production bundles emitted. |
| `pnpm typecheck` | PASS | All 7 workspace packages typecheck clean. |
| `pnpm test` | PASS | 414/414 tests passed across workspace packages; `apps/desktop` 124/124 passed. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288`. |

No required local gate failure occurred during the AH7 sequence.

---

## Package integrity and safety copy verification

| Check | Result |
|---|---:|
| Artifact exists | PASS |
| `.sha256` file exists | PASS |
| `sha256sum` matches recorded checksum | PASS |
| `sha256sum -c dist/release/...ah...zip.sha256` from repo root | PASS (`OK`) |
| Safety copy exists beside zip | PASS |
| Safety copy matches both START-HERE files embedded in the archive | PASS |
| Archive contains `ServiceNow Automation.exe` | PASS |
| Archive contains `resources/app.asar` | PASS |
| Archive contains `start-dedicated-chromium-cdp.ps1` | PASS |
| Archive contains `local-cdp-bridge.py` | PASS |
| Archive contains START-HERE safety file(s) | PASS |
| Archive forbidden path scan | PASS — 0 hits for `.git`, `.auth`, `coverage`, screenshots, HAR/trace, cookies, or storage-state patterns |

The zip contains 87 archive entries and two START-HERE entries; both START-HERE entries match the local safety copy.

---

## START-HERE safety wording verified

The local safety copy and embedded START-HERE content preserve the required red-zone boundaries, including:

- `No Save / Submit / Update / Resolve / Close automation.`
- `upload / email / bulk action`
- `ServiceNow API write`
- `production or production-shadow write`
- `screenshots / HAR / trace / video capture from real ServiceNow pages`
- `cookies / sessions / storage-state export`
- `raw QA URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values`
- `Stop before any real ServiceNow login or field interaction unless a separate checkpoint explicitly approves it.`

This wording does not weaken the project red-zone boundary.

---

## Worktree acceptance boundary

The worktree is intentionally not clean for this AH checkpoint. Current dirty state includes the AG repo-hygiene work, AH worktree-acceptance card work, status documents, and supporting local hygiene script state. That state is expected for this phase and is the reason Alan is being given a local-only manual validation checkpoint rather than a release/merge decision.

Important boundary for Alan:

1. The package is ready for **manual local validation only**.
2. The package reflects uncommitted worktree changes at HEAD `019c502` plus AG/AH local modifications.
3. Acceptance of the worktree is still a human decision; this gate does not accept, commit, push, merge, tag, release, or upload anything.
4. Manual validation should confirm the app opens, the worktree acceptance card is visible, the package path/checksum/freshness/safety copy are displayed as expected, and no forbidden ServiceNow/write action is exposed.

---

## Local-only actions confirmed

This AH7 pass performed only local repository, build/typecheck/test/privacy-scan, checksum/stat, archive-inspection, safety-copy comparison, Hermes profile/tool/gateway checks, and status-doc work.

It did **not** perform real ServiceNow login, live ServiceNow browsing, browser automation against ServiceNow, ServiceNow API write, Save, Submit, Update, Resolve, Close, attachment upload, Microsoft Graph or Excel Web write, Teams/Outlook/phone ingestion, screenshot, HAR, trace, cookie export, storage-state export, upload, publish, push, PR, merge, tag, GitHub Release, release creation, or cron creation/modification.

---

## Hermes profile/tool/gateway checks

| Check | Result |
|---|---|
| `hermes profile show codex-gpt55-control` | PASS — profile exists at `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; model `gpt-5.5 (openai-codex)`; gateway running; 74 skills; `.env` not configured. |
| `hermes tools list` | PASS — enabled local toolsets include `web`, `browser`, `terminal`, `file`, `code_execution`, `vision`, `skills`, `todo`, `memory`, `session_search`, and `clarify`; disabled external/toolsets remain disabled. |
| `hermes gateway status` | PASS — gateway running manually in WSL; profile gateway PIDs listed; no gateway status failure reported. |

---

## Manual validation checklist for Alan

1. Open the exact UNC zip path from the first line in Windows File Explorer.
2. Extract the zip to a local Windows folder.
3. Read `START-HERE-WINDOWS.txt` before launching.
4. Double-click `ServiceNow Automation.exe`.
5. Verify the app opens with the local workbench UI.
6. Verify the Worktree Acceptance Checkpoint card is visible and local-only.
7. Verify the displayed package path points to the AH dated zip, not stale AG/AF/alias artifacts.
8. Verify no real ServiceNow URL, ticket ID, sys_id, credential, session, requester, assignment group, screenshot, HAR, trace, or raw field value appears.
9. Verify no Save / Submit / Update / Resolve / Close action is available.
10. Use mock/demo workflows first; for dedicated browser smoke, use `about:blank` only.
11. Stop before any real ServiceNow login or field interaction unless a separate checkpoint explicitly approves it.
12. If startup fails, report only visible error text and local startup log path; do not paste real ServiceNow/customer data.

---

## Conclusion

**READY FOR ALAN MANUAL VALIDATION ONLY.** The AH dated Windows package path, checksum, freshness, safety copy, archive hygiene, local-only boundary, profile/tool/gateway checks, and all four mandatory local gates are verified. This does not authorize release, upload, push/PR/merge/tag/GitHub Release, real ServiceNow login/browsing/API writes, Microsoft Graph/Excel Web writes, attachment upload, Save/Submit/Update/Resolve/Close, or real data ingestion.
