# Legacy AIA SD Tool Product Patterns

Issue: #35  
Source: Alan's local legacy SD Tool package and manuals under `/mnt/d/Documents/SD_Tool`  
Status: sanitized research note — **do not commit source manuals or sensitive values**

## Why this matters

The legacy AIA SD Tool was not just a prototype. It was a human-developed, field-tested Service Desk workflow tool that Alan used and helped improve through real feedback cycles. The new ServiceNow Automation project should reuse the **validated product patterns** and operational lessons, while rebuilding them in a safer, portable, project-neutral architecture.

This note extracts reusable ideas only. It does **not** migrate proprietary code, credentials, customer data, real ticket data, internal mailbox values, internal URLs, or legacy config values.

## Safety findings from the legacy material

The old manuals contain operationally sensitive details such as shared mailbox setup, internal contacts, environment names, credentials, workflow-specific groups, and examples. These are useful for understanding the product shape but must not be copied into the new repo.

Rules for this project:

- Do not commit old manuals, config files, DB files, logs, screenshots, recordings, or extracted raw text.
- Do not copy customer-specific mappings, mailbox names, credentials, internal URLs, or ticket/change examples.
- Rebuild patterns with fake demo data, configurable profiles, and explicit safety gates.
- Keep ServiceNow QA/prod usage behind checkpoint approval.

## What the old tool already validated

### 1. Mail-driven SD workflow is the real product center

The old tool started from the operator's actual queue: monitored Outlook folders in a shared/team mailbox. This is more valuable than “a form filler” because it maps to daily SD work.

Validated pattern:

```text
configured mailbox/folder
→ load emails in work order
→ open a Mail Review window
→ confirm whether to raise a ticket/change
→ create a structured draft/window
→ submit only after human review
→ record/copy result
→ move or mark the email as done
```

New project implication:

- Build a **mail/review queue abstraction** even before real Outlook/Graph integration.
- For demo, use sanitized fake queue items.
- Later, plug in Outlook/Graph as a read-only adapter after approval.

### 2. Mail Review window is a strong human-in-the-loop gate

The old tool did not jump directly from email to submit. It used a review screen where the SD agent checked the mail and chose the next action.

Reusable behavior:

- Open original message / view source context.
- Review parsed subject/body/attachments.
- Choose incident/change path.
- Move or mark item done.
- Save evidence when allowed.

New implementation idea:

- Add a `Mail Review` panel before `TicketDraft` generation.
- Make it clear when data is fake/demo vs real.
- Keep “Create Incident Draft” as the safe action, not “Submit”.

### 3. Ticket sidecar window is the core UX pattern

The old `TicketWindow` behaved as a sidecar form beside the ServiceNow browser page. It prepared structured fields, allowed edits, and pushed values into the browser page.

Reusable behavior:

- Prefill likely fields from the source email.
- Let the operator edit all important values.
- Provide guided field order.
- Keep the browser visible for verification.
- Capture resulting ticket number/state back into the tool only after submit/save.

New project implication:

- The new `TicketDraft` workspace should become the modern sidecar.
- Keep sidecar-first UX for demo and later browser adapter work.
- Avoid invisible automation until trust is established.

### 4. One-way sync is acceptable for MVP, but needs readback validation later

The legacy sidecar synced from tool → ServiceNow page. Edits made directly in ServiceNow did not update the tool.

Pros:

- Simpler mental model.
- Easier to implement.
- Operator can still fix values in ServiceNow.

Risks:

- Tool and page can drift.
- Assignment/support group mismatch can block submit.
- Page-side dynamic changes can clear dependent fields.

New project rule:

- MVP: one-way draft/fill simulation is fine.
- QA phase: add readback validation before any submit/save rehearsal.
- Never assume page state equals sidecar state.

### 5. Field order matters

The old manuals repeatedly emphasized that some fields clear or change other fields. A safe order reduces rework.

Reusable field-order concept:

```text
caller/context
→ CI or service lookup
→ affected business/service area
→ category
→ subcategory
→ assignment/support group
→ summary/work notes
→ attachments/evidence
→ final review
```

New project implication:

- Add a visible review checklist in the draft UI.
- Show warnings when changing a field may invalidate downstream fields.
- Do not treat field filling as a flat form problem.

### 6. Configurability was a major adoption feature

Old tool users could configure working folders, done folders, monitored report folders, ServiceNow environment, high-severity polling interval, and related workflow options.

Reusable config categories:

- Work queue source.
- Done/archive destination.
- Environment profile.
- Browser/session behavior.
- High-severity monitor interval/filter.
- Change/report workflow source.
- Feature toggles.

New project implication:

- Implement a project-neutral profile model.
- Separate fake/demo config, QA config, and future production-shadow config.
- Normal users should not see dangerous sync/API settings by default.

### 7. Visible Chromium + manual login is a proven adoption pattern

The old tool used Chromium/Playwright and asked the user to log in visibly. This matches our current safety direction.

Validated pattern:

- Dedicated browser runtime installed by tool setup.
- Manual SSO/login rather than relying on stored credentials.
- Browser remains visible so the operator can verify behavior.
- Hiding the browser was considered risky during adoption.

New project implication:

- #31–#34 dedicated Chromium work is the right direction.
- Keep disposable profiles and tool-owned runtime.
- Keep browser visible during field trial.
- Do not reuse daily Chrome/Edge profiles.

### 8. High-severity monitoring is a portfolio-grade differentiator

The old tool's high-severity monitor showed visual alerts and audio/voice notification for urgent tickets. This is a strong demo idea because it shows SD operational value beyond ticket drafting.

Reusable behavior:

- Poll an approved high-severity filter/source.
- Show normal vs active states with strong visual contrast.
- Include count and quick detail entry point.
- Allow stop/acknowledge.
- Make polling interval configurable.

