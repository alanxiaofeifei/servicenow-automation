# Operator Workbench v2 No-Demo Spec

Status: design handoff only — no frontend implementation in K6R.
Audience: Alan for concept approval, then `sna-frontend-workbench` for implementation.
Privacy level: sanitized. All examples are fake. Do not include real ServiceNow URLs/hosts, ticket IDs, record identifier values, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, or customer data.

## 0. Goal

Replace the rejected K6 UI with a real ServiceNow Automation desktop Operator Workbench.

The v2 direction must feel like an operator tool, not a demo playground:

- Three stable zones: left source/history, center current work product, right runtime actions.
- Warm/light theme by default for eye comfort and astigmatism/afterimage reduction.
- Top toolbar is large, readable, and status-rich.
- Runtime rail is strong enough that Alan can immediately see how to start QA Chromium, verify, and autofill.
- Settings are first-class: top Settings button, bottom-left Settings entry, and a dedicated settings panel.
- No mode switching, no language simulation, no Excel dry-run, no high-severity simulator, no mock provider labels, no demo scenario strip, no vertical card dump.

Non-goals for K6R:

- No React/Electron implementation.
- No real browser automation.
- No real ServiceNow data or screenshots.
- No new large design system.
- No Save, Submit, Update, Resolve, Close, ServiceNow API write, or production write action.

## 1. Research and tool notes

### 1.1 Public reference synthesis

The task requested official/public research for Codex App command-center layout and Claude Code desktop/work workflows. In this worker session, no web-search tool was exposed. The `anysearch` skill was loaded, but no terminal/CLI execution tool was available to run its public-search client. Therefore, no external web query was sent and no official page content was fetched.

The information architecture below is a conservative synthesis of the requested public reference categories and the existing project/product guardrails:

- Codex-style command center principle: keep navigation/context separate from active work and execution status. Translate to left rail + center workspace + right runtime rail.
- Claude Code-style workbench principle: preserve project/task context while keeping the current artifact in focus. Translate to a wide center source-to-Incident workspace with side panels for history and actions.
- Antigravity manager/editor/artifact principle: separate manager state, editor state, and artifacts/results. Translate to left source/history manager, center TicketDraft editor/artifact, right runtime/evidence inspector.
- Modern agent workbench principle: show tool readiness and blocked reasons near action buttons, not hidden in logs. Translate to disabled helper text directly under Verify/Autofill.
- Three-pane productivity principle: stable list, focused detail, and inspector/action panel. Translate to fixed left list, center selected detail, sticky right rail.

Follow-up before implementation if Alan requires strict official-source evidence: run a small public web research task with a web-capable worker, then append exact public-source notes here. Do not delay the v2 concept decision if Alan is comfortable approving from the synthesized IA.

### 1.2 OpenDesign notes

OpenDesign MCP was available and used.

- Project created: `sna-operator-workbench-v2`
- OpenDesign brief: warm-light desktop prototype, three alternatives, fake sanitized data only, no write actions, no raw URLs/tickets/logs/screenshots/fingerprints.
- Generated artifact identifier returned by OpenDesign: `operator-workbench-concepts`
- Saved OpenDesign project file: `operator-workbench-v2-concept-board.html`
- Useful output: reinforced a three-pane concept board with Concept A command center, Concept B productivity workbench, Concept C operator cockpit.
- Source-of-truth note: use this markdown spec for implementation decisions; the OpenDesign board is a visual aid only.

### 1.3 GPT Images 2 / image_gen attempts

The task requested at least three GPT Images 2 mockups or visual concepts. Four sanitized image generation attempts were made with the required directions, but the image backend returned `FalClientHTTPError` with an empty error message each time. No raster mockup image was successfully generated in this run.

Prompts retained for a later image-capable rerun:

1. Concept A — Codex-style command center:
   - Warm light desktop application UI, ServiceNow Automation Workbench, left rail with source history and bottom settings, center current intake text and Incident draft fields, right rail with Start QA Chromium / Verify / Autofill / CDP status / safety lock, clean enterprise SaaS, large readable toolbar, no dark theme, no mock labels, no demo clutter, fake sanitized data only.
2. Concept B — Claude Code-style desktop workbench:
   - Warm light desktop workbench inspired by desktop productivity layout, left recent work/settings, center source-to-ticket transformation, right runtime inspector, calm beige/off-white palette, large readable typography, no mode tabs, no demo playground, fake data only.
