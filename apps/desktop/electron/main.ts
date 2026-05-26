import { app, BrowserWindow, ipcMain } from "electron";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createBrowserSessionService,
  createCdpQaIncidentDefaultFieldAutofillRuntimePageDriver,
  inspectQaIncidentDefaultFieldsRuntime,
  runQaIncidentDefaultFieldAutofillRuntime,
  type QaDedicatedCdpBrowserStartResult
} from "@servicenow-automation/adapters";
import {
  buildQaIncidentDefaultRuntimeTextFieldPlan,
  buildQaIncidentDefaultValuePlan,
  type QaIncidentDefaultScenario,
  type TicketDraft
} from "@servicenow-automation/core";
import { getServiceNowEnvironmentConfig, type ServiceNowEnvironmentMode } from "@servicenow-automation/profiles";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

type OperatorMode = Extract<ServiceNowEnvironmentMode, "qa" | "dev">;

type OperatorRequest = {
  mode?: OperatorMode;
  targetUrl?: string;
  cdpEndpoint?: string;
  approvalPageFingerprint?: string;
  draft?: TicketDraft;
  scenario?: QaIncidentDefaultScenario;
  routeOutAssignmentGroup?: string;
};

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
  ipcMain.handle("sda:launch-qa-browser", async (_event, request: OperatorRequest = {}) => {
    const mode = safeOperatorMode(request.mode);
    const environment = getServiceNowEnvironmentConfig(mode, targetUrlOverrides(mode, request.targetUrl));
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

  ipcMain.handle("sda:verify-current-incident", async (_event, request: OperatorRequest = {}) => {
    const mode = safeOperatorMode(request.mode);
    const environment = getServiceNowEnvironmentConfig(mode, targetUrlOverrides(mode, request.targetUrl));
    const endpoint = requireCdpEndpoint(request.cdpEndpoint);
    const driver = createCdpQaIncidentDefaultFieldAutofillRuntimePageDriver({ endpoint, targetUrl: environment.url });
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
  });

  ipcMain.handle("sda:autofill-current-incident-defaults", async (_event, request: OperatorRequest = {}) => {
    const mode = safeOperatorMode(request.mode);
    const environment = getServiceNowEnvironmentConfig(mode, targetUrlOverrides(mode, request.targetUrl));
    const endpoint = requireCdpEndpoint(request.cdpEndpoint);
    const approvalPageFingerprint = safeApprovalPageFingerprint(request.approvalPageFingerprint);
    if (!request.draft) {
      throw new Error("Missing editable draft for QA autofill.");
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
  });
}

function safeOperatorMode(mode: OperatorRequest["mode"]): OperatorMode {
  return mode === "dev" ? "dev" : "qa";
}

function safeTargetUrlOverride(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function targetUrlOverrides(mode: OperatorMode, value?: string): Partial<Record<OperatorMode, string>> | undefined {
  const targetUrl = safeTargetUrlOverride(value);
  return targetUrl ? { [mode]: targetUrl } : undefined;
}

function requireCdpEndpoint(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error("Start QA Chromium first, then open/log in to the Incident form before running this action.");
  }
  return trimmed;
}

function safeApprovalPageFingerprint(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^[a-f0-9]{64}$/i.test(trimmed) ? trimmed : undefined;
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
