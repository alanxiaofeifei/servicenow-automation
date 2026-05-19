import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { isAbsolute, normalize, relative, resolve } from "node:path";

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

export type BrowserLaunchCommand = {
  executable: string;
  args: string[];
  targetUrl: string;
  profileDirectory: string;
};

export type BrowserLaunchProcess = {
  pid: number | undefined;
};

export type BrowserLauncher = (command: BrowserLaunchCommand) => BrowserLaunchProcess | Promise<BrowserLaunchProcess>;

export type BrowserNoWriteLaunchStatus = "dry-run" | "launched" | "blocked" | "not-required";

export type BrowserNoWriteLaunchSafety = {
  noWriteMode: true;
  formAutomationAllowed: false;
  fieldFillAllowed: false;
  realServiceNowApiCalled: false;
  realSubmitAllowed: false;
  writeOperationsAllowed: false;
  realActionGateRequiredForWrites: true;
};

export type BrowserNoWriteLaunchCommandPreview = {
  executable: string;
  args: string[];
  targetHost: string;
  targetPath: string;
  profileDirectory: string;
};

export type BrowserProfileIsolation = {
  status: "verified" | "blocked";
  reason?: string;
};

export type BrowserNoWriteLaunchResult = {
  status: BrowserNoWriteLaunchStatus;
  plan: BrowserSessionLaunchPlan;
  commandPreview?: BrowserNoWriteLaunchCommandPreview;
  process?: BrowserLaunchProcess;
  blockedReason?: string;
  profileIsolation?: BrowserProfileIsolation;
  safety: BrowserNoWriteLaunchSafety;
  auditNotes: string[];
};

export type BrowserSessionServiceOptions = {
  projectRoot: string;
  browserExecutablePath?: string;
  browserLauncher?: BrowserLauncher;
};

export type CreateLaunchPlanOptions = {
  targetUrlOverride?: string;
};

export type LaunchNoWriteBrowserOptions = CreateLaunchPlanOptions & {
  execute?: boolean;
  confirmNoWriteLaunch?: boolean;
  browserExecutablePath?: string;
};

export type BrowserSessionService = {
  createLaunchPlan: (
    environment: ServiceNowEnvironmentConfig,
    options?: CreateLaunchPlanOptions
  ) => BrowserSessionLaunchPlan;
  launchNoWriteBrowser: (
    environment: ServiceNowEnvironmentConfig,
    options?: LaunchNoWriteBrowserOptions
  ) => Promise<BrowserNoWriteLaunchResult>;
  ensureBrowserProfileDirectory: (environment: ServiceNowEnvironmentConfig) => Promise<string>;
  resetSession: (environment: ServiceNowEnvironmentConfig) => Promise<BrowserSessionResetResult>;
};

const WINDOWS_BROWSER_PROFILE_ISOLATION_BLOCKED_REASON =
  "Windows browser executable requires a verified Windows-compatible isolated profile path before launch.";
const WINDOWS_BROWSER_PROFILE_ISOLATION_AUDIT_NOTE =
  "Profile isolation strategy must be implemented before launching a Windows browser executable from WSL.";

