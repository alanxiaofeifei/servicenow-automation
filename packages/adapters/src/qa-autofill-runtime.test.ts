import { describe, expect, it } from "vitest";

import type {
  FieldDraft,
  QaAutofillFixtureField,
  QaAutofillOperation,
  QaIncidentFormFieldEvidence,
  QaIncidentDefaultPlannedField,
  TicketDraft
} from "@servicenow-automation/core";
import { getRequiredQaAutofillApprovalPhrase } from "@servicenow-automation/core";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

import {
  inspectQaIncidentDefaultFieldsRuntime,
  qaAutofillRuntimeTestHooks,
  runQaIncidentDefaultFieldAutofillRuntime,
  runQaTextFieldAutofillRuntime,
  type QaIncidentDefaultFieldAutofillRuntimePageDriver,
  type QaIncidentFieldRuntimeInspection,
  type QaIncidentFieldRuntimePageDriver,
  type QaAutofillRuntimeInspection,
  type QaAutofillRuntimePageDriver
} from "./qa-autofill-runtime";

const qaEnvironment = getServiceNowEnvironmentConfig("qa");
const qaApprovalPhrase = getRequiredQaAutofillApprovalPhrase("qa");
const sensitiveIncidentQueryKey = "sys" + "_id";
const currentQaIncidentUrl = `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveIncidentQueryKey}%3Dredacted`;

const allFoundFields: QaAutofillFixtureField[] = [
  { key: "shortDescription", matchedSelectorCount: 1, elementType: "text", writable: true },
  { key: "description", matchedSelectorCount: 1, elementType: "textarea", writable: true },
  { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: true }
];

