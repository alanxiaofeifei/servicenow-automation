import { type CSSProperties, type WheelEvent, useEffect, useMemo, useState } from "react";

import { demoManualPasteScenarios, type ManualPasteScenario } from "@servicenow-automation/adapters/browser";
import { generateMockTicketDraft } from "@servicenow-automation/ai";
import { demoKnowledgeArticles, searchKnowledgeArticles } from "@servicenow-automation/kb/browser";
import {
  getDefaultServiceNowEnvironmentMode,
  getServiceNowEnvironmentConfig,
  loadDemoYageoProfile,
  serviceNowEnvironmentConfigs,
  validateServiceNowEnvironmentUrlSetting,
  validateServiceNowTargetUrl,
  type ServiceNowEnvironmentConfig,
  type ServiceNowEnvironmentMode,
  type ServiceNowEnvironmentUrlOverrides
} from "@servicenow-automation/profiles";
import {
  CapturedContextSchema,
  buildExcelDryRunWorkbookArtifact,
  buildQaTextFieldAutofillPlan,
  buildServiceDeskWorkflowPreview,
  evaluateQaSingleTicketSmokePlan,
  getRequiredQaAutofillApprovalPhrase,
  normalizeSourceContextText,
  type CapturedContext,
  type ExcelDryRunWorkbookArtifact,
  type FieldDraft,
  type QaAutofillPlan,
  type QaIncidentDefaultScenario,
  type QaManualFillWriteAction,
  type QaSingleTicketSmokePlan,
  type ServiceDeskWorkflowPreview,
  type SourceType,
  type TicketDraft
} from "@servicenow-automation/core";

const profile = loadDemoYageoProfile();

type DemoQueueStatus = "New" | "Reviewed" | "Drafted" | "Done" | "Skipped";

export type HighSeverityState = "normal" | "p2" | "p1";
export type HighSeverityMonitorGroup =
  | "demo-service-desk"
  | "demo-identity-access"
  | "demo-network-operations"
  | "demo-employee-portal";

type DisplayTheme = "warm" | "cool";

type TextFieldDisplayMode = "auto-fit" | "compact-resize";

type SourceChannel =
  | "Teams message"
  | "Self-service ticket"
  | "ServiceNow Chat transcript"
  | "Shared mailbox item"
  | "Phone call";

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

type FieldReviewChecklistItemId =
  | "source-channel-reviewed"
  | "requester-identified"
  | "location-checked"
  | "channel-selected"
  | "short-description-reviewed"
  | "description-reviewed"
  | "category-selected"
  | "subcategory-selected-if-needed"
  | "ci-affected-service-checked"
  | "impact-checked"
  | "urgency-checked"
  | "priority-reviewed-derived"
  | "assignment-group-reviewed"
  | "work-notes-prepared"
  | "comments-separated"
  | "human-confirmation-before-mock-fill";

type FieldReviewChecklistItem = {
  id: FieldReviewChecklistItemId;
  label: string;
};

type PreparedCopyDraft = {
  confirmation: string;
  text: string;
};

type OperatorRuntimeRequest = {
  mode: ServiceNowEnvironmentMode;
  targetUrl?: string;
  cdpEndpoint?: string;
  draft?: TicketDraft;
  scenario?: QaIncidentDefaultScenario;
  routeOutAssignmentGroup?: string;
};

type OperatorRuntimeResponse = {
  ok?: boolean;
  launch?: {
    status?: string;
    blockedReason?: string;
    cdpEndpoint?: string;
    safety?: { browserProcessLaunched?: boolean; cdpEndpointReady?: boolean; noWriteMode?: boolean };
  };
  fieldInspection?: {
    status?: string;
    blockedReason?: string;
    pageFingerprint?: string;
    fields?: Array<{ name?: string; label?: string; type?: string; required?: boolean; writable?: boolean }>;
  };
  defaultPlan?: {
    status?: string;
    blockedReason?: string;
    plannedFields?: Array<{ key?: string; label?: string; value?: string; valueLength?: number }>;
  };
  runtime?: {
    status?: string;
    blockedReason?: string;
    pageFingerprint?: string;
    pageFingerprintMatched?: boolean;
    filledFields?: Array<{ key?: string; label?: string; valueLength?: number }>;
  };
};

type SdaOperatorApi = {
  launchQaBrowser(request: OperatorRuntimeRequest): Promise<OperatorRuntimeResponse>;
  verifyCurrentIncident(request: OperatorRuntimeRequest): Promise<OperatorRuntimeResponse>;
  autofillCurrentIncidentDefaults(request: OperatorRuntimeRequest): Promise<OperatorRuntimeResponse>;
};

