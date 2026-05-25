# Operator Workbench v2 Target Image Spec

Status: design handoff only — no frontend implementation in this task.
Audience: `sna-frontend-workbench` implementer after Alan accepts this text spec.
Source of truth: this sanitized text spec plus `docs/design/target-ui-v2-design-tokens.json`; screenshot artifacts are not tracked.
Privacy level: sanitized. All example content below is fake. Do not include real ServiceNow URLs/hosts, ticket IDs, record identifier values, fingerprints, screenshots, logs, cookies, sessions, HAR, traces, credentials, customer names, or customer data.

## 1. Visual target summary

The target spec is a calm warm-light desktop app shell for ServiceNow Automation. It should feel like a compact Codex/Claude-Code-style command center, not a ServiceNow demo page and not a long marketing/dashboard scroll.

Visible target qualities:

- Full-width top bar with product identity on the left and global status controls on the right.
- Narrow far-left icon rail for high-level app areas.
- Wider left workbench sidebar for feature navigation, a single in-nav Settings entry, search, and grouped ticket/source list.
- Large center workspace for the selected source, cleaned summary, and Incident draft.
- Right runtime rail dedicated to Start QA Chromium, Verify current Incident, Autofill current Incident, runtime status, and compact safety copy.
- Warm off-white page background, white/warm-white cards, subtle borders, soft shadows, rounded corners, and generous whitespace.
- Minimal text density: each card explains one job; no always-expanded essays.
- Green status chips for configured/sanitized/ready/verified states.
- Amber status chips or surfaces for QA environment, selected source highlight, draft state, and safety notice.
- No raw sensitive values visible in the primary UI.

Primary image-read acceptance target:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ [green app icon] ServiceNow Automation                 [QA Environment] [Target configured] [EN / 中文] │
├────────────┬──────────────────────────┬─────────────────────────────────────┬────────────────────────┤
│ ICON RAIL  │ LEFT WORKBENCH SIDEBAR   │ CENTER WORKSPACE                    │ RIGHT RUNTIME RAIL     │
│            │                          │                                     │                        │
│ Inbox      │ Workbench                │ Selected source                     │ Runtime actions        │
│ Workbench* │ Knowledge                │ VPN connection issue after reset     │ 1 Start QA Chromium    │
│            │ History                  │ Teams message · New · 08:15 · EN    │   CDP ready            │
│            │ Search                   │                                     │                        │
│            │ Settings                 │                                     │                        │
│            │                          │ Cleaned summary                     │ 2 Verify current       │
│            │ Search tickets... Ctrl+K │ Issue / Impact / Context            │   Incident · Verified  │
│            │                          │ Sanitized                           │                        │
│            │ Today                    │                                     │ 3 Autofill current     │
│            │ > VPN connection issue   │ Incident draft                      │   Incident · Ready     │
│            │   Laptop slow            │ Short description                    │                        │
│            │   Email not syncing      │ Description                         │ Runtime status         │
│            │   Shared drive issue     │ Work notes                          │ Sanitized mode         │
│            │ Yesterday                │                                     │ CDP connected · good   │
│            │   License request        │ [Draft] [Save draft] [Prepare draft]│                        │
│            │   Printer offline        │                                     │ Safety note            │
│            │                          │                                     │ Human reviews/submits  │
└────────────┴──────────────────────────┴─────────────────────────────────────┴────────────────────────┘
```

Notes about the image:

- The top bar language selector is visible as `EN / 中文` in the top-right.
- Settings appears only as a single entry inside the expanded left sidebar navigation, not below the Today/Yesterday source list.
- The center draft card in the image says `Create draft`; implementation should prefer `Prepare draft` or `Save local draft` unless the product can guarantee that `Create draft` cannot be confused with ServiceNow submit/update behavior.
- The right rail is not debug output. It is a safe runtime-control surface with summarized states only.

## 2. Hard layout requirements

Desktop shell:

- Use a true app shell with `height: 100vh` or `min-height: 100vh` and fixed top bar.
- In normal 1440x900+ desktop usage, avoid body-level long vertical scroll.
- The main area must use CSS grid or an equivalent stable desktop layout.
- Cards/columns may scroll internally only when content exceeds available height.
- Do not let the center workspace collapse into a narrow vertical card dump on normal desktop windows.
- Keep right runtime actions visible without requiring the operator to scroll the full page.

Recommended desktop measurements:

```text
Top bar:          64px high
Outer padding:    16px to 20px
Main gap:         16px
Icon rail:        72px to 88px
Left sidebar:     280px to 320px
Center workspace: minmax(520px, 1fr), ideally 620px+
Right rail:       320px to 360px, target 340px
Card radius:      14px to 18px
Button height:    44px minimum, 48px preferred for runtime actions
```

Recommended grid:

```css
.operator-workbench-v2-shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 64px 1fr;
  background: #f7f2e8;
}

