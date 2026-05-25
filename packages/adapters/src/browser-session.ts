import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, normalize, relative, resolve, win32 } from "node:path";

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

export type WindowsBrowserRuntimePathClassification = {
  status: "allowed" | "blocked" | "not-applicable";
  reason:
    | "tool-owned-dedicated-chromium-runtime"
    | "daily-installed-browser-runtime-denied"
    | "parent-traversal-denied"
    | "not-tool-owned-dedicated-chromium-runtime"
    | "not-windows-runtime-path";
  normalizedPath: string;
};

export type WindowsToolOwnedProfileRootValidation = {
  status: "allowed" | "blocked";
  reason:
    | "tool-owned-disposable-profile-root"
    | "daily-browser-profile-root-denied"
    | "parent-traversal-denied"
    | "ambiguous-or-relative-profile-root-denied"
    | "not-tool-owned-disposable-profile-root";
  normalizedPath: string;
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

export type BrowserSmokeStatus = "dry-run" | "launched" | "blocked";

export type BrowserSmokeTargetValidation = {
  status: "allowed" | "blocked";
  reason: "about-blank-target" | "unsafe-smoke-target-denied";
  target?: "about:blank";
};

export type BrowserSmokeCommandPreview = {
  executable: string;
  args: string[];
  target: "about:blank";
  profileDirectory: string;
};

export type BrowserSmokeSafety = BrowserNoWriteLaunchSafety & {
  browserProcessLaunched: boolean;
  executeRequiredForRealLaunch: true;
  confirmNoWriteLaunchRequiredForRealLaunch: true;
  targetTouchesServiceNow: false;
  pageInspectionAllowed: false;
  captureArtifactsAllowed: false;
};

export type BrowserSmokeResult = {
  status: BrowserSmokeStatus;
  targetValidation: BrowserSmokeTargetValidation;
  runtimeClassification: WindowsBrowserRuntimePathClassification;
  profileValidation: WindowsToolOwnedProfileRootValidation;
  commandPreview?: BrowserSmokeCommandPreview;
  process?: BrowserLaunchProcess;
  blockedReason?: string;
  safety: BrowserSmokeSafety;
  auditNotes: string[];
};

export type DedicatedCdpBrowserHelperCommand = {
  executable: string;
  args: string[];
  helperScriptPath: string;
  rawTargetUrl: string;
  exposeToWsl: boolean;
  environmentMode: ServiceNowEnvironmentMode;
};

export type DedicatedCdpBrowserHelperResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type DedicatedCdpBrowserHelperLauncher = (
  command: DedicatedCdpBrowserHelperCommand
) => Promise<DedicatedCdpBrowserHelperResult>;

export type QaDedicatedCdpBrowserStartStatus = "dry-run" | "ready" | "blocked";

export type QaDedicatedCdpBrowserRedactedTarget = {
  hostRedacted: true;
  rawUrlRedacted: true;
};

export type QaDedicatedCdpBrowserCommandPreview = {
  executable: string;
  helperScript: "scripts/windows/start-dedicated-chromium-cdp.ps1";
  args: string[];
  target: QaDedicatedCdpBrowserRedactedTarget;
  exposeToWsl: boolean;
};

export type QaDedicatedCdpBrowserProfile = {
  toolOwned: true;
  disposable: true;
  purpose: string;
  sessionId: string;
};

export type QaDedicatedCdpBrowserStartSafety = BrowserNoWriteLaunchSafety & {
  browserProcessLaunched: boolean;
  cdpEndpointReady: boolean;
  cdpBoundToLoopbackOnly: boolean;
  wslBridgeRequired: boolean;
  manualLoginRequired: true;
  pageInspectionAllowed: false;
  captureArtifactsAllowed: false;
  serviceNowWritePerformed: false;
  saveSubmitUpdateClosePerformed: false;
  artifactsCaptured: false;
};

export type QaDedicatedCdpBrowserStartResult = {
  status: QaDedicatedCdpBrowserStartStatus;
  mode: ServiceNowEnvironmentMode;
  processId?: number;
  cdpEndpoint?: string;
  runtimeLogPath?: string;
  target: QaDedicatedCdpBrowserRedactedTarget;
  profile?: QaDedicatedCdpBrowserProfile;
  commandPreview?: QaDedicatedCdpBrowserCommandPreview;
  blockedReason?: string;
  safety: QaDedicatedCdpBrowserStartSafety;
  auditNotes: string[];
};

export type StartQaDedicatedCdpBrowserOptions = CreateLaunchPlanOptions & {
  execute?: boolean;
  confirmNoWriteLaunch?: boolean;
  helperScriptPath?: string;
  powershellExecutable?: string;
  exposeToWsl?: boolean;
  confirmDevOnlyWslExposure?: boolean;
  helperLauncher?: DedicatedCdpBrowserHelperLauncher;
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

export type SmokeWindowsDedicatedChromiumOptions = {
  target?: string;
  execute?: boolean;
  confirmNoWriteLaunch?: boolean;
  browserExecutablePath?: string;
  profileDirectory?: string;
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
  smokeWindowsDedicatedChromium: (
    options?: SmokeWindowsDedicatedChromiumOptions
  ) => Promise<BrowserSmokeResult>;
  startQaDedicatedCdpBrowser: (
    environment: ServiceNowEnvironmentConfig,
    options?: StartQaDedicatedCdpBrowserOptions
  ) => Promise<QaDedicatedCdpBrowserStartResult>;
  ensureBrowserProfileDirectory: (environment: ServiceNowEnvironmentConfig) => Promise<string>;
  resetSession: (environment: ServiceNowEnvironmentConfig) => Promise<BrowserSessionResetResult>;
};

const WINDOWS_BROWSER_PROFILE_ISOLATION_BLOCKED_REASON =
  "Windows browser executable requires a verified Windows-compatible isolated profile path before launch.";
const WINDOWS_BROWSER_PROFILE_ISOLATION_AUDIT_NOTE =
  "Profile isolation strategy must be implemented before launching a Windows browser executable from WSL.";
const WINDOWS_DAILY_BROWSER_RUNTIME_BLOCKED_REASON =
  "Daily installed Chrome/Edge cannot be used as the dedicated product browser runtime.";
const WINDOWS_PROFILE_ROOT_BLOCKED_REASON =
  "Windows dedicated Chromium runtime requires a tool-owned disposable profile root.";

const WINDOWS_DAILY_BROWSER_EXECUTABLE_PATHS = [
  "c:\\program files\\google\\chrome\\application\\chrome.exe",
  "c:\\program files (x86)\\google\\chrome\\application\\chrome.exe",
  "c:\\program files\\microsoft\\edge\\application\\msedge.exe",
  "c:\\program files (x86)\\microsoft\\edge\\application\\msedge.exe",
  "%programfiles%\\google\\chrome\\application\\chrome.exe",
  "%programfiles(x86)%\\google\\chrome\\application\\chrome.exe",
  "%programfiles%\\microsoft\\edge\\application\\msedge.exe",
  "%programfiles(x86)%\\microsoft\\edge\\application\\msedge.exe"
];

const WINDOWS_DAILY_PROFILE_ROOT_MARKERS = [
  "\\google\\chrome\\user data",
  "\\microsoft\\edge\\user data",
  "\\mozilla\\firefox\\profiles"
];

const WINDOWS_ALLOWED_CHROMIUM_EXECUTABLE_NAMES = new Set(["chrome.exe", "chromium.exe"]);
const DEDICATED_CDP_HELPER_RELATIVE_PATH = "scripts/windows/start-dedicated-chromium-cdp.ps1";
const DEFAULT_DEDICATED_CDP_ENDPOINT = ["http://127.0.0.1", "54656"].join(":");
const DEFAULT_DEDICATED_CDP_PROCESS_ID = 0;
const QA_DEDICATED_CDP_CONFIRMATION_BLOCKED_REASON =
  "Explicit --confirm-no-write-launch is required before starting a QA/dev dedicated CDP browser.";

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
      const blockedReason = browserLaunchTargetBlockedReason(targetValidation, planOptions.targetUrlOverride);

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
    const profileIsolation = validateBrowserProfileIsolation(browserExecutablePath, plan.browserProfileDirectory);

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

  async function smokeWindowsDedicatedChromium(
    smokeOptions: SmokeWindowsDedicatedChromiumOptions = {}
  ): Promise<BrowserSmokeResult> {
    const targetValidation = validateBrowserSmokeTarget(smokeOptions.target);
    const browserExecutablePath = resolveBrowserExecutablePath(smokeOptions.browserExecutablePath ?? options.browserExecutablePath);
    const profileDirectory = smokeOptions.profileDirectory ?? defaultWindowsSmokeProfileDirectory();
    const runtimeClassification = classifyWindowsBrowserRuntimePath(browserExecutablePath);
    const profileValidation = validateWindowsToolOwnedProfileRoot(profileDirectory);
    const baseResult = createBaseBrowserSmokeResult({
      targetValidation,
      runtimeClassification,
      profileValidation
    });

    if (targetValidation.status === "blocked") {
      return {
        ...baseResult,
        blockedReason: "Browser smoke target must be about:blank; HTTP, HTTPS, and ServiceNow targets are blocked."
      };
    }

    if (runtimeClassification.status !== "allowed") {
      return {
        ...baseResult,
        blockedReason:
          runtimeClassification.reason === "daily-installed-browser-runtime-denied"
            ? WINDOWS_DAILY_BROWSER_RUNTIME_BLOCKED_REASON
            : "Browser smoke requires a Windows tool-owned dedicated Chromium runtime path."
      };
    }

    if (profileValidation.status !== "allowed") {
      return {
        ...baseResult,
        blockedReason: WINDOWS_PROFILE_ROOT_BLOCKED_REASON
      };
    }

    const command = buildBrowserSmokeCommand(browserExecutablePath, profileDirectory);
    const commandPreview = sanitizeBrowserSmokeCommandPreview(command);

    if (!smokeOptions.execute) {
      return {
        ...baseResult,
        status: "dry-run",
        commandPreview,
        auditNotes: [
          ...baseResult.auditNotes,
          "Dry-run only: about:blank smoke command preview generated, browser process was not started."
        ]
      };
    }

    if (!smokeOptions.confirmNoWriteLaunch) {
      return {
        ...baseResult,
        commandPreview,
        blockedReason: "Explicit --confirm-no-write-launch is required before running the Windows Chromium smoke launch."
      };
    }

    if (process.platform === "win32" || !isWindowsRootedPath(profileDirectory)) {
      await mkdir(profileDirectory, { recursive: true });
    }

    try {
      const launchedProcess = await launcher(command);
      if (!launchedProcess.pid) {
        return {
          ...baseResult,
          commandPreview,
          blockedReason: "Browser process could not be started. Check the configured browser executable.",
          auditNotes: [
            ...baseResult.auditNotes,
            "Browser executable did not report a process id; smoke launch was treated as blocked."
          ]
        };
      }

      return {
        ...baseResult,
        status: "launched",
        commandPreview,
        process: launchedProcess,
        safety: {
          ...baseResult.safety,
          browserProcessLaunched: true
        },
        auditNotes: [
          ...baseResult.auditNotes,
          "Dedicated Chromium smoke process launched with about:blank only; no ServiceNow target or page automation was used."
        ]
      };
    } catch {
      return {
        ...baseResult,
        commandPreview,
        blockedReason: "Browser process could not be started. Check the configured browser executable.",
        auditNotes: [
          ...baseResult.auditNotes,
          "Browser smoke launch failed before a controlled session could start; raw spawn errors were not exposed."
        ]
      };
    }
  }

  async function startQaDedicatedCdpBrowser(
    environment: ServiceNowEnvironmentConfig,
    startOptions: StartQaDedicatedCdpBrowserOptions = {}
  ): Promise<QaDedicatedCdpBrowserStartResult> {
    const plan = createLaunchPlan(environment, startOptions);
    const baseResult = createBaseQaDedicatedCdpBrowserStartResult(environment.mode);
    const runtimeLogPath = createQaDedicatedCdpRuntimeLogPath(projectRoot);

    if (environment.mode === "mock") {
      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        blockedReason: "Mock mode uses offline demo data and does not start a dedicated CDP browser."
      }, runtimeLogPath, "mock-mode-blocked");
    }

    if (environment.mode === "production-shadow") {
      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        blockedReason: "Production shadow dedicated CDP browser remains blocked; use QA/dev only."
      }, runtimeLogPath, "production-shadow-blocked");
    }

    if (plan.status !== "ready" || !plan.targetUrl) {
      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        blockedReason: plan.blockedReason ?? "Dedicated CDP browser launch plan is blocked."
      }, runtimeLogPath, "target-plan-blocked");
    }

    const exposeToWsl = startOptions.exposeToWsl ?? false;
    if (exposeToWsl && (environment.mode !== "dev" || !startOptions.confirmDevOnlyWslExposure)) {
      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        blockedReason: "WSL CDP exposure is dev-only and requires explicit --confirm-dev-only-wsl-exposure.",
        auditNotes: [
          ...baseResult.auditNotes,
          "WSL CDP exposure was blocked before helper command construction; default QA operator launch remains loopback-only."
        ]
      }, runtimeLogPath, "wsl-exposure-blocked");
    }

    const command = buildDedicatedCdpHelperCommand({
      executable: startOptions.powershellExecutable ?? "powershell.exe",
      helperScriptPath: toWindowsInteropPath(startOptions.helperScriptPath ?? defaultDedicatedCdpHelperScriptPath(projectRoot)),
      targetUrl: plan.targetUrl,
      environmentMode: environment.mode,
      exposeToWsl,
      confirmDevOnlyWslExposure: startOptions.confirmDevOnlyWslExposure === true
    });
    const commandPreview = sanitizeDedicatedCdpHelperCommandPreview(command);

    if (!startOptions.execute) {
      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        status: "dry-run",
        commandPreview,
        auditNotes: [
          ...baseResult.auditNotes,
          "Dry-run only: dedicated CDP browser helper command preview generated; browser process was not started."
        ]
      }, runtimeLogPath, "dry-run");
    }

    if (!startOptions.confirmNoWriteLaunch) {
      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        commandPreview,
        blockedReason: QA_DEDICATED_CDP_CONFIRMATION_BLOCKED_REASON
      }, runtimeLogPath, "launch-confirmation-blocked");
    }

    const helperLauncher = startOptions.helperLauncher ?? defaultDedicatedCdpBrowserHelperLauncher;

    try {
      const helperResult = await helperLauncher(command);
      const helperPayload = parseDedicatedCdpHelperPayload(helperResult.stdout);
      const helperReportedLoopbackOnly = helperPayload.safety?.cdpBoundToLoopbackOnly !== false;
      if (
        helperResult.exitCode !== 0 ||
        helperPayload.status !== "ready" ||
        !isSafeLoopbackCdpEndpoint(helperPayload.cdpEndpoint) ||
        (!exposeToWsl && !helperReportedLoopbackOnly)
      ) {
        return finalizeQaDedicatedCdpBrowserStartResult({
          ...baseResult,
          commandPreview,
          blockedReason: dedicatedCdpHelperBlockedReason(helperPayload),
          auditNotes: [
            ...baseResult.auditNotes,
            "Dedicated CDP browser helper returned a blocked or non-loopback result; raw helper output was not exposed."
          ]
        }, runtimeLogPath, "helper-blocked");
      }

      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        status: "ready",
        processId: typeof helperPayload.processId === "number" ? helperPayload.processId : DEFAULT_DEDICATED_CDP_PROCESS_ID,
        cdpEndpoint: helperPayload.cdpEndpoint,
        profile: sanitizeDedicatedCdpProfile(helperPayload.profile),
        commandPreview,
        safety: {
          ...baseResult.safety,
          browserProcessLaunched: true,
          cdpEndpointReady: true,
          cdpBoundToLoopbackOnly: helperPayload.safety?.cdpBoundToLoopbackOnly !== false,
          wslBridgeRequired: helperPayload.safety?.wslBridgeRequired === true
        },
        auditNotes: [
          ...baseResult.auditNotes,
          "Dedicated CDP browser is ready for manual login and verify-only field inspection; no page write action was performed."
        ]
      }, runtimeLogPath, "ready");
    } catch {
      return finalizeQaDedicatedCdpBrowserStartResult({
        ...baseResult,
        commandPreview,
        blockedReason: "Dedicated CDP browser helper could not be started or returned invalid JSON.",
        auditNotes: [
          ...baseResult.auditNotes,
          "Dedicated CDP browser helper failed before a controlled session could be verified; raw errors were not exposed."
        ]
      }, runtimeLogPath, "helper-error");
    }
  }

  return {
    createLaunchPlan,
    launchNoWriteBrowser,
    smokeWindowsDedicatedChromium,
    startQaDedicatedCdpBrowser,

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

function browserLaunchTargetBlockedReason(
  targetValidation: ServiceNowTargetValidationResult,
  targetUrlOverride: string | undefined
): string {
  switch (targetValidation.reason) {
    case "invalid-url":
      return "Target URL is invalid. Paste only the HTTPS ServiceNow landing URL value; do not include angle brackets or shell placeholders.";
    case "sensitive-url-component-denied":
      return "Target URL must be a safe ServiceNow landing URL with no query, hash, encoded query, ticket id, credential marker, or deep record payload.";
    case "credentials-in-url-denied":
      return "Target URL must not include credentials or user info.";
    case "https-required":
      return "Target URL must use HTTPS.";
    case "no-target-url":
      return "Target URL is required before starting a controlled ServiceNow browser session.";
    case "no-allowlisted-host":
      return targetUrlOverride
        ? "Target URL is not allowlisted for this environment."
        : "No allowlisted ServiceNow host configured for this environment.";
    case "host-not-allowlisted":
      return "Target URL is not allowlisted for this environment.";
    case "mock-has-no-service-now-target":
      return "Mock mode uses offline demo data and does not open ServiceNow.";
    case "target-allowlisted":
      return "Target URL is allowlisted.";
  }
}

function createBaseBrowserSmokeResult(input: {
  targetValidation: BrowserSmokeTargetValidation;
  runtimeClassification: WindowsBrowserRuntimePathClassification;
  profileValidation: WindowsToolOwnedProfileRootValidation;
}): BrowserSmokeResult {
  return {
    status: "blocked",
    targetValidation: input.targetValidation,
    runtimeClassification: input.runtimeClassification,
    profileValidation: input.profileValidation,
    safety: {
      noWriteMode: true,
      formAutomationAllowed: false,
      fieldFillAllowed: false,
      realServiceNowApiCalled: false,
      realSubmitAllowed: false,
      writeOperationsAllowed: false,
      realActionGateRequiredForWrites: true,
      browserProcessLaunched: false,
      executeRequiredForRealLaunch: true,
      confirmNoWriteLaunchRequiredForRealLaunch: true,
      targetTouchesServiceNow: false,
      pageInspectionAllowed: false,
      captureArtifactsAllowed: false
    },
    auditNotes: [
      "Windows Chromium smoke is separate from ServiceNow browser launch and does not validate or open a ServiceNow target.",
      "Only about:blank is allowed for this smoke command; HTTP, HTTPS, and ServiceNow URLs are blocked.",
      "No DOM automation, page inspection, browser artifact export, field fill, submit, update, save, close, upload, email, or ServiceNow API call is performed."
    ]
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

type DedicatedCdpBrowserHelperPayload = {
  status?: string;
  processId?: unknown;
  cdpEndpoint?: unknown;
  blockedReason?: string;
  targetValidation?: {
    reason?: unknown;
    rawUrlRedacted?: unknown;
  };
  profile?: {
    toolOwned?: unknown;
    disposable?: unknown;
    purpose?: unknown;
    sessionId?: unknown;
  };
  safety?: {
    browserProcessLaunched?: unknown;
    cdpBoundToLoopbackOnly?: unknown;
    wslBridgeRequired?: unknown;
    manualLoginRequired?: unknown;
    serviceNowWritePerformed?: unknown;
    saveSubmitUpdateClosePerformed?: unknown;
    artifactsCaptured?: unknown;
  };
};

function createBaseQaDedicatedCdpBrowserStartResult(mode: ServiceNowEnvironmentMode): QaDedicatedCdpBrowserStartResult {
  return {
    status: "blocked",
    mode,
    target: {
      hostRedacted: true,
      rawUrlRedacted: true
    },
    safety: {
      noWriteMode: true,
      formAutomationAllowed: false,
      fieldFillAllowed: false,
      realServiceNowApiCalled: false,
      realSubmitAllowed: false,
      writeOperationsAllowed: false,
      realActionGateRequiredForWrites: true,
      browserProcessLaunched: false,
      cdpEndpointReady: false,
      cdpBoundToLoopbackOnly: true,
      wslBridgeRequired: false,
      manualLoginRequired: true,
      pageInspectionAllowed: false,
      captureArtifactsAllowed: false,
      serviceNowWritePerformed: false,
      saveSubmitUpdateClosePerformed: false,
      artifactsCaptured: false
    },
    auditNotes: [
      "Dedicated CDP browser startup is no-write only and separate from any form field autofill.",
      "Manual login is required in the controlled browser; credentials, cookies, screenshots, HAR, traces, and session exports are not captured.",
      "Use the returned loopback CDP endpoint only for verify-only field inspection until a separate autofill approval is granted."
    ]
  };
}

function createQaDedicatedCdpRuntimeLogPath(projectRoot: string): string {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const suffix = Math.random().toString(16).slice(2, 8);
  return resolve(projectRoot, ".local", "startup-logs", `qa-dedicated-cdp-${timestamp}-${process.pid}-${suffix}.jsonl`);
}

async function finalizeQaDedicatedCdpBrowserStartResult(
  result: QaDedicatedCdpBrowserStartResult,
  runtimeLogPath: string,
  phase: string
): Promise<QaDedicatedCdpBrowserStartResult> {
  const resultWithPath: QaDedicatedCdpBrowserStartResult = {
    ...result,
    runtimeLogPath
  };

  try {
    await mkdir(dirname(runtimeLogPath), { recursive: true });
    await writeFile(
      runtimeLogPath,
      `${JSON.stringify({
        event: "qa-dedicated-cdp-browser-start",
        phase,
        status: result.status,
        mode: result.mode,
        blockedReason: result.blockedReason,
        cdpEndpointReady: result.safety.cdpEndpointReady,
        browserProcessLaunched: result.safety.browserProcessLaunched,
        cdpBoundToLoopbackOnly: result.safety.cdpBoundToLoopbackOnly,
        noWriteMode: result.safety.noWriteMode,
        targetRedacted: result.target.rawUrlRedacted === true,
        serviceNowWritePerformed: result.safety.serviceNowWritePerformed,
        saveSubmitUpdateClosePerformed: result.safety.saveSubmitUpdateClosePerformed
      })}\n`,
      "utf8"
    );
  } catch {
    return {
      ...resultWithPath,
      auditNotes: [
        ...result.auditNotes,
        "Sanitized startup/runtime log could not be written; raw helper output remains hidden."
      ]
    };
  }

  return resultWithPath;
}

function dedicatedCdpHelperBlockedReason(payload: DedicatedCdpBrowserHelperPayload): string {
  if (payload.blockedReason === "target-url-denied") {
    switch (payload.targetValidation?.reason) {
      case "invalid-url":
        return "Target URL was denied: enter a valid HTTPS ServiceNow landing URL.";
      case "https-required":
        return "Target URL was denied: HTTPS is required.";
      case "credentials-in-url-denied":
        return "Target URL was denied: credentials in URLs are not allowed.";
      case "query-or-fragment-denied":
      case "sensitive-url-component-denied":
        return "Target URL was denied: use a plain ServiceNow landing URL with no query, hash, record id, token, or session payload.";
      case "landing-path-required":
        return "Target URL was denied: use a plain ServiceNow landing page, not a deep record or encoded navigation URL.";
      case "host-not-allowlisted":
      case "service-now-host-required":
        return "Target URL was denied: host is not allowlisted for this environment.";
      default:
        return "Target URL was denied by the dedicated browser helper. Use a plain HTTPS ServiceNow landing URL with no query, hash, record id, token, or session payload.";
    }
  }

  if (payload.blockedReason === "dedicated-chromium-runtime-not-found") {
    return "Dedicated Chromium runtime was not found. Install or repair the tool-owned QA Chromium runtime; daily Chrome/Edge is not used.";
  }

  if (payload.blockedReason === "dedicated-chromium-exited-before-cdp-ready") {
    return "Dedicated Chromium started but exited before CDP became ready. See the startup/runtime log path for sanitized details.";
  }

  if (payload.blockedReason === "cdp-not-ready-timeout") {
    return "Dedicated Chromium started but CDP did not become ready before timeout. See the startup/runtime log path for sanitized details.";
  }

  if (payload.blockedReason === "wsl-cdp-exposure-dev-only") {
    return "WSL CDP exposure is dev-only and requires explicit confirmation; QA remains loopback-only by default.";
  }

  if (payload.blockedReason === "windows-localappdata-unavailable") {
    return "Windows LOCALAPPDATA was unavailable, so a disposable tool-owned browser profile could not be created.";
  }

  return payload.blockedReason ?? "Dedicated CDP browser helper did not report a ready loopback-only endpoint.";
}

function buildDedicatedCdpHelperCommand(input: {
  executable: string;
  helperScriptPath: string;
  targetUrl: string;
  environmentMode: ServiceNowEnvironmentMode;
  exposeToWsl: boolean;
  confirmDevOnlyWslExposure: boolean;
}): DedicatedCdpBrowserHelperCommand {
  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    input.helperScriptPath,
    "-TargetUrl",
    input.targetUrl,
    "-Purpose",
    "qa-autofill-cdp",
    "-EnvironmentMode",
    input.environmentMode
  ];

  if (input.exposeToWsl && input.confirmDevOnlyWslExposure) {
    args.push("-ExposeToWsl", "-ConfirmDevOnlyWslExposure");
  }

  return {
    executable: input.executable,
    args,
    helperScriptPath: input.helperScriptPath,
    rawTargetUrl: input.targetUrl,
    exposeToWsl: input.exposeToWsl,
    environmentMode: input.environmentMode
  };
}

function sanitizeDedicatedCdpHelperCommandPreview(
  command: DedicatedCdpBrowserHelperCommand
): QaDedicatedCdpBrowserCommandPreview {
  return {
    executable: command.executable,
    helperScript: DEDICATED_CDP_HELPER_RELATIVE_PATH as "scripts/windows/start-dedicated-chromium-cdp.ps1",
    args: command.args.map((arg) => (arg === command.rawTargetUrl ? "[REDACTED_SERVICE_NOW_TARGET]" : arg)),
    target: {
      hostRedacted: true,
      rawUrlRedacted: true
    },
    exposeToWsl: command.exposeToWsl
  };
}

function parseDedicatedCdpHelperPayload(stdout: string): DedicatedCdpBrowserHelperPayload {
  const payload = JSON.parse(stdout) as unknown;
  if (!payload || typeof payload !== "object") {
    throw new Error("invalid-dedicated-cdp-helper-payload");
  }
  return payload as DedicatedCdpBrowserHelperPayload;
}

function isSafeLoopbackCdpEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string") {
    return false;
  }

  try {
    const parsed = new URL(endpoint);
    return parsed.protocol === "http:" && ["127.0.0.1", "localhost"].includes(parsed.hostname) && parsed.port.length > 0;
  } catch {
    return false;
  }
}

