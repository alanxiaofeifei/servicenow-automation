import {
  CapturedContextSchema,
  type CapturedContext
} from "@servicenow-automation/core";

export type ManualPasteInput = {
  title?: string;
  rawText: string;
};

export type ManualPasteScenario = ManualPasteInput & {
  id:
    | "vpn-issue"
    | "shared-mailbox-evidence"
    | "phone-confirmation"
    | "self-service-normalization"
    | "remote-support-teams"
    | "account-login-issue";
  label: string;
};

export type ManualPasteAdapterOptions = {
  idFactory?: () => string;
  now?: () => Date;
};

export class ManualPasteAdapter {
  private readonly idFactory: () => string;
  private readonly now: () => Date;

  constructor(options: ManualPasteAdapterOptions = {}) {
    this.idFactory = options.idFactory ?? createContextId;
    this.now = options.now ?? (() => new Date());
  }

  capture(input: ManualPasteInput): CapturedContext {
    const rawText = input.rawText.trim();
    if (rawText.length === 0) {
      throw new Error("Manual paste text cannot be empty.");
    }

    return CapturedContextSchema.parse({
      id: this.idFactory(),
      sourceType: "manual_paste",
      capturedAt: this.now().toISOString(),
      title: normalizeOptionalTitle(input.title) ?? deriveTitle(rawText),
      rawText
    });
  }
}

export const demoManualPasteScenarios: ManualPasteScenario[] = [
  {
    id: "vpn-issue",
    label: "QA TEST — Fake Chat intake: VPN connection issue after password change",
    title: "QA TEST ONLY - Fake VPN connection issue after password change",
    rawText:
      "QA TEST ONLY — Fake sanitized chat intake. A fake requester reports VPN connection issues after a password change. No customer impact, no real user data, and no production action. Use this only to validate manual field mapping, Work Notes preparation, and Excel dry-run reporting."
  },
  {
    id: "shared-mailbox-evidence",
    label: "Shared mailbox with fake attachment evidence",
    title: "QA TEST ONLY - Fake shared mailbox item with attachment evidence",
    rawText:
      "QA TEST ONLY — Fake shared mailbox intake. A fake message mentions a screenshot-style attachment showing an access error, but no file is uploaded, parsed, OCRed, or sent to external AI. Evidence review should stay local and needs manual check."
  },
  {
    id: "phone-confirmation",
    label: "Phone call intake with confirmation state",
    title: "QA TEST ONLY - Fake phone intake requiring confirmation",
    rawText:
      "QA TEST ONLY — Fake phone intake. A fake caller reports intermittent application access after a password change. The agent must confirm requester, location, impact, urgency, and whether the issue is still reproducible before any manual QA fill."
  },
  {
    id: "self-service-normalization",
    label: "Self-service ticket requiring Service Desk normalization",
    title: "QA TEST ONLY - Fake self-service ticket requiring normalization",
    rawText:
      "QA TEST ONLY — Fake self-service submission. A fake portal item says a Windows endpoint is slow after update and needs Service Desk normalization into category, subcategory, impact, urgency, assignment group, and Work Notes."
  },
  {
    id: "remote-support-teams",
    label: "Remote support / Teams troubleshooting checklist",
    title: "QA TEST ONLY - Fake remote support checklist",
    rawText:
      "QA TEST ONLY — Fake remote support scenario. A fake Teams troubleshooting session records deterministic checks for network status, VPN client restart, MFA prompt behavior, and next routing decision. No remote desktop, screen capture, or real Teams data is connected."
  },
  {
    id: "account-login-issue",
    label: "Account/login demo issue",
    title: "Login issue after password change",
    rawText:
      "User cannot login after changing password. MFA prompt appears but authentication fails repeatedly. User can access some services but not the required application."
  }
];

function normalizeOptionalTitle(title: string | undefined): string | undefined {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function deriveTitle(rawText: string): string {
  const firstLine = rawText.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? rawText;
  const sentenceMatch = firstLine.match(/^(.+?[.!?。！？])(?:\s|$)/);
  const title = sentenceMatch?.[1] ?? firstLine;
  return title.length <= 80 ? title : `${title.slice(0, 77).trim()}...`;
}

function createContextId(): string {
  return `ctx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
