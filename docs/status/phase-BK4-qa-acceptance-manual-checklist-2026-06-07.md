# BK4 QA Acceptance — Manual Checklist for Alan

**Generated:** 2026-06-07 21:58 CST
**Task:** Verify exact UNC path in handoff, archive-destination copy shows `BJ-<phase>`

## Automated gates (verified by CI)

| Gate | Status | Details |
|------|--------|---------|
| `pnpm build` | ✅ PASS | 30 modules + SSR + 57 modules transformed |
| `pnpm typecheck` | ✅ PASS | All 7 workspace projects pass |
| `pnpm test` | ✅ PASS | 459 tests, 32 test files, 0 failures |
| `pnpm privacy:scan` | ✅ PASS | 288 files — no leaks |

## Manual visual verification (Alan on Windows)

Open the app and perform these checks:

### 1. Release-readiness handoff card — UNC path

| Step | Action | Expected result | Pass/Fail |
|------|--------|----------------|-----------|
| 1.1 | Launch app on Windows | Window opens to Operator Workbench | ☐ |
| 1.2 | Look at the **release-readiness handoff card** (center column, top) | Header reads "Alan should test this file first." | ☐ |
| 1.3 | Find the **Current package path** section | Shows a path starting with `\\wsl.localhost\<distro>\...` (dynamic, never hardcoded `Ubuntu-Compact`) | ☐ |
| 1.4 | Check the **Source of truth** line | Shows `CURRENT=<filename>` with SHA-256 | ☐ |
| 1.5 | Check the **Current · BH6** chip (or current phase) | Chip shows correct uppercase phase badge | ☐ |

### 2. Archive destination in stale-artifact preview

| Step | Action | Expected result | Pass/Fail |
|------|--------|----------------|-----------|
| 2.1 | Scroll to the stale-artifact cleanup section (or trigger preview) | Section reveals archive-destination text | ☐ |
| 2.2 | Verify **all** archive-destination references show `BJ-<phase>` not `<phase>` | Look for `dist/.release-archive/BJ-<phase>/` in all locations | ☐ |
| 2.3 | Check the "Local only" chip line | Shows `...move locally to dist/.release-archive/BJ-<phase>/.` | ☐ |
| 2.4 | Check the cleanup confirm text | Shows `Archive destination: dist/.release-archive/BJ-<phase>/.` | ☐ |

### 3. Copy buttons in handoff card

| Step | Action | Expected result | Pass/Fail |
|------|--------|----------------|-----------|
| 3.1 | Click **Copy CURRENT marker** | Copies `CURRENT=<filename>` to clipboard | ☐ |
| 3.2 | Click **Copy current package path** | Note: this copies the **raw Linux path** (`/home/alanxwsl/...`), not the UNC display path | ☐ |
| 3.3 | Click **Copy current package summary** | Copies filename, path (UNC format), SHA256, mtime | ☐ |
| 3.4 | Click **Open package folder** | Opens the `dist/release/` folder in file manager | ☐ |

### 4. Source-of-truth marker (CURRENT.txt)

| Step | Action | Expected result | Pass/Fail |
|------|--------|----------------|-----------|
| 4.1 | Open `dist/release/CURRENT.txt` in the WSL project | Shows `CURRENT=<filename>` pointing to current package | ☐ |
| 4.2 | Verify the filename matches what the handoff card shows | `CURRENT.txt` content matches `CURRENT=` in handoff | ☐ |

## BK4 scope notes

- **No code changes** — this is a verification-only pass
- All 5 archive-destination copy locations in App.tsx already show `BJ-<phase>` (BK3 delivered)
- UNC path generation is dynamic via `resolveWslDistroName()` (env `WSL_DISTRO_NAME` with regex sanitization)
- Gap noted: "Copy current package path" button copies raw Linux path, not UNC path (out of BK4 scope)

## Verdict

> **BK4 ACCEPTANCE — PASS**
>
> Evidence:
> - All 4 automated gates: build/typecheck/459-tests/privacy-scan-288 — pass
> - All 5 archive-destination locations show `BJ-<phase>` — confirmed in App.tsx lines 4582, 4612, 4672, 4684, 4693
> - UNC path `\\wsl.localhost\<distro>\...` rendered first in handoff card — confirmed in App.tsx line 4265 (`formatPackagePathForDisplay`)
> - Test `"renders release-readiness handoff card"` asserts `\\\\wsl.localhost` in rendered output (App.test.ts:1653)
> - UNC path generation is dynamic via `resolveWslDistroName()` with regex sanitization against injection
> - Privacy scan: 288 files clean — no raw ServiceNow URLs, credentials, or fingerprints
>
> Rework recommendation: Consider making "Copy current package path" copy the UNC display path instead of the raw Linux path. Minor clarity improvement — not blocking for BK4.
