# Phase BL4 — Privacy/Security Audit — Screenshot UI/Content Fixes

Date: 2026-06-08 00:14
Auditor: sna-privacy-security (independent, no implementation authority)
Scope: BL2/BL3 changes before packaging/release
Branch: `next/post-release-operator-cockpit-ab-20260606`
Parent: BL2 (t_52a959fd) — UI/content fix implementation

## VERDICT: APPROVE

No blocking privacy or security issues found. All changes are UI copy/layout only.

---

## Audit Surfaces

### 1. Privacy Scan
- `pnpm privacy:scan` — **507 files pass** (clean)
- No false positives or suppressed matches

### 2. Git Diff Audit (3 files changed)

**Changed files:**
- `apps/desktop/src/App.tsx` — UI copy translations + layout reorder
- `apps/desktop/src/App.test.ts` — test assertions updated for new copy
- `apps/desktop/src/styles.css` — collapsible release section styles

**What changed:**
| Change | Safety implication |
|--------|-------------------|
| Hardcoded "SOURCES" → `{workbenchCopy.nav.sources}` (4 languages) | Copy-only, no new data surfaces |
| Hardcoded "WORK PRODUCT" → `{workbenchCopy.workProduct}` (4 languages) | Copy-only |
| "PO Re-Acceptance Checklist" → "PO re-acceptance checklist" | Casing fix |
| Release readiness wrapped in `<details>` collapsible | Layout-only, no runtime change |
| Workbench cards reordered to spec order | Pure JSX reorder — same components, same data, different position |
| Engineering-heavy copy replaced (see table below) | Improved operator UX, no safety degradation |
| New `.release-package-details` CSS | Visual styling only |

**Copy replacements reviewed:**

| Before | After | Assessment |
|--------|-------|-----------|
| `RELEASE READINESS HANDOFF` | `Release readiness` | Cleaner |
| `Alan should test this file first.` | `Open the current package first and verify it locally.` | Removes personal name, better guidance |
| `SOURCE OF TRUTH` | `Current package source` | Less absolute, more precise |
| `MANUAL CHECKLIST` | `Verification checklist` | Clearer |
| `LOCAL REPO HYGIENE + ARCHIVE DEMOTION` | `Local cleanup` | Less engineering-heavy |
| `WORKTREE ACCEPTANCE` | `Worktree review` | Less formal, same meaning |
| `LOCAL ACTIONS` | `Actions` | Cleaner |
| `No upload / PR / merge / tag / release` | `Local only` | Preserved safety, less engineering copy |

### 3. Leakage Scan — Targeted grep on full diff

**Scan targets:**
- ServiceNow hosts/URLs: **CLEAN** — no matches
- Ticket IDs (INC/TASK/REQ/RITM): **CLEAN** — no matches
- sys_id, sysId, sys_: **CLEAN** — no matches
- Credentials, tokens, cookies, sessions: **CLEAN** — no matches
- HAR, trace, screenshots, storage-state: **CLEAN** — no matches
- Customer names, emails, PII: **CLEAN** — no matches
- Endpoints, ports, CDP URIs: **CLEAN** — no matches

The only host-like match is `\\wsl.localhost` in a test assertion — this is a local WSL filesystem path reference, not a ServiceNow endpoint. Acceptable.

### 4. Write-Capability Drift Audit

**Checked for:**
- Save/Submit/Update/Resolve/Close automation: **NONE INTRODUCED**
- Browser automation additions: **NONE**
- API write additions: **NONE**
- Autofill scope expansion: **NONE**
- Safety-model weakening: **NONE**

The diff adds no new write paths, no new browser operations, no new API calls. All changes are JSX markup, translation entries, and CSS.

### 5. Demo Data Audit

**`demoManualPasteScenarios`** (6 scenarios in `packages/adapters/src/manual-paste.ts`):
- All explicitly marked "QA TEST ONLY", "Fake", "mock-only"
- No real ServiceNow identifiers, customer data, or credentials
- No real ticket content, no production references
- Acceptable for local demo/testing use

### 6. New Documentation Audit

- `docs/status/phase-BL1-...md`: Design spec — all examples are sanitized/fake
- `docs/status/phase-BL2-...md`: Implementation record — confirms safety posture
- Both docs: **CLEAN** of real ServiceNow data, PII, credentials

### 7. Screenshot Audit (user-provided)

Two screenshots reviewed (from user descriptions — detailed enough to audit):
- Screenshot 1 (`screenshot-1780840379462.png`): ServiceNow Automation app UI showing workbench layout, release readiness, and checklist cards. Content all appears to be demo/local UI.
- Screenshot 2 (`screenshot-1780840477952.png`): Same app, scroll position shows Teams note card with demo content about VPN/password issue, matching `demoManualPasteScenarios[0]`.

No real ServiceNow pages, ticket IDs, customer names, or credentials visible in screenshots. The "Teams 备注" card uses fake/demo content. No blocking issues.

---

## Gate Results

| Gate | Result |
|------|--------|
| `pnpm build` | PASS (verified by BL2) |
| `pnpm typecheck` | PASS (verified by BL2) |
| `pnpm test` | PASS (240 total: 185 desktop + 55 CLI) |
| `pnpm privacy:scan` | PASS (507 files) |

---

## Non-blocking Observations

1. **Test assertion for `wsl.localhost`**: The test `expect(output).toContain("\\\\\\\\wsl.localhost")` encodes a local WSL path check. This is acceptable — it tests local path display, not a remote endpoint. The doubled escaping is a JS string literal concern, not a privacy concern.

2. **Demo content in screenshots**: The "密码重置后 VPN 无法连接" card content matches demo scenario data. For a public release, ensure screenshots in docs/README use only clearly-labeled demo data.

3. **"AI drafts and fills allowed text fields only"**: This safety copy in the guided demo stepper is appropriate — it explicitly states the boundary. No action required.

---

## Remaining Risks

None identified. This is a copy/layout-only change set. No runtime behavior modification, no new data surfaces, no write-path expansion.

---

## Independence Statement

This audit was performed independently of implementation. The auditor (sna-privacy-security profile) did not participate in BL2 implementation and reviewed only the final diff, scan output, and documentation artifacts.
