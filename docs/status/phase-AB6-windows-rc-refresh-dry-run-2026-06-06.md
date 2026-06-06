# Phase AB6 — Windows RC refresh dry-run for AB polish

**Date:** 2026-06-06
**Owner:** sna-windows-runtime
**Branch:** `next/product-clarity-demo-polish-20260605`

## Verdict: REBUILT — all 4 gates pass, fresh binary with AB3 copy polish

---

## Rationale for rebuild

Phase AB3 (commit `5b96032`) changed 3 desktop source files — `App.tsx` (+113 lines), `App.test.ts`, and `styles.css` — to implement copy alignment with the AB2 workbench cockpit spec. These files compile into the Electron ASAR that ships in the Windows RC artifact. The previous RC artifact (SHA256 `16f32bc...`, built in Phase X2) did not include these changes and was stale.

Phase AB4 (QA acceptance) and Phase AB5 (privacy/security audit) both passed all gates, confirming the AB3 changes are safe. A dry-run rebuild is warranted.

## Artifact details

| Field | Value |
|-------|-------|
| Artifact path | `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` |
| Version | `v0.1.0-rc.1` |
| SHA256 | `d8b1507f66307a85fe871e385417fff58413a40cabf8a751145e309174bc6eef` |
| Checksum file | `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` |
| START-HERE | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` |
| Files in archive | 86 |
| Old SHA256 (Phase X2) | `16f32bcf07b69580a3f5b641619130b5173ea1b8b4a42f064fc831b3abcf8314` |
| SHA256 changed? | **Yes** — confirms binary is fresh with AB3 copy polish |

## Standard gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS (7 workspace projects) |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (382 tests, 29 files) |
| `pnpm privacy:scan` | PASS (249 files, no violations) |

## Forbidden content audit — PASS

| Check | Result |
|-------|--------|
| Forbidden directories (`.git`, `.local`, `.auth`, `browser-profiles`, `screenshots`, etc.) | PASS |
| Forbidden file types (`.har`, `.trace`, `.png`, `.sqlite`, `.log`, `.pem`, etc.) | PASS |
| Env/auth/credential files | PASS |
| Key file: `resources/app.asar` | PRESENT |
| Key file: `resources/scripts/local-cdp-bridge.py` | PRESENT |
| Key file: `resources/scripts/windows/start-dedicated-chromium-cdp.ps1` | PRESENT |

## START-HERE content — PASS

File: `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt`

Contains exact required sentence:
```
No Save / Submit / Update / Resolve / Close automation.
```

Full content matches the `write_start_here()` function in `scripts/packaging/build-windows-rc.sh`.

## Archive integrity

- **86 files** in archive (same count as prior RC.1)
- Key Electron app structure: `resources/app.asar` present
- CDP bridge scripts present
- Windows launcher scripts present
- Electron binary: `ServiceNow Automation.exe`
- No native addon compilation errors
- SHA256 changed from prior build — confirms binary incorporates AB3 copy changes

## Actions taken (Green zone)

1. ✅ Ran all four gates: build, typecheck, test, privacy:scan
2. ✅ Rebuilt RC artifact via `bash scripts/packaging/build-windows-rc.sh`
3. ✅ Verified SHA256 changed (16f32bc → d8b1507)
4. ✅ Forbidden content audit on new archive
5. ✅ START-HERE content audit
6. ✅ Status document produced and committed

## Actions not taken (Red zone — correctly avoided)

- ❌ No GitHub Release created
- ❌ No tag pushed
- ❌ No git push to remote
- ❌ No real ServiceNow login/browser operations
- ❌ No secrets, cookies, HAR, screenshots, real URLs, or ticket data exposed

## Remaining blockers

None. The artifact is ready for Alan manual validation on Windows if desired.

## Files changed

- `docs/status/phase-AB6-windows-rc-refresh-dry-run-2026-06-06.md` — new status doc
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` — rebuilt RC artifact (SHA256 changed)
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` — updated checksum
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` — regenerated START-HERE

## Simplicity check

- Minimal rebuild: exactly what the build script does, no manual zip assembly
- All gates run before rebuild (not after) — honest ordering
- Status doc matches established Phase X2/T2 format for consistency
- AB3-only delta — unrelated files left untouched

## Safety/privacy status

- ✅ No secrets committed
- ✅ No real ServiceNow URLs, ticket IDs, sys_ids, or field values
- ✅ No browser state, screenshots, HAR, traces, or cookies
- ✅ START-HERE explicitly warns against real ServiceNow interaction
- ✅ No pushes, tags, or releases to remote
