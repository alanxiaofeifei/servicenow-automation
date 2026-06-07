# Phase AB2 — Service Desk Workflow Cockpit UX/Copy Spec

Date: 2026-06-06
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only ServiceNow Automation cockpit polish, with safety boundaries unchanged

## 0. Preflight

Goal
- Produce a precise, reviewable UX/copy spec for the Service Desk Workflow Cockpit polish pass.
- Preserve the Alan-approved order exactly: Selected source -> Cleaned summary -> Incident draft -> Guided demo path -> Local KB recommendations -> Monthly Excel fill queue.
- Keep the workbench warm/light, readable, and operational rather than demo-like.

Known facts
- Repo: `/home/alanxwsl/projects/servicenow-automation`
- Board: `servicenow-automation`
- Task is docs-only; no UI code should change in this card.
- The project already has an Open Design binding: Claude-inspired warm editorial system with the `web-prototype-taste-editorial` template.

Assumptions
- Alan wants a spec that frontend can implement surgically after approval.
- The accepted three-column structure remains the product direction.
- The mock/demo surface should stay sanitized and local-only.

Ambiguities
- Whether the monthly Excel queue should appear in the center stack or as a secondary card near the left queue.
- Whether a future implementation will keep the same card names or slightly shorten them for compact desktop rendering.

Chosen smallest approach
- Reuse the existing three-column design direction, tighten the copy, specify empty/loading/error states, and define button enable/disable rules without expanding scope.

Files likely affected
- `docs/status/phase-AB2-service-desk-cockpit-ux-spec-2026-06-06.md` only

Verification plan
- Cross-check against AB1 scope, the existing operator-workbench design spec, and the project’s Open Design binding.
- Ensure every example label is sanitized and does not imply ServiceNow writes.
- Confirm the final doc reads as a handoff, not as an implementation promise.

## 1. Purpose

Turn the current local demo into a readable Service Desk Workflow Cockpit with a stable three-column story:

- Left column: source / loading information feed, intake queue, todo list, history, mode or function switching, bottom-left settings
- Center column: selected source detail, cleaned summary, Incident draft, guided demo path, local KB recommendations, Monthly Excel fill queue
- Right column: runtime actions, Start QA Chromium, Verify current Incident, Autofill current Incident, templates/settings, CDP readiness, safety boundary, environment controls, recent run evidence

The UI should feel like a calm operator tool. The user should always know what arrived, what was cleaned, what draft is being prepared, which safe action can happen next, and why a control is disabled when it cannot be used.

## 2. Research and design references

Public reference cues used for this spec:

- Claude Code docs: command-center style navigation, clear environment context, and adjacent runtime status.
- Open Design binding in this repo: Claude-inspired warm editorial system with the `web-prototype-taste-editorial` template.
- Prior local product specs: the workbench should avoid a vertical card dump and keep settings first-class.

Design takeaways:

- keep settings visible, not buried
- keep runtime actions obvious and gated
- keep safety copy compact but always present
- use warm/light surfaces and large targets
- prefer progressive disclosure over always-expanded panels
- keep the accepted order stable so the demo story is easy to narrate

