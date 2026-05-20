import { describe, expect, it } from "vitest";

import {
  buildExcelDryRunRowPreview,
  buildServiceDeskWorkflowPreview,
  mapIntakeSourceToServiceNowChannel,
  type TicketDraft
} from "./index";

const draft: TicketDraft = {
  id: "draft_demo_001",
  sourceContextId: "ctx_demo_001",
  ticketType: "incident",
  shortDescription: {
    value: "VPN connection issue after password or MFA change",
    confidence: 0.93,
    editable: true
  },
  description: {
    value: "Demo requester reports VPN cannot connect after a password reset.",
    confidence: 0.9,
    editable: true
  },
  workNotes: {
    value: "Confirm internet access without VPN and recent MFA/password change.",
    confidence: 0.82,
    editable: true
  },
  category: {
    value: "Network",
    confidence: 0.86,
    editable: true
  },
  subcategory: {
    value: "VPN",
    confidence: 0.84,
    editable: true
  },
  assignmentGroup: {
    value: "Demo Network Support",
    confidence: 0.8,
    editable: true
  },
  priority: {
    value: "3 - Moderate",
    confidence: 0.76,
    editable: true
  },
  kbMatches: [],
  riskFlags: [],
  missingInfoQuestions: []
};

describe("service desk workflow preview", () => {
  it("maps raw intake sources to ServiceNow channels", () => {
    expect(mapIntakeSourceToServiceNowChannel("Teams message")).toBe("Chat");
    expect(mapIntakeSourceToServiceNowChannel("ServiceNow Chat transcript")).toBe("Chat");
    expect(mapIntakeSourceToServiceNowChannel("Shared mailbox item")).toBe("Email");
    expect(mapIntakeSourceToServiceNowChannel("Phone call")).toBe("Phone");
    expect(mapIntakeSourceToServiceNowChannel("Self-service ticket")).toBe("Self-service");
  });

  it("builds an Excel dry-run row with preview/no-write result", () => {
    const preview = buildExcelDryRunRowPreview({
      createdAt: "2026-05-18 08:15",
      rawIntakeSource: "Teams message",
      requesterDisplay: "Demo requester A",
      languageOrServiceDeskTeam: "English / Demo Service Desk",
      issueType: "Incident",
      draft,
      finalAssignmentGroup: "Demo Network Support",
      workNotesSummary: "Confirm VPN symptom and route if needed.",
      handlingStatus: "New"
    });

    expect(preview.row["ServiceNow Channel"]).toBe("Chat");
    expect(preview.row["Dry-run Result"]).toContain("Preview only");
    expect(preview.row["Dry-run Result"]).toContain("no Excel workbook is connected or written");
    expect(preview.safetyCopy).toBe(
      "This row is generated locally from the reviewed draft. No workbook is connected or written."
    );
  });

  it("builds the full local workflow preview and warns about Save", () => {
    const preview = buildServiceDeskWorkflowPreview({
      createdAt: "2026-05-18 08:15",
      rawIntakeSource: "ServiceNow Chat transcript",
      requesterDisplay: "Demo requester C",
      languageOrServiceDeskTeam: "English / Demo Service Desk",
      issueType: "Incident",
      draft,
      serviceDeskOwnerTeam: "Demo Service Desk",
      finalAssignmentGroup: "Demo Identity Support",
      finalAssignmentReason: "Authentication symptom needs identity support review.",
      handlingStatus: "New",
      confirmationState: {
        status: "Needs confirmation",
        summary: "Confirm impact and recent password or MFA change."
      }
    });

    expect(preview.workflowStages).toEqual([
      "Intake received",
      "Contact / confirmation",
      "Incident draft prepared",
      "Service Desk ownership / team handling",
      "Final support group routing",
      "Work Notes plan",
      "Excel dry-run row"
    ]);
    expect(preview.mappedServiceNowChannel).toBe("Chat");
    expect(preview.workNotesPlan.warning).toContain("Save is a real write action");
    expect(preview.workNotesPlan.warning).toContain("not executed");
    expect(preview.safety.noServiceNowWrite).toBe(true);
    expect(preview.safety.noExcelWrite).toBe(true);
    expect(preview.safety.noGraphWrite).toBe(true);
    expect(preview.csvRow).toContain('"2026-05-18 08:15","ServiceNow Chat transcript","Chat"');
    expect(preview.markdownSummary).toContain("## Routing Plan");
  });
});
