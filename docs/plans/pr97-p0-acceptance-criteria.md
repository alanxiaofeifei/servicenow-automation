# PR97 P0 Product Acceptance Criteria

## Goal

Define the product acceptance bar for PR97 so local automated gates cannot be mistaken for a working Windows operator product.

PR97 is accepted only when the user-facing Windows flow proves all of these P0 behaviors:

1. Windows double-click opens the app or shows visible sanitized startup diagnostics on failure.
2. The app exposes visible startup/runtime diagnostics instead of failing silently.
3. Start QA Chromium visibly launches a dedicated browser window.
4. CDP readiness is visible in the app and is based on real readiness, not a launch attempt alone.
5. Verify current Incident is disabled before CDP readiness and enabled only after CDP readiness.
6. Verify-only mode is read-only and performs no ServiceNow writes or field mutations.
7. Autofill is a separate operator action from Save, Submit, Update, Resolve, and Close.
8. The UI is a simplified three-column Operator Workbench.
9. Packaging status is honest and does not depend on hidden WSL/dev assumptions.

## Non-goals

- No implementation work in this acceptance reset task.
- No production ServiceNow writes.
- No ServiceNow Table API writes.
- No automated OAuth, password entry, MFA bypass, or credential storage.
- No automation of Save, Submit, Update, Resolve, Close, or equivalent state-changing controls.
- No bulk ticket creation or background ticket monitoring.
- No screenshots, HAR, trace, cookies, session storage, storage-state, or page fingerprint artifacts in docs, logs, or handoffs.
- No claim that `pnpm build`, `pnpm typecheck`, `pnpm test`, or `pnpm privacy:scan` alone equals product acceptance.
- No requirement for a fully signed production installer in this slice; an unsigned/dev-labeled package may be acceptable only if its status is explicit and the double-click path is proven on Windows.

## Acceptance criteria

### AC-01 — Windows double-click launch

Accepted when:

- A Windows user can open the delivered app by double-clicking the Windows artifact from File Explorer.
- The app opens without requiring WSL, a repo checkout, `pnpm`, `npm`, a dev server, or a terminal command.
- Within a short visible startup window, either the main app appears or a sanitized error dialog/window appears.
- A background process with no visible window is not acceptable.
- A launch path that only works from WSL or from a developer shell is not product acceptance.

### AC-02 — Visible startup diagnostics

Accepted when:

- If startup fails before the main workbench loads, the user sees a visible sanitized error message or diagnostics window.
- If a renderer, backend, browser launcher, or packaging dependency fails after the window opens, the app shows the failure in a visible diagnostics area.
- Diagnostics identify the failing subsystem and next operator action without exposing secrets, raw ServiceNow hostnames, ticket IDs, customer data, cookies, sessions, HAR, trace, screenshots, videos, or raw approval phrases.
- Diagnostics are available from the double-click path, not only from a dev console.

### AC-03 — Start QA Chromium visibly launches a dedicated browser

Accepted when:

- The Operator Workbench has an obvious Start QA Chromium control.
- Clicking it visibly opens a separate dedicated Chromium browser window.
- The launched browser is not the operator's default personal browser profile.
- The app shows progress while launching and a sanitized failure if launch times out.
- The launch action itself performs no ServiceNow write, no login automation, and no ticket mutation.
- If the browser does not visibly open, this P0 is failed even if a local process was spawned.

### AC-04 — CDP readiness is visible and real

Accepted when:

- The app exposes a CDP state such as Not started, Starting, Ready, Failed, or Disconnected.
- Ready is shown only after the dedicated browser's CDP endpoint is actually reachable, for example after DevToolsActivePort plus `/json/version` or an equivalent readiness probe succeeds.
- A mere process-start event or PowerShell success string is not enough to mark CDP Ready.
- The readiness display remains sanitized and does not show the current ServiceNow URL, ticket number, customer data, cookies, sessions, or page content.
- If the browser closes or CDP becomes unreachable, the app returns to a non-ready state.

### AC-05 — Verify current Incident disabled/enabled transition

Accepted when:

- On fresh app startup, Verify current Incident is disabled.
- While QA Chromium is launching and CDP is not ready, Verify current Incident remains disabled.
- After CDP readiness is proven, Verify current Incident becomes enabled.
- If CDP readiness is lost, Verify current Incident becomes disabled again.
- This transition is visible to the operator and testable without reading source code.
- Verify must never become enabled merely because the app launched or because a browser process exists.

### AC-06 — Verify-only is read-only

Accepted when:

