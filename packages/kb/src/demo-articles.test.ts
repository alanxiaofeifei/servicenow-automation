import { describe, expect, it } from "vitest";

import { demoKnowledgeArticles } from "./index";

describe("demo knowledge articles", () => {
  it("provides VPN, Windows, and account/login demo articles", () => {
    expect(demoKnowledgeArticles.map((article) => article.id)).toEqual([
      "demo-vpn-connectivity",
      "demo-windows-troubleshooting",
      "demo-account-login"
    ]);
  });

  it("keeps demo articles structured and free of real contacts", () => {
    for (const article of demoKnowledgeArticles) {
      expect(article.symptoms.length).toBeGreaterThan(0);
      expect(article.checks.length).toBeGreaterThan(0);
      expect(article.escalationCriteria.length).toBeGreaterThan(0);
      expect(article.responseTemplate.trim().length).toBeGreaterThan(20);
      expect(JSON.stringify(article)).not.toMatch(/@[\w.-]+/);
    }
  });
});