function sanitizeDedicatedCdpProfile(profile: DedicatedCdpBrowserHelperPayload["profile"]): QaDedicatedCdpBrowserProfile {
  return {
    toolOwned: true,
    disposable: true,
    purpose: typeof profile?.purpose === "string" && profile.purpose.length > 0 ? profile.purpose : "qa-autofill-cdp",
    sessionId: typeof profile?.sessionId === "string" && profile.sessionId.length > 0 ? profile.sessionId : "unknown"
  };
}

function defaultDedicatedCdpBrowserHelperLauncher(
  command: DedicatedCdpBrowserHelperCommand
): Promise<DedicatedCdpBrowserHelperResult> {
  return new Promise((resolve) => {
    const child = spawn(command.executable, command.args, {
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let settled = false;

    child.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.once("error", () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({ exitCode: 1, stdout: "", stderr: "" });
    });

    child.once("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8")
      });
    });
  });
}

function validateBrowserSmokeTarget(target: string | undefined): BrowserSmokeTargetValidation {
  const normalizedTarget = (target ?? "about:blank").trim().toLowerCase();
  if (normalizedTarget === "about:blank") {
    return {
      status: "allowed",
      reason: "about-blank-target",
      target: "about:blank"
    };
  }

  return {
    status: "blocked",
    reason: "unsafe-smoke-target-denied"
  };
}

