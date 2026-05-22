import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { demoManualPasteScenarios } from "@servicenow-automation/adapters/browser";

import {
  App,
  applyDraftTemplates,
  buildDemoQueueItems,
  buildDraftForQueueItem,
  clampAppZoomPercent,
  draftTemplatePresets,
  getCtrlWheelZoomDelta,
  getNextAppZoomPercent,
  getNextEnvironmentUrlOverrideFromDraft,
  updateQaSmokeWriteActionSelection,
  type AppProps,
  type LanguageCode
} from "./App";

type TestableAppProps = AppProps;
const TestableApp = App as unknown as (props: TestableAppProps) => ReturnType<typeof App>;

function renderAppMarkup(initialLanguage?: LanguageCode, props: Omit<TestableAppProps, "initialLanguage"> = {}) {
  return renderToStaticMarkup(createElement(TestableApp, { initialLanguage, ...props }));
}

describe("App", () => {
  it("exposes the required safety copy", () => {
    const rendered = renderAppMarkup();

    expect(rendered).toContain("ServiceNow Automation");
    expect(rendered).toContain('class="hero-title"');
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
    expect(output).toContain("Load VPN QA Scenario");
    expect(output).toContain("Load Evidence Demo");
    expect(output).toContain("Load Phone Demo");
    expect(output).toContain("Load Self-service Demo");
    expect(output).toContain("Load Remote Support Demo");
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

  it("renders localized settings, templates, environments, and mock ServiceNow chrome for zh-CN", () => {
    const output = renderAppMarkup("zh-CN");
    const settingsStart = output.indexOf('id="app-settings-sidebar"');
    const settingsEnd = output.indexOf("</aside>", settingsStart);
    const settingsMarkup = output.slice(settingsStart, settingsEnd);

    expect(output).toContain("⚙ 设置");
    expect(output).toContain('aria-label="集中设置"');
    expect(settingsMarkup).toContain("集中设置");
    expect(settingsMarkup).toContain('aria-label="关闭设置面板"');
    expect(settingsMarkup).toContain("✕ 关闭");
    expect(settingsMarkup).toContain("⚙ 显示设置");
    expect(settingsMarkup).toContain("应用缩放");
    expect(settingsMarkup).toContain("重置");
    expect(settingsMarkup).toContain("主题");
    expect(settingsMarkup).toContain("暖色");
    expect(settingsMarkup).toContain("冷色");
    expect(settingsMarkup).not.toContain("Night");
    expect(settingsMarkup).toContain("文本字段");
    expect(settingsMarkup).toContain("自动适应文本框");
    expect(settingsMarkup).toContain("紧凑 + 显示缩放手柄");
    expect(settingsMarkup).toContain("⚙ 模板 / 设置");
    expect(settingsMarkup).toContain("本地演示模板");
    expect(settingsMarkup).toContain("模板预设");
    expect(settingsMarkup).toContain("标准服务台");
    expect(settingsMarkup).toContain("升级准备备注");
    expect(settingsMarkup).toContain("描述模板");
    expect(settingsMarkup).toContain("工作备注模板");
    expect(settingsMarkup).toContain("受理摘要");
    expect(settingsMarkup).toContain("内部排查备注");
    expect(settingsMarkup).toContain("⚙ 可选字段检查清单 / 团队规则");
    expect(settingsMarkup).toContain('aria-label="字段审核进度"');
    expect(settingsMarkup).toContain("已本地审核");
    expect(settingsMarkup).toContain("ServiceNow 会在提交时强制检查带星号的必填字段");
    expect(settingsMarkup).toContain("请求者、类别、地点、渠道、影响、紧急度、分配组、短描述");
    expect(settingsMarkup).toContain("来源渠道已审核");
    expect(settingsMarkup).toContain("真实 ServiceNow 字段填充、Save、Submit、Update、Close");
    expect(settingsMarkup).not.toContain("Optional field checklist / Team rules");
    expect(settingsMarkup).not.toContain("reviewed locally");
    expect(settingsMarkup).not.toContain("Subcategory selected if needed");
    expect(settingsMarkup).not.toContain("Configuration item / affected service checked");
    expect(settingsMarkup).not.toContain("Priority reviewed as derived value");
    expect(settingsMarkup).not.toContain("Human confirmation before any mock fill/copy");

    expect(output).toContain("Mock 演示");
    expect(output).toContain("QA 测试环境");
    expect(output).toContain("开发测试环境");
    expect(output).toContain("生产影子模式");
    expect(output).toContain("当前模式");
    expect(output).toContain("完整 ServiceNow URL 已为隐私隐藏");
    expect(output).toContain("凭据策略");
    expect(output).toContain("无需凭据");
    expect(output).toContain("必须手动登录");
    expect(output).toContain("提交策略");
    expect(output).toContain("仅影子模式");

    expect(output).toContain("Incident | 新记录 — Mock 预览");
    expect(output).toContain("禁用 / 演示模式不可用");
    expect(output).toContain("详情");
    expect(output).toContain("备注");
    expect(output).toContain("相关搜索（仅 mock）");
    expect(output).toContain("请求者");
    expect(output).toContain("类别");
    expect(output).toContain("地点");
    expect(output).toContain("渠道");
    expect(output).toContain("影响");
    expect(output).toContain("紧急度");
    expect(output).toContain("分配组");
    expect(output).toContain("短描述");
    expect(output).toContain("描述");
    expect(output).toContain("工作备注");
    expect(output).toContain("演示模式下提交被禁用");
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
    expect(output).not.toContain("Night");
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
    expect(output.match(/<option value="(?:en-US|zh-CN|zh-TW|es-ES)"/g)?.length ?? 0).toBe(4);
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

  it("maps every manual paste scenario button to one deterministic queue item", () => {
    const queueScenarioIds = buildDemoQueueItems("en-US").map((item) => item.scenarioId).sort();
    const manualScenarioIds = demoManualPasteScenarios.map((scenario) => scenario.id).sort();

    expect(queueScenarioIds).toEqual(manualScenarioIds);
    expect(new Set(queueScenarioIds).size).toBe(demoManualPasteScenarios.length);
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

  it("renders the local Service Desk workflow and Excel dry-run row preview", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Workflow Stage");
    expect(output).toContain("Intake received");
    expect(output).toContain("Contact / confirmation");
    expect(output).toContain("Incident draft prepared");
    expect(output).toContain("Service Desk ownership / team handling");
    expect(output).toContain("Final support group routing");
    expect(output).toContain("Work Notes plan");
    expect(output).toContain("Excel dry-run row");
    expect(output).toContain("Raw Intake Source");
    expect(output).toContain("ServiceNow Channel");
    expect(output).toContain("Teams message");
    expect(output).toContain("Chat");
    expect(output).toContain("Routing Plan");
    expect(output).toContain("Stage 1 — Service Desk Handling");
    expect(output).toContain("Stage 2 — Final Assignment");
    expect(output).toContain("Save is a real write action");
    expect(output).toContain("Excel Dry-run Row Preview");
    expect(output).toContain("Fake Scenario ID");
    expect(output).toContain("vpn-issue");
    expect(output).toContain("Approval Phrase Gate");
    expect(output).toContain("Separate exact approval phrase required before each real Save/Submit/Update/Close action.");
    expect(output).toContain("Stop Rule Check");
    expect(output).toContain("QA Isolation Check");
    expect(output).toContain("QA Dry-run Outcome");
    expect(output).toContain(
      "This row is generated locally from the reviewed draft. XLSX export creates a local dry-run file only; no Graph, cloud workbook, or ServiceNow write is performed."
    );
    expect(output).toContain("Copy CSV Row");
    expect(output).toContain("Copy Markdown Summary");
    expect(output).toContain("No real ServiceNow, Excel workbook, Graph, browser, API, mailbox, Teams, or portal write is performed.");
  });

  it("renders local XLSX dry-run artifact metadata without Graph or ServiceNow writes", () => {
    const output = renderAppMarkup();

    expect(output).toContain("Local XLSX Dry-run Artifact");
    expect(output).toContain("Download Local XLSX Dry-run");
    expect(output).toContain("Copy XLSX Metadata");
    expect(output).toContain("servicenow-dry-run-2026-05-18T08-15.xlsx");
    expect(output).toContain("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(output).toContain("Excel Dry-run Row");
    expect(output).toContain("Artifact byte size");
    expect(output).toContain(
      "Local deterministic XLSX dry-run artifact only. It does not connect to Microsoft Graph, a cloud workbook, ServiceNow, browser automation, or any real write path."
    );
  });

  it("renders local-only ServiceNow environment URL settings with unchanged write gates", () => {
    const output = renderAppMarkup(undefined, {
      initialEnvironmentUrlSettings: {
        qa: "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
      }
    });
    const settingsStart = output.indexOf('id="app-settings-sidebar"');
    const settingsEnd = output.indexOf("</aside>", settingsStart);
    const settingsMarkup = output.slice(settingsStart, settingsEnd);

    expect(settingsMarkup).toContain("ServiceNow Environment URL settings");
    expect(settingsMarkup).toContain("Local state only");
    expect(settingsMarkup).toContain("Custom URL");
    expect(settingsMarkup).toContain("QA Test Environment");
    expect(settingsMarkup).toContain("Development Test Environment");
    expect(settingsMarkup).toContain("Production Shadow Mode");
    expect(settingsMarkup).toContain("Accepted ServiceNow host");
    expect(settingsMarkup).toContain("qa.service-now.example.invalid");
    expect(settingsMarkup).toContain("Custom target active for this session");
    expect(settingsMarkup).toContain("Built-in/default target active; raw target URL stays hidden until a safe custom URL is accepted.");
    expect(settingsMarkup).toContain(
      "Write gate unchanged: each Save/Submit/Update/Close still requires the exact action approval phrase."
    );
    expect(output).not.toContain('href="https://');
    expect(output).not.toContain("graph.microsoft.com");
  });

  it("does not label invalid ServiceNow environment URL drafts as active targets", () => {
    const output = renderAppMarkup(undefined, {
      initialEnvironmentUrlSettings: {
        qa: "https://not-servicenow.example.invalid/nav_to.do"
      }
    });
    const settingsStart = output.indexOf('id="app-settings-sidebar"');
    const settingsEnd = output.indexOf("</aside>", settingsStart);
    const settingsMarkup = output.slice(settingsStart, settingsEnd);

    expect(settingsMarkup).toContain("Blocked URL setting: host must be a ServiceNow host or approved non-routable placeholder");
    expect(settingsMarkup).toContain("Built-in/default target active; raw target URL stays hidden until a safe custom URL is accepted.");
    expect(settingsMarkup).not.toContain("Custom target active for this session");
  });

  it("clears active ServiceNow URL overrides when a draft URL becomes invalid", () => {
    expect(
      getNextEnvironmentUrlOverrideFromDraft(
        "qa",
        "https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do"
      )
    ).toBe("https://qa.service-now.example.invalid/now/nav/ui/classic/params/target/home_splash.do");
    expect(getNextEnvironmentUrlOverrideFromDraft("qa", "https://qa.service-now.example.invalid/incident.do/fake-record-123")).toBe("");
    expect(getNextEnvironmentUrlOverrideFromDraft("qa", "https://example.invalid/nav_to.do")).toBe("");
    expect(getNextEnvironmentUrlOverrideFromDraft("qa", "")).toBe("");
  });

  it("renders one FIFO intake item for each deterministic manual scenario", () => {
    const output = renderAppMarkup();
    const queueItemCount = output.match(/<button class=\"queue-item/g)?.length ?? 0;
    const teamsIndex = output.indexOf("Teams note: VPN connection issue after password reset");
    const selfServiceIndex = output.indexOf("Self-service request: Windows laptop slow after update");
    const chatIndex = output.indexOf("Chat transcript: account login issue after password change");
    const mailboxIndex = output.indexOf("Shared mailbox item: remote access unavailable");
    const phoneIndex = output.indexOf("QA TEST ONLY - Fake phone intake requiring confirmation");
    const remoteSupportIndex = output.indexOf("QA TEST ONLY - Fake remote support checklist");

    expect(queueItemCount).toBe(6);
    expect(teamsIndex).toBeGreaterThan(-1);
    expect(selfServiceIndex).toBeGreaterThan(teamsIndex);
    expect(chatIndex).toBeGreaterThan(selfServiceIndex);
    expect(mailboxIndex).toBeGreaterThan(chatIndex);
    expect(phoneIndex).toBeGreaterThan(mailboxIndex);
    expect(remoteSupportIndex).toBeGreaterThan(phoneIndex);
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
    expect(output).toContain("Requested write action");
    expect(output).toContain('value="save_incident" selected=""');
    expect(output).toContain('value="submit_incident"');
    expect(output).toContain('value="update_incident"');
    expect(output).toContain('value="close_incident"');
    expect(output).toContain("Required approval phrase for selected action");
    expect(output).toContain("save_incident");
    expect(output).toContain("I APPROVE MOCK SAVE ONLY");
    expect(output).toContain("First smoke safe scope");
    expect(output).toContain("Dry-run first: review the local field mapping and Excel row preview only.");
    expect(output).toContain("Manual copy only: Alan copies or types values; the app never fills ServiceNow.");
    expect(output).toContain("Save-only readiness: Submit, Update, and Close remain deferred to a later checkpoint.");
    expect(output).toContain("Action-specific approval phrases");
    expect(output).toContain("I APPROVE MOCK SUBMIT ONLY");
    expect(output).toContain("I APPROVE MOCK UPDATE ONLY");
    expect(output).toContain("I APPROVE MOCK CLOSE ONLY");
    expect(output).toContain("Stop rules");
    expect(output).toContain(
      "Stop before every Save/Submit/Update/Close unless Alan gives the exact action-specific approval phrase."
    );
    expect(output).toContain("Stop if the QA ticket could notify production users or a real support team.");
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

  it("keeps the selected QA write action local and derives its matching approval phrase", () => {
    const stalePhraseReset = updateQaSmokeWriteActionSelection("save_incident");

    expect(stalePhraseReset).toEqual({
      writeAction: "save_incident",
      approvalPhrase: ""
    });

    const actionPhrases = [
      ["save_incident", "I APPROVE MOCK SAVE ONLY"],
      ["submit_incident", "I APPROVE MOCK SUBMIT ONLY"],
      ["update_incident", "I APPROVE MOCK UPDATE ONLY"],
      ["close_incident", "I APPROVE MOCK CLOSE ONLY"]
    ] as const;

    for (const [initialQaSmokeWriteAction, expectedPhrase] of actionPhrases) {
      const output = renderAppMarkup(undefined, { initialQaSmokeWriteAction });

      expect(output).toContain(`value="${initialQaSmokeWriteAction}" selected=""`);
      expect(output).toContain(
        `<span>Required approval phrase for selected action</span><code>${expectedPhrase}</code>`
      );
      expect(output).toContain("This does NOT submit, save, update, close, launch browser automation");
    }
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