New safe version:

- Start with a fake P1/P2 alert simulator.
- No real ServiceNow polling before QA approval.
- Do not show real ticket IDs in repo/docs.
- Avoid repeated audio loops by default to prevent alert fatigue.

### 9. Local state and copy result actions reduce operator friction

The old tool kept local records so users could right-click/copy created ticket numbers and continue processing emails.

Reusable behavior:

- Action history.
- Copy generated field content.
- Copy ticket/result metadata after creation.
- Preserve enough context to resume a workflow.

New safe version:

- Demo action history should be in-memory or fake-data-only.
- Add copy-to-clipboard for draft fields and sanitized summaries.
- Real ticket numbers should not be stored/logged until policy is approved.

### 10. Change workflow has high value but high blast radius

The old tool handled Azure/Change workflows with report parsing, batch creation, tasks, local save/resume, approval polling, and notification email sending.

Reusable ideas:

- Parse structured report input.
- Normalize time zones.
- Generate change drafts and task checklist.
- Save local workflow state so the operator can resume later.
- Wait for approval status before notification.
- Support per-item and batch actions.
- Use multiple confirmation gates before sending notifications.

New project staging:

- Before June 5: only mock Change draft/checklist if time allows.
- Later: QA-gated read-only approval tracker.
- Much later: gated email notification and attachment/evidence workflow.

## Architecture lessons from the packaged legacy app

Safe metadata inspection shows the old tool used:

- Windows desktop app stack.
- Playwright/Chromium automation.
- Local embedded database/config.
- File logging.
- Mail/message handling libraries.
- REST/ServiceNow-related library.
- Installer that prepared PowerShell/.NET/Playwright browser dependencies.

Lessons for the new project:

- Browser runtime setup is a first-class installer concern, not an afterthought.
- Local DB/config needs clear storage, migration, backup, and redaction rules.
- Logs must have retention and redaction controls.
- Do not ship debug symbols or source paths in production packages unless intentionally needed.
- Do not use plaintext shared credentials or legacy config values.
- Avoid unsafe broad install patterns; prefer explicit, documented, user-owned setup.

## Recommended demo direction before June 5

The fastest high-value path is not direct ServiceNow automation. It is a safe demo that proves Alan understands SD workflows and can productize them.

Recommended demo sequence:

```text
1. Fake monitored queue
2. Mail Review panel
3. Ticket Draft sidecar
4. Field cleanup and checklist
5. Mock ServiceNow form preview
6. Copy/export sanitized draft
7. Fake P1/P2 alert simulator
8. Runtime status / safety panel
```

This demonstrates the legacy tool's best ideas without requiring real mailbox, real ServiceNow, credentials, or customer data.

## Prioritized backlog mapping

### MVP now / demo-safe

1. Legacy-style Mail Review demo queue before Ticket Draft.
2. Subject/body cleanup rules for better short description and summary.
3. Field review checklist based on proven SD fill order.
4. Copy-to-clipboard for generated draft fields.
5. Mock action history/audit trail for demo actions.
6. Fake P1/P2 high-severity alert simulator.
7. Mock CI/service lookup for assignment suggestion.
8. Browser runtime/safety status panel.

### Safe no-write but slightly later

1. Configurable monitored-source profile model, mock-only.
2. Redaction preview before any external AI or real-data testing.
3. Sanitized draft export as Markdown/JSON.
4. Mock pending-approval tracker for Change workflow.
5. Change draft checklist from fake report fixture.

### Requires QA approval

1. QA read-only landing-page exploration after about:blank smoke.
2. ServiceNow field-fill rehearsal with fake data and no Save/Submit.
3. QA test incident creation only after explicit approval.
4. Real mailbox read-only adapter spike.
5. QA high-severity monitor spike.
6. Change Request QA rehearsal.

### Do not copy directly

1. Stored/shared credentials or auto-login.
2. Auto Save/Submit/Update/Close against real ServiceNow.
3. Ungated data sync/API buttons.
4. Auto-upload real email attachments.
5. Auto-send notification emails.
6. Saving real screenshots, PDFs, MSGs, HAR, traces, or browser storage.
7. Reusing daily Chrome/Edge profile.
8. Repeating high-severity voice alerts without dedupe/acknowledgement.
9. Copying proprietary mappings/configs/code.
10. Running the old executable against real systems.

## Suggested follow-up issues

High priority:

- Add legacy-style Mail Review demo queue before Ticket Draft.
- Add subject/body cleanup rules for cleaner ticket drafts.
- Add legacy-inspired field review checklist to Ticket Draft workspace.
- Add fake P1/P2 high-severity alert simulator.
- Add mock CI/service lookup for assignment suggestion.

Medium priority:

- Add configurable monitored-source profile model, mock-only.
- Add mock action history / audit trail for demo actions.
- Add copy-to-clipboard for generated draft fields.
- Add browser runtime/safety status panel.
- Add sanitized draft export.

Later gated:

- Real mailbox read-only adapter spike.
- QA high-severity monitor spike.
- ServiceNow field-fill rehearsal, no Save/Submit.
- Change Request draft workflow from fake report.

## Bottom line

The old AIA SD Tool proves that Alan's strongest story is not “AI writes code.” The story is:

> Alan understands real Service Desk operations deeply enough to turn repetitive queue handling, ticket drafting, high-severity monitoring, and change workflows into a human-controlled automation product.

The new YAGEO/portable tool should therefore be framed as:

```text
Service Desk workflow cockpit
+ AI-assisted ticket drafting
+ safe browser/runtime isolation
+ configurable queues and monitors
+ human-in-the-loop confirmation
+ future ServiceNow adapter
```

not merely as a ServiceNow form filler.
