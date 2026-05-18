import {
  CapturedContextSchema,
  type CapturedContext
} from "@servicenow-automation/core";

export type ManualPasteInput = {
  title?: string;
  rawText: string;
};

export type ManualPasteScenario = ManualPasteInput & {
  id: "vpn-issue" | "windows-issue" | "account-login-issue";
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
    label: "VPN demo issue",
    title: "VPN connection issue after password reset",
    rawText:
      "User reports that VPN cannot connect after a recent password reset. The VPN client keeps looping at the MFA prompt. Internet works without VPN, but remote access is unavailable."
  },
  {
    id: "windows-issue",
    label: "Windows endpoint demo issue",
    title: "Windows laptop slow after update",
    rawText:
      "User reports that a Windows laptop became very slow after the latest update. Reboot was attempted once, but startup and application launch remain slow."
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
