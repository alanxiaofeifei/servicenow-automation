import { describe, expect, it } from "vitest";

import {
  SourceTypes,
  TicketTypes,
  type CapturedContext,
  type KnowledgeArticle,
  type KnowledgeMatch,
  type ProjectProfile,
  type TicketDraft
} from "../index";

describe("core models", () => {
  it("exports source and ticket type unions", () => {
    expect(SourceTypes).toContain("manual_paste");
    expect(SourceTypes).toContain("servicenow_self_service");
    expect(TicketTypes).toEqual(["incident", "change"]);
  });

  it("supports demo-safe captured context, ticket draft, profile, and KB models", () => {
    const capturedContext: CapturedContext = {
      id: "ctx_demo_001",
      sourceType: "manual_paste",
      capturedAt: "2026-05-18T10:00:00.000Z",
      title: "Demo pasted request",
      sender: "demo.user@example.invalid",
      participants: ["service.desk@example.invalid"],
      rawText: "Printer is unavailable on the demo floor."
    };

    const kbMatch: KnowledgeMatch = {
      articleId: "kb_demo_printer",
      title: "Printer troubleshooting",
      score: 0.87,
      matchedKeywords: ["printer", "unavailable"],
      excerpt: "Check queue status and network reachability."
    };

    const ticketDraft: TicketDraft = {
      id: "draft_demo_001",
      sourceContextId: capturedContext.id,
      ticketType: "incident",
      shortDescription: {
        value: "Printer unavailable",
        confidence: 0.92,
        evidence: "Printer is unavailable",
        editable: true
      },
      description: {
        value: capturedContext.rawText,
        confidence: 0.9,
        editable: true
      },
      workNotes: {
        value: "Draft generated from manual paste for human review.",
        confidence: 0.75,
        editable: true
      },
      assignmentGroup: {
        value: "Demo Service Desk",
        confidence: 0.8,
        editable: true
      },
      kbMatches: [kbMatch],
      riskFlags: [],
      missingInfoQuestions: ["Which printer is affected?"]
    };

    const article: KnowledgeArticle = {
      id: "kb_demo_printer",
      title: "Printer troubleshooting",
      category: "Hardware",
      tags: ["printer", "network"],
      symptoms: ["Printer unavailable"],
      checks: ["Confirm printer queue status"],
      escalationCriteria: ["Multiple users affected"],
      responseTemplate: "We are checking the printer queue and network path.",
      updatedAt: "2026-05-18T10:00:00.000Z"
    };

    const profile: ProjectProfile = {
      id: "profile_demo",
      displayName: "Demo Service Desk",
      companyLabel: "Example Company",
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
    };

    expect(ticketDraft.kbMatches[0]).toEqual(kbMatch);
    expect(article.id).toBe(kbMatch.articleId);
    expect(profile.demoMode).toBe(true);
  });
});
