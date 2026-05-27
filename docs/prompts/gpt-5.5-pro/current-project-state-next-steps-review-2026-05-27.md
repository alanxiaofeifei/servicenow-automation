# ServiceNow Automation current project state review

Date: 2026-05-27
Target reviewer: GPT-5.5 Pro
Review surface: GitHub PR #105 and this sanitized summary

## Purpose

This prompt asks for a high-level safety, product, and next-step review of the current ServiceNow Automation project state. It is intentionally sanitized. Do not request raw ServiceNow URLs, ticket IDs, requester names, assignment groups, assigned users, browser endpoints, page fingerprints, cookies, sessions, HAR, traces, screenshots, recordings, local filesystem paths, credentials, or real field values.

## GitHub review target

Please review the private GitHub PR if accessible:

https://github.com/alanxiaofeifei/servicenow-automation/pull/105

Branch:

review/k9-browser-runtime-error-20260526

The PR is currently a Draft PR and should be treated as a review package, not as release approval.

## Safety boundary that must remain true

- No Save, Submit, Update, Resolve, Close, upload, email, bulk action, or ServiceNow API write is authorized by this PR.
- QA/dev browser autofill, when enabled, must remain manually supervised and fingerprint-bound.
- Missing or stale page fingerprints must block execution.
- Production writes remain disallowed.
- Live desktop/CLI operator paths that have not received a separate safety review must remain text-only or blocked.
- Full-field support in this PR is accepted only as a reviewed core/adapter runtime slice unless a later UI/CLI/operator slice explicitly exposes it.
- Tests and docs must use neutral/example values only; real QA defaults and sensitive ServiceNow data must not be committed.

## Project progress recovered from Hermes session history

The project has moved through these stages:

1. Demo-safe cockpit and local planning
   - Built a local, sanitized service-desk workflow cockpit with fake/demo data.
   - Added safety copy and dry-run/manual-copy patterns to avoid accidental real writes.
   - Clarified that the in-app mock Incident preview is not the real ServiceNow browser.

2. Operator-first pivot
   - The project direction shifted from demo-first UI to a practical Windows desktop operator tool.
   - Desired operator flow: start a dedicated/tool-owned QA browser, let the operator manually log in and open a QA/dev Incident form, verify the current form, then run a narrowly scoped no-save autofill.
   - The app must not reuse the operator's daily Chrome/Edge profile.

3. Text-only no-save field trial
   - A supervised text-only autofill stage was completed for only three fields: Short description, Description, and Work notes.
   - The recorded result was autofill-only: fields became populated in the browser form state, but no Save/Submit/Update/Resolve/Close or ServiceNow API write occurred.
   - This milestone did not authorize reference/select/status/routing fields or any real write action.

4. K9 browser runtime error recovery
   - The Windows desktop operator flow later showed a generic blocked result during current-page verification.
   - The recovery work added more specific blocked-reason handling for browser connection failures and page-selection failures, plus Windows/WSL CDP helper improvements.
   - Existing review notes indicate likely pitfalls around preserving blocked reasons across Electron bundles, helper spawn failures, timeout/non-JSON outputs, and WebSocket response-id matching.

5. Full-field runtime slice
   - A separate reviewed slice was started for all required/starred QA Incident defaults.
   - The agreed boundary: implement core planning and adapter runtime support first; do not silently expose full-field autofill to live desktop/CLI operator paths.
   - Channel must not be guessed. Missing/manual-confirm defaults must be excluded or fail closed.
   - Route-out behavior must set State to New before changing Assignment group and must leave Assigned to blank unless separately reviewed.

6. Current PR preparation and privacy cleanup
   - The current branch packages the full-field core/adapter slice, desktop/CLI safety locks, Windows operator/runtime support, design docs, and handoff docs.
   - Additional cleanup commits sanitized local fixture metadata, internal workflow labels, local filesystem examples, and local browser path examples.
   - Local review artifacts under ignored local directories are not intended for commit.

## CodeGraph orientation from the current tree

Relevant components to inspect first:

- `packages/core/src/qa-incident-defaults.ts`
  - Full-field runtime plan construction.
  - Excluded/manual-confirm fields.
  - Route-out ordering and stop rules.

- `packages/core/src/qa-incident-defaults.test.ts`
  - Core TDD coverage for initial-create and route-out field plans.

