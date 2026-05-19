import {
  TicketDraftSchema,
  normalizeSourceContextText,
  type FieldDraft,
  type ProjectProfile,
  type TicketDraft
} from "@servicenow-automation/core";

import type { AIProvider, GenerateTicketDraftInput } from "./types";

type ScenarioKind = "vpn" | "windows" | "account" | "generic";

export type MockAIProviderOptions = {
  idFactory?: () => string;
};

export class MockAIProvider implements AIProvider {
  readonly id = "mock-ai-provider";
  readonly displayName = "Deterministic Mock AI Provider";
  private readonly idFactory: () => string;

  constructor(options: MockAIProviderOptions = {}) {
    this.idFactory = options.idFactory ?? createDraftId;
  }

  async generateTicketDraft(input: GenerateTicketDraftInput): Promise<TicketDraft> {
    return generateMockTicketDraft(input, { idFactory: this.idFactory });
  }
}

export function generateMockTicketDraft(
  input: GenerateTicketDraftInput,
  options: MockAIProviderOptions = {}
): TicketDraft {
  const idFactory = options.idFactory ?? createDraftId;
  const sourceCleanup = normalizeSourceContextText({
    sourceType: input.context.sourceType,
    rawText: input.context.rawText
  });
  const supportContext = sourceCleanup.normalizedText;
  const scenario = detectScenario(supportContext);
  const category = selectCategory(input.profile, supportContext, scenario);
  const assignmentGroup = selectAssignmentGroup(input.profile, supportContext, scenario);
  const draft = {
    id: idFactory(),
    sourceContextId: input.context.id,
    ticketType: "incident",
    shortDescription: field(shortDescriptionFor(scenario, supportContext), 0.86, "Generated from normalized source context."),
    description: field(descriptionFor(scenario, supportContext), 0.82, "Summarized from cleaned source context."),
    workNotes: field(workNotesFor(scenario, input.kbMatches, supportContext), 0.78, "Combines cleaned source context with deterministic scenario routing and KB matches."),
    category: category ? field(category.category, 0.9, `Matched keywords: ${category.keywords.join(", ")}`) : undefined,
    subcategory: category?.subcategory ? field(category.subcategory, 0.88, `Matched keywords: ${category.keywords.join(", ")}`) : undefined,
    assignmentGroup: field(assignmentGroup, 0.84, "Selected from project profile mappings or default assignment group."),
    impact: field("3 - Low", 0.7, "Default demo incident impact; human review required."),
    urgency: field("3 - Low", 0.7, "Default demo incident urgency; human review required."),
    priority: field("4 - Low", 0.7, "Derived from demo impact/urgency defaults."),
    kbMatches: input.kbMatches,
    riskFlags: [
      "Human review required before any ServiceNow action.",
      "Demo draft only; do not auto-submit or auto-close production tickets."
    ],
    missingInfoQuestions: missingInfoFor(scenario)
  } satisfies TicketDraft;

  return TicketDraftSchema.parse(draft);
}

function detectScenario(text: string): ScenarioKind {
  const lower = text.toLowerCase();
  if (containsAny(lower, ["vpn", "remote access", "tunnel", "mfa prompt"])) {
    return "vpn";
  }
  if (containsAny(lower, ["windows", "laptop", "bsod", "blue screen", "slow", "update"])) {
    return "windows";
  }
  if (containsAny(lower, ["login", "password", "mfa", "locked", "authentication", "access denied"])) {
    return "account";
  }
  return "generic";
}

function shortDescriptionFor(scenario: ScenarioKind, rawText: string): string {
  switch (scenario) {
    case "vpn":
      return "VPN connection issue after password or MFA change";
    case "windows":
      return "Windows endpoint performance issue";
    case "account":
      return "Account/login issue requiring access troubleshooting";
    default:
      return `Service desk issue: ${rawText.slice(0, 80)}`;
  }
}

function descriptionFor(scenario: ScenarioKind, rawText: string): string {
  const normalized = rawText.trim();
  switch (scenario) {
    case "vpn":
      return `User reports a VPN connectivity problem. Captured context: ${normalized}`;
    case "windows":
      return `User reports a Windows endpoint issue. Captured context: ${normalized}`;
    case "account":
      return `User reports an account or login issue. Captured context: ${normalized}`;
    default:
      return `User reports a service desk issue. Captured context: ${normalized}`;
  }
}

function workNotesFor(scenario: ScenarioKind, kbMatches: GenerateTicketDraftInput["kbMatches"], supportContext: string): string {
  const kbLine = kbMatches.length > 0
    ? `Relevant KB: ${kbMatches.map((match) => match.title).join("; ")}.`
    : "No KB match selected yet.";
  const sourceLine = `Normalized source context reviewed: ${excerpt(supportContext)}.`;
  switch (scenario) {
    case "vpn":
      return `Initial triage: confirm internet without VPN, recent password/MFA change, VPN client error message, and failure time. ${sourceLine} ${kbLine}`;
    case "windows":
      return `Initial triage: confirm when slowness started, whether reboot was attempted, and whether issue affects one app or the whole device. ${sourceLine} ${kbLine}`;
    case "account":
      return `Initial triage: confirm whether issue is password, MFA, account lock, or application access denied. Do not request password. ${sourceLine} ${kbLine}`;
    default:
      return `Initial triage: collect exact symptom, start time, affected service, and any visible error message. ${sourceLine} ${kbLine}`;
  }
}

function excerpt(text: string): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length <= 220 ? singleLine : `${singleLine.slice(0, 217).trim()}...`;
}

function missingInfoFor(scenario: ScenarioKind): string[] {
  switch (scenario) {
    case "vpn":
      return [
        "Does internet access work without VPN?",
        "Was the password or MFA method changed recently?",
        "What exact VPN error message is visible?"
      ];
    case "windows":
      return [
        "When did the Windows issue start?",
        "Does it affect the whole device or only one application?",
        "Has a reboot or power cycle already been attempted?"
      ];
    case "account":
      return [
        "Is the issue password, MFA, account lock, or application-specific access denied?",
        "Can the user access other standard services?",
        "Was the password changed recently?"
      ];
    default:
      return ["What is the exact error message?", "When did the issue start?", "Which service or device is affected?"];
  }
}

function selectCategory(profile: ProjectProfile, rawText: string, scenario: ScenarioKind): ProjectProfile["categoryMappings"][number] | undefined {
  const lower = scenarioKeywordText(scenario, rawText);
  return profile.categoryMappings.find((mapping) => mapping.keywords.some((keyword) => lower.includes(keyword.toLowerCase())));
}

function selectAssignmentGroup(profile: ProjectProfile, rawText: string, scenario: ScenarioKind): string {
  const lower = scenarioKeywordText(scenario, rawText);
  return profile.assignmentMappings.find((mapping) => mapping.keywords.some((keyword) => lower.includes(keyword.toLowerCase())))?.assignmentGroup
    ?? profile.defaultAssignmentGroup;
}

function scenarioKeywordText(scenario: ScenarioKind, rawText: string): string {
  return `${scenario} ${rawText}`.toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function field(value: string, confidence: number, evidence: string): FieldDraft {
  return { value, confidence, evidence, editable: true };
}

function createDraftId(): string {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
