UNC path Alan should test: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip`

# Phase AJ7 — Final Local Readiness Gate for Package-Path Clarity

**Date:** 2026-06-07 05:20:38 CST (+0800)
**Profile:** codex-gpt55-control
**Kanban task:** t_3f21c407
**HEAD:** `019c502e9b4ada63e2a0884f3783aae1a8a9ee04` (dirty worktree; local-only phase artifacts/changes remain open)
**Scope:** Final local readiness gate only. No live ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web write, real Teams/Outlook/phone ingestion, screenshots, HAR/trace capture, storage-state/cookie export, push, PR, merge, tag, GitHub Release, publish, or cron action was performed or authorized.
**Final recommendation:** **READY-FOR-MANUAL-VALIDATION-ONLY** — the current local Windows package is the newest local zip, checksum verification returns `OK`, required local gates pass, and the user-visible package-path copy now points to the current local Windows package rather than stale AG/AI6 wording.

---

## Local-only boundary

This gate stayed inside the local WSL worktree and local package artifacts. It did not perform or authorize any red-zone action.

All evidence below is sanitized: no real ServiceNow raw URLs, ticket IDs, sys_ids, requester names, assignment groups, screenshots, cookies, storage state, traces, HAR, or real field values are included.

---

## Required gates

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | Workspace build scope 7 of 8. Desktop build produced main bundle 298.00 kB / 30 modules, preload 1.35 kB / 1 module, renderer CSS 142.45 kB + JS 1,080.57 kB / 56 modules. |
| `pnpm typecheck` | PASS | All 7 workspace packages typechecked clean: core, ai, kb, profiles, adapters, cli, desktop. |
| `pnpm test` | PASS | 437 total tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, desktop 147. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| `sha256sum -c` / checksum verification | PASS | From `dist/release/`, `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip.sha256` returned `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip: OK`; live SHA256 is `ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe`. |

---

## Current package freshness, checksum, and safety copy

| Property | Verified value |
|---|---|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| Exact Windows UNC path | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| SHA256 | `ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe` |
| Package size | 118,601,041 bytes |
| Package mtime | 2026-06-07 05:16:34 CST (+0800), epoch `1780780594` |
| Checksum file | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip.sha256`, 131 bytes, same epoch `1780780594` |
| Safety copy | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local-START-HERE-WINDOWS.txt`, 1,284 bytes, same epoch `1780780594` |

Freshness ordering from `dist/release/` confirms this package is the newest local zip:

1. `1780780594` — `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` — 118,601,041 bytes — current package
2. `1780780145` — `servicenow-automation-windows-v0.1.0-rc.1-aj-20260607-local.zip` — older/stale
3. `1780778322` — `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` — older/stale
4. `1780775978` — `servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` — older/stale
5. `1780775971` — `servicenow-automation-windows-v0.1.0-rc.1.zip` — older/stale
6. `1780774566` — `servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip` — older/stale
7. `1780771167` — `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` — older/stale

Archive safety spot-check using Python `zipfile` confirmed the package contains exactly one each of these expected entries: `START-HERE-WINDOWS.txt`, `app.asar`, `local-cdp-bridge.py`, `start-dedicated-chromium-cdp.ps1`, and `ServiceNow Automation.exe`. It found zero matches for forbidden archive markers checked locally: `.git/`, `.auth/`, `coverage/`, `.har`, `.trace`, `.png`, `.cookies.json`, and `storage-state`.

The packaged START-HERE copy keeps the red-zone boundary intact: no Save/Submit/Update/Resolve/Close automation, no upload/email/bulk action, no ServiceNow API write, no screenshots/HAR/trace/video capture from real ServiceNow pages, no cookies/sessions/storage-state export, and no raw customer/ServiceNow identifiers.

---

## User-visible package-path clarity check

| Check | Result | Sanitized evidence |
|---|---:|---|
| Current path line is dynamic and generic | PASS | `apps/desktop/src/App.tsx:4266-4267` renders `Current local Windows package:` plus `linuxToWslUncPath(worktreePkgMetadata.path)`, so the displayed path resolves from current local package metadata rather than a hardcoded stale package. |
| Queue card uses current package wording | PASS | `apps/desktop/src/App.tsx:4301-4302` renders `Current local Windows package` and `Newest dated local build — checksum verified, local-only.` |
| Manual checklist references current package path | PASS | `apps/desktop/src/App.tsx:4345-4346` says to confirm the label reads `Current local Windows package` and that the path matches the `current local Windows package path above`. |
| Stale AG/AI6 phrases absent from user-visible copy | PASS | Local source count in `apps/desktop/src/App.tsx`: `AG local Windows package` = 0, `exact AI6 zip path` = 0, `AI6 zip path` = 0, `current local Windows package path above` = 1. |
| Local-only safety remains explicit | PASS | `apps/desktop/src/App.tsx:4260` states no ServiceNow actions and no upload / PR / merge / tag / release; `apps/desktop/src/App.tsx:4329-4330` states acceptance is a human decision and no automated action implies acceptance, release, upload, or ServiceNow write. |

---

## Hermes/profile readiness checks

| Check | Result | Sanitized evidence |
|---|---:|---|
| `hermes profile show codex-gpt55-control` | PASS | Profile path is `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; model `gpt-5.5 (openai-codex)`; Gateway running; Skills 74; `SOUL.md` exists. |
| `hermes tools list` | PASS | CLI listed built-in toolsets successfully. Core local validation toolsets used here were available: terminal, file, skills, todo, and kanban worker tools. |
| `hermes gateway status` | PASS | Gateway is running in WSL manual/foreground mode and lists the relevant SNA profiles, including `codex-gpt55-control` and the SNA specialist profiles. |

---

## Final recommendation

**READY-FOR-MANUAL-VALIDATION-ONLY.**

Alan can manually validate the current local Windows package at:

`\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip`

This is not release approval. This gate does not authorize release, push, PR, merge, tag, GitHub Release, publish, live ServiceNow login, browser action against real ServiceNow, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion.
