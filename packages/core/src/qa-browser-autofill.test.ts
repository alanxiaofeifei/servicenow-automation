import { describe, expect, it } from "vitest";

import {
  buildQaAutofillSelectorVerificationFromEvidence,
  buildQaTextFieldAutofillPlan,
  executeQaTextFieldAutofillFixture,
  getRequiredQaAutofillApprovalPhrase,
  type QaAutofillSelectorVerification
} from "./qa-browser-autofill";
import type { FieldDraft, TicketDraft } from "./models";
import { getRequiredRealActionApprovalPhrase } from "./real-action-gate";
import type { RealActionEnvironment, RealActionTargetValidation } from "./real-action-gate";

const qaEnvironment: RealActionEnvironment = {
  mode: "qa",
  allowsRealSubmit: true,
  requiresExplicitApprovalBeforeRealSubmit: true,
  shadowOnly: false
};

const devEnvironment: RealActionEnvironment = {
  mode: "dev",
  allowsRealSubmit: true,
  requiresExplicitApprovalBeforeRealSubmit: true,
  shadowOnly: false
};

const mockEnvironment: RealActionEnvironment = {
  mode: "mock",
  allowsRealSubmit: false,
  requiresExplicitApprovalBeforeRealSubmit: false,
  shadowOnly: true
};

const productionShadowEnvironment: RealActionEnvironment = {
  mode: "production-shadow",
  allowsRealSubmit: false,
  requiresExplicitApprovalBeforeRealSubmit: true,
  shadowOnly: true
};

const qaTargetValidation: RealActionTargetValidation = {
  allowed: true,
  reason: "target-allowlisted",
  host: "qa.service-now.example.invalid",
  allowedHost: "qa.service-now.example.invalid"
};

const selectorVerification: QaAutofillSelectorVerification = {
  shortDescription: "found",
  description: "found",
  workNotes: "found"
};

const qaApprovalPhrase =
  getRequiredQaAutofillApprovalPhrase("qa");
const devApprovalPhrase =
  getRequiredQaAutofillApprovalPhrase("dev");
const reviewedPageFingerprint = ["qa", "incident", "form", "reviewed"].join("-");
const beforeReviewPageFingerprint = ["qa", "incident", "form", "before", "review"].join("-");
const afterReloadPageFingerprint = ["qa", "incident", "form", "after", "reload"].join("-");
const freshPageApproval = {
  approvalPageFingerprint: reviewedPageFingerprint,
  currentPageFingerprint: reviewedPageFingerprint
};

