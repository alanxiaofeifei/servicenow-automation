import { describe, expect, it } from "vitest";

import { demoManualPasteScenarios, ManualPasteAdapter } from "./index";

describe("ManualPasteAdapter", () => {
  it("creates a CapturedContext from pasted text", () => {
    const adapter = new ManualPasteAdapter({
      idFactory: () => "context-test-1",
      now: () => new Date("2026-05-18T12:00:00.000Z")
    });

    const context = adapter.capture({
      title: "VPN access issue",
      rawText: "User cannot connect to VPN after password reset."
    });

    expect(context).toMatchObject({
      id: "context-test-1",
      sourceType: "manual_paste",
      capturedAt: "2026-05-18T12:00:00.000Z",
      title: "VPN access issue",
      rawText: "User cannot connect to VPN after password reset."
    });
  });

  it("derives a short title when none is provided", () => {
    const adapter = new ManualPasteAdapter({
      idFactory: () => "context-test-2",
      now: () => new Date("2026-05-18T12:00:00.000Z")
    });

    const context = adapter.capture({
      rawText: "Windows laptop is very slow after the latest update. The user already rebooted once."
    });

    expect(context.title).toBe("Windows laptop is very slow after the latest update.");
  });

  it("rejects empty pasted text", () => {
    const adapter = new ManualPasteAdapter();

    expect(() => adapter.capture({ rawText: "   " })).toThrow(/manual paste text/i);
  });

  it("provides stable demo scenarios for field trial rehearsal", () => {
    expect(demoManualPasteScenarios.map((scenario) => scenario.id)).toEqual([
      "vpn-issue",
      "shared-mailbox-evidence",
      "phone-confirmation",
      "self-service-normalization",
      "remote-support-teams",
      "account-login-issue"
    ]);
    expect(demoManualPasteScenarios[0]).toMatchObject({
      id: "vpn-issue",
      label: "QA TEST — Fake Chat intake: VPN connection issue after password change"
    });
    expect(demoManualPasteScenarios.map((scenario) => scenario.label).join("\n")).toContain(
      "Shared mailbox with fake attachment evidence"
    );
    expect(demoManualPasteScenarios.map((scenario) => scenario.label).join("\n")).toContain(
      "Remote support / Teams troubleshooting checklist"
    );
    const accountAccessScenario = demoManualPasteScenarios.find((scenario) => scenario.id === "account-login-issue");
    expect(accountAccessScenario?.label).toBe("Mock account access demo issue");
    expect(accountAccessScenario?.rawText).toContain("QA TEST ONLY");
    expect(accountAccessScenario?.rawText).toContain("does not require browser login");
    expect(accountAccessScenario?.label).not.toMatch(/login demo/i);
    expect(demoManualPasteScenarios.every((scenario) => scenario.rawText.length > 40)).toBe(true);
  });
});
