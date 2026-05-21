import type { SourceType, TicketDraft } from "./models";

export type RawIntakeSource =
  | "Teams message"
  | "ServiceNow Chat transcript"
  | "Shared mailbox item"
  | "Phone call"
  | "Self-service ticket"
  | SourceType;

export type ServiceNowChannel = "Chat" | "Email" | "Phone" | "Self-service";

export type ContactConfirmationState = {
  status: "Confirmed" | "Needs confirmation" | "Pending requester";
  summary: string;
};

export type EvidenceReviewState = {
  evidenceType: "none" | "screenshot" | "document" | "table";
  reviewState: "not reviewed" | "reviewed" | "needs manual check";
  extractedFacts: string[];
  safetyLabel: "No file upload, OCR, or external AI";
};

export type RoutingPlan = {
  stage1: {
    label: "Stage 1 - Service Desk Handling";
    ownerTeam: string;
    status: "New";
    action: string;
  };
  stage2: {
    label: "Stage 2 - Final Assignment";
    assignmentGroup: string;
    reason: string;
  };
};

export type WorkNotesPlan = {
  summary: string;
  warning: string;
  plannedNotes: string;
};

export const excelDryRunRowColumns = [
  "Created At",
  "Intake Source",
  "ServiceNow Channel",
  "Requester Display",
  "Language / SD Team",
  "Service Desk Owner / Initial Group",
  "Issue Type",
  "Category",
  "Subcategory",
  "Priority",
  "Short Description",
  "Final Assignment Group",
  "Work Notes Summary",
  "Handling Status",
  "Confirmation State",
  "Evidence Review State",
  "Fake Scenario ID",
  "Required Field Check",
  "Approval Phrase Gate",
  "Stop Rule Check",
  "QA Isolation Check",
  "QA Dry-run Outcome",
  "QA Trial Result",
  "Dry-run Result"
] as const;

export type ExcelDryRunRowColumn = (typeof excelDryRunRowColumns)[number];

export type ExcelDryRunRow = Record<ExcelDryRunRowColumn, string>;

export type ExcelDryRunRowPreview = {
  row: ExcelDryRunRow;
  csvRow: string;
  markdownSummary: string;
  safetyCopy: string;
};

export type ServiceDeskWorkflowPreviewInput = {
  createdAt: string;
  rawIntakeSource: RawIntakeSource;
  requesterDisplay: string;
  languageOrServiceDeskTeam: string;
  issueType: string;
  draft: TicketDraft;
  serviceDeskOwnerTeam: string;
  finalAssignmentGroup?: string;
  finalAssignmentReason?: string;
  handlingStatus?: string;
  confirmationState?: ContactConfirmationState;
  evidenceReviewState?: EvidenceReviewState;
  fakeScenarioId?: string;
  requiredFieldCheck?: string;
  approvalPhraseGate?: string;
  stopRuleCheck?: string;
  qaIsolationCheck?: string;
  qaDryRunOutcome?: string;
  qaTrialResult?: string;
};

export type ExcelDryRunRowPreviewInput = {
  createdAt: string;
  rawIntakeSource: RawIntakeSource;
  requesterDisplay: string;
  languageOrServiceDeskTeam: string;
  issueType: string;
  draft: TicketDraft;
  serviceDeskOwnerTeam: string;
  finalAssignmentGroup: string;
  workNotesSummary: string;
  handlingStatus: string;
  confirmationState: ContactConfirmationState;
  evidenceReviewState: EvidenceReviewState;
  fakeScenarioId?: string;
  requiredFieldCheck?: string;
  approvalPhraseGate?: string;
  stopRuleCheck?: string;
  qaIsolationCheck?: string;
  qaDryRunOutcome?: string;
  qaTrialResult: string;
};

export type ServiceDeskWorkflowPreview = {
  workflowStages: string[];
  rawIntakeSource: RawIntakeSource;
  mappedServiceNowChannel: ServiceNowChannel;
  confirmationState: ContactConfirmationState;
  evidenceReviewState: EvidenceReviewState;
  incidentDraftMapping: {
    category: string;
    subcategory: string;
    priority: string;
    shortDescription: string;
  };
  routingPlan: RoutingPlan;
  workNotesPlan: WorkNotesPlan;
  excelDryRunRowPreview: ExcelDryRunRowPreview;
  csvRow: string;
  markdownSummary: string;
  safety: {
    noExternalActionPerformed: true;
    noServiceNowWrite: true;
    noExcelWrite: true;
    noGraphWrite: true;
    message: string;
  };
};

