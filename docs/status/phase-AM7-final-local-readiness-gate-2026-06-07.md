UNC path Alan should test: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip`

# Phase AM7 — Final Local Readiness Gate for Stale `dist/release/` Cleanup Workflow

**Date:** 2026-06-07 07:00:52 CST (+0800)
**Profile:** codex-gpt55-control
**Kanban task:** t_09d39a23
**HEAD:** `019c502e9b4ada63e2a0884f3783aae1a8a9ee04` (dirty worktree; local-only phase artifacts/changes remain open)
**Scope:** Final local readiness gate only. No live ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web write, real Teams/Outlook/phone ingestion, screenshots, HAR/trace capture, storage-state/cookie export, push, PR, merge, tag, GitHub Release, publish, or cron action was performed or authorized.
**Final recommendation:** **READY-FOR-MANUAL-VALIDATION-ONLY** — the refreshed AM local Windows package is present, checksum verification returns `OK`, it is the newest dated local zip artifact under `dist/`, all required local gates pass, archive integrity checks pass, and the cleanup dry-run reports no stale `dist/release/` artifacts.

---

## Local-only boundary

This gate stayed inside the local WSL worktree and local package artifacts. It did not perform or authorize any red-zone action.

All evidence below is sanitized: no real ServiceNow raw URLs, ticket IDs, sys_ids, requester names, assignment groups, screenshots, cookies, storage state, traces, HAR, or real field values are included.

---

## Required gates

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | Exit 0 in 2 seconds. Desktop build produced main bundle 306.00 kB / 30 modules, preload 1.63 kB / 1 module, renderer CSS 145.99 kB + JS 1,099.35 kB / 56 modules; CLI build also completed. |
| `pnpm typecheck` | PASS | Exit 0 in 7 seconds. All 7 workspace packages typechecked clean: core, ai, kb, profiles, adapters, cli, desktop. |
| `pnpm test` | PASS | Exit 0 in 6 seconds. 440 total tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, desktop 150. |
| `pnpm privacy:scan` | PASS | Exit 0. `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| `sha256sum -c` / checksum verification | PASS | From `dist/release/`, `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip.sha256` returned `servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip: OK`; live SHA256 is `3d05e428685acbbb64fb963e7029b5522af5c357b42ebc23a8e85936b81114e6`. |
| Archive integrity | PASS | Python `zipfile.testzip()` returned `None`; archive has 86 entries; exactly one each of `ServiceNow Automation.exe`, `resources/app.asar`, `resources/scripts/local-cdp-bridge.py`, `resources/scripts/windows/start-dedicated-chromium-cdp.ps1`, and `servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt`; zero forbidden marker matches for `.env`, cookie, storage-state, HAR, or trace strings. |
| Hygiene scan / cleanup dry-run | PASS | `bash scripts/hygiene/cleanup-stale-artifacts.sh --dry-run` reported `No stale artifacts found. Nothing to archive.` Live scan found `dist/release/` contains the AM zip, checksum, and START-HERE safety copy only; archive evidence exists under `dist/.release-archive/`. |

---

## Current package, checksum, and safety copy

