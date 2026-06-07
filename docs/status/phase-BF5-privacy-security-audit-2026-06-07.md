# Phase BF5 — Privacy/Security Audit

**Date:** 2026-06-07
**HEAD:** `019c502`
**Profile:** `sna-privacy-security`
**Task:** `t_4ef7e792`
**Parent scope:** BF1 — BE6 Package Restoration and Validation Readiness

---

## 0. Preflight

**Goal:** Perform privacy/security audit for BF1-defined scope — verify BF1/BF2/BF3 work stays local-only and does not leak sensitive data.

**Known facts:**
- BF1 defined scope as BE6 package restoration + validation readiness (documentation and packaging only)
- BF2 produced UX/copy spec for package-specific START-HERE and runbook refresh
- BF3 implemented: rebuilt BE6 package, refreshed runbook bd6→be6, generated package-specific START-HERE, updated build script template
- No production code changes, no ServiceNow operations, no new features in BF scope

**Assumptions:** None — all evidence was independently gathered.

**Chosen approach:** Run all 4 gates independently. Review every BF3-changed file for sensitive markers. Scan for external write paths and ServiceNow automation. Verify BF1/BF2 docs for scope compliance.

**Files reviewed:**
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local-START-HERE-WINDOWS.txt`
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip.sha256`
- `dist/release/servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip`
- `docs/test/windows-clean-machine-validation-2026-06-07.md`
- `scripts/packaging/build-windows-rc.sh`
- `docs/status/phase-BF1-*.md`
- `docs/status/phase-BF2-*.md`
- `docs/status/phase-BF3-*.md`

---

## 1. Gate results (independently verified)

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (224 app-level: 169 desktop + 55 cli; package-level tests also pass) |
| `pnpm privacy:scan` | PASS (288 files) |

All 4 gates pass independently — no regression, no new violations.

---

## 2. BF3 deliverable review

### 2.1 Deliverable A — BE6 Windows package

| Property | Value |
|----------|-------|
| Package name | `servicenow-automation-windows-v0.1.0-rc.1-be6-20260607-local.zip` |
| ZIP exists at UNC path | YES |
| SHA256 sidecar exists | YES |
| SHA256 | `b1383e9501d82aac0840a2c28c73e422566fc845956ae4da4a90987ca9097357` |
| SHA256 matches sidecar | VERIFIED |

No sensitive data in ZIP path or SHA256. Hash change from `bf7d0e79` to `b1383e95` is documented (re-packing with package-specific START-HERE).

### 2.2 Deliverable B — Runbook refresh

**File:** `docs/test/windows-clean-machine-validation-2026-06-07.md`

- `bd6` references: **0** (all replaced with `be6`)
- SHA256: updated to `b1383e95...`
- Size: updated to `118,607,550 bytes`
- Gate count: updated to 459 tests
- UNC path: updated to `be6` package
- START-HERE reference: updated to be6-specific filename
- Structure and validation steps: unchanged

No sensitive data in runbook. All `sys_id`, `ticket IDs`, `requester names`, `assignment groups` mentions are in safety-prohibition lists (what NOT to paste/copy).

### 2.3 Deliverable C — Package-specific START-HERE

**File:** `dist/release/*-be6-*-START-HERE-WINDOWS.txt`

Contents verified:
- Package name and phase prefix (BE6)
- Windows UNC path (uses `wsl.localhost` — local-only)
- SHA-256 checksum
- P0 Re-Acceptance Checklist card reference
- Diagnostic overlay guidance
- Safety boundary reminder (No Save/Submit/Update/Resolve/Close)
- Privacy reminder (no raw URLs, ticket IDs, sys_ids, etc.)

UNC path sanitized: uses `wsl.localhost\Ubuntu-Compact\...` — WSL distro name is already known in project docs. No real ServiceNow hosts or credentials.

### 2.4 Build script template

**File:** `scripts/packaging/build-windows-rc.sh`

- `write_start_here()` upgraded to parameterized template with two-pass SHA256 injection
- No external network calls (no `fetch`, `axios`, `.post()`, `.put()`, `.patch()`)
- No ServiceNow API operations
- No ServiceNow URLs or hosts
- All `Save/Submit/Update/Resolve/Close` mentions are in safety-prohibition copy
- UNC path constructed from `wsl.localhost` — local-only

---

## 3. Sensitive marker scan

### 3.1 Scan methodology

