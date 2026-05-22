export type ServiceNowEnvironmentMode = "mock" | "qa" | "dev" | "production-shadow";

export type ServiceNowEnvironmentConfig = {
  mode: ServiceNowEnvironmentMode;
  label: string;
  description: string;
  url?: string;
  credentialPolicy: "not-required" | "manual-login-only";
  localRuntimeDirectory: string;
  allowsRealSubmit: boolean;
  requiresExplicitApprovalBeforeRealSubmit: boolean;
  shadowOnly: boolean;
  safetyNotes: string[];
};

export type ServiceNowEnvironmentUrlOverrides = Partial<Record<Exclude<ServiceNowEnvironmentMode, "mock">, string>>;

export type ServiceNowEnvironmentUrlSettingValidationReason =
  | "url-accepted"
  | "mock-url-denied"
  | "no-url"
  | "invalid-url"
  | "https-required"
  | "credentials-in-url-denied"
  | "sensitive-url-component-denied"
  | "service-now-host-required";

export type ServiceNowEnvironmentUrlSettingValidationResult = {
  allowed: boolean;
  reason: ServiceNowEnvironmentUrlSettingValidationReason;
  normalizedUrl?: string;
  host?: string;
};

export const serviceNowEnvironmentConfigs: readonly ServiceNowEnvironmentConfig[] = [
  {
    mode: "mock",
    label: "Mock Demo",
    description: "Offline deterministic demo using ManualPasteAdapter, MockAIProvider, demo KB, and mock form fill.",
    credentialPolicy: "not-required",
    localRuntimeDirectory: ".local/servicenow-browser-profiles/mock",
    allowsRealSubmit: false,
    requiresExplicitApprovalBeforeRealSubmit: false,
    shadowOnly: true,
    safetyNotes: [
      "No ServiceNow login is required.",
      "Submit remains disabled in demo mode.",
      "Use this mode for portfolio walkthroughs and quick regression checks."
    ]
  },
  {
    mode: "qa",
    label: "QA Test Environment",
    description: "Authorized ServiceNow QA target for controlled test-ticket rehearsal after mock workflow is stable.",
    url: "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do",
    credentialPolicy: "manual-login-only",
    localRuntimeDirectory: ".local/servicenow-browser-profiles/qa",
    allowsRealSubmit: true,
    requiresExplicitApprovalBeforeRealSubmit: true,
    shadowOnly: false,
    safetyNotes: [
      "Manual login required. Credentials are never stored in source code.",
      "Browser sessions stay in ignored local runtime folders.",
      "Any real QA/dev submit requires explicit Alan approval."
    ]
  },
  {
    mode: "dev",
    label: "Development Test Environment",
    description: "Reserved for an authorized ServiceNow dev instance if one is provided.",
    credentialPolicy: "manual-login-only",
    localRuntimeDirectory: ".local/servicenow-browser-profiles/dev",
    allowsRealSubmit: true,
    requiresExplicitApprovalBeforeRealSubmit: true,
    shadowOnly: false,
    safetyNotes: [
      "Manual login required. Credentials are never stored in source code.",
      "Browser sessions stay in ignored local runtime folders.",
      "Any real QA/dev submit requires explicit Alan approval."
    ]
  },
  {
    mode: "production-shadow",
    label: "Production Shadow Mode",
    description: "Strictly monitored production comparison mode for personally controlled validation only.",
    credentialPolicy: "manual-login-only",
    localRuntimeDirectory: ".local/servicenow-browser-profiles/production-shadow",
    allowsRealSubmit: false,
    requiresExplicitApprovalBeforeRealSubmit: true,
    shadowOnly: true,
    safetyNotes: [
      "Production remains shadow-only by default.",
      "No production submit, close, or update path is implemented.",
      "Compare generated drafts with manual handling; do not auto-write production records.",
      "Escalate to a separate safety review before any production write capability is considered."
    ]
  }
];

export function getDefaultServiceNowEnvironmentMode(): ServiceNowEnvironmentMode {
  return "mock";
}

export function getServiceNowEnvironmentConfig(
  mode: ServiceNowEnvironmentMode,
  customUrls: ServiceNowEnvironmentUrlOverrides = {}
): ServiceNowEnvironmentConfig {
  const config = serviceNowEnvironmentConfigs.find((candidate) => candidate.mode === mode);

  if (!config) {
    throw new Error(`Unknown ServiceNow environment mode: ${mode}`);
  }

  if (mode === "mock") {
    return config;
  }

  const customUrl = customUrls[mode];
  if (!customUrl) {
    return config;
  }

  const validation = validateServiceNowEnvironmentUrlSetting(mode, customUrl);
  if (!validation.allowed || !validation.normalizedUrl) {
    return config;
  }

  return {
    ...config,
    url: validation.normalizedUrl
  };
}

export function validateServiceNowEnvironmentUrlSetting(
  mode: ServiceNowEnvironmentMode,
  url: string | undefined
): ServiceNowEnvironmentUrlSettingValidationResult {
  if (mode === "mock") {
    return {
      allowed: false,
      reason: "mock-url-denied"
    };
  }

  if (!url?.trim()) {
    return {
      allowed: false,
      reason: "no-url"
    };
  }

  const parsed = parseUrl(url.trim());
  if (!parsed) {
    return {
      allowed: false,
      reason: "invalid-url"
    };
  }

  const host = parsed.host.toLowerCase();

  if (parsed.protocol !== "https:") {
    return {
      allowed: false,
      reason: "https-required",
      host
    };
  }

  if (parsed.username || parsed.password) {
    return {
      allowed: false,
      reason: "credentials-in-url-denied",
      host
    };
  }

  if (!host.endsWith(".service-now.com")) {
    return {
      allowed: false,
      reason: "service-now-host-required",
      host
    };
  }

  if (parsed.search || parsed.hash || hasSensitiveUrlPayload(parsed) || !isAllowedServiceNowEnvironmentLandingPath(parsed.pathname)) {
    return {
      allowed: false,
      reason: "sensitive-url-component-denied",
      host
    };
  }

  return {
    allowed: true,
    reason: "url-accepted",
    normalizedUrl: parsed.toString(),
    host
  };
}

const sensitiveEnvironmentUrlPathPatterns = [
  /(?:^|[/?#&;=])sys_id(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])access_token(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])id_token(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])token(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])session(?:$|[/?#&;=])/i,
  /(?:^|[/?#&;=])cookie(?:$|[/?#&;=])/i
];

const allowedServiceNowEnvironmentLandingPaths = new Set([
  "/",
  "/home.do",
  "/nav_to.do",
  "/now/nav/ui/classic/params/target/home_splash.do"
]);

function isAllowedServiceNowEnvironmentLandingPath(pathname: string): boolean {
  if (allowedServiceNowEnvironmentLandingPaths.has(pathname)) {
    return true;
  }

  try {
    const decodedPath = decodeURIComponent(pathname);
    return allowedServiceNowEnvironmentLandingPaths.has(decodedPath);
  } catch {
    return false;
  }
}

function hasSensitiveUrlPayload(parsed: URL): boolean {
  let currentPath = parsed.pathname;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (currentPath.includes("?") || currentPath.includes("#")) {
      return true;
    }

    if (sensitiveEnvironmentUrlPathPatterns.some((pattern) => pattern.test(currentPath))) {
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
