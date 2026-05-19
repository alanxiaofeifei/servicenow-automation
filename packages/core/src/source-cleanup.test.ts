import { describe, expect, it } from "vitest";

import { normalizeSourceContextText } from "./source-cleanup";

describe("normalizeSourceContextText", () => {
  it("cleans Teams-style demo text while preserving symptoms, impact, and timestamps", () => {
    const result = normalizeSourceContextText({
      sourceType: "teams_web",
      rawText: [
        "Teams-style demo message:",
        "",
        "[08:15] Demo requester: Hi team,",
        "[08:16] Demo requester: RE: [EXTERNAL] VPN cannot connect after password reset.",
        "[08:17] Demo requester: Impact: remote access is unavailable, but internet works without VPN.",
        "",
        "This is fake sanitized intake data only. No Teams tenant, channel, chat, user profile, or message link is connected."
      ].join("\n")
    });

    expect(result.normalizedText).toContain("[08:16] VPN cannot connect after password reset.");
    expect(result.normalizedText).toContain("[08:17] Impact: remote access is unavailable");
    expect(result.normalizedText).not.toMatch(/Teams-style|Hi team|fake sanitized|EXTERNAL|RE:/i);
    expect(result.removedLineCount).toBeGreaterThanOrEqual(3);
  });

  it("cleans self-service ticket metadata without dropping user-impact details", () => {
    const result = normalizeSourceContextText({
      sourceType: "servicenow_self_service",
      rawText: [
        "Self-service-style demo submission:",
        "Request ID: DEMO001",
        "Description: Windows laptop became very slow after latest update.",
        "Impact: startup and application launch are delayed for the user.",
        "No portal polling, ticket number, requester profile, or live self-service record is connected."
      ].join("\n")
    });

    expect(result.normalizedText).toContain("Windows laptop became very slow after latest update.");
    expect(result.normalizedText).toContain("Impact: startup and application launch are delayed");
    expect(result.normalizedText).not.toMatch(/Request ID|Self-service-style|portal polling/i);
  });

  it("cleans ServiceNow Chat transcript labels while preserving chat timestamps", () => {
    const result = normalizeSourceContextText({
      sourceType: "servicenow_chat",
      rawText: [
        "ServiceNow Chat-style demo transcript:",
        "Transcript ID: CHAT-DEMO-1",
        "[09:05] Demo requester: I cannot login after changing password.",
        "[09:06] Demo support: Does the MFA prompt appear?",
        "[09:07] Demo requester: Yes, but authentication fails repeatedly.",
        "No ServiceNow Chat, ServiceNow API, transcript ID, or live conversation is connected."
      ].join("\n")
    });

    expect(result.normalizedText).toContain("[09:05] I cannot login after changing password.");
    expect(result.normalizedText).toContain("[09:07] Yes, but authentication fails repeatedly.");
    expect(result.normalizedText).not.toMatch(/Transcript ID|Demo requester|ServiceNow Chat-style|ServiceNow API/i);
  });

  it("cleans shared mailbox/email prefixes, signatures, headers, and disclaimers", () => {
    const result = normalizeSourceContextText({
      sourceType: "outlook_web",
      rawText: [
        "From: Demo User",
        "To: Demo Service Desk",
        "Subject: RE: [EXTERNAL] FW: remote access unavailable",
        "",
        "Hello support,",
        "Remote access is unavailable after password reset at 09:30.",
        "Normal internet access works, but VPN fails and MFA keeps repeating.",
        "Thanks,",
        "Demo User",
        "Confidentiality Notice: This email and any attachments are intended only for the named recipient."
      ].join("\n")
    });

    expect(result.normalizedText).toContain("remote access unavailable");
    expect(result.normalizedText).toContain("Remote access is unavailable after password reset at 09:30.");
    expect(result.normalizedText).toContain("Normal internet access works");
    expect(result.normalizedText).not.toMatch(/From:|To:|Subject:|EXTERNAL|FW:|Hello support|Confidentiality Notice|Demo User/i);
  });
});
