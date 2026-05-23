import type { FieldDraft, TicketDraft } from "./models";

export type QaIncidentDefaultScenario = "initial-create" | "route-out";

export type QaIncidentDefaultFieldKey =
  | "requester"
  | "category"
  | "subcategory"
  | "location"
  | "channel"
  | "impact"
  | "urgency"
  | "assignmentGroup"
  | "assignedTo"
  | "state"
  | "shortDescription"
  | "description"
  | "workNotes";

export type QaIncidentFormFieldType = "text" | "textarea" | "select" | "reference" | "choice" | "other";

export type QaIncidentFormFieldEvidence = {
  name?: string;
  id?: string;
  label?: string;
  type: QaIncidentFormFieldType;
  required?: boolean;
  starred?: boolean;
  writable: boolean;
  valuePresent?: boolean;
  matchedControlCount?: number;
  visibleControlCount?: number;
};

export type QaIncidentTestDefaultProfile = {
  requester: string;
  category: string;
  subcategory: string;
  location: string;
  channel: string;
  impact: string;
  urgency: string;
  assignmentGroup: string;
  assignedTo: string;
  routeOutState: string;
  workNotesPrefix: string;
};

export type QaIncidentDefaultFieldRequirement = "required" | "recommended" | "available";

export type QaIncidentDefaultFieldSource =
  | "qa-default-profile"
  | "ticket-draft"
  | "ticket-draft-with-qa-prefix"
  | "route-out-target"
  | "route-out-clear-assigned-to"
  | "computed-safety-rule";

export type QaIncidentDefaultPlannedField = {
  key: QaIncidentDefaultFieldKey;
  label: string;
  requirement: QaIncidentDefaultFieldRequirement;
  value: string;
  valueLength: number;
  source: QaIncidentDefaultFieldSource;
  autofillAllowed: false;
};

export type QaIncidentDefaultValuePlanStatus = "ready-for-local-review" | "blocked";

export type QaIncidentDefaultValuePlanBlockedReason =
  | "unrecognized-required-field"
  | "no-recognized-incident-fields"
  | "route-out-assignment-group-required";

export type QaIncidentDefaultValuePlan = {
  status: QaIncidentDefaultValuePlanStatus;
  scenario: QaIncidentDefaultScenario;
  blockedReason?: QaIncidentDefaultValuePlanBlockedReason;
  plannedFields: QaIncidentDefaultPlannedField[];
  operations: [];
  unrecognizedRequiredFieldCount: number;
  unrecognizedRequiredFields: Array<{ label: "redacted-required-field"; requirement: "required" }>;
  safety: QaIncidentDefaultValuePlanSafety;
  stopRules: string[];
};

export type QaIncidentDefaultRuntimeTextFieldPlan = QaIncidentDefaultValuePlan & {
  /**
   * Non-text default fields intentionally excluded from first live runtime autofill.
   * They remain visible in the local review plan and require a later control-type slice.
   */
  excludedFieldKeys: QaIncidentDefaultFieldKey[];
};

export type QaIncidentDefaultFixtureControl = {
  key: QaIncidentDefaultFieldKey;
  matchedControlCount: number;
  /**
   * ServiceNow Classic may render hidden/template duplicates for the same logical field.
   * When present, this is the visible writable-control count after local fixture filtering.
   */
  visibleControlCount?: number;
  type: QaIncidentFormFieldType;
  writable: boolean;
};

export type QaIncidentDefaultFixturePage = {
  controls: QaIncidentDefaultFixtureControl[];
  unexpectedRequiredFieldCount?: number;
};

export type QaIncidentDefaultFixtureBlockedReason =
  | "plan-not-ready"
  | "missing-control"
  | "ambiguous-control"
  | "field-type-mismatch"
  | "non-writable-control"
  | "unexpected-required-field";

export type QaIncidentDefaultFixtureVerifiedField = {
  key: QaIncidentDefaultFieldKey;
  label: string;
  controlType: QaIncidentFormFieldType;
  valueLength: number;
  autofillAllowed: false;
  value?: never;
};

export type QaIncidentDefaultFieldFixtureResult = {
  status: "verified" | "blocked";
  blockedReason?: QaIncidentDefaultFixtureBlockedReason;
  verifiedFields: QaIncidentDefaultFixtureVerifiedField[];
  writeActionsAttempted: false;
  browserProcessLaunched: false;
  realServiceNowPageTouched: false;
  serviceNowApiCalled: false;
  saveSubmitUpdateCloseAttempted: false;
  artifactsCaptured: false;
  operatorStopInstruction: "local-fixture-only-review-before-live-runtime";
};