.operator-workbench-v2-main {
  display: grid;
  grid-template-columns: 80px 300px minmax(520px, 1fr) 340px;
  gap: 16px;
  padding: 16px;
  min-height: 0;
}
```

If implementation budget requires combining the icon rail and left sidebar, preserve the visual separation inside one left region. The combined left region should remain about 360px to 400px and must still show:

- high-level icon-like navigation,
- workbench feature navigation,
- search,
- grouped item list,
- one in-nav Settings entry.

Responsive guidance:

- 1366px to 1439px: preserve all four visible regions; reduce padding before changing information architecture.
- 1180px to 1365px: keep three operational columns; icon rail may become icon-only and left sidebar may tighten spacing.
- 960px to 1179px: left sidebar may collapse to a drawer; center and right remain split.
- Below 960px: stack sections as Source, Workspace, Runtime, Settings. This is a responsive fallback only; desktop must not use mode tabs.

Accepted K6I5D2R sidebar behavior:

- The left collapse/expand affordance is a small fixed double-chevron tab on the far-left window edge.
- Operators can drag the tab vertically to choose a comfortable position; click still toggles the sidebar.
- Dragging must not accidentally toggle the sidebar.
- Expanded state hides the empty icon rail so the shell does not reserve a large blank strip.
- Collapsed state keeps only a compact functional rail, not a wide blank left panel.

## 3. Top bar requirements

Top-left:

- App icon: small rounded green square. Use a generic automation/workbench mark, not copied ServiceNow branding.
- Product title: `ServiceNow Automation`.
- Keep the title short. Do not add marketing subtitles in the top bar.

Top-right chips, in this order:

1. Environment chip:
   - `QA Environment`
   - `Dev Environment`
   - `Production Environment` or safer `Production Shadow` when writes/fill are locked.
   - Include an icon only if it remains legible at small size.
   - Use amber/warm styling for QA and non-production attention.
2. Target chip:
   - `Target configured`
   - `Target missing`
   - `Target invalid`
   - `Target redacted`
   - Use green only when configured and safe.
3. Language selector:
   - Visible copy: `EN / 中文`.
   - Include globe icon and dropdown chevron if available.
   - Placement is top-right global bar, not the Settings row and not inside the left source list.

Top bar must not include:

- Settings button.
- `MockAIProvider`.
- `Field-trial accelerated P0`.
- Long safety slogans.
- Language simulation wording.
- Raw URL, host, ticket, record identifier, CDP endpoint, fingerprint, browser profile path, or log text.

Top bar interaction notes:

- Environment chip may open a compact selector or link to Settings, but full URL editing belongs only in Settings.
- Target chip may open Settings when missing/invalid, but it must still not reveal raw URLs in the main UI.
- Language selector changes display language preference only; it must not behave like a demo simulation panel.

## 4. Left sidebar requirements

The left side has two visual layers in the target spec:

1. A narrow far-left icon rail.
2. A wider left workbench sidebar.

Together they should look like a compact command-center navigation area.

### 4.1 Far-left icon rail

Required items:

- `Inbox`
- `Workbench` selected

Design:

- Width: 72px to 88px.
- Icons stacked vertically below the top bar.
- Labels may appear under icons or adjacent if there is room.
- Selected `Workbench` uses a soft warm/amber background and non-color indicator.
- Do not put Settings in the far-left rail if it would duplicate the expanded sidebar navigation Settings entry.

Optional future icons may exist only if not cluttering the shell. The target spec is intentionally sparse.

### 4.2 Left workbench sidebar

Top feature switch buttons:

- `Workbench`
- `Knowledge`
- `History`
- `Search`

Task body also requires left navigation coverage for `Inbox`, `Workbench`, `Knowledge`, `History`, and `Search`. If `Inbox` lives in the far-left icon rail, tests may assert it anywhere in the left navigation region.

Feature switch design:

- Compact rows with icon + label.
- 44px minimum hit target.
- Selected item highlighted softly.
- No mode tabs such as `Queue / Source Review / TicketDraft`.
- No long explanatory blocks.

Search box:

- Placeholder: `Search tickets...`
- Optional shortcut hint: `Ctrl+K`.
- Search icon on the left.
- Rounded input with clear focus state.
- Search should filter local/sidebar items only; do not imply live querying of real ServiceNow or customer systems.

Grouped list:

- Group labels: `Today`, `Yesterday`.
- Each item is 2 to 3 lines max:
  - title,
  - source type,
  - time and/or status chip.
- Selected item has soft amber background, border/left accent, and `aria-current` or equivalent state.
- Use fake/sanitized sample titles for local development only:
  - `VPN connection issue after password reset`
  - `Laptop slow after update`
  - `Email not syncing on mobile`
  - `Cannot access shared drive`
  - `Software license request`
  - `Printer offline`
- Source labels can be generic: `Teams message`, `Self-service ticket`, `ServiceNow Chat`, `Shared mailbox`.
- Do not show real requester, email, phone, tenant, channel URL, ticket number, record identifier, asset tag, or device identifier.

Settings placement:

- Exactly one primary `Settings` entry belongs inside the expanded left sidebar navigation, directly with the other navigation rows.
- Label: `Settings`.
- Icon: gear.
- It must not appear below the Today/Yesterday source list or as a separate footer button.
- No duplicate Settings button in the top bar or right rail primary surface.

Remove from left sidebar:

- Long source status essays.
- Separate history text wall.
- Demo queue wording.
- Mode/function switching clutter.
- High-severity simulator controls.
- Language simulation controls.
- Raw logs, URLs, tickets, fingerprints, or screenshots.

## 5. Center workspace requirements

The center workspace is the main work product area. It should be concise and focused, not an all-fields ServiceNow form clone.

Required visible stacked cards:

1. Selected source card.
2. Cleaned summary card.
3. Incident draft card.

Optional secondary sections, collapsed by default:

- ServiceNow required/common field preview.
- Autofill plan.
- KB/recommendation detail when selected.
- Normalization diff / `What changed?`.

### 5.1 Selected source card

Visible target copy:

- Eyebrow/title: `Selected source`.
- Main title: `VPN connection issue after password reset`.
- Metadata row: `Teams message` / `New` / `08:15` / `English`.
- Optional source icon.
- Collapse chevron on the right.

Requirements:

- Keep it compact; this is not a raw-message dump.
- Show only sanitized metadata.
- Do not show raw sender, email, tenant, channel link, message ID, ticket ID, or URL.
- If the card is collapsed, leave enough summary visible for orientation.

### 5.2 Cleaned summary card

Visible target copy:

- Title: `Cleaned summary`.
- Status chip: `Sanitized`.
- Rows:
  - `Issue`: `VPN client cannot connect after a recent password reset.`
  - `Impact`: `User cannot access internal resources while VPN is unavailable.`
  - `Context`: `MFA prompt loops after password reset.`

Requirements:

- Use compact row layout: icon, label, value.
- No long paragraphs.
- No raw sensitive source content.
- Do not expose exact internal app names, account names, network names, IPs, hostnames, or device identifiers.
- Keep `Sanitized` chip visible when source-derived content is shown.

### 5.3 Incident draft card

Visible fields:

- `Short description *`
- `Description *`
- `Work notes`

Draft sample text should remain fake and generic:

- Short description: `VPN connection issue after password reset`.
- Description: a concise 2 to 4 line summary of the issue and impact.
- Work notes: a concise triage note, not a raw log.

Requirements:

- Use compact textarea heights; do not fill the viewport with huge editors.
- Show only the common editable text fields by default.
- Do not show all possible ServiceNow fields expanded.
- Do not render a fake full ServiceNow form chrome.
- Keep field labels readable and required markers clear.
- Secondary field preview should be collapsed or compact below the draft.

Footer actions:

- Left: status pill/dropdown `Draft` with amber dot.
- Right secondary: `Save draft`.
- Right primary: prefer `Prepare draft` or `Save local draft`.
- If implementation keeps image label `Create draft`, add nearby copy clarifying it creates/prepares a local draft only and does not submit/update ServiceNow.

Strict safety requirement:

- No `Save`, `Submit`, `Update`, `Resolve`, or `Close` ServiceNow automation action may appear as a runtime/product button.
- `Save draft` refers only to local/in-app draft persistence unless a later reviewed task explicitly changes this.

## 6. Right runtime rail requirements

The right rail is a runtime action rail, not a debug/log rail. It must answer: what can I safely do now, what is blocked, and why?

Header:

- `Runtime actions`.

Three stacked action cards:

### 6.1 Start QA Chromium

Visible copy:

- Title: `Start QA Chromium`.
- Description: `Open a dedicated QA Chromium profile for this session.`
- Status chip states:
  - `CDP not ready`
  - `Launching`
  - `CDP ready`
  - `Launch blocked`

Requirements:

- Number badge: `1`.
- Large full-width card or button target.
- Enabled only for valid QA/Dev target state and when no conflicting runtime action is busy.
- Must not show raw browser profile path, port, WebSocket URL, endpoint, or launch command.

### 6.2 Verify current Incident

Visible copy:

- Title: `Verify current Incident`.
- Description: `Inspect only field structure and fingerprint the current Incident.`
- Status chip states:
  - `Disabled until CDP ready`
  - `Ready to verify`
  - `Verifying`
  - `Verified`
  - `Blocked safely`

Requirements:

- Number badge: `2`.
- Disabled until CDP ready.
- Verify is read-only.
- Verification result may update field-preview readiness, but it must not fill/write anything.
- Do not show raw page fingerprint. The UI can say `Verified` or `Current Incident verified` only.

### 6.3 Autofill current Incident

Visible copy:

- Title: `Autofill current Incident`.
- Description: `AI drafts and fills allowed fields based on the source content.`
- Status chip states:
  - `Disabled until Verify success`
  - `Ready`
  - `Autofilling`
  - `Filled`
  - `Blocked safely`

Requirements:

- Number badge: `3`.
- Disabled until verify success for the current page/state.
- Enabled only when there is a safe draft and allowed-field plan.
- Autofill is limited to allowed text fields unless a later reviewed task expands scope.
- Do not add any final write action.

Below the action cards:

1. Runtime status card:
   - Title: `Runtime status`.
   - Copy: `Sanitized mode` and `CDP connected · All good` when ready.
   - Use high-level status only.
2. Compact safety note:
   - `AI drafts and fills allowed fields only.`
   - `Human reviews and submits manually.`

Remove from right rail:

- Long bullet essays.
- Raw CDP endpoint.
- Raw URL/host/ticket/record identifier/fingerprint.
- Browser profile path.
- Raw logs or stack traces.
- Repeated safety warnings.
- Full source text.
- Editable draft fields.

## 7. Settings requirements

Settings entry:

- Settings appears only as one `Settings` row inside the expanded left sidebar navigation.
- It must not appear below the Today/Yesterday source list.
- There must be no top-right Settings button.
- There must be no duplicate Settings button in the right rail primary cards.

Settings panel/modal/drawer must include:

- `QA URL` input.
- `Dev URL` input.
- `Production URL` input.
- `Default environment` selector.
- Optional display preferences such as density/zoom if already present.
- Language preference may be mirrored here only as a secondary preference; the primary language selector remains top-right in the global bar.
- `Clear saved settings`.
- Compact safety note.

URL handling:

- Full URLs may be editable only inside Settings.
- Main UI shows `Target configured`, `Target missing`, `Target invalid`, or `Target redacted` only.
- Do not render raw full URLs, raw hosts, record deep links, query strings, hashes, credentials, tokens, cookies, or sessions in the primary UI.
- Do not log raw URL values to Kanban comments, console output, rendered evidence cards, or test snapshots.
- Safe validation copy:
  - `Use QA or Dev landing URLs only.`
  - `Record links, query strings, hashes, credentials, tokens, sessions, and cookies are blocked.`

Settings open behavior:

- Opens as a drawer or modal over the app shell.
- Does not navigate away from the selected source.
- Closing Settings returns the operator to the same source/draft state.
- Changing default environment invalidates stale Verify/Autofill readiness and should explain why.

## 8. Remove/hide from primary UI

Remove from normal product UI:

- `MockAIProvider` visible label.
- `Mock ServiceNow preview`.
- `Field-trial accelerated P0`.
- Language simulation text block.
- High Severity Monitor simulator.
- Excel dry-run evidence.
- Demo queue wording.
- Demo scenario strips/selectors.
- Queue / Source Review / TicketDraft mode tabs.
- Long safety essays.
- Repeated demo-only warnings.
- Raw endpoint/fingerprint text.
- Raw browser profile paths.
- Raw logs/stack traces in primary UI.
- All possible ServiceNow fields expanded by default.
- Any Save / Submit / Update / Resolve / Close automation affordance.

Allowed in primary UI:

- Fake sanitized sample data for local development.
- Compact `Sanitized` chip.
- Compact environment/target status chips.
- Compact safety note:
  - `AI drafts and fills allowed fields only. Human reviews and submits manually.`
- Collapsed sanitized run evidence.
- Collapsed required/common field preview.
- Collapsed autofill plan.

Developer-only/internal fixtures:

- If mock providers, simulators, raw diagnostics, or fixture selectors must remain for development, move them behind a developer-only/debug surface that is not visible in the normal operator workbench and is not part of Alan's acceptance flow.

## 9. Existing behavior that must remain

Do not weaken these behaviors while implementing the target UI:

- Start QA Chromium remains visible and operational.
- CDP ready state remains explicit.
- Verify current Incident remains disabled before CDP ready.
- Verify current Incident becomes enabled after CDP ready when the environment/state is valid.
- Verify is read-only field/form inspection.
- Autofill current Incident remains disabled until Verify succeeds.
- Autofill remains limited to allowed fields.
- No Save / Submit / Update / Resolve / Close automation buttons.
- No ServiceNow API write.
- No production write.
- Human operator manually reviews and submits in ServiceNow.
- Settings URL validation remains strict.
- Main UI and evidence remain sanitized.

Runtime status should be honest:

- Do not show `CDP ready` until browser control is actually ready.
- Do not show `Verified` until read-only verification succeeded.
- Do not show `Ready` for Autofill until verification and draft/plan checks pass.
- If blocked, show a short safe reason in the same card.

## 10. Implementation target files

Frontend implementation should usually touch only:

- `apps/desktop/src/App.tsx`
- `apps/desktop/src/styles.css`
- `apps/desktop/src/App.test.ts`

Avoid touching unless a later task explicitly proves necessity:

- `apps/desktop/electron/main.ts`
- `apps/desktop/electron/preload.ts`
- `packages/adapters/*`
- `packages/core/*`
- `scripts/*`
- runtime automation code
- packaging/build scripts

Smallest implementation approach for `sna-frontend-workbench`:

1. Replace the current vertical page composition with a true `OperatorWorkbenchV2Shell` app layout.
2. Reuse existing app state, handlers, environment URL validation, settings persistence, draft state, and runtime action handlers.
3. Add top bar with app name, environment chip, target chip, and language selector.
4. Remove top-bar Settings and move the only visible expanded-state Settings entry into the left sidebar navigation.
5. Build left region as icon rail + sidebar, or a combined left region preserving the same visual hierarchy.
6. Keep center workspace to three primary cards by default: Selected source, Cleaned summary, Incident draft.
7. Move runtime actions to the right rail with three stacked action cards and clear disabled reasons.
8. Keep secondary details collapsed by default.
9. Remove/hide demo clutter listed in Section 8.
10. Add/update tests before claiming the UI satisfies this spec.
11. Run relevant gates, including privacy scanning, before review.

Minimal component map, if useful:

- `OperatorWorkbenchV2Shell`
- `WorkbenchTopBar`
- `LeftIconRail`
- `WorkbenchSidebar`
- `SourceSearchBox`
- `SourceListGroup`
- `SelectedSourceCard`
- `CleanedSummaryCard`
- `IncidentDraftCard`
- `RuntimeRail`
- `RuntimeActionCard`
- `RuntimeStatusCard`
- `CompactSafetyNotice`
- existing `SettingsDrawer` / `SettingsPanel`

Do not create a large design system. Use small local components or existing components only where they simplify the implementation.

## 11. Test checklist for implementation

`sna-frontend-workbench` must add/update tests that assert all of the following.

Top bar:

- Top bar renders `ServiceNow Automation`.
- Top bar has an environment chip that can show `QA Environment`, `Dev Environment`, and `Production Environment` or `Production Shadow` depending on state.
- Top bar has `Target configured` / `Target missing` state.
- Top bar has language selector copy `EN / 中文`.
- Top bar does not have a `Settings` button.
- Top bar does not render raw URL, host, ticket, record identifier, fingerprint, CDP endpoint, or browser profile path.

Left navigation/sidebar:

- Left navigation region has `Inbox`, `Workbench`, `Knowledge`, `History`, and `Search`.
- The expanded left navigation includes exactly one labeled `Settings` row before the source search/list region.
- No `Settings` button appears below the Today/Yesterday source list.
- `Workbench` selected state is visible.
- Left sidebar has a search input with placeholder `Search tickets...`.
- Search shortcut hint `Ctrl+K` is present if implemented.
- Group labels `Today` and `Yesterday` render for the sample/source list state.
- Expanded left sidebar navigation has exactly one labeled `Settings` row directly with the other navigation rows, before the source search/list region.
- There is no duplicate Settings button elsewhere in the normal app shell.

Center workspace:

- Selected source card exists.
- Cleaned summary card exists.
- Cleaned summary card has `Sanitized` chip.
- Incident draft card exists.
- Draft fields include `Short description`, `Description`, and `Work notes`.
- Required/common field preview is compact or collapsed by default if implemented.
- Autofill plan is compact or collapsed by default if implemented.
- Center workspace does not render a full mock ServiceNow form preview.

Right runtime rail:

- Runtime actions card/rail exists.
- `Start QA Chromium` exists.
- `Verify current Incident` exists.
- `Autofill current Incident` exists.
- Verify is disabled before CDP ready.
- Autofill is disabled before Verify success.
- Disabled controls expose visible reason copy, not tooltip-only explanations.
- Runtime status can show sanitized `CDP ready` / `Verified` / `Ready` states without raw internals.
- Compact safety copy is visible: AI fills allowed fields only; human reviews/submits manually.

Removal/privacy assertions:

- Raw CDP endpoint is not visible.
- Raw URL/host/ticket/record identifier/fingerprint is not visible.
- `MockAIProvider` is not visible.
- `Field-trial accelerated P0` is not visible.
- Language simulation text block is not visible.
- Excel dry-run evidence is not visible.
- High Severity Monitor simulator is not visible.
- Queue / Source Review / TicketDraft mode tabs are not visible.
- No `Save`, `Submit`, `Update`, `Resolve`, or `Close` automation button exists.
- No ServiceNow API write action exists.

Layout assertions where practical:

- App shell root uses viewport-height layout rather than body-level long scroll.
- Left/sidebar, center, and right runtime regions are rendered as distinct landmark/region elements.
- Right runtime rail remains present when a source is selected.
- Settings drawer/panel remains reachable from the single Settings row in the expanded left sidebar navigation.

Suggested commands for implementer verification:

```text
pnpm test
pnpm typecheck
pnpm build
pnpm privacy:scan
```

Automated tests are necessary but not sufficient; Alan still needs manual acceptance.

## 12. Manual acceptance checklist for Alan

Alan should verify the app against the sanitized text design target:

- UI follows the app-shell proportions, spacing, and warm palette described in this spec and token file.
- It feels like a compact desktop command center, not a demo playground.
- Warm/light theme is comfortable; no black-background/high-contrast afterimage-heavy design.
- Top bar has app identity on the left.
- Top-right has environment, target, and `EN / 中文` language selector.
- There is no top-bar Settings button.
- Settings appears only as one labeled row inside the expanded left sidebar navigation.
- Left side has icon-like feature switches and search.
- Left list is compact and grouped, not a long text wall.
- Center is concise: selected source, cleaned summary, and incident draft.
- Center does not show a full mock ServiceNow form or all possible fields expanded.
- Right action rail is clear and immediately visible.
- `Start QA Chromium` is easy to find.
- `Verify current Incident` is easy to find and disabled until CDP is ready.
- `Autofill current Incident` is gated until Verify succeeds.
- Disabled states explain why they are disabled.
- The app does not show mock/demo clutter.
- The app does not show raw ServiceNow URLs, hosts, ticket IDs, record identifiers, fingerprints, logs, screenshots, traces, sessions, cookies, or customer data.
- Windows app still opens.
- Start QA Chromium still visibly opens the dedicated browser.
- CDP readiness updates honestly.
- Verify current Incident still works read-only.
- Autofill remains gated and only fills allowed fields.
- No Save / Submit / Update / Resolve / Close automation is visible.

## 13. State matrix

| State | Top bar | Left sidebar | Center workspace | Right rail | Required copy / behavior |
|---|---|---|---|---|---|
| First launch | Environment chip and target status visible | Empty/placeholder list; Settings visible | Empty selected-source card | Start gated by target; Verify/Autofill disabled | `Select a source or configure a target to begin.` |
| Target missing | `Target missing` amber | Todo/list can remain visible | Draft review allowed locally | Start disabled | `Configure QA or Dev URL in Settings before launching.` |
| Target configured | `Target configured` green | Source list active | Source/draft area ready | Start enabled for QA/Dev | `Ready to launch a dedicated QA browser.` |
| Source selected | Stable chips | Selected row highlighted | Selected source + cleaned summary visible | Runtime depends on target/CDP | `Review the source and draft before runtime actions.` |
| Draft ready | No safety change | Selected source remains | Incident draft visible | Verify/Autofill still gated | `Draft ready for human review.` |
| Browser launching | Environment chip may show busy | No layout shift | Draft remains editable | Start busy; Verify disabled | `Launching dedicated browser...` |
| CDP ready, not verified | Target remains redacted/configured | No layout shift | Field preview not verified yet | Verify enabled; Autofill disabled | `Verify current Incident before autofill.` |
| Verify running | No raw internals | No layout shift | Optional read-only verifying indicator | Verify busy; Autofill disabled | `Read-only verification in progress.` |
| Verify success | No raw fingerprint | History may record safe event | Field preview safe statuses update | Autofill enabled if plan safe | `Current Incident verified. Review autofill plan.` |
| Verify blocked | No raw internals | Safe blocked event only | Draft unchanged | Verify shows blocked reason | `Open an Incident form in the dedicated QA browser, then verify again.` |
| Autofill ready | Safety unchanged | Todo asks review | Autofill plan visible | Autofill enabled | `Autofill will populate allowed fields only.` |
| Autofill running | Safety unchanged | No layout shift | Allowed fields may show busy overlay | Autofill busy | `Autofilling allowed fields...` |
| Autofill success | Safety unchanged | Safe history event | Filled-field summary visible | Evidence updates safely | `Allowed fields were filled. Review and submit manually if appropriate.` |
| Runtime error | No raw internals | Safe error event | Draft unaffected | Error reason + retry | `Runtime action failed safely. No final write was attempted.` |
| Production Shadow | Production chip locked | Source review allowed | Draft comparison allowed | Autofill disabled | `Production Shadow is comparison-only.` |

## 14. Empty, loading, and error states

Empty states:

- No source selected:
  - Title: `No source selected`.
  - Body: `Select a sanitized source from the left list to review the summary and draft.`
- No target configured:
  - Title: `Target not configured`.
  - Body: `Add QA or Dev URL in Settings before starting a dedicated browser.`
  - CTA: `Open Settings` from the missing-target chip or from the left navigation Settings row.
- No runtime evidence:
  - Title: `No runtime evidence yet`.
  - Body: `Start, Verify, and Autofill results appear here as sanitized status summaries.`

Loading states:

- Source loading: 2 to 3 warm skeleton rows; avoid rapid shimmer.
- Browser launching: `Start QA Chromium` busy, Verify disabled with reason.
- CDP connecting: amber `Waiting for CDP readiness` chip.
- Verify running: right rail busy state; center may show `Inspecting current form read-only...`.
- Autofill running: only allowed fields indicate progress; no full-page blocking spinner unless necessary.

Error/blocked states:

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

All error states must be sanitized. Do not surface raw exception messages if they contain URLs, hosts, selectors, fingerprints, cookies, sessions, tokens, or user/customer data.

## 15. Button enable/disable logic

| Control | Enabled when | Disabled reason copy | Notes |
|---|---|---|---|
| Left navigation Settings row | Always in expanded sidebar navigation | Never disabled | Opens settings drawer/panel. Exactly one visible Settings entry in normal shell. |
| Environment chip | Always, unless runtime action is mid-flight | `Runtime action running; wait before changing environment.` | Full URL editing remains in Settings. |
| Language selector | Always | Never disabled unless app is in modal-blocking state | Top-right only; no language simulation block. |
| Start QA Chromium | QA or Dev selected; target configured and valid; no runtime action busy | `Configure a QA or Dev target in Settings before launching.` / `Another runtime action is running.` | Must visibly open dedicated browser; no raw launch details. |
| Verify current Incident | CDP ready; QA/Dev environment; no verify/autofill busy | `Start QA Chromium and wait for CDP ready first.` / `Open an Incident form in the dedicated browser.` | Read-only; no fill/write. |
| Autofill current Incident | Verify success is fresh for current page; draft exists; allowed-field plan is safe; QA/Dev environment; no action busy | `Verify current Incident first.` / `Review required fields before autofill.` / `Production Shadow is comparison-only.` | Allowed fields only; no final writes. |
| Save draft | Local draft exists or draft fields changed | `No draft changes to save.` | Local/in-app only; not ServiceNow Save. |
| Prepare draft / Save local draft | Source selected and draft generation is safe | `Select a source item first.` / `Draft is already being prepared.` | Must not imply ServiceNow submit. |
| Clear saved settings | Settings open and saved settings exist | `No saved settings to clear.` | Use confirmation if destructive. |
| Evidence expand | Sanitized evidence exists | `No runtime evidence yet.` | Sanitized summary only. |

Design rule: every disabled primary/runtime button must show a visible reason within the same card. Do not rely on hover-only tooltips.

## 16. Copy text

Top bar:

- Product: `ServiceNow Automation`
- Environment: `QA Environment`, `Dev Environment`, `Production Shadow`
- Target: `Target configured`, `Target missing`, `Target invalid`, `Target redacted`
- Language: `EN / 中文`

Left sidebar:

- Feature nav: `Inbox`, `Workbench`, `Knowledge`, `History`, `Search`
- Search placeholder: `Search tickets...`
- Search hint: `Ctrl+K`
- Group labels: `Today`, `Yesterday`
- Settings: `Settings`

Center:

- `Selected source`
- `Cleaned summary`
- `Sanitized`
- `Incident draft`
- `Short description *`
- `Description *`
- `Work notes`
- Status: `Draft`
- Draft actions: `Save draft`, `Prepare draft` or `Save local draft`
- Secondary/collapsed: `Required/common fields`, `Autofill plan`, `Recommendation detail`

Right rail:

- `Runtime actions`
- `Start QA Chromium`
- `Open a dedicated QA Chromium profile for this session.`
- `Verify current Incident`
- `Inspect only field structure and fingerprint the current Incident.`
- `Autofill current Incident`
- `AI drafts and fills allowed fields based on the source content.`
- `Runtime status`
- `Sanitized mode`
- `CDP connected · All good`
- `AI drafts and fills allowed fields only.`
- `Human reviews and submits manually.`

Settings:

- `Environment URLs`
- `QA URL`
- `Dev URL`
- `Production URL`
- `Default environment`
- `Clear saved settings`
- `Full URLs are visible only here. Main UI and logs show configured/missing/redacted status.`
- `Use safe landing URLs only. Record links, query strings, hashes, credentials, tokens, sessions, and cookies are blocked.`

Do not use copy that implies autonomous final writes, such as:

- `Submit Incident`
- `Update Incident`
- `Resolve Incident`
- `Close Ticket`
- `Push to ServiceNow`
- `Write via API`
- `Autonomous production submit`

## 17. Accessibility and eye-comfort notes

Eye-comfort requirements:

- Default to warm light theme.
- Avoid pure black backgrounds and white-on-black high contrast text.
- Prefer warm paper backgrounds and warm-white surfaces.
- Keep body text at 15px to 17px minimum; 16px+ preferred in dense lists.
- Card titles should be visually clear, typically 18px to 22px.
- Use line length control for draft/source text; avoid full-width long paragraphs.
- Avoid all-caps paragraphs.
- Avoid heavy animation and rapid shimmer; respect `prefers-reduced-motion`.

Accessibility requirements:

- Interactive targets: 44px minimum height/width; runtime cards preferably 48px+ tall.
- Use visible focus rings with at least 2px outline and offset.
- Do not rely on color alone for selected, error, ready, verified, or disabled states.
- Selected source item needs color + border/accent + semantic selected state.
- Status chips need readable text labels, not icon-only status.
- Disabled actions must include visible reasons.
- Runtime status updates should use polite live regions where applicable.
- Collapsible cards should expose `aria-expanded` and clear labels.
- Top bar, left navigation, center workspace, and right runtime rail should be navigable landmarks/regions where practical.
- Muted text must still meet contrast requirements against warm surfaces.

Minimal palette guidance:

```text
background:    warm paper / #f7f2e8 range
surface:       warm white / #fffaf2 range
surface-soft:  #fbf6ec range
text:          warm charcoal, not pure black
muted:         readable warm gray
border:        low-contrast warm beige
green:         configured / ready / verified / sanitized
amber:         QA / selected / draft / caution
focus:         teal or blue-green ring with sufficient contrast
```

## 18. Tooling and visual-reference notes

Sanitized visual reference handling:

- The earlier sanitized visual concept was translated into this text spec and token file.
- Screenshot/image artifacts are not required for implementation and must not be tracked.
- No real ServiceNow screenshot or customer data was uploaded or used.

OpenDesign:

- OpenDesign MCP was available.
- Existing project inspected: `sna-operator-workbench-v2`.
- Its saved concept-board artifact remains a visual aid only; this markdown spec and the token file are the implementation source of truth for K6D2.

GPT Images 2 / image generation:

- Two sanitized image-generation attempts were made for an auxiliary concept check using fake data only.
- Both attempts failed with `FalClientHTTPError` and returned no image file/URL.
- No successful image artifact is required or tracked for this implementation.

Public reference research note:

- This K6D2 task now uses this sanitized text spec plus prior project synthesis already documented in `operator-workbench-v2-no-demo-spec.md`: command-center separation of navigation/work/action, manager-editor-artifact separation, sticky runtime inspector rail, compact status chips, and progressive disclosure.
- Do not copy Codex, Claude, Antigravity, or other product branding; only use the layout principles already translated here.