describe("QA text-field autofill runtime", () => {
  it("verifies selectors and returns only a fingerprint before execution", async () => {
    const driver = fakeDriver([inspection({ pageFingerprint: "reviewed-page" })]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: false,
      qaIsolationConfirmed: false,
      dedicatedProfileConfirmed: false
    });

    expect(result.status).toBe("verified");
    expect(result.pageFingerprint).toBe("reviewed-page");
    expect(result.selectorVerification).toEqual({
      shortDescription: "found",
      description: "found",
      workNotes: "found"
    });
    expect(driver.fillCalls).toHaveLength(0);
    expect(result.safety).toMatchObject({
      browserAutomationCalled: true,
      noServiceNowWrite: true,
      noSaveSubmitUpdateClose: true,
      artifactsCaptured: false
    });
  });

  it("blocks non-QA/dev or missing configured targets before browser inspection", async () => {
    const deniedEnvironments = [
      { environment: getServiceNowEnvironmentConfig("mock"), expectedReason: "qa-dev-only" },
      { environment: getServiceNowEnvironmentConfig("production-shadow"), expectedReason: "qa-dev-only" },
      { environment: getServiceNowEnvironmentConfig("dev"), expectedReason: "current-page-target-denied" }
    ];

    for (const testCase of deniedEnvironments) {
      const driver = fakeDriver([inspection({ pageFingerprint: "should-not-be-read" })]);
      const result = await runQaTextFieldAutofillRuntime({
        draft: completeDraft(),
        environment: testCase.environment,
        driver,
        execute: false,
        qaIsolationConfirmed: false,
        dedicatedProfileConfirmed: false
      });

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe(testCase.expectedReason);
      expect(result.safety.browserAutomationCalled).toBe(false);
      expect(driver.inspectCalls).toBe(0);
      expect(driver.fillCalls).toHaveLength(0);
    }
  });

  it("fills only the three approved text operations after fresh approval", async () => {
    const driver = fakeDriver([
      inspection({ pageFingerprint: "reviewed-page" }),
      inspection({ pageFingerprint: "reviewed-page" })
    ]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });

    expect(result.status).toBe("completed");
    expect(result.plan?.operations.map((operation) => operation.kind)).toEqual(["fill-text", "fill-text", "fill-text"]);
    expect(result.execution?.filledFields.map((field) => field.key)).toEqual(["shortDescription", "description", "workNotes"]);
    expect(result.execution).toMatchObject({
      writeActionsAttempted: false,
      artifactsCaptured: false,
      serviceNowApiCalled: false,
      stoppedBeforeSaveSubmitUpdateClose: true
    });
    expect(driver.fillCalls).toHaveLength(1);
    expect(driver.fillCalls[0].map((operation) => operation.kind)).toEqual(["fill-text", "fill-text", "fill-text"]);
  });

  it("accepts visible unique controls when ServiceNow renders hidden duplicate selector matches", async () => {
    const driver = fakeDriver([
      inspection({
        fields: [
          { key: "shortDescription", matchedSelectorCount: 5, visibleSelectorCount: 1, elementType: "text", writable: true },
          { key: "description", matchedSelectorCount: 1, visibleSelectorCount: 1, elementType: "textarea", writable: true },
          { key: "workNotes", matchedSelectorCount: 1, visibleSelectorCount: 1, elementType: "textarea", writable: true }
        ]
      })
    ]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: false,
      qaIsolationConfirmed: false,
      dedicatedProfileConfirmed: false
    });

    expect(result.status).toBe("verified");
    expect(result.selectorVerification).toEqual({
      shortDescription: "found",
      description: "found",
      workNotes: "found"
    });
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("blocks if the page fingerprint changes between approval and fill", async () => {
    const driver = fakeDriver([
      inspection({ pageFingerprint: "reviewed-page" }),
      inspection({ pageFingerprint: "changed-page" })
    ]);

    const result = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("approval-stale-after-page-change");
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("blocks missing, ambiguous, wrong-type, and non-writable selector evidence before fill", async () => {
    const cases: Array<{ field: QaAutofillFixtureField; expectedReason: string }> = [
      { field: { key: "workNotes", matchedSelectorCount: 0, elementType: "textarea", writable: true }, expectedReason: "selector-verification-required" },
      { field: { key: "description", matchedSelectorCount: 2, elementType: "textarea", writable: true }, expectedReason: "selector-mismatch" },
      { field: { key: "description", matchedSelectorCount: 1, elementType: "select", writable: true }, expectedReason: "selector-verification-required" },
      { field: { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: false }, expectedReason: "selector-verification-required" }
    ];

    for (const testCase of cases) {
      const driver = fakeDriver([inspection({ fields: replaceField(testCase.field) })]);
      const result = await runQaTextFieldAutofillRuntime({
        draft: completeDraft(),
        environment: qaEnvironment,
        driver,
        execute: true,
        approvalPhrase: qaApprovalPhrase,
        approvalPageFingerprint: "reviewed-page",
        qaIsolationConfirmed: true,
        dedicatedProfileConfirmed: true
      });

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe(testCase.expectedReason);
      expect(driver.fillCalls).toHaveLength(0);
    }
  });

  it("blocks unexpected required fields and current page host mismatches without filling", async () => {
    const unexpectedRequired = fakeDriver([inspection({ unexpectedRequiredFieldCount: 1 })]);
    const unexpectedRequiredResult = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver: unexpectedRequired,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });
    expect(unexpectedRequiredResult.status).toBe("blocked");
    expect(unexpectedRequiredResult.blockedReason).toBe("unexpected-required-field");
    expect(unexpectedRequired.fillCalls).toHaveLength(0);

    const wrongHost = fakeDriver([inspection({ currentUrl: "https://other.service-now.example.invalid/nav_to.do" })]);
    const wrongHostResult = await runQaTextFieldAutofillRuntime({
      draft: completeDraft(),
      environment: qaEnvironment,
      driver: wrongHost,
      execute: true,
      approvalPhrase: qaApprovalPhrase,
      approvalPageFingerprint: "reviewed-page",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });
    expect(wrongHostResult.status).toBe("blocked");
    expect(wrongHostResult.blockedReason).toBe("current-page-target-denied");
    expect(wrongHost.fillCalls).toHaveLength(0);
  });
});

