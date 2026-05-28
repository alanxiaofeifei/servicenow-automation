import {
  authorizeRealAction,
  getRequiredRealActionApprovalPhrase,
  type RealActionDecision,
  type RealActionEnvironment,
  type RealActionMode,
  type RealActionType,
  type RealActionTargetValidation
} from "./real-action-gate";
import type { FieldDraft, TicketDraft } from "./models";

export type IncidentFieldMappingKey =
  | "requester"
  | "contactType"
  | "category"
  | "subcategory"
  | "location"
  | "impact"
  | "urgency"
  | "assignmentGroup"
  | "shortDescription"
  | "description"
  | "workNotes";

export type IncidentFieldMapping = {
  key: IncidentFieldMappingKey;
  label: string;
  value: string;
  required: true;
  source: "ticket-draft" | "sanitized-context";
};

export type IncidentFieldMappingPreviewOptions = {
  requester?: string;
  contactType?: string;
  location?: string;
};

export type IncidentFieldMappingPreview = {
  fieldMappings: IncidentFieldMapping[];
  missingRequiredFields: IncidentFieldMappingKey[];
};

export type QaSingleTicketSmokeSafetyFlags = {
  singleTicketOnly: true;
  manualFillOnly: true;
  noBrowserAutomation: true;
  noServiceNowApi: true;
  noAutoSubmit: true;
  noBulkCreate: true;
  noExternalActionPerformed: true;
  productionWriteAllowed: false;
};

export type QaSingleTicketSmokeAuditPreview = {
  timestamp: string;
  mode: RealActionMode;
  language: string;
  templatePreset: string;
  actionState: "blocked" | "ready-for-manual-fill";
};

export type QaSingleTicketSmokePlanStatus = "blocked" | "ready-for-manual-fill";

export type QaManualFillWriteAction = Extract<
  RealActionType,
  "save_incident" | "submit_incident" | "update_incident" | "resolve_incident" | "close_incident"
>;

export type QaWriteActionApprovalPhrase = {
  action: QaManualFillWriteAction;
  label: "Save" | "Submit" | "Update" | "Resolve" | "Close";
  phrase: string;
};

export type QaSingleTicketSmokePlan = {
  status: QaSingleTicketSmokePlanStatus;
  mode: RealActionMode;
  requestedWriteAction: QaManualFillWriteAction;
  targetHost?: string;
  requiredApprovalPhrase: string;
  writeActionApprovalPhrases: QaWriteActionApprovalPhrase[];
  stopRules: string[];
  gateDecision: RealActionDecision;
  fieldMappings: IncidentFieldMapping[];
  missingRequiredFields: IncidentFieldMappingKey[];
  safety: QaSingleTicketSmokeSafetyFlags;
  privacySafeAuditPreview: QaSingleTicketSmokeAuditPreview;
};

export type QaSingleTicketSmokePlanRequest = {
  draft: TicketDraft;
  environment: RealActionEnvironment;
  targetUrl?: string;
  targetValidation?: RealActionTargetValidation;
  mappingOptions: IncidentFieldMappingPreviewOptions;
  writeAction?: QaManualFillWriteAction;
  approvalPhrase?: string;
  language?: string;
  templatePreset?: string;
  now?: Date | string;
};

const missingValue = "Not set";
const defaultAuditTimestamp = "1970-01-01T00:00:00.000Z";

export function buildIncidentFieldMappingPreview(
  draft: TicketDraft,
  options: IncidentFieldMappingPreviewOptions
): IncidentFieldMappingPreview {
  const fieldMappings: IncidentFieldMapping[] = [
    contextMapping("requester", "Requester", options.requester),
    contextMapping("contactType", "Channel / Contact type", options.contactType),
    draftMapping("category", "Category", draft.category),
    draftMapping("subcategory", "Subcategory", draft.subcategory),
    contextMapping("location", "Location", options.location),
    draftMapping("impact", "Impact", draft.impact),
    draftMapping("urgency", "Urgency", draft.urgency),
    draftMapping("assignmentGroup", "Assignment group", draft.assignmentGroup),
    draftMapping("shortDescription", "Short description", draft.shortDescription),
    draftMapping("description", "Description", draft.description),
    draftMapping("workNotes", "Work notes", draft.workNotes)
  ];

  return {
    fieldMappings,
    missingRequiredFields: fieldMappings
      .filter((mapping) => isMissing(mapping.value))
      .map((mapping) => mapping.key)
  };
}

