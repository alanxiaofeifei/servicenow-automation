# P2 Shadow / Provider / Cockpit Validation Plan

> **For Hermes:** Use service-desk-automation-safety before execution. Do not execute production shadow, external AI on real content, browser DOM fill, or real ServiceNow writes from this plan without a later GPT-5.5 Pro checkpoint and explicit user approval.

**Goal:** Define the next-stage design and verification checklist for Production Shadow, external AI provider configuration, and Service Desk Cockpit expansion after the current local XLSX dry-run and environment URL settings slice.

**Architecture:** Keep P2 as design-first and fail-closed. Production Shadow is read-only comparison. External providers are disabled by default and require redaction preview. Cockpit expansion remains fake/sanitized until QA field-trial evidence proves the workflow is safe and useful.

**Tech Stack:** Electron + React + TypeScript, pnpm workspace, Vitest, deterministic local mock data, local-only provider configuration, strict environment profiles, documentation/runbooks under `docs/`.

---

## Non-negotiable P2 boundaries

Do not implement or run these until a separate checkpoint approves them:

- production Save / Submit / Update / Resolve / Close;
- ServiceNow API writes;
- browser DOM autofill;
- bulk ticket creation/update/close;
- production data export;
- screenshots/HAR/traces/storage-state/cookies/session capture;
- external AI calls using raw enterprise/ticket/chat/email content;
- Microsoft Graph / Excel Online writes;
- remote desktop automation.

QA/dev is safer than production but still a real write surface. QA write actions remain single-ticket, fake/sanitized, manual-fill assisted, and action-specific approval gated.

---

## Track A — Production Shadow design

**Objective:** Compare cockpit suggestions against the operator's normal production handling without modifying production.

**Files to update later:**

