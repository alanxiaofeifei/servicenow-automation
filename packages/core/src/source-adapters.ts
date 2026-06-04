/**
 * Intake Connector Foundation — SourceAdapter interface and local stub implementations.
 *
 * Safety: No real APIs, integrations, or browser capture. All stubs produce fake
 * sanitized data only. Every adapter is clearly labeled "manual/fake/local only".
 */

import type { CapturedContext, SourceType } from "./models";

// ---------------------------------------------------------------------------
// IntakeSourceKind — the 6 intake types this foundation supports.
// Independent from the existing SourceTypes union so we can add stub-specific
 // kinds without altering core models.
// ---------------------------------------------------------------------------

export const IntakeSourceKinds = [
  "manual_paste",
  "teams_web_manual_capture_stub",
  "outlook_web_manual_capture_stub",
  "phone_call_note",
  "servicenow_chat_manual_stub",
  "self_service_ticket_manual_stub",
] as const;

export type IntakeSourceKind = (typeof IntakeSourceKinds)[number];

// ---------------------------------------------------------------------------
// Adapter metadata — human-readable label, description, safety notice, and
// the SourceType used when normalising into CapturedContext.
// ---------------------------------------------------------------------------

export type SourceAdapterMeta = {
  readonly id: IntakeSourceKind;
  readonly label: string;
  readonly description: string;
  readonly safetyNotice: string;
  readonly targetSourceType: SourceType;
};

// ---------------------------------------------------------------------------
// SourceAdapter interface — every intake source (stub or future real adapter)
// implements `capture()` which returns a CapturedContext.
// ---------------------------------------------------------------------------

export type CaptureInput = {
  rawText: string;
  title?: string;
  sender?: string;
  participants?: string[];
};

export interface SourceAdapter {
  readonly meta: SourceAdapterMeta;
  capture(input: CaptureInput): CapturedContext;
}

// ---------------------------------------------------------------------------
// StubSourceAdapter — base class that handles the shared "manual/fake/local"
// labelling and CapturedContext construction.
// ---------------------------------------------------------------------------

let _stubIdCounter = 0;

function nextStubId(): string {
  _stubIdCounter += 1;
  return `stub_ctx_${String(_stubIdCounter).padStart(4, "0")}`;
}

export type StubSourceAdapterOptions = {
  kind: IntakeSourceKind;
  label: string;
  description: string;
  targetSourceType: SourceType;
};

export class StubSourceAdapter implements SourceAdapter {
  readonly meta: SourceAdapterMeta;

  constructor(opts: StubSourceAdapterOptions) {
    this.meta = {
      id: opts.kind,
      label: opts.label,
      description: opts.description,
      safetyNotice:
        "Manual / stub / local only. No real API, integration, or browser capture is used.",
      targetSourceType: opts.targetSourceType,
    };
  }

  capture(input: CaptureInput): CapturedContext {
    return {
      id: nextStubId(),
      sourceType: this.meta.targetSourceType,
      capturedAt: new Date().toISOString(),
      title: input.title,
      sender: input.sender,
      participants: input.participants,
      rawText: input.rawText,
    };
  }
}

// ---------------------------------------------------------------------------
// 6 concrete stub instances
// ---------------------------------------------------------------------------

export const manualPasteAdapter = new StubSourceAdapter({
  kind: "manual_paste" as const,
  label: "Manual paste",
  description: "Paste free-form text from any source — email, chat, ticket, or note.",
  targetSourceType: "manual_paste",
});

export const teamsWebManualCaptureStubAdapter = new StubSourceAdapter({
  kind: "teams_web_manual_capture_stub" as const,
  label: "Teams message (manual stub)",
  description:
    "Manually captured Teams message content. No real Teams API or browser capture is used.",
  targetSourceType: "teams_web",
});

export const outlookWebManualCaptureStubAdapter = new StubSourceAdapter({
  kind: "outlook_web_manual_capture_stub" as const,
  label: "Outlook message (manual stub)",
  description:
    "Manually captured Outlook email content. No real Outlook API or browser capture is used.",
  targetSourceType: "outlook_web",
});

export const phoneCallNoteAdapter = new StubSourceAdapter({
  kind: "phone_call_note" as const,
  label: "Phone call note",
  description: "Manual note from a phone conversation with a user or stakeholder.",
  targetSourceType: "manual_paste",
});

export const servicenowChatManualStubAdapter = new StubSourceAdapter({
  kind: "servicenow_chat_manual_stub" as const,
  label: "ServiceNow Chat transcript (manual stub)",
  description:
    "Manually captured ServiceNow Chat transcript. No real ServiceNow Chat API is used.",
  targetSourceType: "servicenow_chat",
});

export const selfServiceTicketManualStubAdapter = new StubSourceAdapter({
  kind: "self_service_ticket_manual_stub" as const,
  label: "Self-service ticket (manual stub)",
  description:
    "Manually captured self-service ticket content. No real portal polling or API is used.",
  targetSourceType: "servicenow_self_service",
});

// ---------------------------------------------------------------------------
// Registry — lookup an adapter by IntakeSourceKind
// ---------------------------------------------------------------------------

export const allSourceAdapters: SourceAdapter[] = [
  manualPasteAdapter,
  teamsWebManualCaptureStubAdapter,
  outlookWebManualCaptureStubAdapter,
  phoneCallNoteAdapter,
  servicenowChatManualStubAdapter,
  selfServiceTicketManualStubAdapter,
];

export const sourceAdapterRegistry: Record<IntakeSourceKind, SourceAdapter> =
  Object.fromEntries(
    allSourceAdapters.map((a) => [a.meta.id, a]),
  ) as Record<IntakeSourceKind, SourceAdapter>;
