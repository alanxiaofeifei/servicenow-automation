# Phase AN2 — Three-Column Operator Workbench UX/Copy Spec

Date: 2026-06-07
Status: design handoff only — no implementation in this task
Audience: Alan first, then `sna-frontend-workbench`
Privacy level: sanitized. All examples are fake. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Goal

Define the exact warm-light UX and copy for the three-column Operator Workbench polish pass so implementation can be surgical and low-risk.

This spec is intentionally narrow:
- it does not add new product capabilities
- it does not change ServiceNow behavior
- it does not introduce demo clutter
- it does not weaken safety boundaries

Primary story:
1. Source arrives.
2. Source is reviewed and cleaned.
3. TicketDraft is generated.
4. Required/common fields are previewed.
5. Autofill plan is reviewed.
6. The operator can start QA Chromium, verify the current Incident, and autofill allowed fields only.

Non-goals:
- no mock/demo playground in the primary UI
- no mode tabs such as Queue / Source Review / TicketDraft
- no Save / Submit / Update / Resolve / Close automation
- no ServiceNow API writes
- no vertical card dump
- no raw sensitive values in the UI

## 1. Research inputs

Public reference patterns used as direction, not branding:
- Codex-style command center: keep navigation/context separate from active work and execution status.
- Claude Code-style workbench: keep the current artifact in focus while the rest of the shell stays calm.
- Antigravity-style manager/editor/artifact model: separate source management, working artifact, and runtime evidence.
- Modern agent workbench pattern: readiness and disabled reasons belong next to the action, not hidden in logs.

OpenDesign note:
- the project is already bound to a warm editorial design system (`claude`) and a web-prototype editorial template
- this spec keeps that warm, paper-like direction while making the operator shell more obviously three-column

## 2. Layout wireframe in text

