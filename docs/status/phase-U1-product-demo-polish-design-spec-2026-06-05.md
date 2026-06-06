# Phase U1 — Product-level Demo Polish Design Spec

Date: 2026-06-05
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local demo polish for the Service Desk Workflow Cockpit, with safety boundaries unchanged

## 0. Purpose

Make the local demo feel like a real operator cockpit instead of a vertical demo stream, while preserving the already-accepted order and behavior.

Preserve these confirmed qualities exactly:
- KB recommendations are visible.
- Monthly Excel fill queue logic is correct.
- Incident draft stays below Cleaned summary and above Guided Review Path.
- No live integrations, writes, or customer data exposure.

This is a copy/layout polish spec only. It does not request real ServiceNow login, real browser operations, API writes, or production actions.

## 1. Preflight

Goal
- Produce a concise, reviewable design/status spec for post-RC demo polish.

Known facts
- Repo: `/home/alanxwsl/projects/servicenow-automation`
- Branch: `next/product-clarity-demo-polish-20260605`
- The current RC is already ready for Alan manual validation only.
- The existing workbench order must not regress.

Assumptions
- Alan wants a text spec that the frontend team can implement surgically after approval.
- The best next improvement is copy clarity, action labeling, and compact safety/status language — not a large layout rewrite.

Ambiguities
- Whether the final implementation will re-use the existing three-column shell exactly or adjust spacing slightly.
- Whether any new mockups will be generated later after Alan approves a concept.

Chosen smallest approach
- Keep the accepted structure, document the desired polish, and define acceptance/regression checks that protect the current flow.

Files likely affected
- `docs/status/phase-U1-product-demo-polish-design-spec-2026-06-05.md` only

Verification plan
- Cross-check against the existing workbench docs, current T4/T5 status docs, and the already-accepted order.
- Ensure all suggested copy stays local/demo-only and does not imply write actions.

## 2. Research and design references

Public reference patterns reviewed:
- Claude Code desktop: command-center feel, multiple tasks visible, runtime status nearby, one place to manage progress and review.
- OpenAI Codex docs/navigation patterns: clear separation between navigation, work context, tools, and guarded actions.
- Existing Open Design binding in this repo: `claude` design system + `web-prototype-taste-editorial` template, used as a warm editorial baseline for tone and spacing.

Design takeaways for this cockpit:
- keep settings visible and first-class
- keep runtime actions obvious and gated
- keep safety copy compact but always present
- use warm/light surfaces and large targets
- avoid a tall, always-expanded card wall

## 3. Product direction

The local demo should read as a Service Desk Workflow Cockpit with three stable zones:

- Left: source, queue, todo, history, navigation, settings
- Center: selected source, cleaned source, TicketDraft, required/common field preview, autofill plan, KB/recommendation detail
- Right: runtime actions, browser/CDP readiness, safety boundary, environment controls, recent evidence

The cockpit should feel calm, readable, and operational. The primary story is: intake arrives, the source is cleaned, a draft is prepared, and the operator can safely open QA Chromium, verify the current Incident, and autofill only allowed text fields.

## 4. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ServiceNow Automation   Env: QA / Dev / Prod Shadow   Target: Configured   [Settings] [Safety]│
│ AI drafts and fills allowed fields only. Human reviews and submits in ServiceNow.            │
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

Recommended behavior:
- Top bar stays fixed.
- Each column scrolls internally only if needed.
- Center keeps the current source and draft visible without turning into a long vertical dump.
- Right rail keeps the three runtime actions visible without scrolling.

## 5. Column responsibilities

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

Keep it compact and task-oriented. Avoid demo scenario clutter and avoid expanding every item by default.

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
- KB/recommendation detail when selected

Keep the Incident draft below Cleaned summary and above Guided Review Path exactly as already accepted.

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
- templates/settings quick access
- CDP readiness status
- safety boundary
- environment controls
- recent run evidence

## 6. State matrix

| State | Left column | Center column | Right column |
|---|---|---|---|
| Empty | Onboarding copy + example intake sources | Placeholder cards for source, cleaned source, draft, and KB detail | Disabled actions with explanations |
| Loading intake | Selected row highlights; history unchanged | Skeleton source/detail cards | Runtime remains disabled until readiness exists |
| Source selected | Queue row active | Source detail + cleaned summary | Start QA Chromium may enable if settings are valid |
| Draft ready | Queue row active; history may show prior example | TicketDraft and field preview are primary | Verify current Incident becomes next step |
| Browser ready | Queue row active | Field preview and autofill plan are prominent | Verify current Incident is enabled |
| Page verified | Queue row active | Autofill plan is primary | Autofill current Incident is enabled |
| Autofill complete | Queue row active | Draft + filled field summary + evidence visible | Recent evidence updates; actions reset or remain context-dependent |
| Blocked / error | Queue may still show selection | Blocked panel explains the last safe checkpoint | Disabled buttons show plain-language reasons |

