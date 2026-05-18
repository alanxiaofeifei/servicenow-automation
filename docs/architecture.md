# ServiceNow Automation Architecture

## Recommended structure

```text
servicenow-automation/
├── apps/
│   └── desktop/
│       ├── electron/
│       │   ├── main/
│       │   ├── preload/
│       │   └── browser/
│       └── renderer/
│           ├── pages/
│           ├── components/
│           └── state/
├── packages/
│   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── ticket-draft/
│   │   ├── risk-controls/
│   │   └── workflow/
│   ├── adapters/
│   │   ├── source-manual-paste/
│   │   ├── source-web-capture/
│   │   ├── servicenow-mock/
│   │   └── servicenow-web/
│   ├── ai/
│   │   ├── prompts/
│   │   ├── schemas/
│   │   ├── providers/
│   │   └── evaluators/
│   ├── profiles/
│   │   ├── demo-yageo/
│   │   └── demo-generic/
│   ├── kb/
│   │   ├── demo-articles/
│   │   ├── search/
│   │   └── loaders/
│   └── storage/
│       ├── sqlite/
│       └── local-files/
├── docs/
│   ├── zh-CN/
│   ├── en-US/
│   └── demo/
├── tests/
└── scripts/
```

## Core services

- `CapturedContextService`
- `TicketDraftService`
- `KnowledgeSearchService`
- `ProfileService`
- `RiskControlService`
- `BrowserSessionService`
- `ServiceNowFillService`
- `AuditLogService`

## Adapter boundaries

```text
SourceAdapter
├── ManualPasteAdapter          # P0
├── TeamsWebAdapter             # P1
├── OutlookWebAdapter           # P1
├── OutlookClassicAdapter       # P2
├── GraphMailAdapter            # future
└── GraphTeamsAdapter           # future

ServiceNowAdapter
├── ServiceNowMockAdapter       # P0
├── ServiceNowWebAdapter        # P1
└── ServiceNowApiAdapter        # future
```

## Core TypeScript model direction

```ts
export type SourceType =
  | "manual_paste"
  | "teams_web"
  | "outlook_web"
  | "outlook_classic"
  | "servicenow_chat"
  | "servicenow_self_service";

export type CapturedContext = {
  id: string;
  sourceType: SourceType;
  capturedAt: string;
  title?: string;
  url?: string;
  sender?: string;
  participants?: string[];
  rawText: string;
  screenshotPath?: string;
};

export type FieldDraft = {
  value: string;
  confidence: number;
  evidence?: string;
  editable: boolean;
};

export type TicketDraft = {
  id: string;
  sourceContextId: string;
  ticketType: "incident" | "change";
  shortDescription: FieldDraft;
  description: FieldDraft;
  workNotes: FieldDraft;
  resolutionNotes?: FieldDraft;
  caller?: FieldDraft;
  category?: FieldDraft;
  subcategory?: FieldDraft;
  assignmentGroup?: FieldDraft;
  configurationItem?: FieldDraft;
  impact?: FieldDraft;
  urgency?: FieldDraft;
  priority?: FieldDraft;
  kbMatches: KnowledgeMatch[];
  riskFlags: string[];
  missingInfoQuestions: string[];
};
```

## AI flow

```text
CapturedContext
→ AI extraction prompt or MockAIProvider
→ strict JSON
→ Zod validation
→ user review/edit
→ ServiceNow form-fill adapter
→ manual submit only
```

## P0 storage strategy

Start with JSON profiles and markdown KB files. Add SQLite only after the demo loop is reliable.

## Browser session strategy

Use ignored local runtime folders:

```text
.local/browser-profiles/servicenow/
.local/browser-profiles/teams-web/
.local/browser-profiles/outlook-web/
.local/screenshots/
.local/logs/
.local/drafts/
```

Never commit `.local/`.