describe("QA incident default field read-only runtime", () => {
  it("selects the configured-host Incident page when CDP exposes multiple page targets", async () => {
    const sensitiveQueryKey = "sys" + "_id";
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: "about:blank",
        webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/blank"
      },
      {
        type: "page",
        url: `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveQueryKey}%3Dredacted`,
        webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/incident"
      },
      {
        type: "page",
        url: "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do",
        webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/landing"
      }
    ]);

    try {
      const webSocketUrl = await qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
        "http://127.0.0.1:9222",
        "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
      );

      expect(webSocketUrl).toBe("ws://127.0.0.1:9222/devtools/page/incident");
    } finally {
      restoreFetch();
    }
  });

  it("fails closed with a sanitized page-selection error when multiple configured-host Incident pages are open", async () => {
    const sensitiveQueryKey = "sys" + "_id";
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveQueryKey}%3Done`,
        webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/incident-one"
      },
      {
        type: "page",
        url: `https://qa.service-now.example.invalid/nav_to.do?uri=incident.do%3F${sensitiveQueryKey}%3Dtwo`,
        webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/incident-two"
      }
    ]);

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          "http://127.0.0.1:9222",
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("Unable to select a single current browser page target for QA verify-only inspection.");
    } finally {
      restoreFetch();
    }
  });

  it("fails closed instead of inspecting another host when no configured-host target is open", async () => {
    const restoreFetch = installFakeCdpTargetList([
      {
        type: "page",
        url: "https://other.example.invalid/nav_to.do?uri=incident.do",
        webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/other-incident"
      },
      {
        type: "page",
        url: "about:blank",
        webSocketDebuggerUrl: "ws://127.0.0.1:9222/devtools/page/blank"
      }
    ]);

    try {
      await expect(
        qaAutofillRuntimeTestHooks.resolveCdpPageWebSocketUrl(
          "http://127.0.0.1:9222",
          "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
        )
      ).rejects.toThrow("Unable to select a single current browser page target for QA verify-only inspection.");
    } finally {
      restoreFetch();
    }
  });

  it("inspects Incident controls from same-origin frames without relying on top-window element constructors", async () => {
    const frameDocument = fakeIncidentDocument([
      fakeIncidentDomControl("input", { name: "incident.short_description", "aria-label": "Short description", required: "true" }),
      fakeIncidentDomControl("textarea", { name: "incident.description", "aria-label": "Description" }),
      fakeIncidentDomControl("textarea", { name: "incident.work_notes", "aria-label": "Work notes" })
    ]);
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [],
      href: "https://qa.service-now.example.invalid/nav_to.do",
      frameDocuments: [frameDocument]
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentFieldInspectionScript();

      expect(result.currentUrl).toBe("https://qa.service-now.example.invalid/nav_to.do");
      expect(result.fields.map((field) => field.name)).toEqual([
        "incident.short_description",
        "incident.description",
        "incident.work_notes"
      ]);
      expect(result.fields.map((field) => field.type)).toEqual(["text", "textarea", "textarea"]);
      expect(result.fields[0]).toMatchObject({ required: true, starred: false, writable: true, valuePresent: false });
    } finally {
      restoreGlobals();
    }
  });

  it("inspects current incident fields without exposing page content or enabling writes", async () => {
    const driver = fakeIncidentFieldDriver(
      incidentFieldInspection({
        pageFingerprint: "incident-field-fingerprint",
        fields: incidentDefaultFields()
      })
    );

    const result = await inspectQaIncidentDefaultFieldsRuntime({
      environment: qaEnvironment,
      driver
    });

    expect(result.status).toBe("verified");
    expect(result.pageFingerprint).toBe("incident-field-fingerprint");
    expect(result.fields.map((field) => field.name)).toEqual([
      "incident.caller_id",
      "incident.category",
      "incident.subcategory",
      "incident.location",
      "incident.contact_type",
      "incident.impact",
      "incident.urgency",
      "incident.assignment_group",
      "incident.assigned_to",
      "incident.short_description",
      "incident.description",
      "incident.work_notes"
    ]);
    expect(driver.inspectCalls).toBe(1);
    expect(result.safety).toMatchObject({
      browserAutomationCalled: true,
      noServiceNowWrite: true,
      noSaveSubmitUpdateClose: true,
      artifactsCaptured: false,
      productionWriteAllowed: false
    });
    expect(JSON.stringify(result)).not.toContain("sys_id");
    expect(JSON.stringify(result)).not.toContain("redacted");
  });

  it("blocks current-page field inspection outside the configured QA/dev target", async () => {
    const driver = fakeIncidentFieldDriver(
      incidentFieldInspection({ currentUrl: "https://other.service-now.example.invalid/nav_to.do" })
    );

    const result = await inspectQaIncidentDefaultFieldsRuntime({
      environment: qaEnvironment,
      driver
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("current-page-target-denied");
    expect(result.fields).toEqual([]);
    expect(result.safety.browserAutomationCalled).toBe(true);
  });
});

