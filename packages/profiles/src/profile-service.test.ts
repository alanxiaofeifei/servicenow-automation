import { describe, expect, it } from "vitest";

import { ProfileService, loadDemoServiceDeskProfile } from "./index";

describe("demo demo customer profile", () => {
  it("loads a portfolio-safe demo profile", () => {
    const profile = loadDemoServiceDeskProfile();

    expect(profile.id).toBe("service-desk-demo");
    expect(profile.displayName).toBe("Service Desk Demo");
    expect(profile.demoMode).toBe(true);
    expect(JSON.stringify(profile)).not.toMatch(/@[\w.-]+/);
    expect(JSON.stringify(profile)).not.toMatch(/\b(?:INC|CHG|REQ)\d+\b/i);
  });

  it("includes VPN, Windows, and account/login mappings", () => {
    const profile = new ProfileService().loadDemoServiceDeskProfile();
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
