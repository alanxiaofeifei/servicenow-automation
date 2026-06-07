# Phase BA6 — Windows local package refresh

Use this exact Windows UNC path:

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip
```

## Package details

| Attribute | Value |
|---|---|
| **Linux path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip` |
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip` |
| **Size** | 118,603,741 bytes (113 MB) |
| **SHA256** | `1e784ea3dfdb0f37da2da75a6beaaec46fa8d4da4ec1359b4843edeefb3cd07b` |
| **Sidecar check** | `sha256sum -c`: OK (verified against `servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip.sha256`) |
| **mtime** | 2026-06-07 16:54 |
| **Newest local zip?** | YES — ba6 at 16:54 supersedes az6 at 16:25 |

## Related artifacts in dist/release/

```
-rw-rw-r--  1.3K  16:54  servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local-START-HERE-WINDOWS.txt
-rw-rw-r--  131   16:54  servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip.sha256
-rw-rw-r--  113M  16:54  servicenow-automation-windows-v0.1.0-rc.1-ba6-20260607-local.zip
-rw-rw-r--  1.3K  16:25  servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local-START-HERE-WINDOWS.txt  [archival]
-rw-rw-r--  131   16:25  servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip.sha256              [archival]
-rw-rw-r--  113M  16:25  servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip                      [archival]
-rw-rw-r--  2.8K  16:18  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local-START-HERE-WINDOWS.txt  [archival]
-rw-rw-r--  131   15:54  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip.sha256              [archival]
-rw-rw-r--  113M  15:54  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip                      [archival]
```

Older az6 and ay6 artifacts remain as archival references. The ba6 package is the active dated local build.

## Gates (independently verified on this run)

| Gate | Result | Details |
|---|---|---|
| `pnpm build` | PASS | — |
| `pnpm typecheck` | PASS | 7 packages typechecked |
| `pnpm test` | PASS | 457 tests across 32 files, 7 packages |
| `pnpm privacy:scan` | PASS | 288 files scanned, no privacy violations |
| Archive verification | PASS | asar, CDP ps1, CDP bridge present; no forbidden content |
| SHA256 sidecar | PASS | verified OK |

## Changes in this build

This build incorporates all changes from the `next/post-release-operator-cockpit-ab-20260606` branch that passed the BA pipeline. Compared to the previous az6 build, changes include:

- Runtime evidence panel in the operator workbench right rail (App.tsx, styles.css, App.test.ts) — 9 files, 1547 insertions, 320 deletions total
- Sanitized evidence summary and collapsible detail entries
- Status indicators (green/amber/red), relative + absolute timestamps
- Empty state and correct disabled reasons
- Worktree IPC handler (worktree-ipc.ts) and tests (worktree-ipc.test.ts)
- Gitignore hygiene updates
- Various status docs from previous phases

## Safety status

- Sanitized local-only: no real ServiceNow URLs, ticket IDs, credentials, cookies, HARs, or screenshots
- No push, PR, merge, or tag performed
- No ServiceNow API writes or browser automation
- All prohibitions from previous phases preserved
- START-HERE-WINDOWS.txt generated fresh with safety warnings

## How to use on Windows

1. Copy the UNC path above into Windows File Explorer or Run dialog (Win+R).
2. Extract the zip.
3. Double-click `ServiceNow Automation.exe` from the extracted folder.
4. Follow the workflow cards in the START-HERE-WINDOWS.txt instructions.

## Remaining risk

- Alan still needs to execute clean-machine Windows manual validation per runbook (`docs/test/windows-clean-machine-validation-2026-06-07.md`).
- No real ServiceNow operations permitted until a separate checkpoint explicitly approves them.
