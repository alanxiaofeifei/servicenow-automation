# Phase AS6 — Windows local package refresh

**Date:** 2026-06-07
**Assignee:** sna-windows-runtime
**Parent tasks:** [AS4 QA acceptance (PASS)](phase-AS4-qa-acceptance-manual-checklist-2026-06-07.md), [AS5 privacy/security audit (APPROVE)](phase-AS5-privacy-security-audit-2026-06-07.md)
**Upstream scope:** AS3 implementation (worktree acceptance action wiring)

## Artifact

| Field | Value |
|---|---|
| **Package path** | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip` |
| **SHA256** | `c95b8362c43d632cbb8204f753061595abdb92ae866a3aa023f20f2f533b8638` |
| **Size** | 114 MB |
| **Sidecar** | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local.zip.sha256` |
| **START HERE** | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-as6-20260607-local-START-HERE-WINDOWS.txt` |

## Build provenance

- **Workspace:** `/home/alanxwsl/projects/servicenow-automation` (git worktree)
- **Branch:** `next/post-release-operator-cockpit-ab-20260606`
- **HEAD commit:** `019c502` (AG1-DelC: Verify .gitignore remediation complete)
- **Working tree:** AS-scope uncommitted changes (5 files, 1714 insertions / 45 deletions) — includes AS3 worktree acceptance action wiring, AS4 QA fixes, AS5 audit-approved code
- **Build command:** `SDA_RELEASE_VERSION=v0.1.0-rc.1-as6-20260607-local bash scripts/packaging/build-windows-rc.sh`
- **Build time:** 2026-06-07 13:06 UTC

## Verification gates

| Gate | Result |
|---|---|
| `pnpm build` | PASS |
| `electron-builder --win zip` | PASS |
| Archive SHA256 sidecar match | PASS |
| No forbidden directories | PASS |
| No forbidden files | PASS |
| `resources/app.asar` present | PASS |
| `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` present | PASS |
| `resources/scripts/local-cdp-bridge.py` present | PASS |

## Testable Windows path

1. Copy the zip to a Windows machine or shared drive.
2. Extract the zip to a folder.
3. Double-click `ServiceNow Automation.exe` (inside `win-unpacked`).
4. A terminal window opens showing startup progress and the log path.
5. The Electron tool window opens with the three-column operator workbench.
6. Use the worktree acceptance card to verify action button wiring.

**Manual validation checklist (Windows):**

- [ ] Executable launches without WSL dependency
- [ ] Log path is shown in terminal
- [ ] Three-column layout renders
- [ ] Action buttons render with correct disabled states
- [ ] Boundary phase is shown in header
- [ ] Git diff section is collapsible
- [ ] Summary copy button works
- [ ] No real ServiceNow data visible

## Safety boundaries preserved

- No ServiceNow URLs, ticket IDs, sys_ids, cookies, sessions, HARs, screenshots
- No real field values or customer data in the package
- Local-only package — no push, PR, merge, tag, or GitHub Release
- START-HERE-WINDOWS.txt documents the critical restriction: no Save/Submit/Update/Resolve/Close automation

## Remaining risks

- Package is built from uncommitted working tree — commit and push must happen in a separate phase.
- Windows clean-machine validation not yet performed (separate task).
