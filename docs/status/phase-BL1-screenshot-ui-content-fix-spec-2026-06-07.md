# Phase BL1 — screenshot-driven UI/content fix spec for BJ6 issues

Date: 2026-06-07  
Status: design/spec only — no implementation in this task  
Audience: Alan first, then `sna-frontend-workbench` after approval  
Privacy level: sanitized. All examples are fake/local-only. Do not include real ServiceNow URLs/hosts, ticket IDs, sys_ids, screenshots, logs, cookies, sessions, HAR, traces, credentials, requester names, assignment groups, or customer data.

## 0. Preflight

Goal
- Turn Alan’s screenshot feedback into a precise, small P0 fix spec.
- Fix the visual collision between release-readiness/package handoff and the ServiceNow workbench flow.
- Preserve the real product order in the workbench: selected source detail -> cleaned summary -> Incident draft -> guided demo path -> local KB recommendations -> monthly Excel fill queue.

Known facts
- The user-provided screenshots show a warm/light app with strong fundamentals, but too much content density, repeated sidebar panels, and overlapping long cards.
- The current UI mixes release/package acceptance material with the normal incident workbench on one long page.
- The left sidebar appears to repeat source/search/queue sections instead of presenting one compact source/navigation area.
- The existing operator-workbench spec already exists in `docs/design/operator-workbench-three-column-spec.md` and should remain the stable baseline.
- `image_generate` was attempted in this run with sanitized prompts, but the backend returned `FalClientHTTPError`; no usable raster mockup was produced.

Assumptions
- Alan wants a targeted correction spec, not a redesign of the entire product.
- The smallest safe change is to keep the current warm/light shell and simplify the hierarchy, copy, and density.
- The release-readiness workflow can be separated visually without changing runtime behavior.

Ambiguities
- Whether the release-readiness material should become a separate top-level page, or a collapsed/segmented section within the same workbench.
- Whether the repeated sidebar sections are a pure render bug or an intentional stacked pattern that should be replaced.
- Whether the right rail should remain sticky on large screens if the page becomes less vertically dense.

Chosen smallest approach
- Keep the current three-column shell and product order, but make the release-readiness/package area a clearly separated module.
- Collapse repeated sidebar content into one compact, non-duplicated navigation/source rail.
- Reduce the checklist density by widening the center content area, collapsing secondary rows by default, and removing the over-squeezed table presentation.
- Rewrite the most confusing mixed-language headings into shorter, clearer copy.
- Keep settings and safety visible, but compact.

Files likely affected
- `docs/status/phase-BL1-screenshot-ui-content-fix-spec-2026-06-07.md` (this task)
- Later implementation would likely touch `apps/desktop/src/App.tsx`, `apps/desktop/src/styles.css`, and `apps/desktop/src/App.test.ts` only if the spec is approved.

Verification plan
- Confirm the doc captures the screenshot problems and the intended fix direction.
- Confirm the doc preserves the workbench order and safety boundaries.
- Confirm the doc explicitly states that no live ServiceNow writes, Save/Submit/Update/Resolve/Close automation, or GitHub writes are allowed in this task.
- Confirm the doc includes copy guidance, state logic, accessibility notes, and implementation handoff.

## 1. Purpose

This spec records the smallest high-confidence correction to the BJ6 screenshot issues.

It answers:
1. What is visually broken in the current screen?
2. What should remain stable?
3. What layout and copy changes are needed to make the UI read like a calm operator workbench?
4. What states and button rules should keep the workflow safe and readable?
5. What should the frontend team do next after approval?

Non-goals:
- no live ServiceNow login, browsing, API write, Save / Submit / Update / Resolve / Close
- no attachment upload
- no Microsoft Graph / Excel Web write
- no GitHub push / PR / merge / tag / release changes
- no broad design-system rewrite
- no demo clutter in the primary UI
- no raw sensitive data in the UI or docs

## 2. Screenshot findings to fix

The screenshots indicate these product problems:

1. The left sidebar repeats source/search/queue blocks and feels like a duplicated scroll container.
2. The main release-readiness/checklist area is overcrowded and visually collides with adjacent cards.
3. The three-column work area is too narrow for the dense checklist table.
4. The top release handoff has too many equal-weight actions; the primary path is not obvious.
5. Several headings are too engineering-heavy for a user-facing operator workspace.
6. English and Chinese copy are mixed in a way that makes the product feel inconsistent.
7. Status messages conflict: loading, not scanned, stale, and fresh can all appear together.
8. The long page mixes package-release work with normal Incident work without a clear separation.
9. Some phrases are unclear or unfriendly, especially around `CURRENT=N/A`, archive alias language, and the handoff instruction text.
10. The current density is not comfortable for fast scanning or eye comfort.