| Property | Verified value |
|---|---|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip` |
| Exact Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip` |
| Local WSL path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip` |
| SHA256 | `3d05e428685acbbb64fb963e7029b5522af5c357b42ebc23a8e85936b81114e6` |
| Package size | 118,604,799 bytes |
| Package mtime | 2026-06-07 06:50:12 CST (+0800), epoch `1780786212` |
| Checksum file | `servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip.sha256`, 130 bytes, epoch `1780786283` |
| Safety copy | `servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local-START-HERE-WINDOWS.txt`, 1,284 bytes, epoch `1780786283` |

The external START-HERE safety copy remains a local-only manual validation aid and repeats the critical restriction: no automatic login; no Save / Submit / Update / Resolve / Close; no upload, email, bulk action, API write, production/prod-shadow write, screenshots, HAR, trace, cookies, sessions, storage-state export, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values.

---

## Freshness and post-cleanup hygiene state

| Check | Result | Sanitized evidence |
|---|---:|---|
| Newest dated local zip artifact under `dist/` | PASS | Live scan found 11 zip files under `dist/`; AM has the newest mtime (`1780786212`). The next newest zip is the archived canonical prerelease zip at epoch `1780786209`, followed by AL (`1780784422`) and older phase archives. |
| `dist/release/` current zip set | PASS | Contains exactly one zip: `servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip`. |
| Stale release artifacts | PASS | Cleanup dry-run reported no stale artifacts in `dist/release/` and performed no file moves. |
| Archive demotion evidence | PASS | `dist/.release-archive/` exists with 9 archived sets: `af`, `ag`, `ah`, `ai6`, `aj`, `aj7`, `ak`, `al`, `unknown`; 9 archived zip files / 28 archived files total. |
| Historical issue98 package | INFO | A separate older historical package remains under `dist/release-issue98-main-20260528/`; it is outside the `dist/release/` cleanup target and is older than AM. |

AM6 records the same expected package state: after archive demotion of stale packages to `dist/.release-archive/`, AM is the newest and only local build in `dist/release/`; older phase packages and the canonical prerelease zip are archived.

---

## Cleanup-workflow readiness checks

| Check | Result | Sanitized evidence |
|---|---:|---|
| UI surface keeps local-only boundary visible | PASS | `apps/desktop/src/App.tsx:4281-4282` renders `Local only · No ServiceNow actions · No upload / PR / merge / tag / release` and `Local Repo Hygiene + Archive Demotion`. |
| Disabled cleanup buttons explain intent | PASS | `apps/desktop/src/App.tsx:4459-4467` provides tooltips for verified items, closed-as-N/A items, zero stale-candidate state, loading state, and preview intent. |
| Cleanup preview is explicitly read-only | PASS | `apps/desktop/src/App.tsx:4498` renders `cleanup preview only, no files moved`. |
| Confirm dialog is safety-scoped | PASS | `apps/desktop/src/App.tsx:4528-4534` renders `Archive demotion?`, `Archive demotion preserves files for recovery`, and `Local files only. No publish, no tag, no push, no upload.` |
| IPC preview is read-only | PASS | `apps/desktop/electron/worktree-ipc.ts:307-309` documents cleanup preview as dry-run/no file modification. |
| IPC execute is rename-only | PASS | `apps/desktop/electron/worktree-ipc.ts:390` documents moving stale files to `dist/.release-archive/<phase>/`; `worktree-ipc.ts:429` uses `renameSync`. |
| Canonical zip exclusion remains present | PASS | `apps/desktop/electron/worktree-ipc.ts:294` defines `CANONICAL_ZIP_NAME = "v0.1.0-rc.1.zip"`; `worktree-ipc.ts:340` excludes it from stale files when present. |
| UI tests cover archive workflow copy | PASS | `apps/desktop/src/App.test.ts:1696-1718` covers archive stale-artifacts UI, cleanup preview text, and hidden-by-default confirm dialog. |

---

## References to previous gates

| Reference | Why it matters for AM7 |
|---|---|
| `docs/status/phase-AL7-final-local-readiness-gate-2026-06-07.md` | Previous AL final gate pattern and baseline: all gates passed and AL was the newest local package at that checkpoint. AM7 supersedes AL7 with the AM package and cleanup-workflow post-cleanup state. |
| `docs/status/phase-AM4-qa-acceptance-manual-checklist-2026-06-07.md` | QA accepted the stale `dist/release/` cleanup workflow through local-only code/test inspection. |
| `docs/status/phase-AM5-privacy-security-audit-2026-06-07.md` | Privacy/security approved the cleanup workflow as local-only, rename-based, no deletion, and no ServiceNow writes. |
| `docs/status/phase-AM6-windows-local-package-refresh-2026-06-07.md` | AM6 produced the refreshed AM Windows package, checksum, START-HERE safety copy, and post-archive-demotion package state that AM7 validates here. |

---

## Hermes/profile readiness checks

| Check | Result | Sanitized evidence |
|---|---:|---|
| `hermes profile show codex-gpt55-control` | PASS | Profile path is `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; model `gpt-5.5 (openai-codex)`; Gateway running; Skills 74; `SOUL.md` exists. |
| `hermes tools list` | PASS | CLI listed built-in toolsets successfully. Core local validation toolsets used here were available: web, browser, terminal, file, code_execution, vision, skills, todo, memory, session_search, clarify. |
| `hermes gateway status` | PASS | Gateway is running in WSL manual/foreground mode and lists the relevant SNA profiles, including `codex-gpt55-control` and SNA specialist profiles. |

---

## Commands run

```bash
hermes profile show codex-gpt55-control
hermes tools list
hermes gateway status
python3 - <<'PY'  # local artifact listing/freshness scan under dist/
PY
sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip.sha256
sha256sum servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip
stat -c '%n|%s|%Y|%y' servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip.sha256 servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local-START-HERE-WINDOWS.txt
python3 - <<'PY'  # archive integrity: expected entries and forbidden marker counts
PY
bash scripts/hygiene/cleanup-stale-artifacts.sh --dry-run
wslpath -w /home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
date '+%Y-%m-%d %H:%M:%S %Z (%z)'
git rev-parse HEAD
git status --short
```

---

## Final recommendation

**READY-FOR-MANUAL-VALIDATION-ONLY.**

Alan can manually validate the current AM local Windows package at:

`\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-am-20260607-local.zip`

This is not release approval. This gate does not authorize release, push, PR, merge, tag, GitHub Release, publish, live ServiceNow login, browser action against real ServiceNow, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion.
