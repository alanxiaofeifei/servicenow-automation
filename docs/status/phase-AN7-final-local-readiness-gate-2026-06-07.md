UNC path Alan should test: `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip`

# Phase AN7 — Final Local Readiness Gate for Three-Column Operator Workbench Polish

**Date:** 2026-06-07 07:27:34 CST (+0800)
**Profile:** codex-gpt55-control
**Kanban task:** t_a413eb23
**HEAD:** `019c502e9b4ada63e2a0884f3783aae1a8a9ee04` (dirty worktree; local-only phase artifacts/changes remain open)
**Scope:** Final local readiness gate only. No live ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web write, real Teams/Outlook/phone ingestion, screenshots, HAR/trace capture, storage-state/cookie export, push, PR, merge, tag, GitHub Release, publish, or cron action was performed or authorized.
**Final recommendation:** **READY-FOR-MANUAL-VALIDATION-ONLY** — the refreshed AN6 local Windows package is present, checksum verification returns `OK`, it is the newest dated local zip artifact under `dist/`, all required local gates pass, archive integrity checks pass, post-cleanup hygiene is clean, and Hermes profile/tools/gateway readiness checks pass.

---

## Local-only boundary

This gate stayed inside the local WSL worktree and local package artifacts. It did not perform or authorize any red-zone action.

All evidence below is sanitized: no real ServiceNow raw URLs, ticket IDs, sys_ids, requester names, assignment groups, screenshots, cookies, storage state, traces, HAR, or real field values are included.

---

## Required gates

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | Exit 0. Desktop build produced main bundle 306.00 kB / 30 modules, preload 1.63 kB / 1 module, renderer CSS 146.80 kB + JS 1,101.89 kB / 56 modules; CLI build also completed. |
| `pnpm typecheck` | PASS | Exit 0. All 7 workspace packages typechecked clean: core, ai, kb, profiles, adapters, cli, desktop. |
| `pnpm test` | PASS | Exit 0. 440 total tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, desktop 150. Test warnings were sanitized/fail-closed runtime-selection paths only. |
| `pnpm privacy:scan` | PASS | Exit 0. `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| `sha256sum -c` / checksum verification | PASS | From `dist/release/`, `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip.sha256` returned `servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip: OK`; live SHA256 is `f96370027b41a0a86c6bb9b276619d63e5cdf0e26ec93bbd43aca85630276bdf`. |
| Archive integrity | PASS | Python `zipfile.testzip()` returned `None`; archive has 86 entries; exactly one each of `ServiceNow Automation.exe`, `resources/app.asar`, `resources/scripts/local-cdp-bridge.py`, `resources/scripts/windows/start-dedicated-chromium-cdp.ps1`, and `servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local-START-HERE-WINDOWS.txt`; zero forbidden marker matches for `.env`, cookie, storage-state, HAR, trace, screenshots, `.git`, `node_modules`, or logs strings. |
| Hygiene scan / cleanup dry-run | PASS | `bash scripts/hygiene/cleanup-stale-artifacts.sh --dry-run` from repo root reported `No stale artifacts found. Nothing to archive.` Live scan found `dist/release/` contains the AN6 zip, checksum, and START-HERE safety copy only; archive evidence exists under `dist/.release-archive/`. |

---

## Current package, checksum, and safety copy

| Property | Verified value |
|---|---|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` |
| Exact Windows UNC path | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` |
| Local WSL path | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip` |
| SHA256 | `f96370027b41a0a86c6bb9b276619d63e5cdf0e26ec93bbd43aca85630276bdf` |
| Package size | 118,605,315 bytes |
| Package mtime | 2026-06-07 07:24:30 CST (+0800), epoch `1780788270` |
| Checksum file | `servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip.sha256`, 131 bytes, epoch `1780788270` |
| Safety copy | `servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local-START-HERE-WINDOWS.txt`, 1,284 bytes, epoch `1780788270` |

The external START-HERE safety copy remains a local-only manual validation aid and repeats the critical restriction: no automatic login; no Save / Submit / Update / Resolve / Close; no upload, email, bulk action, API write, production/prod-shadow write, screenshots, HAR, trace, cookies, sessions, storage-state export, raw URLs, ticket IDs, sys_ids, requester names, assignment groups, browser endpoints, page fingerprints, or real field values.

---

## Freshness and post-cleanup hygiene state

| Check | Result | Sanitized evidence |
|---|---:|---|
| Newest dated local zip artifact under `dist/` | PASS | Live scan found 12 zip files under `dist/`; AN6 has the newest mtime (`1780788270`). The next newest zip is archived AM (`1780786212`), followed by the archived canonical prerelease zip (`1780786209`) and older phase archives. |
| `dist/release/` current zip set | PASS | Contains exactly one zip: `servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip`. |
| Stale release artifacts | PASS | Cleanup dry-run reported no stale artifacts in `dist/release/` and performed no file moves. |
| Archive demotion evidence | PASS | `dist/.release-archive/` exists with 10 archived sets: `af`, `ag`, `ah`, `ai6`, `aj`, `aj7`, `ak`, `al`, `am`, `unknown`; 10 archived zip files total. |
| AN6 handoff alignment | PASS | `docs/status/phase-AN6-windows-local-package-refresh-2026-06-07.md` records the same package name, SHA256, size, active-release-only state, and AN4/AN5 dependency chain. |

---

## Three-column workbench readiness references

| Reference | Why it matters for AN7 |
|---|---|
| `docs/status/phase-AN3-three-column-workbench-implementation-2026-06-07.md` | Implements the three-column polish: SOURCES / WORK PRODUCT / RUNTIME headers, runtime copy rename, column separator CSS, focus-visible polish, and test assertions. |
| `docs/status/phase-AN4-qa-acceptance-manual-checklist-2026-06-07.md` | QA verdict is PASS / READY-FOR-MANUAL-VALIDATION-ONLY and provides Alan's Windows manual checklist for visual and keyboard validation. |
| `docs/status/phase-AN5-privacy-security-audit-2026-06-07.md` | Privacy/security verdict is APPROVE with no blocking issues; changes are local-only UI/copy/CSS/test changes and add no write-path semantics. |
| `docs/status/phase-AN6-windows-local-package-refresh-2026-06-07.md` | AN6 produced the refreshed Windows local package validated here and archived AM6 stale artifacts out of active `dist/release/`. |

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
sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip.sha256
sha256sum servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip
python3 - <<'PY'  # archive integrity: expected entries and forbidden marker counts
PY
python3 - <<'PY'  # START-HERE entry name confirmation
PY
bash scripts/hygiene/cleanup-stale-artifacts.sh --dry-run
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
date '+%Y-%m-%d %H:%M:%S %Z (%z)'
git rev-parse HEAD
wslpath -w /home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip
```

Note: one exploratory hygiene dry-run was invoked from `dist/release/` with the repo-relative script path and failed because the current working directory was wrong. It was immediately rerun from repo root and passed; this is not a readiness blocker.

---

## Final recommendation

**READY-FOR-MANUAL-VALIDATION-ONLY.**

Alan can manually validate the current AN6 local Windows package at:

`\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-an6-20260607-local.zip`

This is not release approval. This gate does not authorize release, push, PR, merge, tag, GitHub Release, publish, live ServiceNow login, browser action against real ServiceNow, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion.
