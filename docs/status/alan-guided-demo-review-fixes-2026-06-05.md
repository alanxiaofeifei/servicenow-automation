# Alan Guided Demo Review Fixes — 2026-06-05

## Owner
Default profile local fix after Alan manual product review feedback.

## Alan feedback addressed
- UI layout made the guided path look narrow/awkward.
- KB step showed completed but did not show the actual recommendations, evidence, confidence, or support group.
- Verify / Reporting was not visible from the main workbench.
- Export-first per-ticket report flow did not match the real monthly ticket tracking workflow.

## Changes made
- Added visible **Local KB recommendations** cards directly on the main workbench.
- Each KB card now shows:
  - local KB suggestion title,
  - match confidence,
  - matched evidence keywords,
  - sanitized excerpt.
- Added visible **Recommended support group** and routing reason summary.
- Added **Monthly Excel fill queue** panel directly on the main workbench.
- Reframed reporting as the real operator decision:
  - fill this opened ticket into the current monthly Excel tracker now, or
  - defer and keep it pending for later.
- Added current/previous month selectors as local UI placeholders.
- Added safety text that no Microsoft Graph or Excel Web write is performed from this local demo.
- Added CSS so the new KB, monthly Excel, guided path, and incident draft cards span the full workbench width instead of appearing as narrow cards.
- Added regression tests for visible KB cards and monthly Excel-fill workflow.

## Commands run
```bash
pnpm --filter @servicenow-automation/desktop test
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
```

## Results
- `pnpm build`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- `pnpm privacy:scan`: PASS — `TRACKED_PRIVACY_SCAN_PASS files=215`

## Safety notes
- No real ServiceNow login or operation was performed.
- No Save / Submit / Update / Resolve / Close path was added.
- No Microsoft Graph / Excel Web write was added.
- The monthly Excel panel is a local UI placeholder/workflow decision only.
- No screenshots, cookies, sessions, HAR, storage-state, raw ServiceNow URLs, ticket IDs, sys_ids, or real field values were added.

## Retest focus
1. Start the app with `pnpm dev`.
2. Confirm the main workbench no longer squeezes Guided demo path into a narrow strip.
3. Confirm **Local KB recommendations** is visible below Guided demo path.
4. Confirm each KB recommendation shows title, match confidence, matched evidence, and excerpt.
5. Confirm **Recommended support group** is visible.
6. Confirm **Monthly Excel fill queue** is visible below KB recommendations.
7. Confirm the buttons are visible:
   - `Fill this ticket into monthly Excel`
   - `Do later — keep in pending queue`
8. Confirm the panel says no Graph / Excel Web write is performed from this local demo.

## Current status
Ready for Alan to retest guided-demo product review only. Not release-ready, merge-ready, or live ServiceNow approved.