export type QaIncidentDefaultFieldEvidenceVerificationResult = Omit<
  QaIncidentDefaultFieldFixtureResult,
  "realServiceNowPageTouched" | "operatorStopInstruction"
> & {
  realServiceNowPageTouched: true;
  operatorStopInstruction: "current-page-readonly-verify-only-before-live-runtime";
};

export type QaIncidentDefaultValuePlanSafety = {
  localPlanOnly: true;
  browserAutomationAllowed: false;
  serviceNowApiAllowed: false;
  saveSubmitUpdateCloseAllowed: false;
  noLiveFieldMutation: true;
  noArtifactCapture: true;
  noExternalAiOnQaContent: true;
  productionWriteAllowed: false;
};

export type QaIncidentDefaultValuePlanRequest = {
  draft: TicketDraft;
  fields: QaIncidentFormFieldEvidence[];
  scenario?: QaIncidentDefaultScenario;
  defaults?: Partial<QaIncidentTestDefaultProfile>;
  routeOutAssignmentGroup?: string;
};

export const yageoQaIncidentTestDefaults: QaIncidentTestDefaultProfile = {
  requester: "Zheng Zhu",
  category: "Desktop",
  subcategory: "Password reset",
  location: "Shenzhen (YKPC) - CNSNZE",
  channel: "Self-service / manual paste",
  impact: "3 - Low",
  urgency: "3 - Low",
  assignmentGroup: "SN YAGEO Service Desk - China",
  assignedTo: "Zheng Zhu",
  routeOutState: "New",
  workNotesPrefix: "SD_China"
};

const initialCreateOrder: QaIncidentDefaultFieldKey[] = [
  "requester",
  "category",
  "subcategory",
  "location",
  "channel",
  "impact",
  "urgency",
  "assignmentGroup",
  "assignedTo",
  "shortDescription",
  "description",
  "workNotes"
];

const routeOutOrder: QaIncidentDefaultFieldKey[] = ["state", "assignmentGroup", "assignedTo", "workNotes"];

const canonicalLabels: Record<QaIncidentDefaultFieldKey, string> = {
  requester: "Requester",
  category: "Category",
  subcategory: "Subcategory",
  location: "Location",
  channel: "Channel",
  impact: "Impact",
  urgency: "Urgency",
  assignmentGroup: "Assignment group",
  assignedTo: "Assigned to",
  state: "State",
  shortDescription: "Short description",
  description: "Description",
  workNotes: "Work notes"
};

const expectedFixtureControlTypes: Record<QaIncidentDefaultFieldKey, QaIncidentFormFieldType> = {
  requester: "reference",
  category: "select",
  subcategory: "select",
  location: "reference",
  channel: "select",
  impact: "select",
  urgency: "select",
  assignmentGroup: "reference",
  assignedTo: "reference",
  state: "select",
  shortDescription: "text",
  description: "textarea",
  workNotes: "textarea"
};

const recommendedKeys = new Set<QaIncidentDefaultFieldKey>([
  "subcategory",
  "assignedTo",
  "state",
  "workNotes"
]);

const runtimeTextFieldOrder: QaIncidentDefaultFieldKey[] = ["shortDescription", "description", "workNotes"];

const runtimeTextFieldStopRule =
  "Runtime autofill is limited to text fields only: Short description, Description, and Work notes. Reference, select, assignment, requester, state, and routing fields remain verify-only.";

export function buildQaIncidentDefaultValuePlan(
  request: QaIncidentDefaultValuePlanRequest
): QaIncidentDefaultValuePlan {
  const scenario = request.scenario ?? "initial-create";
  const defaults = { ...yageoQaIncidentTestDefaults, ...request.defaults };
  const routeOutAssignmentGroup = normalizeOptionalValue(request.routeOutAssignmentGroup);

  if (scenario === "route-out" && !routeOutAssignmentGroup) {
    return blockedPlan(scenario, "route-out-assignment-group-required", 0);
  }

  const recognizedEvidence = new Map<QaIncidentDefaultFieldKey, QaIncidentFormFieldEvidence>();
  let unrecognizedRequiredFieldCount = 0;

  for (const field of request.fields) {
    const key = recognizeIncidentField(field);
    if (key) {
      if (!recognizedEvidence.has(key)) {
        recognizedEvidence.set(key, field);
      }
      continue;
    }

    if (isRequiredField(field)) {
      unrecognizedRequiredFieldCount += 1;
    }
  }

  if (recognizedEvidence.size === 0) {
    return blockedPlan(scenario, "no-recognized-incident-fields", 0);
  }

  if (unrecognizedRequiredFieldCount > 0) {
    return blockedPlan(scenario, "unrecognized-required-field", unrecognizedRequiredFieldCount);
  }

  const orderedKeys = scenario === "route-out" ? routeOutOrder : initialCreateOrder;
  const plannedFields = orderedKeys.flatMap((key) => {
    const evidence = recognizedEvidence.get(key);
    if (!evidence) return [];
    if (!shouldPlanField(key, evidence, scenario)) return [];
    const planned = plannedFieldFor(key, evidence, request.draft, defaults, scenario, routeOutAssignmentGroup);
    return planned ? [planned] : [];
  });

  return {
    status: "ready-for-local-review",
    scenario,
    plannedFields,
    operations: [],
    unrecognizedRequiredFieldCount: 0,
    unrecognizedRequiredFields: [],
    safety: safetyFlags(),
    stopRules: stopRules()
  };
}