type OperatorActionStatus = {
  label: string;
  tone: "idle" | "working" | "success" | "blocked";
  details: string;
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
    monitorGroupLabel: string;
    alertStatusLabel: string;
    alertEnabledStatus: string;
    alertSuppressedStatus: string;
    alertInactiveStatus: string;
    monitoredGroupsTitle: string;
    monitoredGroupsHelper: string;
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
  checklistSummaryLabel: string;
  checklistProgressAria: string;
  checklistReviewedLocally: string;
  checklistIntroRequired: string;
  checklistIntroQuality: string;
  checklistReferenceAria: string;
  checklistRequiredReferenceLabel: string;
  checklistRequiredReferenceFields: string;
  checklistSupportingFieldsLabel: string;
  checklistSupportingFields: string;
  checklistSafetyCopy: string;
  checklistItemLabels: Record<FieldReviewChecklistItemId, string>;
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

const englishFieldReviewChecklistTranslations = {
  checklistSummaryLabel: "⚙ Optional field checklist / Team rules",
  checklistProgressAria: "Field review progress",
  checklistReviewedLocally: "reviewed locally",
  checklistIntroRequired:
    "ServiceNow already enforces starred required fields at submit time. This local checklist is optional and customizable for team process, field order, and draft quality before any mock fill/copy.",
  checklistIntroQuality:
    "Ticket quality depends on field order and dependencies, not text generation alone. Review requester, location, channel, category, affected service, impact, urgency, priority, assignment, comments, and work notes before any mock fill/copy.",
  checklistReferenceAria: "Sanitized ServiceNow create form reference",
  checklistRequiredReferenceLabel: "Required/starred reference",
  checklistRequiredReferenceFields: "Requester, Category, Location, Channel, Impact, Urgency, Assignment group, Short description",
  checklistSupportingFieldsLabel: "Supporting fields",
  checklistSupportingFields:
    "Description, Subcategory, Configuration item, Business service, Service offering, Priority, Assigned to, Additional comments, Work notes, Related Search / Knowledge & Catalog",
  checklistSafetyCopy:
    "Demo checklist only. Local state only. No real ServiceNow field fill, Save, Submit, Update, Close, API call, browser automation, DOM inspection, screenshots, HAR, traces, sessions, or storage export.",
  checklistItemLabels: {
    "source-channel-reviewed": "Source channel reviewed",
    "requester-identified": "Requester identified",
    "location-checked": "Location checked",
    "channel-selected": "Channel selected",
    "short-description-reviewed": "Short description generated/reviewed",
    "description-reviewed": "Description generated/reviewed",
    "category-selected": "Category selected",
    "subcategory-selected-if-needed": "Subcategory selected if needed",
    "ci-affected-service-checked": "Configuration item / affected service checked",
    "impact-checked": "Impact checked",
    "urgency-checked": "Urgency checked",
    "priority-reviewed-derived": "Priority reviewed as derived value",
    "assignment-group-reviewed": "Assignment group suggested/reviewed",
    "work-notes-prepared": "Work notes prepared",
    "comments-separated": "Customer-visible comments separated from internal Work Notes",
    "human-confirmation-before-mock-fill": "Human confirmation before any mock fill/copy"
  }
};

const zhCnFieldReviewChecklistTranslations = {
  checklistSummaryLabel: "⚙ 可选字段检查清单 / 团队规则",
  checklistProgressAria: "字段审核进度",
  checklistReviewedLocally: "已本地审核",
  checklistIntroRequired:
    "ServiceNow 会在提交时强制检查带星号的必填字段。这个本地清单是可选项，可按团队流程、字段顺序和草稿质量要求自定义，并用于任何 mock 填充/复制前的检查。",
  checklistIntroQuality:
    "工单质量不仅取决于文本生成，还取决于字段顺序和依赖关系。在任何 mock 填充/复制前，请审核请求者、地点、渠道、类别、受影响服务、影响、紧急度、优先级、分配、评论和工作备注。",
  checklistReferenceAria: "脱敏的 ServiceNow 新建表单参考",
  checklistRequiredReferenceLabel: "必填/星号字段参考",
  checklistRequiredReferenceFields: "请求者、类别、地点、渠道、影响、紧急度、分配组、短描述",
  checklistSupportingFieldsLabel: "辅助字段",
  checklistSupportingFields:
    "描述、子类别、配置项、业务服务、服务项、优先级、指派给、附加评论、工作备注、相关搜索 / 知识库与目录",
  checklistSafetyCopy:
    "仅演示检查清单。仅本地状态。不会执行真实 ServiceNow 字段填充、Save、Submit、Update、Close、API 调用、浏览器自动化、DOM 检查、截图、HAR、trace、session 或 storage 导出。",
  checklistItemLabels: {
    "source-channel-reviewed": "来源渠道已审核",
    "requester-identified": "请求者已识别",
    "location-checked": "地点已检查",
    "channel-selected": "渠道已选择",
    "short-description-reviewed": "短描述已生成/审核",
    "description-reviewed": "描述已生成/审核",
    "category-selected": "类别已选择",
    "subcategory-selected-if-needed": "需要时已选择子类别",
    "ci-affected-service-checked": "配置项 / 受影响服务已检查",
    "impact-checked": "影响已检查",
    "urgency-checked": "紧急度已检查",
    "priority-reviewed-derived": "优先级作为派生值已审核",
    "assignment-group-reviewed": "分配组建议已审核",
    "work-notes-prepared": "工作备注已准备",
    "comments-separated": "面向客户的评论已与内部工作备注分开",
    "human-confirmation-before-mock-fill": "任何 mock 填充/复制前已获得人工确认"
  }
};

const zhTwFieldReviewChecklistTranslations = {
  checklistSummaryLabel: "⚙ 可選欄位檢查清單 / 團隊規則",
  checklistProgressAria: "欄位審核進度",
  checklistReviewedLocally: "已本地審核",
  checklistIntroRequired:
    "ServiceNow 會在提交時強制檢查帶星號的必填欄位。此本地清單是可選項，可依團隊流程、欄位順序與草稿品質要求自訂，並用於任何 mock 填入/複製前的檢查。",
  checklistIntroQuality:
    "工單品質不只取決於文字產生，也取決於欄位順序與相依關係。在任何 mock 填入/複製前，請審核請求者、地點、管道、類別、受影響服務、影響、緊急度、優先順序、指派、留言與工作備註。",
  checklistReferenceAria: "去識別化的 ServiceNow 新增表單參考",
  checklistRequiredReferenceLabel: "必填/星號欄位參考",
  checklistRequiredReferenceFields: "請求者、類別、地點、管道、影響、緊急度、指派群組、短描述",
  checklistSupportingFieldsLabel: "輔助欄位",
  checklistSupportingFields:
    "描述、子類別、設定項目、業務服務、服務項目、優先順序、指派給、附加留言、工作備註、相關搜尋 / 知識庫與目錄",
  checklistSafetyCopy:
    "僅示範檢查清單。僅本地狀態。不會執行真實 ServiceNow 欄位填入、Save、Submit、Update、Close、API 呼叫、瀏覽器自動化、DOM 檢查、截圖、HAR、trace、session 或 storage 匯出。",
  checklistItemLabels: {
    "source-channel-reviewed": "來源管道已審核",
    "requester-identified": "請求者已識別",
    "location-checked": "地點已檢查",
    "channel-selected": "管道已選擇",
    "short-description-reviewed": "短描述已產生/審核",
    "description-reviewed": "描述已產生/審核",
    "category-selected": "類別已選擇",
    "subcategory-selected-if-needed": "需要時已選擇子類別",
    "ci-affected-service-checked": "設定項目 / 受影響服務已檢查",
    "impact-checked": "影響已檢查",
    "urgency-checked": "緊急度已檢查",
    "priority-reviewed-derived": "優先順序作為衍生值已審核",
    "assignment-group-reviewed": "指派群組建議已審核",
    "work-notes-prepared": "工作備註已準備",
    "comments-separated": "面向客戶的留言已與內部工作備註分開",
    "human-confirmation-before-mock-fill": "任何 mock 填入/複製前已獲得人工確認"
  }
};

const esFieldReviewChecklistTranslations = {
  checklistSummaryLabel: "⚙ Lista opcional de campos / reglas del equipo",
  checklistProgressAria: "Progreso de revisión de campos",
  checklistReviewedLocally: "revisados localmente",
  checklistIntroRequired:
    "ServiceNow ya valida los campos obligatorios con asterisco al enviar. Esta lista local es opcional y personalizable para el proceso del equipo, el orden de campos y la calidad del borrador antes de cualquier relleno/copia mock.",
  checklistIntroQuality:
    "La calidad del ticket depende del orden y las dependencias de campos, no solo de la generación de texto. Revisa solicitante, ubicación, canal, categoría, servicio afectado, impacto, urgencia, prioridad, asignación, comentarios y notas de trabajo antes de cualquier relleno/copia mock.",
  checklistReferenceAria: "Referencia sanitizada del formulario de creación de ServiceNow",
  checklistRequiredReferenceLabel: "Referencia obligatoria/con asterisco",
  checklistRequiredReferenceFields: "Solicitante, Categoría, Ubicación, Canal, Impacto, Urgencia, Grupo de asignación, Descripción breve",
  checklistSupportingFieldsLabel: "Campos de apoyo",
  checklistSupportingFields:
    "Descripción, Subcategoría, Elemento de configuración, Servicio de negocio, Oferta de servicio, Prioridad, Asignado a, Comentarios adicionales, Notas de trabajo, Búsqueda relacionada / Conocimiento y catálogo",
  checklistSafetyCopy:
    "Lista demo solamente. Estado local solamente. Sin relleno real de campos ServiceNow, Save, Submit, Update, Close, llamada API, automatización de navegador, inspección DOM, capturas, HAR, trazas, sesiones ni exportación de almacenamiento.",
  checklistItemLabels: {
    "source-channel-reviewed": "Canal de origen revisado",
    "requester-identified": "Solicitante identificado",
    "location-checked": "Ubicación revisada",
    "channel-selected": "Canal seleccionado",
    "short-description-reviewed": "Descripción breve generada/revisada",
    "description-reviewed": "Descripción generada/revisada",
    "category-selected": "Categoría seleccionada",
    "subcategory-selected-if-needed": "Subcategoría seleccionada si hace falta",
    "ci-affected-service-checked": "Elemento de configuración / servicio afectado revisado",
    "impact-checked": "Impacto revisado",
    "urgency-checked": "Urgencia revisada",
    "priority-reviewed-derived": "Prioridad revisada como valor derivado",
    "assignment-group-reviewed": "Grupo de asignación sugerido/revisado",
    "work-notes-prepared": "Notas de trabajo preparadas",
    "comments-separated": "Comentarios visibles al cliente separados de Work Notes internas",
    "human-confirmation-before-mock-fill": "Confirmación humana antes de cualquier relleno/copia mock"
  }
};

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
      monitorGroupLabel: "监控组",
      alertStatusLabel: "报警状态",
      alertEnabledStatus: "已启用报警",
      alertSuppressedStatus: "已按监控组设置抑制",
      alertInactiveStatus: "当前无报警",
      monitoredGroupsTitle: "报警监控组",
      monitoredGroupsHelper: "只有所选监控组内的 P1/P2 事件才会报警；其他组本地抑制，不连接真实 ServiceNow。",
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
    ...zhCnFieldReviewChecklistTranslations,
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
      monitorGroupLabel: "Monitor group",
      alertStatusLabel: "Alert status",
      alertEnabledStatus: "Alert enabled",
      alertSuppressedStatus: "Suppressed by monitored-group settings",
      alertInactiveStatus: "No active alarm",
      monitoredGroupsTitle: "Monitored groups for alerts",
      monitoredGroupsHelper: "Only P1/P2 events in selected monitored groups will alert; other groups are suppressed locally with no real ServiceNow polling.",
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
    ...englishFieldReviewChecklistTranslations,
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
      monitorGroupLabel: "監控群組",
      alertStatusLabel: "警報狀態",
      alertEnabledStatus: "已啟用警報",
      alertSuppressedStatus: "已依監控群組設定抑制",
      alertInactiveStatus: "目前無警報",
      monitoredGroupsTitle: "警報監控群組",
      monitoredGroupsHelper: "只有所選監控群組內的 P1/P2 事件才會警報；其他群組會在本地抑制，不連線真實 ServiceNow。",
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
    ...zhTwFieldReviewChecklistTranslations,
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
      monitorGroupLabel: "Grupo monitoreado",
      alertStatusLabel: "Estado de alerta",
      alertEnabledStatus: "Alerta activada",
      alertSuppressedStatus: "Suprimida por la configuración de grupos monitoreados",
      alertInactiveStatus: "Sin alarma activa",
      monitoredGroupsTitle: "Grupos monitoreados para alertas",
      monitoredGroupsHelper: "Solo los eventos P1/P2 en grupos monitoreados seleccionados generan alerta; otros grupos se suprimen localmente sin sondeo real de ServiceNow.",
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
    ...esFieldReviewChecklistTranslations,
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

export const highSeverityMonitorGroups: { id: HighSeverityMonitorGroup; label: string }[] = [
  { id: "demo-service-desk", label: "Demo Service Desk" },
  { id: "demo-identity-access", label: "Demo Identity Access" },
  { id: "demo-network-operations", label: "Demo Network Operations" },
  { id: "demo-employee-portal", label: "Demo Employee Portal" }
];

export const defaultHighSeverityMonitoredGroups: HighSeverityMonitorGroup[] = highSeverityMonitorGroups.map(
  (group) => group.id
);

const highSeverityMonitorGroupLabels: Record<HighSeverityMonitorGroup, string> = Object.fromEntries(
  highSeverityMonitorGroups.map((group) => [group.id, group.label])
) as Record<HighSeverityMonitorGroup, string>;

const highSeveritySimulatorStates: Record<
  HighSeverityState,
  { label: string; fakeCount: number; affectedServices: string[]; monitorGroupId: HighSeverityMonitorGroup }
> = {
  normal: {
    label: "Normal",
    fakeCount: 0,
    affectedServices: ["Demo service desk queue"],
    monitorGroupId: "demo-service-desk"
  },
  p2: {
    label: "P2 Active",
    fakeCount: 2,
    affectedServices: ["Demo identity sign-in", "Demo remote access"],
    monitorGroupId: "demo-identity-access"
  },
  p1: {
    label: "P1 Active",
    fakeCount: 4,
    affectedServices: ["Demo network access", "Demo employee portal"],
    monitorGroupId: "demo-network-operations"
  }
};

export type HighSeverityVoiceReminder = {
  severity: HighSeverityState;
  monitoredGroupId: HighSeverityMonitorGroup;
  monitoredGroupLabel: string;
  alarmEnabled: boolean;
  voiceText: string;
  policyText: string;
  previewSafetyText: string;
  suppressionText: string;
  requiresManualAcknowledge: boolean;
  autoStopAfterAnnouncements: number | null;
};

const highSeverityVoiceReminderTranslations = {
  "zh-CN": {
    normal: {
      voiceText: "当前没有 P1 或 P2 高优先级事件提醒。",
      policyText: "无活跃语音播报。",
      previewSafetyText: "Local browser speech preview only — 本地浏览器语音预览，不连接真实 ServiceNow。"
    },
    p2: {
      voiceText: "P2 重要事件提醒：检测到 VIP 或重要且紧急事件。请尽快查看并确认处理负责人。",
      policyText: "三次提醒后自动停止；用户也可以提前手动确认或静音。",
      previewSafetyText: "Local browser speech preview only — 本地浏览器语音预览，不连接真实 ServiceNow。"
    },
    p1: {
      voiceText: "P1 严重事件警报：可能是高影响范围事件，例如产线停产、公司断网或安全事故。请立即处理。",
      policyText: "更频繁重复播报，直到用户手动确认或静音。",
      previewSafetyText: "Local browser speech preview only — 本地浏览器语音预览，不连接真实 ServiceNow。"
    }
  },
  "en-US": {
    normal: {
      voiceText: "No active P1 or P2 high-severity incident reminder.",
      policyText: "No active voice announcement.",
      previewSafetyText: "Local browser speech preview only — no real ServiceNow polling or API call."
    },
    p2: {
      voiceText: "P2 urgent incident reminder: a VIP or important urgent event needs review and owner confirmation.",
      policyText: "Auto-stops after 3 announcements, or sooner if the user acknowledges or mutes it.",
      previewSafetyText: "Local browser speech preview only — no real ServiceNow polling or API call."
    },
    p1: {
      voiceText:
        "P1 critical incident alert: possible major-impact event, such as production stoppage, company network outage, or safety incident. Take immediate action.",
      policyText: "Repeats until manual acknowledgement or mute.",
      previewSafetyText: "Local browser speech preview only — no real ServiceNow polling or API call."
    }
  },
  "zh-TW": {
    normal: {
      voiceText: "目前沒有 P1 或 P2 高優先級事件提醒。",
      policyText: "沒有啟用語音播報。",
      previewSafetyText: "Local browser speech preview only — 本地瀏覽器語音預覽，不連線真實 ServiceNow。"
    },
    p2: {
      voiceText: "P2 重要事件提醒：偵測到 VIP 或重要且緊急事件。請盡快查看並確認處理負責人。",
      policyText: "提醒三次後自動停止；使用者也可以提前手動確認或靜音。",
      previewSafetyText: "Local browser speech preview only — 本地瀏覽器語音預覽，不連線真實 ServiceNow。"
    },
    p1: {
      voiceText: "P1 緊急事件警報：可能是高影響範圍事件，例如產線停產、公司網路中斷或安全事故。請立即處理。",
      policyText: "更頻繁重複播報，直到使用者手動確認或靜音。",
      previewSafetyText: "Local browser speech preview only — 本地瀏覽器語音預覽，不連線真實 ServiceNow。"
    }
  },
  "es-ES": {
    normal: {
      voiceText: "No hay recordatorio activo de incidente de alta severidad P1 o P2.",
      policyText: "No hay anuncio de voz activo.",
      previewSafetyText: "Local browser speech preview only — vista previa local de voz sin sondeo ni API real de ServiceNow."
    },
    p2: {
      voiceText: "Recordatorio de incidente urgente P2: un evento VIP o importante y urgente requiere revisión y confirmación del responsable.",
      policyText: "Se detiene automáticamente después de 3 anuncios, o antes si el usuario lo reconoce o silencia.",
      previewSafetyText: "Local browser speech preview only — vista previa local de voz sin sondeo ni API real de ServiceNow."
    },
    p1: {
      voiceText:
        "Alerta de incidente crítico P1: posible evento de alto impacto, como parada de producción, caída de red corporativa o incidente de seguridad. Actúa de inmediato.",
      policyText: "Se repite hasta confirmación manual o silencio por el usuario.",
      previewSafetyText: "Local browser speech preview only — vista previa local de voz sin sondeo ni API real de ServiceNow."
    }
  }
} satisfies Record<LanguageCode, Record<HighSeverityState, Pick<HighSeverityVoiceReminder, "voiceText" | "policyText" | "previewSafetyText">>>;

const highSeveritySuppressedReminderTranslations = {
  "zh-CN": {
    voiceText: (groupLabel: string) => `P1/P2 报警已抑制：${groupLabel} 不在监控组中。`,
    policyText: "未命中监控组时不会报警；请在监控组设置中勾选该组后再启用提醒。",
    suppressionText: (groupLabel: string) => `${groupLabel} 不在监控组中；不会发出报警。`
  },
  "en-US": {
    voiceText: (groupLabel: string) => `P1/P2 alert suppressed: ${groupLabel} is not monitored.`,
    policyText: "No alarm is emitted when the event group is outside the monitored groups.",
    suppressionText: (groupLabel: string) => `${groupLabel} not in monitored groups; no alarm will sound.`
  },
  "zh-TW": {
    voiceText: (groupLabel: string) => `P1/P2 警報已抑制：${groupLabel} 不在監控群組中。`,
    policyText: "未命中監控群組時不會警報；請在監控群組設定中勾選該群組後再啟用提醒。",
    suppressionText: (groupLabel: string) => `${groupLabel} 不在監控群組中；不會發出警報。`
  },
  "es-ES": {
    voiceText: (groupLabel: string) => `Alerta P1/P2 suprimida: ${groupLabel} no está monitoreado.`,
    policyText: "No se emite alarma cuando el grupo del evento está fuera de los grupos monitoreados.",
    suppressionText: (groupLabel: string) => `${groupLabel} no está en los grupos monitoreados; no sonará ninguna alarma.`
  }
} satisfies Record<
  LanguageCode,
  {
    voiceText: (groupLabel: string) => string;
    policyText: string;
    suppressionText: (groupLabel: string) => string;
  }
>;

export function getHighSeverityVoiceReminder(
  severity: HighSeverityState,
  language: LanguageCode,
  monitoredGroupIds: HighSeverityMonitorGroup[] = defaultHighSeverityMonitoredGroups
): HighSeverityVoiceReminder {
  const localizedReminder = highSeverityVoiceReminderTranslations[language][severity];
  const selectedFakeState = highSeveritySimulatorStates[severity];
  const monitoredGroupLabel = highSeverityMonitorGroupLabels[selectedFakeState.monitorGroupId];
  const alarmEnabled = severity !== "normal" && monitoredGroupIds.includes(selectedFakeState.monitorGroupId);

  if (!alarmEnabled && severity !== "normal") {
    const suppressedReminder = highSeveritySuppressedReminderTranslations[language];

    return {
      severity,
      monitoredGroupId: selectedFakeState.monitorGroupId,
      monitoredGroupLabel,
      alarmEnabled: false,
      voiceText: suppressedReminder.voiceText(monitoredGroupLabel),
      policyText: suppressedReminder.policyText,
      previewSafetyText: localizedReminder.previewSafetyText,
      suppressionText: suppressedReminder.suppressionText(monitoredGroupLabel),
      requiresManualAcknowledge: false,
      autoStopAfterAnnouncements: null
    };
  }

  return {
    severity,
    monitoredGroupId: selectedFakeState.monitorGroupId,
    monitoredGroupLabel,
    alarmEnabled,
    ...localizedReminder,
    suppressionText: "",
    requiresManualAcknowledge: severity === "p1",
    autoStopAfterAnnouncements: severity === "p2" ? 3 : null
  };
}

const displayThemes: { id: DisplayTheme }[] = [{ id: "warm" }, { id: "cool" }];
const serviceNowEnvironmentUrlSettingModes: Exclude<ServiceNowEnvironmentMode, "mock">[] = [
  "qa",
  "dev",
  "production-shadow"
];

type EnvironmentLocalizedCopy = {
  label: string;
  description: string;
  safetyLabel: string;
  safetyNotes: string[];
};

type UiChromeTranslations = {
  settingsButton: string;
  noAttachmentsCopy: string;
  settingsSidebar: {
    ariaLabel: string;
    eyebrow: string;
    title: string;
    closeAriaLabel: string;
    closeButton: string;
  };
  displaySettings: {
    title: string;
    appZoom: string;
    zoomControlsAria: string;
    currentZoomAria: string;
    reset: string;
    ctrlWheelCopy: string;
    theme: string;
    themeOptionsAria: string;
    themeLabels: Record<DisplayTheme, string>;
    localStateCopy: string;
    textFields: string;
    textFieldModeAria: string;
    autoFit: string;
    compactResize: string;
    textModeHelper: string;
  };
  templateSettings: {
    title: string;
    safetyCopy: string;
    presetLabel: string;
    presetAria: string;
    switchCopy: string;
    descriptionTemplate: string;
    workNotesTemplate: string;
    descriptionHelper: string;
    workNotesHelper: string;
  };
  environment: {
    panelCopy: string;
    currentMode: string;
    selectorAria: string;
    selected: string;
    noTargetUrl: string;
    urlHidden: string;
    noRawClickableLink: string;
    credentialPolicy: string;
    manualLoginRequired: string;
    noCredentialsRequired: string;
    ignoredLocalRuntimePath: string;
    submitPolicy: string;
    explicitApprovalRequired: string;
    noRealSubmit: string;
    urlSettingsTitle: string;
    urlSettingsSafetyCopy: string;
    customUrlLabel: string;
    customUrlPlaceholder: string;
    localOnlyNoSecrets: string;
    validationAccepted: string;
    validationBlocked: string;
    activeCustomTarget: string;
    builtInTargetHidden: string;
    writeGateUnchanged: string;
    configs: Record<ServiceNowEnvironmentMode, EnvironmentLocalizedCopy>;
  };
  mockForm: {
    frameAria: string;
    toolbarTitle: string;
    actionbarAria: string;
    actions: Record<"save" | "submit" | "update" | "close", string>;
    disabledUnavailable: string;
    tabsAria: string;
    details: string;
    notes: string;
    relatedSearch: string;
    fields: {
      requester: string;
      category: string;
      location: string;
      channel: string;
      impact: string;
      urgency: string;
      assignmentGroup: string;
      priority: string;
      shortDescription: string;
      description: string;
      workNotes: string;
    };
    submitDisabled: string;
    finalSubmitCopy: string;
    notSet: string;
  };
};

const englishChromeTranslations: UiChromeTranslations = {
  settingsButton: "⚙ Settings",
  noAttachmentsCopy:
    "No attachments, .msg/.eml parsing, live channel content, or external AI with real content is used.",
  settingsSidebar: {
    ariaLabel: "Centralized settings",
    eyebrow: "Centralized settings",
    title: "Settings",
    closeAriaLabel: "Close settings panel",
    closeButton: "✕ Close"
  },
  displaySettings: {
    title: "⚙ Display Settings",
    appZoom: "App zoom",
    zoomControlsAria: "App zoom controls",
    currentZoomAria: "Current app zoom",
    reset: "Reset",
    ctrlWheelCopy: "Ctrl + mouse wheel also changes the local app zoom.",
    theme: "Theme",
    themeOptionsAria: "Display theme options",
    themeLabels: { warm: "Warm", cool: "Cool" },
    localStateCopy: "Display settings are local React state only and are not persisted.",
    textFields: "Text fields",
    textFieldModeAria: "Text field display mode",
    autoFit: "Auto-fit text areas",
    compactResize: "Compact + visible resize handle",
    textModeHelper:
      "Auto-fit gives long content more room. Compact mode keeps fields shorter and shows a stronger bottom-right resize affordance."
  },
  templateSettings: {
    title: "⚙ Templates / Settings",
    safetyCopy: "Local demo templates only — no external storage or ServiceNow write.",
    presetLabel: "Template preset",
    presetAria: "Template presets",
    switchCopy: "Switching presets replaces both local template text areas.",
    descriptionTemplate: "Description template",
    workNotesTemplate: "Work Notes template",
    descriptionHelper: "Use {{draft_content}} to place the generated language-aware Description.",
    workNotesHelper: "Use {{draft_content}} to place the generated language-aware Work Notes."
  },
  environment: {
    panelCopy:
      "Start in mock mode, move to QA/dev only after review, and keep production validation shadow-only by default unless a separate safety review changes that boundary.",
    currentMode: "Current mode",
    selectorAria: "ServiceNow environment modes",
    selected: "Selected",
    noTargetUrl: "No target URL configured",
    urlHidden: "Full ServiceNow URL hidden for privacy",
    noRawClickableLink: "No raw clickable QA/dev link. Controlled browser launch requires URL allowlist and #22 RealActionGate.",
    credentialPolicy: "Credential policy",
    manualLoginRequired: "Manual login required",
    noCredentialsRequired: "No credentials required",
    ignoredLocalRuntimePath: "Ignored local runtime path",
    submitPolicy: "Submit policy",
    explicitApprovalRequired: "Explicit approval required before real QA/dev submit",
    noRealSubmit: "No real submit from this mode",
    urlSettingsTitle: "ServiceNow Environment URL settings",
    urlSettingsSafetyCopy:
      "Local state only. Paste only authorized QA/dev/production-shadow landing URLs; do not include credentials, sys_id, tokens, cookies, or ticket-specific deep links.",
    customUrlLabel: "Custom URL",
    customUrlPlaceholder: "https://<instance>.service-now.com/now/nav/ui/classic/params/target/home_splash.do",
    localOnlyNoSecrets: "URL setting is local UI state only; no Graph, ServiceNow API, browser write, or credential storage is performed.",
    validationAccepted: "Accepted ServiceNow host",
    validationBlocked: "Blocked URL setting",
    activeCustomTarget: "Custom target active for this session",
    builtInTargetHidden: "Built-in/default target active; raw target URL stays hidden until a safe custom URL is accepted.",
    writeGateUnchanged: "Write gate unchanged: each Save/Submit/Update/Close still requires the exact action approval phrase.",
    configs: {
      mock: {
        label: "Mock Demo",
        description: "Offline deterministic demo using ManualPasteAdapter, MockAIProvider, demo KB, and mock form fill.",
        safetyLabel: "MOCK — Safe demo",
        safetyNotes: [
          "No ServiceNow login is required.",
          "Submit remains disabled in demo mode.",
          "Use this mode for portfolio walkthroughs and quick regression checks."
        ]
      },
      qa: {
        label: "QA Test Environment",
        description: "Authorized ServiceNow QA target for controlled test-ticket rehearsal after mock workflow is stable.",
        safetyLabel: "QA — No write until #22",
        safetyNotes: [
          "Manual login required. Credentials are never stored in source code.",
          "Browser sessions stay in ignored local runtime folders.",
          "Any real QA/dev submit requires explicit Alan approval."
        ]
      },
      dev: {
        label: "Development Test Environment",
        description: "Reserved for an authorized ServiceNow dev instance if one is provided.",
        safetyLabel: "DEV — No write until #22",
        safetyNotes: [
          "Manual login required. Credentials are never stored in source code.",
          "Browser sessions stay in ignored local runtime folders.",
          "Any real QA/dev submit requires explicit Alan approval."
        ]
      },
      "production-shadow": {
        label: "Production Shadow Mode",
        description: "Strictly monitored production comparison mode for personally controlled validation only.",
        safetyLabel: "NO SUBMIT · NO UPDATE · NO CLOSE",
        safetyNotes: [
          "Production remains shadow-only by default.",
          "No production submit, close, or update path is implemented.",
          "Compare generated drafts with manual handling; do not auto-write production records.",
          "Escalate to a separate safety review before any production write capability is considered."
        ]
      }
    }
  },
  mockForm: {
    frameAria: "Mock ServiceNow Incident new record form fields",
    toolbarTitle: "Incident | New record — Mock preview",
    actionbarAria: "Disabled mock ServiceNow actions",
    actions: { save: "Save", submit: "Submit", update: "Update", close: "Close" },
    disabledUnavailable: "Disabled / unavailable in demo mode",
    tabsAria: "Mock ServiceNow form sections",
    details: "Details",
    notes: "Notes",
    relatedSearch: "Related Search (mock only)",
    fields: {
      requester: "Requester",
      category: "Category",
      location: "Location",
      channel: "Channel",
      impact: "Impact",
      urgency: "Urgency",
      assignmentGroup: "Assignment group",
      priority: "Priority",
      shortDescription: "Short description",
      description: "Description",
      workNotes: "Work notes"
    },
    submitDisabled: "Submit disabled in demo mode",
    finalSubmitCopy:
      "Final ServiceNow submit must remain a deliberate human action. No real record is saved, submitted, updated, or closed.",
    notSet: "Not set"
  }
};

const uiChromeTranslations: Record<LanguageCode, UiChromeTranslations> = {
  "en-US": englishChromeTranslations,
  "zh-CN": {
    ...englishChromeTranslations,
    settingsButton: "⚙ 设置",
    noAttachmentsCopy: "不会使用附件、.msg/.eml 解析、实时渠道内容，也不会使用带真实内容的外部 AI。",
    settingsSidebar: {
      ariaLabel: "集中设置",
      eyebrow: "集中设置",
      title: "设置",
      closeAriaLabel: "关闭设置面板",
      closeButton: "✕ 关闭"
    },
    displaySettings: {
      ...englishChromeTranslations.displaySettings,
      title: "⚙ 显示设置",
      appZoom: "应用缩放",
      zoomControlsAria: "应用缩放控制",
      currentZoomAria: "当前应用缩放",
      reset: "重置",
      ctrlWheelCopy: "Ctrl + 鼠标滚轮也会调整本地应用缩放。",
      theme: "主题",
      themeOptionsAria: "显示主题选项",
      themeLabels: { warm: "暖色", cool: "冷色" },
      localStateCopy: "显示设置只是本地 React 状态，不会持久化。",
      textFields: "文本字段",
      textFieldModeAria: "文本字段显示模式",
      autoFit: "自动适应文本框",
      compactResize: "紧凑 + 显示缩放手柄",
      textModeHelper: "自动适应会给长内容更多空间；紧凑模式会保持字段较短，并显示更明显的右下角缩放提示。"
    },
    templateSettings: {
      ...englishChromeTranslations.templateSettings,
      title: "⚙ 模板 / 设置",
      safetyCopy: "本地演示模板，仅本地保存；不会写入外部存储或 ServiceNow。",
      presetLabel: "模板预设",
      presetAria: "模板预设",
      switchCopy: "切换预设会替换两个本地模板文本框。",
      descriptionTemplate: "描述模板",
      workNotesTemplate: "工作备注模板",
      descriptionHelper: "使用 {{draft_content}} 放置按语言生成的描述内容。",
      workNotesHelper: "使用 {{draft_content}} 放置按语言生成的工作备注。"
    },
    environment: {
      ...englishChromeTranslations.environment,
      panelCopy: "先从 mock 模式开始；通过审核后再进入 QA/dev；生产验证默认保持影子模式，除非单独安全评审改变边界。",
      currentMode: "当前模式",
      selectorAria: "ServiceNow 环境模式",
      selected: "已选择",
      noTargetUrl: "未配置目标 URL",
      urlHidden: "完整 ServiceNow URL 已为隐私隐藏",
      noRawClickableLink: "不显示原始可点击 QA/dev 链接。受控浏览器启动需要 URL allowlist 和 #22 RealActionGate。",
      credentialPolicy: "凭据策略",
      manualLoginRequired: "必须手动登录",
      noCredentialsRequired: "无需凭据",
      ignoredLocalRuntimePath: "已忽略的本地运行目录",
      submitPolicy: "提交策略",
      explicitApprovalRequired: "真实 QA/dev 提交前必须明确批准",
      noRealSubmit: "此模式不会真实提交",
      urlSettingsTitle: "ServiceNow 环境 URL 设置",
      urlSettingsSafetyCopy:
        "仅本地状态。只粘贴已授权的 QA/dev/production-shadow 落地页 URL；不要包含凭据、sys_id、token、cookie 或具体工单深链。",
      customUrlLabel: "自定义 URL",
      customUrlPlaceholder: "https://<instance>.service-now.com/now/nav/ui/classic/params/target/home_splash.do",
      localOnlyNoSecrets: "URL 设置只是本地 UI 状态；不会执行 Graph、ServiceNow API、浏览器写入或凭据保存。",
      validationAccepted: "已接受的 ServiceNow host",
      validationBlocked: "已阻止的 URL 设置",
      activeCustomTarget: "本会话正在使用自定义目标",
      builtInTargetHidden: "内置/默认目标处于活动状态；原始目标 URL 保持隐藏，直到安全自定义 URL 通过校验。",
      writeGateUnchanged: "写操作门禁不变：每次 Save/Submit/Update/Close 仍需要精确动作批准短语。",
      configs: {
        mock: {
          label: "Mock 演示",
          description: "离线确定性演示：使用 ManualPasteAdapter、MockAIProvider、演示 KB 和 mock 表单填充。",
          safetyLabel: "MOCK — 安全演示",
          safetyNotes: ["不需要 ServiceNow 登录。", "演示模式下 Submit 保持禁用。", "用于作品集演示和快速回归检查。"]
        },
        qa: {
          label: "QA 测试环境",
          description: "授权的 ServiceNow QA 目标，用于 mock 工作流稳定后的受控测试工单预演。",
          safetyLabel: "QA — #22 前不写入",
          safetyNotes: ["必须手动登录。凭据绝不写入源码。", "浏览器会话保留在已忽略的本地运行目录。", "任何真实 QA/dev 提交都需要 Alan 明确批准。"]
        },
        dev: {
          label: "开发测试环境",
          description: "如果提供了授权的 ServiceNow dev 实例，则预留给该实例。",
          safetyLabel: "DEV — #22 前不写入",
          safetyNotes: ["必须手动登录。凭据绝不写入源码。", "浏览器会话保留在已忽略的本地运行目录。", "任何真实 QA/dev 提交都需要 Alan 明确批准。"]
        },
        "production-shadow": {
          label: "生产影子模式",
          description: "严格监控的生产对比模式，仅用于个人受控验证。",
          safetyLabel: "不提交 · 不更新 · 不关闭",
          safetyNotes: ["生产默认保持仅影子模式。", "没有实现生产提交、关闭或更新路径。", "只对比生成草稿与人工处理；不要自动写入生产记录。", "考虑任何生产写入能力前必须升级到单独安全评审。"]
        }
      }
    },
    mockForm: {
      ...englishChromeTranslations.mockForm,
      frameAria: "Mock ServiceNow Incident 新记录表单字段",
      toolbarTitle: "Incident | 新记录 — Mock 预览",
      actionbarAria: "已禁用的 mock ServiceNow 操作",
      actions: { save: "保存", submit: "提交", update: "更新", close: "关闭" },
      disabledUnavailable: "禁用 / 演示模式不可用",
      tabsAria: "Mock ServiceNow 表单分区",
      details: "详情",
      notes: "备注",
      relatedSearch: "相关搜索（仅 mock）",
      fields: {
        requester: "请求者",
        category: "类别",
        location: "地点",
        channel: "渠道",
        impact: "影响",
        urgency: "紧急度",
        assignmentGroup: "分配组",
        priority: "优先级",
        shortDescription: "短描述",
        description: "描述",
        workNotes: "工作备注"
      },
      submitDisabled: "演示模式下提交被禁用",
      finalSubmitCopy: "最终 ServiceNow 提交必须始终是人工有意操作。不会保存、提交、更新或关闭真实记录。",
      notSet: "未设置"
    }
  },
  "zh-TW": englishChromeTranslations,
  "es-ES": englishChromeTranslations
};

const minAppZoomPercent = 80;
const maxAppZoomPercent = 130;
const appZoomStepPercent = 10;

export function clampAppZoomPercent(percent: number): number {
  return Math.min(maxAppZoomPercent, Math.max(minAppZoomPercent, percent));
}

export function getNextAppZoomPercent(current: number, delta: number): number {
  return clampAppZoomPercent(current + delta);
}

export function getCtrlWheelZoomDelta(deltaY: number): number {
  return deltaY < 0 ? appZoomStepPercent : -appZoomStepPercent;
}

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

const draftTemplatePresetsByLanguage: Record<LanguageCode, DraftTemplatePreset[]> = {
  "en-US": [
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
  ],
  "zh-CN": [
    {
      id: "standard-service-desk",
      label: "标准服务台",
      descriptionTemplate: [
        "受理摘要",
        "{{draft_content}}",
        "",
        "审核备注",
        "- 在任何手动操作前确认请求者、来源渠道、影响、紧急度和类别。",
        "- 将面向客户的内容与内部工作备注分开。"
      ].join("\n"),
      workNotesTemplate: [
        "内部排查备注",
        "{{draft_content}}",
        "",
        "下一步检查",
        "- 确认当前症状、最近变更、时间点和影响范围。",
        "- 本地预览仅使用假的脱敏演示数据。"
      ].join("\n")
    },
    {
      id: "escalation-ready-notes",
      label: "升级准备备注",
      descriptionTemplate: [
        "待审核问题摘要",
        "{{draft_content}}",
        "",
        "升级上下文",
        "- 捕获业务影响、受影响访问或设备范围，以及任何临时绕行方案。",
        "- 不包含密钥、凭据、真实工单号或真实客户标识。"
      ].join("\n"),
      workNotesTemplate: [
        "可升级内部备注",
        "{{draft_content}}",
        "",
        "交接检查清单",
        "- 记录已完成检查、剩余未知项、复现细节和脱敏证据。",
        "- 由人工审核者决定是否升级。"
      ].join("\n")
    }
  ],
  "zh-TW": [
    {
      id: "standard-service-desk",
      label: "標準服務台",
      descriptionTemplate: [
        "受理摘要",
        "{{draft_content}}",
        "",
        "審核備註",
        "- 在任何手動操作前確認請求者、來源管道、影響、緊急度和類別。",
        "- 將客戶可見內容與內部 Work Notes 分開。"
      ].join("\n"),
      workNotesTemplate: [
        "內部排查備註",
        "{{draft_content}}",
        "",
        "下一步檢查",
        "- 確認目前症狀、最近變更、時間點和影響範圍。",
        "- 本地預覽僅使用假的去識別化示範資料。"
      ].join("\n")
    },
    {
      id: "escalation-ready-notes",
      label: "升級準備備註",
      descriptionTemplate: [
        "待審核問題摘要",
        "{{draft_content}}",
        "",
        "升級脈絡",
        "- 擷取業務影響、受影響存取或設備範圍，以及任何暫時替代方案。",
        "- 不包含密鑰、憑證、真實工單號或真實客戶識別資訊。"
      ].join("\n"),
      workNotesTemplate: [
        "可升級內部備註",
        "{{draft_content}}",
        "",
        "交接檢查清單",
        "- 記錄已完成檢查、剩餘未知項、重現細節和去識別化證據。",
        "- 由人工審核者決定是否升級。"
      ].join("\n")
    }
  ],
  "es-ES": [
    {
      id: "standard-service-desk",
      label: "Service Desk estándar",
      descriptionTemplate: [
        "Resumen de entrada",
        "{{draft_content}}",
        "",
        "Notas de revisión",
        "- Verificar solicitante, canal de origen, impacto, urgencia y categoría antes de cualquier acción manual.",
        "- Separar el texto visible para cliente de las Work Notes internas."
      ].join("\n"),
      workNotesTemplate: [
        "Notas internas de triaje",
        "{{draft_content}}",
        "",
        "Siguientes comprobaciones",
        "- Confirmar síntoma actual, cambio reciente, marca de tiempo y alcance afectado.",
        "- Usar solo datos demo falsos y sanitizados en esta vista local."
      ].join("\n")
    },
    {
      id: "escalation-ready-notes",
      label: "Notas listas para escalación",
      descriptionTemplate: [
        "Resumen del problema para revisión",
        "{{draft_content}}",
        "",
        "Contexto de escalación",
        "- Capturar impacto de negocio, alcance de acceso/dispositivo afectado y workaround inmediato.",
        "- No incluir secretos, credenciales, números reales de ticket ni identificadores reales de cliente."
      ].join("\n"),
      workNotesTemplate: [
        "Notas internas listas para escalación",
        "{{draft_content}}",
        "",
        "Lista de traspaso",
        "- Registrar comprobaciones completadas, incógnitas restantes, detalles de reproducción y evidencia sanitizada.",
        "- La persona revisora decide si corresponde escalar."
      ].join("\n")
    }
  ]
};

export const draftTemplatePresets = draftTemplatePresetsByLanguage["en-US"];

function getDraftTemplatePresets(language: LanguageCode): DraftTemplatePreset[] {
  return draftTemplatePresetsByLanguage[language] ?? draftTemplatePresets;
}

function getDraftTemplatePreset(language: LanguageCode, presetId: DraftTemplatePresetId): DraftTemplatePreset {
  return getDraftTemplatePresets(language).find((preset) => preset.id === presetId) ?? getDraftTemplatePresets(language)[0];
}

const defaultDraftTemplatePreset = getDraftTemplatePreset("en-US", "standard-service-desk");

const unsupportedFallbackMode = "Unsupported-language fallback: source language + English bilingual draft";

const baseDemoQueueDefinitions: DemoQueueDefinition[] = [
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
    scenarioId: "self-service-normalization",
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
    scenarioId: "shared-mailbox-evidence",
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

const demoQueueDefinitions: DemoQueueDefinition[] = [
  ...baseDemoQueueDefinitions,
  ...demoManualPasteScenarios
    .filter((scenario) => !baseDemoQueueDefinitions.some((definition) => definition.scenarioId === scenario.id))
    .map(buildQueueDefinitionFromManualScenario)
];

function buildQueueDefinitionFromManualScenario(scenario: ManualPasteScenario): DemoQueueDefinition {
  const sourceChannel = sourceChannelForScenario(scenario.id);
  return {
    id: `demo-${scenario.id}`,
    scenarioId: scenario.id,
    receivedAt: receivedAtForScenario(scenario.id),
    sourceChannel,
    content: {
      "en-US": buildManualScenarioContent(scenario, {
        requesterLabel: "Demo requester E",
        sourceLanguage: "English fake manual-paste source",
        draftLanguageMode: "Manual-paste QA scenario drives Description / Work Notes"
      }),
      "zh-CN": buildManualScenarioContent(scenario, {
        requesterLabel: "演示请求者 E",
        sourceLanguage: "英文假手动粘贴来源",
        draftLanguageMode: "手动粘贴 QA 场景驱动 Description / Work Notes"
      }),
      "zh-TW": buildManualScenarioContent(scenario, {
        requesterLabel: "示範請求者 E",
        sourceLanguage: "英文假手動貼上來源",
        draftLanguageMode: "手動貼上 QA 場景驅動 Description / Work Notes"
      }),
      "es-ES": buildManualScenarioContent(scenario, {
        requesterLabel: "Solicitante demo E",
        sourceLanguage: "Origen demo en ingles por pegado manual",
        draftLanguageMode: "El escenario QA de pegado manual guia Description / Work Notes"
      })
    }
  };
}

function buildManualScenarioContent(
  scenario: ManualPasteScenario,
  options: Pick<DemoQueueContent, "requesterLabel" | "sourceLanguage" | "draftLanguageMode">
): DemoQueueContent {
  return {
    ...options,
    subject: scenario.title ?? scenario.label,
    bodyPreview: scenario.rawText,
    sourceBody: [
      `${scenario.title ?? scenario.label}`,
      "",
      scenario.rawText,
      "",
      "This is generated from local fake manual-paste scenario metadata only. No live ServiceNow, Teams, mailbox, phone system, remote support tool, browser session, file, or external AI connection is used."
    ].join("\n")
  };
}

function sourceChannelForScenario(id: ManualPasteScenario["id"]): SourceChannel {
  switch (id) {
    case "phone-confirmation":
      return "Phone call";
    case "remote-support-teams":
      return "Teams message";
    case "shared-mailbox-evidence":
      return "Shared mailbox item";
    case "self-service-normalization":
      return "Self-service ticket";
    case "account-login-issue":
      return "ServiceNow Chat transcript";
    case "vpn-issue":
      return "Teams message";
  }
}

function receivedAtForScenario(id: ManualPasteScenario["id"]): string {
  switch (id) {
    case "phone-confirmation":
      return "2026-05-18 09:45";
    case "remote-support-teams":
      return "2026-05-18 10:00";
    case "shared-mailbox-evidence":
      return "2026-05-18 09:30";
    case "self-service-normalization":
      return "2026-05-18 08:40";
    case "account-login-issue":
      return "2026-05-18 09:05";
    case "vpn-issue":
      return "2026-05-18 08:15";
  }
}

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

export type AppProps = {
  initialLanguage?: LanguageCode;
  initialEnvironmentMode?: ServiceNowEnvironmentMode;
  initialHighSeverityState?: HighSeverityState;
  initialHighSeverityMonitoredGroups?: HighSeverityMonitorGroup[];
  initialQaSmokeWriteAction?: QaManualFillWriteAction;
  initialQaSmokeApprovalPhrase?: string;
  initialQaAutofillApprovalPhrase?: string;
  initialQaAutofillQaIsolationConfirmed?: boolean;
  initialQaAutofillDedicatedProfileConfirmed?: boolean;
  initialEnvironmentUrlSettings?: ServiceNowEnvironmentUrlOverrides;
};

export function updateQaSmokeWriteActionSelection(nextAction: QaManualFillWriteAction) {
  return {
    writeAction: nextAction,
    approvalPhrase: ""
  };
}

export function getNextEnvironmentUrlOverrideFromDraft(mode: Exclude<ServiceNowEnvironmentMode, "mock">, value: string): string {
  const validation = validateServiceNowEnvironmentUrlSetting(mode, value);
  return validation.allowed && validation.normalizedUrl ? validation.normalizedUrl : "";
}

export function App({
  initialLanguage = "en-US",
  initialEnvironmentMode = getDefaultServiceNowEnvironmentMode(),
  initialHighSeverityState = "normal",
  initialHighSeverityMonitoredGroups = defaultHighSeverityMonitoredGroups,
  initialQaSmokeWriteAction = "save_incident",
  initialQaSmokeApprovalPhrase = "",
  initialQaAutofillApprovalPhrase = "",
  initialQaAutofillQaIsolationConfirmed = false,
  initialQaAutofillDedicatedProfileConfirmed = false,
  initialEnvironmentUrlSettings = {}
}: AppProps = {}) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>("warm");
  const [appZoomPercent, setAppZoomPercent] = useState(100);
  const [textFieldDisplayMode, setTextFieldDisplayMode] = useState<TextFieldDisplayMode>("auto-fit");
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const [qaSmokeApprovalPhrase, setQaSmokeApprovalPhrase] = useState(initialQaSmokeApprovalPhrase);
  const [qaSmokeWriteAction, setQaSmokeWriteAction] = useState<QaManualFillWriteAction>(initialQaSmokeWriteAction);
  const [qaAutofillApprovalPhrase, setQaAutofillApprovalPhrase] = useState(initialQaAutofillApprovalPhrase);
  const [qaAutofillQaIsolationConfirmed, setQaAutofillQaIsolationConfirmed] = useState(
    initialQaAutofillQaIsolationConfirmed
  );
  const [qaAutofillDedicatedProfileConfirmed, setQaAutofillDedicatedProfileConfirmed] = useState(
    initialQaAutofillDedicatedProfileConfirmed
  );
  const [checkedFieldReviewItems, setCheckedFieldReviewItems] = useState<string[]>([]);
  const [selectedEnvironmentMode, setSelectedEnvironmentMode] = useState<ServiceNowEnvironmentMode>(
    initialEnvironmentMode
  );
  const [environmentUrlSettings, setEnvironmentUrlSettings] = useState<ServiceNowEnvironmentUrlOverrides>(
    initialEnvironmentUrlSettings
  );
  const [operatorCdpEndpoint, setOperatorCdpEndpoint] = useState("");
  const [operatorLastResponse, setOperatorLastResponse] = useState<OperatorRuntimeResponse | null>(null);
  const [operatorBusyAction, setOperatorBusyAction] = useState<"launch" | "verify" | "autofill" | null>(null);
  const [operatorStatus, setOperatorStatus] = useState<OperatorActionStatus>({
    label: "Ready",
    tone: "idle",
    details: "Use the buttons below to start the dedicated QA Chromium, verify the current Incident form, then autofill fields for manual review."
  });

  useEffect(() => {
    if (!settingsOpen) {
      return undefined;
    }

    function closeSettingsOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    }

    window.addEventListener("keydown", closeSettingsOnEscape);
    return () => window.removeEventListener("keydown", closeSettingsOnEscape);
  }, [settingsOpen]);
  const [highSeverityState, setHighSeverityState] = useState<HighSeverityState>(initialHighSeverityState);
  const [highSeverityMonitoredGroups, setHighSeverityMonitoredGroups] = useState<HighSeverityMonitorGroup[]>(
    initialHighSeverityMonitoredGroups
  );
  const [highSeverityAcknowledged, setHighSeverityAcknowledged] = useState(false);
  const [highSeverityMuted, setHighSeverityMuted] = useState(false);
  const [selectedTemplatePresetId, setSelectedTemplatePresetId] = useState<DraftTemplatePresetId>(
    defaultDraftTemplatePreset.id
  );
  const [draftTemplateSettings, setDraftTemplateSettings] = useState<DraftTemplateSettings>(() => {
    const initialPreset = getDraftTemplatePreset(initialLanguage, defaultDraftTemplatePreset.id);
    return {
      descriptionTemplate: initialPreset.descriptionTemplate,
      workNotesTemplate: initialPreset.workNotesTemplate
    };
  });

  const selectedEnvironment = getServiceNowEnvironmentConfig(selectedEnvironmentMode, environmentUrlSettings);
  const t = uiTranslations[language];
  const chrome = uiChromeTranslations[language];
  const selectedEnvironmentDisplay = chrome.environment.configs[selectedEnvironmentMode];
  const templatedDraft = applyDraftTemplates(initialDraft, draftTemplateSettings);
  const draft = applyOverrides(templatedDraft, fieldOverrides);
  const serviceDeskWorkflowPreview = buildServiceDeskWorkflowPreview({
    createdAt: selectedQueueItem.receivedAt,
    rawIntakeSource: selectedQueueItem.sourceChannel,
    requesterDisplay: selectedQueueItem.requesterLabel,
    languageOrServiceDeskTeam: `${selectedQueueItem.sourceLanguage} / ${profile.defaultAssignmentGroup}`,
    issueType: "Incident",
    draft,
    serviceDeskOwnerTeam: profile.defaultAssignmentGroup,
    finalAssignmentGroup: fieldValue(draft.assignmentGroup),
    finalAssignmentReason: `Local ${fieldValue(draft.category)} / ${fieldValue(draft.subcategory)} mapping from sanitized draft fields.`,
    handlingStatus: selectedQueueItem.status,
    confirmationState: {
      status: "Needs confirmation",
      summary: "Confirm requester, impact, urgency, and missing troubleshooting details before any real handling."
    },
    fakeScenarioId: selectedQueueItem.scenarioId,
    requiredFieldCheck:
      "Complete for manual fill: requester, channel, category, subcategory, location, impact, urgency, assignment group, short description, description, work notes.",
    approvalPhraseGate:
      "Separate exact approval phrase required before each real Save/Submit/Update/Close action.",
    stopRuleCheck:
      "Stop if production mode, real user data, notification risk, missing QA isolation, unexpected ServiceNow workflow, DOM autofill, API use, or bulk path appears.",
    qaIsolationCheck: "Pending explicit confirmation that QA will not notify production/support teams.",
    qaDryRunOutcome: "Blocked until QA isolation is confirmed; field-trial prep only.",
    qaTrialResult: "Not run - field-trial prep only."
  });
  const qaSmokeTargetUrl = selectedEnvironment.url;
  const qaSmokeTargetValidation = validateServiceNowTargetUrl(selectedEnvironment, qaSmokeTargetUrl);
  const qaSmokePlan = evaluateQaSingleTicketSmokePlan({
    draft,
    environment: selectedEnvironment,
    targetUrl: qaSmokeTargetUrl,
    targetValidation: qaSmokeTargetValidation,
    mappingOptions: {
      requester: selectedQueueItem.requesterLabel,
      contactType: selectedQueueItem.sourceChannel,
      location: "Demo location / sanitized"
    },
    writeAction: qaSmokeWriteAction,
    approvalPhrase: qaSmokeApprovalPhrase,
    language,
    templatePreset: selectedTemplatePresetId,
    now: new Date()
  });
  const qaAutofillPlan = buildQaTextFieldAutofillPlan({
    draft,
    environment: selectedEnvironment,
    targetUrl: qaSmokeTargetUrl,
    targetValidation: qaSmokeTargetValidation,
    approvalPhrase: qaAutofillApprovalPhrase,
    qaIsolationConfirmed: qaAutofillQaIsolationConfirmed,
    dedicatedProfileConfirmed: qaAutofillDedicatedProfileConfirmed
  });
  const context = buildContextForQueueItem(selectedQueueItem);
  const sourceCleanup = normalizeSourceContextText({
    sourceType: context.sourceType,
    rawText: context.rawText
  });
  const appShellStyle = {
    "--app-font-scale": appZoomPercent / 100,
    zoom: appZoomPercent / 100
  } as CSSProperties;

  function changeAppZoom(delta: number) {
    setAppZoomPercent((current) => getNextAppZoomPercent(current, delta));
  }

  function handleAppWheel(event: WheelEvent<HTMLElement>) {
    if (!event.ctrlKey) {
      return;
    }

    event.preventDefault();
    changeAppZoom(getCtrlWheelZoomDelta(event.deltaY));
  }

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
    const localizedPreset = getDraftTemplatePreset(nextLanguage, selectedTemplatePresetId);
    setLanguage(nextLanguage);
    setDraftTemplateSettings({
      descriptionTemplate: localizedPreset.descriptionTemplate,
      workNotesTemplate: localizedPreset.workNotesTemplate
    });
    setFieldOverrides({});
    setPreparedCopyDraft(null);
    setFillConfirmed(false);
    setCheckedFieldReviewItems([]);
  }

  function updateField(fieldName: keyof TicketDraft, value: string) {
    setFieldOverrides((current) => ({ ...current, [fieldName]: value }));
  }

  function selectTemplatePreset(presetId: DraftTemplatePresetId) {
    const preset = getDraftTemplatePreset(language, presetId);
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

  function toggleHighSeverityMonitoredGroup(groupId: HighSeverityMonitorGroup) {
    setHighSeverityMonitoredGroups((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
    );
    setHighSeverityAcknowledged(false);
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

  function updateEnvironmentUrlSetting(mode: Exclude<ServiceNowEnvironmentMode, "mock">, url: string) {
    setEnvironmentUrlSettings((current) => {
      if (!url.trim()) {
        const next = { ...current };
        delete next[mode];
        return next;
      }

      return { ...current, [mode]: url };
    });
  }

  async function runOperatorAction(
    action: "launch" | "verify" | "autofill",
    invoke: (api: SdaOperatorApi, request: OperatorRuntimeRequest) => Promise<OperatorRuntimeResponse>
  ) {
    const api = getSdaOperatorApi();
    if (!api) {
      setOperatorStatus({
        label: "Desktop backend unavailable",
        tone: "blocked",
        details: "Open this app with the Windows desktop launcher, not as a static browser page."
      });
      return;
    }

    const request: OperatorRuntimeRequest = {
      mode: selectedEnvironmentMode,
      targetUrl: qaSmokeTargetUrl,
      cdpEndpoint: operatorCdpEndpoint,
      draft,
      scenario: "initial-create"
    };

    setOperatorBusyAction(action);
    setOperatorStatus({ label: operatorActionLabel(action), tone: "working", details: "Working..." });
    try {
      const response = await invoke(api, request);
      setOperatorLastResponse(response);
      if (response.launch?.cdpEndpoint) {
        setOperatorCdpEndpoint(response.launch.cdpEndpoint);
      }
      setOperatorStatus(operatorStatusFromResponse(action, response));
    } catch (error) {
      setOperatorStatus({
        label: `${operatorActionLabel(action)} failed`,
        tone: "blocked",
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setOperatorBusyAction(null);
    }
  }

  function launchQaOperatorBrowser() {
    void runOperatorAction("launch", (api, request) => api.launchQaBrowser(request));
  }

  function verifyQaOperatorIncident() {
    void runOperatorAction("verify", (api, request) => api.verifyCurrentIncident(request));
  }

  function autofillQaOperatorIncident() {
    void runOperatorAction("autofill", (api, request) => api.autofillCurrentIncidentDefaults(request));
  }

  return (
    <main
      className="app-shell"
      data-theme={displayTheme}
      data-text-mode={textFieldDisplayMode}
      data-zoom-percent={appZoomPercent}
      onWheel={handleAppWheel}
      style={appShellStyle}
    >
      <section className="hero" aria-labelledby="app-title">
        <header className="app-chrome">
          <div className="safety-banner" role="status">
            {t.safetyTagline}
          </div>
          <div className="top-toolbar">
            <button
              aria-controls="app-settings-sidebar"
              aria-expanded={settingsOpen}
              className="settings-toggle"
              type="button"
              onClick={() => setSettingsOpen((current) => !current)}
            >
              {chrome.settingsButton}
            </button>
            <LanguageSelector language={language} onLanguageChange={changeLanguage} t={t} />
          </div>
        </header>

        <div className="content">
          <p className="eyebrow">{t.productEyebrow}</p>
          <h1 id="app-title" className="hero-title">{t.heroTitle}</h1>
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
              {t.workspaceSubtitle} {chrome.noAttachmentsCopy}
            </p>
            <p className="language-simulation-note">{t.languageSimulationNotice}</p>
          </div>
          <div className="mode-pill">{selectedEnvironmentDisplay.label} · MockAIProvider</div>
        </header>

        <div className="workspace-with-settings">
          <div className="workflow-column">
            <RuntimeSafetyPanel t={t} />

            <HighSeverityMonitorSimulator
              language={language}
              monitoredGroupIds={highSeverityMonitoredGroups}
              acknowledged={highSeverityAcknowledged}
              muted={highSeverityMuted}
              selectedState={highSeverityState}
              onAcknowledge={() => setHighSeverityAcknowledged(true)}
              onMute={() => setHighSeverityMuted((current) => !current)}
              onMonitoredGroupToggle={toggleHighSeverityMonitoredGroup}
              onSelectedStateChange={(state) => {
                setHighSeverityState(state);
                setHighSeverityAcknowledged(false);
              }}
              t={t}
            />

            <EnvironmentModePanel
              selectedMode={selectedEnvironmentMode}
              onSelectedModeChange={setSelectedEnvironmentMode}
              chrome={chrome}
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

            <ServiceDeskWorkflowPanel
              preview={serviceDeskWorkflowPreview}
              onPrepareCopyDraft={prepareCopyDraft}
            />

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

            <MockServiceNowForm draft={draft} fillConfirmed={fillConfirmed} item={selectedQueueItem} chrome={chrome} t={t} />
            <QaOperatorRuntimePanel
              busyAction={operatorBusyAction}
              cdpEndpointReady={Boolean(operatorCdpEndpoint)}
              draft={draft}
              lastResponse={operatorLastResponse}
              mode={selectedEnvironmentMode}
              onAutofill={autofillQaOperatorIncident}
              onLaunchBrowser={launchQaOperatorBrowser}
              onVerify={verifyQaOperatorIncident}
              status={operatorStatus}
              targetLabel={selectedEnvironmentDisplay.label}
            />
            <ControlledQaSingleTicketSmokePanel
              approvalPhrase={qaSmokeApprovalPhrase}
              onWriteActionChange={(nextAction) => {
                const nextSelection = updateQaSmokeWriteActionSelection(nextAction);
                setQaSmokeWriteAction(nextSelection.writeAction);
                setQaSmokeApprovalPhrase(nextSelection.approvalPhrase);
              }}
              plan={qaSmokePlan}
              onApprovalPhraseChange={setQaSmokeApprovalPhrase}
              writeAction={qaSmokeWriteAction}
            />
            <QaTextFieldAutofillPanel
              approvalPhrase={qaAutofillApprovalPhrase}
              dedicatedProfileConfirmed={qaAutofillDedicatedProfileConfirmed}
              mode={selectedEnvironmentMode}
              onApprovalPhraseChange={setQaAutofillApprovalPhrase}
              onDedicatedProfileConfirmedChange={setQaAutofillDedicatedProfileConfirmed}
              onQaIsolationConfirmedChange={setQaAutofillQaIsolationConfirmed}
              plan={qaAutofillPlan}
              qaIsolationConfirmed={qaAutofillQaIsolationConfirmed}
            />
          </div>

          <SettingsSidebar
            appZoomPercent={appZoomPercent}
            checkedFieldReviewItems={checkedFieldReviewItems}
            environmentUrlSettings={environmentUrlSettings}
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onEnvironmentUrlSettingChange={updateEnvironmentUrlSetting}
            onPresetChange={selectTemplatePreset}
            onResetZoom={() => setAppZoomPercent(100)}
            onTemplateChange={updateTemplateField}
            onTextFieldModeChange={setTextFieldDisplayMode}
            onThemeChange={setDisplayTheme}
            onToggleChecklistItem={toggleFieldReviewItem}
            onZoomIn={() => changeAppZoom(appZoomStepPercent)}
            onZoomOut={() => changeAppZoom(-appZoomStepPercent)}
            selectedTemplatePresetId={selectedTemplatePresetId}
            selectedTextFieldMode={textFieldDisplayMode}
            selectedTheme={displayTheme}
            templateSettings={draftTemplateSettings}
            chrome={chrome}
            language={language}
            t={t}
          />
        </div>
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

function SettingsSidebar({
  appZoomPercent,
  checkedFieldReviewItems,
  environmentUrlSettings,
  isOpen,
  onClose,
  onEnvironmentUrlSettingChange,
  onPresetChange,
  onResetZoom,
  onTemplateChange,
  onTextFieldModeChange,
  onThemeChange,
  onToggleChecklistItem,
  onZoomIn,
  onZoomOut,
  selectedTemplatePresetId,
  selectedTextFieldMode,
  selectedTheme,
  templateSettings,
  chrome,
  language,
  t
}: {
  appZoomPercent: number;
  checkedFieldReviewItems: string[];
  environmentUrlSettings: ServiceNowEnvironmentUrlOverrides;
  isOpen: boolean;
  onClose: () => void;
  onEnvironmentUrlSettingChange: (mode: Exclude<ServiceNowEnvironmentMode, "mock">, url: string) => void;
  onPresetChange: (presetId: DraftTemplatePresetId) => void;
  onResetZoom: () => void;
  onTemplateChange: (fieldName: keyof DraftTemplateSettings, value: string) => void;
  onTextFieldModeChange: (mode: TextFieldDisplayMode) => void;
  onThemeChange: (theme: DisplayTheme) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  selectedTemplatePresetId: DraftTemplatePresetId;
  selectedTextFieldMode: TextFieldDisplayMode;
  selectedTheme: DisplayTheme;
  templateSettings: DraftTemplateSettings;
  chrome: UiChromeTranslations;
  language: LanguageCode;
  t: UiTranslations;
}) {
  return (
    <aside
      aria-label={chrome.settingsSidebar.ariaLabel}
      className={isOpen ? "settings-sidebar" : "settings-sidebar collapsed"}
      id="app-settings-sidebar"
    >
      <div className="settings-sidebar-inner">
        <header className="settings-sidebar-header">
          <div>
            <p className="eyebrow">{chrome.settingsSidebar.eyebrow}</p>
            <h3>{chrome.settingsSidebar.title}</h3>
          </div>
          <button
            aria-label={chrome.settingsSidebar.closeAriaLabel}
            className="settings-close-button"
            type="button"
            onClick={onClose}
          >
            {chrome.settingsSidebar.closeButton}
          </button>
        </header>

        <DisplaySettingsPanel
          appZoomPercent={appZoomPercent}
          onResetZoom={onResetZoom}
          onTextFieldModeChange={onTextFieldModeChange}
          onThemeChange={onThemeChange}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          selectedTextFieldMode={selectedTextFieldMode}
          selectedTheme={selectedTheme}
          chrome={chrome}
        />

        <EnvironmentUrlSettingsPanel
          environmentUrlSettings={environmentUrlSettings}
          onEnvironmentUrlSettingChange={onEnvironmentUrlSettingChange}
          chrome={chrome}
        />

        <TemplateSettingsPanel
          selectedPresetId={selectedTemplatePresetId}
          settings={templateSettings}
          chrome={chrome}
          language={language}
          onPresetChange={onPresetChange}
          onTemplateChange={onTemplateChange}
        />

        <FieldReviewChecklist
          checkedItemIds={checkedFieldReviewItems}
          items={fieldReviewChecklistItems}
          onToggleItem={onToggleChecklistItem}
          t={t}
        />
      </div>
    </aside>
  );
}

function DisplaySettingsPanel({
  appZoomPercent,
  onResetZoom,
  onTextFieldModeChange,
  onThemeChange,
  onZoomIn,
  onZoomOut,
  selectedTextFieldMode,
  selectedTheme,
  chrome
}: {
  appZoomPercent: number;
  onResetZoom: () => void;
  onTextFieldModeChange: (mode: TextFieldDisplayMode) => void;
  onThemeChange: (theme: DisplayTheme) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  selectedTextFieldMode: TextFieldDisplayMode;
  selectedTheme: DisplayTheme;
  chrome: UiChromeTranslations;
}) {
  return (
    <details className="display-settings-panel" open>
      <summary>
        <span className="summary-label">{chrome.displaySettings.title}</span>
        <strong>{appZoomPercent}%</strong>
        <span aria-hidden="true" className="details-indicator">
          ▾
        </span>
      </summary>

      <div className="display-settings-body">
        <div className="display-setting-group">
          <span>{chrome.displaySettings.appZoom}</span>
          <div className="zoom-controls" aria-label={chrome.displaySettings.zoomControlsAria}>
            <button type="button" onClick={onZoomOut}>
              −
            </button>
            <strong aria-label={chrome.displaySettings.currentZoomAria}>{appZoomPercent}%</strong>
            <button type="button" onClick={onZoomIn}>
              +
            </button>
            <button type="button" onClick={onResetZoom}>
              {chrome.displaySettings.reset}
            </button>
          </div>
          <small>{chrome.displaySettings.ctrlWheelCopy}</small>
        </div>

        <div className="display-setting-group">
          <span>{chrome.displaySettings.theme}</span>
          <div className="theme-controls" aria-label={chrome.displaySettings.themeOptionsAria}>
            {displayThemes.map((theme) => (
              <button
                key={theme.id}
                className={theme.id === selectedTheme ? "active" : undefined}
                type="button"
                onClick={() => onThemeChange(theme.id)}
              >
                <span className={`theme-swatch ${theme.id}`} aria-hidden="true" />
                {chrome.displaySettings.themeLabels[theme.id]}
              </button>
            ))}
          </div>
          <small>{chrome.displaySettings.localStateCopy}</small>
        </div>

        <div className="display-setting-group text-display-setting">
          <span>{chrome.displaySettings.textFields}</span>
          <div className="text-mode-controls" aria-label={chrome.displaySettings.textFieldModeAria}>
            <label>
              <input
                checked={selectedTextFieldMode === "auto-fit"}
                name="text-field-display-mode"
                type="radio"
                onChange={() => onTextFieldModeChange("auto-fit")}
              />
              <span>{chrome.displaySettings.autoFit}</span>
            </label>
            <label>
              <input
                checked={selectedTextFieldMode === "compact-resize"}
                name="text-field-display-mode"
                type="radio"
                onChange={() => onTextFieldModeChange("compact-resize")}
              />
              <span>{chrome.displaySettings.compactResize}</span>
            </label>
          </div>
          <small>{chrome.displaySettings.textModeHelper}</small>
        </div>
      </div>
    </details>
  );
}

function EnvironmentUrlSettingsPanel({
  environmentUrlSettings,
  onEnvironmentUrlSettingChange,
  chrome
}: {
  environmentUrlSettings: ServiceNowEnvironmentUrlOverrides;
  onEnvironmentUrlSettingChange: (mode: Exclude<ServiceNowEnvironmentMode, "mock">, url: string) => void;
  chrome: UiChromeTranslations;
}) {
  const [draftUrls, setDraftUrls] = useState<ServiceNowEnvironmentUrlOverrides>(environmentUrlSettings);

  function updateDraftUrl(mode: Exclude<ServiceNowEnvironmentMode, "mock">, value: string) {
    setDraftUrls((current: ServiceNowEnvironmentUrlOverrides) => ({ ...current, [mode]: value }));
    onEnvironmentUrlSettingChange(mode, getNextEnvironmentUrlOverrideFromDraft(mode, value));
  }

  return (
    <details className="environment-url-settings-panel" open>
      <summary>
        <span className="summary-label">{chrome.environment.urlSettingsTitle}</span>
        <strong>{chrome.environment.localOnlyNoSecrets}</strong>
        <span aria-hidden="true" className="details-indicator">
          ▾
        </span>
      </summary>

      <div className="environment-url-settings-body">
        <p className="environment-url-safety-copy">{chrome.environment.urlSettingsSafetyCopy}</p>

        <div className="environment-url-card-grid">
          {serviceNowEnvironmentUrlSettingModes.map((mode) => {
            const copy = chrome.environment.configs[mode];
            const draftUrl = draftUrls[mode] ?? environmentUrlSettings[mode] ?? "";
            const validation = validateServiceNowEnvironmentUrlSetting(mode, draftUrl);
            const effectiveConfig = getServiceNowEnvironmentConfig(mode, environmentUrlSettings);
            const hasActiveCustomTarget = validation.allowed && Boolean(environmentUrlSettings[mode]);

            return (
              <article className="environment-url-card" key={mode}>
                <header>
                  <div>
                    <h4>{copy.label}</h4>
                    <p>{copy.description}</p>
                  </div>
                  <span>{hasActiveCustomTarget ? chrome.environment.activeCustomTarget : chrome.environment.builtInTargetHidden}</span>
                </header>

                <label className="field-block environment-url-field">
                  <span>{chrome.environment.customUrlLabel}</span>
                  <input
                    autoComplete="off"
                    inputMode="url"
                    placeholder={chrome.environment.customUrlPlaceholder}
                    type="url"
                    value={draftUrl}
                    onChange={(event) => updateDraftUrl(mode, event.currentTarget.value)}
                  />
                </label>

                <p className={validation.allowed ? "environment-url-validation accepted" : "environment-url-validation blocked"}>
                  {validation.allowed
                    ? `${chrome.environment.validationAccepted}: ${validation.host}`
                    : `${chrome.environment.validationBlocked}: ${formatEnvironmentUrlValidationReason(validation.reason)}`}
                </p>

                <dl className="environment-url-gate-list">
                  <div>
                    <dt>{chrome.environment.validationAccepted}</dt>
                    <dd>{validation.allowed ? validation.host : chrome.environment.builtInTargetHidden}</dd>
                  </div>
                  <div>
                    <dt>{chrome.environment.submitPolicy}</dt>
                    <dd>{effectiveConfig.requiresExplicitApprovalBeforeRealSubmit ? chrome.environment.explicitApprovalRequired : chrome.environment.noRealSubmit}</dd>
                  </div>
                  <div>
                    <dt>Shadow only</dt>
                    <dd>{effectiveConfig.shadowOnly ? "true" : "false"}</dd>
                  </div>
                  <div>
                    <dt>Real submit capability</dt>
                    <dd>{effectiveConfig.allowsRealSubmit ? "approval-gated" : "disabled"}</dd>
                  </div>
                </dl>

                <p className="environment-url-local-copy">{chrome.environment.localOnlyNoSecrets}</p>
                <p className="environment-url-gate-copy">{chrome.environment.writeGateUnchanged}</p>
              </article>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function formatEnvironmentUrlValidationReason(reason: string): string {
  switch (reason) {
    case "no-url":
      return "no URL set";
    case "invalid-url":
      return "invalid URL";
    case "https-required":
      return "HTTPS required";
    case "credentials-in-url-denied":
      return "credentials in URL denied";
    case "sensitive-url-component-denied":
      return "query/hash/sys_id/token/session/cookie payload denied";
    case "service-now-host-required":
      return "host must be a ServiceNow host or approved non-routable placeholder";
    case "mock-url-denied":
      return "mock mode cannot set a URL";
    default:
      return reason;
  }
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
  language,
  monitoredGroupIds,
  muted,
  onAcknowledge,
  onMonitoredGroupToggle,
  onMute,
  onSelectedStateChange,
  selectedState,
  t
}: {
  acknowledged: boolean;
  language: LanguageCode;
  monitoredGroupIds: HighSeverityMonitorGroup[];
  muted: boolean;
  onAcknowledge: () => void;
  onMonitoredGroupToggle: (groupId: HighSeverityMonitorGroup) => void;
  onMute: () => void;
  onSelectedStateChange: (state: HighSeverityState) => void;
  selectedState: HighSeverityState;
  t: UiTranslations;
}) {
  const selectedFakeState = highSeveritySimulatorStates[selectedState];
  const voiceReminder = getHighSeverityVoiceReminder(selectedState, language, monitoredGroupIds);
  const alertStatus =
    selectedState === "normal"
      ? t.highSeverityMonitor.alertInactiveStatus
      : voiceReminder.alarmEnabled
        ? t.highSeverityMonitor.alertEnabledStatus
        : t.highSeverityMonitor.alertSuppressedStatus;

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

        <section className="severity-monitor-group-settings" aria-label={t.highSeverityMonitor.monitoredGroupsTitle}>
          <h4>{t.highSeverityMonitor.monitoredGroupsTitle}</h4>
          <p>{t.highSeverityMonitor.monitoredGroupsHelper}</p>
          <div className="severity-monitor-group-list">
            {highSeverityMonitorGroups.map((group) => (
              <label key={group.id}>
                <input
                  type="checkbox"
                  checked={monitoredGroupIds.includes(group.id)}
                  onChange={() => onMonitoredGroupToggle(group.id)}
                />
                <span>{group.label}</span>
              </label>
            ))}
          </div>
        </section>

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
            <dt>{t.highSeverityMonitor.monitorGroupLabel}</dt>
            <dd>{voiceReminder.monitoredGroupLabel}</dd>
          </div>
          <div>
            <dt>{t.highSeverityMonitor.alertStatusLabel}</dt>
            <dd>{alertStatus}</dd>
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

        <section className={`severity-voice-preview ${selectedState}`} aria-label="Local high severity voice reminder preview">
          <strong>{voiceReminder.voiceText}</strong>
          <p>{voiceReminder.policyText}</p>
          {voiceReminder.suppressionText ? <small>{voiceReminder.suppressionText}</small> : null}
          <small>{voiceReminder.previewSafetyText}</small>
        </section>
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
            className={
              item.id === selectedItemId ? "queue-item queue-item-card selected" : "queue-item queue-item-card"
            }
            type="button"
            onClick={() => onSelectItem(item.id)}
          >
            <div className="queue-item-main">
              <span className="queue-time">{item.receivedAt}</span>
              <strong>{item.subject}</strong>
              <span>{item.requesterLabel}</span>
            </div>
            <div className="queue-item-meta">
              <span className="source-channel-badge">{item.sourceChannel}</span>
              <span className={`status-badge ${statusClassName(item.status)}`}>{item.status}</span>
            </div>
            <span className="language-mode-line">
              {item.sourceLanguage} · {item.draftLanguageMode}
            </span>
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

function ServiceDeskWorkflowPanel({
  onPrepareCopyDraft,
  preview
}: {
  onPrepareCopyDraft: (label: string, text: string) => void;
  preview: ServiceDeskWorkflowPreview;
}) {
  const row = preview.excelDryRunRowPreview.row;
  const workbookArtifact = useMemo(() => buildExcelDryRunWorkbookArtifact(row), [row]);
  const workbookMetadataCopy = buildWorkbookArtifactMetadataCopy(workbookArtifact);

  return (
    <section className="workflow-preview-panel" aria-labelledby="workflow-preview-title">
      <header className="workflow-preview-header">
        <div>
          <p className="eyebrow">Workflow Stage</p>
          <h3 id="workflow-preview-title">Service Desk workflow preview</h3>
          <p>{preview.safety.message}</p>
        </div>
        <div className="workflow-channel-pair" aria-label="Raw intake source and mapped ServiceNow channel">
          <div>
            <span>Raw Intake Source</span>
            <strong>{preview.rawIntakeSource}</strong>
          </div>
          <div>
            <span>ServiceNow Channel</span>
            <strong>{preview.mappedServiceNowChannel}</strong>
          </div>
        </div>
      </header>

      <ol className="workflow-stage-list">
        {preview.workflowStages.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ol>

      <div className="workflow-preview-grid">
        <section className="workflow-mini-panel" aria-labelledby="contact-confirmation-title">
          <h4 id="contact-confirmation-title">Contact / confirmation state</h4>
          <strong>{preview.confirmationState.status}</strong>
          <p>{preview.confirmationState.summary}</p>
        </section>

        <section className="workflow-mini-panel" aria-labelledby="incident-mapping-title">
          <h4 id="incident-mapping-title">Incident draft field mapping</h4>
          <dl className="workflow-field-list">
            <div>
              <dt>Issue Type</dt>
              <dd>Incident</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{preview.incidentDraftMapping.category}</dd>
            </div>
            <div>
              <dt>Subcategory</dt>
              <dd>{preview.incidentDraftMapping.subcategory}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{preview.incidentDraftMapping.priority}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="routing-plan-panel" aria-labelledby="routing-plan-title">
        <h4 id="routing-plan-title">Routing Plan</h4>
        <div className="routing-stage-grid">
          <article>
            <h5>Stage 1 — Service Desk Handling</h5>
            <dl>
              <div>
                <dt>Owner team</dt>
                <dd>{preview.routingPlan.stage1.ownerTeam}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{preview.routingPlan.stage1.status}</dd>
              </div>
              <div>
                <dt>Action</dt>
                <dd>{preview.routingPlan.stage1.action}</dd>
              </div>
            </dl>
          </article>
          <article>
            <h5>Stage 2 — Final Assignment</h5>
            <dl>
              <div>
                <dt>Final assignment group</dt>
                <dd>{preview.routingPlan.stage2.assignmentGroup}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{preview.routingPlan.stage2.reason}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section className="work-notes-plan-panel" aria-labelledby="work-notes-plan-title">
        <h4 id="work-notes-plan-title">Work Notes Plan</h4>
        <p>{preview.workNotesPlan.summary}</p>
        <p className="workflow-warning">{preview.workNotesPlan.warning}</p>
      </section>

      <section className="excel-row-preview-panel" aria-labelledby="excel-row-preview-title">
        <div className="excel-row-header">
          <div>
            <h4 id="excel-row-preview-title">Excel Dry-run Row Preview</h4>
            <p>{preview.excelDryRunRowPreview.safetyCopy}</p>
          </div>
          <div className="excel-copy-actions" aria-label="Local workflow copy actions">
            <button type="button" onClick={() => onPrepareCopyDraft("workflow CSV row", preview.csvRow)}>
              Copy CSV Row
            </button>
            <button
              type="button"
              onClick={() => onPrepareCopyDraft("workflow Markdown summary", preview.markdownSummary)}
            >
              Copy Markdown Summary
            </button>
          </div>
        </div>

        <dl className="excel-row-grid">
          {Object.entries(row).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <section className="xlsx-artifact-panel" aria-labelledby="xlsx-artifact-title">
          <div className="excel-row-header">
            <div>
              <h4 id="xlsx-artifact-title">Local XLSX Dry-run Artifact</h4>
              <p>{workbookArtifact.safetyCopy}</p>
            </div>
            <div className="excel-copy-actions" aria-label="Local XLSX dry-run actions">
              <button type="button" onClick={() => downloadWorkbookArtifact(workbookArtifact)}>
                Download Local XLSX Dry-run
              </button>
              <button type="button" onClick={() => onPrepareCopyDraft("XLSX metadata", workbookMetadataCopy)}>
                Copy XLSX Metadata
              </button>
            </div>
          </div>
          <dl className="excel-row-grid xlsx-artifact-grid">
            <div>
              <dt>Artifact filename</dt>
              <dd>{workbookArtifact.fileName}</dd>
            </div>
            <div>
              <dt>MIME</dt>
              <dd>{workbookArtifact.mimeType}</dd>
            </div>
            <div>
              <dt>Sheet name</dt>
              <dd>{workbookArtifact.sheetName}</dd>
            </div>
            <div>
              <dt>Artifact byte size</dt>
              <dd>{workbookArtifact.bytes.byteLength}</dd>
            </div>
          </dl>
        </section>

        <div className="workflow-preview-text-grid">
          <label className="field-block">
            <span>Local CSV Row</span>
            <textarea readOnly rows={3} value={preview.csvRow} />
          </label>
          <label className="field-block">
            <span>Local Markdown Summary</span>
            <textarea readOnly rows={3} value={preview.markdownSummary} />
          </label>
        </div>
      </section>
    </section>
  );
}

function buildWorkbookArtifactMetadataCopy(artifact: ExcelDryRunWorkbookArtifact): string {
  return [
    "## Local XLSX Dry-run Artifact",
    "",
    `- Artifact filename: ${artifact.fileName}`,
    `- MIME: ${artifact.mimeType}`,
    `- Sheet name: ${artifact.sheetName}`,
    `- Artifact byte size: ${artifact.bytes.byteLength}`,
    `- Safety: ${artifact.safetyCopy}`
  ].join("\n");
}

function downloadWorkbookArtifact(artifact: ExcelDryRunWorkbookArtifact): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const arrayBuffer = new ArrayBuffer(artifact.bytes.byteLength);
  new Uint8Array(arrayBuffer).set(artifact.bytes);
  const blob = new Blob([arrayBuffer], { type: artifact.mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = artifact.fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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
    case "Phone call":
      return "manual_paste";
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
  settings,
  chrome,
  language
}: {
  onPresetChange: (presetId: DraftTemplatePresetId) => void;
  onTemplateChange: (fieldName: keyof DraftTemplateSettings, value: string) => void;
  selectedPresetId: DraftTemplatePresetId;
  settings: DraftTemplateSettings;
  chrome: UiChromeTranslations;
  language: LanguageCode;
}) {
  const presets = getDraftTemplatePresets(language);
  const selectedPreset = getDraftTemplatePreset(language, selectedPresetId);

  return (
    <details className="template-settings-panel">
      <summary>
        <span className="summary-label">{chrome.templateSettings.title}</span>
        <strong>{selectedPreset.label}</strong>
        <span aria-hidden="true" className="details-indicator">
          ▾
        </span>
      </summary>

      <div className="template-settings-body">
        <p className="template-safety-copy">{chrome.templateSettings.safetyCopy}</p>

        <div className="field-block template-preset-field">
          <span>{chrome.templateSettings.presetLabel}</span>
          <div className="template-preset-buttons" aria-label={chrome.templateSettings.presetAria}>
            {presets.map((preset) => (
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
          <small>{chrome.templateSettings.switchCopy}</small>
        </div>

        <div className="template-editor-grid">
          <label className="field-block">
            <span>{chrome.templateSettings.descriptionTemplate}</span>
            <textarea
              rows={6}
              value={settings.descriptionTemplate}
              onChange={(event) => onTemplateChange("descriptionTemplate", event.currentTarget.value)}
            />
            <small>{chrome.templateSettings.descriptionHelper}</small>
          </label>

          <label className="field-block">
            <span>{chrome.templateSettings.workNotesTemplate}</span>
            <textarea
              rows={6}
              value={settings.workNotesTemplate}
              onChange={(event) => onTemplateChange("workNotesTemplate", event.currentTarget.value)}
            />
            <small>{chrome.templateSettings.workNotesHelper}</small>
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
  chrome,
  onSelectedModeChange,
  selectedMode,
  t
}: {
  chrome: UiChromeTranslations;
  onSelectedModeChange: (mode: ServiceNowEnvironmentMode) => void;
  selectedMode: ServiceNowEnvironmentMode;
  t: UiTranslations;
}) {
  const selectedEnvironmentCopy = chrome.environment.configs[selectedMode];

  return (
    <section className="environment-panel" aria-labelledby="environment-title">
      <header className="environment-header">
        <div>
          <p className="eyebrow">{t.environmentEyebrow}</p>
          <h3 id="environment-title">{t.environmentTitle}</h3>
          <p>{chrome.environment.panelCopy}</p>
        </div>
        <div className="environment-current">
          <span>{chrome.environment.currentMode}</span>
          <strong>{selectedEnvironmentCopy.label}</strong>
        </div>
      </header>

      <div className="environment-selector" aria-label={chrome.environment.selectorAria}>
        {serviceNowEnvironmentConfigs.map((config) => (
          <button
            key={config.mode}
            className={config.mode === selectedMode ? "environment-button active" : "environment-button"}
            type="button"
            onClick={() => onSelectedModeChange(config.mode)}
          >
            {chrome.environment.configs[config.mode].label}
          </button>
        ))}
      </div>

      <div className="environment-grid">
        {serviceNowEnvironmentConfigs.map((config) => (
          <EnvironmentCard config={config} key={config.mode} selected={config.mode === selectedMode} chrome={chrome} />
        ))}
      </div>
    </section>
  );
}

function EnvironmentCard({
  chrome,
  config,
  selected
}: {
  chrome: UiChromeTranslations;
  config: ServiceNowEnvironmentConfig;
  selected: boolean;
}) {
  const environmentCopy = chrome.environment.configs[config.mode];

  return (
    <article className={selected ? "environment-card selected" : "environment-card"}>
      <div className="environment-card-title-row">
        <h4>{environmentCopy.label}</h4>
        <span>{environmentCopy.safetyLabel}</span>
        {selected ? <span>{chrome.environment.selected}</span> : null}
      </div>
      <p>{environmentCopy.description}</p>
      {config.url ? (
        <div className="environment-target-safety">
          <code>{chrome.environment.urlHidden}</code>
          <small>{chrome.environment.noRawClickableLink}</small>
        </div>
      ) : (
        <code>{chrome.environment.noTargetUrl}</code>
      )}
      <dl>
        <div>
          <dt>{chrome.environment.credentialPolicy}</dt>
          <dd>
            <code>{config.credentialPolicy}</code>
            {config.credentialPolicy === "manual-login-only"
              ? ` · ${chrome.environment.manualLoginRequired}`
              : ` · ${chrome.environment.noCredentialsRequired}`}
          </dd>
        </div>
        <div>
          <dt>{chrome.environment.ignoredLocalRuntimePath}</dt>
          <dd>{config.localRuntimeDirectory}</dd>
        </div>
        <div>
          <dt>{chrome.environment.submitPolicy}</dt>
          <dd>{config.allowsRealSubmit ? chrome.environment.explicitApprovalRequired : chrome.environment.noRealSubmit}</dd>
        </div>
      </dl>
      <ul>
        {environmentCopy.safetyNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </article>
  );
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
    <details className="field-review-checklist">
      <summary>
        <div className="field-review-summary-title">
          <span className="eyebrow">{t.checklistEyebrow}</span>
          <strong id="field-review-title">{t.checklistSummaryLabel}</strong>
          <span>{t.checklistTitle}</span>
        </div>
        <div className="field-review-progress" aria-label={t.checklistProgressAria}>
          <strong>
            {checkedItemIds.length}/{items.length}
          </strong>
          <span>{t.checklistReviewedLocally}</span>
        </div>
        <span aria-hidden="true" className="details-indicator">
          ▾
        </span>
      </summary>

      <div className="field-review-body" aria-labelledby="field-review-title">
        <p className="field-review-intro">{t.checklistIntroRequired}</p>
        <p className="field-review-intro">{t.checklistIntroQuality}</p>

        <div className="field-reference-strip" aria-label={t.checklistReferenceAria}>
          <div>
            <span>{t.checklistRequiredReferenceLabel}</span>
            <p>{t.checklistRequiredReferenceFields}</p>
          </div>
          <div>
            <span>{t.checklistSupportingFieldsLabel}</span>
            <p>{t.checklistSupportingFields}</p>
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
                <span>{t.checklistItemLabels[item.id] ?? item.label}</span>
              </label>
            </li>
          ))}
        </ol>

        <p className="field-review-safety">{t.checklistSafetyCopy}</p>
      </div>
    </details>
  );
}

function MockServiceNowForm({
  chrome,
  draft,
  fillConfirmed,
  item,
  t
}: {
  chrome: UiChromeTranslations;
  draft: TicketDraft;
  fillConfirmed: boolean;
  item: DemoQueueItem;
  t: UiTranslations;
}) {
  const mockForm = chrome.mockForm;
  const notSet = mockForm.notSet;

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

      <div className="servicenow-frame" aria-label={mockForm.frameAria}>
        <div className="servicenow-toolbar">
          <div>
            <strong>{mockForm.toolbarTitle}</strong>
            <small>{t.mockDemoStamp}</small>
          </div>
          <span>{fillConfirmed ? t.mockReadyStatus : t.mockLockedStatus}</span>
          <span>{t.mockDisabledStatus}</span>
        </div>

        <div className="servicenow-actionbar" aria-label={mockForm.actionbarAria}>
          {Object.entries(mockForm.actions).map(([actionId, actionLabel]) => (
            <button disabled key={actionId} type="button">
              {actionLabel}
            </button>
          ))}
          <span>{mockForm.disabledUnavailable}</span>
        </div>

        <div className="servicenow-tabs" aria-label={mockForm.tabsAria}>
          <span className="active">{mockForm.details}</span>
          <span>{mockForm.notes}</span>
          <span>{mockForm.relatedSearch}</span>
        </div>

        <div className="mock-form-grid">
          <MockFormField label={mockForm.fields.requester} required value={item.requesterLabel} />
          <MockFormField label={mockForm.fields.category} required value={draft.category?.value ?? notSet} />
          <MockFormField label={mockForm.fields.location} required value="Demo location / sanitized" />
          <MockFormField label={mockForm.fields.channel} required value={item.sourceChannel} />
          <MockFormField label={mockForm.fields.impact} required value={fieldValue(draft.impact, notSet)} />
          <MockFormField label={mockForm.fields.urgency} required value={fieldValue(draft.urgency, notSet)} />
          <MockFormField label={mockForm.fields.assignmentGroup} required value={fieldValue(draft.assignmentGroup, notSet)} />
          <MockFormField label={mockForm.fields.priority} value={fieldValue(draft.priority, notSet)} />
        </div>

        <MockFormField label={mockForm.fields.shortDescription} required value={draft.shortDescription.value} wide />
        <MockFormField label={mockForm.fields.description} value={draft.description.value} wide multiline />
        <MockFormField label={mockForm.fields.workNotes} value={draft.workNotes.value} wide multiline />

        <div className="mock-submit-row">
          <button disabled type="button">
            {mockForm.submitDisabled}
          </button>
          <span>{mockForm.finalSubmitCopy}</span>
        </div>
      </div>
    </section>
  );
}

function ControlledQaSingleTicketSmokePanel({
  approvalPhrase,
  onApprovalPhraseChange,
  onWriteActionChange,
  writeAction,
  plan
}: {
  approvalPhrase: string;
  onApprovalPhraseChange: (value: string) => void;
  onWriteActionChange: (value: QaManualFillWriteAction) => void;
  writeAction: QaManualFillWriteAction;
  plan: QaSingleTicketSmokePlan;
}) {
  const statusText =
    plan.status === "ready-for-manual-fill"
      ? "Ready for manual fill only"
      : `Blocked: ${plan.gateDecision.reason}`;

  return (
    <section className="qa-smoke-panel" aria-labelledby="qa-smoke-title">
      <header className="qa-smoke-header">
        <div>
          <p className="eyebrow">Manual-fill assisted QA smoke</p>
          <h2 id="qa-smoke-title">Controlled QA single-ticket smoke</h2>
          <p>
            This does NOT submit, save, update, close, launch browser automation, call ServiceNow APIs, or write
            ServiceNow.
          </p>
        </div>
        <strong className={plan.status === "ready-for-manual-fill" ? "qa-smoke-status ready" : "qa-smoke-status"}>
          {statusText}
        </strong>
      </header>

      <div className="qa-smoke-summary-grid">
        <div>
          <span>Current environment mode</span>
          <strong>{plan.mode}</strong>
        </div>
        <div>
          <span>QA/dev target host</span>
          <strong>{plan.targetHost ?? "not available"}</strong>
        </div>
        <div>
          <span>Requested write action</span>
          <label className="qa-smoke-write-action-select">
            <span className="sr-only">Requested write action</span>
            <select
              value={writeAction}
              onChange={(event) => onWriteActionChange(event.currentTarget.value as QaManualFillWriteAction)}
            >
              {plan.writeActionApprovalPhrases.map((item) => (
                <option key={item.action} value={item.action}>
                  {item.label} — {item.action}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <span>Required approval phrase for selected action</span>
          <code>{plan.requiredApprovalPhrase}</code>
        </div>
      </div>

      <section className="qa-smoke-safe-scope" aria-labelledby="qa-safe-scope-title">
        <h3 id="qa-safe-scope-title">First smoke safe scope</h3>
        <ul>
          <li>Dry-run first: review the local field mapping and Excel row preview only.</li>
          <li>Manual copy only: Alan copies or types values; the app never fills ServiceNow.</li>
          <li>Save-only readiness: Submit, Update, and Close remain deferred to a later checkpoint.</li>
        </ul>
      </section>

      <label className="qa-smoke-approval">
        <span>Local approval phrase</span>
        <input
          autoComplete="off"
          placeholder={plan.requiredApprovalPhrase}
          value={approvalPhrase}
          onChange={(event) => onApprovalPhraseChange(event.currentTarget.value)}
        />
      </label>

      <section className="qa-smoke-approval-matrix" aria-labelledby="qa-approval-phrases-title">
        <h3 id="qa-approval-phrases-title">Action-specific approval phrases</h3>
        <p>Each real write action needs its own exact Alan phrase. One approval never covers another action.</p>
        <dl>
          {plan.writeActionApprovalPhrases.map((item) => (
            <div key={item.action}>
              <dt>{item.label}</dt>
              <dd>
                <code>{item.phrase}</code>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="qa-smoke-stop-rules" aria-labelledby="qa-stop-rules-title">
        <h3 id="qa-stop-rules-title">Stop rules</h3>
        <ul>
          {plan.stopRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <ul className="qa-smoke-rules">
        <li>Mock/prod shadow blocked.</li>
        <li>QA/dev missing phrase blocked.</li>
        <li>QA/dev exact phrase + complete mapping -&gt; ready for manual fill only.</li>
      </ul>

      {plan.missingRequiredFields.length > 0 ? (
        <p className="qa-smoke-missing">Missing required mapping: {plan.missingRequiredFields.join(", ")}</p>
      ) : (
        <p className="qa-smoke-missing">Required mapping complete.</p>
      )}

      <div className="qa-smoke-field-preview" aria-label="Controlled QA smoke field mapping preview">
        {plan.fieldMappings.map((mapping) => (
          <div key={mapping.key}>
            <span>{mapping.label}</span>
            <strong>{mapping.value}</strong>
          </div>
        ))}
      </div>

      <dl className="qa-smoke-audit-preview" aria-label="Privacy-safe audit preview">
        <div>
          <dt>Timestamp</dt>
          <dd>{plan.privacySafeAuditPreview.timestamp}</dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{plan.privacySafeAuditPreview.mode}</dd>
        </div>
        <div>
          <dt>Language</dt>
          <dd>{plan.privacySafeAuditPreview.language}</dd>
        </div>
        <div>
          <dt>Template preset</dt>
          <dd>{plan.privacySafeAuditPreview.templatePreset}</dd>
        </div>
        <div>
          <dt>Action state</dt>
          <dd>{plan.privacySafeAuditPreview.actionState}</dd>
        </div>
      </dl>

      <p className="qa-smoke-safety-copy">
        Manual fill only. Single ticket only. No browser DOM filling, no ServiceNow API, no auto-submit, no bulk create,
        and productionWriteAllowed=false.
      </p>
    </section>
  );
}

function getSdaOperatorApi(): SdaOperatorApi | undefined {
  return (globalThis as unknown as { sdaOperator?: SdaOperatorApi }).sdaOperator;
}

function operatorActionLabel(action: "launch" | "verify" | "autofill"): string {
  switch (action) {
    case "launch":
      return "Start QA Chromium";
    case "verify":
      return "Verify current Incident";
    case "autofill":
      return "Autofill current Incident";
  }
}

function operatorStatusFromResponse(
  action: "launch" | "verify" | "autofill",
  response: OperatorRuntimeResponse
): OperatorActionStatus {
  if (action === "launch") {
    const status = response.launch?.status ?? "unknown";
    return response.ok
      ? { label: "QA Chromium ready", tone: "success", details: "A dedicated Chromium window is open. Log in and open an Incident form, then click Verify current Incident." }
      : { label: "QA Chromium blocked", tone: "blocked", details: response.launch?.blockedReason ?? status };
  }
  if (action === "verify") {
    const plannedCount = response.defaultPlan?.plannedFields?.length ?? 0;
    return response.ok
      ? { label: "Incident form verified", tone: "success", details: `${plannedCount} fields are ready for QA autofill. Review the preview, then click Autofill current Incident.` }
      : { label: "Verify blocked", tone: "blocked", details: response.fieldInspection?.blockedReason ?? response.defaultPlan?.blockedReason ?? "Current page is not a verified QA Incident form." };
  }
  const filledCount = response.runtime?.filledFields?.length ?? 0;
  return response.ok
    ? { label: "Autofill completed", tone: "success", details: `${filledCount} fields were filled. Review manually in ServiceNow. This tool did not Save, Submit, Update, Resolve, Close, upload, email, or call ServiceNow API.` }
    : { label: "Autofill blocked", tone: "blocked", details: response.runtime?.blockedReason ?? response.defaultPlan?.blockedReason ?? "No field was changed." };
}

function QaOperatorRuntimePanel({
  busyAction,
  cdpEndpointReady,
  draft,
  lastResponse,
  mode,
  onAutofill,
  onLaunchBrowser,
  onVerify,
  status,
  targetLabel
}: {
  busyAction: "launch" | "verify" | "autofill" | null;
  cdpEndpointReady: boolean;
  draft: TicketDraft;
  lastResponse: OperatorRuntimeResponse | null;
  mode: ServiceNowEnvironmentMode;
  onAutofill: () => void;
  onLaunchBrowser: () => void;
  onVerify: () => void;
  status: OperatorActionStatus;
  targetLabel: string;
}) {
  const plannedFields = lastResponse?.defaultPlan?.plannedFields ?? [];
  const filledFields = lastResponse?.runtime?.filledFields ?? [];
  const canUseRuntime = mode === "qa" || mode === "dev";
  const verifyDisabled = !canUseRuntime || !cdpEndpointReady || busyAction !== null;
  const autofillDisabled = !canUseRuntime || !cdpEndpointReady || busyAction !== null;

  return (
    <section className="qa-autofill-panel qa-smoke-panel operator-runtime-panel" aria-labelledby="operator-runtime-title">
      <header className="qa-smoke-header">
        <div>
          <p className="eyebrow">Windows operator runtime</p>
          <h2 id="operator-runtime-title">ServiceNow Automation operator</h2>
          <p>
            This is the AIA SD-tool style path: prepare the draft here, open a dedicated QA Chromium, autofill QA Incident fields,
            then you manually review and decide whether to submit in ServiceNow.
          </p>
        </div>
        <strong className={status.tone === "success" ? "qa-smoke-status ready" : "qa-smoke-status"}>
          {status.label}
        </strong>
      </header>

      <div className="qa-smoke-summary-grid qa-autofill-summary-grid">
        <div>
          <span>Runtime target</span>
          <strong>{targetLabel}</strong>
        </div>
        <div>
          <span>CDP browser</span>
          <strong>{cdpEndpointReady ? "Ready" : "Not started"}</strong>
        </div>
        <div>
          <span>Mode</span>
          <strong>{mode}</strong>
        </div>
        <div>
          <span>Submit boundary</span>
          <strong>Human-only</strong>
        </div>
      </div>

      <section className="qa-smoke-safe-scope" aria-labelledby="operator-safe-scope-title">
        <h3 id="operator-safe-scope-title">What the tool will do now</h3>
        <ul>
          <li>Open a dedicated Chromium profile for QA/dev ServiceNow.</li>
          <li>Read the current Incident form structure and build a default-field plan.</li>
          <li>Autofill Requester, Category, Subcategory, Location, Channel, Impact, Urgency, Assignment group, Assigned to, Short description, Description, and Work notes when present.</li>
          <li>Never click Save, Submit, Update, Resolve, Close, upload attachment, send email, or call the ServiceNow API.</li>
        </ul>
      </section>

      <div className="qa-smoke-field-preview" aria-label="Operator draft preview">
        <div>
          <span>Requester</span>
          <strong>Zheng Zhu</strong>
        </div>
        <div>
          <span>Category / Subcategory</span>
          <strong>Desktop / Password reset</strong>
        </div>
        <div>
          <span>Assignment</span>
          <strong>SN YAGEO Service Desk - China / Zheng Zhu</strong>
        </div>
        <div>
          <span>Work notes prefix</span>
          <strong>SD_China</strong>
        </div>
        <div>
          <span>Short description</span>
          <strong>{fieldValue(draft.shortDescription)}</strong>
        </div>
        <div>
          <span>Work notes length</span>
          <strong>{fieldValue(draft.workNotes).length} chars</strong>
        </div>
      </div>

      <div className="qa-smoke-actions">
        <button disabled={!canUseRuntime || busyAction !== null} type="button" onClick={onLaunchBrowser}>
          {busyAction === "launch" ? "Starting..." : "1. Start QA Chromium"}
        </button>
        <button disabled={verifyDisabled} type="button" onClick={onVerify}>
          {busyAction === "verify" ? "Verifying..." : "2. Verify current Incident"}
        </button>
        <button disabled={autofillDisabled} type="button" onClick={onAutofill}>
          {busyAction === "autofill" ? "Autofilling..." : "3. Autofill current Incident"}
        </button>
      </div>

      <p className="qa-smoke-safety-copy">{status.details}</p>

      {plannedFields.length > 0 ? (
        <section className="qa-smoke-stop-rules" aria-labelledby="operator-planned-fields-title">
          <h3 id="operator-planned-fields-title">Last verified autofill plan</h3>
          <ul>
            {plannedFields.map((field) => (
              <li key={field.key ?? field.label}>
                {field.label}: {field.value ?? `${field.valueLength ?? 0} chars`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {filledFields.length > 0 ? (
        <section className="qa-smoke-stop-rules" aria-labelledby="operator-filled-fields-title">
          <h3 id="operator-filled-fields-title">Filled fields from last run</h3>
          <ul>
            {filledFields.map((field) => (
              <li key={field.key ?? field.label}>
                {field.label}: {field.valueLength ?? 0} chars
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function QaTextFieldAutofillPanel({
  approvalPhrase,
  dedicatedProfileConfirmed,
  mode,
  onApprovalPhraseChange,
  onDedicatedProfileConfirmedChange,
  onQaIsolationConfirmedChange,
  plan,
  qaIsolationConfirmed
}: {
  approvalPhrase: string;
  dedicatedProfileConfirmed: boolean;
  mode: ServiceNowEnvironmentMode;
  onApprovalPhraseChange: (value: string) => void;
  onDedicatedProfileConfirmedChange: (value: boolean) => void;
  onQaIsolationConfirmedChange: (value: boolean) => void;
  plan: QaAutofillPlan;
  qaIsolationConfirmed: boolean;
}) {
  const requiredPhrase = mode === "qa" || mode === "dev" ? getRequiredQaAutofillApprovalPhrase(mode) : getRequiredQaAutofillApprovalPhrase("qa");
  const statusText =
    plan.status === "ready-for-autofill"
      ? "Selector-verified plan ready; no browser fill from this panel"
      : `Blocked: ${plan.blockedReason}`;
  const panelStopMessage =
    plan.status === "ready-for-autofill"
      ? plan.stopMessage
      : "Planning gate only: browser text-field execution remains blocked until a later selector-verified execution slice is reviewed.";

  return (
    <section className="qa-autofill-panel qa-smoke-panel" aria-labelledby="qa-autofill-title">
      <header className="qa-smoke-header">
        <div>
          <p className="eyebrow">QA browser-assisted text-field autofill planning gate</p>
          <h2 id="qa-autofill-title">QA browser-assisted text-field autofill planning gate</h2>
          <p>
            Planning/review only in this slice. Text fields only: Short description, Description, Work notes.
            Autofill approval does not approve Save, Submit, Update, or Close.
          </p>
        </div>
        <strong className={plan.status === "ready-for-autofill" ? "qa-smoke-status ready" : "qa-smoke-status"}>
          {statusText}
        </strong>
      </header>

      <section className="qa-smoke-safe-scope" aria-labelledby="qa-autofill-safe-scope-title">
        <h3 id="qa-autofill-safe-scope-title">First autofill planning safe scope</h3>
        <ul>
          <li>QA/dev only, single ticket only, dedicated/tool-owned Chromium profile only, manual login only.</li>
          <li>Text fields only: Short description, Description, Work notes.</li>
          <li>Selector verification is mandatory; missing or mismatched selectors keep this panel blocked.</li>
          <li>No ServiceNow API, bulk fill, browser artifacts, auth-material export, or external AI on QA content.</li>
        </ul>
      </section>

      <div className="qa-smoke-summary-grid qa-autofill-summary-grid">
        <div>
          <span>Current environment mode</span>
          <strong>{mode}</strong>
        </div>
        <div>
          <span>Allowed action</span>
          <strong>Planning/review only</strong>
        </div>
        <div>
          <span>Write actions</span>
          <strong>No Save / Submit / Update / Close</strong>
        </div>
        <div>
          <span>Required approval phrase</span>
          <code>{requiredPhrase}</code>
        </div>
      </div>

      <label className="qa-smoke-approval qa-autofill-confirmation">
        <input
          checked={qaIsolationConfirmed}
          type="checkbox"
          onChange={(event) => onQaIsolationConfirmedChange(event.currentTarget.checked)}
        />
        <span>QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.</span>
      </label>

      <label className="qa-smoke-approval qa-autofill-confirmation">
        <input
          checked={dedicatedProfileConfirmed}
          type="checkbox"
          onChange={(event) => onDedicatedProfileConfirmedChange(event.currentTarget.checked)}
        />
        <span>Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.</span>
      </label>

      <label className="qa-smoke-approval">
        <span>Exact autofill approval phrase</span>
        <input
          autoComplete="off"
          placeholder={requiredPhrase}
          value={approvalPhrase}
          onChange={(event) => onApprovalPhraseChange(event.currentTarget.value)}
        />
      </label>

      <div className="qa-smoke-field-preview" aria-label="QA autofill text-field review preview">
        {(plan.allowedFields.length > 0 ? plan.allowedFields : qaAutofillFieldFallbacks).map((field) => (
          <div key={field.key}>
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </div>
        ))}
      </div>

      <section className="qa-smoke-stop-rules" aria-labelledby="qa-autofill-stop-rules-title">
        <h3 id="qa-autofill-stop-rules-title">Autofill stop rules</h3>
        <ul>
          {plan.stopRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <p className="qa-smoke-safety-copy">{panelStopMessage}</p>
    </section>
  );
}

const qaAutofillFieldFallbacks = [
  { key: "shortDescription", label: "Short description", value: "Blocked until the safe gate is ready." },
  { key: "description", label: "Description", value: "Blocked until the safe gate is ready." },
  { key: "workNotes", label: "Work notes", value: "Blocked until the safe gate is ready." }
] as const;

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

function fieldValue(field: FieldDraft | undefined, fallback = "Not set"): string {
  return field?.value ?? fallback;
}

function statusClassName(status: DemoQueueStatus): string {
  return status.toLowerCase();
}

function buttonLabelForScenario(id: ManualPasteScenario["id"]): string {
  switch (id) {
    case "vpn-issue":
      return "Load VPN QA Scenario";
    case "shared-mailbox-evidence":
      return "Load Evidence Demo";
    case "phone-confirmation":
      return "Load Phone Demo";
    case "self-service-normalization":
      return "Load Self-service Demo";
    case "remote-support-teams":
      return "Load Remote Support Demo";
    case "account-login-issue":
      return "Load Account/Login Demo";
  }
}
