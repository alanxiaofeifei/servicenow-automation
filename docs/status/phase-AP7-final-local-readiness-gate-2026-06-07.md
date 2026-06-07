# Phase AP7 — Final Local Readiness Gate

**Date:** 2026-06-07 08:31:56 CST (+0800)  
**Profile:** `codex-gpt55-control`  
**Kanban task:** `t_18f29da7`  
**HEAD:** `019c502e9b4ada63e2a0884f3783aae1a8a9ee04` (dirty local worktree; local-only phase artifacts/changes remain open)  
**Scope:** Final local readiness gate only. No live ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web write, real Teams/Outlook/phone ingestion, screenshots, HAR/trace capture, storage-state/cookie export, push, PR, merge, tag, GitHub Release, publish, or cron action was performed or authorized.  
**Final recommendation:** **READY-FOR-MANUAL-VALIDATION-ONLY** — the refreshed AP6 local Windows package is present, checksum verification returns `OK`, it is the newest dated local zip artifact under `dist/`, all required local gates pass, archive integrity checks pass, stale active-release artifacts were demoted locally and the post-cleanup hygiene dry-run is clean, and Hermes profile/tools/gateway readiness checks pass.

---

## Local-only boundary

This gate stayed inside the local WSL worktree and local package artifacts. The only local artifact mutation performed by AP7 was the hygiene script's archive-demotion of the stale AO6 active-release package set into `dist/.release-archive/ao6/` after a dry-run showed exactly what would move.

All evidence below is sanitized: no real ServiceNow raw URLs, ticket IDs, sys_ids, requester names, assignment groups, screenshots, cookies, storage state, traces, HAR, browser endpoints, page fingerprints, or real field values are included.

---

## Required gates

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | Exit 0. Desktop build produced main bundle 306.00 kB / 30 modules, preload 1.63 kB / 1 module, renderer CSS 148.20 kB + JS 1,071.46 kB / 56 modules; CLI build also completed. |
| `pnpm typecheck` | PASS | Exit 0. All 7 workspace packages typechecked clean: core, ai, kb, profiles, adapters, cli, desktop. |
| `pnpm test` | PASS | Exit 0. 440 total tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, desktop 150. Test warnings were sanitized/fail-closed runtime-selection paths only. |
| `pnpm privacy:scan` | PASS | Exit 0. `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| `sha256sum -c` / checksum verification | PASS | From `dist/release/`, `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip.sha256` returned `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip: OK`; live SHA256 is `75178630c1b5ce5c1e8fc3e7687a88c48d1409f3b3267f9179ce1245b2a9f590`. |
| Archive integrity | PASS | Python `zipfile.testzip()` returned `None`; archive has 86 entries; exactly one each of `ServiceNow Automation.exe`, `resources/app.asar`, `resources/scripts/local-cdp-bridge.py`, `resources/scripts/windows/start-dedicated-chromium-cdp.ps1`, and `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local-START-HERE-WINDOWS.txt`; zero forbidden filename marker matches for `.env`, cookie, storage-state, HAR, trace, screenshot/image extensions, `.git`, `node_modules`, local auth dirs, logs, or session strings. |
| Hygiene scan / cleanup state | PASS | Initial dry-run found stale AO6 active-release artifacts (3 files, 114M). AP7 then ran the local cleanup script and moved those three files to `dist/.release-archive/ao6/`. Follow-up dry-run reported `No stale artifacts found. Nothing to archive.` |

---

## Current package, checksum, and safety copy

| Property | Verified value |
|---|---|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` |
| Exact Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` |
| Local WSL path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip` |
| SHA256 | `75178630c1b5ce5c1e8fc3e7687a88c48d1409f3b3267f9179ce1245b2a9f590` |
| Package size | 118,601,823 bytes |
| Package mtime | 2026-06-07 08:28:22 CST (+0800), epoch `1780792102` |
| Checksum file | `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip.sha256`, 131 bytes, epoch `1780792102` |
| Safety copy | `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local-START-HERE-WINDOWS.txt`, 1,284 bytes, epoch `1780792102` |

