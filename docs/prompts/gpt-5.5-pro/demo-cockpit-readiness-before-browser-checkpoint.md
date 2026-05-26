# GPT-5.5 Pro Checkpoint — Demo Cockpit Readiness Before Browser / QA Path

## Context

We are building Alan's ServiceNow Automation / Service Desk Workflow Cockpit project as a portfolio-grade, safety-first demo for internal transfer and future job interviews.

The current product direction is no longer an email-only tool. Alan clarified that real Service Desk intake may come from:

- Teams messages
- Self-service tickets
- ServiceNow Chat
- Shared mailbox/email
- Manual paste / other adapters

Target product framing:

```text
Multi-channel Intake Queue
→ Source Review / cleanup
→ AI-assisted TicketDraft
→ Incident required-field checklist
→ Safe copy/export
→ Runtime/safety posture
→ future ServiceNow adapter only after safety checkpoints
```

## Current implemented baseline

Recently completed and pushed:

- #37 — demo queue before TicketDraft.
- #43 — generalized demo queue into multi-channel Intake Hub.
- #38 — multi-channel source cleanup/normalization.
- #39 — Incident field review checklist based on Alan's sanitized ServiceNow create-form screenshot.
- #40 — local-only safe copy/export actions.
- #42 — static runtime/safety posture panel.

Open / pending:

- #41 — fake P1/P2 high-severity alert simulator.
- #36 — parent demo cockpit planning issue.
- #33 — Windows dedicated Chromium `about:blank` smoke field trial.
- #30 — GPT checkpoint for QA post-login read-only exploration.

## Real Incident form reference from Alan

Alan provided a screenshot of an actual ServiceNow Incident create form. Sanitized required/starred fields visible:

- Requester
- Category
- Location
- Channel
- Impact
- Urgency
- Assignment group
- Short description

Important supporting fields:

- Description
- Work notes
- Additional comments / customer-visible comments
- Subcategory
- Configuration item
- Business service
- Service offering
- Priority, likely derived from Impact + Urgency
- Assigned to
- Related Search / Knowledge & Catalog

## Current safety posture

The current demo path is fake/sanitized/local-only.

Still forbidden:

- Real Teams / Graph access.
- Real Outlook / mailbox access.
- Real ServiceNow Chat / API.
- Real self-service ticket polling.
- Real ServiceNow URL/login/DOM/page inspection.
- Browser screenshots / HAR / traces / video / cookie or session export.
- Real ServiceNow field fill.
- Save / Submit / Update / Close.
- Real email send or attachment upload.
- External AI with real ServiceNow/mailbox/chat content.

## Verification already done after latest pushed baseline

- `pnpm build`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- Safety scan over new commits: PASS
- Independent review over overnight commits: PASS

## Planned next stage

Before going near real browser/QA work, we want to decide:

1. Whether to implement #41 fake P1/P2 high-severity alert simulator now.
2. Whether the mock cockpit is already enough for a June 5 demo after UI polish.
3. Whether #33 `about:blank` browser smoke should remain a technical safety validation or be deferred until after the mock demo is polished.
4. What exact conditions are required before #30 QA post-login read-only exploration.

## Please review

Please evaluate the project direction and next plan from a product, demo, hiring-manager, and safety perspective.

Questions:

1. Is the current mock cockpit direction strong enough for Alan's June 5 demo without touching real ServiceNow?
2. Should #41 fake P1/P2 high-severity simulator be implemented before UI polish and demo recording, or deferred?
3. What are the top 5 mandatory UI/content polish items before recording a 3–5 minute demo?
4. Does the product story clearly differentiate Alan from a regular Service Desk agent?
5. Is the multi-channel intake framing better than email-first for demo customer and future companies?
6. Should #33 `about:blank` smoke be done now, or kept as a separate technical validation after mock demo acceptance?
7. What exact READY WITH CONDITIONS gates must be satisfied before any QA login/read-only exploration?
8. What should be cut if time is tight?

## Required verdict format

Please answer with one of:

- READY
- READY WITH CONDITIONS
- NOT READY

Then provide:

- Required conditions
- Recommended next 3 tasks
- Explicit no-go boundaries
- Suggested 3–5 minute demo storyline
- Any resume/interview positioning language this project now supports

## Important

Do not recommend real ServiceNow writes, Save/Submit/Update/Close, real mailbox/Teams/Graph access, or external AI on real enterprise content for the next demo path. If you recommend browser/QA work, it must be staged separately and safety-gated.
