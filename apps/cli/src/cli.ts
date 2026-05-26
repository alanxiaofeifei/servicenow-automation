import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createBrowserSessionService,
  createCdpQaAutofillRuntimePageDriver,
  ManualPasteAdapter,
  runQaTextFieldAutofillRuntime,
  type BrowserNoWriteLaunchResult,
  type BrowserNoWriteLaunchSafety,
  type QaAutofillRuntimePageDriver,
  type QaAutofillRuntimeResult
} from "@servicenow-automation/adapters";
import { generateMockTicketDraft } from "@servicenow-automation/ai";
import { demoKnowledgeArticles, searchKnowledgeArticles } from "@servicenow-automation/kb/browser";
import {
  getServiceNowEnvironmentConfig,
  loadDemoServiceDeskProfile,
  validateServiceNowTargetUrl,
  type ServiceNowEnvironmentMode,
  type ServiceNowEnvironmentUrlOverrides
} from "@servicenow-automation/profiles";
import {
  buildQaTextFieldAutofillPlan,
  buildServiceDeskWorkflowPreview,
  evaluateQaSingleTicketSmokePlan,
  executeQaTextFieldAutofillFixture,
  type CapturedContext,
  type FieldDraft,
  type KnowledgeMatch,
  type QaAutofillFixturePage,
  type QaAutofillPlan,
  type QaAutofillSelectorVerification,
  type QaManualFillWriteAction,
  type QaSingleTicketSmokePlan,
  type RawIntakeSource,
  type TicketDraft
} from "@servicenow-automation/core";

export type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type RunCliOptions = {
  cwd?: string;
  qaAutofillRuntimeDriver?: QaAutofillRuntimePageDriver;
};

type ParsedFlags = {
  json: boolean;
  dryRun: boolean;
  execute: boolean;
  confirmNoWriteLaunch: boolean;
  flags: Record<string, string>;
  positionals: string[];
};

type CaseInput = {
  user?: string;
  summary?: string;
  template?: string;
};

const profile = loadDemoServiceDeskProfile();
const manualPasteAdapter = new ManualPasteAdapter({
  idFactory: () => "cli-demo-context",
  now: () => new Date("2026-05-18T12:00:00.000Z")
});

const manualFillQaIsolationConfirmationPhrase =
  "QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.";

const autofillQaIsolationConfirmationPhrase =
  "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.";

const manualFillAllowedOperatorActions = [
  "Open the controlled browser window and sign in manually.",
  "Copy reviewed field values from the local preview by hand.",
  "Stop before any Save, Submit, Update, Close, upload, or notification action."
];

const manualFillProhibitedOperatorActions = [
  "Do not use browser DOM autofill or ServiceNow API writes.",
  "Do not click Save, Submit, Update, or Close from this command.",
  "Do not bulk create, upload attachments, send email, capture screenshots, HAR, traces, cookies, or sessions."
];

const dedicatedProfileConfirmationPhrase =
  "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.";

const autofillAllowedOperatorActions = [
  "Manually log in and navigate to the authorized QA/dev Incident form in the dedicated Chromium profile.",
  "Review the three approved text fields before any fill action.",
  "Keep this command as a planning/review gate only; it does not launch a browser or fill the page.",
  "Wait for a later selector-verified execution slice before any browser text-field fill."
];

const autofillProhibitedOperatorActions = [
  "Do not Save, Submit, Update, Close, upload attachments, send email, or trigger notifications.",
  "Do not fill requester, assignment group, CI, category, subcategory, impact, urgency, priority, state, status, or customer-visible comments.",
  "Do not call the ServiceNow API, bulk fill, capture browser artifacts, export auth material, or send QA content to external AI."
];

