import { mkdir, rm } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import {
  validateServiceNowTargetUrl,
  type ServiceNowEnvironmentConfig,
  type ServiceNowEnvironmentMode,
  type ServiceNowTargetValidationResult
} from "@servicenow-automation/profiles";

export type BrowserSessionAction = "open-controlled-browser" | "wait-for-manual-login" | "capture-page-context-only";

export type BrowserSessionPlanStatus = "ready" | "blocked" | "not-required";

export type BrowserSessionSafety = {
  manualLoginRequired: boolean;
  credentialsStoredInSource: false;
  realSubmitAllowed: false;
  requiresAlanApprovalBeforeAnyRealSubmit: boolean;
  browserAutomationImplemented: false;
  shadowOnly: boolean;
  writeOperationsAllowed: false;
};

export type BrowserSessionLaunchPlan = {
  status: BrowserSessionPlanStatus;
  mode: ServiceNowEnvironmentMode;
  environmentLabel: string;
  targetUrl?: string;
  targetValidation?: ServiceNowTargetValidationResult;
  blockedReason?: string;
  browserProfileDirectory: string;
  actions: BrowserSessionAction[];
  sessionStoragePolicy: "ignored-local-runtime-directory";
  gitIgnorePattern: ".local/";
  safety: BrowserSessionSafety;
  auditNotes: string[];
};

export type BrowserSessionResetResult = {
  mode: ServiceNowEnvironmentMode;
  deletedDirectory: string;
  recreatedDirectory: string;
  safetyNotes: string[];
};

export type BrowserSessionServiceOptions = {
  projectRoot: string;
};

export type CreateLaunchPlanOptions = {
  targetUrlOverride?: string;
};

export type BrowserSessionService = {
  createLaunchPlan: (
    environment: ServiceNowEnvironmentConfig,
    options?: CreateLaunchPlanOptions
  ) => BrowserSessionLaunchPlan;
  ensureBrowserProfileDirectory: (environment: ServiceNowEnvironmentConfig) => Promise<string>;
  resetSession: (environment: ServiceNowEnvironmentConfig) => Promise<BrowserSessionResetResult>;
};

export function createBrowserSessionService(options: BrowserSessionServiceOptions): BrowserSessionService {
  const projectRoot = resolve(options.projectRoot);

  function getBrowserProfileDirectory(environment: ServiceNowEnvironmentConfig): string {
    const profileDirectory = resolve(projectRoot, environment.localRuntimeDirectory);
    assertSafeRuntimeDirectory(profileDirectory, projectRoot);
    return profileDirectory;
  }

  return {
    createLaunchPlan(environment, planOptions = {}) {
      const targetUrl = planOptions.targetUrlOverride ?? environment.url;
      const targetValidation = validateServiceNowTargetUrl(environment, targetUrl);
      const browserProfileDirectory = getBrowserProfileDirectory(environment);
      const basePlan: BrowserSessionLaunchPlan = {
        status: "ready",
        mode: environment.mode,
        environmentLabel: environment.label,
        targetUrl: targetValidation.allowed ? targetValidation.targetUrl : undefined,
        targetValidation,
        browserProfileDirectory,
        actions: ["open-controlled-browser", "wait-for-manual-login", "capture-page-context-only"],
        sessionStoragePolicy: "ignored-local-runtime-directory",
        gitIgnorePattern: ".local/",
        safety: {
          manualLoginRequired: environment.credentialPolicy === "manual-login-only",
          credentialsStoredInSource: false,
          realSubmitAllowed: false,
          requiresAlanApprovalBeforeAnyRealSubmit: environment.requiresExplicitApprovalBeforeRealSubmit,
          browserAutomationImplemented: false,
          shadowOnly: environment.shadowOnly,
          writeOperationsAllowed: false
        },
        auditNotes: [
          "Browser automation is a skeleton plan only; no browser is launched by this service yet.",
          "Credentials must be entered manually in the controlled browser session and never stored in source code.",
          "Browser profile data must stay under the ignored .local runtime directory."
        ]
      };

      if (environment.mode === "mock") {
        return {
          ...basePlan,
          status: "not-required",
          targetUrl: undefined,
          actions: [],
          safety: {
            ...basePlan.safety,
            manualLoginRequired: false
          },
          auditNotes: [
            "Mock mode uses offline demo data and does not need a browser session.",
            "No external ServiceNow system is opened in mock mode."
          ]
        };
      }

      if (!targetValidation.allowed) {
        const blockedReason =
          targetValidation.reason === "no-allowlisted-host" && !planOptions.targetUrlOverride
            ? "No allowlisted ServiceNow host configured for this environment."
            : "Target URL is not allowlisted for this environment.";

        return {
          ...basePlan,
          status: "blocked",
          actions: [],
          blockedReason,
          auditNotes: [
            blockedReason,
            environment.mode === "production-shadow"
              ? "Production shadow mode remains read-only; submit, close, and update remain blocked."
              : "Configure an allowlisted HTTPS ServiceNow host before creating a controlled browser launch plan."
          ]
        };
      }

      if (environment.mode === "production-shadow") {
        return {
          ...basePlan,
          safety: {
            ...basePlan.safety,
            shadowOnly: true,
            realSubmitAllowed: false,
            writeOperationsAllowed: false
          },
          auditNotes: [
            ...basePlan.auditNotes,
            "Production shadow mode may capture context for comparison only; submit, close, and update remain blocked."
          ]
        };
      }

      return basePlan;
    },

    async ensureBrowserProfileDirectory(environment) {
      const profileDirectory = getBrowserProfileDirectory(environment);
      await mkdir(profileDirectory, { recursive: true });
      return profileDirectory;
    },

    async resetSession(environment) {
      const profileDirectory = getBrowserProfileDirectory(environment);
      await rm(profileDirectory, { recursive: true, force: true });
      await mkdir(profileDirectory, { recursive: true });

      return {
        mode: environment.mode,
        deletedDirectory: profileDirectory,
        recreatedDirectory: profileDirectory,
        safetyNotes: [
          "Only the ignored browser profile directory was reset.",
          "No source-controlled files, credentials, or ServiceNow records were modified."
        ]
      };
    }
  };
}

function assertSafeRuntimeDirectory(profileDirectory: string, projectRoot: string): void {
  const safeRuntimeRoot = resolve(projectRoot, ".local/servicenow-browser-profiles");
  const normalizedProfile = resolve(profileDirectory);

  const relativePath = relative(safeRuntimeRoot, normalizedProfile);

  if (relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath))) {
    return;
  }

  throw new Error(`Refusing to manage browser session directory outside ignored runtime root: ${normalizedProfile}`);
}