export function mapIntakeSourceToServiceNowChannel(source: RawIntakeSource): ServiceNowChannel {
  switch (source) {
    case "Teams message":
    case "ServiceNow Chat transcript":
    case "teams_web":
    case "servicenow_chat":
      return "Chat";
    case "Shared mailbox item":
    case "outlook_web":
    case "outlook_classic":
      return "Email";
    case "Phone call":
      return "Phone";
    case "Self-service ticket":
    case "servicenow_self_service":
    case "manual_paste":
      return "Self-service";
  }
}

export function buildExcelDryRunRowPreview(input: ExcelDryRunRowPreviewInput): ExcelDryRunRowPreview {
  const row: ExcelDryRunRow = {
    "Created At": input.createdAt,
    "Intake Source": input.rawIntakeSource,
    "ServiceNow Channel": mapIntakeSourceToServiceNowChannel(input.rawIntakeSource),
    "Requester Display": input.requesterDisplay,
    "Language / SD Team": input.languageOrServiceDeskTeam,
    "Service Desk Owner / Initial Group": input.serviceDeskOwnerTeam,
    "Issue Type": input.issueType,
    Category: draftFieldValue(input.draft.category),
    Subcategory: draftFieldValue(input.draft.subcategory),
    Priority: draftFieldValue(input.draft.priority),
    "Short Description": input.draft.shortDescription.value,
    "Final Assignment Group": input.finalAssignmentGroup,
    "Work Notes Summary": input.workNotesSummary,
    "Handling Status": input.handlingStatus,
    "Confirmation State": input.confirmationState.status,
    "Evidence Review State": `${input.evidenceReviewState.reviewState} (${input.evidenceReviewState.evidenceType})`,
    "Fake Scenario ID": input.fakeScenarioId ?? "not specified - fake/sanitized only",
    "Required Field Check": input.requiredFieldCheck ?? defaultRequiredFieldCheck(),
    "Approval Phrase Gate": input.approvalPhraseGate ?? defaultApprovalPhraseGate(),
    "Stop Rule Check": input.stopRuleCheck ?? defaultStopRuleCheck(),
    "QA Isolation Check": input.qaIsolationCheck ?? "Pending explicit QA isolation confirmation before field trial.",
    "QA Dry-run Outcome": input.qaDryRunOutcome ?? "Not ready for QA write; dry-run preview only.",
    "QA Trial Result": input.qaTrialResult,
    "Dry-run Result": "Preview only - no Excel workbook is connected or written."
  };

  return {
    row,
    csvRow: buildCsvRow(row),
    markdownSummary: buildExcelRowMarkdownSummary(row),
    safetyCopy: "This row is generated locally from the reviewed draft. No workbook is connected or written."
  };
}

export function buildServiceDeskWorkflowPreview(
  input: ServiceDeskWorkflowPreviewInput
): ServiceDeskWorkflowPreview {
  const finalAssignmentGroup = input.finalAssignmentGroup ?? draftFieldValue(input.draft.assignmentGroup);
  const workNotesPlan = buildWorkNotesPlan(input.draft);
  const confirmationState = input.confirmationState ?? defaultConfirmationState();
  const evidenceReviewState = input.evidenceReviewState ?? defaultEvidenceReviewState();
  const excelDryRunRowPreview = buildExcelDryRunRowPreview({
    createdAt: input.createdAt,
    rawIntakeSource: input.rawIntakeSource,
    requesterDisplay: input.requesterDisplay,
    languageOrServiceDeskTeam: input.languageOrServiceDeskTeam,
    issueType: input.issueType,
    draft: input.draft,
    serviceDeskOwnerTeam: input.serviceDeskOwnerTeam,
    finalAssignmentGroup,
    workNotesSummary: workNotesPlan.summary,
    handlingStatus: input.handlingStatus ?? "New",
    confirmationState,
    evidenceReviewState,
    fakeScenarioId: input.fakeScenarioId,
    requiredFieldCheck: input.requiredFieldCheck,
    approvalPhraseGate: input.approvalPhraseGate,
    stopRuleCheck: input.stopRuleCheck,
    qaIsolationCheck: input.qaIsolationCheck,
    qaDryRunOutcome: input.qaDryRunOutcome,
    qaTrialResult: input.qaTrialResult ?? "Not run - dry-run only."
  });
  const routingPlan: RoutingPlan = {
    stage1: {
      label: "Stage 1 - Service Desk Handling",
      ownerTeam: input.serviceDeskOwnerTeam,
      status: "New",
      action: "Local review, normalize draft fields, and prepare internal Work Notes. No Save is executed."
    },
    stage2: {
      label: "Stage 2 - Final Assignment",
      assignmentGroup: finalAssignmentGroup,
      reason: input.finalAssignmentReason ?? "Assignment group is derived from local sanitized draft mapping."
    }
  };
  const preview: Omit<ServiceDeskWorkflowPreview, "markdownSummary"> = {
    workflowStages: [
      "Intake received",
      "Contact / confirmation",
      "Incident draft prepared",
      "Service Desk ownership / team handling",
      "Final support group routing",
      "Work Notes plan",
      "Excel dry-run row"
    ],
    rawIntakeSource: input.rawIntakeSource,
    mappedServiceNowChannel: mapIntakeSourceToServiceNowChannel(input.rawIntakeSource),
    confirmationState,
    evidenceReviewState,
    incidentDraftMapping: {
      category: draftFieldValue(input.draft.category),
      subcategory: draftFieldValue(input.draft.subcategory),
      priority: draftFieldValue(input.draft.priority),
      shortDescription: input.draft.shortDescription.value
    },
    routingPlan,
    workNotesPlan,
    excelDryRunRowPreview,
    csvRow: excelDryRunRowPreview.csvRow,
    safety: {
      noExternalActionPerformed: true,
      noServiceNowWrite: true,
      noExcelWrite: true,
      noGraphWrite: true,
      message:
        "Local deterministic preview only. No real ServiceNow, Excel workbook, Graph, browser, API, mailbox, Teams, or portal write is performed."
    }
  };

  return {
    ...preview,
    markdownSummary: buildWorkflowMarkdownSummary(preview)
  };
}

