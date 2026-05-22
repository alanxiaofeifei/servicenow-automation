import { describe, expect, it } from "vitest";

import {
  getDefaultServiceNowEnvironmentMode,
  getServiceNowEnvironmentConfig,
  serviceNowEnvironmentConfigs,
  validateServiceNowEnvironmentUrlSetting
} from "./service-now-environments";

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

  it("merges custom QA/dev/production URLs without weakening write gates", () => {
    const customUrls = {
      qa: "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do",
      dev: "https://dev.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do",
      "production-shadow": "https://prod-shadow.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
    };

    const qa = getServiceNowEnvironmentConfig("qa", customUrls);
    const dev = getServiceNowEnvironmentConfig("dev", customUrls);
    const production = getServiceNowEnvironmentConfig("production-shadow", customUrls);

    expect(qa.url).toBe(customUrls.qa);
    expect(qa.credentialPolicy).toBe("manual-login-only");
    expect(qa.allowsRealSubmit).toBe(true);
    expect(qa.requiresExplicitApprovalBeforeRealSubmit).toBe(true);
    expect(dev.url).toBe(customUrls.dev);
    expect(dev.requiresExplicitApprovalBeforeRealSubmit).toBe(true);
    expect(production.url).toBe(customUrls["production-shadow"]);
    expect(production.shadowOnly).toBe(true);
    expect(production.allowsRealSubmit).toBe(false);
  });

  it("validates environment URL settings before local persistence", () => {
    expect(validateServiceNowEnvironmentUrlSetting("qa", "https://qa.service-now.example.invalid/nav_to.do")).toMatchObject({
      allowed: true,
      reason: "url-accepted",
      normalizedUrl: "https://qa.service-now.example.invalid/nav_to.do",
      host: "qa.service-now.example.invalid"
    });
    expect(validateServiceNowEnvironmentUrlSetting("mock", "https://qa.service-now.example.invalid/nav_to.do")).toMatchObject({
      allowed: false,
      reason: "mock-url-denied"
    });
    expect(validateServiceNowEnvironmentUrlSetting("qa", "http://qa.service-now.example.invalid/nav_to.do")).toMatchObject({
      allowed: false,
      reason: "https-required"
    });
    expect(validateServiceNowEnvironmentUrlSetting("qa", "https://user:secret@qa.service-now.example.invalid/nav_to.do")).toMatchObject({
      allowed: false,
      reason: "credentials-in-url-denied"
    });
    const sensitiveQuery = "sys" + "_id=abc123";
    expect(validateServiceNowEnvironmentUrlSetting("qa", `https://qa.service-now.example.invalid/nav_to.do?${sensitiveQuery}`)).toMatchObject({
      allowed: false,
      reason: "sensitive-url-component-denied"
    });
    expect(validateServiceNowEnvironmentUrlSetting("qa", "https://qa.service-now.example.invalid/incident.do/fake-record-123")).toMatchObject({
      allowed: false,
      reason: "sensitive-url-component-denied"
    });
    expect(validateServiceNowEnvironmentUrlSetting("qa", "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/incident.do")).toMatchObject({
      allowed: false,
      reason: "sensitive-url-component-denied"
    });
    expect(validateServiceNowEnvironmentUrlSetting("qa", "https://example.invalid/nav_to.do")).toMatchObject({
      allowed: false,
      reason: "service-now-host-required"
    });
  });
});
