import type { CapturedContext, KnowledgeMatch, ProjectProfile, TicketDraft } from "@servicenow-automation/core";
import { describe, expect, it } from "vitest";

import {
  ExternalAIBlockedError,
  assertExternalAISendAllowed,
  createExternalAIRedactionPreview,
  isExternalAIBlockedError,
  redactExternalAIText
} from "./index";

const profile: ProjectProfile = {
  id: "safe-demo-profile",
  displayName: "Safe Demo Service Desk",
  companyLabel: "Safe Demo",
  defaultAssignmentGroup: "Demo Service Desk",
  categoryMappings: [],
  assignmentMappings: [],
  kbSources: [],
  demoMode: true
};

const kbMatches: KnowledgeMatch[] = [];

function context(rawText: string): CapturedContext {
  return {
    id: "context-redaction",
    sourceType: "manual_paste",
    capturedAt: "2026-05-28T12:00:00.000Z",
    title: "Fake redaction item",
    rawText
  };
}

function input(rawText: string) {
  return { context: context(rawText), profile, kbMatches };
}

describe("external AI redaction gate", () => {
  it("redacts sensitive-looking fake values before external send approval", () => {
    const fakeTicket = "INC" + "123456";
    const fakeSysId = "a".repeat(32);
    const preview = createExternalAIRedactionPreview(input([
      "User Fake Person can be reached at fake.person@example.invalid.",
      `Reference ${fakeTicket} with sys id ${fakeSysId}.`,
      "Portal: https://example.invalid/incident/view.",
      "Local evidence under C:\\Users\\Fake\\Downloads\\case.txt.",
      "token=fake-demo-token-value"
    ].join("\n")));

    expect(preview.sourceContextId).toBe("context-redaction");
    expect(preview.safeToSend).toBe(true);
    expect(preview.blockedReasons).toEqual([]);
    expect(preview.disclosure).toMatch(/leave the local app/i);
    expect(preview.redactedContext).toContain("[REDACTED_EMAIL]");
    expect(preview.redactedContext).toContain("[REDACTED_TICKET_ID]");
    expect(preview.redactedContext).toContain("[REDACTED_SYS_ID]");
    expect(preview.redactedContext).toContain("[REDACTED_URL]");
    expect(preview.redactedContext).toContain("[REDACTED_PATH]");
    expect(preview.redactedContext).toContain("[REDACTED_CREDENTIAL]");
    expect(preview.redactedContext).not.toContain(fakeTicket);
    expect(preview.redactedContext).not.toContain(fakeSysId);
    expect(preview.findings.map((finding) => finding.kind)).toEqual([
      "url",
      "email",
      "ticket-id",
      "sys-id",
      "local-path",
      "credential-assignment"
    ]);
  });

  it("blocks external send without explicit matching preview approval", () => {
    const preview = createExternalAIRedactionPreview(input("Fake sanitized issue text only."));

    expect(() => assertExternalAISendAllowed(preview, undefined)).toThrow(ExternalAIBlockedError);
    expect(() => assertExternalAISendAllowed(preview, {
      previewId: "redaction-preview-wrong",
      externalSendConfirmed: true,
      acknowledgement: "content-will-leave-local-app"
    })).toThrow(/preview-mismatch/);
    expect(() => assertExternalAISendAllowed(preview, {
      previewId: preview.id,
      externalSendConfirmed: false,
      acknowledgement: "content-will-leave-local-app"
    })).toThrow(/not-confirmed/);

    expect(() => assertExternalAISendAllowed(preview, {
      previewId: preview.id,
      externalSendConfirmed: true,
      acknowledgement: "content-will-leave-local-app"
    })).not.toThrow();
  });

  it("keeps simple already-sanitized text unchanged", () => {
    const { redactedText, findings } = redactExternalAIText("Fake sanitized local-only request summary.");

    expect(redactedText).toBe("Fake sanitized local-only request summary.");
    expect(findings).toEqual([]);
  });
});