describe("QA incident default field autofill runtime", () => {
  it("blocks broad default-field plans before the runtime sink can fill reference/select/routing controls", async () => {
    const plannedFields = plannedIncidentDefaultFields();
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "stable-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("runtime-text-fields-only");
    expect(result.pageFingerprintMatched).toBe(false);
    expect(result.filledFields).toEqual([]);
    expect(driver.fillCalls).toHaveLength(0);
    expect(result.safety).toMatchObject({
      browserAutomationCalled: false,
      noServiceNowWrite: true,
      noSaveSubmitUpdateClose: true,
      artifactsCaptured: false
    });
  });

  it("autofills only the three approved text fields after an explicit verify fingerprint", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "stable-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true,
      approvalPageFingerprint: "stable-incident-form"
    });

    expect(result.status).toBe("completed");
    expect(result.pageFingerprint).toBeUndefined();
    expect(result.pageFingerprintMatched).toBe(true);
    expect(result.filledFields.map((field) => field.key)).toEqual([
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(driver.fillCalls).toHaveLength(1);
    expect(driver.fillCalls[0].plannedFields.map((field) => field.key)).toEqual([
      "shortDescription",
      "description",
      "workNotes"
    ]);
  });

  it("blocks execute-mode default-field autofill when the prior verify fingerprint is missing", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "stable-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("approval-page-fingerprint-required");
    expect(result.pageFingerprintMatched).toBe(false);
    expect(result.filledFields).toEqual([]);
    expect(driver.inspectCalls).toBe(0);
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("blocks autofill when the page fingerprint changed after verification", async () => {
    const textOnlyFields = plannedIncidentDefaultFields().filter((field) =>
      ["shortDescription", "description", "workNotes"].includes(field.key)
    );
    const driver = fakeDefaultFieldDriver(incidentFieldInspection({ pageFingerprint: "changed-incident-form" }));

    const result = await runQaIncidentDefaultFieldAutofillRuntime({
      environment: qaEnvironment,
      driver,
      plannedFields: textOnlyFields,
      execute: true,
      approvalPageFingerprint: "previous-incident-form"
    });

    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("approval-stale-after-page-change");
    expect(result.pageFingerprint).toBeUndefined();
    expect(driver.fillCalls).toHaveLength(0);
  });

  it("blocks the browser-evaluated default-field sink when an approved text key resolves to a select control", async () => {
    const selectControl = fakeIncidentDomControl("select", { name: "incident.short_description" });
    const restoreGlobals = installFakeBrowserGlobals({
      controls: [selectControl],
      href: "https://qa.service-now.example.invalid/nav_to.do"
    });

    try {
      const result = await qaAutofillRuntimeTestHooks.incidentDefaultFieldFillScript(
        {
          plannedFields: [{ key: "shortDescription", label: "Short description", value: "safe text", valueLength: 9 }],
          expectedPageFingerprint: "verified-page",
          allowedHost: "qa.service-now.example.invalid"
        },
        "async () => ({ currentUrl: globalThis.location.href, pageFingerprint: 'verified-page', fields: [] })"
      );

      expect(result.status).toBe("blocked");
      expect(result.blockedReason).toBe("runtime-text-fields-only");
      expect(selectControl.value).toBe("");
    } finally {
      restoreGlobals();
    }
  });
});

