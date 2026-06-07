# Phase BL3D — Rebuild package with exact sidecar UNC display path

**Date:** 2026-06-07
**Worker:** sna-windows-runtime (task t_f9f3bc8c)
**Parent:** t_f56e3aea (BL2D — sidecar exact Windows UNC display path)
**SPDX-License-Identifier:** BSD-3-Clause (see LICENSE.md for terms)

## Summary

Rebuilt a fresh BL3D Windows local package incorporating the BL2D sidecar exact
Windows UNC display path fix. The package and sidecar use the exact Windows UNC
path from `wslpath -w`, with distro `Ubuntu-Compact` on this machine. The outer
`release-metadata.json` is self-consistent. All 4 gates pass.

## Package identity

| Field | Value |
|---|---|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip` |
| **SHA256** | `399f5f4574924ca8b61c9a50fcbd002da563c8959a0231f99baeefa7cae5de82` |
| **Size** | 118,609,753 bytes |
| **mtime** | 1780844096 (2026-06-07 22:54:56 CST) |
| **UNC path** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip` |
| **Phase** | BL3D |
| **Source** | packaged-metadata |

## Companion files

| File | Path |
|---|---|
| START-HERE | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local-START-HERE-WINDOWS.txt` |
| SHA256 sidecar | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip.sha256` |
| CURRENT.txt | `dist/release/CURRENT.txt` — updated to `bl3d` |
| Outer release-metadata.json | `dist/release/release-metadata.json` — regenerated for BL3D |

## Sidecar verification

### Outer sidecar (`dist/release/release-metadata.json`)

```json
{
  "version": 1,
  "filename": "servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip",
  "sha256": "399f5f4574924ca8b61c9a50fcbd002da563c8959a0231f99baeefa7cae5de82",
  "size": 118609753,
  "mtime": 1780844096,
  "linuxPath": "/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip",
  "windowsUncPath": "\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local.zip",
  "phase": "BL3D",
  "source": "packaged-metadata"
}
```

- JSON valid: **PASS** (Python `json.loads`)
- Phase: **BL3D**
- Source: **packaged-metadata**
- `windowsUncPath` matches `wslpath -w`: **PASS** (both `Ubuntu-Compact`)

### Inner sidecar (`resources/release-metadata.json` inside zip)

- JSON valid: **PASS**
- References the BL3C package (known sequencing issue — see Remaining risks)

### wslpath -w match

```
expected: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...\bl3d-...zip
metadata: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...\bl3d-...zip
MATCH: YES
```

## What's included

This package incorporates all fixes up to and including BL2D:

1. **BL2 fix** — current package loading regression (renderer always stores metadata state)
2. **BL2C fix** — packaged-mode release metadata sidecar fallback
3. **BL2D fix** — sidecar exact UNC display path using `wslpath -w` for `Ubuntu-Compact` distro name, with `displayPath` IPC plumbing and renderer rendering

## Gates

| Gate | Status | Details |
|---|---|---|
| `pnpm build` | **PASS** | All workspace projects build clean |
| `pnpm typecheck` | **PASS** | All 7 workspace packages typecheck clean |
| `pnpm test` | **PASS** | 473 tests (83+34+6+17+95+55+183) |
| `pnpm privacy:scan` | **PASS** | 297 files |
| SHA256 verification | **PASS** | `sha256sum -c` matches |
| unzip archive | **PASS** | No errors detected |
| `resources/app.asar` present | **PASS** | |
| `resources/release-metadata.json` inside | **PASS** | Valid JSON |
| START-HERE checksum/path not stale | **PASS** | bl3d filename, correct SHA256 |
| `wslpath -w` matches metadata `windowsUncPath` | **PASS** | `Ubuntu-Compact` |

## Archive contents (key paths)

```
resources/app.asar
resources/release-metadata.json
resources/scripts/windows/start-dedicated-chromium-cdp.ps1
resources/scripts/local-cdp-bridge.py
servicenow-automation-windows-v0.1.0-rc.1-bl3d-20260607-local-START-HERE-WINDOWS.txt
```

## Files changed

1. `dist/release/CURRENT.txt` — Updated to point to BL3D package
2. `dist/release/release-metadata.json` — Regenerated for BL3D package with correct `windowsUncPath`
3. `docs/status/phase-BL3D-windows-local-package-refresh-exact-path-2026-06-07.md` — This status document

## Remaining risks

- **Self-referencing SHA256:** The inner sidecar stores the SHA256 of the previous
  (BL3C) zip. The outer `.sha256` file and outer `release-metadata.json` are the
  authoritative references for the BL3D package.
- **Packaging sequencing:** `build-windows-rc.sh` → `package:windows` generates the
  sidecar from `CURRENT.txt` before placing the new zip, so the inner sidecar
  always references the previous artifact. Fix deferred.
- **Manual Windows acceptance:** The packaged build needs to be tested on a clean
  Windows machine to confirm the `displayPath` renders correctly (showing
  `\\wsl.localhost\Ubuntu-Compact\...` instead of generic `\\wsl.localhost\WSL\...`).

## Safety

- No real ServiceNow URLs, credentials, cookies, sessions, or ticket data exposed.
- No real ServiceNow browser operations performed.
- No GitHub push, PR, merge, tag, or release.
- No Microsoft Graph / Excel Web writes.
- All paths in this document and the sidecar are local filesystem paths only.