3. Concept C — minimal Service Desk operator cockpit:
   - Minimal Service Desk operator cockpit, top toolbar with app name/environment/target/Settings/safety, left source/history, center Incident Draft and field preview, right three big numbered actions, compact safety boundary, warm light theme, no raw URLs, no mock/demo labels.

For implementation planning, treat the three concepts in Section 2 as the visual concepts until the image backend is restored.

## 2. Three v2 concepts

### Concept A — Command Center

Intent: fast orientation for an operator handling multiple sources.

Structure:

- Top toolbar is prominent and status-heavy.
- Left rail shows source feed, queue, recent drafts, and bottom settings.
- Center uses stacked but compact work cards: selected source, cleaned summary, Incident draft, required/common field preview, autofill plan.
- Right rail is a numbered runtime checklist with status and disabled reasons.

Best parts to borrow:

- Strong top bar and status pills.
- Clear separation of source list from current work product.
- Collapsed recent run evidence.

Risk:

- If too dense, it can recreate the crowded K6 feeling. Keep only the current source expanded.

### Concept B — Desktop Workbench

Intent: calm focused editing surface for one source-to-ticket task.

Structure:

- Top toolbar is quieter but still large.
- Left rail is mostly recent work and source history.
- Center is dominant, like a document/editor workspace.
- Right rail behaves like an inspector: runtime actions, CDP readiness, safety, evidence.

Best parts to borrow:

- Most comfortable center reading/editing experience.
- Good for astigmatism because it reduces visual competition.
- Natural place for progressive disclosure below the draft.

Risk:

- Runtime controls can feel secondary unless the right rail is visually strong.

### Concept C — Minimal Service Desk Operator Cockpit

Intent: make P0 manual acceptance obvious: start browser, verify, autofill allowed fields.

Structure:

- Top toolbar has app identity, environment, target status, Settings, and safety in one row.
- Left rail is a compact operational map: source feed, intake queue, recent drafts, history, bottom settings.
- Center is a single selected source-to-Incident workspace.
- Right rail has three large numbered action buttons with CDP/safety/evidence below.

Best parts to borrow:

- Strongest runtime rail.
- Least demo clutter.
- Easiest for Alan to manually judge: “does this feel like a tool?”
- Best match for acceptance: Start QA Chromium visible, Verify disabled until CDP ready, Autofill gated after verify.

Risk:

- Needs enough center detail to avoid feeling like a launcher only.

### Recommendation

Choose Concept C as the implementation baseline, with two borrowed elements:

- From Concept A: a strong top command/status bar.
- From Concept B: a calm center editing surface with large type and low visual noise.

Reason: Alan rejected demo clutter and weak runtime affordances. Concept C directly optimizes for the P0 flow and makes runtime readiness impossible to miss.

## 3. Layout wireframe in text

