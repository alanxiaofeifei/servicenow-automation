import type { FieldDraft, TicketDraft } from "./models";
import type { RealActionEnvironment, RealActionMode, RealActionTargetValidation } from "./real-action-gate";

export type QaAutofillFieldKey = "shortDescription" | "description" | "workNotes";
export type QaAutofillSelectorStatus = "found" | "missing" | "ambiguous";

export type QaAutofillSelectorVerification = Record<QaAutofillFieldKey, QaAutofillSelectorStatus>;

export type QaAutofillRequestedOperation = "fill-text" | "click-save" | "click-submit" | "click-update" | "click-close";

export type QaAutofillPlanStatus = "ready-for-autofill" | "blocked";

export type QaAutofillBlockedReason =
  | "qa-dev-only"
  | "target-validation-denied"
  | "qa-isolation-confirmation-required"
  | "dedicated-profile-confirmation-required"
  | "approval-phrase-required"
  | "approval-phrase-mismatch"
  | "approval-stale-after-page-change"
  | "missing-text-field-value"
  | "selector-verification-required"
  | "selector-mismatch"
  | "unexpected-required-field"
  | "bulk-mode-denied"
  | "write-operation-denied";

export type QaAutofillFieldDescriptor = {
  key: QaAutofillFieldKey;
  label: "Short description" | "Description" | "Work notes";
  type: "text" | "textarea";
  selectors: string[];
};

export type QaAutofillField = QaAutofillFieldDescriptor & {
  value: string;
  source: "ticket-draft";
};

export type QaAutofillOperation = {
  kind: "fill-text";
  fieldKey: QaAutofillFieldKey;
  label: QaAutofillField["label"];
  selectors: string[];
  value: string;
  stopBeforeWrite: true;
};

export type QaAutofillSafety = {
  singleTicketOnly: true;
  textFieldsOnly: true;
  autofillOnly: true;
  manualLoginOnly: true;
  dedicatedChromiumProfileRequired: true;
  noSaveSubmitUpdateClose: true;
  noServiceNowApi: true;
  noBulkCreateOrFill: true;
  noArtifactCapture: true;
  noExternalAiOnQaContent: true;
  productionWriteAllowed: false;
};

export type QaAutofillPlan = {
  status: QaAutofillPlanStatus;
  mode: RealActionMode;
  blockedReason?: QaAutofillBlockedReason;
  target: {
    allowlisted: boolean;
    hostRedacted: true;
  };
  allowedFields: QaAutofillField[];
  operations: QaAutofillOperation[];
  safety: QaAutofillSafety;
  stopRules: string[];
  stopMessage: string;
};

export type QaAutofillPlanRequest = {
  draft: TicketDraft;
  environment: RealActionEnvironment;
  targetUrl?: string;
  targetValidation?: RealActionTargetValidation;
  approvalPhrase?: string;
  approvalPageFingerprint?: string;
  currentPageFingerprint?: string;
  qaIsolationConfirmed: boolean;
  dedicatedProfileConfirmed: boolean;
  selectorVerification?: Partial<QaAutofillSelectorVerification>;
  unexpectedRequiredFields?: string[];
  requestedOperations?: QaAutofillRequestedOperation[];
  ticketCount?: number;
};

export type QaAutofillFixtureElementType = "text" | "textarea" | "select" | "other";

export type QaAutofillFixtureField = {
  key: QaAutofillFieldKey;
  matchedSelectorCount: number;
  /**
   * ServiceNow classic can render duplicate hidden/template controls for the same field.
   * When present, this is the count of visible controls after the runtime filters hidden duplicates.
   */
  visibleSelectorCount?: number;
  elementType: QaAutofillFixtureElementType;
  writable: boolean;
};

export type QaAutofillFixturePage = {
  fields: QaAutofillFixtureField[];
  unexpectedRequiredFieldCount?: number;
};

export type QaAutofillExecutionBlockedReason = "plan-not-ready" | "selector-mismatch" | "unexpected-required-field";

export type QaAutofillFixtureExecutionResult = {
  status: "completed" | "blocked";
  blockedReason?: QaAutofillExecutionBlockedReason;
  filledFields: Array<{
    key: QaAutofillFieldKey;
    label: QaAutofillField["label"];
    valueLength: number;
    value?: never;
  }>;
  writeActionsAttempted: false;
  artifactsCaptured: false;
  browserProcessLaunched: false;
  realServiceNowPageTouched: false;
  operatorStopInstruction: "review-page-manually-before-any-write-action";
};

const stopMessage =
  "Autofill completed. The tool will not Save, Submit, Update, or Close. Review the QA page manually.";