Patterns scanned across all BF3-changed files:
- Real ServiceNow hosts (`service-now.com`, `servicenow.com`)
- Ticket IDs, sys_ids
- Credentials, tokens, secrets, API keys, passwords
- Cookies, sessions, storage-state
- HAR, trace, screenshots
- Requester names, assignment groups, real field values, customer names/emails
- External write paths (`fetch(`, `axios`, `.post(`, `.put(`, `.patch(`, API writes)

### 3.2 Results

| Pattern | Files with matches | Verdict |
|---------|-------------------|---------|
| `service-now.com` | 0 (in BF3-changed files) | CLEAN |
| `servicenow.com` | 0 (in BF3-changed files) | CLEAN |
| `sys_id`, `ticket ID` | START-HERE, runbook | SAFETY COPY — prohibition text only |
| `requester`, `assignment group` | START-HERE, runbook | SAFETY COPY — prohibition text only |
| `cookie`, `session` | START-HERE, runbook | SAFETY COPY — prohibition text only |
| `token`, `secret`, `password`, `credential` | Build script | SAFETY COPY — header comment + prohibition text |
| `Save`, `Submit`, `Update`, `Resolve`, `Close` | Build script | SAFETY COPY — "No Save / Submit / Update / Resolve / Close" |
| `fetch(`, `axios`, `.post(`, `.put(`, `.patch(` | Build script | CLEAN — none found |
| External URLs | All files | CLEAN — only `wsl.localhost` (local-only UNC path) |

### 3.3 Codebase-wide check

Extended scan across `apps/`, `packages/`, `scripts/`:
- All `service-now.com` matches: test denial paths (`.not.toContain("service-now.com")`) — safety tests verifying output does NOT contain ServiceNow URLs
- All `@servicenow-automation/` references: project's own package imports (not real ServiceNow)
- No new external write paths or ServiceNow API calls introduced

---

## 4. Scope compliance

### 4.1 BF1 scope definition

BF1 defined strict non-goals:
- [x] No production code changes
- [x] No new features, IPC handlers, behavioral changes
- [x] No ServiceNow login, browsing, API writes
- [x] No push, PR, merge, tag, GitHub Release, publish
- [x] No dist/release/ archive cleanup
- [x] No automatic validation execution

### 4.2 BF3 implementation compliance

BF3 delivered exactly what BF1+B(F2 specified:
- [x] BE6 package rebuilt with START-HERE inside archive
- [x] Runbook refreshed bd6→be6 (0 stale references remain)
- [x] Package-specific START-HERE per BF2 UX spec
- [x] Build script parameterized for future packages
- [x] All 4 gates pass
- [x] No scope creep — only documentation and packaging

### 4.3 External write path check

- No ServiceNow API writes in any changed file
- No Save/Submit/Update/Resolve/Close automation
- No Microsoft Graph/Excel Web writes
- No attachment upload
- No Teams/Outlook/phone ingestion
- No new cron jobs
- No GitHub push/PR/merge/tag/release/publish

---

## 5. Remaining risks (non-blocking)

1. **UNC path hardcodes `Ubuntu-Compact`:** The START-HERE and runbook UNC paths use `Ubuntu-Compact` as WSL distro name. If Alan's actual distro name differs, the UNC path is wrong. The BD3 dynamic WSL distro derivation was implemented for the app but the build-time UNC path is hardcoded. Non-blocking: this is a packaging default, not a privacy leak.

2. **SHA256 change transparency:** The ZIP was re-packed (START-HERE updated inside archive), changing SHA256 from `bf7d0e79` to `b1383e95`. Both sidecar and runbook reflect the new value. The old SHA256 is still visible in BF1's documentation but that document explicitly notes the old value is stale.

3. **Test count staleness:** Runbook lists 459 tests. This number will go stale as new tests are added. Non-blocking: test count is informational, not a security concern.

---

## 6. Verdict

**APPROVE — No blocking issues.**

**Blocking issues:** None.

**Evidence reviewed:**
- All 4 gates independently verified (build, typecheck, test, privacy:scan)
- All BF3-changed files reviewed for sensitive markers
- All matches are safety-prohibition text, not actual leakage
- No new external write paths or ServiceNow actions introduced
- UNC path is local-only (wsl.localhost)
- SHA256 change documented and reflected in all artifacts

**Required rework:** None.

**Non-blocking risks:** 3 (UNC path hardcoded distro name, SHA256 change transparency in BF1 doc, test count staleness).

---

*This document is local-only. No push, PR, merge, tag, release, or ServiceNow action was performed.*