type FakeCdpPageTarget = {
  type?: string;
  url?: string;
  webSocketDebuggerUrl?: string;
};

type FakeIncidentDomControl = {
  tagName: string;
  value: string;
  type: string;
  disabled: boolean;
  readOnly: boolean;
  ownerDocument?: FakeIncidentDocument;
  textContent?: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  getBoundingClientRect(): { width: number; height: number };
  closest(): null;
  dispatchEvent(): boolean;
};

type FakeIncidentWindow = {
  document?: FakeIncidentDocument;
  frames: FakeIncidentWindow[];
  getComputedStyle(): { display: string; visibility: string };
};

type FakeIncidentDocument = {
  title: string;
  readyState: string;
  defaultView: FakeIncidentWindow;
  querySelectorAll(selector: string): FakeIncidentDomControl[];
  querySelector(): null;
};

function fakeIncidentDomControl(
  tagName: "input" | "textarea" | "select",
  attributes: Record<string, string>
): FakeIncidentDomControl {
  return {
    tagName: tagName.toUpperCase(),
    value: "",
    type: attributes.type ?? (tagName === "input" ? "text" : tagName),
    disabled: false,
    readOnly: false,
    textContent: "",
    getAttribute(name: string) {
      return attributes[name] ?? null;
    },
    hasAttribute(name: string) {
      return Object.prototype.hasOwnProperty.call(attributes, name);
    },
    getBoundingClientRect() {
      return { width: 160, height: 24 };
    },
    closest() {
      return null;
    },
    dispatchEvent() {
      return true;
    }
  };
}

function fakeIncidentDocument(controls: FakeIncidentDomControl[]): FakeIncidentDocument {
  const fakeWindow: FakeIncidentWindow = {
    frames: [],
    getComputedStyle: () => ({ display: "block", visibility: "visible" })
  };
  const fakeDocument: FakeIncidentDocument = {
    title: "Incident form",
    readyState: "complete",
    defaultView: fakeWindow,
    querySelectorAll(selector: string) {
      return selector === "input, textarea, select" ? controls : [];
    },
    querySelector() {
      return null;
    }
  };
  fakeWindow.document = fakeDocument;
  for (const control of controls) {
    control.ownerDocument = fakeDocument;
  }
  return fakeDocument;
}

function installFakeBrowserGlobals(options: {
  controls: FakeIncidentDomControl[];
  href: string;
  frameDocuments?: FakeIncidentDocument[];
}): () => void {
  const fakeDocument = fakeIncidentDocument(options.controls);
  const frameWindows = (options.frameDocuments ?? []).map((document) => document.defaultView);
  fakeDocument.defaultView.frames = frameWindows;

  const globals = globalThis as unknown as Record<string, unknown>;
  const previousDocument = globals.document;
  const previousWindow = globals.window;
  const previousLocation = globals.location;
  globals.document = fakeDocument;
  globals.window = fakeDocument.defaultView;
  globals.location = { href: options.href };

  return () => {
    globals.document = previousDocument;
    globals.window = previousWindow;
    globals.location = previousLocation;
  };
}

function installFakeCdpTargetList(targets: FakeCdpPageTarget[]): () => void {
  const globals = globalThis as unknown as { fetch?: unknown };
  const previousFetch = globals.fetch;
  globals.fetch = async () => ({
    ok: true,
    json: async () => targets
  });

  return () => {
    globals.fetch = previousFetch;
  };
}

