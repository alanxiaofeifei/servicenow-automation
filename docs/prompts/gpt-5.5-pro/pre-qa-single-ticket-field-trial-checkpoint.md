# GPT-5.5 Pro Checkpoint — Pre-QA Single-Ticket Field Trial

## Checkpoint token

Please quote this token in your answer before giving the verdict, so we know you read this exact checkpoint:

```text
SDA_PRE_QA_SINGLE_TICKET_CHECKPOINT_2026_05_21
```

## Context

We are building a ServiceNow Automation / Service Desk Workflow Cockpit as a safety-first, human-in-the-loop project.

The project has already analyzed workflow recordings and a manager/career discussion only through sanitized summaries. No raw enterprise content, ticket text, names, emails, URLs, screenshots, cookies, sessions, audio, video, or transcripts should be sent to external AI or committed to the repo.

Hard rule for using this external-AI checkpoint:

```text
Do not upload raw repository diffs, raw workflow recordings, raw transcripts, screenshots, HAR files, traces, storage-state, cookies, sessions, credentials, real ServiceNow pages, real ticket text, real URLs, or any unreviewed enterprise content to GPT-5.5 Pro.
Do not paste `git diff`, `git show`, patch output, or large code excerpts verbatim into external AI, even if they appear sanitized.
Only paste this checkpoint prompt, small sanitized file excerpts, and already-reviewed fake/demo context.
If GPT-5.5 Pro asks for sensitive evidence, refuse and continue with sanitized summaries only.
```

The latest implementation branch is:

```text
Branch: feat/qa-field-trial-prep
PR: #63 (private repository link intentionally omitted from this external prompt)
Purpose: prepare QA field trial gates
```

The PR adds or updates:

- recording-derived fake QA scenarios only;
- deterministic `ManualPasteScenario` to queue item mapping;
- controlled QA single-ticket smoke UI;
- explicit Save / Submit / Update / Resolve / Close approval phrases;
- Excel dry-run QA evidence fields;
- a manual-fill QA runbook;
- a 3–5 minute demo script.

Latest local verification before this checkpoint, as reported by the local agent and requiring re-run before the actual QA trial:

```text
pnpm build      PASS
pnpm typecheck  PASS
pnpm test       PASS
Security scan   PASS for staged diff; sensitive hits were safety-copy false positives only
Independent pre-commit review: PASS after fixing scenario mapping blocker
```

## Current product boundary

The app may generate local fake/sanitized drafts and dry-run evidence only. It must not perform uncontrolled writes.

Allowed for first QA trial if this checkpoint approves:

```text
QA environment only
one fake/sanitized ticket only
manual-fill assisted only
the operator manually reviews every field
the operator manually copies/types values into QA
Excel output remains dry-run / copy-only
sanitized outcome notes only
```

Forbidden:

```text
production or production-shadow writes
real customer / employee / requester / ticket / URL / mailbox / chat / portal / attachment / credential / cookie / session content
browser DOM autofill
Playwright / DevTools inspection of real ServiceNow pages
ServiceNow REST/API writes
bulk creation
attachment upload
email/customer notification
screenshots, HAR, traces, videos, storage-state, cookie/session export
external AI calls using real ServiceNow or enterprise content
```

## First proposed fake scenario

Use only the fake scenario from the runbook unless you explicitly recommend a safer replacement:

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

## Required runtime approvals

Each real write action has its own approval phrase. One phrase never covers another action.

```text
Save:   PRIVATE_APPROVAL_PHRASE
Submit: PRIVATE_APPROVAL_PHRASE
Update: PRIVATE_APPROVAL_PHRASE
Close:  PRIVATE_APPROVAL_PHRASE
```

Rules:

1. The operator must provide the exact phrase in the current session immediately before the matching action.
2. The phrase must match the exact action about to be taken.
3. A Submit approval does not approve Save, Update, Resolve, or Close.
4. A Save approval does not approve Submit, Update, Resolve, or Close.
5. If the page changes after approval, ask again before acting.
6. Do not persist runtime approval evidence in config, cookies, local storage, screenshots, or logs.
7. Update and Close remain blocked for the first trial unless a later checkpoint explicitly allows them.
8. If Update or Close is ever allowed later, repeat QA isolation confirmation and require the matching action-specific phrase immediately before that action.

## QA isolation confirmation

Before any Save or Submit, the operator must confirm all of the following in plain language:

```text
QA isolation confirmed: this ticket will not notify production users, customers, or a real support team.
```

If this cannot be confirmed, the trial must remain dry-run only.

## Files to review

Please review the sanitized checkpoint context above, any sanitized file excerpts provided, and the PR summary before answering. Do not ask for raw diffs, screenshots, recordings, transcripts, real ServiceNow pages, or other sensitive evidence.

Relevant repo files for the local agent/operator to inspect before or after this checkpoint:

```text
apps/desktop/src/App.tsx
apps/desktop/src/App.test.ts
packages/core/src/qa-single-ticket-smoke.ts
docs/field-trial/qa-single-ticket-manual-fill-runbook.md
docs/demo/field-trial-demo-flow-script.md
```

If you cannot access the private repo, answer only from the quoted context above and clearly say that repo access was unavailable.

## Decision requested

Before the operator performs any real QA Save or Submit, decide whether the current state is safe enough to proceed with the first controlled QA single-ticket field trial.

Please answer these questions:

1. Verdict: READY, READY WITH CONDITIONS, or NOT READY for one controlled QA manual-fill single-ticket field trial?
2. Is PR #63 safe to merge before the field trial, assuming local gates remain green?
3. Are the runbook conditions sufficient, or what exact additional pre-flight checks are required?
4. Should the first QA action be dry-run-only, Save only, or Submit only? Prefer dry-run-only or Save only unless QA isolation is unambiguous and all pre-flight checks pass.
5. Are Update and Close still blocked for the first trial?
6. Is the fake VPN scenario appropriate, or should a safer fake scenario be used?
7. Which fields must the operator verify manually before any write action?
8. What stop rules should be repeated out loud before the trial starts?
9. What sanitized outcome evidence should be recorded after the trial?
10. What should be deferred until after the first QA smoke?

## Required answer format

Please answer in this exact structure:

```markdown
Checkpoint token: SDA_PRE_QA_SINGLE_TICKET_CHECKPOINT_2026_05_21

Verdict: READY / READY WITH CONDITIONS / NOT READY

Repo access: available / unavailable / partial

Merge recommendation for PR #63:
- ...

First QA trial recommendation:
- Action allowed: Dry-run only / Save only / Submit only, with dry-run or Save-only preferred for first smoke
- Scenario: ...
- Manual-fill only: yes/no
- DOM autofill/API writes/bulk create: forbidden yes/no

Required pre-flight checks before the operator starts:
1. ...

Required field checklist:
1. ...

Runtime approval and QA isolation requirements:
1. ...

Stop rules:
1. ...

Sanitized outcome note format:
- ...

Deferred work:
- ...

Risks or blockers:
- ...
```

## Important nuance

QA is safer than production, but QA writes are still real writes. Do not recommend uncontrolled Save, Submit, Update, Resolve, Close, bulk actions, real data, production-shadow behavior, or external AI over real enterprise/customer/ticket content.
