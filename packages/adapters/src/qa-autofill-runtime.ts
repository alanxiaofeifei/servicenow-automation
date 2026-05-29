import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";

import {
  buildQaAutofillSelectorVerificationFromEvidence,
  buildQaTextFieldAutofillPlan,
  getQaAutofillFieldDescriptors,
  type QaAutofillFieldDescriptor,
  type QaAutofillFieldKey,
  type QaAutofillFixtureElementType,
  type QaAutofillFixtureField,
  type QaAutofillOperation,
  type QaAutofillPlan,
  type QaAutofillSelectorVerification,
  type QaIncidentDefaultFieldKey,
  type QaIncidentDefaultPlannedField,
  type QaIncidentFormFieldEvidence,
  type QaIncidentFormFieldType,
  type TicketDraft
} from "@servicenow-automation/core";
import {
  validateServiceNowTargetUrl,
  type ServiceNowEnvironmentConfig,
  type ServiceNowTargetValidationResult
} from "@servicenow-automation/profiles";

export type QaAutofillRuntimeBlockedReason =
  | "qa-dev-only"
  | "execute-flag-required"
  | "cdp-endpoint-denied"
  | "cdp-page-selection-denied"
  | "browser-runtime-error"
  | "current-page-target-denied"
  | "selector-verification-required"
  | "selector-mismatch"
  | "unexpected-required-field"
  | "wsl-cli-live-cdp-blocked"
  | "approval-stale-after-page-change"
  | "plan-not-ready"
  | "qa-only-execute";

export type QaAutofillRuntimeInspection = {
  currentUrl: string;
  pageFingerprint: string;
  fields: QaAutofillFixtureField[];
  unexpectedRequiredFieldCount: number;
};

export type QaAutofillRuntimeFillRequest = {
  operations: QaAutofillOperation[];
  descriptors: QaAutofillFieldDescriptor[];
  expectedPageFingerprint: string;
  allowedHost: string;
  executionEnvironmentMode: "qa";
};

export type QaAutofillRuntimeFillResult = {
  status: "completed" | "blocked";
  blockedReason?: QaAutofillRuntimeBlockedReason;
  filledFields: Array<{
    key: QaAutofillFieldKey;
    label: string;
    valueLength: number;
    value?: never;
  }>;
  writeActionsAttempted: false;
  artifactsCaptured: false;
  serviceNowApiCalled: false;
  browserProcessLaunched: false;
  stoppedBeforeSaveSubmitUpdateClose: true;
  stoppedBeforeSaveSubmitUpdateResolveClose: true;
};

export type QaAutofillRuntimePageDriver = {
  inspectAllowedTextFields(descriptors: QaAutofillFieldDescriptor[]): Promise<QaAutofillRuntimeInspection>;
  fillAllowedTextFields(request: QaAutofillRuntimeFillRequest): Promise<QaAutofillRuntimeFillResult>;
};

export type QaIncidentFieldRuntimeBlockedReason =
  | "qa-dev-only"
  | "cdp-endpoint-denied"
  | "cdp-page-selection-denied"
  | "browser-runtime-error"
  | "current-page-target-denied";

export type QaCdpRuntimeBlockedReason = Extract<
  QaIncidentFieldRuntimeBlockedReason,
  "cdp-endpoint-denied" | "cdp-page-selection-denied" | "browser-runtime-error"
>;

export class QaCdpRuntimeBlockedError extends Error {
  readonly blockedReason: QaCdpRuntimeBlockedReason;

  constructor(blockedReason: QaCdpRuntimeBlockedReason) {
    super(blockedReason);
    this.name = "QaCdpRuntimeBlockedError";
    this.blockedReason = blockedReason;
  }
}

export type QaIncidentFieldRuntimeInspection = {
  currentUrl: string;
  pageFingerprint: string;
  fields: QaIncidentFormFieldEvidence[];
};

export type QaIncidentFieldRuntimePageDriver = {
  inspectIncidentFormFields(): Promise<QaIncidentFieldRuntimeInspection>;
};

export type QaIncidentFieldRuntimeResult = {
  status: "verified" | "blocked";
  blockedReason?: QaIncidentFieldRuntimeBlockedReason;
  pageFingerprint?: string;
  fields: QaIncidentFormFieldEvidence[];
  safety: {
    browserProcessLaunched: false;
    browserAutomationCalled: boolean;
    realServiceNowApiCalled: false;
    noServiceNowWrite: true;
    noSaveSubmitUpdateClose: true;
    noSaveSubmitUpdateResolveClose: true;
    artifactsCaptured: false;
    productionWriteAllowed: false;
  };
};

export type QaIncidentDefaultFieldRuntimeFillBlockedReason =
  | QaIncidentFieldRuntimeBlockedReason
  | "execute-flag-required"
  | "plan-not-ready"
  | "approval-page-fingerprint-required"
  | "qa-only-execute"
  | "runtime-text-fields-only"
  | "approval-stale-after-page-change"
  | "field-control-missing"
  | "field-control-ambiguous"
  | "field-option-not-found"
  | "reference-value-not-display-safe"
  | "non-writable-control"
  | "operator-confirmation-required"
  | "unsupported-control-type";

export type QaIncidentDefaultFieldRuntimeBlockedFieldReason =
  | "field-control-missing"
  | "field-control-ambiguous"
  | "field-option-not-found"
  | "reference-value-not-display-safe"
  | "non-writable-control"
  | "operator-confirmation-required"
  | "unsupported-control-type";

export type QaIncidentDefaultFieldRuntimeBlockedField = {
  key: QaIncidentDefaultFieldKey;
  label: string;
  controlType?: QaIncidentFormFieldType;
  valueLength: number;
  blockedReason: QaIncidentDefaultFieldRuntimeBlockedFieldReason;
  value?: never;
};

export type QaIncidentDefaultFieldRuntimeFillRequest = {
  plannedFields: Array<
    Pick<QaIncidentDefaultPlannedField, "key" | "label" | "value" | "valueLength"> &
      Partial<Pick<QaIncidentDefaultPlannedField, "source" | "manualConfirmationRequired">>
  >;
  expectedPageFingerprint?: string;
  allowedHost: string;
  executionEnvironmentMode: "qa";
};

export type QaIncidentDefaultFieldRuntimeFillResult = {
  status: "completed" | "blocked";
  blockedReason?: QaIncidentDefaultFieldRuntimeFillBlockedReason;
  filledFields: Array<{
    key: QaIncidentDefaultFieldKey;
    label: string;
    valueLength: number;
    value?: never;
  }>;
  blockedFields: QaIncidentDefaultFieldRuntimeBlockedField[];
  writeActionsAttempted: false;
  artifactsCaptured: false;
  serviceNowApiCalled: false;
  browserProcessLaunched: false;
  stoppedBeforeSaveSubmitUpdateClose: true;
  stoppedBeforeSaveSubmitUpdateResolveClose: true;
};

export type QaIncidentDefaultFieldAutofillRuntimeResult = {
  status: "verified" | "completed" | "blocked";
  blockedReason?: QaIncidentDefaultFieldRuntimeFillBlockedReason;
  pageFingerprint?: string;
  pageFingerprintMatched: boolean;
  filledFields: QaIncidentDefaultFieldRuntimeFillResult["filledFields"];
  blockedFields: QaIncidentDefaultFieldRuntimeBlockedField[];
  safety: {
    browserProcessLaunched: false;
    browserAutomationCalled: boolean;
    realServiceNowApiCalled: false;
    noServiceNowWrite: true;
    noSaveSubmitUpdateClose: true;
    noSaveSubmitUpdateResolveClose: true;
    artifactsCaptured: false;
    productionWriteAllowed: false;
  };
};

export type QaIncidentDefaultFieldAutofillRuntimePageDriver = QaIncidentFieldRuntimePageDriver & {
  fillIncidentDefaultFields(request: QaIncidentDefaultFieldRuntimeFillRequest): Promise<QaIncidentDefaultFieldRuntimeFillResult>;
};

export type RunQaIncidentFieldInspectionRuntimeRequest = {
  environment: ServiceNowEnvironmentConfig;
  driver?: QaIncidentFieldRuntimePageDriver;
};

export type RunQaIncidentDefaultFieldAutofillRuntimeRequest = {
  environment: ServiceNowEnvironmentConfig;
  driver?: QaIncidentDefaultFieldAutofillRuntimePageDriver;
  plannedFields: QaIncidentDefaultFieldRuntimeFillRequest["plannedFields"];
  execute: boolean;
  approvalPageFingerprint?: string;
};

export type QaAutofillRuntimeResult = {
  status: "verified" | "completed" | "blocked";
  blockedReason?: QaAutofillRuntimeBlockedReason | QaAutofillPlan["blockedReason"];
  selectorVerification?: QaAutofillSelectorVerification;
  pageFingerprint?: string;
  pageFingerprintMatched: boolean;
  plan?: QaAutofillPlan;
  execution?: QaAutofillRuntimeFillResult;
  safety: {
    browserProcessLaunched: false;
    browserAutomationCalled: boolean;
    realServiceNowApiCalled: false;
    noServiceNowWrite: true;
    noSaveSubmitUpdateClose: true;
    noSaveSubmitUpdateResolveClose: true;
    artifactsCaptured: false;
    productionWriteAllowed: false;
  };
};

export type RunQaTextFieldAutofillRuntimeRequest = {
  draft: TicketDraft;
  environment: ServiceNowEnvironmentConfig;
  driver?: QaAutofillRuntimePageDriver;
  execute: boolean;
  approvalPhrase?: string;
  approvalPageFingerprint?: string;
  qaIsolationConfirmed: boolean;
  dedicatedProfileConfirmed: boolean;
};

export type CdpQaAutofillRuntimePageDriverOptions = {
  endpoint: string;
  targetUrl?: string;
};

export type WindowsLocalCdpRuntimePageDriverOptions = CdpQaAutofillRuntimePageDriverOptions & {
  helperScriptPath: string;
  powershellExecutable?: string;
  timeoutMs?: number;
};

type WindowsLocalCdpEvaluationPayload<T> = {
  status?: string;
  value?: T;
  blockedReason?: string;
};

const DEFAULT_WINDOWS_LOCAL_CDP_EVALUATION_TIMEOUT_MS = 30_000;

const QA_INCIDENT_DEFAULT_RUNTIME_SUPPORTED_FIELD_KEYS = new Set<QaIncidentDefaultFieldKey>([
  "requester",
  "category",
  "subcategory",
  "location",
  "channel",
  "assignmentGroup",
  "assignedTo",
  "state",
  "shortDescription",
  "description",
  "workNotes"
]);