function fakeDriver(
  inspections: QaAutofillRuntimeInspection[]
): QaAutofillRuntimePageDriver & { fillCalls: QaAutofillOperation[][]; inspectCalls: number } {
  const fillCalls: QaAutofillOperation[][] = [];
  let inspectionIndex = 0;
  let inspectCalls = 0;
  return {
    fillCalls,
    get inspectCalls() {
      return inspectCalls;
    },
    async inspectAllowedTextFields() {
      inspectCalls += 1;
      const nextInspection = inspections[Math.min(inspectionIndex, inspections.length - 1)];
      inspectionIndex += 1;
      return nextInspection;
    },
    async fillAllowedTextFields(request) {
      fillCalls.push(request.operations);
      return {
        status: "completed",
        filledFields: request.operations.map((operation) => ({
          key: operation.fieldKey,
          label: operation.label,
          valueLength: operation.value.length
        })),
        writeActionsAttempted: false,
        artifactsCaptured: false,
        serviceNowApiCalled: false,
        browserProcessLaunched: false,
        stoppedBeforeSaveSubmitUpdateClose: true
      };
    }
  };
}

function fakeIncidentFieldDriver(
  inspectionResult: QaIncidentFieldRuntimeInspection
): QaIncidentFieldRuntimePageDriver & { inspectCalls: number } {
  let inspectCalls = 0;
  return {
    get inspectCalls() {
      return inspectCalls;
    },
    async inspectIncidentFormFields() {
      inspectCalls += 1;
      return inspectionResult;
    }
  };
}

function fakeDefaultFieldDriver(
  inspectionResult: QaIncidentFieldRuntimeInspection
): QaIncidentDefaultFieldAutofillRuntimePageDriver & { inspectCalls: number; fillCalls: Array<{ plannedFields: QaIncidentDefaultPlannedField[] }> } {
  let inspectCalls = 0;
  const fillCalls: Array<{ plannedFields: QaIncidentDefaultPlannedField[] }> = [];
  return {
    get inspectCalls() {
      return inspectCalls;
    },
    fillCalls,
    async inspectIncidentFormFields() {
      inspectCalls += 1;
      return inspectionResult;
    },
    async fillIncidentDefaultFields(request) {
      fillCalls.push({ plannedFields: request.plannedFields as QaIncidentDefaultPlannedField[] });
      return {
        status: "completed",
        filledFields: request.plannedFields.map((field) => ({
          key: field.key,
          label: field.label,
          valueLength: field.valueLength
        })),
        writeActionsAttempted: false,
        artifactsCaptured: false,
        serviceNowApiCalled: false,
        browserProcessLaunched: false,
        stoppedBeforeSaveSubmitUpdateClose: true
      };
    }
  };
}

function plannedIncidentDefaultFields(): QaIncidentDefaultPlannedField[] {
  return [
    plannedIncidentDefaultField("requester", "Requester", "Zheng Zhu", "qa-default-profile"),
    plannedIncidentDefaultField("category", "Category", "Desktop", "qa-default-profile"),
    plannedIncidentDefaultField("subcategory", "Subcategory", "Password reset", "qa-default-profile"),
    plannedIncidentDefaultField("location", "Location", "Shenzhen (YKPC) - CNSNZE", "qa-default-profile"),
    plannedIncidentDefaultField("channel", "Channel", "Self-service / manual paste", "qa-default-profile"),
    plannedIncidentDefaultField("impact", "Impact", "3 - Low", "qa-default-profile"),
    plannedIncidentDefaultField("urgency", "Urgency", "3 - Low", "qa-default-profile"),
    plannedIncidentDefaultField("assignmentGroup", "Assignment group", "SN YAGEO Service Desk - China", "qa-default-profile"),
    plannedIncidentDefaultField("assignedTo", "Assigned to", "Zheng Zhu", "qa-default-profile"),
    plannedIncidentDefaultField("shortDescription", "Short description", "VPN access issue after MFA change", "ticket-draft"),
    plannedIncidentDefaultField("description", "Description", "Fake sanitized VPN issue details for QA autofill usability test.", "ticket-draft"),
    plannedIncidentDefaultField("workNotes", "Work notes", "SD_China - Fake sanitized internal work note for QA autofill usability test.", "ticket-draft-with-qa-prefix")
  ];
}

