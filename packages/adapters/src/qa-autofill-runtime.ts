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
  | "approval-stale-after-page-change"
  | "plan-not-ready";

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
};

export type QaAutofillRuntimePageDriver = {
  inspectAllowedTextFields(descriptors: QaAutofillFieldDescriptor[]): Promise<QaAutofillRuntimeInspection>;
  fillAllowedTextFields(request: QaAutofillRuntimeFillRequest): Promise<QaAutofillRuntimeFillResult>;
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
};

export async function runQaTextFieldAutofillRuntime(
  request: RunQaTextFieldAutofillRuntimeRequest
): Promise<QaAutofillRuntimeResult> {
  const preflightReason = runtimePreflightBlockedReason(request.environment);
  if (preflightReason) {
    return blockedRuntimeResult(preflightReason, false);
  }
  if (!request.driver) {
    return blockedRuntimeResult("cdp-endpoint-denied", false);
  }

  const descriptors = getQaAutofillFieldDescriptors();
  let inspection: QaAutofillRuntimeInspection;
  try {
    inspection = await request.driver.inspectAllowedTextFields(descriptors);
  } catch {
    return blockedRuntimeResult("browser-runtime-error", true);
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
      pageFingerprint: inspection.pageFingerprint,
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
      pageFingerprint: inspection.pageFingerprint,
      pageFingerprintMatched,
      plan,
      safety: runtimeSafety(true)
    };
  }

  let beforeFillInspection: QaAutofillRuntimeInspection;
  try {
    beforeFillInspection = await request.driver.inspectAllowedTextFields(descriptors);
  } catch {
    return {
      status: "blocked",
      blockedReason: "browser-runtime-error",
      selectorVerification,
      pageFingerprint: inspection.pageFingerprint,
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
      pageFingerprint: beforeFillInspection.pageFingerprint,
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
      allowedHost: beforeFillTargetValidation.allowedHost ?? ""
    });
  } catch {
    execution = blockedFillResult("browser-runtime-error");
  }
  return {
    status: execution.status,
    blockedReason: execution.blockedReason,
    selectorVerification: beforeFillSelectorVerification,
    pageFingerprint: beforeFillInspection.pageFingerprint,
    pageFingerprintMatched: true,
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
      return withCdpClient(options.endpoint, (client) =>
        client.evaluate<QaAutofillRuntimeInspection>(buildInspectionExpression(descriptors))
      );
    },
    async fillAllowedTextFields(request) {
      if (request.operations.some((operation) => operation.kind !== "fill-text")) {
        return blockedFillResult("plan-not-ready");
      }
      return withCdpClient(options.endpoint, (client) =>
        client.evaluate<QaAutofillRuntimeFillResult>(buildFillExpression(request))
      );
    }
  };
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
    artifactsCaptured: false,
    productionWriteAllowed: false
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
    stoppedBeforeSaveSubmitUpdateClose: true
  };
}

async function withCdpClient<T>(endpoint: string, callback: (client: CdpClient) => Promise<T>): Promise<T> {
  const webSocketUrl = await resolveCdpPageWebSocketUrl(endpoint);
  const client = await CdpClient.connect(webSocketUrl);
  try {
    return await callback(client);
  } finally {
    client.close();
  }
}

async function resolveCdpPageWebSocketUrl(endpoint: string): Promise<string> {
  const url = new URL(endpoint);
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    validateLocalCdpEndpoint(endpoint);
    return endpoint;
  }

  const listUrl = new URL("/json/list", url);
  const response = await fetch(listUrl);
  if (!response.ok) {
    throw new Error("Unable to inspect the local browser debugging endpoint.");
  }
  const pages = (await response.json()) as Array<{ type?: string; url?: string; webSocketDebuggerUrl?: string }>;
  const pageTargets = pages.filter((page) => page.type === "page" && page.webSocketDebuggerUrl);
  if (pageTargets.length !== 1) {
    throw new Error("Expected exactly one local browser page target for QA autofill runtime.");
  }
  const webSocketUrl = pageTargets[0].webSocketDebuggerUrl as string;
  validateLocalCdpEndpoint(webSocketUrl);
  return webSocketUrl;
}

function validateLocalCdpEndpoint(endpoint: string): void {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("CDP endpoint must be a local http:// or ws:// URL.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if (!["http:", "ws:"].includes(url.protocol) || !localHosts.has(url.hostname)) {
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

function buildInspectionExpression(descriptors: QaAutofillFieldDescriptor[]): string {
  return `(${inspectionScript})(${JSON.stringify(descriptors)})`;
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
    allowedHost: request.allowedHost.toLowerCase()
  };
  return `(${fillScript})(${JSON.stringify(sanitizedRequest)})`;
}

const inspectionScript = async (descriptors: QaAutofillFieldDescriptor[]): Promise<QaAutofillRuntimeInspection> => {
  const documents = collectSameOriginDocuments();
  const allowedElements: Element[] = [];
  const fields = descriptors.map((descriptor) => {
    const matches = collectUniqueElements(documents, descriptor.selectors);
    allowedElements.push(...matches);
    return {
      key: descriptor.key,
      matchedSelectorCount: matches.length,
      elementType: matches.length === 1 ? classifyElement(matches[0]) : "other",
      writable: matches.length === 1 ? isWritable(matches[0]) : false
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
}): Promise<QaAutofillRuntimeFillResult> => {
  const documents = collectSameOriginDocuments();
  if (!currentPageTargetAllowed(request.allowedHost)) {
    return blocked("current-page-target-denied");
  }

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
    if (matches.length !== 1) return blocked("selector-mismatch");
    if (field.matchedSelectorCount !== 1 || field.elementType !== descriptor.type || !field.writable) {
      return blocked("selector-mismatch");
    }
    const element = matches[0];
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
    stoppedBeforeSaveSubmitUpdateClose: true
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
      stoppedBeforeSaveSubmitUpdateClose: true
    };
  }

  async function inspectDocuments(
    descriptors: Array<{ key: QaAutofillFieldKey; type: "text" | "textarea"; selectors: string[] }>,
    docs: Document[]
  ): Promise<{ pageFingerprint: string; fields: QaAutofillFixtureField[]; unexpectedRequiredFieldCount: number }> {
    const allowedElements: Element[] = [];
    const fields = descriptors.map((descriptor) => {
      const matches = collectUniqueElements(docs, descriptor.selectors);
      allowedElements.push(...matches);
      return {
        key: descriptor.key,
        matchedSelectorCount: matches.length,
        elementType: matches.length === 1 ? classifyElement(matches[0]) : "other",
        writable: matches.length === 1 ? isWritable(matches[0]) : false
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
