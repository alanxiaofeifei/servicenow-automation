# Phase T2 — Windows RC artifact dry-run and launcher/user package check

**Date:** 2026-06-05
**Owner:** sna-windows-runtime
**Branch:** `next/product-clarity-demo-polish-20260605`

## Verdict: REBUILT — new SHA256, all gates pass

---

## Rationale for rebuild

Unlike Phase H (which correctly skipped as the branch had only doc changes), the current branch `next/product-clarity-demo-polish-20260605` contains **10 substantive commits** beyond origin, including source changes to `apps/desktop/src/App.tsx`, `App.test.ts`, and `styles.css` — all committed after the prior RC.1 artifact was built (June 4 22:52). The old RC.1 was stale.

## Artifact details

| Field | Value |
|-------|-------|
| Artifact path | `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` |
| Version | `v0.1.0-rc.1` |
| SHA256 | `98330fa41772a1a5f448c3f143b902fef8633eb458242ae22ce42969a0654466` |
| Checksum file | `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` |
| START-HERE | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` |
| Files in archive | 86 |
| Old SHA256 (stale) | `b73d5484aeb1f068f6d1f4ba92158c0dd2bf69d09331087ffcadade67d6f136d` |
| SHA256 changed? | **Yes** — confirms binary is fresh |

## Standard gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS (7 workspace projects) |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (382 tests, 27 files) |
| `pnpm privacy:scan` | PASS (217 files, no violations) |

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

## Actions taken (Green zone)

1. ✅ Ran all four gates: build, typecheck, test, privacy:scan
2. ✅ Rebuilt RC artifact via `bash scripts/packaging/build-windows-rc.sh`
3. ✅ Verified SHA256 checksum
4. ✅ Forbidden content audit on new archive
5. ✅ START-HERE content audit
6. ✅ Status document produced

## Actions not taken (Red zone — correctly avoided)

- ❌ No GitHub Release created
- ❌ No tag pushed
- ❌ No git push to remote
- ❌ No real ServiceNow login/browser operations
- ❌ No secrets, cookies, HAR, screenshots, real URLs, or ticket data exposed

## Remaining blockers

None. The artifact is ready for Alan manual validation on Windows.

## Files changed

- `docs/status/phase-T2-windows-rc-artifact-result-2026-06-05.md` — new status doc
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` — rebuilt RC artifact
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` — updated checksum
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` — regenerated START-HERE

## Simplicity check

- Minimal rebuild: exactly what the build script does, no manual zip assembly
- All gates run before rebuild (not after) — honest ordering
- Status doc matches Phase H format for consistency

## Safety/privacy status

- ✅ No secrets committed
- ✅ No real ServiceNow URLs, ticket IDs, sys_ids, or field values
- ✅ No browser state, screenshots, HAR, traces, or cookies
- ✅ START-HERE explicitly warns against real ServiceNow interaction
- ✅ No pushes, tags, or releases to remote
