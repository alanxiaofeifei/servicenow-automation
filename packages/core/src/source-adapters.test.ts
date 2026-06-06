import { describe, expect, it } from "vitest";

import {
  IntakeSourceKinds,
  allSourceAdapters,
  manualPasteAdapter,
  phoneCallNoteAdapter,
  sourceAdapterRegistry,
  teamsWebManualCaptureStubAdapter,
  type IntakeSourceKind,
  type SourceAdapter,
} from "./source-adapters";

describe("source-adapters", () => {
  describe("IntakeSourceKinds", () => {
    it("defines exactly 6 intake source kinds", () => {
      expect(IntakeSourceKinds).toHaveLength(6);
      expect(IntakeSourceKinds).toContain("manual_paste");
      expect(IntakeSourceKinds).toContain("teams_web_manual_capture_stub");
      expect(IntakeSourceKinds).toContain("outlook_web_manual_capture_stub");
      expect(IntakeSourceKinds).toContain("phone_call_note");
      expect(IntakeSourceKinds).toContain("servicenow_chat_manual_stub");
      expect(IntakeSourceKinds).toContain("self_service_ticket_manual_stub");
    });
  });

  describe("allSourceAdapters", () => {
    it("has 6 adapters, one per intake kind", () => {
      expect(allSourceAdapters).toHaveLength(6);

      const registeredIds = allSourceAdapters.map(
        (a: SourceAdapter) => a.meta.id,
      );
      for (const kind of IntakeSourceKinds) {
        expect(registeredIds).toContain(kind);
      }
    });

    it("every adapter carries a safety notice", () => {
      for (const adapter of allSourceAdapters) {
        expect(adapter.meta.safetyNotice).toContain("Manual");
        expect(adapter.meta.safetyNotice).toContain("stub");
        expect(adapter.meta.safetyNotice.toLowerCase()).toContain("no real api");
      }
    });

    it("every adapter maps to an existing SourceType", () => {
      const validSourceTypes = [
        "manual_paste",
        "teams_web",
        "outlook_web",
        "outlook_classic",
        "servicenow_chat",
        "servicenow_self_service",
      ];

      for (const adapter of allSourceAdapters) {
        expect(validSourceTypes).toContain(adapter.meta.targetSourceType);
      }
    });
  });

  describe("manualPasteAdapter", () => {
    it("has correct meta", () => {
      expect(manualPasteAdapter.meta.id).toBe("manual_paste");
      expect(manualPasteAdapter.meta.label).toBe("Manual paste");
      expect(manualPasteAdapter.meta.targetSourceType).toBe("manual_paste");
    });

    it("captures a CapturedContext with the right sourceType and raw text", () => {
      const ctx = manualPasteAdapter.capture({
        rawText: "VPN connection issue after password reset.",
        title: "VPN issue",
        sender: "user@example.invalid",
      });

      expect(ctx.id).toMatch(/^stub_ctx_\d{4}$/);
      expect(ctx.sourceType).toBe("manual_paste");
      expect(ctx.capturedAt).toBeTruthy();
      expect(ctx.rawText).toBe("VPN connection issue after password reset.");
      expect(ctx.title).toBe("VPN issue");
      expect(ctx.sender).toBe("user@example.invalid");
    });
  });

  describe("teamsWebManualCaptureStubAdapter", () => {
    it("maps to teams_web source type", () => {
      expect(teamsWebManualCaptureStubAdapter.meta.targetSourceType).toBe(
        "teams_web",
      );
      expect(teamsWebManualCaptureStubAdapter.meta.label).toContain(
        "Teams message",
      );
    });
  });

  describe("phoneCallNoteAdapter", () => {
    it("maps to manual_paste source type", () => {
      expect(phoneCallNoteAdapter.meta.targetSourceType).toBe("manual_paste");
      expect(phoneCallNoteAdapter.meta.id).toBe("phone_call_note");
    });

    it("captures a phone note context", () => {
      const ctx = phoneCallNoteAdapter.capture({
        rawText: "User called about password reset. Resolved remotely.",
        participants: ["User A (caller)", "Agent B (service desk)"],
      });

      expect(ctx.sourceType).toBe("manual_paste");
      expect(ctx.participants).toHaveLength(2);
      expect(ctx.rawText).toContain("password reset");
    });
  });

  describe("sourceAdapterRegistry", () => {
    it("looks up each adapter by its kind", () => {
      for (const adapter of allSourceAdapters) {
        const lookup = sourceAdapterRegistry[adapter.meta.id];
        expect(lookup).toBe(adapter);
      }
    });

    it("returns undefined for unknown kinds", () => {
      expect(
        sourceAdapterRegistry["nonexistent_kind" as IntakeSourceKind],
      ).toBeUndefined();
    });
  });

  describe("StubSourceAdapter meta completeness", () => {
    it("every adapter has label, description, safety notice, and target source type", () => {
      const requiredKeys: (keyof (typeof allSourceAdapters)[number]["meta"])[] =
        ["id", "label", "description", "safetyNotice", "targetSourceType"];

      for (const adapter of allSourceAdapters) {
        for (const key of requiredKeys) {
          expect(adapter.meta[key]).toBeTruthy();
        }
      }
    });
  });
});
