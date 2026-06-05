import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { demoManualPasteScenarios } from "@servicenow-automation/adapters/browser";
import {
  IntakeSourceKinds,
  sourceAdapterRegistry,
} from "@servicenow-automation/core";

import {
  App,
  OPERATOR_RUNTIME_ACTION_TIMEOUT_MS,
  applyDraftTemplates,
  buildDemoQueueItems,
  buildDraftForQueueItem,
  buildOperatorActionFinalState,
  clampAppZoomPercent,
  draftTemplatePresets,
  exportValidationRunsToCsv,
  exportValidationRunsToMarkdown,
  exportProductReviewReport,
  getCtrlWheelZoomDelta,
  getDraftTextAreaRows,
  getHighSeveritySpeechReminderDecision,
  getHighSeveritySpeechReminderPolicy,
  getHighSeverityVoiceReminder,
  getNextAppZoomPercent,
  getNextEnvironmentUrlOverrideFromDraft,
  operatorActionDisplayAction,
  operatorSanitizeBlockedReason,
  previewHighSeveritySpeechReminder,
  updateQaSmokeWriteActionSelection,
  type AppProps,
  type HighSeverityMonitorGroup,
  type LanguageCode
} from "./App";

type TestableAppProps = AppProps;
const TestableApp = App as unknown as (props: TestableAppProps) => ReturnType<typeof App>;

function renderAppMarkup(initialLanguage?: LanguageCode, props: Omit<TestableAppProps, "initialLanguage"> = {}) {
  return renderToStaticMarkup(createElement(TestableApp, { initialLanguage, ...props }));
}

