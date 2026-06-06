# Post-Manual-Validation Safety Regression Audit — 2026-06-05

## Context

Expanded the browser/autofill safety regression test suite after manual validation success.
Three test dimensions were audited: allowed text fields only, sanitized evidence mode, and
no UI wording implying prohibited automation (Save/Submit/Update/Resolve/Close).

## Changes

| File | Change |
|---|---|
| `packages/core/src/qa-browser-autofill.test.ts` | Added `strips evidence and field values from output (sanitized evidence mode)` test |
| `apps/desktop/src/App.test.ts` | Added `keeps labels, status text, and headings free of automation-implying wording for prohibited actions` test |

## Coverage gaps tested

1. **Sanitized evidence mode**: Verifies that `evidence` key is absent from serialized plan,
   `value` is stripped from filled-field results, and draft content (field values) does not
   appear in fixture execution serialized output. Also confirms `writeActionsAttempted` and
   `artifactsCaptured` are both false.

2. **No automation-implying UI wording**: Scans the rendered primary workbench markup (settings
   excluded) for phrases like "automatically saves", "will submit", "can update", "saves the ticket",
   etc. that would imply the tool automates prohibited actions. Only safety-copy mentions
   (contexts like "No Save/Submit/Update/Resolve/Close is automated") are allowed.

## Verified gates

- `pnpm build` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — PASS (306/306)
- `pnpm privacy:scan` — PASS (183 tracked files)

## Safety/privacy

- GREEN: test-only additions, no functional code changes.
- No new automation capabilities introduced.
- All assertions use sanitized/test data from existing helpers.
