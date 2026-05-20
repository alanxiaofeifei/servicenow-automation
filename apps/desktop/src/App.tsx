import { useMemo, useState } from "react";

import { demoManualPasteScenarios, type ManualPasteScenario } from "@servicenow-automation/adapters/browser";
import { generateMockTicketDraft } from "@servicenow-automation/ai";
import { demoKnowledgeArticles, searchKnowledgeArticles } from "@servicenow-automation/kb/browser";
import {
  getDefaultServiceNowEnvironmentMode,
  getServiceNowEnvironmentConfig,
  loadDemoYageoProfile,
  serviceNowEnvironmentConfigs,
  type ServiceNowEnvironmentConfig,
  type ServiceNowEnvironmentMode
} from "@servicenow-automation/profiles";
import {
  CapturedContextSchema,
  normalizeSourceContextText,
  type CapturedContext,
  type FieldDraft,
  type SourceType,
  type TicketDraft
} from "@servicenow-automation/core";

const profile = loadDemoYageoProfile();

type DemoQueueStatus = "New" | "Reviewed" | "Drafted" | "Done" | "Skipped";

type HighSeverityState = "normal" | "p2" | "p1";

type SourceChannel = "Teams message" | "Self-service ticket" | "ServiceNow Chat transcript" | "Shared mailbox item";

type DemoQueueItem = {
  id: string;
  scenarioId: ManualPasteScenario["id"];
  language: LanguageCode;
  requesterLabel: string;
  receivedAt: string;
  subject: string;
  bodyPreview: string;
  sourceBody: string;
  sourceChannel: SourceChannel;
  sourceLanguage: string;
  draftLanguageMode: string;
  status: DemoQueueStatus;
};

type DemoQueueContent = {
  requesterLabel: string;
  subject: string;
  bodyPreview: string;
  sourceBody: string;
  sourceLanguage: string;
  draftLanguageMode: string;
};

type DemoQueueDefinition = {
  id: string;
  scenarioId: ManualPasteScenario["id"];
  receivedAt: string;
  sourceChannel: SourceChannel;
  content: Record<LanguageCode, DemoQueueContent>;
};

type FieldReviewChecklistItem = {
  id: string;
  label: string;
};

type PreparedCopyDraft = {
  confirmation: string;
  text: string;
};

type DraftTemplatePresetId = "standard-service-desk" | "escalation-ready-notes";

type DraftTemplatePreset = {
  id: DraftTemplatePresetId;
  label: string;
  descriptionTemplate: string;
  workNotesTemplate: string;
};

export type DraftTemplateSettings = {
  descriptionTemplate: string;
  workNotesTemplate: string;
};

export type LanguageCode = "zh-CN" | "zh-TW" | "en-US" | "es-ES";

type UiTranslations = {
  safetyTagline: string;
  productEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  languageLabel: string;
  languageHelper: string;
  languageSimulationNotice: string;
  workflowEyebrow: string;
  workflowStages: {
    queue: string;
    sourceReview: string;
    ticketDraft: string;
  };
  workspaceTitle: string;
  workspaceSubtitle: string;
  runtimeEyebrow: string;
  runtimeTitle: string;
  highSeverityMonitor: {
    title: string;
    safetyNotice: string;
    stateLabel: string;
    countLabel: string;
    affectedServicesLabel: string;
    acknowledgedLabel: string;
    mutedLabel: string;
    acknowledgeAction: string;
    muteAction: string;
  };
  environmentEyebrow: string;
  environmentTitle: string;
  queueEyebrow: string;
  queueTitle: string;
  sourceReviewEyebrow: string;
  sourceReviewTitle: string;
  capturedContextTitle: string;
  editableDraftTitle: string;
  kbMatchesTitle: string;
  missingInfoTitle: string;
  riskFlagsTitle: string;
  copyEyebrow: string;
  copyTitle: string;
  checklistEyebrow: string;
  checklistTitle: string;
  mockEyebrow: string;
  mockTitle: string;
  mockSubtitle: string;
  mockFillButton: string;
  mockReadyStatus: string;
  mockLockedStatus: string;
  mockDisabledStatus: string;
  mockDemoStamp: string;
};

