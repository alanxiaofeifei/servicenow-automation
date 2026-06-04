# Phase C — Local validation report export

## Status: Complete

**Date:** 2026-06-05

## What was done

1. **`exportValidationRunsToMarkdown(runs)`** — exported pure function that builds a Markdown table from the sanitized validation run history. Outputs an empty header when no runs exist.

2. **`exportValidationRunsToCsv(runs)`** — exported pure function that builds a CSV string (with quoted fields) from the sanitized validation run history. Commas in values are replaced with semicolons. Empty runs produce a header-only CSV.

3. **`triggerStringDownload(content, filename, mimeType)`** — helper function that creates a Blob, generates an object URL, and triggers a browser download via a temporary `<a>` element. Cleanup calls `URL.revokeObjectURL` and removes the element from the DOM.

4. **Export buttons in History page** — "Export MD" and "Export CSV" buttons added to the "Validation / Run History" section header on the History page. Buttons use the existing `workbench-secondary-button` class for consistent styling.

5. **CSS styling** — Added `.validation-runs-header-row` (flex row with space-between), `.validation-runs-export-group` (flex with gap), and export button sizing styles.

6. **Tests added** — 6 new tests covering:
   - Empty-run Markdown output (no validation runs recorded message)
   - Empty-run CSV output (header-only)
   - Markdown table rendering with multiple runs (sorted reverse chronological)
   - CSV row rendering with multiple runs (sorted reverse chronological)
   - Markdown output has no raw ServiceNow identifiers
   - CSV output has no raw ServiceNow identifiers

## Files changed

| File | Change |
|------|--------|
| `apps/desktop/src/App.tsx` | +106 lines (export functions, download helper, export buttons in UI) |
| `apps/desktop/src/styles.css` | +22 lines (export header row and button styling) |
| `apps/desktop/src/App.test.ts` | +58 lines (6 export tests) |
| `docs/status/next-round-phase-C-result-2026-06-05.md` | this file |

## Verification

- ✅ `pnpm build` — passes
- ✅ `pnpm typecheck` — passes
- ✅ `pnpm test` — 84 tests, 6 files, all pass (+6 from Phase A baseline)
- ✅ `pnpm privacy:scan` — 183 files, pass

## Safety/privacy compliance

- **GREEN**: All export logic operates on already-sanitized in-memory data only
- **No cloud writes**: No Excel Web, Graph API, external API calls, or ServiceNow writes
- **No real metadata**: Exported content uses only the sanitized summary and status labels already present in the UI
- **Dry-run/sanitized only**: The exported data is identical to what is displayed on the History page

## Known blockers

- Export generates local files only (browser download). No automatic save to shared drive or cloud.
- The export includes all runs (up to 20 stored in memory), not filtered/sliced.

## Remaining risks

- Export buttons are hidden when no validation runs exist (conditional rendering of the entire section).
- The `triggerStringDownload` function uses `document.createElement` and will only work in a browser/Electron environment — it is not tested in SSR/server rendering (the test suite uses `renderToStaticMarkup` which does not exercise DOM APIs).

## What QA should verify

1. Open History page after running any operator action (launch/verify/autofill).
2. Click "Export MD" — a `.md` file should download containing a Markdown table.
3. Click "Export CSV" — a `.csv` file should download containing CSV rows.
4. Verify exported content matches the displayed validation runs table.
5. Verify no raw ticket IDs, sys_ids, URLs, or ServiceNow identifiers appear in the exported files.
