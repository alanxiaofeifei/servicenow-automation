# Phase AX7 — Final Local Readiness Gate

Date: 2026-06-07
Scope: Repo-hygiene action-button disabled reason specificity
Verdict: READY-FOR-MANUAL-VALIDATION-ONLY

## Alan manual validation package

Use this exact Windows UNC path:

```text
\\wsl.localhost\Ubuntu\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip
```

Linux path:

```text
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip
```

Package facts verified locally:

| Check | Result |
|---|---|
| Package filename | `servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip` |
| Size | 118,603,008 bytes |
| SHA256 | `8cd0c9b74b0ad4d2fa67efb073f2c016ae9baaedfa10314de53c3e0101036647` |
| Sidecar SHA256 | MATCH |
| mtime local | 2026-06-07 15:26:23 +0800 |
| Newest `.zip` in `dist/release/` | PASS |

## Readiness checklist

| Requirement | Result | Evidence |
|---|---|---|
| QA acceptance | PASS | AX4 verdict PASS; manual acceptance and automated gates passed. |
| Privacy/security | APPROVE | AX5 verdict APPROVE; no blocking issues. |
| Windows package refresh | PASS | AX6 package exists, checksum verified, newest by mtime. |
| `pnpm build` | PASS | Fresh local run: renderer, preload, main, and CLI builds passed. |
| `pnpm typecheck` | PASS | Fresh local run: 7 workspace projects passed. |
| `pnpm test` | PASS | Fresh local run: 453 tests passed across core, ai, kb, profiles, adapters, cli, desktop. |
| `pnpm privacy:scan` | PASS | Fresh local run: `TRACKED_PRIVACY_SCAN_PASS files=288`. |
| AX6 package newest in `dist/release/` | PASS | AX6 zip mtime is newer than AW5, AV6, AU6, AT6, and prior packages. |
| No ServiceNow interaction/API writes | PASS | Local-only commands and file inspection only. |
| No push / PR / merge / tag / release | PASS | No publication action performed. |
| Exact Windows UNC path stated | PASS | Prominent path above. |

## Disabled-reason specificity summary

The repo-hygiene action rail now uses item-specific static disabled reason text for blocked local actions:

| Local action | Disabled reason coverage |
|---|---|
| Export status markdown | Scan-required reason. |
| Copy selected summary | Scan-required reason. |
| Cleanup preview | Scan-required and cleanup-already-applied reasons. |
| Archive stale artifacts | Preview-required, preview-open-required, in-progress, and already-complete reasons. |

All disabled reason strings are static UI text. No new ServiceNow interaction, no external write surface, no attachment path, and no customer data exposure is part of this final gate.

## Manual validation requested

Alan should extract and run the Windows package from the UNC path above, then validate only the local desktop behavior for the repo-hygiene disabled reasons and the unchanged local workflow. This gate does not approve release publication; it is ready for manual validation only.
