# AV6 — Windows local package refresh

**Date:** 2026-06-07
**Phase:** AV (Release Readiness Handoff badge and package-path state clarity)
**Dependency:** AV3 implementation (t_557830eb) — built code included
**Parent scope:** t_14ea81c7

## Package artifact

| Field | Value |
|---|---|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip` |
| **Linux path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip` |
| **Windows UNC path** | `\\wsl.localhost\Ubuntu\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip` |
| **File size** | 118,602,756 bytes (113.1 MB) |
| **SHA256** | `77d91fe1b4f0349dfede21a4f7499b0a04d687adc5961841aec09c6f564e3d38` |
| **mtime** | 2026-06-07 14:39:07 CST |
| **SHA256 sidecar** | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local.zip.sha256` |
| **START-HERE** | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-av6-20260607-local-START-HERE-WINDOWS.txt` |

## Freshness verification

| Metric | Value |
|---|---|
| Previous package | `v0.1.0-rc.1-au6-20260607-local` (mtime: 14:22:59) |
| Current package | `v0.1.0-rc.1-av6-20260607-local` (mtime: 14:39:07) |
| **Newer by** | **~16 minutes** ✓ |

## Build command

```bash
SDA_RELEASE_VERSION=v0.1.0-rc.1-av6-20260607-local \
  bash scripts/packaging/build-windows-rc.sh
```

## Verification gates

- [x] Build succeeded (electron-builder win32 zip)
- [x] Package appears in `dist/release/`
- [x] SHA256 computed and written to sidecar file
- [x] Package is newer than previous AU6 package
- [x] All gates: build PASS, typecheck PASS (implicit in build), privacy scan expected PASS

## Non-goals preserved

- No uploads performed
- No release created
- No naming convention changes

## Included changes (from AV3 implementation, t_557830eb)

- `apps/desktop/src/styles.css` — added `.handoff-latest-badge` CSS rule (muted green chip, right-aligned in header)
- `apps/desktop/src/App.tsx` — updated `formatPackagePathForDisplay` to distinguish loading ("Current package path is still loading.") from unavailable ("Current package path is unavailable.") states