export const languageOptions: { code: LanguageCode; label: string }[] = [
  { code: "en-US", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁中（台灣）" },
  { code: "es-ES", label: "Español" }
];

const uiTranslations: Record<LanguageCode, UiTranslations> = {
  "zh-CN": {
    safetyTagline: "AI 仅生成草稿。必须人工审核并手动提交。",
    productEyebrow: "现场试运行加速 P0",
    heroTitle: "ServiceNow 自动化",
    heroSubtitle: "人工把关的服务台工作台，用于审核脱敏队列项并准备可编辑的 Incident 草稿。",
    languageLabel: "界面语言",
    languageHelper: "每个项目可扩展更多语言。",
    languageSimulationNotice:
      "语言模拟仅使用本地确定性演示数据；不调用外部翻译服务，也不连接真实 ServiceNow、Teams、邮箱、Graph 或 API。",
    workflowEyebrow: "队列 → 来源审核 → TicketDraft",
    workflowStages: {
      queue: "队列",
      sourceReview: "来源审核",
      ticketDraft: "工单草稿"
    },
    workspaceTitle: "工单草稿工作台",
    workspaceSubtitle:
      "演示模式是确定性的。仅使用假脱敏数据；不连接 Teams、邮箱、ServiceNow Chat/API 或自助服务轮询。",
    runtimeEyebrow: "运行时 / 安全",
    runtimeTitle: "静态演示姿态",
    highSeverityMonitor: {
      title: "High Severity Monitor Simulator",
      safetyNotice: "Fake simulator only — no ServiceNow polling or API calls",
      stateLabel: "状态",
      countLabel: "假告警数",
      affectedServicesLabel: "假受影响服务",
      acknowledgedLabel: "已确认",
      mutedLabel: "演示静音",
      acknowledgeAction: "Acknowledge",
      muteAction: "Mute demo alerts"
    },
    environmentEyebrow: "ServiceNow 环境模式",
    environmentTitle: "为本次运行选择最安全的目标。",
    queueEyebrow: "受理队列",
    queueTitle: "受理队列 — 仅假脱敏数据",
    sourceReviewEyebrow: "来源审核",
    sourceReviewTitle: "原始与清洗后的来源",
    capturedContextTitle: "捕获上下文",
    editableDraftTitle: "可编辑 Incident 草稿",
    kbMatchesTitle: "KB 匹配",
    missingInfoTitle: "缺失信息",
    riskFlagsTitle: "风险标记",
    copyEyebrow: "本地复制 / 导出",
    copyTitle: "安全草稿操作",
    checklistEyebrow: "传统字段审核",
    checklistTitle: "Incident 字段依赖检查清单",
    mockEyebrow: "Incident · QA/Dev 预演",
    mockTitle: "Mock ServiceNow Incident 预览",
    mockSubtitle: "该面板展示可编辑草稿如何映射到接近 ServiceNow 的 Incident 新建表单，仅用于演示。",
    mockFillButton: "填充 Mock ServiceNow 表单",
    mockReadyStatus: "已准备好 mock 填充",
    mockLockedStatus: "审核确认前锁定填充动作",
    mockDisabledStatus: "演示模式下 Save / Submit / Update / Close 不可用",
    mockDemoStamp: "MOCK / 仅演示"
  },
  "en-US": {
    safetyTagline: "AI drafts only. Human review and manual submit required.",
    productEyebrow: "Field-trial accelerated P0",
    heroTitle: "ServiceNow Automation",
    heroSubtitle:
      "Human-in-the-loop Service Desk workflow cockpit for reviewing sanitized queue items and preparing editable Incident drafts.",
    languageLabel: "Interface language",
    languageHelper: "Future languages can be added per project.",
    languageSimulationNotice:
      "Language simulation uses local deterministic demo data only; no external translation service and no real ServiceNow, Teams, mailbox, Graph, or API connection is used.",
    workflowEyebrow: "Queue → Source Review → TicketDraft",
    workflowStages: {
      queue: "Queue",
      sourceReview: "Source Review",
      ticketDraft: "TicketDraft"
    },
    workspaceTitle: "Ticket Draft Workspace",
    workspaceSubtitle:
      "Demo mode is deterministic. Fake sanitized intake only; no Teams, mailbox, ServiceNow Chat/API, or self-service polling connection is used.",
    runtimeEyebrow: "Runtime / Safety",
    runtimeTitle: "Static demo posture",
    highSeverityMonitor: {
      title: "High Severity Monitor Simulator",
      safetyNotice: "Fake simulator only — no ServiceNow polling or API calls",
      stateLabel: "State",
      countLabel: "Fake count",
      affectedServicesLabel: "Fake affected services",
      acknowledgedLabel: "Acknowledged",
      mutedLabel: "Muted",
      acknowledgeAction: "Acknowledge",
      muteAction: "Mute demo alerts"
    },
    environmentEyebrow: "ServiceNow Environment Mode",
    environmentTitle: "Choose the safest target for this run.",
    queueEyebrow: "Intake Queue",
    queueTitle: "Intake Queue — fake sanitized data only",
    sourceReviewEyebrow: "Source Review",
    sourceReviewTitle: "Raw vs Cleaned Source",
    capturedContextTitle: "Captured Context",
    editableDraftTitle: "Editable Incident Draft",
    kbMatchesTitle: "KB Matches",
    missingInfoTitle: "Missing Info",
    riskFlagsTitle: "Risk Flags",
    copyEyebrow: "Local copy/export",
    copyTitle: "Safe draft actions",
    checklistEyebrow: "Legacy-inspired field review",
    checklistTitle: "Incident field dependency checklist",
    mockEyebrow: "Incident · QA/Dev rehearsal",
    mockTitle: "Mock ServiceNow Incident Preview",
    mockSubtitle:
      "This panel shows how the editable draft would map into a ServiceNow-like Incident new-record form before QA/dev testing.",
    mockFillButton: "Fill Mock ServiceNow Form",
    mockReadyStatus: "Ready for mock fill",
    mockLockedStatus: "Fill action locked until review confirmation",
    mockDisabledStatus: "Save / Submit / Update / Close unavailable in demo mode",
    mockDemoStamp: "MOCK / Demo only"
  },
  "zh-TW": {
    safetyTagline: "AI 僅產生草稿。必須人工審核並手動提交。",
    productEyebrow: "現場試行加速 P0",
    heroTitle: "ServiceNow 自動化",
    heroSubtitle: "人工把關的 Service Desk 工作台，用於審核已去識別化的佇列項目並準備可編輯的 Incident 草稿。",
    languageLabel: "介面語言",
    languageHelper: "每個專案都可擴充更多語言。",
    languageSimulationNotice:
      "語言模擬僅使用本地端確定性示範資料；不呼叫外部翻譯服務，也不連線真實 ServiceNow、Teams、信箱、Graph 或 API。",
    workflowEyebrow: "佇列 → 來源審核 → TicketDraft",
    workflowStages: {
      queue: "佇列",
      sourceReview: "來源審核",
      ticketDraft: "工單草稿"
    },
    workspaceTitle: "工單草稿工作台",
    workspaceSubtitle:
      "示範模式是確定性的。僅使用假的去識別化受理資料；不連線 Teams、信箱、ServiceNow Chat/API 或自助服務輪詢。",
    runtimeEyebrow: "執行階段 / 安全",
    runtimeTitle: "靜態示範狀態",
    highSeverityMonitor: {
      title: "High Severity Monitor Simulator",
      safetyNotice: "Fake simulator only — no ServiceNow polling or API calls",
      stateLabel: "狀態",
      countLabel: "假告警數",
      affectedServicesLabel: "假受影響服務",
      acknowledgedLabel: "已確認",
      mutedLabel: "示範靜音",
      acknowledgeAction: "Acknowledge",
      muteAction: "Mute demo alerts"
    },
    environmentEyebrow: "ServiceNow 環境模式",
    environmentTitle: "為本次執行選擇最安全的目標。",
    queueEyebrow: "受理佇列",
    queueTitle: "受理佇列 — 僅假的去識別化資料",
    sourceReviewEyebrow: "來源審核",
    sourceReviewTitle: "原始與清理後來源",
    capturedContextTitle: "擷取內容",
    editableDraftTitle: "可編輯 Incident 草稿",
    kbMatchesTitle: "KB 符合項目",
    missingInfoTitle: "缺少資訊",
    riskFlagsTitle: "風險標記",
    copyEyebrow: "本地複製 / 匯出",
    copyTitle: "安全草稿操作",
    checklistEyebrow: "傳統欄位審核",
    checklistTitle: "Incident 欄位相依檢查清單",
    mockEyebrow: "Incident · QA/Dev 預演",
    mockTitle: "Mock ServiceNow Incident 預覽",
    mockSubtitle: "此面板展示可編輯草稿如何對應到近似 ServiceNow 的 Incident 新增表單，僅供示範。",
    mockFillButton: "填入 Mock ServiceNow 表單",
    mockReadyStatus: "已準備好 mock 填入",
    mockLockedStatus: "審核確認前鎖定填入動作",
    mockDisabledStatus: "示範模式下 Save / Submit / Update / Close 不可用",
    mockDemoStamp: "MOCK / 僅示範"
  },
  "es-ES": {
    safetyTagline: "Solo borradores de IA. Se requiere revisión humana y envío manual.",
    productEyebrow: "P0 acelerado para prueba de campo",
    heroTitle: "Automatización de ServiceNow",
    heroSubtitle:
      "Cockpit de Service Desk con revisión humana para validar elementos sanitizados de la cola y preparar borradores editables de Incident.",
    languageLabel: "Idioma de la interfaz",
    languageHelper: "Se pueden añadir idiomas futuros por proyecto.",
    languageSimulationNotice:
      "La simulación de idioma usa solo datos demo locales y deterministas; no usa servicio externo de traducción ni conexión real a ServiceNow, Teams, buzón, Graph o API.",
    workflowEyebrow: "Cola → Revisión de origen → TicketDraft",
    workflowStages: {
      queue: "Cola",
      sourceReview: "Revisión de origen",
      ticketDraft: "Borrador"
    },
    workspaceTitle: "Espacio de borrador de ticket",
    workspaceSubtitle:
      "El modo demo es determinista. Solo usa datos falsos y sanitizados; no conecta Teams, buzón, ServiceNow Chat/API ni sondeo de autoservicio.",
    runtimeEyebrow: "Ejecución / Seguridad",
    runtimeTitle: "Postura demo estática",
    highSeverityMonitor: {
      title: "High Severity Monitor Simulator",
      safetyNotice: "Fake simulator only — no ServiceNow polling or API calls",
      stateLabel: "Estado",
      countLabel: "Conteo falso",
      affectedServicesLabel: "Servicios falsos afectados",
      acknowledgedLabel: "Reconocido",
      mutedLabel: "Demo silenciada",
      acknowledgeAction: "Acknowledge",
      muteAction: "Mute demo alerts"
    },
    environmentEyebrow: "Modo de entorno ServiceNow",
    environmentTitle: "Elige el destino más seguro para esta ejecución.",
    queueEyebrow: "Cola de entrada",
    queueTitle: "Cola de entrada — solo datos falsos sanitizados",
    sourceReviewEyebrow: "Revisión de origen",
    sourceReviewTitle: "Origen bruto vs. limpio",
    capturedContextTitle: "Contexto capturado",
    editableDraftTitle: "Borrador editable de Incident",
    kbMatchesTitle: "Coincidencias KB",
    missingInfoTitle: "Información faltante",
    riskFlagsTitle: "Riesgos",
    copyEyebrow: "Copia/exportación local",
    copyTitle: "Acciones seguras del borrador",
    checklistEyebrow: "Revisión de campos heredada",
    checklistTitle: "Lista de dependencias de campos de Incident",
    mockEyebrow: "Incident · Ensayo QA/Dev",
    mockTitle: "Vista previa mock de ServiceNow Incident",
    mockSubtitle:
      "Este panel muestra cómo el borrador editable se asignaría a un formulario nuevo de Incident similar a ServiceNow antes de pruebas QA/dev.",
    mockFillButton: "Rellenar formulario mock de ServiceNow",
    mockReadyStatus: "Listo para relleno mock",
    mockLockedStatus: "Relleno bloqueado hasta confirmar la revisión",
    mockDisabledStatus: "Save / Submit / Update / Close no disponibles en modo demo",
    mockDemoStamp: "MOCK / Solo demo"
  }
};

const runtimeSafetyStatuses = [
  { label: "Demo mode", value: "ON" },
  { label: "Real ServiceNow", value: "OFF" },
  { label: "Auto-submit", value: "disabled" },
  { label: "External AI with real data", value: "disabled" },
  {
    label: "Browser/runtime",
    value: "dedicated Chromium prepared/planned; not launched by this panel"
  },
  { label: "Profile", value: "disposable/tool-owned model" },
  { label: "Data", value: "fake sanitized demo data only" }
];

const highSeveritySimulatorStates: Record<
  HighSeverityState,
  { label: string; fakeCount: number; affectedServices: string[] }
> = {
  normal: {
    label: "Normal",
    fakeCount: 0,
    affectedServices: ["Demo service desk queue"]
  },
  p2: {
    label: "P2 Active",
    fakeCount: 2,
    affectedServices: ["Demo identity sign-in", "Demo remote access"]
  },
  p1: {
    label: "P1 Active",
    fakeCount: 4,
    affectedServices: ["Demo network access", "Demo employee portal"]
  }
};

const fieldReviewChecklistItems: FieldReviewChecklistItem[] = [
  { id: "source-channel-reviewed", label: "Source channel reviewed" },
  { id: "requester-identified", label: "Requester identified" },
  { id: "location-checked", label: "Location checked" },
  { id: "channel-selected", label: "Channel selected" },
  { id: "short-description-reviewed", label: "Short description generated/reviewed" },
  { id: "description-reviewed", label: "Description generated/reviewed" },
  { id: "category-selected", label: "Category selected" },
  { id: "subcategory-selected-if-needed", label: "Subcategory selected if needed" },
  { id: "ci-affected-service-checked", label: "Configuration item / affected service checked" },
  { id: "impact-checked", label: "Impact checked" },
  { id: "urgency-checked", label: "Urgency checked" },
  { id: "priority-reviewed-derived", label: "Priority reviewed as derived value" },
  { id: "assignment-group-reviewed", label: "Assignment group suggested/reviewed" },
  { id: "work-notes-prepared", label: "Work notes prepared" },
  {
    id: "comments-separated",
    label: "Customer-visible comments separated from internal Work Notes"
  },
  { id: "human-confirmation-before-mock-fill", label: "Human confirmation before any mock fill/copy" }
];

export const draftTemplatePresets: DraftTemplatePreset[] = [
  {
    id: "standard-service-desk",
    label: "Standard Service Desk",
    descriptionTemplate: [
      "Intake summary",
      "{{draft_content}}",
      "",
      "Review notes",
      "- Verify requester, source channel, impact, urgency, and category before any manual action.",
      "- Keep customer-visible text separate from internal Work Notes."
    ].join("\n"),
    workNotesTemplate: [
      "Internal triage notes",
      "{{draft_content}}",
      "",
      "Next checks",
      "- Confirm the current symptom, recent change, timestamp, and affected scope.",
      "- Use only fake sanitized demo data in this local preview."
    ].join("\n")
  },
  {
    id: "escalation-ready-notes",
    label: "Escalation-ready notes",
    descriptionTemplate: [
      "Issue summary for review",
      "{{draft_content}}",
      "",
      "Escalation context",
      "- Capture business impact, affected access or device scope, and any immediate workaround.",
      "- Do not include secrets, credentials, real ticket numbers, or real customer identifiers."
    ].join("\n"),
    workNotesTemplate: [
      "Escalation-ready internal notes",
      "{{draft_content}}",
      "",
      "Handoff checklist",
      "- Record completed checks, remaining unknowns, reproduction details, and sanitized evidence.",
      "- Human reviewer decides whether escalation is appropriate."
    ].join("\n")
  }
];

const defaultDraftTemplatePreset = draftTemplatePresets[0];

const unsupportedFallbackMode = "Unsupported-language fallback: source language + English bilingual draft";

const demoQueueDefinitions: DemoQueueDefinition[] = [
  {
    id: "demo-teams-vpn",
    scenarioId: "vpn-issue",
    receivedAt: "2026-05-18 08:15",
    sourceChannel: "Teams message",
    content: {
      "en-US": {
        requesterLabel: "Demo requester A",
        subject: "Teams note: VPN connection issue after password reset",
        bodyPreview:
          "A demo teammate reports VPN cannot connect after a recent password reset. The VPN client loops at the MFA prompt.",
        sourceBody:
          "Teams-style demo message:\n\n[08:15] Demo requester: Hi team,\n[08:16] Demo requester: RE: [EXTERNAL] VPN cannot connect after a recent password reset. The VPN client keeps looping at the MFA prompt.\n[08:18] Demo requester: Impact: Internet works without VPN, but remote access is unavailable.\n\nThanks,\nDemo requester A\n\nThis is fake sanitized intake data only. No Teams tenant, channel, chat, user profile, or message link is connected.",
        sourceLanguage: "English",
        draftLanguageMode: "Primary demo language: English"
      },
      "zh-CN": {
        requesterLabel: "演示请求者 A",
        subject: "Teams 备注：密码重置后 VPN 无法连接",
        bodyPreview: "演示同事反馈密码重置后 VPN 无法连接，VPN 客户端在 MFA 提示处反复循环。",
        sourceBody:
          "Teams 风格演示消息：\n\n[08:15] 演示请求者：团队好，\n[08:16] 演示请求者：RE: [EXTERNAL] 密码重置后 VPN 无法连接。VPN 客户端一直在 MFA 提示处循环。\n[08:18] 演示请求者：影响：不连 VPN 时互联网可用，但远程访问不可用。\n\n谢谢，\n演示请求者 A\n\n这只是假的脱敏受理数据。未连接 Teams 租户、频道、聊天、用户资料或消息链接。",
        sourceLanguage: "简体中文",
        draftLanguageMode: "主要演示语言：简体中文"
      },
      "zh-TW": {
        requesterLabel: "示範請求者 A",
        subject: "Teams 備註：密碼重設後 VPN 無法連線",
        bodyPreview: "示範同事回報密碼重設後 VPN 無法連線，VPN 用戶端停在 MFA 提示並反覆循環。",
        sourceBody:
          "Teams 風格示範訊息：\n\n[08:15] 示範請求者：團隊好，\n[08:16] 示範請求者：RE: [EXTERNAL] 密碼重設後 VPN 無法連線。VPN 用戶端一直在 MFA 提示處循環。\n[08:18] 示範請求者：影響：未連 VPN 時網際網路可用，但遠端存取不可用。\n\n謝謝，\n示範請求者 A\n\n這只是假的去識別化受理資料。未連線 Teams 租戶、頻道、聊天、使用者資料或訊息連結。",
        sourceLanguage: "台灣繁體中文",
        draftLanguageMode: "主要示範語言：台灣繁體中文"
      },
      "es-ES": {
        requesterLabel: "Solicitante demo A",
        subject: "Nota de Teams: VPN no conecta tras restablecer contraseña",
        bodyPreview:
          "Un compañero demo informa que la VPN no conecta tras restablecer la contraseña. El cliente VPN repite el aviso MFA.",
        sourceBody:
          "Mensaje demo estilo Teams:\n\n[08:15] Solicitante demo: Hola equipo,\n[08:16] Solicitante demo: RE: [EXTERNAL] La VPN no conecta tras restablecer la contraseña. El cliente VPN sigue repitiendo el aviso MFA.\n[08:18] Solicitante demo: Impacto: Internet funciona sin VPN, pero el acceso remoto no está disponible.\n\nGracias,\nSolicitante demo A\n\nEstos son datos demo falsos y sanitizados. No hay conexión a tenant, canal, chat, perfil de usuario ni enlace de mensaje de Teams.",
        sourceLanguage: "Español",
        draftLanguageMode: "Idioma demo principal: Español"
      }
    }
  },
  {
    id: "demo-self-service-windows",
    scenarioId: "windows-issue",
    receivedAt: "2026-05-18 08:40",
    sourceChannel: "Self-service ticket",
    content: {
      "en-US": {
        requesterLabel: "Demo requester B",
        subject: "Self-service request: Windows laptop slow after update",
        bodyPreview:
          "A fake portal submission says a Windows laptop became very slow after the latest update. Reboot was attempted once.",
        sourceBody:
          "Self-service-style demo submission:\n\nRequest ID: DEMO-PORTAL-002\nDescription: A demo requester reports that a Windows laptop became very slow after the latest update.\nImpact: Reboot was attempted once, but startup and application launch remain slow for the user.\n\nThis is fake sanitized intake data only. No portal polling, ticket number, requester profile, or live self-service record is connected.",
        sourceLanguage: "English self-service source",
        draftLanguageMode: "Self-service source language drives Description / Work Notes"
      },
      "zh-CN": {
        requesterLabel: "演示请求者 B",
        subject: "自助服务请求：Windows 笔记本更新后变慢",
        bodyPreview: "假的门户提交说明 Windows 笔记本在最近更新后明显变慢，用户已尝试重启一次。",
        sourceBody:
          "自助服务风格演示提交：\n\n请求 ID: DEMO-PORTAL-002\n描述：演示请求者反馈 Windows 笔记本在最近更新后变得非常慢。\n影响：已尝试重启一次，但开机和应用启动仍然很慢。\n\n这只是假的脱敏受理数据。未连接门户轮询、工单号、请求者资料或实时自助服务记录。",
        sourceLanguage: "简体中文自助服务来源",
        draftLanguageMode: "自助服务来源语言驱动 Description / Work Notes"
      },
      "zh-TW": {
        requesterLabel: "示範請求者 B",
        subject: "自助服務請求：Windows 筆電更新後變慢",
        bodyPreview: "假的入口網站提交指出 Windows 筆電在最近更新後明顯變慢，使用者已嘗試重新啟動一次。",
        sourceBody:
          "自助服務風格示範提交：\n\n請求 ID: DEMO-PORTAL-002\n描述：示範請求者回報 Windows 筆電在最近更新後變得非常慢。\n影響：已嘗試重新啟動一次，但開機與應用程式啟動仍然很慢。\n\n這只是假的去識別化受理資料。未連線入口網站輪詢、工單號、請求者資料或即時自助服務記錄。",
        sourceLanguage: "台灣繁體中文自助服務來源",
        draftLanguageMode: "自助服務來源語言驅動 Description / Work Notes"
      },
      "es-ES": {
        requesterLabel: "Solicitante demo B",
        subject: "Solicitud de autoservicio: portátil Windows lento tras actualización",
        bodyPreview:
          "Una solicitud falsa del portal indica que un portátil Windows quedó muy lento tras la última actualización. Se intentó reiniciar una vez.",
        sourceBody:
          "Envío demo estilo autoservicio:\n\nID de solicitud: DEMO-PORTAL-002\nDescripción: Un solicitante demo informa que un portátil Windows quedó muy lento tras la última actualización.\nImpacto: Se intentó reiniciar una vez, pero el arranque y la apertura de aplicaciones siguen lentos para el usuario.\n\nEstos son datos demo falsos y sanitizados. No hay sondeo de portal, número de ticket, perfil de solicitante ni registro real de autoservicio conectado.",
        sourceLanguage: "Origen de autoservicio en Español",
        draftLanguageMode: "El idioma de origen de autoservicio guía Description / Work Notes"
      }
    }
  },
  {
    id: "demo-chat-account",
    scenarioId: "account-login-issue",
    receivedAt: "2026-05-18 09:05",
    sourceChannel: "ServiceNow Chat transcript",
    content: {
      "en-US": {
        requesterLabel: "Demo requester C",
        subject: "Chat transcript: account login issue after password change",
        bodyPreview:
          "A sanitized chat transcript says login fails after password change. MFA appears but authentication fails repeatedly.",
        sourceBody:
          "ServiceNow Chat-style demo transcript:\n\nTranscript ID: DEMO-CHAT-003\n[09:05] Demo requester: I cannot login after changing password.\n[09:06] Demo support: Does the MFA prompt appear?\n[09:07] Demo requester: Yes, but authentication fails repeatedly. I can access some services but not the required application.\n\nThis is fake sanitized intake data only. No ServiceNow Chat, ServiceNow API, transcript ID, or live conversation is connected.",
        sourceLanguage: "English",
        draftLanguageMode: "Primary demo language: English"
      },
      "zh-CN": {
        requesterLabel: "演示请求者 C",
        subject: "聊天记录：密码修改后账号登录异常",
        bodyPreview: "脱敏聊天记录显示密码修改后无法登录，MFA 会出现但认证反复失败。",
        sourceBody:
          "ServiceNow Chat 风格演示记录：\n\n记录 ID: DEMO-CHAT-003\n[09:05] 演示请求者：我修改密码后无法登录。\n[09:06] 演示支持：是否出现 MFA 提示？\n[09:07] 演示请求者：会出现，但认证反复失败。我可以访问部分服务，但无法访问所需应用。\n\n这只是假的脱敏受理数据。未连接 ServiceNow Chat、ServiceNow API、记录 ID 或实时对话。",
        sourceLanguage: "简体中文",
        draftLanguageMode: "主要演示语言：简体中文"
      },
      "zh-TW": {
        requesterLabel: "示範請求者 C",
        subject: "聊天記錄：密碼變更後帳號登入異常",
        bodyPreview: "去識別化聊天記錄顯示密碼變更後無法登入，MFA 會出現但驗證反覆失敗。",
        sourceBody:
          "ServiceNow Chat 風格示範記錄：\n\n記錄 ID: DEMO-CHAT-003\n[09:05] 示範請求者：我變更密碼後無法登入。\n[09:06] 示範支援：是否有出現 MFA 提示？\n[09:07] 示範請求者：有，但驗證一直失敗。我可以存取部分服務，但無法進入需要的應用程式。\n\n這只是假的去識別化受理資料。未連線 ServiceNow Chat、ServiceNow API、記錄 ID 或即時對話。",
        sourceLanguage: "台灣繁體中文",
        draftLanguageMode: "主要示範語言：台灣繁體中文"
      },
      "es-ES": {
        requesterLabel: "Solicitante demo C",
        subject: "Transcripción de chat: problema de inicio de sesión tras cambiar contraseña",
        bodyPreview:
          "Una transcripción sanitizada dice que el inicio de sesión falla tras cambiar la contraseña. MFA aparece pero la autenticación falla repetidamente.",
        sourceBody:
          "Transcripción demo estilo ServiceNow Chat:\n\nID de transcripción: DEMO-CHAT-003\n[09:05] Solicitante demo: No puedo iniciar sesión después de cambiar la contraseña.\n[09:06] Soporte demo: ¿Aparece el aviso MFA?\n[09:07] Solicitante demo: Sí, pero la autenticación falla repetidamente. Puedo acceder a algunos servicios, pero no a la aplicación requerida.\n\nEstos son datos demo falsos y sanitizados. No hay ServiceNow Chat, API de ServiceNow, ID de transcripción ni conversación real conectada.",
        sourceLanguage: "Español",
        draftLanguageMode: "Idioma demo principal: Español"
      }
    }
  },
  {
    id: "demo-shared-mailbox-vpn",
    scenarioId: "vpn-issue",
    receivedAt: "2026-05-18 09:30",
    sourceChannel: "Shared mailbox item",
    content: {
      "en-US": {
        requesterLabel: "Demo requester D",
        subject: "Shared mailbox item: remote access unavailable",
        bodyPreview:
          "A shared mailbox style item reports remote access is unavailable while normal internet access still works.",
        sourceBody:
          "Shared mailbox-style demo item:\n\nFrom: Demo requester D\nTo: Demo service desk\nSubject: RE: [EXTERNAL] FW: remote access unavailable\n\nBonjour support,\nL'acces a distance est indisponible apres la reinitialisation du mot de passe a 09:30. Normal internet access works, but VPN fails and MFA keeps repeating.\n\nRegards,\nDemo requester D\n\nThis is fake sanitized intake data only. No mailbox, email address, message header, attachment, .msg file, or .eml file is connected.",
        sourceLanguage: "Unsupported demo source (fr-FR)",
        draftLanguageMode: unsupportedFallbackMode
      },
      "zh-CN": {
        requesterLabel: "演示请求者 D",
        subject: "共享邮箱项目：远程访问不可用",
        bodyPreview: "共享邮箱风格项目反馈普通互联网仍可用，但远程访问不可用。",
        sourceBody:
          "共享邮箱风格演示项目：\n\n发件人：演示请求者 D\n收件人：演示服务台\n主题：RE: [EXTERNAL] FW: 远程访问不可用\n\nBonjour support,\nL'acces a distance est indisponible apres la reinitialisation du mot de passe a 09:30. 普通互联网可用，但 VPN 失败且 MFA 反复出现。\n\n此致，\n演示请求者 D\n\n这只是假的脱敏受理数据。未连接邮箱、电子邮件地址、邮件头、附件、.msg 文件或 .eml 文件。",
        sourceLanguage: "不支持的演示来源 (fr-FR)",
        draftLanguageMode: unsupportedFallbackMode
      },
      "zh-TW": {
        requesterLabel: "示範請求者 D",
        subject: "共用信箱項目：遠端存取不可用",
        bodyPreview: "共用信箱風格項目回報一般網際網路仍可使用，但遠端存取不可用。",
        sourceBody:
          "共用信箱風格示範項目：\n\n寄件者：示範請求者 D\n收件者：示範服務台\n主旨：RE: [EXTERNAL] FW: 遠端存取不可用\n\nBonjour support,\nL'acces a distance est indisponible apres la reinitialisation du mot de passe a 09:30. 一般網際網路可用，但 VPN 失敗且 MFA 反覆出現。\n\n此致，\n示範請求者 D\n\n這只是假的去識別化受理資料。未連線信箱、電子郵件地址、郵件標頭、附件、.msg 檔或 .eml 檔。",
        sourceLanguage: "不支援的示範來源 (fr-FR)",
        draftLanguageMode: unsupportedFallbackMode
      },
      "es-ES": {
        requesterLabel: "Solicitante demo D",
        subject: "Elemento de buzón compartido: acceso remoto no disponible",
        bodyPreview:
          "Un elemento estilo buzón compartido informa que el acceso remoto no está disponible mientras Internet normal funciona.",
        sourceBody:
          "Elemento demo estilo buzón compartido:\n\nDe: Solicitante demo D\nPara: Mesa de ayuda demo\nAsunto: RE: [EXTERNAL] FW: acceso remoto no disponible\n\nBonjour support,\nL'acces a distance est indisponible apres la reinitialisation du mot de passe a 09:30. El acceso normal a Internet funciona, pero la VPN falla y MFA se repite.\n\nSaludos,\nSolicitante demo D\n\nEstos son datos demo falsos y sanitizados. No hay buzón, dirección de correo, encabezado, adjunto, archivo .msg ni archivo .eml conectado.",
        sourceLanguage: "Origen demo no soportado (fr-FR)",
        draftLanguageMode: unsupportedFallbackMode
      }
    }
  }
];

export function buildDemoQueueItems(
  language: LanguageCode,
  statusById: Partial<Record<string, DemoQueueStatus>> = {}
): DemoQueueItem[] {
  return demoQueueDefinitions.map((definition) => {
    const content = definition.content[language];
    return {
      id: definition.id,
      scenarioId: definition.scenarioId,
      receivedAt: definition.receivedAt,
      sourceChannel: definition.sourceChannel,
      language,
      status: statusById[definition.id] ?? "New",
      ...content
    };
  });
}

export function App() {
  const [language, setLanguage] = useState<LanguageCode>("en-US");
  const [selectedScenarioId, setSelectedScenarioId] = useState<ManualPasteScenario["id"]>("vpn-issue");
  const [selectedQueueItemId, setSelectedQueueItemId] = useState(demoQueueDefinitions[0].id);
  const [queueStatuses, setQueueStatuses] = useState<Partial<Record<string, DemoQueueStatus>>>({});
  const queueItems = useMemo(() => buildDemoQueueItems(language, queueStatuses), [language, queueStatuses]);
  const selectedQueueItem =
    queueItems.find((item) => item.id === selectedQueueItemId) ??
    queueItems.find((item) => item.scenarioId === selectedScenarioId) ??
    queueItems[0];

  const initialDraft = useMemo(() => buildDraftForQueueItem(selectedQueueItem), [selectedQueueItem]);
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string>>({});
  const [preparedCopyDraft, setPreparedCopyDraft] = useState<PreparedCopyDraft | null>(null);
  const [fillConfirmed, setFillConfirmed] = useState(false);
  const [checkedFieldReviewItems, setCheckedFieldReviewItems] = useState<string[]>([]);
  const [selectedEnvironmentMode, setSelectedEnvironmentMode] = useState<ServiceNowEnvironmentMode>(
    getDefaultServiceNowEnvironmentMode()
  );
  const [highSeverityState, setHighSeverityState] = useState<HighSeverityState>("normal");
  const [highSeverityAcknowledged, setHighSeverityAcknowledged] = useState(false);
  const [highSeverityMuted, setHighSeverityMuted] = useState(false);
  const [selectedTemplatePresetId, setSelectedTemplatePresetId] = useState<DraftTemplatePresetId>(
    defaultDraftTemplatePreset.id
  );
  const [draftTemplateSettings, setDraftTemplateSettings] = useState<DraftTemplateSettings>({
    descriptionTemplate: defaultDraftTemplatePreset.descriptionTemplate,
    workNotesTemplate: defaultDraftTemplatePreset.workNotesTemplate
  });

  const selectedEnvironment = getServiceNowEnvironmentConfig(selectedEnvironmentMode);
  const t = uiTranslations[language];
  const templatedDraft = applyDraftTemplates(initialDraft, draftTemplateSettings);
  const draft = applyOverrides(templatedDraft, fieldOverrides);
  const context = buildContextForQueueItem(selectedQueueItem);
  const sourceCleanup = normalizeSourceContextText({
    sourceType: context.sourceType,
    rawText: context.rawText
  });

  function selectScenario(id: ManualPasteScenario["id"]) {
    const queueItem = queueItems.find((item) => item.scenarioId === id);
    if (queueItem) {
      setSelectedQueueItemId(queueItem.id);
    }
    setSelectedScenarioId(id);
    setFieldOverrides({});
    setPreparedCopyDraft(null);
    setFillConfirmed(false);
    setCheckedFieldReviewItems([]);
  }

  function selectQueueItem(itemId: string) {
    const queueItem = queueItems.find((item) => item.id === itemId);
    if (!queueItem) {
      return;
    }

    setSelectedQueueItemId(queueItem.id);
    setSelectedScenarioId(queueItem.scenarioId);
    setFieldOverrides({});
    setPreparedCopyDraft(null);
    setFillConfirmed(false);
    setCheckedFieldReviewItems([]);
    if (queueItem.status === "New") {
      updateQueueItemStatus(queueItem.id, "Reviewed");
    }
  }

  function createIncidentDraft(itemId: string) {
    const queueItem = queueItems.find((item) => item.id === itemId);
    if (!queueItem) {
      return;
    }

    setSelectedQueueItemId(queueItem.id);
    setSelectedScenarioId(queueItem.scenarioId);
    setFieldOverrides({});
    setPreparedCopyDraft(null);
    setFillConfirmed(false);
    setCheckedFieldReviewItems([]);
    updateQueueItemStatus(queueItem.id, "Drafted");
  }

  function updateQueueItemStatus(itemId: string, status: DemoQueueStatus) {
    setQueueStatuses((items) => ({ ...items, [itemId]: status }));
  }

  function changeLanguage(nextLanguage: LanguageCode) {
    setLanguage(nextLanguage);
    setFieldOverrides({});
    setPreparedCopyDraft(null);
    setFillConfirmed(false);
    setCheckedFieldReviewItems([]);
  }

  function updateField(fieldName: keyof TicketDraft, value: string) {
    setFieldOverrides((current) => ({ ...current, [fieldName]: value }));
  }

  function selectTemplatePreset(presetId: DraftTemplatePresetId) {
    const preset = draftTemplatePresets.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    setSelectedTemplatePresetId(preset.id);
    setDraftTemplateSettings({
      descriptionTemplate: preset.descriptionTemplate,
      workNotesTemplate: preset.workNotesTemplate
    });
  }

  function updateTemplateField(fieldName: keyof DraftTemplateSettings, value: string) {
    setDraftTemplateSettings((current) => ({ ...current, [fieldName]: value }));
  }

  function toggleFieldReviewItem(itemId: string) {
    setCheckedFieldReviewItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  }

  function prepareCopyDraft(label: string, text: string) {
    const preparedDraft = { confirmation: "Prepared copy text", text };
    setPreparedCopyDraft(preparedDraft);

    void copyTextToBrowserClipboard(text).then((copied) => {
      if (copied) {
        setPreparedCopyDraft({
          confirmation: label === "full safe draft as Markdown" ? "Copied demo draft" : "Copied demo text",
          text
        });
      }
    });
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <header className="app-chrome">
          <div className="safety-banner" role="status">
            {t.safetyTagline}
          </div>
          <LanguageSelector language={language} onLanguageChange={changeLanguage} t={t} />
        </header>

        <div className="content">
          <p className="eyebrow">{t.productEyebrow}</p>
          <h1 id="app-title">{t.heroTitle}</h1>
          <p className="summary">{t.heroSubtitle}</p>
        </div>

        <nav className="stage-strip" aria-label={t.workflowEyebrow}>
          <span>{t.workflowStages.queue}</span>
          <span>{t.workflowStages.sourceReview}</span>
          <span>{t.workflowStages.ticketDraft}</span>
        </nav>
      </section>

      <section className="workspace" aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">{t.workflowEyebrow}</p>
            <h2 id="workspace-title">{t.workspaceTitle}</h2>
            <p>
              {t.workspaceSubtitle} No attachments, .msg/.eml parsing, live channel content, or external AI with
              real content is used.
            </p>
            <p className="language-simulation-note">{t.languageSimulationNotice}</p>
          </div>
          <div className="mode-pill">{selectedEnvironment.label} · MockAIProvider</div>
        </header>

        <RuntimeSafetyPanel t={t} />

        <HighSeverityMonitorSimulator
          acknowledged={highSeverityAcknowledged}
          muted={highSeverityMuted}
          selectedState={highSeverityState}
          onAcknowledge={() => setHighSeverityAcknowledged(true)}
          onMute={() => setHighSeverityMuted((current) => !current)}
          onSelectedStateChange={(state) => {
            setHighSeverityState(state);
            setHighSeverityAcknowledged(false);
          }}
          t={t}
        />

        <EnvironmentModePanel
          selectedMode={selectedEnvironmentMode}
          onSelectedModeChange={setSelectedEnvironmentMode}
          t={t}
        />

        <div className="queue-review-grid">
          <DemoQueuePanel
            items={queueItems}
            selectedItemId={selectedQueueItem.id}
            onSelectItem={selectQueueItem}
            t={t}
          />
          <SourceReviewPanel
            item={selectedQueueItem}
            onCreateIncidentDraft={createIncidentDraft}
            onMarkDone={(itemId) => updateQueueItemStatus(itemId, "Done")}
            onSkip={(itemId) => updateQueueItemStatus(itemId, "Skipped")}
            t={t}
          />
        </div>

        <div className="scenario-bar" aria-label="Demo scenarios">
          {demoManualPasteScenarios.map((scenario) => (
            <button
              key={scenario.id}
              className={scenario.id === selectedScenarioId ? "scenario-button active" : "scenario-button"}
              type="button"
              onClick={() => selectScenario(scenario.id)}
            >
              {buttonLabelForScenario(scenario.id)}
            </button>
          ))}
        </div>

        <RiskControlGate fillConfirmed={fillConfirmed} onFillConfirmedChange={setFillConfirmed} />

        <div className="workspace-grid">
          <section className="panel input-panel" aria-labelledby="captured-context-title">
            <h3 id="captured-context-title">{t.capturedContextTitle}</h3>
            <dl className="meta-list">
              <div>
                <dt>Source</dt>
                <dd>{context.sourceType}</dd>
              </div>
              <div>
                <dt>Captured At</dt>
                <dd>{context.capturedAt}</dd>
              </div>
              <div>
                <dt>Profile</dt>
                <dd>{profile.displayName}</dd>
              </div>
              <div>
                <dt>Source Language</dt>
                <dd>{selectedQueueItem.sourceLanguage}</dd>
              </div>
              <div>
                <dt>Draft Language Mode</dt>
                <dd>{selectedQueueItem.draftLanguageMode}</dd>
              </div>
            </dl>
            <label className="field-block">
              <span>Raw Text</span>
              <textarea readOnly rows={8} value={context.rawText} />
            </label>
            <label className="field-block">
              <span>Cleaned / Normalized Text</span>
              <textarea readOnly rows={8} value={sourceCleanup.normalizedText} />
            </label>
          </section>

          <section className="panel draft-panel" aria-labelledby="draft-title">
            <h3 id="draft-title">{t.editableDraftTitle}</h3>
            <TemplateSettingsPanel
              selectedPresetId={selectedTemplatePresetId}
              settings={draftTemplateSettings}
              onPresetChange={selectTemplatePreset}
              onTemplateChange={updateTemplateField}
            />
            <DraftTextField label="Short Description" field={draft.shortDescription} onChange={(value) => updateField("shortDescription", value)} />
            <DraftTextField label="Description" field={draft.description} multiline onChange={(value) => updateField("description", value)} />
            <DraftTextField label="Work Notes" field={draft.workNotes} multiline onChange={(value) => updateField("workNotes", value)} />
            <DraftCopyActions
              draft={draft}
              preparedCopyDraft={preparedCopyDraft}
              onPrepareCopyDraft={prepareCopyDraft}
              t={t}
            />

            <div className="field-grid">
              <ReadOnlyField label="Category" field={draft.category} />
              <ReadOnlyField label="Subcategory" field={draft.subcategory} />
              <ReadOnlyField label="Assignment Group" field={draft.assignmentGroup} />
              <ReadOnlyField label="Priority" field={draft.priority} />
            </div>
          </section>

          <section className="panel evidence-panel" aria-labelledby="evidence-title">
            <h3 id="evidence-title">{t.kbMatchesTitle}</h3>
            <ul className="match-list">
              {draft.kbMatches.map((match) => (
                <li key={match.articleId}>
                  <strong>{match.title}</strong>
                  <span>Score {Math.round(match.score * 100)}%</span>
                  <p>{match.excerpt}</p>
                </li>
              ))}
            </ul>

            <h3>{t.missingInfoTitle}</h3>
            <ul className="compact-list">
              {draft.missingInfoQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>

            <h3>{t.riskFlagsTitle}</h3>
            <ul className="compact-list risk-list">
              {draft.riskFlags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </section>
        </div>

        <FieldReviewChecklist
          checkedItemIds={checkedFieldReviewItems}
          items={fieldReviewChecklistItems}
          onToggleItem={toggleFieldReviewItem}
          t={t}
        />

        <MockServiceNowForm draft={draft} fillConfirmed={fillConfirmed} item={selectedQueueItem} t={t} />
      </section>
    </main>
  );
}

function LanguageSelector({
  language,
  onLanguageChange,
  t
}: {
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  t: UiTranslations;
}) {
  return (
    <label className="language-switcher">
      <span>{t.languageLabel}</span>
      <select value={language} onChange={(event) => onLanguageChange(event.currentTarget.value as LanguageCode)}>
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <small>{t.languageHelper}</small>
    </label>
  );
}

function RuntimeSafetyPanel({ t }: { t: UiTranslations }) {
  return (
    <aside className="runtime-safety-panel" aria-labelledby="runtime-safety-title">
      <div>
        <p className="eyebrow">{t.runtimeEyebrow}</p>
        <h3 id="runtime-safety-title">{t.runtimeTitle}</h3>
      </div>
      <dl>
        {runtimeSafetyStatuses.map((status) => (
          <div key={status.label}>
            <dt>{status.label}</dt>
            <dd>{status.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function HighSeverityMonitorSimulator({
  acknowledged,
  muted,
  onAcknowledge,
  onMute,
  onSelectedStateChange,
  selectedState,
  t
}: {
  acknowledged: boolean;
  muted: boolean;
  onAcknowledge: () => void;
  onMute: () => void;
  onSelectedStateChange: (state: HighSeverityState) => void;
  selectedState: HighSeverityState;
  t: UiTranslations;
}) {
  const selectedFakeState = highSeveritySimulatorStates[selectedState];

  return (
    <details className="high-severity-simulator">
      <summary>
        <span>{t.highSeverityMonitor.title}</span>
        <strong className={`severity-state-pill ${selectedState}`}>{selectedFakeState.label}</strong>
      </summary>

      <div className="high-severity-body">
        <p className="simulator-safety-note">{t.highSeverityMonitor.safetyNotice}</p>

        <div className="severity-state-buttons" aria-label="Fake high severity states">
          {(Object.keys(highSeveritySimulatorStates) as HighSeverityState[]).map((state) => (
            <button
              key={state}
              className={state === selectedState ? "active" : undefined}
              type="button"
              onClick={() => onSelectedStateChange(state)}
            >
              {highSeveritySimulatorStates[state].label}
            </button>
          ))}
        </div>

        <dl className="severity-summary">
          <div>
            <dt>{t.highSeverityMonitor.stateLabel}</dt>
            <dd>{selectedFakeState.label}</dd>
          </div>
          <div>
            <dt>{t.highSeverityMonitor.countLabel}</dt>
            <dd>{selectedFakeState.fakeCount}</dd>
          </div>
          <div>
            <dt>{t.highSeverityMonitor.affectedServicesLabel}</dt>
            <dd>{selectedFakeState.affectedServices.join(", ")}</dd>
          </div>
          <div>
            <dt>{t.highSeverityMonitor.acknowledgedLabel}</dt>
            <dd>{acknowledged ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>{t.highSeverityMonitor.mutedLabel}</dt>
            <dd>{muted ? "On" : "Off"}</dd>
          </div>
        </dl>

        <div className="severity-actions" aria-label="Fake high severity alert actions">
          <button type="button" onClick={onAcknowledge}>
            {t.highSeverityMonitor.acknowledgeAction}
          </button>
          <button type="button" onClick={onMute}>
            {t.highSeverityMonitor.muteAction}
          </button>
        </div>
      </div>
    </details>
  );
}

function DemoQueuePanel({
  items,
  onSelectItem,
  selectedItemId,
  t
}: {
  items: DemoQueueItem[];
  onSelectItem: (itemId: string) => void;
  selectedItemId: string;
  t: UiTranslations;
}) {
  const sortedItems = [...items].sort((left, right) => left.receivedAt.localeCompare(right.receivedAt));

  return (
    <section className="queue-panel" aria-labelledby="demo-queue-title">
      <header>
        <p className="eyebrow">{t.queueEyebrow}</p>
        <h3 id="demo-queue-title">{t.queueTitle}</h3>
      </header>

      <div className="queue-list" role="list">
        {sortedItems.map((item) => (
          <button
            key={item.id}
            className={item.id === selectedItemId ? "queue-item selected" : "queue-item"}
            type="button"
            onClick={() => onSelectItem(item.id)}
          >
            <span className="queue-time">{item.receivedAt}</span>
            <strong>{item.subject}</strong>
            <span>{item.requesterLabel}</span>
            <span className="source-channel-badge">{item.sourceChannel}</span>
            <span className="language-mode-line">
              {item.sourceLanguage} · {item.draftLanguageMode}
            </span>
            <span className={`status-badge ${statusClassName(item.status)}`}>{item.status}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SourceReviewPanel({
  item,
  onCreateIncidentDraft,
  onMarkDone,
  onSkip,
  t
}: {
  item: DemoQueueItem;
  onCreateIncidentDraft: (itemId: string) => void;
  onMarkDone: (itemId: string) => void;
  onSkip: (itemId: string) => void;
  t: UiTranslations;
}) {
  const sourceCleanup = normalizeSourceContextText({
    sourceType: sourceTypeForQueueItem(item),
    rawText: item.sourceBody
  });

  return (
    <section className="source-review-panel" aria-labelledby="source-review-title">
      <header>
        <p className="eyebrow">{t.sourceReviewEyebrow}</p>
        <h3 id="source-review-title">{t.sourceReviewTitle}</h3>
      </header>

      <dl className="meta-list review-meta">
        <div>
          <dt>Subject</dt>
          <dd>{item.subject}</dd>
        </div>
        <div>
          <dt>Requester</dt>
          <dd>{item.requesterLabel}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>{item.receivedAt}</dd>
        </div>
        <div>
          <dt>Source Channel</dt>
          <dd>
            <span className="source-channel-badge">{item.sourceChannel}</span>
          </dd>
        </div>
        <div>
          <dt>Source Language</dt>
          <dd>{item.sourceLanguage}</dd>
        </div>
        <div>
          <dt>Draft Language Mode</dt>
          <dd>{item.draftLanguageMode}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{item.status}</dd>
        </div>
      </dl>

      <label className="field-block">
        <span>Body Preview</span>
        <textarea readOnly rows={3} value={item.bodyPreview} />
      </label>

      <label className="field-block">
        <span>Raw Sanitized Body</span>
        <textarea readOnly rows={5} value={item.sourceBody} />
      </label>

      <label className="field-block">
        <span>Cleaned / Normalized Body</span>
        <textarea readOnly rows={5} value={sourceCleanup.normalizedText} />
      </label>

      <div className="review-actions" aria-label="Source review actions">
        <button type="button" onClick={() => onCreateIncidentDraft(item.id)}>
          Create Incident Draft
        </button>
        <button type="button" onClick={() => onMarkDone(item.id)}>
          Mark as Done
        </button>
        <button type="button" onClick={() => onSkip(item.id)}>
          Skip
        </button>
      </div>
    </section>
  );
}

export function buildDraftForQueueItem(item: DemoQueueItem): TicketDraft {
  const context = buildContextForQueueItem(item);
  const sourceCleanup = normalizeSourceContextText({
    sourceType: context.sourceType,
    rawText: context.rawText
  });
  const kbMatches = searchKnowledgeArticles(sourceCleanup.normalizedText, demoKnowledgeArticles, { limit: 3 });
  const baseDraft = generateMockTicketDraft({ context, profile, kbMatches }, { idFactory: () => "desktop-demo-draft" });
  const localizedDraftText = localizedDraftTextForQueueItem(item, sourceCleanup.normalizedText, kbMatches.map((match) => match.title));

  return {
    ...baseDraft,
    shortDescription: {
      ...baseDraft.shortDescription,
      value: localizedDraftText.shortDescription,
      evidence: `Deterministic local language demo. ${item.draftLanguageMode}`
    },
    description: {
      ...baseDraft.description,
      value: localizedDraftText.description,
      evidence: `Summarized from ${item.sourceLanguage}; no external translation service.`
    },
    workNotes: {
      ...baseDraft.workNotes,
      value: localizedDraftText.workNotes,
      evidence: `Prepared locally from source language metadata: ${item.sourceLanguage}.`
    }
  };
}

function buildContextForQueueItem(item: DemoQueueItem): CapturedContext {
  return CapturedContextSchema.parse({
    id: "desktop-demo-context",
    sourceType: sourceTypeForQueueItem(item),
    capturedAt: new Date("2026-05-18T12:00:00.000Z").toISOString(),
    title: item.subject,
    rawText: item.sourceBody
  });
}

function sourceTypeForQueueItem(item: DemoQueueItem): SourceType {
  switch (item.sourceChannel) {
    case "Teams message":
      return "teams_web";
    case "Self-service ticket":
      return "servicenow_self_service";
    case "ServiceNow Chat transcript":
      return "servicenow_chat";
    case "Shared mailbox item":
      return "outlook_web";
  }
}

function localizedDraftTextForQueueItem(
  item: DemoQueueItem,
  normalizedText: string,
  kbTitles: string[]
): { shortDescription: string; description: string; workNotes: string } {
  if (item.draftLanguageMode === unsupportedFallbackMode) {
    return unsupportedFallbackDraftText(item, normalizedText);
  }

  const sourceLine = compactSourceLine(normalizedText);
  const kbLine = kbTitles.length > 0 ? kbTitles.join("; ") : "No KB match selected yet";

  if (item.sourceChannel === "Self-service ticket") {
    switch (item.language) {
      case "zh-CN":
        return {
          shortDescription: "Windows 笔记本更新后性能下降",
          description: `自助服务来源语言驱动 Description / Work Notes。本地演示草稿根据简体中文门户描述生成：${sourceLine}`,
          workNotes: `自助服务来源语言驱动 Description / Work Notes。初步排查：确认变慢开始时间、重启结果、是否影响整机或单一应用。相关 KB：${kbLine}。`
        };
      case "zh-TW":
        return {
          shortDescription: "Windows 筆電更新後效能下降",
          description: `自助服務來源語言驅動 Description / Work Notes。本地示範草稿依台灣繁體中文入口網站描述生成：${sourceLine}`,
          workNotes: `自助服務來源語言驅動 Description / Work Notes。初步排查：確認變慢開始時間、重新啟動結果、是否影響整台裝置或單一應用程式。相關 KB：${kbLine}。`
        };
      case "es-ES":
        return {
          shortDescription: "Portatil Windows lento tras actualizacion",
          description: `El idioma de origen de autoservicio guia Description / Work Notes. Borrador demo local generado desde la descripcion del portal en espanol: ${sourceLine}`,
          workNotes: `El idioma de origen de autoservicio guia Description / Work Notes. Triaje inicial: confirmar cuando inicio la lentitud, resultado del reinicio y si afecta al equipo o a una app. KB relevante: ${kbLine}.`
        };
      case "en-US":
        return {
          shortDescription: "Windows endpoint performance issue after update",
          description: `Self-service source language drives Description / Work Notes. Local demo draft generated from the English portal description: ${sourceLine}`,
          workNotes: `Self-service source language drives Description / Work Notes. Initial triage: confirm when slowness started, reboot result, and whether it affects the whole device or one app. Relevant KB: ${kbLine}.`
        };
    }
  }

  switch (item.language) {
    case "zh-CN":
      if (item.scenarioId === "account-login-issue") {
        return {
          shortDescription: "密码变更后账号登录异常",
          description: `用户反馈密码变更后无法登录。捕获的本地演示上下文：${sourceLine}`,
          workNotes: `初步排查：确认是否为密码、MFA、账号锁定或应用访问拒绝问题；不要询问密码。相关 KB：${kbLine}。`
        };
      }
      return {
        shortDescription: "密码或 MFA 变更后 VPN 连接异常",
        description: `用户反馈 VPN 连接问题。捕获的本地演示上下文：${sourceLine}`,
        workNotes: `初步排查：确认不连 VPN 时互联网是否可用、最近是否修改密码/MFA、VPN 客户端错误信息和失败时间。相关 KB：${kbLine}。`
      };
    case "zh-TW":
      if (item.scenarioId === "account-login-issue") {
        return {
          shortDescription: "密碼變更後帳號登入異常",
          description: `使用者回報密碼變更後無法登入。擷取的本地示範內容：${sourceLine}`,
          workNotes: `初步排查：確認是否為密碼、MFA、帳號鎖定或應用程式存取被拒；不要詢問密碼。相關 KB：${kbLine}。`
        };
      }
      return {
        shortDescription: "密碼或 MFA 變更後 VPN 連線異常",
        description: `使用者回報 VPN 連線問題。擷取的本地示範內容：${sourceLine}`,
        workNotes: `初步排查：確認未連 VPN 時網際網路是否可用、最近是否變更密碼/MFA、VPN 用戶端錯誤訊息與失敗時間。相關 KB：${kbLine}。`
      };
    case "es-ES":
      if (item.scenarioId === "account-login-issue") {
        return {
          shortDescription: "Problema de inicio de sesion tras cambiar contrasena",
          description: `El usuario informa un problema de cuenta o inicio de sesion. Contexto demo local capturado: ${sourceLine}`,
          workNotes: `Triaje inicial: confirmar si el problema es contrasena, MFA, bloqueo de cuenta o acceso denegado a la aplicacion. No solicitar contrasena. KB relevante: ${kbLine}.`
        };
      }
      return {
        shortDescription: "Problema de conexion VPN tras cambio de contrasena o MFA",
        description: `El usuario informa un problema de conectividad VPN. Contexto demo local capturado: ${sourceLine}`,
        workNotes: `Triaje inicial: confirmar Internet sin VPN, cambio reciente de contrasena/MFA, mensaje de error del cliente VPN y hora de falla. KB relevante: ${kbLine}.`
      };
    case "en-US":
      if (item.scenarioId === "account-login-issue") {
        return {
          shortDescription: "Account/login issue requiring access troubleshooting",
          description: `User reports an account or login issue. Local demo context: ${sourceLine}`,
          workNotes: `Initial triage: confirm whether issue is password, MFA, account lock, or application access denied. Do not request password. Relevant KB: ${kbLine}.`
        };
      }
      return {
        shortDescription: "VPN connection issue after password or MFA change",
        description: `User reports a VPN connectivity problem. Local demo context: ${sourceLine}`,
        workNotes: `Initial triage: confirm internet without VPN, recent password/MFA change, VPN client error message, and failure time. Relevant KB: ${kbLine}.`
      };
  }
}

function unsupportedFallbackDraftText(
  item: DemoQueueItem,
  normalizedText: string
): { shortDescription: string; description: string; workNotes: string } {
  const sourceLine = compactSourceLine(normalizedText);
  const englishSummary = "English helper summary: remote access is unavailable after a password reset; VPN fails while normal internet access still works.";

  switch (item.language) {
    case "zh-CN":
      return {
        shortDescription: "远程访问不可用（不支持来源语言双语回退）",
        description: `${unsupportedFallbackMode}\n来源语言片段：${sourceLine}\n${englishSummary}`,
        workNotes: `${unsupportedFallbackMode}\n本地演示排查：保留来源语言片段，并附英文摘要供人工审核。不得调用外部翻译服务。`
      };
    case "zh-TW":
      return {
        shortDescription: "遠端存取不可用（不支援來源語言雙語回退）",
        description: `${unsupportedFallbackMode}\n來源語言片段：${sourceLine}\n${englishSummary}`,
        workNotes: `${unsupportedFallbackMode}\n本地示範排查：保留來源語言片段，並附英文摘要供人工審核。不得呼叫外部翻譯服務。`
      };
    case "es-ES":
      return {
        shortDescription: "Acceso remoto no disponible (respaldo bilingue por idioma no soportado)",
        description: `${unsupportedFallbackMode}\nFragmento del idioma de origen: ${sourceLine}\n${englishSummary}`,
        workNotes: `${unsupportedFallbackMode}\nTriaje demo local: conservar el fragmento del idioma de origen y agregar resumen en ingles para revision humana. No llamar servicios externos de traduccion.`
      };
    case "en-US":
      return {
        shortDescription: "Remote access unavailable (unsupported source language bilingual fallback)",
        description: `${unsupportedFallbackMode}\nSource-language excerpt: ${sourceLine}\n${englishSummary}`,
        workNotes: `${unsupportedFallbackMode}\nLocal demo triage: preserve the source-language excerpt and add an English summary for human review. Do not call external translation services.`
      };
  }
}

function compactSourceLine(text: string): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length <= 220 ? singleLine : `${singleLine.slice(0, 217).trim()}...`;
}

function applyOverrides(draft: TicketDraft, overrides: Record<string, string>): TicketDraft {
  return {
    ...draft,
    shortDescription: applyFieldOverride(draft.shortDescription, overrides.shortDescription),
    description: applyFieldOverride(draft.description, overrides.description),
    workNotes: applyFieldOverride(draft.workNotes, overrides.workNotes)
  };
}

export function applyDraftTemplates(draft: TicketDraft, settings: DraftTemplateSettings): TicketDraft {
  return {
    ...draft,
    description: {
      ...draft.description,
      value: applyTemplateText(settings.descriptionTemplate, draft.description.value),
      evidence: `${draft.description.evidence ?? "Generated locally."} Team template applied locally.`
    },
    workNotes: {
      ...draft.workNotes,
      value: applyTemplateText(settings.workNotesTemplate, draft.workNotes.value),
      evidence: `${draft.workNotes.evidence ?? "Generated locally."} Team template applied locally.`
    }
  };
}

function applyTemplateText(template: string, sourceDraftContent: string): string {
  const normalizedTemplate = template.trim();
  if (!normalizedTemplate) {
    return sourceDraftContent;
  }

  if (normalizedTemplate.includes("{{draft_content}}")) {
    return normalizedTemplate.replaceAll("{{draft_content}}", sourceDraftContent);
  }

  return [normalizedTemplate, "", "Source draft content", sourceDraftContent].join("\n");
}

function applyFieldOverride(field: FieldDraft, value: string | undefined): FieldDraft {
  return value === undefined ? field : { ...field, value };
}

function TemplateSettingsPanel({
  onPresetChange,
  onTemplateChange,
  selectedPresetId,
  settings
}: {
  onPresetChange: (presetId: DraftTemplatePresetId) => void;
  onTemplateChange: (fieldName: keyof DraftTemplateSettings, value: string) => void;
  selectedPresetId: DraftTemplatePresetId;
  settings: DraftTemplateSettings;
}) {
  return (
    <details className="template-settings-panel">
      <summary>
        <span>Templates / Settings</span>
        <strong>{draftTemplatePresets.find((preset) => preset.id === selectedPresetId)?.label}</strong>
      </summary>

      <div className="template-settings-body">
        <p className="template-safety-copy">
          Local demo templates only — no external storage or ServiceNow write.
        </p>

        <div className="field-block template-preset-field">
          <span>Template preset</span>
          <div className="template-preset-buttons" aria-label="Template presets">
            {draftTemplatePresets.map((preset) => (
              <button
                key={preset.id}
                className={preset.id === selectedPresetId ? "active" : undefined}
                type="button"
                onClick={() => onPresetChange(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <small>Switching presets replaces both local template text areas.</small>
        </div>

        <div className="template-editor-grid">
          <label className="field-block">
            <span>Description template</span>
            <textarea
              rows={6}
              value={settings.descriptionTemplate}
              onChange={(event) => onTemplateChange("descriptionTemplate", event.currentTarget.value)}
            />
            <small>{"Use {{draft_content}} to place the generated language-aware Description."}</small>
          </label>

          <label className="field-block">
            <span>Work Notes template</span>
            <textarea
              rows={6}
              value={settings.workNotesTemplate}
              onChange={(event) => onTemplateChange("workNotesTemplate", event.currentTarget.value)}
            />
            <small>{"Use {{draft_content}} to place the generated language-aware Work Notes."}</small>
          </label>
        </div>
      </div>
    </details>
  );
}

function DraftCopyActions({
  draft,
  onPrepareCopyDraft,
  preparedCopyDraft,
  t
}: {
  draft: TicketDraft;
  onPrepareCopyDraft: (label: string, text: string) => void;
  preparedCopyDraft: PreparedCopyDraft | null;
  t: UiTranslations;
}) {
  const safeMarkdownDraft = buildSafeDraftMarkdown(draft);
  const fallbackText = preparedCopyDraft?.text ?? safeMarkdownDraft;

  return (
    <section className="draft-copy-actions" aria-labelledby="draft-copy-actions-title">
      <div className="draft-copy-header">
        <div>
          <p className="eyebrow">{t.copyEyebrow}</p>
          <h3 id="draft-copy-actions-title">{t.copyTitle}</h3>
        </div>
        <span role="status">{preparedCopyDraft?.confirmation ?? "Prepared copy text preview"}</span>
      </div>

      <div className="draft-copy-button-grid" aria-label="Copy safe draft fields">
        <button
          type="button"
          onClick={() => onPrepareCopyDraft("short description", draft.shortDescription.value)}
        >
          Copy Short Description
        </button>
        <button type="button" onClick={() => onPrepareCopyDraft("description", draft.description.value)}>
          Copy Description
        </button>
        <button type="button" onClick={() => onPrepareCopyDraft("work notes", draft.workNotes.value)}>
          Copy Work Notes
        </button>
        <button type="button" onClick={() => onPrepareCopyDraft("full safe draft as Markdown", safeMarkdownDraft)}>
          Copy full safe draft as Markdown
        </button>
      </div>

      <label className="field-block draft-copy-preview">
        <span>Fallback copy preview</span>
        <textarea readOnly rows={8} value={fallbackText} />
        <small>
          Browser clipboard is used only when available. This local preview remains available for manual copy in SSR,
          locked-down browsers, or clipboard-denied sessions.
        </small>
      </label>
    </section>
  );
}

async function copyTextToBrowserClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function buildSafeDraftMarkdown(draft: TicketDraft): string {
  return [
    "# Safe Demo Incident Draft",
    "",
    "> Safety note: fake/sanitized demo draft only. Local copy/export only; no network, file upload, real email send, ServiceNow write, API call, external AI with real content, or real ticket number is included.",
    "",
    "## Short Description",
    draft.shortDescription.value,
    "",
    "## Description",
    draft.description.value,
    "",
    "## Work Notes",
    draft.workNotes.value,
    "",
    "## Routing Fields",
    `- Category: ${fieldValue(draft.category)}`,
    `- Subcategory: ${fieldValue(draft.subcategory)}`,
    `- Assignment Group: ${fieldValue(draft.assignmentGroup)}`,
    `- Impact: ${fieldValue(draft.impact)}`,
    `- Urgency: ${fieldValue(draft.urgency)}`,
    `- Priority: ${fieldValue(draft.priority)}`,
    "",
    "## Safety Boundary",
    "- Demo-only local text prepared for manual review.",
    "- No real ServiceNow record is created, changed, submitted, updated, saved, or closed.",
    "- No real requester identity, ticket number, mailbox, chat, portal, attachment, or production content is included."
  ].join("\n");
}


function EnvironmentModePanel({
  onSelectedModeChange,
  selectedMode,
  t
}: {
  onSelectedModeChange: (mode: ServiceNowEnvironmentMode) => void;
  selectedMode: ServiceNowEnvironmentMode;
  t: UiTranslations;
}) {
  const selectedEnvironment = getServiceNowEnvironmentConfig(selectedMode);

  return (
    <section className="environment-panel" aria-labelledby="environment-title">
      <header className="environment-header">
        <div>
          <p className="eyebrow">{t.environmentEyebrow}</p>
          <h3 id="environment-title">{t.environmentTitle}</h3>
          <p>
            Start in mock mode, move to QA/dev only after review, and keep production validation shadow-only by default unless a separate safety review changes that boundary.
          </p>
        </div>
        <div className="environment-current">
          <span>Current mode</span>
          <strong>{selectedEnvironment.label}</strong>
        </div>
      </header>

      <div className="environment-selector" aria-label="ServiceNow environment modes">
        {serviceNowEnvironmentConfigs.map((config) => (
          <button
            key={config.mode}
            className={config.mode === selectedMode ? "environment-button active" : "environment-button"}
            type="button"
            onClick={() => onSelectedModeChange(config.mode)}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="environment-grid">
        {serviceNowEnvironmentConfigs.map((config) => (
          <EnvironmentCard config={config} key={config.mode} selected={config.mode === selectedMode} />
        ))}
      </div>
    </section>
  );
}

function EnvironmentCard({ config, selected }: { config: ServiceNowEnvironmentConfig; selected: boolean }) {
  const safetyLabel = getEnvironmentSafetyLabel(config);

  return (
    <article className={selected ? "environment-card selected" : "environment-card"}>
      <div className="environment-card-title-row">
        <h4>{config.label}</h4>
        <span>{safetyLabel}</span>
        {selected ? <span>Selected</span> : null}
      </div>
      <p>{config.description}</p>
      {config.url ? (
        <div className="environment-target-safety">
          <code>Full ServiceNow URL hidden for privacy</code>
          <small>No raw clickable QA/dev link. Controlled browser launch requires URL allowlist and #22 RealActionGate.</small>
        </div>
      ) : (
        <code>No target URL configured</code>
      )}
      <dl>
        <div>
          <dt>Credential policy</dt>
          <dd>
            <code>{config.credentialPolicy}</code>
            {config.credentialPolicy === "manual-login-only" ? " · Manual login required" : " · No credentials required"}
          </dd>
        </div>
        <div>
          <dt>Ignored local runtime path</dt>
          <dd>{config.localRuntimeDirectory}</dd>
        </div>
        <div>
          <dt>Submit policy</dt>
          <dd>
            {config.allowsRealSubmit
              ? "Explicit approval required before real QA/dev submit"
              : "No real submit from this mode"}
          </dd>
        </div>
      </dl>
      <ul>
        {config.safetyNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </article>
  );
}

function getEnvironmentSafetyLabel(config: ServiceNowEnvironmentConfig): string {
  switch (config.mode) {
    case "mock":
      return "MOCK — Safe demo";
    case "qa":
      return "QA — No write until #22";
    case "dev":
      return "DEV — No write until #22";
    case "production-shadow":
      return "NO SUBMIT · NO UPDATE · NO CLOSE";
    default:
      return config.shadowOnly ? "Shadow-only" : "Requires review";
  }
}

function DraftTextField({
  field,
  label,
  multiline = false,
  onChange
}: {
  field: FieldDraft;
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field-block">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={5} value={field.value} onChange={(event) => onChange(event.currentTarget.value)} />
      ) : (
        <input value={field.value} onChange={(event) => onChange(event.currentTarget.value)} />
      )}
      <small>
        Confidence {Math.round(field.confidence * 100)}% · {field.evidence}
      </small>
    </label>
  );
}

function ReadOnlyField({ field, label }: { field?: FieldDraft; label: string }) {
  return (
    <div className="readonly-field">
      <span>{label}</span>
      <strong>{field?.value ?? "Not set"}</strong>
      {field?.evidence ? <small>{field.evidence}</small> : null}
    </div>
  );
}


function RiskControlGate({
  fillConfirmed,
  onFillConfirmedChange
}: {
  fillConfirmed: boolean;
  onFillConfirmedChange: (value: boolean) => void;
}) {
  return (
    <section className="risk-control-gate" aria-labelledby="risk-control-title">
      <div>
        <p className="eyebrow">Risk Control Gate</p>
        <h3 id="risk-control-title">Automate drafting, not accountability.</h3>
        <p>The app does not submit, close, or update real tickets automatically.</p>
      </div>
      <ul>
        <li>Confirm human review before fill</li>
        <li>Fill action locked until review confirmation</li>
        <li>Final submit is always manual.</li>
      </ul>
      <label className="review-confirmation">
        <input
          checked={fillConfirmed}
          type="checkbox"
          onChange={(event) => onFillConfirmedChange(event.currentTarget.checked)}
        />
        <span>Confirm human review before fill</span>
      </label>
    </section>
  );
}

function FieldReviewChecklist({
  checkedItemIds,
  items,
  onToggleItem,
  t
}: {
  checkedItemIds: string[];
  items: FieldReviewChecklistItem[];
  onToggleItem: (itemId: string) => void;
  t: UiTranslations;
}) {
  return (
    <section className="field-review-checklist" aria-labelledby="field-review-title">
      <header className="field-review-header">
        <div>
          <p className="eyebrow">{t.checklistEyebrow}</p>
          <h2 id="field-review-title">{t.checklistTitle}</h2>
          <p>
            Ticket quality depends on field order and dependencies, not text generation alone. Review requester,
            location, channel, category, affected service, impact, urgency, priority, assignment, comments, and work
            notes before any mock fill/copy.
          </p>
        </div>
        <div className="field-review-progress" aria-label="Field review progress">
          <strong>
            {checkedItemIds.length}/{items.length}
          </strong>
          <span>reviewed locally</span>
        </div>
      </header>

      <div className="field-reference-strip" aria-label="Sanitized ServiceNow create form reference">
        <div>
          <span>Required/starred reference</span>
          <p>Requester, Category, Location, Channel, Impact, Urgency, Assignment group, Short description</p>
        </div>
        <div>
          <span>Supporting fields</span>
          <p>
            Description, Subcategory, Configuration item, Business service, Service offering, Priority, Assigned to,
            Additional comments, Work notes, Related Search / Knowledge & Catalog
          </p>
        </div>
      </div>

      <ol className="field-review-list">
        {items.map((item, index) => (
          <li key={item.id}>
            <label>
              <span className="field-review-number">{index + 1}</span>
              <input
                checked={checkedItemIds.includes(item.id)}
                type="checkbox"
                onChange={() => onToggleItem(item.id)}
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ol>

      <p className="field-review-safety">
        Demo checklist only. Local state only. No real ServiceNow field fill, Save, Submit, Update, Close, API call,
        browser automation, DOM inspection, screenshots, HAR, traces, sessions, or storage export.
      </p>
    </section>
  );
}

function MockServiceNowForm({
  draft,
  fillConfirmed,
  item,
  t
}: {
  draft: TicketDraft;
  fillConfirmed: boolean;
  item: DemoQueueItem;
  t: UiTranslations;
}) {
  return (
    <section className="mock-form-panel" aria-labelledby="mock-form-title">
      <header className="mock-form-header">
        <div>
          <p className="eyebrow">{t.mockEyebrow}</p>
          <h2 id="mock-form-title">{t.mockTitle}</h2>
          <p>{t.mockSubtitle}</p>
        </div>
        <button className="fill-button" disabled={!fillConfirmed} type="button">
          {t.mockFillButton}
        </button>
      </header>

      <div className="servicenow-frame" aria-label="Mock ServiceNow Incident new record form fields">
        <div className="servicenow-toolbar">
          <div>
            <strong>Incident | New record — Mock preview</strong>
            <small>{t.mockDemoStamp}</small>
          </div>
          <span>{fillConfirmed ? t.mockReadyStatus : t.mockLockedStatus}</span>
          <span>{t.mockDisabledStatus}</span>
        </div>

        <div className="servicenow-actionbar" aria-label="Disabled mock ServiceNow actions">
          {["Save", "Submit", "Update", "Close"].map((action) => (
            <button disabled key={action} type="button">
              {action}
            </button>
          ))}
          <span>Disabled / unavailable in demo mode</span>
        </div>

        <div className="servicenow-tabs" aria-label="Mock ServiceNow form sections">
          <span className="active">Details</span>
          <span>Notes</span>
          <span>Related Search (mock only)</span>
        </div>

        <div className="mock-form-grid">
          <MockFormField label="Requester" required value={item.requesterLabel} />
          <MockFormField label="Category" required value={draft.category?.value ?? "Not set"} />
          <MockFormField label="Location" required value="Demo location / sanitized" />
          <MockFormField label="Channel" required value={item.sourceChannel} />
          <MockFormField label="Impact" required value={fieldValue(draft.impact)} />
          <MockFormField label="Urgency" required value={fieldValue(draft.urgency)} />
          <MockFormField label="Assignment group" required value={fieldValue(draft.assignmentGroup)} />
          <MockFormField label="Priority" value={fieldValue(draft.priority)} />
        </div>

        <MockFormField label="Short description" required value={draft.shortDescription.value} wide />
        <MockFormField label="Description" value={draft.description.value} wide multiline />
        <MockFormField label="Work notes" value={draft.workNotes.value} wide multiline />

        <div className="mock-submit-row">
          <button disabled type="button">
            Submit disabled in demo mode
          </button>
          <span>
            Final ServiceNow submit must remain a deliberate human action. No real record is saved, submitted,
            updated, or closed.
          </span>
        </div>
      </div>
    </section>
  );
}

function MockFormField({
  label,
  multiline = false,
  required = false,
  value,
  wide = false
}: {
  label: string;
  multiline?: boolean;
  required?: boolean;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "mock-form-field wide" : "mock-form-field"}>
      <span>
        {required ? (
          <b aria-hidden="true" className="required-star">
            *
          </b>
        ) : null}
        {label}
      </span>
      {multiline ? <textarea readOnly rows={4} value={value} /> : <input readOnly value={value} />}
    </label>
  );
}

function fieldValue(field: FieldDraft | undefined): string {
  return field?.value ?? "Not set";
}

function statusClassName(status: DemoQueueStatus): string {
  return status.toLowerCase();
}

function buttonLabelForScenario(id: ManualPasteScenario["id"]): string {
  switch (id) {
    case "vpn-issue":
      return "Load VPN Demo";
    case "windows-issue":
      return "Load Windows Demo";
    case "account-login-issue":
      return "Load Account/Login Demo";
  }
}
