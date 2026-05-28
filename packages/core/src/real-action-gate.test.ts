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

function approvalPhrase(
  mode: Parameters<typeof getRequiredRealActionApprovalPhrase>[0],
  action: Parameters<typeof getRequiredRealActionApprovalPhrase>[1]
): string {
  return getRequiredRealActionApprovalPhrase(mode, action);
}

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
      "resolve_incident",
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
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid")
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "explicit-approval-required",
      requiresApproval: true,
      writeActionAttempted: true
    });
    expect(decision.requiredApprovalPhrase).toBe(approvalPhrase("qa", "submit_incident"));
  });

  it("allows QA submit only with HTTPS, allowlisted target, and Alan approval bound to mode/action/host", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "submit_incident",
        targetHost: "qa.service-now.example.invalid",
        phrase: approvalPhrase("qa", "submit_incident")
      }
    });

    expect(decision).toMatchObject({
      allowed: true,
      reason: "approved-for-qa-write",
      requiresApproval: true,
      writeActionAttempted: true
    });
  });

  it("denies QA writes when target validation is missing, denied, mismatched, or non-HTTPS", () => {
    const approval = {
      operator: "Alan",
      mode: "qa" as const,
      action: "submit_incident" as const,
      targetHost: "qa.service-now.example.invalid",
      phrase: approvalPhrase("qa", "submit_incident")
    };

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
        approval
      }).reason
    ).toBe("target-not-allowlisted");

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
        targetValidation: {
          allowed: false,
          reason: "host-not-allowlisted",
          host: "qa.service-now.example.invalid",
          allowedHost: "dev.service-now.example.invalid"
        },
        approval
      }).reason
    ).toBe("target-not-allowlisted");

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
        targetValidation: allowlisted("dev.service-now.example.invalid"),
        approval
      }).reason
    ).toBe("target-validation-host-mismatch");

    expect(
      authorizeRealAction({
        environment: qaEnvironment,
        action: "submit_incident",
        targetUrl: "http://qa.service-now.example.invalid/nav_to.do",
        targetValidation: allowlisted("qa.service-now.example.invalid"),
        approval
      }).reason
    ).toBe("target-url-not-https");
  });

  it("denies QA submit when the approval phrase or action binding is wrong", () => {
    const wrongPhrase = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "submit_incident",
        targetHost: "qa.service-now.example.invalid",
        phrase: ["I", "APPROVE", "QA", "WRITE", "ONLY"].join(" ")
      }
    });

    const wrongAction = authorizeRealAction({
      environment: qaEnvironment,
      action: "submit_incident",
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "update_incident",
        targetHost: "qa.service-now.example.invalid",
        phrase: approvalPhrase("qa", "update_incident")
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
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "submit_incident",
        targetHost: "dev.service-now.example.invalid",
        phrase: approvalPhrase("qa", "submit_incident")
      }
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("approval-target-host-mismatch");
  });

  it("allows QA save only with the same explicit write gate used for submit/update/resolve/close", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "save_incident",
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "save_incident",
        targetHost: "qa.service-now.example.invalid",
        phrase: approvalPhrase("qa", "save_incident")
      }
    });

    expect(getRequiredRealActionApprovalPhrase("qa", "save_incident")).toBe(approvalPhrase("qa", "save_incident"));
    expect(decision).toMatchObject({
      allowed: true,
      reason: "approved-for-qa-write",
      requiresApproval: true,
      writeActionAttempted: true
    });
  });

  it("allows QA resolve only with the same explicit write gate used for save/submit/update/resolve/close", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "resolve_incident",
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "resolve_incident",
        targetHost: "qa.service-now.example.invalid",
        phrase: approvalPhrase("qa", "resolve_incident")
      }
    });

    expect(getRequiredRealActionApprovalPhrase("qa", "resolve_incident")).toBe("I APPROVE QA RESOLVE ONLY");
    expect(decision).toMatchObject({
      allowed: true,
      reason: "approved-for-qa-write",
      requiresApproval: true,
      writeActionAttempted: true,
      productionWriteAllowed: false
    });
  });

  it("denies resolve when approval is bound to a different action phrase", () => {
    const decision = authorizeRealAction({
      environment: qaEnvironment,
      action: "resolve_incident",
      targetUrl: "https://qa.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("qa.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "qa",
        action: "resolve_incident",
        targetHost: "qa.service-now.example.invalid",
        phrase: approvalPhrase("qa", "close_incident")
      }
    });

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("approval-phrase-mismatch");
    expect(decision.requiredApprovalPhrase).toBe("I APPROVE QA RESOLVE ONLY");
  });

  it("denies production-shadow save even when approval is supplied", () => {
    const decision = authorizeRealAction({
      environment: productionShadowEnvironment,
      action: "save_incident",
      targetUrl: "https://prod-shadow.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("prod-shadow.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "production-shadow",
        action: "save_incident",
        targetHost: "prod-shadow.service-now.example.invalid",
        phrase: approvalPhrase("production-shadow", "save_incident")
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
      targetUrl: "https://prod-shadow.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("prod-shadow.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "production-shadow",
        action: "submit_incident",
        targetHost: "prod-shadow.service-now.example.invalid",
        phrase: approvalPhrase("production-shadow", "submit_incident")
      }
    });

    expect(decision).toMatchObject({
      allowed: false,
      reason: "production-shadow-write-denied",
      productionWriteAllowed: false
    });
  });

  it("denies mock and dev writes even when dev approval is supplied", () => {
    const mockDecision = authorizeRealAction({
      environment: mockEnvironment,
      action: "submit_incident",
      targetUrl: "https://mock.invalid"
    });

    expect(mockDecision.allowed).toBe(false);
    expect(mockDecision.reason).toBe("mock-write-denied");
    expect(getRequiredRealActionApprovalPhrase("dev", "update_incident")).toBe(approvalPhrase("dev", "update_incident"));

    const devDecision = authorizeRealAction({
      environment: devEnvironment,
      action: "update_incident",
      targetUrl: "https://dev.service-now.example.invalid/nav_to.do",
      targetValidation: allowlisted("dev.service-now.example.invalid"),
      approval: {
        operator: "Alan",
        mode: "dev",
        action: "update_incident",
        targetHost: "dev.service-now.example.invalid",
        phrase: approvalPhrase("dev", "update_incident")
      }
    });

    expect(devDecision).toMatchObject({
      allowed: false,
      reason: "dev-write-denied",
      requiresApproval: true,
      productionWriteAllowed: false
    });
  });
});
