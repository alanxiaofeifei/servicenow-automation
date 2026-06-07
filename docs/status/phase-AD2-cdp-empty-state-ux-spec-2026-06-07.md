# Phase AD2 — CDP readiness and empty/loading state UX spec

Date: 2026-06-07
Status: design/spec only — no implementation in this task
Audience: Alan, then `sna-frontend-workbench` after approval
Scope: local-only ServiceNow Automation cockpit polish, with safety boundaries unchanged

## 0. Preflight

Goal
- Produce a precise, reviewable UX/spec handoff for two visible polish items:
  1. Runtime rail browser/CDP readiness indicator with states disconnected, connecting, connected, and error; no endpoint details.
  2. Center empty/loading/error states for no source selected, draft preparation, and KB preparation; no spinner; no order regression.
- Preserve the Alan-approved three-column story and the accepted center order.
- Keep the workbench warm/light, readable, and operational rather than demo-like.

Known facts
- Repo: `/home/alanxwsl/projects/servicenow-automation`
- Board task: `t_c9587497`
- This task is docs-only; no UI code should change in this card.
- The project already has an Open Design binding: Claude-inspired warm editorial system with the `web-prototype-taste-editorial` template.
- Previous specs in `docs/status/` already established the three-column operator workbench direction.

Assumptions
- Alan wants a spec that frontend can implement surgically after approval.
- The accepted three-column structure remains the product direction.
- The browser/CDP readiness badge should stay compact and visible inside the right runtime rail.
- Empty/loading states should preserve the selected source → cleaned summary → Incident draft → guided path → KB → monthly queue order.

Ambiguities
- Whether the center loading placeholders should use a skeleton bar pattern or muted text blocks.
- Whether the browser error state should include a retry CTA or remain informational only.
- Whether the empty-state helper text should mention local demo inputs by name or keep the wording generic.

Chosen smallest approach
- Reuse the existing workbench structure, add exact state copy, and define button enable/disable logic without expanding scope or adding new runtime actions.

Files likely affected
- `docs/status/phase-AD2-cdp-empty-state-ux-spec-2026-06-07.md` only

Verification plan
- Cross-check against the existing operator-workbench design spec and the project’s Open Design binding.
- Ensure every example label is sanitized and does not imply ServiceNow writes.
- Confirm the final doc reads as a handoff, not as an implementation promise.

## 1. Purpose

Turn the current local cockpit into a calmer, more legible operator workbench by tightening two weak spots:

1. Right runtime rail: browser/CDP readiness must be obvious at a glance without leaking endpoint details.
2. Center work stack: empty, loading, and error states must explain what is happening and what the next safe step is.

The workbench should still feel like one coherent operator story:

- Left column: source/loading information feed, intake queue, todo list, history, mode/function switching, bottom-left settings
- Center column: selected source detail, cleaned summary, Incident draft, guided demo path, local KB recommendations, monthly Excel fill queue
- Right column: runtime actions, Start QA Chromium, Verify current Incident, Autofill current Incident, templates/settings, CDP readiness, safety boundary, environment controls, recent run evidence

## 2. Research and design references

This spec follows the existing project direction and the already-bound Open Design material:

- Claude-inspired warm editorial system: parchment-toned canvas, warm neutrals, calm hierarchy, and readable serif/sans contrast.
- Three-column operator workbench principle: left orientation/queue, center work product, right runtime/action inspector.
- Command-center principle from modern agent desktop apps: keep readiness and action status visible near the controls that depend on them.
- Progressive disclosure principle: show the next useful thing, not every detail at once.

Design takeaways for this task:

- keep browser/CDP status compact but unmistakable
- keep disabled reasons visible and human-readable
- use skeletons or muted placeholders instead of spinning loaders
- avoid endpoint detail, raw hostnames, or any write-action implication
- preserve the established center order; do not re-sort the stack

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
│                          │                                              │ Browser/CDP status  │
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
- While data is preparing, keep the card order visible and replace body content with skeleton/muted placeholders.

### Right column
Owns action readiness and safety.

It should answer:

- Can I start QA Chromium now?
- Is the current Incident verifiable yet?
- Is autofill allowed yet?
- What browser/CDP state am I in?
- What evidence was just produced?

Include:

