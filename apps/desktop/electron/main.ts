import { app, BrowserWindow, ipcMain, shell } from "electron";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createBrowserSessionService,
  createCdpQaAutofillRuntimePageDriver,
  createCdpQaIncidentDefaultFieldAutofillRuntimePageDriver,
  createCdpQaIncidentFieldInspectionRuntimePageDriver,
  inspectQaIncidentDefaultFieldsRuntime,
  QaCdpRuntimeBlockedError,
  runQaIncidentDefaultFieldAutofillRuntime,
  runQaTextFieldAutofillRuntime,
  type QaAutofillRuntimePageDriver,
  type QaCdpRuntimeBlockedReason,
  type QaDedicatedCdpBrowserStartResult
} from "@servicenow-automation/adapters";
import { buildQaIncidentDefaultRuntimeTextFieldPlan, buildQaIncidentDefaultValuePlan, getRequiredQaAutofillApprovalPhrase } from "@servicenow-automation/core";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

import { resolveOperatorRuntimeRequestGate } from "./operator-ipc-safety";
import { resolveDesktopResourcePath, resolveDesktopRuntimePaths } from "./runtime-paths";
import { checkDedicatedChromiumRuntime } from "./runtime-provisioning-precheck";
import { createMainWindowWebPreferences } from "./window-preferences";
import { provisionChromiumRuntime, type ProvisionProgress } from "./chromium-provisioner";
import {
  handleCleanupExecute,
  handleCleanupPreview,
  handleHygieneScan,
  handleWorktreeGitDiff,
  handleWorktreeOpenDistRelease,
  handleWorktreeOpenFile,
  handleWorktreeOpenWorkspaceRoot,
  handleWorktreePackageMetadata,
  handleWorktreeStatus,
} from "./worktree-ipc";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/* Reference to the main window, used for sending IPC events to renderer */
let mainWindowRef: BrowserWindow | undefined;

/* Main-process-owned CDP endpoint — never exposed to renderer */
let mainProcessCdpEndpoint: string | undefined;

function storeCdpEndpoint(endpoint: string): void {
  mainProcessCdpEndpoint = endpoint;
}

