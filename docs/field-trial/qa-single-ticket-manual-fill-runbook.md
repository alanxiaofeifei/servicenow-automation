# QA Single-Ticket Manual-Fill Runbook

## Purpose

This runbook defines the only allowed first QA field trial for ServiceNow Automation after the GPT-5.5 Pro checkpoint returned **READY WITH CONDITIONS**.

The goal is to validate whether the cockpit's fake/sanitized Service Desk workflow can help Alan prepare one QA Incident draft and one Excel dry-run evidence row.

This runbook does **not** approve browser DOM autofill, ServiceNow API calls, bulk creation, production testing, or any uncontrolled write action.

For the local no-write pre-flight path, use `docs/field-trial/qa-single-ticket-safe-smoke-checklist.md` first. That checklist stops at dry-run/manual-copy/Save-only readiness and does not authorize a QA login or any ServiceNow write.

## Scope

Allowed:

- QA environment only.
- One fake/sanitized ticket only.
- Manual-fill assisted workflow only.
- Alan reviews every field before any write action.
- The app may show a local field mapping preview.
- Alan manually copies/enters values into QA if all gates pass.
- The app may generate local CSV / Markdown dry-run text.
- Record only sanitized outcome notes.

Forbidden:

- Production or production-shadow writes.
- Real customer, employee, requester, ticket, URL, mailbox, chat, portal, attachment, credential, cookie, or session content.
- Browser DOM autofill.
- Playwright/DevTools inspection of real ServiceNow pages.
- ServiceNow REST/API write.
- Bulk create.
- Save / Submit / Update / Resolve / Close without the action-specific approval phrase.
- Attachment upload.
- Email/customer notification.
- Screenshots, HAR, trace, video, storage-state, cookie/session export.
- External AI with real ServiceNow content.

## Fake scenario for the first trial

Use only this fake scenario unless a later reviewed runbook replaces it:

```text
Scenario ID: vpn-issue
Scenario name: Fake Chat intake — VPN connection issue after password change
Requester: Demo requester A
Source channel: Teams message / Chat-style intake
Problem: VPN cannot connect after a recent password or MFA change.
Impact: Internet works without VPN, but remote access is unavailable.
Expected category: Network
Expected subcategory: VPN
Expected assignment group: Demo Network Support
Expected priority: 4 - Low
```

Do not paste any text from workflow recordings, real tickets, real chats, real email, or the manager call into QA or the repo.

## Required field checklist before manual fill

The field mapping preview must be reviewed before any QA page is touched:

- Requester: fake/sanitized QA requester only.
- Channel / Contact type: Chat, Teams message, or other QA-safe equivalent.
- Category: Network.
- Subcategory: VPN.
- Location: QA-safe sanitized location.
- Impact: 3 - Low, unless Alan intentionally changes it for QA.
- Urgency: 3 - Low, unless Alan intentionally changes it for QA.
- Assignment group: QA-safe support group that will not page or notify a production team.
- Short description: fake VPN problem summary only.
- Description: fake/sanitized summary only.
- Work notes: internal fake triage plan only.
- Service Desk owner / initial group: QA-safe service desk placeholder.
- Final assignment group: QA-safe target group.
- Confirmation state: record whether any fake fields are still missing.
- Evidence review state: record fake evidence state only; do not attach files.
- Excel dry-run fields: verify Fake Scenario ID, Approval Phrase Gate, Stop Rule Check, QA Isolation Check, QA Dry-run Outcome, QA Trial Result, and Dry-run Result.

If a required field cannot be filled using fake/sanitized values, stop.

## Required approvals

Each write action has its own approval phrase. One phrase never covers another action.

```text
Save:   PRIVATE_APPROVAL_PHRASE
Submit: PRIVATE_APPROVAL_PHRASE
Update: PRIVATE_APPROVAL_PHRASE
Close:  PRIVATE_APPROVAL_PHRASE
```

Rules:

1. Alan must provide the exact phrase in the current session immediately before the matching action.
2. The phrase must match the exact action about to be taken.
3. A Submit approval does not approve Save, Update, or Close.
4. A Save approval does not approve Submit, Update, or Close.
5. If the page changes after approval, ask again before acting.
6. Do not persist runtime approval evidence in config, cookies, local storage, screenshots, or logs. The static required phrases may be displayed in docs/UI, but Alan's per-action approval must still be freshly provided in the current session.

## QA isolation confirmation

Before any Save or Submit, Alan must confirm all of the following in plain language:

```text
QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.
```

If this cannot be confirmed, stop and keep the run as dry-run only.

## Stop rules

Stop immediately if any of these happen:

