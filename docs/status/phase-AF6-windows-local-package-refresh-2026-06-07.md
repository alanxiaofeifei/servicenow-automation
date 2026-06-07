# Phase AF6 — Windows Local Package Refresh for Windows Operator Packaging/Runtime Readiness

**Date:** 2026-06-07
**Profile:** sna-windows-runtime
**Parent task:** t_49885a26
**HEAD:** `695ee03` (dirty — AF4 QA acceptance + AF5 privacy audit changes)

---

## 1. Verdict: PASS

All acceptance criteria satisfied, all four mandatory gates pass, fresh AF package built and verified distinct from older packages, START-HERE safety wording intact.

---

## 2. Mandatory Gates

| Gate | Result | Detail |
|------|--------|--------|
| `pnpm build` | **PASS** | electron-vite build clean, 28 SSR + 1 preload + 56 renderer modules |
| `pnpm typecheck` | **PASS** | All 7 workspace packages typecheck clean |
| `pnpm test` | **PASS** | 113/113 desktop tests, 403 total across all packages |
| `pnpm privacy:scan` | **PASS** | 273 files tracked, no privacy violations |

---

## 3. Package Metadata

| Property | Value |
|----------|-------|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip` |
| **SHA256** | `14ce20d64d89b796defb222389f5119e88cc56cd32567d41320eb1d32f7c2e79` |
| **mtime** | `2026-06-07 02:39:27 CST` |
| **Size** | 113 MB (118,592,457 bytes) |
| **Freshness** | **Newest local build** (02:39 CST) — supersedes `ae` (02:00 CST), `ad` (01:32 CST), `ab` (01:04 CST) |

Checksum file at `dist/release/servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip.sha256` confirms the match.

---

## 4. Acceptance Criteria Verification

### AC1: A fresh dated Windows zip exists locally and is distinct from older packages
**PASS.**
- Fresh `af` package built at 02:39 CST
- SHA256 `14ce20d6...` — distinct from `ae` SHA256 `4a9c7a38...` and `ad` SHA256 `7f5ca5a7...`
- File size similar to prior builds (113 MB) — expected for same Electron skeleton with updated app.asar

### AC2: The archive checksum passes and is recorded in the status doc
**PASS.**
- `sha256sum` produces `14ce20d64d89b796defb222389f5119e88cc56cd32567d41320eb1d32f7c2e79`
- Checksum file at `.zip.sha256` contains matching hash with correct filename reference
- Verified against live `sha256sum` run

### AC3: The START-HERE safety wording is verified and does not weaken the red-zone boundaries
**PASS.**
- Critical restriction: "No Save / Submit / Update / Resolve / Close automation."
- Full forbidden list includes all red-zone boundaries (automatic login, writes, screenshots, cookies, storage-state export, raw ServiceNow data)
- Quick test path is safe — mock/demo first, about:blank only, stop before real login
- Error reporting instructions direct user to copy only visible error text and log path, not raw ServiceNow data
- Full wording content verified by extracting from the zip

### AC4: The exact Windows UNC path Alan should test is included in the status doc
**PASS.**
- UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip`

### AC5: No publish / upload / release action occurs
**PASS.**
- Package is local-only — no upload, push, publish, or release to any remote
- No GitHub Release, PR, or tag created
- No ServiceNow write or browser automation performed

---

## 5. Archive Contents Verification

| Check | Result |
|-------|--------|
| `app.asar` present | ✅ |
| `start-dedicated-chromium-cdp.ps1` present | ✅ |
| `local-cdp-bridge.py` present | ✅ |
| `ServiceNow Automation.exe` present (via electron-builder) | ✅ |
| `servicenow-automation-windows-...-START-HERE-WINDOWS.txt` present | ✅ |
| No forbidden directories (`.git`, `.auth`, `coverage`, etc.) | ✅ |
| No forbidden files (`.har`, `.trace`, `.png`, `.cookies.json`, etc.) | ✅ |

---

## 6. Stale Artifacts

The following older artifacts are superseded by the new AF package:

| Package | mtime | Status |
|---------|-------|--------|
| `...-rc.1-ae-20260607-local.zip` | 2026-06-07 02:00 CST | **STALE** — superseded by AF (02:39 CST) |
| `...-rc.1-ad-20260607-local.zip` | 2026-06-07 01:32 CST | **STALE** — superseded by AF (02:39 CST) |
| `...-rc.1-ab-20260607-local.zip` | 2026-06-07 01:04 CST | **STALE** — superseded by AF (02:39 CST) |
| `...-rc.1.zip` | 2026-06-07 01:04 CST | **STALE** — superseded by AF (02:39 CST) |

All older packages remain in `dist/release/` but should not be used. The AF package (02:39 CST) is the current approved test artifact.

---

## 7. Remaining Risks

1. The dirty working tree (AF4/AF5 changes) means the built package reflects uncommitted modifications to `main.ts`, `App.tsx`, `styles.css`, and `App.test.ts`. This is expected for the AF phase — those changes are the runtime packaging being tested.
2. Binary-level validation requires manual Windows double-click launch; automated gates only verify build integrity and archive hygiene.
3. SHA256 changed from `4a9c7a38...` (AE) to `14ce20d6...` (AF) due to fresh electron-builder packaging run at a different timestamp, even though the underlying code is the same — this is expected (electron-builder embeds timestamps in the binary).

---

## 8. Alan Manual Windows Validation Path

To test this package on Windows:

1. Copy this UNC path: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-af-20260607-local.zip`
2. Open File Explorer → paste UNC path → Enter
3. Extract the zip → double-click `ServiceNow Automation.exe`
4. Follow START-HERE-WINDOWS.txt instructions
5. Verify app window opens, no ServiceNow data leaked
6. Report findings back

**Do not** perform real ServiceNow login or field interaction unless a separate checkpoint explicitly approves it.
