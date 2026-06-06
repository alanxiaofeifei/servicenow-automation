# Phase X4 — QA validation of current-HEAD artifact packet

**Date:** 2026-06-05
**Profile:** `sna-qa-acceptance`
**Branch:** `next/product-clarity-demo-polish-20260605`
**Reviewed HEAD:** `faa8322` (Phase X3 — privacy/security audit APPROVE)
**Status:** **PASS** — artifact consistent, all mandatory gates pass, checklist aligned

---

## Summary

Validated that the current-HEAD artifact packet (Windows RC zip, status docs, V1 checklist) remains internally consistent after Phase X1/X2/X3 changes. No regression or drift detected.

---

## Mandatory gates (re-run at X4)

| Gate | Result |
|------|--------|
| `pnpm build` (7 workspace projects) | ✅ PASS |
| `pnpm typecheck` (7 workspace projects) | ✅ PASS |
| `pnpm test` (382 tests, 29 test files) | ✅ PASS |
| `pnpm privacy:scan` (233 files) | ✅ PASS |

All four gates pass clean at current HEAD commit `faa8322`.

---

## Artifact verification

| Check | Result | Evidence |
|-------|--------|----------|
| Artifact exists on disk | ✅ YES | `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` (118 MB) |
| SHA256 matches X2/X3 records | ✅ MATCH | `16f32bcf07b69580a3f5b641619130b5173ea1b8b4a42f064fc831b3abcf8314` — same as X2 status doc and X3 audit |
| Checksum file present | ✅ YES | `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip.sha256` — content matches computed hash |
| START-HERE present | ✅ YES | `dist/release/servicenow-automation-windows-v0.1.0-rc.1-START-HERE-WINDOWS.txt` |
| Artifact gitignored | ✅ YES | `dist/release/` entries in `.gitignore` — binary not tracked |
| No stale artifact files | ✅ YES | Only 3 files in `dist/release/` (zip, sha256, START-HERE) |

Artifact is consistent from X2 rebuild (commit `27770f1`) through X3 audit (commit `faa8322`). The only change between X2 and HEAD is the X3 audit doc itself — no code changes.

---

## Known cosmetic issue: settings helper text

**Status: RESOLVED**

The V1 checklist (item §7, written at commit `da9f261`) noted that settings environment helper text still said old "Start, Check Page, and Autofill" wording. Phase X1 (commits `ee85e17` + `2c8d17e`) replaced all 8 occurrences with current "Start QA Chromium, Verify, and Autofill" wording across `App.tsx` and `App.test.ts`.

Verified at X4:
- **Old wording matches: 0** — no remaining "Start, Check Page, and Autofill" in any tracked TypeScript/JS/JSON file
- **New wording occurrences: 6** — confirmed across app en-US help text, collapsed hints, disabled-production reasons, environment descriptions, and evidence card text

This issue is fully resolved at current HEAD.

---

## V1 checklist review

Reviewed the V1 next-morning manual validation checklist (`phase-V1-next-morning-alan-manual-validation-checklist-2026-06-05.md`) against current-HEAD code and artifact:

| Checklist item | Status | Notes |
|---------------|--------|-------|
| §3 Bold Summary — 10 checks | ✅ CONSISTENT | All expected behavior matches code-level gating logic in App.tsx |
| §4.1 Startup and tool window | ✅ CONSISTENT | Three-column layout confirmed in DOM (App.tsx structure) |
| §4.2 Workbench card order | ✅ CONSISTENT | Order: source → summary → draft → guided path → KB → Excel queue — confirmed in App.tsx DOM and App.test.ts test assertions |
| §4.3 Demo-polish labels | ✅ CONSISTENT | Labels use "Start QA Chromium", "Verify current Incident", "Autofill current Incident" — confirmed in App.tsx i18n and test expectations |
| §4.4 Button gating | ✅ CONSISTENT | Gating logic in App.tsx: Start QA Chromium enabled at startup; Verify disabled until CDP ready; Autofill disabled until Verify succeeds |
| §4.5 Safety features | ✅ CONSISTENT | Safety text "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow." present; no Save/Submit/Update/Resolve/Close buttons on draft |
| §4.6 Guided Review Path | ✅ CONSISTENT | 6-step guide matches; start-over present |
| §4.7 KB recommendations | ✅ CONSISTENT | Local/demo KB with instruction text |
| §4.8 Monthly Excel fill queue | ✅ CONSISTENT | Queue badge, local-only, no real Excel writes |
| §5 Privacy/security status | ✅ UPDATED | Privacy scan now 233 files (up from 225 at V1 time due to Phase X docs) |

**No checklist updates needed** — all V1 expectations remain accurate against current code. The only delta is privacy scan file count (225→233), which is expected due to new Phase X status docs.

---

## What Alan should test

Alan should follow the V1 checklist (§3 bold summary, or §4 detailed walkthrough) using either:

1. **Dev build**: `pnpm desktop:dev` (no artifact rebuild needed)
2. **RC artifact**: Double-click `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip` → extract → run `ServiceNow Automation.exe`

Priority checks (non-technical, product-owner perspective):
- Three-column UI opens cleanly
- Button labels match demo-polish wording (Start QA Chromium / Verify current Incident / Autofill current Incident)
- Disabled reasons are in plain language (not technical CDP error messages)
- Workbench card order matches the canonical 6-card stack
- Safety text is visible and clear
- Incident draft has no Save/Submit/Update/Resolve/Close buttons

---

## What NOT to test

- ❌ No real ServiceNow login or browser operations — this is a local demo/text-field-assistance tool
- ❌ No Save/Submit/Update/Resolve/Close — those are safety-gated and would block
- ❌ No real Excel write — the monthly fill queue is a local UI mock
- ❌ No real Teams/Outlook ingestion — source items use demo/fake data
- ❌ No Git push/merge/release — branch is local-only; 24 commits ahead of origin
- ❌ No Windows installer/uninstaller test — RC artifact is a portable zip
- ❌ No performance or load testing — not scoped

---

## Privacy/security status

Privacy scan **PASS** on 233 tracked files. No real ServiceNow hosts, customer data, credentials, approval phrases, or write-capability claims found. Same clean status as X3 audit. The file count increase (232→233) is the X4 status doc itself.

Artifact SHA256 verified: `16f32bcf07b69580a3f5b641619130b5173ea1b8b4a42f064fc831b3abcf8314` — unchanged from X2 rebuild and X3 audit.

---

## BLOCKERS

**None.** All gates pass, artifact is consistent, V1 checklist is accurate, and the known cosmetic helper-text issue is resolved.

---

## Verdict

```
Phase X4 — QA validation of current-HEAD artifact packet
Mandatory gates:  all PASS (build ✓ typecheck ✓ test ✓ privacy ✓)
Artifact SHA256:  consistent with X2/X3 records ✓
Old helper text:  0 occurrences remaining ✓
V1 checklist:     aligned with current code ✓

VERDICT: PASS

Next step for Alan: Manual product validation using the V1 checklist
```
