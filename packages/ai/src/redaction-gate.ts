import type { GenerateTicketDraftInput } from "./types";

export type RedactionKind =
  | "url"
  | "email"
  | "ticket-id"
  | "sys-id"
  | "local-path"
  | "credential-assignment"
  | "phone";

export type RedactionFinding = {
  kind: RedactionKind;
  replacement: string;
  count: number;
};

export type ExternalAIRedactionPreview = {
  id: string;
  sourceContextId: string;
  redactedContext: string;
  findings: RedactionFinding[];
  safeToSend: boolean;
  blockedReasons: string[];
  disclosure: string;
};

export type ExternalAISendApproval = {
  previewId: string;
  externalSendConfirmed: boolean;
  acknowledgement: "content-will-leave-local-app";
};

export class ExternalAIBlockedError extends Error {
  readonly code: string;
  readonly blockedReasons: string[];

  constructor(code: string, blockedReasons: string[]) {
    super(blockedReasons.join("; "));
    this.name = "ExternalAIBlockedError";
    this.code = code;
    this.blockedReasons = blockedReasons;
  }
}

type RedactionRule = {
  kind: RedactionKind;
  replacement: string;
  pattern: RegExp;
};

const REDACTION_DISCLOSURE =
  "External AI is disabled by default. If explicitly enabled, only this redacted preview is allowed to leave the local app.";

const REDACTION_RULES: RedactionRule[] = [
  {
    kind: "url",
    replacement: "[REDACTED_URL]",
    pattern: /https?:\/\/[^\s)\]}>"']+/gi
  },
  {
    kind: "email",
    replacement: "[REDACTED_EMAIL]",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  },
  {
    kind: "ticket-id",
    replacement: "[REDACTED_TICKET_ID]",
    pattern: /\b(?:INC|RITM|REQ|TASK|SCTASK|CHG|PRB)\d{5,}\b/gi
  },
  {
    kind: "sys-id",
    replacement: "[REDACTED_SYS_ID]",
    pattern: /\b[a-f0-9]{32}\b/gi
  },
  {
    kind: "local-path",
    replacement: "[REDACTED_PATH]",
    pattern: /(?:[A-Z]:\\Users\\[^\s"'<>]+|\/mnt\/[a-z]\/Users\/[^\s"'<>]+|\/home\/[^\s"'<>]+|\/Users\/[^\s"'<>]+)/g
  },
  {
    kind: "credential-assignment",
    replacement: "[REDACTED_CREDENTIAL]",
    pattern: /\b(?:passwd|secret|token|api[_ -]?key)\s*[:=]\s*[^\s"']+/gi
  },
  {
    kind: "phone",
    replacement: "[REDACTED_PHONE]",
    pattern: /\b(?:\+?\d[\d(). -]{7,}\d)\b/g
  }
];

export function createExternalAIRedactionPreview(input: GenerateTicketDraftInput): ExternalAIRedactionPreview {
  const { redactedText, findings } = redactExternalAIText(input.context.rawText);
  const blockedReasons = findResidualSensitivePatterns(redactedText);
  const redactedContext = redactedText.trim();

  if (redactedContext.length === 0) {
    blockedReasons.push("redacted-preview-empty");
  }

  return {
    id: `redaction-preview-${stableHash(JSON.stringify({ redactedContext, findings }))}`,
    sourceContextId: input.context.id,
    redactedContext,
    findings,
    safeToSend: blockedReasons.length === 0,
    blockedReasons,
    disclosure: REDACTION_DISCLOSURE
  };
}

export function redactExternalAIText(rawText: string): { redactedText: string; findings: RedactionFinding[] } {
  let redactedText = rawText;
  const findings: RedactionFinding[] = [];

  for (const rule of REDACTION_RULES) {
    let count = 0;
    redactedText = redactedText.replace(rule.pattern, () => {
      count += 1;
      return rule.replacement;
    });
    if (count > 0) {
      findings.push({ kind: rule.kind, replacement: rule.replacement, count });
    }
  }

  return { redactedText, findings };
}

export function assertExternalAISendAllowed(
  preview: ExternalAIRedactionPreview,
  approval: ExternalAISendApproval | undefined
): void {
  const blockedReasons: string[] = [];

  if (!preview.safeToSend) {
    blockedReasons.push(...preview.blockedReasons);
  }
  if (!approval) {
    blockedReasons.push("external-send-approval-missing");
  } else {
    if (approval.previewId !== preview.id) {
      blockedReasons.push("external-send-approval-preview-mismatch");
    }
    if (approval.externalSendConfirmed !== true) {
      blockedReasons.push("external-send-not-confirmed");
    }
    if (approval.acknowledgement !== "content-will-leave-local-app") {
      blockedReasons.push("external-send-disclosure-not-acknowledged");
    }
  }

  if (blockedReasons.length > 0) {
    throw new ExternalAIBlockedError("external-ai-redaction-gate-blocked", unique(blockedReasons));
  }
}

export function isExternalAIBlockedError(error: unknown): error is ExternalAIBlockedError {
  return error instanceof ExternalAIBlockedError;
}

function findResidualSensitivePatterns(text: string): string[] {
  const blockedReasons: string[] = [];

  for (const rule of REDACTION_RULES) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(text)) {
      blockedReasons.push(`residual-${rule.kind}`);
    }
  }

  return unique(blockedReasons);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
