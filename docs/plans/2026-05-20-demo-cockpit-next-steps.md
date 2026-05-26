# Service Desk Workflow Cockpit Next-Step Implementation Plan

> **For Hermes:** Use service-desk-automation-safety, codex, github-issues, requesting-code-review, and subagent/Codex issue-sized execution. Do not enter real ServiceNow, Teams, Outlook, Graph, or ServiceNow Chat integrations unless a later GPT-5.5 Pro checkpoint explicitly approves the staged boundary.

**Goal:** Turn the current mock Service Desk Workflow Cockpit into a polished, demo-ready flow before any real browser/QA/ServiceNow exploration.

**Architecture:** Keep the product framed as `multi-channel intake -> source review -> AI-assisted TicketDraft -> Incident field checklist -> safe copy/export -> runtime safety posture`. Next work should remain fake/sanitized and local-only. #41 high-severity simulator is a demo add-on, not a reason to touch real ServiceNow polling.

**Tech Stack:** Electron + React + TypeScript desktop app, pnpm workspace, Vitest SSR tests, existing mock AI provider, existing local-only safety gates.

---

## Current baseline

Latest pushed baseline contains:

- #37: demo queue before TicketDraft.
- #43: multi-channel Intake Hub.
- #38: source cleanup/normalization.
- #39: Incident field review checklist based on Alan's sanitized ServiceNow screenshot.
- #40: local safe copy/export actions.
- #42: static runtime/safety posture panel.

Open relevant issues:

- #41: fake P1/P2 high-severity alert simulator.
- #36: parent planning issue.
- #33/#30: browser/QA checkpoint path — do **not** proceed until GPT-5.5 Pro checkpoint after mock cockpit validation.

## Non-negotiable safety boundaries

For the next stage, continue to forbid:

- Real Teams / Graph.
- Real Outlook / mailbox.
- Real ServiceNow Chat / API.
- Real self-service ticket polling.
- Real ServiceNow URL/login/DOM/page inspection.
- Browser screenshots / HAR / traces / video / cookie or session export.
- Real ServiceNow field fill.
- Save / Submit / Update / Close.
- Real email send or attachment upload.
- External AI with real ServiceNow/mailbox/chat content.

Demo data must stay fake/sanitized and visibly labeled.

---

## Phase 1 — Manual visual smoke of current cockpit

**Objective:** Verify what the user actually sees before adding more features.

**Files:** No code changes expected.

**Steps:**

1. From WSL, run:

   ```bash
   cd $HOME/projects/servicenow-automation
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
   nvm use 24.15.0
   pnpm dev
   ```

2. If Electron/WSLg does not open, run non-GUI verification instead:

   ```bash
   pnpm --filter @servicenow-automation/desktop test
   pnpm --filter @servicenow-automation/desktop typecheck
   pnpm build
   ```

3. Visual acceptance checklist:

   - Header clearly says workflow cockpit / queue-first flow.
   - Intake Queue shows Teams, self-service, ServiceNow Chat, shared mailbox style items.
   - Source Review shows raw vs cleaned text.
   - Create Incident Draft works for at least VPN and account-login scenarios.
   - TicketDraft fields are readable and not crowded.
   - Field checklist clearly shows required ServiceNow fields.
   - Safe copy/export controls are understandable.
   - Runtime/Safety panel is visible but not dominating.
   - No text suggests real ServiceNow/Teams/mailbox connection is active.

4. Record findings in #36 or a new polish issue.

**Verification:** User/Hermes visual check plus existing automated gates.

---

## Phase 2 — Implement #41 fake P1/P2 high-severity simulator

**Objective:** Add operations-awareness demo value without real ServiceNow polling.

**GitHub issue:** #41

**Implementation scope:**

- Add a small `High Severity Monitor Simulator` panel.
- Fake states only:
  - Normal
  - P2 active
  - P1 active
- Show fake counts and fake affected service labels.
- Add `Acknowledge` and `Mute demo alerts` local-state buttons.
- Add clear text: `Fake simulator only — no ServiceNow polling or API calls`.
- Integrate with the existing warm/light UI.

**Non-goals:**

