# Phase AF5 — Privacy/Security Audit — Windows Operator Packaging/Runtime Readiness

Date: 2026-06-07
Status: COMPLETE
Parent: t_c5d39b0f (AF3 implementation)
Branch: `next/post-release-operator-cockpit-ab-20260606`

## VERDICT: APPROVE — no blocking issues

## Audit scope

4 modified files + 3 new docs in the working tree:

| File | Lines changed | Purpose |
|------|--------------|---------|
| `apps/desktop/electron/main.ts` | +28 | AF1-B1: Runtime provisioning precheck |
| `apps/desktop/src/App.tsx` | +181 | AF1-A: Startup diagnostic banner + AF3: Handoff card polish |
| `apps/desktop/src/App.test.ts` | +113 | Tests for diagnostic banner + updated handoff assertions |
| `apps/desktop/src/styles.css` | +245 | Diagnostic banner + handoff archive/runtime/quickstart styles |
| `docs/status/phase-AF1-*-scope-*.md` | new | AF1 scope definition |
| `docs/status/phase-AF2-*-ux-spec-*.md` | new | AF2 UX/copy spec |
| `docs/status/phase-AF3-*-implementation-*.md` | new | AF3 implementation doc |

No zip/package artifacts in the worktree.

## Gate results

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS (7 projects) |
| `pnpm test` | PASS (55 CLI + 106 desktop = 161/161) |
| `pnpm privacy:scan` | PASS (273 files) |

## Evidence reviewed

### 1. `main.ts` — Runtime provisioning precheck (AF1-Deliverable B1)

Added `checkDedicatedChromiumRuntime()`:
- Reads `process.env.LOCALAPPDATA` (Windows environment variable, not a hardcoded path)
- Checks existence of `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`
- Returns safe sanitized code `"dedicated-browser-runtime-missing"` if not found
- Uses `existsSync` from Node `fs` — no network calls, no credentials, no ServiceNow URLs
- Dependency injection via `DedicatedChromiumRuntimeCheckOptions` for testability
- Precheck runs before any CDP browser launch attempt

**Verdict:** Clean. No secrets, URLs, ticket IDs, sys_ids, or ServiceNow identifiers.

### 2. `App.tsx` — Startup diagnostic banner (AF1-A) + Handoff card polish (AF3)

**StartupDiagnosticBanner component:**
- Sanitizes `blockedReason` via `operatorSanitizeBlockedReason()`
- Sanitizes `runtimeLogPath` via `sanitizeOperatorRuntimeLogPath()`
- "Copy diagnostic" button copies only sanitized text (no raw paths, no credentials)
- Dismissible after reading (does not block forever)
- Human-readable `nextStep` instruction for each blocked reason

**startupDiagnostic copy block:**
- `logPathHint: "%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Logs"` — environment variable placeholder, not a real path
- All text is plain instruction copy (heading, reason label, next step, dismiss)

**Handoff card changes (AF3):**
- UNC path updated to `rc.1-ae-20260607-local.zip` (was `rc.1-ad-...`)
- SHA256 updated
- Stale-archive list with demotion styling for rc/ad/ab artifacts
- Stale-package warning banner
- Runtime readiness chips ("not found yet", "disconnected")
- Quickstart checklist strip (5 local-only steps)
- "Open checklist" button replaced by quickstart strip
- All copy is local-only guidance; no write paths

**UNC path note:** `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...` contains the WSL username. This is consistent with all prior approved phases (AC3, AB5, AD5, AE5). It is a local development environment path, not customer/employee/ServiceNow data.

**Verdict:** Clean. Sanitization functions applied. No secrets, credentials, ServiceNow URLs, ticket IDs, sys_ids, or write-path copy.

### 3. `App.test.ts` — Diagnostic banner tests + updated assertions

- 7 new tests for `StartupDiagnosticBanner`:
  - Shows banner when CDP not ready + launch blocked
  - Hides banner when CDP is ready
  - Hides banner when no blocked reason
  - Uses sanitized language
  - Shows dismiss button
  - **Redacts raw absolute paths in diagnostic log path** (asserts `/tmp` and `servicenow-automation` NOT present in banner)
