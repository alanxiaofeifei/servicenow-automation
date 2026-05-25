# Operator Workbench Three-Column Spec

Status: design handoff only — no implementation in this task.
Audience: `sna-frontend-workbench` implementer.
Privacy level: sanitized; all examples are fake; do not add real ServiceNow screenshots, URLs, ticket IDs, customer data, raw logs, sessions, HAR, traces, or page fingerprints.

## 0. Purpose

Replace the current overloaded vertical stream with a simplified three-column Operator Workbench that keeps the operator oriented:

- Left: intake, source navigation, todo, history, mode/function switching, settings.
- Center: the selected source and generated ticket work product.
- Right: runtime actions, environment/readiness, safety boundaries, and recent evidence.

Primary acceptance behavior:

- Warm/light default theme for eye comfort.
- Three columns are visible on desktop instead of one long vertical stream.
- Optional/advanced panels are collapsed by default.
- Large click/touch targets are used for primary actions.
- Disabled buttons explain exactly why they are disabled.
- The UI never implies automatic Save, Submit, Update, Resolve, Close, ServiceNow API writes, or production writes.

Non-goals for this task:

- No implementation.
- No real browser automation.
- No real ServiceNow data or screenshots.
- No new design system beyond the minimal tokens/components below.

## 1. Public pattern research synthesis

No live web browsing tool was available in this worker session. The research below is a sanitized pattern synthesis from the requested public design reference categories, not a copy of any product branding or private UI.

Extracted layout principles:

1. Command-center apps separate navigation/context from the active artifact and from execution controls. This supports a left navigation rail, center artifact workspace, and right run/action rail.
2. Agent IDE workflows keep current task state visible while hiding verbose logs behind expandable evidence sections. This supports collapsed history, collapsed run evidence, and summary-first status cards.
3. Manager/editor/artifact models separate queue management from detailed editing. This supports a left queue, center TicketDraft/editor, and right runtime/safety actions.
4. Modern agent workbenches use explicit environment/status pills to avoid hidden side effects. This supports environment mode, CDP readiness, verify status, and safety lock cards in the right column.
5. Three-pane productivity tools preserve orientation by keeping the list visible while the selected item changes. This supports a stable left queue and a center detail area driven by selected source.
6. Accessible enterprise dashboards reduce fatigue by using warm paper backgrounds, muted text, soft borders, and predictable hierarchy instead of black-background/white-text contrast.

Design translation for this product:

- Keep the left column stable and narrow; it is the operator's map.
- Keep the center column wide; it is the selected work product.
- Keep the right column sticky; it is the action/safety rail.
- Convert optional sections from always-expanded panels into `details`/accordion cards.
- Show only one selected source detail and one selected recommendation detail at a time.
- Make runtime readiness a stepper: Environment -> Start QA Chromium -> CDP ready -> Verify -> Autofill allowed fields.

## 2. Layout wireframe in text