function resolveBrowserExecutablePath(browserExecutablePath: string | undefined): string {
  return browserExecutablePath ?? process.env.SDA_BROWSER_EXECUTABLE ?? "chromium";
}

function defaultWindowsSmokeProfileDirectory(): string {
  if (process.env.LOCALAPPDATA) {
    return win32.join(process.env.LOCALAPPDATA, "ServiceNowAutomation", "Profiles", "smoke", "default");
  }

  return "%LOCALAPPDATA%\\ServiceNowAutomation\\Profiles\\smoke\\default";
}

function defaultDedicatedCdpHelperScriptPath(projectRoot: string): string {
  const normalizedProjectRoot = normalize(projectRoot).replace(/\\/g, "/").replace(/\/+$/, "");
  if (normalizedProjectRoot.endsWith("/apps/cli")) {
    return resolve(projectRoot, "../..", DEDICATED_CDP_HELPER_RELATIVE_PATH);
  }

  return resolve(projectRoot, DEDICATED_CDP_HELPER_RELATIVE_PATH);
}

function toWindowsInteropPath(pathValue: string): string {
  if (process.platform !== "linux" || isWindowsRootedPath(pathValue)) {
    return pathValue;
  }

  const normalizedPath = normalize(pathValue).replace(/\\/g, "/");
  const mountedDrive = normalizedPath.match(/^\/mnt\/([a-z])\/(.*)$/i);
  if (mountedDrive) {
    return `${mountedDrive[1].toUpperCase()}:\\${mountedDrive[2].replace(/\//g, "\\")}`;
  }

  const distroName = process.env.WSL_DISTRO_NAME;
  if (distroName && normalizedPath.startsWith("/")) {
    return `\\\\wsl.localhost\\${distroName}\\${normalizedPath.slice(1).replace(/\//g, "\\")}`;
  }

  return pathValue;
}

