# GPT-5.5 Pro Top-Level Input: Service Desk Cockpit from Real Workflow Evidence

Date: 2026-05-22
Status: sanitized external-ready planning input
Checkpoint token: SDA_TOP_LEVEL_WORKFLOW_EVIDENCE_2026_05_22

## How to use this file

Paste this document into GPT-5.5 Pro as the only evidence package for the top-level architecture / product strategy pass.

Do not paste raw workflow recordings, raw transcripts, screenshots, ticket text, ServiceNow pages, repository diffs, patch output, HAR files, traces, cookies, sessions, credentials, storage-state files, real URLs, ticket numbers, customer names, requester names, or any unreviewed enterprise content into an external AI system.

If GPT asks for raw evidence, refuse and continue from this sanitized synthesis only.

## Safety and privacy boundary

This document intentionally does not include:

- real requester names;
- real stakeholder names;
- real ticket numbers;
- internal URLs or hostnames;
- raw chat/email body text;
- spreadsheet row values;
- screenshots or OCR from screens;
- credentials, cookies, OAuth codes, sessions, tokens, or profile data;
- raw audio/video/transcript excerpts beyond high-level paraphrase.

Use this only as architecture/product input. Future implementation must keep ServiceNow writes behind explicit action-specific gates and must prefer mock, dry-run, manual-copy, and manual-fill-assisted paths first.

## Evidence reviewed safely

### Workflow recordings

A local-only workflow evidence set contains 10 recordings totaling about 230 minutes. The first pass used low-resolution contact sheets sampled at intervals. The analysis stayed at workflow and interface-category level; it did not OCR, quote, transcribe, or export visible enterprise/customer content.

High-level themes observed across the recordings:

| Recording group | Approx duration | Sanitized workflow themes observed |
|---|---:|---|
| Early short workflow clips | 2-16 min each | Ticket form/list work, chat/email reference, structured updates, spreadsheet reconciliation |
| Midday longer workflows | 31-48 min each | Ticket form validation, portal/form checks, ServiceNow-style chat panels, documentation lookup, Excel tracker reconciliation |
| Remote-support-heavy workflows | 21-62 min each | Endpoint/browser/settings troubleshooting, vendor/download/resource lookup, evidence capture, guided/knowledge-assisted ticket handling |

### Schedule and positioning constraints

Non-attributed local planning context was reduced to project constraints only:

- target a stable field-trial-ready slice by 2026-05-29;
- reserve 2026-06-01 to 2026-06-05 for QA trial, polish, documentation, training, and demo packaging rather than heavy new feature work;
- the project should demonstrate Service Desk workflow understanding, AI-assisted safety, human-in-the-loop compliance, and measurable business value without production writes.

## Executive summary for GPT-5.5 Pro

The real workflow evidence validates that this project should not be framed as a simple ServiceNow form autofill utility. The useful product is a local-first, privacy-aware Service Desk workflow cockpit.

North-star thesis:

```text
A human-in-the-loop Service Desk workflow cockpit that turns multi-channel support intake into safe, reviewable Incident drafts, Work Notes, routing plans, environment-aware QA readiness checks, and local dry-run reporting — without exposing enterprise data or performing uncontrolled writes.
```

The compressed schedule changes the product strategy:

```text
2026-05-29: field-trial-ready safe vertical slice
2026-06-01 to 2026-06-05: QA trial(s), bug fixes, demo recording, profile/resume/interview packaging, and training
```

The immediate target is not broad automation. It is a safe, demonstrable, QA-testable vertical slice that proves workflow understanding and compliance discipline.

## Observed real workflow model

Across recordings, support work repeatedly follows this pattern:

```text
Intake / notification
→ open or locate ServiceNow / ITSM ticket
→ read user problem + historical activity
→ inspect required ServiceNow metadata
→ cross-check context in mail, chat, portals, attachments, spreadsheets, or remote session
→ contact requester / internal team if facts are missing
→ update structured fields and Work Notes / reply draft
→ route / assign / wait / resolve / close depending on outcome
→ record or reconcile status in spreadsheet / tracking list
```

