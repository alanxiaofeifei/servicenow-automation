import { describe, expect, it } from "vitest";

import {
  buildQaTextFieldAutofillPlan,
  getRequiredQaAutofillApprovalPhrase,
  type QaAutofillSelectorVerification
} from "./qa-browser-autofill";
import type { FieldDraft, TicketDraft } from "./models";
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
  "I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED";
const devApprovalPhrase =
  "I APPROVE DEV SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED";

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
        selectorVerification
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
      selectorVerification
    });
    const savePhrase = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: "I APPROVE QA SAVE ONLY",
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification
    });
    const missingIsolation = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: false,
      dedicatedProfileConfirmed: true,
      selectorVerification
    });
    const missingDedicatedProfile = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: false,
      selectorVerification
    });

    expect(missingPhrase.blockedReason).toBe("approval-phrase-required");
    expect(savePhrase.blockedReason).toBe("approval-phrase-mismatch");
    expect(missingIsolation.blockedReason).toBe("qa-isolation-confirmation-required");
    expect(missingDedicatedProfile.blockedReason).toBe("dedicated-profile-confirmation-required");
  });

  it("allows dev with the dev-specific phrase and blocks the QA phrase in dev", () => {
    const devReady = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: devEnvironment,
      targetValidation: { ...qaTargetValidation, host: "dev.service-now.example.invalid", allowedHost: "dev.service-now.example.invalid" },
      approvalPhrase: devApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification
    });
    const devWithQaPhrase = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: devEnvironment,
      targetValidation: { ...qaTargetValidation, host: "dev.service-now.example.invalid", allowedHost: "dev.service-now.example.invalid" },
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification
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
      selectorVerification
    });
    const bulk = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification,
      ticketCount: 2
    });

    expect(missingValue.blockedReason).toBe("missing-text-field-value");
    expect(bulk.blockedReason).toBe("bulk-mode-denied");
  });

  it("does not echo raw target URLs, query strings, userinfo, ticket ids, sys ids, cookies, or sessions in denied output", () => {
    const urlUserInfoMarker = "user:" + "***" + String.fromCharCode(64);
    const sensitiveCookieName = "coo" + "kie";
    const sensitiveSessionValue = "sess" + "ion";
    const rawTargetUrl =
      `https://${urlUserInfoMarker}qa.service-now.example.invalid/nav_to.do?sys` +
      `_id=abcdefabcdefabcdefabcdefabcdefab&${sensitiveCookieName}=${sensitiveSessionValue}`;
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
      selectorVerification
    });
    const serialized = JSON.stringify(plan);

    expect(plan.status).toBe("blocked");
    expect(plan.blockedReason).toBe("target-validation-denied");
    expect(serialized).not.toContain("https" + "://");
    expect(serialized).not.toContain("user:");
    expect(serialized).not.toContain("@");
    expect(serialized).not.toContain("sys" + "_id");
    expect(serialized).not.toContain("abcdefabcdefabcdefabcdefabcdefab");
    expect(serialized).not.toContain("cookie");
    expect(serialized).not.toContain("session");
  });

  it("keeps this slice plan-only without producing a runnable browser script", () => {
    const plan = buildQaTextFieldAutofillPlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetValidation: qaTargetValidation,
      approvalPhrase: qaApprovalPhrase,
      qaIsolationConfirmed: true,
      dedicatedProfileConfirmed: true,
      selectorVerification
    });
    const serialized = JSON.stringify(plan);

    expect(plan.status).toBe("ready-for-autofill");
    expect(serialized).not.toContain("querySelector");
    expect(serialized).not.toContain("dispatchEvent");
    expect(serialized).not.toContain("click()");
    expect(serialized).not.toContain("submit()");
    expect(serialized).not.toContain("document.cookie");
    expect(serialized).not.toContain("outerHTML");
    expect(serialized).not.toContain("localStorage");
    expect(serialized).not.toContain("sessionStorage");
  });
});

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