describe("QA browser-assisted text-field autofill gate", () => {
  it("builds the exact QA and dev approval phrases", () => {
    expect(getRequiredQaAutofillApprovalPhrase("qa")).toBe(qaApprovalPhrase);
    expect(getRequiredQaAutofillApprovalPhrase("dev")).toBe(devApprovalPhrase);
  });

  it("returns ready for QA single-ticket text-field autofill with exact phrase and confirmations", () => {
    const plan = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval,
      unexpectedRequiredFields: []
    });

    expect(plan.status).toBe("ready-for-autofill");
    expect(plan.allowedFields.map((field) => field.key)).toEqual(["shortDescription", "description", "workNotes"]);
    expect(plan.operations.map((operation) => operation.kind)).toEqual(["fill-text", "fill-text", "fill-text"]);
    expect(plan.operations.every((operation) => operation.stopBeforeWrite)).toBe(true);
    expect(plan.safety).toMatchObject({
      singleTicketOnly: true,
      textFieldsOnly: true,
      autofillOnly: true,
      noSaveSubmitUpdateClose: true,
      noServiceNowApi: true,
      noBulkCreateOrFill: true,
      noArtifactCapture: true,
      productionWriteAllowed: false
    });
    expect(plan.stopMessage).toBe("Autofill completed. The tool will not Save, Submit, Update, or Close. Review the QA page manually.");
  });

  it("blocks mock and production-shadow even with the autofill phrase", () => {
    for (const environment of [mockEnvironment, productionShadowEnvironment]) {
      const plan = buildQaTextFieldAutofillPlan({
        draft: completeDraft(),
        environment,
        targetValidation: qaTargetValidation,
        approvalPhrase: getRequiredQaAutofillApprovalPhrase("qa"),
        qaIsolationConfirmed: true,
        dedicatedProfileConfirmed: true,
        selectorVerification,
        ...freshPageApproval
      });

      expect(plan.status).toBe("blocked");
      expect(plan.blockedReason).toBe("qa-dev-only");
      expect(plan.operations).toEqual([]);
    }
  });

  it("requires QA isolation, dedicated profile confirmation, and the exact autofill phrase", () => {
    const missingPhrase = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval
    });
    const savePhrase = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: getRequiredRealActionApprovalPhrase("qa", "save_incident"),
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval
    });
    const missingIsolation = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: false,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval
    });
    const missingDedicatedProfile = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: false,
      selectorVerification,
      ...freshPageApproval
    });

    expect(missingPhrase.blockedReason).toBe("approval-phrase-required");
    expect(savePhrase.blockedReason).toBe("approval-phrase-mismatch");
    expect(missingIsolation.blockedReason).toBe("qa-isolation-confirmation-required");
    expect(missingDedicatedProfile.blockedReason).toBe("dedicated-profile-confirmation-required");
  });

  it("invalidates approval when the reviewed field screen changes before autofill", () => {
    const staleApproval = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      approvalPageFingerprint: beforeReviewPageFingerprint,
      currentPageFingerprint: afterReloadPageFingerprint
    });
    const freshApproval = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      approvalPageFingerprint: reviewedPageFingerprint,
      currentPageFingerprint: reviewedPageFingerprint
    });

    expect(staleApproval.status).toBe("blocked");
    expect(staleApproval.blockedReason).toBe("approval-stale-after-page-change");
    expect(staleApproval.operations).toEqual([]);
    expect(freshApproval.status).toBe("ready-for-autofill");
  });

  it("requires fresh page fingerprint evidence before a plan can be ready for autofill", () => {
    const missingBoth = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification
    });
    const missingCurrent = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      approvalPageFingerprint: reviewedPageFingerprint
    });
    const missingApproved = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      currentPageFingerprint: reviewedPageFingerprint
    });

    expect(missingBoth.status).toBe("blocked");
    expect(missingBoth.blockedReason).toBe("approval-stale-after-page-change");
    expect(missingCurrent.blockedReason).toBe("approval-stale-after-page-change");
    expect(missingApproved.blockedReason).toBe("approval-stale-after-page-change");
  });

  it("allows dev with the dev-specific phrase and blocks the QA phrase in dev", () => {
    const devReady = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: devEnvironment,
      targetValidation: { ...qaTargetValidation, host: "dev.service-now.example.invalid", allowedHost: "dev.service-now.example.invalid" },
      approvalPhrase: devApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval
    });
    const devWithQaPhrase = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: devEnvironment,
      targetValidation: { ...qaTargetValidation, host: "dev.service-now.example.invalid", allowedHost: "dev.service-now.example.invalid" },
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval
    });

    expect(devReady.status).toBe("ready-for-autofill");
    expect(devWithQaPhrase.status).toBe("blocked");
    expect(devWithQaPhrase.blockedReason).toBe("approval-phrase-mismatch");
  });

  it("fills only approved text fields and never includes button/write operations", () => {
    const plan = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval,
      requestedOperations: ["fill-text", "click-save"]
    });

    expect(plan.status).toBe("blocked");
    expect(plan.blockedReason).toBe("write-operation-denied");
    expect(JSON.stringify(plan)).not.toContain("sysverb_insert");
    expect(JSON.stringify(plan)).not.toContain("button");
  });

  it("fails closed on selector mismatch or unexpected required fields", () => {
    const missingSelectorVerification = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });
    const missingSelector = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification: { ...selectorVerification, workNotes: "missing" }
    });
    const unexpectedRequiredField = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval,
      unexpectedRequiredFields: ["assignment_group"]
    });

    expect(missingSelectorVerification.status).toBe("blocked");
    expect(missingSelectorVerification.blockedReason).toBe("selector-verification-required");
    expect(missingSelectorVerification.operations).toEqual([]);
    expect(missingSelector.status).toBe("blocked");
    expect(missingSelector.blockedReason).toBe("selector-mismatch");
    expect(unexpectedRequiredField.status).toBe("blocked");
    expect(unexpectedRequiredField.blockedReason).toBe("unexpected-required-field");
    expect(JSON.stringify(unexpectedRequiredField)).not.toContain("assignment_group");
  });

  it("blocks missing text values and bulk/multi-ticket requests", () => {
    const missingValue = buildQaTextFieldAutofillPlan({
      draft: completeDraft({ workNotes: undefined }),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval
    });
    const bulk = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval,
      ticketCount: 2
    });

    expect(missingValue.blockedReason).toBe("missing-text-field-value");
    expect(bulk.blockedReason).toBe("bulk-mode-denied");
  });

  it("does not echo raw target URLs, query strings, userinfo, ticket ids, sys ids, cookies, or sessions in denied output", () => {
    const urlUserInfoMarker = "user:" + "***" + String.fromCharCode(64);
    const sensitiveCookieName = "coo" + "kie";
    const sensitiveSessionValue = "sess" + "ion";
    const sensitiveSysIdValue = ["abcdefabcdef", "abcdefabcdef", "abcdefab"].join("");
    const rawTargetUrl =
      `https://${urlUserInfoMarker}qa.service-now.example.invalid/nav_to.do?sys` +
      `_id=${sensitiveSysIdValue}&${sensitiveCookieName}=${sensitiveSessionValue}`;
    const plan = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetUrl: rawTargetUrl,
      targetValidation: {
        allowed: false,
        reason: "credentials-in-url-denied",
        host: "qa.service-now.example.invalid",
        allowedHost: "qa.service-now.example.invalid"
      },
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ...freshPageApproval
    });
    const serialized = JSON.stringify(plan);

    expect(plan.status).toBe("blocked");
    expect(plan.blockedReason).toBe("target-validation-denied");
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("user:");
    expect(serialized).not.toContain("@");
    expect(serialized).not.toContain("sys" + "_id");
    expect(serialized).not.toContain(sensitiveSysIdValue);
    expect(serialized).not.toContain("coo" + "kie");
    expect(serialized).not.toContain("sess" + "ion");
  });

  it("keeps the plan object free of runnable browser script content", () => {
    const plan = readyPlan();
    const serialized = JSON.stringify(plan);

    expect(plan.status).toBe("ready-for-autofill");
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
    expect(serialized).not.toContain("click()");
    expect(serialized).not.toContain("submit()");
    expect(serialized).not.toContain("document." + "coo" + "kie");
    expect(serialized).not.toContain("outerHTML");
    expect(serialized).not.toContain("localStorage");
    expect(serialized).not.toContain("sess" + "ionStorage");
  });

  it("executes a selector-verified fixture autofill harness without exposing field values or write actions", () => {
    const result = executeQaTextFieldAutofillFixture(readyPlan(), {
      fields: [
        { key: "shortDescription", matchedSelectorCount: 1, elementType: "text", writable: true },
        { key: "description", matchedSelectorCount: 1, elementType: "textarea", writable: true },
        { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: true }
      ],
      unexpectedRequiredFieldCount: 0
    });
    const serialized = JSON.stringify(result);

    expect(result.status).toBe("completed");
    expect(result.filledFields.map((field) => field.key)).toEqual(["shortDescription", "description", "workNotes"]);
    expect(result.filledFields.every((field) => field.valueLength > 0)).toBe(true);
    expect(result.filledFields.every((field) => field.value === undefined)).toBe(true);
    expect(result.writeActionsAttempted).toBe(false);
    expect(result.artifactsCaptured).toBe(false);
    expect(serialized).not.toContain("Fake sanitized");
    expect(serialized).not.toContain("VPN access issue");
    expect(serialized).not.toContain("Save");
    expect(serialized).not.toContain("Submit");
    expect(serialized).not.toContain("Update");
    expect(serialized).not.toContain("Close");
  });

  it("blocks fixture execution unless the autofill plan is already ready", () => {
    const blockedPlan = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true
    });

    const result = executeQaTextFieldAutofillFixture(blockedPlan, {
      fields: [
        { key: "shortDescription", matchedSelectorCount: 1, elementType: "text", writable: true },
        { key: "description", matchedSelectorCount: 1, elementType: "textarea", writable: true },
        { key: "workNotes", matchedSelectorCount: 1, elementType: "textarea", writable: true }
      ]
    });

    expect(blockedPlan.blockedReason).toBe("selector-verification-required");
    expect(result.status).toBe("blocked");
    expect(result.blockedReason).toBe("plan-not-ready");
    expect(result.filledFields).toEqual([]);
  });

  it("fails closed on missing selectors, ambiguous selectors, wrong element types, non-writable fields, or unexpected required fields", () => {
    const plan = readyPlan();
    const baseFields = [
      { key: "shortDescription" as const, matchedSelectorCount: 1 as const, elementType: "text" as const, writable: true },
      { key: "description" as const, matchedSelectorCount: 1 as const, elementType: "textarea" as const, writable: true },
      { key: "workNotes" as const, matchedSelectorCount: 1 as const, elementType: "textarea" as const, writable: true }
    ];

    expect(executeQaTextFieldAutofillFixture(plan, { fields: [{ ...baseFields[0], matchedSelectorCount: 0 }, baseFields[1], baseFields[2]] }).blockedReason).toBe("selector-mismatch");
    expect(executeQaTextFieldAutofillFixture(plan, { fields: [baseFields[0], { ...baseFields[1], matchedSelectorCount: 2 }, baseFields[2]] }).blockedReason).toBe("selector-mismatch");
    expect(executeQaTextFieldAutofillFixture(plan, { fields: [baseFields[0], { ...baseFields[1], elementType: "select" }, baseFields[2]] }).blockedReason).toBe("selector-mismatch");
    expect(executeQaTextFieldAutofillFixture(plan, { fields: [baseFields[0], baseFields[1], { ...baseFields[2], writable: false }] }).blockedReason).toBe("selector-mismatch");
    expect(executeQaTextFieldAutofillFixture(plan, { fields: baseFields, unexpectedRequiredFieldCount: 1 }).blockedReason).toBe("unexpected-required-field");
    expect(executeQaTextFieldAutofillFixture(plan, { fields: [...baseFields, { ...baseFields[1], matchedSelectorCount: 2 }] }).blockedReason).toBe("selector-mismatch");
  });

  it("accepts one visible ServiceNow control when hidden duplicate selector matches exist", () => {
    const plan = readyPlan();
    const fields = [
      { key: "shortDescription" as const, matchedSelectorCount: 5, visibleSelectorCount: 1, elementType: "text" as const, writable: true },
      { key: "description" as const, matchedSelectorCount: 1, visibleSelectorCount: 1, elementType: "textarea" as const, writable: true },
      { key: "workNotes" as const, matchedSelectorCount: 1, visibleSelectorCount: 1, elementType: "textarea" as const, writable: true }
    ];

    expect(buildQaAutofillSelectorVerificationFromEvidence({ fields })).toEqual({
      shortDescription: "found",
      description: "found",
      workNotes: "found"
    });
    expect(executeQaTextFieldAutofillFixture(plan, { fields }).status).toBe("completed");
    expect(executeQaTextFieldAutofillFixture(plan, {
      fields: [{ ...fields[0], visibleSelectorCount: 2 }, fields[1], fields[2]]
    }).blockedReason).toBe("selector-mismatch");
  });
});

function readyPlan() {
  return buildQaTextFieldAutofillPlan({
    draft: completeDraft(),
    environment: qaEnvironment,
    targetValidation: qaTargetValidation,
    approvalPhrase: qaApprovalPhrase,
    qaIsolationConfirmed: true,
    dedicatedProfileConfirmed: true,
    selectorVerification,
    ...freshPageApproval,
    unexpectedRequiredFields: []
  });
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
