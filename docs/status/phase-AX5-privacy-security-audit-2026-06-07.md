# Phase AX5 — Privacy/Security Audit: Repo-Hygiene Disabled Reason Specificity

**Date:** 2026-06-07
**Task:** t_633e6f11
**Profile:** sna-privacy-security
**Verdict:** APPROVE — no blocking issues

## Scope

Per-button disabled reason strings added to the repo-hygiene action buttons (Export, Copy, Cleanup preview, Archive) in `apps/desktop/src/App.tsx`. Implementation by AX3 (t_046e3281).

## Evidence Reviewed

### 1. Code Review — Disabled Reason Strings (App.tsx lines 4420–4461)

All eight disabled reason strings are **static English text** with no dynamic interpolation:

| Button | Condition | String |
|--------|-----------|--------|
| Export | `!hygieneScanResult` | "Scan first to generate a status report." |
| Copy | `!hygieneScanResult` | "Scan first before copying item summaries." |
| Cleanup preview | `!hygieneScanResult` | "Scan first to preview cleanup." |
| Cleanup preview | `cleanupArchiveDone` | "Cleanup already applied for this batch." |
| Archive | `!cleanupPreviewResult && !cleanupArchiveInProgress && !cleanupArchiveDone` | "Generate preview first before archiving." |
| Archive | `cleanupPreviewResult && !cleanupPreviewOpen && !cleanupArchiveInProgress && !cleanupArchiveDone` | "Open the cleanup preview to enable archiving." |
| Archive | `cleanupArchiveInProgress && !cleanupArchiveDone` | "Archiving stale artifacts…" |
| Archive | `cleanupArchiveDone` | "Archive already complete." |

Green success message (line 4460): "Archive complete. The selected item moved to the local archive area."

### 2. IPC / Electron API Surface

Zero matches for `ipcMain`, `ipcRenderer`, `contextBridge`, `shell.openExternal`, `BrowserWindow`, or `webContents` in `apps/desktop/src/App.tsx`. No new IPC channels or Electron API usage introduced.

### 3. State Variables

All conditional rendering uses **existing** state variables only:
- `hygieneScanResult`
- `cleanupPreviewResult`
- `cleanupPreviewOpen`
- `cleanupArchiveInProgress`
- `cleanupArchiveDone`

No new state variables, selectors, or derived state introduced. UI-presentation only.

### 4. ServiceNow Data Exposure

None of the disabled reason strings contain:
- Raw ServiceNow URLs or hosts
- sys_ids
- Credentials or tokens
- Session data or cookies
- Ticket numbers
- Customer names or emails

### 5. Gate Results (Independent Verification)

All gates run fresh from the session — not relying on parent's claims:

| Gate | Result | Details |
|------|--------|---------|
| `pnpm build` | Not run | Build is not a privacy gate; parent confirmed pass |
| `pnpm typecheck` | PASS | All 7 workspace projects |
| `pnpm test` | PASS | 453 tests (83 core + 34 ai + 6 kb + 17 profiles + 95 adapters + 55 cli + 163 desktop) |
| `pnpm privacy:scan` | PASS | 288 files, no leaks |

## Checklist

- [x] No new data exposure — disabled reasons are static strings, not dynamic content
- [x] No new IPC channels or Electron API usage
- [x] No raw ServiceNow URLs, sys_ids, credentials, or session data in disabled reason strings
- [x] No new state variables — UI-presentation only
- [x] pnpm privacy:scan — PASS

## Non-Blocking Notes

- The disabled reason strings use the existing CSS class `worktree-accept-action-disabled-reason`, which is a pre-existing UI presentation pattern — no new styles or layout behavior.
- The green success message (line 4460) uses the existing class `hygiene-action-disabled-green`, consistent with pre-existing patterns.

## Verdict

**APPROVE.** The AX3 implementation adds only static UI presentation strings with no data exposure, no new IPC surface, no ServiceNow data leakage, and no new state. All privacy and security gates pass independently.
