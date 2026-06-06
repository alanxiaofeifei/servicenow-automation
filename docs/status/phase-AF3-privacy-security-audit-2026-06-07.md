# Phase AF3 — Privacy/security audit for AF1 deliverables

**Date:** 2026-06-07
**Profile:** sna-privacy-security
**Status:** APPROVE
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Commit:** 2469c04

---

## 1. Scope

Privacy/security audit for AF1 Windows operator packaging + Chromium runtime
readiness deliverables:

| Deliverable | Assignee | Status | Files audited |
|---|---|---|---|
| AF1-A (t_c2166ace) | sna-frontend-workbench | Complete | `apps/desktop/src/App.tsx`, `apps/desktop/src/App.test.ts` |
| AF1-B1 (t_d89c4c31) | sna-browser-cdp | Complete | `apps/desktop/electron/runtime-provisioning-precheck.ts`, `apps/desktop/electron/runtime-provisioning-precheck.test.ts`, `apps/desktop/electron/main.ts` |
| AF1-C (t_e96bb34f) | sna-release-docs | Complete | `docs/test/windows-clean-machine-validation-2026-06-07.md` |

**Non-goals:** Live ServiceNow inspection, network activity, testing diagnostic overlay
functionality (QA covers that).

---

## 2. Mandatory gates

| Gate | Result |
|---|---|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (adapters 95/95, CLI 55/55, desktop 122/122, core packages) |
| `pnpm privacy:scan` | PASS (273 files) |

---

## 3. Acceptance criteria

### AC#1 — No secrets/credentials/cookies/sessions/storage state/HAR/screenshots/ticket IDs/sys_ids/customer names/assignment groups/raw ServiceNow URLs

**Verdict: PASS**

- **AF1-A (diagnostic overlay):** `sanitizeOperatorDiagnosticText()` (App.tsx:7022-7040)
  applies 16 regex-based redaction rules covering: SHA256 fingerprints, hex
  fingerprints, authorization headers, API keys/tokens/secrets/passwords/cookies/
  session/auth markers, CDP/DevTools references, HTTP/WS URLs, localhost/CDP
  endpoints, ServiceNow hostnames, domain+path URLs, Windows drive paths, UNC
  paths, and Unix absolute paths. All redacted to `[REDACTED_*]` sentinels.

- **AF1-A tests:** `App.test.ts` lines 613-704 verify redaction of: raw CDP
  endpoints (`127.0.0.1:54656`), absolute paths, ServiceNow-like hosts
  (`qa.service-now.example.invalid`), authorization headers, session IDs,
  cookies, passwords, API keys, bare 64-char hex fingerprints. Assertions confirm
  `[REDACTED_URL]`, `[REDACTED_PATH]`, `[REDACTED_SECRET]`,
  `[REDACTED_FINGERPRINT]`, `[REDACTED_HOST]` appear in output and raw values
  do NOT appear.

- **AF1-B1 (main process):** `sanitizeLaunchForRenderer()` (main.ts:361-373)
  strips CDP endpoint from launch responses before renderer exposure. URL args in
  command preview are replaced with `[REDACTED_SERVICE_NOW_TARGET]`. Autofill
  responses strip `pageFingerprint` (main.ts:218, 264). CDP endpoint stored in
  main-process-only variable (main.ts:35-45), renderer never receives it.

- **AF1-C (runbook):** §6 "What Alan should record" explicitly prohibits
  screenshots, cookies, sessions, HAR, storage state, raw ServiceNow URLs, ticket
  IDs, sys_ids, requester names, assignment groups, credentials, tokens, and
  approval phrases. §8 safety table enumerates all forbidden actions.

### AC#2 — Diagnostic overlay sanitizes all paths — no raw home directories, no real ServiceNow URLs, no credentials in "Copy diagnostic" text

**Verdict: PASS**

- "Copy diagnostic" button (App.tsx:7619-7625) calls `handleCopyDiagnostic`
  (App.tsx:7442-7451) which constructs clipboard text from `sanitizedReason`
  (already passed through `sanitizeOperatorDiagnosticText()`), a static `nextStep`
  string, and a sanitized log path. No raw paths, URLs, or credentials reach the
  clipboard.

- Diagnostic overlay headings/reasons use env-var-style paths:
  `%LOCALAPPDATA%\ServiceNowAutomation` (App.tsx:1785). No hardcoded user
  home directories.

### AC#3 — Runtime precheck error payload contains only sanitized values: `%LOCALAPPDATA%\ServiceNowAutomation\...` (env-var-style path), no hardcoded user names or real absolute paths

**Verdict: PASS**

- `runtime-provisioning-precheck.ts` constructs the runtime path dynamically:
  `join(localAppData, "ServiceNowAutomation", "Runtime", "Chromium", "chrome.exe")`.
  Uses `process.env.LOCALAPPDATA` (injectable via options), never hardcodes an
  absolute path or username.

