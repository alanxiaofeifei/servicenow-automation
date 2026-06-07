# Phase AD6 — Windows local package refresh after AD polish

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD commit:** `b958eb6` (Phase AD4: QA acceptance)

## Artifact

| Property | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip` |
| Size | 118,588,779 bytes (~113 MB) |
| mtime | 2026-06-07 01:32 CST |
| SHA256 | `7f5ca5a7e61a2112adfbbe5eb81226c93b3abca55d9db02da0f54e81cb344006` |

## Paths

**Linux (WSL):**
```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip
```

**Windows UNC (from File Explorer / cmd.exe):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip
```

## What AD changed (runtime/UI)

AD3 (a3143a0) and AD4 (b958eb6) modified 3 runtime files:
- `apps/desktop/src/App.tsx` — CDP readiness chip + center empty/loading/error states
- `apps/desktop/src/styles.css` — new styles for the above
- `apps/desktop/src/App.test.ts` — 78 new test lines for AD3/AD4 behavior

## What to open first

1. Copy the zip from the UNC path above to a Windows folder (e.g. Desktop).
2. Extract the zip.
3. Open the extracted **START-HERE-WINDOWS.txt** file and read the safety instructions.
4. Double-click `ServiceNow Automation.exe` in the extracted folder.
5. The app should open a visible operator window with the three-column layout.
6. Key new UI elements to explore: CDP readiness status chip in the center panel, empty/loading/error state placeholders.
7. Do NOT perform any real ServiceNow login, browser automation, or field interaction.

## Comparison with AC package

The AC package (`servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip`, SHA256 `ea94272dd...`) was built from commit 77475d8. This AD package is a **fresh build** from HEAD b958eb6, which includes AD3 runtime/UI changes. SHA256 differs, confirming a fresh binary.

## Gates

| Gate | Result |
|---|---|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (389/389 tests) |
| `pnpm privacy:scan` | PASS (263 files) |

## Build provenance

- Built via `scripts/packaging/build-windows-rc.sh` from current HEAD
- `SDA_RELEASE_VERSION=v0.1.0-rc.1-ad-20260607-local` for dated naming
- `pnpm install --frozen-lockfile` + `pnpm --filter @servicenow-automation/desktop package:windows`
- Electron Builder 26.8.1, win32 x64, Electron 35.7.5
- Archive verified (86 entries): contains `resources/app.asar`, CDP bridge scripts, START-HERE safety notice
- Safety sentence confirmed: "No Save / Submit / Update / Resolve / Close automation"
- Checksum verified: `sha256sum -c` PASS

## Verification commands run

```bash
# Build
SDA_RELEASE_VERSION=v0.1.0-rc.1-ad-20260607-local bash scripts/packaging/build-windows-rc.sh

# Verify checksum
sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ad-20260607-local.zip.sha256
# → OK

# Archive contents verified:
# - resources/app.asar                        ✓
# - resources/scripts/...cdp.ps1              ✓
# - resources/scripts/...bridge.py            ✓
# - START-HERE-WINDOWS.txt                    ✓
# - Safety sentence: "No Save / Submit / Update / Resolve / Close automation" ✓
```
