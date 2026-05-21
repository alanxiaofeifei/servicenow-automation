# Field Workflow Recording Analysis — 2026-05-21

## Purpose

This document summarizes Alan's 2026-05-21 Service Desk workflow recordings into safe, product-useful observations for the ServiceNow Automation / Service Desk Workflow Cockpit project.

Source recordings and generated contact sheets are local-only artifacts under `.local/` / the user's video folder and must not be committed. This document intentionally excludes raw customer text, ticket numbers, URLs, emails, names, screenshots, OAuth codes, credentials, cookies, sessions, or exact ServiceNow data.

## Source inventory

10 local workflow recordings were found, totaling about 230 minutes:

| Recording | Duration |
|---|---:|
| 2026-05-21 08-42-21.mp4 | 6.14 min |
| 2026-05-21 09-11-49.mp4 | 16.07 min |
| 2026-05-21 09-32-24.mp4 | 2.77 min |
| 2026-05-21 09-45-56.mp4 | 4.66 min |
| 2026-05-21 10-03-31.mp4 | 34.87 min |
| 2026-05-21 11-28-08.mp4 | 31.06 min |
| 2026-05-21 12-41-42.mp4 | 48.14 min |
| 2026-05-21 14-54-48.mp4 | 2.73 min |
| 2026-05-21 15-04-06.mp4 | 21.55 min |
| 2026-05-21 16-58-35.mp4 | 62.39 min |

Method used for this first pass:

1. Generate low-resolution contact sheets at roughly 30–60 second intervals.
2. Visually inspect only high-level workflow stages and interface types.
3. Do not OCR or transcribe sensitive visible enterprise/customer content.
4. Convert repeated patterns into product requirements and demo scenario candidates.

## High-confidence observed workflow pattern

Across recordings, the repeated real-world flow is:

```text
Intake / notification
→ open or locate ServiceNow / ITSM ticket
→ read user problem + historical activity
→ check fields and required ServiceNow metadata
→ cross-check context in mail, chat, portals, attachments, or remote session
→ contact or confirm with requester / internal team when needed
→ update structured fields and Work Notes / reply draft
→ route / assign / wait / resolve / close depending on outcome
→ record or reconcile status in a spreadsheet or tracking list
```

This validates the current product direction: the value is not only "form filling". The stronger product story is a multi-channel Service Desk workflow cockpit that reduces context switching and produces safe, reviewable ticket actions.

## Interface types visible in the recordings

The first pass repeatedly identified these interface categories:

- ServiceNow / ITSM ticket details, queues, field forms, activity / notes areas.
- Shared mailbox or email-style message reading panes.
- Teams / enterprise chat and collaboration threads.
- ServiceNow Chat or chatbot-style support conversation flows.
- Self-service ticket intake and request details.
- Remote support / remote desktop sessions into user or target environments.
- Windows desktop troubleshooting windows, including browser, settings, file explorer, login, and app install/update screens.
- Internal business / admin portals for user, asset, account, entitlement, or service lookup.
- Knowledge base / internal documentation / historical reference pages.
- Attachments, screenshots, PDF/image previews, logs, and table-like evidence.
- Excel / spreadsheet / grid tracking views used for status tracking or reporting.

## Workflow themes to model in product

### 1. Multi-channel intake normalization

Real intake is not email-first. It can arrive from:

- Teams message
- ServiceNow Chat
- Shared mailbox / email
- Phone call
- Self-service ticket
- Existing ticket queue / notification

Product requirement:

- Keep the current multi-channel queue.
- Preserve source channel details while also mapping to ServiceNow's channel taxonomy.
- Make it clear that Teams and ServiceNow Chat can both map to `Chat` while retaining the original source label.

### 2. Contact / confirmation as a first-class state

The recordings and current real workflow both show that many tickets require confirmation before field mapping is reliable.

Product requirement:

- Keep `Contact / confirmation` before Incident draft finalization.
- Model statuses such as:
  - Confirmed
  - Needs confirmation
  - Pending requester
  - Pending internal team
- Show missing facts explicitly: impact, urgency, affected service, requester, device/account, reproduction steps, attachment evidence.

### 3. Structured Incident field review

Repeated ServiceNow form interactions show that the agent has to manage structured fields, not just free text.

Product requirement:

- Continue to emphasize required-field review.
- Suggested visible fields:
  - Requester
  - Channel / contact type
  - Category
  - Subcategory
  - Location / region when relevant
  - Impact
  - Urgency
  - Priority
  - Assignment group
  - Short description
  - Description
  - Work Notes
- Keep less-common fields collapsed to avoid UI crowding.

### 4. Two-stage routing

The real workflow suggests a two-stage routing pattern:

1. Service Desk takes or owns the ticket first for review / normalization.
2. Final assignment group is selected after classification and context gathering.

Product requirement:

- Keep the current two-stage routing plan.
- Make the distinction more visible in the UI:
  - `Stage 1 — Service Desk handling`
  - `Stage 2 — Final support group routing`