function defaultConfirmationState(): ContactConfirmationState {
  return {
    status: "Needs confirmation",
    summary: "Confirm requester identity, impact, urgency, and any missing troubleshooting facts."
  };
}

function defaultEvidenceReviewState(): EvidenceReviewState {
  return {
    evidenceType: "none",
    reviewState: "not reviewed",
    extractedFacts: ["No evidence artifact is required for this local preview."],
    safetyLabel: "No file upload, OCR, or external AI"
  };
}

function defaultRequiredFieldCheck(): string {
  return "Pending manual review of required fields: requester, channel, category, subcategory, location, impact, urgency, assignment group, short description, description, and work notes.";
}

function defaultApprovalPhraseGate(): string {
  return "Separate exact Alan approval phrase is required before each real Save, Submit, Update, or Close action.";
}

function defaultStopRuleCheck(): string {
  return "Stop on production mode, real customer data, notification/escalation risk, missing QA isolation, unexpected ServiceNow workflow, DOM autofill, API use, or bulk path.";
}

export function buildCsvRow(row: ExcelDryRunRow): string {
  return excelDryRunRowColumns.map((column) => csvEscape(row[column])).join(",");
}

function buildWorkNotesPlan(draft: TicketDraft): WorkNotesPlan {
  return {
    summary: summarizeSingleLine(draft.workNotes.value),
    warning: "Save is a real write action and is not executed in this demo.",
    plannedNotes: draft.workNotes.value
  };
}

function buildExcelRowMarkdownSummary(row: ExcelDryRunRow): string {
  return [
    "## Excel Dry-run Row Preview",
    "",
    ...excelDryRunRowColumns.map((column) => `- ${column}: ${row[column]}`)
  ].join("\n");
}

function buildWorkflowMarkdownSummary(preview: Omit<ServiceDeskWorkflowPreview, "markdownSummary">): string {
  return [
    "# Service Desk Workflow Preview",
    "",
    "## Workflow Stage",
    ...preview.workflowStages.map((stage, index) => `${index + 1}. ${stage}`),
    "",
    "## Intake",
    `- Raw Intake Source: ${preview.rawIntakeSource}`,
    `- ServiceNow Channel: ${preview.mappedServiceNowChannel}`,
    "",
    "## Routing Plan",
    `- Stage 1 - Service Desk Handling: ${preview.routingPlan.stage1.ownerTeam}; ${preview.routingPlan.stage1.status}; ${preview.routingPlan.stage1.action}`,
    `- Stage 2 - Final Assignment: ${preview.routingPlan.stage2.assignmentGroup}; ${preview.routingPlan.stage2.reason}`,
    "",
    "## Work Notes Plan",
    `- ${preview.workNotesPlan.summary}`,
    `- ${preview.workNotesPlan.warning}`,
    "",
    preview.excelDryRunRowPreview.markdownSummary,
    "",
    "## Safety",
    `- ${preview.safety.message}`
  ].join("\n");
}

function draftFieldValue(field: TicketDraft[keyof TicketDraft] | undefined): string {
  if (typeof field === "object" && field !== null && "value" in field && typeof field.value === "string") {
    return field.value;
  }
  return "Not set";
}

function summarizeSingleLine(value: string): string {
  const singleLine = value.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 180) {
    return singleLine;
  }
  return `${singleLine.slice(0, 177).trim()}...`;
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