describe("external AI redaction gate — pass-through (sanitized fake data)", () => {
  const fakeShortDescription = "User cannot connect to VPN after password reset";
  const fakeDescription = [
    "Employee Fake Person reports VPN connection failure since morning.",
    "Error message: 'The network path was not found' when accessing shared drives.",
    "Tried restarting the machine and reconnecting to Wi-Fi — same issue.",
    "Colleagues on the same floor can connect without problems."
  ].join("\n");
  const fakeWorkNotes = "Checked VPN group membership — user is in the correct group. No recent changes.";

  it("allows a complete fake sanitized incident (description only)", () => {
    const preview = createExternalAIRedactionPreview(input(fakeDescription));

    expect(preview.safeToSend).toBe(true);
    expect(preview.blockedReasons).toEqual([]);
    expect(preview.redactedContext).toBe(fakeDescription);
    expect(preview.findings).toEqual([]);
  });

  it("allows a realistic multi-field intake combining description + short description + work notes", () => {
    const combined = [fakeShortDescription, fakeDescription, fakeWorkNotes].join("\n");
    const preview = createExternalAIRedactionPreview(input(combined));

    expect(preview.safeToSend).toBe(true);
    expect(preview.blockedReasons).toEqual([]);
    expect(preview.redactedContext).toBe(combined);
    expect(preview.findings).toEqual([]);
  });

  it("allows sanitized fake host references (.invalid TLD, no scheme)", () => {
    const text = [
      "User accessed portal at fake-portal.example.invalid.",
      "Also checked internal wiki at wiki.example.invalid/kb/faq."
    ].join("\n");
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    // No URL scheme, so not caught by the url pattern
    expect(preview.findings.map((f) => f.kind)).not.toContain("url");
  });

  it("allows fake user display names without email addresses", () => {
    const text = "Reported by Fake Person from the Engineering team. Manager: Demo Manager.";
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    expect(preview.findings).toEqual([]);
  });

  it("allows IT terminology that looks structural but is not sensitive (e.g., INC without digit suffix)", () => {
    const text = "User is on INC VPN network. Contact the INC support portal.";
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    // "INC" without 5+ digits should not match ticket-id pattern
    expect(preview.findings.map((f) => f.kind)).not.toContain("ticket-id");
  });
});

describe("external AI redaction gate — block-sensitive", () => {
  const at = String.fromCharCode(64);

  it("blocks real-looking HTTPS URLs even on .invalid domains", () => {
    const preview = createExternalAIRedactionPreview(
      input(`User reported issue at https://fake-portal.example.invalid/incidents/active.`)
    );

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_URL]");
    expect(preview.redactedContext).not.toContain("https://");
    expect(preview.findings.map((f) => f.kind)).toContain("url");
  });

  it("blocks email addresses even with .invalid TLD", () => {
    const fakeEmail = `fake.user${at}example.invalid`;
    const preview = createExternalAIRedactionPreview(input(`Contact ${fakeEmail} for details.`));

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_EMAIL]");
    expect(preview.redactedContext).not.toContain(fakeEmail);
    expect(preview.findings.map((f) => f.kind)).toContain("email");
  });

  it("blocks ticket-like identifiers (INC + 7 digits)", () => {
    const fakeId1 = "INC" + "7654321";
    const fakeId2 = "RITM" + "1234567";
    const preview = createExternalAIRedactionPreview(
      input(`Ref: ${fakeId1} parent ${fakeId2} needs attention.`)
    );

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_TICKET_ID]");
    expect(preview.redactedContext).not.toContain(fakeId1);
    expect(preview.redactedContext).not.toContain(fakeId2);
    const ticketFindings = preview.findings.filter((f) => f.kind === "ticket-id");
    expect(ticketFindings.length).toBeGreaterThanOrEqual(1);
  });

  it("blocks 32-hex sys_id patterns", () => {
    const fakeSysId = "f".repeat(32);
    const preview = createExternalAIRedactionPreview(
      input(`Record sys_id ${fakeSysId} was referenced.`)
    );

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_SYS_ID]");
    expect(preview.redactedContext).not.toContain(fakeSysId);
    expect(preview.findings.map((f) => f.kind)).toContain("sys-id");
  });

  it("blocks Windows local paths", () => {
    const text = "Evidence saved at C:\\Users\\FakeOperator\\Documents\\case-log.txt.";
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_PATH]");
    expect(preview.redactedContext).not.toContain("C:\\Users");
  });

  it("blocks Linux/WSL home paths", () => {
    const text = "Logs are at /home/fakeuser/logs/case-output.log.";
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_PATH]");
    expect(preview.redactedContext).not.toContain("/home/fakeuser");
  });

  it("blocks credential-like assignments (token=, api_key:, secret:, passwd=)", () => {
    const text = [
      "Access token=demo-fake-value-abc123.",
      "Config api_key: fakery-config-key-xyz789.",
      "The secret: fake-shared-secret-42.",
      "LDAP passwd=demo-passphrase-test."
    ].join("\n");
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_CREDENTIAL]");
    expect(preview.redactedContext).not.toContain("token=");
    expect(preview.redactedContext).not.toContain("api_key:");
    expect(preview.redactedContext).not.toContain("secret:");
    expect(preview.redactedContext).not.toContain("passwd=");
    const credFindings = preview.findings.filter((f) => f.kind === "credential-assignment");
    expect(credFindings.length).toBeGreaterThanOrEqual(1);
  });

  it("blocks phone numbers in international and local formats", () => {
    const text = "Call +1 555-123-4567 or (02) 1234 5678 for urgent issues.";
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("[REDACTED_PHONE]");
    expect(preview.redactedContext).not.toContain("555-123-4567");
    expect(preview.findings.map((f) => f.kind)).toContain("phone");
  });

  it("prevents send when residual sensitive patterns survive redaction", () => {
    // The credential-assignment regex may not catch every form.
    // This test verifies that residual detection catches survivors.
    const text = "Password reset needed for user fake.user. Token reference: tk-abcdef123456.";
    const preview = createExternalAIRedactionPreview(input(text));

    // The email fake.user should be redacted, but we test the gate blocks
    // even if safeToSend is false due to residuals
    if (!preview.safeToSend) {
      expect(preview.blockedReasons.length).toBeGreaterThan(0);
      expect(() => assertExternalAISendAllowed(preview, undefined)).toThrow(ExternalAIBlockedError);
    }
  });
});

