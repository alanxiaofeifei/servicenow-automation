import { describe, expect, it } from "vitest";

import { getServiceNowEnvironmentConfig } from "./service-now-environments";
import { validateServiceNowTargetUrl } from "./target-url";

const qaConfig = getServiceNowEnvironmentConfig("qa");
const qaUrl = qaConfig.url ?? "";
const qaHost = new URL(qaUrl).host;

describe("validateServiceNowTargetUrl", () => {
  it("allows the configured HTTPS QA ServiceNow host", () => {
    const result = validateServiceNowTargetUrl(qaConfig, `https://${qaHost}/nav_to.do`);

    expect(result).toMatchObject({
      allowed: true,
      reason: "target-allowlisted",
      host: qaHost
    });
  });

  it("blocks non-HTTPS QA targets", () => {
    const result = validateServiceNowTargetUrl(qaConfig, `http://${qaHost}/nav_to.do`);

    expect(result).toMatchObject({
      allowed: false,
      reason: "https-required"
    });
  });

  it("blocks URLs that embed credentials before they can be exposed in launch plans", () => {
    const result = validateServiceNowTargetUrl(qaConfig, `https://user:pass@${qaHost}/nav_to.do`);

    expect(result).toMatchObject({
      allowed: false,
      reason: "credentials-in-url-denied",
      host: qaHost,
      allowedHost: qaHost
    });
    expect(result.targetUrl).toBeUndefined();
  });

  it("blocks QA target overrides outside the configured host", () => {
    const result = validateServiceNowTargetUrl(qaConfig, "https://evil-example.service-now.com/nav_to.do");

    expect(result).toMatchObject({
      allowed: false,
      reason: "host-not-allowlisted",
      host: "evil-example.service-now.com",
      allowedHost: qaHost
    });
  });

  it("blocks mock, dev without a configured URL, and production shadow without an allowlisted URL", () => {
    expect(validateServiceNowTargetUrl(getServiceNowEnvironmentConfig("mock"), undefined)).toMatchObject({
      allowed: false,
      reason: "mock-has-no-service-now-target"
    });
    expect(
      validateServiceNowTargetUrl(getServiceNowEnvironmentConfig("dev"), "https://dev-example.service-now.com/nav_to.do")
    ).toMatchObject({
      allowed: false,
      reason: "no-allowlisted-host"
    });
    expect(
      validateServiceNowTargetUrl(
        getServiceNowEnvironmentConfig("production-shadow"),
        "https://prod-example.service-now.com/nav_to.do"
      )
    ).toMatchObject({
      allowed: false,
      reason: "no-allowlisted-host"
    });
  });
});
