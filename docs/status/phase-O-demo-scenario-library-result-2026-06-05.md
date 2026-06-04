# Phase O — Demo Scenario Library — Result

**Date**: 2026-06-05
**Worker**: sna-frontend-workbench
**Status**: Complete

## Goal

Add an in-app Demo Scenario Library using fake/local issues, providing instant access
to 6 preset scenarios that demonstrate the intake → draft → KB → report pipeline.

## Files changed

| File | Change | Lines |
|---|---|---|
| `apps/desktop/src/App.tsx` | Added Demo Scenario Library `<details>` section in left sidebar after intake selector, with 6 clickable scenario cards | +36 |
| `apps/desktop/src/styles.css` | Added `.workbench-demo-library*` and `.workbench-demo-item*` CSS rules (accent-themed collapsible section with hover/selected states, badge, safety text) | +144 |
| `apps/desktop/src/App.test.ts` | Added test verifying library renders with demo badge, safety text, and all 6 aria-label scenario items | +10 |
| `docs/architecture/demo-scenario-library.md` | New architecture document describing data source, interaction, safety, and key files | +56 |

## Commands run

| Command | Result |
|---|---|
| `pnpm build` | ✅ Pass |
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` | ✅ 89/89 passed (1 new test, 0 regressions) |
| `pnpm privacy:scan` | ✅ 208 files clean |

## What was built

A collapsible **Demo Scenario Library** section in the left sidebar of the operator
workbench, positioned between the intake source selector and the source item list.

Each of the 6 existing `demoManualPasteScenarios` is rendered as a compact card:

- Scenario label (includes "Fake" or "QA TEST ONLY" markers)
- Source channel (Teams message, Shared mailbox item, Phone call, etc.)
- `DEMO` tag badge
- Safety notice at the bottom

Clicking a scenario:
1. Selects it as the active scenario.
2. Selects the matching queue item in the source list below.
3. Resets field overrides, copy draft state, and checklist.

The section uses the existing warm/light theme accent colors and is closed by
default to save sidebar space.

## Safety notes

- All scenario labels already include "QA TEST ONLY" or "Fake" markers. No change needed.
- Safety notice at section bottom: "Fake/local/demo data only. No real ServiceNow..."
- No Save/Submit/Update/Resolve/Close automation introduced.
- No real ServiceNow operations, API calls, or browser automation.
- All data comes from existing `demoManualPasteScenarios` — no new data sources.
- Privacy scan passed with 0 issues.

## Scope explanation

- **Minimal**: Reuses existing 6 `demoManualPasteScenarios` — no new data, no new
  packages, no new imports beyond what was already imported.
- **Surgical**: Only 3 existing files touched (App.tsx, styles.css, App.test.ts).
  No changes to runtime, Electron, packages, or other UI components.
- **Safe**: Collapsible section, closed by default — no visual disruption to the
  existing intake flow. Existing `selectScenario` and `selectQueueItem` functions
  unchanged.

## Remaining risks

- The library is closed by default; new users may not discover it immediately.
  The summary header with "Demo only" badge is designed to catch attention.
- If more scenarios are needed later, add them to `demoManualPasteScenarios` in
  `packages/adapters/src/manual-paste.ts` — the library auto-renders them.

## Manual QA checklist

- [ ] Open app — Demo Scenario Library appears as collapsible section in left sidebar.
- [ ] Section shows "Demo only" badge on the summary bar.
- [ ] Clicking any scenario selects it and highlights it with accent border.
- [ ] Corresponding queue item appears selected in the source list below.
- [ ] Center workspace populates with the selected scenario's data.
- [ ] Safety notice visible at bottom of library section.
- [ ] Closing and re-opening the section preserves selection state.
- [ ] The 6 scenarios render without any real data, URLs, or credentials.
