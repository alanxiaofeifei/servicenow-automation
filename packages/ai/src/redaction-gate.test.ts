import type { CapturedContext, KnowledgeMatch, ProjectProfile, TicketDraft } from "@servicenow-automation/core";
import { describe, expect, it } from "vitest";

import {
  ExternalAIBlockedError,
  assertExternalAISendAllowed,
  createExternalAIRedactionPreview,
  redactExternalAIText
} from "./index";

const profile: ProjectProfile = {
  id: "safe-demo-profile",
  displayName: "Safe Demo Service Desk",
  companyLabel: "Safe Demo",
  defaultAssignmentGroup: "Demo Service Desk",
  categoryMappings: [],
  assignmentMappings: [],
  kbSources: [],
  demoMode: true
};

const kbMatches: KnowledgeMatch[] = [];

function context(rawText: string): CapturedContext {
  return {
    id: "context-redaction",
    sourceType: "manual_paste",
    capturedAt: "2026-05-28T12:00:00.000Z",
    title: "Fake redaction item",
    rawText
  };
}

function input(rawText: string) {
  return { context: context(rawText), profile, kbMatches };
}

describe("external AI redaction gate", () => {
  it("redacts sensitive-looking fake values before external send approval", () => {
    const fakeTicket = "INC" + "123456";
    const fakeSysId = "a".repeat(32);
    const preview = createExternalAIRedactionPreview(input([
      "User Fake Person can be reached at fake.person@example.invalid.",
      `Reference ${fakeTicket} with sys id ${fakeSysId}.`,
      "Portal: https://example.invalid/incident/view.",
      "Local evidence under C:\\Users\\Fake\\Downloads\\case.txt.",
      "token=fake-demo-token-value"
    ].join("\n")));

    expect(preview.sourceContextId).toBe("context-redaction");
    expect(preview.safeToSend).toBe(true);
    expect(preview.blockedReasons).toEqual([]);
    expect(preview.disclosure).toMatch(/leave the local app/i);
    expect(preview.redactedContext).toContain("[REDACTED_EMAIL]");
    expect(preview.redactedContext).toContain("[REDACTED_TICKET_ID]");
    expect(preview.redactedContext).toContain("[REDACTED_SYS_ID]");
    expect(preview.redactedContext).toContain("[REDACTED_URL]");
    expect(preview.redactedContext).toContain("[REDACTED_PATH]");
    expect(preview.redactedContext).toContain("[REDACTED_CREDENTIAL]");
    expect(preview.redactedContext).not.toContain(fakeTicket);
    expect(preview.redactedContext).not.toContain(fakeSysId);
    expect(preview.findings.map((finding) => finding.kind)).toEqual([
      "url",
      "email",
      "ticket-id",
      "sys-id",
      "local-path",
      "credential-assignment"
    ]);
  });

  it("blocks external send without explicit matching preview approval", () => {
    const preview = createExternalAIRedactionPreview(input("Fake sanitized issue text only."));

    expect(() => assertExternalAISendAllowed(preview, undefined)).toThrow(ExternalAIBlockedError);
    expect(() => assertExternalAISendAllowed(preview, {
      previewId: "redaction-preview-wrong",
      externalSendConfirmed: true,
      acknowledgement: "content-will-leave-local-app"
    })).toThrow(/preview-mismatch/);
    expect(() => assertExternalAISendAllowed(preview, {
      previewId: preview.id,
      externalSendConfirmed: false,
      acknowledgement: "content-will-leave-local-app"
    })).toThrow(/not-confirmed/);

    expect(() => assertExternalAISendAllowed(preview, {
      previewId: preview.id,
      externalSendConfirmed: true,
      acknowledgement: "content-will-leave-local-app"
    })).not.toThrow();
  });

  it("keeps simple already-sanitized text unchanged", () => {
    const { redactedText, findings } = redactExternalAIText("Fake sanitized local-only request summary.");

    expect(redactedText).toBe("Fake sanitized local-only request summary.");
    expect(findings).toEqual([]);
  });
});

export function fakeTicketDraft(sourceContextId = "context-redaction"): TicketDraft {
  return {
    id: "draft-external-fake",
    sourceContextId,
    ticketType: "incident",
    shortDescription: {
      value: "Fake external provider draft",
      confidence: 0.5,
      evidence: "Fake transport response for tests only.",
      editable: true
    },
    description: {
      value: "Generated from redacted fake context only.",
      confidence: 0.5,
      evidence: "Fake transport response for tests only.",
      editable: true
    },
    workNotes: {
      value: "External AI output requires human review before any ServiceNow action.",
      confidence: 0.5,
      evidence: "Fake transport response for tests only.",
      editable: true
    },
    kbMatches: [],
    riskFlags: [
      "External AI output used redacted context only.",
      "Human review required before any ServiceNow action."
    ],
    missingInfoQuestions: []
  };
}
