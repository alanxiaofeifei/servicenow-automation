# Local Dry-run Reporting Architecture

## Purpose

The Reports page provides operators a Team Lead–facing dry-run report row
generated from the current Incident draft. It supports three local export
formats — XLSX, CSV, and Markdown — without any external write.

## Constraints

- Dry-run only — no Excel Web, Microsoft Graph, or ServiceNow API write.
- Local file generation only (XLSX via in-memory ZIP/XML, no third-party
  spreadsheet library).
- Uses existing `packages/core/src/service-desk-workflow.ts` utilities.
- No new core dependencies.

## Data flow

```
App.tsx (Reports page)
  │
  │  draft: TicketDraft
  ▼
buildExcelDryRunRowFromDraft(draft, overrides)
  │
  ├─► buildExcelDryRunRowPreview(input)
  │     │
  │     ├─► ExcelDryRunRow (all 24 columns)
  │     ├─► csvRow (CSV string)
  │     ├─► markdownSummary (Markdown string)
  │     └─► safetyCopy
  │
  ├─► buildExcelDryRunRowMarkdownReport(row)
  │     Markdown string for clipboard copy
  │
  ├─► buildExcelDryRunRowCsvReport(row)
  │     CSV header + data row for clipboard copy
  │
  └─► buildExcelDryRunWorkbookArtifact(row)
        Uint8Array → Blob → download link
```

## UI Layout (Reports page)

The page follows the `OperatorStaticPage` pattern (same as Inbox,
Knowledgebase, History, Search):

| Section          | Content                                                    |
|------------------|------------------------------------------------------------|
| Side panel       | Report columns: Intake Source, Channel, Category, Priority |
| Hero card        | Team Lead: {assignment group} + Dry-run result             |
| Stats grid       | Assignment Group, QA Trial Result, Dry-run Status, QA Iso  |
| Detail cards     | Copy report (CSV), Copy report (Markdown), Download XLSX   |
| Context panel    | Export safety notices                                      |

## Export mechanisms

### XLSX download
`buildExcelDryRunWorkbookArtifact` returns a `Uint8Array` containing a
valid Open XML Spreadsheet (`.xlsx`) file built from raw ZIP + XML parts.
The browser wraps this in a `Blob` and triggers a download via a
temporary anchor element.

### CSV copy
`buildExcelDryRunRowCsvReport` returns a string with quoted CSV header and
data row. The browser copies it to the clipboard via `navigator.clipboard`.

### Markdown copy
`buildExcelDryRunRowMarkdownReport` returns a Markdown-formatted list of all
24 columns. The browser copies it to the clipboard.

## Files

| File                              | Role                                   |
|-----------------------------------|----------------------------------------|
| `packages/core/src/service-desk-workflow.ts` | Core report-generation functions        |
| `packages/core/src/index.ts`      | Re-exports                             |
| `apps/desktop/src/App.tsx`        | Reports page content and navigation     |
| `apps/desktop/src/App.test.ts`    | Reports page rendering tests            |
| `docs/architecture/reporting.md`  | This document                          |

## Safety

- No external write path exists in any report function.
- All safety copy is rendered alongside export buttons.
- The Reports page is a "static page" (read-only) — no runtime actions.
