# Phase AB5 — Privacy/Security Audit for AB Polish

Date: 2026-06-06
Auditor: sna-privacy-security (automated Hermes profile)
Scope: AB3 local Workbench cockpit polish (commit `5b96032`), plus untracked AB1/AB2 spec docs
Board: servicenow-automation (kanban DB integrity restored)

## Verdict: APPROVE

No blocking issues found. All copy changes are cosmetic; no capability drift or real-data leakage detected.

---

## Evidence Reviewed

### 1. AB3 commit diff (`5b96032`)

**Files changed (3):**

| File | Changes | Type |
|------|---------|------|
| `apps/desktop/src/App.tsx` | +107/-13 | Translation catalog updates, JSX section labels, URL card label changes, empty-state helpers (24 new strings across 4 locales) |
| `apps/desktop/src/App.test.ts` | +2/-3 | Test expectation alignment with new URL card labels |
| `apps/desktop/src/styles.css` | +11/-0 | `.workbench-section-label` CSS |

**New copy audit (all locales EN/zh-CN/zh-TW/es-ES):**
- Section labels: "Loading feed", "Intake queue", "Todo list", "History", "Environment controls" — generic UI chrome, no data
- Empty-state helpers: "Select a source from the left queue to begin", etc. — instructional copy, no data
- URL card labels: "QA URL", "Dev URL", "Production URL" — generic field labels
- Browser status: "Browser: disconnected/connecting/connected/error" — generic status indicators
- Safety boundary labels: "Safety boundary", "Environment controls" — safety UI labels
- Card title: "Selected source detail" — minor wording change

**Capability drift check:**
- No new functions, IPC paths, API calls, browser interfaces, or write paths
- No Save/Submit/Update/Resolve/Close automation introduced
- No mock/demo clutter reintroduced
- AB3 implementation doc confirms: "Copy changes are cosmetic only — no runtime behavior changed"

### 2. Untracked AB1/AB2 spec docs

- `docs/status/phase-AB1-next-round-product-scope-2026-06-06.md` — scope definition only; 13 red-zone items explicitly excluded; no implementation
- `docs/status/phase-AB2-service-desk-cockpit-ux-spec-2026-06-06.md` — UX/copy design spec; no implementation; sanitized mockups attempted but failed (no artifacts persisted)

Both are docs-only spec documents. No real URLs, ticket IDs, sys_ids, credentials, or customer data found.

### 3. Privacy scan

```
pnpm privacy:scan → TRACKED_PRIVACY_SCAN_PASS files=249
```

All tracked files pass automated privacy scan (secrets patterns, ServiceNow identifiers, customer data fingerprints).

### 4. Targeted grep sweep

- **ServiceNow URL patterns:** 0 unexpected hits. The only matching pattern was a sanitized mock/test fixture host already covered by local tests; no real instance URL was present.
- **Ticket IDs (WN*/SD_China/etc):** 0 hits in source/docs
- **sys_id patterns:** 0 hits
- **Customer emails:** 0 hits
- **Credentials/secrets:** All hits are safety-policy copy ("Do not include credentials", "credentials denied") or demo scenario descriptions ("password reset" as an IT helpdesk topic — no real passwords)
- **SHA256 hashes found:** Artifact integrity verification hashes in release docs — legitimate, not secrets
- **Git commit SHAs:** Standard commit references in status docs — legitimate

### 5. Runtime/browser artifacts

- `.local/` directory (startup logs, video-analysis contact sheets) — all gitignored
- Startup log sample checked: no ServiceNow URLs, ticket IDs, or credentials
- No `chrome-data/`, `.chrome-user-data/`, or `~/.cache/servicenow-automation/` directories exist

### 6. Gate verification

| Gate | Result | Evidence |
|------|--------|----------|
| `pnpm privacy:scan` | PASS | 249 files clean |
| `pnpm test` | PASS | 147/147 (92 desktop + 55 cli), 6 files |
| `pnpm build` | Verified by AB3 doc | PASS (not re-run) |
| `pnpm typecheck` | Verified by AB3 doc | PASS (not re-run) |

---

## Blocking Issues

None.

---

## Non-Blocking Notes

1. **Untracked AB1/AB2 docs** — two spec documents exist as untracked files. They are docs-only and contain no sensitive data, but should be committed (or explicitly excluded) before the next phase.

2. **Empty-state helpers are defined but not rendered** — the 6 new empty-state strings per locale exist in the translation catalog, but no JSX renders them yet. This is documented in AB3 as intentional ("ready for future implementation"). No risk.

3. **`.local/` directory contains video-analysis contact sheets** — these are gitignored and pre-existing (May 2026). They are screenshots of ServiceNow workflows per historical phases. Not in AB3 scope. If retention becomes a concern, consider purging separately.

4. **Kanban DB corruption** — the `servicenow-automation` board's SQLite DB had a corrupt index (`row 374 missing from index idx_events_task`). This was recovered by dropping and recreating the index. Integrity now passes. Root cause may warrant investigation.

---

## Required Rework

None.

---

## Remaining Risks

- The AB1/AB2 untracked docs need a decision (commit or delete) before they create confusion
- The kanban DB corruption pattern (multiple historical `.bak` files from May 26) suggests an underlying issue that may recur

---

## Evidence Sanitization Confirmation

- No red-zone actions were performed during this audit
- No ServiceNow login, browser ops, API writes, or production access occurred
- No secrets, credentials, or real customer data were printed or committed
- All manual grep results were sanitized (hit counts only, no raw values)
