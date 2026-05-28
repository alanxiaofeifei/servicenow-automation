# Production Shadow-Mode Go/No-Go Checklist

This checklist must be completed before Alan performs any small-scope production shadow-mode comparison.

Production shadow-mode is comparison-only. It is not a production rollout and it does not authorize any automated production write.

## Required verdict

Choose exactly one verdict before starting:

```text
GO: comparison-only shadow run may start
NO-GO: stop; do not open or inspect production records for this trial
```

If any required checkbox is not true, the verdict is `NO-GO`.

## Preconditions

- [ ] QA/dev Browser Rail startup has already passed in the packaged Windows client.
- [ ] QA/dev text-field autofill has already passed with no ServiceNow write actions.
- [ ] The current build has passed tests, typecheck, build, and privacy scan.
- [ ] The run uses a dedicated browser profile, not Alan's daily browser profile.
- [ ] Alan is manually present for the whole run.
- [ ] Alan is authorized to view the scenario being compared.
- [ ] No external AI provider is enabled for real production content.

## Allowed actions

During production shadow-mode, the tool may only:

- Display local/mock UI state.
- Generate or display a draft from manually sanitized input.
- Compare draft quality against Alan's human judgment.
- Use generic observations such as `draft useful`, `missing info`, or `unsafe suggestion`.
- Record sanitized notes in an ignored local path only.

## Not allowed actions

Production shadow-mode must not perform or prepare:

- Save.
- Submit.
- Update.
- Resolve.
- Close.
- Attachment upload.
- Email send.
- Bulk action.
- ServiceNow API write.
- Browser script that changes a production record.
- Production-shadow write or hidden side effect.
- Export of cookies, sessions, storage-state, HAR, traces, screenshots, recordings, or browser profiles.
- Sending real customer/internal text to external AI.

## No-real-data logging policy

Git-tracked files, PR comments, issue comments, external prompts, and public/demo artifacts must not contain:

- Raw ServiceNow hostnames or URLs.
- Ticket IDs or sys_id values.
- Requester, customer, assigned user, or assignment group names.
- No browser endpoints, page fingerprints, cookies, sessions, storage-state, HAR, traces, screenshots, or recordings.
- Local filesystem paths that identify Alan or a private repository location.
- Real field values copied from production records.

Allowed logging is limited to sanitized categories:

```text
scenario_type: VPN / Windows / Account-login / Other
result_quality: useful / needs-edit / unsafe / no-go
missing_info: generic bullets only
safety_concern: generic bullets only
follow_up_issue: generic product improvement only
```

## Stop criteria

Stop immediately and record only a sanitized `NO-GO` reason if:

- Any production write button or API write path becomes enabled or suggested.
- The app says or implies it can Save, Submit, Update, Resolve, or Close a production record.
- A page fingerprint is missing, stale, or changes after verification.
- A selector changes after verification.
- An unexpected required field appears.
- Stop if any real data appears in a tracked file, prompt, issue, PR, console paste, screenshot, trace, or recording.
- External AI would receive unredacted real content.
- Alan cannot supervise the full run manually.
- The dedicated browser profile is not clearly isolated from daily browsing.

## Go checklist

All lines must be true:

- [ ] Scope is one manually supervised comparison only.
- [ ] The input source has been manually sanitized before use.
- [ ] No automated production write path is enabled.
- [ ] Browser/profile isolation is clear.
- [ ] Logging destination is ignored/private.
- [ ] The planned output is a sanitized summary only.
- [ ] The run can be stopped safely at any time.

## Allowed sanitized outcome template

```markdown
# Production shadow-mode outcome

Verdict: GO / NO-GO / STOPPED

Scenario type:
- VPN / Windows / Account-login / Other

What was compared:
- Sanitized draft quality only

Result quality:
- useful / needs-edit / unsafe / no-go

Missing information:
- generic bullets only

Safety concerns:
- generic bullets only

Follow-up:
- generic product improvement only

No-write confirmation:
- No Save / Submit / Update / Resolve / Close
- No upload / email / bulk action
- No ServiceNow API write
- No production or production-shadow write
- No cookies / sessions / storage-state / HAR / traces / screenshots / recordings exported
```

## Final rule

If there is uncertainty, choose `NO-GO` and keep the trial in QA/dev or local mock mode.
