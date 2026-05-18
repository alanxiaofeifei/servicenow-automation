import type { CapturedContext, KnowledgeMatch, ProjectProfile } from "@servicenow-automation/core";
import { describe, expect, it } from "vitest";

import { MockAIProvider, type AIProvider } from "./index";

const profile: ProjectProfile = {
  id: "yageo-demo",
  displayName: "YAGEO Demo Service Desk",
  companyLabel: "YAGEO Demo",
  defaultAssignmentGroup: "Demo Service Desk",
  categoryMappings: [
    { keywords: ["vpn"], category: "Network", subcategory: "VPN" },
    { keywords: ["windows", "laptop"], category: "Endpoint", subcategory: "Windows" },
    { keywords: ["login", "password", "mfa"], category: "Access Management", subcategory: "Account/Login" }
  ],
  assignmentMappings: [
    { keywords: ["vpn"], assignmentGroup: "Demo Network Support" },
    { keywords: ["windows", "laptop"], assignmentGroup: "Demo Endpoint Support" },
    { keywords: ["login", "password", "mfa"], assignmentGroup: "Demo IAM Support" }
  ],
  kbSources: [],
  demoMode: true
};

const kbMatches: KnowledgeMatch[] = [
  {
    articleId: "demo-vpn-connectivity",
    title: "VPN connectivity troubleshooting",
    score: 0.8,
    matchedKeywords: ["vpn"],
    excerpt: "Confirm whether internet access works outside VPN."
  }
];

function context(rawText: string): CapturedContext {
  return {
    id: "context-1",
    sourceType: "manual_paste",
    capturedAt: "2026-05-18T12:00:00.000Z",
    title: "Demo issue",
    rawText
  };
}

describe("MockAIProvider", () => {
  it("implements the AIProvider contract", () => {
    const provider: AIProvider = new MockAIProvider();

    expect(provider.id).toBe("mock-ai-provider");
    expect(provider.displayName).toMatch(/mock/i);
  });

  it("generates a valid VPN incident draft", async () => {
    const provider = new MockAIProvider({ idFactory: () => "draft-vpn" });

    const draft = await provider.generateTicketDraft({
      context: context("User cannot connect to VPN after password reset and MFA prompt loops."),
      profile,
      kbMatches
    });

    expect(draft.id).toBe("draft-vpn");
    expect(draft.ticketType).toBe("incident");
    expect(draft.sourceContextId).toBe("context-1");
    expect(draft.shortDescription.value.toLowerCase()).toContain("vpn");
    expect(draft.category?.value).toBe("Network");
    expect(draft.subcategory?.value).toBe("VPN");
    expect(draft.assignmentGroup?.value).toBe("Demo Network Support");
    expect(draft.kbMatches).toHaveLength(1);
    expect(draft.riskFlags.join(" ")).toMatch(/human review/i);
  });

  it("generates stable Windows and account/login drafts", async () => {
    const provider = new MockAIProvider({ idFactory: () => "draft-stable" });

    const windowsDraft = await provider.generateTicketDraft({
      context: context("Windows laptop is slow after update and reboot did not help."),
      profile,
      kbMatches: []
    });
    const accountDraft = await provider.generateTicketDraft({
      context: context("User cannot login after password change and MFA is failing."),
      profile,
      kbMatches: []
    });

    expect(windowsDraft.category?.value).toBe("Endpoint");
    expect(windowsDraft.assignmentGroup?.value).toBe("Demo Endpoint Support");
    expect(accountDraft.category?.value).toBe("Access Management");
    expect(accountDraft.assignmentGroup?.value).toBe("Demo IAM Support");
  });
});
