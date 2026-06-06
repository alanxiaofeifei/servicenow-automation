# AF2 — QA acceptance and manual checklist for AF1 deliverables

**Date:** 2026-06-07
**Profile:** `sna-qa-acceptance`
**Status:** PASS

---

## Gate summary

| Gate | Result | Detail |
|------|--------|--------|
| pnpm build | PASS | All 7 workspace projects build successfully |
| pnpm typecheck | PASS | All 7 packages/apps pass tsc --noEmit |
| pnpm test | PASS | **412/412 tests pass** (7 packages/apps) |
| pnpm privacy:scan | PASS | 273 files pass |

---

## Acceptance criteria verification

### AC1 — Diagnostic overlay renders when Chromium runtime is missing

**Verdict: PASS**

Evidence — `StartupDiagnosticBanner` component in `apps/desktop/src/App.tsx` (line 7411):

- Renders when `startupBlocked` is true: `!cdpEndpointReady && !!lastResponse?.launch?.blockedReason` (line 7181)
- Shows heading `<h3 id="startup-diagnostic-heading">Startup blocked</h3>` (line 7529)
- Shows sanitized reason via `operatorSanitizeBlockedReason(blockedReason)` which maps `"dedicated-browser-runtime-missing"` to `"dedicated browser runtime unavailable"` (line 6696-6697)
- Shows next-step instruction: `"Run prepare-chrome-for-testing.ps1 from the scripts/windows folder, then restart the app."` (line 7440)
- Shows sanitized log path if available (lines 7433-7435, 7604-7608)
- CSS styles at `apps/desktop/src/styles.css` lines 4208-4311

Test coverage — `apps/desktop/src/App.test.ts` lines 1657-1669:
```
✓ shows diagnostic banner when CDP is not ready and launch is blocked
✓ uses sanitized language in the diagnostic banner heading and reason
✓ shows dismiss button that can close the overlay
✓ redacts raw absolute paths in the diagnostic log path
```

### AC2 — "Copy diagnostic" button copies only sanitized text

**Verdict: PASS**

Evidence — `StartupDiagnosticBanner` component (lines 7443-7458):

- Diagnostic text assembled from: `"Startup blocked"` + sanitized reason + next step + sanitized log path
- `handleCopyDiagnostic` copies exactly this text to clipboard
- Text does NOT contain: raw paths beyond sanitized log path (redacted by `sanitizeOperatorRuntimeLogPath`), credentials, ServiceNow URLs, raw file paths
- The `sanitizeOperatorDiagnosticText` function (lines 7022-7041) redacts: SHA256 fingerprints, authorization headers, API keys/tokens/secrets, URLs, ServiceNow hosts, filesystem paths, CDP/DevTools jargon
- The `operatorSanitizeBlockedReason` function (lines 6693-6714) maps all internal reason codes to plain-language sanitized descriptions

Test coverage — `App.test.ts` lines 1721-1736:
```
✓ redacts raw absolute paths in the diagnostic log path
  - `/tmp` NOT found in banner section
  - `servicenow-automation` NOT found in banner section
  - Sanitized path pattern found: `startup-logs/qa-startup-20260607-1234.jsonl`
```

### AC3 — Runtime provisioning precheck returns blocked result when runtime missing

**Verdict: PASS** (with note — see below)

Evidence — `apps/desktop/electron/runtime-provisioning-precheck.ts`:

- `checkDedicatedChromiumRuntime()` returns `"dedicated-browser-runtime-missing"` (not the originally scoped `"RuntimeNotFound"`)
- Checks for `chrome.exe` at `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe`
- Returns `undefined` when runtime exists
- Only runs on `win32` platform

Integrated in `main.ts` (lines 76-80):
```
const runtimeBlockedReason = checkDedicatedChromiumRuntime();
if (runtimeBlockedReason) {
  return blockedLaunchResponse(runtimeBlockedReason);
}
```

**Note:** Acceptance criteria originally specified `{blocked: true, blockedReason: "RuntimeNotFound"}`. The AF1-B1 implementation uses `"dedicated-browser-runtime-missing"` because the renderer already handles this reason code with proper text, avoiding unnecessary renderer changes. This decision was explicitly documented in the parent task handoff. The renderer also accepts `"RuntimeNotFound"` as an alias (App.tsx line 7437). The behavior is functionally equivalent and higher quality (no silent path through a potentially-unhandled code path).

Test coverage — `apps/desktop/electron/runtime-provisioning-precheck.test.ts`:
- ✓ Returns undefined when runtime exists
- ✓ Returns dedicated-browser-runtime-missing when runtime does not exist
- ✓ Returns undefined on non-Windows platforms (linux, darwin)
- ✓ Returns undefined when LOCALAPPDATA is not set
- ✓ Returns undefined when runtime exists with mixed-case path
- ✓ Returns dedicated-browser-runtime-missing when parent directory exists but chrome.exe doesn't

### AC4 — CDP readiness chip transitions to "error" state

**Verdict: PASS**

