# Phase AZ6 — Windows local package refresh

Use this exact Windows UNC path:

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip
```

## Package details

| Attribute | Value |
|---|---|
| **Linux path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip` |
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip` |
| **Size** | 118,603,008 bytes (114 MB) |
| **SHA256** | `cf936e3269d34a26e2550adb863e2e1e694150ac0ab2441733d67fe67d69fe19` |
| **Sidecar check** | `sha256sum -c`: OK (verified against `servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip.sha256`) |
| **mtime** | 2026-06-07 16:25 |
| **Newest local zip?** | YES — az6 at 16:25 supersedes ay6 at 15:54 |

## Related artifacts in dist/release/

```
-rw-rw-r--  131  16:25  servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip.sha256
-rw-rw-r--  114M  16:25  servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local.zip
-rw-rw-r--  1.3K  16:25  servicenow-automation-windows-v0.1.0-rc.1-az6-20260607-local-START-HERE-WINDOWS.txt
-rw-rw-r--  2.8K  16:18  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local-START-HERE-WINDOWS.txt  [archival]
-rw-rw-r--  131   15:54  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip.sha256              [archival]
-rw-rw-r--  114M  15:54  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip                      [archival]
```

Older ay6 artifacts remain as archival references. The az6 package is the active dated local build.

## Gates (independently verified on this run)

| Gate | Result | Details |
|---|---|---|
| `pnpm build` | PASS | — |
| `pnpm typecheck` | PASS | 7 packages typechecked |
| `pnpm test` | PASS | 453 tests across 32 files, 7 packages |
| `pnpm privacy:scan` | PASS | 288 files scanned, no privacy violations |
| Archive verification | PASS | asar, CDP ps1, CDP bridge present; no forbidden content |
| SHA256 sidecar | PASS | verified OK |

## Changes in this build

This build incorporates all changes from the `next/post-release-operator-cockpit-ab-20260606` branch that passed the AG pipeline through AZ6. Compared to the previous ay6 build, changes include:

- 9 modified files, 1251 insertions, 314 deletions
- Operator workbench three-column layout (App.tsx, styles.css)
- Worktree IPC handler and tests
- Gitignore hygiene updates
- Windows clean-machine validation guide updates
- Various status docs from AG phases

## Safety status

- Sanitized local-only: no real ServiceNow URLs, ticket IDs, credentials, cookies, HARs, or screenshots
- No push, PR, merge, or tag performed
- No ServiceNow API writes or browser automation
- All prohibitions from previous phases preserved
- START-HERE-WINDOWS.txt generated fresh with safety warnings

## How to use on Windows

1. Copy the UNC path above into Windows File Explorer or Run dialog (`Win+R`).
2. Extract the zip.
3. Double-click `ServiceNow Automation.exe` from the extracted folder.
4. Follow the workflow cards in the START-HERE-WINDOWS.txt instructions.

## Remaining risk

- Alan still needs to execute clean-machine Windows manual validation per runbook (`docs/test/windows-clean-machine-validation-2026-06-07.md`).
- No real ServiceNow operations permitted until a separate checkpoint explicitly approves them.
