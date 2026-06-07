UNC path Alan should test: `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip`

# Phase AI7 — Final Local Readiness Gate for Worktree Acceptance Action Wiring

**Date:** 2026-06-07 04:45 CST (+0800)
**Profile:** codex-gpt55-control
**Scope:** Final local readiness gate only; no live ServiceNow, Microsoft Graph, Outlook/Teams ingestion, upload, push, PR, merge, tag, GitHub Release, publish, or cron action was performed or authorized.
**Recommendation:** **READY-FOR-MANUAL-VALIDATION-ONLY** — Alan may manually test the exact local Windows package above. This is not a release, merge, push, PR, tag, publish, or production/live-ServiceNow authorization.

---

## Local-only boundary

This gate stayed inside the local WSL worktree and local package artifacts. It did not perform real ServiceNow login, browsing, API write, Save/Submit/Update/Resolve/Close, attachment upload, Microsoft Graph / Excel Web write, real Teams/Outlook/phone ingestion, screenshots, HAR/trace capture, storage-state/cookie export, push, PR, merge, tag, GitHub Release, publish, or cron changes.

All evidence below is sanitized: no real ServiceNow raw URLs, ticket IDs, sys_ids, requester names, assignment groups, screenshots, cookies, storage state, traces, HAR, or real field values are included.

---

## Required gates

| Gate | Result | Sanitized evidence |
|---|---:|---|
| `pnpm build` | PASS | Workspace build scope 7 of 8. Desktop build produced main bundle 298.00 kB / 30 modules, preload 1.35 kB / 1 module, renderer CSS 141.98 kB + JS 1,078.60 kB / 56 modules. |
| `pnpm typecheck` | PASS | All 7 workspace packages typechecked clean: core, ai, kb, profiles, adapters, cli, desktop. |
| `pnpm test` | PASS | 436 total tests passed: core 83, ai 34, kb 6, profiles 17, adapters 95, cli 55, desktop 146. Desktop worktree acceptance coverage includes 17 `worktree-ipc` tests and 100 App tests. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| `sha256sum` / checksum verification | PASS | From `dist/release/`, `sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip.sha256` returned `OK`; live SHA256 is `aafd1b42cbd29aee5337ac011c621d68a97d6d64c34175b47f87ea4947d054ad`. |
| Report sanitized and local-only | PASS | This document contains only local paths, package metadata, aggregate test counts, and sanitized code/test evidence; no red-zone ServiceNow/customer data is present. A final report-specific privacy pattern check returned `FINAL_REPORT_PRIVACY_PATTERN_PASS`. |

---

## Package freshness, checksum, and safety copy

| Property | Verified value |
|---|---|
| Current package | `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` |
| Exact Windows UNC path | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` |
| SHA256 | `aafd1b42cbd29aee5337ac011c621d68a97d6d64c34175b47f87ea4947d054ad` |
| Package size | 118,600,763 bytes |
| Package mtime | 2026-06-07 04:38:42 CST (+0800), epoch `1780778322` |
| Checksum file | `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip.sha256`, 131 bytes, same epoch `1780778322` |
| Safety copy | `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local-START-HERE-WINDOWS.txt`, 1,284 bytes, same epoch `1780778322` |

Freshness ordering from `dist/release/` confirms AI6 is the newest local zip:

1. `1780778322` — `servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip` — 118,600,763 bytes
2. `1780775978` — `servicenow-automation-windows-v0.1.0-rc.1-ah-20260607-local.zip` — older/stale
3. `1780775971` — `servicenow-automation-windows-v0.1.0-rc.1.zip` — older/stale
4. `1780774566` — `servicenow-automation-windows-v0.1.0-rc.1-ag-20260607-local.zip` — older/stale
5. `1780771167` — `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` — older/stale

Archive safety spot-check using Python `zipfile` confirmed the package contains exactly one each of these expected entries: `START-HERE-WINDOWS.txt`, `app.asar`, `local-cdp-bridge.py`, `start-dedicated-chromium-cdp.ps1`, and `ServiceNow Automation.exe`. It found zero matches for forbidden archive markers checked locally: `.git/`, `.auth/`, `coverage/`, `.har`, `.trace`, `.png`, `.cookies.json`, and `storage-state`.

---

## Action wiring local-safety review

| Wiring area | Result | Sanitized evidence |
|---|---:|---|
| Review diff | PASS | `worktreeApi.getGitDiff()` invokes `sda:worktree-git-diff`; handler runs fixed `git diff --stat HEAD` in the project root, with no user-supplied arguments and a 100 KB max buffer. Home-directory content is sanitized to `~` when present. |
| Open dist/release | PASS | `worktreeApi.openDistRelease()` invokes `sda:worktree-open-dist-release`; handler constructs `projectRoot/dist/release` locally and calls `shell.openPath` on that fixed path. No user-supplied path is accepted. |
| Worktree status | PASS | `worktreeApi.getWorktreeStatus()` invokes fixed `git status --porcelain` in the project root; no ServiceNow/browser/write path is involved. |
| Dynamic package metadata | PASS | `worktreeApi.worktreePackageMetadata()` scans only local `dist/release/*.zip`, selects newest by mtime, reads the local file, computes SHA256, and returns local metadata. No network or upload path is involved. |
| Mark reviewed | PASS with design note | The button is disabled while dirty changes exist until Review diff has been clicked; when clicked it only sets local React state (`worktreeReviewed` / `worktreeAccepted`). This is an in-memory human checkpoint, not persistence, release, merge, or upload. |
| Copy package path / summary | PASS | Clipboard actions copy dynamic local metadata; no external write is performed. |
| Footer boundary | PASS | UI states: “No live ServiceNow action, upload, PR, merge, tag, or release is implied. Human-reviewed acceptance only.” |

No unresolved no-op action stubs were found in the worktree acceptance wiring. The only intentionally non-persistent behavior is `Mark reviewed`, which is documented above as an in-memory manual checkpoint by design.

One non-blocking wording caveat remains: the queue label at `apps/desktop/src/App.tsx` line 4301 still says “AG local Windows package” even though the package metadata/path displayed and copied are dynamic and resolve to the AI6 zip verified in this gate. This does not change the local-only safety boundary or checksum/freshness verification, but it should be corrected before any release-facing copy is finalized.

---

## Hermes/profile readiness checks

| Check | Result | Sanitized evidence |
|---|---:|---|
| `hermes profile show codex-gpt55-control` | PASS | Profile path is `/home/alanxwsl/.hermes/profiles/codex-gpt55-control`; model `gpt-5.5 (openai-codex)`; Gateway running; Skills 74; `SOUL.md` exists. |
| `hermes tools` | PASS | CLI tool configuration menu displayed successfully via an interactive `script` wrapper; CLI reports 12/27 tools enabled. The run selected `Done`; no tool enablement toggle was selected. |
| `hermes gateway status` | PASS | Gateway running in WSL manual/foreground mode; listed project-relevant profiles include `codex-gpt55-control` plus the SNA specialist profiles. |

---

## Final recommendation

**READY-FOR-MANUAL-VALIDATION-ONLY.** Alan should test only this exact local Windows package:

`\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-ai6-20260607-local.zip`

Manual validation should be limited to local package launch and local/demo/mock-safe checks unless a separate explicit checkpoint authorizes anything broader. This gate does not authorize release, push, PR, merge, tag, GitHub Release, publish, live ServiceNow login, browser action against real ServiceNow, attachment upload, Microsoft Graph / Excel Web write, or real Teams/Outlook/phone ingestion.