## 7. Main components

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

## 8. Empty, loading, and error states

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

## 9. Button enable / disable logic

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
- Never hide an important action without explaining the condition.
- Never imply Save / Submit / Update / Resolve / Close exists.
- Disabled reasons must be visible next to the control, not hidden in a tooltip.

## 10. Copy text

Recommended core copy:
- `Manual paste only. Fake data only. Local demo only.`
- `AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.`
- `Start QA Chromium`
- `Verify current Incident`
- `Autofill current Incident`
- `No Save, Submit, Update, Resolve, Close.`
- `Settings: QA URL, Dev URL, Production URL, default environment, and safety state.`
- `Recent run evidence is sanitized and local-only.`

Safer operator labels for the demo:
- `Prepare draft` instead of `Create draft` when the action is only local/demo preparation
- `Fill this ticket into monthly Excel` / `Do later — keep in pending queue` for the monthly tracking decision
- `Open Settings` as the universal escape hatch for missing targets

Copy to avoid in primary UI:
- MockAIProvider
- language simulation wording
- high severity simulator wording
- Excel dry-run wording that sounds like a write action
- any copy that hints at real submission or service write

## 11. Accessibility notes

- Warm/light theme by default; avoid pure black surfaces.
- Use large touch/click targets, especially on the right runtime rail.
- Keep the three-column shell obvious at a glance.
- Prefer calm contrast and generous spacing for eye comfort.
- Use progressive disclosure instead of always-expanded panels.
- Keep line length readable for astigmatism / eye comfort.
- Make disabled reasons explicit and readable.
- Preserve keyboard navigation and visible focus states in settings and runtime controls.

## 12. GPT Images 2 mockup notes

Attempted one sanitized landscape mockup with `image_generate` using fake/demo data only.

Result:
- image generation failed with `FalClientHTTPError`
- no usable raster mockup was produced in this run

If a later run gets a working image backend, generate:
- one landscape three-column cockpit concept
- one tighter right-rail/runtime concept

## 13. OpenDesign notes

The project already has an OpenDesign binding:
- design system: `claude`
- template: `web-prototype-taste-editorial`

That binding was used as a warm editorial reference point only. This spec remains the source of truth for ServiceNow Automation implementation decisions.

## 14. Implementation handoff for `sna-frontend-workbench`

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

## 15. Exact acceptance criteria

This spec is ready for implementation only when all of the following are true:

- The app still presents a warm/light three-column operator workbench.
- The left column owns source, queue, todo, history, mode/function switching, and bottom-left settings.
- The center column owns selected source detail, cleaned source, TicketDraft, field preview, autofill plan, and KB/recommendation detail.
- The right column owns runtime actions, CDP readiness, safety boundary, environment controls, and recent evidence.
- Start QA Chromium is visible and clearly labeled.
- Verify current Incident is visibly gated by readiness.
- Autofill current Incident is visibly gated by verification and safe-field rules.
- Disabled buttons explain why they are disabled.
- The UI still preserves the accepted order: Cleaned summary → Incident draft → Guided Review Path → KB recommendations → Monthly Excel fill queue.
- No real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or raw fingerprints are exposed.
- No Save / Submit / Update / Resolve / Close automation is introduced.
- No mock/demo clutter reappears in the primary UI.
- Settings remain first-class and editable for QA URL, Dev URL, Production URL, and default environment.

## 16. Regression checks

When implementation happens, verify these regressions do not return:

1. The workbench does not collapse into a vertical card dump.
2. KB recommendations remain visible in the main flow.
3. Monthly Excel fill queue remains present and local-only.
4. Incident draft remains below Cleaned summary and above Guided Review Path.
5. Verify stays disabled until the browser/CDP readiness is real.
6. Autofill stays disabled until verify succeeds.
7. Disabled buttons always show a visible reason.
8. No raw or sensitive production data leaks into the UI, docs, or comments.
9. The UI does not suggest a final write happened when it did not.
10. The app still feels like a calm operator tool rather than a demo page.

## 17. Final note

This is a product-level demo polish spec, not a permission to expand scope. The smallest safe next step is to keep the accepted structure and tighten the copy, action labels, and status language so the cockpit reads clearly at a glance.
