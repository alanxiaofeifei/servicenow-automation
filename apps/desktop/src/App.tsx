import { useMemo, useState } from "react";

import { demoManualPasteScenarios, ManualPasteAdapter, type ManualPasteScenario } from "@servicenow-automation/adapters/browser";
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
import type { FieldDraft, TicketDraft } from "@servicenow-automation/core";

const manualPasteAdapter = new ManualPasteAdapter({
  idFactory: () => "desktop-demo-context",
  now: () => new Date("2026-05-18T12:00:00.000Z")
});

const profile = loadDemoYageoProfile();

type DemoQueueStatus = "New" | "Reviewed" | "Drafted" | "Done" | "Skipped";

type DemoQueueItem = {
  id: string;
  scenarioId: ManualPasteScenario["id"];
  senderLabel: string;
  receivedAt: string;
  subject: string;
  bodyPreview: string;
  sourceBody: string;
  sourceType: string;
  status: DemoQueueStatus;
};

const demoMailQueue: DemoQueueItem[] = [
  {
    id: "demo-mail-vpn",
    scenarioId: "vpn-issue",
    senderLabel: "Demo requester A",
    receivedAt: "2026-05-18 08:15",
    subject: "VPN connection issue after password reset",
    bodyPreview:
      "User reports VPN cannot connect after a recent password reset. The VPN client loops at the MFA prompt.",
    sourceBody:
      "Hello support,\n\nA demo user reports that VPN cannot connect after a recent password reset. The VPN client keeps looping at the MFA prompt. Internet works without VPN, but remote access is unavailable.\n\nThis is sanitized demo queue data only.",
    sourceType: "Demo mail paste",
    status: "New"
  },
  {
    id: "demo-mail-windows",
    scenarioId: "windows-issue",
    senderLabel: "Demo requester B",
    receivedAt: "2026-05-18 08:40",
    subject: "Windows laptop slow after update",
    bodyPreview:
      "User reports a Windows laptop became very slow after the latest update. Reboot was attempted once.",
    sourceBody:
      "Hello support,\n\nA demo user reports that a Windows laptop became very slow after the latest update. Reboot was attempted once, but startup and application launch remain slow.\n\nThis is sanitized demo queue data only.",
    sourceType: "Demo mail paste",
    status: "New"
  },
  {
    id: "demo-mail-account",
    scenarioId: "account-login-issue",
    senderLabel: "Demo requester C",
    receivedAt: "2026-05-18 09:05",
    subject: "Account login issue after password change",
    bodyPreview:
      "User cannot login after changing password. MFA prompt appears but authentication fails repeatedly.",
    sourceBody:
      "Hello support,\n\nA demo user cannot login after changing password. MFA prompt appears but authentication fails repeatedly. The user can access some services but not the required application.\n\nThis is sanitized demo queue data only.",
    sourceType: "Demo mail paste",
    status: "New"
  }
];

