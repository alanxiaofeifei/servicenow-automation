# Phase BC5 — Privacy/Security Audit — Checklist Launcher and Runbook

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-privacy-security`
**Task:** `t_6b54e356`

---

## Verdict: APPROVE WITH CONDITIONS

No blocking privacy/security issues found. All standard gates pass. The working-tree implementation (which evolved beyond the original BC3 scope into the AG-phase worktree acceptance features) does not leak ServiceNow data, credentials, or sensitive customer/ticket information.

---

## 1. Evidence Reviewed

### Files examined

| File | Status | Reviewed |
|------|--------|----------|
| `apps/desktop/electron/main.ts` | Modified | 8 new IPC handlers registered; no ServiceNow, no external writes |
| `apps/desktop/electron/preload.ts` | Modified | `worktreeApi` exposed via `contextBridge`; 8 methods, no raw paths |
| `apps/desktop/electron/worktree-ipc.ts` | New (untracked) | Full review — 497 lines |
| `apps/desktop/electron/worktree-ipc.test.ts` | New (untracked) | 702 lines — sanitized test data only |
| `apps/desktop/src/App.tsx` | Modified | Large diff — full review |
| `apps/desktop/src/App.test.ts` | Modified | 2 new tests, sanitized |
| `apps/desktop/src/styles.css` | Modified | CSS only — no data |
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | Modified | Runbook refresh ae→ay6 |
| `.gitignore` | Modified | Added comment line only |

### Gates run

```
pnpm privacy:scan → PASS (288 files)
```

---

## 2. Acceptance Criteria — Results

### ✅ Verify `pnpm privacy:scan` — PASS

288 files scanned. No hits. PASS.

### ✅ Verify no raw ServiceNow URLs, sys_ids, ticket IDs, requester names, assignment groups, or credentials in the checklist button copy or runbook

- **Checklist button copy**: The "Open checklist" button (App.tsx line 4320) is still `disabled` with the tooltip `"Manual checklist document is available in the project docs directory."` — no sensitive data.
- **Runbook**: `docs/test/windows-clean-machine-validation-2026-06-07.md` contains only the UNC package path (for the ay6 zip), SHA256, file size, gate status, and generic validation steps. No raw ServiceNow URLs, sys_ids, ticket IDs, requester names, or assignment groups. The only personal-path reference is the WSL UNC prefix `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...` which is the expected package location path.

### ✅ Verify no new IPC handler exposes raw paths, secrets, or sensitive data

All 8 new IPC handlers reviewed:

| Handler | Channel | Risk | Finding |
|---------|---------|------|---------|
| `handleWorktreeGitDiff` | `sda:worktree-git-diff` | LOW | Sanitizes `$HOME` → `~`. No user args. |
| `handleWorktreeOpenDistRelease` | `sda:worktree-open-dist-release` | LOW | Opens `projectRoot/dist/release/` only. |
| `handleWorktreeOpenWorkspaceRoot` | `sda:worktree-open-workspace-root` | LOW | Opens `projectRoot` only. |
| `handleWorktreeStatus` | `sda:worktree-status` | LOW | Returns git porcelain — project filenames only. |
| `handleWorktreePackageMetadata` | `sda:worktree-package-metadata` | LOW | Returns zip metadata, SHA256, phase prefix. No secrets. |
| `handleHygieneScan` | `sda:hygiene-scan` | LOW | Reads `.gitignore`, `dist/release/`, `.local/video-analysis/`. No secrets. |
| `handleCleanupPreview` | `sda:cleanup-preview` | LOW | Dry-run only — no file modifications. |
| `handleCleanupExecute` | `sda:cleanup-execute` | LOW | Moves files within `projectRoot/dist/` only. Requires renderer confirmation dialog. |

Additional handler `handleWorktreeOpenFile` (lines 68-83 of worktree-ipc.ts) is **exported but not wired to any IPC channel** — no exposure risk.

### ✅ Verify the button click does not write to disk, send network requests, or upload anything

**Important note**: The "Open checklist" button (line 4320) is still `disabled` with no onClick handler. The BC1 spec planned to wire it to `api.openValidationRunbook()` but this was not implemented in the working tree.

The other buttons in the handoff area (Copy package path, Copy summary, Open package folder) all use:
- `navigator.clipboard.writeText()` — local clipboard only
- `api.openDistRelease()` → `shell.openPath()` — opens local file manager
- No `fetch()`, `XMLHttpRequest`, or any network API

The `handleCleanupExecute` IPC handler performs `renameSync` (local file moves within `dist/.release-archive/`) — this is a local write, but it:
- Only moves files from `dist/release/` to `dist/.release-archive/`
- Requires renderer confirmation dialog before execution
- Does not delete, upload, or send data anywhere

### ✅ Verify the runbook contains only sanitized package path (UNC path for the zip) and no real ServiceNow data

The runbook now references the `ay6` package (was `ae`). Contents:
- UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip`
- SHA256, file size, gate status
- Validation steps (no ServiceNow actions)
- Safety boundaries section explicitly states no ServiceNow writes