The external START-HERE safety copy remains a local-only manual validation aid and repeats the critical restrictions. It is not approval for automatic login, Save / Submit / Update / Resolve / Close, upload, email, bulk action, API write, production/prod-shadow write, screenshots, HAR, trace, cookies, sessions, storage-state export, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values.

---

## Freshness and post-cleanup hygiene state

| Check | Result | Sanitized evidence |
|---|---:|---|
| Newest dated local zip artifact under `dist/` | PASS | Live scan found 15 zip files under `dist/`; AP6 active-release zip has the newest mtime (`1780792102`). The next newest zips are archived AP6 (`1780792062`), archived AO6 (`1780789583`), archived AN6 (`1780788270`), and archived AM (`1780786212`). |
| `dist/release/` current zip set | PASS | After cleanup, contains exactly one zip: `servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip`. |
| Stale release artifacts | PASS | Follow-up cleanup dry-run reported no stale artifacts in `dist/release/` and performed no file moves. |
| Archive demotion evidence | PASS | `dist/.release-archive/` exists with 13 archived sets: `af`, `ag`, `ah`, `ai6`, `aj`, `aj7`, `ak`, `al`, `am`, `an6`, `ao6`, `ap6`, `unknown`; 13 archived zip files total. |
| AP6 handoff alignment | PASS | `docs/status/phase-AP6-windows-local-package-refresh-2026-06-07.md` records the same current package name, SHA256, size, AP4/AP5 dependency chain, and AP6 gate results. |

---

## AP readiness references

| Reference | Why it matters for AP7 |
|---|---|
| `docs/status/phase-AP3-repo-hygiene-three-column-action-rail-implementation-2026-06-07.md` | Implements the repo-hygiene three-column action-rail polish packaged by AP6. |
| `docs/status/phase-AP4-qa-acceptance-manual-checklist-2026-06-07.md` | QA verdict is PASS / READY-FOR-MANUAL-VALIDATION-ONLY and provides Alan's Windows manual checklist. |
| `docs/status/phase-AP5-privacy-security-audit-2026-06-07.md` | Privacy/security verdict is APPROVE with no blocking issues; changes remain local-only. |
| `docs/status/phase-AP6-windows-local-package-refresh-2026-06-07.md` | AP6 produced the refreshed Windows local package validated here. |

---

## Hermes/profile readiness checks

| Check | Result | Sanitized evidence |
|---|---:|---|
| `hermes profile show codex-gpt55-control` | PASS | Profile path is `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; model `gpt-5.5 (openai-codex)`; Gateway running; Skills 74; `SOUL.md` exists. |
| `hermes tools list` | PASS | CLI listed built-in toolsets successfully. Core local validation toolsets used here were available: web, browser, terminal, file, code_execution, vision, skills, todo, memory, session_search, clarify. |
| `hermes gateway status` | PASS | Gateway is running in WSL manual/foreground mode. The status output lists the relevant SNA specialist profiles; the active `codex-gpt55-control` profile's own gateway readiness is confirmed by `hermes profile show`. |

---

## Commands run

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip.sha256
sha256sum servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip
stat -c '%n|%s|%Y|%y' servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip.sha256 servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local-START-HERE-WINDOWS.txt
python3 - <<'PY'  # archive integrity: zipfile.testzip(), expected entries, forbidden filename markers
PY
bash ../../scripts/hygiene/cleanup-stale-artifacts.sh --dry-run
bash ../../scripts/hygiene/cleanup-stale-artifacts.sh
bash ../../scripts/hygiene/cleanup-stale-artifacts.sh --dry-run
python3 - <<'PY'  # local artifact freshness scan under dist/
PY
hermes profile show codex-gpt55-control
hermes tools list
hermes gateway status
date '+%Y-%m-%d %H:%M:%S %Z (%z)'
git rev-parse HEAD
wslpath -w /home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip
```

---

## Final recommendation

**READY-FOR-MANUAL-VALIDATION-ONLY.**

Alan can manually validate the current AP6 local Windows package at:

`\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ap6-20260607-local.zip`

This is not release approval. This gate does not authorize release, push, PR, merge, tag, GitHub Release, publish, live ServiceNow login, browser action against real ServiceNow, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion.
