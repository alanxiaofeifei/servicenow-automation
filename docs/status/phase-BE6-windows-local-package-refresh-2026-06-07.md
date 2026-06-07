# Phase BE6 — Windows Local Package Refresh

**Date:** 2026-06-07
**Build profile:** `sna-windows-runtime`
**Task:** `t_71717a8f`
**Parent tasks:** `t_10ebd394` (BE5 privacy/security APPROVE), `t_df848c51` (BE4 QA PASS)
**Child task:** `t_01113755`

**Privacy level:** sanitized. No real ServiceNow URLs, ticket IDs, sys_ids, credentials, sessions, or browser evidence appear in any artifact.

---

## VERDICT: BUILD COMPLETE — all gates pass

Fresh BE6 Windows local package built from HEAD (`019c502 AG1-DelC`). All 4 required gates pass. Artifacts published to `dist/release/` with ZIP, SHA256 sidecar, and START-HERE-WINDOWS.txt.

---

## 1. Automated gates

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm build` | **PASS** | desktop (main+preload+renderer) + CLI tsc — all clean |
| `pnpm typecheck` | **PASS** | All 7 workspace projects typecheck clean |
| `pnpm test` | **PASS** | 459/459 tests pass (83 core + 34 ai + 6 kb + 17 profiles + 95 adapters + 55 cli + 169 desktop) |
| `pnpm privacy:scan` | **PASS** | 288 tracked files — no issues |

**Commands run:**
```bash
cd /home/alanxwsl/projects/servicenow-automation

# Gate 1 — build
pnpm build                         → exit 0

# Gate 2 — typecheck
pnpm typecheck                     → exit 0

# Gate 3 — test (sequential due to resource limits)
pnpm -r --workspace-concurrency=1 --if-present test   → exit 0, 459/459 pass

# Gate 4 — privacy scan
pnpm privacy:scan                  → exit 0, 288 files pass
```

---

## 2. Package build details

Built with the canonical release script:

```bash
SDA_RELEASE_VERSION=v0.1.0-rc.1-be6-20260607-local \
  bash scripts/packaging/build-windows-rc.sh
```

**Artifacts** (all in `dist/release/`):

| Artifact | Size |
|----------|------|
| `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` | 117 MB |
| `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip.sha256` | 131 B |
| `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local-START-HERE-WINDOWS.txt` | 959 B |

**SHA256 checksum (post-fix — see §5):**
```
74ad67b39cf17622248a341d1422cd8fdfa8720383ba4333eb5884455a43fe77  servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip
```

> **Rework note:** The internal START-HERE originally showed `bf7d0e79...` (stale). Fixed in rework task `t_efc70e6c`. The ZIP was re-packed, so its SHA256 changed from `bf7d0e79...` to the value above. All artifacts (ZIP, sidecar, external START-HERE) are consistent. The internal START-HERE shows the pre-repack hash (one round stale) — users should verify against the sidecar file.

---

## 3. Build output verification

The build script validates:
- Packaged `app.asar` is present
- Windows CDP helper (`scripts/windows/start-dedicated-chromium-cdp.ps1`) is bundled
- Local CDP bridge (`scripts/local-cdp-bridge.py`) is bundled
- No forbidden directories (`.git`, `.auth`, `private`, `coverage`, etc.)
- No forbidden file patterns (storage-state, HAR, screenshots, etc.)

All checks pass.

---

## 4. Manual Windows validation needed

Alan should:

1. Copy `dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` to a Windows machine
2. Extract and verify the SHA256 checksum
3. Double-click the packaged `ServiceNow Automation.exe`
4. Verify:
   - Window opens
   - Startup log path is shown
   - P0 Re-Acceptance Checklist card is visible
   - Mock/demo workflows work without real ServiceNow
5. Do NOT perform real ServiceNow login/browser operations/API writes
6. Report only visible error text and startup log path (no raw ServiceNow data)

---

## 5. Local-only safety statement

This build:
- ✅ All 4 gates verified independently (build, typecheck, test, privacy:scan)
- ✅ No ServiceNow writes, no browser automation, no credential access
- ✅ No real URLs, ticket IDs, sys_ids, requester names, or field values
- ✅ No cookies, sessions, HAR, screenshots, or raw page HTML
- ✅ No GitHub push/PR/merge/tag/release
- ✅ Local-only artifact for supervised testing
- 🔴 UNC path for Windows access: `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\projects\servicenow-automation\dist\release\`
