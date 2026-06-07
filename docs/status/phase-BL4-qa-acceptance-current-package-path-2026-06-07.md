# Phase BL4 — QA Acceptance: Current Package Path Regression Fix

**Date:** 2026-06-07
**Worker:** @sna-qa-acceptance
**Parent task:** t_b3d394a1 (BL3 — Windows local package refresh with BL2 current-package loading fix)
**Phase:** BL4 — QA acceptance of the current-package path fix

---

## 1. Regression background

The user screenshot complaint shows the app displaying indefinite "still loading" for the current package identity, or a fallback that does not reflect the actual built package. BL2 introduced two fixes:

1. **IPC fix** (`worktree-ipc.ts:handleWorktreePackageMetadata`) — reads `dist/release/CURRENT.txt` first as source of truth before falling back to newest ZIP by mtime
2. **Renderer fix** (`App.tsx`) — always stores the metadata result (including `ok:false`), so the UI renders "Current package metadata is unavailable." instead of indefinite "still loading"

BL3 incorporated both fixes into a fresh Windows local package with `CURRENT.txt` set to `bl3`.

---

## 2. Automated gates

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm build` | PASS | "✓ built in 871ms" |
| `pnpm typecheck` | PASS | All 5 packages typecheck clean |
| `pnpm test` | PASS | 175 desktop tests + 55 CLI tests = 230 total, all pass |
| `pnpm privacy:scan` | PASS | 290 files tracked, all clean |

**Test coverage for current-package path:**
- `worktree-ipc.test.ts` — 44 tests including:
  - "uses the ZIP referenced by CURRENT.txt instead of newest by mtime" (line 460)
  - "returns error when CURRENT.txt references a missing ZIP" (line 488)
  - "returns error when CURRENT.txt is missing and no .zip files exist" (line 505)
  - "rejects path traversal in CURRENT= line" (line 516)
- `App.test.ts` — 102 tests including:
  - "renders workbench handoff card with package metadata" (line 1625) — verifies path, SHA256, filename, UNC prefix, CURRENT marker
  - "renders unavailable state when package metadata returns ok:false" (line 1682) — verifies "unavailable" text, disabled buttons, no "still loading"

---

## 3. CURRENT.txt verification

```
CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip
```

- **Location:** `dist/release/CURRENT.txt`
- **Referenced ZIP exists:** Yes — `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` (118,608,396 bytes)
- **Handler reads it:** Yes — `readCurrentTxt()` parses `CURRENT=...` line, validates no path traversal, returns filename
- **Source of truth:** When CURRENT.txt exists and ZIP is present → source="current-txt", handler returns full metadata

---

## 4. Acceptance checks

### 4.1 Handoff shows actual package path, not "Loading"

**Verdict: PASS** (dev mode)

- `handleWorktreePackageMetadata` returns `path: "/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip"`
- `formatPackagePathForDisplay` converts to UNC: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip`
- UI renders the path in `handoff-path-line`

### 4.2 Source of Truth no longer says CURRENT=N/A when CURRENT.txt exists

**Verdict: PASS** (dev mode)

- UI renders: `dist/release/CURRENT.txt → CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip`
- `filename` is populated, not N/A

### 4.3 Metadata summary loads or shows clear fallback within bounded state

**Verdict: PASS**

- **When metadata loads (dev mode):** Shows filename, SHA256, mtime, archival aliases
- **When metadata fails (packaged mode):** Shows "Current package metadata is unavailable." (not "still loading")
- **When metadata is still pending (null):** Shows "still loading" — this is correct for the brief async load window
- Tests confirm both ok:true and ok:false rendering paths

### 4.4 Manual checklist tells Alan exactly which file to test first

**Verdict: PASS** — See §5 below.

### 4.5 All gates pass

**Verdict: PASS** — See §2 above.

---

## 5. Manual checklist for Alan

### 5.1 Which file to test first

