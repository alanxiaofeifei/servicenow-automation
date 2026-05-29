# QA Text-Field Autofill-Only Planning + Fixture Harness Runbook

## Purpose

This runbook covers the first implementation slice after the GPT-5.5 Pro checkpoint returned **READY WITH CONDITIONS** for QA browser-assisted autofill.

This slice contains the **planning/review gate** plus a **local fixture-only selector harness**. It prepares the safety contract, field preview, approval phrase, selector-verification requirement, and deterministic local execution checks. It does **not** authorize a real browser fill yet, and it does **not** authorize Save, Submit, Update, Resolve, Close, attachment upload, notification-triggering actions, ServiceNow API writes, bulk fill, or production/prod-shadow use.

## Scope

Allowed in this planning slice:

- QA or dev only.
- One fake/sanitized ticket only.
- Dedicated/tool-owned Chromium profile only.
- App-side field review planning.
- Local fixture harness execution that touches no real QA/dev page.
- Exact approval phrase for autofill-only.
- Selector verification must be present before any later execution slice can become ready.
- Text fields only:
  - Short description
  - Description
  - Work notes
- Stop before any real browser execution.
- Sanitized outcome note only.

Forbidden in this slice:

- Any real browser text-field fill in this PR/slice.
- Save, Submit, Update, Resolve, Close, or any button automation.
- Requester/caller, Assignment group, Configuration item, Category, Subcategory, Location, Impact, Urgency, Priority, State, Status, or customer-visible comments.
- ServiceNow REST/API write.
- Bulk create/fill or multi-ticket execution.
- Production or production-shadow.
- Real customer/user/ticket data.
- Browser visual/network/debug artifacts, auth-material exports, page HTML, or raw QA URLs.
- External AI using real QA/ServiceNow content.

## Morning checkpoint sequence before any real QA/dev autofill

The next morning checkpoint is tracked in issue #90 and prompt `docs/prompts/gpt-5.5-pro/pre-real-qa-autofill-execution-checkpoint.md`.

Alan's first actions after waking should be:

1. Review the checkpoint prompt and paste only that sanitized prompt into GPT-5.5 Pro.
2. Record GPT-5.5 Pro's verdict in issue #90: `READY`, `READY WITH CONDITIONS`, or `NOT READY`.
3. If the verdict is not at least `READY WITH CONDITIONS`, stop and do only local/no-write follow-up.
4. If conditions pass, re-run local gates and fixture smokes before any browser step.
5. Only after the verdict is recorded, gates pass, and Alan is present, prepare the dedicated/tool-owned Chromium profile and manual-login path.
6. Treat any real QA/dev browser autofill execution as a later reviewed slice. This runbook still stops before real browser execution.

Forbidden until issue #90 has a recorded acceptable verdict and the later execution slice is reviewed:

- unattended browser launch,
- ServiceNow login or navigation by the agent,
- DOM writes against a real QA/dev page,
- Save, Submit, Update, Resolve, Close,
- screenshots, HAR, traces, storage-state, cookies, sessions, page HTML, raw QA URLs, ticket identifiers, or real field values.

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
PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED
```

For dev:

```text
PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED
```

Rules:

1. The phrase is valid only for the current session and current reviewed field screen.
2. If the page changes, form reloads, environment changes, or ticket changes, require approval again.
3. Autofill approval does not approve Save.
4. Autofill approval does not approve Submit.
5. Autofill approval does not approve Update.
6. Autofill approval does not approve Resolve.
7. Autofill approval does not approve Close.

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

### Phase 1 — No real browser execution in this slice

Do not open or automate the real QA/dev browser from this planning gate. A later browser execution PR/runbook must define the controlled browser launch and runtime selector verification path before Alan performs a real QA text-field fill.

### Phase 1A — Local fixture harness smoke

The fixture harness is allowed because it does not launch a browser and does not touch a real QA/dev page.

Use `pnpm --silent` so JSON output is not mixed with package banners:

```bash
pnpm --filter @servicenow-automation/cli --silent sda qa autofill-fixture \
  --mode qa \
  --template vpn_issue \
  --user "Demo requester A" \
  --summary "Fake Chat intake — VPN connection issue after password or MFA change" \
  --qa-isolation-confirmation "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team." \
  --dedicated-profile-confirmation "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile." \
  --approval-phrase "PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED" \
  --selector-fixture all-found \
  --json
```

Expected fixture-only result:

- `command` is `qa autofill-fixture`.
- `execution.status` is `completed` only for the local `all-found` fixture.
- `execution.browserProcessLaunched` is `false`.
- `execution.realServiceNowPageTouched` is `false`.
- `execution.writeActionsAttempted` is `false`.
- Field values in CLI JSON are sanitized.

Negative fixture smoke:

```bash
pnpm --filter @servicenow-automation/cli --silent sda qa autofill-fixture \
  --mode qa \
  --template vpn_issue \
  --user "Demo requester A" \
  --summary "Fake Chat intake — VPN connection issue after password or MFA change" \
  --qa-isolation-confirmation "QA isolation confirmed: this autofill test will not notify production users, customers, or a real support team." \
  --dedicated-profile-confirmation "Dedicated Chromium profile confirmed: this autofill test uses only the ServiceNowAutomation tool-owned profile." \
  --approval-phrase "PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED" \
  --selector-fixture missing-work-notes \
  --json
```

Expected negative result: `plan.blockedReason` is `selector-mismatch`, `execution.status` is `blocked`, and no fields are filled. Repeat the same negative smoke with `--selector-fixture wrong-description-type` to prove wrong DOM control types fail before readiness, `--selector-fixture ambiguous-description` to prove duplicate selector matches fail closed, `--selector-fixture non-writable-work-notes` to prove non-writable controls fail closed, and `--selector-fixture unexpected-required-field` to prove unexpected required controls stop the fixture harness.

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

A Save/Submit/Update/Resolve/Close phrase does not approve autofill. An autofill phrase does not approve Save/Submit/Update/Resolve/Close.

### Phase 4 — Real-browser autofill-only execution requirements for the later slice

The later real-browser execution slice may fill only:

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

### Phase 5 — Stop before real browser execution here

This planning plus fixture slice stops before real browser execution and shows:

```text
Planning plus local fixture gate only: real browser text-field execution remains blocked until a later browser execution slice is reviewed.
```

If Alan wants to perform real browser autofill later, that requires a selector-verified execution PR/runbook such as `docs/field-trial/qa-dev-text-field-autofill-execution-runbook.md`, plus independent review of the execution-slice diff. If Alan wants to Save later, that is a separate checkpoint and separate phrase, not part of this runbook.

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
Planning/review only, or local fixture harness smoke

## Write actions
No Save / Submit / Update / Resolve / Close

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