function validateBrowserProfileIsolation(browserExecutablePath: string, profileDirectory: string): BrowserProfileIsolation {
  if (isWindowsBrowserExecutableFromLinux(browserExecutablePath)) {
    return {
      status: "blocked",
      reason: WINDOWS_BROWSER_PROFILE_ISOLATION_BLOCKED_REASON
    };
  }

  const runtimeClassification = classifyWindowsBrowserRuntimePath(browserExecutablePath);
  if (runtimeClassification.status === "blocked") {
    return {
      status: "blocked",
      reason:
        runtimeClassification.reason === "daily-installed-browser-runtime-denied"
          ? WINDOWS_DAILY_BROWSER_RUNTIME_BLOCKED_REASON
          : "Windows browser executable is not a verified tool-owned Chromium runtime."
    };
  }

  if (runtimeClassification.status === "allowed") {
    const profileValidation = validateWindowsToolOwnedProfileRoot(profileDirectory);
    if (profileValidation.status === "blocked") {
      return {
        status: "blocked",
        reason: WINDOWS_PROFILE_ROOT_BLOCKED_REASON
      };
    }
  }

  return { status: "verified" };
}

export function classifyWindowsBrowserRuntimePath(browserExecutablePath: string): WindowsBrowserRuntimePathClassification {
  const normalizedPath = normalizeWindowsPathForComparison(browserExecutablePath);

  if (!isWindowsRuntimePathCandidate(browserExecutablePath)) {
    return {
      status: "not-applicable",
      reason: "not-windows-runtime-path",
      normalizedPath
    };
  }

  if (hasWindowsParentTraversal(browserExecutablePath)) {
    return {
      status: "blocked",
      reason: "parent-traversal-denied",
      normalizedPath
    };
  }

  if (WINDOWS_DAILY_BROWSER_EXECUTABLE_PATHS.includes(normalizedPath)) {
    return {
      status: "blocked",
      reason: "daily-installed-browser-runtime-denied",
      normalizedPath
    };
  }

  const executableName = win32.basename(normalizedPath);
  if (
    WINDOWS_ALLOWED_CHROMIUM_EXECUTABLE_NAMES.has(executableName) &&
    isUnderAnyWindowsRoot(normalizedPath, windowsToolOwnedRuntimeRootCandidates())
  ) {
    return {
      status: "allowed",
      reason: "tool-owned-dedicated-chromium-runtime",
      normalizedPath
    };
  }

  return {
    status: "blocked",
    reason: "not-tool-owned-dedicated-chromium-runtime",
    normalizedPath
  };
}