- `packages/adapters/src/qa-autofill-runtime.ts`
  - CDP runtime preflight, page target selection, current-page inspection, fill sink, fingerprint re-checks, and field-control support.
  - Important functions/symbols surfaced by CodeGraph include `incidentDefaultFieldFillScript`, `runtimePreflightBlockedReason`, `incidentFieldRuntimePreflightBlockedReason`, and `QA_INCIDENT_DEFAULT_RUNTIME_SUPPORTED_FIELD_KEYS`.

- `packages/adapters/src/qa-autofill-runtime.test.ts`
  - Adapter coverage for reference/select/text/textarea controls, stale fingerprints, host denial, duplicate controls, non-writable controls, and raw-reference blocking.

- `apps/desktop/electron/main.ts`
  - Desktop IPC path and current live operator plan selection.

- `apps/cli/src/cli.ts`
  - CLI default-plan, read-only verification, and runtime command boundaries.

- `apps/desktop/src/App.tsx` and `apps/desktop/src/App.test.ts`
  - Operator UI state, action-card feedback, approval/fingerprint handling, and no-write copy.

- `scripts/windows/*.ps1`, `scripts/wsl/*.sh`, `scripts/local-cdp-bridge.py`
  - Windows/WSL dedicated browser/runtime helper layer.

## Current local verification before this prompt was added

At local branch head immediately before this prompt file, these gates passed:

- `git diff --check`
- `pnpm typecheck`
- `pnpm build`
- `pnpm test`
- `pnpm privacy:scan`

A deterministic strict privacy scan over the final tracked tree and the merge-base PR diff reported no hits for the categories that previously blocked the PR surface: user-specific local home paths, personal Windows repo paths, personal drive document paths, local cloud-drive labels, local notebook labels, and internal review labels.

Independent code/safety review of `origin/main...HEAD` returned PASS with no blockers. It noted one non-blocking wording issue: safety language should consistently include Resolve alongside Save/Submit/Update/Resolve/Close.

## Known open risks / review questions

Please focus on these questions:

1. PR scope risk
   - PR #105 is large and includes full-field runtime, Windows operator/runtime work, UI/design docs, and handoff docs. Should it be split before merge, or is a Draft PR review package acceptable while final merge is deferred?

2. Live exposure risk
   - Confirm whether live desktop/CLI operator paths remain text-only or blocked, despite core/adapter full-field support existing.
   - If any live UI/CLI path can invoke full-field reference/select/status/routing autofill, treat that as a blocker unless a separate safety review is present.

3. Full-field runtime safety
   - Confirm reference fields target only visible display controls and do not fill raw identity/reference fields.
   - Confirm select fields fail closed when options are missing.
   - Confirm all execution paths re-inspect current page fingerprint before filling.
   - Confirm no Save/Submit/Update/Resolve/Close, upload, email, or ServiceNow API write path is present.

4. Route-out and default-value policy
   - Confirm Channel is not guessed.
   - Confirm route-out ordering is State=New first, then Assignment group, then Assigned to blank, then Work notes.
   - Confirm Impact/Urgency are not accidentally included unless separately reviewed.

5. Privacy and PR surface
   - Review final tree and PR diff, including deleted hunks, for any sensitive content category.
   - If any sensitive content is present in deleted diff hunks, final-tree cleanup alone is not sufficient.

6. Next-step execution plan
   - Recommend the safest next development slice after PR #105 review.
   - Prefer a plan that separates: merge/rebase hygiene, desktop/CLI exposure review, Windows manual acceptance, packaging, and any future full-field live trial.

## Requested GPT-5.5 Pro output format

Please answer in this exact structure:

1. Verdict
   - One of: PASS FOR DRAFT REVIEW, NEEDS SPLIT BEFORE MERGE, BLOCKED, or INSUFFICIENT INFORMATION.

2. Top blockers
   - Bullet list. If none, say `None found from accessible evidence`.

3. Safety review
   - No-write boundary.
   - Fingerprint/stale-page boundary.
   - Full-field core/adapter boundary.
   - Desktop/CLI live exposure boundary.

4. Privacy review
   - Final tree concerns.
   - PR-diff/deleted-hunk concerns.
   - Prompt/docs concerns.

5. Recommended next steps
   - Ordered, minimal steps.
   - Say which steps require human/operator manual action.
   - Say which steps can be handled by an agent with no live ServiceNow access.

6. Specific files to inspect next
   - Short prioritized list with why each file matters.

7. Do-not-do list
   - Actions that must remain forbidden until a separate review gate.

Keep the answer focused on planning and review. Do not propose connecting to live ServiceNow, logging in, clicking Save/Submit/Update/Resolve/Close, capturing screenshots/HAR/traces/cookies/sessions, or using real ticket/customer data.
