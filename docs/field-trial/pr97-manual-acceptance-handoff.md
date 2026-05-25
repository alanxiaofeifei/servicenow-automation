# PR #97 manual acceptance handoff

Date: 2026-05-24T08:56:43+08:00
Branch: `review/windows-operator-handoff-20260523`
PR: https://github.com/alanxiaofeifei/servicenow-automation/pull/97
Previous implementation commit before this handoff: `0885781`

This document is a sanitized handoff for external review and the next development plan. It intentionally omits real ServiceNow URLs, ticket identifiers, raw page fingerprints, cookies, sessions, credentials, HARs, traces, screenshots, and private ticket content.

## Executive status

Current status after the K6I5D2R follow-up: Alan's manual UI acceptance passed for the warm-light Operator Workbench layout.

This document originally recorded the earlier PR #97 manual acceptance failure. Keep that history for traceability, but treat the UI-redesign blocker below as superseded by the later accepted K6I5D2R work.

The PR remains a draft/review handoff until Windows runtime/packaging acceptance and any first real QA/dev trial boundaries are separately verified.

Historical acceptance failure after the earlier implementation:

Observed by the user:

- Clicking `Start QA Chromium` from the QA/dev Incident operator UI produced no visible browser launch.
- `Verify current Incident` stayed disabled/greyed out because Chromium/CDP was not started.
- The later autofill steps were therefore not testable.
- The intended desktop UI restructuring was not accepted at that time: the visible application still behaved like an overcrowded vertical/stream layout, not a simplified operator workbench.
- The promised `operator workbench` three-step flow and localized three-column layout were not materially visible enough for acceptance at that time.

Later accepted UI closure:

- Smaller far-left double-chevron handle with vertical drag support.
- Settings exists as one row in the expanded left sidebar navigation, not under the Today/Yesterday list.
- Expanded blank left rail is removed; collapsed state keeps a compact functional rail.
- Production is visible in Settings while remaining separated from safe production-shadow behavior.

Important correction: local typecheck/build/test/privacy gates passed, but they did not prove the Windows double-click product flow, real QA Chromium launch, CDP readiness, or accepted UI redesign.

## What was completed in code before the failed manual acceptance

The prior implementation focused on safety hardening and local code gates:

- Windows operator handoff branch and Draft PR #97 exist.
- Desktop app includes a QA operator control path with intended numbered actions:
  - Start QA Chromium
  - Verify current Incident
  - Autofill current Incident
- Runtime safety hardening was added:
  - Autofill requires a prior Verify approval fingerprint.
  - UI stores the approval fingerprint internally instead of asking the user to enter it.
  - IPC rejects missing or malformed approval fingerprints.
  - Runtime compares the approved fingerprint against the current page before fill.
  - Runtime/browser sink limits current execution to text fields only: Short description, Description, Work notes.
  - Runtime results avoid returning raw page fingerprint values.
- Dedicated Chromium/CDP helper hardening was added:
  - WSL exposure is gated to dev mode plus explicit confirmation.
  - QA/non-dev exposure should fail closed.
- Local gates passed before this manual failure was reported:
  - `pnpm typecheck`
  - `pnpm build`
  - `pnpm test`
  - `pnpm privacy:scan`
  - PowerShell parser check
  - `git diff --check`
  - added-line sensitive scan
  - focused independent safety review subsets

These are implementation safety gains, not product acceptance.

## Current blockers

### P0 — Windows product launch and runtime acceptance

The product must first prove a simple Windows operator path:

1. Double-click a Windows entrypoint.
2. The desktop tool window opens reliably.
3. App shows a clear status if dependencies/build/runtime are missing.
4. `Start QA Chromium` visibly opens the dedicated/tool-owned Chromium window.
5. The app receives or displays a sanitized local CDP readiness status.
6. `Verify current Incident` becomes enabled only when CDP is ready.

Do not expand autofill fields until this P0 path works under the same user-facing Windows launch method.

