# Phase BD5 — Privacy/Security Audit — Dynamic UNC Prefix

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-privacy-security`
**Task:** `t_1abf77ea`

---

## Verdict: APPROVE

No blocking privacy/security issues found. The dynamic UNC prefix derivation is clean, minimal, and closes the BC5 non-blocking observation about the hardcoded `Ubuntu-Compact` prefix.

---

## 1. Evidence Reviewed

### Source files examined

| File | Status | Review |
|------|--------|--------|
| `packages/adapters/src/wsl-utils.ts` | New | 18 lines — standalone utility, browser-safe |
| `packages/adapters/src/browser.ts` | Modified | Added re-export of `resolveWslDistroName` (1 line) |
| `apps/desktop/src/App.tsx` | Modified | Import at line 3, usage at line 8560, clipboard fix at line 4296 |
| `apps/desktop/out/renderer/assets/index-CokbQMhM.js` | Built artifact | Verified no `Ubuntu-Compact` literal remains |

### Gates independently verified

```
pnpm privacy:scan → PASS (288 files)
pnpm typecheck    → PASS (all 7 workspaces)
pnpm build        → PASS
pnpm test         → PASS (220 tests)
```

---

## 2. Audit Point Results

### ✅ Audit point 1: No raw WSL env var exposure

`wsl-utils.ts` reads `process.env.SDA_WSL_DISTRO` and `process.env.WSL_DISTRO_NAME` but never logs, prints, or exposes them. The env var value flows directly into the UNC path string returned by `formatPackagePathForDisplay()`.

- **No `console.log`** of the distro name — confirmed by grep across all source and test files (0 matches).
- **No test output exposure** — `wsl-utils.ts` has no dedicated test file; the existing `browser-session.test.ts` uses only the mock value `"Ubuntu-K9"` with proper save/restore hygiene (lines 587-623).
- **No clipboard exposure** of the raw env var — only the final constructed UNC path reaches the clipboard via `navigator.clipboard.writeText()` at line 4301.

### ✅ Audit point 2: No ServiceNow data introduced

`wsl-utils.ts` has zero references to ServiceNow — no URLs, sys_ids, ticket IDs, credentials, assignment groups, or requester names. The file only touches WSL environment variables.

The changes to `App.tsx` (import + function usage + clipboard fix) do not introduce any new ServiceNow surface.

### ✅ Audit point 3: No new IPC channels

BD3 changes are purely renderer-side:
- `wsl-utils.ts` — no IPC, no Node.js imports
- `browser.ts` — re-export only
- `App.tsx` — import from `@servicenow-automation/adapters/browser` (existing package boundary, no new IPC)

The built renderer bundle correctly inlines `resolveWslDistroName()` without any IPC bridge calls.

### ✅ Audit point 4: No new external network calls

`wsl-utils.ts` reads only `process.env` and performs string validation with a regex. No `fetch()`, `XMLHttpRequest`, WebSocket, or any network API.

### ✅ Audit point 5: Fallback `"WSL"` leaks no system information

When `SDA_WSL_DISTRO` and `WSL_DISTRO_NAME` are both unset (e.g., not running inside WSL), the fallback is the literal string `"WSL"`. This produces a path like `\\wsl.localhost\WSL\...` — visibly identifiable as a fallback without revealing the hostname, username, home directory, IP address, or any other system information.

### ✅ Audit point 6: Clipboard behavior remains safe

Line 4296 now calls `formatPackagePathForDisplay(packageMetadata.path)` directly — the old `replace()` workaround stripping the hardcoded prefix is removed. The clipboard writes a UNC filesystem path, not a command, URL, or script. No security regression.

---

## 3. Safety Boundaries — Verified

| Boundary | Status |
|----------|--------|
| No real ServiceNow login, browsing, or API writes | ✅ Confirmed |
| No Save / Submit / Update / Resolve / Close | ✅ Confirmed |
| No screenshots, HAR, trace, cookies, storage-state, secrets | ✅ Confirmed |
| No raw URLs, ticket IDs, sys_ids, requester names, assignment groups | ✅ Confirmed |
| No push, PR, merge, tag, release | ✅ Not in scope of this code |
| No new IPC handlers | ✅ Confirmed |
| No new external dependencies | ✅ Confirmed |

---

## 4. BC5 Non-Blocking Observation — Resolved

BC5 (phase-BC5-privacy-security-checklist-launcher-and-runbook-2026-06-07.md, section 3.2) noted:

> "UNC path hardcoded in `formatPackagePathForDisplay()` — future work should consider making this configurable or deriving it from the environment."

BD3 has resolved this: the UNC prefix is now derived from runtime environment variables via `resolveWslDistroName()` imported from `@servicenow-automation/adapters/browser`.

---

## 5. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `main.js` has its own `resolveWslDistroName()` copy (line 5908, from `browser-session.ts`) — two implementations of the same logic | LOW | `main.js` is the Electron main process bundle (Node.js). Its `resolveWslDistroName()` is the pre-existing `browser-session.ts` code with full `wslpath` integration. This is not a new code path — it's the existing adapter that `wsl-utils.ts` was derived from. Both implementations share identical logic and regex validation. |
| No unit test for `wsl-utils.ts` specifically | LOW | The function is exercised indirectly through `App.test.ts` (97 tests pass, including the UNC path assertion at line 1652). The identical logic in `browser-session.ts` has dedicated tests in `browser-session.test.ts` (20+ tests with mock distro names). |
| Fallback `"WSL"` could be misread as a real distro | LOW | The string `"WSL"` is three uppercase letters with no separators. Real WSL distro names typically include camelCase (`Ubuntu`), hyphens (`Ubuntu-Compact`), or underscores — making the fallback visually distinguishable. |

---

## 6. Required Rework

**None.** No blocking security or privacy issues found.

---

## 7. Status

```
Phase BD5 — Privacy/Security Audit — Dynamic UNC Prefix

State: COMPLETE
Verdict: APPROVE (no blocking issues)
Gates: privacy:scan PASS (288), typecheck PASS, build PASS, test PASS (220)
Files audited: 3 source files + 1 built artifact
ServiceNow data leaked: NONE
Credentials leaked: NONE
BC5 observation resolved: YES (hardcoded UNC prefix → dynamic derivation)
Blocking issues: NONE
```

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