- The demo should explain why this matters: it mirrors actual Service Desk triage and reduces misrouting.

### 5. Work Notes plan, not automatic Save

Recordings show Work Notes / activity updates are central, but `Save` is a real write action.

Product requirement:

- Keep Work Notes as a planned, editable, copyable artifact.
- Do not imply the app has written to ServiceNow unless a separate QA write checkpoint approves it.
- Copy should say `Prepare Work Notes` / `Copy Work Notes`, not `Save to ServiceNow`.

### 6. Remote support and runbook assistance

The longer recordings show remote support / user-side troubleshooting and repeated validation steps.

Product requirement:

- Add remote-support-aware demo scenarios, but keep them local and fake first.
- Model a `Remote support evidence summary` or `Troubleshooting checklist` panel.
- Candidate scenario: Microsoft Teams install / launch / login / repair issue.
- The app can suggest steps and generate notes, but must not automate the remote session in P0.

### 7. Attachment and evidence handling

Recordings show repeated use of screenshots, documents, table-like evidence, and downloads/uploads.

Product requirement:

- Add an attachment/evidence checklist in the source review area.
- First implementation should be deterministic and fake:
  - `Screenshot reviewed`
  - `Error text extracted manually / not extracted`
  - `Evidence linked to Work Notes`
- Real OCR / attachment upload should be P0.5 or later.

### 8. Spreadsheet reporting / archival

Recordings and Alan's real process both show Excel-like tracking after ticket handling.

Product requirement:

- Current Excel dry-run row preview is validated by real workflow evidence.
- Keep it dry-run until a later checkpoint approves real workbook integration.
- Add fields only if they support QA field trials and demo clarity.

Recommended dry-run row fields:

- Created At
- Intake Source
- ServiceNow Channel
- Requester Display
- Service Desk Team / Language
- Issue Type
- Category
- Subcategory
- Priority
- Short Description
- Service Desk owner / initial group
- Final Assignment Group
- Confirmation State
- Work Notes Summary
- Handling Status
- QA Trial Result
- Dry-run Result

### 9. Cross-system context aggregation

The recordings repeatedly show manual switching between many browser tabs and applications.

Product requirement:

- Product value statement should emphasize: `reduce context switching`, `make decision state visible`, `keep human control`.
- Demo should show multiple source cards feeding one Incident Draft rather than a single pasted text box.

## Demo scenarios derived from recordings

Use fake sanitized data only.

### Scenario A — Chat intake to Incident routing

- Source: Teams message or ServiceNow Chat.
- User reports an access or application issue.
- App maps original source to ServiceNow channel `Chat`.
- Missing facts are highlighted.
- Incident draft is created.
- Two-stage routing plan is shown.
- Work Notes and Excel dry-run row are generated.

### Scenario B — Shared mailbox with attachment evidence

- Source: Shared mailbox item.
- User email includes a screenshot / document reference.
- App normalizes the issue and marks evidence review state.
- Draft recommends category, priority, description, and Work Notes.
- Excel dry-run row records evidence state.

### Scenario C — Phone call intake

- Source: Phone call.
- App shows manual notes from a call, confirmation state, and missing facts.
- Draft is prepared without assuming a written source exists.
- This demonstrates real Service Desk coverage beyond email/chat.

### Scenario D — Self-service ticket requiring SD normalization

- Source: Self-service ticket.
- User-created ticket has poor description or wrong routing.
- Service Desk stage normalizes Description / Work Notes, then final routing stage transfers to the right group.

### Scenario E — Remote support / Teams troubleshooting

- Source: existing ticket + remote support session.
- App shows a local runbook checklist for app install/login/launch repair.
- Work Notes summarize checks performed and outcome.
- No real remote automation in P0.

## Product implications

### What to build next

1. Add recording-derived fake scenarios to the Intake Queue.
2. Add `Evidence / attachment review` state to Source Review.
3. Add `Remote support / troubleshooting checklist` as a collapsed, local-only panel.
4. Add `Confirmation State` and `QA Trial Result` to Excel dry-run preview if UI remains readable.
5. Create a short `Demo Flow` guide inside the app or docs so Alan can present the product as real Service Desk workflow expertise.

### What not to build next

Do not spend P0 time on:

- Real Teams / Graph integration.
- Real Outlook / shared mailbox ingestion.
- Real ServiceNow Chat polling.
- Real remote desktop control.
- Real attachment OCR / upload.
- Microsoft Graph / Excel Web writes.
- Bulk ticket creation.
- Production-shadow use.

## Confidence and limitations

Confidence is high for the repeated workflow pattern and interface categories. Confidence is lower for exact field names, exact final ticket outcomes, and detailed root causes because this first pass used low-resolution contact sheets and intentionally avoided reading sensitive visible content.

Before any real QA write path, use Alan's QA environment only through a staged, explicit approval flow with fake/sanitized ticket content and stop rules.
