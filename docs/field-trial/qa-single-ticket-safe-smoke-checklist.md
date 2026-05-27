# QA Single-Ticket Safe Smoke Checklist

## Purpose

This checklist is the safe, sanitized pre-QA smoke path for one fake Service Desk ticket. It covers only:

- dry-run review;
- manual copy / manual typing by Alan;
- Save-only readiness assessment.

It does not authorize a ServiceNow login, page inspection, Save, Submit, Update, Resolve, Close, browser DOM autofill, ServiceNow API call, Graph/Excel write, attachment upload, or bulk creation.

## Hard boundary

Use fake/sanitized data only. Do not paste or store real ticket text, requester names, emails, phone numbers, URLs, queue names, chat/email content, screenshots, recordings, transcripts, cookies, sessions, HAR, traces, credentials, or raw manager-call details.

## Before starting

1. Work locally on the reviewed branch.
2. Keep the app in mock/demo mode unless a later checkpoint explicitly approves a QA browser step.
3. Confirm the selected scenario is fake/sanitized, such as `vpn-issue`.
4. Confirm the UI says manual-fill only and `productionWriteAllowed=false`.
5. Confirm no real ServiceNow page is open for this checklist.

## Step 1 — Dry-run review only

Review the local cockpit output:

- Source Review contains only fake/sanitized content.
- Incident Draft contains only fake/sanitized fields.
- Mock ServiceNow Incident Preview is clearly marked as mock/demo.
- Controlled QA single-ticket smoke panel is visible.
- Requested write action defaults to `save_incident` for conservative Save-only readiness.
- Required approval phrase shown for Save is `PRIVATE_APPROVAL_PHRASE` in mock mode or `PRIVATE_APPROVAL_PHRASE` in QA mode.
- Submit, Update, and Close remain deferred to a later checkpoint.

Stop if any real enterprise/customer/ticket/session content appears.

## Step 2 — Manual copy readiness

The app may show copyable local text, but it must not type or click in a browser.

Allowed operator actions in this safe smoke:

- copy local Markdown/CSV/dry-run text into a private scratch note;
- manually inspect field mapping;
- manually compare required fields against the checklist below.

Forbidden:

- DOM autofill;
- browser automation against ServiceNow;
- Playwright/DevTools inspection of a real ServiceNow page;
- ServiceNow REST/API write;
- Graph/Excel workbook write;
- attachment upload;
- email/customer notification.

## Step 3 — Required field review

The fake ticket is Save-only-ready only if every field below is fake/sanitized and complete:

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
- Confirmation state
- Evidence review state, if shown
- Excel dry-run row preview, if shown

Stop if any required field is missing or would require real data.

## Step 4 — Save-only readiness decision

This checklist stops before any real write. It can only produce one of these local outcomes:

```text
Dry-run PASS: fake ticket is ready for a later Save-only QA decision.
Dry-run BLOCKED: required fake field missing.
Dry-run BLOCKED: QA isolation or notification risk unclear.
Dry-run BLOCKED: real or sensitive content appeared.
Dry-run BLOCKED: workflow would require Submit/Update/Close rather than Save-only readiness.
```

Save-only readiness does not click Save. A later real QA Save would still require all of the following in the current session:

1. explicit user decision to enter QA;
2. confirmed QA isolation;
3. one fake/sanitized ticket only;
4. manual copy/manual typing only;
5. exact phrase immediately before Save: `PRIVATE_APPROVAL_PHRASE`;
6. no Submit, Update, or Close.

## Sanitized outcome note template

```markdown
# QA Single-Ticket Safe Smoke Outcome

## Scenario
vpn-issue / fake VPN issue after password change

## Mode
Dry-run only / manual-copy readiness only

## Write action
None. Save-only readiness assessed; no ServiceNow write performed.

## Result
Dry-run PASS / Dry-run BLOCKED

## Required field issues
- none / ...

## QA isolation or notification concerns
- none / ...

## Product fixes found
- ...
```

Store any private notes only in an ignored local path such as `private/field-tests/`. Do not commit private outcome notes.

## Pass criteria

- All content remains fake/sanitized.
- Local dry-run field mapping is complete.
- UI clearly communicates manual-fill only and no uncontrolled writes.
- Save-only readiness is distinct from actually clicking Save.
- Submit, Update, Close, bulk actions, API writes, browser autofill, and Graph/Excel writes remain out of scope.