Desktop target: 1366px+ width, Electron window. Use a 12-column CSS grid or equivalent.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Top warm safety strip: Human reviews; autofill allowed fields only; no auto-submit/close.     │
├───────────────────┬─────────────────────────────────────────────────────┬────────────────────┤
│ LEFT RAIL          │ CENTER WORKSPACE                                    │ RIGHT RUNTIME RAIL  │
│ 280-320px          │ fluid / min 620px                                   │ 320-360px           │
│                   │                                                     │                    │
│ Header             │ Selected source header                              │ Environment card    │
│ - Workbench title  │ - Source label/channel/time                         │ - Mock/QA/Dev/Prod  │
│ - mode pill        │ - status + source confidence                        │ - target summary    │
│                   │                                                     │                    │
│ Source feed        │ Source detail card                                  │ Runtime actions     │
│ - loading/status   │ - original sanitized text                           │ [Start QA Chromium] │
│ - import source    │ - source metadata                                   │ [Verify Incident]   │
│                   │                                                     │ [Autofill Incident] │
│ Intake queue       │ Cleaned / normalized source                         │ disabled reasons    │
│ - selected item    │ - normalized text                                   │                    │
│ - filter chips     │ - extracted facts                                   │ CDP readiness       │
│                   │                                                     │ - browser launched  │
│ Todo               │ Generated TicketDraft                               │ - endpoint ready    │
│ - required review  │ - Short description                                 │ - verified current  │
│ - missing info     │ - Description                                      │                    │
│                   │ - Work notes                                       │ Safety boundary     │
│ History            │ - Category/Subcategory/Assignment/Priority          │ - no Save/Submit    │
│ - recent sources   │                                                     │ - manual login only │
│ - recent runs      │ Field preview                                      │                    │
│                   │ - Required/common Incident fields                   │ Templates/settings  │
│ Function switcher  │ - Autocomplete confidence                           │ - collapsed default │
│ - Draft            │                                                     │                    │
│ - KB               │ Autofill plan                                       │ Recent evidence     │
│ - QA runtime       │ - allowed fields only                               │ - last run summary  │
│ - Settings         │ - skipped fields + reason                           │ - expandable log    │
│                   │                                                     │                    │
│ Bottom settings    │ KB / recommendation detail when selected            │                    │
│ - zoom/theme       │ - only shown when a recommendation is selected       │                    │
└───────────────────┴─────────────────────────────────────────────────────┴────────────────────┘
```

Suggested desktop grid:

```css
.operator-workbench {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(620px, 2.2fr) minmax(320px, 1fr);
  gap: 16px;
  height: calc(100vh - 72px);
}
```

Responsive fallback:

- 1180px-1365px: keep three columns but reduce left/right to icon-dense compact cards and make center scroll.
- 900px-1179px: two columns: left rail becomes collapsible drawer; center and right split 65/35.
- <900px: single-column stack with sticky segmented tabs: Sources, Draft, Runtime.

## 3. Column responsibilities

### 3.1 Left column — Source and operator navigation

Primary job: answer "what should I work on next?" and "where am I?"

Contains:

1. Source/loading information feed
   - Current source status: `Demo source ready`, `Loading source...`, `Source paused`, `Source error`.
   - Import/refresh affordance for fake/sanitized sources only.
   - Clear statement: `No live Teams, mailbox, ServiceNow Chat/API, or self-service polling in demo mode.`
2. Intake queue
   - Selected item card with channel, age, short subject, status.
   - Queue statuses: New, Reviewed, Drafted, Needs info, Done, Skipped.
   - Filters: All, Needs review, Draft ready, Blocked.
3. Todo list
   - Human review tasks only: review source, confirm missing info, review required fields, confirm allowed autofill fields.
   - No write-action checklist items such as submit/close.
4. History
   - Recent source selections and recent run summaries.
   - Collapsed by default; show last 3 items.
5. Mode/function switching
   - Draft, KB, QA Runtime, Settings.
   - This changes which optional detail subpanel is expanded; it should not navigate away from the selected source.
6. Bottom-left settings
   - Zoom, theme, density, language, templates.
   - Bottom placement keeps settings available without occupying top attention.

Left column must not contain:

- Long raw source text.
- Runtime action buttons.
- Real URLs, browser logs, page fingerprints, screenshots, or ticket IDs.

### 3.2 Center column — Selected source and ticket work product

Primary job: answer "what is the ticket draft and why?"

Contains:

1. Selected source detail
   - Source channel, received time, fake requester label, queue status.
   - Original sanitized source text in a readable block.
2. Cleaned/normalized source
   - Normalized text.
   - Extracted facts: affected service, symptom, urgency cues, missing info.
   - Show diff/normalization behind a collapsed `What changed?` disclosure.
3. Generated `TicketDraft`
   - Editable: Short description, Description, Work notes.
   - Read-only or select controls: Category, Subcategory, Assignment group, Impact, Urgency, Priority.
   - Confidence/help text per field.
4. ServiceNow required/common field preview
   - Show required/common fields as a compact preview, not a giant mock form.
   - Mark fields as `Ready`, `Needs human review`, `Not available`, or `Skipped`.
5. Autofill plan
   - Allowed fields list.
   - Skipped fields with reason.
   - Final line: `Autofill stops after populating allowed fields. Human submits manually.`
6. KB/recommendation detail when selected
   - Show selected recommendation only.
   - List why it matched, next operator question, and draft impact.

Center column must not contain:

- Start/Verify/Autofill runtime buttons.
- Environment URL entry.
- Always-expanded optional simulators.

### 3.3 Right column — Runtime actions and safety

Primary job: answer "what can I safely do now?" and "why is something locked?"

Contains:

1. Runtime actions
   - Start QA Chromium.
   - Verify current Incident.
   - Autofill current Incident.
   - Each action has status, disabled reason, and last result.
2. CDP readiness status
   - Browser process launched.
   - CDP endpoint ready.
   - Current Incident verified read-only.
   - Autofill plan ready.
3. Templates/settings
   - Collapsed by default; quick template preset selector visible.
   - Full template editing remains in bottom-left settings or collapsed panel.
4. Safety boundary
   - Always visible.
   - Explicitly says no Save, Submit, Update, Resolve, Close, API writes, or production writes.
   - Manual login only; credentials are never stored.
5. Environment controls
   - Mock Demo, QA Test Environment, Development Test Environment, Production Shadow Mode.
   - Default Mock.
   - Production Shadow must visually lock runtime autofill.
6. Recent run evidence
   - Last action, timestamp, sanitized status.
   - Expand for sanitized evidence summary only.
   - Never show raw logs, raw URLs, screenshots, page fingerprints, sessions, HAR, or traces.

Right column must not contain:

- Full source text.
- Editable long draft fields.
- Any final ServiceNow write action.

## 4. State matrix

| State | Left column | Center column | Right column | Primary copy | Notes |
|---|---|---|---|---|---|
| First launch / no source | Empty queue placeholder and demo source CTA | Empty selected-source card | Runtime actions disabled except environment selection | `Choose a source item to begin.` | Keep warm blank state; no scary errors. |
| Loading source | Feed shows skeleton rows | Center shows selected-source skeleton | Runtime actions disabled | `Loading sanitized source...` | Use shimmer sparingly; avoid motion-heavy loading. |
| Source selected | Selected queue row highlighted | Source detail + normalized source visible | Start QA may be available depending on environment | `Review source before generating or filling.` | Do not auto-generate if implementation currently requires manual action. |
| Draft generated | Todo updates required review items | TicketDraft + field preview visible | Autofill still disabled until runtime verified | `Draft ready for human review.` | Center is now the main editing surface. |
| Missing info | Todo surfaces missing questions | Missing info callout above draft | Autofill disabled with missing info reason | `Autofill locked: missing required review information.` | Human can still edit draft. |
| KB selected | KB item active in left/function switcher | Recommendation detail replaces lower center optional panel | Runtime rail unchanged | `Recommendation opened; draft fields unchanged until accepted.` | Avoid hidden draft mutation. |
| Mock environment | Mode pill says Mock Demo | Mock preview available | Start QA disabled or secondary; Verify/Autofill disabled | `Mock mode uses the in-app preview only.` | Default safe mode. |
| QA selected, browser not started | QA mode highlighted | Draft remains editable | Start QA enabled if target config valid; Verify/Autofill disabled | `Start dedicated QA Chromium before verification.` | Main P0 path. |
| Browser launching | Left unchanged | Center unchanged | Start QA busy, Verify disabled | `Launching dedicated browser...` | Disable repeated launch. |
| CDP connecting | Left unchanged | Center unchanged | CDP status amber; Verify disabled | `Waiting for CDP readiness.` | Show concise retry guidance. |
| CDP ready, not verified | Left unchanged | Center unchanged | Verify enabled; Autofill disabled | `Verify current Incident before autofill.` | Verify-only must be read-only. |
| Verify running | Left unchanged | Center field preview skeleton optional | Verify busy; Autofill disabled | `Read-only verification in progress.` | Avoid claiming field readiness until complete. |
| Verify success | Todo marks runtime verified | Field preview updated with detected allowed fields | Autofill enabled if draft/plan safe | `Current Incident verified. Review autofill plan.` | Do not expose raw page fingerprint. |
| Verify blocked | Left history logs sanitized blocked event | Center remains editable | Verify shows blocked reason; Autofill disabled | `Verification blocked: open an Incident form in the dedicated QA browser.` | Keep next action clear. |
| Autofill ready | Todo asks final human review | Autofill plan visible | Autofill enabled | `Autofill will populate allowed fields only. Human submits manually.` | No submit/update. |
| Autofill running | Left unchanged | Center read-only overlay on fields being filled | Autofill busy | `Autofilling allowed fields...` | Cancel/stop is optional future work; no broad scope now. |
| Autofill success | History records sanitized run | Filled-field summary visible | Evidence summary updates | `Allowed fields were filled. Review in browser and submit manually if appropriate.` | No automatic submit. |
| Runtime error | History records sanitized error | Center unaffected | Right rail error card with retry action | `Runtime action failed safely. No final write was attempted.` | Do not show raw logs. |
| Production Shadow | Mode pill locked | Draft remains available for comparison | Start/Verify may be read-only only; Autofill disabled | `Production Shadow is comparison-only. No production writes are available.` | Strong safety boundary. |

## 5. Main components

Keep components minimal and map them to existing app concepts where possible.

### 5.1 Shell components

- `OperatorWorkbenchShell`
  - Owns three-column layout and responsive behavior.
  - Accepts existing state; should not introduce a new domain model.
- `TopSafetyStrip`
  - One-line sticky safety reminder.
  - Copy: `Human-in-the-loop. Autofill allowed fields only. No Save, Submit, Update, Resolve, Close, API writes, or production writes.`
- `ColumnCard`
  - Shared surface style only: border, radius, padding, heading.
  - Do not create a large design-system abstraction.

### 5.2 Left column components

- `SourceFeedCard`
  - Status + source loading progress.
- `IntakeQueueList`
  - Selectable cards with large hit area.
- `TodoListCard`
  - Review checklist summary; collapsed details.
- `HistoryCard`
  - Last three sanitized events; expandable.
- `FunctionSwitcher`
  - Draft / KB / QA Runtime / Settings.
- `BottomSettingsButton`
  - Opens settings drawer; also shows zoom percent if not default.

### 5.3 Center column components

- `SelectedSourceHeader`
  - Selected source identity and state.
- `SourceDetailCard`
  - Original source text.
- `NormalizedSourceCard`
  - Cleaned text and extracted facts.
- `TicketDraftEditor`
  - Existing editable draft fields.
- `IncidentFieldPreviewCard`
  - Required/common field readiness table.
- `AutofillPlanCard`
  - Allowed/skipped field plan.
- `RecommendationDetailPanel`
  - Opens only when selected; otherwise collapsed placeholder.

### 5.4 Right column components

- `EnvironmentControlCard`
  - Mode selector + short description.
- `RuntimeActionStack`
  - Three primary action buttons + disabled explanations.
- `CdpReadinessCard`
  - Stepper/status checklist.
- `SafetyBoundaryCard`
  - Always visible.
- `RuntimeTemplateCard`
  - Collapsed default.
- `RecentRunEvidenceCard`
  - Sanitized evidence; expandable.

## 6. Empty, loading, and error states

### 6.1 Empty states

Left queue empty:

- Title: `No source selected`
- Body: `Load a fake demo source or choose an intake item to begin.`
- Action: `Load demo source`
- Safety note: `Demo sources are sanitized and local.`

Center empty:

- Title: `Select an intake item`
- Body: `The selected source, normalized text, TicketDraft, field preview, and autofill plan will appear here.`

Right runtime empty/disabled:

- Title: `Runtime locked until ready`
- Body: `Choose QA Test Environment and start the dedicated browser before verifying an Incident.`

### 6.2 Loading states

Source loading:

- Use 3 skeleton queue rows and one center skeleton block.
- Copy: `Loading sanitized demo source...`
- Avoid long progress logs in the main UI.

Draft generation loading:

- Center card title: `Generating TicketDraft...`
- Body: `This prepares editable draft fields only. Nothing is written to ServiceNow.`

Runtime loading:

- Start QA: `Launching dedicated QA Chromium...`
- Verify: `Read-only verification in progress...`
- Autofill: `Autofilling allowed fields only...`

### 6.3 Error and blocked states

Source error:

- Copy: `Source could not load. No ServiceNow action was attempted.`
- Actions: `Retry demo source`, `Use manual paste`.

Verify blocked:

- Copy: `Verification blocked: the dedicated browser is not ready or the current page is not an Incident form.`
- Next step: `Open the Incident form in the dedicated QA browser, then run Verify again.`

Autofill blocked:

- Copy: `Autofill blocked: verify the current Incident and review the autofill plan first.`

Runtime error:

- Copy: `Runtime action failed safely. No Save, Submit, Update, Resolve, Close, or API write was attempted.`
- Evidence: sanitized status only.

## 7. Button enable/disable logic

Design rule: every disabled button must show a short reason within the same card, not only a tooltip.

### 7.1 Runtime actions

| Button | Enabled when | Disabled reason examples | Success copy |
|---|---|---|---|
| Start QA Chromium | Selected environment is QA or Dev; target configuration is valid; no launch already in progress; dedicated profile can be used | `Choose QA or Dev to launch a dedicated browser.` / `Target configuration is missing or invalid.` / `Browser is already launching.` | `Dedicated browser launched. Waiting for CDP readiness.` |
| Verify current Incident | CDP endpoint is ready; browser is connected; no verify/autofill action is running | `Start QA Chromium first.` / `Waiting for CDP readiness.` / `Open an Incident form in the dedicated browser.` | `Current Incident verified read-only. Review the autofill plan.` |
| Autofill current Incident | Verify succeeded for the current page; TicketDraft exists; autofill plan has at least one allowed field; no missing required review; environment allows controlled QA/Dev fill; no action running | `Verify current Incident first.` / `Draft is not ready.` / `No allowed fields in the autofill plan.` / `Production Shadow is comparison-only.` / `Review required fields before autofill.` | `Allowed fields filled. Human reviews and manually submits.` |

### 7.2 Draft and source actions

| Button | Enabled when | Disabled reason examples |
|---|---|---|
| Create / refresh TicketDraft | Source selected and source text is non-empty; no draft generation running | `Select a source item first.` / `Source text is empty.` |
| Mark done | Draft reviewed or source explicitly skipped | `Review the draft or choose Skip with a reason.` |
| Skip source | Source selected; no runtime action in progress | `Wait for the current runtime action to finish.` |
| Load demo source | Demo source adapter is available; no source loading in progress | `Demo source is already loading.` |
| Open settings | Always enabled | Not applicable. |

### 7.3 Safety locks

Permanent locks:

- No UI button for Save.
- No UI button for Submit.
- No UI button for Update.
- No UI button for Resolve.
- No UI button for Close.
- No ServiceNow API write affordance.
- No production write affordance.

Production Shadow runtime lock copy:

`Production Shadow is comparison-only. Autofill and final write actions are unavailable.`

Mock mode runtime lock copy:

`Mock mode uses the in-app preview. Dedicated QA browser actions are locked until QA or Dev is selected.`

## 8. Copy text

### 8.1 Global copy

- Product title: `Operator Workbench`
- Subtitle: `Review sanitized sources, prepare Incident drafts, and run safe QA-only browser actions.`
- Safety strip: `Human-in-the-loop. Autofill allowed fields only. No Save, Submit, Update, Resolve, Close, API writes, or production writes.`
- Mode pill default: `Mock Demo · local only`

### 8.2 Left column copy

- Source feed title: `Sources`
- Source feed helper: `Fake demo intake only. No live mailbox, Teams, Chat, API, or polling connection.`
- Queue title: `Intake queue`
- Todo title: `Operator todo`
- Todo empty: `No pending review steps for the selected source.`
- History title: `History`
- History helper: `Sanitized local summaries only.`
- Function switcher label: `Workbench mode`
- Settings button: `Settings`

### 8.3 Center column copy

- Empty title: `Select an intake item`
- Source title: `Selected source`
- Normalized title: `Cleaned / normalized source`
- Draft title: `Generated TicketDraft`
- Field preview title: `Required/common field preview`
- Autofill plan title: `Autofill plan`
- Recommendation title: `Recommendation detail`
- Draft safety footer: `Draft fields are editable. Human remains accountable for final ServiceNow submission.`
- Autofill footer: `Only allowed fields are populated. Human reviews in browser and submits manually if appropriate.`

### 8.4 Right column copy

- Environment title: `Environment`
- Runtime title: `Runtime actions`
- Button: `Start QA Chromium`
- Button: `Verify current Incident`
- Button: `Autofill current Incident`
- CDP title: `CDP readiness`
- Safety title: `Safety boundary`
- Evidence title: `Recent run evidence`
- Evidence helper: `Sanitized status summaries only; raw logs and page fingerprints stay out of the UI.`
- Manual login note: `Manual login required. Credentials are never stored.`
- Verify note: `Verify is read-only.`
- Autofill note: `Autofill stops before Save, Submit, Update, Resolve, or Close.`

### 8.5 Disabled-state copy examples

- `Start QA Chromium is disabled because Mock Demo uses the in-app preview.`
- `Start QA Chromium is disabled until QA Test Environment has a valid target configuration.`
- `Verify current Incident is disabled until CDP readiness is green.`
- `Verify current Incident is disabled while the browser is launching.`
- `Autofill current Incident is disabled until Verify succeeds on the current Incident.`
- `Autofill current Incident is disabled because Production Shadow is comparison-only.`
- `Autofill current Incident is disabled because the TicketDraft has no allowed fields to fill.`

## 9. Accessibility notes

Eye comfort and astigmatism-first decisions:

- Use warm off-white background, not pure white and not pure black.
- Default text: near-charcoal/warm ink; avoid white text on black.
- Muted text must remain readable; do not use low-opacity gray below accessible contrast.
- Use 16px minimum body text, 18px preferred in dense cards, and 20px+ for card titles.
- Primary buttons should be at least 44px high; preferred 48px.
- Keep line length around 65-85 characters in source/draft text blocks.
- Avoid all-caps paragraphs; use short uppercase eyebrow labels only.
- Avoid subtle icon-only buttons for critical runtime actions.
- Provide focus rings with a visible warm/teal outline and 2px offset.
- Ensure the selected queue item is indicated by more than color: left border, bold title, `aria-current`, and status text.
- Avoid auto-scrolling while the operator edits draft text.
- Use reduced motion: no heavy shimmer; respect `prefers-reduced-motion`.
- Use internal scrolling per column so the operator does not lose the action rail.
- Use `details/summary` or buttons with `aria-expanded` for progressive disclosure.
- Announce runtime status changes through `role="status"` / polite live regions.
- Do not hide disabled reasons in hover-only tooltips; show plain text.

Minimal token guidance:

```text
background: #F7F3EA
surface: #FFFCF6
surface-soft: #FBF7EF
text: #2B2A27
muted: #615A50
border: #E6DED0
accent-teal: #2F756C
accent-amber: #D98535
safety-rose: #F8E7DF
focus: #1F6E63
```

## 10. OpenDesign and GPT Images 2 mockups

### OpenDesign

OpenDesign MCP was available. Existing project used:

- Project: `servicenow-automation-operator-redesign`
- Purpose: sanitized warm-light ServiceNow Automation operator redesign assistant.
- Inputs: fake/sanitized brand spec and page brief only.
- Result: `od_compose_brief` produced a sanitized design brief. Two `od_generate_design` attempts did not produce a final saved HTML artifact in this run; the first returned a progress/plan response, and the second returned a task-type question form. No OpenDesign artifact was saved into the repo.

Design decisions taken from the OpenDesign brief:

- Warm paper/ivory surfaces with muted ink text.
- Three stable columns.
- Runtime controls isolated in the right rail.
- Explicit safety copy and disabled-state explanations.
- Progressive disclosure for optional detail.

### GPT Images 2 / image generation

Two sanitized image-generation attempts were made using fake labels only. Both failed with `FalClientHTTPError`, so no bitmap mockup was generated or saved.

Prompt constraints used:

- Warm-light three-column ITSM operator workbench.
- Left source/feed/queue/todo/history/settings.
- Center selected source, normalized text, TicketDraft, field preview, autofill plan, recommendation detail.
- Right Start QA Chromium, Verify current Incident, Autofill current Incident, CDP readiness, safety, environment, evidence.
- Fake labels only; no real screenshots, no URLs, no ticket IDs, no customer data, no logos.

Because image generation failed, this markdown spec is the source of truth for the design handoff.

## 11. Implementation handoff for `sna-frontend-workbench`

### 11.1 Recommended smallest implementation path

Keep the implementation surgical:

1. Add a three-column shell around existing workbench content.
2. Move existing queue/source controls into the left column.
3. Move existing source detail, normalized text, TicketDraft, KB matches, field preview, and autofill plan into the center column.
4. Move existing QA runtime controls, environment controls, safety panel, templates/settings, CDP readiness, and run evidence into the right column.
5. Collapse optional/high-detail panels by default instead of removing them.
6. Preserve existing state and domain functions; avoid a new data model.
7. Add disabled-reason text near each runtime button.
8. Keep Settings accessible bottom-left and/or as a drawer, not top-heavy.

### 11.2 Suggested component mapping

Likely files for implementation work, not touched by this design task:

- `apps/desktop/src/App.tsx`
  - Reorganize render tree into left/center/right components.
  - Keep existing state hooks and runtime handlers.
- `apps/desktop/src/styles.css`
  - Add `.operator-workbench`, `.operator-left-rail`, `.operator-center`, `.operator-right-rail` layout styles.
  - Reuse existing warm tokens where possible.
- `apps/desktop/src/App.test.ts`
  - Add assertions for visible three-column headings and disabled-state reasons.

Suggested component names:

```text
OperatorWorkbenchShell
OperatorLeftRail
OperatorCenterWorkspace
OperatorRuntimeRail
RuntimeActionButton
DisabledReason
CdpReadinessStepper
IncidentFieldPreviewCard
AutofillPlanCard
```

### 11.3 Acceptance checklist for implementation

Visual:

- Three columns visible at desktop size.
- Warm/light theme default.
- Left rail contains source feed, intake queue, todo, history, mode/function switcher, bottom settings.
- Center contains selected source, cleaned source, TicketDraft, required/common field preview, autofill plan, recommendation detail.
- Right rail contains runtime actions, Start QA Chromium, Verify current Incident, Autofill current Incident, templates/settings, CDP status, safety, environment controls, recent run evidence.
- Advanced/secondary panels collapsed by default.

Behavior:

- Start QA Chromium has a clear enabled state in QA/Dev when ready.
- Verify current Incident enables only after CDP readiness.
- Autofill current Incident enables only after verify succeeds and the autofill plan is safe.
- Disabled buttons show inline reasons.
- Verify-only is read-only.
- Autofill fills allowed fields only.
- No Save, Submit, Update, Resolve, Close, ServiceNow API write, or production write action is added.

Accessibility:

- 44px+ action targets.
- Visible focus rings.
- `aria-current` or equivalent on selected queue item.
- `aria-expanded` on disclosure controls.
- Polite live region for runtime status.
- No hover-only critical explanations.
- No pure black/high-contrast dark theme default.

Privacy/safety:

- No real ServiceNow screenshots.
- No real URLs or hosts.
- No raw ticket IDs.
- No raw record identifiers.
- No customer names/emails.
- No credentials/cookies/sessions/storage-state.
- No raw logs/HAR/traces/videos/screenshots.
- No page fingerprints displayed.
- No raw approval phrases displayed.

### 11.4 Test suggestions

Automated tests should verify:

- Headings for the three columns render.
- Runtime buttons render in the right rail.
- `Verify current Incident` disabled reason appears before CDP readiness.
- `Autofill current Incident` disabled reason appears before verify success.
- Production Shadow copy says comparison-only and autofill unavailable.
- Safety strip includes no final write actions.

Manual acceptance should verify:

- Windows double-click opens app.
- Start QA Chromium opens the dedicated browser from the right rail.
- CDP readiness becomes visible in the right rail.
- Verify enables only after CDP readiness.
- Verify-only does not write.
- Autofill fills allowed fields only after verify.
- Three-column UI is visible and simplified.
- Packaging status remains honest.

## 12. Minimality and safety rationale

Why this spec is minimal:

- It changes one markdown design document only.
- It avoids introducing a broad design system.
- It reuses existing product concepts: queue, source review, TicketDraft, KB matches, environment modes, runtime actions, settings, and safety panels.
- It proposes layout reorganization and disabled-copy behavior instead of a domain rewrite.

Why this is safe:

- It is design-only.
- It uses only fake/sanitized examples.
- It does not run or describe real ServiceNow automation.
- It preserves human review and manual final submission.
- It explicitly forbids Save, Submit, Update, Resolve, Close, API writes, and production writes.

Remaining risks for implementer:

- The current app render tree is large, so moving panels could accidentally change state flow if done as a broad refactor.
- Runtime readiness may need careful derivation to avoid enabling Autofill too early.
- Long translated copy may overflow in narrow columns; verify English, Simplified Chinese, Traditional Chinese, and Spanish.
- Image/OpenDesign mockups were not available as final artifacts, so implementation should rely on this spec plus browser verification.
