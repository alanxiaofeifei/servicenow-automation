# Operator Workbench — Three-Column Operator Workbench Spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan first, then `sna-frontend-workbench` after approval
Privacy level: sanitized. All examples are fake. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Goal

Replace the overloaded vertical stream with a calm warm-light three-column Operator Workbench that feels like a real operator command center.

Primary story:
1. source arrives
2. source is cleaned and normalized
3. TicketDraft is generated
4. required/common fields are previewed
5. autofill plan is reviewed
6. the operator can start QA Chromium, verify the current Incident, and autofill allowed fields only

Non-goals:
- no mock/demo playground in the primary UI
- no mode tabs such as Queue / Source Review / TicketDraft
- no Save / Submit / Update / Resolve / Close automation
- no ServiceNow API writes
- no vertical card dump
- no raw sensitive values in the UI

## 1. Research and design inputs

Public reference patterns used as direction, not as branding:
- Codex-style command center: navigation/context separated from active work and execution status
- Claude Code-style workbench: calm desktop surface, visible work state, strong runtime affordances
- Antigravity-style manager/editor/artifact model: separate source management, working artifact, and runtime evidence
- Modern agent workbench patterns: show readiness and disabled reasons near the action, not hidden in logs

OpenDesign note:
- the project already has an OpenDesign binding and editorial warm-light baseline
- this spec uses that warm editorial direction as a supporting reference only

## 2. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ServiceNow Automation   Env: QA / Dev / Production Shadow   Target: Configured   [Settings]  │
│ AI drafts and fills allowed fields only. Human reviews the draft in ServiceNow.              │
├──────────────────────────┬──────────────────────────────────────────────┬─────────────────────┤
│ LEFT: SOURCE + QUEUE     │ CENTER: WORK PRODUCT                         │ RIGHT: RUNTIME      │
│                          │                                              │                     │
│ Loading feed             │ Selected source detail                       │ 1 Start QA Chromium │
│ Intake queue             │ Cleaned / normalized source                  │ 2 Verify Incident   │
│ Todo list                │ Generated TicketDraft                        │ 3 Autofill Incident │
│ History                  │ Required/common field preview                │                     │
│ Mode / function switch   │ Autofill plan                                │ CDP readiness       │
│ Bottom-left Settings     │ KB / recommendation detail                   │ Safety boundary     │
│                          │                                              │ Env controls        │
│                          │                                              │ Recent evidence     │
└──────────────────────────┴──────────────────────────────────────────────┴─────────────────────┘
```

Behavioral notes:
- top bar stays fixed
- each column may scroll internally if needed
- center keeps the current source and draft visible without becoming a long scroll wall
- right rail keeps the three runtime actions visible without requiring page scroll
- settings must remain first-class and easy to find

## 3. Column responsibilities

### Left column
Owns orientation and selection.

It should answer:
- What arrived?
- What is waiting?
- What did I already touch?
- Where are settings?

Include:
- source / loading information feed
- intake queue
- todo list
- history
- mode / function switching
- bottom-left settings access

Rules:
- keep it compact and task-oriented
- avoid demo scenario clutter
- avoid expanding every item by default
- do not show raw URLs, ticket IDs, or customer data

### Center column
Owns the work product.

It should answer:
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

### Right column
Owns action readiness and safety.

It should answer:
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
- templates / settings quick access
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
- never hide an important action without explaining the condition
- disabled reasons must be visible next to the control, not hidden in a tooltip
- never imply Save / Submit / Update / Resolve / Close exists
- keep safety language short and readable

## 8. Copy text

Recommended core copy:
- `Manual paste only. Fake data only. Local demo only.`
- `AI drafts and fills allowed text fields only. Human reviews the draft in ServiceNow.`
- `Start QA Chromium`
- `Verify current Incident`
- `Autofill current Incident`
- `No Save, Submit, Update, Resolve, Close.`
- `Settings: QA URL, Dev URL, Production URL, default environment, and safety state.`
- `Recent run evidence is sanitized and local-only.`

Preferred operator labels:
- `Prepare draft` instead of `Create draft` when the action is only local/demo preparation
- `Open Settings` as the universal escape hatch for missing targets
- `Source feed` and `Intake queue` instead of dense status essays
- `Required/common fields` instead of a long form taxonomy dump

Copy to avoid in the primary UI:
- MockAIProvider
- language simulation wording
- high-severity simulator wording
- Excel dry-run wording that sounds like a write action
- any copy that hints at real submission or service write

## 9. Accessibility notes

- warm/light theme by default; avoid pure black surfaces
- large touch/click targets, especially on the right runtime rail
- calm contrast and generous spacing for eye comfort
- progressive disclosure instead of always-expanded panels
- readable line length for astigmatism / eye comfort
- disabled reasons must be explicit and readable
- preserve keyboard navigation and visible focus states in settings and runtime controls
- keep the three-column shell obvious at a glance

## 10. GPT Images 2 mockup notes

Attempted sanitized mockup generation with `image_generate` using fake/demo data only.

Result:
- the backend returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

If a later run gets a working image backend, generate:
- one landscape three-column cockpit concept
- one tighter right-rail/runtime concept

## 11. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented in frontend code, keep the change set surgical and preserve the accepted order.

Implementation requirements:
1. Preserve the current local-only safety model.
2. Keep settings first-class and visible.
3. Keep the left / center / right responsibilities stable.
4. Keep the what-changed / guidance copy compact.
5. Keep disabled button reasons plain-language and visible.
6. Keep KB recommendations visible.
7. Keep Monthly Excel fill queue present and non-destructive.
8. Keep Incident draft below Cleaned summary and above Guided Review Path.
9. Do not reintroduce demo clutter, mock-provider labels, or always-open debug surfaces.
10. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

## 12. Acceptance criteria

This spec is ready for frontend implementation only when all of the following are true:
- the app presents a warm/light three-column operator workbench
- the left column owns source, queue, todo, history, mode/function switching, and bottom-left settings
- the center column owns selected source detail, cleaned source, TicketDraft, field preview, autofill plan, and KB/recommendation detail
- the right column owns runtime actions, CDP readiness, safety boundary, environment controls, and recent evidence
- Start QA Chromium is visible and clearly labeled
- Verify current Incident is visibly gated by readiness
- Autofill current Incident is visibly gated by verification and safe-field rules
- disabled buttons explain why they are disabled
- settings remain first-class and editable for QA URL, Dev URL, Production URL, and default environment
- no real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or raw fingerprints are exposed
- no Save / Submit / Update / Resolve / Close automation is introduced
- no mock/demo clutter reappears in the primary UI