- Clicking Verify current Incident reads only the current browser page state needed to determine whether an Incident form is present and whether required selectors/fields are detectable.
- Verify-only performs no field writes, no keyboard input, no mouse clicks, no Save, no Submit, no Update, no Resolve, no Close, and no ServiceNow API writes.
- Verify-only does not alter Incident state, assignment, notes, category, requester, or any other form value.
- Verify-only returns a sanitized result such as verified/not verified, missing selectors, safety status, and next required operator action.
- If the current page is not a supported Incident form, Verify fails closed with a visible sanitized reason and performs no writes.

### AC-07 — Autofill remains separated from state-changing actions

Accepted when:

- Autofill is a separate explicit operator action after successful verify, not part of Verify current Incident.
- Autofill is visually and logically separate from Save, Submit, Update, Resolve, Close, and any equivalent state-changing action.
- The product contains no automated Save, Submit, Update, Resolve, or Close control path.
- Autofill may fill only the allowed draft text fields for the approved slice and must stop before any state-changing control.
- Human review and manual ServiceNow submission remain outside the automation.
- If any implementation combines autofill with a state-changing action, PR97 must stop and fail safety review.

### AC-08 — Simplified three-column Operator Workbench

Accepted when:

- At normal desktop width, the primary UI is a clear three-column Operator Workbench rather than a dense demo cockpit or vertical card stream.
- The left column owns launch/connection state: Start QA Chromium, CDP readiness, login guidance, and connection diagnostics.
- The center column owns the current Incident workflow: verify status, safe autofill readiness, field detection status, and operator next steps.
- The right column owns draft/diagnostics output: generated draft preview, sanitized runtime diagnostics, and safety warnings.
- Primary P0 actions are visible without hunting through legacy demo sections.
- The UI makes disabled/enabled states obvious and explains why an action is disabled.

### AC-09 — Packaging status is honest

Accepted when:

- The Windows launch path documents whether the artifact is packaged, unpackaged, unsigned, or dev-only.
- If the artifact is not a real packaged Windows app, the UI/docs say so plainly and packaging acceptance remains incomplete.
- The accepted package does not rely on hidden WSL assumptions, hard-coded developer paths, a local dev server, globally installed Node/pnpm, or the source repository being present.
- Missing runtime dependencies produce visible sanitized diagnostics instead of silent failure.
- The acceptance report separates local gates, manual Windows product acceptance, packaging acceptance, and safety/privacy acceptance.

## Human acceptance steps

Perform these steps on Windows from the delivered artifact. Do not perform production writes. Keep login manual.

1. Double-click launch
   - Open the app by double-clicking the Windows artifact in File Explorer.
   - Expected: the Operator Workbench opens, or a visible sanitized startup diagnostic appears.
   - Fail if the app only works from WSL, `pnpm`, a terminal, or a hidden dev server.

2. Startup diagnostics check
   - Induce or observe at least one safe missing-dependency/failure path if available, or inspect the visible diagnostics area during normal startup.
   - Expected: failures are visible, sanitized, and actionable.
   - Fail if the app silently does nothing or requires dev-console inspection.

3. Start QA Chromium
   - Click Start QA Chromium.
   - Expected: a dedicated Chromium window visibly opens and the app shows launch progress.
   - Fail if there is no visible browser window, if the operator's personal default profile is reused, or if the app claims success based only on spawning a process.

4. CDP readiness
   - Watch the CDP readiness indicator.
   - Expected: it progresses to Ready only after real CDP readiness is proven; it shows Failed/Disconnected if readiness cannot be proven.
   - Fail if Ready appears before the browser endpoint is reachable.

5. Verify button transition
   - Before CDP Ready, confirm Verify current Incident is disabled.
   - After CDP Ready, confirm Verify current Incident becomes enabled.
   - Close the dedicated browser or otherwise lose CDP, then confirm Verify current Incident disables again.
   - Fail if Verify is enabled before readiness or stays enabled after readiness is lost.

6. Verify-only read-only behavior
   - Manually log in if needed and manually navigate to a QA/safe current Incident form.
   - Click Verify current Incident.
   - Expected: the app reports sanitized form/selector readiness and next steps.
   - Confirm no fields changed and no Save, Submit, Update, Resolve, Close, or equivalent action occurred.
   - Fail on any mutation, state change, click of a state-changing control, raw data leak, or unsanitized log.

7. Autofill separation
   - Confirm Verify current Incident does not autofill.
   - Confirm Autofill, if present, is a separate explicit operator action after verify.
   - Confirm no Save, Submit, Update, Resolve, or Close automation exists in the same flow.
   - Fail if autofill and state-changing actions are coupled.

8. Three-column workbench
   - Inspect the default desktop UI.
   - Expected: three primary columns are visible: launch/connection, current Incident workflow, and draft/diagnostics.
   - Fail if the accepted path is still a crowded demo cockpit, a single vertical card stream, or hides P0 actions below non-P0 content.

