# Product-Review Export — Architecture

## Goal

Produce a self-contained, sanitized Markdown report after a demo session that Alan (product owner) can review to understand what the demo proved and what remains human-only. The report is a single Markdown file downloaded via browser Blob — no cloud write, no Graph API, no Excel export.

## Data model

The report is constructed from three in-memory data sources already available in the operator workbench:

```
DemoQueueItem       → selected scenario, subject, source channel, status
TicketDraft         → short description, category, subcategory, priority, description preview
QaValidationRunEntry → validation event log with status and sanitized summary
```

All data is local, sanitized, and deterministic. No ServiceNow connection, real ticket numbers, sys_ids, credentials, customer PII, or browser artifacts are included.

## Report structure

| Section | Content | Data source |
|---------|---------|-------------|
| Header | Timestamp, demo mode label | Generated at export time |
| Demo Scenario | Scenario ID, subject, channel, language, status, requester label | `selectedQueueItem` (from `buildDemoQueueItems`) |
| TicketDraft Summary | Short Description, Category, Subcategory, Priority, Description preview | `TicketDraft` (from `buildDraftForQueueItem`) |
| KB / Support Recommendation | Explanation of how KB matching works and what is local vs live | Static language — describes the demo boundary |
| Safety Boundary | Constraint table (local-only, no writes, no screenshots, no real IDs, no cloud) | Static language — matches the app's safety contract |
| Validation Run Summary | Total, passed, blocked counts + recent runs table | `validationRunHistory` state |
| What This Proves | Bullet list of demonstrated capabilities | Static language — describes demo session achievements |
| What Remains Human-Only | Numbered list of operator responsibilities | Static language — describes what the app does NOT automate |
| Export Safety Notice | Disclaimer that the report is local and contains no live data | Static language — matches export Blob boundary |

## Implementation

### Function

```typescript
export function exportProductReviewReport(
  queueItem: DemoQueueItem,
  draft: TicketDraft,
  validationRuns: QaValidationRunEntry[],
  style: "markdown" = "markdown"
): string
```

File: `apps/desktop/src/App.tsx`, lines ~6285–6410.

Returns a fully formatted Markdown string. Currently only `"markdown"` style is supported.

### UI entry point

A third export button in the History page's "Validation / Run History" section, alongside the existing "Export MD" and "Export CSV" buttons:

```tsx
<button
  className="workbench-secondary-button"
  type="button"
  onClick={() => {
    const report = exportProductReviewReport(selectedQueueItem, draft, content.validationRuns ?? []);
    triggerStringDownload(report, `sna-product-review-${new Date().toISOString().slice(0, 10)}.md`, "text/markdown");
  }}
>
  Export Product-Review Report
</button>
```

The button is visible whenever validation runs exist (the entire Validation / Run History section is conditionally rendered).

### Download mechanism

Same `triggerStringDownload` used by the existing export buttons — creates a Blob, generates a temporary URL, programmatically clicks a download `<a>` element, then cleans up. No network write.

## Files

- `apps/desktop/src/App.tsx` — `exportProductReviewReport` function, button in `OperatorStaticPage`
- `apps/desktop/src/App.test.ts` — 3 tests covering section completeness, empty runs, and sanitization

## Safety

- RED: no real ServiceNow data, ticket numbers, sys_ids, credentials, URLs, or customer PII
- The report explicitly states "what this proves" and "what remains human-only" — no overclaim
- All draft text is run through `operatorSafeDisplayText` before inclusion
- The safety boundary table mirrors the app's existing copy from draft templates and validation evidence
- Export uses browser Blob download only — no cloud write, external API call, or Excel/Graph write
