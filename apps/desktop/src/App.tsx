import { type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent, useEffect, useMemo, useRef, useState } from "react";

import { demoManualPasteScenarios, type ManualPasteScenario } from "@servicenow-automation/adapters/browser";
import { generateMockTicketDraft } from "@servicenow-automation/ai";
import { demoKnowledgeArticles, searchKnowledgeArticles } from "@servicenow-automation/kb/browser";
import {
  getServiceNowEnvironmentConfig,
  serviceNowEnvironmentConfigs,
  validateServiceNowEnvironmentUrlSetting,
  validateServiceNowTargetUrl,
  type ServiceNowEnvironmentConfig,
  type ServiceNowEnvironmentMode,
  type ServiceNowEnvironmentUrlOverrides
} from "@servicenow-automation/profiles";
import {
  CapturedContextSchema,
  IntakeSourceKinds,
  buildExcelDryRunWorkbookArtifact,
  buildQaTextFieldAutofillPlan,
  buildServiceDeskWorkflowPreview,
  evaluateQaSingleTicketSmokePlan,
  getRequiredQaAutofillApprovalPhrase,
  normalizeSourceContextText,
  sourceAdapterRegistry,
  type CapturedContext,
  type ExcelDryRunWorkbookArtifact,
  type FieldDraft,
  type IntakeSourceKind,
  type ProjectProfile,
  type QaAutofillPlan,
  type QaIncidentDefaultScenario,
  type QaManualFillWriteAction,
  type QaSingleTicketSmokePlan,
  type ServiceDeskWorkflowPreview,
  type SourceType,
  type TicketDraft
} from "@servicenow-automation/core";

const serviceDeskOwnerTeam = "Service Desk team";

const profile: ProjectProfile = {
  id: "service-desk-demo",
  displayName: "Service Desk QA workspace",
  companyLabel: "Service Desk",
  defaultAssignmentGroup: serviceDeskOwnerTeam,
  categoryMappings: [
    { keywords: ["vpn", "remote access", "mfa prompt"], category: "Network", subcategory: "VPN" },
    { keywords: ["windows", "laptop", "blue screen", "slow"], category: "Hardware", subcategory: "Endpoint" },
    { keywords: ["login", "password", "mfa", "account"], category: "Access", subcategory: "Account access" }
  ],
  assignmentMappings: [
    { keywords: ["vpn", "remote access"], assignmentGroup: "Service Desk Network" },
    { keywords: ["windows", "laptop"], assignmentGroup: "Service Desk Endpoint" },
    { keywords: ["login", "password", "mfa", "account"], assignmentGroup: "Service Desk Access" }
  ],
  kbSources: [],
  demoMode: true
};

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

type OperatorAction = "launch" | "verify" | "autofill";

type QaValidationRunEntry = {
  id: string;
  timestamp: string;
  action: OperatorAction;
  status: "ok" | "blocked" | "timeout" | "error";
  sanitizedSummary: string;
  plannedFieldCount?: number;
  filledFieldCount?: number;
};

export const OPERATOR_RUNTIME_ACTION_TIMEOUT_MS = 90_000;

type OperatorRuntimeRequest = {
  mode: ServiceNowEnvironmentMode;
  targetUrl?: string;
  cdpEndpoint?: string;
  approvalPageFingerprint?: string;
  draft?: TicketDraft;
  scenario?: QaIncidentDefaultScenario;
  routeOutAssignmentGroup?: string;
  qaIsolationConfirmed?: boolean;
  dedicatedProfileConfirmed?: boolean;
};

