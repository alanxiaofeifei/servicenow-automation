# Field Trial Acceleration Plan

> **For Hermes:** Treat this as the controlling schedule until the first real-world shadow test is complete. Do not expand P0 scope unless the user explicitly overrides this plan.

**Goal:** Move from a June 5 demo-only deadline to an earlier field-trial-ready vertical slice, leaving roughly one week for Alan to test the tool in a small, controlled real environment before account access ends.

**Architecture:** Keep P0 deterministic and safe: Manual Paste → CapturedContext → MockAIProvider/rules → TicketDraft → KB match → editable review → mock ServiceNow form. Optional DeepSeek integration is P0.5 only and must be behind a redaction/sanitization gate.

**Tech Stack:** Electron, React, TypeScript, pnpm workspace, Zod, local KB Markdown, optional OpenAI-compatible DeepSeek provider later.

---

## Revised Deadline Logic

The original public milestone remains:

- **P0 Demo — 2026-06-05**

But the practical internal deadline is now earlier:

- **Field-trial-ready target:** 2026-05-29
- **Reason:** Alan may lose account access on 2026-06-05 and needs about one week to test in a small, controlled environment.

This means the project must stop optimizing for a polished demo first. The new order is:

1. Build the working vertical slice.
2. Run private shadow-mode tests.
3. Fix reliability and safety issues.
4. Polish demo and bilingual docs.

---

## Non-Negotiable Safety Boundary

Field testing must remain **shadow mode**:

- The app may draft fields and suggestions.
- The app may fill only the mock ServiceNow form unless a safe non-production page is explicitly available.
- The app must not auto-submit, auto-close, or modify production tickets.
- The app must not bypass access controls, VPN policies, ServiceNow permissions, or customer ITSM procedures.
- Real ServiceNow final actions remain Alan's manual responsibility.
- No cookies, browser profiles, HAR files, recordings, screenshots, or field-test notes containing real data may be committed.

---

## DeepSeek / External AI Boundary

DeepSeek can be useful for small-scale private testing, but it changes the risk profile because it sends text to an external API.

Default rule:

> **Do not send real customer or internal ticket content to DeepSeek unless the content has been sanitized and the company/customer policy allows that use.**

Implementation policy:

- P0 remains `MockAIProvider` for deterministic demo reliability.
- `DeepSeekProvider` is optional P0.5, not a blocker for #9–#13.
- Any external AI provider must be disabled by default.
- API keys must come from environment variables or 1Password, never from source code.
- A redaction/sanitization step must remove or mask:
  - names
  - emails
  - phone numbers
  - ticket numbers
  - hostnames/device names
  - URLs
  - asset tags
  - internal assignment groups
  - customer-specific KB text
  - screenshots or attachments
- The UI must clearly show when content is being sent to an external provider.

---

## Committable vs Private Artifacts

Committed:

- Fake demo scenarios
- Fake demo KB
- Runbook templates
- Security statements
- Redaction policy
- Tests using fake data

Never committed:

- Real ticket text
- Real KB exports
- Field test results with customer data
- Screenshots of ServiceNow/Teams/Outlook
- HAR files
- Cookies/browser sessions
- Audio/video/meeting transcripts
- DeepSeek API key or request logs

Ignored local folders are now reserved for private notes:

```text
private/
field-test-results/
field-test-notes/
```

---

## Accelerated Build Order

### Phase A — Working vertical slice

1. #9 `ManualPasteAdapter`
   - Paste text → `CapturedContext`
   - Add fixed demo scenario fixtures for VPN / Windows / account-login.

2. #10 `AIProvider` + `MockAIProvider`
   - `CapturedContext` → deterministic `TicketDraft`
   - Keyword routing for VPN / Windows / account-login.
   - Validate with `TicketDraftSchema`.

3. #11 Ticket Draft workspace UI
   - Editable short description, description, work notes, category/subcategory, assignment group.
   - Show KB matches, evidence, confidence, missing info, risk flags.

### Phase B — Field trial safety shell

4. #12 Mock ServiceNow form
   - Fill mock incident form from `TicketDraft`.
   - Submit button must remain manual/demo-only.

5. #13 Risk control banner
   - Visible on draft and mock form pages.
   - Must say: AI drafts only; human review required; no auto-submit/auto-close.

6. Field trial runbook
   - Shadow-mode checklist.
   - No-real-data logging policy.
   - What Alan can safely test before account access ends.

### Phase C — Optional controlled external AI

7. Optional P0.5 `DeepSeekProvider`
   - Only after #9–#13 are stable.
   - Must require explicit opt-in and redaction.
   - Must never block mock demo.

### Phase D — Presentation polish

8. #15 Bilingual demo docs
   - Short version first.
   - Demo script.
   - Security statement.
   - Public/private showcase boundary.

---

## Field Trial Protocol

For each real-world shadow test:

1. Use only issues Alan is authorized to access.
2. Paste only the minimum necessary visible text.
3. Prefer manual sanitization before using the tool.
4. Generate draft with MockAIProvider first.
5. Compare the draft against what Alan would manually write.
6. If using DeepSeek later, use sanitized text only.
7. Do not auto-submit anything.
8. Record observations in private local notes only, not Git.
9. Convert only generic lessons into committed issues/docs.

Suggested private note path:

```text
private/field-tests/YYYY-MM-DD-shadow-test.md
```

Template:

```markdown
# Shadow Test YYYY-MM-DD

## Scenario type
VPN / Windows / Account-login / Other

## Input source
Manual paste / sanitized summary only

## Provider
MockAIProvider / DeepSeekProvider with redaction

## Result quality
Good / needs edit / unusable

## Missing info detected
- ...

## Human changes needed
- ...

## Safety concerns
- ...

## Generic product improvement issue to create
- ...
```

Do not include real ticket text, real user names, real emails, ticket numbers, or screenshots.

---

## Go / No-Go Criteria for Field Trial

Go when:

- #9 Manual Paste works.
- #10 MockAIProvider generates valid TicketDrafts.
- #11 UI allows review/edit.
- #12 mock form fill works.
- #13 risk banner is visible.
- No real-data artifacts are written to Git-tracked paths.

No-go when:

- The app writes raw real ticket text into committed files.
- Any action can submit/close/update a real ticket automatically.
- DeepSeek sends unredacted real content.
- The demo requires a production ServiceNow page to succeed.
- The field trial depends on unstable network/API behavior.

---

## Next Review Checkpoint

Ask GPT-5.5 Pro again only after:

- #9 and #10 are closed.
- #11 is mostly usable.
- At least one full VPN scenario can run end-to-end in mock mode.

The next review should evaluate demo usability and field-trial safety, not introduce new product features.