Product implication: the cockpit must expose the decision state and evidence state, not just generate text.

## Recurring surfaces observed

### ITSM / ServiceNow-like surfaces

- ticket/task/incident/request forms;
- list / queue views;
- assignment, state/status, category/subcategory/service-like fields;
- requester/contact/channel fields;
- short description, description, work notes, customer-visible comments;
- resolution / closure fields;
- activity stream / historical notes;
- related tasks / attachments;
- agent-assist / knowledge / chat side panels.

### Collaboration and intake surfaces

- Teams-like enterprise chat;
- embedded cards/forms in chat;
- shared screenshots/images;
- Outlook-like email read/reply flows;
- self-service request forms;
- status notifications and follow-up messages;
- phone-call notes.

### Evidence and execution surfaces

- Excel/spreadsheet trackers;
- vendor/download/resource portals;
- internal file/document repositories;
- remote desktop / remote support sessions;
- Windows Settings / browser settings / app install or login screens;
- annotation/screenshot tools;
- PDF/image/document previews.

## Requirements derived from evidence

### 1. Multi-channel intake normalization

Real intake is not email-first. It can arrive from chat, ServiceNow Chat, shared mailbox, phone call, self-service ticket, existing queue item, or notification.

Requirements:

- Keep a multi-channel Intake Queue.
- Preserve original source channel while mapping to ServiceNow channel taxonomy.
- Allow Teams/chat and ServiceNow Chat to both map to `Chat` while retaining the original source label.
- Support phone-call/manual-note intake with no written source thread.

### 2. Contact / confirmation state

Many tickets need missing facts confirmed before field mapping is reliable.

Requirements:

- Model confirmation states: Confirmed, Needs confirmation, Pending requester, Pending internal team.
- Show missing facts explicitly: impact, urgency, affected service, requester, device/account, reproduction steps, evidence attachments.
- Prevent the UI from implying a ticket is ready when core facts are missing.

### 3. Structured Incident field review

The agent manages required ServiceNow fields, not only free text.

Visible field families should include:

- Requester / caller;
- Channel / contact type;
- Category;
- Subcategory;
- Location / region when relevant;
- Impact;
- Urgency;
- Priority;
- Assignment group;
- Short description;
- Description;
- Work Notes;
- Customer-visible comments when needed.

Keep less-common fields collapsed to avoid UI crowding.

### 4. Two-stage routing

The real workflow suggests two-stage routing:

```text
Stage 1 — Service Desk handling / normalization
Stage 2 — Final support group routing
```

This should be visible in the UI because it mirrors how Service Desk triage reduces misrouting.

### 5. Work Notes plan, not automatic Save

Work Notes are central, but Save is a real write action.

Requirements:

- Use `Prepare Work Notes` / `Copy Work Notes` language.
- Do not say or imply `Save to ServiceNow` unless a separate QA write checkpoint approves it.
- Keep internal work notes separate from requester-visible comments.
- Require action-specific approval for Save / Submit / Update / Resolve / Close.

### 6. Remote-support-aware assistance

Longer workflows include remote troubleshooting and repeated validation steps.

Requirements:

- Add remote-support-aware fake scenarios.
- Add a collapsed `Troubleshooting checklist` or `Remote support evidence summary` panel.
- Candidate scenario: app install / launch / login / repair issue.
- The app may suggest steps and generate notes, but must not automate remote sessions in P0/P1.

### 7. Evidence / attachment review

Recordings show screenshots, PDFs/images, table-like evidence, and downloads/uploads.

Requirements:

- Add local-only evidence state: screenshot / document / table / none.
- Add review state: not reviewed / reviewed / needs manual check.
- No real OCR, upload, attachment scraping, or external AI on raw attachments in the next slice.

### 8. Spreadsheet reporting / archival