type OperatorRuntimeResponse = {
  ok?: boolean;
  launch?: {
    status?: string;
    blockedReason?: string;
    cdpEndpoint?: string;
    runtimeLogPath?: string;
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
  autofillCurrentIncidentTextFields(request: OperatorRuntimeRequest): Promise<OperatorRuntimeResponse>;
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
    announcementCountLabel: string;
    speechPreviewStatusLabel: string;
    previewSpeechAction: string;
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
  { code: "zh-TW", label: "繁體中文" },
  { code: "es-ES", label: "Español" }
];

const englishFieldReviewChecklistTranslations = {
  checklistSummaryLabel: "Optional field checklist / Team rules",
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
    "Demo checklist only. Local state only. No real ServiceNow field fill, Save, Submit, Update, Resolve, Close, API call, browser automation, DOM inspection, screenshots, HAR, traces, sessions, or storage export.",
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
  checklistSummaryLabel: "可选字段检查清单 / 团队规则",
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
    "仅演示检查清单。仅本地状态。不会执行真实 ServiceNow 字段填充、Save、Submit、Update、Resolve、Close、API 调用、浏览器自动化、DOM 检查、截图、HAR、trace、session 或 storage 导出。",
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
  checklistSummaryLabel: "可選欄位檢查清單 / 團隊規則",
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
    "僅示範檢查清單。僅本地狀態。不會執行真實 ServiceNow 欄位填入、Save、Submit、Update、Resolve、Close、API 呼叫、瀏覽器自動化、DOM 檢查、截圖、HAR、trace、session 或 storage 匯出。",
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
  checklistSummaryLabel: "Lista opcional de campos / reglas del equipo",
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
    "Lista demo solamente. Estado local solamente. Sin relleno real de campos ServiceNow, Save, Submit, Update, Resolve, Close, llamada API, automatización de navegador, inspección DOM, capturas, HAR, trazas, sesiones ni exportación de almacenamiento.",
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
    runtimeEyebrow: "浏览器 / 安全",
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
      announcementCountLabel: "本地播报次数",
      speechPreviewStatusLabel: "本地语音预览状态",
      previewSpeechAction: "Preview local speech reminder",
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
    mockDisabledStatus: "演示模式下 Save / Submit / Update / Resolve / Close 不可用",
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
    runtimeEyebrow: "Browser / Safety",
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
      announcementCountLabel: "Local announcement count",
      speechPreviewStatusLabel: "Local speech preview status",
      previewSpeechAction: "Preview local speech reminder",
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
    mockDisabledStatus: "Save / Submit / Update / Resolve / Close unavailable in demo mode",
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
      announcementCountLabel: "本地播報次數",
      speechPreviewStatusLabel: "本地語音預覽狀態",
      previewSpeechAction: "Preview local speech reminder",
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
    mockDisabledStatus: "示範模式下 Save / Submit / Update / Resolve / Close 不可用",
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
      announcementCountLabel: "Conteo local de anuncios",
      speechPreviewStatusLabel: "Estado de vista previa de voz local",
      previewSpeechAction: "Preview local speech reminder",
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
    mockDisabledStatus: "Save / Submit / Update / Resolve / Close no disponibles en modo demo",
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
    value: "dedicated test browser prepared/planned; not launched by this panel"
  },
  { label: "Profile", value: "persistent/tool-owned model" },
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

export type HighSeveritySpeechLocale = "zh-CN" | "zh-TW" | "en-US" | "es-ES";

export type HighSeveritySpeechReminderPolicy = {
  severity: HighSeverityState;
  active: boolean;
  cadenceSeconds: number | null;
  maxAnnouncements: number | null;
  requiresManualStop: boolean;
  autoStops: boolean;
};

export type HighSeveritySpeechReminderState = {
  severity: HighSeverityState;
  announcementCount: number;
  acknowledged: boolean;
  muted: boolean;
};

export type HighSeveritySpeechReminderStatus = "ready" | "stopped" | "unsupported" | "spoken";

export type HighSeveritySpeechReminderDecision = {
  status: HighSeveritySpeechReminderStatus;
  locale: HighSeveritySpeechLocale;
  policy: HighSeveritySpeechReminderPolicy;
  announcementCount: number;
  reason: string;
};

export type HighSeveritySpeechUtteranceLike = {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

export type HighSeveritySpeechSynthesisLike = {
  speak: (utterance: HighSeveritySpeechUtteranceLike) => void;
  cancel?: () => void;
};

export type HighSeveritySpeechReminderPreviewOptions = {
  language: LanguageCode;
  reminder: HighSeverityVoiceReminder;
  state?: Partial<HighSeveritySpeechReminderState>;
  speechSynthesis?: HighSeveritySpeechSynthesisLike | null;
  utteranceFactory?: (text: string) => HighSeveritySpeechUtteranceLike;
  cancelBeforeSpeak?: boolean;
};

export function getHighSeveritySpeechLocale(language: LanguageCode): HighSeveritySpeechLocale {
  return language;
}

export function getHighSeveritySpeechReminderPolicy(severity: HighSeverityState): HighSeveritySpeechReminderPolicy {
  switch (severity) {
    case "p1":
      return {
        severity,
        active: true,
        cadenceSeconds: 60,
        maxAnnouncements: null,
        requiresManualStop: true,
        autoStops: false
      };
    case "p2":
      return {
        severity,
        active: true,
        cadenceSeconds: 300,
        maxAnnouncements: 3,
        requiresManualStop: false,
        autoStops: true
      };
    case "normal":
      return {
        severity,
        active: false,
        cadenceSeconds: null,
        maxAnnouncements: 0,
        requiresManualStop: false,
        autoStops: true
      };
  }
}

export function getHighSeveritySpeechReminderDecision(
  reminder: HighSeverityVoiceReminder,
  language: LanguageCode,
  state: Partial<HighSeveritySpeechReminderState> = {}
): HighSeveritySpeechReminderDecision {
  const policy = getHighSeveritySpeechReminderPolicy(reminder.severity);
  const announcementCount = state.announcementCount ?? 0;
  const locale = getHighSeveritySpeechLocale(language);

  if (!policy.active || reminder.severity === "normal") {
    return { status: "stopped", locale, policy, announcementCount, reason: "No active P1/P2 demo alarm." };
  }
  if (!reminder.alarmEnabled) {
    return {
      status: "stopped",
      locale,
      policy,
      announcementCount,
      reason: "The fake event group is not monitored, so no local speech reminder is emitted."
    };
  }
  if (state.acknowledged) {
    return { status: "stopped", locale, policy, announcementCount, reason: "Reminder acknowledged by the local user." };
  }
  if (state.muted) {
    return { status: "stopped", locale, policy, announcementCount, reason: "Demo reminders are muted locally." };
  }
  if (policy.maxAnnouncements !== null && announcementCount >= policy.maxAnnouncements) {
    return {
      status: "stopped",
      locale,
      policy,
      announcementCount,
      reason: `${reminder.severity.toUpperCase()} demo reminder auto-stopped after ${policy.maxAnnouncements} announcements.`
    };
  }

  return { status: "ready", locale, policy, announcementCount, reason: reminder.previewSafetyText };
}

function defaultHighSeveritySpeechUtterance(text: string): HighSeveritySpeechUtteranceLike {
  if (typeof SpeechSynthesisUtterance === "undefined") {
    return { text };
  }
  return new SpeechSynthesisUtterance(text);
}

function browserSpeechSynthesis(): HighSeveritySpeechSynthesisLike | null {
  if (typeof globalThis.speechSynthesis === "undefined") {
    return null;
  }
  return {
    cancel: () => globalThis.speechSynthesis.cancel(),
    speak: (utterance) => globalThis.speechSynthesis.speak(utterance as SpeechSynthesisUtterance)
  };
}

export function previewHighSeveritySpeechReminder({
  language,
  reminder,
  state = {},
  speechSynthesis,
  utteranceFactory = defaultHighSeveritySpeechUtterance,
  cancelBeforeSpeak = true
}: HighSeveritySpeechReminderPreviewOptions): HighSeveritySpeechReminderDecision {
  const decision = getHighSeveritySpeechReminderDecision(reminder, language, state);
  if (decision.status !== "ready") {
    return decision;
  }

  const synthesis = speechSynthesis === undefined ? browserSpeechSynthesis() : speechSynthesis;
  if (!synthesis || typeof synthesis.speak !== "function") {
    return {
      ...decision,
      status: "unsupported",
      reason: "Browser speech synthesis is unavailable; show the local reminder text instead."
    };
  }

  const utterance = utteranceFactory(reminder.voiceText);
  utterance.lang = decision.locale;
  utterance.rate = reminder.severity === "p1" ? 1 : 0.96;
  utterance.pitch = 1;
  utterance.volume = 1;
  if (cancelBeforeSpeak && typeof synthesis.cancel === "function") {
    synthesis.cancel();
  }
  synthesis.speak(utterance);

  return {
    ...decision,
    status: "spoken",
    announcementCount: decision.announcementCount + 1,
    reason: "Local browser speech preview started from fake demo data only."
  };
}

const displayThemes: { id: DisplayTheme }[] = [{ id: "warm" }, { id: "cool" }];
type WorkbenchEnvironmentMode = Extract<ServiceNowEnvironmentMode, "qa" | "production-shadow">;
const visibleServiceNowEnvironmentModes: WorkbenchEnvironmentMode[] = ["qa", "production-shadow"];
const serviceNowEnvironmentUrlSettingModes: WorkbenchEnvironmentMode[] = visibleServiceNowEnvironmentModes;

function toWorkbenchEnvironmentMode(mode: ServiceNowEnvironmentMode): WorkbenchEnvironmentMode {
  return mode === "qa" ? "qa" : "production-shadow";
}

function isQaWorkbenchMode(mode: WorkbenchEnvironmentMode): boolean {
  return mode === "qa";
}

type WorkbenchIconName =
  | "app"
  | "inbox"
  | "workbench"
  | "knowledge"
  | "history"
  | "search"
  | "settings"
  | "source"
  | "summary"
  | "draft"
  | "shield"
  | "globe"
  | "chevron";

export type OperatorWorkbenchPageKey = "inbox" | "workbench" | "knowledge" | "history" | "search";

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
    savedSignInReusable: string;
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
    actions: Record<"save" | "submit" | "update" | "resolve" | "close", string>;
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
  settingsButton: "Settings",
  noAttachmentsCopy:
    "No attachments, .msg/.eml parsing, live channel content, or external AI with real content is used.",
  settingsSidebar: {
    ariaLabel: "Centralized settings",
    eyebrow: "Centralized settings",
    title: "Settings",
    closeAriaLabel: "Close settings panel",
    closeButton: "Close"
  },
  displaySettings: {
    title: "Display Settings",
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
    title: "Templates / Settings",
    safetyCopy: "Local templates only — no external storage or ServiceNow write.",
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
      "Start in QA for controlled testing. Production is visible for read-only target review; other internal modes stay hidden until a separate safety review changes that boundary.",
    currentMode: "Current mode",
    selectorAria: "ServiceNow environment modes",
    selected: "Selected",
    noTargetUrl: "No target configured",
    urlHidden: "Target value hidden for privacy",
    noRawClickableLink: "No raw clickable target link. Controlled browser launch requires allowlist and safety checks.",
    credentialPolicy: "Credential policy",
    manualLoginRequired: "User-controlled login",
    savedSignInReusable: "ServiceNow saved sign-in can be reused from the dedicated test profile.",
    noCredentialsRequired: "No credentials required",
    ignoredLocalRuntimePath: "Ignored local runtime path",
    submitPolicy: "Write policy",
    explicitApprovalRequired: "Explicit approval required before any real QA write",
    noRealSubmit: "No real submit from this mode",
    urlSettingsTitle: "ServiceNow target settings",
    urlSettingsSafetyCopy:
      "Local state only. Paste only authorized QA landing targets; do not include credentials, record identifiers, tokens, cookies, or ticket-specific deep links.",
    customUrlLabel: "Paste replacement target",
    customUrlPlaceholder: "Paste authorized QA landing target; hidden after validation",
    localOnlyNoSecrets: "No credentials are stored. Target settings are local UI state only; no Graph, ServiceNow API, browser write, or credential storage is performed.",
    validationAccepted: "Accepted target stored hidden",
    validationBlocked: "Blocked target setting",
    activeCustomTarget: "Custom target active for this session; raw value hidden",
    builtInTargetHidden: "Built-in/default target active; raw target value stays hidden.",
    writeGateUnchanged: "Write-safety rules unchanged: Autofill never clicks state-changing ServiceNow controls; human review remains required.",
    configs: {
      mock: {
        label: "QA workspace",
        description: "Hidden local fixture target; not shown in the operator workbench selector.",
        safetyLabel: "Local fixture",
        safetyNotes: [
          "No ServiceNow login is required.",
          "State-changing controls remain disabled.",
          "Use this only for internal regression checks."
        ]
      },
      qa: {
        label: "QA workspace",
        description: "Authorized ServiceNow QA target for controlled test-ticket rehearsal.",
        safetyLabel: "QA — No write until #22",
        safetyNotes: [
          "Manual login required. Credentials are never stored in source code.",
          "Browser sessions stay in ignored local runtime folders.",
          "Any real QA Save/Submit/Update/Resolve/Close action requires explicit operator approval."
        ]
      },
      dev: {
        label: "QA workspace",
        description: "Reserved internal test target; hidden from the operator workbench selector.",
        safetyLabel: "QA — No write until #22",
        safetyNotes: [
          "Manual login required. Credentials are never stored in source code.",
          "Browser sessions stay in ignored local runtime folders.",
          "Any real QA Save/Submit/Update/Resolve/Close action requires explicit operator approval."
        ]
      },
      "production-shadow": {
        label: "Production",
        description: "Production comparison/read-only target; browser actions stay disabled outside QA unless a separate safety review approves them.",
        safetyLabel: "No write path",
        safetyNotes: [
          "Production is visible for selection and target review, but browser actions remain disabled outside QA.",
          "No state-changing production path is implemented.",
          "Use QA-only browser controls for Start QA Chromium, Verify, and Autofill.",
          "Upgrade to a separate safety review before considering any production write capability."
        ]
      }
    }
  },
  mockForm: {
    frameAria: "Mock ServiceNow Incident new record form fields",
    toolbarTitle: "Incident | New record — Mock preview",
    actionbarAria: "Disabled mock ServiceNow actions",
    actions: { save: "Save", submit: "Submit", update: "Update", resolve: "Resolve", close: "Close" },
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
      "Final ServiceNow submit must remain a deliberate human action. No real record is saved, submitted, updated, resolved, or closed.",
    notSet: "Not set"
  }
};

const uiChromeTranslations: Record<LanguageCode, UiChromeTranslations> = {
  "en-US": englishChromeTranslations,
  "zh-CN": {
    ...englishChromeTranslations,
    settingsButton: "设置",
    noAttachmentsCopy: "不会使用附件、.msg/.eml 解析、实时渠道内容，也不会使用带真实内容的外部 AI。",
    settingsSidebar: {
      ariaLabel: "集中设置",
      eyebrow: "集中设置",
      title: "设置",
      closeAriaLabel: "关闭设置面板",
      closeButton: "关闭"
    },
    displaySettings: {
      ...englishChromeTranslations.displaySettings,
      title: "显示设置",
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
      title: "模板 / 设置",
      safetyCopy: "本地模板，仅本地保存；不会写入外部存储或 ServiceNow。",
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
      panelCopy: "从 QA 开始受控测试；生产环境可见但仅用于只读目标检查；其他内部环境保持隐藏，除非单独安全评审改变边界。",
      currentMode: "当前模式",
      selectorAria: "ServiceNow 环境模式",
      selected: "已选择",
      noTargetUrl: "未配置目标 URL",
      urlHidden: "完整 ServiceNow URL 已为隐私隐藏",
      noRawClickableLink: "不显示原始可点击目标链接。受控浏览器启动需要 URL allowlist 和安全检查。",
      credentialPolicy: "凭据策略",
      manualLoginRequired: "用户自行控制登录",
      savedSignInReusable: "ServiceNow 已保存登录状态可从专用测试 Profile 复用。",
      noCredentialsRequired: "无需凭据",
      ignoredLocalRuntimePath: "已忽略的本地浏览器目录",
      submitPolicy: "提交策略",
      explicitApprovalRequired: "任何真实 QA 提交前必须明确批准",
      noRealSubmit: "此模式不会真实提交",
      urlSettingsTitle: "ServiceNow 环境 URL 设置",
      urlSettingsSafetyCopy:
        "仅本地状态。只粘贴已授权的 QA 落地目标；不要包含凭据、记录标识符、token、cookie 或具体工单深链。",
      customUrlLabel: "自定义 URL",
      customUrlPlaceholder: "粘贴已授权的 ServiceNow 落地页 URL",
      localOnlyNoSecrets: "URL 设置只是本地 UI 状态；不会执行 Graph、ServiceNow API、浏览器写入或凭据保存。",
      validationAccepted: "已接受的 ServiceNow host",
      validationBlocked: "已阻止的 URL 设置",
      activeCustomTarget: "本会话正在使用自定义目标",
      builtInTargetHidden: "内置/默认目标处于活动状态；原始目标 URL 保持隐藏，直到安全自定义 URL 通过校验。",
      writeGateUnchanged: "写入安全规则不变：自动填充不会点击会改变 ServiceNow 状态的控件，仍需要人工审核。",
      configs: {
        mock: {
          label: "Mock 演示",
          description: "离线确定性演示：使用 ManualPasteAdapter、MockAIProvider、演示 KB 和 mock 表单填充。",
          safetyLabel: "MOCK — 安全演示",
          safetyNotes: ["不需要 ServiceNow 登录。", "演示模式下 Submit 保持禁用。", "用于作品集演示和快速回归检查。"]
        },
        qa: {
          label: "QA 工作区",
          description: "授权的 ServiceNow QA 目标，用于受控测试工单预演。",
          safetyLabel: "QA — #22 前不写入",
          safetyNotes: ["必须手动登录。凭据绝不写入源码。", "浏览器会话保留在已忽略的本地运行目录。", "任何真实 QA 提交都需要操作员明确批准。"]
        },
        dev: {
          label: "QA 工作区",
          description: "内部测试目标；不会显示在操作工作台选择器中。",
          safetyLabel: "QA — #22 前不写入",
          safetyNotes: ["必须手动登录。凭据绝不写入源码。", "浏览器会话保留在已忽略的本地运行目录。", "任何真实 QA 提交都需要操作员明确批准。"]
        },
        "production-shadow": {
          label: "生产",
          description: "生产只读/对照目标；除非通过单独安全评审，否则 QA 以外的浏览器操作保持禁用。",
          safetyLabel: "无写入路径",
          safetyNotes: ["隐藏的非 QA 工作区在这里不可用。", "没有实现会改变状态的路径。", "此工作台仅使用 QA 浏览器控件。", "考虑任何非 QA 写入能力前必须升级到单独安全评审。"]
        }
      }
    },
    mockForm: {
      ...englishChromeTranslations.mockForm,
      frameAria: "Mock ServiceNow Incident 新记录表单字段",
      toolbarTitle: "Incident | 新记录 — Mock 预览",
      actionbarAria: "已禁用的 mock ServiceNow 操作",
      actions: { save: "保存", submit: "提交", update: "更新", resolve: "解决", close: "关闭" },
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
      finalSubmitCopy: "最终 ServiceNow 提交必须始终是人工有意操作。不会保存、提交、更新、解决或关闭真实记录。",
      notSet: "未设置"
    }
  },
  "zh-TW": {
    ...englishChromeTranslations,
    settingsButton: "設定",
    noAttachmentsCopy: "不會使用附件、.msg/.eml 解析、即時渠道內容，也不會把真實內容交給外部 AI。",
    settingsSidebar: {
      ariaLabel: "集中設定",
      eyebrow: "集中設定",
      title: "設定",
      closeAriaLabel: "關閉設定面板",
      closeButton: "關閉"
    },
    displaySettings: {
      ...englishChromeTranslations.displaySettings,
      title: "顯示設定",
      appZoom: "應用縮放",
      zoomControlsAria: "應用縮放控制",
      currentZoomAria: "目前應用縮放",
      reset: "重設",
      ctrlWheelCopy: "Ctrl + 滑鼠滾輪也會調整本地應用縮放。",
      theme: "主題",
      themeOptionsAria: "顯示主題選項",
      themeLabels: { warm: "暖色", cool: "冷色" },
      localStateCopy: "顯示設定只是本地 React 狀態，不會持久化。",
      textFields: "文字欄位",
      textFieldModeAria: "文字欄位顯示模式",
      autoFit: "自動適應文字區",
      compactResize: "緊湊 + 顯示縮放把手",
      textModeHelper: "自動適應會給長內容更多空間；緊湊模式會保持欄位較短，並顯示更明顯的右下角縮放提示。"
    },
    templateSettings: {
      ...englishChromeTranslations.templateSettings,
      title: "模板 / 設定",
      safetyCopy: "本地模板，僅本地保存；不會寫入外部儲存或 ServiceNow。",
      presetLabel: "模板預設",
      presetAria: "模板預設",
      switchCopy: "切換預設會替換兩個本地模板文字區。",
      descriptionTemplate: "描述模板",
      workNotesTemplate: "工作備註模板",
      descriptionHelper: "使用 {{draft_content}} 放置按語言生成的描述內容。",
      workNotesHelper: "使用 {{draft_content}} 放置按語言生成的工作備註。"
    },
    environment: {
      ...englishChromeTranslations.environment,
      urlSettingsSafetyCopy:
        "僅本地狀態。只貼上已授權的 QA 落地目標；不要包含憑證、記錄識別碼、token、cookie 或具體工單深連結。",
      customUrlLabel: "自訂 URL",
      customUrlPlaceholder: "貼上已授權的 ServiceNow 落地頁 URL",
      localOnlyNoSecrets: "不會保存憑證。URL 設定只是本地 UI 狀態；不會執行 Graph、ServiceNow API、瀏覽器寫入或憑證保存。",
      validationAccepted: "已接受的 ServiceNow host",
      validationBlocked: "已阻止的 URL 設定",
      explicitApprovalRequired: "任何真實 QA 提交前必須明確批准",
      writeGateUnchanged: "寫入安全規則不變：自動填入不會點擊會改變 ServiceNow 狀態的控制項，仍需要人工審核。"
    }
  },
  "es-ES": {
    ...englishChromeTranslations,
    settingsButton: "Configuración",
    noAttachmentsCopy: "No se usan adjuntos, parsing .msg/.eml, contenido vivo de canales ni IA externa con contenido real.",
    settingsSidebar: {
      ariaLabel: "Configuración centralizada",
      eyebrow: "Configuración centralizada",
      title: "Configuración",
      closeAriaLabel: "Cerrar panel de configuración",
      closeButton: "Cerrar"
    },
    displaySettings: {
      ...englishChromeTranslations.displaySettings,
      title: "Configuración de visualización",
      appZoom: "Zoom de la app",
      zoomControlsAria: "Controles de zoom de la app",
      currentZoomAria: "Zoom actual de la app",
      reset: "Restablecer",
      ctrlWheelCopy: "Ctrl + rueda del mouse también cambia el zoom local de la app.",
      theme: "Tema",
      themeOptionsAria: "Opciones de tema de visualización",
      themeLabels: { warm: "Cálido", cool: "Frío" },
      localStateCopy: "La configuración de visualización es solo estado React local y no se persiste.",
      textFields: "Campos de texto",
      textFieldModeAria: "Modo de visualización de campos de texto",
      autoFit: "Áreas de texto autoajustables",
      compactResize: "Compacto + tirador visible de redimensionado",
      textModeHelper: "Autoajuste da más espacio al contenido largo. Compacto mantiene campos más bajos y muestra mejor el tirador inferior derecho."
    },
    templateSettings: {
      ...englishChromeTranslations.templateSettings,
      title: "Plantillas / Configuración",
      safetyCopy: "Plantillas locales solamente — sin almacenamiento externo ni escritura en ServiceNow.",
      presetLabel: "Preset de plantilla",
      presetAria: "Presets de plantilla",
      switchCopy: "Cambiar preset reemplaza ambas áreas de texto locales.",
      descriptionTemplate: "Plantilla de descripción",
      workNotesTemplate: "Plantilla de notas de trabajo",
      descriptionHelper: "Usa {{draft_content}} para colocar la descripción generada con idioma local.",
      workNotesHelper: "Usa {{draft_content}} para colocar las notas de trabajo generadas con idioma local."
    },
    environment: {
      ...englishChromeTranslations.environment,
      urlSettingsSafetyCopy:
        "Estado local solamente. Pega solo destinos QA autorizados; no incluyas credenciales, identificadores de registro, tokens, cookies ni enlaces profundos de tickets.",
      customUrlLabel: "URL personalizada",
      customUrlPlaceholder: "Pega una URL inicial autorizada de ServiceNow",
      localOnlyNoSecrets: "No se almacenan credenciales. La URL es solo estado UI local; no hay Graph, API de ServiceNow, escritura del navegador ni almacenamiento de credenciales.",
      validationAccepted: "Host ServiceNow aceptado",
      validationBlocked: "Configuración de URL bloqueada",
      explicitApprovalRequired: "Aprobación explícita requerida antes de cualquier envío QA real",
      writeGateUnchanged: "Las reglas de seguridad de escritura no cambian: Autofill nunca pulsa controles que cambian estado en ServiceNow; la revisión humana sigue siendo obligatoria."
    }
  }
};


const englishOperatorWorkbenchCopy = {
  productSubtitle: "Operator Workbench",
  statusAria: "Workbench status controls",
  layoutAria: "Operator workbench columns",
  languageAria: "Display language",
  languageChip: "EN / 中文",
  nav: {
    primaryAria: "Primary workbench navigation",
    workbenchSections: "Workbench sections",
    inbox: "Inbox",
    workbench: "Workbench",
    knowledge: "Knowledgebase",
    history: "History",
    search: "Search",
    settings: "Settings",
    collapseSidebar: "Collapse left sidebar",
    expandSidebar: "Expand left sidebar",
    collapseSidebarShort: "Collapse",
    expandSidebarShort: "Expand",
    loadingFeed: "Loading feed",
    intakeQueue: "Intake queue",
    todoList: "Todo list",
    historySection: "History",
    environmentControls: "Environment controls"
  },
  environment: {
    qa: "QA workspace",
    production: "Production"
  },
  target: {
    configured: "QA target hidden",
    missing: "Target missing"
  },
  search: {
    label: "Search",
    aria: "Search local tickets",
    placeholder: "Search tickets...",
    shortcut: "Ctrl K"
  },
  list: {
    today: "Today",
    yesterday: "Yesterday",
    recent: "Recent",
    active: "active",
    archived: "archived",
    new: "New",
    inReview: "In Review",
    waiting: "Waiting",
    drafted: "Drafted",
    done: "Done",
    skipped: "Skipped",
    noHistory: "No recent reviewed copies yet."
  },
  cards: {
    selectedSource: "Selected source detail",
    cleanedSummary: "Cleaned summary",
    incidentDraft: "Incident draft",
    selectedSourceEmpty: "Select a source from the left queue to begin.",
    sourceLoading: "Preparing source content...",
    sourceError: "Source preparation encountered an issue.",
    cleanedSummaryEmpty: "The cleaned summary will appear after normalization.",
    incidentDraftEmpty: "The draft stays blank until a source is selected.",
    guidedDemoPathEmpty: "The guided path appears after the draft is ready.",
    kbRecommendationsEmpty: "Local KB recommendations appear after the draft is generated.",
    monthlyExcelEmpty: "Items stay local-only until the monthly queue is ready.",
    source: "Source",
    received: "Received",
    language: "Language",
    sourcePreview: "Sanitized source preview",
    sanitized: "Sanitized",
    draft: "Draft",
    issue: "Issue",
    impact: "Impact",
    context: "Context",
    contextValue: (removedLineCount: number) =>
      removedLineCount > 0 ? `${removedLineCount} sensitive source lines removed locally.` : "No sensitive source lines detected locally.",
    shortDescription: "Short description",
    description: "Description",
    workNotes: "Work notes",
    saveDraft: "Hold for review",
    createLocalDraft: "Copy draft text",
    localOnly: "Manual review only. ServiceNow Save/Submit/Update/Resolve/Close stays manual."
  },
  runtime: {
    eyebrow: "Browser rail",
    title: "Browser actions",
    collapseRuntime: "Collapse browser action rail",
    expandRuntime: "Expand browser action rail",
    collapsedTitle: "Browser actions",
    collapsedHint: "Collapsed. Expand to access Start QA Chromium, Verify, and Autofill.",
    statusReady: "Ready",
    statusBusy: "Working",
    statusBlocked: "Blocked",
    statusSuccess: "Verified",
    statusVerified: "Current ticket verified; Autofill can fill allowed text fields only.",
    statusCdpReady: "Browser connection ready; verify the current Incident.",
    statusWaiting: "Waiting for the dedicated test browser profile to connect.",
    startTitle: "Start QA Chromium",
    startDescription: "Opens a dedicated test browser profile for the QA workspace so your ServiceNow sign-in can stay remembered; manual login remains yours.",
    starting: "Starting QA Chromium",
    verifyTitle: "Verify current Incident",
    verifyDescription: "Confirms the visible Incident form is safe and current before any autofill.",
    verifying: "Verifying current Incident",
    autofillTitle: "Autofill current Incident",
    autofillDescription: "Fills allowed text fields only after the page is verified. It never saves or submits.",
    autofilling: "Autofilling current Incident",
    readyChip: "Ready",
    waitingChip: "Waiting",
    disabledProductionReason: "Disabled: Production is read-only in this workbench; choose the QA workspace for Start QA Chromium, Verify, and Autofill.",
    disabledTargetReason: "Disabled: configure an allowed QA target in Settings first.",
    disabledBusyReason: "Disabled: another browser or step is still working.",
    startReadyReason: "Ready: opens a dedicated test browser profile for QA; saved sign-in can be reused.",
    verifyCdpReason: "Disabled: start QA Chromium and wait until the browser connection is ready.",
    verifyReadyReason: "Ready: browser connection is ready; verify the current Incident.",
    autofillVerifyReason: "Disabled: verify the current Incident first.",
    autofillReadyReason: "Ready: Autofill can fill allowed text fields only; you still review manually.",
    autofillCompletedFeedback: (filledCount: number) =>
      `Autofill completed: ${filledCount} text fields filled. No Save, Submit, Update, Resolve, Close, upload, email, or ServiceNow API was used.`,
    runtimeStatus: "Browser status",
    resetRuntimeState: "Reset browser readiness",
    resetRuntimeStateHelper: "Safe to retry: clears only local browser connection/page-check readiness; no ServiceNow action is taken.",
    sanitizedMode: "Sanitized mode",
    cdpLabel: "Browser connection",
    cdpReady: "Ready",
    cdpWaiting: "Waiting",
    sanitizedEvidence: "Sanitized browser status evidence available.",
    noEvidence: "No browser status evidence yet; only sanitized status is shown.",
    safetyTitle: "Safety note",
    safetyBoundaryTitle: "Safety boundary",
    environmentControlsTitle: "Environment controls",
    safetyNote: "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.",
    browserDisconnected: "Browser: disconnected",
    browserConnecting: "Browser: connecting",
    browserConnected: "Browser: connected",
    browserError: "Browser: error",
    whatChanged: {
      title: "What changed in this round",
      summary: "This workbench has been hardened through multiple rounds of automated checks and manual validation since the last release. Every test of the automation proves it is safe and visible before any fill action.",
      whyRepeatedValidation: "Manual checks are repeated because every ServiceNow session, browser profile, and ticket page is different. The app always validates the current page before any fill, so a stolen session or wrong window cannot trigger accidental data entry.",
      whatIsAutomated: "Automated: browser launch, page verification, text-field checks, and autofill of allowed Short description, Description, and Work notes fields.",
      whatIsHumanOnly: "Human-only: reading the ticket, judging its severity, typing not-allowed fields, saving, submitting, updating, resolving, closing, emailing, attachments, and any ServiceNow API write.",
      doesNotDo: [
        "This app does NOT save, submit, update, resolve, or close any ServiceNow record.",
        "It does NOT upload attachments, send emails, or trigger ServiceNow API writes.",
        "It does NOT access production data — it reads only the visible QA page in a dedicated browser profile.",
        "All automated actions are limited to text-field fills after a verified page check."
      ],
      footer: "Human reviews and manually submits in ServiceNow."
    }
  },
  settings: {
    ariaLabel: "Workbench settings",
    eyebrow: "Settings",
    title: "Settings",
    close: "Close",
    saveSettings: "Save settings",
    resetDisplay: "Reset display",
    footerNote: "Settings apply locally in this window. Browser safety rules are unchanged.",
    languageTitle: "Language",
    languageLabel: "Display language",
    languageHelper: "Switches app labels only; it does not change ticket content or ServiceNow data.",
    defaultEnvironment: "Default environment",
    defaultEnvironmentSelector: "Default environment selector",
    qaTestEnvironment: "QA workspace",
    productionEnvironment: "Production",
    environmentHelper: "Choose this workspace to use Start QA Chromium, Verify, and Autofill. Production remains read-only.",
    environmentBusyHelper: "Disabled: wait for the current browser step to finish before changing settings.",
    urlSettingsTitle: "ServiceNow target settings",
    compactSafety: "Only authorized landing targets are accepted. Secrets, record identifiers, tokens, cookies, query strings, and hash fragments stay blocked.",
    clearSavedSettings: "Clear saved settings",
    clearReady: "Ready: clears local target overrides and resets page-check/Autofill readiness.",
    clearDisabled: "Disabled: no saved settings to clear.",
    qaUrl: "QA URL",
    devUrl: "Dev URL",
    productionUrl: "Production URL",
    urlDescriptionQa: "Authorized QA landing page for controlled testing; the value is hidden after validation.",
    urlDescriptionProduction: "Production target remains read-only; Start QA Chromium, Verify, and Autofill stay unavailable outside QA.",
    qaSubmitPolicy: "QA fill requires Start, current-page check, and approved text-only autofill checks.",
    productionPolicy: "Production is read-only in this workbench; no automated write path is enabled.",
    activeCustomTarget: "Custom target active; raw value hidden",
    builtInTargetHidden: "Target value hidden",
    customUrlLabel: "Paste replacement target",
    acceptedTarget: "Accepted: target stored hidden for this session.",
    blockedTarget: "Blocked target setting",
    submitPolicy: "Write policy",
    validationReasons: {
      noUrl: "no target set",
      invalidUrl: "invalid target",
      httpsRequired: "HTTPS required",
      credentialsDenied: "credentials in target denied",
      sensitiveComponentDenied: "query/hash/record identifier/token/session/cookie payload denied",
      serviceNowHostRequired: "host must be a ServiceNow host or approved non-routable placeholder",
      mockUrlDenied: "offline fixture mode cannot set a target"
    }
  }
};

const operatorWorkbenchTranslations = {
  "en-US": englishOperatorWorkbenchCopy,
  "zh-CN": {
    ...englishOperatorWorkbenchCopy,
    productSubtitle: "操作工作台",
    statusAria: "工作台状态控件",
    layoutAria: "操作工作台列布局",
    languageAria: "显示语言",
    languageChip: "EN / 中文",
    nav: {
      primaryAria: "主要工作台导航",
      workbenchSections: "工作台区域",
      inbox: "收件箱",
      workbench: "工作台",
      knowledge: "知识库",
      history: "历史",
      search: "搜索",
      settings: "设置",
      collapseSidebar: "折叠左侧栏",
      expandSidebar: "展开左侧栏",
      collapseSidebarShort: "折叠",
      expandSidebarShort: "展开",
      loadingFeed: "加载动态",
      intakeQueue: "受理队列",
      todoList: "待办列表",
      historySection: "历史",
      environmentControls: "环境控件"
    },
    environment: { qa: "QA 工作区", production: "生产" },
    target: { configured: "QA 目标已隐藏", missing: "目标缺失" },
    search: { label: "搜索", aria: "搜索本地工单", placeholder: "搜索工单...", shortcut: "Ctrl K" },
    list: {
      today: "今天",
      yesterday: "昨天",
      recent: "最近",
      active: "活跃",
      archived: "已归档",
      new: "新建",
      inReview: "审核中",
      waiting: "等待",
      drafted: "已起草",
      done: "完成",
      skipped: "已跳过",
      noHistory: "还没有审核副本。"
    },
    cards: {
      selectedSource: "已选来源详情",
      cleanedSummary: "清理摘要",
      incidentDraft: "Incident 草稿",
      selectedSourceEmpty: "请从左侧队列中选择一个来源以开始。",
      sourceLoading: "正在准备来源内容...",
      sourceError: "来源准备过程中遇到问题。",
      cleanedSummaryEmpty: "清理摘要将在规范化后显示。",
      incidentDraftEmpty: "在选择来源之前，草稿将保持空白。",
      guidedDemoPathEmpty: "引导路径将在草稿准备好后显示。",
      kbRecommendationsEmpty: "本地知识库建议将在草稿生成后显示。",
      monthlyExcelEmpty: "项目将保持本地状态，直到月度队列准备就绪。",
      source: "来源",
      received: "收到时间",
      language: "语言",
      sourcePreview: "已清理来源预览",
      sanitized: "已清理",
      draft: "草稿",
      issue: "问题",
      impact: "影响",
      context: "上下文",
      contextValue: (removedLineCount: number) =>
        removedLineCount > 0 ? `已在本地移除 ${removedLineCount} 行敏感来源内容。` : "本地未检测到敏感来源行。",
      shortDescription: "短描述",
      description: "描述",
      workNotes: "工作备注",
      saveDraft: "等待审核",
      createLocalDraft: "复制草稿文本",
      localOnly: "仅供人工审核。ServiceNow 的 Save/Submit/Update/Resolve/Close 仍由人工执行。"
    },
    runtime: {
      eyebrow: "浏览器操作栏",
      title: "浏览器操作",
      collapseRuntime: "折叠浏览器操作栏",
      expandRuntime: "展开浏览器操作栏",
      collapsedTitle: "浏览器操作",
      collapsedHint: "已折叠。展开后可打开 QA Chromium、验证当前工单和自动填充允许字段。",
      statusReady: "就绪",
      statusBusy: "处理中",
      statusBlocked: "已阻止",
      statusSuccess: "已验证",
      statusVerified: "当前工单已验证；自动填充只能填写允许的文本字段。",
      statusCdpReady: "浏览器连接已准备好；可以验证当前 Incident。",
      statusWaiting: "等待单独的测试浏览器连接。",
      startTitle: "打开 QA Chromium",
      startDescription: "打开专用测试浏览器 Profile，可保留 ServiceNow 登录状态；登录仍由你手动完成。",
      starting: "正在打开 QA Chromium",
      verifyTitle: "验证当前 Incident",
      verifyDescription: "在自动填充前确认可见 Incident 表单安全且仍是当前页面。",
      verifying: "正在验证当前 Incident",
      autofillTitle: "自动填充当前 Incident",
      autofillDescription: "页面验证后只填写允许的文本字段。它不会保存或提交。",
      autofilling: "正在自动填充当前 Incident",
      readyChip: "就绪",
      waitingChip: "等待",
      disabledProductionReason: "禁用：生产环境在此工作台中保持只读；如需打开、验证、自动填充，请选择 QA 工作区。",
      disabledTargetReason: "禁用：请先在设置中配置允许的 QA 目标。",
      disabledBusyReason: "禁用：另一个浏览器或步骤仍在处理中。",
      startReadyReason: "就绪：打开专用 QA 测试浏览器 Profile；可复用已保存的登录状态。",
      verifyCdpReason: "禁用：请先打开 QA Chromium，并等待浏览器连接就绪。",
      verifyReadyReason: "就绪：浏览器连接已准备好，可以验证当前 Incident。",
      autofillVerifyReason: "禁用：请先验证当前 Incident。",
      autofillReadyReason: "就绪：自动填充只能填写允许的文本字段；仍需人工审核。",
      autofillCompletedFeedback: (filledCount: number) =>
        `自动填充已完成：已填写 ${filledCount} 个文本字段。没有执行 Save、Submit、Update、Resolve、Close、上传、邮件或 ServiceNow API。`,
      runtimeStatus: "浏览器状态",
      resetRuntimeState: "重置浏览器就绪状态",
      resetRuntimeStateHelper: "可安全重试：仅清除本地浏览器连接/检查状态；不会执行 ServiceNow 操作。",
      sanitizedMode: "已清理模式",
      cdpLabel: "浏览器连接",
      cdpReady: "就绪",
      cdpWaiting: "等待中",
      sanitizedEvidence: "仅显示已清理的浏览器状态证据。",
      noEvidence: "尚无浏览器状态证据；仅显示已清理状态。",
      safetyTitle: "安全说明",
      safetyBoundaryTitle: "安全边界",
      environmentControlsTitle: "环境控件",
      safetyNote: "AI 仅起草并填入允许的文字字段。人工审核并在 ServiceNow 中处理记录。",
      browserDisconnected: "浏览器：未连接",
      browserConnecting: "浏览器：连接中",
      browserConnected: "浏览器：已连接",
      browserError: "浏览器：错误",
      whatChanged: {
        title: "本轮更新内容",
        summary: "自上次发布以来，该工作台已通过多轮自动化检查和手动验证不断完善。每次自动化测试都证明在填充前的安全性和可见性。",
        whyRepeatedValidation: "每次 ServiceNow 会话、浏览器 Profile 和工单页面都不同，因此必须重复手动检查。应用始终在填充前验证当前页面，防止被盗会话或错误窗口触发意外数据录入。",
        whatIsAutomated: "已自动化：启动浏览器、页面验证、文本字段检查、允许字段（短描述、描述、工作备注）的自动填充。",
        whatIsHumanOnly: "仅人工操作：阅读工单、判断严重级别、输入不允许字段、保存、提交、更新、解决、关闭、发送邮件、附件以及任何 ServiceNow API 写入。",
        doesNotDo: [
          "此应用不会保存、提交、更新、解决或关闭任何 ServiceNow 记录。",
          "不会上传附件、发送邮件或触发 ServiceNow API 写入。",
          "不会访问生产数据——仅读取专用浏览器 Profile 中可见的 QA 页面。",
          "所有自动化操作仅限于页面验证后的文本字段填充。"
        ],
        footer: "由人工审核并在 ServiceNow 中手动提交。"
      }
    },
    settings: {
      ariaLabel: "工作台设置",
      eyebrow: "设置",
      title: "设置",
      close: "关闭",
      saveSettings: "保存设置",
      resetDisplay: "重置显示",
      footerNote: "设置仅应用于当前窗口。浏览器安全规则保持不变。",
      languageTitle: "语言",
      languageLabel: "显示语言",
      languageHelper: "只切换应用标签，不改变工单内容或 ServiceNow 数据。",
      defaultEnvironment: "默认环境",
      defaultEnvironmentSelector: "默认环境选择器",
      qaTestEnvironment: "QA 工作区",
      productionEnvironment: "生产环境",
      environmentHelper: "选择此工作区可使用启动、检查页面、自动填充。生产保持只读。",
      environmentBusyHelper: "禁用：请等待当前浏览器步骤完成后再更改设置。",
      urlSettingsTitle: "ServiceNow 目标设置",
      compactSafety: "只接受已授权落地目标。密钥、记录标识符、token、cookie、查询字符串和 hash 片段都会被阻止。",
      clearSavedSettings: "清除已保存设置",
      clearReady: "就绪：清除本地目标覆盖，并重置页面检查/自动填充就绪状态。",
      clearDisabled: "禁用：没有可清除的已保存设置。",
      qaUrl: "QA URL",
      devUrl: "Dev URL",
      productionUrl: "Production URL",
      urlDescriptionQa: "用于受控测试的授权 QA 落地页；检查后会隐藏该值。",
      urlDescriptionProduction: "生产目标保持只读；启动、检查页面、自动填充仅在 QA 中可用。",
      qaSubmitPolicy: "QA 填入需要先启动、检查当前工单页面，并限制为已批准文本字段。",
      productionPolicy: "此工作台中的生产环境保持只读；未启用任何自动写入路径。",
      activeCustomTarget: "自定义目标已启用；原始值已隐藏",
      builtInTargetHidden: "目标值已隐藏",
      customUrlLabel: "粘贴替换目标",
      acceptedTarget: "已接受：目标已隐藏保存用于本次会话。",
      blockedTarget: "已阻止的目标设置",
      submitPolicy: "写入策略",
      validationReasons: {
        noUrl: "未设置目标",
        invalidUrl: "目标无效",
        httpsRequired: "需要 HTTPS",
        credentialsDenied: "目标中禁止包含凭据",
        sensitiveComponentDenied: "禁止包含查询/hash/记录标识符/token/session/cookie 内容",
        serviceNowHostRequired: "host 必须是 ServiceNow host 或已批准的不可路由占位 host",
        mockUrlDenied: "离线夹具模式不能设置目标"
      }
    }
  },
  "zh-TW": {
    ...englishOperatorWorkbenchCopy,
    productSubtitle: "操作工作臺",
    statusAria: "工作臺狀態控制",
    layoutAria: "操作工作臺欄位布局",
    languageAria: "顯示語言",
    languageChip: "EN / 中文",
    nav: {
      primaryAria: "主要工作臺導覽",
      workbenchSections: "工作臺區域",
      inbox: "收件匣",
      workbench: "工作臺",
      knowledge: "知識庫",
      history: "歷史",
      search: "搜尋",
      settings: "設定",
      collapseSidebar: "收合左側欄",
      expandSidebar: "展開左側欄",
      collapseSidebarShort: "收合",
      expandSidebarShort: "展開",
      loadingFeed: "載入動態",
      intakeQueue: "受理佇列",
      todoList: "待辦清單",
      historySection: "歷史",
      environmentControls: "環境控制項"
    },
    environment: { qa: "QA 工作區", production: "生產" },
    target: { configured: "QA 目標已隱藏", missing: "目標缺失" },
    search: { label: "搜尋", aria: "搜尋本地工單", placeholder: "搜尋工單...", shortcut: "Ctrl K" },
    list: {
      today: "今天",
      yesterday: "昨天",
      recent: "最近",
      active: "進行中",
      archived: "已封存",
      new: "新建",
      inReview: "審核中",
      waiting: "等待",
      drafted: "已起草",
      done: "完成",
      skipped: "已略過",
      noHistory: "尚無審核副本。"
    },
    cards: {
      selectedSource: "已選來源詳細",
      cleanedSummary: "清理後摘要",
      incidentDraft: "Incident 草稿",
      selectedSourceEmpty: "請從左側佇列中選擇一個來源以開始。",
      sourceLoading: "正在準備來源內容...",
      sourceError: "來源準備過程中遇到問題。",
      cleanedSummaryEmpty: "清理後摘要將在標準化後顯示。",
      incidentDraftEmpty: "在選擇來源之前，草稿將保持空白。",
      guidedDemoPathEmpty: "引導路徑將在草稿準備好後顯示。",
      kbRecommendationsEmpty: "本地知識庫建議將在草稿產生後顯示。",
      monthlyExcelEmpty: "項目將保持本地狀態，直到月度佇列準備就緒。",
      source: "來源",
      received: "收到時間",
      language: "語言",
      sourcePreview: "已清理來源預覽",
      sanitized: "已清理",
      draft: "草稿",
      issue: "問題",
      impact: "影響",
      context: "上下文",
      contextValue: (removedLineCount: number) =>
        removedLineCount > 0 ? `已在本地移除 ${removedLineCount} 行敏感來源內容。` : "本地未偵測到敏感來源行。",
      shortDescription: "簡短描述",
      description: "描述",
      workNotes: "工作備註",
      saveDraft: "等待審核",
      createLocalDraft: "複製草稿文字",
      localOnly: "僅供人工審核。ServiceNow 的 Save/Submit/Update/Resolve/Close 仍由人工執行。"
    },
    runtime: {
      eyebrow: "瀏覽器操作欄",
      title: "瀏覽器操作",
      collapseRuntime: "收合瀏覽器操作欄",
      expandRuntime: "展開瀏覽器操作欄",
      collapsedTitle: "瀏覽器操作",
      collapsedHint: "已收合。展開後可使用打開 QA Chromium、驗證和自動填入。",
      statusReady: "就緒",
      statusBusy: "處理中",
      statusBlocked: "已阻止",
      statusSuccess: "已驗證",
      statusVerified: "目前工單已驗證；自動填入只能填寫允許的文字欄位。",
      statusCdpReady: "瀏覽器連線已準備好；可以驗證目前 Incident。",
      statusWaiting: "等待單獨的測試瀏覽器連線。",
      startTitle: "打開 QA Chromium",
      startDescription: "打開專用測試瀏覽器 Profile，可保留 ServiceNow 登入狀態；登入仍由你手動完成。",
      starting: "正在打開 QA Chromium",
      verifyTitle: "驗證目前 Incident",
      verifyDescription: "在任何填入前確認可見 Incident 表單安全且仍是目前頁面。",
      verifying: "正在驗證目前 Incident",
      autofillTitle: "自動填入目前 Incident",
      autofillDescription: "頁面驗證後只填入允許的文字欄位。它不會儲存或提交。",
      autofilling: "正在自動填入目前 Incident",
      readyChip: "就緒",
      waitingChip: "等待",
      disabledProductionReason: "停用：生產環境在此工作臺中保持唯讀；如需打開、驗證、自動填入，請選擇 QA 工作區。",
      disabledTargetReason: "停用：請先在設定中設定允許的 QA 目標。",
      disabledBusyReason: "停用：另一個瀏覽器或步驟仍在處理中。",
      startReadyReason: "就緒：打開專用 QA 測試瀏覽器 Profile；可重用已儲存的登入狀態。",
      verifyCdpReason: "停用：請先打開 QA Chromium，並等待瀏覽器連線就緒。",
      verifyReadyReason: "就緒：瀏覽器連線已準備好，可以驗證目前 Incident。",
      autofillVerifyReason: "停用：請先驗證目前 Incident。",
      autofillReadyReason: "就緒：自動填入只能填寫允許的文字欄位；仍需人工審核。",
      autofillCompletedFeedback: (filledCount: number) =>
        `自動填入已完成：已填寫 ${filledCount} 個文字欄位。沒有執行 Save、Submit、Update、Resolve、Close、上傳、郵件或 ServiceNow API。`,
      runtimeStatus: "瀏覽器狀態",
      resetRuntimeState: "重設瀏覽器就緒狀態",
      resetRuntimeStateHelper: "可安全重試：僅清除本地瀏覽器連線/頁面檢查狀態；不會執行 ServiceNow 操作。",
      sanitizedMode: "已清理模式",
      cdpLabel: "瀏覽器連線",
      cdpReady: "就緒",
      cdpWaiting: "等待中",
      sanitizedEvidence: "僅顯示已清理的瀏覽器狀態證據。",
      noEvidence: "尚無瀏覽器狀態證據；僅顯示已清理狀態。",
      safetyTitle: "安全說明",
      safetyBoundaryTitle: "安全邊界",
      environmentControlsTitle: "環境控制項",
      safetyNote: "AI 僅起草並填入允許的文字欄位。人工審核並在 ServiceNow 中處理記錄。",
      browserDisconnected: "瀏覽器：未連線",
      browserConnecting: "瀏覽器：連線中",
      browserConnected: "瀏覽器：已連線",
      browserError: "瀏覽器：錯誤",
      whatChanged: {
        title: "本輪更新內容",
        summary: "自上次發佈以來，該工作臺已透過多輪自動化檢查和手動驗證不斷完善。每次自動化測試都證明了填入前的安全性和可見性。",
        whyRepeatedValidation: "每次 ServiceNow 會話、瀏覽器 Profile 和工單頁面都不同，因此必須重複手動檢查。應用始終在填入前驗證目前頁面，防止被盜會話或錯誤視窗觸發意外資料录入。",
        whatIsAutomated: "已自動化：啟動瀏覽器、頁面驗證、文字欄位檢查、允許欄位（短描述、描述、工作備註）的自動填入。",
        whatIsHumanOnly: "僅人工操作：閱讀工單、判斷嚴重級別、輸入不允許欄位、儲存、提交、更新、解決、關閉、發送郵件、附件以及任何 ServiceNow API 寫入。",
        doesNotDo: [
          "此應用不會儲存、提交、更新、解決或關閉任何 ServiceNow 記錄。",
          "不會上傳附件、發送郵件或觸發 ServiceNow API 寫入。",
          "不會存取生產資料——僅讀取專用瀏覽器 Profile 中可見的 QA 頁面。",
          "所有自動化操作僅限於頁面驗證後的文字欄位填入。"
        ],
        footer: "由人工審核並在 ServiceNow 中手動提交。"
      }
    },
    settings: {
      ariaLabel: "工作臺設定",
      eyebrow: "設定",
      title: "設定",
      close: "關閉",
      saveSettings: "儲存設定",
      resetDisplay: "重設顯示",
            footerNote: "設定僅套用於目前視窗。瀏覽器安全規則保持不變。",
      languageTitle: "語言",
      languageLabel: "顯示語言",
      languageHelper: "只切換應用標籤，不改變工單內容或 ServiceNow 資料。",
      defaultEnvironment: "預設環境",
      defaultEnvironmentSelector: "預設環境選擇器",
      qaTestEnvironment: "QA 工作區",
      productionEnvironment: "生產環境",
      environmentHelper: "選擇此工作區可使用啟動、檢查頁面、自動填入。生產保持唯讀。",
      environmentBusyHelper: "停用：請等待目前瀏覽器步驟完成後再變更設定。",
      urlSettingsTitle: "ServiceNow 目標設定",
      compactSafety: "只接受已授權落地目標。密鑰、記錄識別碼、token、cookie、查詢字串和 hash 片段都會被阻止。",
      clearSavedSettings: "清除已儲存設定",
            clearReady: "就緒：清除本地目標覆寫，並重設頁面檢查/自動填入就緒狀態。",
      clearDisabled: "停用：沒有可清除的已儲存設定。",
      qaUrl: "QA URL",
      devUrl: "Dev URL",
      productionUrl: "Production URL",
      urlDescriptionQa: "用於受控測試的授權 QA 落地頁；檢查後會隱藏該值。",
      urlDescriptionProduction: "生產目標保持唯讀；啟動、檢查、自動填入僅在 QA 中可用。",
      qaSubmitPolicy: "QA 填入需要先啟動、檢查目前工單頁面，並限制為已核准文字欄位。",
      productionPolicy: "此工作臺中的生產環境保持唯讀；未啟用任何自動寫入路徑。",
      activeCustomTarget: "自訂目標已啟用；原始值已隱藏",
      builtInTargetHidden: "目標值已隱藏",
      customUrlLabel: "貼上替換目標",
      acceptedTarget: "已接受：目標已隱藏儲存用於本次工作階段。",
      blockedTarget: "已阻止的目標設定",
      submitPolicy: "寫入策略",
      validationReasons: {
        noUrl: "未設定目標",
        invalidUrl: "目標無效",
        httpsRequired: "需要 HTTPS",
        credentialsDenied: "目標中禁止包含憑證",
        sensitiveComponentDenied: "禁止包含查詢/hash/記錄識別碼/token/session/cookie 內容",
        serviceNowHostRequired: "host 必須是 ServiceNow host 或已核准的不可路由占位 host",
        mockUrlDenied: "離線夾具模式不能設定目標"
      }
    }
  },
  "es-ES": {
    ...englishOperatorWorkbenchCopy,
    productSubtitle: "Banco de trabajo del operador",
    statusAria: "Controles de estado del banco de trabajo",
    layoutAria: "Columnas del banco de trabajo del operador",
    languageAria: "Idioma de visualización",
    languageChip: "ES / 中文",
    nav: {
      primaryAria: "Navegación principal del banco de trabajo",
      workbenchSections: "Secciones del banco de trabajo",
      inbox: "Bandeja",
      workbench: "Banco",
      knowledge: "Conocimiento",
      history: "Historial",
      search: "Buscar",
      settings: "Configuración",
      collapseSidebar: "Contraer barra izquierda",
      expandSidebar: "Expandir barra izquierda",
      collapseSidebarShort: "Contraer",
      expandSidebarShort: "Expandir",
      loadingFeed: "Feed de carga",
      intakeQueue: "Cola de entrada",
      todoList: "Lista de tareas",
      historySection: "Historial",
      environmentControls: "Controles de entorno"
    },
    environment: { qa: "Entorno QA", production: "Producción" },
    target: { configured: "Destino QA oculto", missing: "Destino faltante" },
    search: { label: "Buscar", aria: "Buscar tickets locales", placeholder: "Buscar tickets...", shortcut: "Ctrl K" },
    list: {
      today: "Hoy",
      yesterday: "Ayer",
      recent: "Reciente",
      active: "activos",
      archived: "archivados",
      new: "Nuevo",
      inReview: "En revisión",
      waiting: "En espera",
      drafted: "Borrador",
      done: "Hecho",
      skipped: "Omitido",
      noHistory: "Aún no hay copias revisadas recientes."
    },
    cards: {
      selectedSource: "Detalle del origen seleccionado",
      cleanedSummary: "Resumen depurado",
      incidentDraft: "Borrador de Incident",
      selectedSourceEmpty: "Selecciona un origen de la cola izquierda para comenzar.",
      sourceLoading: "Preparando contenido del origen...",
      sourceError: "La preparación del origen encontró un problema.",
      cleanedSummaryEmpty: "El resumen depurado aparecerá después de la normalización.",
      incidentDraftEmpty: "El borrador permanecerá en blanco hasta que se seleccione un origen.",
      guidedDemoPathEmpty: "La ruta guiada aparecerá después de que el borrador esté listo.",
      kbRecommendationsEmpty: "Las recomendaciones KB locales aparecerán después de generar el borrador.",
      monthlyExcelEmpty: "Los elementos permanecen solo locales hasta que la cola mensual esté lista.",
      source: "Origen",
      received: "Recibido",
      language: "Idioma",
      sourcePreview: "Vista previa depurada",
      sanitized: "Depurado",
      draft: "Borrador",
      issue: "Problema",
      impact: "Impacto",
      context: "Contexto",
      contextValue: (removedLineCount: number) =>
        removedLineCount > 0 ? `${removedLineCount} líneas sensibles eliminadas localmente.` : "No se detectaron líneas sensibles localmente.",
      shortDescription: "Descripción breve",
      description: "Descripción",
      workNotes: "Notas de trabajo",
      saveDraft: "Mantener en revisión",
      createLocalDraft: "Copiar texto del borrador",
      localOnly: "Solo revisión manual. Save/Submit/Update/Resolve/Close en ServiceNow sigue siendo manual."
    },
    runtime: {
      eyebrow: "Panel del navegador",
      title: "Acciones del navegador",
      collapseRuntime: "Contraer panel de acciones del navegador",
      expandRuntime: "Expandir panel de acciones del navegador",
      collapsedTitle: "Acciones del navegador",
      collapsedHint: "Contraído. Expande para acceder a Start QA Chromium, Verify y Autofill.",
      statusReady: "Listo",
      statusBusy: "Trabajando",
      statusBlocked: "Bloqueado",
      statusSuccess: "Verificado",
      statusVerified: "Ticket actual verificado; Autofill puede rellenar solo campos de texto permitidos.",
      statusCdpReady: "Conexión del navegador lista; verifica el Incident actual.",
      statusWaiting: "Esperando la conexión del navegador de prueba separado.",
      startTitle: "Start QA Chromium",
      startDescription: "Abre un perfil de navegador de prueba dedicado para QA, para que el inicio de sesión de ServiceNow pueda conservarse; el inicio de sesión sigue siendo tuyo.",
      starting: "Iniciando QA Chromium",
      verifyTitle: "Verify current Incident",
      verifyDescription: "Confirma que el formulario Incident visible sea seguro y actual antes de autocompletar.",
      verifying: "Verificando Incident actual",
      autofillTitle: "Autofill current Incident",
      autofillDescription: "Rellena solo campos de texto permitidos después de verificar la página. Nunca guarda ni envía.",
      autofilling: "Autocompletando Incident actual",
      readyChip: "Listo",
      waitingChip: "Espera",
      disabledProductionReason: "Deshabilitado: Producción es de solo lectura en este workbench; elige QA workspace para Start QA Chromium, Verify y Autofill.",
      disabledTargetReason: "Deshabilitado: configura primero un destino QA permitido en Settings.",
      disabledBusyReason: "Deshabilitado: otro paso del navegador sigue en curso.",
      startReadyReason: "Listo: abre un perfil de navegador de prueba dedicado para QA; se puede reutilizar el inicio de sesión guardado.",
      verifyCdpReason: "Deshabilitado: inicia QA Chromium y espera a que la conexión del navegador esté lista.",
      verifyReadyReason: "Listo: conexión del navegador preparada; verifica el Incident actual.",
      autofillVerifyReason: "Deshabilitado: verifica el Incident actual primero.",
      autofillReadyReason: "Listo: Autofill puede rellenar solo campos de texto permitidos; aún revisas manualmente.",
      autofillCompletedFeedback: (filledCount: number) =>
        `Autofill completado: ${filledCount} campos de texto rellenados. No se usó Save, Submit, Update, Resolve, Close, carga, correo ni ServiceNow API.`,
      runtimeStatus: "Estado del navegador",
      resetRuntimeState: "Restablecer preparación del navegador",
      resetRuntimeStateHelper: "Reintento seguro: solo limpia el estado local de conexión del navegador/revisión de página; no realiza acciones en ServiceNow.",
      sanitizedMode: "Modo depurado",
      cdpLabel: "Conexión del navegador",
      cdpReady: "Listo",
      cdpWaiting: "Esperando",
      sanitizedEvidence: "Solo evidencia depurada del estado del navegador.",
      noEvidence: "Sin evidencia del estado del navegador; solo se muestra estado depurado.",
      safetyTitle: "Nota de seguridad",
      safetyBoundaryTitle: "Límite de seguridad",
      environmentControlsTitle: "Controles de entorno",
      safetyNote: "La IA redacta y rellena solo campos de texto permitidos. El humano revisa y maneja el registro en ServiceNow.",
      browserDisconnected: "Navegador: desconectado",
      browserConnecting: "Navegador: conectando",
      browserConnected: "Navegador: conectado",
      browserError: "Navegador: error",
      whatChanged: {
        title: "Qué cambió en esta ronda",
        summary: "Este banco de trabajo se ha reforzado a través de múltiples rondas de comprobaciones automatizadas y validación manual desde la última versión. Cada prueba de la automatización demuestra que es segura y visible antes de cualquier acción de relleno.",
        whyRepeatedValidation: "Las comprobaciones manuales se repiten porque cada sesión de ServiceNow, perfil de navegador y página de ticket es diferente. La aplicación siempre valida la página actual antes de rellenar, por lo que una sesión robada o una ventana incorrecta no pueden desencadenar una entrada de datos accidental.",
        whatIsAutomated: "Automatizado: lanzamiento del navegador, verificación de página, comprobaciones de campos de texto y autocompletado de los campos permitidos Descripción corta, Descripción y Notas de trabajo.",
        whatIsHumanOnly: "Solo humano: leer el ticket, juzgar su gravedad, escribir campos no permitidos, guardar, enviar, actualizar, resolver, cerrar, enviar correos electrónicos, adjuntos y cualquier escritura de API de ServiceNow.",
        doesNotDo: [
          "Esta aplicación NO guarda, envía, actualiza, resuelve ni cierra ningún registro de ServiceNow.",
          "No carga archivos adjuntos, envía correos electrónicos ni activa escrituras de API de ServiceNow.",
          "No accede a datos de producción: solo lee la página QA visible en un perfil de navegador dedicado.",
          "Todas las acciones automatizadas se limitan al relleno de campos de texto después de una verificación de página."
        ],
        footer: "El humano revisa y envía manualmente en ServiceNow."
      }
    },
    settings: {
      ariaLabel: "Configuración del banco de trabajo",
      eyebrow: "Configuración",
      title: "Configuración",
      close: "Cerrar",
      saveSettings: "Guardar configuración",
      resetDisplay: "Restablecer visualización",
      footerNote: "La configuración se aplica localmente en esta ventana. Las reglas de seguridad del navegador no cambian.",
      languageTitle: "Idioma",
      languageLabel: "Idioma de visualización",
      languageHelper: "Cambia solo las etiquetas de la app; no cambia tickets ni datos de ServiceNow.",
      defaultEnvironment: "Entorno predeterminado",
      defaultEnvironmentSelector: "Selector de entorno predeterminado",
      qaTestEnvironment: "QA workspace",
      productionEnvironment: "Producción",
      environmentHelper: "Elige este espacio para usar Start QA Chromium, Verify y Autofill. Producción permanece en solo lectura.",
      environmentBusyHelper: "Deshabilitado: espera a que termine la acción actual antes de cambiar la configuración.",
      urlSettingsTitle: "Configuración de destino de ServiceNow",
      compactSafety: "Solo se aceptan destinos iniciales autorizados. Secretos, identificadores de registro, tokens, cookies, query strings y fragments quedan bloqueados.",
      clearSavedSettings: "Borrar configuración guardada",
      clearReady: "Listo: borra overrides locales de destino y restablece revisión de página/Autofill.",
      clearDisabled: "Deshabilitado: no hay configuración guardada para borrar.",
      qaUrl: "QA URL",
      devUrl: "Dev URL",
      productionUrl: "Production URL",
      urlDescriptionQa: "Página inicial QA autorizada para pruebas controladas; el valor se oculta tras validar.",
      urlDescriptionProduction: "El destino de producción sigue siendo de solo lectura; Start, Check y Autofill solo están disponibles en QA.",
      qaSubmitPolicy: "El rellenado QA requiere Start, Check y reglas de seguridad para autofill de texto aprobado.",
      productionPolicy: "Producción es de solo lectura en este banco; no hay ruta de escritura automática habilitada.",
      activeCustomTarget: "Destino personalizado activo; valor sin procesar oculto",
      builtInTargetHidden: "Valor de destino oculto",
      customUrlLabel: "Pegar destino de reemplazo",
      acceptedTarget: "Aceptado: destino guardado oculto para esta sesión.",
      blockedTarget: "Configuración de destino bloqueada",
      submitPolicy: "Política de escritura",
      validationReasons: {
        noUrl: "sin destino configurado",
        invalidUrl: "destino inválido",
        httpsRequired: "HTTPS requerido",
        credentialsDenied: "credenciales en destino denegadas",
        sensitiveComponentDenied: "query/hash/identificador de registro/token/session/cookie denegados",
        serviceNowHostRequired: "el host debe ser ServiceNow o un placeholder no enrutable aprobado",
        mockUrlDenied: "el modo de fixture local no puede configurar destino"
      }
    }
  }
};

function getOperatorWorkbenchCopy(language: LanguageCode) {
  return operatorWorkbenchTranslations[language];
}
type OperatorWorkbenchCopy = ReturnType<typeof getOperatorWorkbenchCopy>;

const minAppZoomPercent = 80;
const maxAppZoomPercent = 150;
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

export type CenterState = "populated" | "empty" | "loading" | "error";
export type CdpState = "disconnected" | "connecting" | "connected" | "error";

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
  initialOperatorCdpReady?: boolean;
  initialOperatorVerifiedPageFingerprint?: string;
  initialOperatorLastResponse?: OperatorRuntimeResponse | null;
  initialOperatorBusyAction?: OperatorAction | null;
  initialOperatorStatus?: OperatorActionStatus;
  initialDisplayTheme?: DisplayTheme;
  initialLeftSidebarExpanded?: boolean;
  initialRuntimeRailExpanded?: boolean;
  initialActivePage?: OperatorWorkbenchPageKey;
  initialCenterState?: CenterState;
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
  initialEnvironmentMode = "qa",
  initialHighSeverityState = "normal",
  initialHighSeverityMonitoredGroups = defaultHighSeverityMonitoredGroups,
  initialQaSmokeWriteAction = "save_incident",
  initialQaSmokeApprovalPhrase = "",
  initialQaAutofillApprovalPhrase = "",
  initialQaAutofillQaIsolationConfirmed = false,
  initialQaAutofillDedicatedProfileConfirmed = false,
  initialEnvironmentUrlSettings = {},
  initialOperatorCdpReady = false,
  initialOperatorVerifiedPageFingerprint = "",
  initialOperatorLastResponse = null,
  initialOperatorBusyAction = null,
  initialOperatorStatus,
  initialDisplayTheme = "warm",
  initialLeftSidebarExpanded = true,
  initialRuntimeRailExpanded = false,
  initialActivePage = "workbench",
  initialCenterState
}: AppProps = {}) {
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>(initialDisplayTheme);
  const [appZoomPercent, setAppZoomPercent] = useState(100);
  const [textFieldDisplayMode, setTextFieldDisplayMode] = useState<TextFieldDisplayMode>("auto-fit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activePage, setActivePage] = useState<OperatorWorkbenchPageKey>(initialActivePage);
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(initialLeftSidebarExpanded);
  const [leftSidebarHandleTopPercent, setLeftSidebarHandleTopPercent] = useState(50);
  const [leftSidebarHandleDragging, setLeftSidebarHandleDragging] = useState(false);
  const leftSidebarHandleDragRef = useRef<{ pointerId: number; startY: number; didDrag: boolean } | null>(null);
  const leftSidebarHandleSuppressClickRef = useRef(false);
  const [runtimeRailExpanded, setRuntimeRailExpanded] = useState(initialRuntimeRailExpanded);
  const [selectedScenarioId, setSelectedScenarioId] = useState<ManualPasteScenario["id"]>("vpn-issue");
  const [selectedIntakeKind, setSelectedIntakeKind] = useState<IntakeSourceKind>("manual_paste");
  const [intakeRawText, setIntakeRawText] = useState("");
  const [capturedContexts, setCapturedContexts] = useState<CapturedContext[]>([]);
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
  const [selectedEnvironmentMode, setSelectedEnvironmentMode] = useState<WorkbenchEnvironmentMode>(
    toWorkbenchEnvironmentMode(initialEnvironmentMode)
  );
  const [environmentUrlSettings, setEnvironmentUrlSettings] = useState<ServiceNowEnvironmentUrlOverrides>(
    initialEnvironmentUrlSettings
  );
  const [operatorCdpReady, setOperatorCdpReady] = useState(initialOperatorCdpReady);
  const [operatorVerifiedPageFingerprint, setOperatorVerifiedPageFingerprint] = useState(
    initialOperatorVerifiedPageFingerprint
  );
  const [operatorLastResponse, setOperatorLastResponse] = useState<OperatorRuntimeResponse | null>(
    initialOperatorLastResponse
  );
  const [operatorBusyAction, setOperatorBusyAction] = useState<OperatorAction | null>(initialOperatorBusyAction);
  const [operatorStatus, setOperatorStatus] = useState<OperatorActionStatus>(() =>
    initialOperatorStatus ??
    (initialOperatorBusyAction
      ? {
          label: operatorActionLabel(initialOperatorBusyAction),
          tone: "working",
          details: operatorActionWorkingDetails(initialOperatorBusyAction)
        }
      : initialOperatorStatusFromResponse(initialOperatorLastResponse))
  );
  const operatorActionSequenceRef = useRef(0);
  const operatorActionTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);
  const [validationRunHistory, setValidationRunHistory] = useState<QaValidationRunEntry[]>([]);
  const [monthlyExcelFillState, setMonthlyExcelFillState] = useState<"pending" | "queued" | "deferred">("pending");

  const cdpState = useMemo<CdpState>(() => {
    if (operatorBusyAction === "launch") return "connecting";
    if (operatorCdpReady) return "connected";
    if (operatorLastResponse?.launch?.blockedReason) return "error";
    return "disconnected";
  }, [operatorBusyAction, operatorCdpReady, operatorLastResponse]);

  const centerState = useMemo<CenterState>(() => {
    if (initialCenterState) return initialCenterState;
    if (operatorBusyAction === "launch" || operatorBusyAction === "verify") return "loading";
    if (operatorLastResponse?.launch?.blockedReason || operatorLastResponse?.fieldInspection?.blockedReason) return "error";
    return "populated";
  }, [initialCenterState, operatorBusyAction, operatorLastResponse]);

  useEffect(() => {
    return () => {
      operatorActionSequenceRef.current += 1;
      if (operatorActionTimeoutRef.current) {
        globalThis.clearTimeout(operatorActionTimeoutRef.current);
        operatorActionTimeoutRef.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    document.documentElement.dataset.theme = displayTheme;

    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [displayTheme]);
  const [highSeverityState, setHighSeverityState] = useState<HighSeverityState>(initialHighSeverityState);
  const [highSeverityMonitoredGroups, setHighSeverityMonitoredGroups] = useState<HighSeverityMonitorGroup[]>(
    initialHighSeverityMonitoredGroups
  );
  const [highSeverityAcknowledged, setHighSeverityAcknowledged] = useState(false);
  const [highSeverityMuted, setHighSeverityMuted] = useState(false);
  const [highSeveritySpeechAnnouncementCount, setHighSeveritySpeechAnnouncementCount] = useState(0);
  const [highSeveritySpeechPreviewStatus, setHighSeveritySpeechPreviewStatus] = useState("");
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
  const workbenchCopy = getOperatorWorkbenchCopy(language);
  const templatedDraft = applyDraftTemplates(initialDraft, draftTemplateSettings);
  const draft = applyOverrides(templatedDraft, fieldOverrides);
  const serviceDeskWorkflowPreview = buildServiceDeskWorkflowPreview({
    createdAt: selectedQueueItem.receivedAt,
    rawIntakeSource: selectedQueueItem.sourceChannel,
    requesterDisplay: selectedQueueItem.requesterLabel,
    languageOrServiceDeskTeam: `${selectedQueueItem.sourceLanguage} / ${serviceDeskOwnerTeam}`,
    issueType: "Incident",
    draft,
    serviceDeskOwnerTeam: serviceDeskOwnerTeam,
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
      "Separate exact approval phrase required before each real Save/Submit/Update/Resolve/Close action.",
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
  const zoomScale = appZoomPercent / 100;
  const appShellStyle = {
    "--app-zoom-scale": zoomScale,
    "--app-zoom-width": `${100 / zoomScale}%`,
    "--app-zoom-height": `${100 / zoomScale}vh`
  } as CSSProperties;
  const leftSidebarHandleStyle = {
    "--left-sidebar-handle-top": `${leftSidebarHandleTopPercent}%`
  } as CSSProperties;

  function updateLeftSidebarHandleTop(clientY: number) {
    const viewportHeight = Math.max(window.innerHeight || 1, 1);
    const nextTopPercent = Math.min(88, Math.max(12, (clientY / viewportHeight) * 100));
    setLeftSidebarHandleTopPercent(Math.round(nextTopPercent * 10) / 10);
  }

  function handleLeftSidebarHandlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    leftSidebarHandleDragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      didDrag: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setLeftSidebarHandleDragging(true);
  }

  function handleLeftSidebarHandlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = leftSidebarHandleDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (Math.abs(event.clientY - dragState.startY) > 4) {
      dragState.didDrag = true;
    }

    if (!dragState.didDrag) {
      return;
    }

    event.preventDefault();
    updateLeftSidebarHandleTop(event.clientY);
  }

  function finishLeftSidebarHandleDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const dragState = leftSidebarHandleDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (dragState.didDrag) {
      leftSidebarHandleSuppressClickRef.current = true;
    }

    leftSidebarHandleDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setLeftSidebarHandleDragging(false);
  }

  function toggleLeftSidebarFromHandle() {
    if (leftSidebarHandleSuppressClickRef.current) {
      leftSidebarHandleSuppressClickRef.current = false;
      return;
    }

    setLeftSidebarExpanded((current) => !current);
  }

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

  function resetHighSeveritySpeechReminder() {
    setHighSeveritySpeechAnnouncementCount(0);
    setHighSeveritySpeechPreviewStatus("");
  }

  function toggleHighSeverityMonitoredGroup(groupId: HighSeverityMonitorGroup) {
    setHighSeverityMonitoredGroups((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
    );
    setHighSeverityAcknowledged(false);
    resetHighSeveritySpeechReminder();
  }

  function selectHighSeverityState(state: HighSeverityState) {
    setHighSeverityState(state);
    setHighSeverityAcknowledged(false);
    setHighSeverityMuted(false);
    resetHighSeveritySpeechReminder();
  }

  function acknowledgeHighSeverityReminder() {
    setHighSeverityAcknowledged(true);
    setHighSeveritySpeechPreviewStatus("Reminder acknowledged by the local user.");
  }

  function muteHighSeverityReminder() {
    setHighSeverityMuted(true);
    setHighSeveritySpeechPreviewStatus("Demo reminders are muted locally.");
  }

  function previewHighSeverityReminder() {
    const reminder = getHighSeverityVoiceReminder(highSeverityState, language, highSeverityMonitoredGroups);
    const decision = previewHighSeveritySpeechReminder({
      language,
      reminder,
      state: {
        severity: highSeverityState,
        announcementCount: highSeveritySpeechAnnouncementCount,
        acknowledged: highSeverityAcknowledged,
        muted: highSeverityMuted
      }
    });

    setHighSeveritySpeechPreviewStatus(decision.reason);
    if (decision.status === "spoken") {
      setHighSeveritySpeechAnnouncementCount(decision.announcementCount);
    }
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

  function resetOperatorBrowserReadiness(details: string) {
    operatorActionSequenceRef.current += 1;
    if (operatorActionTimeoutRef.current) {
      globalThis.clearTimeout(operatorActionTimeoutRef.current);
      operatorActionTimeoutRef.current = null;
    }
    setOperatorBusyAction(null);
    setOperatorCdpReady(false);
    setOperatorVerifiedPageFingerprint("");
    setOperatorLastResponse(null);
    setOperatorStatus({ label: "Browser connection not ready", tone: "idle", details });
  }

  function resetOperatorRuntimeState() {
    resetOperatorBrowserReadiness("Browser/page-check readiness was reset locally. Retry Start test browser when ready; no ServiceNow action was taken.");
  }

  function changeEnvironmentMode(nextMode: ServiceNowEnvironmentMode) {
    setSelectedEnvironmentMode(toWorkbenchEnvironmentMode(nextMode));
    resetOperatorBrowserReadiness("Page check is disabled until Start test browser reports a safe browser connection for the selected environment.");
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
    resetOperatorBrowserReadiness("Page check is disabled until Start test browser reports a safe browser connection for the updated target setting.");
  }

  function applyOperatorActionFinalState(finalState: OperatorActionFinalState) {
    if (!finalState.shouldApplyState) {
      return;
    }

    setOperatorBusyAction(finalState.operatorBusyAction);
    setOperatorLastResponse(finalState.operatorLastResponse);

    const response = finalState.operatorLastResponse;
    if (finalState.action === "launch") {
      const cdpReady =
        response?.ok === true &&
        response.launch?.safety?.cdpEndpointReady === true;
      setOperatorCdpReady(cdpReady);
      setOperatorVerifiedPageFingerprint("");
    }
    if (finalState.action === "verify") {
      if (response?.fieldInspection?.blockedReason === "cdp-endpoint-denied") {
        setOperatorCdpReady(false);
      }
      setOperatorVerifiedPageFingerprint(
        response?.ok === true && response.fieldInspection?.status === "verified" && response.fieldInspection.pageFingerprint
          ? response.fieldInspection.pageFingerprint
          : ""
      );
    }
    if (finalState.action === "autofill" && response?.runtime?.blockedReason === "cdp-endpoint-denied") {
      setOperatorCdpReady(false);
      setOperatorVerifiedPageFingerprint("");
    }
    if (finalState.action === "autofill" && response?.runtime?.blockedReason === "approval-stale-after-page-change") {
      setOperatorVerifiedPageFingerprint("");
    }
    setOperatorStatus(finalState.operatorStatus);

    // Record sanitized validation run entry for the History page
    if (response) {
      setValidationRunHistory((prev) => {
        const runId = `vr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
        const action = finalState.action;
        const filledFields = response.runtime?.filledFields;
        const plannedFields = response.defaultPlan?.plannedFields;
        const filledCount = filledFields?.length ?? 0;
        const plannedCount = plannedFields?.length ?? 0;
        const ok = response.ok === true;
        const blocked = !ok;
        let status: QaValidationRunEntry["status"];
        let summary: string;
        if (blocked) {
          status = "blocked";
          const reason =
            response.launch?.blockedReason ??
            response.fieldInspection?.blockedReason ??
            response.defaultPlan?.blockedReason ??
            response.runtime?.blockedReason ??
            "unknown";
          summary = `${operatorActionDisplayAction(action)} blocked: ${operatorSanitizeBlockedReason(reason)}`;
        } else {
          status = "ok";
          if (action === "launch") {
            summary = "App launch ok, browser ready";
          } else if (action === "verify") {
            summary = `Page inspected${plannedCount > 0 ? `, ${plannedCount} allowed fields planned` : ""}`;
          } else {
            summary = `${filledCount} allowed fields filled, no prohibited action`;
          }
        }
        // Keep only the last 20 entries
        return [...prev.slice(-19), { id: runId, timestamp, action, status, sanitizedSummary: summary, plannedFieldCount: plannedCount || undefined, filledFieldCount: filledCount || undefined }];
      });
    }
  }

  function finishOperatorAction(actionSequence: number, finalState: OperatorActionFinalState) {
    if (operatorActionSequenceRef.current !== actionSequence) {
      return;
    }
    if (operatorActionTimeoutRef.current) {
      globalThis.clearTimeout(operatorActionTimeoutRef.current);
      operatorActionTimeoutRef.current = null;
    }
    applyOperatorActionFinalState(finalState);
  }

  async function runOperatorAction(
    action: OperatorAction,
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

    if (operatorBusyAction !== null) {
      setOperatorStatus({
        label: operatorActionLabel(operatorBusyAction),
        tone: "working",
        details: operatorActionWorkingDetails(operatorBusyAction)
      });
      return;
    }

    const request: OperatorRuntimeRequest = {
      mode: selectedEnvironmentMode,
      targetUrl: qaSmokeTargetUrl,
      approvalPageFingerprint: action === "autofill" ? operatorVerifiedPageFingerprint : undefined,
      draft,
      scenario: "initial-create",
      qaIsolationConfirmed: qaAutofillQaIsolationConfirmed,
      dedicatedProfileConfirmed: qaAutofillDedicatedProfileConfirmed
    };

    const actionSequence = operatorActionSequenceRef.current + 1;
    operatorActionSequenceRef.current = actionSequence;
    if (operatorActionTimeoutRef.current) {
      globalThis.clearTimeout(operatorActionTimeoutRef.current);
    }
    operatorActionTimeoutRef.current = globalThis.setTimeout(() => {
      if (operatorActionSequenceRef.current !== actionSequence) {
        return;
      }
      applyOperatorActionFinalState(
        buildOperatorActionFinalState({ action, kind: "timeout", timeoutMs: OPERATOR_RUNTIME_ACTION_TIMEOUT_MS })
      );
      operatorActionSequenceRef.current += 1;
      operatorActionTimeoutRef.current = null;
    }, OPERATOR_RUNTIME_ACTION_TIMEOUT_MS);

    setOperatorBusyAction(action);
    setOperatorStatus({ label: operatorActionLabel(action), tone: "working", details: operatorActionWorkingDetails(action) });
    try {
      const response = await invoke(api, request);
      finishOperatorAction(actionSequence, buildOperatorActionFinalState({ action, kind: "response", response }));
    } catch (error) {
      finishOperatorAction(actionSequence, buildOperatorActionFinalState({ action, error, kind: "error" }));
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

  function textFieldAutofillQaOperatorIncident() {
    void runOperatorAction("autofill", (api, request) => api.autofillCurrentIncidentTextFields(request));
  }

  const targetConfigured = Boolean(selectedEnvironment.url) && qaSmokeTargetValidation.allowed;
  const workbenchEnvironmentLabel = getWorkbenchEnvironmentChipLabel(selectedEnvironmentMode, workbenchCopy);
  const workbenchTargetStatusLabel = targetConfigured ? workbenchCopy.target.configured : workbenchCopy.target.missing;
  const topbarTargetChipClass = targetConfigured ? "workbench-status-pill success" : "workbench-status-pill warning";
  const kbMatches = searchKnowledgeArticles(sourceCleanup.normalizedText, demoKnowledgeArticles, { limit: 3 });
  const monthlyExcelRow = serviceDeskWorkflowPreview.excelDryRunRowPreview.row;
  const currentMonthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const previousMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthlyWorkbookLabel = `Service Desk monthly ticket log — ${currentMonthLabel}`;
  const guidedDemoSourceReady = sourceCleanup.normalizedText.trim().length > 0;
  const guidedDemoDraftReady =
    fieldValue(draft.shortDescription).trim().length > 0 &&
    fieldValue(draft.description).trim().length > 0 &&
    fieldValue(draft.workNotes).trim().length > 0;
  const guidedDemoVerifyReady =
    targetConfigured &&
    operatorCdpReady &&
    Boolean(operatorVerifiedPageFingerprint);
  const guidedDemoAutofillReady = qaAutofillPlan.status === "ready-for-autofill";
  const guidedDemoSteps = [
    {
      number: "1",
      title: "Choose source",
      note: `Selected queue item: ${operatorSafeDisplayText(selectedQueueItem.sourceChannel)}`,
      status: "completed"
    },
    {
      number: "2",
      title: "Review cleaned context",
      note: guidedDemoSourceReady ? `Sanitized text ready (${sourceCleanup.removedLineCount} lines removed)` : "Waiting for cleaned source text",
      status: guidedDemoSourceReady ? "completed" : "current"
    },
    {
      number: "3",
      title: "Draft TicketDraft",
      note: guidedDemoDraftReady ? "Short description, description, and work notes are populated" : "Keep editing the draft fields until the ticket draft is complete",
      status: guidedDemoDraftReady ? "completed" : "current"
    },
    {
      number: "4",
      title: "Check KB recommendations",
      note: kbMatches.length > 0 ? `${kbMatches.length} local KB suggestion${kbMatches.length === 1 ? "" : "s"} matched` : "No local KB match yet; use the sanitized draft context",
      status: kbMatches.length > 0 ? "completed" : guidedDemoDraftReady ? "current" : "locked"
    },
    {
      number: "5",
      title: "Verify and report",
      note: guidedDemoVerifyReady
        ? "Test browser readiness and page verification are complete; the human still reviews the result"
        : targetConfigured
          ? "Wait for browser readiness and a verified page fingerprint before reporting"
          : "Configure a QA/dev target before verification can run",
      status: guidedDemoVerifyReady ? "completed" : targetConfigured ? "current" : "locked"
    },
    {
      number: "6",
      title: "Optional QA/dev text-field assistance",
      note: guidedDemoAutofillReady
        ? "Selector-verified, approval-gated text-field autofill is ready"
        : "This remains optional and stays blocked until the selector-verified plan is ready",
      status: guidedDemoAutofillReady ? "completed" : guidedDemoVerifyReady ? "current" : "locked"
    }
  ] as const;
  const cleanedSummaryRows = [
    { label: workbenchCopy.cards.issue, value: operatorSafeDisplayText(fieldValue(draft.shortDescription)) },
    { label: workbenchCopy.cards.impact, value: operatorSafeDisplayText(selectedQueueItem.bodyPreview) },
    {
      label: workbenchCopy.cards.context,
      value: workbenchCopy.cards.contextValue(sourceCleanup.removedLineCount)
    }
  ];
  const todayQueueItems = queueItems.slice(0, 4);
  const yesterdayQueueItems = queueItems.slice(4);
  const hasSavedEnvironmentUrlSettings = Object.values(environmentUrlSettings).some((value) => Boolean(value));
  const recentDraftItems = queueItems.filter((item) => item.status === "Drafted" || item.status === "Done").slice(0, 3);
  const workbenchNavItems: { key: OperatorWorkbenchPageKey; label: string; icon: WorkbenchIconName }[] = [
    { key: "inbox", label: workbenchCopy.nav.inbox, icon: "inbox" },
    { key: "workbench", label: workbenchCopy.nav.workbench, icon: "workbench" },
    { key: "knowledge", label: workbenchCopy.nav.knowledge, icon: "knowledge" },
    { key: "history", label: workbenchCopy.nav.history, icon: "history" },
    { key: "search", label: workbenchCopy.nav.search, icon: "search" }
  ];
  const activeNavLabel = workbenchNavItems.find((item) => item.key === activePage)?.label ?? workbenchCopy.nav.workbench;

  function clearEnvironmentUrlSettings() {
    setEnvironmentUrlSettings({});
    resetOperatorBrowserReadiness("Check current ticket page is disabled until Start test browser reports a safe browser connection after settings are cleared.");
  }

  return (
    <main
      className={`app-shell operator-workbench-v2-shell ${leftSidebarExpanded ? "left-sidebar-expanded" : "left-sidebar-collapsed"} ${runtimeRailExpanded ? "runtime-rail-expanded" : "runtime-rail-collapsed"}`}
      data-theme={displayTheme}
      data-left-sidebar={leftSidebarExpanded ? "expanded" : "collapsed"}
      data-right-rail={runtimeRailExpanded ? "expanded" : "collapsed"}
      data-active-page={activePage}
      data-text-mode={textFieldDisplayMode}
      data-zoom-percent={appZoomPercent}
      onWheel={handleAppWheel}
      style={appShellStyle}
    >
      <header className="workbench-topbar" aria-labelledby="app-title">
        <div className="workbench-product-lockup">
          <span aria-hidden="true" className="workbench-app-mark">
            <WorkbenchIcon name="app" />
          </span>
          <div>
            <h1 id="app-title">ServiceNow Automation</h1>
          </div>
        </div>
        <div className="workbench-topbar-status" aria-label={workbenchCopy.statusAria}>
          <span className="workbench-status-pill environment">{workbenchEnvironmentLabel}</span>
          <span className={topbarTargetChipClass}>{workbenchTargetStatusLabel}</span>
          <label className="workbench-language-selector">
            <WorkbenchIcon name="globe" />
            <span>{workbenchCopy.languageChip}</span>
            <select
              aria-label={workbenchCopy.languageAria}
              className="workbench-language-native-select"
              value={language}
              onChange={(event) => changeLanguage(event.currentTarget.value as LanguageCode)}
            >
              {languageOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <WorkbenchIcon name="chevron" />
          </label>
          <button
            aria-controls="workbench-runtime-rail"
            aria-expanded={runtimeRailExpanded}
            aria-label={runtimeRailExpanded ? workbenchCopy.runtime.collapseRuntime : workbenchCopy.runtime.expandRuntime}
            className="topbar-runtime-toggle"
            type="button"
            onClick={() => setRuntimeRailExpanded((current) => !current)}
          >
            <WorkbenchIcon name="chevron" />
            <span>{runtimeRailExpanded ? workbenchCopy.runtime.collapseRuntime : workbenchCopy.runtime.expandRuntime}</span>
          </button>
        </div>
      </header>

      <button
        aria-controls="left-workbench-sidebar"
        aria-expanded={leftSidebarExpanded}
        aria-label={leftSidebarExpanded ? workbenchCopy.nav.collapseSidebar : workbenchCopy.nav.expandSidebar}
        className="workbench-sidebar-edge-toggle"
        data-dragging={leftSidebarHandleDragging ? "true" : undefined}
        style={leftSidebarHandleStyle}
        title="Drag vertically, click to expand or collapse"
        type="button"
        onClick={toggleLeftSidebarFromHandle}
        onPointerCancel={finishLeftSidebarHandleDrag}
        onPointerDown={handleLeftSidebarHandlePointerDown}
        onPointerMove={handleLeftSidebarHandlePointerMove}
        onPointerUp={finishLeftSidebarHandleDrag}
      >
        <span className="workbench-sidebar-edge-glyph" aria-hidden="true">
          {leftSidebarExpanded ? "«" : "»"}
        </span>
      </button>

      <div className="workbench-layout" aria-label={workbenchCopy.layoutAria}>
        <aside className="workbench-icon-rail" aria-label={workbenchCopy.nav.primaryAria}>
          {workbenchNavItems.map((item) => (
            <button
              key={item.key}
              aria-current={item.key === activePage ? "page" : undefined}
              className={item.key === activePage ? "workbench-icon-button workbench-function-button selected" : "workbench-icon-button workbench-function-button"}
              type="button"
              onClick={() => setActivePage(item.key)}
            >
              <WorkbenchIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
          {!leftSidebarExpanded ? (
            <button
              aria-controls="app-settings-sidebar"
              aria-expanded={settingsOpen}
              className="workbench-icon-button workbench-settings-rail-button"
              type="button"
              onClick={() => setSettingsOpen(true)}
            >
              <WorkbenchIcon name="settings" />
              <span>{workbenchCopy.nav.settings}</span>
            </button>
          ) : null}
        </aside>

        <aside className="workbench-sidebar" id="left-workbench-sidebar" aria-labelledby="left-workbench-title">
          <div className="workbench-sidebar-scroll">
            <section className="workbench-feature-switcher" aria-labelledby="left-workbench-title" data-active-section={activePage}>
              <h2 id="left-workbench-title">{activeNavLabel}</h2>
              <nav aria-label={workbenchCopy.nav.workbenchSections}>
                {workbenchNavItems.map((item) => (
                  <button
                    key={item.key}
                    aria-current={item.key === activePage ? "page" : undefined}
                    className={item.key === activePage ? "selected" : undefined}
                    type="button"
                    onClick={() => setActivePage(item.key)}
                  >
                    <WorkbenchIcon name={item.icon} />
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  aria-controls="app-settings-sidebar"
                  aria-expanded={settingsOpen}
                  className="workbench-settings-button workbench-settings-nav-button"
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                >
                  <WorkbenchIcon name="settings" />
                  <span>{workbenchCopy.nav.settings}</span>
                </button>
              </nav>
            </section>

            <span className="workbench-section-label">{workbenchCopy.nav.loadingFeed}</span>
            <label className="workbench-search-box">
              <span>{workbenchCopy.search.label}</span>
              <span className="workbench-search-control">
                <WorkbenchIcon name="search" />
                <input aria-label={workbenchCopy.search.aria} placeholder={workbenchCopy.search.placeholder} type="search" />
                <kbd>{workbenchCopy.search.shortcut}</kbd>
              </span>
            </label>

            <span className="workbench-section-label">{workbenchCopy.nav.intakeQueue}</span>
            <div className="workbench-source-filters" aria-label={workbenchCopy.list.recent}>
              <span>{workbenchCopy.list.new}</span>
              <span>{workbenchCopy.list.inReview}</span>
              <span>{workbenchCopy.list.waiting}</span>
              <span>{workbenchCopy.list.recent}</span>
            </div>

            <section className="workbench-intake-selector" aria-label="Intake source">
              <div className="workbench-intake-selector-row">
                <select
                  aria-label="Select intake source type"
                  className="workbench-intake-select"
                  value={selectedIntakeKind}
                  onChange={(event) => {
                    setSelectedIntakeKind(event.currentTarget.value as IntakeSourceKind);
                    setIntakeRawText("");
                  }}
                >
                  {IntakeSourceKinds.map((kind) => {
                    const adapter = sourceAdapterRegistry[kind];
                    return (
                      <option key={kind} value={kind}>
                        {adapter.meta.label}
                      </option>
                    );
                  })}
                </select>
                <textarea
                  aria-label="Paste or type intake content"
                  className="workbench-intake-textarea"
                  placeholder="Paste content from the selected source type…"
                  value={intakeRawText}
                  onChange={(event) => setIntakeRawText(event.currentTarget.value)}
                  rows={2}
                />
                <div className="workbench-intake-actions">
                  <span className="workbench-intake-safety-notice">{sourceAdapterRegistry[selectedIntakeKind].meta.safetyNotice}</span>
                  <button
                    type="button"
                    className="workbench-intake-capture-btn"
                    disabled={intakeRawText.trim().length === 0}
                    onClick={() => {
                      const adapter = sourceAdapterRegistry[selectedIntakeKind];
                      const ctx = adapter.capture({ rawText: intakeRawText.trim() });
                      setCapturedContexts((prev) => [ctx, ...prev]);
                      setIntakeRawText("");
                    }}
                  >
                    Capture as source
                  </button>
                </div>
              </div>
              {capturedContexts.length > 0 && (
                <div className="workbench-captured-contexts">
                  <span className="workbench-captured-count">
                    {capturedContexts.length} captured
                  </span>
                  {capturedContexts.slice(0, 3).map((ctx) => (
                    <div key={ctx.id} className="workbench-captured-item">
                      <small>
                        {sourceAdapterRegistry[ctx.sourceType as IntakeSourceKind]?.meta.label ?? ctx.sourceType}
                        {" · "}
                        {ctx.rawText.length > 80
                          ? ctx.rawText.slice(0, 80) + "…"
                          : ctx.rawText}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <span className="workbench-section-label">{workbenchCopy.nav.todoList}</span>
            <details className="workbench-demo-library" aria-label="Demo Scenario Library">
              <summary>
                <span className="workbench-demo-library-heading">Demo Scenario Library</span>
                <span className="workbench-demo-library-badge">Demo only</span>
                <span aria-hidden="true" className="details-indicator">
                  <WorkbenchIcon name="chevron" />
                </span>
              </summary>
              <div className="workbench-demo-library-list">
                {demoManualPasteScenarios.map((scenario) => {
                  const isActive = selectedScenarioId === scenario.id;
                  const scenarioChannel = sourceChannelForScenario(scenario.id);
                  return (
                    <button
                      key={scenario.id}
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`Use scenario: ${scenario.label}`}
                      className={isActive ? "workbench-demo-item selected" : "workbench-demo-item"}
                      type="button"
                      onClick={() => selectScenario(scenario.id)}
                    >
                      <span className="workbench-demo-item-dot" aria-hidden="true" />
                      <span className="workbench-demo-item-title">{scenario.label}</span>
                      <span className="workbench-demo-item-meta">
                        <span className="workbench-demo-item-channel">{scenarioChannel}</span>
                        <span className="workbench-demo-item-tag">DEMO</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <small className="workbench-demo-library-safety">
                Fake/local/demo data only. No real ServiceNow, Teams, mailbox, phone, or API connection.
              </small>
            </details>

            <section className="workbench-source-list-shell" aria-labelledby="source-list-title">
              <div className="workbench-list-heading">
                <h3 id="source-list-title">{workbenchCopy.list.today}</h3>
                <span>{todayQueueItems.length} {workbenchCopy.list.active}</span>
              </div>
              <div className="workbench-source-list">
                {todayQueueItems.map((item) => (
                  <button
                    key={item.id}
                    aria-current={item.id === selectedQueueItem.id ? "true" : undefined}
                    className={item.id === selectedQueueItem.id ? "workbench-source-item today-source-item selected" : "workbench-source-item today-source-item"}
                    type="button"
                    onClick={() => selectQueueItem(item.id)}
                  >
                    <span className="workbench-source-dot" aria-hidden="true" />
                    <strong>{operatorShortSourceTitle(item.subject)}</strong>
                    <small>{item.sourceChannel} · {formatQueueStatus(item.status, workbenchCopy)} · {formatSourceTime(item.receivedAt)} · {languageShortLabel(item.language)}</small>
                  </button>
                ))}
              </div>

              {yesterdayQueueItems.length > 0 ? (
                <>
                  <div className="workbench-list-heading yesterday">
                    <h3>{workbenchCopy.list.yesterday}</h3>
                    <span>{yesterdayQueueItems.length} {workbenchCopy.list.archived}</span>
                  </div>
                  <div className="workbench-source-list compact">
                    {yesterdayQueueItems.map((item) => (
                      <button
                        key={item.id}
                        aria-current={item.id === selectedQueueItem.id ? "true" : undefined}
                        className={item.id === selectedQueueItem.id ? "workbench-source-item selected" : "workbench-source-item"}
                        type="button"
                        onClick={() => selectQueueItem(item.id)}
                      >
                        <strong>{operatorShortSourceTitle(item.subject)}</strong>
                        <small>{item.sourceChannel} · {formatQueueStatus(item.status, workbenchCopy)}</small>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </section>

            <section className="workbench-mini-history" aria-labelledby="mini-history-title">
              <h3 id="mini-history-title">{workbenchCopy.nav.history}</h3>
              {recentDraftItems.length > 0 ? (
                <ul>
                  {recentDraftItems.map((item) => (
                    <li key={item.id}>{operatorShortSourceTitle(item.subject)}</li>
                  ))}
                </ul>
              ) : (
                <p>{workbenchCopy.list.noHistory}</p>
              )}
            </section>
          </div>
        </aside>

        <section className="workbench-center" data-active-page={activePage} aria-label={activeNavLabel}>
          {activePage === "workbench" ? (
            <div className="workbench-page-shell">
              <section className="workbench-card selected-source-card" aria-labelledby="selected-source-title">
            <div className="workbench-card-header">
              <div>
                <h2 id="selected-source-title">{operatorSafeDisplayText(selectedQueueItem.subject)}</h2>
              </div>
              <span>{formatQueueStatus(selectedQueueItem.status, workbenchCopy)}</span>
            </div>
            {centerState === "populated" ? (
            <>
            <dl className="workbench-source-meta">
              <div>
                <dt>{workbenchCopy.cards.source}</dt>
                <dd>{selectedQueueItem.sourceChannel}</dd>
              </div>
              <div>
                <dt>{workbenchCopy.cards.received}</dt>
                <dd>{formatSourceTime(selectedQueueItem.receivedAt)}</dd>
              </div>
              <div>
                <dt>{workbenchCopy.cards.language}</dt>
                <dd>{languageDisplayLabel(selectedQueueItem.language)}</dd>
              </div>
            </dl>
            <details className="workbench-collapsed-detail source-preview-detail">
              <summary>{workbenchCopy.cards.sourcePreview}</summary>
              <p>{operatorSafeDisplayText(selectedQueueItem.bodyPreview)}</p>
            </details>
            </>
            ) : centerState === "empty" ? (
              <p className="center-placeholder">{workbenchCopy.cards.selectedSourceEmpty}</p>
            ) : centerState === "loading" ? (
              <p className="center-placeholder working">{workbenchCopy.cards.sourceLoading}</p>
            ) : (
              <p className="center-placeholder blocked">{workbenchCopy.cards.sourceError}</p>
            )}
          </section>

          <section className="workbench-card cleaned-summary-card" aria-labelledby="cleaned-summary-title">
            <div className="workbench-card-header">
              <div>
                <h2 id="cleaned-summary-title">{workbenchCopy.cards.cleanedSummary}</h2>
              </div>
            </div>
            {centerState === "populated" ? (
            <div className="summary-row-list">
              {cleanedSummaryRows.map((row) => (
                <div key={row.label} className="summary-row">
                  <span>{row.label}</span>
                  <p>{row.value}</p>
                </div>
              ))}
            </div>
            ) : centerState === "empty" ? (
              <p className="center-placeholder">{workbenchCopy.cards.cleanedSummaryEmpty}</p>
            ) : centerState === "loading" ? (
              <p className="center-placeholder working">Normalizing source content...</p>
            ) : (
              <p className="center-placeholder blocked">Normalization encountered an issue.</p>
            )}
          </section>

          <section className="workbench-card incident-draft-card" aria-labelledby="incident-draft-title">
            <div className="workbench-card-header">
              <div>
                <h2 id="incident-draft-title">{workbenchCopy.cards.incidentDraft}</h2>
              </div>
            </div>
            {centerState === "populated" ? (
            <>
            <DraftTextField
              label={workbenchCopy.cards.shortDescription}
              fieldName="shortDescription"
              field={draft.shortDescription}
              onChange={(value) => updateField("shortDescription", value)}
            />
            <DraftTextField
              label={workbenchCopy.cards.description}
              fieldName="description"
              field={draft.description}
              onChange={(value) => updateField("description", value)}
            />
            <DraftTextField
              label={workbenchCopy.cards.workNotes}
              fieldName="workNotes"
              field={draft.workNotes}
              onChange={(value) => updateField("workNotes", value)}
            />
            <footer className="incident-draft-footer">
              <small>{workbenchCopy.cards.localOnly}</small>
            </footer>
            </>
            ) : centerState === "empty" ? (
              <p className="center-placeholder">{workbenchCopy.cards.incidentDraftEmpty}</p>
            ) : centerState === "loading" ? (
              <p className="center-placeholder working">Drafting Incident...</p>
            ) : (
              <p className="center-placeholder blocked">Draft generation encountered an issue.</p>
            )}
          </section>

          <section className="workbench-card guided-demo-stepper-card" aria-labelledby="guided-demo-stepper-title">
            <div className="workbench-card-header guided-demo-stepper-header">
              <div>
                <p className="eyebrow">Guided path</p>
                <h2 id="guided-demo-stepper-title">Guided demo path</h2>
              </div>
              <span className="guided-demo-stepper-chip">Choose source → review context → draft ticket → check KB → verify/report → optional QA/dev assistance</span>
            </div>
            {centerState === "populated" ? (
            <>
            <p className="guided-demo-stepper-intro">
              Follow the story without guessing. This is a compact, local-only guide for the operator flow; the human still reviews every change and performs ServiceNow actions manually.
            </p>
            <ol className="guided-demo-stepper-list">
              {guidedDemoSteps.map((step) => (
                <li key={step.title} className={`guided-demo-stepper-step ${step.status}`} data-step-status={step.status}>
                  <span className="guided-demo-step-number" aria-hidden="true">{step.number}</span>
                  <div className="guided-demo-step-body">
                    <div className="guided-demo-step-topline">
                      <strong>{step.title}</strong>
                      <span className={`guided-demo-step-badge ${step.status}`}>{step.status}</span>
                    </div>
                    <p>{step.note}</p>
                  </div>
                </li>
              ))}
            </ol>
            <small className="guided-demo-stepper-footer">
              AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.
            </small>
            </>
            ) : centerState === "empty" ? (
              <p className="center-placeholder">{workbenchCopy.cards.guidedDemoPathEmpty}</p>
            ) : centerState === "loading" ? (
              <p className="center-placeholder working">Preparing guided path...</p>
            ) : (
              <p className="center-placeholder blocked">Guided path preparation encountered an issue.</p>
            )}
          </section>

          <section className="workbench-card kb-recommendations-card" aria-labelledby="kb-recommendations-title">
            <div className="workbench-card-header kb-recommendations-header">
              <div>
                <p className="eyebrow">KB recommendations visible for review</p>
                <h2 id="kb-recommendations-title">Local KB recommendations</h2>
                <p>No external KB lookup. These cards explain the recommendation before the operator uses it.</p>
              </div>
              <span>{kbMatches.length} local match{kbMatches.length === 1 ? "" : "es"}</span>
            </div>
            {centerState === "populated" ? (
            <>
            <div className="kb-recommendation-summary">
              <div>
                <span>Recommended support group</span>
                <strong>{operatorSafeDisplayText(fieldValue(draft.assignmentGroup) || serviceDeskOwnerTeam)}</strong>
              </div>
              <div>
                <span>Routing reason</span>
                <p>{operatorSafeDisplayText(serviceDeskWorkflowPreview.routingPlan.stage2.reason)}</p>
              </div>
            </div>
            <div className="kb-recommendation-list" role="list" aria-label="Visible local KB suggestions">
              {kbMatches.map((match, index) => (
                <article className="kb-recommendation-item" key={match.articleId} role="listitem">
                  <div className="kb-recommendation-topline">
                    <span>Local KB suggestion {index + 1}</span>
                    <strong>{operatorSafeDisplayText(match.title)}</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Match confidence</dt>
                      <dd>{Math.round(match.score * 100)}%</dd>
                    </div>
                    <div>
                      <dt>Matched evidence</dt>
                      <dd>{match.matchedKeywords.length > 0 ? match.matchedKeywords.join(", ") : "Sanitized context similarity"}</dd>
                    </div>
                  </dl>
                  <p>{operatorSafeDisplayText(match.excerpt ?? "Review the local demo article before using the recommendation.")}</p>
                </article>
              ))}
            </div>
            </>
            ) : centerState === "empty" ? (
              <p className="center-placeholder">{workbenchCopy.cards.kbRecommendationsEmpty}</p>
            ) : centerState === "loading" ? (
              <p className="center-placeholder working">Checking KB recommendations...</p>
            ) : (
              <p className="center-placeholder blocked">KB recommendation lookup encountered an issue.</p>
            )}
          </section>

          <section className="workbench-card monthly-excel-fill-card" aria-labelledby="monthly-excel-fill-title">
            <div className="workbench-card-header monthly-excel-fill-header">
              <div>
                <p className="eyebrow">Verify / monthly record</p>
                <h2 id="monthly-excel-fill-title">Monthly Excel fill queue</h2>
                <p>Prompt after ticket is opened: fill the reviewed core fields into the current month tracking workbook, or keep it pending for later.</p>
              </div>
              <span>{monthlyExcelFillState === "queued" ? "Queued" : monthlyExcelFillState === "deferred" ? "Deferred" : "Pending"}</span>
            </div>
            {centerState === "populated" ? (
            <>
            <div className="monthly-excel-workbook-row">
              <div>
                <span>Current month workbook</span>
                <strong>{monthlyWorkbookLabel}</strong>
                <small>Placeholder only. The real monthly web workbook link must be configured and opened by the operator.</small>
              </div>
              <div className="monthly-excel-month-actions" aria-label="Monthly workbook choices">
                <button type="button" className="local-draft-button primary" onClick={() => setMonthlyExcelFillState("queued")}>
                  Fill this ticket into monthly Excel
                </button>
                <button type="button" className="local-draft-button" onClick={() => setMonthlyExcelFillState("deferred")}>
                  Do later — keep in pending queue
                </button>
              </div>
            </div>
            <div className="monthly-excel-choice-grid">
              <button type="button" className="monthly-excel-month-card selected">
                <span>Current month</span>
                <strong>{currentMonthLabel}</strong>
              </button>
              <button type="button" className="monthly-excel-month-card">
                <span>Previous month</span>
                <strong>{previousMonthLabel}</strong>
              </button>
            </div>
            <dl className="monthly-excel-core-fields">
              <div>
                <dt>Opened ticket core data</dt>
                <dd>{operatorSafeDisplayText(fieldValue(draft.shortDescription))}</dd>
              </div>
              <div>
                <dt>Support group</dt>
                <dd>{operatorSafeDisplayText(fieldValue(draft.assignmentGroup) || serviceDeskOwnerTeam)}</dd>
              </div>
              <div>
                <dt>Monthly row preview</dt>
                <dd>{operatorSafeDisplayText(monthlyExcelRow["Short Description"] ?? monthlyExcelRow["Dry-run Result"] ?? "Reviewed local row is ready.")}</dd>
              </div>
            </dl>
            <small className="monthly-excel-safety">
              No Microsoft Graph or Excel Web write is performed from this local demo. This replaces the old per-ticket export-first story with a monthly workbook fill decision.
            </small>
            </>
            ) : centerState === "empty" ? (
              <p className="center-placeholder">{workbenchCopy.cards.monthlyExcelEmpty}</p>
            ) : centerState === "loading" ? (
              <p className="center-placeholder working">Preparing monthly queue...</p>
            ) : (
              <p className="center-placeholder blocked">Monthly queue preparation encountered an issue.</p>
            )}
          </section>
            </div>
          ) : (
            <OperatorStaticPage
              page={activePage}
              draft={draft}
              queueItems={queueItems}
              selectedQueueItem={selectedQueueItem}
              targetConfigured={targetConfigured}
              workbenchCopy={workbenchCopy}
              workbenchEnvironmentLabel={workbenchEnvironmentLabel}
              validationRunHistory={validationRunHistory}
            />
          )}
        </section>

        {runtimeRailExpanded ? (
          <aside
            id="workbench-runtime-rail"
            className="workbench-rail workbench-runtime-rail expanded"
            aria-labelledby="runtime-rail-title"
          >
            <QaOperatorRuntimePanel
              busyAction={operatorBusyAction}
              cdpEndpointReady={operatorCdpReady}
              cdpState={cdpState}
              lastResponse={operatorLastResponse}
              mode={selectedEnvironmentMode}
              targetReady={targetConfigured}
              verifiedPageFingerprintReady={Boolean(operatorVerifiedPageFingerprint)}
              onAutofill={autofillQaOperatorIncident}
              onTextFieldAutofill={textFieldAutofillQaOperatorIncident}
              onCollapse={() => setRuntimeRailExpanded(false)}
              onLaunchBrowser={launchQaOperatorBrowser}
              onResetRuntime={resetOperatorRuntimeState}
              onVerify={verifyQaOperatorIncident}
              status={operatorStatus}
              targetLabel={workbenchEnvironmentLabel}
              workbenchCopy={workbenchCopy}
            />
            <HighSeverityMonitorSimulator
              acknowledged={highSeverityAcknowledged}
              announcementCount={highSeveritySpeechAnnouncementCount}
              language={language}
              monitoredGroupIds={highSeverityMonitoredGroups}
              muted={highSeverityMuted}
              onAcknowledge={acknowledgeHighSeverityReminder}
              onMonitoredGroupToggle={toggleHighSeverityMonitoredGroup}
              onMute={muteHighSeverityReminder}
              onPreviewSpeech={previewHighSeverityReminder}
              onSelectedStateChange={selectHighSeverityState}
              selectedState={highSeverityState}
              speechPreviewStatus={highSeveritySpeechPreviewStatus}
              t={t}
            />
          </aside>
        ) : null}
      </div>

      <SettingsSidebar
        appZoomPercent={appZoomPercent}
        checkedFieldReviewItems={checkedFieldReviewItems}
        environmentUrlSettings={environmentUrlSettings}
        hasSavedEnvironmentUrlSettings={hasSavedEnvironmentUrlSettings}
        isOpen={settingsOpen}
        operatorBusyAction={operatorBusyAction}
        onClearEnvironmentUrlSettings={clearEnvironmentUrlSettings}
        onClose={() => setSettingsOpen(false)}
        onEnvironmentModeChange={changeEnvironmentMode}
        onEnvironmentUrlSettingChange={updateEnvironmentUrlSetting}
        onLanguageChange={changeLanguage}
        onPresetChange={selectTemplatePreset}
        onResetZoom={() => setAppZoomPercent(100)}
        onTemplateChange={updateTemplateField}
        onTextFieldModeChange={setTextFieldDisplayMode}
        onThemeChange={setDisplayTheme}
        onToggleChecklistItem={toggleFieldReviewItem}
        onZoomIn={() => changeAppZoom(appZoomStepPercent)}
        onZoomOut={() => changeAppZoom(-appZoomStepPercent)}
        selectedEnvironmentMode={selectedEnvironmentMode}
        selectedTemplatePresetId={selectedTemplatePresetId}
        selectedTextFieldMode={textFieldDisplayMode}
        selectedTheme={displayTheme}
        templateSettings={draftTemplateSettings}
        chrome={chrome}
        language={language}
        workbenchCopy={workbenchCopy}
        t={t}
      />
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
  hasSavedEnvironmentUrlSettings,
  isOpen,
  operatorBusyAction,
  onClearEnvironmentUrlSettings,
  onClose,
  onEnvironmentModeChange,
  onEnvironmentUrlSettingChange,
  onLanguageChange,
  onPresetChange,
  onResetZoom,
  onTemplateChange,
  onTextFieldModeChange,
  onThemeChange,
  onToggleChecklistItem,
  onZoomIn,
  onZoomOut,
  selectedEnvironmentMode,
  selectedTemplatePresetId,
  selectedTextFieldMode,
  selectedTheme,
  templateSettings,
  chrome,
  language,
  workbenchCopy,
  t
}: {
  appZoomPercent: number;
  checkedFieldReviewItems: string[];
  environmentUrlSettings: ServiceNowEnvironmentUrlOverrides;
  hasSavedEnvironmentUrlSettings: boolean;
  isOpen: boolean;
  operatorBusyAction: "launch" | "verify" | "autofill" | null;
  onClearEnvironmentUrlSettings: () => void;
  onClose: () => void;
  onEnvironmentModeChange: (mode: ServiceNowEnvironmentMode) => void;
  onEnvironmentUrlSettingChange: (mode: Exclude<ServiceNowEnvironmentMode, "mock">, url: string) => void;
  onLanguageChange: (language: LanguageCode) => void;
  onPresetChange: (presetId: DraftTemplatePresetId) => void;
  onResetZoom: () => void;
  onTemplateChange: (fieldName: keyof DraftTemplateSettings, value: string) => void;
  onTextFieldModeChange: (mode: TextFieldDisplayMode) => void;
  onThemeChange: (theme: DisplayTheme) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  selectedEnvironmentMode: WorkbenchEnvironmentMode;
  selectedTemplatePresetId: DraftTemplatePresetId;
  selectedTextFieldMode: TextFieldDisplayMode;
  selectedTheme: DisplayTheme;
  templateSettings: DraftTemplateSettings;
  chrome: UiChromeTranslations;
  language: LanguageCode;
  workbenchCopy: OperatorWorkbenchCopy;
  t: UiTranslations;
}) {
  return (
    <aside
      aria-label={workbenchCopy.settings.ariaLabel}
      className={isOpen ? "settings-sidebar" : "settings-sidebar collapsed"}
      id="app-settings-sidebar"
    >
      <div className="settings-sidebar-inner">
        <header className="settings-sidebar-header">
          <div>
            <p className="eyebrow">{workbenchCopy.settings.eyebrow}</p>
            <h3>{workbenchCopy.settings.title}</h3>
          </div>
          <button
            aria-label={workbenchCopy.settings.close}
            className="settings-close-button"
            type="button"
            onClick={onClose}
          >
            {workbenchCopy.settings.close}
          </button>
        </header>

        <div className="settings-sidebar-body">
          <LanguageSettingsPanel
            language={language}
            onLanguageChange={onLanguageChange}
            workbenchCopy={workbenchCopy}
          />

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

          <DefaultEnvironmentSettingsPanel
            busyAction={operatorBusyAction}
            selectedMode={selectedEnvironmentMode}
            onSelectedModeChange={onEnvironmentModeChange}
            workbenchCopy={workbenchCopy}
          />

          <EnvironmentUrlSettingsPanel
            environmentUrlSettings={environmentUrlSettings}
            hasSavedEnvironmentUrlSettings={hasSavedEnvironmentUrlSettings}
            onClearEnvironmentUrlSettings={onClearEnvironmentUrlSettings}
            onEnvironmentUrlSettingChange={onEnvironmentUrlSettingChange}
            chrome={chrome}
            workbenchCopy={workbenchCopy}
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

        <footer className="settings-sidebar-footer">
          <small>{workbenchCopy.settings.footerNote}</small>
          <div>
            <button className="settings-reset-display-button" type="button" onClick={onResetZoom}>
              {workbenchCopy.settings.resetDisplay}
            </button>
            <button className="settings-save-button" type="button" onClick={onClose}>
              {workbenchCopy.settings.saveSettings}
            </button>
          </div>
        </footer>
      </div>
    </aside>
  );
}

function LanguageSettingsPanel({
  language,
  onLanguageChange,
  workbenchCopy
}: {
  language: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  workbenchCopy: OperatorWorkbenchCopy;
}) {
  return (
    <details className="language-settings-panel" open>
      <summary>
        <span className="summary-label">{workbenchCopy.settings.languageTitle}</span>
        <strong>{workbenchCopy.languageChip}</strong>
        <span aria-hidden="true" className="details-indicator">
          <WorkbenchIcon name="chevron" />
        </span>
      </summary>
      <label className="display-setting-group language-setting-group">
        <span>{workbenchCopy.settings.languageLabel}</span>
        <select value={language} onChange={(event) => onLanguageChange(event.currentTarget.value as LanguageCode)}>
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <small>{workbenchCopy.settings.languageHelper}</small>
      </label>
    </details>
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
          <WorkbenchIcon name="chevron" />
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

function DefaultEnvironmentSettingsPanel({
  busyAction,
  onSelectedModeChange,
  selectedMode,
  workbenchCopy
}: {
  busyAction: "launch" | "verify" | "autofill" | null;
  onSelectedModeChange: (mode: ServiceNowEnvironmentMode) => void;
  selectedMode: WorkbenchEnvironmentMode;
  workbenchCopy: OperatorWorkbenchCopy;
}) {
  const disabled = busyAction !== null;
  const helperText = disabled ? workbenchCopy.settings.environmentBusyHelper : workbenchCopy.settings.environmentHelper;

  return (
    <section
      className="environment-url-settings-panel default-environment-selector-panel"
      aria-label={workbenchCopy.settings.defaultEnvironmentSelector}
    >
      <div className="environment-url-settings-body">
        <label className="display-setting-group default-environment-selector-row">
          <span>{workbenchCopy.settings.defaultEnvironmentSelector}</span>
          <select
            disabled={disabled}
            value={toWorkbenchEnvironmentMode(selectedMode)}
            onChange={(event) => onSelectedModeChange(event.currentTarget.value as ServiceNowEnvironmentMode)}
          >
            {visibleServiceNowEnvironmentModes.map((mode) => (
              <option key={mode} value={mode}>
                {getWorkbenchSettingsEnvironmentLabel(mode, workbenchCopy)}
              </option>
            ))}
          </select>
          <small>{helperText}</small>
        </label>
      </div>
    </section>
  );
}

function EnvironmentUrlSettingsPanel({
  environmentUrlSettings,
  hasSavedEnvironmentUrlSettings,
  onClearEnvironmentUrlSettings,
  onEnvironmentUrlSettingChange,
  chrome,
  workbenchCopy
}: {
  environmentUrlSettings: ServiceNowEnvironmentUrlOverrides;
  hasSavedEnvironmentUrlSettings: boolean;
  onClearEnvironmentUrlSettings: () => void;
  onEnvironmentUrlSettingChange: (mode: Exclude<ServiceNowEnvironmentMode, "mock">, url: string) => void;
  chrome: UiChromeTranslations;
  workbenchCopy: OperatorWorkbenchCopy;
}) {
  type EnvironmentUrlDraftFeedback = Partial<Record<WorkbenchEnvironmentMode, { allowed: boolean; reason: string }>>;
  const [draftFeedback, setDraftFeedback] = useState<EnvironmentUrlDraftFeedback>({});

  function updateDraftUrl(mode: WorkbenchEnvironmentMode, value: string) {
    const validation = validateServiceNowEnvironmentUrlSetting(mode, value);
    setDraftFeedback((current) => ({ ...current, [mode]: { allowed: validation.allowed, reason: validation.reason } }));
    onEnvironmentUrlSettingChange(mode, validation.allowed && validation.normalizedUrl ? validation.normalizedUrl : "");
  }

  function clearSavedSettings() {
    setDraftFeedback({});
    onClearEnvironmentUrlSettings();
  }

  return (
    <details className="environment-url-settings-panel" open>
      <summary>
        <span className="summary-label">{workbenchCopy.settings.urlSettingsTitle}</span>
        <strong>{chrome.environment.localOnlyNoSecrets}</strong>
        <span aria-hidden="true" className="details-indicator">
          <WorkbenchIcon name="chevron" />
        </span>
      </summary>

      <div className="environment-url-settings-body">
        <p className="environment-url-safety-copy">{workbenchCopy.settings.compactSafety}</p>
        <div className="environment-settings-actions">
          <button disabled={!hasSavedEnvironmentUrlSettings} type="button" onClick={clearSavedSettings}>
            {workbenchCopy.settings.clearSavedSettings}
          </button>
          <small>{hasSavedEnvironmentUrlSettings ? workbenchCopy.settings.clearReady : workbenchCopy.settings.clearDisabled}</small>
        </div>

        <div className="environment-url-card-grid">
          {serviceNowEnvironmentUrlSettingModes.map((mode) => {
            const draftFeedbackForMode = draftFeedback[mode];
            const effectiveConfig = getServiceNowEnvironmentConfig(mode, environmentUrlSettings);
            const hasActiveCustomTarget = Boolean(environmentUrlSettings[mode]);
            const validationAllowed = hasActiveCustomTarget || Boolean(draftFeedbackForMode?.allowed);
            const validationText = hasActiveCustomTarget || draftFeedbackForMode?.allowed
              ? workbenchCopy.settings.acceptedTarget
              : draftFeedbackForMode
                ? `${workbenchCopy.settings.blockedTarget}: ${formatEnvironmentUrlValidationReason(draftFeedbackForMode.reason, workbenchCopy)}`
                : workbenchCopy.settings.builtInTargetHidden;
            const modeLabel = getWorkbenchSettingsUrlLabel(mode, workbenchCopy);
            const modeDescription = getWorkbenchSettingsUrlDescription(mode, workbenchCopy);
            const policyCopy = getWorkbenchSettingsSubmitPolicy(mode, workbenchCopy);

            return (
              <article className="environment-url-card" key={mode}>
                <header>
                  <div>
                    <h4>{modeLabel}</h4>
                    <p>{modeDescription}</p>
                  </div>
                  <span>{hasActiveCustomTarget ? workbenchCopy.settings.activeCustomTarget : workbenchCopy.settings.builtInTargetHidden}</span>
                </header>

                <label className="field-block environment-url-field">
                  <span>{workbenchCopy.settings.customUrlLabel}</span>
                  <input
                    aria-label={`${modeLabel}: paste replacement target; saved value stays hidden`}
                    autoComplete="off"
                    inputMode="url"
                    placeholder={chrome.environment.customUrlPlaceholder}
                    type="text"
                    value=""
                    onChange={(event) => updateDraftUrl(mode, event.currentTarget.value)}
                  />
                </label>

                <p className={validationAllowed ? "environment-url-validation accepted" : "environment-url-validation blocked"}>
                  {validationText}
                </p>

                <dl className="environment-url-gate-list">
                  <div>
                    <dt>{workbenchCopy.settings.submitPolicy}</dt>
                    <dd>{policyCopy}</dd>
                  </div>
                  <div>
                    <dt>{chrome.environment.submitPolicy}</dt>
                    <dd>
                      {effectiveConfig.requiresExplicitApprovalBeforeRealSubmit
                        ? chrome.environment.explicitApprovalRequired
                        : chrome.environment.noRealSubmit}
                    </dd>
                  </div>
                </dl>

                <p className="environment-url-gate-copy">{chrome.environment.writeGateUnchanged}</p>
              </article>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function formatEnvironmentUrlValidationReason(reason: string, workbenchCopy: OperatorWorkbenchCopy): string {
  switch (reason) {
    case "no-url":
      return workbenchCopy.settings.validationReasons.noUrl;
    case "invalid-url":
      return workbenchCopy.settings.validationReasons.invalidUrl;
    case "https-required":
      return workbenchCopy.settings.validationReasons.httpsRequired;
    case "credentials-in-url-denied":
      return workbenchCopy.settings.validationReasons.credentialsDenied;
    case "sensitive-url-component-denied":
      return workbenchCopy.settings.validationReasons.sensitiveComponentDenied;
    case "service-now-host-required":
      return workbenchCopy.settings.validationReasons.serviceNowHostRequired;
    case "mock-url-denied":
      return workbenchCopy.settings.validationReasons.mockUrlDenied;
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
  announcementCount,
  language,
  monitoredGroupIds,
  muted,
  onAcknowledge,
  onMonitoredGroupToggle,
  onMute,
  onPreviewSpeech,
  onSelectedStateChange,
  selectedState,
  speechPreviewStatus,
  t
}: {
  acknowledged: boolean;
  announcementCount: number;
  language: LanguageCode;
  monitoredGroupIds: HighSeverityMonitorGroup[];
  muted: boolean;
  onAcknowledge: () => void;
  onMonitoredGroupToggle: (groupId: HighSeverityMonitorGroup) => void;
  onMute: () => void;
  onPreviewSpeech: () => void;
  onSelectedStateChange: (state: HighSeverityState) => void;
  selectedState: HighSeverityState;
  speechPreviewStatus: string;
  t: UiTranslations;
}) {
  const selectedFakeState = highSeveritySimulatorStates[selectedState];
  const voiceReminder = getHighSeverityVoiceReminder(selectedState, language, monitoredGroupIds);
  const speechDecision = getHighSeveritySpeechReminderDecision(voiceReminder, language, {
    severity: selectedState,
    announcementCount,
    acknowledged,
    muted
  });
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
          <div>
            <dt>{t.highSeverityMonitor.announcementCountLabel}</dt>
            <dd>{announcementCount}</dd>
          </div>
          <div>
            <dt>{t.highSeverityMonitor.speechPreviewStatusLabel}</dt>
            <dd>{speechPreviewStatus || speechDecision.reason}</dd>
          </div>
        </dl>

        <div className="severity-actions" aria-label="Fake high severity alert actions">
          <button type="button" onClick={onAcknowledge}>
            {t.highSeverityMonitor.acknowledgeAction}
          </button>
          <button type="button" onClick={onMute}>
            {t.highSeverityMonitor.muteAction}
          </button>
          <button type="button" disabled={speechDecision.status !== "ready"} onClick={onPreviewSpeech}>
            {t.highSeverityMonitor.previewSpeechAction}
          </button>
        </div>

        <section className={`severity-voice-preview ${selectedState}`} aria-label="Local high severity voice reminder preview">
          <strong>{voiceReminder.voiceText}</strong>
          <p>{voiceReminder.policyText}</p>
          {voiceReminder.suppressionText ? <small>{voiceReminder.suppressionText}</small> : null}
          <small>No ServiceNow polling, API write, or production notification. {voiceReminder.previewSafetyText}</small>
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
          <WorkbenchIcon name="chevron" />
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
    "- No real ServiceNow record is created, changed, submitted, updated, resolved, saved, or closed.",
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
            {config.credentialPolicy === "manual-login-only" ? (
              <>
                <strong>{chrome.environment.manualLoginRequired}</strong>
                <small>{chrome.environment.savedSignInReusable}</small>
              </>
            ) : (
              <strong>{chrome.environment.noCredentialsRequired}</strong>
            )}
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

export function getDraftTextAreaRows(fieldName: "shortDescription" | "description" | "workNotes", value: string): number {
  const sanitizedValue = operatorSafeDisplayText(value);
  const wrapColumnEstimate = fieldName === "shortDescription" ? 90 : 76;
  const estimatedVisualLines = sanitizedValue.split(/\r?\n/).reduce((total, line) => {
    return total + Math.max(1, Math.ceil(line.length / wrapColumnEstimate));
  }, 0);

  return fieldName === "shortDescription"
    ? Math.max(2, estimatedVisualLines + 1)
    : Math.max(5, estimatedVisualLines + 1);
}

type OperatorStaticPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  icon: WorkbenchIconName;
  sidebarTitle: string;
  sidebarItems: { title: string; meta: string }[];
  heroTitle: string;
  heroBody: string;
  stats: { label: string; value: string }[];
  detailCards: { title: string; body: string }[];
  validationRuns?: QaValidationRunEntry[];
  contextTitle: string;
  contextItems: string[];
  footerNote: string;
};

function buildOperatorStaticPageContent({
  draft,
  page,
  queueItems,
  selectedQueueItem,
  targetConfigured,
  workbenchCopy,
  workbenchEnvironmentLabel,
  validationRunHistory
}: {
  draft: TicketDraft;
  page: Exclude<OperatorWorkbenchPageKey, "workbench">;
  queueItems: DemoQueueItem[];
  selectedQueueItem: DemoQueueItem;
  targetConfigured: boolean;
  workbenchCopy: OperatorWorkbenchCopy;
  workbenchEnvironmentLabel: string;
  validationRunHistory: QaValidationRunEntry[];
}): OperatorStaticPageContent {
  switch (page) {
    case "inbox":
      return {
        eyebrow: workbenchCopy.nav.inbox,
        title: "Inbox triage",
        description: "Review sanitized intake, source channel, and next manual step before opening the workbench draft.",
        icon: "inbox",
        sidebarTitle: "Today",
        sidebarItems: queueItems.slice(0, 5).map((item) => ({
          title: operatorSafeDisplayText(item.subject),
          meta: `${item.sourceChannel} · ${formatQueueStatus(item.status, workbenchCopy)} · ${formatSourceTime(item.receivedAt)}`
        })),
        heroTitle: operatorSafeDisplayText(selectedQueueItem.subject),
        heroBody: operatorSafeDisplayText(selectedQueueItem.bodyPreview),
        stats: [
          { label: "Active sources", value: String(queueItems.length) },
          { label: "Selected channel", value: selectedQueueItem.sourceChannel },
          { label: "Target", value: targetConfigured ? "configured" : "missing" }
        ],
        detailCards: [
          { title: "Selected source", body: "Sanitized preview only; no raw ServiceNow ticket text is stored here." },
          { title: "Manual next step", body: "Use the workbench page to review Short description, Description, and Work notes before runtime verification." }
        ],
        contextTitle: "Triage checklist",
        contextItems: ["Confirm requester and source channel", "Check impact and urgency before routing", "Keep customer-visible comments separate from internal Work Notes"],
        footerNote: "Inbox is local and sanitized; it does not save or update ServiceNow."
      };
    case "knowledge":
      return {
        eyebrow: workbenchCopy.nav.knowledge,
        title: "Knowledgebase snippets",
        description: "Small, page-like reference cards for the operator; no external KB query is performed from this UI.",
        icon: "knowledge",
        sidebarTitle: "Pinned folders",
        sidebarItems: [
          { title: "VPN troubleshooting", meta: "3 local snippets" },
          { title: "Password and MFA", meta: "2 local snippets" },
          { title: "Windows endpoint", meta: "2 local snippets" },
          { title: "Routing defaults", meta: workbenchEnvironmentLabel }
        ],
        heroTitle: "Suggested snippets for selected source",
        heroBody: `Suggested context for: ${operatorSafeDisplayText(draft.shortDescription.value)}`,
        stats: [
          { label: "Source language", value: languageDisplayLabel(selectedQueueItem.language) },
          { label: "Mode", value: "local preview" },
          { label: "Runtime", value: "manual verify required" }
        ],
        detailCards: [
          { title: "VPN connectivity troubleshooting", body: "Check password/MFA timing, VPN client error text, network reachability, and affected scope." },
          { title: "Account and login troubleshooting", body: "Confirm recent password change, MFA prompt loop, lockout status, and user contact path." },
          { title: "Windows endpoint troubleshooting", body: "Use only after confirming the issue is endpoint-specific rather than account or VPN service-wide." }
        ],
        contextTitle: "Suggested knowledge",
        contextItems: ["Do not paste raw KB exports", "Keep customer-facing notes concise", "Use Work Notes for internal checks"],
        footerNote: "Knowledgebase is local reference copy; it does not fetch ServiceNow articles."
      };
    case "history": {
      const validationRuns = validationRunHistory.slice(-10).reverse();
      const okRuns = validationRunHistory.filter((r) => r.status === "ok").length;
      const blockedRuns = validationRunHistory.filter((r) => r.status === "blocked").length;
      return {
        eyebrow: workbenchCopy.nav.history,
        title: "History timeline",
        description: "A quiet local timeline for recent reviewed copies, skipped sources, and validation runs.",
        icon: "history",
        sidebarTitle: "Recent activity",
        sidebarItems: queueItems.slice(0, 5).map((item) => ({
          title: operatorSafeDisplayText(item.subject),
          meta: `${formatQueueStatus(item.status, workbenchCopy)} · ${formatSourceTime(item.receivedAt)}`
        })),
        heroTitle: "Recent local run evidence",
        heroBody: "Recent local actions are summarized without raw endpoints, cookies, screenshots, or ticket identifiers.",
        stats: [
          { label: "Reviewed", value: String(queueItems.filter((item) => item.status === "Done" || item.status === "Drafted").length) },
          { label: "Waiting", value: String(queueItems.filter((item) => item.status === "Reviewed").length) },
          { label: "Skipped", value: String(queueItems.filter((item) => item.status === "Skipped").length) },
          { label: "Validation runs", value: String(validationRunHistory.length) },
          { label: "Passed", value: String(okRuns) },
          { label: "Blocked", value: String(blockedRuns) }
        ],
        detailCards: [
          { title: "Latest draft", body: operatorSafeDisplayText(draft.shortDescription.value) },
          { title: "Browser evidence", body: "Browser rail remains the source of truth for Start QA Chromium, Verify, and Autofill readiness." }
        ],
        validationRuns: validationRuns.length > 0 ? validationRuns : undefined,
        contextTitle: "Recent outcomes",
        contextItems: ["Show status labels, not raw URLs", "Keep page-check details hidden", "Do not imply Save/Submit/Update/Resolve/Close approval"],
        footerNote: "History is a local operator aid, not a ServiceNow audit log."
      };
    }
    case "search":
      return {
        eyebrow: workbenchCopy.nav.search,
        title: "Search workspace",
        description: "Search-shaped layout for local sanitized sources, draft text, and page labels.",
        icon: "search",
        sidebarTitle: "Search scopes",
        sidebarItems: [
          { title: "Local sources", meta: `${queueItems.length} sanitized items` },
          { title: "Incident draft", meta: "Short description, Description, Work notes" },
          { title: "Knowledge snippets", meta: "Local reference only" },
          { title: "Settings labels", meta: "No secrets or endpoints" }
        ],
        heroTitle: "Search current workbench content",
        heroBody: "Use the left search control to inspect local sanitized workbench content. Browser actions stay in the right rail.",
        stats: [
          { label: "Draft fields", value: "3" },
          { label: "Current source", value: selectedQueueItem.sourceChannel },
          { label: "Environment", value: workbenchEnvironmentLabel }
        ],
        detailCards: [
          { title: "Suggested query", body: operatorSafeDisplayText(draft.shortDescription.value) },
          { title: "Search safety", body: "Search never exposes stored credentials, cookies, browser connection details, or raw ServiceNow URLs in the main workbench." }
        ],
        contextTitle: "Search tips",
        contextItems: ["Use source channel names", "Search draft labels before copying", "Open Settings to replace hidden authorized targets only"],
        footerNote: "Search is local UI only; it does not query ServiceNow."
      };
  }
}

function OperatorStaticPage({
  draft,
  page,
  queueItems,
  selectedQueueItem,
  targetConfigured,
  workbenchCopy,
  workbenchEnvironmentLabel,
  validationRunHistory
}: {
  draft: TicketDraft;
  page: Exclude<OperatorWorkbenchPageKey, "workbench">;
  queueItems: DemoQueueItem[];
  selectedQueueItem: DemoQueueItem;
  targetConfigured: boolean;
  workbenchCopy: OperatorWorkbenchCopy;
  workbenchEnvironmentLabel: string;
  validationRunHistory: QaValidationRunEntry[];
}) {
  const content = buildOperatorStaticPageContent({
    draft,
    page,
    queueItems,
    selectedQueueItem,
    targetConfigured,
    workbenchCopy,
    workbenchEnvironmentLabel,
    validationRunHistory
  });
  const titleId = `${page}-page-title`;

  return (
    <div className="workbench-page-shell" aria-labelledby={titleId}>
      <aside className="workbench-page-sidepanel" aria-label={`${content.title} side panel`}>
        <div className="workbench-page-sidepanel-header">
          <WorkbenchIcon name={content.icon} />
          <div>
            <p className="eyebrow">{content.eyebrow}</p>
            <h3>{content.sidebarTitle}</h3>
          </div>
        </div>
        <div className="workbench-page-sidepanel-list">
          {content.sidebarItems.map((item) => (
            <article key={`${item.title}-${item.meta}`}>
              <strong>{item.title}</strong>
              <small>{item.meta}</small>
            </article>
          ))}
        </div>
      </aside>

      <article className="workbench-page-document" aria-labelledby={titleId}>
        <header className="workbench-page-hero">
          <span className="workbench-page-icon"><WorkbenchIcon name={content.icon} /></span>
          <div>
            <p className="eyebrow">{content.eyebrow}</p>
            <h2 id={titleId}>{content.title}</h2>
            <p>{content.description}</p>
          </div>
        </header>
        <section className="workbench-page-focus-card" aria-label={content.heroTitle}>
          <strong>{content.heroTitle}</strong>
          <p>{content.heroBody}</p>
        </section>
        <dl className="workbench-page-stat-grid">
          {content.stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <div className="workbench-page-card-grid">
          {content.detailCards.map((card) => (
            <section key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </section>
          ))}
        </div>
        {content.validationRuns ? (
          <section className="workbench-page-validation-runs" aria-labelledby="validation-runs-title">
            <div className="validation-runs-header-row">
              <h3 id="validation-runs-title">Validation / Run History</h3>
              <div className="validation-runs-export-group">
                <button
                  className="workbench-secondary-button"
                  type="button"
                  onClick={() => {
                    const md = exportValidationRunsToMarkdown(content.validationRuns ?? []);
                    triggerStringDownload(md, `sna-validation-runs-${new Date().toISOString().slice(0, 10)}.md`, "text/markdown");
                  }}
                >
                  Export MD
                </button>
                <button
                  className="workbench-secondary-button"
                  type="button"
                  onClick={() => {
                    const csv = exportValidationRunsToCsv(content.validationRuns ?? []);
                    triggerStringDownload(csv, `sna-validation-runs-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
                  }}
                >
                  Export CSV
                </button>
                <button
                  className="workbench-secondary-button"
                  type="button"
                  onClick={() => {
                    const report = exportProductReviewReport(selectedQueueItem, draft, content.validationRuns ?? []);
                    triggerStringDownload(report, `sna-product-review-${new Date().toISOString().slice(0, 10)}.md`, "text/markdown");
                  }}
                >
                  Export Product-Review Report
                </button>
              </div>
            </div>
            <div className="validation-runs-table" role="list">
              <div className="validation-runs-header" role="row">
                <span>Time</span>
                <span>Action</span>
                <span>Result</span>
                <span>Details</span>
              </div>
              {content.validationRuns.map((run) => (
                <div key={run.id} className={`validation-run-row ${run.status}`} role="listitem">
                  <span className="validation-run-time">{run.timestamp}</span>
                  <span className="validation-run-action">{operatorActionDisplayAction(run.action)}</span>
                  <span className={`validation-run-status ${run.status}`}>{run.status.toUpperCase()}</span>
                  <span className="validation-run-summary">{run.sanitizedSummary}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>

      <aside className="workbench-page-context-panel" aria-label={`${content.title} context panel`}>
        <h3>{content.contextTitle}</h3>
        <ul>
          {content.contextItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p>{content.footerNote}</p>
      </aside>
    </div>
  );
}

function DraftTextField({
  field,
  fieldName,
  label,
  onChange
}: {
  field: FieldDraft;
  fieldName: "shortDescription" | "description" | "workNotes";
  label: string;
  onChange: (value: string) => void;
}) {
  const sanitizedValue = operatorSafeDisplayText(field.value);
  const rows = getDraftTextAreaRows(fieldName, sanitizedValue);

  return (
    <label className={`field-block field-block-${fieldName}`}>
      <span>{label}</span>
      <textarea
        aria-label={label}
        data-auto-fit-field={fieldName}
        rows={rows}
        spellCheck="true"
        value={sanitizedValue}
        wrap="soft"
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

function ReadOnlyField({ field, label }: { field?: FieldDraft; label: string }) {
  return (
    <div className="readonly-field">
      <span>{label}</span>
      <strong>{operatorSafeDisplayText(field?.value ?? "Not set")}</strong>
      {field?.evidence ? <small>{operatorSafeDisplayText(field.evidence)}</small> : null}
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
        <p className="eyebrow">Risk Control</p>
        <h3 id="risk-control-title">Automate drafting, not accountability.</h3>
        <p>The app does not Save, Submit, Update, Resolve, or Close real tickets automatically.</p>
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
          <WorkbenchIcon name="chevron" />
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
            This does NOT submit, save, update, resolve, close, launch browser automation, call ServiceNow APIs, or write
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
          <li>Manual copy only: the operator copies or types values; the app never fills ServiceNow.</li>
          <li>Save-only readiness: Submit, Update, Resolve, and Close remain deferred to a later checkpoint.</li>
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
        <p>Each real write action needs its own exact operator phrase. One approval never covers another action.</p>
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

function operatorActionLabel(action: OperatorAction): string {
  switch (action) {
    case "launch":
      return "Start QA Chromium";
    case "verify":
      return "Verify current Incident";
    case "autofill":
      return "Autofill current Incident";
  }
}

export function operatorActionDisplayAction(action: OperatorAction): string {
  switch (action) {
    case "launch":
      return "QA Chromium launch";
    case "verify":
      return "Verify";
    case "autofill":
      return "Autofill";
  }
}

export function operatorSanitizeBlockedReason(reason: string): string {
  // Map internal reason codes to sanitized plain-language descriptions
  switch (reason) {
    case "dedicated-browser-runtime-missing":
      return "dedicated browser runtime unavailable";
    case "qa-runtime-required":
      return "production mode is read-only; switch to QA workspace";
    case "cdp-endpoint-denied":
      return "test browser disconnected; restart browser";
    case "cdp-page-selection-denied":
      return "could not find one unique approved Incident tab in the test browser";
    case "no-default-plan":
      return "could not build default autofill plan; no fields matched";
    case "browser-step-timeout":
      return "operation timed out; no ServiceNow action was taken";
    case "approval-stale-after-page-change":
      return "page changed after approval; re-check the current ticket page";
    default:
      // Use a generic sanitized fallback that doesn't leak internal codes
      return "operation could not complete; retry from the browser action rail";
  }
}

export function exportValidationRunsToMarkdown(runs: QaValidationRunEntry[]): string {
  if (runs.length === 0) {
    return "# Validation Runs\n\nNo validation runs recorded.\n";
  }
  const header = "| Time | Action | Result | Details |";
  const separator = "|------|--------|--------|---------|";
  const rows = runs
    .slice()
    .reverse()
    .map(
      (run) =>
        `| ${run.timestamp} | ${operatorActionDisplayAction(run.action)} | ${run.status.toUpperCase()} | ${run.sanitizedSummary} |`
    );
  return ["# Validation Runs\n", header, separator, ...rows, ""].join("\n");
}

export function exportValidationRunsToCsv(runs: QaValidationRunEntry[]): string {
  if (runs.length === 0) {
    return "Time,Action,Result,Details\n";
  }
  const header = "Time,Action,Result,Details";
  const rows = runs
    .slice()
    .reverse()
    .map((run) => {
      const time = run.timestamp.replace(/,/g, " ");
      const action = operatorActionDisplayAction(run.action).replace(/,/g, " ");
      const status = run.status.toUpperCase();
      const summary = run.sanitizedSummary.replace(/,/g, ";").replace(/"/g, '""');
      return `${time},${action},${status},"${summary}"`;
    });
  return [header, ...rows, ""].join("\n");
}

export function exportProductReviewReport(
  queueItem: DemoQueueItem,
  draft: TicketDraft,
  validationRuns: QaValidationRunEntry[],
  style: "markdown" = "markdown"
): string {
  const okRuns = validationRuns.filter((r) => r.status === "ok").length;
  const blockedRuns = validationRuns.filter((r) => r.status !== "ok").length;
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  const draftDescription = operatorSafeDisplayText(draft.shortDescription.value);
  const draftCategory = draft.category?.value ?? "(not set)";
  const draftSubcategory = draft.subcategory?.value ?? "(not set)";
  const draftPriority = draft.priority?.value ?? "(not set)";

  return [
    "# Product-Review Report",
    "",
    `Generated: ${timestamp}`,
    `Demo mode: Yes — all data is local, sanitized, and deterministic.`,
    "",
    "---",
    "",
    "## Demo Scenario",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Scenario ID | ${queueItem.scenarioId} |`,
    `| Subject | ${operatorSafeDisplayText(queueItem.subject)} |`,
    `| Source channel | ${queueItem.sourceChannel} |`,
    `| Language | ${queueItem.sourceLanguage} |`,
    `| Status | ${queueItem.status} |`,
    `| Requester label | ${queueItem.requesterLabel} |`,
    "",
    "---",
    "",
    "## TicketDraft Summary",
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Short Description | ${draftDescription} |`,
    `| Category | ${draftCategory} |`,
    `| Subcategory | ${draftSubcategory} |`,
    `| Priority | ${draftPriority} |`,
    "",
    "**Description preview:**",
    "",
    `> ${operatorSafeDisplayText(draft.description.value).slice(0, 500)}`,
    "",
    "---",
    "",
    "## KB / Support Recommendation",
    "",
    "The TicketDraft was built from the selected demo source using category mapping rules and demo knowledge-article matching. In a live ServiceNow environment, matching would query the configured KB sources. In this demo run, the matching used local deterministic mock knowledge articles.",
    "",
    "Category assigned via keyword matching on the source body and subject. Assignment group was derived from the category/issue mapping in the project profile. No real ServiceNow KB, assignment rules, or escalation logic were queried.",
    "",
    "---",
    "",
    "## Safety Boundary",
    "",
    "| Constraint | Status |",
    "|------------|--------|",
    "| Local-only execution | Active — no network calls, no cloud writes, no ServiceNow API |",
    "| No real ServiceNow write | Enforced — Save, Submit, Update, Resolve, Close are absent or disabled in demo mode |",
    "| No browser automation beyond Start QA Chromium / Verify current Incident / Autofill | Enforced — runtime is constrained to approved actions only |",
    "| No screenshots, HAR, traces, cookies, sessions, or storage export | Confirmed — validation entries track counts and sanitized summaries only |",
    "| No real ticket identifiers | Confirmed — all data is demo/fake |",
    "| No Excel / Graph / cloud workbook write | Confirmed — export uses browser Blob download only |",
    "",
    "---",
    "",
    "## Validation Run Summary",
    "",
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Total runs | ${validationRuns.length} |`,
    `| Passed | ${okRuns} |`,
    `| Blocked / Error | ${blockedRuns} |`,
    "",
    validationRuns.length > 0
      ? [
          "**Recent runs (reverse-chronological):**",
          "",
          "| Time | Action | Result | Details |",
          "|------|--------|--------|---------|",
          ...validationRuns
            .slice()
            .reverse()
            .slice(0, 10)
            .map(
              (run) =>
                `| ${run.timestamp} | ${operatorActionDisplayAction(run.action)} | ${run.status.toUpperCase()} | ${run.sanitizedSummary} |`
            ),
          ""
        ].join("\n")
      : "No validation runs recorded.\n",
    "---",
    "",
    "## What This Proves",
    "",
    "This report demonstrates that during this demo session:",
    "",
    "- The Service Desk intake-to-TicketDraft pipeline processed a source message and produced a structured incident draft (Short Description, Description, Work Notes, Category, Subcategory, Priority) deterministically from local mock data.",
    "- The app applied category/assignment-group keyword mappings from a project profile — the same mappings that would be configured for a real ServiceNow deployment.",
    "- The app matched the source text against a demo knowledge-article index and surfaced article titles relevant to the issue.",
    "- Operator runtime actions (browser launch, page check, autofill) ran within the approved boundary: no prohibited actions were executed, no real ServiceNow writes occurred.",
    "- All validation events were recorded as sanitized entries visible in the History page and exported here — proving the operator workflow completed without unauthorized side effects.",
    "",
    "---",
    "",
    "## What Remains Human-Only",
    "",
    "The following decisions and actions are NOT automated by this app and remain the responsibility of the human operator:",
    "",
    "1. **Final review of the TicketDraft** — the operator must read the generated Short Description, Description, and Work Notes, and edit them for accuracy before any real ServiceNow submission.",
    "2. **Save / Submit / Update / Resolve / Close in ServiceNow** — these actions are not performed by the app. The operator manually submits the final ticket in the ServiceNow UI.",
    "3. **Live KB / escalation check** — the app provides demo KB matches and category-based assignment groups  but does not resolve the ticket or make a final escalation decision. The operator must verify routing and KB articles against the live environment.",
    "4. **Verification of real browser output** — the app inspects the page for approved fields and simulates fill, but the operator must visually confirm the data landed correctly in ServiceNow.",
    "5. **Screenshots, evidence capture, HAR, traces** — the app does not capture or store any of these. The operator is responsible for gathering session evidence outside the app if needed.",
    "6. **Live ServiceNow configuration** — the operator must configure the environment URL, profile mappings, and KB sources before any real run. The demo mode ships with mock data only.",
    "",
    "---",
    "",
    "## Export Safety Notice",
    "",
    "This report was generated locally from in-memory demo state. No real ServiceNow data, ticket numbers, sys_ids, credentials, URLs, or customer PII are included. The file was downloaded via browser Blob — no cloud write, no external API call, no Excel/Graph write.",
    ""
  ].join("\n");
}

function triggerStringDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function operatorActionWorkingDetails(action: OperatorAction): string {
  return `${operatorActionLabel(action)} is running. If it does not finish, the app clears this local waiting state automatically. No ServiceNow action is taken.`;
}

type OperatorActionFinalStateInput =
  | { action: OperatorAction; kind: "response"; response: OperatorRuntimeResponse }
  | { action: OperatorAction; error: unknown; kind: "error" }
  | { action: OperatorAction; kind: "timeout"; timeoutMs?: number }
  | { action: OperatorAction; kind: "unmount" };

type OperatorActionFinalState = {
  action: OperatorAction;
  shouldApplyState: boolean;
  operatorBusyAction: OperatorAction | null;
  operatorStatus: OperatorActionStatus;
  operatorLastResponse: OperatorRuntimeResponse | null;
};

export function buildOperatorActionFinalState(input: OperatorActionFinalStateInput): OperatorActionFinalState {
  if (input.kind === "unmount") {
    return {
      action: input.action,
      shouldApplyState: false,
      operatorBusyAction: null,
      operatorStatus: defaultOperatorActionStatus(),
      operatorLastResponse: null
    };
  }

  if (input.kind === "response") {
    return {
      action: input.action,
      shouldApplyState: true,
      operatorBusyAction: null,
      operatorStatus: operatorStatusFromResponse(input.action, input.response),
      operatorLastResponse: input.response
    };
  }

  if (input.kind === "timeout") {
    const timeoutSeconds = Math.max(1, Math.round((input.timeoutMs ?? OPERATOR_RUNTIME_ACTION_TIMEOUT_MS) / 1000));
    return {
      action: input.action,
      shouldApplyState: true,
      operatorBusyAction: null,
      operatorStatus: {
        label: `${operatorActionLabel(input.action)} took too long`,
        tone: "blocked",
        details: `The app cleared the local waiting state after ${timeoutSeconds} seconds so you can retry Start QA Chromium. No ServiceNow action was taken.`
      },
      operatorLastResponse: buildOperatorTimeoutResponse(input.action)
    };
  }

  return {
    action: input.action,
    shouldApplyState: true,
    operatorBusyAction: null,
    operatorStatus: {
      label: `${operatorActionLabel(input.action)} failed`,
      tone: "blocked",
      details: sanitizeOperatorRuntimeError(input.error)
    },
    operatorLastResponse: null
  };
}

function buildOperatorTimeoutResponse(action: OperatorAction): OperatorRuntimeResponse {
  if (action === "launch") {
    return { ok: false, launch: { status: "timeout", blockedReason: "browser-step-timeout" } };
  }
  if (action === "verify") {
    return { ok: false, fieldInspection: { status: "timeout", blockedReason: "browser-step-timeout" } };
  }
  return { ok: false, runtime: { status: "timeout", blockedReason: "browser-step-timeout" } };
}

function sanitizeOperatorRuntimeError(_error: unknown): string {
  return "Desktop backend failed before returning a sanitized operator result. Check current ticket page remains disabled; retry Start test browser from the desktop app.";
}

function defaultOperatorActionStatus(): OperatorActionStatus {
  return {
    label: "Ready",
    tone: "idle",
    details: "Use the buttons below to start the dedicated QA test browser profile, check the current ticket page, then autofill allowed fields for manual review."
  };
}

function initialOperatorStatusFromResponse(response: OperatorRuntimeResponse | null): OperatorActionStatus {
  if (!response) {
    return defaultOperatorActionStatus();
  }
  if (response.launch) {
    return operatorStatusFromResponse("launch", response);
  }
  if (response.runtime) {
    return operatorStatusFromResponse("autofill", response);
  }
  if (response.fieldInspection || response.defaultPlan) {
    return operatorStatusFromResponse("verify", response);
  }
  return defaultOperatorActionStatus();
}

function sanitizeOperatorRuntimeLogPath(value?: string): string | undefined {
  const normalized = value?.trim().replace(/\\/g, "/");
  if (!normalized) {
    return undefined;
  }

  const marker = ".local/startup-logs/";
  const relativeCandidate = normalized.startsWith(marker)
    ? normalized
    : normalized.includes(`/${marker}`)
      ? `${marker}${normalized.slice(normalized.lastIndexOf(`/${marker}`) + marker.length + 1)}`
      : undefined;

  return relativeCandidate && /^\.local\/startup-logs\/[A-Za-z0-9._-]+\.jsonl$/.test(relativeCandidate)
    ? relativeCandidate
    : undefined;
}

function operatorRuntimeLogDetails(response: OperatorRuntimeResponse): string {
  const runtimeLogPath = sanitizeOperatorRuntimeLogPath(response.launch?.runtimeLogPath);
  return runtimeLogPath ? ` Sanitized browser log: ${runtimeLogPath}.` : "";
}

function sanitizeOperatorDiagnosticText(value: string | undefined, fallback: string): string {
  const raw = value?.trim() || fallback;
  return raw
    .replace(/\bsha256:[a-f0-9]{32,}\b/gi, "[REDACTED_FINGERPRINT]")
    .replace(/\b[a-f0-9]{64,}\b/gi, "[REDACTED_FINGERPRINT]")
    .replace(/\bauthorization\s*:\s*(?:bearer|basic)?\s*[^\s<>"')]+/gi, "[REDACTED_SECRET]")
    .replace(/\b[A-Za-z0-9_-]*(?:api[_-]?key|token|secret|password|passwd|cookie|session|auth)[A-Za-z0-9_-]*\s*[:=]\s*(?:(?:bearer|basic)\s+)?[^\s<>"')]+/gi, "[REDACTED_SECRET]")
    .replace(/\bCDP\b/gi, "browser connection")
    .replace(/\bDevTools\b/gi, "browser diagnostics")
    .replace(/startup\/runtime log path/gi, "startup and browser log path")
    .replace(/\b(?:https?|wss?):\/\/[^\s<>"')]+/gi, "[REDACTED_URL]")
    .replace(/\b(?:127\.0\.0\.1|localhost):\d+\/[^\s<>"')]+/gi, "[REDACTED_URL]")
    .replace(/\b(?:127\.0\.0\.1|localhost|0\.0\.0\.0):\d+\b/gi, "[REDACTED_URL]")
    .replace(/\[::1\]:\d+\b/gi, "[REDACTED_URL]")
    .replace(/\b(?:[A-Za-z0-9-]+\.)*(?:service-now|servicenow)[A-Za-z0-9.-]*(?::\d+)?(?:\/[^\s<>"')]+)?/gi, "[REDACTED_HOST]")
    .replace(/\b(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?::\d+)?\/[^\s<>"')]+/g, "[REDACTED_URL]")
    .replace(/\b[A-Za-z]:[\\/][^\s<>"')]+/g, "[REDACTED_PATH]")
    .replace(/\\\\[A-Za-z0-9._$-]+\\[^\s<>"')]+/g, "[REDACTED_PATH]")
    .replace(/\/(?:[^\s<>"')/]+\/)*[^\s<>"')]+/g, "[REDACTED_PATH]");
}

function operatorRuntimeBlockedReasonDetails(value: string | undefined, fallback: string): string {
  switch (value) {
    case "cdp-endpoint-denied":
      return "Browser connection is no longer reachable. Click Start test browser again, then open the current Incident form in that test browser. No ServiceNow action was taken.";
    case "cdp-page-selection-denied":
      return "Could not find one unique approved Incident tab in the test browser. Keep exactly one current Incident form tab open, then retry Check current ticket page. No ServiceNow action was taken.";
    case "qa-runtime-required":
      return "The desktop runtime is locked to QA workspace controls. Choose QA workspace and restart the browser safety steps. No ServiceNow action was taken.";
    default:
      return sanitizeOperatorDiagnosticText(value, fallback);
  }
}

function operatorLaunchDetails(response: OperatorRuntimeResponse, fallbackStatus: string): string {
  const baseDetails = response.ok
    ? "The dedicated QA test browser profile is open. Log in manually if needed, open an Incident form, then click Check current ticket page."
    : operatorRuntimeBlockedReasonDetails(response.launch?.blockedReason, fallbackStatus);
  return `${baseDetails}${operatorRuntimeLogDetails(response)}`;
}

function operatorStatusFromResponse(
  action: OperatorAction,
  response: OperatorRuntimeResponse
): OperatorActionStatus {
  if (action === "launch") {
    const status = response.launch?.status ?? "unknown";
    return response.ok
      ? { label: "Browser connected", tone: "success", details: operatorLaunchDetails(response, status) }
      : { label: "Browser connection blocked", tone: "blocked", details: operatorLaunchDetails(response, status) };
  }
  if (action === "verify") {
    const plannedCount = response.defaultPlan?.plannedFields?.length ?? 0;
    return response.ok
      ? { label: "Current ticket page checked", tone: "success", details: `${plannedCount} fields are ready for local review. Autofill remains text-only; click Autofill allowed fields only after reviewing the preview.` }
      : { label: "Page check blocked", tone: "blocked", details: operatorRuntimeBlockedReasonDetails(response.fieldInspection?.blockedReason ?? response.defaultPlan?.blockedReason, "Current page is not a verified QA Incident form.") };
  }
  const filledCount = response.runtime?.filledFields?.length ?? 0;
  return response.ok
    ? { label: "Autofill completed", tone: "success", details: `${filledCount} text fields were filled. Review manually in ServiceNow. This tool did not Save, Submit, Update, Resolve, Close, upload, email, or call ServiceNow API.` }
    : { label: "Autofill blocked", tone: "blocked", details: operatorRuntimeBlockedReasonDetails(response.runtime?.blockedReason ?? response.defaultPlan?.blockedReason, "No field was changed.") };
}

type OperatorActionFeedback = { tone: "success" | "blocked"; text: string };

function operatorActionCardFeedback(
  action: OperatorAction,
  response: OperatorRuntimeResponse | null,
  workbenchCopy: OperatorWorkbenchCopy
): OperatorActionFeedback | null {
  if (!response) {
    return null;
  }

  if (action === "launch" && response.launch) {
    return response.ok
      ? { tone: "success", text: workbenchCopy.runtime.statusCdpReady }
      : {
          tone: "blocked",
          text: `${workbenchCopy.runtime.statusBlocked}: ${operatorRuntimeBlockedReasonDetails(
            response.launch.blockedReason,
            "Browser connection blocked."
          )}${operatorRuntimeLogDetails(response)}`
        };
  }

  if (action === "verify" && response.fieldInspection && !response.runtime) {
    return response.ok
      ? { tone: "success", text: workbenchCopy.runtime.statusVerified }
      : {
          tone: "blocked",
          text: `${workbenchCopy.runtime.statusBlocked}: ${operatorRuntimeBlockedReasonDetails(
            response.fieldInspection.blockedReason ?? response.defaultPlan?.blockedReason,
            "Current page is not a verified QA Incident form."
          )}`
        };
  }

  if (action === "autofill" && response.runtime) {
    const filledCount = response.runtime.filledFields?.length ?? 0;
    return response.ok
      ? {
          tone: "success",
          text: workbenchCopy.runtime.autofillCompletedFeedback(filledCount)
        }
      : {
          tone: "blocked",
          text: `${workbenchCopy.runtime.statusBlocked}: ${operatorRuntimeBlockedReasonDetails(
            response.runtime.blockedReason ?? response.defaultPlan?.blockedReason,
            "No field was changed."
          )}`
        };
  }

  return null;
}

function QaOperatorRuntimePanel({
  busyAction,
  cdpEndpointReady,
  cdpState,
  lastResponse,
  mode,
  targetReady,
  verifiedPageFingerprintReady,
  onAutofill,
  onTextFieldAutofill,
  onCollapse,
  onLaunchBrowser,
  onResetRuntime,
  onVerify,
  status,
  targetLabel,
  workbenchCopy
}: {
  busyAction: "launch" | "verify" | "autofill" | null;
  cdpEndpointReady: boolean;
  cdpState: CdpState;
  lastResponse: OperatorRuntimeResponse | null;
  mode: WorkbenchEnvironmentMode;
  targetReady: boolean;
  verifiedPageFingerprintReady: boolean;
  onAutofill: () => void;
  onTextFieldAutofill: () => void;
  onCollapse: () => void;
  onLaunchBrowser: () => void;
  onResetRuntime: () => void;
  onVerify: () => void;
  status: OperatorActionStatus;
  targetLabel: string;
  workbenchCopy: OperatorWorkbenchCopy;
}) {
  const [whatChangedExpanded, setWhatChangedExpanded] = useState(false);
  const canUseRuntime = isQaWorkbenchMode(mode);
  const qaBoundCdpEndpointReady = canUseRuntime && cdpEndpointReady;
  const qaBoundCdpState = canUseRuntime ? cdpState : "disconnected";
  const qaBoundVerifiedPageFingerprintReady = qaBoundCdpEndpointReady && verifiedPageFingerprintReady;
  const launchDisabled = !canUseRuntime || !targetReady || busyAction !== null;
  const verifyDisabled = !canUseRuntime || !targetReady || !qaBoundCdpEndpointReady || busyAction !== null;
  const autofillDisabled = !canUseRuntime || !targetReady || !qaBoundCdpEndpointReady || busyAction !== null || !qaBoundVerifiedPageFingerprintReady;
  const launchDisabledReason = !canUseRuntime
    ? workbenchCopy.runtime.disabledProductionReason
    : !targetReady
      ? workbenchCopy.runtime.disabledTargetReason
      : busyAction !== null
        ? workbenchCopy.runtime.disabledBusyReason
        : workbenchCopy.runtime.startReadyReason;
  const verifyDisabledReason = !canUseRuntime
    ? workbenchCopy.runtime.disabledProductionReason
    : !targetReady
      ? workbenchCopy.runtime.disabledTargetReason
      : busyAction !== null
        ? workbenchCopy.runtime.disabledBusyReason
        : !qaBoundCdpEndpointReady
          ? workbenchCopy.runtime.verifyCdpReason
          : workbenchCopy.runtime.verifyReadyReason;
  const autofillDisabledReason = !canUseRuntime
    ? workbenchCopy.runtime.disabledProductionReason
    : !targetReady
      ? workbenchCopy.runtime.disabledTargetReason
      : busyAction !== null
        ? workbenchCopy.runtime.disabledBusyReason
        : !qaBoundCdpEndpointReady
          ? workbenchCopy.runtime.verifyCdpReason
          : !qaBoundVerifiedPageFingerprintReady
            ? workbenchCopy.runtime.autofillVerifyReason
            : workbenchCopy.runtime.autofillReadyReason;
  const runtimeStatusChip =
    status.tone === "working"
      ? workbenchCopy.runtime.statusBusy
      : status.tone === "blocked"
        ? workbenchCopy.runtime.statusBlocked
        : status.tone === "success"
          ? workbenchCopy.runtime.statusSuccess
          : workbenchCopy.runtime.statusReady;
  const runtimeStatusDescription = qaBoundVerifiedPageFingerprintReady
    ? workbenchCopy.runtime.statusVerified
    : qaBoundCdpEndpointReady
      ? workbenchCopy.runtime.statusCdpReady
      : workbenchCopy.runtime.statusWaiting;
  const cdpStateLabel: Record<CdpState, string> = {
    disconnected: workbenchCopy.runtime.browserDisconnected,
    connecting: workbenchCopy.runtime.browserConnecting,
    connected: workbenchCopy.runtime.browserConnected,
    error: workbenchCopy.runtime.browserError
  };
  const lastPlanCount = lastResponse?.defaultPlan?.plannedFields?.length ?? 0;
  const filledCount = lastResponse?.runtime?.filledFields?.length ?? 0;
  const evidenceText = lastResponse
    ? `${workbenchCopy.runtime.sanitizedEvidence}${lastPlanCount > 0 ? ` ${lastPlanCount} planned text fields.` : ""}${filledCount > 0 ? ` ${filledCount} filled text fields.` : ""}`
    : workbenchCopy.runtime.noEvidence;
  const actionCards = [
    {
      step: "1",
      title: workbenchCopy.runtime.startTitle,
      description: workbenchCopy.runtime.startDescription,
      buttonText: busyAction === "launch" ? workbenchCopy.runtime.starting : workbenchCopy.runtime.startTitle,
      disabled: launchDisabled,
      reason: launchDisabledReason,
      feedback: operatorActionCardFeedback("launch", lastResponse, workbenchCopy),
      onClick: onLaunchBrowser,
      busy: busyAction === "launch",
      ready: !launchDisabled
    },
    {
      step: "2",
      title: workbenchCopy.runtime.verifyTitle,
      description: workbenchCopy.runtime.verifyDescription,
      buttonText: busyAction === "verify" ? workbenchCopy.runtime.verifying : workbenchCopy.runtime.verifyTitle,
      disabled: verifyDisabled,
      reason: verifyDisabledReason,
      feedback: operatorActionCardFeedback("verify", lastResponse, workbenchCopy),
      onClick: onVerify,
      busy: busyAction === "verify",
      ready: !verifyDisabled
    },
    {
      step: "3",
      title: workbenchCopy.runtime.autofillTitle,
      description: workbenchCopy.runtime.autofillDescription,
      buttonText: busyAction === "autofill" ? workbenchCopy.runtime.autofilling : workbenchCopy.runtime.autofillTitle,
      disabled: autofillDisabled,
      reason: autofillDisabledReason,
      feedback: operatorActionCardFeedback("autofill", lastResponse, workbenchCopy),
      onClick: onAutofill,
      busy: busyAction === "autofill",
      ready: !autofillDisabled
    }
  ];

  return (
    <section className="operator-runtime-panel target-runtime-panel" aria-labelledby="runtime-rail-title">
      <header className="runtime-panel-header">
        <div>
          <p className="eyebrow">{workbenchCopy.runtime.eyebrow}</p>
          <h2 id="runtime-rail-title">{workbenchCopy.runtime.title}</h2>
        </div>
        <div className="runtime-panel-header-actions">
          <span className={`runtime-status-chip ${status.tone}`}>{runtimeStatusChip}</span>
          <span className={`browser-status-chip ${qaBoundCdpState}`} aria-label={`Browser state: ${qaBoundCdpState}`}>
            {cdpStateLabel[qaBoundCdpState]}
          </span>
          <button
            aria-label={workbenchCopy.runtime.collapseRuntime}
            className="runtime-rail-collapse-button"
            type="button"
            onClick={onCollapse}
          >
            <WorkbenchIcon name="chevron" />
          </button>
        </div>
      </header>

      <div className="runtime-action-list" aria-label={workbenchCopy.runtime.title}>
        {actionCards.map((action) => (
          <article
            className={action.busy ? "runtime-action-card working" : action.ready ? "runtime-action-card ready" : "runtime-action-card blocked"}
            key={action.step}
          >
            <div className="runtime-action-topline">
              <span className="runtime-step-number">{action.step}</span>
              <span className={action.busy ? "runtime-mini-chip working" : action.ready ? "runtime-mini-chip ready" : "runtime-mini-chip blocked"}>
                {action.busy
                  ? workbenchCopy.runtime.statusBusy
                  : action.ready
                    ? workbenchCopy.runtime.readyChip
                    : workbenchCopy.runtime.waitingChip}
              </span>
            </div>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
            <button disabled={action.disabled} type="button" onClick={action.onClick}>
              <span>{action.step} {action.buttonText}</span>
              <WorkbenchIcon name="chevron" />
            </button>
            <small>{action.reason}</small>
            {action.feedback ? (
              <small className={`runtime-action-feedback ${action.feedback.tone}`} role="status">
                {action.feedback.text}
              </small>
            ) : null}
          </article>
        ))}
      </div>

      <section className="runtime-status-card" aria-labelledby="runtime-status-title">
        <div>
          <p className="eyebrow">{workbenchCopy.runtime.sanitizedMode}</p>
          <h3 id="runtime-status-title">{workbenchCopy.runtime.runtimeStatus}</h3>
        </div>
        <dl>
          <div>
            <dt>{workbenchCopy.runtime.sanitizedMode}</dt>
            <dd>{targetLabel}</dd>
          </div>
          <div>
            <dt>{workbenchCopy.runtime.cdpLabel}</dt>
            <dd>{qaBoundCdpEndpointReady ? workbenchCopy.runtime.cdpReady : workbenchCopy.runtime.cdpWaiting}</dd>
          </div>
        </dl>
        <p>{runtimeStatusDescription}</p>
        <strong className="runtime-status-label">{status.label}</strong>
        <p className="runtime-status-detail">{status.details}</p>
        <small>{evidenceText}</small>
        <button className="runtime-reset-button" type="button" onClick={onResetRuntime}>
          {workbenchCopy.runtime.resetRuntimeState}
        </button>
        <small>{workbenchCopy.runtime.resetRuntimeStateHelper}</small>
      </section>

      <section className="runtime-safety-note" aria-labelledby="runtime-safety-title">
        <WorkbenchIcon name="shield" />
        <div>
          <h3 id="runtime-safety-title">{workbenchCopy.runtime.safetyTitle}</h3>
          <p>{workbenchCopy.runtime.safetyNote}</p>
        </div>
      </section>

      <section className="runtime-what-changed" aria-labelledby="what-changed-title">
        <button
          aria-expanded={whatChangedExpanded}
          aria-controls="what-changed-content"
          className="what-changed-toggle"
          type="button"
          onClick={() => setWhatChangedExpanded((current) => !current)}
        >
          <WorkbenchIcon name="chevron" />
          <h3 id="what-changed-title">{workbenchCopy.runtime.whatChanged.title}</h3>
        </button>
        {whatChangedExpanded && (
          <div id="what-changed-content" className="what-changed-content">
            <p>{workbenchCopy.runtime.whatChanged.summary}</p>
            <div className="what-changed-section">
              <strong>{workbenchCopy.runtime.whatChanged.whatIsAutomated}</strong>
            </div>
            <div className="what-changed-section">
              <strong>{workbenchCopy.runtime.whatChanged.whatIsHumanOnly}</strong>
            </div>
            <div className="what-changed-section">
              <strong>{workbenchCopy.runtime.whatChanged.whyRepeatedValidation}</strong>
            </div>
            <ul className="what-changed-limits">
              {workbenchCopy.runtime.whatChanged.doesNotDo.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="what-changed-footer">{workbenchCopy.runtime.whatChanged.footer}</p>
          </div>
        )}
      </section>
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
      : "Planning check only: browser text-field execution remains blocked until a later selector-verified execution slice is reviewed.";

  return (
    <section className="qa-autofill-panel qa-smoke-panel" aria-labelledby="qa-autofill-title">
      <header className="qa-smoke-header">
        <div>
          <p className="eyebrow">QA browser-assisted text-field autofill planning check</p>
          <h2 id="qa-autofill-title">QA browser-assisted text-field autofill planning check</h2>
          <p>
            Planning/review only in this slice. Text fields only: Short description, Description, Work notes.
            Autofill approval does not approve Save, Submit, Update, Resolve, or Close.
          </p>
        </div>
        <strong className={plan.status === "ready-for-autofill" ? "qa-smoke-status ready" : "qa-smoke-status"}>
          {statusText}
        </strong>
      </header>

      <section className="qa-smoke-safe-scope" aria-labelledby="qa-autofill-safe-scope-title">
        <h3 id="qa-autofill-safe-scope-title">First autofill planning safe scope</h3>
        <ul>
          <li>QA/dev only, single ticket only, dedicated tool-owned browser profile; saved sign-in can be reused after your manual login.</li>
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
          <strong>No Save / Submit / Update / Resolve / Close</strong>
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
        <span>Tool-owned browser profile confirmed: this autofill test uses only the workbench profile.</span>
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
  { key: "shortDescription", label: "Short description", value: "Blocked until the safe check is ready." },
  { key: "description", label: "Description", value: "Blocked until the safe check is ready." },
  { key: "workNotes", label: "Work notes", value: "Blocked until the safe check is ready." }
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

function operatorSafeDisplayText(value: string): string {
  return value
    .replaceAll("QA TEST ONLY - Fake ", "")
    .replaceAll("QA TEST ONLY - ", "")
    .replaceAll("Fake ", "Sanitized ")
    .replaceAll("fake sanitized", "sanitized")
    .replaceAll("Fake", "Sanitized")
    .replaceAll("Demo", "Sanitized")
    .replaceAll("demo", "sanitized")
    .replaceAll("sanitized sanitized", "sanitized")
    .replaceAll("Sanitized sanitized", "Sanitized")
    .replaceAll("Sanitized Sanitized", "Sanitized");
}

function WorkbenchIcon({ name }: { name: WorkbenchIconName }) {
  const commonProps = {
    "aria-hidden": true,
    className: "workbench-svg-icon",
    focusable: false,
    viewBox: "0 0 24 24"
  } as const;

  switch (name) {
    case "app":
      return (
        <svg {...commonProps}>
          <path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8L12 3.5Z" />
          <path d="M8.5 12.2h7M9 9.4h6M9 15h4.5" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...commonProps}>
          <path d="M4 6.5h16v9.2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5Z" />
          <path d="M4 13h4.4l1.5 2h4.2l1.5-2H20" />
        </svg>
      );
    case "workbench":
      return (
        <svg {...commonProps}>
          <path d="M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z" />
        </svg>
      );
    case "knowledge":
      return (
        <svg {...commonProps}>
          <path d="M6 5.5h8.5A3.5 3.5 0 0 1 18 9v9.5H8A2 2 0 0 1 6 16.5v-11Z" />
          <path d="M9 8.5h5M9 12h6" />
        </svg>
      );
    case "history":
      return (
        <svg {...commonProps}>
          <path d="M6.5 8.4A6.5 6.5 0 1 1 5.8 14" />
          <path d="M6.5 5.5v3.2h3.1M12 8v4.5l3 1.8" />
        </svg>
      );
    case "search":
      return (
        <svg {...commonProps}>
          <circle cx="10.5" cy="10.5" r="5.5" />
          <path d="m15 15 4 4" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <path d="M12 8.3a3.7 3.7 0 1 1 0 7.4 3.7 3.7 0 0 1 0-7.4Z" />
          <path d="M4.8 13.5v-3l2-.7.6-1.4-.9-1.9 2.1-2.1 1.9.9 1.5-.6.6-2h3l.7 2 1.4.6 1.9-.9 2.1 2.1-.9 1.9.6 1.4 2 .7v3l-2 .7-.6 1.4.9 1.9-2.1 2.1-1.9-.9-1.4.6-.7 2h-3l-.6-2-1.5-.6-1.9.9-2.1-2.1.9-1.9-.6-1.4-2-.7Z" />
        </svg>
      );
    case "source":
      return (
        <svg {...commonProps}>
          <path d="M5.5 4.5h9L18.5 9v10.5h-13v-15Z" />
          <path d="M14.5 4.5V9h4M8.5 12h7M8.5 15h5" />
        </svg>
      );
    case "summary":
      return (
        <svg {...commonProps}>
          <path d="M5 5h14v14H5V5Z" />
          <path d="M8 9h8M8 12h8M8 15h5" />
        </svg>
      );
    case "draft":
      return (
        <svg {...commonProps}>
          <path d="M5.5 19 7 14.8 15.8 6a2 2 0 0 1 2.8 2.8L9.8 17.6 5.5 19Z" />
          <path d="M14.5 7.3 17.3 10" />
        </svg>
      );
    case "shield":
      return (
        <svg {...commonProps}>
          <path d="M12 3.8 19 6v5.5c0 4.4-2.9 7.2-7 8.7-4.1-1.5-7-4.3-7-8.7V6l7-2.2Z" />
          <path d="m8.8 12.2 2.1 2.1 4.5-5" />
        </svg>
      );
    case "globe":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M4 12h16M12 4c2.2 2.3 3.2 4.9 3.2 8s-1 5.7-3.2 8M12 4c-2.2 2.3-3.2 4.9-3.2 8s1 5.7 3.2 8" />
        </svg>
      );
    case "chevron":
    default:
      return (
        <svg {...commonProps}>
          <path d="m8 9.5 4 4 4-4" />
        </svg>
      );
  }
}

function getWorkbenchEnvironmentChipLabel(mode: WorkbenchEnvironmentMode, workbenchCopy: OperatorWorkbenchCopy): string {
  return mode === "production-shadow" ? workbenchCopy.environment.production : workbenchCopy.environment.qa;
}

function getWorkbenchSettingsEnvironmentLabel(mode: WorkbenchEnvironmentMode, workbenchCopy: OperatorWorkbenchCopy): string {
  return mode === "production-shadow" ? workbenchCopy.settings.productionEnvironment : workbenchCopy.settings.qaTestEnvironment;
}

function getWorkbenchSettingsUrlLabel(mode: WorkbenchEnvironmentMode, workbenchCopy: OperatorWorkbenchCopy): string {
  return mode === "production-shadow" ? workbenchCopy.settings.productionUrl : workbenchCopy.settings.qaUrl;
}

function getWorkbenchSettingsUrlDescription(mode: WorkbenchEnvironmentMode, workbenchCopy: OperatorWorkbenchCopy): string {
  return mode === "production-shadow" ? workbenchCopy.settings.urlDescriptionProduction : workbenchCopy.settings.urlDescriptionQa;
}

function getWorkbenchSettingsSubmitPolicy(mode: WorkbenchEnvironmentMode, workbenchCopy: OperatorWorkbenchCopy): string {
  return mode === "production-shadow" ? workbenchCopy.settings.productionPolicy : workbenchCopy.settings.qaSubmitPolicy;
}


function languageDisplayLabel(language: LanguageCode): string {
  return languageOptions.find((option) => option.code === language)?.label ?? language;
}

function languageShortLabel(language: LanguageCode): string {
  switch (language) {
    case "en-US":
      return "EN";
    case "zh-CN":
      return "简";
    case "zh-TW":
      return "繁";
    case "es-ES":
      return "ES";
  }
}

function formatSourceTime(receivedAt: string): string {
  return receivedAt.split(" ").at(1) ?? receivedAt;
}

function operatorShortSourceTitle(subject: string): string {
  const title = operatorSafeDisplayText(subject);
  return title.length > 48 ? `${title.slice(0, 45).trim()}…` : title;
}

function formatQueueStatus(status: DemoQueueStatus, workbenchCopy: OperatorWorkbenchCopy): string {
  switch (status) {
    case "New":
      return workbenchCopy.list.new;
    case "Reviewed":
      return workbenchCopy.list.inReview;
    case "Drafted":
      return workbenchCopy.list.drafted;
    case "Done":
      return workbenchCopy.list.done;
    case "Skipped":
      return workbenchCopy.list.skipped;
  }
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
      return "Load Mock Account Access Demo";
  }
}