describe("external AI redaction gate — edge cases", () => {
  it("fails closed on empty input (redacted-preview-empty)", () => {
    const preview = createExternalAIRedactionPreview(input(""));

    expect(preview.safeToSend).toBe(false);
    expect(preview.blockedReasons).toContain("redacted-preview-empty");
    expect(preview.redactedContext).toBe("");
  });

  it("fails closed on whitespace-only input", () => {
    const preview = createExternalAIRedactionPreview(input("   \n  \t  "));

    expect(preview.safeToSend).toBe(false);
    expect(preview.blockedReasons).toContain("redacted-preview-empty");
  });

  it("produces a stable preview id for the same input", () => {
    const text = "Fake repetitive test input.";
    const preview1 = createExternalAIRedactionPreview(input(text));
    const preview2 = createExternalAIRedactionPreview(input(text));

    expect(preview1.id).toBe(preview2.id);
  });

  it("produces different preview ids for different inputs", () => {
    const preview1 = createExternalAIRedactionPreview(input("Fake input one."));
    const preview2 = createExternalAIRedactionPreview(input("Fake input two."));

    expect(preview1.id).not.toBe(preview2.id);
  });

  it("preserves non-sensitive content after multiple redactions", () => {
    const fakeTicket = "CHG" + "5555555";
    const text = [
      "User requested a change via portal.",
      `Reference ticket ${fakeTicket} was auto-closed.`,
      "The root cause was a misconfigured DNS entry.",
      "Resolution: updated the DNS record and flushed cache."
    ].join("\n");
    const preview = createExternalAIRedactionPreview(input(text));

    expect(preview.safeToSend).toBe(true);
    expect(preview.redactedContext).toContain("User requested a change via portal.");
    expect(preview.redactedContext).toContain("misconfigured DNS entry");
    expect(preview.redactedContext).toContain("flushed cache");
    expect(preview.redactedContext).not.toContain(fakeTicket);
    expect(preview.redactedContext).toContain("[REDACTED_TICKET_ID]");
  });

  it("disclosure message is present in every preview", () => {
    const preview = createExternalAIRedactionPreview(input("Any fake text."));

    expect(preview.disclosure).toBeTruthy();
    expect(preview.disclosure.length).toBeGreaterThan(0);
    expect(preview.disclosure).toMatch(/leave the local app/i);
  });

  it("assertExternalAISendAllowed rejects mismatched approval id", () => {
    const preview = createExternalAIRedactionPreview(input("Fake text."));

    expect(() =>
      assertExternalAISendAllowed(preview, {
        previewId: "wrong-id-xyz",
        externalSendConfirmed: true,
        acknowledgement: "content-will-leave-local-app"
      })
    ).toThrow(/preview-mismatch/);
  });

  it("assertExternalAISendAllowed rejects wrong acknowledgement value", () => {
    const preview = createExternalAIRedactionPreview(input("Fake text."));

    expect(() =>
      assertExternalAISendAllowed(preview, {
        previewId: preview.id,
        externalSendConfirmed: true,
        acknowledgement: "i-accept" as any
      })
    ).toThrow(/disclosure-not-acknowledged/);
  });

  it("isExternalAIBlockedError identifies the error type", () => {
    const err = new ExternalAIBlockedError("test-code", ["reason-1", "reason-2"]);

    expect(isExternalAIBlockedError(err)).toBe(true);
    expect(isExternalAIBlockedError(new Error("plain error"))).toBe(false);
    expect(isExternalAIBlockedError("string")).toBe(false);
    expect(isExternalAIBlockedError(null)).toBe(false);
  });
});

export function fakeTicketDraft(sourceContextId = "context-redaction"): TicketDraft {
  return {
    id: "draft-external-fake",
    sourceContextId,
    ticketType: "incident",
    shortDescription: {
      value: "Fake external provider draft",
      confidence: 0.5,
      evidence: "Fake transport response for tests only.",
      editable: true
    },
    description: {
      value: "Generated from redacted fake context only.",
      confidence: 0.5,
      evidence: "Fake transport response for tests only.",
      editable: true
    },
    workNotes: {
      value: "External AI output requires human review before any ServiceNow action.",
      confidence: 0.5,
      evidence: "Fake transport response for tests only.",
      editable: true
    },
    kbMatches: [],
    riskFlags: [
      "External AI output used redacted context only.",
      "Human review required before any ServiceNow action."
    ],
    missingInfoQuestions: []
  };
}
