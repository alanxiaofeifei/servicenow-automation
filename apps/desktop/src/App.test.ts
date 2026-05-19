import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { App } from "./App";

function renderAppMarkup() {
  return renderToStaticMarkup(createElement(App));
}

describe("App", () => {
  it("exposes the required safety copy", () => {
    const rendered = renderAppMarkup();

    expect(rendered).toContain("ServiceNow Automation");
    expect(rendered).toContain(
      "AI drafts only. Human review and manual submit required."
    );
  });

  it("renders the static runtime and safety status panel", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Runtime / Safety");
    expect(output).toContain("Static demo posture");
    expect(output).toContain("Demo mode");
    expect(output).toContain("ON");
    expect(output).toContain("Real ServiceNow");
    expect(output).toContain("OFF");
    expect(output).toContain("Auto-submit");
    expect(output).toContain("disabled");
    expect(output).toContain("External AI with real data");
    expect(output).toContain("Browser/runtime");
    expect(output).toContain("dedicated Chromium prepared/planned; not launched by this panel");
    expect(output).toContain("Profile");
    expect(output).toContain("disposable/tool-owned model");
    expect(output).toContain("Data");
    expect(output).toContain("fake sanitized demo data only");
  });

  it("renders the Ticket Draft workspace controls and default VPN draft", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Ticket Draft Workspace");
    expect(output).toContain("Load VPN Demo");
    expect(output).toContain("Load Windows Demo");
    expect(output).toContain("Load Account/Login Demo");
    expect(output).toContain("VPN connection issue after password or MFA change");
    expect(output).toContain("Short Description");
    expect(output).toContain("Work Notes");
    expect(output).toContain("KB Matches");
    expect(output).toContain("VPN connectivity troubleshooting");
    expect(output).toContain("Human review required before any ServiceNow action.");
  });

  it("renders local safe draft copy actions and sanitized Markdown export text", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Safe draft actions");
    expect(output).toContain("Copy Short Description");
    expect(output).toContain("Copy Description");
    expect(output).toContain("Copy Work Notes");
    expect(output).toContain("Copy full safe draft as Markdown");
    expect(output).toContain("Prepared copy text preview");
    expect(output).toContain("Fallback copy preview");
    expect(output).toContain("# Safe Demo Incident Draft");
    expect(output).toContain("Safety note: fake/sanitized demo draft only.");
    expect(output).toContain("Local copy/export only; no network, file upload, real email send, ServiceNow write, API call, external AI with real content, or real ticket number is included.");
    expect(output).toContain("No real ServiceNow record is created, changed, submitted, updated, saved, or closed.");
  });

  it("renders the sanitized multi-channel intake queue and source review actions", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Queue → Source Review → TicketDraft");
    expect(output).toContain("Intake Queue — fake sanitized data only");
    expect(output).toContain("Teams note: VPN connection issue after password reset");
    expect(output).toContain("Self-service request: Windows laptop slow after update");
    expect(output).toContain("Chat transcript: account login issue after password change");
    expect(output).toContain("Shared mailbox item: remote access unavailable");
    expect(output).toContain("Demo requester A");
    expect(output).toContain("Teams message");
    expect(output).toContain("Self-service ticket");
    expect(output).toContain("ServiceNow Chat transcript");
    expect(output).toContain("Shared mailbox item");
    expect(output).toContain("Fake sanitized intake only; no Teams, mailbox, ServiceNow Chat/API, or self-service polling connection is used.");
    expect(output).toContain("No attachments, .msg/.eml parsing, live channel content, or external AI with real content is used.");
    expect(output).toContain("Raw vs Cleaned Source");
    expect(output).toContain("Source Channel");
    expect(output).toContain("Body Preview");
    expect(output).toContain("Raw Sanitized Body");
    expect(output).toContain("Cleaned / Normalized Body");
    expect(output).toContain("Cleaned / Normalized Text");
    expect(output).toContain("[08:16] VPN cannot connect after a recent password reset.");
    expect(output).toContain("[08:18] Impact: Internet works without VPN, but remote access is unavailable.");
    expect(output).toContain("Create Incident Draft");
    expect(output).toContain("Mark as Done");
    expect(output).toContain("Skip");
  });

  it("renders exactly four FIFO intake items", () => {
    const output = renderAppMarkup();
    const queueItemCount = output.match(/class=\"queue-item/g)?.length ?? 0;
    const teamsIndex = output.indexOf("Teams note: VPN connection issue after password reset");
    const selfServiceIndex = output.indexOf("Self-service request: Windows laptop slow after update");
    const chatIndex = output.indexOf("Chat transcript: account login issue after password change");
    const mailboxIndex = output.indexOf("Shared mailbox item: remote access unavailable");

    expect(queueItemCount).toBe(4);
    expect(teamsIndex).toBeGreaterThan(-1);
    expect(selfServiceIndex).toBeGreaterThan(teamsIndex);
    expect(chatIndex).toBeGreaterThan(selfServiceIndex);
    expect(mailboxIndex).toBeGreaterThan(chatIndex);
  });

  it("renders a filled mock ServiceNow Incident form with disabled demo submit", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Mock ServiceNow Incident Form");
    expect(output).toContain("Fill Mock ServiceNow Form");
    expect(output).toContain("Incident · QA/Dev rehearsal");
    expect(output).toContain("Caller");
    expect(output).toContain("Assignment Group");
    expect(output).toContain("VPN connection issue after password or MFA change");
    expect(output).toContain("Submit disabled in demo mode");
  });

  it("renders risk controls for no auto-submit/close and fill confirmation", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Risk Control Gate");
    expect(output).toContain("The app does not submit, close, or update real tickets automatically.");
    expect(output).toContain("Confirm human review before fill");
    expect(output).toContain("Fill action locked until review confirmation");
    expect(output).toContain("Final submit is always manual.");
  });

  it("renders the legacy-inspired ServiceNow field review checklist and safety boundary", () => {
    const output = renderAppMarkup();
    const checklistLabels = [
      "Source channel reviewed",
      "Requester identified",
      "Location checked",
      "Channel selected",
      "Short description generated/reviewed",
      "Description generated/reviewed",
      "Category selected",
      "Subcategory selected if needed",
      "Configuration item / affected service checked",
      "Impact checked",
      "Urgency checked",
      "Priority reviewed as derived value",
      "Assignment group suggested/reviewed",
      "Work notes prepared",
      "Customer-visible comments separated from internal Work Notes",
      "Human confirmation before any mock fill/copy"
    ];

    expect(output).toContain("Legacy-inspired field review");
    expect(output).toContain("Incident field dependency checklist");
    expect(output).toContain("Ticket quality depends on field order and dependencies, not text generation alone.");
    expect(output).toContain("Requester, Category, Location, Channel, Impact, Urgency, Assignment group, Short description");
    expect(output).toContain(
      "Description, Subcategory, Configuration item, Business service, Service offering, Priority, Assigned to, Additional comments, Work notes, Related Search / Knowledge &amp; Catalog"
    );
    for (const label of checklistLabels) {
      expect(output).toContain(label);
    }
    expect(output).toContain("0/16");
    expect(output).toContain("Demo checklist only. Local state only.");
    expect(output).toContain("No real ServiceNow field fill, Save, Submit, Update, Close, API call");
    expect(output).toContain("browser automation, DOM inspection, screenshots, HAR, traces, sessions, or storage export.");
  });

  it("renders ServiceNow environment modes and QA/dev safety boundaries", () => {
    const output = renderAppMarkup();

    expect(output).toContain("ServiceNow Environment Mode");
    expect(output).toContain("Mock Demo");
    expect(output).toContain("QA Test Environment");
    expect(output).toContain("Development Test Environment");
    expect(output).toContain("Production Shadow Mode");
    expect(output).not.toContain("href=\"https://");
    expect(output).toContain("Full ServiceNow URL hidden for privacy");
    expect(output).toContain("No raw clickable QA/dev link");
    expect(output).toContain("QA — No write until #22");
    expect(output).toContain("NO SUBMIT · NO UPDATE · NO CLOSE");
    expect(output).toContain("manual-login-only");
    expect(output).toContain("Ignored local runtime path");
    expect(output).toContain(".local/servicenow-browser-profiles/production-shadow");
    expect(output).toContain("Manual login required. Credentials are never stored in source code.");
    expect(output).toContain("Browser sessions stay in ignored local runtime folders.");
    expect(output).toContain("Any real QA/dev submit requires explicit Alan approval.");
    expect(output).toContain("Production remains shadow-only by default.");
    expect(output).toContain("No production submit, close, or update path is implemented.");
  });
});
