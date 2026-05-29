import type { QaIncidentDefaultScenario, TicketDraft } from "@servicenow-automation/core";

export const OPERATOR_RUNTIME_QA_REQUIRED_BLOCKED_REASON = "qa-runtime-required" as const;

export type OperatorRuntimeBlockedReason = typeof OPERATOR_RUNTIME_QA_REQUIRED_BLOCKED_REASON;

export type OperatorRuntimeMode = "qa";

export type OperatorRuntimeRequest = {
  mode: OperatorRuntimeMode;
  targetUrl?: string;
  cdpEndpoint?: string;
  approvalPageFingerprint?: string;
  draft?: TicketDraft;
  scenario?: QaIncidentDefaultScenario;
  routeOutAssignmentGroup?: string;
  qaIsolationConfirmed?: boolean;
  dedicatedProfileConfirmed?: boolean;
};

export type OperatorRuntimeRequestGateResult =
  | { status: "allowed"; request: OperatorRuntimeRequest }
  | { status: "blocked"; blockedReason: OperatorRuntimeBlockedReason };

export function resolveOperatorRuntimeRequestGate(input: unknown): OperatorRuntimeRequestGateResult {
  if (!isRecord(input) || input.mode !== "qa") {
    return { status: "blocked", blockedReason: OPERATOR_RUNTIME_QA_REQUIRED_BLOCKED_REASON };
  }

  return {
    status: "allowed",
    request: compactRequest({
      mode: "qa",
      targetUrl: trimmedString(input.targetUrl),
      cdpEndpoint: trimmedString(input.cdpEndpoint),
      approvalPageFingerprint: trimmedString(input.approvalPageFingerprint),
      draft: isRecord(input.draft) ? (input.draft as TicketDraft) : undefined,
      scenario: input.scenario === "initial-create" || input.scenario === "route-out" ? input.scenario : undefined,
      routeOutAssignmentGroup: trimmedString(input.routeOutAssignmentGroup),
      qaIsolationConfirmed: typeof input.qaIsolationConfirmed === "boolean" ? input.qaIsolationConfirmed : undefined,
      dedicatedProfileConfirmed: typeof input.dedicatedProfileConfirmed === "boolean" ? input.dedicatedProfileConfirmed : undefined
    })
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function trimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function compactRequest(request: OperatorRuntimeRequest): OperatorRuntimeRequest {
  const compacted: OperatorRuntimeRequest = { mode: request.mode };
  if (request.targetUrl) compacted.targetUrl = request.targetUrl;
  if (request.cdpEndpoint) compacted.cdpEndpoint = request.cdpEndpoint;
  if (request.approvalPageFingerprint) compacted.approvalPageFingerprint = request.approvalPageFingerprint;
  if (request.draft) compacted.draft = request.draft;
  if (request.scenario) compacted.scenario = request.scenario;
  if (request.routeOutAssignmentGroup) compacted.routeOutAssignmentGroup = request.routeOutAssignmentGroup;
  if (request.qaIsolationConfirmed !== undefined) compacted.qaIsolationConfirmed = request.qaIsolationConfirmed;
  if (request.dedicatedProfileConfirmed !== undefined) compacted.dedicatedProfileConfirmed = request.dedicatedProfileConfirmed;
  return compacted;
}
