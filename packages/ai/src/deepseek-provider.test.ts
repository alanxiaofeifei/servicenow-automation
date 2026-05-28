import type { CapturedContext, KnowledgeMatch, ProjectProfile, TicketDraft } from "@servicenow-automation/core";
import { describe, expect, it } from "vitest";

import { DeepSeekProvider, ExternalAIBlockedError, createDeepSeekProviderFromEnv, type DeepSeekTransportRequest } from "./index";

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
    id: "context-deepseek",
    sourceType: "manual_paste",
    capturedAt: "2026-05-28T12:00:00.000Z",
    title: "Fake provider item",
    rawText
  };
}

function input(rawText: string) {
  return { context: context(rawText), profile, kbMatches };
}

function fakeTicketDraft(sourceContextId = "context-deepseek"): TicketDraft {
  return {
    id: "draft-external-fake",
    sourceContextId,
    ticketType: "incident",
    shortDescription: field("Fake external provider draft"),
    description: field("Generated from redacted fake context only."),
    workNotes: field("External AI output requires human review before any ServiceNow action."),
    kbMatches: [],
    riskFlags: [
      "External AI output used redacted context only.",
      "Human review required before any ServiceNow action."
    ],
    missingInfoQuestions: []
  };
}

describe("DeepSeekProvider redaction gate", () => {
  it("is disabled by default and does not call the transport", async () => {
    let called = false;
    const provider = new DeepSeekProvider({
      transport: async () => {
        called = true;
        return fakeTicketDraft();
      }
    });

    await expect(provider.generateTicketDraft(input("Fake local issue text."))).rejects.toMatchObject({
      code: "external-ai-provider-disabled"
    });
    expect(called).toBe(false);
  });

  it("requires an explicit matching redaction preview approval before transport", async () => {
    let called = false;
    const provider = new DeepSeekProvider({
      enabled: true,
      apiKey: "fake-api-key-for-test",
      transport: async () => {
        called = true;
        return fakeTicketDraft();
      }
    });

    await expect(provider.generateTicketDraft(input("Fake local issue text."))).rejects.toBeInstanceOf(ExternalAIBlockedError);
    expect(called).toBe(false);
  });

  it("sends only redacted fake context to an injected transport", async () => {
    const fakeTicket = "INC" + "654321";
    const fakeSysId = "b".repeat(32);
    let capturedRequest: DeepSeekTransportRequest | undefined;
    const provider = new DeepSeekProvider({
      enabled: true,
      apiKey: "fake-api-key-for-test",
      transport: async (request) => {
        capturedRequest = request;
        return fakeTicketDraft(request.sourceContextId);
      }
    });
    const requestInput = input([
      `Fake requester fake.requester@example.invalid referenced ${fakeTicket}.`,
      `Fake sys id ${fakeSysId} and https://example.invalid/fake/case were provided.`
    ].join("\n"));
    const preview = provider.createRedactionPreview(requestInput);

    const draft = await provider.generateTicketDraft({
      ...requestInput,
      externalSendApproval: {
        previewId: preview.id,
        externalSendConfirmed: true,
        acknowledgement: "content-will-leave-local-app"
      }
    });

    expect(draft.sourceContextId).toBe("context-deepseek");
    expect(capturedRequest).toBeDefined();
    expect(capturedRequest?.redactionPreviewId).toBe(preview.id);
    expect(capturedRequest?.redactedContext).toContain("[REDACTED_EMAIL]");
    expect(capturedRequest?.redactedContext).toContain("[REDACTED_TICKET_ID]");
    expect(capturedRequest?.redactedContext).toContain("[REDACTED_SYS_ID]");
    expect(capturedRequest?.redactedContext).toContain("[REDACTED_URL]");
    expect(capturedRequest?.redactedContext).not.toContain(fakeTicket);
    expect(capturedRequest?.redactedContext).not.toContain(fakeSysId);
    expect(capturedRequest?.disclosure).toMatch(/leave the local app/i);
  });

  it("stays disabled from environment unless explicitly enabled for the provider", async () => {
    const disabled = createDeepSeekProviderFromEnv({
      SDA_EXTERNAL_AI_PROVIDER: "deepseek",
      SDA_DEEPSEEK_API_KEY: "fake-api-key-for-test"
    });

    await expect(disabled.generateTicketDraft(input("Fake local issue text."))).rejects.toMatchObject({
      code: "external-ai-provider-disabled"
    });
  });
});

function field(value: string): TicketDraft["shortDescription"] {
  return {
    value,
    confidence: 0.5,
    evidence: "Fake transport response for tests only.",
    editable: true
  };
}