Evidence — `App.tsx` `cdpState` computation (lines 3050-3055):
```
if (operatorBusyAction === "launch") return "connecting";
if (operatorCdpReady) return "connected";
if (operatorLastResponse?.launch?.blockedReason) return "error";
return "disconnected";
```

CDP state label mapping (lines 7226-7231):
```
disconnected → workbenchCopy.runtime.browserDisconnected
connecting → workbenchCopy.runtime.browserConnecting
connected → workbenchCopy.runtime.browserConnected
error → workbenchCopy.runtime.browserError
```

Rendered as `<span className="browser-status-chip error">` (line 7285)

Test coverage — `App.test.ts` lines 1572-1583:
```
✓ shows Browser: error state when launch was blocked
  - 'class="browser-status-chip error"' rendered
  - "Browser: error" rendered
```

### AC5 — Start QA Chromium works normally when runtime IS present (no regression)

**Verdict: PASS**

Evidence — When `checkDedicatedChromiumRuntime()` returns `undefined` (runtime exists), the launch flow proceeds normally through `createBrowserSessionService().startQaDedicatedCdpBrowser()` (main.ts lines 84-89).

Test coverage:
- `App.test.ts` line 1562: `✓ shows Browser: connected state when CDP is ready` — tests the post-launch connected state
- `App.test.ts` line 505: `✓ enables verify only after sanitized browser readiness` — tests that Verify button enables after CDP ready
- All 95 adapter tests pass including the full browser session lifecycle tests

### AC6 — Clean-machine validation runbook is accurate

**Verdict: PASS**

Evidence — `docs/test/windows-clean-machine-validation-2026-06-07.md`:

- Package path: `\\\\wsl.localhost\\Ubuntu-Compact\\home\\alanxwsl\\projects\\servicenow-automation\\dist\\release\\servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip`
- SHA256: `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde`
- Verified against actual package at dist/release/ — SHA256 matches:
  ```
  4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde  servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip
  ```
- Package size: 118,590,385 bytes (~114 MB) matches
- All 8 acceptance criteria from AF1-C task met (review-approved by Alan at commit 2469c04)
- All step-by-step validation tables cover: diagnostic overlay, runtime precheck, Start QA Chromium, CDP readiness, Verify read-only
- Safety wording present and correct
- FAIL/pass criteria documented

### AC7 — Mandatory gates pass

**Verdict: PASS**

| Gate | Result |
|------|--------|
| build | PASS |
| typecheck | PASS |
| test (412/412) | PASS |
| privacy:scan (273 files) | PASS |

### AC8 — B2 auto-provisioning verification (implemented)

**Verdict: PASS**

B2 (auto-provisioning) was implemented. Evidence:

**Download confirmation dialog** — `StartupDiagnosticBanner` (App.tsx lines 7535-7558):
- Shows when `provisionState === "confirming"` and `isRuntimeMissing`
- Text: "This will download the latest stable Chrome for Testing (approx 150 MB)..."
- "Download and install" and "Cancel" buttons
- CSS: `.auto-provision-confirm`, `.auto-provision-confirm-yes`, `.auto-provision-confirm-no` (styles.css lines 4327-4371)

