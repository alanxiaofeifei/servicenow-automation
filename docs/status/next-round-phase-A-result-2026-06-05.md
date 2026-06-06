# Phase A — Manual validation evidence integration and run history

## Status: Complete

**Date:** 2026-06-05

## What was done

1. **`QaValidationRunEntry` type** — local-only data model for validation evidence entries
2. **`validationRunHistory` state** — React state keeping last 20 runs in memory (never persisted)
3. **Recording logic** — after each `handleOperatorActionResponse`, a sanitized entry is created with:
   - Sanitized status labels ("App launch ok, browser ready", "Page inspected, N allowed fields planned", "N allowed fields filled, no prohibited action")
   - Blocked reason codes mapped to plain language via `operatorSanitizeBlockedReason`
4. **History page display** — "Validation / Run History" section with:
   - Table showing time, action, status, and sanitized summary for each run
   - Stats row: total runs, passed, blocked
   - CSS styling in warm theme
5. **Sanitization exported** — `operatorActionDisplayAction` and `operatorSanitizeBlockedReason` exported as pure functions
6. **Tests added** — 5 new tests covering:
   - Action display label mapping (launch/verify/autofill)
   - All 7 known blocked reason code → sanitized text mappings
   - Unknown code fallback (doesn't leak internal codes)
   - History page stats in zero-run empty state
   - No raw ServiceNow identifiers in history description

## Files changed

| File | Change |
|------|--------|
| `apps/desktop/src/App.tsx` | +202 lines (QaValidationRunEntry, recording, display, sanitization functions) |
| `apps/desktop/src/styles.css` | +170 lines (intake selector + validation runs styling) |
| `apps/desktop/src/App.test.ts` | +66 lines (intake + validation run tests) |
| `packages/core/src/index.ts` | +1 line (export source-adapters) |
| `packages/core/src/source-adapters.ts` | new file (intake connector foundation) |
| `docs/architecture/manual-validation-evidence.md` | new file (architecture doc) |
| `docs/status/next-round-phase-A-result-2026-06-05.md` | this file |

## Verification

- ✅ `pnpm build` — passes
- ✅ `pnpm typecheck` — passes
- ✅ `pnpm test` — 78 tests, 6 files, all pass
- ✅ `pnpm privacy:scan` — 183 files, pass

## Remaining risks

- Validation runs are ephemeral (in-memory only). Refresh clears history. This is intentional for privacy and simplicity.
- The "Validation / Run History" panel only shows when runs exist (conditional rendering). Zero-run state shows stats but no table.
- Intake connector is stub-based with fake sanitized data only — no real API integrations.

## What QA should verify

1. Open History page — see "Validation runs: 0", "Passed: 0", "Blocked: 0" in stats
2. Run any operator action (launch/verify/autofill) — history page should show entry in the table
3. Verify blocked runs show sanitized reason text, not internal codes
4. Verify no raw ServiceNow URLs, sys_ids, or ticket IDs appear anywhere in the panel