export function buildQaIncidentDefaultRuntimeTextFieldPlan(
  plan: QaIncidentDefaultValuePlan
): QaIncidentDefaultRuntimeTextFieldPlan {
  if (plan.status !== "ready-for-local-review") {
    return {
      ...plan,
      plannedFields: [],
      excludedFieldKeys: []
    };
  }

  const plannedByKey = new Map(plan.plannedFields.map((field) => [field.key, field]));
  const plannedFields = runtimeTextFieldOrder.flatMap((key) => {
    const field = plannedByKey.get(key);
    return field ? [field] : [];
  });
  const excludedFieldKeys = plan.plannedFields
    .map((field) => field.key)
    .filter((key) => !runtimeTextFieldOrder.includes(key));

  return {
    ...plan,
    plannedFields,
    excludedFieldKeys,
    stopRules: [runtimeTextFieldStopRule, ...plan.stopRules.filter((rule) => rule !== runtimeTextFieldStopRule)]
  };
}

export function executeQaIncidentDefaultFieldFixture(
  plan: QaIncidentDefaultValuePlan,
  fixture: QaIncidentDefaultFixturePage
): QaIncidentDefaultFieldFixtureResult {
  if (plan.status !== "ready-for-local-review") {
    return blockedFixture("plan-not-ready");
  }

  if ((fixture.unexpectedRequiredFieldCount ?? 0) > 0) {
    return blockedFixture("unexpected-required-field");
  }

  const verifiedFields: QaIncidentDefaultFixtureVerifiedField[] = [];
  for (const field of plan.plannedFields) {
    const controls = fixture.controls.filter((control) => control.key === field.key);
    if (controls.length === 0) {
      return blockedFixture("missing-control");
    }
    if (controls.length > 1) {
      return blockedFixture("ambiguous-control");
    }

    const control = controls[0];
    const controlCount = effectiveControlCount(control);
    if (controlCount === 0) {
      return blockedFixture("missing-control");
    }
    if (controlCount > 1) {
      return blockedFixture("ambiguous-control");
    }
    if (!fixtureControlTypeMatches(expectedFixtureControlTypes[field.key], control.type)) {
      return blockedFixture("field-type-mismatch");
    }
    if (!control.writable) {
      return blockedFixture("non-writable-control");
    }

    verifiedFields.push({
      key: field.key,
      label: field.label,
      controlType: control.type,
      valueLength: field.valueLength,
      autofillAllowed: false
    });
  }

  return {
    status: "verified",
    verifiedFields,
    ...fixtureSafetyFlags()
  };
}

export function executeQaIncidentDefaultFieldEvidenceVerification(
  plan: QaIncidentDefaultValuePlan,
  fields: QaIncidentFormFieldEvidence[]
): QaIncidentDefaultFieldEvidenceVerificationResult {
  const result = executeQaIncidentDefaultFieldFixture(plan, incidentEvidenceToFixturePage(fields));
  return {
    ...result,
    realServiceNowPageTouched: true,
    operatorStopInstruction: "current-page-readonly-verify-only-before-live-runtime"
  };
}

export function applyQaWorkNotesPrefix(value: string, prefix = yageoQaIncidentTestDefaults.workNotesPrefix): string {
  const normalizedValue = value.replace(/\s+/g, " ").trim();
  const normalizedPrefix = prefix.replace(/\s+/g, " ").trim();
  if (!normalizedValue) return normalizedPrefix;
  if (!normalizedPrefix) return normalizedValue;
  if (normalizedValue.toLowerCase().startsWith(normalizedPrefix.toLowerCase())) {
    return normalizedValue;
  }
  return `${normalizedPrefix} - ${normalizedValue}`;
}

