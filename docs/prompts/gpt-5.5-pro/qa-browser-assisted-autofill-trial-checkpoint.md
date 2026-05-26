# GPT-5.5 Pro checkpoint: QA browser-assisted autofill trial

Issue: https://github.com/alanxiaofeifei/servicenow-automation/issues/83

Date: 2026-05-22

## Purpose

Review whether the project is ready to build and run the first QA-only browser-assisted autofill trial.

Alan wants to test whether automatic field filling is usable in QA as soon as possible. This checkpoint is intentionally narrow: it should approve or block the smallest safe implementation path for one QA ticket, without approving Save/Submit/Update/Close automation.

## Current sanitized project state

- QA Save-only manual rehearsal has already passed with sanitized outcome only.
- Dedicated/tool-owned Windows Chromium runtime/profile strategy has been validated for controlled field-trial work.
- The app has local/manual-fill assisted QA smoke readiness and mock ServiceNow-like preview.
- P1/P2 local alert preview exists and is now gated by monitored groups.
- No approved real browser DOM autofill path is merged yet.
- No production or production-shadow write path is approved.

## Decision requested

Return exactly one of:

- `READY`
- `READY WITH CONDITIONS`
- `NOT READY`

Then include:

1. Required conditions before implementation starts.
2. No-go boundaries.
3. First-test run sequence.
4. Exact user approval phrase recommendation.
5. Implementation risks and mitigations.
6. What must remain out of scope until a later checkpoint.

## Proposed smallest safe implementation

Build a QA/dev-only, single-ticket, human-supervised browser-assisted autofill slice:

1. Launch only a dedicated/tool-owned Chromium profile.
2. Alan manually logs in and navigates to the authorized QA Incident form.
3. The app prepares sanitized field mapping from deterministic/local draft data.
4. Before any field-fill action, the UI shows a review screen with field names and values.
5. The agent/browser automation may fill only approved text/select fields after Alan types the exact approval phrase.
6. The tool must stop before Save, Submit, Update, Close, attachment upload, customer email, notification, or any record-changing action beyond field entry.
7. Alan manually decides whether to Save in QA after a separate immediate approval step; that Save action is not part of the browser-assisted autofill implementation.

## Safety constraints

- QA/dev only, single ticket only.
- Dedicated/tool-owned Chromium profile only.
- Manual login only.
- No production or production-shadow writes.
- No auto-save, auto-submit, update, close, attachment upload, outbound email, or notification-triggering action.
- No background polling of real ServiceNow.
- No ServiceNow REST/API write path.
- No bulk create/fill.
- No credentials in source, prompts, logs, issue comments, or docs.
- No cookies, sessions, storage-state, screenshots, HAR, traces, or captured page HTML in Git or prompts.
- No raw QA URL, ticket number, sys_id, requester identity, customer/internal ticket text, or real field values in prompts/logs/issues/docs.
- Denied/blocked output must not echo target URLs with query/hash/userinfo.
- Any browser automation must fail closed if the profile is not dedicated/tool-owned.
- Any selector mismatch or unexpected required field must stop and ask Alan to review manually.

## Recommended exact approval phrase shape

GPT-5.5 Pro should propose the final phrase, but the phrase should bind:

- QA/dev mode,
- single ticket,
- autofill only,
- no Save/Submit/Update/Close,
- dedicated Chromium profile.

Candidate:

`PRIVATE_APPROVAL_PHRASE - NO SAVE SUBMIT UPDATE OR CLOSE`

## Questions for GPT-5.5 Pro

1. Is the proposed slice safe enough to implement now if all constraints are enforced?
2. Should Save remain completely manual for this first autofill usability test?
3. Which field types should be allowed in the first autofill slice: text only, text plus select, or text/select/reference with manual verification?
4. What explicit stop rules should prevent accidental writes or notifications?
5. What minimal tests should exist before Alan tries the QA autofill test?
6. What evidence should be recorded after the test without leaking sensitive QA details?

## Privacy boundary for this checkpoint

Do not paste raw workflow recordings/transcripts, screenshots, ServiceNow page HTML, QA URLs, credentials, cookies, sessions, storage-state, ticket identifiers, sys_id, internal/customer text, or exact real field values into GPT-5.5 Pro.

Use only this sanitized prompt and small sanitized summaries.
