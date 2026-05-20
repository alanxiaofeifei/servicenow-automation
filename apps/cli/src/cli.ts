import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createBrowserSessionService, ManualPasteAdapter } from "@servicenow-automation/adapters";
import { generateMockTicketDraft } from "@servicenow-automation/ai";
import { demoKnowledgeArticles, searchKnowledgeArticles } from "@servicenow-automation/kb/browser";
import {
  getServiceNowEnvironmentConfig,
  loadDemoYageoProfile,
  validateServiceNowTargetUrl,
  type ServiceNowEnvironmentMode
} from "@servicenow-automation/profiles";
import {
  evaluateQaSingleTicketSmokePlan,
  type CapturedContext,
  type KnowledgeMatch,
  type QaSingleTicketSmokePlan,
  type TicketDraft
} from "@servicenow-automation/core";

export type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type RunCliOptions = {
  cwd?: string;
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

const profile = loadDemoYageoProfile();
const manualPasteAdapter = new ManualPasteAdapter({
  idFactory: () => "cli-demo-context",
  now: () => new Date("2026-05-18T12:00:00.000Z")
});

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
  sda qa smoke --mode <qa|dev|mock|production-shadow> --template <template> --user <sanitized_user> --summary <sanitized_summary> [--target-url <url>] [--approval-phrase <phrase>] [--language <lang>] [--template-preset <preset>] [--json]
  sda run --workflow <workflow_name> --input <json_file> --dry-run [--json]

Safety:
  Draft/preview only by default. No real ServiceNow API calls, browser DOM automation, submit, update, save, close, upload, or email actions are performed.
`;
}
