import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  demoKnowledgeArticles,
  loadMarkdownKnowledgeArticlesFromDirectory,
  searchKnowledgeArticles
} from "../index";

describe("knowledge search", () => {
  it("returns VPN as the top match for VPN connectivity text", () => {
    const matches = searchKnowledgeArticles(
      "User cannot connect to VPN after password change and tunnel shows disconnected.",
      demoKnowledgeArticles
    );

    expect(matches[0]?.articleId).toBe("demo-vpn-connectivity");
    expect(matches[0]?.score).toBeGreaterThan(0);
  });

  it("returns Windows as the top match for Windows endpoint text", () => {
    const matches = searchKnowledgeArticles(
      "Windows laptop is slow and shows blue screen during startup.",
      demoKnowledgeArticles
    );

    expect(matches[0]?.articleId).toBe("demo-windows-troubleshooting");
  });

  it("returns account/login as the top match for login text", () => {
    const matches = searchKnowledgeArticles(
      "Account locked and user cannot login after password reset.",
      demoKnowledgeArticles
    );

    expect(matches[0]?.articleId).toBe("demo-account-login");
  });

  it("can load markdown KB files from an external directory for local testing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "servicenow-automation-kb-"));
    try {
      await writeFile(
        join(dir, "vpn-note.md"),
        `# VPN troubleshooting note\n\n## Symptoms\n- VPN cannot connect\n- Tunnel disconnected\n\n## Checks\n- Confirm network access\n- Restart VPN client\n\n## Escalation Criteria\n- Multiple users affected\n\n## Response Template\nWe are checking the VPN client, network reachability, and recent password changes.`,
        "utf-8"
      );

      const articles = await loadMarkdownKnowledgeArticlesFromDirectory(dir);
      const matches = searchKnowledgeArticles("vpn tunnel disconnected", articles);

      expect(articles).toHaveLength(1);
      expect(matches[0]?.articleId).toContain("vpn-note");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
