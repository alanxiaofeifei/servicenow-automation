# Karpathy + Mavis Kanban Workflow

This project uses a multi-profile Hermes workflow plus Karpathy-inspired coding discipline.

## Why

Previous single-agent development passed local gates but failed manual product acceptance.

The new workflow prevents:

- silent assumptions
- overengineering
- drive-by refactors
- unverifiable "done" claims
- local gates being mistaken for product acceptance

## Four rules

1. Think Before Coding
2. Simplicity First
3. Surgical Changes
4. Goal-Driven Execution

## Multi-profile model

- sna-orchestrator: decomposes and routes
- sna-pm-acceptance: defines acceptance
- sna-windows-runtime: Windows launch/runtime/packaging
- sna-browser-cdp: Chromium/CDP readiness
- sna-servicenow-form: verify-only/autofill safety
- sna-ui-designer: OpenDesign/GPT Images 2 three-column UI design
- sna-frontend-workbench: React/Electron workbench implementation
- sna-qa-acceptance: adversarial acceptance testing
- sna-privacy-security: no-leak/no-write review
- sna-release-docs: PR/docs/release honesty

## Definition of Ready

A Kanban task must include:

- goal
- non-goals
- acceptance criteria
- likely files/components
- safety boundaries
- verification plan
- change budget
- dependencies

## Definition of Done

A worker handoff must include:

- files changed
- commands run
- results
- manual checks
- why the change is minimal
- why every file was necessary
- privacy/safety status
- remaining risks

## Change budget

Default implementation task:

- 1 to 4 files
- under 250 net changed lines

Larger tasks must explain why they cannot be split.

## PR #97 P0 acceptance

Automated gates:

- pnpm build
- pnpm typecheck
- pnpm test
- pnpm privacy:scan

Manual acceptance:

- Windows double-click opens the app.
- Startup diagnostics are visible and sanitized.
- Start QA Chromium visibly launches dedicated Chromium.
- CDP readiness appears in the app.
- Verify current Incident enables only after CDP readiness.
- Verify-only remains read-only.
- Three-column Operator Workbench is visible and simpler.
- Packaging status is honest.

## Safety boundary

AI drafts and fills only.
Human reviews and manually submits.
No Save / Submit / Update / Resolve / Close automation.