export function validateWindowsToolOwnedProfileRoot(profileDirectory: string): WindowsToolOwnedProfileRootValidation {
  const normalizedPath = normalizeWindowsPathForComparison(profileDirectory);

  if (hasWindowsParentTraversal(profileDirectory)) {
    return {
      status: "blocked",
      reason: "parent-traversal-denied",
      normalizedPath
    };
  }

  if (!isWindowsRootedPath(profileDirectory)) {
    return {
      status: "blocked",
      reason: "ambiguous-or-relative-profile-root-denied",
      normalizedPath
    };
  }

  if (containsDailyBrowserProfileRoot(normalizedPath)) {
    return {
      status: "blocked",
      reason: "daily-browser-profile-root-denied",
      normalizedPath
    };
  }

  const profileRoot = matchingWindowsRoot(normalizedPath, windowsToolOwnedRootCandidates(["Profiles"]));
  if (!profileRoot) {
    return {
      status: "blocked",
      reason: "not-tool-owned-disposable-profile-root",
      normalizedPath
    };
  }

  const disposableProfileSegments = normalizedPath
    .slice(profileRoot.length)
    .replace(/^\\+/, "")
    .split("\\")
    .filter(Boolean);

  if (disposableProfileSegments.length < 2) {
    return {
      status: "blocked",
      reason: "not-tool-owned-disposable-profile-root",
      normalizedPath
    };
  }

  return {
    status: "allowed",
    reason: "tool-owned-disposable-profile-root",
    normalizedPath
  };
}

