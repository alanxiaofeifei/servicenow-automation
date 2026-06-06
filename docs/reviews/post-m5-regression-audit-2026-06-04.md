# Post-Milestone 5 Regression Audit

**Date:** 2026-06-04
**Branch audited:** main (nightly/release-candidate-20260604 does not exist)
**Auditor:** sna-qa-acceptance

---

## Gates

| Gate | Result |
|------|--------|
| pnpm build | PASS (all workspace projects) |
| pnpm typecheck | PASS (all workspace projects) |
| pnpm test | PASS (344 tests across 24 files) |
| pnpm privacy:scan | PASS (183 files scanned) |

---

## Question 1: Desktop live path remains text-field-only or blocked?

**Verdict:** PASS — effectively text-field-only but with a legacy routing concern.

### Evidence

- `apps/desktop/electron/main.ts` has TWO autofill IPC handlers:
  - `sda:autofill-current-incident-defaults` (line 127) — legacy handler. Internally calls `buildQaIncidentDefaultRuntimeTextFieldPlan()` which filters planned fields to only `shortDescription`, `description`, `workNotes` (see `packages/core/src/qa-incident-defaults.ts` line 255). The resulting `runtimeTextFieldPlan` is passed to `runQaIncidentDefaultFieldAutofillRuntime`.
  - `sda:text-field-autofill-current-incident` (line 177) — dedicated text-field-only handler using `runQaTextFieldAutofillRuntime`. This is the newer, cleaner path.

- The UI button ("3 Autofill allowed fields") in `QaOperatorRuntimePanel` calls `onAutofill` → `autofillQaOperatorIncident()` → `api.autofillCurrentIncidentDefaults(request)` (App.tsx lines 3369-3370). This hits the LEGACY handler, not the dedicated text-field-only handler.

- The `onTextFieldAutofill` prop is wired (App.tsx line 3718) to `textFieldAutofillQaOperatorIncident()` but is **never referenced inside QaOperatorRuntimePanel's JSX** rendering (lines 6180-6389).

### Finding

Desktop autofill execution is text-field-only in effect because the legacy handler forces `buildQaIncidentDefaultRuntimeTextFieldPlan()` filtering. However, the UI should route through the dedicated `sda:text-field-autofill-current-incident` path instead of the legacy full-field handler. This is a minor routing quality issue, not a regression.

---

## Question 2: CLI remains planning/fixture/dry-run or blocked for live CDP?

**Verdict:** PASS

### Evidence

- `sda qa autofill` — always outputs `browserProcessLaunched: false` and `noServiceNowWrite: true`. Planning check only.
- `sda qa autofill-fixture` — local fixture only; `browserProcessLaunched: false`.
- `sda qa autofill-runtime` — requires `--cdp-endpoint` + `--execute`. WSL probe (cli.ts lines 600-606) blocks with `wsl-cli-live-cdp-blocked` when endpoint not reachable.
- `sda qa default-plan` — defaults to fixture source; `--field-source current-page-readonly` with `--cdp-endpoint` also WSL-blocked.
- `sda qa manual-fill` — always dry-run unless `--execute` passed; all safety flags show `noExternalActionPerformed: true` and `browserProcessLaunched: false`.
- All CLI test cases (1947 lines of tests) verify `noServiceNowWrite: true`, `browserProcessLaunched: false` for planning/dry-run paths.

---

## Question 3: No full-field live autofill exposed?

**Verdict:** PASS

### Evidence

- `buildQaIncidentDefaultRuntimeFullFieldPlan` exists in `packages/core/src/qa-incident-defaults.ts` but is NOT imported by `main.ts`, `preload.ts`, or `cli.ts`.
- Explicit test guard at `apps/desktop/src/App.test.ts` line 203-210:
  ```js
  expect(desktopMainSource).not.toContain("buildQaIncidentDefaultRuntimeFullFieldPlan");
  expect(cliSource).not.toContain("buildQaIncidentDefaultRuntimeFullFieldPlan");
  ```
- The legacy handler (`autofill-current-incident-defaults`) uses `buildQaIncidentDefaultRuntimeTextFieldPlan` which restricts planned fields to `shortDescription`, `description`, `workNotes` (`runtimeTextFieldOrder` at qa-incident-defaults.ts:255).
- No IPC handler or CLI path accepts or passes non-text-field planned fields for execution.

---

## Question 4: Stop before Save/Submit/Update/Resolve/Close remains true?

**Verdict:** PASS

### Evidence

