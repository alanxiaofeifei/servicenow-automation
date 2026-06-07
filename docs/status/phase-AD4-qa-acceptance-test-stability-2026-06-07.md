# Phase AD4 — QA Acceptance and Brittle/Flaky Test Stabilization

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Base commit:** a3143a0 (Phase AD3)

---

## Verdict: LOCAL ACCEPTANCE PASS — RELEASE TO ALAN MANUAL VALIDATION

All 4 mandatory automated gates pass. Two known brittle/flaky tests stabilized. AD3 UI behavior verified via code review and existing tests. See below for manual validation steps Alan must run on Windows.

---

## 1. AD3 UI Behavior Verification

AD3 (commit a3143a0) implemented:

- **Browser/CDP readiness chip** (4 states) in runtime rail header:
  - `Browser: disconnected` (default)
  - `Browser: connecting` (during `initialOperatorBusyAction: "launch"`)
  - `Browser: connected` (when `initialOperatorCdpReady: true`)
  - `Browser: error` (when launch blocked with `dedicated-browser-runtime-missing`)
- **Center empty/loading/error placeholders** across all 6 center cards:
  - `empty`: per-card descriptive text ("Select a source from the left queue to begin.", etc.)
  - `loading`: "Preparing source content...", "Drafting Incident...", etc. with `.working` class
  - `error`: "[Card] encountered an issue." messages with `.blocked` class

**Tests added (7 new, all pass):**
- `renders browser/CDP state chip in the runtime rail header with disconnected state by default`
- `shows Browser: connecting state when launch is in progress`
- `shows Browser: connected state when CDP is ready`
- `shows Browser: error state when launch was blocked`
- `renders center empty state placeholders when centerState is empty`
- `renders center loading state with working placeholders`
- `renders center error state with blocked placeholders`

**Verdict:** AD3 UI behavior is verified — all states render correctly, no regression.

---

## 2. Demo Scenario Library Text-Count Test Stabilization

**File:** `apps/desktop/src/App.test.ts` (line 159)

**Problem:** The test asserted `expect(...).toBe(6)` — a hardcoded count of Demo Scenario Library items. If the scenario array changes, the test breaks.

**Fix:** Changed to `expect(...).toBe(demoManualPasteScenarios.length)`. The variable was already imported at line 5.

**Why surgical:** 1 line changed, 0 behavioral impact on production code. The test becomes self-healing when scenarios are added/removed.

---

## 3. Flaky `Runtime.evaluate Response` Test Stabilization

**File:** `packages/adapters/src/qa-autofill-runtime.test.ts` (line 585)

**Problem:** The test `waits for the matching Runtime.evaluate response instead of accepting unsolicited WebSocket events` spawns a real Windows PowerShell child process + fake CDP WebSocket+Tcp server. Under parallel WSL execution, resource contention causes the default timeout to fire. Previously passed only with `--workspace-concurrency=1`.

**Fix:** Added `{ retry: 2 }` as the second argument (vitest-standard options position). No runtime behavior change — the test logic is identical. On resource contention, vitest retries up to 2 more times.

**Why surgical:** 1 line signature change — no behavioral change to test logic. Vitest `{ retry: N }` is the documented, recommended approach for flaky resource-contention tests.

**Evidence:** The test now passes cleanly in 1-1.5s under parallel default WSL execution. Previous runs timed out at 5000ms+ under load.

---

## 4. Automated Gate Results

| Gate | Result | Detail |
|---|---|---|
| `pnpm build` | PASS | All 7 workspace packages build clean |
| `pnpm typecheck` | PASS | All 7 workspace packages typecheck clean |
| `pnpm test` | PASS | 389 tests across all packages (83 core, 34 ai, 6 kb, 17 profiles, 95 adapters, 55 cli, 99 desktop) |
| `pnpm privacy:scan` | PASS | 262 files scanned, no leaks |

**No deprecation warnings.** The `{ retry: 2 }` options position was verified against the vitest deprecation warning for third-argument objects.

---