function consumeStoredCdpEndpoint(): string {
  if (!mainProcessCdpEndpoint) {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  return mainProcessCdpEndpoint;
}

function clearStoredCdpEndpoint(): void {
  mainProcessCdpEndpoint = undefined;
}

function createMainWindow(): void {
  mainWindowRef = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    title: "ServiceNow Automation",
    webPreferences: createMainWindowWebPreferences(__dirname)
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindowRef.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindowRef.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function registerOperatorIpc(): void {
  ipcMain.handle("sda:launch-qa-browser", async (_event, rawRequest: unknown = {}) => {
    const gate = resolveOperatorRuntimeRequestGate(rawRequest);
    if (gate.status === "blocked") {
      return blockedLaunchResponse(gate.blockedReason);
    }

    /* Precheck: dedicated Chromium runtime must exist at tool-owned path */
    const runtimeBlockedReason = checkDedicatedChromiumRuntime();
    if (runtimeBlockedReason) {
      return blockedLaunchResponse(runtimeBlockedReason);
    }

    const request = gate.request;
    const environment = getServiceNowEnvironmentConfig("qa", targetUrlOverrides(request.targetUrl));
    const launch = await createBrowserSessionService({ projectRoot: findProjectRoot() }).startQaDedicatedCdpBrowser(environment, {
      targetUrlOverride: safeTargetUrlOverride(request.targetUrl),
      execute: true,
      confirmNoWriteLaunch: true
    });

    if (launch.status === "ready" && launch.cdpEndpoint) {
      /* Store endpoint in main process memory; strip from renderer response */
      storeCdpEndpoint(launch.cdpEndpoint);
    }

    return {
      ok: launch.status === "ready",
      launch: sanitizeLaunchForRenderer(launch)
    };
  });

  /* Auto-provisioning handler: download + extract Chrome for Testing when
   * the dedicated runtime is missing. Progress events are sent to the
   * renderer so the diagnostic overlay can show a text progress indicator. */
  ipcMain.handle("sda:provision-chromium-runtime", async () => {
    try {
      const win = mainWindowRef;

      function sendProgress(update: ProvisionProgress): void {
        if (win && !win.isDestroyed()) {
          win.webContents.send("sda:provision-progress", update);
        }
      }

      sendProgress({ stage: "fetching-metadata", percent: 0, message: "Fetching version info..." });

      const result = await provisionChromiumRuntime({ onProgress: sendProgress });

      if (result.success) {
        /* Verify runtime path after provisioning */
        const runtimeBlockedReason = checkDedicatedChromiumRuntime();
        if (runtimeBlockedReason) {
          return {
            ok: false,
            autoProvisioned: false,
            provisionResult: result,
            blockedReason: runtimeBlockedReason,
            error: "Provisioning completed but runtime precheck still fails"
          };
        }
      }

      return {
        ok: result.success,
        autoProvisioned: result.success,
        provisionResult: result,
        error: result.success ? undefined : result.error
      };
    } catch (error) {
      return {
        ok: false,
        autoProvisioned: false,
        error: error instanceof Error ? error.message : "Unknown provisioning error"
      };
    }
  });

  ipcMain.handle("sda:verify-current-incident", async (_event, rawRequest: unknown = {}) => {
    try {
      const gate = resolveOperatorRuntimeRequestGate(rawRequest);
      if (gate.status === "blocked") {
        return blockedVerifyResponse(gate.blockedReason);
      }

      const request = gate.request;
      const environment = getServiceNowEnvironmentConfig("qa", targetUrlOverrides(request.targetUrl));
      const endpoint = consumeStoredCdpEndpoint();
      const driver = createCdpQaIncidentFieldInspectionRuntimePageDriver({ endpoint, targetUrl: environment.url });
      const fieldInspection = await inspectQaIncidentDefaultFieldsRuntime({ environment, driver });
      const defaultPlan = request.draft
        ? buildQaIncidentDefaultValuePlan({
            draft: request.draft,
            fields: fieldInspection.fields,
            scenario: request.scenario ?? "initial-create",
            routeOutAssignmentGroup: request.routeOutAssignmentGroup
          })
        : undefined;

      return {
        ok: fieldInspection.status === "verified" && (!defaultPlan || defaultPlan.status === "ready-for-local-review"),
        fieldInspection,
        defaultPlan
      };
    } catch (error) {
      if (error instanceof QaCdpRuntimeBlockedError && error.blockedReason === "cdp-endpoint-denied") {
        clearStoredCdpEndpoint();
      }
      return blockedVerifyResponse(operatorCdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error");
    }
  });

  /* Existing full-field autofill handler — kept for backward compatibility when
   * the renderer passes cdpEndpoint from its own (forwarded) state. Will be
   * replaced once the text-field-only handler is the sole entrypoint. */
  ipcMain.handle("sda:autofill-current-incident-defaults", async (_event, rawRequest: unknown = {}) => {
    try {
      const gate = resolveOperatorRuntimeRequestGate(rawRequest);
      if (gate.status === "blocked") {
        return blockedAutofillResponse(gate.blockedReason);
      }

      const request = gate.request;
      const environment = getServiceNowEnvironmentConfig("qa", targetUrlOverrides(request.targetUrl));
      const endpoint = consumeStoredCdpEndpoint();
      const approvalPageFingerprint = safeApprovalPageFingerprint(request.approvalPageFingerprint);
      if (!request.draft) {
        return blockedAutofillResponse("plan-not-ready");
      }
      if (!approvalPageFingerprint) {
        return blockedAutofillResponse("approval-page-fingerprint-required");
      }

      const driver = createCdpQaIncidentDefaultFieldAutofillRuntimePageDriver({ endpoint, targetUrl: environment.url });
      const fieldInspection = await inspectQaIncidentDefaultFieldsRuntime({ environment, driver });
      const defaultPlan = buildQaIncidentDefaultValuePlan({
        draft: request.draft,
        fields: fieldInspection.fields,
        scenario: request.scenario ?? "initial-create",
        routeOutAssignmentGroup: request.routeOutAssignmentGroup
      });
      const runtimeTextFieldPlan = buildQaIncidentDefaultRuntimeTextFieldPlan(defaultPlan);
      const runtime = await runQaIncidentDefaultFieldAutofillRuntime({
        environment,
        driver,
        plannedFields: runtimeTextFieldPlan.status === "ready-for-local-review" ? runtimeTextFieldPlan.plannedFields : [],
        execute: true,
        approvalPageFingerprint
      });
      const { pageFingerprint: _redactedAutofillPageFingerprint, ...autofillFieldInspection } = fieldInspection;

      return {
        ok: runtime.status === "completed",
        fieldInspection: autofillFieldInspection,
        defaultPlan: runtimeTextFieldPlan,
        runtime
      };
    } catch (error) {
      return blockedAutofillResponse(operatorCdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error");
    }
  });

  /* NEW: text-field-only autofill handler — main process owns CDP endpoint,
   * renderer never receives it. Uses runQaTextFieldAutofillRuntime for
   * fingerprint-verified text-only execution. */
  ipcMain.handle("sda:text-field-autofill-current-incident", async (_event, rawRequest: unknown = {}) => {
    try {
      const gate = resolveOperatorRuntimeRequestGate(rawRequest);
      if (gate.status === "blocked") {
        return blockedAutofillResponse(gate.blockedReason);
      }

      const request = gate.request;
      const environment = getServiceNowEnvironmentConfig("qa", targetUrlOverrides(request.targetUrl));
      const endpoint = consumeStoredCdpEndpoint();

      if (!request.draft) {
        return blockedAutofillResponse("plan-not-ready");
      }

      const approvalPageFingerprint = safeApprovalPageFingerprint(request.approvalPageFingerprint);
      const driver = createCdpQaAutofillRuntimePageDriver({ endpoint, targetUrl: environment.url });

      const runtime = await runQaTextFieldAutofillRuntime({
        draft: request.draft,
        environment,
        driver,
        execute: true,
        approvalPhrase: getRequiredQaAutofillApprovalPhrase("qa"),
        approvalPageFingerprint,
        qaIsolationConfirmed: request.qaIsolationConfirmed ?? false,
        dedicatedProfileConfirmed: request.dedicatedProfileConfirmed ?? false
      });

      /* Strip raw pageFingerprint from response to renderer */
      const { pageFingerprint: _redactedAutofillPageFingerprint, ...sanitizedRuntime } = runtime;

      return {
        ok: runtime.status === "completed",
        runtime: sanitizedRuntime
      };
    } catch (error) {
      return blockedAutofillResponse(operatorCdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error");
    }
  });

  /* ---- Worktree local-only operations ---- */

  ipcMain.handle("sda:worktree-git-diff", async () => {
    const projectRoot = findProjectRoot();
    return handleWorktreeGitDiff(projectRoot, process.env.HOME);
  });

  ipcMain.handle("sda:worktree-open-dist-release", async () => {
    const projectRoot = findProjectRoot();
    return handleWorktreeOpenDistRelease(projectRoot);
  });

  ipcMain.handle("sda:worktree-open-workspace-root", async () => {
    const projectRoot = findProjectRoot();
    return handleWorktreeOpenWorkspaceRoot(projectRoot);
  });

  ipcMain.handle("sda:worktree-open-file", async (_event, relativePath: string) => {
    const projectRoot = findProjectRoot();
    return handleWorktreeOpenFile(projectRoot, relativePath);
  });

  ipcMain.handle("sda:worktree-status", async () => {
    const projectRoot = findProjectRoot();
    return handleWorktreeStatus(projectRoot);
  });

  ipcMain.handle("sda:worktree-package-metadata", async () => {
    const projectRoot = findProjectRoot();
    return handleWorktreePackageMetadata(projectRoot);
  });

  ipcMain.handle("sda:hygiene-scan", async () => {
    const projectRoot = findProjectRoot();
    return handleHygieneScan(projectRoot);
  });

  ipcMain.handle("sda:cleanup-preview", async () => {
    const projectRoot = findProjectRoot();
    return handleCleanupPreview(projectRoot);
  });

  ipcMain.handle("sda:cleanup-execute", async () => {
    const projectRoot = findProjectRoot();
    return handleCleanupExecute(projectRoot);
  });
}

function safeTargetUrlOverride(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function targetUrlOverrides(value?: string): Partial<Record<"qa", string>> | undefined {
  const targetUrl = safeTargetUrlOverride(value);
  return targetUrl ? { qa: targetUrl } : undefined;
}

function operatorCdpRuntimeBlockedReasonFromError(error: unknown): QaCdpRuntimeBlockedReason | undefined {
  if (error instanceof QaCdpRuntimeBlockedError) return (error as { blockedReason: QaCdpRuntimeBlockedReason }).blockedReason;
  if (!error || typeof error !== "object") return undefined;
  const blockedReason = (error as { blockedReason?: unknown }).blockedReason;
  return isOperatorCdpRuntimeBlockedReason(blockedReason) ? blockedReason : undefined;
}

function isOperatorCdpRuntimeBlockedReason(value: unknown): value is QaCdpRuntimeBlockedReason {
  return value === "cdp-endpoint-denied" || value === "cdp-page-selection-denied" || value === "browser-runtime-error";
}

function safeApprovalPageFingerprint(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^[a-f0-9]{64}$/i.test(trimmed) ? trimmed : undefined;
}

function blockedLaunchResponse(blockedReason: string) {
  return {
    ok: false,
    launch: {
      status: "blocked",
      blockedReason,
      safety: {
        browserProcessLaunched: false,
        cdpEndpointReady: false,
        noWriteMode: true,
        noSaveSubmitUpdateResolveClose: true
      }
    }
  };
}

function blockedVerifyResponse(blockedReason: string) {
  return {
    ok: false,
    fieldInspection: {
      status: "blocked",
      blockedReason,
      fields: [],
      safety: {
        browserProcessLaunched: false,
        browserAutomationCalled: false,
        realServiceNowApiCalled: false,
        noServiceNowWrite: true,
        noSaveSubmitUpdateClose: true,
        noSaveSubmitUpdateResolveClose: true,
        artifactsCaptured: false,
        productionWriteAllowed: false
      }
    }
  };
}

function blockedAutofillResponse(blockedReason: string) {
  return {
    ok: false,
    runtime: {
      status: "blocked",
      blockedReason,
      pageFingerprintMatched: false,
      filledFields: [],
      safety: {
        browserProcessLaunched: false,
        browserAutomationCalled: false,
        realServiceNowApiCalled: false,
        noServiceNowWrite: true,
        noSaveSubmitUpdateClose: true,
        noSaveSubmitUpdateResolveClose: true,
        artifactsCaptured: false,
        productionWriteAllowed: false
      }
    }
  };
}

function sanitizeLaunchForRenderer(launch: QaDedicatedCdpBrowserStartResult): Omit<QaDedicatedCdpBrowserStartResult, "cdpEndpoint"> & { cdpEndpointReady: boolean } {
  const { cdpEndpoint, ...safe } = launch;
  return {
    ...safe,
    cdpEndpointReady: launch.status === "ready" && Boolean(cdpEndpoint),
    commandPreview: safe.commandPreview
      ? {
          ...safe.commandPreview,
          args: safe.commandPreview.args.map((arg: string) => (arg.startsWith("http") ? "[REDACTED_SERVICE_NOW_TARGET]" : arg))
        }
      : undefined
  };
}

function desktopRuntimePaths() {
  return resolveDesktopRuntimePaths({
    mainDir: __dirname,
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath
  });
}

function findProjectRoot(): string {
  return desktopRuntimePaths().projectRoot;
}

app.whenReady().then(() => {
  registerOperatorIpc();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
