# Phase BL3E — Rebuild package with current inner sidecar identity

**Date:** 2026-06-07
**Worker:** sna-windows-runtime (task t_f9502978)
**Parent:** t_04bd8f10 (BL2E — fix packaged inner release metadata sequencing)
**SPDX-License-Identifier:** BSD-3-Clause (see LICENSE.md for terms)

## Summary

Rebuilt a fresh BL3E Windows local package. The inner sidecar (`resources/release-metadata.json`) now correctly identifies the BL3E package, not a stale previous identity — the BL2E sequencing fix ensures the inner sidecar is generated with the correct filename/phase/path before electron-builder runs. All 4 gates pass. The outer `dist/release/release-metadata.json` is regenerated post-build with the authoritative SHA256.

## Bug fix discovered: regex escape regression in `generate-release-metadata.sh`

During BL3E build, the `phase` field was empty in the generated sidecar. Investigation revealed that the regex pattern for extracting the phase from the filename had an escaped-backslash regression introduced during BL2E edits.

**Root cause:** The two regex patterns in `generate-release-metadata.sh` had double-escaped backslashes (`\\.`) when they should have single-escaped (`\.`). In bash `[[ =~ ]]`, `\\.` produces a literal backslash followed by a dot in the ERE, matching `\.` literally instead of a literal dot. This caused both patterns to fail silently, leaving `PHASE=""`.

**Fix:** Changed both regex patterns from `\\\\.` to `\\.` in the script. The `bl3` phase name in earlier phases (BL3C, BL3D) was also affected — their inner metadata would have had empty phase if the build had been done from this version. The BL2C-era script had correct single-backslash regexes.

**Verification:** After fix, `PHASE=BL3E` is correctly extracted from the filename.

## Package identity

| Field | Value |
|---|---|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip` |
| **SHA256** | `eef7bb4a25a18e48679449ed0586e645a2b3d4d72abca08e3e4b093c28ae06f1` |
| **Size** | 118,610,250 bytes |
| **mtime** | 1780844936 (2026-06-07 23:08:56 CST) |
| **UNC path** | `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip` |
| **Phase** | BL3E |
| **Source** | packaged-metadata |

## Companion files

| File | Path |
|---|---|
| START-HERE | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local-START-HERE-WINDOWS.txt` |
| SHA256 sidecar | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip.sha256` |
| CURRENT.txt | `dist/release/CURRENT.txt` — updated to `bl3e` |
| Outer release-metadata.json | `dist/release/release-metadata.json` — regenerated for BL3E with authoritative SHA256 |

## Sidecar verification

### Outer sidecar (`dist/release/release-metadata.json`)

```json
{
  "version": 1,
  "filename": "servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip",
  "sha256": "eef7bb4a25a18e48679449ed0586e645a2b3d4d72abca08e3e4b093c28ae06f1",
  "size": 118610250,
  "mtime": 1780844936,
  "linuxPath": "/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip",
  "windowsUncPath": "\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip",
  "phase": "BL3E",
  "source": "packaged-metadata"
}
```

- JSON valid: **PASS** (Python `json.loads`)
- Phase: **BL3E**
- Source: **packaged-metadata**
- SHA256: **eef7bb4a...** (matches `.zip.sha256` sidecar)
- `windowsUncPath` matches `wslpath -w`: **PASS** (both `Ubuntu-Compact`)

### Inner sidecar (`resources/release-metadata.json` inside zip)

```json
{
  "version": 1,
  "filename": "servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip",
  "sha256": "",
  "checksumScope": "external",
  "size": 0,
  "mtime": 0,
  "linuxPath": "/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip",
  "windowsUncPath": "\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local.zip",
  "phase": "BL3E",
  "source": "packaged-metadata"
}
```

- JSON valid: **PASS**
- Phase: **BL3E** (NOT stale BL3C/BL3D)
- `checksumScope`: **external** (authoritative SHA256 in outer metadata)
- `sha256`: **""** (empty — correct for pre-build sidecar)
- Filename references `bl3e`: **PASS**

### `wslpath -w` match

```
expected: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...\bl3e-...zip
metadata: \\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...\bl3e-...zip
MATCH: YES
```

## What's included

This package incorporates all fixes up to and including BL2E:

1. **BL2 fix** — current package loading regression (renderer always stores metadata state)
2. **BL2C fix** — packaged-mode release metadata sidecar fallback
3. **BL2D fix** — sidecar exact UNC display path using `wslpath -w` for `Ubuntu-Compact` distro name
4. **BL2E fix** — inner release metadata sequencing (no zip existence requirement, `checksumScope: external`, correct phase)

## Gates

| Gate | Status | Details |
|---|---|---|
| `pnpm build` | **PASS** | All workspace projects build clean |
| `pnpm typecheck` | **PASS** | All 7 workspace packages typecheck clean |
| `pnpm test` | **PASS** | 473 tests (83+34+6+17+95+55+185) |
| `pnpm privacy:scan` | **PASS** | 299 files |
| SHA256 verification | **PASS** | `sha256sum -c` matches |
| unzip archive | **PASS** | No errors detected |
| `resources/app.asar` present | **PASS** | |
| `resources/release-metadata.json` inside | **PASS** | Valid JSON, phase=BL3E |
| Inner sidecar NOT stale | **PASS** | References BL3E, not BL3C/BL3D |
| START-HERE checksum/path not stale | **PASS** | bl3e filename, correct SHA256 |
| `wslpath -w` matches metadata `windowsUncPath` | **PASS** | `Ubuntu-Compact` |

## Archive contents (key paths)

```
resources/app.asar
resources/release-metadata.json
resources/scripts/windows/start-dedicated-chromium-cdp.ps1
resources/scripts/local-cdp-bridge.py
servicenow-automation-windows-v0.1.0-rc.1-bl3e-20260607-local-START-HERE-WINDOWS.txt
```

## Files changed

1. `scripts/generate-release-metadata.sh` — Fixed regex escaping bug in phase extraction (`\\.` → `\.` in bash `[[ =~ ]]` pattern, 2 lines)
2. `dist/release/CURRENT.txt` — Updated to point to BL3E package
3. `dist/release/release-metadata.json` — Regenerated for BL3E package with authoritative SHA256 (post-build)
4. `docs/status/phase-BL3E-windows-local-package-refresh-current-inner-sidecar-2026-06-07.md` — This status document

## Remaining risks

- **Packaging sequencing constraints persist:** The inner sidecar is intentionally generated before electron-builder. It has `checksumScope: "external"` for the SHA256, which is the correct architectural choice. The outer `.zip.sha256` and outer `release-metadata.json` are the authoritative checksum sources.
- **Manual Windows acceptance:** The packaged build needs to be tested on a clean Windows machine to confirm the app displays the correct BL3E identity and the `displayPath` renders correctly.

## Safety

- No real ServiceNow URLs, credentials, cookies, sessions, or ticket data exposed.
- No real ServiceNow browser operations performed.
- No GitHub push, PR, merge, tag, or release.
- No Microsoft Graph / Excel Web writes.
- All paths in this document and the sidecar are local filesystem paths only.
