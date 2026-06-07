# Phase AG5 — Privacy/Security Audit: Repo Hygiene + Artifact Boundary Panel

**Date**: 2026-06-07
**Auditor**: `sna-privacy-security`
**Parent task**: t_8e2935c0 (AG3 — implementation)
**AG4 checklist**: phase-AG4-qa-acceptance-manual-checklist-2026-06-07.md
**Verdict**: **APPROVE** — no blocking privacy/security issues

---

## 1. Scope

This audit covers:
- The repo hygiene card implementation in the desktop workbench (AG3: App.tsx +47 lines, styles.css +151 lines, App.test.ts +28 lines)
- The AG4 QA acceptance checklist
- All AG-phase docs (AG1 scope, AG1 cleanup report, AG2 UX spec, AG3 implementation doc, AG4 checklist)
- Boundary confirmation: no secrets, raw identifiers, non-local URLs, or forbidden data

## 2. Automated Gates

All four required gates pass on current branch `next/post-release-operator-cockpit-ab-20260606`:

| Gate | Result | Evidence |
|---|---|---|
| `pnpm build` | PASS | 29 modules, 3 Electron bundles, 7 workspace projects |
| `pnpm typecheck` | PASS | All 7 workspace projects pass |
| `pnpm test` | PASS | 123 desktop tests (includes hygiene card test), all packages pass |
| `pnpm privacy:scan` | PASS | 288 tracked files, no violations |

## 3. Hygiene Card Audit (App.tsx lines 4112–4158)

### 3.1 Sensitive Data Scan — CLEAN

| Check | Result | Notes |
|---|---|---|
| Real ServiceNow host (`*.service-now.com`) | NONE | Zero occurrences in hygiene card region |
| `sys_id` / `sysparm` / token query params | NONE | Zero occurrences |
| Ticket IDs, customer names, assignment groups | NONE | Zero real identifiers |
| Credentials, passwords, API keys, secrets | NONE | Zero occurrences |
| Cookies, sessions, storage-state | NONE | Appear only in boundary/footer safety copy denying their presence |
| HAR, trace, screenshot references | NONE | Appear only in boundary safety copy |
| Real WSL/UNC paths with personal identifiers | NONE | All hygiene paths are generic: `dist/release/`, `.codegraph/`, `.worktrees/`, `.local/video-analysis/` |
| `fetch()`, axios network calls | NONE | Hygiene card is static JSX with zero network calls |
| Save/Submit/Update/Resolve/Close actions | NONE | No buttons, no event handlers beyond `<details>` toggle |
| Live ServiceNow login or browser automation | NONE | No DOM manipulation, no CDP, no browser launch |

### 3.2 Boundary Copy — VERIFIED

All boundary strings are present and explicit:

- Eyebrow: "Local only · No ServiceNow actions · No upload / PR / merge / tag / release"
- Footer chip: "Local only"
- Footer text: "This surface only reports local repository state. No live ServiceNow action is performed here. Disabled actions explain why they are unavailable."

### 3.3 Test Coverage — VERIFIED

The new test at App.test.ts:1645–1672 verifies:
- All 3 hygiene items render with correct state chips
- Boundary copy strings appear
- Card ordering is correct (handoff → hygiene → selected source)
- No sensitive strings leak into test expectations

### 3.4 Styles — CLEAN

styles.css lines 6807–6955: Only visual CSS classes (`.repo-hygiene-card`, `.repo-hygiene-state-chip`, etc.). No embedded URLs, credentials, or sensitive identifiers.

## 4. AG4 QA Acceptance Checklist — VERIFIED

The AG4 doc (phase-AG4-qa-acceptance-manual-checklist-2026-06-07.md) confirms:

- All 6 acceptance criteria (A1–A6) pass
- Safety/privacy section A5 explicitly checks for and confirms absence of: `service-now.com` URLs, `sys_id`, `password`, `credential`, `token`, `api_key`, `cookie`, `session`, `localStorage`, `fetch()`, axios calls, real ticket IDs, customer names, assignment groups
- No ServiceNow write actions in the card — static JSX with only a `<details>` toggle
- Verdict: PASS

## 5. AG Docs Audit — CLEAN

| Document | Sensitive Content | Verdict |
|---|---|---|
| AG1 scope | Local file paths only; no real ServiceNow references | CLEAN |
| AG1 cleanup report | Generic file names (`dist/release/`, `ab-20260607-local.zip`); no secrets | CLEAN |
| AG2 UX spec | Pure design spec; explicit "No ServiceNow actions" language throughout | CLEAN |
| AG3 implementation doc | Summarizes code changes; mentions only what sensitive data is NOT present | CLEAN |
| AG4 checklist | QA verification; confirms absence of all sensitive patterns in diff | CLEAN |

## 6. Non-Blocking Observations

### 6.1 Hardcoded hygiene state (data staleness)

The hygiene card uses hardcoded strings. It shows "Stale dist/release/ artifacts — Pending" with "9 files, 340 MB," but AG1-DelA (cleanup script) already removed those stale artifacts. The current repo state has only 5 files, 227 MB in `dist/release/`.

**Risk assessment**: This is a product accuracy concern, not a privacy/security vulnerability. The hardcoded data does not expose any secrets; it simply reflects pre-cleanup state. The AG3 doc already documents this limitation in its "Remaining Risks" section. Recommended: update the card strings in a future hygiene refresh phase to reflect post-AG1-cleanup reality.

### 6.2 Adjacent handoff card UNC path

The release-readiness handoff card (App.tsx line 4101, immediately before the hygiene card) contains a WSL UNC path for clipboard copy. This was already audited in Phase AE5 privacy/security audit and accepted. The path is a local-only operator convenience, not a secret, and the hygiene card itself contains no such paths.

## 7. Hard Safety Boundaries — CONFIRMED

All safety boundaries from the task spec are upheld:

- No real ServiceNow login, browser operation, or API writes
- No Save / Submit / Update / Resolve / Close
- No upload, push, PR, merge, tag, or release (audit is local-only)
- No Microsoft Graph / Excel Web
- No Teams/Outlook/phone ingestion
- No secrets, cookies, storage state, HAR, trace, screenshots, real URLs, ticket IDs, sys_id, requester, assignment group, or real field values exposed
- No recursive cron job creation/modification

## 8. Surgical Check

Only 3 files were changed in AG3 (App.tsx, styles.css, App.test.ts), totaling 226 net lines. All changes are scoped to the hygiene card implementation. No unrelated files were touched. No drive-by refactors. No safety weakening.

## 9. Verdict

**APPROVE** — No blocking privacy or security issues.

The repo hygiene + artifact boundary panel is a local-only, read-only JSX surface with no network calls, no ServiceNow references, no secrets, and explicit boundary copy. All 4 required gates pass. The AG4 QA acceptance checklist confirms all criteria met. The adjacent handoff card UNC path was previously audited and accepted.

### Evidence reviewed

- App.tsx hygiene card region (lines 4112–4158)
- styles.css repo-hygiene classes (lines 6807–6955)
- App.test.ts hygiene card test (lines 1645–1672)
- All AG-phase docs (AG1 scope, AG1 cleanup report, AG2 UX spec, AG3 implementation, AG4 checklist)
- Sensitive-pattern scans across all AG docs and source files
- All 4 automated gates (build, typecheck, test, privacy:scan)

### Required rework

None required for privacy/security.

### Non-blocking risks

- Hardcoded hygiene state is stale (pre-cleanup) — product concern, not security
- No live repo inspection — strings must be updated manually when repo state changes

### Next phase

This audit unblocks downstream work. Child task t_bceef47b (AG6 — Windows local package refresh) can proceed.