Desktop target: 1366px+ Electron window, ideal design canvas 1440x900.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ServiceNow Automation        Env: QA      Target: Configured      [Settings]  Safety: Locked │
│ AI drafts and fills allowed fields only. Human reviews and submits manually.                 │
├──────────────────┬──────────────────────────────────────────────┬────────────────────────────┤
│ LEFT SOURCE RAIL │ CENTER WORKSPACE                             │ RIGHT RUNTIME RAIL         │
│ 280-320px        │ fluid / min 640px                             │ 340-380px                  │
│                  │                                              │                            │
│ Source / Queue   │ Selected source                               │ 1. Start QA Chromium       │
│ - Loading feed   │ - source title / origin / time                │ [large primary button]     │
│ - Intake queue   │ - sanitized source detail                     │ Status: not started        │
│ - Todo list      │                                              │                            │
│ - History        │ Cleaned / normalized source                   │ 2. Verify current Incident │
│ - Mode switch    │ - key facts / missing fields                  │ [large button disabled]    │
│ - Settings       │                                              │ Reason: CDP not ready      │
│                  │ TicketDraft                                   │                            │
│                  │ - short description                           │ 3. Autofill current Incident│
│                  │ - description                                 │ [large button disabled]    │
│                  │ - work notes                                  │ Reason: verify first       │
│                  │ - priority / categorization preview           │                            │
│                  │                                              │ CDP readiness              │
│                  │ Required/common field preview                 │ - Browser: waiting         │
│                  │ - field name / value / source                 │ - Endpoint: not ready      │
│                  │                                              │ - Current form: unverified │
│                  │ Autofill plan                                  │                            │
│                  │ - allowed text fields                         │ Safety boundary            │
│                  │ - skipped fields + reasons                    │ - No final write actions   │
│                  │                                              │ - Human reviews/submits    │
│                  │ KB / recommendation detail (collapsed)       │                            │
│                  │                                              │ Environment controls       │
│                  │                                              │ Recent run evidence        │
└──────────────────┴──────────────────────────────────────────────┴────────────────────────────┘
```

Behavioral notes:
- top bar stays fixed
- each column may scroll internally if needed
- the center keeps the current source and draft visible without becoming a long scroll wall
- the right rail keeps the three runtime actions visible without requiring page scroll
- settings must remain first-class and easy to find

## 3. Column responsibilities

### 3.1 Left column — source / queue / todo / history / mode switching / settings

The left column answers:
- What arrived?
- What is waiting?
- What did I already touch?
- Where are settings?

Include:
- source / loading information feed
- intake queue
- todo list
- history
- mode / function switching only if it is compact and non-tab-like
- bottom-left settings access

Rules:
- keep it compact and task-oriented
- avoid demo scenario clutter
- avoid expanding every item by default
- do not show raw URLs, ticket IDs, or customer data
- keep list items touch-friendly and selectable

### 3.2 Center column — selected source, cleaned source, TicketDraft, field preview, autofill plan, KB detail

The center column answers:
- What is the selected source?
- What did normalization produce?
- What draft am I reviewing?
- What will autofill touch?
- What KB/recommendation detail matters here?

Include:
- selected source detail
- cleaned / normalized source
- generated TicketDraft
- ServiceNow required/common field preview
- autofill plan
- KB / recommendation detail when selected

Rules:
- keep the draft and field preview readable at a glance
- collapse secondary detail by default
- keep the work product visible as the main focus
- the center should feel like a focused editor, not a form dump

### 3.3 Right column — runtime actions / Start QA Chromium / Verify / Autofill / templates-settings / CDP / safety / environment / evidence

The right column answers:
- Can I start QA Chromium now?
- Is the current Incident verifiable yet?
- Is autofill allowed yet?
- What environment am I in?
- What evidence was just produced?

Include:
- runtime actions
- Start QA Chromium
- Verify current Incident
- Autofill current Incident
- templates/settings quick access
- CDP readiness status
- safety boundary
- environment controls
- recent run evidence

Rules:
- runtime actions must be large and obvious
- disabled actions must explain why
- safety state must be compact but always visible
- environment controls must include QA URL, Dev URL, Production URL, default environment, and a compact safety state

## 4. State matrix

| State | Left column | Center column | Right column |
|---|---|---|---|
| Empty | Onboarding copy + example intake sources | Placeholder cards for source, cleaned source, draft, and KB detail | Disabled actions with explanations |
| Loading intake | Selected row highlights; history unchanged | Skeleton source/detail cards | Runtime remains disabled until readiness exists |
| Source selected | Queue row active | Source detail + cleaned summary | Start QA Chromium may enable if settings are valid |
| Draft ready | Queue row active; history may show prior example | TicketDraft and field preview are primary | Verify current Incident becomes the next step |
| Browser ready | Queue row active | Field preview and autofill plan are prominent | Verify current Incident is enabled |
| Page verified | Queue row active | Autofill plan is primary | Autofill current Incident is enabled |
| Autofill complete | Queue row active | Draft + filled field summary + evidence visible | Recent evidence updates; actions reset or remain context-dependent |
| Blocked / error | Queue may still show selection | Blocked panel explains the last safe checkpoint | Disabled buttons show plain-language reasons |

## 5. Main components

Keep the component set small. Do not introduce a large design system.

### Shell and top bar
- `OperatorWorkbenchShell`
- `WorkbenchTopBar`
- `CompactSafetyBadge`
- `EnvironmentStatusChip`
- `TargetStatusChip`

### Left rail
- `SourceFeedCard`
- `IntakeQueueRail`
- `TodoListCard`
- `HistoryCard`
- `ModeSwitchRow`
- `BottomSettingsEntry`

### Center workspace
- `SelectedSourceCard`
- `CleanedSummaryCard`
- `TicketDraftCard`
- `RequiredFieldPreviewCard`
- `AutofillPlanCard`
- `RecommendationDetailCard` (collapsed by default)

### Right rail
- `RuntimeActionRail`
- `RuntimeActionButton`
- `CdpReadinessCard`
- `SafetyBoundaryCard`
- `EnvironmentControlCard`
- `RecentEvidenceCard`
- `TemplatesSettingsLink`

### Settings
- `SettingsPanel`
- `EnvironmentUrlFields`
  - QA URL
  - Dev URL
  - Production URL
  - default environment selector
- `DisplaySettings`
- `ClearSavedSettings`

## 6. Empty, loading, and error states

### Empty states
Use one sentence, one next action, and one calm placeholder.

Recommended copy:
- `No source selected.`
- `Paste or load a sanitized source to begin.`
- `Configure QA, Dev, or Production Shadow in Settings before starting the browser.`

### Loading states
Use skeleton cards or muted placeholders only.

Rules:
- keep the current item visible if the user already selected one
- avoid generic spinners where a step label is clearer
- use progress language such as `Launching dedicated browser...` or `Waiting for CDP readiness...`

### Error states
Explain the safe stop point, not just the failure.

Rules:
- show the exact step that failed
- keep the previous safe state visible
- do not imply ServiceNow changed when it did not
- explain why a button is disabled in plain language
- keep recovery actions visible when possible

## 7. Button enable / disable logic

### Start QA Chromium
Enabled when:
- QA or Dev environment is selected
- a valid target is configured
- no other runtime action is busy

Disabled copy:
- `Configure a QA or Dev target in Settings before launching.`
- `Another runtime action is running.`

### Verify current Incident
Enabled when:
- CDP readiness is present
- QA or Dev environment is selected
- no busy action is running

Disabled copy:
- `Start QA Chromium and wait for CDP ready first.`
- `Select QA or Dev mode to verify.`

### Autofill current Incident
Enabled when:
- the current page has been verified
- the page is safe and fresh
- the draft and allowed-field plan are safe
- no busy action is running

Disabled copy:
- `Verify current Incident first.`
- `Review required fields before autofill.`
- `Production Shadow is comparison-only.`

### General rules
- button labels stay exact and stable
- disabled reasons are visible next to the control, not hidden in a tooltip
- a disabled button must explain the next safe prerequisite
- if the prerequisite is environment-related, the copy should point to Settings rather than log output

## 8. Copy text

### Top bar
- Product name: `ServiceNow Automation`
- Environment chip examples: `QA Environment`, `Dev Environment`, `Production Shadow`
- Target chip examples: `Target configured`, `Target missing`, `Target invalid`, `Target redacted`
- Safety badge: `Autofill only · Human submit`
- Safety line: `AI drafts and fills allowed fields only. Human reviews and submits manually.`

### Left column
- Section labels: `Source / Queue`, `Todo`, `History`, `Mode`, `Settings`
- Queue action copy: `Paste or load source`
- Empty history copy: `No recent items yet.`

### Center column
- Selected source header: `Selected source`
- Cleaned header: `Cleaned / normalized source`
- Draft header: `TicketDraft`
- Preview header: `Required/common field preview`
- Plan header: `Autofill plan`
- Recommendation header: `KB / recommendation detail`
- Collapsed helper copy: `Show recommendation detail`

### Right column
- Runtime header: `Runtime actions`
- Action buttons: `Start QA Chromium`, `Verify current Incident`, `Autofill current Incident`
- CDP label: `CDP readiness`
- Safety panel label: `Safety boundary`
- Environment panel label: `Environment controls`
- Evidence panel label: `Recent run evidence`

### Short disabled-state helpers
- `Configure target in Settings.`
- `Start QA Chromium first.`
- `Verify current Incident first.`
- `Waiting for CDP readiness.`
- `No safe autofill plan yet.`

### Avoid in primary UI
- `MockAIProvider`
- language simulation wording
- high-severity simulator wording
- Excel dry-run wording
- demo scenario wording
- large safety essays
- raw URLs, raw ticket IDs, raw sys_ids, raw fingerprints

## 9. Accessibility notes

- minimum 44px hit targets for all interactive rows and buttons
- visible focus ring on every interactive control
- keyboard order should flow left column → center column → right rail → settings
- disabled buttons must still be readable and explain why they are disabled
- use short section headings and avoid dense paragraphs inside cards
- keep contrast comfortable in the warm/light theme; do not drift to pure black or harsh white
- make selected states clear with more than color alone
- collapsed secondary panels must still expose their label and expansion affordance
- do not hide safety boundaries behind hover-only cues

## 10. OpenDesign / mockup note

OpenDesign was used as the design-system reference for the warm editorial baseline.

GPT Images 2 / `image_generate` attempts:
- Attempt 1: warm-light three-column operator workbench mockup with source queue, work product, runtime rail, and compact safety copy
- Attempt 2: alternate command-center mockup with strong top bar, compact left orientation, center work product, and large runtime actions

Result:
- no raster mockup was successfully generated in this run
- the image backend returned `FalClientHTTPError` for both attempts

## 11. Implementation handoff for `sna-frontend-workbench`

Implement this spec with the smallest possible UI-only polish pass.

Suggested files to inspect first:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Implementation intent:
- keep the existing shell and behavior intact
- add or refine visible column labels if needed
- preserve the warm/light visual language
- make the runtime rail unmistakable without adding demo clutter
- keep disabled reasons visible and plain-language
- keep settings first-class and easy to find

Acceptance checklist for the implementer:
- warm/light three-column shell is obvious at a glance
- left, center, and right column responsibilities match this spec
- disabled buttons explain why they are disabled
- settings include QA URL, Dev URL, Production URL, default environment, and compact safety state
- no demo clutter or mode-tab noise in the primary UI
- no live ServiceNow actions are added
- no raw sensitive data appears in the UI