## 3. Design direction

Use the existing warm/light shell, but simplify the information architecture.

Design principles:
- one clear source rail on the left
- one clear working surface in the center
- one clear runtime/status rail on the right
- progressive disclosure instead of always-expanded detail
- large, readable controls and calm spacing
- disabled states must say why they are disabled
- safety must be visible but compact
- preserve the workbench order of the ServiceNow flow

Public reference patterns used as direction, not branding:
- Linear-style command center: compact navigation, clear active work, strong status hierarchy
- Claude Code-style work surface: calm desktop layout with visible state and low clutter
- Agent workbench patterns: runtime actions near readiness indicators, not buried in logs
- Open Design command-center guidance: stable zones, no vertical card dump, progressive disclosure

## 4. Layout wireframe in text

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ServiceNow Automation   QA workspace   Safety: compact/visible   [Settings]  [EN / 中文]           │
│ Warm-light operator workbench. AI drafts and fills allowed fields only. Human reviews in ServiceNow.│
├──────────────────────────┬──────────────────────────────────────────────┬───────────────────────────┤
│ LEFT: SOURCE + QUEUE     │ CENTER: WORK PRODUCT                         │ RIGHT: RUNTIME + SAFETY    │
│                          │                                              │                           │
│ Source feed               │ Selected source detail                       │ Start QA Chromium         │
│ Intake queue              │ Cleaned / normalized source                  │ Verify current Incident   │
│ Todo / history            │ Incident draft                               │ Autofill current Incident │
│ Mode/function switching   │ Required/common field preview                │ CDP readiness             │
│ Bottom-left settings      │ Autofill plan                                │ Safety boundary           │
│ Compact search/filter     │ KB / recommendation detail                  │ Environment controls      │
│                          │                                              │ Recent run evidence       │
└──────────────────────────┴──────────────────────────────────────────────┴───────────────────────────┘
```

Behavioral notes:
- The left rail must exist only once; no duplicated stacks of the same navigation blocks.
- The center column should read as the main working surface, not as a tall document dump.
- The right rail should keep the three runtime actions obvious at all times.
- Release-readiness/package handoff content must not visually collide with the normal Incident workbench.

## 5. Column responsibilities

### Left column — source / queue / history / settings
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
- compact search/filter entry point

Rules:
- keep it compact and task-oriented
- avoid demo scenario clutter
- avoid repeating the same navigation stack more than once
- do not show raw URLs, ticket IDs, or customer data

### Center column — work product
Owns the current work artifact.

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
- release-readiness package handoff only as a clearly separated module, not as an overlapping flow

Rules:
- keep the draft and field preview readable at a glance
- collapse secondary detail by default
- keep the main Incident workbench order stable
- keep package/release material separate from the core workbench story

### Right column — runtime + safety
Owns action readiness and operational trust.

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

## 6. Content and copy changes

Replace or simplify confusing headings and phrases.

Recommended replacements:
- `RELEASE READINESS HANDOFF` → `Release readiness`
- `SOURCE OF TRUTH` → `Current package source`
- `CURRENT PACKAGE PATH` → `Current package path`
- `CURRENT PACKAGE SUMMARY` → `Current package summary`
- `LOCAL ACTIONS` → `Actions`
- `MANUAL CHECKLIST` → `Verification checklist`
- `LOCAL REPO HYGIENE + ARCHIVE DEMOTION` → `Local cleanup`
- `WORKTREE ACCEPTANCE` → `Worktree review`
- `Alan should test this file first.` → `Open the current package first and verify it locally.`
- `CURRENT=N/A` → avoid unless the UI also explains why the path is unavailable in plain language
- `No archival aliases found in local release metadata.` → `No archival aliases are marked as current.`

Preferred operator labels:
- `Source feed`
- `Intake queue`
- `Cleaned summary`
- `TicketDraft`
- `Required/common fields`
- `Autofill plan`
- `Runtime actions`
- `Safety boundary`
- `Recent run evidence`

Copy to avoid in the primary UI:
- MockAIProvider
- language simulation wording
- high-severity simulator wording
- Excel dry-run wording that sounds like a write action
- any copy that hints at real submission or service write
- any copy that feels like a release engineering log instead of operator guidance

## 7. State matrix

| State | Left column | Center column | Right column |
|---|---|---|---|
| Empty | Onboarding copy + example source types | Placeholder cards for source, cleaned source, draft, and KB detail | Disabled actions with explanations |
| Loading intake | Selected row highlights; history unchanged | Skeleton source/detail cards | Runtime remains disabled until readiness exists |
| Source selected | Queue row active | Source detail + cleaned summary | Start QA Chromium may enable if settings are valid |
| Draft ready | Queue row active; history may show prior example | TicketDraft and field preview are primary | Verify current Incident becomes the next step |
| Browser ready | Queue row active | Field preview and autofill plan are prominent | Verify current Incident is enabled |
| Page verified | Queue row active | Autofill plan is primary | Autofill current Incident is enabled |
| Release package visible | Current package row active | Package handoff card is present but visually separated | Release-related actions are secondary to the workbench |
| Blocked / error | Queue may still show selection | Blocked panel explains the last safe checkpoint | Disabled buttons show plain-language reasons |

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

## 9. Empty, loading, and error states

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
- do not show conflicting states such as loading and stale at the same time unless the copy explains the transition

### Error states
Explain the safe stop point, not just the failure.

Rules:
- show the exact step that failed
- keep the previous safe state visible
- do not imply ServiceNow changed when it did not
- explain why a button is disabled in plain language

## 10. Accessibility notes

- warm/light theme by default; avoid pure black surfaces
- large touch/click targets, especially on the right runtime rail
- calm contrast and generous spacing for eye comfort
- progressive disclosure instead of always-expanded panels
- readable line length for astigmatism / eye comfort
- disabled reasons must be explicit and readable
- preserve keyboard navigation and visible focus states in settings and runtime controls
- keep the three-column shell obvious at a glance
- make the release-readiness/package module visually distinct from the normal workbench

## 11. GPT Images 2 mockup notes

Attempted sanitized mockup generation with `image_generate` using fake/demo data only.

Result:
- the backend returned `FalClientHTTPError`
- no usable raster mockup was produced in this run

If a later run gets a working image backend, generate:
- one landscape three-column cockpit concept
- one tighter right-rail/runtime concept
- one version showing the release-readiness module separated from the normal workbench

## 12. Implementation handoff for `sna-frontend-workbench`

If this spec is implemented in frontend code, keep the change set surgical and preserve the accepted order.

Implementation requirements:
1. Preserve the current local-only safety model.
2. Keep settings first-class and visible.
3. Keep the left / center / right responsibilities stable.
4. Keep the workbench order stable: selected source detail -> cleaned summary -> Incident draft -> guided demo path -> local KB recommendations -> monthly Excel fill queue.
5. Separate release-readiness/package handoff from the main workbench instead of letting the two flows overlap.
6. Remove repeated sidebar sections or convert them to a single compact navigation/source rail.
7. Keep the what-changed / guidance copy compact.
8. Keep disabled button reasons plain-language and visible.
9. Keep KB recommendations visible.
10. Do not reintroduce demo clutter, mock-provider labels, or always-open debug surfaces.
11. Verify with the normal gates before asking for Alan approval.

Suggested implementation files, if needed later:
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

## 13. Acceptance criteria

This spec is ready for frontend implementation only when all of the following are true:
- the app presents a warm/light three-column operator workbench
- the left column owns source, queue, todo, history, mode/function switching, and bottom-left settings
- the center column owns selected source detail, cleaned source, TicketDraft, field preview, autofill plan, and KB/recommendation detail
- the right column owns runtime actions, CDP readiness, safety boundary, environment controls, and recent evidence
- the release-readiness/package content is clearly separated and does not visually collide with the incident workbench
- repeated sidebar blocks are removed or condensed into one compact rail
- Start QA Chromium is visible and clearly labeled
- Verify current Incident is visibly gated by readiness
- Autofill current Incident is visibly gated by verification and safe-field rules
- disabled buttons explain why they are disabled
- settings remain first-class and editable for QA URL, Dev URL, Production URL, and default environment
- no real URLs, ticket IDs, sys_ids, credentials, cookies, screenshots, logs, or raw fingerprints are exposed
- no Save / Submit / Update / Resolve / Close automation is introduced
- no mock/demo clutter reappears in the primary UI