export function createBrowserSessionService(options: BrowserSessionServiceOptions): BrowserSessionService {
  const projectRoot = resolve(options.projectRoot);
  const launcher = options.browserLauncher ?? defaultBrowserLauncher;

  function getBrowserProfileDirectory(environment: ServiceNowEnvironmentConfig): string {
    const profileDirectory = resolve(projectRoot, environment.localRuntimeDirectory);
    assertSafeRuntimeDirectory(profileDirectory, projectRoot);
    return profileDirectory;
  }

  function createLaunchPlan(
    environment: ServiceNowEnvironmentConfig,
    planOptions: CreateLaunchPlanOptions = {}
  ): BrowserSessionLaunchPlan {
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
        "Browser launch is no-write only; no DOM automation, field fill, submit, update, save, close, upload, or email action is performed.",
        "Credentials must be entered manually in the controlled browser session and never stored in source code.",
        "Browser profile data must stay under the ignored .local runtime directory."
      ]
    };

    if (environment.mode === "mock") {
      return {
        ...basePlan,
        status: "not-required" as const,
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
        status: "blocked" as const,
        targetUrl: undefined,
        actions: [],
        blockedReason,
        auditNotes: [
          blockedReason,
          environment.mode === "production-shadow"
            ? "Production shadow mode remains read-only; submit, close, update, and save remain blocked."
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
          "Production shadow mode may capture context for comparison only; submit, close, update, and save remain blocked."
        ]
      };
    }

    return basePlan;
  }

  async function launchNoWriteBrowser(
    environment: ServiceNowEnvironmentConfig,
    launchOptions: LaunchNoWriteBrowserOptions = {}
  ): Promise<BrowserNoWriteLaunchResult> {
    const plan = createLaunchPlan(environment, launchOptions);
    const baseResult = createBaseNoWriteLaunchResult(plan);

    if (plan.status === "not-required") {
      return {
        ...baseResult,
        status: "not-required",
        blockedReason: "Mock mode uses offline demo data and does not open ServiceNow."
      };
    }

    if (environment.mode === "production-shadow") {
      return {
        ...baseResult,
        status: "blocked",
        blockedReason: "Production shadow browser launch remains blocked until #19 is complete.",
        auditNotes: [
          ...baseResult.auditNotes,
          "Production shadow browser launch remains blocked until #19 is complete."
        ]
      };
    }

    if (plan.status !== "ready" || !plan.targetUrl) {
      return {
        ...baseResult,
        status: "blocked",
        blockedReason: plan.blockedReason ?? "Browser launch plan is blocked."
      };
    }

    const browserExecutablePath = resolveBrowserExecutablePath(launchOptions.browserExecutablePath ?? options.browserExecutablePath);
    const profileIsolation = validateBrowserProfileIsolation(browserExecutablePath);

    if (profileIsolation.status === "blocked") {
      const blockedPlan: BrowserSessionLaunchPlan = {
        ...plan,
        status: "blocked",
        blockedReason: profileIsolation.reason,
        actions: [],
        auditNotes: [
          ...plan.auditNotes,
          WINDOWS_BROWSER_PROFILE_ISOLATION_AUDIT_NOTE
        ]
      };

      return {
        ...baseResult,
        plan: blockedPlan,
        status: "blocked",
        blockedReason: profileIsolation.reason,
        profileIsolation,
        auditNotes: [
          ...baseResult.auditNotes,
          WINDOWS_BROWSER_PROFILE_ISOLATION_AUDIT_NOTE
        ]
      };
    }

    const command = buildBrowserLaunchCommand(plan, browserExecutablePath);
    const commandPreview = sanitizeCommandPreview(command);

    if (!launchOptions.execute) {
      return {
        ...baseResult,
        status: "dry-run",
        commandPreview,
        auditNotes: [
          ...baseResult.auditNotes,
          "Dry-run only: command preview generated, browser process was not started."
        ]
      };
    }

    if (!launchOptions.confirmNoWriteLaunch) {
      return {
        ...baseResult,
        status: "blocked",
        commandPreview,
        blockedReason: "Explicit --confirm-no-write-launch is required before opening a real QA/dev browser window."
      };
    }

    await mkdir(plan.browserProfileDirectory, { recursive: true });

    try {
      const process = await launcher(command);
      if (!process.pid) {
        return {
          ...baseResult,
          status: "blocked",
          commandPreview,
          blockedReason: "Browser process could not be started. Check the configured browser executable.",
          auditNotes: [
            ...baseResult.auditNotes,
            "Browser executable did not report a process id; launch was treated as blocked."
          ]
        };
      }

      return {
        ...baseResult,
        status: "launched",
        commandPreview,
        process,
        auditNotes: [
          ...baseResult.auditNotes,
          "Controlled browser process launched in no-write mode. Manual login only; no page automation was executed."
        ]
      };
    } catch {
      return {
        ...baseResult,
        status: "blocked",
        commandPreview,
        blockedReason: "Browser process could not be started. Check the configured browser executable.",
        auditNotes: [
          ...baseResult.auditNotes,
          "Browser launch failed before a controlled session could start; raw spawn arguments were not exposed."
        ]
      };
    }
  }

  return {
    createLaunchPlan,
    launchNoWriteBrowser,

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

function createBaseNoWriteLaunchResult(plan: BrowserSessionLaunchPlan): BrowserNoWriteLaunchResult {
  return {
    status: "blocked",
    plan,
    safety: {
      noWriteMode: true,
      formAutomationAllowed: false,
      fieldFillAllowed: false,
      realServiceNowApiCalled: false,
      realSubmitAllowed: false,
      writeOperationsAllowed: false,
      realActionGateRequiredForWrites: true
    },
    auditNotes: [
      "No-write launch result: browser opening is separated from all ServiceNow write actions.",
      "Any future submit, update, save, close, create-change, upload, or email action must pass RealActionGate."
    ]
  };
}

function resolveBrowserExecutablePath(browserExecutablePath: string | undefined): string {
  return browserExecutablePath ?? process.env.SDA_BROWSER_EXECUTABLE ?? "chromium";
}

function validateBrowserProfileIsolation(browserExecutablePath: string): BrowserProfileIsolation {
  if (isWindowsBrowserExecutableFromLinux(browserExecutablePath)) {
    return {
      status: "blocked",
      reason: WINDOWS_BROWSER_PROFILE_ISOLATION_BLOCKED_REASON
    };
  }

  return { status: "verified" };
}

function isWindowsBrowserExecutableFromLinux(browserExecutablePath: string): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  const normalizedExecutablePath = normalize(browserExecutablePath.trim()).replace(/\\\\/g, "/").toLowerCase();
  return normalizedExecutablePath.endsWith(".exe") || /^\/mnt\/[a-z]\//.test(normalizedExecutablePath);
}

function buildBrowserLaunchCommand(plan: BrowserSessionLaunchPlan, browserExecutablePath: string): BrowserLaunchCommand {
  if (!plan.targetUrl) {
    throw new Error("Cannot build browser launch command without an allowlisted target URL.");
  }

  const executable = browserExecutablePath;
  const args = [
    `--user-data-dir=${plan.browserProfileDirectory}`,
    "--no-first-run",
    "--new-window",
    plan.targetUrl
  ];

  return {
    executable,
    args,
    targetUrl: plan.targetUrl,
    profileDirectory: plan.browserProfileDirectory
  };
}

function sanitizeCommandPreview(command: BrowserLaunchCommand): BrowserNoWriteLaunchCommandPreview {
  const target = new URL(command.targetUrl);
  return {
    executable: command.executable,
    args: command.args.map((arg) => {
      if (arg === command.targetUrl) {
        return `${target.protocol}//${target.host}${target.pathname}`;
      }
      return arg;
    }),
    targetHost: target.host,
    targetPath: target.pathname,
    profileDirectory: command.profileDirectory
  };
}

function defaultBrowserLauncher(command: BrowserLaunchCommand): Promise<BrowserLaunchProcess> {
  return new Promise((resolve, reject) => {
    const child = spawn(command.executable, command.args, {
      detached: true,
      stdio: "ignore"
    });
    let settled = false;

    child.once("error", () => {
      if (!settled) {
        settled = true;
        reject(new Error("browser-spawn-failed"));
      }
    });

    setImmediate(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.unref();
      resolve({ pid: child.pid });
    });
  });
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