function stripMarkupText(segment: string): string {
  return segment
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function visibleTextCount(output: string, text: string): number {
  return stripMarkupText(output).split(text).length - 1;
}

function buttonAttrs(output: string, label: string): string {
  const buttonPattern = /<button([^>]*)>([\s\S]*?)<\/button>/g;
  let match: RegExpExecArray | null;
  while ((match = buttonPattern.exec(output)) !== null) {
    if (stripMarkupText(match[2] ?? "").includes(label)) {
      return match[1] ?? "";
    }
  }
  return "";
}

function localRuntimeEndpoint(port: number, sessionId: string): string {
  const loopbackHost = ["127", "0", "0", "1"].join(".");
  const devtoolsPath = [["dev", "tools"].join(""), "browser", sessionId].join("/");
  return ["http", "://", loopbackHost, ":", String(port), "/", devtoolsPath].join("");
}

function localRuntimeAddress(hostKind: "loopback" | "localhost", port: number): string {
  const host = hostKind === "loopback" ? ["127", "0", "0", "1"].join(".") : ["local", "host"].join("");
  return [host, String(port)].join(":");
}

function shaFingerprintSentinel(fill: string): string {
  return [["sha", "256"].join(""), fill.repeat(64)].join(":");
}

function prefixedFingerprintSentinel(label: string): string {
  return [["sha", "256"].join(""), label].join(":");
}

function mainMarkupWithoutSettings(output: string): string {
  const settingsStart = output.indexOf('id="app-settings-sidebar"');
  return settingsStart >= 0 ? output.slice(0, settingsStart) : output;
}

function settingsMarkup(output: string): string {
  const settingsStart = output.indexOf('id="app-settings-sidebar"');
  const settingsEnd = output.indexOf("</aside>", settingsStart);
  return settingsStart >= 0 && settingsEnd >= 0 ? output.slice(settingsStart, settingsEnd) : "";
}

describe("App", () => {
  it("renders the approved target-image operator workbench shell", () => {
    const output = renderAppMarkup();

    expect(output).toContain('class="app-shell operator-workbench-v2-shell');
    expect(output).toContain('data-theme="warm"');
    expect(output).toContain('data-left-sidebar="expanded"');
    expect(output).toContain('data-right-rail="collapsed"');
    expect(output).toContain('--app-zoom-scale:1');
    expect(output).toContain('--app-zoom-width:100%');
    expect(output).toContain('--app-zoom-height:100vh');
    expect(output).not.toContain('--app-font-scale');
    expect(output).toContain("ServiceNow Automation");
    expect(output).toContain("QA workspace");
    expect(output).toContain("QA target hidden");
    expect(output).toContain("EN / 中文");
    expect(output).toContain('data-active-page="workbench"');
    expect(output).toContain('class="workbench-icon-rail"');
    expect(output).toContain('class="workbench-sidebar"');
    expect(output).toContain('class="workbench-center"');
    expect(output).toContain('class="workbench-page-shell"');
    expect(output).not.toContain('class="workbench-runtime-rail collapsed"');
    expect(output).toContain('class="topbar-runtime-toggle"');
    expect(output).toContain("Search tickets...");
    expect(output).toContain("Inbox");
    expect(output).toContain("Workbench");
    expect(output).toContain("Knowledgebase");
    expect(output).toContain("History");
    expect(output).toContain("Search");
    expect(buttonAttrs(output, "Workbench")).toContain('aria-current="page"');
    expect(output.match(/class="workbench-icon-button/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(output).toContain('class="workbench-settings-button workbench-settings-nav-button"');
    expect(output).toContain("New");
    expect(output).toContain("In Review");
    expect(output).toContain("Waiting");
    expect(output).toContain("Recent");
    expect(output).toContain("Today");
    expect(output).toContain("Yesterday");
    expect(output).not.toContain('<p class="eyebrow">Selected source</p>');
    expect(output).toContain("Cleaned summary");
    expect(output).toContain("Incident draft");
    expect(output).not.toContain("Operator Workbench</p>");
    expect(output).not.toContain("Current work item");
    expect(output).not.toContain("Operator Control Center");
    expect(output).not.toContain("Environment missing");
  });

  it("shows the Demo Scenario Library with demo-only labeled presets", () => {
    const output = renderAppMarkup();

    expect(output).toContain('class="workbench-demo-library"');
    expect(output).toContain("Demo Scenario Library");
    expect(output).toContain("Demo only");
    // Section renders with safety text and scenario meta
    expect(output).toContain("Fake/local/demo data only");
    expect(output).toContain("DEMO");
    expect(output).toContain('aria-label="Use scenario:');
    // All 6 demo manual paste scenarios render as clickable items
    expect(output.split('aria-label="Use scenario:').length - 1).toBe(6);
  });

  it("renders incident draft card before guided demo path, before KB recommendations, before monthly Excel fill queue", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Incident draft");
    expect(output).toContain("Guided demo path");
    expect(output).toContain("Local KB recommendations");
    expect(output).toContain("Monthly Excel fill queue");

    const incidentDraftIndex = output.indexOf("Incident draft");
    const guidedDemoIndex = output.indexOf("Guided demo path");
    const kbIndex = output.indexOf("Local KB recommendations");
    const monthlyExcelIndex = output.indexOf("Monthly Excel fill queue");

    expect(incidentDraftIndex).toBeGreaterThan(0);
    expect(guidedDemoIndex).toBeGreaterThan(incidentDraftIndex);
    expect(kbIndex).toBeGreaterThan(guidedDemoIndex);
    expect(monthlyExcelIndex).toBeGreaterThan(kbIndex);

    expect(output).toContain("Follow the story without guessing");
    expect(output).toContain("Choose source");
    expect(output).toContain("Review cleaned context");
    expect(output).toContain("Draft TicketDraft");
    expect(output).toContain("Check KB recommendations");
    expect(output).toContain("Verify and report");
    expect(output).toContain("Optional QA/dev text-field assistance");
    expect(output).toContain('data-step-status="completed"');
    expect(output).toContain('data-step-status="current"');
    expect(output).toContain('data-step-status="locked"');
    expect(output).toContain("AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.");
  });

  it("shows visible KB recommendation cards with evidence and support group context on the main workbench", () => {
    const output = renderAppMarkup();

    expect(output).toContain("KB recommendations visible for review");
    expect(output).toContain("Local KB suggestion");
    expect(output).toContain("Match confidence");
    expect(output).toContain("Matched evidence");
    expect(output).toContain("Recommended support group");
    expect(output).toContain("Service Desk");
    expect(output).toContain("No external KB lookup");
  });

  it("shows monthly Excel-fill workflow instead of only per-ticket report export", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Monthly Excel fill queue");
    expect(output).toContain("Current month workbook");
    expect(output).toContain("Prompt after ticket is opened");
    expect(output).toContain("Fill this ticket into monthly Excel");
    expect(output).toContain("Do later — keep in pending queue");
    expect(output).toContain("No Microsoft Graph or Excel Web write is performed from this local demo");
    expect(output).toContain("Current month");
    expect(output).toContain("Previous month");
  });

  it("renders rebuilt target-style Inbox, Knowledgebase, History, and Search pages", () => {
    const pageCases = [
      { key: "inbox", label: "Inbox", title: "Inbox triage", panel: "Triage checklist" },
      { key: "knowledge", label: "Knowledgebase", title: "Knowledgebase snippets", panel: "Suggested knowledge" },
      { key: "history", label: "History", title: "History timeline", panel: "Recent outcomes" },
      { key: "search", label: "Search", title: "Search workspace", panel: "Search tips" }
    ] as const;

    for (const page of pageCases) {
      const output = renderAppMarkup("en-US", { initialActivePage: page.key });

      expect(output).toContain(`data-active-page="${page.key}"`);
      expect(output).toContain(page.title);
      expect(output).toContain(page.panel);
      expect(output).toContain('class="workbench-page-shell"');
      expect(output).toContain('class="workbench-page-sidepanel"');
      expect(output).toContain('class="workbench-page-context-panel"');
      expect(buttonAttrs(output, page.label)).toContain('aria-current="page"');
      expect(output).not.toContain("Nothing here yet");
      expect(output).not.toContain("Coming soon");
    }
  });

  it("removes the old demo-first surfaces from the primary workbench", () => {
    const primaryMarkup = mainMarkupWithoutSettings(renderAppMarkup());

    expect(primaryMarkup).not.toContain("MockAIProvider");
    expect(primaryMarkup).not.toContain("Mock ServiceNow Incident Preview");
    expect(primaryMarkup).not.toContain("Field-trial accelerated P0");
    expect(primaryMarkup).not.toContain("High Severity Monitor Simulator");
    expect(primaryMarkup).not.toContain("Workflow Stage");
    expect(primaryMarkup).not.toContain("Local XLSX Dry-run Artifact");
    expect(primaryMarkup).not.toContain("Excel dry-run");
    expect(primaryMarkup).not.toContain("Language simulation");
    expect(primaryMarkup).not.toContain("Queue → Source Review → TicketDraft");
    expect(primaryMarkup).not.toContain("Load VPN QA Scenario");
  });

  it("keeps review-visible desktop source neutral for operator/browser labels", () => {
    const desktopSource = [
      readFileSync(new URL("./App.tsx", import.meta.url), "utf8"),
      readFileSync(new URL("./App.test.ts", import.meta.url), "utf8"),
      readFileSync(new URL("./styles.css", import.meta.url), "utf8")
    ].join("\n");
    const legacyCustomerToken = ["YA", "GEO"].join("");
    const legacyPersonName = ["Al", "an"].join("");
    const legacyEnvironmentLabel = ["QA Test", "Environment"].join(" ");
    const staleManualLoginOnlyCopy = ["manual", "login", "only"].join(" ");

    expect(desktopSource).not.toMatch(new RegExp(legacyCustomerToken, "i"));
    expect(desktopSource).not.toContain(legacyPersonName);
    expect(desktopSource).not.toContain(legacyEnvironmentLabel);
    expect(desktopSource).not.toContain(staleManualLoginOnlyCopy);
    expect(desktopSource).toContain("saved sign-in can be reused");
  });

  it("keeps environment credential policy source user-readable instead of directly rendering raw enum values", () => {
    const desktopSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

    expect(desktopSource).toContain("User-controlled login");
    expect(desktopSource).toContain("ServiceNow saved sign-in can be reused from the dedicated test profile.");
    expect(desktopSource).not.toContain("<code>{config.credentialPolicy}</code>");
  });

  it("keeps live desktop and CLI paths off the full-field runtime until UI safety review is added", () => {
    const desktopMainSource = readFileSync(new URL("../electron/main.ts", import.meta.url), "utf8");
    const cliSource = readFileSync(new URL("../../cli/src/cli.ts", import.meta.url), "utf8");

    expect(desktopMainSource).toContain("buildQaIncidentDefaultRuntimeTextFieldPlan");
    expect(desktopMainSource).not.toContain("buildQaIncidentDefaultRuntimeFullFieldPlan");
    expect(cliSource).not.toContain("buildQaIncidentDefaultRuntimeFullFieldPlan");
  });

  it("keeps Electron IPC runtime entrypoints gated to exact QA mode before browser work", () => {
    const desktopMainSource = readFileSync(new URL("../electron/main.ts", import.meta.url), "utf8");
    const ipcGateSource = readFileSync(new URL("../electron/operator-ipc-safety.ts", import.meta.url), "utf8");

    expect((desktopMainSource.match(/resolveOperatorRuntimeRequestGate\(rawRequest\)/g) ?? []).length).toBe(4);
    expect(desktopMainSource).toContain("blockedLaunchResponse(gate.blockedReason)");
    expect(desktopMainSource).toContain("blockedVerifyResponse(gate.blockedReason)");
    expect(desktopMainSource).toContain("blockedAutofillResponse(gate.blockedReason)");
    expect(desktopMainSource).not.toContain("safeOperatorMode");
    expect(desktopMainSource).not.toContain('mode === "dev" ? "dev" : "qa"');
    expect(ipcGateSource).toContain('input.mode !== "qa"');
    expect(ipcGateSource).toContain('"qa-runtime-required"');
  });

  it("keeps runtime actions visible with plain-language disabled reasons", () => {
    const output = renderAppMarkup("en-US", { initialRuntimeRailExpanded: true });

    expect(output).toContain("1 Start QA Chromium");
    expect(output).toContain("2 Verify current Incident");
    expect(output).toContain("3 Autofill current Incident");
    expect(buttonAttrs(output, "1 Start QA Chromium")).not.toContain("disabled");
    expect(buttonAttrs(output, "2 Verify current Incident")).toContain("disabled");
    expect(buttonAttrs(output, "3 Autofill current Incident")).toContain("disabled");
    expect(output).toContain("Ready: opens a dedicated test browser profile for QA; saved sign-in can be reused.");
    expect(output).toContain("Disabled: start QA Chromium and wait until the browser connection is ready.");
    expect(output).toContain("Opens a dedicated test browser profile for the QA workspace so your ServiceNow sign-in can stay remembered; manual login remains yours.");
    expect(output).toContain("Confirms the visible Incident form is safe and current before any autofill.");
    expect(output).toContain("Fills allowed text fields only after the page is verified. It never saves or submits.");
    expect(output).not.toContain(["manual", "login", "only"].join(" "));
    expect(output).not.toContain("CDP readiness");
    expect(output).toContain("Browser status");
    expect(output).toContain("No browser status evidence yet; only sanitized status is shown.");
    expect(output).toContain("Collapse browser action rail");
  });

  it("reproduces the launch processing state with bounded reset copy", () => {
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorBusyAction: "launch"
    });

    expect(output).toContain("Starting QA Chromium");
    expect(output).toContain("Working");
    expect(buttonAttrs(output, "1 Starting QA Chromium")).toContain("disabled");
    expect(buttonAttrs(output, "2 Verify current Incident")).toContain("disabled");
    expect(buttonAttrs(output, "3 Autofill current Incident")).toContain("disabled");
    expect(visibleTextCount(output, "Disabled: another browser or step is still working.")).toBe(3);
    expect(output).toContain("If it does not finish, the app clears this local waiting state automatically.");
    expect(output).toContain("Reset browser readiness");
    expect(output).toContain("Safe to retry: clears only local browser connection/page-check readiness; no ServiceNow action is taken.");
  });

  it("builds final runtime states that always clear the busy action", () => {
    const blockedResponse = {
      ok: false,
      launch: { status: "blocked", blockedReason: "dedicated-browser-runtime-missing" }
    };
    const successResponse = {
      ok: true,
      launch: {
        status: "ready",
        cdpEndpoint: localRuntimeEndpoint(9222, "ready-session"),
        safety: { browserProcessLaunched: true, cdpEndpointReady: true, noWriteMode: true }
      }
    };

    const outcomes = [
      buildOperatorActionFinalState({ action: "launch", kind: "response", response: successResponse }),
      buildOperatorActionFinalState({ action: "launch", kind: "response", response: blockedResponse }),
      buildOperatorActionFinalState({ action: "launch", error: new Error("backend failed before sanitized response"), kind: "error" }),
      buildOperatorActionFinalState({ action: "launch", kind: "timeout", timeoutMs: OPERATOR_RUNTIME_ACTION_TIMEOUT_MS }),
      buildOperatorActionFinalState({ action: "launch", kind: "unmount" })
    ];

    for (const outcome of outcomes) {
      expect(outcome.operatorBusyAction).toBeNull();
    }
    expect(outcomes[3].operatorStatus.label).toBe("Start QA Chromium took too long");
    expect(outcomes[3].operatorStatus.details).toContain("The app cleared the local waiting state");
    expect(outcomes[3].operatorLastResponse?.launch?.status).toBe("timeout");
    expect(outcomes[4].shouldApplyState).toBe(false);
  });

  it("renders timeout recovery as a blocked but retryable sanitized state", () => {
    const timeoutOutcome = buildOperatorActionFinalState({
      action: "launch",
      kind: "timeout",
      timeoutMs: OPERATOR_RUNTIME_ACTION_TIMEOUT_MS
    });
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorLastResponse: timeoutOutcome.operatorLastResponse,
      initialOperatorStatus: timeoutOutcome.operatorStatus
    });

    expect(output).toContain("Start QA Chromium took too long");
    expect(output).toContain("No ServiceNow action was taken.");
    expect(buttonAttrs(output, "1 Start QA Chromium")).not.toContain("disabled");
    expect(buttonAttrs(output, "2 Verify current Incident")).toContain("disabled");
    expect(buttonAttrs(output, "3 Autofill current Incident")).toContain("disabled");
    expect(output).toContain("Reset browser readiness");
    expect(output).not.toContain("127.0.0.1");
    expect(output).not.toContain("devtools/browser");
    expect(output).not.toContain("sha256:");
  });

  it("explains QA IPC gate blocks in plain language without exposing the internal reason code", () => {
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorLastResponse: {
        ok: false,
        launch: { status: "blocked", blockedReason: "qa-runtime-required" },
        fieldInspection: { status: "blocked", blockedReason: "qa-runtime-required" },
        runtime: { status: "blocked", blockedReason: "qa-runtime-required" }
      }
    });

    expect(output).toContain("The desktop runtime is locked to QA workspace controls.");
    expect(output).toContain("No ServiceNow action was taken.");
    expect(output).not.toContain("qa-runtime-required");
  });

  it("keeps collapsed runtime rail quiet and exposes the toggle beside language", () => {
    const output = renderAppMarkup("en-US", { initialRuntimeRailExpanded: false });
    const primaryMarkup = mainMarkupWithoutSettings(output);
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

    expect(output).toContain('data-right-rail="collapsed"');
    expect(output).toContain('class="topbar-runtime-toggle"');
    expect(output).toContain("Expand browser action rail");
    expect(output.indexOf('class="workbench-language-selector"')).toBeLessThan(output.indexOf('class="topbar-runtime-toggle"'));
    expect(primaryMarkup).not.toContain('class="workbench-runtime-rail collapsed"');
    expect(primaryMarkup).not.toContain('class="runtime-rail-handle"');
    expect(primaryMarkup).not.toContain("Collapsed. Expand to access");
    expect(primaryMarkup).not.toContain("Browser status");
    expect(primaryMarkup).not.toContain("No browser status evidence yet; only sanitized status is shown.");
    expect(styles).toContain(".operator-workbench-v2-shell.runtime-rail-collapsed .workbench-layout");
    expect(styles).toContain("grid-template-columns: var(--sna-icon-rail-width) var(--sna-sidebar-width) minmax(0, 1fr);");
    expect(styles).toContain(".topbar-runtime-toggle {");
    expect(styles).toContain(".topbar-runtime-toggle span {\n  clip: rect(0 0 0 0);");
    expect(styles).not.toContain("--sna-runtime-rail-width: 96px");
    expect(styles).not.toContain("writing-mode: vertical-rl");
  });

  it("uses a center-left double-arrow collapse control and folds Settings with the sidebar state", () => {
    const output = renderAppMarkup("en-US", { initialLeftSidebarExpanded: false });
    const expandedOutput = renderAppMarkup("en-US", { initialLeftSidebarExpanded: true });
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

    expect(output).toContain('data-left-sidebar="collapsed"');
    expect(output).toContain('aria-label="Expand left sidebar"');
    expect(output).toContain('class="workbench-sidebar-edge-toggle"');
    expect(output).toContain('class="workbench-sidebar-edge-glyph" aria-hidden="true">»</span>');
    expect(expandedOutput).toContain('class="workbench-sidebar-edge-glyph" aria-hidden="true">«</span>');
    expect(output).not.toContain('class="workbench-icon-button workbench-sidebar-toggle"');
    expect(output).not.toContain('<span>Expand</span>');
    expect(expandedOutput).toContain('aria-label="Collapse left sidebar"');
    expect(expandedOutput).not.toContain('<span>Collapse</span>');
    expect(output).toContain('class="workbench-icon-rail"');
    expect(output).toContain('workbench-function-button selected');
    expect(expandedOutput).toContain('workbench-function-button selected');
    expect(output).toContain('class="workbench-icon-button workbench-settings-rail-button"');
    expect(output).toContain('<span>Settings</span>');
    expect(output).not.toContain('class="workbench-settings-button"');
    expect(expandedOutput).toContain('class="workbench-settings-button workbench-settings-nav-button"');
    expect(expandedOutput).toContain('<span>Settings</span>');
    expect(expandedOutput).not.toContain('class="workbench-icon-button workbench-settings-rail-button"');
    expect(styles).toContain(".operator-workbench-v2-shell.left-sidebar-expanded .workbench-function-button");
    expect(styles).toContain("display: none;");
    expect(styles).toContain(".workbench-sidebar-edge-toggle {");
    expect(styles).toContain("position: fixed;");
    expect(styles).toContain("left: 0;");
    expect(output).toContain('style="--left-sidebar-handle-top:50%"');
    expect(styles).toContain("top: var(--left-sidebar-handle-top, 50%);");
    expect(styles).toContain("cursor: grab;");
    expect(styles).toContain("font-size: 24px;");
    expect(styles).toContain(".operator-workbench-v2-shell.left-sidebar-expanded .workbench-icon-rail");
    expect(output).toContain('id="left-workbench-sidebar"');
    expect(output).toContain('class="workbench-center"');
    expect(styles).toContain(".operator-workbench-v2-shell.left-sidebar-collapsed .workbench-layout");
    expect(styles).toContain("grid-template-columns: var(--sna-icon-rail-width) minmax(0, 1fr) var(--sna-runtime-rail-width);");
    expect(styles).toContain(".operator-workbench-v2-shell.left-sidebar-collapsed.runtime-rail-collapsed .workbench-layout");
    expect(styles).toContain("grid-template-columns: var(--sna-icon-rail-width) minmax(0, 1fr);");
  });

  it("keeps Start QA Chromium enabled in QA mode while verify waits for browser readiness", () => {
    const output = renderAppMarkup("en-US", { initialEnvironmentMode: "qa", initialRuntimeRailExpanded: true });

    expect(output).toContain("QA workspace");
    expect(output).toContain("QA workspace");
    expect(output).toContain("QA target hidden");
    expect(buttonAttrs(output, "1 Start QA Chromium")).not.toContain("disabled");
    expect(buttonAttrs(output, "2 Verify current Incident")).toContain("disabled");
    expect(output).toContain("Ready: opens a dedicated test browser profile for QA; saved sign-in can be reused.");
    expect(output).toContain("Disabled: start QA Chromium and wait until the browser connection is ready.");
  });

  it("enables verify only after sanitized browser readiness without rendering the raw endpoint", () => {
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorCdpReady: true
    });

    expect(output).toContain("Browser connection ready; verify the current Incident.");
    expect(buttonAttrs(output, "2 Verify current Incident")).not.toContain("disabled");
    expect(buttonAttrs(output, "3 Autofill current Incident")).toContain("disabled");
    expect(output).toContain("Disabled: verify the current Incident first.");
  });

  it("shows page-check pass or block feedback directly on the action card", () => {
    const blockedOutput = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorCdpReady: true,
      initialOperatorLastResponse: {
        ok: false,
        fieldInspection: { status: "blocked", blockedReason: "cdp-page-selection-denied" }
      }
    });
    const successOutput = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorCdpReady: true,
      initialOperatorVerifiedPageFingerprint: prefixedFingerprintSentinel("do-not-render-page-check-feedback"),
      initialOperatorLastResponse: {
        ok: true,
        fieldInspection: { status: "verified", pageFingerprint: prefixedFingerprintSentinel("do-not-render-page-check-feedback") },
        defaultPlan: { status: "ready-for-local-review", plannedFields: [] }
      }
    });

    expect(blockedOutput).toContain('class="runtime-action-feedback blocked"');
    expect(blockedOutput).toContain("Blocked: Could not find one unique approved Incident tab in the test browser.");
    expect(successOutput).toContain('class="runtime-action-feedback success"');
    expect(successOutput).toContain("Current ticket verified; Autofill can fill allowed text fields only.");
    expect(successOutput).not.toContain("do-not-render-page-check-feedback");
  });

  it("shows localized Autofill completion feedback with the no-write safety boundary", () => {
    const output = renderAppMarkup("zh-CN", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorCdpReady: true,
      initialOperatorLastResponse: {
        ok: true,
        runtime: {
          status: "completed",
          filledFields: [
            { key: "shortDescription", label: "Short description", valueLength: 10 },
            { key: "description", label: "Description", valueLength: 20 },
            { key: "workNotes", label: "Work notes", valueLength: 30 }
          ]
        }
      }
    });

    expect(output).toContain('class="runtime-action-feedback success"');
    expect(output).toContain("自动填充已完成：已填写 3 个文本字段。");
    expect(output).toContain("没有执行 Save、Submit、Update、Resolve、Close、上传、邮件或 ServiceNow API。");
  });

  it("enables Autofill immediately after a successful page check fingerprint and hides the raw fingerprint", () => {
    const rawFingerprint = prefixedFingerprintSentinel("do-not-render-raw-fingerprint");
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorCdpReady: true,
      initialOperatorVerifiedPageFingerprint: rawFingerprint
    });

    expect(buttonAttrs(output, "3 Autofill current Incident")).not.toContain("disabled");
    expect(output).toContain("Ready: Autofill can fill allowed text fields only; you still review manually.");
    expect(output).toContain("Current ticket verified; Autofill can fill allowed text fields only.");
    expect(output).toContain("AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.");
    expect(output).not.toContain(rawFingerprint);
  });

  it("surfaces launch blocked diagnostics with a sanitized ignored runtime log path", () => {
    const absoluteProjectPrefix = ["", "tmp", "servicenow-automation"].join("/");
    const rawRuntimeLogPath = `${absoluteProjectPrefix}/.local/startup-logs/qa-dedicated-cdp-20260525123456-1234-a1b2c3.jsonl`;
    const rawEndpoint = localRuntimeEndpoint(54656, "private-session");
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorLastResponse: {
        ok: false,
        launch: {
          status: "blocked",
          blockedReason:
            "Dedicated test browser started but browser connection did not become ready before timeout. See the startup/runtime log path for sanitized details.",
          cdpEndpoint: rawEndpoint,
          runtimeLogPath: rawRuntimeLogPath,
          safety: { browserProcessLaunched: true, cdpEndpointReady: false, noWriteMode: true }
        }
      }
    });

    expect(output).toContain("Dedicated test browser started but browser connection did not become ready before timeout.");
    expect(output).toContain(".local/startup-logs/qa-dedicated-cdp-20260525123456-1234-a1b2c3.jsonl");
    expect(output).toContain("Sanitized browser status evidence available.");
    expect(output).not.toContain(absoluteProjectPrefix);
    expect(output).not.toContain(rawEndpoint);
  });

  it("redacts unsafe launch blocked diagnostics before rendering status details", () => {
    const rawEndpoint = localRuntimeEndpoint(54656, "private-session");
    const rawAbsolutePath = ["", "tmp", "servicenow-automation", ".local", "startup-logs", "unsafe.jsonl"].join("/");
    const rawServiceNowUrl = "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do";
    const secretMarker = ["to", "ken"].join("") + "=unsafe-value";
    const rawFingerprint = shaFingerprintSentinel("a");
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorLastResponse: {
        ok: false,
        launch: {
          status: "blocked",
          blockedReason: `Launch failed at ${rawEndpoint} ${rawAbsolutePath} ${rawServiceNowUrl} ${secretMarker} ${rawFingerprint}.`,
          runtimeLogPath: rawAbsolutePath,
          safety: { browserProcessLaunched: true, cdpEndpointReady: false, noWriteMode: true }
        }
      }
    });

    expect(output).toContain("Launch failed at");
    expect(output).toContain("[REDACTED_URL]");
    expect(output).toContain("[REDACTED_PATH]");
    expect(output).toContain("[REDACTED_SECRET]");
    expect(output).toContain("[REDACTED_FINGERPRINT]");
    expect(output).toContain(".local/startup-logs/unsafe.jsonl");
    expect(output).not.toContain(rawEndpoint);
    expect(output).not.toContain("127.0.0.1");
    expect(output).not.toContain("devtools/browser");
    expect(output).not.toContain(rawAbsolutePath);
    expect(output).not.toContain("qa.service-now.example.invalid");
    expect(output).not.toContain(secretMarker);
    expect(output).not.toContain(rawFingerprint);
  });

  it("redacts unsafe verify and autofill blocked diagnostics before rendering status details", () => {
    const bareFingerprint = "b".repeat(64);
    const posixPath = ["", "opt", "servicenow", "runtime", "unsafe.log"].join("/");
    const windowsPath = ["C:", "Users", "Operator", "AppData", "Local", "Temp", "unsafe.log"].join("/");
    const backslashWindowsPath = ["C:", "Users", "Operator", "AppData", "Local", "Temp", "unsafe.log"].join("\\");
    const uncPath = ["", "", "server", "share", "unsafe.log"].join("\\");
    const localEndpoint = localRuntimeAddress("loopback", 9222);
    const localhostEndpoint = localRuntimeAddress("localhost", 9333);
    const serviceNowHost = "dev.servicenow.example.invalid/now/nav/ui/classic/params/target/home_splash.do";
    const authorizationHeader = ["Authorization", "Bearer unsafe-value"].join(": ");
    const authTokenHeader = ["X", "Auth", "Token"].join("-") + ": Bearer unsafe-header";
    const sessionMarker = ["session", "Id"].join("") + "=unsafe-session";
    const authTokenMarker = ["auth", "_", "token"].join("") + "=unsafe-token";
    const cookieMarker = ["cook", "ie", "_value"].join("") + "=unsafe-cookie";
    const passwordMarker = ["pass", "word"].join("") + "=unsafe-password";
    const apiKeyMarker = ["api", "_", "key"].join("") + "=unsafe-key";
    const unsafeDiagnostic = `Runtime blocked ${posixPath} ${windowsPath} ${backslashWindowsPath} ${uncPath} ${localEndpoint} ${localhostEndpoint} ${serviceNowHost} ${authorizationHeader} ${authTokenHeader} ${sessionMarker} ${authTokenMarker} ${cookieMarker} ${passwordMarker} ${apiKeyMarker} ${bareFingerprint}`;

    const verifyOutput = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorLastResponse: {
        ok: false,
        fieldInspection: { status: "blocked", blockedReason: unsafeDiagnostic }
      }
    });
    const autofillOutput = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorLastResponse: {
        ok: false,
        runtime: { status: "blocked", blockedReason: unsafeDiagnostic }
      }
    });

    for (const output of [verifyOutput, autofillOutput]) {
      expect(output).toContain("Runtime blocked");
      expect(output).toContain("[REDACTED_PATH]");
      expect(output).toContain("[REDACTED_HOST]");
      expect(output).toContain("[REDACTED_SECRET]");
      expect(output).toContain("[REDACTED_FINGERPRINT]");
      expect(output).not.toContain(posixPath);
      expect(output).not.toContain(windowsPath);
      expect(output).not.toContain(backslashWindowsPath);
      expect(output).not.toContain(uncPath);
      expect(output).not.toContain(localEndpoint);
      expect(output).not.toContain(localhostEndpoint);
      expect(output).not.toContain("dev.servicenow.example.invalid");
      expect(output).not.toContain(authorizationHeader);
      expect(output).not.toContain(authTokenHeader);
      expect(output).not.toContain(sessionMarker);
      expect(output).not.toContain(authTokenMarker);
      expect(output).not.toContain(cookieMarker);
      expect(output).not.toContain(passwordMarker);
      expect(output).not.toContain(apiKeyMarker);
      expect(output).not.toContain(bareFingerprint);
    }
  });

  it("keeps runtime readiness QA-bound when a hidden non-QA mode receives stale runtime markers", () => {
    const rawFingerprint = shaFingerprintSentinel("c");
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "dev",
      initialRuntimeRailExpanded: true,
      initialOperatorCdpReady: true,
      initialOperatorVerifiedPageFingerprint: rawFingerprint
    });

    expect(buttonAttrs(output, "1 Start QA Chromium")).toContain("disabled");
    expect(buttonAttrs(output, "2 Verify current Incident")).toContain("disabled");
    expect(buttonAttrs(output, "3 Autofill current Incident")).toContain("disabled");
    expect(output).toContain("Disabled: Production is read-only in this workbench; choose the QA workspace for Start QA Chromium, Verify, and Autofill.");
    expect(output).toContain("Waiting for the dedicated test browser profile to connect.");
    expect(output).not.toContain("Browser connection ready; Check Page enabled.");
    expect(output).not.toContain("Current ticket page checked; Autofill can fill allowed text fields only.");
    expect(output).not.toContain(rawFingerprint);
  });

  it("prefers autofill runtime diagnostics when initial response also includes default plan metadata", () => {
    const defaultPlanMarker = "Default plan metadata marker should stay hidden.";
    const runtimeMarker = "Autofill runtime marker should be visible.";
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialRuntimeRailExpanded: true,
      initialOperatorLastResponse: {
        ok: false,
        defaultPlan: { status: "blocked", blockedReason: defaultPlanMarker, plannedFields: [] },
        runtime: { status: "blocked", blockedReason: runtimeMarker }
      }
    });

    expect(output).toContain(runtimeMarker);
    expect(output).not.toContain(defaultPlanMarker);
  });

  it("keeps the visible safety boundary compact and avoids state-changing ServiceNow controls", () => {
    const primaryMarkup = mainMarkupWithoutSettings(
      renderAppMarkup("en-US", { initialEnvironmentMode: "qa", initialRuntimeRailExpanded: true })
    );

    expect(primaryMarkup).toContain("Safety note");
    expect(primaryMarkup).toContain("AI drafts and fills allowed text fields only.");
    expect(primaryMarkup).toContain("Human reviews and submits in ServiceNow.");
    expect(primaryMarkup).not.toMatch(/<button[^>]*>\s*(Save|Submit|Update|Resolve|Close)\s*<\/button>/);
    expect(primaryMarkup).not.toContain("raw-session-id");
  });

  it("labels the account-access demo as mock-only without implying browser login", () => {
    const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");

    expect(appSource).toContain("Load Mock Account Access Demo");
    expect(appSource).not.toContain("Load Account/Login Demo");
  });

  it("keeps labels, status text, and headings free of automation-implying wording for prohibited actions", () => {
    const output = renderAppMarkup("en-US", { initialEnvironmentMode: "qa", initialRuntimeRailExpanded: true });
    const primaryMarkup = mainMarkupWithoutSettings(output);

    expect(primaryMarkup).not.toMatch(/<button[^>]*>\s*(Save|Submit|Update|Resolve|Close)\s*<\/button>/);
    expect(primaryMarkup).not.toContain("automatically saves");
    expect(primaryMarkup).not.toContain("auto-save");
    expect(primaryMarkup).not.toContain("auto-submit");
    expect(primaryMarkup).not.toContain("auto-update");
    expect(primaryMarkup).not.toContain("will submit");
    expect(primaryMarkup).not.toContain("will save");
    expect(primaryMarkup).not.toContain("will update");
    expect(primaryMarkup).not.toContain("will close");
    expect(primaryMarkup).not.toContain("can submit");
    expect(primaryMarkup).not.toContain("can save");
    expect(primaryMarkup).not.toContain("can update");
    expect(primaryMarkup).not.toContain("can close");
    expect(primaryMarkup).not.toContain("saves the ticket");
    expect(primaryMarkup).not.toContain("submits the ticket");
    expect(primaryMarkup).not.toContain("updates the ticket");
    expect(primaryMarkup).not.toContain("closes the ticket");
  });

  it("preserves first-class Settings with language, environment, URL inputs, and clear-state reasons", () => {
    const output = renderAppMarkup();
    const settingsMarkupText = settingsMarkup(output);

    expect(mainMarkupWithoutSettings(output).match(/workbench-settings-button/g)?.length ?? 0).toBe(1);
    expect(mainMarkupWithoutSettings(output)).not.toContain('class="workbench-icon-button workbench-settings-rail-button"');
    expect(output).toContain('aria-expanded="false" class="workbench-settings-button workbench-settings-nav-button"');
    expect(settingsMarkupText).toContain('aria-label="Close"');
    expect(settingsMarkupText).toContain("Language");
    expect(settingsMarkupText).not.toContain('<span class="summary-label">Default environment</span>');
    expect(settingsMarkupText).toContain("Default environment selector");
    expect(settingsMarkupText).toContain("ServiceNow target settings");
    expect(settingsMarkupText).toContain("Templates / Settings");
    expect(settingsMarkupText).toContain("Optional field checklist / Team rules");
    expect(settingsMarkupText).toContain("QA target");
    expect(settingsMarkupText).toContain("Production target");
    expect(settingsMarkupText).toContain("Paste replacement target");
    expect(settingsMarkupText).not.toContain("Production URL");
    expect(settingsMarkupText).not.toContain("Target URL");
    expect(settingsMarkupText).toContain("Clear saved settings");
    expect(settingsMarkupText).toContain("Disabled: no saved settings to clear.");
    expect(settingsMarkupText).toContain("Save settings");
    expect(settingsMarkupText).toContain("Reset display");
    expect(settingsMarkupText).toContain("Settings apply locally in this window. Browser safety rules are unchanged.");
    expect(settingsMarkupText).toContain("No credentials are stored");
    expect(settingsMarkupText).not.toContain("Development Test Environment");
    expect(settingsMarkupText).not.toContain("Production Shadow Mode");
    expect(settingsMarkupText).not.toContain("Mock Demo");
  });

  it("simplifies the Settings default environment row without duplicate QA values", () => {
    const englishSettings = settingsMarkup(renderAppMarkup("en-US"));
    const simplifiedChineseSettings = settingsMarkup(renderAppMarkup("zh-CN"));

    expect(englishSettings).toContain("Default environment selector");
    expect(englishSettings).toContain("Choose this workspace to use Start, Check Page, and Autofill. Production remains read-only.");
    expect(englishSettings).toContain('value="production-shadow"');
    expect(englishSettings).toContain("Production");
    expect(visibleTextCount(englishSettings, "QA workspace")).toBe(1);
    expect(englishSettings).not.toContain("QA-only runtime controls stay visible");
    expect(englishSettings).not.toContain("default-environment-settings");

    expect(simplifiedChineseSettings).toContain("默认环境选择器");
    expect(simplifiedChineseSettings).toContain("选择此工作区可使用启动、检查页面、自动填充。生产保持只读。");
    expect(simplifiedChineseSettings).toContain('value="production-shadow"');
    expect(simplifiedChineseSettings).toContain("生产环境");
    expect(visibleTextCount(simplifiedChineseSettings, "QA 工作区")).toBe(1);
    expect(simplifiedChineseSettings).not.toContain("QA 专用运行控件会保持可见");
    expect(simplifiedChineseSettings).not.toContain("default-environment-settings");
  });

  it("keeps localized checklist safety copy aligned on Resolve as a blocked write action", () => {
    const enOutput = renderAppMarkup("en-US");
    const zhCnOutput = renderAppMarkup("zh-CN");
    const zhTwOutput = renderAppMarkup("zh-TW");

    expect(enOutput).toContain("No real ServiceNow field fill, Save, Submit, Update, Resolve, Close");
    const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    expect(appSource).toContain("The app does not Save, Submit, Update, Resolve, or Close real tickets automatically.");
    expect(appSource).toContain("Any real QA Save/Submit/Update/Resolve/Close action requires explicit operator approval.");
    expect(appSource).not.toContain("The app does not submit, close, or update real tickets automatically.");
    expect(appSource).not.toContain("Any real QA submit requires explicit operator approval.");
    expect(zhCnOutput).toContain("Save、Submit、Update、Resolve、Close");
    expect(zhTwOutput).toContain("Save、Submit、Update、Resolve、Close");
    const outdatedNoWriteCopy = ["Save", "Submit", "Update", "Close", "API"].join("、");
    expect(zhCnOutput).not.toContain(outdatedNoWriteCopy);
    expect(zhTwOutput).not.toContain(outdatedNoWriteCopy);
  });

  it("renders the main draft as adaptive wrapping text areas without confidence or local-draft chrome", () => {
    const output = renderAppMarkup();
    const primaryMarkup = mainMarkupWithoutSettings(output);
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

    expect(primaryMarkup).toContain('data-auto-fit-field="shortDescription"');
    expect(primaryMarkup).toContain('aria-label="Short description"');
    expect(primaryMarkup).toContain('data-auto-fit-field="description"');
    expect(primaryMarkup).toContain('data-auto-fit-field="workNotes"');
    expect(primaryMarkup).toContain('rows="11"');
    expect(primaryMarkup).toContain('rows="10"');
    expect(styles.lastIndexOf("textarea[data-auto-fit-field]")).toBeGreaterThan(styles.lastIndexOf("max-height: 70px"));
    expect(styles).toContain("max-height: none;");
    expect(primaryMarkup).not.toContain("local evidence");
    expect(primaryMarkup).not.toContain("Create local draft");
    expect(primaryMarkup).not.toContain("Local draft only");
    expect(primaryMarkup).not.toContain("Copy draft text");
    expect(primaryMarkup).not.toContain("Hold for review");
    expect(primaryMarkup).toContain("Manual review only. ServiceNow Save/Submit/Update/Resolve/Close stays manual.");
  });

  it("renders Traditional Chinese and Spanish app chrome/settings without falling back to English-only labels", () => {
    const zhTwOutput = renderAppMarkup("zh-TW", { initialRuntimeRailExpanded: true });
    const esOutput = renderAppMarkup("es-ES", { initialRuntimeRailExpanded: true });

    expect(zhTwOutput).toContain("操作工作臺");
    expect(zhTwOutput).toContain("設定");
    expect(zhTwOutput).toContain("QA 工作區");
    expect(zhTwOutput).toContain("選擇此工作區可使用啟動、檢查頁面、自動填入。生產保持唯讀。");
    expect(zhTwOutput).toContain("儲存設定");
    expect(zhTwOutput).toContain("驗證目前 Incident");
    expect(esOutput).toContain("Columnas del banco de trabajo del operador");
    expect(esOutput).toContain("Configuración");
    expect(esOutput).toContain("Elige este espacio para usar Start, Check Page y Autofill. Producción permanece en solo lectura.");
    expect(esOutput).toContain("Guardar configuración");
    expect(esOutput).toContain("Selector de entorno predeterminado");
    expect(esOutput).toContain("Contraer panel de acciones del navegador");
  });

  it("uses whole-workbench zoom and auto-growing draft textareas", () => {
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
    const longText = "Long wrapped draft sentence ".repeat(32);
    const pageShellHeightRuleStart = styles.indexOf(".workbench-center > .workbench-page-shell {");
    const pageShellHeightRule = styles.slice(pageShellHeightRuleStart, styles.indexOf("}", pageShellHeightRuleStart));

    expect(styles).toContain("zoom: var(--app-zoom-scale, 1);");
    expect(styles).not.toContain("font-size: calc(16px * var(--app-font-scale");
    expect(styles).toContain("width: var(--app-zoom-width, 100%);");
    expect(styles).toContain("height: var(--app-zoom-height, 100vh);");
    expect(pageShellHeightRule).toContain("min-height: 100%;");
    expect(pageShellHeightRule).not.toMatch(/^  height: 100%;$/m);
    expect(styles).toContain(".workbench-page-shell {\n  align-content: start;\n  display: grid;\n  gap: 12px;\n  grid-auto-rows: max-content;");
    expect(styles).toContain("textarea[data-auto-fit-field]");
    expect(styles).toContain("overflow-y: hidden;");
    expect(styles).toContain("field-sizing: content;");
    expect(styles).not.toContain("max-height: 70px;");
    expect(styles).not.toContain("resize: vertical;\n  white-space: pre-wrap;");
    expect(getDraftTextAreaRows("shortDescription", longText)).toBeGreaterThan(4);
    expect(getDraftTextAreaRows("description", longText)).toBeGreaterThan(12);
    expect(getDraftTextAreaRows("workNotes", "Short note")).toBe(5);
  });

  it("keeps settings Field Review and Template Settings at compact unified type sizes", () => {
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

    expect(styles).toContain(".settings-sidebar .template-settings-panel,");
    expect(styles).toContain(".settings-sidebar .field-review-checklist {");
    expect(styles).toContain("font-size: 13px;");
    expect(styles).toContain(".settings-sidebar .template-settings-body textarea {");
    expect(styles).toContain("font-size: 12px;");
    expect(styles).toContain(".settings-sidebar .field-review-summary-title strong {");
    expect(styles).toContain("font-size: 13px;");
    expect(styles).toContain(".settings-sidebar .field-review-progress strong {");
    expect(styles).toContain("font-size: 12px;");
  });

  it("maps the target-ui-v2 palette and layout to --sna CSS variables", () => {
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
    const tokens = readFileSync(new URL("../../../docs/design/target-ui-v2-design-tokens.json", import.meta.url), "utf8");

    expect(styles).toContain("--sna-bg: #f8f7f3");
    expect(styles).toContain("--sna-surface: #fefefd");
    expect(styles).toContain("--sna-text: #1c1c1c");
    expect(styles).toContain("--sna-brand: #3e8f4f");
    expect(styles).toContain("--sna-amber: #da871c");
    expect(styles).toContain("--sna-radius-card: 14px");
    expect(styles).toContain("--sna-runtime-rail-width: 328px");
    expect(styles).toContain("--sna-radius-control: 8px");
    expect(styles).toContain(".settings-sidebar-footer {\n  flex: 0 0 auto;");
    expect(styles).toContain(".settings-sidebar summary > strong {");
    expect(styles).toContain("grid-column: 1 / -1;");
    expect(styles).toContain("grid-auto-rows: max-content;");
    expect(styles).toContain("min-width: 12ch;");
    expect(styles).toContain(".workbench-icon-button span {");
    expect(styles).toContain("white-space: nowrap;");
    expect(styles).toContain(".field-review-summary-title > * {");
    expect(styles).toContain(".settings-sidebar .field-review-summary-title .eyebrow,");
    expect(styles).toContain(".settings-sidebar .field-review-body {");
    expect(styles).toContain("max-height: min(220px, 42vh);");
    expect(styles).toContain(".field-review-checklist .field-review-progress {");
    expect(styles).toContain("display: inline-flex;");
    expect(tokens).toContain('"themeKey": "target"');
    expect(tokens).toContain('"sourceReference": "docs/design/operator-workbench-v2-target-image-spec.md"');
    expect(tokens).not.toContain('"sourceImage"');
  });

  it("applies K6I5B page and flatter control cleanup styles", () => {
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

    expect(styles).toContain("/* K6I5B target-like page/control cleanup */");
    expect(styles).toContain(".workbench-page-shell {");
    expect(styles).toContain(".workbench-page-sidepanel {");
    expect(styles).toContain(".workbench-page-context-panel {");
    expect(styles).toContain(".workbench-topbar .workbench-status-pill,");
    expect(styles).toContain("border-radius: var(--sna-radius-control);");
  });

  it("applies K6I5D calm-shell cleanup for labels, borders, dots, and settings placement", () => {
    const output = renderAppMarkup("zh-CN", { initialRuntimeRailExpanded: false });
    const primaryMarkup = mainMarkupWithoutSettings(output);
    const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
    const selectedSourceRuleStart = styles.indexOf(".workbench-source-item.selected {");
    const selectedSourceRule = styles.slice(selectedSourceRuleStart, styles.indexOf("}", selectedSourceRuleStart));

    expect(visibleTextCount(primaryMarkup, "清理摘要")).toBe(1);
    expect(visibleTextCount(primaryMarkup, "Incident 草稿")).toBe(1);
    expect(primaryMarkup).not.toContain("已选来源");
    expect(primaryMarkup).not.toContain('class="draft-status-pill"');
    expect(primaryMarkup).toContain('class="workbench-source-item today-source-item');
    expect(primaryMarkup).toContain('class="workbench-source-dot"');
    expect(primaryMarkup).toContain('class="workbench-settings-button workbench-settings-nav-button"');
    expect(primaryMarkup.indexOf('workbench-settings-nav-button')).toBeLessThan(primaryMarkup.indexOf('workbench-search-box'));
    expect(primaryMarkup.indexOf('workbench-settings-nav-button')).toBeLessThan(primaryMarkup.indexOf('source-list-title'));
    expect(primaryMarkup).not.toContain('class="workbench-icon-button workbench-settings-rail-button"');
    expect(styles).toContain("/* K6I5D nine-item cleanup */");
    expect(styles).toContain("border: 0;");
    expect(styles).toContain("box-shadow: none;");
    expect(styles).toContain(".workbench-source-dot {");
    expect(selectedSourceRuleStart).toBeGreaterThan(-1);
    expect(selectedSourceRule).toContain("background: transparent;");
    expect(selectedSourceRule).toContain("box-shadow: none;");
    expect(styles).toContain(".default-environment-selector-panel {");
  });

  it("hides saved target URLs and hosts from both the main workbench and Settings", () => {
    const rawQaUrl = "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do";
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "qa",
      initialEnvironmentUrlSettings: { qa: rawQaUrl }
    });
    const primaryMarkup = mainMarkupWithoutSettings(output);
    const settingsMarkup = output.slice(output.indexOf('id="app-settings-sidebar"'));

    expect(primaryMarkup).toContain("QA target hidden");
    expect(primaryMarkup).not.toContain(rawQaUrl);
    expect(primaryMarkup).not.toContain("qa.service-now.example.invalid");
    expect(settingsMarkup).not.toContain(rawQaUrl);
    expect(settingsMarkup).not.toContain("qa.service-now.example.invalid");
    expect(settingsMarkup).toContain("Custom target active; raw value hidden");
    expect(settingsMarkup).toContain("Ready: clears local target overrides and resets page-check/Autofill readiness.");
  });

  it("renders one operator source item for each deterministic intake scenario", () => {
    const output = renderAppMarkup();
    const sourceItemCount = output.match(/class="workbench-source-item/g)?.length ?? 0;

    expect(sourceItemCount).toBe(demoManualPasteScenarios.length);
    expect(output).toContain("Teams note: VPN connection issue after passwo…");
    expect(output).toContain("ServiceNow Chat transcript");
    expect(output).toContain("A sanitized teammate reports VPN cannot connect after a recent password reset.");
    expect(mainMarkupWithoutSettings(output)).not.toContain("Demo requester");
  });

  it("avoids duplicate center headings across workbench and static pages", () => {
    const workbenchOutput = mainMarkupWithoutSettings(renderAppMarkup("en-US", { initialActivePage: "workbench" }));
    const knowledgeOutput = mainMarkupWithoutSettings(renderAppMarkup("en-US", { initialActivePage: "knowledge" }));
    const historyOutput = mainMarkupWithoutSettings(renderAppMarkup("en-US", { initialActivePage: "history" }));
    const searchOutput = mainMarkupWithoutSettings(renderAppMarkup("en-US", { initialActivePage: "search" }));

    expect(workbenchOutput).not.toContain('<p class="eyebrow">Cleaned summary</p><h2');
    expect(workbenchOutput).not.toContain('<p class="eyebrow">Incident draft</p><h2');
    expect(knowledgeOutput).not.toContain('<strong>Knowledgebase snippets</strong>');
    expect(historyOutput).not.toContain('<strong>History timeline</strong>');
    expect(searchOutput).not.toContain('<strong>Search workspace</strong>');
  });

  it("renders Production as a visible read-only workbench mode with runtime actions disabled", () => {
    const output = renderAppMarkup("en-US", {
      initialEnvironmentMode: "production-shadow",
      initialRuntimeRailExpanded: true
    });
    const primaryMarkup = mainMarkupWithoutSettings(output);
    const settingsMarkup = output.slice(output.indexOf('id="app-settings-sidebar"'));

    expect(primaryMarkup).toContain("Production");
    expect(primaryMarkup).toContain("Target missing");
    expect(primaryMarkup).not.toContain("Production Shadow Mode");
    expect(primaryMarkup).not.toContain("Production shadow");
    expect(settingsMarkup).toContain("Production target");
    expect(settingsMarkup).toContain("Production");
    expect(settingsMarkup).not.toContain("Production Shadow Mode");
    expect(settingsMarkup).not.toContain("Mock Demo");
    expect(buttonAttrs(output, "1 Start QA Chromium")).toContain("disabled");
    expect(buttonAttrs(output, "2 Verify current Incident")).toContain("disabled");
    expect(buttonAttrs(output, "3 Autofill current Incident")).toContain("disabled");
  });

  it("localizes the operator workbench chrome to Chinese", () => {
    const output = renderAppMarkup("zh-CN", { initialRuntimeRailExpanded: true });

    expect(output).toContain("操作工作台");
    expect(output).toContain("QA 工作区");
    expect(output).toContain("QA 目标已隐藏");
    expect(output).not.toContain("已选来源");
    expect(output).toContain("清理摘要");
    expect(output).toContain("Incident 草稿");
    expect(output).toContain("浏览器操作");
    expect(output).toContain("打开 QA Chromium");
    expect(output).toContain("禁用：请先打开 QA Chromium，并等待浏览器连接就绪。");
    expect(output).toContain("验证当前 Incident");
    expect(output).toContain("自动填充当前 Incident");
    expect(output).toContain("设置");
  });

  it("builds multilingual P1/P2 voice reminder policy copy without rendering the simulator in the shell", () => {
    const p1TraditionalChinese = getHighSeverityVoiceReminder("p1", "zh-TW");
    const p2English = getHighSeverityVoiceReminder("p2", "en-US");
    const p2Spanish = getHighSeverityVoiceReminder("p2", "es-ES");

    expect(renderAppMarkup()).not.toContain("High Severity Monitor Simulator");
    expect(p1TraditionalChinese.severity).toBe("p1");
    expect(p1TraditionalChinese.requiresManualAcknowledge).toBe(true);
    expect(p1TraditionalChinese.autoStopAfterAnnouncements).toBeNull();
    expect(p1TraditionalChinese.voiceText).toContain("P1 緊急事件");
    expect(p2English.autoStopAfterAnnouncements).toBe(3);
    expect(p2English.voiceText).toContain("P2 urgent incident reminder");
    expect(p2Spanish.voiceText).toContain("incidente urgente P2");
  });

  it("suppresses P1/P2 voice reminders outside the monitored groups", () => {
    const monitoredGroups: HighSeverityMonitorGroup[] = ["demo-network-operations"];
    const monitoredP1 = getHighSeverityVoiceReminder("p1", "en-US", monitoredGroups);
    const suppressedP2 = getHighSeverityVoiceReminder("p2", "en-US", monitoredGroups);

    expect(monitoredP1.alarmEnabled).toBe(true);
    expect(monitoredP1.monitoredGroupLabel).toBe("Demo Network Operations");
    expect(monitoredP1.voiceText).toContain("P1 critical incident");
    expect(suppressedP2.alarmEnabled).toBe(false);
    expect(suppressedP2.monitoredGroupLabel).toBe("Demo Identity Access");
    expect(suppressedP2.voiceText).not.toContain("P2 urgent incident reminder");
    expect(suppressedP2.suppressionText).toContain("not in monitored groups");
  });

  it("keeps every localized high severity reminder populated", () => {
    const languages: LanguageCode[] = ["zh-CN", "zh-TW", "en-US", "es-ES"];
    const severities = ["normal", "p2", "p1"] as const;

    for (const language of languages) {
      for (const severity of severities) {
        const reminder = getHighSeverityVoiceReminder(severity, language);
        expect(reminder.voiceText.length).toBeGreaterThan(12);
        expect(reminder.policyText.length).toBeGreaterThan(6);
        expect(reminder.previewSafetyText).toContain("Local browser speech preview only");
      }
    }
  });

  it("defines local-only P1/P2 speech reminder policies without polling ServiceNow", () => {
    const p1Policy = getHighSeveritySpeechReminderPolicy("p1");
    const p2Policy = getHighSeveritySpeechReminderPolicy("p2");
    const normalPolicy = getHighSeveritySpeechReminderPolicy("normal");

    expect(p1Policy).toMatchObject({
      active: true,
      cadenceSeconds: 60,
      maxAnnouncements: null,
      requiresManualStop: true,
      autoStops: false
    });
    expect(p2Policy).toMatchObject({
      active: true,
      cadenceSeconds: 300,
      maxAnnouncements: 3,
      requiresManualStop: false,
      autoStops: true
    });
    expect(normalPolicy.active).toBe(false);
  });

  it("blocks local speech reminders when the fake event is muted, acknowledged, unmonitored, or auto-stopped", () => {
    const p1Reminder = getHighSeverityVoiceReminder("p1", "en-US");
    const p2Reminder = getHighSeverityVoiceReminder("p2", "en-US");
    const suppressedP2 = getHighSeverityVoiceReminder("p2", "en-US", ["demo-network-operations"]);

    expect(getHighSeveritySpeechReminderDecision(p1Reminder, "en-US", { announcementCount: 12 }).status).toBe(
      "ready"
    );
    expect(getHighSeveritySpeechReminderDecision(p1Reminder, "en-US", { acknowledged: true }).reason).toContain(
      "acknowledged"
    );
    expect(getHighSeveritySpeechReminderDecision(p1Reminder, "en-US", { muted: true }).reason).toContain("muted");
    expect(getHighSeveritySpeechReminderDecision(p2Reminder, "en-US").status).toBe("ready");
    expect(getHighSeveritySpeechReminderDecision(p2Reminder, "en-US", { muted: true }).reason).toContain("muted");
    expect(getHighSeveritySpeechReminderDecision(p2Reminder, "en-US", { acknowledged: true }).reason).toContain(
      "acknowledged"
    );
    expect(getHighSeveritySpeechReminderDecision(suppressedP2, "en-US").reason).toContain("not monitored");
    expect(getHighSeveritySpeechReminderDecision(p2Reminder, "en-US", { announcementCount: 2 }).status).toBe(
      "ready"
    );
    expect(getHighSeveritySpeechReminderDecision(p2Reminder, "en-US", { announcementCount: 3 }).reason).toContain(
      "auto-stopped"
    );
  });

  it("previews speech through injected browser speech synthesis only and never creates external side effects", () => {
    const spokenUtterances: { text: string; lang?: string; rate?: number; volume?: number }[] = [];
    const localeCases: LanguageCode[] = ["zh-CN", "zh-TW", "en-US", "es-ES"];

    for (const language of localeCases) {
      const reminder = getHighSeverityVoiceReminder("p2", language);
      const localeUtterances: { text: string; lang?: string; rate?: number; volume?: number }[] = [];
      const localeDecision = previewHighSeveritySpeechReminder({
        language,
        reminder,
        speechSynthesis: {
          speak: (utterance) => localeUtterances.push(utterance)
        },
        utteranceFactory: (text) => ({ text }),
        cancelBeforeSpeak: false
      });

      expect(localeDecision.status).toBe("spoken");
      expect(localeDecision.locale).toBe(language);
      expect(localeUtterances).toEqual([
        expect.objectContaining({ text: reminder.voiceText, lang: language, rate: 0.96, volume: 1 })
      ]);
    }

    const p1Reminder = getHighSeverityVoiceReminder("p1", "zh-CN");
    const decision = previewHighSeveritySpeechReminder({
      language: "zh-CN",
      reminder: p1Reminder,
      speechSynthesis: {
        cancel: () => spokenUtterances.push({ text: "cancelled" }),
        speak: (utterance) => spokenUtterances.push(utterance)
      },
      utteranceFactory: (text) => ({ text })
    });

    expect(decision.status).toBe("spoken");
    expect(decision.locale).toBe("zh-CN");
    expect(decision.announcementCount).toBe(1);
    expect(spokenUtterances).toEqual([
      { text: "cancelled" },
      expect.objectContaining({ text: p1Reminder.voiceText, lang: "zh-CN", rate: 1, volume: 1 })
    ]);

    const unsupportedDecision = previewHighSeveritySpeechReminder({
      language: "en-US",
      reminder: getHighSeverityVoiceReminder("p2", "en-US"),
      speechSynthesis: null
    });
    expect(unsupportedDecision.status).toBe("unsupported");
    expect(unsupportedDecision.reason).toContain("speech synthesis is unavailable");
  });

  it("renders the manual local speech preview simulator only in the expanded runtime rail", () => {
    const defaultShell = renderAppMarkup("en-US");
    const expandedRail = renderAppMarkup("en-US", {
      initialHighSeverityState: "p1",
      initialRuntimeRailExpanded: true
    });

    expect(defaultShell).not.toContain("Preview local speech reminder");
    expect(expandedRail).toContain("High Severity Monitor Simulator");
    expect(expandedRail).toContain("Preview local speech reminder");
    expect(expandedRail).toContain("Fake simulator only — no ServiceNow polling or API calls");
    expect(expandedRail).toContain("No ServiceNow polling, API write, or production notification");
  });

  it("renders the What Changed panel toggle in the expanded runtime rail", () => {
    const defaultShell = renderAppMarkup("en-US");
    const expandedRail = renderAppMarkup("en-US", {
      initialRuntimeRailExpanded: true
    });

    expect(defaultShell).not.toContain("What changed in this round");
    expect(expandedRail).toContain("What changed in this round");
    expect(expandedRail).toContain("runtime-what-changed");
    expect(expandedRail).toContain("what-changed-toggle");
    expect(expandedRail).not.toContain('id="what-changed-content"');
  });

  it("applies the default template around generated draft content", () => {
    const queueItem = buildDemoQueueItems("en-US")[0];
    const draft = buildDraftForQueueItem(queueItem);
    const templated = applyDraftTemplates(draft, draftTemplatePresets[0]);

    expect(templated.description.value).toContain("Intake summary");
    expect(templated.description.value).toContain(draft.description.value);
    expect(templated.workNotes.value).toContain("Internal triage notes");
    expect(templated.workNotes.value).toContain(draft.workNotes.value);
  });

  it("builds zh-TW queue data and draft fields from deterministic local content", () => {
    const queueItems = buildDemoQueueItems("zh-TW");
    const draft = buildDraftForQueueItem(queueItems[0]);

    expect(queueItems[0].sourceLanguage).toBe("台灣繁體中文");
    expect(queueItems[0].subject).toContain("VPN");
    expect(draft.description.value).toContain("使用者回報 VPN");
    expect(draft.workNotes.value).toContain("初步排查");
    expect(draft.shortDescription.value.length).toBeGreaterThan(10);
  });

  it("maps every manual paste scenario button to one deterministic queue item", () => {
    const queueItems = buildDemoQueueItems("en-US");

    expect(queueItems).toHaveLength(demoManualPasteScenarios.length);
    for (const scenario of demoManualPasteScenarios) {
      const matches = queueItems.filter((item) => item.scenarioId === scenario.id);
      expect(matches).toHaveLength(1);
      expect(matches[0].sourceBody.length).toBeGreaterThan(20);
      expect(matches[0].status).toBe("New");
    }
  });

  it("clamps local app zoom and maps Ctrl wheel direction", () => {
    expect(clampAppZoomPercent(20)).toBe(80);
    expect(clampAppZoomPercent(240)).toBe(150);
    expect(getNextAppZoomPercent(100, 10)).toBe(110);
    expect(getNextAppZoomPercent(150, 10)).toBe(150);
    expect(getNextAppZoomPercent(80, -10)).toBe(80);
    expect(getCtrlWheelZoomDelta(-1)).toBe(10);
    expect(getCtrlWheelZoomDelta(1)).toBe(-10);
    expect(getCtrlWheelZoomDelta(0)).toBe(-10);
  });

  it("accepts safe ServiceNow landing URL overrides and clears invalid drafts", () => {
    const safeUrl = "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do";
    const queryUrl = `${safeUrl}?${"sys"}_id=blocked`;

    expect(getNextEnvironmentUrlOverrideFromDraft("qa", safeUrl)).toBe(safeUrl);
    const credentialBearingUrl = `https://user:masked${String.fromCharCode(64)}example.invalid`;

    expect(getNextEnvironmentUrlOverrideFromDraft("qa", queryUrl)).toBe("");
    expect(getNextEnvironmentUrlOverrideFromDraft("dev", credentialBearingUrl)).toBe("");
  });

  it("keeps the selected QA write action local and clears stale approval phrases", () => {
    expect(updateQaSmokeWriteActionSelection("save_incident")).toEqual({
      writeAction: "save_incident",
      approvalPhrase: ""
    });
    expect(updateQaSmokeWriteActionSelection("submit_incident")).toEqual({
      writeAction: "submit_incident",
      approvalPhrase: ""
    });
  });

  it("renders the intake source type selector in the sidebar", () => {
    const output = renderAppMarkup();

    expect(output).toContain('class="workbench-intake-selector"');
    expect(output).toContain('aria-label="Intake source"');
    expect(output).toContain('class="workbench-intake-select"');
    expect(output).toContain('aria-label="Select intake source type"');
  });

  it("renders all 6 intake source kinds as select options", () => {
    const output = renderAppMarkup();

    for (const kind of IntakeSourceKinds) {
      const adapter = sourceAdapterRegistry[kind];
      expect(output).toContain(`value="${kind}"`);
      expect(output).toContain(adapter.meta.label);
    }
  });

  it("shows the safety notice on the intake selector", () => {
    const output = renderAppMarkup();

    expect(output).toContain('class="workbench-intake-safety-notice"');
    expect(output).toContain("Manual / stub / local only");
  });

  it("renders a disabled capture button when the textarea is empty", () => {
    const output = renderAppMarkup();

    expect(output).toContain('class="workbench-intake-capture-btn"');
    expect(buttonAttrs(output, "Capture as source")).toContain("disabled");
  });

  it("shows the paste placeholder on the intake textarea", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Paste content from the selected source type");
  });

  it("maps operator actions to sanitized display labels", () => {
    expect(operatorActionDisplayAction("launch")).toBe("QA Chromium launch");
    expect(operatorActionDisplayAction("verify")).toBe("Verify");
    expect(operatorActionDisplayAction("autofill")).toBe("Autofill");
  });

  it("maps internal blocked reason codes to sanitized plain-language descriptions", () => {
    expect(operatorSanitizeBlockedReason("dedicated-browser-runtime-missing")).toBe(
      "dedicated browser runtime unavailable"
    );
    expect(operatorSanitizeBlockedReason("qa-runtime-required")).toBe(
      "production mode is read-only; switch to QA workspace"
    );
    expect(operatorSanitizeBlockedReason("cdp-endpoint-denied")).toBe(
      "test browser disconnected; restart browser"
    );
    expect(operatorSanitizeBlockedReason("cdp-page-selection-denied")).toBe(
      "could not find one unique approved Incident tab in the test browser"
    );
    expect(operatorSanitizeBlockedReason("no-default-plan")).toBe(
      "could not build default autofill plan; no fields matched"
    );
    expect(operatorSanitizeBlockedReason("browser-step-timeout")).toBe(
      "operation timed out; no ServiceNow action was taken"
    );
    expect(operatorSanitizeBlockedReason("approval-stale-after-page-change")).toBe(
      "page changed after approval; re-check the current ticket page"
    );
  });

  it("sanitizes unknown blocked reason codes to a generic fallback that does not leak internal details", () => {
    expect(operatorSanitizeBlockedReason("sys_id_mismatch")).toBe(
      "operation could not complete; retry from the browser action rail"
    );
    expect(operatorSanitizeBlockedReason("")).toBe(
      "operation could not complete; retry from the browser action rail"
    );
  });

  it("shows validation run stats on the history page, including zero-run empty state", () => {
    const output = renderAppMarkup("en-US", { initialActivePage: "history" });

    expect(output).toContain("Validation runs");
    expect(output).toContain("Passed");
    expect(output).toContain("Blocked");
    expect(output).toContain("aria-label=\"History timeline context panel\"");
  });

  it("keeps the validation run description free of raw ServiceNow identifiers", () => {
    const output = renderAppMarkup("en-US", { initialActivePage: "history" });

    // The history description should not hint at raw ServiceNow URLs, sys_ids, or ticket IDs
    const descriptionTagMatch = output.match(/<p[^>]*>([^<]*)history timeline description[^<]*<\/p>/i);
    // Instead check the page for the expected sanitized description
    expect(output).not.toContain("sys_id");
    expect(output).not.toContain("sysId");
    expect(output).not.toContain("ticket ID");
    expect(output).not.toContain("ServiceNow URL");
    expect(output).not.toContain("ServiceNow host");
    expect(output).not.toContain("assignment group");
  });

  it("exportValidationRunsToMarkdown returns empty header when there are no runs", () => {
    const md = exportValidationRunsToMarkdown([]);
    expect(md).toContain("# Validation Runs");
    expect(md).toContain("No validation runs recorded.");
  });

  it("exportValidationRunsToCsv returns header-only when there are no runs", () => {
    const csv = exportValidationRunsToCsv([]);
    expect(csv).toBe("Time,Action,Result,Details\n");
  });

  it("exportValidationRunsToMarkdown renders a table from validation runs", () => {
    const runs = [
      { id: "vr-1", timestamp: "2026-06-05 00:00:00", action: "launch" as const, status: "ok" as const, sanitizedSummary: "App launch ok, browser ready" },
      { id: "vr-2", timestamp: "2026-06-05 00:01:00", action: "verify" as const, status: "blocked" as const, sanitizedSummary: "Page check blocked: could not find one unique approved Incident tab" }
    ];
    const md = exportValidationRunsToMarkdown(runs);
    expect(md).toContain("| Time | Action | Result | Details |");
    expect(md).toContain("| 2026-06-05 00:01:00 | Verify | BLOCKED | Page check blocked:");
    expect(md).toContain("| 2026-06-05 00:00:00 | QA Chromium launch | OK | App launch ok, browser ready");
  });

  it("exportValidationRunsToCsv renders CSV rows from validation runs", () => {
    const runs = [
      { id: "vr-1", timestamp: "2026-06-05 00:00:00", action: "launch" as const, status: "ok" as const, sanitizedSummary: "App launch ok, browser ready" },
      { id: "vr-2", timestamp: "2026-06-05 00:01:00", action: "verify" as const, status: "blocked" as const, sanitizedSummary: "Page check blocked: could not find one unique approved Incident tab" }
    ];
    const csv = exportValidationRunsToCsv(runs);
    expect(csv).toContain("Time,Action,Result,Details");
    expect(csv).toContain("2026-06-05 00:01:00,Verify,BLOCKED,\"Page check blocked:");
    expect(csv).toContain("2026-06-05 00:00:00,QA Chromium launch,OK,\"App launch ok; browser ready\"");
  });

  it("exportValidationRunsToMarkdown does not contain raw ticket metadata", () => {
    const runs = [
      { id: "vr-1", timestamp: "2026-06-05 00:00:00", action: "launch" as const, status: "ok" as const, sanitizedSummary: "App launch ok, browser ready" }
    ];
    const md = exportValidationRunsToMarkdown(runs);
    expect(md).not.toContain("sys_id");
    expect(md).not.toContain("sysId");
    expect(md).not.toContain("ticket ID");
    expect(md).not.toContain("ServiceNow URL");
    expect(md).not.toContain("INC");
  });

  it("exportValidationRunsToCsv does not contain raw ticket metadata", () => {
    const runs = [
      { id: "vr-1", timestamp: "2026-06-05 00:00:00", action: "launch" as const, status: "ok" as const, sanitizedSummary: "App launch ok, browser ready" }
    ];
    const csv = exportValidationRunsToCsv(runs);
    expect(csv).not.toContain("sys_id");
    expect(csv).not.toContain("sysId");
    expect(csv).not.toContain("ticket ID");
    expect(csv).not.toContain("ServiceNow URL");
    expect(csv).not.toContain("INC");
  });

  it("exportProductReviewReport produces a complete Markdown report with all required sections", () => {
    const queueItem = buildDemoQueueItems("en-US")[0];
    const draft = buildDraftForQueueItem(queueItem);
    const runs = [
      { id: "vr-1", timestamp: "2026-06-05 00:00:00", action: "launch" as const, status: "ok" as const, sanitizedSummary: "App launch ok, browser ready" },
      { id: "vr-2", timestamp: "2026-06-05 00:01:00", action: "verify" as const, status: "ok" as const, sanitizedSummary: "Page inspected, 8 allowed fields planned" },
      { id: "vr-3", timestamp: "2026-06-05 00:02:00", action: "autofill" as const, status: "blocked" as const, sanitizedSummary: "Autofill blocked: approval phrase required" }
    ];
    const report = exportProductReviewReport(queueItem, draft, runs);

    // Required sections
    expect(report).toContain("# Product-Review Report");
    expect(report).toContain("## Demo Scenario");
    expect(report).toContain("## TicketDraft Summary");
    expect(report).toContain("## KB / Support Recommendation");
    expect(report).toContain("## Safety Boundary");
    expect(report).toContain("## Validation Run Summary");
    expect(report).toContain("## What This Proves");
    expect(report).toContain("## What Remains Human-Only");
    expect(report).toContain("## Export Safety Notice");

    // Scenario info
    expect(report).toContain(queueItem.scenarioId);
    expect(report).toContain(queueItem.sourceChannel);

    // Draft content
    expect(report).toContain(draft.shortDescription.value);
    expect(report).toContain("Local-only execution");
    expect(report).toContain("No real ServiceNow write");

    // Validation run data
    expect(report).toContain("3"); // total runs
    expect(report).toContain("2"); // passed
    expect(report).toContain("1"); // blocked
    expect(report).toContain("App launch ok, browser ready");

    // Human-only language
    expect(report).toContain("Final review of the TicketDraft");
    expect(report).toContain("Save / Submit / Update / Resolve / Close in ServiceNow");
    expect(report).toContain("Live ServiceNow configuration");

    // Safety
    expect(report).toContain("Blob download");
    expect(report).toContain("no cloud write");
  });

  it("exportProductReviewReport handles empty validation runs gracefully", () => {
    const queueItem = buildDemoQueueItems("en-US")[0];
    const draft = buildDraftForQueueItem(queueItem);
    const report = exportProductReviewReport(queueItem, draft, []);

    expect(report).toContain("# Product-Review Report");
    expect(report).toContain("Total runs");
    expect(report).toContain("0");
    expect(report).toContain("No validation runs recorded.");
  });

  it("exportProductReviewReport does not contain raw live identifiers", () => {
    const queueItem = buildDemoQueueItems("en-US")[0];
    const draft = buildDraftForQueueItem(queueItem);
    const runs: { id: string; timestamp: string; action: "launch" | "verify" | "autofill"; status: "ok" | "blocked"; sanitizedSummary: string }[] = [];
    const report = exportProductReviewReport(queueItem, draft, runs);

    // The safety notice uses words like "credentials", "sys_ids", "password" to describe what's NOT included
    // — those are acceptable in denial-of-presence context. Check only for actual prohibited patterns:
    expect(report).not.toContain(".service-now.com");
    expect(report).not.toContain("your-instance");
    expect(report).not.toContain("admin");
    expect(report).not.toContain("api_key");
    expect(report).not.toContain("Bearer");
  });
});