Excel-like tracking is part of the real workflow.

Requirements:

- Keep Excel reporting as local dry-run first.
- Generate local XLSX/CSV/Markdown artifacts from sanitized row preview.
- No Microsoft Graph, Excel Online, cloud workbook write, company workbook connection, or ServiceNow write side effect.
- Include safety evidence columns such as approval gate, stop-rule check, QA isolation check, dry-run outcome, and QA trial result.

### 9. Environment-aware readiness

The tool should support Mock, QA, Dev, and Production Shadow without changing write gates accidentally.

Requirements:

- Mock mode requires no URL and never writes.
- QA/Dev may accept a configured ServiceNow URL, but still require explicit approval before any real write.
- Production Shadow is read-only/shadow-only: no Save, Submit, Update, Resolve, Close, or bulk action.
- Custom URL settings must not modify `allowsRealSubmit`, `shadowOnly`, or action gates.

## Current implementation status reported by local agent

Latest local state after the current implementation pass:

- Local Service Desk cockpit exists in Electron + React + TypeScript.
- Multi-channel fake queue, source review, Incident Draft, Work Notes Plan, two-stage routing, Excel dry-run row preview, and safety panels exist.
- Local deterministic XLSX dry-run artifact generation is implemented in core and exposed in desktop UI as a local download path.
- ServiceNow Environment URL settings are implemented as local React state with strict validation and visible `Write gate unchanged` copy.
- URL validation blocks mock URLs, non-HTTPS, credentials in URLs, non-ServiceNow host suffixes, query/hash payloads, and sensitive path payloads.
- Production Shadow remains `shadowOnly=true` and `allowsRealSubmit=false` regardless of URL settings.
- QA/Dev still require explicit approval before real writes.
- No Graph, cloud workbook, ServiceNow API write, browser DOM autofill, or production write has been added.

Latest verification reported locally before this checkpoint; re-run before any actual QA trial:

```text
pnpm --filter @servicenow-automation/core test -- service-desk-workflow.test.ts  PASS
pnpm --filter @servicenow-automation/profiles test -- service-now-environments.test.ts  PASS
pnpm --filter @servicenow-automation/desktop test -- App.test.ts  PASS
pnpm --filter @servicenow-automation/desktop build  PASS
pnpm typecheck  PASS
```

## Recommended architecture

### Layer 1 — Intake and normalization

Inputs:

- fake/sanitized demo scenarios;
- manual paste from chat/email/portal/call notes;
- future local import;
- future read-only queue export after separate checkpoint.

Outputs:

- `CapturedContext`;
- source type/channel/language;
- sanitized text;
- missing-info flags;
- evidence metadata.

### Layer 2 — Draft and field mapping

Inputs:

- `CapturedContext`;
- local project profile;
- deterministic templates;
- future optional provider output after redaction.

Outputs:

- `TicketDraft`;
- required field preview;
- category/subcategory/assignment/priority suggestions;
- description / work notes / customer comment separation;
- confidence and missing-field metadata.

### Layer 3 — Workflow plan

Outputs:

- confirmation state;
- two-stage routing plan;
- work notes plan;
- requester follow-up draft;
- troubleshooting checklist;
- evidence review state.

### Layer 4 — Safety gate

Responsibilities:

- environment mode enforcement;
- action-specific approval phrases;
- target URL validation;
- production-shadow denial regardless of approval;
- Save / Submit / Update / Resolve / Close separation;
- QA isolation confirmation before any manual-fill readiness.

### Layer 5 — Local reporting/export

Near-term:

- local CSV row preview;
- local Markdown summary;
- deterministic local XLSX dry-run artifact;
- no Graph / Excel Online / cloud workbook write;
- no company workbook connection.

### Layer 6 — Environment configuration

Profiles:

- Mock Demo;
- QA Test;
- Development Test;
- Production Shadow.

Each environment should expose:

- label;
- allowed actions;
- credential policy;
- target display / masked host preview;
- write restrictions;
- warning copy;
- `Write gate unchanged` when URLs are customized.