No real ServiceNow URLs, hosts, ticket IDs, sys_ids, requester names, assignment groups, or credentials found.

---

## 3. Non-Blocking Observations

### 3.1 Open checklist button still disabled

The BC1 spec planned for BC3 to wire the "Open checklist" button via `api.openValidationRunbook()`. In the working tree, the button remains:

```tsx
<button type="button" className="local-draft-button" disabled 
  title="Manual checklist document is available in the project docs directory.">
  Open checklist
</button>
```

This is a **UX gap**, not a security issue. The disabled button with a clear tooltip does not leak data or perform any unsafe action. No security rework required.

### 3.2 UNC path hardcoded in App.tsx

`formatPackagePathForDisplay()` at line 8560 hardcodes `\\\\wsl.localhost\\Ubuntu-Compact` as a UNC prefix for Windows path display. This is Alan's personal WSL distro name and is necessary for the Windows operator to locate the package. It is not a credential, secret, or ServiceNow identifier. However, future work should consider making this configurable or deriving it from the environment.

### 3.3 Scope expansion beyond BC3

The working-tree changes extend far beyond BC1's planned BC3 scope (~30 lines). The actual diff includes:
- 8 new IPC handlers (~500 lines)
- Full worktree acceptance UI card
- Repo hygiene scan/cleanup features
- Runtime evidence panel
- New state management and tests

This scope expansion was absorbed into the AG-phase work. While this is a process concern (not security), it means BC3 was never committed as a standalone change.

### 3.4 Runbook references ay6, not bc6

The BC1 spec planned to update the runbook to reference `bc6` after BC6 package rebuild. The current runbook references `ay6`. This is because BC6 (package rebuild) has not yet occurred. The runbook accurately reflects the current package state.

---

## 4. Safety Boundary Verification

| Boundary | Status |
|----------|--------|
| No real ServiceNow login, browsing, or API writes | ✅ Confirmed |
| No Save / Submit / Update / Resolve / Close | ✅ Confirmed |
| No attachment upload | ✅ Confirmed |
| No Microsoft Graph / Excel Web writes | ✅ Confirmed |
| No screenshots, HAR, trace, cookies, storage-state, secrets | ✅ Confirmed |
| No raw URLs, ticket IDs, sys_ids, requester names, assignment groups | ✅ Confirmed |
| No push, PR, merge, tag, GitHub Release, publish | ✅ Not in scope of this code |
| No new IPC handlers beyond existing patterns | ✅ 8 new handlers, all follow existing patterns |

---

## 5. Required Rework

**None.** No blocking security or privacy issues found.

---

## 6. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| UNC path hardcoded in `formatPackagePathForDisplay` | LOW | Personal WSL path, not a secret; future configurable path preferred |
| `handleWorktreeGitDiff` could leak home path if HOME is not passed | LOW | `main.ts` passes `process.env.HOME` correctly |
| `handleWorktreeStatus` could expose sensitive filenames | LOW | Only project-working-tree filenames; no credential files in tree |

---

## 7. Status

```
Phase BC5 — Privacy/Security Audit — Checklist Launcher and Runbook

State: COMPLETE
Verdict: APPROVE WITH CONDITIONS (no blocking issues)
Gates: privacy:scan PASS (288 files)
Files audited: 9 changed/new files
ServiceNow data leaked: NONE
Credentials leaked: NONE
Blocking issues: NONE
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
