# Phase AB3 — Workbench Cockpit Polish Implementation

Date: 2026-06-06
Status: implemented, committed (local only)
Scope: copy/polish changes per AB2 spec, no red-zone actions

## Changes made

### App.tsx (translation + JSX changes)

#### Section title copy aligned to AB2 spec
- `cards.selectedSource`: "Selected source" → "Selected source detail" (all 4 locales)
- Guided demo stepper eyebrow: "Guided review path" → "Guided path"
- Left sidebar JSX section labels added: Loading feed, Intake queue, Todo list
- URL settings card labels: "QA target"/"Production target" → "QA URL"/"Dev URL"/"Production URL"
- URL key names: `qaUrl` → `qaUrl` (label changed), added `devUrl`, `productionUrl` label changed
- Runtime translations added: `safetyBoundaryTitle`, `environmentControlsTitle`, `browserDisconnected/Connecting/Connected/Error` (all 4 locales)

#### Empty state helpers (new)
Added 6 empty-state helper strings per locale (24 total) for center cards:
- `selectedSourceEmpty`, `cleanedSummaryEmpty`, `incidentDraftEmpty`
- `guidedDemoPathEmpty`, `kbRecommendationsEmpty`, `monthlyExcelEmpty`

### App.test.ts
- Fixed pre-existing test failure: expected "QA target"/"Production target" → "QA URL"/"Production URL"
- Removed stale negative assertion (`not.toContain("Production URL")` — now present in URL card headings)

### styles.css
- Added `.workbench-section-label` CSS block for left sidebar section labels
- Pre-existing (previous attempt), kept as it supports the added section labels

## Files changed (3)

| File | Lines changed |
|------|--------------|
| apps/desktop/src/App.tsx | +107/-13 |
| apps/desktop/src/App.test.ts | +2/-3 |
| apps/desktop/src/styles.css | +11/-0 |

## Gates

| Gate | Result |
|------|--------|
| pnpm build | PASS |
| pnpm typecheck | PASS |
| pnpm test | PASS (92/92, 6 files) |
| pnpm privacy:scan | PASS (246 files) |

## Why each file was touched

- **App.tsx**: Translation catalog updates and 1 JSX eyebrow string — the spec requires exact copy alignment
- **App.test.ts**: Test expectations had stale strings from before the URL card label change — fixing pre-existing failure was necessary to pass the test gate
- **styles.css**: `.workbench-section-label` CSS was already in working tree from previous attempt; needed for section label rendering

## Safety check

- No real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or fingerprints exposed
- No Save/Submit/Update/Resolve/Close automation introduced
- No mock/demo clutter reintroduced
- Copy changes are cosmetic only — no runtime behavior changed

## Remaining risks

- Pre-existing test at line 783 was fixed — the test matched stale label strings from before URL settings panel rewrite
- Empty state helpers are defined in translations but no JSX renders them yet — they're ready for future implementation

## Manual review notes

- Verify the left sidebar shows "Loading feed", "Intake queue", "Todo list" section labels
- Verify URL settings cards show "QA URL", "Dev URL", "Production URL" as headings
- Verify guided demo path eyebrow says "Guided path" not "Guided review path"
- Verify all disabled reasons remain readable and unchanged
- Verify En/中文 language switcher still works
- Verify Start QA Chromium / Verify / Autofill action labels unchanged
