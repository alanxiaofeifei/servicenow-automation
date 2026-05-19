export type RealActionMode = "mock" | "qa" | "dev" | "production-shadow";

export const realActionTypes = [
  "submit_incident",
  "update_incident",
  "save_incident",
  "close_incident",
  "create_change",
  "upload_attachment",
  "send_email"
] as const;

export type RealActionType = (typeof realActionTypes)[number];

export type RealActionEnvironment = {
  mode: RealActionMode;
  allowsRealSubmit: boolean;
  requiresExplicitApprovalBeforeRealSubmit: boolean;
  shadowOnly: boolean;
};

export type RealActionTargetValidation = {
  allowed: boolean;
  reason: string;
  host?: string;
  allowedHost?: string;
};

export type RealActionApproval = {
  operator: "Alan" | string;
  mode: RealActionMode;
  action: RealActionType;
  targetHost: string;
  phrase: string;
};

export type RealActionGateRequest = {
  environment: RealActionEnvironment;
  action: RealActionType;
  targetUrl: string;
  targetValidation?: RealActionTargetValidation;
  approval?: RealActionApproval;
};

export type RealActionGateReason =
  | "approved-for-qa-dev-write"
  | "mock-write-denied"
  | "production-shadow-write-denied"
  | "environment-real-submit-disabled"
  | "target-url-not-https"
  | "target-url-credentials-denied"
  | "target-not-allowlisted"
  | "target-validation-host-mismatch"
  | "explicit-approval-required"
  | "approval-operator-mismatch"
  | "approval-mode-mismatch"
  | "approval-action-mismatch"
  | "approval-target-host-mismatch"
  | "approval-phrase-mismatch"
  | "invalid-target-url";

export type RealActionDecision = {
  allowed: boolean;
  reason: RealActionGateReason;
  requiresApproval: boolean;
  writeActionAttempted: true;
  productionWriteAllowed: false;
  requiredApprovalPhrase?: string;
  targetHost?: string;
};

const actionPhraseLabels: Record<RealActionType, string> = {
  submit_incident: "SUBMIT",
  update_incident: "UPDATE",
  save_incident: "SAVE",
  close_incident: "CLOSE",
  create_change: "CREATE CHANGE",
  upload_attachment: "UPLOAD ATTACHMENT",
  send_email: "SEND EMAIL"
};

export function getRequiredRealActionApprovalPhrase(mode: RealActionMode, action: RealActionType): string {
  return `I APPROVE ${mode.toUpperCase()} ${actionPhraseLabels[action]} ONLY`;
}

export function authorizeRealAction(request: RealActionGateRequest): RealActionDecision {
  const requiresApproval = request.environment.mode === "qa" || request.environment.mode === "dev";
  const requiredApprovalPhrase = getRequiredRealActionApprovalPhrase(request.environment.mode, request.action);

  if (request.environment.mode === "mock") {
    return deny("mock-write-denied", requiresApproval, requiredApprovalPhrase);
  }

  if (request.environment.mode === "production-shadow" || request.environment.shadowOnly) {
    return deny("production-shadow-write-denied", requiresApproval, requiredApprovalPhrase);
  }

  if (!request.environment.allowsRealSubmit) {
    return deny("environment-real-submit-disabled", requiresApproval, requiredApprovalPhrase);
  }

  const target = parseTargetUrl(request.targetUrl);
  if (!target) {
    return deny("invalid-target-url", requiresApproval, requiredApprovalPhrase);
  }

  if (target.protocol !== "https:") {
    return deny("target-url-not-https", requiresApproval, requiredApprovalPhrase, target.host.toLowerCase());
  }

  const targetHost = target.host.toLowerCase();
  if (target.username || target.password) {
    return deny("target-url-credentials-denied", requiresApproval, requiredApprovalPhrase, targetHost);
  }

  if (!request.targetValidation?.allowed) {
    return deny("target-not-allowlisted", requiresApproval, requiredApprovalPhrase, targetHost);
  }

  if (request.targetValidation.host?.toLowerCase() !== targetHost) {
    return deny("target-validation-host-mismatch", requiresApproval, requiredApprovalPhrase, targetHost);
  }

  if (!request.approval) {
    return deny("explicit-approval-required", true, requiredApprovalPhrase, targetHost);
  }

  if (request.approval.operator !== "Alan") {
    return deny("approval-operator-mismatch", true, requiredApprovalPhrase, targetHost);
  }

  if (request.approval.mode !== request.environment.mode) {
    return deny("approval-mode-mismatch", true, requiredApprovalPhrase, targetHost);
  }

  if (request.approval.action !== request.action) {
    return deny("approval-action-mismatch", true, requiredApprovalPhrase, targetHost);
  }

  if (request.approval.targetHost.toLowerCase() !== targetHost) {
    return deny("approval-target-host-mismatch", true, requiredApprovalPhrase, targetHost);
  }

  if (request.approval.phrase !== requiredApprovalPhrase) {
    return deny("approval-phrase-mismatch", true, requiredApprovalPhrase, targetHost);
  }

  return {
    allowed: true,
    reason: "approved-for-qa-dev-write",
    requiresApproval: true,
    writeActionAttempted: true,
    productionWriteAllowed: false,
    requiredApprovalPhrase,
    targetHost
  };
}

function deny(
  reason: RealActionGateReason,
  requiresApproval: boolean,
  requiredApprovalPhrase: string,
  targetHost?: string
): RealActionDecision {
  return {
    allowed: false,
    reason,
    requiresApproval,
    writeActionAttempted: true,
    productionWriteAllowed: false,
    requiredApprovalPhrase,
    targetHost
  };
}

function parseTargetUrl(targetUrl: string): URL | undefined {
  try {
    return new URL(targetUrl);
  } catch {
    return undefined;
  }
}