- runtime actions
- Start QA Chromium
- Verify current Incident
- Autofill current Incident
- templates/settings quick access
- browser/CDP readiness status
- safety boundary
- environment controls
- recent run evidence

Rules:

- Keep action labels literal and self-explanatory.
- Keep disabled reasons visible next to the control.
- Avoid adding new runtime actions in this polish pass.
- Do not expose endpoint details; show only the readiness state and a compact reason when needed.

## 5. State matrix

| State | Left column | Center column | Right column |
| --- | --- | --- | --- |
| Empty | Shows onboarding copy and example intake sources | Shows a friendly empty prompt for the selected source, plus muted placeholders for downstream cards | Shows disabled actions with explanations |
| Loading intake | Queue item highlights; history unchanged | Selected card stays in place; downstream cards use skeleton bars or muted text blocks | Runtime buttons stay disabled until the browser state is ready |
| Source selected | Queue row active | Selected source detail appears; cleaned summary can still be pending | Start QA Chromium can be enabled if settings are valid |
| Draft preparing | Queue row active; history unchanged | Incident draft body and KB cards show skeletons/muted placeholders | Verify remains disabled until browser/CDP is ready |
| Browser ready | Queue row active | Draft and field preview are visible | Verify current Incident becomes enabled |
| Page verified | Queue row active | Autofill plan becomes prominent | Autofill current Incident becomes enabled; safety copy stays visible |
| Draft/KB error | Queue may still show selected item | The blocked panel explains the last safe checkpoint and next safe retry point | Disabled buttons show plain-language reasons |
| Browser/CDP error | Queue row active | Center stays intact; no order change | Browser status shows error; Verify/Autofill remain disabled |

Notes:
- No spinner should be used in the center stack for these states.
- If the app is waiting, use skeletons or muted placeholders instead of a spinning loader.
- Keep the last safe content visible whenever possible.
- Do not collapse the stack or reorder cards when transitioning between states.

## 6. Main components

- top chrome with product identity, environment, and safety
- left rail for source queue, todo, history, and navigation
- center workstack cards
  - source detail
  - cleaned source
  - Incident draft
  - required/common fields
  - autofill plan
  - KB recommendation
- right runtime rail
  - browser launch
  - page verification
  - autofill
  - templates/settings
  - browser/CDP readiness
  - recent evidence
- compact safety banner
- settings drawer / panel

## 7. Empty, loading, and error states

### Empty states
- Use one sentence and one next action.
- Avoid giant blank panels.
- Use friendly guidance that explains where the source comes from.
- Keep the selected-source order visible even when no source has been chosen.

Recommended empty-state behavior by card:

- Selected source detail empty: a prompt to pick a source from the left queue.
- Cleaned summary empty: a note that normalization will appear after a source is selected.
- Incident draft empty: a note that the draft stays blank until a source is selected.
- Guided demo path empty: a note that the guided path appears after the draft is ready.
- Local KB recommendations empty: a note that recommendations appear after the draft is generated.
- Monthly Excel fill queue empty: a note that items stay local-only until the monthly queue is ready.

### Loading states
- Skeleton bars or muted placeholders only.
- Keep the current item visible if the user already selected one.
- Prefer progress language over generic spinners.
- Use “Preparing…” / “Normalizing…” / “Reviewing…” wording instead of a busy icon.

### Error states
- Show the exact step that failed.
- Keep the previous safe state visible.
- Explain why a button is disabled instead of only graying it out.
- Never imply the system wrote to ServiceNow when it did not.

### Browser/CDP status states
- `Browser: disconnected` — not yet launched or disconnected after a stop.
- `Browser: connecting` — launch in progress, waiting for handshake.
- `Browser: connected` — launch succeeded and the operator can proceed.
- `Browser: error` — the browser launch or CDP handshake failed.

Rules for browser/CDP status:
- show only the state label and compact hint text
- never show endpoint details, host, port, raw URL, or fingerprint
- keep the status chip compact enough to fit inside the right rail header area

## 8. Button enable / disable logic

### Start QA Chromium
- enabled when QA / allowed environment settings are configured
- disabled when settings are missing or another browser step is still running
- disabled reason must explain the missing setting or current wait state