### P0 — Start QA Chromium failure

The immediate observed failure is that the button has no visible effect. The next investigation should treat this as a product/runtime bug, not as a user instruction issue.

Likely investigation areas:

- Electron renderer event handler path from button to preload IPC.
- Electron main-process IPC handler for browser launch.
- Sanitized error propagation back to UI.
- Whether the app was running stale build output instead of the latest code.
- Windows PowerShell helper invocation from Electron.
- Windows path quoting and script existence.
- Whether the helper intentionally blocked the launch because environment/mode/dev exposure logic was too strict.
- Whether the helper returned a blocked/error result but UI did not surface it.
- Whether the browser process spawned and immediately exited before `DevToolsActivePort` was ready.
- Whether the UI requires a CDP endpoint but the launch result did not persist it in renderer state.

### P0 — Verify-only remains disabled

This is probably downstream of the Chromium/CDP launch failure. Acceptance criteria should explicitly cover the disabled/enabled state transition:

- Before browser launch: Verify disabled with clear reason.
- After successful launch and local CDP readiness: Verify enabled.
- If browser launch fails: Verify disabled with a visible sanitized error and log path.

### Resolved P0 — UI redesign accepted after K6I5D2R

This blocker is superseded. Alan later confirmed that the UI manual check passed after the K6I5D2R follow-up.

Keep these regression guardrails for future changes:

Requested final UI direction:

- Left column: source/loading area, todo list, history, mode/function switching, and one Settings row inside the expanded navigation.
- Center column: selected source/detail view and transformed ServiceNow Incident field preview, including required/common fields and the autofill plan.
- Right column: runtime actions and controls, including browser launch, verify-only, autofill buttons, templates, status, safety boundary, and environment controls.
- Warm/light theme should remain the default.
- Interface should be much simpler, with far fewer always-expanded panels.
- Avoid black-background/high-contrast designs because of user eyesight/astigmatism constraints.

Recommended design discovery inputs for the next design profile:

- Use OpenDesign for layout exploration.
- Use GPT Images 2 or image-generation/design references only with sanitized/fake content.
- Search public UI patterns from recent agent desktop apps such as Claude Code, Codex, Antigravity-style operator interfaces, and similar coding-agent workbenches.
- Preserve ServiceNow safety semantics; visual inspiration must not introduce unsafe write behavior.

## Final software requirements restated

The final deliverable must be a real Windows desktop tool, not only a WSL/dev demo.

Required:

- Windows double-click opens the tool window reliably.
- Final packaged Windows artifact can run without relying on WSL development `node_modules` or unbundled source scripts.
- Required dependencies are bundled or verified as part of packaging.
- Startup failures show clear user-visible diagnostics and a sanitized log path.
- Dedicated/tool-owned Chromium launch works from the app.
- Manual login remains human-operated.
- Verify-only can read the current QA/dev Incident form structure without writing.
- Autofill must remain separated from Save/Submit/Update/Resolve/Close.
- Save/Submit/Update/Resolve/Close remain human-only unless a future separate approval gate is explicitly implemented.

Near-term field values for QA planning remain:

- Requester: Zheng Zhu
- Category: Desktop
- Subcategory: Password reset
- Location: Shenzhen (YKPC) - CNSNZE
- Assignment group: SN YAGEO Service Desk - China
- Assigned to: Zheng Zhu for initial create; blank when assigning out
- Route-out state should be New
- Work Notes should include the `SD_China` prefix

Implementation note: the current runtime deliberately fills only the three text fields. Full required/starred field automation needs a separate control-type implementation and review because reference/select/status controls can have side effects.

## Recommended multi-profile / Kanban development model

The previous single-profile development approach produced repeated acceptance gaps. The next phase should use a Kanban-style multi-profile workflow with explicit role separation.

Suggested profiles to create or assign:

1. Product Orchestrator / Kanban Lead
   - Owns task decomposition and acceptance criteria.
   - Does not implement code directly.
   - Keeps P0 tasks small and linked.

