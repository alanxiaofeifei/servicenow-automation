\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip

# Phase BF7 — Final Local Readiness Gate

Date: 2026-06-07
Gate run: 2026-06-07 11:27 UTC
Profile: `codex-gpt55-control`
Task: `t_671764f0`
Branch: `next/post-release-operator-cockpit-ab-20260606`
Source commit checked: `019c502`
Verdict: READY-FOR-MANUAL-VALIDATION-ONLY

## Alan manual validation package

Use the exact Windows UNC path on line 1 of this document. Alan should copy that path into Windows File Explorer or Win+R, extract the ZIP locally on Windows, read `START-HERE-WINDOWS.txt`, then launch `ServiceNow Automation.exe` for supervised local/manual validation only.

Linux path: `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip`
Artifact name: `servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip`

## Package facts verified locally

| Check | Result |
|---|---|
| ZIP exists | PASS |
| SHA256 sidecar exists | PASS — `servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip.sha256` |
| START-HERE sidecar exists | PASS — package-specific BF6 copy with UNC path, checksum, P0 checklist reference, diagnostic guidance, and safety restrictions |
| Size | 118,607,518 bytes (113.11 MiB) |
| SHA256 | `3e12d093e46686d2f0c20bf5efb34beaf1f7372bbcf94b63338d235b5c4c2a33` |
| `sha256sum -c` | PASS — `servicenow-automation-windows-v0.1.0-rc.1-bf6-20260607-local.zip: OK` |
| Archive spot-check | PASS — 86 files; includes `resources/app.asar`, Windows helper scripts, local CDP bridge, and embedded BF6 START-HERE |
| Runbook note | `docs/test/windows-clean-machine-validation-2026-06-07.md` remains BE6-scoped; for the BF6 package path/checksum, use this BF7 document and the BF6 START-HERE sidecar above. |

## Fresh required local gate results

| Gate | Result | Sanitized evidence |
|---|---|---|
| `pnpm build` | PASS | Desktop main/preload/renderer build and CLI TypeScript build completed with exit 0. |
| `pnpm typecheck` | PASS | All 7 workspace projects typechecked with exit 0. |
| `pnpm test` | PASS | 459/459 tests passed across core, AI, KB, profiles, adapters, CLI, and desktop workspaces with exit 0. |
| `pnpm privacy:scan` | PASS | `TRACKED_PRIVACY_SCAN_PASS files=288` with exit 0. |
| Profile/tools/gateway readiness | PASS | `hermes profile show codex-gpt55-control`, `hermes tools list`, and `hermes gateway status` returned healthy local status. |

Sequential test retry was not needed because the primary `pnpm test` run passed.

## Safety statement

This BF7 gate stayed local-only: no real ServiceNow login, browser operation, API write, Save/Submit/Update/Resolve/Close action, attachment upload, Microsoft Graph/Excel Web write, real Teams/Outlook/phone data ingestion, GitHub push/PR/merge/tag/release, publish action, cron change, credential/session capture, HAR/trace/screenshot capture, or external write was performed.

Final verdict: READY-FOR-MANUAL-VALIDATION-ONLY. This is only approval for Alan's supervised manual Windows validation of the exact BF6 package above; it is not approval for live ServiceNow operations, external writes, release publication, merging, tagging, or automated submission.