const fieldDefinitions: Array<QaAutofillFieldDescriptor & { draftField: QaAutofillFieldKey }> = [
  {
    key: "shortDescription",
    draftField: "shortDescription",
    label: "Short description",
    type: "text",
    selectors: [
      'input[name="incident.short_description"]',
      'input[id="incident.short_description"]',
      'input[id$=".short_description"]'
    ]
  },
  {
    key: "description",
    draftField: "description",
    label: "Description",
    type: "textarea",
    selectors: [
      'textarea[name="incident.description"]',
      'textarea[id="incident.description"]',
      'textarea[id$=".description"]'
    ]
  },
  {
    key: "workNotes",
    draftField: "workNotes",
    label: "Work notes",
    type: "textarea",
    selectors: [
      'textarea[name="incident.work_notes"]',
      'textarea[id="incident.work_notes"]',
      'textarea[id$=".work_notes"]'
    ]
  }
];

export function getRequiredQaAutofillApprovalPhrase(mode: Extract<RealActionMode, "qa" | "dev">): string {
  return `I APPROVE ${mode.toUpperCase()} SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED`;
}

export function getQaAutofillFieldDescriptors(): QaAutofillFieldDescriptor[] {
  return fieldDefinitions.map(({ draftField: _draftField, ...descriptor }) => ({
    ...descriptor,
    selectors: [...descriptor.selectors]
  }));
}

export function buildQaAutofillSelectorVerificationFromEvidence(
  page: QaAutofillFixturePage
): QaAutofillSelectorVerification {
  const expectedElementTypes: Record<QaAutofillFieldKey, "text" | "textarea"> = {
    shortDescription: "text",
    description: "textarea",
    workNotes: "textarea"
  };

  const statusFor = (key: QaAutofillFieldKey): QaAutofillSelectorStatus => {
    const matches = page.fields.filter((candidate) => candidate.key === key);
    if (matches.length > 1) return "ambiguous";
    const field = matches[0];
    if (!field) return "missing";
    const selectorCount = effectiveSelectorCount(field);
    if (selectorCount > 1) return "ambiguous";
    return selectorCount === 1 && field.writable && field.elementType === expectedElementTypes[key]
      ? "found"
      : "missing";
  };

  return {
    shortDescription: statusFor("shortDescription"),
    description: statusFor("description"),
    workNotes: statusFor("workNotes")
  };
}

export function buildQaTextFieldAutofillPlan(request: QaAutofillPlanRequest): QaAutofillPlan {
  if (request.environment.mode !== "qa" && request.environment.mode !== "dev") {
    return blockedPlan(request, "qa-dev-only");
  }

  if (!request.targetValidation?.allowed) {
    return blockedPlan(request, "target-validation-denied");
  }

  if ((request.ticketCount ?? 1) !== 1) {
    return blockedPlan(request, "bulk-mode-denied");
  }

  if (!request.qaIsolationConfirmed) {
    return blockedPlan(request, "qa-isolation-confirmation-required");
  }

  if (!request.dedicatedProfileConfirmed) {
    return blockedPlan(request, "dedicated-profile-confirmation-required");
  }

  if (!request.approvalPhrase) {
    return blockedPlan(request, "approval-phrase-required");
  }

  if (request.approvalPhrase !== getRequiredQaAutofillApprovalPhrase(request.environment.mode)) {
    return blockedPlan(request, "approval-phrase-mismatch");
  }

  if ((request.unexpectedRequiredFields ?? []).length > 0) {
    return blockedPlan(request, "unexpected-required-field");
  }

  if ((request.requestedOperations ?? ["fill-text"]).some((operation) => operation !== "fill-text")) {
    return blockedPlan(request, "write-operation-denied");
  }

  if (!request.selectorVerification) {
    return blockedPlan(request, "selector-verification-required");
  }

  const selectorMismatch = fieldDefinitions.some((field) => request.selectorVerification?.[field.key] !== "found");
  if (selectorMismatch) {
    return blockedPlan(request, "selector-mismatch");
  }

  if (approvalPageChangedAfterReview(request)) {
    return blockedPlan(request, "approval-stale-after-page-change");
  }

  const allowedFields = buildAllowedFields(request.draft);
  if (allowedFields.length !== fieldDefinitions.length) {
    return blockedPlan(request, "missing-text-field-value");
  }

  const operations = allowedFields.map<QaAutofillOperation>((field) => ({
    kind: "fill-text",
    fieldKey: field.key,
    label: field.label,
    selectors: field.selectors,
    value: field.value,
    stopBeforeWrite: true
  }));

  return {
    status: "ready-for-autofill",
    mode: request.environment.mode,
    target: sanitizedTarget(request),
    allowedFields,
    operations,
    safety: safetyFlags(),
    stopRules: autofillStopRules(),
    stopMessage
  };
}

