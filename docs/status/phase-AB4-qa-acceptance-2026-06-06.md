# Phase AB4 — QA acceptance for AB3 Workbench Cockpit Polish

Date: 2026-06-06
Assigned: sna-qa-acceptance
Commit under test: `5b96032` on `next/post-release-operator-cockpit-ab-20260606`
Parent: Phase AB3

## Verdict: LOCAL ACCEPTANCE PASS (manual validation checklist follows)

---

## Automated gate results

| Gate | Result |
|------|--------|
| `pnpm build` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (92 desktop + 95 adapters + 55 cli) |
| `pnpm privacy:scan` | PASS (247 files) |

---

## AB3 scope summary

AB3 implemented the AB2-approved copy/polish changes on the three-column workbench. Changes are cosmetic only — no behavioral, safety, or runtime logic changed.

### What was implemented

| Change | Files |
|--------|-------|
| `Selected source` → `Selected source detail` (all 4 locales) | App.tsx |
| Guided demo stepper eyebrow: `Guided review path` → `Guided path` | App.tsx |
| URL settings card labels: `QA target` → `QA URL`, `Production target` → `Production URL`, added `Dev URL` | App.tsx |
| Left sidebar section labels: `Loading feed`, `Intake queue`, `Todo list` (all 4 locales) | App.tsx, styles.css |
| Runtime status labels: `Browser: disconnected/connecting/connected/error`, `Safety boundary`, `Environment controls` (all 4 locales) | App.tsx |
| Empty state helpers for center cards (6 per locale, 24 total) | App.tsx |
| Fixed pre-existing test failure for URL label change | App.test.ts |
| `.workbench-section-label` CSS block | styles.css |

### What was NOT implemented (translation keys defined but not wired to JSX)

These are **prepared for future code** but don't render yet — no regression possible:

- `cards.*Empty` (6 keys × 4 locales) — empty state helpers for center cards
- `nav.historySection` — left sidebar section
- `runtime.browser*` (4 keys × 4 locales) — browser status labels
- `runtime.safetyBoundaryTitle` (needs a UI container)
- `runtime.environmentControlsTitle` (needs a UI container)

---

## Test coverage assessment

### Adequate

| Area | Test coverage | Assessment |
|------|--------------|------------|
| URL label rename (`QA URL`, `Production URL`) | ✅ lines 783-784 | Explicit assertions pass |
| Pre-existing failure fix | ✅ test now expects new strings | Correct |
| Section labels `Loading feed`, `Intake queue`, `Todo list` | ⚠️ rendered in JSX, no explicit assertion | Cosmetic only; low regression risk |

### Gaps (no new tests added — acceptable per AB3 scope)

| Gap | Why acceptable |
|-----|---------------|
| `Selected source detail` label | Renamed from existing key; no behavioral impact |
| `Dev URL` label | New label matching existing URL card pattern; identical rendering |
| `Guided path` eyebrow | Stepper eyebrow string only; no behavioral impact |
| Empty state helpers | Translations only, not wired to JSX — no UI to test |
| Browser/safety/env labels | Translations only, not yet rendered in JSX |

**Conclusion**: No new regression tests warranted. AB3 is cosmetic copy only. The existing test suite covers the critical change (URL labels) and the test was correctly updated to match.

---

## Alan manual validation checklist

Alan should verify these manually using the Windows desktop app by launching `sda.exe` (start menu or double-click):

### 1. Left sidebar section labels

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Open workbench | Left column shows section headers: `Loading feed` → `Intake queue` → `Todo list` | □ |
| Switch to 中文 language | Sections show: `加载动态` → `受理队列` → `待办列表` | □ |
| Switch to 繁體中文 | Sections show: `載入動態` → `受理佇列` → `待辦清單` | □ |
| Switch to Español | Sections show: `Feed de carga` → `Cola de entrada` → `Lista de tareas` | □ |

### 2. URL settings panel

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Open Settings or scroll to URL cards | Three cards: `QA URL`, `Dev URL`, `Production URL` | □ |
| Verify no card still says `QA target` or `Production target` | Old labels absent | □ |

### 3. Center card titles

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| View center stack | Card titled `Selected source detail` (English) | □ |
| The old `Selected source` label | Does not appear anywhere | □ |

### 4. Guided demo path

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Locate guided demo path section | Eyebrow/header says `Guided path` (not `Guided review path`) | □ |

### 5. Language switcher integrity

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Click English/中文/繁體/Español | All UI labels switch to matching locale | □ |
| All section labels, button text, card titles | Translations appear complete (no missing keys showing raw English) | □ |

### 6. Runtime actions unchanged

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| `Start QA Chromium` button | Same label, same position, same behavior | □ |
| `Verify current Incident` button | Same label, same position, same gating | □ |
| `Autofill current Incident` button | Same label, same position, same gating | □ |
| Disabled reason text | Unchanged from previous release | □ |

### 7. Safety / no-write boundary

| Step | Expected | Pass/Fail |
|------|----------|-----------|
| Safety section | Visible, reads same as before | □ |
| No text implies Save/Submit/Update/Resolve/Close | No new copy violates this rule | □ |

---

## What NOT to test

- Real ServiceNow login, browser ops, API writes
- CDP connectivity (Cosmetic change only — no CDP code changed)
- Autofill behavior (no autofill code changed)
- Empty state helper rendering (translations exist but no JSX renders them yet)
- Browser status rendering (translations exist but not yet wired)

These are all intact from the previous release.

---

## Safety/privacy check

- ✅ No real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, HAR, traces, or fingerprints exposed
- ✅ No Save/Submit/Update/Resolve/Close automation introduced
- ✅ Copy changes are cosmetic only — no runtime behavior changed
- ✅ Empty state helpers are sanitized — no real ServiceNow data suggested
- ✅ `pnpm privacy:scan` passes (247 files)

---

## Changed files (AB3)

| File | Type | Change |
|------|------|--------|
| `apps/desktop/src/App.tsx` | Product code | Translation catalog updates + 1 JSX eyebrow |
| `apps/desktop/src/App.test.ts` | Tests | Fix stale expected strings + remove stale negative assertion |
| `apps/desktop/src/styles.css` | Styles | `.workbench-section-label` CSS block |

---

## Verdict

**LOCAL ACCEPTANCE PASS**

All 4 mandatory gates pass clean. AB3 is a cosmetic copy/polish pass with no behavioral changes. Test coverage is adequate for the scope. The manual validation checklist above captures where Alan should verify the correct labels appear on screen.

No product code changes were made during this QA acceptance pass — only this status document was created.

## Next task

Phase AB5 (privacy/security audit) and then Phase AB6 (Windows RC refresh dry-run) can proceed.