- No real ServiceNow polling.
- No browser automation.
- No audio loop unless later explicitly approved; avoid alert fatigue.
- No real ticket IDs, assignment groups, users, hosts, or customer names.

**Suggested file changes:**

- Modify: `apps/desktop/src/App.tsx`
- Modify: `apps/desktop/src/styles.css`
- Modify: `apps/desktop/src/App.test.ts`

**TDD steps:**

1. Add test assertions for:

   - `High Severity Monitor Simulator`
   - `Fake simulator only`
   - `P1 active`
   - `P2 active`
   - `Acknowledge`
   - `Mute demo alerts`

2. Run expected failing test:

   ```bash
   pnpm --filter @servicenow-automation/desktop test
   ```

3. Implement minimal UI/local state.

4. Run:

   ```bash
   pnpm --filter @servicenow-automation/desktop test
   pnpm --filter @servicenow-automation/desktop typecheck
   pnpm build
   pnpm typecheck
   pnpm test
   ```

5. Run privacy/safety diff scan and independent review.

6. Commit/push and close #41 only after PASS.

---

## Phase 3 — Demo flow polish issue

**Objective:** Make the app easier to present in 3–5 minutes.

**Create new issue if visual smoke finds friction.**

Potential scope:

- Add a `Demo Flow` checklist/sidebar:
  1. Select intake item.
  2. Review cleaned source.
  3. Create Incident Draft.
  4. Review required fields.
  5. Copy safe Work Notes.
  6. Confirm safety posture.
  7. Optionally show fake P1/P2 simulator.
- Improve wording from engineering terms to manager/demo-friendly terms.
- Make important panels more balanced/symmetrical.
- Ensure light/warm readability for Alan's eyesight preference.

**Non-goals:** no real integrations.

---

## Phase 4 — GPT-5.5 Pro checkpoint: mock cockpit readiness

**Objective:** Ask GPT-5.5 Pro whether the mock cockpit is ready for demo and whether to proceed to #33/#30 browser/QA path.

**Checkpoint file:**

`docs/prompts/gpt-5.5-pro/demo-cockpit-readiness-before-browser-checkpoint.md`

**When to run:**

- After #41 is implemented and visually smoke-tested, or
- Before any work on #33/#30 that might launch browser/about:blank/QA exploration.

**Questions for GPT-5.5 Pro:**

- Is the current mock cockpit enough for June 5 demo without real ServiceNow?
- Is #41 useful enough or distracting?
- What UI/content polish is mandatory before recording?
- Should we keep #33 about:blank as a technical safety validation only, or defer it?
- What conditions must be met before QA login/read-only exploration?

**Expected verdict format:**

- READY
- READY WITH CONDITIONS
- NOT READY

---

## Phase 5 — Demo recording runbook

**Objective:** Prepare a repeatable 3–5 minute demo script.

**Scope:**

- Create `docs/demo/demo-flow-script.md`.
- Include exact narration:
  - problem statement
  - multi-channel intake
  - source review/cleanup
  - Incident draft
  - required field checklist
  - safe copy/export
  - safety posture
  - optional high severity simulator
- No screenshots from real ServiceNow.
- No real customer names.

---

## Phase 6 — Only after checkpoint: decide #33/#30

Do not proceed into real browser/QA path until GPT-5.5 Pro gives at least READY WITH CONDITIONS.

If approved, next work must stay staged:

1. #33 `about:blank` only, using dedicated Windows Chromium runtime.
2. No ServiceNow URL.
3. No login.
4. No DOM.
5. No screenshot/HAR/trace/session export.
6. Record field-trial result.
7. Ask for another checkpoint before QA login/read-only exploration.

---

## Acceptance definition for the next milestone

The next milestone is complete when:

- #41 is either implemented and closed or explicitly deferred.
- Current cockpit passes visual smoke.
- `pnpm build`, `pnpm typecheck`, `pnpm test` pass.
- GPT-5.5 Pro checkpoint prompt exists and is linked in GitHub.
- GPT-5.5 Pro response is recorded before #33/#30 advances.
- User can demo the cockpit without touching real ServiceNow or real customer data.