## 3. Layout wireframe in text

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ServiceNow Automation   Env: QA / Dev / Prod Shadow   Target: Configured   [Settings] [Safety]│
│ AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.       │
├──────────────────────────┬──────────────────────────────────────────────┬─────────────────────┤
│ LEFT: SOURCE + QUEUE     │ CENTER: WORK PRODUCT                         │ RIGHT: RUNTIME      │
│                          │                                              │                     │
│ Loading feed             │ Selected source detail                       │ Start QA Chromium   │
│ Intake queue             │ Cleaned summary                              │ Verify current      │
│ Todo list                │ Incident draft                               │ Incident            │
│ History                  │ Guided demo path                             │ Autofill current    │
│ Mode / function switch   │ Local KB recommendations                     │ Incident            │
│ Bottom-left Settings     │ Monthly Excel fill queue                     │ Templates / settings│
│                          │                                              │ CDP readiness       │
│                          │                                              │ Safety boundary     │
│                          │                                              │ Env controls        │
│                          │                                              │ Recent evidence     │
└──────────────────────────┴──────────────────────────────────────────────┴─────────────────────┘
```

Recommended behavior:

- Top bar stays fixed.
- Each column scrolls internally only if needed.
- The center stack stays in the exact story order.
- The right rail keeps the three runtime actions visible without requiring a hunt through the page.
- Secondary or explanatory detail should collapse by default.

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

- Do not turn the left side into a long demo script.
- Do not show everything expanded by default.
- Keep queue entries short enough to scan quickly.

### Center column
Owns the work product.

It should answer:

- What is the selected source?
- What did normalization produce?
- What Incident draft is being prepared?
- What is the guided demo path?
- What KB recommendation matters?
- What Monthly Excel queue item is next?

Use this exact order in the main stack:

1. Selected source detail
2. Cleaned summary
3. Incident draft
4. Guided demo path
5. Local KB recommendations
6. Monthly Excel fill queue

Rules:

- The work product must read like a single narrative, not a pile of unrelated cards.
- The guided demo path is a compact teaching aid, not a giant stepper wall.
- The Monthly Excel fill queue remains present, local-only, and non-destructive.

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

Rules:

- Keep action labels literal and self-explanatory.
- Keep disabled reasons visible next to the control.
- Avoid adding new runtime actions in this polish pass.

## 5. Exact user-facing copy

### Top bar
- Title: `ServiceNow Automation`
- Environment summary: `Env: QA / Dev / Prod Shadow`
- Target summary: `Target: Configured` or `Target: Missing`
- Settings button: `Settings`
- Safety button or badge: `Safety`
- Safety line: `AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.`

### Left rail
- Section titles:
  - `Loading feed`
  - `Intake queue`
  - `Todo list`
  - `History`
  - `Mode / function switch`
  - `Settings`
- Empty queue helper: `No source selected. Paste or load a sanitized source to begin.`
- History helper: `Recent local items and safe checkpoints appear here.`

### Center stack
- `Selected source detail`
- `Cleaned summary`
- `Incident draft`
- `Guided demo path`
- `Local KB recommendations`
- `Monthly Excel fill queue`

Suggested helper copy by state:

- Selected source empty: `Select a source from the left queue to begin.`
- Cleaned summary empty: `The cleaned summary will appear after normalization.`
- Incident draft empty: `The draft stays blank until a source is selected.`
- Guided demo path empty: `The guided path appears after the draft is ready.`
- KB recommendations empty: `Local KB recommendations appear after the draft is generated.`
- Monthly Excel queue empty: `Items stay local-only until the monthly queue is ready.`

### Right rail
- `Start QA Chromium`
- `Verify current Incident`
- `Autofill current Incident`
- `Templates / settings`
- `Browser: disconnected`
- `Browser: connecting`
- `Browser: connected`
- `Browser: error`
- `CDP ready`
- `Safety boundary`
- `Environment controls`
- `Recent run evidence`

### Settings panel copy
Mandatory settings fields:

- `QA URL`
- `Dev URL`
- `Production URL`
- `Default environment`
- `Compact safety state`

Helper copy:

- `Configure the URLs used for QA, Dev, and Production Shadow before starting the browser.`
- `Pick the default environment used when the cockpit opens.`
- `The safety state stays compact and visible at all times.`
- `Saved settings are local to this machine.`

### Disabled reasons
Use plain-language, visible reasons next to the disabled control:

- Start QA Chromium disabled because: `Configure QA, Dev, or Production Shadow in Settings before launching.`
- Verify current Incident disabled because: `Start QA Chromium and wait for CDP ready first.`
- Autofill current Incident disabled because: `Verify current Incident first.`
- Autofill current Incident disabled for safety because: `Production Shadow is comparison-only.`
- Any runtime action disabled because another action is running: `Another runtime action is running.`

### Prohibited primary-UI copy
Do not surface the following in the primary UI:

- `MockAIProvider`
- language simulation wording
- high severity simulator wording
- Excel dry-run wording that sounds like a write action
- any copy that hints at real submission or service write

## 6. State matrix

| State | Left column | Center column | Right column |
| --- | --- | --- | --- |
| Empty | Onboarding copy + example intake sources | Placeholder cards for source, cleaned summary, draft, guided path, KB, and Monthly Excel queue | Disabled actions with visible reasons |
| Loading intake | Selected row highlights; history unchanged | Source detail skeleton / muted placeholders | Runtime actions remain disabled until readiness exists |
| Source selected | Queue row active | Selected source detail + cleaned summary | Start QA Chromium may enable if settings are valid |
| Draft ready | Queue row active; history may show prior example | Incident draft and guided path are primary | Verify current Incident becomes the next step |
| Browser ready | Queue row active | Field preview and autofill plan are prominent | Verify current Incident is enabled |
| Page verified | Queue row active | Autofill plan is primary | Autofill current Incident is enabled |
| Autofill complete | Queue row active | Draft + filled field summary + evidence visible | Recent evidence updates; actions reset or remain context-dependent |
| Blocked / error | Queue may still show selection | Blocked panel explains the last safe checkpoint | Disabled buttons show plain-language reasons |

## 7. Empty, loading, and error states

### Empty states
- Use one sentence, one next action, and one calm placeholder.
- Avoid giant blank panels.
- Suggest a fake or local demo source, never a real ServiceNow record.

Recommended copy:
- `No source selected.`
- `Paste or load a sanitized source to begin.`
- `Configure QA, Dev, or Production Shadow in Settings before starting the browser.`

### Loading states
- Use skeleton cards or muted placeholders only.
- Keep the current item visible if the user already selected one.
- Prefer progress language over generic spinners.

Example copy:
- `Launching dedicated browser...`
- `Waiting for CDP readiness...`
- `Normalizing source...`
- `Preparing the Incident draft...`

### Error states
- Show the exact step that failed.
- Keep the previous safe state visible.
- Do not imply ServiceNow changed when it did not.
- Explain why a button is disabled in plain language.

Example copy:
- `Browser launch failed. Try again after checking Settings.`
- `CDP is not ready yet. Start QA Chromium first.`
- `The current Incident could not be verified. The last safe checkpoint is still visible.`
- `Autofill is blocked until verification completes.`

## 8. Button enable / disable logic

### Start QA Chromium
Enabled when:

- QA, Dev, or Production Shadow target is configured
- no other runtime action is busy

Disabled copy:

- `Configure a target in Settings before launching.`
- `Another runtime action is running.`

### Verify current Incident
Enabled when:

- CDP readiness is present
- the browser session is connected
- no busy action is running

Disabled copy:

- `Start QA Chromium and wait for CDP ready first.`
- `The browser is not connected yet.`
- `Another runtime action is running.`

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
- `Another runtime action is running.`

### General rules
- Never hide an important action without explaining the condition.
- Never imply Save / Submit / Update / Resolve / Close exists.
- Disabled reasons must be visible next to the control, not hidden in a tooltip.
- Keep the labels literal and consistent across the runtime rail and settings help text.

## 9. Accessibility notes

- Warm/light theme by default; avoid pure black surfaces.
- Use large touch/click targets, especially on the right runtime rail.
- Keep the three-column shell obvious at a glance.
- Prefer calm contrast and generous spacing for eye comfort.
- Use progressive disclosure instead of always-expanded panels.
- Keep line length readable for astigmatism / eye comfort.
- Make disabled reasons explicit and readable.
- Preserve keyboard navigation and visible focus states in settings and runtime controls.
- Avoid tiny metadata labels when a short sentence would be clearer.

## 10. GPT Images 2 mockup notes

Attempted sanitized mockups with `image_generate` using fake/demo data only:

- landscape three-column cockpit prompt
- portrait right-rail runtime prompt

Result:

- both image generation attempts returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

## 11. Open Design notes

The project already has an OpenDesign binding:

- design system: `claude`
- template: `web-prototype-taste-editorial`

That binding was used as a warm editorial reference point only. This spec remains the source of truth for ServiceNow Automation implementation decisions.

## 12. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented in frontend code, keep the change set surgical and preserve the accepted order.

Implementation requirements:

1. Preserve the current local-only safety model.
2. Keep settings first-class and visible.
3. Keep the left / center / right responsibilities stable.
4. Keep the guided demo path compact and optional.
5. Keep disabled button reasons plain-language and visible.
6. Keep KB recommendations visible.
7. Keep Monthly Excel fill queue present and non-destructive.
8. Keep the exact order: Selected source -> Cleaned summary -> Incident draft -> Guided demo path -> Local KB recommendations -> Monthly Excel fill queue.
9. Do not reintroduce demo clutter, mock-provider labels, or always-open debug surfaces.
10. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

## 13. Exact acceptance criteria

This spec is ready for implementation only when all of the following are true:

- The app still presents a warm/light three-column operator workbench.
- The left column owns source, queue, todo, history, mode/function switching, and bottom-left settings.
- The center column owns selected source detail, cleaned summary, Incident draft, guided demo path, KB recommendations, and Monthly Excel fill queue.
- The right column owns runtime actions, CDP readiness, safety boundary, environment controls, and recent evidence.
- Start QA Chromium is visible and clearly labeled.
- Verify current Incident is visibly gated by readiness.
- Autofill current Incident is visibly gated by verification and safe-field rules.
- Disabled buttons explain why they are disabled.
- The UI still preserves the accepted order exactly.
- No real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or raw fingerprints are exposed.
- No Save / Submit / Update / Resolve / Close automation is introduced.
- No mock/demo clutter reappears in the primary UI.
- Settings remain first-class and editable for QA URL, Dev URL, Production URL, and default environment.

## 14. Regression checks

When implementation happens, verify these regressions do not return:

1. The workbench does not collapse into a vertical card dump.
2. KB recommendations remain visible in the main flow.
3. Monthly Excel fill queue remains present and local-only.
4. Incident draft remains below Cleaned summary and above Guided demo path.
5. Verify stays disabled until the browser/CDP readiness is real.
6. Autofill stays disabled until verify succeeds.
7. Disabled buttons always show a visible reason.
8. No raw or sensitive production data leaks into the UI, docs, or comments.
9. The UI does not suggest a final write happened when it did not.
10. The app still feels like a calm operator tool rather than a demo page.

## 15. Final note

This is a product-level UX/copy spec, not a permission to expand scope. The smallest safe next step is to keep the accepted structure and tighten the copy, action labels, and status language so the cockpit reads clearly at a glance.
