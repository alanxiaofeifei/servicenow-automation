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

  it("blocks query strings and hash fragments before launch output can leak ticket/session data", () => {
    const queryResult = validateServiceNowTargetUrl(qaConfig, `https://${qaHost}/nav_to.do?example=blocked`);
    const hashResult = validateServiceNowTargetUrl(qaConfig, `https://${qaHost}/nav_to.do#fragment`);

    for (const result of [queryResult, hashResult]) {
      expect(result).toMatchObject({
        allowed: false,
        reason: "sensitive-url-component-denied",
        host: qaHost,
        allowedHost: qaHost
      });
      expect(result.targetUrl).toBeUndefined();
    }
  });

  it("blocks percent-encoded sensitive path payloads before launch output can leak ticket/session data", () => {
    const encodedQueryResult = validateServiceNowTargetUrl(
      qaConfig,
      `https://${qaHost}/nav_to.do%3Fsys_id%3Dabc123`
    );
    const encodedHashResult = validateServiceNowTargetUrl(
      qaConfig,
      `https://${qaHost}/nav_to.do%23access_token`
    );

    for (const result of [encodedQueryResult, encodedHashResult]) {
      expect(result).toMatchObject({
        allowed: false,
        reason: "sensitive-url-component-denied",
        host: qaHost,
        allowedHost: qaHost
      });
      expect(result.targetUrl).toBeUndefined();
    }
  });

  it("blocks encoded query or hash delimiters even when parameter names are not allowlisted as sensitive", () => {
    const encodedQueryResult = validateServiceNowTargetUrl(
      qaConfig,
      `https://${qaHost}/nav_to.do%3Fshort_description%3Dcustomer-data`
    );
    const repeatedEncodedQueryResult = validateServiceNowTargetUrl(
      qaConfig,
      `https://${qaHost}/nav_to.do%253Fshort_description%253Dcustomer-data`
    );
    const encodedHashResult = validateServiceNowTargetUrl(qaConfig, `https://${qaHost}/nav_to.do%23customer-data`);

    for (const result of [encodedQueryResult, repeatedEncodedQueryResult, encodedHashResult]) {
      expect(result).toMatchObject({
        allowed: false,
        reason: "sensitive-url-component-denied",
        host: qaHost,
        allowedHost: qaHost
      });
      expect(result.targetUrl).toBeUndefined();
    }
  });

  it("blocks repeated-encoded or malformed sensitive path payloads fail-closed", () => {
    let repeatedEncodedPayload = "?sys_id=abc123";
    for (let index = 0; index < 4; index += 1) {
      repeatedEncodedPayload = encodeURIComponent(repeatedEncodedPayload);
    }

    const repeatedResult = validateServiceNowTargetUrl(qaConfig, `https://${qaHost}/nav_to.do${repeatedEncodedPayload}`);
    const malformedResult = validateServiceNowTargetUrl(qaConfig, `https://${qaHost}/nav_to.do%ZZsys_id%3Dabc123`);

    for (const result of [repeatedResult, malformedResult]) {
      expect(result).toMatchObject({
        allowed: false,
        reason: "sensitive-url-component-denied",
        host: qaHost,
        allowedHost: qaHost
      });
      expect(result.targetUrl).toBeUndefined();
    }
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
