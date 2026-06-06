# Phase U2 — Product-level Demo Polish Implementation

Date: 2026-06-05
Commit: af6abb1
Branch: next/product-clarity-demo-polish-20260605
Profile: sna-frontend-workbench

## Summary

Implemented the U1 product-level demo polish spec in the local Workbench/demo UI. Changes are copy-only — button labels, safety language, disabled reasons, and operator action display text across all 4 locales (en-US, zh-CN, zh-TW, es-ES). No layout, behavior, or runtime safety changes.

## Changed files

- `apps/desktop/src/App.tsx` — 158 lines changed (80 removals, 78 additions)
- `apps/desktop/src/App.test.ts` — 111 lines changed (55 removals, 56 additions)

## Copy changes per U1 spec

| Old label | New label | Rationale |
|---|---|---|
| Start test browser | Start QA Chromium | Clearer browser identity |
| Check current ticket page | Verify current Incident | Action-oriented / consistent |
| Autofill allowed fields | Autofill current Incident | Clearer scope |
| Human reviews and handles the record in ServiceNow | Human reviews and submits in ServiceNow | More concise, more accurate |
| The app cleared the local waiting state...so you can retry Start test browser | ...retry Start QA Chromium | Matching rename |
| Browser launch | QA Chromium launch | Matching rename |
| Page check (operator action display) | Verify | Consistent |

Settings environment selector descriptions were NOT updated (runtime action labels vs settings copy scope boundary).

Disabled reason texts made more compact and aligned with new labels:
- "another browser/test step" → "another browser or step"
- "start the test browser and wait" → "start QA Chromium and wait"
- "check the current ticket page first" → "verify the current Incident first"

## Gates

| Gate | Status |
|---|---|
| pnpm build | PASS |
| pnpm typecheck | PASS |
| pnpm test | PASS (92/92) |
| pnpm privacy:scan | PASS (223 files) |

## Test updates

4 failing tests were fixed by updating assertions to match new copy text:
1. `keeps review-visible desktop source neutral` — removed obsolete "QA Chromium" prohibition check (label is now intentional)
2. `shows page-check pass or block feedback` — "Current ticket page checked" → "Current ticket verified"
3. `keeps the visible safety boundary compact` — "handles the record" → "submits"
4. `localizes the operator workbench chrome to Chinese` — updated zh-CN runtime labels
5. `renders Traditional Chinese and Spanish chrome` — updated zh-TW "檢查目前工單頁面" → "驗證目前 Incident"

## Remaining risks

- Settings environment selector descriptions still use old terminology ("Start, Check Page, Autofill") in all locales. These were intentionally NOT changed because the U1 spec targeted runtime action labels only. If needed, these can be updated in a follow-up.
- No visual/mockup changes were made — the existing three-column shell structure is preserved exactly.
- No runtime behavior, safety rules, or empty/loading/error states were changed.