export async function runCli(argv: string[], options: RunCliOptions = {}): Promise<CliResult> {
  const cwd = options.cwd ?? process.cwd();
  const parsed = parseArgs(argv);

  try {
    if (parsed.positionals.length === 0 || parsed.positionals[0] === "--help" || parsed.positionals[0] === "help") {
      return ok(helpText());
    }

    const [namespace, action, ...rest] = parsed.positionals;

    if (namespace === "kb" && action === "search") {
      const query = rest.join(" ").trim();
      if (!query) return fail("Missing query. Usage: sda kb search <query> [--json]");
      const matches = searchKnowledgeArticles(query, demoKnowledgeArticles, { limit: 3 });
      return output(parsed, {
        command: "kb search",
        query,
        matches,
        safety: safetyEnvelope()
      }, formatKbSearch(query, matches));
    }

    if (namespace === "ticket" && action === "draft") {
      const template = requiredFlag(parsed, "template", "ticket draft");
      const user = requiredFlag(parsed, "user", "ticket draft");
      const summary = requiredFlag(parsed, "summary", "ticket draft");
      const ticketDraft = buildTicketDraft({ template, user, summary });
      return output(parsed, {
        command: "ticket draft",
        dryRun: true,
        template,
        user,
        ticketDraft,
        safety: safetyEnvelope()
      }, formatTicketDraft(ticketDraft));
    }

    if (namespace === "notes" && action === "generate") {
      const template = requiredFlag(parsed, "template", "notes generate");
      const inputPath = requiredFlag(parsed, "input", "notes generate");
      const caseInput = await readCaseInput(cwd, inputPath);
      const ticketDraft = buildTicketDraft({
        template,
        user: caseInput.user ?? "Demo User",
        summary: caseInput.summary ?? `Generate notes for ${template}`
      });
      const notes = {
        workNotes: ticketDraft.workNotes.value,
        missingInfoQuestions: ticketDraft.missingInfoQuestions,
        kbMatches: ticketDraft.kbMatches
      };
      return output(parsed, {
        command: "notes generate",
        template,
        input: inputPath,
        notes,
        safety: safetyEnvelope()
      }, notes.workNotes);
    }

    if (namespace === "workflow" && action === "preview") {
      if (!parsed.dryRun) {
        return fail("sda workflow preview requires --dry-run. It is a local report/workflow preview only.");
      }

      const template = requiredFlag(parsed, "template", "workflow preview");
      const user = requiredFlag(parsed, "user", "workflow preview");
      const summary = requiredFlag(parsed, "summary", "workflow preview");
      const source = parseRawIntakeSource(requiredFlag(parsed, "source", "workflow preview"));
      const ticketDraft = buildTicketDraft({ template, user, summary });
      const finalAssignmentGroup = draftFieldValue(ticketDraft.assignmentGroup);
      const preview = buildServiceDeskWorkflowPreview({
        createdAt: "2026-05-18 12:00",
        rawIntakeSource: source,
        requesterDisplay: user,
        languageOrServiceDeskTeam: `${parsed.flags.language ?? "en-US"} / ${profile.defaultAssignmentGroup}`,
        issueType: "Incident",
        draft: ticketDraft,
        serviceDeskOwnerTeam: profile.defaultAssignmentGroup,
        finalAssignmentGroup,
        finalAssignmentReason: `Local ${draftFieldValue(ticketDraft.category)} / ${draftFieldValue(ticketDraft.subcategory)} mapping from sanitized CLI draft.`,
        handlingStatus: "New",
        confirmationState: {
          status: "Needs confirmation",
          summary: "Confirm requester, impact, urgency, and missing troubleshooting details before any real handling."
        }
      });

      return output(parsed, {
        command: "workflow preview",
        dryRun: true,
        template,
        preview,
        safety: safetyEnvelope({
          noServiceNowWrite: true,
          noExcelWrite: true,
          noGraphWrite: true
        })
      }, formatWorkflowPreview(preview.mappedServiceNowChannel, preview.csvRow));
    }

    if (namespace === "browser" && action === "plan") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "browser plan"));
      const environment = getServiceNowEnvironmentConfig(mode);
      const service = createBrowserSessionService({ projectRoot: cwd });
      const plan = service.createLaunchPlan(environment, {
        targetUrlOverride: parsed.flags["target-url"]
      });

      return output(parsed, {
        command: "browser plan",
        mode,
        plan,
        safety: safetyEnvelope()
      }, formatBrowserPlan(plan.status, plan.browserProfileDirectory));
    }

    if (namespace === "browser" && action === "launch") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "browser launch"));
      const environment = getServiceNowEnvironmentConfig(mode);
      const service = createBrowserSessionService({ projectRoot: cwd });
      const launch = await service.launchNoWriteBrowser(environment, {
        targetUrlOverride: parsed.flags["target-url"],
        execute: parsed.execute,
        confirmNoWriteLaunch: parsed.confirmNoWriteLaunch,
        browserExecutablePath: parsed.flags["browser-executable"]
      });

      return output(parsed, {
        command: "browser launch",
        mode,
        launch,
        safety: safetyEnvelope({
          noExternalActionPerformed: launch.status !== "launched",
          browserProcessLaunched: launch.status === "launched"
        })
      }, formatBrowserLaunch(launch.status, launch.blockedReason));
    }

    if (namespace === "browser" && action === "smoke") {
      const service = createBrowserSessionService({ projectRoot: cwd });
      const smoke = await service.smokeWindowsDedicatedChromium({
        target: parsed.flags["target"],
        execute: parsed.execute,
        confirmNoWriteLaunch: parsed.confirmNoWriteLaunch,
        browserExecutablePath: parsed.flags["browser-executable"],
        profileDirectory: parsed.flags["profile-root"]
      });

      return output(parsed, {
        command: "browser smoke",
        smoke,
        safety: safetyEnvelope({
          noExternalActionPerformed: smoke.status !== "launched",
          browserProcessLaunched: smoke.status === "launched"
        })
      }, formatBrowserSmoke(smoke.status, smoke.blockedReason));
    }

    if (namespace === "browser" && action === "reset") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "browser reset"));
      const environment = getServiceNowEnvironmentConfig(mode);
      const service = createBrowserSessionService({ projectRoot: cwd });
      const reset = await service.resetSession(environment);

      return output(parsed, {
        command: "browser reset",
        mode,
        reset,
        safety: safetyEnvelope()
      }, `Reset ignored browser profile directory: ${reset.recreatedDirectory}`);
    }

    if (namespace === "qa" && action === "smoke") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "qa smoke"));
      const template = requiredFlag(parsed, "template", "qa smoke");
      const user = requiredFlag(parsed, "user", "qa smoke");
      const summary = requiredFlag(parsed, "summary", "qa smoke");
      const environment = getServiceNowEnvironmentConfig(mode);
      const targetUrl = parsed.flags["target-url"] ?? environment.url;
      const targetValidation = validateServiceNowTargetUrl(environment, targetUrl);
      const ticketDraft = buildTicketDraft({ template, user, summary });
      const plan = evaluateQaSingleTicketSmokePlan({
        draft: ticketDraft,
        environment,
        targetUrl,
        targetValidation,
        mappingOptions: {
          requester: user,
          contactType: "Self-service / manual paste",
          location: "Demo location / sanitized"
        },
        approvalPhrase: parsed.flags["approval-phrase"],
        language: parsed.flags.language ?? "en-US",
        templatePreset: parsed.flags["template-preset"] ?? "standard-service-desk",
        now: new Date()
      });

      return output(parsed, {
        command: "qa smoke",
        mode,
        template,
        plan,
        safety: safetyEnvelope()
      }, formatQaSmokePlan(plan));
    }

    if (namespace === "qa" && action === "autofill") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "qa autofill"));
      const template = requiredFlag(parsed, "template", "qa autofill");
      const user = requiredFlag(parsed, "user", "qa autofill");
      const summary = requiredFlag(parsed, "summary", "qa autofill");
      const environment = getServiceNowEnvironmentConfig(mode);
      const targetUrl = parsed.flags["target-url"] ?? environment.url;
      const targetValidation = validateServiceNowTargetUrl(environment, targetUrl);
      const ticketDraft = buildTicketDraft({ template, user, summary });
      const qaIsolationConfirmed = parsed.flags["qa-isolation-confirmation"] === autofillQaIsolationConfirmationPhrase;
      const dedicatedProfileConfirmed = parsed.flags["dedicated-profile-confirmation"] === dedicatedProfileConfirmationPhrase;
      const plan = buildQaTextFieldAutofillPlan({
        draft: ticketDraft,
        environment,
        targetUrl,
        targetValidation,
        approvalPhrase: parsed.flags["approval-phrase"],
        qaIsolationConfirmed,
        dedicatedProfileConfirmed
      });

      return output(parsed, {
        command: "qa autofill",
        mode,
        template,
        autofill: {
          status: plan.status,
          qaIsolationConfirmed,
          dedicatedProfileConfirmed,
          requiredQaIsolationConfirmation: autofillQaIsolationConfirmationPhrase,
          requiredDedicatedProfileConfirmation: dedicatedProfileConfirmationPhrase,
          allowedOperatorActions: plan.status === "ready-for-autofill" ? autofillAllowedOperatorActions : [],
          prohibitedOperatorActions: autofillProhibitedOperatorActions,
          blockedReason: plan.blockedReason,
          approvalPhraseAccepted: plan.status === "ready-for-autofill"
        },
        plan: sanitizeQaAutofillPlan(plan),
        safety: safetyEnvelope({
          browserProcessLaunched: false,
          browserAutomationCalled: false,
          noServiceNowWrite: true,
          noExcelWrite: true,
          noGraphWrite: true,
          productionWriteAllowed: false
        })
      }, formatQaAutofillPlan(plan));
    }

    if (namespace === "qa" && action === "autofill-fixture") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "qa autofill-fixture"));
      const template = requiredFlag(parsed, "template", "qa autofill-fixture");
      const user = requiredFlag(parsed, "user", "qa autofill-fixture");
      const summary = requiredFlag(parsed, "summary", "qa autofill-fixture");
      const environment = getServiceNowEnvironmentConfig(mode);
      const targetUrl = parsed.flags["target-url"] ?? environment.url;
      const targetValidation = validateServiceNowTargetUrl(environment, targetUrl);
      const ticketDraft = buildTicketDraft({ template, user, summary });
      const fixture = qaAutofillSelectorFixture(parsed.flags["selector-fixture"] ?? "all-found");
      const qaIsolationConfirmed = parsed.flags["qa-isolation-confirmation"] === autofillQaIsolationConfirmationPhrase;
      const dedicatedProfileConfirmed = parsed.flags["dedicated-profile-confirmation"] === dedicatedProfileConfirmationPhrase;
      const plan = buildQaTextFieldAutofillPlan({
        draft: ticketDraft,
        environment,
        targetUrl,
        targetValidation,
        approvalPhrase: parsed.flags["approval-phrase"],
        qaIsolationConfirmed,
        dedicatedProfileConfirmed,
        selectorVerification: qaAutofillSelectorVerification(fixture),
        approvalPageFingerprint: "local-fixture-reviewed-page",
        currentPageFingerprint: "local-fixture-reviewed-page",
        unexpectedRequiredFields: fixture.unexpectedRequiredFieldCount ? ["redacted-required-field"] : []
      });
      const execution = executeQaTextFieldAutofillFixture(plan, fixture);

      return output(parsed, {
        command: "qa autofill-fixture",
        mode,
        template,
        autofill: {
          status: plan.status,
          qaIsolationConfirmed,
          dedicatedProfileConfirmed,
          requiredQaIsolationConfirmation: autofillQaIsolationConfirmationPhrase,
          requiredDedicatedProfileConfirmation: dedicatedProfileConfirmationPhrase,
          allowedOperatorActions:
            plan.status === "ready-for-autofill"
              ? ["Use only the selector-verified fixture harness; no real QA page is touched by this command."]
              : [],
          prohibitedOperatorActions: autofillProhibitedOperatorActions,
          blockedReason: plan.blockedReason,
          approvalPhraseAccepted: plan.status === "ready-for-autofill"
        },
        plan: sanitizeQaAutofillPlan(plan),
        execution,
        safety: safetyEnvelope({
          browserProcessLaunched: false,
          browserAutomationCalled: false,
          noServiceNowWrite: true,
          noExcelWrite: true,
          noGraphWrite: true,
          productionWriteAllowed: false
        })
      }, formatQaAutofillFixtureResult(plan, execution.status));
    }

    if (namespace === "qa" && action === "autofill-runtime") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "qa autofill-runtime"));
      const template = requiredFlag(parsed, "template", "qa autofill-runtime");
      const user = requiredFlag(parsed, "user", "qa autofill-runtime");
      const summary = requiredFlag(parsed, "summary", "qa autofill-runtime");
      const environment = getServiceNowEnvironmentConfig(mode, runtimeTargetUrlOverride(mode, parsed.flags["target-url"]));
      const ticketDraft = buildTicketDraft({ template, user, summary });
      const qaIsolationConfirmed = parsed.flags["qa-isolation-confirmation"] === autofillQaIsolationConfirmationPhrase;
      const dedicatedProfileConfirmed = parsed.flags["dedicated-profile-confirmation"] === dedicatedProfileConfirmationPhrase;
      let driver = options.qaAutofillRuntimeDriver;
      let runtime: QaAutofillRuntimeResult | undefined;
      if (!driver && parsed.flags["cdp-endpoint"]) {
        try {
          driver = createCdpQaAutofillRuntimePageDriver({
            endpoint: parsed.flags["cdp-endpoint"]
          });
        } catch {
          runtime = blockedQaAutofillRuntimeResult("cdp-endpoint-denied", false);
        }
      }
      if (!runtime) {
        try {
          runtime = await runQaTextFieldAutofillRuntime({
            draft: ticketDraft,
            environment,
            driver,
            execute: parsed.execute,
            approvalPhrase: parsed.flags["approval-phrase"],
            approvalPageFingerprint: parsed.flags["approval-page-fingerprint"],
            qaIsolationConfirmed,
            dedicatedProfileConfirmed
          });
        } catch {
          runtime = blockedQaAutofillRuntimeResult("browser-runtime-error", Boolean(driver));
        }
      }

      return output(parsed, {
        command: "qa autofill-runtime",
        mode,
        template,
        autofillRuntime: {
          status: runtime.status,
          blockedReason: runtime.blockedReason,
          executionMode: parsed.execute ? "execute-autofill" : "verify-only",
          qaIsolationConfirmed,
          dedicatedProfileConfirmed,
          requiredQaIsolationConfirmation: autofillQaIsolationConfirmationPhrase,
          requiredDedicatedProfileConfirmation: dedicatedProfileConfirmationPhrase,
          selectorVerification: runtime.selectorVerification,
          pageFingerprint: runtime.pageFingerprint,
          pageFingerprintMatched: runtime.pageFingerprintMatched,
          filledFields: runtime.execution?.filledFields ?? [],
          stopMessage:
            runtime.status === "completed"
              ? "Autofill completed. Review manually. Tool will not Save, Submit, Update, or Close."
              : undefined
        },
        plan: runtime.plan ? sanitizeQaAutofillPlan(runtime.plan) : undefined,
        execution: runtime.execution,
        safety: safetyEnvelope({
          noExternalActionPerformed: !runtime.safety.browserAutomationCalled,
          browserAutomationCalled: runtime.safety.browserAutomationCalled,
          browserProcessLaunched: false,
          realServiceNowApiCalled: false,
          noServiceNowWrite: true,
          noExcelWrite: true,
          noGraphWrite: true,
          productionWriteAllowed: false
        })
      }, formatQaAutofillRuntimeResult(runtime.status, runtime.blockedReason, runtime.pageFingerprint));
    }

    if (namespace === "qa" && action === "manual-fill") {
      const mode = parseEnvironmentMode(requiredFlag(parsed, "mode", "qa manual-fill"));
      const writeAction = parseQaManualFillWriteAction(parsed.flags["write-action"] ?? "submit_incident");
      const template = requiredFlag(parsed, "template", "qa manual-fill");
      const user = requiredFlag(parsed, "user", "qa manual-fill");
      const summary = requiredFlag(parsed, "summary", "qa manual-fill");
      const environment = getServiceNowEnvironmentConfig(mode);
      const targetUrl = parsed.flags["target-url"] ?? environment.url;
      const targetValidation = validateServiceNowTargetUrl(environment, targetUrl);
      const ticketDraft = buildTicketDraft({ template, user, summary });
      const plan = evaluateQaSingleTicketSmokePlan({
        draft: ticketDraft,
        environment,
        targetUrl,
        targetValidation,
        mappingOptions: {
          requester: user,
          contactType: "Self-service / manual paste",
          location: "Demo location / sanitized"
        },
        writeAction,
        approvalPhrase: parsed.flags["approval-phrase"],
        language: parsed.flags.language ?? "en-US",
        templatePreset: parsed.flags["template-preset"] ?? "standard-service-desk",
        now: new Date()
      });
      const qaIsolationConfirmed = parsed.flags["qa-isolation-confirmation"] === manualFillQaIsolationConfirmationPhrase;
      const manualFillBlockedReason = qaManualFillBlockedReason(plan, qaIsolationConfirmed);
      const manualFillStatus = manualFillBlockedReason ? "blocked" : "ready-for-manual-fill";
      const browserLaunch = manualFillBlockedReason
        ? blockedQaManualFillBrowserLaunch(manualFillBlockedReason)
        : sanitizeQaManualFillBrowserLaunch(
            await createBrowserSessionService({ projectRoot: cwd }).launchNoWriteBrowser(environment, {
              targetUrlOverride: parsed.flags["target-url"],
              execute: parsed.execute,
              confirmNoWriteLaunch: parsed.confirmNoWriteLaunch,
              browserExecutablePath: parsed.flags["browser-executable"]
            })
          );

      return output(parsed, {
        command: "qa manual-fill",
        mode,
        template,
        manualFill: {
          status: manualFillStatus,
          qaIsolationConfirmed,
          requiredQaIsolationConfirmation: manualFillQaIsolationConfirmationPhrase,
          blockedReason: manualFillBlockedReason,
          allowedOperatorActions: manualFillBlockedReason ? [] : manualFillAllowedOperatorActions,
          prohibitedOperatorActions: manualFillProhibitedOperatorActions
        },
        plan: sanitizeQaManualFillPlan(plan),
        browserLaunch,
        safety: safetyEnvelope({
          noExternalActionPerformed: browserLaunch.status !== "launched",
          browserProcessLaunched: browserLaunch.status === "launched",
          browserAutomationCalled: false,
          noServiceNowWrite: true,
          noExcelWrite: true,
          noGraphWrite: true,
          productionWriteAllowed: false
        })
      }, formatQaManualFillPlan(manualFillStatus, browserLaunch.blockedReason));
    }

    if (namespace === "run") {
      const workflow = requiredFlag(parsed, "workflow", "run");
      const inputPath = requiredFlag(parsed, "input", "run");
      if (!parsed.dryRun) {
        return fail("Only --dry-run is supported for sda run in this phase. No external actions are allowed.");
      }
      const caseInput = await readCaseInput(cwd, inputPath);
      const ticketDraft = buildTicketDraft({
        template: caseInput.template ?? workflow,
        user: caseInput.user ?? "Demo User",
        summary: caseInput.summary ?? `Run ${workflow}`
      });
      return output(parsed, {
        command: "run",
        workflow,
        dryRun: true,
        input: inputPath,
        plannedActions: [
          "Capture manual-style context from input JSON",
          "Search local demo knowledge base",
          "Generate editable TicketDraft",
          "Preview mock ServiceNow form mapping",
          "Stop before any external ServiceNow action"
        ],
        ticketDraft,
        safety: safetyEnvelope()
      }, `Dry-run workflow ${workflow}: no external action performed.`);
    }

    return fail(`Unknown command: ${argv.join(" ")}\n\n${helpText()}`);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

