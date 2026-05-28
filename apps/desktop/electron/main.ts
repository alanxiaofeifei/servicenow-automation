import { app, BrowserWindow, ipcMain } from "electron";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createBrowserSessionService,
  createCdpQaIncidentDefaultFieldAutofillRuntimePageDriver,
  createWindowsLocalCdpQaIncidentDefaultFieldAutofillRuntimePageDriver,
  inspectQaIncidentDefaultFieldsRuntime,
  QaCdpRuntimeBlockedError,
  runQaIncidentDefaultFieldAutofillRuntime,
  type QaCdpRuntimeBlockedReason,
  type QaIncidentDefaultFieldAutofillRuntimePageDriver,
  type QaDedicatedCdpBrowserStartResult
} from "@servicenow-automation/adapters";
import { buildQaIncidentDefaultRuntimeTextFieldPlan, buildQaIncidentDefaultValuePlan } from "@servicenow-automation/core";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

import { resolveOperatorRuntimeRequestGate } from "./operator-ipc-safety";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 980,
    minHeight: 680,
    title: "ServiceNow Automation",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function registerOperatorIpc(): void {
  ipcMain.handle("sda:launch-qa-browser", async (_event, rawRequest: unknown = {}) => {
    const gate = resolveOperatorRuntimeRequestGate(rawRequest);
    if (gate.status === "blocked") {
      return blockedLaunchResponse(gate.blockedReason);
    }

    const request = gate.request;
    const environment = getServiceNowEnvironmentConfig("qa", targetUrlOverrides(request.targetUrl));
    const launch = await createBrowserSessionService({ projectRoot: findProjectRoot() }).startQaDedicatedCdpBrowser(environment, {
      targetUrlOverride: safeTargetUrlOverride(request.targetUrl),
      execute: true,
      confirmNoWriteLaunch: true
    });

    return {
      ok: launch.status === "ready",
      launch: sanitizeLaunchForRenderer(launch)
    };
  });

  ipcMain.handle("sda:verify-current-incident", async (_event, rawRequest: unknown = {}) => {
    try {
      const gate = resolveOperatorRuntimeRequestGate(rawRequest);
      if (gate.status === "blocked") {
        return blockedVerifyResponse(gate.blockedReason);
      }

      const request = gate.request;
      const environment = getServiceNowEnvironmentConfig("qa", targetUrlOverrides(request.targetUrl));
      const endpoint = requireCdpEndpoint(request.cdpEndpoint);
      const driver = createOperatorIncidentRuntimeDriver({ endpoint, targetUrl: environment.url });
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
      return blockedVerifyResponse(operatorCdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error");
    }
  });

  ipcMain.handle("sda:autofill-current-incident-defaults", async (_event, rawRequest: unknown = {}) => {
    try {
      const gate = resolveOperatorRuntimeRequestGate(rawRequest);
      if (gate.status === "blocked") {
        return blockedAutofillResponse(gate.blockedReason);
      }

      const request = gate.request;
      const environment = getServiceNowEnvironmentConfig("qa", targetUrlOverrides(request.targetUrl));
      const endpoint = requireCdpEndpoint(request.cdpEndpoint);
      const approvalPageFingerprint = safeApprovalPageFingerprint(request.approvalPageFingerprint);
      if (!request.draft) {
        return blockedAutofillResponse("plan-not-ready");
      }
      if (!approvalPageFingerprint) {
        return blockedAutofillResponse("approval-page-fingerprint-required");
      }

      const driver = createOperatorIncidentRuntimeDriver({ endpoint, targetUrl: environment.url });
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
}

function safeTargetUrlOverride(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function targetUrlOverrides(value?: string): Partial<Record<"qa", string>> | undefined {
  const targetUrl = safeTargetUrlOverride(value);
  return targetUrl ? { qa: targetUrl } : undefined;
}

function requireCdpEndpoint(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  return trimmed;
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

function createOperatorIncidentRuntimeDriver(input: {
  endpoint: string;
  targetUrl?: string;
}): QaIncidentDefaultFieldAutofillRuntimePageDriver {
  if (isWslHostedDesktopRuntime()) {
    return createWindowsLocalCdpQaIncidentDefaultFieldAutofillRuntimePageDriver({
      endpoint: input.endpoint,
      targetUrl: input.targetUrl,
      helperScriptPath: toWindowsInteropPath(join(findProjectRoot(), "scripts", "windows", "evaluate-local-cdp-expression.ps1"))
    });
  }

  return createCdpQaIncidentDefaultFieldAutofillRuntimePageDriver({ endpoint: input.endpoint, targetUrl: input.targetUrl });
}

function isWslHostedDesktopRuntime(): boolean {
  return (
    process.platform === "linux" &&
    Boolean(
      process.env.WSL_INTEROP ||
        process.env.WSL_DISTRO_NAME ||
        existsSync("/proc/sys/fs/binfmt_misc/WSLInterop") ||
        existsSync("/mnt/c/Windows/System32/cmd.exe")
    )
  );
}

function toWindowsInteropPath(pathValue: string): string {
  if (process.platform !== "linux") {
    return pathValue;
  }

  try {
    const convertedPath = execFileSync("wslpath", ["-w", pathValue], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1000
    }).trim();
    if (convertedPath.startsWith("\\\\") || /^[A-Z]:\\/i.test(convertedPath)) {
      return convertedPath;
    }
  } catch {
    // Fall through to the original path; the helper will fail closed if Windows cannot read it.
  }

  return pathValue;
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

function sanitizeLaunchForRenderer(launch: QaDedicatedCdpBrowserStartResult): QaDedicatedCdpBrowserStartResult {
  return {
    ...launch,
    commandPreview: launch.commandPreview
      ? {
          ...launch.commandPreview,
          args: launch.commandPreview.args.map((arg: string) => (arg.startsWith("http") ? "[REDACTED_SERVICE_NOW_TARGET]" : arg))
        }
      : undefined
  };
}

function findProjectRoot(): string {
  const candidates = [process.cwd(), join(__dirname, "../../../.."), join(__dirname, "../../..")];
  for (const candidate of candidates) {
    let current = candidate;
    for (let depth = 0; depth < 6; depth += 1) {
      if (existsSync(join(current, "pnpm-workspace.yaml"))) {
        return current;
      }
      const parent = dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  return process.cwd();
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
