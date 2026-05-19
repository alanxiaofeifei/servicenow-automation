import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

import type { ServiceNowEnvironmentConfig, ServiceNowEnvironmentMode } from "@servicenow-automation/profiles";

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
      const browserProfileDirectory = getBrowserProfileDirectory(environment);
      const basePlan: BrowserSessionLaunchPlan = {
        status: "ready",
        mode: environment.mode,
        environmentLabel: environment.label,
        targetUrl,
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

      if (!targetUrl) {
        return {
          ...basePlan,
          status: "blocked",
          actions: [],
          blockedReason: "No authorized ServiceNow URL configured for this environment.",
          auditNotes: [
            "No authorized ServiceNow URL configured for this environment.",
            "Provide a QA/dev URL explicitly before creating a controlled browser launch plan."
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

  if (normalizedProfile !== safeRuntimeRoot && !normalizedProfile.startsWith(`${safeRuntimeRoot}/`)) {
    throw new Error(`Refusing to manage browser session directory outside ignored runtime root: ${normalizedProfile}`);
  }
}
