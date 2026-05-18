import { describe, expect, it } from "vitest";

import {
  CapturedContextSchema,
  ProjectProfileSchema,
  TicketDraftSchema
} from "../index";

const fieldDraft = {
  value: "Printer unavailable",
  confidence: 0.9,
  evidence: "Printer is unavailable",
  editable: true
};

describe("core schemas", () => {
  it("parses a valid CapturedContext", () => {
    const result = CapturedContextSchema.safeParse({
      id: "ctx_demo_001",
      sourceType: "manual_paste",
      capturedAt: "2026-05-18T10:00:00.000Z",
      title: "Demo pasted request",
      rawText: "Printer is unavailable on the demo floor."
    });

    expect(result.success).toBe(true);
  });

  it("rejects a CapturedContext with empty rawText", () => {
    const result = CapturedContextSchema.safeParse({
      id: "ctx_demo_001",
      sourceType: "manual_paste",
      capturedAt: "2026-05-18T10:00:00.000Z",
      rawText: ""
    });

    expect(result.success).toBe(false);
  });

  it("parses a valid TicketDraft", () => {
    const result = TicketDraftSchema.safeParse({
      id: "draft_demo_001",
      sourceContextId: "ctx_demo_001",
      ticketType: "incident",
      shortDescription: fieldDraft,
      description: {
        ...fieldDraft,
        value: "Printer is unavailable on the demo floor."
      },
      workNotes: {
        ...fieldDraft,
        value: "Draft generated from manual paste for human review."
      },
      kbMatches: [
        {
          articleId: "kb_demo_printer",
          title: "Printer troubleshooting",
          score: 0.87,
          matchedKeywords: ["printer", "unavailable"],
          excerpt: "Check queue status and network reachability."
        }
      ],
      riskFlags: [],
      missingInfoQuestions: ["Which printer is affected?"]
    });

    expect(result.success).toBe(true);
  });

  it("rejects a TicketDraft with confidence greater than 1", () => {
    const result = TicketDraftSchema.safeParse({
      id: "draft_demo_001",
      sourceContextId: "ctx_demo_001",
      ticketType: "incident",
      shortDescription: {
        ...fieldDraft,
        confidence: 1.01
      },
      description: fieldDraft,
      workNotes: fieldDraft,
      kbMatches: [],
      riskFlags: [],
      missingInfoQuestions: []
    });

    expect(result.success).toBe(false);
  });

  it("parses a valid ProjectProfile", () => {
    const result = ProjectProfileSchema.safeParse({
      id: "profile_demo",
      displayName: "Demo Service Desk",
      companyLabel: "Example Company",
      serviceNowBaseUrl: "https://example.invalid/now",
      defaultAssignmentGroup: "Demo Service Desk",
      categoryMappings: [
        {
          keywords: ["printer"],
          category: "Hardware",
          subcategory: "Printer"
        }
      ],
      assignmentMappings: [
        {
          keywords: ["printer"],
          assignmentGroup: "Demo Service Desk"
        }
      ],
      kbSources: [
        {
          id: "kb_demo",
          label: "Demo Knowledge Base",
          path: "demo/kb"
        }
      ],
      demoMode: true
    });

    expect(result.success).toBe(true);
  });

  it("rejects a ProjectProfile with empty displayName", () => {
    const result = ProjectProfileSchema.safeParse({
      id: "profile_demo",
      displayName: "",
      companyLabel: "Example Company",
      defaultAssignmentGroup: "Demo Service Desk",
      categoryMappings: [],
      assignmentMappings: [],
      kbSources: [],
      demoMode: true
    });

    expect(result.success).toBe(false);
  });
});