Desktop target: 1366px+ Electron window, ideal design canvas 1440x900.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ServiceNow Automation        Env: QA      Target: Configured      [Settings]  Safety: Locked │
│ AI drafts and fills allowed fields only. Human reviews and submits manually.                 │
├──────────────────┬──────────────────────────────────────────────┬────────────────────────────┤
│ LEFT SOURCE RAIL │ CENTER WORKSPACE                             │ RIGHT RUNTIME RAIL         │
│ 280-320px        │ fluid / min 640px                             │ 340-380px                  │
│                  │                                              │                            │
│ Source status    │ Selected source                               │ 1. Start QA Chromium       │
│ - Source ready   │ - Source A / sanitized intake                  │ [large primary button]     │
│ - Add/paste      │ - received time / channel / state              │ Status: not started        │
│                  │                                              │                            │
│ Intake queue     │ Cleaned summary                               │ 2. Verify current Incident │
│ - Source A       │ - normalized symptom/facts                     │ [large button disabled]    │
│ - Source B       │ - missing info                                │ Reason: CDP not ready      │
│ - Source C       │                                              │                            │
│                  │ Incident draft                                │ 3. Autofill current Incident│
│ Recent drafts    │ - Short description                            │ [large button disabled]    │
│ - Draft ready    │ - Description                                  │ Reason: verify first       │
│ - Needs review   │ - Work notes                                   │                            │
│                  │ - Category / Subcategory                       │ CDP readiness              │
│ Todo             │ - Assignment / Impact / Urgency                │ - Browser: waiting         │
│ - Review source  │                                              │ - Endpoint: not ready      │
│ - Confirm fields │ Field preview                                  │ - Current form: unverified │
│                  │ - Required/common fields table                 │                            │
│ History          │ - Ready / Needs review / Skipped               │ Safety boundary            │
│ - Last 3 events  │                                              │ - No final write actions   │
│                  │ Autofill plan                                  │ - Manual login only        │
│ Bottom settings  │ - allowed text fields                          │ - Credentials not stored   │
│ [Settings]       │ - skipped fields + reasons                     │                            │
│                  │                                              │ Recent run evidence        │
│                  │ Collapsed: KB recommendation / templates       │ - sanitized summary only   │
└──────────────────┴──────────────────────────────────────────────┴────────────────────────────┘
```

Grid guidance:

```css
.operator-workbench-v2 {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(640px, 2.2fr) minmax(340px, 1fr);
  gap: 16px;
  min-height: calc(100vh - 96px);
}
```

Responsive fallback:

- 1200-1365px: keep three columns, reduce left/right padding, center scrolls internally.
- 960-1199px: left rail collapses to drawer; center/right remain split.
- <960px: stack sections in order Source, Draft, Runtime, Settings. Use sticky section switcher only for responsive fallback, not desktop mode switching.

## 4. Column responsibilities

### 4.1 Top toolbar

Owns app identity and global safety/status.

Must include:

- Product name: `ServiceNow Automation`
- Current environment: Mock / QA / Dev / Production Shadow
- Target status: Missing / Configured / Invalid / Redacted
- Primary Settings button
- Compact safety badge: `Autofill only · Human submit`
- One-line safety copy below or within toolbar: `AI drafts and fills allowed fields only. Human reviews and submits manually.`

Must not include:

- MockAIProvider label
- Field-trial marketing phrase
- Language selector in the primary toolbar
- Tiny low-contrast status text
- Raw URLs or ticket identifiers

### 4.2 Left rail — source, history, and settings

Primary question answered: “What am I working on, and where are settings?”

Contains:

1. Source/loading information feed
   - `Source ready`, `Loading source...`, `Source paused`, `Source needs review`, `Source error`.
   - CTA: `Paste or load source`.
   - No live Teams/mailbox/Chat polling controls in v2 primary UI.
2. Intake queue
   - Fake/sanitized source cards during local development.
   - Production wording should say `Source A`, `Source B`, `Manual paste`, or `Loaded source`, not `Demo scenario`.
   - Large card hit area, clear selected state.
3. Recent drafts
   - Draft ready / needs review / blocked.
4. Todo
   - Review source, review required fields, open QA browser, verify current Incident, review autofill plan.
   - No submit/save/update/close task.
5. History
   - Last three sanitized source/runtime events; collapsed expansion for more.
6. Bottom-left Settings
   - Always visible at bottom of rail.
   - Label: `Settings` with gear icon.
   - Secondary text: `URLs · default env · display`.

Must not contain:

- Runtime action buttons.
- Full raw source text.
- Mode/function switcher.
- Language simulation controls.
- Demo scenario strip.

### 4.3 Center workspace — selected source and Incident work product

Primary question answered: “What will be drafted and filled?”

Contains:

1. Selected source detail
   - Source label, channel, received age, status.
   - Sanitized original source text, readable and not cramped.
2. Cleaned/normalized summary
   - What the tool extracted.
   - Missing info and assumptions.
   - `What changed?` collapsed by default.
3. Generated TicketDraft
   - Editable text fields: Short description, Description, Work notes.
   - Read-only preview for non-text fields until a later reviewed slice approves control-specific filling.
4. ServiceNow required/common field preview
   - Compact table: field, planned value status, source, needs human review.
   - No mock ServiceNow form chrome.
5. Autofill plan
   - Allowed fields: text-only first unless a later slice approves more.
   - Skipped fields with reason.
   - Final line: `Autofill stops after allowed fields. Human submits manually.`
6. Collapsed secondary details
   - KB/recommendation detail when selected.
   - Template details.
   - Normalization diff.

Must not contain:

- Start/Verify/Autofill primary buttons.
- Mock ServiceNow preview.
- Excel dry-run row.
- High severity simulator.
- Long repeated safety essay.

### 4.4 Right rail — runtime actions, safety, and evidence

Primary question answered: “What can I safely do now, and why is it locked?”

Contains:

1. Runtime action stack
   - `1 Start QA Chromium`
   - `2 Verify current Incident`
   - `3 Autofill current Incident`
   - Each button is 44px+ tall, full rail width, with status/helper text directly below.
2. CDP readiness
   - Browser launch status.
   - Endpoint readiness status.
   - Current Incident verification status.
   - Verified fingerprint state shown only as safe status, never raw fingerprint.
3. Templates/settings quick access
   - Collapsed by default.
   - Link: `Open Settings`.
4. Compact safety boundary
   - `Autofill allowed fields only. No Save, Submit, Update, Resolve, Close, API writes, or production writes.`
   - `Manual login only. Credentials are never stored.`
5. Environment controls
   - QA, Dev, Production Shadow visible.
   - Mock/developer fixtures hidden behind developer-only surface, not primary operator UI.
   - Production Shadow locks Autofill.
6. Recent run evidence
   - Last action, safe status, relative time.
   - Expand for sanitized evidence summary only.
   - Never show raw log text, raw URL, host, ticket ID, page fingerprint, screenshot, HAR, trace, session, or cookie.

Must not contain:

- Full source text.
- Editable long draft fields.
- Final write action buttons.

## 5. State matrix

| State | Top toolbar | Left rail | Center workspace | Right rail | Primary copy |
|---|---|---|---|---|---|
| First launch | Env default shown; target may be missing | Empty source list + Settings visible | Warm empty card | Start disabled if target missing; Verify/Autofill disabled | `Configure a target or load a source to begin.` |
| Target missing | `Target: Missing` amber | Todo shows configure target | Draft area available only for local source review | Start disabled | `Start QA Chromium disabled: configure QA or Dev URL in Settings.` |
| Target configured | `Target: Configured` | Source list active | Source/draft area ready | Start enabled for QA/Dev | `Ready to launch a dedicated QA browser.` |
| Source loading | Status: loading | Skeleton source rows | Skeleton source detail | Runtime unchanged | `Loading sanitized source...` |
| Source selected | Stable status | Selected source highlighted | Source detail + cleaned summary visible | Start depends on target | `Review the source and draft before runtime actions.` |
| Draft ready | Safety badge unchanged | Todo marks draft review | TicketDraft + field preview visible | Verify/Autofill still gated | `Draft ready for human review.` |
| Missing required review | Safety badge unchanged | Todo shows missing review | Missing info callout above draft | Autofill disabled | `Autofill locked: review required fields first.` |
| QA selected, browser not started | Env: QA | Todo: start browser | Draft remains editable | Start enabled; Verify/Autofill disabled | `Start dedicated QA Chromium before verification.` |
| Browser launching | Env: QA, busy | No layout shift | Center remains stable | Start busy; Verify disabled | `Launching dedicated browser...` |
| CDP connecting | Env: QA | History records safe event | Center unchanged | CDP amber; Verify disabled | `Waiting for browser readiness.` |
| CDP ready, not verified | Env: QA | Todo: verify current Incident | Field preview not updated from page yet | Verify enabled; Autofill disabled | `Verify current Incident before autofill.` |
| Verify running | Env: QA, busy | History pending | Verification status skeleton | Verify busy; Autofill disabled | `Read-only verification in progress.` |
| Verify success | Safety badge unchanged | Todo marks runtime verified | Field preview updates with safe statuses | Autofill enabled only if plan safe | `Current Incident verified. Review autofill plan.` |
| Verify blocked | No raw target shown | History safe blocked event | Draft unchanged | Verify blocked reason visible; Autofill disabled | `Verification blocked: open an Incident form in the dedicated QA browser.` |
| Autofill ready | Safety badge unchanged | Todo: final review | Autofill plan visible | Autofill enabled | `Autofill will populate allowed fields only.` |
| Autofill running | Busy | No jump | Fields being filled show read-only overlay | Autofill busy | `Autofilling allowed fields...` |
| Autofill success | Safety badge unchanged | History records safe success | Filled-field summary visible | Evidence updates | `Allowed fields were filled. Review and submit manually if appropriate.` |
| Runtime error | Status safe | History safe error | Draft unaffected | Error card + retry action | `Runtime action failed safely. No final write was attempted.` |
| Dev environment | Env: Dev | Source/draft same | Draft same | Runtime enabled with dev warning | `Dev target selected. Verify before autofill.` |
| Production Shadow | Env: Production Shadow locked | Source review allowed | Draft comparison allowed | Autofill disabled | `Production Shadow is comparison-only. No production writes are available.` |

## 6. Empty, loading, and error states

### Empty states

- No source:
  - Title: `No source selected`
  - Body: `Paste or load a sanitized source to start a draft.`
  - CTA: `Paste source`
  - Secondary: `Settings are available in the left rail and top bar.`
- No target configured:
  - Title: `Target not configured`
  - Body: `Add QA or Dev URL in Settings before starting a dedicated browser.`
  - CTA: `Open Settings`
- No recent evidence:
  - Title: `No runtime evidence yet`
  - Body: `Run evidence appears after Start, Verify, or Autofill. Evidence is sanitized.`

### Loading states

- Source loading: 2-3 warm skeleton rows; no rapid shimmer.
- Browser launching: Start button busy, right rail shows `Launching dedicated browser...`.
- CDP connecting: readiness stepper amber, Verify disabled with reason.
- Verify running: right rail busy; center field preview may show `Inspecting current form read-only...`.
- Autofill running: center overlay only on allowed fields; right rail action busy.

### Error states

- Target invalid:
  - `Target blocked: open Settings and use a QA or Dev landing URL without query, hash, credentials, or record deep link.`
- Browser failed to launch:
  - `Browser launch blocked safely. Check the sanitized startup diagnostic and retry.`
- CDP not ready:
  - `CDP not ready. Keep the dedicated browser open and wait, or restart QA Chromium.`
- Verify blocked:
  - `Verification blocked: current page is not a verified QA Incident form.`
- Autofill blocked:
  - `Autofill blocked: verify current Incident first and review the allowed-field plan.`
- Runtime failure:
  - `Runtime action failed safely. No Save, Submit, Update, Resolve, Close, or API write was attempted.`

## 7. Button enable/disable logic

| Control | Enabled when | Disabled reason copy | Notes |
|---|---|---|---|
| Top Settings | Always | Never disabled | Opens settings drawer/panel. |
| Bottom Settings | Always | Never disabled | Same destination as top Settings. |
| Paste/load source | Always in local/manual mode | `Source loading is already in progress.` | No live external polling in v2 primary UI. |
| Start QA Chromium | Env is QA or Dev; target configured and valid; no runtime action busy | `Configure a QA or Dev target in Settings before launching.` / `Another runtime action is running.` | Must visibly open dedicated browser; do not claim ready from process spawn alone. |
| Verify current Incident | CDP ready; env QA/Dev; no busy action | `Start QA Chromium and wait for CDP ready first.` / `Select QA or Dev mode to verify.` | Verify-only; no fill/write. |
| Autofill current Incident | Env QA/Dev; CDP ready; prior verify success; current verified fingerprint/state fresh; draft and allowed-field plan safe; no busy action | `Verify current Incident first.` / `Review required fields before autofill.` / `Production Shadow is comparison-only.` | Autofill only allowed fields; never Save/Submit/Update/Resolve/Close. |
| Clear saved settings | Settings open; at least one saved setting exists | `No saved settings to clear.` | Use confirmation if destructive. |
| Default environment selector | Settings open; not busy | `Runtime action running; wait before changing environment.` | Changing env invalidates verify/autofill readiness. |
| Template preset | Settings open; not busy | `Runtime action running; wait before changing templates.` | Keep collapsed by default in main rail. |
| Evidence expand | Evidence exists | `No runtime evidence yet.` | Sanitized summary only. |

Implementation rule: disabled buttons must have visible helper text next to the button, not only a tooltip.

## 8. Main components

Keep component count small. Do not build a large design system.

### Shell

- `OperatorWorkbenchV2Shell`
  - Owns top toolbar and three-column grid.
  - Receives existing app/runtime state; avoid new domain architecture.
- `WorkbenchTopBar`
  - App name, environment, target status, Settings, compact safety badge.
- `WorkbenchCard`
  - Minimal shared card surface: warm background, border, radius, heading.

### Left rail

- `SourceStatusCard`
- `IntakeQueueRail`
- `RecentDraftsCard`
- `OperatorTodoCard`
- `HistoryMiniCard`
- `BottomSettingsEntry`

### Center workspace

- `SelectedSourceCard`
- `CleanedSummaryCard`
- `TicketDraftEditor`
- `IncidentFieldPreviewCard`
- `AutofillPlanCard`
- `CollapsedRecommendationDetail`

### Right rail

- `RuntimeActionRail`
- `RuntimeActionButton`
- `CdpReadinessStepper`
- `CompactSafetyBoundaryCard`
- `EnvironmentMiniControl`
- `RecentRunEvidenceCard`
- `SettingsDrawerLink`

### Settings

- `SettingsDrawer` or `SettingsPanel`
- `EnvironmentUrlSettings`
  - QA URL input
  - Dev URL input
  - Production URL input
  - Default environment selector
  - Clear saved settings
- `DisplaySettings`
  - Zoom/density
  - Warm light default
- `SafetySettingsCopy`
  - Compact notes only

## 9. Copy text

### Top toolbar

- Product: `ServiceNow Automation`
- Environment pill: `QA` / `Dev` / `Production Shadow` / `Mock fixture hidden`
- Target status:
  - `Target: configured`
  - `Target: missing`
  - `Target: invalid`
  - `Target: redacted`
- Settings button: `Settings`
- Safety badge: `Autofill only · Human submit`
- Safety line: `AI drafts and fills allowed fields only. Human reviews and submits manually.`

### Left rail

- Source feed title: `Sources`
- Empty: `No source selected`
- CTA: `Paste or load source`
- Queue title: `Intake queue`
- Recent title: `Recent drafts`
- Todo title: `Operator todo`
- History title: `History`
- Bottom settings: `Settings` / `URLs · default env · display`

### Center

- `Selected source`
- `Cleaned summary`
- `Incident draft`
- `Required/common fields`
- `Autofill plan`
- `Allowed fields`
- `Skipped fields`
- `Human review required`
- `Autofill stops after allowed fields. Human submits manually.`

### Right rail

- `1 Start QA Chromium`
- `2 Verify current Incident`
- `3 Autofill current Incident`
- `CDP readiness`
- `Safety lock`
- `Recent run evidence`
- `Sanitized status only`
- `Manual login required. Credentials are never stored.`
- `No Save, Submit, Update, Resolve, Close, API writes, or production writes.`

### Settings

- `Environment URLs`
- `QA URL`
- `Dev URL`
- `Production URL`
- `Default environment`
- `Clear saved settings`
- `Full URLs are visible only here. Main UI and logs show configured/missing/redacted status.`
- `Use safe landing URLs only. Record links, query strings, hashes, credentials, tokens, sessions, and cookies are blocked.`

## 10. Accessibility and eye-comfort notes

- Default theme: warm paper background, warm white cards, muted borders. Avoid pure black backgrounds and white-on-black text.
- Body text target: 15-17px minimum; primary toolbar/status text 15px+; headings 20-28px.
- Minimum hit target: 44px height for buttons and selectable queue cards.
- Use clear focus rings with warm blue outline; do not rely on color alone.
- Muted text must still be readable; avoid pale beige on beige.
- Use line length control in center source/draft text areas.
- Prefer low shadows and borders over high-contrast blocks.
- Avoid constant animations. Loading skeletons should be subtle.
- Disabled states need visible reason text, not just greyed-out opacity.
- Use tabular numbers for counts/status timestamps.
- Keep right rail sticky so runtime controls remain visible without scrolling.
- Default collapse secondary sections: KB detail, evidence logs, templates, normalization diff.

## 11. Explicit list of what to remove from primary `App.tsx` UI

This is a design handoff list, not approval to implement before Alan selects a concept.

Remove or hide behind developer-only fixtures:

1. `MockAIProvider` visible label in the header/mode pill.
2. `Field-trial accelerated P0` marketing eyebrow.
3. `LanguageSelector`, language simulation notice, and multi-language demo controls from the primary operator toolbar/surface.
4. `HighSeverityMonitorSimulator` from the primary UI.
5. `Demo scenarios` / `scenario-bar` / `demoManualPasteScenarios` selector from the primary UI.
6. `DemoQueuePanel` wording that says demo; keep a source queue, but rename to operator source/intake queue and remove scenario feel.
7. `ServiceDeskWorkflowPanel` Excel dry-run row preview from the primary UI.
8. `buildExcelDryRunWorkbookArtifact`, Excel row download/copy UI, and workbook metadata copy from the primary UI path.
9. `MockServiceNowForm` from the primary UI. Replace with compact `ServiceNow required/common field preview` and `Autofill plan`.
10. Mock ServiceNow action bar/buttons, even disabled, from the primary UI. Do not show Save/Submit/Update/Resolve/Close-like form actions as mock controls.
11. Stage strip / mode tabs such as `Queue → Source Review → TicketDraft` as a navigation concept. Use the three-column layout instead.
12. Long repeated demo-only warning/safety essays. Replace with compact top safety badge and right safety boundary.
13. `ControlledQaSingleTicketSmokePanel` as an always-visible primary panel. If still needed for later manual-fill planning, move behind a developer/review fixture or collapsed settings/debug area.
14. Any copy that presents the product as static demo posture rather than real operator workbench.

Keep and elevate:

1. Settings URL behavior and validation. Do not weaken settings.
2. QA URL, Dev URL, Production URL, default environment, clear saved settings.
3. Runtime handlers and safety gates for Start QA Chromium, Verify current Incident, and Autofill current Incident.
4. Disabled reason logic for Verify and Autofill.
5. Sanitized runtime status/evidence behavior.
6. TicketDraft editing for Short description, Description, and Work notes.
7. Required/common field planning, but as a compact field preview, not as a mock form.

## 12. Implementation handoff for `sna-frontend-workbench`

Do not implement until Alan picks or rejects the v2 concept.

Recommended implementation slice after approval:

1. Files likely affected:
   - `apps/desktop/src/App.tsx`
   - `apps/desktop/src/styles.css`
   - `apps/desktop/src/App.test.ts`
2. Smallest approach:
   - Replace the current vertical `workspace` composition with `OperatorWorkbenchV2Shell`.
   - Reuse existing state/functions for source queue, draft, settings, runtime actions, and environment URL validation.
   - Move runtime action panel into the right rail and make it visually dominant.
   - Move settings entry to both top toolbar and bottom-left rail; preserve settings drawer behavior.
   - Remove primary demo clutter listed in Section 11.
3. Do not touch runtime packages unless implementation proves impossible without a tiny interface adjustment.
4. Do not change safety semantics:
   - Verify remains read-only.
   - Autofill remains separate from Verify.
   - Autofill remains gated by environment/CDP/verify/freshness/plan readiness.
   - No final write actions are added.
5. Required tests after implementation:
   - Top toolbar renders app name, environment, target status, Settings, safety badge.
   - Three primary columns render at desktop width.
   - Left rail includes bottom Settings.
   - No primary UI text contains `MockAIProvider`, `Field-trial accelerated P0`, `Language simulation`, `Excel dry-run`, `High Severity Monitor Simulator`, or `Mock ServiceNow`.
   - Start QA Chromium is visible in the right rail.
   - Verify disabled reason appears before CDP ready.
   - Autofill disabled reason appears before Verify success.
   - Settings include QA URL, Dev URL, Production URL, default environment, clear saved settings.
6. Manual acceptance after implementation:
   - Windows double-click opens app.
   - Three-column warm-light workbench is visible.
   - Start QA Chromium visibly launches a dedicated browser.
   - CDP readiness appears only after readiness is proven.
   - Verify current Incident enables only after CDP readiness.
   - Verify-only does not mutate fields.
   - Autofill remains gated and does not Save/Submit/Update/Resolve/Close.

## 13. Privacy and safety checklist

- No real ServiceNow screenshots or copied UI captures.
- No raw ServiceNow URL/host/ticket/record identifier/fingerprint/log/session/HAR/trace/cookie/credential/customer data.
- Main UI shows configured/missing/redacted target status only.
- Full URL strings are visible only inside Settings inputs.
- Logs/comments/evidence stay sanitized.
- Production Shadow is read-only/comparison-only.
- No state-changing ServiceNow write action exists in the UI.

## 14. Sanitized approval-choice guidance

Record approval decisions only as generic, sanitized status summaries.

- Do not persist exact approval phrases or option wording in repository docs.
- Refer to choices using neutral labels such as approved baseline, alternate direction, another design pass, or deferred decision.
- Keep any human approval source outside the repository and sanitize release notes before committing.