2. Windows Runtime & Packaging Engineer
   - Owns double-click startup, Electron main/preload/runtime, Windows launcher, PowerShell helper invocation, and packaged artifact verification.
   - Acceptance focus: a user can double-click and see the tool window; Start QA Chromium works.

3. Browser/CDP Engineer
   - Owns dedicated Chromium launch, CDP readiness, DevToolsActivePort polling, `/json/version` probing, sanitized launch errors, and verify-only connectivity.
   - Acceptance focus: Chromium visibly opens, CDP endpoint is usable, Verify can run.

4. ServiceNow Form Safety Engineer
   - Owns verify-only form inspection, field mapping, fingerprint freshness, text-only autofill, and later control-type slices.
   - Acceptance focus: no writes, no fingerprint leakage, correct required/default field plan.

5. Product UI / OpenDesign Designer
   - Owns three-column warm-light operator workbench redesign.
   - Uses OpenDesign, image/design references, and public app inspiration.
   - Acceptance focus: simple left-center-right layout, not a vertical card dump.

6. QA Acceptance Tester
   - Runs manual Windows acceptance steps exactly as the user will run them.
   - Separates local gates from real Windows UI acceptance.
   - Produces concise pass/fail evidence without sensitive artifacts.

7. Privacy/Safety Reviewer
   - Reviews every PR for ServiceNow URL/ticket/fingerprint/credential/session leakage and write-boundary regressions.
   - Must be independent from implementers.

8. Release Integrator
   - Owns final PR assembly, changelog, packaging checklist, and GitHub comment hygiene.
   - Ensures code is pushed only after gates and acceptance notes are honest.

Suggested Kanban graph for the next phase:

- K1 Product acceptance reset: define P0 Windows launch + Chromium + Verify-only acceptance criteria.
- K2 Runtime bug investigation: reproduce `Start QA Chromium` no-op from Windows double-click app and identify the broken IPC/helper/state path.
- K3 Runtime fix: repair button-to-browser launch and user-visible sanitized errors.
- K4 Verify-only fix: enable Verify after CDP readiness and prove read-only field inspection.
- K5 Three-column redesign exploration: completed/superseded by the accepted K6I5D2R visual recovery.
- K6 Three-column implementation: completed/superseded by the accepted K6I5D2R visual recovery.
- K7 Packaging guardrail: prove packaged Windows artifact runs without WSL dev dependencies.
- K8 Independent safety/privacy review.
- K9 Manual Windows acceptance pass/fail run.

Dependencies:

- K3 depends on K2.
- K4 depends on K3.
- K6 depended on K5 and is now accepted for the current UI scope.
- K7 can run in parallel after K3 starts, but final verification still depends on the runtime/verify path and the accepted UI not regressing.
- K8 depends on K3/K4/K7 plus a no-regression check for the accepted UI.
- K9 depends on K8.

## What GPT-5.5 Pro should investigate first

Ask GPT-5.5 Pro to inspect the PR and source with these failure facts in mind:

1. The current branch is pushed to GitHub PR #97.
2. Manual acceptance found Start QA Chromium no-op and Verify disabled.
3. The UI redesign blocker has since been resolved by Alan's K6I5D2R manual acceptance.
4. Local automated gates passed but did not cover Windows product acceptance.
5. The next plan should recommend concrete Hermes Agent profiles and Kanban responsibilities before more coding.
6. The next coding phase should prioritize Windows launch/runtime observability before additional autofill scope.

## Non-goals until P0 is fixed

- Do not add Save/Submit/Update/Resolve/Close automation.
- Do not expand runtime autofill to reference/select/status fields before the browser launch and verify-only path work.
- Do not claim packaging is complete until a packaged Windows artifact is tested outside the WSL development dependency chain.
- Do not regress the accepted app-shell layout back into a crowded vertical card stream.
- Do not ask the user to debug via more CLI steps when the product requirement is a Windows double-click tool.