export async function runQaTextFieldAutofillRuntime(
  request: RunQaTextFieldAutofillRuntimeRequest
): Promise<QaAutofillRuntimeResult> {
  const preflightReason = runtimePreflightBlockedReason(request.environment);
  if (preflightReason) {
    return blockedRuntimeResult(preflightReason, false);
  }
  if (request.execute && request.environment.mode !== "qa") {
    return blockedRuntimeResult("qa-only-execute", false);
  }
  if (!request.driver) {
    return blockedRuntimeResult("cdp-endpoint-denied", false);
  }

  const descriptors = getQaAutofillFieldDescriptors();
  let inspection: QaAutofillRuntimeInspection;
  try {
    inspection = await request.driver.inspectAllowedTextFields(descriptors);
  } catch (error) {
    return blockedRuntimeResult(cdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error", true);
  }

  const targetValidation = validateRuntimeCurrentPageTarget(request.environment, inspection.currentUrl);
  const selectorVerification = buildQaAutofillSelectorVerificationFromEvidence({
    fields: inspection.fields,
    unexpectedRequiredFieldCount: inspection.unexpectedRequiredFieldCount
  });

  const unsafeInspectionReason = runtimeInspectionBlockedReason(inspection, selectorVerification, targetValidation.allowed);
  if (unsafeInspectionReason) {
    return {
      status: "blocked",
      blockedReason: unsafeInspectionReason,
      selectorVerification,
      pageFingerprint: undefined,
      pageFingerprintMatched: false,
      safety: runtimeSafety(true)
    };
  }

  if (!request.execute) {
    return {
      status: "verified",
      selectorVerification,
      pageFingerprint: inspection.pageFingerprint,
      pageFingerprintMatched: false,
      safety: runtimeSafety(true)
    };
  }

  const plan = buildQaTextFieldAutofillPlan({
    draft: request.draft,
    environment: request.environment,
    targetUrl: inspection.currentUrl,
    targetValidation,
    approvalPhrase: request.approvalPhrase,
    approvalPageFingerprint: request.approvalPageFingerprint,
    currentPageFingerprint: inspection.pageFingerprint,
    qaIsolationConfirmed: request.qaIsolationConfirmed,
    dedicatedProfileConfirmed: request.dedicatedProfileConfirmed,
    selectorVerification,
    unexpectedRequiredFields: inspection.unexpectedRequiredFieldCount > 0 ? ["redacted-required-field"] : []
  });

  const pageFingerprintMatched = request.approvalPageFingerprint === inspection.pageFingerprint;
  if (plan.status !== "ready-for-autofill") {
    return {
      status: "blocked",
      blockedReason: plan.blockedReason ?? "plan-not-ready",
      selectorVerification,
      pageFingerprint: undefined,
      pageFingerprintMatched,
      plan,
      safety: runtimeSafety(true)
    };
  }

  let beforeFillInspection: QaAutofillRuntimeInspection;
  try {
    beforeFillInspection = await request.driver.inspectAllowedTextFields(descriptors);
  } catch (error) {
    return {
      status: "blocked",
      blockedReason: cdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error",
      selectorVerification,
      pageFingerprint: undefined,
      pageFingerprintMatched,
      plan,
      safety: runtimeSafety(true)
    };
  }
  const beforeFillTargetValidation = validateRuntimeCurrentPageTarget(request.environment, beforeFillInspection.currentUrl);
  const beforeFillSelectorVerification = buildQaAutofillSelectorVerificationFromEvidence({
    fields: beforeFillInspection.fields,
    unexpectedRequiredFieldCount: beforeFillInspection.unexpectedRequiredFieldCount
  });
  const beforeFillReason = runtimeInspectionBlockedReason(
    beforeFillInspection,
    beforeFillSelectorVerification,
    beforeFillTargetValidation.allowed
  );
  if (beforeFillReason || beforeFillInspection.pageFingerprint !== inspection.pageFingerprint) {
    return {
      status: "blocked",
      blockedReason: beforeFillReason ?? "approval-stale-after-page-change",
      selectorVerification: beforeFillSelectorVerification,
      pageFingerprint: undefined,
      pageFingerprintMatched: request.approvalPageFingerprint === beforeFillInspection.pageFingerprint,
      plan,
      safety: runtimeSafety(true)
    };
  }

  let execution: QaAutofillRuntimeFillResult;
  try {
    execution = await request.driver.fillAllowedTextFields({
      operations: plan.operations,
      descriptors,
      expectedPageFingerprint: beforeFillInspection.pageFingerprint,
      allowedHost: beforeFillTargetValidation.allowedHost ?? "",
      executionEnvironmentMode: "qa"
    });
  } catch (error) {
    execution = blockedFillResult(cdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error");
  }
  return {
    status: execution.status,
    blockedReason: execution.blockedReason,
    selectorVerification: beforeFillSelectorVerification,
    pageFingerprint: execution.status === "completed" ? beforeFillInspection.pageFingerprint : undefined,
    pageFingerprintMatched: execution.status === "completed",
    plan,
    execution,
    safety: runtimeSafety(true)
  };
}

export function createCdpQaAutofillRuntimePageDriver(
  options: CdpQaAutofillRuntimePageDriverOptions
): QaAutofillRuntimePageDriver {
  validateLocalCdpEndpoint(options.endpoint);
  return {
    async inspectAllowedTextFields(descriptors) {
      return withCdpClient(options.endpoint, options.targetUrl, (client) =>
        client.evaluate<QaAutofillRuntimeInspection>(buildInspectionExpression(descriptors, hostFromTargetUrl(options.targetUrl) ?? ""))
      );
    },
    async fillAllowedTextFields(request) {
      if (request.operations.some((operation) => operation.kind !== "fill-text")) {
        return blockedFillResult("plan-not-ready");
      }
      return withCdpClient(options.endpoint, options.targetUrl, (client) =>
        client.evaluate<QaAutofillRuntimeFillResult>(buildFillExpression(request))
      );
    }
  };
}

export function createCdpQaIncidentFieldInspectionRuntimePageDriver(
  options: CdpQaAutofillRuntimePageDriverOptions
): QaIncidentFieldRuntimePageDriver {
  validateLocalCdpEndpoint(options.endpoint);
  return {
    async inspectIncidentFormFields() {
      return withCdpClient(options.endpoint, options.targetUrl, (client) =>
        client.evaluate<QaIncidentFieldRuntimeInspection>(
          buildIncidentFieldInspectionExpression(hostFromTargetUrl(options.targetUrl) ?? "")
        )
      );
    }
  };
}

export function createCdpQaIncidentDefaultFieldAutofillRuntimePageDriver(
  options: CdpQaAutofillRuntimePageDriverOptions
): QaIncidentDefaultFieldAutofillRuntimePageDriver {
  try {
    validateLocalCdpEndpoint(options.endpoint);
  } catch {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  return {
    async inspectIncidentFormFields() {
      return withCdpClient(options.endpoint, options.targetUrl, (client) =>
        client.evaluate<QaIncidentFieldRuntimeInspection>(
          buildIncidentFieldInspectionExpression(hostFromTargetUrl(options.targetUrl) ?? "")
        )
      );
    },
    async fillIncidentDefaultFields(request) {
      return withCdpClient(options.endpoint, options.targetUrl, (client) =>
        client.evaluate<QaIncidentDefaultFieldRuntimeFillResult>(buildIncidentDefaultFieldFillExpression(request))
      );
    }
  };
}

export function createWindowsLocalCdpQaIncidentDefaultFieldAutofillRuntimePageDriver(
  options: WindowsLocalCdpRuntimePageDriverOptions
): QaIncidentDefaultFieldAutofillRuntimePageDriver {
  try {
    validateLocalCdpEndpoint(options.endpoint);
  } catch {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  return {
    async inspectIncidentFormFields() {
      return evaluateWithWindowsLocalCdp<QaIncidentFieldRuntimeInspection>(
        options,
        buildIncidentFieldInspectionExpression(hostFromTargetUrl(options.targetUrl) ?? "")
      );
    },
    async fillIncidentDefaultFields(request) {
      return evaluateWithWindowsLocalCdp<QaIncidentDefaultFieldRuntimeFillResult>(
        options,
        buildIncidentDefaultFieldFillExpression(request)
      );
    }
  };
}

export async function runQaIncidentDefaultFieldAutofillRuntime(
  request: RunQaIncidentDefaultFieldAutofillRuntimeRequest
): Promise<QaIncidentDefaultFieldAutofillRuntimeResult> {
  const preflightReason = incidentFieldRuntimePreflightBlockedReason(request.environment);
  if (preflightReason) {
    return blockedDefaultFieldAutofillRuntimeResult(preflightReason, false);
  }
  if (request.execute && request.environment.mode !== "qa") {
    return blockedDefaultFieldAutofillRuntimeResult("qa-only-execute", false);
  }
  if (!request.driver) {
    return blockedDefaultFieldAutofillRuntimeResult("cdp-endpoint-denied", false);
  }
  if (request.plannedFields.length === 0) {
    return blockedDefaultFieldAutofillRuntimeResult("plan-not-ready", false);
  }
  if (request.execute && !request.approvalPageFingerprint?.trim()) {
    return blockedDefaultFieldAutofillRuntimeResult("approval-page-fingerprint-required", false);
  }

  let inspection: QaIncidentFieldRuntimeInspection;
  try {
    inspection = await request.driver.inspectIncidentFormFields();
  } catch (error) {
    return blockedDefaultFieldAutofillRuntimeResult(cdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error", true);
  }

  const targetValidation = validateRuntimeCurrentPageTarget(request.environment, inspection.currentUrl);
  if (!targetValidation.allowed || !targetValidation.allowedHost) {
    return blockedDefaultFieldAutofillRuntimeResult("current-page-target-denied", true);
  }

  if (!request.execute) {
    return {
      status: "verified",
      pageFingerprint: inspection.pageFingerprint,
      pageFingerprintMatched: false,
      filledFields: [],
      blockedFields: [],
      safety: defaultFieldAutofillRuntimeSafety(true)
    };
  }

  const expectedPageFingerprint = request.approvalPageFingerprint?.trim();
  if (!expectedPageFingerprint) {
    return blockedDefaultFieldAutofillRuntimeResult("approval-page-fingerprint-required", true);
  }
  if (expectedPageFingerprint !== inspection.pageFingerprint) {
    return blockedDefaultFieldAutofillRuntimeResult("approval-stale-after-page-change", true);
  }

  const blockedFields = defaultFieldRuntimeBlockedFields(request.plannedFields, inspection.fields);
  if (blockedFields.length > 0) {
    return {
      status: "blocked",
      blockedReason: blockedFields[0]?.blockedReason ?? "unsupported-control-type",
      pageFingerprint: undefined,
      pageFingerprintMatched: true,
      filledFields: [],
      blockedFields,
      safety: defaultFieldAutofillRuntimeSafety(true)
    };
  }

  let execution: QaIncidentDefaultFieldRuntimeFillResult;
  try {
    execution = await request.driver.fillIncidentDefaultFields({
      plannedFields: request.plannedFields,
      expectedPageFingerprint,
      allowedHost: targetValidation.allowedHost,
      executionEnvironmentMode: "qa"
    });
  } catch (error) {
    execution = blockedDefaultFieldFillResult(cdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error");
  }

  return {
    status: execution.status,
    blockedReason: execution.blockedReason,
    pageFingerprint: undefined,
    pageFingerprintMatched: execution.status === "completed",
    filledFields: execution.filledFields,
    blockedFields: execution.blockedFields,
    safety: defaultFieldAutofillRuntimeSafety(true)
  };
}

export async function inspectQaIncidentDefaultFieldsRuntime(
  request: RunQaIncidentFieldInspectionRuntimeRequest
): Promise<QaIncidentFieldRuntimeResult> {
  const preflightReason = incidentFieldRuntimePreflightBlockedReason(request.environment);
  if (preflightReason) {
    return blockedIncidentFieldRuntimeResult(preflightReason, false);
  }
  if (!request.driver) {
    return blockedIncidentFieldRuntimeResult("cdp-endpoint-denied", false);
  }

  let inspection: QaIncidentFieldRuntimeInspection;
  try {
    inspection = await request.driver.inspectIncidentFormFields();
  } catch (error) {
    return blockedIncidentFieldRuntimeResult(cdpRuntimeBlockedReasonFromError(error) ?? "browser-runtime-error", true);
  }

  const targetValidation = validateRuntimeCurrentPageTarget(request.environment, inspection.currentUrl);
  if (!targetValidation.allowed) {
    return blockedIncidentFieldRuntimeResult("current-page-target-denied", true);
  }

  return {
    status: "verified",
    pageFingerprint: inspection.pageFingerprint,
    fields: inspection.fields,
    safety: incidentFieldRuntimeSafety(true)
  };
}

function cdpRuntimeBlockedReasonFromError(error: unknown): QaCdpRuntimeBlockedReason | undefined {
  if (error instanceof QaCdpRuntimeBlockedError) return error.blockedReason;
  if (!error || typeof error !== "object") return undefined;
  const blockedReason = (error as { blockedReason?: unknown }).blockedReason;
  return isCdpRuntimeBlockedReason(blockedReason) ? blockedReason : undefined;
}

function isCdpRuntimeBlockedReason(value: unknown): value is QaCdpRuntimeBlockedReason {
  return value === "cdp-endpoint-denied" || value === "cdp-page-selection-denied" || value === "browser-runtime-error";
}

function incidentFieldRuntimePreflightBlockedReason(
  environment: ServiceNowEnvironmentConfig
): QaIncidentFieldRuntimeBlockedReason | undefined {
  if (environment.mode !== "qa" && environment.mode !== "dev") {
    return "qa-dev-only";
  }
  const configuredTargetValidation = validateServiceNowTargetUrl(environment, environment.url);
  if (!configuredTargetValidation.allowed || !configuredTargetValidation.allowedHost) {
    return "current-page-target-denied";
  }
  return undefined;
}

function runtimePreflightBlockedReason(environment: ServiceNowEnvironmentConfig): QaAutofillRuntimeBlockedReason | undefined {
  if (environment.mode !== "qa" && environment.mode !== "dev") {
    return "qa-dev-only";
  }
  const configuredTargetValidation = validateServiceNowTargetUrl(environment, environment.url);
  if (!configuredTargetValidation.allowed || !configuredTargetValidation.allowedHost) {
    return "current-page-target-denied";
  }
  return undefined;
}

function blockedRuntimeResult(
  blockedReason: QaAutofillRuntimeBlockedReason,
  browserAutomationCalled: boolean
): QaAutofillRuntimeResult {
  return {
    status: "blocked",
    blockedReason,
    pageFingerprintMatched: false,
    safety: runtimeSafety(browserAutomationCalled)
  };
}

function blockedIncidentFieldRuntimeResult(
  blockedReason: QaIncidentFieldRuntimeBlockedReason,
  browserAutomationCalled: boolean,
  pageFingerprint?: string
): QaIncidentFieldRuntimeResult {
  return {
    status: "blocked",
    blockedReason,
    pageFingerprint,
    fields: [],
    safety: incidentFieldRuntimeSafety(browserAutomationCalled)
  };
}

function validateRuntimeCurrentPageTarget(
  environment: ServiceNowEnvironmentConfig,
  currentUrl: string
): ServiceNowTargetValidationResult {
  const configuredTargetValidation = validateServiceNowTargetUrl(environment, environment.url);
  if (!configuredTargetValidation.allowed || !environment.url) {
    return configuredTargetValidation;
  }

  let current: URL;
  let configured: URL;
  try {
    current = new URL(currentUrl);
    configured = new URL(environment.url);
  } catch {
    return {
      allowed: false,
      reason: "invalid-url",
      allowedHost: configuredTargetValidation.allowedHost
    };
  }

  const currentHost = current.host.toLowerCase();
  const allowedHost = configured.host.toLowerCase();
  if (current.username || current.password) {
    return {
      allowed: false,
      reason: "credentials-in-url-denied",
      host: currentHost,
      allowedHost
    };
  }
  if (current.protocol !== "https:") {
    return {
      allowed: false,
      reason: "https-required",
      host: currentHost,
      allowedHost
    };
  }
  if (currentHost !== allowedHost) {
    return {
      allowed: false,
      reason: "host-not-allowlisted",
      host: currentHost,
      allowedHost
    };
  }

  return {
    ...configuredTargetValidation,
    targetUrl: environment.url,
    host: currentHost,
    allowedHost
  };
}

function runtimeInspectionBlockedReason(
  inspection: QaAutofillRuntimeInspection,
  selectorVerification: QaAutofillSelectorVerification,
  targetAllowed: boolean
): QaAutofillRuntimeBlockedReason | undefined {
  if (!targetAllowed) return "current-page-target-denied";
  if (inspection.unexpectedRequiredFieldCount > 0) return "unexpected-required-field";
  if (Object.values(selectorVerification).some((status) => status === "ambiguous")) return "selector-mismatch";
  if (Object.values(selectorVerification).some((status) => status !== "found")) return "selector-verification-required";
  return undefined;
}

function runtimeSafety(browserAutomationCalled: boolean): QaAutofillRuntimeResult["safety"] {
  return {
    browserProcessLaunched: false,
    browserAutomationCalled,
    realServiceNowApiCalled: false,
    noServiceNowWrite: true,
    noSaveSubmitUpdateClose: true,
    noSaveSubmitUpdateResolveClose: true,
    artifactsCaptured: false,
    productionWriteAllowed: false
  };
}

function incidentFieldRuntimeSafety(browserAutomationCalled: boolean): QaIncidentFieldRuntimeResult["safety"] {
  return {
    browserProcessLaunched: false,
    browserAutomationCalled,
    realServiceNowApiCalled: false,
    noServiceNowWrite: true,
    noSaveSubmitUpdateClose: true,
    noSaveSubmitUpdateResolveClose: true,
    artifactsCaptured: false,
    productionWriteAllowed: false
  };
}

function defaultFieldAutofillRuntimeSafety(
  browserAutomationCalled: boolean
): QaIncidentDefaultFieldAutofillRuntimeResult["safety"] {
  return {
    browserProcessLaunched: false,
    browserAutomationCalled,
    realServiceNowApiCalled: false,
    noServiceNowWrite: true,
    noSaveSubmitUpdateClose: true,
    noSaveSubmitUpdateResolveClose: true,
    artifactsCaptured: false,
    productionWriteAllowed: false
  };
}

const qaIncidentDefaultFieldIdentityCandidates: Record<QaIncidentDefaultFieldKey, string[]> = {
  requester: ["incident.caller_id", "incident.opened_for", "incident.requested_for", "caller_id", "opened_for", "requested_for"],
  category: ["incident.category", "category"],
  subcategory: ["incident.subcategory", "subcategory"],
  location: ["incident.location", "location"],
  channel: ["incident.contact_type", "incident.u_channel", "incident.channel", "contact_type", "u_channel", "channel"],
  impact: ["incident.impact", "impact"],
  urgency: ["incident.urgency", "urgency"],
  assignmentGroup: ["incident.assignment_group", "assignment_group"],
  assignedTo: ["incident.assigned_to", "assigned_to"],
  state: ["incident.state", "incident.incident_state", "incident_state", "state"],
  shortDescription: ["incident.short_description", "short_description"],
  description: ["incident.description", "description"],
  workNotes: ["incident.work_notes", "work_notes"]
};

const qaIncidentDefaultFieldCanonicalLabels: Record<QaIncidentDefaultFieldKey, string> = {
  requester: "requester",
  category: "category",
  subcategory: "subcategory",
  location: "location",
  channel: "channel",
  impact: "impact",
  urgency: "urgency",
  assignmentGroup: "assignment group",
  assignedTo: "assigned to",
  state: "state",
  shortDescription: "short description",
  description: "description",
  workNotes: "work notes"
};

function defaultFieldRuntimeBlockedFields(
  plannedFields: QaIncidentDefaultFieldRuntimeFillRequest["plannedFields"],
  evidenceFields: QaIncidentFormFieldEvidence[]
): QaIncidentDefaultFieldRuntimeBlockedField[] {
  const blockedFields: QaIncidentDefaultFieldRuntimeBlockedField[] = [];
  for (const plannedField of plannedFields) {
    const matches = evidenceFields.filter((evidence) => evidenceMatchesDefaultField(evidence, plannedField.key));
    const matchedEvidence = matches[0];
    const blockedBase = {
      key: plannedField.key,
      label: plannedField.label,
      valueLength: plannedField.valueLength,
      ...(matchedEvidence?.type ? { controlType: matchedEvidence.type } : {})
    };
    if (!matchedEvidence) {
      blockedFields.push({ ...blockedBase, blockedReason: "field-control-missing" });
      continue;
    }
    const visibleControlCount = matchedEvidence.visibleControlCount ?? matchedEvidence.matchedControlCount ?? 1;
    if (matches.length > 1 || visibleControlCount !== 1) {
      blockedFields.push({ ...blockedBase, blockedReason: "field-control-ambiguous" });
      continue;
    }
    if (!matchedEvidence.writable) {
      blockedFields.push({ ...blockedBase, blockedReason: "non-writable-control" });
      continue;
    }
    if (plannedField.manualConfirmationRequired || plannedField.source === "operator-confirmation-required") {
      blockedFields.push({ ...blockedBase, blockedReason: "operator-confirmation-required" });
      continue;
    }
    if (isDefaultReferenceField(plannedField.key) && !isDisplaySafeReferenceValue(plannedField.key, plannedField.value)) {
      blockedFields.push({ ...blockedBase, blockedReason: "reference-value-not-display-safe" });
      continue;
    }
    if (
      QA_INCIDENT_DEFAULT_RUNTIME_SUPPORTED_FIELD_KEYS.has(plannedField.key) &&
      defaultFieldControlTypeMatches(plannedField.key, matchedEvidence.type)
    ) {
      continue;
    }
    blockedFields.push({
      ...blockedBase,
      blockedReason: "unsupported-control-type"
    });
  }
  return blockedFields;
}

function defaultFieldControlTypeMatches(key: QaIncidentDefaultFieldKey, actual: QaIncidentFormFieldType): boolean {
  const expected = defaultFieldExpectedControlType(key);
  if (!expected) return false;
  if (expected === actual) return true;
  return expected === "select" && actual === "choice";
}

function defaultFieldExpectedControlType(key: QaIncidentDefaultFieldKey): QaIncidentFormFieldType | undefined {
  if (["requester", "location", "assignmentGroup", "assignedTo"].includes(key)) return "reference";
  if (["category", "subcategory", "channel", "state"].includes(key)) return "select";
  if (key === "shortDescription") return "text";
  if (key === "description" || key === "workNotes") return "textarea";
  return undefined;
}

function isDefaultReferenceField(key: QaIncidentDefaultFieldKey): boolean {
  return defaultFieldExpectedControlType(key) === "reference";
}

function isDisplaySafeReferenceValue(key: QaIncidentDefaultFieldKey, value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (/^[a-f0-9]{32}$/i.test(trimmed)) return false;
  const identity = normalizeDefaultFieldIdentity(trimmed);
  return !qaIncidentDefaultFieldIdentityCandidates[key].some(
    (candidate) => identity === candidate || identity.endsWith(`.${candidate}`) || identity === `sys_display.${candidate}`
  );
}

function evidenceMatchesDefaultField(evidence: QaIncidentFormFieldEvidence, key: QaIncidentDefaultFieldKey): boolean {
  const identities = [evidence.name, evidence.id]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalizeDefaultFieldIdentity);
  const candidates = qaIncidentDefaultFieldIdentityCandidates[key];
  if (
    identities.some((identity) =>
      candidates.some((candidate) => identity === candidate || identity.endsWith(`.${candidate}`) || identity === `sys_display.${candidate}`)
    )
  ) {
    return true;
  }
  const label = normalizeDefaultFieldText(evidence.label ?? "");
  return Boolean(label && label === qaIncidentDefaultFieldCanonicalLabels[key]);
}

function normalizeDefaultFieldIdentity(value: string): string {
  return value.trim().toLowerCase().replace(/^sys_display\./, "");
}

function normalizeDefaultFieldText(value: string): string {
  return value.replace(/[\n\r\t]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase().replace(/^\*\s*/, "");
}

function blockedDefaultFieldAutofillRuntimeResult(
  blockedReason: QaIncidentDefaultFieldRuntimeFillBlockedReason,
  browserAutomationCalled: boolean
): QaIncidentDefaultFieldAutofillRuntimeResult {
  return {
    status: "blocked",
    blockedReason,
    pageFingerprint: undefined,
    pageFingerprintMatched: false,
    filledFields: [],
    blockedFields: [],
    safety: defaultFieldAutofillRuntimeSafety(browserAutomationCalled)
  };
}

function blockedDefaultFieldFillResult(
  blockedReason: QaIncidentDefaultFieldRuntimeFillBlockedReason
): QaIncidentDefaultFieldRuntimeFillResult {
  return {
    status: "blocked",
    blockedReason,
    filledFields: [],
    blockedFields: [],
    writeActionsAttempted: false,
    artifactsCaptured: false,
    serviceNowApiCalled: false,
    browserProcessLaunched: false,
    stoppedBeforeSaveSubmitUpdateClose: true,
    stoppedBeforeSaveSubmitUpdateResolveClose: true
  };
}

function blockedFillResult(blockedReason: QaAutofillRuntimeBlockedReason): QaAutofillRuntimeFillResult {
  return {
    status: "blocked",
    blockedReason,
    filledFields: [],
    writeActionsAttempted: false,
    artifactsCaptured: false,
    serviceNowApiCalled: false,
    browserProcessLaunched: false,
    stoppedBeforeSaveSubmitUpdateClose: true,
    stoppedBeforeSaveSubmitUpdateResolveClose: true
  };
}

async function evaluateWithWindowsLocalCdp<T>(options: WindowsLocalCdpRuntimePageDriverOptions, expression: string): Promise<T> {
  const timeoutMs = normalizeWindowsLocalCdpTimeoutMs(options.timeoutMs);
  const input = JSON.stringify({
    endpoint: options.endpoint,
    targetUrl: options.targetUrl,
    expressionBase64: Buffer.from(expression, "utf8").toString("base64")
  });

  let payload: WindowsLocalCdpEvaluationPayload<T>;
  try {
    payload = await runWindowsLocalCdpEvaluationHelper<T>({
      powershellExecutable: options.powershellExecutable ?? "powershell.exe",
      helperScriptPath: options.helperScriptPath,
      input,
      timeoutMs
    });
  } catch {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }

  if (payload.status !== "completed" || payload.value === undefined) {
    throw new QaCdpRuntimeBlockedError(safeCdpRuntimeBlockedReason(payload.blockedReason));
  }

  return payload.value;
}

function safeCdpRuntimeBlockedReason(blockedReason: string | undefined): QaCdpRuntimeBlockedReason {
  return isCdpRuntimeBlockedReason(blockedReason) ? blockedReason : "browser-runtime-error";
}

function normalizeWindowsLocalCdpTimeoutMs(timeoutMs: number | undefined): number {
  if (!Number.isFinite(timeoutMs) || timeoutMs === undefined) {
    return DEFAULT_WINDOWS_LOCAL_CDP_EVALUATION_TIMEOUT_MS;
  }
  return Math.min(120_000, Math.max(1, Math.round(timeoutMs)));
}

function runWindowsLocalCdpEvaluationHelper<T>(input: {
  powershellExecutable: string;
  helperScriptPath: string;
  input: string;
  timeoutMs: number;
}): Promise<WindowsLocalCdpEvaluationPayload<T>> {
  return new Promise((resolve, reject) => {
    const child = spawn(input.powershellExecutable, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", input.helperScriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new Error("Windows local browser debugging evaluation timed out."));
    }, input.timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > 1_000_000) {
        stdout = stdout.slice(-1_000_000);
      }
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      if (stderr.length > 100_000) {
        stderr = stderr.slice(-100_000);
      }
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      reject(error);
    });

    child.on("close", () => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      try {
        const parsed = JSON.parse(stdout.trim()) as WindowsLocalCdpEvaluationPayload<T>;
        resolve(parsed);
      } catch {
        reject(new Error("Windows local browser debugging helper returned invalid JSON."));
      }
    });

    child.stdin.end(input.input, "utf8");
  });
}

async function withCdpClient<T>(endpoint: string, targetUrl: string | undefined, callback: (client: CdpClient) => Promise<T>): Promise<T> {
  const webSocketUrl = await resolveCdpPageWebSocketUrl(endpoint, targetUrl);
  let client: CdpClient;
  try {
    client = await CdpClient.connect(webSocketUrl);
  } catch {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  try {
    return await callback(client);
  } finally {
    client.close();
  }
}

type CdpPageTarget = { type?: string; url?: string; webSocketDebuggerUrl?: string };

async function resolveCdpPageWebSocketUrl(endpoint: string, targetUrl?: string): Promise<string> {
  let url: URL;
  try {
    validateLocalCdpEndpoint(endpoint);
    url = new URL(endpoint);
  } catch {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  if (url.protocol === "ws:") {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }

  const listUrl = new URL("/json/list", url);
  let response: Response;
  try {
    response = await fetch(listUrl);
  } catch {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  if (!response.ok) {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  const pages = (await response.json()) as CdpPageTarget[];
  const pageTargets = pages.filter((page) => page.type === "page" && page.webSocketDebuggerUrl);
  const selectedTarget = selectCdpPageTarget(pageTargets, targetUrl);
  if (!selectedTarget?.webSocketDebuggerUrl) {
    throw new QaCdpRuntimeBlockedError("cdp-page-selection-denied");
  }
  const webSocketUrl = selectedTarget.webSocketDebuggerUrl;
  try {
    validateLocalCdpEndpoint(webSocketUrl);
  } catch {
    throw new QaCdpRuntimeBlockedError("cdp-endpoint-denied");
  }
  return webSocketUrl;
}

function selectCdpPageTarget(pageTargets: CdpPageTarget[], targetUrl?: string): CdpPageTarget | undefined {
  const configuredHost = hostFromTargetUrl(targetUrl);
  if (!configuredHost) return undefined;

  const configuredHostTargets = pageTargets.filter((target) => pageTargetMatchesHost(target, configuredHost));
  const configuredIncidentTargets = configuredHostTargets.filter(isLikelyIncidentPageTarget);
  const configuredIncidentTarget = single(configuredIncidentTargets);
  if (configuredIncidentTarget) return configuredIncidentTarget;
  const configuredHostTarget = single(configuredHostTargets);
  if (configuredHostTarget) return configuredHostTarget;
  return undefined;
}

function hostFromTargetUrl(targetUrl?: string): string | undefined {
  if (!targetUrl?.trim()) return undefined;
  try {
    const url = new URL(targetUrl);
    if (url.protocol !== "https:" || url.username || url.password) return undefined;
    return url.host.toLowerCase();
  } catch {
    return undefined;
  }
}

function pageTargetMatchesHost(target: CdpPageTarget, host: string): boolean {
  const url = parsePageTargetUrl(target.url);
  return Boolean(url && url.protocol === "https:" && !url.username && !url.password && url.host.toLowerCase() === host);
}

function isLikelyIncidentPageTarget(target: CdpPageTarget): boolean {
  const url = parsePageTargetUrl(target.url);
  if (!url) return false;
  const decodedLocation = decodeForTargetSelection(`${url.pathname}${url.search}`);
  return decodedLocation.toLowerCase().includes("incident.do");
}

function parsePageTargetUrl(value?: string): URL | undefined {
  if (!value?.trim()) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

function decodeForTargetSelection(value: string): string {
  let current = value;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!current.includes("%")) break;
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
}

function single<T>(items: T[]): T | undefined {
  return items.length === 1 ? items[0] : undefined;
}

/**
 * Validates that a CDP endpoint is a local-loopback URL (localhost/127.0.0.1/::1).
 *
 * WSL 2 NAT barrier: `127.0.0.1` in WSL is NOT the same as `127.0.0.1` on Windows.
 * This function ONLY validates local-loopback syntax and does NOT verify that the
 * endpoint is reachable. The WSL CLI must NEVER create a live CDP driver from WSL
 * because the connection will target WSL's own loopback, not the Windows CDP port.
 * Live CDP execution from WSL requires the Windows-side Electron operator.
 */
function validateLocalCdpEndpoint(endpoint: string): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("CDP endpoint must be a local http:// or ws:// URL.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (!["http:", "ws:"].includes(url.protocol) || url.username || url.password || !localHosts.has(url.hostname)) {
    throw new Error("CDP endpoint must be local and must use http:// or ws://.");
  }
}

type CdpResponse = {
  id?: number;
  result?: {
    result?: {
      value?: unknown;
      unserializableValue?: unknown;
    };
    exceptionDetails?: unknown;
  };
  error?: {
    message?: string;
  };
};

class CdpClient {
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();

  private constructor(private readonly socket: WebSocket) {
    this.socket.addEventListener("message", (event) => {
      const response = JSON.parse(String(event.data)) as CdpResponse;
      if (!response.id) return;
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      if (response.error) {
        pending.reject(new Error(response.error.message ?? "CDP command failed."));
        return;
      }
      pending.resolve(response.result);
    });
    this.socket.addEventListener("error", () => {
      for (const pending of Array.from(this.pending.values())) {
        pending.reject(new Error("Local browser debugging connection failed."));
      }
      this.pending.clear();
    });
  }

  static connect(webSocketUrl: string): Promise<CdpClient> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(webSocketUrl);
      socket.addEventListener("open", () => resolve(new CdpClient(socket)), { once: true });
      socket.addEventListener("error", () => reject(new Error("Unable to connect to the local browser debugging endpoint.")), {
        once: true
      });
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    const runtimeResult = result as { result?: { value?: unknown }; exceptionDetails?: unknown };
    if (runtimeResult.exceptionDetails) {
      throw new Error("Browser runtime evaluation failed.");
    }
    return runtimeResult.result?.value as T;
  }

  close(): void {
    this.socket.close();
  }

  private send(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(payload);
    });
  }
}

function buildInspectionExpression(descriptors: QaAutofillFieldDescriptor[], allowedHost: string): string {
  return `(${inspectionScript})(${JSON.stringify(descriptors)}, ${JSON.stringify(allowedHost)})`;
}

function buildIncidentFieldInspectionExpression(allowedHost: string): string {
  return `(${incidentFieldInspectionScript})(${JSON.stringify(allowedHost)})`;
}

function buildIncidentDefaultFieldFillExpression(request: QaIncidentDefaultFieldRuntimeFillRequest): string {
  const sanitizedRequest = {
    plannedFields: request.plannedFields.map((field) => ({
      key: field.key,
      label: field.label,
      value: field.value,
      valueLength: field.valueLength,
      source: field.source,
      manualConfirmationRequired: field.manualConfirmationRequired
    })),
    expectedPageFingerprint: request.expectedPageFingerprint,
    allowedHost: request.allowedHost.toLowerCase(),
    executionEnvironmentMode: request.executionEnvironmentMode
  };
  return `(${incidentDefaultFieldFillScript})(${JSON.stringify(sanitizedRequest)}, ${JSON.stringify(
    incidentFieldInspectionScript.toString()
  )})`;
}

function buildFillExpression(request: QaAutofillRuntimeFillRequest): string {
  const sanitizedRequest = {
    operations: request.operations.map((operation) => ({
      kind: operation.kind,
      fieldKey: operation.fieldKey,
      label: operation.label,
      selectors: operation.selectors,
      value: operation.value
    })),
    descriptors: request.descriptors.map((descriptor) => ({
      key: descriptor.key,
      label: descriptor.label,
      type: descriptor.type,
      selectors: descriptor.selectors
    })),
    expectedPageFingerprint: request.expectedPageFingerprint,
    allowedHost: request.allowedHost.toLowerCase(),
    executionEnvironmentMode: request.executionEnvironmentMode
  };
  return `(${fillScript})(${JSON.stringify(sanitizedRequest)})`;
}

const incidentDefaultFieldFillScript = async (
  request: {
    plannedFields: Array<{
      key: QaIncidentDefaultFieldKey;
      label: string;
      value: string;
      valueLength: number;
      source?: QaIncidentDefaultPlannedField["source"];
      manualConfirmationRequired?: true;
    }>;
    expectedPageFingerprint?: string;
    allowedHost: string;
    executionEnvironmentMode?: "qa";
  },
  inspectionScriptSource: string
): Promise<QaIncidentDefaultFieldRuntimeFillResult> => {
  const expectedPageFingerprint = request.expectedPageFingerprint?.trim();
  if (!expectedPageFingerprint) {
    return blocked("approval-page-fingerprint-required");
  }

  if (request.executionEnvironmentMode !== "qa") {
    return blocked("qa-only-execute");
  }

  if (!currentPageTargetAllowed(request.allowedHost)) {
    return blocked("current-page-target-denied");
  }

  const inspect = (0, eval)(`(${inspectionScriptSource})`) as (allowedHost?: string) => Promise<QaIncidentFieldRuntimeInspection>;
  const inspection = await inspect(request.allowedHost);
  if (!currentPageTargetAllowed(request.allowedHost)) {
    return blocked("current-page-target-denied");
  }
  if (inspection.pageFingerprint !== expectedPageFingerprint) {
    return blocked("approval-stale-after-page-change");
  }

  const documents = collectSameOriginDocuments();
  const unsupportedFields = request.plannedFields.filter(
    (field) =>
      field.manualConfirmationRequired ||
      field.source === "operator-confirmation-required" ||
      !isRuntimeSupportedDefaultField(field.key)
  );
  if (unsupportedFields.length > 0) {
    const blockedReason = unsupportedFields.some(
      (field) => field.manualConfirmationRequired || field.source === "operator-confirmation-required"
    )
      ? "operator-confirmation-required"
      : "unsupported-control-type";
    return blocked(
      blockedReason,
      unsupportedFields.map((field) => blockedIncidentDefaultField(field, documents))
    );
  }
  const fillTargets: Array<{
    field: (typeof request.plannedFields)[number];
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    selectOptionValue?: string;
  }> = [];

  for (const field of request.plannedFields) {
    const control = findIncidentControl(documents, field.key, field.label);
    if (!control) return blocked("field-control-missing", [blockedRuntimeDefaultField(field, undefined, "field-control-missing")]);
    if (control.ambiguous) {
      return blocked("field-control-ambiguous", [blockedRuntimeDefaultField(field, control.element, "field-control-ambiguous")]);
    }
    if (!runtimeDefaultControlMatches(control.element, field.key)) {
      return blocked("unsupported-control-type", [blockedRuntimeDefaultField(field, control.element, "unsupported-control-type")]);
    }
    if (!isWritable(control.element)) {
      return blocked("non-writable-control", [blockedRuntimeDefaultField(field, control.element, "non-writable-control")]);
    }
    if (isReferenceField(field.key) && !isReferenceDisplayValueSafe(field.key, field.value)) {
      return blocked("reference-value-not-display-safe", [
        blockedRuntimeDefaultField(field, control.element, "reference-value-not-display-safe")
      ]);
    }
    const fillTarget = resolveFillTarget(control.element, field.value);
    if (fillTarget.status !== "ok") {
      return blocked(fillTarget.status, [blockedRuntimeDefaultField(field, control.element, fillTarget.status)]);
    }
    fillTargets.push({
      field,
      element: control.element,
      ...(fillTarget.selectOptionValue === undefined ? {} : { selectOptionValue: fillTarget.selectOptionValue })
    });
  }

  const filledFields: QaIncidentDefaultFieldRuntimeFillResult["filledFields"] = [];
  for (const target of fillTargets) {
    applyFillTarget(target.element, target.field.key, target.field.value, target.selectOptionValue);
    filledFields.push({
      key: target.field.key,
      label: target.field.label,
      valueLength: target.field.value.length
    });
  }

  return {
    status: "completed",
    filledFields,
    blockedFields: [],
    writeActionsAttempted: false,
    artifactsCaptured: false,
    serviceNowApiCalled: false,
    browserProcessLaunched: false,
    stoppedBeforeSaveSubmitUpdateClose: true,
    stoppedBeforeSaveSubmitUpdateResolveClose: true
  };

  function blocked(
    blockedReason: QaIncidentDefaultFieldRuntimeFillBlockedReason,
    blockedFields: QaIncidentDefaultFieldRuntimeBlockedField[] = []
  ): QaIncidentDefaultFieldRuntimeFillResult {
    return {
      status: "blocked",
      blockedReason,
      filledFields: [],
      blockedFields,
      writeActionsAttempted: false,
      artifactsCaptured: false,
      serviceNowApiCalled: false,
      browserProcessLaunched: false,
      stoppedBeforeSaveSubmitUpdateClose: true,
      stoppedBeforeSaveSubmitUpdateResolveClose: true
    };
  }

  function blockedIncidentDefaultField(
    field: (typeof request.plannedFields)[number],
    docs: Document[]
  ): QaIncidentDefaultFieldRuntimeBlockedField {
    const control = findIncidentControl(docs, field.key, field.label);
    const base = {
      key: field.key,
      label: field.label,
      valueLength: field.valueLength,
      ...(control?.element ? { controlType: runtimeIncidentControlType(control.element, field.key) } : {})
    };
    if (!control) return { ...base, blockedReason: "field-control-missing" };
    if (control.ambiguous) return { ...base, blockedReason: "field-control-ambiguous" };
    if (!isWritable(control.element)) return { ...base, blockedReason: "non-writable-control" };
    return {
      ...base,
      blockedReason:
        field.manualConfirmationRequired || field.source === "operator-confirmation-required"
          ? "operator-confirmation-required"
          : "unsupported-control-type"
    };
  }

  function blockedRuntimeDefaultField(
    field: (typeof request.plannedFields)[number],
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | undefined,
    blockedReason: QaIncidentDefaultFieldRuntimeBlockedFieldReason
  ): QaIncidentDefaultFieldRuntimeBlockedField {
    return {
      key: field.key,
      label: field.label,
      valueLength: field.valueLength,
      ...(element ? { controlType: runtimeIncidentControlType(element, field.key) } : {}),
      blockedReason
    };
  }

  function runtimeIncidentControlType(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    key: QaIncidentDefaultFieldKey
  ): QaIncidentFormFieldType {
    if (isTextAreaControl(element)) return "textarea";
    if (isReferenceField(key)) return "reference";
    if (isSelectControl(element)) return "select";
    if (isTextInputControl(element)) return "text";
    return "other";
  }

  function currentPageTargetAllowed(allowedHost: string): boolean {
    if (!allowedHost) return false;
    try {
      const current = new URL(globalThis.location.href);
      return current.protocol === "https:" && !current.username && !current.password && current.host.toLowerCase() === allowedHost.toLowerCase();
    } catch {
      return false;
    }
  }

  function collectSameOriginDocuments(): Document[] {
    const docs: Document[] = [globalThis.document];
    const visit = (win: Window) => {
      for (const frame of Array.from(win.frames)) {
        try {
          const doc = frame.document;
          docs.push(doc);
          visit(frame);
        } catch {
          // Cross-origin frames are ignored. Editable ServiceNow form controls must be same-origin.
        }
      }
    };
    visit(globalThis.window);
    return docs;
  }

  function findIncidentControl(
    docs: Document[],
    key: QaIncidentDefaultFieldKey,
    label: string
  ): { element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement; ambiguous: boolean } | null {
    const scored: Array<{ element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement; score: number }> = [];
    for (const doc of docs) {
      for (const element of Array.from(doc.querySelectorAll("input, textarea, select"))) {
        if (!isIncidentControlElement(element)) continue;
        if (!isVisibleElement(element)) continue;
        const score = scoreControl(element, key, label);
        if (score > 0) scored.push({ element, score });
      }
    }
    if (scored.length === 0) return null;
    scored.sort((left, right) => right.score - left.score);
    const bestScore = scored[0].score;
    const best = scored.filter((candidate) => candidate.score === bestScore);
    const writableBest = best.filter((candidate) => isWritable(candidate.element));
    if (writableBest.length > 1) return { element: writableBest[0].element, ambiguous: true };
    if (writableBest.length === 1) return { element: writableBest[0].element, ambiguous: false };
    return { element: best[0].element, ambiguous: false };
  }

  function scoreControl(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, key: QaIncidentDefaultFieldKey, label: string): number {
    const candidates = fieldIdentityCandidates(key);
    const name = normalizeIdentity(element.getAttribute("name") ?? "");
    const id = normalizeIdentity(element.getAttribute("id") ?? "");
    const aria = normalizeText(element.getAttribute("aria-label") ?? "");
    const title = normalizeText(element.getAttribute("title") ?? "");
    const associated = normalizeText(associatedLabelText(element));
    const canonical = normalizeText(label);
    if (isInputControl(element) && element.type === "hidden") return 0;
    if (isReferenceField(key) && !isReferenceDisplayControl(element, candidates)) return 0;
    let score = 0;
    for (const candidate of candidates) {
      if (name === candidate || id === candidate) score = Math.max(score, 140);
      if (name === `sys_display.${candidate}` || id === `sys_display.${candidate}`) score = Math.max(score, 135);
      if (name.endsWith(`.${candidate}`) || id.endsWith(`.${candidate}`)) score = Math.max(score, 120);
      const suffix = candidate.split(".").pop() ?? candidate;
      if (name.endsWith(`.${suffix}`) || id.endsWith(`.${suffix}`)) score = Math.max(score, 110);
    }
    if (canonical && (associated === canonical || aria === canonical || title === canonical)) score = Math.max(score, 90);
    if (canonical && (associated.includes(canonical) || aria.includes(canonical) || title.includes(canonical))) score = Math.max(score, 70);
    if (!preferredElementTypeMatches(element, key)) score -= 40;
    return score;
  }

  function isReferenceDisplayControl(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    candidates: string[]
  ): boolean {
    if (!isTextInputControl(element)) return false;
    const name = normalizeIdentity(element.getAttribute("name") ?? "");
    const id = normalizeIdentity(element.getAttribute("id") ?? "");
    return candidates.some((candidate) => name === `sys_display.${candidate}` || id === `sys_display.${candidate}`);
  }

  function resolveFillTarget(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    value: string
  ): { status: "ok"; selectOptionValue?: string } | { status: "field-option-not-found" } {
    if (!isSelectControl(element)) return { status: "ok" };
    const option = findSelectOption(element, value);
    if (!option) return { status: "field-option-not-found" };
    return { status: "ok", selectOptionValue: option.value };
  }

  function applyFillTarget(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    key: QaIncidentDefaultFieldKey,
    value: string,
    selectOptionValue: string | undefined
  ): void {
    if (isSelectControl(element)) {
      setNativeSelectValue(element, selectOptionValue ?? value);
      dispatchFieldEvents(element);
      return;
    }

    setNativeTextValue(element, value);
    dispatchFieldEvents(element);
    if (isReferenceField(key)) {
      element.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  }

  function findSelectOption(
    element: HTMLSelectElement,
    value: string
  ): { value: string; label?: string; text?: string; textContent?: string | null } | undefined {
    const normalizedTarget = normalizeText(value);
    return Array.from(element.options as Iterable<{ value: string; label?: string; text?: string; textContent?: string | null }>).find(
      (option) => {
        if (option.value === value) return true;
        const optionText = normalizeText(option.textContent ?? option.text ?? option.label ?? "");
        return Boolean(normalizedTarget && optionText === normalizedTarget);
      }
    );
  }

  function setNativeTextValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    const ownerWindow = element.ownerDocument.defaultView as (Window & typeof globalThis) | null;
    const constructor = isTextAreaControl(element)
      ? ownerWindow?.HTMLTextAreaElement ?? globalThis.HTMLTextAreaElement
      : ownerWindow?.HTMLInputElement ?? globalThis.HTMLInputElement;
    const descriptor = constructor ? Object.getOwnPropertyDescriptor(constructor.prototype, "value") : undefined;
    if (descriptor?.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  }

  function setNativeSelectValue(element: HTMLSelectElement, value: string): void {
    const ownerWindow = element.ownerDocument.defaultView as (Window & typeof globalThis) | null;
    const constructor = ownerWindow?.HTMLSelectElement ?? globalThis.HTMLSelectElement;
    const descriptor = constructor ? Object.getOwnPropertyDescriptor(constructor.prototype, "value") : undefined;
    if (descriptor?.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  }

  function dispatchFieldEvents(element: HTMLElement): void {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function isWritable(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
    if (isInputControl(element) || isTextAreaControl(element)) {
      return !element.disabled && !element.readOnly && element.getAttribute("aria-disabled") !== "true";
    }
    return !element.disabled && element.getAttribute("aria-disabled") !== "true";
  }

  function isVisibleElement(element: Element): boolean {
    try {
      const rect = element.getBoundingClientRect();
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style?.display !== "none" && style?.visibility !== "hidden";
    } catch {
      return false;
    }
  }

  function associatedLabelText(element: Element): string {
    const doc = element.ownerDocument;
    const id = element.getAttribute("id") ?? "";
    const directLabel = id ? doc.querySelector(`label[for="${escapeAttributeSelectorValue(id)}"]`)?.textContent ?? "" : "";
    const container = element.closest(".form-group, .form-field, .sn-form-field, .control, tr, td, div");
    const containerLabel = container?.querySelector("label, .label, .control-label, .form-control-label")?.textContent ?? "";
    return cleanLabelText(directLabel || containerLabel);
  }

  function cleanLabelText(text: string): string {
    return text.replace(/[\\n\\r\\t]+/g, " ").replace(/\s+/g, " ").replace(/^\*\s*/, "").trim();
  }

  function escapeAttributeSelectorValue(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function normalizeIdentity(value: string): string {
    return value.trim().toLowerCase().replace(/^sys_display\./, "sys_display.");
  }

  function normalizeText(value: string): string {
    return value.replace(/[\\n\\r\\t]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function fieldIdentityCandidates(key: QaIncidentDefaultFieldKey): string[] {
    const map: Record<QaIncidentDefaultFieldKey, string[]> = {
      requester: ["incident.caller_id", "incident.opened_for", "incident.requested_for"],
      category: ["incident.category"],
      subcategory: ["incident.subcategory"],
      location: ["incident.location"],
      channel: ["incident.contact_type", "incident.u_channel", "incident.channel"],
      impact: ["incident.impact"],
      urgency: ["incident.urgency"],
      assignmentGroup: ["incident.assignment_group"],
      assignedTo: ["incident.assigned_to"],
      state: ["incident.state", "incident.incident_state"],
      shortDescription: ["incident.short_description"],
      description: ["incident.description"],
      workNotes: ["incident.work_notes"]
    };
    return map[key];
  }

  function isRuntimeSupportedDefaultField(key: QaIncidentDefaultFieldKey): boolean {
    return [
      "requester",
      "category",
      "subcategory",
      "location",
      "channel",
      "assignmentGroup",
      "assignedTo",
      "state",
      "shortDescription",
      "description",
      "workNotes"
    ].includes(key);
  }

  function preferredElementTypeMatches(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, key: QaIncidentDefaultFieldKey): boolean {
    if (isReferenceField(key)) return isReferenceDisplayControl(element, fieldIdentityCandidates(key));
    if (isSelectField(key)) return isSelectControl(element);
    if (key === "shortDescription") return isTextInputControl(element);
    if (key === "description" || key === "workNotes") return isTextAreaControl(element);
    return false;
  }

  function runtimeDefaultControlMatches(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    key: QaIncidentDefaultFieldKey
  ): boolean {
    return preferredElementTypeMatches(element, key);
  }

  function isIncidentControlElement(element: Element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    return isInputControl(element) || isTextAreaControl(element) || isSelectControl(element);
  }

  function isInputControl(element: Element): element is HTMLInputElement {
    return element.tagName.toLowerCase() === "input";
  }

  function isTextAreaControl(element: Element): element is HTMLTextAreaElement {
    return element.tagName.toLowerCase() === "textarea";
  }

  function isSelectControl(element: Element): element is HTMLSelectElement {
    return element.tagName.toLowerCase() === "select";
  }

  function isTextInputControl(element: Element): element is HTMLInputElement {
    if (!isInputControl(element)) return false;
    const type = (element.getAttribute("type") || element.type || "text").toLowerCase();
    return ["", "text", "search", "email", "url", "tel"].includes(type);
  }

  function isReferenceField(key: QaIncidentDefaultFieldKey): boolean {
    return ["requester", "location", "assignmentGroup", "assignedTo"].includes(key);
  }

  function isReferenceDisplayValueSafe(key: QaIncidentDefaultFieldKey, value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (/^[a-f0-9]{32}$/i.test(trimmed)) return false;
    const identity = normalizeIdentity(trimmed).replace(/^sys_display\./, "");
    return !fieldIdentityCandidates(key).some(
      (candidate) => identity === candidate || identity.endsWith(`.${candidate}`) || identity === `sys_display.${candidate}`
    );
  }

  function isSelectField(key: QaIncidentDefaultFieldKey): boolean {
    return ["category", "subcategory", "channel", "state"].includes(key);
  }
};

const incidentFieldInspectionScript = async (allowedHost?: string): Promise<QaIncidentFieldRuntimeInspection> => {
  if (allowedHost !== undefined && !currentPageTargetAllowed(allowedHost)) {
    return { currentUrl: "", pageFingerprint: "", fields: [] };
  }

  const documents = collectSameOriginDocuments();
  const fieldsByIdentity = new Map<string, QaIncidentFormFieldEvidence>();
  const visibleControlCountsByIdentity = new Map<string, number>();

  for (const doc of documents) {
    for (const element of Array.from(doc.querySelectorAll("input, textarea, select"))) {
      if (!isIncidentInspectableControl(element)) continue;
      if (!isVisibleElement(element)) continue;
      const label = associatedLabelText(element);
      if (!looksLikeIncidentControl(element, label)) continue;
      const field = fieldEvidenceFor(element, label);
      const identity = field.name ?? field.id ?? field.label ?? `incident-field-${fieldsByIdentity.size}`;
      visibleControlCountsByIdentity.set(identity, (visibleControlCountsByIdentity.get(identity) ?? 0) + 1);
      const existing = fieldsByIdentity.get(identity);
      if (!existing || shouldPreferField(field, existing)) {
        fieldsByIdentity.set(identity, field);
      }
    }
  }

  const fields = Array.from(fieldsByIdentity.entries()).map(([identity, field]) => {
    const visibleControlCount = visibleControlCountsByIdentity.get(identity) ?? 1;
    return {
      ...field,
      matchedControlCount: visibleControlCount,
      visibleControlCount
    };
  });
  const fingerprintShape = {
    href: globalThis.location.href,
    title: globalThis.document.title,
    readyState: globalThis.document.readyState,
    fields: fields.map((field) => ({
      name: field.name ?? "",
      id: field.id ?? "",
      label: field.label ?? "",
      type: field.type,
      required: field.required,
      starred: field.starred,
      writable: field.writable,
      valuePresent: field.valuePresent,
      matchedControlCount: field.matchedControlCount,
      visibleControlCount: field.visibleControlCount
    }))
  };

  return {
    currentUrl: globalThis.location.href,
    pageFingerprint: await sha256Hex(JSON.stringify(fingerprintShape)),
    fields
  };

  function currentPageTargetAllowed(targetHost: string): boolean {
    if (!targetHost) return false;
    try {
      const current = new URL(globalThis.location.href);
      return (
        current.protocol === "https:" &&
        !current.username &&
        !current.password &&
        current.host.toLowerCase() === targetHost.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  function fieldEvidenceFor(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    label: string
  ): QaIncidentFormFieldEvidence {
    const rawName = element.getAttribute("name") ?? "";
    const rawId = element.getAttribute("id") ?? "";
    const logicalName = normalizedIncidentName(rawName || rawId);
    const starred = hasRequiredMarker(element, label);
    const required = starred || element.hasAttribute("required") || element.getAttribute("aria-required") === "true";
    return {
      name: logicalName || rawName || undefined,
      id: rawId || undefined,
      label: label || undefined,
      type: classifyIncidentFieldType(element, logicalName || rawName || rawId, label),
      required,
      starred,
      writable: isWritableForIncidentInspection(element),
      valuePresent: currentValuePresent(element)
    };
  }

  function shouldPreferField(candidate: QaIncidentFormFieldEvidence, existing: QaIncidentFormFieldEvidence): boolean {
    if (candidate.required && !existing.required) return true;
    if (candidate.starred && !existing.starred) return true;
    if (candidate.writable && !existing.writable) return true;
    if (candidate.label && !existing.label) return true;
    return false;
  }

  function looksLikeIncidentControl(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    label: string
  ): boolean {
    const haystack = [
      element.getAttribute("name") ?? "",
      element.getAttribute("id") ?? "",
      element.getAttribute("aria-label") ?? "",
      label
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes("incident.") || haystack.includes("sys_display.incident.");
  }

  function normalizedIncidentName(raw: string): string {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    return trimmed.replace(/^sys_display\./, "");
  }

  function classifyIncidentFieldType(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    identity: string,
    label: string
  ): QaIncidentFormFieldType {
    if (isTextAreaControl(element)) return "textarea";
    const haystack = `${identity} ${label}`.toLowerCase();
    if (
      ["caller_id", "opened_for", "requested_for", "location", "assignment_group", "assigned_to"].some((token) =>
        haystack.includes(token)
      )
    ) {
      return "reference";
    }
    if (isSelectControl(element)) return "select";
    if (["category", "subcategory", "contact_type", "channel", "impact", "urgency", "state"].some((token) => haystack.includes(token))) {
      return "select";
    }
    if (isInputControl(element)) {
      const type = (element.getAttribute("type") || element.type || "text").toLowerCase();
      return ["", "text", "search", "email", "url", "tel"].includes(type) ? "text" : "other";
    }
    return "other";
  }

  function associatedLabelText(element: Element): string {
    const doc = element.ownerDocument;
    const id = element.getAttribute("id") ?? "";
    const ariaLabel = element.getAttribute("aria-label") ?? "";
    const title = element.getAttribute("title") ?? "";
    const directLabel = id ? doc.querySelector(`label[for="${escapeAttributeSelectorValue(id)}"]`)?.textContent ?? "" : "";
    const container = fieldContainer(element);
    const containerLabel = container?.querySelector("label, .label, .control-label, .form-control-label")?.textContent ?? "";
    return cleanLabelText(directLabel || containerLabel || ariaLabel || title);
  }

  function cleanLabelText(text: string): string {
    return text.replace(/[\\n\\r\\t]+/g, " ").replace(/\s+/g, " ").replace(/^\*\s*/, "").trim();
  }

  function escapeAttributeSelectorValue(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function hasRequiredMarker(element: Element, label: string): boolean {
    if (label.trim().startsWith("*") || /(^|\s)\*(\s|$)/.test(label)) return true;
    const container = fieldContainer(element);
    if (!container) return false;
    if (
      container.querySelector(
        '.required-marker, .mandatory, .icon-required, .fa-asterisk, [aria-required="true"], [title*="required" i], [title*="mandatory" i], [aria-label*="required" i], [aria-label*="mandatory" i]'
      )
    ) {
      return true;
    }
    return Array.from(container.querySelectorAll("label, span, div")).some((candidate) =>
      /(^|\s)\*(\s|$)/.test(candidate.textContent ?? "")
    );
  }

  function fieldContainer(element: Element): Element | null {
    return element.closest(".form-group, .form-field, .sn-form-field, .control, tr, td, div");
  }

  function isVisibleElement(element: Element): boolean {
    try {
      const rect = element.getBoundingClientRect();
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style?.display !== "none" && style?.visibility !== "hidden";
    } catch {
      return false;
    }
  }

  function isWritableForIncidentInspection(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
    if (isInputControl(element) || isTextAreaControl(element)) {
      return !element.disabled && !element.readOnly && element.getAttribute("aria-disabled") !== "true";
    }
    return !element.disabled && element.getAttribute("aria-disabled") !== "true";
  }

  function currentValuePresent(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
    return element.value.trim().length > 0;
  }

  function isIncidentInspectableControl(element: Element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
    return isInputControl(element) || isTextAreaControl(element) || isSelectControl(element);
  }

  function isInputControl(element: Element): element is HTMLInputElement {
    return element.tagName.toLowerCase() === "input";
  }

  function isTextAreaControl(element: Element): element is HTMLTextAreaElement {
    return element.tagName.toLowerCase() === "textarea";
  }

  function isSelectControl(element: Element): element is HTMLSelectElement {
    return element.tagName.toLowerCase() === "select";
  }

  function collectSameOriginDocuments(): Document[] {
    const docs: Document[] = [globalThis.document];
    const visit = (win: Window) => {
      for (const frame of Array.from(win.frames)) {
        try {
          const doc = frame.document;
          docs.push(doc);
          visit(frame);
        } catch {
          // Cross-origin frames are ignored; readable ServiceNow controls must be same-origin.
        }
      }
    };
    visit(globalThis.window);
    return docs;
  }

  async function sha256Hex(text: string): Promise<string> {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
};

const inspectionScript = async (
  descriptors: QaAutofillFieldDescriptor[],
  allowedHost?: string
): Promise<QaAutofillRuntimeInspection> => {
  if (allowedHost !== undefined && !currentPageTargetAllowed(allowedHost)) {
    return { currentUrl: "", pageFingerprint: "", fields: [], unexpectedRequiredFieldCount: 0 };
  }

  const documents = collectSameOriginDocuments();
  const allowedElements: Element[] = [];
  const fields = descriptors.map((descriptor) => {
    const matches = collectUniqueElements(documents, descriptor.selectors);
    const visibleMatches = matches.filter(isVisibleElement);
    const effectiveMatch = visibleMatches.length === 1 ? visibleMatches[0] : undefined;
    allowedElements.push(...matches);
    return {
      key: descriptor.key,
      matchedSelectorCount: matches.length,
      visibleSelectorCount: visibleMatches.length,
      elementType: effectiveMatch ? classifyElement(effectiveMatch) : "other",
      writable: effectiveMatch ? isWritable(effectiveMatch) : false
    };
  });

  const fingerprintShape = {
    href: globalThis.location.href,
    title: globalThis.document.title,
    readyState: globalThis.document.readyState,
    fields: descriptors.map((descriptor, index) => {
      const matches = collectUniqueElements(documents, descriptor.selectors);
      return {
        key: descriptor.key,
        count: matches.length,
        expectedType: descriptor.type,
        actualType: fields[index].elementType,
        writable: fields[index].writable,
        signatures: matches.map((element) => ({
          tag: element.tagName,
          id: (element as HTMLInputElement).id ?? "",
          name: (element as HTMLInputElement).name ?? "",
          type: (element as HTMLInputElement).type ?? "",
          valueLength: currentValueLength(element)
        }))
      };
    }),
    unexpectedRequiredFieldCount: countUnexpectedRequiredFields(documents, allowedElements)
  };

  return {
    currentUrl: globalThis.location.href,
    pageFingerprint: await sha256Hex(JSON.stringify(fingerprintShape)),
    fields: fields as QaAutofillFixtureField[],
    unexpectedRequiredFieldCount: fingerprintShape.unexpectedRequiredFieldCount
  };

  function currentPageTargetAllowed(targetHost: string): boolean {
    if (!targetHost) return false;
    try {
      const current = new URL(globalThis.location.href);
      return (
        current.protocol === "https:" &&
        !current.username &&
        !current.password &&
        current.host.toLowerCase() === targetHost.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  function collectSameOriginDocuments(): Document[] {
    const docs: Document[] = [globalThis.document];
    const visit = (win: Window) => {
      for (const frame of Array.from(win.frames)) {
        try {
          const doc = frame.document;
          docs.push(doc);
          visit(frame);
        } catch {
          // Cross-origin frames are ignored. The allowed ServiceNow controls must be same-origin to be touched.
        }
      }
    };
    visit(globalThis.window);
    return docs;
  }

  function collectUniqueElements(docs: Document[], selectors: string[]): Element[] {
    const seen = new Set<Element>();
    const elements: Element[] = [];
    for (const doc of docs) {
      for (const selector of selectors) {
        for (const element of Array.from(doc.querySelectorAll(selector))) {
          if (!seen.has(element)) {
            seen.add(element);
            elements.push(element);
          }
        }
      }
    }
    return elements;
  }

  function classifyElement(element: Element): QaAutofillFixtureElementType {
    if (element instanceof HTMLTextAreaElement) return "textarea";
    if (element instanceof HTMLSelectElement) return "select";
    if (element instanceof HTMLInputElement) {
      return ["", "text", "search", "email", "url", "tel"].includes(element.type) ? "text" : "other";
    }
    return "other";
  }

  function isWritable(element: Element): boolean {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return !element.disabled && !element.readOnly && element.getAttribute("aria-disabled") !== "true";
    }
    return false;
  }

  function isVisibleElement(element: Element): boolean {
    try {
      const rect = element.getBoundingClientRect();
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style?.display !== "none" && style?.visibility !== "hidden";
    } catch {
      return false;
    }
  }

  function currentValueLength(element: Element): number {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return element.value.length;
    }
    return 0;
  }

  function countUnexpectedRequiredFields(docs: Document[], allowed: Element[]): number {
    const allowedSet = new Set(allowed);
    let count = 0;
    for (const doc of docs) {
      for (const element of Array.from(doc.querySelectorAll("input, textarea, select"))) {
        if (allowedSet.has(element)) continue;
        if (!isWritableForRequiredCheck(element)) continue;
        const required = element.hasAttribute("required") || element.getAttribute("aria-required") === "true";
        if (!required) continue;
        const value = element instanceof HTMLSelectElement || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value.trim() : "";
        if (!value) count += 1;
      }
    }
    return count;
  }

  function isWritableForRequiredCheck(element: Element): boolean {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return !element.disabled && element.getAttribute("aria-disabled") !== "true";
    }
    return false;
  }

  async function sha256Hex(text: string): Promise<string> {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
};

const fillScript = async (request: {
  operations: Array<{
    kind: "fill-text";
    fieldKey: QaAutofillFieldKey;
    label: string;
    selectors: string[];
    value: string;
  }>;
  descriptors: Array<{
    key: QaAutofillFieldKey;
    label: string;
    type: "text" | "textarea";
    selectors: string[];
  }>;
  expectedPageFingerprint: string;
  allowedHost: string;
  executionEnvironmentMode?: "qa";
}): Promise<QaAutofillRuntimeFillResult> => {
  if (request.executionEnvironmentMode !== "qa") {
    return blocked("qa-only-execute");
  }

  if (!currentPageTargetAllowed(request.allowedHost)) {
    return blocked("current-page-target-denied");
  }

  const documents = collectSameOriginDocuments();

  const inspection = await inspectDocuments(request.descriptors, documents);
  if (inspection.pageFingerprint !== request.expectedPageFingerprint) {
    return blocked("approval-stale-after-page-change");
  }
  if (inspection.unexpectedRequiredFieldCount > 0) {
    return blocked("unexpected-required-field");
  }

  const targets: Array<{
    operation: { fieldKey: QaAutofillFieldKey; label: string; value: string };
    element: HTMLInputElement | HTMLTextAreaElement;
  }> = [];
  for (const operation of request.operations) {
    if (operation.kind !== "fill-text") return blocked("plan-not-ready");
    const descriptor = request.descriptors.find((candidate) => candidate.key === operation.fieldKey);
    const field = inspection.fields.find((candidate) => candidate.key === operation.fieldKey);
    if (!descriptor || !field) return blocked("plan-not-ready");
    const matches = collectUniqueElements(documents, descriptor.selectors);
    const visibleMatches = matches.filter(isVisibleElement);
    if (visibleMatches.length !== 1) return blocked("selector-mismatch");
    if ((field.visibleSelectorCount ?? field.matchedSelectorCount) !== 1 || field.elementType !== descriptor.type || !field.writable) {
      return blocked("selector-mismatch");
    }
    const element = visibleMatches[0];
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      return blocked("selector-mismatch");
    }
    if (descriptor.type === "text" && !(element instanceof HTMLInputElement)) {
      return blocked("selector-mismatch");
    }
    if (descriptor.type === "textarea" && !(element instanceof HTMLTextAreaElement)) {
      return blocked("selector-mismatch");
    }
    targets.push({ operation, element });
  }

  const filledFields: QaAutofillRuntimeFillResult["filledFields"] = [];
  for (const target of targets) {
    setNativeTextValue(target.element, target.operation.value);
    target.element.dispatchEvent(new Event("input", { bubbles: true }));
    target.element.dispatchEvent(new Event("change", { bubbles: true }));
    filledFields.push({
      key: target.operation.fieldKey,
      label: target.operation.label,
      valueLength: target.operation.value.length
    });
  }

  return {
    status: "completed",
    filledFields,
    writeActionsAttempted: false,
    artifactsCaptured: false,
    serviceNowApiCalled: false,
    browserProcessLaunched: false,
    stoppedBeforeSaveSubmitUpdateClose: true,
    stoppedBeforeSaveSubmitUpdateResolveClose: true
  };

  function blocked(blockedReason: QaAutofillRuntimeBlockedReason): QaAutofillRuntimeFillResult {
    return {
      status: "blocked",
      blockedReason,
      filledFields: [],
      writeActionsAttempted: false,
      artifactsCaptured: false,
      serviceNowApiCalled: false,
      browserProcessLaunched: false,
      stoppedBeforeSaveSubmitUpdateClose: true,
      stoppedBeforeSaveSubmitUpdateResolveClose: true
    };
  }

  async function inspectDocuments(
    descriptors: Array<{ key: QaAutofillFieldKey; type: "text" | "textarea"; selectors: string[] }>,
    docs: Document[]
  ): Promise<{ pageFingerprint: string; fields: QaAutofillFixtureField[]; unexpectedRequiredFieldCount: number }> {
    const allowedElements: Element[] = [];
    const fields = descriptors.map((descriptor) => {
      const matches = collectUniqueElements(docs, descriptor.selectors);
      const visibleMatches = matches.filter(isVisibleElement);
      const effectiveMatch = visibleMatches.length === 1 ? visibleMatches[0] : undefined;
      allowedElements.push(...matches);
      return {
        key: descriptor.key,
        matchedSelectorCount: matches.length,
        visibleSelectorCount: visibleMatches.length,
        elementType: effectiveMatch ? classifyElement(effectiveMatch) : "other",
        writable: effectiveMatch ? isWritable(effectiveMatch) : false
      };
    });
    const fingerprintShape = {
      href: globalThis.location.href,
      title: globalThis.document.title,
      readyState: globalThis.document.readyState,
      fields: descriptors.map((descriptor, index) => {
        const matches = collectUniqueElements(docs, descriptor.selectors);
        return {
          key: descriptor.key,
          count: matches.length,
          expectedType: descriptor.type,
          actualType: fields[index].elementType,
          writable: fields[index].writable,
          visibleCount: fields[index].visibleSelectorCount,
          signatures: matches.map((element) => ({
            tag: element.tagName,
            id: (element as HTMLInputElement).id ?? "",
            name: (element as HTMLInputElement).name ?? "",
            type: (element as HTMLInputElement).type ?? "",
            valueLength: currentValueLength(element)
          }))
        };
      }),
      unexpectedRequiredFieldCount: countUnexpectedRequiredFields(docs, allowedElements)
    };
    return {
      pageFingerprint: await sha256Hex(JSON.stringify(fingerprintShape)),
      fields: fields as QaAutofillFixtureField[],
      unexpectedRequiredFieldCount: fingerprintShape.unexpectedRequiredFieldCount
    };
  }

  function currentPageTargetAllowed(allowedHost: string): boolean {
    if (!allowedHost) return false;
    try {
      const current = new URL(globalThis.location.href);
      return (
        current.protocol === "https:" &&
        !current.username &&
        !current.password &&
        current.host.toLowerCase() === allowedHost.toLowerCase()
      );
    } catch {
      return false;
    }
  }

  function collectSameOriginDocuments(): Document[] {
    const docs: Document[] = [globalThis.document];
    const visit = (win: Window) => {
      for (const frame of Array.from(win.frames)) {
        try {
          const doc = frame.document;
          docs.push(doc);
          visit(frame);
        } catch {
          // Cross-origin frames are ignored. The approved controls must be same-origin to be touched.
        }
      }
    };
    visit(globalThis.window);
    return docs;
  }

  function collectUniqueElements(docs: Document[], selectors: string[]): Element[] {
    const seen = new Set<Element>();
    const elements: Element[] = [];
    for (const doc of docs) {
      for (const selector of selectors) {
        for (const element of Array.from(doc.querySelectorAll(selector))) {
          if (!seen.has(element)) {
            seen.add(element);
            elements.push(element);
          }
        }
      }
    }
    return elements;
  }

  function classifyElement(element: Element): QaAutofillFixtureElementType {
    if (element instanceof HTMLTextAreaElement) return "textarea";
    if (element instanceof HTMLSelectElement) return "select";
    if (element instanceof HTMLInputElement) {
      return ["", "text", "search", "email", "url", "tel"].includes(element.type) ? "text" : "other";
    }
    return "other";
  }

  function isWritable(element: Element): boolean {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      return !element.disabled && !element.readOnly && element.getAttribute("aria-disabled") !== "true";
    }
    return false;
  }

  function isVisibleElement(element: Element): boolean {
    try {
      const rect = element.getBoundingClientRect();
      const style = element.ownerDocument.defaultView?.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style?.display !== "none" && style?.visibility !== "hidden";
    } catch {
      return false;
    }
  }

  function currentValueLength(element: Element): number {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return element.value.length;
    }
    return 0;
  }

  function countUnexpectedRequiredFields(docs: Document[], allowed: Element[]): number {
    const allowedSet = new Set(allowed);
    let count = 0;
    for (const doc of docs) {
      for (const element of Array.from(doc.querySelectorAll("input, textarea, select"))) {
        if (allowedSet.has(element)) continue;
        if (!isWritableForRequiredCheck(element)) continue;
        const required = element.hasAttribute("required") || element.getAttribute("aria-required") === "true";
        if (!required) continue;
        const value = element instanceof HTMLSelectElement || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value.trim() : "";
        if (!value) count += 1;
      }
    }
    return count;
  }

  function isWritableForRequiredCheck(element: Element): boolean {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return !element.disabled && element.getAttribute("aria-disabled") !== "true";
    }
    return false;
  }

  async function sha256Hex(text: string): Promise<string> {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function setNativeTextValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }
  }
};

export const qaAutofillRuntimeTestHooks = {
  incidentDefaultFieldFillScript,
  incidentFieldInspectionScript,
  resolveCdpPageWebSocketUrl
};
