# Phase AC0 — Current-HEAD local Windows test package

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**HEAD commit:** `77475d8`

## Artifact

| Property | Value |
|---|---|
| Filename | `servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip` |
| Size | 118,588,267 bytes (~113 MB) |
| mtime | 2026-06-07 01:04 CST |
| SHA256 | `ea94272dd1a399c04851c26867e50dfd533affeb08953de2895ea308ebd786f1` |

## Paths

**Linux (WSL):**
```
/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
```

**Windows UNC (from File Explorer / cmd.exe):**
```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip
```

## What to open first

1. Copy the zip from the UNC path above to a Windows folder (e.g. Desktop).
2. Extract the zip.
3. Open the extracted **START-HERE-WINDOWS.txt** file and read the safety instructions.
4. Double-click `ServiceNow Automation.exe` in the extracted folder.
5. The app should open a visible operator window with the three-column layout.
6. Do NOT perform any real ServiceNow login, browser automation, or field interaction.

## Comparison with canonical rc.1

The canonical `servicenow-automation-windows-v0.1.0-rc.1.zip` (built 2026-06-06 15:34) and this local-validation dated copy are **byte-for-byte identical** — this is simply a renamed copy of the same fresh build from current HEAD, with today's date in the filename for unambiguous identification.

## Build provenance

- Built via `scripts/packaging/build-windows-rc.sh` from current HEAD
- `pnpm install --frozen-lockfile` + `pnpm --filter @servicenow-automation/desktop package:windows`
- Electron Builder 26.8.1, win32 x64, Electron 35.7.5
- Archive verified: contains `resources/app.asar`, CDP bridge scripts, START-HERE safety notice
- Safety sentence confirmed: "No Save / Submit / Update / Resolve / Close automation"
- Checksum verified: `sha256sum -c` PASS

## Verification commands run

```bash
# Copy to dated name
cp servicenow-automation-windows-v0.1.0-rc.1.zip servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip

# Generate checksum
sha256sum servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip > servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256

# Verify
sha256sum -c servicenow-automation-windows-v0.1.0-rc.1-ab-20260607-local.zip.sha256
# → OK

# Archive contents verified:
# - resources/app.asar             ✓
# - resources/scripts/...cdp.ps1   ✓
# - resources/scripts/...bridge.py ✓
# - START-HERE-WINDOWS.txt         ✓
```