export function validateWindowsDedicatedChromiumRuntime(options: {
  browserExecutablePath: string;
  profileDirectory: string;
}): BrowserProfileIsolation {
  const runtimeClassification = classifyWindowsBrowserRuntimePath(options.browserExecutablePath);
  if (runtimeClassification.status !== "allowed") {
    return {
      status: "blocked",
      reason:
        runtimeClassification.reason === "daily-installed-browser-runtime-denied"
          ? WINDOWS_DAILY_BROWSER_RUNTIME_BLOCKED_REASON
          : "Windows browser executable is not a verified tool-owned Chromium runtime."
    };
  }

  const profileValidation = validateWindowsToolOwnedProfileRoot(options.profileDirectory);
  if (profileValidation.status === "blocked") {
    return {
      status: "blocked",
      reason: WINDOWS_PROFILE_ROOT_BLOCKED_REASON
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

function normalizeWindowsPathForComparison(pathValue: string): string {
  return win32
    .normalize(pathValue.trim().replace(/\//g, "\\"))
    .replace(/\\+$/, "")
    .toLowerCase();
}

function isWindowsRuntimePathCandidate(pathValue: string): boolean {
  const trimmedPath = pathValue.trim();
  return (
    /^[a-z]:[\\/]/i.test(trimmedPath) ||
    /^%[a-z0-9_()]+%[\\/]/i.test(trimmedPath) ||
    trimmedPath.includes("\\") ||
    /\.exe$/i.test(trimmedPath)
  );
}

function isWindowsRootedPath(pathValue: string): boolean {
  const trimmedPath = pathValue.trim();
  return /^[a-z]:[\\/]/i.test(trimmedPath) || /^%[a-z0-9_()]+%[\\/]/i.test(trimmedPath);
}

function hasWindowsParentTraversal(pathValue: string): boolean {
  return pathValue
    .trim()
    .replace(/\//g, "\\")
    .split("\\")
    .some((segment) => segment === "..");
}

function containsDailyBrowserProfileRoot(normalizedPath: string): boolean {
  return WINDOWS_DAILY_PROFILE_ROOT_MARKERS.some(
    (marker) => normalizedPath.endsWith(marker) || normalizedPath.includes(`${marker}\\`)
  );
}

function windowsToolOwnedRuntimeRootCandidates(): string[] {
  return [
    ...windowsToolOwnedRootCandidates(["Runtime", "Chromium"]),
    ...windowsToolOwnedRootCandidates(["Runtime", "CloakBrowser"])
  ];
}

function windowsToolOwnedRootCandidates(segments: string[]): string[] {
  const relativeRoot = ["ServiceNowAutomation", ...segments].join("\\");
  const normalizedRelativeRoot = relativeRoot.toLowerCase();
  const roots = [
    `%localappdata%\\${normalizedRelativeRoot}`,
    `c:\\users\\*\\appdata\\local\\${normalizedRelativeRoot}`
  ];

  if (process.env.LOCALAPPDATA) {
    roots.push(`${normalizeWindowsPathForComparison(process.env.LOCALAPPDATA)}\\${normalizedRelativeRoot}`);
  }

  return roots;
}

function matchingWindowsRoot(normalizedPath: string, roots: string[]): string | undefined {
  for (const root of roots) {
    if (!root.includes("*")) {
      if (normalizedPath === root || normalizedPath.startsWith(`${root}\\`)) {
        return root;
      }
      continue;
    }

    const wildcardRootPattern = new RegExp(
      `^(${escapeRegExp(root).replace(/\\\*/g, "[^\\\\]+")})(?:\\\\|$)`
    );
    const match = normalizedPath.match(wildcardRootPattern);
    if (match) {
      return match[1];
    }
  }
  return undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isUnderAnyWindowsRoot(normalizedPath: string, roots: string[]): boolean {
  return matchingWindowsRoot(normalizedPath, roots) !== undefined;
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

function buildBrowserSmokeCommand(browserExecutablePath: string, profileDirectory: string): BrowserLaunchCommand {
  const targetUrl = "about:blank";
  return {
    executable: browserExecutablePath,
    args: [
      `--user-data-dir=${profileDirectory}`,
      "--remote-debugging-address=127.0.0.1",
      "--remote-debugging-port=0",
      "--no-first-run",
      "--no-default-browser-check",
      "--new-window",
      targetUrl
    ],
    targetUrl,
    profileDirectory
  };
}

function sanitizeBrowserSmokeCommandPreview(command: BrowserLaunchCommand): BrowserSmokeCommandPreview {
  return {
    executable: command.executable,
    args: command.args.map((arg) => (arg === command.targetUrl ? "about:blank" : arg)),
    target: "about:blank",
    profileDirectory: command.profileDirectory
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
