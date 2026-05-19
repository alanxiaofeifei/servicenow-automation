import { describe, expect, it } from "vitest";

import {
  authorizeRealAction,
  getRequiredRealActionApprovalPhrase,
  realActionTypes,
  type RealActionEnvironment,
  type RealActionTargetValidation
} from "./real-action-gate";

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

const productionShadowEnvironment: RealActionEnvironment = {
  mode: "production-shadow",
  allowsRealSubmit: false,
  requiresExplicitApprovalBeforeRealSubmit: true,
  shadowOnly: true
};

const mockEnvironment: RealActionEnvironment = {
  mode: "mock",
  allowsRealSubmit: false,
  requiresExplicitApprovalBeforeRealSubmit: false,
  shadowOnly: true
};

function allowlisted(host: string): RealActionTargetValidation {
  return {
    allowed: true,
    reason: "target-allowlisted",
    host,
    allowedHost: host
  };
}

describe("RealActionGate", () => {
  it("tracks every real ServiceNow write action through the same gate", () => {
    expect(realActionTypes).toEqual([
      "submit_incident",
      "update_incident",
      "save_incident",
      "close_incident",
      "create_change",
      "upload_attachment",
      "send_email"
    ]);
  });

  it("does not allow QA submit only because the environment allows real submit", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("qa-example.service-now.com")
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "explicit-approval-required",
      requiresApproval: true,
      writeActionAttempted: true
    });
    expect(decision.requiredApprovalPhrase).toBe("I APPROVE QA SUBMIT ONLY");
  });

  it("allows QA submit only with HTTPS, allowlisted target, and Alan approval bound to mode/action/host", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("qa-example.service-now.com"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "submit_incident",
        targetHost: "qa-example.service-now.com",
        phrase: "I APPROVE QA SUBMIT ONLY"
      }
    });

    expect(decision).toMatchObject({
      allowed: true,
      reason: "approved-for-qa-dev-write",
      requiresApproval: true,
      writeActionAttempted: true
    });
  });

  it("denies QA writes when target validation is missing, denied, mismatched, or non-HTTPS", () => {
    const approval = {
      operator: "Alan",
      mode: "qa" as const,
      action: "submit_incident" as const,
      targetHost: "qa-example.service-now.com",
      phrase: "I APPROVE QA SUBMIT ONLY"
    };

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "https://qa-example.service-now.com/nav_to.do",
        approval
      }).reason
    ).toBe("target-not-allowlisted");

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "https://qa-example.service-now.com/nav_to.do",
        targetValidation: {
          allowed: false,
          reason: "host-not-allowlisted",
          host: "qa-example.service-now.com",
          allowedHost: "other-example.service-now.com"
        },
        approval
      }).reason
    ).toBe("target-not-allowlisted");

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "https://qa-example.service-now.com/nav_to.do",
        targetValidation: allowlisted("other-example.service-now.com"),
        approval
      }).reason
    ).toBe("target-validation-host-mismatch");

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "http://qa-example.service-now.com/nav_to.do",
        targetValidation: allowlisted("qa-example.service-now.com"),
        approval
      }).reason
    ).toBe("target-url-not-https");
  });

  it("denies QA submit when the approval phrase or action binding is wrong", () => {
    const wrongPhrase = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("qa-example.service-now.com"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "submit_incident",
        targetHost: "qa-example.service-now.com",
        phrase: "I APPROVE QA WRITE ONLY"
      }
    });

    const wrongAction = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("qa-example.service-now.com"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "update_incident",
        targetHost: "qa-example.service-now.com",
        phrase: "I APPROVE QA UPDATE ONLY"
      }
    });

    expect(wrongPhrase.reason).toBe("approval-phrase-mismatch");
    expect(wrongPhrase.allowed).toBe(false);
    expect(wrongAction.reason).toBe("approval-action-mismatch");
    expect(wrongAction.allowed).toBe(false);
  });

  it("denies approval when the target host does not match the target URL", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("qa-example.service-now.com"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "submit_incident",
        targetHost: "evil-example.service-now.com",
        phrase: "I APPROVE QA SUBMIT ONLY"
      }
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("approval-target-host-mismatch");
  });

  it("allows QA save only with the same explicit write gate used for submit/update/close", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "save_incident",
      targetUrl: "https://qa-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("qa-example.service-now.com"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "save_incident",
        targetHost: "qa-example.service-now.com",
        phrase: "I APPROVE QA SAVE ONLY"
      }
    });

    expect(getRequiredRealActionApprovalPhrase("qa", "save_incident")).toBe("I APPROVE QA SAVE ONLY");
    expect(decision).toMatchObject({
      allowed: true,
      reason: "approved-for-qa-dev-write",
      requiresApproval: true,
      writeActionAttempted: true
    });
  });

  it("denies production-shadow save even when approval is supplied", () => {
    const decision = authorizeRealAction({
      environment: productionShadowEnvironment,
      action: "save_incident",
      targetUrl: "https://prod-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("prod-example.service-now.com"),
      approval: {
        operator: "Alan",
        mode: "production-shadow",
        action: "save_incident",
        targetHost: "prod-example.service-now.com",
        phrase: "I APPROVE PRODUCTION-SHADOW SAVE ONLY"
      }
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "production-shadow-write-denied",
      productionWriteAllowed: false
    });
  });

  it("denies production-shadow writes even when approval is supplied", () => {
    const decision = authorizeRealAction({
      environment: productionShadowEnvironment,
      action: "submit_incident",
      targetUrl: "https://prod-example.service-now.com/nav_to.do",
      targetValidation: allowlisted("prod-example.service-now.com"),
      approval: {
        operator: "Alan",
        mode: "production-shadow",
        action: "submit_incident",
        targetHost: "prod-example.service-now.com",
        phrase: "I APPROVE PRODUCTION-SHADOW SUBMIT ONLY"
      }
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "production-shadow-write-denied",
      productionWriteAllowed: false
    });
  });

  it("denies mock writes and supports dev approval phrases", () => {
    const mockDecision = authorizeRealAction({
      environment: mockEnvironment,
      action: "submit_incident",
      targetUrl: "https://mock.invalid"
    });

    expect(mockDecision.allowed).toBe(false);
    expect(mockDecision.reason).toBe("mock-write-denied");
    expect(getRequiredRealActionApprovalPhrase("dev", "update_incident")).toBe("I APPROVE DEV UPDATE ONLY");
    expect(
      authorizeRealAction({
        environment: devEnvironment,
        action: "update_incident",
        targetUrl: "https://dev-example.service-now.com/nav_to.do",
        targetValidation: allowlisted("dev-example.service-now.com"),
        approval: {
          operator: "Alan",
          mode: "dev",
          action: "update_incident",
          targetHost: "dev-example.service-now.com",
          phrase: "I APPROVE DEV UPDATE ONLY"
        }
      }).allowed
    ).toBe(true);
  });
});
