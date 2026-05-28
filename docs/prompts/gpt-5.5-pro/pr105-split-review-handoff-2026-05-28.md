# PR #105 split-review handoff

Date: 2026-05-28
Scope: sanitized handoff for future ServiceNow Automation agents and reviewers

## Decision

PR #105 remains a Draft review package. It is not a merge-ready PR and should not be merged as one large change.

Use PR #105 only as a review surface for the historical full-field, runtime, Windows operator, docs, and safety work. Future implementation must continue through small, reviewable split PRs.

## Safety boundary inherited by every follow-up

No follow-up from PR #105 authorizes any of these actions:

- live ServiceNow operation
- browser login unless a separate checkpoint explicitly approves it
- Save, Submit, Update, Resolve, or Close
- upload, email, or bulk action
- ServiceNow API write
- production write
- production-shadow write
- raw ServiceNow URL, ticket ID, sys_id, browser endpoint, page fingerprint, credential, session, HAR, trace, screenshot, recording, local personal path, requester, assignment group, assigned user, or real field value in code, tests, docs, comments, prompts, or external-AI packets

If any split task needs a stronger capability, stop and request a separate safety checkpoint before implementation.

## Profile-review outcome

### Desktop / CLI exposure

Outcome: live desktop and CLI operator paths must remain text-only or blocked.

Full-field live exposure is not authorized. Core or adapter support for additional field types does not grant UI, CLI, or operator permission to execute those fields against a live page.

Any future UI/CLI change that can trigger full-field live autofill must receive its own Desktop/CLI exposure review first. The acceptable reviewer verdicts remain only:

- live paths text-only
- live paths blocked
- blocker: full-field exposed

### Core runtime

Outcome: Core Runtime Review passed for the bounded planning slice.

Future core work must preserve these policies:

- Channel is not guessed.
- Manual-confirm or excluded fields remain excluded or fail closed.
- Route-out ordering stays explicit: State = New first, then Assignment group, then Assigned to blank, then Work notes.
- Impact and Urgency are not silently added unless a separate reviewed policy allows them.
- Stop/no-write rules include Resolve alongside Save, Submit, Update, and Close.

### Adapter runtime

Outcome: Adapter Runtime Review identified follow-up work, tracked outside PR #105.

Bounded route:

- #127 covers atomic default-field autofill and Resolve-inclusive no-write wording.
- The already-landed adapter behavior should be treated as the implementation baseline.
- PR #130 is a tiny test-only hardening follow-up for the #127 atomicity regression.

Future adapter work must continue to require:

- reference fields use visible display controls only
- raw identity-shaped reference values remain blocked
- select fields fail closed when the required option is absent
- page fingerprint is rechecked immediately before fill
- missing or stale fingerprints block execution
- no Save, Submit, Update, Resolve, Close, upload, email, bulk action, ServiceNow API write, production write, or production-shadow write
- no screenshots, HAR, traces, recordings, cookies, sessions, or storage-state artifacts

### Windows runtime / packaging

Outcome: Windows Runtime / Packaging Review required a separate packaging slice before any packaged Windows artifact claim.

Bounded route:

- #128 covers the Windows packaging artifact and runtime-path blocker.
- PR #131 is the packaging follow-up and has passed Alan's fixed-artifact Windows launch acceptance for the packaging slice.
- Until PR #131 is merged, do not claim the packaging changes are in main.

Future Windows work must keep:

- packaged runtime resources resolved through the packaged resource root
- helper scripts included as explicit packaged resources
- local CDP bridge restricted to loopback or approved local gateway behavior
- daily Chrome or Edge profiles out of the product runtime
- browser acceptance limited to mock/demo or about:blank unless a separate checkpoint approves more

### Privacy / diff audit

Outcome: the historical deleted-hunk/privacy decision remains separate from final-tree cleanliness.

Do not use PR #105 as a merge PR just because the final tree appears clean. Deleted hunks and historical review surface matter for this oversized package.

Use #111 as the historical deleted-hunk/privacy decision reference. Future split PRs must run privacy checks over both final tracked content and the split PR diff, and they must publish only sanitized summaries.

### Docs / handoff

Outcome: docs and prompts should route future work into the split issues and small PRs, not back into PR #105.

When docs list no-write actions, include Resolve wherever Save, Submit, Update, and Close are listed.

## Current split route

Use this route instead of expanding PR #105:

1. Keep PR #105 as Draft review package only.
2. Use #127 / PR #130 for adapter atomicity and no-write wording coverage.
3. Use #128 / PR #131 for Windows packaged artifact and runtime-path work.
4. Use this #129 docs slice for sanitized handoff and future-agent routing.
5. Create any remaining core, adapter, Desktop/CLI, Windows, privacy, or docs follow-up as its own small PR from current main.

## Required future-agent behavior

Future agents must:

- start from current GitHub issue and PR state, not from an old compacted task list
- create fresh worktrees from `origin/main` for clean split PRs
- inspect only the files allowed by the task packet unless a prerequisite requires a small documented lookup
- run targeted tests and `pnpm privacy:scan` before PR submission when code or docs change
- keep PRs Draft unless Alan explicitly asks to mark them ready
- stop before merge unless Alan explicitly authorizes merge

## Do-not-do list

Do not:

- merge PR #105 as-is
- expose full-field live autofill through desktop or CLI without a separate exposure checkpoint
- run live ServiceNow
- perform browser login
- click or automate Save, Submit, Update, Resolve, or Close
- upload attachments
- send email
- run bulk actions
- perform ServiceNow API writes
- run production or production-shadow writes
- use real ticket, customer, requester, assigned-user, assignment-group, URL, endpoint, fingerprint, credential, session, HAR, trace, screenshot, recording, local personal path, or real field value in docs, prompts, tests, comments, or external-AI packets