- `packages/profiles/src/service-now-environments.ts`
- `packages/profiles/src/service-now-environments.test.ts`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/App.test.ts`
- `docs/field-trial/shadow-mode-runbook.md`

**Required design rules:**

1. Production Shadow must keep:
   - `shadowOnly = true`
   - `allowsRealSubmit = false`
   - Save / Submit / Update / Resolve / Close denied
   - no DOM autofill
   - no ServiceNow API write
2. UI copy must say:
   - `Production Shadow compares drafts only. It cannot write to production.`
3. Shadow comparison should use manual/sanitized summary input first.
4. Output should be a local comparison checklist, not a production action log.
5. Private notes must stay in ignored local paths and must not include raw ticket text.

**Acceptance checks:**

- Production Shadow card never shows a write-enabled state.
- Custom Production Shadow URL does not change write gates.
- Approval phrases cannot unlock production writes.
- Tests cover Save / Submit / Update / Resolve / Close denial under Production Shadow.

---

## Track B — External AI provider configuration design

**Objective:** Add a future provider layer without making raw enterprise content leave the local machine by default.

**Files to update later:**

- `packages/ai/src/*`
- `packages/core/src/*` if provider-neutral interfaces are needed
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/App.test.ts`
- `docs/field-trial/shadow-mode-runbook.md`
- `docs/prompts/gpt-5.5-pro/*checkpoint*.md`

**Required design rules:**

1. Provider is disabled by default.
2. `MockAIProvider` remains the default for field trials.
3. Every non-mock provider requires:
   - provider type;
   - base URL / endpoint validation;
   - key storage outside repo;
   - redaction preview;
   - explicit opt-in per send;
   - local sanitized payload preview;
   - no raw ticket/customer/chat/email content.
4. External provider response must be treated as a suggestion, not an action.
5. Provider errors must not echo secrets, headers, full URLs, raw payloads, or tickets.

**Acceptance checks:**

- Tests verify default provider is mock/disabled.
- Tests verify redaction removes or masks names, emails, phone numbers, ticket IDs, URLs, asset IDs, internal groups, credentials, and token/session/sys_id-like markers.
- Tests verify no provider call can be made without explicit sanitized-payload approval.
- UI warns that external AI is optional and off by default.

---

## Track C — Service Desk Cockpit expansion

**Objective:** Expand the cockpit around real workflow patterns while staying fake/sanitized and readable.

**Candidate slices:**

1. Recording-derived fake scenarios:
   - chat intake to Incident routing;
   - shared mailbox with attachment evidence;
   - phone call intake with confirmation state;
   - self-service ticket requiring Service Desk normalization;
   - remote support / troubleshooting checklist.
2. Evidence review state:
   - screenshot / document / table / none;
   - reviewed / not reviewed / needs manual check;
   - no upload, OCR, or external AI.
3. Remote support checklist:
   - identity/device/app confirmation;
   - impact/urgency check;
   - app launch/login/version check;
   - result captured in Work Notes plan;
   - no remote desktop control.
4. Reporting enhancements:
   - QA Trial Result;
   - Evidence Review State;
   - Confirmation State;
   - local XLSX/CSV/Markdown only.

**Acceptance checks:**

- All scenarios are visibly fake/sanitized.
- Optional panels are default-collapsed if UI gets crowded.
- Warm/light theme remains default.
- CJK titles use `word-break: keep-all` and `text-wrap: balance` where needed.
- Mock Incident Preview stays clearly separate from a real QA browser.

---

## Track D — QA field-trial verification checklist

Before any QA ticket write, require:

```text
GPT-5.5 Pro checkpoint returns READY or READY WITH CONDITIONS
+ QA environment identity confirmed
+ fake/sanitized scenario selected
+ one ticket only
+ manual-fill assisted
+ no browser DOM autofill
+ no ServiceNow API write
+ no bulk create
+ action-specific approval phrase shown and typed immediately before action
+ stop rules visible
+ sanitized outcome note only
```

Stop if:

- target environment is unclear;
- profile/browser isolation is unclear;
- URL contains credentials, query/hash, token/session/sys_id-like payload, or non-ServiceNow host;
- app attempts DOM autofill or API write;
- real customer data appears;
- screenshot/trace/storage-state/session capture would be stored;
- approval phrase does not match exact action;
- production shadow attempts any real write.

---

## Suggested execution order after current P1 slice

1. Finish sanitized GPT-5.5 Pro top-level input and ask for verdict.
2. If verdict is READY WITH CONDITIONS, update QA runbook with those conditions.
3. Implement only one small cockpit expansion slice at a time.
4. Re-run local verification after each slice.
5. Do a privacy/safety diff scan before commit.
6. Perform one manual-fill QA single-ticket trial only after explicit approval.
7. Convert trial findings into bug fixes, not broad new scope.
8. Keep Production Shadow and external providers design-only until after QA evidence is clean.

---

## Verification commands for code slices

Run changed-package checks first:

```bash
pnpm --filter @servicenow-automation/core test
pnpm --filter @servicenow-automation/profiles test
pnpm --filter @servicenow-automation/desktop test
pnpm --filter @servicenow-automation/desktop build
pnpm typecheck
```

Before commit / PR, run the full gate when time allows:

```bash
pnpm test
pnpm build
pnpm typecheck
```

Privacy scan checklist:

- no real ServiceNow hosts;
- no real ticket IDs;
- no emails/phone numbers;
- no credentials/tokens/API keys;
- no cookies/sessions/storage-state;
- no screenshots/traces/HAR/recordings;
- no raw transcript excerpts;
- no raw external AI payloads.

---

## GPT-5.5 Pro questions for P2

Ask GPT-5.5 Pro after the top-level evidence prompt:

1. What is the safest Production Shadow data model that proves usefulness without capturing real ticket data?
2. Should external provider work wait until after the first QA trial, or can a mock-only provider settings UI be built now?
3. What cockpit expansion slice has the highest value before 2026-05-29: evidence review, remote checklist, more scenarios, or demo guide?
4. What should be measured in the first QA manual-fill trial?
5. Which P2 items should remain design-only until after 2026-06-05?
