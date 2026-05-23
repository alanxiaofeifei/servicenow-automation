import { describe, expect, it } from "vitest";

import type { FieldDraft, QaAutofillFixtureField, QaAutofillOperation, TicketDraft } from "@servicenow-automation/core";
import { getRequiredQaAutofillApprovalPhrase } from "@servicenow-automation/core";
import { getServiceNowEnvironmentConfig } from "@servicenow-automation/profiles";

import {
  runQaTextFieldAutofillRuntime,
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