export function evaluateQaSingleTicketSmokePlan(
  request: QaSingleTicketSmokePlanRequest
): QaSingleTicketSmokePlan {
  const requestedWriteAction = request.writeAction ?? "submit_incident";
  const requiredApprovalPhrase = getRequiredRealActionApprovalPhrase(request.environment.mode, requestedWriteAction);
  const mappingPreview = buildIncidentFieldMappingPreview(request.draft, request.mappingOptions);
  const targetHost = validatedTargetHost(request.targetValidation);
  const approval = request.approvalPhrase
    ? {
        operator: "Alan",
        mode: request.environment.mode,
        action: requestedWriteAction,
        targetHost: targetHost ?? "",
        phrase: request.approvalPhrase
      }
    : undefined;
  const gateDecision = authorizeRealAction({
    environment: request.environment,
    action: requestedWriteAction,
    targetUrl: request.targetUrl ?? "",
    targetValidation: request.targetValidation,
    approval
  });
  const safeGateDecision = targetHost ? { ...gateDecision, targetHost } : { ...gateDecision, targetHost: undefined };
  const status: QaSingleTicketSmokePlanStatus =
    gateDecision.allowed && mappingPreview.missingRequiredFields.length === 0 ? "ready-for-manual-fill" : "blocked";

  return {
    status,
    mode: request.environment.mode,
    requestedWriteAction,
    targetHost,
    requiredApprovalPhrase,
    writeActionApprovalPhrases: buildWriteActionApprovalPhrases(request.environment.mode),
    stopRules: buildStopRules(),
    gateDecision: safeGateDecision,
    ...mappingPreview,
    safety: safetyFlags(),
    privacySafeAuditPreview: {
      timestamp: timestampFor(request.now),
      mode: request.environment.mode,
      language: request.language ?? "en-US",
      templatePreset: request.templatePreset ?? "unspecified",
      actionState: status
    }
  };
}

function buildWriteActionApprovalPhrases(mode: RealActionMode): QaWriteActionApprovalPhrase[] {
  return [
    { action: "save_incident", label: "Save", phrase: getRequiredRealActionApprovalPhrase(mode, "save_incident") },
    { action: "submit_incident", label: "Submit", phrase: getRequiredRealActionApprovalPhrase(mode, "submit_incident") },
    { action: "update_incident", label: "Update", phrase: getRequiredRealActionApprovalPhrase(mode, "update_incident") },
    { action: "resolve_incident", label: "Resolve", phrase: getRequiredRealActionApprovalPhrase(mode, "resolve_incident") },
    { action: "close_incident", label: "Close", phrase: getRequiredRealActionApprovalPhrase(mode, "close_incident") }
  ];
}

function buildStopRules(): string[] {
  return [
    "Stop before every Save/Submit/Update/Resolve/Close unless Alan gives the exact action-specific approval phrase.",
    "Stop if any real user, real ticket text, real ticket number, credential, cookie, session, screenshot, or recording detail appears.",
    "Stop if the QA ticket could notify production users or a real support team.",
    "Stop if the environment is production or production-shadow, or if QA isolation is not explicitly confirmed.",
    "Stop if browser DOM autofill, ServiceNow API, bulk create, attachment upload, email send, or automated update/resolve/close appears."
  ];
}

function contextMapping(
  key: IncidentFieldMappingKey,
  label: string,
  value: string | undefined
): IncidentFieldMapping {
  return {
    key,
    label,
    value: normalizeValue(value),
    required: true,
    source: "sanitized-context"
  };
}

function draftMapping(
  key: IncidentFieldMappingKey,
  label: string,
  field: FieldDraft | undefined
): IncidentFieldMapping {
  return {
    key,
    label,
    value: normalizeValue(field?.value),
    required: true,
    source: "ticket-draft"
  };
}

function normalizeValue(value: string | undefined): string {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : missingValue;
}

function isMissing(value: string): boolean {
  return value === missingValue;
}

function validatedTargetHost(targetValidation: RealActionTargetValidation | undefined): string | undefined {
  return targetValidation?.allowed ? targetValidation.host : undefined;
}

function timestampFor(now: Date | string | undefined): string {
  if (now instanceof Date) {
    return now.toISOString();
  }
  if (typeof now === "string") {
    return new Date(now).toISOString();
  }
  return defaultAuditTimestamp;
}

function safetyFlags(): QaSingleTicketSmokeSafetyFlags {
  return {
    singleTicketOnly: true,
    manualFillOnly: true,
    noBrowserAutomation: true,
    noServiceNowApi: true,
    noAutoSubmit: true,
    noBulkCreate: true,
    noExternalActionPerformed: true,
    productionWriteAllowed: false
  };
}
