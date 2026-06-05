# Phase S — Move Incident draft above Guided Review Path

## Goal

Reorder the main Workbench cards so that Incident draft appears immediately below Cleaned summary and above Guided demo path.

## Required order

1. Selected source
2. Cleaned summary
3. **Incident draft** ← moved up
4. **Guided demo path** ← was before Incident draft
5. Local KB recommendations
6. Monthly Excel fill queue

## Files changed

- `apps/desktop/src/App.tsx` — moved the Incident draft section (28 lines) from after Monthly Excel fill queue to after Cleaned summary, before Guided demo path.
- `apps/desktop/src/App.test.ts` — updated test name from "renders the guided demo stepper before the ticket draft cards" to "renders incident draft card before guided demo path, before KB recommendations, before monthly Excel fill queue", and added ordinal regression assertions using `indexOf` position checks.

## Commands run and results

| Gate | Result |
|------|--------|
| `pnpm build` | ✅ Passed |
| `pnpm typecheck` | ✅ Passed |
| `pnpm test` | ✅ Passed (79 App tests, 92 total desktop, 382 total workspace) |
| `pnpm privacy:scan` | ✅ Passed (216 files) |

## Commit

```
644a6e8 [sna-frontend-workbench] move Incident draft above guided path
```

## Safety notes

- No runtime logic changed.
- No privacy/safety boundary changed.
- No ServiceNow writes, API calls, or external system connections added or removed.
- All existing cards retained (Guided demo path, KB recommendations, Monthly Excel fill queue).
- Only DOM reorder of existing sections; no content added or removed.
- Regression test validates ordinal position: Incident draft > Guided demo path > KB recommendations > Monthly Excel fill queue.

## Known limitations

- The test uses `indexOf` on rendered static markup, which is a reliable ordering check for SSR output.
- This is a pure frontend reorder; no design system changes were needed.

## What QA should verify manually

1. Open the app, confirm the workbench center shows: Selected source → Cleaned summary → Incident draft (with draft fields) → Guided demo path → KB recommendations → Monthly Excel fill queue.
2. Verify all draft fields (Short description, Description, Work notes) are editable.
3. Verify guided demo stepper steps remain functional.
4. Verify KB recommendations section renders with evidence and support group context.
5. Verify monthly Excel fill queue renders with workbook choices.
