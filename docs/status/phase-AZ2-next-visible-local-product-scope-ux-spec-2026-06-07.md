# Phase AZ2 — Next Visible Local Product Scope — UX / Copy Spec

**Date:** 2026-06-07
**Branch:** `next/post-release-operator-cockpit-ab-20260606`
**Profile:** `sna-ui-designer`
**Task:** `t_8def9ffe`

---

## 1. Preflight

**Goal**
Turn AZ1 into a calm, warm-light three-column Operator Workbench UX/copy spec that keeps the product story local-only, explicit, and free of demo clutter.

**Known facts**
- The target surface is a three-column operator workbench: left source/history, center work product, right runtime actions.
- Settings must remain first-class and visible.
- The primary runtime story is: Start QA Chromium → Verify current Incident → Autofill current Incident.
- No real ServiceNow/browser/API writes are allowed in this phase.
- The existing design artifact already lives at `docs/design/operator-workbench-three-column-spec.md`.

**Assumptions**
- The implementation team will use the spec as a handoff, not as an instruction to change behavior in this phase.
- Public-reference research is acceptable only as layout inspiration, not branding or copy reuse.
- GPT Images 2 mockups are optional unless the backend is available.

**Ambiguities**
- Whether the image backend will successfully generate any sanitized mockups in this run.
- Whether Alan wants one final concept or multiple visual variants before frontend implementation.

**Chosen smallest approach**
- Keep this phase documentation-only.
- Create a single status doc that records the design decisions, state matrix, copy, accessibility notes, and implementation handoff.
- Reuse the existing design doc rather than expanding the scope into frontend code.

**Files likely affected**
- `docs/status/phase-AZ2-next-visible-local-product-scope-ux-spec-2026-06-07.md` (new)
- `docs/design/operator-workbench-three-column-spec.md` only if a small alignment edit becomes necessary later

**Verification plan**
- Confirm the status doc includes layout, column responsibilities, state matrix, components, empty/loading/error states, button gating, copy, accessibility, mockup notes, and frontend handoff.
- Confirm no real ServiceNow data, no raw URLs, no tickets, no sys_ids, and no write-action copy appears.
- Confirm the task stays scoped to docs/design and docs/status only.

---

## 2. Public reference synthesis

The design direction intentionally borrows layout principles from public agent-workbench patterns:

- Codex-style command center separation: context on the side, current work in the center, execution status on the other side.
- Claude Code desktop/workbench behavior: calm desktop shell, visible task state, multiple actions, and clear project context.
- Antigravity-style manager/editor/artifact thinking: source manager, working artifact, and runtime evidence are kept distinct.

A public Claude Code product page was reachable and reinforced the idea of a desktop workbench with multiple parallel tasks, visual diffs, and preview surfaces. A public OpenAI Codex landing page returned a bot-detection challenge, so no page content was used from that source.

---

## 3. Layout wireframe in text

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
- The top bar stays fixed.
- Each column may scroll internally.
- The center keeps the current source and draft visible without becoming a long scroll wall.
- The right rail keeps the three runtime actions visible without page scroll.
- Settings must remain first-class and easy to find.

---

## 4. Column responsibilities

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

---

## 5. State matrix

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

---

## 6. Main components

Keep the component set small.

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

---

## 7. Empty, loading, and error states

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

---

## 8. Button enable / disable logic

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

---

## 9. Copy text

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

---

## 10. Accessibility notes

- warm/light theme by default; avoid pure black surfaces
- large touch/click targets, especially on the right runtime rail
- calm contrast and generous spacing for eye comfort
- progressive disclosure instead of always-expanded panels
- readable line length for astigmatism / eye comfort
- disabled reasons must be explicit and readable
- preserve keyboard navigation and visible focus states in settings and runtime controls
- keep the three-column shell obvious at a glance

---

## 11. GPT Images 2 mockup notes

Attempted sanitized mockup generation with `image_generate` using fake/demo data only.

Result:
- the backend returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

If a later run gets a working image backend, generate:
- one landscape three-column cockpit concept
- one tighter right-rail/runtime concept

---

## 12. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented in frontend code, keep the change set surgical and preserve the accepted order.

Implementation requirements:
1. Preserve the current local-only safety model.
2. Keep settings first-class and visible.
3. Keep the left / center / right responsibilities stable.
4. Keep the what-changed / guidance copy compact.
5. Keep disabled button reasons plain-language and visible.
6. Keep KB recommendations visible.
7. Keep draft preview and allowed-field guidance visible.
8. Keep Incident draft below the cleaned summary and above autofill guidance.
9. Do not reintroduce demo clutter, mock-provider labels, or always-open debug surfaces.
10. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

---

## 13. Acceptance criteria

This phase is ready for frontend implementation only when all of the following are true:
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

---

## 14. Handoff summary for the next worker

- The design direction is locked to a calm warm-light three-column operator workbench.
- The current design artifact is documented in `docs/design/operator-workbench-three-column-spec.md`.
- Public-source inspiration was used only as layout guidance.
- GPT Images 2 attempts failed in this run, so the status doc is text-only.
- The next valid step is frontend implementation only after Alan approves the concept.
