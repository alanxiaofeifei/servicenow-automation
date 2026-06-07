# Phase AY6 — Windows Local Package Refresh

**Date:** 2026-06-07
**Phase:** AY6 — stale AR3 test data update (currentAr3PackageMetadata → currentPackageMetadata)
**Worker:** sna-windows-runtime

## Windows UNC path (for Alan to test)

```
\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip
```

Copy the above UNC path into Windows File Explorer → navigate to `dist/release/` → extract the zip → double-click `ServiceNow Automation.exe`.

---

## Parent dependencies

| Task | Status | Verdict |
|------|--------|---------|
| AY4 QA acceptance (t_9998f3ae) | PASS | 6/6 acceptance criteria, 4 gates pass |
| AY5 privacy/security (t_38e00081) | PASS | APPROVE — no blocking issues |

## Build command

```bash
SDA_RELEASE_VERSION=v0.1.0-rc.1-ay6-20260607-local \
  bash scripts/packaging/build-windows-rc.sh
```

## Package artifact

| Property | Value |
|----------|-------|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` |
| **Full path (WSL)** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` |
| **Full path (Windows UNC)** | `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip` |
| **Size** | 118,603,008 bytes (~113.1 MB) |
| **SHA256** | `4dd85b722a986d6e06d646493918f22a6a45c982548704ca78afa7477e0d7598` |
| **mtime (local)** | 2026-06-07 15:54 (Asia/Shanghai) |
| **mtime (UTC)** | 2026-06-07 07:54 UTC |

## Checksum verification

```bash
$ sha256sum dist/release/servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip
4dd85b722a986d6e06d646493918f22a6a45c982548704ca78afa7477e0d7598  servicenow-automation-windows-v0.1.0-rc.1-ay6-20260607-local.zip
```

Checksum matches the published `.sha256` sidecar file.

## Archive verification

Build script's `verify_archive_listing` passed — confirmed:
- `resources/app.asar` present (packaged Electron app)
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` present (Windows CDP helper)
- `resources/scripts/local-cdp-bridge.py` present (local CDP bridge)
- No forbidden directories or sensitive artifacts leaked into archive

## Newest in dist/release/

Yes — the AY6 package (15:54) is the newest artifact, superseding:
- AX6 (15:26)
- AW5 (15:00)
- AV6 (14:39)
- AU6 (14:22)
- AT6 (13:45)
- AS6 (13:06)
- AR3 (12:08)
- AQ6 (09:06)

## Changes incorporated (AY3 scope)

This package incorporates the AY3 stale AR3 test data cleanup:
- **Variable rename:** `currentAr3PackageMetadata` → `currentPackageMetadata` (phase-generic name)
- **Test data update:** App.test.ts fixture values updated to current AY6 package (phase, path, sha256, size, mtime, filename)
- **Archival aliases:** Updated from `["AQ6", "AK"]` to `["AW5", "AV6", "AU6", "AT6", "AS6", "AR3", "AQ6"]` (full stale chain)
- **Test assertion:** Updated from `expect(output).toContain("AK")` to `expect(output).toContain("AR3")`
- **No production logic changed** — test fixture data only
- Approved by AY4 QA PASS + AY5 privacy/security APPROVE

## Gates (re-verified on build)

| Gate | Result |
|------|--------|
| `pnpm build` | ✅ PASS — desktop (30+56 modules) + CLI |
| `pnpm typecheck` | ✅ PASS — 7 workspace projects |
| `pnpm test` | ✅ PASS — 163 desktop + 55 CLI = **218 tests** |
| `pnpm privacy:scan` | ✅ PASS — 288 files, no violations |

## Safety and privacy

- All sanitized local-only. No real ServiceNow URLs, ticket IDs, sys_ids, credentials, or user data in any file.
- All paths use sanitized local file paths.
- No push, PR, merge, tag, or GitHub Release performed — local-only work during Alan's rest period.

---

*This document is local-only. No push, PR, merge, tag, or release was performed.*
