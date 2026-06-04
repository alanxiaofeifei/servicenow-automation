# Intake Adapters — Architecture

**Status:** Foundation — local/fake stubs only
**Owner:** sna-frontend-workbench
**Last updated:** 2026-06-04

## Purpose

The intake adapter layer is the primary data entry point for the ServiceNow Automation
workbench. It defines how inbound source material — emails, chats, ticket notes, phone
call transcripts — is normalised into a `CapturedContext` that the downstream draft
generation pipeline consumes.

## Design constraints

- **No real APIs, integrations, or browser capture.** All current adapters are local
  stubs that produce fake sanitized data.
- **Every adapter is clearly labelled "manual/fake/local only".** The `safetyNotice`
  field on `SourceAdapterMeta` carries this disclaimer.
- **Existing model types (`SourceTypes`, `CapturedContext`) are preserved.** The
  `IntakeSourceKind` union is independent from `SourceTypes`. Each adapter maps its
  kind to an existing `SourceType` via `targetSourceType`.

## SourceAdapter interface

```typescript
interface SourceAdapter {
  readonly meta: SourceAdapterMeta;
  capture(input: CaptureInput): CapturedContext;
}
```

| Field | Type | Purpose |
|---|---|---|
| `meta` | `SourceAdapterMeta` | Static metadata: id, label, description, safetyNotice, targetSourceType |
| `capture(input)` | function | Accepts raw input, returns a normalised `CapturedContext` |

## IntakeSourceKind — currently supported kinds (stubs)

| Kind | Label | Maps to SourceType |
|---|---|---|
| `manual_paste` | Manual paste | `manual_paste` |
| `teams_web_manual_capture_stub` | Teams message (manual stub) | `teams_web` |
| `outlook_web_manual_capture_stub` | Outlook message (manual stub) | `outlook_web` |
| `phone_call_note` | Phone call note | `manual_paste` |
| `servicenow_chat_manual_stub` | ServiceNow Chat transcript (manual stub) | `servicenow_chat` |
| `self_service_ticket_manual_stub` | Self-service ticket (manual stub) | `servicenow_self_service` |

## Module location

```
packages/core/src/source-adapters.ts
```

All adapters are re-exported from `packages/core/src/index.ts` under the
`@servicenow-automation/core` package.

## Registry

```typescript
allSourceAdapters: SourceAdapter[]
sourceAdapterRegistry: Record<IntakeSourceKind, SourceAdapter>
```

The registry enables runtime lookup by kind string. Future real adapters (e.g. a
real Teams Graph adapter) would register here alongside the stubs during the
transition period.

## Usage in the desktop app

The desktop `App.tsx` imports `IntakeSourceKinds` and `sourceAdapterRegistry` to
render an intake type selector in the left sidebar. Selecting a kind populates the
center workspace with the stub's `meta` metadata and a text area for raw input.
Calling `capture()` produces a `CapturedContext` that feeds the draft pipeline.

## Future directions

- Real adapters for Teams Graph API, Outlook Graph API, ServiceNow REST API
- Enrichment step between capture and draft generation
- Browser-capture adapters (CDP-based)
- Configuration-driven adapter selection per project profile

## Safety notes

- No adapter performs any write operation.
- No adapter connects to any external service.
- All stub data is fake and deterministic.
- Every `CapturedContext` carries a `sourceType` traceable to the original intake kind.
