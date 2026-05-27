import { describe, expect, it } from "vitest";

import {
  buildIncidentFieldMappingPreview,
  evaluateQaSingleTicketSmokePlan,
  type IncidentFieldMappingPreviewOptions
} from "./qa-single-ticket-smoke";
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

const completeMappingOptions: IncidentFieldMappingPreviewOptions = {
  requester: "Demo requester",
  contactType: "Self-service / manual paste",
  location: "Demo location / sanitized"
};

describe("QA single-ticket smoke preview", () => {
  it("builds the required Incident field mapping preview", () => {
    const preview = buildIncidentFieldMappingPreview(completeDraft(), completeMappingOptions);

    expect(preview.missingRequiredFields).toEqual([]);
    expect(preview.fieldMappings.map((field) => field.key)).toEqual([
      "requester",
      "contactType",
      "category",
      "subcategory",
      "location",
      "impact",
      "urgency",
      "assignmentGroup",
      "shortDescription",
      "description",
      "workNotes"
    ]);
    expect(preview.fieldMappings.find((field) => field.key === "requester")).toMatchObject({
      value: "Demo requester",
      source: "sanitized-context"
    });
  });

  it("blocks production-shadow single-ticket QA smoke even with the phrase", () => {
    const plan = evaluateQaSingleTicketSmokePlan({
      draft: completeDraft(),
      environment: productionShadowEnvironment,
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: qaTargetValidation,
      mappingOptions: completeMappingOptions,
      approvalPhrase: "I APPROVE PRODUCTION-SHADOW SUBMIT ONLY",
      now: "2026-05-20T00:00:00.000Z"
    });

    expect(plan.status).toBe("blocked");
    expect(plan.gateDecision.reason).toBe("production-shadow-write-denied");
    expect(plan.safety.productionWriteAllowed).toBe(false);
  });

  it("blocks mock mode", () => {
    const plan = evaluateQaSingleTicketSmokePlan({
      draft: completeDraft(),
      environment: mockEnvironment,
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: qaTargetValidation,
      mappingOptions: completeMappingOptions,
      approvalPhrase: "I APPROVE MOCK SUBMIT ONLY"
    });

    expect(plan.status).toBe("blocked");
    expect(plan.gateDecision.reason).toBe("mock-write-denied");
  });

  it("requires an explicit phrase for QA and dev", () => {
    const qaPlan = evaluateQaSingleTicketSmokePlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: qaTargetValidation,
      mappingOptions: completeMappingOptions
    });
    const devPlan = evaluateQaSingleTicketSmokePlan({
      draft: completeDraft(),
      environment: devEnvironment,
      targetUrl: "https://dev.service-now.example.invalid/nav_to.do",
      targetValidation: {
        allowed: true,
        reason: "target-allowlisted",
        host: "dev.service-now.example.invalid",
        allowedHost: "dev.service-now.example.invalid"
      },
      mappingOptions: completeMappingOptions
    });

    expect(qaPlan.status).toBe("blocked");
    expect(qaPlan.gateDecision.reason).toBe("explicit-approval-required");
    expect(devPlan.status).toBe("blocked");
    expect(devPlan.gateDecision.reason).toBe("explicit-approval-required");
  });

  it("blocks a wrong phrase", () => {
    const plan = evaluateQaSingleTicketSmokePlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: qaTargetValidation,
      mappingOptions: completeMappingOptions,
      approvalPhrase: "I APPROVE QA WRITE ONLY"
    });

    expect(plan.status).toBe("blocked");
    expect(plan.gateDecision.reason).toBe("approval-phrase-mismatch");
  });

  it("returns ready for manual fill only with the correct QA phrase and complete mapping", () => {
    const plan = evaluateQaSingleTicketSmokePlan({
      draft: completeDraft(),
      environment: qaEnvironment,
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: qaTargetValidation,
      mappingOptions: completeMappingOptions,
      approvalPhrase: "I APPROVE QA SUBMIT ONLY",
      language: "en-US",
      templatePreset: "standard-service-desk",
      now: "2026-05-20T12:00:00.000Z"
    });

    expect(plan.status).toBe("ready-for-manual-fill");
    expect(plan.targetHost).toBe("qa.service-now.example.invalid");
    expect(plan.gateDecision.allowed).toBe(true);
    expect(plan.writeActionApprovalPhrases).toEqual([
      { action: "save_incident", label: "Save", phrase: "I APPROVE QA SAVE ONLY" },
      { action: "submit_incident", label: "Submit", phrase: "I APPROVE QA SUBMIT ONLY" },
      { action: "update_incident", label: "Update", phrase: "I APPROVE QA UPDATE ONLY" },
      { action: "close_incident", label: "Close", phrase: "I APPROVE QA CLOSE ONLY" }
    ]);
    expect(plan.stopRules).toContain(
      "Stop before every Save/Submit/Update/Resolve/Close unless Alan gives the exact action-specific approval phrase."
    );
    expect(plan.stopRules).toContain("Stop if the QA ticket could notify production users or a real support team.");
    expect(plan.missingRequiredFields).toEqual([]);
    expect(plan.safety).toMatchObject({
      manualFillOnly: true,
      noBrowserAutomation: true,
      noServiceNowApi: true,
      noAutoSubmit: true,
      noExternalActionPerformed: true,
      productionWriteAllowed: false
    });
    expect(plan.privacySafeAuditPreview).toEqual({
      timestamp: "2026-05-20T12:00:00.000Z",
      mode: "qa",
      language: "en-US",
      templatePreset: "standard-service-desk",
      actionState: "ready-for-manual-fill"
    });
  });

  it("blocks when a required mapping is missing even with the correct phrase", () => {
    const plan = evaluateQaSingleTicketSmokePlan({
      draft: completeDraft({ subcategory: undefined }),
      environment: qaEnvironment,
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: qaTargetValidation,
      mappingOptions: completeMappingOptions,
      approvalPhrase: "I APPROVE QA SUBMIT ONLY"
    });

    expect(plan.status).toBe("blocked");
    expect(plan.gateDecision.allowed).toBe(true);
    expect(plan.missingRequiredFields).toContain("subcategory");
  });
});

function completeDraft(overrides: Partial<TicketDraft> = {}): TicketDraft {
  return {
    id: "draft-1",
    sourceContextId: "context-1",
    ticketType: "incident",
    shortDescription: field("VPN access issue"),
    description: field("User reports VPN access issue after password reset."),
    workNotes: field("Review VPN client and MFA state."),
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