### Layer 7 — Optional external provider layer

Future design only until core safety is stable:

- OpenAI-compatible providers;
- Claude/OpenAI/Gemini/DeepSeek/custom base URL options;
- local/mock provider remains default;
- redaction preview before external send;
- provider disabled by default;
- no real workplace content sent externally unless a sanitized payload is explicitly approved.

## Data model suggestions

Ask GPT-5.5 Pro to review or improve these shapes:

```ts
type IntakeSourceType =
  | "teams_chat"
  | "servicenow_chat"
  | "shared_mailbox"
  | "phone_call"
  | "self_service"
  | "existing_ticket"
  | "manual_note";

type ConfirmationState =
  | "confirmed"
  | "needs_confirmation"
  | "pending_requester"
  | "pending_internal_team";

type EvidenceReviewState =
  | "none"
  | "not_reviewed"
  | "reviewed"
  | "needs_manual_check";

type WorkflowStage =
  | "intake"
  | "source_review"
  | "confirmation"
  | "incident_draft"
  | "service_desk_handling"
  | "final_assignment"
  | "work_notes"
  | "reporting_dry_run";
```

Core entities:

- `CapturedContext` — sanitized source text, original channel, normalized channel, source language, missing facts.
- `EvidenceSummary` — evidence type, review state, safe extracted facts, no raw file content.
- `TicketDraft` — ServiceNow field mapping and editable draft text.
- `RoutingPlan` — Stage 1 Service Desk handling and Stage 2 final assignment.
- `WorkNotesPlan` — internal notes, requester-visible comment draft, safety notes.
- `ExcelDryRunRow` — sanitized reporting row.
- `ExcelDryRunWorkbookArtifact` — deterministic local XLSX bytes and metadata.
- `ServiceNowEnvironmentProfile` — mode, URL validation state, write policy, warning copy.
- `AiProviderConfig` — disabled-by-default provider settings and redaction policy.
- `AuditEvent` — local-only safety/readiness events without real ticket data.

## P0 / P1 / P2 roadmap recommendation

### P0 — Before 2026-05-29

Goal: field-trial-ready safe vertical slice.

Must have:

1. Stable mock cockpit with fake/sanitized scenarios.
2. Manual-fill ServiceNow field mapping preview.
3. Work Notes Plan and copyable output.
4. Local XLSX / CSV / Markdown dry-run reporting.
5. Environment URL settings with unchanged write gates.
6. QA single-ticket manual-fill runbook.
7. Safety checklist and stop rules.
8. Sanitized 3-5 minute demo script.
9. GPT-5.5 Pro checkpoint verdict before any real QA write.

Cut if time is tight:

- real integrations;
- external AI provider implementation;
- browser DOM autofill;
- production shadow execution;
- attachment OCR;
- remote desktop automation;
- bulk ticket handling.

### P1 — 2026-06-01 to 2026-06-05

Goal: QA trial, bug fix, polish, and presentation packaging.

Candidate work:

1. One controlled QA single-ticket manual-fill trial using fake/sanitized data, only if approved.
2. Fix UI/readability issues found in QA rehearsal.
3. Add or refine recording-derived scenarios.
4. Add evidence review / remote troubleshooting checklist if not already done.
5. Record demo video / screenshots using fake data only.
6. Prepare resume/interview bullet points and architecture diagrams.

### P2 — Design only until P0/P1 pass

Goal: define next-stage architecture without executing risky actions.

Candidate designs:

1. Production Shadow mode:
   - read-only comparison only;
   - no Save/Submit/Update/Resolve/Close;
   - no screenshots/HAR/traces/storage-state;
   - no raw real ticket content in repo or external AI;
   - compare generated draft vs human manual handling.
2. External AI provider layer:
   - provider disabled by default;
   - local mock remains default;
   - redaction preview and payload diff before send;
   - no raw enterprise content;
   - provider credentials outside repo.
