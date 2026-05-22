# Field-Trial Demo Flow Script (3–5 Minutes)

## Audience

Hiring manager, Service Desk lead, or technical reviewer who wants to understand the business value quickly.

## Core message

Service Desk work is not just text generation. Agents must collect context across channels, normalize noisy intake, confirm missing facts, map required ServiceNow fields, plan internal work notes, route to the right group, and maintain reporting evidence.

This demo shows a human-in-the-loop cockpit that speeds up that workflow while staying safe: fake/sanitized data only, local deterministic draft generation, no ServiceNow API, no browser DOM autofill, no auto-submit, and Excel dry-run only.

## Safety line to say upfront

"This is a fake/sanitized QA rehearsal. The app prepares drafts and evidence; it does not write to ServiceNow, does not call ServiceNow APIs, does not autofill a browser, and does not use real customer data. Any real QA Save, Submit, Update, or Close would require a separate exact approval phrase."

## 3–5 minute script

### 0:00–0:30 — Problem and context

Say:

"In real Service Desk work, the hard part is not only writing a ticket. The agent has to track intake from Teams, chat, self-service, shared mailbox, or remote support; clean the noisy context; decide what must be confirmed; map ServiceNow fields; write internal work notes; route to the right group; and often keep an Excel-style evidence trail. This cockpit turns that into a reviewable workflow."

Show:

- Hero: `ServiceNow Automation`.
- Stage strip: `Queue -> Source Review -> TicketDraft`.
- Runtime / Safety panel.
- Environment mode cards.

Point out:

- Demo mode is ON.
- Real ServiceNow is OFF.
- Auto-submit is disabled.
- Data is fake/sanitized only.

### 0:30–1:10 — Intake queue and source review

Say:

"The queue is multi-channel rather than email-first. I can start from a fake Teams-style VPN intake, but the same cockpit also models self-service, chat, and shared mailbox sources. The source review separates raw sanitized context from cleaned, normalized facts."

Show:

- Intake Queue.
- Default `Teams note: VPN connection issue after password reset` item.
- Source channel badge.
- Raw vs Cleaned Source.

Point out:

- Fake requester only.
- No live Teams, mailbox, portal, attachment, or ServiceNow connection.
- The selected default field-trial scenario is `vpn-issue`.

### 1:10–1:55 — Incident draft and field mapping

Say:

"The draft is not submitted automatically. It is a review workspace. It proposes short description, description, work notes, category, subcategory, assignment group, impact, urgency, and priority. The human agent still owns the final decision."

Show:

- Editable Incident Draft.
- Category `Network` and subcategory `VPN`.
- Assignment group `Demo Network Support`.
- Mock ServiceNow Incident Preview.

Point out:

- Requester, category, location, channel, impact, urgency, assignment group, and short description are treated as required-field review points.
- Mock form is a visual rehearsal, not a real QA browser.
- Submit / Save / Update / Close are disabled in demo mode.

### 1:55–2:35 — Real workflow structure from recordings, but sanitized

Say:

"From real workflow observation, I modeled the repeated stages without carrying over private content: intake, confirmation, incident draft, Service Desk ownership, final assignment, work notes, and reporting. The app now exposes those as explicit workflow stages."

Show:

- Service Desk workflow preview.
- Contact / confirmation state.
- Routing Plan: Stage 1 Service Desk Handling and Stage 2 Final Assignment.
- Work Notes Plan.

Point out:

- The workflow mirrors real operational shape while using only fake/sanitized examples.
- Confirmation state helps prevent low-quality ticket creation.
- Save is explicitly called out as a write action, not a harmless step.

### 2:35–3:20 — Excel dry-run evidence

Say:

"Many support workflows need a reporting trail. Instead of connecting to Excel or Graph immediately, the app generates a local dry-run row and copyable CSV/Markdown. This keeps reporting testable without creating another integration risk."

Show:

- Excel Dry-run Row Preview.
- Fields: Fake Scenario ID, Required Field Check, Approval Phrase Gate, Stop Rule Check, QA Isolation Check, QA Dry-run Outcome, QA Trial Result, Dry-run Result.
- Copy CSV Row / Copy Markdown Summary.

Point out:

- No workbook is connected or written.
- The row records QA readiness and stop-rule evidence.
- This can become the audit pattern for a later approved Excel Web integration.

### 3:20–4:15 — Controlled QA single-ticket gate

Say:

"For the first QA field trial, the tool remains manual-fill assisted. It previews the field mapping and requires action-specific approval phrases. A Submit approval does not approve Save, Update, or Close. This prevents accidental writes."

Show:

- Controlled QA single-ticket smoke panel.
- Required approval phrase.
- Action-specific approval phrases:
  - `I APPROVE QA SAVE ONLY`
  - `I APPROVE QA SUBMIT ONLY`
  - `I APPROVE QA UPDATE ONLY`
  - `I APPROVE QA CLOSE ONLY`
- Stop rules.
- `productionWriteAllowed=false`.

Point out:

- Manual fill only.
- Single ticket only.
- No DOM autofill.
- No ServiceNow API.
- No bulk create.
- QA isolation must be confirmed before any real Save or Submit.

### 4:15–5:00 — Business value and next steps

Say:

"The value is that the agent gets a safer, structured cockpit: faster draft preparation, clearer missing-information checks, more consistent field mapping, safer routing, and dry-run evidence. The next step is not broad automation; it is one controlled QA single-ticket trial using the runbook, then bug fixes based on what QA reveals."

Show:

- QA runbook path: `docs/field-trial/qa-single-ticket-manual-fill-runbook.md`.
- Safe smoke checklist path: `docs/field-trial/qa-single-ticket-safe-smoke-checklist.md`.
- Emphasize fake scenario, dry-run/manual-copy first, Save-only readiness, and stop rules.

Close with:

"This project is intentionally safety-first: the AI drafts and explains; the human reviews and approves; the system blocks uncontrolled writes."

## Short version (90 seconds)

"This cockpit models a real Service Desk workflow using fake/sanitized data. Intake comes from multiple channels, then Source Review cleans it up, the Ticket Draft maps ServiceNow fields, and the Workflow Preview shows confirmation, routing, work notes, and Excel dry-run evidence. The QA smoke gate is manual-fill only: no ServiceNow API, no DOM autofill, no bulk create, and no production writes. Each write action has its own phrase, such as `I APPROVE QA SAVE ONLY` or `I APPROVE QA SUBMIT ONLY`. The business goal is to reduce ticket preparation time while keeping human accountability and privacy controls."

## Demo checklist

Before recording or presenting:

- App starts in warm/light theme.
- Default scenario is VPN fake QA scenario.
- Queue has exactly fake/sanitized items.
- Source Review shows raw and cleaned fake context.
- Mock Incident Preview is clearly labeled mock/demo.
- Excel dry-run fields include QA readiness and approval gates.
- Controlled QA single-ticket smoke panel shows action-specific phrases and stop rules.
- No real host, ticket ID, user, email, chat, recording text, screenshot, cookie, or session is visible.
- No production or production-shadow write path is shown.
