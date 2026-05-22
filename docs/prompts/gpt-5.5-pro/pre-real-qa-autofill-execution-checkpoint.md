# GPT-5.5 Pro checkpoint: pre-real QA text-field autofill execution

Issue: #90
Date: 2026-05-23
Unique checkpoint token: `SDA_PRE_REAL_QA_AUTOFILL_EXECUTION_CHECKPOINT_2026_05_23`

## How to use this prompt

Paste only this checkpoint prompt and any small already-reviewed sanitized excerpts into GPT-5.5 Pro. Do not paste raw repository diffs, patch output, workflow recordings, transcripts, screenshots, HAR files, traces, storage-state, cookies, sessions, credentials, real ServiceNow pages, real ticket text, real URLs, raw QA/dev hostnames, ticket identifiers, sys_id values, customer/user text, or unreviewed enterprise content.

If GPT-5.5 Pro asks for sensitive evidence, refuse and continue with sanitized summaries only.

Ask GPT-5.5 Pro to quote the unique checkpoint token before its verdict so the answer is tied to this exact prompt.

## Purpose

Review whether the project is ready to move from the merged local selector-verified fixture harness to the first real QA/dev browser text-field autofill-only execution.

This checkpoint is a new safety boundary. It must not approve Save, Submit, Update, Close, attachment upload, notifications, ServiceNow API writes, production, production-shadow, bulk fill, or any external AI use on real QA/ServiceNow content.

## Current sanitized project state

- The first QA browser-assisted autofill checkpoint returned `READY WITH CONDITIONS` for a narrow implementation path.
- A planning/review gate is merged: it can build a QA/dev single-ticket text-field autofill plan, but normal CLI/UI planning surfaces remain blocked without selector verification.
- A local fixture harness is merged: it validates fake/sanitized selector verification and local field assignment metadata without launching a browser, navigating to ServiceNow, or producing runnable browser snippets.
- The tracked-file privacy scan is available and scans only git-tracked files so ignored browser profile/cache data is not printed.
- No real browser autofill execution adapter has been approved for unattended use.
- No real QA/dev browser autofill trial has been run by the unattended agent.
- No production or production-shadow write path is approved.

Latest local verification is time-bound and must be re-run immediately before any real QA/dev trial:

- `pnpm build` should pass.
- `pnpm typecheck` should pass.
- `pnpm test` should pass.
- `pnpm privacy:scan` should pass.
- Local fixture smoke should pass before any real-browser step.

## Decision requested

Return exactly one of:

- `READY`
- `READY WITH CONDITIONS`
- `NOT READY`

Question: under the constraints below, is it safe to implement and/or run the first real QA/dev single-ticket text-field autofill-only execution after the local fixture harness?

If your verdict is `READY WITH CONDITIONS`, list every condition that must be satisfied before the tester starts the real QA/dev browser step.

If your verdict is `NOT READY`, list the smallest local/no-write work that should happen next.

## Proposed first real-browser boundary

Allowed only if the checkpoint verdict and local gates pass:

1. QA/dev only; never production or production-shadow.
2. Single ticket only; no bulk or batch mode.
3. Dedicated/tool-owned Chromium profile only.
4. Manual login only.
5. The human tester manually navigates to the authorized QA/dev Incident form.
6. The tool performs runtime selector verification immediately before any fill.
7. Fill only these allowlisted text fields:
   - Short description
   - Description
   - Work notes
8. The tool stops immediately after text-field autofill.
9. The tester manually reviews the page.
10. Any later Save action requires a separate checkpoint and separate immediate Save-only approval phrase.

## Required confirmations and approval phrase shape

Before any autofill-only action, require all of the following:

- QA/dev environment identity is clear.
- QA isolation is confirmed in plain language: the test will not notify production users, customers, or a real support team.
- Dedicated/tool-owned Chromium profile is confirmed in plain language.
- Runtime selector verification finds exactly one writable expected control for each allowed field.
- No unexpected required field appears.
- The reviewed field screen is current and has not reloaded or changed.

Recommended QA approval phrase:

`I APPROVE QA SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED`

Recommended dev approval phrase:

`I APPROVE DEV SINGLE-TICKET AUTOFILL ONLY - NO SAVE SUBMIT UPDATE OR CLOSE - DEDICATED CHROMIUM PROFILE CONFIRMED`

These phrases approve only autofill. They do not approve Save, Submit, Update, Close, attachment upload, notification-triggering actions, ServiceNow API writes, or bulk actions.

## Stop rules

Fail closed if any of these occur:

- The target is not QA/dev.
- The tester cannot confirm QA isolation.
- The dedicated/tool-owned profile boundary is uncertain.
- The page is not the expected Incident form.
- Any selector is missing, ambiguous, duplicated, non-writable, or has the wrong element type.
- Any unexpected required field appears.
- Any non-text/reference/select/status/routing field would be changed.
- Any action would click a button, Save, Submit, Update, Close, upload an attachment, send email, notify users, call ServiceNow REST/API, or perform bulk fill.
- Any output would expose raw QA/dev URL, ticket identifier, sys_id, requester/customer/internal text, exact real field values, cookies, sessions, storage-state, page HTML, screenshots, HAR, traces, or recordings.
- The page changes or reloads after approval but before autofill.

## Required tests/evidence before a real QA/dev autofill trial

Evaluate whether these are sufficient, and add any missing conditions:

- Core tests for ready path and fail-closed denial paths.
- CLI tests proving JSON output is sanitized and does not echo approval phrases, raw URLs, real field values, browser snippets, cookies, sessions, page HTML, screenshots, HAR, or traces.
- Fixture smokes for happy path, missing selector, ambiguous selector, wrong element type, non-writable control, and unexpected required field.
- Full local gates: build, typecheck, test, tracked-file privacy scan.
- Independent review of the staged or PR diff.
- A human tester present for any real browser/login/QA step.

## Evidence allowed after the first real QA/dev autofill-only trial

Record only:

- Whether autofill completed, blocked, or stopped.
- Which generic field classes worked or failed.
- Whether the tool stopped before Save/Submit/Update/Close.
- Generic stop reason if applicable.
- Confirmation that no screenshots, HAR, traces, cookies, sessions, storage-state, page HTML, raw QA/dev URLs, ticket identifiers, or real field values were captured.

Do not record raw QA/dev page content, exact field values, page title, ticket number, sys_id, requester/customer/internal text, screenshots, traces, HAR, cookies, sessions, storage-state, or recordings.

## Output format required from GPT-5.5 Pro

1. Quote the checkpoint token.
2. Verdict: `READY`, `READY WITH CONDITIONS`, or `NOT READY`.
3. Conditions before any real QA/dev browser autofill execution.
4. No-go boundaries that remain forbidden.
5. Exact first-test run sequence.
6. Required approval phrase(s), or confirmation that the proposed phrases are adequate.
7. Missing tests/docs/review steps, if any.
8. Short rationale focused on preventing accidental writes, notifications, privacy leakage, and production/prod-shadow exposure.