3. Service Desk Cockpit expansion:
   - more fake scenarios;
   - evidence review state;
   - remote troubleshooting checklist;
   - richer audit/readiness reporting;
   - eventual dedicated browser/runtime design behind a separate checkpoint.

## QA safety gate proposal

Before first QA ticket creation, require:

```text
QA environment confirmed
+ fake/sanitized content only
+ one ticket only
+ manual-fill assisted
+ no browser DOM autofill
+ no ServiceNow API write
+ no bulk create
+ no production
+ no external AI on QA/customer text
+ action-specific approval phrase immediately before the write
+ sanitized outcome note only
```

Stop immediately if:

- environment identity is unclear;
- browser/profile isolation is uncertain;
- any real customer/user data appears in the app or repo;
- any URL contains credentials, query/hash payload, token/session/sys_id-like data;
- the tool tries to auto-fill DOM or call ServiceNow API;
- the tool tries Save/Submit/Update/Resolve/Close without the matching approval phrase;
- screenshots, traces, cookies, storage-state, or sessions would be stored;
- production shadow is about to perform a real write.

## Demo story

Recommended story:

```text
Real Service Desk work is a multi-system workflow, not just a ticket form. Analysts switch between ITSM queues, chat, email, spreadsheets, remote support sessions, vendor portals, Windows settings, screenshots, and knowledge articles. I built a local-first Service Desk Cockpit that normalizes multi-channel intake, identifies missing facts, maps ServiceNow Incident fields, separates internal Work Notes from requester-visible comments, shows two-stage routing, generates local XLSX dry-run evidence, and keeps all real writes behind action-specific human approval gates.
```

Short resume/interview wording:

```text
Designed and built a human-in-the-loop Service Desk workflow cockpit that converts multi-channel support requests into reviewable ServiceNow Incident drafts, routing plans, Work Notes, and dry-run reporting artifacts, with explicit safety gates for QA and production boundaries.
```

## Direct request to GPT-5.5 Pro

You are GPT-5.5 Pro acting as a senior product architect and AI-for-ITSM strategy advisor.

Please first quote this token exactly so I know you read the current prompt:

```text
SDA_TOP_LEVEL_WORKFLOW_EVIDENCE_2026_05_22
```

I am building a privacy-aware Service Desk Cockpit for ServiceNow-style work. The source evidence is sanitized from real workflow recordings and non-attributed planning constraints. Do not ask for raw video/audio/tickets. Use only this sanitized synthesis.

Goal:

Create a top-level architecture, product direction, and compressed execution plan that helps me show business value quickly while preserving strict safety boundaries.

Hard constraints:

- no production writes;
- no real ServiceNow API write in this phase;
- no browser DOM autofill in this phase;
- no raw ticket/user/chat/email content in external AI prompts;
- local dry-run/manual-copy/manual-fill first;
- Save-only readiness before any later Submit/Update/Close checkpoint;
- clear environment separation: Mock, QA, Dev, Production Shadow;
- stakeholder-friendly local XLSX dry-run reporting is important;
- QA is safer than production but still requires explicit gates.

Please produce:

1. North-star product thesis.
2. System architecture diagram description.
3. Module breakdown.
4. Data model suggestions.
5. P0/P1/P2 roadmap under the 2026-05-29 and 2026-06-05 constraints.
6. QA and safety gates.
7. First controlled QA single-ticket recommendation: READY / READY WITH CONDITIONS / NOT READY.
8. Exact conditions before first QA ticket.
9. First fake/sanitized QA scenario and mandatory fields.
10. Demo narrative for technical and operational stakeholders.
11. Risks and mitigations.
12. What to build next after the current local XLSX + environment URL settings slice.
13. Resume/interview positioning language.

Important: do not recommend uncontrolled Save, Submit, Update, Resolve, Close, bulk actions, production-shadow writes, external AI on raw workplace data, or real integrations before the separate gates are satisfied.
