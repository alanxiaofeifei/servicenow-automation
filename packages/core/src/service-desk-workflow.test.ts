import { describe, expect, it } from "vitest";

import {
  buildExcelDryRunRowPreview,
  buildExcelDryRunWorkbookArtifact,
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
      serviceDeskOwnerTeam: "Demo Service Desk",
      finalAssignmentGroup: "Demo Network Support",
      workNotesSummary: "Confirm VPN symptom and route if needed.",
      handlingStatus: "New",
      confirmationState: {
        status: "Needs confirmation",
        summary: "Confirm fake requester and VPN impact before manual QA fill."
      },
      evidenceReviewState: {
        evidenceType: "none",
        reviewState: "not reviewed",
        extractedFacts: ["No fake attachment required for first QA ticket."],
        safetyLabel: "No file upload, OCR, or external AI"
      },
      fakeScenarioId: "vpn-issue",
      requiredFieldCheck:
        "Complete for manual fill: requester, channel, category, subcategory, location, impact, urgency, assignment group, short description, description, work notes.",
      approvalPhraseGate:
        "Separate exact approval phrase required before each real Save/Submit/Update/Resolve/Close action.",
      stopRuleCheck:
        "Stop if production mode, real user data, notification risk, missing QA isolation, or any DOM/API/bulk path appears.",
      qaIsolationCheck: "Pending explicit confirmation that QA will not notify production/support teams.",
      qaDryRunOutcome: "Blocked until QA isolation is confirmed; field-trial prep only.",
      qaTrialResult: "Not run - field-trial prep only."
    });

    expect(preview.row["ServiceNow Channel"]).toBe("Chat");
    expect(preview.row["Service Desk Owner / Initial Group"]).toBe("Demo Service Desk");
    expect(preview.row["Confirmation State"]).toBe("Needs confirmation");
    expect(preview.row["Evidence Review State"]).toBe("not reviewed (none)");
    expect(preview.row["Fake Scenario ID"]).toBe("vpn-issue");
    expect(preview.row["Required Field Check"]).toContain("Complete for manual fill");
    expect(preview.row["Approval Phrase Gate"]).toContain("Save/Submit/Update/Resolve/Close");
    expect(preview.row["Stop Rule Check"]).toContain("notification risk");
    expect(preview.row["QA Isolation Check"]).toContain("Pending explicit confirmation");
    expect(preview.row["QA Dry-run Outcome"]).toContain("Blocked until QA isolation is confirmed");
    expect(preview.row["QA Trial Result"]).toBe("Not run - field-trial prep only.");
    expect(preview.row["Dry-run Result"]).toContain("Preview only");
    expect(preview.row["Dry-run Result"]).toContain("local XLSX artifact generated");
    expect(preview.row["Dry-run Result"]).toContain("no Graph, cloud workbook, or ServiceNow write");
    expect(preview.safetyCopy).toBe(
      "This row is generated locally from the reviewed draft. XLSX export creates a local dry-run file only; no Graph, cloud workbook, or ServiceNow write is performed."
    );
  });

  it("builds a deterministic local XLSX dry-run artifact without Graph or ServiceNow writes", () => {
    const rowPreview = buildExcelDryRunRowPreview({
      createdAt: "2026-05-18 08:15",
      rawIntakeSource: "Teams message",
      requesterDisplay: "Demo requester A",
      languageOrServiceDeskTeam: "English / Demo Service Desk",
      issueType: "Incident",
      draft,
      serviceDeskOwnerTeam: "Demo Service Desk",
      finalAssignmentGroup: "Demo Network Support",
      workNotesSummary: "Confirm VPN symptom and route if needed.",
      handlingStatus: "New",
      confirmationState: {
        status: "Needs confirmation",
        summary: "Confirm fake requester and VPN impact before manual QA fill."
      },
      evidenceReviewState: {
        evidenceType: "none",
        reviewState: "not reviewed",
        extractedFacts: ["No fake attachment required for first QA ticket."],
        safetyLabel: "No file upload, OCR, or external AI"
      },
      fakeScenarioId: "vpn-issue",
      qaTrialResult: "Not run - field-trial prep only."
    });

    const firstArtifact = buildExcelDryRunWorkbookArtifact(rowPreview.row, { fileTimestamp: "2026-05-18T08:15:00Z" });
    const secondArtifact = buildExcelDryRunWorkbookArtifact(rowPreview.row, { fileTimestamp: "2026-05-18T08:15:00Z" });
    const workbookText = new TextDecoder().decode(firstArtifact.bytes);

    expect(firstArtifact.fileName).toBe("servicenow-dry-run-2026-05-18T08-15-00Z.xlsx");
    expect(firstArtifact.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(firstArtifact.bytes).toEqual(secondArtifact.bytes);
    expect(Array.from(firstArtifact.bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(workbookText).toContain("Excel Dry-run Row");
    expect(workbookText).toContain("ServiceNow Channel");
    expect(workbookText).toContain("Teams message");
    expect(workbookText).toContain("Preview only - local XLSX artifact generated; no Graph, cloud workbook, or ServiceNow write.");
    expect(workbookText).not.toContain("graph.microsoft.com");
    expect(workbookText).not.toContain("service-now.com");
  });

  it("escapes local XLSX cells that could be interpreted as formulas", () => {
    const formulaDraft: TicketDraft = {
      ...draft,
      shortDescription: {
        ...draft.shortDescription,
        value: '=HYPERLINK("https://example.invalid", "open")'
      }
    };
    const rowPreview = buildExcelDryRunRowPreview({
      createdAt: "2026-05-18 08:15",
      rawIntakeSource: "Teams message",
      requesterDisplay: "Demo requester A",
      languageOrServiceDeskTeam: "English / Demo Service Desk",
      issueType: "Incident",
      draft: formulaDraft,
      serviceDeskOwnerTeam: "Demo Service Desk",
      finalAssignmentGroup: "Demo Network Support",
      workNotesSummary: "Confirm VPN symptom and route if needed.",
      handlingStatus: "New",
      confirmationState: {
        status: "Needs confirmation",
        summary: "Confirm fake requester and VPN impact before manual QA fill."
      },
      evidenceReviewState: {
        evidenceType: "none",
        reviewState: "not reviewed",
        extractedFacts: ["No fake attachment required for first QA ticket."],
        safetyLabel: "No file upload, OCR, or external AI"
      },
      fakeScenarioId: "vpn-issue",
      qaTrialResult: "Not run - field-trial prep only."
    });

    const artifact = buildExcelDryRunWorkbookArtifact(rowPreview.row, { fileTimestamp: "2026-05-18T08:15:00Z" });
    const workbookText = new TextDecoder().decode(artifact.bytes);

    expect(workbookText).toContain("&apos;=HYPERLINK");
    expect(workbookText).not.toContain("<t>=HYPERLINK");
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
    expect(preview.evidenceReviewState).toEqual({
      evidenceType: "none",
      reviewState: "not reviewed",
      extractedFacts: ["No evidence artifact is required for this local preview."],
      safetyLabel: "No file upload, OCR, or external AI"
    });
    expect(preview.workNotesPlan.warning).toContain("Save is a real write action");
    expect(preview.workNotesPlan.warning).toContain("not executed");
    expect(preview.safety.noServiceNowWrite).toBe(true);
    expect(preview.safety.noExcelWrite).toBe(true);
    expect(preview.safety.noGraphWrite).toBe(true);
    expect(preview.csvRow).toContain('"2026-05-18 08:15","ServiceNow Chat transcript","Chat"');
    expect(preview.markdownSummary).toContain("## Routing Plan");
  });
});