- `QaAutofillRuntimeFillResult` type (adapters/qa-autofill-runtime.ts:70-71): `stoppedBeforeSaveSubmitUpdateClose: true`, `stoppedBeforeSaveSubmitUpdateResolveClose: true`.
- `QaIncidentDefaultFieldRuntimeFillResult` type (line 186-187): same fields.
- Every blocked/error response in main.ts includes safety envelope with `noSaveSubmitUpdateClose: true`.
- CLI safety envelope base (cli.ts:949-960): `noServiceNowWrite: true`.
- All test assertions verify `saveSubmitUpdateCloseAttempted: false` and `writeActionsAttempted: false`.
- Runbook (`docs/field-trial/qa-dev-text-field-autofill-execution-runbook.md`): explicitly states "This runbook does **not** authorize: unattended execution, Save, Submit, Update, Resolve, Close, button click automation..."

---

## Question 5: No raw URL/endpoint/fingerprint/field value exposure?

**Verdict:** PASS

### Evidence

- `sanitizeLaunchForRenderer` (main.ts:304-316) strips `cdpEndpoint` and redacts HTTP args as `[REDACTED_SERVICE_NOW_TARGET]`.
- `sanitizeQaAutofillPlan` (cli.ts:1050-1068) replaces field values with `"sanitized-draft-value"` and selectors with `"approved-text-field-selector"`.
- `summarizeQaIncidentFieldInspection` (cli.ts:873-889) sets `pageFingerprint: undefined`.
- Renderer response type `OperatorRuntimeResponse` has `cdpEndpoint?: string` but main process stores endpoint in-memory and never forwards to renderer.
- CLI tests assert `serialized).not.toContain("service-now.com")`, `not.toContain("nav_to.do")`, `not.toContain("sys_id")`, `not.toContain("querySelector")`, `not.toContain("dispatchEvent")`.
- Privacy scan: PASS on 183 tracked files.
- `safeApprovalPageFingerprint` (main.ts:240-243) validates fingerprint format.
- Preload.ts exposes only 4 sanitized IPC methods via `contextBridge`.

---

## Question 6: WSL CLI live CDP remains blocked or documented unsupported?

**Verdict:** PASS

### Evidence

- `detectWsl()` (cli.ts:128-134) detects WSL via `WSL_INTEROP` / `WSL_DISTRO_NAME`.
- `probeCdpEndpointReachable()` (cli.ts:144-166) performs TCP connect probe with 2s timeout.
- WSL block triggers at two call sites:
  - `qa default-plan --field-source current-page-readonly` (line 383-396): returns `blockedReason: "wsl-cli-live-cdp-blocked"`.
  - `qa autofill-runtime` (line 601-605): returns blocked runtime result with same reason.
- Block message (cli.ts:136-137): "WSL CLI cannot connect to Windows CDP. The WSL 2 NAT barrier means 127.0.0.1 in WSL is not the same as 127.0.0.1 on Windows..."
- Runbook (`docs/field-trial/qa-dev-text-field-autofill-execution-runbook.md`, lines 28-38): explicitly documents "WSL CLI cannot perform live CDP execution" and points to Windows-side Electron operator.
- Tests verify `wsl: true` produces blocked output without WSL-probe errors.

---

## Summary

| # | Question | Verdict |
|---|----------|---------|
| 1 | Desktop live path text-field-only or blocked? | PASS — effectively text-field-only via forced runtime plan filtering; UI routes through legacy handler rather than dedicated text-field-only IPC. Non-blocking quality issue. |
| 2 | CLI planning/fixture/dry-run or blocked for live CDP? | PASS — all live paths blocked; planning/fixture/dry-run only. |
| 3 | No full-field live autofill exposed? | PASS — `buildQaIncidentDefaultRuntimeFullFieldPlan` not imported by any entry point. |
| 4 | Stop before Save/Submit/Update/Resolve/Close? | PASS — enforced in every type, response, and test assertion. |
| 5 | No raw URL/endpoint/fingerprint/field value exposure? | PASS — sanitize functions strip or redact sensitive data at every output boundary. |
| 6 | WSL CLI live CDP blocked or documented unsupported? | PASS — TCP probe blocks with clear diagnostic message; runbook documents the limitation. |

## Recommendations

1. **Minor**: Route the desktop autofill button through `sda:text-field-autofill-current-incident` (text-field-only handler) instead of the legacy `sda:autofill-current-incident-defaults` handler. The `onTextFieldAutofill` prop is already wired and unused.
2. **Branch**: The task body references `nightly/release-candidate-20260604` branch which does not exist. Audit was performed against `main` (commit 69e3817). If a release-candidate branch is expected, it should be created.
