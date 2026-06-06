# Operator Workbench — Three-Column Demo Walkthrough Spec

Date: 2026-06-05
Scope: ServiceNow Automation demo walkthrough clarity, local-only fake flow, warm-light operator workbench

## 1) Purpose

Turn the current local demo into a readable operator workbench story:

- left column = intake + queue + history + navigation
- center column = selected source → cleaned source → TicketDraft → field preview → autofill plan → KB recommendation
- right column = runtime actions + safety + environment controls + recent evidence

This spec is intentionally small and demo-focused. It is not a redesign system and it does not introduce production automation or external writes.

## 2) Research cues used

Public reference pattern notes:

- Claude Code desktop emphasizes one place to manage parallel work, inspect results, and see progress without bouncing between screens.
- The best agent workbenches keep the current task obvious, the supporting evidence nearby, and the action rail compact.
- Modern command-center UIs use progressive disclosure instead of always-expanded panels.

Design takeaways for this app:

- keep one primary work narrative in view
- make settings visible, not buried
- keep safety language compact but always present
- use large targets and calm colors
- do not make the user hunt for the next action

## 3) Layout wireframe in text

Top bar
- product name
- environment status chip
- safety chip
- Settings button
- compact runtime / connection summary

Main shell: three columns

Left column: Intake and navigation
- source / loading information feed
- intake queue
- todo list
- history
- mode / function switching
- bottom-left settings access

Center column: Work product
- selected source detail
- cleaned / normalized source text
- generated TicketDraft
- ServiceNow required/common field preview
- autofill plan
- KB / recommendation detail when selected
- small report / export outcome area when the demo reaches the end

Right column: Runtime and controls
- Start QA Chromium
- Verify current Incident
- Autofill current Incident
- templates / settings
- CDP readiness status
- safety boundary
- environment controls
- recent run evidence

## 4) Column responsibilities

### Left column
Owns orientation and queue management.

The user should immediately see:

- what arrived
- what is waiting
- what was already handled
- how to switch between modes or views

### Center column
Owns the work the agent is producing.

The user should see a clean progression:

1. raw source detail
2. cleaned source
3. TicketDraft
4. field preview
5. autofill plan
6. KB recommendation or report evidence

### Right column
Owns actions, safety, and runtime status.

The user should immediately know:

- whether the QA browser is ready
- whether current Incident verification is allowed
- whether autofill is blocked and why
- whether the environment is QA / dev / production / local-only
- what evidence was just produced

## 5) State matrix

| State | Left column | Center column | Right column |
| --- | --- | --- | --- |
| Empty | Shows onboarding copy and example intake sources | Shows placeholder cards for source, cleaned source, draft, and KB recommendation | Shows disabled actions with explanations |
| Loading intake | Queue item highlights; history unchanged | Source detail skeleton / spinner | Runtime buttons remain disabled until the browser state is ready |
| Source selected | Queue row active | Selected source detail + cleaned source preview | Start QA Chromium can be enabled if settings are valid |
| Draft ready | Queue row active; history can show prior examples | TicketDraft and field preview are the main focus | Verify current Incident becomes the next step |
| Browser ready | Queue row active | Field preview and autofill plan are prominent | Verify current Incident is enabled |
| Page verified | Queue row active | Autofill plan is primary | Autofill current Incident is enabled; safety copy stays visible |
| Autofill complete | Queue row active | Draft + filled field summary + KB / report evidence | Recent run evidence updates; runtime buttons reset or remain context-dependent |
| Blocked / error | Queue may still show selected item | The blocked panel explains the last safe checkpoint | Disabled buttons show plain-language reasons |

## 6) Main components

- top chrome with product identity, environment, and safety
- left rail for source queue, todo, history, and navigation
- center workstack cards
  - source detail
  - cleaned source
  - TicketDraft
  - required/common fields
  - autofill plan
  - KB recommendation
- right runtime rail
  - browser launch
  - page verification
  - autofill
  - templates/settings
  - CDP readiness
  - recent evidence
- compact safety banner
- settings drawer / panel
- what-changed release-readiness card

## 7) Empty, loading, and error states

### Empty states
- Use one sentence and one next action.
- Avoid giant blank panels.
- Suggest a fake/local demo source, not a real ServiceNow record.

### Loading states
- Skeletons or muted placeholders only.
- Keep the current item visible if the user already selected one.
- Prefer progress language over generic spinners.

### Error states
- Show the exact step that failed.
- Keep the previous safe state visible.
- Explain why a button is disabled instead of only graying it out.
- Never imply the system wrote to ServiceNow when it did not.

## 8) Button enable / disable logic

Start QA Chromium
- enabled when QA / allowed environment settings are configured
- disabled when settings are missing or another browser step is still running
- disabled reason must explain the missing setting or current wait state

Verify current Incident
- enabled only after CDP readiness / browser connection is ready
- disabled until the browser is started and connected
- disabled reason must say to start the QA browser first

Autofill current Incident
- enabled only after the current page has been verified
- disabled until the Incident page is confirmed as current and safe
- disabled reason must say to verify the current Incident first

General rules
- never hide an important action without explaining the condition
- keep disabled reasons short and non-technical
- do not imply any save / submit / update / resolve / close action exists

## 9) Copy text

Recommended core copy:

- "Manual paste only. Fake data only. Local demo only."
- "AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow."
- "Start QA Chromium"
- "Verify current Incident"
- "Autofill current Incident"
- "No Save, Submit, Update, Resolve, Close."
- "Settings: QA URL, Dev URL, Production URL, default environment, and safety state."
- "Recent run evidence is sanitized and local-only."

What-changed panel copy:

- title: "What changed in this round"
- summary: explain that the workbench is being hardened through repeated validation and that the UI now makes the demo story visible
- footer: "Human reviews and manually submits in ServiceNow."

## 10) Accessibility notes

- warm/light theme by default; avoid pure black surfaces
- large touch/click targets
- strong but not harsh contrast for key text
- progressive disclosure instead of always-expanded panels
- keep line length readable for astigmatism / eye comfort
- disabled states must explain why
- use clear section headers so the three-column structure is obvious at a glance
- preserve keyboard navigation and focus visibility in the settings and runtime rail

## 11) GPT Images 2 mockup notes

Attempted sanitized mockups with GPT Images 2 / image_generate using fake data only:

- landscape three-column workbench prompt
- portrait runtime-rail detail prompt

Result:
- image generation returned FalClientHTTPError in this run
- no usable mockup files were produced

## 12) Implementation handoff for sna-frontend-workbench

If this spec is implemented further in frontend code, keep the change set surgical:

1. Preserve the current local-only safety model.
2. Keep settings first-class and visible.
3. Keep the left / center / right responsibilities stable.
4. Keep the what-changed panel compact and optional.
5. Keep disabled button reasons plain-language.
6. Do not reintroduce demo clutter such as mock-provider labels, language simulation noise, or always-open debug surfaces.
7. Verify with the normal gates before asking for Alan approval.

Suggested next implementation steps:
- align remaining labels to the three-column story
- keep the demo walkthrough copy short enough for a 3–5 minute narration
- add or refresh one small UI test for the workbench narrative and safety copy
