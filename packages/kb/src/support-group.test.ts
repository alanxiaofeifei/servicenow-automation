import { describe, expect, it } from "vitest";

import type { AssignmentMapping, KnowledgeArticle, KnowledgeMatch } from "@servicenow-automation/core";
import { recommendSupportGroup } from "./support-group";

const demoArticles: KnowledgeArticle[] = [
  {
    id: "vpn",
    title: "VPN connectivity troubleshooting",
    category: "Network",
    tags: ["vpn", "remote access", "tunnel", "mfa", "password"],
    symptoms: ["VPN client cannot connect or remains disconnected."],
    checks: ["Confirm whether internet access works outside VPN.", "Restart the VPN client."],
    escalationCriteria: ["Multiple users report the same failure."],
    responseTemplate: "Check VPN connection.",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "windows",
    title: "Windows endpoint troubleshooting",
    category: "Endpoint",
    tags: ["windows", "laptop", "blue screen", "bsod"],
    symptoms: ["Windows laptop is slow or frozen."],
    checks: ["Ask when the issue started.", "Confirm whether reboot was attempted."],
    escalationCriteria: ["Device cannot boot."],
    responseTemplate: "Collect Windows details.",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "login",
    title: "Account and login troubleshooting",
    category: "Access Management",
    tags: ["account", "login", "password", "locked", "mfa"],
    symptoms: ["User cannot login, account appears locked."],
    checks: ["Confirm whether the issue is password or MFA."],
    escalationCriteria: ["User cannot access any standard service."],
    responseTemplate: "Check login issue.",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

const assignmentMappings: AssignmentMapping[] = [
  { keywords: ["vpn", "remote access", "tunnel", "certificate"], assignmentGroup: "Service Desk Network" },
  { keywords: ["windows", "laptop", "blue screen", "bsod", "startup"], assignmentGroup: "Service Desk Endpoint" },
  { keywords: ["account", "login", "password", "locked", "mfa", "authentication"], assignmentGroup: "Service Desk Access" }
];

describe("recommendSupportGroup", () => {
  it("returns network support group for VPN match", () => {
    const matches: KnowledgeMatch[] = [
      {
        articleId: "vpn",
        title: "VPN connectivity troubleshooting",
        score: 0.85,
        matchedKeywords: ["vpn", "password", "tunnel"],
        excerpt: "VPN client cannot connect."
      }
    ];

    const result = recommendSupportGroup(matches, demoArticles, assignmentMappings);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].assignmentGroup).toBe("Service Desk Network");
    expect(result[0].confidence).toBeGreaterThan(0);
    expect(result[0].evidence).toContain("vpn");
  });

  it("returns endpoint support group for Windows match", () => {
    const matches: KnowledgeMatch[] = [
      {
        articleId: "windows",
        title: "Windows endpoint troubleshooting",
        score: 0.9,
        matchedKeywords: ["windows", "laptop"],
        excerpt: "Windows laptop slow."
      }
    ];

    const result = recommendSupportGroup(matches, demoArticles, assignmentMappings);

    expect(result[0].assignmentGroup).toBe("Service Desk Endpoint");
  });

  it("returns empty array when no matches", () => {
    const result = recommendSupportGroup([], demoArticles, assignmentMappings);
    expect(result).toEqual([]);
  });

  it("returns empty array when no assignment mappings", () => {
    const matches: KnowledgeMatch[] = [
      {
        articleId: "vpn",
        title: "VPN connectivity troubleshooting",
        score: 0.85,
        matchedKeywords: ["vpn"],
        excerpt: "VPN issue."
      }
    ];

    const result = recommendSupportGroup(matches, demoArticles, []);
    expect(result).toEqual([]);
  });

  it("sorts by confidence descending", () => {
    const matches: KnowledgeMatch[] = [
      {
        articleId: "vpn",
        title: "VPN connectivity troubleshooting",
        score: 0.9,
        matchedKeywords: ["vpn", "password", "tunnel"],
        excerpt: "VPN issue."
      },
      {
        articleId: "login",
        title: "Account and login troubleshooting",
        score: 0.5,
        matchedKeywords: ["password"],
        excerpt: "Login issue."
      }
    ];

    const result = recommendSupportGroup(matches, demoArticles, assignmentMappings);

    expect(result[0].assignmentGroup).toBe("Service Desk Network");
    expect(result[1].assignmentGroup).toBe("Service Desk Access");
    expect(result[0].confidence).toBeGreaterThanOrEqual(result[1].confidence);
  });
});
