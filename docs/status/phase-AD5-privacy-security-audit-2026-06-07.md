# Phase AD5 — Privacy/security audit for AD polish

**Date/time:** 2026-06-07 01:30 UTC  
**Auditor:** sna-privacy-security  
**Scope:** AD1–AD3 changes (no AD4 code/docs found in repo)  
**Deliverable:** This document  

---

## VERDICT: APPROVE — no blocking issues

---

## 1. Scope audited

| Phase | Commit | What changed | Type |
|-------|--------|-------------|------|
| AD1 | `bb05b02` | Windows clean-machine runbook + status doc | Docs only |
| AD2 | `cd4c14c` | CDP empty-state UX spec | Docs only |
| AD3 | `a3143a0` | CDP readiness chip + center placeholders | Code + docs |

### AD1 (bb05b02)
- `docs/test/windows-clean-machine-validation-2026-06-07.md` (321 lines) — runbook
- `docs/status/phase-AD1-windows-clean-machine-runbook-2026-06-07.md` (177 lines) — status
- No code changes. Runbook explicitly documents safety boundaries (§6 record/not-record, §8 what not to test, Appendix B safety boundaries).

### AD2 (cd4c14c)
- `docs/status/phase-AD2-cdp-empty-state-ux-spec-2026-06-07.md` (390 lines) — UX spec
- No code changes. Spec explicitly rules out endpoint/host/port exposure (§7 rules for browser/CDP status: "never show endpoint details, host, port, raw URL, or fingerprint").

### AD3 (a3143a0)
- `apps/desktop/src/App.tsx` — +100/-1 lines: CDP chip + center empty/loading/error states
- `apps/desktop/src/styles.css` — +49 lines: visual styling only
- `apps/desktop/src/App.test.ts` — +74 lines: 7 new tests
- `docs/status/phase-AD3-cdp-empty-state-implementation-2026-06-07.md` — 55 lines: status

---

## 2. Gate results (current HEAD a3143a0)

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (99 desktop, 55 CLI = 154 total) |
| `pnpm privacy:scan` | PASS (262 tracked files) |

---

## 3. Privacy/security findings

### 3.1 CDP readiness chip — endpoint leakage audit

**Finding: CLEAN.** The CDP chip renders state labels only:

| State | Rendered text | Class |
|-------|--------------|-------|
| disconnected | "Browser: disconnected" | `.browser-status-chip.disconnected` |
| connecting | "Browser: connecting" | `.browser-status-chip.connecting` |
| connected | "Browser: connected" | `.browser-status-chip.connected` |
| error | "Browser: error" | `.browser-status-chip.error` |

- `aria-label` is `"Browser state: {state}"` — no endpoint/host/port
- State derivation uses internal boolean flags only (`operatorBusyAction`, `operatorCdpReady`, `operatorLastResponse?.launch?.blockedReason` truthiness)
- No raw URLs, no WebSocket endpoints, no CDP JSON endpoints, no host:port strings
- `blockedReason` is tested for truthiness only; the reason string is never rendered in the chip

### 3.2 Center empty/loading/error states — data exposure audit

**Finding: CLEAN.** All placeholder text is generic:

- Empty: "Select a source from the left queue to begin." etc.
- Loading: "Preparing source content...", "Drafting Incident...", "Normalizing source content..." etc.
- Error: "Source preparation encountered an issue." etc.

No real customer data, ticket IDs, sys_ids, or ServiceNow URLs in any placeholder.

### 3.3 Secret patterns scan

**Finding: CLEAN.** Grep of full AD diff for `api_key|password|secret|token|credential|Bearer|Authorization` returned only the existing privacy test assertion that verifies these are NOT present.

### 3.4 ServiceNow URL leakage

**Finding: CLEAN.** Grep for `servicenow.com|service-now.com|instance` in the diff returned zero matches (filtered for product-name false positives).

### 3.5 Capability drift

**Finding: NONE.** AD changes introduce no new runtime actions, no new API calls, no new browser operations, no new write paths. All changes are UI display only:
- CDP chip: reads existing state, renders label
- Center placeholders: reads existing state, renders placeholder text

### 3.6 Runbook privacy audit (AD1)

**Finding: CLEAN.** The runbook:
- Explicitly lists what NOT to record (§6: no screenshots of real SN pages, no cookies/sessions/HAR, no raw URLs/ticket IDs/sys_ids, no credentials)
- Lists what NOT to test (§8: no real SN login, no Save/Submit/Update/Resolve/Close, no GitHub push/merge)
- Instructs "Do not retry with real ServiceNow after a failure. All operations here are local" (§9)
- UNC path references local WSL filesystem only (internal operator path, not a service endpoint)

### 3.7 AD2 UX spec audit

**Finding: CLEAN.** Spec includes explicit rules:
- "never show endpoint details, host, port, raw URL, or fingerprint" (§7)
- "do not imply any save / submit / update / resolve / close action exists" (§8)
- "any raw endpoint details / raw ServiceNow URLs or ticket IDs / any save/submit/close language" in §9 "What to avoid"

---

## 4. Blocking issues

**None.**

---

## 5. Non-blocking observations

1. **No AD4 phase found.** The task body references "AD1-AD4 changes" but only AD1-AD3 exist in the repo. The parent task (t_3c1f8e71) completed AD3. No AD4 commit, doc, or artifact was found. This is not a security concern — all actual changes are audited.

2. **Runbook UNC path readability.** The runbook uses `\\wsl.localhost\Ubuntu-Compact\...` which is an internal WSL path. This is acceptable for the operator (Alan) but is WSL-specific. Not a privacy concern.

3. **CDP state derivation.** The `centerState` useMemo includes a fallback to `initialCenterState` prop for testability. In production this prop is not passed, so state derives from runtime actions. This is correct but subtle — manual smoke testing recommended per AD3 doc.

---

## 6. Boundary statement

This audit reviewed local-only repo artifacts: git diff, source files, docs, and test output. No real ServiceNow login, browser operation, API write, Save/Submit/Update/Resolve/Close action, attachment upload, Microsoft Graph/Excel Web write, push, merge, tag, GitHub Release, or PR creation was performed.

No screenshots, HAR, traces, cookies, storage state, or credentials were captured or referenced.

---

## 7. Approval

**VERDICT: APPROVE.** All AD1-AD3 changes are privacy-clean. No blocking issues. All gates pass. CDP chip exposes no endpoint/host/port details. Center placeholders are generic. Runbook documents explicit safety boundaries. No capability drift.