9. Packaging honesty
   - Record whether the artifact is packaged/unpackaged, signed/unsigned, and whether any dev prerequisites were required.
   - Expected: status is explicit and no hidden WSL/dev dependency is needed for accepted packaging.
   - Fail packaging acceptance if Windows launch depends on WSL, a source checkout, a dev server, or global developer tools.

## Automated gates

These gates are required but not sufficient. Passing them does not equal product acceptance.

### Local automated gate

Run from the repository before requesting product acceptance:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm privacy:scan
```

Expected local gate result:

- All four commands pass.
- Test coverage includes the CDP readiness state machine, Verify disabled/enabled transitions, verify-only no-write behavior, and no automated state-changing actions.
- Privacy scan reports no raw ServiceNow hostnames, ticket IDs, customer data, credentials, cookies, sessions, HAR, traces, screenshots, videos, page fingerprints, or raw approval phrases.

### Manual Windows product acceptance gate

Required evidence:

- Human observer confirms double-click launch behavior.
- Human observer confirms visible startup diagnostics.
- Human observer confirms Start QA Chromium visibly opens a dedicated browser.
- Human observer confirms CDP readiness is visible and real.
- Human observer confirms Verify current Incident transitions disabled to enabled only after CDP readiness.
- Human observer confirms Verify-only performs no write.
- Human observer confirms the simplified three-column Operator Workbench.

### Packaging acceptance gate

Required evidence:

- Artifact type and status are documented: packaged/unpackaged, signed/unsigned, dev-only/product candidate.
- Windows double-click path works without WSL or dev-server assumptions for any artifact claimed as packaging-accepted.
- Missing packaged dependencies produce visible sanitized diagnostics.

### Safety/privacy acceptance gate

Required evidence:

- No automation path can Save, Submit, Update, Resolve, Close, or perform ServiceNow API writes.
- Verify-only is read-only by design and by test.
- Autofill is separated from every state-changing control.
- Logs, docs, handoffs, and reports contain no prohibited raw ServiceNow/customer/session artifacts.

## Risks

- A local green build can hide a broken Windows double-click path.
- Browser-launch code can spawn a process without a visible or dedicated browser window.
- CDP can be falsely marked Ready before the endpoint is reachable.
- Verify can accidentally mutate the page if it shares code with autofill or action automation.
- Autofill can drift into submit/update behavior unless state-changing controls remain out of scope.
- A dense demo cockpit can pass automated tests while still failing operator usability.
- Packaging can accidentally depend on WSL, hard-coded developer paths, or globally installed tooling.
- Diagnostics can leak raw ServiceNow/customer/session details if privacy review is skipped.

## Suggested assignees

- `sna-windows-runtime`: Windows double-click launch, startup diagnostics, runtime dependency visibility, packaging path.
- `sna-browser-cdp`: Start QA Chromium, dedicated profile/window behavior, CDP readiness probe and state transitions.
- `sna-servicenow-form`: Verify-only read-only behavior, safe field detection, autofill separation from state-changing actions.
- `sna-frontend-workbench`: simplified three-column Operator Workbench and visible disabled/enabled states.
- `sna-privacy-security`: no-write/no-leak review and privacy scan enforcement.
- `sna-qa-acceptance`: adversarial manual Windows product acceptance using these criteria.
- `sna-release-docs`: packaging status honesty and acceptance report wording.

## Stop conditions

Stop PR97 acceptance and block instead of claiming done if any of these occur:

1. Double-click does not open a visible app or sanitized diagnostic on Windows.
2. Startup failure is silent, hidden in a dev console only, or requires WSL to diagnose.
3. Start QA Chromium has no visible browser effect.
4. The browser launch uses the operator's personal default profile instead of a dedicated profile.
5. CDP Ready appears before a real endpoint readiness probe succeeds.
6. Verify current Incident is enabled before CDP readiness or remains enabled after CDP is lost.
7. Verify-only changes any field, clicks anything, sends keyboard input, or performs any write.
8. Any code path automates Save, Submit, Update, Resolve, Close, or ServiceNow API writes.
9. Autofill is bundled with Verify or with a state-changing action.
10. The UI is not a simplified three-column Operator Workbench at normal desktop width.
11. Packaging acceptance depends on WSL, a dev server, repo checkout, global Node/pnpm, or hard-coded local paths.
12. Logs, docs, tests, screenshots, traces, videos, HAR, handoffs, or diagnostics contain prohibited raw ServiceNow/customer/session artifacts.
13. The acceptance report presents local automated gates as product acceptance.
14. A reviewer cannot tell which gate passed: local automated, manual Windows product, packaging, or safety/privacy.
