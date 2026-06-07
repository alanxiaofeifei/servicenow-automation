# Phase AK4 — QA Acceptance and Alan Manual Checklist for Validation-History Polish

**Date:** 2026-06-07
**Profile:** sna-qa-acceptance
**Parent task:** t_253386d6 (AK3 — validation-history summary polish)
**Kanban task:** t_51484ccd
**Branch:** `next/post-release-operator-cockpit-ab-20260606`

---

## 1. Verdict: PASS

All 4 mandatory automated gates pass. Code review confirms validation-history copy correctly reflects worktreeAccepted state across all 4 states (Pending/Pending+runs/Accepted/Accepted+runs). Manual checklist below is explicit, local-only, and safe for Alan to follow.

---

## 2. Mandatory Gates

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | **PASS** | electron-vite build clean, 30 SSR + 1 preload + 56 renderer modules |
| `pnpm typecheck` | **PASS** | All 7 workspace packages typecheck clean |
| `pnpm test` | **PASS** | 438 tests across all packages (148 desktop, 55 CLI, 95 adapters, 83 core, 34 AI, 6 KB, 17 profiles) |
| `pnpm privacy:scan` | **PASS** | 288 files tracked, no privacy violations |

---

## 3. Current Windows Package (AJ7)

| Property | Value |
|----------|-------|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip` |
| **SHA256** | `ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe` |
| **mtime** | `2026-06-07 05:16:34 CST` |
| **Size** | 118,601,041 bytes |
| **Freshness** | **Newest local build** (05:16 CST) — supersedes AJ (05:09 CST), AI6 (04:38 CST), AH (03:59 CST) |

The app's `handleWorktreePackageMetadata` function scans `dist/release/` for the newest `.zip` by mtime, so it dynamically resolves to AJ7 when the app launches. No hardcoded package references exist in the UI — the path is always the true newest package.

---

## 4. Validation-History Polish — Code Review

### 4.1 Changed files (AK3 parent)

**Scope:** ~15 lines of actual change in 2 files:
- `apps/desktop/src/App.tsx` — line 4316: dynamic copy based on `worktreeAccepted` state
- `apps/desktop/src/App.test.ts` — lines 1752-1756: test for accepted state copy

### 4.2 Validation-history copy (App.tsx lines 4312-4322)

```tsx
<strong>Last validation round</strong>
<p>{worktreeAccepted ? "Accepted locally. The checkpoint is confirmed." : "No prior acceptance recorded. The checkpoint remains unconfirmed."}</p>
{validationRunHistory.length > 0 && (
  <p className="worktree-accept-last-run">
    Last validation round: {validationRunHistory[validationRunHistory.length - 1].action} &mdash; {validationRunHistory[validationRunHistory.length - 1].status} at {validationRunHistory[validationRunHistory.length - 1].timestamp}. Sanitized summary: {validationRunHistory[validationRunHistory.length - 1].sanitizedSummary}
  </p>
)}
```

### 4.3 All 4 states covered

| worktreeAccepted | validationRunHistory | Displayed text |
|---|---|---|
| false | empty | "No prior acceptance recorded. The checkpoint remains unconfirmed." |
| false | non-empty | "No prior acceptance recorded..." + last-run detail line |
| true | empty | "Accepted locally. The checkpoint is confirmed." |
| true | non-empty | "Accepted locally..." + last-run detail line |

The heading **"Last validation round"** is consistent across all 4 states.

### 4.4 Privacy safety

- No raw ServiceNow URL, ticket ID, sys_id, or credential appears in the validation-history copy
- The `sanitizedSummary` field ensures no raw identifiers leak through the last-run detail line
- No ServiceNow write, login, or browser automation implied

### 4.5 Surgical check

- Only App.tsx line 4316 changed (ternary on worktreeAccepted instead of static text)
- Test added for accepted state (lines 1752-1756)
- No unrelated files touched, no reformatting, no refactoring
- Every changed line traces to the task goal

---

## 5. Safety and Privacy Verification

| Check | Result |
|-------|--------|
| No real ServiceNow login/browsing | ✅ — code change is purely local UI copy |
| No Save/Submit/Update/Resolve/Close | ✅ — no automation added |
| No raw ServiceNow URL or ticket ID | ✅ — all identifiers use sanitized descriptions |
| No credentials, cookies, sessions | ✅ — no storage or network interaction |
| No screenshots, HAR, trace | ✅ — none produced |
| Local-only UI change | ✅ — only App.tsx copy and App.test.ts coverage |

---

## 6. Remaining Risks

1. The validation-history last-run detail line's sanitizedSummary field depends on callers providing properly sanitized data upstream — if a caller passes unsanitized text into a validation run entry, it would render unredacted.
2. AJ7 supersedes AJ but no fresh AJ7 package-refresh doc exists in `docs/status/`. The current `phase-AJ6-windows-local-package-refresh-2026-06-07.md` documents AJ (05:09 CST), not AJ7 (05:16 CST). Alan should confirm AJ7 before double-click testing.
3. Manual Windows double-click launch validation is not covered by automated gates — the checklist below addresses this.

---

## 7. Alan's Manual Validation Checklist

### Prerequisites

- WSL Ubuntu running, servicenow-automation worktree checked out
- App built with `pnpm build` (verify this passes)

### Step 1: Copy the AJ7 package from WSL to Windows

1. Copy the following UNC path:
   ```
   \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip
   ```
2. Open File Explorer → paste UNC path → Enter
3. Copy the zip to a Windows folder (e.g. Desktop)
4. Verify the zip SHA256 before extracting:
   ```powershell
   Get-FileHash -Path "$env:USERPROFILE\Desktop\servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip" -Algorithm SHA256
   ```
   Expected: `ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe`

### Step 2: Extract and launch

1. Extract the zip
2. Double-click `ServiceNow Automation.exe`
3. **Expected:** App opens showing three-column operator workbench
4. **If it fails:** Follow `START-HERE-WINDOWS.txt` diagnostics (packaged inside the zip)

### Step 3: Verify validation-history copy

1. In the app, navigate to the **Worktree Acceptance Checkpoint** card (center/right area)
2. Locate the **Queue · State** column
3. Find the **Last validation round** queue item (4th item in the queue)
4. **Verify the copy:**
   - If no acceptance was recorded → Shows: `No prior acceptance recorded. The checkpoint remains unconfirmed.`
   - If runs exist → A last-run detail line appears beneath the text
5. **If you perform an acceptance action** (Mark reviewed → Accept):
   - The copy changes to: `Accepted locally. The checkpoint is confirmed.`

### Step 4: Verify package-path clarity

1. In the **Queue · State** column, verify queue items:
   - **Tracked changes still open** (Dirty/Accepted chip)
   - **Current local Windows package** (Fresh chip) — THIS is AJ7
   - **Archived local Windows package** (Archival only chip) — older packages
   - **Last validation round** (History chip)
2. Confirm the **Current local Windows package** code block shows the AJ7 UNC path
3. Click **Copy package path** — verify it copies the AJ7 UNC path to clipboard
4. Click **Open dist/release** — verify File Explorer opens the WSL `dist/release/` directory

### Step 5: Verify safety and privacy

- [ ] No ServiceNow URL, ticket ID, sys_id, or credential visible anywhere in the UI
- [ ] No Save/Submit/Update/Resolve/Close buttons visible
- [ ] The app title/states stay local-only
- [ ] No "login to ServiceNow" or "browse ServiceNow" actions in the UI
- [ ] The manual checklist says "Local only" and "No live ServiceNow action, upload, PR, merge, tag, or release is implied"

### Step 6: Report findings

- [ ] PASS — All above checks pass
- [ ] FAIL — Item(s) listed below:

| # | Check | Result | Note |
|---|-------|--------|------|
| 1 | App launches on double-click | PASS/FAIL | |
| 2 | Last validation round copy correct (pending) | PASS/FAIL | |
| 3 | Last validation round copy correct (accepted) | PASS/FAIL | |
| 4 | Queue shows Current/Archived/History items correctly | PASS/FAIL | |
| 5 | AJ7 UNC path visible in Current local Windows package card | PASS/FAIL | |
| 6 | Copy package path copies AJ7 UNC path | PASS/FAIL | |
| 7 | No ServiceNow identifiers or credentials visible | PASS/FAIL | |
| 8 | No Save/Submit/Update/Resolve/Close actions present | PASS/FAIL | |

---

## 8. Acceptance Criteria Verification

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| AC1 | Validation-history copy dynamically reflects worktreeAccepted state | **PASS** | App.tsx line 4316: ternary on worktreeAccepted |
| AC2 | "No prior acceptance recorded. The checkpoint remains unconfirmed." shown when not accepted | **PASS** | App.tsx line 4316, tested at App.test.ts line 1687 |
| AC3 | "Accepted locally. The checkpoint is confirmed." shown when accepted | **PASS** | App.tsx line 4316, tested at App.test.ts line 1754 |
| AC4 | Last-run detail line appears when validationRunHistory has entries | **PASS** | App.tsx lines 4317-4321 |
| AC5 | Heading is consistently "Last validation round" across all states | **PASS** | App.tsx line 4315 |
| AC6 | All 4 automated gates pass | **PASS** | Build, typecheck, 438 tests, privacy:scan 288 files |
| AC7 | AJ7 UNC path is captured and unambiguous in the checklist | **PASS** | Section 3 above |
| AC8 | Manual checklist is explicit, local-only, and safe for Alan | **PASS** | Section 7 above; no ServiceNow write, no raw identifiers |

---

## 9. Commands Run

```bash
# Build
pnpm build                                           # PASS

# Typecheck
pnpm typecheck                                       # PASS

# Tests
pnpm test                                            # PASS (438 tests)

# Privacy scan
pnpm privacy:scan                                    # PASS (288 files)

# AJ7 package verification
sha256sum dist/release/servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip
# → ce1b185083fa32a7913e0cdfaff1be83acd599f66a614a65ed313769cd742ffe

stat dist/release/servicenow-automation-windows-v0.1.0-rc.1-aj7-20260607-local.zip
# → 2026-06-07 05:16:34 CST (newest)
```

---

## 10. Suggested Next Task

- **AK5** — Replace static "AF/AG/AH" package-name references in the manual checklist with dynamic references (or update for AK6)
- **AK6** — Windows local package refresh: rebuild with latest dirty worktree state, producing the next AK-phase package
- Create or update the AJ7 package-refresh doc so the package state is properly documented
