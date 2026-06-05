# Phase T1 — RC Release Notes, Demo Script, and User Guide Refresh — Result

Date: 2026-06-05
Task: t_41170a5a
Branch: `next/product-clarity-demo-polish-20260605`
HEAD: `269b9fe` — `[sna-frontend-workbench] add status doc for Incident draft reorder`

## Summary

Updated all release-candidate documentation to reflect the current product state after Phases O/P/Q/R/S and Alan's guided-demo review fixes.

The workbench now has 6 ordered cards in the center column:
1. Selected source
2. Cleaned summary
3. Incident draft (editable — moved above guided path in Phase S)
4. Guided demo path (Phase P stepper)
5. Local KB recommendations (Alan review fix — title, confidence, evidence, support group)
6. Monthly Excel fill queue (Alan review fix — fill/defer buttons, local placeholder, no Graph/Excel write)

Plus left-sidebar Demo Scenario Library (Phase O) and Product-Review Report export (Phase Q).

## Files changed

| File | Change |
|------|--------|
| `docs/releases/windows-v0.1-rc-draft-release-notes.md` | Updated to rc.2 — added Demo Scenario Library, Guided Demo Stepper, Local KB Recommendations, Monthly Excel Fill Queue, Product-Review Report Export, Incident Draft reorder. Added what-changed-since-rc.1 section. |
| `docs/en-US/user-guide.md` | Updated workbench map to reflect 6-card center-column order. Added Demo Scenario Library, Guided demo path, KB recommendations, Monthly Excel fill queue, Product-Review Report export to expected-output list. Updated how-to instructions. |
| `docs/en-US/demo-script.md` | Rewritten walkthrough narrative to match 6-card center-column order. Added KB recommendations, Excel fill queue, Demo Scenario Library, Product-Review Report export steps. |
| `docs/demo/field-trial-demo-flow-script.md` | Updated Core Message, 1:55–2:35 workflow section (KB matching with support group routing, monthly Excel fill tracking), and demo checklist (6 new checklist items for new features and correct card order). |

## Required local gates

| Command | Result | Evidence |
|---------|--------|----------|
| `pnpm build` | ✅ PASS | All workspace build steps completed; desktop Electron/Vite bundles built and CLI TypeScript build passed. |
| `pnpm typecheck` | ✅ PASS | All workspace TypeScript typecheck steps completed (core, ai, profiles, kb, adapters, cli, desktop). |
| `pnpm test` | ✅ PASS | 382 total workspace tests passed (desktop 92/92, CLI 55/55, adapters 95/95). All test suites pass. |
| `pnpm privacy:scan` | ✅ PASS | `TRACKED_PRIVACY_SCAN_PASS files=217`. |

## Safety / privacy

- No real ServiceNow data, ticket numbers, sys_ids, credentials, URLs, or customer PII added.
- All docs use fake/demo-only language consistently.
- Safety boundary sections in release notes, user guide, and demo scripts all explicitly forbid Save/Submit/Update/Resolve/Close automation, ServiceNow API writes, Graph/Excel Web writes.
- No screenshots, cookies, sessions, HAR, storage-state, raw ServiceNow URLs, ticket IDs, sys_ids, or real field values referenced.
- Monthly Excel fill queue explicitly labeled as local placeholder with no Graph/Excel write.

## Known blockers

- Windows RC clean double-click validation gap remains unresolved (tracked from earlier phases).
- Pre-existing test failure (Demo Scenario Library "Fake" text count assertion) is not addressed by this phase.

## Next PR recommendation

After product review of this RC documentation round, the next PR could:
1. Resolve the known pre-existing test failure in the Demo Scenario Library tests.
2. Address the Windows RC double-click validation gap (needs clean test environment outside WSL dev assumptions).
3. Add Chinese-language translations of the updated user guide and demo script.