function buildTicketDraft(input: { template: string; user: string; summary: string }): TicketDraft {
  const rawText = `${input.user}: ${input.summary}\nTemplate: ${input.template}`;
  const context: CapturedContext = manualPasteAdapter.capture({
    title: `${input.template} draft`,
    rawText
  });
  const kbMatches = searchKnowledgeArticles(input.summary, demoKnowledgeArticles, { limit: 3 });

  return generateMockTicketDraft({ context, kbMatches, profile }, { idFactory: () => "cli-demo-draft" });
}

async function readCaseInput(cwd: string, inputPath: string): Promise<CaseInput> {
  const raw = await readFile(resolve(cwd, inputPath), "utf8");
  const parsed = JSON.parse(raw) as CaseInput;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`Input file must contain a JSON object: ${inputPath}`);
  }
  return parsed;
}

function parseArgs(argv: string[]): ParsedFlags {
  const flags: Record<string, string> = {};
  const positionals: string[] = [];
  let json = false;
  let dryRun = false;
  let execute = false;
  let confirmNoWriteLaunch = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help") {
      positionals.push(token);
      continue;
    }
    if (token === "--json") {
      json = true;
      continue;
    }
    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (token === "--execute") {
      execute = true;
      continue;
    }
    if (token === "--confirm-no-write-launch") {
      confirmNoWriteLaunch = true;
      continue;
    }
    if (token.startsWith("--")) {
      const name = token.slice(2);
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for --${name}`);
      }
      flags[name] = value;
      index += 1;
      continue;
    }
    positionals.push(token);
  }

  return { json, dryRun, execute, confirmNoWriteLaunch, flags, positionals };
}

function requiredFlag(parsed: ParsedFlags, name: string, command: string): string {
  const value = parsed.flags[name];
  if (!value) {
    throw new Error(`Missing --${name}. Usage: sda ${command} ...`);
  }
  return value;
}

function parseEnvironmentMode(value: string): ServiceNowEnvironmentMode {
  const allowedModes: ServiceNowEnvironmentMode[] = ["mock", "qa", "dev", "production-shadow"];
  if (allowedModes.includes(value as ServiceNowEnvironmentMode)) {
    return value as ServiceNowEnvironmentMode;
  }
  throw new Error(`Unknown ServiceNow environment mode: ${value}`);
}

function parseQaManualFillWriteAction(value: string): QaManualFillWriteAction {
  const allowedActions: QaManualFillWriteAction[] = ["save_incident", "submit_incident", "update_incident", "close_incident"];
  if (allowedActions.includes(value as QaManualFillWriteAction)) {
    return value as QaManualFillWriteAction;
  }
  throw new Error("Unsupported QA manual-fill write action. Allowed values: save_incident, submit_incident, update_incident, close_incident.");
}

function parseRawIntakeSource(value: string): RawIntakeSource {
  const allowedSources: RawIntakeSource[] = [
    "Teams message",
    "ServiceNow Chat transcript",
    "Shared mailbox item",
    "Phone call",
    "Self-service ticket",
    "teams_web",
    "servicenow_chat",
    "outlook_web",
    "outlook_classic",
    "servicenow_self_service",
    "manual_paste"
  ];
  if (allowedSources.includes(value as RawIntakeSource)) {
    return value as RawIntakeSource;
  }
  throw new Error(`Unknown workflow intake source: ${value}`);
}

function output(parsed: ParsedFlags, payload: unknown, text: string): CliResult {
  if (parsed.json) {
    return ok(`${JSON.stringify(payload, null, 2)}\n`);
  }
  return ok(`${text}\n`);
}

function ok(stdout: string): CliResult {
  return { exitCode: 0, stdout, stderr: "" };
}

function fail(stderr: string): CliResult {
  return { exitCode: 1, stdout: "", stderr: `${stderr}\n` };
}

function safetyEnvelope(overrides: Partial<ReturnType<typeof baseSafetyEnvelope>> = {}) {
  return {
    ...baseSafetyEnvelope(),
    ...overrides
  };
}

function baseSafetyEnvelope() {
  return {
    noExternalActionPerformed: true,
    realServiceNowApiCalled: false,
    browserAutomationCalled: false,
    browserProcessLaunched: false,
    noServiceNowWrite: true,
    noExcelWrite: true,
    noGraphWrite: true,
    productionWriteAllowed: false,
    message: "Draft/preview only. The CLI does not submit, save, close, or update real ServiceNow records."
  };
}

function formatKbSearch(query: string, matches: KnowledgeMatch[]): string {
  const lines = [`KB search: ${query}`];
  for (const match of matches) {
    lines.push(`- ${match.title} (${match.score})`);
  }
  return lines.join("\n");
}

function formatTicketDraft(ticketDraft: TicketDraft): string {
  return [
    `Short description: ${ticketDraft.shortDescription.value}`,
    `Work notes: ${ticketDraft.workNotes.value}`,
    "Safety: draft/preview only; no external action performed."
  ].join("\n");
}

function formatWorkflowPreview(channel: string, csvRow: string): string {
  return [
    `Workflow preview: ServiceNow channel ${channel}`,
    `CSV row: ${csvRow}`,
    "Safety: local dry-run only; no ServiceNow, Excel, or Graph write performed."
  ].join("\n");
}

function formatBrowserPlan(status: string, browserProfileDirectory: string): string {
  return [
    `Browser session plan: ${status}`,
    `Profile directory: ${browserProfileDirectory}`,
    "Safety: no-write planning only; no ServiceNow record is modified."
  ].join("\n");
}

function formatBrowserLaunch(status: string, blockedReason?: string): string {
  return [
    `Browser no-write launch: ${status}`,
    blockedReason ? `Blocked reason: ${blockedReason}` : "Safety: manual login only; no field fill, submit, update, save, or close."
  ].join("\n");
}

function formatBrowserSmoke(status: string, blockedReason?: string): string {
  return [
    `Windows Chromium smoke: ${status}`,
    blockedReason ? `Blocked reason: ${blockedReason}` : "Safety: about:blank only; no ServiceNow URL, page inspection, or write action."
  ].join("\n");
}

function formatQaSmokePlan(plan: QaSingleTicketSmokePlan): string {
  const lines = [
    `Controlled QA single-ticket smoke: ${plan.status}`,
    `Mode: ${plan.mode}`,
    plan.targetHost ? `Target host: ${plan.targetHost}` : "Target host: not validated",
    `Required approval phrase: ${plan.requiredApprovalPhrase}`,
    `Gate decision: ${plan.gateDecision.reason}`
  ];

  if (plan.missingRequiredFields.length > 0) {
    lines.push(`Missing required mappings: ${plan.missingRequiredFields.join(", ")}`);
  }

  lines.push(
    plan.status === "ready-for-manual-fill"
      ? "Ready for manual fill only. No ticket was created, saved, submitted, updated, closed, or written through ServiceNow API."
      : "Blocked. No ticket was created, saved, submitted, updated, closed, or written through ServiceNow API."
  );

  return lines.join("\n");
}

function sanitizeQaAutofillPlan(plan: QaAutofillPlan): QaAutofillPlan {
  return {
    ...plan,
    target: {
      allowlisted: plan.target.allowlisted,
      hostRedacted: true
    },
    operations: plan.operations.map((operation) => ({
      ...operation,
      value: "sanitized-draft-value",
      selectors: operation.selectors.map(() => "approved-text-field-selector")
    })),
    allowedFields: plan.allowedFields.map((field) => ({
      ...field,
      value: "sanitized-draft-value",
      selectors: field.selectors.map(() => "approved-text-field-selector")
    }))
  };
}

function blockedQaAutofillRuntimeResult(
  blockedReason: NonNullable<QaAutofillRuntimeResult["blockedReason"]>,
  browserAutomationCalled: boolean
): QaAutofillRuntimeResult {
  return {
    status: "blocked",
    blockedReason,
    pageFingerprintMatched: false,
    safety: {
      browserProcessLaunched: false,
      browserAutomationCalled,
      realServiceNowApiCalled: false,
      noServiceNowWrite: true,
      noSaveSubmitUpdateClose: true,
      artifactsCaptured: false,
      productionWriteAllowed: false
    }
  };
}

function runtimeTargetUrlOverride(
  mode: ServiceNowEnvironmentMode,
  targetUrl: string | undefined
): ServiceNowEnvironmentUrlOverrides {
  if (!targetUrl || mode === "mock") return {};
  return { [mode]: targetUrl } as ServiceNowEnvironmentUrlOverrides;
}

function qaAutofillSelectorFixture(name: string): QaAutofillFixturePage {
  const allFound: QaAutofillFixturePage = {
    fields: [
      { key: "shortDescription", matchedSelectorCount: 1, elementType: "text", writable: true },
      { key: "description", matchedSelectorCount: 1, elementType: "textarea", writable: true },
      { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: true }
    ],
    unexpectedRequiredFieldCount: 0
  };

  if (name === "all-found") {
    return allFound;
  }
  if (name === "missing-work-notes") {
    return {
      ...allFound,
      fields: allFound.fields.map((field) =>
        field.key === "workNotes" ? { ...field, matchedSelectorCount: 0 } : field
      )
    };
  }
  if (name === "unexpected-required-field") {
    return {
      ...allFound,
      unexpectedRequiredFieldCount: 1
    };
  }
  if (name === "wrong-description-type") {
    return {
      ...allFound,
      fields: allFound.fields.map((field) =>
        field.key === "description" ? { ...field, elementType: "select" } : field
      )
    };
  }
  if (name === "ambiguous-description") {
    return {
      ...allFound,
      fields: allFound.fields.map((field) =>
        field.key === "description" ? { ...field, matchedSelectorCount: 2 } : field
      )
    };
  }
  if (name === "non-writable-work-notes") {
    return {
      ...allFound,
      fields: allFound.fields.map((field) => (field.key === "workNotes" ? { ...field, writable: false } : field))
    };
  }

  return {
    fields: [],
    unexpectedRequiredFieldCount: 1
  };
}

function qaAutofillSelectorVerification(fixture: QaAutofillFixturePage): QaAutofillSelectorVerification {
  const expectedElementTypes: Record<keyof QaAutofillSelectorVerification, "text" | "textarea"> = {
    shortDescription: "text",
    description: "textarea",
    workNotes: "textarea"
  };
  const statusFor = (key: keyof QaAutofillSelectorVerification) => {
    const matches = fixture.fields.filter((candidate) => candidate.key === key);
    if (matches.length > 1) return "ambiguous";
    const field = matches[0];
    return field?.matchedSelectorCount === 1 &&
      field.writable &&
      field.elementType === expectedElementTypes[key]
      ? "found"
      : "missing";
  };

  return {
    shortDescription: statusFor("shortDescription"),
    description: statusFor("description"),
    workNotes: statusFor("workNotes")
  };
}

function formatQaAutofillFixtureResult(plan: QaAutofillPlan, executionStatus: "completed" | "blocked"): string {
  return [
    `QA selector-verified autofill fixture harness: ${executionStatus}`,
    plan.blockedReason ? `Blocked reason: ${plan.blockedReason}` : "Fixture harness filled sanitized local fields only.",
    "Safety: no browser launch, no real QA page, no Save, Submit, Update, Close, ServiceNow API, artifact capture, or bulk action."
  ].join("\n");
}

function formatQaAutofillRuntimeResult(status: string, blockedReason?: string, pageFingerprint?: string): string {
  const lines = [`QA runtime text-field autofill: ${status}`];
  if (blockedReason) {
    lines.push(`Blocked reason: ${blockedReason}`);
  }
  if (status === "verified" && pageFingerprint) {
    lines.push(`Reviewed page fingerprint: ${pageFingerprint}`);
    lines.push("Re-run with --execute and --approval-page-fingerprint after manual review and exact approval phrase.");
  }
  if (status === "completed") {
    lines.push("Autofill completed. Review manually. Tool will not Save, Submit, Update, or Close.");
  }
  lines.push("Safety: runtime selector verification/autofill only; no Save, Submit, Update, Close, ServiceNow API, browser artifact capture, or bulk action.");
  return lines.join("\n");
}

function formatQaAutofillPlan(plan: QaAutofillPlan): string {
  return [
    `QA browser-assisted text-field autofill planning gate: ${plan.status}`,
    plan.blockedReason
      ? `Blocked reason: ${plan.blockedReason}`
      : "Selector-verified plan ready; this CLI still does not launch a browser or fill a page.",
    "Safety: planning/review only here; no Save, Submit, Update, Close, ServiceNow API, browser artifacts, or bulk action."
  ].join("\n");
}

function qaManualFillBlockedReason(plan: QaSingleTicketSmokePlan, qaIsolationConfirmed: boolean): string | undefined {
  if (plan.status !== "ready-for-manual-fill") {
    return `QA manual-fill plan is blocked: ${manualFillSafeBlockReason(plan)}.`;
  }
  if (!qaIsolationConfirmed) {
    return "QA isolation confirmation is required before preparing a QA manual-fill browser session.";
  }
  return undefined;
}

function manualFillSafeBlockReason(plan: QaSingleTicketSmokePlan): string {
  if (plan.missingRequiredFields.length > 0) {
    return "missing-required-field-mappings";
  }

  switch (plan.gateDecision.reason) {
    case "mock-write-denied":
      return "mock-mode-has-no-service-now-target";
    case "production-shadow-write-denied":
      return "production-shadow-mode-denied";
    case "target-url-not-https":
    case "target-url-credentials-denied":
    case "target-not-allowlisted":
    case "target-validation-host-mismatch":
    case "invalid-target-url":
      return "target-validation-denied";
    case "explicit-approval-required":
    case "approval-operator-mismatch":
    case "approval-mode-mismatch":
    case "approval-action-mismatch":
    case "approval-target-host-mismatch":
    case "approval-phrase-mismatch":
      return "qa-dev-readiness-approval-required";
    case "environment-real-submit-disabled":
      return "environment-mode-denied";
    case "approved-for-qa-dev-write":
      return "manual-fill-readiness-blocked";
  }
}

function sanitizeQaManualFillPlan(plan: QaSingleTicketSmokePlan) {
  const {
    targetHost: _targetHost,
    gateDecision: _gateDecision,
    requiredApprovalPhrase: _requiredApprovalPhrase,
    writeActionApprovalPhrases: _writeActionApprovalPhrases,
    stopRules: _stopRules,
    ...manualFillPlan
  } = plan;

  return {
    ...manualFillPlan,
    targetHost: undefined,
    gateDecision: undefined,
    requiredApprovalPhrase: undefined,
    writeActionApprovalPhrases: undefined,
    stopRules: [
      "Stop before every Save/Submit/Update/Close; this command never authorizes write actions.",
      "Stop if any real user, real ticket text, real ticket number, credential, cookie, session, screenshot, or recording detail appears.",
      "Stop if QA isolation is not explicitly confirmed.",
      "Stop if browser DOM autofill, ServiceNow API, bulk create, attachment upload, email send, or automated close/update appears."
    ],
    manualFillGate: {
      requestedWriteAction: plan.requestedWriteAction,
      writeActionsEnabled: false,
      serviceNowWriteApproved: false,
      sourceGateReason: "manual-fill-gate-redacted"
    }
  };
}

function blockedQaManualFillBrowserLaunch(blockedReason: string) {
  return {
    status: "blocked" as const,
    blockedReason,
    commandPreview: undefined,
    target: undefined,
    safety: noWriteBrowserSafety(),
    auditNotes: [blockedReason]
  };
}

function sanitizeQaManualFillBrowserLaunch(launch: BrowserNoWriteLaunchResult) {
  return {
    status: launch.status,
    blockedReason: launch.blockedReason,
    commandPreview: undefined,
    process: launch.process,
    target: launch.commandPreview
      ? {
          allowlisted: true,
          hostRedacted: true,
          path: launch.commandPreview.targetPath
        }
      : undefined,
    profile: {
      underIgnoredLocalRuntimeDirectory: launch.plan.browserProfileDirectory.includes(".local/servicenow-browser-profiles"),
      gitIgnorePattern: launch.plan.gitIgnorePattern
    },
    safety: launch.safety,
    auditNotes: launch.auditNotes
  };
}

function noWriteBrowserSafety(): BrowserNoWriteLaunchSafety {
  return {
    noWriteMode: true,
    formAutomationAllowed: false,
    fieldFillAllowed: false,
    realServiceNowApiCalled: false,
    realSubmitAllowed: false,
    writeOperationsAllowed: false,
    realActionGateRequiredForWrites: true
  };
}

function formatQaManualFillPlan(status: string, blockedReason?: string): string {
  return [
    `Controlled QA manual-fill rehearsal: ${status}`,
    blockedReason
      ? `Blocked reason: ${blockedReason}`
      : "Ready for manual browser launch and hand-filled field rehearsal only.",
    "Safety: no DOM autofill, no ServiceNow API, no Save, Submit, Update, Close, upload, email, or bulk action."
  ].join("\n");
}

function draftFieldValue(field: FieldDraft | undefined): string {
  return field?.value ?? "Not set";
}

function helpText(): string {
  return `Usage: sda <command> [options]

Minimal headless CLI for ServiceNow Automation demo workflows.

Commands:
  sda kb search <query> [--json]
  sda ticket draft --template <template> --user <user> --summary <summary> [--json]
  sda notes generate --template <template> --input <json_file> [--json]
  sda browser plan --mode <mock|qa|dev|production-shadow> [--target-url <url>] [--json]
  sda browser launch --mode <qa|dev> [--target-url <url>] [--browser-executable <path>] [--execute --confirm-no-write-launch] [--json]
  sda browser smoke [--target about:blank] [--browser-executable <path>] [--profile-root <path>] [--execute --confirm-no-write-launch] [--json]
  sda browser reset --mode <mock|qa|dev|production-shadow> [--json]
  sda workflow preview --template <template> --user <sanitized_user> --summary <sanitized_summary> --source <source> --dry-run [--json]
  sda qa smoke --mode <qa|dev|mock|production-shadow> --template <template> --user <sanitized_user> --summary <sanitized_summary> [--target-url <url>] [--approval-phrase <phrase>] [--language <lang>] [--template-preset <preset>] [--json]
  sda qa autofill --mode <qa|dev|mock|production-shadow> --template <template> --user <sanitized_user> --summary <sanitized_summary> --qa-isolation-confirmation <sentence> --dedicated-profile-confirmation <sentence> --approval-phrase <phrase> [--target-url <url>] [--json]
  sda qa autofill-fixture --mode <qa|dev|mock|production-shadow> --template <template> --user <sanitized_user> --summary <sanitized_summary> --qa-isolation-confirmation <sentence> --dedicated-profile-confirmation <sentence> --approval-phrase <phrase> [--selector-fixture <all-found|missing-work-notes|wrong-description-type|ambiguous-description|non-writable-work-notes|unexpected-required-field>] [--target-url <url>] [--json]
  sda qa autofill-runtime --mode <qa|dev> --template <template> --user <sanitized_user> --summary <sanitized_summary> --cdp-endpoint <local_http_or_ws> --qa-isolation-confirmation <sentence> --dedicated-profile-confirmation <sentence> [--target-url <safe_landing_url>] [--approval-phrase <phrase> --approval-page-fingerprint <hash> --execute] [--json]
  sda qa manual-fill --mode <qa|dev|mock|production-shadow> --template <template> --user <sanitized_user> --summary <sanitized_summary> --qa-isolation-confirmation <sentence> [--write-action <save_incident|submit_incident|update_incident|close_incident>] [--target-url <url>] [--approval-phrase <phrase>] [--browser-executable <path>] [--execute --confirm-no-write-launch] [--json]
  sda run --workflow <workflow_name> --input <json_file> --dry-run [--json]

Safety:
  Draft/preview only by default. No real ServiceNow API calls, browser DOM automation, submit, update, save, close, upload, or email actions are performed.
`;
}