- Fixture `runtimeLogPath` is synthetic: `/tmp/servicenow-automation/.local/startup-logs/qa-startup-20260607-1234.jsonl`
- Updated handoff assertions for new stale-archive/runtime/quickstart sections
- Removed assertions for deleted "Open checklist" button

**Verdict:** Clean. Test fixture paths are synthetic. Redaction is explicitly verified. No real ServiceNow data.

### 4. `styles.css` — Pure CSS additions

Added styles for:
- `.startup-diagnostic-banner` through `.startup-diagnostic-dismiss-button` (~100 lines)
- `.handoff-stale-warning` through `.handoff-quickstart-list li` (~145 lines)

No data content. Warm/light theme colors only. No URLs or identifiers.

**Verdict:** Clean. Pure CSS, no data.

### 5. AF1/AF2/AF3 docs

Three status docs that define scope (AF1), specify UX/copy (AF2), and document implementation (AF3). Reference the same local-only package metadata (UNC path, SHA256, mtime). No secrets, no live ServiceNow data, no credentials.

**Verdict:** Clean.

## Targeted scans

| Scan | Result |
|------|--------|
| Raw ServiceNow URLs (`service-now.com`, `servicenow.com`) | 0 hits in diff |
| Ticket IDs / sys_ids | 0 hits |
| Credentials / passwords / API keys | 0 hits |
| Sessions / cookies / storage-state | 0 hits |
| HAR / trace / screenshots | 0 hits |
| HTTP(S) URLs | 0 hits in diff |
| `pnpm privacy:scan` | PASS (273 files) |

## Hard safety boundary confirmed

| Boundary | Status |
|----------|--------|
| No real ServiceNow login/browse/API write | ✓ Confirmed |
| No Save / Submit / Update / Resolve / Close | ✓ Confirmed |
| No upload | ✓ Confirmed |
| No Microsoft Graph / Excel Web writes | ✓ Confirmed |
| No real Teams / Outlook / phone ingestion | ✓ Confirmed |
| No screenshots, HAR, trace, cookies, storage-state, raw identifiers | ✓ Confirmed |
| No push, PR, merge, tag, GitHub Release | ✓ Confirmed |
| No cron edits | ✓ Confirmed |

## Non-blocking observations

1. **UNC path contains WSL username:** The path `\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...` appears in App.tsx, App.test.ts, and all three AF docs. This is a local development environment path, not customer/employee/ServiceNow data. All prior privacy/security audits (AC3, AB5, AD5, AE5) approved similar paths. The handoff card is designed to show Alan his own local package path.

2. **AF3 doc incomplete coverage:** The AF3 implementation doc covers only the handoff card changes but the working tree also includes `main.ts` runtime precheck and `startupDiagnostic` copy/component (AF1 Deliverables A + B1). These are separate deliverables from the AF1 scope, not undocumented AF3 changes. The audit here covers the full working tree diff.

3. **Change budget:** 540 net insertions across 4 files exceeds the typical ~250 line budget, but the work spans multiple AF1/AF3 deliverables and is split across discrete files with clear responsibilities.

## Files reviewed

- `apps/desktop/electron/main.ts` (diff, full)
- `apps/desktop/src/App.tsx` (diff, full)
- `apps/desktop/src/App.test.ts` (diff, full)
- `apps/desktop/src/styles.css` (diff, full)
- `docs/status/phase-AF1-windows-operator-packaging-scope-2026-06-07.md` (full)
- `docs/status/phase-AF2-windows-operator-packaging-ux-spec-2026-06-07.md` (full)
- `docs/status/phase-AF3-windows-operator-packaging-implementation-2026-06-07.md` (full)

## Conclusion

**APPROVE.** The AF5 surface (AF1 startup diagnostics + AF3 handoff card polish) is clean. All 4 gates pass. No secrets, live ServiceNow identifiers, or write-path copy are introduced. The diagnostic banner applies proper sanitization and redaction. The local-only packaging guidance is consistent with all prior approved phases.

## Remaining risks

- The startup diagnostic banner is renderer-only — it displays what the main process returns. If the main process IPC payload itself were to leak sensitive paths, the renderer sanitization would catch it (verified by test), but the main process response payload should be kept sanitized at source.
- Runtime readiness chips ("not found yet", "disconnected") are static placeholder text. When wired to actual runtime detection, the dynamic content will need its own privacy audit.