function shouldPlanField(
  key: QaIncidentDefaultFieldKey,
  evidence: QaIncidentFormFieldEvidence,
  scenario: QaIncidentDefaultScenario
): boolean {
  if (scenario === "route-out") {
    return routeOutOrder.includes(key);
  }
  return isRequiredField(evidence) || recommendedKeys.has(key) || ["shortDescription", "description"].includes(key);
}

function incidentEvidenceToFixturePage(fields: QaIncidentFormFieldEvidence[]): QaIncidentDefaultFixturePage {
  const controls: QaIncidentDefaultFixtureControl[] = [];
  let unexpectedRequiredFieldCount = 0;

  for (const field of fields) {
    const key = recognizeIncidentField(field);
    if (!key) {
      if (isRequiredField(field)) {
        unexpectedRequiredFieldCount += field.visibleControlCount ?? field.matchedControlCount ?? 1;
      }
      continue;
    }

    controls.push({
      key,
      matchedControlCount: field.matchedControlCount ?? 1,
      visibleControlCount: field.visibleControlCount,
      type: field.type,
      writable: field.writable
    });
  }

  return { controls, unexpectedRequiredFieldCount };
}

function plannedFieldFor(
  key: QaIncidentDefaultFieldKey,
  evidence: QaIncidentFormFieldEvidence,
  draft: TicketDraft,
  defaults: QaIncidentTestDefaultProfile,
  scenario: QaIncidentDefaultScenario,
  routeOutAssignmentGroup: string | undefined
): QaIncidentDefaultPlannedField | undefined {
  const valueAndSource = valueAndSourceFor(key, draft, defaults, scenario, routeOutAssignmentGroup);
  if (!valueAndSource) return undefined;
  return {
    key,
    label: canonicalLabels[key],
    requirement: requirementFor(key, evidence),
    value: valueAndSource.value,
    valueLength: valueAndSource.value.length,
    source: valueAndSource.source,
    autofillAllowed: false
  };
}

function valueAndSourceFor(
  key: QaIncidentDefaultFieldKey,
  draft: TicketDraft,
  defaults: QaIncidentTestDefaultProfile,
  scenario: QaIncidentDefaultScenario,
  routeOutAssignmentGroup: string | undefined
): { value: string; source: QaIncidentDefaultFieldSource } | undefined {
  switch (key) {
    case "requester":
      return { value: defaults.requester, source: "qa-default-profile" };
    case "category":
      return { value: defaults.category, source: "qa-default-profile" };
    case "subcategory":
      return { value: defaults.subcategory, source: "qa-default-profile" };
    case "location":
      return { value: defaults.location, source: "qa-default-profile" };
    case "channel":
      return { value: defaults.channel, source: "qa-default-profile" };
    case "impact":
      return { value: defaults.impact, source: "qa-default-profile" };
    case "urgency":
      return { value: defaults.urgency, source: "qa-default-profile" };
    case "assignmentGroup":
      return scenario === "route-out"
        ? { value: routeOutAssignmentGroup ?? "", source: "route-out-target" }
        : { value: defaults.assignmentGroup, source: "qa-default-profile" };
    case "assignedTo":
      return scenario === "route-out"
        ? { value: "", source: "route-out-clear-assigned-to" }
        : { value: defaults.assignedTo, source: "qa-default-profile" };
    case "state":
      return { value: defaults.routeOutState, source: "computed-safety-rule" };
    case "shortDescription":
      return valueFromDraft(draft.shortDescription, "ticket-draft");
    case "description":
      return valueFromDraft(draft.description, "ticket-draft");
    case "workNotes":
      return valueFromDraft(draft.workNotes, "ticket-draft-with-qa-prefix", (value) =>
        applyQaWorkNotesPrefix(value, defaults.workNotesPrefix)
      );
  }
}

function valueFromDraft(
  field: FieldDraft | undefined,
  source: QaIncidentDefaultFieldSource,
  transform: (value: string) => string = (value) => value
): { value: string; source: QaIncidentDefaultFieldSource } | undefined {
  const value = normalizeOptionalValue(field?.value);
  if (!value) return undefined;
  return { value: transform(value), source };
}

function requirementFor(
  key: QaIncidentDefaultFieldKey,
  evidence: QaIncidentFormFieldEvidence
): QaIncidentDefaultFieldRequirement {
  if (isRequiredField(evidence)) return "required";
  if (recommendedKeys.has(key)) return "recommended";
  return "available";
}