- Blocked reason is a static string `"dedicated-browser-runtime-missing"` — not
  a path. Renderer maps this to user-friendly text via
  `operatorRuntimeBlockedReasonDetails()` (App.tsx:7043-7054).

- Tests use `C:\Users\testuser\AppData\Local` — synthetic, not a real username.

### AC#4 — No daily Chrome/Edge path introduced as a fallback

**Verdict: PASS**

- All `chrome.exe` references across the AF1 codebase point exclusively to
  `%LOCALAPPDATA%\ServiceNowAutomation\Runtime\Chromium\chrome.exe` — the
  tool-owned runtime path.

- Zero references to: `Program Files\Google\Chrome`, `Program Files
  (x86)\Microsoft\Edge`, default user profile paths, or daily browser paths.

- Provisioner (chromium-provisioner.ts) extracts Chrome for Testing into the
  same tool-owned directory; no system browser path fallback.

### AC#5 — Auto-provisioning (B2) downloads only from official Google Chrome for Testing endpoint, and only after explicit user confirmation

**Verdict: PASS**

- `resolveChromeForTestingDownloadUrl()` (chromium-provisioner.ts:131-156) fetches
  metadata from:
  `https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json`
  and extracts the official win64 download URL from the Stable channel.

- Renderer shows an explicit confirmation dialog before downloading
  (App.tsx:7534-7558):
  - State: `provisionState === "confirming"` triggers the dialog
  - Text: "This will download the latest stable Chrome for Testing (approx 150 MB)
    from the official Google metadata endpoint and install it at the tool-owned
    runtime path. No ServiceNow action will be taken."
  - Buttons: "Download and install" (confirm) / "Cancel" (cancel)
  - No download proceeds without clicking "Download and install"

### AC#6 — All four mandatory gates pass, including `pnpm privacy:scan`

**Verdict: PASS**

All gates pass (see §2). Privacy scan reports: `TRACKED_PRIVACY_SCAN_PASS files=273`.

### AC#7 — Clear approve / fix / blocked conclusion

**Verdict: APPROVE**

All seven acceptance criteria are met. No blocking issues found.

---

## 4. Non-blocking observations

1. **WSL UNC path in release handoff panel.** App.tsx lines 4018 and 4101 expose
   Alan's WSL UNC path (`\\wsl.localhost\Ubuntu-Compact\home\alanxwsl\...`) in the
   release-readiness handoff UI and its "Copy path" button. The same path appears
   in the AF1-C runbook (§3). This is intentional operational content for Alan's
   own use — it is not a ServiceNow URL, credential, ticket ID, or customer data —
   and falls outside the explicitly enumerated AC#1 categories. Consider using a
   placeholder or env-var-based path in a future UI polish pass.

2. **Handoff UNC path bypasses sanitizer.** The "Copy path" button at line 4101
   writes directly to `navigator.clipboard.writeText()` without passing through
   `sanitizeOperatorDiagnosticText()`. This is in the release handoff panel (AE
   deliverable), not the AF1 diagnostic overlay. The path is an operational asset
   Alan explicitly needs to copy; no remediation required for AF1.

---

## 5. Evidence reviewed

| File | Lines | What was checked |
|---|---|---|
| `apps/desktop/src/App.tsx` | 1-7998 | Diagnostic sanitizer function (L7022-7040), Copy diagnostic handler (L7442-7451), blocked reason mapping (L7043-7054), provision confirmation dialog (L7534-7558), safety boundary copy |
| `apps/desktop/src/App.test.ts` | 595-754 | Redaction test cases (launch blocked, verify/autofill blocked), CDP endpoint exclusion, fingerprint exclusion, safety boundary assertions |
| `apps/desktop/electron/runtime-provisioning-precheck.ts` | 1-24 | Dynamic path construction from env var, static blocked reason string, no hardcoded paths |
| `apps/desktop/electron/runtime-provisioning-precheck.test.ts` | 1-71 | Test usernames (`testuser`), path normalization, Windows/non-Windows platform coverage |
| `apps/desktop/electron/main.ts` | 1-402 | CDP endpoint isolation, renderer response sanitization, fingerprint stripping, provision handler, IPC safety gates, blocked response safety flags |
| `apps/desktop/electron/chromium-provisioner.ts` | 1-230 | Official Chrome for Testing endpoint URL, metadata fetch, win64 extraction, no alternative download sources |
| `docs/test/windows-clean-machine-validation-2026-06-07.md` | 1-365 | Privacy recording rules (§6), safety table (§8), pass/fail criteria (§7) |

---

## 6. Verdict

**APPROVE — no blocking issues.**

All seven acceptance criteria are met. All four mandatory gates pass. The three
AF1 deliverables (startup diagnostics overlay, runtime provisioning precheck, and
clean-machine validation runbook) are privacy-safe for downstream AF2 QA acceptance
and AF4 release summary.

Downstream tasks unblocked: AF2 QA (t_e7a6e342), AF4 summary (t_b5f480c4).
