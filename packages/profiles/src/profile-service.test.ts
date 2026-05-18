import { describe, expect, it } from "vitest";

import { ProfileService, loadDemoYageoProfile } from "./index";

describe("demo YAGEO profile", () => {
  it("loads a portfolio-safe demo profile", () => {
    const profile = loadDemoYageoProfile();

    expect(profile.id).toBe("yageo-demo");
    expect(profile.displayName).toBe("YAGEO Demo Service Desk");
    expect(profile.demoMode).toBe(true);
    expect(JSON.stringify(profile)).not.toMatch(/@[\w.-]+/);
    expect(JSON.stringify(profile)).not.toMatch(/\b(?:INC|CHG|REQ)\d+\b/i);
  });

  it("includes VPN, Windows, and account/login mappings", () => {
    const profile = new ProfileService().loadDemoYageoProfile();
    const mappingText = JSON.stringify({
      categories: profile.categoryMappings,
      assignments: profile.assignmentMappings
    }).toLowerCase();

    expect(mappingText).toContain("vpn");
    expect(mappingText).toContain("windows");
    expect(mappingText).toContain("account");
    expect(mappingText).toContain("login");
  });
});
