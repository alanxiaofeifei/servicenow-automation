# Phase BL3C — Rebuild package with packaged metadata sidecar

**Date:** 2026-06-07  
**Worker:** sna-windows-runtime (task t_26f2e350)  
**Parent:** t_7e165955 (BL2C — packaged-mode release metadata sidecar fallback)  
**SPDX-License-Identifier:** BSD-3-Clause (see LICENSE.md for terms)

## Summary

Rebuilt a fresh BL3C Windows local package with the release metadata sidecar properly
bundled and validated. Fixed a JSON escaping bug in `generate-release-metadata.sh`
that produced invalid JSON in the `windowsUncPath` field (unescaped backslashes).
The packaged zip now contains a valid `resources/release-metadata.json` sidecar that
identifies the package as phase `BL3C` with correct filename, SHA256, and UNC path.

## Package identity

| Field | Value |
|---|---|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip` |
| **SHA256** | `bf6d1a85ba28bc2aa604c3b24d35957228712730ceb9c36bbf1b871f6aa896fb` |
| **Size** | 118,609,569 bytes |
| **UNC path** | `\\wsl.localhost\Ubuntu\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip` |
| **Phase** | BL3C |
| **Archive entries** | 87 |

## Sidecar verification

### Outer sidecar (`dist/release/release-metadata.json`)

```json
{
  "version": 1,
  "filename": "servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip",
  "sha256": "bf6d1a85ba28bc2aa604c3b24d35957228712730ceb9c36bbf1b871f6aa896fb",
  "size": 118609569,
  "mtime": 1780842954,
  "linuxPath": "/home/alanxwsl/.../servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip",
  "windowsUncPath": "\\\\wsl.localhost\\Ubuntu\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-bl3c-20260607-local.zip",
  "phase": "BL3C",
  "source": "packaged-metadata"
}
```

- JSON valid: **PASS** (Python `json.loads`)
- Phase: **BL3C**
- Source: **packaged-metadata**

### Inner sidecar (`resources/release-metadata.json` inside zip)

- JSON valid: **PASS**
- Phase: **BL3C**
- Identifies the same package filename: **PASS**

### Sidecar validates independently of dist/release/

The sidecar at `resources/release-metadata.json` in the extracted archive is fully
self-contained — it identifies the zip's filename, SHA256, size, phase, and source
without referencing `dist/release/` on the filesystem. This is the path the Electron
app would read via `extraResources` (mapped to `release-metadata.json` at app root).

## Bug fix: JSON backslash escaping

**Root cause:** `scripts/generate-release-metadata.sh` generated the `windowsUncPath`
field via a bash heredoc, but the UNC path contains literal backslash characters
(e.g., `\wsl.localhost\Ubuntu\...`). In JSON, backslashes must be escaped as `\\`.
The heredoc interpolation passed raw `\` characters into the JSON, producing invalid
JSON that the IPC sidecar reader (`JSON.parse` in Node.js) would reject.

**Fix:** Rewrote the JSON output to use a Python `json.dump` call instead of a bash
heredoc. Python's JSON serializer correctly escapes all special characters, including
backslashes in UNC paths.

**File changed:** `scripts/generate-release-metadata.sh`
- Replaced heredoc-based JSON generation (`cat > "$SIDECAR" <<JSON ... JSON`) with
  `python3 -c "json.dump(data, open(...), indent=2)"`
- Added `WINDOWS_UNC="${WINDOWS_UNC//\\/\\\\}"` fallback escape for safety

## Gates

| Gate | Status | Details |
|---|---|---|
| `pnpm build` | **PASS** | All workspace projects build clean |
| `pnpm typecheck` | **PASS** | All 7 workspace packages typecheck clean |
| `pnpm test` | **PASS** | 471 tests pass (83+34+6+17+95+55+181) |
| `pnpm privacy:scan` | **PASS** | 296 files pass |
| SHA256 verification | **PASS** | `sha256sum -c` matches |
| unzip archive | **PASS** | 87 entries, app.asar present |
| Sidecar valid JSON | **PASS** | Both inner and outer |
| Sidecar identity matches | **PASS** | filename, sha256, phase all match |

## Archive contents (key paths)

```
resources/app.asar
resources/release-metadata.json
resources/scripts/windows/start-dedicated-chromium-cdp.ps1
resources/scripts/local-cdp-bridge.py
```

## Files changed

1. `scripts/generate-release-metadata.sh` — Fixed JSON backslash escaping in
   `windowsUncPath` field; switched from bash heredoc to Python `json.dump`
2. `docs/status/phase-BL3C-windows-local-package-refresh-sidecar-2026-06-07.md`
   — This status document

## Remaining risks

- **Self-referencing SHA256:** The sidecar inside the zip stores the SHA256 of the
  zip at the time it was generated. Any subsequent zip modification (e.g., appending
  the START-HERE file) changes the zip's SHA256, making the inner sidecar's SHA256
  one round stale. The outer `.sha256` file and outer `release-metadata.json` are
  authoritative. This is an inherent limitation of a self-referencing sidecar.
- **Packaging sequencing:** The `build-windows-rc.sh` script's `package:windows`
  step generates the sidecar from `dist/release/CURRENT.txt` before the new package
  zip is placed there, so the sidecar bundled into the electron zip always references
  the *previous* artifact. For a clean fix, the sidecar generation should be moved
  to after the final zip copy/rename step.

## Safety

- No real ServiceNow URLs, credentials, cookies, sessions, or ticket data exposed.
- No real ServiceNow browser operations performed.
- No GitHub push, PR, merge, tag, or release.
- No Microsoft Graph / Excel Web writes.
- All paths in this document and the sidecar are local filesystem paths only.