**Progress indicator** — (App.tsx lines 7561-7578):
- Shows when `provisionState === "provisioning"`
- Text message updates: "Fetching Chrome for Testing version info..." → "Downloading... X%" → "Extracting..."
- Progress bar with `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Percentage text indicator
- CSS: `.auto-provision-progress`, `.auto-provision-progress-bar` (styles.css lines 4373-4405)

**Automatic retry** — (App.tsx lines 7487-7491):
- When provisioning completes (`stage === "done"`), auto-triggers browser launch:
  ```
  setTimeout(() => { onLaunchBrowser?.(); }, 300);
  ```
- Also shown: done state with "Chrome for Testing installed successfully. Restarting browser launch..." (lines 7581-7585)

**Error state with retry** — (lines 7588-7599):
- Shows error message + "Try again" button
- Tracks via `provisionState: "error"`

**Backend implementation** — `apps/desktop/electron/chromium-provisioner.ts`:
- Fetches Chrome for Testing from official Google metadata endpoint
- Downloads (150 MB) with progress tracking
- Extracts via PowerShell `Expand-Archive`
- Moves files to `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium`
- Post-provisioning verification that `chrome.exe` exists
- Full test coverage: `chromium-provisioner.test.ts` (9 tests)

**IPC bridge**:
- `main.ts` (lines 104-145): `sda:provision-chromium-runtime` handler
- `preload.ts` (lines 8-14): `provisionChromiumRuntime`, `onProvisionProgress`, `offProvisionProgress` exposed to renderer

### AC9 — State verdict

**Verdict: PASS**

---

## Manual acceptance checklist (to be executed by Alan on Windows)

| # | Item | Expected | Evidence link |
|---|------|----------|------|
| 1 | Windows double-click opens tool window | Window titled "ServiceNow Automation" | §4.2 of runbook |
| 2 | Startup failure shows diagnostic overlay | "Startup blocked" + sanitized reason + next step + Copy diagnostic | AC1, AC2 |
| 3 | Start QA Chromium visibly launches dedicated Chromium | Chromium window opens visibly | §4.5 of runbook |
| 4 | App shows sanitized CDP readiness | CDP chip transitions disconnected→connecting→connected | AC4 |
| 5 | Verify button disabled before CDP readiness | Disabled with "start QA Chromium first" reason | App.tsx line 7184, test line 500 |
| 6 | Verify button enables after CDP readiness | Enabled with "Browser connection ready" | App.tsx test line 513 |
| 7 | Verify-only does not write | Read-only inspection, no fills/submits/saves | §4.6 of runbook |
| 8 | Autofill remains separated from Save/Submit/Update/Resolve/Close | No such buttons in UI | §7 of runbook |
| 9 | Three-column UI visible | Left nav/source, center draft, right runtime/actions | App.tsx line 490 test |
| 10 | No raw ServiceNow URL/fingerprint/credential/session in logs | Sanitizer regexes active | AC2, sanitizeOperatorDiagnosticText |

---

## Alan's real usage path — validation

The P0 gap that AF1 was built to fix:

1. User double-clicks on clean Windows machine (no Node.js, no WSL)
2. App starts, shows diagnostic overlay: "Startup blocked — dedicated browser runtime unavailable"
3. "Copy diagnostic" copies sanitized text without raw paths/credentials
4. User runs `prepare-chrome-for-testing.ps1` from the extracted scripts folder
5. PowerShell downloads and extracts Chrome for Testing
6. User re-launches the app
7. Click "Start QA Chromium" → Chromium window opens visibly
8. CDP chip transitions disconnected → connecting → connected
9. "Verify current Incident" button becomes enabled
10. Verify runs as read-only — no ServiceNow writes

**Alternatively with B2 auto-provisioning:**
1. Diagnostic overlay shows → click "Download Chrome for Testing automatically"
2. Confirmation dialog → click "Download and install"
3. Progress bar shows download/extract progress
4. On completion, browser launch auto-retries
5. Now runtime exists, Start QA Chromium works

This path is fully implemented and tested. Alan must execute the clean-machine validation runbook to confirm on actual Windows hardware.

---

## Package verification

| Property | Value | Verified? |
|----------|-------|-----------|
| Package path | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-ae-20260607-local.zip` | ✓ |
| SHA256 | `4a9c7a38919acdc20c5c7352fc9a9b07ac11338770aed266bbd8746f19c69cde` | ✓ matches actual zip |
| File size | 118,590,385 bytes (~114 MB) | ✓ confirmed |
| Timestamp | 2026-06-07 02:00 CST | ✓ |

---

## Files changed

New files (AF1-A, AF1-B1, AF1-B2, AF1-C combined):
- `apps/desktop/electron/runtime-provisioning-precheck.ts` — runtime precheck module
- `apps/desktop/electron/runtime-provisioning-precheck.test.ts` — 7 tests
- `apps/desktop/electron/chromium-provisioner.ts` — auto-provisioning (B2)
- `apps/desktop/electron/chromium-provisioner.test.ts` — 9 tests (B2)
- `docs/test/windows-clean-machine-validation-2026-06-07.md` — validation runbook
- This file

Modified files:
- `apps/desktop/electron/main.ts` — precheck integration + auto-provision IPC handler
- `apps/desktop/electron/preload.ts` — provision API bridge
- `apps/desktop/src/App.tsx` — StartupDiagnosticBanner, CDP chip error state
- `apps/desktop/src/App.test.ts` — diagnostic banner tests, CDP chip error test
- `apps/desktop/src/styles.css` — diagnostic overlay + auto-provision styling

---

## Safety/privacy status

- No raw file paths beyond sanitized presentation exposed in UI
- No credentials, tokens, or ServiceNow URLs rendered
- Copy diagnostic button copies only sanitized text
- CDP endpoint stored in main-process memory, stripped from renderer response
- All raw paths, secrets, URLs redacted via `sanitizeOperatorDiagnosticText`
- Verify is read-only (no fills, no submits)
- Autofill requires explicit approval phrase, fingerprint verification, and QA isolation confirmation
- No Save/Submit/Update/Resolve/Close buttons in UI
- privacy:scan passes (273 files)

---

## Remaining risks

1. **MSVC redistributable dependency** — Electron on Windows requires the MSVC++ Redistributable. Not bundled in the package. Documented in runbook §10. If a clean machine lacks it, the app will not start (crash dialog, not diagnostic overlay since crash is before renderer loads).
2. **Clean-machine validation not yet executed by Alan** — All ACs are code-review and test-verified, but Alan must execute `docs/test/windows-clean-machine-validation-2026-06-07.md` on actual clean Windows hardware.
3. **PowerShell execution policy** — The provisioning script may be blocked by default PowerShell execution policy. Workaround documented: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.
