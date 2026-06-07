# Phase AX6 — Windows Local Package Refresh

**Date:** 2026-06-07
**Phase:** AX6 — repo-hygiene disabled reason specificity
**Worker:** sna-windows-runtime

## Parent dependencies

| Task | Status | Verdict |
|------|--------|---------|
| AX4 QA acceptance (t_26224731) | PASS | 8/8 checks pass, 4 gates pass |
| AX5 privacy/security (t_633e6f11) | PASS | APPROVE — no blocking issues |

## Build command

```bash
SDA_RELEASE_VERSION=v0.1.0-rc.1-ax6-20260607-local \
  bash scripts/packaging/build-windows-rc.sh
```

## Package artifact

| Property | Value |
|----------|-------|
| **Filename** | `servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip` |
| **Full path** | `/home/alanxwsl/projects/servicenow-automation/dist/release/servicenow-automation-windows-v0.1.0-rc.1-ax6-20260607-local.zip` |
| **Size** | 118,603,008 bytes (~113.1 MB) |
| **SHA256** | `c7b40148acfdfed056d758f0a3589364385978645bfcc674881fe5455da9d6f1` |
| **mtime (epoch)** | 1780817088 |
| **mtime (UTC)** | 2026-06-07 07:24:48 UTC |
| **mtime (local)** | 2026-06-07 15:24:48 (Asia/Shanghai) |

## Archive verification

Build script's `verify_archive_listing` passed — confirmed:
- `resources/app.asar` present (packaged Electron app)
- `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` present (Windows CDP helper)
- `resources/scripts/local-cdp-bridge.py` present (local CDP bridge)
- No forbidden directories or sensitive artifacts leaked into archive

## Newest in dist/release/

Yes — the AX6 package (15:24) is the newest artifact, superseding:
- AW5 (15:00)
- AV6 (14:39)
- AU6 (14:14)
- AT6 (13:45)
- AS6 (13:06)

## Changes since AW5

This package incorporates the AX3 disabled-reason specificity implementation:
- Per-button disabled reasons in the archive-remediation workflow (Export, Copy, Cleanup preview, Archive stale artifacts)
- Green success message for operational buttons
- Approved by AX4 QA + AX5 privacy/security audit