- QA host or environment is uncertain.
- Production or production-shadow mode appears.
- Browser uses Alan's daily Chrome/Edge profile.
- Any real user, customer, ticket, email, chat, URL, hostname, credential, cookie, session, screenshot, or recording detail appears.
- QA ticket could notify production users, customers, or a real support team.
- A page opens a real ticket, real user, real customer, or real assignment queue.
- Any ServiceNow workflow unexpectedly creates, updates, routes, notifies, escalates, or closes data.
- Any DOM autofill, ServiceNow API, bulk create, attachment upload, email send, or automated close/update path appears.
- The app or browser asks to save passwords, cookies, sessions, screenshots, HAR, traces, or storage state.
- Alan is unsure whether a click is read-only or a write action.

Record only a sanitized stop reason, such as:

```text
Stopped: QA notification risk unclear.
Stopped: real record appeared.
Stopped: required fake field unavailable.
```

## Manual run steps

### Phase 0 — Pre-flight

1. Confirm the repo is on the reviewed branch.
2. Run local gates before field trial:

```bash
pnpm build
pnpm typecheck
pnpm test
```

3. Confirm no sensitive artifacts are untracked or staged:

```bash
git status --short
git status --ignored --short .local private field-test-results field-test-notes apps/cli/.local || true
```

4. Open the desktop app or rendered local UI in mock mode.
5. Confirm default scenario is `vpn-issue`.
6. Confirm the page says fake/sanitized data only.
7. Confirm the QA smoke panel shows manual-fill only and productionWriteAllowed=false.

### Phase 1 — Review local draft

1. Select `Load VPN QA Scenario`.
2. Review Source Review body; it must be fake/sanitized.
3. Review Incident Draft fields.
4. Review Mock ServiceNow Incident Preview.
5. Review Controlled QA single-ticket smoke field mapping.
6. Review the action-specific approval phrases.
7. Review stop rules.
8. Copy local Markdown summary if needed.

### Phase 2 — Prepare QA page manually

1. Open the QA ServiceNow environment using the approved manual login path.
2. Alan logs in manually.
3. Navigate manually to a new Incident page or approved QA test page.
4. Do not use browser automation or DOM autofill.
5. Do not open real ticket/customer/user records.

### Phase 3 — Manual field fill

Alan manually fills only fake/sanitized values from the reviewed preview:

- Requester
- Channel / Contact type
- Category
- Subcategory
- Location
- Impact
- Urgency
- Assignment group
- Short description
- Description
- Work notes

Do not attach files.
Do not paste raw recordings or real ticket text.
Do not rely on the app to click or type into the QA page.

### Phase 4 — Save/Submit/Update/Resolve/Close decision

Before Save, Submit, Update, Resolve, or Close:

1. Re-read the field values and the current page state.
2. Confirm QA isolation.
3. Confirm no real user/customer/production routing is involved.
4. Ask Alan for the exact matching phrase:
   - Save requires `PRIVATE_APPROVAL_PHRASE`.
   - Submit requires `PRIVATE_APPROVAL_PHRASE`.
   - Update requires `PRIVATE_APPROVAL_PHRASE`.
   - Close requires `PRIVATE_APPROVAL_PHRASE`.
5. If the phrase is missing, wrong, stale, or for a different action, do not click.
6. For the first single-ticket trial, prefer Save or Submit only; Update and Close remain blocked unless a separate reviewed scenario explicitly needs them.

### Phase 5 — Sanitized outcome note

After the dry-run or QA action, record only sanitized outcome data:

```markdown
# QA Single-Ticket Trial Outcome

## Scenario
vpn-issue / fake VPN issue after password change

## Mode
Dry-run only / QA manual-fill only

## Action attempted
None / Save / Submit

## Approval phrase observed
Not recorded; exact phrase was checked only at runtime.

## Result
Ready / blocked / stopped / saved in QA / submitted in QA

## Sanitized QA reference
Do not record raw ticket numbers. Use only a generic sanitized reference such as `QA single-ticket run completed` unless a later privacy review approves a safer identifier.

## Required field problems
- ...

## Routing/notification concerns
- none / stopped because ...

## Product issues to fix
- ...
```

Save private notes only in an ignored path if needed, such as:

```text
private/field-tests/YYYY-MM-DD-qa-single-ticket.md
```

## Pass criteria

The run passes only if:

- Fake scenario remains fake/sanitized.
- Required field mapping is complete.
- QA isolation is explicitly confirmed.
- No real data is captured, committed, or sent to external AI.
- No DOM autofill, ServiceNow API, bulk create, attachment upload, email send, or automated update/close is used.
- Every real write action has its exact action-specific approval phrase.
- Excel output remains dry-run / copy-only.
- Outcome notes are sanitized.

## Fail / blocked outcomes

This is a safe blocker, not a failure, if:

- QA isolation cannot be confirmed.
- The fake requester or assignment group is not safe.
- A required field cannot be filled safely.
- ServiceNow behavior differs from expectations.
- Any notification or routing risk appears.

In those cases, stop and create a GitHub issue with only a sanitized description.