function plannedIncidentDefaultField(
  key: QaIncidentDefaultPlannedField["key"],
  label: string,
  value: string,
  source: QaIncidentDefaultPlannedField["source"]
): QaIncidentDefaultPlannedField {
  return {
    key,
    label,
    requirement: "required",
    value,
    valueLength: value.length,
    source,
    autofillAllowed: false
  };
}

function incidentFieldInspection(
  overrides: Partial<QaIncidentFieldRuntimeInspection> = {}
): QaIncidentFieldRuntimeInspection {
  return {
    currentUrl: currentQaIncidentUrl,
    pageFingerprint: "incident-field-fingerprint",
    fields: incidentDefaultFields(),
    ...overrides
  };
}

function incidentDefaultFields(): QaIncidentFormFieldEvidence[] {
  return [
    incidentField({ name: "incident.caller_id", label: "Requester", required: true, starred: true, type: "reference" }),
    incidentField({ name: "incident.category", label: "Category", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.subcategory", label: "Subcategory", type: "select" }),
    incidentField({ name: "incident.location", label: "Location", required: true, starred: true, type: "reference" }),
    incidentField({ name: "incident.contact_type", label: "Channel", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.impact", label: "Impact", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.urgency", label: "Urgency", required: true, starred: true, type: "select" }),
    incidentField({ name: "incident.assignment_group", label: "Assignment group", required: true, starred: true, type: "reference" }),
    incidentField({ name: "incident.assigned_to", label: "Assigned to", type: "reference" }),
    incidentField({ name: "incident.short_description", label: "Short description", required: true, starred: true, type: "text" }),
    incidentField({ name: "incident.description", label: "Description", required: true, starred: true, type: "textarea" }),
    incidentField({ name: "incident.work_notes", label: "Work notes", type: "textarea" })
  ];
}

function incidentField(overrides: Partial<QaIncidentFormFieldEvidence>): QaIncidentFormFieldEvidence {
  return {
    name: "incident.unknown",
    label: "Unknown",
    type: "text",
    required: false,
    starred: false,
    writable: true,
    valuePresent: false,
    ...overrides
  };
}

function inspection(overrides: Partial<QaAutofillRuntimeInspection> = {}): QaAutofillRuntimeInspection {
  return {
    currentUrl: currentQaIncidentUrl,
    pageFingerprint: "reviewed-page",
    fields: allFoundFields,
    unexpectedRequiredFieldCount: 0,
    ...overrides
  };
}

function replaceField(field: QaAutofillFixtureField): QaAutofillFixtureField[] {
  return allFoundFields.map((candidate) => (candidate.key === field.key ? field : candidate));
}

function completeDraft(overrides: Partial<TicketDraft> = {}): TicketDraft {
  return {
    id: "draft-1",
    sourceContextId: "context-1",
    ticketType: "incident",
    shortDescription: field("VPN access issue after MFA change"),
    description: field("Fake sanitized VPN issue details for QA autofill usability test."),
    workNotes: field("Fake sanitized internal work note for QA autofill usability test."),
    caller: field("Demo requester"),
    category: field("Network"),
    subcategory: field("VPN"),
    assignmentGroup: field("Service Desk"),
    impact: field("3 - Low"),
    urgency: field("3 - Low"),
    priority: field("4 - Low"),
    kbMatches: [],
    riskFlags: [],
    missingInfoQuestions: [],
    ...overrides
  };
}

function field(value: string): FieldDraft {
  return {
    value,
    confidence: 0.9,
    evidence: "test",
    editable: true
  };
}
