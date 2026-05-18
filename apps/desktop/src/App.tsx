import { useMemo, useState } from "react";

import { demoManualPasteScenarios, ManualPasteAdapter, type ManualPasteScenario } from "@servicenow-automation/adapters";
import { generateMockTicketDraft } from "@servicenow-automation/ai";
import { demoKnowledgeArticles, searchKnowledgeArticles } from "@servicenow-automation/kb/browser";
import { loadDemoYageoProfile } from "@servicenow-automation/profiles";
import type { FieldDraft, TicketDraft } from "@servicenow-automation/core";

const manualPasteAdapter = new ManualPasteAdapter({
  idFactory: () => "desktop-demo-context",
  now: () => new Date("2026-05-18T12:00:00.000Z")
});

const profile = loadDemoYageoProfile();

export function App() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<ManualPasteScenario["id"]>("vpn-issue");
  const selectedScenario = useMemo(
    () => demoManualPasteScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? demoManualPasteScenarios[0],
    [selectedScenarioId]
  );

  const initialDraft = useMemo(() => buildDraftForScenario(selectedScenario), [selectedScenario]);
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, string>>({});

  const draft = applyOverrides(initialDraft, fieldOverrides);
  const context = manualPasteAdapter.capture({ title: selectedScenario.title, rawText: selectedScenario.rawText });

  function selectScenario(id: ManualPasteScenario["id"]) {
    setSelectedScenarioId(id);
    setFieldOverrides({});
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
            Human-in-the-loop ServiceNow workbench for turning pasted support context into editable Incident drafts.
          </p>
        </div>
      </section>

      <section className="workspace" aria-labelledby="workspace-title">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Manual Paste → TicketDraft</p>
            <h2 id="workspace-title">Ticket Draft Workspace</h2>
            <p>
              Demo mode is deterministic. QA/Dev ServiceNow testing will be added after this mock workflow is stable.
            </p>
          </div>
          <div className="mode-pill">Demo Mode · MockAIProvider</div>
        </header>

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
      </section>
    </main>
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
