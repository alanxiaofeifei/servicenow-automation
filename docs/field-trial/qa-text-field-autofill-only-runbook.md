# QA Text-Field Autofill-Only Planning Gate Runbook

## Purpose

This runbook covers the first implementation slice after the GPT-5.5 Pro checkpoint returned **READY WITH CONDITIONS** for QA browser-assisted autofill.

This slice is a **planning/review gate only**. It prepares the safety contract, field preview, approval phrase, and selector-verification requirement. It does **not** authorize a real browser fill yet, and it does **not** authorize Save, Submit, Update, Close, attachment upload, notification-triggering actions, ServiceNow API writes, bulk fill, or production/prod-shadow use.

## Scope

Allowed in this planning slice:

- QA or dev only.
- One fake/sanitized ticket only.
- Dedicated/tool-owned Chromium profile only.
- App-side field review planning.
- Exact approval phrase for autofill-only.
- Selector verification must be present before any later execution slice can become ready.
- Text fields only:
  - Short description
  - Description
  - Work notes
- Stop before any browser execution.
- Sanitized outcome note only.

Forbidden in this slice:

- Any real browser text-field fill in this PR/slice.
- Save, Submit, Update, Close, or any button automation.
- Requester/caller, Assignment group, Configuration item, Category, Subcategory, Location, Impact, Urgency, Priority, State, Status, or customer-visible comments.
- ServiceNow REST/API write.
- Bulk create/fill or multi-ticket execution.
- Production or production-shadow.
- Real customer/user/ticket data.
- Browser visual/network/debug artifacts, auth-material exports, page HTML, or raw QA URLs.
- External AI using real QA/ServiceNow content.

## Required confirmations

Before any later autofill-only execution action, Alan must confirm QA isolation:

```text
QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team.
```

Alan must also confirm the browser profile boundary:

```text
Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile.
```

If either confirmation is missing or uncertain, stop.

## Required approval phrase

For QA:

```text
I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED
```

For dev:

```text
I APPROVE DEV SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED
```

Rules:

1. The phrase is valid only for the current session and current reviewed field screen.
2. If the page changes, form reloads, environment changes, or ticket changes, require approval again.
3. Autofill approval does not approve Save.
4. Autofill approval does not approve Submit.
5. Autofill approval does not approve Update.
6. Autofill approval does not approve Close.

## Planning-gate sequence

### Phase 0 — Pre-flight

1. Confirm the branch/PR implementing this runbook is merged and synced locally.
2. Run local gates:

```bash
pnpm build
pnpm typecheck
pnpm test
```

3. Run privacy/safety scan for raw QA URLs, ticket IDs, ServiceNow record IDs, credentials, auth-material exports, browser artifacts, page HTML, OAuth codes, and real user/customer text.
4. Confirm only fake/sanitized `vpn-issue` style scenario data is used.

### Phase 1 — No browser execution in this slice

Do not open or automate the real QA/dev browser from this planning gate. A later selector-verified execution PR/runbook must define the controlled browser launch and runtime selector verification path before Alan performs a real QA text-field fill.

### Phase 2 — App-side planning review

Review each planned field before any future fill:

- Field name
- Field type
- Fake/sanitized value
- Source of value
- Required/optional status
- Risk warning

Do not blind-fill. If a field value is real or copied from QA, stop.

### Phase 3 — Approval phrase

Alan provides the exact QA or dev autofill-only phrase shown above.

A Save/Submit/Update/Close phrase does not approve autofill. An autofill phrase does not approve Save/Submit/Update/Close.

### Phase 4 — Autofill-only execution requirements for the later slice

The later execution slice may fill only:

- Short description
- Description
- Work notes

The later execution slice must fail closed if:

- a selector is missing,
- a selector is ambiguous,
- the page does not look like the authorized Incident form,
- unexpected required fields appear,
- the environment is not QA/dev,
- the dedicated profile boundary is unclear,
- any write button automation path appears.

### Phase 5 — Stop before browser execution here

This planning slice stops before browser execution and shows:

```text
Planning gate only: browser text-field execution remains blocked until a later selector-verified execution slice is reviewed.
```

If Alan wants to perform real browser autofill later, that requires a selector-verified execution PR/runbook. If Alan wants to Save later, that is a separate checkpoint and separate phrase, not part of this runbook.

## Sanitized outcome note

Allowed:

```markdown
# QA Browser-Assisted Autofill Planning Gate Outcome

## Scenario
vpn-issue / fake VPN issue after password or MFA change

## Mode
QA autofill-only planning gate

## Fields reviewed
Short description / Description / Work notes

## Action attempted
None — planning/review only

## Write actions
No Save / Submit / Update / Close

## Result
Planning gate completed / blocked / stopped

## Stop reason
None / approval missing / selector mismatch / QA isolation unclear / unexpected required field

## Artifacts
No browser artifact, auth-material export, or page HTML captured.

## Product follow-up
- ...
```

Forbidden in the outcome note:

- QA URL
- ticket number
- sys_id
- requester name
- assignment group if real
- page title
- screenshot
- HTML
- actual QA field values copied from page
- browser auth-material exports