export function executeQaTextFieldAutofillFixture(
  plan: QaAutofillPlan,
  fixture: QaAutofillFixturePage
): QaAutofillFixtureExecutionResult {
  if (plan.status !== "ready-for-autofill") {
    return blockedExecution("plan-not-ready");
  }

  if ((fixture.unexpectedRequiredFieldCount ?? 0) > 0) {
    return blockedExecution("unexpected-required-field");
  }

  const allowedFields = new Map(plan.allowedFields.map((field) => [field.key, field]));
  if (allowedFields.size !== fieldDefinitions.length || fixture.fields.length !== fieldDefinitions.length) {
    return blockedExecution("selector-mismatch");
  }

  for (const definition of fieldDefinitions) {
    const expectedField = allowedFields.get(definition.key);
    const matchingFields = fixture.fields.filter((field) => field.key === definition.key);
    if (!expectedField || matchingFields.length !== 1) {
      return blockedExecution("selector-mismatch");
    }
    const actualField = matchingFields[0];
    if (effectiveSelectorCount(actualField) !== 1) {
      return blockedExecution("selector-mismatch");
    }
    if (actualField.elementType !== expectedField.type) {
      return blockedExecution("selector-mismatch");
    }
    if (!actualField.writable) {
      return blockedExecution("selector-mismatch");
    }
  }

  return {
    status: "completed",
    filledFields: plan.allowedFields.map((field) => ({
      key: field.key,
      label: field.label,
      valueLength: field.value.length
    })),
    writeActionsAttempted: false,
    artifactsCaptured: false,
    browserProcessLaunched: false,
    realServiceNowPageTouched: false,
    operatorStopInstruction: "review-page-manually-before-any-write-action"
  };
}

function buildAllowedFields(draft: TicketDraft): QaAutofillField[] {
  return fieldDefinitions.flatMap((definition) => {
    const value = normalizeDraftField(draft[definition.draftField]);
    if (!value) return [];

    return [
      {
        key: definition.key,
        label: definition.label,
        type: definition.type,
        value,
        selectors: definition.selectors,
        source: "ticket-draft" as const
      }
    ];
  });
}

function normalizeDraftField(field: FieldDraft | undefined): string | undefined {
  const value = field?.value.trim();
  return value ? value : undefined;
}

function effectiveSelectorCount(field: QaAutofillFixtureField): number {
  return field.visibleSelectorCount ?? field.matchedSelectorCount;
}

function blockedPlan(request: QaAutofillPlanRequest, blockedReason: QaAutofillBlockedReason): QaAutofillPlan {
  return {
    status: "blocked",
    mode: request.environment.mode,
    blockedReason,
    target: sanitizedTarget(request),
    allowedFields: [],
    operations: [],
    safety: safetyFlags(),
    stopRules: autofillStopRules(),
    stopMessage
  };
}

function blockedExecution(blockedReason: QaAutofillExecutionBlockedReason): QaAutofillFixtureExecutionResult {
  return {
    status: "blocked",
    blockedReason,
    filledFields: [],
    writeActionsAttempted: false,
    artifactsCaptured: false,
    browserProcessLaunched: false,
    realServiceNowPageTouched: false,
    operatorStopInstruction: "review-page-manually-before-any-write-action"
  };
}

function approvalPageChangedAfterReview(request: QaAutofillPlanRequest): boolean {
  return (
    !request.approvalPageFingerprint ||
    !request.currentPageFingerprint ||
    request.approvalPageFingerprint !== request.currentPageFingerprint
  );
}

function sanitizedTarget(request: QaAutofillPlanRequest): QaAutofillPlan["target"] {
  return {
    allowlisted: request.targetValidation?.allowed === true,
    hostRedacted: true
  };
}

function safetyFlags(): QaAutofillSafety {
  return {
    singleTicketOnly: true,
    textFieldsOnly: true,
    autofillOnly: true,
    manualLoginOnly: true,
    dedicatedChromiumProfileRequired: true,
    noSaveSubmitUpdateClose: true,
    noServiceNowApi: true,
    noBulkCreateOrFill: true,
    noArtifactCapture: true,
    noExternalAiOnQaContent: true,
    productionWriteAllowed: false
  };
}

function autofillStopRules(): string[] {
  return [
    "Stop before Save, Submit, Update, Close, attachment upload, outbound email, notification, API write, or bulk action.",
    "Stop if QA/dev isolation or the dedicated/tool-owned Chromium profile is not confirmed immediately before autofill.",
    "Stop if any selector is missing, ambiguous, or points outside the approved text-field allowlist.",
    "Stop if unexpected required fields appear; do not guess reference, select, routing, impact, urgency, priority, state, or status values.",
    "Record only sanitized outcome; do not capture browser artifacts, page source, raw QA addresses, record identifiers, requester identity, or real field values."
  ];
}
