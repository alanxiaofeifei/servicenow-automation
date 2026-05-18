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
      "windows-issue",
      "account-login-issue"
    ]);
    expect(demoManualPasteScenarios.every((scenario) => scenario.rawText.length > 40)).toBe(true);
  });
});
