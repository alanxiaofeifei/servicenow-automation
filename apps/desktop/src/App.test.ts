import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  App,
  applyDraftTemplates,
  buildDemoQueueItems,
  buildDraftForQueueItem,
  clampAppZoomPercent,
  draftTemplatePresets,
  getCtrlWheelZoomDelta,
  getNextAppZoomPercent
} from "./App";

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

  it("renders the compact fake high severity alert simulator", () => {
    const output = renderAppMarkup();

    expect(output).toContain("High Severity Monitor Simulator");
    expect(output).toContain("Normal");
    expect(output).toContain("P2 Active");
    expect(output).toContain("P1 Active");
    expect(output).toContain("Acknowledge");
    expect(output).toContain("Mute demo alerts");
    expect(output).toContain("Fake simulator only — no ServiceNow polling or API calls");
    expect(output).toContain("Fake count");
    expect(output).toContain("Fake affected services");
    expect(output).toContain("Demo service desk queue");
    expect(output).toContain('<details class="high-severity-simulator">');
    expect(output).not.toContain('class="high-severity-simulator" open');
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

  it("renders local team template settings for Description and Work Notes", () => {
    const output = renderAppMarkup();

    expect(output).toContain("⚙ Templates / Settings");
    expect(output).toContain("▾");
    expect(output).toContain("Description template");
    expect(output).toContain("Work Notes template");
    expect(output).toContain("Local demo templates only — no external storage or ServiceNow write");
    expect(output).toContain("Standard Service Desk");
    expect(output).toContain("Escalation-ready notes");
    expect(output).toContain('<details class="template-settings-panel">');
    expect(output).not.toContain('class="template-settings-panel" open');
  });

  it("renders centralized settings with display, templates, and optional checklist controls", () => {
    const output = renderAppMarkup();
    const settingsStart = output.indexOf('id="app-settings-sidebar"');
    const settingsEnd = output.indexOf("</aside>", settingsStart);
    const settingsMarkup = output.slice(settingsStart, settingsEnd);

    expect(output).toContain("⚙ Settings");
    expect(output).toContain('aria-label="Centralized settings"');
    expect(settingsMarkup).toContain('aria-label="Close settings panel"');
    expect(settingsMarkup).toContain("✕ Close");
    expect(settingsStart).toBeGreaterThan(-1);
    expect(settingsMarkup).toContain("⚙ Display Settings");
    expect(settingsMarkup).toContain("⚙ Templates / Settings");
    expect(settingsMarkup).toContain("⚙ Optional field checklist / Team rules");
  });

  it("renders local display settings with zoom, theme, and text field mode controls", () => {
    const output = renderAppMarkup();

    expect(output).toContain("⚙ Display Settings");
    expect(output).toContain("100%");
    expect(output).toContain('data-zoom-percent="100"');
    expect(output).toContain('data-text-mode="auto-fit"');
    expect(output).toContain("zoom:1");
    expect(output).toContain("App zoom");
    expect(output).toContain("Ctrl + mouse wheel also changes the local app zoom.");
    expect(output).toContain("Reset");
    expect(output).toContain("Warm");
    expect(output).toContain("Cool");
    expect(output).toContain("Night");
    expect(output).toContain("Auto-fit text areas");
    expect(output).toContain("Compact + visible resize handle");
    expect(output).toContain("Display settings are local React state only and are not persisted.");
    expect(output).toContain('<details class="display-settings-panel" open="">');
  });

  it("clamps local app zoom and maps Ctrl wheel direction", () => {
    expect(clampAppZoomPercent(40)).toBe(80);
    expect(clampAppZoomPercent(100)).toBe(100);
    expect(clampAppZoomPercent(200)).toBe(130);
    expect(getNextAppZoomPercent(100, 10)).toBe(110);
    expect(getNextAppZoomPercent(80, -10)).toBe(80);
    expect(getNextAppZoomPercent(130, 10)).toBe(130);
    expect(getCtrlWheelZoomDelta(-120)).toBe(10);
    expect(getCtrlWheelZoomDelta(120)).toBe(-10);
  });

  it("applies the default template around generated draft content", () => {
    const queue = buildDemoQueueItems("en-US");
    const vpnItem = queue.find((item) => item.id === "demo-teams-vpn");

    expect(vpnItem).toBeDefined();

    const baseDraft = buildDraftForQueueItem(vpnItem!);
    const templatedDraft = applyDraftTemplates(baseDraft, {
      descriptionTemplate: draftTemplatePresets[0].descriptionTemplate,
      workNotesTemplate: draftTemplatePresets[0].workNotesTemplate
    });

    expect(templatedDraft.description.value).toContain("Intake summary");
    expect(templatedDraft.description.value).toContain("User reports a VPN connectivity problem");
    expect(templatedDraft.workNotes.value).toContain("Internal triage notes");
    expect(templatedDraft.workNotes.value).toContain("Initial triage: confirm internet without VPN");
  });

  it("renders the project-extensible language selector options", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Interface language");
    expect(output).toContain("Future languages can be added per project.");
    expect(output).toContain("English");
    expect(output).toContain("简体中文");
    expect(output).toContain("繁中（台灣）");
    expect(output).toContain("Español");
    expect(output.match(/<option/g)?.length ?? 0).toBe(4);
    expect(output).toContain("Language simulation uses local deterministic demo data only");
    expect(output).toContain("no external translation service");
    expect(output).toContain("no real ServiceNow, Teams, mailbox, Graph, or API connection is used");
  });

  it("builds zh-TW queue data and draft fields from deterministic local content", () => {
    const queue = buildDemoQueueItems("zh-TW");
    const selfServiceItem = queue.find((item) => item.id === "demo-self-service-windows");

    expect(selfServiceItem).toBeDefined();
    expect(selfServiceItem?.subject).toContain("自助服務請求：Windows 筆電更新後變慢");
    expect(selfServiceItem?.requesterLabel).toBe("示範請求者 B");
    expect(selfServiceItem?.sourceLanguage).toBe("台灣繁體中文自助服務來源");
    expect(selfServiceItem?.draftLanguageMode).toContain("自助服務來源語言驅動 Description / Work Notes");

    const draft = buildDraftForQueueItem(selfServiceItem!);
    expect(draft.shortDescription.value).toContain("Windows 筆電更新後效能下降");
    expect(draft.description.value).toContain("自助服務來源語言驅動 Description / Work Notes");
    expect(draft.workNotes.value).toContain("重新啟動結果");
  });

  it("builds explicit bilingual fallback text for unsupported source languages", () => {
    const queue = buildDemoQueueItems("en-US");
    const unsupportedItem = queue.find((item) => item.id === "demo-shared-mailbox-vpn");

    expect(unsupportedItem).toBeDefined();
    expect(unsupportedItem?.sourceLanguage).toBe("Unsupported demo source (fr-FR)");
    expect(unsupportedItem?.draftLanguageMode).toBe(
      "Unsupported-language fallback: source language + English bilingual draft"
    );

    const draft = buildDraftForQueueItem(unsupportedItem!);
    expect(draft.description.value).toContain(
      "Unsupported-language fallback: source language + English bilingual draft"
    );
    expect(draft.description.value).toContain("English helper summary");
    expect(draft.workNotes.value).toContain("Do not call external translation services");
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
    expect(output).toContain("Source Language");
    expect(output).toContain("Draft Language Mode");
    expect(output).toContain("Unsupported-language fallback: source language + English bilingual draft");
    expect(output).toContain("Body Preview");
    expect(output).toContain("Raw Sanitized Body");
    expect(output).toContain("Cleaned / Normalized Body");
    expect(output).toContain("Cleaned / Normalized Text");
    expect(output).toContain("[08:16] VPN cannot connect after a recent password reset.");
    expect(output).toContain("[08:18] Impact: Internet works without VPN, but remote access is unavailable.");
    expect(output).toContain("Create Incident Draft");
    expect(output).toContain("Mark as Done");
    expect(output).toContain("Skip");
    expect(output).toContain("queue-item-card");
  });

  it("renders exactly four FIFO intake items", () => {
    const output = renderAppMarkup();
    const queueItemCount = output.match(/<button class=\"queue-item/g)?.length ?? 0;
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

    expect(output).toContain("Mock ServiceNow Incident Preview");
    expect(output).toContain("Incident | New record — Mock preview");
    expect(output).toContain("MOCK / Demo only");
    expect(output).toContain("Fill Mock ServiceNow Form");
    expect(output).toContain("Incident · QA/Dev rehearsal");
    expect(output).toContain("Requester");
    expect(output).toContain("Category");
    expect(output).toContain("Location");
    expect(output).toContain("Channel");
    expect(output).toContain("Impact");
    expect(output).toContain("Urgency");
    expect(output).toContain("Assignment group");
    expect(output).toContain("Short description");
    expect(output).toContain("Demo requester A");
    expect(output).toContain("Teams message");
    expect(output).not.toContain("Self-service / manual paste");
    expect(output).toContain("Details");
    expect(output).toContain("Notes");
    expect(output).toContain("Related Search (mock only)");
    expect(output).toContain("Save");
    expect(output).toContain("Submit");
    expect(output).toContain("Update");
    expect(output).toContain("Close");
    expect(output).toContain("Disabled / unavailable in demo mode");
    expect(output).toContain("VPN connection issue after password or MFA change");
    expect(output).toContain("Save / Submit / Update / Close unavailable in demo mode");
    expect(output).toContain("Submit disabled in demo mode");
    expect(output.match(/class=\"required-star\"/g)?.length ?? 0).toBe(8);
  });

  it("renders risk controls for no auto-submit/close and fill confirmation", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Risk Control Gate");
    expect(output).toContain("The app does not submit, close, or update real tickets automatically.");
    expect(output).toContain("Confirm human review before fill");
    expect(output).toContain("Fill action locked until review confirmation");
    expect(output).toContain("Final submit is always manual.");
  });

  it("renders the controlled QA single-ticket smoke panel with phrase and status text", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Controlled QA single-ticket smoke");
    expect(output).toContain("Manual-fill assisted QA smoke");
    expect(output).toContain("Current environment mode");
    expect(output).toContain("Required approval phrase for submit_incident");
    expect(output).toContain("I APPROVE MOCK SUBMIT ONLY");
    expect(output).toContain("Blocked: mock-write-denied");
    expect(output).toContain("Mock/prod shadow blocked.");
    expect(output).toContain("QA/dev missing phrase blocked.");
    expect(output).toContain("QA/dev exact phrase + complete mapping -&gt; ready for manual fill only.");
    expect(output).toContain("Privacy-safe audit preview");
    expect(output).toContain("Manual fill only. Single ticket only.");
    expect(output).toContain("No browser DOM filling");
    expect(output).toContain("productionWriteAllowed=false");
    expect(output).toContain("Channel / Contact type");
    expect(output).toContain("Work notes");
    expect(output).toContain("not available");
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
    expect(output).toContain("⚙ Optional field checklist / Team rules");
    expect(output).toContain("Incident field dependency checklist");
    expect(output).toContain("ServiceNow already enforces starred required fields at submit time.");
    expect(output).toContain("This local checklist is optional and customizable for team process");
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
    expect(output).toContain('<details class="field-review-checklist">');
    expect(output).not.toContain('class="field-review-checklist" open');
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