export function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<ManualPasteScenario["id"]>("vpn-issue");
  const [selectedQueueItemId, setSelectedQueueItemId] = useState(demoMailQueue[0].id);
  const [queueItems, setQueueItems] = useState<DemoQueueItem[]>(demoMailQueue);
  const selectedScenario = useMemo(
    () => demoManualPasteScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? demoManualPasteScenarios[0],
    [selectedScenarioId]
  );
  const selectedQueueItem =
    queueItems.find((item) => item.id === selectedQueueItemId) ??
    queueItems.find((item) => item.scenarioId === selectedScenarioId) ??
    queueItems[0];

  const initialDraft = useMemo(() => buildDraftForScenario(selectedScenario), [selectedScenario]);
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string>>({});
  const [fillConfirmed, setFillConfirmed] = useState(false);
  const [selectedEnvironmentMode, setSelectedEnvironmentMode] = useState<ServiceNowEnvironmentMode>(
    getDefaultServiceNowEnvironmentMode()
  );

  const selectedEnvironment = getServiceNowEnvironmentConfig(selectedEnvironmentMode);
  const draft = applyOverrides(initialDraft, fieldOverrides);
  const context = manualPasteAdapter.capture({ title: selectedScenario.title, rawText: selectedScenario.rawText });

  function selectScenario(id: ManualPasteScenario["id"]) {
    const queueItem = queueItems.find((item) => item.scenarioId === id);
    if (queueItem) {
      setSelectedQueueItemId(queueItem.id);
    }
    setSelectedScenarioId(id);
    setFieldOverrides({});
    setFillConfirmed(false);
  }

  function selectQueueItem(itemId: string) {
    const queueItem = queueItems.find((item) => item.id === itemId);
    if (!queueItem) {
      return;
    }

    setSelectedQueueItemId(queueItem.id);
    setSelectedScenarioId(queueItem.scenarioId);
    setFieldOverrides({});
    setFillConfirmed(false);
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
    setFillConfirmed(false);
    updateQueueItemStatus(queueItem.id, "Drafted");
  }

  function updateQueueItemStatus(itemId: string, status: DemoQueueStatus) {
    setQueueItems((items) => items.map((item) => (item.id === itemId ? { ...item, status } : item)));
  }

  function updateField(fieldName: keyof TicketDraft, value: string) {
    setFieldOverrides((current) => ({ ...current, [fieldName]: value }));
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="app-title">
        <div className="safety-banner" role="status">
          AI drafts only. Human review and manual submit required.
        </div>

        <div className="content">
          <p className="eyebrow">Field-trial accelerated P0</p>
          <h1 id="app-title">ServiceNow Automation</h1>
          <p className="summary">
            Human-in-the-loop Service Desk workflow cockpit for reviewing sanitized queue items and preparing editable Incident drafts.
          </p>
        </div>
      </section>

      <section className="workspace" aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Queue → Mail Review → TicketDraft</p>
            <h2 id="workspace-title">Ticket Draft Workspace</h2>
            <p>
              Demo mode is deterministic. QA/Dev ServiceNow testing will be added after this mock workflow is stable.
            </p>
          </div>
          <div className="mode-pill">{selectedEnvironment.label} · MockAIProvider</div>
        </header>

        <EnvironmentModePanel
          selectedMode={selectedEnvironmentMode}
          onSelectedModeChange={setSelectedEnvironmentMode}
        />

        <div className="queue-review-grid">
          <DemoQueuePanel items={queueItems} selectedItemId={selectedQueueItem.id} onSelectItem={selectQueueItem} />
          <MailReviewPanel
            item={selectedQueueItem}
            onCreateIncidentDraft={createIncidentDraft}
            onMarkDone={(itemId) => updateQueueItemStatus(itemId, "Done")}
            onSkip={(itemId) => updateQueueItemStatus(itemId, "Skipped")}
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
            <h3 id="captured-context-title">Captured Context</h3>
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
          </section>

          <section className="panel draft-panel" aria-labelledby="draft-title">
            <h3 id="draft-title">Editable Incident Draft</h3>
            <DraftTextField label="Short Description" field={draft.shortDescription} onChange={(value) => updateField("shortDescription", value)} />
            <DraftTextField label="Description" field={draft.description} multiline onChange={(value) => updateField("description", value)} />
            <DraftTextField label="Work Notes" field={draft.workNotes} multiline onChange={(value) => updateField("workNotes", value)} />

            <div className="field-grid">
              <ReadOnlyField label="Category" field={draft.category} />
              <ReadOnlyField label="Subcategory" field={draft.subcategory} />
              <ReadOnlyField label="Assignment Group" field={draft.assignmentGroup} />
              <ReadOnlyField label="Priority" field={draft.priority} />
            </div>
          </section>

          <section className="panel evidence-panel" aria-labelledby="evidence-title">
            <h3 id="evidence-title">KB Matches</h3>
            <ul className="match-list">
              {draft.kbMatches.map((match) => (
                <li key={match.articleId}>
                  <strong>{match.title}</strong>
                  <span>Score {Math.round(match.score * 100)}%</span>
                  <p>{match.excerpt}</p>
                </li>
              ))}
            </ul>

            <h3>Missing Info</h3>
            <ul className="compact-list">
              {draft.missingInfoQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>

            <h3>Risk Flags</h3>
            <ul className="compact-list risk-list">
              {draft.riskFlags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          </section>
        </div>

        <MockServiceNowForm draft={draft} fillConfirmed={fillConfirmed} />
      </section>
    </main>
  );
}

function DemoQueuePanel({
  items,
  onSelectItem,
  selectedItemId
}: {
  items: DemoQueueItem[];
  onSelectItem: (itemId: string) => void;
  selectedItemId: string;
}) {
  const sortedItems = [...items].sort((left, right) => left.receivedAt.localeCompare(right.receivedAt));

  return (
    <section className="queue-panel" aria-labelledby="demo-queue-title">
      <header>
        <p className="eyebrow">Mail Review Queue</p>
        <h3 id="demo-queue-title">Demo queue — fake sanitized data only</h3>
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
            <span>{item.senderLabel}</span>
            <span>{item.sourceType}</span>
            <span className={`status-badge ${statusClassName(item.status)}`}>{item.status}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MailReviewPanel({
  item,
  onCreateIncidentDraft,
  onMarkDone,
  onSkip
}: {
  item: DemoQueueItem;
  onCreateIncidentDraft: (itemId: string) => void;
  onMarkDone: (itemId: string) => void;
  onSkip: (itemId: string) => void;
}) {
  return (
    <section className="mail-review-panel" aria-labelledby="mail-review-title">
      <header>
        <p className="eyebrow">Mail Review</p>
        <h3 id="mail-review-title">Parsed Sanitized Source</h3>
      </header>

      <dl className="meta-list review-meta">
        <div>
          <dt>Subject</dt>
          <dd>{item.subject}</dd>
        </div>
        <div>
          <dt>Sender</dt>
          <dd>{item.senderLabel}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>{item.receivedAt}</dd>
        </div>
        <div>
          <dt>Source Type</dt>
          <dd>{item.sourceType}</dd>
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

      <div className="review-actions" aria-label="Mail review actions">
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

function buildDraftForScenario(scenario: ManualPasteScenario): TicketDraft {
  const context = manualPasteAdapter.capture({ title: scenario.title, rawText: scenario.rawText });
  const kbMatches = searchKnowledgeArticles(context.rawText, demoKnowledgeArticles, { limit: 3 });
  return generateMockTicketDraft({ context, profile, kbMatches }, { idFactory: () => "desktop-demo-draft" });
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


function EnvironmentModePanel({
  onSelectedModeChange,
  selectedMode
}: {
  onSelectedModeChange: (mode: ServiceNowEnvironmentMode) => void;
  selectedMode: ServiceNowEnvironmentMode;
}) {
  const selectedEnvironment = getServiceNowEnvironmentConfig(selectedMode);

  return (
    <section className="environment-panel" aria-labelledby="environment-title">
      <header className="environment-header">
        <div>
          <p className="eyebrow">ServiceNow Environment Mode</p>
          <h3 id="environment-title">Choose the safest target for this run.</h3>
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

function MockServiceNowForm({ draft, fillConfirmed }: { draft: TicketDraft; fillConfirmed: boolean }) {
  return (
    <section className="mock-form-panel" aria-labelledby="mock-form-title">
      <header className="mock-form-header">
        <div>
          <p className="eyebrow">Incident · QA/Dev rehearsal</p>
          <h2 id="mock-form-title">Mock ServiceNow Incident Form</h2>
          <p>
            This panel shows how the editable draft would map into a ServiceNow-style Incident form before QA/dev testing.
          </p>
        </div>
        <button className="fill-button" disabled={!fillConfirmed} type="button">
          Fill Mock ServiceNow Form
        </button>
      </header>

      <div className="servicenow-frame" aria-label="Mock ServiceNow form fields">
        <div className="servicenow-toolbar">
          <strong>Incident</strong>
          <span>{fillConfirmed ? "Ready for mock fill" : "Fill action locked until review confirmation"}</span>
          <span>Submit disabled in demo mode</span>
        </div>

        <div className="mock-form-grid">
          <MockFormField label="Caller" value="Demo User" />
          <MockFormField label="Contact Type" value="Self-service / manual paste" />
          <MockFormField label="Category" value={draft.category?.value ?? "Not set"} />
          <MockFormField label="Subcategory" value={draft.subcategory?.value ?? "Not set"} />
          <MockFormField label="Assignment Group" value={fieldValue(draft.assignmentGroup)} />
          <MockFormField label="Priority" value={fieldValue(draft.priority)} />
          <MockFormField label="Impact" value={fieldValue(draft.impact)} />
          <MockFormField label="Urgency" value={fieldValue(draft.urgency)} />
        </div>

        <MockFormField label="Short Description" value={draft.shortDescription.value} wide />
        <MockFormField label="Description" value={draft.description.value} wide multiline />
        <MockFormField label="Work Notes" value={draft.workNotes.value} wide multiline />

        <div className="mock-submit-row">
          <button disabled type="button">
            Submit disabled in demo mode
          </button>
          <span>Final ServiceNow submit must remain a deliberate human action.</span>
        </div>
      </div>
    </section>
  );
}

function MockFormField({
  label,
  multiline = false,
  value,
  wide = false
}: {
  label: string;
  multiline?: boolean;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "mock-form-field wide" : "mock-form-field"}>
      <span>{label}</span>
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
