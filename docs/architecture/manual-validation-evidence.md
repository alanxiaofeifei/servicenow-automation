# Manual Validation Evidence — Architecture

## Goal

Capture and display sanitized-only validation evidence after each operator action (browser launch, page check, autofill). The evidence is local-only, never persisted to disk or ServiceNow, and shown in the History page "Validation / Run History" panel.

## Data model

```typescript
type QaValidationRunEntry = {
  id: string;          // unique run id, e.g. "vr-<timestamp>-<random>"
  timestamp: string;   // ISO-like local time, "YYYY-MM-DD HH:mm:ss"
  action: "launch" | "verify" | "autofill";
  status: "ok" | "blocked" | "timeout" | "error";
  sanitizedSummary: string;
  plannedFieldCount?: number;
  filledFieldCount?: number;
};
```

## Sanitization rules

| Source | Rule |
|--------|------|
| ServiceNow URLs | Never stored — only local status labels shown |
| sys_ids, ticket IDs | Filtered — `operatorSanitizeBlockedReason` maps codes to plain language |
| requester names | Never captured in validation entries |
| assignment groups | Never stored |
| browser endpoints / fingerprints | Only boolean "ready" / "fingerprint observed" tracked |
| real field values | Only counts (planned N, filled N) stored |
| screenshots, HAR, traces, cookies, sessions, storage-state | Never captured |

## Flow

1. After each `handleOperatorActionResponse`, a sanitized `QaValidationRunEntry` is created.
2. Entry is pushed to `validationRunHistory` state (last 20 entries kept).
3. History page shows the "Validation / Run History" panel with a reverse-chronological table.
4. Stats show total runs, passed, and blocked counts.
5. Internal reason codes (like `"cdp-endpoint-denied"`) are mapped to plain-language descriptions via `operatorSanitizeBlockedReason`.

## Files

- `apps/desktop/src/App.tsx` — `QaValidationRunEntry` type, `validationRunHistory` state, recording logic, display component, export functions
- `apps/desktop/src/styles.css` — `.workbench-page-validation-runs` and `.validation-runs-*` styles
- `apps/desktop/src/App.test.ts` — tests for sanitized display, block reason mapping, and export functions

## Local export (Markdown / CSV)

The Phase C export feature adds two pure functions that format the in-memory validation run data into downloadable formats:

- `exportValidationRunsToMarkdown(runs)` — returns a Markdown table (reverse-chronological order)
- `exportValidationRunsToCsv(runs)` — returns a CSV string with quoted fields (reverse-chronological order)

Both functions use only already-sanitized summary data (no raw ticket IDs, sys_ids, URLs, or ServiceNow identifiers). The download is triggered via browser Blob download — no cloud writes, no Graph API calls, no external storage.

The export buttons ("Export MD", "Export CSV") appear next to the "Validation / Run History" section heading on the History page. They are hidden when no runs exist (the entire section is conditionally rendered).

## Safety

- RED: no real ServiceNow data, saves, submits, API calls
- The "Validation / Run History" panel is read-only history — no action buttons
- All reason codes are sanitized before display; unknown codes use a generic fallback
- Export produces local files only — no cloud or external API calls