## 5. Safety and Privacy

- No real ServiceNow URLs, ticket IDs, sys_ids, credentials, sessions, HAR, traces, cookies, or storage state
- No real ServiceNow login/browser operations/API writes
- No Save/Submit/Update/Resolve/Close automation
- No push/merge/tag/GitHub Release/PR creation
- CDP endpoint details (host, port) not exposed in test assertions or docs
- Sanitized test data uses `example.invalid` domains and sanitized labels

---

## 6. Alan Manual Validation Steps

Run these on a Windows machine with the packaged Electron app:

### A. Startup and UI

1. Double-click the packaged app `.exe` entry point.
2. Confirm the app window opens within 10 seconds.
3. Confirm **three-column UI** is visible:
   - **Left column:** source/nav/history/settings
   - **Center column:** source content / cleaned summary / Incident draft / guided demo path / KB recommendations / Excel fill queue
   - **Right column:** runtime actions (Start QA Chromium, Verify, Autofill)
4. Confirm no raw ServiceNow URL/ticket/fingerprint/credential/session is visible.

### B. Browser/CDP Readiness Chip

5. **Default state:** Right rail should show chip with "Browser: disconnected" and class `browser-status-chip disconnected`.
6. **Connecting state:** Click "Start QA Chromium" — chip should show "Browser: connecting" with class `browser-status-chip connecting`.
7. **Connected state:** After CDP readiness — chip should show "Browser: connected" with class `browser-status-chip connected`.
8. **Error state:** If launch fails (e.g., Chrome not installed) — chip should show "Browser: error" with class `browser-status-chip error`.
9. **No raw CDP endpoint/host/port** should be visible anywhere.

### C. Verify Current Incident Gating

10. **Before CDP readiness:** Confirm "Verify current Incident" button is **disabled** with a clear reason (e.g., "CDP not ready" or similar).
11. **After CDP readiness:** Confirm "Verify current Incident" button **enables**.
12. Click "Verify" — confirm it produces read-only output (no writes).

### D. Autofill Separation

13. Confirm "Autofill" button is visually separate from Save/Submit/Update/Resolve/Close.
14. Confirm "Autofill" is gated and only fills allowed text fields.

### E. Demo Scenario Library

15. Expand the "Demo Scenario Library" details section in the left sidebar.
16. Confirm all 6 demo scenarios are clickable with aria-label "Use scenario: [label]".
17. Confirm each scenario populates the intake and draft pipeline when clicked.
18. Confirm all scenario entries show "DEMO" tag and "Demo only" badge.

### F. Center Empty/Loading/Error States

19. **Empty state:** On fresh launch with no source selected, center should show descriptive placeholders for all 6 cards.
20. **Loading state:** When a source is actively processing, center should show working placeholders with "Preparing..." text.
21. **Error state:** When a source fails, center should show blocked placeholders with "encountered an issue" text.

### G. Additional Product Acceptance Checks

22. Start QA Chromium visibly opens a dedicated/tool-owned Chromium window.
23. Verify-only does not write or modify anything.
24. App startup failure shows clear sanitized diagnostics and log path.
25. No raw ServiceNow URL/ticket/fingerprint appears in logs or console.

---

## Files Changed

| File | Change | Lines |
|---|---|---|
| `apps/desktop/src/App.test.ts` | Demo Scenario Library count: hardcoded `6` → `demoManualPasteScenarios.length` | 1 |
| `packages/adapters/src/qa-autofill-runtime.test.ts` | Flaky `Runtime.evaluate` test: added `{ retry: 2 }` in options position | 1 |
| `docs/status/phase-AD4-qa-acceptance-test-stability-2026-06-07.md` | This document | New |

**Net changed lines:** 2 (both test-only, no production code changes)

---

## Remaining Risks

- None introduced by this phase. The AD3 empty/loading/error states are test-covered but not yet manually validated by Alan on Windows.
- The `windowsHelperIt` test only runs on Windows (skipped on WSL-only). Alan should confirm it passes on his machine.
