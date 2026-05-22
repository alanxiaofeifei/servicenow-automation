import { describe, expect, it } from "vitest";

import { getDefaultServiceNowEnvironmentMode, serviceNowEnvironmentConfigs } from "./service-now-environments";

describe("ServiceNow environment configs", () => {
  it("supports mock, QA, dev, and production shadow modes", () => {
    expect(serviceNowEnvironmentConfigs.map((config) => config.mode)).toEqual([
      "mock",
      "qa",
      "dev",
      "production-shadow"
    ]);
  });

  it("keeps QA/dev credentials manual and production shadow-only", () => {
    const qa = serviceNowEnvironmentConfigs.find((config) => config.mode === "qa");
    const dev = serviceNowEnvironmentConfigs.find((config) => config.mode === "dev");
    const production = serviceNowEnvironmentConfigs.find((config) => config.mode === "production-shadow");

    expect(qa?.url).toContain("https://qa.service-now.example.invalid");
    expect(qa?.credentialPolicy).toBe("manual-login-only");
    expect(qa?.requiresExplicitApprovalBeforeRealSubmit).toBe(true);
    expect(qa?.localRuntimeDirectory).toContain(".local/servicenow-browser-profiles/qa");

    expect(dev?.credentialPolicy).toBe("manual-login-only");
    expect(dev?.requiresExplicitApprovalBeforeRealSubmit).toBe(true);

    expect(production?.shadowOnly).toBe(true);
    expect(production?.allowsRealSubmit).toBe(false);
  });

  it("keeps local runtime paths under ignored local storage", () => {
    expect(serviceNowEnvironmentConfigs.map((config) => config.localRuntimeDirectory)).toEqual([
      ".local/servicenow-browser-profiles/mock",
      ".local/servicenow-browser-profiles/qa",
      ".local/servicenow-browser-profiles/dev",
      ".local/servicenow-browser-profiles/production-shadow"
    ]);
  });

  it("defaults to mock mode", () => {
    expect(getDefaultServiceNowEnvironmentMode()).toBe("mock");
  });
});