**Test this first:**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip
```
SHA256: `6258758a89f8d9602a913ce37eb8e80e7f2e689f8859c5b0a02a4839dd03c52d`

The **app.asar** inside this ZIP contains the BL2 fix for current-package path loading. The ZIP also ships with its own `START-HERE-WINDOWS.txt`.

### 5.2 Dev-mode validation (WSL terminal)

These steps verify the fix works from the source checkout, which is the reliable path:

| # | Step | Expected |
|---|------|----------|
| 1 | Run `cat dist/release/CURRENT.txt` | Shows `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` |
| 2 | Run `ls -la dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` | File exists (118M) |
| 3 | Start the app from source, navigate to the Release Readiness Handoff card in the center pane | Card shows "Alan should test this file first." heading |
| 4 | Check the **Source of truth** line | Shows: `dist/release/CURRENT.txt → CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` |
| 5 | Check the **Current package path** line | Shows a `\\wsl.localhost\Ubuntu-Compact\...` UNC path ending in the bl3 ZIP filename |
| 6 | Check the **Current package summary** section | Shows filename, SHA256 (6258758a...), mtime, and a "bl3" current-phase chip |
| 7 | Click **Copy CURRENT marker** | Clipboard gets `CURRENT=servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` |
| 8 | Click **Copy current package path** | Clipboard gets the UNC path |
| 9 | Click **Copy current package summary** | Clipboard gets structured summary with all fields |

### 5.3 Packaged-mode validation (Windows double-click)

| # | Step | Expected |
|---|------|----------|
| 10 | Copy the BL3 ZIP from UNC path to Windows Desktop and extract | Extract succeeds without WSL |
| 11 | Double-click `ServiceNow Automation.exe` | App window opens within 3-10s |
| 12 | Check the **Release Readiness Handoff** card in center pane | Card heading: "Alan should test this file first." |
| 13 | Check the **Source of truth** line | **Expected:** `CURRENT=N/A` (packaged mode — dist/release/ is not bundled in app resources; this is a known deferred issue) |
| 14 | Check the **Current package path** line | **Expected:** "Current package path is unavailable." (not "still loading") |
| 15 | Check the **Current package summary** section | **Expected:** "Current package metadata is unavailable." Not indefinite loading |

### 5.4 What passes and what is deferred

| Scenario | Current behavior | BL4 accept? | Notes |
|----------|-----------------|-------------|-------|
| Dev mode (source checkout), CURRENT.txt valid | Package path/filename/SHA shown, CURRENT=bl3 | **PASS** | Full fix works |
| Dev mode, CURRENT.txt missing | Falls back to newest ZIP by mtime, source="newest-zip-fallback" | **PASS** | Graceful fallback |
| Dev mode, no ZIPs at all | "no package found" error, source="unavailable" | **PASS** | Clean error |
| Packaged mode (Windows .exe) | "unavailable" message (not "still loading") | **CONDITIONAL PASS** | BL2 fix prevents indefinite loading. Showing actual path from packaged resources is deferred (BL3 status doc). |
| Packaged mode showing actual package identity | Not yet implemented | **DEFERRED** | Requires bundling dist/release/ metadata into app resources or a separate path-resolution approach |

---

## 6. What NOT to test

- Do NOT test against a real ServiceNow instance — all operations in this phase are local/mock only
- Do NOT attempt to Save/Submit/Update/Resolve/Close any ServiceNow record — the app has no such buttons
- Do NOT test the Chromium CDP flow — that is covered by a different phase (BL3 includes CDP helpers but CDP connectivity validation is part of the Windows clean-machine runbook)
- Do NOT test the packaged-mode current-package path resolution — that is deferred

---

## 7. Remaining risks

| Risk | Impact | Recommendation |
|------|--------|---------------|
| Packaged mode cannot show current package identity | User sees "unavailable" instead of the package path/filename | Deferred to a future phase — requires bundling dist/release/ metadata or changing `runtime-paths.ts` for packaged mode |
| WSL path conversion for Windows-native paths not tested end-to-end | UNC path derivation works in dev mode but hasn't been tested from the packaged Windows .exe | BL3 status doc lists this as a remaining risk |
| Manual Windows double-click validation still needed | No automated test can validate the packaged .exe on a clean Windows machine | BL3 status doc lists this — Alan must execute §5.3 above |

---

## 8. Safety/privacy status

- No real ServiceNow credentials, URLs, ticket IDs, or session data in build output
- `CURRENT.txt` contains only the phase marker `bl3` and a ZIP filename — no sensitive data
- `privacy:scan` passes with all 290 tracked files clean
- No push/merge/tag/release performed
- No real ServiceNow writes executed or attempted

---

## 9. Verdict

**BL4 QA ACCEPTANCE: CONDITIONAL PASS**

| Check | Result |
|-------|--------|
| Handoff shows actual package path, not Loading | PASS (dev mode) |
| Source of Truth no longer says CURRENT=N/A when CURRENT.txt exists | PASS |
| Metadata summary loads or shows clear fallback | PASS |
| Manual checklist tells Alan exactly which file to test first | PASS |
| All automated gates pass | PASS (build/typecheck/230-tests/privacy-290) |
| Packaged mode shows actual package identity | DEFERRED (shows "unavailable" instead of "still loading" — BL2 fix prevents regression but packaged path resolution needs separate work) |

**Alan should first test:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3-20260607-local.zip` (UNC path → §5.1)

**Files tested:** The ZIP contains `resources/app.asar` with the BL2 fix. After extraction, double-click `ServiceNow Automation.exe` and verify the Release Readiness Handoff card shows `CURRENT=N/A` with "unavailable" text (not indefinite loading).
