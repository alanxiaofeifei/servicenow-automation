import type { ServiceNowEnvironmentConfig } from "./service-now-environments";

export type ServiceNowTargetValidationReason =
  | "target-allowlisted"
  | "mock-has-no-service-now-target"
  | "no-target-url"
  | "no-allowlisted-host"
  | "invalid-url"
  | "https-required"
  | "credentials-in-url-denied"
  | "sensitive-url-component-denied"
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

  if (parsedTarget.search || parsedTarget.hash || hasSensitiveUrlPayload(parsedTarget)) {
    return {
      allowed: false,
      reason: "sensitive-url-component-denied",
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

const SENSITIVE_PATH_PATTERNS = [
  /(?:^|[/?#&;=])sys_id(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])access_token(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])id_token(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])token(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])session(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])cookie(?:$|[/?#&;=])/i
];

function getConfiguredHost(configuredUrl: string | undefined): string | undefined {
  if (!configuredUrl) {
    return undefined;
  }

  const parsed = parseUrl(configuredUrl);
  return parsed?.host.toLowerCase();
}

function hasSensitiveUrlPayload(parsed: URL): boolean {
  let currentPath = parsed.pathname;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (currentPath.includes("?") || currentPath.includes("#")) {
      return true;
    }

    if (SENSITIVE_PATH_PATTERNS.some((pattern) => pattern.test(currentPath))) {
      return true;
    }

    if (!currentPath.includes("%")) {
      return false;
    }

    try {
      const decodedPath = decodeURIComponent(currentPath);
      if (decodedPath === currentPath) {
        return currentPath.includes("%");
      }
      currentPath = decodedPath;
    } catch {
      return true;
    }
  }

  return true;
}

function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}
