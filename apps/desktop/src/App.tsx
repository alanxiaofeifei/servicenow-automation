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
  requesterLabel: string;
  receivedAt: string;
  subject: string;
  bodyPreview: string;
  sourceBody: string;
  sourceChannel: SourceChannel;
  status: DemoQueueStatus;
};

type FieldReviewChecklistItem = {
  id: string;
  label: string;
};

type PreparedCopyDraft = {
  confirmation: string;
  text: string;
};

type LanguageCode = "zh-CN" | "en-US" | "es-ES";

type UiTranslations = {
  safetyTagline: string;
  productEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  languageLabel: string;
  languageHelper: string;
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

const languageOptions: { code: LanguageCode; label: string }[] = [
  { code: "zh-CN", label: "中文" },
  { code: "en-US", label: "English" },
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
  "es-ES": {
    safetyTagline: "Solo borradores de IA. Se requiere revisión humana y envío manual.",
    productEyebrow: "P0 acelerado para prueba de campo",
    heroTitle: "Automatización de ServiceNow",
    heroSubtitle:
      "Cockpit de Service Desk con revisión humana para validar elementos sanitizados de la cola y preparar borradores editables de Incident.",
    languageLabel: "Idioma de la interfaz",
    languageHelper: "Se pueden añadir idiomas futuros por proyecto.",
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

const demoIntakeQueue: DemoQueueItem[] = [
  {
    id: "demo-teams-vpn",
    scenarioId: "vpn-issue",
    requesterLabel: "Demo requester A",
    receivedAt: "2026-05-18 08:15",
    subject: "Teams note: VPN connection issue after password reset",
    bodyPreview:
      "A demo teammate reports VPN cannot connect after a recent password reset. The VPN client loops at the MFA prompt.",
    sourceBody:
      "Teams-style demo message:\n\n[08:15] Demo requester: Hi team,\n[08:16] Demo requester: RE: [EXTERNAL] VPN cannot connect after a recent password reset. The VPN client keeps looping at the MFA prompt.\n[08:18] Demo requester: Impact: Internet works without VPN, but remote access is unavailable.\n\nThanks,\nDemo requester A\n\nThis is fake sanitized intake data only. No Teams tenant, channel, chat, user profile, or message link is connected.",
    sourceChannel: "Teams message",
    status: "New"
  },
  {
    id: "demo-self-service-windows",
    scenarioId: "windows-issue",
    requesterLabel: "Demo requester B",
    receivedAt: "2026-05-18 08:40",
    subject: "Self-service request: Windows laptop slow after update",
    bodyPreview:
      "A fake portal submission says a Windows laptop became very slow after the latest update. Reboot was attempted once.",
    sourceBody:
      "Self-service-style demo submission:\n\nRequest ID: DEMO-PORTAL-002\nDescription: A demo requester reports that a Windows laptop became very slow after the latest update.\nImpact: Reboot was attempted once, but startup and application launch remain slow for the user.\n\nThis is fake sanitized intake data only. No portal polling, ticket number, requester profile, or live self-service record is connected.",
    sourceChannel: "Self-service ticket",
    status: "New"
  },
  {
    id: "demo-chat-account",
    scenarioId: "account-login-issue",
    requesterLabel: "Demo requester C",
    receivedAt: "2026-05-18 09:05",
    subject: "Chat transcript: account login issue after password change",
    bodyPreview:
      "A sanitized chat transcript says login fails after password change. MFA appears but authentication fails repeatedly.",
    sourceBody:
      "ServiceNow Chat-style demo transcript:\n\nTranscript ID: DEMO-CHAT-003\n[09:05] Demo requester: I cannot login after changing password.\n[09:06] Demo support: Does the MFA prompt appear?\n[09:07] Demo requester: Yes, but authentication fails repeatedly. I can access some services but not the required application.\n\nThis is fake sanitized intake data only. No ServiceNow Chat, ServiceNow API, transcript ID, or live conversation is connected.",
    sourceChannel: "ServiceNow Chat transcript",
    status: "New"
  },
  {
    id: "demo-shared-mailbox-vpn",
    scenarioId: "vpn-issue",
    requesterLabel: "Demo requester D",
    receivedAt: "2026-05-18 09:30",
    subject: "Shared mailbox item: remote access unavailable",
    bodyPreview:
      "A shared mailbox style item reports remote access is unavailable while normal internet access still works.",
    sourceBody:
      "Shared mailbox-style demo item:\n\nFrom: Demo requester D\nTo: Demo service desk\nSubject: RE: [EXTERNAL] FW: remote access unavailable\n\nHello support,\nRemote access is unavailable after password reset at 09:30. Normal internet access works, but VPN fails and MFA keeps repeating.\n\nRegards,\nDemo requester D\n\nThis is fake sanitized intake data only. No mailbox, email address, message header, attachment, .msg file, or .eml file is connected.",
    sourceChannel: "Shared mailbox item",
    status: "New"
  }
];

export function App() {
  const [language, setLanguage] = useState<LanguageCode>("en-US");
  const [selectedScenarioId, setSelectedScenarioId] = useState<ManualPasteScenario["id"]>("vpn-issue");
  const [selectedQueueItemId, setSelectedQueueItemId] = useState(demoIntakeQueue[0].id);
  const [queueItems, setQueueItems] = useState<DemoQueueItem[]>(demoIntakeQueue);
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

  const selectedEnvironment = getServiceNowEnvironmentConfig(selectedEnvironmentMode);
  const t = uiTranslations[language];
  const draft = applyOverrides(initialDraft, fieldOverrides);
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
    setQueueItems((items) => items.map((item) => (item.id === itemId ? { ...item, status } : item)));
  }

  function updateField(fieldName: keyof TicketDraft, value: string) {
    setFieldOverrides((current) => ({ ...current, [fieldName]: value }));
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
          <LanguageSelector language={language} onLanguageChange={setLanguage} t={t} />
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

function buildDraftForQueueItem(item: DemoQueueItem): TicketDraft {
  const context = buildContextForQueueItem(item);
  const sourceCleanup = normalizeSourceContextText({
    sourceType: context.sourceType,
    rawText: context.rawText
  });
  const kbMatches = searchKnowledgeArticles(sourceCleanup.normalizedText, demoKnowledgeArticles, { limit: 3 });
  return generateMockTicketDraft({ context, profile, kbMatches }, { idFactory: () => "desktop-demo-draft" });
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

function applyOverrides(draft: TicketDraft, overrides: Record<string, string>): TicketDraft {
  return {
    ...draft,
    shortDescription: applyFieldOverride(draft.shortDescription, overrides.shortDescription),
    description: applyFieldOverride(draft.description, overrides.description),
    workNotes: applyFieldOverride(draft.workNotes, overrides.workNotes)
  };
}

function applyFieldOverride(field: FieldDraft, value: string | undefined): FieldDraft {
  return value === undefined ? field : { ...field, value };
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
