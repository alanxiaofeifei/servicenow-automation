import type { ServiceNowEnvironmentConfig } from "./service-now-environments";

export type ServiceNowTargetValidationReason =
  | "target-allowlisted"
  | "mock-has-no-service-now-target"
  | "no-target-url"
  | "no-allowlisted-host"
  | "invalid-url"
  | "https-required"
  | "credentials-in-url-denied"
  | "host-not-allowlisted";

export type ServiceNowTargetValidationResult = {
  allowed: boolean;
  reason: ServiceNowTargetValidationReason;
  targetUrl?: string;
  host?: string;
  allowedHost?: string;
};

export function validateServiceNowTargetUrl(
  environment: ServiceNowEnvironmentConfig,
  targetUrl: string | undefined
): ServiceNowTargetValidationResult {
  if (environment.mode === "mock") {
    return {
      allowed: false,
      reason: "mock-has-no-service-now-target"
    };
  }

  const allowedHost = getConfiguredHost(environment.url);

  if (!targetUrl) {
    return {
      allowed: false,
      reason: allowedHost ? "no-target-url" : "no-allowlisted-host",
      allowedHost
    };
  }

  const parsedTarget = parseUrl(targetUrl);
  if (!parsedTarget) {
    return {
      allowed: false,
      reason: "invalid-url",
      allowedHost
    };
  }

  const host = parsedTarget.host.toLowerCase();
  if (parsedTarget.username || parsedTarget.password) {
    return {
      allowed: false,
      reason: "credentials-in-url-denied",
      host,
      allowedHost
    };
  }

  if (parsedTarget.protocol !== "https:") {
    return {
      allowed: false,
      reason: "https-required",
      host,
      allowedHost
    };
  }

  if (!allowedHost) {
    return {
      allowed: false,
      reason: "no-allowlisted-host",
      host
    };
  }

  if (host !== allowedHost) {
    return {
      allowed: false,
      reason: "host-not-allowlisted",
      host,
      allowedHost
    };
  }

  return {
    allowed: true,
    reason: "target-allowlisted",
    targetUrl: parsedTarget.toString(),
    host,
    allowedHost
  };
}

function getConfiguredHost(configuredUrl: string | undefined): string | undefined {
  if (!configuredUrl) {
    return undefined;
  }

  const parsed = parseUrl(configuredUrl);
  return parsed?.host.toLowerCase();
}

function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}