function recognizeIncidentField(field: QaIncidentFormFieldEvidence): QaIncidentDefaultFieldKey | undefined {
  const haystack = normalizedFieldText(field);
  if (!haystack) return undefined;

  if (matchesAny(haystack, ["subcategory", "sub category", "incident subcategory"])) return "subcategory";
  if (matchesAny(haystack, ["assignment_group", "assignment group", "assignmentgroup"])) return "assignmentGroup";
  if (matchesAny(haystack, ["assigned_to", "assigned to", "assign to", "assignedto"])) return "assignedTo";
  if (matchesAny(haystack, ["caller_id", "caller", "requester", "requested for", "opened_for"])) return "requester";
  if (matchesAny(haystack, ["contact_type", "contact type", "channel", "u_channel"])) return "channel";
  if (matchesAny(haystack, ["impact", "incident impact"])) return "impact";
  if (matchesAny(haystack, ["urgency", "incident urgency"])) return "urgency";
  if (matchesAny(haystack, ["short_description", "short description", "shortdescription"])) return "shortDescription";
  if (matchesAny(haystack, ["work_notes", "work notes", "worknotes"])) return "workNotes";
  if (matchesAny(haystack, ["description"])) return "description";
  if (matchesAny(haystack, ["category"])) return "category";
  if (matchesAny(haystack, ["location", "cmn_location"])) return "location";
  if (matchesAny(haystack, ["state", "incident state"])) return "state";
  return undefined;
}

function normalizedFieldText(field: QaIncidentFormFieldEvidence): string {
  return [field.name, field.id, field.label]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .replace(/[.:-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle.toLowerCase().replace(/[.:-]+/g, " ")));
}

function isRequiredField(field: QaIncidentFormFieldEvidence): boolean {
  return (field.required === true || field.starred === true) && !field.valuePresent;
}

function normalizeOptionalValue(value: string | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function blockedPlan(
  scenario: QaIncidentDefaultScenario,
  blockedReason: QaIncidentDefaultValuePlanBlockedReason,
  unrecognizedRequiredFieldCount: number
): QaIncidentDefaultValuePlan {
  return {
    status: "blocked",
    scenario,
    blockedReason,
    plannedFields: [],
    operations: [],
    unrecognizedRequiredFieldCount,
    unrecognizedRequiredFields: Array.from({ length: unrecognizedRequiredFieldCount }, () => ({
      label: "redacted-required-field" as const,
      requirement: "required" as const
    })),
    safety: safetyFlags(),
    stopRules: stopRules()
  };
}

function blockedFixture(blockedReason: QaIncidentDefaultFixtureBlockedReason): QaIncidentDefaultFieldFixtureResult {
  return {
    status: "blocked",
    blockedReason,
    verifiedFields: [],
    ...fixtureSafetyFlags()
  };
}

function fixtureSafetyFlags(): Omit<QaIncidentDefaultFieldFixtureResult, "status" | "blockedReason" | "verifiedFields"> {
  return {
    writeActionsAttempted: false,
    browserProcessLaunched: false,
    realServiceNowPageTouched: false,
    serviceNowApiCalled: false,
    saveSubmitUpdateCloseAttempted: false,
    artifactsCaptured: false,
    operatorStopInstruction: "local-fixture-only-review-before-live-runtime"
  };
}

function effectiveControlCount(control: QaIncidentDefaultFixtureControl): number {
  return control.visibleControlCount ?? control.matchedControlCount;
}

function fixtureControlTypeMatches(expected: QaIncidentFormFieldType, actual: QaIncidentFormFieldType): boolean {
  if (expected === actual) return true;
  return expected === "select" && actual === "choice";
}

function safetyFlags(): QaIncidentDefaultValuePlanSafety {
  return {
    localPlanOnly: true,
    browserAutomationAllowed: false,
    serviceNowApiAllowed: false,
    saveSubmitUpdateCloseAllowed: false,
    noLiveFieldMutation: true,
    noArtifactCapture: true,
    noExternalAiOnQaContent: true,
    productionWriteAllowed: false
  };
}

function stopRules(): string[] {
  return [
    "This is a local planning artifact only; do not mutate the live ServiceNow form from this plan.",
    "Stop before Save, Submit, Update, Close, attachment upload, outbound email, notification, ServiceNow API write, or bulk action.",
    "Route-out planning must set State to New before changing Assignment group and must leave Assigned to blank.",
    "If any required field is unrecognized, stop and ask Alan for an explicit field mapping before planning values.",
    "Do not capture screenshots, HAR, traces, cookies, sessions, page source, raw URLs, ticket numbers, or real requester data."
  ];
}
