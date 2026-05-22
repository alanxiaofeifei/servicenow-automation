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

export function getServiceNowEnvironmentConfig(mode: ServiceNowEnvironmentMode): ServiceNowEnvironmentConfig {
  const config = serviceNowEnvironmentConfigs.find((candidate) => candidate.mode === mode);

  if (!config) {
    throw new Error(`Unknown ServiceNow environment mode: ${mode}`);
  }

  return config;
}
