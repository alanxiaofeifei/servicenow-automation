# Phase X3 — Privacy/security audit for current-HEAD RC artifact

**Date:** 2026-06-05
**Owner:** sna-privacy-security
**Branch:** `next/product-clarity-demo-polish-20260605`
**HEAD Commit:** `27770f1`

## Verdict: APPROVE

No blocking privacy or security issues found. No capability-drift detected.

---

## Scope

Audit Phase X1/X2 changes and the rebuilt Windows RC artifact for:
- Privacy leaks (real URLs, ticket IDs, sys_ids, credentials, customer data)
- Security concerns (forbidden files, unsafe code changes)
- Capability-drift (docs implying live ServiceNow/Graph/Excel write support)

## Phase X1 code audit (commit `ee85e17`)

**Changed files:**
- `apps/desktop/src/App.tsx` — 6 copy occurrences updated
- `apps/desktop/src/App.test.ts` — 2 test expectations updated

**Nature of changes:**
Purely cosmetic copy change. Old wording `"Start, Check Page, and Autofill"` replaced with current `"Start QA Chromium, Verify, and Autofill"` across en-US i18n, es-ES i18n, safety notes, evidence detail card, and safety constraints table.

**Safety assessment:**
- No runtime behavior changed
- No safety boundaries weakened
- No new paths added
- Test coverage maintained
- All 4 gates passed at commit time per Phase X1 status doc

## Phase X2 artifact audit (commit `27770f1`)

**Artifact:** `dist/release/servicenow-automation-windows-v0.1.0-rc.1.zip`
- SHA256: `16f32bcf07b69580a3f5b641619130b5173ea1b8b4a42f064fc831b3abcf8314` — verified matches
- Files: 86 (unchanged count from prior RC.1)
- Gitignored: all 3 dist/release files properly excluded from tracking

**Forbidden content scan:**
| Check | Result |
|-------|--------|
| Forbidden directories (`.git`, `.local`, `.auth`, `browser-profiles`, etc.) | PASS |
| Forbidden file types (`.har`, `.trace`, `.png`, `.sqlite`, `.log`, `.pem`, etc.) | PASS |
| Env/auth/credential files | PASS |
| Real ServiceNow URLs | PASS (only `localhost`/`127.0.0.1`/`example.invalid`) |
| Real ticket IDs / sys_ids | PASS |
| Customer/requester email addresses | PASS (only public Chromium license attributions) |
| Session/cookie/storage-state files | PASS |

**Email false positive:** `LICENSES.chromium.html` contains third-party open-source license attribution emails (e.g., `Todd.Miller@courtesan.com`, `ludovic.rousseau@free.fr`). These are public Chromium project contributors, not customer or employee data. Non-blocking.

**Safety-disclaimer false positives:** Terms like "automatic login", "ServiceNow API write", "production write", "storage-state", "ticket IDs" appear only in hard-stop / forbidden-action lists within safety disclaimers. These are precisely the safety boundaries, not capability claims.

## Capability-drift audit

| Check | Result |
|-------|--------|
| Docs imply real ServiceNow write support | PASS — all write mentions are in "stop/forbidden" context |
| Docs imply Microsoft Graph / Excel Web write | PASS — no such claims found |
| Docs imply production or production-shadow write | PASS — only in "forbidden" lists |
| Docs imply auto-submit / auto-login / bulk action | PASS — only in "forbidden" lists |
| START-HERE documents | PASS — explicit "No Save / Submit / Update / Resolve / Close automation" |

**Key safety phrases confirmed in RC docs:**
- `resources/docs/windows-operator-quickstart.md`: "It does not approve live ServiceNow operation or full-field autofill exposure."
- `resources/docs/windows-v0.1-rc-manual-test.md`: "It does not approve live ServiceNow operation."
- `START-HERE`: "No Save / Submit / Update / Resolve / Close automation." and "It does not approve live ServiceNow operation."

## Diff surface audit (W3 baseline → HEAD)

**Code files changed:** `apps/desktop/src/App.tsx` (12 lines), `apps/desktop/src/App.test.ts` (4 lines)
**Doc files added:** 2 status documents
**Total net change:** 8 code lines (cosmetic copy), 162 doc lines

No packages, scripts, runtime files, or configuration changed outside the two frontend files.

## Red zone verification

| Red zone operation | Status |
|--------------------|--------|
| GitHub Release created | No |
| Git tag pushed | No |
| Git push to remote | No |
| Real ServiceNow login/browser ops | No |
| Secrets/cookies/HAR/screenshots exposed | No |
| Real ticket data exposed | No |

Branch remains local-only ahead of origin (24 commits including Phase X). No remote operations performed.

## Standard gates

| Gate | Result |
|------|--------|
| `pnpm build` | PASS (confirmed in Phase X2) |
| `pnpm typecheck` | PASS (confirmed in Phase X2) |
| `pnpm test` | PASS (382 tests, confirmed in Phase X2) |
| `pnpm privacy:scan` | PASS (232 files, re-verified at audit time) |

## Non-blocking observations

1. **dist/release files are gitignored** — correct behavior for build artifacts. However, this means the RC zip is not tracked in git. Ensure Alan has the artifact available locally for Windows manual validation.

2. **LICENSES.chromium.html** — the bundled Electron/Chromium license file contains public contributor email addresses. This is standard for Electron packaging and is not a privacy concern, but worth noting for completeness.

3. **Phase X1/X2 status docs reference SHA256 values** — these are checksums of the RC artifact, not secrets. Safe to commit.

## Remaining risks

None identified. The current HEAD (commit `27770f1`) is safe for Alan manual validation on Windows.

## Files changed by this audit

- `docs/status/phase-X3-current-head-rc-artifact-privacy-security-audit-2026-06-05.md` — new audit report