### Verify current Incident
- enabled only after browser/CDP readiness is connected
- disabled until the browser is started and connected
- disabled reason must say to start the QA browser first

### Autofill current Incident
- enabled only after the current page has been verified
- disabled until the Incident page is confirmed as current and safe
- disabled reason must say to verify the current Incident first

### General rules
- never hide an important action without explaining the condition
- keep disabled reasons short and non-technical
- do not imply any save / submit / update / resolve / close action exists
- if the browser is in error, keep Verify and Autofill disabled until the status returns to connected

## 9. Copy text

Recommended core copy:

- `Manual paste only. Fake data only. Local demo only.`
- `AI drafts and fills allowed text fields only. Human reviews and submits in ServiceNow.`
- `Start QA Chromium`
- `Verify current Incident`
- `Autofill current Incident`
- `No Save, Submit, Update, Resolve, Close.`
- `Settings: QA URL, Dev URL, Production URL, default environment, and safety state.`
- `Recent run evidence is sanitized and local-only.`

Empty-state copy:

- `Select a source from the left queue to begin.`
- `The cleaned summary will appear after normalization.`
- `The draft stays blank until a source is selected.`
- `The guided path appears after the draft is ready.`
- `Local KB recommendations appear after the draft is generated.`
- `Items stay local-only until the monthly queue is ready.`

Browser/CDP copy:

- `Browser: disconnected`
- `Browser: connecting`
- `Browser: connected`
- `Browser: error`
- `Waiting for browser readiness...`
- `Connected and ready for verification.`
- `Reconnect required before verification.`

Disabled reasons:

- `Configure QA, Dev, or Production Shadow in Settings before launching.`
- `Start QA Chromium and wait for browser readiness first.`
- `Verify current Incident first.`
- `Another runtime action is running.`

What to avoid in primary UI copy:

- any raw endpoint details
- raw ServiceNow URLs or ticket IDs
- any save/submit/close language
- demo labels such as `MockAIProvider` or simulator names
- long technical debug prose

## 10. Accessibility notes

- warm/light theme by default; avoid pure black surfaces
- large touch/click targets
- strong but not harsh contrast for key text
- progressive disclosure instead of always-expanded panels
- keep line length readable for astigmatism / eye comfort
- disabled states must explain why
- use clear section headers so the three-column structure is obvious at a glance
- preserve keyboard navigation and focus visibility in the settings and runtime rail
- do not rely on color alone to distinguish browser/CDP status; pair color with text
- use skeletons with sufficient contrast so loading states remain readable

## 11. GPT Images 2 mockup notes

Attempted sanitized mockups with GPT Images 2 / `image_generate` using fake data only:

- landscape three-column workbench prompt
- portrait runtime-rail detail prompt

Result:
- image generation returned `FalClientHTTPError` in this run
- no usable mockup files were produced

Prompts retained for a later image-capable rerun:

1. Three-column warm operator workbench
   - Warm light ServiceNow Automation workbench, left source queue and settings, center source detail to draft to KB stack, right runtime rail with Start QA Chromium / Verify / Autofill and browser/CDP readiness states. Fake data only, no raw URLs or ticket IDs, no demo clutter.
2. Runtime rail detail
   - Warm light browser/CDP readiness panel inside an operator workbench, showing disconnected/connecting/connected/error states, disabled action reasons, and compact safety boundary. Sanitized fake data only, no endpoint details.

## 12. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented further in frontend code, keep the change set surgical:

1. Preserve the current local-only safety model.
2. Keep settings first-class and visible.
3. Keep the left / center / right responsibilities stable.
4. Keep the center order stable and do not introduce a new mode switch.
5. Replace spinners in the center stack with skeletons or muted placeholders.
6. Add the browser/CDP readiness chip to the right rail without exposing endpoint details.
7. Keep disabled button reasons plain-language and colocated with the controls.
8. Do not reintroduce demo clutter such as mock-provider labels, language simulation noise, or always-open debug surfaces.
9. Verify with the normal gates before asking for Alan approval.

Suggested next implementation steps:
- align remaining labels to the three-column story
- wire the browser/CDP status chip to the existing runtime state model
- add one small UI test for the empty/loading/error state copy and one for the Verify enablement gate
- keep the acceptance narrative to: start browser → browser connected → verify enabled → autofill still gated until verify
